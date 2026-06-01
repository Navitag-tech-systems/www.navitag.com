// Meta Pixel boot + typed $fbq helper.
//
// Every track call attaches an `eventID` (UUID) so the server-side CAPI
// mirror dedupes against the browser pixel. Helpers return the id for that
// purpose; existing call sites are free to ignore the return.
//
// Audience tagging (b2c vs b2b):
//   • Every event auto-attaches `audience` inferred from the active route
//     unless the caller passes an explicit value in params.
//   • For lead-shaped standard events (Lead, Contact, CompleteRegistration,
//     SubmitApplication, Schedule), a parallel custom event named
//     `LeadB2B` or `LeadB2C` is fired so Ads Manager can build clean
//     audiences without param filters.
//
// CAPI mirror:
//   • Every track / trackCustom call POSTs to the dedicated CAPI service
//     at capi.navitag.app with the same event_id, hashed user_data
//     (incl. _fbp / _fbc cookies), event_source_url, and custom_data.
//   • Backend forwards to Meta with the access token + the request IP
//     (which the browser cannot reliably know).
//   • Fire-and-forget: failures never block UI.
//
// Advanced Matching:
//   • On boot we init the pixel with no user data so anonymous traffic
//     works. When useBasicStore() resolves an authed user, we re-init
//     with hashed em / external_id / country so subsequent events carry
//     identity (for both browser pixel and CAPI mirror).
import { inferAudience, type Audience } from '~/composables/useAudience'
import {
  buildCapiUserData,
  ensureFbp,
  getAnonymousExternalId,
  hashIdentity,
  type CapiUserData,
  type HashedUserData,
} from '~/utils/metaUserData'

export interface FbqHelper {
  /** Fire a Meta standard event (Purchase, Lead, AddToCart, …). Returns event_id. */
  (event: string, params?: Record<string, any>): string
  /** Fire a custom event via fbq('trackCustom', ...). Returns event_id. */
  custom: (event: string, params?: Record<string, any>) => string
  /**
   * Mirror a pre-minted event_id to CAPI without firing the browser pixel.
   * Used by checkout flows where the same event_id is also stuffed into
   * Medusa cart metadata so the backend can fire server-side Purchase
   * with matching dedup.
   */
  mirror: (event: string, params: Record<string, any>, eventId: string) => Promise<void>
}

function newEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID (older Safari).
  return 'evt-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
}

// Standard events that represent a "lead" of some kind. These get the
// parallel LeadB2B / LeadB2C custom emission for audience builds.
const LEAD_SHAPED = new Set([
  'Lead',
  'Contact',
  'CompleteRegistration',
  'SubmitApplication',
  'Schedule',
])

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig().public
  const PIXEL_ID = config.metaPixelId as string
  const CAPI_ENDPOINT = (config.metaCapiEndpoint as string) || ''
  const TEST_EVENT_CODE = (config.metaTestEventCode as string) || ''
  if (!PIXEL_ID) return

  ;(function (f: any, b, e, v, n?: any, t?: any, s?: any) {
    if (f.fbq) return
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
    }
    if (!f._fbq) f._fbq = n
    n.push = n
    n.loaded = true
    n.version = '2.0'
    n.queue = []
    t = b.createElement(e)
    t.async = true
    t.src = v
    s = b.getElementsByTagName(e)[0]
    s.parentNode.insertBefore(t, s)
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')

  const fbq = (window as any).fbq
  // Seed _fbp before init so the browser pixel adopts it and every CAPI mirror
  // (including events firing before fbevents.js writes the cookie) carries the
  // same Browser ID. Lifts fbp match coverage.
  ensureFbp()
  fbq('init', PIXEL_ID)

  // Run `cb` once fbevents.js has executed — at which point it has written
  // the `_fbp` (and, if `?fbclid=` is present, `_fbc`) cookies that the CAPI
  // mirror needs for matching. We key off the script's `load` event rather
  // than a timeout: `fbq.callMethod` only exists after the real library runs,
  // so if it's already there we're ready; otherwise wait for `load` (and
  // treat `error` / a missing tag as "ready" so a blocked pixel still mirrors
  // — event_id dedup works even without the cookies).
  function whenPixelReady(cb: () => void): void {
    if (typeof fbq?.callMethod === 'function') { cb(); return }
    const tag = document.querySelector<HTMLScriptElement>('script[src*="fbevents.js"]')
    if (!tag) { cb(); return }
    tag.addEventListener('load', cb, { once: true })
    tag.addEventListener('error', cb, { once: true })
  }

  // Boot PageView — mirror to CAPI with the SAME event_id so the two halves
  // dedupe. Without a server-side counterpart for the first PageView of every
  // session, Events Manager reports a low "events covered by Conversions API"
  // rate, which Meta correlates with a higher cost per result. Defer the
  // mirror until the pixel library has set its cookies (see above).
  const bootPageViewId = newEventId()
  fbq('track', 'PageView', {}, { eventID: bootPageViewId })
  whenPixelReady(async () => {
    // Let country resolve first so the boot PageView's CAPI mirror carries it
    // (raises Country match coverage). resolveCountry shares one in-flight
    // request, so this adds no extra fetch; the app already shows the boot
    // loader during this window. keepalive on the mirror covers a fast bounce.
    try { await useBasicStore().resolveCountry() }
    catch { /* ignore — mirror anyway */ }
    void mirrorToCapi('PageView', {}, bootPageViewId)
  })

  const router = useRouter()
  // In Nuxt the router isn't "ready" when client plugins run, so afterEach
  // also fires once for the initial navigation — already covered by the boot
  // PageView above. Swallow that single duplicate; every later SPA navigation
  // gets a fresh browser + CAPI PageView pair sharing one event_id.
  const bootFullPath = router.currentRoute.value.fullPath
  let swallowedBoot = false
  router.afterEach((to) => {
    if (!swallowedBoot && to.fullPath === bootFullPath) {
      swallowedBoot = true
      return
    }
    const eid = newEventId()
    ;(window as any).fbq?.('track', 'PageView', {}, { eventID: eid })
    void mirrorToCapi('PageView', {}, eid)
  })

  // ─── Advanced Matching: re-init when auth resolves ───────────────────
  // Cached AM payload so subsequent events from the browser pixel carry
  // identity. Also reused as the hashed user_data baseline when mirroring
  // events to CAPI (each event's mirror call merges in fresh _fbp/_fbc/UA).
  let cachedAdvancedMatching: HashedUserData = {}

  async function pushAdvancedMatching() {
    try {
      const basic = useBasicStore()
      const user = basic.user
      const country = basic.country || null

      // Country is non-identifying, so attach it for everyone — anonymous
      // visitors are the bulk of traffic and previously carried no Advanced
      // Matching at all, tanking Country match coverage. Authed users also
      // get em / external_id.
      // Phone / first / last names are not collected at signup today; plumb
      // them here when the backend starts surfacing them.
      const hashed = await hashIdentity({
        email: user?.email,
        // Real UID when authed, else a stable anonymous browser id, so every
        // visitor carries an external_id (not just logged-in ones).
        externalId: user?.uid || getAnonymousExternalId(),
        countryCode: country,
      })
      cachedAdvancedMatching = hashed
      ;(window as any).fbq?.('init', PIXEL_ID, hashed)
    }
    catch (e) {
      // AM is best-effort — never break the pixel if hashing fails.
      console.warn('[meta-pixel] pushAdvancedMatching failed', e)
    }
  }

  // Watch the auth store. We delay the first push until after the plugin
  // returns so useBasicStore() is available — Pinia is set up by then.
  nuxtApp.hook('app:mounted', () => {
    const basic = useBasicStore()
    // Initial push if already resolved by mount time.
    if (basic.authResolved) void pushAdvancedMatching()
    // Re-push on any change in auth state or country (changes the AM payload).
    basic.$subscribe(() => {
      if (basic.authResolved) void pushAdvancedMatching()
    })
  })

  // ─── CAPI mirror dispatch ────────────────────────────────────────────
  async function mirrorToCapi(
    eventName: string,
    customData: Record<string, any>,
    eventId: string,
  ): Promise<void> {
    if (!CAPI_ENDPOINT) return
    try {
      const userData: CapiUserData = await buildCapiUserData({
        // Re-fetch live identity at fire time so the hashed payload is
        // current even if the user just logged in seconds ago.
        ...(() => {
          try {
            const basic = useBasicStore()
            return {
              email: basic.user?.email,
              externalId: basic.user?.uid || getAnonymousExternalId(),
              countryCode: basic.country,
            }
          }
          catch {
            return { externalId: getAnonymousExternalId() }
          }
        })(),
      })

      const payload = {
        event_id: eventId,
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: typeof window !== 'undefined' ? window.location.href : undefined,
        ...(TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : {}),
        user_data: userData,
        custom_data: customData,
      }

      // keepalive lets the request survive page navigation / unload —
      // important for Purchase, where the user is about to be redirected.
      await fetch(CAPI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
        // Mirror is anonymous-tolerant on the backend — no auth header.
        // Backend rate-limits per-IP; do not retry from the browser.
        credentials: 'omit',
      })
    }
    catch (e) {
      // Best-effort: never let CAPI mirror failures break the page.
      console.warn(`[meta-pixel] CAPI mirror failed for ${eventName}`, e)
    }
  }

  /**
   * Decorate a params object with the inferred `audience` (b2c | b2b) unless
   * the caller already set one. Reads from `window.location.pathname` since
   * this runs after navigation has settled.
   */
  function decorate(params: Record<string, any> | undefined): Record<string, any> {
    const next: Record<string, any> = { ...(params || {}) }
    if (!next.audience) next.audience = inferAudience()
    return next
  }

  function track(event: string, params?: Record<string, any>): string {
    const eventId = newEventId()
    const decorated = decorate(params)
    ;(window as any).fbq?.('track', event, decorated, { eventID: eventId })

    // Parallel custom for lead-shaped events so audiences in Ads Manager
    // don't require a custom-param filter.
    if (LEAD_SHAPED.has(event)) {
      const audience: Audience = decorated.audience
      const parallelName = audience === 'b2b' ? 'LeadB2B' : 'LeadB2C'
      ;(window as any).fbq?.(
        'trackCustom',
        parallelName,
        {
          source_event: event,
          content_name: decorated.content_name,
          content_category: decorated.content_category,
          lead_type: decorated.lead_type,
          value: decorated.value,
          currency: decorated.currency,
        },
        { eventID: newEventId() },
      )
    }

    // Fire-and-forget CAPI mirror.
    void mirrorToCapi(event, decorated, eventId)

    return eventId
  }

  function trackCustom(event: string, params?: Record<string, any>): string {
    const eventId = newEventId()
    const decorated = decorate(params)
    ;(window as any).fbq?.('trackCustom', event, decorated, { eventID: eventId })
    void mirrorToCapi(event, decorated, eventId)
    return eventId
  }

  /**
   * Mirror a pre-minted event_id to CAPI without firing the browser pixel.
   * Use when the same event_id is going to be sent server-side from another
   * system (e.g. Medusa order-placed subscriber for Purchase) and you want
   * the browser-side mirror to dedup against it.
   */
  async function mirror(
    event: string,
    params: Record<string, any>,
    eventId: string,
  ): Promise<void> {
    return mirrorToCapi(event, decorate(params), eventId)
  }

  // Global click listener for CMS / template data-pixel-* tracked CTAs.
  // Recognized attributes:
  //   data-pixel-event        — standard event name (or "Custom")
  //   data-pixel-custom-name  — used when data-pixel-event="Custom"
  //   data-pixel-content-name — content_name param
  //   data-pixel-content-category — content_category param
  //   data-pixel-value        — numeric, paired with data-pixel-currency
  //   data-pixel-currency     — ISO code, defaults to USD when value is set
  //   data-pixel-audience     — 'b2b' | 'b2c' override (else route-inferred)
  //   data-pixel-lead-type    — free-form lead categorization
  const RESERVED_EVENTS = new Set(['PageView', 'ViewContent', 'Purchase'])

  document.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement)?.closest<HTMLElement>('[data-pixel-event]')
    if (!target) return

    const event = target.dataset.pixelEvent
    if (!event || RESERVED_EVENTS.has(event)) return

    const params: Record<string, any> = {}

    if (target.dataset.pixelContentName) {
      params.content_name = target.dataset.pixelContentName
    }
    if (target.dataset.pixelContentCategory) {
      params.content_category = target.dataset.pixelContentCategory
    }
    if (target.dataset.pixelLeadType) {
      params.lead_type = target.dataset.pixelLeadType
    }
    if (target.dataset.pixelAudience === 'b2b' || target.dataset.pixelAudience === 'b2c') {
      params.audience = target.dataset.pixelAudience
    }

    if (event === 'Custom' && target.dataset.pixelCustomName) {
      trackCustom(target.dataset.pixelCustomName, params)
      return
    }

    if (target.dataset.pixelValue) {
      params.value = parseFloat(target.dataset.pixelValue)
      params.currency = target.dataset.pixelCurrency || 'USD'
      if (!target.dataset.pixelCurrency) {
        console.warn('[meta-pixel] data-pixel-value set without data-pixel-currency, defaulting to USD')
      }
    }

    track(event, params)
  })

  const helper = track as FbqHelper
  helper.custom = trackCustom
  helper.mirror = mirror

  return {
    provide: {
      fbq: helper,
    },
  }
})

declare module '#app' {
  interface NuxtApp {
    $fbq: FbqHelper
  }
}
declare module 'vue' {
  interface ComponentCustomProperties {
    $fbq: FbqHelper
  }
}
