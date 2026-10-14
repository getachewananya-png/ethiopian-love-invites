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

  // Load palette directly and purely from the reference image
  let palette: ExtractedPalette = {
    primary: "#c29b62",
    secondary: "#8a6d48",
    background: "#faf7f2",
    text: "#2b2623",
    isDark: false,
  };

  if (referenceImageDataUrl) {
    try {
      palette = await extractReferencePalette(referenceImageDataUrl);
    } catch {
      // Fallback
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

  // 1. Background wash taken directly from reference image palette
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  if (palette.isDark) {
    bgGrad.addColorStop(0, palette.background);
    bgGrad.addColorStop(1, "#0d0e12");
  } else {
    bgGrad.addColorStop(0, palette.background);
    bgGrad.addColorStop(1, "#f5f2eb");
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // If both reference image and couple photo are provided, soft reference atmosphere in background
  if (loadedRefImg && loadedCoupleImg) {
    ctx.save();
    ctx.globalAlpha = palette.isDark ? 0.25 : 0.18;
    ctx.filter = "blur(16px)";
    ctx.drawImage(loadedRefImg, -40, -40, width + 80, height + 80);
    ctx.restore();
  }

  // 2. Double Border in primary and secondary reference colors (no foreign styles)
  const margin = 50;
  ctx.save();
  ctx.strokeStyle = palette.primary;
  ctx.lineWidth = 3;
  ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);

  ctx.strokeStyle = palette.secondary;
  ctx.lineWidth = 1;
  ctx.strokeRect(margin + 12, margin + 12, width - (margin + 12) * 2, height - (margin + 12) * 2);

  // Corner accent dots
  const corners = [
    [margin + 12, margin + 12],
    [width - (margin + 12), margin + 12],
    [margin + 12, height - (margin + 12)],
    [width - (margin + 12), height - (margin + 12)],
  ];
  ctx.fillStyle = palette.primary;
  for (const [cx, cy] of corners) {
    ctx.beginPath();
    ctx.arc(cx!, cy!, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 3. Central Portrait / Image Window
  const archX = 200;
  const archY = 150;
  const archW = width - archX * 2;
  const archH = 700;
  const archRadius = 24;

  ctx.save();
  // Rounded rectangle for clean, modern framing of the uploaded picture
  ctx.beginPath();
  ctx.roundRect(archX, archY, archW, archH, [archRadius, archRadius, archRadius, archRadius]);
  ctx.clip();

  // Display user's uploaded picture (couple photo if present, otherwise reference image)
  const displayImage = loadedCoupleImg || loadedRefImg;
  if (displayImage) {
    const scale = Math.max(archW / displayImage.width, archH / displayImage.height);
    const sw = displayImage.width * scale;
    const sh = displayImage.height * scale;
    const sx = archX + (archW - sw) / 2;
    const sy = archY + (archH - sh) / 2;
    ctx.drawImage(displayImage, sx, sy, sw, sh);

    // Soft gradient fade at bottom of photo for legible typography transition
    const photoGrad = ctx.createLinearGradient(0, archY + archH - 160, 0, archY + archH);
    photoGrad.addColorStop(0, "transparent");
    photoGrad.addColorStop(1, palette.isDark ? "rgba(10, 10, 12, 0.85)" : "rgba(255, 255, 255, 0.8)");
    ctx.fillStyle = photoGrad;
    ctx.fillRect(archX, archY + archH - 160, archW, 160);
  } else {
    // Soft tone placeholder if neither image is loaded
    ctx.fillStyle = palette.background;
    ctx.fillRect(archX, archY, archW, archH);
  }
  ctx.restore();

  // Outline of the image frame
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(archX, archY, archW, archH, [archRadius, archRadius, archRadius, archRadius]);
  ctx.strokeStyle = palette.primary;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.roundRect(archX + 6, archY + 6, archW - 12, archH - 12, [archRadius - 4, archRadius - 4, archRadius - 4, archRadius - 4]);
  ctx.strokeStyle = palette.secondary;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // 4. Subtle top ornament (Clean diamond dot, NO cross)
  ctx.save();
  ctx.fillStyle = palette.primary;
  ctx.textAlign = "center";
  ctx.font = "18px sans-serif";
  ctx.fillText("✦", width / 2, 105);
  ctx.restore();

  // 5. Typographic Composition directly with analyzed reference colors
  ctx.save();
  ctx.textAlign = "center";

  // Kicker
  ctx.fillStyle = palette.secondary;
  ctx.font = "600 22px 'Montserrat', sans-serif";
  ctx.letterSpacing = "0.22em";
  ctx.fillText("WEDDING CELEBRATION", width / 2, 930);

  // Bride Name
  const bName = brideName.trim().toUpperCase() || "BRIDE";
  ctx.fillStyle = palette.text;
  ctx.font = "500 70px 'Cormorant Garamond', 'Playfair Display', Georgia, serif";
  ctx.fillText(bName, width / 2, 1025);

  // Ampersand
  ctx.fillStyle = palette.primary;
  ctx.font = "italic 400 46px 'Great Vibes', 'Playfair Display', cursive, serif";
  ctx.fillText("&", width / 2, 1085);

  // Groom Name
  const gName = groomName.trim().toUpperCase() || "GROOM";
  ctx.fillStyle = palette.text;
  ctx.font = "500 70px 'Cormorant Garamond', 'Playfair Display', Georgia, serif";
  ctx.fillText(gName, width / 2, 1175);

  // Ornamental Divider Rule
  const ruleW = 160;
  ctx.strokeStyle = palette.primary;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(width / 2 - ruleW, 1220);
  ctx.lineTo(width / 2 - 20, 1220);
  ctx.moveTo(width / 2 + 20, 1220);
  ctx.lineTo(width / 2 + ruleW, 1220);
  ctx.stroke();

  ctx.fillStyle = palette.primary;
  ctx.beginPath();
  ctx.arc(width / 2, 1220, 4, 0, Math.PI * 2);
  ctx.fill();

  // Wedding Date
  const dateStr = weddingDate || "SATURDAY · SEPTEMBER 20, 2026";
  ctx.fillStyle = palette.text;
  ctx.font = "600 26px 'Montserrat', sans-serif";
  ctx.fillText(dateStr.toUpperCase(), width / 2, 1280);

  // Venue
  if (venue) {
    ctx.fillStyle = palette.secondary;
    ctx.font = "500 22px 'Montserrat', sans-serif";
    ctx.fillText(venue.toUpperCase(), width / 2, 1330);
  }

  // Footer blessing
  ctx.fillStyle = palette.secondary;
  ctx.font = "italic 28px 'Great Vibes', cursive";
  ctx.fillText("Together with their families", width / 2, 1390);

  ctx.restore();

  return canvas.toDataURL("image/jpeg", 0.92);
}

