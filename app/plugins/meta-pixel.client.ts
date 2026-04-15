const PIXEL_ID = '1478826687226054'

export default defineNuxtPlugin((nuxtApp) => {
  ;(function (f: any, b, e, v, n?: any, t?: any, s?: any) {
    if (f.fbq) return
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
    }
    if (!f._fbq) f._fbq = n
    n.push = n
    n.loaded = true
    n.version = '2.0'
    n.queue = []
    t = b.createElement(e)
    t.async = true
    t.src = v
    s = b.getElementsByTagName(e)[0]
    s.parentNode.insertBefore(t, s)
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')

  const fbq = (window as any).fbq
  fbq('init', PIXEL_ID)
  fbq('track', 'PageView')

  const router = useRouter()
  router.afterEach(() => {
    ;(window as any).fbq?.('track', 'PageView')
  })

  return {
    provide: {
      fbq: (event: string, params?: Record<string, any>) => {
        ;(window as any).fbq?.('track', event, params)
      },
    },
  }
})
