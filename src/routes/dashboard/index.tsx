import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Calendar, Copy, Eye, Heart, LoaderCircle, LogOut, Mail, Plus, Send, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getDashboard, type DashboardData } from "@/lib/dashboard.functions";
import { signOut, useAuth } from "@/lib/auth";
import { formatWeddingDate, templateMeta, type TemplateId } from "@/lib/invitation";
import { isUserAdmin } from "@/lib/admin";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Tizita" },
      {
        name: "description",
        content: "Track how many invitation links you sent, how many guests opened them, and who has replied.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState(true);
  const isAdmin = Boolean(user?.email && isUserAdmin(user.email));

  useEffect(() => {
    if (loading) return;
    if (!user) {
      void navigate({ to: "/login", search: { redirect: "/dashboard" } });
      return;
    }
    let active = true;
    setBusy(true);
    getDashboard({ data: {} })
      .then((result) => {
        if (active) setData(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load your dashboard.");
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [user, loading, navigate]);

  if (loading || busy) {
    return (
      <main className="dashboard-page">
        <div className="dash-loading">
          <LoaderCircle className="spin" />
          <span>Loading your dashboard…</span>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <header className="dash-header">
        <Link to="/" className="dash-brand">
          <span>ትዝታ</span>
          <strong>TIZITA</strong>
        </Link>
        <div className="dash-header-actions">
          {isAdmin && (
            <Button
              asChild
              variant="outline"
              className="border-amber-500/50 text-amber-600 dark:text-amber-400"
            >
              <Link to="/admin">
                <ShieldCheck className="w-4 h-4 mr-1" />
                Admin Portal
              </Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link to="/create/$templateId" params={{ templateId: "royal-tewahedo" }} search={{}}>
              <Plus />
              New invitation
            </Link>
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              void signOut().then(() => navigate({ to: "/" }));
            }}
          >
            <LogOut />
            Sign out
          </Button>
        </div>
      </header>

      <div className="dash-intro">
        <p>YOUR WEDDING INVITATIONS</p>
        <h1>
          {data?.invitations[0]
            ? `${data.invitations[0].brideName} & ${data.invitations[0].groomName}`
            : "Welcome to Tizita"}
        </h1>
        <span>{user?.email}</span>
      </div>

      {error && (
        <div className="dash-error">
          <p>{error}</p>
          <span>Check that the required environment variables are set, then reload.</span>
        </div>
      )}

      {data && data.invitations.length === 0 && !error && (
        <section className="dash-empty">
          <Heart />
          <h2>No invitations yet</h2>
          <p>Create your first invitation to start tracking links, opens, and RSVP replies.</p>
          <Button asChild size="lg">
            <Link to="/create/$templateId" params={{ templateId: "royal-tewahedo" }} search={{}}>
              Create your invitation
            </Link>
          </Button>
        </section>
      )}

      {data && data.invitations.length > 0 && <DashboardBody data={data} />}
    </main>
  );
}

function DashboardBody({ data }: { data: DashboardData }) {
  return (
    <>
      <section className="kpi-grid">
        <Kpi
          icon={Send}
          label="Links sent"
          value={data.totals.linksSent}
          hint={`${data.totals.guests} guests invited`}
        />
        <Kpi
          icon={Eye}
          label="Invitation opens"
          value={data.totals.totalViews}
          hint="Total page opens"
        />
        <Kpi
          icon={Mail}
          label="RSVPs received"
          value={data.totals.rsvpsReceived}
          hint={`${data.totals.awaitingReply} still awaiting reply`}
        />
        <Kpi
          icon={Users}
          label="Guests attending"
          value={data.totals.attending}
          hint={`Target ${data.totals.targetGuests}`}
        />
      </section>

      <section className="dash-invitations">
        <div className="dash-section-head">
          <h2>Your invitations</h2>
          <span>{data.invitations.length} total</span>
        </div>
        <div className="invitation-cards">
          {data.invitations.map((invitation) => (
            <article className="invitation-card" key={invitation.id}>
              <div className="invitation-card-top">
                <div>
                  <p>{templateMeta[invitation.templateId as TemplateId]?.name ?? invitation.templateId}</p>
                  <h3>
                    {invitation.brideName} &amp; {invitation.groomName}
                  </h3>
                  <span className="invite-date">
                    <Calendar />
                    {formatWeddingDate(invitation.weddingDate)}
                  </span>
                </div>
                <div className="invitation-badges">
                  {invitation.isPaid && <em className="badge paid">Paid</em>}
                  <em className={invitation.isPublished ? "badge live" : "badge draft"}>
                    {invitation.isPublished ? "Live" : "Draft"}
                  </em>
                </div>
              </div>
              <div className="invitation-metrics">
                <Metric label="Links sent" value={invitation.linksSent} of={invitation.guests} />
                <Metric label="Opens" value={invitation.viewCount} />
                <Metric label="RSVPs" value={invitation.rsvpsReceived} />
                <Metric label="Attending" value={invitation.attending} of={invitation.targetGuestCount} />
              </div>
              <div
                className="progress-track"
                title={`${invitation.attending} of ${invitation.targetGuestCount} target guests`}
              >
                <div
                  className="progress-fill"
                  style={{ width: `${progressWidth(invitation.attending, invitation.targetGuestCount)}%` }}
                />
              </div>
              <div className="invitation-card-actions">
                <Button asChild variant="outline" size="sm">
                  <Link
                    to="/create/$templateId"
                    params={{ templateId: invitation.templateId }}
                    search={{ edit: invitation.id }}
                  >
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(invitation.shareUrl)
                      .then(() => toast.success("Invitation link copied"));
                  }}
                >
                  <Copy />
                  Copy link
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link
                    to="/dashboard/invitations/$invitationId"
                    params={{ invitationId: invitation.id }}
                  >
                    Guests &amp; analytics
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/invite/$slug" params={{ slug: invitation.slug }} search={{ token: undefined }}>
                    Open
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function progressWidth(value: number, target: number) {
  if (!target) return 0;
  return Math.min(100, Math.round((value / target) * 100));
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Send;
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <article className="kpi-card">
      <div className="kpi-icon">
        <Icon />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <em>{hint}</em>
      </div>
    </article>
  );
}

function Metric({ label, value, of }: { label: string; value: number; of?: number }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>
        {value}
        {typeof of === "number" && <small> / {of}</small>}
      </strong>
    </div>
  );
}
