import { CalendarDays, Clock3, Heart, MapPin } from "lucide-react";
import royalPhoto from "@/assets/royal-couple.jpg";
import addisPhoto from "@/assets/addis-couple.jpg";
import romancePhoto from "@/assets/romance-couple.jpg";
import { formatWeddingDate, type WeddingInvitation } from "@/lib/invitation";

const fallbackPhotos = { "royal-tewahedo": royalPhoto, "addis-modern": addisPhoto, "habesha-romance": romancePhoto };

export function InvitationRenderer({ invitation, compact = false }: { invitation: WeddingInvitation; compact?: boolean }) {
  const hero = invitation.primaryPhotoUrl || fallbackPhotos[invitation.templateId];
  if (invitation.templateId === "addis-modern") return <Addis invitation={invitation} hero={hero} compact={compact} />;
  if (invitation.templateId === "habesha-romance") return <Romance invitation={invitation} hero={hero} compact={compact} />;
  return <Royal invitation={invitation} hero={hero} compact={compact} />;
}

function Detail({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value?: string }) {
  return <div className="invite-detail"><Icon aria-hidden="true"/><div><span>{label}</span><strong>{value || "To be announced"}</strong></div></div>;
}

function Royal({ invitation: i, hero, compact }: { invitation: WeddingInvitation; hero: string; compact: boolean }) {
  return <article className={`invitation royal-invite ${compact ? "invite-compact" : ""}`}>
    <section className="royal-hero">
      <div className="royal-pattern" aria-hidden="true" />
      <p className="invite-kicker">Two hearts · One sacred beginning</p>
      <div className="royal-photo-wrap"><img src={hero} alt={`${i.brideName} and ${i.groomName}`} width={1440} height={1808}/></div>
      <div className="royal-title"><h1>{i.brideName}<i>&</i>{i.groomName}</h1>{(i.brideNameAm || i.groomNameAm) && <p lang="am">{i.brideNameAm} ፧ {i.groomNameAm}</p>}</div>
      <p className="royal-date">{formatWeddingDate(i.weddingDate)}</p>
    </section>
    <section className="invite-section royal-welcome"><p className="invite-script">With joyful hearts</p><h2>We invite you to witness our beginning</h2><p>{i.customMessage || "Together with our families, we invite you to celebrate a sacred promise and a love made for forever."}</p></section>
    <section className="royal-details"><Detail icon={CalendarDays} label="The date" value={formatWeddingDate(i.weddingDate)}/><Detail icon={Clock3} label="The hour" value={i.weddingTime}/><Detail icon={MapPin} label="The place" value={i.venue}/></section>
    <section className="invite-story royal-story"><span>Our story</span><h2>Written by grace,<br/>held by love.</h2><p>{i.story}</p></section>
    <Gallery images={i.galleryImages} hero={hero}/><Closing invitation={i}/>
  </article>;
}

function Addis({ invitation: i, hero, compact }: { invitation: WeddingInvitation; hero: string; compact: boolean }) {
  return <article className={`invitation addis-invite ${compact ? "invite-compact" : ""}`}>
    <section className="addis-hero"><div className="addis-date-rail"><span>{new Date(`${i.weddingDate}T12:00:00`).getFullYear()}</span><span>ADDIS ABABA</span></div><div className="addis-copy"><p>Wedding journal · Issue No. 01</p><h1>{i.brideName}<br/><em>&</em> {i.groomName}</h1><div className="addis-am" lang="am">{i.brideNameAm} · {i.groomNameAm}</div></div><img src={hero} alt={`${i.brideName} and ${i.groomName}`} width={1440} height={1808}/><p className="addis-caption">Our forever<br/>starts here.</p></section>
    <section className="addis-intro"><span>01 / The story</span><p>{i.story}</p></section>
    <section className="addis-details"><div><span>When</span><h2>{formatWeddingDate(i.weddingDate)}</h2><p>{i.weddingTime}</p></div><div><span>Where</span><h2>{i.venue}</h2><p>{i.address}</p></div></section>
    <section className="addis-quote">“A life composed together.”</section><Gallery images={i.galleryImages} hero={hero}/><Closing invitation={i}/>
  </article>;
}

function Romance({ invitation: i, hero, compact }: { invitation: WeddingInvitation; hero: string; compact: boolean }) {
  return <article className={`invitation romance-invite ${compact ? "invite-compact" : ""}`}>
    <section className="romance-hero"><div className="petal petal-one"/><div className="petal petal-two"/><p className="invite-kicker">A love written in forever</p><h1 lang="am">በፍቅር ተጀምሮ<br/>ለዘላለም የሚቀጥል</h1><div className="romance-photo"><img src={hero} alt={`${i.brideName} and ${i.groomName}`} width={1440} height={1808}/></div><p className="invite-script">{i.brideName} & {i.groomName}</p><span>{formatWeddingDate(i.weddingDate)}</span></section>
    <section className="romance-intro"><Heart aria-hidden="true"/><h2>Two souls, one beautiful promise</h2><p>{i.story}</p>{i.storyAm && <p lang="am">{i.storyAm}</p>}</section>
    <section className="romance-details"><Detail icon={CalendarDays} label="Ceremony" value={`${formatWeddingDate(i.weddingDate)} · ${i.weddingTime || ""}`}/><Detail icon={MapPin} label="Reception" value={i.venue}/></section>
    <Gallery images={i.galleryImages} hero={hero}/><Closing invitation={i}/>
  </article>;
}

function Gallery({ images, hero }: { images: string[]; hero: string }) {
  const display = images.length ? images.slice(0, 3) : [hero, hero, hero];
  return <section className="invite-gallery"><p className="invite-kicker">Moments we treasure</p><h2>Our Gallery</h2><div>{display.map((image, index) => <img key={`${image}-${index}`} src={image} alt={`Wedding moment ${index + 1}`} loading="lazy"/>)}</div></section>;
}

function Closing({ invitation: i }: { invitation: WeddingInvitation }) {
  return <section className="invite-closing"><p className="invite-script">We cannot wait to celebrate with you</p><h2>{i.brideName} <span>&</span> {i.groomName}</h2>{i.rsvpEnabled && <div className="rsvp-block"><span>Kindly reply by {i.rsvpDeadline ? formatWeddingDate(i.rsvpDeadline) : "the RSVP date"}</span><strong>{i.phone || i.email}</strong></div>}{i.mapsUrl && <a href={i.mapsUrl} target="_blank" rel="noreferrer"><MapPin/> View location</a>}</section>;
}
