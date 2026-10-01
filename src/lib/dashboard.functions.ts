import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface DashboardTotals {
  invitations: number;
  published: number;
  guests: number;
  linksSent: number;
  totalViews: number;
  rsvpsReceived: number;
  attending: number;
  declined: number;
  awaitingReply: number;
  targetGuests: number;
}

export interface InvitationSummary {
  id: string;
  slug: string;
  templateId: string;
  brideName: string;
  groomName: string;
  weddingDate: string;
  isPublished: boolean;
  isPaid: boolean;
  viewCount: number;
  targetGuestCount: number;
  guests: number;
  linksSent: number;
  rsvpsReceived: number;
  attending: number;
  declined: number;
  awaitingReply: number;
  responseRate: number;
  createdAt: string;
  shareUrl: string;
}

export interface GuestRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  channel: string;
  sentAt: string | null;
  firstViewedAt: string | null;
  viewCount: number;
  attending: boolean | null;
  partySize: number;
  respondedAt: string | null;
  shareUrl: string;
  shareToken: string;
}

export interface DailyPoint {
  date: string;
  views: number;
  rsvps: number;
}

export interface DashboardData {
  totals: DashboardTotals;
  invitations: InvitationSummary[];
  trend: DailyPoint[];
}

function shareBase(): string {
  return (process.env["PUBLIC_APP_URL"] ?? "").replace(/\/$/, "");
}

/**
 * Per-guest share URL. Tokens ride as `?token=` on the plain invite route —
 * `/invite/:slug` is the single public page, so a guest link is just that page
 * with the guest's tracking token attached.
 */
export function guestShareUrl(slug: string, token: string): string {
  const path = `/invite/${slug}?token=${encodeURIComponent(token)}`;
  const base = shareBase();
  return base ? `${base}${path}` : path;
}

export function invitationShareUrl(slug: string): string {
  const path = `/invite/${slug}`;
  const base = shareBase();
  return base ? `${base}${path}` : path;
}


export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({}).parse(data ?? {}))
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: invitations, error: invitationError } = await supabase
      .from("invitations")
      .select("id, slug, template_id, bride_name, groom_name, wedding_date, is_published, is_paid, view_count, target_guest_count, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (invitationError) throw new Error(invitationError.message);

    const rows = invitations ?? [];
    const ids = rows.map((row) => row.id);

    const guestsByInvitation = new Map<string, Array<{ id: string; sent_at: string | null; first_viewed_at: string | null }>>();
    const rsvpsByInvitation = new Map<string, Array<{ attending: boolean; party_size: number; created_at: string; guest_id: string | null }>>();

    if (ids.length) {
      const { data: guests, error: guestError } = await supabase
        .from("guests")
        .select("id, invitation_id, sent_at, first_viewed_at")
        .in("invitation_id", ids);
      if (guestError) throw new Error(guestError.message);
      for (const guest of guests ?? []) {
        const bucket = guestsByInvitation.get(guest.invitation_id) ?? [];
        bucket.push({ id: guest.id, sent_at: guest.sent_at, first_viewed_at: guest.first_viewed_at });
        guestsByInvitation.set(guest.invitation_id, bucket);
      }

      const { data: rsvps, error: rsvpError } = await supabase
        .from("rsvps")
        .select("invitation_id, attending, party_size, created_at, guest_id")
        .in("invitation_id", ids);
      if (rsvpError) throw new Error(rsvpError.message);
      for (const rsvp of rsvps ?? []) {
        const bucket = rsvpsByInvitation.get(rsvp.invitation_id) ?? [];
        bucket.push({ attending: rsvp.attending, party_size: rsvp.party_size, created_at: rsvp.created_at, guest_id: rsvp.guest_id });
        rsvpsByInvitation.set(rsvp.invitation_id, bucket);
      }
    }

    const summaries: InvitationSummary[] = rows.map((row) => {
      const guests = guestsByInvitation.get(row.id) ?? [];
      const rsvps = rsvpsByInvitation.get(row.id) ?? [];
      const linksSent = guests.filter((guest) => guest.sent_at !== null).length;
      const attending = rsvps.reduce((total, rsvp) => total + (rsvp.attending ? rsvp.party_size : 0), 0);
      const declined = rsvps.filter((rsvp) => !rsvp.attending).length;
      const respondedGuestIds = new Set(rsvps.map((rsvp) => rsvp.guest_id).filter((id): id is string => id !== null));
      const awaitingReply = guests.filter((guest) => !respondedGuestIds.has(guest.id)).length;
      const denominator = linksSent || guests.length;
      return {
        id: row.id,
        slug: row.slug,
        templateId: row.template_id,
        brideName: row.bride_name,
        groomName: row.groom_name,
        weddingDate: row.wedding_date,
        isPublished: row.is_published,
        isPaid: row.is_paid,
        viewCount: row.view_count,
        targetGuestCount: row.target_guest_count,
        guests: guests.length,
        linksSent,
        rsvpsReceived: rsvps.length,
        attending,
        declined,
        awaitingReply,
        responseRate: denominator ? Math.round((rsvps.length / denominator) * 100) : 0,
        createdAt: row.created_at,
        shareUrl: invitationShareUrl(row.slug),
      };
    });

    const totals = summaries.reduce<DashboardTotals>(
      (total, current) => ({
        invitations: total.invitations + 1,
        published: total.published + (current.isPublished ? 1 : 0),
        guests: total.guests + current.guests,
        linksSent: total.linksSent + current.linksSent,
        totalViews: total.totalViews + current.viewCount,
        rsvpsReceived: total.rsvpsReceived + current.rsvpsReceived,
        attending: total.attending + current.attending,
        declined: total.declined + current.declined,
        awaitingReply: total.awaitingReply + current.awaitingReply,
        targetGuests: total.targetGuests + current.targetGuestCount,
      }),
      { invitations: 0, published: 0, guests: 0, linksSent: 0, totalViews: 0, rsvpsReceived: 0, attending: 0, declined: 0, awaitingReply: 0, targetGuests: 0 },
    );

    return { totals, invitations: summaries, trend: buildTrend(rsvpsByInvitation, guestsByInvitation, ids) } satisfies DashboardData;
  });

/** Last 14 days. Opens bucket by first-view date, RSVPs by creation date. */
function buildTrend(
  rsvpsByInvitation: Map<string, Array<{ created_at: string }>>,
  guestsByInvitation: Map<string, Array<{ first_viewed_at: string | null }>>,
  ids: string[],
): DailyPoint[] {
  const days: DailyPoint[] = [];
  const today = new Date();
  for (let offset = 13; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    days.push({ date: date.toISOString().slice(0, 10), views: 0, rsvps: 0 });
  }
  const index = new Map(days.map((day) => [day.date, day]));
  for (const id of ids) {
    for (const guest of guestsByInvitation.get(id) ?? []) {
      if (!guest.first_viewed_at) continue;
      const bucket = index.get(guest.first_viewed_at.slice(0, 10));
      if (bucket) bucket.views += 1;
    }
    for (const rsvp of rsvpsByInvitation.get(id) ?? []) {
      const bucket = index.get(rsvp.created_at.slice(0, 10));
      if (bucket) bucket.rsvps += 1;
    }
  }
  return days;
}

export const getInvitationGuests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({ invitationId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { supabase } = context;

    const { data: invitation, error: invitationError } = await supabase
      .from("invitations")
      .select("id, slug, user_id")
      .eq("id", data.invitationId)
      .single();
    if (invitationError || !invitation) throw new Error("Invitation not found");
    if (invitation.user_id !== context.userId) throw new Error("Invitation not found");

    const { data: guests, error: guestError } = await supabase
      .from("guests")
      .select("id, share_token, name, phone, email, channel, sent_at, first_viewed_at, view_count, created_at")
      .eq("invitation_id", data.invitationId)
      .order("created_at", { ascending: true });
    if (guestError) throw new Error(guestError.message);

    const { data: rsvps, error: rsvpError } = await supabase
      .from("rsvps")
      .select("guest_id, attending, party_size, created_at")
      .eq("invitation_id", data.invitationId);
    if (rsvpError) throw new Error(rsvpError.message);

    const rsvpByGuest = new Map<string, { attending: boolean; party_size: number; created_at: string }>();
    for (const rsvp of rsvps ?? []) {
      if (rsvp.guest_id) rsvpByGuest.set(rsvp.guest_id, { attending: rsvp.attending, party_size: rsvp.party_size, created_at: rsvp.created_at });
    }

    const rows: GuestRow[] = (guests ?? []).map((guest) => {
      const rsvp = rsvpByGuest.get(guest.id);
      return {
        id: guest.id,
        name: guest.name,
        phone: guest.phone,
        email: guest.email,
        channel: guest.channel,
        sentAt: guest.sent_at,
        firstViewedAt: guest.first_viewed_at,
        viewCount: guest.view_count,
        attending: rsvp ? rsvp.attending : null,
        partySize: rsvp ? rsvp.party_size : 0,
        respondedAt: rsvp ? rsvp.created_at : null,
        shareUrl: guestShareUrl(invitation.slug, guest.share_token),
        shareToken: guest.share_token,
      };
    });

    return { slug: invitation.slug, guests: rows };
  });

