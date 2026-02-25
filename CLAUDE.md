# CLAUDE.md — Padmalaya Project

**Last Verified:** 2026-02-26
**Accuracy:** Verified against actual source code (not aspirational)

---

## Project Overview

Corporate website for **Padmalaya Group**, a premium real estate developer. Two audiences: public visitors (project showcase + lead capture) and admin users (lead/content management dashboard).

- **Production:** https://padmalayagroup.in
- **Staging:** https://padmalaya-six.vercel.app
- **Domain Registrar:** Hostinger

---

## Tech Stack (Actual)

| Layer | Package | Version | Notes |
|-------|---------|---------|-------|
| Framework | react | 18.3.1 | StrictMode enabled |
| Language | typescript | 5.5.3 | `strict: true` |
| Build | vite | 5.4.2 | Minimal config |
| Styling | tailwindcss | 3.4.1 | Default config, custom CSS vars in `index.css` |
| Icons | lucide-react | 0.344.0 | |
| CAPTCHA | @marsidev/react-turnstile | 1.4.2 | Cloudflare Turnstile, managed mode |
| XSS | dompurify | 3.3.1 | Whitelist approach (strips all HTML) |
| Backend | @supabase/supabase-js | 2.57.4 | PostgreSQL + Auth + Edge Functions |
| Linting | eslint | 9.9.1 | Flat config, TS + React Hooks rules |

**NOT installed** (despite previous documentation claims):
- No React Router — hash-based routing in `App.tsx`
- No React Hook Form — manual `useState` + custom validation
- No Radix UI / shadcn — raw HTML + Tailwind
- No test framework — no Jest, Vitest, or test runner

---

## Architecture

```
Browser (SPA)
├── React 18 + TypeScript + Tailwind
├── Hash routing: window.location.hash (#/home, #/projects, #/admin)
├── Auth state: useState in App.tsx, passed as props
└── Data: Supabase client (anon key, protected by RLS)

Supabase Platform
├── PostgreSQL 17 (5 tables, RLS on all)
├── Auth (email/password + TOTP MFA)
├── Edge Functions (Deno 2: submit-lead)
└── Storage (logos bucket, public)

Vercel
├── Static SPA hosting
├── Security headers (CSP, HSTS, X-Frame-Options)
├── SPA rewrite: all paths → /index.html
└── Asset caching: 1 year immutable for /assets/*
```

### Routing

`App.tsx` uses `window.location.hash` — NOT React Router. URL pattern: `/#/page`.

```
/#/          → Home
/#/about     → About
/#/projects  → Projects
/#/project/:slug → ProjectDetail
/#/contact   → Contact
/#/admin     → Admin (protected by isAuthenticated prop)
```

Navigation uses `onNavigate` callback prop drilling. No React Context.

### Global Components

`App.tsx` renders two components on every public page (hidden on admin):
- **Footer** — contact info from `site_settings` (`contactInfo` state)
- **WhatsAppFloat** — floating WhatsApp CTA button, also driven by `contactInfo.whatsapp`

Both share the same `contactInfo` state fetched once in `App.tsx` — zero duplicate Supabase queries. The WhatsApp URL and default message are centralized in `src/lib/utils.ts` (`getWhatsAppUrl()` + `WHATSAPP_DEFAULT_MESSAGE`).

### State Management

No state library. `useState` throughout. The Admin page alone has 19+ `useState` calls.

---

## Directory Structure

```
src/
├── components/              # UI components
│   ├── LeadForm.tsx         # 552 lines — contact form + CAPTCHA + validation
│   ├── LeadsManager.tsx     # 300 lines — admin lead dashboard
│   ├── ReviewsManager.tsx   # 268 lines — testimonial management
│   ├── MetricsManager.tsx   # 155 lines — homepage metrics editor
│   ├── MFASetup.tsx         # 243 lines — QR enrollment wizard
│   ├── MFAVerify.tsx        # 129 lines — TOTP code verification
│   ├── MFASettings.tsx      # 189 lines — MFA management UI
│   ├── Navigation.tsx       # 106 lines — fixed navbar, mobile menu
│   ├── Footer.tsx           # 84 lines — footer with contact info
│   ├── AnimatedSection.tsx  # 25 lines — IntersectionObserver wrapper
│   ├── ImageReveal.tsx      # 20 lines — image animation wrapper
│   ├── WhatsAppFloat.tsx    # 32 lines — global floating WhatsApp CTA button
│   └── SessionTimeoutWarning.tsx # 132 lines — EXISTS BUT NOT IMPORTED
├── pages/
│   ├── Home.tsx             # 302 lines — hero, metrics, featured projects, reviews
│   ├── Projects.tsx         # 140 lines — project gallery with filters
│   ├── ProjectDetail.tsx    # 323 lines — single project + lightbox
│   ├── About.tsx            # 240 lines — company story, leadership
│   ├── Contact.tsx          # 168 lines — contact info + LeadForm
│   ├── Admin.tsx            # 1,099 lines — entire admin dashboard
│   └── NotFound.tsx         # 43 lines — 404 page
├── lib/
│   ├── supabase.ts          # 11 lines — Supabase client init
│   ├── sanitize.ts          # 140 lines — 9 DOMPurify sanitization functions
│   ├── types.ts             # 93 lines — all TypeScript interfaces
│   ├── utils.ts             # 25 lines — Google Drive URL converter + WhatsApp URL utility
│   └── __tests__/
│       └── sanitize.test.ts # 309 lines — manual browser-console test suite
├── hooks/
│   ├── useIntersectionObserver.ts  # 43 lines — scroll animation trigger
│   └── useSessionTimeout.ts       # 232 lines — EXISTS BUT NOT IMPORTED
├── App.tsx                  # 127 lines — hash routing, auth state, layout
├── main.tsx                 # 10 lines — entry point
└── index.css                # 155 lines — CSS vars, fonts, Tailwind, animations
```

### Styling

Colors defined as CSS variables in `index.css` (NOT in `tailwind.config.js`):
```css
--color-off-white: #F8FAFB
--color-sky-blue: #2DB6E8
--color-deep-teal: #2F6F6B
--color-gold: #D4A24C
```

Fonts loaded via Google Fonts: `Cormorant Garamond` (headings), `Inter` (body).

---

## Database Schema

### Tables (5)

**projects**
```
id (uuid PK), name, slug, tagline, description, location, status ('completed'|'ongoing'),
external_url, hero_image_url, year_completed, total_units, total_area,
rera_number, flat_config, builtup_area, towers,
display_order, is_featured, created_at, updated_at
```

**project_images**
```
id (uuid PK), project_id (FK → projects CASCADE), image_url,
category ('exterior'|'interior'|'common_areas'|'location'), display_order, caption, created_at
```

**site_settings** (key-value store)
```
id (uuid PK), key (unique), value (jsonb), updated_at
Keys: hero, metrics, about, contact, ceo_image, md_image
```

**customer_reviews**
```
id (uuid PK), customer_name, review_text, rating (1-5), is_featured, display_order,
created_at, updated_at
```

**leads**
```
id (uuid PK), name (2-100 chars), email, phone (7-20 chars),
preferred_contact_time ('morning'|'afternoon'|'evening'|'anytime'),
interest ('ongoing_project'|'completed_project'|'investment'|'general'),
heard_from (nullable, 8 options), message (max 1000), status ('new'|'contacted'|'qualified'|'closed'),
source_ip, created_at, updated_at
```

### RLS Policies

All tables have Row Level Security enabled:
- **Public read:** projects, project_images, site_settings, customer_reviews
- **Public insert:** leads (form submissions)
- **Authenticated CRUD:** All tables (any authenticated user = admin)
- **No role-based enforcement** — `auth.uid() IS NOT NULL` only, no `role = 'admin'` check

### Migrations

16 migrations in `supabase/migrations/`, applied chronologically (2026-02-22 through 2026-02-26).

---

## Edge Function: submit-lead

**Location:** `supabase/functions/submit-lead/index.ts` (386 lines)
**Runtime:** Deno 2

### Request Flow

```
POST /functions/v1/submit-lead
├── 1. CORS check (whitelist: padmalayagroup.in, *.vercel.app, localhost:5173-5176)
├── 2. Input validation (type, length, regex, HTML/SQL injection detection)
├── 3. Turnstile CAPTCHA verification (Cloudflare API, server-side)
├── 4. Rate limit check:
│     ├── 3 per email per 24 hours
│     └── 5 per IP per 1 hour
├── 5. Database INSERT via service_role key (bypasses RLS)
├── 6. Optional: Google Sheets webhook (async, non-blocking)
└── 7. Return 201 + lead ID
```

### CORS Origins

Hardcoded whitelist + regex for Vercel preview deployments:
```
https://padmalayagroup.in
https://www.padmalayagroup.in
https://padmalaya.vercel.app
https://padmalaya-git-main-*.vercel.app (regex)
http://localhost:5173-5176 (dev)
```

---

## Security Implementation

### What's Implemented

| Feature | Status | Location |
|---------|--------|----------|
| CSP headers | Active | `vercel.json` |
| HSTS | Active | `vercel.json` (1 year, includeSubDomains, preload) |
| X-Frame-Options: DENY | Active | `vercel.json` |
| X-Content-Type-Options: nosniff | Active | `vercel.json` |
| Permissions-Policy | Active | `vercel.json` (blocks geo, mic, camera, payment) |
| XSS sanitization | Active | `src/lib/sanitize.ts` (DOMPurify, 9 functions) |
| Input validation (frontend) | Active | `src/components/LeadForm.tsx` |
| Input validation (backend) | Active | `supabase/functions/submit-lead/index.ts` |
| CAPTCHA (Cloudflare Turnstile) | Active | Frontend + backend verification |
| Rate limiting | Active | Edge function + database indexes |
| CORS whitelist | Active | Edge function (not wildcard `*`) |
| RLS on all tables | Active | All 5 tables |
| MFA (TOTP) | Active | `MFASetup.tsx`, `MFAVerify.tsx`, `MFASettings.tsx` |
| Credential clearing | Active | Password/email wiped after login + on logout |
| Autofill prevention | Active | `autoComplete="new-password"` on admin form |
| HTTPS enforcement | Active | `upgrade-insecure-requests` in CSP |

### What's NOT Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| Session timeout | **Code exists, NOT WIRED** | `useSessionTimeout.ts` + `SessionTimeoutWarning.tsx` exist but are not imported anywhere |
| Audit logging | Not started | No tracking of admin actions |
| Role-based RLS | Not done | All authenticated users = full admin, no role check |
| Security monitoring/alerts | Not started | No alerting on failed logins or rate limit violations |
| Password complexity | Weak | `config.toml`: min 6 chars, no complexity rules |

### CSP Policy (production)

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://127.0.0.1:54321 https://*.supabase.co https://challenges.cloudflare.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: https: http:;
font-src 'self' data: https://fonts.gstatic.com;
connect-src 'self' https://127.0.0.1:54321 https://*.supabase.co https://*.google.com https://drive.google.com https://challenges.cloudflare.com;
frame-src https://challenges.cloudflare.com;
object-src 'none';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests;
```

**Known issues in CSP:**
- `'unsafe-inline'` + `'unsafe-eval'` required for Vite/React (acceptable trade-off)
- `https://127.0.0.1:54321` is a dev URL leaking into production headers
- `img-src` allows `http:` — should be `https:` only in production

---

## Authentication Flow

```
1. Navigate to /#/admin → Admin.tsx
2. If not authenticated → login form (email + password, autofill disabled)
3. supabase.auth.signInWithPassword()
   → Password cleared from state IMMEDIATELY
4. Check MFA factors: supabase.auth.mfa.listFactors()
5a. MFA enabled → MFAVerify (6-digit TOTP code)
    → supabase.auth.mfa.challenge() + verify()
    → AAL2 achieved → dashboard loads
5b. MFA not enabled → dashboard loads directly (AAL1)
6. Logout → clears all state, calls supabase.auth.signOut()
```

MFA uses Supabase Auth TOTP. Compatible with Google Authenticator, Authy, Microsoft Authenticator. No SMS (resistant to SIM swapping).

---

## Environment Variables

### Frontend (Vercel dashboard)

| Variable | Public | Source |
|----------|--------|--------|
| `VITE_SUPABASE_URL` | Yes | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes (RLS-protected) | Supabase → Settings → API → anon public |
| `VITE_TURNSTILE_SITE_KEY` | Yes | Cloudflare → Turnstile → Site Key |

### Backend (Supabase Edge Function secrets)

| Variable | Secret | Source |
|----------|--------|--------|
| `SUPABASE_URL` | No | Same as VITE_SUPABASE_URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **YES** | Supabase → Settings → API → service_role (Reveal) |
| `TURNSTILE_SECRET_KEY` | **YES** | Cloudflare → Turnstile → Secret Key |
| `GOOGLE_SHEETS_WEBHOOK_URL` | Yes (optional) | Google Apps Script → Deploy as Web App |

**No `.env.example` file exists.** The `.env` file is gitignored.

---

## Development Workflow

### Setup

```bash
git clone <repo-url>
cd padmalaya
npm install
```

Create `.env`:
```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<local-anon-key>
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA  # Cloudflare test key
```

### Commands

```bash
npm run dev          # Start dev server (Vite)
npm run build        # Production build → dist/
npm run preview      # Preview production build
npm run lint         # ESLint
npm run typecheck    # TypeScript checking (tsc --noEmit)
```

### Local Supabase (optional)

```bash
supabase start                    # Start local Supabase
supabase db push                  # Apply migrations
supabase functions serve           # Serve Edge Functions locally
supabase functions deploy submit-lead  # Deploy Edge Function
supabase status                   # Get local credentials
```

**Note:** `supabase/config.toml` has `edge_runtime.enabled = false`. Set to `true` for local Edge Function testing.

### Dev server

Runs on `http://localhost:5173` (Vite default). Hash routing means all routes work without server config.

---

## Deployment

### Vercel (Frontend)

Auto-deploys on push to `main`. Config in `vercel.json`:
- Build: `npm run build` → `dist/`
- Framework: Vite
- SPA rewrite: `/(.*) → /index.html`
- Security headers: CSP, HSTS, X-Frame-Options, etc.
- Asset caching: `/assets/*` → 1 year immutable

### Supabase (Backend)

```bash
supabase db push                           # Apply migrations
supabase functions deploy submit-lead      # Deploy Edge Function
```

Set secrets in Supabase Dashboard → Edge Functions → submit-lead → Settings → Secrets.

### Domain (padmalayagroup.in)

DNS at Hostinger:
```
A     @     76.76.21.21 (Vercel)
CNAME www   cname.vercel-dns.com
```

SSL automatic via Vercel.

---

## Key Design Decisions

| Decision | Why | Trade-off |
|----------|-----|-----------|
| Hash routing instead of React Router | Simpler, no SSR, no library dependency | Poor SEO (hash URLs not indexed), no lazy loading |
| Manual form validation instead of React Hook Form | Fewer dependencies | More boilerplate, harder to maintain |
| Props drilling instead of React Context | Simple for small app | `onNavigate`, `isAuthenticated` passed through many levels |
| Google Drive for image hosting | Free, no storage setup needed | Unreliable CDN, no cache control, Google can throttle |
| Supabase Edge Functions for lead submission | Server-side validation, secrets never exposed | Single function (386 lines), harder to test locally |
| DOMPurify whitelist (strip ALL HTML) | Maximum XSS protection | Cannot accept any rich text input |
| All authenticated = admin (no RBAC) | Only 1 admin user exists | Security risk if more users are created |

---

## Known Issues

| Issue | Severity | Details |
|-------|----------|---------|
| `Admin.tsx` is 1,099 lines | HIGH | Projects CRUD + reviews + leads + MFA + settings all in one component, 19+ useState calls |
| Session timeout not wired | HIGH | `useSessionTimeout.ts` and `SessionTimeoutWarning.tsx` exist but are never imported |
| No role-based RLS | HIGH | Any authenticated Supabase user gets full admin access |
| Localhost URL in production CSP | MEDIUM | `https://127.0.0.1:54321` in Content-Security-Policy |
| Google Drive image hosting | MEDIUM | Production images depend on Google Drive thumbnail service |
| No automated tests | MEDIUM | Only manual browser-console test suite for sanitization |
| No code splitting | MEDIUM | All pages eagerly imported, no `React.lazy()` |
| No `.env.example` | LOW | New developers must guess required variables |
| Weak password policy | LOW | Min 6 chars, no complexity (in `supabase/config.toml`) |

---

## Pending Work

### High Priority
1. **Wire session timeout** — import `useSessionTimeout` in Admin.tsx, add `SessionTimeoutWarning` component
2. **Add role-based RLS** — check `auth.jwt() ->> 'role' = 'admin'` in policies
3. **Split Admin.tsx** — extract into AdminProjects, AdminReviews, AdminLeads, AdminSettings
4. **Remove localhost from CSP** — strip `https://127.0.0.1:54321` from `vercel.json` production headers

### Medium Priority
5. Add audit logging table + admin action tracking
6. Create `.env.example` template
7. Add automated tests (Vitest)
8. Migrate from Google Drive images to Supabase Storage or Vercel Image Optimization
9. Tighten CSP: remove `http:` from `img-src`
10. Increase minimum password length to 12+ with complexity rules

### Low Priority
11. Add React Router for proper SEO and code splitting
12. Add React Context for auth state (eliminate prop drilling)
13. Add error boundaries
14. Google Analytics / Plausible integration
15. Email notifications for new leads

---

## Quick Reference

### Important Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Hash routing, auth state, app layout |
| `src/pages/Admin.tsx` | Entire admin dashboard (1,099 lines) |
| `src/components/LeadForm.tsx` | Contact form + CAPTCHA + validation (552 lines) |
| `src/lib/sanitize.ts` | All XSS sanitization functions |
| `src/lib/types.ts` | All TypeScript interfaces |
| `src/lib/supabase.ts` | Supabase client initialization |
| `src/lib/utils.ts` | Google Drive URL converter + `getWhatsAppUrl()` utility + `WHATSAPP_DEFAULT_MESSAGE` constant |
| `src/components/WhatsAppFloat.tsx` | Global floating WhatsApp CTA button (visible on all public pages, hidden on admin) |
| `supabase/functions/submit-lead/index.ts` | Lead submission Edge Function (386 lines) |
| `vercel.json` | Deployment config, security headers, routing |
| `supabase/config.toml` | Local Supabase config (MFA enabled) |

### Emergency Procedures

**Site down:** Check [Vercel Status](https://vercel-status.com) → Check [Supabase Status](https://status.supabase.com) → Rollback in Vercel dashboard (Deployments → Promote previous)

**Leads failing:** Check Supabase Edge Function logs → Verify secrets are set → Check rate limits (may be blocking legitimate users)

**Admin locked out:** Reset password in Supabase Dashboard → Auth → Users. If MFA locked, unenroll factor via Supabase SQL: `DELETE FROM auth.mfa_factors WHERE user_id = '<id>'`
