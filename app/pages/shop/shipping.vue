<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { getDialCodeForCountry } from '~/utils/countryData'

definePageMeta({
  middleware: [(to, from) => {
    // Only accessible via internal navigation from /shop, /shop/product/*,
    // or /shop/checkout/* (so the customer can step back from checkout
    // to fix an address). On direct loads / refreshes, Nuxt sets
    // `from === to`, so those bounce too.
    const ok = from.path === '/shop'
      || from.path.startsWith('/shop/product/')
      || from.path.startsWith('/shop/checkout/')
    if (!ok) return navigateTo('/shop')
  }],
})

const basic = useBasicStore()
const cartStore = useCartStore()
const { $fbq } = useNuxtApp()

const isAuthed = computed(() => basic.isLoggedIn)
const showLogin = ref(false)

// ─── Shipping address ────────────────────────────────────────────────
const ship = ref({
  name: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postal_code: '',
  phone: '',
})

// ─── Billing address (only used when sameAsShipping is false) ────────
const billingSameAsShipping = ref(true)
const bill = ref({
  name: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postal_code: '',
  phone: '',
})

const countryCode = computed(() => basic.country || '')
const countryName = computed(() => basic.countryName || '')
const dialCode = computed(() => getDialCodeForCountry(countryCode.value))

function splitName(full: string): { first_name?: string; last_name?: string } {
  const trimmed = full.trim().replace(/\s+/g, ' ')
  if (!trimmed) return {}
  const parts = trimmed.split(' ')
  if (parts.length === 1) return { first_name: parts[0] }
  return { first_name: parts.slice(0, -1).join(' '), last_name: parts.at(-1) }
}

const selectedShippingId = ref<string | null>(null)
const submitting = ref(false)
const submitError = ref('')

// Covers the boot-time work: cart refresh + region align + shipping
// options + address prefill from last-known order. Cleared once the
// form is hydrated so the customer doesn't see fields flicker into
// existence as the prefill resolves.
const prefilling = ref(true)

const cart = computed(() => cartStore.cart)
const cartLoading = computed(() => cartStore.loading)
const cartError = computed(() => cartStore.error)
const shippingOptions = computed(() => cartStore.shippingOptions)
const itemCount = computed(() => cartStore.itemCount)
const currency = computed(() => cartStore.currencyCode || cart.value?.currency_code || 'USD')

const items = computed<any[]>(() => cart.value?.items || [])

function fmt(amount: number | null | undefined): string {
  if (amount == null) return ''
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: (currency.value || 'USD').toUpperCase(),
    maximumFractionDigits: 2,
  }).format(amount)
}

// Medusa stores a placeholder variant title "novar" for single-variant
// products that have no real options. Hide those from the customer.
function isPlaceholderVariantValue(v: unknown): boolean {
  return typeof v === 'string' && v.trim().toLowerCase() === 'novar'
}

// Variant signature: prefer explicit options; otherwise variant.title (e.g. "12 months / Pro").
function variantLabel(item: any): string {
  const opts = item?.variant?.options
  if (Array.isArray(opts) && opts.length) {
    const values = opts
      .map((o: any) => o.value)
      .filter((v: any) => v && !isPlaceholderVariantValue(v))
    return values.join(' · ')
  }
  const title = item?.variant?.title || item?.variant_title || ''
  return isPlaceholderVariantValue(title) ? '' : title
}

function lineSubtotal(item: any): number {
  if (typeof item?.subtotal === 'number') return item.subtotal
  const unit = item?.unit_price ?? 0
  return unit * (item?.quantity ?? 0)
}

// ─── Charges breakdown ───────────────────────────────────────────────
const itemsSubtotal = computed(() => {
  const c = cart.value as any
  if (typeof c?.item_subtotal === 'number') return c.item_subtotal
  if (typeof c?.subtotal === 'number') return c.subtotal
  return items.value.reduce((sum, it) => sum + lineSubtotal(it), 0)
})

const selectedShipping = computed(() =>
  shippingOptions.value.find(o => o.id === selectedShippingId.value) || null,
)

// Live shipping cost: prefer the cart's stored shipping_total once a method
// has been set; fall back to the selected option's amount for preview.
const shippingCost = computed<number | null>(() => {
  const c = cart.value as any
  if (typeof c?.shipping_total === 'number' && c.shipping_total > 0) return c.shipping_total
  const opt = selectedShipping.value as any
  if (opt && opt.price_type === 'calculated') return null
  return opt?.amount ?? 0
})

const grandTotal = computed(() => {
  const ship = shippingCost.value ?? 0
  const c = cart.value as any
  // If cart already includes shipping in total, prefer that.
  if (typeof c?.total === 'number' && c.shipping_total === ship) return c.total
  return itemsSubtotal.value + ship
})

// ─── Lifecycle ───────────────────────────────────────────────────────
async function loadCart() {
  // Buy now mints a fresh cart on the product page and stores it in
  // cartStore. We do NOT fall back to ensureCart('physical') here —
  // that would pull the customer's long-lived saved cart and overwrite
  // its addresses / shipping method on submit. If the user lands on
  // shipping with no in-memory cart (e.g. hard refresh), the route
  // middleware has already bounced them; this is a defensive no-op.
  if (!cartStore.cartId) { prefilling.value = false; return }
  prefilling.value = true
  try {
    await cartStore.refresh()
    await cartStore.alignRegion()

    await cartStore.listShippingOptions()
    if (shippingOptions.value.length === 1) {
      selectedShippingId.value = shippingOptions.value[0]!.id
    }
    const existing = cart.value?.shipping_methods?.[0]?.shipping_option_id
    if (existing && !selectedShippingId.value) selectedShippingId.value = existing

    const stripDial = (p: string) => {
      const dc = dialCode.value
      if (!p) return ''
      const trimmed = p.replace(/\s+/g, '')
      if (dc && trimmed.startsWith(`+${dc}`)) return trimmed.slice(dc.length + 1)
      return p
    }
    const joinName = (a: any) => [a?.first_name, a?.last_name].filter(Boolean).join(' ')

    const applyShipping = (a: any) => {
      if (!a) return
      ship.value.name ||= joinName(a)
      ship.value.line1 ||= a.address_1 || ''
      ship.value.line2 ||= a.address_2 || ''
      ship.value.city ||= a.city || ''
      ship.value.state ||= a.province || ''
      ship.value.postal_code ||= a.postal_code || ''
      ship.value.phone ||= stripDial(a.phone || '')
    }

    // Prefer the address already on the active cart (e.g. customer hit Back
    // from checkout). Only shipping is prefilled — billing always starts in
    // "same as shipping" mode and is filled in fresh if the user unchecks.
    applyShipping(cart.value?.shipping_address)

    // Fresh cart with no shipping yet → look up the customer's last-known
    // shipping (latest completed order, then pre-saved carts).
    if (!ship.value.line1.trim()) {
      const last = await cartStore.fetchLastKnownAddresses()
      applyShipping(last.shipping)
    }
  }
  finally {
    prefilling.value = false
  }
}

function clearBilling() {
  bill.value.name = ''
  bill.value.line1 = ''
  bill.value.line2 = ''
  bill.value.city = ''
  bill.value.state = ''
  bill.value.postal_code = ''
  bill.value.phone = ''
}

onMounted(async () => {
  await Promise.all([
    basic.ensureAuthResolved(),
    basic.resolveCountry(),
  ])
  if (!isAuthed.value) { prefilling.value = false; showLogin.value = true; return }
  if (!cartStore.cartId) { prefilling.value = false; await navigateTo('/shop'); return }
  await loadCart()
})

// Always reset the billing fields when the customer toggles off
// "same as shipping" so they start from a blank slate (no leaked
// prefill from a prior session, no stale data from a previous toggle).
watch(billingSameAsShipping, (sameAsShipping) => {
  if (!sameAsShipping) clearBilling()
})

watch(showLogin, (open) => {
  if (!open && !isAuthed.value) navigateTo('/shop')
})
watch(isAuthed, async (v) => {
  if (v) {
    showLogin.value = false
    await loadCart()
  }
})

// ─── Submission ──────────────────────────────────────────────────────
function shippingFilled(a: typeof ship.value): boolean {
  return !!a.name.trim()
    && !!a.line1.trim()
    && !!a.city.trim()
    && !!a.state.trim()
    && !!a.phone.trim()
}

const canContinue = computed(() =>
  shippingFilled(ship.value)
  && (billingSameAsShipping.value || shippingFilled(bill.value))
  && !!countryCode.value
  && !!selectedShippingId.value
  && !!cartStore.cartId
  && itemCount.value > 0,
)

function toMedusaAddress(a: typeof ship.value) {
  const localPhone = a.phone.replace(/\s+/g, '')
  const phone = localPhone
    ? (dialCode.value ? `+${dialCode.value}${localPhone}` : localPhone)
    : undefined
  return {
    ...splitName(a.name),
    address_1: a.line1.trim(),
    address_2: a.line2.trim() || undefined,
    city: a.city.trim(),
    province: a.state.trim(),
    postal_code: a.postal_code.trim() || undefined,
    phone,
    country_code: countryCode.value.toLowerCase(),
  }
}

async function onContinue() {
  if (!canContinue.value || submitting.value) return
  submitting.value = true
  submitError.value = ''
  try {
    const shippingAddr = toMedusaAddress(ship.value)
    const billingAddr = billingSameAsShipping.value
      ? shippingAddr
      : toMedusaAddress(bill.value)

    await cartStore.updateCart({
      shipping_address: shippingAddr,
      billing_address: billingAddr,
    })
    await cartStore.setShippingMethod(selectedShippingId.value!)
    $fbq('InitiateCheckout', {
      content_ids: items.value.map((it: any) => it.variant_id).filter(Boolean),
      content_type: 'product',
      value: grandTotal.value,
      currency: (currency.value || 'USD').toUpperCase(),
      num_items: itemCount.value,
      audience: 'b2c',
    })
    await navigateTo(`/shop/checkout/${cartStore.cartId}`)
  }
  catch (e: any) {
    submitError.value = e?.data?.message || e?.message || 'Could not save shipping details.'
  }
  finally {
    submitting.value = false
  }
}

useSeoMeta({
  title: 'Shipping — Navitag Shop',
  robots: 'noindex, nofollow',
})
</script>

<template>
  <LoginOverlay
    v-model="showLogin"
    :ip-country-code="basic.country"
    @success="showLogin = false"
  />

  <template v-if="isAuthed">
    <nav class="max-w-3xl mx-auto px-6 sm:px-8 pt-6 text-[12.5px] text-gray-500">
      <ol class="flex items-center gap-2">
        <li><NuxtLink to="/" class="hover:text-gray-900 transition">Home</NuxtLink></li>
        <li class="text-gray-300">/</li>
        <li><NuxtLink to="/shop/product/track-1" class="hover:text-gray-900 transition">Shop</NuxtLink></li>
        <li class="text-gray-300">/</li>
        <li><span class="text-gray-700 font-medium">Shipping</span></li>
      </ol>
    </nav>

    <section class="max-w-3xl mx-auto px-6 sm:px-8 pt-6 pb-20">
      <h1 class="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-950">
        Shipping
      </h1>
      <p class="mt-2 text-[14.5px] text-gray-500">
        Review your order and tell us where to send it.
      </p>

      <p v-if="cartLoading && !cart" class="mt-6 text-[13px] text-gray-500">
        <i class="fas fa-spinner fa-spin mr-2"></i>Loading your cart…
      </p>
      <p v-else-if="cartError" class="mt-6 p-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700">
        {{ cartError }}
      </p>
      <p v-else-if="cart && itemCount === 0" class="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-[13px] text-yellow-800">
        Your cart is empty. <NuxtLink to="/shop" class="underline font-semibold">Browse the shop</NuxtLink>.
      </p>

      <!-- Compressed item list -->
      <div v-if="items.length" class="mt-8 rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100">
        <div
          v-for="item in items"
          :key="item.id"
          class="flex items-center gap-4 px-4 py-3"
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
          <div class="min-w-0 flex-1">
            <div class="text-[14px] font-semibold text-gray-950 truncate">
              {{ item.product_title || item.title }}
            </div>
            <div class="text-[12.5px] text-gray-500 truncate">
              <span v-if="variantLabel(item)">{{ variantLabel(item) }} · </span>
              Qty {{ item.quantity }}
            </div>
          </div>
          <div class="shrink-0 text-[14px] font-medium text-gray-900">
            {{ fmt(lineSubtotal(item)) }}
          </div>
        </div>
      </div>

      <form class="mt-8 space-y-8" @submit.prevent="onContinue">
        <!-- Shipping address -->
        <fieldset class="space-y-5">
          <legend class="text-[12px] uppercase tracking-[0.18em] font-semibold text-gray-700">
            Shipping address
          </legend>

          <input
            v-model="ship.name"
            type="text"
            required
            placeholder="Name"
            autocomplete="shipping name"
            class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navitag-blue focus:border-transparent"
          />

          <div class="flex rounded-xl border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-navitag-blue focus-within:border-transparent overflow-hidden">
            <span class="flex items-center justify-center px-3 bg-gray-50 border-r border-gray-200 text-gray-600 text-[14px] select-none">
              +{{ dialCode || '—' }}
            </span>
            <input
              v-model="ship.phone"
              type="tel"
              required
              inputmode="numeric"
              pattern="[0-9 \-]*"
              placeholder="Contact number"
              autocomplete="shipping tel-national"
              class="flex-1 px-4 py-3 bg-white text-gray-900 placeholder-gray-400 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
            />
          </div>

          <input
            v-model="ship.line1"
            type="text"
            required
            autocomplete="shipping address-line1"
            placeholder="Address line 1"
            class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navitag-blue focus:border-transparent"
          />
          <input
            v-model="ship.line2"
            type="text"
            autocomplete="shipping address-line2"
            placeholder="Address line 2 (optional)"
            class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navitag-blue focus:border-transparent"
          />

          <div class="grid sm:grid-cols-3 gap-5">
            <input
              v-model="ship.city"
              type="text"
              required
              autocomplete="shipping address-level2"
              placeholder="City"
              class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navitag-blue focus:border-transparent"
            />
            <input
              v-model="ship.state"
              type="text"
              required
              autocomplete="shipping address-level1"
              placeholder="State / Province"
              class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navitag-blue focus:border-transparent"
            />
            <input
              v-model="ship.postal_code"
              type="text"
              autocomplete="shipping postal-code"
              placeholder="ZIP / Postal"
              class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navitag-blue focus:border-transparent"
            />
          </div>

          <input
            :value="countryName ? `${countryName} (${countryCode})` : countryCode"
            type="text"
            readonly
            disabled
            autocomplete="shipping country-name"
            class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed"
          />
        </fieldset>

        <!-- Billing address -->
        <fieldset class="space-y-5">
          <legend class="text-[12px] uppercase tracking-[0.18em] font-semibold text-gray-700">
            Billing address
          </legend>

          <label class="flex items-center gap-2 text-[13.5px] text-gray-700 cursor-pointer select-none">
            <input v-model="billingSameAsShipping" type="checkbox" class="accent-navitag-blue" />
            Same as shipping address
          </label>

          <div v-if="!billingSameAsShipping" class="space-y-5">
            <input
              v-model="bill.name"
              type="text"
              required
              placeholder="Name"
              autocomplete="billing name"
              class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navitag-blue focus:border-transparent"
            />

            <div class="flex rounded-xl border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-navitag-blue focus-within:border-transparent overflow-hidden">
              <span class="flex items-center justify-center px-3 bg-gray-50 border-r border-gray-200 text-gray-600 text-[14px] select-none">
                +{{ dialCode || '—' }}
              </span>
              <input
                v-model="bill.phone"
                type="tel"
                required
                inputmode="numeric"
                pattern="[0-9 \-]*"
                placeholder="Contact number"
                autocomplete="billing tel-national"
                class="flex-1 px-4 py-3 bg-white text-gray-900 placeholder-gray-400 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
              />
            </div>

            <input
              v-model="bill.line1"
              type="text"
              required
              autocomplete="billing address-line1"
              placeholder="Address line 1"
              class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navitag-blue focus:border-transparent"
            />
            <input
              v-model="bill.line2"
              type="text"
              autocomplete="billing address-line2"
              placeholder="Address line 2 (optional)"
              class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navitag-blue focus:border-transparent"
            />

            <div class="grid sm:grid-cols-3 gap-5">
              <input
                v-model="bill.city"
                type="text"
                required
                autocomplete="billing address-level2"
                placeholder="City"
                class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navitag-blue focus:border-transparent"
              />
              <input
                v-model="bill.state"
                type="text"
                required
                autocomplete="billing address-level1"
                placeholder="State / Province"
                class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navitag-blue focus:border-transparent"
              />
              <input
                v-model="bill.postal_code"
                type="text"
                autocomplete="billing postal-code"
                placeholder="ZIP / Postal"
                class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navitag-blue focus:border-transparent"
              />
            </div>

            <input
              :value="countryName ? `${countryName} (${countryCode})` : countryCode"
              type="text"
              readonly
              disabled
              autocomplete="billing country-name"
              class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed"
            />
          </div>
        </fieldset>

        <!-- Shipping options -->
        <fieldset>
          <legend class="text-[12px] uppercase tracking-[0.18em] font-semibold text-gray-700">
            Shipping method
          </legend>
          <p v-if="cart && shippingOptions.length === 0 && !cartLoading" class="mt-2 text-[13px] text-gray-500">
            No shipping methods available for this destination.
          </p>
          <div v-else class="mt-3 space-y-2">
            <label
              v-for="opt in shippingOptions"
              :key="opt.id"
              class="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border bg-white cursor-pointer transition"
              :class="selectedShippingId === opt.id
                ? 'border-navitag-blue ring-2 ring-navitag-blue/20'
                : 'border-gray-200 hover:border-gray-300'"
            >
              <div class="flex items-center gap-3">
                <input
                  v-model="selectedShippingId"
                  type="radio"
                  name="shipping-option"
                  :value="opt.id"
                  class="accent-navitag-blue"
                />
                <span class="text-[14px] font-medium text-gray-900">{{ opt.name }}</span>
              </div>
              <span class="text-[14px] text-gray-700">
                {{ opt.price_type === 'calculated' ? 'Calculated at checkout' : fmt(opt.amount) }}
              </span>
            </label>
          </div>
        </fieldset>

        <!-- Charges breakdown -->
        <div v-if="items.length" class="rounded-2xl border border-gray-200 bg-white p-5 space-y-2">
          <div class="flex items-center justify-between text-[14px] text-gray-700">
            <span>Order subtotal</span>
            <span class="font-medium text-gray-900">{{ fmt(itemsSubtotal) }}</span>
          </div>
          <div class="flex items-center justify-between text-[14px] text-gray-700">
            <span>Shipping</span>
            <span class="font-medium text-gray-900">
              <template v-if="!selectedShipping">—</template>
              <template v-else-if="selectedShipping.price_type === 'calculated'">Calculated at checkout</template>
              <template v-else>{{ fmt(shippingCost) }}</template>
            </span>
          </div>
          <div class="pt-2 mt-1 border-t border-gray-100 flex items-center justify-between text-[15.5px]">
            <span class="font-semibold text-gray-950">Total</span>
            <span class="font-semibold text-gray-950">
              <template v-if="selectedShipping?.price_type === 'calculated'">
                {{ fmt(itemsSubtotal) }} + shipping
              </template>
              <template v-else>{{ fmt(grandTotal) }}</template>
            </span>
          </div>
        </div>

        <p v-if="submitError" class="text-[12.5px] text-red-600">{{ submitError }}</p>

        <button
          type="submit"
          :disabled="!canContinue || submitting"
          class="w-full h-12 rounded-full bg-navitag-blue text-white text-sm font-semibold hover:bg-[#006ADB] transition shadow-lg shadow-navitag-blue/20 disabled:opacity-50"
        >
          <span v-if="submitting"><i class="fas fa-spinner fa-spin mr-2"></i>Checking out…</span>
          <span v-else><i class="fas fa-credit-card mr-2"></i>Pay with Credit/Debit Card</span>
        </button>
      </form>
    </section>
  </template>

  <!-- Boot overlay: covers cart refresh + region align + shipping options
       + prefill of last-known address. Cleared once `loadCart()` resolves
       so the form doesn't flicker into place behind the customer. -->
  <div
    v-if="prefilling"
    class="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm flex items-center justify-center px-6"
  >
    <div class="text-center max-w-sm">
      <i class="fas fa-spinner fa-spin fa-2x text-navitag-blue mb-5"></i>
      <h2 class="text-lg font-extrabold text-gray-950 mb-2">Preparing your order…</h2>
      <p class="text-sm text-gray-500">
        Loading your cart and pulling your last-known shipping details.
      </p>
    </div>
  </div>
</template>
