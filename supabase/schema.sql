-- ============================================================
-- Prime Scanner — Supabase Schema
-- Run this in the Supabase SQL editor (or via supabase db push)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────

create table if not exists events (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  date       date,
  venue      text,
  status     text not null default 'draft', -- draft | live | closed
  created_at timestamptz not null default now()
);

create table if not exists delegates (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

create table if not exists tickets (
  id             uuid primary key default gen_random_uuid(),
  delegate_id    uuid not null references delegates(id) on delete cascade,
  event_id       uuid not null references events(id) on delete cascade,
  token          text unique not null,
  status         text not null default 'unused', -- unused | checked_in
  scan_count     integer not null default 0,
  checked_in_at  timestamptz,
  created_at     timestamptz not null default now()
);

create table if not exists scanners (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references events(id) on delete cascade,
  name         text not null,
  email        text unique not null,
  auth_user_id uuid references auth.users(id),
  created_at   timestamptz not null default now()
);

create table if not exists scan_logs (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references tickets(id) on delete cascade,
  scanned_at  timestamptz not null default now(),
  result      text not null, -- accepted | denied
  scanned_by  uuid references scanners(id)
);

-- ─────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────

create index if not exists idx_delegates_event_id on delegates(event_id);
create index if not exists idx_tickets_event_id   on tickets(event_id);
create index if not exists idx_tickets_token       on tickets(token);
create index if not exists idx_scan_logs_ticket_id on scan_logs(ticket_id);

-- ─────────────────────────────────────────────────────────────
-- Atomic check-in stored procedure
-- Called via supabase.rpc('checkin_ticket', { p_token: '...' })
-- Returns: status, scan_count, checked_in_at, delegate_id
-- ─────────────────────────────────────────────────────────────

create or replace function checkin_ticket(p_token text)
returns table (
  status        text,
  scan_count    integer,
  checked_in_at timestamptz,
  delegate_id   uuid
)
language sql
as $$
  update tickets
  set
    scan_count    = tickets.scan_count + 1,
    status        = case when tickets.status = 'unused' then 'checked_in' else tickets.status end,
    checked_in_at = case when tickets.status = 'unused' then now() else tickets.checked_in_at end
  where token = p_token
  returning
    tickets.status,
    tickets.scan_count,
    tickets.checked_in_at,
    tickets.delegate_id;
$$;

-- ─────────────────────────────────────────────────────────────
-- RLS (Row Level Security)
-- All writes from app code use the service-role key and bypass
-- RLS. Public read of tickets by token is enabled for the
-- /ticket/[token] page. Scanners can read their own row.
-- ─────────────────────────────────────────────────────────────

alter table events     enable row level security;
alter table delegates  enable row level security;
alter table tickets    enable row level security;
alter table scanners   enable row level security;
alter table scan_logs  enable row level security;

-- Public: anyone can look up a ticket by token (token acts as the secret)
create policy "public ticket read by token"
  on tickets for select
  using (true);

-- Scanners: can read delegates and tickets for their assigned event
create policy "scanner read delegates"
  on delegates for select
  using (
    exists (
      select 1 from scanners s
      where s.auth_user_id = auth.uid()
        and s.event_id = delegates.event_id
    )
  );

create policy "scanner read tickets"
  on tickets for select
  using (
    exists (
      select 1 from scanners s
      where s.auth_user_id = auth.uid()
        and s.event_id = tickets.event_id
    )
  );

-- Scanners: can read their own scanner row
create policy "scanner read self"
  on scanners for select
  using (auth_user_id = auth.uid());

-- Service role bypasses all RLS — no additional policies needed for
-- organizer writes (events, delegates, tickets, scan_logs creation).
