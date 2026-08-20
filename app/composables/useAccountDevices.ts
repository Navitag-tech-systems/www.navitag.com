import type { User } from 'firebase/auth'
import { UNIFIED_API_URL } from '~/variables'

/**
 * The signed-in user's devices, with subscription expiry.
 *
 * TWO CALLS, because neither endpoint alone is enough:
 *   GET /user/device-expiration  -> imei, expiration, plan_level, sim_provider
 *   GET /device/list             -> the Traccar objects, which carry the NAME
 *
 * Merged on IMEI (`imei` here, `uniqueId` there). Names matter more than any
 * other field on this screen — nobody recognises their car by a 15-digit
 * number — but the expiry endpoint has never returned one.
 *
 * Owner-only by construction: /user/device-expiration joins
 * users.auth_uid -> server_user_id, so a device someone merely SHARED with this
 * account is absent by design, not by failure. The page says so rather than
 * looking broken to a user who knows they can see more devices in the app.
 */

export interface AccountDevice {
  imei: string
  name: string | null
  plan: string | null
  expiresAt: string | null
  daysRemaining: number | null
  expired: boolean
  renewableInApp: boolean
}

interface ExpiryRow {
  imei: string | number
  expiration: string | null
  plan_level: string | null
  sim_provider: string | null
  actionable?: boolean
}

export function useAccountDevices() {
  const devices = ref<AccountDevice[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const loaded = ref(false)

  async function load(user: User | null, force = false) {
    if (!user) return
    if (loaded.value && !force) return

    loading.value = true
    error.value = null

    try {
      const idToken = await user.getIdToken()
      const headers = { Authorization: `Bearer ${idToken}` }

      // Names are a nicety; expiry is the point of the screen. If /device/list
      // fails (Traccar outage -> 502) we still render the list, with IMEIs
      // where names would be, rather than showing nothing.
      const [expiryRes, listRes] = await Promise.allSettled([
        $fetch<{ status?: string, devices?: ExpiryRow[], message?: ExpiryRow[] }>(
          `${UNIFIED_API_URL}/user/device-expiration`, { headers },
        ),
        $fetch<{ status?: string, devices?: Array<{ uniqueId?: string, name?: string }> }>(
          `${UNIFIED_API_URL}/device/list`, { headers },
        ),
      ])

      if (expiryRes.status === 'rejected') throw expiryRes.reason

      // The payload key was renamed `message` -> `devices` on 2026-08-20. Both
      // are read so this page does not depend on which side deployed first.
      const rows = expiryRes.value?.devices ?? expiryRes.value?.message ?? []

      const names = new Map<string, string>()
      if (listRes.status === 'fulfilled') {
        for (const d of listRes.value?.devices ?? []) {
          if (d.uniqueId) names.set(String(d.uniqueId), d.name || '')
        }
      }

      const now = Date.now()
      devices.value = rows
        .map((r): AccountDevice => {
          const expiresAt = r.expiration || null
          const days = expiresAt
            ? Math.floor((new Date(expiresAt).getTime() - now) / 86400000)
            : null
          return {
            imei: String(r.imei),
            name: names.get(String(r.imei)) || null,
            plan: r.plan_level || null,
            expiresAt,
            daysRemaining: days,
            expired: days !== null ? days < 0 : false,
            renewableInApp: r.actionable === true,
          }
        })
        // Soonest to expire first — the only ordering that puts the thing
        // needing action at the top.
        .sort((a, b) => (a.daysRemaining ?? Number.MAX_SAFE_INTEGER) - (b.daysRemaining ?? Number.MAX_SAFE_INTEGER))

      loaded.value = true
    }
    catch (e: any) {
      error.value = e?.data?.error || e?.message || 'Could not load your devices.'
      devices.value = []
    }
    finally {
      loading.value = false
    }
  }

  return { devices, loading, error, loaded, load }
}
