import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeAnalytics, logEvent } from 'firebase/analytics'

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
