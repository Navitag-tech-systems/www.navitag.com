<script setup lang="ts">
useSeoMeta({
  title: 'Navitag - Privacy Policy',
  robots: 'index, follow',
})

if (import.meta.client) {
  const { $fbq } = useNuxtApp()
  onMounted(() => {
    $fbq('ViewContent', {
      content_name: 'privacy_policy',
      content_category: 'legal',
    })
  })
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-5 py-10">
    <h1 class="text-3xl font-bold text-gray-900 border-b-2 border-navitag-blue pb-3 mb-2">Privacy Policy</h1>
    <p class="italic text-gray-500 mb-8">Last Updated: May 31, 2026</p>

    <p class="text-gray-700 leading-relaxed mb-6">
      This Privacy Policy describes how <strong>Navitag Technology Systems OPC</strong> ("we", "us", or "our"), a One Person Corporation based in Makati, Metro Manila, Philippines, collects, uses, and shares your personal information when you use our mobile application <strong>Navitag Track</strong> (the "App"). We are the data controller responsible for your personal information.
    </p>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">1. Information We Collect</h2>
    <p class="text-gray-700 leading-relaxed mb-4">
      When you create an account using <strong>Google Sign-In</strong> or <strong>Sign in with Apple</strong>, we collect a limited set of information from your chosen provider, including:
    </p>
    <ul class="list-disc pl-5 space-y-2 text-gray-700 mb-6">
      <li><strong>Name:</strong> Your name as provided by your Google or Apple account.</li>
      <li><strong>Email Address:</strong> The email address associated with your account, used to create and identify your user profile. If you sign in with Apple and choose "Hide My Email", we receive an anonymized Apple private relay address instead of your real email.</li>
      <li><strong>Authentication Data:</strong> We use Firebase Authentication to securely manage your login sessions and protect your account.</li>
    </ul>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">2. How We Use Your Information</h2>
    <p class="text-gray-700 leading-relaxed mb-4">We use the information we collect to:</p>
    <ul class="list-disc pl-5 space-y-2 text-gray-700 mb-6">
      <li>Create and maintain your <strong>Navitag Track</strong> account.</li>
      <li>Identify you within the app and personalize your experience.</li>
      <li>Communicate regarding app updates, security alerts, or support.</li>
      <li>Ensure the security of our application and prevent fraudulent activity.</li>
    </ul>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">3. Data Sharing and Third Parties</h2>
    <p class="text-gray-700 leading-relaxed mb-4">
      We do not sell your personal data. We only share information with the following service providers necessary for the app's core functionality:
    </p>
    <ul class="list-disc pl-5 space-y-2 text-gray-700 mb-6">
      <li><strong>Firebase (Google):</strong> For secure authentication and encrypted data storage.</li>
      <li><strong>Google Sign-In:</strong> To facilitate the Single Sign-On (SSO) process when you choose Google.</li>
      <li><strong>Sign in with Apple:</strong> To facilitate the Single Sign-On (SSO) process when you choose Apple.</li>
    </ul>
    <p class="text-gray-700 leading-relaxed mb-6">
      We may also disclose information where required to comply with applicable law, legal process, or a lawful government request.
    </p>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">4. International Data Transfers</h2>
    <p class="text-gray-700 leading-relaxed mb-6">
      As our service providers (Google and Meta) operate globally, your personal information may be processed and stored on servers located outside the Philippines, including in the United States. We take reasonable steps to ensure such transfers are protected by appropriate safeguards consistent with this Policy and applicable data protection laws.
    </p>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">5. Data Retention and Deletion</h2>
    <p class="text-gray-700 leading-relaxed mb-4">We retain your information for as long as your account is active. To delete your data:</p>
    <ul class="list-disc pl-5 space-y-2 text-gray-700 mb-6">
      <li><strong>In-App:</strong> Navigate to Account &gt; Delete Account.</li>
      <li><strong>Revoke Google access:</strong> Visit your Google Account at <a href="https://myaccount.google.com/permissions" class="text-navitag-blue hover:underline">myaccount.google.com/permissions</a> and remove Navitag Track.</li>
      <li><strong>Revoke Apple access:</strong> On your device, go to Settings &gt; [your name] &gt; Sign in with Apple, select Navitag Track, and choose Stop Using Apple ID.</li>
      <li><strong>Direct Request:</strong> You may contact us at <strong>info@navitag.com</strong>, or use our <NuxtLink to="/delete-account" class="text-navitag-blue hover:underline">Delete Account page</NuxtLink>, to request permanent deletion of your data. We will process requests within 30 days.</li>
    </ul>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">6. Your Privacy Rights</h2>
    <p class="text-gray-700 leading-relaxed mb-4">
      In accordance with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173) and other applicable laws, you have the right to:
    </p>
    <ul class="list-disc pl-5 space-y-2 text-gray-700 mb-6">
      <li>Access the personal information we hold about you.</li>
      <li>Request correction of inaccurate or incomplete information.</li>
      <li>Request deletion of your personal information.</li>
      <li>Object to or withdraw consent for the processing of your information.</li>
      <li>Lodge a complaint with the National Privacy Commission (NPC) of the Philippines.</li>
    </ul>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">7. Children's Privacy</h2>
    <p class="text-gray-700 leading-relaxed mb-6">
      Navitag Track is not directed to children under the age of 13, and we do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us at info@navitag.com and we will take steps to delete it.
    </p>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">8. Security</h2>
    <p class="text-gray-700 leading-relaxed mb-6">
      We implement industry-standard security measures, including SSL/TLS encryption, to protect your data during transmission and while stored in our secure Firebase environment.
    </p>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">9. Changes to This Privacy Policy</h2>
    <p class="text-gray-700 leading-relaxed mb-6">
      We may update this Privacy Policy from time to time. When we do, we will revise the "Last Updated" date at the top of this page. We encourage you to review this Policy periodically. Your continued use of the App after any changes constitutes acceptance of the updated Policy.
    </p>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">10. Contact Us</h2>
    <div class="bg-gray-50 p-6 rounded-xl border border-gray-200 mt-4">
      <p class="text-gray-700 mb-3">If you have any questions about this Privacy Policy or our data practices, please contact us at:</p>
      <p class="text-gray-700">
        <strong>Navitag Technology Systems OPC</strong><br>
        Makati, Metro Manila, Philippines<br>
        <strong>Email:</strong> info@navitag.com<br>
        <strong>Website:</strong> <a href="https://www.navitag.com" class="text-navitag-blue hover:underline">www.navitag.com</a>
      </p>
    </div>
  </div>
</template>
