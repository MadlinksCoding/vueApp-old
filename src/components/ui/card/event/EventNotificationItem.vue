<template>
  <div class="booking-notice-item">
    <div v-if="showAccent" class="booking-notice-item-accent" aria-hidden="true" />
    <div class="booking-notice-date" :class="{ 'booking-notice-time-only': item.timeOnly }">
      <template v-if="item.timeOnly">
        <span>{{ item.time }}</span>
      </template>
      <template v-else>
        <span>{{ item.month }}</span>
        <strong>{{ item.day }}</strong>
      </template>
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex min-w-0 items-center gap-1">
        <img
          :src="PhoneIcon"
          alt=""
          class="booking-notice-phone"
          :class="item.status === 'pending' ? 'booking-notice-phone--green' : 'booking-notice-phone--brown'"
        />
        <strong class="truncate text-sm leading-5" :class="titleColor">{{ item.title }}</strong>
        <span v-if="item.status === 'confirmed'" class="booking-notice-status bg-[#5FE97B]">✓</span>
        <span v-else-if="item.status === 'declined'" class="booking-notice-status bg-[#FF4405]">×</span>
        <span v-else-if="item.status === 'pending'" class="booking-notice-help">?</span>
        <span v-if="isReady" class="booking-notice-countdown"><i />{{ readyLabel }}</span>
      </div>
      <p v-if="!item.timeOnly" class="mt-1 text-xs font-semibold text-slate-700">{{ item.time }}</p>
      <div class="mt-1 flex min-w-0 items-center gap-1.5">
        <span
          v-if="avatarLoading"
          class="booking-notice-avatar-skeleton"
          data-test="notice-avatar-skeleton"
          role="status"
          :aria-label="`Loading ${item.person?.name || 'user'} avatar`"
        />
        <img
          v-else-if="resolvedAvatar && !avatarLoadFailed"
          :key="resolvedAvatar"
          :src="resolvedAvatar"
          :alt="item.person?.name || ''"
          class="booking-notice-avatar"
          data-test="notice-avatar"
          @error="avatarLoadFailed = true"
        />
        <span v-else class="booking-notice-avatar-fallback" aria-hidden="true" />
        <span class="truncate text-xs text-gray-900">{{ item.person?.name }}</span>
        <button
          v-if="showDetail"
          type="button"
          class="ml-auto flex shrink-0 items-center gap-1 text-sm font-medium text-[#B54708]"
          data-test="notice-detail"
          @click="$emit('detail', item)"
        >
          Detail <img :src="ArrowUpRightBrownIcon" alt="" class="h-5 w-5" />
        </button>
      </div>
      <button
        v-if="showJoin"
        type="button"
        class="booking-notice-item-join"
        :class="`booking-notice-item-join--${attentionAnimation}`"
        data-test="notice-item-join"
        @click="$emit('join', item)"
      >
        <img :src="IncomingCallIcon" alt="" />
        JOIN CALL
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import ArrowUpRightBrownIcon from "@/assets/images/icons/arrow-up-right-brown.svg";
import IncomingCallIcon from "@/assets/images/icons/phone-incoming-02.svg";
import PhoneIcon from "@/assets/images/icons/phone.webp";
import { BOOKING_NOTICE_TYPES } from "./bookingNoticeConfig";
import { fetchBookingNoticeProfile } from "./bookingNoticeProfile";

const props = defineProps({
  item: { type: Object, required: true },
  showDetail: { type: Boolean, default: false },
  showAccent: { type: Boolean, default: false },
  showJoin: { type: Boolean, default: false },
  attentionAnimation: { type: String, default: "pulse" },
  variant: { type: String, default: "" },
  readyLabel: { type: String, default: "in 5 min" },
});

defineEmits(["detail", "join"]);

const profile = ref(null);
const profileLoading = ref(false);
const avatarLoadFailed = ref(false);
let profileRequestVersion = 0;

const personUserId = computed(() => {
  const person = props.item.person || {};
  const value = person.userId ?? person.user_id ?? person.id;
  return value === null || value === undefined ? "" : String(value).trim();
});

const avatarLoading = computed(() => Boolean(personUserId.value) && profileLoading.value && !profile.value);
const resolvedAvatar = computed(() => {
  if (personUserId.value) return profile.value?.avatar || "";
  return props.item.person?.avatar || "";
});

watch(personUserId, async (userId) => {
  const requestVersion = ++profileRequestVersion;
  profile.value = null;
  avatarLoadFailed.value = false;
  if (!userId) {
    profileLoading.value = false;
    return;
  }

  profileLoading.value = true;
  try {
    const result = await fetchBookingNoticeProfile(userId);
    if (requestVersion === profileRequestVersion) profile.value = result;
  } catch (_error) {
    if (requestVersion === profileRequestVersion) profile.value = null;
  } finally {
    if (requestVersion === profileRequestVersion) profileLoading.value = false;
  }
}, { immediate: true });

onBeforeUnmount(() => {
  profileRequestVersion += 1;
});

const titleColor = computed(() => {
  if (props.item.status === "declined") return "text-[#B54708]";
  if (props.item.status === "pending") return "text-[#0E9384]";
  return "text-[#B54708]";
});
const isReady = computed(() => props.variant === BOOKING_NOTICE_TYPES.READY_TO_JOIN);
</script>

<style scoped>
.booking-notice-item { display: flex; min-height: 4.5rem; align-items: center; gap: .375rem; }
.booking-notice-item-accent { width: .25rem; flex: 0 0 .25rem; align-self: stretch; border-radius: .625rem; background: white; }
.booking-notice-phone { height: .875rem; width: .875rem; flex-shrink: 0; object-fit: contain; }
.booking-notice-phone--green { filter: brightness(0) saturate(100%) invert(42%) sepia(55%) saturate(856%) hue-rotate(126deg) brightness(91%) contrast(89%); }
.booking-notice-phone--brown { filter: brightness(0) saturate(100%) invert(31%) sepia(56%) saturate(1767%) hue-rotate(359deg) brightness(94%) contrast(92%); }
.booking-notice-date { display: flex; width: 3.5rem; flex-shrink: 0; flex-direction: column; align-items: center; color: #101828; font-size: .75rem; font-weight: 600; line-height: 1rem; }
.booking-notice-date strong { font-size: 1.25rem; line-height: 1.75rem; }
.booking-notice-time-only { align-items: flex-start; color: #344054; }
.booking-notice-avatar { height: 1.25rem; width: 1.25rem; flex: 0 0 1.25rem; border-radius: 999px; object-fit: cover; }
.booking-notice-avatar-skeleton,
.booking-notice-avatar-fallback { height: 1.25rem; width: 1.25rem; flex: 0 0 1.25rem; border-radius: 999px; background: #d0d5dd; }
.booking-notice-avatar-skeleton { position: relative; overflow: hidden; background: #eaecf0; }
.booking-notice-avatar-skeleton::after { position: absolute; inset: 0; content: ""; transform: translateX(-100%); background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .75), transparent); animation: booking-notice-avatar-shimmer 1.2s ease-in-out infinite; }
.booking-notice-status { display: inline-flex; height: 1rem; width: 1rem; flex-shrink: 0; align-items: center; justify-content: center; border-radius: 999px; color: white; font-size: .7rem; }
.booking-notice-help { display: inline-flex; height: 1rem; width: 1rem; flex-shrink: 0; align-items: center; justify-content: center; border: 2px solid #667085; border-radius: 999px; color: #667085; font-size: .65rem; }
.booking-notice-countdown { margin-left: auto; display: inline-flex; flex-shrink: 0; align-items: center; gap: .25rem; color: #ff4405; font-size: .75rem; font-weight: 500; }
.booking-notice-countdown i { height: .4375rem; width: .4375rem; border-radius: 999px; background: #ff4405; }
.booking-notice-item-join { margin-top: .5rem; display: flex; min-height: 2rem; width: 100%; align-items: center; justify-content: center; gap: .5rem; border-radius: .25rem; background: #07f468; color: #0c111d; font-size: .875rem; font-weight: 600; line-height: 1.25rem; }
.booking-notice-item-join img { height: 1.125rem; width: 1.125rem; filter: brightness(0); }
.booking-notice-item-join--pulse { animation: booking-notice-item-green-pulse 1.5s ease-in-out infinite; }
.booking-notice-item-join--blink { animation: booking-notice-item-green-blink 1.1s step-end infinite; }
.booking-notice-item-join--none { animation: none; }
@keyframes booking-notice-item-green-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(7, 244, 104, 0); } 50% { box-shadow: 0 0 0 5px rgba(7, 244, 104, .25); } }
@keyframes booking-notice-item-green-blink { 0%, 100% { box-shadow: 0 0 0 0 rgba(7, 244, 104, 0); } 50% { box-shadow: 0 0 0 5px rgba(7, 244, 104, .35); } }
@keyframes booking-notice-avatar-shimmer { to { transform: translateX(100%); } }
@media (prefers-reduced-motion: reduce) { .booking-notice-item-join, .booking-notice-avatar-skeleton::after { animation: none !important; } }
</style>
