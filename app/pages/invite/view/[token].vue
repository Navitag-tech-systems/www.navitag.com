<script setup lang="ts">
import { MEDUSA_BACKEND_URL } from '~/variables'

useHead({
  title: 'Navitag - Invite',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

type InviteMeta = {
  status: string
  granter_name: string
  device_count: number
  scopes: string[]
  expires_at: string
}

type ClaimResult = {
  status: string
  granted_devices: string[]
  already_shared: string[]
  scopes: string[]
  broker_synced: boolean
}

const SHARE_BASE = MEDUSA_BACKEND_URL

const SCOPE_LABELS: Record<string, string> = {
  'position:live': 'Live location',
  'history:read': 'Trip history',
  'notification:read': 'Tracker alerts',
}

const route = useRoute()
const token = computed(() => String(route.params.token || ''))

const { auth } = useFirebase()
const basic = useBasicStore()

const invite = ref<InviteMeta | null>(null)
const metaLoading = ref(true)
const metaError = ref('')

const authChecked = computed(() => basic.authResolved)
const user = computed(() => basic.user)
const showLogin = ref(false)

const wasSignedOut = ref(false)

const claiming = ref(false)
const claimError = ref('')
const claimResult = ref<ClaimResult | null>(null)
const claimRetryable = ref(false)

const signupTo = computed(() => `/signup?return=${encodeURIComponent(`/invite/view/${token.value}`)}`)

const scopeList = computed(() =>
  (invite.value?.scopes || []).map(s => SCOPE_LABELS[s] || s),
)

const expiresDisplay = computed(() => {
  if (!invite.value?.expires_at) return ''
  const d = new Date(invite.value.expires_at)
  if (Number.isNaN(d.getTime())) return invite.value.expires_at
  const diffMs = d.getTime() - Date.now()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  if (diffMs > 0 && diffDays <= 14) {
    if (diffDays === 0) return 'today'
    if (diffDays === 1) return 'in 1 day'
    return `in ${diffDays} days`
  }
  return d.toLocaleString(undefined, { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })
})

onMounted(async () => {
  // Force-logout any existing session so the claim can't fire under the wrong account.
  // The recipient must explicitly sign in via the overlay before we attempt a claim.
  await basic.ensureAuthResolved()
  const hadSession = !!basic.user || !!localStorage.getItem('medusa_jwt')
  if (hadSession) await basic.logout()
  wasSignedOut.value = hadSession

  await loadMeta()
})

async function loadMeta() {
  if (!token.value || !token.value.startsWith('nvit_')) {
    metaError.value = 'This invite is no longer valid. Ask the sender for a new one.'
    metaLoading.value = false
    return
  }
  metaLoading.value = true
  metaError.value = ''
  try {
    invite.value = await $fetch<InviteMeta>(
      `${SHARE_BASE}/v1/share/invite/${encodeURIComponent(token.value)}`,
    )
  } catch (e: any) {
    const status = e?.response?.status ?? e?.statusCode
    if (status === 404) {
      metaError.value = 'This invite is no longer valid. Ask the sender for a new one.'
    } else {
      metaError.value = 'Something went wrong loading this invite. Please try again in a moment.'
    }
  } finally {
    metaLoading.value = false
  }
}

async function claim() {
  if (!user.value) return
  claiming.value = true
  claimError.value = ''
  claimRetryable.value = false
  try {
    const idToken = await user.value.getIdToken()
    claimResult.value = await $fetch<ClaimResult>(`${SHARE_BASE}/v1/share/claim`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}` },
      body: { token: token.value },
    })
  } catch (e: any) {
    const status = e?.response?.status ?? e?.statusCode
    const body = e?.data ?? e?.response?._data
    const serverErr: string = body?.error || ''

    if (status === 400 && /own invite/i.test(serverErr)) {
      claimError.value = "You can't accept your own invite."
    } else if (status === 401) {
      claimError.value = 'Your sign-in has expired. Please sign in again.'
      await basic.logout()
      showLogin.value = true
    } else if (status === 404) {
      claimError.value = 'This invite is no longer valid. Ask the sender for a new one.'
    } else if (status === 409 && /already claimed/i.test(serverErr)) {
      claimError.value = 'This invite has already been used.'
    } else if (status === 409) {
      claimError.value = 'The sender no longer owns these trackers. Ask them for a new invite if they still want to share.'
    } else if (status === 410) {
      claimError.value = 'This invite has expired (invites are valid for 7 days). Ask the sender for a new one.'
    } else if (status === 502) {
      claimError.value = 'Something went wrong. Please try again in a moment.'
      claimRetryable.value = true
    } else {
      claimError.value = 'Something went wrong. Please try again in a moment.'
      claimRetryable.value = true
    }
  } finally {
    claiming.value = false
  }
}

async function onLoginSuccess() {
  showLogin.value = false
  // Wait a tick for the store's onAuthStateChanged listener to populate basic.user, then claim.
  await nextTick()
  if (auth.currentUser && invite.value && !claimResult.value && !claiming.value) {
    await claim()
  }
}

const alreadyHadEverything = computed(() =>
  !!claimResult.value
  && claimResult.value.granted_devices.length === 0
  && claimResult.value.already_shared.length > 0,
)
</script>

<template>
  <div class="min-h-screen bg-navitag-bg py-12">
    <div class="container mx-auto px-6 max-w-lg">

      <div v-if="metaLoading" class="text-center py-20">
        <i class="fas fa-spinner fa-spin fa-2x text-navitag-blue"></i>
      </div>

      <div v-else-if="metaError" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <i class="fas fa-exclamation-circle text-gray-400 text-3xl mb-3"></i>
        <p class="text-sm text-gray-700">{{ metaError }}</p>
      </div>

      <div v-else-if="invite">
        <!-- Security logout notice -->
        <div
          v-if="wasSignedOut"
          class="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3"
        >
          <i class="fas fa-shield-alt text-amber-600 mt-0.5"></i>
          <div class="text-sm text-amber-900">
            <p class="font-semibold mb-0.5">You've been signed out for security</p>
            <p class="text-amber-800">
              To make sure this invite is claimed by the right account, please sign in again below.
            </p>
          </div>
        </div>

        <!-- Preview -->
        <div class="text-center mb-6">
          <div class="w-20 h-20 rounded-full bg-navitag-blue bg-opacity-10 flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-envelope-open-text text-3xl text-navitag-blue"></i>
          </div>
          <h1 class="text-2xl font-extrabold text-gray-950 mb-1">
            <span>{{ invite.granter_name }}</span> wants to share
          </h1>
          <p class="text-gray-600 text-sm">
            <strong>{{ invite.device_count }}</strong>
            Navitag tracker{{ invite.device_count === 1 ? '' : 's' }} with you.
          </p>
        </div>

        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <p class="text-xs uppercase font-medium text-gray-400 mb-3">You'll be able to see</p>
          <ul class="space-y-2 mb-5">
            <li v-for="label in scopeList" :key="label" class="text-sm text-gray-800 flex items-center gap-2">
              <i class="fas fa-check text-navitag-blue text-xs"></i>
              {{ label }}
            </li>
          </ul>
          <p class="text-xs text-gray-500">Expires {{ expiresDisplay }}.</p>
        </div>

        <!-- Claim states (signed in) -->
        <div v-if="claiming" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
          <i class="fas fa-spinner fa-spin fa-lg text-navitag-blue mb-2"></i>
          <p class="text-sm text-gray-600">Accepting invite...</p>
        </div>

        <div
          v-else-if="claimResult && alreadyHadEverything"
          class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center"
        >
          <i class="fas fa-info-circle text-navitag-blue text-2xl mb-2"></i>
          <h2 class="text-lg font-extrabold text-gray-950 mb-1">You already have access</h2>
          <p class="text-sm text-gray-600">These trackers were already shared with you.</p>
        </div>

        <div
          v-else-if="claimResult"
          class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center"
        >
          <i class="fas fa-check-circle text-green-500 text-2xl mb-2"></i>
          <h2 class="text-lg font-extrabold text-gray-950 mb-1">Invite accepted</h2>
          <p class="text-sm text-gray-600 mb-1">
            {{ claimResult.granted_devices.length }} tracker{{ claimResult.granted_devices.length === 1 ? '' : 's' }} added to your account.
          </p>
          <p v-if="claimResult.already_shared.length" class="text-xs text-gray-500 mt-2">
            {{ claimResult.already_shared.length }} tracker{{ claimResult.already_shared.length === 1 ? ' was' : 's were' }} already shared with you and skipped.
          </p>
        </div>

        <div
          v-else-if="claimError"
          class="bg-white rounded-2xl border border-red-100 shadow-sm p-6 text-center"
        >
          <i class="fas fa-exclamation-circle text-red-500 text-2xl mb-2"></i>
          <p class="text-sm text-red-700 mb-4">{{ claimError }}</p>
          <button
            v-if="claimRetryable && user"
            class="px-6 py-2 rounded-full bg-navitag-blue text-white font-semibold hover:bg-opacity-90 transition"
            @click="claim"
          >
            Try again
          </button>
        </div>

        <!-- Sign-in CTA (signed out) -->
        <div v-else-if="authChecked && !user" class="text-center">
          <button
            class="inline-block px-8 py-3 rounded-full bg-navitag-blue text-white font-semibold hover:bg-opacity-90 transition shadow-lg shadow-navitag-blue/20"
            @click="showLogin = true"
          >
            Sign in to accept
          </button>
        </div>

        <div v-else class="text-center py-4">
          <i class="fas fa-spinner fa-spin text-navitag-blue"></i>
        </div>
      </div>

    </div>

    <LoginOverlay v-model="showLogin" :signup-to="signupTo" @success="onLoginSuccess" />
  </div>
</template>
