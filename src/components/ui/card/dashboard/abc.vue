<template>

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dash Analytics Components</title>

    <!-- poppins font -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com"  />
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
      rel="stylesheet"
    />

    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Custom CSS -->
    <script>
      tailwind.config = {
          darkMode: 'class',
          theme: {
              extend: {
                  screens: {
                      sm: '480px',
                      md: '768px',
                      lg: '1010px',
                      xl: '1365px',
                  },
                  fontFamily: {
                      sans: ['Poppins', 'Inter', 'Montserrat', 'Open Sans', 'arial', 'sans-serif'],
                  },
                  colors: {
                      primary: {
                          pink: '#FF0066',
                          'pink-dark': '#b30047',
                          'pink-light': '#FF1A76',
                          gradient: {
                              start: '#37FFD7',
                              end: '#07F468',
                              'start-dark': '#00ab91',
                              'end-dark': '#06c454'
                          }
                      },
                      text: {
                          primary: '#0C111D',
                          secondary: '#FCFAFF',
                          tertiary: '#FCFCFD',
                          dark: {
                              primary: '#e8e6e3',
                              secondary: '#dec8ff',
                              tertiary: '#e6e4e1',
                              muted: '#dbd8d3'
                          }
                      },
                      bg: {
                          overlay: 'rgba(0, 0, 0, 0.3)',
                          card: 'rgba(255, 255, 255, 0.25)',
                          form: 'hsla(0, 0%, 100%, 0.5)',
                          dark: {
                              switch: '#181a1b',
                              overlay: 'rgba(24,26,27,0.3)',
                              form: 'rgba(24,26,27,0.5)'
                          },
                          gradient: {
                              overlay: 'rgba(0,0,0,0.45)',
                              'overlay-dark': 'rgba(24,26,27,0.45)',
                              overlayLg: 'rgba(0,0,0,0.9)',
                              'overlayLg-dark': 'rgba(24,26,27,0.9)'
                          }
                      },
                      border: {
                          tab: '#F2F4F7',
                          input: '#0C111D',
                          'tab-dark': '#333739',
                          'input-dark': '#857c6d'
                      },
                      gray: {
                          500: '#6B7280',
                          800: '#1F2937'
                      }
                  }
              },
          },
      }
    </script>
  </head>
  <body class="font-sans p-0 m-0 box-border">
    <section class="flex flex-col md:p-8 gap-6 bg-gray-500 dark:bg-gray-800">
      <!-- token-tip-step-2b-top-up-amount-3-->
      <div
        class="token-popup-container flex flex-col w-full overflow-visible shadow-[0px_0px_20px_0px_rgba(0,0,0,0.25)] dark:shadow-[0px_0px_20px_0px_rgba(24,26,27,0.25)] backdrop-blur-[50px] relative md:w-max md:max-w-[31.6875rem] lg:max-w-none"
      >
        <!-- close-icon -->
        <div
          class="hidden absolute w-10 h-10 top-2 right-2 z-10 md:flex justify-center items-center cursor-pointer rounded-full bg-transparent [backdrop-filter:blur(0)] [filter:drop-shadow(0_0_20px_#FFFFFF)] md:w-12 md:h-12 md:-top-6 md:-right-6 md:bg-bg-overlay dark:md:bg-bg-dark-overlay md:[backdrop-filter:blur(20px)] md:[filter:none]"
        >
          <img
            class="w-6 h-6 [filter:brightness(0)_saturate(100%)_invert(90%)_sepia(9%)_saturate(72%)_hue-rotate(183deg)_brightness(105%)_contrast(91%)] md:w-[2.125rem] md:h-[2.125rem] md:[filter:none]"
            src="https://i.ibb.co.com/XrzfWZFN/svgviewer-png-output-35.webp"
            alt="close-icon"
          />
        </div>

        <div
          class="mobile-responsive-navbar fixed sm:absolute sm:bg-transparent sm:backdrop-blur-0 sm:transition-none w-full top-0 right-0 z-10 flex md:hidden justify-between items-center p-2 cursor-pointer bg-transparent"
        >
          <div class="w-10 h-10 flex justify-center items-center br-rounded">
            <img
              src="https://i.ibb.co.com/8njxTqWK/chevron-left.webp"
              alt="chevron-left"
              class="w-6 h-6 [filter:brightness(0)_saturate(100%)_invert(90%)_sepia(9%)_saturate(72%)_hue-rotate(183deg)_brightness(105%)_contrast(91%)] md:w-[2.125rem] md:h-[2.125rem] md:[filter:none] cursor-pointer"
            />
          </div>
          <div class="w-10 h-10 flex justify-center items-center br-rounded">
            <img
              class="w-6 h-6 [filter:brightness(0)_saturate(100%)_invert(90%)_sepia(9%)_saturate(72%)_hue-rotate(183deg)_brightness(105%)_contrast(91%)] md:w-[2.125rem] md:h-[2.125rem] md:[filter:none] cursor-pointer"
              src="https://i.ibb.co.com/XrzfWZFN/svgviewer-png-output-35.webp"
              alt="close-icon"
            />
          </div>
        </div>

        <!-- column-container -->
        <div
          class="column-container flex flex-col lg:flex-row sm:pb-0 max-h-screen sm:max-h-[unset] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-order-style:none] [scrollbar-width:none]"
        >
          <!-- left-column -->
          <div
            class="w-full h-80 flex bg-[url('https://i.ibb.co.com/bjGQxr5S/sample-bg-image.webp')] bg-cover bg-center min-h-[23.4375rem] sm:min-h-[20rem] lg:w-[20.1875rem] lg:min-h-[unset] lg:h-[unset]"
          >
            <!-- Overlay Container -->
            <div
              class="w-full flex items-end bg-gradient-to-b from-transparent via-transparent to-bg-gradient-overlay dark:to-bg-gradient-overlay-dark lg:to-bg-gradient-overlayLg dark:lg:to-bg-gradient-overlayLg-dark"
            >
              <!-- Text Container -->
              <div
                class="p-2 flex flex-col gap-2.5 [filter:drop-shadow(0_0_0.5rem_rgba(0,0,0,0.5))] md:p-4"
              >
                <p
                  class="text-xl leading-[1.875rem] text-white dark:text-text-dark-primary font-medium"
                >
                  I would love to get some tip if you appreciate my content. :)
                  **** 123
                </p>
                <div class="flex flex-col">
                  <div class="flex gap-1 items-center">
                    <span
                      class="text-sm leading-5 text-text-secondary dark:text-text-dark-secondary font-medium"
                      >Princess Carrot Pop</span
                    >
                    <img
                      src="https://i.ibb.co.com/nMhY8CpS/svgviewer-png-output-22.webp"
                      alt="verified-tick"
                      class="w-[0.6875rem] h-[0.625rem]"
                    />
                  </div>
                  <span
                    class="text-xs leading-[1.125rem] text-text-tertiary dark:text-text-dark-tertiary font-medium"
                    >@sammisjelly187</span
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- right-column -->
          <div
            class="w-full min-h-[unset] bg-bg-card dark:bg-bg-dark-form flex flex-col sm:min-h-[36.875rem] md:min-h-[32.375rem] md:max-w-[31.6875rem] lg:max-w-none lg:w-[32.5625rem] lg:min-h-[33.625rem]"
          >
            <!-- tabs-content-container -->
            <div class="flex flex-col">
              <!-- top-up input section -->
              <div
                class="flex flex-col gap-4 px-2 pt-4 pb-6 md:px-4 md:pt-4 lg:px-6 lg:pt-6 xl:p-6"
              >
                <!-- top-up input section top -->
                <div class="flex flex-col gap-6">
                  <!-- back-button -->
                  <div
                    class="hidden md:flex items-center gap-0.5 w-max h-[1.125rem] cursor-pointer"
                  >
                    <img
                      src="https://i.ibb.co.com/8njxTqWK/chevron-left.webp"
                      alt="chevron-left"
                      class="w-4 h-4"
                    />
                    <span
                      class="text-xs font-medium text-[#475467] dark:text-[#b1aaa0]"
                      >Back</span
                    >
                  </div>

                  <div class="flex flex-col gap-2">
                    <p
                      class="font-semibold text-text-primary dark:text-text-dark-muted text-base leading-6 md:text-lg md:leading-7"
                    >
                      Enter Top Up Amount
                    </p>
                    <!-- alert-container -->
                    <div data-dashboard-toast="alert" class="w-full relative">
                      <div
                        class="w-full border-b-[0.5px] border-[#344054] bg-[#242424] flex relative"
                      >
                        <div
                          class="hidden md:block w-[0.188rem] block bg-[#FF4405]"
                        ></div>
                        <div
                          class="flex gap-4 py-3 px-2 flex-1 min-w-0 min-h-0 [background:linear-gradient(0deg,rgba(255,68,5,0.3),rgba(255,68,5,0.3)),linear-gradient(90deg,rgba(0,0,0,0)0%,rgba(0,0,0,0.9)100%)] before:absolute before:content-[''] before:top-0 before:left-0 before:w-full before:h-full before:bg-[linear-gradient(90deg,rgba(0,0,0,0)0%,rgba(0,0,0,0.9)100%)] relative"
                        >
                          <div class="relative w-full flex gap-4">
                            <div class="relative">
                              <img
                                src="https://i.ibb.co.com/Y49kymq4/alert-icon.webp"
                                alt="alert-icon"
                                class="h-10"
                              />
                            </div>

                            <div class="flex flex-col">
                              <p class="text-sm font-semibold text-[#ff4405]">
                                Input value exceeds maximum allowance (14,000
                                tokens)
                              </p>
                              <div class="flex justify-end items-end">
                                <button
                                  class="flex items-center gap-1 p-0 bg-transparent outline-none border-none cursor-pointer"
                                >
                                  <span
                                    class="text-xs leading-normal font-medium text-[#ff4405]"
                                    >Set to Max</span
                                  >
                                  <img
                                    src="https://i.ibb.co.com/8njxTqWK/chevron-left.webp"
                                    alt="chevron-left"
                                    class="w-4 h-4 [filter:brightness(100)] rotate-180"
                                  />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      class="flex justify-between items-end gap-2 border-b border-b-border-input dark:border-b-border-input-dark"
                    >
                      <div class="flex items-center gap-2">
                        <img
                          src="https://i.ibb.co.com/VprH7dBg/token-tip-svg.webp"
                          alt="token-tip-svg"
                          class="w-12 h-12"
                        />
                        <input
                          type="text"
                          value="16,200"
                          class="token-input w-full border-none bg-transparent outline-none text-primary-pink dark:text-primary-pink-dark text-[2.5rem] font-semibold leading-[3.75rem] [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      <span
                        class="text-lg font-semibold pb-[0.313rem] text-text-primary dark:text-text-dark-primary"
                        >tokens</span
                      >
                    </div>
                  </div>
                </div>

                <!-- top-up input section bottom -->
                <div class="flex flex-col gap-4 pt-7 pb-4">
                  <div class="w-full relative">
                    <div
                      data-slider-track-base
                      class="absolute top-0 left-0 h-[13px] w-full bg-[#34405480] rounded-full z-[1]"
                    ></div>
                    <div
                      data-tip-range-slider-track-fill
                      class="absolute top-0 left-0 h-[13px] bg-[linear-gradient(90deg,#9198FF_0%,#FF8DDF_122.28%,#FF0066_244.56%)] rounded-full z-[2]"
                      style="width: 8.57143%;"
                    ></div>
                    <input
                      data-tip-range-slider
                      type="range"
                      min="100"
                      max="14000"
                      value="14000"
                      step="1"
                      class="appearance-none w-full h-[13px] rounded-full bg-transparent relative outline-none border-none z-[2] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[2.75rem] [&::-webkit-slider-thumb]:h-[2.75rem] [&::-webkit-slider-thumb]:bg-[url('https://i.ibb.co.com/2Y7SmcW6/slider-icon.webp')] [&::-webkit-slider-thumb]:bg-[length:120%] [&::-webkit-slider-thumb]:bg-[position:center] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-none [&::-webkit-slider-thumb]:mt-[-4px] [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-[3] [&::-webkit-slider-thumb]:overflow-visible [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-[2.75rem] [&::-moz-range-thumb]:h-[2.75rem] [&::-moz-range-thumb]:bg-[url('https://i.ibb.co.com/2Y7SmcW6/slider-icon.webp')] [&::-moz-range-thumb]:bg-[length:120%] [&::-moz-range-thumb]:bg-[position:center] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:relative [&::-moz-range-thumb]:z-[3] [&::-moz-range-thumb]:overflow-visible"
                    />
                  </div>

                  <div class="flex justify-between items-center">
                    <span
                      class="text-[14px] leading-[20px] font-poppins text-white"
                      >100</span
                    >
                    <span
                      class="text-[14px] leading-[20px] font-poppins text-white"
                      >300</span
                    >
                    <span
                      class="text-[14px] leading-[20px] font-poppins text-white"
                      >600</span
                    >
                    <span
                      class="text-[14px] leading-[20px] font-poppins text-white"
                      >1,500</span
                    >
                    <span
                      class="text-[14px] leading-[20px] font-poppins text-white"
                      >4,500</span
                    >
                    <span
                      class="text-[14px] leading-[20px] font-poppins text-white"
                      >14,000</span
                    >
                  </div>
                </div>
              </div>
            </div>

            <div
              class="flex flex-col mt-auto bg-white/50 dark:bg-[#181a1b80] pb-[3.25rem] sm:pb-0"
            >
              <!-- top-up amount table section -->
              <div
                class="flex flex-col gap-3 py-2 px-2 mt-auto md:px-4 md:mt-[unset] lg:px-6 pb-0 sm:pb-2"
              >
                <!-- row -->
                <div
                  class="flex justify-between items-center pt-2 border-t border-transparent"
                >
                  <span
                    class="text-xs leading-normal text-text-primary dark:text-text-dark-primary"
                    >Your Balance</span
                  >
                  <div class="flex items-center gap-1">
                    <img
                      src="https://i.ibb.co.com/VprH7dBg/token-tip-svg.webp"
                      alt="token-tip-svg"
                      class="w-6 h-6"
                    />
                    <span
                      class="text-sm leading-[1.25rem] text-text-primary dark:text-text-dark-primary"
                      >100</span
                    >
                  </div>
                </div>

                <!-- row -->
                <div
                  class="flex justify-between items-center border-t border-transparent"
                >
                  <span
                    class="text-xs leading-normal text-text-primary dark:text-text-dark-primary"
                    >Top Up Amount</span
                  >
                  <div class="flex items-center gap-1">
                    <span
                      class="text-sm leading-[1.25rem] text-text-primary dark:text-text-dark-primary"
                      >+</span
                    >
                    <img
                      src="https://i.ibb.co.com/VprH7dBg/token-tip-svg.webp"
                      alt="token-tip-svg"
                      class="w-6 h-6"
                    />
                    <span
                      class="text-sm leading-[1.25rem] text-text-primary dark:text-text-dark-primary"
                      >100</span
                    >
                  </div>
                </div>

                <!-- row (total) -->
                <div
                  class="flex justify-between items-center pt-2 border-t border-[#fcfcfd]"
                >
                  <span
                    class="text-xs leading-normal font-semibold text-text-primary dark:text-text-dark-primary"
                    >Total After Top Up</span
                  >
                  <div class="flex items-center gap-1">
                    <img
                      src="https://i.ibb.co.com/VprH7dBg/token-tip-svg.webp"
                      alt="token-tip-svg"
                      class="w-6 h-6"
                    />
                    <span
                      class="text-lg font-semibold text-text-primary dark:text-text-dark-primary"
                      >600</span
                    >
                  </div>
                </div>

                <!-- row (final) -->
                <div
                  class="flex justify-between items-center pt-2 border-t border-[#fcfcfd]"
                >
                  <span
                    class="text-xs leading-normal font-semibold text-text-primary dark:text-text-dark-primary"
                    >Final Payment</span
                  >
                  <div class="flex flex-col items-end gap-1">
                    <div class="flex items-center gap-1">
                      <div
                        class="bg-gradient-to-r from-primary-gradient-start dark:from-primary-gradient-start-dark to-primary-gradient-end dark:to-primary-gradient-end-dark shadow-[-1px_1px_8px_0px_#35FFD340,1px_-1px_8px_0px_#1CF89940] dark:shadow-[-1px_1px_8px_0px_#00ac9040,1px_-1px_8px_0px_#06b97f40] flex justify-center items-center w-max"
                      >
                        <div
                          class="flex justify-center items-center gap-[0.1875rem] pt-0.5 px-1"
                        >
                          <span
                            class="text-[0.625rem] text-[#182230] font-semibold leading-normal dark:text-[#d1cdc7]"
                            >30% OFF</span
                          >
                        </div>
                      </div>
                      <span
                        class="text-base font-semibold text-text-primary dark:text-text-dark-primary"
                        >USD$ 123.45</span
                      >
                    </div>

                    <span
                      class="text-[0.625rem] leading-[1.125rem] text-text-primary dark:text-text-dark-primary line-through"
                      >USD$ 123.45</span
                    >
                  </div>
                </div>
              </div>

              <!-- button -->
              <div
                class="flex justify-end items-end mt-auto fixed sm:relative bottom-0 right-0 z-[100000] sm:z-auto"
              >
                <div class="h-11 md:h-14 shadow-[0px_0px_16px_0px_#FFFFFF80]">
                  <button
                    class="relative flex justify-center items-center gap-2 w-[11.75rem] h-11 md:h-14 bg-[#98a2b3] hover:bg-white px-4 backdrop-blur-[100px] transition-all duration-200 group pointer-events-none"
                  >
                    <!-- Pseudo-element for the skewed background -->
                    <div
                      class="absolute top-0 -left-3 w-8 h-full bg-[#98a2b3] [transform:skew(163deg,0)_translateX(3px)] backdrop-blur-[100px] shadow-[-12px_0px_16px_0px_#ffffff40] group-hover:bg-white transition-colors duration-200 z-[-1]"
                    ></div>

                    <span
                      class="text-base text-white font-medium leading-6 group-hover:text-[#FF0066] whitespace-nowrap transition-all duration-200"
                    >
                      Pay USD$ 123.45
                    </span>
                    <img
                      src="https://i.ibb.co.com/NdmC2BjP/arrow-right.webp"
                      alt="arrow-right"
                      class="w-6 h-6 group-hover:[filter:brightness(0)_saturate(100%)_invert(17%)_sepia(87%)_saturate(5028%)_hue-rotate(328deg)_brightness(98%)_contrast(114%)] transition-all duration-200"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <script defer>
      // range slider
      const slider = document.querySelector("[data-tip-range-slider]");
      const trackFill = document.querySelector("[data-tip-range-slider-track-fill]");

      function updateTrackFill() {
          const percent = (slider.value / slider.max) * 100;
          trackFill.style.width = `${percent}%`;
      }

      slider.addEventListener("input", updateTrackFill);
      updateTrackFill();

      // Scroll detection code
      const navbar = document.querySelector(".mobile-responsive-navbar");
      const popupContainer = document.querySelector(".token-popup-container");
      const scrollableContainer = document.querySelector(".column-container");
      const scrollThreshold = 10;

      function handleScroll() {
          console.log("scrolled", scrollableContainer.scrollTop);
          if (scrollableContainer.scrollTop > scrollThreshold) {
              navbar.classList.add('backdrop-blur-[400px]', 'bg-gradient-to-b', 'from-[rgba(240,240,240,0.5)]', 'to-[rgba(240,240,240,0.375)]', 'transition-all', 'duration-300', 'ease-linear');
          } else {
              navbar.classList.remove('backdrop-blur-[400px]', 'bg-gradient-to-b', 'from-[rgba(240,240,240,0.5)]', 'to-[rgba(240,240,240,0.375)]', 'transition-all', 'duration-300', 'ease-linear');
          }
      }

      scrollableContainer.addEventListener('scroll', handleScroll);

      // Check initial state
      handleScroll();
    </script>
  </body>
</html>

</template>