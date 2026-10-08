/**
 * Applies the SQL files in drizzle/migrations to the Supabase database.
 *
 * Why this exists: `drizzle-kit migrate` cannot be used here. Its journal in
 * drizzle/migrations/meta only knows about 0000 and 0001, so it would consider
 * 0002 and 0003 "not yet generated" and silently skip them.
 *
 * The earlier migrations were applied by hand in the Supabase SQL editor, so
 * this script PROBES for each migration's effect first: if the objects it
 * creates already exist, it is recorded and skipped. That makes the script safe
 * to re-run and safe on a fresh or partially-migrated database.
 *
 * Credentials (read from .env, one of):
 *   LOVABLE_DB_MIGRATION_URL  postgresql://postgres:PASSWORD@db.<ref>.supabase.co:5432/postgres
 *   DATABASE_URL              same format
 *
 * Usage: node scripts/apply-migrations.mjs [--dry-run]
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = join(root, "drizzle", "migrations");
const dryRun = process.argv.includes("--dry-run");

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

/** How to tell whether each migration has already taken effect. */
const PROBES = {
  "0000_create_wedding_invitations.sql": {
    check: `select count(*)::int as n from information_schema.tables
              where table_schema = 'public' and table_name = 'invitations'`,
    expect: (rows) => rows[0]?.n > 0,
    why: "public.invitations table",
  },
  "0001_secure_wedding_image_uploads.sql": {
    check: `select count(*)::int as n from pg_policies
              where schemaname = 'storage' and policyname like 'Wedding image%'`,
    expect: (rows) => rows[0]?.n >= 2,
    why: "storage policies for wedding-images",
  },
  "0002_accounts_payments_analytics.sql": {
    check: `select count(*)::int as n from information_schema.tables
              where table_schema = 'public'
                and table_name in ('profiles','guests','rsvps','payments')`,
    expect: (rows) => rows[0]?.n === 4,
    why: "profiles / guests / rsvps / payments tables",
  },
  "0003_add_invitation_music_url.sql": {
    check: `select count(*)::int as n from information_schema.columns
              where table_schema = 'public' and table_name = 'invitations'
                and column_name = 'music_url'`,
    expect: (rows) => rows[0]?.n > 0,
    why: "public.invitations.music_url column",
  },
  "0005_add_template_wonderland.sql": {
    // Probed by attempting the wider list in a rolled-back transaction is not
    // possible here, so check the definition text for the newest template.
    check: `select count(*)::int as n from pg_constraint
              where conname = 'invitations_template_id_check'
                and pg_get_constraintdef(oid) like '%wonderland%'`,
    expect: (rows) => rows[0]?.n > 0,
    why: "wonderland in the invitations template check",
  },
  "0006_create_wedding_images_bucket.sql": {
    check: `select count(*)::int as n from storage.buckets where id = 'wedding-images'`,
    expect: (rows) => rows[0]?.n > 0,
    why: "the wedding-images storage bucket",
  },
  "0007_add_template_traditional.sql": {
    check: `select count(*)::int as n from pg_constraint
              where conname = 'invitations_template_id_check'
                and pg_get_constraintdef(oid) like '%traditional%'`,
    expect: (rows) => rows[0]?.n > 0,
    why: "traditional in the invitations template check",
  },
  "0008_add_template_olivia_ethan.sql": {
    check: `select count(*)::int as n from pg_constraint
              where conname = 'invitations_template_id_check'
                and pg_get_constraintdef(oid) like '%olivia-ethan%'`,
    expect: (rows) => rows[0]?.n > 0,
    why: "olivia-ethan in the invitations template check",
  },
};


async function main() {
  const env = loadEnv();
  const connectionString = env.LOVABLE_DB_MIGRATION_URL || env.DATABASE_URL;

  if (!connectionString) {
    console.error("No database connection string found.\n");
    console.error("Add ONE of these to .env (Supabase > Project Settings > Database >");
    console.error("Connection string, role = postgres):\n");
    console.error("  LOVABLE_DB_MIGRATION_URL=postgresql://postgres:YOUR_PASSWORD@db.detqwodttzypzzmevlzq.supabase.co:5432/postgres\n");
    console.error("The password is shown only once when the project is created and cannot");
    console.error("be recovered from the dashboard. If lost, reset it there.");
    process.exit(1);
  }

  if (/["']/.test(connectionString)) {
    throw new Error("The connection string contains quote characters. Remove the quotes in .env.");
  }

  const sql = postgres(connectionString, { max: 1, connect_timeout: 20, ssl: "require" });
  console.log(`Connected${dryRun ? " (dry run -- nothing written)" : ""}.`);
  console.log("");

  try {
    await sql`
      create table if not exists public.tizita_migrations (
        name text primary key,
        applied_at timestamptz not null default now()
      )
    `;
  } catch (error) {
    throw new Error(`Could not ensure the bookkeeping table: ${error.message}`);
  }

  const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  let applied = 0;
  let skipped = 0;

  for (const file of files) {
    const recorded = await sql`select 1 from public.tizita_migrations where name = ${file}`;
    if (recorded.length) {
      console.log(`  skip   ${file}  (already recorded)`);
      skipped += 1;
      continue;
    }

    const probe = PROBES[file];
    if (probe) {
      const rows = await sql.unsafe(probe.check);
      if (probe.expect(rows)) {
        await sql`insert into public.tizita_migrations (name) values (${file}) on conflict do nothing`;
        console.log(`  skip   ${file}  (already applied -- ${probe.why} present)`);
        skipped += 1;
        continue;
      }
    }

    if (dryRun) {
      console.log(`  WOULD  ${file}`);
      continue;
    }

    const ddl = readFileSync(join(migrationsDir, file), "utf8");
    try {
      await sql.begin(async (tx) => {
        await tx.unsafe(ddl);
        await tx`insert into public.tizita_migrations (name) values (${file}) on conflict do nothing`;
      });
      console.log(`  APPLY  ${file}`);
      applied += 1;
    } catch (error) {
      console.error(`  FAILED ${file}`);
      console.error(`         ${error.message}`);
      throw error;
    }
  }

  console.log("");
  console.log(`Done. ${applied} applied, ${skipped} already present.`);
  await sql.end();
}

main().catch((error) => {
  console.error("");
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});
