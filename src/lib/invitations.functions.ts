import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const templateSchema = z.enum(["royal-tewahedo", "addis-modern", "habesha-romance"]);
const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
const invitationSchema = z.object({
  templateId: templateSchema,
  brideName: z.string().trim().min(1).max(100),
  groomName: z.string().trim().min(1).max(100),
  brideNameAm: optionalText(100), groomNameAm: optionalText(100),
  weddingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), weddingTime: optionalText(20),
  ceremonyType: optionalText(100), venue: optionalText(200), venueAm: optionalText(200),
  address: optionalText(500), addressAm: optionalText(500), story: optionalText(5000), storyAm: optionalText(5000),
  howWeMet: optionalText(2000), phone: optionalText(40), email: z.string().trim().email().max(255).optional().or(z.literal("")),
  rsvpEnabled: z.boolean(), rsvpDeadline: optionalText(20), customMessage: optionalText(2000), customMessageAm: optionalText(2000),
  primaryPhotoUrl: optionalText(1000), galleryImages: z.array(z.string().max(1000)).max(12), mapsUrl: z.string().url().max(1000).optional().or(z.literal("")),
});

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 52) || "our-wedding";
}

export const publishInvitation = createServerFn({ method: "POST" })
  .inputValidator((data) => invitationSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const base = slugify(`${data.brideName}-and-${data.groomName}`);
    let slug = base;
    for (let index = 0; index < 20; index += 1) {
      const { data: existing } = await supabaseAdmin.from("invitations").select("id").eq("slug", slug).maybeSingle();
      if (!existing) break;
      slug = `${base}-${index + 2}`;
    }
    const { data: row, error } = await supabaseAdmin.from("invitations").insert({
      slug, template_id: data.templateId, bride_name: data.brideName, groom_name: data.groomName,
      bride_name_am: data.brideNameAm || null, groom_name_am: data.groomNameAm || null,
      wedding_date: data.weddingDate, wedding_time: data.weddingTime || null, ceremony_type: data.ceremonyType || null,
      venue: data.venue || null, venue_am: data.venueAm || null, address: data.address || null, address_am: data.addressAm || null,
      story: data.story || null, story_am: data.storyAm || null, how_we_met: data.howWeMet || null,
      phone: data.phone || null, email: data.email || null, rsvp_enabled: data.rsvpEnabled, rsvp_deadline: data.rsvpDeadline || null,
      custom_message: data.customMessage || null, custom_message_am: data.customMessageAm || null,
      primary_photo_url: data.primaryPhotoUrl || null, gallery_photos: data.galleryImages,
      maps_url: data.mapsUrl || null, is_published: true,
    }).select("id, slug").single();
    if (error || !row) throw new Error(error?.message ?? "Invitation could not be created");
    return row;
  });

export const getInvitation = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ slug: z.string().min(1).max(80) }).parse(data))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabasePublic = createClient(process.env['SUPABASE_URL']!, process.env['SUPABASE_PUBLISHABLE_KEY']!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: row, error } = await supabasePublic.from("invitations").select("*").eq("slug", data.slug).eq("is_published", true).single();
    if (error || !row) throw new Error("Invitation not found");
    return row;
  });

const uploadSchema = z.object({ name: z.string().max(120), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]), base64: z.string().max(14_500_000) });
export const uploadWeddingImage = createServerFn({ method: "POST" })
  .inputValidator((data) => uploadSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const extension = data.mimeType === "image/png" ? "png" : data.mimeType === "image/webp" ? "webp" : "jpg";
    const path = `uploads/${crypto.randomUUID()}/${Date.now()}.${extension}`;
    const bytes = Uint8Array.from(atob(data.base64), (character) => character.charCodeAt(0));
    const { error } = await supabaseAdmin.storage.from("wedding-images").upload(path, bytes, { contentType: data.mimeType, upsert: false });
    if (error) throw new Error(error.message);
    const { data: signed, error: signError } = await supabaseAdmin.storage.from("wedding-images").createSignedUrl(path, 60 * 60 * 24 * 365);
    if (signError) throw new Error(signError.message);
    return { path, url: signed.signedUrl };
  });
