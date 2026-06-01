# Navitag www-v3

Front-facing website for the Navitag brand. Nuxt 4 + Tailwind + Pinia, with a global brand site, a Philippines regional site, and a Medusa-backed ecommerce storefront at `/shop`.

## Project Status

### Site & Brand
- **Foundation**: Nuxt 4. Brand colors: Blue `#0076F5`, Orange `#F28C38`, Background `#F7F4EF`.
- **Layouts**: `default` (global) + `ph` (regional). `HeaderGlobal` / `HeaderRegional` and matching footers, both driven from `app/config/regions.ts`.
- **Homepage**: 6-section composition — `HomeBannerCarousel` (6-slide visual carousel served from `photos.navitag.net`, wide 1587×446 ≥ md / narrow 852×446 < md, dot-only nav at bottom-center, 6s autoplay, pause-on-hover; aspect-ratio matches each image set so `object-cover` resizes without cropping), `HomeSteps`, `HomeNoSim` (animated radar), `HomeCoverage` / `HomeCoveragePh` (country-level SVG map via `world-atlas` + `topojson-client`; PH variant uses a pre-extracted topology), `HomeGuarantee` (region prop adds LTFRB callout on PH). Old `HomeCover` placeholder retained but no longer referenced.
- **Region Switcher**: `RegionBanner.vue` slides above the header when the visitor's country has a regional equivalent of the current page (`useRegionRoutes().hasEquivalent()`). Dismissible (7-day localStorage).
- **App Boot Loader**: `AppBootLoader.vue` covers the app until country resolution completes (6s failsafe). Wrapped in `<ClientOnly>`.

### Auth & Country
- **Firebase**: Email/password, Google, Apple SSO. Reusable `LoginOverlay`. Apple name capture persists to `localStorage` for sync durability.
- **Backend Sync**: All auth flows call `POST /v1/user/sync` (`api.navitag.net`) in parallel with Medusa token exchange so users land in the unified backend + Traccar on every auth event.
- **Country Source of Truth**: `basicStore.resolveCountry()` resolves in priority: (1) backend-sync `country_code` for authed users, (2) IP geolocation via `utils/ipCountry.ts` (Cloudflare `/cdn-cgi/trace`, `loc` field — free, token-less, CORS-open). Held in Pinia, **not** localStorage, so backend country changes propagate next session.

### Storefront (Medusa)
- **Auth Contract**: `useMedusa.medusaFetch` centralizes Firebase→Medusa JWT exchange (cached token + 401-retry). Cart creation always carries `email` + `metadata.firebase_uid` for `order-placed-backfill`.
- **Region-Aware Pricing**: `utils/countryData.ts` maps country → Medusa region (PH → `reg_01KNY0WCJWP61HN944KFBN8XSX`, default → `reg_01KNN7RSPMSP2FNKEG83ZQ0HQ6`). `cartStore.alignRegion()` PATCHes the cart's `region_id` if it drifts from the visitor's resolved region.
- **Data Plans Pricing**: `DataPlansView.vue` pulls live Medusa `calculated_price` for both `/data-plans` (US/global) and `/ph/data-plans` (PH region). **No static USD fallback** — when Medusa is unavailable or has no price for a tier+term, the card renders "Unavailable · Please try again shortly". Loading state shows skeleton bars. Category handle in Medusa: `track1-data-plan` (no hyphen between "track" and "1").

### Data Plan Top-Up Flow (digital)
- **`/top-up/:imei`**: Awaits Firebase auth restore + IP country (`Promise.all`) before routing — eliminates the prior race where products loaded against the IP fallback region. If unauthenticated → login overlay opens with the IP country passed in explicitly. Cart-create body includes `sales_channel_id: MEDUSA_HIDDEN_SALES_CHANNEL_ID` (the all-scope publishable key is bound to multiple sales channels and Medusa needs the digital-only one disambiguated). Shipping option for digital delivery is `MEDUSA_DIGITAL_DELIVERY_OPTION_ID` (constant in `app/variables.ts`). `buyPlan` keeps `cartLoading=true` through the `await navigateTo()` so the button spinner doesn't flash back to its idle label during the route transition.
- **Resilient Country Detection**: `fetchCountryCode` (Cloudflare trace via `utils/ipCountry.ts`) retries (5s timeout × 3 attempts, 500ms backoff). On total failure, the page shows an inline retry card.
- **`/plan-checkout/:cart_id`**: PayPal Card Fields (`pp_paypal_paypal`). Loads SDK with `currency = cart.currency_code`. Country dropdown is **prefilled from `basicStore.country` and locked** — set from the customer's account region. Same finalizing overlay + hard-failure modal pattern as `/shop/checkout`. Retry capped at 1.
  - **Diagnostics**: `cardFields.submit()` catch dumps every own-property of the PayPal SDK error plus a per-field `isValid/isEmpty/isPotentiallyValid/isFocused` snapshot, since PayPal errors stringify to bare codes (e.g. `"INVALID_NUMBER"`) and hide their `details[]` array. Friendly mappings cover `PAYER_CANNOT_PAY`, `INVALID_NUMBER`, `INVALID_EXPIRY`/`EXPIRED_CARD`, `INVALID_SECURITY_CODE`/`INVALID_CVV`, `CARD_TYPE_NOT_SUPPORTED` so customers see human copy instead of the raw enum.
  - **Post-success submit rejection**: when `onApprove` fires and we navigate to `/renew-complete`, Vue tears down the PayPal iframe mid-flight and the still-pending `submit()` promise rejects with *"Window closed for postrobot_method before response"*. Catch checks `finalizing.value` and swallows that rejection so it doesn't trip the failure modal after a successful order.
- **`/renew-complete/:order_id`**: Confirmation page with device info + activation status.

### Physical-Goods Shop Flow
- **`/shop` and `/distribution`** both 301 to `/shop/product/track-1` (config in `nuxt.config.ts`).
- **`/shop/product/[slug]`**: Medusa-driven. Buy now → mints a fresh cart via `cartStore.createCart()` → `addLineItem` → `/shop/shipping`. Spinner renders inline beside the "Buy now · {price}" label (text stays visible) while loading.
  - **PH region**: Buy now becomes a dropdown with three options — Shopee (orange `#EE4D2D`), Lazada (deep purple `#0F146D`), and "Buy Now" via card (runs the same Medusa flow). Outbound anchors keep `target="_blank"` and defer their menu-close via `setTimeout` so mobile WebKit doesn't drop the navigation when the originating element is unmounted. Clicking the in-menu Buy Now closes the dropdown and the trigger button itself swaps chevron→spinner + disabled in the same paint as `buyNowLoading` flips true.
- **`/shop/shipping`**: Single name input (split at submit), required phone with read-only `+<dial code>` prefix from resolved country, billing block with read-only country and `Same as shipping` checkbox (default checked). Prefill overlay covers `loadCart()` until last-known-address resolution settles.
- **Returning-customer prefill**: `cartStore.fetchLastKnownAddresses()` resolves last-known shipping/billing in priority: (1) most recent completed order, (2) `customer.metadata.physical_cart`, (3) `customer.metadata.digital_cart`.
- **`/shop/checkout/[cart_id]`**: Item summary with thumbnails (real `<NuxtLink>` back to product page when `product_handle` is present), collapsible ship-to/bill-to review, email input, PayPal Card Fields with auto-init on cart hydration. Route middleware: only reachable from `/shop/shipping`.
- **3DS UX**: `finalizing` overlay covers the gap between PayPal closing the 3DS modal → Medusa `/complete` → navigation. Hard-failure modal differentiates `'reinit'` (pre-capture: re-init session) vs `'retry-complete'` (post-capture: re-attempt `/complete` with the same PayPal order ID — no double charge). Retry capped at 1. Same pattern lives in `/plan-checkout/[cart_id]`. Z-index for the contingency popup is pinned at `2147483647`, scoped narrowly so it doesn't bleed onto inline Card Fields iframes.
- **`/shop/order-complete/[order_id]`**: Minimal physical-order receipt.

### Philippines Regional Site
- **`/ph`**: Localized homepage with PH coverage map (Globe + Smart partner cards), LTFRB callout in `HomeGuarantee`.
- **`/ph/data-plans`**: Same `<DataPlansView>` component, `region="ph"` prop swaps hero copy ("Local coverage"), tier taglines (couriers, ride-hail, PUV/logistics), Basic perk to "Globe + Smart 4G LTE / 5G", Business perk to "LTFRB-certified hardware", and routes all CTAs into `/ph/*`. Comparison table splits "Local network" + "International roaming" rows.
- **`/ph/business`**: PHP fleet pricing (₱650 Starter / ₱600 Growth / Custom Enterprise), Globe + Smart trust marker, Metro Manila + Cebu service tags, PH-specific use cases (Courier, PUV/shuttle, Rental, Logistics).
- **`/ph/distribution`**: Online stores grid (Shopee, Lazada, Navitag Shop → `/shop`), authorized installation partners (Metro Manila + Cebu, configured as data array), bulk/fleet CTA → `/ph/business`.
- **`/ph/contact`**: PH contact form / details.
- **Header nav**: Where to Buy · Data Plans · For Business. CTA pill in the regional header is intentionally absent (PH `RegionConfig.cta` is unset; `HeaderRegional` guards both desktop and mobile via `v-if="region.cta"`). Footer: Shopping (Shopee/Lazada/Volume) + Company. Region label is "Philippines" everywhere (replaced earlier "Southeast Asia" copy).

### SEO & Analytics
- `useSeoMeta()` titles/descriptions/OG on all public pages. Auto-generated sitemap via `@nuxtjs/sitemap`. `robots.txt` blocks internal routes. `noindex` on auth/utility pages.
- **Meta Pixel** (ID via `runtimeConfig.public.metaPixelId`, default `1478826687226054`): plugin-loaded, fires `PageView` on initial boot + every SPA route change. Every event is sent with an `eventID` (UUID) and mirrored to the Conversions API (`capi.navitag.app`) with the same id so the browser + server halves dedupe — **including the boot PageView**, whose CAPI mirror is deferred until `fbevents.js` has executed (keyed off the script's `load` event, not a timeout) so `_fbp` / `_fbc` cookies are present. The duplicate `afterEach` Nuxt fires for the initial navigation is swallowed so the landing page isn't double-counted. `$fbq(event, params)` returns the event_id; `$fbq.custom(event, params)` for custom events. Plugin auto-decorates every event with `audience: 'b2c' | 'b2b'` (route-inferred via `useAudience.ts`) and emits a parallel `LeadB2C` / `LeadB2B` custom event alongside any lead-shaped standard event (`Lead`, `Contact`, `CompleteRegistration`, `SubmitApplication`, `Schedule`). Wired standard events: `ViewContent` (every marketing surface + product + top-up + auth + articles), `Lead` (contact form, plan tier intent, fleet quotes, retail outbounds), `Contact` (B2B inquiry CTAs), `AddToCart`, `InitiateCheckout`, `AddPaymentInfo`, `Purchase`, `CompleteRegistration` (signup: email/Google/Apple). CTA-level tagging via global `data-pixel-*` click listener (hero carousel, header nav, plan tier CTAs, fleet CTAs, distribution outbounds, Strapi article CTAs). **Full event inventory in [`META_EVENTS.md`](./META_EVENTS.md).**
- **Firebase Analytics (GA4)**: `router.afterEach` → `logEvent('page_view', ...)`. Measurement ID `G-TCCJ0H788E`. `$gaEvent` helper exposed.
- **Sitemap article handling**: dynamic source at `server/api/__sitemap__/articles.ts` queries Strapi and lists only articles where `noindex !== true`.
- **`@nuxt/image`**: registered with `webp`/`avif`, quality 80, 1×/2× densities. `<NuxtImg>` swap-in is incremental as pages are touched.

### Meta Tracking — Notes for Future Changes

Read this before adding or moving Meta events. Full event inventory: [`META_EVENTS.md`](./META_EVENTS.md).

**Architecture**

- **Plugin**: `app/plugins/meta-pixel.client.ts` — boots `fbq`, exposes typed `$fbq()` helper (returns `eventID`), `$fbq.custom()`, `$fbq.mirror()`, and a global `document` click listener for declarative CTA tracking. Every event is also POSTed to the dedicated CAPI service at `capi.navitag.app` for server-side dedup with the same `event_id`.
- **Audience helper**: `app/composables/useAudience.ts` — single source of truth for `b2c | b2b` inference. `inferAudience({ explicit?, subject?, returnTo?, path? })` is auto-imported into every component. The plugin decorates every event with `audience` if the caller did not pass one.
- **User-data hashing**: `app/utils/metaUserData.ts` — SHA-256 hashing for Advanced Matching (`em`, `external_id`, `country`, etc.) + `_fbp` / `_fbc` cookie capture + click-ID synthesis from `?fbclid=`. Push to both `fbq('init', …, advancedMatching)` and the CAPI mirror payload.
- **Two ways to fire events**:
  1. **Imperative**: `const { $fbq } = useNuxtApp(); $fbq('Lead', { ... })` — for funnel completions where you have programmatic access to value/items/IDs.
  2. **Declarative (preferred for CTAs)**: tag the element with `data-pixel-*` attributes. The plugin's delegated click listener picks it up. No script changes needed when the element is added.
- **Server-side `Purchase` dedup contract**: Before `/cart/complete`, the checkout pages pre-mint a `purchase_event_id` and stuff it into `cart.metadata` along with `_fbp` / `_fbc` / UA / source URL so the backend can fire a server-side Purchase with the SAME `event_id`. Browser also fires Purchase with that id → Meta dedupes. The frontend's only job here is populating `cart.metadata` correctly.

**Conventions when adding a new event**

- **Always set an `audience`** — either via `data-pixel-audience="b2b"` / `b2c`, or as an `audience` param on the `$fbq()` call. The plugin will fall back to route inference if you omit it, but explicit beats implicit, especially on shared components rendered under many routes.
- **B2B markers** that route inference already understands: any path matching `/business`, any subject/returnTo matching `business | fleet | enterprise | reseller | distribution | wholesale | bulk` (case-insensitive). Add new B2B keywords to `B2B_RX` in `useAudience.ts`, not to call sites.
- **Prefer standard events** for the lead-shaped trigger (`Lead`, `Contact`, `CompleteRegistration`) — Meta uses these for ad delivery optimization. The plugin handles the `LeadB2B` / `LeadB2C` parallel custom emission automatically; you don't need to fire it manually.
- **`content_name`** should be unique per surface (e.g. `business_hero`, `business_bottom_cta`, `data_plans_bottom_cta`) so dashboards filter cleanly. Snake_case.
- **`content_category`** is a coarse bucket (`b2b_intent`, `b2c_contact`, `fleet_quote`, `plan_intent`, `retailer_outbound`, `retail_locator`, `marketing`, `plans`, `fleet`, `auth`, `product`, `plan_renewal`, `distribution`, `contact`). Reuse existing buckets before inventing new ones. `retail_locator` is for `FindLocation` clicks on physical-store map links (distinct from `retailer_outbound`, which is for e-commerce marketplace deep links).
- **`lead_type`** is free-form intent labeling (`business_inquiry`, `fleet_quote`, `business_plan_intent`, `consumer_inquiry`, `consumer_signup`, `business_signup`, `retailer_outbound`, `reseller_inquiry`, `plan_intent`, `business_intent`).
- **Reserved events that won't fire from `data-pixel-*`**: `PageView`, `ViewContent`, `Purchase`. These must be fired imperatively from script setup so we control timing/params.
- **Every fire returns an `eventID` (UUID)** — used for future CAPI dedup. Don't strip it.

**Strapi articles (`/articles/[...slug]`)**

- Page is rendered via `v-html="article.bodyHtml"`. The plugin's delegated click listener picks up `data-pixel-*` attributes inside Strapi-managed HTML — content authors can tag CTAs without code changes here.
- ✅ Works inside `bodyHtml`: `<a data-pixel-event="Lead" data-pixel-audience="b2c" data-pixel-content-name="article_xyz_cta">…</a>`.
- ❌ **Does NOT work**: `<script>` tags inside `bodyHtml` — HTML5 spec disallows execution of scripts inserted via `innerHTML`. Don't ask Strapi authors to paste raw `fbq(...)` calls; tell them to use `data-pixel-*` attributes.
- Article-page `ViewContent` is fired imperatively in the page component and **must stay there** (Strapi cannot fire it because of the `<script>` restriction above).

**Audit checklist before merging Meta-related PRs**

1. Did you set `audience` (explicit or via attr) on every new event?
2. Does the `content_name` collide with an existing one in `META_EVENTS.md`?
3. If it's a CTA, did you use `data-pixel-*` attributes instead of inline `@click="$fbq(...)"`? (Prefer the declarative path — keeps templates clean and lets the plugin own the eventID/dedup contract.)
4. If it's a standard `Lead | Contact | CompleteRegistration`, did you let the plugin handle the parallel `LeadB2C` / `LeadB2B` instead of firing one yourself?
5. Did you update `META_EVENTS.md`? (PRs that add/remove events are not done until the doc reflects reality.)

**Known edge cases**

- `AddPaymentInfo` currently fires when PayPal Card Fields finish rendering, not on first card-field input. If PayPal SDK is blocked (ad blocker, tracker blocker), the event silently doesn't fire. Move to first input event when refining.
- `audience` inference uses `window.location.pathname` at fire time, not the route the user came from. For events fired during/after navigation transitions, pass `audience` explicitly to avoid race conditions.
- The plugin runs `.client.ts` only, so any `$fbq()` call inside SSR-shared code paths must be wrapped in `if (import.meta.client)`.
- **Query params survive client-side redirects.** `basicStore.runFirstEntryRedirect()` (regional redirect), the `[...slug].vue` catch-all 301, and the post-auth `navigateTo` in `login.vue` / `signup.vue` all forward `route.query` (+ hash). A bare path string drops the query, which silently killed `utm_*` and `fbclid` for any visitor whose geo-IP disagreed with the URL's region — `fbclid` is what seeds the `_fbc` cookie that both the pixel and the CAPI mirror need, so losing it degraded attribution. `signup.vue`'s `postAuthTarget()` strips the internal `return` / `intent` params before forwarding so they don't dangle on the destination.
- Meta Pixel script (`fbevents.js`) is loaded unconditionally on page boot — **no consent gate, by explicit decision**. The product owner has accepted the PH DPA / GDPR / CCPA exposure in exchange for 100% event coverage. Do not add a consent gate without re-confirming this decision; the trade-off is intentional, not a missing feature.

### TODO

#### Storefront
- [ ] `/top-up/:imei` UX for new SSO signups: `/v1/inventory/check` 404s with no linking path. Decide: redirect to onboarding, block account creation from overlay, or add inline IMEI-linking.
- [ ] Build reusable ecom components (catalog view, product search) once the storefront expands beyond Track-1.
- [ ] Auto-retry-with-backoff for the rare backend race "Session not authorized with the provider" on `/complete` (currently surfaces via the retry-complete modal; backend fix is canonical).

#### Region Routing
- [ ] **Verify `region-redirect.client.ts` actually runs** — plugin was silent on client. Kill + restart dev server, hard-reload `/` as a PH user, confirm `[region-redirect] PLUGIN BOOT` appears, then strip debug logs.
- [ ] Add hreflang alternates linking `/` ↔ `/ph` on all paired pages (data-plans, business, distribution, contact, home).

#### Content & Assets
- [ ] Verify Simbase Global+ country list in `HomeCoverage.vue` (~120 countries currently). Reconcile with "100+ countries" copy.
- [ ] "How it works" explainer page: (1) buy device, (2) buy prepaid plans, (3) subscriptions = enterprise-only.
- [ ] Meta Pixel — move `AddPaymentInfo` trigger from "card fields rendered" to "first card-field input" so the signal correlates with intent, not infrastructure load.

#### SEO
- [ ] Global `og:image` in `nuxt.config.ts` and `ogImage` on homepage + `/ph` (1200x630 social card at `/og-image.png`).
- [ ] Canonical URLs on all public pages via `useSeoMeta()`.
- [ ] JSON-LD structured data: Organization (homepage), LocalBusiness (PH), Product (when storefront expands).
- [ ] `public/manifest.json` + `apple-touch-icon`.
- [ ] Defer Font Awesome CSS (currently render-blocking).
- [ ] Complete Twitter card meta: `twitter:image`, `twitter:site`.
- [ ] Breadcrumb navigation on `/ph/distribution`, `/ph/business`.

#### Known Quirks
- Font Awesome 6.0.0 (CDN) doesn't ship `fa-shield-halved`. Use `fa-shield-alt` (legacy alias) until the CDN URL is bumped to a later 6.x.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **Nuxt 4** | Vue 3 SSR/SSG framework |
| **Tailwind CSS** | Utility-first CSS |
| **Pinia** | State management |
| **Firebase** | Authentication & Analytics |
| **Font Awesome 6** | Icon library (CDN, 6.0.0) |
| **Google Fonts** | Funnel Sans |
| **MedusaJS** | Ecommerce backend (`shopapi.navitag.com`) |
| **Strapi CMS** | Articles (`cms.navitag.com`) |
| **@nuxtjs/sitemap** | Auto-generated sitemap |
| **@nuxt/image** | Image optimization (webp/avif) |
| **world-atlas + topojson-client** | Country-level SVG maps |

## Local Documentation
- `localapi/shopadmin API docs.md` — MedusaJS frontend integration: two-token auth flow, headers, endpoint reference, refresh, Vue 3/Nuxt examples.

---

## Site Routes

| Route | Indexed | Description |
|---|---|---|
| `/` | Yes | Global landing page |
| `/data-plans` | Yes | Live Medusa pricing (US/global region) |
| `/business` | Yes | Fleet/B2B pricing + service grid |
| `/contact` | Yes | Contact form → `POST /v1/contact` |
| `/ph` | Yes | Philippines regional landing |
| `/ph/data-plans` | Yes | Live Medusa pricing (PH region) |
| `/ph/business` | Yes | PH fleet pricing (PHP) + service grid |
| `/ph/distribution` | Yes | Online stores + PH installation partners |
| `/ph/contact` | Yes | PH contact form |
| `/distribution` | No | → `/shop/product/track-1` (301) |
| `/articles/[...slug]` | Conditional | Strapi articles (per-article `noindex`) |
| `/privacy-policy` | No | Privacy policy |
| `/login`, `/signup`, `/forgot-password` | No | Auth pages |
| `/my-account` | No | Firebase user info |
| `/top-up/:imei` | No | Device top-up plan selection (auth gated) |
| `/plan-checkout/:cart_id` | No | Data-plan checkout |
| `/renew-complete/:order_id` | No | Top-up confirmation |
| `/shop` | No | → `/shop/product/track-1` (301) |
| `/shop/product/[slug]` | No | Storefront product (auth gated) |
| `/shop/shipping` | No | Address + shipping (gated by referrer) |
| `/shop/checkout/[cart_id]` | No | Physical-goods checkout (gated by referrer) |
| `/shop/order-complete/[order_id]` | No | Physical-order receipt |
| `/test-products` | No | Medusa product test page (dev) |
| `/links` | No | → `https://track.navitag.com/signup` |
| `/*` (catch-all) | No | Custom 404 |

---

## API Backends

| Service | URL | Purpose |
|---|---|---|
| **Medusa Store API** | `shopapi.navitag.com` | Products, carts, orders |
| **Unified API** | `api.navitag.net/v1` | Device inventory, data top-up, contact, user sync |

### Auth Flows
- **Medusa**: Firebase ID token → `POST /auth/customer/firebase` → Medusa JWT (24hr) → `Authorization` header for `/store/*`. Centralized in `useMedusa.medusaFetch` with cached token + 401-retry.
- **Unified API**: Firebase ID token directly in `Authorization: Bearer {idToken}`.
- **Backend Sync**: `useBackendSync` posts `POST /user/sync` on every login/signup with `country_code` + profile.
- **PayPal Card Fields**: SDK loaded with `currency = cart.currency_code`. Navitag's PayPal merchant is **Navitag Digital Innovations LLC (US entity)** — eligible for Card Fields globally; PH-region customers are charged in PHP, settled to the US entity.

### Contact Endpoint
- `POST /v1/contact` expects `application/x-www-form-urlencoded` (NOT JSON). `ContactForm.vue` sends `URLSearchParams`. Returns `{"status":"success"}` / `{"status":"error","message":"..."}`.

---

## Brand Colors

| Name | Hex | Usage |
|---|---|---|
| **Navitag Blue** | `#0076F5` | Primary, CTAs, links, headings |
| **Navitag Orange** | `#F28C38` | Accent, highlights, badges |
| **Navitag Background** | `#F7F4EF` | Theme background |

---

## Getting Started

```bash
npm install
npm run dev
npm run build
```

---

## Navitag Entities

- **Navitag Digital Innovations LLC** — Sheridan, Wyoming, USA (Global HQ; PayPal merchant entity)
- **Navitag Technology Systems OPC** — Makati, Metro Manila, Philippines (SEA/APAC regional hub)
