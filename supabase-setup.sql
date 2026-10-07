-- Run this in Supabase Dashboard → SQL Editor.
-- Migrate existing RSVPs into response-specific tables, then remove the old
-- mixed table. Re-running this script is safe.
create table if not exists public.wedding_rsvps_yes (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null check (char_length(trim(guest_name)) between 1 and 80),
  submitted_at timestamptz not null default now(),
  constraint wedding_rsvps_yes_deadline check (submitted_at <= '2026-11-10 23:59:59+08'::timestamptz)
);

create table if not exists public.wedding_rsvps_no (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null check (char_length(trim(guest_name)) between 1 and 80),
  submitted_at timestamptz not null default now(),
  constraint wedding_rsvps_no_deadline check (submitted_at <= '2026-11-10 23:59:59+08'::timestamptz)
);

-- Add the response marker to existing tables too, and keep each table's value consistent.
alter table public.wedding_rsvps_yes
  add column if not exists response text not null default 'yes';
update public.wedding_rsvps_yes set response = 'yes' where response is distinct from 'yes';
alter table public.wedding_rsvps_yes alter column response set default 'yes';
alter table public.wedding_rsvps_yes alter column response set not null;

alter table public.wedding_rsvps_no
  add column if not exists response text not null default 'no';
update public.wedding_rsvps_no set response = 'no' where response is distinct from 'no';
alter table public.wedding_rsvps_no alter column response set default 'no';
alter table public.wedding_rsvps_no alter column response set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'wedding_rsvps_yes_response_check') then
    alter table public.wedding_rsvps_yes
      add constraint wedding_rsvps_yes_response_check check (response = 'yes');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'wedding_rsvps_no_response_check') then
    alter table public.wedding_rsvps_no
      add constraint wedding_rsvps_no_response_check check (response = 'no');
  end if;
end $$;

do $$
begin
  if to_regclass('public.wedding_rsvps') is not null then
    insert into public.wedding_rsvps_yes (id, guest_name, submitted_at)
      select id, guest_name, submitted_at from public.wedding_rsvps
      where response = 'yes' on conflict (id) do nothing;
    insert into public.wedding_rsvps_no (id, guest_name, submitted_at)
      select id, guest_name, submitted_at from public.wedding_rsvps
      where response = 'no' on conflict (id) do nothing;
    drop table public.wedding_rsvps;
  end if;
end $$;

alter table public.wedding_rsvps_yes enable row level security;
alter table public.wedding_rsvps_no enable row level security;
revoke all on public.wedding_rsvps_yes, public.wedding_rsvps_no from anon, authenticated;
grant insert on public.wedding_rsvps_yes, public.wedding_rsvps_no to anon;

drop policy if exists "Guests may submit yes RSVP" on public.wedding_rsvps_yes;
create policy "Guests may submit yes RSVP"
  on public.wedding_rsvps_yes for insert to anon
  with check (char_length(trim(guest_name)) between 1 and 80
    and submitted_at <= '2026-11-10 23:59:59+08'::timestamptz);

drop policy if exists "Guests may submit no RSVP" on public.wedding_rsvps_no;
create policy "Guests may submit no RSVP"
  on public.wedding_rsvps_no for insert to anon
  with check (char_length(trim(guest_name)) between 1 and 80
    and submitted_at <= '2026-11-10 23:59:59+08'::timestamptz);

-- No guest list read policy is created, so public visitors cannot read RSVPs.
