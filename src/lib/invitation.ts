export const TEMPLATE_IDS = ["royal-tewahedo", "addis-modern", "habesha-romance", "lalibela-stone", "buna-coffee", "wonderland", "traditional"] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export interface WeddingInvitation {
  id?: string;
  slug?: string;
  templateId: TemplateId;
  brideName: string;
  groomName: string;
  brideNameAm?: string;
  groomNameAm?: string;
  weddingDate: string;
  weddingTime?: string;
  ceremonyType?: string;
  venue?: string;
  venueAm?: string;
  address?: string;
  addressAm?: string;
  story?: string;
  storyAm?: string;
  howWeMet?: string;
  phone?: string;
  email?: string;
  rsvpEnabled: boolean;
  rsvpDeadline?: string;
  customMessage?: string;
  customMessageAm?: string;
  primaryPhotoUrl?: string;
  galleryImages: string[];
  mapsUrl?: string;
  /** YouTube link (watch/youtu.be/embed/shorts) for background music. */
  musicUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const templateMeta: Record<TemplateId, { name: string; number: string; description: string }> = {
  "royal-tewahedo": { name: "Royal Tewahedo", number: "01", description: "Sacred tradition, rendered in burgundy and antique gold." },
  "addis-modern": { name: "Addis Modern", number: "02", description: "An editorial composition for a love that feels entirely now." },
  "habesha-romance": { name: "Habesha Romance", number: "03", description: "A soft garden reverie of rose, champagne, and forever." },
  "lalibela-stone": { name: "Lalibela Stone", number: "04", description: "Rock-hewn arches and warm ochre, for a love carved to last." },
  "buna-coffee": { name: "Buna & Blessings", number: "05", description: "The warmth of the coffee ceremony, poured into an intimate invitation." },
  "wonderland": { name: "Wonderland", number: "06", description: "An ornate printed keepsake, framed in gold filigree with a portrait up top." },
  traditional: { name: "Traditional", number: "07", description: "Woven tibeb borders, a stepped church cross, and the coffee ceremony, as printed in the market." },
};

export const sampleInvitation: WeddingInvitation = {
  templateId: "royal-tewahedo",
  brideName: "Hana Tesfaye",
  groomName: "Abebe Mekonnen",
  brideNameAm: "ሀና ተስፋዬ",
  groomNameAm: "አቤቤ መኮንን",
  weddingDate: "2026-12-12",
  weddingTime: "15:30",
  ceremonyType: "Wedding Ceremony & Reception",
  venue: "Hyatt Regency Addis Ababa",
  venueAm: "ሃያት ሪጀንሲ አዲስ አበባ",
  address: "Meskel Square, Addis Ababa",
  addressAm: "መስቀል አደባባይ፣ አዲስ አበባ",
  howWeMet: "A chance meeting over coffee became the beginning of everything.",
  story: "We met on a rain-softened afternoon in Addis. What began as one long conversation became a life built with laughter, faith, and the people we love.",
  storyAm: "በአዲስ አበባ በዝናባማ ከሰዓት ተገናኘን። ከአንድ ረጅም ውይይት የጀመረው ታሪካችን በፍቅርና በእምነት የተሞላ ሕይወት ሆነ።",
  phone: "+251 911 234 567",
  email: "hanaandabebe@example.com",
  rsvpEnabled: true,
  rsvpDeadline: "2026-11-20",
  customMessage: "With joyful hearts, our families invite you to celebrate the beginning of our forever.",
  customMessageAm: "ቤተሰቦቻችን የዘላለም ጉዟችንን ጅማሬ ከእኛ ጋር እንድታከብሩ በደስታ ይጋብዙዎታል።",
  galleryImages: [],
  mapsUrl: "https://maps.google.com/?q=Hyatt+Regency+Addis+Ababa",
  musicUrl: "https://www.youtube.com/watch?v=5qap5aO4i9A",
};

/**
 * Extracts an 11-character YouTube video id from the link shapes people paste:
 * watch?v=, youtu.be/, /embed/, /shorts/, /live/, and bare ids. Returns null
 * for anything else so callers can ignore non-YouTube input.
 */
export function youtubeVideoId(url: string | undefined | null): string | null {
  if (!url) return null;
  const value = url.trim();
  if (!value) return null;

  // A bare id pasted directly.
  if (/^[\w-]{11}$/.test(value)) return value;

  let parsed: URL;
  try {
    // Accept links pasted without a scheme ("youtube.com/watch?v=...").
    parsed = new URL(value.startsWith("http") ? value : `https://${value}`);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  const isYouTube = host === "youtu.be" || host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtube-nocookie.com";
  if (!isYouTube) return null;

  const fromQuery = parsed.searchParams.get("v");
  if (fromQuery && /^[\w-]{11}$/.test(fromQuery)) return fromQuery;

  const segments = parsed.pathname.split("/").filter(Boolean);
  // youtu.be/<id> puts the id in the FIRST path segment, while /embed, /shorts,
  // /live and /v put it in the second.
  if (host === "youtu.be") {
    const shortId = segments[0];
    if (shortId && /^[\w-]{11}$/.test(shortId)) return shortId;
    return null;
  }
  const first = segments[0];
  const second = segments[1];
  if (first && ["embed", "shorts", "live", "v"].includes(first) && second && /^[\w-]{11}$/.test(second)) return second;

  return null;
}

export function formatWeddingDate(date: string) {
  if (!date) return "12 · 12 · 2026";
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(`${date}T12:00:00`));
}
