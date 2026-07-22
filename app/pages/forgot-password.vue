<script setup lang="ts">
import { sendPasswordResetEmail } from 'firebase/auth'

useSeoMeta({
  title: 'Navitag - Reset Password',
  robots: 'noindex, nofollow',
})

const { auth } = useFirebase()
const basic = useBasicStore()
const { $fbq } = useNuxtApp()

const ready = ref(false)
const email = ref('')
const loading = ref(false)
const error = ref('')
const sent = ref(false)

if (import.meta.client) {
  onMounted(() => {
    // Audience left to plugin route-inference; both B2C and B2B accounts
    // hit this page.
    $fbq('ViewContent', {
      content_name: 'forgot_password',
      content_category: 'auth',
    })
  })
}

onMounted(async () => {
  // Always sign out on landing — this is the password-reset page, so any
  // existing session must be cleared. Unconditional (not `if (basic.user)`):
  // ensureAuthResolved() can time out with basic.user still null mid-restore,
  // which would skip the signout and leave the session live once it finishes
  // restoring. signOut is a harmless no-op when already signed out.
  await basic.ensureAuthResolved()
  await basic.logout()
  ready.value = true
})

async function handleReset() {
  loading.value = true
  error.value = ''
  try {
    await sendPasswordResetEmail(auth, email.value)
    sent.value = true
  } catch (e: any) {
    error.value = e?.message?.replace('Firebase: ', '') || 'Failed to send reset email'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <!-- Spinner while signing out -->
  <div v-if="!ready" class="min-h-screen bg-navitag-bg flex items-center justify-center">
    <i class="fas fa-spinner fa-spin text-3xl text-navitag-blue"></i>
  </div>

  <!-- Page content -->
  <div v-else class="min-h-screen bg-navitag-bg flex items-center justify-center px-6 py-12">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-flex items-center gap-3">
          <img src="/logo-sm.png" alt="Navitag" class="h-12 w-auto">
          <span class="text-3xl font-extrabold text-gray-950">NAVITAG</span>
        </NuxtLink>
      </div>

      <!-- Card -->
      <div class="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
        <h1 class="text-2xl font-extrabold text-gray-950 text-center mb-2">Reset Password</h1>
        <p class="text-sm text-gray-500 text-center mb-8">Enter your email and we'll send you a reset link</p>

        <!-- Error -->
        <div v-if="error" class="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
          {{ error }}
        </div>

        <!-- Success -->
        <div v-if="sent" class="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm text-center">
          <i class="fas fa-check-circle mr-1"></i>
          Reset email sent. Check your inbox and follow the link to reset your password.
        </div>

        <!-- Form -->
        <form v-if="!sent" @submit.prevent="handleReset" class="space-y-4">
          <div>
            <input
              v-model="email"
              type="email"
              required
              placeholder="email"
              class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navitag-blue focus:border-transparent"
            >
          </div>
          <button
            type="submit"
            :disabled="loading"
            class="w-full px-4 py-3 rounded-xl bg-navitag-blue text-white font-semibold hover:bg-opacity-90 transition shadow-lg shadow-navitag-blue/20 disabled:opacity-50"
          >
            <span v-if="loading"><i class="fas fa-spinner fa-spin mr-2"></i>Sending...</span>
            <span v-else>Send Reset Email</span>
          </button>
        </form>

        <!-- Back to login -->
        <p class="text-sm text-gray-500 text-center mt-6">
          <NuxtLink to="/login" class="text-navitag-blue font-semibold hover:underline">
            <i class="fas fa-arrow-left mr-1"></i> Back to Sign In
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
