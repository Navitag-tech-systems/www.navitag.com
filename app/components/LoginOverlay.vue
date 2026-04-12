<script setup lang="ts">
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider } from 'firebase/auth'
import { MEDUSA_BACKEND_URL } from '~/variables'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': []
}>()

const { auth } = useFirebase()
const { backendSync } = useBackendSync()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

function close() {
  emit('update:modelValue', false)
}

function reset() {
  email.value = ''
  password.value = ''
  showPassword.value = false
  error.value = ''
}

async function exchangeMedusaToken(firebaseUser: any) {
  const idToken = await firebaseUser.getIdToken()
  const res = await $fetch<{ token: string }>(`${MEDUSA_BACKEND_URL}/auth/customer/firebase`, {
    method: 'POST',
    body: { id_token: idToken },
  })
  localStorage.setItem('medusa_jwt', res.token)
}

function onSuccess() {
  reset()
  emit('success')
  close()
}

async function loginWithEmail() {
  loading.value = true
  error.value = ''
  try {
    const cred = await signInWithEmailAndPassword(auth, email.value, password.value)
    await Promise.all([
      exchangeMedusaToken(cred.user),
      backendSync(cred.user),
    ])
    onSuccess()
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
    await Promise.all([
      exchangeMedusaToken(cred.user),
      backendSync(cred.user),
    ])
    onSuccess()
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
    await Promise.all([
      exchangeMedusaToken(cred.user),
      backendSync(cred.user),
    ])
    onSuccess()
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

    // Apple only provides the name on FIRST sign-in — capture it immediately
    const displayName = cred.user?.displayName || null
    if (displayName) {
      localStorage.setItem('apple_pending_name', displayName)
    }

    await Promise.all([
      exchangeMedusaToken(cred.user),
      backendSync(cred.user),
    ])
    onSuccess()
  } catch (e: any) {
    error.value = e?.message?.replace('Firebase: ', '') || 'Apple login failed'
  } finally {
    loading.value = false
  }
}

watch(() => props.modelValue, (val) => {
  if (val) reset()
})
</script>

<template>
  <ClientOnly>
    <div v-if="modelValue" class="login-overlay" @click.self="close">
      <div class="login-overlay__card">
        <!-- Close button -->
        <button class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition" @click="close">
          <i class="fas fa-times text-lg"></i>
        </button>

        <!-- Logo -->
        <div class="text-center mb-6">
          <div class="inline-flex items-center gap-3">
            <img src="/logo-sm.png" alt="Navitag" class="h-10 w-auto">
            <span class="text-2xl font-extrabold text-gray-950">Navitag</span>
          </div>
        </div>

        <h2 class="text-xl font-extrabold text-gray-950 text-center mb-1">Sign In</h2>
        <p class="text-sm text-gray-500 text-center mb-6">Sign in to continue</p>

        <!-- Error -->
        <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
          {{ error }}
        </div>

        <!-- Email Form -->
        <form @submit.prevent="loginWithEmail" class="space-y-4 mb-5">
          <div>
            <input
              v-model="email"
              type="email"
              required
              placeholder="email"
              class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navitag-blue focus:border-transparent"
            >
          </div>
          <div class="relative">
            <input
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
        <div class="flex items-center gap-4 mb-5">
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
        <p class="text-sm text-gray-500 text-center mt-5">
          Don't have an account?
          <NuxtLink to="/signup" class="text-navitag-blue font-semibold hover:underline" @click="close">Sign Up</NuxtLink>
        </p>
      </div>
    </div>
  </ClientOnly>
</template>

<style>
.login-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
}

.login-overlay__card {
  position: relative;
  width: 100%;
  max-width: 28rem;
  margin: 0 1.5rem;
  background: white;
  border-radius: 1.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid #f3f4f6;
  padding: 2rem;
}
</style>
