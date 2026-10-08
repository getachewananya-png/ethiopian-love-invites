import { createFileRoute } from "@tanstack/react-router";
import photo from "@/assets/olivia-ethan-photo.jpg";
import leafTop from "@/assets/leaf-corner-top.png";
import leafBottom from "@/assets/leaf-corner-bottom.png";

export const Route = createFileRoute("/olivia-ethan")({
  head: () => ({
    meta: [
      { title: "Olivia & Ethan | Wedding Invitation" },
      { name: "description", content: "Join Olivia and Ethan on Saturday, 24 August 2025 at The Garden Valley Hotel, Napa Valley." },
      { property: "og:title", content: "Olivia & Ethan | Wedding Invitation" },
      { property: "og:description", content: "Join Olivia and Ethan on Saturday, 24 August 2025 at The Garden Valley Hotel, Napa Valley." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Great+Vibes&family=Montserrat:wght@400;500&display=swap" },
    ],
  }),
  component: OliviaEthan,
});

function OliviaEthan() {
  return (
    <main className="oe-page">
      <article className="oe-card">
        <img className="oe-leaf oe-leaf--top" src={leafTop} alt="" aria-hidden="true" />
        <img className="oe-leaf oe-leaf--bottom" src={leafBottom} alt="" aria-hidden="true" />
        <div className="oe-arch">
          <img src={photo} alt="Olivia and Ethan embracing" />
        </div>
        <div className="oe-text">
          <p className="oe-script">together</p>
          <p className="oe-small">WITH THEIR FAMILIES</p>
          <h1 className="oe-name">OLIVIA</h1>
          <div className="oe-and"><span className="oe-rule" /><span className="oe-script">and</span><span className="oe-rule" /></div>
          <h1 className="oe-name">ETHAN</h1>
          <p className="oe-small oe-invite">JOYFULLY INVITE YOU TO<br />CELEBRATE THEIR WEDDING</p>
          <div className="oe-date">
            <span className="oe-side">SATURDAY</span>
            <span className="oe-day"><b>24</b><small>AUGUST</small></span>
            <span className="oe-side">2025</span>
          </div>
          <p className="oe-script">four o'clock</p>
          <p className="oe-small">IN THE AFTERNOON</p>
          <p className="oe-heart">♥</p>
          <p className="oe-venue">THE GARDEN VALLEY HOTEL</p>
          <p className="oe-small">123 BLOOMFIELD ROAD<br />NAPA VALLEY, CALIFORNIA</p>
          <p className="oe-script oe-reception">reception to follow</p>
        </div>
      </article>
    </main>
  );
}

