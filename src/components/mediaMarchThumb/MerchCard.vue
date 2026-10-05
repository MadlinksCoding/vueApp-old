<template>
  <!-- Skeleton Loader Card -->
  <div
    v-if="skeleton"
    class="flex flex-col rounded-lg bg-[rgba(234,236,240,0.50)] overflow-hidden animate-pulse w-full"
  >
    <div class="w-full aspect-square bg-[#222e40] relative p-2 flex justify-between">
    </div>
  </div>

  <!-- Live Merch Card -->
  <article
    v-else
    @click="$emit('select', item)"
    class="group relative flex flex-col justify-between rounded-lg bg-[#182230] transition-all duration-200 overflow-hidden cursor-pointer w-full"
  >

    <!-- Overlay -->
    <div
      class="absolute inset-0 w-full h-full rounded-lg bg-[linear-gradient(180deg,rgba(0,0,0,0)_0.01%,rgba(0,0,0,0.50)_90%)] z-10"
    ></div>

    <!-- Top Overlay Badges -->
    <div class="absolute top-3 left-3 right-3 flex items-start justify-between gap-1 pointer-events-none z-30">
      <div class="flex flex-wrap items-center gap-1">
        <span
          v-if="item.badgePreorder"
          class="rounded bg-[#07F468] backdrop-blur-[10px] text-[#0C111D] text-xs leading-[18px] font-semibold px-1.5 py-0.5 uppercase tracking-wider"
        >
          Pre order
        </span>
        <span
          v-if="item.badgeLeft"
          class="rounded bg-[rgba(242,244,247,0.90)] backdrop-blur-[10px] text-[#F06] text-xs leading-[18px] font-semibold px-1.5 py-0.5 uppercase tracking-wider shadow"
        >
          {{ item.badgeLeft }}
        </span>
      </div>
    </div>

    <!-- Merch Image Container -->
    <div class="w-full aspect-square relative bg-slate-900 overflow-hidden">
      <!-- Background Image -->
        <div class="absolute inset-0 bg-cover bg-center bg-no-repeat" :style="{ backgroundImage: `url(${item.image})` }">
        </div>
        <!-- Blur Overlay -->
        <div class="w-full h-full backdrop-blur-[24px] absolute inset-0 z-10"></div>
      <div class="w-full h-full relative z-20">
        <img
        :src="item.image"
        :alt="item.title"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        @load="onImageLoad"
      />
      </div>
    </div>

    <!-- Bottom Content: Title, Price, Buy Now button -->
    <div class="w-full absolute bottom-0 left-0 z-30 flex flex-col gap-0">
      <!-- Title & Price Content -->
      <div class="p-2.5 pb-4 sm:px-3 sm:pt-3 sm:pb-2 flex flex-col gap-2 flex-1 justify-between">
        <h3 class="text-[#F5F5F4] text-xs sm:text-sm font-semibold line-clamp-1 leading-snug" :title="item.title">
          {{ item.title }}
        </h3>

        <!-- Price & Lightning Discount Row -->
        <div class="flex items-center justify-between flex-wrap gap-1">
          <div class="flex items-baseline gap-1">
            <span
              class="font-semibold text-xs sm:text-lg"
              :class="item.price === 'FREE' ? 'text-[#FCE40D]' : 'text-[#FFD901]'"
            >
              {{ item.price }}
            </span>
            <span v-if="item.oldPrice" class="text-white line-through text-xs font-normal">
              {{ item.oldPrice }}
            </span>
          </div>

          <span
            v-if="item.discount"
            class="bg-black/80 text-[#FCE40D] text-xs font-semibold pl-3 backdrop-blur-md pr-1.5 py-0.5 rounded-sm flex items-center gap-0.5 shadow-sm"
          >
            <span class="absolute -left-2 top-1/2 -translate-y-1/2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
  <path d="M11.8746 1.66667H7.07829C6.92873 1.66667 6.85395 1.66667 6.78792 1.68944C6.72954 1.70958 6.67636 1.74245 6.63224 1.78566C6.58234 1.83453 6.5489 1.90142 6.48201 2.0352L2.98201 9.03519C2.82228 9.35466 2.74241 9.5144 2.76159 9.64424C2.77834 9.75762 2.84106 9.85909 2.93498 9.92478C3.04253 10 3.22112 10 3.57829 10H8.7496L6.2496 18.3333L16.4105 7.79609C16.7533 7.44059 16.9247 7.26284 16.9348 7.11074C16.9435 6.97872 16.8889 6.85041 16.7879 6.76503C16.6714 6.66667 16.4245 6.66667 15.9306 6.66667H9.9996L11.8746 1.66667Z" fill="url(#paint0_linear_4078_4661)"/>
  <path d="M11.8746 1.66667H7.07829C6.92873 1.66667 6.85395 1.66667 6.78792 1.68944C6.72954 1.70958 6.67636 1.74245 6.63224 1.78566C6.58234 1.83453 6.5489 1.90142 6.48201 2.0352L2.98201 9.03519C2.82228 9.35466 2.74241 9.5144 2.76159 9.64424C2.77834 9.75762 2.84106 9.85909 2.93498 9.92478C3.04253 10 3.22112 10 3.57829 10H8.7496L6.2496 18.3333L16.4105 7.79609C16.7533 7.44059 16.9247 7.26284 16.9348 7.11074C16.9435 6.97872 16.8889 6.85041 16.7879 6.76503C16.6714 6.66667 16.4245 6.66667 15.9306 6.66667H9.9996L11.8746 1.66667Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M11.8746 1.66667H7.07829C6.92873 1.66667 6.85395 1.66667 6.78792 1.68944C6.72954 1.70958 6.67636 1.74245 6.63224 1.78566C6.58234 1.83453 6.5489 1.90142 6.48201 2.0352L2.98201 9.03519C2.82228 9.35466 2.74241 9.5144 2.76159 9.64424C2.77834 9.75762 2.84106 9.85909 2.93498 9.92478C3.04253 10 3.22112 10 3.57829 10H8.7496L6.2496 18.3333L16.4105 7.79609C16.7533 7.44059 16.9247 7.26284 16.9348 7.11074C16.9435 6.97872 16.8889 6.85041 16.7879 6.76503C16.6714 6.66667 16.4245 6.66667 15.9306 6.66667H9.9996L11.8746 1.66667Z" stroke="url(#paint1_linear_4078_4661)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <defs>
    <linearGradient id="paint0_linear_4078_4661" x1="9.84722" y1="1.66667" x2="9.84722" y2="18.3333" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FDB440"/>
      <stop offset="1" stop-color="#FF8C27"/>
    </linearGradient>
    <linearGradient id="paint1_linear_4078_4661" x1="9.84722" y1="1.66667" x2="9.84722" y2="18.3333" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FDB440"/>
      <stop offset="1" stop-color="#FF8C27"/>
    </linearGradient>
  </defs>
</svg>
            </span> {{ item.discount }}
          </span>
        </div>
      </div>

      <!-- Bottom Tier Restriction Banner -->
      <div
        class="w-full px-2 text-xs font-semibold leading-[18px] min-h-7 text-center flex items-center justify-center gap-1 tracking-wider uppercase truncate rounded-b-lg bg-[rgba(255,0,102,0.65)] backdrop-blur-[5px]"
      >
        <div class="flex flex-col">
          <div class="flex items-center gap-1">
            <span>{{ item.tierType === 'free' ? '💫' : (item.tierType === 'tier-2' ? '🔥' : '🌸') }}</span>
            <span class="truncate">{{ item.tier }}</span>
          </div>
        </div>
      </div>
    </div>
    
  </article>
</template>

<script setup>
defineProps({
  item: {
    type: Object,
    default: () => ({})
  },
  skeleton: {
    type: Boolean,
    default: false
  }
});

defineEmits(['select']);

const onImageLoad = (e) => {
  const img = e.target;
  if (img && img.naturalWidth && img.naturalHeight) {
    if (img.naturalHeight > img.naturalWidth) {
      img.classList.remove('object-cover');
      img.classList.add('object-contain');
    } else {
      img.classList.remove('object-contain');
      img.classList.add('object-cover');
    }
  }
};
</script>
