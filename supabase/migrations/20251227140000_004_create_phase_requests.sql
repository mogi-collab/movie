-- Create table to store early access requests for coming-soon phases

create table if not exists public.phase_requests (
  id uuid default gen_random_uuid() primary key,
  project_id uuid,
  phase integer not null,
  email text not null,
  notes text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- Optionally add an index to query by phase or email
create index if not exists idx_phase_requests_phase on public.phase_requests (phase);
create index if not exists idx_phase_requests_email on public.phase_requests (lower(email));
