import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, Check, Globe2, Heart, Menu, Smartphone, Sparkles, X } from "lucide-react";
import { useState } from "react";
import royalPhoto from "@/assets/royal-couple.jpg";
import addisPhoto from "@/assets/addis-couple.jpg";
import romancePhoto from "@/assets/romance-couple.jpg";
import charlesPhoto from "@/assets/charles-nicolle-photo.jpg";
import oliviaPhoto from "@/assets/olivia-ethan-photo.jpg";
import { Button } from "@/components/ui/button";
import { AuthActions } from "@/components/AuthActions";
import { isPaidTemplate, TEMPLATE_PRICE_ETB, formatEtb } from "@/lib/plans";
import type { TemplateId } from "@/lib/invitation";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Tizita — Ethiopian Digital Wedding Invitations" },
    { name: "description", content: "Create an elegant bilingual Ethiopian wedding invitation, add your photos and story, and share it with everyone you love." },
    { property: "og:title", content: "Tizita — Ethiopian Digital Wedding Invitations" },
    { property: "og:description", content: "Your love story, beautifully invited." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ]}), component: Home,
});

type Language = "en" | "am";
const copy = {
  en: { navTemplates: "Templates", navHow: "How it works", navCreate: "Create yours", eyebrow: "Digital invitations, thoughtfully Ethiopian", titleA: "Your Love Story.", titleB: "Beautifully Invited.", intro: "Create a stunning digital wedding invitation in minutes. Choose a design, add your story and photos, and share your special day with everyone you love.", primary: "Create Your Invitation", secondary: "Explore Templates", choose: "Choose Your Love Story", chooseSub: "Eight unique designs. One unforgettable day.", preview: "Preview", use: "Choose this design", how: "How It Works", benefits: "Why Digital Invitations?", made: "Made for Ethiopian Weddings", final: "Your Wedding Deserves More Than a Message.", finalSub: "Create an invitation your guests will remember." },
  am: { navTemplates: "ዲዛይኖች", navHow: "እንዴት ይሰራል", navCreate: "ይፍጠሩ", eyebrow: "በኢትዮጵያዊ ስሜት የተዘጋጁ ዲጂታል ግብዣዎች", titleA: "የፍቅር ታሪክዎን", titleB: "በውብ ግብዣ ያካፍሉ።", intro: "የሰርግ ግብዣዎን በጥቂት ደቂቃዎች ይፍጠሩ። የሚወዱትን ዲዛይን ይምረጡ፣ የግብዣዎን መረጃ እና ፎቶዎች ያክሉ፣ ከዚያም ልዩ ሊንኩን ያጋሩ።", primary: "ግብዣዎን ይፍጠሩ", secondary: "ዲዛይኖችን ይመልከቱ", choose: "የፍቅር ታሪክዎን ይምረጡ", chooseSub: "ስምንት ልዩ ዲዛይኖች። አንድ የማይረሳ ቀን።", preview: "ይመልከቱ", use: "ይህን ዲዛይን ይምረጡ", how: "እንዴት ይሰራል", benefits: "ዲጂታል ግብዣ ለምን?", made: "ለኢትዮጵያ ሰርግ የተሰራ", final: "ሰርግዎ ከመልእክት በላይ ይገባዋል።", finalSub: "እንግዶችዎ የማይረሱትን ግብዣ ይፍጠሩ።" },
};
const templates: { id: TemplateId; name: string; tag: string; description: string; image: string; className: string }[] = [
  { id: "royal-tewahedo", name: "Royal Tewahedo", tag: "Sacred · Regal · Timeless", description: "A ceremonial study in deep burgundy, antique gold, and quiet reverence.", image: royalPhoto, className: "showcase-royal" },
  { id: "addis-modern", name: "Addis Modern", tag: "Editorial · Minimal · Bold", description: "Clean lines and commanding photography shaped like a collector’s wedding journal.", image: addisPhoto, className: "showcase-addis" },
  { id: "habesha-romance", name: "Habesha Romance", tag: "Soft · Poetic · Intimate", description: "A garden love letter in rose, terracotta, and champagne light.", image: romancePhoto, className: "showcase-romance" },
  { id: "lalibela-stone", name: "Lalibela Stone", tag: "Ancient · Sacred · Enduring", description: "Rock-hewn arches and warm ochre, for a love carved to last.", image: royalPhoto, className: "showcase-lalibela" },
  { id: "buna-coffee", name: "Buna & Blessings", tag: "Warm · Traditional · Generous", description: "The warmth of the coffee ceremony, poured into an intimate invitation.", image: addisPhoto, className: "showcase-buna" },
  { id: "wonderland", name: "Wonderland", tag: "Ornate · Framed · Printable", description: "An ornate printed keepsake, framed in gold filigree with a portrait up top.", image: charlesPhoto, className: "showcase-wonderland" },
  { id: "traditional", name: "Traditional", tag: "Tibeb · Stepped Cross · Ceremonial", description: "Woven tibeb borders, a stepped church cross, and the coffee ceremony, as printed in the market.", image: charlesPhoto, className: "showcase-traditional" },
  { id: "olivia-ethan", name: "Garden Arch", tag: "Garden Arch · Leaf Motifs · Refined", description: "A refined garden arch layout with leaf corner motifs and classic typography.", image: oliviaPhoto, className: "showcase-olivia" },
];
const priceTag = (id: TemplateId) => isPaidTemplate(id) ? `${formatEtb(TEMPLATE_PRICE_ETB[id])} · Premium` : "Free";

/**
 * Wreath of blossoms circling the "ፍቅር" mark.
 *
 * Positions are computed in JS rather than with a CSS rotate+translate: a
 * `translateY(50%)` resolves against the flower's own size, not the ring, so a
 * pure-CSS ring collapses into a clump at the centre. Percentage left/top on a
 * square ring stays fluid at any mark size.
 */
function FlowerRing() {
  const count = 16;
  return <div className="flower-ring" aria-hidden="true">
    {Array.from({ length: count }, (_, index) => {
      const degrees = (360 / count) * index;
      const radians = (degrees * Math.PI) / 180;
      const x = 50 + 50 * Math.sin(radians);
      const y = 50 - 50 * Math.cos(radians);
      // Deterministic variation -- no Math.random, so SSR and client agree.
      const scale = 1 + ((index * 7) % 5) * 0.07;
      return <i
        key={index}
        className="flower"
        style={{ left: `${x}%`, top: `${y}%`, "--s": String(scale) } as React.CSSProperties}
      />;
    })}
  </div>;
}

function Home() {
  const [language, setLanguage] = useState<Language>("en"); const [menuOpen, setMenuOpen] = useState(false); const t = copy[language];
  return <main className="site-home" lang={language === "am" ? "am" : "en"}>
    <header className="site-header"><Link to="/" className="wordmark"><span>ትዝታ</span>TIZITA</Link><nav className={menuOpen ? "open" : ""}><a href="#templates">{t.navTemplates}</a><a href="#how">{t.navHow}</a><Link to="/create/$templateId" params={{ templateId: "royal-tewahedo" }}>{t.navCreate}</Link></nav><div className="header-actions"><AuthActions/><button className="language-switch" onClick={() => setLanguage(language === "en" ? "am" : "en")} aria-label="Switch language"><Globe2/>{language === "en" ? "አማ" : "EN"}</button><button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu">{menuOpen ? <X/> : <Menu/>}</button></div></header>
    <section className="home-hero"><div className="hero-copy"><p className="eyebrow"><span/> {t.eyebrow}</p><h1>{t.titleA}<br/><em>{t.titleB}</em></h1><p className="hero-intro">{t.intro}</p><div className="hero-actions"><Button asChild size="lg"><Link to="/create/$templateId" params={{ templateId: "royal-tewahedo" }}>{t.primary}<ArrowRight/></Link></Button><Button asChild size="lg" variant="outline"><a href="#templates">{t.secondary}<ArrowDown/></a></Button></div></div><div className="hero-collage"><div className="hero-main-photo"><img src={royalPhoto} alt="Ethiopian wedding couple" width={1440} height={1808}/><span>H + A</span></div><div className="hero-side-photo"><img src={romancePhoto} alt="Romantic Ethiopian wedding" width={1440} height={1808}/></div><p className="vertical-note">ADDIS ABABA · WITH LOVE</p></div></section>
    <section id="templates" className="templates-section"><div className="section-heading"><p>THE COLLECTION · 2026</p><h2>{t.choose}</h2><span>{t.chooseSub}</span></div><div className="template-showcases">{templates.map((template, index) => <article className={`template-showcase ${template.className}`} key={template.id}><div className="template-number">0{index + 1}</div><div className="template-image"><img src={template.image} alt={`${template.name} template`} width={1440} height={1808} loading="lazy"/><div className="template-image-frame"/></div><div className="template-info"><p>{template.tag}</p><h3>{template.name}</h3><span>{template.description}</span><em className={`tier-badge ${isPaidTemplate(template.id) ? "paid" : "free"}`}>{priceTag(template.id)}</em><div className="template-actions"><Button asChild variant="outline"><Link to="/templates/$templateId" params={{ templateId: template.id }}>{t.preview}</Link></Button><Button asChild><Link to="/create/$templateId" params={{ templateId: template.id }}>{t.use}<ArrowRight/></Link></Button></div></div></article>)}</div></section>
    <section id="how" className="how-section"><div className="section-heading light"><p>A SIMPLE BEGINNING</p><h2>{t.how}</h2></div><div className="steps">{[["01","Choose a Design","Pick the invitation style that fits your story."],["02","Make It Yours","Add your names, wedding details, story, and favorite photos."],["03","Share the Love","Get your personal invitation link and send it to your guests."]].map(([number,title,text])=><div key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></div>)}</div></section>
    <section className="benefits-section"><div className="benefit-title"><p>CELEBRATE WITH EASE</p><h2>{t.benefits}</h2><img src={addisPhoto} alt="Modern Ethiopian wedding" width={1440} height={1808} loading="lazy"/></div><div className="benefit-list">{[[Sparkles,"Beautiful","Designed to feel as special as your wedding day."],[Check,"Easy","Create your invitation in just a few thoughtful steps."],[Heart,"Shareable","Send it through WhatsApp, Telegram, SMS, or social media."],[Smartphone,"Always Accessible","Your guests can open it anytime from their phone."]].map(([Icon,title,text], index)=>{const BenefitIcon=Icon as typeof Sparkles; return <div key={String(title)}><span>0{index+1}</span><BenefitIcon/><h3>{String(title)}</h3><p>{String(text)}</p></div>})}</div></section>
    <section className="ethiopian-section"><div><p>ROOTED HERE. MADE FOR YOU.</p><h2>{t.made}</h2><p>Beautiful in English and አማርኛ, thoughtful about Ethiopian traditions, familiar venues, and the ways families truly share.</p><div className="feature-pills">{["Amharic + English","Ethiopian traditions","Local venues","WhatsApp sharing","Mobile-first"].map(item=><span key={item}>{item}</span>)}</div></div><div className="ethiopian-mark"><FlowerRing/><span>ፍቅር</span><small>LOVE</small></div></section>
    <section className="final-cta"><p>YOUR STORY STARTS HERE</p><h2>{t.final}</h2><span>{t.finalSub}</span><Button asChild size="lg"><Link to="/create/$templateId" params={{ templateId: "royal-tewahedo" }}>{t.primary}<ArrowRight/></Link></Button></section>
    <footer><Link to="/" className="wordmark"><span>ትዝታ</span>TIZITA</Link><p>Invitations made with love in Addis Ababa.</p><span>© 2026 Tizita Studio</span></footer>
  </main>;
}
