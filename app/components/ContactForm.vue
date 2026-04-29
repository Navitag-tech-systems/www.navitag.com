<script setup lang="ts">
import { UNIFIED_API_URL } from '~/variables'

interface Props {
  /** Heading above the form. Pass empty string to hide. */
  heading?: string
  /** Subheading / intro copy. Pass empty string to hide. */
  subheading?: string
  /** Pre-filled subject / context sent alongside the message. */
  subject?: string
  /** Label for the submit button (idle state). */
  submitLabel?: string
  /** Render without the outer card chrome — for when parent provides framing. */
  bare?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  heading: 'Get in touch',
  subheading: 'Tell us what you need. We read every message and reply within one business day.',
  subject: '',
  submitLabel: 'Send message',
  bare: false,
})

const emit = defineEmits<{
  success: [payload: { name: string; email: string }]
  error: [message: string]
}>()

const name = ref('')
const email = ref('')
const message = ref('')

type Status = 'idle' | 'submitting' | 'success' | 'error'
const status = ref<Status>('idle')
const errorMessage = ref('')

// Country: prefers logged-in profile, falls back to IP. Informational only —
// the field is allowed to be null if detection fails.
const basic = useBasicStore()
onMounted(() => { basic.resolveCountry() })
const countryCode = computed(() => basic.country || '')
const { $fbq } = useNuxtApp()

const isEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))
const isValid = computed(() =>
  name.value.trim().length >= 2
  && isEmailValid.value
  && message.value.trim().length >= 10,
)

async function submit() {
  if (!isValid.value || status.value === 'submitting') return
  status.value = 'submitting'
  errorMessage.value = ''

  const payload = {
    name: name.value.trim(),
    email: email.value.trim(),
    message: message.value.trim(),
    country_code: countryCode.value || '',
    subject: props.subject || '',
    source_url: typeof window !== 'undefined' ? window.location.href : '',
  }

  const body = new URLSearchParams()
  for (const [key, value] of Object.entries(payload)) body.append(key, value)

  try {
    const res = await fetch(`${UNIFIED_API_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `Request failed (${res.status})`)
    }
    status.value = 'success'
    const audience = inferAudience({ subject: props.subject })
    $fbq('Lead', {
      content_name: props.subject || 'contact_form',
      content_category: audience === 'b2b' ? 'b2b_contact' : 'b2c_contact',
      audience,
      lead_type: audience === 'b2b' ? 'business_inquiry' : 'consumer_inquiry',
      country_code: countryCode.value,
    })
    emit('success', { name: payload.name, email: payload.email })
    name.value = ''
    email.value = ''
    message.value = ''
  }
  catch (err) {
    status.value = 'error'
    errorMessage.value = err instanceof Error ? err.message : 'Something went wrong. Try again.'
    emit('error', errorMessage.value)
  }
}

function reset() {
  status.value = 'idle'
  errorMessage.value = ''
}
</script>

<template>
  <div
    :class="bare
      ? ''
      : 'rounded-3xl bg-white border border-gray-200/70 shadow-sm p-6 sm:p-8'"
  >
    <!-- Heading -->
    <div v-if="heading || subheading" class="mb-6 sm:mb-8">
      <h3 v-if="heading" class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-950">
        {{ heading }}
      </h3>
      <p v-if="subheading" class="mt-2 text-[14.5px] text-gray-600 leading-relaxed">
        {{ subheading }}
      </p>
    </div>

    <!-- Success state -->
    <div
      v-if="status === 'success'"
      class="rounded-2xl bg-green-50 border border-green-200 p-5 sm:p-6 flex items-start gap-4"
    >
      <div class="shrink-0 w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center">
        <i class="fas fa-check text-[13px]"></i>
      </div>
      <div class="flex-1">
        <div class="text-[15px] font-semibold text-gray-950">
          Message sent.
        </div>
        <p class="mt-1 text-[13.5px] text-gray-700 leading-relaxed">
          Thanks — we'll reply within one business day.
        </p>
        <button
          type="button"
          class="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-green-700 hover:text-green-800 transition"
          @click="reset"
        >
          <i class="fas fa-rotate-left text-[11px]"></i>
          Send another
        </button>
      </div>
    </div>

    <!-- Form -->
    <form
      v-else
      class="space-y-4"
      novalidate
      @submit.prevent="submit"
    >
      <!-- Name -->
      <div>
        <label for="cf-name" class="block text-[12px] uppercase tracking-[0.15em] font-semibold text-gray-500">
          Name
        </label>
        <input
          id="cf-name"
          v-model="name"
          type="text"
          autocomplete="name"
          required
          minlength="2"
          :disabled="status === 'submitting'"
          class="mt-2 block w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[14.5px] text-gray-950 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navitag-blue/30 focus:border-navitag-blue transition disabled:bg-gray-50"
          placeholder="Your full name"
        >
      </div>

      <!-- Email -->
      <div>
        <label for="cf-email" class="block text-[12px] uppercase tracking-[0.15em] font-semibold text-gray-500">
          Email
        </label>
        <input
          id="cf-email"
          v-model="email"
          type="email"
          autocomplete="email"
          required
          inputmode="email"
          :disabled="status === 'submitting'"
          class="mt-2 block w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[14.5px] text-gray-950 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navitag-blue/30 focus:border-navitag-blue transition disabled:bg-gray-50"
          placeholder="you@example.com"
        >
      </div>

      <!-- Message -->
      <div>
        <label for="cf-message" class="block text-[12px] uppercase tracking-[0.15em] font-semibold text-gray-500">
          Message
        </label>
        <textarea
          id="cf-message"
          v-model="message"
          rows="5"
          required
          minlength="10"
          :disabled="status === 'submitting'"
          class="mt-2 block w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[14.5px] text-gray-950 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navitag-blue/30 focus:border-navitag-blue transition resize-y disabled:bg-gray-50"
          placeholder="How can we help?"
        ></textarea>
      </div>

      <!-- Error -->
      <div
        v-if="status === 'error' && errorMessage"
        class="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700 flex items-start gap-2"
      >
        <i class="fas fa-circle-exclamation mt-0.5"></i>
        <span class="flex-1">{{ errorMessage }}</span>
      </div>

      <!-- Submit -->
      <div class="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
        <button
          type="submit"
          :disabled="!isValid || status === 'submitting'"
          class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-navitag-blue text-white text-sm font-semibold hover:bg-[#006ADB] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <template v-if="status === 'submitting'">
            <i class="fas fa-circle-notch fa-spin text-[12px]"></i>
            Sending…
          </template>
          <template v-else>
            {{ submitLabel }}
            <i class="fas fa-arrow-right text-[11px]"></i>
          </template>
        </button>
        <span v-if="countryCode" class="text-[12px] text-gray-400">
          Sending from <span class="font-semibold text-gray-600">{{ countryCode }}</span>
        </span>
      </div>
    </form>
  </div>
</template>
