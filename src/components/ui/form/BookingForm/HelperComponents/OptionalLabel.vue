<template>
  <span :class="['text-gray-500 text-xs italic font-normal font-[\'Poppins\'] leading-none', { 'ml-1': margin }]">{{ t("common_optional") }}</span>
</template>

<script setup>
import { useBookingTranslations } from "@/i18n/bookingTranslations.js";

const props = defineProps({
  margin: {
    type: Boolean,
    default: true
  }
});

const { t } = useBookingTranslations();
</script>
