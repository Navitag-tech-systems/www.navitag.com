<script setup lang="ts">
/**
 * Repeatable "paste a link" rows for the retailer's website and marketplace
 * pages.
 *
 * The retailer is never asked which platform a link belongs to — the host says
 * so. The badge beside a filled row shows what we worked out, which doubles as
 * confirmation that the URL parsed at all. The server derives `kind` the same
 * way and does not trust anything sent from here.
 */
const model = defineModel<string[]>({ required: true })

interface Props {
  max?: number
  disabled?: boolean
}
const props = withDefaults(defineProps<Props>(), { max: 8, disabled: false })

/** Host fragment → display name. Mirrors PartnerListing::LINK_HOSTS on the API. */
const PLATFORMS: Array<[string, string, string]> = [
  ['shopee', 'Shopee', 'fa-bag-shopping'],
  ['lazada', 'Lazada', 'fa-bag-shopping'],
  ['tiktok', 'TikTok Shop', 'fa-tiktok'],
  ['facebook', 'Facebook', 'fa-facebook'],
  ['fb.com', 'Facebook', 'fa-facebook'],
  ['instagram', 'Instagram', 'fa-instagram'],
  ['tokopedia', 'Tokopedia', 'fa-bag-shopping'],
  ['amazon', 'Amazon', 'fa-bag-shopping'],
  ['carousell', 'Carousell', 'fa-bag-shopping'],
]

const BRAND_ICONS = new Set(['fa-tiktok', 'fa-facebook', 'fa-instagram'])

/** One badge per row, recomputed as a batch so the template reads each row once. */
const badges = computed(() => model.value.map(url => classify(url ?? '')))

function classify(raw: string): { label: string, icon: string, brand: boolean } | null {
  const value = raw.trim()
  if (value.length < 4) return null
  // A bare "shopee.ph/navitag" is the normal way people paste these, so the
  // scheme is assumed rather than demanded — same rule the API applies.
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`
  let host: string
  try { host = new URL(withScheme).hostname.toLowerCase() }
  catch { return null }
  if (!host.includes('.')) return null
  for (const [needle, label, icon] of PLATFORMS) {
    if (host.includes(needle)) return { label, icon, brand: BRAND_ICONS.has(icon) }
  }
  return { label: 'Website', icon: 'fa-globe', brand: false }
}

function addRow() {
  if (model.value.length >= props.max) return
  model.value = [...model.value, '']
}

function removeRow(index: number) {
  // Never drop to zero rows — an empty list with no input is a dead end the
  // visitor has to discover an "add" button to escape.
  model.value = model.value.length <= 1
    ? ['']
    : model.value.filter((_, i) => i !== index)
}
</script>

<template>
  <div class="mt-2.5 space-y-2">
    <div v-for="(_, i) in model" :key="i" class="flex items-start gap-2">
      <div class="flex-1 min-w-0">
        <input
          v-model="model[i]"
          type="url"
          inputmode="url"
          autocomplete="off"
          :disabled="disabled"
          :aria-label="`Store link ${i + 1}`"
          class="block w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[15px] text-gray-950 focus:outline-none focus:ring-2 focus:ring-navitag-blue/30 focus:border-navitag-blue transition disabled:bg-gray-50"
        >
        <p
          v-if="badges[i]"
          class="mt-1 ml-1 text-[12px] text-gray-500 flex items-center gap-1.5"
        >
          <i class="text-[11px]" :class="[badges[i]!.brand ? 'fab' : 'fas', badges[i]!.icon]"></i>
          {{ badges[i]!.label }}
        </p>
      </div>

      <button
        type="button"
        :disabled="disabled"
        :aria-label="`Remove link ${i + 1}`"
        class="shrink-0 w-11 h-[46px] rounded-xl border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition flex items-center justify-center disabled:opacity-40"
        @click="removeRow(i)"
      >
        <i class="fas fa-xmark text-[13px]"></i>
      </button>
    </div>

    <button
      v-if="model.length < max"
      type="button"
      :disabled="disabled"
      class="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-navitag-blue hover:text-[#006ADB] transition disabled:text-gray-300"
      @click="addRow"
    >
      <i class="fas fa-plus text-[10px]"></i>
      Add another link
    </button>
  </div>
</template>
