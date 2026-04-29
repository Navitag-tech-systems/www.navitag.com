<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({ layout: false })

const route = useRoute()
const orderId = computed(() => route.params.order_id as string)

const { medusaFetch } = useMedusa()

const order = ref<any>(null)
const loading = ref(true)
const error = ref('')

useHead({ title: 'Navitag Shop — Order Confirmed' })
useSeoMeta({ robots: 'noindex, nofollow' })

onMounted(async () => {
  try {
    const res = await medusaFetch<{ order: any }>(`/store/orders/${orderId.value}`, {
      params: {
        fields: '*items,*items.thumbnail,+items.product_handle,*shipping_address,*shipping_methods,+total,+subtotal,+shipping_total,+currency_code',
      },
    })
    order.value = res.order
  }
  catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Failed to load order.'
  }
  finally {
    loading.value = false
  }
})

const currency = computed(() => (order.value?.currency_code || 'USD').toUpperCase())
function fmt(amount: number | null | undefined): string {
  if (amount == null) return ''
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.value,
    maximumFractionDigits: 2,
  }).format(amount)
}

const items = computed<any[]>(() => order.value?.items || [])
const ship = computed(() => order.value?.shipping_address || null)

function fmtAddress(a: any): string {
  if (!a) return ''
  return [
    [a.first_name, a.last_name].filter(Boolean).join(' '),
    a.address_1,
    a.address_2,
    [a.city, a.province, a.postal_code].filter(Boolean).join(', '),
    a.country_code ? a.country_code.toUpperCase() : '',
  ].filter(Boolean).join('\n')
}
</script>

<template>
  <div class="min-h-screen bg-navitag-bg py-12">
    <div class="container mx-auto px-6 max-w-xl">
      <div v-if="loading" class="text-center py-20">
        <i class="fas fa-spinner fa-spin fa-2x text-navitag-blue"></i>
      </div>

      <div v-else-if="error" class="text-center py-20">
        <h1 class="text-xl font-extrabold text-gray-950 mb-2">Order placed</h1>
        <p class="text-sm text-gray-500">We couldn't load the receipt right now: {{ error }}</p>
        <p class="text-sm text-gray-500 mt-2">Order ID: <span class="font-mono">{{ orderId }}</span></p>
      </div>

      <div v-else-if="order">
        <div class="text-center mb-8">
          <div class="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-check text-green-500 fa-2x"></i>
          </div>
          <h1 class="text-3xl font-extrabold text-gray-950 mb-2">Thanks for your order</h1>
          <p class="text-sm text-gray-500">
            A confirmation has been sent to your email. Order
            <span class="font-mono text-gray-700">{{ order.display_id || orderId }}</span>.
          </p>
        </div>

        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div class="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <h2 class="font-bold text-gray-950 text-sm uppercase tracking-wider">Items</h2>
          </div>
          <div class="divide-y divide-gray-100">
            <div
              v-for="item in items"
              :key="item.id"
              class="px-6 py-4 flex items-center gap-4"
            >
              <div class="w-14 h-14 shrink-0 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                <img
                  v-if="item.thumbnail"
                  :src="item.thumbnail"
                  :alt="item.product_title || item.title || ''"
                  class="w-full h-full object-cover"
                />
                <i v-else class="fas fa-box text-gray-300"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-900 text-sm truncate">
                  {{ item.product_title || item.title }}
                </p>
                <p class="text-xs text-gray-500 mt-0.5">Qty {{ item.quantity }}</p>
              </div>
              <span class="font-medium text-gray-900 text-sm shrink-0">
                {{ fmt(item.subtotal ?? (item.unit_price * item.quantity)) }}
              </span>
            </div>
            <div class="px-6 py-3 flex justify-between items-center text-sm">
              <span class="text-gray-500">Subtotal</span>
              <span class="text-gray-900 font-medium">{{ fmt(order.subtotal) }}</span>
            </div>
            <div class="px-6 py-3 flex justify-between items-center text-sm">
              <span class="text-gray-500">Shipping</span>
              <span class="text-gray-900 font-medium">{{ fmt(order.shipping_total) }}</span>
            </div>
            <div class="px-6 py-4 flex justify-between items-center bg-gray-50">
              <span class="font-bold text-gray-950">Total</span>
              <span class="font-extrabold text-lg text-navitag-blue">{{ fmt(order.total) }}</span>
            </div>
          </div>
        </div>

        <div v-if="ship" class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div class="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <h2 class="font-bold text-gray-950 text-sm uppercase tracking-wider">Shipping to</h2>
          </div>
          <div class="px-6 py-4">
            <p class="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{{ fmtAddress(ship) }}</p>
            <p v-if="ship.phone" class="text-xs text-gray-500 mt-2">
              <i class="fas fa-phone mr-1.5 text-gray-400"></i>{{ ship.phone }}
            </p>
          </div>
        </div>

        <div class="text-center">
          <NuxtLink to="/shop" class="inline-block px-6 py-2 rounded-full bg-navitag-blue text-white text-sm font-semibold hover:bg-opacity-90 transition">
            Continue Shopping
          </NuxtLink>
        </div>
      </div>
    </div>

    <FooterMinimal />
  </div>
</template>
