<template>
  <PopupHandler
    :modelValue="modelValue"
    @update:modelValue="(val) => emit('update:modelValue', val)"
    :config="config"
  >
    <div class="h-full w-full p-5 max-w-[520px] bg-white/90 md:rounded-[10px] backdrop-blur-[50px] inline-flex flex-col justify-start items-center gap-6 overflow-hidden">
  <div class="flex-1 overflow-y-auto overflow-x-hidden w-full flex flex-col items-center gap-6 pr-1">
  <div class="self-stretch flex flex-col justify-start items-start gap-2">
    <div class="self-stretch inline-flex justify-between items-start">
      <div class="flex-1 justify-start text-gray-700 text-base font-semibold  leading-6">{{ t("booking_call_attendance_policy_publish_intro") }}</div>
    </div>
  </div>
  <div class="self-stretch flex flex-col justify-start items-start gap-2">
    <div class="self-stretch text-center justify-start text-gray-700 text-lg font-semibold  leading-7">{{ t("booking_call_attendance_policy_grace_heading") }}</div>
    <div class="flex flex-col flex-col-reverse md:flex-row self-stretch">
      <div class="flex flex-col self-stretch flex-1">
        <div class="self-stretch p-2.5 bg-gray-400/20 outline outline-1 outline-offset-[-0.50px] outline-slate-600 inline-flex justify-center items-center gap-2.5">
          <div class="flex-1 text-center justify-start font-semibold  leading-6">{{ t("booking_call_attendance_policy_publish_creator_no_show_condition") }}</div>
        </div>
        <div class="size-lf-stretch p-2.5 outline outline-1 outline-offset-[-0.50px] outline-slate-600 inline-flex justify-start items-start gap-2.5">
          <ul class="list-disc ml-5">
            <li class="flex-1 justify-start font-normal  leading-6">{{ t("booking_call_attendance_policy_publish_fan_full_refund") }}</li>
            <li class="flex-1 justify-start font-normal  leading-6">{{ t("booking_call_attendance_policy_booking_cancelled") }}</li>
          </ul>
        </div>
      </div>
      <div class="flex flex-col self-stretch flex-1">
        <div class="self-stretch p-2.5 bg-gray-400/20 outline outline-1 outline-offset-[-0.50px] outline-slate-600 inline-flex justify-center items-center gap-2.5">
          <div class="flex-1 text-center justify-start font-semibold  leading-6">{{ t("booking_call_attendance_policy_publish_fan_no_show_condition") }}</div>
        </div>
        <div class="size-lf-stretch p-2.5 outline outline-1 outline-offset-[-0.50px] outline-slate-600 inline-flex justify-start items-start gap-2.5 flex-1">
          <ul class="list-disc ml-5">
            <li class="flex-1 justify-start font-normal  leading-6">{{ t("booking_call_attendance_policy_creator_full_payment") }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
  <div class="self-stretch flex items-center gap-2">
    <CheckboxGroup
      v-model="dontShowAgain"
      :label="t('booking_call_attendance_policy_dont_show_again')"
      checkboxClass="m-0 border border-gray-300 [appearance:none] w-5 h-5 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[0.125rem] checked:[&::after]:border-b-[0.125rem] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
      labelClass="text-[#0C111D] text-sm font-medium leading-normal"
      wrapperClass="flex items-center gap-2"
    />
  </div>
  </div>
  <div class="self-stretch flex-shrink-0 mt-auto inline-flex justify-start items-center gap-2 flex-col flex-col-reverse md:flex-row pt-2">
    <button
      type="button"
      class="flex-1 self-stretch h-10 min-w-24 px-6 py-2 bg-[#0C111D] flex justify-center items-center gap-2.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
      data-test="attendance-policy-back"
      :disabled="confirming"
      @click="closePopup"
    >
      <div class="justify-start text-[#07F468] text-base font-medium  leading-6 cursor-pointer">{{ t("common_back") }}</div>
    </button>
    <button
      type="button"
      class="flex-1 self-stretch h-10 min-w-24 px-6 py-2 bg-[#07F468] flex justify-center items-center gap-2.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
      data-test="attendance-policy-confirm"
      :disabled="confirming"
      :aria-busy="confirming ? 'true' : 'false'"
      @click="confirmPublish"
    >
      <span
        v-if="confirming"
        class="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black"
        data-test="attendance-policy-confirm-spinner"
        role="status"
        :aria-label="t('common_loading')"
      />
      <div v-else class="justify-start text-[#0C111D] text-base font-medium  leading-6 whitespace-nowrap">{{ t("booking_call_attendance_policy_confirm_publish") }}</div>
    </button>
  </div>
</div>
  </PopupHandler>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import PopupHandler from "@/components/ui/popup/PopupHandler.vue";
import CheckboxGroup from "@/components/ui/form/checkbox/CheckboxGroup.vue";
import { useBookingTranslations } from "@/i18n/bookingTranslations.js";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  confirming: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "confirm"]);
const { t } = useBookingTranslations();

const dontShowAgain = ref(false);

const config = computed(() => ({
  width: {
    default: '520px',
    '<768': '100vw',
  },
  height: {
    default: 'auto',
    '<768': '100vh',
  },
  centered: true,
  closeOnOutside: !props.confirming,
  escToClose: !props.confirming,
}));

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) dontShowAgain.value = false;
  },
);

function closePopup() {
  if (props.confirming) return;
  emit("update:modelValue", false);
}

function confirmPublish() {
  if (props.confirming) return;
  emit("confirm", { dontShowAgain: dontShowAgain.value });
}
</script>
