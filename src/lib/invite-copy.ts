export type InviteLang = "en" | "am";

/**
 * Every visible string on the public invitation, in both languages.
 * Amharic is the default (see DEFAULT_LANG) because that is what most guests
 * of an Ethiopian wedding actually read first.
 */
export const DEFAULT_LANG: InviteLang = "am";

export const inviteCopy = {
  en: {
    switchTo: "አማ", switchToLabel: "Switch to Amharic",
    kickerRoyal: "Two hearts · One sacred beginning",
    joyfulHearts: "With joyful hearts",
    witness: "We invite you to witness our beginning",
    fallbackMessage: "Together with our families, we invite you to celebrate a sacred promise and a love made for forever.",
    date: "The date", hour: "The hour", place: "The place", tba: "To be announced",
    ourStory: "Our story", storyHeadline: "Written by grace, held by love.",
    journal: "Wedding journal · Issue No. 01", addisCity: "ADDIS ABABA",
    addisSection: "01 / The story", addisCaption: "Our forever starts here.",
    addisWhen: "When", addisWhere: "Where",
    quote: "“A life composed together.”",
    romanceKicker: "A love written in forever",
    romanceHeadline: "በፍቅር ተጀምሮለዘላለም የሚቀጥል",
    romanceIntro: "Two souls, one beautiful promise",
    ceremony: "Ceremony", reception: "Reception",
    galleryKicker: "Moments we treasure", galleryTitle: "Our Gallery",
    closing: "We cannot wait to celebrate with you",
    viewLocation: "View location",
    replyBy: "Kindly reply by", rsvpDate: "the RSVP date",
    lalibelaKicker: "Carved in stone · Promised for life",
    lalibelaStory: "Our path", lalibelaBlessing: "May you bless this union",
    bunaKicker: "Buna · Served with three blessings",
    bunaStory: "A story shared over coffee",
    bunaBlessing: "Health, happiness, and a long life together",
    bunaCeremonyNote: "The ceremony begins with buna, as it always has.",
    wonderlandKicker: "WONDERLAND WEDDING PARTY",
  },
  am: {
    switchTo: "EN", switchToLabel: "Switch to English",
    kickerRoyal: "ሁለት ልቦች · አንድ ቅዱስ መጀመሪያ",
    joyfulHearts: "በሰላም ልቦች",
    witness: "የእርስዎችን መጀመሪያ እንጋትፍዎታለን",
    fallbackMessage: "ከቤተሰቦቻችን ጋር በአንድ ላይ፣ የቅዱስ ስምምነትንና ለዘላለም የሆነውን ፍቅር ለማስታወቂያ እንጋትፍዎታለን።",
    date: "ቀን", hour: "ሰዓት", place: "ቦታ", tba: "እስካሁን አልተታወቀም",
    ourStory: "የእኛ ታሪክ", storyHeadline: "በጸዕይ ተጻፍቶ፣ በፍቅር የተያዘ።",
    journal: "የግብዣ መጽሐፍ · ቁጥር 01", addisCity: "አዲስ አበባ",
    addisSection: "01 / ታሪክ", addisCaption: "ለዘላለም የሚጀምረው አዲስ መጀመሪያችን።",
    addisWhen: "መቋላት", addisWhere: "ቦታ",
    quote: "“አንድ ላይ የተቀናጀ ሕይወት።”",
    romanceKicker: "ለዘላለም በተጻፈ ፍቅር",
    romanceHeadline: "በፍቅር ተጀምሮለዘላለም የሚቀጥል",
    romanceIntro: "ሁለት ነፍስ፣ አንድ ብሩህ ዕገት",
    ceremony: "ሥርዓት", reception: "ሰብራት",
    galleryKicker: "የምንመናቸው ጊዜዎች", galleryTitle: "ፎቶግራፍችን",
    closing: "ከእርስዎ ጋር መገናኘትን በጣም እንጠበቃለን",
    viewLocation: "ቦታውን ይመልከቱ",
    replyBy: "እባክዎ ይመልሱ በዚህ ጊዜ", rsvpDate: "በመልስ ጊዜው",
    lalibelaKicker: "በድንጋ ተቀርሷል · ለዘላለም ተቋርጧል",
    lalibelaStory: "የእኛ መንገድ", lalibelaBlessing: "ይስጡን የምስጥሩን አረጋግጥ",
wonderlandKicker: "ወንደርላንድ የግብዣ ማስታወቂያ",
    bunaKicker: "ቡና · በሦስት ምስላት ይቀርባል",
    bunaStory: "በቡና የተጋራ ታሪክ",
    bunaBlessing: "ጤና፣ ሰላም እና በጋር የተያዘ ረዥም እውነተኛ እርዓት",
    bunaCeremonyNote: "ሥርዓቱ በቡና ይጀምራል፤ እንደሁል ሁልጊዜም።",

  },
} as const satisfies Record<InviteLang, Record<string, string>>;

export type InviteCopy = (typeof inviteCopy)["en"] | (typeof inviteCopy)["am"];

/** Picks the localized value, falling back to the other language if unset. */
export function localized<T>(primary: T | undefined, fallback: T | undefined): T | undefined {
  return primary ?? fallback;
}
