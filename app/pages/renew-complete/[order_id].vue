<script setup lang="ts">
import { MEDUSA_BACKEND_URL, MEDUSA_PUBLISHABLE_KEY } from '~/variables'

const route = useRoute()
const orderId = computed(() => route.params.order_id as string)

useHead({
  title: 'Navitag - Top-Up Complete',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
})

const headers: Record<string, string> = {
  'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY,
}

const order = ref<any>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  await fetchOrder()
})

async function fetchOrder() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ order: any }>(`${MEDUSA_BACKEND_URL}/store/orders/${orderId.value}`, {
      // payment_collections come back by default but WITHOUT their payments,
      // which is where provider_id lives. Ask for them explicitly.
      params: { fields: '*payment_collections.payments' },
      headers,
    })
    order.value = res.order
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Failed to load order details.'
  } finally {
    loading.value = false
  }
}

const lineItem = computed(() => order.value?.items?.[0] || null)
const imei = computed(() => lineItem.value?.metadata?.imei || '—')
// metadata.ref1 is the owner-assigned device name, stamped onto the line item
// when the cart is built (top-up/[imei].vue). Orders placed BEFORE that change
// carry no ref1, so the product-title fallback stays for them -- but it names
// the plan, not the device, so prefer the IMEI when we have one.
const deviceName = computed(() =>
  lineItem.value?.metadata?.ref1
  || lineItem.value?.metadata?.imei
  || lineItem.value?.product_title
  || '—')

// The payment method used to be hardcoded to "Card via PayPal", which
// mislabelled every GCash / Maya order once Xendit went live (both e-wallet
// flows land on this page via /checkout/xendit/success).
const PAYMENT_METHODS: Record<string, { label: string, icon: string }> = {
  pp_paypal_paypal: { label: 'Card via PayPal', icon: 'fa-credit-card' },
  pp_xendit_gcash: { label: 'GCash', icon: 'fa-wallet' },
  pp_xendit_maya: { label: 'Maya', icon: 'fa-wallet' },
  pp_revenuecat_iap: { label: 'In-App Purchase', icon: 'fa-mobile-alt' },
}

const providerId = computed<string | null>(() => {
  for (const collection of order.value?.payment_collections || []) {
    for (const payment of collection?.payments || []) {
      if (payment?.provider_id) return payment.provider_id as string
    }
  }
  return null
})

const paymentMethod = computed(() => {
  const id = providerId.value
  if (!id) return null
  return PAYMENT_METHODS[id] || { label: 'E-Wallet', icon: 'fa-wallet' }
})

function formatPrice(amount: number, currencyCode: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode?.toUpperCase() || 'USD',
  }).format(amount)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="min-h-screen bg-navitag-bg py-12">
    <div class="container mx-auto px-6 max-w-lg">

      <!-- Loading -->
      <div v-if="loading" class="text-center py-20">
        <i class="fas fa-spinner fa-spin fa-2x text-navitag-blue"></i>
        <p class="text-gray-500 mt-4">Loading top-up details...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-center py-20">
        <div class="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-times-circle text-red-400 fa-2x"></i>
        </div>
        <h1 class="text-xl font-extrabold text-gray-950 mb-2">Something Went Wrong</h1>
        <p class="text-sm text-gray-500">{{ error }}</p>
      </div>

      <!-- Renewal Complete -->
      <div v-else-if="order">
        <!-- Success Header -->
        <div class="text-center mb-8">
          <div class="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
            <i class="fas fa-check-circle text-green-500 fa-3x"></i>
          </div>
          <h1 class="text-2xl font-extrabold text-gray-950 mb-2">Top-Up Complete</h1>
          <p class="text-sm text-gray-500">Your data plan top-up has been successfully processed.</p>
        </div>

        <!-- Email Confirmation Notice -->
        <div class="bg-navitag-blue/5 border border-navitag-blue/20 rounded-2xl px-6 py-4 mb-6 text-center">
          <i class="fas fa-envelope text-navitag-blue mb-2 fa-lg"></i>
          <p class="text-sm text-gray-800">
            A confirmation email will be sent to
            <strong class="text-navitag-blue">{{ order.email }}</strong>
            once the data plan has been activated on your device.
          </p>
        </div>

        <!-- Device & Plan -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div class="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <h2 class="font-bold text-gray-950 text-sm uppercase tracking-wider">Device & Plan</h2>
          </div>
          <div class="px-6 py-5">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-full bg-navitag-blue bg-opacity-10 flex items-center justify-center flex-shrink-0">
                <i class="fas fa-satellite-dish text-navitag-blue fa-lg"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-bold text-gray-950">{{ deviceName }}</p>
                <p class="text-xs text-gray-400 mt-0.5 font-mono">IMEI: {{ imei }}</p>
              </div>
            </div>

            <div v-if="lineItem" class="mt-4 pt-4 border-t border-gray-100">
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-semibold text-gray-900 text-sm">{{ lineItem.product_title || lineItem.title }}</p>
                  <p class="text-xs text-gray-500 mt-0.5">{{ lineItem.variant_title || '' }}</p>
                </div>
                <span class="font-bold text-gray-900 text-sm">
                  {{ formatPrice(lineItem.unit_price, order.currency_code) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Summary -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div class="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <h2 class="font-bold text-gray-950 text-sm uppercase tracking-wider">Payment Summary</h2>
          </div>
          <div class="divide-y divide-gray-100">
            <div class="px-6 py-3 flex justify-between items-center">
              <span class="text-sm text-gray-500">Subtotal</span>
              <span class="text-sm text-gray-700">{{ formatPrice(order.item_subtotal ?? 0, order.currency_code) }}</span>
            </div>
            <div v-if="order.item_tax_total" class="px-6 py-3 flex justify-between items-center">
              <span class="text-sm text-gray-500">Tax</span>
              <span class="text-sm text-gray-700">{{ formatPrice(order.item_tax_total, order.currency_code) }}</span>
            </div>
            <div class="px-6 py-4 flex justify-between items-center bg-gray-50">
              <span class="font-bold text-gray-950">Total Paid</span>
              <span class="font-extrabold text-lg text-navitag-blue">
                {{ formatPrice(order.total ?? 0, order.currency_code) }}
              </span>
            </div>
            <div v-if="paymentMethod" class="px-6 py-3 flex justify-between items-center">
              <span class="text-sm text-gray-500">Payment</span>
              <span class="text-sm text-gray-700">
                <i class="fas mr-1 text-gray-400" :class="paymentMethod.icon"></i>{{ paymentMethod.label }}
              </span>
            </div>
            <div class="px-6 py-3 flex justify-between items-center">
              <span class="text-sm text-gray-500">Status</span>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                :class="order.payment_status === 'captured'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-yellow-50 text-yellow-700'"
              >
                {{ order.payment_status === 'captured' ? 'Paid' : order.payment_status || 'Processing' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Order Reference -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div class="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <h2 class="font-bold text-gray-950 text-sm uppercase tracking-wider">Reference</h2>
          </div>
          <div class="divide-y divide-gray-100">
            <div class="px-6 py-3 flex justify-between items-center">
              <span class="text-xs uppercase font-medium text-gray-400">Order ID</span>
              <span class="text-sm font-mono text-gray-700">{{ order.display_id || order.id }}</span>
            </div>
            <div class="px-6 py-3 flex justify-between items-center">
              <span class="text-xs uppercase font-medium text-gray-400">Date</span>
              <span class="text-sm text-gray-700">{{ formatDate(order.created_at) }}</span>
            </div>
          </div>
        </div>

        <!-- What's Next -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
          <div class="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <h2 class="font-bold text-gray-950 text-sm uppercase tracking-wider">What's Next</h2>
          </div>
          <div class="px-6 py-5 space-y-4">
            <div class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0 text-xs mt-0.5">
                <i class="fas fa-check text-[10px]"></i>
              </div>
              <p class="text-sm text-gray-700">Payment received and top-up order confirmed.</p>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-full bg-navitag-blue text-white flex items-center justify-center flex-shrink-0 text-xs mt-0.5">
                <i class="fas fa-sync text-[10px]"></i>
              </div>
              <p class="text-sm text-gray-700">Your data plan is being activated on your <strong>{{ deviceName }}</strong>.</p>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-full bg-gray-300 text-white flex items-center justify-center flex-shrink-0 text-xs mt-0.5">
                <i class="fas fa-envelope text-[10px]"></i>
              </div>
              <p class="text-sm text-gray-700">You'll receive a confirmation email at <strong>{{ order.email }}</strong> once activation is complete.</p>
            </div>
          </div>
        </div>

        <p class="text-center text-xs text-gray-400">
          You may now close this page. For support, contact us at
          <a href="mailto:support@navitag.com" class="text-navitag-blue underline">support@navitag.com</a>
        </p>
      </div>

    </div>
  </div>
</template>
