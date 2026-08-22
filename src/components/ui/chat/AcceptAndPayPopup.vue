<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-[10002] flex items-end sm:items-center justify-center sm:p-4">
      <div class="absolute inset-0 bg-black/40" @click="$emit('close')"></div>

      <div
        class="relative z-10 w-full sm:w-96 p-5 sm:rounded-[10px] rounded-t-[20px] bg-white shadow-[0px_0px_20px_0px_rgba(0,0,0,0.15)] inline-flex flex-col justify-start items-start gap-6">

        <div class="self-stretch flex flex-col justify-start items-start gap-2">
          <div class="self-stretch inline-flex justify-start items-center gap-3">
            <div class="flex-1 justify-start text-gray-950 text-[18px] font-semibold leading-tight">Updated session cost
              will be deducted from your wallet balance:</div>
            <div class="flex-1 justify-start text-[#BC1B06] text-[18px] font-semibold leading-tight hidden">You need to
              top up
              before paying for the updated session cost.</div>
          </div>
        </div>

        <div class="self-stretch py-2 flex flex-col justify-start items-start gap-2">
          <div class="self-stretch flex flex-col justify-start items-start gap-2">
            <div class="justify-center text-gray-950 text-sm font-semibold leading-5">Session cost after adjustment:
            </div>
            <div class="self-stretch inline-flex justify-start items-start gap-2">
              <div class="justify-start text-gray-900 text-base font-normal   line-through leading-6 line-clamp-1">332
                Tokens</div>
              <div class="flex-1 justify-start text-orange-600 text-base font-semibold   leading-6 line-clamp-1">1,337
                Tokens</div>
            </div>
          </div>
        </div>

        <div
          class="relative self-stretch rounded-[10px] bg-[#FF76DD] flex flex-col justify-start items-end overflow-hidden">
          <!-- Background image layer -->
          <div class="absolute inset-0 pointer-events-none mix-blend-normal"
            :style="`background: url(${CatBg}) 205.531px 0px / 42.254% 100% no-repeat;`"></div>

          <!-- Gradient and blur overlay -->
          <div class="absolute inset-0 pointer-events-none backdrop-blur-[5px]"
            style="background: linear-gradient(90deg, rgba(0, 0, 0, 0.00) 0%, rgba(0, 0, 0, 0.50) 100%), rgba(0, 0, 0, 0.20);">
          </div>

          <!-- Content container -->
          <div class="relative z-10 self-stretch w-full flex flex-col justify-start items-end gap-2">
            <div class="self-stretch p-3 flex flex-col justify-start items-start gap-3">
              <div class="self-stretch inline-flex justify-between items-center">
                <div class="justify-start text-white text-sm font-medium   leading-5">Wallet Balance</div>
                <div class="inline-flex flex-col justify-center items-center gap-8">
                  <div class="inline-flex justify-start items-center gap-1">
                    <img :src="TokenIcon" class="h-6 w-6" />
                    <div class="justify-center text-white text-base font-semibold   leading-6">3000</div>
                  </div>
                </div>
              </div>
              <div class="self-stretch inline-flex justify-between items-center">
                <div class="flex justify-start items-center gap-2">
                  <div class="justify-start text-white text-sm font-medium   leading-5">Session Cost Adjustment</div>
                </div>
                <div class="inline-flex flex-col justify-center items-center gap-8">
                  <div class="inline-flex justify-start items-center gap-1">
                    <div class="justify-center text-white text-lg font-semibold   leading-7">-</div>
                    <img :src="TokenIcon" class="h-6 w-6" />
                    <div class="justify-center text-white text-base font-semibold   leading-6">1,005</div>
                  </div>
                </div>
              </div>
              <div class="self-stretch h-px bg-white/20"></div>
              <div class="self-stretch inline-flex justify-between items-center">
                <div class="justify-start text-white text-sm font-medium   leading-5">Balance after payment</div>
                <div class="inline-flex flex-col justify-center items-center gap-8">
                  <div class="inline-flex justify-start items-center gap-1">
                    <img :src="TokenIcon" class="h-6 w-6" />
                    <div class="justify-center text-white text-base font-semibold   leading-6">1,995</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="self-stretch flex flex-col justify-start items-start gap-2">
          <button @click="$emit('close')"
            class="self-stretch w-full h-10 px-6 py-2 bg-[#07F468] rounded-[3px] cursor-pointer hover:opacity-90 inline-flex justify-center items-center gap-2.5 transition-opacity">
            <div class="flex-1 text-center justify-start text-gray-900 text-sm font-semibold   leading-6 uppercase">
              CONFIRM & PAY</div>
          </button>
          <button @click="$emit('close')"
            class="self-stretch w-full h-10 px-6 py-2 rounded-[3px] outline outline-[1px] outline-offset-[-1px] outline-[#EE3400] cursor-pointer hover:bg-orange-50 transition-colors inline-flex justify-center items-center gap-2">
            <div class="flex-1 text-center justify-start text-[#EE3400] text-sm font-semibold   leading-6 uppercase">Go
              Back</div>
          </button>
        </div>

        <div class="self-stretch inline-flex flex-col justify-start items-start gap-2 hidden">
          <div class="self-stretch h-10 min-w-24 px-6 py-2 bg-[#FF4848] inline-flex justify-center items-center gap-2">
            <div class="flex-1 text-center justify-start text-white text-base font-medium leading-6">Go
              to Top up</div>
          </div>
          <div
            class="self-stretch h-10 min-w-24 px-6 py-2 outline outline-[1.50px] outline-offset-[-1.50px] outline-[#FF4848] inline-flex justify-center items-center gap-2">
            <div class="flex-1 text-center justify-start text-[#FF4848] text-base font-medium leading-6">
              Go Back</div>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import TokenIcon from '@/assets/images/icons/token-sm-calender.svg'
import CatBg from '@/assets/images/cat-bg.png'
defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close'])
</script>
