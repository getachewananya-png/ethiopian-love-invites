import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { TEMPLATE_IDS, type TemplateId } from "@/lib/invitation";
import { TEMPLATE_PRICE_ETB, formatEtb } from "@/lib/plans";
import {
  CHAPA_API_BASE,
  assertPaidTemplate,
  buildTxRef,
  parseAmount,
  requireChapaSecret,
  type ChapaInitializeResponse,
  type ChapaVerifyResponse,
} from "@/lib/chapa.server";

const templateSchema = z.enum(TEMPLATE_IDS);

function appUrl(): string {
  const url = (process.env["PUBLIC_APP_URL"] ?? "").replace(/\/$/, "");
  if (!url) {
    throw new Error("Missing PUBLIC_APP_URL. Chapa needs an absolute return/callback URL, so set it to your public HTTPS origin.");
  }
  return url;
}

function sanitizeEmail(primary?: string | null, fallback?: string | null): string {
  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const BLOCKED_DOMAINS = /@(example\.(com|net|org)|test\.com|localhost|tizita\.app)$/i;

  const candidates = [primary?.trim(), fallback?.trim()].filter(
    (e): e is string => Boolean(e && EMAIL_REGEX.test(e))
  );

  const realEmail = candidates.find((e) => !BLOCKED_DOMAINS.test(e));
  if (realEmail) return realEmail;

  const firstCandidate = candidates[0];
  if (firstCandidate) {
    return firstCandidate.replace(/@.*$/, "@gmail.com");
  }

  return "customer.tizita@gmail.com";
}

export interface InitializeResult {
  txRef: string;
  checkoutUrl: string;
  amountEtb: number;
  invitationId: string;
  slug: string;
  alreadyPaid: boolean;
}

/**
 * Creates the invitation (unpublished) and opens a Chapa checkout.
 * The account already exists at this point — we never take money from a user
 * we cannot attribute the payment to.
 */
export const startPaidInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({
    invitationId: z.string().uuid(),
    templateId: templateSchema,
  }).parse(data))
  .handler(async ({ context, data }): Promise<InitializeResult> => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    assertPaidTemplate(data.templateId);
    const secret = requireChapaSecret();
    const base = appUrl();

    const { data: invitation, error: invitationError } = await supabase
      .from("invitations")
      .select("id, slug, user_id, is_paid, template_id, bride_name, groom_name, email")
      .eq("id", data.invitationId)
      .single();
    if (invitationError || !invitation || invitation.user_id !== userId) throw new Error("Invitation not found");

    // Idempotent: a retry after a successful payment must not charge twice.
    if (invitation.is_paid) {
      return {
        txRef: "",
        checkoutUrl: `${base}/dashboard?paid=already`,
        amountEtb: TEMPLATE_PRICE_ETB[data.templateId],
        invitationId: invitation.id,
        slug: invitation.slug,
        alreadyPaid: true,
      };
    }

    const amount = TEMPLATE_PRICE_ETB[data.templateId];
    const txRef = buildTxRef(userId);

    const { error: paymentError } = await supabaseAdmin.from("payments").insert({
      user_id: userId,
      invitation_id: invitation.id,
      template_id: data.templateId,
      tx_ref: txRef,
      amount,
      currency: "ETB",
      status: "pending",
    });
    if (paymentError) throw new Error(paymentError.message);

    const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(userId);
    const authUserEmail = authUserData?.user?.email ?? (typeof context.claims?.["email"] === "string" ? context.claims["email"] : null);
    const emailToUse = sanitizeEmail(authUserEmail, invitation.email);
    const firstNameToUse = invitation.bride_name?.trim().slice(0, 50) || "Bride";
    const lastNameToUse = invitation.groom_name?.trim().slice(0, 50) || "Groom";
    const cleanDescription = `${data.templateId} template ${amount} ETB`
      .replace(/[^a-zA-Z0-9_\-\.\s]/g, "")
      .trim()
      .slice(0, 100);

    const response = await fetch(`${CHAPA_API_BASE}/transaction/initialize`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: String(amount),
        currency: "ETB",
        email: emailToUse,
        first_name: firstNameToUse,
        last_name: lastNameToUse,
        tx_ref: txRef,
        return_url: `${base}/pay/callback?tx_ref=${encodeURIComponent(txRef)}`,
        callback_url: `${base}/api/chapa/webhook`,
        customization: {
          title: "Tizita Invites",
          description: cleanDescription,
        },
        meta: {
          invitation_id: invitation.id,
          template_id: data.templateId,
          invoices: [{ key: "Wedding invitation template", value: data.templateId }],
        },
      }),
    });

    const payload = (await response.json().catch(() => null)) as ChapaInitializeResponse | null;
    if (!response.ok || !payload?.data?.checkout_url) {
      let message = `Chapa rejected the payment request (HTTP ${response.status}).`;
      if (typeof payload?.message === "string" && payload.message.trim()) {
        message = payload.message;
      } else if (payload?.message && typeof payload.message === "object") {
        try {
          const errObj = payload.message as Record<string, unknown>;
          const details = Object.entries(errObj)
            .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(", ") : String(errs)}`)
            .join("; ");
          message = details || JSON.stringify(payload.message);
        } catch {
          /* ignore */
        }
      } else if (payload && typeof payload === "object") {
        try {
          const rootObj = (payload as unknown) as Record<string, unknown>;
          const details = Object.entries(rootObj)
            .filter(([k]) => k !== "status" && k !== "data")
            .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(", ") : String(errs)}`)
            .join("; ");
          if (details) message = details;
        } catch {
          /* ignore */
        }
      }
      throw new Error(message);
    }

    return {
      txRef,
      checkoutUrl: payload.data.checkout_url,
      amountEtb: amount,
      invitationId: invitation.id,
      slug: invitation.slug,
      alreadyPaid: false,
    };
  });

export interface FulfillResult {
  status: "success" | "pending" | "failed" | "cancelled";
  slug: string | null;
  invitationId: string | null;
  message: string;
}

/**
 * The single source of truth for granting access after payment.
 *
 * Both the browser callback and the Chapa webhook call this, so it MUST be
 * idempotent: Chapa retries webhooks for up to 72 hours and may deliver the
 * same event more than once. Re-running on an already-fulfilled payment is a
 * no-op and returns the recorded result.
 *
 * Per Chapa's own guidance we re-query the verify endpoint rather than trusting
 * the incoming payload, and we check amount + currency + mode before publishing.
 */
export async function fulfillPayment(txRef: string): Promise<FulfillResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const secret = requireChapaSecret();

  const { data: payment, error: paymentError } = await supabaseAdmin
    .from("payments")
    .select("id, user_id, invitation_id, template_id, tx_ref, amount, currency, status, fulfilled_at")
    .eq("tx_ref", txRef)
    .maybeSingle();
  if (paymentError) throw new Error(paymentError.message);
  if (!payment) throw new Error("Unknown payment reference.");

  // Already granted — do not repeat side effects.
  if (payment.status === "success" && payment.fulfilled_at) {
    const { data: existing } = await supabaseAdmin
      .from("invitations")
      .select("id, slug")
      .eq("id", payment.invitation_id ?? "")
      .maybeSingle();
    return { status: "success", slug: existing?.slug ?? null, invitationId: existing?.id ?? null, message: "Already confirmed." };
  }

  const response = await fetch(`${CHAPA_API_BASE}/transaction/verify/${encodeURIComponent(txRef)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const payload = (await response.json().catch(() => null)) as ChapaVerifyResponse | null;
  const verified = payload?.data;

  if (!response.ok || !verified) {
    return { status: "pending", slug: null, invitationId: payment.invitation_id, message: "Chapa could not verify this transaction yet." };
  }

  if (verified.status !== "success") {
    await supabaseAdmin
      .from("payments")
      .update({ status: verified.status === "cancelled" ? "cancelled" : "failed", raw_payload: verified as never, chapa_ref_id: verified.reference ?? null })
      .eq("id", payment.id);
    return { status: verified.status === "cancelled" ? "cancelled" : "failed", slug: null, invitationId: payment.invitation_id, message: `Payment ${verified.status}.` };
  }

  // Anti-tamper: verify what Chapa actually collected matches what we asked for.
  const paidAmount = parseAmount(verified.amount);
  if (verified.tx_ref !== txRef) throw new Error("Payment reference mismatch.");
  if (verified.currency !== payment.currency) throw new Error("Payment currency mismatch.");
  if (!Number.isFinite(paidAmount) || paidAmount < Number(payment.amount)) throw new Error("Payment amount mismatch.");

  const expected = TEMPLATE_PRICE_ETB[payment.template_id as TemplateId];
  if (expected !== undefined && paidAmount < expected) throw new Error("Payment amount is lower than the template price.");

  await supabaseAdmin
    .from("payments")
    .update({
      status: "success",
      chapa_ref_id: verified.reference ?? null,
      mode: verified.mode ?? null,
      fulfilled_at: new Date().toISOString(),
      raw_payload: verified as never,
    })
    .eq("id", payment.id);

  let slug: string | null = null;
  if (payment.invitation_id) {
    const { data: updated } = await supabaseAdmin
      .from("invitations")
      .update({ is_published: true, is_paid: true })
      .eq("id", payment.invitation_id)
      .select("id, slug")
      .maybeSingle();
    slug = updated?.slug ?? null;
  }

  return { status: "success", slug, invitationId: payment.invitation_id, message: "Payment confirmed. Your invitation is live." };
}

export const verifyPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({ txRef: z.string().trim().min(4).max(120) }).parse(data))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: payment } = await supabase.from("payments").select("id, user_id").eq("tx_ref", data.txRef).maybeSingle();
    if (!payment || payment.user_id !== userId) throw new Error("Unknown payment reference.");
    return fulfillPayment(data.txRef);
  });

export const getMyPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({}).parse(data ?? {}))
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("payments")
      .select("id, invitation_id, template_id, tx_ref, amount, currency, status, mode, fulfilled_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { payments: data ?? [] };
  });

