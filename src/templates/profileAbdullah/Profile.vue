<template>
  <div>
    <!-- main-slider -->
    <div class="fixed top-0 left-0 w-[110%] z-[-1] h-screen">
      <!-- profile-main-slider -->
      <div id="splide01" class="splide visible h-full">
        <div class="splide__track px-0 h-full">
          <ul class="splide__list">
            <!-- Slide 1 -->
            <li
              class="splide__slide w-full before:content-[''] before:block before:w-full before:absolute before:h-full before:top-0 before:left-0 before:z-[2] max-[580px]:before:[background:transparent] before:[background:linear-gradient(180deg,rgba(0,0,0,0.03)_-0.17%,rgba(0,0,0,0.15)_100%)]"
            >
              <img
                class="w-full h-full object-cover object-center ml-[-5%] [will-change:filter] pointer-events-none [filter:blur(var(--blur))] [-mt:var(--blur)] [height:calc(100%_+_var(--blur))]"
                src="@/assets/images/backgroundSlides/profile-slidein-bg.webp"
                alt="profile-slidein-bg"
              />
            </li>

            <!-- Slide 2 -->
            <li
              class="splide__slide w-full before:content-[''] before:block before:w-full before:absolute before:h-full before:top-0 before:left-0 before:z-[2] max-[580px]:before:[background:transparent] before:[background:linear-gradient(180deg,rgba(0,0,0,0.03)_-0.17%,rgba(0,0,0,0.15)_100%)]"
            >
              <img
                class="w-full h-full object-cover object-center ml-[-5%] [will-change:filter] pointer-events-none [filter:blur(var(--blur))] [-mt:var(--blur)] [height:calc(100%_+_var(--blur))]"
                src="@/assets/images/backgroundSlides/sample-bg-image.webp"
                alt="sample-bg-image"
              />
            </li>

            <!-- Slide 3 -->
            <li
              class="splide__slide w-full before:content-[''] before:block before:w-full before:absolute before:h-full before:top-0 before:left-0 before:z-[2] max-[580px]:before:[background:transparent] before:[background:linear-gradient(180deg,rgba(0,0,0,0.03)_-0.17%,rgba(0,0,0,0.15)_100%)]"
            >
              <img
                class="w-full h-full object-cover object-center ml-[-5%] [will-change:filter] pointer-events-none [filter:blur(var(--blur))] [-mt:var(--blur)] [height:calc(100%_+_var(--blur))]"
                src="@/assets/images/backgroundSlides/auth-bg.webp"
                alt="auth-bg"
              />
            </li>
          </ul>
        </div>
      </div>

      <!-- blur-overlay -->
      <article
        class="fixed top-0 left-0 w-full h-screen z-[9999] transition-[opacity,background-color] duration-[800ms] bg-[linear-gradient(180deg,rgba(0,0,0,0.03)_-0.17%,rgba(0,0,0,0.15)_100%)] will-change-[opacity,filter] opacity-0"
      ></article>
    </div>

    <!-- header-component -->
    <div
      data-header-component
      class="flex flex-col-reverse justify-between w-full bg-black/30 backdrop-blur-[10px] px-0 fixed top-0 -translate-y-full [transition:transform_0.3s_ease] z-[9999] max-[580px]:[background:linear-gradient(180deg,rgba(0,0,0,0.60)_0%,rgba(0,0,0,0.50)_25%,rgba(0,0,0,0.01)_100%)] max-[580px]:backdrop-blur-[50px] md:px-4 xl:flex-row xl:gap-4 xl:px-12 group [&.scroll-active]:translate-y-0"
    >
      <!-- navigation-section -->
      <div class="xl:pt-[2.813rem]">
        <ul
          class="nav-container flex flex-row justify-around items-center overflow-x-auto whitespace-nowrap flex-nowrap sm:gap-4"
        >
          <!-- menu-item -->
          <li
            class="tab-item flex justify-center gap-1 relative flex-grow opacity-70 [border-bottom:1px_solid_transparent] group active [&.active]:[border-bottom:1px_solid_#07f468] max-[580px]:group-[.active]:[border-bottom:1px_solid_#e7e5e4] [&.active]:opacity-100 xl:flex-[unset] cursor-pointer"
            data-tab="feed"
          >
            <div
              class="flex justify-center flex-grow max-[325px]:px-2 max-[325px]:py-0 px-4 py-[0.639rem] sm:px-4 sm:py-0"
            >
              <span class="block pt-2 pb-2">
                <span
                  class="block text-sm font-medium capitalize text-[#e7e5e4] max-[580px]:group-hover:text-[#e7e5e4] max-[580px]:group-[.active]:text-[#e7e5e4] group-hover:text-[#07f468] group-[.active]:text-[#07f468]"
                  >Feed</span
                >
              </span>

              <div
                class="text-[0.625rem] leading-normal font-medium text-[#07f468]"
              >
                18
              </div>
            </div>
          </li>

          <!-- menu-item -->
          <li
            class="tab-item flex justify-center gap-1 relative flex-grow opacity-70 [border-bottom:1px_solid_transparent] group [&.active]:[border-bottom:1px_solid_#07f468] max-[580px]:group-[.active]:[border-bottom:1px_solid_#e7e5e4] [&.active]:opacity-100 xl:flex-[unset] cursor-pointer"
            data-tab="media"
          >
            <div
              class="flex justify-center flex-grow max-[325px]:px-2 max-[325px]:py-0 px-4 py-[0.639rem] sm:px-4 sm:py-0"
            >
              <span class="block pt-2 pb-2">
                <span
                  class="block text-sm font-medium capitalize text-[#e7e5e4] max-[580px]:group-hover:text-[#e7e5e4] max-[580px]:group-[.active]:text-[#e7e5e4] group-hover:text-[#07f468] group-[.active]:text-[#07f468]"
                  >Media</span
                >
              </span>

              <div
                class="text-[0.625rem] leading-normal font-medium text-[#07f468]"
              >
                18
              </div>
            </div>
          </li>

          <!-- menu-item -->
          <li
            class="tab-item flex justify-center gap-1 relative flex-grow opacity-70 [border-bottom:1px_solid_transparent] group [&.active]:[border-bottom:1px_solid_#07f468] max-[580px]:group-[.active]:[border-bottom:1px_solid_#e7e5e4] [&.active]:opacity-100 xl:flex-[unset] cursor-pointer"
            data-tab="merch"
          >
            <div
              class="flex justify-center flex-grow max-[325px]:px-2 max-[325px]:py-0 px-4 py-[0.639rem] sm:px-4 sm:py-0"
            >
              <span class="block pt-2 pb-2">
                <span
                  class="block text-sm font-medium capitalize text-[#e7e5e4] max-[580px]:group-hover:text-[#e7e5e4] max-[580px]:group-[.active]:text-[#e7e5e4] group-hover:text-[#07f468] group-[.active]:text-[#07f468]"
                  >Merch</span
                >
              </span>

              <div
                class="text-[0.625rem] leading-normal font-medium text-[#07f468]"
              >
                18
              </div>
            </div>
          </li>
        </ul>
      </div>

      <!-- header user profile section -->
      <div
        class="hidden md:flex justify-end items-center gap-4 flex-wrap py-2 xl:justify-[unset]"
      >
        <!-- header-option-button -->
        <div class="hidden flex items-center gap-2 flex-wrap">
          <!-- tip-button -->
          <div
            class="w-[3.75rem] h-[3.75rem] grayscale relative pointer-events-none"
          >
            <span
              class="absolute top-0 left-0 block w-[3.75rem] h-[3.75rem] group/icon"
            >
              <img
                src="@/assets/images/icons/token.webp"
                alt="token"
                class="absolute top-0 left-0 transition-all duration-200 group-hover/icon:opacity-0"
              />
              <img
                src="@/assets/images/icons/token-hover.webp"
                alt="token-hover"
                class="absolute top-0 left-0 transition-all duration-200 opacity-0 duration-[0.4s] group-hover/icon:opacity-100 group-hover/icon:scale-110"
              />
            </span>
          </div>

          <!-- private-call-button -->
          <div
            class="w-[3.75rem] h-[3.75rem] grayscale relative pointer-events-none"
          >
            <span
              class="absolute top-0 left-0 block w-[3.75rem] h-[3.75rem] group/icon"
            >
              <img
                src="@/assets/images/icons/call.webp"
                alt="call"
                class="absolute top-0 left-0 transition-all duration-200 group-hover/icon:opacity-0"
              />
              <img
                src="@/assets/images/icons/call-hover.webp"
                alt="call-hover"
                class="absolute top-0 left-0 transition-all duration-200 opacity-0 duration-[0.4s] group-hover/icon:opacity-100 group-hover/icon:scale-110"
              />
              <img
                src="@/assets/images/icons/online-dot.webp"
                alt="online-dot"
                class="absolute w-[18%] top-0 right-[3px] duration-500"
              />
            </span>
          </div>

          <!-- private-message-button -->
          <div
            class="w-[3.75rem] h-[3.75rem] grayscale relative pointer-events-none"
          >
            <span
              class="absolute top-0 left-0 block w-[3.75rem] h-[3.75rem] group/icon"
            >
              <img
                src="@/assets/images/icons/message.webp"
                alt="message"
                class="absolute top-0 left-0 transition-all duration-200 group-hover/icon:opacity-0"
              />
              <img
                src="@/assets/images/icons/message-hover.webp"
                alt="message-hover"
                class="absolute top-0 left-0 transition-all duration-200 opacity-0 duration-[0.4s] group-hover/icon:opacity-100 group-hover/icon:scale-110"
              />
              <img
                src="@/assets/images/icons/online-dot.webp"
                alt="online-dot"
                class="absolute w-[18%] top-0 right-[3px] duration-500"
              />
            </span>
          </div>
        </div>

        <!-- profile-info -->
        <div class="flex flex-end pl-0">
          <div
            class="inline-flex items-center gap-4 pl-4 border-l border-white"
          >
            <div class="flex flex-col items-start gap-2">
              <!-- user-name-title -->
              <div class="flex items-start gap-4 self-stretch h-6">
                <div class="flex items-center gap-2 flex-grow">
                  <div
                    class="text-sm font-semibold text-[#e7e5e4] line-clamp-1"
                  >
                    @sukii19
                  </div>
                  <img
                    src="@/assets/images/icons/verified-green.webp"
                    alt="verified-green"
                    class="w-4 h-4"
                  />
                </div>
              </div>

              <!-- profile-links-options -->
              <div class="flex justify-end items-center gap-2 w-full">
                <span
                  class="flex justify-center items-center w-8 h-8 bg-[#e9e5d30d] [transition:all_0.3s_ease-in-out] rounded-full border border-[#e9e5d340] cursor-pointer"
                >
                  <img
                    src="@/assets/images/icons/add-normal.webp"
                    alt="add-normal"
                    class="w-4 h-4"
                  />
                </span>

                <span
                  class="hidden justify-center items-center w-8 h-8 bg-[#e9e5d30d] [transition:all_0.3s_ease-in-out] rounded-full border border-[#e9e5d340] active [.active]:bg-[#e9e5d3bf] max-[580px]:[.active]:bg-black/75 max-[580px]:[.active]:shadow-[0_0_10px_0_rgba(7,244,104,0.30),0_0_10px_0_rgba(7,244,104,0.10)] max-[580px]:[.active]:backdrop-blur-[25px] max-[580px]:[.active]:text-[#07F468] max-[580px]:[.active]:border-transparent cursor-pointer"
                >
                  <img
                    src="@/assets/images/icons/add-active.webp"
                    alt="add-active"
                    class="w-4 h-4"
                  />
                </span>

                <span
                  class="flex justify-center items-center w-8 h-8 bg-[#e9e5d30d] [transition:all_0.3s_ease-in-out] rounded-full border border-[#e9e5d340] cursor-pointer"
                >
                  <img
                    src="@/assets/images/icons/like-normal.webp"
                    alt="like-normal"
                    class="w-4 h-4"
                  />
                </span>

                <span
                  class="hidden justify-center items-center w-8 h-8 bg-[#e9e5d30d] [transition:all_0.3s_ease-in-out] rounded-full border border-[#e9e5d340] active [.active]:bg-black/75 max-[580px]:[.active]:bg-black/75 max-[580px]:[.active]:shadow-[0_0_10px_0_rgba(7,244,104,0.30),0_0_10px_0_rgba(7,244,104,0.10)] max-[580px]:[.active]:backdrop-blur-[25px] max-[580px]:[.active]:text-[#07F468] max-[580px]:[.active]:border-transparent cursor-pointer"
                >
                  <img
                    src="@/assets/images/icons/like-active.webp"
                    alt="like-active"
                    class="w-4 h-4"
                  />
                </span>

                <div class="relative cursor-pointer">
                  <span
                    class="flex justify-center items-center w-8 h-8 bg-[#e9e5d30d] [transition:all_0.3s_ease-in-out] rounded-full border border-[#e9e5d340] cursor-pointer"
                  >
                    <img
                      src="@/assets/images/icons/3-dot.webp"
                      alt="3-dot"
                      class="w-4 h-4"
                    />
                  </span>

                  <!-- add-dropdown-menu-here -->
                </div>
              </div>
            </div>

            <div
              class="flex flex-col justify-center items-center cursor-pointer"
            >
              <img
                src="@/assets/images/backgroundSlides/featured-media-bg.webp"
                alt="featured-media-bg"
                class="w-[2.813rem] h-[2.813rem] rounded-[12.5rem] object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Header User Profile Section for large & small mobile (767 - 300) -->
      <div class="flex justify-between items-center px-2 py-1 md:hidden">
        <!-- back-button -->
        <div class="flex justify-center items-center w-10 h-10">
          <img
            src="@/assets/images/icons/chevron-left.webp"
            alt="chevron-left"
            class="w-6 h-6"
          />
        </div>

        <!-- creator-details -->
        <div class="flex items-center gap-1">
          <!-- creator-information-container -->
          <div class="flex items-center gap-2 h-6 py-1">
            <!-- creator-avatar-container -->
            <div class="w-6 h-6 relative">
              <!-- avatar -->
              <div class="w-full h-full rounded-full">
                <img
                  src="@/assets/images/backgroundSlides/featured-media-bg.webp"
                  alt="featured-media-bg"
                  class="w-full h-full rounded-full object-cover"
                />
              </div>
              <!-- Online-user-signal -->
              <span
                class="block absolute right-0 bottom-[0.188rem] w-1.5 h-1.5 bg-[#07F468] rounded-full"
              ></span>
            </div>

            <div class="flex flex-col">
              <!-- name & tick mark container -->
              <div class="flex items-center gap-1">
                <div class="text-sm font-semibold text-[#98A2B3] line-clamp-1">
                  @sukii19
                </div>
                <div class="flex justify-center items-center w-2.5 h-2.5">
                  <img
                    src="@/assets/images/icons/svgviewer-png-output-22.webp"
                    alt="verified-tick"
                    class="w-full h-full object-cover"
                  />
                </div>
              </div>

              <!-- creator-stats-container -->
              <div class="flex items-center gap-3">
                <!-- followers -->
                <div class="flex items-center gap-1">
                  <div class="flex justify-center items-center">
                    <img
                      src="@/assets/images/icons/eye.webp"
                      alt="eye"
                      class="w-4 h-4 [filter:brightness(0)_saturate(100%)_invert(45%)_sepia(12%)_saturate(707%)_hue-rotate(183deg)_brightness(92%)_contrast(88%)]"
                    />
                  </div>
                  <span class="text-xs leading-normal text-[#667085]">18</span>
                </div>

                <!-- likes -->
                <div class="flex items-center gap-1">
                  <div class="flex justify-center items-center">
                    <img
                      src="@/assets/images/icons/like-normal.webp"
                      alt="like-normal"
                      class="w-4 h-4 [filter:brightness(0)_saturate(100%)_invert(45%)_sepia(12%)_saturate(707%)_hue-rotate(183deg)_brightness(92%)_contrast(88%)]"
                    />
                  </div>
                  <span class="text-xs leading-normal text-[#667085]">5</span>
                </div>
              </div>
            </div>

            <!-- action -->
            <div class="flex justify-center items-center w-5 h-5">
              <img
                src="@/assets/images/icons/3-dots-horizontal.webp"
                alt="3-dots-horizontal"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- profile-avatar -->
        <div class="flex justify-center items-center relative w-9 h-9 py-1">
          <!-- avatar -->
          <div class="w-9 h-9 rounded-full">
            <img
              src="@/assets/images/backgroundSlides/featured-media-bg.webp"
              alt="featured-media-bg"
              class="w-full h-full rounded-full object-cover"
            />
          </div>
          <!-- Online-user-signal -->
          <span
            class="block absolute right-0 bottom-[0.188rem] w-2 h-2 bg-[#07F468] rounded-full"
          ></span>
        </div>
      </div>
    </div>

    <!-- container -->
    <section
      class="relative overflow-hidden bg-[linear-gradient(180deg,rgba(0,0,0,0.03)_-0.17%,rgba(0,0,0,0.5)_100%)]"
    >
      <!-- profile-hero -->
      <section
        data-section="banner"
        class="w-full h-screen relative [transition:opacity_0.8s] z-0"
      >
        <!-- header -->
        <div class="w-full">
          <!-- header-wrapper -->
          <div
            class="relative md:bg-[linear-gradient(180deg,rgba(0,0,0,0.30)_0%,rgba(0,0,0,0.00)_100%)]"
          >
            <!-- header-inner-wrapper -->
            <div
              class="flex justify-between items-center gap-6 relative z-[2] h-14 md:h-[4.375rem]"
            >
              <!-- navigation and logo section -->
              <div
                class="flex justify-start items-center gap-[3.375rem] px-2 md:px-4 xl:pr-12"
              >
                <div class="flex items-center gap-1 md:gap-4">
                  <!-- logo-section -->
                  <div class="opacity-50 sm:opacity-100">
                    <a href="#" class="hidden opacity-70 leading-[0] xl:block">
                       <!-- // disini -->
                      <img
                        src="@/assets/images/icons/website-logo.webp"
                        alt="our-website-logo-full"
                        class="w-[8.9375rem] h-[2.375rem]"
                      />
                    </a>

                    <a href="#" class="flex leading-[0] xl:hidden">
                      <img
                        src="@/assets/images/icons/our-website-full-white-logo.webp"
                        alt="our-website-full-white-logo"
                        class="w-7 h-7"
                      />
                    </a>
                  </div>
                </div>
              </div>

              <!-- Header Right Button Group -->
              <div
                class="flex justify-end items-center gap-4 pl-0 pr-2 py-2 h-full relative cursor-pointer z-[10000] sm:pl-12 md:pr-4 md:py-0 md:h-[4.375rem]"
              >
                <!-- before-slaint -->
                <div
                  class="hidden absolute right-0 top-0 w-full h-full bg-[#0c111d80] backdrop-blur-[50px] [clip-path:polygon(0%_0%,100%_0,105%_105%,16%_105%)] md:block"
                ></div>

                <!-- button-group -->
                <div class="flex justify-end items-center gap-4 cursor-pointer">
                  <!-- cart-button-wrapper -->
                  <div class="flex justify-center items-center w-10 h-10">
                    <div class="relative cursor-pointer">
                      <span
                        class="flex justify-center items-center w-10 h-10 relative"
                      >
                        <img
                          src="@/assets/images/icons/cart-1.webp"
                          alt="cart-1"
                          class="w-[1.8rem] h-[1.8rem] [filter:brightness(100)_saturate(0)]"
                        />
                      </span>

                      <!-- add dropdown here -->
                    </div>
                  </div>

                  <!-- notification-button-wrapper -->
                  <div class="flex justify-center items-center w-10 h-10">
                    <div class="relative cursor-pointer">
                      <span
                        class="flex justify-center items-center w-10 h-10 relative"
                      >
                        <img
                          src="@/assets/images/icons/bell-1.webp"
                          alt="bell-1"
                          class="w-[1.8rem] h-[1.8rem] [filter:brightness(100)_saturate(0)]"
                        />
                      </span>

                      <!-- add dropdown here -->
                    </div>
                  </div>

                  <!-- language -->
                  <div class="flex justify-center items-center w-10 h-10">
                    <div class="relative cursor-pointer">
                      <span
                        class="flex justify-center items-center w-10 h-10 relative"
                      >
                        <img
                          src="@/assets/images/icons/globe-1.webp"
                          alt="globe-1"
                          class="w-[1.8rem] h-[1.8rem] [filter:brightness(100)_saturate(0)]"
                        />
                      </span>

                      <!-- add dropdown here -->
                    </div>
                  </div>
                </div>

                <!-- avatar-section-wrapper -->
                <div class="w-10 h-10 cursor-pointer">
                  <div class="relative">
                    <!-- avatar -->
                    <div
                      class="bg-grey w-9 h-9 aspect-square rounded-[25%_75%_50%_51%_/_45%_65%_36%_55%] relative overflow-hidden"
                    >
                      <img
                        src="@/assets/images/backgroundSlides/featured-media-bg.webp"
                        alt="featured-media-bg"
                        class="w-full h-full absolute top-0 left-0 object-cover"
                      />
                    </div>

                    <!-- Online-user-signal -->
                    <span
                      class="block absolute right-[0.313rem] bottom-[0.188rem] w-2 h-2 bg-[#07F468] rounded-full"
                    ></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- profile-info -->
        <div class="flex justify-end px-4 pt-4 xl:px-12">
          <!-- profile-info -->
          <div
            class="hidden items-center gap-4 pr-2.5 border-r border-white md:inline-flex"
          >
            <div class="flex flex-col items-start gap-2">
              <!-- user-name-title -->
              <div class="flex items-start gap-4 self-stretch h-6">
                <div class="flex items-center gap-2 flex-grow">
                  <div class="text-base font-semibold text-white line-clamp-1">
                    @sukii19
                  </div>
                  <img
                    src="@/assets/images/icons/verified-green.webp"
                    alt="verified-green"
                    class="w-4 h-4"
                  />
                </div>
              </div>

              <!-- profile-info-list -->
              <div class="flex items-start gap-4 opacity-70 relative z-[-1]">
                <div class="flex flex-col items-center gap-0.5">
                  <span class="text-xs leading-normal text-white"
                    >Followers</span
                  >
                  <span class="text-sm text-white">35</span>
                </div>

                <div class="flex flex-col items-center gap-0.5">
                  <span class="text-xs leading-normal text-white">Likes</span>
                  <span class="text-sm text-white">14</span>
                </div>

                <div class="flex flex-col items-center gap-0.5">
                  <span class="text-xs leading-normal text-white"
                    >Subscribers</span
                  >
                  <span class="text-sm text-white">2</span>
                </div>
              </div>
            </div>

            <!-- creator-avatar-container -->
            <div class="flex flex-col justify-center items-center">
              <img
                src="@/assets/images/backgroundSlides/featured-media-bg.webp"
                alt="featured-media-bg"
                class="w-16 h-16 rounded-full object-cover"
              />
            </div>
          </div>
        </div>

        <!-- right-button-section -->
        <div
          class="flex flex-col gap-4 absolute top-0 right-2 z-[999] mt-32 sm:mt-[4.09375rem] md:top-[10.313rem] md:right-4 xl:right-12"
        >
          <div class="relative flex flex-col gap-2 lg:gap-4">
            <div
              class="flex items-end relative w-12 sm:w-15 md:w-[5.34375rem] cursor-pointer"
            >
              <!--group animate-slidefromleft hover:animate-slidefromright-->
              <img
                src="@/assets/images/icons/token.webp"
                alt="tip-token"
                class="w-12 sm:w-15 md:w-[5.25rem]"
              />
            </div>

            <div
              class="flex items-end relative w-12 sm:w-15 md:w-[5.34375rem] cursor-pointer"
            >
              <!--group animate-slidefromleft hover:animate-slidefromright-->
              <img
                src="@/assets/images/icons/call.webp"
                alt="call"
                class="w-12 sm:w-15 md:w-[5.25rem]"
              />
              <img
                src="@/assets/images/icons/online-dot.webp"
                alt="online-dot"
                class="absolute top-1 right-2 w-1.5 h-1.5 sm:w-2 sm:h-2 md:hidden"
              />
            </div>

            <div
              class="flex items-end relative w-12 sm:w-15 md:w-[5.34375rem] cursor-pointer"
            >
              <!--group animate-slidefromleft hover:animate-slidefromright-->
              <img
                src="@/assets/images/icons/message.webp"
                alt="message"
                class="w-12 sm:w-15 md:w-[5.25rem]"
              />
              <img
                src="@/assets/images/icons/online-dot.webp"
                alt="online-dot"
                class="absolute top-1 right-2 w-1.5 h-1.5 sm:w-2 sm:h-2 md:hidden"
              />
            </div>
          </div>
        </div>

        <!-- bottom-section -->
        <div
          class="flex flex-col items-end absolute left-0 bottom-0 w-full pb-14 px-0 z-[-1] sm:pb-12 md:flex-row md:px-4 md:pb-6 xl:px-12 xl:pb-12"
        >
          <!-- hero-info -->
          <div
            class="flex flex-col gap-2 w-full max-[580px]:justify-end max-[580px]:h-screen max-[580px]:bg-[linear-gradient(180deg,rgba(0,0,0,0.00)_25%,rgba(0,0,0,0.15)_75%)] md:block lg:w-1/2"
          >
            <div class="flex flex-col gap-1 px-2.5 md:gap-4 md:px-0 xl:gap-0">
              <h1
                class="hidden items-center gap-1 text-xl leading-normal font-semibold text-white md:flex md:text-5xl md:leading-[3.75rem] xl:text-6xl xl:leading-[4.5rem] xl:mb-5 xl:mt-[.67em]"
              >
                Sukii19
                <div class="flex w-3.5 h-3.5 md:hidden">
                  <img
                    src="@/assets/images/icons/svgviewer-png-output-22.webp"
                    alt="verified-tick"
                    class="w-3.5 h-3.5"
                  />
                </div>
              </h1>

              <!-- Mobile Avatar message online row -->
              <div class="flex gap-2 md:hidden">
                <!-- Avatar Wrapper -->
                <div class="relative">
                  <!-- avatar -->
                  <div
                    class="bg-[#2970FF] w-16 h-16 aspect-square rounded-[25%_75%_50%_51%_/_45%_65%_36%_55%] relative overflow-hidden"
                  >
                    <img
                      src="@/assets/images/backgroundSlides/featured-media-bg.webp"
                      alt="featured-media-bg"
                      class="w-full h-full absolute top-0 left-0 object-cover"
                    />
                  </div>

                  <!-- Online-user-signal -->
                  <span
                    class="block absolute right-[0.313rem] bottom-[0.188rem] w-2 h-2 bg-[#07F468] rounded-full"
                  ></span>
                </div>
              </div>

              <div class="flex flex-col gap-1 md:hidden">
                <h1
                  class="hidden items-center gap-1 text-xl leading-normal font-semibold text-white md:flex md:text-5xl md:leading-[3.75rem] xl:text-6xl xl:leading-[4.5rem] xl:mb-5"
                >
                  Sukii19
                  <div class="flex w-3.5 h-3.5 md:hidden">
                    <img
                      src="@/assets/images/icons/svgviewer-png-output-22.webp"
                      alt="verified-tick"
                      class="w-3.5 h-3.5"
                    />
                  </div>
                </h1>

                <!-- profile-info-list -->
                <div class="flex items-start gap-3 opacity-70">
                  <div class="flex items-center gap-1">
                    <span class="flex items-center">
                      <img
                        src="@/assets/images/icons/profile.webp"
                        alt="profile"
                        class="w-3.5 h-3.5 [filter:brightness(0)_saturate(100%)_invert(90%)_sepia(9%)_saturate(72%)_hue-rotate(183deg)_brightness(105%)_contrast(91%)]"
                      />
                    </span>
                    <span class="text-sm font-light text-[#EAECF0]">35</span>
                  </div>

                  <div class="flex items-center gap-1">
                    <span class="flex items-center">
                      <img
                        src="@/assets/images/icons/heart.webp"
                        alt="heart"
                        class="w-3.5 h-3.5 [filter:brightness(0)_saturate(100%)_invert(90%)_sepia(9%)_saturate(72%)_hue-rotate(183deg)_brightness(105%)_contrast(91%)]"
                      />
                    </span>
                    <span class="text-sm font-light text-[#EAECF0]">14</span>
                  </div>

                  <div class="flex items-center gap-1">
                    <span class="flex items-center">
                      <img
                        src="@/assets/images/icons/logo.webp"
                        alt="logo"
                        class="w-3.5 h-3.5 [filter:brightness(0)_saturate(100%)_invert(90%)_sepia(9%)_saturate(72%)_hue-rotate(183deg)_brightness(105%)_contrast(91%)]"
                      />
                    </span>
                    <span class="text-sm font-light text-[#EAECF0]">2</span>
                  </div>
                </div>

                <div class="flex gap-1">
                  <span
                    class="text-xs leading-normal text-[#FCFCFD] line-clamp-1"
                    >@sukii19</span
                  >
                  <span
                    class="text-xs leading-normal text-[#FCFCFD] line-clamp-1"
                    >/</span
                  >
                  <span
                    class="text-xs leading-normal text-[#FCFCFD] line-clamp-1"
                    >22</span
                  >
                  <span
                    class="text-xs leading-normal text-[#FCFCFD] line-clamp-1"
                    >/</span
                  >
                  <span
                    class="text-xs leading-normal text-[#FCFCFD] line-clamp-1"
                    >Hong Kong</span
                  >
                </div>
              </div>

              <div class="flex items-center gap-1 py-2 md:hidden">
                <!-- tip-button -->
                <div class="flex gap-1">
                  <div
                    class="flex justify-end relative pl-[1.875rem] md:flex-grow md:pl-0"
                  >
                    <span
                      class="absolute top-1/2 left-0 -translate-y-1/2 z-[1]"
                    >
                      <img
                        src="@/assets/images/icons/token.webp"
                        alt="token"
                        class="w-12 h-12"
                      />
                    </span>

                    <span
                      class="flex justify-center items-center text-sm text-white w-[5.594rem] h-8 px-2 border border-[#e9e5d380] bg-black/10 backdrop-blur-[25px] [transition:all_0.3s_ease-in-out] max-[580px]:rounded-[0_50px_50px_0] max-[580px]:[border:0.5px_solid_#FF9AD0] max-[580px]:[background:linear-gradient(0deg,rgba(0,0,0,0.75)_0%,rgba(0,0,0,0.75)_100%),linear-gradient(180deg,rgba(232,3,174,0.54)_0%,rgba(232,3,174,0.60)_100%)] max-[580px]:shadow-[0_0_10px_0_rgba(232,3,174,0.30),0_0_10px_0_rgba(232,3,174,0.10),0_ 0_10px_0_rgba(232,3,174,0.30)_inset] md:w-[90%]"
                      >Tip</span
                    >
                  </div>
                </div>

                <span
                  class="flex justify-center items-center w-8 h-8 bg-black/10 border border-[#e9e5d380] rounded-full [transition:all_0.3s_ease-in-out] cursor-pointer md:w-12 md:h-12"
                >
                  <img
                    src="@/assets/images/icons/heart.webp"
                    alt="heart"
                    class="w-4 h-4 [filter:brightness(0)_saturate(100%)_invert(84%)_sepia(12%)_saturate(222%)_hue-rotate(12deg)_brightness(105%)_contrast(97%)]"
                  />
                </span>

                <span
                  class="flex justify-center items-center w-8 h-8 bg-black/10 border border-[#e9e5d380] rounded-full [transition:all_0.3s_ease-in-out] cursor-pointer md:w-12 md:h-12"
                >
                  <img
                    src="@/assets/images/icons/link.webp"
                    alt="link"
                    class="w-4 h-4 [filter:brightness(0)_saturate(100%)_invert(84%)_sepia(12%)_saturate(222%)_hue-rotate(12deg)_brightness(105%)_contrast(97%)]"
                  />
                </span>

                <div class="relative cursor-pointer">
                  <span
                    class="flex justify-center items-center w-8 h-8 rounded-full [transition:all_0.3s_ease-in-out] md:w-12 h-12"
                  >
                    <img
                      src="@/assets/images/icons/3-dot.webp"
                      alt="3-dot"
                      class="w-4 h-4 [filter:brightness(0)_saturate(100%)_invert(84%)_sepia(12%)_saturate(222%)_hue-rotate(12deg)_brightness(105%)_contrast(97%)]"
                    />
                  </span>
                </div>
              </div>

              <p class="xl:mb-5 max-w-[45rem] min-w-[45rem]">
                <span
                  class="text-base text-white line-clamp-2 sm:leading-7 md:text-lg"
                  >I love eating! watch me eat different food every 8pm EST
                  time👅!Here is Jenny’s bio. I love eating! watch me eat
                  different food every Week. Here is Jenny's bio.</span
                >
                <span
                  class="text-xs leading-normal font-semibold text-[#07F468] md:text-sm"
                >
                  <span
                    class="text-xs leading-normal font-medium text-white md:text-sm md:font-semibold"
                    >...</span
                  >
                  Read more
                </span>
              </p>

              <div
                class="hidden items-center gap-[0.3125rem] py-2 md:flex md:py-0"
              >
                <span
                  class="flex justify-center items-center w-8 h-8 bg-black/10 border border-[#e9e5d380] rounded-full [transition:all_0.3s_ease-in-out] cursor-pointer md:w-12 md:h-12"
                >
                  <img
                    src="@/assets/images/icons/heart.webp"
                    alt="heart"
                    class="w-4 h-4 md:w-6 md:h-6 [filter:brightness(0)_saturate(100%)_invert(84%)_sepia(12%)_saturate(222%)_hue-rotate(12deg)_brightness(105%)_contrast(97%)]"
                  />
                </span>

                <span
                  class="flex justify-center items-center w-8 h-8 bg-black/10 border border-[#e9e5d380] rounded-full [transition:all_0.3s_ease-in-out] cursor-pointer md:w-12 md:h-12"
                >
                  <img
                    src="@/assets/images/icons/link.webp"
                    alt="link"
                    class="w-4 h-4 md:w-6 md:h-6 [filter:brightness(0)_saturate(100%)_invert(84%)_sepia(12%)_saturate(222%)_hue-rotate(12deg)_brightness(105%)_contrast(97%)]"
                  />
                </span>

                <div class="relative cursor-pointer">
                  <span
                    class="flex justify-center items-center w-8 h-8 rounded-full [transition:all_0.3s_ease-in-out] md:w-12 h-12"
                  >
                    <img
                      src="@/assets/images/icons/3-dot.webp"
                      alt="3-dot"
                      class="w-4 h-4 md:w-6 md:h-6 [filter:brightness(0)_saturate(100%)_invert(84%)_sepia(12%)_saturate(222%)_hue-rotate(12deg)_brightness(105%)_contrast(97%)]"
                    />
                  </span>
                </div>
              </div>

              <!-- Gallery Carousel for Tablet and Mobile -->
              <div
                id="splide02"
                class="splide flex w-full py-[.3125rem] [transition:opacity_0.8s] relative md:py-[0.313rem] xl:hidden"
                role="region"
                aria-roledescription="carousel"
              >
                <!-- slider-track -->
                <div
                  class="splide__track w-full px-0 mx-auto md:mr-[unset]"
                  id="splide02-track"
                >
                  <!-- slider list -->
                  <ul
                    id="splide02-list"
                    class="splide__list w-full"
                    role="presentation"
                  >
                    <!-- slider item 1 -->
                    <li
                      class="splide__slide flex flex-col items-start gap-4 z-[-2] border-l-4 border-r-4 border-transparent bg-center bg-cover bg-no-repeat max-[580px]:rounded-sm opacity-50 max-[580px]:!border-none is-active [&.is-active]:opacity-100"
                      style="
                        background-image: url('@/assets/images/backgroundSlides/profile-slidein-bg.webp');
                      "
                    >
                      <img
                        class="hidden"
                        src="@/assets/images/backgroundSlides/profile-slidein-bg.webp"
                        alt="profile-slidein-bg"
                      />
                    </li>

                    <li
                      class="splide__slide flex flex-col items-start gap-4 z-[-2] border-l-4 border-r-4 border-transparent bg-center bg-cover bg-no-repeat max-[580px]:rounded-sm opacity-50 max-[580px]:!border-none is-active [&.is-active]:opacity-100"
                      style="
                        background-image: url('@/assets/images/backgroundSlides/sample-bg-image.webp');
                      "
                    >
                      <img
                        class="hidden"
                        src="@/assets/images/backgroundSlides/profile-slidein-bg.webp"
                        alt="sample-bg-image"
                      />
                    </li>

                    <li
                      class="splide__slide flex flex-col items-start gap-4 z-[-2] border-l-4 border-r-4 border-transparent bg-center bg-cover bg-no-repeat max-[580px]:rounded-sm opacity-50 max-[580px]:!border-none is-active [&.is-active]:opacity-100"
                      style="
                        background-image: url('@/assets/images/backgroundSlides/auth-bg.webp');
                      "
                    >
                      <img
                        class="hidden"
                        src="@/assets/images/backgroundSlides/auth-bg.webp"
                        alt="auth-bg"
                      />
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="flex md:mt-8 xl:mt-16">
              <!-- new-subscriber-button -->
              <div
                class="flex justify-center items-end min-w-[45rem] max-w-[45rem] w-full h-20 cursor-pointer sm:px-5 md:relative"
              >
                <!-- buy-now-button -->
                <button
                  class="flex justify-center items-center gap-1 w-[53%] h-[3.75rem] absolute left-0 bg-black flex-grow px-6 py-[0.313rem] shadow-[0_0_24px_0_rgba(251,4,100,0.25)] md:rounded-[16px_0_0_16px] lg:w-[27.875rem] group/button"
                >
                  <span
                    class="hidden absolute bottom-1 left-0 text-white w-[6.875rem] h-[6.25rem] overflow-hidden md:block"
                  >
                    <span class="w-[6.875rem] h-[6.25rem] block relative">
                      <img
                      src="@/assets/images/icons/subscriber-btn-img.webp"
                      alt="subscriber-btn-img"
                      class="absolute bottom-0 left-0 opacity-100 [transition:all_0.5s_ease-in-out] transition-all duration-500 ease-in-out group-hover/button:animate-bouncedown"
                      />
                      <img
                        src="@/assets/images/icons/subscriber-btn-hover-img.webp"
                        alt="subscriber-btn-hover-img"
                        class="absolute bottom-0 left-0 opacity-0 w-[3.75rem] [transition:all_0.5s_ease-in-out] transition-all duration-500 ease-in-out group-hover/button:animate-bouncup"
                      />
                    </span>
                  </span>

                  <!-- subscribe-hot-tag -->
                  <div
                    class="absolute bottom-12 left-[0.6875rem] text-black md:relative md:bottom-[unset] md:left-[unset]"
                  >
                    <span class="absolute left-[-0.75rem] z-[1] text-black">
                      <span
                        class="absolute top-1 w-[0.8125rem] h-3 shadow-[3px_0_4px_0_rgba(0,0,0,0.25)] z-[-3] text-black"
                      ></span>
                      <img
                        src="@/assets/images/icons/hot-offer.webp"
                        alt="hot-offer"
                        class="w-6 h-6 aspect-square"
                      />
                    </span>

                    <span
                      class="flex justify-center text-sm font-semibold text-black [background:linear-gradient(90deg,#F06_0%,#FF4A92_100%)] pl-3 pr-1.5 py-0.5 rounded backdrop-blur-[10px]"
                      >29% off</span
                    >
                  </div>

                  <!-- tier-price -->
                  <span
                    class="text-xs leading-6 font-medium whitespace-nowrap text-white md:text-sm"
                    >Starting
                    <span
                      class="text-lg leading-[2rem] font-medium text-white -mr-1 md:text-3xl md:leading-[2.375rem] md:-mr-2"
                    >
                      $32
                    </span>
                    <span
                      class="text-xs leading-6 font-medium whitespace-nowrap text-white line-through md:text-sm"
                      >45</span
                    >
                    /mo
                  </span>
                </button>

                <!-- subscribe-button -->
                <div
                  class="absolute right-0 flex flex-col justify-center items-center w-1/2 h-20 min-h-[4.5] pl-12 pr-6 py-4 md:right-4 md:min-w-[20rem] lg:right-0 lg:w-auto"
                >
                  <div
                    class="absolute flex flex-col justify-center items-center gap-2.5 w-full h-20 min-h-[4.5] md:min-w-[20rem] md:w-[-webkit-fill-available] lg:w-auto"
                  >
                    <!-- shape-wrapper -->
                    <div
                      class="absolute h-20 left-[-1.65625rem] sm:left-[-1.625rem]"
                    >
                      <img
                        src="@/assets/images/icons/subscriber-button-shape.webp"
                        alt="subscriber-button-shape"
                        class="w-[1.75rem] h-full"
                      />
                    </div>

                    <button
                      class="flex justify-center items-center self-stretch px-3 py-[0.313rem] bg-[#FB0464] flex-grow md:rounded-[0_16px_16px_0] lg:max-w-[18.9375rem]"
                    >
                      <span
                        class="text-lg font-medium text-white uppercase whitespace-nowrap md:text-2xl lg:text-xl lg:leading-normal xl:text-2xl"
                        >SUBSCRIBE</span
                      >
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- navigation Section for mobile -->
            <div
              class="absolute bottom-0 flex w-full [background:linear-gradient(180deg,rgba(0,0,0,0.60)_0%,rgba(0,0,0,0.50)_25%,rgba(0,0,0,0.01)_100%)] backdrop-blur-[40px] sm:[background:unset] sm:backdrop-blur-0 md:hidden"
            >
              <ul
                class="nav-container flex flex-row items-center w-full overflow-x-auto whitespace-nowrap flex-wrap"
              >
                <!-- menu-item -->
                <li
                  class="tab-item relative flex justify-center gap-1 opacity-70 [border-bottom:1.5px_solid_transparent] group active [&.active]:[border-bottom:1.5px_solid_#07f468] [&.active]:opacity-100 max-[580px]:[&.active]:[border-bottom:1.5px_solid_#E7E5E4] flex-grow cursor-pointer"
                  data-tab="feed"
                >
                  <div
                    class="flex justify-center flex-grow max-[325px]:px-2 max-[325px]:py-0 px-4 py-[0.639rem] sm:px-4 sm:py-0"
                  >
                    <span class="block pt-2 pb-2">
                      <span
                        class="block text-sm font-medium text-[#e7e5e4] max-[580px]:group-hover:text-[#e7e5e4] max-[580px]:group-[.active]:text-[#e7e5e4] group-hover:text-[#07f468] group-[.active]:text-[#07f468]"
                        >Feed</span
                      >
                    </span>

                    <div
                      class="text-[0.625rem] leading-normal font-medium text-[#07f468]"
                    >
                      18
                    </div>
                  </div>
                </li>

                <!-- menu-item -->
                <li
                  class="tab-item relative flex justify-center gap-1 opacity-70 [border-bottom:1.5px_solid_transparent] group [&.active]:[border-bottom:1.5px_solid_#07f468] [&.active]:opacity-100 max-[580px]:[&.active]:[border-bottom:1.5px_solid_#E7E5E4] flex-grow cursor-pointer"
                  data-tab="media"
                >
                  <div
                    class="flex justify-center flex-grow max-[325px]:px-2 max-[325px]:py-0 px-4 py-[0.639rem] sm:px-4 sm:py-0"
                  >
                    <span class="block pt-2 pb-2">
                      <span
                        class="block text-sm font-medium text-[#e7e5e4] max-[580px]:group-hover:text-[#e7e5e4] max-[580px]:group-[.active]:text-[#e7e5e4] group-hover:text-[#07f468] group-[.active]:text-[#07f468]"
                        >Media</span
                      >
                    </span>

                    <div
                      class="text-[0.625rem] leading-normal font-medium text-[#07f468]"
                    >
                      18
                    </div>
                  </div>
                </li>

                <!-- menu-item -->
                <li
                  class="tab-item relative flex justify-center gap-1 opacity-70 [border-bottom:1.5px_solid_transparent] group [&.active]:[border-bottom:1.5px_solid_#07f468] [&.active]:opacity-100 max-[580px]:[&.active]:[border-bottom:1.5px_solid_#E7E5E4] flex-grow cursor-pointer"
                  data-tab="merch"
                >
                  <div
                    class="flex justify-center flex-grow max-[325px]:px-2 max-[325px]:py-0 px-4 py-[0.639rem] sm:px-4 sm:py-0"
                  >
                    <span class="block pt-2 pb-2">
                      <span
                        class="block text-sm font-medium text-[#e7e5e4] max-[580px]:group-hover:text-[#e7e5e4] max-[580px]:group-[.active]:text-[#e7e5e4] group-hover:text-[#07f468] group-[.active]:text-[#07f468]"
                        >Merch</span
                      >
                    </span>

                    <div
                      class="text-[0.625rem] leading-normal font-medium text-[#07f468]"
                    >
                      18
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <!-- profile options -->
          <div class="hidden w-1/2 xl:block">
            <div id="splide03" class="splide w-full [transition:opacity_0.8s]">
              <!-- slider-track -->
              <div
                class="splide__track w-[80%] ml-auto px-0"
                id="splide03-track"
              >
                <!-- slider list -->
                <ul
                  id="splide03-list"
                  class="splide__list w-full"
                  role="presentation"
                >
                  <li
                    class="splide__slide flex flex-col items-start gap-4 relative opacity-50 p-4 bg-cover bg-center bg-no-repeat [transform:scaleY(70%)] z-[-2] [&.is-prev]:flex [&.is-prev]:[transform:scaleY(90%)] [&.is-prev]:z-[-1] [&.is-next]:flex [&.is-next]:[transform:scaleY(90%)] [&.is-next]:z-[-1] [&.is-active]:flex [&.is-active]:!w-[40%] [&.is-active]:[transform:scale(100%,100%)] [&.is-active]:rounded [&.is-active]:opacity-100 [&.is-active]:z-[1] cursor-pointer"
                    style="
                      background-image: url('@/assets/images/backgroundSlides/profile-slidein-bg.webp');
                    "
                  >
                    <img
                      class="hidden"
                      src="@/assets/images/backgroundSlides/profile-slidein-bg.webp"
                      alt="profile-slidein-bg"
                    />
                  </li>

                  <li
                    class="splide__slide flex flex-col items-start gap-4 relative opacity-50 p-4 bg-cover bg-center bg-no-repeat [transform:scaleY(70%)] z-[-2] [&.is-prev]:flex [&.is-prev]:[transform:scaleY(90%)] [&.is-prev]:z-[-1] [&.is-next]:flex [&.is-next]:[transform:scaleY(90%)] [&.is-next]:z-[-1] [&.is-active]:flex [&.is-active]:!w-[40%] [&.is-active]:[transform:scale(100%,100%)] [&.is-active]:rounded [&.is-active]:opacity-100 [&.is-active]:z-[1] cursor-pointer"
                    style="
                      background-image: url('@/assets/images/backgroundSlides/sample-bg-image.webp');
                    "
                  >
                    <img
                      class="hidden"
                      src="@/assets/images/backgroundSlides/sample-bg-image.webp"
                      alt="sample-bg-image"
                    />
                  </li>

                  <li
                    class="splide__slide flex flex-col items-start gap-4 relative opacity-50 p-4 bg-cover bg-center bg-no-repeat [transform:scaleY(70%)] z-[-2] [&.is-prev]:flex [&.is-prev]:[transform:scaleY(90%)] [&.is-prev]:z-[-1] [&.is-next]:flex [&.is-next]:[transform:scaleY(90%)] [&.is-next]:z-[-1] [&.is-active]:flex [&.is-active]:!w-[40%] [&.is-active]:[transform:scale(100%,100%)] [&.is-active]:rounded [&.is-active]:opacity-100 [&.is-active]:z-[1] cursor-pointer"
                    style="
                      background-image: url('@/assets/images/backgroundSlides/auth-bg.webp');
                    "
                  >
                    <img
                      class="hidden"
                      src="@/assets/images/backgroundSlides/auth-bg.webp"
                      alt="auth-bg"
                    />
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- bottom-section -->
      <div
        class="flex flex-col items-stretch max-[580px]:bg-black/25 opacity-100 md:overflow-hidden xl:overflow-auto"
      >
        <!-- feed-tab-content -->
        <div
          class="tab-content active relative flex-1 min-h-[100svh] lg:bg-black/50"
          id="feed-content"
        >
          <div
            class="flex flex-col gap-6 px-2 py-4 bg-black/50 backdrop-blur-[400px] sm:p-4 md:gap-9 lg:flex-grow lg:mx-auto lg:px-12 lg:py-6 lg:bg-transparent"
          >
            <!-- march 2024 section -->
            <section
              class="relative flex flex-col gap-2 lg:flex-row lg:gap-0 lg:w-[calc(100%-9rem)] lg:mx-auto"
            >
              <!-- title-section -->
              <div>
                <Heading text="MARCH" tag="h2" theme="profileFeed" />
                <Heading text="2024" tag="h2" theme="profileFeed" />
              </div>

              <!-- feed-item-container -->
              <div
                class="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:max-w-[62.9375rem]"
              >
                <!-- feed-item (poll) -->
                <FeedPollCard
                  day="31"
                  suffix="st"
                  title="What Should I eat for tonight’s live stream?"
                  :options="[
                    { label: 'Orange', percent: 70, votes: 25, checked: true },
                    { label: 'Apple', percent: 20, votes: 25 },
                    { label: 'Chicken', percent: 10, votes: 25 },
                  ]"
                  :totalVotes="400"
                  timeLeft="24 hours left to vote"
                />

                <!-- feed-item (media) -->
                <FeedMediaCard
                  day="31"
                  suffix="st"
                  description="Jenny is back! Tonight I will eat mostly fruits. -> 8pm EST time 👅!"
                  :likes="205"
                  :comments="16"
                  :bgImage="checkoutHeader"
                  :hoverBg="sampleBg"
                />

                <!-- feed-item (poll) -->
                <FeedPollCard
                  day="31"
                  suffix="st"
                  title="What Should I eat for tonight’s live stream?"
                  :options="[
                    { label: 'Orange', percent: 70, votes: 25, checked: true },
                    { label: 'Apple', percent: 20, votes: 25 },
                    { label: 'Chicken', percent: 10, votes: 25 },
                  ]"
                  :totalVotes="400"
                  timeLeft="24 hours left to vote"
                />

                <!-- feed-item (media) -->
                <FeedMediaCard
                  day="31"
                  suffix="st"
                  description="Jenny is back! Tonight I will eat mostly fruits. -> 8pm EST time 👅!"
                  :likes="205"
                  :comments="16"
                  :bgImage="checkoutHeader"
                  :hoverBg="sampleBg"
                />
              </div>
            </section>

            <!-- february 2024 section -->
            <section
              class="relative flex flex-col gap-2 lg:flex-row lg:gap-0 lg:w-[calc(100%-9rem)] lg:mx-auto"
            >
              <!-- title-section -->
              <div>
                <Heading text="FEBRUARY" tag="h2" theme="profileFeed" />
                <Heading text="2024" tag="h2" theme="profileFeed" />
              </div>

              <!-- feed-item-container -->
              <div
                class="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:max-w-[62.9375rem]"
              >
                <!-- feed-item (poll) -->
                <FeedPollCard
                  day="31"
                  suffix="st"
                  title="What Should I eat for tonight’s live stream?"
                  :options="[
                    { label: 'Orange', percent: 70, votes: 25, checked: true },
                    { label: 'Apple', percent: 20, votes: 25 },
                    { label: 'Chicken', percent: 10, votes: 25 },
                  ]"
                  :totalVotes="400"
                  timeLeft="24 hours left to vote"
                />

                <!-- feed-item (media) -->
                <FeedMediaCard
                  day="31"
                  suffix="st"
                  description="Jenny is back! Tonight I will eat mostly fruits. -> 8pm EST time 👅!"
                  :likes="205"
                  :comments="16"
                  :bgImage="checkoutHeader"
                  :hoverBg="sampleBg"
                />

                <!-- feed-item (poll) -->
                <FeedPollCard
                  day="31"
                  suffix="st"
                  title="What Should I eat for tonight’s live stream?"
                  :options="[
                    { label: 'Orange', percent: 70, votes: 25, checked: true },
                    { label: 'Apple', percent: 20, votes: 25 },
                    { label: 'Chicken', percent: 10, votes: 25 },
                  ]"
                  :totalVotes="400"
                  timeLeft="24 hours left to vote"
                />

                <!-- feed-item (media) -->
                <FeedMediaCard
                  day="31"
                  suffix="st"
                  description="Jenny is back! Tonight I will eat mostly fruits. -> 8pm EST time 👅!"
                  :likes="205"
                  :comments="16"
                  :bgImage="checkoutHeader"
                  :hoverBg="sampleBg"
                />
              </div>
            </section>
          </div>

          <button
            data-create-feed-button
            class="fixed bottom-6 right-2 md:right-6 w-12 h-12 md:w-24 md:h-24 hidden justify-center items-center rounded-full p-2 bg-[#07F468]"
          >
            <img
              src="@/assets/images/icons/file-plus-02.webp"
              alt="file-plus-02"
              class="w-8 h-8 md:w-14 md:h-14"
            />
          </button>
        </div>

        <!-- media-tab-content -->
        <div
          class="tab-content hidden relative flex-1 min-h-[65.25rem] pt-20 md:pt-32"
          id="media-content"
        >
          <!-- pay-per-view-section -->
          <section class="mb-8">
            <!-- title-section -->
            <div
              class="flex justify-between items-center px-2 md:px-4 xl:px-12"
            >
              <!-- title-section__left -->
              <div class="flex gap-3.5 mb-4 xl:mb-6">
                <h2
                  class="text-xl leading-normal font-medium text-[#e9e5d3] pl-4 border-l border-[#e9e5d3]"
                >
                  Pay to View
                </h2>

                <div class="flex items-center gap-1 cursor-pointer opacity-100">
                  <span class="text-sm font-medium text-[#07F468]"
                    >View All</span
                  >
                  <span class="text-sm leading-normal text-[#07F468] self-start"
                    >11</span
                  >
                </div>
              </div>

              <!-- title-section__right -->
              <!-- add splide-arrows-here -->
            </div>

            <!-- Video Category Slider Slide Items -->
            <div class="mx-2 overflow-visible md:mx-4 xl:mx-12">
              <PlayMediaCards :mediaList="myMediaData" />
            </div>
          </section>

          <!-- subscription-section -->
          <section class="mb-8">
            <!-- title-section -->
            <div
              class="flex justify-between items-center px-2 md:px-4 xl:px-12"
            >
              <!-- title-section__left -->
              <div class="flex gap-3.5 mb-4 xl:mb-6">
                <h2
                  class="text-xl leading-normal font-medium text-[#e9e5d3] pl-4 border-l border-[#e9e5d3]"
                >
                  Subscription
                </h2>

                <div class="flex items-center gap-1 cursor-pointer opacity-100">
                  <span class="text-sm font-medium text-[#07F468]"
                    >View All</span
                  >
                  <span class="text-sm leading-normal text-[#07F468] self-start"
                    >15</span
                  >
                </div>
              </div>

              <!-- title-section__right -->
              <!-- add splide-arrows-here -->
            </div>

            <!-- Video Category Slider Slide Items -->
            <div class="mx-2 overflow-visible md:mx-4 xl:mx-12">
              <PlayMediaCards :mediaList="myMediaData" />
            </div>

            <!-- arrow-section -->
            <div class="flex justify-center cursor-pointer">
              <div class="flex justify-center pt-5">
                <span
                  class="flex gap-1 w-8 h-8 whitespace-nowrap text-base text-white"
                >
                  <img
                    src="@/assets/images/icons/chevron-down.webp"
                    alt="chevron-down"
                    class="w-auto h-8"
                  />
                </span>
              </div>
            </div>
          </section>

          <!-- featured-section -->
          <section class="mb-8">
            <!-- title-section -->
            <div
              class="flex justify-between items-center px-2 md:px-4 xl:px-12"
            >
              <!-- title-section__left -->
              <div class="flex gap-3.5 mb-4 xl:mb-6">
                <h2
                  class="text-xl leading-normal font-medium text-[#e9e5d3] pl-4 border-l border-[#e9e5d3]"
                >
                  Subscription
                </h2>

                <div class="flex items-center gap-1 cursor-pointer opacity-100">
                  <span class="text-sm font-medium text-[#07F468]"
                    >View All</span
                  >
                  <!-- <span class="text-sm leading-normal text-[#07F468] self-start">15</span> -->
                </div>
              </div>

              <!-- title-section__right -->
              <!-- add splide-arrows-here -->
            </div>

            <!-- Video Category Slider Slide Items -->
            <div class="mx-2 overflow-visible md:mx-4 xl:mx-12">
              <PlayMediaCards :mediaList="myMediaData" />
            </div>

            <!-- arrow-section -->
            <div class="flex justify-center cursor-pointer">
              <div class="flex justify-center pt-5">
                <span
                  class="flex gap-1 w-8 h-8 whitespace-nowrap text-base text-white"
                >
                  <img
                    src="@/assets/images/icons/chevron-down.webp"
                    alt="chevron-down"
                    class="w-auto h-8"
                  />
                </span>
              </div>
            </div>
          </section>
        </div>

        <!-- merch-tab-content -->
        <div
          class="tab-content hidden relative flex-1 min-h-[100svh]"
          id="merch-content"
        >
          <div
            class="flex flex-col gap-6 px-2 py-4 bg-black/50 backdrop-blur-[400px] sm:p-4 md:gap-9 lg:flex-grow lg:mx-auto lg:px-12 lg:py-6"
          >
            <!-- items-container -->
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              <!-- merch-thumb (normal) -->
              <MerchCard
                bgImage="@/assets/images/backgroundSlides/checkout-header.webp"
                title="My top (washed) Get Jenny’s favourite Mangoes!"
                currency="USD"
                price="$25"
                finalPrice="$25"
                description="Get Jenny’s favourite Mangoes! Buy them while supply last !Get Jenny’s favourite Mangoes! Buy them while supply last !Get Jenny’s favourite Mangoes! Buy them while supply last !"
                overlayBg="linear-gradient(0deg, rgba(255,255,255,0.68) -3.06%, rgba(255,255,255,0) 144.5%), linear-gradient(0deg, rgba(0,0,0,0.1), rgba(0,0,0,0.1))"
                overlayHoverBg="linear-gradient(0deg, rgba(255,255,255,0.9) -3.06%, rgba(255,255,255,0) 144.5%), linear-gradient(0deg, rgba(0,0,0,0.25), rgba(0,0,0,0.25))"
              />

              <!-- merch-thumb (pro) -->
              <MerchCard
                bgImage="@/assets/images/backgroundSlides/checkout-header.webp"
                title="My top (washed) Get Jenny’s favourite Mangoes!"
                currency="USD"
                price="$25"
                finalPrice="$25"
                discountText="10% OFF"
                description="Get Jenny’s favourite Mangoes! Buy them while supply last !Get Jenny’s favourite Mangoes! Buy them while supply last !Get Jenny’s favourite Mangoes! Buy them while supply last !"
                overlayBg="linear-gradient(0deg, rgba(255,205,41,0.68) -3.06%, rgba(255,205,41,0) 117.35%), linear-gradient(0deg, rgba(0,0,0,0.1), rgba(0,0,0,0.1))"
                overlayHoverBg="linear-gradient(0deg, rgba(255,205,41,0.9) -3.06%, rgba(255,205,41,0) 117.35%), linear-gradient(0deg, rgba(0,0,0,0.25), rgba(0,0,0,0.25))"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import Heading from "@/components/dev/default/Heading.vue";
import FeedPollCard from "@/components/ui/card/dashboard/FeedPollCard.vue";
import FeedMediaCard from "@/components/ui/card/dashboard/FeedMediaCard.vue";
import { ref, onMounted, onUnmounted } from "vue";
import PlayMediaCards from "@/components/ui/card/dashboard/PlayMediaCards.vue";
import MerchCard from "@/components/ui/card/dashboard/MerchCard.vue";

// Asset Path
import checkoutHeader from '@/assets/images/backgroundSlides/checkout-header.webp'
import sampleBg from '@/assets/images/backgroundSlides/sample-bg-image-compressed.webp'

// --- MEDIA LIST DATA ---
const myMediaData = ref([
  {
    image: "@/assets/images/backgroundSlides/profile-slidein-bg.webp",
    alt: "Video 1",
    duration: "14:09",
    timeAgo: "2h ago",
    likes: "0",
    views: "0",
    video:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    title: "Building successful teams through collaboration",
  },
  {
    image: "@/assets/images/backgroundSlides/sample-bg-image.webp",
    alt: "Video 2",
    duration: "14:09",
    timeAgo: "2h ago",
    likes: "0",
    views: "0",
    video:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    title: "Building successful teams through collaboration",
  },
  {
    image: "@/assets/images/backgroundSlides/auth-bg.webp",
    alt: "Video 3",
    duration: "14:09",
    timeAgo: "2h ago",
    likes: "0",
    views: "0",
    video:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    title: "Building successful teams through collaboration",
  },
  {
    image: "@/assets/images/backgroundSlides/profile-slidein-bg.webp",
    alt: "Video 4",
    duration: "14:09",
    timeAgo: "2h ago",
    likes: "0",
    views: "0",
    video:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    title: "Building successful teams through collaboration",
  },
  {
    image: "@/assets/images/backgroundSlides/sample-bg-image.webp",
    alt: "Video 5",
    duration: "14:09",
    timeAgo: "2h ago",
    likes: "0",
    views: "0",
    video:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    title: "Building successful teams through collaboration",
  },
  {
    image: "@/assets/images/backgroundSlides/auth-bg.webp",
    alt: "Video 6",
    duration: "14:09",
    timeAgo: "2h ago",
    likes: "0",
    views: "0",
    video:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    title: "Building successful teams through collaboration",
  },
]);

onMounted(() => {
  // --- SPLIDE SLIDERS ---
  if (typeof Splide !== "undefined") {
    const heroSection = document.querySelector('[data-section="banner"]');

    const splide01 = new Splide("#splide01", {
      type: "fade",
      fixedWidth: "100%",
      height: "100vh",
      pagination: false,
      arrows: false,
      cover: false,
      autoplay: false,
      lazyLoad: "nearby",
    }).mount();

    const splide02 = new Splide("#splide02", {
      type: "slide",
      perPage: 3,
      perMove: 1,
      gap: "0.5rem",
      pagination: false,
      arrows: false,
      drag: true,
      fixedWidth: "20%",
      fixedHeight: "5rem",
      breakpoints: {
        768: { fixedWidth: "20%", fixedHeight: "5rem" },
        480: { perPage: 3, fixedWidth: "2.5rem", fixedHeight: "2.5rem" },
      },
    }).mount();

    const splide03 = new Splide("#splide03", {
      type: "loop",
      perPage: 3,
      perMove: 1,
      pagination: false,
      arrows: false,
      drag: true,
      dragMinThreshold: 10,
      fixedWidth: 0,
      fixedHeight: "9.375rem",
      focus: "center",
      gap: "0px",
      padding: { left: 0, right: 0 },
    }).mount();

    function updateActiveClasses(targetIndex) {
      document.querySelectorAll("#splide02 .splide__slide").forEach((slide) => {
        slide.classList.remove("is-active");
      });
      const targetSlide = document.querySelector(
        `#splide02 .splide__slide:nth-child(${targetIndex + 1})`
      );
      if (targetSlide) targetSlide.classList.add("is-active");
    }

    function syncAllSliders(index) {
      splide01.go(index);
      splide02.go(index);
      splide03.go(index);
      updateActiveClasses(index);
    }

    splide02.on("click", (slide) => syncAllSliders(slide.index));
    splide03.on("click", (slide) => syncAllSliders(slide.index));

    splide01.on("moved", (i) => {
      splide02.go(i);
      splide03.go(i);
    });
    splide02.on("moved", (i) => {
      splide01.go(i);
      splide03.go(i);
    });
    splide03.on("moved", (i) => {
      splide01.go(i);
      splide02.go(i);
    });

    setTimeout(() => {
      syncAllSliders(0);
      splide03.refresh();
    }, 100);
  }


  // --- BLUR ON SCROLL ---
  const blurHandler = () => {
    const scrollY = window.scrollY;
    const banner = document.querySelector('[data-section="banner"]');
    if (!banner) return;

    const start = 100,
      end = banner.clientHeight + 200,
      maxBlur = 25;
    let blur =
      scrollY <= start
        ? 0
        : scrollY >= end
        ? maxBlur
        : ((scrollY - start) / (end - start)) * maxBlur;

    document.documentElement.style.setProperty("--blur", `${blur}px`);
  };
  window.addEventListener("scroll", blurHandler);

  // --- HEADER SCROLL EFFECT ---
  const headerScrollHandler = () => {
    const scrollY = window.pageYOffset;
    const headerComponent = document.querySelector("[data-header-component]");
    const createFeedButton = document.querySelector(
      "[data-create-feed-button]"
    );

    if (!headerComponent || !createFeedButton) return;

    if (scrollY > 480) {
      headerComponent.classList.add("scroll-active");
      createFeedButton.classList.add("flex");
      createFeedButton.classList.remove("hidden");
    } else {
      headerComponent.classList.remove("scroll-active");
      createFeedButton.classList.remove("flex");
      createFeedButton.classList.add("hidden");
    }
  };
  window.addEventListener("scroll", headerScrollHandler);

  // --- TABS HANDLER ---
  const navContainers = document.querySelectorAll(".nav-container");

  function switchTab(clickedTab) {
    const tabId = clickedTab.getAttribute("data-tab");
    document.querySelectorAll(".tab-item").forEach((tab) => {
      tab.classList.remove("active");
    });
    document
      .querySelectorAll(`.tab-item[data-tab="${tabId}"]`)
      .forEach((tab) => tab.classList.add("active"));

    document.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.add("hidden");
      content.classList.remove("active");
    });

    const activeContent = document.getElementById(`${tabId}-content`);
    if (activeContent) {
      activeContent.classList.remove("hidden");
      activeContent.classList.add("active");
    }
  }

  navContainers.forEach((container) => {
    container.addEventListener("click", (e) => {
      const clickedTab = e.target.closest(".tab-item");
      if (clickedTab) switchTab(clickedTab);
    });
  });
});

// Clean-up listeners jab component destroy ho jaye
onUnmounted(() => {
  window.removeEventListener("scroll", blurHandler);
});
</script>
