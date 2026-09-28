<script setup lang="ts">
useSeoMeta({
  title: 'Navitag - Refund Policy',
  robots: 'index, follow',
})

if (import.meta.client) {
  const { $fbq } = useNuxtApp()
  onMounted(() => {
    $fbq('ViewContent', {
      content_name: 'refund_policy',
      content_category: 'legal',
    })
  })
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-5 py-10">
    <h1 class="text-3xl font-bold text-gray-900 border-b-2 border-navitag-blue pb-3 mb-2">Refund Policy</h1>
    <p class="italic text-gray-500 mb-8">Last Updated: September 28, 2026</p>

    <p class="text-gray-700 leading-relaxed mb-6">
      This Refund Policy applies to purchases made from Navitag through this website and the <strong>Navitag Track</strong> app — data plan top-ups and renewals for your tracking devices, and Navitag hardware sold in our online shop. The seller is the Navitag entity named on your receipt: <strong>Navitag Technology Systems OPC</strong> (26 Pandi Industrial Park, Cupang, Pandi, Bulacan 3014, Philippines) for orders in the Philippines and Southeast Asia, or <strong>Navitag Digital Innovations LLC</strong> (Sheridan, Wyoming, USA) for orders in the United States.
    </p>

    <div class="bg-blue-50 border-l-4 border-navitag-blue p-4 rounded-r-lg mb-6">
      <p class="text-gray-700 leading-relaxed">
        <strong>Refund requests must be made within 7 days and must state a valid reason.</strong> The 7 days run from the date of purchase for data plans, and from the date of delivery for hardware. Requests made after 7 days, or without a reason we can verify, are not eligible for a refund.
      </p>
    </div>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">1. What Counts as a Valid Reason</h2>
    <p class="text-gray-700 leading-relaxed mb-4">
      A refund is available when the purchase did not deliver what you paid for. Valid reasons are:
    </p>
    <p class="text-gray-700 leading-relaxed mb-2"><strong>Data plans and renewals</strong></p>
    <ul class="list-disc pl-5 space-y-2 text-gray-700 mb-4">
      <li>The plan was unable to activate on your device, or the expiry date shown in the app did not extend, and our support team could not activate it.</li>
      <li>You were charged more than once for the same plan on the same device (duplicate charge).</li>
      <li>The plan was applied to the wrong device because of an error on our side.</li>
      <li>The device's connectivity did not work during the 7 days because of a fault in our service or SIM that we could not resolve.</li>
    </ul>
    <p class="text-gray-700 leading-relaxed mb-2"><strong>Hardware</strong></p>
    <ul class="list-disc pl-5 space-y-2 text-gray-700 mb-4">
      <li>The device arrived damaged, or is faulty and does not work — whether the fault is found before or after installation.</li>
      <li>You received the wrong item, or an item that is missing parts listed in the product description.</li>
      <li>The item is materially different from its description on our website.</li>
    </ul>
    <p class="text-gray-700 leading-relaxed mb-6">
      Please keep evidence: a screenshot of the app showing the device's expiry or connection status, your order number and receipt, and, for hardware, photos of the item and its packaging as received. We may ask for these before we approve a refund.
    </p>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">2. What Is Not Refundable</h2>
    <ul class="list-disc pl-5 space-y-2 text-gray-700 mb-6">
      <li>Change of mind, or a plan or device bought by mistake for a device you no longer use.</li>
      <li>A data plan that has activated and is working. Plan time that has already been consumed is not refunded.</li>
      <li>Plans bought for a device that was later lost, stolen, sold or damaged.</li>
      <li>Hardware that works as described but has been installed, or that has been physically modified, opened, or damaged after delivery, or returned without its original packaging and accessories. A faulty device is refundable whether or not it has been installed.</li>
      <li>Connectivity problems caused by the vehicle installation, no mobile coverage at the location, or a SIM that was removed or replaced.</li>
      <li>Requests made more than 7 days after purchase (plans) or delivery (hardware).</li>
      <li>Purchases made on <strong>Shopee</strong> or <strong>Lazada</strong>, which are governed by that marketplace's own return and refund process.</li>
      <li>In-app purchases made through the <strong>Apple App Store</strong>, which are refunded by Apple under its own policy — request them at <a href="https://reportaproblem.apple.com" class="text-navitag-blue hover:underline" target="_blank" rel="noopener">reportaproblem.apple.com</a>.</li>
    </ul>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">3. How to Request a Refund</h2>
    <ol class="list-decimal pl-5 space-y-2 text-gray-700 mb-6">
      <li>Within 7 days, <NuxtLink to="/contact" class="text-navitag-blue hover:underline">contact us</NuxtLink> using the email address on your account. Include your <strong>order number</strong>, the <strong>device IMEI</strong> (for plans), the <strong>reason</strong> for the request, and your evidence.</li>
      <li>We will acknowledge the request and may ask our support team to attempt a fix first — for example, re-activating a plan. If the problem is fixed, no refund is due.</li>
      <li>We decide on the request within <strong>5 business days</strong> of receiving everything we need, and tell you the outcome by email.</li>
      <li>For hardware, an approved refund may require you to return the item. We will send return instructions; return shipping for a defective or wrong item is at our cost.</li>
    </ol>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">4. How Refunds Are Paid</h2>
    <p class="text-gray-700 leading-relaxed mb-4">
      Approved refunds are returned to the <strong>original payment method</strong> through the same payment processor that took the payment (Xendit for cards, GCash and Maya paid in the Philippines; PayPal for card payments made through PayPal). We do not refund to a different card, account or wallet, and we do not pay refunds in cash.
    </p>
    <ul class="list-disc pl-5 space-y-2 text-gray-700 mb-6">
      <li><strong>Cards paid through Xendit:</strong> we submit the refund within 1 business day of approval; your bank then takes about 7–14 days to credit your card, depending on the issuer.</li>
      <li><strong>Cards paid through PayPal:</strong> up to 30 days to appear on your card statement, depending on the issuer.</li>
      <li><strong>GCash / Maya:</strong> usually the same day, and at most 1 business day after we submit the refund.</li>
      <li><strong>Amount:</strong> the price paid for the item or plan. We do not deduct payment processing fees from your refund. Where a data plan was partly usable, we may refund the unused portion only.</li>
    </ul>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">5. Chargebacks and Disputes</h2>
    <p class="text-gray-700 leading-relaxed mb-6">
      Please contact us before raising a dispute with your bank, card issuer or e-wallet provider — most problems can be fixed or refunded faster that way. If a chargeback is opened for a purchase that this policy covers, we will provide the transaction records and evidence to the payment processor. A plan or device that is the subject of an open chargeback may be suspended until the dispute is resolved.
    </p>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">6. Cancellations</h2>
    <p class="text-gray-700 leading-relaxed mb-6">
      Data plans are one-time purchases and do not auto-renew from this website, so there is nothing to cancel; a plan simply ends on its expiry date. A hardware order can be cancelled for a full refund at any time before it ships by <NuxtLink to="/contact" class="text-navitag-blue hover:underline">contacting us</NuxtLink> with the order number.
    </p>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">7. Your Statutory Rights</h2>
    <p class="text-gray-700 leading-relaxed mb-6">
      This policy does not limit any rights you have under the Philippine Consumer Act (Republic Act No. 7394) or other applicable consumer protection laws in your country.
    </p>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">8. Changes to This Policy</h2>
    <p class="text-gray-700 leading-relaxed mb-6">
      We may update this Refund Policy from time to time. When we do, we will revise the "Last Updated" date at the top of this page. The policy in force on the date of your purchase applies to that purchase.
    </p>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">9. Contact Us</h2>
    <p class="text-gray-700 leading-relaxed mb-6">
      Questions about this policy or an existing request:
    </p>
    <ul class="list-disc pl-5 space-y-2 text-gray-700 mb-6">
      <li><strong>Contact form:</strong> <NuxtLink to="/contact" class="text-navitag-blue hover:underline">navitag.com/contact</NuxtLink></li>
      <li><strong>Email:</strong> <a href="mailto:info@navitag.com" class="text-navitag-blue hover:underline">info@navitag.com</a></li>
      <li><strong>Phone / Viber:</strong> <a href="tel:+639176388402" class="text-navitag-blue hover:underline">+63 917 638 8402</a></li>
      <li><strong>Address:</strong> Navitag Technology Systems OPC, 26 Pandi Industrial Park, Cupang, Pandi, Bulacan 3014, Philippines</li>
    </ul>
    <p class="text-gray-700 leading-relaxed mb-6">
      See also our <NuxtLink to="/privacy-policy" class="text-navitag-blue hover:underline">Privacy Policy</NuxtLink> for how payment information is handled, and our <NuxtLink to="/terms-and-conditions" class="text-navitag-blue hover:underline">Terms and Conditions</NuxtLink>.
    </p>
  </div>
</template>
