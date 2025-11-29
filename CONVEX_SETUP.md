# Convex Setup Guide

This project has been migrated from Supabase to Convex for a simpler, more integrated backend solution.

## What Changed?

- **Authentication**: Now handled by Convex (password-based auth)
- **Database**: Convex replaces PostgreSQL for lobbies, users, and game state
- **Realtime**: Convex's built-in reactivity replaces Supabase realtime channels
- **No WebSocket backend needed**: Convex handles everything

## Setup Instructions

### 1. Create a Convex Account

1. Go to https://dashboard.convex.dev
2. Sign up for a free account (no credit card required)
3. Create a new project called "wordhex" (or any name you prefer)

### 2. Get Your Deployment URL

After creating your project:
1. Go to your project settings
2. Copy the **Deployment URL** (looks like `https://your-project.convex.cloud`)

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

Replace `https://your-project.convex.cloud` with your actual deployment URL.

### 4. Deploy Convex Functions

In your terminal, run:

```bash
npx convex dev
```

This will:
- Push your schema and functions to Convex
- Start watching for changes
- Generate TypeScript types for your functions

**Important**: Keep this terminal running during development!

### 5. Start the Next.js Development Server

In a **separate terminal**, run:

```bash
npm run dev
```

### 6. Open the App

Visit http://localhost:3000

## How It Works

### Authentication
- Users sign up/sign in with email and password
- Credentials are securely hashed and stored in Convex
- Session is stored in localStorage

### Lobbies
- Create a lobby → gets a 6-character code
- Share the code with friends
- Up to 4 players per lobby
- Real-time updates when players join/ready up
- Host can start the game when ready

### Database Schema

**users**
- email
- passwordHash
- createdAt

**lobbies**
- code (6-char unique code)
- hostUserId
- isOpen (boolean)
- startedAt (timestamp)
- createdAt

**lobbyMembers**
- lobbyId
- userId
- role (host/member)
- status (active/left/kicked)
- isReady (boolean)
- joinedAt

## Development Workflow

1. **Start Convex dev**: `npx convex dev` (keeps running)
2. **Start Next.js**: `npm run dev` (in separate terminal)
3. Make changes to:
   - Frontend: Hot reload automatically
   - Convex functions: Auto-deploy on save
   - Schema: Auto-push on save

## Production Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import to Vercel
3. Add environment variable: `NEXT_PUBLIC_CONVEX_URL`
4. Deploy!

Convex functions are already deployed when you run `npx convex dev` - they work in production immediately.

## Troubleshooting

### "Cannot find module '@/convex/_generated/api'"

Run `npx convex dev` to generate the TypeScript types.

### "Failed to fetch convex functions"

Check that:
1. `NEXT_PUBLIC_CONVEX_URL` is set correctly in `.env.local`
2. `npx convex dev` is running
3. You copied the full URL including `https://`

### Auth not working

Make sure you're signed in to Convex dashboard and `npx convex dev` is running.

## Migration Notes

### What Was Removed
- `@supabase/supabase-js` package
- `lib/supabaseClient.ts`
- `lib/game/lobbySocket.tsx` (custom WebSocket)
- `lib/game/wsAuth.ts`
- `supabase/` directory
- `SUPABASE.md`

### What Was Added
- `convex/` directory with schema and functions
- `convex.json` config
- `components/ConvexClientProvider.tsx`
- This setup guide

## Benefits of Convex

✅ **Simpler setup**: One provider instead of Supabase + custom backend
✅ **Type safety**: Auto-generated TypeScript types
✅ **Real-time by default**: No manual subscriptions needed
✅ **Better DX**: Hot reload for functions
✅ **Cheaper**: Generous free tier
✅ **Less code**: 70% less boilerplate than Supabase + WebSocket

## Need Help?

- Convex Docs: https://docs.convex.dev
- Convex Discord: https://convex.dev/community
