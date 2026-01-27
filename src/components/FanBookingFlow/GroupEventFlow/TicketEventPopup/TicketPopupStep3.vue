<script setup>
import { computed } from 'vue';

const props = defineProps({
  engine: {
    type: Object,
    required: true
  }
});

// --- RETRIEVE DATA FROM ENGINE ---
// Yeh wahi state uthayega jo Step 2 aur Step 3 mein sync hui hai
const bookingData = computed(() => {
  return props.engine.getState('bookingDetails') || {};
});

const emit = defineEmits(['close-popup']);
</script>

<template>
<div class="flex-1 w-96 h-full min-h-0 rounded-[10px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ">

    <div class="bg-[linear-gradient(180deg,rgba(12,17,29,0)_25%,#0C111D_100%),url('/images/ai-art.png')] bg-center bg-cover bg-no-repeat backdrop-blur-[1rem]">

        <div class="p-6 bg-[#00000080] backdrop-blur-[10px] flex flex-col justify-center items-center gap-6">
          <div class="flex flex-col justify-center items-center gap-6">
            <img class="w-36 h-36" src="/images/success.svg" />
            <div class="flex flex-col justify-center items-start gap-2">
              <div class="text-center w-full justify-center text-white text-2xl font-semibold leading-8">You’re in !</div>
              <div class="text-center w-full justify-center text-white text-base font-normal leading-6">Get ready for your session!</div>
            </div>
          </div>
        </div>
    
        <div class="w-full p-4 bg-[#FF006633] rounded-bl-[10px] rounded-br-[10px] backdrop-blur-[5px] flex flex-col  justify-center">
          <div class=" gap-4 flex flex-col justify-center w-full">
              <h3 class="font-semibold text-center text-[#F2F4F7] text-lg sm:text-xl lg:text-2xl leading-8">
                J&B’s Cooking show
              </h3>
              
              <div class="flex flex-col justify-center gap-[4px]">
                <div class="flex gap-[6px] justify-center text-white">
                  <div class="w-6 h-6">
                    <img class="w-full h-full rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%]" src="/images/ex-profile.png" alt="" />
                  </div>
                  <div class="flex md:gap-[6px] gap-1 items-center font-normal">
                    <p class="text-white text-xs lg:text-base leading-6">Princess Carrot Pop</p>
                    <p class="px-[6px] bg-[#FF0066] font-medium text-xs lg:text-sm rounded-[50px]">Host</p>
                    <img src="/images/verified-blue-white.svg" alt="" />
                    <p>,</p>
                  </div>
                </div>

                <div class="flex flex-row justify-center gap-2 lg:gap-[6px] text-white">
                  <div class="w-6 h-6">
                    <img class="w-full h-full rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%]" src="/images/ex-profile.png" alt="" />
                  </div>
                  <div class="flex gap-[6px] items-center font-normal">
                    <p class="text-white text-xs lg:text-base leading-6">De La Queen</p>
                    <img src="/images/verified-blue-white.svg" alt="" />
                    <p>,</p>
                    <div class="w-6 h-6">
                      <img class="w-full h-full rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%]" src="/images/ex-profile.png" alt="" />
                    </div>
                    <div class="flex gap-[6px] items-center font-normal">
                      <p class="text-white text-xs lg:text-base leading-6">Buff Bunny</p>
                      <img src="/images/verified-blue-white.svg" alt="" />
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex flex-col w-full gap-1 justify-center">
                <div class="lg:text-xl text-sm text-center font-semibold lg:font-medium text-white">Wednesday, August 24, 2025</div>
                <div class="lg:text-xl text-sm text-center font-medium text-white">9:30pm-10:30pm</div>
              </div>

            </div>


          <div class="w-full flex flex-col justify-start items-center gap-2 mt-[80px]">
            
             <div class="flex w-full justify-center items-center gap-2 bg-[#07F468] p-2">
                <div class="w-6 h-6 flex justify-center items-center">
                  <img src="/images/calendar-black.svg" alt="calendar-icon" />
                </div>
                <p class="text-base leading-6 font-medium text-black">
                  View events on your calendar
                </p>
              </div>

            <div class="w-full pl-2 pr-6 py-2 bg-gray-900 inline-flex justify-center items-center gap-2 cursor-pointer">
              <div class="w-6 h-6 relative overflow-hidden">
                <img src="/images/message-green.svg" alt="message-icon" />        
              </div>
              <div class="text-center justify-start text-green-500 text-base font-medium leading-6">Go to group chat</div>
            </div>

          </div>
        </div>
    </div>


    <div 
      @click="emit('close-popup')" 
      class="absolute -top-4 -right-3 z-99 p-[8px] flex justify-center items-center bg-black/30 rounded-[50px] backdrop-blur-[10px] cursor-pointer"
    >
      <img src="/images/cross-white.svg" alt="cross-white" class="w-4 h-4" />
    </div>

  </div>
</template>