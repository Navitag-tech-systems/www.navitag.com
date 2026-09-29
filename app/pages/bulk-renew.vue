<script setup lang="ts">
import { UNIFIED_API_URL, MEDUSA_BACKEND_URL, MEDUSA_PUBLISHABLE_KEY, MEDUSA_HIDDEN_SALES_CHANNEL_ID, MEDUSA_DIGITAL_DELIVERY_OPTION_ID } from '~/variables'

// Bulk renewal landing page: the "Renew now" button in the renewal-reminder
// email (api Cronjob::renewalReminder) opens this. Lists the signed-in owner's
// devices from GET /inventory/expiring -- the SAME ExpiringDevices lists the
// email was built from -- and renews the ticked ones at their CURRENT tier for
// one chosen duration. No upgrades here: tier changes stay on /top-up/<imei>.
//
// PH accounts only (Xendit checkout); the API says so via bulk_renew_available.
//
// Cart shape is the one /top-up builds and the webhook already fulfils: one line
// item per device, quantity 1, each carrying metadata.imei/ref1. Devices of
// different tiers take different variants in the same cart; the webhook resolves
// the tier per line item. One model per cart (the plan category is per model).

definePageMeta({ layout: false })
useHead({ title: 'Navitag - Renew Devices' })
useSeoMeta({ robots: 'noindex, nofollow' })

type Row = {
  imei: string
  name: string
  model: string
  plan_level: string
  expiration: string
  expiration_day: string
  days_left: number
  renewable: boolean
}

const { auth } = useFirebase()
const basic = useBasicStore()
const { $fbq } = useNuxtApp()

const loading = ref(true)
const error = ref('')
const showLogin = ref(false)
const locationError = ref(false)
const isAuthenticated = computed(() => basic.isLoggedIn)
const authChecked = computed(() => basic.authResolved)
const ipCountryCode = computed(() => basic.country)

const loaded = ref(false)
const available = ref(true)
const apiCountry = ref<string | null>(null)
const expiring = ref<Row[]>([])
const lapsed = ref<Row[]>([])
const bulkMax = ref(10)
const selected = ref<Set<string>>(new Set())

const MONTH_OPTIONS = [3, 6, 12]
const months = ref(3)

const countryCode = computed(() => apiCountry.value || basic.country)
const regionId = computed(() => basic.getRegionId(countryCode.value))

onMounted(async () => {
  await Promise.all([basic.ensureAuthResolved(), basic.resolveCountry()])
  if (!basic.country) {
    loading.value = false
    locationError.value = true
    return
  }
  if (basic.user) load()
  else {
    loading.value = false
    showLogin.value = true
  }
})

function retryLocation() {
  if (typeof window !== 'undefined') window.location.reload()
}

async function fetchExpiring(token: string) {
  return await $fetch<any>(`${UNIFIED_API_URL}/inventory/expiring`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

async function load() {
  const firebaseUser = auth.currentUser
  if (!firebaseUser) {
    showLogin.value = true
    return
  }
  loading.value = true
  error.value = ''
  try {
    let res: any
    try {
      res = await fetchExpiring(await firebaseUser.getIdToken())
    } catch (e: any) {
      if (e?.response?.status !== 401) throw e
      res = await fetchExpiring(await firebaseUser.getIdToken(true))
    }
    available.value = !!res.bulk_renew_available
    apiCountry.value = res.country || null
    expiring.value = res.expiring || []
    lapsed.value = res.lapsed || []
    bulkMax.value = res.bulk_max ?? 10
    loaded.value = true

    // Expiring + renewable are ticked up to the cap; lapsed ones are opt-in.
    // All ticked rows must share one model (see modelLock).
    const next = new Set<string>()
    let model: string | null = null
    for (const r of expiring.value) {
      if (!r.renewable || next.size >= bulkMax.value) continue
      if (model && r.model !== model) continue
      model = r.model
      next.add(r.imei)
    }
    selected.value = next

    const models = [...new Set([...expiring.value, ...lapsed.value].filter(r => r.renewable).map(r => r.model))]
    await Promise.all(models.map(fetchProducts))

    $fbq('ViewContent', {
      content_name: 'bulk_renew',
      content_category: 'plan_renewal',
      content_type: 'data_plan_list',
      audience: 'b2c',
    })
  } catch (e: any) {
    if (e?.response?.status === 401) {
      showLogin.value = true
      error.value = 'Session expired. Please sign in again.'
    } else {
      error.value = e?.data?.error || e?.message || 'Failed to load your devices.'
    }
  } finally {
    loading.value = false
  }
}

// --- Plan prices ------------------------------------------------------------
// variantsByModel[model][tier][months] = Medusa variant (with calculated_price).
// Resolved the way /top-up and the native app resolve them: category handle
// `${model}-data-plan` -> product by tag (basic/pro) -> variant by month number
// in its title. Never by SKU.
const variantsByModel = ref<Record<string, Record<string, Record<number, any>>>>({})
const productsLoading = ref(false)

async function fetchProducts(model: string) {
  productsLoading.value = true
  try {
    const headers = { 'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY }
    const catRes = await $fetch<{ product_categories: any[] }>(`${MEDUSA_BACKEND_URL}/store/product-categories`, {
      params: { handle: `${model.toLowerCase()}-data-plan` },
      headers,
    })
    const categoryId = catRes.product_categories?.[0]?.id
    if (!categoryId) return
    const res = await $fetch<{ products: any[] }>(`${MEDUSA_BACKEND_URL}/store/products`, {
      params: { category_id: categoryId, region_id: regionId.value, fields: '*variants.calculated_price' },
      headers,
    })
    const byTier: Record<string, Record<number, any>> = {}
    for (const p of res.products || []) {
      const tags = (p.tags || []).map((t: any) => String(t.value || '').toLowerCase())
      const tier = tags.includes('pro') ? 'pro' : tags.includes('basic') ? 'basic' : null
      if (!tier) continue
      byTier[tier] = byTier[tier] || {}
      for (const v of p.variants || []) {
        const m = /(\d+)\s*month/i.exec(String(v.title || ''))
        if (m) byTier[tier][Number(m[1])] = v
      }
    }
    variantsByModel.value = { ...variantsByModel.value, [model]: byTier }
  } catch {
    // Leaves the model without prices; its rows show "price unavailable" and
    // checkout stays disabled rather than guessing.
  } finally {
    productsLoading.value = false
  }
}

function variantFor(row: Row): any | null {
  return variantsByModel.value[row.model]?.[row.plan_level]?.[months.value] ?? null
}

function priceOf(row: Row): number | null {
  const v = variantFor(row)
  return v?.calculated_price?.calculated_amount ?? null
}

const currency = computed(() => {
  for (const r of selectedRows.value) {
    const c = variantFor(r)?.calculated_price?.currency_code
    if (c) return String(c).toUpperCase()
  }
  return 'PHP'
})

function money(v: number | null): string {
  if (v == null) return '—'
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: currency.value }).format(v)
}

// --- Selection ----------------------------------------------------------------
const allRows = computed(() => [...expiring.value, ...lapsed.value])
const selectedRows = computed(() => allRows.value.filter(r => selected.value.has(r.imei)))
const atCap = computed(() => selected.value.size >= bulkMax.value)
// One model per cart: once something is ticked, other models are locked out.
const modelLock = computed(() => selectedRows.value[0]?.model ?? null)

function selectable(row: Row): boolean {
  if (!row.renewable) return false
  if (modelLock.value && row.model !== modelLock.value) return false
  return selected.value.has(row.imei) || !atCap.value
}

function toggle(row: Row) {
  const next = new Set(selected.value)
  if (next.has(row.imei)) next.delete(row.imei)
  else if (selectable(row)) next.add(row.imei)
  selected.value = next
}

const total = computed(() => {
  let sum = 0
  for (const r of selectedRows.value) {
    const p = priceOf(r)
    if (p == null) return null
    sum += p
  }
  return sum
})

// --- New expiration preview -----------------------------------------------------
// GET /inventory/renew-preview takes ONE target tier, and a renewal keeps each
// device's own tier, so one request per tier present in the selection.
const preview = ref<Record<string, string>>({})
const previewLoading = ref(false)
const previewFailed = ref(false)
let previewSeq = 0
let previewTimer: ReturnType<typeof setTimeout> | null = null

const previewKey = computed(() => {
  if (!selectedRows.value.length) return ''
  return [months.value, countryCode.value || '', selectedRows.value.map(r => r.imei).join(',')].join('|')
})

watch(previewKey, (key) => {
  if (previewTimer) clearTimeout(previewTimer)
  previewSeq++
  preview.value = {}
  previewFailed.value = false
  previewLoading.value = !!key
  if (key) previewTimer = setTimeout(fetchPreview, 250)
})

async function fetchPreview() {
  const seq = ++previewSeq
  const firebaseUser = auth.currentUser
  if (!firebaseUser) return
  const groups: Record<string, string[]> = {}
  for (const r of selectedRows.value) (groups[r.plan_level] ||= []).push(r.imei)
  try {
    const token = await firebaseUser.getIdToken()
    const results = await Promise.all(Object.entries(groups).map(([tier, imeis]) =>
      $fetch<any>(`${UNIFIED_API_URL}/inventory/renew-preview`, {
        params: { imeis: imeis.join(','), tier, months: months.value, ...(countryCode.value ? { country: countryCode.value } : {}) },
        headers: { Authorization: `Bearer ${token}` },
      })))
    if (seq !== previewSeq) return
    const next: Record<string, string> = {}
    for (const res of results) for (const d of res.devices || []) next[d.imei] = d.new_expiration_day
    preview.value = next
  } catch {
    if (seq !== previewSeq) return
    previewFailed.value = true
  } finally {
    if (seq === previewSeq) previewLoading.value = false
  }
}

// --- Display helpers -------------------------------------------------------------
function formatDay(value: string | null | undefined): string {
  if (!value) return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysLabel(row: Row): string {
  const n = Math.abs(row.days_left)
  if (row.days_left < 0) return n === 1 ? 'Expired 1 day ago' : `Expired ${n} days ago`
  if (n === 0) return 'Expires today'
  return n === 1 ? '1 day left' : `${n} days left`
}

function tierLabel(tier: string): string {
  return tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : ''
}

// --- Checkout ----------------------------------------------------------------------
const cartLoading = ref(false)
const cartError = ref('')
const canCheckout = computed(() =>
  selectedRows.value.length > 0 && total.value != null && !cartLoading.value)

async function checkout() {
  const firebaseUser = auth.currentUser
  if (!firebaseUser) {
    showLogin.value = true
    return
  }
  const rows = selectedRows.value
  if (!rows.length || rows.some(r => !variantFor(r))) return

  cartLoading.value = true
  cartError.value = ''
  try {
    const { medusaFetch } = useMedusa()
    const meRes = await medusaFetch<{ customer: any }>('/store/customers/me')
    const customerEmail = meRes.customer?.email || firebaseUser.email
    if (!customerEmail) throw new Error('Unable to resolve customer email for checkout.')

    const cartMeta: Record<string, string> = {
      firebase_uid: firebaseUser.uid,
      device_imei: rows[0].imei,
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

    let lastCart: any = null
    for (const row of rows) {
      const added = await medusaFetch<{ cart: any }>(`/store/carts/${cartId}/line-items`, {
        method: 'POST',
        body: {
          variant_id: variantFor(row).id,
          quantity: 1,
          metadata: { imei: row.imei, ref1: row.name },
        },
      })
      lastCart = added?.cart ?? lastCart
    }

    // Exactly one item per ticked device, or stop before payment.
    const cartImeis = (lastCart?.items || []).map((i: any) => i?.metadata?.imei).filter(Boolean).sort()
    const wantImeis = rows.map(r => r.imei).sort()
    if (cartImeis.length !== wantImeis.length || cartImeis.some((v: string, i: number) => v !== wantImeis[i])) {
      throw new Error('Not every device could be added to the cart. Please try again.')
    }

    await medusaFetch(`/store/carts/${cartId}/shipping-methods`, {
      method: 'POST',
      body: { option_id: MEDUSA_DIGITAL_DELIVERY_OPTION_ID },
    })

    $fbq('AddToCart', {
      content_ids: [...new Set(rows.map(r => variantFor(r).id))],
      content_type: 'data_plan',
      content_name: 'bulk_renew',
      value: total.value ?? 0,
      currency: currency.value,
      num_items: rows.length,
      audience: 'b2c',
    })

    await navigateTo(`/plan-checkout/${cartId}`)
  } catch (e: any) {
    cartError.value = e?.data?.message || e?.message || 'Failed to create cart. Please try again.'
    cartLoading.value = false
  }
}

function onLoginSuccess() {
  showLogin.value = false
  load()
}
</script>

<template>
  <div class="min-h-screen bg-navitag-bg py-12 relative">
    <div class="container mx-auto px-4 sm:px-6 max-w-2xl">
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-extrabold text-gray-950 mb-2">Renew Devices</h1>
        <p class="text-gray-500 text-sm">Renew your expiring devices in one checkout.</p>
      </div>

      <div v-if="authChecked && !isAuthenticated && !locationError" class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm text-center">
        <i class="fas fa-lock mr-2"></i>
        You need to <button class="text-navitag-blue font-semibold underline" @click="showLogin = true">sign in</button> to view your devices.
      </div>

      <div v-if="locationError" class="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
        <i class="fas fa-map-marker-alt fa-2x text-gray-300 mb-4"></i>
        <h2 class="font-bold text-gray-950 text-lg mb-2">Unable to detect your location</h2>
        <p class="text-sm text-gray-500 mb-6">We couldn't reach our location service. Check your connection and try again.</p>
        <button class="px-6 py-3 rounded-xl bg-navitag-blue text-white font-semibold hover:bg-opacity-90 transition" @click="retryLocation">
          <i class="fas fa-rotate-right mr-2"></i>Retry
        </button>
      </div>

      <div v-if="loading && !locationError" class="text-center py-20">
        <i class="fas fa-spinner fa-spin fa-2x text-navitag-blue"></i>
        <p class="text-gray-500 mt-4">Loading your devices...</p>
      </div>

      <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
        <i class="fas fa-times-circle mr-2"></i>{{ error }}
      </div>

      <template v-if="loaded && !loading">
        <!-- Non-PH account -->
        <div v-if="!available" class="p-6 bg-white rounded-2xl border border-gray-100 text-center">
          <h2 class="font-bold text-gray-950 mb-2">Bulk renewal is not available for your account</h2>
          <p class="text-sm text-gray-600">
            Renew each device from its settings page in
            <a href="https://track.navitag.com" class="text-navitag-blue font-semibold">track.navitag.com</a>
            or in the Navitag mobile app, then tap <strong>Top-Up</strong>.
          </p>
        </div>

        <!-- Nothing due -->
        <div v-else-if="!expiring.length && !lapsed.length" class="p-8 bg-white rounded-2xl border border-gray-100 text-center">
          <i class="fas fa-circle-check fa-2x text-navitag-blue mb-3"></i>
          <h2 class="font-bold text-gray-950 mb-1">You're all set</h2>
          <p class="text-sm text-gray-500">None of your devices expire in the next 7 days.</p>
        </div>

        <template v-else>
          <!-- Duration -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
            <h2 class="font-bold text-gray-950 mb-1">Renew for</h2>
            <p class="text-xs text-gray-500 mb-4">Applied to every device you tick. Each device keeps its current plan.</p>
            <div class="grid grid-cols-3 gap-3">
              <button
                v-for="m in MONTH_OPTIONS"
                :key="m"
                class="py-3 rounded-xl border-2 font-semibold text-sm transition"
                :class="months === m ? 'border-navitag-orange bg-navitag-orange/5 text-gray-950' : 'border-gray-100 text-gray-600 hover:border-gray-200'"
                @click="months = m"
              >
                {{ m }} Months
              </button>
            </div>
          </div>

          <!-- Device list -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
              <h2 class="font-bold text-gray-950">Your devices</h2>
              <span class="text-xs shrink-0" :class="atCap ? 'text-navitag-orange font-semibold' : 'text-gray-400'">
                {{ selected.size }} of {{ bulkMax }} max
              </span>
            </div>

            <template v-for="section in [
              { key: 'expiring', title: 'Expiring within 7 days', rows: expiring },
              { key: 'lapsed', title: 'Recently expired', rows: lapsed },
            ]" :key="section.key">
              <template v-if="section.rows.length">
                <div class="px-5 py-2.5 bg-gray-50/70 border-b border-gray-100">
                  <h3 class="text-xs font-bold uppercase tracking-wide text-gray-500">{{ section.title }}</h3>
                  <p v-if="section.key === 'lapsed'" class="text-[11px] text-gray-500 mt-0.5">Renewing restarts the term from today.</p>
                </div>
                <ul>
                  <li
                    v-for="row in section.rows"
                    :key="row.imei"
                    class="px-5 py-3 border-b border-gray-50 flex items-start gap-3"
                    :class="selectable(row) || selected.has(row.imei) ? 'cursor-pointer hover:bg-gray-50/40' : 'opacity-60'"
                    @click="toggle(row)"
                  >
                    <i
                      class="fa-square-check w-4 text-center mt-1"
                      :class="selected.has(row.imei) ? 'fas text-navitag-blue' : 'far text-gray-300'"
                    ></i>
                    <div class="flex-1 min-w-0">
                      <div class="font-semibold text-gray-900 text-sm truncate">{{ row.name }}</div>
                      <div class="text-[11px] text-gray-500">
                        {{ tierLabel(row.plan_level) }} plan &middot; {{ row.days_left < 0 ? 'expired' : 'expires' }} {{ formatDay(row.expiration_day) }}
                      </div>
                      <div class="text-[11px] font-semibold" :class="row.days_left < 0 ? 'text-red-600' : 'text-navitag-orange'">
                        {{ daysLabel(row) }}
                      </div>
                      <div v-if="!row.renewable" class="text-[11px] text-gray-500 mt-0.5">
                        Not renewable here. Please contact support.
                      </div>
                    </div>
                    <div v-if="row.renewable" class="text-right text-[11px] shrink-0">
                      <div class="font-bold text-sm text-gray-950">{{ money(priceOf(row)) }}</div>
                      <div v-if="selected.has(row.imei)" class="mt-0.5" :class="preview[row.imei] ? 'text-navitag-blue font-semibold' : 'text-gray-400'">
                        <template v-if="preview[row.imei]">New: {{ formatDay(preview[row.imei]) }}</template>
                        <template v-else-if="previewLoading">estimating&hellip;</template>
                        <template v-else-if="previewFailed">could not estimate</template>
                      </div>
                    </div>
                  </li>
                </ul>
              </template>
            </template>

            <div class="px-5 py-4 flex items-baseline justify-between bg-gray-50">
              <span class="text-sm text-gray-600">
                Total &middot; {{ selected.size }} {{ selected.size === 1 ? 'device' : 'devices' }} &middot; {{ months }} months
              </span>
              <span class="text-xl font-extrabold text-gray-950">{{ money(total) }}</span>
            </div>
          </div>

          <button
            class="mt-6 w-full py-4 rounded-xl font-semibold bg-navitag-blue text-white hover:bg-opacity-90 shadow-lg shadow-navitag-blue/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="!canCheckout"
            @click="checkout"
          >
            <span v-if="cartLoading"><i class="fas fa-spinner fa-spin mr-2"></i>Processing...</span>
            <span v-else>Renew now &middot; {{ money(total) }}</span>
          </button>

          <div v-if="cartError" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
            <i class="fas fa-times-circle mr-2"></i>{{ cartError }}
          </div>

          <p class="mt-6 text-xs text-gray-500 text-center">
            To renew a single device or upgrade its plan, open the device's settings page in
            <a href="https://track.navitag.com" class="text-navitag-blue font-semibold">track.navitag.com</a>
            or in the Navitag mobile app, then tap <strong>Top-Up</strong>.
          </p>
        </template>
      </template>
    </div>

    <LoginOverlay v-model="showLogin" :ip-country-code="ipCountryCode" @success="onLoginSuccess" />
  </div>
</template>
