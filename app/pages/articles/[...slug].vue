<script setup lang="ts">
import { STRAPI_URL } from '~/variables'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const { $fbq } = useNuxtApp()

const slug = computed(() => {
  const raw = route.params.slug
  return Array.isArray(raw) ? raw.join('/') : (raw as string)
})

const { data: article, error } = await useAsyncData(
  `article-${slug.value}`,
  async () => {
    const res = await $fetch<any>(`${STRAPI_URL}/api/articles`, {
      query: {
        'filters[slug][$eq]': slug.value,
        'populate': '*',
      },
    })
    const entry = res?.data?.[0]
    if (!entry) return null
    const attrs = entry.attributes ?? entry
    return {
      id: entry.id,
      title: attrs.title,
      slug: attrs.slug,
      excerpt: attrs.excerpt,
      bodyHtml: attrs.bodyHtml,
      customCss: attrs.customCss,
      category: attrs.category?.data?.attributes?.name ?? attrs.category?.name ?? null,
      author: attrs.author?.data?.attributes?.name ?? attrs.author?.name ?? null,
      seoTitle: attrs.seoTitle,
      seoDescription: attrs.seoDescription,
      ogImage: attrs.ogImage?.data?.attributes?.url ?? attrs.ogImage?.url ?? null,
      noindex: attrs.noindex ?? false,
    }
  },
)

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
  title: computed(() => article.value?.seoTitle ?? article.value?.title ?? slug.value),
  description: computed(() => article.value?.seoDescription ?? article.value?.excerpt ?? ''),
  ogTitle: computed(() => article.value?.seoTitle ?? article.value?.title ?? ''),
  ogDescription: computed(() => article.value?.seoDescription ?? article.value?.excerpt ?? ''),
  ogImage: computed(() => article.value?.ogImage ?? ''),
  robots: computed(() => article.value?.noindex ? 'noindex, nofollow' : 'index, follow'),
})
</script>

<template>
  <div class="min-h-screen bg-[#F7F4EF]">
    <!-- 404 -->
    <div v-if="error || !article" class="flex flex-col items-center justify-center px-4 py-24 text-center">
      <h1 class="text-4xl font-bold text-[#0076F5]">Article not found</h1>
      <p class="mt-4 text-gray-600">The article you're looking for doesn't exist or has been removed.</p>
      <NuxtLink to="/" class="mt-8 inline-block rounded-lg bg-[#0076F5] px-6 py-3 font-semibold text-white">
        Back to home
      </NuxtLink>
    </div>

    <!-- Article -->
    <div v-else class="cms">
      <style v-if="article.customCss" v-html="article.customCss"></style>
      <div v-html="article.bodyHtml"></div>
    </div>
  </div>
</template>
