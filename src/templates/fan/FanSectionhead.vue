<template>
  <div
    class="flex justify-between items-end gap-2.5 w-full"
  >
    <!-- Left Content -->
    <div class="flex flex-col gap-2 flex-grow">
      <div class="flex items-center gap-2">
        <span class="w-[1.375rem] h-[1.375rem]">
          <img
            :src="icon"
            :alt="title"
            class="w-[1.375rem] h-[1.375rem] dark:[filter:brightness(0)_saturate(100%)_invert(100%)]"
          />
        </span>

        <h2
          class="text-[#344054] dark:text-[#bdb8af] text-xl leading-normal font-bold uppercase md:text-2xl"
        >
          {{ title }}
        </h2>
      </div>

      <p class="text-base font-medium dark:text-[#bdb8af] text-[#667085] md:text-lg">
        {{ description }}
      </p>
    </div>

    <!-- Carousel Arrows -->
    <div
      class="splide__arrows hidden xl:flex items-center justify-end gap-4"
      v-if="showArrows"
    >
      <button
        class="splide__arrow splide__arrow--prev static flex items-center justify-center p-2 w-auto h-auto transform-none [background:unset] bg-white/15 [border:1px_solid_rgba(0,0,0,0.5)] rounded-full backdrop-blur-[10px] [&:disabled]:opacity-50 [&:disabled]:cursor-not-allowed hover:bg-black/10"
        aria-label="Previous slide"
      >
        <img
          src="https://i.ibb.co.com/TBbShkb8/chevron-right.png"
          alt="chevron-left"
          class="w-8 min-w-8 h-8 min-h-8 rotate-180"
        />
      </button>
      <button
        class="splide__arrow splide__arrow--next static flex items-center justify-center p-2 w-auto h-auto transform-none [background:unset] bg-white/15 [border:1px_solid_rgba(0,0,0,0.5)] rounded-full backdrop-blur-[10px] [&:disabled]:opacity-50 [&:disabled]:cursor-not-allowed hover:bg-black/10"
        aria-label="Next slide"
      >
        <img
          src="https://i.ibb.co.com/TBbShkb8/chevron-right.png"
          alt="chevron-right"
          class="w-8 min-w-8 h-8 min-h-8"
        />
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  showArrows: {
    type: Boolean,
    default: true,
  },
});
</script>
