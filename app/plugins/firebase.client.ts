import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeAnalytics, logEvent } from 'firebase/analytics'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'

export default defineNuxtPlugin(() => {
  const firebaseConfig = {
    apiKey: 'AIzaSyBrLi2dDVVZqxz1g-J17khBDzNtSgTPNtM',
    authDomain: 'navitag.com',
    projectId: 'track-navitag-com',
    storageBucket: 'track-navitag-com.firebasestorage.app',
    messagingSenderId: '729666105352',
    appId: '1:729666105352:web:fe56f5d9feec132e0ca1bd',
    measurementId: 'G-TCCJ0H788E',
  }

  const app = initializeApp(firebaseConfig)

  // App Check — reCAPTCHA v3 (free classic, NOT Enterprise → no per-assessment
  // metering, so a bot flood costs $0). This site shares the track-navitag-com
  // Firebase project with track.navitag.com, so once App Check is enforced on
  // Authentication (the fix for the bot-spam signups) THIS app must also send
  // tokens or its /login /signup break. Same reCAPTCHA key as track (registered
  // for navitag.com, which covers the track. subdomain); the secret is stored
  // against this web app's App Check registration in the Firebase console.
  // Non-breaking until enforcement is turned on — it only mints tokens.
  const runtime = useRuntimeConfig()
  const siteKey = runtime.public.appcheckRecaptchaV3SiteKey as string
  if (import.meta.dev) {
    // Localhost: reCAPTCHA won't run on an unregistered origin, so allow a
    // debug token. First run logs one to register under Firebase console →
    // App Check → Apps → Manage debug tokens (pin via NUXT_PUBLIC_APPCHECK_DEBUG_TOKEN).
    ;(self as any).FIREBASE_APPCHECK_DEBUG_TOKEN =
      (runtime.public.appcheckDebugToken as string) || true
  }
  if (siteKey) {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    })
  } else if (import.meta.dev) {
    console.warn(
      '[AppCheck] NUXT_PUBLIC_APPCHECK_RECAPTCHA_V3_SITE_KEY not set — App Check disabled on web.'
    )
  }

  const auth = getAuth(app)
  // send_page_view: false — gtag's automatic page_view double-counted against
  // the SPA-aware tracking below (every load fired both). We emit page_view
  // ourselves, once per route the user actually lands on.
  const analytics = initializeAnalytics(app, { config: { send_page_view: false } })

  const logPageView = (fullPath: string) => {
    logEvent(analytics, 'page_view', {
      page_path: fullPath,
      page_location: window.location.href,
      page_title: document.title,
    })
  }

  // The first page_view is emitted by app.vue once the first-entry country
  // redirect has settled (via $logBootPageView), so a redirected landing
  // (e.g. `/` → `/ph`) is counted once — for the destination, not the
  // transient pre-redirect path. Every later SPA navigation logs here.
  let bootLogged = false
  const router = useRouter()
  router.afterEach((to) => {
    if (bootLogged) logPageView(to.fullPath)
  })

  return {
    provide: {
      firebaseApp: app,
      firebaseAuth: auth,
      firebaseAnalytics: analytics,
      gaEvent: (eventName: string, params?: Record<string, any>) => {
        logEvent(analytics, eventName, params)
      },
      logBootPageView: () => {
        if (bootLogged) return
        bootLogged = true
        logPageView(router.currentRoute.value.fullPath)
      },
    },
  }
})
