<script setup lang="ts">
definePageMeta({
  layout: false,
})

const route = useRoute()
const { $fbq } = useNuxtApp()

const slug = computed(() => {
  const raw = route.params.slug
  return Array.isArray(raw) ? raw.join('/') : (raw as string)
})

// TODO: Replace with Strapi fetch by slug
// const { data: article } = await useAsyncData(`article-${slug.value}`, () =>
//   $fetch(`${STRAPI_URL}/api/articles`, {
//     query: { 'filters[slug][$eq]': slug.value, populate: '*' },
//   })
// )
const article = ref<any>(null)

watch(
  article,
  (a) => {
    if (!a) return
    $fbq('ViewContent', {
      content_name: a.title,
      content_category: a.category,
      content_ids: [a.slug ?? slug.value],
      content_type: 'article',
    })
  },
  { immediate: true },
)

useSeoMeta({
  title: computed(() => `Navitag - ${slug.value}`),
  robots: 'noindex, nofollow',
})
</script>

<template>
  <div class="min-h-screen bg-[#F7F4EF] px-4 py-12">
    <article class="mx-auto max-w-3xl">
      <p class="text-sm text-gray-500">Article slug: {{ slug }}</p>
      <h1 class="mt-4 text-3xl font-bold text-[#0076F5]">Article placeholder</h1>
      <p class="mt-4 text-gray-700">
        Strapi CMS integration pending. This page will render article content fetched by slug.
      </p>
    </article>
  </div>
</template>
