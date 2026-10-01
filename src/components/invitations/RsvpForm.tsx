import { Check, Heart, LoaderCircle, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitRsvp } from "@/lib/rsvp.functions";

/**
 * The real RSVP form that replaces the decorative closing block.
 * Posting here is what feeds the dashboard's reply and headcount analytics.
 */
export function RsvpForm({ slug, token, deadline, amharic = false }: { slug: string; token?: string | undefined; deadline?: string | undefined; amharic?: boolean | undefined }) {
  const [name, setName] = useState("");
  const [attending, setAttending] = useState<boolean | null>(null);
  const [partySize, setPartySize] = useState(1);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string>("");

  const t = amharic
    ? { title: "እባክዎ ይመልሱ", name: "ስምዎ", yes: "እመጣለሁ", no: "አልመጣም", guests: "የሚመጡ ቁጥር", note: "መልእክት (አማራጭ)", send: "መልስ ላክ", by: "እባክዎ ከ" }
    : { title: "Kindly reply", name: "Your name", yes: "Joyfully accept", no: "Regretfully decline", guests: "Guests in your party", note: "A message (optional)", send: "Send RSVP", by: "Kindly reply by" };

  if (done) {
    return <div className="rsvp-block rsvp-done"><Check/><strong>{done}</strong></div>;
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) { toast.error("Please tell us your name."); return; }
    if (attending === null) { toast.error("Please choose whether you can attend."); return; }
    setBusy(true);
    try {
      const result = await submitRsvp({ data: { slug, token, name, attending, partySize, message } });
      setDone(result.thankYou);
      toast.success("Thank you for your reply");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Your reply could not be sent");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="rsvp-block rsvp-form" onSubmit={submit}>
      <p className="rsvp-heading"><Heart/>{t.title}{deadline ? ` · ${t.by} ${deadline}` : ""}</p>
      <label className="rsvp-field"><span>{t.name}</span>
        <Input value={name} onChange={(event) => setName(event.target.value)} required maxLength={120}/>
      </label>
      <div className="rsvp-choice">
        <button type="button" className={attending === true ? "active yes" : ""} onClick={() => setAttending(true)}><Check/>{t.yes}</button>
        <button type="button" className={attending === false ? "active no" : ""} onClick={() => setAttending(false)}><X/>{t.no}</button>
      </div>
      {attending === true && <label className="rsvp-field"><span>{t.guests}</span>
        <Input type="number" min={1} max={20} value={partySize} onChange={(event) => setPartySize(Number(event.target.value))}/>
      </label>}
      <label className="rsvp-field"><span>{t.note}</span>
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1000} rows={3}/>
      </label>
      <Button type="submit" disabled={busy} size="lg">{busy ? <LoaderCircle className="spin"/> : <Heart/>}{t.send}</Button>
    </form>
  );
}
