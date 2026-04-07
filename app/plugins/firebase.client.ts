import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getAnalytics } from 'firebase/analytics'

export default defineNuxtPlugin(() => {
  const firebaseConfig = {
    apiKey: 'AIzaSyBrLi2dDVVZqxz1g-J17khBDzNtSgTPNtM',
    authDomain: 'track-navitag-com.firebaseapp.com',
    projectId: 'track-navitag-com',
    storageBucket: 'track-navitag-com.firebasestorage.app',
    messagingSenderId: '729666105352',
    appId: '1:729666105352:web:fe56f5d9feec132e0ca1bd',
    measurementId: 'G-TCCJ0H788E',
  }

  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const analytics = getAnalytics(app)

  return {
    provide: {
      firebaseApp: app,
      firebaseAuth: auth,
      firebaseAnalytics: analytics,
    },
  }
})
