<template>
  <div class="w-full rounded-lg min-h-[4.375rem] overflow-hidden items-stretch select-none fixed z-10 w-full bottom-2 left-0 px-6 lg:relative lg:bottom-0 lg:px-0 hidden md:flex">
    <div class="w-full flex items-stretch select-none rounded-lg min-h-[4.375rem] overflow-hidden">
      <!-- Left Section: Price Display -->
      <div class="flex-1 bg-[rgba(12,17,29,0.50)] h-16 px-4 sm:px-6 py-3.5 rounded-l-lg flex items-baseline justify-center gap-1 shrink-0 mt-auto">
        <span class="text-xs sm:text-sm text-[#FCE40D] tracking-wider uppercase">
          {{ currency }}
        </span>
        <span class="text-2xl sm:text-3xl font-semibold text-[#FCE40D] tracking-tight leading-none">
          {{ priceNumber }}
        </span>
        <span v-if="oldPrice" class="text-sm sm:text-lg font-normal text-swhite line-through">
          {{ oldPriceFormatted }}
        </span>
      </div>

      <!-- Right Section: BUY NOW Action Button with Slanted Cutout -->
      <button
        @click="$emit('buy')"
        type="button"
        class="relative flex-1 bg-[#98A2B3] transition-all cursor-pointer flex items-center justify-center py-2 pr-4 pl-6 group"
        aria-label="Buy Now"
      >
      <span class="absolute left-[-1.5rem] top-0">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-auto h-full" width="24" height="72" viewBox="0 0 24 72" fill="none">
    <path d="M23.9525 72H14.0323H13.95H13.9607L23.9525 36H3.27564C1.84904 36 1.13454 36.0008 0.704446 35.6766C0.328997 35.3929 0.0783258 34.9532 0.011202 34.4637C-0.0655209 33.9027 0.25439 33.2106 0.893218 31.8305L14.8915 1.59258C15.0871 1.15817 15.2102 0.887062 15.3472 0.689062L15.4904 0.513281C15.6665 0.327007 15.8791 0.185456 16.112 0.0984375C16.3687 0.0028183 16.6599 7.52277e-05 17.2251 0H23.9525V72Z" fill="#98A2B3"/>
  </svg>
      </span>
        <span class="text-[#667085] text-base sm:text-xl font-bold leading-[30px] italic uppercase tracking-wider group-hover:scale-[1.02] transition-transform">
          {{ buttonText }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  price: {
    type: String,
    default: '25'
  },
  currency: {
    type: String,
    default: 'USD$'
  },
  oldPrice: {
    type: String,
    default: '$50'
  },
  buttonText: {
    type: String,
    default: 'BUY NOW'
  }
});

defineEmits(['buy']);

const priceNumber = computed(() => {
  if (!props.price) return '25';
  // Extract number if full string like "USD $25" is passed
  const match = props.price.match(/\d+/);
  return match ? match[0] : props.price;
});

const oldPriceFormatted = computed(() => {
  if (!props.oldPrice) return '';
  return props.oldPrice.startsWith('$') ? props.oldPrice : `$${props.oldPrice}`;
});
</script>

<style scoped>
/* Smooth rendering for clip-path */
button {
  -webkit-font-smoothing: antialiased;
}
</style>
