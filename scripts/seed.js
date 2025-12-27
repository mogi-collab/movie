import fs from 'fs/promises';
import path from 'path';
import { Client } from 'pg';

async function runSql(client, sql) {
  // Execute multiple statements in the file
  const statements = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    await client.query(stmt);
  }
}

async function main() {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error('Set DATABASE_URL or SUPABASE_DB_URL to your Postgres connection string (e.g. postgres://user:pass@host:5432/db)');
    process.exit(1);
  }

  const migrate = process.argv.includes('--migrate');

  const seedPath = path.resolve(process.cwd(), 'supabase', 'migrations', '20251227060500_002_seed_core_tables.sql');
  const migratePath = path.resolve(process.cwd(), 'supabase', 'migrations', '20251227053429_001_create_core_tables.sql');

  let seedSql = await fs.readFile(seedPath, 'utf8');
  let migrateSql = '';
  try {
    migrateSql = await fs.readFile(migratePath, 'utf8');
  } catch (err) {
    // if migration file missing, continue (seed alone is still useful)
    migrateSql = '';
  }

  // Simple psql \set handling: replace occurrences like :'project_id' with literal values
  const defs = {};
  seedSql = seedSql.replace(/\\set\s+(\w+)\s+'([^']+)'/g, (_, k, v) => { defs[k] = v; return ''; });
  for (const [k, v] of Object.entries(defs)) {
    const re = new RegExp(`:\'${k}\'`, 'g');
    seedSql = seedSql.replace(re, `'${v}'`);
    migrateSql = migrateSql.replace(re, `'${v}'`);
  }

  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    console.log('Connected to DB');

    if (migrate && migrateSql) {
      console.log('Applying migrations...');
      await runSql(client, migrateSql);
      console.log('Migrations applied.');
    }

    console.log('Running seed SQL...');
    await runSql(client, seedSql);
    console.log('Seed completed successfully.');
  } catch (err) {
    console.error('Failed to run migrations/seed:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
