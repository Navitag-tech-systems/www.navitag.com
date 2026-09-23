<script setup lang="ts">
/**
 * Weekly store hours — seven fixed rows, Monday first (ISO-8601, matching the
 * `day_of_week` column the API writes).
 *
 * A day is one of three states, and the difference matters downstream: open
 * with a time pair, explicitly closed, or untouched. The API drops untouched
 * days rather than storing them blank, so "we never said" and "we are shut"
 * stay distinguishable when the store locator decides whether to print
 * "Closed" or print nothing at all.
 *
 * WHY THIS IS NOT <input type="time">
 * That control's 12h-vs-24h rendering comes from the BROWSER's locale and is
 * not settable from the page — same markup shows "2:30 PM" to one visitor and
 * "14:30" to the next, with no CSS or attribute able to influence it. Retailers
 * here read a 12-hour clock, so the only way to guarantee am/pm is to stop
 * using the native picker. Three selects also sidestep the native control's
 * worst trait: a partially-typed time silently reads back as empty.
 *
 * THE MODEL STAYS 24-HOUR. `HoursRow.opens/closes` remain "HH:MM" strings
 * because that is what the API validates and what MySQL's TIME column holds.
 * The am/pm split lives only in `ui` below and never leaves this component —
 * storing a display format would be storing a decision we would then have to
 * undo in every reader.
 *
 * Day names come from Intl in the visitor's locale; the English names are the
 * fallback when the tag is unknown or the engine ships a trimmed ICU.
 */
import { weekdayNames } from '~/utils/partnerFormLocales'
import type { HoursRow } from '~/utils/partnerForm'

const model = defineModel<HoursRow[]>({ required: true })

interface Props {
  /** BCP-47 tag for the secondary day names. Null renders English only. */
  locale?: string | null
  /** Localised word for "Closed". */
  closedLabel?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  locale: null,
  closedLabel: '',
  disabled: false,
})

const EN_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const HOURS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
// Five-minute granularity. Coarser steps (half-hour dropdowns) would have been
// one control instead of three, but they cannot express a shop that opens at
// 8:20 — and silently refusing a true answer is worse than an extra select.
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

type Meridiem = 'AM' | 'PM' | ''
interface Parts { h: string, m: string, ap: Meridiem }

/** "14:30" | "14:30:00" -> {h:'2', m:'30', ap:'PM'}; anything unusable -> blanks. */
function toParts(value: string): Parts {
  const m = /^(\d{1,2}):(\d{2})/.exec((value || '').trim())
  if (!m) return { h: '', m: '', ap: '' }
  const h24 = Number(m[1])
  if (!Number.isFinite(h24) || h24 > 23) return { h: '', m: '', ap: '' }
  const ap: Meridiem = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return { h: String(h12), m: m[2]!, ap }
}

/** {h:'2', m:'30', ap:'PM'} -> "14:30"; incomplete -> "" (the untouched state). */
function toHHMM(p: Parts): string {
  if (!p.h || !p.m || !p.ap) return ''
  let h24 = Number(p.h) % 12
  if (p.ap === 'PM') h24 += 12
  return `${String(h24).padStart(2, '0')}:${p.m}`
}

// `ui` is the editable source of truth for the times; `model` is derived from
// it one-way. A two-way watch between them would fight itself, because an
// incomplete selection has no representation in the model at all.
const ui = ref(
  Array.from({ length: 7 }, (_, i) => ({
    open: toParts(model.value[i]?.opens ?? ''),
    close: toParts(model.value[i]?.closes ?? ''),
  })),
)

/**
 * Fill the parts a retailer has not reached yet, so a common time is two clicks
 * rather than six. Picking an hour implies "o'clock", and retail opens in the
 * morning and closes in the afternoon — both are overridable, and neither fires
 * unless an hour was actually chosen.
 */
function applyDefaults(part: Parts, which: 'open' | 'close') {
  if (!part.h) return
  if (!part.m) part.m = '00'
  if (!part.ap) part.ap = which === 'open' ? 'AM' : 'PM'
}

watch(ui, (rows) => {
  rows.forEach((row, i) => {
    applyDefaults(row.open, 'open')
    applyDefaults(row.close, 'close')
    const target = model.value[i]
    if (!target) return
    target.opens = toHHMM(row.open)
    target.closes = toHHMM(row.close)
  })
}, { deep: true, immediate: true })

const localDays = computed(() => (props.locale ? weekdayNames(props.locale) : []))

function localDay(index: number): string {
  const name = localDays.value[index]
  // Skip the second line when Intl just handed back the English name anyway.
  return name && name.toLowerCase() !== EN_DAYS[index]!.toLowerCase() ? name : ''
}

/**
 * Copy Monday's pair down the week. Retailers overwhelmingly trade the same
 * hours Monday to Saturday, and repeating six selects twelve more times on a
 * phone is where this form would otherwise be abandoned. Days already marked
 * closed keep that state — the shortcut fills hours, it does not reopen a shop.
 */
function applyToAll() {
  const first = ui.value[0]
  if (!first || !canApplyToAll.value) return
  ui.value = ui.value.map((row, i) =>
    i === 0 || model.value[i]?.closed
      ? row
      : { open: { ...first.open }, close: { ...first.close } },
  )
}

const canApplyToAll = computed(() => {
  const first = ui.value[0]
  return !!first && !model.value[0]?.closed
    && !!toHHMM(first.open) && !!toHHMM(first.close)
})

/** Human-readable 12-hour summary, so the chosen pair is legible at a glance. */
function summary(index: number): string {
  const row = model.value[index]
  if (!row) return ''
  if (row.closed) return ''
  const a = ui.value[index]?.open
  const b = ui.value[index]?.close
  if (!a || !b || !toHHMM(a) || !toHHMM(b)) return ''
  return `${a.h}:${a.m} ${a.ap} – ${b.h}:${b.m} ${b.ap}`
}

const selectClass = 'px-2 py-2 rounded-lg border border-gray-200 bg-white text-[13.5px] '
  + 'text-gray-950 focus:outline-none focus:ring-2 focus:ring-navitag-blue/30 '
  + 'focus:border-navitag-blue transition disabled:bg-gray-50 disabled:text-gray-300'
</script>

<template>
  <div class="mt-2.5 rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
    <div v-for="(row, i) in model" :key="row.day" class="px-3.5 py-3">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
        <!-- Day name -->
        <div class="w-[104px] shrink-0">
          <span class="block text-[13.5px] font-medium text-gray-900 leading-snug">{{ EN_DAYS[i] }}</span>
          <span v-if="localDay(i)" class="block text-[12px] text-gray-500 leading-snug" :lang="locale || undefined">
            {{ localDay(i) }}
          </span>
        </div>

        <!-- Opens -->
        <div v-if="ui[i]" class="flex items-center gap-1">
          <select
            v-model="ui[i]!.open.h"
            :disabled="disabled || row.closed"
            :aria-label="`${EN_DAYS[i]} opening hour`"
            :class="selectClass"
          >
            <option value="">--</option>
            <option v-for="h in HOURS" :key="h" :value="h">{{ h }}</option>
          </select>
          <span class="text-gray-400 text-[13px]">:</span>
          <select
            v-model="ui[i]!.open.m"
            :disabled="disabled || row.closed"
            :aria-label="`${EN_DAYS[i]} opening minute`"
            :class="selectClass"
          >
            <option value="">--</option>
            <option v-for="m in MINUTES" :key="m" :value="m">{{ m }}</option>
          </select>
          <select
            v-model="ui[i]!.open.ap"
            :disabled="disabled || row.closed"
            :aria-label="`${EN_DAYS[i]} opening AM or PM`"
            :class="selectClass"
          >
            <option value="">--</option>
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>

        <span class="text-gray-400 text-[13px] shrink-0">to</span>

        <!-- Closes -->
        <div v-if="ui[i]" class="flex items-center gap-1">
          <select
            v-model="ui[i]!.close.h"
            :disabled="disabled || row.closed"
            :aria-label="`${EN_DAYS[i]} closing hour`"
            :class="selectClass"
          >
            <option value="">--</option>
            <option v-for="h in HOURS" :key="h" :value="h">{{ h }}</option>
          </select>
          <span class="text-gray-400 text-[13px]">:</span>
          <select
            v-model="ui[i]!.close.m"
            :disabled="disabled || row.closed"
            :aria-label="`${EN_DAYS[i]} closing minute`"
            :class="selectClass"
          >
            <option value="">--</option>
            <option v-for="m in MINUTES" :key="m" :value="m">{{ m }}</option>
          </select>
          <select
            v-model="ui[i]!.close.ap"
            :disabled="disabled || row.closed"
            :aria-label="`${EN_DAYS[i]} closing AM or PM`"
            :class="selectClass"
          >
            <option value="">--</option>
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>

        <!-- Closed toggle -->
        <label class="flex items-center gap-2 shrink-0 cursor-pointer select-none ml-auto">
          <input
            v-model="row.closed"
            type="checkbox"
            :disabled="disabled"
            class="w-4 h-4 rounded border-gray-300 text-navitag-blue focus:ring-navitag-blue/30"
          >
          <span class="text-[13px] text-gray-600 leading-none">
            Closed<span v-if="closedLabel" class="text-gray-400"> / {{ closedLabel }}</span>
          </span>
        </label>
      </div>

      <p v-if="summary(i)" class="mt-1 ml-[104px] pl-3 text-[12px] text-gray-400">
        {{ summary(i) }}
      </p>
    </div>

    <div class="px-3.5 py-2.5">
      <button
        type="button"
        :disabled="!canApplyToAll || disabled"
        class="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-navitag-blue hover:text-[#006ADB] disabled:text-gray-300 disabled:cursor-not-allowed transition"
        @click="applyToAll"
      >
        <i class="fas fa-arrow-down text-[10px]"></i>
        Apply Monday's hours to the rest of the week
      </button>
    </div>
  </div>
</template>
