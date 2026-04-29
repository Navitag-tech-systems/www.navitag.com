<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { MEDUSA_BACKEND_URL, MEDUSA_PUBLISHABLE_KEY } from '~/variables'

definePageMeta({ layout: 'shop' })

const route = useRoute()
const slug = computed(() => String(route.params.slug || 'track-1'))

const basic = useBasicStore()
const cartStore = useCartStore()
const regionId = computed(() => basic.medusaRegionId)
const isAuthed = computed(() => basic.isLoggedIn)
const showLogin = ref(false)

interface MedusaVariantPrice {
  calculated_amount?: number | null
  original_amount?: number | null
  currency_code?: string | null
}
interface MedusaVariant {
  id: string
  title?: string | null
  calculated_price?: MedusaVariantPrice | null
}
interface MedusaImage { id?: string; url: string }
interface MedusaProduct {
  id: string
  title?: string | null
  subtitle?: string | null
  description?: string | null
  handle?: string | null
  thumbnail?: string | null
  images?: MedusaImage[] | null
  variants?: MedusaVariant[] | null
}

const { data: medusaProduct, pending: productLoading, error: productErrorRef, refresh: refetchProduct } = await useAsyncData<MedusaProduct | null>(
  'shop-product',
  async () => {
    if (!regionId.value) return null
    const res = await $fetch<{ products: MedusaProduct[] }>(`${MEDUSA_BACKEND_URL}/store/products`, {
      params: {
        handle: slug.value,
        region_id: regionId.value,
        fields: '*variants.calculated_price,*images',
      },
      headers: { 'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY },
    })
    return res.products?.[0] ?? null
  },
  // Refetch on slug change (in-app nav between products). Region changes are
  // driven explicitly via syncCustomerRegion() so we can gate the price UI.
  { watch: [slug] },
)

const productError = computed(() => {
  if (productErrorRef.value) return (productErrorRef.value as any)?.data?.message || (productErrorRef.value as any)?.message || 'Failed to load product.'
  if (medusaProduct.value === null && !productLoading.value) return 'Product not found.'
  return ''
})

function formatPrice(amount: number | null | undefined, currency: string | null | undefined): string | null {
  if (amount == null) return null
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: (currency || 'USD').toUpperCase(),
    maximumFractionDigits: 2,
  }).format(amount)
}

const livePrice = computed(() => {
  const v = medusaProduct.value?.variants?.[0]
  return formatPrice(v?.calculated_price?.calculated_amount, v?.calculated_price?.currency_code)
})
const totalPrice = computed(() => {
  const v = medusaProduct.value?.variants?.[0]
  const amt = v?.calculated_price?.calculated_amount
  if (amt == null) return null
  return formatPrice(amt * quantity.value, v?.calculated_price?.currency_code)
})
const liveCompareAt = computed(() => {
  const v = medusaProduct.value?.variants?.[0]
  const orig = v?.calculated_price?.original_amount
  const calc = v?.calculated_price?.calculated_amount
  if (orig == null || calc == null || orig <= calc) return null
  return formatPrice(orig, v?.calculated_price?.currency_code)
})
const liveImages = computed<string[]>(() => {
  const imgs = medusaProduct.value?.images?.map(i => i.url).filter(Boolean) as string[] | undefined
  if (imgs && imgs.length) return imgs
  const thumb = medusaProduct.value?.thumbnail
  return thumb ? [thumb] : []
})

// `customerReady` controls whether the price + Buy Now CTA are exposed to a
// real visitor. SSR + initial client hydration leave it `true` so crawlers see
// the product fully populated (with default-region pricing). On the client we
// then briefly flip it false while we resolve the visitor's actual country
// and (if it differs from the default region) refetch — preventing a flash of
// e.g. US prices to a PH customer before their PHP price loads.
const customerReady = ref(true)

// Token-guards against races where mount-time sync and post-login sync overlap.
let regionSyncToken = 0
async function syncCustomerRegion(force = false) {
  const token = ++regionSyncToken
  customerReady.value = false
  const before = regionId.value
  await basic.resolveCountry(force)
  if (regionId.value !== before) await refetchProduct()
  // Only the most recent sync gets to flip the gate back on.
  if (token === regionSyncToken) customerReady.value = true
}

onMounted(() => { syncCustomerRegion() })

// React to auth transitions. On sign-in: close the Buy Now overlay. On both
// sign-in AND sign-out: force a fresh country resolve so the header, footer,
// and pricing reflect the current visitor identity. Sign-in pulls the country
// from the authed backend profile; sign-out falls back to geo-IP.
watch(isAuthed, (v) => {
  if (v) showLogin.value = false
  syncCustomerRegion(true)
})

const activeImage = ref(0)
const quantity = ref(1)
const buyNowLoading = ref(false)
const buyNowError = ref('')
const { $fbq } = useNuxtApp()

// Fire ViewContent once per product, after Medusa returns the product so we
// can include the live variant id, price, and currency.
const viewContentFired = ref(false)
watch(
  medusaProduct,
  (p) => {
    if (!p || viewContentFired.value || !import.meta.client) return
    const variant = p.variants?.[0]
    $fbq('ViewContent', {
      content_ids: variant?.id ? [variant.id] : [],
      content_type: 'product',
      content_name: p.title || undefined,
      content_category: 'product',
      value: variant?.calculated_price?.calculated_amount ?? 0,
      currency: (variant?.calculated_price?.currency_code || 'USD').toUpperCase(),
      audience: 'b2c',
    })
    viewContentFired.value = true
  },
  { immediate: true },
)

async function buyNow() {
  buyNowError.value = ''
  if (!isAuthed.value) { showLogin.value = true; return }
  const variant = medusaProduct.value?.variants?.[0]
  const variantId = variant?.id
  if (!variantId) { buyNowError.value = 'No purchasable variant.'; return }
  buyNowLoading.value = true
  try {
    // Always mint a fresh cart for Buy now so the customer's pre-saved
    // physical_cart stays untouched. The previous in-memory cart (if any)
    // is just dropped — Medusa-side it lives on, but is no longer the
    // active checkout cart.
    await cartStore.createCart({ metadata: { source: 'shop_buy_now', product_handle: slug.value } })
    if (!cartStore.cartId) throw new Error(cartStore.error || 'Cart unavailable.')
    await cartStore.addLineItem(variantId, quantity.value)
    const unit = variant?.calculated_price?.calculated_amount ?? 0
    $fbq('AddToCart', {
      content_ids: [variantId],
      content_type: 'product',
      content_name: medusaProduct.value?.title || undefined,
      value: unit * quantity.value,
      currency: (variant?.calculated_price?.currency_code || 'USD').toUpperCase(),
      num_items: quantity.value,
      audience: 'b2c',
    })
    await navigateTo('/shop/shipping')
  }
  catch (e: any) {
    buyNowError.value = e?.data?.message || e?.message || 'Could not start checkout.'
  }
  finally {
    buyNowLoading.value = false
  }
}

function incQty() { quantity.value = Math.min(99, quantity.value + 1) }
function decQty() { quantity.value = Math.max(1, quantity.value - 1) }

watch(liveImages, () => { activeImage.value = 0 })

const canonicalUrl = computed(() => `https://navitag.com/shop/product/${slug.value}`)

useSeoMeta({
  title: () => medusaProduct.value?.title || 'Product',
  description: () => medusaProduct.value?.description || medusaProduct.value?.subtitle || undefined,
  ogTitle: () => medusaProduct.value?.title || undefined,
  ogDescription: () => medusaProduct.value?.description || medusaProduct.value?.subtitle || undefined,
  ogUrl: () => canonicalUrl.value,
  ogImage: () => liveImages.value[0] || undefined,
  twitterCard: 'summary_large_image',
  twitterImage: () => liveImages.value[0] || undefined,
})

useHead({
  link: [{ rel: 'canonical', href: canonicalUrl }],
})
</script>

<template>
  <LoginOverlay
    v-model="showLogin"
    :ip-country-code="basic.country"
    @success="showLogin = false"
  />

  <!-- Breadcrumb -->
  <nav class="max-w-7xl mx-auto px-6 sm:px-8 pt-6 text-[12.5px] text-gray-500">
    <ol class="flex items-center gap-2">
      <li><NuxtLink to="/" class="hover:text-gray-900 transition">Home</NuxtLink></li>
      <li class="text-gray-300">/</li>
      <li><NuxtLink to="/shop/product/track-1" class="hover:text-gray-900 transition">Shop</NuxtLink></li>
      <li v-if="medusaProduct?.title" class="text-gray-300">/</li>
      <li v-if="medusaProduct?.title"><span class="text-gray-700 font-medium">{{ medusaProduct.title }}</span></li>
    </ol>
  </nav>

  <!-- Hero: gallery + info -->
  <section class="max-w-7xl mx-auto px-6 sm:px-8 pt-6 pb-16 sm:pb-20">
    <div class="grid lg:grid-cols-12 gap-8 lg:gap-14">
      <!-- Gallery -->
      <div class="lg:col-span-7">
        <div class="lg:sticky lg:top-24">
          <div class="relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-gray-100 via-gray-50 to-white border border-gray-100">
            <div class="absolute inset-0 flex items-center justify-center">
              <img
                v-if="liveImages.length"
                :src="liveImages[activeImage] || liveImages[0]"
                :alt="medusaProduct?.title || ''"
                class="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            <template v-if="liveImages.length > 1">
              <button
                class="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-white transition"
                aria-label="Previous image"
                @click="activeImage = (activeImage - 1 + liveImages.length) % liveImages.length"
              >
                <i class="fas fa-chevron-left text-sm"></i>
              </button>
              <button
                class="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-white transition"
                aria-label="Next image"
                @click="activeImage = (activeImage + 1) % liveImages.length"
              >
                <i class="fas fa-chevron-right text-sm"></i>
              </button>

              <div class="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
                <button
                  v-for="(_, i) in liveImages"
                  :key="i"
                  class="h-1.5 rounded-full transition-all"
                  :class="activeImage === i ? 'w-5 bg-gray-900' : 'w-1.5 bg-gray-300 hover:bg-gray-400'"
                  :aria-label="`Go to image ${i + 1}`"
                  @click="activeImage = i"
                ></button>
              </div>
            </template>
          </div>

          <div v-if="liveImages.length > 1" class="mt-4 grid grid-cols-4 gap-3">
            <button
              v-for="(url, i) in liveImages"
              :key="url"
              class="relative aspect-square rounded-2xl bg-white border transition overflow-hidden"
              :class="activeImage === i ? 'border-navitag-blue ring-2 ring-navitag-blue/20' : 'border-gray-200 hover:border-gray-300'"
              @click="activeImage = i"
            >
              <img :src="url" alt="" class="absolute inset-0 w-full h-full object-cover" />
            </button>
          </div>
        </div>
      </div>

      <!-- Info -->
      <div class="lg:col-span-5">
        <h1 class="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05] text-gray-950">
          {{ medusaProduct?.title || (productLoading ? '…' : '') }}
        </h1>
        <p v-if="medusaProduct?.subtitle" class="mt-2 text-lg text-gray-500">
          {{ medusaProduct.subtitle }}
        </p>
        <p v-if="productError" class="mt-3 text-[12.5px] text-red-600">
          {{ productError }}
        </p>

        <!-- Price (gated on customerReady so a real visitor never sees a flash
             of default-region pricing before their geo/account region resolves) -->
        <div class="mt-8 flex items-baseline gap-3">
          <template v-if="!customerReady || productLoading || !livePrice">
            <span class="text-4xl font-semibold tracking-tight text-gray-300">—</span>
          </template>
          <template v-else>
            <span class="text-4xl font-semibold tracking-tight text-gray-950">{{ livePrice }}</span>
            <span v-if="liveCompareAt" class="text-xl text-gray-400 line-through">{{ liveCompareAt }}</span>
          </template>
        </div>

        <!-- Quantity + Buy now -->
        <div class="mt-8 flex items-stretch gap-3">
          <div class="inline-flex items-center rounded-full border border-gray-200 bg-white">
            <button
              class="w-10 h-12 text-gray-700 hover:text-gray-950 transition disabled:text-gray-300"
              :disabled="quantity <= 1"
              aria-label="Decrease quantity"
              @click="decQty"
            >
              <i class="fas fa-minus text-xs"></i>
            </button>
            <span class="w-10 text-center text-[15px] font-semibold text-gray-950">{{ quantity }}</span>
            <button
              class="w-10 h-12 text-gray-700 hover:text-gray-950 transition"
              aria-label="Increase quantity"
              @click="incQty"
            >
              <i class="fas fa-plus text-xs"></i>
            </button>
          </div>
          <button
            type="button"
            class="flex-1 h-12 rounded-full bg-navitag-blue text-white text-sm font-semibold hover:bg-[#006ADB] transition shadow-lg shadow-navitag-blue/20 disabled:opacity-50"
            :disabled="!customerReady || !livePrice || buyNowLoading"
            @click="buyNow"
          >
            <span v-if="buyNowLoading"><i class="fas fa-spinner fa-spin mr-2"></i>Starting…</span>
            <span v-else>Buy now<span v-if="customerReady && totalPrice"> · {{ totalPrice }}</span></span>
          </button>
        </div>
        <p v-if="buyNowError" class="mt-2 text-[12.5px] text-red-600">{{ buyNowError }}</p>

        <p v-if="medusaProduct?.description" class="mt-8 text-[15.5px] text-gray-600 leading-relaxed whitespace-pre-line">
          {{ medusaProduct.description }}
        </p>
      </div>
    </div>
  </section>
</template>
