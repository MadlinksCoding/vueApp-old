<template>
  <!-- main-wrapper -->
  <div class="flex flex-col md:flex-row">
    <!-- dashboard-template-main -->
    <div
      class="w-full [height:calc(100vw-3rem)] relative z-[2] bg-transparent md:h-auto before:content-[''] before:fixed before:bg-[url('https://staging.website.app/wp-content/plugins/website/assets/dashboard-v2/images/gradient-main-bg.svg')] before:bg-cover before:w-full before:bg-no-repeat before:h-full before:left-0 before:top-0 before:pointer-events-none"
    >
      <!-- dashboard-template-content -->
      <div class="flex flex-col h-full">
        <!-- container-wrapper -->
        <div
          class="flex flex-col w-full h-full bg-gradient-to-b from-[rgba(255,255,255,0.3)] from-0% to-[rgba(255,255,255,0)] to-8% to:from-[rgba(24,26,27,0)]"
        >
          <!-- main-section -->
          <div class="flex flex-col relative flex-grow">
            <!-- inner-container -->
            <div
              class="w-full flex flex-col items-start justify-start pb-[3.75rem] gap-6 md:gap-12 md:pb-10"
            >
              <!-- trending-media-section -->
              <div
                class="flex flex-col self-stretch w-full overflow-x-hidden md:overflow-x-auto"
              >
                <!-- trending-media-prime-container -->
                <div
                  class="hidden w-full relative md:block md:h-[26.875rem] lg:h-screen"
                >
                  <!-- trending media banner slider desktop only -->
                  <div
                    data-banner="desktop"
                    class="w-full h-screen overflow-hidden md:hidden xl:[display:unset]"
                  >
                    <!-- fragment-container -->
                    <div class="w-full h-screen">
                      <!-- trending-media -->
                      <div
                        class="w-full h-full bg-no-repeat bg-cover"
                        style="
                          background: url('https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp');
                        "
                      >
                        <div
                          class="flex justify-center w-full h-full relative overflow-hidden backdrop-blur-[50px]"
                        >
                          <img
                            src="https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp"
                            alt=""
                            class="absolute w-full h-full absolute z-[1] object-cover visible"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- trending media banner slider for tablet background only -->
                  <div
                    data-banner="tablet"
                    class="hidden w-full h-screen overflow-hidden md:h-[26.875rem] md:flex lg:hidden lg:h-screen"
                  >
                    <!-- fragment-container -->
                    <div class="w-full h-screen md:h-[26.875rem] lg:h-screen">
                      <!-- trending-media -->
                      <img
                        src="https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp"
                        alt=""
                        class="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  <!-- trending media banner slider top image for tablet foreground image -->
                  <div
                    data-banner="tablet-foreground"
                    class="hidden absolute top-0 left-0 w-full h-[90%] md:flex xl:hidden"
                  >
                    <!-- fragment-container -->
                    <div class="w-full h-full">
                      <!-- trending-media -->
                      <div
                        class="w-full h-full bg-no-repeat bg-cover"
                        style="
                          background: url('https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp');
                        "
                      >
                        <div
                          class="flex justify-center w-full h-full relative overflow-hidden backdrop-blur-[50px]"
                        >
                          <img
                            src="https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp"
                            alt=""
                            class="absolute w-full h-full absolute z-[1] object-cover visible"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- content-section -->
                  <div
                    class="absolute top-0 left-0 w-full h-full overflow-hidden"
                  >
                    <!-- fan-trending-media-theme -->
                    <div
                      class="flex flex-col gap-12 w-full h-full relative pt-8 [background:linear-gradient(0deg,rgba(0,0,0,0)_80%,rgba(0,0,0,0.3)_100%),linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.1)_80%,rgba(0,0,0,0.1)_100%)]"
                    >
                      <!-- blur-mask -->
                      <div
                        class="block absolute bottom-0 left-0 w-full h-1/2 bg-cover bg-center-bottom z-10 pointer-events-none backdrop-blur-[50px] rounded-none [mask-composite:add] [-webkit-mask-composite:source-over] [mask-mode:alpha] [mask-image:linear-gradient(to_top,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_30%,rgba(0,0,0,1)_50%,rgba(0,0,0,0.2)_70%,rgba(0,0,0,0)_100%)] [-webkit-mask-image:linear-gradient(to_top,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_30%,rgba(0,0,0,1)_50%,rgba(0,0,0,0.2)_70%,rgba(0,0,0,0)_100%)]"
                      ></div>

                      <!-- Desktop header -->

                      <FanDesktopHeader />

                      <!-- media-content-info -->
                      <div
                        class="flex flex-col relative z-20 gap-8 md:gap-4 xl:gap-8 group"
                      >
                        <!-- fragment-container -->
                        <FanHeroButtons />

                        <!-- bottom-section -->
                        <div
                          class="flex justify-between items-end w-full pt-1 pb-8 gap-6 pl-10 md:gap-[0.875rem] md:pl-0 md:pb-0 md:flex-col md:items-start xl:items-end xl:flex-row xl:gap-6 xl:pb-8 xl:pl-10"
                        >
                          <!-- fragment-container -->
                          <FanUserInfo />

                          <!-- thumb-gallery -->
                          <div
                            class="flex flex-col gap-5 w-[70%] relative px-4 overflow-hidden visible opacity-100 md:w-full xl:w-[70%]"
                          >
                            <!-- Arrow -->
                            <div
                              class="flex justify-end items-center gap-8 pr-10 md:hidden md:pr-4 lg:flex"
                            >
                              <button
                                ref="prevArrow"
                                class="static flex justify-center items-center p-2 ![border:1px_solid_#fff3] [transform:unset] !w-auto !h-auto rounded-full backdrop-blur-[10px] [background:#ffffff0d] opacity-100 !border-white/20 !hover:bg-black/10 !hover:[&:disabled]:bg-white/5 [&:disabled]:opacity-50 [&:disabled]:cursor-not-allowed"
                              >
                                <img
                                  src="https://i.ibb.co.com/TBbShkb8/chevron-right.png"
                                  alt="chevron-left"
                                  class="w-8 min-w-8 h-8 min-h-8 brightness-0 invert rotate-180"
                                />
                              </button>
                              <button
                                ref="nextArrow"
                                class="static flex justify-center items-center p-2 ![border:1px_solid_#fff3] [transform:unset] !w-auto !h-auto rounded-full backdrop-blur-[10px] [background:#ffffff0d] opacity-100 !border-white/20 !hover:bg-black/10 !hover:[&:disabled]:bg-white/5 [&:disabled]:opacity-50 [&:disabled]:cursor-not-allowed"
                                aria-label="Next slide"
                              >
                                <img
                                  src="https://i.ibb.co.com/TBbShkb8/chevron-right.png"
                                  alt="chevron-right"
                                  class="w-8 min-w-8 h-8 min-h-8 brightness-0 invert"
                                />
                              </button>
                            </div>

                            <div class="mb-6">
                              <Splide
                                ref="splideRef"
                                :options="{
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
                                }"
                                class="py-2 overflow-visible"
                              >
                                <!-- Slide 1 -->
                                <SplideSlide>
                                  <div
                                    class="overflow-hidden w-full h-full outline-none"
                                  >
                                    <img
                                      src="https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp"
                                      alt="Slide 1"
                                      class="w-full h-full object-cover"
                                    />
                                  </div>
                                </SplideSlide>

                                <!-- Slide 2 -->
                                <SplideSlide>
                                  <div
                                    class="overflow-hidden w-full h-full bg-cover bg-no-repeat outline-none"
                                    style="
                                      background-image: url('https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp');
                                    "
                                  >
                                    <div
                                      class="w-full h-full overflow-hidden backdrop-blur-[50px] flex justify-center"
                                    >
                                      <img
                                        src="https://i.ibb.co.com/jPw7ChWb/auth-bg.webp"
                                        alt="Slide 2"
                                        class="w-full h-full object-contain"
                                      />
                                    </div>
                                  </div>
                                </SplideSlide>

                                <!-- Slide 3 -->
                                <SplideSlide>
                                  <div
                                    class="overflow-hidden w-full h-full bg-cover bg-no-repeat relative"
                                    style="
                                      background-image: url('https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp');
                                    "
                                  >
                                    <div
                                      class="bg-black/50 backdrop-blur-[5px] absolute inset-0 flex flex-col items-center justify-center"
                                    >
                                      <span
                                        class="text-center text-3xl leading-9 text-gray-300"
                                        >51+</span
                                      >
                                      <span
                                        class="text-lg leading-5 text-center text-gray-300 tracking-tight"
                                        >images</span
                                      >
                                    </div>
                                  </div>
                                </SplideSlide>

                                <!-- Slide 4 -->
                                <SplideSlide>
                                  <div
                                    class="overflow-hidden w-full h-full outline-none"
                                  >
                                    <img
                                      src="https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp"
                                      alt="Slide 1"
                                      class="w-full h-full object-cover"
                                    />
                                  </div>
                                </SplideSlide>

                                <!-- Slide 5 -->
                                <SplideSlide>
                                  <div
                                    class="overflow-hidden w-full h-full bg-cover bg-no-repeat outline-none"
                                    style="
                                      background-image: url('https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp');
                                    "
                                  >
                                    <div
                                      class="w-full h-full overflow-hidden backdrop-blur-[50px] flex justify-center"
                                    >
                                      <img
                                        src="https://i.ibb.co.com/jPw7ChWb/auth-bg.webp"
                                        alt="Slide 2"
                                        class="w-full h-full object-contain"
                                      />
                                    </div>
                                  </div>
                                </SplideSlide>

                                <!-- Slide 6 -->
                                <SplideSlide>
                                  <div
                                    class="overflow-hidden w-full h-full bg-cover bg-no-repeat relative"
                                    style="
                                      background-image: url('https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp');
                                    "
                                  >
                                    <div
                                      class="bg-black/50 backdrop-blur-[5px] absolute inset-0 flex flex-col items-center justify-center"
                                    >
                                      <span
                                        class="text-center text-3xl leading-9 text-gray-300"
                                        >51+</span
                                      >
                                      <span
                                        class="text-lg leading-5 text-center text-gray-300 tracking-tight"
                                        >images</span
                                      >
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
              <div
                class="flex flex-col justify-start items-center gap-4 self-stretch w-full md:gap-6"
              >
                <div
                  id="splide02"
                  class="splide flex flex-col w-full relative gap-4 md:gap-6"
                >
                  <!-- section-heading -->
                  <FanSectionhead
                    title="Our Trending Creators"
                    description="Subscribe to some of our popular creator’s channel and start having fun!"
                    icon="https://i.ibb.co.com/SDJ2tFyW/line-chart-up.webp"
                  />

                  <!-- Slider Track -->
                  <div class="overflow-hidden">
                    <div class="block">
                      <div>
                        <div class="splide__track overflow-visible">
                          <ul class="splide__list">
                            <TrendingCreatorSlide
                              v-for="(item, i) in creators"
                              :key="i"
                              v-bind="item"
                            />
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- new-to-website -->
              <div
                class="flex flex-col justify-start items-center gap-4 self-stretch w-full md:gap-6"
              >
                <!-- new-website-section -->
                <div class="flex flex-col w-full relative gap-4 md:gap-6">
                  <!-- section-heading -->
                  <FanSectionhead
                    title="New to website"
                    description="Check out our growing community of content creators."
                    icon="https://i.ibb.co.com/fdFrdfwv/star.webp"
                  />

                  <!-- Slider Track -->
                  <Splide
                    :options="{
                      type: 'slide',
                      perMove: 1,
                      gap: '8px',
                      pagination: false,
                      arrows: true,
                      drag: true,
                      loop: false,
                      fixedWidth: '300px',
                      breakpoints: {
                        768: {
                          fixedWidth: '225px',
                          arrows: false,
                        },
                      },
                    }"
                  >
                    <SplideSlide
                      v-for="(item, i) in newWebsiteCardArr"
                      :key="i"
                    >
                      <NewToWebsiteCard v-bind="item" />
                    </SplideSlide>
                  </Splide>
                </div>
              </div>

              <!-- chats and tokens section -->
              <div
                class="flex flex-col justify-start items-start gap-12 w-full md:flex-row md:gap-4 xl:px-10"
              >
                <!-- recent-chats section -->
                <FanSectionCard
                  title="RECENT CHATS"
                  icon="https://i.ibb.co.com/3yYWQ1d4/chats.webp"
                >
                  <!-- section-content (graph container) -->
                  <div
                    class="flex flex-col justify-center items-center gap-2 w-full flex-grow h-72 lg:h-auto"
                  >
                    <!-- icon -->
                    <div class="flex justify-center items-center p-4 w-40 h-40">
                      <img
                        src="https://i.ibb.co.com/d4rh5yhv/chat-big.webp"
                        alt="chat-big"
                        class="w-80 max-w-80 h-[19.5rem] flex-shrink-0"
                      />
                    </div>

                    <!-- text-container -->
                    <div
                      class="flex flex-col justify-center items-center gap-2 text-center"
                    >
                      <p class="text-base text-[#344054]">
                        You don’t have any active chats yet.
                      </p>
                      <a class="text-sm text-[#344054] underline"
                        >Look who is online</a
                      >
                    </div>
                  </div>
                </FanSectionCard>

                <!-- token-balance section -->
                <FanSectionCard
                  title="Token Balance"
                  icon="https://i.ibb.co.com/BKFvtjXV/coins-stacked.webp"
                >
                  <!-- section-content (graph container) -->
                  <div
                    class="flex flex-col justify-center items-center gap-6 p-6 w-full flex-grow h-72 lg:h-auto"
                  >
                    <div class="flex justify-center items-center">
                      <!-- progress-circle (empty) -->
                      <div
                        class="absolute z-[-1] w-[16.25rem] md:w-[22.5rem] pointer-events-none"
                      >
                        <img
                          src="https://i.ibb.co.com/jPRqjBCp/progress-circle.webp"
                          alt="progress-circle"
                          class="w-full h-auto"
                        />
                      </div>

                      <!-- balance-container -->
                      <div
                        class="absolute z-0 flex flex-col justify-center items-center gap-2 mt-16 md:mt-24"
                      >
                        <span class="text-base text-[#344054]"
                          >Token Balance</span
                        >
                        <div
                          class="flex flex-col justify-center items-center gap-2"
                        >
                          <span class="text-5xl font-medium tracking-[0.015rem]"
                            >0</span
                          >
                        </div>
                      </div>
                    </div>
                  </div>
                </FanSectionCard>
              </div>

              <!-- latest-order-wrap -->

              <div class="flex flex-col w-full md:px-4 lg:px-10">
                <FanSectionCard
                  title="Latest Order"
                  icon="https://i.ibb.co.com/HphXc81F/shopping-cart.webp"
                >
                  <div
                    class="flex flex-column justify-center items-center self-stretch gap-2 flex-grow md:p-4 md:pt-0"
                  >
                    <div
                      class="flex flex-col items-center w-full relative gap-4 md:gap-6"
                    >
                      <div
                        class="flex justify-between items-center self-stretch relative gap-6 w-full px-2 md:px-0"
                      >
                        <!-- tabs-button-group -->
                        <div
                          class="flex px-1 py-1 rounded-[3rem] bg-gradient-to-r from-[rgba(251,_91,_162,_0.15)] to-[rgba(251,_91,_162,_0.08)] border-none shadow-[0_1px_2px_0_rgba(16,_24,_40,_0.05)] overflow-hidden items-start w-full sm:w-max"
                        >
                          <button
                            class="trends-tabs-wrapper-button p-2 sm:px-4 sm:py-2 text-sm font-medium leading-5 justify-center items-center flex gap-2 outline-none border-none h-10 [flex:1] sm:h-auto sm:[flex:unset] whitespace-nowrap active [&.active]:rounded-[3rem] [&.active]:bg-black [&.active]:text-white [&.active]:font-semibold"
                          >
                            Subscriptions
                          </button>
                          <button
                            class="trends-tabs-wrapper-button p-2 sm:px-4 sm:py-2 text-sm font-medium leading-5 justify-center items-center flex gap-2 outline-none border-none h-10 [flex:1] sm:h-auto sm:[flex:unset] whitespace-nowrap"
                          >
                            PPV
                          </button>
                          <button
                            class="trends-tabs-wrapper-button p-2 sm:px-4 sm:py-2 text-sm font-medium leading-5 justify-center items-center flex gap-2 outline-none border-none h-10 [flex:1] sm:h-auto sm:[flex:unset] whitespace-nowrap"
                          >
                            Merch
                          </button>
                          <button
                            class="trends-tabs-wrapper-button p-2 sm:px-4 sm:py-2 text-sm font-medium leading-5 justify-center items-center flex gap-2 outline-none border-none h-10 [flex:1] sm:h-auto sm:[flex:unset] whitespace-nowrap"
                          >
                            Custom Request
                          </button>
                        </div>

                        <!-- button -->
                        <button
                          class="flex justify-center items-center gap-2.5 pl-4 pr-2 py-1 z-[1] [clip-path:polygon(0_0,100%_0,100%_100%,8%_100%)] bg-black [&.disabled]:grayscale [&.disabled]:bg-[#e6e6e6] [&.disabled]:cursor-default group max-[591px]:hidden hover:bg-[#07f468] group/button"
                        >
                          <div class="whitespace-nowrap">
                            <span
                              class="text-base font-medium text-[#07f468] hover:text-black group-hover/button:hover:text-black"
                              >All Orders</span
                            >
                          </div>

                          <img
                            src="https://i.ibb.co.com/v28S0Zt/arrow-up-right.webp"
                            alt="arrow-up-right"
                            class="w-5 h-5 [filter:brightness(0)_saturate(100%)_invert(75%)_sepia(67%)_saturate(2300%)_hue-rotate(86deg)_brightness(100%)_contrast(98%)] group-[&.disabled]:[filter:brightness(0)] group-hover/button:[filter:brightness(0)_saturate(100%)]"
                          />
                        </button>
                      </div>

                      <!-- flexbox-table-data -->
                      <div
                        class="w-full min-h-[25.375rem] flex justify-center items-center"
                      >
                        <!-- tab-content-item (Subscriptions) -->
                        <div
                          class="flex flex-col justify-center gap-2 w-full h-full pb-8 min-w-0 min-h-0"
                        >
                          <div
                            class="flex justify-center items-center p-4 pt-0"
                          >
                            <div
                              class="flex justify-center items-center relative w-[10.0625rem] h-[10.0625rem]"
                            >
                              <img
                                src="https://i.ibb.co.com/NgTgvMzS/shopping-cart-big.webp"
                                alt="shopping-cart-big"
                                class="w-32 h-32"
                              />
                            </div>
                          </div>

                          <!-- text-container -->
                          <div
                            class="flex flex-col justify-center items-center gap-2 text-center"
                          >
                            <p class="text-base text-[#344054]">
                              You don’t have any orders at the moment
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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
import { onMounted, onBeforeUnmount, ref } from "vue";
import FanDesktopHeader from "./FanDesktopHeader.vue";
import FanHeroButtons from "./FanHeroButtons.vue";
import FanUserInfo from "./FanUserInfo.vue";
import FanSectionhead from "./FanSectionhead.vue";
import FanSectionCard from "./FanSectionCard.vue";
import TrendingCreatorSlide from "./TrendingCreatorSlide.vue";
import NewToWebsiteCard from "./NewToWebsiteCard.vue";
import TrendingMediaMobileSection from "./TrendingMediaMobileSection.vue";
const splideRef = ref(null);
const prevArrow = ref(null);
const nextArrow = ref(null);

let splides = [];

onMounted(() => {
  if (typeof Splide !== "undefined") {
    // Splide 2
    const splide02 = new Splide("#splide02", {
      type: "slide",
      perMove: 1,
      gap: "8px",
      pagination: false,
      arrows: true,
      drag: true,
      loop: false,
      fixedWidth: "16.6667%",
      breakpoints: {
        1365: {
          fixedWidth: "20%",
          arrows: false,
        },
        1010: {
          fixedWidth: "calc(20% - 6.4px)",
          arrows: false,
        },
        768: {
          fixedWidth: "100%",
          arrows: false,
          pagination: true,
        },
      },
    }).mount();
    splides.push(splide02);
  }

  // expand slide on hover and click
  const slides02 = document.querySelectorAll("#splide02 .splide__slide");
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

  // toggle like button
  const favBtns = document.querySelectorAll("[data-favourite-button]");
  favBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
    });
  });

  // update banner when slide clicked
  const slides = document.querySelectorAll("#splide01 .splide__slide");
  const banners = {
    desktop: document.querySelector('[data-banner="desktop"]'),
    tablet: document.querySelector('[data-banner="tablet"]'),
    tabletForeground: document.querySelector(
      '[data-banner="tablet-foreground"]'
    ),
  };

  const updateBanner = (banner, newContent) => {
    if (!banner) return;
    banner.style.transition = "opacity 0.3s ease";
    banner.style.opacity = "0";

    setTimeout(() => {
      banner.innerHTML = `
        <div class="w-full h-full bg-no-repeat bg-cover">
          ${newContent}
        </div>
      `;
      banner.style.opacity = "1";
    }, 300);
  };

  slides.forEach((slide) => {
    slide.addEventListener("click", () => {
      const slideContent = slide.innerHTML.trim();
      updateBanner(banners.desktop, slideContent);
      updateBanner(banners.tablet, slideContent);
      updateBanner(banners.tabletForeground, slideContent);
      slides.forEach((s) => s.classList.remove("active"));
      slide.classList.add("active");
    });
  });

  const splide = splideRef.value?.splide;

  if (splide) {
    prevArrow.value.addEventListener("click", () => splide.go("<"));
    nextArrow.value.addEventListener("click", () => splide.go(">"));
  }
});

// cleanup splide instances when component unmounts
onBeforeUnmount(() => {
  splides.forEach((splide) => {
    if (splide && typeof splide.destroy === "function") splide.destroy();
  });
});

const creators = [
  {
    username: "muusername",
    avatar: "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
    verified: true,
    backgroundImage: "https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp",
    bio: "Rope addicted bunny sharing all my kink and hentai works!",
    gallery: [
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
    ],
    stats: [
      { icon: "https://i.ibb.co.com/gZfGQhSp/profile.webp", value: 10 },
      { icon: "https://i.ibb.co.com/vCFQPp7N/heart.webp", value: 3 },
      { icon: "https://i.ibb.co.com/8LGTj3jC/logo.webp", value: 1 },
      { icon: "https://i.ibb.co.com/V0yqgLxY/eye.webp", value: 2 },
    ],
    tags: ["tag1", "tag2", "tag3", "tag4"],
  },
  {
    username: "muusername",
    avatar: "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
    verified: true,
    backgroundImage: "https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp",
    bio: "Rope addicted bunny sharing all my kink and hentai works!",
    gallery: [
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
    ],
    stats: [
      { icon: "https://i.ibb.co.com/gZfGQhSp/profile.webp", value: 10 },
      { icon: "https://i.ibb.co.com/vCFQPp7N/heart.webp", value: 3 },
      { icon: "https://i.ibb.co.com/8LGTj3jC/logo.webp", value: 1 },
      { icon: "https://i.ibb.co.com/V0yqgLxY/eye.webp", value: 2 },
    ],
    tags: ["tag1", "tag2", "tag3", "tag4"],
  },
  {
    username: "muusername",
    avatar: "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
    verified: true,
    backgroundImage: "https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp",
    bio: "Rope addicted bunny sharing all my kink and hentai works!",
    gallery: [
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
    ],
    stats: [
      { icon: "https://i.ibb.co.com/gZfGQhSp/profile.webp", value: 10 },
      { icon: "https://i.ibb.co.com/vCFQPp7N/heart.webp", value: 3 },
      { icon: "https://i.ibb.co.com/8LGTj3jC/logo.webp", value: 1 },
      { icon: "https://i.ibb.co.com/V0yqgLxY/eye.webp", value: 2 },
    ],
    tags: ["tag1", "tag2", "tag3", "tag4"],
  },
  {
    username: "muusername",
    avatar: "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
    verified: true,
    backgroundImage: "https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp",
    bio: "Rope addicted bunny sharing all my kink and hentai works!",
    gallery: [
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
    ],
    stats: [
      { icon: "https://i.ibb.co.com/gZfGQhSp/profile.webp", value: 10 },
      { icon: "https://i.ibb.co.com/vCFQPp7N/heart.webp", value: 3 },
      { icon: "https://i.ibb.co.com/8LGTj3jC/logo.webp", value: 1 },
      { icon: "https://i.ibb.co.com/V0yqgLxY/eye.webp", value: 2 },
    ],
    tags: ["tag1", "tag2", "tag3", "tag4"],
  },
  {
    username: "muusername",
    avatar: "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
    verified: true,
    backgroundImage: "https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp",
    bio: "Rope addicted bunny sharing all my kink and hentai works!",
    gallery: [
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
    ],
    stats: [
      { icon: "https://i.ibb.co.com/gZfGQhSp/profile.webp", value: 10 },
      { icon: "https://i.ibb.co.com/vCFQPp7N/heart.webp", value: 3 },
      { icon: "https://i.ibb.co.com/8LGTj3jC/logo.webp", value: 1 },
      { icon: "https://i.ibb.co.com/V0yqgLxY/eye.webp", value: 2 },
    ],
    tags: ["tag1", "tag2", "tag3", "tag4"],
  },
  {
    username: "muusername",
    avatar: "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
    verified: true,
    backgroundImage: "https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp",
    bio: "Rope addicted bunny sharing all my kink and hentai works!",
    gallery: [
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
    ],
    stats: [
      { icon: "https://i.ibb.co.com/gZfGQhSp/profile.webp", value: 10 },
      { icon: "https://i.ibb.co.com/vCFQPp7N/heart.webp", value: 3 },
      { icon: "https://i.ibb.co.com/8LGTj3jC/logo.webp", value: 1 },
      { icon: "https://i.ibb.co.com/V0yqgLxY/eye.webp", value: 2 },
    ],
    tags: ["tag1", "tag2", "tag3", "tag4"],
  },
  {
    username: "muusername",
    avatar: "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
    verified: true,
    backgroundImage: "https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp",
    bio: "Rope addicted bunny sharing all my kink and hentai works!",
    gallery: [
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
    ],
    stats: [
      { icon: "https://i.ibb.co.com/gZfGQhSp/profile.webp", value: 10 },
      { icon: "https://i.ibb.co.com/vCFQPp7N/heart.webp", value: 3 },
      { icon: "https://i.ibb.co.com/8LGTj3jC/logo.webp", value: 1 },
      { icon: "https://i.ibb.co.com/V0yqgLxY/eye.webp", value: 2 },
    ],
    tags: ["tag1", "tag2", "tag3", "tag4"],
  },
  {
    username: "muusername",
    avatar: "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
    verified: true,
    backgroundImage: "https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp",
    bio: "Rope addicted bunny sharing all my kink and hentai works!",
    gallery: [
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
    ],
    stats: [
      { icon: "https://i.ibb.co.com/gZfGQhSp/profile.webp", value: 10 },
      { icon: "https://i.ibb.co.com/vCFQPp7N/heart.webp", value: 3 },
      { icon: "https://i.ibb.co.com/8LGTj3jC/logo.webp", value: 1 },
      { icon: "https://i.ibb.co.com/V0yqgLxY/eye.webp", value: 2 },
    ],
    tags: ["tag1", "tag2", "tag3", "tag4"],
  },
  {
    username: "muusername",
    avatar: "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
    verified: true,
    backgroundImage: "https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp",
    bio: "Rope addicted bunny sharing all my kink and hentai works!",
    gallery: [
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
    ],
    stats: [
      { icon: "https://i.ibb.co.com/gZfGQhSp/profile.webp", value: 10 },
      { icon: "https://i.ibb.co.com/vCFQPp7N/heart.webp", value: 3 },
      { icon: "https://i.ibb.co.com/8LGTj3jC/logo.webp", value: 1 },
      { icon: "https://i.ibb.co.com/V0yqgLxY/eye.webp", value: 2 },
    ],
    tags: ["tag1", "tag2", "tag3", "tag4"],
  },
  {
    username: "muusername",
    avatar: "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
    verified: true,
    backgroundImage: "https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp",
    bio: "Rope addicted bunny sharing all my kink and hentai works!",
    gallery: [
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
    ],
    stats: [
      { icon: "https://i.ibb.co.com/gZfGQhSp/profile.webp", value: 10 },
      { icon: "https://i.ibb.co.com/vCFQPp7N/heart.webp", value: 3 },
      { icon: "https://i.ibb.co.com/8LGTj3jC/logo.webp", value: 1 },
      { icon: "https://i.ibb.co.com/V0yqgLxY/eye.webp", value: 2 },
    ],
    tags: ["tag1", "tag2", "tag3", "tag4"],
  },
  {
    username: "muusername",
    avatar: "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
    verified: true,
    backgroundImage: "https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp",
    bio: "Rope addicted bunny sharing all my kink and hentai works!",
    gallery: [
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
    ],
    stats: [
      { icon: "https://i.ibb.co.com/gZfGQhSp/profile.webp", value: 10 },
      { icon: "https://i.ibb.co.com/vCFQPp7N/heart.webp", value: 3 },
      { icon: "https://i.ibb.co.com/8LGTj3jC/logo.webp", value: 1 },
      { icon: "https://i.ibb.co.com/V0yqgLxY/eye.webp", value: 2 },
    ],
    tags: ["tag1", "tag2", "tag3", "tag4"],
  },
  {
    username: "muusername",
    avatar: "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
    verified: true,
    backgroundImage: "https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp",
    bio: "Rope addicted bunny sharing all my kink and hentai works!",
    gallery: [
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
    ],
    stats: [
      { icon: "https://i.ibb.co.com/gZfGQhSp/profile.webp", value: 10 },
      { icon: "https://i.ibb.co.com/vCFQPp7N/heart.webp", value: 3 },
      { icon: "https://i.ibb.co.com/8LGTj3jC/logo.webp", value: 1 },
      { icon: "https://i.ibb.co.com/V0yqgLxY/eye.webp", value: 2 },
    ],
    tags: ["tag1", "tag2", "tag3", "tag4"],
  },
  {
    username: "muusername",
    avatar: "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
    verified: true,
    backgroundImage: "https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp",
    bio: "Rope addicted bunny sharing all my kink and hentai works!",
    gallery: [
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
      "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
    ],
    stats: [
      { icon: "https://i.ibb.co.com/gZfGQhSp/profile.webp", value: 10 },
      { icon: "https://i.ibb.co.com/vCFQPp7N/heart.webp", value: 3 },
      { icon: "https://i.ibb.co.com/8LGTj3jC/logo.webp", value: 1 },
      { icon: "https://i.ibb.co.com/V0yqgLxY/eye.webp", value: 2 },
    ],
    tags: ["tag1", "tag2", "tag3", "tag4"],
  },
];

const newWebsiteCardArr = [
  {
    username: "Janna Gordove",
    verified: true,
    backgroundImage: "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
    statusText: "Updated recently",
    userInfo: ["Black", "22", "PH"],
    tags: ["Animation-Anime", "Cosplay"],
  },
  {
    username: "Janna Gordove",
    verified: true,
    backgroundImage: "https://i.ibb.co.com/bjGQxr5S/sample-bg-image.webp",
    statusText: "New uploads",
    userInfo: ["22"],
  },
  {
    username: "Janna Gordove",
    verified: true,
    backgroundImage: "https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp",
    statusText: "Updated recently",
    userInfo: ["Black", "22", "PH"],
    tags: ["Animation-Anime", "Cosplay"],
  },
  {
    username: "Janna Gordove",
    verified: true,
    backgroundImage: "https://i.ibb.co.com/jPw7ChWb/auth-bg.webp",
    statusText: "Updated recently",
    userInfo: ["Black", "22", "PH"],
    tags: ["Animation-Anime", "Cosplay"],
  },
  {
    username: "Janna Gordove",
    verified: true,
    backgroundImage: "https://i.ibb.co.com/F4cf3W53/profile-slidein-bg.webp",
    statusText: "Updated recently",
    userInfo: ["Black", "22", "PH"],
    tags: ["Animation-Anime", "Cosplay"],
  },
  {
    username: "Janna Gordove",
    verified: true,
    backgroundImage: "https://i.ibb.co.com/bjGQxr5S/sample-bg-image.webp",
    statusText: "New uploads",
    userInfo: ["22"],
  },
];
</script>

<style>
.splide__arrows {
  display: none !important;
}
.splide__track--nav > .splide__list > .splide__slide.is-active {
  border: none;
}
</style>
