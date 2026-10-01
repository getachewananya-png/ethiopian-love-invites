import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { guestShareUrl } from "@/lib/dashboard.functions";
import { MAX_TARGET_GUEST_COUNT } from "@/lib/plans";
import type { Database } from "@/integrations/supabase/types";

/** The RLS-bound client the auth middleware puts on the request context. */
type SupabaseLike = SupabaseClient<Database>;

const channelSchema = z.enum(["link", "whatsapp", "telegram", "sms", "email", "other"]);
const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

function token(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

/** Confirms the signed-in user owns the invitation before any mutation. */
async function assertOwnership(supabase: SupabaseLike, invitationId: string, userId: string) {
  const { data, error } = await supabase
    .from("invitations")
    .select("user_id, slug")
    .eq("id", invitationId)
    .single();
  if (error || !data || data.user_id !== userId) throw new Error("Invitation not found");
  return data;
}

const guestInput = z.object({
  invitationId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  phone: optionalText(40),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  channel: channelSchema.default("link"),
});

export const addGuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => guestInput.parse(data))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertOwnership(supabase, data.invitationId, userId);

    const { data: row, error } = await supabase
      .from("guests")
      .insert({
        invitation_id: data.invitationId,
        share_token: token(),
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        channel: data.channel,
      })
      .select("id, share_token")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Guest could not be added");
    return row;
  });

export const addGuestsBulk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({
    invitationId: z.string().uuid(),
    channel: channelSchema.default("link"),
    names: z.array(z.string().trim().min(1).max(120)).min(1).max(500),
    // Parallel array of optional emails, same length/order as `names`.
    emails: z.array(z.string().trim().email().max(255).or(z.literal(""))).max(500).optional(),
  }).parse(data))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertOwnership(supabase, data.invitationId, userId);

    const rows = data.names.map((name, index) => ({
      invitation_id: data.invitationId,
      share_token: token(),
      name,
      email: data.emails?.[index] || null,
      channel: data.channel,
    }));
    const { error } = await supabase.from("guests").insert(rows);
    if (error) throw new Error(error.message);
    return { added: rows.length };
  });

/**
 * Sends each guest their private link by email and records them as sent.
 *
 * Guests without an email are still marked as sent (they were delivered by hand
 * — WhatsApp etc.), so the "links sent" metric stays truthful either way.
 * A per-guest send failure is collected rather than thrown, so one bad address
 * never blocks the rest of the batch.
 */
export const markGuestsSent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({
    invitationId: z.string().uuid(),
    guestIds: z.array(z.string().uuid()).min(1).max(500),
  }).parse(data))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const invitation = await assertOwnership(supabase, data.invitationId, userId);

    // Only touch guests that are not already marked, matching the old semantics.
    const { data: pending, error: guestError } = await supabase
      .from("guests")
      .select("id, share_token, name, email")
      .in("id", data.guestIds)
      .eq("invitation_id", data.invitationId)
      .is("sent_at", null);
    if (guestError) throw new Error(guestError.message);

    const targets = pending ?? [];
    if (!targets.length) return { marked: 0, emailed: 0, skipped: 0, failures: [] as string[] };

    // Pull the couple details for the email body.
    const { data: invite } = await supabase
      .from("invitations")
      .select("bride_name, groom_name, wedding_date, venue, custom_message, is_published")
      .eq("id", data.invitationId)
      .eq("user_id", userId)
      .single();
    if (!invite) throw new Error("Invitation not found");

    const { sendInvitationEmail, isEmailConfigured } = await import("@/lib/email.server");
    const emailReady = isEmailConfigured();
    const failures: string[] = [];
    let emailed = 0;

    // Sequential on purpose: Resend rate-limits bursts, and a 500-guest wedding
    // list would otherwise trip 429s immediately.
    for (const guest of targets) {
      if (!guest.email) continue;
      if (!emailReady) {
        failures.push(`${guest.name}: email sending is not configured`);
        continue;
      }
      try {
        await sendInvitationEmail({
          to: guest.email,
          guestName: guest.name,
          brideName: invite.bride_name,
          groomName: invite.groom_name,
          weddingDate: invite.wedding_date,
          venue: invite.venue,
          customMessage: invite.custom_message,
          shareUrl: guestShareUrl(invitation.slug, guest.share_token),
        });
        emailed += 1;
      } catch (cause) {
        failures.push(`${guest.name}: ${cause instanceof Error ? cause.message : "send failed"}`);
      }
    }

    const { error } = await supabase
      .from("guests")
      .update({ sent_at: new Date().toISOString() })
      .in("id", targets.map((guest) => guest.id))
      .eq("invitation_id", data.invitationId)
      .is("sent_at", null);
    if (error) throw new Error(error.message);

    return { marked: targets.length, emailed, skipped: targets.filter((g) => !g.email).length, failures };
  });

export const removeGuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({ invitationId: z.string().uuid(), guestId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertOwnership(supabase, data.invitationId, userId);

    const { error } = await supabase.from("guests").delete().eq("id", data.guestId).eq("invitation_id", data.invitationId);
    if (error) throw new Error(error.message);
    return { removed: true };
  });

export const updateGuestTarget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({
    invitationId: z.string().uuid(),
    targetGuestCount: z.number().int().min(0).max(MAX_TARGET_GUEST_COUNT),
  }).parse(data))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertOwnership(supabase, data.invitationId, userId);

    const { error } = await supabase
      .from("invitations")
      .update({ target_guest_count: data.targetGuestCount })
      .eq("id", data.invitationId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { targetGuestCount: data.targetGuestCount };
  });

export const deleteInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({ invitationId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("invitations").delete().eq("id", data.invitationId).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { deleted: true };
  });
