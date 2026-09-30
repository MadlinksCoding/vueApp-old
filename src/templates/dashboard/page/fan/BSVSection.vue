<template>
    <div class="flex flex-col gap-6 xl:gap-12 bg-[#3D1010] w-full relative">
        <div
            class="relative w-full h-[480px] xl:h-[720px] pt-28 pb-5 xl:pb-12 inline-flex flex-col justify-end items-center gap-2 overflow-hidden">
            <img :src="BSVbgMobile" alt="" class="pointer-events-none absolute inset-0 w-full object-cover md:hidden" />
            <img :src="BSVbgTab" alt="" class="pointer-events-none absolute inset-0 hidden w-full object-cover md:block xl:hidden" />
            <img :src="BSVbgDesk" alt="" class="pointer-events-none absolute inset-0 hidden h-full w-full object-cover xl:block" />
            <div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#3D1010]/0 from-[52.41%] to-[#3D1010] to-[85.1%]"></div>
            <div
                class="relative z-[1] justify-start text-white text-sm xl:text-base font-medium font-['Poppins'] [text-shadow:_0px_4px_4px_rgb(0_0_0_/_0.25)]">
                致力於成人的娛樂</div>
            <div
                class="relative z-[1] justify-start text-white text-base xl:text-2xl font-semibold font-['Poppins'] [text-shadow:_0px_4px_4px_rgb(0_0_0_/_0.25)]">
                港式情慾美學 原創色情微電影</div>
            <div class="relative z-[1] size- flex flex-col justify-start items-center gap-2">
                <img class="size-10 lg:size-16 relative rounded-[500px]" :src="BSVlogo" />
                <div class="justify-start text-white text-3xl xl:text-6xl font-semibold font-['Poppins']">BSV
                    PRODUCTION</div>
                <div class="justify-start text-white text-sm xl:text-base font-normal font-['Poppins']">@bsv</div>
            </div>
            <div class="relative z-[1] size- inline-flex justify-start items-center gap-4 cursor-pointer">
                <div
                    class="h-12 px-6 py-2 bg-white/20 rounded-[50px] outline outline-[0.50px] outline-offset-[-0.50px] outline-white/75 flex justify-center items-center gap-1">
                    <div class="justify-start text-white text-base font-medium font-['Poppins'] leading-6">VIEW
                        PROFILE</div>
                    <div class="size-4.5 relative overflow-hidden">
                        <img class="h-5 w-5" :src="ArrowRightUp" />
                    </div>
                </div>
            </div>
        </div>


        <!-- BSV Creator Section -->
        <div class="self-stretch px-3 md:px-5 xl:px-10 py-6 xl:py-10 inline-flex flex-col justify-center items-start gap-5">
            <div class="self-stretch px-10 inline-flex justify-center items-center gap-2">
                <div class="size-5 relative overflow-hidden">
                    <img :src="StarIcon"/>
                </div>
                <div class="justify-center text-gray-200 text-xl xl:text-2xl font-medium font-['Poppins'] leading-8">BSV CREATORS
                </div>
            </div>
            <Splide class="self-stretch w-full" :options="creatorSliderOptions" aria-label="BSV Creators">
                <SplideSlide>
                    <div
                        class="h-[441px] w-full rounded-[20px] inline-flex flex-col justify-start items-center overflow-hidden">
                        <div
                            class="self-stretch flex-1 relative bg-gradient-to-b from-black/20 to-black/5 flex flex-col justify-start items-start overflow-hidden">
                            <Splide
                                class="creator-media absolute inset-0"
                                :options="mediaSliderOptions"
                                aria-label="Creator media">
                                <SplideSlide v-for="(slide, index) in mediaSlides" :key="index">
                                    <div
                                        class="relative h-full w-full bg-cover bg-center"
                                        :style="{ backgroundColor: slide.color, backgroundImage: `url('${slide.src}')` }">
                                        <div
                                            class="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-black/0 to-black/90">
                                        </div>
                                    </div>
                                </SplideSlide>
                            </Splide>
                            <div
                                class="pointer-events-none absolute inset-0 z-[1] flex h-full w-full flex-col justify-start items-start">
                            <div
                                class="w-72 px-2 left-0 top-[138.50px] absolute opacity-0 inline-flex justify-between items-center">
                                <div class="size-7 relative shadow-[0px_4px_8px_0px_rgba(0,0,0,0.25)] overflow-hidden">
                                    <div
                                        class="w-1.5 h-3.5 left-[10.50px] top-[7px] absolute outline outline-2 outline-offset-[-1px] outline-white">
                                    </div>
                                </div>
                                <div class="size-7 relative shadow-[0px_4px_8px_0px_rgba(0,0,0,0.25)] overflow-hidden">
                                    <div
                                        class="w-1.5 h-3.5 left-[10.50px] top-[7px] absolute outline outline-2 outline-offset-[-1px] outline-white">
                                    </div>
                                </div>
                            </div>
                            <div class="self-stretch h-full min-h-64 flex flex-1 flex-col justify-between items-center pb-5">
                                <div
                                    class="self-stretch p-2.5 inline-flex justify-end items-start gap-2.5 overflow-hidden">
                                    <div
                                        class="size-6 rounded-3xl flex justify-center items-center gap-1">
                                        <div class="size-6 relative overflow-hidden">
                                            <img :src="LikeIcon"/>
                                        </div>
                                    </div>
                                </div>
                                <div class="self-stretch px-2 py-1 inline-flex justify-center items-end gap-1">
                                    <div class="w-24 h-20 relative">
                                        <img class="size-20 left-[8.62px] top-0 absolute br--shape--1"
                                            src="https://placehold.co/79x80" />
                                    </div>
                                    <div
                                        class="flex-1 inline-flex flex-col justify-center items-start gap-4">
                                        <div class="self-stretch flex flex-col justify-start items-start gap-1">
                                            <div class="self-stretch inline-flex justify-start items-center gap-1">
                                                <div
                                                    class="justify-start text-white text-xl font-semibold font-['Poppins'] leading-8 line-clamp-1">
                                                    w_dindin</div>
                                                <div data-size="sm" class="size-3 relative overflow-hidden">
                                                    <img :src="VerifiedIcon"/>
                                                </div>
                                            </div>
                                            <div
                                                class="justify-start text-gray-200 text-xs font-normal font-['Poppins'] leading-4">
                                                @dindinxd19</div>
                                            <div
                                                class="size- shadow-[0px_0px_5px_0px_rgba(0,0,0,0.70)] flex flex-col justify-start items-start">
                                                <div class="size- inline-flex justify-start items-start gap-0.5">
                                                    <div
                                                        class="justify-start text-gray-200 text-xs font-normal font-['Poppins'] leading-4 tracking-wide">
                                                        Asian</div>
                                                    <div class="size- flex justify-center items-center gap-2.5">
                                                        <div
                                                            class="justify-start text-gray-200 text-xs font-light font-['Poppins'] leading-4 tracking-wide">
                                                            /</div>
                                                    </div>
                                                    <div
                                                        class="justify-start text-gray-200 text-xs font-normal font-['Poppins'] leading-4 tracking-wide">
                                                        Blonde</div>
                                                    <div class="size- flex justify-center items-center gap-2.5">
                                                        <div
                                                            class="justify-start text-gray-200 text-xs font-light font-['Poppins'] leading-4 tracking-wide">
                                                            /</div>
                                                    </div>
                                                    <div
                                                        class="justify-start text-gray-200 text-xs font-normal font-['Poppins'] leading-4 tracking-wide">
                                                        18</div>
                                                    <div class="size- flex justify-center items-center gap-2.5">
                                                        <div
                                                            class="justify-start text-gray-200 text-xs font-light font-['Poppins'] leading-4 tracking-wide">
                                                            /</div>
                                                    </div>
                                                    <div
                                                        class="justify-start text-gray-200 text-xs font-normal font-['Poppins'] leading-4 tracking-wide line-clamp-1">
                                                        Japan</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            </div>
                        </div>
                        <div class="self-stretch p-2 bg-black flex flex-col justify-start items-start gap-2">
                                <div
                                    class="self-stretch h-10 justify-start text-gray-200 text-sm font-normal font-['Poppins'] leading-5 line-clamp-2">
                                    🎏 Inked Asian Cutie  <br /> ⏳ Proudly curvy & thick (Thick thighs save lives!)</div>
                                <div
                                class="self-stretch px-2 py-1 shadow-[0px_0px_8px_0px_rgba(0,0,0,0.50)] inline-flex justify-between items-start">
                                <div class="size- flex justify-start items-center gap-1">
                                    <div class="size-3.5 relative overflow-hidden">
                                        <img :src="User2Icon" />
                                    </div>
                                    <div
                                        class="justify-center text-gray-50 text-xs font-light font-['Poppins'] leading-5">
                                        15.2K</div>
                                </div>
                                <div class="size- flex justify-start items-center gap-1">
                                    <div class="size-3.5 relative overflow-hidden">
                                        <img :src="LikeIcon" />
                                    </div>
                                    <div
                                        class="justify-center text-gray-50 text-xs font-light font-['Poppins'] leading-5">
                                        99K</div>
                                </div>
                                <div class="size- flex justify-start items-center gap-1">
                                    <div class="size-3.5 relative">
                                        <img :src="WhitelogoIcon" />
                                    </div>
                                    <div
                                        class="justify-center text-gray-50 text-xs font-light font-['Poppins'] leading-5">
                                        5k</div>
                                </div>
                                <div class="size- flex justify-start items-center gap-1">
                                    <div class="size-3.5 relative overflow-hidden">
                                        <img :src="EyeIcon" />
                                    </div>
                                    <div
                                        class="justify-center text-gray-50 text-xs font-light font-['Poppins'] leading-5">
                                        15.2k</div>
                                </div>
                            </div>
                            <div class="self-stretch inline-flex justify-start items-start gap-1.5">
                                <div data-property-1="FOLLOW" data-state="Default"
                                    class="flex-1 p-2 bg-white/20 rounded-3xl outline outline-[0.50px] outline-offset-[-0.50px] outline-white/75 flex justify-center items-center gap-1">
                                    <div class="size-4 relative opacity-0 overflow-hidden">
                                        <div
                                            class="w-3.5 h-3 left-[1.50px] top-[3px] absolute outline outline-[1.50px] outline-offset-[-0.75px] outline-white">
                                        </div>
                                    </div>
                                    <div
                                        class="justify-start text-white text-sm font-medium font-['Poppins'] leading-5">
                                        PROFILE</div>
                                    <div class="size-5 relative overflow-hidden">
                                        <img :src="ArrowRightUp" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </SplideSlide>

            </Splide>
        </div>
        <!-- /BSV Creator Section -->



        <!-- BSV Production -->
        <div class="self-stretch  py-6 xl:py-10 bg-gradient-to-b from-gray-500/0 from 60% to-gray-500/5 inline-flex flex-col justify-center items-start gap-6 xl:gap-12">
  <div class="self-stretch px-10 inline-flex justify-center items-center gap-2">
    <div class="size-5 relative overflow-hidden">
        <img :src="LineChartIcon"/>
    </div>
    <div class="justify-center text-gray-200 text-xl xl:text-2xl font-medium font-['Poppins'] leading-8">BSV PRODUCTION’S MEDIA</div>
  </div>
  <div class="self-stretch md:px-5 xl:px-10 flex flex-col justify-start items-start gap-3">
    <div class="self-stretch flex flex-col justify-start items-start gap-4 md:gap-6">
      <div class="self-stretch inline-flex justify-start items-center gap-6 flex-col lg:flex-row">
        <div class="w-full aspect-video relative rounded-lg shadow-[0px_0px_6px_0px_rgba(0,0,0,0.35)] overflow-hidden">
          <div class="w-72 h-40 left-0 top-0 absolute rounded-tl-lg rounded-tr-lg overflow-hidden">
            <div class="w-72 h-40 left-0 top-0 absolute bg-black/5"></div>
          </div>
          <div class="w-full h-full left-0 top-0 absolute shadow-[0px_0px_6px_0px_rgba(255,255,255,1.00)] backdrop-blur-sm" style="background-image: url('https://images.ctfassets.net/hrltx12pl8hq/5596z2BCR9KmT1KeRBrOQa/4070fd4e2f1a13f71c2c46afeb18e41c/shutterstock_451077043-hero1.jpg?fit=fill'); background-size: cover; background-position: center; background-repeat: no-repeat;"> </div>
          <div class="w-full p-2.5 md:p-4 left-0 top-0 absolute inline-flex justify-between items-start">
            <div class="size- px-[4.80px] py-[1.20px] bg-[rgba(24,34,48,0.5)] rounded-[4.80px] flex justify-center items-center gap-1">
              <div class="size-5 relative">
                <img :src="PlayIcon"/>
              </div>
              <div class="justify-start text-white text-sm font-medium font-['Poppins'] tracking-tight">1:25</div>
            </div>
            <div class="size-6 flex justify-center items-center gap-2.5">
              <div class="size-6 relative overflow-hidden">
                <img :src="LikeIcon"/>
              </div>
            </div>
          </div>
          <div class="size- pl-2 flex md:hidden justify-start items-start gap-2.5 absolute bottom-0 left-[2px]"> 
              <div class="size- pr-2 py-0.5 pl-4 bg-gradient-to-r from-rose-600 to-pink-500 rounded-[0.25rem] backdrop-blur-[10px] flex justify-center items-center gap-1 relative">
                <div class="flex justify-end items-center absolute left-[-10px] top-[-8px]">
                  <img :src="FireIcon" class=""/>
                </div>
                <div class="justify-center text-white text-sm font-semibold font-['Poppins'] leading-5">HOTTT</div>
              </div>
            </div>
        </div>
        <div class="flex-1 self-stretch inline-flex px-2 md:px-0 xl:px-0 flex-col justify-between items-start lg:min-w-[300px] xl:min-w-[496px]">
          <div class="self-stretch flex flex-col justify-end items-start gap-8">
            <div class="self-stretch flex flex-col justify-start items-start gap-4">
              <div class="self-stretch flex flex-col justify-start items-start gap-2.5">
                <div class="size- pl-2 hidden md:flex justify-start items-start gap-2.5"> 
                  <div class="size- pr-2 py-0.5 pl-4 bg-gradient-to-r from-rose-600 to-pink-500 rounded-[0.25rem] backdrop-blur-[10px] flex justify-center items-center gap-1 relative">
                    <div class="flex justify-end items-center absolute left-[-10px] top-[-8px]">
                      <img :src="FireIcon" class=""/>
                    </div>
                    <div class="justify-center text-white text-sm font-semibold font-['Poppins'] leading-5">HOTTT</div>
                  </div>
                </div>
                <div class="self-stretch flex flex-col justify-start items-start gap-1 md:gap-4">
                  <div class="self-stretch justify-start text-white text-lg md:text-2xl xl:text-5xl font-semibold font-['Poppins']">DESIRE - 《私人飯局》 預告			</div>
                  <div class="self-stretch flex flex-col justify-start items-start gap-4">
                    <div class="self-stretch justify-start text-gray-200 text-base font-normal font-['Poppins']">一場真正的私人飯局究竟是怎樣？ 飯局最真實的人性掙扎，是享受還是妥協，可以選擇嗎？ 三個飯局妹CLARE (CLARE飾）、BELLA (KIWI飾）和 AMBER ( LALA飾）各有不同的遭遇。					</div>
                    <div class="self-stretch inline-flex justify-start items-start gap-2 flex-wrap content-start overflow-hidden">
                      <div data-property-1="selected" data-size="Default" class="h-6 min-w-12 px-2 py-1 bg-slate-700/10 rounded-sm flex justify-center items-center gap-1">
                        <div class="justify-start text-gray-200 text-sm font-medium font-['Poppins'] leading-5">女王</div>
                      </div>
                      <div data-property-1="selected" data-size="Default" class="h-6 min-w-12 px-2 py-1 bg-slate-700/10 rounded-sm flex justify-center items-center gap-1">
                        <div class="justify-start text-gray-200 text-sm font-medium font-['Poppins'] leading-5">戀足</div>
                      </div>
                      <div data-property-1="not selected" data-size="Default" class="h-6 min-w-12 px-2 py-1 bg-slate-700/10 rounded-sm flex justify-center items-center gap-1">
                        <div class="justify-start text-gray-200 text-sm font-medium font-['Poppins'] leading-5">廣東話</div>
                      </div>
                      <div data-property-1="not selected" data-size="Default" class="h-6 min-w-12 px-2 py-1 bg-slate-700/10 rounded-sm flex justify-center items-center gap-1">
                        <div class="justify-start text-gray-200 text-sm font-medium font-['Poppins'] leading-5">語言羞辱</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="self-stretch hidden xl:flex flex-col justify-start items-start gap-1 ">
              <div class="size- inline-flex justify-center items-center gap-2">
                <div class="w-12 h-11 relative">
                  <img class="size-11 left-[2.73px] top-0 absolute br--shape--1" src="https://placehold.co/43x43" />
                </div>
                <div class="size- inline-flex flex-col justify-center items-start gap-1">
                  <div class="self-stretch inline-flex justify-start items-center gap-1">
                    <div class="justify-start text-white text-sm font-semibold font-['Poppins'] leading-5 line-clamp-1">BSV Production</div>
                    <div data-size="xs" class="size-2.5 relative overflow-hidden">
                     <img :src="VerifiedIcon"/>
                    </div>
                  </div>
                  <div class="size- inline-flex justify-start items-center gap-3">
                    <div class="size- flex justify-start items-center gap-1">
                      <div class="size-3.5 relative overflow-hidden">
                        <img :src="User2Icon"/>
                      </div>
                      <div class="justify-center text-gray-200 text-sm font-light font-['Poppins'] leading-5">15.2K</div>
                    </div>
                    <div class="size- flex justify-start items-center gap-1">
                      <div class="size-3.5 relative overflow-hidden">
                        <img :src="LikeIcon"/>
                      </div>
                      <div class="justify-center text-gray-200 text-sm font-light font-['Poppins'] leading-5">99K</div>
                    </div>
                    <div class="size- flex justify-start items-center gap-1">
                      <div class="size-3.5 relative">
                        <img :src="WhitelogoIcon"/>
                      </div>
                      <div class="justify-center text-gray-200 text-sm font-light font-['Poppins'] leading-5">5k</div>
                    </div>
                    <div class="size- flex justify-start items-center gap-1">
                      <div class="size-3.5 relative overflow-hidden">
                        <img :src="EyeIcon"/>
                      </div>
                      <div class="justify-center text-gray-200 text-sm font-light font-['Poppins'] leading-5">15.2k</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="self-stretch hidden xl:flex justify-end items-center gap-4">
            <button
              type="button"
              class="p-2 rounded-full outline outline-1 outline-offset-[-1px] backdrop-blur-[10px] flex justify-center items-center disabled:cursor-default disabled:opacity-100"
              :class="productionIndex > 0 ? 'outline-white text-white' : 'outline-white/30 text-white/70'"
              :disabled="productionIndex === 0"
              aria-label="Previous media"
              @click="productionSplide?.go('<')">
              <svg class="size-8" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path d="M19 8L11 16L19 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              class="p-2 rounded-full outline outline-1 outline-offset-[-1px] outline-white backdrop-blur-[10px] flex justify-center items-center text-white"
              aria-label="Next media"
              @click="productionSplide?.go('>')">
              <svg class="size-8" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path d="M13 8L21 16L13 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <Splide ref="productionSplide" class="production-media self-stretch px-2 md:px-0 w-full" :options="productionSliderOptions" aria-label="BSV production media" @splide:click="onProductionThumbClick" @splide:moved="onProductionMoved">
        <SplideSlide v-for="(thumb, index) in productionThumbs" :key="index">
          <div class="inline-flex w-full flex-col items-start gap-3">
            <img class="production-thumb aspect-video w-full rounded-lg object-cover" :src="thumb" alt="" />
            <div class="production-thumb-border self-stretch h-0 outline outline-1 outline-offset-[-0.50px]"></div>
          </div>
        </SplideSlide>
      </Splide>
    </div>
  </div>
</div>
        <!-- /BSV Production -->
    </div>
</template>
<script setup>
import { ref } from "vue";
import { Splide, SplideSlide } from "@splidejs/vue-splide";
import "@splidejs/vue-splide/css";
import BSVlogo from "@/assets/images/icons/bsv-logo.svg";
import LikeIcon from "@/assets/images/icons/like-icon.svg";
import User2Icon from "@/assets/images/icons/user-02.svg";
import WhitelogoIcon from "@/assets/images/icons/white-logo.svg";
import EyeIcon from "@/assets/images/icons/eye-icon.svg";
import ArrowRightUp from "@/assets/images/icons/arrow-up-right-white.svg";
import FireIcon from "@/assets/images/icons/fire-icon.svg";
import StarIcon from "@/assets/images/icons/star-06.svg";
import LineChartIcon from "@/assets/images/icons/line-chart-up.svg";
import VerifiedIcon from "@/assets/images/icons/verified-tick-blue.svg";
import PlayIcon from "@/assets/images/icons/play-square.svg";
import BSVbgDesk from "@/assets/images/bg/bsv-bg-desk.png";
import BSVbgTab from "@/assets/images/bg/bsv-bg-tab.png";
import BSVbgMobile from "@/assets/images/bg/bsv-bg-mobile.png";
const creatorSliderOptions = {
    type: "slide",
    perMove: 1,
    gap: "1rem",
    arrows: false,
    pagination: false,
    drag: true,
    snap: true,
    fixedWidth: "330px",
    trimSpace: true,
    noDrag: ".creator-media",
    mediaQuery: "min",
    breakpoints: {
        1366: {
            fixedWidth: "304px",
        },
    },
};

const mediaSlides = [
    { color: "#6b2424", src: "https://placehold.co/640x800/6b2424/ffffff?text=1" },
    { color: "#1e3a5f", src: "https://placehold.co/640x800/1e3a5f/ffffff?text=2" },
    { color: "#3d2a12", src: "https://placehold.co/640x800/3d2a12/ffffff?text=3" },
    { color: "#243d28", src: "https://placehold.co/640x800/243d28/ffffff?text=4" },
    { color: "#3a2444", src: "https://placehold.co/640x800/3a2444/ffffff?text=5" },
    { color: "#4a3030", src: "https://placehold.co/640x800/4a3030/ffffff?text=6" },
];

const mediaSliderOptions = {
    type: "slide",
    perPage: 1,
    perMove: 1,
    arrows: true,
    pagination: true,
    drag: false,
    snap: true,
    speed: 400,
};

const productionThumbs = [
    "https://placehold.co/205x115/6b2424/ffffff?text=1",
    "https://placehold.co/205x115/1e3a5f/ffffff?text=2",
    "https://placehold.co/205x115/3d2a12/ffffff?text=3",
    "https://placehold.co/205x115/243d28/ffffff?text=4",
    "https://placehold.co/205x115/3a2444/ffffff?text=5",
    "https://placehold.co/205x115/4a3030/ffffff?text=6",
    "https://placehold.co/205x115/2a2a2a/ffffff?text=7",
    "https://placehold.co/205x115/1a3330/ffffff?text=8",
];

const productionSliderOptions = {
    type: "loop",
    perPage: 6,
    perMove: 1,
    gap: "0.5rem",
    arrows: false,
    pagination: false,
    drag: true,
    snap: true,
    trimSpace: false,
    speed: 400,
    breakpoints: {
        677: {
            perPage: 3,
        },
    },
};

const productionSplide = ref(null);
const productionIndex = ref(0);

function onProductionMoved(_splide, newIndex) {
    productionIndex.value = newIndex;
}

function onProductionThumbClick(splide, slide) {
    splide.go(slide.index);
}
</script>

<style scoped>
.creator-media {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
}

.creator-media :deep(.splide__track),
.creator-media :deep(.splide__list),
.creator-media :deep(.splide__slide) {
    height: 100%;
}

.creator-media :deep(.splide__pagination) {
    bottom: 0.5rem;
    left: 0.5rem;
    right: 0.5rem;
    z-index: 2;
    display: flex;
    flex-wrap: nowrap;
    justify-content: stretch;
    gap: 0.25rem;
    margin: 0;
    padding: 0;
}

.creator-media :deep(.splide__pagination li) {
    position: relative;
    flex: 1 1 0;
    height: 3px;
    margin: 0;
    line-height: 0;
}

.creator-media :deep(.splide__pagination__page) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    border: 0;
    border-radius: 0;
    background: rgb(255 255 255 / 0.2);
    opacity: 1;
    transform: none;
    box-shadow: none;
}

.creator-media :deep(.splide__pagination__page.is-active) {
    background: rgb(255 255 255 / 0.5);
    opacity: 1;
    transform: none;
}
.creator-media :deep(.splide__arrow){
  background: transparent !important;
}
.creator-media :deep(.splide__arrow svg){
  fill: white;
}
.creator-media :deep(.splide__arrow--prev){
  left:0.5rem;
}
.creator-media :deep(.splide__arrow--next){
  right:0.5rem;
}
.br--shape--1 {
    border-radius: 25% 75% 50% 51% / 45% 65% 36% 55%;
}

.production-media :deep(.splide__slide) {
    cursor: pointer;
}

.production-media :deep(.splide__slide) .production-thumb {
    opacity: 0.4;
}

.production-media :deep(.splide__slide.is-active) .production-thumb {
    opacity: 1;
}

.production-media :deep(.splide__slide.is-active) .production-thumb-border {
    outline-width: 3px;
    outline-offset: -1.5px;
    outline-color: #fff;
}
</style>