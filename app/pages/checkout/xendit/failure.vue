<script setup lang="ts">
import { XENDIT_RETURN_KEY, type XenditReturnState } from '~/composables/useXenditCheckout'

definePageMeta({ layout: false })
useHead({ title: 'Navitag — Payment Not Completed' })
useSeoMeta({ robots: 'noindex, nofollow' })

const retryTo = ref('/')

onMounted(() => {
  if (!import.meta.client) return
  try {
    const raw = localStorage.getItem(XENDIT_RETURN_KEY)
    if (raw) {
      const state = JSON.parse(raw) as XenditReturnState
      // Retry the same cart: top-up returns to its checkout page; shop sends
      // the customer back to the shipping step (its checkout guards direct loads).
      retryTo.value = state.flow === 'topup'
        ? `/plan-checkout/${state.cartId}`
        : '/shop/shipping'
    }
  }
  catch { /* fall back to home */ }
  finally {
    localStorage.removeItem(XENDIT_RETURN_KEY)
  }
})
</script>

<template>
  <div class="min-h-screen bg-navitag-bg flex items-center justify-center px-6 py-12">
    <div class="max-w-md w-full text-center">
      <div class="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
        <i class="fas fa-times-circle text-red-400 fa-2x"></i>
      </div>
      <h1 class="text-xl font-extrabold text-gray-950 mb-2">Payment not completed</h1>
      <p class="text-sm text-gray-500 mb-6">
        Your e-wallet payment was cancelled or didn't go through. No charge was made — you can try again.
      </p>
      <div class="flex flex-col gap-3">
        <NuxtLink
          :to="retryTo"
          class="w-full py-3 rounded-xl bg-navitag-blue text-white font-semibold text-sm hover:bg-opacity-90 transition"
        >
          <i class="fas fa-rotate-right mr-2"></i>Try again
        </NuxtLink>
        <NuxtLink to="/" class="text-sm text-navitag-blue hover:underline">Back to home</NuxtLink>
      </div>
    </div>
  </div>
</template>
