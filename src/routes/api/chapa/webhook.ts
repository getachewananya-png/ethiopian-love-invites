import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";
import { fulfillPayment } from "@/lib/payments.functions";

/**
 * Chapa transaction webhook.
 *
 * Chapa POSTs here on payment events and retries for up to 72h until it gets a
 * 200, so this handler must always respond 200 and must be idempotent —
 * `fulfillPayment` guards against duplicate side effects.
 *
 * Authenticity: the payload is authenticated with HMAC-SHA256 over the raw
 * request body using the webhook secret. Chapa may send either `chapa-signature`
 * or `x-chapa-signature`; accepting either is per their docs.
 */
export const Route = createFileRoute("/api/chapa/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["CHAPA_WEBHOOK_SECRET"];
        if (!secret) {
          console.error("[chapa] CHAPA_WEBHOOK_SECRET is not set; rejecting webhook.");
          return Response.json({ received: false, reason: "webhook_not_configured" }, { status: 200 });
        }

        const raw = await request.text();
        const provided = request.headers.get("chapa-signature") ?? request.headers.get("x-chapa-signature") ?? "";
        const expected = createHmac("sha256", secret).update(raw).digest("hex");

        if (!safeEqual(provided, expected)) {
          console.error("[chapa] Webhook signature mismatch.");
          return new Response("Invalid signature", { status: 401 });
        }

        let body: { tx_ref?: string; trx_ref?: string } | null = null;
        try {
          body = JSON.parse(raw) as { tx_ref?: string; trx_ref?: string };
        } catch {
          return Response.json({ received: true, reason: "unparseable" }, { status: 200 });
        }

        const txRef = body?.tx_ref ?? body?.trx_ref;
        if (!txRef) {
          // Nothing to act on, but acknowledge so Chapa stops retrying.
          return Response.json({ received: true, reason: "no_tx_ref" }, { status: 200 });
        }

        try {
          const result = await fulfillPayment(txRef);
          console.log(`[chapa] webhook ${txRef} -> ${result.status}`);
        } catch (error) {
          // Log but still acknowledge: a 5xx would make Chapa retry forever.
          console.error(`[chapa] webhook handling failed for ${txRef}`, error);
        }

        return Response.json({ received: true }, { status: 200 });
      },
    },
  },
});

function safeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}
