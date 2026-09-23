<script setup lang="ts">
/**
 * Proof-of-stock photo upload.
 *
 * EVERY IMAGE IS RE-ENCODED IN THE BROWSER before it is sent — drawn to a
 * canvas at a bounded size and exported as JPEG. Three things fall out of that,
 * all of them load-bearing:
 *
 *   · A 12 MP phone photo is 4-6 MB; six of them would blow past both the API's
 *     per-request limit and Brevo's 10 MB attachment ceiling, and the retailer
 *     would watch an upload fail on mobile data with no idea why.
 *   · iOS hands over HEIC. Re-encoding normalises it to JPEG, which is what the
 *     server's getimagesizefromstring() can actually identify. (Safari converts
 *     library picks to JPEG itself; a HEIC dragged in on desktop does not
 *     decode at all, and is reported by name rather than failing silently.)
 *   · EXIF is dropped with it — including GPS coordinates of the shop owner's
 *     photo. Stripping that is the right default for a form we are asking
 *     strangers to submit.
 *
 * The canvas honours EXIF orientation: browsers apply it when decoding into an
 * HTMLImageElement, so a portrait phone photo draws upright.
 */
import type { ProofImage } from '~/utils/partnerForm'

const model = defineModel<ProofImage[]>({ required: true })

interface Props {
  max?: number
  disabled?: boolean
}
const props = withDefaults(defineProps<Props>(), { max: 6, disabled: false })

/** Longest edge after downscale. 1600px still reads a shelf label clearly. */
const MAX_EDGE = 1600
const JPEG_QUALITY = 0.82
/** Refuse the source file before decoding it — a 40 MB RAW is not a mistake
 *  worth spending a canvas on. */
const MAX_SOURCE_BYTES = 25 * 1024 * 1024

const fileInput = ref<HTMLInputElement | null>(null)
const busy = ref(false)
const errors = ref<string[]>([])
const dragging = ref(false)

const totalBytes = computed(() => model.value.reduce((sum, p) => sum + p.size, 0))
const totalLabel = computed(() => `${(totalBytes.value / 1048576).toFixed(1)} MB`)
const slotsLeft = computed(() => props.max - model.value.length)

function pick() {
  if (props.disabled || slotsLeft.value <= 0) return
  fileInput.value?.click()
}

async function onFiles(files: FileList | File[] | null) {
  if (!files || props.disabled) return
  errors.value = []
  busy.value = true

  const incoming = Array.from(files).slice(0, Math.max(0, slotsLeft.value))
  if (Array.from(files).length > incoming.length) {
    errors.value.push(`Only ${props.max} images can be attached.`)
  }

  for (const file of incoming) {
    if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
      errors.value.push(`${file.name} is not an image.`)
      continue
    }
    if (file.size > MAX_SOURCE_BYTES) {
      errors.value.push(`${file.name} is too large.`)
      continue
    }
    try {
      const shrunk = await downscale(file)
      model.value = [...model.value, shrunk]
    }
    catch {
      errors.value.push(`${file.name} could not be read. Try a JPEG or PNG.`)
    }
  }

  busy.value = false
  if (fileInput.value) fileInput.value.value = ''
}

function downscale(file: File): Promise<ProofImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      try {
        const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('no 2d context')
        // White backing: a transparent PNG flattened to JPEG goes black
        // otherwise, which looks like a corrupt upload to whoever opens it.
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
        const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
        resolve({
          name: file.name.replace(/\.[^.]+$/, '') + '.jpg',
          data: dataUrl,
          // Decoded byte count from the base64 length — no need to re-decode.
          size: Math.floor(base64.length * 0.75),
        })
      }
      catch (err) { reject(err) }
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode failed')) }
    img.src = url
  })
}

function remove(index: number) {
  model.value = model.value.filter((_, i) => i !== index)
}

function onDrop(event: DragEvent) {
  dragging.value = false
  onFiles(event.dataTransfer?.files ?? null)
}
</script>

<template>
  <div class="mt-2.5">
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
      multiple
      class="hidden"
      @change="onFiles(($event.target as HTMLInputElement).files)"
    >

    <!-- Drop zone -->
    <button
      type="button"
      :disabled="disabled || slotsLeft <= 0 || busy"
      class="w-full rounded-xl border-2 border-dashed px-4 py-7 text-center transition disabled:cursor-not-allowed"
      :class="dragging
        ? 'border-navitag-blue bg-blue-50/60'
        : 'border-gray-200 bg-white hover:border-navitag-blue/50 hover:bg-gray-50 disabled:bg-gray-50 disabled:hover:border-gray-200'"
      @click="pick"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <i
        class="text-[18px]"
        :class="busy ? 'fas fa-circle-notch fa-spin text-navitag-blue' : 'fas fa-camera text-gray-400'"
      ></i>
      <span class="mt-2 block text-[14px] font-semibold text-gray-800">
        {{ busy ? 'Processing…' : slotsLeft > 0 ? 'Add photos' : 'Maximum photos added' }}
      </span>
      <span class="mt-0.5 block text-[12.5px] text-gray-500">
        Shelf, display or stockroom shots showing Navitag boxes. Up to {{ max }} images.
      </span>
    </button>

    <!-- Thumbnails -->
    <ul v-if="model.length" class="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2.5">
      <li v-for="(proof, i) in model" :key="i" class="relative group">
        <img
          :src="proof.data"
          :alt="`Proof photo ${i + 1}`"
          class="w-full aspect-square object-cover rounded-lg border border-gray-200 bg-gray-50"
        >
        <button
          type="button"
          :disabled="disabled"
          :aria-label="`Remove photo ${i + 1}`"
          class="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm text-gray-500 hover:text-red-600 hover:border-red-200 transition flex items-center justify-center"
          @click="remove(i)"
        >
          <i class="fas fa-xmark text-[11px]"></i>
        </button>
      </li>
    </ul>

    <p v-if="model.length" class="mt-2 text-[12px] text-gray-400">
      {{ model.length }} of {{ max }} · {{ totalLabel }}
    </p>

    <ul v-if="errors.length" class="mt-2 space-y-1">
      <li v-for="(message, i) in errors" :key="i" class="text-[12.5px] text-red-600">
        <i class="fas fa-circle-exclamation text-[11px] mr-1"></i>{{ message }}
      </li>
    </ul>
  </div>
</template>
