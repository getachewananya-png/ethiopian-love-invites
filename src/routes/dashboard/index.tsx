import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BarChart3, Calendar, Copy, Eye, Heart, LoaderCircle, LogOut, Mail, Plus, Send, Target, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { getDashboard, type DashboardData } from "@/lib/dashboard.functions";
import { signOut, useAuth } from "@/lib/auth";
import { formatWeddingDate, templateMeta, type TemplateId } from "@/lib/invitation";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [
    { title: "Dashboard — Tizita" },
    { name: "description", content: "Track how many invitation links you sent, how many guests opened them, and who has replied." },
    { name: "robots", content: "noindex" },
  ] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      void navigate({ to: "/login", search: { redirect: "/dashboard" } });
      return;
    }
    let active = true;
    setBusy(true);
    getDashboard({ data: {} })
      .then((result) => { if (active) setData(result); })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load your dashboard.");
      })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [user, loading, navigate]);

  if (loading || busy) {
    return <main className="dashboard-page"><div className="dash-loading"><LoaderCircle className="spin"/><span>Loading your dashboard…</span></div></main>;
  }

  return (
    <main className="dashboard-page">
      <header className="dash-header">
        <Link to="/" className="dash-brand"><span>ትዝታ</span><strong>TIZITA</strong></Link>
        <div className="dash-header-actions">
          <Button asChild variant="outline"><Link to="/create/$templateId" params={{ templateId: "royal-tewahedo" }}><Plus/>New invitation</Link></Button>
          <Button variant="ghost" onClick={() => { void signOut().then(() => navigate({ to: "/" })); }}><LogOut/>Sign out</Button>
        </div>
      </header>
      <div className="dash-intro">
        <p>YOUR WEDDING INVITATIONS</p>
        <h1>{data?.invitations[0] ? `${data.invitations[0].brideName} & ${data.invitations[0].groomName}` : "Welcome to Tizita"}</h1>
        <span>{user?.email}</span>
      </div>

      {error && <div className="dash-error"><p>{error}</p><span>Check that the required environment variables are set, then reload.</span></div>}

      {data && data.invitations.length === 0 && !error && (
        <section className="dash-empty">
          <Heart/>
          <h2>No invitations yet</h2>
          <p>Create your first invitation to start tracking links, opens, and RSVP replies.</p>
          <Button asChild size="lg"><Link to="/create/$templateId" params={{ templateId: "royal-tewahedo" }}>Create your invitation</Link></Button>
        </section>
      )}

      {data && data.invitations.length > 0 && <DashboardBody data={data}/>}
    </main>
  );

function DashboardBody({ data }: { data: DashboardData }) {
  return <>
    <section className="kpi-grid">
      <Kpi icon={Send} label="Links sent" value={data.totals.linksSent} hint={`${data.totals.guests} guests invited`}/>
      <Kpi icon={Eye} label="Invitation opens" value={data.totals.totalViews} hint="Total page opens"/>
      <Kpi icon={Mail} label="RSVPs received" value={data.totals.rsvpsReceived} hint={`${data.totals.awaitingReply} still awaiting reply`}/>
      <Kpi icon={Users} label="Guests attending" value={data.totals.attending} hint={`Target ${data.totals.targetGuests}`}/>
    </section>

    <section className="dash-charts">
      <div className="chart-card">
        <div className="chart-head"><BarChart3/><div><h3>Last 14 days</h3><span>Opens and RSVP replies</span></div></div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data.trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 265)"/>
            <XAxis dataKey="date" tickFormatter={(value: string) => value.slice(5)} fontSize={11} stroke="oklch(0.55 0.03 265)"/>
            <YAxis allowDecimals={false} fontSize={11} stroke="oklch(0.55 0.03 265)"/>
            <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid oklch(0.9 0.01 265)" }}/>
            <Legend/>
            <Bar dataKey="views" name="Opens" fill="oklch(0.55 0.16 45)" radius={[4, 4, 0, 0]}/>
            <Bar dataKey="rsvps" name="RSVPs" fill="oklch(0.62 0.15 20)" radius={[4, 4, 0, 0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-card">
        <div className="chart-head"><Target/><div><h3>Response breakdown</h3><span>Replies against links sent</span></div></div>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={responseBreakdown(data)} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3}>
              {responseBreakdown(data).map((entry) => <Cell key={entry.name} fill={entry.color}/>)}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid oklch(0.9 0.01 265)" }}/>
            <Legend/>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>

    <section className="dash-invitations">
      <div className="dash-section-head"><h2>Your invitations</h2><span>{data.invitations.length} total</span></div>
      <div className="invitation-cards">
        {data.invitations.map((invitation) => (
          <article className="invitation-card" key={invitation.id}>
            <div className="invitation-card-top">
              <div>
                <p>{templateMeta[invitation.templateId as TemplateId]?.name ?? invitation.templateId}</p>
                <h3>{invitation.brideName} &amp; {invitation.groomName}</h3>
                <span className="invite-date"><Calendar/>{formatWeddingDate(invitation.weddingDate)}</span>
              </div>
              <div className="invitation-badges">
                {invitation.isPaid && <em className="badge paid">Paid</em>}
                <em className={invitation.isPublished ? "badge live" : "badge draft"}>{invitation.isPublished ? "Live" : "Draft"}</em>
              </div>
            </div>
            <div className="invitation-metrics">
              <Metric label="Links sent" value={invitation.linksSent} of={invitation.guests}/>
              <Metric label="Opens" value={invitation.viewCount}/>
              <Metric label="RSVPs" value={invitation.rsvpsReceived}/>
              <Metric label="Attending" value={invitation.attending} of={invitation.targetGuestCount}/>
            </div>
            <div className="progress-track" title={`${invitation.attending} of ${invitation.targetGuestCount} target guests`}>
              <div className="progress-fill" style={{ width: `${progressWidth(invitation.attending, invitation.targetGuestCount)}%` }}/>
            </div>
            <div className="invitation-card-actions">
              <Button variant="outline" size="sm" onClick={() => { void navigator.clipboard.writeText(invitation.shareUrl).then(() => toast.success("Invitation link copied")); }}><Copy/>Copy link</Button>
              <Button asChild variant="outline" size="sm"><Link to="/dashboard/invitations/$invitationId" params={{ invitationId: invitation.id }}>Guests &amp; analytics</Link></Button>
              <Button asChild size="sm"><Link to="/invite/$slug" params={{ slug: invitation.slug }} search={{ token: undefined }}>Open</Link></Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  </>;
}

function progressWidth(value: number, target: number) {
  if (!target) return 0;
  return Math.min(100, Math.round((value / target) * 100));
}

function responseBreakdown(data: DashboardData) {
  const awaiting = Math.max(0, data.totals.linksSent - data.totals.rsvpsReceived);
  return [
    { name: "Attending", value: data.totals.attending, color: "oklch(0.62 0.15 145)" },
    { name: "Declined", value: data.totals.declined, color: "oklch(0.62 0.18 20)" },
    { name: "Awaiting", value: awaiting, color: "oklch(0.85 0.03 85)" },
  ].filter((entry) => entry.value > 0);
}

function Kpi({ icon: Icon, label, value, hint }: { icon: typeof Send; label: string; value: number; hint: string }) {
  return <article className="kpi-card"><div className="kpi-icon"><Icon/></div><div><span>{label}</span><strong>{value}</strong><em>{hint}</em></div></article>;
}

function Metric({ label, value, of }: { label: string; value: number; of?: number }) {
  return <div className="metric"><span>{label}</span><strong>{value}{typeof of === "number" && <small> / {of}</small>}</strong></div>;
}

}
