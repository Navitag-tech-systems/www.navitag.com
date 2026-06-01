<script setup lang="ts">
useSeoMeta({
  title: 'Navitag - Delete Your Account & Data',
  robots: 'index, follow',
})

if (import.meta.client) {
  const { $fbq } = useNuxtApp()
  onMounted(() => {
    $fbq('ViewContent', {
      content_name: 'delete_account',
      content_category: 'legal',
    })
  })
}

const mailto =
  'mailto:info@navitag.com' +
  '?subject=' + encodeURIComponent('Account & Data Deletion Request — Navitag Track') +
  '&body=' + encodeURIComponent(
    'Hello Navitag Team,\n\n' +
    'I would like to permanently delete my Navitag Track account and all associated data.\n\n' +
    'Account email / sign-in: \n' +
    'Reason (optional): \n\n' +
    'Thank you.',
  )
</script>

<template>
  <div class="max-w-3xl mx-auto px-5 py-10">
    <h1 class="text-3xl font-bold text-gray-900 border-b-2 border-navitag-blue pb-3 mb-2">Delete Your Account &amp; Data</h1>
    <p class="italic text-gray-500 mb-8">Last Updated: May 31, 2026</p>

    <p class="text-gray-700 leading-relaxed mb-6">
      This page explains how to request the deletion of your <strong>Navitag Track</strong> account and the personal
      data associated with it. Navitag Track is operated by <strong>Navitag Technology Systems OPC</strong>, based in
      Makati, Metro Manila, Philippines.
    </p>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">Option 1: Delete from within the App</h2>
    <p class="text-gray-700 leading-relaxed mb-4">
      The fastest way to delete your account and data is directly in the app:
    </p>
    <ol class="list-decimal pl-5 space-y-2 text-gray-700 mb-6">
      <li>Open <strong>Navitag Track</strong> and sign in.</li>
      <li>Go to <strong>Account &gt; Delete Account</strong>.</li>
      <li>Confirm the deletion request.</li>
    </ol>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">Option 2: Request Deletion by Email</h2>
    <p class="text-gray-700 leading-relaxed mb-4">
      If you can no longer access the app, you can request deletion without reinstalling it. Email us from the address
      associated with your account so we can verify your identity:
    </p>
    <div class="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6">
      <a
        :href="mailto"
        class="inline-block bg-navitag-blue text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition"
      >
        Request Account Deletion
      </a>
      <p class="text-gray-600 text-sm mt-3">
        Or email us directly at <strong>info@navitag.com</strong> with the subject
        "Account &amp; Data Deletion Request".
      </p>
    </div>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">What Gets Deleted</h2>
    <p class="text-gray-700 leading-relaxed mb-4">When your request is processed, we permanently delete:</p>
    <ul class="list-disc pl-5 space-y-2 text-gray-700 mb-6">
      <li>Your account profile (name and email address).</li>
      <li>Your authentication records held in Firebase Authentication.</li>
      <li>App data and settings tied to your account.</li>
    </ul>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">Data We May Retain</h2>
    <p class="text-gray-700 leading-relaxed mb-6">
      We may retain a limited set of records where required to comply with legal, tax, accounting, or fraud-prevention
      obligations, or to resolve disputes. Such records are kept only for as long as the law requires and are then
      securely deleted.
    </p>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">Processing Time</h2>
    <p class="text-gray-700 leading-relaxed mb-6">
      We process deletion requests within <strong>30 days</strong>. You may also revoke the app's access at any time
      from your <a href="https://myaccount.google.com/permissions" class="text-navitag-blue hover:underline">Google Account permissions</a>
      or, for Apple, via Settings &gt; [your name] &gt; Sign in with Apple on your device.
    </p>

    <h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">Questions</h2>
    <div class="bg-gray-50 p-6 rounded-xl border border-gray-200 mt-4">
      <p class="text-gray-700 mb-3">For any questions about deletion or your privacy, contact us at:</p>
      <p class="text-gray-700">
        <strong>Navitag Technology Systems OPC</strong><br>
        Makati, Metro Manila, Philippines<br>
        <strong>Email:</strong> info@navitag.com<br>
        <strong>Privacy Policy:</strong>
        <NuxtLink to="/privacy-policy" class="text-navitag-blue hover:underline">www.navitag.com/privacy-policy</NuxtLink>
      </p>
    </div>
  </div>
</template>
