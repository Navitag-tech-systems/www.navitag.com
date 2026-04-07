<script setup lang="ts">
import { onAuthStateChanged } from 'firebase/auth'
import { UNIFIED_API_URL, MEDUSA_BACKEND_URL, MEDUSA_PUBLISHABLE_KEY } from '~/variables'

const route = useRoute()
const imei = computed(() => route.params.imei as string)

useHead({
  title: computed(() => `Navitag - Data Renewal | ${imei.value}`),
})

const { auth } = useFirebase()

const device = ref<any>(null)
const products = ref<any[]>([])
const productsLoading = ref(false)
const loading = ref(false)
const error = ref('')
const showLogin = ref(false)
const isAuthenticated = ref(false)
const authChecked = ref(false)

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    isAuthenticated.value = !!user
    authChecked.value = true
    if (user) {
      checkDevice()
    } else {
      showLogin.value = true
    }
  })
})

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
    const res = await $fetch<{ status: string; device: any }>(`${UNIFIED_API_URL}/inventory/check`, {
      params: { imei: imei.value },
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    })
    device.value = res.device
    if (res.device?.model) {
      fetchProducts(res.device.model)
    }
  } catch (e: any) {
    if (e?.response?.status === 401) {
      try {
        const freshToken = await firebaseUser.getIdToken(true)
        const res = await $fetch<{ status: string; device: any }>(`${UNIFIED_API_URL}/inventory/check`, {
          params: { imei: imei.value },
          headers: {
            Authorization: `Bearer ${freshToken}`,
          },
        })
        device.value = res.device
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
      params: { category_id: categoryId },
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

const plans = computed(() => {
  const durationOrder = ['3 months', '6 months', '12 months']

  return products.value.map((product) => {
    const category = product.categories?.[0]?.name
      || product.collection?.title
      || product.title

    const isBasic = /basic/i.test(category) || /basic/i.test(product.title)

    const sortedVariants = [...(product.variants || [])].sort((a, b) => {
      const ai = durationOrder.findIndex((d) => a.title?.toLowerCase().includes(d))
      const bi = durationOrder.findIndex((d) => b.title?.toLowerCase().includes(d))
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })

    return {
      id: product.id,
      title: product.title,
      description: product.description,
      tier: isBasic ? 'Basic' : 'Pro',
      image: product.thumbnail || product.images?.[0]?.url || null,
      variants: sortedVariants,
    }
  }).sort((a, b) => (a.tier === 'Basic' ? -1 : 1))
})

function formatPrice(variant: any): string {
  if (!variant?.prices?.length) return '—'
  const price = variant.prices[0]
  const amount = price.amount / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: price.currency_code?.toUpperCase() || 'USD',
  }).format(amount)
}

function durationLabel(variant: any): string {
  const title = (variant.title || '').toLowerCase()
  if (title.includes('12')) return '12 Months'
  if (title.includes('6')) return '6 Months'
  if (title.includes('3')) return '3 Months'
  return variant.title || 'Default'
}

function selectVariant(productId: string, variantId: string) {
  selectedVariants.value[productId] = variantId
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
        <h1 class="text-3xl font-extrabold text-gray-950 mb-2">Data Renewal</h1>
        <p class="text-gray-500 text-sm">IMEI: <span class="font-mono font-medium text-gray-700">{{ imei }}</span></p>
      </div>

      <!-- Auth guard message -->
      <div v-if="authChecked && !isAuthenticated" class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm text-center">
        <i class="fas fa-lock mr-2"></i>
        You need to <button class="text-navitag-blue font-semibold underline" @click="showLogin = true">sign in</button> to view your device.
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-20">
        <i class="fas fa-spinner fa-spin fa-2x text-navitag-blue"></i>
        <p class="text-gray-500 mt-4">Looking up device...</p>
      </div>

      <!-- Error -->
      <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
        <i class="fas fa-times-circle mr-2"></i>{{ error }}
      </div>

      <!-- Device Result -->
      <div v-if="device" class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="p-6 flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-navitag-blue bg-opacity-10 flex items-center justify-center">
            <i class="fas fa-satellite-dish text-navitag-blue fa-lg"></i>
          </div>
          <div class="flex-1">
            <h2 class="font-bold text-gray-950 text-lg">{{ device.model }}</h2>
            <p class="text-sm text-gray-500">{{ device.ref1 || '—' }}</p>
          </div>
          <div class="text-right">
            <p class="text-gray-400 text-xs uppercase font-medium">Expiration</p>
            <p class="font-semibold text-sm" :class="device.expiration ? 'text-gray-900' : 'text-gray-400'">
              {{ device.expiration || '—' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Renewal Plans -->
      <div v-if="device" class="mt-10">
        <h2 class="text-xl font-extrabold text-gray-950 mb-2">Choose a Data Plan</h2>
        <p class="text-sm text-gray-500 mb-6">Select a plan to renew connectivity for your <strong>{{ device.model }}</strong>.</p>

        <div v-if="productsLoading" class="text-center py-10">
          <i class="fas fa-spinner fa-spin fa-lg text-navitag-blue"></i>
          <p class="text-gray-500 mt-3 text-sm">Loading plans...</p>
        </div>

        <div v-else-if="plans.length === 0" class="p-6 bg-white rounded-2xl border border-gray-100 text-center text-gray-500 text-sm">
          <i class="fas fa-info-circle mr-1"></i> No renewal plans available for this device model.
        </div>

        <div v-else class="grid sm:grid-cols-2 gap-6">
          <div
            v-for="plan in plans"
            :key="plan.id"
            class="bg-white rounded-2xl border-2 overflow-hidden transition-shadow"
            :class="plan.tier === 'Pro' ? 'border-navitag-blue shadow-lg shadow-navitag-blue/10' : 'border-gray-100 shadow-sm'"
          >
            <!-- Plan Header -->
            <div
              class="px-6 py-4 text-center"
              :class="plan.tier === 'Pro' ? 'bg-navitag-blue text-white' : 'bg-gray-50 text-gray-950'"
            >
              <div
                v-if="plan.tier === 'Pro'"
                class="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white text-navitag-blue mb-2"
              >
                Recommended
              </div>
              <h3 class="text-xl font-extrabold">{{ plan.tier }}</h3>
              <p class="text-xs mt-1" :class="plan.tier === 'Pro' ? 'text-blue-100' : 'text-gray-500'">{{ plan.title }}</p>
            </div>

            <!-- Description -->
            <div v-if="plan.description" class="px-6 pt-4">
              <p class="text-xs text-gray-500 leading-relaxed">{{ plan.description }}</p>
            </div>

            <!-- Duration Options -->
            <div class="p-6 space-y-3">
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
                :disabled="!selectedVariants[plan.id]"
                class="w-full py-3 rounded-xl font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                :class="plan.tier === 'Pro'
                  ? 'bg-navitag-blue text-white hover:bg-opacity-90 shadow-lg shadow-navitag-blue/20'
                  : 'bg-gray-900 text-white hover:bg-gray-800'"
              >
                Select {{ plan.tier }} Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <LoginOverlay v-model="showLogin" @success="onLoginSuccess" />
  </div>
</template>
