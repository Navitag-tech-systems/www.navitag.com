<script setup lang="ts">
/**
 * /partner-listing — retailer self-submission for the "where to buy" pages.
 *
 * Deliberately invisible to search: noindex/nofollow meta, an X-Robots-Tag
 * header from routeRules, a Disallow in robots.txt, and an exclusion from the
 * sitemap. Four layers because they fail differently — a meta tag is useless to
 * a crawler that never renders, robots.txt is advisory, and the sitemap is the
 * only one that actively invites indexing. This page is given out by link, by
 * the sales team, to shops we are already talking to.
 *
 * Every field follows the same shape (see PartnerField): English label, the
 * same label in the visitor's country language when that is not English, then
 * the control with NO placeholder.
 */
import { UNIFIED_API_URL } from '~/variables'
import { resolveFormLocale, secondaryLabels, type PartnerFormLabels } from '~/utils/partnerFormLocales'
import type { HoursRow, MapPinValue, ProofImage } from '~/utils/partnerForm'

useHead({
  title: 'Navitag — Partner listing',
  meta: [
    { name: 'robots', content: 'noindex, nofollow, noarchive, nosnippet' },
    { name: 'googlebot', content: 'noindex, nofollow' },
  ],
})

/* ── Locale ──────────────────────────────────────────────────────────── */

const basic = useBasicStore()
onMounted(() => basic.resolveCountry())

const countryCode = computed(() => basic.country || '')
const locale = computed(() => resolveFormLocale(basic.country))
const labels = computed<PartnerFormLabels | null>(() => secondaryLabels(locale.value))

/** Secondary label for a key, or '' when the visitor reads the English one. */
function sl(key: keyof PartnerFormLabels): string {
  return labels.value?.[key] ?? ''
}

/* ── Form state ──────────────────────────────────────────────────────── */

const form = reactive({
  companyName: '',
  storefrontName: '',
  businessEmail: '',
  businessPhone: '',
  pocName: '',
  pocTitle: '',
  pocPhone: '',
  pocEmail: '',
  storeAddress: '',
})

const links = ref<string[]>([''])
const proofs = ref<ProofImage[]>([])
const mapPin = ref<MapPinValue>({ link: '', lat: null, lng: null, place_id: '', formatted_address: '' })

// Monday-first, matching partner_listing_hours.day_of_week (ISO-8601).
const hours = ref<HoursRow[]>(
  Array.from({ length: 7 }, (_, i) => ({ day: i + 1, closed: false, opens: '', closes: '' })),
)

/* ── Spam protection ─────────────────────────────────────────────────── */
// Same three stateless defences as ContactForm, retuned for a form that takes
// minutes rather than seconds to complete honestly.
const website = ref('')                       // honeypot — humans leave it empty
const formLoadedAt = ref(0)
const MIN_SUBMIT_MS = 4000
const COOLDOWN_MS = 15_000
const COOLDOWN_KEY = 'navitag_partner_last_submit'

onMounted(() => { formLoadedAt.value = Date.now() })

/* ── Validation ──────────────────────────────────────────────────────── */

const submitted = ref(false)   // only show field errors after a submit attempt
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const fieldErrors = computed(() => {
  const e: Record<string, string> = {}
  if (form.companyName.trim().length < 2) e.companyName = 'Enter the registered company name.'
  if (!EMAIL_RE.test(form.businessEmail.trim())) e.businessEmail = 'Enter a valid email address.'
  if (form.businessPhone.trim().length < 5) e.businessPhone = 'Enter a contact number we can reach you on.'
  if (form.pocName.trim().length < 2) e.pocName = 'Enter the name of the person we should speak to.'
  if (!EMAIL_RE.test(form.pocEmail.trim())) e.pocEmail = 'Enter a valid email address.'
  if (form.storeAddress.trim().length < 8) e.storeAddress = 'Enter the full street address of the storefront.'
  if (proofs.value.length === 0) e.proofs = 'Add at least one photo showing Navitag products in your store.'
  return e
})

const isValid = computed(() => Object.keys(fieldErrors.value).length === 0)
function errorFor(key: string): string {
  return submitted.value ? (fieldErrors.value[key] ?? '') : ''
}

/* ── Submit ──────────────────────────────────────────────────────────── */

type Status = 'idle' | 'submitting' | 'success' | 'error'
const status = ref<Status>('idle')
const errorMessage = ref('')
const reference = ref('')

async function submit() {
  submitted.value = true
  if (status.value === 'submitting') return

  if (!isValid.value) {
    // Long form, short viewport — jump to the first thing that needs fixing
    // rather than leaving the visitor to hunt for it.
    await nextTick()
    document.querySelector('[data-field-error]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }

  const now = Date.now()
  try {
    const last = Number(localStorage.getItem(COOLDOWN_KEY) || 0)
    if (last && now - last < COOLDOWN_MS) {
      status.value = 'error'
      errorMessage.value = 'Please wait a few seconds before submitting again.'
      return
    }
  }
  catch { /* localStorage unavailable — skip the cooldown check */ }

  // Honeypot filled, or completed implausibly fast → a bot. Show success and
  // send nothing, so it gets no signal and stops retrying.
  if (website.value.trim() !== '' || now - formLoadedAt.value < MIN_SUBMIT_MS) {
    status.value = 'success'
    return
  }

  status.value = 'submitting'
  errorMessage.value = ''

  const payload = {
    company_name: form.companyName.trim(),
    storefront_name: form.storefrontName.trim(),
    business_email: form.businessEmail.trim(),
    business_phone: form.businessPhone.trim(),
    poc_name: form.pocName.trim(),
    poc_title: form.pocTitle.trim(),
    poc_phone: form.pocPhone.trim(),
    poc_email: form.pocEmail.trim(),
    store_address: form.storeAddress.trim(),
    links: links.value.map(l => l.trim()).filter(Boolean),
    // Sent whole; the API drops days that were never answered so that an
    // untouched day stays distinguishable from a day marked closed.
    hours: hours.value.map(h => ({
      day: h.day,
      closed: h.closed,
      opens: h.opens,
      closes: h.closes,
    })),
    map: {
      link: mapPin.value.link,
      lat: mapPin.value.lat,
      lng: mapPin.value.lng,
      place_id: mapPin.value.place_id,
      formatted_address: mapPin.value.formatted_address,
    },
    proofs: proofs.value.map(p => ({ name: p.name, data: p.data })),
    country_code: countryCode.value,
    form_locale: locale.value || '',
    source_url: typeof window !== 'undefined' ? window.location.href : '',
    website: website.value,   // honeypot — lets the API reject too
  }

  try {
    const res = await fetch(`${UNIFIED_API_URL}/partner-listing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok || body?.status !== 'success') {
      throw new Error(body?.message || `Submission failed (${res.status})`)
    }
    reference.value = String(body.reference || '')
    status.value = 'success'
    try { localStorage.setItem(COOLDOWN_KEY, String(Date.now())) }
    catch { /* ignore */ }
  }
  catch (err) {
    status.value = 'error'
    errorMessage.value = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
  }
}

const busy = computed(() => status.value === 'submitting')
</script>

<template>
  <div class="min-h-screen">
    <!-- Header -->
    <header class="px-5 pt-10 pb-6 sm:pt-14 sm:pb-8">
      <div class="max-w-2xl mx-auto">
        <p class="text-[12px] uppercase tracking-[0.18em] font-semibold text-navitag-blue">
          Retail partners
        </p>
        <h1 class="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-gray-950">
          List your store
        </h1>
        <p class="mt-3 text-[15px] text-gray-600 leading-relaxed">
          Already stocking Navitag? Send us your store details and we'll add you to our
          "where to buy" listings so nearby customers can find you. One submission per
          storefront — a chain submits each branch separately.
        </p>
      </div>
    </header>

    <!-- Success -->
    <div v-if="status === 'success'" class="px-5 pb-20">
      <div class="max-w-2xl mx-auto rounded-3xl bg-white border border-gray-200/70 shadow-sm p-7 sm:p-9">
        <div class="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center">
          <i class="fas fa-check"></i>
        </div>
        <h2 class="mt-5 text-2xl font-semibold tracking-tight text-gray-950">
          Submission received
        </h2>
        <p class="mt-2 text-[14.5px] text-gray-600 leading-relaxed">
          A copy has been emailed to the addresses on the form. Our team reviews listings
          and will be in touch — usually within two business days.
        </p>
        <div v-if="reference" class="mt-5 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3.5">
          <div class="text-[11.5px] uppercase tracking-[0.15em] font-semibold text-gray-500">
            Reference
          </div>
          <div class="mt-1 text-[19px] font-mono font-semibold text-gray-950">{{ reference }}</div>
          <p class="mt-1.5 text-[12.5px] text-gray-500">Quote this if you need to follow up.</p>
        </div>
      </div>
    </div>

    <!-- Form -->
    <form v-else class="px-5 pb-20" novalidate @submit.prevent="submit">
      <div class="max-w-2xl mx-auto space-y-8">
        <!-- 1 · Business -->
        <section class="rounded-3xl bg-white border border-gray-200/70 shadow-sm p-6 sm:p-8">
          <h2 class="text-lg font-semibold tracking-tight text-gray-950">
            Business details
            <span v-if="sl('sectionBusiness')" class="block text-[13px] font-normal text-gray-500 mt-0.5" :lang="locale || undefined">
              {{ sl('sectionBusiness') }}
            </span>
          </h2>

          <div class="mt-6 space-y-5">
            <div :data-field-error="errorFor('companyName') || undefined">
              <PartnerField
                v-model="form.companyName"
                label="Company name"
                :secondary="sl('companyName')"
                :locale="locale"
                :error="errorFor('companyName')"
                :disabled="busy"
                autocomplete="organization"
                :maxlength="200"
                required
              />
            </div>

            <PartnerField
              v-model="form.storefrontName"
              label="Storefront name"
              :secondary="sl('storefrontName')"
              :locale="locale"
              hint="Only if the shop trades under a different name from the registered company."
              :disabled="busy"
              :maxlength="200"
            />

            <div :data-field-error="errorFor('businessEmail') || undefined">
              <PartnerField
                v-model="form.businessEmail"
                label="Business contact email"
                :secondary="sl('businessEmail')"
                :locale="locale"
                type="email"
                inputmode="email"
                autocomplete="email"
                :error="errorFor('businessEmail')"
                hint="A copy of this submission is sent here."
                :disabled="busy"
                :maxlength="255"
                required
              />
            </div>

            <div :data-field-error="errorFor('businessPhone') || undefined">
              <PartnerField
                v-model="form.businessPhone"
                label="Business contact number"
                :secondary="sl('businessPhone')"
                :locale="locale"
                type="tel"
                inputmode="tel"
                autocomplete="tel"
                :error="errorFor('businessPhone')"
                :disabled="busy"
                :maxlength="40"
                required
              />
            </div>
          </div>
        </section>

        <!-- 2 · Point of contact -->
        <section class="rounded-3xl bg-white border border-gray-200/70 shadow-sm p-6 sm:p-8">
          <h2 class="text-lg font-semibold tracking-tight text-gray-950">
            Point of contact
            <span v-if="sl('sectionContact')" class="block text-[13px] font-normal text-gray-500 mt-0.5" :lang="locale || undefined">
              {{ sl('sectionContact') }}
            </span>
          </h2>
          <p class="mt-1.5 text-[13px] text-gray-500 leading-relaxed">
            The person we should speak to about this listing.
          </p>

          <div class="mt-6 space-y-5">
            <div :data-field-error="errorFor('pocName') || undefined">
              <PartnerField
                v-model="form.pocName"
                label="Point of contact name"
                :secondary="sl('pocName')"
                :locale="locale"
                autocomplete="name"
                :error="errorFor('pocName')"
                :disabled="busy"
                :maxlength="160"
                required
              />
            </div>

            <PartnerField
              v-model="form.pocTitle"
              label="Job title / position"
              :secondary="sl('pocTitle')"
              :locale="locale"
              autocomplete="organization-title"
              :disabled="busy"
              :maxlength="120"
            />

            <PartnerField
              v-model="form.pocPhone"
              label="Point of contact number"
              :secondary="sl('pocPhone')"
              :locale="locale"
              type="tel"
              inputmode="tel"
              hint="Leave blank if it is the same as the business number."
              :disabled="busy"
              :maxlength="40"
            />

            <div :data-field-error="errorFor('pocEmail') || undefined">
              <PartnerField
                v-model="form.pocEmail"
                label="Point of contact email"
                :secondary="sl('pocEmail')"
                :locale="locale"
                type="email"
                inputmode="email"
                :error="errorFor('pocEmail')"
                hint="A copy of this submission is sent here too."
                :disabled="busy"
                :maxlength="255"
                required
              />
            </div>
          </div>
        </section>

        <!-- 3 · Storefront -->
        <section class="rounded-3xl bg-white border border-gray-200/70 shadow-sm p-6 sm:p-8">
          <h2 class="text-lg font-semibold tracking-tight text-gray-950">
            Storefront
            <span v-if="sl('sectionStore')" class="block text-[13px] font-normal text-gray-500 mt-0.5" :lang="locale || undefined">
              {{ sl('sectionStore') }}
            </span>
          </h2>

          <div class="mt-6 space-y-5">
            <div :data-field-error="errorFor('storeAddress') || undefined">
              <PartnerField
                v-model="form.storeAddress"
                label="Storefront / business address"
                :secondary="sl('storeAddress')"
                :locale="locale"
                :rows="3"
                autocomplete="street-address"
                :error="errorFor('storeAddress')"
                hint="Unit or stall number, building, street, city and postcode."
                :disabled="busy"
                :maxlength="500"
                required
              />
            </div>

            <!-- No `hint` here on purpose: the instruction differs between the
                 Google-map path and the paste-a-link fallback, and only the
                 component knows which one is live. A hint set here rendered
                 "drag the map" underneath a field with no map in it. -->
            <PartnerField
              label="Map pin"
              :secondary="sl('mapPin')"
              :locale="locale"
            >
              <PartnerMapPin v-model="mapPin" :country-code="countryCode" :disabled="busy" />
            </PartnerField>
          </div>
        </section>

        <!-- 4 · Online presence -->
        <section class="rounded-3xl bg-white border border-gray-200/70 shadow-sm p-6 sm:p-8">
          <h2 class="text-lg font-semibold tracking-tight text-gray-950">
            Online presence
            <span v-if="sl('sectionOnline')" class="block text-[13px] font-normal text-gray-500 mt-0.5" :lang="locale || undefined">
              {{ sl('sectionOnline') }}
            </span>
          </h2>

          <div class="mt-6">
            <PartnerField
              label="Website and online marketplace pages"
              :secondary="sl('onlineLinks')"
              :locale="locale"
              hint="Your own site plus any Shopee, Lazada, TikTok Shop or social storefronts. One link per row."
            >
              <PartnerLinks v-model="links" :disabled="busy" />
            </PartnerField>
          </div>
        </section>

        <!-- 5 · Hours -->
        <section class="rounded-3xl bg-white border border-gray-200/70 shadow-sm p-6 sm:p-8">
          <h2 class="text-lg font-semibold tracking-tight text-gray-950">
            Store hours
            <span v-if="sl('sectionHours')" class="block text-[13px] font-normal text-gray-500 mt-0.5" :lang="locale || undefined">
              {{ sl('sectionHours') }}
            </span>
          </h2>

          <div class="mt-6">
            <PartnerField
              label="Weekly store hours"
              :secondary="sl('storeHours')"
              :locale="locale"
              hint="Leave a day blank if the hours vary. Mark it closed if you do not trade that day."
            >
              <PartnerHours
                v-model="hours"
                :locale="locale"
                :closed-label="sl('closed')"
                :disabled="busy"
              />
            </PartnerField>
          </div>
        </section>

        <!-- 6 · Proof -->
        <section class="rounded-3xl bg-white border border-gray-200/70 shadow-sm p-6 sm:p-8">
          <h2 class="text-lg font-semibold tracking-tight text-gray-950">
            Proof of stock
            <span v-if="sl('sectionProof')" class="block text-[13px] font-normal text-gray-500 mt-0.5" :lang="locale || undefined">
              {{ sl('sectionProof') }}
            </span>
          </h2>

          <div class="mt-6" :data-field-error="errorFor('proofs') || undefined">
            <PartnerField
              label="Proof that you carry Navitag products"
              :secondary="sl('proofImages')"
              :locale="locale"
              :error="errorFor('proofs')"
              required
            >
              <PartnerProofUpload v-model="proofs" :disabled="busy" />
            </PartnerField>
          </div>
        </section>

        <!-- Error -->
        <div
          v-if="status === 'error' && errorMessage"
          class="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13.5px] text-red-700 flex items-start gap-2"
        >
          <i class="fas fa-circle-exclamation mt-0.5"></i>
          <span class="flex-1">{{ errorMessage }}</span>
        </div>

        <!-- Submit -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            type="submit"
            :disabled="busy"
            class="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-navitag-blue text-white text-[15px] font-semibold hover:bg-[#006ADB] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <template v-if="busy">
              <i class="fas fa-circle-notch fa-spin text-[12px]"></i>
              Submitting…
            </template>
            <template v-else>
              Submit listing
              <i class="fas fa-arrow-right text-[11px]"></i>
            </template>
          </button>
          <p class="text-[12.5px] text-gray-500">
            We email a copy to the business and contact addresses above.
          </p>
        </div>

        <!-- Honeypot: off-screen, not display:none — naive bots skip hidden
             fields but fill positioned ones. -->
        <div class="pl-hp" aria-hidden="true">
          <label for="pl-website">Website</label>
          <input id="pl-website" v-model="website" type="text" name="website" tabindex="-1" autocomplete="off">
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>
.pl-hp {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
</style>
