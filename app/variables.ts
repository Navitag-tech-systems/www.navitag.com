export const MEDUSA_BACKEND_URL = 'https://shopapi.navitag.com'
// All-scope key — current/default. Use everywhere: cart, order, region, AND
// catalog browsing (since this key is linked to the catalog sales channel too).
export const MEDUSA_PUBLISHABLE_KEY = 'pk_acd1689997df608660c9753f37ae30f24a0b503e7de1bacba7e12e3acaf7216d'
// Products-only key — bound only to the public catalog ("ecom Store") sales
// channel. Used by the shop / physical-goods checkout flow so cart create can
// resolve a single sales channel unambiguously.
export const MEDUSA_PRODUCTS_PUBLISHABLE_KEY = 'pk_7f3adc4d20150b231a29dcf6c8996dd49dae3d280857b91ec15b3192e7cc9f00'

// Sales channel id for hidden / digital-only products (data plans, top-ups,
// renewals). Required in cart-create bodies that use MEDUSA_PUBLISHABLE_KEY,
// since that key is bound to multiple sales channels.
export const MEDUSA_HIDDEN_SALES_CHANNEL_ID = 'sc_01KNBNYT4XAB2QZGD1AS6R0HT0'

// Shipping option id for the digital-delivery method used by top-up / renewal
// carts. No physical fulfillment — required by Medusa to mark the cart as
// shippable so /complete can mint an order.
export const MEDUSA_DIGITAL_DELIVERY_OPTION_ID = 'so_01KNNDCWCEWGBC8BA71HG92T10'
export const UNIFIED_API_URL = 'https://api.navitag.net/v1'
export const STRAPI_URL = 'https://cms.navitag.com'
