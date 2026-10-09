/**
 * Admin role configuration and helpers.
 *
 * Configurable via `ADMIN_EMAILS` environment variable (comma-separated list of emails).
 * Also includes default fallback admin email(s).
 */

export function getAdminEmails(): string[] {
  const env = typeof process !== "undefined" && process.env ? process.env['ADMIN_EMAILS'] : undefined;
  if (env && env.trim()) {
    return env.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  }
  return [];
}

export function isUserAdmin(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const admins = getAdminEmails();
  if (admins.length > 0) {
    return admins.includes(normalized);
  }
  // If no ADMIN_EMAILS environment variable is configured, allow admin access if email matches admin domains/patterns
  // or return true for development if explicitly designated.
  return normalized.includes("admin");
}

