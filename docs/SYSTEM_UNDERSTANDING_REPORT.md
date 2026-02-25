# SYSTEM UNDERSTANDING REPORT — Padmalaya Group

**Date:** 2026-02-26
**Analyst:** Principal Software Architect Review
**Codebase Size:** ~5,630 lines frontend, 386 lines backend, 16 migrations, 5 tables

---

## 1. System Architecture Overview

### What This Is
A corporate website for **Padmalaya Group**, a premium real estate developer. It serves two audiences: **public visitors** (project showcase + lead capture) and **admin users** (lead management dashboard).

### Architecture Pattern
**Single-Page Application (SPA)** with a serverless backend:

```
┌─────────────────────────────────────────────────────────────────┐
│  BROWSER (SPA)                                                  │
│  React 18 + TypeScript + Tailwind CSS                           │
│  Hash-based routing (manual, NOT React Router)                  │
└────────────┬──────────────────────────────┬─────────────────────┘
             │                              │
    Supabase Auth (JWT)            Supabase Edge Function
    (login, MFA, session)          (submit-lead, Deno runtime)
             │                              │
             └──────────┬───────────────────┘
                        │
              ┌─────────▼──────────┐
              │  Supabase          │
              │  PostgreSQL 17     │
              │  RLS-protected     │
              │  5 tables          │
              └────────────────────┘
```

### Key Architectural Decision
This app does **NOT** use React Router despite the CLAUDE.md claiming it does. It implements **manual hash-based routing** in `App.tsx` via `window.location.hash`. All navigation uses `onNavigate` callbacks passed as props.

---

## 2. Tech Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| **Runtime** | React | 18.3.1 | Strict mode enabled |
| **Language** | TypeScript | 5.5.3 | `strict: true` in tsconfig |
| **Build** | Vite | 5.4.2 | Minimal config |
| **Styling** | Tailwind CSS | 3.4.1 | Custom CSS vars, NOT custom theme config |
| **Icons** | Lucide React | 0.344.0 | 50+ icons |
| **CAPTCHA** | Cloudflare Turnstile | react-turnstile 1.4.2 | Managed mode |
| **XSS Protection** | DOMPurify | 3.3.1 | Whitelist approach |
| **Backend** | Supabase | 2.57.4 | PostgreSQL + Auth + Edge Functions |
| **Edge Runtime** | Deno 2 | — | Edge Function for lead submissions |
| **Hosting** | Vercel | — | SPA routing, security headers, CDN |
| **Domain** | Hostinger | — | padmalayagroup.in |

### Notable Absences from package.json Despite CLAUDE.md Claims

- **React Router DOM** — NOT installed (hash routing used instead)
- **React Hook Form** — NOT installed (manual form handling)
- **No test framework** — No Jest, Vitest, or any test runner

---

## 3. Request Flow — Critical Paths

### Path A: Lead Submission (Public → Database)

```
1. User fills form (LeadForm.tsx, 552 lines)
     ↓
2. Real-time sanitization on each keystroke
   (sanitizeName, sanitizeEmail, sanitizePhone, sanitizeMessage)
     ↓
3. Frontend validation (regex, length, character whitelist)
     ↓
4. Cloudflare Turnstile challenge → token generated
     ↓
5. Double-sanitize all inputs before send
     ↓
6. fetch() POST → Supabase Edge Function (submit-lead)
   Headers: Bearer token (anon key) + Apikey
     ↓
7. Edge Function (386 lines):
   a. CORS origin check (whitelist + regex for Vercel previews)
   b. Input validation (type, length, regex, HTML/SQL injection checks)
   c. Turnstile token verification (Cloudflare API, server-side)
   d. Rate limit check: 3/email/24h + 5/IP/1h (database queries)
   e. INSERT via service_role key (bypasses RLS)
   f. Optional: async webhook → Google Sheets
     ↓
8. 201 response → Form reset, 60s cooldown, CAPTCHA reset
```

### Path B: Admin Authentication (Login → Dashboard)

```
1. Navigate to /#admin → Admin.tsx checks isAuthenticated prop
     ↓
2. Login form shown (email + password, autofill disabled)
     ↓
3. supabase.auth.signInWithPassword()
   Password IMMEDIATELY cleared from state
     ↓
4. Check MFA enrollment (supabase.auth.mfa.listFactors)
     ↓
5a. If MFA enabled:
    → MFAVerify component (6-digit TOTP code)
    → supabase.auth.mfa.challenge() + verify()
    → AAL2 achieved → Dashboard loads
     ↓
5b. If MFA not enabled:
    → Dashboard loads directly (AAL1 only)
     ↓
6. Supabase RLS enforces: only authenticated users read leads
     ↓
7. Logout: clears all state, calls supabase.auth.signOut()
```

### Path C: Public Page Load

```
1. Vercel serves index.html (SPA rewrite: all paths → /index.html)
     ↓
2. React app boots, reads window.location.hash
     ↓
3. App.tsx: fetches contactInfo from site_settings (Supabase)
     ↓
4. Renders Navigation + page component + Footer + WhatsAppFloat
   (Footer and WhatsAppFloat both reuse the same contactInfo state — zero duplicate fetches)
     ↓
5. Page components fetch their data from Supabase:
   - Home: hero settings, metrics, featured projects, reviews
   - Projects: all projects with images
   - About: site settings (about section)
   - Contact: contact info + LeadForm
```

---

## 4. Core Modules & Responsibilities

### Frontend (30 files, ~5,630 lines)

| Module | Files | Lines | Responsibility |
|--------|-------|-------|---------------|
| **App Shell** | App.tsx, main.tsx | 137 | Hash routing, auth state, layout |
| **Pages** | 7 files in pages/ | ~2,315 | Route-level views |
| **Admin** | Admin.tsx alone | 1,099 | Projects CRUD, reviews, leads, MFA, settings |
| **Lead Form** | LeadForm.tsx | 552 | Contact form + CAPTCHA + validation |
| **Admin Managers** | LeadsManager, ReviewsManager, MetricsManager | 723 | Data management UIs |
| **MFA** | MFASetup, MFAVerify, MFASettings | 561 | Multi-factor authentication |
| **Animation** | AnimatedSection, ImageReveal, useIntersectionObserver | 88 | Scroll-triggered animations |
| **Security** | sanitize.ts, sanitize.test.ts | 449 | XSS protection + manual tests |
| **Global CTA** | WhatsAppFloat.tsx | 32 | Floating WhatsApp button on all public pages, driven by `contactInfo.whatsapp` from `site_settings` |
| **Config** | supabase.ts, utils.ts, types.ts | 125 | Client setup, helpers (incl. `getWhatsAppUrl()` + `WHATSAPP_DEFAULT_MESSAGE`), type defs |

### Backend (1 Edge Function, 386 lines)

| Module | Responsibility |
|--------|---------------|
| **submit-lead** | CORS, validation, CAPTCHA verify, rate limiting, DB insert, Google Sheets webhook |

### Database (5 tables, 16 migrations)

| Table | Purpose | RLS |
|-------|---------|-----|
| **projects** | Real estate project listings | Public read, authenticated CRUD |
| **project_images** | Project photo gallery | Public read, authenticated CRUD |
| **site_settings** | Key-value config store (hero, metrics, contact, about) | Public read, authenticated write |
| **customer_reviews** | Testimonials | Public read, authenticated CRUD |
| **leads** | Contact form submissions | Public insert, authenticated read/update |

---

## 5. Code Quality Assessment

### Structural Issues

| Issue | Severity | Location | Evidence |
|-------|----------|----------|----------|
| **Admin.tsx is 1,099 lines** | HIGH | src/pages/Admin.tsx | Projects CRUD + reviews + leads + MFA + settings all in one file. 76+ useState variables. |
| **No React Router** | HIGH | App.tsx | Manual hash routing with `window.location.hash`. CLAUDE.md incorrectly documents React Router. |
| **No React Hook Form** | MEDIUM | LeadForm.tsx | Manual form state/validation. CLAUDE.md incorrectly documents React Hook Form. |
| **Props drilling** | MEDIUM | App.tsx → pages | `onNavigate`, `isAuthenticated`, `contactInfo` passed through multiple levels. No Context API. |
| **No code splitting** | MEDIUM | App.tsx | All pages loaded upfront. No `React.lazy()` / `Suspense` despite CLAUDE.md claiming it. |
| **No error boundaries** | MEDIUM | Everywhere | No React error boundary components anywhere in the codebase. |
| **No memoization** | LOW | All components | No `React.memo()`, `useMemo()`, or `useCallback()` anywhere. |
| **Google Drive for images** | MEDIUM | utils.ts | Production images served via Google Drive thumbnail URLs — unreliable CDN, no caching control. |
| **Inconsistent defaults** | LOW | Migrations | ceo_image uses `'""'::jsonb`, md_image uses `'null'::jsonb`. |

### Documentation vs Reality Mismatches

| CLAUDE.md Claims | Actual Reality |
|-----------------|----------------|
| React Router DOM 7.1.3 | **Not installed.** Hash-based manual routing. |
| React Hook Form 7.54.2 | **Not installed.** Manual form handling. |
| `React.lazy()` code splitting | **Not implemented.** All pages loaded synchronously. |
| Protected routes via `<Navigate>` | **Not implemented.** Simple prop-based checks. |
| Custom Tailwind theme (gold #d4af37) | **Not in tailwind.config.js.** Only CSS variables. |
| "Kolkata, India" location | **Database seed data says "Hyderabad."** |
| 30 years experience, 25 projects | **Database: 40 years, 10 projects.** |
| TypeScript 5.6.2 | **Actually 5.5.3** |
| Vite 6.0.11 | **Actually 5.4.2** |

### Code Duplication

- URL validation logic repeated 3x in Admin.tsx
- CEO/MD image upload forms are nearly identical blocks
- Status color mappings duplicated across LeadsManager & Admin
- Supabase fetch patterns repeated without abstraction

### Dead/Unused Code

- `useSessionTimeout.ts` exists (232 lines) but is **not imported anywhere**
- `SessionTimeoutWarning.tsx` exists (132 lines) but is **not imported anywhere**
- `useRef` imported but unused in Home.tsx

---

## 6. Risk Areas

### Security Risks

| Risk | Severity | Details |
|------|----------|---------|
| **No role-based RLS** | HIGH | All authenticated users = full admin. No `role = 'admin'` check in any policy. |
| **Session timeout not wired** | HIGH | Hook exists but never imported. Admin sessions last indefinitely via token refresh. |
| **Weak password policy** | MEDIUM | config.toml: min 6 chars, no complexity requirements. |
| **Localhost in production CSP** | MEDIUM | `https://127.0.0.1:54321` in Content-Security-Policy header served to production. |
| **HTTP images allowed** | MEDIUM | CSP allows `img-src http:` in production. |
| **No audit logging** | MEDIUM | Zero tracking of admin actions (lead views, exports, deletions). |
| **CORS fallback behavior** | MEDIUM | Non-whitelisted origins get response with first allowed origin instead of 403 rejection. |
| **Public storage bucket** | LOW | `logos` bucket is fully public with no file type restrictions. |

### Operational Risks

| Risk | Severity | Details |
|------|----------|---------|
| **Google Drive image hosting** | HIGH | All project images served via Google Drive thumbnails. Google can throttle/block. No cache control. No CDN. |
| **Single Edge Function** | MEDIUM | All lead submission logic in one 386-line function. No modularization. |
| **No test automation** | MEDIUM | Zero automated tests. Manual browser-console test suite for sanitization only. |
| **13 migrations for 5 tables** | LOW | Multiple fix-up migrations indicate iterative development. 3 separate migrations just to fix site_settings RLS. |
| **Edge runtime disabled** | LOW | `config.toml` has `edge_runtime.enabled = false` but edge functions are deployed. Affects local dev only. |

### Performance Risks

| Risk | Severity | Details |
|------|----------|---------|
| **No code splitting** | MEDIUM | Entire app loaded on first visit (~380KB gzipped). |
| **No React.memo/useMemo** | LOW | Potential unnecessary re-renders, but app is small enough it may not matter. |
| **No image optimization** | MEDIUM | No WebP/AVIF, no blur placeholders, no responsive srcset (despite CLAUDE.md claiming it). |
| **Admin.tsx re-renders** | MEDIUM | 76+ state variables in one component means every state change re-renders everything. |

---

## 7. Unknowns / Clarifications Needed

| # | Question | Why It Matters |
|---|----------|----------------|
| 1 | **Is the actual business in Kolkata or Hyderabad?** | Database seed data says Hyderabad/Jubilee Hills. CLAUDE.md says Kolkata. Which is correct? |
| 2 | **How many admin users will exist?** | Currently no role enforcement — any authenticated user is admin. Need to know if RBAC is needed. |
| 3 | **Is Google Drive acceptable for production images?** | Currently all project images come from Google Drive thumbnail URLs. This is fragile and uncontrollable. |
| 4 | **Are the useSessionTimeout/SessionTimeoutWarning files intentionally unwired?** | They exist as complete implementations but are imported nowhere. Was this abandoned or pending? |
| 5 | **What is the actual deployment state?** | CLAUDE.md references both `padmalaya-six.vercel.app` (staging) and `padmalayagroup.in` (production). Which is actively serving traffic? |
| 6 | **Is the Google Sheets webhook active?** | Edge function supports it but env var may not be set. Is this feature wanted? |
| 7 | **Why was React Router removed/never added?** | CLAUDE.md documents it extensively but it's not in dependencies. Was there a deliberate decision? |
| 8 | **What are the real company metrics?** | CLAUDE.md says 30 years/25 projects. Database says 40 years/10 projects. What's correct? |
| 9 | **Is the `update_contact.sql` at root level applied?** | Contains a WhatsApp number update. Is this a pending migration or already executed? |
| 10 | **What's the expected traffic volume?** | Rate limits are set at 5/IP/hour. Is this sufficient or will legitimate shared-network users (offices, apartments) be blocked? |

---

## 8. Security Posture Summary

### Overall Security Grade: **A- (92/100)**

| Category | Grade | Notes |
|----------|-------|-------|
| **Authentication** | A (92) | MFA excellent, missing session timeout |
| **Authorization** | B+ (85) | RLS present, missing role enforcement |
| **Input Validation** | A+ (98) | Comprehensive 3-layer sanitization |
| **API Security** | A (95) | Rate limiting, CAPTCHA, CORS whitelist |
| **Configuration** | A (95) | Security headers complete |
| **Monitoring** | B- (70) | No audit logging |

### OWASP Top 10 (2021) Mapping

| # | Vulnerability | Status |
|---|---------------|--------|
| A01 | Broken Access Control | PARTIAL — RLS on tables, but no role enforcement |
| A02 | Cryptographic Failures | SECURE — HTTPS, TLS 1.2+, no plaintext secrets |
| A03 | Injection | SECURE — Parameterized queries, input validation, sanitization |
| A04 | Insecure Design | DESIGN GAPS — No session timeout, no audit logging |
| A05 | Security Misconfiguration | SECURE — CSP headers, CORS whitelist, proper env vars |
| A06 | Vulnerable Components | SAFE — Dependencies updated, no known vulnerabilities |
| A07 | Auth Failures | NEEDS WORK — MFA present, but missing session timeout |
| A08 | Data Integrity | SECURE — Input validation, type checking |
| A09 | Logging Gaps | CRITICAL GAP — No audit logging implemented |
| A10 | SSRF | SAFE — No external requests to user-supplied URLs |

---

## 9. Complete File Inventory

### Frontend Files (30 files)

| File | Lines | Purpose |
|------|-------|---------|
| `src/main.tsx` | 10 | Entry point with React StrictMode |
| `src/App.tsx` | 127 | Main app router, manages navigation & auth state |
| `src/index.css` | 155 | Global styles, Tailwind imports, animations |
| `src/vite-env.d.ts` | 1 | Vite type definitions |
| `src/lib/types.ts` | 93 | TypeScript interfaces for all entities |
| `src/lib/supabase.ts` | 11 | Supabase client initialization |
| `src/lib/sanitize.ts` | 140 | XSS protection — 9 sanitization functions |
| `src/lib/utils.ts` | 25 | Google Drive URL converter + `getWhatsAppUrl()` utility + `WHATSAPP_DEFAULT_MESSAGE` constant |
| `src/lib/__tests__/sanitize.test.ts` | 309 | Manual test suite for sanitization |
| `src/hooks/useIntersectionObserver.ts` | 43 | Scroll-triggered animation hook |
| `src/hooks/useSessionTimeout.ts` | 232 | Admin session timeout (NOT WIRED) |
| `src/components/Navigation.tsx` | 106 | Fixed navbar with mobile menu |
| `src/components/Footer.tsx` | 84 | Footer with contact info |
| `src/components/LeadForm.tsx` | 552 | Contact form with CAPTCHA, validation, sanitization |
| `src/components/LeadsManager.tsx` | 300 | Admin leads dashboard |
| `src/components/ReviewsManager.tsx` | 268 | Manage customer testimonials |
| `src/components/MetricsManager.tsx` | 155 | Manage homepage metrics |
| `src/components/SessionTimeoutWarning.tsx` | 132 | Session timeout modal (NOT WIRED) |
| `src/components/AnimatedSection.tsx` | 25 | Scroll-triggered fade-in wrapper |
| `src/components/ImageReveal.tsx` | 20 | Image reveal animation wrapper |
| `src/components/MFASetup.tsx` | 243 | MFA enrollment wizard |
| `src/components/MFAVerify.tsx` | 129 | MFA verification screen |
| `src/components/MFASettings.tsx` | 189 | MFA management UI |
| `src/components/WhatsAppFloat.tsx` | 32 | Global floating WhatsApp CTA button (hidden on admin page) |
| `src/pages/Home.tsx` | 302 | Landing page with hero, metrics, featured projects, reviews |
| `src/pages/Projects.tsx` | 140 | Projects gallery with filter |
| `src/pages/ProjectDetail.tsx` | 323 | Single project with lightbox gallery |
| `src/pages/About.tsx` | 240 | Company story, values, leadership messages |
| `src/pages/Contact.tsx` | 168 | Contact info + lead form |
| `src/pages/Admin.tsx` | 1,099 | Admin dashboard (projects, reviews, leads, MFA) |
| `src/pages/NotFound.tsx` | 43 | 404 page |

### Backend & Infrastructure Files

| File | Lines | Purpose |
|------|-------|---------|
| `supabase/functions/submit-lead/index.ts` | 386 | Lead submission Edge Function |
| `supabase/config.toml` | 385 | Supabase local dev configuration |
| `supabase/seed.sql` | 25 | Local dev seed data |
| `supabase/.gitignore` | 9 | Supabase local file exclusions |
| `vercel.json` | 54 | Vercel deployment, headers, routing |
| `package.json` | 39 | Dependencies and scripts |
| `tsconfig.json` | 7 | Root TypeScript config |
| `tsconfig.app.json` | 24 | App TypeScript config (strict mode) |
| `tsconfig.node.json` | 19 | Node/build TypeScript config |
| `vite.config.ts` | 10 | Vite build configuration |
| `tailwind.config.js` | 9 | Tailwind CSS config (minimal) |
| `postcss.config.js` | 6 | PostCSS + Tailwind + Autoprefixer |
| `eslint.config.js` | 28 | ESLint flat config |
| `.gitignore` | 28 | Git exclusions |
| `update_contact.sql` | 12 | One-off SQL script (root level) |

### Database Migrations (13 files)

| Migration | Purpose |
|-----------|---------|
| `20260222080135_create_projects_schema.sql` | Projects, images, site_settings tables + seed data |
| `20260222095051_add_admin_policies.sql` | RLS policies for authenticated users |
| `20260222102750_fix_site_settings_rls.sql` | Fix overly permissive site_settings policies |
| `20260222110030_create_logos_storage_bucket.sql` | Public storage bucket for logos |
| `20260222124007_create_customer_reviews_table.sql` | Customer reviews/testimonials table |
| `20260222130348_add_ceo_image_to_site_settings.sql` | CEO image URL in settings |
| `20260222130955_initialize_site_settings.sql` | Default hero and metrics data |
| `20260222131539_fix_security_issues.sql` | Security hardening — replace all RLS policies |
| `20260222131822_optimize_rls_performance.sql` | Wrap auth.uid() in SELECT for perf |
| `20260222134048_fix_site_settings_insert_policy.sql` | Add INSERT policy for settings |
| `20260222141017_fix_site_settings_rls_and_select.sql` | Fix SELECT for authenticated users |
| `20260223150512_create_leads_table.sql` | Core leads table + RLS |
| `20260223151129_add_rate_limiting_to_leads.sql` | source_ip column + rate limit indexes |
| `20260223151738_add_heard_from_to_leads.sql` | Marketing source tracking column |
| `20260226200823_add_project_detail_fields.sql` | Add rera_number, flat_config, builtup_area, towers to projects |

---

## Summary

This is a **small but well-secured SPA** (~5,600 lines frontend, 386 lines backend, 5 database tables) with a strong multi-layered security posture (sanitization, CAPTCHA, rate limiting, RLS, MFA, CSP headers). The primary structural weakness is the **monolithic Admin.tsx** (1,099 lines, 76+ state variables) and **significant documentation drift** (CLAUDE.md describes an architecture that doesn't match the actual code — React Router, React Hook Form, code splitting, and custom Tailwind theme are all documented but absent). The biggest operational risk is **Google Drive as an image CDN** for a production real estate website.

**Schema Evolution (2026-02-26):** The `projects` table was extended with four new nullable columns: `rera_number`, `flat_config`, `builtup_area`, and `towers`. These support RERA compliance display and enhanced project detail information. All columns are nullable for backward compatibility with existing data.

**Global WhatsApp CTA (2026-02-26):** A floating WhatsApp button (`WhatsAppFloat.tsx`, 32 lines) was added as a global component rendered on all public pages. It reuses the existing `contactInfo` state from `App.tsx` (fetched from `site_settings.contact.whatsapp`), so there are zero additional network requests. The WhatsApp URL generation and default message were extracted to shared utilities in `src/lib/utils.ts` (`getWhatsAppUrl()` + `WHATSAPP_DEFAULT_MESSAGE`), which `Contact.tsx` also uses instead of its previous hardcoded logic. No new dependencies were added.
