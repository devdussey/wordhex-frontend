-- Schema + RLS + realtime triggers for lobbies and lobby members
-- Run this in the Supabase SQL editor or via `supabase db execute`.
-- Assumes the `realtime` extension and `auth.users` are present (default Supabase project).

create extension if not exists "pgcrypto";

-- Tables
create table if not exists public.lobbies (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_user_id uuid not null references auth.users(id) on delete cascade,
  is_open boolean not null default true,
  started_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.lobby_members (
  lobby_id uuid not null references public.lobbies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('host','member')),
  status text not null default 'active' check (status in ('active','left','kicked')),
  is_ready boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (lobby_id, user_id)
);

-- Indexes used by RLS lookups
create index if not exists idx_lobby_members_user on public.lobby_members(user_id);
create index if not exists idx_lobby_members_lobby on public.lobby_members(lobby_id);
create index if not exists idx_lobbies_code on public.lobbies(code);

-- Generate a short, unique, uppercase lobby code (needs the table to exist first)
create or replace function public.generate_lobby_code()
returns text
language plpgsql
as $$
declare
  new_code text;
begin
  loop
    new_code := upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));
    exit when not exists (select 1 from public.lobbies where code = new_code);
  end loop;
  return new_code;
end;
$$;

alter table public.lobbies alter column code set default public.generate_lobby_code();

-- Helper functions for RLS
create or replace function public.is_lobby_member(p_lobby_id uuid)
returns boolean
security definer
set search_path = public
language sql
as $$
  select exists (
    select 1
    from public.lobby_members m
    where m.lobby_id = p_lobby_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function public.is_lobby_host(p_lobby_id uuid)
returns boolean
security definer
set search_path = public
language sql
as $$
  select exists (
    select 1
    from public.lobbies l
    where l.id = p_lobby_id
      and l.host_user_id = auth.uid()
  );
$$;

create or replace function public.topic_lobby_id(p_topic text)
returns uuid
immutable
language sql
as $$
  -- topics are shaped like lobby:{lobby_id}:events
  select nullif(split_part(p_topic, ':', 2), '')::uuid;
$$;

-- Enable RLS
alter table public.lobbies enable row level security;
alter table public.lobby_members enable row level security;
alter table realtime.messages enable row level security;

-- Policies for lobbies
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'lobbies_select_member') then
    create policy lobbies_select_member
      on public.lobbies
      for select
      using (public.is_lobby_member(id) or public.is_lobby_host(id));
  end if;

  if not exists (select 1 from pg_policies where policyname = 'lobbies_insert_host_only') then
    create policy lobbies_insert_host_only
      on public.lobbies
      for insert
      with check (auth.uid() = host_user_id);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'lobbies_update_host_only') then
    create policy lobbies_update_host_only
      on public.lobbies
      for update
      using (public.is_lobby_host(id));
  end if;

  if not exists (select 1 from pg_policies where policyname = 'lobbies_delete_host_only') then
    create policy lobbies_delete_host_only
      on public.lobbies
      for delete
      using (public.is_lobby_host(id));
  end if;
end $$;

-- Policies for lobby_members
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'lobby_members_select_member') then
    create policy lobby_members_select_member
      on public.lobby_members
      for select
      using (public.is_lobby_member(lobby_id) or public.is_lobby_host(lobby_id));
  end if;

  if not exists (select 1 from pg_policies where policyname = 'lobby_members_insert_self') then
    create policy lobby_members_insert_self
      on public.lobby_members
      for insert
      with check (
        auth.uid() = user_id
        and exists (select 1 from public.lobbies l where l.id = lobby_id and l.is_open)
      );
  end if;

  if not exists (select 1 from pg_policies where policyname = 'lobby_members_update_self_or_host') then
    create policy lobby_members_update_self_or_host
      on public.lobby_members
      for update
      using (auth.uid() = user_id or public.is_lobby_host(lobby_id))
      with check (auth.uid() = user_id or public.is_lobby_host(lobby_id));
  end if;

  if not exists (select 1 from pg_policies where policyname = 'lobby_members_delete_self_or_host') then
    create policy lobby_members_delete_self_or_host
      on public.lobby_members
      for delete
      using (auth.uid() = user_id or public.is_lobby_host(lobby_id));
  end if;
end $$;

-- RLS for realtime.messages to enforce private channels per lobby
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'realtime_messages_lobby_select') then
    create policy realtime_messages_lobby_select
      on realtime.messages
      for select
      using (
        topic like 'lobby:%:events'
        and public.is_lobby_member(public.topic_lobby_id(topic))
      );
  end if;

  if not exists (select 1 from pg_policies where policyname = 'realtime_messages_lobby_insert') then
    create policy realtime_messages_lobby_insert
      on realtime.messages
      for insert
      with check (
        topic like 'lobby:%:events'
        and (
          public.is_lobby_member(public.topic_lobby_id(topic))
          or public.is_lobby_host(public.topic_lobby_id(topic))
        )
      );
  end if;
end $$;

-- Helper to fan events into realtime.messages
create or replace function public.emit_lobby_event(p_lobby_id uuid, p_event text, p_payload jsonb)
returns void
security definer
set search_path = public, realtime
language plpgsql
as $$
begin
  insert into realtime.messages (topic, event, payload)
  values ('lobby:' || p_lobby_id || ':events', p_event, coalesce(p_payload, '{}'::jsonb));
end;
$$;

-- Triggers to broadcast lobby lifecycle
create or replace function public.handle_lobbies_realtime()
returns trigger
security definer
set search_path = public, realtime
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    perform public.emit_lobby_event(NEW.id, 'lobby_created', jsonb_build_object('lobby', row_to_json(NEW)));
    return NEW;
  elsif TG_OP = 'UPDATE' then
    if (OLD.is_open is distinct from NEW.is_open) then
      perform public.emit_lobby_event(NEW.id, 'lobby_open_state', jsonb_build_object('is_open', NEW.is_open));
    end if;
    if (OLD.started_at is distinct from NEW.started_at and NEW.started_at is not null) then
      perform public.emit_lobby_event(NEW.id, 'start', jsonb_build_object('started_at', NEW.started_at, 'lobby', row_to_json(NEW)));
    end if;
    perform public.emit_lobby_event(NEW.id, 'lobby_updated', jsonb_build_object('lobby', row_to_json(NEW)));
    return NEW;
  elsif TG_OP = 'DELETE' then
    perform public.emit_lobby_event(OLD.id, 'lobby_deleted', jsonb_build_object('lobby', row_to_json(OLD)));
    return OLD;
  end if;
  return null;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_lobbies_realtime') then
    create trigger trg_lobbies_realtime
      after insert or update or delete on public.lobbies
      for each row execute function public.handle_lobbies_realtime();
  end if;
end $$;

-- Triggers to broadcast lobby member changes
create or replace function public.handle_lobby_members_realtime()
returns trigger
security definer
set search_path = public, realtime
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    perform public.emit_lobby_event(NEW.lobby_id, 'member_joined', jsonb_build_object('member', row_to_json(NEW)));
    return NEW;
  elsif TG_OP = 'UPDATE' then
    if NEW.is_ready is distinct from OLD.is_ready then
      perform public.emit_lobby_event(NEW.lobby_id, 'member_ready', jsonb_build_object('member', row_to_json(NEW), 'ready', NEW.is_ready));
    end if;
    if NEW.status is distinct from OLD.status or NEW.role is distinct from OLD.role then
      perform public.emit_lobby_event(NEW.lobby_id, 'member_updated', jsonb_build_object('member', row_to_json(NEW)));
    end if;
    return NEW;
  elsif TG_OP = 'DELETE' then
    perform public.emit_lobby_event(OLD.lobby_id, 'member_left', jsonb_build_object('member', row_to_json(OLD)));
    return OLD;
  end if;
  return null;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_lobby_members_realtime') then
    create trigger trg_lobby_members_realtime
      after insert or update or delete on public.lobby_members
      for each row execute function public.handle_lobby_members_realtime();
  end if;
end $$;

-- Convenience view for current lobby state (optional for debugging)
create or replace view public.lobby_with_members as
select
  l.*,
  jsonb_agg(
    jsonb_build_object(
      'user_id', m.user_id,
      'role', m.role,
      'status', m.status,
      'is_ready', m.is_ready,
      'joined_at', m.joined_at
    ) order by m.joined_at
  ) filter (where m.user_id is not null) as members
from public.lobbies l
left join public.lobby_members m on m.lobby_id = l.id
group by l.id;
