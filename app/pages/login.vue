<script setup lang="ts">
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider } from 'firebase/auth'
import { MEDUSA_BACKEND_URL } from '~/variables'

useSeoMeta({
  title: 'Navitag - Login',
  robots: 'noindex, nofollow',
})

const { auth } = useFirebase()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

async function exchangeMedusaToken(firebaseUser: any) {
  const idToken = await firebaseUser.getIdToken()
  const res = await $fetch<{ token: string }>(`${MEDUSA_BACKEND_URL}/auth/customer/firebase`, {
    method: 'POST',
    body: { id_token: idToken },
  })
  localStorage.setItem('medusa_jwt', res.token)
}

async function loginWithEmail() {
  loading.value = true
  error.value = ''
  try {
    const cred = await signInWithEmailAndPassword(auth, email.value, password.value)
    await exchangeMedusaToken(cred.user)
    navigateTo('/')
  } catch (e: any) {
    error.value = e?.message?.replace('Firebase: ', '') || 'Login failed'
  } finally {
    loading.value = false
  }
}

async function loginWithGoogle() {
  loading.value = true
  error.value = ''
  try {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider())
    await exchangeMedusaToken(cred.user)
    navigateTo('/')
  } catch (e: any) {
    error.value = e?.message?.replace('Firebase: ', '') || 'Google login failed'
  } finally {
    loading.value = false
  }
}

async function loginWithFacebook() {
  loading.value = true
  error.value = ''
  try {
    const cred = await signInWithPopup(auth, new FacebookAuthProvider())
    await exchangeMedusaToken(cred.user)
    navigateTo('/')
  } catch (e: any) {
    error.value = e?.message?.replace('Firebase: ', '') || 'Facebook login failed'
  } finally {
    loading.value = false
  }
}

async function loginWithApple() {
  loading.value = true
  error.value = ''
  try {
    const provider = new OAuthProvider('apple.com')
    provider.addScope('email')
    provider.addScope('name')
    const cred = await signInWithPopup(auth, provider)
    await exchangeMedusaToken(cred.user)
    navigateTo('/')
  } catch (e: any) {
    error.value = e?.message?.replace('Firebase: ', '') || 'Apple login failed'
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
        <h1 class="text-2xl font-extrabold text-gray-950 text-center mb-2">Sign In</h1>
        <p class="text-sm text-gray-500 text-center mb-8">Access your Navitag account</p>

        <!-- Error -->
        <div v-if="error" class="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
          {{ error }}
        </div>

        <!-- Email Form -->
        <form @submit.prevent="loginWithEmail" class="space-y-4 mb-6">
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
          <button
            type="submit"
            :disabled="loading"
            class="w-full px-4 py-3 rounded-xl bg-navitag-blue text-white font-semibold hover:bg-opacity-90 transition shadow-lg shadow-navitag-blue/20 disabled:opacity-50"
          >
            <span v-if="loading"><i class="fas fa-spinner fa-spin mr-2"></i>Signing in...</span>
            <span v-else>Sign In</span>
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
            @click="loginWithGoogle"
            title="Google"
          >
            <i class="fab fa-google text-lg"></i>
          </button>
          <button
            :disabled="loading"
            class="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition disabled:opacity-50"
            @click="loginWithFacebook"
            title="Facebook"
          >
            <i class="fab fa-facebook-f text-lg"></i>
          </button>
          <button
            :disabled="loading"
            class="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-900 transition disabled:opacity-50"
            @click="loginWithApple"
            title="Apple"
          >
            <i class="fab fa-apple text-xl"></i>
          </button>
        </div>

        <!-- Signup link -->
        <p class="text-sm text-gray-500 text-center mt-6">
          Don't have an account?
          <NuxtLink to="/signup" class="text-navitag-blue font-semibold hover:underline">Sign Up</NuxtLink>
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
