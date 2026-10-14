import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const geminiHeroSchema = z.object({
  brideName: z.string().max(100),
  groomName: z.string().max(100),
  weddingDate: z.string().max(50).optional(),
  venue: z.string().max(200).optional(),
  referenceImageDataUrl: z.string().optional(),
  heroImageDataUrl: z.string().optional(),
});

export interface GeminiHeroResult {
  success: boolean;
  imageUrl?: string;
  isMissingApiKey?: boolean;
  error?: string;
  styleDescription?: string;
}

/**
 * Server function to regenerate bespoke wedding invitation hero artwork
 * taking two images: the reference design picture and the hero section couple picture,
 * and regenerating the hero picture in the exact style of the reference picture.
 */
export const generateGeminiWeddingHero = createServerFn({ method: "POST" })
  .validator((data) => geminiHeroSchema.parse(data))
  .handler(async ({ data }): Promise<GeminiHeroResult> => {
    const apiKey =
      process.env["GEMINI_API_KEY"] ||
      process.env["GOOGLE_API_KEY"] ||
      process.env["GOOGLE_GENAI_API_KEY"] ||
      process.env["GEMINI_KEY"] ||
      process.env["VITE_GEMINI_API_KEY"] ||
      process.env["VITE_GOOGLE_API_KEY"];

    if (!apiKey) {
      return {
        success: false,
        isMissingApiKey: true,
        error: "GEMINI_API_KEY is not configured in your .env file.",
      };
    }

    try {
      let styleDescription = "Luxurious minimalist wedding invitation background, elegant warm ivory and champagne palette, delicate architectural framing, modern editorial stationery.";

      // 1. Multimodal analysis of both Reference Picture and Hero Picture
      const parts: Array<Record<string, unknown>> = [];

      let promptInstruction = "Analyze this wedding invitation reference design in detail. Describe its exact color palette, textures, decorative borders, framing style, and artistic mood. Do NOT mention or add any crosses or religious symbols. Produce a concise generation prompt (under 90 words) to recreate this exact aesthetic.";

      if (data.heroImageDataUrl && data.referenceImageDataUrl) {
        promptInstruction = "You are given two images: 1. A REFERENCE DESIGN picture showing the target artistic style, lighting, color palette, borders, and textures. 2. A HERO SECTION picture of the couple. Analyze both images. Produce a concise image generation prompt (under 100 words) instructing an AI image generator to regenerate the couple from image 2 in the exact artistic style, color palette, lighting, framing, and mood of image 1. Do NOT mention or add any crosses or religious symbols.";
      }

      parts.push({ text: promptInstruction });

      // Add Reference Image
      if (data.referenceImageDataUrl && data.referenceImageDataUrl.startsWith("data:")) {
        const refMatch = data.referenceImageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (refMatch && refMatch[1] && refMatch[2]) {
          parts.push({
            inlineData: {
              mimeType: refMatch[1],
              data: refMatch[2],
            },
          });
        }
      }

      // Add Hero Section Couple Image
      if (data.heroImageDataUrl && data.heroImageDataUrl.startsWith("data:")) {
        const heroMatch = data.heroImageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (heroMatch && heroMatch[1] && heroMatch[2]) {
          parts.push({
            inlineData: {
              mimeType: heroMatch[1],
              data: heroMatch[2],
            },
          });
        }
      }

      if (parts.length > 1) {
        try {
          const visionResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts }],
              }),
            }
          );

          if (visionResponse.ok) {
            const visionResult = (await visionResponse.json()) as {
              candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
            };
            const analysis = visionResult.candidates?.[0]?.content?.parts?.[0]?.text;
            if (analysis && analysis.trim()) {
              styleDescription = analysis.trim();
            }
          }
        } catch (visionErr) {
          console.warn("Gemini vision analysis failed, continuing with default style:", visionErr);
        }
      }

      // 2. Generate brand new image with Google Imagen 3
      const prompt = `A breathtaking luxury wedding invitation card backdrop artwork, strictly in the aesthetic: ${styleDescription}. Featuring clean elegant borders, soft harmonious textures, high-end editorial stationery styling, 8k resolution, vertical 3:4 aspect ratio, absolutely no text, no letters, no crosses, clean central negative space for couple portrait.`;

      const imagenResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instances: [{ prompt }],
            parameters: {
              sampleCount: 1,
              aspectRatio: "3:4",
              outputMimeType: "image/jpeg",
            },
          }),
        }
      );

      if (!imagenResponse.ok) {
        const errBody = await imagenResponse.text();
        console.error("Imagen 3 error response:", errBody);
        return {
          success: false,
          error: `Google Imagen 3 API error: ${imagenResponse.status} ${imagenResponse.statusText}`,
          styleDescription,
        };
      }

      const imagenResult = (await imagenResponse.json()) as {
        predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>;
      };

      const base64Image = imagenResult.predictions?.[0]?.bytesBase64Encoded;
      if (!base64Image) {
        return {
          success: false,
          error: "No image was returned by Gemini Imagen.",
          styleDescription,
        };
      }

      // 3. Upload to Supabase Storage if configured, or return data URL
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const path = `ai-generated/${crypto.randomUUID()}/${Date.now()}.jpg`;
        const bytes = Uint8Array.from(atob(base64Image), (c) => c.charCodeAt(0));
        const { error: uploadError } = await supabaseAdmin.storage
          .from("wedding-images")
          .upload(path, bytes, { contentType: "image/jpeg", upsert: false });

        if (!uploadError) {
          const { data: signed } = await supabaseAdmin.storage
            .from("wedding-images")
            .createSignedUrl(path, 60 * 60 * 24 * 365);
          if (signed?.signedUrl) {
            return {
              success: true,
              imageUrl: signed.signedUrl,
              styleDescription,
            };
          }
        }
      } catch (storageErr) {
        console.warn("Storage upload failed, falling back to data URL:", storageErr);
      }

      return {
        success: true,
        imageUrl: `data:image/jpeg;base64,${base64Image}`,
        styleDescription,
      };
    } catch (error) {
      console.error("Gemini generation error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown Gemini API error",
      };
    }
  });

