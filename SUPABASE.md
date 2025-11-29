# Supabase schema + realtime notes

This repo includes `supabase/lobby.sql` to create the lobby schema, RLS, and realtime triggers. Run it once in your project:

- Open the Supabase SQL editor and paste the file, or run `supabase db execute --file supabase/lobby.sql` with a service-role key.
- Requirements: default Supabase project with `realtime` enabled and `auth.users` present.

## What the SQL does
- Tables: `public.lobbies` (code, host_user_id, is_open, started_at) and `public.lobby_members` (role, status, is_ready).
- RLS: only members/hosts can read; inserts require `auth.uid()`. Hosts can update/delete their lobby; members can update/delete themselves.
- Realtime: triggers fan events into `realtime.messages` on topic `lobby:{lobby_id}:events` with events like `lobby_created`, `member_joined`, `member_ready`, `start`, etc.
- Private channels: RLS on `realtime.messages` means only lobby members/host can subscribe or send.

## Client pattern (supabase-js v2)
```ts
import { getSupabaseClient } from '@/lib/supabaseClient';

const supabase = getSupabaseClient();

// After sign-in, ensure realtime has your JWT (helps in serverless/tab resumes)
const { data: { session } } = await supabase.auth.getSession();
if (session?.access_token) {
  supabase.realtime.setAuth(session.access_token);
}

const lobbyId = '<uuid from lobbies>';
const channel = supabase.channel(`lobby:${lobbyId}:events`, {
  config: { private: true },
});

channel.on('broadcast', { event: '*' }, ({ event, payload }) => {
  // Handle lobby_created, member_joined, member_ready, lobby_open_state, start, etc.
  console.log(event, payload);
});

await channel.subscribe();

// Send actions (optional; DB triggers already broadcast changes)
await channel.send({
  type: 'broadcast',
  event: 'ping',
  payload: { t: Date.now() },
});
```

## Minimal data flow
- Create lobby: `insert into public.lobbies (host_user_id) values (auth.uid()) returning id, code;` then insert the host into `lobby_members` with role `host`.
- Join lobby by code: `select id from lobbies where code = upper($1) and is_open = true` then insert into `lobby_members`.
- Toggle ready: `update lobby_members set is_ready = true where lobby_id = $1 and user_id = auth.uid();`
- Start game: host sets `started_at = now()` (broadcast `start` fired); optionally set `is_open = false`.

Events arrive through the private channel so only authenticated lobby members see them. Indexes cover `user_id` and `lobby_id` for fast RLS lookups.
