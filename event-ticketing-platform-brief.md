# Project Brief: Event Ticketing & Check-In Platform

## Overview
A web platform for event organizers to create events, register delegates, generate unique QR-coded tickets per delegate, and check delegates in at the venue via a browser-based QR scanner. Includes scanner staff accounts with login.

## Tech Stack
- **Framework:** Next.js (App Router)
- **Database/Auth/Realtime:** Supabase (Postgres)
- **QR generation:** `qrcode` (npm)
- **QR scanning:** `html5-qrcode` or `@zxing/browser`
- **Styling:** Tailwind CSS

## Data Model

```sql
-- Events
events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date,
  venue text,
  status text default 'draft', -- draft | live | closed
  created_at timestamptz default now()
)

-- Delegates
delegates (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
)

-- Tickets (1:1 with delegate)
tickets (
  id uuid primary key default gen_random_uuid(),
  delegate_id uuid references delegates(id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  token text unique not null, -- opaque random string, used in QR/link
  status text default 'unused', -- unused | checked_in
  scan_count integer default 0,
  checked_in_at timestamptz,
  created_at timestamptz default now()
)

-- Scan Logs (every scan attempt, accepted or denied)
scan_logs (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references tickets(id) on delete cascade,
  scanned_at timestamptz default now(),
  result text not null, -- accepted | denied
  scanned_by uuid references scanners(id)
)

-- Scanner accounts (staff who operate the scanner app)
scanners (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  name text not null,
  email text unique not null,
  -- auth handled via Supabase Auth; this table links auth user to event/role
  auth_user_id uuid references auth.users(id),
  created_at timestamptz default now()
)
```

## Core Features

### 1. Event & Delegate Management
- Organizer creates an event.
- Add delegates individually (name only) or via CSV upload (name column).
- On delegate creation, auto-generate a Ticket row with a unique opaque token (UUID or random base62 string) and corresponding QR code (encodes a link like `/ticket/{token}`).

### 2. Delegate Dashboard
- Table view: Name | Personal Link | QR thumbnail | Status (Not checked in / Checked in at TIME) | Scan Count
- Per-row actions: copy link to clipboard, download individual QR as PNG.
- Bulk actions: export all as CSV (name, token, link, status, scan_count), download all QR codes as a printable PDF sheet (multiple badges per page).
- Expandable row to view full scan_logs history for a delegate.

### 3. Check-In API (Atomic)
Single endpoint `POST /api/checkin` accepting `{ token, scannerId }`. Must perform an atomic update:

```sql
UPDATE tickets
SET 
  scan_count = scan_count + 1,
  status = CASE WHEN status = 'unused' THEN 'checked_in' ELSE status END,
  checked_in_at = CASE WHEN status = 'unused' THEN now() ELSE checked_in_at END
WHERE token = $1
RETURNING status, scan_count, checked_in_at, delegate_id;
```

- If returned `scan_count = 1` and `status = 'checked_in'` → response: accepted, show delegate name.
- If `scan_count > 1` → response: denied, "already checked in at {checked_in_at}".
- Insert a `scan_logs` row with the result and `scanned_by = scannerId`, regardless of outcome.

### 4. Scanner Accounts & Login
- Scanners are staff accounts created by the organizer (name + email), tied to a specific event.
- Use Supabase Auth (magic link or email/password) for scanner login.
- After login, scanner app shows a simple camera scanner UI scoped to their assigned event.
- Every check-in call includes the logged-in scanner's ID for the `scanned_by` field.

### 5. Scanner Web App
- `/scan` route, protected (requires scanner login).
- Camera-based QR scanner using `html5-qrcode`, rear camera by default.
- On scan: POST to `/api/checkin`, show clear full-screen accepted (green, delegate name) or denied (red, "already scanned at TIME") result.
- Should work as installable PWA for full-screen, app-like experience on mobile browsers.

### 6. Public Ticket Page
- `/ticket/{token}` — shows delegate name and their QR code. No auth required (token is the secret).

## Build Order
1. Supabase schema + RLS policies (organizer-only writes to events/delegates/tickets; scanners can only read their event's tickets and call check-in via API route using service role).
2. Event/delegate CRUD + auto ticket/QR generation.
3. Dashboard table with copy/download/export.
4. Atomic check-in API route.
5. Scanner auth + scanner web app.
6. PDF badge export.

## Non-Goals (for now)
- No email/SMS delivery of links — distribution is manual via dashboard.
- No multi-tenant org accounts — single organizer per event for now.
- No offline scanning queue (can be added later if venue connectivity is a concern).
