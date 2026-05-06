<script setup lang="ts">

const basic = useBasicStore()
const countries = basic.countryList

definePageMeta({
  layout: false,
})

const PAYPAL_CLIENT_ID = useRuntimeConfig().public.paypalClientId as string

const route = useRoute()
const cartId = computed(() => route.params.cart_id as string)

const { medusaFetch } = useMedusa()
const { $fbq } = useNuxtApp()

useHead({
  title: 'Navitag - Plan Checkout',
})
useSeoMeta({ robots: 'noindex, nofollow' })

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

// Firebase user
const { auth } = useFirebase()

// State
const cart = ref<any>(null)
const loading = ref(true)
const error = ref('')
const email = ref('')
const emailPrefilled = ref(false)

// Payment state
const paymentReady = ref(false)
const paymentLoading = ref(false)
const paymentError = ref('')
const paying = ref(false)

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

// Cap retries at 1. After the first retry attempt the modal only offers
// a back-out path so the customer doesn't burn time on a stuck cart.
const RETRY_LIMIT = 1
const retryCount = ref(0)
const canRetry = computed(() => retryCount.value < RETRY_LIMIT)

// Billing address state (PayPal advanced card fields shape + name for Medusa/PayPal cardholder)
const billing = reactive({
  firstName: '',
  lastName: '',
  addressLine1: '',
  addressLine2: '',
  adminArea2: '', // city
  adminArea1: '', // state/province
  postalCode: '',
  countryCode: '',
})
const billingErrors = ref<Record<string, string>>({})

const sortedCountries = computed(() =>
  [...countries].sort((a, b) => a.name.localeCompare(b.name))
)

// PayPal card fields instance + live validity from onChange events
let cardFields: any = null
const cardValid = ref(false)
// Snapshot of the most recent per-field state from PayPal's onChange. Kept
// outside Vue reactivity (mutates on every keystroke; only read on failure).
let lastCardFieldsState: any = null

function handleCardChange(state: any) {
  lastCardFieldsState = state
  const f = state?.fields || {}
  cardValid.value = !!(
    f.cardNumberField?.isValid &&
    f.cardExpiryField?.isValid &&
    f.cardCvvField?.isValid
  )
}

onMounted(async () => {
  const user = auth.currentUser
  if (user?.email) {
    email.value = user.email
    emailPrefilled.value = true
  }
  // Country is pinned to the customer's resolved region — locked once
  // basicStore has it. Resolve in the background so the dropdown is
  // already filled by the time billing is filled out.
  basic.resolveCountry().then(() => {
    if (basic.country) billing.countryCode = basic.country.toUpperCase()
  }).catch(() => {})
  await fetchCart()
})

function validateBilling(): boolean {
  const errs: Record<string, string> = {}
  if (!billing.firstName.trim()) errs.firstName = 'First name is required.'
  if (!billing.lastName.trim()) errs.lastName = 'Last name is required.'
  if (!billing.addressLine1.trim()) errs.addressLine1 = 'Street address is required.'
  if (!billing.adminArea2.trim()) errs.adminArea2 = 'City is required.'
  if (!billing.adminArea1.trim()) errs.adminArea1 = 'State/province is required.'
  if (!billing.postalCode.trim()) errs.postalCode = 'Postal code is required.'
  if (!billing.countryCode) errs.countryCode = 'Country is required.'
  billingErrors.value = errs
  return Object.keys(errs).length === 0
}

const billingComplete = computed(() =>
  billing.firstName.trim() &&
  billing.lastName.trim() &&
  billing.addressLine1.trim() &&
  billing.adminArea2.trim() &&
  billing.adminArea1.trim() &&
  billing.postalCode.trim() &&
  billing.countryCode
)

async function fetchCart() {
  loading.value = true
  error.value = ''
  try {
    const res = await medusaFetch<{ cart: any }>(`/store/carts/${cartId.value}`)
    cart.value = res.cart
    if (res.cart.email) {
      email.value = res.cart.email
    }
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Failed to load cart.'
  } finally {
    loading.value = false
  }
}

const lineItem = computed(() => cart.value?.items?.[0] || null)
const imei = computed(() => lineItem.value?.metadata?.imei || '—')

function formatPrice(amount: number, currencyCode: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode?.toUpperCase() || 'USD',
  }).format(amount)
}

// --- PayPal Payment Setup ---

async function initPayment() {
  if (!PAYPAL_CLIENT_ID) {
    paymentError.value = 'Payment is not configured. Please contact support.'
    return
  }
  if (!email.value) {
    paymentError.value = 'Please enter your email address first.'
    return
  }
  if (!validateBilling()) {
    paymentError.value = 'Please complete your billing address.'
    return
  }

  paymentLoading.value = true
  paymentError.value = ''
  paymentReady.value = false

  try {
    // 1. Update cart with email + billing_address (Medusa shape)
    const firebaseUid = auth.currentUser?.uid
    await medusaFetch(`/store/carts/${cartId.value}`, {
      method: 'POST',
      body: {
        email: email.value,
        billing_address: {
          first_name: billing.firstName.trim(),
          last_name: billing.lastName.trim(),
          address_1: billing.addressLine1.trim(),
          address_2: billing.addressLine2.trim() || undefined,
          city: billing.adminArea2.trim(),
          province: billing.adminArea1.trim() || undefined,
          postal_code: billing.postalCode.trim(),
          country_code: billing.countryCode.toLowerCase(),
        },
        ...(firebaseUid ? { metadata: { firebase_uid: firebaseUid } } : {}),
      },
    })

    // 2. Create/get payment collection (upsert — safe to call multiple times)
    const collectionRes = await medusaFetch<{ payment_collection: any }>('/store/payment-collections', {
      method: 'POST',
      body: { cart_id: cartId.value },
    })
    const paymentCollectionId = collectionRes.payment_collection.id

    // 3. Init PayPal payment session
    const sessionRes = await medusaFetch<{ payment_collection: any }>(`/store/payment-collections/${paymentCollectionId}/payment-sessions`, {
      method: 'POST',
      body: { provider_id: 'pp_paypal_paypal' },
    })
    const session = sessionRes.payment_collection.payment_sessions.find(
      (s: any) => s.provider_id === 'pp_paypal_paypal'
    )
    const paypalOrderId = session.data.id

    // 4. Get client token
    const tokenRes = await medusaFetch<{ client_token: string }>('/store/paypal/client-token', {
      method: 'POST',
      body: {},
    })
    const clientToken = tokenRes.client_token

    // 5. Load PayPal SDK with client token and cart currency via script tag
    const currency = (cart.value?.currency_code || 'usd').toUpperCase()
    const paypal = await loadPayPalSDK(clientToken, currency)

    if (!paypal?.CardFields) {
      throw new Error('PayPal Card Fields not available')
    }

    console.log('[plan-checkout] PayPal session init', {
      cartId: cartId.value,
      paymentCollectionId,
      paypalOrderId,
      currency,
    })

    cardFields = paypal.CardFields({
      createOrder: async () => {
        console.log('[plan-checkout] createOrder →', paypalOrderId)
        return paypalOrderId
      },
      onApprove: async (data: any) => {
        // PayPal has authorized (and 3DS, if invoked, has cleared). Money
        // may already be captured-pending — from here on, any failure is
        // post-capture and needs a retry-complete (NOT a re-init) to avoid
        // double-charging the customer.
        console.log('[plan-checkout] onApprove data →', JSON.parse(JSON.stringify(data || {})))
        console.log('[plan-checkout] liabilityShift:', data?.liabilityShift, '| orderID:', data?.orderID)
        finalizing.value = true
        paying.value = true
        await runComplete(data?.orderID)
      },
      onError: (err: any) => {
        // Pre-capture SDK error: card rejected, network blip, etc. The
        // PayPal order isn't consumed, so a fresh init is the right retry.
        console.error('[plan-checkout] onError →', err)
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
        '.invalid': {
          'color': '#dc2626',
        },
      },
    })

    // Render individual fields (NameField omitted — optional in PayPal and we collect billing name elsewhere)
    if (cardFields.isEligible()) {
      const inputEvents = { onChange: handleCardChange }
      await cardFields.NumberField({ inputEvents }).render('#card-number-field')
      await cardFields.ExpiryField({ inputEvents }).render('#card-expiry-field')
      await cardFields.CVVField({ inputEvents }).render('#card-cvv-field')
      paymentReady.value = true
      $fbq('AddPaymentInfo', {
        value: cart.value?.total ?? cart.value?.subtotal ?? 0,
        currency: (cart.value?.currency_code || 'USD').toUpperCase(),
        content_type: 'data_plan',
        audience: 'b2c',
      })
    } else {
      throw new Error('Card fields not eligible for this transaction')
    }
  } catch (e: any) {
    paymentError.value = e?.data?.message || e?.message || 'Failed to initialize payment.'
  } finally {
    paymentLoading.value = false
  }
}

async function submitPayment() {
  if (!cardFields || paying.value) return
  if (!validateBilling()) {
    paymentError.value = 'Please complete your billing address.'
    return
  }

  paying.value = true
  paymentError.value = ''
  console.log('[plan-checkout] submitPayment → cardFields.submit() begin')
  const submitStart = Date.now()
  try {
    await cardFields.submit({
      cardholderName: `${billing.firstName.trim()} ${billing.lastName.trim()}`,
      billingAddress: {
        addressLine1: billing.addressLine1.trim(),
        addressLine2: billing.addressLine2.trim() || undefined,
        adminArea1: billing.adminArea1.trim() || undefined,
        adminArea2: billing.adminArea2.trim(),
        postalCode: billing.postalCode.trim(),
        countryCode: billing.countryCode,
      },
    })
    console.log(`[plan-checkout] cardFields.submit() resolved in ${Date.now() - submitStart}ms | finalizing=${finalizing.value}`)
    // submit() resolves into onApprove (handles success path).
    // If it returned without onApprove firing, treat that as a soft
    // failure so the user isn't left with a frozen Pay button.
    if (!finalizing.value) {
      console.warn('[plan-checkout] submit() resolved WITHOUT onApprove firing — possible silent failure')
      paying.value = false
    }
  } catch (e: any) {
    // If onApprove already fired and we're navigating away, swallow.
    // submit()'s promise stays pending until PayPal's hidden iframe
    // confirms — and Nuxt unmounts the iframe out from under it during
    // navigation, which surfaces here as
    //   "Window closed for postrobot_method before response"
    // The order is already complete; showing an error would be wrong.
    if (finalizing.value) {
      console.warn('[plan-checkout] submit() rejected after onApprove (post-navigation iframe teardown) — ignoring:', e?.message)
      return
    }

    // Submit-time errors are pre-capture: customer cancelled 3DS popup,
    // bad OTP, card rejected at confirm, network glitch. PayPal order
    // isn't consumed, so they can retry with the same Card Fields —
    // keep them on the page with an inline message.
    //
    // PayPal SDK errors stringify to just the code (e.g. "Error:
    // INVALID_NUMBER") and hide the useful detail on non-enumerable
    // properties. Dump every own-property + the latest field-validity
    // snapshot so support has something to work with.
    const dump: Record<string, unknown> = {}
    for (const k of Object.getOwnPropertyNames(e || {})) {
      try { dump[k] = (e as any)[k] } catch { /* swallow getter errors */ }
    }
    const fieldSnapshot = lastCardFieldsState?.fields
      ? Object.fromEntries(
          Object.entries(lastCardFieldsState.fields).map(([k, v]: [string, any]) => [k, {
            isValid: v?.isValid,
            isEmpty: v?.isEmpty,
            isPotentiallyValid: v?.isPotentiallyValid,
            isFocused: v?.isFocused,
          }]),
        )
      : null
    console.error('[plan-checkout] cardFields.submit() threw →', e)
    console.error('[plan-checkout] error properties →', dump)
    console.error('[plan-checkout] cardValid (computed) →', cardValid.value)
    console.error('[plan-checkout] field state at failure →', fieldSnapshot)
    paying.value = false
    finalizing.value = false
    paymentError.value = friendlySubmitError(e)
  }
}

async function runComplete(paypalOrderId?: string) {
  paymentError.value = ''
  console.log('[plan-checkout] runComplete → POST /store/carts/' + cartId.value + '/complete | paypalOrderId=' + paypalOrderId)

  // Pre-mint Purchase event_id + stash dedup signals into cart metadata so
  // Medusa's order-placed subscriber can fire a server-side Purchase to
  // Meta CAPI with the same event_id. See shop/checkout for the full pattern.
  const purchaseEventId = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  try {
    const { readFbCookies } = await import('~/utils/metaUserData')
    const { fbp, fbc } = readFbCookies()
    await medusaFetch(`/store/carts/${cartId.value}`, {
      method: 'POST',
      body: {
        metadata: {
          ...(cart.value?.metadata || {}),
          meta_purchase_event_id: purchaseEventId,
          meta_fbp: fbp || undefined,
          meta_fbc: fbc || undefined,
          meta_event_source_url: typeof window !== 'undefined' ? window.location.href : undefined,
          meta_client_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        },
      },
    })
  }
  catch (e) {
    console.warn('[plan-checkout] meta dedup metadata stash failed (non-fatal)', e)
  }

  const completeStart = Date.now()
  try {
    const result = await medusaFetch<{ type: string; order?: any; error?: any }>(
      `/store/carts/${cartId.value}/complete`,
      { method: 'POST' },
    )
    console.log(`[plan-checkout] /complete resolved in ${Date.now() - completeStart}ms →`, {
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
      const purchaseParams = {
        value: order.total ?? cart.value?.total ?? 0,
        currency: (order.currency_code || cart.value?.currency_code || 'USD').toUpperCase(),
        content_ids: variantIds,
        content_type: 'data_plan',
        contents,
        num_items: numItems,
        transaction_id: order.id,
        audience: 'b2c' as const,
      }
      // Browser pixel + CAPI mirror share the pre-minted event_id so the
      // parallel Medusa server-side fire (driven by cart.metadata) dedupes.
      ;(window as any).fbq?.('track', 'Purchase', purchaseParams, { eventID: purchaseEventId })
      void $fbq.mirror('Purchase', purchaseParams, purchaseEventId)
      // Hand off to the renew-complete page; leave finalizing=true so
      // the overlay covers the navigation transition.
      console.log('[plan-checkout] navigating to /renew-complete/' + order.id)
      await navigateTo(`/renew-complete/${order.id}`)
      return
    }
    // Medusa came back without an order — capture happened upstream but
    // order materialization failed. Offer retry of /complete only; do
    // NOT re-init payment (that would double-charge).
    console.warn('[plan-checkout] /complete returned non-order type — showing retry-complete modal')
    showHardFailure(
      'retry-complete',
      result.error?.message
        || 'Your payment was authorized but we could not finalize the order. Tap "Retry" to try again — your card will not be charged twice.',
      paypalOrderId,
    )
  } catch (e: any) {
    console.error('[plan-checkout] /complete threw →', e)
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
  // Validation codes PayPal throws from cardFields.submit(). Surface
  // human-readable copy instead of leaking the raw enum to the customer.
  //
  // NOTE: the SDK can surface server-side issues (PAYER_CANNOT_PAY,
  // currency/account mismatches) under the same INVALID_NUMBER label.
  // Inspect the network response details[0].issue in devtools to
  // distinguish a real card-data failure from a merchant-config one.
  if (/PAYER_CANNOT_PAY/i.test(raw)) {
    return 'Your card was declined for this transaction. This often means the card cannot be charged in this currency. Please try a different card.'
  }
  if (/INVALID_NUMBER/i.test(raw)) {
    return 'That card number doesn\'t look right. Please re-enter it and try again.'
  }
  if (/INVALID_EXPIRY|EXPIRED_CARD/i.test(raw)) {
    return 'The card expiry date is invalid or the card has expired. Please check and try again.'
  }
  if (/INVALID_SECURITY_CODE|INVALID_CVV/i.test(raw)) {
    return 'The security code (CVV) is invalid. Please re-enter the 3- or 4-digit code on your card.'
  }
  if (/CARD_TYPE_NOT_SUPPORTED|UNSUPPORTED_CARD_TYPE/i.test(raw)) {
    return 'That card type is not supported. Please try a different card.'
  }
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
    // Same PayPal order, just re-attempt /complete. Re-show overlay
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
    <div class="container mx-auto px-6 max-w-xl">

      <!-- Loading -->
      <div v-if="loading" class="text-center py-20">
        <i class="fas fa-spinner fa-spin fa-2x text-navitag-blue"></i>
        <p class="text-gray-500 mt-4">Loading checkout...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-center py-20">
        <div class="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-times-circle text-red-400 fa-2x"></i>
        </div>
        <h1 class="text-xl font-extrabold text-gray-950 mb-2">Unable to Load Cart</h1>
        <p class="text-sm text-gray-500">{{ error }}</p>
        <NuxtLink to="/" class="inline-block mt-6 px-6 py-2 rounded-full bg-navitag-blue text-white text-sm font-semibold hover:bg-opacity-90 transition">
          Go Home
        </NuxtLink>
      </div>

      <!-- Checkout -->
      <div v-else-if="cart">
        <div class="mb-8 text-center">
          <h1 class="text-3xl font-extrabold text-gray-950 mb-2">Checkout</h1>
          <p class="text-gray-500 text-sm">Complete your data plan renewal</p>
        </div>

        <!-- Order Summary -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div class="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <h2 class="font-bold text-gray-950 text-sm uppercase tracking-wider">Order Summary</h2>
          </div>
          <div class="divide-y divide-gray-100">
            <div v-if="lineItem" class="px-6 py-4">
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <p class="font-semibold text-gray-900 text-sm">{{ lineItem.product_title || lineItem.title }}</p>
                  <p class="text-xs text-gray-500 mt-0.5">{{ lineItem.variant_title || '' }}</p>
                  <p class="text-xs text-gray-400 mt-1">IMEI: <span class="font-mono">{{ imei }}</span></p>
                </div>
                <span class="font-bold text-gray-900 text-sm">
                  {{ formatPrice(lineItem.unit_price, cart.currency_code) }}
                </span>
              </div>
            </div>
            <div class="px-6 py-3 flex justify-between items-center">
              <span class="text-sm text-gray-500">Shipping</span>
              <span class="text-sm text-gray-500">Digital Delivery</span>
            </div>
            <div class="px-6 py-4 flex justify-between items-center bg-gray-50">
              <span class="font-bold text-gray-950">Total</span>
              <span class="font-extrabold text-lg text-navitag-blue">
                {{ formatPrice(cart.total ?? cart.subtotal ?? 0, cart.currency_code) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Billing Information -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div class="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <h2 class="font-bold text-gray-950 text-sm uppercase tracking-wider">Billing Information</h2>
          </div>
          <div class="px-6 py-4 space-y-4">
            <div>
              <label for="email" class="block text-xs font-medium text-gray-500 mb-1.5">Email Address</label>
              <input
                id="email"
                v-model="email"
                type="email"
                autocomplete="email"
                placeholder="you@example.com"
                :disabled="paymentReady || paymentLoading"
                class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-navitag-blue/30 focus:border-navitag-blue transition disabled:bg-gray-50 disabled:text-gray-500"
              >
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="fname" class="block text-xs font-medium text-gray-500 mb-1.5">First Name</label>
                <input
                  id="fname"
                  v-model="billing.firstName"
                  type="text"
                  autocomplete="given-name"
                  :disabled="paymentReady || paymentLoading"
                  class="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-navitag-blue/30 focus:border-navitag-blue transition disabled:bg-gray-50 disabled:text-gray-500"
                  :class="billingErrors.firstName ? 'border-red-300' : 'border-gray-200'"
                >
                <p v-if="billingErrors.firstName" class="text-xs text-red-600 mt-1">{{ billingErrors.firstName }}</p>
              </div>
              <div>
                <label for="lname" class="block text-xs font-medium text-gray-500 mb-1.5">Last Name</label>
                <input
                  id="lname"
                  v-model="billing.lastName"
                  type="text"
                  autocomplete="family-name"
                  :disabled="paymentReady || paymentLoading"
                  class="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-navitag-blue/30 focus:border-navitag-blue transition disabled:bg-gray-50 disabled:text-gray-500"
                  :class="billingErrors.lastName ? 'border-red-300' : 'border-gray-200'"
                >
                <p v-if="billingErrors.lastName" class="text-xs text-red-600 mt-1">{{ billingErrors.lastName }}</p>
              </div>
            </div>
            <div>
              <label for="addr1" class="block text-xs font-medium text-gray-500 mb-1.5">Street Address</label>
              <input
                id="addr1"
                v-model="billing.addressLine1"
                type="text"
                autocomplete="address-line1"
                placeholder="123 Main St"
                :disabled="paymentReady || paymentLoading"
                class="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-navitag-blue/30 focus:border-navitag-blue transition disabled:bg-gray-50 disabled:text-gray-500"
                :class="billingErrors.addressLine1 ? 'border-red-300' : 'border-gray-200'"
              >
              <p v-if="billingErrors.addressLine1" class="text-xs text-red-600 mt-1">{{ billingErrors.addressLine1 }}</p>
            </div>
            <div>
              <label for="addr2" class="block text-xs font-medium text-gray-500 mb-1.5">Apt, suite, etc. <span class="text-gray-400">(optional)</span></label>
              <input
                id="addr2"
                v-model="billing.addressLine2"
                type="text"
                autocomplete="address-line2"
                :disabled="paymentReady || paymentLoading"
                class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-navitag-blue/30 focus:border-navitag-blue transition disabled:bg-gray-50 disabled:text-gray-500"
              >
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="city" class="block text-xs font-medium text-gray-500 mb-1.5">City</label>
                <input
                  id="city"
                  v-model="billing.adminArea2"
                  type="text"
                  autocomplete="address-level2"
                  :disabled="paymentReady || paymentLoading"
                  class="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-navitag-blue/30 focus:border-navitag-blue transition disabled:bg-gray-50 disabled:text-gray-500"
                  :class="billingErrors.adminArea2 ? 'border-red-300' : 'border-gray-200'"
                >
                <p v-if="billingErrors.adminArea2" class="text-xs text-red-600 mt-1">{{ billingErrors.adminArea2 }}</p>
              </div>
              <div>
                <label for="state" class="block text-xs font-medium text-gray-500 mb-1.5">State / Province</label>
                <input
                  id="state"
                  v-model="billing.adminArea1"
                  type="text"
                  autocomplete="address-level1"
                  :disabled="paymentReady || paymentLoading"
                  class="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-navitag-blue/30 focus:border-navitag-blue transition disabled:bg-gray-50 disabled:text-gray-500"
                  :class="billingErrors.adminArea1 ? 'border-red-300' : 'border-gray-200'"
                >
                <p v-if="billingErrors.adminArea1" class="text-xs text-red-600 mt-1">{{ billingErrors.adminArea1 }}</p>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="postal" class="block text-xs font-medium text-gray-500 mb-1.5">Postal Code</label>
                <input
                  id="postal"
                  v-model="billing.postalCode"
                  type="text"
                  autocomplete="postal-code"
                  :disabled="paymentReady || paymentLoading"
                  class="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-navitag-blue/30 focus:border-navitag-blue transition disabled:bg-gray-50 disabled:text-gray-500"
                  :class="billingErrors.postalCode ? 'border-red-300' : 'border-gray-200'"
                >
                <p v-if="billingErrors.postalCode" class="text-xs text-red-600 mt-1">{{ billingErrors.postalCode }}</p>
              </div>
              <div>
                <label for="country" class="block text-xs font-medium text-gray-500 mb-1.5">Country</label>
                <select
                  id="country"
                  v-model="billing.countryCode"
                  autocomplete="country"
                  disabled
                  aria-readonly="true"
                  class="w-full px-4 py-3 rounded-xl border text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  :class="billingErrors.countryCode ? 'border-red-300' : 'border-gray-200'"
                >
                  <option value="" disabled>Detecting...</option>
                  <option v-for="c in sortedCountries" :key="c.code" :value="c.code">{{ c.name }}</option>
                </select>
                <p class="mt-1 text-[11px] text-gray-400">
                  <i class="fas fa-lock mr-1"></i>Set from your account region.
                </p>
                <p v-if="billingErrors.countryCode" class="text-xs text-red-600 mt-1">{{ billingErrors.countryCode }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Section -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div class="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <h2 class="font-bold text-gray-950 text-sm uppercase tracking-wider">Payment</h2>
          </div>

          <!-- Before payment init: show button to proceed -->
          <div v-if="!paymentReady && !paymentLoading" class="px-6 py-6">
            <button
              :disabled="!email || !billingComplete"
              class="w-full py-3 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
              @click="initPayment"
            >
              <i class="fas fa-credit-card mr-2"></i>Pay with Credit/Debit Card
            </button>
          </div>

          <!-- Loading payment -->
          <div v-if="paymentLoading" class="px-6 py-8 text-center">
            <i class="fas fa-spinner fa-spin fa-lg text-navitag-blue"></i>
            <p class="text-gray-500 mt-3 text-sm">Preparing secure payment...</p>
          </div>

          <!-- Card Fields -->
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

        <!-- Payment Error -->
        <div v-if="paymentError" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
          <i class="fas fa-times-circle mr-2"></i>{{ paymentError }}
        </div>

        <!-- Pay Button -->
        <button
          v-if="paymentReady"
          :disabled="paying || !cardValid || !billingComplete"
          class="w-full py-4 rounded-xl bg-navitag-blue text-white font-bold text-lg hover:bg-opacity-90 transition shadow-lg shadow-navitag-blue/20 disabled:opacity-40 disabled:cursor-not-allowed"
          @click="submitPayment"
        >
          <span v-if="paying">
            <i class="fas fa-spinner fa-spin mr-2"></i>Processing Payment...
          </span>
          <span v-else>
            Pay {{ formatPrice(cart.total ?? cart.subtotal ?? 0, cart.currency_code) }}
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
          You've reached the retry limit for this checkout. Please go back or contact support if the issue persists.
        </p>
        <div class="flex gap-3">
          <NuxtLink
            :to="imei && imei !== '—' ? `/top-up/${imei}` : '/'"
            class="flex-1 py-2.5 rounded-xl font-semibold text-sm transition text-center"
            :class="canRetry
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-navitag-blue text-white hover:bg-opacity-90'"
          >
            Back
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
