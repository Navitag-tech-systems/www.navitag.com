import type { Auth } from 'firebase/auth'
import { MEDUSA_BACKEND_URL, MEDUSA_PUBLISHABLE_KEY } from '~/variables'

let refreshInFlight: Promise<string> | null = null

async function exchangeToken(auth: Auth): Promise<string> {
  const user = auth.currentUser
  if (!user) throw new Error('No Firebase session')
  const idToken = await user.getIdToken(true)
  const res = await $fetch<{ token: string }>(`${MEDUSA_BACKEND_URL}/auth/customer/firebase`, {
    method: 'POST',
    body: { id_token: idToken },
  })
  if (import.meta.client) localStorage.setItem('medusa_jwt', res.token)
  return res.token
}

export function useMedusa(opts: { publishableKey?: string } = {}) {
  const { auth } = useFirebase()
  const publishableKey = opts.publishableKey ?? MEDUSA_PUBLISHABLE_KEY

  async function ensureToken(): Promise<string> {
    if (import.meta.client) {
      const existing = localStorage.getItem('medusa_jwt')
      if (existing) return existing
    }
    if (!refreshInFlight) {
      refreshInFlight = exchangeToken(auth).finally(() => { refreshInFlight = null })
    }
    return refreshInFlight
  }

  async function refreshToken(): Promise<string> {
    if (!refreshInFlight) {
      refreshInFlight = exchangeToken(auth).finally(() => { refreshInFlight = null })
    }
    return refreshInFlight
  }

  async function medusaFetch<T = any>(
    path: string,
    options: Parameters<typeof $fetch>[1] = {},
  ): Promise<T> {
    const token = await ensureToken()
    const baseHeaders: Record<string, string> = {
      'x-publishable-api-key': publishableKey,
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string> | undefined),
    }

    try {
      return await $fetch<T>(`${MEDUSA_BACKEND_URL}${path}`, { ...options, headers: baseHeaders })
    } catch (e: any) {
      if (e?.response?.status !== 401 || !auth.currentUser) throw e
      const fresh = await refreshToken()
      baseHeaders.Authorization = `Bearer ${fresh}`
      return await $fetch<T>(`${MEDUSA_BACKEND_URL}${path}`, { ...options, headers: baseHeaders })
    }
  }

  return { ensureToken, refreshToken, medusaFetch }
}
