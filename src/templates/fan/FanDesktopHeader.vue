<template>
  <div class="flex-grow">
    <!-- header-title-section -->
    <div class="flex items-center justify-between px-10 md:px-4 xl:px-10">
      <!-- title -->
      <div class="flex gap-2">
        <div class="flex">
          <h2
            class="text-2xl font-bold text-white uppercase drop-shadow-[0_0_0.5rem_rgba(0,0,0,0.5)]"
          >
            Trending Media
          </h2>
        </div>
      </div>

      <!-- right-button option -->
      <div class="flex justify-end items-center gap-4">
        <!-- add-to-list button -->
        <button
          class="hidden justify-center items-center bg-white/20 px-6 py-2 gap-1 backdrop-blur-[10px] rounded-3xl border border-[#e9e5d380]"
        >
          <span
            class="text-white font-medium uppercase text-xs leading-7 md:leading-[1.125rem] xl:text-lg"
            >Add To List</span
          >
        </button>

        <!-- favourite-button -->
        <div
          data-favourite-button
          class="flex justify-center items-center gap-1 bg-white/20 backdrop-blur-[10px] border-[0.5px] border-white rounded-full w-11 h-11 md:w-[2.125rem] md:h-[2.125rem] xl:w-11 xl:h-11 group hover:bg-[#07F468] [&.active]:bg-black/75 cursor-pointer"
        >
          <span class="relative">
            <img
              src="https://i.ibb.co.com/WpRRBpNk/heart.webp"
              alt="heart"
              class="w-6 h-6 filter brightness-0 invert md:w-[1.125rem] md:h-[1.125rem] xl:w-6 xl:h-6 group-hover:[filter:brightness(0)_saturate(100%)] group-[.active]:hidden"
            />
            <img
              src="https://i.ibb.co.com/8LXDVHfd/heart-filled.webp"
              alt="heart-filled"
              class="hidden w-6 h-6 filter brightness-0 invert md:w-[1.125rem] md:h-[1.125rem] xl:w-6 xl:h-6 group-[.active]:[filter:brightness(0)_saturate(100%)_invert(71%)_sepia(48%)_saturate(3539%)_hue-rotate(93deg)_brightness(109%)_contrast(95%)] group-[.active]:block"
            />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
