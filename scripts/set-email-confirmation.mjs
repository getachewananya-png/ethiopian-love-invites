/**
 * Turns email confirmation on or off for THIS Supabase project.
 *
 * Why this exists: "Confirm email" is a project setting in the Supabase
 * dashboard (Authentication -> Sign In / Providers -> Email), not something the
 * app code can change. It is currently OFF so that signing up drops someone
 * straight into the dashboard instead of parking them at "check your inbox".
 *
 * Changing it needs a *personal access token* from
 * https://supabase.com/dashboard/account/tokens -- the service_role key in .env
 * can read and write your database rows but cannot change project settings.
 *
 * Usage (PowerShell):
 *   $env:SUPABASE_ACCESS_TOKEN = "sbp_..."
 *   node scripts/set-email-confirmation.mjs              # show the current value
 *   node scripts/set-email-confirmation.mjs --autoconfirm  # skip confirmation
 *   node scripts/set-email-confirmation.mjs --confirm      # require confirmation
 *
 * Afterwards, set EMAIL_CONFIRMATION_ENABLED in src/lib/auth.ts to match, so
 * the sign-in and sign-up wording agrees with what the project actually does.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://api.supabase.com/v1";

/** Minimal .env parser. Values may be quoted -- strip the quotes. */
function loadEnv() {
  const env = {};
  let raw = "";
  try {
    raw = readFileSync(join(root, ".env"), "utf8");
  } catch {
    throw new Error(".env not found. Copy .env.example to .env first.");
  }
  for (const line of raw.split(/\r?\n/)) {
    const match = /^\s*([A-Za-z_0-9]+)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    let value = match[2].trim();
    if (!/^["']/.test(value)) value = value.replace(/\s+#.*$/, "").trim();
    value = value.replace(/^["']/, "").replace(/["']$/, "").trim();
    env[match[1]] = value;
  }
  return env;
}

/**
 * The project ref is the host in SUPABASE_URL. Deliberately NOT taken from
 * SUPABASE_PROJECT_ID: that value does not match the URL in this repo, and
 * guessing wrong would mean editing some other project's settings by accident.
 */
function projectRef(env) {
  const url = env.SUPABASE_URL;
  if (!url) throw new Error("SUPABASE_URL is not set in .env.");
  const ref = new URL(url).hostname.split(".")[0];
  if (env.SUPABASE_PROJECT_ID && env.SUPABASE_PROJECT_ID !== ref) {
    console.warn(
      `! SUPABASE_PROJECT_ID is "${env.SUPABASE_PROJECT_ID}" but SUPABASE_URL points at "${ref}".\n` +
        `  Using ${ref}. You may want to fix the stale value in .env and supabase/config.toml.\n`,
    );
  }
  return ref;
}

function requireToken() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    console.error("SUPABASE_ACCESS_TOKEN is not set.\n");
    console.error("Create a personal access token at:");
    console.error("  https://supabase.com/dashboard/account/tokens");
    console.error("then run, in this same PowerShell session:");
    console.error('  $env:SUPABASE_ACCESS_TOKEN = "sbp_..."\n');
    process.exit(1);
  }
  return token;
}

async function getAuthConfig(ref, token) {
  const res = await fetch(`${API}/projects/${ref}/config/auth`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Could not read the auth config (HTTP ${res.status}): ${await res.text()}`);
  }
  return res.json();
}

async function setAutoconfirm(ref, token, on) {
  const res = await fetch(`${API}/projects/${ref}/config/auth`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ mailer_autoconfirm: on }),
  });
  if (!res.ok) {
    throw new Error(`Could not update the auth config (HTTP ${res.status}): ${await res.text()}`);
  }
  return res.json();
}

function report(ref, config) {
  console.log(`\nProject ${ref}`);
  console.log(`  mailer_autoconfirm : ${config.mailer_autoconfirm}`);
  console.log(`  disable_signup     : ${config.disable_signup}`);
  console.log(
    config.mailer_autoconfirm
      ? "\n  Email confirmation is OFF -- signUp returns a session and the user lands in the dashboard."
      : "\n  Email confirmation is ON -- signUp returns no session and the user must click an emailed link.",
  );
}

async function main() {
  const args = process.argv.slice(2);
  const autoconfirm = args.includes("--autoconfirm");
  const confirm = args.includes("--confirm");
  if (autoconfirm && confirm) {
    throw new Error("Pass either --autoconfirm or --confirm, not both.");
  }

  const ref = projectRef(loadEnv());
  const token = requireToken();

  if (autoconfirm || confirm) {
    await setAutoconfirm(ref, token, autoconfirm);
  }

  report(ref, await getAuthConfig(ref, token));

  if (autoconfirm || confirm) {
    console.log(
      `\nSet EMAIL_CONFIRMATION_ENABLED in src/lib/auth.ts to ${confirm} so the copy matches.\n`,
    );
  }
}

main().catch((error) => {
  console.error(`\nERROR: ${error.message}`);
  process.exit(1);
});
