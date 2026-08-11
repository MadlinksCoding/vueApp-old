<template>
  <PopupHandler
    :modelValue="modelValue"
    @update:modelValue="(val) => emit('update:modelValue', val)"
    :config="config"
  >
    <div class="h-full w-full p-5 bg-white/90 md:rounded-[10px] backdrop-blur-[50px] inline-flex flex-col justify-start items-center gap-6 overflow-hidden">
  <div class="flex-1 overflow-y-auto overflow-x-hidden w-full flex flex-col items-center gap-6 pr-1">
  <div class="self-stretch flex flex-col justify-start items-start gap-2">
    <div class="self-stretch inline-flex justify-between items-start">
      <div class="flex-1 justify-start text-gray-700 text-base font-semibold  leading-6">Before you submit your booking, please confirmed that you have read and understand below call attendance policy:</div>
    </div>
  </div>
  <div class="self-stretch flex flex-col justify-start items-start gap-2">
    <div class="self-stretch text-center justify-start text-gray-700 text-lg font-semibold  leading-7">A 5-minute grace period applies after the scheduled start time:</div>
    <div class="flex flex-col flex-col-reverse md:flex-row self-stretch">
      <div class="flex flex-col self-stretch flex-1">
        <div class="self-stretch p-2.5 bg-gray-400/20 outline outline-1 outline-offset-[-0.50px] outline-slate-600 inline-flex justify-center items-center gap-2.5">
          <div class="flex-1 text-center justify-start font-semibold  leading-6">If creator doesn't show up within grace period</div>
        </div>
        <div class="size-lf-stretch p-2.5 outline outline-1 outline-offset-[-0.50px] outline-slate-600 inline-flex justify-start items-start gap-2.5">
          <ul class="list-disc ml-5">
            <li class="flex-1 justify-start font-normal  leading-6">You will receive full refund</li>
            <li class="flex-1 justify-start font-normal  leading-6">Booking cancelled</li>
          </ul>
        </div>
      </div>
      <div class="flex flex-col self-stretch flex-1">
        <div class="self-stretch p-2.5 bg-gray-400/20 outline outline-1 outline-offset-[-0.50px] outline-slate-600 inline-flex justify-center items-center gap-2.5">
          <div class="flex-1 text-center justify-start font-semibold  leading-6">If you don't show up within grace period</div>
        </div>
        <div class="size-lf-stretch p-2.5 outline outline-1 outline-offset-[-0.50px] outline-slate-600 inline-flex justify-start items-start gap-2.5 flex-1">
          <ul class="list-disc ml-5">
            <li class="flex-1 justify-start font-normal  leading-6">Creator receive full payment from fan</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
  <div class="self-stretch flex items-center gap-2">
    <CheckboxGroup
      v-model="dontShowAgain"
      label="Don't show again"
      checkboxClass="m-0 border border-gray-300 [appearance:none] w-5 h-5 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[0.125rem] checked:[&::after]:border-b-[0.125rem] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
      labelClass="text-[#0C111D] text-sm font-medium leading-normal"
      wrapperClass="flex items-center gap-2"
    />
  </div>
  </div>
  <div class="self-stretch flex-shrink-0 mt-auto inline-flex justify-start items-center gap-2 flex-col flex-col-reverse md:flex-row pt-2">
    <div class="flex-1 self-stretch h-10 min-w-24 px-6 py-2 bg-[#0C111D] flex justify-center items-center gap-2.5 cursor-pointer" @click="emit('update:modelValue', false)">
      <div class="justify-start text-[#07F468] text-base font-medium  leading-6 cursor-pointer">Back</div>
    </div>
    <div class="flex-1 self-stretch h-10 min-w-24 px-6 py-2 bg-[#07F468] flex justify-center items-center gap-2.5 cursor-pointer">
      <div class="justify-start text-[#0C111D] text-base font-medium  leading-6 whitespace-nowrap">Confirm & Publish</div>
    </div>
  </div>
</div>
  </PopupHandler>
</template>

<script setup>
import { reactive, ref } from 'vue';
import PopupHandler from "@/components/ui/popup/PopupHandler.vue";
import CheckboxGroup from "@/components/ui/form/checkbox/CheckboxGroup.vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

const dontShowAgain = ref(false);

const config = reactive({
  width: {
    default: '520px',
    '<768': '100vw',
  },
  height: {
    default: 'auto',
    '<768': '100vh',
  },
  centered: true,
});
</script>
