/**
 * Transactional email for guest invitations.
 *
 * Uses the Resend HTTP API directly via fetch rather than adding an SDK — one
 * dependency fewer, and the request shape is small and stable.
 *
 * This module is server-only (.server.ts), so RESEND_API_KEY never reaches the
 * browser bundle.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function isEmailConfigured(): boolean {
  return Boolean(process.env["RESEND_API_KEY"] && emailFrom());
}

function emailFrom(): string {
  // Resend only sends to real addresses on a verified domain in production.
  return process.env["RESEND_FROM"] ?? "";
}

function requireConfig(): { apiKey: string; from: string } {
  const apiKey = process.env["RESEND_API_KEY"] ?? "";
  const from = emailFrom();
  const missing: string[] = [];
  if (!apiKey) missing.push("RESEND_API_KEY");
  if (!from) missing.push("RESEND_FROM");
  if (missing.length) {
    throw new Error(
      `Missing email config: ${missing.join(", ")}. Add ${missing.length === 1 ? "it" : "them"} to your server .env, then restart. ` +
        `RESEND_API_KEY is from resend.com/api-keys. RESEND_FROM must be a sender you have verified in Resend (e.g. "Tizita <invites@yourdomain.com>"). ` +
        `See .env.example.`,
    );
  }
  return { apiKey, from };
}

export interface InvitationEmailInput {
  to: string;
  guestName: string;
  brideName: string;
  groomName: string;
  weddingDate: string;
  venue: string | null;
  shareUrl: string;
  customMessage: string | null;
}

/** RFC 5322 date for the Date header, e.g. "Mon, 12 Oct 2026 09:00:00 +0000". */
function rfc2822(date: Date): string {
  return date.toUTCString().replace("GMT", "+0000");
}

/** Escapes text for safe interpolation into the HTML body. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Sends one guest their private invitation link. Throws with a readable message
 * on failure so the dashboard can surface it rather than failing silently.
 */
export async function sendInvitationEmail(input: InvitationEmailInput): Promise<{ id: string }> {
  const { apiKey, from } = requireConfig();

  const couple = `${input.brideName} & ${input.groomName}`;
  const subject = `${input.brideName} & ${input.groomName} — Wedding Invitation`;
  const heading = `You are invited, ${input.guestName}`;
  const message = input.customMessage?.trim()
    ? input.customMessage.trim()
    : "Together with their families, they would be delighted to celebrate with you.";

  // Table-based + inline-styled: email clients strip <style> blocks and classes.
  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f4f1;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4f1;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffdf9;border:1px solid #e6ded2;border-radius:20px;overflow:hidden;">
<tr><td style="background:#6b1f2b;padding:28px 32px;text-align:center;">
<p style="margin:0 0 6px;font-size:13px;letter-spacing:3px;color:#e8c9a0;uppercase;">ትዝታ · TIZITA</p>
<h1 style="margin:0;font-family:Georgia,serif;font-size:26px;line-height:1.3;color:#fffdf9;">${escapeHtml(couple)}</h1>
</td></tr>
<tr><td style="padding:32px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#3a3a3a;">
<h2 style="margin:0 0 12px;font-size:20px;color:#6b1f2b;">${escapeHtml(heading)}</h2>
<p style="margin:0 0 20px;font-size:15px;line-height:1.7;">${escapeHtml(message)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;"><tr>
<td style="padding:4px 20px 4px 0;font-size:15px;"><strong>Date</strong><br/><span style="color:#666;">${escapeHtml(input.weddingDate)}</span></td>
${input.venue ? `<td style="padding:4px 0;font-size:15px;"><strong>Venue</strong><br/><span style="color:#666;">${escapeHtml(input.venue)}</span></td>` : ""}
</tr></table>
<p style="margin:0 0 28px;">
<a href="${escapeHtml(input.shareUrl)}" style="display:inline-block;background:#6b1f2b;color:#fffdf9;text-decoration:none;padding:14px 30px;border-radius:999px;font-weight:600;">Open your invitation</a>
</p>
<p style="margin:0;font-size:13px;line-height:1.6;color:#888;">If the button does not work, copy this link into your browser:<br/>
<a href="${escapeHtml(input.shareUrl)}" style="color:#6b1f2b;">${escapeHtml(input.shareUrl)}</a></p>
</td></tr>
<tr><td style="background:#f3ede4;padding:16px 32px;text-align:center;font-size:12px;color:#888;">
Sent with love by Tizita
</td></tr>
</table>
</td></tr></table>
</body></html>`;

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject,
      html,
      // Keep the plain URL visible in list previews; some clients render text
      // alongside HTML and a link-less text part looks broken.
      text: `${heading}\n\n${message}\n\n${couple}\nDate: ${input.weddingDate}${input.venue ? `\nVenue: ${input.venue}` : ""}\n\nOpen your invitation: ${input.shareUrl}`,
      headers: { "X-Entity-Ref-ID": input.shareUrl },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Email could not be sent to ${input.to} (${response.status}). ${body.slice(0, 300)}`);
  }

  const payload = (await response.json().catch(() => ({}))) as { id?: string };
  return { id: payload.id ?? "" };
}

/** Exposed for the Date-header helper in tests/debugging. */
export const __rfc2822 = rfc2822;
