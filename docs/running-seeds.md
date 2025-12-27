# Running seed data locally

This project includes a seed SQL file for local development which populates example projects, director inputs, sliders, ideas, scripts, scenes, characters, and debates.

Prerequisites
- A running Postgres database (Supabase local or remote).
- An environment variable `DATABASE_URL` or `SUPABASE_DB_URL` set to the Postgres connection string.
- Node.js available (>= 18 recommended).

Run the seed
1. Install dev dependencies (if not already):

   npm install

2. Run the seed script:

   npm run seed:db

Notes
- The seed script will parse `supabase/migrations/20251227060500_002_seed_core_tables.sql` and replace psql `\set` variables with literal values, then execute the SQL.
- If you prefer to run the SQL by hand, use psql or the Supabase CLI:

  psql $DATABASE_URL -f supabase/migrations/20251227060500_002_seed_core_tables.sql

- The seed is idempotent (uses `ON CONFLICT DO NOTHING`) for safe re-runs.
