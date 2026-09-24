<script setup lang="ts">
import { UNIFIED_API_URL, MEDUSA_BACKEND_URL, MEDUSA_PUBLISHABLE_KEY, MEDUSA_HIDDEN_SALES_CHANNEL_ID, MEDUSA_DIGITAL_DELIVERY_OPTION_ID } from '~/variables'

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

// --- Multi-device ("bulk") renewal -----------------------------------------
// This page is the landing point the NATIVE app opens
// (track.navitag.com deviceSettings.vue -> www.navitag.com/top-up/<imei>), and
// that URL is baked into installed builds. So bulk renewal is added HERE rather
// than on a new route: an owner with one device sees exactly what they saw
// before, because every block below renders only when the API returns others.
//
// `?with_candidates=1` is strictly additive on the response — the server already
// splits the buckets and decides eligibility, so nothing here re-derives them:
//   renew_eligible false -> the model sells no plans, or this device's own tier
//                           is not one of them; purchase must not be offered
//   renew_tiers          -> tiers that may be bought (unused here: the existing
//                           plan cards already come from the model's category)
//   candidates[]         -> ACTIVE stablemates expiring within ±1 week
//   expired[]            -> lapsed ones, any distance, shown separately
//   bulk_max             -> hard cap, anchor included
type DeviceRow = {
  imei: string
  name?: string
  model?: string
  plan_level?: string
  expiration?: string | null
  actionable?: boolean
}

const candidates = ref<DeviceRow[]>([])
const expired = ref<DeviceRow[]>([])
const renewEligible = ref<boolean | null>(null)
const bulkMax = ref(10)
const selectedImeis = ref<Set<string>>(new Set())

const products = ref<any[]>([])
const productsLoading = ref(false)
const loading = ref(true)
const error = ref('')
const showLogin = ref(false)
// Set when /inventory/check 404s for a signed-in user: the device exists on
// another account (typically a track.navitag.com user landing here while a
// different account is signed in on navitag.com). Offers "Switch Account".
const notOwned = ref(false)
const switchingAccount = ref(false)
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
  notOwned.value = false
  device.value = null

  try {
    const idToken = await firebaseUser.getIdToken()
    const res = await $fetch<any>(`${UNIFIED_API_URL}/inventory/check`, {
      params: { imei: imei.value, with_candidates: 1 },
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    })
    device.value = res.device
    applyBulkFields(res)
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
        const res = await $fetch<any>(`${UNIFIED_API_URL}/inventory/check`, {
          params: { imei: imei.value, with_candidates: 1 },
          headers: {
            Authorization: `Bearer ${freshToken}`,
          },
        })
        device.value = res.device
        applyBulkFields(res)
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
      notOwned.value = true
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

function applyBulkFields(res: any) {
  candidates.value = res.candidates || []
  expired.value = res.expired || []
  renewEligible.value = res.renew_eligible ?? null
  bulkMax.value = res.bulk_max ?? 10
  // The anchor is always in the cart and cannot be unticked: it is the device
  // the owner opened. Everything else is opt-in.
  selectedImeis.value = new Set([res.device?.imei].filter(Boolean))
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

// The owner-assigned device name. ref1 is the single name of record:
// User::linkDevice seeds it and Device::update mirrors every rename into it.
//
// A device still on the shelf carries the "@@ 1234/5678" inventory marker in
// ref1 — a shelf state, not a name — so it falls back to the IMEI, matching
// DeviceNaming::displayNameSql() on the API side. ref2 is the retired link-time
// store and is deliberately not consulted; `model` is a product model
// ('TRACK-1'), never a name.
const deviceName = computed(() => {
  const ref1 = String(device.value?.ref1 || '').trim()
  if (ref1 === '' || ref1.startsWith('@@')) return device.value?.imei || ''
  return ref1
})

// device.plan_level is canonical lowercase from the API (Inventory::check
// lowercases every row before serving); plan.tier is display-cased
// ('Basic' / 'Pro') because it comes from the Medusa product tag. Comparing
// them directly never matched, so every card rendered "Change Plan" and the
// "Current" badge never appeared. Normalize on one axis, capitalize only at
// display.
const currentTier = computed(() => String(device.value?.plan_level || 'basic').toLowerCase())
const currentTierLabel = computed(() => (currentTier.value === 'pro' ? 'Pro' : 'Basic'))

function isCurrentTier(tier: string): boolean {
  return String(tier).toLowerCase() === currentTier.value
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

// --- Multi-device selection ------------------------------------------------
// A row's display name follows the same rule as deviceName above: ref1 is the
// name of record, and the "@@ ..." inventory marker is a shelf state, not a
// name. Candidate rows arrive with `name` already resolved server-side by
// DeviceNaming::displayNameSql(), so this only has to cover the anchor.
function rowName(row: DeviceRow): string {
  const n = String(row.name || '').trim()
  if (!n || n.startsWith('@@')) return row.imei
  return n
}

const anchorRow = computed<DeviceRow | null>(() => device.value
  ? {
      imei: device.value.imei,
      name: deviceName.value,
      model: device.value.model,
      plan_level: currentTier.value,
      expiration: device.value.expiration,
      actionable: true,
    }
  : null)

const activeRows = computed<DeviceRow[]>(() => {
  const a = anchorRow.value
  return a ? [a, ...candidates.value] : []
})

const allRows = computed<DeviceRow[]>(() => [...activeRows.value, ...expired.value])
const selectedRows = computed(() => allRows.value.filter(r => selectedImeis.value.has(r.imei)))
const selectedCount = computed(() => selectedRows.value.length)

// Every block of multi-device UI hangs off this. With no other devices the page
// renders exactly as it did before bulk renewal existed.
const hasOtherDevices = computed(() => candidates.value.length > 0 || expired.value.length > 0)
const atCap = computed(() => selectedImeis.value.size >= bulkMax.value)

function isAnchorRow(row: DeviceRow): boolean {
  return row.imei === device.value?.imei
}

function toggleDevice(row: DeviceRow) {
  if (isAnchorRow(row)) return
  const next = new Set(selectedImeis.value)
  if (next.has(row.imei)) next.delete(row.imei)
  else {
    if (next.size >= bulkMax.value) return
    next.add(row.imei)
  }
  selectedImeis.value = next
}

// The tier and duration currently chosen, read back off the selected variant so
// the existing plan cards stay the single place a target is picked.
const chosen = computed(() => {
  const [productId, variantId] = Object.entries(selectedVariants.value)[0] || []
  if (!productId || !variantId) return null
  const plan = plans.value.find(p => p.id === productId)
  const variant = plan?.variants?.find((v: any) => v.id === variantId)
  if (!plan || !variant) return null
  const m = /(\d+)\s*month/i.exec(String(variant.title || ''))
  return {
    tier: String(plan.tier).toLowerCase(),
    months: m ? Number(m[1]) : 0,
    variant,
    amount: variant?.calculated_price?.calculated_amount ?? null,
    currency: (variant?.calculated_price?.currency_code || 'PHP').toUpperCase(),
  }
})

const totalAmount = computed(() => {
  const c = chosen.value
  return c?.amount == null ? null : c.amount * selectedCount.value
})

function money(v: number | null, currency: string): string {
  if (v == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(v)
}

// --- Per-device expiry preview ---------------------------------------------
// GET /inventory/renew-preview runs the SAME PlanExpiry code the fulfilment
// write runs, so what is shown here is what the device will get. Nothing is
// computed in the browser: a same-tier renewal APPENDS from the later of today
// and the current expiry, but a tier CHANGE rebases from today after converting
// the remaining paid time at the price ratio, and a device with a long runway
// can land EARLIER than it started. That needs live prices and the owner's
// timezone, which only the server has.
//
// `country` is the one the cart will carry as metadata.country_code -- the
// webhook prefers it for region and timezone, so the preview must use it too.
type Preview = { day: string; mode: 'renew' | 'change' }

const preview = ref<Record<string, Preview>>({})
const previewLoading = ref(false)
const previewFailed = ref(false)
let previewSeq = 0
let previewTimer: ReturnType<typeof setTimeout> | null = null

const previewKey = computed(() => {
  const c = chosen.value
  if (!c || !c.months || !device.value) return ''
  const imeis = allRows.value.map(r => r.imei).filter(i => selectedImeis.value.has(i))
  return [c.tier, c.months, countryCode.value || '', imeis.join(',')].join('|')
})

watch(previewKey, (key) => {
  if (previewTimer) clearTimeout(previewTimer)
  if (!key) {
    previewSeq++
    preview.value = {}
    previewLoading.value = false
    previewFailed.value = false
    return
  }
  previewLoading.value = true
  // Short debounce: ticking several devices in a row makes one request.
  previewTimer = setTimeout(() => fetchPreview(key), 250)
})

async function fetchPreview(key: string) {
  const seq = ++previewSeq
  const [tier, months, country, imeis] = key.split('|')
  const firebaseUser = auth.currentUser
  if (!firebaseUser || !imeis) return
  try {
    const idToken = await firebaseUser.getIdToken()
    const res = await $fetch<any>(`${UNIFIED_API_URL}/inventory/renew-preview`, {
      params: { imeis, tier, months, ...(country ? { country } : {}) },
      headers: { Authorization: `Bearer ${idToken}` },
    })
    if (seq !== previewSeq) return // a newer selection superseded this one
    const next: Record<string, Preview> = {}
    for (const d of res.devices || []) {
      next[d.imei] = { day: d.new_expiration_day, mode: d.mode }
    }
    preview.value = next
    previewFailed.value = false
  } catch {
    if (seq !== previewSeq) return
    // Not fatal: the webhook is the authority and still applies the right
    // date. The row just says it could not be estimated.
    preview.value = {}
    previewFailed.value = true
  } finally {
    if (seq === previewSeq) previewLoading.value = false
  }
}

function previewFor(imeiValue: string): string | null {
  const p = preview.value[imeiValue]
  return p?.day ? formatExpiration(p.day) : null
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
        sales_channel_id: MEDUSA_HIDDEN_SALES_CHANNEL_ID,
        email: customerEmail,
        metadata: cartMeta,
      },
    })
    const cartId = cartRes.cart.id

    // 3. ONE LINE ITEM PER SELECTED DEVICE, each carrying its own IMEI.
    //
    // The storefront does NOT merge identical variants, so N devices give N line
    // items at quantity 1 — which is exactly what lets the backend renew them
    // independently, because it resolves the target device per line item.
    // Collapsing them into a single quantity-N item would charge for N and renew
    // one. For a single device this is the same one call it always was.
    //
    // ref1 is the owner-assigned device name (device_inventory.ref1, kept in
    // step with Traccar by Device::update). It is carried on the line item so
    // the downstream checkout + completion pages can name the device without
    // an authenticated /inventory/check call -- those pages authenticate with
    // the publishable key only. renew-complete already read metadata.ref1;
    // nothing had ever written it, so it always fell back to the plan's
    // product title.
    const rows = selectedRows.value.length ? selectedRows.value : [{ imei: imei.value, name: deviceName.value }]
    let lastCart: any = null
    for (const row of rows) {
      const added = await medusaFetch<{ cart: any }>(`/store/carts/${cartId}/line-items`, {
        method: 'POST',
        body: {
          variant_id: variantId,
          quantity: 1,
          metadata: { imei: row.imei, ref1: rowName(row as DeviceRow) },
        },
      })
      lastCart = added?.cart ?? lastCart
    }

    // The cart must hold exactly one item per selected device before checkout.
    // A failed add throws above; this catches the quieter case of an add that
    // returned but did not land, which would charge for fewer devices than the
    // owner ticked. The abandoned cart is harmless -- nothing has been paid.
    const cartImeis = (lastCart?.items || []).map((i: any) => i?.metadata?.imei).filter(Boolean).sort()
    const wantImeis = rows.map(r => r.imei).sort()
    if (cartImeis.length !== wantImeis.length || cartImeis.some((v: string, i: number) => v !== wantImeis[i])) {
      throw new Error('Not every device could be added to the cart. Please try again.')
    }

    // 4. Add digital delivery shipping method
    await medusaFetch(`/store/carts/${cartId}/shipping-methods`, {
      method: 'POST',
      body: { option_id: MEDUSA_DIGITAL_DELIVERY_OPTION_ID },
    })

    // 5. Track AddToCart for the chosen plan variant
    const product = products.value.find((p: any) => p.id === productId)
    const variant = product?.variants?.find((v: any) => v.id === variantId)
    const calc = variant?.calculated_price
    $fbq('AddToCart', {
      content_ids: [variantId],
      content_type: 'data_plan',
      content_name: product?.title || undefined,
      // Both scale with the cart: a 3-device renewal is 3 items at 3x the value,
      // and reporting 1 would understate every multi-device purchase.
      value: (calc?.calculated_amount ?? 0) * rows.length,
      currency: (calc?.currency_code || 'USD').toUpperCase(),
      num_items: rows.length,
      audience: 'b2c',
    })

    // 6. Navigate to checkout — keep cartLoading=true through the route
    //    transition so the button spinner doesn't flash back to its idle
    //    label while Nuxt resolves the next page.
    await navigateTo(`/plan-checkout/${cartId}`)
  } catch (e: any) {
    cartError.value = e?.data?.message || e?.message || 'Failed to create cart. Please try again.'
    cartLoading.value = false
  }
}

function onLoginSuccess() {
  showLogin.value = false
  checkDevice()
}

// Sign out the current account and reopen the login overlay; onLoginSuccess
// then re-runs checkDevice() under the new account on this same page.
async function switchAccount() {
  switchingAccount.value = true
  try {
    await basic.logout()
    // logout() clears the resolved country; re-resolve so the plan region
    // and the location guard stay valid for the next account.
    await basic.resolveCountry()
    error.value = ''
    notOwned.value = false
    device.value = null
    showLogin.value = true
  } finally {
    switchingAccount.value = false
  }
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
        <div v-if="notOwned && isAuthenticated" class="mt-3">
          <p v-if="basic.user?.email" class="text-xs text-red-600 mb-3">
            Signed in as <strong>{{ basic.user.email }}</strong>
          </p>
          <button
            class="px-5 py-2 rounded-xl bg-navitag-blue text-white font-semibold hover:bg-opacity-90 transition disabled:opacity-60"
            :disabled="switchingAccount"
            @click="switchAccount"
          >
            <i class="fas mr-2" :class="switchingAccount ? 'fa-spinner fa-spin' : 'fa-exchange-alt'"></i>Switch Account
          </button>
        </div>
      </div>

      <!-- Device Result -->
      <div v-if="device" class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="p-6">
          <h2 class="font-bold text-gray-950 text-lg">{{ deviceName }}</h2>
          <div class="mt-2 text-sm text-gray-500">
            <div>Device Unique ID: <span class="font-mono font-medium text-gray-700">{{ device.imei }}</span></div>
            <div>Plan: <span class="font-semibold" :class="currentTier === 'pro' ? 'text-navitag-blue' : 'text-gray-700'">{{ currentTierLabel }}</span></div>
            <div>Expiration: <span class="font-semibold" :class="device.expiration ? 'text-gray-900' : 'text-gray-400'">{{ device.expiration ? formatExpiration(device.expiration) : '—' }}</span></div>
            <!-- Single-device owners have no device list, so the estimate for the
                 chosen plan shows here; with a list it shows on this device's row. -->
            <div v-if="chosen && !hasOtherDevices">
              New expiration:
              <span v-if="previewFor(device.imei)" class="font-semibold text-navitag-blue">{{ previewFor(device.imei) }}</span>
              <span v-else-if="previewLoading" class="text-gray-400">estimating&hellip;</span>
              <span v-else class="text-gray-400">could not estimate</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Other devices on the same plan. Renders ONLY when the API returned
           some, so a single-device owner sees the page exactly as before. -->
      <div v-if="device && hasOtherDevices" class="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <div>
            <h2 class="font-bold text-gray-950">Renew more devices together</h2>
            <p class="text-xs text-gray-500 mt-0.5">One plan is applied to every device you tick.</p>
          </div>
          <span class="text-xs shrink-0" :class="atCap ? 'text-navitag-orange font-semibold' : 'text-gray-400'">
            {{ selectedCount }} of {{ bulkMax }}
          </span>
        </div>

        <ul>
          <li
            v-for="row in activeRows"
            :key="row.imei"
            class="px-6 py-3 border-b border-gray-50 flex items-center gap-3"
            :class="isAnchorRow(row) ? 'bg-gray-50/60' : 'cursor-pointer hover:bg-gray-50/40'"
            @click="toggleDevice(row)"
          >
            <i
              class="fa-square-check w-4 text-center"
              :class="selectedImeis.has(row.imei) ? 'fas text-navitag-blue' : 'far text-gray-300'"
            ></i>
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-gray-900 text-sm truncate">
                {{ rowName(row) }}
                <span v-if="isAnchorRow(row)" class="ml-1 text-[10px] uppercase tracking-wide text-gray-400">this device</span>
              </div>
              <div class="text-[11px] text-gray-500 font-mono">{{ row.imei }}</div>
            </div>
            <div class="text-right text-[11px] shrink-0">
              <div class="text-gray-500">{{ row.expiration ? formatExpiration(row.expiration) : '—' }}</div>
              <div
                v-if="selectedImeis.has(row.imei) && chosen"
                class="font-semibold"
                :class="previewFor(row.imei) ? 'text-navitag-blue' : 'text-gray-400'"
              >
                <template v-if="previewFor(row.imei)">&rarr; {{ previewFor(row.imei) }}</template>
                <template v-else-if="previewLoading">&rarr; estimating&hellip;</template>
                <template v-else>&rarr; could not estimate</template>
              </div>
            </div>
          </li>
        </ul>

        <!-- Lapsed devices get their own section: renewing one restarts its term
             from today rather than extending it, which is worth saying plainly. -->
        <template v-if="expired.length">
          <div class="px-6 py-3 bg-gray-50/70 border-y border-gray-100">
            <h3 class="text-xs font-bold uppercase tracking-wide text-gray-500">Expired</h3>
            <p class="text-[11px] text-gray-500 mt-0.5">These have lapsed — renewing restarts the term from today.</p>
          </div>
          <ul>
            <li
              v-for="row in expired"
              :key="row.imei"
              class="px-6 py-3 border-b border-gray-50 flex items-center gap-3 cursor-pointer hover:bg-gray-50/40"
              @click="toggleDevice(row)"
            >
              <i
                class="fa-square-check w-4 text-center"
                :class="selectedImeis.has(row.imei) ? 'fas text-navitag-blue' : 'far text-gray-300'"
              ></i>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-gray-900 text-sm truncate">{{ rowName(row) }}</div>
                <div class="text-[11px] text-gray-500 font-mono">{{ row.imei }}</div>
              </div>
              <div class="text-right text-[11px] shrink-0">
                <div class="text-navitag-orange font-medium">
                  {{ row.expiration ? formatExpiration(row.expiration) : 'No plan' }}
                </div>
                <div
                  v-if="selectedImeis.has(row.imei) && chosen"
                  class="font-semibold"
                  :class="previewFor(row.imei) ? 'text-navitag-blue' : 'text-gray-400'"
                >
                  <template v-if="previewFor(row.imei)">&rarr; {{ previewFor(row.imei) }}</template>
                  <template v-else-if="previewLoading">&rarr; estimating&hellip;</template>
                  <template v-else>&rarr; could not estimate</template>
                </div>
              </div>
            </li>
          </ul>
        </template>

        <div v-if="chosen && selectedCount > 1" class="px-6 py-4 flex items-baseline justify-between">
          <span class="text-sm text-gray-600">{{ selectedCount }} devices</span>
          <span class="text-lg font-extrabold text-gray-950">{{ money(totalAmount, chosen.currency) }}</span>
        </div>
      </div>

      <!-- The server says this device cannot be topped up at all. -->
      <div v-if="device && renewEligible === false" class="mt-10 p-6 bg-white rounded-2xl border border-gray-100">
        <h2 class="font-bold text-gray-950 mb-2">
          <i class="fas fa-circle-info text-gray-400 mr-2"></i>Renewal is not available for this device
        </h2>
        <p class="text-sm text-gray-600">
          Please contact support to renew your <strong>{{ device.model }}</strong>.
        </p>
      </div>

      <!-- Renewal Plans -->
      <div v-if="device && renewEligible !== false" class="mt-10">
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
                  isCurrentTier(plan.tier)
                    ? (plan.tier === 'Pro' ? 'bg-white text-navitag-blue' : 'bg-navitag-orange text-white')
                    : plan.tier === 'Pro'
                      ? 'bg-white text-navitag-blue'
                      : 'invisible'
                ]"
              >
                {{ isCurrentTier(plan.tier)
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
                  {{ isCurrentTier(plan.tier) ? "Top-up Now" : "Change Plan" }}
                  <template v-if="selectedCount > 1"> &middot; {{ selectedCount }} devices</template>
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
