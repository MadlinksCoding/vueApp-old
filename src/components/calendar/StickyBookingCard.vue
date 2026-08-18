<template>
  <article
    class="sticky-booking-card-row min-h-[5rem] sm:rounded-[10px] w-full p-3 flex gap-1.5"
    :class="[
      isPending
        ? 'border-[1.5px] border-white bg-[#F3F5F8]'
        : 'border border-gray-100 bg-white',
      { 'pending-blink-shadow': isPending }
    ]"
    :style="cardShadowStyle"
    data-test="sticky-booking-card"
    :data-booking-status="bookingStatus"
  >
    <div
      class="w-1 self-stretch rounded-[0.875rem]"
      :style="{ backgroundColor: isPending ? '#fff' : accentColor }"
      aria-hidden="true"
    ></div>

    <span
      class="w-16 shrink-0 py-2 text-xs font-semibold leading-4 text-gray-700"
      data-test="mobile-join-card-time"
    >{{ bookingTime }}</span>

    <div class="flex min-w-0 flex-1 flex-col gap-1 self-stretch">
      <div class="flex items-center gap-2">
        <div class="flex min-w-0 flex-1 items-center gap-1">
          <component
            :is="event.isGroup ? GroupCallIcon : PhoneIcon"
            :color="accentColor"
            class="h-4 w-4 shrink-0"
            data-test="mobile-join-card-type-icon"
          />
          <p
            class="truncate text-[0.875rem] font-semibold leading-5"
            :style="{ color: accentColor }"
            data-test="mobile-join-card-title"
          >{{ event.title }}</p>
          <span
            v-if="isPending"
            class="inline-flex h-[14px] w-[14px] shrink-0 items-center justify-center"
            role="img"
            :aria-label="t('calendar_event_status_pending')"
          >
            <PendingStatus width="14" height="14" :status="bookingStatus" />
          </span>
          <img v-else :src="GreenCheckIcon" alt="" aria-hidden="true" />
        </div>

        <div v-if="!hasPendingPriceAdjustment" class="relative" data-sticky-card-menu>
          <button
            type="button"
            class="flex h-5 w-5 shrink-0 items-center justify-center"
            :aria-label="t('dashboard_booking_menu_aria', { title: event.title })"
            :aria-expanded="menuOpen"
            data-test="mobile-join-card-menu-trigger"
            @click.stop="$emit('toggle-menu')"
          >
            <img :src="ThreeDotsIcon" alt="" aria-hidden="true" />
          </button>

          <div
            v-if="menuOpen"
            class="absolute right-0 bottom-[calc(100%+0.5rem)] z-[1200] w-56 overflow-hidden rounded-md border border-[#EAECF0] bg-white shadow-[0_10px_20px_rgba(0,0,0,0.15)]"
            data-test="mobile-join-card-menu"
            @click.stop
          >
            <button
              type="button"
              disabled
              class="w-full cursor-not-allowed px-3 py-3 text-left text-[0.8rem] font-semibold text-[#344054] opacity-30"
            >
              {{ t('dashboard_ask_for_more_time') }}
            </button>
            <button
              type="button"
              disabled
              class="w-full cursor-not-allowed border-t border-[#EAECF0] px-3 py-3 text-left text-[0.8rem] font-semibold text-[#344054] opacity-30"
            >
              {{ t('dashboard_ask_to_reschedule') }}
            </button>
            <button
              type="button"
              class="w-full border-t border-[#EAECF0] px-3 py-3 text-left text-[0.8rem] font-semibold text-[#F04438] hover:bg-[#FEF3F2]"
              data-test="mobile-join-card-cancel"
              @click.stop="$emit('menu-action', 'cancel_call')"
            >
              {{ t('dashboard_cancel_call') }}
            </button>
          </div>
        </div>
      </div>

      <div class="flex min-h-0 items-start justify-between gap-2">
        <div v-if="showsGroup" class="flex min-w-0 items-center gap-1">
          <span class="flex -space-x-2">
            <img
              v-for="(avatar, index) in avatars"
              :key="`${avatar.src}-${index}`"
              :src="avatar.src"
              :alt="avatar.name"
              class="h-5 w-5 shrink-0 rounded-full border border-white object-cover"
            />
          </span>
          <p class="flex-1 truncate text-[0.6875rem] font-medium text-gray-500">
            {{ event.groupText }}
          </p>
        </div>

        <div v-else class="flex min-w-0 items-center gap-2">
          <template v-if="profileLoading">
            <span
              class="h-5 w-5 shrink-0 animate-skeleton-loading rounded-full bg-[#E6E6E6]"
              data-test="mobile-join-card-profile-skeleton"
            ></span>
            <span class="h-3 w-20 animate-skeleton-loading rounded bg-[#E6E6E6]"></span>
          </template>
          <template v-else>
            <img
              :src="profile.avatar"
              :alt="profile.name"
              class="h-5 w-5 shrink-0 rounded-full object-cover"
              data-test="mobile-join-card-profile-avatar"
            />
            <p
              class="flex-1 truncate text-[0.6875rem] font-medium text-gray-500"
              data-test="mobile-join-card-profile-name"
            >{{ profile.name }}</p>
          </template>
        </div>

        <div
          v-if="isPending && isCreatorViewer"
          class="flex w-[5.4375rem] shrink-0 flex-col gap-1"
          data-test="sticky-card-pending-actions"
        >
          <button
            type="button"
            class="flex h-[1.6875rem] w-full items-center justify-center gap-1 rounded border border-[#FF4405] bg-white px-2 py-1"
            data-test="sticky-card-review"
            @click.stop="$emit('review', event)"
          >
            <span class="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
              <IndicatorDot color="#FF4405" size="7" class="absolute left-[-2px] top-[-2px]" />
              <img :src="FileSearchIcon" alt="" aria-hidden="true" />
            </span>
            <span class="text-xs font-semibold uppercase leading-[1.125rem] text-[#FF4405]">
              {{ t('calendar_event_review') }}
            </span>
          </button>

          <button
            type="button"
            class="flex h-7 w-full items-center justify-center gap-1 rounded border border-[#07F468] bg-white px-2 py-1"
            data-test="sticky-card-accept"
            @click.stop="approveBooking"
          >
            <img :src="GreenCheckIcon" alt="" aria-hidden="true" class="h-4 w-4" />
            <span class="text-xs font-semibold uppercase leading-[1.125rem] text-[#079455]">
              {{ t('calendar_event_accept') }}
            </span>
          </button>
        </div>

        <div v-else-if="!isPending" class="flex shrink-0 flex-col items-end gap-1">
          <span class="flex items-center gap-1">
            <IndicatorDot color="#FF4405" class="h-2 w-2" aria-hidden="true" />
            <span
              class="text-[0.6875rem] font-medium text-[#FF4405]"
              data-test="mobile-join-card-status"
            >{{ event.statusText }}</span>
          </span>
          <button
            type="button"
            class="blink-border-blue-effect flex shrink-0 items-center gap-1 rounded bg-[#5549FF] px-2.5 py-1.5 transition-colors hover:bg-[#5549FF]/90"
            data-test="mobile-join-card-join"
            @click.stop="$emit('join-call', event)"
          >
            <img :src="PhoneIncoming02Icon" alt="" aria-hidden="true" />
            <span class="text-[0.75rem] font-semibold text-white">{{ t('common_join_call') }}</span>
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import PhoneIcon from '@/components/icons/PhoneIcon.vue';
import GroupCallIcon from '@/components/icons/GroupCallIcon.vue';
import IndicatorDot from '@/components/icons/IndicatorDot.vue';
import PendingStatus from '@/components/icons/PendingStatus.vue';
import GreenCheckIcon from '@/assets/images/icons/green-check.svg';
import PhoneIncoming02Icon from '@/assets/images/icons/phone-incoming-02.svg';
import ThreeDotsIcon from '@/assets/images/icons/dots-vertical.svg';
import FileSearchIcon from '@/assets/images/icons/file-search-02.svg';
import { useBookingTranslations } from '@/i18n/bookingTranslations.js';
import { buildWpApiUrl } from '@/utils/wpApiBaseUrl.js';
import { isPendingPriceAdjustment } from '@/services/bookings/utils/bookingNegotiationUtils.js';

const props = defineProps({
  event: { type: Object, required: true },
  userRole: { type: String, default: 'creator' },
  menuOpen: { type: Boolean, default: false },
});

const emit = defineEmits(['toggle-menu', 'close-menu', 'menu-action', 'join-call', 'review', 'approve-booking']);
const { t, locale } = useBookingTranslations();
const fetchedProfile = ref(null);
const profileLoading = ref(false);
let profileAbortController = null;

const viewerRole = computed(() => String(props.userRole || 'creator').toLowerCase());
const isCreatorViewer = computed(() => viewerRole.value === 'creator');
const sourceEvent = computed(() => props.event?.sourceEvent || {});
const rawEvent = computed(() => (
  sourceEvent.value?.raw && typeof sourceEvent.value.raw === 'object'
    ? sourceEvent.value.raw
    : {}
));
const hasPendingPriceAdjustment = computed(() => isPendingPriceAdjustment(props.event));

watch(hasPendingPriceAdjustment, (isPending) => {
  if (isPending && props.menuOpen) emit('close-menu');
});
const bookingStatus = computed(() => String(
  sourceEvent.value?.status || rawEvent.value.status || props.event?.status || '',
).trim().toLowerCase());
const isPending = computed(() => (
  bookingStatus.value === 'pending'
  || bookingStatus.value === 'pending_hold'
  || (!bookingStatus.value && props.event?.showReply === true)
));
const accentColor = computed(() => props.event?.accentColor || '#5549FF');
const showsGroup = computed(() => props.event?.isGroup === true && isCreatorViewer.value);
const avatars = computed(() => (
  Array.isArray(props.event?.avatars)
    ? props.event.avatars.filter((avatar) => avatar?.src).slice(0, 4)
    : []
));

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

const profileUserId = computed(() => {
  if (showsGroup.value) return null;
  const creatorId = firstDefined(rawEvent.value.creatorId, sourceEvent.value.creatorId, props.event?.creatorId, null);
  const fanId = firstDefined(rawEvent.value.userId, sourceEvent.value.userId, props.event?.userId, null);
  return viewerRole.value === 'fan' ? creatorId : fanId;
});

const profile = computed(() => {
  const fallback = props.event?.profile || {};
  const firstAvatar = avatars.value[0] || {};
  return {
    name: firstString(fetchedProfile.value?.displayName, fallback.name, firstAvatar.name)
      || t('calendar_event_guest_fallback'),
    avatar: firstString(fetchedProfile.value?.avatar, fallback.avatar, firstAvatar.src)
      || 'https://i.ibb.co/XZHymffZ/avatar-of-a-mango.png',
  };
});

function formatClock(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(locale.value || undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

const bookingTime = computed(() => {
  const start = formatClock(sourceEvent.value.start);
  const end = formatClock(sourceEvent.value.end);
  return start && end ? `${start}–${end}` : start || end;
});

function rgba(color, alpha) {
  const normalized = /^#[0-9a-f]{3}$/i.test(color)
    ? `#${color.slice(1).split('').map((character) => character + character).join('')}`
    : color;
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(normalized);
  if (!match) return `rgba(85, 73, 255, ${alpha})`;
  const [, red, green, blue] = match;
  return `rgba(${Number.parseInt(red, 16)}, ${Number.parseInt(green, 16)}, ${Number.parseInt(blue, 16)}, ${alpha})`;
}

const cardShadowStyle = computed(() => {
  const cssVars = {
    '--shadow-color-75': rgba(accentColor.value, 0.75),
    '--shadow-color-10': rgba(accentColor.value, 0.10),
    '--shadow-color-06': rgba(accentColor.value, 0.06),
  };
  if (!isPending.value) {
    cssVars.boxShadow = [
      `0 0 12px 0 var(--shadow-color-75)`,
      `0 4px 8px -2px var(--shadow-color-10)`,
      `0 2px 4px -2px var(--shadow-color-06)`,
    ].join(', ');
  }
  return cssVars;
});

function normalizeProfile(user) {
  if (!user || typeof user !== 'object') return null;
  return {
    displayName: firstString(user.display_name, user.displayName, user.name),
    username: firstString(user.username, user.user_login),
    avatar: firstString(user.avatar, user.avatarUrl, user.avatar_url),
  };
}

watch(profileUserId, async (userId) => {
  profileAbortController?.abort();
  profileAbortController = null;
  fetchedProfile.value = null;

  if (userId === undefined || userId === null || userId === '') {
    profileLoading.value = false;
    return;
  }

  const controller = new AbortController();
  profileAbortController = controller;
  profileLoading.value = true;

  try {
    const response = await fetch(
      `${buildWpApiUrl('/users/get-profile-data')}?id=${encodeURIComponent(userId)}`,
      { method: 'GET', headers: { Accept: 'application/json' }, signal: controller.signal },
    );
    if (!response.ok) throw new Error(`Failed to fetch sticky card profile (HTTP ${response.status}).`);
    const payload = await response.json();
    fetchedProfile.value = normalizeProfile(payload?.user);
  } catch (error) {
    if (error?.name !== 'AbortError') fetchedProfile.value = null;
  } finally {
    if (profileAbortController === controller) {
      profileAbortController = null;
      profileLoading.value = false;
    }
  }
}, { immediate: true });

function approveBooking() {
  emit('approve-booking', {
    bookingId: sourceEvent.value?.bookingId || rawEvent.value.bookingId || props.event?.bookingId || null,
    eventId: sourceEvent.value?.eventId || rawEvent.value.eventId || props.event?.eventId || null,
    decision: 'approve',
    event: sourceEvent.value,
  });
}

onBeforeUnmount(() => {
  profileAbortController?.abort();
  profileAbortController = null;
});
</script>

<style scoped>
@media (min-width: 678px) and (max-width: 1366px) and (orientation: portrait) {
  .sticky-booking-card-row {
    height: 6.75rem;
  }
}

@keyframes blink-card-shadow {
  0%, 100% {
    box-shadow: 0 0 12px 0 var(--shadow-color-75),
                0 4px 8px -2px var(--shadow-color-10),
                0 2px 4px -2px var(--shadow-color-06);
  }
  50% {
    box-shadow: 0 0 12px 0 transparent,
                0 4px 8px -2px transparent,
                0 2px 4px -2px transparent;
  }
}

.pending-blink-shadow {
  animation: blink-card-shadow 1.5s ease-in-out infinite;
}

@keyframes blink-border-blue {
  0%, 100% { box-shadow: 0 0 0 0 rgba(7, 244, 104, 0); }
  50% { box-shadow: 0 0 0 5px rgba(85, 73, 255, 0.25); }
}

.blink-border-blue-effect {
  animation: blink-border-blue 1.5s ease-in-out infinite;
}
</style>
