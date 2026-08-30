<template>
  <main
    class="h-full min-h-0 bg-transparent"
    data-test="events-embed-booking-details-page"
  >
    <div v-if="loading" class="flex h-full items-center justify-center p-6" data-test="booking-details-loading">
      <div class="flex flex-col items-center gap-3 text-center text-sm font-medium text-gray-600">
        <div class="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-[#5549FF]" />
        <span>{{ t("common_loading") }}</span>
      </div>
    </div>

    <div v-else-if="errorMessage || !calendarEvent" class="flex h-full items-center justify-center p-6" data-test="booking-details-error">
      <div class="max-w-sm rounded-lg border border-red-200 bg-white p-5 text-center shadow-sm">
        <h1 class="text-base font-semibold text-gray-900">{{ t("dashboard_booking_action_failed_title") }}</h1>
        <p class="mt-2 text-sm text-gray-600">{{ errorMessage || t("common_try_again") }}</p>
        <div class="mt-4 flex justify-center gap-2">
          <button type="button" class="rounded bg-[#5549FF] px-4 py-2 text-sm font-semibold text-white" @click="loadBooking">
            {{ t("common_try_again") }}
          </button>
          <button type="button" class="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700" @click="closePanel">
            {{ t("common_close") }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-else-if="!isDirectCancelLaunch"
      class="booking-details-fan-surface h-full min-h-0"
      data-test="booking-details-fan-surface"
    >
      <BookingDetailsPopup
        v-if="useCompactMobileDetails"
        v-model="compactDetailsOpen"
        :booking="booking"
        :event="calendarEvent"
        :user-role="viewerRole"
        :can-review-pending="true"
        :action-loading="actionLoading"
        :refreshing="detailsRefreshing"
        :can-request-time-change="Boolean(bookingChatMessage)"
        layout-variant="compact"
        presentation="responsive-dialog"
        @join-call="handleJoin"
        @open-chat="openChat"
        @cancel-booking="requestCancelBooking"
        @accept-adjustment="acceptPriceAdjustment"
        @decline-adjustment="requestDeclineAdjustment"
        @approve-booking="approveBooking"
        @reject-booking="rejectBooking"
        @adjust-booking="openAdjustBooking"
        @accept-counter="acceptCounterOffer"
        @reject-counter="rejectCounterOffer"
        @ask-more-time="showMoreTimePopup = true"
        @ask-to-reschedule="showReschedulePopup = true"
        @decision-visibility="detailsDecisionOpen = $event"
        @close="closePanel"
      />
      <BookingDetailsPopup
        v-else
        :booking="booking"
        :event="calendarEvent"
        :user-role="viewerRole"
        :can-review-pending="viewerRole === 'creator'"
        :action-loading="actionLoading"
        :refreshing="detailsRefreshing"
        :booking-message="bookingChatMessage"
        :can-request-time-change="viewerRole === 'creator' && Boolean(bookingChatMessage)"
        presentation="side-panel"
        @join-call="handleJoin"
        @open-chat="openChat"
        @cancel-booking="requestCancelBooking"
        @accept-adjustment="acceptPriceAdjustment"
        @decline-adjustment="requestDeclineAdjustment"
        @approve-booking="approveBooking"
        @reject-booking="rejectBooking"
        @adjust-booking="openAdjustBooking"
        @accept-counter="acceptCounterOffer"
        @reject-counter="rejectCounterOffer"
        @ask-more-time="showMoreTimePopup = true"
        @ask-to-reschedule="showReschedulePopup = true"
        @decision-visibility="detailsDecisionOpen = $event"
        @close="closePanel"
      />
    </div>

    <AdjustBookingPopup
      v-if="showAdjustPopup && bookingChatMessage"
      :message="bookingChatMessage"
      :chat-id="bookingChatMessage.chat_id"
      @submitted="onAdjustSubmitted"
      @close="showAdjustPopup = false"
    />

    <MoreTimeRequestPopup
      v-if="showMoreTimePopup && bookingChatMessage"
      :message="bookingChatMessage"
      :booking="booking"
      :event="calendarEvent"
      :chat-id="bookingChatMessage.chat_id"
      :other-user-name="adjustmentDecisionState.fanUsername.value || t('common_fan')"
      @submitted="onTimeChangeSubmitted('more_time_request', $event)"
      @close="showMoreTimePopup = false"
    />

    <RescheduleRequestPopup
      v-if="showReschedulePopup && bookingChatMessage"
      :message="bookingChatMessage"
      :booking="booking"
      :event="calendarEvent"
      :chat-id="bookingChatMessage.chat_id"
      :other-user-name="adjustmentDecisionState.fanUsername.value || t('common_fan')"
      @submitted="onTimeChangeSubmitted('reschedule_request', $event)"
      @close="showReschedulePopup = false"
    />

    <BookingAdjustmentDecisionPopup
      v-bind="adjustmentDecisionPopupProps"
      @update:model-value="$event || resetAdjustmentDecision()"
      @confirm="confirmAdjustmentDecision"
      @retry-balance="adjustmentDecisionState.loadBalance"
      @retry-after-topup="resumePendingTopupAdjustment"
      @close="resetAdjustmentDecision"
    />

    <ToastHost />
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import BookingDetailsPopup from "@/components/ui/popup/BookingDetailsPopup.vue";
import BookingAdjustmentDecisionPopup from "@/components/ui/popup/BookingAdjustmentDecisionPopup.vue";
import AdjustBookingPopup from "@/components/ui/chat/AdjustBookingPopup.vue";
import MoreTimeRequestPopup from "@/components/ui/chat/MoreTimeRequestPopup.vue";
import RescheduleRequestPopup from "@/components/ui/chat/RescheduleRequestPopup.vue";
import ToastHost from "@/components/ui/toast/ToastHost.vue";
import FlowHandler from "@/services/flow-system/FlowHandler.js";
import { toCalendarEvent as bookingToCalendarEvent } from "@/services/bookings/utils/bookingCalendarEvent.js";
import { buildBookingChatMessage, resolveBookingChatMessage } from "@/services/bookings/utils/bookingChatMessage.js";
import { useEventsEmbedBootstrap } from "@/embeds/events/bootstrap.js";
import {
  notifyBookingDetailsReady,
  notifyBookingDetailsDecisionVisibility,
  notifyBookingDetailsUpdated,
  installBookingDetailsTopupListener,
  requestBookingDetailsTopup,
  requestBookingDetailsClose,
  requestEventsEmbedOpenUrl,
} from "@/embeds/events/bridge.js";
import { normalizeDashboardBookingRole } from "@/utils/dashboardRole.js";
import { resolveBookingRefundState } from "@/services/bookings/utils/bookingRefundUtils.js";
import { isPendingCounterOffer } from "@/services/bookings/utils/bookingNegotiationUtils.js";
import { getCalendarEventApprovalState } from "@/utils/bookingJoinUtils.js";
import { showToast } from "@/utils/toastBus.js";
import { requestFanTokenBalanceRefresh } from "@/utils/fanTokenBalanceRefresh.js";
import { useBookingTranslations } from "@/i18n/bookingTranslations.js";
import { useBookingActions } from "@/composables/useBookingActions.js";
import { useBookingChatSync } from "@/composables/useBookingChatSync.js";
import { useBookingAdjustmentDecision } from "@/composables/useBookingAdjustmentDecision.js";
import { resumePriceAdjustmentAfterTopup } from "@/utils/bookingTopupResume.js";

const bootstrap = useEventsEmbedBootstrap();
const { t } = useBookingTranslations();
const booking = ref(null);
const calendarEvent = ref(null);
const loading = ref(true);
const actionLoading = ref(false);
const errorMessage = ref("");
const pendingTopupAdjustment = ref(null);
const detailsDecisionOpen = ref(false);
const detailsRefreshing = ref(false);
const showAdjustPopup = ref(false);
const showMoreTimePopup = ref(false);
const showReschedulePopup = ref(false);
const compactDetailsOpen = ref(false);
const compactDetailsSession = ref(false);
// The chat request popups are message-driven. Start from the message rebuilt out of
// booking meta so the UI is never empty, then upgrade to the real one if a chat embed
// on the host page still has it — only that one carries `content.action`.
const bookingChatMessage = ref(null);
watch(booking, async (value) => {
  const fallback = buildBookingChatMessage(value);
  bookingChatMessage.value = fallback;
  if (!fallback) return;

  const resolved = await resolveBookingChatMessage(value);
  // Drop the answer if the panel moved on to another booking meanwhile.
  if (bookingChatMessage.value?.message_id === fallback.message_id) {
    bookingChatMessage.value = resolved;
  }
}, { immediate: true });
let removeTopupListener = null;
let topupResumeController = null;
const viewerRole = computed(() => normalizeDashboardBookingRole(bootstrap.userRole));
const isDirectCancelLaunch = computed(() => bootstrap.initialAction === "cancel");
const hostViewportWidth = computed(() => Number(bootstrap.hostViewportWidth));
const compactMobileDetailsEligible = computed(() => (
  !isDirectCancelLaunch.value
  && viewerRole.value === "creator"
  && Number.isFinite(hostViewportWidth.value)
  && hostViewportWidth.value > 0
  && hostViewportWidth.value < 768
  && getCalendarEventApprovalState(calendarEvent.value, { now: new Date() }).canReview
  && !isPendingCounterOffer(booking.value || calendarEvent.value)
));
const useCompactMobileDetails = computed(() => compactDetailsSession.value);
const directCancelOpened = ref(false);

function finiteNonNegative(value, fallback = 0) {
  if (value === "" || value == null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
}

function firstDefined(sources, keys) {
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    for (const key of keys) {
      if (source[key] !== undefined && source[key] !== null && source[key] !== "") return source[key];
    }
  }
  return null;
}

const adjustmentDecisionState = useBookingAdjustmentDecision(booking, {
  viewerRole,
  event: calendarEvent,
  processing: actionLoading,
  fanId: () => bootstrap.fanId,
});
const adjustmentDecisionOpen = adjustmentDecisionState.isOpen;
const adjustmentDecisionMode = adjustmentDecisionState.mode;
const adjustmentDecision = adjustmentDecisionState.decision;
const adjustmentDecisionPopupProps = adjustmentDecisionState.popupProps;

const bookingActions = useBookingActions({ flowOptions });
const { syncBookingToChat, broadcastBookingToChat } = useBookingChatSync({ flowOptions });

const anyDecisionOpen = computed(() => (
  adjustmentDecisionOpen.value
  || detailsDecisionOpen.value
  || showAdjustPopup.value
));

watch(anyDecisionOpen, (isOpen) => {
  notifyBookingDetailsDecisionVisibility(isOpen);
});

function toCalendarEvent(value) {
  return bookingToCalendarEvent(value, { titleFallback: t("calendar_event_untitled_booking") });
}

function flowOptions() {
  return {
    apiBaseUrl: bootstrap.apiBaseUrl || undefined,
    context: {
      apiBaseUrl: bootstrap.apiBaseUrl || undefined,
      creatorId: bootstrap.creatorId || undefined,
      fanId: bootstrap.fanId || undefined,
    },
  };
}

function buildBookingUpdateNotification(updatedItem = null, counterparty = null) {
  const sources = [
    updatedItem,
    updatedItem?.eventCurrent,
    updatedItem?.eventSnapshot,
    booking.value,
    booking.value?.eventCurrent,
    booking.value?.eventSnapshot,
    calendarEvent.value?.raw,
    calendarEvent.value,
    updatedItem?.creator,
    updatedItem?.creatorProfile,
    updatedItem?.eventCurrent?.creator,
    updatedItem?.eventSnapshot?.creator,
    booking.value?.creator,
    booking.value?.creatorProfile,
    booking.value?.eventCurrent?.creator,
    booking.value?.eventSnapshot?.creator,
  ].filter((source) => source && typeof source === "object");

  return {
    creatorUsername: String(firstDefined(sources, ["creatorUsername", "creatorUserName", "creatorHandle", "username"]) || adjustmentDecisionState.creatorUsername.value || "").trim(),
    creatorName: String(firstDefined(sources, ["creatorDisplayName", "creatorName", "displayName", "name"]) || adjustmentDecisionState.creatorName.value || "").trim(),
    creatorAvatarUrl: String(firstDefined(sources, [
      "creatorAvatar",
      "creatorAvatarUrl",
      "creatorAvatarURL",
      "creatorProfileImage",
      "creatorProfileImageUrl",
      "creatorProfileImageURL",
      "avatar",
      "avatarUrl",
      "avatarURL",
      "profileImage",
      "profileImageUrl",
    ]) || "").trim(),
    startAtIso: String(firstDefined(sources, ["startAtIso", "startIso", "startAt", "start"]) || "").trim(),
    endAtIso: String(firstDefined(sources, ["endAtIso", "endIso", "endAt", "end"]) || "").trim(),
    refundState: resolveBookingRefundState(updatedItem || {}),
    fanUsername: String(counterparty?.username || firstDefined(sources, ["fanUsername", "userUsername", "username"]) || "").trim(),
    fanAvatarUrl: String(counterparty?.avatarUrl || firstDefined(sources, [
      "fanAvatar",
      "fanAvatarUrl",
      "userAvatar",
      "userAvatarUrl",
      "avatar",
      "avatarUrl",
      "profileImage",
      "profileImageUrl",
    ]) || "").trim(),
  };
}

async function notifySuccessfulBookingUpdate(action, updatedItem = null, options = {}) {
  if (adjustmentDecisionOpen.value) {
    adjustmentDecisionOpen.value = false;
    await nextTick();
  }

  const bookingId = String(updatedItem?.bookingId || booking.value?.bookingId || bootstrap.bookingId || "").trim();
  if (viewerRole.value === "fan") {
    requestFanTokenBalanceRefresh({
      reason: "booking-details-update",
      action,
      bookingId,
    });
  }

  notifyBookingDetailsUpdated({
    bookingId,
    action,
    item: updatedItem,
    retainOpen: options.retainOpen === true,
    showReviewToast: options.showReviewToast === true,
    notification: buildBookingUpdateNotification(updatedItem, options.counterparty),
  });
}

function isCompleteBookingSnapshot(item) {
  if (!item || typeof item !== "object") return false;
  const status = String(item.status || item.bookingStatus || "").trim();
  const hasBookingDetails = Boolean(
    item.meta
    || item.eventSnapshot
    || item.event
    || item.startAtIso
    || item.startIso
    || item.startTime,
  );
  return Boolean(status && hasBookingDetails);
}

async function fetchBookingSnapshotOnce(bookingId) {
  if (!bookingId) return null;
  try {
    const response = await FlowHandler.run("bookings.fetchBooking", { bookingId }, flowOptions());
    return response?.ok && response.data?.item && typeof response.data.item === "object"
      ? response.data.item
      : null;
  } catch {
    return null;
  }
}

function applyRetainedBookingSnapshot(item) {
  if (!item || typeof item !== "object") return false;
  booking.value = item;
  calendarEvent.value = toCalendarEvent(item) || calendarEvent.value;
  if (compactDetailsSession.value) compactDetailsOpen.value = true;
  return true;
}

async function resolveRetainedBookingSnapshot(candidate, {
  bookingId,
  requireCounterOffer = false,
  creatorTerminal = false,
} = {}) {
  const original = booking.value && typeof booking.value === "object" ? booking.value : {};
  const authoritative = candidate && typeof candidate === "object" ? candidate : null;
  let fetched = null;
  const needsFetch = !authoritative
    || !isCompleteBookingSnapshot(authoritative)
    || (requireCounterOffer && !isPendingCounterOffer(authoritative));

  if (needsFetch && bookingId) {
    detailsRefreshing.value = true;
    try {
      fetched = await fetchBookingSnapshotOnce(bookingId);
    } finally {
      detailsRefreshing.value = false;
    }
  }

  const merged = {
    ...original,
    ...(fetched && typeof fetched === "object" ? fetched : {}),
    ...(authoritative && typeof authoritative === "object" ? authoritative : {}),
    bookingId: authoritative?.bookingId
      || authoritative?.booking_id
      || fetched?.bookingId
      || fetched?.booking_id
      || original?.bookingId
      || bookingId,
  };

  if (!creatorTerminal) return merged;
  const authoritativeStatus = String(authoritative?.status || authoritative?.bookingStatus || "").trim().toLowerCase();
  const terminalStatus = authoritativeStatus === "declined" || authoritativeStatus.startsWith("cancel")
    ? authoritativeStatus
    : "cancelled_creator";
  return {
    ...merged,
    status: terminalStatus,
    cancellation: {
      ...(original?.cancellation || {}),
      ...(fetched?.cancellation || {}),
      ...(authoritative?.cancellation || {}),
      actor: authoritative?.cancellation?.actor || fetched?.cancellation?.actor || "creator",
    },
  };
}

async function loadBooking() {
  const bookingId = String(bootstrap.bookingId || "").trim();
  loading.value = true;
  errorMessage.value = "";
  booking.value = null;
  calendarEvent.value = null;
  compactDetailsSession.value = false;

  if (!bookingId) {
    errorMessage.value = t("fan_event_details_missing_booking_id");
    loading.value = false;
    notifyBookingDetailsReady({ bookingId: "", ok: false });
    return;
  }

  try {
    const bootstrapSnapshot = bootstrap.bookingSnapshot && typeof bootstrap.bookingSnapshot === "object"
      ? bootstrap.bookingSnapshot
      : null;
    const snapshotBookingId = String(bootstrapSnapshot?.bookingId || bootstrapSnapshot?.id || "").trim();
    let item = snapshotBookingId === bookingId && isCompleteBookingSnapshot(bootstrapSnapshot)
      ? bootstrapSnapshot
      : null;

    if (!item) {
      const result = await FlowHandler.run("bookings.fetchBooking", { bookingId }, flowOptions());
      item = result?.data?.item || null;
      if (!result?.ok || !item) {
        errorMessage.value = result?.error?.message || t("fan_event_details_load_failed");
        return;
      }
    }

    booking.value = item;
    calendarEvent.value = toCalendarEvent(item);
    compactDetailsSession.value = compactMobileDetailsEligible.value;
    if (!calendarEvent.value) {
      errorMessage.value = t("fan_event_details_schedule_unavailable");
    } else if (isDirectCancelLaunch.value && !directCancelOpened.value) {
      directCancelOpened.value = true;
      openAdjustmentDecision("cancel", { bookingId });
    }
  } catch (error) {
    errorMessage.value = error?.message || t("fan_event_details_load_failed");
  } finally {
    loading.value = false;
    await nextTick();
    if (compactDetailsSession.value) {
      compactDetailsOpen.value = false;
      await nextTick();
      compactDetailsOpen.value = true;
      await nextTick();
    }
    notifyBookingDetailsReady({ bookingId, ok: Boolean(calendarEvent.value) });
  }
}

function closePanel() {
  requestBookingDetailsClose({ bookingId: bootstrap.bookingId || "" });
}

function handleJoin(payload = {}) {
  if (!payload.joinUrl) return;
  requestEventsEmbedOpenUrl({ url: payload.joinUrl, target: "_self" });
}

function openChat(payload = {}) {
  try {
    const parentChat = window.parent?.chatEmbed;
    if (parentChat && typeof parentChat.openChat === "function") {
      parentChat.openChat(payload);
    }
  } catch (_error) {
    // Cross-origin hosts cannot expose the dashboard chat controller.
  }
}

function openAdjustBooking() {
  if (viewerRole.value !== "creator" || !bookingChatMessage.value || actionLoading.value) return;
  showAdjustPopup.value = true;
}

async function reviewBooking(payload, decision) {
  if (viewerRole.value !== "creator" || actionLoading.value) return;
  const bookingId = String(payload?.bookingId || bootstrap.bookingId || "").trim();
  if (!bookingId) return;

  actionLoading.value = true;
  try {
    const { ok, item, error } = await bookingActions.reviewBooking({
      bookingId,
      decision,
      actor: "creator",
      reason: decision === "approve" ? "approved_by_creator" : "rejected_by_creator",
      event: payload?.event || calendarEvent.value,
    });

    if (!ok) {
      showToast({
        type: "error",
        title: t("dashboard_booking_action_failed_title"),
        message: error || t("dashboard_booking_action_update_failed"),
      });
      return;
    }

    await syncBookingMessageAction(decision === "approve" ? "accepted" : "declined", decision);

    const retainOpen = viewerRole.value === "creator" && !isDirectCancelLaunch.value;
    let updatedItem = item;
    if (retainOpen) {
      updatedItem = await resolveRetainedBookingSnapshot(item, {
        bookingId,
        creatorTerminal: decision === "reject",
      });
      applyRetainedBookingSnapshot(updatedItem);
    }
    await notifySuccessfulBookingUpdate(decision, updatedItem, {
      retainOpen,
      showReviewToast: decision === "approve" && retainOpen && compactDetailsSession.value,
      counterparty: payload?.counterparty,
    });
  } finally {
    actionLoading.value = false;
  }
}

function approveBooking(payload) {
  void reviewBooking(payload, "approve");
}

function rejectBooking(payload) {
  void reviewBooking(payload, "reject");
}

function requestCancelBooking(payload) {
  openAdjustmentDecision("cancel", payload || { bookingId: bootstrap.bookingId });
}

// Fan responses to a creator's `moretime` / `reschedule` proposal.
async function acceptCounterOffer(payload = {}) {
  if (actionLoading.value) return;
  const bookingId = String(payload.bookingId || booking.value?.bookingId || bootstrap.bookingId || "").trim();
  const proposedSlotDate = payload.proposed?.proposedSlotDate;
  if (!bookingId || !proposedSlotDate) {
    actionError(t("fan_event_details_adjustment_price_unavailable"));
    return;
  }

  actionLoading.value = true;
  try {
    const { ok, item, error } = await bookingActions.acceptCounterOffer({
      bookingId,
      offerType: payload.offerType,
      proposedSlotDate,
      negotiationId: payload.negotiationId || null,
    });
    if (!ok) {
      actionError(error || t("dashboard_booking_action_update_failed"));
      return;
    }
    await syncBookingMessageAction("accepted", "accept_counter");
    await notifySuccessfulBookingUpdate("accept_counter", item);
  } finally {
    actionLoading.value = false;
  }
}

async function rejectCounterOffer(payload = {}) {
  if (actionLoading.value) return;
  const bookingId = String(payload.bookingId || booking.value?.bookingId || bootstrap.bookingId || "").trim();
  if (!bookingId) return;

  actionLoading.value = true;
  try {
    const { ok, item, error } = await bookingActions.rejectCounterOffer({
      bookingId,
      offerType: payload.offerType,
      negotiationId: payload.negotiationId || null,
    });
    if (!ok) {
      actionError(error || t("fan_event_details_decline_failed"));
      return;
    }
    await syncBookingMessageAction("declined", "reject_counter");
    await notifySuccessfulBookingUpdate("reject_counter", item);
  } finally {
    actionLoading.value = false;
  }
}

// The chat request popups do their own writes (booking meta + chat message), so all
// that is left is broadcasting the message and refreshing this panel.
async function onTimeChangeSubmitted(action, payload = {}) {
  showMoreTimePopup.value = false;
  showReschedulePopup.value = false;
  const chatId = booking.value?.meta?.chatId;
  if (payload.booking) booking.value = payload.booking;

  if (chatId) broadcastBookingToChat(booking.value, payload.item, action);

  await notifySuccessfulBookingUpdate(action, payload.booking || booking.value);
  await loadBooking();
}

async function onAdjustSubmitted(payload = {}) {
  const bookingId = String(
    payload.booking?.bookingId
      || payload.booking?.booking_id
      || booking.value?.bookingId
      || bootstrap.bookingId
      || "",
  ).trim();
  const chatId = booking.value?.meta?.chatId || bookingChatMessage.value?.chat_id;

  showAdjustPopup.value = false;
  let updatedBooking = await resolveRetainedBookingSnapshot(payload.booking, {
    bookingId,
    requireCounterOffer: true,
  });
  applyRetainedBookingSnapshot(updatedBooking);

  if (chatId) broadcastBookingToChat(updatedBooking, payload.item, "adjust_request");
  await notifySuccessfulBookingUpdate("adjust_request", updatedBooking, { retainOpen: true });
}

function reportCancelFailure(message) {
  const resolvedMessage = message || t("dashboard_booking_cancel_failed_message");
  if (adjustmentDecisionMode.value === "cancel" && adjustmentDecisionOpen.value) {
    adjustmentDecisionState.reportError(resolvedMessage);
  }
  showToast({
    type: "error",
    title: t("dashboard_booking_cancel_failed_title"),
    message: resolvedMessage,
  });
}

async function confirmCancelBooking() {
  if (actionLoading.value) return;
  const decisionCandidate = adjustmentDecision.value;
  const bookingId = String(decisionCandidate?.bookingId || bootstrap.bookingId || "").trim();
  if (!bookingId) return;

  actionLoading.value = true;
  try {
    const { ok, item, error } = await bookingActions.cancelBooking({
      bookingId,
      actor: viewerRole.value === "fan" ? "fan" : "creator",
      intent: "normal",
      reason: viewerRole.value === "fan"
        ? "fan_cancelled_from_order_details"
        : "creator_cancelled_from_order_details",
    });

    if (!ok) {
      reportCancelFailure(error);
      return;
    }

    await syncBookingMessageAction("cancelled", "cancel");
    const retainOpen = viewerRole.value === "creator" && !isDirectCancelLaunch.value;
    let updatedItem = item;

    if (retainOpen && !updatedItem) {
      adjustmentDecisionState.reset({ force: true });
      await nextTick();
      loading.value = true;
      try {
        const refreshed = await FlowHandler.run("bookings.fetchBooking", { bookingId }, flowOptions());
        updatedItem = refreshed?.ok ? refreshed?.data?.item || null : null;
      } catch (_error) {
        updatedItem = null;
      } finally {
        loading.value = false;
      }
    }

    if (retainOpen) {
      if (!updatedItem) {
        const original = booking.value && typeof booking.value === "object" ? booking.value : {};
        updatedItem = {
          ...original,
          bookingId,
          status: "cancelled_creator",
          cancellation: {
            ...(original?.cancellation || {}),
            actor: "creator",
          },
        };
      }
      booking.value = updatedItem;
      calendarEvent.value = toCalendarEvent(updatedItem) || calendarEvent.value;
    }

    await notifySuccessfulBookingUpdate("cancel", updatedItem, { retainOpen });
  } catch (error) {
    reportCancelFailure(error?.message);
  } finally {
    actionLoading.value = false;
  }
}

function actionError(message) {
  if (adjustmentDecisionOpen.value) {
    adjustmentDecisionState.reportError(message || t("dashboard_booking_action_update_failed"));
  }
  showToast({
    type: "error",
    title: t("dashboard_booking_action_failed_title"),
    message: message || t("dashboard_booking_action_update_failed"),
  });
}


/**
 * Mirrors the action onto the linked chat message, then asks the chat embed on the
 * host page to broadcast it — this embed has no chat socket of its own.
 */
async function syncBookingMessageAction(action, logKey = null) {
  await syncBookingToChat(booking.value, action, logKey);
}

async function applyPriceAdjustment(adjustment = {}, { reportFailure = true } = {}) {
  const bookingId = String(booking.value?.bookingId || bootstrap.bookingId || "").trim();
  if (!bookingId) {
    const outcome = { ok: false, error: t("fan_event_details_missing_booking_id") };
    if (reportFailure) actionError(outcome.error);
    return outcome;
  }

  try {
    const outcome = await bookingActions.applyPriceAdjustment({
      bookingId,
      proposedStartAtIso: adjustment.proposedStartAtIso,
      proposedDurationMinutes: adjustment.proposedDurationMinutes,
      proposedTokens: adjustment.proposedTokens,
      remarks: adjustment.remarks,
      negotiationId: adjustment.negotiationId || null,
    });
    const { ok, item, error } = outcome;

    if (!ok) {
      if (reportFailure) actionError(error || t("fan_event_details_adjustment_confirm_failed"));
      return outcome;
    }

    await syncBookingMessageAction("accepted", "accept_adjustment");
    await notifySuccessfulBookingUpdate("accept_adjustment", item);
    return outcome;
  } catch (error) {
    const outcome = { ok: false, error: error?.message || t("fan_event_details_adjustment_confirm_failed") };
    if (reportFailure) actionError(outcome.error);
    return outcome;
  }
}

async function acceptPriceAdjustment(adjustment = {}) {
  if (actionLoading.value) return;
  const originalTokens = Number(adjustment.originalTokens);
  const proposedTokens = Number(adjustment.proposedTokens);
  if (!Number.isFinite(originalTokens) || !Number.isFinite(proposedTokens)) {
    actionError(t("fan_event_details_adjustment_price_unavailable"));
    return;
  }
  openAdjustmentDecision("accept", adjustment);
}

function requestDeclineAdjustment(adjustment = {}) {
  if (actionLoading.value) return;
  openAdjustmentDecision("decline", adjustment);
}

async function confirmDeclineAdjustment() {
  if (actionLoading.value || !adjustmentDecision.value) return;
  const bookingId = String(booking.value?.bookingId || bootstrap.bookingId || "").trim();
  if (!bookingId) return;

  actionLoading.value = true;
  try {
    const { ok, item, error } = await bookingActions.rejectCounterOffer({
      bookingId,
      offerType: "adjust",
      negotiationId: adjustmentDecision.value.negotiationId || null,
      reason: "fan_declined_price_adjustment",
    });

    if (!ok) {
      actionError(error || t("fan_event_details_decline_failed"));
      return;
    }

    await syncBookingMessageAction("declined", "decline_adjustment");
    await notifySuccessfulBookingUpdate("decline_adjustment", item);
  } catch (error) {
    actionError(error?.message || t("fan_event_details_decline_failed"));
  } finally {
    actionLoading.value = false;
  }
}

function resetAdjustmentDecision() {
  if (actionLoading.value) return;
  if (topupResumeController) topupResumeController.abort();
  pendingTopupAdjustment.value = null;
  if (isDirectCancelLaunch.value) {
    closePanel();
    return;
  }
  adjustmentDecisionState.reset();
}

function openAdjustmentDecision(mode, adjustment) {
  adjustmentDecisionState.open(mode, adjustment);
}

async function confirmAdjustmentDecision(payload = {}) {
  if (actionLoading.value || !adjustmentDecision.value) return;
  adjustmentDecisionState.reportError("");

  if (payload.mode === "decline") {
    await confirmDeclineAdjustment();
    return;
  }

  if (payload.mode === "cancel") {
    await confirmCancelBooking();
    return;
  }

  actionLoading.value = true;
  if (!payload.requiresTopup) {
    try {
      await applyPriceAdjustment(adjustmentDecision.value);
    } finally {
      actionLoading.value = false;
    }
    return;
  }

  const fanId = bootstrap.fanId || booking.value?.userId || booking.value?.user_id;
  const creatorId = booking.value?.creatorId || booking.value?.creator_id;
  const requiredTokens = finiteNonNegative(payload.shortfallTokens);
  if (!fanId || !creatorId || requiredTokens <= 0) {
    actionLoading.value = false;
    actionError(t("booking_adjustment_topup_unavailable"));
    return;
  }

  const requiredBalanceTokens = finiteNonNegative(
    payload.requiredBalanceTokens,
    Math.max(0, finiteNonNegative(adjustmentDecision.value?.proposedTokens) - finiteNonNegative(adjustmentDecision.value?.originalTokens)),
  );
  pendingTopupAdjustment.value = {
    adjustment: adjustmentDecision.value,
    requiredBalanceTokens,
  };
  requestBookingDetailsTopup({
    bookingId: bootstrap.bookingId,
    requiredTokens,
    currentUserId: String(fanId),
    creatorUserId: String(creatorId),
    topupFor: "booking_confirm",
  });
}

async function resumePendingTopupAdjustment() {
  const pending = pendingTopupAdjustment.value;
  if (!pending || actionLoading.value && topupResumeController) return;

  if (topupResumeController) topupResumeController.abort();
  const controller = new AbortController();
  topupResumeController = controller;
  actionLoading.value = true;
  adjustmentDecisionState.reportError("");

  try {
    const resumed = await resumePriceAdjustmentAfterTopup({
      decisionState: adjustmentDecisionState,
      minimumBalanceTokens: pending.requiredBalanceTokens,
      applyAdjustment: () => applyPriceAdjustment(pending.adjustment, { reportFailure: false }),
      signal: controller.signal,
    });
    if (controller.signal.aborted) return;
    if (resumed.ok) {
      pendingTopupAdjustment.value = null;
      adjustmentDecisionState.markTopupCompleted(false);
      return;
    }
    if (resumed.stage === "balance") {
      if (resumed.readiness?.reason === "unavailable") {
        adjustmentDecisionState.reportBalanceError(t("booking_adjustment_balance_unavailable"));
      } else {
        adjustmentDecisionState.reportError(t("booking_adjustment_topup_sync_timeout"));
      }
    } else {
      actionError(resumed.outcome?.error || t("fan_event_details_adjustment_confirm_failed"));
      pendingTopupAdjustment.value = null;
    }
  } finally {
    if (topupResumeController === controller) topupResumeController = null;
    actionLoading.value = false;
  }
}

onMounted(() => {
  removeTopupListener = installBookingDetailsTopupListener(({ ok, payload }) => {
    if (!pendingTopupAdjustment.value) return;
    if (payload?.bookingId && String(payload.bookingId) !== String(bootstrap.bookingId)) return;
    if (!ok) {
      pendingTopupAdjustment.value = null;
      actionLoading.value = false;
      actionError(t("fan_event_details_topup_failed"));
      return;
    }
    void resumePendingTopupAdjustment();
  });
  void loadBooking();
});

onBeforeUnmount(() => {
  if (topupResumeController) topupResumeController.abort();
  notifyBookingDetailsDecisionVisibility(false);
  if (removeTopupListener) removeTopupListener();
});
</script>

<style>
.booking-details-fan-surface {
  width: 100%;
  max-width: 492px;
  margin-left: auto;
}
</style>
