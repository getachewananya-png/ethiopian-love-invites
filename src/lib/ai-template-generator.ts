/**
 * AI Template & Hero Section Generator
 *
 * Transforms reference design images, style prompts, and couple details into
 * bespoke, high-resolution wedding invitation hero artworks and custom templates.
 */

export interface AiStylePreset {
  id: string;
  name: string;
  amName: string;
  description: string;
  bgGradient: [string, string];
  primaryColor: string;
  accentColor: string;
  textColor: string;
  cardBorder: string;
  motif: "cross" | "floral" | "arch" | "tibeb" | "jebena" | "filigree";
}

export const AI_STYLE_PRESETS: AiStylePreset[] = [
  {
    id: "royal-burgundy-gold",
    name: "Royal Burgundy & Gold",
    amName: "ሮያል ወርቅና ቡርጉንዲ",
    description: "Deep regal wine tones, antique gold filigree, and Ethiopian cross motifs.",
    bgGradient: ["#2d111d", "#1a0810"],
    primaryColor: "#d4af37",
    accentColor: "#f3e5ab",
    textColor: "#fffaf0",
    cardBorder: "#d4af37",
    motif: "cross",
  },
  {
    id: "traditional-tibeb",
    name: "Sacred Tibeb & Gold",
    amName: "ባህላዊ ጥበብና ወርቅ",
    description: "Traditional Ethiopian woven borders, stepped cross ornaments, and royal blue accents.",
    bgGradient: ["#1e2d42", "#0f1722"],
    primaryColor: "#e5b95c",
    accentColor: "#9e2a2b",
    textColor: "#ffffff",
    cardBorder: "#e5b95c",
    motif: "tibeb",
  },
  {
    id: "modern-minimalist",
    name: "Modern Editorial Cream",
    amName: "ዘመናዊ ክሬም ኤዲቶሪያል",
    description: "Minimalist warm ivory backdrop, architectural arches, and classic typography.",
    bgGradient: ["#faf7f2", "#f0ebe1"],
    primaryColor: "#2b2623",
    accentColor: "#c29b62",
    textColor: "#2b2623",
    cardBorder: "#c29b62",
    motif: "arch",
  },
  {
    id: "garden-romance",
    name: "Blush Garden & Champagne",
    amName: "ሮማንቲክ ጽጌረዳና ሻምፓኝ",
    description: "Soft rose petals, botanical eucalyptus leaves, and shimmering gold accents.",
    bgGradient: ["#fdf7f5", "#f4e6e2"],
    primaryColor: "#b26154",
    accentColor: "#d4af37",
    textColor: "#3d2a26",
    cardBorder: "#e2b3a9",
    motif: "floral",
  },
  {
    id: "lalibela-ochre",
    name: "Lalibela Ochre & Heritage",
    amName: "የላሊበላ ዐለትና ቅርስ",
    description: "Warm earth tones, rock-hewn church carvings, and timeless antique elegance.",
    bgGradient: ["#3b2219", "#24130d"],
    primaryColor: "#e69c58",
    accentColor: "#ffd285",
    textColor: "#fff8f0",
    cardBorder: "#e69c58",
    motif: "cross",
  },
];

export interface ExtractedPalette {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  isDark: boolean;
}

/**
 * Analyzes an uploaded reference design image on an offscreen canvas
 * to extract dominant aesthetic colors and mood.
 */
export async function extractReferencePalette(dataUrl: string): Promise<ExtractedPalette> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve({
        primary: "#d4af37",
        secondary: "#b26154",
        background: "#faf7f2",
        text: "#2b2623",
        isDark: false,
      });
      return;
    }

    const img = new Image();
    if (!dataUrl.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("No canvas context");

        canvas.width = 64;
        canvas.height = 64;
        ctx.drawImage(img, 0, 0, 64, 64);

        const imgData = ctx.getImageData(0, 0, 64, 64).data;
        let rTotal = 0;
        let gTotal = 0;
        let bTotal = 0;
        let pixelCount = 0;

        // Sample pixels to find dominant color and average brightness
        const colorBuckets: Record<string, number> = {};

        for (let i = 0; i < imgData.length; i += 16) {
          const r = imgData[i]!;
          const g = imgData[i + 1]!;
          const b = imgData[i + 2]!;
          rTotal += r;
          gTotal += g;
          bTotal += b;
          pixelCount++;

          // Quantize into 32-step buckets
          const qr = Math.floor(r / 32) * 32;
          const qg = Math.floor(g / 32) * 32;
          const qb = Math.floor(b / 32) * 32;
          const key = `${qr},${qg},${qb}`;
          colorBuckets[key] = (colorBuckets[key] || 0) + 1;
        }

        const avgR = Math.round(rTotal / pixelCount);
        const avgG = Math.round(gTotal / pixelCount);
        const avgB = Math.round(bTotal / pixelCount);
        const brightness = (avgR * 299 + avgG * 587 + avgB * 114) / 1000;
        const isDark = brightness < 128;

        // Find most frequent saturated colors
        const sorted = Object.entries(colorBuckets).sort((a, b) => b[1] - a[1]);
        const primaryRGB = sorted[0] ? sorted[0][0].split(",").map(Number) : [212, 175, 55];
        const secondaryRGB = sorted[1] ? sorted[1][0].split(",").map(Number) : [178, 97, 84];

        resolve({
          primary: `rgb(${primaryRGB[0]}, ${primaryRGB[1]}, ${primaryRGB[2]})`,
          secondary: `rgb(${secondaryRGB[0]}, ${secondaryRGB[1]}, ${secondaryRGB[2]})`,
          background: isDark ? `rgb(${Math.max(15, avgR - 20)}, ${Math.max(15, avgG - 20)}, ${Math.max(15, avgB - 20)})` : `rgb(${Math.min(253, avgR + 25)}, ${Math.min(250, avgG + 25)}, ${Math.min(245, avgB + 25)})`,
          text: isDark ? "#ffffff" : "#1a1614",
          isDark,
        });
      } catch {
        resolve({
          primary: "#d4af37",
          secondary: "#b26154",
          background: "#faf7f2",
          text: "#2b2623",
          isDark: false,
        });
      }
    };
    img.onerror = () => {
      resolve({
        primary: "#d4af37",
        secondary: "#b26154",
        background: "#faf7f2",
        text: "#2b2623",
        isDark: false,
      });
    };
    img.src = dataUrl;
  });
}

export interface GenerateHeroParams {
  brideName: string;
  groomName: string;
  weddingDate?: string;
  venue?: string;
  referenceImageDataUrl?: string;
  stylePresetId?: string;
  customPrompt?: string;
  couplePhotoDataUrl?: string;
}

/**
 * Procedurally generates a bespoke, high-resolution (1200x1500) hero invitation
 * artwork synthesizing the reference design image, custom theme palette, couple details,
 * and authentic ornaments.
 */
export async function generateAiHeroArtwork(params: GenerateHeroParams): Promise<string> {
  const {
    brideName,
    groomName,
    weddingDate,
    venue,
    referenceImageDataUrl,
    stylePresetId = "royal-burgundy-gold",
    couplePhotoDataUrl,
  } = params;

  if (typeof window === "undefined" || typeof document === "undefined") {
    return "";
  }

  // Load preset or extracted palette
  const preset = AI_STYLE_PRESETS.find((p) => p.id === stylePresetId) || AI_STYLE_PRESETS[0]!;
  let palette: ExtractedPalette = {
    primary: preset.primaryColor,
    secondary: preset.accentColor,
    background: preset.bgGradient[0],
    text: preset.textColor,
    isDark: true,
  };

  if (referenceImageDataUrl) {
    try {
      palette = await extractReferencePalette(referenceImageDataUrl);
    } catch {
      // Fallback to preset
    }
  }

  // Helper to load image as HTMLImageElement
  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      if (!src.startsWith("data:")) {
        img.crossOrigin = "anonymous";
      }
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  let loadedRefImg: HTMLImageElement | null = null;
  let loadedCoupleImg: HTMLImageElement | null = null;

  if (couplePhotoDataUrl) {
    try {
      loadedCoupleImg = await loadImage(couplePhotoDataUrl);
    } catch {
      loadedCoupleImg = null;
    }
  }

  if (referenceImageDataUrl) {
    try {
      loadedRefImg = await loadImage(referenceImageDataUrl);
    } catch {
      loadedRefImg = null;
    }
  }

  // Set up 1200 x 1500 high-res canvas
  const canvas = document.createElement("canvas");
  const width = 1200;
  const height = 1500;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // 1. Background gradient / wash
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  if (palette.isDark) {
    bgGrad.addColorStop(0, preset.bgGradient[0]);
    bgGrad.addColorStop(0.5, preset.bgGradient[1]);
    bgGrad.addColorStop(1, "#0d0408");
  } else {
    bgGrad.addColorStop(0, "#fcf9f5");
    bgGrad.addColorStop(0.5, "#f7f1e8");
    bgGrad.addColorStop(1, "#eee4d6");
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // If a reference image is present and no couple photo is provided,
  // we draw a beautiful stylized, softly-vignetted background inspiration
  if (loadedRefImg && !loadedCoupleImg) {
    ctx.save();
    ctx.globalAlpha = palette.isDark ? 0.35 : 0.25;
    ctx.filter = "blur(12px)";
    ctx.drawImage(loadedRefImg, -50, -50, width + 100, height + 100);
    ctx.restore();
  }

  // 2. Subtle Luxury Texture overlay
  ctx.save();
  ctx.fillStyle = palette.isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)";
  for (let i = 0; i < 400; i++) {
    const rx = Math.random() * width;
    const ry = Math.random() * height;
    const rSize = Math.random() * 3 + 1;
    ctx.beginPath();
    ctx.arc(rx, ry, rSize, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 3. Ornate Outer Double Borders (Gold filigree style)
  const margin = 50;
  ctx.save();
  ctx.strokeStyle = preset.primaryColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);

  ctx.strokeStyle = preset.accentColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(margin + 12, margin + 12, width - (margin + 12) * 2, height - (margin + 12) * 2);

  // Corner decorative flourishes
  const cornerSize = 40;
  const corners = [
    [margin + 12, margin + 12],
    [width - (margin + 12), margin + 12],
    [margin + 12, height - (margin + 12)],
    [width - (margin + 12), height - (margin + 12)],
  ];
  ctx.fillStyle = preset.primaryColor;
  for (const [cx, cy] of corners) {
    ctx.beginPath();
    ctx.arc(cx!, cy!, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 4. Central Arch or Portrait Window
  const archX = 220;
  const archY = 160;
  const archW = width - archX * 2;
  const archH = 680;
  const archRadius = archW / 2;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(archX, archY + archRadius);
  ctx.arc(archX + archRadius, archY + archRadius, archRadius, Math.PI, 0, false);
  ctx.lineTo(archX + archW, archY + archH);
  ctx.lineTo(archX, archY + archH);
  ctx.closePath();
  ctx.clip();

  // Draw image inside arch
  const displayImage = loadedCoupleImg || loadedRefImg;
  if (displayImage) {
    const scale = Math.max(archW / displayImage.width, archH / displayImage.height);
    const sw = displayImage.width * scale;
    const sh = displayImage.height * scale;
    const sx = archX + (archW - sw) / 2;
    const sy = archY + (archH - sh) / 2;
    ctx.drawImage(displayImage, sx, sy, sw, sh);

    // Subtle dark gradient overlay at bottom of photo for text transition
    const photoGrad = ctx.createLinearGradient(0, archY + archH - 180, 0, archY + archH);
    photoGrad.addColorStop(0, "transparent");
    photoGrad.addColorStop(1, palette.isDark ? "rgba(20, 6, 12, 0.85)" : "rgba(255, 255, 255, 0.7)");
    ctx.fillStyle = photoGrad;
    ctx.fillRect(archX, archY + archH - 180, archW, 180);
  } else {
    // Stylized artistic watercolor placeholder if no photo
    const artGrad = ctx.createRadialGradient(
      archX + archW / 2,
      archY + archH / 2,
      50,
      archX + archW / 2,
      archY + archH / 2,
      archW / 1.5
    );
    artGrad.addColorStop(0, preset.primaryColor);
    artGrad.addColorStop(1, preset.bgGradient[1]);
    ctx.fillStyle = artGrad;
    ctx.fillRect(archX, archY, archW, archH);
  }
  ctx.restore();

  // Draw Arch Gold Outline
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(archX, archY + archRadius);
  ctx.arc(archX + archRadius, archY + archRadius, archRadius, Math.PI, 0, false);
  ctx.lineTo(archX + archW, archY + archH);
  ctx.lineTo(archX, archY + archH);
  ctx.closePath();
  ctx.strokeStyle = preset.primaryColor;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Inner hairline
  ctx.beginPath();
  ctx.moveTo(archX + 8, archY + archRadius + 4);
  ctx.arc(archX + archRadius, archY + archRadius, archRadius - 8, Math.PI, 0, false);
  ctx.lineTo(archX + archW - 8, archY + archH - 8);
  ctx.lineTo(archX + 8, archY + archH - 8);
  ctx.closePath();
  ctx.strokeStyle = preset.accentColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // 5. Ceremonial Motif at Top (Cross or Floral)
  ctx.save();
  ctx.fillStyle = preset.primaryColor;
  ctx.textAlign = "center";
  const crossX = width / 2;
  const crossY = 105;

  if (preset.motif === "cross" || preset.motif === "tibeb") {
    // Ethiopian Cross
    ctx.beginPath();
    ctx.rect(crossX - 4, crossY - 32, 8, 48); // vertical beam
    ctx.rect(crossX - 22, crossY - 18, 44, 8); // horizontal beam
    ctx.fill();

    // Central jewel
    ctx.beginPath();
    ctx.arc(crossX, crossY - 14, 6, 0, Math.PI * 2);
    ctx.fillStyle = preset.accentColor;
    ctx.fill();
  } else {
    // Floral / Botanical sprig
    ctx.font = "32px serif";
    ctx.fillText("❦", crossX, crossY);
  }
  ctx.restore();

  // 6. Typographic Composition (Bride & Groom, Date, Location)
  ctx.save();
  ctx.textAlign = "center";

  // Kicker
  ctx.fillStyle = preset.accentColor;
  ctx.font = "600 24px 'Montserrat', sans-serif";
  ctx.letterSpacing = "0.25em";
  ctx.fillText("THE WEDDING CELEBRATION OF", width / 2, 920);

  // Bride Name
  const bName = brideName.trim().toUpperCase() || "BRIDE";
  ctx.fillStyle = palette.isDark ? "#ffffff" : preset.primaryColor;
  ctx.font = "500 74px 'Cormorant Garamond', 'Playfair Display', Georgia, serif";
  ctx.fillText(bName, width / 2, 1020);

  // Amper & flourish
  ctx.fillStyle = preset.primaryColor;
  ctx.font = "italic 400 48px 'Great Vibes', 'Playfair Display', cursive, serif";
  ctx.fillText("&", width / 2, 1085);

  // Groom Name
  const gName = groomName.trim().toUpperCase() || "GROOM";
  ctx.fillStyle = palette.isDark ? "#ffffff" : preset.primaryColor;
  ctx.font = "500 74px 'Cormorant Garamond', 'Playfair Display', Georgia, serif";
  ctx.fillText(gName, width / 2, 1180);

  // Ornamental Divider Rule
  const ruleW = 180;
  ctx.strokeStyle = preset.primaryColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(width / 2 - ruleW, 1225);
  ctx.lineTo(width / 2 - 25, 1225);
  ctx.moveTo(width / 2 + 25, 1225);
  ctx.lineTo(width / 2 + ruleW, 1225);
  ctx.stroke();

  ctx.fillStyle = preset.primaryColor;
  ctx.beginPath();
  ctx.arc(width / 2, 1225, 5, 0, Math.PI * 2);
  ctx.fill();

  // Wedding Date
  const dateStr = weddingDate || "SATURDAY · SEPTEMBER 20, 2026";
  ctx.fillStyle = palette.isDark ? "#f3e5ab" : "#4a3b32";
  ctx.font = "600 28px 'Montserrat', sans-serif";
  ctx.fillText(dateStr.toUpperCase(), width / 2, 1290);

  // Venue
  if (venue) {
    ctx.fillStyle = palette.isDark ? "rgba(255, 255, 255, 0.85)" : "#6a574a";
    ctx.font = "500 24px 'Montserrat', sans-serif";
    ctx.fillText(venue.toUpperCase(), width / 2, 1340);
  }

  // Footer blessing
  ctx.fillStyle = preset.accentColor;
  ctx.font = "italic 30px 'Great Vibes', cursive";
  ctx.fillText("Together with their families", width / 2, 1400);

  ctx.restore();

  return canvas.toDataURL("image/jpeg", 0.94);
}

