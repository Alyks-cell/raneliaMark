-- Run this in Supabase Dashboard → SQL Editor.
create table if not exists public.wedding_rsvps (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null check (char_length(trim(guest_name)) between 1 and 80),
  response text not null check (response in ('yes', 'no')),
  submitted_at timestamptz not null default now(),
  constraint wedding_rsvps_deadline check (submitted_at <= '2026-11-10 23:59:59+08'::timestamptz)
);

alter table public.wedding_rsvps enable row level security;
revoke all on public.wedding_rsvps from anon, authenticated;
grant insert on public.wedding_rsvps to anon;

drop policy if exists "Guests may submit an RSVP" on public.wedding_rsvps;
create policy "Guests may submit an RSVP"
  on public.wedding_rsvps
  for insert
  to anon
  with check (
    char_length(trim(guest_name)) between 1 and 80
    and response in ('yes', 'no')
    and submitted_at <= '2026-11-10 23:59:59+08'::timestamptz
  );

-- No guest list read policy is created, so public visitors cannot read RSVPs.
