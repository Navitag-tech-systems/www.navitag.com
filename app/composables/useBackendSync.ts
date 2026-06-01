import { UNIFIED_API_URL } from '~/variables'
import { fetchCountryFromIp } from '~/utils/ipCountry'

let countryCodeCache: string | null = null

async function fetchCountryCode(): Promise<string | null> {
  if (countryCodeCache) return countryCodeCache

  // Cloudflare trace, kept resilient for the signup / backend-sync flow:
  // 5s timeout × 3 attempts, 500ms backoff.
  countryCodeCache = await fetchCountryFromIp({ timeoutMs: 5000, retries: 2, retryDelayMs: 500 })
  if (!countryCodeCache) {
    console.error('[BackendSync] Failed to detect country code after retries')
  }
  return countryCodeCache
}

export function useBackendSync() {
  async function backendSync(firebaseUser: any, name?: string | null, overrideCountryCode?: string | null) {
    try {
      const idToken = await firebaseUser.getIdToken()
      const countryCode = overrideCountryCode || await fetchCountryCode()

      if (!countryCode) {
        console.error('[BackendSync] No country code — cannot sync')
        return false
      }

      const data: Record<string, string> = { country_code: countryCode }

      // Name priority: explicit param > Apple localStorage cache > Firebase displayName
      if (name) {
        data.name = name
      } else {
        const cachedName = localStorage.getItem('apple_pending_name')
        if (cachedName) {
          data.name = cachedName
        } else if (firebaseUser.displayName) {
          data.name = firebaseUser.displayName
        }
      }

      if (firebaseUser.email) data.email = firebaseUser.email
      if (firebaseUser.phoneNumber) data.phone = firebaseUser.phoneNumber

      const res = await $fetch<{ status: string; server_url?: string; name?: string; phone?: string; country_code?: string | null }>(`${UNIFIED_API_URL}/user/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
        body: data,
      })

      localStorage.removeItem('apple_pending_name')
      // Note: country code is intentionally NOT cached to localStorage —
      // basicStore re-resolves country from this endpoint on every SPA boot
      // so backend updates propagate immediately on the next page load.
      return res
    } catch (e) {
      console.error('[BackendSync] Sync failed:', e)
      return false
    }
  }

  return { backendSync, fetchCountryCode }
}
