export const TEMPLATE_IDS = ["royal-tewahedo", "addis-modern", "habesha-romance"] as const;
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
  createdAt?: string;
  updatedAt?: string;
}

export const templateMeta: Record<TemplateId, { name: string; number: string; description: string }> = {
  "royal-tewahedo": { name: "Royal Tewahedo", number: "01", description: "Sacred tradition, rendered in burgundy and antique gold." },
  "addis-modern": { name: "Addis Modern", number: "02", description: "An editorial composition for a love that feels entirely now." },
  "habesha-romance": { name: "Habesha Romance", number: "03", description: "A soft garden reverie of rose, champagne, and forever." },
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
};

export function formatWeddingDate(date: string) {
  if (!date) return "12 · 12 · 2026";
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(`${date}T12:00:00`));
}
