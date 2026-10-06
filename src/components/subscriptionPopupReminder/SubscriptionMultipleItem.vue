<template>
  <div class="subscription-multiple-item w-full flex flex-col gap-10 items-center">
    <!-- Header Title & Subtitle -->
    <div class="w-full flex flex-col gap-6 justify-start">
      <h3 class="text-white text-left text-xl font-semibold tracking-tight">
        You have unlocked exclusive merch from {{ modelName }} !
      </h3>
      <p class="text-white text-base font-medium text-left">
        Congrats on your subscriptions! Enjoy your member exclusive items below:
      </p>
    </div>

    <!-- CAROUSEL / SLIDER CONTAINER -->
    <div class="relative w-full flex items-center justify-center">
      <!-- Desktop Left Arrow Navigation Button -->
      <button
        v-if="items.length > 1"
        type="button"
        @click="prevSlide"
        class="hidden sm:flex absolute -left-5 z-20 w-10 h-10 rounded-full bg-slate-800/90 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white items-center justify-center transition-all cursor-pointer shadow-lg"
        aria-label="Previous Item"
      >
        <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
        </svg>
      </button>

      <!-- Cards Grid / Slider Body -->
      <div
        class="w-full overflow-hidden py-1 px-1"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <!-- Desktop Grid View (sm and larger) -->
        <div class="hidden sm:grid grid-cols-3 gap-4 w-full">
          <SubscriptionMerchCard
            v-for="(item, idx) in visibleDesktopItems"
            :key="item.id || idx"
            :item="item"
            @action-click="$emit('action-click', $event)"
          />
        </div>

        <!-- Mobile Slider View (smaller than sm) -->
        <div class="sm:hidden w-full flex flex-col items-center">
          <div class="w-full max-w-[280px]">
            <SubscriptionMerchCard
              v-if="activeItem"
              :item="activeItem"
              @action-click="$emit('action-click', $event)"
            />
          </div>

          <!-- Mobile Slider Pagination Dots Indicator (• • •) -->
          <div v-if="items.length > 1" class="flex items-center gap-2 mt-4">
            <button
              v-for="(_, index) in items"
              :key="index"
              type="button"
              @click="currentIndex = index"
              class="w-2.5 h-2.5 rounded-full transition-all cursor-pointer"
              :class="
                currentIndex === index
                  ? 'bg-[#ff0066] w-6 shadow-[0_0_8px_rgba(255,0,102,0.8)]'
                  : 'bg-slate-600 hover:bg-slate-400'
              "
              :aria-label="`Go to item ${index + 1}`"
            ></button>
          </div>
        </div>
      </div>

      <!-- Desktop Right Arrow Navigation Button -->
      <button
        v-if="items.length > 1"
        type="button"
        @click="nextSlide"
        class="hidden sm:flex absolute -right-5 z-20 w-10 h-10 rounded-full bg-slate-800/90 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white items-center justify-center transition-all cursor-pointer shadow-lg"
        aria-label="Next Item"
      >
        <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
        </svg>
      </button>
    </div>

    <!-- Below Slider Action Area -->
    <div class="flex flex-col items-center gap-[10px]">
      <!-- Claim Later Link -->
      <button
        type="button"
        @click="$emit('claim-later')"
        class="text-white text-base font-medium underline underline-offset-4 transition-colors cursor-pointer"
      >
        I will claim these merch later
      </button>

      <!-- Don't Show This Again Checkbox -->
      <label class="flex items-center gap-2 text-xs sm:text-sm text-slate-300 cursor-pointer select-none">
        <input
          type="checkbox"
          v-model="dontShowAgainState"
          @change="$emit('update:dontShowAgain', dontShowAgainState)"
          class="w-4 h-4 rounded bg-transparent border-transparent text-[#07f468] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#07f468]"
        />
        <span>Don't show this again</span>
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import SubscriptionMerchCard from './SubscriptionMerchCard.vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => [
      {
        id: 1,
        title: '原味內衣',
        price: 'USD$25',
        isFree: false,
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
        buttonText: 'BUY NOW',
        actionType: 'buy'
      },
      {
        id: 2,
        title: 'worn socks',
        price: 'FREE',
        isFree: true,
        image: 'https://images.unsplash.com/photo-1582966772680-860e372bb558?q=80&w=800&auto=format&fit=crop',
        buttonText: 'CLAIM NOW',
        actionType: 'claim'
      },
      {
        id: 3,
        title: '原味內衣',
        price: 'USD$25',
        isFree: false,
        image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop',
        buttonText: 'BUY NOW',
        actionType: 'buy'
      }
    ]
  },
  modelName: {
    type: String,
    default: '@model'
  },
  dontShowAgain: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['action-click', 'claim-later', 'update:dontShowAgain'])

const currentIndex = ref(0)
const dontShowAgainState = ref(props.dontShowAgain)

const activeItem = computed(() => {
  if (!props.items || props.items.length === 0) return null
  return props.items[currentIndex.value % props.items.length]
})

// For desktop grid: slice 3 items starting from currentIndex
const visibleDesktopItems = computed(() => {
  if (!props.items || props.items.length === 0) return []
  if (props.items.length <= 3) return props.items
  
  const result = []
  for (let i = 0; i < 3; i++) {
    const idx = (currentIndex.value + i) % props.items.length
    result.push(props.items[idx])
  }
  return result
})

const nextSlide = () => {
  if (props.items.length > 0) {
    currentIndex.value = (currentIndex.value + 1) % props.items.length
  }
}

const prevSlide = () => {
  if (props.items.length > 0) {
    currentIndex.value = (currentIndex.value - 1 + props.items.length) % props.items.length
  }
}

// Mobile touch swipe handling
let touchStartX = 0
let touchEndX = 0

const handleTouchStart = (e) => {
  touchStartX = e.changedTouches[0].screenX
}

const handleTouchMove = (e) => {
  touchEndX = e.changedTouches[0].screenX
}

const handleTouchEnd = () => {
  if (touchStartX - touchEndX > 50) {
    nextSlide()
  } else if (touchEndX - touchStartX > 50) {
    prevSlide()
  }
}
</script>

<style scoped>
.subscription-multiple-item {
  font-family: 'Poppins', 'Inter', sans-serif;
}
</style>
