<script setup>
import { computed, ref } from 'vue';
import { useBookingTranslations } from '@/i18n/bookingTranslations.js';
import {
  bookingFlowDotsIcon,
  bookingFlowProfileImage,
  bookingFlowVerifiedIcon,
} from "../OneOnOneBookingFlow/oneOnOneBookingFlowAssets.js";

const showAllPolicy = ref(false);
const { t, locale } = useBookingTranslations();

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
  },
  isGroupEvent: {
    type: Boolean,
    default: false
  },
  priceSetting: {
    type: String,
    default: ""
  },
  groupPerformers: {
    type: Array,
    default: () => []
  },
  eventGoalReachedTokens: {
    type: Number,
    default: 0
  },
  eventGoalTokens: {
    type: Number,
    default: 0
  },
  eventGoalPercent: {
    type: Number,
    default: null
  }
});

function normalizeText(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") return true;
    if (normalized === "false" || normalized === "0") return false;
  }
  return false;
}

function normalizePerformer(value, index = 0) {
  if (!value || typeof value !== "object") return null;
  const name = normalizeText(
    value.name
      || value.displayName
      || value.display_name
      || value.username
      || value.creatorName
      || value.hostName,
  );
  if (!name) return null;

  return {
    name,
    avatar: normalizeText(
      value.avatar
        || value.avatarUrl
        || value.avatar_url
        || value.profileImage
        || value.profileImageUrl
        || value.creatorAvatar,
    ) || bookingFlowProfileImage,
    isVerified: normalizeBoolean(value.isVerified ?? value.is_premium ?? value.verified),
    isHost: normalizeBoolean(value.isHost ?? value.host) || index === 0,
  };
}

const isEventGoalGroup = computed(() => String(props.priceSetting || "").toLowerCase() === "eventgoal");

const groupPerformersDisplay = computed(() => {
  const host = {
    name: props.creatorName,
    avatar: props.creatorAvatar,
    isVerified: props.creatorIsVerified,
    isHost: true,
  };
  const performers = [host, ...props.groupPerformers]
    .map((performer, index) => normalizePerformer(performer, index))
    .filter(Boolean);

  const seen = new Set();
  return performers.filter((performer) => {
    const key = performer.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
});

function toWholeTokens(value) {
  const numeric = Number(value || 0);
  return Math.max(0, Math.floor(Number.isFinite(numeric) ? numeric : 0));
}

function formatTokens(value) {
  return toWholeTokens(value).toLocaleString(locale.value);
}

const normalizedEventGoalTokens = computed(() => toWholeTokens(props.eventGoalTokens));
const normalizedEventGoalReachedTokens = computed(() => Math.min(
  normalizedEventGoalTokens.value,
  toWholeTokens(props.eventGoalReachedTokens),
));
const normalizedEventGoalPercent = computed(() => {
  const explicit = Number(props.eventGoalPercent);
  if (Number.isFinite(explicit)) return Math.min(100, Math.max(0, Math.floor(explicit)));
  const goal = normalizedEventGoalTokens.value;
  if (goal <= 0) return 0;
  return Math.min(100, Math.max(0, Math.floor((normalizedEventGoalReachedTokens.value / goal) * 100)));
});
const eventGoalProgressStyle = computed(() => ({ width: `${normalizedEventGoalPercent.value}%` }));

const groupPolicyItems = computed(() => {
  const items = [
    t("fan_booking_group_policy_hold_contribution"),
  ];
  if (isEventGoalGroup.value) {
    items.push(t("fan_booking_group_policy_goal_not_reached"));
  }
  items.push(
    t("fan_booking_group_policy_host_late", { creator: props.creatorName }),
    t("fan_booking_group_policy_coperformer_late"),
  );
  return items;
});
</script>

<template>
  <div
    class="flex-none md:max-w-[21.875rem] h-auto lg:h-[41.625rem] w-full bg-[rgba(12,17,29,0.59)] relative backdrop-blur-[5px] p-0"
    :class="props.isGroupEvent ? 'md:p-0 lg:p-0 overflow-hidden' : 'md:p-4 lg:p-5'"
  >
    <template v-if="props.isGroupEvent">
      <div class="absolute inset-0 bg-[#7A174A]/70 pointer-events-none"></div>
      <div class="relative z-10 flex h-full min-h-[31rem] flex-col justify-between text-white">
        <div class="flex flex-col gap-5 px-4 pt-0 md:px-4 lg:px-4">
          <div class="flex flex-row items-center">
            <div class="bg-[#FF0066] rounded-br-[4px] md:rounded-br-md px-4 py-1 w-fit h-[28px] flex justify-center items-center">
              <p class="text-sm leading-5 text-white font-bold">{{ t("fan_booking_group_event_label") }}</p>
            </div>
          </div>

          <div class="flex flex-col gap-3 pt-4">
            <h1 class="no-underline text-2xl font-semibold text-[#F2F4F7] leading-8">{{ titleDisplay }}</h1>

            <div class="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-base leading-6">
              <template v-for="(performer, index) in groupPerformersDisplay" :key="performer.name">
                <div class="inline-flex items-center gap-1 min-w-0">
                  <img :src="performer.avatar || bookingFlowProfileImage" alt="" class="h-5 w-5 shrink-0 object-cover" style="border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%" />
                  <span class="truncate">{{ performer.name }}</span>
                  <span v-if="performer.isHost" class="rounded-full bg-[#FF0066] px-2 py-0.5 text-sm font-bold leading-5 text-white">{{ t("common_host") }}</span>
                  <img v-if="performer.isVerified" :src="bookingFlowVerifiedIcon" alt="" class="h-3.5 w-3.5 shrink-0" />
                </div>
                <span v-if="index < groupPerformersDisplay.length - 1" class="text-white">,</span>
              </template>
            </div>

            <div class="flex flex-col gap-1 text-2xl font-semibold leading-8">
              <span>{{ dateDisplay }}</span>
              <span>{{ timeDisplay }}</span>
            </div>

            <div v-if="isEventGoalGroup" class="flex flex-col gap-2 pt-5" data-testid="group-sidebar-event-goal-progress">
              <div class="h-1.5 w-full rounded-full bg-white/35">
                <div class="h-full rounded-full bg-[#FFED29]" :style="eventGoalProgressStyle"></div>
              </div>
              <div class="flex justify-between gap-3 text-xs font-semibold leading-4">
                <span class="text-[#FFED29]">{{ t("fan_booking_event_goal_tokens_reached", { reached: formatTokens(normalizedEventGoalReachedTokens), goal: formatTokens(normalizedEventGoalTokens) }) }}</span>
                <span class="text-white">{{ t("fan_booking_event_goal_percent_reached", { percent: normalizedEventGoalPercent }) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col w-full gap-3 px-4 pb-5 pt-10">
          <h3 class="text-sm text-[#EAECF0]">{{ t("fan_booking_group_event_policy_title") }}</h3>
          <ul class="text-sm pl-1 text-[#EAECF0] w-full list-outside wrap leading-5">
            <li v-for="item in groupPolicyItems" :key="item" class="flex items-start gap-2">
              <span class="flex-none w-1 h-1 bg-[#EAECF0] rounded-full mt-2"></span>
              <span>{{ item }}</span>
            </li>
          </ul>
        </div>
      </div>
    </template>
    <template v-else>
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
    </template>
  </div>
</template>
