<script setup lang="ts">
import FanSectionhead from './FanSectionhead.vue';

</script>

<template>
  <div class="flex flex-col gap-4 pt-6 md:hidden">
    <!-- section-heading -->
    <div
      class="flex justify-between items-end gap-2.5 w-full px-2 md:px-4 xl:px-10"
    >
      <div class="flex items-center gap-2">
        <FanSectionhead
         title=" TRENDING MEDIA"
         icon="https://i.ibb.co.com/SDJ2tFyW/line-chart-up.webp"
        />
        <!-- view-all -->
        <div class="flex gap-[0.3125rem] py-1 px-2 cursor-pointer">
          <span class="text-sm font-medium align-middle text-[#2970FF] w-max"
            >View All</span
          >
          <span
            class="text-[0.625rem] leading-normal tracking-[0.016rem] text-[#2970FF]"
            >234</span
          >
        </div>
      </div>
    </div>

    <!-- slider-container -->
   

    <Splide
    id="splide04"
    :options="{
       type: 'loop',
      fixedWidth: '340px',
      perMove: 1,
      focus: 'center',
      pagination: false,
      arrows: false,
      gap: '8px',
      breakpoints: {
        480: {
          fixedWidth: '296px',
        },
      },
    }"
  >
    <!-- === Slide 1 === -->
    <SplideSlide>
      <div
        class="w-full h-[18.75rem] group-[.is-active]:h-[19.625rem] rounded-md overflow-hidden shadow-[0px_0px_5px_0px_#00000040] bg-cover bg-center bg-no-repeat relative"
        style="background-image: url('https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp')"
      >
        <div
                class="flex flex-col justify-between w-full h-full [background:linear-gradient(360deg,rgba(0,0,0,0)_90%,rgba(0,0,0,0.3)_100%)]"
              >
                <!-- card-blur -->
                <div
                  class="flex absolute bottom-0 left-0 w-full h-[60%] bg-cover [background-position:center_bottom] z-20 pointer-events-none backdrop-blur-[50px] [-webkit-backdrop-filter:blur(50px)] [-moz-backdrop-filter:blur(50px)] [mask-image:linear-gradient(to_top,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_30%,rgba(0,0,0,1)_50%,rgba(0,0,0,0.2)_70%,rgba(0,0,0,0)_100%)] [-webkit-mask-image:linear-gradient(to_top,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_30%,rgba(0,0,0,1)_50%,rgba(0,0,0,0.2)_70%,rgba(0,0,0,0)_100%)]"
                ></div>

                <!-- card-top -->
                <div class="pt-2 px-2">
                  <!-- info-container -->
                  <div class="flex justify-between w-full">
                    <!-- stats-container -->
                    <div
                      class="flex items-center gap-3 drop-shadow-[0p_0px_5.22px_0px_#000000B2]"
                    >
                      <!-- likes -->
                      <div
                        class="flex items-center gap-1 drop-shadow-[0_0_0.5rem_rgba(0,0,0,0.5)]"
                      >
                        <span class="flex items-center">
                          <img
                            src="https://i.ibb.co.com/TxjJbTw6/Likes-icon.webp"
                            alt="heart"
                            class="w-3.5 h-3.5"
                          />
                        </span>
                        <span class="text-sm font-light text-[#f9fafb]"
                          >99K</span
                        >
                      </div>

                      <!-- views -->
                      <div
                        class="flex items-center gap-1 drop-shadow-[0_0_0.5rem_rgba(0,0,0,0.5)]"
                      >
                        <span class="flex items-center">
                          <img
                            src="https://i.ibb.co.com/MyBLLQHz/Views-icon.webp"
                            alt="eye"
                            class="w-3.5 h-3.5 align-bottom"
                          />
                        </span>
                        <span class="text-sm font-light text-[#f9fafb]"
                          >15.2k</span
                        >
                      </div>
                    </div>

                    <!-- action-container -->
                    <div
                      class="flex items-center gap-2 drop-shadow-[0p_0px_5.22px_0px_#000000B2]"
                    >
                      <div
                        class="flex justify-center items-center w-8 h-8 rounded-full bg-black/10 border-[0.5px] border-[#E9E5D380] group cursor-pointer"
                      >
                        <img
                          src="https://i.ibb.co.com/0ykc4SMS/icon.webp"
                          alt="cart"
                          class="w-4"
                        />
                      </div>

                      <!-- favourite-button -->
                      <div
                        data-favourite-button
                        class="flex justify-center items-center w-8 h-8 rounded-full bg-black/10 border-[0.5px] border-[#E9E5D380] group/icon hover:bg-[#07F468] [&.active]:bg-black/75 cursor-pointer"
                      >
                        <span class="relative">
                          <img
                            src="https://i.ibb.co.com/WpRRBpNk/heart.webp"
                            alt="heart"
                            class="w-4 filter brightness-0 opacity-90 invert [filter:brightness(0)_saturate(100%)_invert(97%)_sepia(12%)_saturate(351%)_hue-rotate(337deg)_brightness(95%)_contrast(92%)] group-hover/icon:[filter:brightness(0)_saturate(100%)] group-[.active]/icon:hidden"
                          />
                          <img
                            src="https://i.ibb.co.com/8LXDVHfd/heart-filled.webp"
                            alt="heart-filled"
                            class="hidden w-4 filter brightness-0 invert group-[.active]/icon:[filter:brightness(0)_saturate(100%)_invert(71%)_sepia(48%)_saturate(3539%)_hue-rotate(93deg)_brightness(109%)_contrast(95%)] group-[.active]/icon:block"
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- card-details -->
                <div
                  class="flex flex-col justify-between pt-4 pb-2 px-2 z-[30]"
                >
                  <div
                    class="flex flex-col gap-2 drop-shadow-[0px_0px_5px_0px_#000000B2]"
                  >
                    <!-- title-container -->
                    <div class="flex flex-col gap-1">
                      <!-- tags-container -->
                      <div class="flex items-center gap-1.5 pl-2">
                        <!-- hot tag -->
                        <div
                          class="flex justify-center items-center relative pr-2 backdrop-blur-[10px] rounded py-0.5 bg-[linear-gradient(90deg,#f06_0%,#ff4a92_100%)] pl-4"
                        >
                          <span
                            class="absolute drop-shadow-[0_0_.313rem_#000] left-[-0.6rem] top-[-0.6rem]"
                          >
                            <img
                              src="https://i.ibb.co.com/TBHLK0Vy/hot-fire.webp"
                              alt="hot-fire"
                              class="w-[1.375rem] h-8"
                            />
                          </span>

                          <span
                            class="text-xs leading-normal font-semibold uppercase text-white"
                            >HOTTT</span
                          >
                        </div>

                        <div
                          class="flex justify-center items-center rounded px-2 py-0.5 bg-white"
                        >
                          <span
                            class="text-xs leading-normal font-semibold text-[#1B45FF]"
                            >10% off</span
                          >
                        </div>
                      </div>

                      <h2 class="text-2xl font-semibold text-white">
                        Jenny + Mini special Live
                      </h2>
                    </div>

                    <!-- description-container -->
                    <div>
                      <p
                        class="text-xs leading-normal font-medium text-white line-clamp-2"
                      >
                        Lorem Ipsum I hate the color orange so much I have to
                        close my eyes while I eat them Lorem Ipsum I hate the
                        color orange so much I have to close my eyes while I eat
                        them
                      </p>
                    </div>
                  </div>
                </div>
              </div>
      </div>
    </SplideSlide>

    <!-- === Slide 2 === -->
    <SplideSlide>
      <div
        class="w-full h-[18.75rem] rounded-md overflow-hidden shadow-[0px_0px_5px_0px_#00000040] bg-cover bg-center bg-no-repeat relative"
        style="background-image: url('https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp')"
      >
         <div
                class="flex flex-col justify-between w-full h-full [background:linear-gradient(360deg,rgba(0,0,0,0)_90%,rgba(0,0,0,0.3)_100%)]"
              >
                <!-- card-blur -->
                <div
                  class="flex absolute bottom-0 left-0 w-full h-[60%] bg-cover [background-position:center_bottom] z-20 pointer-events-none backdrop-blur-[50px] [-webkit-backdrop-filter:blur(50px)] [-moz-backdrop-filter:blur(50px)] [mask-image:linear-gradient(to_top,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_30%,rgba(0,0,0,1)_50%,rgba(0,0,0,0.2)_70%,rgba(0,0,0,0)_100%)] [-webkit-mask-image:linear-gradient(to_top,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_30%,rgba(0,0,0,1)_50%,rgba(0,0,0,0.2)_70%,rgba(0,0,0,0)_100%)]"
                ></div>

                <!-- card-top -->
                <div class="pt-2 px-2">
                  <!-- info-container -->
                  <div class="flex justify-between w-full">
                    <!-- stats-container -->
                    <div
                      class="flex items-center gap-3 drop-shadow-[0p_0px_5.22px_0px_#000000B2]"
                    >
                      <!-- likes -->
                      <div
                        class="flex items-center gap-1 drop-shadow-[0_0_0.5rem_rgba(0,0,0,0.5)]"
                      >
                        <span class="flex items-center">
                          <img
                            src="https://i.ibb.co.com/TxjJbTw6/Likes-icon.webp"
                            alt="heart"
                            class="w-3.5 h-3.5"
                          />
                        </span>
                        <span class="text-sm font-light text-[#f9fafb]"
                          >99K</span
                        >
                      </div>

                      <!-- views -->
                      <div
                        class="flex items-center gap-1 drop-shadow-[0_0_0.5rem_rgba(0,0,0,0.5)]"
                      >
                        <span class="flex items-center">
                          <img
                            src="https://i.ibb.co.com/MyBLLQHz/Views-icon.webp"
                            alt="eye"
                            class="w-3.5 h-3.5 align-bottom"
                          />
                        </span>
                        <span class="text-sm font-light text-[#f9fafb]"
                          >15.2k</span
                        >
                      </div>
                    </div>

                    <!-- action-container -->
                    <div
                      class="flex items-center gap-2 drop-shadow-[0p_0px_5.22px_0px_#000000B2]"
                    >
                      <div
                        class="flex justify-center items-center w-8 h-8 rounded-full bg-black/10 border-[0.5px] border-[#E9E5D380] group cursor-pointer"
                      >
                        <img
                          src="https://i.ibb.co.com/0ykc4SMS/icon.webp"
                          alt="cart"
                          class="w-4"
                        />
                      </div>

                      <!-- favourite-button -->
                      <div
                        data-favourite-button
                        class="flex justify-center items-center w-8 h-8 rounded-full bg-black/10 border-[0.5px] border-[#E9E5D380] group/icon hover:bg-[#07F468] [&.active]:bg-black/75 cursor-pointer"
                      >
                        <span class="relative">
                          <img
                            src="https://i.ibb.co.com/WpRRBpNk/heart.webp"
                            alt="heart"
                            class="w-4 filter brightness-0 opacity-90 invert [filter:brightness(0)_saturate(100%)_invert(97%)_sepia(12%)_saturate(351%)_hue-rotate(337deg)_brightness(95%)_contrast(92%)] group-hover/icon:[filter:brightness(0)_saturate(100%)] group-[.active]/icon:hidden"
                          />
                          <img
                            src="https://i.ibb.co.com/8LXDVHfd/heart-filled.webp"
                            alt="heart-filled"
                            class="hidden w-4 filter brightness-0 invert group-[.active]/icon:[filter:brightness(0)_saturate(100%)_invert(71%)_sepia(48%)_saturate(3539%)_hue-rotate(93deg)_brightness(109%)_contrast(95%)] group-[.active]/icon:block"
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- card-details -->
                <div
                  class="flex flex-col justify-between pt-4 pb-2 px-2 z-[30]"
                >
                  <div
                    class="flex flex-col gap-2 drop-shadow-[0px_0px_5px_0px_#000000B2]"
                  >
                    <!-- title-container -->
                    <div class="flex flex-col gap-1">
                      <!-- tags-container -->
                      <div class="flex items-center gap-1.5 pl-2">
                        <!-- hot tag -->
                        <div
                          class="flex justify-center items-center relative pr-2 backdrop-blur-[10px] rounded py-0.5 bg-[linear-gradient(90deg,#f06_0%,#ff4a92_100%)] pl-4"
                        >
                          <span
                            class="absolute drop-shadow-[0_0_.313rem_#000] left-[-0.6rem] top-[-0.6rem]"
                          >
                            <img
                              src="https://i.ibb.co.com/TBHLK0Vy/hot-fire.webp"
                              alt="hot-fire"
                              class="w-[1.375rem] h-8"
                            />
                          </span>

                          <span
                            class="text-xs leading-normal font-semibold uppercase text-white"
                            >HOTTT</span
                          >
                        </div>

                        <div
                          class="flex justify-center items-center rounded px-2 py-0.5 bg-white"
                        >
                          <span
                            class="text-xs leading-normal font-semibold text-[#1B45FF]"
                            >10% off</span
                          >
                        </div>
                      </div>

                      <h2 class="text-2xl font-semibold text-white">
                        Jenny + Mini special Live
                      </h2>
                    </div>

                    <!-- description-container -->
                    <div>
                      <p
                        class="text-xs leading-normal font-medium text-white line-clamp-2"
                      >
                        Lorem Ipsum I hate the color orange so much I have to
                        close my eyes while I eat them Lorem Ipsum I hate the
                        color orange so much I have to close my eyes while I eat
                        them
                      </p>
                    </div>
                  </div>
                </div>
              </div>
      </div>
    </SplideSlide>

    <!-- === Slide 3 === -->
    <SplideSlide>
      <div
        class="w-full h-[18.75rem] rounded-md overflow-hidden shadow-[0px_0px_5px_0px_#00000040] bg-cover bg-center bg-no-repeat relative"
        style="background-image: url('https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp')"
      >
       <div
                class="flex flex-col justify-between w-full h-full [background:linear-gradient(360deg,rgba(0,0,0,0)_90%,rgba(0,0,0,0.3)_100%)]"
              >
                <!-- card-blur -->
                <div
                  class="flex absolute bottom-0 left-0 w-full h-[60%] bg-cover [background-position:center_bottom] z-20 pointer-events-none backdrop-blur-[50px] [-webkit-backdrop-filter:blur(50px)] [-moz-backdrop-filter:blur(50px)] [mask-image:linear-gradient(to_top,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_30%,rgba(0,0,0,1)_50%,rgba(0,0,0,0.2)_70%,rgba(0,0,0,0)_100%)] [-webkit-mask-image:linear-gradient(to_top,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_30%,rgba(0,0,0,1)_50%,rgba(0,0,0,0.2)_70%,rgba(0,0,0,0)_100%)]"
                ></div>

                <!-- card-top -->
                <div class="pt-2 px-2">
                  <!-- info-container -->
                  <div class="flex justify-between w-full">
                    <!-- stats-container -->
                    <div
                      class="flex items-center gap-3 drop-shadow-[0p_0px_5.22px_0px_#000000B2]"
                    >
                      <!-- likes -->
                      <div
                        class="flex items-center gap-1 drop-shadow-[0_0_0.5rem_rgba(0,0,0,0.5)]"
                      >
                        <span class="flex items-center">
                          <img
                            src="https://i.ibb.co.com/TxjJbTw6/Likes-icon.webp"
                            alt="heart"
                            class="w-3.5 h-3.5"
                          />
                        </span>
                        <span class="text-sm font-light text-[#f9fafb]"
                          >99K</span
                        >
                      </div>

                      <!-- views -->
                      <div
                        class="flex items-center gap-1 drop-shadow-[0_0_0.5rem_rgba(0,0,0,0.5)]"
                      >
                        <span class="flex items-center">
                          <img
                            src="https://i.ibb.co.com/MyBLLQHz/Views-icon.webp"
                            alt="eye"
                            class="w-3.5 h-3.5 align-bottom"
                          />
                        </span>
                        <span class="text-sm font-light text-[#f9fafb]"
                          >15.2k</span
                        >
                      </div>
                    </div>

                    <!-- action-container -->
                    <div
                      class="flex items-center gap-2 drop-shadow-[0p_0px_5.22px_0px_#000000B2]"
                    >
                      <div
                        class="flex justify-center items-center w-8 h-8 rounded-full bg-black/10 border-[0.5px] border-[#E9E5D380] group cursor-pointer"
                      >
                        <img
                          src="https://i.ibb.co.com/0ykc4SMS/icon.webp"
                          alt="cart"
                          class="w-4"
                        />
                      </div>

                      <!-- favourite-button -->
                      <div
                        data-favourite-button
                        class="flex justify-center items-center w-8 h-8 rounded-full bg-black/10 border-[0.5px] border-[#E9E5D380] group/icon hover:bg-[#07F468] [&.active]:bg-black/75 cursor-pointer"
                      >
                        <span class="relative">
                          <img
                            src="https://i.ibb.co.com/WpRRBpNk/heart.webp"
                            alt="heart"
                            class="w-4 filter brightness-0 opacity-90 invert [filter:brightness(0)_saturate(100%)_invert(97%)_sepia(12%)_saturate(351%)_hue-rotate(337deg)_brightness(95%)_contrast(92%)] group-hover/icon:[filter:brightness(0)_saturate(100%)] group-[.active]/icon:hidden"
                          />
                          <img
                            src="https://i.ibb.co.com/8LXDVHfd/heart-filled.webp"
                            alt="heart-filled"
                            class="hidden w-4 filter brightness-0 invert group-[.active]/icon:[filter:brightness(0)_saturate(100%)_invert(71%)_sepia(48%)_saturate(3539%)_hue-rotate(93deg)_brightness(109%)_contrast(95%)] group-[.active]/icon:block"
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- card-details -->
                <div
                  class="flex flex-col justify-between pt-4 pb-2 px-2 z-[30]"
                >
                  <div
                    class="flex flex-col gap-2 drop-shadow-[0px_0px_5px_0px_#000000B2]"
                  >
                    <!-- title-container -->
                    <div class="flex flex-col gap-1">
                      <!-- tags-container -->
                      <div class="flex items-center gap-1.5 pl-2">
                        <!-- hot tag -->
                        <div
                          class="flex justify-center items-center relative pr-2 backdrop-blur-[10px] rounded py-0.5 bg-[linear-gradient(90deg,#f06_0%,#ff4a92_100%)] pl-4"
                        >
                          <span
                            class="absolute drop-shadow-[0_0_.313rem_#000] left-[-0.6rem] top-[-0.6rem]"
                          >
                            <img
                              src="https://i.ibb.co.com/TBHLK0Vy/hot-fire.webp"
                              alt="hot-fire"
                              class="w-[1.375rem] h-8"
                            />
                          </span>

                          <span
                            class="text-xs leading-normal font-semibold uppercase text-white"
                            >HOTTT</span
                          >
                        </div>

                        <div
                          class="flex justify-center items-center rounded px-2 py-0.5 bg-white"
                        >
                          <span
                            class="text-xs leading-normal font-semibold text-[#1B45FF]"
                            >10% off</span
                          >
                        </div>
                      </div>

                      <h2 class="text-2xl font-semibold text-white">
                        Jenny + Mini special Live
                      </h2>
                    </div>

                    <!-- description-container -->
                    <div>
                      <p
                        class="text-xs leading-normal font-medium text-white line-clamp-2"
                      >
                        Lorem Ipsum I hate the color orange so much I have to
                        close my eyes while I eat them Lorem Ipsum I hate the
                        color orange so much I have to close my eyes while I eat
                        them
                      </p>
                    </div>
                  </div>
                </div>
              </div>
      </div>
    </SplideSlide>
  </Splide>
  </div>
</template>
