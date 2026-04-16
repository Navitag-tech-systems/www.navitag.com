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

  // Global click listener for CMS data-pixel-* tracked CTAs
  const RESERVED_EVENTS = new Set(['PageView', 'ViewContent', 'Purchase'])

  document.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement)?.closest<HTMLElement>('[data-pixel-event]')
    if (!target) return

    const event = target.dataset.pixelEvent
    if (!event || RESERVED_EVENTS.has(event)) return

    const params: Record<string, any> = {}

    if (target.dataset.pixelContentName) {
      params.content_name = target.dataset.pixelContentName
    }

    if (event === 'Custom' && target.dataset.pixelCustomName) {
      ;(window as any).fbq?.('trackCustom', target.dataset.pixelCustomName, params)
      return
    }

    if (target.dataset.pixelValue) {
      params.value = parseFloat(target.dataset.pixelValue)
      params.currency = target.dataset.pixelCurrency || 'USD'
      if (!target.dataset.pixelCurrency) {
        console.warn('[meta-pixel] data-pixel-value set without data-pixel-currency, defaulting to USD')
      }
    }

    ;(window as any).fbq?.('track', event, params)
  })

  return {
    provide: {
      fbq: (event: string, params?: Record<string, any>) => {
        ;(window as any).fbq?.('track', event, params)
      },
    },
  }
})
