import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Edit, ExternalLink, Eye, Heart, LoaderCircle, Mail, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { isUserAdmin } from "@/lib/admin";
import { getAllInvitationsForAdmin, type AdminInvitationSummary } from "@/lib/admin.functions";
import { formatWeddingDate, templateMeta, type TemplateId } from "@/lib/invitation";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Portal — Tizita" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState<AdminInvitationSummary[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string>("");

  const isAdmin = Boolean(user?.email && isUserAdmin(user.email));

  const loadData = () => {
    setLoadingData(true);
    setError("");
    getAllInvitationsForAdmin({ data: {} })
      .then((res) => {
        setInvitations(res);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load invitations");
      })
      .finally(() => {
        setLoadingData(false);
      });
  };

  useEffect(() => {
    if (loading) return;
    if (!user) {
      void navigate({ to: "/login", search: { redirect: "/admin" } });
      return;
    }
    if (!isAdmin) {
      return;
    }
    loadData();
  }, [user, loading, isAdmin, navigate]);

  if (loading || (loadingData && isAdmin)) {
    return (
      <main className="dashboard-page">
        <div className="dash-loading">
          <LoaderCircle className="spin" />
          <span>Verifying admin session…</span>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="dashboard-page">
        <header className="dash-header">
          <Link to="/" className="dash-brand"><span>ትዝታ</span><strong>TIZITA</strong></Link>
          <Button asChild variant="outline"><Link to="/dashboard"><ArrowLeft /> Back to Dashboard</Link></Button>
        </header>
        <div style={{ maxWidth: 600, margin: "80px auto", textAlign: "center", padding: "0 20px" }}>
          <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
          <p className="text-muted-foreground mb-6">
            Your account ({user?.email}) does not have administrator privileges to view this portal.
          </p>
          <Button asChild><Link to="/dashboard">Go to Couple Dashboard</Link></Button>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <header className="dash-header">
        <div className="flex items-center gap-3">
          <Link to="/" className="dash-brand"><span>ትዝታ</span><strong>TIZITA</strong></Link>
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> SUPER ADMIN
          </span>
        </div>
        <div className="dash-header-actions">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard"><ArrowLeft className="w-4 h-4 mr-1" /> My Dashboard</Link>
          </Button>
        </div>
      </header>

      <div className="dash-intro">
        <p>ALL PLATFORM INVITATIONS</p>
        <h1>Admin Invitation Manager</h1>
        <span>Manage, update, and inspect all created invitations across Tizita</span>
      </div>

      {error && (
        <div className="dash-error">
          <p>{error}</p>
          <span>Could not retrieve invitations. Try refreshing the page.</span>
        </div>
      )}

      {!error && (
        <section className="dash-invitations" style={{ marginTop: 24 }}>
          <div className="dash-section-head">
            <h2>Platform Invitations</h2>
            <span>{invitations.length} total invitations</span>
          </div>

          <div style={{ overflowX: "auto", background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 12 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f3f4f6", textAlign: "left", color: "#6b7280" }}>
                  <th style={{ padding: "12px 16px" }}>Couple &amp; Template</th>
                  <th style={{ padding: "12px 16px" }}>Owner Email</th>
                  <th style={{ padding: "12px 16px" }}>Wedding Date</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px" }}>Views / RSVPs</th>
                  <th style={{ padding: "12px 16px" }}>Created</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invitations.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>
                      No invitations found on the platform.
                    </td>
                  </tr>
                ) : (
                  invitations.map((inv) => (
                    <tr key={inv.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#111827" }}>
                          {inv.brideName} &amp; {inv.groomName}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                          {templateMeta[inv.templateId as TemplateId]?.name ?? inv.templateId} (<code>{inv.slug}</code>)
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#374151" }}>
                        {inv.userEmail || <span style={{ color: "#9ca3af" }}>Unknown</span>}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#374151" }}>
                        {inv.weddingDate ? formatWeddingDate(inv.weddingDate) : "-"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {inv.isPaid && (
                            <span style={{ fontSize: "0.7rem", padding: "2px 6px", borderRadius: 4, background: "#ecfdf5", color: "#059669", fontWeight: 600 }}>
                              PAID
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: "0.7rem",
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: inv.isPublished ? "#eff6ff" : "#f3f4f6",
                              color: inv.isPublished ? "#2563eb" : "#4b5563",
                              fontWeight: 600,
                            }}
                          >
                            {inv.isPublished ? "LIVE" : "DRAFT"}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#374151" }}>
                        <span title="Views">{inv.viewCount} views</span> · <span title="RSVP replies">{inv.rsvpsCount} RSVPs</span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "0.75rem", color: "#6b7280" }}>
                        {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "-"}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                          <Button asChild size="sm" variant="default">
                            <Link to="/create/$templateId" params={{ templateId: inv.templateId }} search={{ edit: inv.id }}>
                              <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="outline">
                            <Link to="/invite/$slug" params={{ slug: inv.slug }} search={{ token: undefined }} target="_blank">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

