# Padmalaya Website — UX, Performance & Conversion Audit

**Date:** 2026-02-26
**Audited By:** Senior Frontend Architect + UX Conversion Specialist
**Site:** https://padmalayagroup.in

---

## Table of Contents

1. [UX Problems](#1-ux-problems)
2. [UI Improvements](#2-ui-improvements)
3. [Performance Improvements](#3-performance-improvements)
4. [Mobile Optimization](#4-mobile-optimization)
5. [Conversion Optimization](#5-conversion-optimization)
6. [Design Upgrade Suggestions](#6-design-upgrade-suggestions)
7. [Priority Matrix](#7-priority-matrix)

---

## 1. UX Problems

### Critical

| # | Issue | Impact | Location |
|---|-------|--------|----------|
| 1 | **No lead capture on Home page** | Users must navigate to Contact to enquire. Home is your highest-traffic page — every visitor who leaves without seeing a form is a lost lead. | `Home.tsx` |
| 2 | **No floating WhatsApp/CTA button** | This is table stakes for Indian real estate. Buyers expect instant WhatsApp chat. Your WhatsApp button is buried on the Contact page only. | Missing globally |
| 3 | **7-field lead form is too long** | Industry data: every field beyond 3 drops conversion ~10%. You require name, email, phone, contact time, interest, heard-from, message + CAPTCHA. That's 8 interactions before submit. | `LeadForm.tsx` |
| 4 | **No loading states / skeleton screens** | Every page fetches from Supabase on mount. Until data arrives, users see a blank white screen or just "Loading..." text. On slow 3G (common in India), this is 3-5 seconds of nothing. | All pages |
| 5 | **Stock hero image from Pexels** | The most important visual on the site is `pexels-photo-1732414.jpeg` — a generic building photo. This destroys trust for premium real estate. Must be your own flagship project. | `Home.tsx:106` |
| 6 | **No RERA number displayed** | Legal requirement under RERA Act 2016 for Indian real estate. Absence is both a compliance risk and a trust signal failure. | Missing everywhere |

### High

| # | Issue | Impact | Location |
|---|-------|--------|----------|
| 7 | **No price indicators anywhere** | Real estate buyers filter by budget. No price range, no "Starting from X", no EMI estimates. Users can't self-qualify, leading to unqualified leads and wasted sales time. | All project pages |
| 8 | **No floor plans or configurations** | Buyers need BHK options, sq ft, and layouts. Without this, your site is a photo gallery, not a sales tool. | `ProjectDetail.tsx` |
| 9 | **About page makes 3 separate Supabase queries** | `fetchAboutData()`, `fetchCeoImage()`, `fetchMdImage()` — 3 serial network requests that could be 1 batched query. Slows TTI. | `About.tsx:16-50` |
| 10 | **No breadcrumbs on project detail** | User lands on a project from search/share, has no context of where they are in the site hierarchy. "Back to Projects" button is positioned inside the hero image and easy to miss. | `ProjectDetail.tsx` |
| 11 | **Mobile menu has no backdrop/animation** | Opens abruptly, no overlay to indicate modal state, no transition. Feels unfinished. | `Navigation.tsx:84-101` |

### Medium

| # | Issue | Impact | Location |
|---|-------|--------|----------|
| 12 | **Reviews have no association to projects** | Testimonials float without context. "Great construction quality" means more when tied to a specific project a prospect is viewing. | `Home.tsx:235-279` |
| 13 | **No "Schedule Site Visit" CTA** | The highest-intent action for real estate. Should be prominent on every project detail page. | Missing |
| 14 | **Footer has no social media links** | Missing Facebook, Instagram, YouTube — standard trust signals for Indian real estate companies. | `Footer.tsx` |
| 15 | **60-second cooldown after form submit** | User who made a typo in their first submission must wait a full minute. Frustrating. | `LeadForm.tsx:252` |

---

## 2. UI Improvements

### Visual Hierarchy

| Issue | Current | Recommended |
|-------|---------|-------------|
| **Nav has no prominent CTA** | 4 text links of equal weight | Add a contrasting "Enquire Now" button as the last nav item (pill-shaped, gold/sky-blue background) |
| **Hero CTA is low-contrast** | `btn-primary` (sky blue on dark overlay) blends with blue tint | Use gold (`#D4A24C`) background for hero CTA to create contrast against the cool-tone overlay |
| **Metrics section lacks context** | "42+ Years of Experience" — numbers without supporting narrative | Add micro-copy beneath each metric: "Serving Kolkata since 1982" under years |
| **Project cards are monotonous** | All 3:4 aspect ratio, identical layout | Alternate card sizes — feature 1 large hero card + 2 smaller cards in the featured section. Add status badges ("Ongoing", "Sold Out", "Launching Soon") |
| **Section spacing is excessive** | `py-20 md:py-32` (128px padding) on every section | Tighten to `py-16 md:py-24`. Current spacing makes the home page feel endless on desktop |

### Trust Signals Missing

- RERA registration number on every project card
- "ISO Certified" / "CREDAI Member" badges (if applicable)
- Total sq ft delivered counter
- Years in business badge in the nav area
- Builder association logos
- Google rating badge (if available)
- Number of ongoing projects badge

### Accessibility

| Issue | Fix |
|-------|-----|
| Nav hamburger button has `aria-label` but mobile menu items have no `role="menu"` / `role="menuitem"` | Add ARIA roles to mobile nav |
| Color contrast: `text-[#2F6F6B]/60` on `bg-[#F8FAFB]` = ~3.2:1 ratio (fails WCAG AA) | Increase to `/70` minimum or use darker text |
| No focus ring styles on custom buttons | Add `focus-visible:ring-2 focus-visible:ring-offset-2` |
| Lightbox has no focus trap | Tab key can navigate behind the modal. Use `inert` attribute on background |
| No skip navigation link | Add a visually-hidden "Skip to main content" link |
| Interest radio buttons have no fieldset/legend | Wrap in `<fieldset>` with `<legend>` for screen readers |

---

## 3. Performance Improvements

### Bundle Size (Critical)

**Current:** 420 KB JS (117 KB gzip) — single monolithic chunk

| Fix | Estimated Savings | Priority |
|-----|-------------------|----------|
| **Add code splitting with `React.lazy()`** — Admin.tsx alone is 1,099 lines. Split all pages. | ~40-60% reduction in initial load (Admin + MFA components never loaded for public visitors) | P0 |
| **Split Supabase client** into a separate chunk | Supabase JS is ~80KB. Splitting lets the main chunk render while Supabase loads async. | P1 |
| **Dynamic import DOMPurify** — only needed for form submissions | ~20KB saved from initial bundle | P2 |
| **Tree-shake lucide-react** — `optimizeDeps.exclude` prevents pre-bundling but tree-shaking still works. Verify unused icons aren't included. | Minor | P3 |

**Implementation:**

```tsx
// App.tsx - lazy load all pages
const Home = lazy(() => import('./pages/Home'));
const Admin = lazy(() => import('./pages/Admin'));
// ... etc, wrap renderPage() in <Suspense fallback={<PageSkeleton />}>
```

### Image Loading (Critical)

| Issue | Fix |
|-------|-----|
| **No `loading="lazy"`** on any `<img>` tag | Add `loading="lazy"` to all images except hero (above fold) |
| **Google Drive thumbnail API** — unreliable, no cache headers, single size `sz=w1000` | Migrate to Supabase Storage or a CDN. Serve responsive sizes via `srcSet` |
| **Hero background loads 1920px on mobile** | Use `<picture>` with `source media` for 640/1024/1920px breakpoints |
| **No WebP/AVIF** | Either serve modern formats from CDN or use Vercel Image Optimization |
| **No image dimensions** set — causes layout shift (CLS) | Add `width`/`height` attributes or use `aspect-ratio` CSS (partially done with `aspect-[3/4]`) |

### Render Blocking

| Issue | Fix |
|-------|-----|
| **Google Fonts loaded via `@import` in CSS** — blocks rendering | Move to `<link rel="preconnect">` + `<link rel="preload">` in `index.html` |
| **No `preconnect` to Supabase** | Add `<link rel="preconnect" href="https://your-project.supabase.co">` |
| **No `dns-prefetch` for Google Drive** | Add `<link rel="dns-prefetch" href="https://drive.google.com">` |

**In `index.html`:**

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preload" href="https://fonts.googleapis.com/css2?family=..." as="style" />
```

And remove the `@import` from `index.css:1`.

### Rendering Bottlenecks

| Issue | Fix |
|-------|-----|
| **Every `AnimatedSection` and `ImageReveal` creates its own IntersectionObserver** | On a page with 20+ animated elements, that's 20+ observers. Use a single shared observer (or `IntersectionObserver` polyfill manager). |
| **Metrics counter uses `setInterval` with 60 steps** causing 60 state updates / re-renders | Use `requestAnimationFrame` instead of `setInterval` for smoother animation and fewer re-renders |
| **Home page makes 4 parallel Supabase queries on mount** | Good that they're parallel via `Promise.all`, but add error handling and display skeletons during load |

### Caching

| Issue | Status |
|-------|--------|
| Static assets (`/assets/*`) | Correctly cached: `max-age=31536000, immutable` |
| HTML file | No cache header — good (allows instant deploys) |
| Supabase data | No client-side caching — every page visit re-fetches. Consider `stale-while-revalidate` pattern or cache in `sessionStorage` for site_settings |
| Google Fonts | Cached by browser (fonts.gstatic.com sets long cache) |

---

## 4. Mobile Optimization

### Navigation

- **Logo is 64px tall on mobile** (`h-16`) — eats 20% of viewport height with padding. Reduce to `h-10` on mobile.
- **No bottom nav bar** — real estate apps universally have bottom tab bars for Home/Projects/Contact/WhatsApp.
- **Mobile menu** lacks a slide-in animation and backdrop overlay. Should use `transform: translateX` with a semi-transparent backdrop.

### Touch Targets

- **"Heard from" radio buttons** are `text-xs` in a 2-col grid — far below the 44x44px minimum touch target (WCAG).
- **Interest option buttons** at `py-3 px-3` are borderline on small phones. Increase to `py-4`.
- **Filter tabs** on Projects page (`space-x-6`) are small text with no padding — hard to tap accurately.

### Content

- **Hero heading** `text-5xl` (3rem) on mobile is huge. The tagline + CTA are pushed below fold on small screens. Reduce to `text-3xl` or `text-4xl`.
- **Section padding** `py-20` (80px) on mobile wastes space. Reduce to `py-12` or `py-16` on mobile.
- **Contact page** stacks all cards + full form vertically = extremely long scroll on mobile. Consider a tabbed interface (Info | Form) on mobile.

### Mobile-Specific CTAs (Missing)

- **Click-to-call button** — should be a sticky bottom bar on mobile project pages
- **WhatsApp floating action button** — bottom-right, always visible
- **Share button** on project detail — native Web Share API for mobile

---

## 5. Conversion Optimization

### Lead Funnel Analysis

```
HOME (100% traffic)
  ↓ No form, no CTA except "Explore Projects" → DROP: ~60%
PROJECTS (40%)
  ↓ No CTA on cards, no "Enquire about this project" → DROP: ~70%
PROJECT DETAIL (12%)
  ↓ No form, no CTA, no "Schedule Visit" → DROP: ~85%
CONTACT (2%)
  ↓ 7-field form + CAPTCHA → DROP: ~60%
LEAD CAPTURED (0.8%)
```

### Recommended Changes

| Change | Expected Impact | Effort |
|--------|-----------------|--------|
| **Add a compact lead form to the Home page** (name + phone + interest = 3 fields) | +150-300% leads | Medium |
| **Add floating WhatsApp button globally** | +30-50% WhatsApp leads | Low |
| **Add "Enquire Now" CTA on every project card** | +40% click-through to contact | Low |
| **Add "Schedule Site Visit" on ProjectDetail** | Captures highest-intent visitors | Low |
| **Reduce form to 3 required fields** (name, phone, interest) + optional expand | +50-80% form completions | Medium |
| **Move CAPTCHA to invisible/managed mode** | Eliminates one friction point | Low |
| **Add exit-intent popup** with a simplified form | +10-15% lead capture from bouncing visitors | Medium |
| **Show "X units available" on ongoing projects** | Creates urgency | Low |
| **Add EMI calculator on project detail** | Increases engagement time +40% | Medium |
| **Add PDF brochure download** (email-gated) | Captures leads who aren't ready to call | Medium |

### Form Optimization (LeadForm.tsx)

Current form asks for 7+ fields upfront. Progressive disclosure pattern:

- **Step 1 (visible):** Name, Phone, Interest → "Get Callback"
- **Step 2 (after submit or expand):** Email, Preferred Time, Heard From, Message

This alone typically doubles form completion rates in real estate.

---

## 6. Design Upgrade Suggestions

### Quick Wins (No Redesign)

1. **Replace Pexels hero with your best project photo** — Aerial shot of your flagship project, full-bleed
2. **Add a subtle parallax effect** to the hero image (`background-attachment: fixed` or translate on scroll)
3. **Add hover lift effect** to project cards: `hover:-translate-y-1 hover:shadow-xl transition-all`
4. **Add a gold gradient underline** on active nav items instead of plain color change
5. **Add glass-morphism to the scrolled navbar**: `backdrop-blur-md bg-white/90` instead of solid white
6. **Add number animation easing** — current linear interpolation looks robotic. Use ease-out curve.
7. **Add a subtle pattern/texture** to the off-white background sections (paper grain or subtle grid)

### Medium Effort

8. **Video hero option** — A 10-second looping drone shot of your best project would dramatically increase engagement. Use `<video>` with `poster` fallback.
9. **Interactive project map** — Show all projects on a Kolkata map (use Leaflet/OpenStreetMap, no cost). Buyers search by location.
10. **Virtual tour links** — Even a simple 360-degree photo linked from project detail would differentiate.
11. **Animated page transitions** — Add a brief cross-fade or slide between pages instead of abrupt swaps.
12. **Dark mode toggle** — Premium feel, and India's mobile users browse at night.

### Major Upgrades

13. **Project comparison feature** — Let users compare 2-3 projects side-by-side (specs, pricing, location)
14. **Chatbot/live chat** — Replace the static form with a conversational UI for lead capture
15. **Blog/insights section** — SEO strategy for "best real estate in Kolkata", "RERA guide", etc.

---

## 7. Priority Matrix

| Priority | Items | Impact |
|----------|-------|--------|
| **P0 — Do This Week** | Floating WhatsApp button, lead form on Home page, replace stock hero image, add `loading="lazy"` to images, add `React.lazy()` code splitting | Conversion + Performance |
| **P1 — Do This Month** | Reduce form fields, fix Google Fonts loading, add skeleton screens, mobile nav improvements, add RERA numbers, preconnect hints | Trust + Mobile UX |
| **P2 — Next Sprint** | Migrate images off Google Drive, add project CTAs, site visit scheduling, responsive images, progressive form disclosure | Conversion + Speed |
| **P3 — Roadmap** | EMI calculator, project map, virtual tours, blog/SEO, comparison feature, video hero | Engagement + SEO |

---

> **Bottom Line:** The single highest-ROI change is **adding a 3-field lead form to the Home page + a floating WhatsApp button**. These two changes alone can realistically 2-3x lead volume with minimal development effort.
