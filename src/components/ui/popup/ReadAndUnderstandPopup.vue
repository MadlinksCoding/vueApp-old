<template>
  <PopupHandler
    :modelValue="modelValue"
    @update:modelValue="(val) => emit('update:modelValue', val)"
    :config="config"
  >
    <div class="h-full w-full p-5 bg-gray-900/90 md:rounded-[10px] backdrop-blur-[50px] inline-flex flex-col justify-start items-center gap-6 overflow-hidden">
  <div class="flex-1 overflow-y-auto overflow-x-hidden w-full flex flex-col items-center gap-6 pr-1">
  <div class="self-stretch flex flex-col justify-start items-start gap-2">
    <div class="self-stretch inline-flex justify-between items-start">
      <div class="flex-1 justify-start text-gray-200 text-base font-semibold  leading-6">{{ t("booking_call_attendance_policy_confirmation_intro") }}</div>
    </div>
  </div>
  <div class="size-28 relative overflow-hidden">
    <div data-svg-wrapper class="">
      <img :src="FileIconGreen" :alt="t('booking_call_attendance_policy_icon_alt')" />
    </div>
  </div>
  <div class="self-stretch flex flex-col justify-start items-start gap-2">
    <div class="self-stretch text-center justify-start text-gray-200 text-lg font-semibold  leading-7">{{ t("booking_call_attendance_policy_grace_heading") }}</div>
    <div class="flex flex-col flex-col-reverse md:flex-row self-stretch">
      <div class="flex flex-col self-stretch flex-1">
        <div class="self-stretch p-2.5 bg-gray-400/20 outline outline-1 outline-offset-[-0.50px] outline-slate-600 inline-flex justify-center items-center gap-2.5">
          <div class="flex-1 text-center justify-start text-gray-200 text-base font-semibold  leading-6">{{ t("booking_call_attendance_policy_creator_no_show_condition") }}</div>
        </div>
        <div class="size-lf-stretch p-2.5 outline outline-1 outline-offset-[-0.50px] outline-slate-600 inline-flex justify-start items-start gap-2.5">
          <ul class="list-disc ml-5">
            <li class="flex-1 justify-start text-gray-200 text-base font-normal  leading-6">{{ t("booking_call_attendance_policy_full_refund") }}</li>
            <li class="flex-1 justify-start text-gray-200 text-base font-normal  leading-6">{{ t("booking_call_attendance_policy_booking_cancelled") }}</li>
          </ul>
        </div>
      </div>
      <div class="flex flex-col self-stretch flex-1">
        <div class="self-stretch p-2.5 bg-gray-400/20 outline outline-1 outline-offset-[-0.50px] outline-slate-600 inline-flex justify-center items-center gap-2.5">
          <div class="flex-1 text-center justify-start text-gray-200 text-base font-semibold  leading-6">{{ t("booking_call_attendance_policy_fan_no_show_condition") }}</div>
        </div>
        <div class="size-lf-stretch p-2.5 outline outline-1 outline-offset-[-0.50px] outline-slate-600 inline-flex justify-start items-start gap-2.5 flex-1">
          <ul class="list-disc ml-5">
            <li class="flex-1 justify-start text-gray-200 text-base font-normal  leading-6">{{ t("booking_call_attendance_policy_creator_full_payment") }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
  </div>
  <div class="self-stretch flex-shrink-0 mt-auto inline-flex justify-start items-center gap-2 flex-col flex-col-reverse md:flex-row pt-2">
    <button
      type="button"
      class="flex-1 self-stretch h-10 min-w-24 px-6 py-2 bg-[#0C111D] flex justify-center items-center gap-2.5 cursor-pointer"
      data-test="attendance-policy-read-back"
      @click="closePopup"
    >
      <div class="justify-start text-[#07F468] text-base font-medium  leading-6">{{ t("common_back") }}</div>
    </button>
    <button
      type="button"
      class="flex-1 self-stretch h-10 min-w-24 px-6 py-2 bg-[#07F468] flex justify-center items-center gap-2.5 cursor-pointer"
      data-test="attendance-policy-read-confirm"
      @click="confirmPolicy"
    >
      <div class="justify-start text-[#0C111D] text-base font-medium  leading-6 whitespace-nowrap">{{ t("booking_call_attendance_policy_confirm_submit") }}</div>
    </button>
  </div>
</div>
  </PopupHandler>
</template>

<script setup>
import { reactive } from 'vue';
import PopupHandler from "@/components/ui/popup/PopupHandler.vue";
import FileIconGreen from "@/assets/images/icons/file-search-green.svg";
import { useBookingTranslations } from "@/i18n/bookingTranslations.js";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "confirm"]);
const { t } = useBookingTranslations();

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

function closePopup() {
  emit('update:modelValue', false);
}

function confirmPolicy() {
  emit('confirm');
}
</script>
