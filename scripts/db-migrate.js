/**
 * Applies db/migrations/*.sql in filename order, once each, recording them in
 * schema_migrations. Runs as part of `npm run build`, so every Vercel
 * deployment migrates its own database (production, or the preview's Neon
 * branch) before the new code goes live.
 *
 *   npm run db:migrate            (uses DATABASE_URL_UNPOOLED or DATABASE_URL)
 *
 * Without a database URL it skips, except on a Vercel production build, where
 * a missing database is an error.
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DIR = path.join(__dirname, '..', 'db', 'migrations');
const LOCK_ID = 726354901; // arbitrary, constant: serializes concurrent builds

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    if (process.env.VERCEL_ENV === 'production') {
      throw new Error('DATABASE_URL is not set for the production build.');
    }
    console.log('[db-migrate] No DATABASE_URL; skipping migrations.');
    return;
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query('select pg_advisory_lock($1)', [LOCK_ID]);
    await client.query(
      'create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())',
    );
    const done = new Set((await client.query('select name from schema_migrations')).rows.map((r) => r.name));
    const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort();
    let applied = 0;
    for (const file of files) {
      if (done.has(file)) continue;
      const sql = fs.readFileSync(path.join(DIR, file), 'utf8');
      await client.query('begin');
      try {
        await client.query(sql);
        await client.query('insert into schema_migrations (name) values ($1)', [file]);
        await client.query('commit');
      } catch (err) {
        await client.query('rollback');
        throw new Error(`Migration ${file} failed: ${err.message}`);
      }
      console.log(`[db-migrate] applied ${file}`);
      applied++;
    }
    console.log(`[db-migrate] up to date (${applied} applied, ${files.length} total)`);
  } finally {
    await client.query('select pg_advisory_unlock($1)', [LOCK_ID]).catch(() => {});
    await client.end();
  }
}

main().catch((err) => {
  console.error('[db-migrate]', err.message);
  process.exit(1);
});
