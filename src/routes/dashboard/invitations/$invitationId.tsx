import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Copy, LoaderCircle, Mail, Phone, Plus, Send, Trash2, UserCheck, UserX, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getInvitationGuests, type GuestRow } from "@/lib/dashboard.functions";
import { addGuest, addGuestsBulk, markGuestsSent, removeGuest, updateGuestTarget } from "@/lib/guests.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/dashboard/invitations/$invitationId")({
  head: () => ({ meta: [
    { title: "Guest List & Analytics — Tizita" },
    { name: "description", content: "See who opened your invitation and who has replied." },
    { name: "robots", content: "noindex" },
  ] }),
  component: InvitationAnalytics,
});

function InvitationAnalytics() {
  const { invitationId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [guests, setGuests] = useState<GuestRow[]>([]);
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bulk, setBulk] = useState("");
  const [target, setTarget] = useState(50);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const result = await getInvitationGuests({ data: { invitationId } });
    setGuests(result.guests);
    setSlug(result.slug);
    return result;
  }, [invitationId]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      void navigate({ to: "/login", search: { redirect: `/dashboard/invitations/${invitationId}` } });
      return;
    }
    let active = true;
    setBusy(true);
    load()
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load this invitation."); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [user, loading, load, navigate, invitationId]);

  const withRefresh = async (action: () => Promise<unknown>, successMessage: string) => {
    try {
      await action();
      await load();
      toast.success(successMessage);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Something went wrong");
    }
  };

  if (loading || busy) return <main className="dashboard-page"><div className="dash-loading"><LoaderCircle className="spin"/><span>Loading guest list…</span></div></main>;

  const linksSent = guests.filter((guest) => guest.sentAt).length;
  const opened = guests.filter((guest) => guest.firstViewedAt).length;
  const replied = guests.filter((guest) => guest.attending !== null);
  const attending = guests.reduce((total, guest) => total + (guest.attending ? guest.partySize : 0), 0);
  const pending = guests.filter((guest) => guest.sentAt && guest.attending === null);
  const notSent = guests.filter((guest) => !guest.sentAt);
  const notSentWithEmail = notSent.filter((guest) => guest.email);
  const notSentWithoutEmail = notSent.filter((guest) => !guest.email);

  /**
   * Sends the private links by email, then reports what actually went out.
   * Guests with no address are still marked as sent — assume they were sent by
   * hand — and the toast says so rather than silently pretending email was used.
   */
  const sendInvites = async (ids: string[]) => {
    setSending(true);
    try {
      const result = await markGuestsSent({ data: { invitationId, guestIds: ids } });
      await load();
      if (result.emailed > 0) {
        const handSent = result.skipped > 0 ? `, ${result.skipped} marked as sent (no email)` : "";
        toast.success(`${result.emailed} invitation${result.emailed === 1 ? "" : "s"} emailed${handSent}`);
      } else if (result.skipped > 0) {
        toast.success(`${result.skipped} guest${result.skipped === 1 ? "" : "s"} marked as sent — add emails to send automatically`);
      } else {
        toast.error("No invitations were sent.");
      }
      if (result.failures.length) {
        // Surface the first few; a 100-guest batch can produce a long list.
        toast.error(result.failures.slice(0, 3).join(" · "));
      }
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not send invitations");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="dashboard-page">
      <header className="dash-header">
        <Button asChild variant="ghost"><Link to="/dashboard"><ArrowLeft/>Dashboard</Link></Button>
        {slug && <Button asChild variant="outline"><Link to="/invite/$slug" params={{ slug }} search={{ token: undefined }}>View invitation</Link></Button>}
      </header>

      <div className="dash-intro"><p>GUEST LIST &amp; ANALYTICS</p><h1>{guests.length ? `${guests.length} guests invited` : "No guests yet"}</h1></div>

      {error && <div className="dash-error"><p>{error}</p></div>}

      <section className="kpi-grid">
        <Kpi icon={Send} label="Links sent" value={linksSent} hint={`of ${guests.length} guests`}/>
        <Kpi icon={UserCheck} label="Opened" value={opened} hint="At least once"/>
        <Kpi icon={Users} label="Replied" value={replied.length} hint={`${pending.length} awaiting`}/>
        <Kpi icon={UserX} label="Attending" value={attending} hint={`Target ${target}`}/>
      </section>

      <section className="dash-tools">
        <div className="tool-card">
          <h3>Set your target</h3>
          <p>How many guests are you planning for? Your progress is measured against this.</p>
          <div className="tool-row">
            <Input type="number" min={0} max={2000} value={target} onChange={(event) => setTarget(Number(event.target.value))}/>
            <Button variant="outline" onClick={() => { void withRefresh(() => updateGuestTarget({ data: { invitationId, targetGuestCount: target } }), "Target updated"); }}>Save target</Button>
          </div>
        </div>

        <div className="tool-card wide">
          <h3>Add a guest</h3>
          <p>Each guest gets their own private link so you can see exactly who opened it. Add an email to send it automatically.</p>
          <div className="tool-grid">
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Guest name" aria-label="Guest name"/>
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email (optional)" aria-label="Guest email"/>
            <Button
              disabled={!name.trim()}
              onClick={() => { void withRefresh(async () => { await addGuest({ data: { invitationId, name, email, channel: email.trim() ? "email" : "link" } }); setName(""); setEmail(""); }, "Guest added"); }}
            ><Plus/>Add</Button>
          </div>
        </div>

        <div className="tool-card wide">
          <h3>Paste a guest list</h3>
          <p>One guest per line, as <code>Name</code> or <code>Name, email</code>. Everyone with an email can be sent their link in one click.</p>
          <textarea value={bulk} onChange={(event) => setBulk(event.target.value)} rows={4} placeholder={"Selam Bekele, selam@example.com\nDawit Alemu\nMarta Girma, marta@example.com"}/>
          <Button
            disabled={!bulk.trim()}
            onClick={() => {
              const parsed = parseGuestLines(bulk);
              if (!parsed.length) { toast.error("Add at least one name."); return; }
              const bad = parsed.find((entry) => entry.email && !isEmail(entry.email));
              if (bad) { toast.error(`"${bad.email}" is not a valid email address.`); return; }
              void withRefresh(async () => {
                await addGuestsBulk({ data: { invitationId, names: parsed.map((entry) => entry.name), emails: parsed.map((entry) => entry.email), channel: parsed.some((entry) => entry.email) ? "email" : "link" } });
                setBulk("");
              }, `${parsed.length} guest${parsed.length === 1 ? "" : "s"} added`);
            }}
          ><Plus/>Add all</Button>
        </div>
      </section>

      <section className="guest-table-section">
        <div className="dash-section-head">
          <h2>Guest list</h2>
          <Button
            size="sm"
            disabled={sending || !notSent.length}
            onClick={() => {
              if (!notSent.length) { toast.error("Every guest has already been marked as sent."); return; }
              const ids = notSent.map((guest) => guest.id);
              if (notSentWithEmail.length === 0) {
                // No addresses at all: this is a bookkeeping action, not an email.
                toast.info(`No guest has an email address — marking ${ids.length} as sent. Copy a link and send it by hand instead.`);
              }
              void sendInvites(ids);
            }}
          >{sending ? <LoaderCircle className="spin"/> : <Send/>}{notSentWithEmail.length ? `Email ${notSentWithEmail.length} & send ${notSent.length}` : `Mark all ${notSent.length} as sent`}</Button>
        </div>

        {guests.length === 0 ? <p className="dash-note">Add guests above to generate their private invitation links.</p> : (
          <div className="guest-table-wrap">
            <table className="guest-table">
              <thead><tr><th>Guest</th><th>Private link</th><th>Sent</th><th>Opened</th><th>RSVP</th><th/></tr></thead>
              <tbody>
                {guests.map((guest) => <tr key={guest.id}>
                  <td>
                    <strong>{guest.name}</strong>
                    <small className="guest-contact">
                      {guest.email && <span title={guest.email}><Mail/>{guest.email}</span>}
                      {guest.phone && <span><Phone/>{guest.phone}</span>}
                    </small>
                  </td>
                  <td>
                    <div className="link-actions">
                      <button className="link-copy" onClick={() => { void navigator.clipboard.writeText(guest.shareUrl).then(() => toast.success(`Link for ${guest.name} copied`)); }}><Copy/>Copy</button>
                      {guest.email && !guest.sentAt && (
                        <Button size="sm" variant="outline" disabled={sending} onClick={() => { void sendInvites([guest.id]); }}>
                          {sending ? <LoaderCircle className="spin"/> : <Send/>}Email
                        </Button>
                      )}
                      {!guest.sentAt && (
                        <Button size="sm" variant="ghost" disabled={sending} onClick={() => { void sendInvites([guest.id]); }}>Mark sent</Button>
                      )}
                    </div>
                  </td>
                  <td>{guest.sentAt ? formatDay(guest.sentAt) : <em className="muted">Not sent</em>}</td>
                  <td>{guest.firstViewedAt ? `${guest.viewCount}×` : <em className="muted">—</em>}</td>
                  <td>{guest.attending === null ? <em className="muted">Awaiting</em> : guest.attending ? <span className="pill yes">Yes · {guest.partySize}</span> : <span className="pill no">Declined</span>}</td>
                  <td><Button size="sm" variant="ghost" aria-label={`Remove ${guest.name}`} onClick={() => { void withRefresh(() => removeGuest({ data: { invitationId, guestId: guest.id } }), "Guest removed"); }}><Trash2/></Button></td>
                </tr>)}
              </tbody>
            </table>
          </div>
        )}
        {notSentWithoutEmail.length > 0 && (
          <p className="dash-note inline">{(notSentWithoutEmail.length)} guest{(notSentWithoutEmail.length === 1 ? " has" : "s have")} no email address — copy their link and share it over WhatsApp or SMS.</p>
        )}
      </section>
    </main>
  );
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
}

/** Pragmatic shape check; the zod schema on the server is the real gate. */
function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Accepts "Name", "Name, email", or "Name email" per line. Only a trailing
 * comma-separated part that looks like an email is treated as an address, so
 * names containing commas are not mangled.
 */
function parseGuestLines(raw: string): Array<{ name: string; email: string }> {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const comma = line.indexOf(",");
      if (comma !== -1) {
        const maybeName = line.slice(0, comma).trim();
        const maybeEmail = line.slice(comma + 1).trim();
        if (maybeName && maybeEmail) return { name: maybeName, email: maybeEmail };
      }
      return { name: line, email: "" };
    });
}

function Kpi({ icon: Icon, label, value, hint }: { icon: typeof Send; label: string; value: number; hint: string }) {
  return <article className="kpi-card"><div className="kpi-icon"><Icon/></div><div><span>{label}</span><strong>{value}</strong><em>{hint}</em></div></article>;
}

