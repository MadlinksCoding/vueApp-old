<template>
  <PopupHandler
    :modelValue="modelValue"
    @update:modelValue="(val) => emit('update:modelValue', val)"
    :config="viewAllPopupConfig"
  >
    <!-- popup-wrapper -->
    <div
      class="h-full bg-black/90 font-sans p-0 m-0 box-border overflow-x-hidden overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-order-style:none] [scrollbar-width:none] dark:bg-background-dark-popupBg"
    >
      <div class="flex flex-col gap-2">
        <!-- mobile-nav -->
        <div
          data-mobile-nav
          class="fixed top-0 left-0 w-full z-[1] md:hidden bg-transparent transition-colors duration-300"
        >
          <div class="flex items-center justify-between gap-1 py-1">
            <!-- back-button -->
            <button
              @click="emit('update:modelValue', false)"
              class="w-10 h-10 flex justify-center items-center bg-transparent border-none outline-none cursor-pointer"
            >
              <img
                src="https://i.ibb.co.com/Zpm5jfZ9/chevron-left.webp"
                alt="go-back"
                class="w-6 h-6"
              />
            </button>

            <!-- creator-info-container -->
            <div class="h-9 flex items-center gap-2 py-1">
              <!-- avatar -->
              <img
                src="https://i.ibb.co.com/67B4Cz6d/Frame-1410098582.webp"
                alt="avatar"
                class="w-6 h-6"
              />

              <div class="flex items-center gap-1">
                <span class="text-xs leading-normal font-medium text-white"
                  >Princess Carrot Pop</span
                >
                <img
                  src="https://i.ibb.co.com/nMhY8CpS/svgviewer-png-output-22.webp"
                  alt="verified-tick"
                  class="w-2.5 h-2.5"
                />
              </div>
            </div>

            <!-- tag & filter -->
            <div class="flex items-center gap-2.5">
              <img
                src="https://i.ibb.co.com/CsbQt0LN/filter.webp"
                alt="filter"
                class="w-6 h-6 cursor-pointer"
              />

              <button
                class="w-10 h-10 flex justify-center items-center bg-transparent border-none outline-none cursor-pointer"
              >
                <img
                  src="https://i.ibb.co.com/d3xDXQK/tags.webp"
                  alt="tags"
                  class="w-6 h-6"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- tablet-nav -->
        <div
          class="hidden justify-between items-center gap-2 p-4 relative md:flex xl:hidden"
        >
          <!-- back-button -->
          <ButtonComponent
            @click="emit('update:modelValue', false)"
            text="Back"
            variant="profileMediaBtn"
            :leftIcon="'https://i.ibb.co.com/HLCwss7q/arrow-left.webp'"
            :leftIconClass="`w-8 h-8 [filter:brightness(0)_saturate(100%)_invert(81%)_sepia(45%)_saturate(3798%)_hue-rotate(87deg)_brightness(100%)_contrast(98%)] drop-shadow-[0px_0px_8px_0px_#00000080]`"
          />

          <!-- creator-info -->
          <div
            class="absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
          >
            <img
              src="https://i.ibb.co.com/KpDb5Hrb/avatar.webp"
              alt="avatar"
              class="w-8 h-8 rounded-full"
            />

            <span class="text-2xl font-semibold text-white">Jenny’s Media</span>
          </div>

          <!-- tag & filter -->
          <div class="flex items-center gap-3">
            <!-- tag -->
            <button
              class="flex justify-center items-center gap-1 px-4 py-2 h-9 border border-[#07F468] rounded-[3.125rem] cursor-pointer"
            >
              <img
                src="https://i.ibb.co.com/QjD7g6GL/search-sm.webp"
                alt="search"
                class="w-4 h-4"
              />

              <span class="text-sm text-[#07F468]">Tag..</span>
            </button>

            <!-- filter -->
            <div
              class="flex justify-center items-center gap-2 px-4 py-2 h-10 rounded-[3.125rem] bg-black/90 dark:bg-background-dark-app cursor-pointer"
            >
              <img
                src="https://i.ibb.co.com/CsbQt0LN/filter.webp"
                alt="filter"
                class="w-5 h-5"
              />

              <span class="text-sm font-semibold text-[#E7E5E4]">Filter</span>

              <div class="w-2 h-2 rounded-full bg-[#FF0066]"></div>
            </div>
          </div>
        </div>

        <!-- desktop-nav -->
        <div class="hidden flex flex-col justify-center p-6 relative xl:flex">
          <!-- creator-info -->
          <div class="flex justify-center items-center gap-2 mb-[1.125rem]">
            <img
              src="https://i.ibb.co.com/KpDb5Hrb/avatar.webp"
              alt="avatar"
              class="w-8 h-8 rounded-full"
            />
            <span class="text-2xl font-semibold text-white">Jenny’s Media</span>
          </div>

          <!-- filter -->
          <div class="flex justify-center items-center gap-1 pt-2">
            <div class="flex items-center bg-black/90 p-1 rounded-[3.125rem] dark:bg-background-dark-app">
              <!-- tag -->
              <button
                class="flex justify-center items-center gap-1 px-2 py-1 h-7 border border-[#07F468] rounded-[3.125rem] cursor-pointer"
              >
                <img
                  src="https://i.ibb.co.com/QjD7g6GL/search-sm.webp"
                  alt="search"
                  class="w-4 h-4"
                />

                <span class="text-sm text-[#07F468]">Tag..</span>
              </button>

              <!-- filter-buttons-container -->
              <div class="flex items-center gap-6 pl-6 pr-4">
                <!-- pay-per-view -->
                <div class="flex items-center gap-2">
                  <!-- toggle-switch -->
                  <CheckboxSwitch
                    label="Pay per view"
                    id="show-payPerView"
                    v-model="showPayPerViewModel"
                    version="v1"
                    track-class="absolute inset-0 cursor-pointer rounded-xl bg-[#98a2b380] transition-all duration-100 ease-in-out peer-checked:bg-[#07F468] dark:bg-[#444c5b80] dark:peer-checked:bg-[#06c454]"
                    knob-class="absolute left-[0.125rem] top-1/2 h-4 w-4 -translate-y-1/2 transform rounded-full bg-white shadow-[0_1px_3px_0_rgba(16,24,40,0.1),0_1px_2px_0_rgba(16,24,40,0.06)] transition-all duration-100 ease-in-out peer-checked:translate-x-4 dark:bg-[#181a1b]"
                    label-class="text-white text-sm leading-6 text-[400]"
                    switchWrapperClass="w-9 h-5"
                  />

                  <!-- item-count -->
                  <div class="flex w-4 h-6">
                    <span class="text-xs leading-normal text-[#07F468]">7</span>
                  </div>
                </div>

                <!-- watch-now -->
                <div class="flex items-center gap-2">
                  <!-- toggle-switch -->
                  <CheckboxSwitch
                    label="Watch now"
                    id="show-watchNow"
                    v-model="showwatchNowModel"
                    version="v1"
                    track-class="absolute inset-0 cursor-pointer rounded-xl bg-[#98a2b380] transition-all duration-100 ease-in-out peer-checked:bg-[#07F468] dark:bg-[#444c5b80] dark:peer-checked:bg-[#06c454]"
                    knob-class="absolute left-[0.125rem] top-1/2 h-4 w-4 -translate-y-1/2 transform rounded-full bg-white shadow-[0_1px_3px_0_rgba(16,24,40,0.1),0_1px_2px_0_rgba(16,24,40,0.06)] transition-all duration-100 ease-in-out peer-checked:translate-x-4 dark:bg-[#181a1b]"
                    label-class="text-white text-sm leading-6 text-[400]"
                    switchWrapperClass="w-9 h-5"
                  />

                  <!-- item-count -->
                  <div class="flex w-4 h-6">
                    <span class="text-xs leading-normal text-[#07F468]">3</span>
                  </div>
                </div>

                <!-- media-type -->
                <div class="flex items-center gap-2 cursor-pointer">
                  <span class="text-sm leading-6 text-[#E7E5E4]"
                    >Media Type</span
                  >
                  <img
                    src="https://i.ibb.co.com/tpVym6cg/down.webp"
                    alt="expand"
                    class="w-4 h-4"
                  />
                </div>

                <!-- sort by -->
                <div class="flex items-center gap-2 cursor-pointer">
                  <div class="flex items-center gap-1">
                    <span class="text-sm leading-6 text-[#E7E5E4]"
                      >Last upload</span
                    >
                    <img
                      src="https://i.ibb.co.com/bMRnvvkf/sort.webp"
                      alt="sort"
                      class="w-4 h-4"
                    />
                  </div>

                  <img
                    src="https://i.ibb.co.com/tpVym6cg/down.webp"
                    alt="expand"
                    class="w-4 h-4"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- back-button -->
          <div class="absolute top-8 left-6">
            <button
              @click="emit('update:modelValue', false)"
              class="flex justify-center items-center p-2.5 rounded-full bg-black/90 dark:bg-background-dark-app"
            >
              <img
                src="https://i.ibb.co.com/HLCwss7q/arrow-left.webp"
                alt="arrow-left"
                class="w-8 h-8 [filter:brightness(0)_saturate(100%)_invert(81%)_sepia(45%)_saturate(3798%)_hue-rotate(87deg)_brightness(100%)_contrast(98%)] drop-shadow-[0px_0px_8px_0px_#00000080]"
              />
            </button>
          </div>
        </div>

        <!-- media-container -->
        <div
          class="flex flex-col gap-2 mt-14 px-2 md:gap-4 md:mt-0 md:px-6 xl:gap-6 xl:mt-[-0.875rem]"
        >
          <!-- tags-container -->
          <div
            class="flex justify-center items-start content-start gap-2 px-2 flex-wrap md:w-[39.5625rem] md:mx-auto md:gap-3"
          >
            <!-- no-tag-selected-text -->
            <p class="hidden text-base text-white">
              No results found. Please try again with a different search terms.
            </p>

            <!-- tag -->
            <div
              class="flex justify-center items-center gap-2 px-2 py-0.5 bg-white/20 cursor-pointer group tag-active [&.tag-active]:bg-[#07F468]"
            >
              <span
                class="text-base font-medium text-[#FDFDFC] group-[.tag-active]:text-black"
                >Eating</span
              >

              <img
                src="https://i.ibb.co.com/ZwrWdZk/x.webp"
                alt="close"
                class="hidden w-4 h-4 group-[.tag-active]:block"
              />
            </div>

            <!-- tag -->
            <div
              class="flex justify-center items-center gap-2 px-2 py-0.5 bg-white/20 cursor-pointer group tag-active [&.tag-active]:bg-[#07F468]"
            >
              <span
                class="text-base font-medium text-[#FDFDFC] group-[.tag-active]:text-black"
                >Big smile</span
              >

              <img
                src="https://i.ibb.co.com/ZwrWdZk/x.webp"
                alt="close"
                class="hidden w-4 h-4 group-[.tag-active]:block"
              />
            </div>

            <!-- tag -->
            <div
              class="flex justify-center items-center gap-2 px-2 py-0.5 bg-white/20 cursor-pointer group tag-active [&.tag-active]:bg-[#07F468]"
            >
              <span
                class="text-base font-medium text-[#FDFDFC] group-[.tag-active]:text-black"
                >Big Appetite</span
              >

              <img
                src="https://i.ibb.co.com/ZwrWdZk/x.webp"
                alt="close"
                class="hidden w-4 h-4 group-[.tag-active]:block"
              />
            </div>

            <!-- tag -->
            <div
              class="flex justify-center items-center gap-2 px-2 py-0.5 bg-white/20 cursor-pointer group tag-active [&.tag-active]:bg-[#07F468]"
            >
              <span
                class="text-base font-medium text-[#FDFDFC] group-[.tag-active]:text-black"
                >Big Energy</span
              >

              <img
                src="https://i.ibb.co.com/ZwrWdZk/x.webp"
                alt="close"
                class="hidden w-4 h-4 group-[.tag-active]:block"
              />
            </div>

            <!-- tag -->
            <div
              class="flex justify-center items-center gap-2 px-2 py-0.5 bg-white/20 cursor-pointer group tag-active [&.tag-active]:bg-[#07F468]"
            >
              <span
                class="text-base font-medium text-[#FDFDFC] group-[.tag-active]:text-black"
                >Eating</span
              >

              <img
                src="https://i.ibb.co.com/ZwrWdZk/x.webp"
                alt="close"
                class="hidden w-4 h-4 group-[.tag-active]:block"
              />
            </div>

            <!-- tag -->
            <div
              class="flex justify-center items-center gap-2 px-2 py-0.5 bg-white/20 cursor-pointer group tag-active [&.tag-active]:bg-[#07F468]"
            >
              <span
                class="text-base font-medium text-[#FDFDFC] group-[.tag-active]:text-black"
                >Big Energy</span
              >

              <img
                src="https://i.ibb.co.com/ZwrWdZk/x.webp"
                alt="close"
                class="hidden w-4 h-4 group-[.tag-active]:block"
              />
            </div>

            <!-- tag -->
            <div
              class="flex justify-center items-center gap-2 px-2 py-0.5 bg-white/20 cursor-pointer group tag-active [&.tag-active]:bg-[#07F468]"
            >
              <span
                class="text-base font-medium text-[#FDFDFC] group-[.tag-active]:text-black"
                >Big smile</span
              >

              <img
                src="https://i.ibb.co.com/ZwrWdZk/x.webp"
                alt="close"
                class="hidden w-4 h-4 group-[.tag-active]:block"
              />
            </div>

            <!-- tag -->
            <div
              class="flex justify-center items-center gap-2 px-2 py-0.5 bg-white/20 cursor-pointer group tag-active [&.tag-active]:bg-[#07F468]"
            >
              <span
                class="text-base font-medium text-[#FDFDFC] group-[.tag-active]:text-black"
                >Big Appetite</span
              >

              <img
                src="https://i.ibb.co.com/ZwrWdZk/x.webp"
                alt="close"
                class="hidden w-4 h-4 group-[.tag-active]:block"
              />
            </div>

            <!-- tag -->
            <div
              class="flex justify-center items-center gap-2 px-2 py-0.5 bg-white/20 cursor-pointer group tag-active [&.tag-active]:bg-[#07F468]"
            >
              <span
                class="text-base font-medium text-[#FDFDFC] group-[.tag-active]:text-black"
                >Big Appetite</span
              >

              <img
                src="https://i.ibb.co.com/ZwrWdZk/x.webp"
                alt="close"
                class="hidden w-4 h-4 group-[.tag-active]:block"
              />
            </div>

            <!-- tag -->
            <div
              class="flex justify-center items-center gap-2 px-2 py-0.5 bg-white/20 cursor-pointer group tag-active [&.tag-active]:bg-[#07F468]"
            >
              <span
                class="text-base font-medium text-[#FDFDFC] group-[.tag-active]:text-black"
                >Eating</span
              >

              <img
                src="https://i.ibb.co.com/ZwrWdZk/x.webp"
                alt="close"
                class="hidden w-4 h-4 group-[.tag-active]:block"
              />
            </div>
          </div>

          <div
            class="grid grid-cols-1 gap-2 md:grid-cols-3 xl:grid-cols-4 md:gap-4"
          >
            <ViewAllPopupMediaCard
              v-for="(video, index) in mockVideos"
              :key="index"
              :videoSrc="video.src"
              :duration="video.duration"
              :likes="video.likes"
              :views="video.views"
              :discount="video.discount"
            />
          </div>
        </div>
      </div>
    </div>
  </PopupHandler>
</template>

<script setup>
import PopupHandler from "./PopupHandler.vue";
import { onMounted, onUnmounted, ref } from "vue";
import ViewAllPopupMediaCard from "@/components/ui/card/dashboard/ViewAllPopupMediaCard.vue";
import ButtonComponent from "@/components/dev/button/ButtonComponent.vue";
import CheckboxSwitch from "@/components/dev/checkbox/CheckboxSwitch.vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(["update:modelValue"]);

const viewAllPopupConfig = {
  actionType: "slidein",
  from: "right",
  offset: "0px",
  speed: "250ms",
  effect: "ease-in-out",
  showOverlay: false,
  closeOnOutside: true,
  lockScroll: false,
  escToClose: true,
  width: { default: "90%", "<786": "100%" },
  height: { default: "90%", "<786": "100%" },
  scrollable: false,
  closeSpeed: "250ms",
  closeEffect: "cubic-bezier(0.4, 0, 0.2, 1)",
};

// Mock Data for loop
const mockVideos = ref([
  {
    src: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    duration: "14:55:09",
    likes: 0,
    views: 4,
    discount: "10% OFF",
  },
  {
    src: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    duration: "14:55:09",
    likes: 0,
    views: 4,
    discount: "10% OFF",
  },
  {
    src: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    duration: "14:55:09",
    likes: 0,
    views: 4,
    discount: "10% OFF",
  },
  {
    src: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    duration: "14:55:09",
    likes: 0,
    views: 4,
    discount: "10% OFF",
  },
  {
    src: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    duration: "14:55:09",
    likes: 0,
    views: 4,
    discount: "10% OFF",
  },
  {
    src: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    duration: "14:55:09",
    likes: 0,
    views: 4,
    discount: "10% OFF",
  },
]);

onMounted(() => {
  const mobileNav = document.querySelector("[data-mobile-nav]");

  const handleScroll = () => {
    if (window.scrollY > 0) {
      mobileNav.classList.replace("bg-transparent", "bg-black/90");
    } else {
      mobileNav.classList.replace("bg-black/90", "bg-transparent");
    }
  };

  window.addEventListener("scroll", handleScroll);

  // Cleanup when component unmounts
  onUnmounted(() => {
    window.removeEventListener("scroll", handleScroll);
  });
});
</script>
