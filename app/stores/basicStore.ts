import { defineStore } from 'pinia'
import type { User } from 'firebase/auth'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { isUtilityPath, resolveRegionFromCountry } from '~/config/regions'
import {
  COUNTRY_LIST,
  findCountry,
  getCountryNameForCode,
  getRegionIdForCountry,
} from '~/utils/countryData'

const MEDUSA_JWT_KEY = 'medusa_jwt'
const AUTH_WAIT_MS = 4000
const IP_TIMEOUT_MS = 3500

function isValidCc(cc: unknown): cc is string {
  return typeof cc === 'string' && /^[A-Z]{2}$/.test(cc.toUpperCase())
}

// Module-level in-flight promise so concurrent callers of resolveCountry()
// share a single fetch instead of racing. Reset when the promise settles.
let inflightCountryResolve: Promise<string | null> | null = null
// Module-level auth subscription guard so initAuth() can be called from
// anywhere (app.vue or defensive calls inside actions) without doubling up.
let authSubscribed = false

/**
 * Basic app-level state. In-memory only — every fresh SPA boot (initial
 * load, hard reload, new tab) starts with defaults, which is exactly the
 * contract we want: banner is not dismissed; first-entry redirect has not
 * been evaluated; auth/country must be re-resolved.
 */
export const useBasicStore = defineStore('basic', {
  state: () => ({
    // Auth
    user: null as User | null,
    authResolved: false,

    // Country
    country: null as string | null,
    countryResolved: false,
    countryLoading: false,

    // Region banner
    bannerDismissed: false,

    // First-entry redirect
    redirectEvaluated: false,
    redirectedFrom: null as string | null,
  }),

  getters: {
    isLoggedIn: state => state.authResolved && !!state.user,
    countryList: () => COUNTRY_LIST,
    countryName: state => getCountryNameForCode(state.country),
    medusaRegionId: state => getRegionIdForCountry(state.country),
  },

  actions: {
    // ─── Auth ──────────────────────────────────────────────────────────
    /** Subscribe to Firebase auth once per SPA boot. Idempotent. */
    initAuth() {
      if (!import.meta.client || authSubscribed) return
      authSubscribed = true
      const { auth } = useFirebase()
      if (!auth) { this.authResolved = true; return }
      onAuthStateChanged(auth, (u) => {
        this.user = u
        this.authResolved = true
      })
    },

    /** Resolve once Firebase's initial auth state has been restored (or time out). */
    ensureAuthResolved(timeoutMs: number = AUTH_WAIT_MS): Promise<void> {
      if (this.authResolved) return Promise.resolve()
      this.initAuth()
      return new Promise((resolveP) => {
        let done = false
        const finish = () => { if (!done) { done = true; resolveP() } }
        const timer = setTimeout(finish, timeoutMs)
        const stop = this.$subscribe(() => {
          if (this.authResolved) {
            clearTimeout(timer)
            stop()
            finish()
          }
        })
      })
    },

    async logout(options: { redirect?: string } = {}) {
      if (!import.meta.client) return
      const { auth } = useFirebase()
      try { if (auth) await signOut(auth) }
      catch { /* ignore */ }
      try { localStorage.removeItem(MEDUSA_JWT_KEY) }
      catch { /* ignore */ }
      this.user = null
      this.clearCountry()
      if (options.redirect) navigateTo(options.redirect)
    },

    // ─── Country ───────────────────────────────────────────────────────
    /**
     * Resolve the user's country code (ISO alpha-2). No persistent cache —
     * country lives in Pinia state and is re-resolved on every fresh SPA
     * boot so DB updates propagate immediately on the next page load.
     *   1. Wait briefly for Firebase auth restore → backend sync if logged in
     *   2. IP geolocation fallback
     * Within a single SPA session, the result is held in `state.country` so
     * concurrent callers share one fetch via `inflightCountryResolve`.
     */
    async resolveCountry(force = false): Promise<string | null> {
      if (!import.meta.client) return null
      if (!force && this.countryResolved) return this.country
      if (inflightCountryResolve) return inflightCountryResolve

      inflightCountryResolve = (async () => {
        this.countryLoading = true
        try {
          await this.ensureAuthResolved()

          // Authenticated → backend sync is authoritative.
          if (this.user) {
            const fromBackend = await this.fetchCountryFromBackend(this.user)
            if (fromBackend) {
              this.country = fromBackend
              this.countryResolved = true
              return fromBackend
            }
          }

          // IP fallback (also covers signed-out visitors).
          const fromIp = await fetchCountryFromIp()
          if (fromIp) {
            this.country = fromIp
            this.countryResolved = true
            return fromIp
          }

          this.countryResolved = true
          return null
        }
        finally {
          this.countryLoading = false
          inflightCountryResolve = null
        }
      })()

      return inflightCountryResolve
    },

    async fetchCountryFromBackend(user: User): Promise<string | null> {
      try {
        const { backendSync } = useBackendSync()
        const res = await backendSync(user)
        if (res && typeof res === 'object' && 'country_code' in res) {
          const cc = (res as { country_code?: unknown }).country_code
          if (isValidCc(cc)) return (cc as string).toUpperCase()
        }
      }
      catch { /* ignore */ }
      return null
    },

    clearCountry() {
      this.country = null
      this.countryResolved = false
    },

    // Convenience wrappers that mirror the pure helpers.
    getRegionId(cc: string | null | undefined) { return getRegionIdForCountry(cc) },
    getCountryName(cc: string | null | undefined) { return getCountryNameForCode(cc) },
    findCountryByCode(cc: string | null | undefined) { return findCountry(cc) },

    // ─── Region banner ─────────────────────────────────────────────────
    dismissBanner() { this.bannerDismissed = true },
    resetBanner() { this.bannerDismissed = false },

    // ─── First-entry redirect ──────────────────────────────────────────
    /**
     * Idempotent per SPA boot. Routes the visitor to their country's regional
     * equivalent of the page they landed on; unserviced countries and
     * utility pages are left alone.
     */
    async runFirstEntryRedirect() {
      if (!import.meta.client) return
      if (this.redirectEvaluated) return
      this.redirectEvaluated = true

      const router = useRouter()
      const route = router.currentRoute.value

      if (isUtilityPath(route.path)) return

      const country = await this.resolveCountry()
      if (!country) return

      const region = resolveRegionFromCountry(country)
      const targetBasePath = region?.basePath ?? '/'

      const { toRegionalPath, routeExists } = useRegionRoutes()
      const target = toRegionalPath(route.path, targetBasePath)

      if (target === route.path) return
      if (!routeExists(target)) return

      this.redirectedFrom = route.path
      // Preserve query (utm_*, fbclid, gclid, …) and hash across the
      // regional redirect — a bare path string would drop them, breaking
      // ad attribution and the Meta pixel's _fbc cookie capture.
      router.replace({ path: target, query: route.query, hash: route.hash })
    },
  },
})

// ─── Helpers local to this module ───────────────────────────────────────

async function fetchCountryFromIp(): Promise<string | null> {
  try {
    const res = await fetch('https://api.country.is/', {
      signal: AbortSignal.timeout(IP_TIMEOUT_MS),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = (await res.json()) as { country?: string }
    if (isValidCc(data.country)) return data.country!.toUpperCase()
  }
  catch { /* ignore */ }
  return null
}
