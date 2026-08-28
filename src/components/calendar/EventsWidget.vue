<template>
  <section class="flex flex-col gap-[1rem]">
    
    <div v-for="(section, sIndex) in sections" :key="sIndex" class="flex flex-col gap-[0.5rem] w-full">
      <div class="flex items-center justify-between gap-3 self-stretch">
        <div class="flex gap-1 items-center">
          <h3
            v-if="section.items && section.items.length > 0"
            class="text-sm text-[#0C111D] leading-[1.125rem] font-semibold uppercase"
          >
            {{ section.title }}
          </h3>
          <div
            v-if="section.items && section.items.length > 0"
            class="px-2 py-1 h-[18px] flex items-center justify-center rounded-full"
            :class="isPendingSection(section) ? 'bg-[#F79009]' : 'bg-[#98A2B3]'"
            data-test="events-widget-section-count-badge"
          >
            <span
              class="text-sm font-semibold text-white"
              data-test="events-widget-section-count"
            >{{ section.items?.length ?? 0 }}</span>
          </div>
        </div>
        <button
          v-if="section.items && section.items.length > 0"
          type="button"
          class="hidden ipad-portrait-large:hidden lg:flex h-5 w-5 items-center justify-center rounded text-slate-700 hover:bg-slate-200/70"
          :aria-expanded="isSectionExpanded(sIndex) ? 'true' : 'false'"
          @click.stop="toggleSection(sIndex)"
        >
          <svg
            width="10"
            height="7"
            viewBox="0 0 10 7"
            fill="none"
            :class="[
              'transition-transform duration-150',
              isSectionExpanded(sIndex) ? '' : 'rotate-180',
            ]"
            aria-hidden="true"
          >
            <path d="M5 0.75L9.25 6.25H0.75L5 0.75Z" fill="currentColor" />
          </svg>
        </button>
      </div>

      <template v-if="isSectionExpanded(sIndex)">
      <section 
        v-for="(event, eIndex) in section.items" 
        :key="eIndex"
        data-test="events-widget-card"
        class="relative flex justify-end rounded-[10px] cursor-pointer shadow-purple-glow"
        :class="[
          event.bgClass || 'bg-customGrey',
          isPendingSection(section) &&
            'border-[1.5px] border-white bg-white/10',
          isPendingSection(section) &&
            eIndex === 0 &&
            'pending-blink-shadow'
        ]"
        :style="getEventCardStyles(event, isPendingSection(section))"
        @click="$emit('event-click', event)"
      >
      
      <section class="flex gap-1 px-[0.5rem] py-[0.5rem] w-full min-h-[6.25rem] h-auto">
          <div 
            class="w-[0.25rem] self-stretch rounded-[0.875rem]"
            :class="event.borderClass"
            :style="isPendingSection(section)
              ? { background: '#fff' }
              : (event.accentColor ? { backgroundColor: event.accentColor } : null)"
          ></div>
          
          <span class="flex flex-col py-2 justify-start items-center w-[3.375rem] h-auto shrink-0" data-test="events-widget-date">
             <p class="text-[0.75rem] text-gray-700 font-semibold leading-[1.125rem] uppercase" data-test="events-widget-month">{{ (event.monthName || event.dayName)?.substring(0, 3) }}</p>
             <p class="text-[1.125rem] text-gray-700 font-semibold leading-[1.75rem]" data-test="events-widget-day">{{ event.dayNumber }}</p>
          </span>

          <span class="flex flex-col gap-[0.25rem] h-auto flex-1 min-w-0"> 
            <div class="flex justify-between items-center">
              <div class="flex items-center justify-center gap-1">
                <h3
                  class="text-[0.875rem] font-semibold leading-[1.25rem] max-w-[11.25rem] truncate pr-1"
                  :class="event.titleColorClass"
                  :style="isPendingSection(section)
                ? { color: '#101828' }
                : (event.accentColor ? { color: event.accentColor } : null)"
            >
              {{ event.title }}
            </h3>
            <div>
              <img v-if="!isPendingSection(section)" :src=GreenCheckIcon class="w-[16px] h-[16px]">
            </div>
            <TooltipIcon v-if="isPendingSection(section)" wrapper-class="w-[14px] h-[14px]" icon-class="w-[14px] h-[14px]" :text="t('calendar_event_status_pending')" />
            </div>
            <span
              v-if="showOptionsMenu(event)"
              class="relative flex items-center justify-center w-[1rem] h-[1rem]"
            >
              <button
                type="button"
                class="flex items-center justify-center w-[1rem] h-[1rem]"
                :aria-expanded="openMenuId === `${sIndex}-${eIndex}`"
                data-test="events-widget-menu-trigger"
                @click.stop="toggleMenu(`${sIndex}-${eIndex}`)"
              >
                <!-- ThreeDotsIcon -->
                <svg width="4" height="12" viewBox="0 0 4 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.00004 6.6665C2.36823 6.6665 2.66671 6.36803 2.66671 5.99984C2.66671 5.63165 2.36823 5.33317 2.00004 5.33317C1.63185 5.33317 1.33337 5.63165 1.33337 5.99984C1.33337 6.36803 1.63185 6.6665 2.00004 6.6665Z" stroke="#98A2B3" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2.00004 1.99984C2.36823 1.99984 2.66671 1.70136 2.66671 1.33317C2.66671 0.964981 2.36823 0.666504 2.00004 0.666504C1.63185 0.666504 1.33337 0.964981 1.33337 1.33317C1.33337 1.70136 1.63185 1.99984 2.00004 1.99984Z" stroke="#98A2B3" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2.00004 11.3332C2.36823 11.3332 2.66671 11.0347 2.66671 10.6665C2.66671 10.2983 2.36823 9.99984 2.00004 9.99984C1.63185 9.99984 1.33337 10.2983 1.33337 10.6665C1.33337 11.0347 1.63185 11.3332 2.00004 11.3332Z" stroke="#98A2B3" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>

              <div
                v-if="openMenuId === `${sIndex}-${eIndex}`"
                class="absolute right-0 top-[1.3rem] z-[1200] w-[14rem] rounded-[0.375rem] border border-[#EAECF0] bg-white shadow-[0_10px_20px_rgba(0,0,0,0.15)] overflow-hidden"
                data-test="events-widget-menu"
                @click.stop
              >
                <button
                  type="button"
                  class="w-full flex items-center gap-2 px-3 py-3 text-left text-[0.8rem] font-semibold text-[#F04438] hover:bg-[#FEF3F2]"
                  @click.stop="onMenuAction('cancel_call', event)"
                >
                  <span class="inline-flex w-5 h-5 items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M10 14L21 3M14 10L3 21M4.5 8.5C3.5 6.5 3.5 4.5 5 3C7 1 10 2 12.5 4.5L19.5 11.5C22 14 23 17 21 19C19.5 20.5 17.5 20.5 15.5 19.5" stroke="#F04438" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                  {{ t("dashboard_cancel_call") }}
                </button>
              </div>
            </span>
            </div>
            <span
              v-if="event.time"
              class="text-xs font-semibold leading-[1.125rem] text-gray-700"
              data-test="events-widget-time"
            >{{ event.time }}</span>

            <div class="flex gap-1.5 items-start flex-1 flex-col">
              <span class="flex flex-1 min-w-0" >
                
                <template v-if="shouldShowSingleProfile(event)">
                  <span
                    v-if="isProfileLoading(event)"
                    class="inline-flex items-center gap-1 "
                    data-test="event-profile-skeleton"
                  >
                    <span class="z-[30] w-5 h-5 rounded-full shrink-0 bg-[#E6E6E6] animate-skeleton-loading"></span>
                    <span class="h-3 w-20 rounded bg-[#E6E6E6] animate-skeleton-loading"></span>
                  </span>
                  <template v-else>
                  <img 
                    class="z-[30] w-5 h-5 rounded-full object-cover object-center shrink-0"
                      :src="displayProfile(event).avatar"
                      :alt="displayProfile(event).name"
                      data-test="event-profile-avatar"
                  />
                    <p
                      class="text-[0.6875rem]  text-gray-500 font-medium leading-[1.125rem] ml-1 truncate"
                      data-test="event-profile-name"
                    >
                      {{ displayProfile(event).name }}
                  </p>
                  </template>
                </template>
  
                <template v-else>
                  <div class="flex">
  
                      <span class="flex -space-x-[.8rem]">
  
                          <div 
                          v-for="(av, i) in event.avatars" 
                          :key="i"
                          class="w-[1rem] h-[1rem] rounded bg-cover bg-center mask-mango shrink-0 border border-white"
                          :class="`z-[${30 - (i*10)}]`" 
                          :style="{ backgroundImage: `url(${av.src})` }"
                          ></div>
                      </span>
  
                      <p v-if="event.isGroup" class="text-[0.6875rem]  text-gray-500 font-medium leading-[1.125rem] mt-[-2px] truncate">
                         {{ event.groupText }}
                      </p>
                  </div>
                </template>
              </span>

              <div
                v-if="shouldShowPendingActions(event)"
                class="flex flex-1 self-stretch shrink-0 gap-2"
                data-test="pending-booking-actions"
              >


                <button
                  v-if="shouldShowPendingAccept(event)"
                  type="button"
                  class="flex h-7 w-full items-center self-stretch justify-center gap-1 rounded bg-[#07F468] px-2 py-1"
                  data-test="pending-booking-accept"
                  @click.stop="handleApprove(event)"
                >
                  <span class="inline-flex h-4 w-4 shrink-0 items-center justify-center">
                    <img :src="CheckCircle" alt="" aria-hidden="true" class="h-4 w-4 brightness-0" />
                  </span>
                  <span class="text-xs font-semibold uppercase leading-[1.125rem] text-[#0C111D]">
                    {{ t("calendar_event_accept") }}
                  </span>
                </button>

                <button
                  type="button"
                  class="flex h-[1.6875rem] w-full self-stretch items-center justify-center gap-1 rounded border border-[#FF4405] bg-white px-2 py-1"
                  data-test="pending-booking-review"
                  @click.stop="handleReview(event)"
                >
                  <span class="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
                    <IndicatorDot color="#FF4405" size="7" class="absolute left-[-2px] top-[-2px]" />
                    <img :src="fileSearchIcon" alt="" aria-hidden="true" />
                  </span>
                  <span class="text-xs font-semibold uppercase leading-[1.125rem] text-[#FF4405]">
                    {{ t("calendar_event_review") }}
                  </span>
                </button>
              </div>

              <div v-else-if="shouldShowJoinButton(event)" class="flex flex-col items-end justify-end w-[5.4375rem] self-stretch gap-1">
              <span class="flex items-center gap-[0.25rem]">
                <div
                  data-test="join-status-dot"
                  class="w-[0.41669rem] h-[0.41669rem] rounded-[50%]"
                  :style="joinStatusColor(event) ? { backgroundColor: joinStatusColor(event) } : null"
                  :class="joinStatusColor(event) ? '' : (joinButtonEnabled(event) ? 'bg-lightViolet' : 'bg-gray-400')"
                ></div>
                <p
                  data-test="join-status-text"
                  class="text-xs text-[#0E9384] font-medium uppercase"
                  :style="joinStatusColor(event) ? { color: joinStatusColor(event) } : null"
                >{{ event.statusText }}</p>
              </span>

              <span v-if="joinButtonEnabled(event)" class="relative inline-flex w-full">
                <button
                  data-test="events-widget-join-call"
                  class="blink-border-effect flex h-[1.5rem] w-full items-center justify-between gap-[0.25rem] rounded-[0.25rem] bg-[#07F468] px-2 py-[3px] outline-none transition-colors"
                  @click.stop="$emit('join-click', event)"
                >
                  <span class="w-[1rem] h-[1rem]">
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10.9998 1L8.66645 3.33333M8.66645 3.33333L10.9998 5.66667M8.66645 3.33333H13.9998M6.8178 8.24205C6.01675 7.44099 5.38422 6.53523 4.92022 5.56882C4.88031 5.48569 4.86036 5.44413 4.84503 5.39154C4.79054 5.20463 4.82968 4.97513 4.94302 4.81684C4.97491 4.7723 5.01302 4.7342 5.08923 4.65799C5.3223 4.42492 5.43883 4.30838 5.51502 4.1912C5.80235 3.74927 5.80235 3.17955 5.51502 2.73762C5.43883 2.62044 5.3223 2.5039 5.08923 2.27083L4.95931 2.14092C4.60502 1.78662 4.42787 1.60947 4.23762 1.51324C3.85924 1.32186 3.4124 1.32186 3.03402 1.51324C2.84377 1.60947 2.66662 1.78662 2.31233 2.14092L2.20724 2.24601C1.85416 2.59909 1.67762 2.77563 1.54278 3.01565C1.39317 3.28199 1.2856 3.69565 1.2865 4.00113C1.28732 4.27643 1.34073 4.46458 1.44753 4.84087C2.02151 6.86314 3.10449 8.77138 4.69648 10.3634C6.28847 11.9554 8.19671 13.0383 10.219 13.6123C10.5953 13.7191 10.7834 13.7725 11.0587 13.7733C11.3642 13.7743 11.7779 13.6667 12.0442 13.5171C12.2842 13.3822 12.4608 13.2057 12.8138 12.8526L12.9189 12.7475C13.2732 12.3932 13.4504 12.2161 13.5466 12.0258C13.738 11.6474 13.738 11.2006 13.5466 10.8222C13.4504 10.632 13.2732 10.4548 12.9189 10.1005L12.789 9.97062C12.5559 9.73755 12.4394 9.62101 12.3222 9.54482C11.8803 9.25749 11.3106 9.2575 10.8687 9.54482C10.7515 9.62102 10.6349 9.73755 10.4019 9.97062C10.3257 10.0468 10.2875 10.0849 10.243 10.1168C10.0847 10.2302 9.85521 10.2693 9.66831 10.2148C9.61572 10.1995 9.57415 10.1795 9.49103 10.1396C8.52461 9.67562 7.61885 9.0431 6.8178 8.24205Z" stroke="#0C111D" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                  <p class="text-[0.75rem] font-semibold leading-[1.125rem] text-black">
                    {{ t("common_join_call") }}
                  </p>
                </button>
              </span>
            </div>

            </div>
            
          </span>

          <div class="flex  gap-[0.25rem] shrink-0">
        

            <!-- <span v-else-if="event.showReply" class="flex flex-col justify-end h-[2.875rem]">
              <button 
                @click.stop="$emit('event-click', event)"
                class="text-[0.75rem] text-gray-500 leading-[1.125rem] font-semibold px-[0.5rem] py-[0.1875rem] border border-gray-500 rounded-[0.25rem] hover:bg-gray-50"
              >
                {{ t("common_reply") }}
              </button>
            </span> -->
          </div>

        </section>
      </section>
      </template>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useBookingTranslations } from "@/i18n/bookingTranslations.js";
import { buildWpApiUrl } from "@/utils/wpApiBaseUrl.js";
import TooltipIcon from '../ui/tooltip/TooltipIcon.vue';
import fileSearchIcon from "@/assets/images/icons/file-search-02.svg";
import IndicatorDot from "../icons/IndicatorDot.vue";
import GreenCheckIcon from "@/assets/images/icons/green-check.svg"
import { isPendingCounterOffer, isPendingPriceAdjustment } from '@/services/bookings/utils/bookingNegotiationUtils.js';
import { shouldShowBookingOptionsMenu } from '@/services/bookings/utils/bookingMenuVisibility.js';
import CheckCircle from "@/assets/images/icons/check-circle.svg"


const getEventCardStyles = (event, isPending) => {
  const styles = {};
  let r = 16, g = 24, b = 40;
  let hasValidColor = false;
  
  if (event.accentColor) {
    let color = event.accentColor;
    if (color.startsWith('rgb')) {
      const match = color.match(/\d+(\.\d+)?/g);
      if (match && match.length >= 3) {
        r = match[0]; g = match[1]; b = match[2];
        hasValidColor = true;
      }
    } else {
      let hex = color.replace(/^#/, '');
      if (hex.length === 3) hex = hex.split('').map(char => char + char).join('');
      if (hex.length === 6 || hex.length === 8) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
        hasValidColor = true;
      }
    }
  }
  
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    r = 16; g = 24; b = 40;
    hasValidColor = false;
  }
  
  if (isPending) {
    styles['--shadow-color-75'] = `rgba(${r}, ${g}, ${b}, 0.75)`;
    styles['--shadow-color-10'] = `rgba(${r}, ${g}, ${b}, 0.10)`;
    styles['--shadow-color-06'] = `rgba(${r}, ${g}, ${b}, 0.06)`;
  } else if (hasValidColor) {
    styles.boxShadow = `0 4px 8px -2px rgba(${r}, ${g}, ${b}, 0.10), 0 2px 4px -2px rgba(${r}, ${g}, ${b}, 0.06)`;
  }
  
  return styles;
};
const props = defineProps({
  sections: {
    type: Array,
    default: () => [],
  },
  userRole: {
    type: String,
    default: "creator",
  },
});

const openMenuId = ref(null);
const expandedSections = ref({});
const menuComparisonTime = ref(Date.now());
let menuEligibilityTimer = null;

const isSectionExpanded = (sIndex) => {
  return expandedSections.value[sIndex] !== false;
};

const toggleSection = (sIndex) => {
  expandedSections.value[sIndex] = !isSectionExpanded(sIndex);
};

const { t } = useBookingTranslations();
const isPendingSection = (section = {}) => {
  if (typeof section.isPending === "boolean") return section.isPending;

  return String(section.title || "").trim().toLocaleUpperCase()
    === String(t("dashboard_pending_events")).trim().toLocaleUpperCase();
};
const profileStateById = reactive({});
const profileAbortControllers = new Map();
const DEFAULT_PROFILE_AVATAR = "https://i.ibb.co/XZHymffZ/avatar-of-a-mango.png";

const closeMenu = () => {
  openMenuId.value = null;
};

const toggleMenu = (menuId) => {
  openMenuId.value = openMenuId.value === menuId ? null : menuId;
};

const eventForMenuId = (menuId) => {
  const [sectionIndex, eventIndex] = String(menuId || '').split('-').map(Number);
  if (!Number.isInteger(sectionIndex) || !Number.isInteger(eventIndex)) return null;
  return props.sections?.[sectionIndex]?.items?.[eventIndex] || null;
};

const emit = defineEmits(['join-click', 'reply-click', 'event-click', 'menu-action', 'approve-booking', 'accept-details']);
const CONFIRMED_STATUS_DOT_COLOR = "#07F468";
const viewerRole = computed(() => String(props.userRole || "creator").toLowerCase());
const isFanViewer = computed(() => viewerRole.value === "fan");
const isCreatorViewer = computed(() => viewerRole.value === "creator");

const onMenuAction = (action, event) => {
  emit('menu-action', { action, event });
  closeMenu();
};

const shouldShowJoinButton = (event = {}) => (
  event.showReply !== true
  && (
    event.showJoin === true
    || event.canJoin === true
    || Boolean(event.joinUrl)
  )
);

const joinButtonEnabled = (event = {}) => (
  Boolean(event.joinUrl)
  && event.canJoin === true
);

const normalizedStatusText = (event = {}) => String(event.statusText || "").trim().toLowerCase();

const joinStatusColor = (event = {}) => {
  const statusText = normalizedStatusText(event);

  if (statusText === "confirmed" || statusText === "live now") {
    return CONFIRMED_STATUS_DOT_COLOR;
  }

  if (event.statusColor) return event.statusColor;

  if (statusText.includes("in ") && statusText.includes("min")) {
    return "#FF4405";
  }

  return joinButtonEnabled(event) && event.accentColor ? event.accentColor : null;
};

const pickFirstString = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null);

const normalizeGuestProfile = (user) => {
  if (!user || typeof user !== "object") return null;

  return {
    displayName: pickFirstString(user.display_name, user.displayName, user.name),
    username: pickFirstString(user.username, user.user_login),
    avatar: pickFirstString(user.avatar, user.avatarUrl, user.avatar_url),
  };
};

const getSourceEvent = (event = {}) => event?.sourceEvent || event?.event || event || {};

const getRawEvent = (event = {}) => {
  const sourceEvent = getSourceEvent(event);
  return sourceEvent?.raw && typeof sourceEvent.raw === "object" ? sourceEvent.raw : {};
};

const getEventStatus = (event = {}) => {
  const sourceEvent = getSourceEvent(event);
  const raw = getRawEvent(event);
  return String(sourceEvent?.status || sourceEvent?.bookingStatus || raw.status || raw.bookingStatus || event?.status || event?.bookingStatus || "").trim().toLowerCase();
};

const isPendingEvent = (event = {}) => {
  const status = getEventStatus(event);
  return status === "pending" || status === "pending_hold" || (!status && event.showReply === true);
};

const getBookingId = (event = {}) => {
  const sourceEvent = getSourceEvent(event);
  const raw = getRawEvent(event);
  return pickFirstString(sourceEvent?.bookingId, raw.bookingId, event?.bookingId);
};

const parseEventBoundary = (event = {}, boundary = "start") => {
  const sourceEvent = getSourceEvent(event);
  const raw = getRawEvent(event);
  const candidates = boundary === "end"
    ? [sourceEvent?.end, sourceEvent?.endIso, sourceEvent?.endAtIso, sourceEvent?.endsAt, sourceEvent?.endTime, raw.end, raw.endIso, raw.endAtIso, raw.endsAt, raw.endTime, event?.end, event?.endIso, event?.endAtIso, event?.endsAt, event?.endTime]
    : [sourceEvent?.start, sourceEvent?.startIso, sourceEvent?.startAtIso, sourceEvent?.startsAt, sourceEvent?.startTime, raw.start, raw.startIso, raw.startAtIso, raw.startsAt, raw.startTime, event?.start, event?.startIso, event?.startAtIso, event?.startsAt, event?.startTime];
  const value = candidates.find((candidate) => candidate !== undefined && candidate !== null && candidate !== "");
  const timestamp = value == null ? Number.NaN : new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
};

const getMenuExpiryTime = (event = {}) => {
  const status = getEventStatus(event) || (isPendingEvent(event) ? "pending" : "confirmed");
  if (status === "pending" || status === "pending_hold") return parseEventBoundary(event, "start");
  if (status === "confirmed" || status === "accepted") return parseEventBoundary(event, "end");
  return null;
};

const showOptionsMenu = (event = {}) => {
  const status = getEventStatus(event) || (isPendingEvent(event) ? "pending" : "confirmed");
  const expiryTime = getMenuExpiryTime(event);
  return Boolean(getBookingId(event)) && shouldShowBookingOptionsMenu({
    viewerRole: viewerRole.value,
    status,
    isPassed: expiryTime !== null && menuComparisonTime.value >= expiryTime,
    hasPendingPriceAdjustment: isPendingPriceAdjustment(event),
  });
};

const scheduleMenuEligibilityTimer = () => {
  if (menuEligibilityTimer) {
    clearTimeout(menuEligibilityTimer);
    menuEligibilityTimer = null;
  }

  const now = Date.now();
  let nextExpiry = null;
  (Array.isArray(props.sections) ? props.sections : []).forEach((section) => {
    (Array.isArray(section?.items) ? section.items : []).forEach((event) => {
      const expiryTime = getMenuExpiryTime(event);
      if (expiryTime !== null && expiryTime > now && (nextExpiry === null || expiryTime < nextExpiry)) {
        nextExpiry = expiryTime;
      }
    });
  });

  if (nextExpiry === null) return;
  menuEligibilityTimer = setTimeout(() => {
    menuEligibilityTimer = null;
    menuComparisonTime.value = Date.now();
    if (openMenuId.value && !showOptionsMenu(eventForMenuId(openMenuId.value) || {})) closeMenu();
    scheduleMenuEligibilityTimer();
  }, Math.min(2147483647, Math.max(0, nextExpiry - now + 1)));
};

const shouldShowPendingActions = (event = {}) => isCreatorViewer.value && isPendingEvent(event);
const shouldShowPendingAccept = (event = {}) => (
  shouldShowPendingActions(event) && !isPendingCounterOffer(event)
);

const handleReview = (event = {}) => {
  emit("event-click", event);
};

const handleApprove = (event = {}) => {
  const sourceEvent = getSourceEvent(event);
  const raw = getRawEvent(event);
  emit("accept-details", {
    bookingId: sourceEvent?.bookingId || raw.bookingId || event?.bookingId || null,
    eventId: sourceEvent?.eventId || raw.eventId || event?.eventId || null,
    event: sourceEvent,
  });
};

const getCreatorUserId = (event = {}) => {
  const raw = getRawEvent(event);
  const sourceEvent = getSourceEvent(event);
  return firstDefined(raw.creatorId, sourceEvent?.creatorId, event?.creatorId, null);
};

const getFanUserId = (event = {}) => {
  const raw = getRawEvent(event);
  const sourceEvent = getSourceEvent(event);
  return firstDefined(raw.userId, sourceEvent?.userId, event?.userId, null);
};

const getGuestUserId = (event = {}) => (
  isFanViewer.value ? getCreatorUserId(event) : getFanUserId(event)
);

const shouldShowSingleProfile = (event = {}) => !event.isGroup || isFanViewer.value;

const profileKeyForEvent = (event = {}) => {
  if (!shouldShowSingleProfile(event)) return "";
  const userId = getGuestUserId(event);
  return userId === undefined || userId === null || userId === "" ? "" : String(userId);
};

const fallbackProfileForEvent = (event = {}) => {
  const raw = getRawEvent(event);
  const fallbackId = getGuestUserId(event);
  const existingAvatar = Array.isArray(event?.avatars) ? event.avatars[0] : null;

  if (isFanViewer.value) {
    return {
      name: pickFirstString(
        raw.creatorDisplayName,
        raw.creatorName,
        raw.creatorUsername,
        existingAvatar?.name,
      ) || (fallbackId ? t("calendar_event_user_id_fallback", { id: fallbackId }) : t("calendar_event_guest_fallback")),
      avatar: pickFirstString(raw.creatorAvatarUrl, raw.creatorAvatar, existingAvatar?.src) || DEFAULT_PROFILE_AVATAR,
    };
  }

  return {
    name: pickFirstString(
      raw.userDisplayName,
      raw.userName,
      raw.userUsername,
      fallbackId ? "" : existingAvatar?.name,
    ) || (fallbackId ? t("calendar_event_user_id_fallback", { id: fallbackId }) : t("calendar_event_guest_fallback")),
    avatar: pickFirstString(
      raw.userAvatarUrl,
      raw.userAvatar,
      raw.fanAvatarUrl,
      fallbackId ? "" : existingAvatar?.src,
    ) || DEFAULT_PROFILE_AVATAR,
  };
};

const displayProfile = (event = {}) => {
  const key = profileKeyForEvent(event);
  const state = key ? profileStateById[key] : null;
  const fallback = fallbackProfileForEvent(event);
  const profile = state?.profile || null;

  return {
    name: pickFirstString(profile?.displayName, profile?.username, fallback.name),
    avatar: pickFirstString(profile?.avatar, fallback.avatar) || DEFAULT_PROFILE_AVATAR,
  };
};

const isProfileLoading = (event = {}) => {
  const key = profileKeyForEvent(event);
  if (!key) return false;
  const state = profileStateById[key];
  return Boolean(state?.loading && !state?.profile);
};

const fetchProfile = async (userId) => {
  const key = String(userId || "");
  if (!key) return;
  const existing = profileStateById[key];
  if (existing?.loading || existing?.profile) return;

  if (!profileStateById[key]) {
    profileStateById[key] = { loading: false, profile: null, error: null };
  }

  const controller = new AbortController();
  profileAbortControllers.set(key, controller);
  profileStateById[key].loading = true;
  profileStateById[key].error = null;

  try {
    const response = await fetch(
      `${buildWpApiUrl("/users/get-profile-data")}?id=${encodeURIComponent(key)}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch event profile (HTTP ${response.status}).`);
    }

    const payload = await response.json();
    profileStateById[key].profile = normalizeGuestProfile(payload?.user);
  } catch (error) {
    if (error?.name !== "AbortError") {
      profileStateById[key].error = error;
    }
  } finally {
    if (profileAbortControllers.get(key) === controller) {
      profileAbortControllers.delete(key);
      profileStateById[key].loading = false;
    }
  }
};

const collectProfileIds = () => {
  const ids = new Set();
  (Array.isArray(props.sections) ? props.sections : []).forEach((section) => {
    (Array.isArray(section?.items) ? section.items : []).forEach((event) => {
      const key = profileKeyForEvent(event);
      if (key) ids.add(key);
    });
  });
  return [...ids];
};

watch(
  () => [props.sections, props.userRole],
  () => {
    menuComparisonTime.value = Date.now();
    if (openMenuId.value && !showOptionsMenu(eventForMenuId(openMenuId.value) || {})) {
      closeMenu();
    }
    scheduleMenuEligibilityTimer();
    collectProfileIds().forEach(fetchProfile);
  },
  { immediate: true, deep: true },
);

const handleDocumentClick = () => {
  closeMenu();
};

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
  if (menuEligibilityTimer) clearTimeout(menuEligibilityTimer);
  profileAbortControllers.forEach((controller) => controller.abort());
  profileAbortControllers.clear();
});
</script>

<style scoped>
@keyframes blink-border {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(7, 244, 104, 0);
  }
  50% {
    box-shadow: 0 0 0 5px rgba(7, 244, 104, 0.25);
  }
}
.blink-border-effect {
  animation: blink-border 1.5s ease-in-out infinite;
}

@keyframes blink-card-shadow {
  0%, 100% {
    box-shadow: 0 0 10px 0 #F06,
                0 4px 8px -2px rgba(255, 0, 102, 0.1),
                0 2px 4px -2px rgba(255, 0, 102, 0.06);
  }

  50% {
    box-shadow: 0 0 10px 0 transparent,
                0 4px 8px -2px transparent,
                0 2px 4px -2px transparent;
  }
}

.pending-blink-shadow {
  animation: blink-card-shadow 1.5s ease-in-out infinite;
}
</style>
