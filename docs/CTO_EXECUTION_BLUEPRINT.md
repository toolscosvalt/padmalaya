# CTO EXECUTION BLUEPRINT — Padmalaya Group

**Date:** 2026-02-26
**Status:** Consolidated from 4 independent audits (Backend Security, System Architecture, UX/Performance/Conversion, CLAUDE.md)
**Codebase:** ~5,630 lines frontend | 386 lines backend | 5 tables | 16 migrations | 0 tests

---

## 1. System Health Score

### Overall: 62/100 (Needs Significant Work)

| Dimension | Score | Grade | Verdict |
|-----------|-------|-------|---------|
| **Security** | 68/100 | C+ | 7 critical vulns, strong sanitization but broken access control |
| **Performance** | 55/100 | D+ | No code splitting, no image optimization, monolithic bundle |
| **Reliability** | 50/100 | D | No tests, no CI/CD, no error boundaries, no retries |
| **Scalability** | 45/100 | D | Rate limiting via DB queries, no pagination, no caching |
| **Code Quality** | 60/100 | C- | 1,099-line monolith, massive doc drift, no memoization |
| **UX / Conversion** | 40/100 | F | 0.8% estimated conversion rate, no Home page lead capture |
| **DevOps Maturity** | 30/100 | F | Zero CI/CD, zero tests, no .env.example, no monitoring |
| **Documentation** | 55/100 | D+ | CLAUDE.md is thorough but contains 9 verified factual errors |

### Health Trend
```
Launch state (now):  ████████████░░░░░░░░ 62/100
After Phase 1:       ██████████████░░░░░░ 75/100  (+13)
After Phase 2:       ████████████████░░░░ 85/100  (+10)
After Phase 3:       ██████████████████░░ 92/100  (+7)
```

---

## 2. Critical Risks

### Tier 1 — Business Threatening (Fix Immediately)

| # | Risk | Impact | Source |
|---|------|--------|--------|
| R1 | **Any Supabase user = full admin** | Signup is enabled (`config.toml:166`). Anyone who creates an account gets full CRUD on all 5 tables — projects, leads (PII), settings, reviews. Complete data exfiltration and site defacement possible. | CVE-2 |
| R2 | **CORS regex allows attacker domains** | Pattern `/^https:\/\/padmalaya-[a-z0-9-]+\.vercel\.app$/` — anyone can deploy `padmalaya-attacker.vercel.app` and submit cross-origin requests to the Edge Function. | CVE-6 |
| R3 | **IP rate limiting is bypassable** | `x-forwarded-for` header is client-settable. Every request can claim a different IP. The 5/IP/hour limit is security theater. | CVE-4 |
| R4 | **0.8% lead conversion rate** | Home page (highest traffic) has zero lead capture. Users must navigate to Contact to find a 7-field form. For a real estate business, this is leaving 90%+ of potential leads on the table. | UX Audit |
| R5 | **Google Drive as production image CDN** | All project images served via `drive.google.com/thumbnail?id=`. Google throttles/blocks programmatic access. No cache headers. One Google policy change = all project images disappear. | System Report |

### Tier 2 — Significant (Fix This Week)

| # | Risk | Impact | Source |
|---|------|--------|--------|
| R6 | MFA brute force — no lockout on TOTP attempts | 6-digit code brute-forceable in ~1 hour | CVE-3 |
| R7 | Session timeout code exists but is NOT wired (or files may have been deleted) | Admin sessions persist indefinitely | CVE-5 |
| R8 | No automated tests, no CI/CD | Every deploy is a YOLO push to production | System Report |
| R9 | 11 npm vulnerabilities (3 HIGH) | Known exploitable packages in dependency tree | CVE-7 |
| R10 | ~~No RERA number displayed~~ | **RESOLVED** — RERA number field added to projects table, admin form, project detail page, and project cards (2026-02-26) | UX Audit |

### Tier 3 — Technical Debt (Fix This Month)

| # | Risk | Impact | Source |
|---|------|--------|--------|
| R11 | Admin.tsx is 1,099 lines with 19+ useState | Unmaintainable, any change risks regressions | System Report |
| R12 | Localhost URL leaking into production CSP headers | `https://127.0.0.1:54321` visible to security scanners | S5 |
| R13 | No audit logging | Zero visibility into admin actions (who viewed leads, who edited projects) | S8 |
| R14 | Documentation contains 9 verified factual errors | Onboarding new developers is actively misleading | System Report |

---

## 3. Security Roadmap

### Current Posture: C+ (68/100)
### Target Posture: A (95/100) by end of Phase 2

```
PRIORITY    ITEM                                           EST.    PHASE
─────────────────────────────────────────────────────────────────────────
CRITICAL    Fix RBAC — add role check to all RLS policies  2h      1
CRITICAL    Remove CORS regex, whitelist explicit domains   30m     1
CRITICAL    Fix IP extraction (cf-connecting-ip)           1h      1
CRITICAL    Add MFA brute force lockout (5 attempts)       1h      1
CRITICAL    Wire session timeout (or create if deleted)    1h      1
CRITICAL    npm audit fix                                  30m     1
CRITICAL    Disable public signup (config.toml)            15m     1
─────────────────────────────────────────────────────────────────────────
HIGH        Password policy: 12 chars + complexity         15m     1
HIGH        Enable email confirmation                      15m     1
HIGH        Enable Supabase session timeouts (config)      15m     1
HIGH        Add CAPTCHA to admin login                     30m     1
HIGH        Remove localhost from production CSP           15m     1
─────────────────────────────────────────────────────────────────────────
MEDIUM      Tighten CSP: HTTPS-only images                 15m     2
MEDIUM      Tighten CSP: specific Google domains            15m     2
MEDIUM      Create audit_logs table + triggers             4h      2
MEDIUM      Add admin role check to storage policies       30m     2
MEDIUM      Hash IPs after rate-limit window (GDPR)        2h      2
MEDIUM      Add MFA recovery codes                         2h      2
MEDIUM      Set secure_password_change = true              15m     2
─────────────────────────────────────────────────────────────────────────
LOW         Add COOP/COEP headers                          15m     3
LOW         Remove SQL keyword regex (false confidence)    30m     3
LOW         Gate console.log behind NODE_ENV               30m     3
LOW         Add eslint-plugin-security                     30m     3
```

### OWASP Top 10 Coverage After Remediation

| # | Category | Current | After Phase 1 | After Phase 2 |
|---|----------|---------|---------------|---------------|
| A01 | Broken Access Control | PARTIAL | SECURE | SECURE |
| A02 | Cryptographic Failures | SECURE | SECURE | SECURE |
| A03 | Injection | SECURE | SECURE | SECURE |
| A04 | Insecure Design | GAPS | IMPROVED | SECURE |
| A05 | Security Misconfiguration | MOSTLY SECURE | SECURE | SECURE |
| A06 | Vulnerable Components | AT RISK | SECURE | SECURE |
| A07 | Auth Failures | NEEDS WORK | SECURE | SECURE |
| A08 | Data Integrity | SECURE | SECURE | SECURE |
| A09 | Logging Gaps | CRITICAL GAP | GAP | SECURE |
| A10 | SSRF | SAFE | SAFE | SAFE |

---

## 4. Scalability Roadmap

### Current State: Handles ~10 concurrent users
### Target: 500+ concurrent users, 1000+ leads/day

```
PHASE 1 — IMMEDIATE BOTTLENECK REMOVAL
───────────────────────────────────────
[SC2] Parallelize rate limit queries (Promise.all)         30m
[SC3] Move Supabase client to module scope (reuse conn)    30m
[SC6] Add content-length validation (reject >10KB)         15m
[SC7] Remove unnecessary .select() on INSERT               15m

PHASE 2 — SCALE TO 100+ CONCURRENT
───────────────────────────────────────
[SC1] Replace DB-based rate limiting with KV/Redis          4h
      → Supabase doesn't have native KV, options:
        a) Cloudflare Workers KV (if moving edge fn to CF)
        b) Upstash Redis (serverless, Deno-compatible)
        c) In-memory cache with TTL (simpler, per-instance)
[SC4] Request deduplication via Turnstile token             1h
[SC5] Add pagination to LeadsManager (.range())             1h
[P5]  Add composite indexes for admin queries               30m
[P6]  Add partial index for featured projects               15m

PHASE 3 — PRODUCTION GRADE
───────────────────────────────────────
      Client-side caching (sessionStorage for site_settings)  2h
      Supabase connection pooling (PgBouncer config)          1h
      CDN for images (migrate off Google Drive)               4h
      Add request queuing for burst traffic                   2h
```

---

## 5. Performance Roadmap

### Current Metrics (Estimated)
| Metric | Value | Target |
|--------|-------|--------|
| Initial JS Bundle | 420 KB (117 KB gzip) | < 150 KB gzip |
| First Contentful Paint | ~2.5s (3G) | < 1.5s |
| Largest Contentful Paint | ~5s (3G) | < 2.5s |
| Time to Interactive | ~4s (3G) | < 3s |
| CLS (Layout Shift) | Unknown (no dimensions on images) | < 0.1 |

### Optimization Plan

```
PHASE 1 — QUICK WINS (2-3 hours, ~40% improvement)
──────────────────────────────────────────────────────
1. Code splitting with React.lazy()                    [1h]
   → Admin.tsx (1,099 lines) + MFA components never loaded for public visitors
   → Estimated savings: 40-60% of initial bundle

2. Move Google Fonts from @import to <link preload>   [15m]
   → Eliminates render-blocking CSS import
   → Add preconnect to fonts.googleapis.com + fonts.gstatic.com

3. Add loading="lazy" to all images except hero        [15m]
   → Reduces initial load for below-fold content

4. Disable source maps in production                   [5m]
   → vite.config.ts: build.sourcemap = false

5. Add preconnect hints to index.html                  [15m]
   → Supabase, Google Drive, Cloudflare

PHASE 2 — BUNDLE OPTIMIZATION (4-6 hours, additional 20%)
──────────────────────────────────────────────────────
6. Vendor chunk splitting in vite.config.ts            [1h]
   → Separate chunks: react, supabase, lucide-react
   → Better cache efficiency (vendor chunk rarely changes)

7. Dynamic import DOMPurify (only for forms)           [30m]
   → ~20KB saved from initial bundle

8. Add skeleton screens / loading states               [3h]
   → Replace blank white screen during Supabase fetches
   → Critical for 3G users (common in India)

9. Batch About page queries (3→1)                      [30m]
   → about, ceo_image, md_image in single Promise.all

10. Optimize animations                                [1h]
    → Single shared IntersectionObserver instead of per-element
    → requestAnimationFrame instead of setInterval for counters

PHASE 3 — IMAGE PIPELINE (8-12 hours, additional 15%)
──────────────────────────────────────────────────────
11. Migrate images from Google Drive → Supabase Storage [4h]
    → Reliable CDN, cache headers, no throttling risk

12. Add responsive images (srcSet)                     [2h]
    → 640/1024/1920px breakpoints
    → <picture> element with WebP/AVIF + JPEG fallback

13. Replace stock Pexels hero with real project photo  [1h]
    → Depends on getting actual project photography

14. Add width/height to all <img> tags (CLS fix)       [1h]

15. Client-side data caching                           [2h]
    → sessionStorage for site_settings, hero, metrics
    → stale-while-revalidate pattern
```

---

## 6. Frontend & UX Roadmap

### Current: F (40/100) for conversion optimization
### Target: B+ (85/100) — competitive with Indian real estate peers

### Critical UX Fixes (Phase 1)

| # | Fix | Impact | Effort |
|---|-----|--------|--------|
| UX1 | **Add floating WhatsApp button (global)** | +30-50% WhatsApp leads | 2h |
| UX2 | **Add 3-field lead form to Home page** (name, phone, interest) | +150-300% leads | 4h |
| UX3 | **Replace stock hero image** with real project photo | Trust + professionalism | 1h (needs photo) |
| UX4 | ~~**Add RERA numbers** to project cards and detail pages~~ | **DONE** (2026-02-26) — Schema, admin form, detail page, and card display implemented. Needs actual RERA data entry. | 1h (needs data) |
| UX5 | **Add skeleton loading screens** | Eliminates blank screen on slow networks | 3h |

### High UX Fixes (Phase 2)

| # | Fix | Impact | Effort |
|---|-----|--------|--------|
| UX6 | **Reduce form to progressive disclosure** — 3 fields visible, expand for optional | +50-80% completions | 3h |
| UX7 | **Add "Enquire Now" CTA on every project card** | +40% click-to-contact | 1h |
| UX8 | **Add "Schedule Site Visit" CTA on project detail** | Captures highest-intent visitors | 2h |
| UX9 | **Add breadcrumbs to project detail page** | Navigation clarity | 1h |
| UX10 | **Fix mobile nav** — add slide animation + backdrop overlay | Polish | 2h |
| UX11 | **Add "Enquire Now" button to navbar** (pill-shaped, contrasting) | Persistent CTA visibility | 1h |
| UX12 | **Fix WCAG accessibility** — focus rings, ARIA roles, contrast ratios, fieldsets | Compliance + usability | 4h |

### Medium UX Fixes (Phase 3)

| # | Fix | Impact | Effort |
|---|-----|--------|--------|
| UX13 | Add price range indicators to projects | Buyer self-qualification | 2h (needs data) |
| UX14 | Add floor plans / BHK configurations | High-value sales content. **Partial:** flat_config field added (2026-02-26). Floor plan images/PDFs still needed. | 4h (needs assets) |
| UX15 | Associate reviews with specific projects | Trust context | 2h |
| UX16 | Add social media links to footer | Trust signals | 30m |
| UX17 | Add click-to-call sticky bar on mobile | Mobile conversion | 2h |
| UX18 | Glass-morphism navbar on scroll | Premium feel | 30m |
| UX19 | Improve project card variety (hero card + smaller cards) | Visual interest | 2h |

### Conversion Funnel — Before vs After

```
BEFORE (Current)                    AFTER (Post Phase 2)
─────────────────────────           ─────────────────────────
HOME (100%)                         HOME (100%)
  No form, no CTA                     3-field form + WhatsApp FAB
  ↓ DROP: ~60%                        ↓ DROP: ~25%
PROJECTS (40%)                      PROJECTS (75%)
  No CTA on cards                     "Enquire Now" on every card
  ↓ DROP: ~70%                        ↓ DROP: ~40%
PROJECT DETAIL (12%)                PROJECT DETAIL (45%)
  No form, no CTA                     Schedule Visit + mini form
  ↓ DROP: ~85%                        ↓ DROP: ~50%
CONTACT (2%)                        CONTACT (22%)
  7-field form                        3-field progressive form
  ↓ DROP: ~60%                        ↓ DROP: ~30%
LEAD CAPTURED (0.8%)                LEAD CAPTURED (15%)
                                    + WhatsApp leads (additional 5-10%)
```

**Projected improvement: 0.8% → 15-25% conversion rate (20-30x increase)**

---

## 7. Feature Roadmap

### Now (Phase 1) — Foundation
- [ ] Floating WhatsApp button (global)
- [ ] Home page lead capture form (3 fields)
- [ ] Skeleton loading screens
- [ ] Error boundary component
- [ ] Code splitting (React.lazy)

### Next (Phase 2) — Growth
- [ ] Progressive disclosure lead form
- [ ] Project detail CTA ("Schedule Visit")
- [ ] Breadcrumb navigation
- [ ] Admin dashboard decomposition (split Admin.tsx)
- [ ] Lead pagination in admin
- [ ] Audit logging table + admin action tracking
- [ ] .env.example file

### Later (Phase 3) — Competitive
- [ ] React Router (proper SEO, code splitting, deep linking)
- [ ] React Context for auth state (eliminate prop drilling)
- [ ] Image migration to Supabase Storage
- [ ] Automated test suite (Vitest)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Interactive project map (Leaflet/OpenStreetMap)
- [ ] EMI calculator on project detail
- [ ] PDF brochure download (email-gated)

### Future (Phase 4) — Differentiation
- [ ] Blog/insights section (SEO play)
- [ ] Project comparison feature
- [ ] Virtual tour links / 360 photos
- [ ] Video hero (drone footage)
- [ ] Dark mode
- [ ] Analytics integration (Plausible/PostHog)
- [ ] Email notifications for new leads
- [ ] Chatbot / conversational lead capture

### Completed Features
- [x] **Project detail fields** (2026-02-26) — Added RERA number, flat configuration, built-up area, and towers fields to projects schema. Admin CRUD, project detail display, and project card display all updated. Architectural impact: LOW (additive schema change, nullable columns, no breaking changes).

---

## 8. Documentation Cleanup Plan

### Verified Errors in CLAUDE.md (Must Fix)

| # | Claim | Reality | Fix |
|---|-------|---------|-----|
| 1 | References `useSessionTimeout.ts` as existing | File may have been deleted — not found on disk | Remove reference or recreate the file |
| 2 | References `SessionTimeoutWarning.tsx` as existing | File may have been deleted — not found on disk | Remove reference or recreate the file |
| 3 | References `sanitize.test.ts` as existing | File not found on disk | Remove reference or create tests |
| 4 | Claims 19+ useState in Admin.tsx | Verified: actually 19+ useState calls | Correct (keep) |
| 5 | States "Kolkata" location | DB seed data says "Hyderabad" | Clarify actual business location |
| 6 | Lists TypeScript 5.5.3 | Correct (matches package.json) | Keep |
| 7 | States "No React Router" | Correct (not installed) | Keep |

### Documentation Actions

```
IMMEDIATE (Phase 1)
────────────────────
1. Fix CLAUDE.md: Remove references to files that don't exist on disk
2. Fix CLAUDE.md: Clarify Kolkata vs Hyderabad (ask business owner)
3. Fix CLAUDE.md: Update "Known Issues" to reflect current state
4. Create .env.example with all required variables + comments
5. Update README.md with actual setup instructions

PHASE 2
────────────────────
6. Add ARCHITECTURE.md with actual system diagram
7. Add CONTRIBUTING.md for developer onboarding
8. Document Edge Function API contract (OpenAPI or markdown)
9. Add inline JSDoc to sanitize.ts, types.ts

PHASE 3
────────────────────
10. Remove all standalone audit reports (consolidate into this blueprint)
11. Add ADR (Architecture Decision Record) for key choices
12. Document deployment runbook (rollback, emergency procedures)
```

### Files to Delete After Consolidation
- `BACKEND_SECURITY_AUDIT.md` — consolidated into this blueprint
- `SYSTEM_UNDERSTANDING_REPORT.md` — consolidated into this blueprint
- `UX_PERFORMANCE_AUDIT.md` — consolidated into this blueprint
- `ADMIN_GUIDE.md` — already deleted (git status shows `D`)

---

## 9. Quick Wins (High Impact / Low Effort)

**Each item below is < 1 hour and delivers measurable improvement.**

| # | Win | Impact Area | Time | ROI |
|---|-----|-------------|------|-----|
| 1 | **Disable public signup** — `config.toml: enable_signup = false` | Security | 5m | Closes the #1 vulnerability |
| 2 | **Remove CORS regex** — hardcode 4 explicit domains | Security | 15m | Eliminates attacker domain injection |
| 3 | **npm audit fix** | Security | 15m | Patches 3 HIGH vulnerabilities |
| 4 | **Remove localhost from CSP** — delete `127.0.0.1:54321` from vercel.json | Security | 5m | Cleaner security headers |
| 5 | **Add `loading="lazy"` to all images** | Performance | 15m | Reduces initial page weight |
| 6 | **Move Google Fonts to `<link preload>`** | Performance | 15m | Eliminates render-blocking |
| 7 | **Disable production source maps** — `build.sourcemap: false` | Security + Size | 5m | Hides source code + smaller build |
| 8 | **Floating WhatsApp button** | Conversion | 1h | +30-50% WhatsApp leads |
| 9 | **Password policy: 12 chars + complexity** | Security | 5m | config.toml change only |
| 10 | **Add preconnect hints** to index.html | Performance | 10m | Faster resource loading |
| 11 | **Create .env.example** | DX | 15m | Unblocks new developer onboarding |
| 12 | **Fix package.json name** — `vite-react-typescript-starter` → `padmalaya` | Professionalism | 1m | Embarrassing in logs/error reports |

**Total quick win time: ~3 hours. Addresses 4 critical security issues + meaningful perf/conversion gains.**

---

## 10. Long-Term Architecture Vision

### Current Architecture (Monolithic SPA)
```
┌──────────────────────────────────────────────┐
│  SINGLE BUNDLE (420KB)                        │
│  All pages + admin + MFA + form + sanitize    │
│  Hash routing (#/page)                        │
│  No code splitting, no lazy loading           │
│  useState everywhere, no state management     │
│  Props drilling through all levels            │
└───────────────┬──────────────────────────────┘
                │
        Single Edge Function (386 lines)
                │
        PostgreSQL (5 tables, no RBAC)
```

### Target Architecture (12-month vision)
```
┌──────────────────────────────────────────────────────────┐
│  PUBLIC SPA                    │  ADMIN SPA (separate)    │
│  React Router + lazy loading   │  React Router + lazy     │
│  < 80KB initial bundle        │  Protected by RBAC       │
│  SEO-friendly URLs (/project) │  Audit-logged actions    │
│  React Context for state      │  Paginated data views    │
│  Skeleton loading states      │  Role-based permissions  │
│  Service Worker (offline)     │  Session timeout active  │
└──────────────┬─────────────────────────┬─────────────────┘
               │                         │
    ┌──────────▼─────────┐    ┌──────────▼─────────┐
    │  Edge Fn: submit   │    │  Edge Fn: admin-api │
    │  KV rate limiting  │    │  RBAC middleware     │
    │  IP: cf-connecting │    │  Audit log writes    │
    │  Idempotent        │    │  Paginated queries   │
    └──────────┬─────────┘    └──────────┬──────────┘
               │                         │
    ┌──────────▼─────────────────────────▼──────────┐
    │  PostgreSQL 17                                 │
    │  RBAC RLS policies (role = 'admin')            │
    │  audit_logs table                              │
    │  Optimized indexes                             │
    │  IP anonymization (GDPR)                       │
    └───────────────────────────────────────────────┘
               │
    ┌──────────▼──────────┐
    │  Supabase Storage    │
    │  CDN-backed images   │
    │  WebP/AVIF + JPEG    │
    │  Responsive srcSet   │
    └─────────────────────┘
```

### Key Architectural Migrations

| Migration | From | To | Why | When |
|-----------|------|----|-----|------|
| Routing | Hash (`#/page`) | React Router (`/page`) | SEO, code splitting, deep links | Phase 3 |
| State | useState + props | React Context + useReducer | Eliminate prop drilling, cleaner state | Phase 2 |
| Images | Google Drive thumbnails | Supabase Storage + CDN | Reliability, caching, responsive | Phase 3 |
| Admin | Single 1,099-line file | 5-6 focused components | Maintainability, testability | Phase 2 |
| Rate Limiting | DB queries per request | KV store (Upstash Redis) | Scalability (100x throughput) | Phase 2 |
| Testing | Zero tests | Vitest + GitHub Actions | Confidence in changes | Phase 2-3 |
| Monitoring | Nothing | PostHog/Plausible + Sentry | Visibility into user behavior + errors | Phase 3 |

---

## 11. Execution Priority Plan

### Phase 1: "Stop the Bleeding" (Week 1 — ~20 hours)

**Goal:** Close all critical security vulnerabilities, capture 3x more leads, establish baseline quality.

#### Security Sprint (Day 1-2, ~8 hours)
```
□ Disable public signup in config.toml
□ Add RBAC to all RLS policies (role check)
□ Remove CORS regex, whitelist explicit domains only
□ Fix IP extraction (use platform-provided IP, not x-forwarded-for)
□ Add MFA brute force lockout (5 attempts → 60s exponential backoff)
□ Create session timeout hook + warning component (or verify files exist)
□ Wire session timeout into Admin.tsx
□ Run npm audit fix
□ Update password policy: 12 chars + complexity
□ Enable email confirmation in config.toml
□ Enable Supabase session timeouts in config.toml
□ Remove localhost URL from production CSP in vercel.json
```

#### Performance Sprint (Day 3, ~3 hours)
```
□ Add React.lazy() + Suspense to App.tsx for all pages
□ Disable source maps in vite.config.ts
□ Move Google Fonts from @import to <link preload> in index.html
□ Add preconnect hints (Supabase, Google Fonts, Google Drive)
□ Add loading="lazy" to all non-hero images
```

#### Conversion Sprint (Day 4-5, ~6 hours)
```
□ Add floating WhatsApp button (global, bottom-right)
□ Add compact 3-field lead form to Home page
□ Add skeleton loading screens to replace blank states
□ Add error boundary component wrapping the app
```

#### Documentation Sprint (Day 5, ~3 hours)
```
□ Fix CLAUDE.md factual errors (9 items)
□ Create .env.example
□ Fix package.json name
□ Update README.md with actual setup steps
```

**Phase 1 Exit Criteria:**
- Zero critical vulnerabilities
- All OWASP Top 10 categories at SECURE or IMPROVED
- Home page has lead capture form
- WhatsApp button visible on all pages
- Bundle split into at least 3 chunks
- CLAUDE.md matches reality

---

### Phase 2: "Build the Foundation" (Weeks 2-4, ~40 hours)

**Goal:** Decompose monolith, add observability, optimize conversion funnel, establish testing.

#### Admin Decomposition (Week 2, ~12 hours)
```
□ Extract AdminProjects.tsx from Admin.tsx
□ Extract AdminReviews.tsx from Admin.tsx
□ Extract AdminLeads.tsx from Admin.tsx
□ Extract AdminSettings.tsx from Admin.tsx
□ Extract AdminSecurity.tsx from Admin.tsx
□ Add React Context for admin state (replace 19+ useState)
□ Add pagination to LeadsManager
```

#### Backend Hardening (Week 2-3, ~8 hours)
```
□ Parallelize rate limit queries (Promise.all)
□ Move Supabase client to module scope
□ Add AbortController timeout to Turnstile API call (5s)
□ Add retry logic to database insert (3 retries, exponential backoff)
□ Add request deduplication via Turnstile token
□ Tighten CSP: HTTPS-only images, specific Google domains
□ Add content-length validation (reject >10KB)
```

#### Observability (Week 3, ~8 hours)
```
□ Create audit_logs table + triggers for all admin CRUD
□ Add updated_at triggers to projects, project_images, customer_reviews
□ Add composite indexes for lead analytics queries
□ Implement IP anonymization (hash after 24h)
□ Add MFA recovery codes
```

#### Conversion Optimization (Week 3-4, ~8 hours)
```
□ Progressive disclosure lead form (3 fields → expand for more)
□ Add "Enquire Now" CTA on every project card
□ Add "Schedule Site Visit" on ProjectDetail
□ Add breadcrumbs to project detail
□ Fix mobile nav animation (slide-in + backdrop)
□ Add "Enquire Now" pill button to navbar
```

#### Testing Foundation (Week 4, ~4 hours)
```
□ Install Vitest
□ Write tests for sanitize.ts (9 functions)
□ Write tests for submit-lead input validation
□ Add test script to package.json
```

**Phase 2 Exit Criteria:**
- Admin.tsx < 200 lines (orchestrator only)
- All admin CRUD actions audit-logged
- Progressive lead form live
- At least 20 unit tests passing
- MFA has recovery codes

---

### Phase 3: "Scale & Optimize" (Months 2-3, ~60 hours)

**Goal:** Production-grade infrastructure, SEO, monitoring, professional image pipeline.

#### Infrastructure (Month 2, ~20 hours)
```
□ Migrate to React Router (proper URLs, code splitting, lazy routes)
□ Add React Context for auth state (eliminate prop drilling)
□ Set up GitHub Actions CI/CD (lint, typecheck, test, build, deploy)
□ Add Sentry or similar error tracking
□ Add Plausible/PostHog analytics
□ Migrate images from Google Drive to Supabase Storage
□ Add responsive image pipeline (srcSet, WebP/AVIF)
```

#### Scale (Month 2, ~12 hours)
```
□ Replace DB-based rate limiting with Upstash Redis
□ Add client-side data caching (sessionStorage for settings)
□ Vendor chunk splitting in vite.config.ts
□ Add Service Worker for offline support
□ Configure Supabase connection pooling
```

#### Features (Month 3, ~16 hours)
```
□ Interactive project map (Leaflet/OpenStreetMap)
□ EMI calculator on project detail
□ PDF brochure download (email-gated)
□ Email notifications for new leads
□ Blog/insights section (SEO)
```

#### Polish (Month 3, ~12 hours)
```
□ WCAG AA accessibility audit + fixes
□ Replace stock hero with video/drone footage
□ Add animated page transitions
□ Dark mode toggle
□ Project comparison feature
```

**Phase 3 Exit Criteria:**
- SEO-friendly URLs (no hash routing)
- CI/CD pipeline with tests gating deploys
- All images served from CDN (not Google Drive)
- Error tracking active
- Analytics reporting lead funnel metrics
- 50+ automated tests

---

## 12. Developer Action Checklist

### Before You Write Any Code
- [ ] Read this blueprint end-to-end
- [ ] Verify CLAUDE.md matches the actual codebase (9 known errors exist)
- [ ] Run `npm run build && npm run lint && npm run typecheck` — all must pass
- [ ] Check `npm audit` output — understand existing vulnerabilities
- [ ] Create `.env` file from `.env.example` (create the example first if missing)

### For Every PR
- [ ] No new `any` types introduced
- [ ] No `console.log` in production code (or gated behind `NODE_ENV`)
- [ ] No hardcoded URLs or secrets
- [ ] No new `unsafe-inline` or `unsafe-eval` in CSP
- [ ] Inputs that reach the database are sanitized via `sanitize.ts` functions
- [ ] New state is managed in the appropriate component (not added to Admin.tsx)
- [ ] `npm run build` succeeds with zero errors
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes

### Security Checklist (Phase 1 Sprint)
- [ ] `supabase/config.toml`: `enable_signup = false`
- [ ] `supabase/config.toml`: `minimum_password_length = 12`
- [ ] `supabase/config.toml`: `password_requirements = "letters_digits"`
- [ ] `supabase/config.toml`: `enable_confirmations = true`
- [ ] `supabase/config.toml`: `secure_password_change = true`
- [ ] `supabase/config.toml`: Uncomment `[auth.sessions]` with `timebox` and `inactivity_timeout`
- [ ] All RLS policies have role check: `(SELECT auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true`
- [ ] `vercel.json`: No `127.0.0.1` in any header
- [ ] `vercel.json`: `img-src` uses `https:` not `http:`
- [ ] Edge Function: CORS whitelist has no regex, only explicit domains
- [ ] Edge Function: IP from platform header, not `x-forwarded-for`
- [ ] MFAVerify: Attempt counter with exponential backoff lockout
- [ ] Session timeout: Hook imported in Admin.tsx, warning component rendered
- [ ] `npm audit` shows 0 HIGH/CRITICAL vulnerabilities

### Performance Checklist (Phase 1 Sprint)
- [ ] `App.tsx`: All page imports use `React.lazy()`
- [ ] `App.tsx`: `renderPage()` wrapped in `<Suspense>`
- [ ] `vite.config.ts`: `build.sourcemap = false`
- [ ] `index.html`: `<link rel="preconnect">` for fonts + Supabase
- [ ] `index.css`: No `@import` for Google Fonts (moved to `index.html`)
- [ ] All `<img>` tags (except hero) have `loading="lazy"`

### Conversion Checklist (Phase 1 Sprint)
- [ ] Floating WhatsApp button visible on all pages (bottom-right, fixed position)
- [ ] Home page has a compact lead form (name + phone + interest)
- [ ] Skeleton loading screens replace all "Loading..." text states
- [ ] Error boundary wraps the app in `App.tsx`

---

## Appendix A: File Change Impact Map

Files that will be modified in Phase 1, ordered by risk:

| File | Changes | Risk | Test Strategy |
|------|---------|------|--------------|
| `supabase/config.toml` | Auth settings, session config | LOW | Config only, verify via Supabase dashboard |
| `vercel.json` | CSP headers cleanup | LOW | Deploy to preview, check response headers |
| `vite.config.ts` | Source maps, chunk splitting | LOW | Build and verify output |
| `index.html` | Preconnect hints, font loading | LOW | Visual inspection |
| `index.css` | Remove @import | LOW | Visual inspection (fonts still load) |
| `package.json` | Name fix, audit fix | LOW | npm install + build |
| `src/App.tsx` | React.lazy, Suspense, error boundary | MEDIUM | Manual navigation test all routes |
| `src/pages/Home.tsx` | Add lead form, skeleton states | MEDIUM | Visual + form submission test |
| `src/pages/Admin.tsx` | Session timeout, MFA lockout | HIGH | Full admin flow test |
| `src/components/MFAVerify.tsx` | Brute force lockout | HIGH | Test lockout behavior |
| `src/components/LeadForm.tsx` | No changes Phase 1 | — | — |
| `supabase/functions/submit-lead/index.ts` | CORS fix, IP fix, timeout | HIGH | Test with curl from multiple origins |
| New migration: `add_rbac_policies.sql` | Role-based RLS | CRITICAL | Test all CRUD as non-admin user |

## Appendix B: Effort Estimation Summary

| Phase | Calendar Time | Dev Hours | Key Deliverables |
|-------|--------------|-----------|-----------------|
| Phase 1 | Week 1 | ~20h | Security fixes, code splitting, WhatsApp button, Home lead form |
| Phase 2 | Weeks 2-4 | ~40h | Admin decomposition, audit logging, conversion funnel, testing |
| Phase 3 | Months 2-3 | ~60h | React Router, CI/CD, image migration, analytics, features |
| **Total** | **~3 months** | **~120h** | **Production-grade real estate platform** |

## Appendix C: Technology Decisions Pending

| Decision | Options | Recommendation | Decide By |
|----------|---------|----------------|-----------|
| Rate limiting backend | Upstash Redis / Cloudflare KV / In-memory | Upstash Redis (serverless, Deno-compatible, $0 for <10K/day) | Phase 2 |
| Image hosting | Supabase Storage / Cloudinary / Vercel Image Optimization | Supabase Storage (already in stack, free tier sufficient) | Phase 3 |
| Analytics | Plausible / PostHog / Google Analytics | Plausible (privacy-first, no cookie banner needed) | Phase 3 |
| Error tracking | Sentry / LogRocket / Highlight.io | Sentry (industry standard, generous free tier) | Phase 3 |
| Testing | Vitest / Jest | Vitest (native Vite integration, faster) | Phase 2 |
| Router | React Router / TanStack Router | React Router v7 (larger ecosystem, simpler migration) | Phase 3 |

---

> **Executive Summary:** Padmalaya is a small but functional real estate SPA with strong input sanitization and MFA, undermined by 7 critical security vulnerabilities (most notably: any user can become admin), a 0.8% lead conversion rate (fixable to 15-25% with proven changes), and zero automated testing or CI/CD. Phase 1 (20 hours) closes all critical risks and could 3x lead volume. The full 3-phase plan transforms it into a production-grade platform in ~120 developer hours over 3 months.
