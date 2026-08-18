<template>
  <PopupHandler
    :modelValue="modelValue"
    @update:modelValue="(val) => emit('update:modelValue', val)"
    :config="eventDetailsFanConfig"
  >
   <div class="w-full h-full overflow-auto bg-white inline-flex flex-col justify-start items-start">
    <div class="self-stretch relative bg-black/25 backdrop-blur-[5px] flex flex-col justify-start items-start">
      <div class="self-stretch px-4 pt-12 pb-2 min-h-[18.75rem] relative bg-gradient-to-b from-amber-400/5 to-amber-400/30 flex flex-col justify-end items-start gap-4">
        <div class="h-6 p-1.5 bg-stone-900/50 rounded-[50px] inline-flex justify-start items-center gap-1">
          <div data-property-1="decline" data-size="Default" class="size-4 p-px flex justify-start items-center gap-2.5">
            <div class="size-3.5 bg-orange-600 rounded-[50px] flex justify-center items-center gap-2.5">
              <div data-svg-wrapper class="relative">
                <img :src="CloseIcon" class="cursor-pointer h-3 w-3"/>
              </div>
            </div>
          </div>
          <div class="justify-start text-white text-xs font-normal font-['Poppins'] leading-4 line-clamp-1">CANCELED</div>
        </div>
        <img src="https://static.vecteezy.com/system/resources/thumbnails/002/098/203/small/silver-tabby-cat-sitting-on-green-background-free-photo.jpg" class="absolute left-0 top-0 h-full w-full object-cover -z-[1]"/>
        <div class="self-stretch flex flex-col justify-start items-start gap-4">
          <div class="self-stretch justify-start text-white text-2xl md:text-3xl font-semibold leading-8 md:leading-9 line-clamp-2">Lantau cows meet up</div>
          <div class="self-stretch flex flex-col justify-center items-start">
            <div class="justify-center text-white text-base md:text-xl font-semibold leading-6 md:leading-8">Wednesday, April 25, 2027</div>
            <div class="size- inline-flex justify-start items-start gap-2">
              <div class="justify-center text-white text-base md:text-xl font-semibold leading-6 md:leading-8">2:15pm - 2:45pm</div>
            </div>
          </div>
          <div class="self-stretch flex flex-col justify-center items-start gap-2">
            <div class="self-stretch inline-flex justify-start items-start gap-1 flex-wrap content-start">
              <div class="h-6 flex justify-center items-center gap-1.5">
                <div data-svg-wrapper class="relative">
                  <img src="https://static.vecteezy.com/system/resources/thumbnails/002/098/203/small/silver-tabby-cat-sitting-on-green-background-free-photo.jpg" class="h-[1.375rem] w-[1.375rem] [border-radius:25%_75%_50%_51%_/_45%_65%_36%_55%]"/>
                </div>
                <div class="size- inline-flex flex-col justify-center items-start">
                  <div class="self-stretch inline-flex justify-start items-center gap-1">
                    <div class="justify-start text-white text-base font-medium  leading-6 line-clamp-1">Miu Miu</div>
                    <div data-svg-wrapper data-size="xs" class="relative">
                      <img :src="VerifiedBlueTickIcon"/>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div data-svg-wrapper class="hidden md:block right-4 top-[16px] absolute cursor-pointer">
          <img :src="DotsWhiteIcon" class="cursor-pointer"/>
        </div>
        <div data-svg-wrapper class="md:hidden right-4 top-[16px] absolute cursor-pointer">
          <img :src="CloseIcon" class="cursor-pointer h-6 w-6"/>
        </div>

      </div>
      <div class="size- px-1.5 py-1 left-0 top-0 absolute bg-amber-400 rounded-br-sm inline-flex justify-center items-center gap-2.5">
        <div class="justify-start text-white text-sm font-bold  leading-5">1 on 1  Video call</div>
      </div>
    </div>
    <div class="self-stretch shadow-[0px_0px_8px_0px_rgba(0,0,0,0.25)] border-b-[0.50px] border-gray-200 inline-flex justify-start items-start">
      <div class="w-1 self-stretch bg-orange-600"></div>
      <div class="flex-1 px-2 py-3 [background:linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.9)_100%),linear-gradient(0deg,rgba(255,68,5,0.1)_0%,rgba(255,68,5,0.1)_100%),rgba(255,255,255,0.9)] inline-flex flex-col justify-start items-start gap-4">
        <div class="self-stretch inline-flex justify-end items-start gap-4">
          <div data-svg-wrapper data-icon-type="user" data-indicator="false" data-state="Default" class="relative">
            <img src="https://static.vecteezy.com/system/resources/thumbnails/002/098/203/small/silver-tabby-cat-sitting-on-green-background-free-photo.jpg" class="h-10 w-10 rounded-full" />
          </div>
          <div class="flex-1 self-stretch inline-flex flex-col justify-start items-start">
            <div class="self-stretch pb-2 flex flex-col justify-start items-start gap-2">
              <div class="self-stretch inline-flex justify-between items-start">
                <div class="flex-1 pr-1 pt-1 flex justify-center items-center gap-2.5">
                  <div class="flex-1 justify-start"><span class="text-red-800 text-sm font-semibold  leading-5">Cows of Lantau </span><span class="text-red-800 text-sm font-normal  leading-5">has adjusted the cost of the session:</span></div>
                </div>
              </div>
            </div>
            <div class="self-stretch flex flex-col justify-start items-start gap-2">
              <div class="self-stretch flex flex-col justify-start items-start gap-2.5">
                <div class="self-stretch flex flex-col justify-start items-start gap-0.5">
                  <div class="self-stretch justify-start text-black text-xs font-normal  leading-4 [text-shadow:_0px_0px_10px_rgb(0_0_0_/_0.10)]">REMARKS</div>
                  <div class="self-stretch justify-start text-black text-sm font-normal  leading-5 [text-shadow:_0px_0px_10px_rgb(0_0_0_/_0.10)]">“Session price need to be adjusted due to a sudden surge in demand from intergalactic travelers visiting our planet.”</div>
                </div>
                <div class="self-stretch inline-flex justify-start items-center gap-2">
                  <div class="size- px-2 inline-flex flex-col justify-center items-start gap-1">
                    <div class="text-center justify-start text-red-800 text-xs font-medium  leading-4">ORIGINAL PRICE</div>
                    <div class="size- inline-flex justify-start items-center gap-1 grayscale">
                      <div data-svg-wrapper class="relative">
                        <img :src="TokenIcon"/>
                      </div>
                      <div class="text-center justify-start text-gray-500 text-sm font-medium  line-through leading-5">1,000</div>
                    </div>
                  </div>
                  <div data-svg-wrapper class="relative">
                    <img :src="ArrowBrownIcon"/>
                  </div>
                  <div class="size- px-2 inline-flex flex-col justify-center items-start gap-1">
                    <div class="text-center justify-start text-orange-600 text-xs font-medium  leading-4">NEW PRICE</div>
                    <div class="size- inline-flex justify-start items-center gap-1">
                      <div data-svg-wrapper class="relative">
                        <img :src="TokenIcon"/>
                      </div>
                      <div class="text-center justify-start text-orange-600 text-sm font-semibold  leading-5">1,335</div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="self-stretch inline-flex justify-between items-end">
                <div class="flex-1 flex justify-start flex-col sm:flex-row items-center gap-2">
                  <div class="flex-1 self-stretch min-w-20 p-2 bg-[#07F468] flex justify-center items-center gap-2.5 cursor-pointer">
                    <div data-svg-wrapper class="relative">
                      <img :src="CheckBlackIcon"/>
                    </div>
                    <div class="text-center justify-start text-[#0C111D] text-sm font-medium  capitalize leading-6 tracking-tight">Accept new price</div>
                  </div>
                  <div class="flex-1 self-stretch sm:flex-none sm:self-auto min-w-20 p-2 bg-[#FF4405] flex justify-center items-center gap-2.5 cursor-pointer">
                    <div data-svg-wrapper class="relative">
                      <img :src="CloseIcon"/>
                    </div>
                    <div class="text-center justify-start text-white text-sm font-medium  capitalize leading-6 tracking-tight ">Decline & cancel booking</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="self-stretch flex-1 bg-gray-50 inline-flex justify-start items-start">
      <div class="w-1 self-stretch relative bg-amber-400"></div>
      <div class="flex-1 self-stretch p-4 inline-flex flex-col justify-between items-start gap-2">
        <div class="self-stretch flex flex-col justify-start items-start gap-4">
          <div class="self-stretch inline-flex justify-start items-start gap-4">
            <div data-svg-wrapper class="relative">
              <img :src="userIcon" class="filter grayscale brightness-75 opacity-100"/>
            </div>
            <div class="w-96 inline-flex flex-col justify-center items-start gap-2">
              <div class="self-stretch inline-flex justify-start items-start gap-1 flex-wrap content-start">
                <div class="h-6 flex justify-center items-center gap-1.5">
                  <div data-svg-wrapper class="relative">
                    <img src="https://static.vecteezy.com/system/resources/thumbnails/002/098/203/small/silver-tabby-cat-sitting-on-green-background-free-photo.jpg" class="h-[1.375rem] w-[1.375rem] [border-radius:25%_75%_50%_51%_/_45%_65%_36%_55%]"/>
                  </div>
                  <div class="size- inline-flex flex-col justify-center items-start">
                    <div class="self-stretch inline-flex justify-start items-center gap-1">
                      <div class="justify-start text-gray-900 text-sm font-normal  leading-5 line-clamp-1">Miu Miu</div>
                      <div data-svg-wrapper data-size="xs" class="relative">
                        <img :src="VerifiedBlueTickIcon" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div data-color="dark" data-leading-icon="true" data-property-1="hover" data-size="sm" data-trailing-icon="true" class="size- inline-flex justify-start items-center gap-0.5">
                <div data-svg-wrapper class="relative">
                  <img :src="ChatBlueIcon" />
                </div>
                <div class="justify-start text-blue-600 text-xs font-medium  leading-4">OPEN CHAT</div>
                <div data-svg-wrapper class="relative">
                  <img :src="ArrowUpRightBlueIcon" />
                </div>
              </div>
            </div>
          </div>
          <div class="self-stretch inline-flex justify-start items-start gap-4">
            <div data-svg-wrapper class="relative">
              <img :src="dotPoints"/>
            </div>
            <div class="flex-1 inline-flex flex-col justify-start items-start gap-2">
              <div class="justify-center text-gray-900 text-sm font-semibold  leading-5">Additional request</div>
              <div class="justify-center text-gray-900 text-sm font-normal  leading-5">record live call</div>
              <div class="justify-center text-gray-900 text-sm font-normal  leading-5">Roleplay</div>
              <div class="self-stretch justify-center"><span class="text-gray-900 text-sm font-normal  leading-5 line-clamp-[8]">Personal request       <br/>     Can you try this wet food cat on Miu Miu: </span><span class="text-gray-900 text-sm font-normal  underline leading-5 line-clamp-[8] break-all">https://www.amazon.com/MUFENG-Cosplay-Costume-Halloween-Trainer/dp/B07XYLX8XR/ref=sr_1_8?crid=S6RNG7JA5HMT&dib=eyJ2IjoiMSJ9._8oMRTOR8wazvVQwZU4U2r8x3Aj9eK7wUDKdBRa6jFEfB3X2TcEQoPSzVX6ZMxxxf23lvY2Brm-9JSmAHZ3XRNqewwdaPbB-TvnBg_ZfGbeFopGUG1t68dIr5addAaAOa3fPqm5tfbX4Gb5jHw9gHmBf-wdjgSbHyA06JJ6S2GOqfpIczRXIX3cCMz1gx6v7C2DkA72GY9gEcX0beA1-wmsAdbftDwtXVvgFIdpGCk2MJ3LNccxEcuYa-NuX5s7I9Lqz6jMdZKmlBpt4onwyB6L4CODc-3YDkR9PNjVp6Kk.1qu8r_Nb-pxWhX98dsW-CMxuVYTzBKjWvs237nmxU24&dib_tag=se&keywords=pokemon%2Bcostume&qid=1752650684&sprefix=pokemon%2Bcostu%2Caps%2C554&sr=8-8&th=1&psc=1</span><span class="text-gray-900 text-sm font-normal  leading-5 line-clamp-[8]">’</span></div>
            </div>
          </div>
          <div class="self-stretch inline-flex justify-start items-start gap-4">
            <div data-svg-wrapper class="relative">
              <img :src="dollarIcon"/>
            </div>
            <div class="size- inline-flex flex-col justify-start items-start gap-2">
              <div class="justify-center text-gray-900 text-sm font-semibold  leading-5">Session cost</div>
              <div class="size- inline-flex justify-start items-center gap-2">
                <div class="size- flex justify-start items-center gap-1">
                  <div data-svg-wrapper class="relative">
                  </div>
                  <div class="text-center justify-start text-gray-500 text-sm font-medium  line-through leading-5">1,000</div>
                </div>
                <div data-svg-wrapper class="relative">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M12 19L19 12L12 5" stroke="#F79009" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div class="size- flex justify-start items-center gap-1">
                  <div data-svg-wrapper class="relative">
                  </div>
                  <div class="text-center justify-start text-gray-900 text-sm font-semibold  leading-5">1,335</div>
                </div>
              </div>
            </div>
          </div>
          <div class="self-stretch inline-flex justify-start items-center gap-4">
            <div data-svg-wrapper class="relative">
              <img :src="bellIcon" class="filter grayscale brightness-75 opacity-100"/>
            </div>
            <div class="size- flex justify-start items-center gap-2">
              <div class="justify-center text-gray-900 text-sm font-normal  leading-5">5 minutes before</div>
            </div>
          </div>
        </div>

        <!-- jOIN BUTTON -->
        <div class="self-stretch inline-flex justify-start items-start gap-2.5 ">
          <div class="flex-1 px-4 py-2 bg-[#07F468] rounded-sm flex justify-center items-center gap-3 cursor-pointer">
            <div data-svg-wrapper class="relative">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.4996 10L12.9996 6.5L16.4996 3M12.9996 6.5H20.9996M10.2266 13.8631C9.02506 12.6615 8.07627 11.3028 7.38028 9.85323C7.32041 9.72854 7.29048 9.66619 7.26748 9.5873C7.18576 9.30695 7.24446 8.96269 7.41447 8.72526C7.46231 8.65845 7.51947 8.60129 7.63378 8.48698C7.98338 8.13737 8.15819 7.96257 8.27247 7.78679C8.70347 7.1239 8.70347 6.26932 8.27247 5.60643C8.15819 5.43065 7.98338 5.25585 7.63378 4.90624L7.43891 4.71137C6.90747 4.17993 6.64174 3.91421 6.35636 3.76987C5.7888 3.4828 5.11854 3.4828 4.55098 3.76987C4.2656 3.91421 3.99987 4.17993 3.46843 4.71137L3.3108 4.86901C2.78117 5.39863 2.51636 5.66344 2.31411 6.02348C2.08969 6.42298 1.92833 7.04347 1.9297 7.5017C1.93092 7.91464 2.01103 8.19687 2.17124 8.76131C3.03221 11.7947 4.65668 14.6571 7.04466 17.045C9.43264 19.433 12.295 21.0575 15.3284 21.9185C15.8928 22.0787 16.1751 22.1588 16.588 22.16C17.0462 22.1614 17.6667 22 18.0662 21.7756C18.4263 21.5733 18.6911 21.3085 19.2207 20.7789L19.3783 20.6213C19.9098 20.0898 20.1755 19.8241 20.3198 19.5387C20.6069 18.9712 20.6069 18.3009 20.3198 17.7333C20.1755 17.448 19.9098 17.1822 19.3783 16.6508L19.1835 16.4559C18.8339 16.1063 18.6591 15.9315 18.4833 15.8172C17.8204 15.3862 16.9658 15.3862 16.3029 15.8172C16.1271 15.9315 15.9523 16.1063 15.6027 16.4559C15.4884 16.5702 15.4313 16.6274 15.3644 16.6752C15.127 16.8453 14.7828 16.904 14.5024 16.8222C14.4235 16.7992 14.3612 16.7693 14.2365 16.7094C12.7869 16.0134 11.4282 15.0646 10.2266 13.8631Z" stroke="#0C111D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="justify-start text-gray-900 text-lg font-semibold font-['Poppins'] leading-7">JOIN CALL</div>
          </div>
          <div class="w-11 self-stretch px-4 py-2 rounded-sm outline outline-1 outline-offset-[-1.15px] outline-gray-300 flex justify-center items-center gap-3 cursor-pointer">
            <div data-svg-wrapper class="relative">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" fill="#22CCEE"/>
              <path d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z" fill="#22CCEE"/>
              <path d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z" fill="#22CCEE"/>
              <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" stroke="#22CCEE" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z" stroke="#22CCEE" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z" stroke="#22CCEE" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
    


  </div>
  </PopupHandler>
</template>

<script setup>
import PopupHandler from "./PopupHandler.vue";
import VerifiedBlueTickIcon from "@/assets/images/icons/verified-tick-blue.svg";
import CloseIcon from "@/assets/images/icons/x-close-white.svg";
import DotsWhiteIcon from "@/assets/images/icons/dots-vertical-white.svg";
import CheckBlackIcon from "@/assets/images/icons/check-black.svg";
import ArrowBrownIcon from "@/assets/images/icons/arrow-right-brown.svg";
import ArrowOrrangeIcon from "@/assets/images/icons/arrow-right-orange.svg";
import TokenIcon from "@/assets/images/icons/token-sm-calender.svg"
import alarmIcon from '@/assets/images/icons/alarmIcon.png';
import userIcon from '@/assets/images/icons/profile.webp';
import dotPoints from '@/assets/images/icons/dotpoints.png';
import dollarIcon from '@/assets/images/icons/dollar.png';
import bellIcon from '@/assets/images/icons/bell-1.webp';
import ChatBlueIcon from '@/assets/images/icons/message-text-square-blue.svg';
import ArrowUpRightBlueIcon from '@/assets/images/icons/arrow-up-right-blue.svg';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue"]);

const eventDetailsFanConfig = {
  actionType: "slidein",
  from: "right",
  offset: "0px",
  speed: "300ms",
  effect: "cubic-bezier(0.4, 0, 0.2, 1)",
  closeSpeed: "250ms",
  closeEffect: "cubic-bezier(0.4, 0, 0.2, 1)",
  showOverlay: true,
  closeOnOutside: true,
  lockScroll: true,
  escToClose: true,
  width: { default: "500px", "<768": "100%" },
  height: { default: "100%", "<768": "100%" },
  scrollable: true,
};
</script>
