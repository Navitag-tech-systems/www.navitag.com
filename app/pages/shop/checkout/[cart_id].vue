<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { MEDUSA_PRODUCTS_PUBLISHABLE_KEY } from '~/variables'

definePageMeta({
  layout: false,
  middleware: [(to, from) => {
    // Only reachable as a continuation of the shipping step. Direct loads,
    // refreshes, and external referrers all bounce to /shop. Nuxt sets
    // `from === to` on initial loads / refreshes, so those are caught too.
    if (from.path !== '/shop/shipping') return navigateTo('/shop')
  }],
})

const PAYPAL_CLIENT_ID = useRuntimeConfig().public.paypalClientId as string

const route = useRoute()
const cartId = computed(() => route.params.cart_id as string)

const { medusaFetch } = useMedusa({ publishableKey: MEDUSA_PRODUCTS_PUBLISHABLE_KEY })
const { auth } = useFirebase()
const { $fbq } = useNuxtApp()

useHead({ title: 'Navitag Shop — Checkout' })
useSeoMeta({ robots: 'noindex, nofollow' })

// ─── State ────────────────────────────────────────────────────────────
const cart = ref<any>(null)
const loading = ref(true)
const error = ref('')
const email = ref('')

const paymentReady = ref(false)
const paymentLoading = ref(false)
const paymentError = ref('')
const paying = ref(false)

let cardFields: any = null
const cardValid = ref(false)

// Address review cards default to collapsed — the customer just left
// the shipping page, so the values are fresh in their head.
const shipOpen = ref(false)
const billOpen = ref(false)

// Finalizing covers the window between 3DS close → onApprove fires →
// Medusa /complete returns → navigation. Without this overlay the
// customer briefly sees the checkout page after the 3DS modal closes,
// which reads as "did my payment go through?".
const finalizing = ref(false)

// Hard-failure modal: shown when payment cannot recover with a simple
// retry (post-capture complete() failure, unrecoverable PayPal error).
// Submit-time validation / 3DS-cancel errors stay as inline messages.
const paymentFailed = ref(false)
const paymentFailureMsg = ref('')
const paymentFailureMode = ref<'reinit' | 'retry-complete'>('reinit')

// Cap automatic / user-initiated retries at 1. After the customer has
// already retried once and still failed, the modal only offers a "Back"
// path — repeated retries on a stuck cart usually indicate a real
// payment problem the customer should escalate via shipping/contact.
const RETRY_LIMIT = 1
const retryCount = ref(0)
const canRetry = computed(() => retryCount.value < RETRY_LIMIT)

function handleCardChange(state: any) {
  const f = state?.fields || {}
  cardValid.value = !!(
    f.cardNumberField?.isValid
    && f.cardExpiryField?.isValid
    && f.cardCvvField?.isValid
  )
}

// ─── PayPal SDK loader (mirrors plan-checkout) ────────────────────────
function loadPayPalSDK(clientToken: string, currency: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).paypal) return resolve((window as any).paypal)
    const script = document.createElement('script')
    script.src = 'https://www.paypal.com/sdk/js?' + new URLSearchParams({
      'client-id': PAYPAL_CLIENT_ID,
      components: 'card-fields',
      currency,
      intent: 'authorize',
    }).toString()
    script.setAttribute('data-client-token', clientToken)
    script.onload = () => resolve((window as any).paypal)
    script.onerror = () => reject(new Error('Failed to load PayPal SDK'))
    document.head.appendChild(script)
  })
}

// ─── Lifecycle ────────────────────────────────────────────────────────
onMounted(async () => {
  if (auth.currentUser?.email) email.value = auth.currentUser.email
  await fetchCart()
})

async function fetchCart() {
  loading.value = true
  error.value = ''
  try {
    const res = await medusaFetch<{ cart: any }>(`/store/carts/${cartId.value}`, {
      params: {
        fields: '*items,*items.variant,*items.variant.options,*items.thumbnail,+items.product_handle,*shipping_methods,*shipping_address,*billing_address,+item_subtotal,+shipping_total,+tax_total,+discount_total,+total,+subtotal',
      },
    })
    cart.value = res.cart
    if (res.cart?.email) email.value = res.cart.email
    if (!res.cart?.shipping_address?.address_1 || !(res.cart?.shipping_methods?.length)) {
      // Shipping wasn't completed for this cart — bounce.
      await navigateTo('/shop/shipping')
      return
    }
    // Auto-mount the PayPal hosted card fields as soon as the cart is
    // hydrated. The customer landed here from /shop/shipping so we already
    // have a billing address + email — no extra confirmation click needed.
    initPayment()
  }
  catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Failed to load cart.'
  }
  finally {
    loading.value = false
  }
}

// ─── Derived ──────────────────────────────────────────────────────────
const items = computed<any[]>(() => cart.value?.items || [])
const currency = computed(() => (cart.value?.currency_code || 'USD').toUpperCase())

function fmt(amount: number | null | undefined): string {
  if (amount == null) return ''
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.value,
    maximumFractionDigits: 2,
  }).format(amount)
}

function isPlaceholderVariantValue(v: unknown): boolean {
  return typeof v === 'string' && v.trim().toLowerCase() === 'novar'
}

function variantLabel(item: any): string {
  const opts = item?.variant?.options
  if (Array.isArray(opts) && opts.length) {
    return opts.map((o: any) => o.value).filter((v: any) => v && !isPlaceholderVariantValue(v)).join(' · ')
  }
  const t = item?.variant?.title || item?.variant_title || ''
  return isPlaceholderVariantValue(t) ? '' : t
}

function lineSubtotal(item: any): number {
  if (typeof item?.subtotal === 'number') return item.subtotal
  return (item?.unit_price ?? 0) * (item?.quantity ?? 0)
}

const itemsSubtotal = computed(() => {
  const c = cart.value
  if (typeof c?.item_subtotal === 'number') return c.item_subtotal
  if (typeof c?.subtotal === 'number') return c.subtotal
  return items.value.reduce((sum, it) => sum + lineSubtotal(it), 0)
})

const shippingTotal = computed<number>(() => cart.value?.shipping_total ?? 0)
const grandTotal = computed<number>(() => {
  const t = cart.value?.total
  if (typeof t === 'number' && t > 0) return t
  return itemsSubtotal.value + shippingTotal.value
})

const shippingMethodName = computed(() => cart.value?.shipping_methods?.[0]?.name || 'Shipping')
const shipAddr = computed(() => cart.value?.shipping_address || null)
const billAddr = computed(() => cart.value?.billing_address || null)

function fmtAddress(a: any): string {
  if (!a) return ''
  const lines = [
    [a.first_name, a.last_name].filter(Boolean).join(' '),
    a.address_1,
    a.address_2,
    [a.city, a.province, a.postal_code].filter(Boolean).join(', '),
    a.country_code ? a.country_code.toUpperCase() : '',
  ].filter(Boolean)
  return lines.join('\n')
}

// ─── Payment ──────────────────────────────────────────────────────────
async function initPayment() {
  if (!PAYPAL_CLIENT_ID) {
    paymentError.value = 'Payment is not configured. Please contact support.'
    return
  }
  if (!email.value.trim()) {
    paymentError.value = 'Please enter your email address.'
    return
  }
  if (!billAddr.value || !billAddr.value.address_1) {
    paymentError.value = 'Billing address missing — please return to shipping.'
    return
  }

  paymentLoading.value = true
  paymentError.value = ''
  paymentReady.value = false

  try {
    // 1. Patch email + firebase_uid metadata onto the cart
    const firebaseUid = auth.currentUser?.uid
    await medusaFetch(`/store/carts/${cartId.value}`, {
      method: 'POST',
      body: {
        email: email.value.trim(),
        ...(firebaseUid ? { metadata: { firebase_uid: firebaseUid } } : {}),
      },
    })

    // 2. Upsert payment collection
    const collectionRes = await medusaFetch<{ payment_collection: any }>('/store/payment-collections', {
      method: 'POST',
      body: { cart_id: cartId.value },
    })
    const paymentCollectionId = collectionRes.payment_collection.id

    // 3. Init PayPal session
    const sessionRes = await medusaFetch<{ payment_collection: any }>(
      `/store/payment-collections/${paymentCollectionId}/payment-sessions`,
      { method: 'POST', body: { provider_id: 'pp_paypal_paypal' } },
    )
    const session = sessionRes.payment_collection.payment_sessions.find(
      (s: any) => s.provider_id === 'pp_paypal_paypal',
    )
    const paypalOrderId = session.data.id

    // 4. Client token
    const tokenRes = await medusaFetch<{ client_token: string }>('/store/paypal/client-token', {
      method: 'POST',
      body: {},
    })
    const clientToken = tokenRes.client_token

    // 5. SDK + Card Fields
    const paypal = await loadPayPalSDK(clientToken, currency.value)
    if (!paypal?.CardFields) throw new Error('PayPal Card Fields not available')

    console.log('[shop/checkout] PayPal session init', {
      cartId: cartId.value,
      paymentCollectionId,
      paypalOrderId,
      currency: currency.value,
    })

    cardFields = paypal.CardFields({
      createOrder: async () => {
        console.log('[shop/checkout] createOrder →', paypalOrderId)
        return paypalOrderId
      },
      onApprove: async (data: any) => {
        // PayPal has authorized (and 3DS, if invoked, has cleared). Money
        // may already be captured-pending — from here on, any failure is
        // post-capture and needs a retry-complete (NOT a re-init) to avoid
        // double-charging the customer.
        console.log('[shop/checkout] onApprove data →', JSON.parse(JSON.stringify(data || {})))
        console.log('[shop/checkout] liabilityShift:', data?.liabilityShift, '| orderID:', data?.orderID)
        finalizing.value = true
        paying.value = true
        await runComplete(data?.orderID)
      },
      onError: (err: any) => {
        // Pre-capture SDK error: card rejected, network blip, etc. The
        // PayPal order isn't consumed, so a fresh init is the right retry.
        console.error('[shop/checkout] onError →', err)
        paying.value = false
        finalizing.value = false
        showHardFailure(
          'reinit',
          'Payment could not be processed. Please try again or use a different card.',
        )
      },
      style: {
        input: {
          'font-size': '14px',
          'font-family': 'system-ui, -apple-system, sans-serif',
          'color': '#1a1a1a',
          'padding': '6px 10px',
        },
        '.invalid': { color: '#dc2626' },
      },
    })

    if (cardFields.isEligible()) {
      const inputEvents = { onChange: handleCardChange }
      await cardFields.NumberField({ inputEvents }).render('#card-number-field')
      await cardFields.ExpiryField({ inputEvents }).render('#card-expiry-field')
      await cardFields.CVVField({ inputEvents }).render('#card-cvv-field')
      paymentReady.value = true
      $fbq('AddPaymentInfo', {
        value: grandTotal.value,
        currency: currency.value,
        content_ids: items.value.map((it: any) => it.variant_id).filter(Boolean),
        content_type: 'product',
        num_items: items.value.reduce((n: number, it: any) => n + (it.quantity || 0), 0),
        audience: 'b2c',
      })
    }
    else {
      throw new Error('Card fields not eligible for this transaction')
    }
  }
  catch (e: any) {
    paymentError.value = e?.data?.message || e?.message || 'Failed to initialize payment.'
  }
  finally {
    paymentLoading.value = false
  }
}

async function submitPayment() {
  if (!cardFields || paying.value) return
  const b = billAddr.value
  if (!b) {
    paymentError.value = 'Billing address missing.'
    return
  }
  paying.value = true
  paymentError.value = ''
  console.log('[shop/checkout] submitPayment → cardFields.submit() begin')
  const submitStart = Date.now()
  try {
    await cardFields.submit({
      cardholderName: [b.first_name, b.last_name].filter(Boolean).join(' '),
      billingAddress: {
        addressLine1: b.address_1 || '',
        addressLine2: b.address_2 || undefined,
        adminArea1: b.province || undefined,
        adminArea2: b.city || '',
        postalCode: b.postal_code || '',
        countryCode: (b.country_code || '').toUpperCase(),
      },
    })
    console.log(`[shop/checkout] cardFields.submit() resolved in ${Date.now() - submitStart}ms | finalizing=${finalizing.value}`)
    // submit() resolves into onApprove (handles success path).
    // If it returned without onApprove firing, treat that as a soft
    // failure so the user isn't left with a frozen Pay button.
    if (!finalizing.value) {
      console.warn('[shop/checkout] submit() resolved WITHOUT onApprove firing — possible silent failure')
      paying.value = false
    }
  }
  catch (e: any) {
    // Submit-time errors are pre-capture: the customer cancelled the 3DS
    // popup, entered an invalid OTP, the card was rejected at confirm,
    // network glitch, etc. The PayPal order isn't consumed, so they can
    // retry with the same Card Fields — keep them on the page and surface
    // an inline message instead of the hard-failure modal.
    console.error('[shop/checkout] cardFields.submit() threw →', e)
    paying.value = false
    finalizing.value = false
    paymentError.value = friendlySubmitError(e)
  }
}

async function runComplete(paypalOrderId?: string) {
  paymentError.value = ''
  console.log('[shop/checkout] runComplete → POST /store/carts/' + cartId.value + '/complete | paypalOrderId=' + paypalOrderId)

  // Pre-mint the Purchase event_id and stuff it (plus _fbp / _fbc / UA /
  // event_source_url) into cart metadata so Medusa's order-placed subscriber
  // can fire a server-side Purchase event to Meta CAPI with the same event_id.
  // Browser + server share the id → Meta dedupes them. Best-effort: failure
  // here must not block /complete.
  const purchaseEventId = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  try {
    const { readFbCookies } = await import('~/utils/metaUserData')
    const { fbp, fbc } = readFbCookies()
    await cartStore.updateCart({
      metadata: {
        // Preserve any existing metadata keys — Medusa replaces the whole
        // object so stash the merge upstream if more fields land here.
        ...(cart.value?.metadata || {}),
        meta_purchase_event_id: purchaseEventId,
        meta_fbp: fbp || undefined,
        meta_fbc: fbc || undefined,
        meta_event_source_url: typeof window !== 'undefined' ? window.location.href : undefined,
        meta_client_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      },
    })
  }
  catch (e) {
    console.warn('[shop/checkout] meta dedup metadata stash failed (non-fatal)', e)
  }

  const completeStart = Date.now()
  try {
    const result = await medusaFetch<{ type: string; order?: any; error?: any }>(
      `/store/carts/${cartId.value}/complete`,
      { method: 'POST' },
    )
    console.log(`[shop/checkout] /complete resolved in ${Date.now() - completeStart}ms →`, {
      type: result?.type,
      orderId: result?.order?.id,
      error: result?.error,
    })
    if (result.type === 'order' && result.order?.id) {
      const order = result.order
      const variantIds = (order.items || []).map((it: any) => it.variant_id).filter(Boolean)
      const numItems = (order.items || []).reduce((n: number, it: any) => n + (it.quantity || 0), 0)
      const contents = (order.items || [])
        .filter((it: any) => it.variant_id)
        .map((it: any) => ({
          id: it.variant_id,
          quantity: it.quantity || 1,
          item_price: typeof it.unit_price === 'number'
            ? it.unit_price
            : (typeof it.subtotal === 'number' && it.quantity ? it.subtotal / it.quantity : undefined),
        }))
      // Browser-side Purchase: fire the pixel directly with the pre-minted
      // event_id so the parallel Medusa server-side fire dedupes against it.
      // We bypass $fbq() here because $fbq mints its own id; for Purchase we
      // need control over the id to share with Medusa.
      ;(window as any).fbq?.(
        'track',
        'Purchase',
        {
          value: order.total ?? grandTotal.value,
          currency: (order.currency_code || currency.value).toUpperCase(),
          content_ids: variantIds,
          content_type: 'product',
          contents,
          num_items: numItems,
          transaction_id: order.id,
          audience: 'b2c',
        },
        { eventID: purchaseEventId },
      )
      // Mirror the same event_id to CAPI from the browser. Medusa will also
      // fire server-side with this id; Meta dedupes.
      void $fbq.mirror('Purchase', {
        value: order.total ?? grandTotal.value,
        currency: (order.currency_code || currency.value).toUpperCase(),
        content_ids: variantIds,
        content_type: 'product',
        contents,
        num_items: numItems,
        transaction_id: order.id,
        audience: 'b2c',
      }, purchaseEventId)
      // Hand off to the order-complete page; leave finalizing=true so the
      // overlay covers the navigation transition.
      console.log('[shop/checkout] navigating to /shop/order-complete/' + order.id)
      await navigateTo(`/shop/order-complete/${order.id}`)
      return
    }
    // Medusa came back without an order — capture happened upstream but
    // order materialization failed (stock, region, etc.). Offer retry of
    // /complete only; do NOT re-init payment (that would double-charge).
    console.warn('[shop/checkout] /complete returned non-order type — showing retry-complete modal')
    showHardFailure(
      'retry-complete',
      result.error?.message
        || 'Your payment was authorized but we could not finalize the order. Tap "Retry" to try again — your card will not be charged twice.',
      paypalOrderId,
    )
  }
  catch (e: any) {
    console.error('[shop/checkout] /complete threw →', e)
    showHardFailure(
      'retry-complete',
      e?.data?.message
        || e?.message
        || 'Your payment was authorized but we could not finalize the order. Tap "Retry" to try again — your card will not be charged twice.',
      paypalOrderId,
    )
  }
}

function friendlySubmitError(e: any): string {
  const raw = (e?.message || '').toString()
  // PayPal's "Window closed before response" fires when the 3DS challenge
  // iframe is destroyed before the SDK reads the auth result — usually
  // because the customer dismissed the popup, or a popup blocker / privacy
  // extension nuked it. Translate to actionable copy.
  if (/window closed before response/i.test(raw)) {
    return 'The 3D Secure verification window was closed before authentication finished. Please tap Pay again and complete the bank verification step without closing the popup. If your browser blocked it, allow popups for paypal.com and try again.'
  }
  // PayPal SDK uses plain English error messages; surface them when present
  // and fall back to a generic prompt so we never show "[object Object]".
  if (raw && raw.length < 200) return raw
  return 'Payment could not be submitted. Please double-check your card details and try again.'
}

function showHardFailure(mode: 'reinit' | 'retry-complete', message: string, paypalOrderId?: string) {
  paymentFailureMode.value = mode
  paymentFailureMsg.value = paypalOrderId
    ? `${message}\n\nPayPal reference: ${paypalOrderId}`
    : message
  paymentFailed.value = true
  paying.value = false
  finalizing.value = false
}

async function dismissFailure() {
  if (!canRetry.value) return
  const mode = paymentFailureMode.value
  retryCount.value++
  paymentFailed.value = false
  paymentFailureMsg.value = ''

  if (mode === 'retry-complete') {
    // Same PayPal order, just re-attempt /complete. Re-show the overlay
    // so the customer doesn't see the checkout flash through.
    finalizing.value = true
    paying.value = true
    await runComplete()
    return
  }
  // Pre-capture failure → mint a fresh PayPal session and re-render fields.
  paymentReady.value = false
  cardFields = null
  await initPayment()
}
</script>

<template>
  <div class="min-h-screen bg-navitag-bg py-12">
    <div class="container mx-auto px-6 max-w-2xl">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-20">
        <i class="fas fa-spinner fa-spin fa-2x text-navitag-blue"></i>
        <p class="text-gray-500 mt-4">Loading checkout…</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-center py-20">
        <div class="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-times-circle text-red-400 fa-2x"></i>
        </div>
        <h1 class="text-xl font-extrabold text-gray-950 mb-2">Unable to Load Cart</h1>
        <p class="text-sm text-gray-500">{{ error }}</p>
        <NuxtLink to="/shop" class="inline-block mt-6 px-6 py-2 rounded-full bg-navitag-blue text-white text-sm font-semibold hover:bg-opacity-90 transition">
          Back to Shop
        </NuxtLink>
      </div>

      <!-- Checkout -->
      <div v-else-if="cart">
        <nav class="text-[12.5px] text-gray-500 mb-6">
          <ol class="flex items-center gap-2">
            <li><NuxtLink to="/shop/product/track-1" class="hover:text-gray-900 transition">Shop</NuxtLink></li>
            <li class="text-gray-300">/</li>
            <li><NuxtLink to="/shop/shipping" class="hover:text-gray-900 transition">Shipping</NuxtLink></li>
            <li class="text-gray-300">/</li>
            <li><span class="text-gray-700 font-medium">Checkout</span></li>
          </ol>
        </nav>

        <div class="mb-8">
          <h1 class="text-3xl font-extrabold text-gray-950 mb-2">Checkout</h1>
          <p class="text-gray-500 text-sm">Review your order and complete payment.</p>
        </div>

        <!-- Order Summary -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div class="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <h2 class="font-bold text-gray-950 text-sm uppercase tracking-wider">Order Summary</h2>
          </div>
          <div class="divide-y divide-gray-100">
            <div
              v-for="item in items"
              :key="item.id"
              class="px-6 py-4 flex items-start gap-4"
            >
              <NuxtLink
                v-if="item.product_handle"
                :to="`/shop/product/${item.product_handle}`"
                class="w-14 h-14 shrink-0 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center transition cursor-pointer hover:opacity-80"
                :aria-label="`View ${item.product_title || item.title}`"
              >
                <img
                  v-if="item.thumbnail"
                  :src="item.thumbnail"
                  :alt="item.product_title || item.title || ''"
                  class="w-full h-full object-cover"
                />
                <i v-else class="fas fa-box text-gray-300"></i>
              </NuxtLink>
              <div
                v-else
                class="w-14 h-14 shrink-0 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center"
              >
                <img
                  v-if="item.thumbnail"
                  :src="item.thumbnail"
                  :alt="item.product_title || item.title || ''"
                  class="w-full h-full object-cover"
                />
                <i v-else class="fas fa-box text-gray-300"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-900 text-sm truncate">
                  {{ item.product_title || item.title }}
                </p>
                <p class="text-xs text-gray-500 mt-0.5 truncate">
                  <span v-if="variantLabel(item)">{{ variantLabel(item) }} · </span>
                  Qty {{ item.quantity }}
                </p>
              </div>
              <span class="font-medium text-gray-900 text-sm shrink-0">
                {{ fmt(lineSubtotal(item)) }}
              </span>
            </div>
            <div class="px-6 py-3 flex justify-between items-center text-sm">
              <span class="text-gray-500">Subtotal</span>
              <span class="text-gray-900 font-medium">{{ fmt(itemsSubtotal) }}</span>
            </div>
            <div class="px-6 py-3 flex justify-between items-center text-sm">
              <span class="text-gray-500">{{ shippingMethodName }}</span>
              <span class="text-gray-900 font-medium">{{ fmt(shippingTotal) }}</span>
            </div>
            <div class="px-6 py-4 flex justify-between items-center bg-gray-50">
              <span class="font-bold text-gray-950">Total</span>
              <span class="font-extrabold text-lg text-navitag-blue">
                {{ fmt(grandTotal) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Addresses (collapsible read-only review) -->
        <div class="grid sm:grid-cols-2 gap-4 mb-6">
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button
              type="button"
              class="w-full px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-left hover:bg-gray-100 transition"
              :aria-expanded="shipOpen"
              @click="shipOpen = !shipOpen"
            >
              <h3 class="font-bold text-gray-950 text-xs uppercase tracking-wider">Ship to</h3>
              <span class="flex items-center gap-3">
                <NuxtLink
                  to="/shop/shipping"
                  class="text-xs text-navitag-blue hover:underline"
                  @click.stop
                >Edit</NuxtLink>
                <i
                  class="fas fa-chevron-down text-xs text-gray-400 transition-transform"
                  :class="shipOpen ? 'rotate-180' : ''"
                ></i>
              </span>
            </button>
            <div v-if="shipOpen" class="px-5 py-4">
              <p class="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{{ fmtAddress(shipAddr) }}</p>
              <p v-if="shipAddr?.phone" class="text-xs text-gray-500 mt-2">
                <i class="fas fa-phone mr-1.5 text-gray-400"></i>{{ shipAddr.phone }}
              </p>
            </div>
          </div>
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button
              type="button"
              class="w-full px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-left hover:bg-gray-100 transition"
              :aria-expanded="billOpen"
              @click="billOpen = !billOpen"
            >
              <h3 class="font-bold text-gray-950 text-xs uppercase tracking-wider">Bill to</h3>
              <span class="flex items-center gap-3">
                <NuxtLink
                  to="/shop/shipping"
                  class="text-xs text-navitag-blue hover:underline"
                  @click.stop
                >Edit</NuxtLink>
                <i
                  class="fas fa-chevron-down text-xs text-gray-400 transition-transform"
                  :class="billOpen ? 'rotate-180' : ''"
                ></i>
              </span>
            </button>
            <div v-if="billOpen" class="px-5 py-4">
              <p class="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{{ fmtAddress(billAddr) }}</p>
              <p v-if="billAddr?.phone" class="text-xs text-gray-500 mt-2">
                <i class="fas fa-phone mr-1.5 text-gray-400"></i>{{ billAddr.phone }}
              </p>
            </div>
          </div>
        </div>

        <!-- Email -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div class="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <h2 class="font-bold text-gray-950 text-sm uppercase tracking-wider">Contact email</h2>
          </div>
          <div class="px-6 py-4">
            <input
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="you@example.com"
              :disabled="paymentReady || paymentLoading"
              class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-navitag-blue/30 focus:border-navitag-blue transition disabled:bg-gray-50 disabled:text-gray-500"
            />
            <p class="text-xs text-gray-400 mt-2">Order confirmation and tracking will be sent here.</p>
          </div>
        </div>

        <!-- Payment Section -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div class="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <h2 class="font-bold text-gray-950 text-sm uppercase tracking-wider">Payment</h2>
          </div>

          <!-- Manual init fallback: only shown if auto-init failed and the
               page is no longer in the loading state. Lets the user retry
               without a hard reload. -->
          <div v-if="!paymentReady && !paymentLoading && paymentError" class="px-6 py-6">
            <button
              :disabled="!email || !billAddr?.address_1"
              class="w-full py-3 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
              @click="initPayment"
            >
              <i class="fas fa-redo mr-2"></i>Retry secure payment setup
            </button>
          </div>

          <div v-if="paymentLoading" class="px-6 py-8 text-center">
            <i class="fas fa-spinner fa-spin fa-lg text-navitag-blue"></i>
            <p class="text-gray-500 mt-3 text-sm">Preparing secure payment…</p>
          </div>

          <div v-show="paymentReady" class="px-6 py-5 space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1.5">Card Number</label>
              <div id="card-number-field" class="paypal-field-container"></div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1.5">Expiry</label>
                <div id="card-expiry-field" class="paypal-field-container"></div>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1.5">CVV</label>
                <div id="card-cvv-field" class="paypal-field-container"></div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="paymentError" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
          <i class="fas fa-times-circle mr-2"></i>{{ paymentError }}
        </div>

        <button
          v-if="paymentReady"
          :disabled="paying || !cardValid"
          class="w-full py-4 rounded-xl bg-navitag-blue text-white font-bold text-lg hover:bg-opacity-90 transition shadow-lg shadow-navitag-blue/20 disabled:opacity-40 disabled:cursor-not-allowed"
          @click="submitPayment"
        >
          <span v-if="paying">
            <i class="fas fa-spinner fa-spin mr-2"></i>Processing payment…
          </span>
          <span v-else>
            Pay {{ fmt(grandTotal) }}
          </span>
        </button>

        <p class="text-center text-xs text-gray-400 mt-4">
          <i class="fas fa-lock mr-1"></i>Secure payment powered by PayPal.
          By placing your order, you agree to Navitag's
          <NuxtLink to="/privacy-policy" class="text-navitag-blue underline">Privacy Policy</NuxtLink>.
        </p>
      </div>
    </div>

    <FooterMinimal />

    <!-- Finalizing overlay: covers the gap between PayPal closing the
         3DS modal and our /complete + navigation finishing. Sits below
         PayPal's contingency overlay (z-50 < 99999) so it never hides
         a still-open 3DS frame. -->
    <div
      v-if="finalizing"
      class="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm flex items-center justify-center px-6"
    >
      <div class="text-center max-w-sm">
        <i class="fas fa-spinner fa-spin fa-2x text-navitag-blue mb-5"></i>
        <h2 class="text-lg font-extrabold text-gray-950 mb-2">Finalizing your order…</h2>
        <p class="text-sm text-gray-500">
          Please don't close this window. We're confirming your payment and creating your order.
        </p>
      </div>
    </div>

    <!-- Hard-failure modal -->
    <div
      v-if="paymentFailed"
      class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div class="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-times-circle text-red-500 fa-lg"></i>
        </div>
        <h3 class="text-center font-extrabold text-gray-950 text-lg mb-2">Payment failed</h3>
        <p class="text-center text-sm text-gray-600 whitespace-pre-line mb-5">{{ paymentFailureMsg }}</p>
        <p
          v-if="!canRetry"
          class="text-center text-[12.5px] text-gray-500 mb-5"
        >
          You've reached the retry limit for this checkout. Please return to shipping or contact support if the issue persists.
        </p>
        <div class="flex gap-3">
          <NuxtLink
            to="/shop/shipping"
            class="flex-1 py-2.5 rounded-xl font-semibold text-sm transition text-center"
            :class="canRetry
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-navitag-blue text-white hover:bg-opacity-90'"
          >
            Back to Shipping
          </NuxtLink>
          <button
            v-if="canRetry"
            type="button"
            class="flex-1 py-2.5 rounded-xl bg-navitag-blue text-white font-semibold text-sm hover:bg-opacity-90 transition"
            @click="dismissFailure"
          >
            {{ paymentFailureMode === 'retry-complete' ? 'Retry' : 'Try Again' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.paypal-field-container {
  height: 44px;
  overflow: hidden;
}

.paypal-field-container :deep(iframe) {
  height: 44px !important;
}
</style>

<style>
/* Only the 3DS contingency popup needs to sit above our overlays.
 * Scope is intentionally narrow: pin the contingency handler container
 * AND every iframe nested inside it (the 3DS challenge iframe creates
 * its own stacking context and won't inherit the parent's z-index).
 * Inline Card Fields iframes live elsewhere in the DOM and stay at
 * default stacking, so they don't bleed through our finalizing/failure
 * overlays (which sit at z-50). */
div[id^="payments-sdk-contingency-handler"] {
  z-index: 2147483647 !important;
  position: fixed !important;
}

div[id^="payments-sdk-contingency-handler"] iframe,
div[id^="payments-sdk-contingency-handler"] > * {
  z-index: 2147483647 !important;
}

/* Belt-and-suspenders for the legacy popup-window flow PayPal still
 * uses in some sandbox configurations. */
iframe[name*="__paypal_checkout__"],
.paypal-checkout-sandbox {
  z-index: 2147483647 !important;
}
</style>
