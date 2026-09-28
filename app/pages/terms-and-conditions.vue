<script setup lang="ts">
useSeoMeta({
  title: 'Navitag - Terms and Conditions',
  robots: 'index, follow',
})

if (import.meta.client) {
  const { $fbq } = useNuxtApp()
  onMounted(() => {
    $fbq('ViewContent', {
      content_name: 'terms_and_conditions',
      content_category: 'legal',
    })
  })
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-5 py-10">
    <h1 class="text-3xl font-bold text-gray-900 border-b-2 border-navitag-blue pb-3 mb-2">Terms and Conditions</h1>
    <p class="italic text-gray-500 mb-8">Last Updated: September 28, 2026</p>

    <p class="text-gray-700 leading-relaxed mb-4">
      These Terms and Conditions ("Terms") govern your use of the navitag.com website and online shop, the <strong>Navitag Track</strong> mobile app, Navitag GPS tracking devices, and the data plans that connect them (together, the "Services"). They form an agreement between you and the Navitag entity that sells to you:
    </p>
    <ul class="list-disc pl-5 space-y-2 text-gray-700 mb-4">
      <li><strong>Navitag Technology Systems OPC</strong>, 26 Pandi Industrial Park, Cupang, Pandi, Bulacan 3014, Philippines — for customers in the Philippines, Southeast Asia and Asia-Pacific; or</li>
      <li><strong>Navitag Digital Innovations LLC</strong>, Sheridan, Wyoming, USA — for customers in all other regions.</li>
    </ul>
    <p class="text-gray-700 leading-relaxed mb-6">
      "Navitag", "we", "us" and "our" mean that entity. The seller is also named on your receipt. By creating an account, placing an order or using the Services, you agree to these Terms, our <NuxtLink to="/privacy-policy" class="text-navitag-blue hover:underline">Privacy Policy</NuxtLink> and our <NuxtLink to="/refund-policy" class="text-navitag-blue hover:underline">Refund Policy</NuxtLink>. If you do not agree, do not use the Services.
    </p>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">1. Eligibility and Your Account</h2>
    <ul class="list-disc pl-5 space-y-2 text-gray-700 mb-6">
      <li>You must be at least 18 years old, or the age of majority where you live, to buy from us. If you buy on behalf of a company, you confirm you are authorised to bind it to these Terms.</li>
      <li>An account is required to buy plans and devices and to use the app. You can sign up with an email address and password, Google Sign-In or Sign in with Apple.</li>
      <li>Keep your account details accurate and your login secure. You are responsible for activity on your account, including actions taken by people you give shared access to your devices.</li>
      <li>Tell us promptly through our <NuxtLink to="/contact" class="text-navitag-blue hover:underline">contact page</NuxtLink> if you believe your account has been accessed without your permission.</li>
    </ul>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">2. Products and Services</h2>
    <ul class="list-disc pl-5 space-y-2 text-gray-700 mb-6">
      <li><strong>Devices.</strong> The <strong>TRACK-1</strong> GPS tracker, sold through our online shop and our official stores on Shopee and Lazada. A device you buy is yours to keep.</li>
      <li><strong>Data plans.</strong> Connectivity for your device, sold as <strong>Basic</strong> and <strong>Pro</strong> plans for 3, 6 or 12-month terms, and <strong>Business</strong> plans for business customers. Features such as location update interval, history playback, geofence limits and shared access differ by plan and are listed on our <NuxtLink to="/data-plans" class="text-navitag-blue hover:underline">Data Plans</NuxtLink> page.</li>
      <li><strong>Included plan.</strong> Every new TRACK-1 includes 3 months of the Basic plan at no extra cost.</li>
      <li><strong>The app.</strong> Navitag Track lets you view your devices' location, trips and alerts, set geofences and share access. It is provided free with an active device.</li>
    </ul>
    <p class="text-gray-700 leading-relaxed mb-6">
      Product photos and descriptions are as accurate as we can make them. We may change, improve or discontinue products, plans and features; changes do not reduce a plan you have already paid for during its term.
    </p>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">3. Prices and Payment</h2>
    <ul class="list-disc pl-5 space-y-2 text-gray-700 mb-6">
      <li><strong>Currency.</strong> Prices are shown in Philippine pesos (PHP) for customers in the Philippines and in US dollars (USD) elsewhere. The total shown at checkout — including shipping, any discount and any applicable taxes — is the amount you pay.</li>
      <li><strong>Payment methods.</strong> The methods available depend on your region and are shown at checkout. They may include e-wallets (GCash, Maya) and credit or debit cards processed by <strong>Xendit</strong>, and credit or debit cards processed by <strong>PayPal</strong>. Payment is made on the processor's secure page or fields; we never see or store your full card number, expiry date or security code.</li>
      <li><strong>When an order is accepted.</strong> An order is accepted only once the payment processor confirms your payment. If a payment is declined, cancelled or not completed, no order is created and no plan is activated.</li>
      <li><strong>Pricing errors.</strong> If an item is listed at an obviously wrong price, we may cancel the order and refund the full amount paid, even after it is confirmed.</li>
      <li><strong>Promo codes.</strong> Promo codes apply only to the products and regions stated for them, cannot be exchanged for cash, cannot be combined unless we say so, and may be withdrawn at any time. We may cancel orders that use a code obtained or used improperly.</li>
      <li><strong>In-app purchases.</strong> Plans bought inside the iOS app are sold and billed by Apple through the App Store and are also subject to Apple's terms.</li>
    </ul>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">4. Orders, Shipping and Delivery</h2>
    <ul class="list-disc pl-5 space-y-2 text-gray-700 mb-6">
      <li>We ship devices bought from our online shop to the address you give at checkout. Shipping options, fees and estimated delivery times are shown at checkout; delivery times are estimates, not guarantees.</li>
      <li>Please check your address carefully. We are not responsible for delays or loss caused by an incorrect or incomplete address.</li>
      <li>For deliveries outside the Philippines, any import duties, taxes or customs fees charged by the destination country are paid by the recipient.</li>
      <li>Please inspect your order on delivery. Damaged, wrong or incomplete items must be reported within 7 days of delivery under our <NuxtLink to="/refund-policy" class="text-navitag-blue hover:underline">Refund Policy</NuxtLink>.</li>
      <li>You can cancel a hardware order for a full refund at any time before it ships.</li>
    </ul>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">5. Data Plans</h2>
    <ul class="list-disc pl-5 space-y-2 text-gray-700 mb-6">
      <li><strong>Prepaid, no auto-renewal.</strong> Plans bought on this website are one-time, prepaid purchases for a fixed term. They do not renew automatically; you renew by buying another plan.</li>
      <li><strong>One plan, one device.</strong> Each plan is bought for a specific device, identified by its IMEI, and cannot be moved to another device.</li>
      <li><strong>Renewing the same plan.</strong> The new term is added to the device's current expiry date, so prepaid time is never lost. If the plan has already expired, the new term starts on the purchase date.</li>
      <li><strong>Changing plan</strong> (for example, Basic to Pro). The new term starts on the purchase date. Any unused time left on the old plan is converted into days on the new plan in proportion to the two plans' prices, and added to the new term.</li>
      <li><strong>Expiry date.</strong> A plan ends at the end of its last day in your local time. The resulting expiry date for each device is shown at checkout before you pay.</li>
      <li><strong>When a plan expires.</strong> Without an active plan the device becomes inactive: it stops sending location and does not appear on live tracking. Your account and past data are kept, and buying a plan brings the device back online.</li>
      <li><strong>Coverage.</strong> Devices connect through mobile networks — in the Philippines, Globe and Smart — and roam in 100+ countries. Service depends on network coverage where the device is, and may be unavailable in areas without signal, underground or inside shielded structures.</li>
    </ul>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">6. Warranty</h2>
    <div class="bg-blue-50 border-l-4 border-navitag-blue p-4 rounded-r-lg mb-4">
      <p class="text-gray-700 leading-relaxed">
        <strong>Every TRACK-1 purchase comes with a 3-year warranty</strong> against manufacturing defects, starting on the date of delivery. If your device fails because of a defect in materials or workmanship during that time, we will repair or replace it free of charge.
      </p>
    </div>
    <ul class="list-disc pl-5 space-y-2 text-gray-700 mb-4">
      <li><strong>Who is covered.</strong> The warranty covers TRACK-1 devices bought from Navitag — our online shop or our official Shopee and Lazada stores. Keep your order number or receipt as proof of purchase.</li>
      <li><strong>Business customers.</strong> Business customers do not need to buy devices: devices are provided with their Business plan and carry a <strong>lifetime warranty</strong> for as long as the Business plan remains active. Business accounts may also be covered by a separate written agreement, which prevails over these Terms where they differ.</li>
      <li><strong>Not covered.</strong> Physical damage, water or fire damage, damage from incorrect installation or from the vehicle's electrical system, devices that have been opened, modified or repaired by anyone other than Navitag or our authorised installer, normal wear, and lost or stolen devices.</li>
      <li><strong>How to claim.</strong> <NuxtLink to="/contact" class="text-navitag-blue hover:underline">Contact us</NuxtLink> with your order number, the device IMEI and a description of the fault. We will first try to fix the problem remotely; if that is not possible, we will tell you how to return the device for repair or replacement. A replacement device carries the remainder of the original warranty period.</li>
    </ul>
    <p class="text-gray-700 leading-relaxed mb-6">
      This warranty is in addition to, and does not limit, your rights under the Philippine Consumer Act (Republic Act No. 7394) or other consumer protection laws that apply to you.
    </p>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">7. Installation</h2>
    <p class="text-gray-700 leading-relaxed mb-6">
      TRACK-1 is designed to be connected to a vehicle's fuse box by you or an installer of your choice. Where our product page offers free on-site installation, it is available within our serviced areas and by appointment. Installation by you or a third party is at your own risk, and we are not responsible for damage to your vehicle, its electrical system or its manufacturer's warranty caused by an installation we did not perform.
    </p>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">8. Acceptable Use</h2>
    <p class="text-gray-700 leading-relaxed mb-4">You agree to use the Services lawfully. In particular, you must not:</p>
    <ul class="list-disc pl-5 space-y-2 text-gray-700 mb-4">
      <li>Track a vehicle, asset or person you do not own or are not authorised to track, or track anyone without the notice or consent that the law requires.</li>
      <li>Use the Services to stalk, harass, monitor or intimidate anyone.</li>
      <li>Resell, rent or share the Services commercially without our written permission.</li>
      <li>Copy, reverse engineer or tamper with the app, the devices' firmware or our systems, or try to gain unauthorised access to them.</li>
      <li>Interfere with the Services or other users' use of them.</li>
    </ul>
    <p class="text-gray-700 leading-relaxed mb-6">
      If you install a device in a vehicle used by employees or other people, you are responsible for informing them and for complying with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173) and any other privacy or employment laws that apply.
    </p>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">9. Service Availability and Accuracy</h2>
    <ul class="list-disc pl-5 space-y-2 text-gray-700 mb-6">
      <li>Location accuracy depends on GPS signal, mobile network coverage and the device's installation, and can be affected by buildings, weather and terrain. Locations are approximate.</li>
      <li>The Services are not an emergency service and do not guarantee the recovery of a stolen vehicle. In an emergency, contact the police or emergency services.</li>
      <li>We aim to keep the Services available at all times but do not guarantee uninterrupted or error-free operation. We may pause the Services for maintenance, and third-party networks may have outages we do not control.</li>
      <li>Where a device supports remote commands, you are responsible for using them safely and lawfully.</li>
    </ul>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">10. Intellectual Property</h2>
    <p class="text-gray-700 leading-relaxed mb-6">
      The Navitag name and logo, the website, the app, device firmware and all related content belong to Navitag or its licensors. We grant you a personal, non-transferable licence to use the app and website to use your devices and plans. No other rights are granted.
    </p>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">11. Limitation of Liability</h2>
    <p class="text-gray-700 leading-relaxed mb-4">To the extent permitted by law:</p>
    <ul class="list-disc pl-5 space-y-2 text-gray-700 mb-4">
      <li>We are not liable for indirect or consequential losses, lost profits or lost data, or for the loss, theft of or damage to any vehicle or property that a device is installed in or used to track.</li>
      <li>Our total liability for any claim relating to the Services is limited to the amount you paid us for the product or plan concerned in the 12 months before the claim arose.</li>
    </ul>
    <p class="text-gray-700 leading-relaxed mb-6">
      Nothing in these Terms limits liability that cannot be limited by law, including liability for fraud, gross negligence, or death or personal injury caused by our negligence, or your statutory rights as a consumer.
    </p>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">12. Suspension and Termination</h2>
    <ul class="list-disc pl-5 space-y-2 text-gray-700 mb-6">
      <li>We may suspend or close an account, or suspend a device, if you breach these Terms, if we reasonably suspect fraud or unlawful use, or if a payment is reversed. A device or plan that is the subject of an open chargeback may be suspended until the dispute is resolved.</li>
      <li>You may stop using the Services and delete your account at any time from the app (<strong>Account &gt; Delete Account</strong>) or our <NuxtLink to="/delete-account" class="text-navitag-blue hover:underline">Delete Account page</NuxtLink>. Deleting your account ends access to any remaining plan time, which is not refunded except as set out in our <NuxtLink to="/refund-policy" class="text-navitag-blue hover:underline">Refund Policy</NuxtLink>.</li>
    </ul>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">13. Third-Party Services</h2>
    <p class="text-gray-700 leading-relaxed mb-6">
      The Services rely on third parties, including payment processors (Xendit, PayPal), app stores (Apple App Store, Google Play), marketplaces (Shopee, Lazada), sign-in providers (Google, Apple), mobile network operators and couriers. Your use of their services is also subject to their own terms and policies.
    </p>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">14. Governing Law and Disputes</h2>
    <p class="text-gray-700 leading-relaxed mb-4">
      Please <NuxtLink to="/contact" class="text-navitag-blue hover:underline">contact us</NuxtLink> first — most issues can be resolved quickly and informally.
    </p>
    <ul class="list-disc pl-5 space-y-2 text-gray-700 mb-6">
      <li>If your seller is <strong>Navitag Technology Systems OPC</strong>, these Terms are governed by the laws of the Republic of the Philippines, and disputes will be heard by the proper courts of the Province of Bulacan.</li>
      <li>If your seller is <strong>Navitag Digital Innovations LLC</strong>, these Terms are governed by the laws of the State of Wyoming, USA, and disputes will be heard by the state or federal courts located in Wyoming.</li>
      <li>This does not remove any right you have under consumer protection law to bring a claim in the courts where you live.</li>
    </ul>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">15. Changes to These Terms</h2>
    <p class="text-gray-700 leading-relaxed mb-6">
      We may update these Terms from time to time. When we do, we will revise the "Last Updated" date at the top of this page. The Terms in force when you place an order apply to that order; continuing to use the Services after a change means you accept the updated Terms.
    </p>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">16. Contact Us</h2>
    <p class="text-gray-700 leading-relaxed mb-4">
      Questions about these Terms, an order or a warranty claim:
    </p>
    <ul class="list-disc pl-5 space-y-2 text-gray-700 mb-6">
      <li><strong>Contact form:</strong> <NuxtLink to="/contact" class="text-navitag-blue hover:underline">navitag.com/contact</NuxtLink></li>
      <li><strong>Email:</strong> <a href="mailto:info@navitag.com" class="text-navitag-blue hover:underline">info@navitag.com</a></li>
      <li><strong>Phone / Viber:</strong> <a href="tel:+639176388402" class="text-navitag-blue hover:underline">+63 917 638 8402</a></li>
      <li><strong>Address:</strong> Navitag Technology Systems OPC, 26 Pandi Industrial Park, Cupang, Pandi, Bulacan 3014, Philippines</li>
    </ul>
  </div>
</template>
