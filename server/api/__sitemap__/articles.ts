import { STRAPI_URL } from '~/variables'

export default defineEventHandler(async () => {
  try {
    const res = await $fetch<any>(`${STRAPI_URL}/api/articles`, {
      query: {
        'fields[0]': 'slug',
        'fields[1]': 'noindex',
        'fields[2]': 'updatedAt',
        'pagination[pageSize]': 1000,
      },
    })
    const items = res?.data ?? []
    return items
      .map((entry: any) => {
        const attrs = entry.attributes ?? entry
        if (attrs?.noindex) return null
        if (!attrs?.slug) return null
        return {
          loc: `/articles/${attrs.slug}`,
          lastmod: attrs.updatedAt ?? undefined,
        }
      })
      .filter(Boolean)
  }
  catch {
    return []
  }
})
