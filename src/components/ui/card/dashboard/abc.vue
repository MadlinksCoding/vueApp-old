<template>
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Merch popup</title>
    <!-- poppins font -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
      rel="stylesheet"
    />

    <!-- Splide CSS/JS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/css/splide.min.css">
    <script src="https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/js/splide.min.js"></script>

    <!-- lightgallery CSS/JS + plugins -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lightgallery@2.7.2/css/lightgallery-bundle.min.css">
    <script src="https://cdn.jsdelivr.net/npm/lightgallery@2.7.2/lightgallery.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/lightgallery@2.7.2/plugins/thumbnail/lg-thumbnail.umd.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/lightgallery@2.7.2/plugins/zoom/lg-zoom.umd.js"></script>

    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            screens: {
              sm: '480px',
              md: '768px',
              lg: '1024px',
              xl: '1365px',
            },
            fontFamily: {
              sans: ['Poppins', 'Inter', 'Montserrat', 'Open Sans', 'arial', 'sans-serif'],
            }
          }
        }
      }
    </script>
  </head>
<body class="bg-[#444444] font-sans p-0 m-0 box-border overflow-x-hidden overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-order-style:none] [scrollbar-width:none] [&.dark]:bg-[#3e4446]">
  <!-- wrapper   -->
  <div class="bg-black/50 relative before:absolute before:inset-0 before:bg-[url('https://i.ibb.co.com/5WQ43b48/sample-bg-image-compressed.webp')] before:bg-cover before:bg-center before:bg-no-repeat before:content-[''] before:z-[-1] dark:bg-[#181a1b]/50">
    <!-- bg-overlay -->
    <div class="absolute inset-0 w-full h-full bg-black/5 backdrop-blur-[125px] pointer-events-none z-[-1] dark:bg-[#181a1b]/5"></div>
  
    <!-- container -->
    <div class="flex flex-col min-h-screen lg:flex-row lg:h-screen lg:overflow-hidden">
      <!-- close-button -->
      <button class="fixed top-4 right-4 flex justify-center items-center w-8 h-8 z-50 drop-shadow-[0px_30px_-34px_#0000004D] cursor-pointer">
          <img src="https://i.ibb.co.com/DfT6Sg5g/x-close.webp" alt="x close" class="w-full h-full [filter:brightness(0)_saturate(100%)_invert(97%)_sepia(1%)_saturate(5636%)_hue-rotate(182deg)_brightness(95%)_contrast(81%)]">
      </button>

      <!-- splide-section -->
      <div class="h-full lg:w-1/2 lg:flex lg:flex-col lg:h-screen lg:overflow-hidden">
        <section data-main-slider class="splide bg-black/25 flex-1 min-h-0 dark:bg-[#181a1b]/25" aria-label="Main Gallery">
            <div class="splide__track h-full">
                <ul class="splide__list h-full items-center"></ul>
            </div>
        </section>

        <section data-thumbs-slider class="splide pt-2 shrink-0" aria-label="Thumbnails">
            <div class="splide__track sm:max-w-[450px] mx-auto lg:max-w-full">
                <ul class="splide__list drop-shadow-[0px_30px_-34px_#0000004D]"></ul>
            </div>
        </section>

        <div data-lightGallery class="hidden"></div>
      </div>

      <!-- text-section -->
      <div class="flex flex-col p-2 lg:w-1/2 lg:h-screen lg:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-order-style:none] [scrollbar-width:none] lg:p-6 lg:px-10">
        <div class="flex flex-col gap-6 lg:gap-10">
            <!-- text-section__header -->
            <div data-text-section-header class="flex flex-col gap-6">
                <!-- title-section -->
                <section class="flex flex-col gap-4 pt-3">
                    <!-- tag-link-section -->
                    <div class="flex items-center gap-1 flex-wrap">
                        <a href="#" class="text-sm text-[#D0D5DD] hover:underline hover:text-[#07F468] dark:text-[#cfcac4] dark:hover:text-[#23f97b]">Seasonal Fruits</a>
                        <span class="text-xs leading-normal tracking-[0.01875rem] text-[#D0D5DD] dark:text-[#cfcac4]">,</span>
                        <a href="#" class="text-sm text-[#D0D5DD] hover:underline hover:text-[#07F468] dark:text-[#cfcac4] dark:hover:text-[#23f97b]">Mostly Eating</a>
                        <span class="text-xs leading-normal tracking-[0.01875rem] text-[#D0D5DD] dark:text-[#cfcac4]">,</span>
                        <a href="#" class="text-sm text-[#D0D5DD] hover:underline hover:text-[#07F468] dark:text-[#cfcac4] dark:hover:text-[#23f97b]">Fried Chicken</a>
                    </div>

                    <h1 class="text-xl leading-normal font-semibold drop-shadow-[0px_0px_10px_#0000001A] text-[#F5F5F4] lg:text-3xl lg:leading-[2.375rem] dark:text-[#e1dfdb]">[Peach] from my farm-Peach from my farm (Autumn harvest)</h1>
                </section>

                <!-- tags-container -->
                <div class="flex items-center gap-2">
                    <img src="https://i.ibb.co.com/ZRFYW4BD/tag-01.webp" alt="tag 01" class="w-4 h-4 min-w-[1rem]">

                    <div class="flex items-center gap-2 flex-wrap">
                        <!-- tag -->
                        <div class="flex justify-center items-center px-2 h-6 bg-[#0C111D] cursor-pointer dark:bg-[#0a0e17]">
                            <span class="text-sm font-medium text-[#F9FAFB] dark:text-[#dddad5]">Featured</span>
                        </div>

                        <!-- tag -->
                        <div class="flex justify-center items-center px-2 h-6 bg-[#0C111D] cursor-pointer dark:bg-[#0a0e17]">
                            <span class="text-sm font-medium text-[#F9FAFB] dark:text-[#dddad5]">Best Seller</span>
                        </div>

                        <!-- tag -->
                        <div class="flex justify-center items-center px-2 h-6 bg-[#0C111D] cursor-pointer dark:bg-[#0a0e17]">
                            <span class="text-sm font-medium text-[#F9FAFB] dark:text-[#dddad5]">Seasonal Offers</span>
                        </div>
                    </div>
                </div>

                <!-- likes-view-container -->
                <div class="flex items-center gap-4 ">
                    <!-- likes -->
                    <div class="flex items-center gap-2 group">
                        <img src="https://i.ibb.co.com/9kNrMyfz/heart.webp" alt="heart" class="block group-[.active]:hidden w-4 h-4">
                        <img src="https://i.ibb.co.com/fVpSgdPJ/heart.webp" alt="heart" class="hidden group-[.active]:block w-4 h-4">
                        <span class="text-base text-[#F2F4F7] dark:text-[#e1dfdb]">123</span>
                    </div>

                    <!-- views -->
                    <div class="flex items-center gap-2">
                        <img src="https://i.ibb.co.com/0V8HcdXr/eye.webp" alt="eye" class="w-4 h-4">
                        <span class="text-base text-[#F2F4F7] dark:text-[#e1dfdb]">2K</span>
                    </div>

                    <!-- merch -->
                    <div class="flex items-center gap-2">
                        <img src="https://i.ibb.co.com/YTqCn1M0/shopping-cart-03.webp" alt="shopping cart 03" class="w-4 h-4">
                        <span class="text-base text-[#F2F4F7] dark:text-[#e1dfdb]">15</span>
                    </div>
                </div>

                <!-- price-display -->
                <div class="flex flex-col gap-2 md:flex-row md:items-center">
                    <!-- price -->
                    <div class="flex items-baseline gap-0.5">
                        <span class="text-6xl leading-[4.5rem] font-semibold align-bottom -tracking-[0.075rem] text-white dark:text-[#e8e6e3]">FREE</span>
                    </div>
                </div>

                <!-- button-container -->
                <div data-button-container class="flex w-full group/button-container sticky bottom-0 [&.is-sticky]:w-[calc(100%+1rem)] [&.is-sticky]:-ml-2 [&.is-sticky]:py-6 [&.is-sticky]:bg-[linear-gradient(0deg,rgba(255,255,255,0.01)_0%,rgba(255,255,255,0)_100%)] [&.is-sticky]:backdrop-blur-[50px]">
                    <button class="relative flex-grow h-14 mx-3 group-[.is-sticky]/button-container:mx-5 border-[3px] border-[#FFE0E3] bg-[#FF44000D] [background-blend-mode:overlay] px-1 transform skew-x-[-24deg] shadow-[0px_0px_40px_0px_#FC190D80_inset,0px_5px_50px_0px_#FC190D80,0px_0px_35px_0px_#FC190D40,0px_0px_10px_0px_#FC190D0D,0px_0px_1px_0px_#FFB6BC_inset] before:absolute before:inset-0 before:w-full before:h-full before:content-[''] before:bg-[url('https://i.ibb.co.com/GfcYM2zK/button-bg.webp')] before:bg-center before:bg-cover before:opacity-40 lg:h-[4.5rem]">
                        <!-- text-container -->
                        <div class="w-full h-full flex justify-center items-center gap-0.5 relative z-[10] skew-x-[24deg]">
                            <span class="text-xl leading-normal font-semibold align-middle text-[#F5F5F5] drop-shadow-[0px_0px_30px_0px_#10182880] whitespace-nowrap lg:text-3xl lg:leading-[2.375rem]">OUT OF STOCK</span>
                        </div>
                    </button>
                </div>
            </div>

            <!-- tab-section -->
            <div class="flex flex-col gap-4 pb-20">
                <!-- tab-button-container -->
                <div class="flex items-center gap-4">
                    <!-- tab-button -->
                    <button data-tab="product-details" class="flex justify-center items-center p-2.5 w-max border-b border-transparent cursor-pointer group/tab-button active [&.active]:border-white dark:[&.active]:border-[#303436]">
                        <span class="text-base opacity-50 group-[.active]/tab-button:opacity-100 text-white dark:text-[#e8e6e3]">Product Details</span>
                    </button>

                    <!-- tab-button -->
                    <button data-tab="shipping-policy" class="flex justify-center items-center p-2.5 w-max border-b border-transparent cursor-pointer group/tab-button [&.active]:border-white dark:[&.active]:border-[#303436]">
                        <span class="text-base opacity-50 group-[.active]/tab-button:opacity-100 text-white dark:text-[#e8e6e3]">Shipping Policy</span>
                    </button>
                </div>

                <!-- tab-container -->
                <div class="flex flex-col">
                    <div data-tab-container="product-details" class="flex flex-col gap-4">
                        <p class="text-sm text-[#F5F5F4] dark:text-[#e1dfdb]">Get Jenny’s favourite Mangoes! Buy them while supply last !Get Jenny’s favourite Mangoes! Buy them while supply last !Get Jenny’s favourite Mangoes! Buy them while supply last !</p>
                    
                        <ul class="flex flex-col">
                            <li class="text-sm text-[#F5F5F4] dark:text-[#e1dfdb] relative pl-4 before:content-[''] before:w-1 before:h-1 before:rounded-full before:bg-white before:absolute before:left-[0.188rem] before:top-[0.438rem]">Get Jenny’s favourite Mangoes!</li>
                            <li class="text-sm text-[#F5F5F4] dark:text-[#e1dfdb] relative pl-4 before:content-[''] before:w-1 before:h-1 before:rounded-full before:bg-white before:absolute before:left-[0.188rem] before:top-[0.438rem]">Buy them while supply last !</li>
                            <li class="text-sm text-[#F5F5F4] dark:text-[#e1dfdb] relative pl-4 before:content-[''] before:w-1 before:h-1 before:rounded-full before:bg-white before:absolute before:left-[0.188rem] before:top-[0.438rem]">Get Jenny’s favourite Mangoes! Buy them while supply last !</li>
                            <li class="text-sm text-[#F5F5F4] dark:text-[#e1dfdb] relative pl-4 before:content-[''] before:w-1 before:h-1 before:rounded-full before:bg-white before:absolute before:left-[0.188rem] before:top-[0.438rem]">Get Jenny’s favourite Mangoes! Buy them while supply last !Get Jenny’s favourite Mangoes! </li>
                            <li class="text-sm text-[#F5F5F4] dark:text-[#e1dfdb] relative pl-4 before:content-[''] before:w-1 before:h-1 before:rounded-full before:bg-white before:absolute before:left-[0.188rem] before:top-[0.438rem]">Buy them while supply last !</li>
                            <li class="text-sm text-[#F5F5F4] dark:text-[#e1dfdb] relative pl-4 before:content-[''] before:w-1 before:h-1 before:rounded-full before:bg-white before:absolute before:left-[0.188rem] before:top-[0.438rem]">Get Jenny’s favourite Mangoes! Buy them while supply last !</li>
                            <li class="text-sm text-[#F5F5F4] dark:text-[#e1dfdb] relative pl-4 before:content-[''] before:w-1 before:h-1 before:rounded-full before:bg-white before:absolute before:left-[0.188rem] before:top-[0.438rem]">Get Jenny’s favourite Mangoes! Buy them while supply last !</li>
                        </ul>
                    </div>

                    <div data-tab-container="shipping-policy" class="hidden flex flex-col gap-4">
                        <div class="flex items-center gap-2">
                            <img src="https://i.ibb.co.com/7NBsK3xG/plane.webp" alt="plane" class="w-5 h-5">
                            <p class="text-sm font-medium text-[#07F468] dark:text-[#23f97b]">This product ships internationally.</p>
                        </div>

                        <div class="hidden items-center gap-2">
                            <img src="https://i.ibb.co.com/fV9JY4v2/marker-pin-06.webp" alt="marker pin 06" class="w-5 h-5">
                            <p class="text-sm font-medium text-[#D7D3D0] dark:text-[#e1dfdb]">This product ships to Taiwan only.</p>
                        </div>

                        <div class="flex gap-4">
                            <span class="w-[12.5rem] min-w-[12.5rem] text-sm text-[#F5F5F4] dark:text-[#e1dfdb]">Deliver from</span>
                            <div class="flex gap-2 items-center grow flex-wrap">
                                <span class="text-sm font-medium text-[#F5F5F4] dark:text-[#e1dfdb]">Taiwan</span>
                            </div>
                        </div>

                        <div class="flex flex-col gap-2">
                            <span class="text-sm font-semibold text-[#F5F5F4] dark:text-[#e1dfdb]">Shipping Fee</span>
                            
                            <div class="flex gap-4">
                                <span class="w-[12.5rem] min-w-[12.5rem] text-xs text-[#F5F5F4] dark:text-[#e1dfdb]">Domestic</span>
                                <div class="flex gap-2 items-center grow flex-wrap">
                                    <span class="text-sm font-medium text-[#F5F5F4] dark:text-[#e1dfdb]">Taiwan</span>
                                </div>
                            </div>

                            <div class="flex gap-4">
                                <span class="w-[12.5rem] min-w-[12.5rem] text-xs text-[#F5F5F4] dark:text-[#e1dfdb]">International</span>
                                <div class="flex gap-2 items-center grow flex-wrap">
                                    <span class="text-sm font-medium text-[#F5F5F4] dark:text-[#e1dfdb]">USD$ 123</span>
                                    <span class="text-xs italic text-[#F5F5F4] dark:text-[#e1dfdb]">Applicable to all countries</span>
                                </div>
                            </div>
                        </div>

                        <div class="flex flex-col gap-2">
                            <span class="text-sm font-semibold text-[#F5F5F4] dark:text-[#e1dfdb]">Delivery & Processing Time</span>
                            
                            <div class="flex gap-4">
                                <span class="w-[12.5rem] min-w-[12.5rem] text-xs text-[#F5F5F4] dark:text-[#e1dfdb]">International</span>
                                <div class="flex gap-2 items-center grow flex-wrap">
                                    <span class="text-sm font-medium text-[#F5F5F4] dark:text-[#e1dfdb]">14-30 days</span>
                                </div>
                            </div>
                        </div>

                        <div class="flex flex-col gap-2">
                            <span class="text-sm font-semibold text-[#F5F5F4] dark:text-[#e1dfdb]">Tracking</span>
                            
                            <p class="text-sm text-[#F5F5F4] dark:text-[#e1dfdb]">Once your order is shipped, you will receive a tracking number via email once Jenny has process your order.</p>
                        </div>

                        <div class="flex flex-col gap-2">
                            <span class="text-sm font-semibold text-[#F5F5F4] dark:text-[#e1dfdb]">Customs and Duties</span>
                            
                            <p class="text-sm text-[#F5F5F4] dark:text-[#e1dfdb]">Please be aware that international shipments may be subject to customs inspections and import duties. These charges are the responsibility of the recipient and vary by country.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- button-container -->
            <div class="flex justify-end items-end gap-2">
                <button class="flex justify-center items-center w-8 h-8 backdrop-blur-[50px] rounded-full border-[0.5px] border-[#E9E5D3] bg-[#E9E5D3]/5 dark:border-[#36311b] dark:bg-[#36311b]/5">
                    <img src="https://i.ibb.co.com/fGdzgLXp/share-06.webp" alt="share 06" class="w-4 h-4">
                </button>

                <button class="flex justify-center items-center w-8 h-8 backdrop-blur-[50px] rounded-full border-[0.5px] border-[#E9E5D3] bg-[#E9E5D3]/5 dark:border-[#36311b] dark:bg-[#36311b]/5">
                    <img src="https://i.ibb.co.com/hFw7MBf2/icon.webp" alt="icon" class="w-4 h-4">
                </button>
            </div>
        </div>
      </div>
    </div>
  </div>

  <!-- handle splide & lightGallery initialization, custom cursor, and parallax effect -->
  <script>
    // Array of image sources for the slider and thumbnails
    const images = [
        { src: "https://picsum.photos/id/1015/1920/1080", thumb: "https://picsum.photos/id/1015/240/160" },
        { src: "https://picsum.photos/id/133/1920/1080", thumb: "https://picsum.photos/id/133/240/160" },
        { src: "https://picsum.photos/id/160/1920/1080", thumb: "https://picsum.photos/id/160/240/160" },
        { src: "https://picsum.photos/id/201/1920/1080", thumb: "https://picsum.photos/id/201/240/160" },
        { src: "https://picsum.photos/id/251/1920/1080", thumb: "https://picsum.photos/id/251/240/160" },
        { src: "https://picsum.photos/id/160/1920/1080", thumb: "https://picsum.photos/id/160/240/160" },
    ];

    /**
     * Builds the slides for both the main slider and thumbnail slider by dynamically inserting HTML elements.
     */
    function buildSlides() {
        const mainList = document.querySelector('[data-main-slider] .splide__list');
        const thumbsList = document.querySelector('[data-thumbs-slider] .splide__list');

        images.forEach((img, i) => {
            mainList.innerHTML += `<li class="splide__slide relative"><img src="${img.src}" alt="Image ${i+1}" class="w-full h-auto block cursor-zoom-in rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.6)]"></li>`;
            thumbsList.innerHTML += `<li class="splide__slide aspect-square backdrop-blur-[10px] border ![border:1px_solid_transparent_!important;] transition-all duration-300 cursor-pointer [&.is-active]:[border:1px_solid_#F5F5F4_!important;] after:content-[''] after:absolute after:inset-0 after:bg-[#222222]/10 after:pointer-events-none dark:after:bg-[#2b2f31]/10 dark:[&.is-active]:[border:1px_solid_#333739_!important;]"><img src="${img.thumb}" alt="Thumb ${i+1}" class="w-full h-full object-cover"></li>`;
        });
    }

    /**
     * Initializes the Splide sliders for the main image display and thumbnails, syncing them together.
     */
    function initSplide() {
        const main = new Splide('[data-main-slider]', {
            type: 'fade',
            pagination: false,
            arrows: false,
            cover: true,
            heightRatio: 1.22445,
            mediaQuery: 'min',
            breakpoints: {
                480: { heightRatio: 1.1755, height: '450px'},
                1024: { heightRatio: 'auto', fixedHeight: '100vh' },

            }
        });

        const thumbs = new Splide('[data-thumbs-slider]', {
            perPage: 6,
            gap: 8,
            pagination: false,
            isNavigation: true,
            arrows: false,
            drag: true,
            mediaQuery: 'min',
        });

        main.sync(thumbs);
        main.mount();
        thumbs.mount();
    }

    // Global variable to hold the LightGallery instance
    let lgInstance;

    /**
     * Initializes LightGallery with dynamic elements and plugins, and sets up parallax effect.
     * @returns {Object} The initialized LightGallery instance.
     */
    function initLightGallery() {
        const container = document.querySelector('[data-lightGallery]');

        const dynamicItems = images.map(img => ({
            src: img.src,
            thumb: img.thumb,
        }));

        setupParallax(container);

        lgInstance = lightGallery(container, {
            dynamic: true,
            dynamicEl: dynamicItems,
            plugins: [lgThumbnail, lgZoom],
            thumbnail: true,
            thumbMargin: 0,
            alignThumbnails: 'middle',
            animateThumb: true,
            zoom: true,
            actualSize: true,
            showZoomInOutIcons: false,
            speed: 400,
            download: false,
            counter: false,
            controls: false,
            showCloseIcon: false,
            addClass: 'lg-custom-thumbs'
        });

        return lgInstance;
    }

    /**
     * Checks if the device has a fine pointer (e.g., mouse) for enabling custom cursor features.
     * @returns {boolean} True if the device has a fine pointer, false otherwise.
     */
    function hasFinePointer() {
        return window.matchMedia('(pointer: fine)').matches;
    }

    /**
     * Sets up parallax effect, custom cursor, and other UI enhancements for the LightGallery container.
     * @param {HTMLElement} container - The LightGallery container element.
     */
    function setupParallax(container) {
        container.addEventListener('lgAfterOpen', () => {
            const outer = document.querySelector('.lg-outer');
            if (!outer) return;

            // Hide default toolbar (includes all controls)
            const toolbar = outer.querySelector('.lg-toolbar');
            if (toolbar) {
                toolbar.classList.add('!hidden');
            }

            const lgImageContainer = outer.querySelector('.lg-content');
            if(lgImageContainer) {
                lgImageContainer.classList.add('!bottom-[7.875rem]');
            }

            // Add custom close button
            const closeBtn = document.createElement('button');
            closeBtn.className = 'fixed top-6 right-6 flex justify-center items-center w-12 h-12 bg-black/30 backdrop-blur-[10px] rounded-full cursor-pointer z-[10000] dark:bg-[#181a1b]/30';
            closeBtn.innerHTML = `
                <img src="https://i.ibb.co.com/DfT6Sg5g/x-close.webp" 
                     alt="x close" 
                     class="w-8 h-8 drop-shadow-[0px_0px_8px_#00000080] [filter:brightness(0)_saturate(100%)_invert(97%)_sepia(1%)_saturate(5636%)_hue-rotate(182deg)_brightness(95%)_contrast(81%)]">
            `;
            closeBtn.addEventListener('click', () => {
                if (lgInstance) lgInstance.closeGallery();
            });
            outer.appendChild(closeBtn);

            // CUSTOM CURSOR (only on lightbox image)
            if (!hasFinePointer()) return;

            const customCursor = document.createElement('div');
            customCursor.id = 'lg-custom-cursor';
            customCursor.className = `flex justify-center items-center w-10 h-10 lg:w-20 lg:h-20 rounded-full bg-black/25 backdrop-blur-[10px] group/cursor dark:bg-[#181a1b]/25 pointer-events-none fixed z-[9999] transition-opacity duration-200`;
            customCursor.innerHTML = `
                <img src="https://i.ibb.co.com/TDGYvfTn/zoom-in.webp" alt="zoom in" class="w-6 h-6 lg:w-10 lg:h-10 zoom-in-icon transition-all duration-200">
                <img src="https://i.ibb.co.com/jdwwgzf/zoom-out.webp" alt="zoom out" class="w-6 h-6 lg:w-10 lg:h-10 zoom-out-icon hidden transition-all duration-200">
            `;
            outer.appendChild(customCursor);

            // Force-hide ALL default cursors (grab, zoom, etc.) **ONLY** on the image elements
            const forceNoCursor = () => {
                const imageAreas = outer.querySelectorAll('.lg-object, .lg-image');
                imageAreas.forEach(el => {
                    if (el) el.style.setProperty('cursor', 'none', 'important');
                });
            };
            forceNoCursor();

            // Inject strong cursor override
            const style = document.createElement('style');
            style.id = 'lg-cursor-override';
            style.innerHTML = `
            @media (pointer: fine) {
                .lg-outer.lg-grab .lg-item img,
                .lg-outer.lg-grabbing .lg-item img {
                    cursor: none !important;
                }
            }
            `;
            document.head.appendChild(style);

            const lgBackgroundWrapper = document.querySelector('.lg-backdrop');
            if (lgBackgroundWrapper) {
                lgBackgroundWrapper.classList.add('after:content-[""]', 'after:absolute', 'after:inset-0', 'after:!bg-black/50', 'after:backdrop-blur-[125px]', 'dark:after:!bg-[#181a1b]/50', 'after:bg-cover', 'after:bg-center', 'after:bg-no-repeat', 'after:z-[1]');
            }

            function updateBackground() {
                const currentImg = outer.querySelector('.lg-current img');
                if (currentImg && lgBackgroundWrapper) {
                    lgBackgroundWrapper.style.backgroundImage = `url(${currentImg.src})`;
                }
            }

            updateBackground();

            const thumbOuter = outer.querySelector('.lg-thumb-outer');
            if (thumbOuter) {
                thumbOuter.classList.add('!bg-transparent')
            }

            const thumbInner = outer.querySelector('.lg-thumb');
            if (thumbInner) {
                thumbInner.classList.add('!w-full', '!flex', 'justify-self-center', 'gap-1', '!bg-transparent', 'drop-shadow-[0px_30px_-34px_#0000004D]', '!p-1', '!m-0', '!flex-nowrap', '!overflow-x-hidden', '!transform-none', '!transition-none', 'md:!w-[45rem]', 'md:!p-2', 'md:gap-2')
            }

            const thumbImageWrappers = outer.querySelectorAll('.lg-thumb-item');
            if (thumbImageWrappers) {
                thumbImageWrappers.forEach(wrapper => {
                    wrapper.classList.add(`!w-[calc((100vw-1.75rem)/${images.length})]`, '!h-auto', '!aspect-square', '!mb-0', 'backdrop-blur-[10px]', 'bg-white/20', '[border:1px_solid_transparent_!important;]', '[&.active]:[border:1px_solid_#F5F5F4_!important;]', `lg:!w-[calc((45rem-1.75rem)/${images.length})]`, 'dark:bg-[#181a1b]/20', 'dark:[&.active]:[border:1px_solid_#333739_!important;]')
                    // Ensure images fill the square wrapper
                    const img = wrapper.querySelector('img');
                    if (img) {
                        img.classList.add('!w-full', '!h-full', '!object-cover');
                    }
                });
            }

            const imgWraps = outer.querySelectorAll('.lg-img-wrap');
            imgWraps.forEach(wrap => {
                wrap.style.transition = 'transform 0.08s cubic-bezier(0.23, 1, 0.32, 1) !important';
                wrap.style.willChange = 'transform';
            });

            const getCurrentImgWrap = () => {
                return outer.querySelector('.lg-current .lg-img-wrap');
            };

            const handleMouseMove = (e) => {
                const imgWrap = getCurrentImgWrap();
                if (!imgWrap) return;

                const isZoomed = outer.classList.contains('lg-zoomed');

                if (isZoomed) {
                    const rect = outer.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 80;
                    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 80;

                    imgWrap.style.transform = `translate(${x}px, ${y}px)`;
                } else {
                    imgWrap.style.transform = '';
                }

                // ✅ CUSTOM CURSOR: Applied **ONLY** to .lg-object & .lg-image (even during click/drag)
                const isOverImage = e.target.closest('.lg-object') || e.target.closest('.lg-image');
                if (isOverImage) {
                    customCursor.style.left = `${e.clientX}px`;
                    customCursor.style.top = `${e.clientY}px`;
                    customCursor.style.transform = 'translate(-50%, -50%)';
                    customCursor.style.opacity = '1';

                    // Toggle icons
                    const zoomInIcon = customCursor.querySelector('.zoom-in-icon');
                    const zoomOutIcon = customCursor.querySelector('.zoom-out-icon');
                    if (isZoomed) {
                        zoomInIcon.classList.add('hidden');
                        zoomOutIcon.classList.remove('hidden');
                    } else {
                        zoomInIcon.classList.remove('hidden');
                        zoomOutIcon.classList.add('hidden');
                    }
                } else {
                    customCursor.style.opacity = '0';
                }
            };

            // Attach once
            outer.addEventListener('mousemove', handleMouseMove);

            // 🔥 IMPORTANT: Reset transform on slide change + fix thumbnail positioning
            container.addEventListener('lgAfterSlide', () => {
                const imgWrap = getCurrentImgWrap();
                if (imgWrap) imgWrap.style.transform = '';

                updateBackground();

                // Fix thumbnail bar from shifting on slide change (due to custom widths overriding LG's calc)
                const thumb = outer.querySelector('.lg-thumb');
                if (thumb) {
                    thumb.style.left = '0px';
                    thumb.style.transform = 'translateX(0px)';
                    // Re-apply flex if needed (in case LG overrides)
                    thumb.style.display = 'flex';
                }

                // Re-apply cursor override after slide change
                forceNoCursor();
            });

            container.addEventListener('lgBeforeClose', () => {
                outer.removeEventListener('mousemove', handleMouseMove);

                const imgWrap = getCurrentImgWrap();
                if (imgWrap) imgWrap.style.transform = '';

                // Cleanup custom cursor
                const cursor = outer.querySelector('#lg-custom-cursor');
                if (cursor) cursor.remove();
            }, { once: true });
        });
    }

    /**
     * Sets up click event listeners on main slides to trigger LightGallery opening, preventing accidental opens from drags.
     */
    function setupLightboxTrigger() {
        const mainSlides = document.querySelectorAll('[data-main-slider] .splide__slide');

        mainSlides.forEach((slide, index) => {
            let startX, startY;

            slide.addEventListener('mousedown', (e) => {
                startX = e.clientX;
                startY = e.clientY;
            });

            slide.addEventListener('click', (e) => {
                if (!startX || !startY) return;
                const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
                if (dist < 12) {
                    lgInstance.openGallery(index);
                }
            });
        });
    }

    // Event listener for window load to initialize all components
    window.addEventListener('load', () => {
        buildSlides();
        initSplide();
        lgInstance = initLightGallery();
        setupLightboxTrigger();
    });
</script>

<!-- handle sticky button on scroll -->
<script>
document.addEventListener("DOMContentLoaded", () => {
  // Select the element to make sticky
  const stickyEl = document.querySelector("[data-button-container]")

  /**
   * Checks if the element is at the bottom of the viewport and toggles the sticky class accordingly.
   */
  function checkSticky() {
    const rect = stickyEl.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // When sticky is active at bottom
    if (Math.abs(rect.bottom - viewportHeight) < 1) {
      stickyEl.classList.add("is-sticky");
    } else {
      stickyEl.classList.remove("is-sticky");
    }
  }

  // Run on scroll + resize
  window.addEventListener("scroll", checkSticky);
  window.addEventListener("resize", checkSticky);

  // Run once on load
  window.addEventListener("load", checkSticky);
});
</script>

<!-- toggle tab container's visibility on tab button click -->
<script>
    // Select all tab buttons and containers
    const tabButtons = document.querySelectorAll('[data-tab]');
    const tabContainers = document.querySelectorAll('[data-tab-container]');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const target = button.dataset.tab;

            // toggle active state
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // show / hide containers
            tabContainers.forEach(container => {
                if (container.dataset.tabContainer === target) {
                    container.classList.remove('hidden');
                } else {
                    container.classList.add('hidden');
                }
            });

        });
    });

    // show active tab on load
    const activeTab = document.querySelector('[data-tab-button] .active');
        if (activeTab) {
        activeTab.click();
    }

</script>
</body>
</html>

</template>