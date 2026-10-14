import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  Check,
  Eye,
  Globe2,
  Heart,
  Menu,
  Music,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import royalPhoto from "@/assets/royal-couple.jpg";
import addisPhoto from "@/assets/addis-couple.jpg";
import romancePhoto from "@/assets/romance-couple.jpg";
import charlesPhoto from "@/assets/charles-nicolle-photo.jpg";
import oliviaPhoto from "@/assets/olivia-ethan-photo.jpg";
import leafTop from "@/assets/leaf-corner-top.png";
import leafBottom from "@/assets/leaf-corner-bottom.png";
import upperFrame from "@/assets/invitation-upper-left.png";
import lowerFrame from "@/assets/invitation-lower-right.png";
import { Button } from "@/components/ui/button";
import { AuthActions } from "@/components/AuthActions";
import { isPaidTemplate, TEMPLATE_PRICE_ETB, formatEtb } from "@/lib/plans";
import type { TemplateId } from "@/lib/invitation";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tizita — Ethiopian Digital Wedding Invitations" },
      {
        name: "description",
        content:
          "Create an elegant bilingual Ethiopian wedding invitation, add your photos and story, and share it with everyone you love.",
      },
      { property: "og:title", content: "Tizita — Ethiopian Digital Wedding Invitations" },
      { property: "og:description", content: "Your love story, beautifully invited." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

type Language = "en" | "am";
type Category = "all" | "traditional" | "modern" | "romantic";

const copy = {
  en: {
    navTemplates: "Templates",
    navHow: "How it works",
    navCreate: "Create yours",
    eyebrow: "Digital invitations, thoughtfully Ethiopian",
    titleA: "Your Love Story.",
    titleB: "Beautifully Invited.",
    intro:
      "Create a stunning digital wedding invitation in minutes. Choose a design, add your story and photos, and share your special day with everyone you love.",
    primary: "Create Your Invitation",
    secondary: "Explore Templates",
    choose: "Choose Your Love Story",
    chooseSub: "Eight unique designs. One unforgettable day.",
    preview: "Preview",
    use: "Choose this design",
    how: "How It Works",
    benefits: "Why Digital Invitations?",
    made: "Made for Ethiopian Weddings",
    final: "Your Wedding Deserves More Than a Message.",
    finalSub: "Create an invitation your guests will remember.",
    filterAll: "All Designs",
    filterTraditional: "Traditional & Sacred",
    filterModern: "Modern & Editorial",
    filterRomantic: "Romantic & Garden",
    quickPreview: "Quick Preview",
    viewDemo: "Live Demo",
    badgeFeature: "Amharic & English · Live RSVP · Map & Audio",
  },
  am: {
    navTemplates: "ዲዛይኖች",
    navHow: "እንዴት ይሰራል",
    navCreate: "ይፍጠሩ",
    eyebrow: "በኢትዮጵያዊ ስሜት የተዘጋጁ ዲጂታል ግብዣዎች",
    titleA: "የፍቅር ታሪክዎን",
    titleB: "በውብ ግብዣ ያካፍሉ።",
    intro:
      "የሰርግ ግብዣዎን በጥቂት ደቂቃዎች ይፍጠሩ። የሚወዱትን ዲዛይን ይምረጡ፣ የግብዣዎን መረጃ እና ፎቶዎች ያክሉ፣ ከዚያም ልዩ ሊንኩን ያጋሩ።",
    primary: "ግብዣዎን ይፍጠሩ",
    secondary: "ዲዛይኖችን ይመልከቱ",
    choose: "የፍቅር ታሪክዎን ይምረጡ",
    chooseSub: "ስምንት ልዩ ዲዛይኖች። አንድ የማይረሳ ቀን።",
    preview: "ይመልከቱ",
    use: "ይህን ዲዛይን ይምረጡ",
    how: "እንዴት ይሰራል",
    benefits: "ዲጂታል ግብዣ ለምን?",
    made: "ለኢትዮጵያ ሰርግ የተሰራ",
    final: "ሰርግዎ ከመልእክት በላይ ይገባዋል።",
    finalSub: "እንግዶችዎ የማይረሱትን ግብዣ ይፍጠሩ።",
    filterAll: "ሁሉም ዲዛይኖች",
    filterTraditional: "ባህላዊ እና ቅዱስ",
    filterModern: "ዘመናዊ እና ውብ",
    filterRomantic: "ሮማንቲክ እና አበቦች",
    quickPreview: "ፈጣን እይታ",
    viewDemo: "ቀጥታ ይመልከቱ",
    badgeFeature: "አማርኛ እና እንግሊዝኛ · አድራሻ እና ሙዚቃ",
  },
};

interface TemplateItem {
  id: TemplateId;
  name: string;
  amName: string;
  tag: string;
  description: string;
  category: Category;
  image: string;
  themeClass: string;
  accentLabel: string;
  features: string[];
}

const templates: TemplateItem[] = [
  {
    id: "custom-ai",
    name: "AI Custom Template",
    amName: "በ AI የተሰራ ልዩ ዲዛይን",
    tag: "Build Your Own · AI Reference · Bespoke",
    description: "Upload a reference design image, and our AI crafts a custom hero invitation for you.",
    category: "modern",
    image: royalPhoto,
    themeClass: "theme-royal",
    accentLabel: "✨ AI Custom Builder",
    features: ["Reference Image Input", "Procedural Artwork Synthesis", "Bilingual Support"],
  },
  {
    id: "royal-tewahedo",
    name: "Royal Tewahedo",
    amName: "ሮያል ተዋሕዶ",
    tag: "Sacred · Regal · Timeless",
    description: "A ceremonial study in deep burgundy, antique gold, and quiet reverence.",
    category: "traditional",
    image: royalPhoto,
    themeClass: "theme-royal",
    accentLabel: "Gold & Burgundy",
    features: ["Bilingual Ge'ez & English", "Ceremonial Framing", "Interactive RSVP"],
  },
  {
    id: "addis-modern",
    name: "Addis Modern",
    amName: "አዲስ ሞደርን",
    tag: "Editorial · Minimal · Bold",
    description: "Clean lines and commanding photography shaped like a collector’s wedding journal.",
    category: "modern",
    image: addisPhoto,
    themeClass: "theme-addis",
    accentLabel: "Contemporary Clean",
    features: ["Editorial Typography", "Photo Showcase", "Live Map Integration"],
  },
  {
    id: "habesha-romance",
    name: "Habesha Romance",
    amName: "ሐበሻ ሮማንስ",
    tag: "Soft · Poetic · Intimate",
    description: "A garden love letter in rose, terracotta, and champagne light.",
    category: "romantic",
    image: romancePhoto,
    themeClass: "theme-romance",
    accentLabel: "Blush & Champagne",
    features: ["Blush Petal Accents", "Background Music", "Story Section"],
  },
  {
    id: "lalibela-stone",
    name: "Lalibela Stone",
    amName: "ላሊበላ ስቶን",
    tag: "Ancient · Sacred · Enduring",
    description: "Rock-hewn arches and warm ochre, for a love carved to last.",
    category: "traditional",
    image: royalPhoto,
    themeClass: "theme-lalibela",
    accentLabel: "Ochre Arches",
    features: ["Carved Arches Motif", "Traditional Blessing", "RSVP Counter"],
  },
  {
    id: "buna-coffee",
    name: "Buna & Blessings",
    amName: "ቡና እና ምርቃት",
    tag: "Warm · Traditional · Generous",
    description: "The warmth of the coffee ceremony, poured into an intimate invitation.",
    category: "traditional",
    image: addisPhoto,
    themeClass: "theme-buna",
    accentLabel: "Amber & Roasting Herb",
    features: ["Jebena Motif", "Coffee Ceremony Story", "Family Greetings"],
  },
  {
    id: "wonderland",
    name: "Wonderland",
    amName: "ወንደርላንድ",
    tag: "Ornate · Framed · Keepsake",
    description: "An ornate printed keepsake, framed in gold filigree with a portrait up top.",
    category: "modern",
    image: charlesPhoto,
    themeClass: "theme-wonderland",
    accentLabel: "Gold Filigree Borders",
    features: ["Classic Keepsake", "Filigree Corners", "Detailed Schedule"],
  },
  {
    id: "traditional",
    name: "Traditional",
    amName: "ባህላዊ ጥበብ",
    tag: "Tibeb · Stepped Cross · Ceremonial",
    description: "Woven tibeb borders, a stepped church cross, and the coffee ceremony, as printed in the market.",
    category: "traditional",
    image: charlesPhoto,
    themeClass: "theme-traditional",
    accentLabel: "Woven Tibeb Cloth",
    features: ["Tibeb Woven Lattice", "Stepped Church Cross", "Dual Language"],
  },
  {
    id: "olivia-ethan",
    name: "Garden Arch",
    amName: "ጋርደን አርች",
    tag: "Garden Arch · Leaf Motifs · Refined",
    description: "A refined garden arch layout with leaf corner motifs and classic typography.",
    category: "romantic",
    image: oliviaPhoto,
    themeClass: "theme-olivia",
    accentLabel: "Botanical Leaf Arch",
    features: ["Botanical Foliage", "Arched Portrait Window", "Fly-in Motion"],
  },
];

const priceTag = (id: TemplateId) =>
  isPaidTemplate(id) ? `${formatEtb(TEMPLATE_PRICE_ETB[id])} · Premium` : "Free · ነፃ";

function FlowerRing() {
  const count = 16;
  return (
    <div className="flower-ring" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => {
        const degrees = (360 / count) * index;
        const radians = (degrees * Math.PI) / 180;
        const x = 50 + 50 * Math.sin(radians);
        const y = 50 - 50 * Math.cos(radians);
        const scale = 1 + ((index * 7) % 5) * 0.07;
        return (
          <i
            key={index}
            className="flower"
            style={{ left: `${x}%`, top: `${y}%`, "--s": String(scale) } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}

function Home() {
  const [language, setLanguage] = useState<Language>("en");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const t = copy[language];

  const categories: { id: Category; label: string; count: number }[] = [
    { id: "all", label: t.filterAll, count: templates.length },
    {
      id: "traditional",
      label: t.filterTraditional,
      count: templates.filter((item) => item.category === "traditional").length,
    },
    {
      id: "modern",
      label: t.filterModern,
      count: templates.filter((item) => item.category === "modern").length,
    },
    {
      id: "romantic",
      label: t.filterRomantic,
      count: templates.filter((item) => item.category === "romantic").length,
    },
  ];

  const filteredTemplates =
    activeCategory === "all"
      ? templates
      : templates.filter((item) => item.category === activeCategory);

  return (
    <main className="site-home" lang={language === "am" ? "am" : "en"}>
      <header className="site-header">
        <Link to="/" className="wordmark">
          <span>ትዝታ</span>TIZITA
        </Link>
        <nav className={menuOpen ? "open" : ""}>
          <a href="#templates">{t.navTemplates}</a>
          <a href="#how">{t.navHow}</a>
          <Link to="/create/$templateId" params={{ templateId: "royal-tewahedo" }} search={{}}>
            {t.navCreate}
          </Link>
        </nav>
        <div className="header-actions">
          <AuthActions />
          <button
            className="language-switch"
            onClick={() => setLanguage(language === "en" ? "am" : "en")}
            aria-label="Switch language"
          >
            <Globe2 />
            {language === "en" ? "አማ" : "EN"}
          </button>
          <button
            className="menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Open menu"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="home-hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span /> {t.eyebrow}
          </p>
          <h1>
            {t.titleA}
            <br />
            <em>{t.titleB}</em>
          </h1>
          <p className="hero-intro">{t.intro}</p>
          <div className="hero-actions">
            <Button asChild size="lg">
              <Link to="/create/$templateId" params={{ templateId: "royal-tewahedo" }} search={{}}>
                {t.primary}
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#templates">
                {t.secondary}
                <ArrowDown />
              </a>
            </Button>
          </div>
          <div className="hero-features-strip">
            <span>✦ Bilingual English & አማርኛ</span>
            <span>✦ Live RSVP Tracking</span>
            <span>✦ Music & Google Maps</span>
          </div>
        </div>

        <div className="hero-collage">
          {/* Main Royal Tewahedo card mockup */}
          <div className="hero-card hero-card--primary">
            <div className="hero-card-inner">
              <img
                src={royalPhoto}
                alt="Ethiopian wedding couple in Royal Tewahedo invitation"
                width={1440}
                height={1808}
                className="hero-card-img"
              />
              <div className="hero-card-frame" />
              <div className="hero-card-header">
                <span className="hero-card-pill">ROYAL TEWAHEDO · ሮያል ተዋሕዶ</span>
              </div>
              <div className="hero-card-footer">
                <p className="hero-card-script">Joyfully invite you to celebrate</p>
                <h3 className="hero-card-names">
                  Hana <span>&</span> Abebe
                </h3>
                <p className="hero-card-amharic">ሀና እና አቤቤ</p>
                <div className="hero-card-meta">
                  <span>ታኅሣሥ 12, 2026</span>
                  <i>·</i>
                  <span>HYATT REGENCY ADDIS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary card mockup */}
          <div className="hero-card hero-card--secondary">
            <div className="hero-card-inner">
              <img
                src={romancePhoto}
                alt="Romantic Ethiopian wedding celebration"
                width={1440}
                height={1808}
                className="hero-card-img"
              />
              <div className="hero-card-frame" />
              <div className="hero-floating-pill rsvp-pill">
                <Check className="h-3.5 w-3.5" />
                <span>180+ Guests RSVP'd</span>
              </div>
              <div className="hero-floating-pill music-pill">
                <Music className="h-3.5 w-3.5" />
                <span>Background Music</span>
              </div>
            </div>
          </div>

          {/* Bottom badge */}
          <div className="hero-floating-badge">
            <Sparkles className="h-4 w-4" />
            <span>8 Handcrafted Ethiopian Designs</span>
          </div>
          <p className="vertical-note">ADDIS ABABA · WITH LOVE</p>
        </div>
      </section>

      {/* Templates Collection Section */}
      <section id="templates" className="templates-section">
        <div className="section-heading">
          <p>THE COLLECTION · 2026</p>
          <h2>{t.choose}</h2>
          <span>{t.chooseSub}</span>

          {/* Category Filter Pills */}
          <div className="template-category-tabs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`category-tab ${activeCategory === cat.id ? "active" : ""}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <span>{cat.label}</span>
                <small>{cat.count}</small>
              </button>
            ))}
          </div>
        </div>

        {/* Template Gallery Grid */}
        <div className="template-grid">
          {filteredTemplates.map((template, index) => (
            <article className={`template-card ${template.themeClass}`} key={template.id}>
              {/* Card visual invitation preview */}
              <div className="template-card-preview">
                <div className="card-mockup-frame">
                  <img
                    src={template.image}
                    alt={`${template.name} wedding invitation`}
                    className="template-card-img"
                    loading="lazy"
                  />

                  {/* Themed decorative overlays */}
                  {template.id === "wonderland" && (
                    <>
                      <img
                        src={upperFrame}
                        alt=""
                        className="card-decor-corner top-left"
                        aria-hidden="true"
                      />
                      <img
                        src={lowerFrame}
                        alt=""
                        className="card-decor-corner bottom-right"
                        aria-hidden="true"
                      />
                    </>
                  )}
                  {template.id === "olivia-ethan" && (
                    <>
                      <img
                        src={leafTop}
                        alt=""
                        className="card-decor-leaf top-left"
                        aria-hidden="true"
                      />
                      <img
                        src={leafBottom}
                        alt=""
                        className="card-decor-leaf bottom-right"
                        aria-hidden="true"
                      />
                    </>
                  )}
                  {template.id === "traditional" && (
                    <div className="card-tibeb-strip" aria-hidden="true" />
                  )}
                  {template.id === "royal-tewahedo" && (
                    <div className="card-royal-trim" aria-hidden="true" />
                  )}

                  {/* Corner Pills: Theme tag & Tier */}
                  <div className="card-floating-badges">
                    <span className="card-accent-pill">{template.accentLabel}</span>
                    <span
                      className={`card-tier-pill ${isPaidTemplate(template.id) ? "paid" : "free"}`}
                    >
                      {priceTag(template.id)}
                    </span>
                  </div>

                  {/* Hover Overlay with Quick Preview */}
                  <div className="card-hover-overlay">
                    <Link
                      to="/templates/$templateId"
                      params={{ templateId: template.id }}
                      className="card-hover-btn"
                    >
                      <Eye className="h-4 w-4" />
                      <span>{t.preview}</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Card Details */}
              <div className="template-card-body">
                <div className="card-meta">
                  <span className="card-number">0{index + 1}</span>
                  <span className="card-tag">{template.tag}</span>
                </div>
                <div className="card-heading-row">
                  <h3 className="card-title">{template.name}</h3>
                  <small className="card-am-title">{template.amName}</small>
                </div>
                <p className="card-desc">{template.description}</p>

                {/* Feature tags */}
                <div className="card-feature-pills">
                  {template.features.map((feat) => (
                    <span key={feat} className="card-mini-feat">
                      {feat}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="card-actions">
                  <Button asChild variant="outline" size="sm" className="btn-preview">
                    <Link to="/templates/$templateId" params={{ templateId: template.id }}>
                      {t.preview}
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="btn-use">
                    <Link to="/create/$templateId" params={{ templateId: template.id }} search={{}}>
                      {t.use}
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how" className="how-section">
        <div className="section-heading light">
          <p>A SIMPLE BEGINNING</p>
          <h2>{t.how}</h2>
        </div>
        <div className="steps">
          {[
            ["01", "Choose a Design", "Pick the invitation style that fits your story."],
            ["02", "Make It Yours", "Add your names, wedding details, story, and favorite photos."],
            ["03", "Share the Love", "Get your personal invitation link and send it to your guests."],
          ].map(([number, title, text]) => (
            <div key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="benefit-title">
          <p>CELEBRATE WITH EASE</p>
          <h2>{t.benefits}</h2>
          <div className="benefit-image-card">
            <img
              src={addisPhoto}
              alt="Modern Ethiopian wedding"
              width={1440}
              height={1808}
              loading="lazy"
              className="benefit-img"
            />
            <div className="benefit-image-caption">
              <span>✦ ADDIS MODERN</span>
              <p>Tailored beautifully for smartphones & larger screens</p>
            </div>
          </div>
        </div>
        <div className="benefit-list">
          {[
            [Sparkles, "Beautiful", "Designed to feel as special as your wedding day."],
            [Check, "Easy", "Create your invitation in just a few thoughtful steps."],
            [Heart, "Shareable", "Send it through WhatsApp, Telegram, SMS, or social media."],
            [Smartphone, "Always Accessible", "Your guests can open it anytime from their phone."],
          ].map(([Icon, title, text], index) => {
            const BenefitIcon = Icon as typeof Sparkles;
            return (
              <div key={String(title)} className="benefit-card">
                <span>0{index + 1}</span>
                <BenefitIcon />
                <h3>{String(title)}</h3>
                <p>{String(text)}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Ethiopian Heritage Section */}
      <section className="ethiopian-section">
        <div>
          <p>ROOTED HERE. MADE FOR YOU.</p>
          <h2>{t.made}</h2>
          <p>
            Beautiful in English and አማርኛ, thoughtful about Ethiopian traditions, familiar venues, and
            the ways families truly share.
          </p>
          <div className="feature-pills">
            {["Amharic + English", "Ethiopian traditions", "Local venues", "WhatsApp sharing", "Mobile-first"].map(
              (item) => (
                <span key={item}>{item}</span>
              ),
            )}
          </div>
        </div>
        <div className="ethiopian-mark">
          <FlowerRing />
          <span>ፍቅር</span>
          <small>LOVE</small>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="final-cta">
        <p>YOUR STORY STARTS HERE</p>
        <h2>{t.final}</h2>
        <span>{t.finalSub}</span>
        <Button asChild size="lg">
          <Link to="/create/$templateId" params={{ templateId: "royal-tewahedo" }} search={{}}>
            {t.primary}
            <ArrowRight />
          </Link>
        </Button>
      </section>

      <footer>
        <Link to="/" className="wordmark">
          <span>ትዝታ</span>TIZITA
        </Link>
        <p>Invitations made with love in Addis Ababa.</p>
        <span>© 2026 Tizita Studio</span>
      </footer>
    </main>
  );
}
