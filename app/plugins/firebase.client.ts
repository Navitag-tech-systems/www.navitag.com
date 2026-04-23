import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getAnalytics, logEvent } from 'firebase/analytics'

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
  const analytics = getAnalytics(app)

  const router = useRouter()
  router.afterEach((to) => {
    logEvent(analytics, 'page_view', {
      page_path: to.fullPath,
      page_location: window.location.href,
      page_title: document.title,
    })
  })

  return {
    provide: {
      firebaseApp: app,
      firebaseAuth: auth,
      firebaseAnalytics: analytics,
      gaEvent: (eventName: string, params?: Record<string, any>) => {
        logEvent(analytics, eventName, params)
      },
    },
  }
})
