<script setup lang="ts">
/**
 * One field on the partner listing form.
 *
 * Structure is fixed for every field on the page:
 *   1. the main label, in English
 *   2. the same label in the visitor's country language, when that is not
 *      English — omitted entirely otherwise, so an English-speaking visitor
 *      never sees the same words twice
 *   3. the control, with NO placeholder
 *
 * NO PLACEHOLDER IS DELIBERATE. A placeholder disappears the moment someone
 * types, which is exactly when a bilingual reader most needs the label still
 * on screen, and placeholder text is routinely mistaken for a filled value.
 * Anything a placeholder would have said goes in `hint`, which stays visible.
 *
 * Pass a default slot to supply your own control (hours grid, map picker, file
 * uploader); otherwise the component renders a plain input or textarea bound to
 * v-model.
 */
import { RTL_LOCALES } from '~/utils/partnerFormLocales'

const model = defineModel<string>({ default: '' })

interface Props {
  /** English label — always shown. */
  label: string
  /** Country-language label. Empty/undefined renders nothing. */
  secondary?: string
  /** BCP-47 tag for `secondary`, used for lang/dir and correct font fallback. */
  locale?: string | null
  /** Persistent helper text under the control. Never a placeholder. */
  hint?: string
  /** Validation message. Replaces the hint and reddens the control. */
  error?: string
  required?: boolean
  type?: 'text' | 'email' | 'tel' | 'url'
  autocomplete?: string
  inputmode?: 'text' | 'email' | 'tel' | 'url' | 'numeric'
  rows?: number
  maxlength?: number
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  secondary: '',
  locale: null,
  hint: '',
  error: '',
  required: false,
  type: 'text',
  autocomplete: undefined,
  inputmode: undefined,
  rows: 0,
  maxlength: undefined,
  disabled: false,
})

const slots = useSlots()
const id = useId()

const isRtl = computed(() => !!props.locale && RTL_LOCALES.has(props.locale))
const isTextarea = computed(() => props.rows > 0)
const hasCustomControl = computed(() => !!slots.default)

const controlClass = computed(() => [
  'mt-2.5 block w-full px-4 py-3 rounded-xl border bg-white text-[15px] text-gray-950',
  'focus:outline-none focus:ring-2 transition disabled:bg-gray-50 disabled:text-gray-400',
  props.error
    ? 'border-red-300 focus:ring-red-500/25 focus:border-red-400'
    : 'border-gray-200 focus:ring-navitag-blue/30 focus:border-navitag-blue',
  isTextarea.value ? 'resize-y leading-relaxed' : '',
])
</script>

<template>
  <div>
    <!-- Labels. Bound to the control by id for the plain case; a custom control
         owns its own labelling, so the wrapper is a <span> there rather than a
         <label> pointing at nothing. -->
    <component
      :is="hasCustomControl ? 'div' : 'label'"
      :for="hasCustomControl ? undefined : id"
      class="block"
    >
      <span class="block text-[13.5px] font-semibold text-gray-900 leading-snug">
        {{ label }}
        <span v-if="required" class="text-navitag-blue" aria-hidden="true">*</span>
      </span>
      <span
        v-if="secondary"
        class="block text-[12.5px] text-gray-500 leading-snug mt-0.5"
        :lang="locale || undefined"
        :dir="isRtl ? 'rtl' : undefined"
      >{{ secondary }}</span>
    </component>

    <!-- Control -->
    <slot>
      <textarea
        v-if="isTextarea"
        :id="id"
        v-model="model"
        :rows="rows"
        :required="required"
        :maxlength="maxlength"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :aria-invalid="!!error"
        :aria-describedby="hint || error ? `${id}-hint` : undefined"
        :class="controlClass"
      ></textarea>
      <input
        v-else
        :id="id"
        v-model="model"
        :type="type"
        :required="required"
        :maxlength="maxlength"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :aria-invalid="!!error"
        :aria-describedby="hint || error ? `${id}-hint` : undefined"
        :class="controlClass"
      >
    </slot>

    <p
      v-if="error || hint"
      :id="`${id}-hint`"
      class="mt-1.5 text-[12.5px] leading-snug"
      :class="error ? 'text-red-600' : 'text-gray-500'"
    >
      <i v-if="error" class="fas fa-circle-exclamation text-[11px] mr-1"></i>{{ error || hint }}
    </p>
  </div>
</template>
