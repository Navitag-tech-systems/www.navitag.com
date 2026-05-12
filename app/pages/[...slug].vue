<script setup>
// Unknown path → 301 to home. Carry query (utm_*, fbclid, gclid, …) and
// hash so ad attribution survives a mistyped/legacy link.
const route = useRoute()
navigateTo({ path: '/', query: route.query, hash: route.hash }, { redirectCode: 301 })
</script>
