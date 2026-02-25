# Padmalaya Group — Corporate Website

Premium real estate developer website with secure lead capture, project showcase, and admin dashboard.

## Tech Stack

React 18 + TypeScript + Vite + Tailwind CSS + Supabase (PostgreSQL, Auth, Edge Functions) + Cloudflare Turnstile

## Setup

```bash
npm install
cp .env.example .env   # Then fill in your Supabase + Turnstile keys
npm run dev             # http://localhost:5173
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |

## Deployment

Frontend auto-deploys to **Vercel** on push to `main`. Backend (Edge Functions) deployed via `supabase functions deploy`.

See [CLAUDE.md](./CLAUDE.md) for full architecture, security documentation, and development guide.
