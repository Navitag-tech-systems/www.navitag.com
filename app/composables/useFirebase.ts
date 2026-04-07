import type { Auth } from 'firebase/auth'
import type { Analytics } from 'firebase/analytics'
import type { FirebaseApp } from 'firebase/app'

export function useFirebase() {
  const nuxtApp = useNuxtApp()

  return {
    app: nuxtApp.$firebaseApp as FirebaseApp,
    auth: nuxtApp.$firebaseAuth as Auth,
    analytics: nuxtApp.$firebaseAnalytics as Analytics,
  }
}
