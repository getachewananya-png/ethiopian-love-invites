import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const geminiHeroSchema = z.object({
  brideName: z.string().max(100),
  groomName: z.string().max(100),
  weddingDate: z.string().max(50).optional(),
  venue: z.string().max(200).optional(),
  referenceImageDataUrl: z.string().optional(),
});

export interface GeminiHeroResult {
  success: boolean;
  imageUrl?: string;
  isMissingApiKey?: boolean;
  error?: string;
  styleDescription?: string;
}

/**
 * Server function to generate bespoke wedding invitation hero artwork
 * using Google Gemini 2.0 Flash (for multimodal reference image analysis)
 * and Google Imagen 3 (for high-fidelity image generation).
 */
export const generateGeminiWeddingHero = createServerFn({ method: "POST" })
  .validator((data) => geminiHeroSchema.parse(data))
  .handler(async ({ data }): Promise<GeminiHeroResult> => {
    const apiKey =
      process.env["GEMINI_API_KEY"] ||
      process.env["GOOGLE_API_KEY"] ||
      process.env["VITE_GEMINI_API_KEY"];

    if (!apiKey) {
      return {
        success: false,
        isMissingApiKey: true,
        error: "GEMINI_API_KEY is not configured in your .env file.",
      };
    }

    try {
      let styleDescription = "Luxurious minimalist wedding invitation background, elegant warm ivory and champagne palette, delicate architectural framing, modern editorial stationery.";

      // 1. If reference image is provided, analyze its exact aesthetic with Gemini Flash
      if (data.referenceImageDataUrl && data.referenceImageDataUrl.startsWith("data:")) {
        try {
          const match = data.referenceImageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (match && match[1] && match[2]) {
            const mimeType = match[1];
            const base64Data = match[2];

            const visionResponse = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [
                    {
                      parts: [
                        {
                          text: "Analyze this wedding invitation reference design in detail. Describe its exact color palette (primary colors, background wash, accent tones), textures, decorative borders, framing style, and artistic mood. Do NOT mention or add any crosses or religious symbols. Respond with a single concise paragraph (under 80 words) describing the visual style for an AI image generator to replicate the exact look and feel.",
                        },
                        {
                          inlineData: {
                            mimeType,
                            data: base64Data,
                          },
                        },
                      ],
                    },
                  ],
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
