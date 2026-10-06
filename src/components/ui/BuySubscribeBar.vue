<template>
  <div class="flex w-full items-end">
    <div class="min-w-0 flex-1 lg:flex-none">
    <button type="button" class="flex h-15 max-h-15 w-full items-center gap-8 rounded-l-xl bg-black xl:bg-[#0C111D] px-3 py-3 pr-11 text-white lg:w-auto" @click="emit('buy')">
      <div class="hidden xl:block px-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="30 30 32 32" fill="none">
          <path d="M35.5002 49H55.2038C56.723 49 57.4826 49 58.0874 48.7168C58.6201 48.4672 59.0677 48.0666 59.3745 47.5647C59.7228 46.995 59.8067 46.24 59.9744 44.7301L60.9675 35.3988
          M31 31H32.8727C33.2696 31 33.4681 31 33.6233 31.0755C33.76 31.1419 33.8733 31.2484 33.9482 31.3806C34.0332 31.5309 34.0456 31.729 34.0703 32.1251L35.4297 53.8749C35.4544 54.271 35.4668 54.4691 35.5518 54.6194C35.6267 54.7516 35.74 54.8581 35.8767 54.9245C36.0319 55 36.2304 55 36.6273 55H56.5
          M39.25 60.25H39.265
          M52.75 60.25H52.765
          M40 60.25C40 60.6642 39.6642 61 39.25 61C38.8358 61 38.5 60.6642 38.5 60.25C38.5 59.8358 38.8358 59.5 39.25 59.5C39.6642 59.5 40 59.8358 40 60.25ZM53.5 60.25C53.5 60.6642 53.1642 61 52.75 61C52.3358 61 52 60.6642 52 60.25C52 59.8358 52.3358 59.5 52.75 59.5C53.1642 59.5 53.5 59.8358 53.5 60.25Z"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"/>

          <path d="M47.5 31L47.5 43M53.5 37L47.5 43L41.5 37"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="flex w-full flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 lg:w-auto lg:justify-start lg:gap-4">
        <div class="flex items-center flex-row-reverse sm:flex-row justify-center gap-3 sm:gap-1.5">
          <div class="relative bg-black/80 py-0.5 pl-3 pr-2 rounded-[0.25rem]">
            <div class="absolute left-[-6px] top-0 sm:-left-2">
              <img :src="LightningIcon" alt="" />
            </div>
            <span class="flex items-center gap-0.5 text-[10px] sm:text-xs font-semibold text-[#FCE40D]">
              {{ discountLabel }}
            </span>
          </div>
          <span class="text-xs sm:text-sm xl:text-lg font-bold tracking-wide">BUY NOW</span>
        </div>
        <span class="flex items-baseline text-white">
          <span class="text-xs xl:text-sm font-medium">USD$</span>
          <span class="text-xl xl:text-2xl font-semibold">{{ buyPrice }}</span>
          <span class="ml-0.5 text-xs xl:text-sm line-through">{{ buyOriginalPrice }}</span>
        </span>
      </div>
    </button>
    </div>
    <div class="relative min-w-0 flex-1 lg:flex-none">
      <div class="absolute left-[-25px] sm:left-[-23px]">
        <svg class="w-[27px] h-20 sm:w-6 sm:h-[4.5rem]" xmlns="http://www.w3.org/2000/svg" width="24" height="72" viewBox="0 0 24 72" fill="none">
          <path d="M23.9525 72H14.0323H13.95H13.9607L23.9525 36H3.27564C1.84904 36 1.13454 36.0008 0.704446 35.6766C0.328997 35.3929 0.0783258 34.9532 0.011202 34.4637C-0.0655209 33.9027 0.25439 33.2106 0.893218 31.8305L14.8915 1.59258C15.0871 1.15817 15.2102 0.887062 15.3472 0.689062L15.4904 0.513281C15.6665 0.327007 15.8791 0.185456 16.112 0.0984375C16.3687 0.0028183 16.6599 7.52277e-05 17.2251 0H23.9525V72Z" fill="#FB0464"/>
        </svg>
      </div>
      <button type="button" class="flex h-[5rem] sm:h-[4.5rem] w-full items-center justify-center flex-col sm:flex-row gap-1 sm:gap-2 rounded-r-2xl bg-[#FF0066] pl-4 pr-5 text-white lg:w-auto lg:justify-start lg:gap-4" @click="emit('subscribe')">
        <div class="flex items-center gap-1.5">
          <div class="relative bg-black/80 py-0.5 pl-3 pr-2 rounded-[0.25rem] min-w-[54px] block sm:hidden  xl:block">
            <div class="absolute left-[-6px] top-0 sm:-left-2">
              <img :src="LightningIcon" alt="" />
            </div>
            <span class="flex items-center gap-0.5 text-[10px] sm:text-xs font-semibold text-[#FCE40D]">
              {{ discountLabel }}
            </span>
          </div>
          <span class="text-base sm:text-xl xl:text-3xl  font-semibold tracking-wide">SUBSCRIBE</span>
        </div>
        <span class="flex items-baseline">
          <span class="text-xs xl:text-sm font-medium">USD$</span>
          <span class="text-xl lg:text-2xl xl:text-4xl font-bold">{{ subscribePrice }}</span>
          <span class="text-xs xl:text-sm font-medium">{{ subscribePeriod }}</span>
        </span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useId } from "vue";
import LightningIcon from "@/assets/images/icons/lightning-02.svg";

defineProps({
  discountLabel: { type: String, default: "10% off" },
  buyPrice: { type: String, default: "115.99" },
  buyOriginalPrice: { type: String, default: "500.99" },
  subscribePrice: { type: String, default: "115.99" },
  subscribePeriod: { type: String, default: "/month" },
});

const emit = defineEmits(["buy", "subscribe"]);
const cartFilterId = useId();
</script>
