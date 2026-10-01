import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const rsvpInput = z.object({
  slug: z.string().trim().min(1).max(80),
  /** Optional per-guest share token so the RSVP can be attributed to a guest. */
  token: z.string().trim().min(8).max(64).optional(),
  name: z.string().trim().min(1).max(120),
  attending: z.boolean(),
  partySize: z.number().int().min(0).max(20).default(1),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

export interface RsvpResult {
  attending: boolean;
  partySize: number;
  thankYou: string;
}

/**
 * Public RSVP submission. Runs through the service role client because the
 * guest is anonymous; we resolve the invitation by slug server-side and never
 * accept an invitation id from the client.
 */
export const submitRsvp = createServerFn({ method: "POST" })
  .validator((data) => rsvpInput.parse(data))
  .handler(async ({ data }): Promise<RsvpResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from("invitations")
      .select("id, is_published, rsvp_enabled, rsvp_deadline")
      .eq("slug", data.slug)
      .maybeSingle();
    if (invitationError || !invitation) throw new Error("Invitation not found");
    if (!invitation.is_published) throw new Error("This invitation is not available.");
    if (!invitation.rsvp_enabled) throw new Error("RSVP is closed for this invitation.");
    if (invitation.rsvp_deadline && new Date(`${invitation.rsvp_deadline}T23:59:59`) < new Date()) {
      throw new Error("The RSVP deadline has passed.");
    }

    // Attribute to a guest when we recognise the token, so per-guest status works.
    let guestId: string | null = null;
    if (data.token) {
      const { data: guest } = await supabaseAdmin
        .from("guests")
        .select("id")
        .eq("share_token", data.token)
        .eq("invitation_id", invitation.id)
        .maybeSingle();
      guestId = guest?.id ?? null;
    }

    const partySize = data.attending ? Math.max(1, data.partySize) : 0;

    // One response per guest: update in place rather than stacking duplicates.
    if (guestId) {
      const { data: existing } = await supabaseAdmin
        .from("rsvps")
        .select("id")
        .eq("invitation_id", invitation.id)
        .eq("guest_id", guestId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabaseAdmin
          .from("rsvps")
          .update({ name: data.name, attending: data.attending, party_size: partySize, message: data.message || null })
          .eq("id", existing.id);
        if (error) throw new Error(error.message);
        return { attending: data.attending, partySize, thankYou: data.attending ? "Thank you — we cannot wait to celebrate with you!" : "Thank you for letting us know." };
      }
    }

    const { error } = await supabaseAdmin.from("rsvps").insert({
      invitation_id: invitation.id,
      guest_id: guestId,
      name: data.name,
      attending: data.attending,
      party_size: partySize,
      message: data.message || null,
    });
    if (error) throw new Error(error.message);

    if (guestId) {
      await supabaseAdmin.from("guests").update({ sent_at: new Date().toISOString() }).eq("id", guestId).is("sent_at", null);
    }

    return { attending: data.attending, partySize, thankYou: data.attending ? "Thank you — we cannot wait to celebrate with you!" : "Thank you for letting us know." };
  });

/**
 * Records an open for a guest share link. Best-effort and never throws —
 * a failed counter must not break the guest's experience.
 */
export const recordGuestOpen = createServerFn({ method: "POST" })
  .validator((data) => z.object({ token: z.string().trim().min(8).max(64) }).parse(data))
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: guest } = await supabaseAdmin
        .from("guests")
        .select("id, view_count, first_viewed_at")
        .eq("share_token", data.token)
        .maybeSingle();
      if (!guest) return { tracked: false };
      await supabaseAdmin
        .from("guests")
        .update({
          view_count: guest.view_count + 1,
          first_viewed_at: guest.first_viewed_at ?? new Date().toISOString(),
        })
        .eq("id", guest.id);
      return { tracked: true };
    } catch {
      return { tracked: false };
    }
  });

/** Bumps the invitation's own open counter for the plain `/invite/:slug` link. */
export const recordInvitationView = createServerFn({ method: "POST" })
  .validator((data) => z.object({ slug: z.string().trim().min(1).max(80) }).parse(data))
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: invitation } = await supabaseAdmin
        .from("invitations")
        .select("id, view_count")
        .eq("slug", data.slug)
        .eq("is_published", true)
        .maybeSingle();
      if (!invitation) return { tracked: false };
      await supabaseAdmin.from("invitations").update({ view_count: invitation.view_count + 1 }).eq("id", invitation.id);
      return { tracked: true };
    } catch {
      return { tracked: false };
    }
  });
