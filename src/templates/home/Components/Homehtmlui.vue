<template>
    <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Homepage</title>

    <!-- poppins font -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com"  />
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet"/>

    <link rel="preconnect" href="https://cdn.jsdelivr.net">
    <link rel="dns-prefetch" href="https://i.ibb.co.com">

    <!-- Tailwind CSS -->
    <script rel="preload" src="https://cdn.tailwindcss.com"></script>
    <!-- Include Splide CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/css/splide.min.css"/>
    <!-- Include Splide JS -->
    <script src="https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/js/splide.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@splidejs/splide-extension-auto-scroll@0.5.3/dist/js/splide-extension-auto-scroll.min.js"></script>


    <!-- Custom CSS -->
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    screens: {
                        sm: '480px',
                        md: '768px',
                        lg: '1024px',
                        xl: '1280px',
                    },
                    fontFamily: {
                        sans: ['Poppins', 'Inter', 'Montserrat', 'Open Sans', 'arial', 'sans-serif'],
                    },
                    keyframes: {
                        profileCrossfade: {
                            '0%': { opacity: '0' },
                            '100%': { opacity: '1' },
                        },
                        driftLeft: {
                            '0%': { transform: 'translateX(0)' },
                            '100%': { transform: 'translateX(50%)' },
                        },
                        driftRight: {
                            '0%': { transform: 'translateX(0%)' },
                            '100%': { transform: 'translateX(-70%)' },
                        },
                        driftLeftDesktop: {
                            '0%': { transform: 'translateX(0)' },
                            '100%': { transform: 'translateX(15%)' },
                        },
                        driftRightDesktop: {
                            '0%': { transform: 'translateX(0%)' },
                            '100%': { transform: 'translateX(-25%)' },
                        },
                    },
                    animation: {
                        profileCrossfade: 'profileCrossfade 500ms linear forwards',
                        driftLeft: 'driftLeft 3s linear forwards',
                        driftRight: 'driftRight 3s linear forwards',
                        driftLeftDesktop: 'driftLeftDesktop 3s linear forwards',
                        driftRightDesktop: 'driftRightDesktop 3s linear forwards',
                    },
                }
            },
        }
    </script>
  </head>
<body class="min-h-screen font-sans p-0 m-0 box-border overflow-x-hidden overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-order-style:none] [scrollbar-width:none] group/body">
    <!-- background-video-wrapper -->
    <div id="bg-layer" class="absolute w-screen h-screen inset-0 -z-10 overflow-hidden pointer-events-none">
        <video data-hero-bg="0" class="absolute inset-0 w-full h-full object-cover opacity-0 [&.active]:opacity-100" src="./videos/hero-bg-video-0.mp4" muted playsinline preload="metadata" loading="lazy"></video>
        <video data-hero-bg="1" class="absolute inset-0 w-full h-full object-cover opacity-0 [&.active]:opacity-100" src="./videos/hero-bg-video-2.mp4" muted playsinline preload="metadata" loading="lazy"></video>
        <video data-hero-bg="2" class="absolute inset-0 w-full h-full object-cover opacity-0 [&.active]:opacity-100" src="./videos/hero-bg-video-3.mp4" muted playsinline preload="metadata" loading="lazy"></video>
    
        <!-- Overlay -->
        <div class="absolute inset-0 bg-[#1D2334]/75 dark:bg-[#242b40]/75"></div>
    </div>

    <!-- nav-section -->
    <nav data-nav class="sticky top-0 left-0 flex justify-between items-center gap-6 p-2 w-full bg-[linear-gradient(180deg,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0)_100%)] z-[100] group/nav group-[.scrolling]/body:bg-black/20 group-[.scrolling]/body:backdrop-blur-[10px] md:px-6 md:py-4">
        <div class="flex items-center gap-[3.375rem] opacity-70">
            <!-- logo -->
            <div class="flex justify-center items-center w-max opacity-80 h-10 md:h-auto">
                <img loading="lazy" src="https://i.ibb.co.com/27Gt3hwK/website-logo.webp" alt="website-logo" class="w-full [filter:brightness(0)_saturate(100%)_invert(96%)_sepia(93%)_saturate(12%)_hue-rotate(312deg)_brightness(92%)_contrast(97%)]">
            </div>

            <ul class="hidden md:flex items-center gap-[3.375rem]">
                <li class="flex justify-center items-center w-max">
                    <a href="#" class="text-xl leading-normal tracking-[0.0025rem] text-[#E7E5E4] dark:text-[#d8d5cf]">Model</a>
                </li>
                <li class="flex justify-center items-center w-max">
                    <a href="#" class="text-xl leading-normal tracking-[0.0025rem] text-[#E7E5E4] dark:text-[#d8d5cf]">Discover</a>
                </li>
                <li class="flex justify-center items-center w-max">
                    <a href="#" class="text-xl leading-normal tracking-[0.0025rem] text-[#E7E5E4] dark:text-[#d8d5cf]">Live</a>
                </li>
            </ul>
        </div>

        <!-- login-buttons -->
        <div class="hidden md:flex items-center gap-2">
            <button class="flex justify-center items-center px-1.5 bg-transparent outline-none border-none cursor-pointer">
                <span class="text-lg font-semibold text-[#07F468] dark:[#23f97b]">LOGIN</span>
            </button>

            <button class="flex justify-center items-center px-[1.375rem] py-1 [clip-path:polygon(0_0,calc(100%-14.6px)_0,100%_100%,14.6px_100%)] bg-[#07F468] group/button hover:bg-[#1D2334] dark:bg-[#0aff78] dark:hover:bg-[#242b40]">
                <span class="text-lg font-semibold text-[#1D2334] group-hover/button:text-[#07F468] dark:text-[#cfcac4] dark:group-hover/button:text-[#23f97b]">SIGN UP</span>
            </button>
        </div>

        <!-- hamburger-menu -->
        <div data-mobile-menu-button class="flex md:hidden justify-center items-center w-8 h-8 opacity-70 cursor-pointer z-[100]">
            <img loading="lazy" src="https://i.ibb.co.com/5XY9bx19/menu-04.webp" alt="menu 04" class="block group-[.mobile-menu-open]/nav:hidden w-full h-full [filter:brightness(0)_saturate(100%)_invert(93%)_sepia(8%)_saturate(79%)_hue-rotate(181deg)_brightness(102%)_contrast(91%)]">
            <img loading="lazy" src="https://i.ibb.co.com/DfT6Sg5g/x-close.webp" alt="x close" class="hidden group-[.mobile-menu-open]/nav:flex w-full h-full [filter:brightness(0)_saturate(100%)_invert(93%)_sepia(8%)_saturate(79%)_hue-rotate(181deg)_brightness(102%)_contrast(91%)]">
        </div>

        <!-- mobile-menu -->
        <div class="hidden group-[.mobile-menu-open]/nav:flex md:!hidden fixed top-0 left-0 w-full h-screen flex-col justify-end items-center z-[99]">
            <!-- buttons-container -->
            <div class="flex flex-col gap-6 justify-end items-center w-full min-h-[9.296rem] bg-[#121212e6] backdrop-blur-[5px] dark:bg-[#222526e6]">
                <!-- login-buttons -->
                <div class="flex items-center gap-2 w-full">
                    <button class="flex-1 flex justify-center items-center px-1.5 h-[4.25rem] bg-transparent outline-none border-none cursor-pointer">
                        <span class="text-lg font-semibold text-[#07F468] dark:[#23f97b]">LOGIN</span>
                    </button>

                    <button class="flex-1 flex justify-center items-center px-[1.375rem] py-1 h-[4.25rem] [clip-path:polygon(0_0,100%_0,100%_100%,14.6px_100%)] bg-[#07F468] group/button hover:bg-[#1D2334] dark:bg-[#0aff78] dark:hover:bg-[#242b40]">
                        <span class="text-lg font-semibold text-[#1D2334] group-hover/button:text-[#07F468] dark:text-[#cfcac4] dark:group-hover/button:text-[#23f97b]">SIGN UP</span>
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <!-- hero-section -->
    <header class="flex flex-col items-center gap-6 min-h-[calc(100vh-3.5rem)] px-4 pb-12 md:pb-4 lg:min-h-[calc(100vh-4.375rem)] lg:flex-row-reverse xl:px-12">
        <!-- hero-section__image-slider -->
        <div data-hero-image-slider class="splide w-full flex justify-center items-center lg:min-h-[15.625rem]">
            <div class="splide__track w-[20rem] h-full aspect-[1.228659/1] p-0.5 md:w-[45rem] lg:w-[24.75rem] lg:min-h-[28rem] xl:w-[37rem] xl:h-[40rem]">
                <ul class="splide__list">
                    <li class="splide__slide overflow-visible group/splide-item" data-slide="0">
                        <div class="relative w-full h-full flex justify-center items-center pointer-events-none group-[.is-active]/splide-item:pointer-events-auto group-[.is-active]/splide-item:animate-profileCrossfade">
                            <div class="w-[7.829rem] h-[13.925rem] md:w-[17.578rem] md:h-[31.266rem] lg:w-[12.235rem] lg:h-[21.76rem] xl:w-[17.578rem] xl:h-[31.2656rem]">
                                <img loading="lazy" class="absolute z-[1] bottom-0 left-0 w-[6.18rem] h-[3.51rem] object-cover rounded-[0.2225rem] shadow-[0_1.78px_7.13px_0_#00000040] transition-[opacity,transform] group-[.is-active]/splide-item:animate-driftLeft md:w-[13.875rem] md:h-[7.875rem] md:rounded-lg md:shadow-[0_4px_16px 0_#00000040] lg:w-[9.6575rem] lg:h-[6.699rem] lg:rounded-[0.348rem] lg:shadow-[0_2.78px_11.14px_0_#00000040] lg:group-[.is-active]/splide-item:animate-driftLeftDesktop xl:w-[13.875rem] xl:h-[9.625rem] xl:rounded-lg xl:shadow-[0_4px_16px 0_#00000040]" src="https://i.ibb.co.com/j9b5wvYV/hero-bg-image-2-2.webp" />
                                <img loading="lazy" class="relative z-0 w-[7.829rem] h-[13.925rem] object-cover rounded-[0.42rem] shadow-[0_0_21.38px_-3.56px_#00000066] md:w-[17.578rem] md:h-[31.266rem] md:shadow-[0_0_48px_-8px_#00000066] md:rounded-[0.9375rem] lg:w-[12.235rem] lg:h-[21.76rem] lg:rounded-[0.6525rem] lg:shadow-[0_0_33.41px_-5.57px_#00000066] xl:w-[17.578rem] xl:h-[31.2656rem] xl:rounded-[0.9375rem] xl:shadow-[0_0_48px_-8px_#00000066]" src="https://i.ibb.co.com/H65C6Tk/hero-bg-video-1.webp" />
                                <img loading="lazy" class="absolute z-[1] top-12 right-0 w-[4.345rem] h-[6.263rem] object-cover rounded-[0.2225rem] shadow-[0_1.78px_7.13px_0_#00000040] transition-[opacity,transform] group-[.is-active]/splide-item:animate-driftRight md:top-24 md:w-[9.75rem] md:h-[14.0625rem] md:rounded-lg md:shadow-[0_4px_16px 0_#00000040] lg:w-[6.788rem] lg:h-[9.786rem] lg:rounded-[0.348rem] lg:shadow-[0_2.78px_11.14px_0_#00000040] lg:group-[.is-active]/splide-item:animate-driftRightDesktop xl:top-[8rem] xl:w-[9.75rem] xl:h-[14.0625rem] xl:rounded-lg xl:shadow-[0_4px_16px 0_#00000040]" src="https://i.ibb.co.com/PJL8PSv/hero-bg-image-0-1.webp" />
                            </div>
                        </div>
                    </li>
                    <li class="splide__slide overflow-visible group/splide-item" data-slide="1">
                        <div class="relative w-full h-full flex justify-center items-center pointer-events-none group-[.is-active]/splide-item:pointer-events-auto group-[.is-active]/splide-item:animate-profileCrossfade">
                            <div class="w-[7.829rem] h-[13.925rem] md:w-[17.578rem] md:h-[31.266rem] lg:w-[12.235rem] lg:h-[21.76rem] xl:w-[17.578rem] xl:h-[31.2656rem]">
                                <img loading="lazy" class="absolute z-[1] bottom-0 left-0 w-[6.18rem] h-[3.51rem] object-cover rounded-[0.2225rem] shadow-[0_1.78px_7.13px_0_#00000040] transition-[opacity,transform] group-[.is-active]/splide-item:animate-driftLeft md:w-[13.875rem] md:h-[7.875rem] md:rounded-lg md:shadow-[0_4px_16px 0_#00000040] lg:w-[9.6575rem] lg:h-[6.699rem] lg:rounded-[0.348rem] lg:shadow-[0_2.78px_11.14px_0_#00000040] lg:group-[.is-active]/splide-item:animate-driftLeftDesktop xl:w-[13.875rem] xl:h-[9.625rem] xl:rounded-lg xl:shadow-[0_4px_16px 0_#00000040]" src="https://i.ibb.co.com/S4vnSYPw/hero-bg-image-1-2.webp" />
                                <img loading="lazy" class="relative z-0 w-[7.829rem] h-[13.925rem] object-cover rounded-[0.42rem] shadow-[0_0_21.38px_-3.56px_#00000066] md:w-[17.578rem] md:h-[31.266rem] md:shadow-[0_0_48px_-8px_#00000066] md:rounded-[0.9375rem] lg:w-[12.235rem] lg:h-[21.76rem] lg:rounded-[0.6525rem] lg:shadow-[0_0_33.41px_-5.57px_#00000066] xl:w-[17.578rem] xl:h-[31.2656rem] xl:rounded-[0.9375rem] xl:shadow-[0_0_48px_-8px_#00000066]" src="https://i.ibb.co.com/nMgQC5R7/hero-bg-video-2.webp" />
                                <img loading="lazy" class="absolute z-[1] top-12 right-0 w-[4.345rem] h-[6.263rem] object-cover rounded-[0.2225rem] shadow-[0_1.78px_7.13px_0_#00000040] transition-[opacity,transform] group-[.is-active]/splide-item:animate-driftRight md:top-24 md:w-[9.75rem] md:h-[14.0625rem] md:rounded-lg md:shadow-[0_4px_16px 0_#00000040] lg:w-[6.788rem] lg:h-[9.786rem] lg:rounded-[0.348rem] lg:shadow-[0_2.78px_11.14px_0_#00000040] lg:group-[.is-active]/splide-item:animate-driftRightDesktop xl:top-[8rem] xl:w-[9.75rem] xl:h-[14.0625rem] xl:rounded-lg xl:shadow-[0_4px_16px 0_#00000040]" src="https://i.ibb.co.com/M5Q8qb4F/hero-bg-image-2-1.webp" />
                            </div>
                        </div>
                    </li>
                    <li class="splide__slide overflow-visible group/splide-item" data-slide="2">
                        <div class="relative w-full h-full flex justify-center items-center pointer-events-none group-[.is-active]/splide-item:pointer-events-auto group-[.is-active]/splide-item:animate-profileCrossfade">
                            <div class="w-[7.829rem] h-[13.925rem] md:w-[17.578rem] md:h-[31.266rem] lg:w-[12.235rem] lg:h-[21.76rem] xl:w-[17.578rem] xl:h-[31.2656rem]">
                                <img loading="lazy" class="absolute z-[1] bottom-0 left-0 w-[6.18rem] h-[3.51rem] object-cover rounded-[0.2225rem] shadow-[0_1.78px_7.13px_0_#00000040] transition-[opacity,transform] group-[.is-active]/splide-item:animate-driftLeft md:w-[13.875rem] md:h-[7.875rem] md:rounded-lg md:shadow-[0_4px_16px 0_#00000040] lg:w-[9.6575rem] lg:h-[6.699rem] lg:rounded-[0.348rem] lg:shadow-[0_2.78px_11.14px_0_#00000040] lg:group-[.is-active]/splide-item:animate-driftLeftDesktop xl:w-[13.875rem] xl:h-[9.625rem] xl:rounded-lg xl:shadow-[0_4px_16px 0_#00000040]" src="https://i.ibb.co.com/vxMgZvJD/hero-bg-image-1-1.webp" />
                                <img loading="lazy" class="relative z-0 w-[7.829rem] h-[13.925rem] object-cover rounded-[0.42rem] shadow-[0_0_21.38px_-3.56px_#00000066] md:w-[17.578rem] md:h-[31.266rem] md:shadow-[0_0_48px_-8px_#00000066] md:rounded-[0.9375rem] lg:w-[12.235rem] lg:h-[21.76rem] lg:rounded-[0.6525rem] lg:shadow-[0_0_33.41px_-5.57px_#00000066] xl:w-[17.578rem] xl:h-[31.2656rem] xl:rounded-[0.9375rem] xl:shadow-[0_0_48px_-8px_#00000066]" src="https://i.ibb.co.com/qFYHhCb7/hero-bg-video-3.webp" />
                                <img loading="lazy" class="absolute z-[1] top-12 right-0 w-[4.345rem] h-[6.263rem] object-cover rounded-[0.2225rem] shadow-[0_1.78px_7.13px_0_#00000040] transition-[opacity,transform] group-[.is-active]/splide-item:animate-driftRight md:top-24 md:w-[9.75rem] md:h-[14.0625rem] md:rounded-lg md:shadow-[0_4px_16px 0_#00000040] lg:w-[6.788rem] lg:h-[9.786rem] lg:rounded-[0.348rem] lg:shadow-[0_2.78px_11.14px_0_#00000040] lg:group-[.is-active]/splide-item:animate-driftRightDesktop xl:top-[8rem] xl:w-[9.75rem] xl:h-[14.0625rem] xl:rounded-lg xl:shadow-[0_4px_16px 0_#00000040]" src="https://i.ibb.co.com/wNtVT4r0/hero-bg-image-0-2.webp" />
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
        </div>

        <!-- hero-section__text-section -->
        <div class="flex flex-col gap-6 w-full">
            <!-- text-container -->
            <div class="flex flex-col gap-2 md:gap-5 md:max-w-[36.375rem]">
                <!-- title -->
                <section class="flex flex-col gap-1 md:gap-2">
                    <h1 class="text-4xl leading-[2.75rem] font-semibold italic -tracking-[0.045rem] drop-shadow-[0_4px_9.6px_#00000040] text-white md:text-[3.25rem] md:leading-[3.75rem] md:-tracking-[0.065rem] dark:text-[#e8e6e3]">Make money</h1>
                
                    <p class="text-base font-semibold italic text-white dark:text-[#e8e6e3] md:text-3xl md:leading-[2.375rem] md:font-medium md:not-italic">with the best all in one social platform.</p>
                </section>

                <p class="text-sm opacity-90 pr-0.5 text-white md:text-base dark:text-[#e8e6e3]">Our website puts everything you sell-Videos, image gallery, Audio clips, merch, products, even paid calls—into one platform so fans can buy in seconds and you get paid fast.</p>
            </div>

            <!-- input-container -->
            <div class="flex flex-col gap-5 md:gap-6">
                <div class="flex flex-col gap-5 md:max-w-[37.25rem] md:flex-row md:gap-0">
                    <!-- username-input -->
                    <div class="h-12 overflow-visible md:grow">
                        <div class="relative flex justify-center items-center gap-2 px-3 h-[3.25rem] backdrop-blur-[6px] rounded-md overflow-hidden border border-[#d0d5dd]/50 bg-white/10 md:rounded-l-md md:rounded-r-none dark:border-[#3b4043]/50 dark:bg-[#181a1b]/10">
                            <input type="text" class="bg-transparent border-none outline-none grow peer text-lg text-[#F9FAFB] dark:text-[#e5e3df]">
                            <div class="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none peer-focus:hidden peer-not-placeholder-shown:hidden">
                                <span class="text-lg text-[#F9FAFB] dark:text-[#e5e3df]">ourwebsite.app/@</span>
                                <span class="text-lg opacity-70 text-[#07F468] dark:[#23f97b]">username</span>
                            </div>
                        </div>
                    </div>

                    <!-- join-button -->
                    <button class="flex justify-center items-center w-full px-4 py-2.5 bg-[#07F468] group/button hover:bg-[#1D2334] md:w-max md:h-[3.25rem] md:rounded-r-md dark:bg-[#0aff78] dark:hover:bg-[#242b40]">
                        <span class="text-lg font-semibold text-[#1D2334] group-hover/button:text-[#07F468] md:text-xl md:leading-normal dark:text-[#cfcac4] dark:group-hover/button:text-[#23f97b]">JOIN AS CREATOR</span>
                    </button>
                </div>

                <!-- sign-up-as-fan button -->
                <button class="flex justify-center items-center px-2 py-0.5 mx-auto w-max bg-transparent border-none outline-none opacity-95 md:ml-0">
                    <p class="text-xl leading-normal underline text-[#D0D5DD] dark:text-[#cfcac4]">Sign up as Fan</p>
                </button>
            </div>
        </div>
    </header>

    <!-- about-section -->
    <div class="flex flex-col gap-6 px-4 py-10 backdrop-blur-[25px] bg-[#EAECF0] bg-[linear-gradient(180deg,rgba(255,255,255,0.75)_70%,rgba(255,255,255,0)_100%)] md:gap-16 md:px-12 md:py-20 dark:bg-[#222526]">
        <!-- title-section -->
        <div class="flex flex-col text-center gap-2 py-2.5 md:gap-6">
            <h2 class="text-2xl font-semibold text-[#344054] md:text-4xl md:leading-[2.75rem] md:-tracking-[0.045rem] dark:text-[#bdb8af]">Stop Jumping Between Platforms.</h2>
            <p class="text-base font-semibold text-[#344054] md:text-xl md:leading-[1.875rem] dark:text-[#bdb8af]">Start Thriving in One Dynamic Ecosystem.</p>
        </div>

        <!-- article-section -->
        <div class="flex flex-col gap-16 md:gap-14 xl:flex-row xl:gap-6">
            <article class="flex flex-col justify-center items-center md:flex-row gap-10 md:gap-6 xl:flex-col xl:gap-10 xl:flex-1">
                <!-- image-container -->
                <div class="flex justify-center items-center w-full max-w-[21.4375rem] h-[19.75rem] md:w-[19.75rem] md:h-[19.75rem] lg:min-w-[28.25rem] xl:w-full xl:aspect-square xl:h-[unset] xl:min-w-full">
                    <img loading="lazy" src="https://i.ibb.co.com/XfGWBdrv/communities-linked-up.webp" alt="communities linked up" class="h-full">
                </div>

                <!-- text-section -->
                <section class="flex flex-col gap-2 flex-1 min-w-0 xl:gap-4">
                    <h3 class="text-xl leading-normal font-semibold text-[#344054] dark:text-[#bdb8af]">Your communities all linked up</h3>
                
                    <p class="text-base text-[#344054] dark:text-[#bdb8af]">Automated social media promotion keeps your content circulating while you focus on creating. Stay linked to your fans via Telegram integration and receive calls anywhere on the go.</p>
                </section>
            </article>

            <article class="flex flex-col justify-center items-center md:flex-row-reverse gap-10 md:gap-6 xl:flex-col xl:gap-10 xl:flex-1">
                <!-- image-container -->
                <div class="flex justify-center items-center w-full max-w-[21.4375rem] h-[19.75rem] md:w-[19.75rem] md:h-[19.75rem] lg:min-w-[28.25rem] xl:w-full xl:aspect-square xl:h-[unset] xl:min-w-full">
                    <img loading="lazy" src="https://i.ibb.co.com/nqq3yDMb/smart.webp" alt="smart" class="h-full object-contain">
                </div>

                <!-- text-section -->
                <section class="flex flex-col gap-2 flex-1 min-w-0 xl:gap-4">
                    <h3 class="text-xl leading-normal font-semibold text-[#344054] dark:text-[#bdb8af]">Maximize Your Reach</h3>
                
                    <p class="text-base text-[#344054] dark:text-[#bdb8af]">Our website provides you flexible settings on access controls and content management so you don’t have to limit the way you sell. Create free media contents and subscription tiers to attract new followers or reserve premium content and events for top supporters only with our advanced settings.</p>
                </section>
            </article>

            <article class="flex flex-col justify-center items-center md:flex-row gap-10 md:gap-6 xl:flex-col xl:gap-10 xl:flex-1">
                <!-- image-container -->
                <div class="flex justify-center items-center w-full max-w-[21.4375rem] h-[19.75rem] md:w-[20.25rem] md:h-[20.25rem] lg:min-w-[28.25rem] lg:h-[19.75rem] xl:w-full xl:aspect-square xl:h-[unset] xl:min-w-full">
                    <img loading="lazy" src="https://i.ibb.co.com/qMrzgVV1/get-paid.webp" alt="get paid" class="h-full">
                </div>

                <!-- text-section -->
                <section class="flex flex-col gap-2 flex-1 min-w-0 xl:gap-4">
                    <h3 class="text-xl leading-normal font-semibold text-[#344054] dark:text-[#bdb8af]">Scale smarter. Get paid faster.</h3>
                
                    <p class="text-base text-[#344054] dark:text-[#bdb8af]">You earned it, you get it. Our system processes your funds in under 10 minutes. Seriously.  Plus, ditch the guesswork: our real-time analytics are like a cheat code, showing you exactly what content makes the most money so you can duplicate the success.</p>
                </section>
            </article>
        </div>
    </div>

    <!-- section-group -->
    <div class="flex flex-col bg-[#EAECF0] bg-[linear-gradient(180deg,rgba(255,255,255,0.75)_70%,rgba(255,255,255,0)_100%)] relative dark:bg-[#222526]">
        <!-- blur-overlay -->
        <div class="absolute inset-0 w-full h-full backdrop-blur-[25px] pointer-events-none z-[-1]"></div>

        <!-- featured-creator-section -->
        <div data-featured-creator-section class="flex flex-col gap-6 py-12 relative md:gap-10 md:py-16 xl:py-20">
            <!-- blur-overlay -->
            <div class="absolute inset-0 w-full h-full backdrop-blur-[25px] pointer-events-none z-[-1]"></div>

            <!-- custom-cursor -->
            <div data-follow-creator-cursor class="absolute hidden md:flex flex-col justify-center items-center w-[5.5rem] h-[5.5rem] bg-[#07F468] rounded-full opacity-0 transition-opacity duration-150 pointer-events-none z-[100] dark:hover:bg-[#242b40]">
                <img loading="lazy" src="https://i.ibb.co.com/r2G9ggZ2/arrow-right.webp" alt="arrow-right" class="w-8 h-8">
                <span class="text-base font-medium text-black dark:text-[#e8e6e3]">Profile</span>
            </div>

            <!-- title-section -->
            <div class="flex flex-col text-center gap-2 py-2.5 z-[1] md:gap-6">
                <h2 class="text-2xl font-semibold text-[#344054] md:text-4xl md:leading-[2.75rem] md:-tracking-[0.045rem] dark:text-[#bdb8af]">Featured Creator</h2>
                <p class="text-base font-semibold text-[#344054] md:text-xl md:leading-[1.875rem] dark:text-[#bdb8af]">100+ content creator have already join us</p>
            </div>

            <!-- featured-creator-card-row-wrapper -->
            <div class="flex flex-col gap-2 z-[1]">
                <div class="splide" data-featured-creator-top-card-slider>
                    <div class="splide__track">
                        <ul class="splide__list">
                            <li class="splide__slide aspect-[0.7636]">
                                <div class="w-full h-full opacity-90 rounded-[0.9375rem] flex flex-col justify-end items-center bg-[linear-gradient(rgba(255,255,255,0.1),rgba(255,255,255,0.1)),url('https://i.ibb.co.com/vxMgZvJD/hero-bg-image-1-1.webp')] bg-cover bg-center bg-no-repeat md:rounded-[1.25rem]">
                                    <div class="flex flex-col p-3 w-full md:gap-1 md:p-4 lg:px-3 xl:px-4">
                                        <div class="flex flex-col drop-shadow-[0_4px_18px_#00000040] md:gap-1">
                                            <h3 class="text-base font-semibold text-white dark:text-[#e8e6e3] md:text-xl md:leading-normal xl:text-3xl xl:leading-[2.375rem]">Yanice*</h3>
                                            <span class="text-sm text-white xl:text-base xl:font-medium dark:text-[#e8e6e3]">@yanice</span>
                                        </div>
                                    </div>
                                </div>
                            </li>

                            <li class="splide__slide aspect-[0.7636]">
                                <div class="w-full h-full opacity-90 rounded-[0.9375rem] flex flex-col justify-end items-center bg-[linear-gradient(rgba(255,255,255,0.1),rgba(255,255,255,0.1)),url('https://i.ibb.co.com/j9b5wvYV/hero-bg-image-2-2.webp')] bg-cover bg-center bg-no-repeat md:rounded-[1.25rem]">
                                    <div class="flex flex-col p-3 w-full md:gap-1 md:p-4 lg:px-3 xl:px-4">
                                        <div class="flex flex-col drop-shadow-[0_4px_18px_#00000040] md:gap-1">
                                            <h3 class="text-base font-semibold text-white dark:text-[#e8e6e3] md:text-xl md:leading-normal xl:text-3xl xl:leading-[2.375rem]">Yana Zein</h3>
                                            <span class="text-sm text-white xl:text-base xl:font-medium dark:text-[#e8e6e3]">@yana</span>
                                        </div>
                                    </div>
                                </div>
                            </li>

                            <li class="splide__slide aspect-[0.7636]">
                                <div class="w-full h-full opacity-90 rounded-[0.9375rem] flex flex-col justify-end items-center bg-[linear-gradient(rgba(255,255,255,0.1),rgba(255,255,255,0.1)),url('https://i.ibb.co.com/PJL8PSv/hero-bg-image-0-1.webp')] bg-cover bg-center bg-no-repeat md:rounded-[1.25rem]">
                                    <div class="flex flex-col p-3 w-full md:gap-1 md:p-4 lg:px-3 xl:px-4">
                                        <div class="flex flex-col drop-shadow-[0_4px_18px_#00000040] md:gap-1">
                                            <h3 class="text-base font-semibold text-white dark:text-[#e8e6e3] md:text-xl md:leading-normal xl:text-3xl xl:leading-[2.375rem]">Yanice*</h3>
                                            <span class="text-sm text-white xl:text-base xl:font-medium dark:text-[#e8e6e3]">@yanice</span>
                                        </div>
                                    </div>
                                </div>
                            </li>

                            <li class="splide__slide aspect-[0.7636]">
                                <div class="w-full h-full opacity-90 rounded-[0.9375rem] flex flex-col justify-end items-center bg-[linear-gradient(rgba(255,255,255,0.1),rgba(255,255,255,0.1)),url('https://i.ibb.co.com/wNtVT4r0/hero-bg-image-0-2.webp')] bg-cover bg-center bg-no-repeat md:rounded-[1.25rem]">
                                    <div class="flex flex-col p-3 w-full md:gap-1 md:p-4 lg:px-3 xl:px-4">
                                        <div class="flex flex-col drop-shadow-[0_4px_18px_#00000040] md:gap-1">
                                            <h3 class="text-base font-semibold text-white dark:text-[#e8e6e3] md:text-xl md:leading-normal xl:text-3xl xl:leading-[2.375rem]">Yana Zein</h3>
                                            <span class="text-sm text-white xl:text-base xl:font-medium dark:text-[#e8e6e3]">@yana</span>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                <div class="splide" data-featured-creator-bottom-card-slider>
                    <div class="splide__track">
                        <ul class="splide__list">
                            <li class="splide__slide aspect-[0.7636]">
                                <div class="w-full h-full opacity-90 rounded-[0.625rem] flex flex-col justify-end items-center bg-[linear-gradient(rgba(255,255,255,0.1),rgba(255,255,255,0.1)),url('https://i.ibb.co.com/vxMgZvJD/hero-bg-image-1-1.webp')] bg-cover bg-center bg-no-repeat md:rounded-[1.25rem]">
                                    <div class="flex flex-col p-3 w-full md:gap-1 md:p-4 lg:px-3 xl:px-4">
                                        <div class="flex flex-col drop-shadow-[0_4px_18px_#00000040] md:gap-1">
                                            <h3 class="text-base font-semibold text-left text-white dark:text-[#e8e6e3] md:text-xl md:leading-normal xl:text-3xl xl:leading-[2.375rem]">Yanice*</h3>
                                            <span class="text-sm text-left text-white xl:text-base xl:font-medium dark:text-[#e8e6e3]">@yanice</span>
                                        </div>
                                    </div>
                                </div>
                            </li>

                            <li class="splide__slide aspect-[0.7636]">
                                <div class="w-full h-full opacity-90 rounded-[0.625rem] flex flex-col justify-end items-center bg-[linear-gradient(rgba(255,255,255,0.1),rgba(255,255,255,0.1)),url('https://i.ibb.co.com/j9b5wvYV/hero-bg-image-2-2.webp')] bg-cover bg-center bg-no-repeat md:rounded-[1.25rem]">
                                    <div class="flex flex-col p-3 w-full md:gap-1 md:p-4 lg:px-3 xl:px-4">
                                        <div class="flex flex-col drop-shadow-[0_4px_18px_#00000040] md:gap-1">
                                            <h3 class="text-base font-semibold text-left text-white dark:text-[#e8e6e3] md:text-xl md:leading-normal xl:text-3xl xl:leading-[2.375rem]">Yana Zein</h3>
                                            <span class="text-sm text-left text-white xl:text-base xl:font-medium dark:text-[#e8e6e3]">@yana</span>
                                        </div>
                                    </div>
                                </div>
                            </li>

                            <li class="splide__slide aspect-[0.7636]">
                                <div class="w-full h-full opacity-90 rounded-[0.625rem] flex flex-col justify-end items-center bg-[linear-gradient(rgba(255,255,255,0.1),rgba(255,255,255,0.1)),url('https://i.ibb.co.com/PJL8PSv/hero-bg-image-0-1.webp')] bg-cover bg-center bg-no-repeat md:rounded-[1.25rem]">
                                    <div class="flex flex-col p-3 w-full md:gap-1 md:p-4 lg:px-3 xl:px-4">
                                        <div class="flex flex-col drop-shadow-[0_4px_18px_#00000040] md:gap-1">
                                            <h3 class="text-base font-semibold text-left text-white dark:text-[#e8e6e3] md:text-xl md:leading-normal xl:text-3xl xl:leading-[2.375rem]">Yanice*</h3>
                                            <span class="text-sm text-left text-white xl:text-base xl:font-medium dark:text-[#e8e6e3]">@yanice</span>
                                        </div>
                                    </div>
                                </div>
                            </li>

                            <li class="splide__slide aspect-[0.7636]">
                                <div class="w-full h-full opacity-90 rounded-[0.625rem] flex flex-col justify-end items-center bg-[linear-gradient(rgba(255,255,255,0.1),rgba(255,255,255,0.1)),url('https://i.ibb.co.com/wNtVT4r0/hero-bg-image-0-2.webp')] bg-cover bg-center bg-no-repeat md:rounded-[1.25rem]">
                                    <div class="flex flex-col p-3 w-full md:gap-1 md:p-4 lg:px-3 xl:px-4">
                                        <div class="flex flex-col drop-shadow-[0_4px_18px_#00000040] md:gap-1">
                                            <h3 class="text-base font-semibold text-left text-white dark:text-[#e8e6e3] md:text-xl md:leading-normal xl:text-3xl xl:leading-[2.375rem]">Yana Zein</h3>
                                            <span class="text-sm text-left text-white xl:text-base xl:font-medium dark:text-[#e8e6e3]">@yana</span>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <!-- ditch-middleman-section -->
        <div class="w-full bg-[url('https://i.ibb.co.com/5WQ43b48/sample-bg-image-compressed.webp')] bg-cover [background-position:top_center] bg-no-repeat">
            <div class="flex flex-col gap-4 w-full h-full px-4 py-12 bg-[linear-gradient(180deg,rgba(251,91,162,0.45)_0%,rgba(255,4,100,0.81)_100%)] relative xl:px-12 xl:py-[4.875rem]">
                <!-- blur-overlay -->
                <div class="absolute inset-0 w-full h-full backdrop-blur-[5px] pointer-events-none z-[-1]"></div>

                
                <div class="flex flex-col gap-2 md:justify-center md:items-center md:gap-6">
                    <!-- title-section -->
                    <div class="flex flex-col gap-2 py-2.5 drop-shadow-[0_0_4px_#00000040] md:py-0 xl:hidden">
                        <h2 class="text-2xl font-semibold text-white md:text-4xl md:leading-[2.75rem] md:-tracking-[0.045rem] dark:text-[#e8e6e3]">Ditch the Agency Middleman</h2>
                        <p class="text-base font-semibold text-white md:text-2xl dark:text-[#e8e6e3]">Your Platform is Now Your Full-Service Team.</p>
                    </div>

                    <div class="flex flex-col gap-4 pb-2 md:items-center md:flex-row md:gap-0 md:pb-0">
                        <!-- description -->
                        <div class="flex flex-col gap-10 md:flex-1 xl:drop-shadow-[0_0_4px_#00000040]">
                            <div class="flex flex-col gap-6">
                                <!-- title-section -->
                                <div class="hidden xl:flex flex-col gap-2">
                                    <h2 class="text-4xl leading-[2.75rem] font-semibold -tracking-[0.045rem] text-white dark:text-[#e8e6e3]">Ditch the Agency Middleman</h2>
                                    <p class="text-2xl font-semibold text-white dark:text-[#e8e6e3]">Your Platform is Now Your Full-Service Team.</p>
                                </div>

                                <p class="text-base font-medium text-white md:text-xl md:leading-normal dark:text-[#e8e6e3]">Why pay an outside agency when there is a team of agent-level experts in Our Website? Selected creators get 1-on-1 expert support completely free of commission fees or 3rd party charges. Let our in-house support team handle your outreach and growth while you focus on creating. </p>
                            </div>
                        
                            <button class="hidden xl:flex justify-center items-center px-4 py-2.5 w-max bg-[#0C111D] group/button hover:bg-[#07F468] dark:bg-[#0a0e17] dark:hover:bg-[#06c454]">
                                <span class="text-xl leading-normal font-semibold text-[#07F468] group-hover/button:text-[#0C111D] dark:text-[#23f97b] dark:group-hover/button:text-[#dbd8d3]">SIGN UP & GET DISCOVERED</span>
                            </button>
                        </div>
                    
                        <!-- accordion-container -->
                        <div data-accordion-container class="flex flex-col md:flex-1">
                            <!-- Accordion Item -->
                            <div data-accordion-item class="flex flex-col py-4 border-b border-white group/accordion-item md:px-4 md:py-6 xl:min-h-[7rem] xl:justify-center dark:border-[#303436] open">
                                <button data-accordions-header class="flex justify-between items-center w-full outline-none border-none bg-transparent">
                                    <span class="text-lg font-semibold text-left drop-shadow-[0_0_4px_#00000040] text-white md:text-2xl dark:text-[#e8e6e3]">1-on-1 Account Management</span>

                                    <div class="flex justify-center items-center w-6 h-6">
                                        <img loading="lazy" src="https://i.ibb.co.com/Vpx4ccZ0/plus-square.webp" alt="plus square" class="block w-6 h-6 min-w-[1.5rem] group-[.open]/accordion-item:hidden"/>
                                        <img loading="lazy" src="https://i.ibb.co.com/VYYz44p3/minus-square.webp" alt="minus square" class="hidden w-6 h-6 min-w-[1.5rem] group-[.open]/accordion-item:block"/>
                                    </div>
                                </button>

                                <div data-accordion-content class="max-h-0 opacity-0 pr-8 overflow-hidden transition-all duration-100 group-[.open]/accordion-item:mt-4 group-[.open]/accordion-item:opacity-100">
                                    <p class="text-base font-medium text-white dark:[#e8e6e3]">A dedicated representation to engage your fan community on your behalf.</p>
                                </div>
                            </div>

                            <!-- Accordion Item -->
                            <div data-accordion-item class="flex flex-col py-4 border-b border-white group/accordion-item md:px-4 md:py-6 xl:min-h-[7rem] xl:justify-center dark:border-[#303436]">
                                <button data-accordions-header class="flex justify-between items-center w-full outline-none border-none bg-transparent">
                                    <span class="text-lg font-semibold text-left drop-shadow-[0_0_4px_#00000040] text-white md:text-2xl dark:text-[#e8e6e3]">Production & Promotion</span>

                                    <div class="flex justify-center items-center w-6 h-6">
                                        <img loading="lazy" src="https://i.ibb.co.com/Vpx4ccZ0/plus-square.webp" alt="plus square" class="block w-6 h-6 min-w-[1.5rem] group-[.open]/accordion-item:hidden"/>
                                        <img loading="lazy" src="https://i.ibb.co.com/VYYz44p3/minus-square.webp" alt="minus square" class="hidden w-6 h-6 min-w-[1.5rem] group-[.open]/accordion-item:block"/>
                                    </div>
                                </button>

                                <div data-accordion-content class="max-h-0 opacity-0 pr-8 overflow-hidden transition-all duration-100 group-[.open]/accordion-item:mt-4 group-[.open]/accordion-item:opacity-100">
                                    <p class="text-base font-medium text-white dark:[#e8e6e3]">A dedicated representation to engage your fan community on your behalf.</p>
                                </div>
                            </div>

                            <!-- Accordion Item -->
                            <div data-accordion-item class="flex flex-col py-4 border-b border-white group/accordion-item md:px-4 md:py-6 xl:min-h-[7rem] xl:justify-center dark:border-[#303436]">
                                <button data-accordions-header class="flex justify-between items-center w-full outline-none border-none bg-transparent">
                                    <span class="text-lg font-semibold text-left drop-shadow-[0_0_4px_#00000040] text-white md:text-2xl dark:text-[#e8e6e3]">Premium Visibility</span>

                                    <div class="flex justify-center items-center w-6 h-6">
                                        <img loading="lazy" src="https://i.ibb.co.com/Vpx4ccZ0/plus-square.webp" alt="plus square" class="block w-6 h-6 min-w-[1.5rem] group-[.open]/accordion-item:hidden"/>
                                        <img loading="lazy" src="https://i.ibb.co.com/VYYz44p3/minus-square.webp" alt="minus square" class="hidden w-6 h-6 min-w-[1.5rem] group-[.open]/accordion-item:block"/>
                                    </div>
                                </button>

                                <div data-accordion-content class="max-h-0 opacity-0 pr-8 overflow-hidden transition-all duration-100 group-[.open]/accordion-item:mt-4 group-[.open]/accordion-item:opacity-100">
                                    <p class="text-base font-medium text-white dark:[#e8e6e3]">A dedicated representation to engage your fan community on your behalf.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button class="flex justify-center items-center px-4 py-2.5 bg-[#0C111D] group/button hover:bg-[#07F468] xl:hidden dark:bg-[#0a0e17] dark:hover:bg-[#06c454]">
                        <span class="text-lg font-semibold text-[#07F468] group-hover/button:text-[#0C111D] md:text-xl md:leading-normal dark:text-[#23f97b] dark:group-hover/button:text-[#dbd8d3]">SIGN UP & GET DISCOVERED</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- slides-section -->
        <div class="flex flex-col gap-10 py-10 relative md:py-20 md:gap-16">
            <!-- blur-overlay -->
            <div class="absolute inset-0 w-full h-full backdrop-blur-[50px] pointer-events-none z-[-1]"></div>

            <!-- slides-wrapper -->
            <div data-double-row-slider class="flex flex-col gap-4 md:gap-6">
                <!-- title-section -->
                <div class="flex justify-between items-center gap-2 px-4 xl:px-12">
                    <!-- title-section__left -->
                    <div class="flex items-center gap-2 md:gap-4">
                        <img loading="lazy" src="https://i.ibb.co.com/FbpnxXzs/gallery.webp" alt="gallery" class="w-6 h-6 min-w-[1.5rem] md:w-8 md:h-8 md:min-w-[2rem]">

                        <h2 class="text-xl leading-normal font-semibold text-[#344054] md:text-3xl md:leading-[2.375rem] dark:text-[#bdb8af]">Most Viewed</h2>
                    </div>

                    <!-- arrow-buttons -->
                    <div class="flex items-center gap-2 slider-arrows md:gap-4">
                        <button data-prev class="flex justify-center items-center w-10 h-10 rounded-full border border-black/50 backdrop-blur-[10px] cursor-pointer group/button [&.disabled]:border-black/30 md:w-12 md:h-12 dark:border-[#363b3d]/50 [&.disabled]:dark:border-[#363b3d]/30">
                            <img loading="lazy" src="https://i.ibb.co.com/wvMNs1P/chevron-right.webp" alt="chevron right" class="h-7 group-[.disabled]/button:opacity-80 rotate-180 md:h-9">
                        </button>

                        <button data-next class="flex justify-center items-center w-10 h-10 rounded-full border border-black/50 backdrop-blur-[10px] cursor-pointer group/button [&.disabled]:border-black/30 md:w-12 md:h-12 dark:border-[#363b3d]/50 [&.disabled]:dark:border-[#363b3d]/30">
                            <img loading="lazy" src="https://i.ibb.co.com/wvMNs1P/chevron-right.webp" alt="chevron right" class="h-7 group-[.disabled]/button:opacity-50 md:h-9">
                        </button>
                    </div>
                </div>

                <div class="flex flex-col gap-4">
                    <!-- Row 1 -->
                    <div class="splide" data-row="1">
                        <div class="splide__track">
                            <ul class="splide__list">
                                <li class="splide__slide aspect-[16/9] rounded-lg bg-[url('https://i.ibb.co.com/M5Q8qb4F/hero-bg-image-2-1.webp')] bg-cover bg-center bg-no-repeat overflow-hidden cursor-pointer">
                                    <div class="flex flex-col justify-between gap-2 p-2 w-full h-full bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.5)_100%)] md:p-3">
                                        <!-- media-type-container -->
                                        <div class="flex justify-center items-center gap-[0.1875rem] w-max px-1 py-[0.0625rem] rounded bg-[#182230]/50 dark:bg-[#1f2c3f]/50">
                                            <img loading="lazy" src="https://i.ibb.co.com/tTDV6Ms1/play-square.webp" alt="video" class="w-4 h-4"/>
                                            <span class="text-xs leading-normal align-middle text-white dark:text-[#e8e6e3]">15:00:03</span>
                                        </div>

                                        <div class="flex items-center gap-2">
                                            <div class="flex justify-center items-center w-9 h-9 min-w-[2.25rem] rounded-full overflow-hidden md:w-12 md:h-12 md:min-w-[3rem]">
                                                <img loading="lazy" src="https://i.ibb.co.com/70sHrpv/featured-media-bg.webp" alt="avatar" class="w-full h-full object-cover">
                                            </div>

                                            <div class="flex flex-col justify-between">
                                                <h3 class="text-sm font-medium line-clamp-2 text-[#F2F4F7] md:text-base dark:text-[#e1dfdb]">Princess Carrot Pop</h3>
                                                <div class="flex items-center gap-1">
                                                    <span class="text-xs leading-normal font-medium line-clamp-1 text-[#FCFCFD] dark:text-[#e6e4e1]">@sammisjelly187</span>
                                                    <img loading="lazy" src="https://i.ibb.co.com/nMhY8CpS/svgviewer-png-output-22.webp" alt="verified-tick" class="w-3 h-3"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>

                                <li class="splide__slide aspect-[16/9] rounded-lg bg-[url('https://i.ibb.co.com/S4vnSYPw/hero-bg-image-1-2.webp')] bg-cover bg-center bg-no-repeat overflow-hidden cursor-pointer">
                                    <div class="flex flex-col justify-between gap-2 p-2 w-full h-full bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.5)_100%)] md:p-3">
                                        <!-- media-type-container -->
                                        <div class="flex justify-center items-center gap-[0.1875rem] w-max px-1 py-[0.0625rem] rounded bg-[#182230]/50 dark:bg-[#1f2c3f]/50">
                                            <img loading="lazy" src="https://i.ibb.co.com/Q3dZ2gtL/gallery-image-icon.webp" alt="img" class="w-4 h-4"/>
                                            <span class="text-xs leading-normal align-middle text-white dark:text-[#e8e6e3]">30</span>
                                        </div>

                                        <div class="flex items-center gap-2">
                                            <div class="flex justify-center items-center w-9 h-9 min-w-[2.25rem] rounded-full overflow-hidden md:w-12 md:h-12 md:min-w-[3rem]">
                                                <img loading="lazy" src="https://i.ibb.co.com/70sHrpv/featured-media-bg.webp" alt="avatar" class="w-full h-full object-cover">
                                            </div>

                                            <div class="flex flex-col justify-between">
                                                <h3 class="text-sm font-medium line-clamp-2 text-[#F2F4F7] md:text-base dark:text-[#e1dfdb]">Princess Carrot Pop</h3>
                                                <div class="flex items-center gap-1">
                                                    <span class="text-xs leading-normal font-medium line-clamp-1 text-[#FCFCFD] dark:text-[#e6e4e1]">@sammisjelly187</span>
                                                    <img loading="lazy" src="https://i.ibb.co.com/nMhY8CpS/svgviewer-png-output-22.webp" alt="verified-tick" class="w-3 h-3"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>

                                <li class="splide__slide aspect-[16/9] rounded-lg bg-[url('https://i.ibb.co.com/j9b5wvYV/hero-bg-image-2-2.webp')] bg-cover bg-center bg-no-repeat overflow-hidden cursor-pointer">
                                    <div class="flex flex-col justify-between gap-2 p-2 w-full h-full bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.5)_100%)] md:p-3">
                                        <!-- media-type-container -->
                                        <div class="flex justify-center items-center gap-[0.1875rem] w-max px-1 py-[0.0625rem] rounded bg-[#182230]/50 dark:bg-[#1f2c3f]/50">
                                            <img loading="lazy" src="https://i.ibb.co.com/tTDV6Ms1/play-square.webp" alt="video" class="w-4 h-4"/>
                                            <span class="text-xs leading-normal align-middle text-white dark:text-[#e8e6e3]">15:00:03</span>
                                        </div>

                                        <div class="flex items-center gap-2">
                                            <div class="flex justify-center items-center w-9 h-9 min-w-[2.25rem] rounded-full overflow-hidden md:w-12 md:h-12 md:min-w-[3rem]">
                                                <img loading="lazy" src="https://i.ibb.co.com/70sHrpv/featured-media-bg.webp" alt="avatar" class="w-full h-full object-cover">
                                            </div>

                                            <div class="flex flex-col justify-between">
                                                <h3 class="text-sm font-medium line-clamp-2 text-[#F2F4F7] md:text-base dark:text-[#e1dfdb]">Princess Carrot Pop</h3>
                                                <div class="flex items-center gap-1">
                                                    <span class="text-xs leading-normal font-medium line-clamp-1 text-[#FCFCFD] dark:text-[#e6e4e1]">@sammisjelly187</span>
                                                    <img loading="lazy" src="https://i.ibb.co.com/nMhY8CpS/svgviewer-png-output-22.webp" alt="verified-tick" class="w-3 h-3"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>

                                <li class="splide__slide aspect-[16/9] rounded-lg bg-[url('https://i.ibb.co.com/wNtVT4r0/hero-bg-image-0-2.webp')] bg-cover bg-center bg-no-repeat overflow-hidden cursor-pointer">
                                    <div class="flex flex-col justify-between gap-2 p-2 w-full h-full bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.5)_100%)] md:p-3">
                                        <!-- media-type-container -->
                                        <div class="flex justify-center items-center gap-[0.1875rem] w-max px-1 py-[0.0625rem] rounded bg-[#182230]/50 dark:bg-[#1f2c3f]/50">
                                            <img loading="lazy" src="https://i.ibb.co.com/Q3dZ2gtL/gallery-image-icon.webp" alt="img" class="w-4 h-4"/>
                                            <span class="text-xs leading-normal align-middle text-white dark:text-[#e8e6e3]">30</span>
                                        </div>

                                        <div class="flex items-center gap-2">
                                            <div class="flex justify-center items-center w-9 h-9 min-w-[2.25rem] rounded-full overflow-hidden md:w-12 md:h-12 md:min-w-[3rem]">
                                                <img loading="lazy" src="https://i.ibb.co.com/70sHrpv/featured-media-bg.webp" alt="avatar" class="w-full h-full object-cover">
                                            </div>

                                            <div class="flex flex-col justify-between">
                                                <h3 class="text-sm font-medium line-clamp-2 text-[#F2F4F7] md:text-base dark:text-[#e1dfdb]">Princess Carrot Pop</h3>
                                                <div class="flex items-center gap-1">
                                                    <span class="text-xs leading-normal font-medium line-clamp-1 text-[#FCFCFD] dark:text-[#e6e4e1]">@sammisjelly187</span>
                                                    <img loading="lazy" src="https://i.ibb.co.com/nMhY8CpS/svgviewer-png-output-22.webp" alt="verified-tick" class="w-3 h-3"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <!-- Row 2 -->
                    <div class="splide" data-row="2">
                        <div class="splide__track md:!pl-[25rem]">
                            <ul class="splide__list">
                                <li class="splide__slide aspect-[16/9] rounded-lg bg-[url('https://i.ibb.co.com/j9b5wvYV/hero-bg-image-2-2.webp')] bg-cover bg-center bg-no-repeat overflow-hidden cursor-pointer">
                                    <div class="flex flex-col justify-between gap-2 p-2 w-full h-full bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.5)_100%)] md:p-3">
                                        <!-- media-type-container -->
                                        <div class="flex justify-center items-center gap-[0.1875rem] w-max px-1 py-[0.0625rem] rounded bg-[#182230]/50 dark:bg-[#1f2c3f]/50">
                                            <img loading="lazy" src="https://i.ibb.co.com/tTDV6Ms1/play-square.webp" alt="video" class="w-4 h-4"/>
                                            <span class="text-xs leading-normal align-middle text-white dark:text-[#e8e6e3]">15:00:03</span>
                                        </div>

                                        <div class="flex items-center gap-2">
                                            <div class="flex justify-center items-center w-9 h-9 min-w-[2.25rem] rounded-full overflow-hidden md:w-12 md:h-12 md:min-w-[3rem]">
                                                <img loading="lazy" src="https://i.ibb.co.com/70sHrpv/featured-media-bg.webp" alt="avatar" class="w-full h-full object-cover">
                                            </div>

                                            <div class="flex flex-col justify-between">
                                                <h3 class="text-sm font-medium line-clamp-2 text-[#F2F4F7] md:text-base dark:text-[#e1dfdb]">Princess Carrot Pop</h3>
                                                <div class="flex items-center gap-1">
                                                    <span class="text-xs leading-normal font-medium line-clamp-1 text-[#FCFCFD] dark:text-[#e6e4e1]">@sammisjelly187</span>
                                                    <img loading="lazy" src="https://i.ibb.co.com/nMhY8CpS/svgviewer-png-output-22.webp" alt="verified-tick" class="w-3 h-3"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>

                                <li class="splide__slide aspect-[16/9] rounded-lg bg-[url('https://i.ibb.co.com/wNtVT4r0/hero-bg-image-0-2.webp')] bg-cover bg-center bg-no-repeat overflow-hidden cursor-pointer">
                                    <div class="flex flex-col justify-between gap-2 p-2 w-full h-full bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.5)_100%)] md:p-3">
                                        <!-- media-type-container -->
                                        <div class="flex justify-center items-center gap-[0.1875rem] w-max px-1 py-[0.0625rem] rounded bg-[#182230]/50 dark:bg-[#1f2c3f]/50">
                                            <img loading="lazy" src="https://i.ibb.co.com/Q3dZ2gtL/gallery-image-icon.webp" alt="img" class="w-4 h-4"/>
                                            <span class="text-xs leading-normal align-middle text-white dark:text-[#e8e6e3]">30</span>
                                        </div>

                                        <div class="flex items-center gap-2">
                                            <div class="flex justify-center items-center w-9 h-9 min-w-[2.25rem] rounded-full overflow-hidden md:w-12 md:h-12 md:min-w-[3rem]">
                                                <img loading="lazy" src="https://i.ibb.co.com/70sHrpv/featured-media-bg.webp" alt="avatar" class="w-full h-full object-cover">
                                            </div>

                                            <div class="flex flex-col justify-between">
                                                <h3 class="text-sm font-medium line-clamp-2 text-[#F2F4F7] md:text-base dark:text-[#e1dfdb]">Princess Carrot Pop</h3>
                                                <div class="flex items-center gap-1">
                                                    <span class="text-xs leading-normal font-medium line-clamp-1 text-[#FCFCFD] dark:text-[#e6e4e1]">@sammisjelly187</span>
                                                    <img loading="lazy" src="https://i.ibb.co.com/nMhY8CpS/svgviewer-png-output-22.webp" alt="verified-tick" class="w-3 h-3"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>

                                <li class="splide__slide aspect-[16/9] rounded-lg bg-[url('https://i.ibb.co.com/M5Q8qb4F/hero-bg-image-2-1.webp')] bg-cover bg-center bg-no-repeat overflow-hidden cursor-pointer">
                                    <div class="flex flex-col justify-between gap-2 p-2 w-full h-full bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.5)_100%)] md:p-3">
                                        <!-- media-type-container -->
                                        <div class="flex justify-center items-center gap-[0.1875rem] w-max px-1 py-[0.0625rem] rounded bg-[#182230]/50 dark:bg-[#1f2c3f]/50">
                                            <img loading="lazy" src="https://i.ibb.co.com/tTDV6Ms1/play-square.webp" alt="video" class="w-4 h-4"/>
                                            <span class="text-xs leading-normal align-middle text-white dark:text-[#e8e6e3]">15:00:03</span>
                                        </div>

                                        <div class="flex items-center gap-2">
                                            <div class="flex justify-center items-center w-9 h-9 min-w-[2.25rem] rounded-full overflow-hidden md:w-12 md:h-12 md:min-w-[3rem]">
                                                <img loading="lazy" src="https://i.ibb.co.com/70sHrpv/featured-media-bg.webp" alt="avatar" class="w-full h-full object-cover">
                                            </div>

                                            <div class="flex flex-col justify-between">
                                                <h3 class="text-sm font-medium line-clamp-2 text-[#F2F4F7] md:text-base dark:text-[#e1dfdb]">Princess Carrot Pop</h3>
                                                <div class="flex items-center gap-1">
                                                    <span class="text-xs leading-normal font-medium line-clamp-1 text-[#FCFCFD] dark:text-[#e6e4e1]">@sammisjelly187</span>
                                                    <img loading="lazy" src="https://i.ibb.co.com/nMhY8CpS/svgviewer-png-output-22.webp" alt="verified-tick" class="w-3 h-3"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>

                                <li class="splide__slide aspect-[16/9] rounded-lg bg-[url('https://i.ibb.co.com/S4vnSYPw/hero-bg-image-1-2.webp')] bg-cover bg-center bg-no-repeat overflow-hidden cursor-pointer">
                                    <div class="flex flex-col justify-between gap-2 p-2 w-full h-full bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.5)_100%)] md:p-3">
                                        <!-- media-type-container -->
                                        <div class="flex justify-center items-center gap-[0.1875rem] w-max px-1 py-[0.0625rem] rounded bg-[#182230]/50 dark:bg-[#1f2c3f]/50">
                                            <img loading="lazy" src="https://i.ibb.co.com/Q3dZ2gtL/gallery-image-icon.webp" alt="img" class="w-4 h-4"/>
                                            <span class="text-xs leading-normal align-middle text-white dark:text-[#e8e6e3]">30</span>
                                        </div>

                                        <div class="flex items-center gap-2">
                                            <div class="flex justify-center items-center w-9 h-9 min-w-[2.25rem] rounded-full overflow-hidden md:w-12 md:h-12 md:min-w-[3rem]">
                                                <img loading="lazy" src="https://i.ibb.co.com/70sHrpv/featured-media-bg.webp" alt="avatar" class="w-full h-full object-cover">
                                            </div>

                                            <div class="flex flex-col justify-between">
                                                <h3 class="text-sm font-medium line-clamp-2 text-[#F2F4F7] md:text-base dark:text-[#e1dfdb]">Princess Carrot Pop</h3>
                                                <div class="flex items-center gap-1">
                                                    <span class="text-xs leading-normal font-medium line-clamp-1 text-[#FCFCFD] dark:text-[#e6e4e1]">@sammisjelly187</span>
                                                    <img loading="lazy" src="https://i.ibb.co.com/nMhY8CpS/svgviewer-png-output-22.webp" alt="verified-tick" class="w-3 h-3"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <!-- slides-wrapper -->
            <div data-double-row-slider class="flex flex-col gap-4 md:gap-6">
                <!-- title-section -->
                <div class="flex justify-between items-center gap-2 px-4 xl:px-12">
                    <!-- title-section__left -->
                    <div class="flex items-center gap-2 md:gap-4">
                        <img loading="lazy" src="https://i.ibb.co.com/FbpnxXzs/gallery.webp" alt="gallery" class="w-6 h-6 min-w-[1.5rem] md:w-8 md:h-8 md:min-w-[2rem]">

                        <h2 class="text-xl leading-normal font-semibold text-[#344054] md:text-3xl md:leading-[2.375rem] dark:text-[#bdb8af]">Recently Uploaded</h2>
                    </div>

                    <!-- arrow-buttons -->
                    <div class="flex items-center gap-2 slider-arrows md:gap-4">
                        <button data-prev class="flex justify-center items-center w-10 h-10 rounded-full border border-black/50 backdrop-blur-[10px] cursor-pointer group/button [&.disabled]:border-black/30 md:w-12 md:h-12 dark:border-[#363b3d]/50 [&.disabled]:dark:border-[#363b3d]/30">
                            <img loading="lazy" src="https://i.ibb.co.com/wvMNs1P/chevron-right.webp" alt="chevron right" class="h-7 group-[.disabled]/button:opacity-80 rotate-180 md:h-9">
                        </button>

                        <button data-next class="flex justify-center items-center w-10 h-10 rounded-full border border-black/50 backdrop-blur-[10px] cursor-pointer group/button [&.disabled]:border-black/30 md:w-12 md:h-12 dark:border-[#363b3d]/50 [&.disabled]:dark:border-[#363b3d]/30">
                            <img loading="lazy" src="https://i.ibb.co.com/wvMNs1P/chevron-right.webp" alt="chevron right" class="h-7 group-[.disabled]/button:opacity-50 md:h-9">
                        </button>
                    </div>
                </div>

                <div class="flex flex-col gap-4">
                    <!-- Row 1 -->
                    <div class="splide" data-row="1">
                        <div class="splide__track">
                            <ul class="splide__list">
                                <li class="splide__slide aspect-[16/9] rounded-lg bg-[url('https://i.ibb.co.com/M5Q8qb4F/hero-bg-image-2-1.webp')] bg-cover bg-center bg-no-repeat overflow-hidden cursor-pointer">
                                    <div class="flex flex-col justify-between gap-2 p-2 w-full h-full bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.5)_100%)] md:p-3">
                                        <!-- media-type-container -->
                                        <div class="flex justify-center items-center gap-[0.1875rem] w-max px-1 py-[0.0625rem] rounded bg-[#182230]/50 dark:bg-[#1f2c3f]/50">
                                            <img loading="lazy" src="https://i.ibb.co.com/tTDV6Ms1/play-square.webp" alt="video" class="w-4 h-4"/>
                                            <span class="text-xs leading-normal align-middle text-white dark:text-[#e8e6e3]">15:00:03</span>
                                        </div>

                                        <div class="flex items-center gap-2">
                                            <div class="flex justify-center items-center w-9 h-9 min-w-[2.25rem] rounded-full overflow-hidden md:w-12 md:h-12 md:min-w-[3rem]">
                                                <img loading="lazy" src="https://i.ibb.co.com/70sHrpv/featured-media-bg.webp" alt="avatar" class="w-full h-full object-cover">
                                            </div>

                                            <div class="flex flex-col justify-between">
                                                <h3 class="text-sm font-medium line-clamp-2 text-[#F2F4F7] md:text-base dark:text-[#e1dfdb]">Princess Carrot Pop</h3>
                                                <div class="flex items-center gap-1">
                                                    <span class="text-xs leading-normal font-medium line-clamp-1 text-[#FCFCFD] dark:text-[#e6e4e1]">@sammisjelly187</span>
                                                    <img loading="lazy" src="https://i.ibb.co.com/nMhY8CpS/svgviewer-png-output-22.webp" alt="verified-tick" class="w-3 h-3"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>

                                <li class="splide__slide aspect-[16/9] rounded-lg bg-[url('https://i.ibb.co.com/S4vnSYPw/hero-bg-image-1-2.webp')] bg-cover bg-center bg-no-repeat overflow-hidden cursor-pointer">
                                    <div class="flex flex-col justify-between gap-2 p-2 w-full h-full bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.5)_100%)] md:p-3">
                                        <!-- media-type-container -->
                                        <div class="flex justify-center items-center gap-[0.1875rem] w-max px-1 py-[0.0625rem] rounded bg-[#182230]/50 dark:bg-[#1f2c3f]/50">
                                            <img loading="lazy" src="https://i.ibb.co.com/Q3dZ2gtL/gallery-image-icon.webp" alt="img" class="w-4 h-4"/>
                                            <span class="text-xs leading-normal align-middle text-white dark:text-[#e8e6e3]">30</span>
                                        </div>

                                        <div class="flex items-center gap-2">
                                            <div class="flex justify-center items-center w-9 h-9 min-w-[2.25rem] rounded-full overflow-hidden md:w-12 md:h-12 md:min-w-[3rem]">
                                                <img loading="lazy" src="https://i.ibb.co.com/70sHrpv/featured-media-bg.webp" alt="avatar" class="w-full h-full object-cover">
                                            </div>

                                            <div class="flex flex-col justify-between">
                                                <h3 class="text-sm font-medium line-clamp-2 text-[#F2F4F7] md:text-base dark:text-[#e1dfdb]">Princess Carrot Pop</h3>
                                                <div class="flex items-center gap-1">
                                                    <span class="text-xs leading-normal font-medium line-clamp-1 text-[#FCFCFD] dark:text-[#e6e4e1]">@sammisjelly187</span>
                                                    <img loading="lazy" src="https://i.ibb.co.com/nMhY8CpS/svgviewer-png-output-22.webp" alt="verified-tick" class="w-3 h-3"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>

                                <li class="splide__slide aspect-[16/9] rounded-lg bg-[url('https://i.ibb.co.com/j9b5wvYV/hero-bg-image-2-2.webp')] bg-cover bg-center bg-no-repeat overflow-hidden cursor-pointer">
                                    <div class="flex flex-col justify-between gap-2 p-2 w-full h-full bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.5)_100%)] md:p-3">
                                        <!-- media-type-container -->
                                        <div class="flex justify-center items-center gap-[0.1875rem] w-max px-1 py-[0.0625rem] rounded bg-[#182230]/50 dark:bg-[#1f2c3f]/50">
                                            <img loading="lazy" src="https://i.ibb.co.com/tTDV6Ms1/play-square.webp" alt="video" class="w-4 h-4"/>
                                            <span class="text-xs leading-normal align-middle text-white dark:text-[#e8e6e3]">15:00:03</span>
                                        </div>

                                        <div class="flex items-center gap-2">
                                            <div class="flex justify-center items-center w-9 h-9 min-w-[2.25rem] rounded-full overflow-hidden md:w-12 md:h-12 md:min-w-[3rem]">
                                                <img loading="lazy" src="https://i.ibb.co.com/70sHrpv/featured-media-bg.webp" alt="avatar" class="w-full h-full object-cover">
                                            </div>

                                            <div class="flex flex-col justify-between">
                                                <h3 class="text-sm font-medium line-clamp-2 text-[#F2F4F7] md:text-base dark:text-[#e1dfdb]">Princess Carrot Pop</h3>
                                                <div class="flex items-center gap-1">
                                                    <span class="text-xs leading-normal font-medium line-clamp-1 text-[#FCFCFD] dark:text-[#e6e4e1]">@sammisjelly187</span>
                                                    <img loading="lazy" src="https://i.ibb.co.com/nMhY8CpS/svgviewer-png-output-22.webp" alt="verified-tick" class="w-3 h-3"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>

                                <li class="splide__slide aspect-[16/9] rounded-lg bg-[url('https://i.ibb.co.com/wNtVT4r0/hero-bg-image-0-2.webp')] bg-cover bg-center bg-no-repeat overflow-hidden cursor-pointer">
                                    <div class="flex flex-col justify-between gap-2 p-2 w-full h-full bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.5)_100%)] md:p-3">
                                        <!-- media-type-container -->
                                        <div class="flex justify-center items-center gap-[0.1875rem] w-max px-1 py-[0.0625rem] rounded bg-[#182230]/50 dark:bg-[#1f2c3f]/50">
                                            <img loading="lazy" src="https://i.ibb.co.com/Q3dZ2gtL/gallery-image-icon.webp" alt="img" class="w-4 h-4"/>
                                            <span class="text-xs leading-normal align-middle text-white dark:text-[#e8e6e3]">30</span>
                                        </div>

                                        <div class="flex items-center gap-2">
                                            <div class="flex justify-center items-center w-9 h-9 min-w-[2.25rem] rounded-full overflow-hidden md:w-12 md:h-12 md:min-w-[3rem]">
                                                <img loading="lazy" src="https://i.ibb.co.com/70sHrpv/featured-media-bg.webp" alt="avatar" class="w-full h-full object-cover">
                                            </div>

                                            <div class="flex flex-col justify-between">
                                                <h3 class="text-sm font-medium line-clamp-2 text-[#F2F4F7] md:text-base dark:text-[#e1dfdb]">Princess Carrot Pop</h3>
                                                <div class="flex items-center gap-1">
                                                    <span class="text-xs leading-normal font-medium line-clamp-1 text-[#FCFCFD] dark:text-[#e6e4e1]">@sammisjelly187</span>
                                                    <img loading="lazy" src="https://i.ibb.co.com/nMhY8CpS/svgviewer-png-output-22.webp" alt="verified-tick" class="w-3 h-3"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <!-- Row 2 -->
                    <div class="splide" data-row="2">
                        <div class="splide__track md:!pl-[25rem]">
                            <ul class="splide__list">
                                <li class="splide__slide aspect-[16/9] rounded-lg bg-[url('https://i.ibb.co.com/j9b5wvYV/hero-bg-image-2-2.webp')] bg-cover bg-center bg-no-repeat overflow-hidden cursor-pointer">
                                    <div class="flex flex-col justify-between gap-2 p-2 w-full h-full bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.5)_100%)] md:p-3">
                                        <!-- media-type-container -->
                                        <div class="flex justify-center items-center gap-[0.1875rem] w-max px-1 py-[0.0625rem] rounded bg-[#182230]/50 dark:bg-[#1f2c3f]/50">
                                            <img loading="lazy" src="https://i.ibb.co.com/tTDV6Ms1/play-square.webp" alt="video" class="w-4 h-4"/>
                                            <span class="text-xs leading-normal align-middle text-white dark:text-[#e8e6e3]">15:00:03</span>
                                        </div>

                                        <div class="flex items-center gap-2">
                                            <div class="flex justify-center items-center w-9 h-9 min-w-[2.25rem] rounded-full overflow-hidden md:w-12 md:h-12 md:min-w-[3rem]">
                                                <img loading="lazy" src="https://i.ibb.co.com/70sHrpv/featured-media-bg.webp" alt="avatar" class="w-full h-full object-cover">
                                            </div>

                                            <div class="flex flex-col justify-between">
                                                <h3 class="text-sm font-medium line-clamp-2 text-[#F2F4F7] md:text-base dark:text-[#e1dfdb]">Princess Carrot Pop</h3>
                                                <div class="flex items-center gap-1">
                                                    <span class="text-xs leading-normal font-medium line-clamp-1 text-[#FCFCFD] dark:text-[#e6e4e1]">@sammisjelly187</span>
                                                    <img loading="lazy" src="https://i.ibb.co.com/nMhY8CpS/svgviewer-png-output-22.webp" alt="verified-tick" class="w-3 h-3"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>

                                <li class="splide__slide aspect-[16/9] rounded-lg bg-[url('https://i.ibb.co.com/wNtVT4r0/hero-bg-image-0-2.webp')] bg-cover bg-center bg-no-repeat overflow-hidden cursor-pointer">
                                    <div class="flex flex-col justify-between gap-2 p-2 w-full h-full bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.5)_100%)] md:p-3">
                                        <!-- media-type-container -->
                                        <div class="flex justify-center items-center gap-[0.1875rem] w-max px-1 py-[0.0625rem] rounded bg-[#182230]/50 dark:bg-[#1f2c3f]/50">
                                            <img loading="lazy" src="https://i.ibb.co.com/Q3dZ2gtL/gallery-image-icon.webp" alt="img" class="w-4 h-4"/>
                                            <span class="text-xs leading-normal align-middle text-white dark:text-[#e8e6e3]">30</span>
                                        </div>

                                        <div class="flex items-center gap-2">
                                            <div class="flex justify-center items-center w-9 h-9 min-w-[2.25rem] rounded-full overflow-hidden md:w-12 md:h-12 md:min-w-[3rem]">
                                                <img loading="lazy" src="https://i.ibb.co.com/70sHrpv/featured-media-bg.webp" alt="avatar" class="w-full h-full object-cover">
                                            </div>

                                            <div class="flex flex-col justify-between">
                                                <h3 class="text-sm font-medium line-clamp-2 text-[#F2F4F7] md:text-base dark:text-[#e1dfdb]">Princess Carrot Pop</h3>
                                                <div class="flex items-center gap-1">
                                                    <span class="text-xs leading-normal font-medium line-clamp-1 text-[#FCFCFD] dark:text-[#e6e4e1]">@sammisjelly187</span>
                                                    <img loading="lazy" src="https://i.ibb.co.com/nMhY8CpS/svgviewer-png-output-22.webp" alt="verified-tick" class="w-3 h-3"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>

                                <li class="splide__slide aspect-[16/9] rounded-lg bg-[url('https://i.ibb.co.com/M5Q8qb4F/hero-bg-image-2-1.webp')] bg-cover bg-center bg-no-repeat overflow-hidden cursor-pointer">
                                    <div class="flex flex-col justify-between gap-2 p-2 w-full h-full bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.5)_100%)] md:p-3">
                                        <!-- media-type-container -->
                                        <div class="flex justify-center items-center gap-[0.1875rem] w-max px-1 py-[0.0625rem] rounded bg-[#182230]/50 dark:bg-[#1f2c3f]/50">
                                            <img loading="lazy" src="https://i.ibb.co.com/tTDV6Ms1/play-square.webp" alt="video" class="w-4 h-4"/>
                                            <span class="text-xs leading-normal align-middle text-white dark:text-[#e8e6e3]">15:00:03</span>
                                        </div>

                                        <div class="flex items-center gap-2">
                                            <div class="flex justify-center items-center w-9 h-9 min-w-[2.25rem] rounded-full overflow-hidden md:w-12 md:h-12 md:min-w-[3rem]">
                                                <img loading="lazy" src="https://i.ibb.co.com/70sHrpv/featured-media-bg.webp" alt="avatar" class="w-full h-full object-cover">
                                            </div>

                                            <div class="flex flex-col justify-between">
                                                <h3 class="text-sm font-medium line-clamp-2 text-[#F2F4F7] md:text-base dark:text-[#e1dfdb]">Princess Carrot Pop</h3>
                                                <div class="flex items-center gap-1">
                                                    <span class="text-xs leading-normal font-medium line-clamp-1 text-[#FCFCFD] dark:text-[#e6e4e1]">@sammisjelly187</span>
                                                    <img loading="lazy" src="https://i.ibb.co.com/nMhY8CpS/svgviewer-png-output-22.webp" alt="verified-tick" class="w-3 h-3"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>

                                <li class="splide__slide aspect-[16/9] rounded-lg bg-[url('https://i.ibb.co.com/S4vnSYPw/hero-bg-image-1-2.webp')] bg-cover bg-center bg-no-repeat overflow-hidden cursor-pointer">
                                    <div class="flex flex-col justify-between gap-2 p-2 w-full h-full bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.5)_100%)] md:p-3">
                                        <!-- media-type-container -->
                                        <div class="flex justify-center items-center gap-[0.1875rem] w-max px-1 py-[0.0625rem] rounded bg-[#182230]/50 dark:bg-[#1f2c3f]/50">
                                            <img loading="lazy" src="https://i.ibb.co.com/Q3dZ2gtL/gallery-image-icon.webp" alt="img" class="w-4 h-4"/>
                                            <span class="text-xs leading-normal align-middle text-white dark:text-[#e8e6e3]">30</span>
                                        </div>

                                        <div class="flex items-center gap-2">
                                            <div class="flex justify-center items-center w-9 h-9 min-w-[2.25rem] rounded-full overflow-hidden md:w-12 md:h-12 md:min-w-[3rem]">
                                                <img loading="lazy" src="https://i.ibb.co.com/70sHrpv/featured-media-bg.webp" alt="avatar" class="w-full h-full object-cover">
                                            </div>

                                            <div class="flex flex-col justify-between">
                                                <h3 class="text-sm font-medium line-clamp-2 text-[#F2F4F7] md:text-base dark:text-[#e1dfdb]">Princess Carrot Pop</h3>
                                                <div class="flex items-center gap-1">
                                                    <span class="text-xs leading-normal font-medium line-clamp-1 text-[#FCFCFD] dark:text-[#e6e4e1]">@sammisjelly187</span>
                                                    <img loading="lazy" src="https://i.ibb.co.com/nMhY8CpS/svgviewer-png-output-22.webp" alt="verified-tick" class="w-3 h-3"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <!-- slides-wrapper -->
            <div data-double-row-slider class="flex flex-col gap-4 md:gap-6">
                <!-- title-section -->
                <div class="flex justify-between items-center gap-2 px-4 xl:px-12">
                    <!-- title-section__left -->
                    <div class="flex items-center gap-2 md:gap-4">
                        <img loading="lazy" src="https://i.ibb.co.com/FbpnxXzs/gallery.webp" alt="gallery" class="w-6 h-6 min-w-[1.5rem] md:w-8 md:h-8 md:min-w-[2rem]">

                        <h2 class="text-xl leading-normal font-semibold text-[#344054] md:text-3xl md:leading-[2.375rem] dark:text-[#bdb8af]">Gallery</h2>
                    </div>

                    <!-- arrow-buttons -->
                    <div class="flex items-center gap-2 slider-arrows md:gap-4">
                        <button data-prev class="flex justify-center items-center w-10 h-10 rounded-full border border-black/50 backdrop-blur-[10px] cursor-pointer group/button [&.disabled]:border-black/30 md:w-12 md:h-12 dark:border-[#363b3d]/50 [&.disabled]:dark:border-[#363b3d]/30">
                            <img loading="lazy" src="https://i.ibb.co.com/wvMNs1P/chevron-right.webp" alt="chevron right" class="h-7 group-[.disabled]/button:opacity-80 rotate-180 md:h-9">
                        </button>

                        <button data-next class="flex justify-center items-center w-10 h-10 rounded-full border border-black/50 backdrop-blur-[10px] cursor-pointer group/button [&.disabled]:border-black/30 md:w-12 md:h-12 dark:border-[#363b3d]/50 [&.disabled]:dark:border-[#363b3d]/30">
                            <img loading="lazy" src="https://i.ibb.co.com/wvMNs1P/chevron-right.webp" alt="chevron right" class="h-7 group-[.disabled]/button:opacity-50 md:h-9">
                        </button>
                    </div>
                </div>

                <div class="flex flex-col gap-4">
                    <!-- Row 1 -->
                    <div class="splide" data-row="1">
                        <div class="splide__track">
                            <ul class="splide__list">
                                <li class="splide__slide aspect-[16/9] rounded-lg bg-[url('https://i.ibb.co.com/M5Q8qb4F/hero-bg-image-2-1.webp')] bg-cover bg-center bg-no-repeat overflow-hidden cursor-pointer">
                                    <div class="flex flex-col justify-between gap-2 p-2 w-full h-full bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.5)_100%)] md:p-3">
                                        <!-- media-type-container -->
                                        <div class="flex justify-center items-center gap-[0.1875rem] w-max px-1 py-[0.0625rem] rounded bg-[#182230]/50 dark:bg-[#1f2c3f]/50">
                                            <img loading="lazy" src="https://i.ibb.co.com/tTDV6Ms1/play-square.webp" alt="video" class="w-4 h-4"/>
                                            <span class="text-xs leading-normal align-middle text-white dark:text-[#e8e6e3]">15:00:03</span>
                                        </div>

                                        <div class="flex items-center gap-2">
                                            <div class="flex justify-center items-center w-9 h-9 min-w-[2.25rem] rounded-full overflow-hidden md:w-12 md:h-12 md:min-w-[3rem]">
                                                <img loading="lazy" src="https://i.ibb.co.com/70sHrpv/featured-media-bg.webp" alt="avatar" class="w-full h-full object-cover">
                                            </div>

                                            <div class="flex flex-col justify-between">
                                                <h3 class="text-sm font-medium line-clamp-2 text-[#F2F4F7] md:text-base dark:text-[#e1dfdb]">Princess Carrot Pop</h3>
                                                <div class="flex items-center gap-1">
                                                    <span class="text-xs leading-normal font-medium line-clamp-1 text-[#FCFCFD] dark:text-[#e6e4e1]">@sammisjelly187</span>
                                                    <img loading="lazy" src="https://i.ibb.co.com/nMhY8CpS/svgviewer-png-output-22.webp" alt="verified-tick" class="w-3 h-3"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>

                                <li class="splide__slide aspect-[16/9] rounded-lg bg-[url('https://i.ibb.co.com/S4vnSYPw/hero-bg-image-1-2.webp')] bg-cover bg-center bg-no-repeat overflow-hidden cursor-pointer">
                                    <div class="flex flex-col justify-between gap-2 p-2 w-full h-full bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.5)_100%)] md:p-3">
                                        <!-- media-type-container -->
                                        <div class="flex justify-center items-center gap-[0.1875rem] w-max px-1 py-[0.0625rem] rounded bg-[#182230]/50 dark:bg-[#1f2c3f]/50">
                                            <img loading="lazy" src="https://i.ibb.co.com/Q3dZ2gtL/gallery-image-icon.webp" alt="img" class="w-4 h-4"/>
                                            <span class="text-xs leading-normal align-middle text-white dark:text-[#e8e6e3]">30</span>
                                        </div>

                                        <div class="flex items-center gap-2">
                                            <div class="flex justify-center items-center w-9 h-9 min-w-[2.25rem] rounded-full overflow-hidden md:w-12 md:h-12 md:min-w-[3rem]">
                                                <img loading="lazy" src="https://i.ibb.co.com/70sHrpv/featured-media-bg.webp" alt="avatar" class="w-full h-full object-cover">
                                            </div>

                                            <div class="flex flex-col justify-between">
                                                <h3 class="text-sm font-medium line-clamp-2 text-[#F2F4F7] md:text-base dark:text-[#e1dfdb]">Princess Carrot Pop</h3>
                                                <div class="flex items-center gap-1">
                                                    <span class="text-xs leading-normal font-medium line-clamp-1 text-[#FCFCFD] dark:text-[#e6e4e1]">@sammisjelly187</span>
                                                    <img loading="lazy" src="https://i.ibb.co.com/nMhY8CpS/svgviewer-png-output-22.webp" alt="verified-tick" class="w-3 h-3"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>

                                <li class="splide__slide aspect-[16/9] rounded-lg bg-[url('https://i.ibb.co.com/j9b5wvYV/hero-bg-image-2-2.webp')] bg-cover bg-center bg-no-repeat overflow-hidden cursor-pointer">
                                    <div class="flex flex-col justify-between gap-2 p-2 w-full h-full bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.5)_100%)] md:p-3">
                                        <!-- media-type-container -->
                                        <div class="flex justify-center items-center gap-[0.1875rem] w-max px-1 py-[0.0625rem] rounded bg-[#182230]/50 dark:bg-[#1f2c3f]/50">
                                            <img loading="lazy" src="https://i.ibb.co.com/tTDV6Ms1/play-square.webp" alt="video" class="w-4 h-4"/>
                                            <span class="text-xs leading-normal align-middle text-white dark:text-[#e8e6e3]">15:00:03</span>
                                        </div>

                                        <div class="flex items-center gap-2">
                                            <div class="flex justify-center items-center w-9 h-9 min-w-[2.25rem] rounded-full overflow-hidden md:w-12 md:h-12 md:min-w-[3rem]">
                                                <img loading="lazy" src="https://i.ibb.co.com/70sHrpv/featured-media-bg.webp" alt="avatar" class="w-full h-full object-cover">
                                            </div>

                                            <div class="flex flex-col justify-between">
                                                <h3 class="text-sm font-medium line-clamp-2 text-[#F2F4F7] md:text-base dark:text-[#e1dfdb]">Princess Carrot Pop</h3>
                                                <div class="flex items-center gap-1">
                                                    <span class="text-xs leading-normal font-medium line-clamp-1 text-[#FCFCFD] dark:text-[#e6e4e1]">@sammisjelly187</span>
                                                    <img loading="lazy" src="https://i.ibb.co.com/nMhY8CpS/svgviewer-png-output-22.webp" alt="verified-tick" class="w-3 h-3"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>

                                <li class="splide__slide aspect-[16/9] rounded-lg bg-[url('https://i.ibb.co.com/wNtVT4r0/hero-bg-image-0-2.webp')] bg-cover bg-center bg-no-repeat overflow-hidden cursor-pointer">
                                    <div class="flex flex-col justify-between gap-2 p-2 w-full h-full bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.5)_100%)] md:p-3">
                                        <!-- media-type-container -->
                                        <div class="flex justify-center items-center gap-[0.1875rem] w-max px-1 py-[0.0625rem] rounded bg-[#182230]/50 dark:bg-[#1f2c3f]/50">
                                            <img loading="lazy" src="https://i.ibb.co.com/Q3dZ2gtL/gallery-image-icon.webp" alt="img" class="w-4 h-4"/>
                                            <span class="text-xs leading-normal align-middle text-white dark:text-[#e8e6e3]">30</span>
                                        </div>

                                        <div class="flex items-center gap-2">
                                            <div class="flex justify-center items-center w-9 h-9 min-w-[2.25rem] rounded-full overflow-hidden md:w-12 md:h-12 md:min-w-[3rem]">
                                                <img loading="lazy" src="https://i.ibb.co.com/70sHrpv/featured-media-bg.webp" alt="avatar" class="w-full h-full object-cover">
                                            </div>

                                            <div class="flex flex-col justify-between">
                                                <h3 class="text-sm font-medium line-clamp-2 text-[#F2F4F7] md:text-base dark:text-[#e1dfdb]">Princess Carrot Pop</h3>
                                                <div class="flex items-center gap-1">
                                                    <span class="text-xs leading-normal font-medium line-clamp-1 text-[#FCFCFD] dark:text-[#e6e4e1]">@sammisjelly187</span>
                                                    <img loading="lazy" src="https://i.ibb.co.com/nMhY8CpS/svgviewer-png-output-22.webp" alt="verified-tick" class="w-3 h-3"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <!-- Row 2 -->
                    <div class="splide" data-row="2">
                        <div class="splide__track md:!pl-[25rem]">
                            <ul class="splide__list">
                                <li class="splide__slide aspect-[16/9] rounded-lg bg-[url('https://i.ibb.co.com/j9b5wvYV/hero-bg-image-2-2.webp')] bg-cover bg-center bg-no-repeat overflow-hidden cursor-pointer">
                                    <div class="flex flex-col justify-between gap-2 p-2 w-full h-full bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.5)_100%)] md:p-3">
                                        <!-- media-type-container -->
                                        <div class="flex justify-center items-center gap-[0.1875rem] w-max px-1 py-[0.0625rem] rounded bg-[#182230]/50 dark:bg-[#1f2c3f]/50">
                                            <img loading="lazy" src="https://i.ibb.co.com/tTDV6Ms1/play-square.webp" alt="video" class="w-4 h-4"/>
                                            <span class="text-xs leading-normal align-middle text-white dark:text-[#e8e6e3]">15:00:03</span>
                                        </div>

                                        <div class="flex items-center gap-2">
                                            <div class="flex justify-center items-center w-9 h-9 min-w-[2.25rem] rounded-full overflow-hidden md:w-12 md:h-12 md:min-w-[3rem]">
                                                <img loading="lazy" src="https://i.ibb.co.com/70sHrpv/featured-media-bg.webp" alt="avatar" class="w-full h-full object-cover">
                                            </div>

                                            <div class="flex flex-col justify-between">
                                                <h3 class="text-sm font-medium line-clamp-2 text-[#F2F4F7] md:text-base dark:text-[#e1dfdb]">Princess Carrot Pop</h3>
                                                <div class="flex items-center gap-1">
                                                    <span class="text-xs leading-normal font-medium line-clamp-1 text-[#FCFCFD] dark:text-[#e6e4e1]">@sammisjelly187</span>
                                                    <img loading="lazy" src="https://i.ibb.co.com/nMhY8CpS/svgviewer-png-output-22.webp" alt="verified-tick" class="w-3 h-3"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>

                                <li class="splide__slide aspect-[16/9] rounded-lg bg-[url('https://i.ibb.co.com/wNtVT4r0/hero-bg-image-0-2.webp')] bg-cover bg-center bg-no-repeat overflow-hidden cursor-pointer">
                                    <div class="flex flex-col justify-between gap-2 p-2 w-full h-full bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.5)_100%)] md:p-3">
                                        <!-- media-type-container -->
                                        <div class="flex justify-center items-center gap-[0.1875rem] w-max px-1 py-[0.0625rem] rounded bg-[#182230]/50 dark:bg-[#1f2c3f]/50">
                                            <img loading="lazy" src="https://i.ibb.co.com/Q3dZ2gtL/gallery-image-icon.webp" alt="img" class="w-4 h-4"/>
                                            <span class="text-xs leading-normal align-middle text-white dark:text-[#e8e6e3]">30</span>
                                        </div>

                                        <div class="flex items-center gap-2">
                                            <div class="flex justify-center items-center w-9 h-9 min-w-[2.25rem] rounded-full overflow-hidden md:w-12 md:h-12 md:min-w-[3rem]">
                                                <img loading="lazy" src="https://i.ibb.co.com/70sHrpv/featured-media-bg.webp" alt="avatar" class="w-full h-full object-cover">
                                            </div>

                                            <div class="flex flex-col justify-between">
                                                <h3 class="text-sm font-medium line-clamp-2 text-[#F2F4F7] md:text-base dark:text-[#e1dfdb]">Princess Carrot Pop</h3>
                                                <div class="flex items-center gap-1">
                                                    <span class="text-xs leading-normal font-medium line-clamp-1 text-[#FCFCFD] dark:text-[#e6e4e1]">@sammisjelly187</span>
                                                    <img loading="lazy" src="https://i.ibb.co.com/nMhY8CpS/svgviewer-png-output-22.webp" alt="verified-tick" class="w-3 h-3"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>

                                <li class="splide__slide aspect-[16/9] rounded-lg bg-[url('https://i.ibb.co.com/M5Q8qb4F/hero-bg-image-2-1.webp')] bg-cover bg-center bg-no-repeat overflow-hidden cursor-pointer">
                                    <div class="flex flex-col justify-between gap-2 p-2 w-full h-full bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.5)_100%)] md:p-3">
                                        <!-- media-type-container -->
                                        <div class="flex justify-center items-center gap-[0.1875rem] w-max px-1 py-[0.0625rem] rounded bg-[#182230]/50 dark:bg-[#1f2c3f]/50">
                                            <img loading="lazy" src="https://i.ibb.co.com/tTDV6Ms1/play-square.webp" alt="video" class="w-4 h-4"/>
                                            <span class="text-xs leading-normal align-middle text-white dark:text-[#e8e6e3]">15:00:03</span>
                                        </div>

                                        <div class="flex items-center gap-2">
                                            <div class="flex justify-center items-center w-9 h-9 min-w-[2.25rem] rounded-full overflow-hidden md:w-12 md:h-12 md:min-w-[3rem]">
                                                <img loading="lazy" src="https://i.ibb.co.com/70sHrpv/featured-media-bg.webp" alt="avatar" class="w-full h-full object-cover">
                                            </div>

                                            <div class="flex flex-col justify-between">
                                                <h3 class="text-sm font-medium line-clamp-2 text-[#F2F4F7] md:text-base dark:text-[#e1dfdb]">Princess Carrot Pop</h3>
                                                <div class="flex items-center gap-1">
                                                    <span class="text-xs leading-normal font-medium line-clamp-1 text-[#FCFCFD] dark:text-[#e6e4e1]">@sammisjelly187</span>
                                                    <img loading="lazy" src="https://i.ibb.co.com/nMhY8CpS/svgviewer-png-output-22.webp" alt="verified-tick" class="w-3 h-3"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>

                                <li class="splide__slide aspect-[16/9] rounded-lg bg-[url('https://i.ibb.co.com/S4vnSYPw/hero-bg-image-1-2.webp')] bg-cover bg-center bg-no-repeat overflow-hidden cursor-pointer">
                                    <div class="flex flex-col justify-between gap-2 p-2 w-full h-full bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.5)_100%)] md:p-3">
                                        <!-- media-type-container -->
                                        <div class="flex justify-center items-center gap-[0.1875rem] w-max px-1 py-[0.0625rem] rounded bg-[#182230]/50 dark:bg-[#1f2c3f]/50">
                                            <img loading="lazy" src="https://i.ibb.co.com/Q3dZ2gtL/gallery-image-icon.webp" alt="img" class="w-4 h-4"/>
                                            <span class="text-xs leading-normal align-middle text-white dark:text-[#e8e6e3]">30</span>
                                        </div>

                                        <div class="flex items-center gap-2">
                                            <div class="flex justify-center items-center w-9 h-9 min-w-[2.25rem] rounded-full overflow-hidden md:w-12 md:h-12 md:min-w-[3rem]">
                                                <img loading="lazy" src="https://i.ibb.co.com/70sHrpv/featured-media-bg.webp" alt="avatar" class="w-full h-full object-cover">
                                            </div>

                                            <div class="flex flex-col justify-between">
                                                <h3 class="text-sm font-medium line-clamp-2 text-[#F2F4F7] md:text-base dark:text-[#e1dfdb]">Princess Carrot Pop</h3>
                                                <div class="flex items-center gap-1">
                                                    <span class="text-xs leading-normal font-medium line-clamp-1 text-[#FCFCFD] dark:text-[#e6e4e1]">@sammisjelly187</span>
                                                    <img loading="lazy" src="https://i.ibb.co.com/nMhY8CpS/svgviewer-png-output-22.webp" alt="verified-tick" class="w-3 h-3"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <!-- sign-up-button -->
            <button class="flex justify-center items-center px-4 py-2.5 mx-auto bg-[#07F468] group/button hover:bg-[#0C111D] dark:bg-[#0aff78] dark:hover:bg-[#162036]">
                <span class="text-lg font-semibold text-[#0C111D] group-hover/button:text-[#07F468] md:text-xl md:leading-normal dark:text-[#dbd8d3] dark:group-hover/button:text-[#23f97b]">SIGN UP TO EXPLORE ALL CONTENT</span>
            </button>
        </div>
    </div>

    <!-- tab-section -->
    <div class="flex flex-col gap-6 py-20 relative bg-[#EAECF0] bg-[linear-gradient(180deg,rgba(255,255,255,0.75)_70%,rgba(255,255,255,0)_100%)]">
        <!-- blur-overlay -->
        <div class="absolute inset-0 w-full h-full backdrop-blur-[25px] pointer-events-none z-[-1]"></div>

        <div class="flex flex-col gap-6">
            <!-- title-section -->
            <section class="flex flex-col justify-center items-center text-center gap-2 px-4 py-2.5 md:gap-4 md:py-0 xl:gap-7 xl:px-12">
                <h2 class="text-2xl font-semibold text-[#344054] md:text-3xl md:leading-[2.375rem] xl:text-5xl xl:leading-[3.75rem] xl:tracking-[-0.06rem] dark:text-[#bdb8af]">Stop Jumping Between Platforms.</h2>
                <p class="text-base font-semibold text-[#344054] md:text-lg md:font-medium xl:text-2xl dark:text-[#bdb8af]">Start Thriving in One Dynamic Ecosystem.</p>
            </section>

            <!-- tab-section -->
            <div class="flex flex-col gap-6">
                <!-- tab-buttons -->
                <div class="flex items-center gap-6 px-4 py-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:px-12">
                    <ul class="flex items-center gap-2 xl:gap-4">
                        <li data-tab-btn="media-&-merch" class="flex justify-center items-center gap-2.5 px-5 py-2 bg-[#FCFCFD] rounded-[6.25rem] shadow-[0px_3px_16.8px_0px_#0C111D26] cursor-pointer group/tab-button tab-active [&.tab-active]:bg-[#07F468] xl:px-8 xl:py-4 dark:bg-[#191c1d] dark:[&.tab-active]:bg-[#06c454]">
                            <span class="text-sm leading-6 font-semibold uppercase whitespace-nowrap text-[#101828] md:font-medium xl:text-lg dark:text-[#d6d3cd]">Media & Merch</span>
                        </li>

                        <li data-tab-btn="membership-subscription" class="flex justify-center items-center gap-2.5 px-5 py-2 bg-[#FCFCFD] rounded-[6.25rem] shadow-[0px_3px_16.8px_0px_#0C111D26] cursor-pointer group/tab-button [&.tab-active]:bg-[#07F468] xl:px-8 xl:py-4 dark:bg-[#191c1d] dark:[&.tab-active]:bg-[#06c454]">
                            <span class="text-sm leading-6 font-semibold uppercase whitespace-nowrap text-[#101828] md:font-medium xl:text-lg dark:text-[#d6d3cd]">Membership subscription</span>
                        </li>

                        <li data-tab-btn="calls-&-events" class="flex justify-center items-center gap-2.5 px-5 py-2 bg-[#FCFCFD] rounded-[6.25rem] shadow-[0px_3px_16.8px_0px_#0C111D26] cursor-pointer group/tab-button [&.tab-active]:bg-[#07F468] xl:px-8 xl:py-4 dark:bg-[#191c1d] dark:[&.tab-active]:bg-[#06c454]">
                            <span class="text-sm leading-6 font-semibold uppercase whitespace-nowrap text-[#101828] md:font-medium xl:text-lg dark:text-[#d6d3cd]">Calls & Events</span>
                        </li>

                        <li data-tab-btn="coming-soon" class="flex justify-center items-center gap-2.5 px-5 py-2 bg-[#FCFCFD] rounded-[6.25rem] shadow-[0px_3px_16.8px_0px_#0C111D26] cursor-pointer group/tab-button [&.tab-active]:bg-[#07F468] xl:px-8 xl:py-4 dark:bg-[#191c1d] dark:[&.tab-active]:bg-[#06c454]">
                            <span class="text-sm leading-6 font-semibold uppercase whitespace-nowrap text-[#101828] md:font-medium xl:text-lg dark:text-[#d6d3cd]">coming soon</span>
                        </li>
                    </ul>
                </div>

                <!-- tab-container -->
                <div class="flex flex-col px-4 xl:px-12">
                    <div data-tab-panel="media-&-merch" class="flex flex-col gap-6 md:gap-4 xl:flex-row">
                        <article class="flex flex-col justify-end items-end rounded-[1.875rem] bg-[#F5F5F5] h-[34.375rem] overflow-hidden relative md:flex-row md:h-[29.09375rem] md:bg-[linear-gradient(180deg,rgba(239,239,240,0)_0%,rgba(239,239,240,0.95)_60%)] xl:flex-col xl:w-[42.75rem] xl:h-[48.25rem] xl:[background:#F5F5F5] dark:bg-[#1e2021]">
                            <!-- img-container -->
                            <div class="w-full h-[19.375rem] absolute top-0 md:static md:w-1/2 md:h-full xl:w-full xl:h-[44.75rem]">
                                <img loading="lazy" src="https://i.ibb.co.com/0gJQhnr/custom.webp" alt="custom" class="w-full object-cover">
                            </div>

                            <!-- text-section -->
                            <section class="flex flex-col gap-2 px-5 pt-10 pb-5 [background:linear-gradient(180deg,rgba(239,239,240,0)_0%,rgba(239,239,240,0.95)_60%)] backdrop-blur-[6px] md:w-1/2 md:p-5 md:[background:transparent] xl:w-full xl:bg-[linear-gradient(180deg,rgba(239,239,240,0)_0%,rgba(239,239,240,0.95)_60%)] xl:pt-16 xl:px-8 xl:pb-8">
                                <h3 class="text-lg font-semibold text-[#0C111D] md:text-xl md:leading-normal md:font-medium xl:text-2xl dark:text-[#dbd8d3]">Build your ultimate revenue generating ecosystem</h3>
                            
                                <p class="text-sm text-[#101828] md:text-base dark:text-[#d6d3cd]">Upload physical merch, digital downloads, exclusive videos, or image sets all in one place. The possibility to sell is endless : Simply sell them as pay per views, or make your content exclusive by controlling media and product access to subscribers only. Our website’s seamless ecosystems even allows you to upsell in other revenue streams like live call and group events!</p>
                            </section>
                        </article>

                        <div class="flex flex-col gap-6 md:flex-row md:gap-4 xl:flex-col xl:flex-1">
                            <article class="flex flex-col justify-end items-end rounded-[1.875rem] bg-[#F5F5F5] h-[25rem] overflow-hidden relative md:w-1/2 md:order-2 md:h-[29.09375rem] xl:w-full xl:h-1/2 dark:bg-[#1e2021]">
                                <!-- img-container -->
                                <div class="w-full h-full absolute top-0 md:h-[24.59375rem] lg:h-[22.46875rem] xl:h-[21.625rem]">
                                    <img loading="lazy" src="https://i.ibb.co.com/1GSgfC6N/perks.webp" alt="perks" class="w-full object-cover">
                                </div>

                                <!-- text-section -->
                                <section class="flex flex-col gap-2 px-5 pt-16 pb-5 [background:linear-gradient(180deg,rgba(239,239,240,0)_0%,rgba(239,239,240,0.95)_60%)] backdrop-blur-[6px] xl:pt-16 xl:px-8 xl:pb-8">
                                    <h3 class="text-lg font-semibold text-[#0C111D] md:text-xl md:leading-normal md:font-medium xl:text-2xl dark:text-[#dbd8d3]">Real-Time Strategy Optimization</h3>
                                
                                    <p class="text-sm text-[#101828] md:text-base dark:text-[#d6d3cd]">Track sales performance as it happens and instantly tweak your pricing, access settings, or subscription models to maximize conversion based on live data.</p>
                                </section>
                            </article>

                            <article class="flex flex-col justify-end items-end rounded-[1.875rem] bg-[#F5F5F5] h-[25rem] overflow-hidden relative md:w-1/2 md:order-1 md:h-[29.09375rem] xl:w-full xl:h-1/2 dark:bg-[#1e2021]">
                                <!-- img-container -->
                                <div class="w-full h-[18rem] absolute top-0 md:h-[20.96875rem] lg:h-full xl:h-[23.125rem]">
                                    <img loading="lazy" src="https://i.ibb.co.com/hF8f4xzB/automated.webp" alt="automated" class="w-full object-cover">
                                </div>

                                <!-- text-section -->
                                <section class="flex flex-col gap-2 px-5 pt-10 pb-5 [background:linear-gradient(180deg,rgba(239,239,240,0)_0%,rgba(239,239,240,0.95)_60%)] backdrop-blur-[6px] xl:pt-16 xl:px-8 xl:pb-8">
                                    <h3 class="text-lg font-semibold text-[#0C111D] md:text-xl md:leading-normal md:font-medium xl:text-2xl dark:text-[#dbd8d3]">Global reach on overview</h3>
                                
                                    <p class="text-sm text-[#101828] md:text-base dark:text-[#d6d3cd]">New and trending creators and their media will featured on fan’s dashboard, helping you connect your profile with like-minded community.</p>
                                </section>
                            </article>
                        </div>
                    </div>

                    <div data-tab-panel="membership-subscription" class="hidden grid grid-rows-4 gap-6 md:gap-4 md:[grid-template-rows:repeat(3,minmax(0,auto))] md:grid-cols-2 xl:[grid-template-rows:repeat(2,minmax(0,auto))] xl:[grid-template-columns:repeat(2,minmax(0,auto))]">
                        <article class="flex flex-col justify-end items-end w-full h-[25rem] relative rounded-[1.875rem] overflow-hidden bg-[#F5F5F5] order-1 md:order-1 md:col-span-2 md:flex-row md:w-full md:h-[14.046875rem] md:bg-[linear-gradient(180deg,rgba(239,239,240,0)_0%,rgba(239,239,240,0.95)_60%)] xl:row-span-1 xl:col-span-1 xl:[background:#f5f5f5] xl:flex-col xl:h-[33.35rem] dark:bg-[#1e2021]">
                            <!-- img-container -->
                            <div class="absolute top-0 w-full h-[16.75rem] md:static md:w-1/2 md:h-full xl:w-full xl:h-[31.35rem]">
                                <img loading="lazy" src="https://i.ibb.co.com/Pb7jpFZ/wish.webp" alt="wish" class="w-full object-cover">
                            </div>

                            <!-- text-section -->
                            <section class="flex flex-col gap-2 px-5 pt-10 pb-5 [background:linear-gradient(180deg,rgba(239,239,240,0)_0%,rgba(239,239,240,0.95)_60%)] backdrop-blur-[6px] md:w-1/2 md:p-5 md:[background:transparent] xl:w-full xl:bg-[linear-gradient(180deg,rgba(239,239,240,0)_0%,rgba(239,239,240,0.95)_60%)] xl:pt-16 xl:px-8 xl:pb-8">
                                <h3 class="text-lg font-semibold text-[#0C111D] md:text-xl md:leading-normal md:font-medium xl:text-2xl dark:text-[#dbd8d3]">Flexible payment for Every Fan</h3>
                            
                                <p class="text-sm text-[#101828] md:text-base dark:text-[#d6d3cd]">One price doesn't fit all. Create a customized ladder of support with monthly options for casual viewers and discounted annual plans for your core community, maximizing your recurring revenue.</p>
                            </section>
                        </article>

                        <article class="flex flex-col justify-end items-end w-full h-[25rem] relative rounded-[1.875rem] overflow-hidden bg-[#F5F5F5] order-2 md:order-3 md:row-span-3 md:flex-col md:w-full md:h-[29.0625rem] xl:row-span-2 xl:col-span-1 xl:flex-col xl:h-[21.9rem] dark:bg-[#1e2021]">
                            <!-- img-container -->
                            <div class="absolute top-0 w-full h-[16.75rem] md:static md:h-[16.0625rem] xl:w-full xl:h-[19.9rem]">
                                <img loading="lazy" src="https://i.ibb.co.com/0gJQhnr/custom.webp" alt="custom" class="w-full object-cover">
                            </div>

                            <!-- text-section -->
                            <section class="flex flex-col gap-2 px-5 pt-10 pb-5 [background:linear-gradient(180deg,rgba(239,239,240,0)_0%,rgba(239,239,240,0.95)_60%)] backdrop-blur-[6px] md:px-5 md:pt-10 md:pb-5 xl:w-full xl:bg-[linear-gradient(180deg,rgba(239,239,240,0)_0%,rgba(239,239,240,0.95)_60%)] xl:pt-16 xl:px-8 xl:pb-8">
                                <h3 class="text-lg font-semibold text-[#0C111D] md:text-xl md:leading-normal md:font-medium xl:text-2xl dark:text-[#dbd8d3]">Automated Subscriber Retention</h3>
                            
                                <p class="text-sm text-[#101828] md:text-base dark:text-[#d6d3cd]">Don’t let a cancellation be the end of the road. Activate our smart retention tools to automatically offer special discounts or offers when a subscriber attempts to leave, winning them back before they go.</p>
                            </section>
                        </article>

                        <article class="flex flex-col justify-end items-end w-full h-[25rem] relative rounded-[1.875rem] overflow-hidden bg-[#F5F5F5] order-3 md:order-2 md:col-span-2 md:flex-row md:w-full md:h-[14.046875rem] md:bg-[linear-gradient(180deg,rgba(239,239,240,0)_0%,rgba(239,239,240,0.95)_60%)] xl:row-span-1 xl:col-span-1 xl:[background:#f5f5f5] xl:flex-col xl:h-[33.35rem] dark:bg-[#1e2021]">
                            <!-- img-container -->
                            <div class="absolute top-0 w-full h-full md:static md:w-1/2 md:h-full xl:w-full xl:h-[31.35rem]">
                                <img loading="lazy" src="https://i.ibb.co.com/nqq3yDMb/smart.webp" alt="smart" class="w-full object-cover">
                            </div>

                            <!-- text-section -->
                            <section class="flex flex-col gap-2 px-5 pt-16 pb-5 [background:linear-gradient(180deg,rgba(239,239,240,0)_0%,rgba(239,239,240,0.95)_60%)] backdrop-blur-[6px] md:w-1/2 md:p-5 md:[background:transparent] xl:w-full xl:bg-[linear-gradient(180deg,rgba(239,239,240,0)_0%,rgba(239,239,240,0.95)_60%)] xl:pt-16 xl:px-8 xl:pb-8">
                                <h3 class="text-lg font-semibold text-[#0C111D] md:text-xl md:leading-normal md:font-medium xl:text-2xl dark:text-[#dbd8d3]">Perks That Build Loyalty</h3>
                            
                                <p class="text-sm text-[#101828] md:text-base dark:text-[#d6d3cd]">Give back to the fans who support you most. Configure automatic benefits like free monthly tokens, store-wide discounts on merch, or access to VIP-only media to keep your churn rate low.</p>
                            </section>
                        </article>

                        <article class="flex flex-col justify-end items-end w-full h-[25rem] relative rounded-[1.875rem] overflow-hidden bg-[#F5F5F5] order-4 md:order-4 md:row-span-3 md:flex-col md:w-full md:h-[29.0625rem] xl:row-span-2 xl:col-span-1 xl:flex-col xl:h-[21.9rem] dark:bg-[#1e2021]">
                            <!-- img-container -->
                            <div class="absolute top-0 w-full h-full md:static md:h-[27.9375rem] xl:w-full xl:h-[21.4rem]">
                                <img loading="lazy" src="https://i.ibb.co.com/WWRNrL84/flexible.webp" alt="flexible" class="w-full object-cover">
                            </div>

                            <!-- text-section -->
                            <section class="flex flex-col gap-2 px-5 pt-16 pb-5 [background:linear-gradient(180deg,rgba(239,239,240,0)_0%,rgba(239,239,240,0.95)_60%)] backdrop-blur-[6px] md:px-5 md:pt-16 md:pb-5 xl:w-full xl:bg-[linear-gradient(180deg,rgba(239,239,240,0)_0%,rgba(239,239,240,0.95)_60%)] xl:pt-16 xl:px-8 xl:pb-8">
                                <h3 class="text-lg font-semibold text-[#0C111D] md:text-xl md:leading-normal md:font-medium xl:text-2xl dark:text-[#dbd8d3]">Keep all your fans in the loop</h3>
                            
                                <p class="text-sm text-[#101828] md:text-base dark:text-[#d6d3cd]">connect your Our website account with your existing social media such as X and Telegram, let everyone know what you’re up to in one single post!</p>
                            </section>
                        </article>
                    </div>

                    <div data-tab-panel="calls-&-events" class="hidden flex flex-col gap-6 md:gap-4">
                        <div class="flex flex-col gap-6 md:flex-row md:gap-4">
                            <article class="flex flex-col justify-end items-end rounded-[1.875rem] bg-[#F5F5F5] h-[28.125rem] overflow-hidden relative md:w-1/2 md:h-[34.11rem] md:bg-[linear-gradient(180deg,rgba(239,239,240,0)_0%,rgba(239,239,240,0.95)_60%)] xl:flex-col xl:h-[32.45rem] dark:bg-[#1e2021]">
                                <!-- img-container -->
                                <div class="w-full h-[17.375rem] absolute top-0 md:static md:h-[19.98rem] xl:w-full xl:h-[20.556rem]">
                                    <img loading="lazy" src="https://i.ibb.co.com/1GSgfC6N/perks.webp" alt="perks" class="w-full object-cover">
                                </div>

                                <!-- text-section -->
                                <section class="flex flex-col gap-2 px-5 pt-10 pb-5 [background:linear-gradient(180deg,rgba(239,239,240,0)_0%,rgba(239,239,240,0.95)_60%)] backdrop-blur-[6px] md:[background:transparent] xl:w-full xl:p-8">
                                    <h3 class="text-lg font-semibold text-[#0C111D] md:text-xl md:leading-normal md:font-medium xl:text-2xl dark:text-[#dbd8d3]">Instant Call</h3>
                                
                                    <p class="text-sm text-[#101828] md:text-base dark:text-[#d6d3cd]">Stay in the loop with your fans no matter where you are! With our Telegram integration, you’ll get instant notifications for incoming calls, ensuring you never miss a chance to chat. Plus, effortlessly upsell your items already listed on Our website while you’re at it!</p>
                                </section>
                            </article>

                            <article class="flex flex-col justify-end items-end rounded-[1.875rem] bg-[#F5F5F5] h-[31.25rem] overflow-hidden relative md:w-1/2 md:h-[34.11rem] md:bg-[linear-gradient(180deg,rgba(239,239,240,0)_0%,rgba(239,239,240,0.95)_60%)] xl:flex-col xl:h-[32.45rem] dark:bg-[#1e2021]">
                                <!-- img-container -->
                                <div class="w-full h-[21.75rem] absolute top-0 md:static md:h-[21.48rem] xl:w-full xl:h-[24.214rem]">
                                    <img loading="lazy" src="https://i.ibb.co.com/hF8f4xzB/automated.webp" alt="automated" class="w-full object-cover">
                                </div>

                                <!-- text-section -->
                                <section class="flex flex-col gap-2 px-5 pt-10 pb-5 [background:linear-gradient(180deg,rgba(239,239,240,0)_0%,rgba(239,239,240,0.95)_60%)] backdrop-blur-[6px] md:[background:transparent] xl:w-full xl:p-8">
                                    <h3 class="text-lg font-semibold text-[#0C111D] md:text-xl md:leading-normal md:font-medium xl:text-2xl dark:text-[#dbd8d3]">Booking Schedule</h3>
                                
                                    <p class="text-sm text-[#101828] md:text-base dark:text-[#d6d3cd]">Get ready to let your fans book some quality time with you! Set your availability and offer exclusive call requests, plus don’t forget to showcase your media and merch during those chats. It’s the perfect way to connect and sell at the same time!</p>
                                </section>
                            </article>
                        </div>

                        <article class="flex flex-col justify-end items-end rounded-[1.875rem] bg-[#F5F5F5] h-[31.25rem] overflow-hidden relative md:flex-row-reverse md:h-[24.078rem] md:bg-[linear-gradient(180deg,rgba(239,239,240,0)_0%,rgba(239,239,240,0.95)_60%)] xl:h-[21.3rem] dark:bg-[#1e2021]">
                            <!-- img-container -->
                            <div class="w-full h-[19.25rem] absolute top-0 md:static md:w-1/2 md:h-full">
                                <img loading="lazy" src="https://i.ibb.co.com/Pb7jpFZ/wish.webp" alt="wish" class="w-full object-cover">
                            </div>

                            <!-- text-section -->
                            <section class="flex flex-col gap-2 px-5 pt-10 pb-5 [background:linear-gradient(180deg,rgba(239,239,240,0)_0%,rgba(239,239,240,0.95)_60%)] backdrop-blur-[6px] md:w-1/2 md:p-5 md:[background:transparent] xl:p-8">
                                <h3 class="text-lg font-semibold text-[#0C111D] md:text-xl md:leading-normal md:font-medium xl:text-2xl dark:text-[#dbd8d3]">Group Event</h3>
                            
                                <p class="text-sm text-[#101828] md:text-base dark:text-[#d6d3cd]">Join forces with fellow Our website creators and expand your fan base! Host exciting group events where you can engage your audience with interactive live streams, like thrilling lucky draws and live auctions. You’re in control of who gets to join the fun, and you can even receive tips and gifts from your loyal fans!</p>
                            </section>
                        </article>
                    </div>

                    <div data-tab-panel="coming-soon" class="hidden flex flex-col gap-6 md:gap-4">
                        <div class="flex flex-col gap-6 md:gap-4 md:flex-row">
                            <article class="flex flex-col justify-end items-end rounded-[1.875rem] bg-[#F5F5F5] h-[25rem] overflow-hidden relative md:w-1/2 md:h-[35.045rem] xl:h-[35.96rem] dark:bg-[#1e2021]">
                                <!-- img-container -->
                                <div class="w-full h-[17.5rem] absolute top-0 md:h-[24.59375rem] lg:h-full xl:h-[35.46rem]">
                                    <img loading="lazy" src="https://i.ibb.co.com/0gJQhnr/custom.webp" alt="custom" class="w-full object-cover">
                                </div>

                                <!-- text-section -->
                                <section class="flex flex-col gap-2 px-5 pt-10 pb-5 [background:linear-gradient(180deg,rgba(239,239,240,0)_0%,rgba(239,239,240,0.95)_60%)] backdrop-blur-[6px] xl:p-8">
                                    <h3 class="text-lg font-semibold text-[#0C111D] md:text-xl md:leading-normal md:font-medium xl:text-2xl dark:text-[#dbd8d3]">Smart Access & Dynamic Pricing</h3>
                                
                                    <p class="text-sm text-[#101828] md:text-base dark:text-[#d6d3cd]">You control the exclusivity. Make products public for maximum reach, gate them for subscribers only, or offer automated discounts to your loyalest fans. You can even flash-sell items live during events.</p>
                                </section>
                            </article>
                            
                            <article class="flex flex-col justify-end items-end rounded-[1.875rem] bg-[#F5F5F5] h-[28.125rem] overflow-hidden relative md:w-1/2 md:h-[35.045rem] xl:h-[35.96rem] dark:bg-[#1e2021]">
                                <!-- img-container -->
                                <div class="w-full h-[19.875rem] absolute top-0 md:h-[33.92rem] lg:h-full xl:h-[35.46rem]">
                                    <img loading="lazy" src="https://i.ibb.co.com/nqq3yDMb/smart.webp" alt="smart" class="w-full object-cover">
                                </div>

                                <!-- text-section -->
                                <section class="flex flex-col gap-2 px-5 pt-10 pb-5 [background:linear-gradient(180deg,rgba(239,239,240,0)_0%,rgba(239,239,240,0.95)_60%)] backdrop-blur-[6px] xl:w-full xl:px-8 xl:pt-16 xl:pb-8">
                                    <h3 class="text-lg font-semibold text-[#0C111D] md:text-xl md:leading-normal md:font-medium xl:text-2xl dark:text-[#dbd8d3]">Custom request</h3>
                                
                                    <p class="text-sm text-[#101828] md:text-base dark:text-[#d6d3cd]">Open a high-value revenue stream by accepting paid custom orders through your profile. Whether it’s personalized shoutouts or custom-made goods, let fans commission you directly.</p>
                                </section>
                            </article>
                        </div>

                        <div class="flex flex-col gap-6 md:gap-4 md:flex-row">
                            <article class="flex flex-col justify-end items-end rounded-[1.875rem] bg-[#F5F5F5] h-[31.77rem] overflow-hidden relative md:w-1/2 xl:h-[32.6rem] dark:bg-[#1e2021]">
                                <!-- img-container -->
                                <div class="w-full h-[27.77rem] absolute top-0 md:h-[25.77rem] lg:h-[30.64rem] xl:h-[27.1rem]">
                                    <img loading="lazy" src="https://i.ibb.co.com/WWRNrL84/flexible.webp" alt="flexible" class="w-full object-cover">
                                </div>

                                <!-- text-section -->
                                <section class="flex flex-col gap-2 px-5 pt-10 pb-5 [background:linear-gradient(180deg,rgba(239,239,240,0)_0%,rgba(239,239,240,0.95)_60%)] backdrop-blur-[6px] xl:pt-16 xl:px-8 xl:pb-8">
                                    <h3 class="text-lg font-semibold text-[#0C111D] md:text-xl md:leading-normal md:font-medium xl:text-2xl dark:text-[#dbd8d3]">Broadcast in real-time to a global audience</h3>
                                
                                    <p class="text-sm text-[#101828] md:text-base dark:text-[#d6d3cd]">Build your own loyal communities through scheduled live streaming events - chat with them during events, set and achieve tipping goals together and offer attractive offers or lucky draw to your viewers, creating your own kind of community hangout!</p>
                                </section>
                            </article>
                            
                            <article class="flex flex-col justify-end items-end rounded-[1.875rem] bg-[#F5F5F5] h-[31.77rem] overflow-hidden relative md:w-1/2 xl:h-[32.6rem] dark:bg-[#1e2021]">
                                <!-- img-container -->
                                <div class="w-full h-full absolute top-0 md:h-[30.64rem] lg:h-full xl:h-[32.1rem]">
                                    <img loading="lazy" src="https://i.ibb.co.com/1GSgfC6N/perks.webp" alt="perks" class="w-full object-cover">
                                </div>

                                <!-- text-section -->
                                <section class="flex flex-col gap-2 px-5 pt-10 pb-5 [background:linear-gradient(180deg,rgba(239,239,240,0)_0%,rgba(239,239,240,0.95)_60%)] backdrop-blur-[6px] xl:pt-16 xl:px-8 xl:pb-8">
                                    <h3 class="text-lg font-semibold text-[#0C111D] md:text-xl md:leading-normal md:font-medium xl:text-2xl dark:text-[#dbd8d3]">Wish Tender</h3>
                                
                                    <p class="text-sm text-[#101828] md:text-base dark:text-[#d6d3cd]">Create wish list directly on Our website and let your fans send you gifts through your favourite online shopping platforms securely, and ensure your sensitive information stay private. </p>
                                </section>
                            </article>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- your-saftey-section -->
    <div class="w-full bg-[url('https://i.ibb.co.com/5WQ43b48/sample-bg-image-compressed.webp')] bg-cover bg-center bg-no-repeat">
        <div class="flex flex-col px-4 py-12 bg-[linear-gradient(180deg,rgba(251,91,162,0.35)_0%,rgba(255,0,102,0.7)_100%)] md:justify-center md:items-end md:px-6 md:py-[4.3125rem] md:min-h-[19.875rem] xl:px-12">
            <section class="flex flex-col gap-4 drop-shadow-[0px_0px_8px_#00000040] md:max-w-[39.4375rem]">
                <h2 class="text-xl leading-normal font-semibold text-white md:text-4xl md:leading-[2.75rem] md:-tracking-[0.045rem] dark:text-[#e8e6e3]">Your safety is our business. </h2>
                <p class="text-sm text-white md:text-xl md:leading-normal md:font-medium dark:text-[#e8e6e3]">We employ the most advanced encryption and secure protocols to safeguard your personal information. KYC helps us create a secure environment by verifying identities, protecting you from impersonators and fraudulent accounts. </p>
            </section>
        </div>
    </div>

    <!-- review-section -->
    <div class="w-full flex flex-col gap-6 bg-[#EAECF0] bg-[linear-gradient(180deg,rgba(255,255,255,0.75)_70%,rgba(255,255,255,0)_100%)] py-16 md:gap-10 md:py-20 dark:bg-[#222526]">
        <!-- blur-overlay -->
        <div class="absolute inset-0 w-full h-full backdrop-blur-[25px] pointer-events-none z-[-1]"></div>

        <!-- title-container -->
        <div class="px-4 py-2.5">
            <h2 class="text-2xl font-semibold text-center text-[#344054] md:text-4xl md:leading-[2.75rem] md:-tracking-[0.045rem] dark:text-[#bdb8af]">Real Creators. Real Success.</h2>
        </div>

        <div class="splide" data-review-section-slider>
            <div class="splide__track">
                <ul class="splide__list">
                    <li class="splide__slide cursor-pointer">
                        <div class="w-full h-full flex flex-col justify-between gap-4 p-4 rounded-[0.625rem] overflow-hidden bg-[linear-gradient(180deg,rgba(24,34,48,0.52)_0%,rgba(24,34,48,0.8)_100%),url('https://i.ibb.co.com/vxMgZvJD/hero-bg-image-1-1.webp')] bg-cover bg-center bg-no-repeat xl:p-6">
                            <div class="flex flex-col gap-4">
                                <img loading="lazy" src="https://i.ibb.co.com/kgq8zCfd/quote-green.webp" alt="quote green" class="w-6">

                                <p class="text-sm line-clamp-[9] text-[#F2F4F7] md:text-base xl:line-clamp-[7] dark:text-[#e1dfdb]">Having a dedicated account manager at Our website means I always have someone in my corner. They plan my long-term goals and celebrate my wins. It's more than a service; it's a true partnership.</p>
                            </div>

                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12">
                                    <img loading="lazy" src="https://i.ibb.co.com/70sHrpv/featured-media-bg.webp" alt="avatar" class="w-full h-full object-cover rounded-full">
                                </div>

                                <span class="text-base font-medium text-[#F2F4F7] dark:text-[#e1dfdb]">@lylaaaboo</span>
                            </div>
                        </div>
                    </li>

                    <li class="splide__slide cursor-pointer">
                        <div class="w-full h-full flex flex-col justify-between gap-4 p-4 rounded-[0.625rem] overflow-hidden bg-[linear-gradient(180deg,rgba(24,34,48,0.52)_0%,rgba(24,34,48,0.8)_100%),url('https://i.ibb.co.com/wNtVT4r0/hero-bg-image-0-2.webp')] bg-cover bg-center bg-no-repeat xl:p-6">
                            <div class="flex flex-col gap-4">
                                <img loading="lazy" src="https://i.ibb.co.com/kgq8zCfd/quote-green.webp" alt="quote green" class="w-6">

                                <p class="text-sm line-clamp-[9] text-[#F2F4F7] md:text-base xl:line-clamp-[7] dark:text-[#e1dfdb]">The ‘full-service’ promise is real. I have a dedicated account manager, a content strategist, and a promo team. Our website handle the analytics so I can handle the art. My content is authentic because I’m not burnt out on the business side.</p>
                            </div>

                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12">
                                    <img loading="lazy" src="https://i.ibb.co.com/70sHrpv/featured-media-bg.webp" alt="avatar" class="w-full h-full object-cover rounded-full">
                                </div>

                                <span class="text-base font-medium text-[#F2F4F7] dark:text-[#e1dfdb]">@pictureuna</span>
                            </div>
                        </div>
                    </li>

                    <li class="splide__slide cursor-pointer">
                        <div class="w-full h-full flex flex-col justify-between gap-4 p-4 rounded-[0.625rem] overflow-hidden bg-[linear-gradient(180deg,rgba(24,34,48,0.52)_0%,rgba(24,34,48,0.8)_100%),url('https://i.ibb.co.com/j9b5wvYV/hero-bg-image-2-2.webp')] bg-cover bg-center bg-no-repeat xl:p-6">
                            <div class="flex flex-col gap-4">
                                <img loading="lazy" src="https://i.ibb.co.com/kgq8zCfd/quote-green.webp" alt="quote green" class="w-6">

                                <p class="text-sm line-clamp-[9] text-[#F2F4F7] md:text-base xl:line-clamp-[7] dark:text-[#e1dfdb]">Having a strategist, a manager, and a promo expert dedicated to my success makes all the difference. I'm not just using a platform; I'm part of an ecosystem that wants me to win. 🏆</p>
                            </div>

                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12">
                                    <img loading="lazy" src="https://i.ibb.co.com/70sHrpv/featured-media-bg.webp" alt="avatar" class="w-full h-full object-cover rounded-full">
                                </div>

                                <span class="text-base font-medium text-[#F2F4F7] dark:text-[#e1dfdb]">@pictureuna</span>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </div>

    <!-- join-section -->
    <div class="flex justify-center items-center bg-[url('https://i.ibb.co.com/5WQ43b48/sample-bg-image-compressed.webp')] bg-cover bg-center bg-no-repeat">
        <div class="flex flex-col justify-center items-center gap-6 w-full px-4 py-16 bg-[#1D2334]/75 md:gap-10 md:py-12 xl:px-12 xl:py-[8.4375rem] dark:bg-[#242b40]/75">
            <h2 class="text-2xl font-semibold drop-shadow-[0px_4px_9.6px_#00000040] text-white md:text-4xl md:leading-[2.75rem] md:-tracking-[0.045rem] md:max-w-[42.125rem] xl:text-5xl xl:leading-[3.75rem] md:-tracking-[0.06rem] dark:text-[#e8e6e3]">Ready to Earn? Join for Free.</h2>

            <!-- input-container -->
            <div class="flex flex-col justify-center items-center gap-5 w-full md:gap-10 md:max-w-[42.125rem]">
                <div class="flex flex-col gap-5 w-full md:flex-row md:gap-0">
                    <!-- username-input -->
                    <div class="h-12 overflow-visible md:grow">
                        <div class="relative flex justify-center items-center gap-2 px-3 h-[3.25rem] backdrop-blur-[6px] rounded-md overflow-hidden border border-[#d0d5dd]/50 bg-white/10 md:rounded-l-md md:rounded-r-none dark:border-[#3b4043]/50 dark:bg-[#181a1b]/10">
                            <input type="text" class="bg-transparent border-none outline-none grow peer text-lg text-[#F9FAFB] dark:text-[#e5e3df]">
                            <div class="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none peer-focus:hidden peer-not-placeholder-shown:hidden">
                                <span class="text-lg text-[#F9FAFB] dark:text-[#e5e3df]">ourwebsite.app/@</span>
                                <span class="text-lg opacity-70 text-[#07F468] dark:[#23f97b]">username</span>
                            </div>
                        </div>
                    </div>

                    <!-- join-button -->
                    <button class="flex justify-center items-center w-full px-4 py-2.5 bg-[#07F468] group/button hover:bg-[#1D2334] md:w-max md:h-[3.25rem] md:rounded-r-md dark:bg-[#0aff78] dark:hover:bg-[#242b40]">
                        <span class="text-lg font-semibold text-[#1D2334] group-hover/button:text-[#07F468] md:text-xl md:leading-normal dark:text-[#cfcac4] dark:group-hover/button:text-[#23f97b]">JOIN AS CREATOR</span>
                    </button>
                </div>

                <!-- sign-up-as-fan button -->
                <button class="flex justify-center items-center px-2 py-0.5 mx-auto w-max bg-transparent border-none outline-none opacity-95">
                    <p class="text-xl leading-normal underline text-[#D0D5DD] dark:text-[#cfcac4]">Sign up as Fan</p>
                </button>
            </div>
        </div>
    </div>

    <!-- faq-section -->
    <div class="flex flex-col px-4 py-10 backdrop-blur-[25px] bg-[#EAECF0] bg-[linear-gradient(180deg,rgba(255,255,255,0.75)_70%,rgba(255,255,255,0)_100%)] md:py-20 xl:px-12 dark:bg-[#222526]">
        <div class="flex flex-col gap-12">
            <h2 class="text-2xl font-semibold text-center text-[#344054] md:text-4xl md:leading-[2.75rem] md:-tracking-[0.045rem] dark:text-[#bdb8af]">Frequently Asked Questions</h2>

            <!-- accordion-container -->
            <div data-accordion-container class="flex flex-col">
                <!-- Accordion Item -->
                <div data-accordion-item class="flex flex-col py-6 border-t-[1.5px] border-[#344054]/20 group/accordion-item dark:border-[#323e52]/20">
                    <button data-accordions-header class="flex justify-between items-center gap-2 w-full outline-none border-none bg-transparent">
                        <span class="text-base font-semibold text-left text-[#344054] md:text-xl md:leading-normal dark:text-[#bdb8af]">Who can join our website?</span>

                        <div class="flex justify-center items-center w-6 h-6">
                            <img loading="lazy" src="https://i.ibb.co.com/hx7V3xst/chevron-down.webp" alt="chevron down" class="w-6 h-6 min-w-[1.5rem] group-[.open]/accordion-item:rotate-180"/>
                        </div>
                    </button>

                    <div data-accordion-content class="max-h-0 opacity-0 pr-8 overflow-hidden transition-all duration-100 group-[.open]/accordion-item:mt-4 group-[.open]/accordion-item:opacity-100">
                        <p class="text-base font-medium text-[#101828] dark:text-[#d6d3cd]">A dedicated representation to engage your fan community on your behalf.</p>
                    </div>
                </div>

                <!-- Accordion Item -->
                <div data-accordion-item class="flex flex-col py-6 border-t-[1.5px] border-[#344054]/20 group/accordion-item dark:border-[#323e52]/20">
                    <button data-accordions-header class="flex justify-between items-center gap-2 w-full outline-none border-none bg-transparent">
                        <span class="text-base font-semibold text-left text-[#344054] md:text-xl md:leading-normal dark:text-[#bdb8af]">How does our website protect my personal data and intellectual property?</span>

                        <div class="flex justify-center items-center w-6 h-6">
                            <img loading="lazy" src="https://i.ibb.co.com/hx7V3xst/chevron-down.webp" alt="chevron down" class="w-6 h-6 min-w-[1.5rem] group-[.open]/accordion-item:rotate-180"/>
                        </div>
                    </button>

                    <div data-accordion-content class="max-h-0 opacity-0 pr-8 overflow-hidden transition-all duration-100 group-[.open]/accordion-item:mt-4 group-[.open]/accordion-item:opacity-100">
                        <p class="text-base font-medium text-[#101828] dark:text-[#d6d3cd]">A dedicated representation to engage your fan community on your behalf.</p>
                    </div>
                </div>

                <!-- Accordion Item -->
                <div data-accordion-item class="flex flex-col py-6 border-t-[1.5px] border-[#344054]/20 group/accordion-item dark:border-[#323e52]/20">
                    <button data-accordions-header class="flex justify-between items-center gap-2 w-full outline-none border-none bg-transparent">
                        <span class="text-base font-semibold text-left text-[#344054] md:text-xl md:leading-normal dark:text-[#bdb8af]">Can I customize the FAQ layout?</span>

                        <div class="flex justify-center items-center w-6 h-6">
                            <img loading="lazy" src="https://i.ibb.co.com/hx7V3xst/chevron-down.webp" alt="chevron down" class="w-6 h-6 min-w-[1.5rem] group-[.open]/accordion-item:rotate-180"/>
                        </div>
                    </button>

                    <div data-accordion-content class="max-h-0 opacity-0 pr-8 overflow-hidden transition-all duration-100 group-[.open]/accordion-item:mt-4 group-[.open]/accordion-item:opacity-100">
                        <p class="text-base font-medium text-[#101828] dark:text-[#d6d3cd]">A dedicated representation to engage your fan community on your behalf.</p>
                    </div>
                </div>

                <!-- Accordion Item -->
                <div data-accordion-item class="flex flex-col py-6 border-t-[1.5px] border-[#344054]/20 group/accordion-item dark:border-[#323e52]/20">
                    <button data-accordions-header class="flex justify-between items-center gap-2 w-full outline-none border-none bg-transparent">
                        <span class="text-base font-semibold text-left text-[#344054] md:text-xl md:leading-normal dark:text-[#bdb8af]">Is there a mobile app available?</span>

                        <div class="flex justify-center items-center w-6 h-6">
                            <img loading="lazy" src="https://i.ibb.co.com/hx7V3xst/chevron-down.webp" alt="chevron down" class="w-6 h-6 min-w-[1.5rem] group-[.open]/accordion-item:rotate-180"/>
                        </div>
                    </button>

                    <div data-accordion-content class="max-h-0 opacity-0 pr-8 overflow-hidden transition-all duration-100 group-[.open]/accordion-item:mt-4 group-[.open]/accordion-item:opacity-100">
                        <p class="text-base font-medium text-[#101828] dark:text-[#d6d3cd]">A dedicated representation to engage your fan community on your behalf.</p>
                    </div>
                </div>

                <!-- Accordion Item -->
                <div data-accordion-item class="flex flex-col py-6 border-t-[1.5px] border-[#344054]/20 group/accordion-item dark:border-[#323e52]/20">
                    <button data-accordions-header class="flex justify-between items-center gap-2 w-full outline-none border-none bg-transparent">
                        <span class="text-base font-semibold text-left text-[#344054] md:text-xl md:leading-normal dark:text-[#bdb8af]">How can I contact support?</span>

                        <div class="flex justify-center items-center w-6 h-6">
                            <img loading="lazy" src="https://i.ibb.co.com/hx7V3xst/chevron-down.webp" alt="chevron down" class="w-6 h-6 min-w-[1.5rem] group-[.open]/accordion-item:rotate-180"/>
                        </div>
                    </button>

                    <div data-accordion-content class="max-h-0 opacity-0 pr-8 overflow-hidden transition-all duration-100 group-[.open]/accordion-item:mt-4 group-[.open]/accordion-item:opacity-100">
                        <p class="text-base font-medium text-[#101828] dark:text-[#d6d3cd]">A dedicated representation to engage your fan community on your behalf.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- overview-section -->
    <div class="flex flex-col justify-center items-center gap-6 px-4 py-10 bg-[#101828] lg:flex-row-reverse lg:py-0 xl:px-12">
        <!-- text-section -->
        <section class="flex flex-col gap-2 text-center lg:gap-6 lg:w-1/2 lg:text-left">
            <h2 class="text-lg font-medium text-white lg:text-2xl lg:font-semibold dark:text-[#e8e6e3]">Our website is the home of content creator-led entertainment platform. </h2>
            <p class="text-sm text-white lg:text-base lg:font-medium dark:text-[#e8e6e3]">Join for free to find your clans of like minded influencers and friends, enjoy high quality video and image gallery, join live streams and platform exclusive events. Make online connections more intimate than ever.</p>
        </section>

        <!-- image-container -->
        <div class="w-full aspect-[1.561/1] md:max-w-[36.25rem] md:mx-auto lg:w-1/2">
            <img loading="lazy" src="https://i.ibb.co.com/99t1wvzN/all-screen-preview.webp" alt="all screen preview" class="w-full h-full object-cover">
        </div>
    </div>

    <footer class="flex flex-col gap-4 px-4 py-6 bg-[#1D2334]/90 relative md:px-12 dark:bg-[#242b40]/90">
        <!-- blur-overlay -->
        <div class="absolute inset-0 w-full h-full backdrop-blur-[5px] pointer-events-none z-[-1]"></div>

        <div class="flex gap-2">
            <div class="flex flex-col gap-4 w-1/2">
                <a href="#" class="flex gap-2 cursor-pointer">
                    <img loading="lazy" src="https://i.ibb.co.com/cKHXsj94/mail.webp" alt="mail" class="w-6 h-6 min-w-[1.5rem]">
                    <p class="text-xs leading-normal break-all text-[#A9A29D] dark:text-[#aea79c]">support@ourwebsite.app</p>
                </a>

                <a href="#" class="flex items-center gap-2 cursor-pointer">
                    <img loading="lazy" src="https://i.ibb.co.com/JWGHSqrz/question-circle.webp" alt="question circle" class="w-6 h-6 min-w-[1.5rem]">
                    <p class="text-xs leading-normal break-all text-[#A9A29D] dark:text-[#aea79c]">Help</p>
                </a>

                <div class="flex items-center gap-4">
                    <a href="#" class="w-6 h-6">
                        <img loading="lazy" src="https://i.ibb.co.com/3ymM1vpy/discord.webp" alt="discord" class="h-full">
                    </a>

                    <a href="#" class="w-6 h-6">
                        <img loading="lazy" src="https://i.ibb.co.com/35nPv7by/x.webp" alt="x" class="h-full">
                    </a>

                    <a href="#" class="w-6 h-6">
                        <img loading="lazy" src="https://i.ibb.co.com/mCwZ7GPd/instagram.webp" alt="instagram" class="h-full">
                    </a>
                </div>
            </div>

            <div class="flex flex-col gap-2 w-1/2">
                <a href="#" class="text-xs leading-6 tracking-[0.00375rem] text-[#A9A29D] dark:text-[#aea79c]">DMCA</a>
                <a href="#" class="text-xs leading-normal tracking-[0.00375rem] text-[#A9A29D] dark:text-[#aea79c]">Anti Sexual Exploitation Policies (USC 2257, Anti-Slavery and Anti-Sex Trafficking, CSAM)</a>
                <a href="#" class="text-xs leading-normal tracking-[0.00375rem] text-[#A9A29D] dark:text-[#aea79c]">Terms & Conditions</a>
                <a href="#" class="text-xs leading-normal tracking-[0.00375rem] text-[#A9A29D] dark:text-[#aea79c]">Privacy Policies</a>
                <a href="#" class="text-xs leading-normal tracking-[0.00375rem] text-[#A9A29D] dark:text-[#aea79c]">Report</a>
            </div>
        </div>

        <div class="flex gap-2">
            <a href="#" class="w-[3.125rem] h-8">
                <img loading="lazy" src="https://i.ibb.co.com/Lzbh8Q2S/visa.webp" alt="visa" class="w-full h-full">
            </a>

            <a href="#" class="w-[3.125rem] h-8">
                <img loading="lazy" src="https://i.ibb.co.com/2358GtZM/Mastercard.webp" alt="Mastercard" class="w-full h-full">
            </a>
        </div>

        <span class="text-sm leading-6 tracking-[0.004375rem] text-[#A9A29D] dark:text-[#aea79c]">© 2024 Our Website</span>
    </footer>

    <!-- handle hero image slider with video sync -->
    <script>
        const splide = new Splide('[data-hero-image-slider]', {
            type: 'fade',
            autoplay: true,
            interval: 5000,
            speed: 1000,
            rewind: true,
            pauseOnHover: false,
            pagination: false,
            arrows: false,
        });

        function syncBackgroundVideo(index) {
            const videos = document.querySelectorAll('[data-hero-bg]');

            videos.forEach(video => {
                video.classList.remove('active');
                video.pause();
                video.currentTime = 0;
            });

            const activeVideo = document.querySelector(
                `[data-hero-bg="${index}"]`
            );

            if (activeVideo) {
                activeVideo.classList.add('active');
                activeVideo.play().catch(() => {});
            }
        }

        /* play video on initial load */
        splide.on('mounted', () => {
            syncBackgroundVideo(splide.index);
        });

        /* play video on every fade change */
        splide.on('moved', (newIndex) => {
            syncBackgroundVideo(newIndex);
        });

        splide.mount();
    </script>

    <!-- handle mobile hamburger menu -->
    <script>
        const nav = document.querySelector('[data-nav]');
        const menuBtn = document.querySelector('[data-mobile-menu-button]');

        menuBtn.addEventListener('click', () => {
            nav.classList.toggle('mobile-menu-open');
        });
    </script>

    <!-- add class to body on page scroll (used for nav styling on scroll) -->
    <script>
        window.addEventListener('scroll', () => {
            const body = document.body;

            if (window.scrollY > 0) {
                body.classList.add('scrolling');
            } else {
                body.classList.remove('scrolling');
            }
        });
    </script>

    <!-- handle featured creator card sliders -->
    <script>
        new Splide('[data-featured-creator-top-card-slider]', {
            type: 'loop',
            fixedWidth: '10.858rem',
            gap: '.5rem',
            arrows: false,
            pagination: false,
            drag: 'free',
            focus: 'center',
            direction: 'ltr',
            pauseOnHover: true,
            pauseOnFocus: false,
            mediaQuery: 'min',
            breakpoints: {
                768: {
                    fixedWidth: '13.75rem',
                },
                1280: {
                    fixedWidth: '16.71rem',
                }
            },
            autoScroll: {
                speed: 1,
            },
        }).mount(window.splide.Extensions);

        new Splide('[data-featured-creator-bottom-card-slider]', {
            type: 'loop',
            fixedWidth: '10.858rem',
            gap: '.5rem',
            arrows: false,
            pagination: false,
            drag: 'free',
            focus: 'center',
            direction: 'ltr',
            pauseOnHover: true,
            pauseOnFocus: false,
            mediaQuery: 'min',
            breakpoints: {
                768: {
                    fixedWidth: '13.75rem',
                },
                1280: {
                    fixedWidth: '16.71rem',
                }
            },
            autoScroll: {
                speed: -1,
            },
        }).mount(window.splide.Extensions);
    </script>

    <!-- handle featured creator section custom cursor -->
    <script>
        const zone = document.querySelector('[data-featured-creator-section]');
        const cursor = document.querySelector('[data-follow-creator-cursor]');

        let mouseX = 0;
        let mouseY = 0;
        let bounds = null;
        let isInside = false;

        function updateBounds() {
            bounds = zone.getBoundingClientRect();
        }

        zone.addEventListener('mouseenter', () => {
            isInside = true;
            updateBounds();
            cursor.classList.remove('hidden');
            cursor.style.opacity = '1';
            document.body.style.cursor = 'none';
        });

        zone.addEventListener('mouseleave', () => {
            isInside = false;
            cursor.style.opacity = '0';
            document.body.style.cursor = '';
        });

        zone.addEventListener('mousemove', (e) => {
            if (!bounds) return;
            mouseX = e.clientX - bounds.left;
            mouseY = e.clientY - bounds.top;
        });

        window.addEventListener('scroll', () => {
            if (isInside) updateBounds();
        }, { passive: true });

        window.addEventListener('resize', updateBounds);

        function animate() {
            if (!isInside) return requestAnimationFrame(animate);

            const x = mouseX - cursor.offsetWidth / 2;
            const y = mouseY - cursor.offsetHeight / 2;

            cursor.style.transform = `translate(${x}px, ${y}px)`;
            requestAnimationFrame(animate);
        }

        animate();
    </script>

    <!-- handle accordions -->
    <script>
        document.querySelectorAll("[data-accordion-container]").forEach((accordion) => {
        const items = accordion.querySelectorAll("[data-accordion-item]");

            // Initialize default open items
            items.forEach((item) => {
                const content = item.querySelector("[data-accordion-content]");

                if (item.classList.contains("open")) {
                    content.style.maxHeight = content.scrollHeight + "px";
                }
            });

            // on click open/close items
            items.forEach((item) => {
                const header = item.querySelector("[data-accordions-header]");
                const content = item.querySelector("[data-accordion-content]");

                header.addEventListener("click", () => {
                    const isOpen = item.classList.contains("open");

                    // Close all items in this accordion
                    items.forEach((i) => {
                        i.classList.remove("open");
                        const c = i.querySelector("[data-accordion-content]");
                        c.style.maxHeight = null;
                    });

                    // Open clicked item if it was closed
                    if (!isOpen) {
                        item.classList.add("open");
                        content.style.maxHeight = content.scrollHeight + "px";
                    }
                });
            });
        });

    </script>

    <!-- handle double row sliders -->
    <script>
        document.querySelectorAll('[data-double-row-slider]').forEach(wrapper => {
            const row1 = wrapper.querySelector('[data-row="1"]');
            const row2 = wrapper.querySelector('[data-row="2"]');

            const options = {
                type: 'loop',
                gap: '1rem',
                arrows: false,
                pagination: false,
                focus: 'center',
                perMove: 1,
                fixedWidth: '20rem',
                mediaQuery: 'min',
                breakpoints: {
                    768: { fixedWidth: '22.5rem' },
                    1280: { fixedWidth: '24.444rem' },
                },
            };

            const splide1 = new Splide(row1, options);
            const splide2 = new Splide(row2, options);

            // 🔥 Sync both sliders
            splide1.sync(splide2);
            splide1.mount();
            splide2.mount();

            // Shared arrows
            wrapper.querySelector('[data-prev]').addEventListener('click', () => {
                splide1.go('<');
            });

            wrapper.querySelector('[data-next]').addEventListener('click', () => {
                splide1.go('>');
            });
        });
    </script>

    <!-- handle-tab-switching -->
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const tabButtons = document.querySelectorAll('[data-tab-btn]');
            const tabPanels  = document.querySelectorAll('[data-tab-panel]');

            tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const target = button.dataset.tabBtn;

                    // update active button
                    tabButtons.forEach(btn => btn.classList.remove('tab-active'));
                    button.classList.add('tab-active');

                    // toggle panels
                    tabPanels.forEach(panel => {
                        panel.classList.add('hidden');
                        if (panel.dataset.tabPanel === target) {
                            panel.classList.remove('hidden');
                        }
                    });
                });
            });
        });
    </script>

    <!-- handle-review-section-slider -->
    <script>
        new Splide('[data-review-section-slider]', {
            type: 'loop',
            fixedWidth: '15rem',
            fixedHeight: '19.919rem',
            gap: '1rem',
            arrows: false,
            pagination: false,
            drag: 'free',
            focus: 'center',
            direction: 'ltr',
            pauseOnHover: true,
            pauseOnFocus: false,
            mediaQuery: 'min',
            breakpoints: {
                768: {
                    fixedWidth: '17.5rem',
                    fixedHeight: '22.169rem',
                },
                1280: {
                    fixedWidth: '21.875rem',
                    fixedHeight: '19.919rem',
                }
            },
            autoScroll: {
                speed: 1,
            },
        }).mount(window.splide.Extensions);
    </script>
</body>
</html>
</template>