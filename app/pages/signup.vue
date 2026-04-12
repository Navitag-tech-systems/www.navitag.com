<script setup lang="ts">
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider } from 'firebase/auth'
import { MEDUSA_BACKEND_URL } from '~/variables'
import { countries } from '~/utils/countryList'

useSeoMeta({
  title: 'Navitag - Sign Up',
  robots: 'noindex, nofollow',
})

const { auth } = useFirebase()
const { backendSync, fetchCountryCode } = useBackendSync()

const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const error = ref('')
const selectedCountry = ref('')
const countryLoading = ref(true)

onMounted(async () => {
  const detected = await fetchCountryCode()
  selectedCountry.value = detected?.toUpperCase() || 'US'
  countryLoading.value = false
})

const passwordRules = computed(() => ({
  length: password.value.length >= 8,
  uppercase: /[A-Z]/.test(password.value),
  number: /[0-9]/.test(password.value),
  special: /[^A-Za-z0-9]/.test(password.value),
}))

const passwordValid = computed(() =>
  passwordRules.value.length
  && passwordRules.value.uppercase
  && passwordRules.value.number
  && passwordRules.value.special,
)

async function exchangeMedusaToken(firebaseUser: any) {
  const idToken = await firebaseUser.getIdToken()
  const res = await $fetch<{ token: string }>(`${MEDUSA_BACKEND_URL}/auth/customer/firebase`, {
    method: 'POST',
    body: { id_token: idToken },
  })
  localStorage.setItem('medusa_jwt', res.token)
}

async function signupWithEmail() {
  error.value = ''

  if (!passwordValid.value) {
    error.value = 'Password does not meet the requirements.'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }

  loading.value = true
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.value, password.value)
    await Promise.all([
      exchangeMedusaToken(cred.user),
      backendSync(cred.user, fullName.value || null, selectedCountry.value),
    ])
    navigateTo('/')
  } catch (e: any) {
    error.value = e?.message?.replace('Firebase: ', '') || 'Sign up failed'
  } finally {
    loading.value = false
  }
}

async function signupWithGoogle() {
  loading.value = true
  error.value = ''
  try {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider())
    await Promise.all([
      exchangeMedusaToken(cred.user),
      backendSync(cred.user, null, selectedCountry.value),
    ])
    navigateTo('/')
  } catch (e: any) {
    error.value = e?.message?.replace('Firebase: ', '') || 'Google sign up failed'
  } finally {
    loading.value = false
  }
}

async function signupWithFacebook() {
  loading.value = true
  error.value = ''
  try {
    const cred = await signInWithPopup(auth, new FacebookAuthProvider())
    await Promise.all([
      exchangeMedusaToken(cred.user),
      backendSync(cred.user, null, selectedCountry.value),
    ])
    navigateTo('/')
  } catch (e: any) {
    error.value = e?.message?.replace('Firebase: ', '') || 'Facebook sign up failed'
  } finally {
    loading.value = false
  }
}

async function signupWithApple() {
  loading.value = true
  error.value = ''
  try {
    const provider = new OAuthProvider('apple.com')
    provider.addScope('email')
    provider.addScope('name')
    const cred = await signInWithPopup(auth, provider)

    // Apple only provides the name on FIRST sign-in — capture it immediately
    const displayName = cred.user?.displayName || null
    if (displayName) {
      localStorage.setItem('apple_pending_name', displayName)
    }

    await Promise.all([
      exchangeMedusaToken(cred.user),
      backendSync(cred.user, null, selectedCountry.value),
    ])
    navigateTo('/')
  } catch (e: any) {
    error.value = e?.message?.replace('Firebase: ', '') || 'Apple sign up failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-navitag-bg flex items-center justify-center px-6 py-12">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-flex items-center gap-3">
          <img src="/logo-sm.png" alt="Navitag" class="h-12 w-auto">
          <span class="text-3xl font-extrabold text-gray-950">Navitag</span>
        </NuxtLink>
      </div>

      <!-- Card -->
      <div class="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
        <h1 class="text-2xl font-extrabold text-gray-950 text-center mb-2">Create Account</h1>
        <p class="text-sm text-gray-500 text-center mb-8">Join Navitag today</p>

        <!-- Error -->
        <div v-if="error" class="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
          {{ error }}
        </div>

        <!-- Email Form -->
        <form @submit.prevent="signupWithEmail" class="space-y-4 mb-6">
          <div>
            <input
              id="full-name"
              v-model="fullName"
              type="text"
              required
              placeholder="full name"
              class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navitag-blue focus:border-transparent"
            >
          </div>
          <div>
            <select
              v-model="selectedCountry"
              :disabled="countryLoading"
              class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-navitag-blue focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="" disabled>Select your country</option>
              <option v-for="c in countries" :key="c.code" :value="c.code">
                {{ c.name }}
              </option>
            </select>
          </div>
          <div>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              placeholder="email"
              class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navitag-blue focus:border-transparent"
            >
          </div>
          <div class="relative">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              placeholder="password"
              class="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navitag-blue focus:border-transparent"
            >
            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" @click="showPassword = !showPassword">
              <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
          <div class="relative">
            <input
              id="confirm-password"
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              required
              placeholder="confirm password"
              class="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navitag-blue focus:border-transparent"
            >
            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" @click="showConfirmPassword = !showConfirmPassword">
              <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>

          <!-- Password Requirements -->
          <div v-if="password" class="text-xs space-y-1">
            <p :class="passwordRules.length ? 'text-green-600' : 'text-gray-400'">
              <i :class="passwordRules.length ? 'fas fa-check' : 'fas fa-circle'" class="mr-1.5 text-[8px]"></i>
              At least 8 characters
            </p>
            <p :class="passwordRules.uppercase ? 'text-green-600' : 'text-gray-400'">
              <i :class="passwordRules.uppercase ? 'fas fa-check' : 'fas fa-circle'" class="mr-1.5 text-[8px]"></i>
              1 uppercase letter
            </p>
            <p :class="passwordRules.number ? 'text-green-600' : 'text-gray-400'">
              <i :class="passwordRules.number ? 'fas fa-check' : 'fas fa-circle'" class="mr-1.5 text-[8px]"></i>
              1 number
            </p>
            <p :class="passwordRules.special ? 'text-green-600' : 'text-gray-400'">
              <i :class="passwordRules.special ? 'fas fa-check' : 'fas fa-circle'" class="mr-1.5 text-[8px]"></i>
              1 special character
            </p>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full px-4 py-3 rounded-xl bg-navitag-blue text-white font-semibold hover:bg-opacity-90 transition shadow-lg shadow-navitag-blue/20 disabled:opacity-50"
          >
            <span v-if="loading"><i class="fas fa-spinner fa-spin mr-2"></i>Creating account...</span>
            <span v-else>Create Account</span>
          </button>
        </form>

        <!-- Divider -->
        <div class="flex items-center gap-4 mb-6">
          <div class="flex-1 h-px bg-gray-200"></div>
          <span class="text-xs text-gray-400 uppercase font-medium">or continue with</span>
          <div class="flex-1 h-px bg-gray-200"></div>
        </div>

        <!-- Social Circle Buttons -->
        <div class="flex justify-center gap-5">
          <button
            :disabled="loading"
            class="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition disabled:opacity-50"
            @click="signupWithGoogle"
            title="Google"
          >
            <i class="fab fa-google text-lg"></i>
          </button>
          <button
            :disabled="loading"
            class="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition disabled:opacity-50"
            @click="signupWithFacebook"
            title="Facebook"
          >
            <i class="fab fa-facebook-f text-lg"></i>
          </button>
          <button
            :disabled="loading"
            class="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-900 transition disabled:opacity-50"
            @click="signupWithApple"
            title="Apple"
          >
            <i class="fab fa-apple text-xl"></i>
          </button>
        </div>

        <!-- Login link -->
        <p class="text-sm text-gray-500 text-center mt-6">
          Already have an account?
          <NuxtLink to="/login" class="text-navitag-blue font-semibold hover:underline">Sign In</NuxtLink>
        </p>
      </div>

      <!-- Back link -->
      <div class="text-center mt-6">
        <NuxtLink to="/" class="text-sm text-gray-500 hover:text-navitag-blue transition">
          <i class="fas fa-arrow-left mr-1"></i> Back to home
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
