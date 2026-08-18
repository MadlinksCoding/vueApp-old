<template>
    <PopupHandler
        :modelValue="modelValue"
        @update:modelValue="(val) => emit('update:modelValue', val)"
        :config="acceptNewPriceConfig"
    >
    <div class="w-96 max-md:w-full p-4 bg-white/90 rounded-[5px] max-md:rounded-b-none max-md:rounded-t-3xl backdrop-blur-[50px] inline-flex flex-col justify-start items-start gap-6">
  <div class="self-stretch flex flex-col justify-center items-start gap-5">
    <div class="self-stretch inline-flex justify-start items-start gap-2">
      <div class="flex-1 justify-start"><span class="text-slate-700 text-base font-bold  leading-6">335 Tokens</span><span class="text-slate-700 text-base font-medium  leading-6"> will be refunded to your account after adjustment on session cost:</span></div>
      <div data-svg-wrapper class="relative cursor-pointer" @click="emit('update:modelValue', false)">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6L6 18M6 6L18 18" stroke="#667085" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
    <div class="self-stretch inline-flex justify-start items-center gap-2">
      <div class="size- px-2 inline-flex flex-col justify-center items-start gap-1">
        <div class="text-center justify-start text-slate-700 text-xs font-medium  leading-4">ORIGINAL PRICE</div>
        <div class="size- inline-flex justify-start items-center gap-1">
          <div data-svg-wrapper class="relative grayscale">
            <img :src="TokenIcon"/>
          </div>
          <div class="text-center justify-start text-gray-500 text-sm font-medium  line-through leading-5">1,335</div>
        </div>
      </div>
      <div data-svg-wrapper class="relative grayscale">
        <img :src="ArrowBrownIcon"/>
      </div>
      <div class="size- px-2 inline-flex flex-col justify-center items-start gap-1">
        <div class="text-center justify-start text-[#FB5BA2] text-xs font-medium  leading-4">NEW PRICE</div>
        <div class="size- inline-flex justify-start items-center gap-1">
          <div data-svg-wrapper class="relative">
            <img :src="TokenIcon"/>
          </div>
          <div class="text-center justify-start text-[#F06] text-sm font-semibold  leading-5">1,000</div>
        </div>
      </div>
    </div>
     <!-- Balance Section -->
            <div class="self-stretch bg-[#182230] bg-[linear-gradient(90deg,rgba(16,24,40,0)_25%,rgba(16,24,40,0.9)_75%)] rounded-lg shadow-[0px_4px_8px_0px_rgba(255,255,255,0.05)] inline-flex flex-col justify-start items-end gap-2 overflow-hidden">
              <div class="self-stretch relative bg-gray-800/10 flex flex-col justify-start items-end gap-2 z-[1]">
                <div data-svg-wrapper class="right-[20px] top-[8.51px] absolute z-[-1]">
                 <img src="https://fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/grey-new-icon.svg" class="h-[139px]"/>
                </div>
                <div class="self-stretch p-4 flex flex-col justify-start items-start gap-3">
                  <div class="self-stretch inline-flex justify-between items-center">
                    <div class="justify-start text-white text-sm font-medium  leading-5">Wallet balance</div>
                    <div class="size- inline-flex flex-col justify-center items-center gap-8">
                      <div class="size- inline-flex justify-start items-center gap-1">
                        <div data-svg-wrapper class="relative">
                        <img :src="TokenIcon" class="h-[24px] w-[24px]"/>
                        </div>
                        <div class="justify-center text-white text-base font-semibold  leading-6">30,000</div>
                      </div>
                    </div>
                  </div>
                  <div class="self-stretch inline-flex justify-between items-center">
                    <div class="size- flex justify-start items-center gap-2">
                      <div class="justify-start text-white text-sm font-medium  leading-5">Refund to wallet</div>
                      <div class="size-4 relative"></div>
                    </div>
                    <div class="size- inline-flex flex-col justify-center items-center gap-8">
                      <div class="size- inline-flex justify-start items-center gap-1">
                        <div class="justify-center text-[#07F468] text-lg font-semibold  leading-7">+</div>
                        <div data-svg-wrapper class="relative">
                          <img :src="TokenIcon" class="h-[24px] w-[24px]"/>
                        </div>
                        <div class="justify-center text-[#07F468] text-base font-semibold  leading-6">110</div>
                      </div>
                    </div>
                  </div>
                  <div class="self-stretch h-[1px] bg-[#F2F4F7] opacity-50"></div>
                  <div class="self-stretch inline-flex justify-between items-center">
                    <div class="justify-start text-white text-sm font-medium  leading-5">Latest wallet balance</div>
                    <div class="size- inline-flex flex-col justify-center items-center gap-8">
                      <div class="size- inline-flex justify-start items-center gap-1">
                        <div data-svg-wrapper class="relative">
                          <img :src="TokenIcon" class="h-[24px] w-[24px]"/>
                        </div>
                        <div class="justify-center text-white text-base font-semibold  leading-6">30,110</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>


     <!-- Balance Section -->
            <div class="self-stretch bg-[#182230] bg-[linear-gradient(90deg,rgba(16,24,40,0)_25%,rgba(16,24,40,0.9)_75%)] rounded-lg shadow-[0px_4px_8px_0px_rgba(255,255,255,0.05)] inline-flex flex-col justify-start items-end gap-2 overflow-hidden">
              <div class="self-stretch relative bg-gray-800/10 flex flex-col justify-start items-end gap-2 z-[1]">
                <div data-svg-wrapper class="right-[20px] top-[-8.51px] absolute z-[-1]">
                 <img src="https://fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/grey-new-icon.svg" class="h-[139px]"/>
                </div>
                <div class="self-stretch p-4 flex flex-col justify-start items-start gap-3">
                  <div class="self-stretch inline-flex justify-between items-center">
                    <div class="justify-start text-[#FCE40D] text-sm font-medium  leading-5">Wallet balance</div>
                    <div class="size- inline-flex  justify-center items-center gap-1">
                        <div class="h-5 px-1 bg-yellow-400 rounded-md inline-flex justify-center items-center gap-0.5">
                            <div data-svg-wrapper class="relative">
                                <img :src="DotsHorizontalIcon" class="h-[24px] w-[24px]"/>
                            </div>
                            <div class="text-right justify-center text-gray-900 text-xs font-semibold font-['Poppins'] leading-4">TOP UP NEEDED</div>
                            </div>
                      <div class="size- inline-flex justify-start items-center gap-1">
                        <div data-svg-wrapper class="relative">
                        <img :src="TokenIcon" class="h-[24px] w-[24px]"/>
                        </div>
                        <div class="justify-center text-[#FCE40D] text-base font-semibold  leading-6">50</div>
                      </div>
                    </div>
                  </div>
                  <div class="self-stretch inline-flex justify-between items-center">
                    <div class="size- flex justify-start items-center gap-2">
                      <div class="justify-start text-white text-sm font-medium  leading-5">Refund to wallet</div>
                      <div class="size-4 relative"></div>
                    </div>
                    <div class="size- inline-flex flex-col justify-center items-center gap-8">
                      <div class="size- inline-flex justify-start items-center gap-1">
                        <div class="justify-center text-white text-lg font-semibold  leading-7">-</div>
                        <div data-svg-wrapper class="relative">
                          <img :src="TokenIcon" class="h-[24px] w-[24px]"/>
                        </div>
                        <div class="justify-center text-white text-base font-semibold  leading-6">110</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
  </div>
  <div class="self-stretch flex flex-col justify-center items-start gap-2">
    <div class="self-stretch h-10 px-2 py-1 bg-[#07F468] inline-flex justify-center items-center gap-2.5 cursor-pointer">
      <div class="justify-center text-black text-lg font-medium  leading-7">CONTINUE</div>
    </div>
  </div>
</div>

    </PopupHandler>
    
</template>

<script setup>
import PopupHandler from "./PopupHandler.vue";
import TokenIcon from "@/assets/images/icons/token-sm-calender.svg";
import ArrowBrownIcon from "@/assets/images/icons/arrow-right-brown.svg";
import DotsHorizontalIcon from "@/assets/images/icons/dots-horizontal.svg";

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(["update:modelValue"]);

const acceptNewPriceConfig = {
    actionType: "popup",
    width: { default: "auto", "<767": "100%" },
    height: { default: "auto" },
    customEffect: "fade",
    containerClass: "max-md:!top-auto max-md:!bottom-0",
};

</script>