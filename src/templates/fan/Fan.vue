<template>
  <!-- main-wrapper -->
  <div class="flex flex-col md:flex-row ">
    <!-- dashboard-template-main -->
    <div
      class="w-full [height:calc(100vw-3rem)] relative z-[2] bg-transparent md:h-auto before:content-[''] before:fixed before:bg-[url('https://staging.website.app/wp-content/plugins/website/assets/dashboard-v2/images/gradient-main-bg.svg')] before:bg-cover before:w-full before:bg-no-repeat before:h-full before:left-0 before:top-0 before:pointer-events-none">
      <!-- dashboard-template-content -->
      <div class="flex flex-col h-full">
        <!-- container-wrapper -->
        <div
          class="flex flex-col w-full h-full bg-gradient-to-b from-[rgba(255,255,255,0.3)] from-0% to-[rgba(255,255,255,0)] to-8% to:from-[rgba(24,26,27,0)]">
          <!-- main-section -->
          <div class="flex flex-col relative flex-grow">
            <!-- inner-container -->
            <div class="w-full flex flex-col items-start justify-start pb-[3.75rem] gap-6 md:gap-12 md:pb-10">
              <!-- trending-media-section -->
              <div class="flex flex-col self-stretch w-full overflow-x-hidden md:overflow-x-auto">
                <!-- trending-media-prime-container -->
                <div class="hidden w-full relative md:block md:h-[26.875rem] lg:h-screen">
                  <!-- trending media banner slider desktop only -->
                  <div data-banner="desktop" class="w-full h-screen overflow-hidden md:hidden xl:[display:unset]">
                    <!-- fragment-container -->
                    <div class="w-full h-screen">
                      <!-- trending-media -->
                      <div class="w-full h-full bg-no-repeat bg-cover" style="
                          background: url('https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp');
                        ">
                        <div class="flex justify-center w-full h-full relative overflow-hidden backdrop-blur-[50px]">
                          <img src="https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp" alt=""
                            class="absolute w-full h-full absolute z-[1] object-cover visible" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- trending media banner slider for tablet background only -->
                  <div data-banner="tablet"
                    class="hidden w-full h-screen overflow-hidden md:h-[26.875rem] md:flex lg:hidden lg:h-screen">
                    <!-- fragment-container -->
                    <div class="w-full h-screen md:h-[26.875rem] lg:h-screen">
                      <!-- trending-media -->
                      <img src="https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp" alt=""
                        class="w-full h-full object-contain" />
                    </div>
                  </div>

                  <!-- trending media banner slider top image for tablet foreground image -->
                  <div data-banner="tablet-foreground"
                    class="hidden absolute top-0 left-0 w-full h-[90%] md:flex xl:hidden">
                    <!-- fragment-container -->
                    <div class="w-full h-full">
                      <!-- trending-media -->
                      <div class="w-full h-full bg-no-repeat bg-cover" style="
                          background: url('https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp');
                        ">
                        <div class="flex justify-center w-full h-full relative overflow-hidden backdrop-blur-[50px]">
                          <img src="https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp" alt=""
                            class="absolute w-full h-full absolute z-[1] object-cover visible" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- content-section -->
                  <div class="absolute top-0 left-0 w-full h-full overflow-hidden">
                    <!-- fan-trending-media-theme -->
                    <div
                      class="flex flex-col gap-12 w-full h-full relative pt-8 [background:linear-gradient(0deg,rgba(0,0,0,0)_80%,rgba(0,0,0,0.3)_100%),linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.1)_80%,rgba(0,0,0,0.1)_100%)]">
                      <!-- blur-mask -->
                      <div
                        class="block absolute bottom-0 left-0 w-full h-1/2 bg-cover bg-center-bottom z-10 pointer-events-none backdrop-blur-[50px] rounded-none [mask-composite:add] [-webkit-mask-composite:source-over] [mask-mode:alpha] [mask-image:linear-gradient(to_top,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_30%,rgba(0,0,0,1)_50%,rgba(0,0,0,0.2)_70%,rgba(0,0,0,0)_100%)] [-webkit-mask-image:linear-gradient(to_top,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_30%,rgba(0,0,0,1)_50%,rgba(0,0,0,0.2)_70%,rgba(0,0,0,0)_100%)]">
                      </div>

                      <!-- Desktop header -->

                      <FanDesktopHeader />

                      <!-- media-content-info -->
                      <div class="flex flex-col relative z-20 gap-8 md:gap-4 xl:gap-8 group">
                        <!-- fragment-container -->
                        <FanHeroButtons />

                        <!-- bottom-section -->
                        <div
                          class="flex justify-between items-end w-full pt-1 pb-8 gap-6 pl-10 md:gap-[0.875rem] md:pl-0 md:pb-0 md:flex-col md:items-start xl:items-end xl:flex-row xl:gap-6 xl:pb-8 xl:pl-10">
                          <!-- fragment-container -->
                          <FanUserInfo />

                          <!-- thumb-gallery -->
                          <div
                            class="flex flex-col gap-5 w-[70%] relative px-4 overflow-hidden visible opacity-100 md:w-full xl:w-[70%]">
                            <!-- Arrow -->
                            <div class="flex justify-end items-center gap-8 pr-10 md:hidden md:pr-4 lg:flex">
                              <button ref="prevArrow"
                                class="static flex justify-center items-center p-2 ![border:1px_solid_#fff3] [transform:unset] !w-auto !h-auto rounded-full backdrop-blur-[10px] [background:#ffffff0d] opacity-100 !border-white/20 !hover:bg-black/10 !hover:[&:disabled]:bg-white/5 [&:disabled]:opacity-50 [&:disabled]:cursor-not-allowed">
                                <img src="https://i.ibb.co.com/TBbShkb8/chevron-right.png" alt="chevron-left"
                                  class="w-8 min-w-8 h-8 min-h-8 brightness-0 invert rotate-180" />
                              </button>
                              <button ref="nextArrow"
                                class="static flex justify-center items-center p-2 ![border:1px_solid_#fff3] [transform:unset] !w-auto !h-auto rounded-full backdrop-blur-[10px] [background:#ffffff0d] opacity-100 !border-white/20 !hover:bg-black/10 !hover:[&:disabled]:bg-white/5 [&:disabled]:opacity-50 [&:disabled]:cursor-not-allowed"
                                aria-label="Next slide">
                                <img src="https://i.ibb.co.com/TBbShkb8/chevron-right.png" alt="chevron-right"
                                  class="w-8 min-w-8 h-8 min-h-8 brightness-0 invert" />
                              </button>
                            </div>

                            <div class="mb-6">
                              <Splide ref="splideRef" :options="{
                                type: 'slide',
                                perMove: 1,
                                gap: '16px',
                                pagination: false,
                                arrows: true,
                                drag: true,
                                fixedWidth: '200px',
                                fixedHeight: '7.063rem',
                                isNavigation: true,
                                focus: 'center',
                                breakpoints: {
                                  1009: {
                                    gap: '8px',
                                    fixedWidth: '100px',
                                    fixedHeight: '3.5rem',
                                    arrows: false,
                                  },
                                },
                              }" class="py-2 overflow-visible">
                                <!-- Slide 1 -->
                                <SplideSlide>
                                  <div class="overflow-hidden w-full h-full outline-none">
                                    <img src="https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp" alt="Slide 1"
                                      class="w-full h-full object-cover" />
                                  </div>
                                </SplideSlide>

                                <!-- Slide 2 -->
                                <SplideSlide>
                                  <div class="overflow-hidden w-full h-full bg-cover bg-no-repeat outline-none" style="
                                      background-image: url('https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp');
                                    ">
                                    <div class="w-full h-full overflow-hidden backdrop-blur-[50px] flex justify-center">
                                      <img src="https://i.ibb.co.com/jPw7ChWb/auth-bg.webp" alt="Slide 2"
                                        class="w-full h-full object-contain" />
                                    </div>
                                  </div>
                                </SplideSlide>

                                <!-- Slide 3 -->
                                <SplideSlide>
                                  <div class="overflow-hidden w-full h-full bg-cover bg-no-repeat relative" style="
                                      background-image: url('https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp');
                                    ">
                                    <div
                                      class="bg-black/50 backdrop-blur-[5px] absolute inset-0 flex flex-col items-center justify-center">
                                      <span class="text-center text-3xl leading-9 text-gray-300">51+</span>
                                      <span
                                        class="text-lg leading-5 text-center text-gray-300 tracking-tight">images</span>
                                    </div>
                                  </div>
                                </SplideSlide>

                                <!-- Slide 4 -->
                                <SplideSlide>
                                  <div class="overflow-hidden w-full h-full outline-none">
                                    <img src="https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp" alt="Slide 1"
                                      class="w-full h-full object-cover" />
                                  </div>
                                </SplideSlide>

                                <!-- Slide 5 -->
                                <SplideSlide>
                                  <div class="overflow-hidden w-full h-full bg-cover bg-no-repeat outline-none" style="
                                      background-image: url('https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp');
                                    ">
                                    <div class="w-full h-full overflow-hidden backdrop-blur-[50px] flex justify-center">
                                      <img src="https://i.ibb.co.com/jPw7ChWb/auth-bg.webp" alt="Slide 2"
                                        class="w-full h-full object-contain" />
                                    </div>
                                  </div>
                                </SplideSlide>

                                <!-- Slide 6 -->
                                <SplideSlide>
                                  <div class="overflow-hidden w-full h-full bg-cover bg-no-repeat relative" style="
                                      background-image: url('https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp');
                                    ">
                                    <div
                                      class="bg-black/50 backdrop-blur-[5px] absolute inset-0 flex flex-col items-center justify-center">
                                      <span class="text-center text-3xl leading-9 text-gray-300">51+</span>
                                      <span
                                        class="text-lg leading-5 text-center text-gray-300 tracking-tight">images</span>
                                    </div>
                                  </div>
                                </SplideSlide>
                              </Splide>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- trending-media-section (for-mobile) -->
                <TrendingMediaMobileSection />
              </div>

              <!-- trending-creator-section -->
              <div class="flex flex-col justify-start items-center gap-4 self-stretch w-full md:gap-6">
                <div id="splide02" class="splide flex flex-col w-full relative gap-4 md:gap-6">

                  <div class='flex justify-between px-2 md:px-4 xl:px-10'>
                    <!-- section-heading -->
                    <FanSectionhead title="Our Trending Creators"
                      description="Subscribe to some of our popular creator’s channel and start having fun!"
                      icon="https://i.ibb.co.com/SDJ2tFyW/line-chart-up.webp" />

                    <!-- Arrow -->
                    <div class="flex items-center justify-end gap-4">
                      <button @click="navigateTrending('<')"
                        class="static flex items-center justify-center p-2 w-auto h-auto transform-none [background:unset] bg-white/15 [border:1px_solid_rgba(0,0,0,0.5)] rounded-full backdrop-blur-[10px] [&:disabled]:opacity-50 [&:disabled]:cursor-not-allowed hover:bg-black/10 cursor-pointer"
                        aria-label="Previous slide">
                        <img src="https://i.ibb.co.com/TBbShkb8/chevron-right.png" alt="chevron-left"
                          class="w-8 min-w-8 h-8 min-h-8 rotate-180" />
                      </button>

                      <button @click="navigateTrending('>')"
                        class="static flex items-center justify-center p-2 w-auto h-auto transform-none [background:unset] bg-white/15 [border:1px_solid_rgba(0,0,0,0.5)] rounded-full backdrop-blur-[10px] [&:disabled]:opacity-50 [&:disabled]:cursor-not-allowed hover:bg-black/10 cursor-pointer"
                        aria-label="Next slide">
                        <img src="https://i.ibb.co.com/TBbShkb8/chevron-right.png" alt="chevron-right"
                          class="w-8 min-w-8 h-8 min-h-8" />
                      </button>
                    </div>

                  </div>
                  <!-- Slider Track -->
                  <div class="overflow-hidden">
                    <div class="block">
                      <div>
                        <div class="splide__track overflow-visible">
                          <ul class="splide__list">
                            <TrendingCreatorSlide v-for="(item, i) in creators" :key="i" v-bind="item" />
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- new-to-website -->
              <div class="flex flex-col justify-start items-center gap-4 self-stretch w-full md:gap-6">
                <div class="flex flex-col w-full relative gap-4 md:gap-6">
                  <div class='flex justify-between px-2 md:px-4 xl:px-10'>

                    <FanSectionhead title="New to website"
                      description="Check out our growing community of content creators."
                      icon="https://i.ibb.co.com/fdFrdfwv/star.webp" />

                    <div class="flex items-center justify-end gap-4">
                      <button @click="navigateNewWebsite('<')"
                        class="static flex items-center justify-center p-2 w-auto h-auto transform-none [background:unset] bg-white/15 [border:1px_solid_rgba(0,0,0,0.5)] rounded-full backdrop-blur-[10px] [&:disabled]:opacity-50 [&:disabled]:cursor-not-allowed hover:bg-black/10 cursor-pointer"
                        aria-label="Previous slide">
                        <img src="https://i.ibb.co.com/TBbShkb8/chevron-right.png" alt="chevron-left"
                          class="w-8 min-w-8 h-8 min-h-8 rotate-180" />
                      </button>

                      <button @click="navigateNewWebsite('>')"
                        class="static flex items-center justify-center p-2 w-auto h-auto transform-none [background:unset] bg-white/15 [border:1px_solid_rgba(0,0,0,0.5)] rounded-full backdrop-blur-[10px] [&:disabled]:opacity-50 [&:disabled]:cursor-not-allowed hover:bg-black/10 cursor-pointer"
                        aria-label="Next slide">
                        <img src="https://i.ibb.co.com/TBbShkb8/chevron-right.png" alt="chevron-right"
                          class="w-8 min-w-8 h-8 min-h-8" />
                      </button>
                    </div>

                  </div>

                  <Splide ref="newWebsiteSplideRef" :options="{
                    type: 'slide',
                    perMove: 1,
                    gap: '8px',
                    pagination: false,
                    arrows: false,
                    drag: true,
                    loop: false,
                    fixedWidth: '300px',
                    breakpoints: {
                      768: {
                        fixedWidth: '225px',
                        arrows: false,
                      },
                    },
                  }">
                    <SplideSlide v-for="(item, i) in newWebsiteCardArr" :key="i">
                      <NewToWebsiteCard v-bind="item" />
                    </SplideSlide>
                  </Splide>
                </div>
              </div>

              <!-- chats and tokens section -->
              <div class="flex flex-col justify-start items-start gap-12 w-full md:flex-row md:gap-4 xl:px-10">
                <!-- recent-chats section -->
                <FanSectionCard title="RECENT CHATS" icon="https://i.ibb.co.com/3yYWQ1d4/chats.webp">
                  <!-- section-content (graph container) -->
                  <FanRecentChat />
                </FanSectionCard>

                <!-- token-balance section -->
                <FanSectionCard title="Token Balance" icon="https://i.ibb.co.com/BKFvtjXV/coins-stacked.webp">
                  <!-- section-content (graph container) -->
                  <FanTokenBalance />
                </FanSectionCard>
              </div>

              <!-- latest-order-wrap -->

              <div class="flex flex-col w-full md:px-4 lg:px-10">
                <FanSectionCard title="Latest Order" icon="https://i.ibb.co.com/HphXc81F/shopping-cart.webp">
                  <FanLatestOrder/>
                </FanSectionCard>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, nextTick } from "vue";
import FanDesktopHeader from "./FanDesktopHeader.vue";
import FanHeroButtons from "./FanHeroButtons.vue";
import FanUserInfo from "./FanUserInfo.vue";
import FanSectionhead from "./FanSectionhead.vue";
import FanSectionCard from "./FanSectionCard.vue";
import TrendingCreatorSlide from "./TrendingCreatorSlide.vue";
import NewToWebsiteCard from "./NewToWebsiteCard.vue";
import TrendingMediaMobileSection from "./TrendingMediaMobileSection.vue";
import FanRecentChat from "./FanRecentChat.vue";
import FanTokenBalance from "./FanTokenBalance.vue";
import FanLatestOrder from "./FanLatestOrder.vue";

// --- Refs for Sliders ---
const splideRef = ref(null); // Top main slider
const prevArrow = ref(null);
const nextArrow = ref(null);

// 1. New to Website Slider Ref (Vue Component ke liye)
const newWebsiteSplideRef = ref(null);

// 2. Trending Creators Instance Store karne ke liye variable
let trendingSplideInstance = null;

// Data Refs
const creators = ref([]);
const newWebsiteCardArr = ref([]);
const loading = ref(true);
let splides = [];

// --- Navigation Functions (Arrows ke liye) ---

// Function 1: Trending Creators Slider Move karne ke liye
const navigateTrending = (direction) => {
  if (trendingSplideInstance) {
    trendingSplideInstance.go(direction);
  }
};

// Function 2: New to Website Slider Move karne ke liye
const navigateNewWebsite = (direction) => {
  // Vue Splide wrapper instance se access karte hain
  if (newWebsiteSplideRef.value && newWebsiteSplideRef.value.splide) {
    newWebsiteSplideRef.value.splide.go(direction);
  }
};


// --- Initialization Logic ---
const initSplideLogic = () => {

  // A. Initialize Splide 02 (Trending Creators - Vanilla JS Approach)
  if (typeof Splide !== "undefined" && document.querySelector("#splide02")) {
    const splide02 = new Splide("#splide02", {
      type: "slide",
      perMove: 1,
      gap: "8px",
      pagination: false,
      arrows: false, // Default arrows hide karein taake custom use hon
      drag: true,
      loop: false,
      fixedWidth: "16.6667%",
      breakpoints: {
        1365: { fixedWidth: "20%" },
        1010: { fixedWidth: "calc(20% - 6.4px)" },
        768: { fixedWidth: "100%", pagination: true },
      },
    }).mount();

    // Instance ko variable mein save karein taake button click par use kar sakein
    trendingSplideInstance = splide02;
    splides.push(splide02);
  }

  // B. Splide 02 Events
  const slides02 = document.querySelectorAll("#splide02 .splide__slide");
  if (slides02.length > 0) {
    slides02.forEach((item) => {
      item.addEventListener("mouseenter", () => {
        slides02.forEach((i) => i.classList.remove("active"));
        item.classList.add("active");
      });
      item.addEventListener("mouseleave", () => {
        item.classList.remove("active");
      });
      item.addEventListener("click", () => {
        slides02.forEach((i) => i.classList.remove("active"));
        item.classList.add("active");
      });
    });
  }

  // C. Toggle Like Button
  const favBtns = document.querySelectorAll("[data-favourite-button]");
  favBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
    });
  });

  // D. Banner Logic (Splide 01)
  const slides = document.querySelectorAll("#splide01 .splide__slide");
  const banners = {
    desktop: document.querySelector('[data-banner="desktop"]'),
    tablet: document.querySelector('[data-banner="tablet"]'),
    tabletForeground: document.querySelector('[data-banner="tablet-foreground"]'),
  };
  // ... (Apka purana banner logic same rahega, copy paste kar lein)

  // E. Custom Arrows Logic (For Top Slider only)
  const splideInstance = splideRef.value?.splide;
  if (splideInstance && prevArrow.value && nextArrow.value) {
    prevArrow.value.addEventListener("click", () => splideInstance.go("<"));
    nextArrow.value.addEventListener("click", () => splideInstance.go(">"));
  }
};

// Main Fetch Function
const fetchHomeData = async () => {
  try {
    const response = await fetch('/data/mockFanData.json');
    if (!response.ok) throw new Error('Failed to load data');
    const data = await response.json();
    creators.value = data.creators;
    newWebsiteCardArr.value = data.newWebsiteCardArr;
  } catch (error) {
    console.error("Error:", error);
  } finally {
    loading.value = false;
    await nextTick();
    initSplideLogic();
  }
};

onMounted(() => {
  fetchHomeData();
});

onBeforeUnmount(() => {
  splides.forEach((splide) => {
    if (splide && typeof splide.destroy === "function") splide.destroy();
  });
});
</script>

<style>
.splide__arrows {
  display: none !important;
}

.splide__track--nav>.splide__list>.splide__slide.is-active {
  border: none;
}
</style>
