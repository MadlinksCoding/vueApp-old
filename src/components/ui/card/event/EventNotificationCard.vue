<template>
  <div
    v-if="isVisible && delayComplete"
    class="booking-notice-motion-shell"
    :class="[entranceClass, exitClass]"
  >
  <article
    class="booking-notice-card"
    :class="[attentionClass, variationClass, viewportMode ? `booking-notice-card--embedded-${viewportMode}` : '']"
    :data-notice-type="notice.type"
    tabindex="-1"
    @mouseenter="pauseTimer"
    @mouseleave="resumeTimer"
    @focusin="pauseTimer"
    @focusout="resumeTimer"
  >
    <button
      type="button"
      class="booking-notice-close"
      aria-label="Close notice"
      data-test="notice-close"
      @click="dismiss('close')"
    >
      <img :src="XCloseIcon" alt="" class="h-4 w-4 invert" />
    </button>

    <div v-if="showAccent" class="booking-notice-accent" :style="{ backgroundColor: appearance.accent }" />
    <div class="booking-notice-content min-w-0 flex-1" :class="{ 'booking-notice-content--summary': notice.type === noticeTypes.SUMMARY }">
      <template v-if="notice.type === noticeTypes.SUMMARY">
        <h3
          v-if="resolvedConfig.summary.showGreeting"
          class="px-6 text-center text-lg font-semibold text-[#344054]"
          data-test="summary-greeting"
        >
          {{ greeting }}
        </h3>

        <div v-if="summary.isEmpty" class="mt-4 text-sm text-[#667085]">{{ resolvedConfig.summary.emptyMessage }}</div>
        <div v-else class="mt-4 flex flex-col gap-4">
          <section v-for="section in summary.sections" :key="section.id" data-test="summary-section">
            <h4
              class="mb-1 flex items-center gap-2 text-sm font-semibold"
              :style="{ color: summarySectionPresentation(section).color }"
              :data-summary-section-variant="section.variant || section.type"
              data-test="summary-section-heading"
            >
              <img :src="summarySectionPresentation(section).icon" alt="" class="h-5 w-5 shrink-0" />
              <span>{{ summarySectionPresentation(section).heading }}</span>
            </h4>
            <EventNotificationItem
              v-for="item in section.items"
              :key="item.id"
              :item="item"
              :variant="section.type"
              :ready-label="readyLabelForItem(item)"
              :show-detail="showPerItemDetail && section.type !== noticeTypes.READY_TO_JOIN"
              :show-join="section.type === noticeTypes.READY_TO_JOIN"
              :attention-animation="resolvedConfig.attentionAnimation"
              @detail="emitDetail"
              @join="performItemJoin"
            />
          </section>
        </div>

        <button
          v-if="summary.overflowText"
          type="button"
          class="booking-notice-overflow"
          :aria-label="overflowAriaLabel(summary.hiddenCount)"
          data-test="summary-overflow"
          @click="showMore"
        >
          {{ summary.overflowText }}
        </button>
      </template>

      <template v-else>
        <header class="flex items-start gap-2 pr-6">
          <img :src="appearance.icon" alt="" class="h-5 w-5 shrink-0" />
          <h3 class="text-sm font-semibold leading-5" :style="{ color: appearance.headingColor }">{{ heading }}</h3>
        </header>
        <div class="booking-notice-items-region">
          <div class="mt-3 flex flex-col gap-2">
            <EventNotificationItem
              v-for="item in visibleItems"
              :key="item.id"
              :item="item"
              :variant="notice.type"
              :ready-label="readyLabelForItem(item)"
              :show-detail="showPerItemDetail"
              :show-accent="isGroupedBookingRequest"
              @detail="emitDetail"
            />
          </div>
          <button
            v-if="resolvedConfig.summary.showOverflow && standaloneHiddenCount > 0"
            type="button"
            class="booking-notice-overflow"
            :aria-label="overflowAriaLabel(standaloneHiddenCount)"
            data-test="notice-overflow"
            @click="showMore"
          >
            {{ formatOverflow(standaloneHiddenCount) }}
          </button>
        </div>
      </template>

      <button
        v-if="effectiveAction"
        type="button"
        class="booking-notice-action"
        :class="actionClass"
        data-test="notice-primary-action"
        @click="performPrimaryAction"
      >
        <span v-if="showActionIcon" class="booking-notice-action-icon" aria-hidden="true">
          <img :src="actionIcon" alt="" />
          <span v-if="isBookingRequestReviewAction" class="booking-notice-action-dot" />
        </span>
        {{ effectiveAction.label }}
        <img v-if="effectiveAction.showArrow" :src="WhiteArrowUpRightIcon" alt="" class="booking-notice-action-arrow" />
      </button>
    </div>
  </article>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import AlarmGreenIcon from "@/assets/images/icons/alarm-green.svg";
import CalendarCrossIcon from "@/assets/images/icons/calendar-cross.svg";
import CalendarGreenCheckIcon from "@/assets/images/icons/calendar-check-green.svg";
import CalendarPinkIcon from "@/assets/images/icons/calendar-icon-pink.svg";
import FilePinkIcon from "@/assets/images/icons/file-search-pink.svg";
import FileSearchIcon from "@/assets/images/icons/file-search-02.svg";
import IncomingCallIcon from "@/assets/images/icons/phone-incoming-02.svg";
import WhiteArrowUpRightIcon from "@/assets/images/icons/arrow-up-right-white.svg";
import XCloseIcon from "@/assets/images/icons/x-close-white.svg";
import EventNotificationItem from "./EventNotificationItem.vue";
import { BOOKING_NOTICE_TYPES, formatNoticeTemplate, resolveBookingNoticeConfig } from "./bookingNoticeConfig";
import { buildBookingNoticeSummary, getSummaryDismissedItemIds } from "./bookingNoticeSummary";

const props = defineProps({
  notice: { type: Object, required: true },
  config: { type: Object, default: () => ({}) },
  additionalVisibleItems: { type: Number, default: 0 },
  viewportMode: { type: String, default: "" },
});

const emit = defineEmits(["close", "primary-action", "detail", "join", "show-more"]);
const noticeTypes = BOOKING_NOTICE_TYPES;
const isVisible = ref(true);
const isClosing = ref(false);
const configuredInitialDelay = props.notice.initialDelaySeconds
  ?? props.config.initialDelaySeconds
  ?? (props.notice.type === BOOKING_NOTICE_TYPES.SUMMARY ? props.config.summary?.initialDelaySeconds : 0)
  ?? 0;
const delayComplete = ref(Number(configuredInitialDelay) <= 0);
const resolvedConfig = computed(() => resolveBookingNoticeConfig(props.notice.type, props.config));
const summary = computed(() => buildBookingNoticeSummary(
  props.notice.sections || [],
  resolvedConfig.value.summary,
  { additionalVisibleItems: props.additionalVisibleItems },
));
const visibleItems = computed(() => {
  const initialLimit = Number(props.notice.itemLimit ?? resolvedConfig.value.summary.perSectionLimit) || 0;
  return (props.notice.items || []).slice(0, Math.max(0, initialLimit + props.additionalVisibleItems));
});
const standaloneHiddenCount = computed(() => Math.max(0, (props.notice.totalCount ?? props.notice.items?.length ?? 0) - visibleItems.value.length));
const viewerRole = computed(() => String(props.notice.audience || props.notice.viewer?.role || "").toLowerCase());
const isFan = computed(() => viewerRole.value === "fan");
const completeItemCount = computed(() => {
  if (props.notice.type === BOOKING_NOTICE_TYPES.SUMMARY) return summary.value.totalCount;
  return Math.max(0, Number(props.notice.totalCount ?? props.notice.items?.length ?? 0) || 0);
});
const hasMultipleItems = computed(() => completeItemCount.value > 1);
const firstVisibleItem = computed(() => {
  if (props.notice.type !== BOOKING_NOTICE_TYPES.SUMMARY) return visibleItems.value[0] || null;
  for (const section of summary.value.sections || []) {
    if (section.items?.length) return section.items[0];
  }
  return null;
});
const isSingleBookingRequest = computed(() => props.notice.type === BOOKING_NOTICE_TYPES.BOOKING_REQUEST
  && (props.notice.items?.length || 0) === 1
  && (props.notice.totalCount ?? 1) === 1);
const isGroupedBookingRequest = computed(() => props.notice.type === BOOKING_NOTICE_TYPES.BOOKING_REQUEST
  && !isSingleBookingRequest.value);
const isReadyToJoin = computed(() => props.notice.type === BOOKING_NOTICE_TYPES.READY_TO_JOIN);
const countdownNowMs = ref(Date.now());
const readyItems = computed(() => {
  if (isReadyToJoin.value) return visibleItems.value;
  if (props.notice.type !== BOOKING_NOTICE_TYPES.SUMMARY) return [];
  return (summary.value.sections || [])
    .filter((section) => section.type === BOOKING_NOTICE_TYPES.READY_TO_JOIN)
    .flatMap((section) => section.items || []);
});
const hasReadyCountdown = computed(() => readyItems.value.length > 0);
const readyCountdown = (item) => {
  const configuredMinutes = Math.max(0, Number(resolvedConfig.value.readyToJoinLeadMinutes) || 0);
  const startMs = new Date(item?.eventAt || item?.startIso || "").getTime();
  if (!Number.isFinite(startMs)) return { isLive: false, minutes: configuredMinutes };
  const remainingMs = startMs - countdownNowMs.value;
  if (remainingMs < 60_000) return { isLive: true, minutes: 0 };
  return { isLive: false, minutes: Math.ceil(remainingMs / 60_000) };
};
const readyLabelForItem = (item) => {
  const countdown = readyCountdown(item);
  return countdown.isLive ? "live now" : `in ${countdown.minutes} min`;
};
const standaloneReadyCountdown = computed(() => readyCountdown(visibleItems.value[0]));
const isStandaloneFanBookingResult = computed(() => isFan.value
  && completeItemCount.value === 1
  && [BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED, BOOKING_NOTICE_TYPES.BOOKING_DECLINED].includes(props.notice.type));
const isReviewAction = (action) => String(action?.id || "").startsWith("review")
  || String(action?.label || "").toUpperCase().includes("REVIEW");
const isBookingRequestReviewAction = computed(() => props.notice.type === BOOKING_NOTICE_TYPES.BOOKING_REQUEST
  && isReviewAction(effectiveAction.value));
const effectiveAction = computed(() => {
  if (!isFan.value || isReadyToJoin.value) return props.notice.action || null;
  if (isStandaloneFanBookingResult.value) return null;
  if (completeItemCount.value !== 1) return isReviewAction(props.notice.action) ? null : props.notice.action || null;

  const item = firstVisibleItem.value;
  if (!item) return null;
  const existing = props.notice.action || {};
  const isPriceAdjustmentRequest = props.notice.priceAdjustmentState === "request-sent"
    || item.activityType === "price-adjustment-sent";
  return {
    ...existing,
    id: props.notice.type === BOOKING_NOTICE_TYPES.SUMMARY ? "review-summary" : existing.id || "review-booking-details",
    label: isPriceAdjustmentRequest ? "REVIEW ADJUSTMENT" : "REVIEW",
    showArrow: false,
    bookingId: existing.bookingId || item.bookingId,
    testMode: existing.testMode ?? props.notice.testMode ?? item.testMode,
  };
});
const showPerItemDetail = computed(() => {
  if (isReadyToJoin.value) return false;
  if (isStandaloneFanBookingResult.value) return true;
  if (hasMultipleItems.value) return true;
  if (isFan.value) return false;
  return props.notice.showDetail === true;
});
const showAccent = computed(() => props.notice.type !== BOOKING_NOTICE_TYPES.SUMMARY
  && !(props.notice.type === BOOKING_NOTICE_TYPES.BOOKING_REQUEST && !isSingleBookingRequest.value));
const variationClass = computed(() => ({
  "booking-notice-card--single-request": isSingleBookingRequest.value,
  "booking-notice-card--grouped-request": isGroupedBookingRequest.value,
  "booking-notice-card--summary": props.notice.type === BOOKING_NOTICE_TYPES.SUMMARY,
  "booking-notice-card--ready": isReadyToJoin.value,
}));
const actionClass = computed(() => ({
  "booking-notice-action--outline": isBookingRequestReviewAction.value,
  "booking-notice-action--ready": isReadyToJoin.value,
  "booking-notice-action--pink": !isBookingRequestReviewAction.value && !isReadyToJoin.value,
  "booking-notice-action--pulse": isReadyToJoin.value && resolvedConfig.value.attentionAnimation === "pulse",
  "booking-notice-action--blink": isReadyToJoin.value && resolvedConfig.value.attentionAnimation === "blink",
}));
const actionIcon = computed(() => isReadyToJoin.value ? IncomingCallIcon : FileSearchIcon);
const showActionIcon = computed(() => isReadyToJoin.value
  || isBookingRequestReviewAction.value
  || props.notice.type === BOOKING_NOTICE_TYPES.PRICE_ADJUSTMENT);

const heading = computed(() => {
  if (props.notice.type === noticeTypes.READY_TO_JOIN) {
    if (standaloneReadyCountdown.value.isLive) return "Event is live now:";
    const minutes = standaloneReadyCountdown.value.minutes;
    return `Event starts in ${minutes} ${minutes === 1 ? "minute" : "minutes"}:`;
  }
  if (props.notice.heading) return props.notice.heading;
  const name = props.notice.actor?.displayName || "Someone";
  if (props.notice.type === noticeTypes.BOOKING_REQUEST) return "New event booking received:";
  if (props.notice.type === noticeTypes.BOOKING_CONFIRMED) return `${name} has confirmed your booking:`;
  if (props.notice.type === noticeTypes.BOOKING_DECLINED) return `${name} has declined your booking request:`;
  if (props.notice.priceAdjustmentState === "accepted") return `${name} has accepted your price adjustment:`;
  if (props.notice.priceAdjustmentState === "declined") return `${name} has declined your price adjustment:`;
  return `${name} sent you a price adjustment request:`;
});

const appearance = computed(() => {
  if (props.notice.type === noticeTypes.READY_TO_JOIN) return { icon: AlarmGreenIcon, accent: "#FDB022", headingColor: "#107569" };
  if (props.notice.type === noticeTypes.BOOKING_DECLINED || props.notice.priceAdjustmentState === "declined") {
    return { icon: CalendarCrossIcon, accent: "#FDB022", headingColor: "#FF4405" };
  }
  if (props.notice.type === noticeTypes.BOOKING_CONFIRMED || props.notice.priceAdjustmentState === "accepted") {
    return { icon: CalendarGreenCheckIcon, accent: "#FDB022", headingColor: "#107569" };
  }
  return { icon: CalendarPinkIcon, accent: "#F06", headingColor: "#F06" };
});

const greeting = computed(() => formatNoticeTemplate(resolvedConfig.value.summary.greetingTemplate, {
  displayName: props.notice.viewer?.displayName || "there",
}));

const attentionClass = computed(() => `booking-notice-attention-${resolvedConfig.value.attentionAnimation}`);
const entranceClass = computed(() => `booking-notice-enter-${resolvedConfig.value.entranceEffect}`);
const exitClass = computed(() => isClosing.value ? `booking-notice-exit-${resolvedConfig.value.exitEffect}` : "");
const countedNoun = (count, singular, plural = `${singular}s`) => Number(count) === 1 ? singular : plural;
const priceAdjustmentVariant = (section) => {
  const raw = section.variant || section.items?.[0]?.activityType || "";
  if (raw === "sent" || raw === "request-sent" || raw === "price-adjustment-sent") return "request-sent";
  if (raw === "accepted" || raw === "price-adjustment-accepted") return "accepted";
  if (raw === "declined" || raw === "price-adjustment-declined") return "declined";
  return "request-sent";
};
const summarySectionPresentation = (section) => {
  const count = Number(section.totalCount) || 0;
  if (section.type === noticeTypes.READY_TO_JOIN) {
    const minutes = Number(resolvedConfig.value.readyToJoinLeadMinutes) || 0;
    return {
      icon: AlarmGreenIcon,
      color: "#107569",
      heading: `You have ${count} ${countedNoun(count, "event")} starting in ${minutes} ${countedNoun(minutes, "minute")}:`,
    };
  }
  if (section.type === noticeTypes.EVENTS_TODAY) {
    return {
      icon: CalendarGreenCheckIcon,
      color: "#107569",
      heading: `You have ${count} ${countedNoun(count, "event")} today:`,
    };
  }
  if (section.type === noticeTypes.BOOKING_REQUEST) {
    return { icon: CalendarPinkIcon, color: "#F06", heading: `You have ${count} new pending ${countedNoun(count, "booking")}:` };
  }
  if (section.type === noticeTypes.BOOKING_CONFIRMED) {
    return { icon: CalendarGreenCheckIcon, color: "#107569", heading: `You have ${count} confirmed ${countedNoun(count, "booking")}:` };
  }
  if (section.type === noticeTypes.BOOKING_DECLINED) {
    return { icon: CalendarCrossIcon, color: "#FF4405", heading: `You have ${count} declined ${countedNoun(count, "booking request")}:` };
  }
  if (section.type === noticeTypes.PRICE_ADJUSTMENT) {
    const variant = priceAdjustmentVariant(section);
    if (variant === "accepted") {
      return { icon: CalendarGreenCheckIcon, color: "#107569", heading: `You have ${count} accepted ${countedNoun(count, "price adjustment")}:` };
    }
    if (variant === "declined") {
      return { icon: CalendarCrossIcon, color: "#FF4405", heading: `You have ${count} declined ${countedNoun(count, "price adjustment")}:` };
    }
    return { icon: FilePinkIcon, color: "#F06", heading: `You have ${count} new ${countedNoun(count, "price adjustment request")}:` };
  }
  return { icon: CalendarPinkIcon, color: "#F06", heading: `You have ${count} booking ${countedNoun(count, "update")}:` };
};
const formatOverflow = (count) => formatNoticeTemplate(resolvedConfig.value.summary.overflowTemplate, { count });
const overflowAriaLabel = (count) => `Show up to 10 more booking items. ${count} remaining.`;
const dismissedItemIds = () => {
  if (props.notice.type === noticeTypes.SUMMARY) return getSummaryDismissedItemIds(summary.value);
  return Array.isArray(props.notice.dismissItemIds) ? props.notice.dismissItemIds.slice() : [];
};

let timerId;
let exitTimerId;
let delayTimerId;
let countdownTimerId;
let componentMounted = false;
let startedAt = 0;
let remainingMs = 0;

function stopCountdownClock() {
  if (countdownTimerId) window.clearInterval(countdownTimerId);
  countdownTimerId = undefined;
}

function syncCountdownClock() {
  stopCountdownClock();
  countdownNowMs.value = Date.now();
  if (!componentMounted || !hasReadyCountdown.value || document.visibilityState === "hidden") return;
  countdownTimerId = window.setInterval(() => {
    countdownNowMs.value = Date.now();
  }, 1_000);
}

function handleCountdownVisibilityChange() {
  syncCountdownClock();
}

watch(hasReadyCountdown, () => syncCountdownClock());

function clearTimer() {
  if (timerId) window.clearTimeout(timerId);
  timerId = undefined;
}

function finishClosing() {
  isVisible.value = false;
  isClosing.value = false;
}

function runExitEffect() {
  if (resolvedConfig.value.exitEffect === "none") {
    finishClosing();
    return;
  }
  isClosing.value = true;
  exitTimerId = window.setTimeout(finishClosing, 180);
}

function startTimer() {
  clearTimer();
  if (remainingMs <= 0) return;
  startedAt = Date.now();
  timerId = window.setTimeout(() => dismiss("automatic"), remainingMs);
}

function pauseTimer() {
  if (!timerId) return;
  remainingMs = Math.max(0, remainingMs - (Date.now() - startedAt));
  clearTimer();
}

function resumeTimer() {
  if (!timerId && remainingMs > 0) startTimer();
}

function dismiss(reason) {
  if (isClosing.value || !isVisible.value) return;
  clearTimer();
  emit("close", { noticeId: props.notice.id, reason, dismissedItemIds: dismissedItemIds() });
  runExitEffect();
}

function performPrimaryAction() {
  if (isClosing.value || !isVisible.value) return;
  const payload = { noticeId: props.notice.id, action: effectiveAction.value, dismissedItemIds: dismissedItemIds() };
  emit("primary-action", payload);
  if (props.notice.type === noticeTypes.READY_TO_JOIN) emit("join", payload);
  clearTimer();
  runExitEffect();
}

function emitDetail(item) {
  emit("detail", { noticeId: props.notice.id, item });
}

function showMore() {
  emit("show-more", { noticeId: props.notice.id, increment: 10 });
}

function performItemJoin(item) {
  if (isClosing.value || !isVisible.value || !item) return;
  const payload = {
    noticeId: item.id || props.notice.id,
    parentNoticeId: props.notice.id,
    item,
    action: {
      id: "join-call",
      label: "JOIN CALL",
      bookingId: item.bookingId,
      url: item.joinUrl,
      testMode: item.testMode ?? props.notice.testMode,
    },
    dismissedItemIds: [],
  };
  emit("primary-action", payload);
  emit("join", payload);
}

onMounted(() => {
  componentMounted = true;
  document.addEventListener("visibilitychange", handleCountdownVisibilityChange);
  syncCountdownClock();
  const delaySeconds = props.notice.initialDelaySeconds
    ?? resolvedConfig.value.initialDelaySeconds
    ?? (props.notice.type === noticeTypes.SUMMARY ? resolvedConfig.value.summary.initialDelaySeconds : 0);
  const reveal = () => {
    delayComplete.value = true;
    remainingMs = Math.max(0, Number(resolvedConfig.value.durationSeconds) || 0) * 1000;
    startTimer();
  };
  if (Number(delaySeconds) > 0) delayTimerId = window.setTimeout(reveal, Number(delaySeconds) * 1000);
  else reveal();
});

onBeforeUnmount(() => {
  componentMounted = false;
  document.removeEventListener("visibilitychange", handleCountdownVisibilityChange);
  stopCountdownClock();
  clearTimer();
  if (delayTimerId) window.clearTimeout(delayTimerId);
  if (exitTimerId) window.clearTimeout(exitTimerId);
});
</script>

<style scoped>
.booking-notice-motion-shell { width: 100%; max-width: 23rem; }
.booking-notice-card { position: relative; display: flex; width: 100%; max-width: 23rem; min-height: 5rem; gap: .375rem; overflow: visible; border-radius: .625rem; background: rgba(255, 252, 248, .98); padding: .75rem; box-shadow: 0 0 12px rgba(255, 0, 102, .25); }
.booking-notice-close { position: absolute; right: -.5rem; top: -.5rem; z-index: 2; display: flex; height: 1.5rem; width: 1.5rem; align-items: center; justify-content: center; border-radius: 999px; background: #eaecf0; box-shadow: 0 0 4px rgba(0, 0, 0, .25); }
.booking-notice-accent { width: .25rem; flex-shrink: 0; align-self: stretch; border-radius: .625rem; }
.booking-notice-card--single-request .booking-notice-accent { background: white !important; }
.booking-notice-content { display: flex; flex-direction: column; gap: 0; }
.booking-notice-content--summary { max-height: calc(var(--fs-booking-notices-max-height, 640px) - 4rem); overflow-y: auto; overscroll-behavior: contain; }
.booking-notice-items-region { max-height: calc(var(--fs-booking-notices-max-height, 640px) - 8rem); overflow-y: auto; overscroll-behavior: contain; }
.booking-notice-overflow { margin-top: .5rem; width: fit-content; border-radius: .25rem; color: #667085; font-size: .875rem; font-weight: 500; line-height: 1.25rem; text-align: left; text-decoration: underline; text-underline-offset: .15rem; cursor: pointer; }
.booking-notice-overflow:hover { color: #344054; }
.booking-notice-overflow:focus-visible { outline: 2px solid #f06; outline-offset: 2px; }
.booking-notice-action { margin-top: .75rem; display: flex; min-height: 2.25rem; width: 100%; align-items: center; justify-content: center; gap: .5rem; border-radius: .25rem; padding: .25rem .5rem; font-size: 1rem; font-weight: 500; line-height: 1.5rem; }
.booking-notice-action--pink { background: #f06; color: white; }
.booking-notice-action--outline { border: 1px solid #ff4405; background: white; color: #ff4405; }
.booking-notice-action--ready { background: #07f468; color: #0c111d; }
.booking-notice-action-icon { position: relative; display: inline-flex; height: 1.25rem; width: 1.25rem; flex: 0 0 1.25rem; align-items: center; justify-content: center; }
.booking-notice-action-icon img, .booking-notice-action-arrow { height: 1.25rem; width: 1.25rem; }
.booking-notice-action--pink .booking-notice-action-icon img { filter: brightness(0) invert(1); }
.booking-notice-action--outline .booking-notice-action-icon img { filter: brightness(0) saturate(100%) invert(33%) sepia(99%) saturate(3380%) hue-rotate(1deg) brightness(102%) contrast(105%); }
.booking-notice-action--ready .booking-notice-action-icon img { filter: brightness(0); }
.booking-notice-action-dot { position: absolute; right: -.0625rem; top: -.125rem; height: .4375rem; width: .4375rem; border-radius: 999px; background: #ff4405; }
.booking-notice-attention-none { animation: none; box-shadow: 0 0 12px rgba(255, 0, 102, .25); }
.booking-notice-attention-pulse { animation: booking-notice-pulse 1.5s ease-in-out infinite; }
.booking-notice-attention-blink { animation: booking-notice-blink 1.1s step-end infinite; }
.booking-notice-action--pulse { animation: booking-notice-green-pulse 1.5s ease-in-out infinite; }
.booking-notice-action--blink { animation: booking-notice-green-blink 1.1s step-end infinite; }
.booking-notice-enter-none, .booking-notice-exit-none { animation: none; }
.booking-notice-enter-fade { animation: booking-notice-fade .2s ease-out; }
.booking-notice-enter-slide { animation: booking-notice-slide .2s ease-out; }
.booking-notice-exit-fade { animation: booking-notice-fade-out .18s ease-in forwards; }
.booking-notice-exit-slide { animation: booking-notice-slide-out .18s ease-in forwards; }
@keyframes booking-notice-pulse { 0%, 100% { box-shadow: 0 0 12px rgba(255, 0, 102, .25); } 50% { box-shadow: 0 0 18px rgba(255, 0, 102, .4); } }
@keyframes booking-notice-blink { 0%, 100% { box-shadow: 0 0 12px rgba(255, 0, 102, .25); } 50% { box-shadow: 0 0 20px rgba(255, 0, 102, .55); } }
@keyframes booking-notice-green-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(7, 244, 104, 0); } 50% { box-shadow: 0 0 0 5px rgba(7, 244, 104, .25); } }
@keyframes booking-notice-green-blink { 0%, 100% { box-shadow: 0 0 0 0 rgba(7, 244, 104, 0); } 50% { box-shadow: 0 0 0 5px rgba(7, 244, 104, .35); } }
@keyframes booking-notice-fade { from { opacity: 0; } }
@keyframes booking-notice-slide { from { opacity: 0; transform: translateY(-.75rem); } }
@keyframes booking-notice-fade-out { to { opacity: 0; } }
@keyframes booking-notice-slide-out { to { opacity: 0; transform: translateY(-.75rem); } }
@media (max-width: 639px) {
  .booking-notice-motion-shell, .booking-notice-card { max-width: none; }
  .booking-notice-card { border-radius: 0; }
  .booking-notice-card--summary { border-radius: .625rem; }
  .booking-notice-close { right: .5rem; top: .5rem; background: transparent; box-shadow: none; }
  .booking-notice-content--summary { max-height: calc(var(--fs-booking-notices-max-height, 640px) - 3rem); }
  .booking-notice-items-region { max-height: calc(var(--fs-booking-notices-max-height, 640px) - 7rem); }
}
.booking-notice-card.booking-notice-card--embedded-desktop { max-width: 23rem; border-radius: .625rem; }
.booking-notice-card--embedded-desktop .booking-notice-close { right: -.5rem; top: -.5rem; background: #eaecf0; box-shadow: 0 0 4px rgba(0, 0, 0, .25); }
.booking-notice-card.booking-notice-card--embedded-mobile { max-width: none; border-radius: 0; }
.booking-notice-card.booking-notice-card--embedded-mobile.booking-notice-card--summary { border-radius: .625rem; }
.booking-notice-card--embedded-mobile .booking-notice-close { right: .5rem; top: .5rem; background: transparent; box-shadow: none; }
@media (prefers-reduced-motion: reduce) {
  .booking-notice-card, .booking-notice-motion-shell, .booking-notice-action { animation: none !important; }
  .booking-notice-card { box-shadow: 0 0 12px rgba(255, 0, 102, .25); }
}
</style>
