<template>
  <div
    @click="$emit('click')"
    class="w-full rounded-xl min-h-[4.375rem] overflow-hidden items-stretch select-none fixed z-30 bottom-2 left-0 right-0 px-4 flex md:hidden cursor-pointer"
  >
    <div class="w-full flex items-stretch select-none min-h-[4.375rem]">
      <!-- Left Section: Price Display & Lock Icon Badge -->
      <div class="relative rounded-l-[0.5rem] flex-1 bg-[rgba(12,17,29,0.85)] backdrop-blur-md h-16 px-3 py-3 flex items-center justify-center gap-2 shrink-0 my-auto">
        <!-- Pink Lock Icon Badge -->
        <div class="w-12 h-12 absolute -translate-y-1/2 top-1/2 left-[-1.4rem] flex items-center justify-center shrink-0">
          <img
            src="https://fansocial.app/wp-content/plugins/fansocial/assets/icons/lock-lg.png"
            alt="Lock"
            class="w-full h-full object-contain"
          />
        </div>

        <!-- Price Display -->
        <div class="flex items-baseline gap-1">
          <span class="text-xs text-[#FCE40D] tracking-wider uppercase">
            {{ currency }}
          </span>
          <span class="text-2xl font-semibold text-[#FCE40D] tracking-tight leading-none">
            {{ priceNumber }}
          </span>
          <span v-if="oldPrice" class="text-lg font-normal text-white line-through">
            {{ oldPriceFormatted }}
          </span>
        </div>
      </div>

      <!-- Right Section: SUBSCRIBE TO UNLOCK Action Button with Slanted Cutout -->
      <button
        type="button"
        class="relative flex-1 bg-[#F06] rounded-r-[0.5rem] transition-all cursor-pointer flex flex-col items-center justify-center py-2 pr-3 pl-6 group"
        aria-label="Subscribe to Unlock"
      >
        <!-- Slanted Cutout SVG -->
        <span class="absolute left-[-1.5rem] top-0 h-full pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="72" viewBox="0 0 24 72" fill="none">
  <path d="M23.9525 72H14.0323H13.95H13.9607L23.9525 36H3.27564C1.84904 36 1.13454 36.0008 0.704446 35.6766C0.328997 35.3929 0.0783258 34.9532 0.011202 34.4637C-0.0655209 33.9027 0.25439 33.2106 0.893218 31.8305L14.8915 1.59258C15.0871 1.15817 15.2102 0.887062 15.3472 0.689062L15.4904 0.513281C15.6665 0.327007 15.8791 0.185456 16.112 0.0984375C16.3687 0.0028183 16.6599 7.52277e-05 17.2251 0H23.9525V72Z" fill="#FF0066"/>
</svg>
        </span>

        <!-- Button Content: Title & Subtitle -->
        <span class="text-white text-sm font-bold italic uppercase tracking-wider leading-tight transition-transform whitespace-nowrap">
          {{ buttonText }}
        </span>
        <div class="flex items-center gap-1">
          <span v-if="startText" class="text-white text-xs font-normal leading-tight">
            {{ startText }}
          </span>
          <span v-if="startTextPrice" class="text-white text-xs font-semibold leading-tight">
            {{ startTextPrice }}
          </span>
        </div>
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
    default: 'SUBSCRIBE TO UNLOCK'
  },
  startText: {
    type: String,
    default: 'starting'
  },
  startTextPrice: {
    type: String,
    default: 'USD$29.9/mo'
  }
});

defineEmits(['click', 'buy']);

const priceNumber = computed(() => {
  if (!props.price) return '25';
  const match = props.price.match(/\d+/);
  return match ? match[0] : props.price;
});

const oldPriceFormatted = computed(() => {
  if (!props.oldPrice) return '';
  return props.oldPrice.startsWith('$') ? props.oldPrice : `$${props.oldPrice}`;
});
</script>

<style scoped>
button {
  -webkit-font-smoothing: antialiased;
}
</style>
