import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { TEMPLATE_IDS } from "@/lib/invitation";
import { TEMPLATE_PRICE_ETB, isPaidTemplate } from "@/lib/plans";

const templateSchema = z.enum(TEMPLATE_IDS);
const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
/** Must be present and non-blank. Mirrors REQUIRED_BY_STEP in the builder. */
const requiredText = (max: number) => z.string().trim().min(1).max(max);
const invitationSchema = z.object({
  templateId: templateSchema,
  brideName: requiredText(100),
  groomName: requiredText(100),
  brideNameAm: requiredText(100),
  groomNameAm: requiredText(100),
  weddingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), weddingTime: requiredText(20),
  ceremonyType: requiredText(100), venue: requiredText(200), venueAm: requiredText(200),
  address: requiredText(500), addressAm: requiredText(500), story: requiredText(5000), storyAm: requiredText(5000),
  howWeMet: requiredText(2000), phone: requiredText(40), email: z.string().trim().email().max(255),
  rsvpEnabled: z.boolean(), rsvpDeadline: optionalText(20), customMessage: optionalText(2000), customMessageAm: optionalText(2000),
  primaryPhotoUrl: requiredText(1000), galleryImages: z.array(z.string().max(1000)).min(1).max(12), mapsUrl: z.string().url().max(1000).optional().or(z.literal("")),
  musicUrl: z.string().trim().max(1000).optional().or(z.literal("")),
}).superRefine((value, ctx) => {
  // The deadline only has to exist when there is an RSVP form to submit.
  if (value.rsvpEnabled && !value.rsvpDeadline?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["rsvpDeadline"],
      message: "An RSVP deadline is required while RSVP is enabled.",
    });
  }
});

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 52) || "our-wedding";
}

export const publishInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => invitationSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId } = context;
    const base = slugify(`${data.brideName}-and-${data.groomName}`);
    let slug = base;
    for (let index = 0; index < 20; index += 1) {
      const { data: existing } = await supabaseAdmin.from("invitations").select("id").eq("slug", slug).maybeSingle();
      if (!existing) break;
      slug = `${base}-${index + 2}`;
    }

    // Free templates publish immediately. Paid ones stay as a draft until the
    // Chapa payment is verified, so nobody gets a paid design for free.
    const paid = isPaidTemplate(data.templateId);

    const { data: row, error } = await supabaseAdmin.from("invitations").insert({
      slug, user_id: userId, template_id: data.templateId, bride_name: data.brideName, groom_name: data.groomName,
      bride_name_am: data.brideNameAm || null, groom_name_am: data.groomNameAm || null,
      wedding_date: data.weddingDate, wedding_time: data.weddingTime || null, ceremony_type: data.ceremonyType || null,
      venue: data.venue || null, venue_am: data.venueAm || null, address: data.address || null, address_am: data.addressAm || null,
      story: data.story || null, story_am: data.storyAm || null, how_we_met: data.howWeMet || null,
      phone: data.phone || null, email: data.email || null, rsvp_enabled: data.rsvpEnabled, rsvp_deadline: data.rsvpDeadline || null,
      custom_message: data.customMessage || null, custom_message_am: data.customMessageAm || null,
      primary_photo_url: data.primaryPhotoUrl || null, gallery_photos: data.galleryImages,
      maps_url: data.mapsUrl || null, music_url: data.musicUrl || null, is_published: !paid, is_paid: false,
    }).select("id, slug, is_published").single();
    if (error || !row) throw new Error(error?.message ?? "Invitation could not be created");
    return { ...row, requiresPayment: paid, priceEtb: TEMPLATE_PRICE_ETB[data.templateId] };
  });

export const getInvitation = createServerFn({ method: "GET" })
  .validator((data) => z.object({ slug: z.string().min(1).max(80) }).parse(data))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabasePublic = createClient(process.env['SUPABASE_URL']!, process.env['SUPABASE_PUBLISHABLE_KEY']!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: row, error } = await supabasePublic.from("invitations").select("*").eq("slug", data.slug).eq("is_published", true).single();
    if (error || !row) throw new Error("Invitation not found");
    return row;
  });

const uploadSchema = z.object({ name: z.string().max(120), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]), base64: z.string().max(14_500_000) });
export const uploadWeddingImage = createServerFn({ method: "POST" })
  .validator((data) => uploadSchema.parse(data))
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
