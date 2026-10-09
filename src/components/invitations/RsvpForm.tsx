import {
  CalendarHeart,
  Check,
  Heart,
  LoaderCircle,
  MessageSquareHeart,
  Minus,
  Plus,
  RotateCcw,
  User,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitRsvp } from "@/lib/rsvp.functions";

export interface RsvpFormProps {
  slug: string;
  token?: string | undefined;
  deadline?: string | undefined;
  amharic?: boolean | undefined;
  isPreview?: boolean | undefined;
}

/**
 * The real RSVP form for wedding guests to accept/decline and submit headcount & wishes.
 * Supports live guest submissions as well as clean preview demonstration mode.
 */
export function RsvpForm({
  slug,
  token,
  deadline,
  amharic = false,
  isPreview = false,
}: RsvpFormProps) {
  const [name, setName] = useState("");
  const [attending, setAttending] = useState<boolean | null>(null);
  const [partySize, setPartySize] = useState(1);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string>("");

  const t = amharic
    ? {
        title: "እባክዎ ይመልሱ",
        by: "እባክዎ እስከ",
        subtitle: "ከልብ አብረውን እንዲያከብሩ እንጠብቃለን",
        name: "ሙሉ ስምዎ",
        namePlaceholder: "ሙሉ ስምዎን ያስገቡ",
        attendance: "መገኘትዎን ያሳውቁን",
        yes: "በደስታ እገኛለሁ",
        no: "ይቅርታ አልገኝም",
        guests: "የሚመጡ እንግዶች ብዛት",
        guestsSub: "እርስዎን ጨምሮ",
        note: "መልካም ምኞት ወይም ማስታወሻ",
        notePlaceholder: "ለሙሽሮቹ መልካም ምኞት ወይም ማስታወሻ ያካፍሉ...",
        send: "መልስዎን ይላኩ",
        sending: "በመላክ ላይ...",
        thanks: "መልስዎን ስላሳወቁን ከልብ እናመሰግናለን!",
      }
    : {
        title: "Kindly reply",
        by: "Kindly reply by",
        subtitle: "We look forward to celebrating together",
        name: "Your Name",
        namePlaceholder: "Enter your full name",
        attendance: "Will you be attending?",
        yes: "Joyfully accept",
        no: "Regretfully decline",
        guests: "Guests in your party",
        guestsSub: "Including yourself",
        note: "Message or warm wishes",
        notePlaceholder: "Write a blessing or note for the couple...",
        send: "Send RSVP",
        sending: "Sending RSVP...",
        thanks: "Thank you for your reply!",
      };

  if (done) {
    return (
      <div className="rsvp-block rsvp-done">
        <div className="rsvp-done-icon">
          <Check size={28} />
        </div>
        <h3 className="rsvp-done-title">{t.thanks}</h3>
        <p className="rsvp-done-msg">{done}</p>
        {isPreview && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setDone("");
              setName("");
              setAttending(null);
              setPartySize(1);
              setMessage("");
            }}
            className="mt-3 gap-1.5"
          >
            <RotateCcw size={14} /> Reset Preview
          </Button>
        )}
      </div>
    );
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error(amharic ? "እባክዎ ስምዎን ያስገቡ" : "Please enter your name.");
      return;
    }
    if (attending === null) {
      toast.error(
        amharic
          ? "እባክዎ መገኘትዎን ወይም አለመገኘትዎን ይምረጡ"
          : "Please choose whether you can attend.",
      );
      return;
    }

    if (isPreview) {
      setBusy(true);
      setTimeout(() => {
        setBusy(false);
        setDone(
          amharic
            ? "መልስዎን ስላሳወቁን እናመሰግናለን! (የሙከራ እይታ)"
            : "Your reply was received! (Preview mode demonstration)",
        );
        toast.success(
          amharic ? "መልስ ተልኳል (ሙከራ)" : "Thank you for your reply!",
        );
      }, 500);
      return;
    }

    setBusy(true);
    try {
      const result = await submitRsvp({
        data: {
          slug,
          token,
          name: name.trim(),
          attending,
          partySize: attending ? partySize : 0,
          message: message.trim(),
        },
      });
      setDone(result.thankYou);
      toast.success(amharic ? "መልስዎ ተልኳል" : "Thank you for your reply");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : amharic
            ? "መልስ መላክ አልተቻለም"
            : "Your reply could not be sent",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="rsvp-block rsvp-form" onSubmit={submit}>
      {/* Header with single deadline text (no duplication) */}
      <div className="rsvp-header">
        <div className="rsvp-header-badge">
          <Heart size={15} className="fill-current" />
          <span>{deadline ? `${t.by} ${deadline}` : t.title}</span>
        </div>
        <p className="rsvp-subtitle">{t.subtitle}</p>
      </div>

      {/* Name field */}
      <div className="rsvp-field">
        <label htmlFor="rsvp-name">
          <User size={15} />
          <span>{t.name}</span>
          <span className="rsvp-req">*</span>
        </label>
        <Input
          id="rsvp-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t.namePlaceholder}
          required
          maxLength={120}
          className="rsvp-input"
        />
      </div>

      {/* Attendance choice */}
      <div className="rsvp-field">
        <label>
          <CalendarHeart size={15} />
          <span>{t.attendance}</span>
          <span className="rsvp-req">*</span>
        </label>
        <div className="rsvp-choice">
          <button
            type="button"
            className={`rsvp-choice-btn yes ${attending === true ? "active" : ""}`}
            onClick={() => setAttending(true)}
          >
            <Check size={18} />
            <span>{t.yes}</span>
          </button>
          <button
            type="button"
            className={`rsvp-choice-btn no ${attending === false ? "active" : ""}`}
            onClick={() => {
              setAttending(false);
              setPartySize(1);
            }}
          >
            <X size={18} />
            <span>{t.no}</span>
          </button>
        </div>
      </div>

      {/* Party size counter (shown when joyfully accepting) */}
      {attending === true && (
        <div className="rsvp-field rsvp-party-field">
          <div className="rsvp-field-header">
            <label htmlFor="rsvp-party-count">
              <Users size={15} />
              <span>{t.guests}</span>
            </label>
            <span className="rsvp-field-hint">{t.guestsSub}</span>
          </div>

          <div className="rsvp-counter">
            <div className="rsvp-quick-pills">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`rsvp-pill ${partySize === num ? "active" : ""}`}
                  onClick={() => setPartySize(num)}
                >
                  {num}
                </button>
              ))}
            </div>

            <div className="rsvp-stepper">
              <button
                type="button"
                className="rsvp-step-btn"
                onClick={() => setPartySize((p) => Math.max(1, p - 1))}
                disabled={partySize <= 1}
                aria-label="Decrease party size"
              >
                <Minus size={15} />
              </button>
              <span className="rsvp-step-value" id="rsvp-party-count">
                {partySize}
              </span>
              <button
                type="button"
                className="rsvp-step-btn"
                onClick={() => setPartySize((p) => Math.min(20, p + 1))}
                disabled={partySize >= 20}
                aria-label="Increase party size"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message or wishes */}
      <div className="rsvp-field">
        <label htmlFor="rsvp-message">
          <MessageSquareHeart size={15} />
          <span>{t.note}</span>
        </label>
        <Textarea
          id="rsvp-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={t.notePlaceholder}
          maxLength={1000}
          rows={3}
          className="rsvp-textarea"
        />
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        disabled={busy}
        size="lg"
        className="rsvp-submit-btn"
      >
        {busy ? (
          <>
            <LoaderCircle className="spin" size={18} />
            <span>{t.sending}</span>
          </>
        ) : (
          <>
            <Heart size={18} className="fill-current" />
            <span>{t.send}</span>
          </>
        )}
      </Button>
    </form>
  );
}
