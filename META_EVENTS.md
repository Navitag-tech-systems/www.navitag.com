# Meta Pixel Event Map

Comprehensive map of every Meta Pixel event the navitag.com / navitag.com/ph site
fires, with B2C vs B2B audience tagging.

> **Pixel ID**: `1478826687226054` (configured in `nuxt.config.ts` →
> `runtimeConfig.public.metaPixelId`).
>
> **Plugin**: `app/plugins/meta-pixel.client.ts`. Boots `fbq`, exposes a typed
> `$fbq()` helper, attaches a `data-pixel-*` click listener for declarative
> CTA tracking, and auto-decorates every event with an inferred `audience`.

---

## 1. Audience taxonomy

Every event carries an `audience: 'b2c' | 'b2b'` parameter. The plugin
infers it automatically from route + caller hints; explicit overrides
always win.

| Audience | Triggered by |
|---|---|
| **`b2b`** | Any visit to `/business` or `/ph/business`; the "Business" tier CTA on `/data-plans`; "Talk to Navitag Business" / fleet CTAs; contact submissions whose `subject` matches `Business / Fleet / Enterprise / Reseller / Distribution / Wholesale / Bulk`; reseller outbound clicks on `/ph/distribution`; signups initiated with `?intent=business` or returning to a B2B path |
| **`b2c`** | Everything else: home, regular `/data-plans` Basic/Pro tiers, `/shop/*`, `/top-up/*`, articles, generic contact form, retail outbounds |

Inference logic lives in `app/composables/useAudience.ts` (auto-imported).

---

## 2. Plugin-level behavior

| Layer | Behavior |
|---|---|
| `PageView` | Fires on init + every Vue Router transition. |
| Event ID | Every standard / custom event attaches a UUID `eventID` for future Conversions API dedup. |
| Audience auto-decoration | Every `$fbq(event, params)` call has `audience` injected from `inferAudience()` if the caller did not pass one. |
| Parallel custom events | When a "lead-shaped" standard event fires (`Lead`, `Contact`, `CompleteRegistration`, `SubmitApplication`, `Schedule`), a parallel `LeadB2B` or `LeadB2C` custom event is emitted alongside it for clean Ads Manager audience builders. |
| Declarative CTA tracking | `document` click listener triggers `fbq` from `[data-pixel-event]` elements. Recognized attributes: `data-pixel-event`, `data-pixel-custom-name`, `data-pixel-content-name`, `data-pixel-content-category`, `data-pixel-value`, `data-pixel-currency`, `data-pixel-audience`, `data-pixel-lead-type`. Reserved (won't fire from data-attrs): `PageView`, `ViewContent`, `Purchase`. |

---

## 3. Page-mount `ViewContent` events

Fires once per page load (or, on the product page, once Medusa pricing
resolves). Used to build retargeting audiences and measure surface reach.

| Page | `content_name` | `content_category` | Audience | Notes |
|---|---|---|---|---|
| `/` | `home` | `marketing` | `b2c` | |
| `/ph` | `home_ph` | `marketing` | `b2c` | |
| `/data-plans` | `data_plans` | `plans` | `b2c` | `content_ids: ['basic','pro','business']`, `content_type: 'data_plan_list'` |
| `/ph/data-plans` | `data_plans_ph` | `plans` | `b2c` | same param shape |
| `/business` | `business` | `fleet` | **`b2b`** | |
| `/ph/business` | `business_ph` | `fleet` | **`b2b`** | |
| `/contact` | `contact` | `contact` | inferred from `?subject=` | |
| `/ph/contact` | `contact_ph` | `contact` | inferred from `?subject=` | |
| `/ph/distribution` | `distribution_ph` | `distribution` | `b2c` | |
| `/login` | `login` | `auth` | inferred from `?return=` | Login is shared by B2C consumers and B2B fleet ops; audience pulls from `?return=/business` etc. |
| `/signup` | `signup` | `auth` | inferred from `?intent=` / `?return=` | |
| `/forgot-password` | `forgot_password` | `auth` | route-inferred (b2c default) | Shared surface — no audience hint available; treated as b2c by default. |
| `/my-account` | `my_account` | `account` | route-inferred (b2c default) | Shared surface; not conversion-shaped. |
| `/privacy-policy` | `privacy_policy` | `legal` | route-inferred (b2c default) | |
| `/shop/product/[slug]` | (product title) | `product` | `b2c` | `content_ids: [variantId]`, `value`, `currency`, `content_type: 'product'` |
| `/shop/shipping` | `shop_shipping` | `checkout` | `b2c` | Pre-`InitiateCheckout` surface — captures shipping-step visitors who bail before submit. |
| `/top-up/[imei]` | `top_up` | `plan_renewal` | `b2c` | `content_type: 'data_plan_list'`, `imei` |
| `/invite/view/[token]` | `invite_view` | `invite` | route-inferred | Tracker share-claim landing. `content_type: 'tracker_share'`, `content_ids: [token]` |
| `/articles/[...slug]` | (article title) | (article category) | `b2c` | Already wired pre-overhaul. Strapi-side per-article CTAs use `data-pixel-*` attrs. |

---

## 4. Funnel events (post-action)

Fires when the user actually completes a step.

| Step | Event | Source file (line) | Audience | Key params |
|---|---|---|---|---|
| Buy Now on product page | `AddToCart` | `app/pages/shop/product/[slug].vue:186` | `b2c` | `content_ids`, `content_type:'product'`, `value`, `currency`, `num_items` |
| Pick plan tier on top-up | `AddToCart` | `app/pages/top-up/[imei].vue:283` | `b2c` | `content_ids`, `content_type:'data_plan'`, `value`, `currency`, `num_items:1` |
| Submit shipping on `/shop/shipping` | `InitiateCheckout` | `app/pages/shop/shipping.vue:298` | `b2c` | `content_ids`, `content_type:'product'`, `value`, `currency`, `num_items` |
| Card fields rendered (shop checkout) | `AddPaymentInfo` | `app/pages/shop/checkout/[cart_id].vue:299` | `b2c` | `value`, `currency`, `content_ids`, `num_items` |
| Card fields rendered (plan checkout) | `AddPaymentInfo` | `app/pages/plan-checkout/[cart_id].vue:301` | `b2c` | `value`, `currency`, `content_type:'data_plan'` |
| Order completed (shop) | `Purchase` (browser) + `$fbq.mirror` (CAPI) | `app/pages/shop/checkout/[cart_id].vue:442` | `b2c` | `value`, `currency`, `content_ids`, `num_items`, `transaction_id`. Browser pixel uses pre-minted `purchase_event_id` from cart metadata so the Medusa `order.placed` subscriber dedupes against the same id. |
| Order completed (plan) | `Purchase` (browser) + `$fbq.mirror` (CAPI) | `app/pages/plan-checkout/[cart_id].vue:461` | `b2c` | `value`, `currency`, `content_ids`, `content_type:'data_plan'`, `num_items`, `transaction_id`. Same dedup pattern as shop. |
| Contact form submit success | `Lead` + `LeadB2B`/`LeadB2C` | `app/components/ContactForm.vue:81` | inferred from `subject` | `content_name` (subject), `content_category` (`b2b_contact`/`b2c_contact`), `lead_type`, `country_code` |
| Email signup success | `CompleteRegistration` + parallel custom | `app/pages/signup.vue:110` | inferred from `?intent` / `?return` | `method:'email'`, `lead_type` (`business_signup`/`consumer_signup`) |
| Google signup success | `CompleteRegistration` + parallel custom | `app/pages/signup.vue:136` | inferred | `method:'google'`, `lead_type` |
| Apple signup success | `CompleteRegistration` + parallel custom | `app/pages/signup.vue:172` | inferred | `method:'apple'`, `lead_type` |
| Login success — `/login` page | `Custom: Login` | `app/pages/login.vue` | inferred from `?return=` | `method: 'email' \| 'google' \| 'apple'` |
| Login success — `LoginOverlay` | `Custom: Login` | `app/components/LoginOverlay.vue` | route-inferred at fire time | Fires from /shop, /top-up, /invite. Same `method` param. |
| Invite claim success | `SubmitApplication` + parallel `LeadB2C`/`LeadB2B` | `app/pages/invite/view/[token].vue` | route-inferred | `content_type: 'tracker_share'`, `num_items: granted_devices.length`, `lead_type: 'invite_claim'` |

---

## 5. CTA clicks (`data-pixel-*` driven)

Fired by the global click listener in `app/plugins/meta-pixel.client.ts`.
Adding the attributes to any element automatically registers it.

### 5.1 Hero carousel — `app/components/HomeBannerCarousel.vue`

| Slide | CTA | Event | Audience | `content_name` |
|---|---|---|---|---|
| 0 | "Shop Now" | `Custom: HeroCTAClick` | `b2c` | `hero_shop_now` |
| 0 | "Data Plans" | `Custom: HeroCTAClick` | `b2c` | `hero_data_plans` |
| 1 | (Track-1, no CTA) | — | — | — |
| 2 | "Learn More" (24/7 Streaming) | `Custom: HeroCTAClick` | `b2c` | `hero_streaming_learn_more` |
| 3 | "See Coverage" | `Custom: HeroCTAClick` | `b2c` | `hero_see_coverage` |
| 4 | "Explore Business" | `Custom: HeroCTAClick` | **`b2b`** | `hero_explore_business` (`lead_type: business_intent`) |
| 5 | (History Replay, no CTA) | — | — | — |

### 5.2 Home sections

| Component | CTA | Event | Audience | `content_name` |
|---|---|---|---|---|
| `HomeNoSim.vue` | "Explore data plans" | `Custom: HomeSectionCTA` | `b2c` | `nosim_explore_plans` |
| `HomeNoSim.vue` | "Shop devices" | `Custom: HomeSectionCTA` | `b2c` | `nosim_shop_devices` |
| `HomeFlexibility.vue` | "Buy now" | `Custom: HomeSectionCTA` | `b2c` | `flexibility_buy_now` |
| `HomeFlexibility.vue` | "See data plans" | `Custom: HomeSectionCTA` | `b2c` | `flexibility_see_plans` |

### 5.3 Header navigation

| Component | Link | Event | Audience | `content_name` |
|---|---|---|---|---|
| `HeaderGlobal.vue` (desktop + mobile) | "Where to Buy" | `Custom: NavClick` | `b2c` | `nav_distribution` |
| `HeaderGlobal.vue` | "Data Plans" | `Custom: NavClick` | `b2c` | `nav_data_plans` |
| `HeaderGlobal.vue` | "For Business" | `Custom: NavClick` | **`b2b`** | `nav_business` |
| `HeaderRegional.vue` | any nav link whose `to` matches `/business` | `Custom: NavClick` | **`b2b`** | `nav_<label>` (e.g. `nav_for_business`) |
| `HeaderRegional.vue` | other regional nav links | `Custom: NavClick` | `b2c` | `nav_<label>` (e.g. `nav_where_to_buy`, `nav_data_plans`) |

### 5.4 Data Plans tier CTAs — `app/components/DataPlansView.vue`

| CTA | Event | Audience | `content_name` | `lead_type` |
|---|---|---|---|---|
| "Start with Basic" | `Lead` + `LeadB2C` | `b2c` | `plan_tier_basic` | `plan_intent` |
| "Start with Pro" | `Lead` + `LeadB2C` | `b2c` | `plan_tier_pro` | `plan_intent` |
| "See Plans" (Business tier) | `Lead` + `LeadB2B` | **`b2b`** | `plan_tier_business` | `business_plan_intent` |
| Bottom "Talk to Navitag Business" | `Contact` + `LeadB2B` | **`b2b`** | `data_plans_bottom_cta` | `business_inquiry` |

### 5.5 Business pages — `app/pages/business.vue`, `app/pages/ph/business.vue`

| CTA | Event | Audience | `content_name` | `lead_type` |
|---|---|---|---|---|
| Hero "Talk to our team" (global) | `Contact` + `LeadB2B` | **`b2b`** | `business_hero` | `business_inquiry` |
| Hero "Talk to our team" (PH) | `Contact` + `LeadB2B` | **`b2b`** | `business_ph_hero` | `business_inquiry` |
| Fleet tier "Get started" / "Request quote" (global) | `Lead` + `LeadB2B` | **`b2b`** | `fleet_starter_fleet` / `fleet_growth_fleet` / `fleet_enterprise_fleet` | `fleet_quote` |
| Fleet tier CTAs (PH) | `Lead` + `LeadB2B` | **`b2b`** | `fleet_ph_<tier>` | `fleet_quote` |
| Bottom "Contact us" (global) | `Contact` + `LeadB2B` | **`b2b`** | `business_bottom_cta` | `business_inquiry` |
| Bottom "Contact us" (PH) | `Contact` + `LeadB2B` | **`b2b`** | `business_ph_bottom_cta` | `business_inquiry` |

### 5.6 PH Distribution — `app/pages/ph/distribution.vue`

| CTA | Event | Audience | `content_name` | `lead_type` |
|---|---|---|---|---|
| Shopee outbound | `Lead` + `LeadB2C` | `b2c` | `retailer_shopee_ph` | `retailer_outbound` |
| Lazada outbound | `Lead` + `LeadB2C` | `b2c` | `retailer_lazada_ph` | `retailer_outbound` |
| Navitag Shop → `/shop` | _no event_ | — | — | Internal `<NuxtLink>`; intentionally untagged so the destination's own `ViewContent` / `AddToCart` fires unmuddled. |
| Retail map link (Quirino, Cebu, Mandaue, Basak, Tabunok, Talisay, Carcar) | `FindLocation` | `b2c` | `retailer_qhas_novaliches`, `retailer_cmap_*` | `content_category: retail_locator` |
| "Contact Fleet Sales" (mailto bulk pricing) | `Contact` + `LeadB2B` | **`b2b`** | `distribution_ph_bulk_sales` | `reseller_inquiry` |
| "Become a Reseller" → /ph/contact | `Contact` + `LeadB2B` | **`b2b`** | `distribution_ph_reseller` | `reseller_inquiry` |

> **Note**: `retailer_shopee_ph` and `retailer_lazada_ph` ALSO fire from
> the PH retailer dropdown on `/shop/product/[slug]` (Buy Now becomes
> a 3-item menu for PH visitors: Shopee, Lazada, in-app card checkout).
> Counts roll up across both surfaces by design — keep the names aligned
> if you ever rename either side.

### 5.7 PH Footer outbounds — `app/components/FooterRegional.vue` (driven by `app/config/regions.ts`)

Visible on every PH layout page, not just `/ph/distribution`. Tagged via the `pixel`
field on `RegionFooterLink` so adding a new outbound in the config registers tracking
automatically.

| CTA | Event | Audience | `content_name` | `lead_type` |
|---|---|---|---|---|
| Shopee (footer) | `Lead` + `LeadB2C` | `b2c` | `retailer_shopee_ph_footer` | `retailer_outbound` |
| Lazada (footer) | `Lead` + `LeadB2C` | `b2c` | `retailer_lazada_ph_footer` | `retailer_outbound` |
| For Business (footer) | `Custom: FooterCTA` | **`b2b`** | `footer_for_business_ph` | — |

### 5.8 Region banner — `app/components/RegionBanner.vue`

| CTA | Event | Audience | `content_name` |
|---|---|---|---|
| "Go to {Region}" suggestion link | `Custom: RegionSwitch` | route-inferred | `region_switch_to_<code>` (e.g. `region_switch_to_ph`) |

### 5.9 Articles (Strapi-managed)

`/articles/[...slug]` is rendered via `v-html="article.bodyHtml"`. The
plugin's global click listener picks up clicks on any DOM element, so
Strapi content authors can tag CTAs in article HTML using the same
`data-pixel-*` attributes — they will fire correctly without any code
change here.

**What works inside Strapi `bodyHtml`:**

- ✅ `<a href="..." data-pixel-event="Lead" data-pixel-audience="b2c" data-pixel-content-name="article_xyz_cta">…</a>` — fires through the global delegated listener.
- ✅ `<button data-pixel-event="Custom" data-pixel-custom-name="ArticleCTA" data-pixel-audience="b2c">…</button>` — same.

**What does NOT work:**

- ❌ `<script>fbq(...)</script>` blocks embedded in `bodyHtml` — the HTML5
  spec says script tags inserted via `innerHTML` do not execute, so
  these silently no-op. Use `data-pixel-*` attributes instead.

Authors should always set `data-pixel-audience` on article CTAs so the
event lands in the correct B2C / B2B audience pool.

---

## 6. Filtering in Events Manager

In **Meta Events Manager → Test Events / Custom Conversions**:

- Filter any standard event by custom param `audience = b2b` (or `b2c`)
  to slice reach, intent, and conversion volume by funnel.
- Use distinct `content_category` values (`b2b_contact`, `fleet_quote`,
  `b2b_intent` vs `b2c_contact`, `plan_intent`, `retailer_outbound`,
  `retail_locator`, `marketing`, `plans`, `fleet`, `auth`, `product`,
  `plan_renewal`, `distribution`, `contact`) to split dashboards without
  writing custom filters.

In **Ads Manager → Audiences → Custom Audience → Website**:

- For consumer-prospect lookalikes / retargeting → use `LeadB2C` event.
- For business / fleet pipeline → use `LeadB2B` event.
- Both names are populated automatically alongside their parent
  `Lead` / `Contact` / `CompleteRegistration` events; no extra wiring
  needed.

---

## 7. Future work (not yet implemented)

- **Conversions API mirror** — already wired. The plugin mints a unique
  `eventID` per event and POSTs to `capi.navitag.app` (configured via
  `runtimeConfig.public.metaCapiEndpoint`). Backend service implementation
  spec: [`BACKEND_META_CAPI.md`](./BACKEND_META_CAPI.md).
- **Advanced Matching** — push hashed `em`, `ph`, `external_id`, country
  to `fbq('init', …, { … })` once the user resolves in `useBasicStore`.
  Lifts EMQ score significantly (especially for B2B leads where one
  match can be worth $$$).
- **`AddPaymentInfo` trigger refinement** — currently fires on PayPal
  Card Fields render. Should move to first card-field input event so
  the signal correlates with intent, not infrastructure load.
- **B2B login signal** — `Login` custom event keyed by `?intent=business`
  on the login page would help build retention audiences for fleet
  customers.

---

_Last updated: 2026-05-05 (line-number drift fix; Navitag Shop activated; PH product-page retailer dropbox shares retailer_*_ph names with the distribution page). Maintained alongside `app/plugins/meta-pixel.client.ts`
and `app/composables/useAudience.ts`._
