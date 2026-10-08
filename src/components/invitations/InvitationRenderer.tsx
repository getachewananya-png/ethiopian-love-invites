import { CalendarDays, Clock3, Coffee, Globe, Heart, MapPin, Printer, Share2 } from "lucide-react";
import royalPhoto from "@/assets/royal-couple.jpg";
import addisPhoto from "@/assets/addis-couple.jpg";
import romancePhoto from "@/assets/romance-couple.jpg";
import charlesPhoto from "@/assets/charles-nicolle-photo.jpg";
import oliviaPhoto from "@/assets/olivia-ethan-photo.jpg";
import leafTop from "@/assets/leaf-corner-top.png";
import leafBottom from "@/assets/leaf-corner-bottom.png";
import upperFrame from "@/assets/invitation-upper-left.png";
import lowerFrame from "@/assets/invitation-lower-right.png";
import {
  EthiopianBloom,
  BloomDivider,
  BloomGarland,
  RoyalAmbience,
} from "@/components/invitations/EthiopianBloom";
import { formatWeddingDate, type TemplateId, type WeddingInvitation } from "@/lib/invitation";
import { RsvpForm } from "@/components/invitations/RsvpForm";
import { Button } from "@/components/ui/button";
import { BackgroundMusic } from "@/components/invitations/BackgroundMusic";
import { inviteCopy, localized, type InviteLang } from "@/lib/invite-copy";

// Fallback art is only seen in previews and before a couple uploads their own
// photo (primaryPhotoUrl always wins). The three bundled photos are shared
// between templates that suit them tonally.
const fallbackPhotos: Record<TemplateId, string> = {
  "royal-tewahedo": royalPhoto,
  "addis-modern": addisPhoto,
  "habesha-romance": romancePhoto,
  "lalibela-stone": royalPhoto,
  "buna-coffee": addisPhoto,
  wonderland: charlesPhoto,
  traditional: charlesPhoto,
  "olivia-ethan": oliviaPhoto,
};

export interface InvitationRendererProps {
  invitation: WeddingInvitation;
  compact?: boolean | undefined;
  slug?: string | undefined;
  token?: string | undefined;
  lang?: InviteLang | undefined;
  onLangChange?: ((lang: InviteLang) => void) | undefined;
}

export function InvitationRenderer({
  invitation,
  compact = false,
  slug,
  token,
  lang = "am",
  onLangChange,
}: InvitationRendererProps) {
  const hero = invitation.primaryPhotoUrl || fallbackPhotos[invitation.templateId];
  const shared = { invitation, hero, compact, slug, token, lang, onLangChange };
  if (invitation.templateId === "addis-modern") return <Addis {...shared} />;
  if (invitation.templateId === "habesha-romance") return <Romance {...shared} />;
  if (invitation.templateId === "lalibela-stone") return <Lalibela {...shared} />;
  if (invitation.templateId === "buna-coffee") return <Buna {...shared} />;
  if (invitation.templateId === "wonderland") return <Wonderland {...shared} />;
  if (invitation.templateId === "olivia-ethan") return <OliviaEthanTemplate {...shared} />;
  return <Royal {...shared} />;
}

/** Fixed language switch, shown on the public page only. */
function LangToggle({
  lang,
  onLangChange,
}: {
  lang: InviteLang;
  onLangChange?: ((lang: InviteLang) => void) | undefined;
}) {
  if (!onLangChange) return null;
  const t = inviteCopy[lang];
  return (
    <button
      type="button"
      className="invite-lang"
      onClick={() => onLangChange(lang === "en" ? "am" : "en")}
      aria-label={t.switchToLabel}
      title={t.switchToLabel}
    >
      <Globe />
      <span>{t.switchTo}</span>
    </button>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
  tba,
}: {
  icon: typeof CalendarDays;
  label: string;
  value?: string | undefined;
  tba: string;
}) {
  return (
    <div className="invite-detail">
      <Icon aria-hidden="true" />
      <div>
        <span>{label}</span>
        <strong>{value || tba}</strong>
      </div>
    </div>
  );
}

/**
 * Royal Tewahedo — the facade of a stone church.
 *
 * The pointed arch is the organising motif: it carries the photo, and every
 * other element (cross finial, garland, arcade, rose window) is placed as part
 * of that architecture rather than as free-floating decoration.
 *
 * Motion note: entrance animations ride the shared `[data-reveal]` system in
 * styles.css. That system is scoped to `.reveal-on`, which ONLY the public
 * invitation page sets -- so the builder and template previews render this
 * fully-formed and static. Ambient loops (petals, birds) go further and are
 * omitted entirely in `compact` via RoyalAmbience.
 */
function Royal({
  invitation: i,
  hero,
  compact,
  slug,
  token,
  lang = "am",
  onLangChange,
}: InvitationRendererProps & { hero: string; compact: boolean }) {
  const t = inviteCopy[lang];
  return (
    <article className={`invitation royal-invite ${compact ? "invite-compact" : ""}`} lang={lang}>
      {!compact && <LangToggle lang={lang} onLangChange={onLangChange} />}
      <RoyalAmbience compact={compact} />
      <section className="royal-hero reveal" data-reveal>
        <div className="royal-stones" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className="royal-cross" aria-hidden="true">
          <svg viewBox="0 0 48 62" focusable="false">
            <path d="M19 0h10v20h19v9H29v33h-10V29H0v-9h19Z" fill="currentColor" />
            <circle cx="24" cy="24.5" r="4.5" fill="#3a1220" />
          </svg>
        </div>
        <p className="invite-kicker">{t.kickerRoyal}</p>
        {/* The arch: garland draped over the crown, photo set into the opening. */}
        <div className="royal-arch">
          <BloomGarland className="royal-garland" />
          <div className="royal-photo-wrap">
            <img src={hero} alt={`${i.brideName} and ${i.groomName}`} width={1440} height={1808} />
            {/* Stained-glass mullions: the cross bars that divide a window into lights. */}
            <span className="royal-mullion royal-mullion-v" aria-hidden="true" />
            <span className="royal-mullion royal-mullion-h" aria-hidden="true" />
            <span className="royal-sprig royal-sprig-1" aria-hidden="true">
              <EthiopianBloom size={26} tone="gold" />
            </span>
            <span className="royal-sprig royal-sprig-2" aria-hidden="true">
              <EthiopianBloom size={22} tone="cream" />
            </span>
          </div>
        </div>
        <div className="royal-title">
          <h1>
            {i.brideName}
            <i>&</i>
            {i.groomName}
          </h1>
          {(i.brideNameAm || i.groomNameAm) && (
            <p lang="am">
              {i.brideNameAm} ፧ {i.groomNameAm}
            </p>
          )}
        </div>
        <BloomDivider className="royal-divider" />
        <p className="royal-date">{formatWeddingDate(i.weddingDate)}</p>
      </section>
      <section className="invite-section royal-welcome reveal" data-reveal>
        <span className="royal-rosette" aria-hidden="true">
          <EthiopianBloom size={30} tone="wine" />
        </span>
        <p className="invite-script">{t.joyfulHearts}</p>
        <h2>{t.witness}</h2>
        <p>
          {localized(
            lang === "am" ? i.customMessageAm : i.customMessage,
            lang === "am" ? i.customMessage : i.customMessageAm,
          ) || t.fallbackMessage}
        </p>
      </section>
      {/* Details as an arcade: three arched openings, like a church portico. */}
      <section className="royal-details reveal" data-reveal>
        <Detail
          icon={CalendarDays}
          label={t.date}
          value={formatWeddingDate(i.weddingDate)}
          tba={t.tba}
        />
        <Detail icon={Clock3} label={t.hour} value={i.weddingTime} tba={t.tba} />
        <Detail
          icon={MapPin}
          label={t.place}
          value={localized(
            lang === "am" ? i.venueAm : i.venue,
            lang === "am" ? i.venue : i.venueAm,
          )}
          tba={t.tba}
        />
      </section>
      {/* The story, set in a niche beneath its own carved arch. */}
      <section className="invite-story royal-story reveal" data-reveal>
        <span className="royal-story-arch" aria-hidden="true" />
        <EthiopianBloom size={22} tone="gold" className="royal-story-bloom" />
        <span>{t.ourStory}</span>
        <h2>
          {t.storyHeadline.split(",").map((line: string, index: number) => (
            <span key={line}>
              {index === 1 ? (
                <>
                  <br />
                  {line}
                </>
              ) : (
                line
              )}
            </span>
          ))}
        </h2>
        <p>{localized(lang === "am" ? i.storyAm : i.story, lang === "am" ? i.story : i.storyAm)}</p>
      </section>
      <Gallery images={i.galleryImages} hero={hero} lang={lang} />
      <Closing invitation={i} slug={slug} token={token} lang={lang} />
    </article>
  );
}

function Addis({
  invitation: i,
  hero,
  compact,
  slug,
  token,
  lang = "am",
  onLangChange,
}: InvitationRendererProps & { hero: string; compact: boolean }) {
  const t = inviteCopy[lang];
  const story = localized(lang === "am" ? i.storyAm : i.story, lang === "am" ? i.story : i.storyAm);
  return (
    <article className={`invitation addis-invite ${compact ? "invite-compact" : ""}`} lang={lang}>
      {!compact && <LangToggle lang={lang} onLangChange={onLangChange} />}
      <section className="addis-hero reveal" data-reveal>
        <div className="addis-date-rail">
          <span>{new Date(`${i.weddingDate}T12:00:00`).getFullYear()}</span>
          <span>{t.addisCity}</span>
        </div>
        <div className="addis-copy">
          <p>{t.journal}</p>
          <h1>
            {i.brideName}
            <br />
            <em>&</em> {i.groomName}
          </h1>
          <div className="addis-am" lang="am">
            {i.brideNameAm} · {i.groomNameAm}
          </div>
        </div>
        <img src={hero} alt={`${i.brideName} and ${i.groomName}`} width={1440} height={1808} />
        <p className="addis-caption">
          {t.addisCaption.split(" ").slice(0, 2).join(" ")}
          <br />
          {t.addisCaption.split(" ").slice(2).join(" ")}
        </p>
      </section>
      <section className="addis-intro reveal" data-reveal>
        <span>{t.addisSection}</span>
        <p>{story}</p>
      </section>
      <section className="addis-details reveal" data-reveal>
        <div>
          <span>{t.addisWhen}</span>
          <h2>{formatWeddingDate(i.weddingDate)}</h2>
          <p>{i.weddingTime}</p>
        </div>
        <div>
          <span>{t.addisWhere}</span>
          <h2>
            {localized(lang === "am" ? i.venueAm : i.venue, lang === "am" ? i.venue : i.venueAm)}
          </h2>
          <p>
            {localized(
              lang === "am" ? i.addressAm : i.address,
              lang === "am" ? i.address : i.addressAm,
            )}
          </p>
        </div>
      </section>
      <section className="addis-quote reveal" data-reveal>
        {t.quote}
      </section>
      <Gallery images={i.galleryImages} hero={hero} lang={lang} />
      <Closing invitation={i} slug={slug} token={token} lang={lang} />
    </article>
  );
}

function Romance({
  invitation: i,
  hero,
  compact,
  slug,
  token,
  lang = "am",
  onLangChange,
}: InvitationRendererProps & { hero: string; compact: boolean }) {
  const t = inviteCopy[lang];
  const story = localized(lang === "am" ? i.storyAm : i.story, lang === "am" ? i.story : i.storyAm);
  return (
    <article className={`invitation romance-invite ${compact ? "invite-compact" : ""}`} lang={lang}>
      {!compact && <LangToggle lang={lang} onLangChange={onLangChange} />}
      <section className="romance-hero reveal" data-reveal>
        <div className="petal petal-one" />
        <div className="petal petal-two" />
        <p className="invite-kicker">{t.romanceKicker}</p>
        <h1 lang="am">
          {t.romanceHeadline.split("ለዘላለም").map((part: string, index: number) => (
            <span key={part}>
              {index === 1 ? (
                <>
                  <br />
                  ለዘላለም{part}
                </>
              ) : (
                part
              )}
            </span>
          ))}
        </h1>
        <div className="romance-photo">
          <img src={hero} alt={`${i.brideName} and ${i.groomName}`} width={1440} height={1808} />
        </div>
        <p className="invite-script">
          {i.brideName} & {i.groomName}
        </p>
        <span>{formatWeddingDate(i.weddingDate)}</span>
      </section>
      <section className="romance-intro reveal" data-reveal>
        <Heart aria-hidden="true" />
        <h2>{t.romanceIntro}</h2>
        <p>{story}</p>
      </section>
      <section className="romance-details reveal" data-reveal>
        <Detail
          icon={CalendarDays}
          label={t.ceremony}
          value={`${formatWeddingDate(i.weddingDate)} · ${i.weddingTime || ""}`}
          tba={t.tba}
        />
        <Detail
          icon={MapPin}
          label={t.reception}
          value={localized(
            lang === "am" ? i.venueAm : i.venue,
            lang === "am" ? i.venue : i.venueAm,
          )}
          tba={t.tba}
        />
      </section>
      <Gallery images={i.galleryImages} hero={hero} lang={lang} />
      <Closing invitation={i} slug={slug} token={token} lang={lang} />
    </article>
  );
}

/**
 * Lalibela Stone — rock-hewn arches, warm ochre, centred and symmetrical.
 * The arch is the organising motif: it frames the photo and the details.
 */
function Lalibela({
  invitation: i,
  hero,
  compact,
  slug,
  token,
  lang = "am",
  onLangChange,
}: InvitationRendererProps & { hero: string; compact: boolean }) {
  const t = inviteCopy[lang];
  const story = localized(lang === "am" ? i.storyAm : i.story, lang === "am" ? i.story : i.storyAm);
  return (
    <article
      className={`invitation lalibela-invite ${compact ? "invite-compact" : ""}`}
      lang={lang}
    >
      {!compact && <LangToggle lang={lang} onLangChange={onLangChange} />}
      <section className="lalibela-hero reveal" data-reveal>
        <div className="lalibela-stones" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <p className="invite-kicker">{t.lalibelaKicker}</p>
        <div className="lalibela-arch">
          <img src={hero} alt={`${i.brideName} and ${i.groomName}`} width={1440} height={1808} />
        </div>
        <h1 className="lalibela-names">
          {i.brideName}
          <span>&</span>
          {i.groomName}
        </h1>
        {(i.brideNameAm || i.groomNameAm) && (
          <p className="lalibela-names-am" lang="am">
            {i.brideNameAm} ፧ {i.groomNameAm}
          </p>
        )}
        <p className="lalibela-date">{formatWeddingDate(i.weddingDate)}</p>
      </section>
      <section className="lalibela-blessing reveal" data-reveal>
        <Heart aria-hidden="true" />
        <p>{t.lalibelaBlessing}</p>
        <h2>{t.witness}</h2>
        <p>
          {localized(
            lang === "am" ? i.customMessageAm : i.customMessage,
            lang === "am" ? i.customMessage : i.customMessageAm,
          ) || t.fallbackMessage}
        </p>
      </section>
      <section className="lalibela-details reveal" data-reveal>
        <Detail
          icon={CalendarDays}
          label={t.date}
          value={formatWeddingDate(i.weddingDate)}
          tba={t.tba}
        />
        <Detail icon={Clock3} label={t.hour} value={i.weddingTime} tba={t.tba} />
        <Detail
          icon={MapPin}
          label={t.place}
          value={localized(
            lang === "am" ? i.venueAm : i.venue,
            lang === "am" ? i.venue : i.venueAm,
          )}
          tba={t.tba}
        />
      </section>
      <section className="invite-story lalibela-story reveal" data-reveal>
        <span>{t.lalibelaStory}</span>
        <h2>{t.storyHeadline}</h2>
        <p>{story}</p>
      </section>
      <Gallery images={i.galleryImages} hero={hero} lang={lang} />
      <Closing invitation={i} slug={slug} token={token} lang={lang} />
    </article>
  );
}

/**
 * Buna & Blessings — the Ethiopian coffee ceremony as an invitation.
 * Warm amber ground, a drawn jebena, and a soft radial glow like steam.
 */
function Buna({
  invitation: i,
  hero,
  compact,
  slug,
  token,
  lang = "am",
  onLangChange,
}: InvitationRendererProps & { hero: string; compact: boolean }) {
  const t = inviteCopy[lang];
  const story = localized(lang === "am" ? i.storyAm : i.story, lang === "am" ? i.story : i.storyAm);
  return (
    <article className={`invitation buna-invite ${compact ? "invite-compact" : ""}`} lang={lang}>
      {!compact && <LangToggle lang={lang} onLangChange={onLangChange} />}
      <section className="buna-hero reveal" data-reveal>
        <div className="buna-steam" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <p className="invite-kicker">{t.bunaKicker}</p>
        <h1 className="buna-names" lang="am">
          {i.brideNameAm || i.brideName}
          <span>{i.groomNameAm || i.groomName}</span>
        </h1>
        <div className="buna-photo">
          <img src={hero} alt={`${i.brideName} and ${i.groomName}`} width={1440} height={1808} />
        </div>
        <div className="buna-jebena" aria-hidden="true">
          <Coffee />
        </div>
        <p className="buna-script">
          {i.brideName} &amp; {i.groomName}
        </p>
      </section>
      <section className="buna-blessing reveal" data-reveal>
        <p className="invite-script">{t.bunaCeremonyNote}</p>
        <h2>{t.bunaBlessing}</h2>
        <p>{t.closing}</p>
      </section>
      <section className="buna-details reveal" data-reveal>
        <Detail
          icon={CalendarDays}
          label={t.date}
          value={formatWeddingDate(i.weddingDate)}
          tba={t.tba}
        />
        <Detail icon={Clock3} label={t.hour} value={i.weddingTime} tba={t.tba} />
        <Detail
          icon={MapPin}
          label={t.place}
          value={localized(
            lang === "am" ? i.venueAm : i.venue,
            lang === "am" ? i.venue : i.venueAm,
          )}
          tba={t.tba}
        />
      </section>
      <section className="invite-story buna-story reveal" data-reveal>
        <span>{t.bunaStory}</span>
        <h2>{t.ourStory}</h2>
        <p>{story}</p>
      </section>
      <Gallery images={i.galleryImages} hero={hero} lang={lang} />
      <Closing invitation={i} slug={slug} token={token} lang={lang} />
    </article>
  );
}

/**
 * Wonderland — an ornate, print-first keepsake. A gold hairline frame with
 * filigree corners, a full-width portrait that fades into the page, then the
 * names and message in a centred stack.
 *
 * Names, message, date and venue come from the invitation data (with the
 * language fallback), so this is a real template rather than hard-coded copy.
 */
function Wonderland({
  invitation: i,
  hero,
  compact,
  slug,
  token,
  lang = "am",
  onLangChange,
}: InvitationRendererProps & { hero: string; compact: boolean }) {
  const t = inviteCopy[lang];
  const first = lang === "am" ? i.brideNameAm || i.brideName : i.brideName;
  const second = lang === "am" ? i.groomNameAm || i.groomName : i.groomName;
  const message =
    localized(
      lang === "am" ? i.customMessageAm : i.customMessage,
      lang === "am" ? i.customMessage : i.customMessageAm,
    ) || t.fallbackMessage;
  const when = [formatWeddingDate(i.weddingDate), i.weddingTime].filter(Boolean).join(" · ");
  const where = localized(lang === "am" ? i.venueAm : i.venue, lang === "am" ? i.venue : i.venueAm);

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = `${i.brideName} & ${i.groomName}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text: message, url });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      // A cancelled share sheet throws AbortError -- nothing to report.
    }
  };

  return (
    <article
      className={`invitation wonderland-invite ${compact ? "invite-compact" : ""}`}
      lang={lang}
    >
      {!compact && <LangToggle lang={lang} onLangChange={onLangChange} />}
      <div className="invitation-sheet reveal" data-reveal>
        <div className="invitation-frame" aria-hidden="true" />
        <img
          className="ornate-frame ornate-frame--top-left"
          src={upperFrame}
          alt=""
          aria-hidden="true"
        />
        <img
          className="ornate-frame ornate-frame--bottom-right"
          src={lowerFrame}
          alt=""
          aria-hidden="true"
        />
        <div className="invitation-inner">
          <div className="invitation-photo-wrap">
            <img
              src={hero}
              alt={`${i.brideName} and ${i.groomName}`}
              className="invitation-photo"
              width={1000}
              height={795}
            />
          </div>
          <div className="invitation-details">
            <p className="invitation-kicker">{t.wonderlandKicker}</p>
            <h1 className="invitation-names">
              <span>{first}</span>
              <span className="invitation-ampersand">&amp;</span>
              <span>{second}</span>
            </h1>
            <p className="invitation-message">{message}</p>
            <p className="invitation-time">{when}</p>
            {where && <p className="invitation-address">{where}</p>}
          </div>
        </div>
      </div>
      {!compact && (
        <div className="invitation-actions">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer aria-hidden="true" /> Print
          </Button>
          <Button
            onClick={() => {
              void share();
            }}
          >
            <Share2 aria-hidden="true" /> Share invitation
          </Button>
        </div>
      )}
      <Gallery images={i.galleryImages} hero={hero} lang={lang} />
      <Closing invitation={i} slug={slug} token={token} lang={lang} />
    </article>
  );
}

function Gallery({ images, hero, lang }: { images: string[]; hero: string; lang: InviteLang }) {
  const t = inviteCopy[lang];
  const display = images.length ? images.slice(0, 3) : [hero, hero, hero];
  return (
    <section className="invite-gallery reveal" data-reveal>
      <p className="invite-kicker">{t.galleryKicker}</p>
      <h2>{t.galleryTitle}</h2>
      <div>
        {display.map((image, index) => (
          <img
            key={`${image}-${index}`}
            src={image}
            alt={`Wedding moment ${index + 1}`}
            loading="lazy"
          />
        ))}
      </div>
    </section>
  );
}

function Closing({
  invitation: i,
  slug,
  token,
  lang,
}: {
  invitation: WeddingInvitation;
  slug?: string | undefined;
  token?: string | undefined;
  lang: InviteLang;
}) {
  const t = inviteCopy[lang];
  return (
    <section className="invite-closing reveal" data-reveal>
      <p className="invite-script">{t.closing}</p>
      <h2>
        {i.brideName} <span>&</span> {i.groomName}
      </h2>
      {i.rsvpEnabled && slug ? (
        <RsvpForm
          slug={slug}
          token={token}
          deadline={i.rsvpDeadline ? formatWeddingDate(i.rsvpDeadline) : undefined}
          amharic={lang === "am"}
        />
      ) : i.rsvpEnabled ? (
        <div className="rsvp-block">
          <span>
            {t.replyBy} {i.rsvpDeadline ? formatWeddingDate(i.rsvpDeadline) : t.rsvpDate}
          </span>
          <strong>{i.phone || i.email}</strong>
        </div>
      ) : null}
      <MapSection mapsUrl={i.mapsUrl} venue={i.venue} address={i.address} label={t.viewLocation} />
      <BackgroundMusic url={i.musicUrl} />
    </section>
  );
}

/**
 * Embedded map plus a "View location" link.
 *
 * Google Maps needs an API key for a real embed, so instead of guessing one we
 * use the keyless `/maps?q=...&output=embed` form, which works for any public
 * place and needs no billing. A malformed or non-Google link is still useful
 * as a plain link, so the button renders regardless of whether the embed does.
 */
function MapSection({
  mapsUrl,
  venue,
  address,
  label,
}: {
  mapsUrl?: string | undefined;
  venue?: string | undefined;
  address?: string | undefined;
  label: string;
}) {
  if (!mapsUrl && !venue && !address) return null;
  const href =
    mapsUrl ??
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([venue, address].filter(Boolean).join(", "))}`;
  const embed =
    mapsUrl && /google\.[a-z.]+\/maps/i.test(mapsUrl)
      ? mapsUrl
      : `https://www.google.com/maps?q=${encodeURIComponent([venue, address].filter(Boolean).join(", ") || mapsUrl || "")}&output=embed`;
  return (
    <div className="invite-map">
      <iframe
        src={embed}
        title="Wedding venue location"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      <a href={href} target="_blank" rel="noreferrer">
        <MapPin /> {label}
      </a>
    </div>
  );
}

function OliviaEthanTemplate({
  invitation: i,
  hero,
  compact,
  slug,
  token,
  lang = "am",
  onLangChange,
}: InvitationRendererProps & { hero: string; compact: boolean }) {
  const t = inviteCopy[lang];
  const first = (lang === "am" ? i.brideNameAm || i.brideName : i.brideName).toUpperCase();
  const second = (lang === "am" ? i.groomNameAm || i.groomName : i.groomName).toUpperCase();
  const venueStr = (localized(lang === "am" ? i.venueAm : i.venue, lang === "am" ? i.venue : i.venueAm) || "THE GARDEN VALLEY HOTEL").toUpperCase();
  const addressStr = (localized(lang === "am" ? i.addressAm : i.address, lang === "am" ? i.address : i.addressAm) || "NAPA VALLEY, CALIFORNIA").toUpperCase();

  const d = i.weddingDate ? new Date(`${i.weddingDate}T12:00:00`) : new Date(2025, 7, 24);
  const dayNum = d.getDate();
  const monthName = d.toLocaleString(lang === "am" ? "am-ET" : "en-US", { month: "long" }).toUpperCase();
  const dayOfWeek = d.toLocaleString(lang === "am" ? "am-ET" : "en-US", { weekday: "long" }).toUpperCase();
  const yearNum = d.getFullYear();

  const story = localized(lang === "am" ? i.storyAm : i.story, lang === "am" ? i.story : i.storyAm) || i.howWeMet;

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = `${i.brideName} & ${i.groomName}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text: story || title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      /* ignore */
    }
  };

  return (
    <main className={`oe-page ${compact ? "invite-compact" : ""}`}>
      {!compact && <LangToggle lang={lang} onLangChange={onLangChange} />}
      <article className="oe-card">
        <img className="oe-leaf oe-leaf--top" src={leafTop} alt="" aria-hidden="true" />
        <img className="oe-leaf oe-leaf--bottom" src={leafBottom} alt="" aria-hidden="true" />
        <div className="oe-arch">
          <img src={hero} alt={`${i.brideName} and ${i.groomName}`} />
        </div>
        <div className="oe-text">
          <p className="oe-script" data-reveal data-fly="up">{lang === "am" ? "አብረው" : "together"}</p>
          <p className="oe-small" data-reveal data-fly="up">{lang === "am" ? "ከቤተሰቦቻቸው ጋር" : "WITH THEIR FAMILIES"}</p>
          <h1 className="oe-name" data-reveal data-fly="left">{first}</h1>
          <div className="oe-and" data-reveal data-fly="zoom">
            <span className="oe-rule" />
            <span className="oe-script">{lang === "am" ? "እና" : "and"}</span>
            <span className="oe-rule" />
          </div>
          <h1 className="oe-name" data-reveal data-fly="right">{second}</h1>
          <p className="oe-small oe-invite" data-reveal data-fly="up">
            {lang === "am" ? "የጋብቻቸውን በዓል እንድታከብሩ" : "JOYFULLY INVITE YOU TO"}<br />
            {lang === "am" ? "በደስታ ይጋብዙዎታል" : "CELEBRATE THEIR WEDDING"}
          </p>
          <div className="oe-date" data-reveal data-fly="zoom">
            <span className="oe-side">{dayOfWeek}</span>
            <span className="oe-day">
              <b>{dayNum}</b>
              <small>{monthName}</small>
            </span>
            <span className="oe-side">{yearNum}</span>
          </div>
          {i.weddingTime && <p className="oe-script" data-reveal data-fly="up">{i.weddingTime}</p>}
          <p className="oe-heart">♥</p>
          <p className="oe-venue" data-reveal data-fly="up">{venueStr}</p>
          <p className="oe-small" data-reveal data-fly="up">{addressStr}</p>
          <p className="oe-script oe-reception" data-reveal data-fly="up">{lang === "am" ? "ምግብና መስተንግዶ ይከተላል" : "reception to follow"}</p>
        </div>
      </article>

      {!compact && (
        <div className="invitation-actions" style={{ maxWidth: "760px", margin: "24px auto" }}>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer aria-hidden="true" /> Print
          </Button>
          <Button onClick={() => void share()}>
            <Share2 aria-hidden="true" /> Share invitation
          </Button>
        </div>
      )}

      {story && (
        <section className="oe-story-section reveal" data-reveal style={{ maxWidth: "760px", margin: "32px auto" }}>
          <p className="oe-script" style={{ textAlign: "center" }}>{lang === "am" ? "ታሪካችን" : "Our Story"}</p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "32px", textAlign: "center", margin: "12px 0 16px" }}>{t.storyHeadline}</h2>
          <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: "14px", lineHeight: "1.8", color: "var(--foreground)", textAlign: "center", margin: "0 auto", maxWidth: "600px" }}>{story}</p>
        </section>
      )}

      <Gallery images={i.galleryImages} hero={hero} lang={lang} />
      <Closing invitation={i} slug={slug} token={token} lang={lang} />
    </main>
  );
}
