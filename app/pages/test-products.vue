<script setup lang="ts">
import { MEDUSA_BACKEND_URL, MEDUSA_PUBLISHABLE_KEY } from '~/variables'

useSeoMeta({
  title: 'Navitag - Product Test Page',
  robots: 'noindex, nofollow',
})

const searchQuery = ref('')
const products = ref<any[]>([])
const loading = ref(true)
const error = ref('')

async function fetchProducts(query?: string) {
  loading.value = true
  error.value = ''

  try {
    const params = new URLSearchParams()
    if (query) {
      params.set('q', query)
    }

    const url = `${MEDUSA_BACKEND_URL}/store/products${params.toString() ? '?' + params.toString() : ''}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (MEDUSA_PUBLISHABLE_KEY) {
      headers['x-publishable-api-key'] = MEDUSA_PUBLISHABLE_KEY
    }

    const res = await $fetch<{ products: any[] }>(url, { headers })
    products.value = res.products ?? []
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Failed to fetch products'
    products.value = []
  } finally {
    loading.value = false
  }
}

const debouncedSearch = (() => {
  let timeout: ReturnType<typeof setTimeout>
  return (val: string) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fetchProducts(val || undefined), 300)
  }
})()

watch(searchQuery, (val) => debouncedSearch(val))

onMounted(() => fetchProducts())
</script>

<template>
  <div class="min-h-screen bg-navitag-bg py-12">
    <div class="container mx-auto px-6 max-w-5xl">
      <div class="mb-8">
        <h1 class="text-3xl font-extrabold text-gray-950 mb-2">Product Test Page</h1>
        <p class="text-gray-500 text-sm">Fetching from <code class="bg-gray-200 px-1.5 py-0.5 rounded text-xs">{{ MEDUSA_BACKEND_URL }}/store/products</code></p>
      </div>

      <!-- Search -->
      <div class="mb-8">
        <div class="relative max-w-md">
          <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search products..."
            class="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navitag-blue focus:border-transparent"
          >
        </div>
      </div>

      <!-- Warning if no key -->
      <div v-if="!MEDUSA_PUBLISHABLE_KEY" class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm">
        <i class="fas fa-exclamation-triangle mr-2"></i>
        <strong>Missing publishable API key.</strong> Set <code>MEDUSA_PUBLISHABLE_KEY</code> in <code>app/variables.ts</code>.
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-20">
        <i class="fas fa-spinner fa-spin fa-2x text-navitag-blue"></i>
        <p class="text-gray-500 mt-4">Loading products...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
        <i class="fas fa-times-circle mr-2"></i> {{ error }}
      </div>

      <!-- Empty -->
      <div v-else-if="products.length === 0" class="text-center py-20 text-gray-500">
        <i class="fas fa-box-open fa-3x mb-4 text-gray-300"></i>
        <p>No products found{{ searchQuery ? ` for "${searchQuery}"` : '' }}.</p>
      </div>

      <!-- Product Grid -->
      <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="product in products"
          :key="product.id"
          class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition"
        >
          <!-- Thumbnail -->
          <div class="aspect-square bg-gray-100 flex items-center justify-center">
            <img
              v-if="product.thumbnail || product.images?.length"
              :src="product.thumbnail || product.images[0].url"
              :alt="product.title"
              class="w-full h-full object-cover"
              loading="lazy"
            >
            <i v-else class="fas fa-image fa-3x text-gray-300"></i>
          </div>

          <!-- Info -->
          <div class="p-5">
            <h3 class="font-bold text-gray-950 mb-1">{{ product.title }}</h3>
            <p v-if="product.description" class="text-sm text-gray-500 line-clamp-2 mb-3">{{ product.description }}</p>

            <!-- Variants / Price -->
            <div v-if="product.variants?.length" class="text-sm text-gray-700">
              <span class="font-semibold text-navitag-blue">
                {{ formatPrice(product.variants[0]) }}
              </span>
              <span v-if="product.variants.length > 1" class="text-gray-400 ml-1">
                ({{ product.variants.length }} variants)
              </span>
            </div>

            <!-- Tags -->
            <div v-if="product.tags?.length" class="flex flex-wrap gap-1.5 mt-3">
              <span
                v-for="tag in product.tags"
                :key="tag.id"
                class="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium"
              >
                {{ tag.value }}
              </span>
            </div>

            <!-- ID for debugging -->
            <p class="text-[10px] text-gray-400 mt-3 font-mono">{{ product.id }}</p>
          </div>
        </div>
      </div>

      <!-- Count -->
      <div v-if="!loading && !error && products.length" class="mt-6 text-sm text-gray-400 text-center">
        {{ products.length }} product{{ products.length === 1 ? '' : 's' }} returned
      </div>
    </div>
  </div>
</template>

<script lang="ts">
function formatPrice(variant: any): string {
  if (!variant?.prices?.length) return 'Price N/A'
  const price = variant.prices[0]
  const amount = price.amount / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: price.currency_code?.toUpperCase() || 'USD',
  }).format(amount)
}
</script>
