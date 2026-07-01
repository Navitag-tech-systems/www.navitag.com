<script setup lang="ts">
import { MEDUSA_BACKEND_URL } from '~/variables'
import { XENDIT_RETURN_KEY, type XenditReturnState } from '~/composables/useXenditCheckout'

definePageMeta({ layout: false })
useHead({ title: 'Navitag — Confirming Payment' })
useSeoMeta({ robots: 'noindex, nofollow' })

const { $fbq } = useNuxtApp()

type Status = 'confirming' | 'processing' | 'error' | 'no_session'
const status = ref<Status>('confirming')
const message = ref('')

let state: XenditReturnState | null = null

// Cart routes are authorized by the cart id + publishable key — no customer
// JWT needed — so we hit Medusa directly with $fetch and the stashed key.
// This avoids any Firebase-auth-resolution race on a fresh page load.
function api<T = any>(path: string, opts: any = {}): Promise<T> {
  return $fetch<T>(`${MEDUSA_BACKEND_URL}${path}`, {
    ...opts,
    headers: { 'x-publishable-api-key': state!.pubKey, ...(opts.headers || {}) },
  })
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

function readState(): XenditReturnState | null {
  if (!import.meta.client) return null
  try {
    const raw = localStorage.getItem(XENDIT_RETURN_KEY)
    return raw ? JSON.parse(raw) as XenditReturnState : null
  }
  catch { return null }
}

function completionPath(orderId: string): string {
  return state?.flow === 'topup'
    ? `/renew-complete/${orderId}`
    : `/shop/order-complete/${orderId}`
}

function trackPurchase(order: any) {
  try {
    const variantIds = (order.items || []).map((it: any) => it.variant_id).filter(Boolean)
    const numItems = (order.items || []).reduce((n: number, it: any) => n + (it.quantity || 0), 0)
    const params = {
      value: order.total ?? 0,
      currency: (order.currency_code || 'PHP').toUpperCase(),
      content_ids: variantIds,
      content_type: state?.flow === 'topup' ? 'data_plan' : 'product',
      num_items: numItems,
      transaction_id: order.id,
      audience: 'b2c' as const,
    }
    const eventId = (order.metadata as any)?.meta_purchase_event_id
      || `evt-${order.id}`
    ;(window as any).fbq?.('track', 'Purchase', params, { eventID: eventId })
    void $fbq.mirror('Purchase', params, eventId)
  }
  catch { /* tracking is best-effort */ }
}

/** One /complete attempt. Returns the order if placed, else null. */
async function tryComplete(): Promise<any | null> {
  try {
    const res = await api<{ type: string, order?: any }>(
      `/store/carts/${state!.cartId}/complete`,
      { method: 'POST' },
    )
    if (res?.type === 'order' && res.order?.id) return res.order
    return null
  }
  catch { return null }
}

async function stashMetaDedup() {
  // Mirror the PayPal flow: pre-mint a Purchase event_id + _fbp/_fbc into cart
  // metadata so Medusa's order-placed subscriber fires a server-side CAPI
  // Purchase with the same id (Meta dedupes). Best-effort, never blocks.
  try {
    const cartRes = await api<{ cart: any }>(`/store/carts/${state!.cartId}`)
    const meta = cartRes.cart?.metadata || {}
    if (meta.meta_purchase_event_id) return // already stamped on a prior attempt
    const { readFbCookies } = await import('~/utils/metaUserData')
    const { fbp, fbc } = readFbCookies()
    const eventId = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    await api(`/store/carts/${state!.cartId}`, {
      method: 'POST',
      body: {
        metadata: {
          ...meta,
          meta_purchase_event_id: eventId,
          meta_fbp: fbp || undefined,
          meta_fbc: fbc || undefined,
          meta_event_source_url: typeof window !== 'undefined' ? window.location.href : undefined,
          meta_client_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        },
      },
    })
  }
  catch { /* non-fatal */ }
}

async function run() {
  state = readState()
  if (!state?.cartId) {
    status.value = 'no_session'
    return
  }

  await stashMetaDedup()

  // Poll /complete. The customer just authorized in their wallet; the webhook
  // (or our authorizePayment live-poll of Xendit) flips the session to
  // captured, after which /complete mints the order. ~90s budget.
  const DEADLINE_MS = 90_000
  const INTERVAL_MS = 2_500
  const start = Date.now()

  while (Date.now() - start < DEADLINE_MS) {
    const order = await tryComplete()
    if (order) {
      trackPurchase(order)
      if (import.meta.client) localStorage.removeItem(XENDIT_RETURN_KEY)
      await navigateTo(completionPath(order.id))
      return
    }
    await sleep(INTERVAL_MS)
  }

  // Timed out — payment may still be settling. Leave the marker so "Check
  // again" can resume; the order will also fulfil server-side once captured.
  status.value = 'processing'
}

async function checkAgain() {
  status.value = 'confirming'
  await run()
  if (status.value === 'confirming') status.value = 'processing'
}

onMounted(run)
</script>

<template>
  <div class="min-h-screen bg-navitag-bg flex items-center justify-center px-6 py-12">
    <div class="max-w-md w-full text-center">
      <!-- Confirming -->
      <div v-if="status === 'confirming'">
        <i class="fas fa-spinner fa-spin fa-2x text-navitag-blue mb-5"></i>
        <h1 class="text-xl font-extrabold text-gray-950 mb-2">Confirming your payment…</h1>
        <p class="text-sm text-gray-500">
          Please don't close this window. We're verifying your e-wallet payment and creating your order.
        </p>
      </div>

      <!-- Still processing (timed out) -->
      <div v-else-if="status === 'processing'">
        <div class="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-clock text-amber-400 fa-2x"></i>
        </div>
        <h1 class="text-xl font-extrabold text-gray-950 mb-2">Payment is processing</h1>
        <p class="text-sm text-gray-500 mb-6">
          Your payment is taking a little longer than usual to confirm. If it went through, you'll receive a
          confirmation email shortly and your order will be processed automatically.
        </p>
        <div class="flex flex-col gap-3">
          <button
            class="w-full py-3 rounded-xl bg-navitag-blue text-white font-semibold text-sm hover:bg-opacity-90 transition"
            @click="checkAgain"
          >
            <i class="fas fa-rotate-right mr-2"></i>Check again
          </button>
          <NuxtLink to="/my-account" class="text-sm text-navitag-blue hover:underline">Go to my account</NuxtLink>
        </div>
      </div>

      <!-- No session marker -->
      <div v-else-if="status === 'no_session'">
        <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-circle-question text-gray-400 fa-2x"></i>
        </div>
        <h1 class="text-xl font-extrabold text-gray-950 mb-2">No checkout in progress</h1>
        <p class="text-sm text-gray-500 mb-6">
          We couldn't find a checkout to confirm. If you completed a payment, please check your email or your
          account for the order.
        </p>
        <NuxtLink to="/" class="inline-block px-6 py-2.5 rounded-full bg-navitag-blue text-white text-sm font-semibold hover:bg-opacity-90 transition">
          Go Home
        </NuxtLink>
      </div>

      <!-- Error -->
      <div v-else>
        <div class="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-times-circle text-red-400 fa-2x"></i>
        </div>
        <h1 class="text-xl font-extrabold text-gray-950 mb-2">Something went wrong</h1>
        <p class="text-sm text-gray-500 mb-6">{{ message || 'We could not confirm your payment.' }}</p>
        <NuxtLink to="/" class="inline-block px-6 py-2.5 rounded-full bg-navitag-blue text-white text-sm font-semibold hover:bg-opacity-90 transition">
          Go Home
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
