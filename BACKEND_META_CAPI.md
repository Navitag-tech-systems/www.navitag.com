# Backend Implementation Spec: Meta Conversions API (CAPI)

This document is the contract between the **navitag.com www-v3 frontend**
and the two backend services it talks to. The frontend is already wired
for CAPI dedup (event IDs, `_fbp` / `_fbc` capture, hashed user_data,
mirror dispatch). The backends below need to implement what's specified
here for end-to-end CAPI to work in production.

> **Read alongside:** [`META_EVENTS.md`](./META_EVENTS.md) (full event
> inventory) and [`README.md`](./README.md#meta-tracking--notes-for-future-changes)
> (frontend conventions).

---

## Architecture overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser (Nuxt 4)                            │
│                                                                     │
│  fbevents.js   ◄──── window.fbq('track', ...)  (browser pixel)     │
│       │                                                             │
│       │   Every track call ALSO fires:                              │
│       ▼                                                             │
│  fetch POST  ────►  api.navitag.net/v1/meta/capi   (mirror)         │
│                                                                     │
│  On checkout /complete, frontend pre-mints purchase_event_id and    │
│  stuffs it into cart.metadata. Medusa reads it and fires server-    │
│  side Purchase to Meta with the SAME event_id → dedup.              │
└─────────────────────────────────────────────────────────────────────┘
                          │                            │
                          ▼                            ▼
        ┌─────────────────────────────┐  ┌─────────────────────────────┐
        │ api.navitag.net/v1          │  │ shopapi.navitag.com         │
        │ (PHP / MySQL — unified API) │  │ (MedusaJS v2)               │
        │                             │  │                             │
        │  POST /v1/meta/capi         │  │  order.placed subscriber:   │
        │   ├─ adds client_ip         │  │   ├─ reads cart.metadata    │
        │   ├─ forwards to Meta       │  │   ├─ hashes user_data from  │
        │   └─ logs success/failure   │  │   │   order.email + addr    │
        │                             │  │   └─ POSTs Purchase to Meta │
        │  All non-Purchase events    │  │                             │
        │  flow through here.         │  │  Purchase only — every other│
        │                             │  │  event goes via the unified │
        │                             │  │  /v1/meta/capi proxy.       │
        └─────────────────────────────┘  └─────────────────────────────┘
                          │                            │
                          └─────────────┬──────────────┘
                                        ▼
                  https://graph.facebook.com/v19.0/{PIXEL_ID}/events
                                  ?access_token=…
```

**Why the split**:

- **Unified API owns the proxy** for browser-mirrored events because the
  browser already trusts it (it's the same origin Firebase auth and
  contact-form posts go through), and PHP+MySQL is the simplest place to
  log + queue + retry.
- **Medusa owns server-side `Purchase`** because the order isn't real
  until `/cart/complete` returns. Firing it from a Medusa subscriber
  guarantees Meta gets `Purchase` even if the user closes the browser
  before the redirect to the order-complete page lands. The browser
  also fires `Purchase` (with the same `event_id`) — Meta dedupes them.

**Why we still mirror Purchase from the browser**: redundancy. If the
Medusa subscriber fails (transient Meta API outage), the browser's
mirror via the unified API is the fallback. If both fire, dedup handles
it. If neither fires, we have a true outage — log and alert.

---

## Shared environment variables

Both backends need the same Meta credentials.

| Variable | Where | Description |
|---|---|---|
| `META_PIXEL_ID` | both | `1478826687226054` (matches `runtimeConfig.public.metaPixelId`). |
| `META_CAPI_TOKEN` | both | System-user access token from Meta Business Manager. **Server-only — never expose to browser.** Generate per service or share; rotation needs both updated. |
| `META_TEST_EVENT_CODE` | both (optional) | Set in staging only. When present, append `test_event_code` to outbound CAPI payloads so events land in the Test Events tab, not production. |
| `META_GRAPH_API_VERSION` | both | Default `v19.0`. Bump when Meta releases a newer stable. |

**Domain verification**: `navitag.com` and `shopapi.navitag.com` need to
be verified in Meta Business Manager → Brand Safety → Domains. Without
verification CAPI will accept events but Meta won't attribute them
properly to ads.

---

## Scope 1 — Unified API (`api.navitag.net/v1`)

### `POST /v1/meta/capi`

Accepts a single Meta CAPI event from the browser, enriches it with
server-side fields (IP), and forwards to Meta's `/events` endpoint.

#### Request

- **Method**: `POST`
- **Auth**: **none** (anonymous-tolerant; cart events from non-authed users
  must work). Backend may apply per-IP rate limiting (suggested: 60 req/min).
- **Content-Type**: `application/json`
- **CORS**: Allow origin `https://navitag.com` and `https://www.navitag.com`
  (and any preview/staging hosts). Allow `POST`, `Content-Type` header.
- **Body** (JSON):

```jsonc
{
  "event_id": "f1a2b3c4-...-...",          // UUID minted browser-side
  "event_name": "Lead",                     // Meta standard or custom name
  "event_time": 1714415000,                 // Unix seconds, browser clock
  "action_source": "website",
  "event_source_url": "https://navitag.com/contact?subject=...",
  "test_event_code": "TEST12345",           // optional — only present in staging
  "user_data": {
    // All fields optional. Hashes are SHA-256 hex (lowercase).
    "em": "<sha256>",                       // hashed email
    "ph": "<sha256>",                       // hashed phone (digits only)
    "fn": "<sha256>",                       // hashed first name (lowercase)
    "ln": "<sha256>",                       // hashed last name (lowercase)
    "ct": "<sha256>",                       // hashed city
    "country": "<sha256>",                  // hashed ISO alpha-2 country
    "external_id": "<sha256>",              // hashed Firebase UID
    "fbp": "fb.1.1714415000.0987654321",    // _fbp cookie verbatim
    "fbc": "fb.1.1714414000.AbCdEf...",     // _fbc cookie verbatim
    "client_user_agent": "Mozilla/5.0 ..."  // navigator.userAgent verbatim
  },
  "custom_data": {
    "currency": "USD",
    "value": 25.0,
    "content_ids": ["variant_01..."],
    "content_type": "data_plan",
    "content_name": "data_plans_bottom_cta",
    "content_category": "b2b_intent",
    "audience": "b2b",                      // <-- Navitag-custom param
    "lead_type": "business_inquiry",        // <-- Navitag-custom param
    "num_items": 1,
    "contents": [                           // present on Purchase
      { "id": "variant_01...", "quantity": 1, "item_price": 25.0 }
    ],
    "transaction_id": "order_01..."         // present on Purchase
  }
}
```

> **Note**: `audience` and `lead_type` are Navitag-custom params, not
> Meta-standard. Forward them as-is — Meta accepts arbitrary custom_data
> keys and they appear in Events Manager as filterable params.

#### Response

- **`200 { "status": "ok" }`** on accepted (event queued/forwarded).
- **`202 { "status": "queued" }`** if you implement async forwarding via
  a queue (Beanstalk / Redis / DB) and process out-of-band — recommended.
- **`400 { "status": "error", "message": "..." }`** for malformed input.
- **`429`** if rate-limited.
- Always respond fast (<100ms ideal). The browser uses `keepalive: true`
  and treats the response as fire-and-forget — but the user-facing
  flow must not block on this.

#### Backend processing logic

1. **Validate** required fields: `event_id`, `event_name`, `event_time`,
   `action_source` (must be `"website"` for these events).
2. **Add `client_ip_address`** from request:
   - Trust the leftmost IP from `X-Forwarded-For` header (cloudflare /
     load balancer prepends client IP). Validate it parses as IPv4/IPv6.
   - Fall back to `REMOTE_ADDR`.
   - Strip private/internal ranges if they appear (defense-in-depth).
3. **Build the Meta payload** — Meta's `/events` endpoint expects:

```jsonc
{
  "data": [
    {
      "event_name": "Lead",
      "event_time": 1714415000,
      "event_id": "f1a2b3c4-...",
      "action_source": "website",
      "event_source_url": "https://navitag.com/contact?subject=...",
      "user_data": {
        "em": ["<sha256>"],                 // arrays per Meta spec
        "ph": ["<sha256>"],
        "fn": ["<sha256>"],
        "ln": ["<sha256>"],
        "ct": ["<sha256>"],
        "country": ["<sha256>"],
        "external_id": ["<sha256>"],
        "fbp": "fb.1.1714415000.0987654321",
        "fbc": "fb.1.1714414000.AbCdEf...",
        "client_ip_address": "203.0.113.42",
        "client_user_agent": "Mozilla/5.0 ..."
      },
      "custom_data": { ... }                // forward as-is
    }
  ],
  "test_event_code": "TEST12345"            // top-level, only in staging
}
```

   Note: hashed identity fields (`em`, `ph`, `fn`, `ln`, `ct`, `country`,
   `external_id`) become **arrays of one** in Meta's payload format —
   Meta supports multiple values per event for cases like merged identities.

4. **POST to Meta**:

```
POST https://graph.facebook.com/v19.0/{META_PIXEL_ID}/events?access_token={META_CAPI_TOKEN}
Content-Type: application/json
Body: <Meta payload from step 3>
```

5. **Log** request + response (status, `events_received`, `messages`,
   `fbtrace_id`) for observability. Errors should surface to your normal
   log/alert pipeline; do **not** retry from inside the request handler
   (return success to the browser regardless and retry async if needed).

6. **Optional but recommended**: queue the forward step. Accept the
   request, persist the payload to a `meta_capi_outbox` table, return
   `202 { status: "queued" }`, and have a worker drain the queue with
   exponential backoff. This survives transient Meta outages.

#### MySQL schema (suggested) — `meta_capi_outbox`

```sql
CREATE TABLE meta_capi_outbox (
  id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  event_id        VARCHAR(64) NOT NULL,
  event_name      VARCHAR(64) NOT NULL,
  event_time      INT UNSIGNED NOT NULL,
  payload         JSON NOT NULL,
  status          ENUM('pending','sent','failed') NOT NULL DEFAULT 'pending',
  attempts        TINYINT UNSIGNED NOT NULL DEFAULT 0,
  last_error      TEXT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at         TIMESTAMP NULL,
  INDEX idx_status_attempts (status, attempts),
  INDEX idx_event_id (event_id)
);
```

`event_id` is **not unique** — the browser may legitimately mirror an
event multiple times if the user closes/reopens (e.g. via the keepalive
fetch firing on unload). Dedup happens at Meta, not in your DB. But
having `event_id` indexed lets you correlate complaints ("I bought but
my Purchase didn't fire") to specific records.

#### Error handling

- **Meta returns 4xx** (bad payload, bad token): mark `failed`, alert.
  Don't retry — payload is broken.
- **Meta returns 5xx** or network error: retry with exponential backoff
  (1m → 5m → 30m → 4h → give up at 6 attempts).
- **Browser sends garbage** (missing required fields): `400` to browser,
  do not enqueue.

#### Observability minimums

- Counter metric `meta_capi_events_total{event_name, status}`
- Latency histogram for the Meta API call
- Alert when `meta_capi_outbox.status='failed'` rows exceed a threshold
  per hour
- Alert when `meta_capi_outbox.status='pending'` and `created_at` >5min
  (queue is stalled)

---

## Scope 2 — MedusaJS v2 (`shopapi.navitag.com`)

Only `Purchase` is owned by Medusa. Everything else routes through
`/v1/meta/capi` on the unified backend.

### Subscriber: `order.placed`

Create a Medusa v2 subscriber that listens for `order.placed` and fires
a server-side Purchase to Meta CAPI with the event_id that the frontend
stuffed into `cart.metadata` before calling `/cart/complete`.

#### Frontend → Medusa contract (already implemented)

Before the frontend POSTs `/store/carts/{cart_id}/complete`, it does:

```ts
await medusaFetch(`/store/carts/${cartId.value}`, {
  method: 'POST',
  body: {
    metadata: {
      // ...preserves prior cart metadata...
      meta_purchase_event_id: '<UUID minted browser-side>',
      meta_fbp: '<_fbp cookie>',
      meta_fbc: '<_fbc cookie>',
      meta_event_source_url: 'https://navitag.com/shop/checkout/cart_01...',
      meta_client_user_agent: 'Mozilla/5.0 ...'
    }
  }
})
```

These keys are guaranteed to be present in `order.metadata` (cart
metadata is copied to order metadata during `/complete`). They may be
empty/undefined for users without `_fbp` / `_fbc` (no Meta cookie set).

#### Subscriber implementation outline

```ts
// src/subscribers/meta-capi-purchase.ts
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import crypto from "node:crypto"

const META_GRAPH = `https://graph.facebook.com/${process.env.META_GRAPH_API_VERSION || "v19.0"}/${process.env.META_PIXEL_ID}/events`

function sha256(input: string | null | undefined): string | null {
  if (!input) return null
  const v = String(input).trim().toLowerCase()
  if (!v) return null
  return crypto.createHash("sha256").update(v).digest("hex")
}

function sha256Phone(input: string | null | undefined): string | null {
  if (!input) return null
  const digits = String(input).replace(/\D+/g, "")
  if (!digits) return null
  return crypto.createHash("sha256").update(digits).digest("hex")
}

export default async function metaCapiPurchaseHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderModule = container.resolve("order")
  const order = await orderModule.retrieveOrder(data.id, {
    relations: ["items", "shipping_address", "billing_address", "customer"],
  })

  const meta = order.metadata || {}
  const eventId = meta.meta_purchase_event_id as string | undefined
  if (!eventId) {
    // No frontend-minted id — skip. (Edge case: order created via admin /
    // direct API call. Don't fire CAPI without dedup parity.)
    return
  }

  const addr = order.shipping_address || order.billing_address
  const userData: Record<string, any> = {
    em: sha256(order.email) ? [sha256(order.email)] : undefined,
    ph: sha256Phone(addr?.phone) ? [sha256Phone(addr?.phone)] : undefined,
    fn: sha256(addr?.first_name) ? [sha256(addr?.first_name)] : undefined,
    ln: sha256(addr?.last_name) ? [sha256(addr?.last_name)] : undefined,
    ct: sha256(addr?.city) ? [sha256(addr?.city)] : undefined,
    country: sha256(addr?.country_code) ? [sha256(addr?.country_code)] : undefined,
    external_id: sha256(meta.firebase_uid as string | undefined) ? [sha256(meta.firebase_uid as string | undefined)] : undefined,
    fbp: meta.meta_fbp || undefined,
    fbc: meta.meta_fbc || undefined,
    client_user_agent: meta.meta_client_user_agent || undefined,
  }

  // Strip undefined keys so Meta doesn't reject the payload.
  Object.keys(userData).forEach(k => userData[k] === undefined && delete userData[k])

  const variantIds = (order.items || []).map(it => it.variant_id).filter(Boolean)
  const numItems = (order.items || []).reduce((n, it) => n + (it.quantity || 0), 0)
  const contents = (order.items || [])
    .filter(it => it.variant_id)
    .map(it => ({
      id: it.variant_id,
      quantity: it.quantity || 1,
      item_price: it.unit_price ?? undefined,
    }))

  // Heuristic: data-plan order vs physical product. Use line-item product
  // category or cart metadata `source` to distinguish if needed.
  const contentType = (meta.source === "shop_buy_now") ? "product" : "data_plan"

  // Audience for storefront/top-up purchases is always b2c today (B2B
  // customers go through /contact, not the public checkout).
  const audience = "b2c"

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        event_source_url: meta.meta_event_source_url || undefined,
        user_data: userData,
        custom_data: {
          currency: order.currency_code?.toUpperCase() || "USD",
          value: order.total ?? 0,
          content_ids: variantIds,
          content_type: contentType,
          contents,
          num_items: numItems,
          transaction_id: order.id,
          audience,
        },
      },
    ],
    ...(process.env.META_TEST_EVENT_CODE
      ? { test_event_code: process.env.META_TEST_EVENT_CODE }
      : {}),
  }

  const url = `${META_GRAPH}?access_token=${encodeURIComponent(process.env.META_CAPI_TOKEN!)}`
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      console.error(`[meta-capi] Purchase forward failed (${res.status})`, body)
    }
  }
  catch (e) {
    console.error("[meta-capi] Purchase forward threw", e)
    // Recommended: enqueue for retry. Same pattern as the unified API.
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
```

#### Important Medusa-specific notes

1. **Cart metadata → order metadata propagation** — Medusa v2 copies
   `cart.metadata` to `order.metadata` during `cart.complete`. Confirm
   with a smoke test on staging that `meta_purchase_event_id` survives
   the transition. If it doesn't, the workflow needs a custom step to
   forward those keys.

2. **`meta_fbp` / `meta_fbc` may be missing** — users who block Meta or
   land without `?fbclid=` won't have these. Send only what's present.
   Meta accepts events without these fields; match quality is lower but
   the event still counts.

3. **Currency**: Medusa stores prices in major units (e.g. `25.00`), not
   cents. Forward as-is. Meta also expects major units.

4. **Idempotency**: Medusa retries `order.placed` on subscriber failure.
   Use `event_id` as the idempotency key — Meta dedupes on its side, so
   a duplicate fire is safe. But to avoid a flood, check
   `order.metadata.meta_capi_sent_at` and skip if already set; update
   that key after a successful Meta response.

5. **Gating**: The subscriber should NOT fire CAPI if:
   - `meta_purchase_event_id` is missing (admin-created order, API order)
   - `META_CAPI_TOKEN` env var is missing (e.g. local dev)
   - The order is `pending_payment` or any non-final status

6. **Test mode**: When `META_TEST_EVENT_CODE` is set, the subscriber
   should still fire — events route to Test Events tab in Meta. Useful
   for verifying staging deploys.

#### Optional: server-side `InitiateCheckout` from Medusa

If you want bulletproof InitiateCheckout (for users who close the tab
before browser fires it), the same pattern works for a `cart.updated`
subscriber that fires when shipping_method is set. Lower priority than
Purchase — start with Purchase only.

---

## Verification checklist (pre-launch)

Before flipping production traffic to the live CAPI token:

### Unified API
- [ ] `POST /v1/meta/capi` returns 200 within 100ms p95
- [ ] CORS preflight (`OPTIONS`) returns proper headers
- [ ] Per-IP rate limit fires above threshold (test with synthetic load)
- [ ] Sample event with `test_event_code` lands in Meta Test Events tab
- [ ] Sample event with bad payload returns 400, not 500
- [ ] `client_ip_address` in Meta payload matches `X-Forwarded-For` leftmost

### Medusa
- [ ] Test order in staging fires Purchase to Test Events tab
- [ ] `event_id` matches between browser fire and Medusa fire (check
      Test Events log shows "Deduplicated" for both events)
- [ ] Order without `meta_purchase_event_id` (admin-created) does NOT fire
- [ ] Subscriber failure is logged but does not block order completion

### End-to-end
- [ ] Real device with Meta Pixel Helper Chrome extension shows the
      browser pixel firing Purchase
- [ ] Same order in Meta Events Manager shows `Server` source AND
      `Browser` source for Purchase, both with the same event_id, dedup
      ratio reported as expected
- [ ] `Lead`, `Contact`, `CompleteRegistration` show similar dedup
      (both browser pixel AND server fire with the same event_id)

---

## Frontend touchpoints (already implemented)

For context, these files in this repo are the source of truth for what
the backend will receive:

| File | What it contributes |
|---|---|
| `app/plugins/meta-pixel.client.ts` | Mints `event_id`, calls `mirrorToCapi()` for every event, pushes Advanced Matching to `fbq('init')` on auth-resolve, captures `_fbp` / `_fbc` |
| `app/utils/metaUserData.ts` | SHA-256 helpers + cookie capture |
| `app/composables/useAudience.ts` | `audience` inference (b2b / b2c) |
| `app/pages/shop/checkout/[cart_id].vue` | Pre-mints purchase_event_id, stuffs `cart.metadata` keys before `/complete`, fires browser Purchase + CAPI mirror with same id |
| `app/pages/plan-checkout/[cart_id].vue` | Same pattern for data-plan checkout |
| `nuxt.config.ts` | Defines `metaCapiEndpoint` and `metaTestEventCode` runtime config |

Frontend changes for CAPI **do not require coordination** with the
backend — the browser already mirrors to whatever endpoint
`metaCapiEndpoint` points at. Until the backend implements
`POST /v1/meta/capi`, mirror calls will 404 silently (browser logs a
warning, page is unaffected).

---

## Out-of-scope

- **Consent gate (intentionally not implemented).** Meta Pixel + CAPI
  mirror fire for every visitor in every jurisdiction by explicit
  product-owner decision; the PH DPA / GDPR / CCPA exposure has been
  accepted in exchange for 100% event coverage. Backend should NOT
  filter incoming `/v1/meta/capi` traffic by jurisdiction or any
  consent flag — frontend will not send one. Re-confirm with the
  product owner before adding any gating logic.
- CAPI for offline conversions (e.g. fleet contracts signed via sales).
  Different Meta endpoint, different auth.
- Per-event CAPI access tokens for principle-of-least-privilege.

---

_Last updated: 2026-04-29. Source-of-truth for the contract — when you
change the request shape on either side, update this document in the
same PR._
