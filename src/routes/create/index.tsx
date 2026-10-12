import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Eye, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TEMPLATES_CATALOG } from "@/components/TemplatePickerModal";
import { isPaidTemplate, TEMPLATE_PRICE_ETB, formatEtb } from "@/lib/plans";

export const Route = createFileRoute("/create/")({
  head: () => ({
    meta: [
      { title: "Choose Your Invitation Design — Tizita" },
      {
        name: "description",
        content: "Select any of our 8 handcrafted Ethiopian wedding templates to begin personalizing your digital invitation.",
      },
      { property: "og:title", content: "Choose Your Invitation Design — Tizita" },
      { property: "og:description", content: "Eight unique Ethiopian designs for your special day." },
    ],
  }),
  component: ChooseTemplatePage,
});

function ChooseTemplatePage() {
  const [filter, setFilter] = useState<"all" | "traditional" | "modern" | "romantic">("all");

  const filtered =
    filter === "all"
      ? TEMPLATES_CATALOG
      : TEMPLATES_CATALOG.filter((item) => item.category === filter);

  return (
    <main className="choose-template-page min-h-screen bg-[oklch(0.985_0.005_85)]">
      <header className="choose-header sticky top-0 z-40 flex items-center justify-between px-6 md:px-12 py-4 bg-white/90 backdrop-blur-md border-b border-border/40">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <Link to="/" className="wordmark text-lg font-bold">
          <span>ትዝታ</span>TIZITA
        </Link>
      </header>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ETHIOPIAN WEDDING INVITATIONS</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">
            Choose Your Invitation Design
          </h1>
          <p className="text-muted-foreground text-base">
            Pick the design that best expresses your love story. You can customize all texts,
            photos, schedule, and RSVP options in the builder.
          </p>

          {/* Category filter pills */}
          <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
            {[
              { id: "all", label: "All Designs (8)" },
              { id: "traditional", label: "Traditional & Sacred" },
              { id: "modern", label: "Modern & Editorial" },
              { id: "romantic", label: "Romantic & Garden" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`picker-tab-pill ${filter === cat.id ? "active" : ""}`}
                onClick={() => setFilter(cat.id as typeof filter)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="picker-cards-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((template) => {
            const isPaid = isPaidTemplate(template.id);
            const priceText = isPaid
              ? `${formatEtb(TEMPLATE_PRICE_ETB[template.id])} · Premium`
              : "Free · ነፃ";

            return (
              <article className="picker-card" key={template.id}>
                <div className="picker-card-preview">
                  <img
                    src={template.image}
                    alt={template.name}
                    className="picker-card-img"
                    loading="lazy"
                  />
                  <div className="picker-badges">
                    <span className="picker-theme-pill">{template.badge}</span>
                    <span className={`picker-tier-pill ${isPaid ? "paid" : "free"}`}>
                      {priceText}
                    </span>
                  </div>
                </div>

                <div className="picker-card-body">
                  <div className="picker-card-header">
                    <h3>{template.name}</h3>
                    <small>{template.amName}</small>
                  </div>
                  <p className="picker-card-tag">{template.tag}</p>
                  <p className="picker-card-desc">{template.description}</p>

                  <div className="picker-card-actions">
                    <Button asChild variant="outline" size="sm" className="btn-preview">
                      <Link to="/templates/$templateId" params={{ templateId: template.id }}>
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Preview
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="btn-select">
                      <Link
                        to="/create/$templateId"
                        params={{ templateId: template.id }}
                        search={{}}
                      >
                        Choose
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}

