# Navitag www-v3

The next-generation front-facing website for the Navitag brand, replacing www-v2. Built with Nuxt 4, featuring a global brand site and regional pages, with an ecommerce storefront at `/shop`. 

## Project Status

The project has progressed through foundational setup, content migration, authentication, a complete data plan top-up ecommerce flow, and SEO optimization:

- **Foundation**: Nuxt 4 project created and deployed to GitHub. Brand colors extracted from www-v2 (Blue `#0076F5`, Orange `#F28C38`, Background `#F7F4EF`). All www-v2 content migrated (Global landing, PH landing, PH distribution, Privacy Policy).
- **Layouts & Navigation**: Shared layouts with reusable header/footer components for Global and PH regions. Catch-all route redirects unmatched paths to homepage.
- **Authentication**: Firebase Authentication and Analytics integrated (client-side plugin + composable). Login page with email/password, Google, Facebook, and Apple providers. Signup page with full name field and password validation. Reusable LoginOverlay component for in-page auth modals. All auth flows (signup, login, overlay) call `backendSync` to `api.navitag.net/v1/user/sync` in parallel with Medusa token exchange — ensures users are created/synced in the unified backend and Traccar on every auth event. Apple name capture persists to `localStorage` for durability across sessions.
- **Ecommerce Backend**: Medusa product fetching working with region-based variant pricing (`reg_01KNN7RSPMSP2FNKEG83ZQ0HQ6`). Product test page at `/test-products`.
- **Data Plan Top-Up Flow**: Complete end-to-end flow built — device lookup via Unified API (`/top-up/:imei`), tiered plan selection (Basic/Pro) with duration variants and pricing, region-aware product fetching (country from MySQL user > IP detection via ipinfo.io, mapped to Medusa region via `countryList.ts`), cart creation with IMEI and country_code in metadata for downstream processing, digital delivery shipping auto-applied, checkout page (`/plan-checkout/:cart_id`) with PayPal inline card fields (Alphabit plugin, sandbox mode, 3DS/OTP support, SDK loaded with the cart's region currency so customers are charged in the region's native currency), and top-up confirmation page (`/renew-complete/:order_id`) with device info, payment summary, and activation status.
- **Gated Top-Up Initialization**: The top-up page holds a spinner on mount until both (a) Firebase auth state first-resolves via a one-shot `onAuthStateChanged` subscription and (b) IP country detection completes — run together via `Promise.all`. This removes the prior reactivity race where products could load against the IP fallback region before the MySQL country arrived, and eliminates the duplicate `checkDevice` call that used to fire from both the auth listener and the overlay's success handler. Once settled, the page routes: if logged in → device lookup; if not → login overlay opens with the IP country passed in explicitly so brand-new SSO accounts land in `user/sync` with the correct country on first creation.
- **Resilient Country Detection**: `fetchCountryCode` (ipinfo.io) now retries on failure — 5s per-attempt timeout, 2 retries, 500ms delay (3 total attempts). If all attempts fail, the top-up page shows an inline "Unable to detect your location" card with a Retry button that refreshes the page (clearing the module-level cache and re-hitting the network).
- **SEO**: `useSeoMeta()` with titles, descriptions, and OG tags on all public pages. Auto-generated sitemap via `@nuxtjs/sitemap`. `robots.txt` blocks internal routes. `noindex` on auth/utility pages. Custom error page (`error.vue`).
- **Utility Pages**: Account debug page (`/acct-log`) for Firebase user info and Medusa token display. `/shop` redirects to `/ph/distribution`. `/links` redirects to external signup.

### TODO
- [ ] Test and debug complete plan top-up flow: top-up → plan-checkout → PayPal card payment → renew-complete
- [ ] Fix CORS for Medusa token exchange on localhost (backend needs `localhost` in allowed origins, or use Nuxt server proxy)
- [ ] Build reusable ecom components and/or composables (product search, catalog view)
- [ ] Setup ecommerce storefront at /shop with MedusaJS backend

#### SEO TODO
- [ ] Add og:image meta tag to all public pages (needs brand social card image, e.g. `/og-image.png` at 1200x630)
- [ ] Add JSON-LD structured data: Organization schema (homepage), LocalBusiness schema (PH page)
- [ ] Add hreflang tags linking `/` (en) ↔ `/ph` (en-PH) for regional cross-referencing
- [ ] Add canonical URLs to pages with potential duplicate content
- [ ] Add `loading="lazy"` to below-the-fold images
- [ ] Consider adding Product schema markup when ecommerce storefront launches

### Known Issues
- Medusa token exchange (`POST /auth/customer/firebase`) fails on localhost due to CORS — backend only allows `*.navitag.com` origins

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **Nuxt 4** | Vue 3 SSR/SSG framework |
| **Tailwind CSS** | Utility-first CSS (`@nuxtjs/tailwindcss`) |
| **Pinia** | State management (`@pinia/nuxt`) |
| **Firebase** | Authentication & Analytics (official JS SDK) |
| **Font Awesome 6** | Icon library (CDN) |
| **Google Fonts** | Funnel Sans (`@nuxtjs/google-fonts`) |
| **MedusaJS** | Ecommerce backend (shopapi.navitag.com) |
| **@nuxtjs/sitemap** | Auto-generated sitemap for SEO |

## Modules & Plugins
- Nuxt MCP: https://mcp-toolkit.nuxt.dev/getting-started/introduction
- MedusaJS frontend: https://github.com/medusajs/medusa-agent-skills/blob/main/plugins/ecommerce-storefront/README.md#installation-with-claude-code

## Local Documentation
- `localapi/shopadmin API docs.md` — Frontend integration guide for the MedusaJS backend (`shopapi.navitag.com`). Covers the two-token auth flow (Firebase ID token → Medusa JWT), required headers, endpoint reference, token refresh strategy, and Vue 3/Nuxt composable examples. Firebase is configured as a custom auth provider on the Medusa backend.

---

## Site Route Mapping

| Route | Indexed | Description |
|---|---|---|
| `/` | Yes | Global landing page highlighting the Navitag brand |
| `/ph` | Yes | Philippines / SEA / APAC regional landing page |
| `/ph/distribution` | Yes | Where to buy - official stores & installation partners |
| `/privacy-policy` | No | Global privacy policy (Facebook Login compliance) |
| `/login` | No | Login page (email/password, Google, Facebook, Apple) |
| `/signup` | No | Signup page with password requirements |
| `/top-up/:imei` | No | Device lookup + data top-up plans (requires auth) |
| `/plan-checkout/:cart_id` | No | Checkout page for data plan top-up (digital delivery) |
| `/renew-complete/:order_id` | No | Data plan top-up confirmation (dead-end page) |
| `/acct-log` | No | Account debug page — Firebase user info + Medusa token |
| `/test-products` | No | Product test page — fetches and displays Medusa products |
| `/links` | No | Redirects to `https://track.navitag.com/signup` |
| `/shop` | No | Redirects to `/ph/distribution` |
| `/*` (catch-all) | No | Unmatched routes → custom 404 error page |

---

## Project Structure

```
app/
├── components/
│   ├── HeaderGlobal.vue      # Sticky nav for global pages
│   ├── FooterGlobal.vue      # Footer for global pages
│   ├── HeaderPh.vue          # Sticky nav for PH/SEA pages
│   ├── FooterPh.vue          # Footer for PH/SEA pages
│   └── LoginOverlay.vue      # Reusable full-page login modal
├── composables/
│   ├── useFirebase.ts        # Firebase auth/analytics composable
│   └── useBackendSync.ts     # Country detection + api.navitag.net user sync
├── layouts/
│   ├── default.vue           # Global layout (HeaderGlobal + FooterGlobal)
│   └── ph.vue                # PH layout (HeaderPh + FooterPh)
├── pages/
│   ├── index.vue             # Global landing page
│   ├── login.vue             # Login page
│   ├── signup.vue            # Signup page
│   ├── privacy-policy.vue    # Privacy policy
│   ├── acct-log.vue           # Account debug (user info + Medusa token)
│   ├── plan-checkout/
│   │   └── [cart_id].vue      # Data plan top-up checkout page
│   ├── renew-complete/
│   │   └── [order_id].vue     # Data plan top-up confirmation
│   ├── [...slug].vue         # Catch-all — 301 redirect to /
│   ├── links.vue             # Redirect to track.navitag.com/signup
│   ├── shop.vue              # Redirect to /ph/distribution
│   ├── test-products.vue     # Medusa product test page
│   ├── top-up/
│   │   └── [imei].vue        # Device lookup + top-up plans
│   └── ph/
│       ├── index.vue         # PH regional landing page
│       └── distribution.vue  # Where to buy page
├── plugins/
│   └── firebase.client.ts    # Firebase initialization (client-side only)
├── error.vue                 # Custom 404/error page
├── variables.ts              # API URLs and keys
└── app.vue                   # Root app component
```

---

## API Backends

| Service | URL | Purpose |
|---|---|---|
| **Medusa Store API** | `shopapi.navitag.com` | Ecommerce (products, carts, orders) |
| **Unified API** | `api.navitag.net/v1` | Device inventory, data top-up |

### Auth Flows
- **Medusa**: Firebase ID token → `POST /auth/customer/firebase` → Medusa JWT (24hr) → used in `Authorization` header for `/store/*` endpoints
- **Unified API**: Firebase ID token directly in `Authorization: Bearer {idToken}` header
- **Backend Sync** (`useBackendSync` composable): On every login/signup, the app calls `POST /user/sync` with country code and user profile data. On signup, country is manually selected (pre-filled from IP detection). On login/overlay, country is auto-detected via ipinfo.io (with retry). The top-up page now passes its already-resolved `ipCountryCode` into `LoginOverlay` as a prop, and the overlay forwards it as an explicit `overrideCountryCode` to `backendSync` for all providers (email, Google, Facebook, Apple) — so new SSO accounts are created in the unified backend with the correct country instead of relying on a second in-overlay ipinfo call. Runs in parallel with Medusa token exchange — non-blocking for navigation. Apple name captured to `localStorage` (`apple_pending_name`) and included as a fallback in sync payload.
- **Region-Aware Pricing**: `countryList.ts` maps country codes to Medusa region IDs (PH → `reg_01KNY0WCJWP61HN944KFBN8XSX`, all others → global default `reg_01KNN7RSPMSP2FNKEG83ZQ0HQ6`). The top-up page resolves the user's country (MySQL via `/inventory/check` > IP fallback) and uses the corresponding region for product price fetching and cart creation. Once the cart is created, its `region_id` is persisted server-side by Medusa — every downstream checkout call (`/store/carts/:id`, payment-collections, payment-sessions, `/complete`) is cart-ID-scoped and inherits that region's currency and pricing through to payment capture. No re-resolution of region is needed on the checkout page.
- **PayPal Advanced Checkout & PHP Currency**: PayPal's Advanced Card Fields (`components=card-fields`) lists PHP among its 22 supported transaction currencies but does NOT list the Philippines among its 37 eligible merchant countries. Navitag's PayPal business account is under **Navitag Digital Innovations LLC (US entity)**, which IS an eligible merchant country — so Card Fields is eligible for all regions, and customers in the PH region are charged in PHP while the US entity receives the settlement. The PayPal JS SDK is loaded with `currency = cart.currency_code` (not hardcoded USD) so the SDK, the server-created PayPal order, and the captured charge all agree on the currency.

---

## Brand Colors

| Name | Hex | Usage |
|---|---|---|
| **Navitag Blue** | `#0076F5` | Primary brand color, CTAs, links, headings |
| **Navitag Orange** | `#F28C38` | Secondary/accent color, highlights, product badges |
| **Navitag Background** | `#F7F4EF` | Theme background color |

---

## SEO

### Implemented
- **Meta descriptions** on all public pages via `useSeoMeta()`
- **Open Graph tags** (og:title, og:description, og:url, og:site_name, og:type) on all public pages
- **Twitter card** meta (summary) set globally
- **Sitemap** auto-generated via `@nuxtjs/sitemap` module — excludes internal/auth pages
- **robots.txt** blocks internal routes (login, signup, acct-log, test-products, checkout flows)
- **noindex** meta on auth pages (login, signup), utility pages (acct-log, links, renew-complete)
- **Image alt text** on all logo images across all pages and components
- **HTML lang attribute** set to `en` globally
- **Single H1 per page** — fixed duplicate H1 on homepage

### Pending (see SEO TODO above)
- og:image social card
- JSON-LD structured data (Organization, LocalBusiness)
- hreflang tags for regional pages
- Canonical URLs
- Lazy loading images

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

---

## Navitag Entities

- **Navitag Digital Innovations LLC** - Sheridan, Wyoming, USA (Global HQ)
- **Navitag Technology Systems OPC** - Makati, Metro Manila, Philippines (SEA/APAC regional hub)
