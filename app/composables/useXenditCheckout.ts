import { MEDUSA_PUBLISHABLE_KEY } from '~/variables'

/**
 * Xendit e-wallet (GCash / Maya) checkout — redirect + webhook flow.
 *
 * Unlike PayPal Card Fields (inline, same page), Xendit hands back a
 * `checkout_url` we must send the customer to. The Xendit return URL is fixed
 * per provider in the Medusa module config, so it can't carry the cart id —
 * we stash a small marker in localStorage and /checkout/xendit/success reads
 * it back to resume + complete the cart.
 */
export const XENDIT_RETURN_KEY = 'navitag_xendit_return'

export type XenditProviderId = 'pp_xendit_gcash' | 'pp_xendit_maya'
export type XenditFlow = 'topup' | 'shop'

export interface XenditReturnState {
  cartId: string
  flow: XenditFlow
  provider: XenditProviderId
  /** Publishable key the cart is accessible under (digital vs products channel). */
  pubKey: string
  ts: number
}

export function useXenditCheckout(opts: { publishableKey?: string } = {}) {
  const publishableKey = opts.publishableKey ?? MEDUSA_PUBLISHABLE_KEY
  const { medusaFetch } = useMedusa({ publishableKey })

  /**
   * Create a Xendit payment session for `cartId` and redirect the browser to
   * the GCash / Maya authorization page. Throws if the provider returns no
   * redirect URL. On success the function does not return — the page unloads.
   */
  async function startPayment(params: {
    cartId: string
    provider: XenditProviderId
    flow: XenditFlow
  }): Promise<void> {
    const { cartId, provider, flow } = params

    // Upsert the payment collection for this cart (idempotent).
    const pcRes = await medusaFetch<{ payment_collection: any }>('/store/payment-collections', {
      method: 'POST',
      body: { cart_id: cartId },
    })
    const pcId = pcRes.payment_collection.id

    // Create the e-wallet payment session — initiatePayment returns the
    // REQUIRES_ACTION redirect URL on session.data.checkout_url.
    const sessRes = await medusaFetch<{ payment_collection: any }>(
      `/store/payment-collections/${pcId}/payment-sessions`,
      { method: 'POST', body: { provider_id: provider } },
    )
    const session = (sessRes.payment_collection.payment_sessions || []).find(
      (s: any) => s.provider_id === provider,
    )
    const checkoutUrl: string | undefined = session?.data?.checkout_url
    if (!checkoutUrl) {
      throw new Error('Payment could not be started — no redirect URL was returned.')
    }

    // Stash the resume marker, then hand off to the wallet.
    const state: XenditReturnState = {
      cartId,
      flow,
      provider,
      pubKey: publishableKey,
      ts: Date.now(),
    }
    if (import.meta.client) {
      localStorage.setItem(XENDIT_RETURN_KEY, JSON.stringify(state))
      window.location.href = checkoutUrl
    }
  }

  return { startPayment }
}
