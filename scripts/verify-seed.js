import { Client } from 'pg';

async function main() {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error('Set DATABASE_URL or SUPABASE_DB_URL to your Postgres connection string');
    process.exit(1);
  }

  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    const res = await client.query("SELECT count(*)::int as c FROM projects WHERE title ILIKE 'Demo Project%'");
    const count = res.rows[0]?.c ?? 0;
    console.log('Demo project count:', count);
    if (count < 1) {
      console.error('Seed verification failed: demo project not found');
      process.exitCode = 2;
    } else {
      console.log('Seed verification succeeded');
    }
  } catch (err) {
    console.error('Failed to verify seed:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
