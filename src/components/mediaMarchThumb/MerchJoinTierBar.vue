<template>
  <div
    @click="$emit('join')"
    class="w-full rounded-xl bg-[#0C111D] overflow-hidden flex items-stretch cursor-pointer group select-none transition-all active:scale-[0.99]"
  >
    <!-- Left Section: Bright Pink Tier Join Banner with Notch Cutout -->
    <div
      class="relative flex-1 bg-[#F06] transition-all py-3 sm:py-3.5 px-4 sm:px-6 flex flex-col items-center justify-center text-center -mr-6 z-10"
    >

    <span class="absolute right-[-1.5rem] top-0 h-full">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-full w-auto" width="24" height="72" viewBox="0 0 24 72" fill="none">
        <path d="M-1.90735e-05 72H9.92021H10.0025H9.99181L-1.90735e-05 36H20.6769C22.1035 36 22.818 36.0008 23.2481 35.6766C23.6235 35.3929 23.8742 34.9532 23.9413 34.4637C24.018 33.9027 23.6981 33.2106 23.0593 31.8305L9.06098 1.59258C8.8654 1.15817 8.74227 0.887062 8.60532 0.689062L8.46212 0.513281C8.28601 0.327007 8.07341 0.185456 7.84048 0.0984375C7.58383 0.0028183 7.29266 7.52277e-05 6.72738 0H-1.90735e-05V72Z" fill="#FF0066"/>
      </svg>
    </span>
      <!-- Top Row: JOIN + Icon + Tier Name -->
      <div class="flex items-center justify-center gap-1.5">
        <span class="text-white text-base sm:text-xl font-extrabold italic tracking-wide uppercase">
          JOIN
        </span>
        <span class="text-base sm:text-lg">{{ tierIcon }}</span>
        <span class="text-white text-base sm:text-xl font-extrabold italic tracking-wide line-clamp-1">
          {{ formattedTierName }}
        </span>
      </div>

      <!-- Bottom Row: Subtext with Starting Price -->
      <div class="flex items-center justify-center gap-1 mt-0.5 text-sm text-white">
        <span class="font-normal opacity-90">starting</span>
        <span class="font-semibold">{{ formattedPrice }}</span>
      </div>
    </div>

    <!-- Right Section: Dark Action Box with Pink Arrow -->
    <div class="w-[8rem] bg-[#0b101d] flex items-center justify-end pr-7 sm:pr-7 shrink-0 z-0">
      <div class="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-[#FF0066] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M9.33331 22.6668L22.6666 9.3335M22.6666 22.6668V9.3335H9.33331" stroke="#FF0066" stroke-width="2.66667" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  tier: {
    type: String,
    default: 'Tier 1 – "Close Circle"'
  },
  tierIcon: {
    type: String,
    default: '🌸'
  },
  priceText: {
    type: String,
    default: 'USD$29.9/mo'
  }
});

defineEmits(['join']);

const formattedTierName = computed(() => {
  if (!props.tier) return 'Tier 1 – "Close Circle"';
  // Strip any leading emojis if already present
  return props.tier.replace(/^[🔒🔓🌸💫⭐]\s*/, '');
});

const formattedPrice = computed(() => {
  if (!props.priceText) return 'USD$29.9/mo';
  if (props.priceText.includes('/mo')) return props.priceText;
  return `${props.priceText}/mo`;
});
</script>

<style scoped>
div[style*="clip-path"] {
  -webkit-font-smoothing: antialiased;
}
</style>
