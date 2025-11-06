<template>
  <div class="p-8 space-y-6">
    <h1 class="text-2xl font-bold">PopupHandler — 30 Variations Demo</h1>
    <p class="text-gray-600">
      Complete showcase of all PopupHandler variations including animations, slide-ins, overlays,
      positions, responsiveness, and multiple visual themes.
    </p>

    <!-- Buttons Grid -->
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <button
        v-for="test in tests"
        :key="test.id"
        @click="openPopup(test)"
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition text-sm"
      >
        {{ test.label }}
      </button>
    </div>

    <!-- Popup -->
    <PopupHandler
      :modelValue="showPopup"
      @update:modelValue="val => showPopup = val"
      :config="activeTest?.config"
    >
      <div
       :class="[
          ' p-6 ',
          activeTest?.id <= 20 ? 'bg-white' : ''
        ]"
      >
        <h2 class="text-xl font-semibold mb-3">
          {{ activeTest?.title }}
        </h2>

        <p class="text-gray-700 leading-relaxed mb-4">
          {{ activeTest?.description }}
        </p>

        <div
          class="text-xs text-slate-700 bg-slate-50 p-3 rounded border border-slate-200 font-mono whitespace-pre-wrap overflow-auto max-h-60"
        >
          <div class="font-semibold mb-1 text-slate-900">
            Configuration:
          </div>
          <pre>{{ formatConfig(activeTest?.config) }}</pre>
        </div>

        <div class="flex justify-end mt-5">
          <button
            class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition"
            @click="showPopup = false"
          >
            Close
          </button>
        </div>
      </div>
    </PopupHandler>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import PopupHandler from '../ui/popup/PopupHandler.vue'

const showPopup = ref(false)
const activeTest = ref(null)

const formatConfig = (config) => {
  try {
    return JSON.stringify(config, null, 2)
  } catch {
    return 'Invalid Config'
  }
}

const tests = [
  // === Functional / Effect Variations (1–20) ===
  { id: 1, label: 'Fade Center', title: 'Fade Center', description: 'Simple fade-in popup.', config: { customEffect: 'fade',  scrollable: true } },
  { id: 2, label: 'Scale Center', title: 'Scale Center', description: 'Popup opens with scale effect.', config: { customEffect: 'scale' } },
  { id: 3, label: 'Slide Top', title: 'Slide Top', description: 'Slides from top.', config: { actionType: 'slidein', from: 'top' , height:'100%'} },
  { id: 4, label: 'Slide Bottom', title: 'Slide Bottom', description: 'Slides from bottom.', config: { actionType: 'slidein', from: 'bottom', height:'100%' } },
  { id: 5, label: 'Slide Left', title: 'Slide Left', description: 'Slides from left.', config: { actionType: 'slidein', from: 'left' } },
  { id: 6, label: 'Slide Right', title: 'Slide Right', description: 'Slides from right.', config: { actionType: 'slidein', from: 'right' } },
  { id: 7, label: 'Instant Close', title: 'Instant Close', description: 'No close animation.', config: { effect: 'instant' } },
  { id: 8, label: 'No Overlay', title: 'No Overlay', description: 'Overlay disabled.', config: { showOverlay: false } },
  { id: 9, label: 'Persistent', title: 'Persistent', description: 'No outside close.', config: { closeOnOutside: false } },
  { id: 10, label: 'ESC Disabled', title: 'ESC Disabled', description: 'Escape key disabled.', config: { escToClose: false } },
  { id: 11, label: 'Top Center', title: 'Top Center', description: 'Positioned at top.', config: { position: 'top-center' } },
  { id: 12, label: 'Full Screen', title: 'Full Screen', description: 'Takes full window.', config: { width: '100%', height: '100%', position: 'full' } },
  { id: 13, label: 'Scrollable', title: 'Scrollable', description: 'Scrollable content.', config: { scrollable: true, height: '400px' } },
  { id: 14, label: 'Responsive Width', title: 'Responsive Width', description: 'Changes width per device.', config: { width: { '<640': '95vw', default: '520px' } } },
  { id: 15, label: 'Fast Transition', title: 'Fast Transition', description: 'Fast fade 150ms.', config: { speed: '150ms', customEffect: 'fade' } },
  { id: 16, label: 'Slow Transition', title: 'Slow Transition', description: 'Slow scale 600ms.', config: { speed: '600ms', customEffect: 'scale' } },
  { id: 17, label: 'Slide Top Fade', title: 'Slide Top Fade', description: 'Top fade hybrid.', config: { customEffect: 'slideTopFade' } },
  { id: 18, label: 'Slide Full Right', title: 'Slide Full Right', description: 'Full-screen slide-in.', config: { actionType: 'slidein', from: 'right', width: '100%', height: '100%' } },
  { id: 19, label: 'Overlay Blur', title: 'Overlay Blur', description: 'Blurred overlay background.', config: { overlayClass: 'backdrop-blur-md bg-black/40' } },
  { id: 20, label: 'Instant Open', title: 'Instant Open', description: 'No open transition.', config: { speed: '0ms' } },

  // === Themed / Visual Variations (21–30) ===
  { id: 21, label: 'Dark Theme', title: 'Dark Mode', description: 'Dark background & light text.', config: { customClass: 'bg-gray-900 text-gray-100 border border-gray-700 shadow-lg' } },
  { id: 22, label: 'Light Theme', title: 'Light Mode', description: 'Bright clean look.', config: { customClass: 'bg-white text-gray-800 shadow-md border border-gray-200' } },
  { id: 23, label: 'Glass Theme', title: 'Glassmorphic', description: 'Frosted glass effect.', config: { customClass: 'bg-white/30 backdrop-blur-xl shadow-xl' } },
  { id: 24, label: 'Gradient Blue', title: 'Gradient Blue', description: 'Blue gradient background.', config: { customClass: 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg' } },
  { id: 25, label: 'Gradient Sunset', title: 'Gradient Sunset', description: 'Orange-pink gradient.', config: { customClass: 'bg-gradient-to-tr from-orange-400 via-pink-500 to-red-500 text-white' } },
  { id: 26, label: 'Bordered', title: 'Bordered Style', description: 'Bordered popup for minimal design.', config: { customClass: 'border-2 border-blue-400 shadow-sm' } },
  { id: 27, label: 'Shadow Heavy', title: 'Deep Shadow', description: 'Strong drop shadow.', config: { customClass: 'shadow-2xl bg-white' } },
  { id: 28, label: 'Rounded XL', title: 'Rounded Corners', description: 'Large round corners.', config: { customClass: 'rounded-3xl bg-white shadow-md' } },
  { id: 29, label: 'Card Style', title: 'Card Theme', description: 'Card-like white popup.', config: { customClass: 'bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.08)] rounded-xl' } },
  { id: 30, label: 'Neon Glow', title: 'Neon Glow Popup', description: 'Bright neon shadow effect.', config: { customClass: 'bg-black text-green-400 shadow-[0_0_15px_#39ff14]' } }
]

const openPopup = (test) => {
  activeTest.value = test
  showPopup.value = true
}
</script>

<style scoped>
button {
  transition: all 0.2s ease;
}
</style>
