import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AdminInvitationSummary {
  id: string;
  templateId: string;
  slug: string;
  brideName: string;
  groomName: string;
  weddingDate: string;
  isPublished: boolean;
  isPaid: boolean;
  userId: string;
  userEmail: string | null;
  createdAt: string;
  updatedAt: string | null;
  viewCount: number;
  rsvpsCount: number;
}

export const getAllInvitationsForAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({}).parse(data))
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { isUserAdmin } = await import("@/lib/admin");
    const { claims } = context;
    const userEmail = (claims as Record<string, unknown> | undefined)?.email as string | undefined;

    if (!isUserAdmin(userEmail)) {
      throw new Error("Forbidden: Admin access required");
    }

    // Fetch all invitations
    const { data: invitations, error } = await supabaseAdmin
      .from("invitations")
      .select("id, template_id, slug, bride_name, groom_name, wedding_date, is_published, is_paid, user_id, created_at, updated_at, views_count")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    // Get RSVP counts grouped by invitation_id
    const { data: rsvps } = await supabaseAdmin
      .from("rsvps")
      .select("invitation_id");

    const rsvpCounts: Record<string, number> = {};
    if (rsvps) {
      for (const r of rsvps) {
        rsvpCounts[r.invitation_id] = (rsvpCounts[r.invitation_id] || 0) + 1;
      }
    }

    // Also get user emails if possible from auth
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    const userEmailMap: Record<string, string> = {};
    if (usersData?.users) {
      for (const u of usersData.users) {
        if (u.email) userEmailMap[u.id] = u.email;
      }
    }

    const summaries: AdminInvitationSummary[] = (invitations ?? []).map((inv) => ({
      id: inv.id,
      templateId: inv.template_id,
      slug: inv.slug,
      brideName: inv.bride_name,
      groomName: inv.groom_name,
      weddingDate: inv.wedding_date,
      isPublished: Boolean(inv.is_published),
      isPaid: Boolean(inv.is_paid),
      userId: inv.user_id,
      userEmail: userEmailMap[inv.user_id] ?? null,
      createdAt: inv.created_at,
      updatedAt: inv.updated_at,
      viewCount: inv.views_count ?? 0,
      rsvpsCount: rsvpCounts[inv.id] ?? 0,
    }));

    return summaries;
  });

