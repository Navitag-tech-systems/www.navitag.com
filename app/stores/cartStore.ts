import { defineStore } from 'pinia'
import { MEDUSA_BACKEND_URL, MEDUSA_PUBLISHABLE_KEY } from '~/variables'

/**
 * Wraps the Medusa storefront cart API. Source of truth for the *currently
 * active* cart in the SPA. The backend pre-creates `digital_cart` and
 * `physical_cart` on login (see storefront API contract) and writes the
 * cart ids to `customer.metadata`. This store reads them from there — it
 * does not mint carts itself in the happy path.
 */

export type CartKind = 'physical' | 'digital'

interface MedusaCart {
  id: string
  email?: string | null
  region_id?: string | null
  currency_code?: string | null
  customer_id?: string | null
  items?: any[]
  shipping_address?: any | null
  billing_address?: any | null
  shipping_methods?: any[]
  total?: number
  subtotal?: number
  metadata?: Record<string, any> | null
}

interface ShippingOption {
  id: string
  name: string
  amount?: number
  price_type?: 'flat' | 'calculated'
  provider_id?: string
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    kind: 'physical' as CartKind,
    cartId: null as string | null,
    cart: null as MedusaCart | null,
    shippingOptions: [] as ShippingOption[],
    loading: false,
    error: '' as string,
  }),

  getters: {
    isReady: state => !!state.cart && !!state.cartId,
    itemCount: state => (state.cart?.items || []).reduce((n, i: any) => n + (i.quantity || 0), 0),
    currencyCode: state => state.cart?.currency_code || null,
  },

  actions: {
    /**
     * Resolve and hydrate the cart for `kind` (default `physical`).
     * Reads `customer.metadata.{kind}_cart` from `/store/customers/me`.
     * Idempotent: if `cartId` already matches, just refreshes.
     */
    async ensureCart(kind: CartKind = 'physical'): Promise<MedusaCart | null> {
      if (!import.meta.client) return null
      this.kind = kind
      this.loading = true
      this.error = ''
      try {
        const { medusaFetch } = useMedusa()
        const meRes = await medusaFetch<{ customer: any }>('/store/customers/me')
        const meta = meRes.customer?.metadata || {}
        const id = meta[`${kind}_cart`] as string | undefined
        if (!id) {
          this.error = `No ${kind}_cart on customer metadata.`
          this.cartId = null
          this.cart = null
          return null
        }
        this.cartId = id
        await this.refresh()
        await this.alignRegion()
        return this.cart
      }
      catch (e: any) {
        this.error = e?.data?.message || e?.message || 'Failed to load cart.'
        return null
      }
      finally {
        this.loading = false
      }
    },

    /** Re-fetch the current cart by id. Uses publishable key (no JWT required). */
    async refresh(): Promise<MedusaCart | null> {
      if (!this.cartId) return null
      try {
        const res = await $fetch<{ cart: MedusaCart }>(
          `${MEDUSA_BACKEND_URL}/store/carts/${this.cartId}`,
          {
            params: {
              fields: '*items,*items.variant,*items.variant.options,*items.thumbnail,+items.product_handle,*shipping_methods,*shipping_address,*billing_address,+item_subtotal,+shipping_total,+tax_total,+discount_total,+total,+subtotal',
            },
            headers: { 'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY },
          },
        )
        this.cart = res.cart
        return this.cart
      }
      catch (e: any) {
        this.error = e?.data?.message || e?.message || 'Failed to refresh cart.'
        return null
      }
    },

    /**
     * Mint a brand-new cart, detached from the customer's pre-saved
     * `physical_cart` / `digital_cart` metadata slots. Use this for one-shot
     * purchase flows (Buy now) so each checkout starts clean without
     * destroying or mutating the long-lived saved carts. The customer is
     * still attached automatically from the JWT; we only supply the email
     * and `firebase_uid` per the storefront contract.
     */
    async createCart(opts: { metadata?: Record<string, any> } = {}): Promise<MedusaCart | null> {
      if (!import.meta.client) return null
      this.loading = true
      this.error = ''
      try {
        const { medusaFetch } = useMedusa()
        const basic = useBasicStore()
        const meRes = await medusaFetch<{ customer: any }>('/store/customers/me')
        const customer = meRes.customer
        const email = customer?.email
        if (!email) throw new Error('Unable to resolve customer email for checkout.')

        const metadata: Record<string, any> = { ...(opts.metadata || {}) }
        const firebaseUid = customer?.metadata?.firebase_uid
        if (firebaseUid) metadata.firebase_uid = firebaseUid
        if (basic.country) metadata.country_code = basic.country

        const res = await medusaFetch<{ cart: MedusaCart }>('/store/carts', {
          method: 'POST',
          body: {
            region_id: basic.medusaRegionId,
            email,
            metadata,
          },
        })
        this.cart = res.cart
        this.cartId = res.cart.id
        this.shippingOptions = []
        return this.cart
      }
      catch (e: any) {
        this.error = e?.data?.message || e?.message || 'Failed to create cart.'
        return null
      }
      finally {
        this.loading = false
      }
    },

    /**
     * Best-known shipping/billing address for the signed-in customer, used
     * to prefill checkout forms when the active cart has no addresses yet
     * (typical for Buy now, since each entry mints a fresh cart). Lookup
     * order, picking the first hit:
     *   1. Most recent completed order's snapshotted addresses.
     *   2. The customer's pre-saved physical_cart (last manually entered
     *      addresses prior to the fresh-cart switch).
     *   3. The customer's pre-saved digital_cart (rare but harmless).
     * Returns `{ shipping, billing }`; either side may be null.
     */
    async fetchLastKnownAddresses(): Promise<{ shipping: any | null; billing: any | null }> {
      if (!import.meta.client) return { shipping: null, billing: null }
      const { medusaFetch } = useMedusa()
      try {
        const ordersRes = await medusaFetch<{ orders: any[] }>(
          '/store/orders?limit=1&order=-created_at&fields=*shipping_address,*billing_address',
        )
        const order = ordersRes.orders?.[0]
        if (order?.shipping_address?.address_1) {
          return { shipping: order.shipping_address, billing: order.billing_address || null }
        }
      }
      catch { /* fall through to cart fallback */ }

      try {
        const meRes = await medusaFetch<{ customer: any }>('/store/customers/me')
        const meta = meRes.customer?.metadata || {}
        for (const key of ['physical_cart', 'digital_cart'] as const) {
          const id = meta[key] as string | undefined
          if (!id) continue
          try {
            const cartRes = await medusaFetch<{ cart: any }>(
              `/store/carts/${id}?fields=*shipping_address,*billing_address`,
            )
            const ship = cartRes.cart?.shipping_address
            if (ship?.address_1) {
              return { shipping: ship, billing: cartRes.cart?.billing_address || null }
            }
          }
          catch { /* try next slot */ }
        }
      }
      catch { /* nothing to prefill */ }

      return { shipping: null, billing: null }
    },

    async addLineItem(variantId: string, quantity = 1, metadata?: Record<string, any>) {
      if (!this.cartId) throw new Error('Cart not initialized.')
      const { medusaFetch } = useMedusa()
      await medusaFetch(`/store/carts/${this.cartId}/line-items`, {
        method: 'POST',
        body: { variant_id: variantId, quantity, ...(metadata ? { metadata } : {}) },
      })
      await this.refresh()
    },

    async updateLineItem(itemId: string, quantity: number) {
      if (!this.cartId) throw new Error('Cart not initialized.')
      const { medusaFetch } = useMedusa()
      await medusaFetch(`/store/carts/${this.cartId}/line-items/${itemId}`, {
        method: 'POST',
        body: { quantity },
      })
      await this.refresh()
    },

    async removeLineItem(itemId: string) {
      if (!this.cartId) throw new Error('Cart not initialized.')
      const { medusaFetch } = useMedusa()
      await medusaFetch(`/store/carts/${this.cartId}/line-items/${itemId}`, { method: 'DELETE' })
      await this.refresh()
    },

    /**
     * Reprice the cart in the visitor's resolved Medusa region. Carts are
     * pre-created server-side with a default (USD) region; without this the
     * shipping page and line items stay USD even when the storefront resolved
     * a different region from the visitor's IP.
     */
    async alignRegion(): Promise<void> {
      if (!this.cartId || !this.cart) return
      const basic = useBasicStore()
      const target = basic.medusaRegionId
      if (!target || this.cart.region_id === target) return
      try {
        await this.updateCart({ region_id: target })
      }
      catch (e: any) {
        // Non-fatal: surface as a soft error but keep the cart usable.
        this.error = e?.data?.message || e?.message || 'Failed to align cart region.'
      }
    },

    /** Patch cart fields (region, email, shipping/billing address, metadata, etc.). */
    async updateCart(body: Record<string, any>) {
      if (!this.cartId) throw new Error('Cart not initialized.')
      const { medusaFetch } = useMedusa()
      const res = await medusaFetch<{ cart: MedusaCart }>(`/store/carts/${this.cartId}`, {
        method: 'POST',
        body,
      })
      this.cart = res.cart
      return this.cart
    },

    async setShippingAddress(address: Record<string, any>) {
      return this.updateCart({ shipping_address: address })
    },

    async listShippingOptions(): Promise<ShippingOption[]> {
      if (!this.cartId) return []
      try {
        const res = await $fetch<{ shipping_options: ShippingOption[] }>(
          `${MEDUSA_BACKEND_URL}/store/shipping-options`,
          {
            params: { cart_id: this.cartId },
            headers: { 'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY },
          },
        )
        this.shippingOptions = res.shipping_options || []
        return this.shippingOptions
      }
      catch (e: any) {
        this.error = e?.data?.message || e?.message || 'Failed to load shipping options.'
        this.shippingOptions = []
        return []
      }
    },

    async setShippingMethod(optionId: string) {
      if (!this.cartId) throw new Error('Cart not initialized.')
      const { medusaFetch } = useMedusa()
      await medusaFetch(`/store/carts/${this.cartId}/shipping-methods`, {
        method: 'POST',
        body: { option_id: optionId },
      })
      await this.refresh()
    },

    async complete(): Promise<{ orderId?: string; cart?: MedusaCart }> {
      if (!this.cartId) throw new Error('Cart not initialized.')
      const { medusaFetch } = useMedusa()
      const res = await medusaFetch<any>(`/store/carts/${this.cartId}/complete`, { method: 'POST' })
      // Medusa returns either { type: 'order', order } or { type: 'cart', cart, error }
      if (res?.type === 'order') return { orderId: res.order?.id }
      if (res?.cart) this.cart = res.cart
      return { cart: this.cart || undefined }
    },

    reset() {
      this.cartId = null
      this.cart = null
      this.shippingOptions = []
      this.error = ''
    },
  },
})
