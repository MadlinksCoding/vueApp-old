<template>
  <div
    class="booking-notice-stack"
    :class="[stackDirection, viewportMode ? `booking-notice-stack--${viewportMode}` : '']"
    aria-live="polite"
  >
    <EventNotificationCard
      v-for="notice in visibleNotices"
      :key="notice.id"
      :notice="notice"
      :config="configForNotice(notice)"
      :additional-visible-items="additionalVisibleItems(notice.id)"
      :viewport-mode="viewportMode"
      class="pointer-events-auto"
      @close="forwardDismiss('close', $event)"
      @primary-action="forwardDismiss('primary-action', $event)"
      @detail="$emit('detail', $event)"
      @join="forwardDismiss('join', $event)"
      @show-more="expandNotice"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import EventNotificationCard from "./EventNotificationCard.vue";
import { BOOKING_NOTICE_TYPES, resolveBookingNoticeConfig } from "./bookingNoticeConfig";
import { buildBookingNoticeSummary, shouldShowStandaloneNotice } from "./bookingNoticeSummary";

const props = defineProps({
  notices: { type: Array, default: () => [] },
  config: { type: Object, default: () => ({}) },
  position: { type: String, default: "top-right" },
  viewportMode: { type: String, default: "" },
});

const emit = defineEmits(["close", "primary-action", "detail", "join", "summary-visibility"]);

const locallyDismissedIds = ref(new Set());
const expandedItemsByNoticeId = ref(new Map());
const localDismissTimers = new Map();

function configForNotice(notice) {
  const override = notice?.config && typeof notice.config === "object" ? notice.config : {};
  return {
    ...props.config,
    ...override,
    summary: {
      ...(props.config.summary || {}),
      ...(override.summary || {}),
    },
    noticeTypes: {
      ...(props.config.noticeTypes || {}),
      ...(override.noticeTypes || {}),
    },
  };
}

function additionalVisibleItems(noticeId) {
  return expandedItemsByNoticeId.value.get(noticeId) || 0;
}

function expandNotice(payload = {}) {
  if (!payload.noticeId) return;
  const increment = Math.max(1, Math.floor(Number(payload.increment) || 10));
  const next = new Map(expandedItemsByNoticeId.value);
  next.set(payload.noticeId, (next.get(payload.noticeId) || 0) + increment);
  expandedItemsByNoticeId.value = next;
}

function clearExpansion(noticeId) {
  if (!noticeId || !expandedItemsByNoticeId.value.has(noticeId)) return;
  const next = new Map(expandedItemsByNoticeId.value);
  next.delete(noticeId);
  expandedItemsByNoticeId.value = next;
}

function hideLocally(id) {
  if (!id) return;
  const next = new Set(locallyDismissedIds.value);
  next.add(id);
  locallyDismissedIds.value = next;
  if (localDismissTimers.has(id)) window.clearTimeout(localDismissTimers.get(id));
  localDismissTimers.set(id, window.setTimeout(() => {
    const current = new Set(locallyDismissedIds.value);
    current.delete(id);
    locallyDismissedIds.value = current;
    localDismissTimers.delete(id);
  }, 30000));
}

function forwardDismiss(eventName, payload = {}) {
  clearExpansion(payload.noticeId);
  hideLocally(payload.noticeId);
  (payload.dismissedItemIds || []).forEach(hideLocally);
  emit(eventName, payload);
}

onBeforeUnmount(() => {
  localDismissTimers.forEach((timer) => window.clearTimeout(timer));
  localDismissTimers.clear();
});

const resolvedConfig = computed(() => resolveBookingNoticeConfig(BOOKING_NOTICE_TYPES.SUMMARY, props.config));
const summaryNotice = computed(() => props.notices.find((notice) => notice.type === BOOKING_NOTICE_TYPES.SUMMARY
  && !locallyDismissedIds.value.has(notice.id)));
const resolvedSummaryConfig = computed(() => summaryNotice.value
  ? resolveBookingNoticeConfig(BOOKING_NOTICE_TYPES.SUMMARY, configForNotice(summaryNotice.value))
  : resolvedConfig.value);
const activeSummary = computed(() => summaryNotice.value
  ? buildBookingNoticeSummary(summaryNotice.value.sections || [], resolvedSummaryConfig.value.summary, {
    additionalVisibleItems: additionalVisibleItems(summaryNotice.value.id),
  })
  : null);

watch(activeSummary, (summary) => {
  if (!summaryNotice.value || !summary) return;
  emit("summary-visibility", {
    noticeId: summaryNotice.value.id,
    isOpen: true,
    allItemIds: summary.allItemIds,
    visibleItemIds: summary.visibleItemIds,
    hiddenItemIds: summary.hiddenItemIds,
  });
}, { immediate: true, deep: true });

const visibleNotices = computed(() => props.notices
  .filter((notice) => !locallyDismissedIds.value.has(notice.id))
  .filter((notice) => notice.enabled !== false && resolveBookingNoticeConfig(notice.type, configForNotice(notice)).enabled !== false)
  .filter((notice) => notice.type === BOOKING_NOTICE_TYPES.SUMMARY
    || shouldShowStandaloneNotice(notice, activeSummary.value, Boolean(summaryNotice.value)))
  .slice(0, resolvedConfig.value.maxVisibleNotices));

const stackDirection = computed(() => props.position.startsWith("bottom") || props.position === "bottom"
  ? "flex-col-reverse"
  : "flex-col");
</script>

<style scoped>
.booking-notice-stack { box-sizing: border-box; pointer-events: none; display: flex; width: min(25.5rem, 100vw); gap: .75rem; overflow: visible; padding: 1.25rem; }
@media (max-width: 639px) { .booking-notice-stack { width: 100vw; padding: 0; gap: .375rem; } }
.booking-notice-stack--desktop { width: min(25.5rem, 100vw); padding: 1.25rem; gap: .75rem; }
.booking-notice-stack--mobile { width: 100vw; padding: 0; gap: .375rem; }
</style>
