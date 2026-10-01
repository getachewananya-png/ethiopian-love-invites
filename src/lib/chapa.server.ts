import { TEMPLATE_PRICE_ETB, type PaidTemplateId } from "./plans";
import { type TemplateId } from "./invitation";

/** Shape returned by the Chapa initialize endpoint. */
export interface ChapaInitializeResponse {
  status: string;
  message: string;
  data?: { checkout_url: string };
}

/** Shape returned by the Chapa verify endpoint. */
export interface ChapaVerifyResponse {
  status: string;
  message: string;
  data?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    currency: string;
    amount: number | string;
    charge?: number | string;
    mode?: "test" | "live";
    method?: string;
    reference?: string;
    tx_ref: string;
    status: "pending" | "success" | "failed" | "cancelled";
    created_at?: string;
  };
}

export const CHAPA_API_BASE = "https://api.chapa.co/v1";

export function requireChapaSecret(): string {
  const key = process.env["CHAPA_SECRET_KEY"];
  if (!key) {
    throw new Error("Missing CHAPA_SECRET_KEY. Add your Chapa secret key (CHASECK-... or CHASECK_TEST-...) to the server environment.");
  }
  return key;
}

export function expectedAmount(templateId: TemplateId): number {
  return TEMPLATE_PRICE_ETB[templateId];
}

export function assertPaidTemplate(templateId: TemplateId): asserts templateId is PaidTemplateId {
  if (TEMPLATE_PRICE_ETB[templateId] <= 0) {
    throw new Error(`${templateId} is a free template and does not require payment.`);
  }
}

/**
 * `tx_ref` must be unique per transaction. Uses a random suffix so a retry
 * after a failure never collides with a previously-issued reference.
 */
export function buildTxRef(userId: string): string {
  const stamp = Date.now().toString(36);
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  return `tizita-${userId.slice(0, 8)}-${stamp}-${rand}`;
}

/** Normalises Chapa's amount (string or number) for comparison with our stored price. */
export function parseAmount(value: number | string | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number.parseFloat(value);
  return Number.NaN;
}
