import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Eye, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import royalPhoto from "@/assets/royal-couple.jpg";
import addisPhoto from "@/assets/addis-couple.jpg";
import romancePhoto from "@/assets/romance-couple.jpg";
import charlesPhoto from "@/assets/charles-nicolle-photo.jpg";
import oliviaPhoto from "@/assets/olivia-ethan-photo.jpg";
import { isPaidTemplate, TEMPLATE_PRICE_ETB, formatEtb } from "@/lib/plans";
import type { TemplateId } from "@/lib/invitation";

export interface TemplatePickerItem {
  id: TemplateId;
  name: string;
  amName: string;
  tag: string;
  description: string;
  category: "all" | "traditional" | "modern" | "romantic";
  image: string;
  badge: string;
}

export const TEMPLATES_CATALOG: TemplatePickerItem[] = [
  {
    id: "royal-tewahedo",
    name: "Royal Tewahedo",
    amName: "ሮያል ተዋሕዶ",
    tag: "Sacred · Regal · Timeless",
    description: "A ceremonial study in deep burgundy, antique gold, and quiet reverence.",
    category: "traditional",
    image: royalPhoto,
    badge: "Gold & Burgundy",
  },
  {
    id: "addis-modern",
    name: "Addis Modern",
    amName: "አዲስ ሞደርን",
    tag: "Editorial · Minimal · Bold",
    description: "Clean lines and commanding photography shaped like a collector’s wedding journal.",
    category: "modern",
    image: addisPhoto,
    badge: "Contemporary Clean",
  },
  {
    id: "habesha-romance",
    name: "Habesha Romance",
    amName: "ሐበሻ ሮማንስ",
    tag: "Soft · Poetic · Intimate",
    description: "A garden love letter in rose, terracotta, and champagne light.",
    category: "romantic",
    image: romancePhoto,
    badge: "Blush & Champagne",
  },
  {
    id: "lalibela-stone",
    name: "Lalibela Stone",
    amName: "ላሊበላ ስቶን",
    tag: "Ancient · Sacred · Enduring",
    description: "Rock-hewn arches and warm ochre, for a love carved to last.",
    category: "traditional",
    image: royalPhoto,
    badge: "Ochre Arches",
  },
  {
    id: "buna-coffee",
    name: "Buna & Blessings",
    amName: "ቡና እና ምርቃት",
    tag: "Warm · Traditional · Generous",
    description: "The warmth of the coffee ceremony, poured into an intimate invitation.",
    category: "traditional",
    image: addisPhoto,
    badge: "Amber & Roasting Herb",
  },
  {
    id: "wonderland",
    name: "Wonderland",
    amName: "ወንደርላንድ",
    tag: "Ornate · Framed · Keepsake",
    description: "An ornate printed keepsake, framed in gold filigree with a portrait up top.",
    category: "modern",
    image: charlesPhoto,
    badge: "Gold Filigree Borders",
  },
  {
    id: "traditional",
    name: "Traditional",
    amName: "ባህላዊ ጥበብ",
    tag: "Tibeb · Stepped Cross · Ceremonial",
    description: "Woven tibeb borders, a stepped church cross, and the coffee ceremony, as printed in the market.",
    category: "traditional",
    image: charlesPhoto,
    badge: "Woven Tibeb Cloth",
  },
  {
    id: "olivia-ethan",
    name: "Garden Arch",
    amName: "ጋርደን አርች",
    tag: "Garden Arch · Leaf Motifs · Refined",
    description: "A refined garden arch layout with leaf corner motifs and classic typography.",
    category: "romantic",
    image: oliviaPhoto,
    badge: "Botanical Leaf Arch",
  },
];

interface TemplatePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (templateId: TemplateId) => void;
}

export function TemplatePickerModal({
  open,
  onOpenChange,
  onSelect,
}: TemplatePickerModalProps) {
  const [filter, setFilter] = useState<"all" | "traditional" | "modern" | "romantic">("all");

  const filtered =
    filter === "all"
      ? TEMPLATES_CATALOG
      : TEMPLATES_CATALOG.filter((item) => item.category === filter);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="template-picker-dialog max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ethiopian Wedding Invitation Designs</span>
          </div>
          <DialogTitle className="text-2xl font-serif font-bold">
            Choose Your Invitation Design
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Select a design to start personalizing your wedding invitation. You can customize all
            details, photos, music, and schedules in the builder.
          </DialogDescription>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 pt-2 flex-wrap">
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
        </DialogHeader>

        {/* Scrollable Template Cards Grid */}
        <div className="picker-grid-wrap flex-1 overflow-y-auto p-6">
          <div className="picker-cards-grid">
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
                        <Link
                          to="/templates/$templateId"
                          params={{ templateId: template.id }}
                          target="_blank"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Preview
                        </Link>
                      </Button>
                      <Button asChild size="sm" className="btn-select">
                        <Link
                          to="/create/$templateId"
                          params={{ templateId: template.id }}
                          search={{}}
                          onClick={() => {
                            onSelect?.(template.id);
                            onOpenChange(false);
                          }}
                        >
                          Choose Design
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
      </DialogContent>
    </Dialog>
  );
}

