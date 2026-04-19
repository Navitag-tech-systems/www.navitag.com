<script setup lang="ts">
import { MEDUSA_BACKEND_URL, MEDUSA_PUBLISHABLE_KEY } from '~/variables'
import { countries } from '~/utils/countryList'

const PAYPAL_CLIENT_ID = 'AUm1vZU6yaAmUOoxlQKA6NO00CHSqdYrRdOPBrvQEa4JkONw-uVAKv9yeifjUnRo-FtMQGiPddFvSQlA'

const route = useRoute()
const cartId = computed(() => route.params.cart_id as string)

const { fetchCountryCode } = useBackendSync()

useHead({
  title: 'Navitag - Plan Checkout',
})

const headers: Record<string, string> = {
  'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY,
  'Content-Type': 'application/json',
}

function loadPayPalSDK(clientToken: string, currency: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).paypal) return resolve((window as any).paypal)

    const script = document.createElement('script')
    script.src = 'https://www.paypal.com/sdk/js?' + new URLSearchParams({
      'client-id': PAYPAL_CLIENT_ID,
      components: 'card-fields',
      currency,
      intent: 'capture',
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

// PayPal card fields instance
let cardFields: any = null

onMounted(async () => {
  const user = auth.currentUser
  if (user?.email) {
    email.value = user.email
    emailPrefilled.value = true
  }
  // Prefill country from IP detection (non-blocking)
  fetchCountryCode().then((code) => {
    if (code && !billing.countryCode) billing.countryCode = code.toUpperCase()
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
    const res = await $fetch<{ cart: any }>(`${MEDUSA_BACKEND_URL}/store/carts/${cartId.value}`, {
      headers,
    })
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
    await $fetch(`${MEDUSA_BACKEND_URL}/store/carts/${cartId.value}`, {
      method: 'POST',
      headers,
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
      },
    })

    // 2. Create/get payment collection (upsert — safe to call multiple times)
    const collectionRes = await $fetch<{ payment_collection: any }>(`${MEDUSA_BACKEND_URL}/store/payment-collections`, {
      method: 'POST',
      headers,
      body: { cart_id: cartId.value },
    })
    const paymentCollectionId = collectionRes.payment_collection.id

    // 3. Init PayPal payment session
    const sessionRes = await $fetch<{ payment_collection: any }>(`${MEDUSA_BACKEND_URL}/store/payment-collections/${paymentCollectionId}/payment-sessions`, {
      method: 'POST',
      headers,
      body: { provider_id: 'pp_paypal_paypal' },
    })
    const session = sessionRes.payment_collection.payment_sessions.find(
      (s: any) => s.provider_id === 'pp_paypal_paypal'
    )
    const paypalOrderId = session.data.id

    // 4. Get client token
    const tokenRes = await $fetch<{ client_token: string }>(`${MEDUSA_BACKEND_URL}/store/paypal/client-token`, {
      method: 'POST',
      headers,
      body: {},
    })
    const clientToken = tokenRes.client_token

    // 5. Load PayPal SDK with client token and cart currency via script tag
    const currency = (cart.value?.currency_code || 'usd').toUpperCase()
    const paypal = await loadPayPalSDK(clientToken, currency)

    if (!paypal?.CardFields) {
      throw new Error('PayPal Card Fields not available')
    }

    cardFields = paypal.CardFields({
      createOrder: async () => paypalOrderId,
      onApprove: async () => {
        // PayPal approved — complete the cart
        try {
          paying.value = true
          const result = await $fetch<{ type: string; order?: any; error?: any }>(`${MEDUSA_BACKEND_URL}/store/carts/${cartId.value}/complete`, {
            method: 'POST',
            headers,
          })
          if (result.type === 'order') {
            navigateTo(`/renew-complete/${result.order.id}`)
          } else {
            paymentError.value = result.error?.message || 'Order completion failed. Please try again.'
          }
        } catch (e: any) {
          paymentError.value = e?.data?.message || e?.message || 'Failed to complete order.'
        } finally {
          paying.value = false
        }
      },
      onError: (err: any) => {
        console.error('PayPal error:', err)
        paymentError.value = 'Payment failed. Please check your card details and try again.'
      },
      style: {
        '.invalid': {
          'color': '#dc2626',
        },
      },
    })

    // Render individual fields (NameField omitted — optional in PayPal and we collect billing name elsewhere)
    if (cardFields.isEligible()) {
      await cardFields.NumberField().render('#card-number-field')
      await cardFields.ExpiryField().render('#card-expiry-field')
      await cardFields.CVVField().render('#card-cvv-field')
      paymentReady.value = true
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
  } catch (e: any) {
    paymentError.value = e?.message || 'Payment submission failed. Please try again.'
    paying.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-navitag-bg py-12">
    <div class="container mx-auto px-6 max-w-lg">

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
                  :disabled="paymentReady || paymentLoading"
                  class="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-navitag-blue/30 focus:border-navitag-blue transition disabled:bg-gray-50 disabled:text-gray-500 bg-white"
                  :class="billingErrors.countryCode ? 'border-red-300' : 'border-gray-200'"
                >
                  <option value="" disabled>Select country</option>
                  <option v-for="c in sortedCountries" :key="c.code" :value="c.code">{{ c.name }}</option>
                </select>
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
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          :disabled="paying"
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
  </div>
</template>

<style scoped>
.paypal-field-container {
  min-height: 40px;
  overflow: visible;
}

/* Ensure PayPal 3DS/OTP modal overlay is always on top */
:deep(div[id^="payments-sdk-contingency-handler"]),
:deep(iframe[name*="__paypal"]),
:deep(.paypal-overlay),
:deep(.paypal-checkout-sandbox) {
  z-index: 99999 !important;
}
</style>

<style>
/* Global: PayPal injects modals outside the component tree */
div[id^="payments-sdk-contingency-handler"] {
  z-index: 99999 !important;
  position: fixed !important;
}

iframe[name*="__paypal_checkout__"],
iframe[name*="__paypal"],
.paypal-overlay,
.paypal-checkout-sandbox,
div.zoid-outlet {
  z-index: 99999 !important;
}
</style>
