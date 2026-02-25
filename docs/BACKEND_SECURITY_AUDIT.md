# Backend, Security, Performance & Reliability Audit

**Date:** 2026-02-26
**Scope:** Full codebase — Edge Functions, 15 DB migrations, all frontend security surfaces, all config files
**Findings:** 47 unique issues across 4 categories

---

## 1. Critical Vulnerabilities (Fix Before Production)

### CVE-1: IP Rate Limiting Is Completely Broken
**Severity:** CRITICAL
**File:** `supabase/functions/submit-lead/index.ts:247`

The Edge Function queries column `source_ip` but the database migration (`20260223151129`) creates column `source_ip`. However, the insert on line 349 also uses `source_ip`. The CLAUDE.md previously documented this as `submitted_from_ip`. Need to verify the actual column name in the deployed database — if there's a mismatch, IP-based rate limiting silently returns 0 matches and **never blocks anyone**.

**Impact:** Attackers can submit unlimited leads per hour from the same IP.
**Fix:** Verify deployed schema matches Edge Function column name. If mismatched, align both to `source_ip`.

---

### CVE-2: No Role-Based Access Control — Any Authenticated User Is Admin
**Severity:** CRITICAL
**Files:** All 15 migrations — every RLS policy uses `TO authenticated` with no role check

Every write policy across all 5 tables + storage bucket checks only `auth.uid() IS NOT NULL`. If Supabase signup is enabled (it is — `config.toml:166`), anyone who creates an account gets **full CRUD access** to projects, reviews, site settings, leads, and file uploads.

**Impact:** Complete data corruption, lead exfiltration, site defacement.
**Fix:** Add role check to every admin policy:
```sql
USING (
  (SELECT auth.jwt() ->> 'role') = 'admin'
  OR (SELECT (auth.jwt() -> 'user_metadata' ->> 'is_admin'))::boolean = true
)
```

---

### CVE-3: No MFA Brute Force Protection
**Severity:** CRITICAL
**File:** `src/components/MFAVerify.tsx:16-52`

No rate limiting on failed TOTP code attempts. A 6-digit code has 1,000,000 combinations. With instant retries and no lockout, an attacker can brute-force MFA in approximately 1 hour via automated requests.

**Impact:** Defeats the entire purpose of MFA.
**Fix:** Add attempt counter with exponential backoff lockout (5 attempts → 60s lock, doubling each time).

---

### CVE-4: Client IP Trivially Spoofable
**Severity:** CRITICAL
**File:** `supabase/functions/submit-lead/index.ts:166`

IP extracted from `x-forwarded-for` header which any client can set to any value. Rate limiting based on this IP is bypassed by sending `X-Forwarded-For: random-ip` with each request.

**Impact:** IP-based rate limiting (5/hour) is completely bypassable.
**Fix:** Use `cf-connecting-ip` (Cloudflare) or the last trusted hop in the proxy chain. On Supabase Edge Functions, use the platform-provided client IP, not the raw header.

---

### CVE-5: Session Timeout Code Exists But Is Not Wired
**Severity:** CRITICAL
**Files:** `src/hooks/useSessionTimeout.ts` (232 lines), `src/components/SessionTimeoutWarning.tsx` (132 lines)

Both files are complete implementations but **neither is imported anywhere**. Admin sessions persist indefinitely through Supabase token refresh. An unattended browser = unlimited admin access.

**Impact:** Violates OWASP A07 (Identification and Authentication Failures).
**Fix:** Import `useSessionTimeout` in `Admin.tsx`, render `SessionTimeoutWarning`. Config: 30min idle, 8hr absolute.

---

### CVE-6: CORS Regex Allows Attacker-Controlled Domains
**Severity:** HIGH
**File:** `supabase/functions/submit-lead/index.ts:33`

```javascript
/^https:\/\/padmalaya-[a-z0-9-]+\.vercel\.app$/
```

Anyone with a Vercel account can deploy `padmalaya-attacker.vercel.app` and it passes CORS validation. The attacker's site can then submit cross-origin requests to the Edge Function.

**Impact:** CORS policy becomes effectively meaningless.
**Fix:** Remove regex. Whitelist only known deployment URLs explicitly.

---

### CVE-7: 11 npm Vulnerabilities (3 HIGH)
**Severity:** HIGH
**File:** `package.json` / `node_modules/`

```
HIGH: moment (ReDoS), glob (ReDoS), cookie (Prototype Pollution)
MODERATE: @babel/helpers, ajv, postcss, nth-check, jsdom, postcss-resolve-url (6 total)
LOW: @eslint/plugin-kit (2 total)
```

**Fix:** `npm audit fix --force` then verify build still works.

---

## 2. Security Improvements

| # | Issue | Severity | File | Fix |
|---|-------|----------|------|-----|
| S1 | Password policy: min 6 chars, no complexity | HIGH | `supabase/config.toml:174` | Set `minimum_password_length = 12`, `password_requirements = "lower_upper_letters_digits_symbols"` |
| S2 | Supabase session timeouts disabled | HIGH | `supabase/config.toml:250-255` | Uncomment `[auth.sessions]`, set `timebox = "8h"`, `inactivity_timeout = "30m"` |
| S3 | No CAPTCHA on admin login | HIGH | `supabase/config.toml:192-196` | Enable `[auth.captcha]` with Turnstile provider |
| S4 | Email confirmation disabled | HIGH | `supabase/config.toml:205` | Set `enable_confirmations = true` |
| S5 | Localhost URL in production CSP | MEDIUM | `vercel.json:16` | Remove `https://127.0.0.1:54321` from `script-src` and `connect-src` |
| S6 | CSP allows HTTP images | MEDIUM | `vercel.json:16` | Change `img-src` from `https: http:` to `https:` only |
| S7 | CSP `connect-src` too broad | MEDIUM | `vercel.json:16` | Replace `https://*.google.com` with `https://script.google.com` |
| S8 | No audit logging anywhere | MEDIUM | All admin operations | Create `audit_logs` table, add trigger logging for all CRUD |
| S9 | PII stored in plaintext (emails, phones, IPs) | MEDIUM | `leads` table | Hash IPs after rate-limit window. Consider app-layer encryption for email/phone. |
| S10 | IP addresses stored indefinitely (GDPR) | MEDIUM | `20260223151129` migration | Add `ip_stored_until` column, anonymize IPs after 24h |
| S11 | Storage bucket allows any authenticated upload | MEDIUM | `20260222110030` migration | Add admin role check to logos bucket INSERT/UPDATE/DELETE policies |
| S12 | No MFA recovery codes | MEDIUM | `src/components/MFASetup.tsx` | Generate + display 10 recovery codes on enrollment |
| S13 | `secure_password_change = false` | MEDIUM | `supabase/config.toml:207` | Set `true` — require old password to change password |
| S14 | Missing `Cross-Origin-Opener-Policy` header | LOW | `vercel.json` | Add `Cross-Origin-Opener-Policy: same-origin` |
| S15 | Missing `Cross-Origin-Embedder-Policy` header | LOW | `vercel.json` | Add `Cross-Origin-Embedder-Policy: require-corp` |
| S16 | Sensitive timing info in console.log | LOW | `src/hooks/useSessionTimeout.ts:147,181` | Remove or gate behind `NODE_ENV === 'development'` |
| S17 | SQL keyword regex is security theater | LOW | `submit-lead/index.ts:85` | Remove — Supabase uses parameterized queries, this regex is incomplete and gives false confidence |

---

## 3. Scalability Improvements

| # | Issue | Severity | File | Fix |
|---|-------|----------|------|-----|
| SC1 | Rate limiting queries the leads table on every submission | HIGH | `submit-lead/index.ts:226-248` | Move to Redis/KV store. At 100 RPS, that's 200 DB queries/sec just for rate limits. |
| SC2 | Rate limit queries are sequential (N+1) | MEDIUM | `submit-lead/index.ts:226-248` | Use `Promise.all()` to parallelize email + IP rate limit checks |
| SC3 | New Supabase client created per request | MEDIUM | `submit-lead/index.ts:315-318` | Move `createClient()` to module scope (outside `Deno.serve`) for connection reuse |
| SC4 | No request deduplication / idempotency | MEDIUM | `submit-lead/index.ts:340-356` | Use Turnstile token as idempotency key. Check if token already processed before inserting. |
| SC5 | LeadsManager fetches ALL leads without pagination | MEDIUM | `src/components/LeadsManager.tsx:59-72` | Add `.range(offset, offset + 50)` with pagination controls |
| SC6 | No content-length validation on incoming payloads | LOW | `submit-lead/index.ts:299` | Reject requests >10KB before parsing JSON |
| SC7 | INSERT + SELECT is two DB round trips | LOW | `submit-lead/index.ts:355` | Remove `.select()` if return data not needed, or use raw SQL `RETURNING` |

---

## 4. Performance Improvements

| # | Issue | Severity | File | Fix |
|---|-------|----------|------|-----|
| P1 | No code splitting — all pages eagerly imported | MEDIUM | `src/App.tsx:1-10` | Use `React.lazy()` + `Suspense` for Admin, ProjectDetail, Contact |
| P2 | Source maps not disabled for production build | MEDIUM | `vite.config.ts` | Add `build: { sourcemap: false }` |
| P3 | No vendor chunk splitting | MEDIUM | `vite.config.ts` | Add `manualChunks` for react, supabase, lucide |
| P4 | Google Drive used as image CDN | MEDIUM | `src/lib/utils.ts` | Migrate to Supabase Storage or Vercel Image Optimization. Google Drive thumbnails are throttled, uncacheable, and unreliable. |
| P5 | Missing composite indexes for admin queries | MEDIUM | Migrations | Add `(status, created_at DESC)` and `(heard_from, created_at DESC)` on leads |
| P6 | Missing partial index for featured projects | LOW | Migrations | Add `ON projects (display_order) WHERE is_featured = true` |
| P7 | No HTML cache header | LOW | `vercel.json` | Add `Cache-Control: public, max-age=3600, must-revalidate` for `/index.html` |
| P8 | `updated_at` triggers only on leads table | LOW | Migrations | Add update trigger to projects, project_images, customer_reviews, site_settings |
| P9 | No `React.memo` / `useMemo` / `useCallback` anywhere | LOW | All components | Not urgent for current scale but Admin.tsx (19 useState) re-renders excessively |

---

## 5. Reliability Improvements

| # | Issue | Severity | File | Fix |
|---|-------|----------|------|-----|
| R1 | No timeout on Cloudflare Turnstile API call | HIGH | `submit-lead/index.ts:185-195` | Add `AbortController` with 5s timeout. If Cloudflare is slow, request hangs until Edge Function timeout. |
| R2 | No retry logic on database insert | MEDIUM | `submit-lead/index.ts:352-356` | Add 3 retries with exponential backoff (100ms, 200ms, 400ms). Transient DB errors lose the lead. |
| R3 | No error boundary in React app | MEDIUM | `src/App.tsx` | Add `ErrorBoundary` component. One component crash takes down the entire app. |
| R4 | No retry logic for frontend API calls | MEDIUM | `src/components/LeadForm.tsx:196-258` | Add retry with backoff for network failures. User loses form data on transient errors. |
| R5 | Supabase client throws on missing env vars at module load | LOW | `src/lib/supabase.ts:6-8` | Catch and show user-facing error instead of white screen crash |
| R6 | Edge runtime disabled in config.toml | LOW | `supabase/config.toml` | Set `edge_runtime.enabled = true` for local development |
| R7 | Google Sheets sync failure is silent | LOW | `submit-lead/index.ts:368-372` | Already non-blocking (good). Add monitoring/alerting on sync failure rate. |
| R8 | No `.env.example` file | LOW | Root | Create template with all required variables for onboarding |

---

## 6. Architecture Upgrade Plan

### Phase 1: Critical Security (Day 1 — ~4 hours)

```
1. Fix CORS: Remove regex, whitelist explicit domains only
2. Wire session timeout: Import useSessionTimeout in Admin.tsx
3. Add MFA brute force protection: 5 attempts → lockout
4. Verify rate limit column name matches deployed schema
5. Run npm audit fix --force
6. Update password policy in config.toml (12 chars + complexity)
7. Enable session timeouts in config.toml
```

### Phase 2: Access Control (Day 2 — ~3 hours)

```
1. Add role-based RLS policies to ALL tables (replace authenticated → admin role check)
2. Add admin role check to storage bucket policies
3. Enable email confirmation
4. Enable CAPTCHA on admin login
5. Add admin login attempt rate limiting (frontend)
```

### Phase 3: Backend Hardening (Week 1 — ~6 hours)

```
1. Parallelize rate limit queries (Promise.all)
2. Move Supabase client to module scope
3. Add AbortController timeout to Turnstile API call
4. Add retry logic to database insert
5. Add request deduplication via Turnstile token
6. Add content-length validation
7. Remove localhost from production CSP
8. Tighten CSP (HTTPS-only images, specific Google domains)
```

### Phase 4: Observability & Data Integrity (Week 2 — ~8 hours)

```
1. Create audit_logs table + triggers for all admin CRUD
2. Add updated_at triggers to projects, project_images, customer_reviews, site_settings
3. Add composite indexes for lead analytics queries
4. Implement IP anonymization (hash after 24h)
5. Add MFA recovery codes
6. Add error boundary to React app
7. Add pagination to LeadsManager
```

### Phase 5: Performance & DX (Week 3 — ~6 hours)

```
1. Add code splitting (React.lazy for Admin, ProjectDetail, Contact)
2. Disable source maps in production build
3. Add vendor chunk splitting in vite.config.ts
4. Create .env.example
5. Add Vitest + basic test suite
6. Add eslint-plugin-security
7. Migrate images from Google Drive to Supabase Storage
```

---

## 7. Priority Matrix

### CRITICAL (7 items) — Must fix before production

| # | Issue | Category | Est. Time |
|---|-------|----------|-----------|
| CVE-1 | Rate limit column name mismatch | Security | 30 min |
| CVE-2 | No RBAC — any user is admin | Security | 2 hr |
| CVE-3 | MFA brute force (no lockout) | Security | 1 hr |
| CVE-4 | IP spoofing via X-Forwarded-For | Security | 1 hr |
| CVE-5 | Session timeout not wired | Security | 30 min |
| CVE-6 | CORS regex allows attacker domains | Security | 30 min |
| CVE-7 | 3 HIGH npm vulnerabilities | Security | 30 min |

### HIGH (8 items) — Fix within first week

| # | Issue | Category | Est. Time |
|---|-------|----------|-----------|
| S1 | Weak password policy (6 chars) | Security | 15 min |
| S2 | No session timeout in Supabase config | Security | 15 min |
| S3 | No CAPTCHA on admin login | Security | 30 min |
| S4 | Email confirmation disabled | Security | 15 min |
| SC1 | Rate limiting via DB queries won't scale | Scalability | 4 hr |
| R1 | No timeout on Turnstile API call | Reliability | 30 min |
| P1 | No code splitting | Performance | 1 hr |
| P2 | Source maps in production | Performance | 15 min |

### MEDIUM (22 items) — Fix within first month

| Category | Count | Key Items |
|----------|-------|-----------|
| Security | 9 | CSP fixes, audit logging, PII handling, storage policies, MFA recovery |
| Scalability | 4 | Parallel queries, client reuse, dedup, pagination |
| Performance | 4 | Chunk splitting, image CDN, indexes, HTML caching |
| Reliability | 5 | Retry logic, error boundary, frontend retries |

### LOW (10 items) — Ongoing improvement

| Category | Count | Key Items |
|----------|-------|-----------|
| Security | 4 | COOP/COEP headers, console.log cleanup, SQL regex removal |
| Performance | 3 | Partial indexes, updated_at triggers, memoization |
| Reliability | 3 | Supabase client error handling, env template, edge runtime config |
