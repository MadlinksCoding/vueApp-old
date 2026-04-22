<script setup>
import { ref } from 'vue';
import { useBookingTranslations } from '@/i18n/bookingTranslations.js';

const showAllPolicy = ref(false);
const { t } = useBookingTranslations();
import {
  bookingFlowDotsIcon,
  bookingFlowProfileImage,
  bookingFlowVerifiedIcon,
} from "../OneOnOneBookingFlow/oneOnOneBookingFlowAssets.js";

const props = defineProps({
  timeDisplay: {
    type: String,
    default: '-'
  },
  subtotal: {
    type: Number,
    default: 0
  },
  subtotalDisplay: {
    type: String,
    default: ""
  },
  duration: {
    type: [Number, String],
    default: 0
  },
  // Date prop (e.g. "Tomorrow April 27, 2025")
  dateDisplay: {
    type: String,
    default: '-'
  },
  titleDisplay: {
    type: String,
    default: 'High School Life Simulator'
  },
  creatorAvatar: {
    type: String,
    default: bookingFlowProfileImage,
  },
  creatorName: {
    type: String,
    default: 'Princess Carrot Pop',
  },
  creatorIsVerified: {
    type: Boolean,
    default: false,
  },
  creatorLoading: {
    type: Boolean,
    default: false,
  },
  showApprovalNeeded: {
    type: Boolean,
    default: true
  }
});
</script>

<template>
  <div class="flex-none md:max-w-[21.875rem] h-auto lg:h-[41.625rem] w-full bg-[rgba(12,17,29,0.59)] relative backdrop-blur-[5px] p-0 md:p-4 lg:p-5">
     <!-- Gradient overlay -->
  <div class="absolute inset-0 bg-[#22ccee]/20 pointer-events-none"></div>
    <div class="w-full flex flex-col">

      <div class="w-full flex flex-col justify-between items-stretch md:gap-6">

        <div class="flex flex-col gap-0 md:gap-4 pb-2 md:py-2 w-full">
          <div class="flex flex-row items-center">
            <div class="bg-[#22CCEE] rounded-br-[4px] md:rounded px-2 py-1 w-fit h-[22px] flex justify-center items-center">
              <p class="text-sm leading-[20px] text-[#0C111D] font-bold">{{ t("fan_booking_1on1_call") }}</p>
            </div>
          </div>
          
          <div class="flex flex-col text-white w-full gap-2 px-2 pt-2 md:p-0 lg:p-0">
            <h1 class="no-underline text-xl md:text-2xl font-semibold text-[#F2F4F7] leading-[32px]">{{ titleDisplay }}</h1>
            <div class="flex flex-row items-center gap-2">
              <template v-if="props.creatorLoading">
                <div class="w-6 h-6 rounded-full bg-white/20 animate-skeleton-loading"></div>
                <div class="h-3.5 w-28 rounded bg-white/20 animate-skeleton-loading"></div>
              </template>
              <template v-else>
                <div class="w-6 h-6 flex justify-center items-center">
                  <img :src="props.creatorAvatar || bookingFlowProfileImage" alt="profile-image" class="w-full h-full object-cover" style="border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%" />
                </div>
                <div class="flex flex-row items-center gap-1">
                  <p class="text-xs font-medium leading-[18px]">{{ props.creatorName }}</p>
                  <div v-if="props.creatorIsVerified" class="w-4 h-4 flex justify-center items-center">
                    <img :src="bookingFlowVerifiedIcon" alt="verified-icon" />
                  </div>
                </div>
              </template>
            </div>
            <div v-if="showApprovalNeeded" class="bg-[#0C111D] rounded-[6px] lg:hidden md:p-[0.3125rem_0.375rem] w-fit md:min-h-[28px] flex justify-center items-center gap-2">
              <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowDotsIcon" alt="status-icon" /></div>
              <div class="text-[11px] text-[#FFED29] font-semibold leading-[18px] italic">{{ t("common_approval_needed") }}</div>
            </div>
          </div>
        </div>

        <div class="flex flex-col w-full gap-1 md:gap-3 px-2 pb-2 md:p-0 lg:p-0">
            <div class="flex gap-1 md:gap-2">
              <h3 class="text-sm text-white/50">{{ t("fan_booking_booking_policy") }}</h3>
            </div>
            <ul class="text-sm pl-1 text-[#EAECF0] w-full list-outside wrap leading-5">
              <li class="flex items-start gap-2">
                <span class="flex-none w-1 h-1 bg-[#EAECF0] rounded-full mt-2"></span>
                {{ t("fan_booking_policy_hold_fee") }}
              </li>
              <li class="flex items-start gap-2">
                <span class="flex-none w-1 h-1 bg-[#EAECF0] rounded-full mt-2"></span>
                {{ t("fan_booking_policy_creator_late_partial", { creator: props.creatorName }) }}
              </li>
              <li class="items-start gap-2" :class="[!showAllPolicy ? 'hidden md:flex' : 'flex']">
                <span class="flex-none w-1 h-1 bg-[#EAECF0] rounded-full mt-2"></span>
                {{ t("fan_booking_policy_creator_late_full", { creator: props.creatorName }) }}
              </li>
              <li class="items-start gap-2" :class="[!showAllPolicy ? 'hidden md:flex' : 'flex']">
                <span class="flex-none w-1 h-1 bg-[#EAECF0] rounded-full mt-2"></span>
                {{ t("fan_booking_policy_fan_late") }}
              </li>
            </ul>
            <span
              class="text-[#2CE] text-xs leading-[18px] md:hidden pl-5 cursor-pointer select-none"
              @click="showAllPolicy = !showAllPolicy"
            >
              {{ showAllPolicy ? t('fan_booking_show_less') : t('fan_booking_show_more') }}
            </span>
          </div>
      </div>
    </div>
  </div>
</template>
