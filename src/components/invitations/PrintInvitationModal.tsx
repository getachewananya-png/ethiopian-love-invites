import { useRef, useState } from "react";
import { Download, Globe, LoaderCircle, Printer, X, Image as ImageIcon, Sparkles } from "lucide-react";
import { toPng, toJpeg } from "html-to-image";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatWeddingDate, templateMeta, type TemplateId, type WeddingInvitation } from "@/lib/invitation";
import { inviteCopy, localized, type InviteLang } from "@/lib/invite-copy";

// Template art and assets
import royalPhoto from "@/assets/royal-couple.jpg";
import addisPhoto from "@/assets/addis-couple.jpg";
import romancePhoto from "@/assets/romance-couple.jpg";
import charlesPhoto from "@/assets/charles-nicolle-photo.jpg";
import oliviaPhoto from "@/assets/olivia-ethan-photo.jpg";
import leafTop from "@/assets/leaf-corner-top.png";
import leafBottom from "@/assets/leaf-corner-bottom.png";
import upperFrame from "@/assets/invitation-upper-left.png";
import lowerFrame from "@/assets/invitation-lower-right.png";
import { EthiopianBloom, BloomDivider, BloomGarland } from "@/components/invitations/EthiopianBloom";

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

interface PrintInvitationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invitation: WeddingInvitation;
}

export function PrintInvitationModal({
  open,
  onOpenChange,
  invitation,
}: PrintInvitationModalProps) {
  const [lang, setLang] = useState<InviteLang>("am");
  const [exporting, setExporting] = useState<"png" | "jpeg" | "print" | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const hero = invitation.primaryPhotoUrl || fallbackPhotos[invitation.templateId] || royalPhoto;

  const getSafeFileName = (extension: string) => {
    const bride = (invitation.brideName || "bride").toLowerCase().replace(/[^a-z0-9]/g, "-");
    const groom = (invitation.groomName || "groom").toLowerCase().replace(/[^a-z0-9]/g, "-");
    return `${bride}-and-${groom}-wedding-invitation.${extension}`;
  };

  const handleExport = async (format: "png" | "jpeg") => {
    if (!cardRef.current) return;
    setExporting(format);

    try {
      if (typeof document !== "undefined" && document.fonts) {
        await document.fonts.ready;
      }

      // Ensure images in card are completely loaded
      const images = Array.from(cardRef.current.querySelectorAll("img"));
      await Promise.all(
        images.map((img) => {
          if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );

      const exportFn = format === "png" ? toPng : toJpeg;
      const dataUrl = await exportFn(cardRef.current, {
        pixelRatio: 2,
        quality: 0.96,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });

      const downloadLink = document.createElement("a");
      downloadLink.href = dataUrl;
      downloadLink.download = getSafeFileName(format === "png" ? "png" : "jpg");
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      toast.success(
        `Invitation image (${format.toUpperCase()}) downloaded successfully!`
      );
    } catch (err) {
      console.error("Failed to export invitation image:", err);
      toast.error("Could not export image. Please try again or use the print option.");
    } finally {
      setExporting(null);
    }
  };

  const handlePrint = async () => {
    if (!cardRef.current) return;
    setExporting("print");

    try {
      if (typeof document !== "undefined" && document.fonts) {
        await document.fonts.ready;
      }

      const images = Array.from(cardRef.current.querySelectorAll("img"));
      await Promise.all(
        images.map((img) => {
          if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );

      // Render high-res PNG and print via dedicated window for 100% pixel-perfect print
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2.5,
        quality: 0.98,
        backgroundColor: "#ffffff",
      });

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        // Fallback to window.print() if popup blocked
        window.print();
        return;
      }

      const title = `${invitation.brideName} & ${invitation.groomName} — Wedding Invitation`;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${title}</title>
            <style>
              @page {
                size: auto;
                margin: 8mm;
              }
              body {
                margin: 0;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                background-color: #ffffff;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              img {
                max-width: 100%;
                max-height: 96vh;
                object-fit: contain;
                display: block;
                box-shadow: none !important;
              }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" alt="${title}" onload="setTimeout(() => { window.print(); window.close(); }, 350);" />
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.error("Print generation failed:", err);
      window.print();
    } finally {
      setExporting(null);
    }
  };

  const templateName = templateMeta[invitation.templateId]?.name ?? "Wedding Invitation";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
        <DialogHeader className="p-4 sm:p-6 pb-4 border-b border-border/50 bg-white/95 dark:bg-card/95 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                <Printer className="w-3.5 h-3.5" />
                <span>Print & Export Invitation</span>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-serif">
                {templateName} Card
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Download a crystal-clear image of your design or print directly to photo paper or PDF.
              </DialogDescription>
            </div>

            {/* Language & Actions bar */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Language toggle */}
              <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/40">
                <button
                  type="button"
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    lang === "am"
                      ? "bg-white dark:bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setLang("am")}
                >
                  አማርኛ
                </button>
                <button
                  type="button"
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    lang === "en"
                      ? "bg-white dark:bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setLang("en")}
                >
                  English
                </button>
              </div>

              {/* Action Buttons */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("jpeg")}
                disabled={Boolean(exporting)}
                className="text-xs"
              >
                {exporting === "jpeg" ? (
                  <LoaderCircle className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
                )}
                JPG
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("png")}
                disabled={Boolean(exporting)}
                className="text-xs font-semibold border-primary/30 text-primary hover:bg-primary/5"
              >
                {exporting === "png" ? (
                  <LoaderCircle className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                )}
                Download PNG
              </Button>

              <Button
                size="sm"
                onClick={handlePrint}
                disabled={Boolean(exporting)}
                className="text-xs shadow-sm"
              >
                {exporting === "print" ? (
                  <LoaderCircle className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Printer className="w-3.5 h-3.5 mr-1.5" />
                )}
                Print Card
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Card Preview Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center bg-[oklch(0.96_0.005_80)] dark:bg-neutral-900">
          <div className="print-canvas-wrapper relative w-full flex justify-center py-2">
            {/* The exact printable card container captured by html-to-image */}
            <div
              ref={cardRef}
              className="printable-card-sheet bg-white text-foreground shadow-2xl relative overflow-hidden"
              style={{
                width: "min(100%, 680px)",
                margin: "0 auto",
                backgroundColor: "#ffffff",
              }}
            >
              <PrintableCardContent
                invitation={invitation}
                hero={hero}
                lang={lang}
              />
            </div>
          </div>
        </div>

        {/* Modal footer tip */}
        <div className="px-6 py-2.5 bg-white dark:bg-card border-t border-border/40 text-center text-xs text-muted-foreground flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Image export is calibrated at 300 DPI high resolution for physical printing and framing.
          </span>
          <span className="hidden sm:inline">Exact typography &amp; layout</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Renders the exact, authentic wedding invitation card for whichever template the couple selected.
 */
function PrintableCardContent({
  invitation: i,
  hero,
  lang,
}: {
  invitation: WeddingInvitation;
  hero: string;
  lang: InviteLang;
}) {
  const t = inviteCopy[lang];

  // 1. Olivia & Ethan
  if (i.templateId === "olivia-ethan") {
    const first = (lang === "am" ? i.brideNameAm || i.brideName : i.brideName).toUpperCase();
    const second = (lang === "am" ? i.groomNameAm || i.groomName : i.groomName).toUpperCase();
    const venueStr = (localized(lang === "am" ? i.venueAm : i.venue, lang === "am" ? i.venue : i.venueAm) || "THE GARDEN VALLEY HOTEL").toUpperCase();
    const addressStr = (localized(lang === "am" ? i.addressAm : i.address, lang === "am" ? i.address : i.addressAm) || "NAPA VALLEY, CALIFORNIA").toUpperCase();

    const d = i.weddingDate ? new Date(`${i.weddingDate}T12:00:00`) : new Date(2025, 7, 24);
    const dayNum = d.getDate();
    const monthName = d.toLocaleString(lang === "am" ? "am-ET" : "en-US", { month: "long" }).toUpperCase();
    const dayOfWeek = d.toLocaleString(lang === "am" ? "am-ET" : "en-US", { weekday: "long" }).toUpperCase();
    const yearNum = d.getFullYear();

    return (
      <article className="oe-card oe-card--printable">
        <img className="oe-leaf oe-leaf--top" src={leafTop} alt="" aria-hidden="true" />
        <img className="oe-leaf oe-leaf--bottom" src={leafBottom} alt="" aria-hidden="true" />
        <div className="oe-arch">
          <img src={hero} alt={`${i.brideName} & ${i.groomName}`} />
        </div>
        <div className="oe-text">
          <p className="oe-script">{lang === "am" ? "አብረው" : "together"}</p>
          <p className="oe-small">{lang === "am" ? "ከቤተሰቦቻቸው ጋር" : "WITH THEIR FAMILIES"}</p>
          <h1 className="oe-name">{first}</h1>
          <div className="oe-and">
            <span className="oe-rule" />
            <span className="oe-script">{lang === "am" ? "እና" : "and"}</span>
            <span className="oe-rule" />
          </div>
          <h1 className="oe-name">{second}</h1>
          <p className="oe-small oe-invite">
            {lang === "am" ? "የጋብቻቸውን በዓል እንድታከብሩ" : "JOYFULLY INVITE YOU TO"}<br />
            {lang === "am" ? "በደስታ ይጋብዙዎታል" : "CELEBRATE THEIR WEDDING"}
          </p>
          <div className="oe-date">
            <span className="oe-side">{dayOfWeek}</span>
            <span className="oe-day">
              <b>{dayNum}</b>
              <small>{monthName}</small>
            </span>
            <span className="oe-side">{yearNum}</span>
          </div>
          {i.weddingTime && <p className="oe-script">{i.weddingTime}</p>}
          <p className="oe-heart">♥</p>
          <p className="oe-venue">{venueStr}</p>
          <p className="oe-small">{addressStr}</p>
          <p className="oe-script oe-reception">
            {lang === "am" ? "ምግብና መስተንግዶ ይከተላል" : "reception to follow"}
          </p>
        </div>
      </article>
    );
  }

  // 2. Wonderland
  if (i.templateId === "wonderland") {
    const first = lang === "am" ? i.brideNameAm || i.brideName : i.brideName;
    const second = lang === "am" ? i.groomNameAm || i.groomName : i.groomName;
    const when = `${formatWeddingDate(i.weddingDate)}${i.weddingTime ? ` · ${i.weddingTime}` : ""}`;
    const where = localized(
      lang === "am" ? [i.venueAm, i.addressAm].filter(Boolean).join("፣ ") : [i.venue, i.address].filter(Boolean).join(", "),
      [i.venue, i.address].filter(Boolean).join(", "),
    );
    const message = localized(
      lang === "am" ? i.customMessageAm : i.customMessage,
      lang === "am" ? i.customMessage : i.customMessageAm,
    ) || t.fallbackMessage;

    return (
      <div className="wonderland-invite" style={{ width: "100%", background: "#ffffff" }}>
        <div className="invitation-sheet" style={{ margin: 0, width: "100%", boxShadow: "none" }}>
          <div className="invitation-frame" aria-hidden="true" />
          <img className="ornate-frame ornate-frame--top-left" src={upperFrame} alt="" aria-hidden="true" />
          <img className="ornate-frame ornate-frame--bottom-right" src={lowerFrame} alt="" aria-hidden="true" />
          <div className="invitation-inner">
            <div className="invitation-photo-wrap">
              <img src={hero} alt={`${i.brideName} and ${i.groomName}`} className="invitation-photo" />
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
      </div>
    );
  }

  // 3. Royal Tewahedo & Traditional
  if (i.templateId === "royal-tewahedo" || i.templateId === "traditional") {
    const venueText = localized(lang === "am" ? i.venueAm : i.venue, lang === "am" ? i.venue : i.venueAm);
    const addressText = localized(lang === "am" ? i.addressAm : i.address, lang === "am" ? i.address : i.addressAm);
    const message = localized(lang === "am" ? i.customMessageAm : i.customMessage, lang === "am" ? i.customMessage : i.customMessageAm) || t.fallbackMessage;

    return (
      <article className="invitation royal-invite royal-printable-sheet" lang={lang} style={{ width: "100%", padding: "40px 24px" }}>
        <section className="royal-hero" style={{ padding: 0 }}>
          <div className="royal-cross" aria-hidden="true" style={{ margin: "0 auto 12px" }}>
            <svg viewBox="0 0 48 62" focusable="false" style={{ width: 36, height: 46 }}>
              <path d="M19 0h10v20h19v9H29v33h-10V29H0v-9h19Z" fill="currentColor" />
              <circle cx="24" cy="24.5" r="4.5" fill="#3a1220" />
            </svg>
          </div>
          <p className="invite-kicker" style={{ margin: "0 0 16px" }}>{t.kickerRoyal}</p>
          <div className="royal-arch" style={{ margin: "0 auto 20px", maxWidth: "420px" }}>
            <BloomGarland className="royal-garland" />
            <div className="royal-photo-wrap">
              <img src={hero} alt={`${i.brideName} and ${i.groomName}`} />
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
          <div className="royal-title" style={{ margin: "16px 0" }}>
            <h1 style={{ fontSize: "2.4rem", margin: "0 0 6px" }}>
              {i.brideName}
              <i style={{ margin: "0 8px" }}>&</i>
              {i.groomName}
            </h1>
            {(i.brideNameAm || i.groomNameAm) && (
              <p lang="am" style={{ fontSize: "1.1rem" }}>
                {i.brideNameAm} ፧ {i.groomNameAm}
              </p>
            )}
          </div>
          <BloomDivider className="royal-divider" />
          <p className="royal-date" style={{ margin: "12px 0 16px", fontSize: "1.15rem" }}>
            {formatWeddingDate(i.weddingDate)} {i.weddingTime ? `· ${i.weddingTime}` : ""}
          </p>
        </section>

        <section className="invite-section royal-welcome" style={{ padding: "20px 0 10px", textAlign: "center" }}>
          <span className="royal-rosette" aria-hidden="true" style={{ display: "inline-block", margin: "0 0 8px" }}>
            <EthiopianBloom size={28} tone="wine" />
          </span>
          <p className="invite-script" style={{ fontSize: "1.35rem", margin: "0 0 6px" }}>{t.joyfulHearts}</p>
          <h2 style={{ fontSize: "1.5rem", margin: "0 0 10px" }}>{t.witness}</h2>
          <p style={{ maxWidth: "480px", margin: "0 auto", lineHeight: 1.6 }}>{message}</p>
        </section>

        <div className="royal-print-venue" style={{ marginTop: 24, textAlign: "center", borderTop: "1px solid oklch(0.85 0.08 60 / 40%)", paddingTop: 16 }}>
          <p style={{ fontWeight: 600, fontSize: "1.1rem", margin: "0 0 4px" }}>{venueText}</p>
          {addressText && <p style={{ fontSize: "0.95rem", color: "oklch(0.4 0.04 40)", margin: 0 }}>{addressText}</p>}
        </div>
      </article>
    );
  }

  // 4. Addis Modern
  if (i.templateId === "addis-modern") {
    const venueText = localized(lang === "am" ? i.venueAm : i.venue, lang === "am" ? i.venue : i.venueAm);
    const addressText = localized(lang === "am" ? i.addressAm : i.address, lang === "am" ? i.address : i.addressAm);

    return (
      <article className="invitation addis-invite addis-printable-sheet" lang={lang} style={{ width: "100%", padding: "36px 28px" }}>
        <section className="addis-hero" style={{ padding: 0 }}>
          <div className="addis-date-rail">
            <span>{new Date(`${i.weddingDate}T12:00:00`).getFullYear()}</span>
            <span>{t.addisCity}</span>
          </div>
          <div className="addis-copy">
            <p>{t.journal}</p>
            <h1 style={{ fontSize: "2.3rem", lineHeight: 1.1 }}>
              {i.brideName}
              <br />
              <em>&</em> {i.groomName}
            </h1>
            <div className="addis-am" lang="am">
              {i.brideNameAm} · {i.groomNameAm}
            </div>
          </div>
          <img src={hero} alt={`${i.brideName} & ${i.groomName}`} width={1440} height={1808} style={{ borderRadius: "0.5rem" }} />
          <p className="addis-caption">
            {t.addisCaption}
          </p>
        </section>

        <section className="addis-details" style={{ padding: "28px 0 10px" }}>
          <div>
            <span>{t.addisWhen}</span>
            <h2 style={{ fontSize: "1.4rem" }}>{formatWeddingDate(i.weddingDate)}</h2>
            <p>{i.weddingTime}</p>
          </div>
          <div>
            <span>{t.addisWhere}</span>
            <h2 style={{ fontSize: "1.4rem" }}>{venueText}</h2>
            <p>{addressText}</p>
          </div>
        </section>
      </article>
    );
  }

  // 5. Habesha Romance
  if (i.templateId === "habesha-romance") {
    const venueText = localized(lang === "am" ? i.venueAm : i.venue, lang === "am" ? i.venue : i.venueAm);
    const addressText = localized(lang === "am" ? i.addressAm : i.address, lang === "am" ? i.address : i.addressAm);

    return (
      <article className="invitation romance-invite romance-printable-sheet" lang={lang} style={{ width: "100%", padding: "36px 24px" }}>
        <section className="romance-hero" style={{ padding: 0 }}>
          <p className="invite-kicker">{t.romanceKicker}</p>
          <div className="romance-photo" style={{ margin: "16px auto", maxWidth: "380px" }}>
            <img src={hero} alt={`${i.brideName} & ${i.groomName}`} />
          </div>
          <p className="invite-script" style={{ fontSize: "2rem", margin: "14px 0 6px" }}>
            {i.brideName} &amp; {i.groomName}
          </p>
          {(i.brideNameAm || i.groomNameAm) && (
            <p lang="am" style={{ fontSize: "1.1rem", margin: "0 0 10px", color: "oklch(0.45 0.08 20)" }}>
              {i.brideNameAm} ፧ {i.groomNameAm}
            </p>
          )}
          <span style={{ fontSize: "1.15rem", fontWeight: 600 }}>
            {formatWeddingDate(i.weddingDate)} {i.weddingTime ? `· ${i.weddingTime}` : ""}
          </span>
        </section>

        <div style={{ textAlign: "center", marginTop: 24, borderTop: "1px solid oklch(0.9 0.03 20)", paddingTop: 16 }}>
          <h2 style={{ fontSize: "1.3rem", margin: "0 0 4px", fontFamily: "'Playfair Display', Georgia, serif" }}>{venueText}</h2>
          {addressText && <p style={{ fontSize: "0.95rem", color: "oklch(0.45 0.04 20)", margin: 0 }}>{addressText}</p>}
        </div>
      </article>
    );
  }

  // 6. Lalibela Stone
  if (i.templateId === "lalibela-stone") {
    const venueText = localized(lang === "am" ? i.venueAm : i.venue, lang === "am" ? i.venue : i.venueAm);
    const addressText = localized(lang === "am" ? i.addressAm : i.address, lang === "am" ? i.address : i.addressAm);

    return (
      <article className="invitation lalibela-invite lalibela-printable-sheet" lang={lang} style={{ width: "100%", padding: "36px 24px" }}>
        <section className="lalibela-hero" style={{ padding: 0, textAlign: "center" }}>
          <div className="lalibela-cross-top" aria-hidden="true" style={{ margin: "0 auto 12px" }}>
            <span style={{ fontSize: "28px", color: "oklch(0.45 0.08 45)" }}>✚</span>
          </div>
          <p className="invite-kicker">{t.kickerRoyal}</p>
          <div className="lalibela-arch-photo" style={{ margin: "14px auto", maxWidth: "380px", borderRadius: "120px 120px 8px 8px", overflow: "hidden" }}>
            <img src={hero} alt={`${i.brideName} & ${i.groomName}`} style={{ width: "100%", display: "block" }} />
          </div>
          <h1 className="lalibela-names" style={{ fontSize: "2.3rem", margin: "14px 0 6px" }}>
            {i.brideName} &amp; {i.groomName}
          </h1>
          {(i.brideNameAm || i.groomNameAm) && (
            <p lang="am" style={{ fontSize: "1.1rem", margin: "0 0 10px" }}>
              {i.brideNameAm} ፧ {i.groomNameAm}
            </p>
          )}
          <p style={{ fontSize: "1.15rem", fontWeight: 500, margin: "8px 0" }}>
            {formatWeddingDate(i.weddingDate)} {i.weddingTime ? `· ${i.weddingTime}` : ""}
          </p>
          <div style={{ marginTop: 18, borderTop: "1px solid oklch(0.8 0.03 45)", paddingTop: 14 }}>
            <h3 style={{ fontSize: "1.2rem", margin: "0 0 4px" }}>{venueText}</h3>
            {addressText && <p style={{ fontSize: "0.95rem", margin: 0 }}>{addressText}</p>}
          </div>
        </section>
      </article>
    );
  }

  // 7. Buna & Blessings (buna-coffee)
  const venueText = localized(lang === "am" ? i.venueAm : i.venue, lang === "am" ? i.venue : i.venueAm);
  const addressText = localized(lang === "am" ? i.addressAm : i.address, lang === "am" ? i.address : i.addressAm);

  return (
    <article className="invitation buna-invite buna-printable-sheet" lang={lang} style={{ width: "100%", padding: "36px 24px" }}>
      <section className="buna-hero" style={{ padding: 0, textAlign: "center" }}>
        <p className="buna-kicker" style={{ fontSize: "0.875rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "oklch(0.5 0.08 40)" }}>
          {lang === "am" ? "የፍቅር እና የበረከት ጥሪ" : "BLESSED CELEBRATION"}
        </p>
        <div style={{ margin: "14px auto", maxWidth: "380px", borderRadius: "100px 100px 12px 12px", overflow: "hidden", border: "2px solid oklch(0.7 0.08 40)" }}>
          <img src={hero} alt={`${i.brideName} & ${i.groomName}`} style={{ width: "100%", display: "block" }} />
        </div>
        <h1 className="buna-names" style={{ fontSize: "2.3rem", margin: "14px 0 6px" }}>
          {i.brideName} &amp; {i.groomName}
        </h1>
        {(i.brideNameAm || i.groomNameAm) && (
          <p lang="am" style={{ fontSize: "1.1rem", margin: "0 0 10px" }}>
            {i.brideNameAm} ፧ {i.groomNameAm}
          </p>
        )}
        <p style={{ fontSize: "1.15rem", fontWeight: 600, margin: "8px 0" }}>
          {formatWeddingDate(i.weddingDate)} {i.weddingTime ? `· ${i.weddingTime}` : ""}
        </p>
        <div style={{ marginTop: 18, borderTop: "1px solid oklch(0.85 0.04 40)", paddingTop: 14 }}>
          <h3 style={{ fontSize: "1.2rem", margin: "0 0 4px" }}>{venueText}</h3>
          {addressText && <p style={{ fontSize: "0.95rem", margin: 0 }}>{addressText}</p>}
        </div>
      </section>
    </article>
  );
}

