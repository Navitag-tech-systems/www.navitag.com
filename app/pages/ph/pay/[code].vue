<script setup lang="ts">
import { UNIFIED_API_URL } from '~/variables'

// Short pay URL printed on every Navitag Business statement, PDF and reminder:
// navitag.com/ph/pay/<code>. The api (GET /billing/pay/{code}, public) says
// which QR Ph Xendit checkout is live for that bill -- replacing an expired one
// on the spot -- and this page shows it in a full-screen iframe, so the payer
// stays on navitag.com and the printed URL never goes stale.
//
// Fetched during SSR (useFetch), so the frame is in the first HTML response and
// hydration reuses the payload instead of asking the api again. /ph/pay is in
// UTILITY_PREFIXES: a payer abroad must not be region-redirected off the link.

definePageMeta({ layout: false })
useHead({ title: 'Navitag - Pay Statement' })
useSeoMeta({ robots: 'noindex, nofollow' })

type PayInfo = {
  status: 'open' | 'paid' | 'void' | 'not_found' | 'unavailable'
  url?: string
  invoice_no?: string
  company?: string
  currency?: string
  total?: number
  due_date?: string
  period?: string
  paid_at?: string | null
  message?: string
}

const route = useRoute()
const code = computed(() => String(route.params.code || '').toLowerCase())

// 404 / 503 still carry a JSON body with a status; read it from the error.
const { data, error } = await useFetch<PayInfo>(() => `${UNIFIED_API_URL}/billing/pay/${encodeURIComponent(code.value)}`, {
  key: `billing-pay-${code.value}`,
})
const info = computed<PayInfo>(() =>
  data.value ?? ((error.value?.data as PayInfo | undefined) ?? { status: error.value?.statusCode === 404 ? 'not_found' : 'unavailable' }),
)

const money = (v?: number) =>
  v == null ? '' : `${info.value.currency || 'PHP'} ${v.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const longDate = (d?: string | null) => {
  if (!d) return ''
  const t = new Date(d.length === 10 ? `${d}T00:00:00+08:00` : `${d.replace(' ', 'T')}Z`)
  return Number.isNaN(t.getTime()) ? d : t.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Manila' })
}
</script>

<template>
  <iframe
    v-if="info.status === 'open' && info.url"
    :src="info.url"
    title="Navitag secure checkout"
    class="fixed inset-0 h-full w-full border-0"
    allow="payment; clipboard-write"
  />

  <main v-else class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
    <div class="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
      <img src="/logo-sm.png" alt="Navitag" class="mx-auto mb-6 h-12 w-12">

      <template v-if="info.status === 'paid'">
        <h1 class="text-xl font-semibold text-gray-900">This statement is paid</h1>
        <p class="mt-2 text-gray-600">
          Thank you<template v-if="info.paid_at">, payment was received on {{ longDate(info.paid_at) }}</template>.
        </p>
      </template>

      <template v-else-if="info.status === 'void'">
        <h1 class="text-xl font-semibold text-gray-900">Nothing to pay</h1>
        <p class="mt-2 text-gray-600">There is no amount due on this statement.</p>
      </template>

      <template v-else-if="info.status === 'not_found'">
        <h1 class="text-xl font-semibold text-gray-900">Payment link not found</h1>
        <p class="mt-2 text-gray-600">
          Please check the link on your statement of account, or write to
          <a href="mailto:info@navitag.com" class="text-blue-600 underline">info@navitag.com</a>.
        </p>
      </template>

      <template v-else>
        <h1 class="text-xl font-semibold text-gray-900">Online payment is unavailable</h1>
        <p class="mt-2 text-gray-600">
          Online payment is not available for this statement right now. Please try again later, or write to
          <a href="mailto:info@navitag.com" class="text-blue-600 underline">info@navitag.com</a>
          for other ways to pay.
        </p>
      </template>

      <dl v-if="info.invoice_no" class="mt-6 space-y-1 border-t border-gray-100 pt-4 text-left text-sm">
        <div class="flex justify-between gap-4"><dt class="text-gray-500">Invoice No.</dt><dd class="font-medium text-gray-900">{{ info.invoice_no }}</dd></div>
        <div v-if="info.company" class="flex justify-between gap-4"><dt class="text-gray-500">Billed to</dt><dd class="text-right text-gray-900">{{ info.company }}</dd></div>
        <div v-if="info.period" class="flex justify-between gap-4"><dt class="text-gray-500">Period</dt><dd class="text-right text-gray-900">{{ info.period }}</dd></div>
        <div v-if="info.total != null" class="flex justify-between gap-4"><dt class="text-gray-500">Amount</dt><dd class="font-medium text-gray-900">{{ money(info.total) }}</dd></div>
        <div v-if="info.status === 'unavailable' && info.due_date" class="flex justify-between gap-4"><dt class="text-gray-500">Due date</dt><dd class="text-gray-900">{{ longDate(info.due_date) }}</dd></div>
      </dl>
    </div>
  </main>
</template>
