import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import photo from "@/assets/olivia-ethan-photo.jpg";
import leafTop from "@/assets/leaf-corner-top.png";
import leafBottom from "@/assets/leaf-corner-bottom.png";

export const Route = createFileRoute("/olivia-ethan")({
  head: () => ({
    meta: [
      { title: "Garden Arch | Wedding Invitation" },
      { name: "description", content: "Join Olivia and Ethan on Saturday, 24 August 2025 at The Garden Valley Hotel, Napa Valley." },
      { property: "og:title", content: "Garden Arch | Wedding Invitation" },
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
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("reveal-on");
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.classList.toggle("is-revealed", entry.isIntersecting);
        }
      },
      { rootMargin: "-5% 0px -5% 0px", threshold: 0.1 }
    );
    for (const node of nodes) observer.observe(node);
    return () => {
      root.classList.remove("reveal-on");
      observer.disconnect();
    };
  }, []);

  return (
    <main className="oe-page">
      <article className="oe-card">
        <img className="oe-leaf oe-leaf--top" src={leafTop} alt="" aria-hidden="true" />
        <img className="oe-leaf oe-leaf--bottom" src={leafBottom} alt="" aria-hidden="true" />
        <div className="oe-arch">
          <img src={photo} alt="Olivia and Ethan embracing" />
        </div>
        <div className="oe-text">
          <p className="oe-script" data-reveal data-fly="up">together</p>
          <p className="oe-small" data-reveal data-fly="up">WITH THEIR FAMILIES</p>
          <h1 className="oe-name" data-reveal data-fly="left">OLIVIA</h1>
          <div className="oe-and" data-reveal data-fly="zoom"><span className="oe-rule" /><span className="oe-script">and</span><span className="oe-rule" /></div>
          <h1 className="oe-name" data-reveal data-fly="right">ETHAN</h1>
          <p className="oe-small oe-invite" data-reveal data-fly="up">JOYFULLY INVITE YOU TO<br />CELEBRATE THEIR WEDDING</p>
          <div className="oe-date" data-reveal data-fly="zoom">
            <span className="oe-side">SATURDAY</span>
            <span className="oe-day"><b>24</b><small>AUGUST</small></span>
            <span className="oe-side">2025</span>
          </div>
          <p className="oe-script" data-reveal data-fly="up">four o'clock</p>
          <p className="oe-small" data-reveal data-fly="up">IN THE AFTERNOON</p>
          <p className="oe-heart">♥</p>
          <p className="oe-venue" data-reveal data-fly="up">THE GARDEN VALLEY HOTEL</p>
          <p className="oe-small" data-reveal data-fly="up">123 BLOOMFIELD ROAD<br />NAPA VALLEY, CALIFORNIA</p>
          <p className="oe-script oe-reception" data-reveal data-fly="up">reception to follow</p>
        </div>
      </article>
    </main>
  );
}

