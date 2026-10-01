import { TEMPLATE_IDS, type TemplateId } from "./invitation";

/**
 * Template access tiers.
 * `habesha-romance` and `buna-coffee` are paid; the rest publish for free,
 * but still require an account so the owner gets a dashboard.
 */
export const PAID_TEMPLATE_IDS = ["habesha-romance", "buna-coffee"] as const satisfies readonly TemplateId[];
export type PaidTemplateId = (typeof PAID_TEMPLATE_IDS)[number];

export const TEMPLATE_PRICE_ETB: Record<TemplateId, number> = {
  "royal-tewahedo": 0,
  "addis-modern": 0,
  "habesha-romance": 500,
  "lalibela-stone": 0,
  "buna-coffee": 350,
  "wonderland": 0,
  "traditional": 0,
};

export function isPaidTemplate(templateId: TemplateId): boolean {
  return TEMPLATE_PRICE_ETB[templateId] > 0;
}

export function formatEtb(amount: number): string {
  return `${new Intl.NumberFormat("en-US").format(amount)} ETB`;
}

/** Free plan guest capacity, and the default target for the dashboard. */
export const DEFAULT_TARGET_GUEST_COUNT = 50;
export const MAX_TARGET_GUEST_COUNT = 2000;

export const TEMPLATE_TIERS: Record<TemplateId, { tier: "free" | "paid"; label: string }> = {
  "royal-tewahedo": { tier: "free", label: "Free" },
  "addis-modern": { tier: "free", label: "Free" },
  "habesha-romance": { tier: "paid", label: formatEtb(TEMPLATE_PRICE_ETB["habesha-romance"]) },
  "lalibela-stone": { tier: "free", label: "Free" },
  "buna-coffee": { tier: "paid", label: formatEtb(TEMPLATE_PRICE_ETB["buna-coffee"]) },
  "wonderland": { tier: "free", label: "Free" },
  "traditional": { tier: "free", label: "Free" },
};

/** Env that must exist before payments can run. Missing ones surface in the UI. */
export function chapaConfig() {
  return {
    secretKey: process.env["CHAPA_SECRET_KEY"] ?? "",
    webhookSecret: process.env["CHAPA_WEBHOOK_SECRET"] ?? "",
  };
}

export const templateAccess = TEMPLATE_IDS.map((id) => ({
  id,
  ...TEMPLATE_TIERS[id],
  priceEtb: TEMPLATE_PRICE_ETB[id],
}));
