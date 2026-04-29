<script setup lang="ts">
import { UNIFIED_API_URL, MEDUSA_BACKEND_URL, MEDUSA_PUBLISHABLE_KEY } from '~/variables'

definePageMeta({
  layout: false,
})

const route = useRoute()
const imei = computed(() => route.params.imei as string)

useHead({
  title: computed(() => `Navitag - Top-Up | ${imei.value}`),
})
useSeoMeta({ robots: 'noindex, nofollow' })

const { auth } = useFirebase()
const basic = useBasicStore()
const { $fbq } = useNuxtApp()

const device = ref<any>(null)
const products = ref<any[]>([])
const productsLoading = ref(false)
const loading = ref(true)
const error = ref('')
const showLogin = ref(false)
const isAuthenticated = computed(() => basic.isLoggedIn)
const authChecked = computed(() => basic.authResolved)
const ipCountryCode = computed(() => basic.country)
const userCountryCode = ref<string | null>(null)
const locationError = ref(false)

// Region: MySQL user country (per-device) > store's resolved country > global default
const countryCode = computed(() => userCountryCode.value || basic.country)
const regionId = computed(() => basic.getRegionId(countryCode.value))

onMounted(async () => {
  // Both boot-time signals are now owned by basicStore — just await them.
  await Promise.all([
    basic.ensureAuthResolved(),
    basic.resolveCountry(),
  ])

  if (!basic.country) {
    loading.value = false
    locationError.value = true
    return
  }

  if (basic.user) {
    checkDevice()
  } else {
    loading.value = false
    showLogin.value = true
  }
})

function retryLocation() {
  if (typeof window !== 'undefined') window.location.reload()
}

async function checkDevice() {
  const firebaseUser = auth.currentUser
  if (!firebaseUser) {
    showLogin.value = true
    return
  }

  loading.value = true
  error.value = ''
  device.value = null

  try {
    const idToken = await firebaseUser.getIdToken()
    const res = await $fetch<{ status: string; device: any; country: string | null }>(`${UNIFIED_API_URL}/inventory/check`, {
      params: { imei: imei.value },
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    })
    device.value = res.device
    if (res.country) userCountryCode.value = res.country
    if (res.device?.model) {
      fetchProducts(res.device.model)
    }
    if (res.device) {
      $fbq('ViewContent', {
        content_name: 'top_up',
        content_category: 'plan_renewal',
        content_type: 'data_plan_list',
        imei: imei.value,
        audience: 'b2c',
      })
    }
  } catch (e: any) {
    if (e?.response?.status === 401) {
      try {
        const freshToken = await firebaseUser.getIdToken(true)
        const res = await $fetch<{ status: string; device: any; country: string | null }>(`${UNIFIED_API_URL}/inventory/check`, {
          params: { imei: imei.value },
          headers: {
            Authorization: `Bearer ${freshToken}`,
          },
        })
        device.value = res.device
        if (res.country) userCountryCode.value = res.country
        if (res.device?.model) {
          fetchProducts(res.device.model)
        }
        return
      } catch {
        showLogin.value = true
        error.value = 'Session expired. Please sign in again.'
      }
    } else if (e?.response?.status === 404) {
      error.value = 'Device not found or not linked to your account.'
    } else {
      error.value = e?.data?.error || e?.message || 'Failed to check device.'
    }
  } finally {
    loading.value = false
  }
}

async function fetchProducts(model: string) {
  productsLoading.value = true
  try {
    const handle = `${model.toLowerCase()}-data-plan`
    const catRes = await $fetch<{ product_categories: any[] }>(`${MEDUSA_BACKEND_URL}/store/product-categories`, {
      params: { handle },
      headers: {
        'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY,
      },
    })
    const categoryId = catRes.product_categories?.[0]?.id
    if (!categoryId) {
      products.value = []
      return
    }
    const res = await $fetch<{ products: any[] }>(`${MEDUSA_BACKEND_URL}/store/products`, {
      params: { category_id: categoryId, region_id: regionId.value, fields: '*variants.calculated_price' },
      headers: {
        'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY,
      },
    })
    products.value = res.products ?? []
  } catch {
    products.value = []
  } finally {
    productsLoading.value = false
  }
}

const selectedVariants = ref<Record<string, string>>({})
const cartLoading = ref(false)
const cartError = ref('')

const plans = computed(() => {
  const durationOrder = ['3 months', '6 months', '12 months']

  return products.value.map((product) => {
    const tags = (product.tags || []).map((t: any) => t.value || '')
    const tier = tags.find((v: string) => /^pro$/i.test(v)) ? 'Pro'
      : tags.find((v: string) => /^basic$/i.test(v)) ? 'Basic'
      : 'Basic'

    const sortedVariants = [...(product.variants || [])].sort((a, b) => {
      const ai = durationOrder.findIndex((d) => a.title?.toLowerCase().includes(d))
      const bi = durationOrder.findIndex((d) => b.title?.toLowerCase().includes(d))
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })

    return {
      id: product.id,
      title: product.title,
      description: product.description,
      tier,
      image: product.thumbnail || product.images?.[0]?.url || null,
      variants: sortedVariants,
    }
  }).sort((a, b) => (a.tier === 'Pro' ? -1 : 1))
})

function formatExpiration(value: string | null | undefined): string {
  if (!value) return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatPrice(variant: any): string {
  const calc = variant?.calculated_price
  if (calc?.calculated_amount != null) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: calc.currency_code?.toUpperCase() || 'USD',
    }).format(calc.calculated_amount)
  }
  if (variant?.prices?.length) {
    const price = variant.prices[0]
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: price.currency_code?.toUpperCase() || 'USD',
    }).format(price.amount / 100)
  }
  return '—'
}

function durationLabel(variant: any): string {
  const title = (variant.title || '').toLowerCase()
  if (title.includes('12')) return '12 Months'
  if (title.includes('6')) return '6 Months'
  if (title.includes('3')) return '3 Months'
  return variant.title || 'Default'
}

function selectVariant(productId: string, variantId: string) {
  selectedVariants.value = { [productId]: variantId }
}

async function buyPlan(productId: string) {
  const variantId = selectedVariants.value[productId]
  if (!variantId) return

  const firebaseUser = auth.currentUser
  if (!firebaseUser) {
    showLogin.value = true
    return
  }

  cartLoading.value = true
  cartError.value = ''

  try {
    const { medusaFetch } = useMedusa()

    // 1. Load Medusa customer to resolve canonical email for the cart
    const meRes = await medusaFetch<{ customer: any }>('/store/customers/me')
    const customerEmail = meRes.customer?.email || firebaseUser.email
    if (!customerEmail) {
      throw new Error('Unable to resolve customer email for checkout.')
    }

    // 2. Create cart — JWT attaches customer automatically; we must still
    //    supply email and metadata.firebase_uid per storefront contract
    const cartMeta: Record<string, string> = {
      firebase_uid: firebaseUser.uid,
      device_imei: imei.value,
    }
    if (countryCode.value) cartMeta.country_code = countryCode.value

    const cartRes = await medusaFetch<{ cart: any }>('/store/carts', {
      method: 'POST',
      body: {
        region_id: regionId.value,
        email: customerEmail,
        metadata: cartMeta,
      },
    })
    const cartId = cartRes.cart.id

    // 3. Add line item with IMEI metadata
    await medusaFetch(`/store/carts/${cartId}/line-items`, {
      method: 'POST',
      body: {
        variant_id: variantId,
        quantity: 1,
        metadata: { imei: imei.value },
      },
    })

    // 4. Add digital delivery shipping method
    await medusaFetch(`/store/carts/${cartId}/shipping-methods`, {
      method: 'POST',
      body: { option_id: 'so_01KNNDCWCEWGBC8BA71HG92T10' },
    })

    // 5. Track AddToCart for the chosen plan variant
    const product = products.value.find((p: any) => p.id === productId)
    const variant = product?.variants?.find((v: any) => v.id === variantId)
    const calc = variant?.calculated_price
    $fbq('AddToCart', {
      content_ids: [variantId],
      content_type: 'data_plan',
      content_name: product?.title || undefined,
      value: calc?.calculated_amount ?? 0,
      currency: (calc?.currency_code || 'USD').toUpperCase(),
      num_items: 1,
      audience: 'b2c',
    })

    // 6. Navigate to checkout
    navigateTo(`/plan-checkout/${cartId}`)
  } catch (e: any) {
    cartError.value = e?.data?.message || e?.message || 'Failed to create cart. Please try again.'
  } finally {
    cartLoading.value = false
  }
}

function onLoginSuccess() {
  showLogin.value = false
  isAuthenticated.value = true
  checkDevice()
}
</script>

<template>
  <div class="min-h-screen bg-navitag-bg py-12 relative">
    <div class="container mx-auto px-6 max-w-2xl">
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-extrabold text-gray-950 mb-2">Top-Up</h1>
        <p class="text-gray-500 text-sm">Device Unique ID: <span class="font-mono font-medium text-gray-700">{{ imei }}</span></p>
      </div>

      <!-- Auth guard message -->
      <div v-if="authChecked && !isAuthenticated && !locationError" class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm text-center">
        <i class="fas fa-lock mr-2"></i>
        You need to <button class="text-navitag-blue font-semibold underline" @click="showLogin = true">sign in</button> to view your device.
      </div>

      <!-- Location error -->
      <div v-if="locationError" class="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
        <i class="fas fa-map-marker-alt fa-2x text-gray-300 mb-4"></i>
        <h2 class="font-bold text-gray-950 text-lg mb-2">Unable to detect your location</h2>
        <p class="text-sm text-gray-500 mb-6">We couldn't reach our location service. Check your connection and try again.</p>
        <button
          class="px-6 py-3 rounded-xl bg-navitag-blue text-white font-semibold hover:bg-opacity-90 transition shadow-lg shadow-navitag-blue/20"
          @click="retryLocation"
        >
          <i class="fas fa-rotate-right mr-2"></i>Retry
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading && !locationError" class="text-center py-20">
        <i class="fas fa-spinner fa-spin fa-2x text-navitag-blue"></i>
        <p class="text-gray-500 mt-4">Looking up device...</p>
      </div>

      <!-- Error -->
      <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
        <i class="fas fa-times-circle mr-2"></i>{{ error }}
      </div>

      <!-- Device Result -->
      <div v-if="device" class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="p-6">
          <h2 class="font-bold text-gray-950 text-lg">{{ device.ref1 || device.model }}</h2>
          <div class="mt-2 text-sm text-gray-500">
            <div>Device Unique ID: <span class="font-mono font-medium text-gray-700">{{ device.imei }}</span></div>
            <div>Plan: <span class="font-semibold" :class="device.plan_level === 'Pro' ? 'text-navitag-blue' : 'text-gray-700'">{{ device.plan_level || 'Basic' }}</span></div>
            <div>Expiration: <span class="font-semibold" :class="device.expiration ? 'text-gray-900' : 'text-gray-400'">{{ device.expiration ? formatExpiration(device.expiration) : '—' }}</span></div>
          </div>
        </div>
      </div>

      <!-- Renewal Plans -->
      <div v-if="device" class="mt-10">
        <h2 class="text-xl font-extrabold text-gray-950 mb-2">Choose a Data Plan</h2>
        <p class="text-sm text-gray-500">Select a plan to renew connectivity for your <strong>{{ device.model }}</strong>.</p>
        <p class="text-sm text-gray-500 mb-6">Changing your plan will convert all of your unused allocation to the new tier. This will be added on top of the top-up purchased.</p>

        <div v-if="productsLoading" class="text-center py-10">
          <i class="fas fa-spinner fa-spin fa-lg text-navitag-blue"></i>
          <p class="text-gray-500 mt-3 text-sm">Loading plans...</p>
        </div>

        <div v-else-if="plans.length === 0" class="p-6 bg-white rounded-2xl border border-gray-100 text-center text-gray-500 text-sm">
          <i class="fas fa-info-circle mr-1"></i> No top-up plans available for this device model.
        </div>

        <div v-else class="grid sm:grid-cols-2 gap-6 items-stretch">
          <div
            v-for="plan in plans"
            :key="plan.id"
            class="bg-white rounded-2xl border-2 overflow-hidden transition-shadow flex flex-col"
            :class="[
              plan.tier === 'Pro' ? 'border-navitag-blue shadow-lg shadow-navitag-blue/10 sm:order-2' : 'border-gray-100 shadow-sm sm:order-1'
            ]"
          >
            <!-- Plan Header -->
            <div
              class="px-6 py-4 text-center"
              :class="plan.tier === 'Pro' ? 'bg-navitag-blue text-white' : 'bg-gray-50 text-gray-950'"
            >
              <div
                class="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-2"
                :class="[
                  plan.tier === (device?.plan_level || 'Basic')
                    ? (plan.tier === 'Pro' ? 'bg-white text-navitag-blue' : 'bg-navitag-orange text-white')
                    : plan.tier === 'Pro'
                      ? 'bg-white text-navitag-blue'
                      : 'invisible'
                ]"
              >
                {{ plan.tier === (device?.plan_level || 'Basic')
                  ? (plan.tier === 'Pro' ? 'Current Plan' : 'Current')
                  : 'Recommended' }}
              </div>
              <h3 class="text-xl font-extrabold">{{ plan.tier }}</h3>
              <p class="text-xs mt-1" :class="plan.tier === 'Pro' ? 'text-blue-100' : 'text-gray-500'">{{ plan.title }}</p>
            </div>

            <!-- Duration Options -->
            <div class="p-6 space-y-3 flex-1 flex flex-col justify-end">
              <button
                v-for="variant in plan.variants"
                :key="variant.id"
                class="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition text-left"
                :class="selectedVariants[plan.id] === variant.id
                  ? (plan.tier === 'Pro' ? 'border-navitag-blue bg-navitag-blue/5' : 'border-navitag-orange bg-navitag-orange/5')
                  : 'border-gray-100 hover:border-gray-200'"
                @click="selectVariant(plan.id, variant.id)"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                    :class="selectedVariants[plan.id] === variant.id
                      ? (plan.tier === 'Pro' ? 'border-navitag-blue' : 'border-navitag-orange')
                      : 'border-gray-300'"
                  >
                    <div
                      v-if="selectedVariants[plan.id] === variant.id"
                      class="w-2.5 h-2.5 rounded-full"
                      :class="plan.tier === 'Pro' ? 'bg-navitag-blue' : 'bg-navitag-orange'"
                    ></div>
                  </div>
                  <span class="font-semibold text-gray-900 text-sm">{{ durationLabel(variant) }}</span>
                </div>
                <span class="font-bold text-sm" :class="plan.tier === 'Pro' ? 'text-navitag-blue' : 'text-navitag-orange'">
                  {{ formatPrice(variant) }}
                </span>
              </button>
            </div>

            <!-- Select Button -->
            <div class="px-6 pb-6">
              <button
                :disabled="!selectedVariants[plan.id] || cartLoading"
                class="w-full py-3 rounded-xl font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                :class="plan.tier === 'Pro'
                  ? 'bg-navitag-blue text-white hover:bg-opacity-90 shadow-lg shadow-navitag-blue/20'
                  : 'bg-gray-900 text-white hover:bg-gray-800'"
                @click="buyPlan(plan.id)"
              >
                <span v-if="cartLoading">
                  <i class="fas fa-spinner fa-spin mr-2"></i>Processing...
                </span>
                <span v-else>
                  {{ plan.tier == (device?.plan_level || 'Basic') ? "Top-up Now" : "Change Plan" }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Cart Error -->
      <div v-if="cartError" class="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
        <i class="fas fa-times-circle mr-2"></i>{{ cartError }}
      </div>
    </div>

    <LoginOverlay v-model="showLogin" :ip-country-code="ipCountryCode" @success="onLoginSuccess" />

    <FooterMinimal />
  </div>
</template>
