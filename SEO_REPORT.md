# Navitag — Comprehensive SEO Report

**Date:** 2026-04-28
**Scope:** `www-v3` (Nuxt 3 marketing + ecommerce site at navitag.com, including `/ph/` regional variant)
**Backend:** Medusa (`shopapi.navitag.com`)
**Audit method:** Static analysis of `nuxt.config.ts`, `public/robots.txt`, all `app/pages/**`, layouts, and SEO-relevant components.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current SEO Message](#2-current-seo-message)
3. [Priority Fixes (Top 10)](#3-priority-fixes-top-10)
4. [Site-Wide Configuration](#4-site-wide-configuration)
5. [Per-Page Meta Inventory](#5-per-page-meta-inventory)
6. [Structured Data (JSON-LD)](#6-structured-data-json-ld)
7. [Content & Heading Structure](#7-content--heading-structure)
8. [Performance Signals](#8-performance-signals)
9. [Internal Linking & Crawlability](#9-internal-linking--crawlability)
10. [Robots & Indexing Hygiene](#10-robots--indexing-hygiene)
11. [Regional / hreflang Strategy](#11-regional--hreflang-strategy)
12. [What's Working](#12-whats-working)
13. [Recommended Execution Order](#13-recommended-execution-order)
14. [Meta Pixel — Recommended Events on CTAs](#14-meta-pixel--recommended-events-on-ctas)
15. [Appendix: Severity Legend](#15-appendix-severity-legend)

---

## 1. Executive Summary

The site has a **clear, consistent brand hook** ("Never Lose What Matters" + "No SIM. No contracts. No borders. 100+ countries") on its marketing surface, and proper indexing hygiene on auth/checkout flows. The biggest gaps are on the **commercial surfaces** (product pages, checkout) and on **social/structured-data signals** (no `og:image`, no JSON-LD anywhere, no `hreflang` linking global ↔ PH).

**Critical issues, ranked:**

1. Missing `og:image` site-wide — social previews are bare.
2. No Twitter Card image globally (`twitter:card` set to `summary` in defaults).
3. `/distribution` and `/shop` use client-side `navigateTo(..., { redirectCode: 302 })` — should be server-side **301**s via `routeRules`. 302 tells Google "temporary" and does not consolidate signals. (`/ph/distribution` is a real page, not a redirect.)
4. Product pages (`/shop/product/[slug]`) ship with title + description but **no `og:image`, no canonical, and no `Product` JSON-LD**. Biggest commercial-SEO miss.
5. No structured data anywhere on the site (no `Organization`, `Product`, `Article`, `BreadcrumbList`).
6. No `hreflang` between global and `/ph/` variants. They may compete or get consolidated.
7. Several user-specific pages lack `noindex` (`shop/checkout`, `shop/shipping`, `shop/order-complete`, `plan-checkout`, `top-up`).
8. `<html lang>` stays `en` on `/ph/` pages — should be `en-PH`.
9. `privacy-policy.vue` is `noindex` — atypical; trust pages usually rank.

---

## 2. Current SEO Message

This is the actual story Google and social platforms see today.

### Composite message

> "Navitag is a global GPS tracker brand with built-in M2M connectivity that works in 100+ countries with no SIM, no contracts, no borders — sold direct, with tiered data plans (Basic/Pro/Business), a fleet/enterprise tier with on-site installation and 24/7 support, and a Philippines variant fulfilled locally with Globe/Smart connectivity, PHP pricing, and LTFRB-certified hardware."

### Global default fallback (`nuxt.config.ts:60-89`)

> "Navitag provides GPS trackers, wearables, and live dashcams with global M2M eSIM connectivity, working in over 100 countries from Day One."

⚠️ This default mentions **wearables and dashcams**, but there are no real pages selling those. Either remove the mention or build the pages.

### Homepage hook (`pages/index.vue`)

| Field | Value |
|---|---|
| Title | `Navitag — Never Lose What Matters` |
| Description | `Global GPS trackers with built-in M2M connectivity. No SIM card. No contracts. No borders. Works in 100+ countries out of the box.` |
| OG | Title, description, URL set; **no `og:image`** |

### Regional homepage (`pages/ph/index.vue`)

| Field | Value |
|---|---|
| Title | `Navitag Philippines — Never Lose What Matters` |
| Description | `Global GPS trackers with built-in M2M connectivity, fulfilled locally from Metro Manila. Runs on Globe and Smart's 4G LTE / 5G networks. No SIM card. No contracts.` |

### Pillar pages

| Page | Title | Hook |
|---|---|---|
| `business.vue` | Navitag Business — Fleet Tracking & Enterprise Plans | Volume pricing, on-site install, 24/7 support, 24-mo warranty, daily reports. Audience: 1–1,000+ devices |
| `ph/business.vue` | Navitag Business Philippines — Fleet Tracking & Enterprise Plans | + PHP pricing, Metro Manila & Cebu install, **LTFRB-certified hardware** |
| `data-plans.vue` | Data Plans — Navitag | Simple global plans. Basic, Pro, Business tiers. 100+ countries |
| `ph/data-plans.vue` | Data Plans — Navitag Philippines | Same tiers, priced in local currency |
| `ph/distribution.vue` | Where to Buy — Navitag Philippines | Shopee, Lazada, direct store, authorized installers in Metro Manila & Cebu |
| `contact.vue` / `ph/contact.vue` | Contact Us — Navitag (Philippines) | "We reply within one business day" |

### Pages with title-only meta (no description, no OG image)

- `shop/product/[slug].vue` — **biggest commercial-SEO miss**
- `shop/shipping.vue`, `shop/checkout/[cart_id].vue`, `shop/order-complete/[order_id].vue`
- `top-up/[imei].vue`, `plan-checkout/[cart_id].vue`
- `renew-complete/[order_id].vue` (`noindex` ✓ but title only)

### Hidden from search (`noindex, nofollow`)

`login`, `signup`, `forgot-password`, `my-account`, `privacy-policy`, `test-products`, `links`, `invite/view/[token]`, `renew-complete/[order_id]`.

### Tone

Concise, benefit-led, lightly engineering-flavored ("M2M eSIM", "LTFRB-certified"). The **"No SIM. No contracts. No borders."** cadence is the single strongest, most repeatable hook.

### What's strong

- Consistent `Never Lose What Matters` tagline anchored on regional homepages.
- Clear three-layer pitch: **product → connectivity → fleet**.
- PH variant has genuine local-search differentiators (LTFRB, Globe/Smart, Shopee/Lazada, Metro Manila/Cebu).

### What's diluted or missing

- Product pages carry no SEO weight beyond product title.
- Wearables & dashcams are referenced only in fallback copy, not real pages.
- Homepage social previews are bare (no `og:image`).
- No `hreflang` linking the regional variants.
- No structured data anywhere.

---

## 3. Priority Fixes (Top 10)

| # | Issue | Where | Severity | Effort |
|---|---|---|---|---|
| 1 | Add `og:image` + `twitter:card=summary_large_image` defaults | `nuxt.config.ts` `app.head` | 🔴 High | Low |
| 2 | Convert `/distribution` and `/shop` from client-side `navigateTo(302)` to server-side 301 `routeRules` | `nuxt.config.ts` | 🔴 High | Low |
| 3 | Add `Product` + `Offer` + `BreadcrumbList` JSON-LD on product pages | `shop/product/[slug].vue` | 🔴 High | Medium |
| 4 | Add `og:image` + canonical on product pages (description already present) | `shop/product/[slug].vue` | 🔴 High | Low |
| 5 | Add `robots: 'noindex, nofollow'` to checkout/top-up/plan-checkout pages | 5 pages (see §10.3) | 🟡 Medium | Low |
| 6 | Implement `hreflang` between global ↔ `/ph/` variants | layouts or per-page | 🟡 Medium | Medium |
| 7 | Set `<html lang>` to `en-PH` on `/ph/` routes | `app/layouts/ph.vue` | 🟡 Medium | Low |
| 8 | Add canonical URLs on all indexable pages | All marketing pages | 🟡 Medium | Low |
| 9 | Add global `Organization` JSON-LD | `app.vue` | 🟡 Medium | Low |

---

## 4. Site-Wide Configuration

### 4.1 `nuxt.config.ts` global head

**Current state (`nuxt.config.ts:60-89`):**

```ts
app: {
  head: {
    htmlAttrs: { lang: 'en' },
    meta: [
      { name: 'description', content: 'Navitag provides GPS trackers, wearables, and live dashcams ...' },
      { property: 'og:site_name', content: 'Navitag' },
      { property: 'og:type', content: 'website' },
      { property: 'og:locale', content: 'en_US' },
      { name: 'twitter:card', content: 'summary' },
    ],
    link: [
      { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css' },
      { rel: 'icon', type: 'image/png', href: '/logo-sm.png' },
    ],
    noscript: [/* Facebook pixel <noscript> fallback */],
  },
}
```

**Issues:**

| Sev | Issue | Fix |
|---|---|---|
| 🔴 | No default `og:image` | Add `{ property: 'og:image', content: 'https://www.navitag.com/og-default-1200x630.jpg' }` |
| 🔴 | `twitter:card` is `summary`, not `summary_large_image`; no `twitter:image` | Change to `summary_large_image` and add `twitter:image` |
| 🟡 | Default description mentions "wearables, and live dashcams" (no pages exist) | Tighten to match shipped products, or build the missing pages |
| 🟢 | Font Awesome CDN render-blocking | Preload + media swap, or self-host the icons actually used |
| ℹ️ | `og:locale: en_US` is fine globally; PH layout should override |

### 4.2 Modules

**Installed:** `@nuxtjs/tailwindcss`, `@nuxtjs/google-fonts`, `@pinia/nuxt`, `@nuxtjs/sitemap`, `@nuxt/image`.

**Missing for SEO maturity:**

- `nuxt-schema-org` — declarative structured-data helpers (high value).
- `@nuxtjs/robots` — programmatic robots.txt generation (medium).
- `@nuxtjs/seo` — meta umbrella module (optional).

### 4.3 Site config

```ts
site: { url: 'https://navitag.com', name: 'Navitag' }
```

⚠️ Note `https://navitag.com` (apex) vs `https://www.navitag.com` used in per-page `ogUrl`. **Pick one canonical host** and align to avoid mixed signals.

### 4.4 Fonts

`Funnel Sans` loaded via `@nuxtjs/google-fonts` without `display: 'swap'`. Causes FOIT and worsens LCP.

```ts
googleFonts: {
  families: { 'Funnel Sans': [300, 400, 500, 600, 700, 800] },
  display: 'swap', // <- add
}
```

### 4.5 Image optimization

`@nuxt/image` configured with `webp`/`avif` and quality 80. ✓ Reasonable. Consider explicit `screens` and `densities` for predictable `srcset` output.

### 4.6 Sitemap

```ts
sitemap: {
  exclude: ['/my-account', '/test-products', '/links', '/shop',
            '/login', '/signup', '/plan-checkout/**',
            '/renew-complete/**', '/top-up/**'],
  sources: ['/api/__sitemap__/articles'],
}
```

✓ Articles dynamically sourced — good. ⚠️ `/shop` excluded but `/shop/product/**` is the real commercial surface — confirm those are present in the sitemap (they should be auto-discovered, but verify after deploy).

---

## 5. Per-Page Meta Inventory

### 5.1 Indexable pages — meta state

| Page | Title | Description | OG Image | Canonical | Notes |
|---|---|---|---|---|---|
| `index.vue` | ✓ | ✓ | ❌ | ❌ | Has `ogUrl` |
| `ph/index.vue` | ✓ | ✓ | ❌ | ❌ | Has `ogUrl`; no `lang="en-PH"` |
| `business.vue` | ✓ | ✓ | ❌ | ❌ | No OG block |
| `ph/business.vue` | ✓ | ✓ | ❌ | ❌ | Has `ogUrl` |
| `data-plans.vue` | ✓ | ✓ | ❌ | ❌ | No OG block |
| `ph/data-plans.vue` | ✓ | ✓ | ❌ | ❌ | No OG block |
| `contact.vue` | ✓ | ✓ | ❌ | ❌ | No OG block |
| `ph/contact.vue` | ✓ | ✓ | ❌ | ❌ | No OG block |
| `ph/distribution.vue` | ✓ | ✓ | ❌ | ❌ | Has `ogUrl` |
| `shop/product/[slug].vue` | ✓ (computed from `medusaProduct.title`) | ✓ (computed from `medusaProduct.description`) | ❌ | ❌ | **No `Product` schema, no canonical, no `og:image`** |
| `articles/[...slug].vue` | ✓ (CMS) | ✓ (CMS) | ✓ (CMS) | ❌ | `robots` driven by CMS `noindex` flag |

### 5.2 `noindex` pages (correctly hidden)

| Page | Mechanism |
|---|---|
| `login.vue` | `useSeoMeta({ robots: 'noindex, nofollow' })` |
| `signup.vue` | `useSeoMeta({ robots: 'noindex, nofollow' })` |
| `forgot-password.vue` | `useSeoMeta({ robots: 'noindex, nofollow' })` |
| `my-account.vue` | `useHead({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] })` |
| `privacy-policy.vue` | ⚠️ `noindex` — atypical; reconsider |
| `test-products.vue` | `useSeoMeta({ robots: 'noindex, nofollow' })` |
| `links.vue` | `useHead` with `noindex` (external redirect to `track.navitag.com/signup`) |
| `invite/view/[token].vue` | `useHead` with `noindex` |
| `renew-complete/[order_id].vue` | `useHead` with `noindex` |

### 5.3 Pages MISSING `noindex` (should add)

| Page | Title only | Risk |
|---|---|---|
| `shop/checkout/[cart_id].vue` | `useHead({ title: 'Navitag Shop — Checkout' })` | Cart-specific URL may be indexed |
| `shop/shipping.vue` | `useSeoMeta({ title: 'Shipping — Navitag Shop' })` | Form page |
| `shop/order-complete/[order_id].vue` | `useHead({ title: 'Navitag Shop — Order Confirmed' })` | Order-specific URL |
| `plan-checkout/[cart_id].vue` | `useHead({ title: 'Navitag - Plan Checkout' })` | Cart-specific URL |
| `top-up/[imei].vue` | `useHead({ title: 'Navitag - Top-Up | <imei>' })` | IMEI-specific URL |

These are excluded from sitemap, but a leaked URL (email link, share, error) could still be crawled.

---

## 6. Structured Data (JSON-LD)

**Current state: zero JSON-LD anywhere on the site.**

### 6.1 Recommended additions

| Schema | Where | Sev | Why |
|---|---|---|---|
| `Organization` | `app.vue` (global) | 🟡 | Brand entity, logo, social profiles, contact point |
| `Product` + `Offer` | `shop/product/[slug].vue` | 🔴 | Rich snippets (price, availability, ratings) in SERPs |
| `BreadcrumbList` | Product, shipping, checkout pages with breadcrumb UI | 🟡 | Breadcrumb in SERP |
| `Article` / `NewsArticle` | `articles/[...slug].vue` | 🟡 | Eligibility for Google News, authorship |
| `LocalBusiness` | `business.vue` (PH variant) | 🟢 | Maps/local search; tie to "Navitag Technology Systems OPC, Makati" |
| `FAQPage` | If FAQ content is added | 🟢 | Expanded SERP real estate |

### 6.2 Suggested approach

Install `nuxt-schema-org`:

```bash
npm i -D nuxt-schema-org
```

Then declarative usage:

```ts
useSchemaOrg([
  defineProduct({
    name: medusaProduct.value.title,
    image: medusaProduct.value.thumbnail,
    description: medusaProduct.value.description,
    sku: medusaProduct.value.id,
    offers: {
      price: variant.prices[0].amount / 100,
      priceCurrency: variant.prices[0].currency_code,
      availability: 'InStock',
    },
  }),
  defineBreadcrumb({
    itemListElement: [
      { name: 'Home', item: '/' },
      { name: 'Shop', item: '/shop' },
      { name: medusaProduct.value.title },
    ],
  }),
])
```

---

## 7. Content & Heading Structure

### 7.1 H1 audit

H1s are buried inside `Home*` components rather than declared on pages. Verify each indexable page has **exactly one H1** and that it's unique site-wide. Spot checks needed:

- `index.vue` → H1 in `HomeBannerCarousel` / `HomeCover`
- `ph/index.vue` → same components
- `business.vue` / `ph/business.vue` → page-level h1
- `data-plans.vue` / `ph/data-plans.vue` → `DataPlansView` component
- `shop/product/[slug].vue` → product title

### 7.2 Image alt audit

Not systematically validated. Recommended:

- Add ESLint rule `vuejs-accessibility/alt-text` (or `vue/require-image-alt`).
- For dynamic product images, ensure `alt` is bound to product title.
- Decorative images should use `alt=""` (empty), not omit the attribute.

---

## 8. Performance Signals

| Sev | Issue | Where |
|---|---|---|
| 🟢 | Google Fonts: no `display: 'swap'` | `nuxt.config.ts:54-58` |
| 🟢 | Font Awesome 6.0.0 CSS render-blocking from cdnjs | `nuxt.config.ts:73-76` |
| 🟢 | Facebook Pixel `<noscript>` only — verify the JS pixel loads asynchronously | `nuxt.config.ts:83-88` |
| ℹ️ | LCP candidate audit not performed; recommend running Lighthouse on home + product page | — |
| ℹ️ | Verify `<NuxtImg>` is used on hero/above-the-fold imagery with `format="webp,avif"` and `loading="eager"` | Components |

---

## 9. Internal Linking & Crawlability

### 9.1 Client-side redirects (high impact)

Both currently use `navigateTo(target, { redirectCode: 302 })` inside `<script setup>`. Two problems: (a) `302` is "temporary" — Google does not consolidate signals to the destination; (b) `navigateTo` in `<script setup>` runs during SSR for the initial request but client-side for in-app nav, so behavior is inconsistent. `routeRules` redirects happen at the Nitro layer for *all* requests with the chosen status code.

| File | Current | Fix |
|---|---|---|
| `pages/distribution.vue` | `navigateTo('/shop', { redirectCode: 302 })` | `routeRules: { '/distribution': { redirect: { to: '/shop/product/track-1', statusCode: 301 } } }` and delete the page |
| `pages/shop/index.vue` | `navigateTo('/shop/product/track-1', { redirectCode: 302 })` | `routeRules: { '/shop': { redirect: { to: '/shop/product/track-1', statusCode: 301 } } }` and delete the page |

ℹ️ `pages/ph/distribution.vue` is a **real "Where to Buy" page** for the PH region (Shopee, Lazada, authorized installers). Do not redirect it.

Server-side 301s consolidate ranking signals to the destination; client-side `navigateTo` (especially with 302) does not.

### 9.2 NuxtLink hygiene

The codebase uses `<NuxtLink>` consistently for internal nav (verified in header, footer, home components, product/shipping/checkout flows). One decorative `<a href="#coverage">` in `HomeBannerCarousel.vue:105` is fine — it's an in-page anchor.

### 9.3 Trailing slashes

Nuxt 3 default: no trailing slash. No inconsistency observed. Confirm `nitro.routeRules` doesn't redirect inconsistently.

---

## 10. Robots & Indexing Hygiene

### 10.1 `public/robots.txt` (current state)

```
User-Agent: *
Disallow: /login
Disallow: /signup
Disallow: /my-account
Disallow: /test-products
Disallow: /plan-checkout/
Disallow: /renew-complete/
Disallow: /top-up/
Disallow: /links

Sitemap: https://www.navitag.com/sitemap.xml
```

✅ Matches the sitemap excludes; `Disallow: /shop` was previously here but has been removed, so `/shop/product/...` is crawlable. ℹ️ The `Sitemap:` URL uses the `www.` host while `nuxt.config.ts` `site.url` is the apex `https://navitag.com` — pick one canonical host (see §4.3) and align both.

### 10.2 Sitemap config

`nuxt.config.ts` `sitemap.exclude` matches `robots.txt` disallows. ✓ Consistent.

### 10.3 `noindex` gaps (re-stated from §5.3)

Add `robots: 'noindex, nofollow'` to:

- `pages/shop/checkout/[cart_id].vue`
- `pages/shop/shipping.vue`
- `pages/shop/order-complete/[order_id].vue`
- `pages/plan-checkout/[cart_id].vue`
- `pages/top-up/[imei].vue`

### 10.4 Privacy policy oddity

`pages/privacy-policy.vue:2-5` sets `noindex`. Privacy policies typically *should* be indexable for trust signals (E-E-A-T). Recommend changing to `index, follow`.

---

## 11. Regional / hreflang Strategy

### 11.1 Current state

- Two locale variants: global (`/`) and Philippines (`/ph/`).
- Regional layout exists (`app/layouts/ph.vue`) and `useRegionRoutes` composable maps paths.
- **No `hreflang` links anywhere.**
- `<html lang>` stays `"en"` on `/ph/` pages (regional layout doesn't override).
- No `og:locale` override on PH pages (still `en_US` from global default).

### 11.2 Recommended setup

**1. Layout-level lang override (`app/layouts/ph.vue`):**

```ts
useHead({
  htmlAttrs: { lang: 'en-PH' },
  meta: [{ property: 'og:locale', content: 'en_PH' }],
})
```

**2. Layout-level hreflang (using `useRegionRoutes` to compute siblings):**

```ts
useHead(() => ({
  link: [
    { rel: 'canonical', href: `https://www.navitag.com${route.path}` },
    { rel: 'alternate', hreflang: 'en', href: globalEquivalent(route.path) },
    { rel: 'alternate', hreflang: 'en-PH', href: phEquivalent(route.path) },
    { rel: 'alternate', hreflang: 'x-default', href: globalEquivalent(route.path) },
  ],
}))
```

Apply the equivalent (without lang override) in the global layout.

### 11.3 Page-pair coverage

| Global page | PH counterpart |
|---|---|
| `/` | `/ph` |
| `/business` | `/ph/business` |
| `/data-plans` | `/ph/data-plans` |
| `/contact` | `/ph/contact` |
| `/distribution` (redirect) | `/ph/distribution` |

---

## 12. What's Working

- ✅ Strong, repeated brand hook ("Never Lose What Matters" + "No SIM. No contracts. No borders.").
- ✅ All marketing pages have unique titles and descriptions.
- ✅ Auth and account pages correctly `noindex`.
- ✅ Sitemap dynamically sources articles from `/api/__sitemap__/articles`.
- ✅ Sitemap excludes match robots.txt disallows.
- ✅ `@nuxt/image` configured with modern formats (webp, avif).
- ✅ Articles page uses computed `useSeoMeta` from CMS fields (incl. `ogImage`).
- ✅ Regional differentiation: PH variant carries genuine local-search differentiators (LTFRB, Globe/Smart, Shopee/Lazada, PHP pricing).
- ✅ Internal navigation uses `<NuxtLink>` consistently.
- ✅ Facebook Pixel `<noscript>` fallback present.

---

## 13. Recommended Execution Order

### Phase 1 — Quick wins (1–2 hours)

1. Add `og:image` + `twitter:card=summary_large_image` + `twitter:image` defaults to `nuxt.config.ts` `app.head.meta` (needs OG image asset at `public/og-default-1200x630.jpg`).
2. Tighten the global default description — drop "wearables, and live dashcams" since no such pages exist.
3. Add `display: 'swap'` to Google Fonts config.
4. Reconcile `site.url` (`https://navitag.com` in `nuxt.config.ts` vs `https://www.navitag.com` in `robots.txt` Sitemap and per-page `ogUrl`) — pick one canonical host.
5. Reconsider `noindex` on `privacy-policy.vue` — should be `index, follow` for trust/E-E-A-T.

### Phase 2 — Indexing hygiene (1 hour)

6. Add `robots: 'noindex, nofollow'` to the 5 user-specific pages in §10.3.
7. Convert `/distribution`, `/ph/distribution`, `/shop` redirects to `routeRules` 301s.

### Phase 3 — Regional & canonical (2–3 hours)

8. Layout-level `htmlAttrs.lang = 'en-PH'` and `og:locale = 'en_PH'` in `app/layouts/ph.vue`.
9. Add `hreflang` + `canonical` links via global + regional layouts using `useRegionRoutes`.
10. Add canonical URLs to all indexable marketing pages.

### Phase 4 — Commercial SEO (4–6 hours)

11. Enrich product page meta: `description`, `ogImage` (from product thumbnail), `canonical`.
12. Install `nuxt-schema-org`; add `Product` + `Offer` + `BreadcrumbList` JSON-LD.
13. Add `Organization` JSON-LD to `app.vue`.
14. Add `Article`/`NewsArticle` JSON-LD to `articles/[...slug].vue`.

### Phase 5 — Performance polish (1–2 hours)

15. Self-host or async-load Font Awesome.
16. Audit LCP candidates with Lighthouse, ensure hero images use `<NuxtImg>` with `loading="eager"` and `fetchpriority="high"`.
17. Audit image `alt` attributes; add ESLint rule.

### Phase 6 — Content alignment (judgment call)

18. Decide on the "wearables and dashcams" mention in the global default description: either remove it or build the missing pages.
19. Consider building a `/shop` listing page (instead of redirect) once the catalog grows beyond Track-1.

---

## 14. Meta Pixel — Recommended Events on CTAs

The site already loads the Facebook Pixel `<noscript>` fallback (`fbq id=1478826687226054`) via `nuxt.config.ts:83-88`. The full client-side pixel boot needs to be wired (it's not in the codebase yet — only the noscript fallback is present). This section maps the current CTA inventory to **Meta Standard Events** (preferred — they map to optimizations and lookalikes out of the box) and **Custom Events** (where no standard event fits). It also lists the **Conversions API (CAPI)** server-side counterparts for redundancy and iOS 17+ resilience.

### 14.1 Pixel boot — recommended pattern

Create `app/plugins/meta-pixel.client.ts`:

```ts
declare global { interface Window { fbq: any; _fbq: any } }

export default defineNuxtPlugin(() => {
  if (import.meta.server) return
  if (window.fbq) return

  ;(function(f: any, b, e, v, n?: any, t?: any, s?: any) {
    if (f.fbq) return
    n = f.fbq = function() { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }
    if (!f._fbq) f._fbq = n
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = []
    t = b.createElement(e); t.async = true; t.src = v
    s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s)
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')

  window.fbq('init', '1478826687226054')
  window.fbq('track', 'PageView')

  // Auto-track SPA route changes
  const router = useRouter()
  router.afterEach(() => window.fbq('track', 'PageView'))
})
```

Then expose a tiny helper composable `app/composables/useMetaPixel.ts`:

```ts
export function useMetaPixel() {
  function track(event: string, params?: Record<string, any>) {
    if (import.meta.server) return
    if (typeof window === 'undefined' || !window.fbq) return
    window.fbq('track', event, params)
  }
  function trackCustom(event: string, params?: Record<string, any>) {
    if (import.meta.server) return
    if (typeof window === 'undefined' || !window.fbq) return
    window.fbq('trackCustom', event, params)
  }
  return { track, trackCustom }
}
```

### 14.2 CTA → Meta event mapping

#### Homepage / marketing surfaces

| CTA | File:line | Event | Type | Params |
|---|---|---|---|---|
| "Shop Now" hero (slide 0) | `home/HomeBannerCarousel.vue:266` | `ViewContent` (on slide impression) + custom click | Standard + Custom | `{ content_category: 'home_banner', content_name: 'shop_now_hero' }` |
| "Data Plans" hero (slide 0) | `home/HomeBannerCarousel.vue:273` | `Custom: ClickHeroCTA` | Custom | `{ slot: 'hero_data_plans' }` |
| "Learn More" plans (slide 2) | `home/HomeBannerCarousel.vue:199` | `Custom: ClickHeroCTA` | Custom | `{ slot: 'hero_plans_learn_more' }` |
| "Explore Business" (slide 4) | `home/HomeBannerCarousel.vue:167` | `Custom: ClickHeroCTA` | Custom | `{ slot: 'hero_business' }` |
| "See Coverage" (slide 3) | `home/HomeBannerCarousel.vue:105` | `Custom: ClickHeroCTA` | Custom | `{ slot: 'hero_coverage' }` |
| "Shop Navitag" cover CTA | `home/HomeCover.vue:73` | `Custom: ClickShopCTA` | Custom | `{ source: 'home_cover' }` |
| "View Data Plans" cover CTA | `home/HomeCover.vue:80` | `Custom: ClickPlansCTA` | Custom | `{ source: 'home_cover' }` |
| Country search (coverage map) | `home/HomeCoverage.vue:325-336` | `Search` | Standard | `{ search_string: query }` (debounced; only on `selectCountry`) |
| Country select | `home/HomeCoverage.vue:362` | `Custom: CoverageCheck` | Custom | `{ country_code, country_name }` |
| "Talk to Navitag Business" | `DataPlansView.vue:676` | `Custom: ClickBusinessContact` | Custom | `{ source: 'data_plans' }` |
| Plan term toggle (1mo/12mo) | `DataPlansView.vue:277` | `Custom: SelectPlanTerm` | Custom | `{ months: t.months }` |
| Tier CTA ("Get started", etc.) | `DataPlansView.vue:424` | `Lead` *(if → /contact)* OR `Custom: SelectPlanTier` | Standard / Custom | `{ tier: tier.key, term: selectedTerm }` |
| Business page tier CTAs | `business.vue:328` | `Lead` (intent to contact) | Standard | `{ content_category: 'fleet', tier_size: tier.range }` |
| "Talk to our team" | `business.vue:149` | `Lead` | Standard | `{ source: 'business_top_cta' }` |
| Footer/header nav links | Headers/Footers | — | (no event) | Don't track nav clicks; noisy |

#### Auth & account

| CTA | File:line | Event | Type | Params |
|---|---|---|---|---|
| Login submit (email) | `login.vue:163`, `LoginOverlay.vue:167` | `Custom: LoginAttempt` then `Custom: LoginSuccess` | Custom | `{ method: 'email' }` |
| Google sign-in | `login.vue:161`, `LoginOverlay.vue:189` | `Custom: LoginAttempt` then `Custom: LoginSuccess` | Custom | `{ method: 'google' }` |
| Apple sign-in | `login.vue:171`, `LoginOverlay.vue:197` | `Custom: LoginAttempt` then `Custom: LoginSuccess` | Custom | `{ method: 'apple' }` |
| Signup form submit | `signup.vue:241` | `CompleteRegistration` (on success) | Standard | `{ status: true, content_name: 'email_signup', value: 0, currency: 'USD' }` |
| Signup with Google | `signup.vue:263` | `CompleteRegistration` | Standard | `{ method: 'google' }` |
| Signup with Apple | `signup.vue:271` | `CompleteRegistration` | Standard | `{ method: 'apple' }` |
| Forgot password submit | `forgot-password.vue:72` | `Custom: PasswordResetRequested` | Custom | `{}` |

#### Shop / commerce flow

| CTA | File:line | Event | Type | Params |
|---|---|---|---|---|
| Product page view | `shop/product/[slug].vue` (route entry) | `ViewContent` | Standard | `{ content_ids: [product.id], content_type: 'product', content_name: product.title, value: price, currency }` |
| Image gallery interaction | `shop/product/[slug].vue:198/205/217/229` | — | (no event; UI-only) | |
| Quantity ± buttons | `shop/product/[slug].vue:263/271` | — | (no event; UI-only) | |
| **"Buy now" CTA** | `shop/product/[slug].vue:280` | `AddToCart` | Standard | `{ content_ids: [variant.id], content_type: 'product', value: price * qty, currency, num_items: qty }` |
| Shipping form continue | `shop/shipping.vue:623` | `InitiateCheckout` | Standard | `{ content_ids, value: cart.total, currency, num_items: cart.items.length }` |
| Payment init (card fields ready) | `shop/checkout/[cart_id].vue:639` | `AddPaymentInfo` | Standard | `{ value: grandTotal, currency }` |
| **"Pay $X" submit (success)** | `shop/checkout/[cart_id].vue:676` (post-success) | `Purchase` | Standard | `{ content_ids, content_type: 'product', value: order.total, currency, num_items, transaction_id: order.id }` |
| Order-complete page view | `shop/order-complete/[order_id].vue` | (already covered by `Purchase` above; do not double-fire) | — | — |

#### Plan top-up / renewal flow

| CTA | File:line | Event | Type | Params |
|---|---|---|---|---|
| Variant selector (plan/term) | `top-up/[imei].vue:389` | `Custom: SelectPlanVariant` | Custom | `{ plan_id, variant_id, imei: hashed }` |
| **"Top-up Now" / "Change Plan"** | `top-up/[imei].vue:420` | `AddToCart` | Standard | `{ content_ids: [variant.id], content_type: 'data_plan', value: price, currency }` |
| Plan checkout payment init | `plan-checkout/[cart_id].vue:643` | `AddPaymentInfo` | Standard | `{ value, currency }` |
| **Plan checkout pay (success)** | `plan-checkout/[cart_id].vue:684` | `Subscribe` (subscription model) OR `Purchase` (one-shot) | Standard | `{ value, currency, predicted_ltv: value * months_total, subscription_id }` |

#### Contact / lead

| CTA | File:line | Event | Type | Params |
|---|---|---|---|---|
| Contact form submit (success) | `ContactForm.vue:210` | `Lead` + `Contact` | Standard | `{ content_name: subject, content_category: 'contact_form' }` |

#### Invite / sharing

| CTA | File:line | Event | Type | Params |
|---|---|---|---|---|
| Invite "Sign in to accept" | `invite/view/[token].vue:269` | `Custom: InviteLoginPrompt` | Custom | `{ token_hashed }` |
| Invite "Try again" claim | `invite/view/[token].vue:259` | `Custom: InviteClaimRetry` | Custom | `{}` |
| Successful invite claim | (post-`onLoginSuccess`) | `Custom: InviteAccepted` | Custom | `{ device_count }` |

### 14.3 Recommended event taxonomy (custom events)

Stick to a consistent naming convention so Ads Manager stays clean:

| Convention | Examples |
|---|---|
| PascalCase verbs | `ClickHeroCTA`, `SelectPlanTerm`, `CoverageCheck`, `LoginAttempt`, `LoginSuccess`, `PasswordResetRequested`, `SelectPlanVariant`, `InviteAccepted` |
| Always include `source` or `slot` param | `{ source: 'home_cover' }` |
| Hash any PII before sending | IMEI, email, phone — use SHA-256 |

### 14.4 Conversions API (server-side)

Browser pixel events are increasingly blocked (Safari ITP, ad blockers, iOS 17+ Link Tracking Protection). Mirror the **money events** server-side via the Meta Conversions API:

| Browser event | Server (CAPI) | Where to fire |
|---|---|---|
| `Purchase` (shop) | `Purchase` | After Medusa order finalizes — Medusa subscriber/webhook on `order.placed` |
| `Purchase`/`Subscribe` (plan) | `Subscribe` | After backend confirms payment & device top-up activation |
| `Lead` (contact) | `Lead` | In the contact-form server route after email/CRM is delivered |
| `CompleteRegistration` | `CompleteRegistration` | In `useBackendSync` post-Firebase user-create |

**Deduplication:** include the same `event_id` (UUID) in both browser and server payloads so Meta merges them.

```ts
// Example browser side
const eventId = crypto.randomUUID()
window.fbq('track', 'Purchase', { value, currency }, { eventID: eventId })

// Server side (CAPI)
await $fetch('https://graph.facebook.com/v19.0/<PIXEL_ID>/events', {
  method: 'POST',
  body: {
    data: [{
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId, // same id → dedupe
      action_source: 'website',
      event_source_url: orderUrl,
      user_data: { em: sha256(email), client_ip_address: ip, client_user_agent: ua, fbp, fbc },
      custom_data: { value, currency, content_ids, content_type: 'product' },
    }],
    access_token: process.env.META_CAPI_ACCESS_TOKEN,
  },
})
```

**`fbp` / `fbc`:** read the `_fbp` cookie and `_fbc` cookie (or `fbclid` query param on first visit) and forward to CAPI for attribution matching.

### 14.5 Privacy & consent

- Wrap pixel boot in a **consent gate** (Cookie banner). For PH users, Data Privacy Act compliance; for global, GDPR/CCPA where applicable.
- Default to **denied** consent until user opts in; replay queued events after consent grant.
- Hash all user identifiers (email, phone, external_id) with SHA-256 before sending — Meta requires it for Advanced Matching and CAPI `user_data`.
- Document the pixel ID and CAPI access token in env (`NUXT_META_PIXEL_ID`, `NUXT_META_CAPI_TOKEN`) — never hardcode the access token.

### 14.6 Testing & validation

- Use **Meta Pixel Helper** (Chrome extension) on each CTA flow.
- Use **Meta Events Manager → Test Events** with a `test_event_code` while developing.
- Verify deduplication: each money event should show `Browser + Server` in Events Manager once both are wired.

### 14.7 Implementation priority

1. **Boot the pixel + PageView** (replaces noscript-only setup).
2. **Wire `Purchase` (shop + plan)** — highest-value optimization signal.
3. **Wire `AddToCart`, `InitiateCheckout`, `AddPaymentInfo`** — funnel optimization.
4. **Wire `Lead` (contact form) + `CompleteRegistration` (signup)**.
5. **Mirror money events via CAPI** for resilience.
6. **Custom events** for hero/CTA-level click attribution last; they're nice-to-have, not optimization-critical.

---

## 15. Appendix: Severity Legend

- 🔴 **High** — Direct ranking or visibility loss. Ship soon.
- 🟡 **Medium** — Limits ranking ceiling or causes inconsistent signals.
- 🟢 **Low** — Polish; small CWV or trust gains.
- ℹ️ **Info** — Verify, no clear defect found.
- ✅ **Pass** — No action needed.
- ⚠️ **Watch** — Working but worth re-evaluating.

---

*End of report.*
