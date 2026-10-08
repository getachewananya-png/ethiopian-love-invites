import { useEffect, useRef, useState } from "react";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { InvitationRenderer } from "@/components/invitations/InvitationRenderer";
import { getInvitation } from "@/lib/invitations.functions";
import { recordGuestOpen, recordInvitationView } from "@/lib/rsvp.functions";
import type { WeddingInvitation } from "@/lib/invitation";
import { DEFAULT_LANG, type InviteLang } from "@/lib/invite-copy";

export const Route = createFileRoute("/invite/$slug")({
  loader: ({ params }) => getInvitation({ data: { slug: params.slug } }),
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search["token"] === "string" ? search["token"] : undefined,
  }),
  head: ({ loaderData }) => ({ meta: [
    { title: loaderData ? `${loaderData.bride_name} & ${loaderData.groom_name} — Wedding Invitation` : "Wedding Invitation — Tizita" },
    { name: "description", content: loaderData?.custom_message || "You are warmly invited to celebrate this wedding." },
    { property: "og:title", content: loaderData ? `${loaderData.bride_name} & ${loaderData.groom_name}` : "Wedding Invitation" },
    { property: "og:description", content: loaderData?.custom_message || "Open this wedding invitation for all the celebration details." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ]}), component: PublicInvitation,
});
function PublicInvitation() {
  const row = Route.useLoaderData();
  const { token } = useSearch({ from: "/invite/$slug" });
  const tracked = useRef(false);
  // Amharic by default; guests can switch to English from the invitation.
  const [lang, setLang] = useState<InviteLang>(DEFAULT_LANG);
  const [entered, setEntered] = useState(false);

  // Fire-and-forget analytics: count this view once per mount, and attribute it
  // to a specific guest when they followed a per-guest link (?token=...).
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    void recordInvitationView({ data: { slug: row.slug } }).catch(() => undefined);
    if (token) void recordGuestOpen({ data: { token } }).catch(() => undefined);
  }, [row.slug, token]);

  // Hold the splash briefly so the hero image and fonts are behind it rather
  // than popping in after it disappears.
  useEffect(() => {
    const timer = window.setTimeout(() => setEntered(true), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  // Marks the document as JS-driven so the CSS below is allowed to start things
  // hidden. Added on mount rather than after the splash, because .invite-doc
  // fades in at the same moment the splash leaves -- if the flag only appeared
  // then, the fade would have nothing to animate from.
  //
  // Anything that renders [data-reveal] without this flag (template preview,
  // builder preview) stays fully visible, and so does the whole page if this
  // script never runs at all.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("reveal-on");
    return () => root.classList.remove("reveal-on");
  }, []);

  // Reveal sections as they scroll into view.
  useEffect(() => {
    if (!entered) return;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!nodes.length) return;

    const showAll = () => {
      for (const node of nodes) node.classList.add("is-revealed");
    };

    if (!("IntersectionObserver" in window)) {
      showAll();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.classList.toggle("is-revealed", entry.isIntersecting);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    for (const node of nodes) observer.observe(node);

    // Safety net: if the observer somehow never fires (odd viewport, print, a
    // section taller than the screen), reveal everything rather than risk
    // leaving a guest staring at empty space.
    const failsafe = window.setTimeout(showAll, 4000);

    return () => {
      window.clearTimeout(failsafe);
      observer.disconnect();
    };
  }, [entered]);

  const invitation: WeddingInvitation = { id: row.id, slug: row.slug, templateId: row.template_id, brideName: row.bride_name, groomName: row.groom_name, brideNameAm: row.bride_name_am || undefined, groomNameAm: row.groom_name_am || undefined, weddingDate: row.wedding_date, weddingTime: row.wedding_time || undefined, ceremonyType: row.ceremony_type || undefined, venue: row.venue || undefined, venueAm: row.venue_am || undefined, address: row.address || undefined, addressAm: row.address_am || undefined, story: row.story || undefined, storyAm: row.story_am || undefined, howWeMet: row.how_we_met || undefined, phone: row.phone || undefined, email: row.email || undefined, rsvpEnabled: row.rsvp_enabled, rsvpDeadline: row.rsvp_deadline || undefined, customMessage: row.custom_message || undefined, customMessageAm: row.custom_message_am || undefined, primaryPhotoUrl: row.primary_photo_url || undefined, galleryImages: Array.isArray(row.gallery_photos) ? (row.gallery_photos as unknown[]).filter((item): item is string => typeof item === "string") : [], mapsUrl: row.maps_url || undefined, musicUrl: row.music_url || undefined, createdAt: row.created_at, updatedAt: row.updated_at };

  return (
    <div className="invite-page">
      {/* Splash: shows the couple's initials while the invitation settles. */}
      <div className={`invite-splash ${entered ? "done" : ""}`} aria-hidden={entered}>
        <div className="splash-ring"><span>{initials(row.bride_name, row.groom_name)}</span></div>
        <p className="splash-names">{row.bride_name} <i>&</i> {row.groom_name}</p>
        <p className="splash-hint">የግብዣ ጥራት በመካፈት ላይ…</p>
        <div className="splash-bar"/>
      </div>
      <div className={`invite-doc ${entered ? "in" : ""}`}>
        <InvitationRenderer invitation={invitation} slug={row.slug} token={token} lang={lang} onLangChange={setLang}/>
      </div>
    </div>
  );
}

/** First letter of the bride and groom, with a graceful fallback. */
function initials(bride: string, groom: string): string {
  const a = bride?.trim()?.[0] ?? "";
  const b = groom?.trim()?.[0] ?? "";
  if (a && b) return `${a} & ${b}`;
  return a || b || "ፍ ቅ";
}
