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
        :booking="booking"
        :event="calendarEvent"
        :user-role="viewerRole"
        :can-review-pending="viewerRole === 'creator'"
        :action-loading="actionLoading"
        presentation="side-panel"
        @join-call="handleJoin"
        @open-chat="openChat"
        @cancel-booking="requestCancelBooking"
        @accept-adjustment="acceptPriceAdjustment"
        @decline-adjustment="requestDeclineAdjustment"
        @approve-booking="approveBooking"
        @reject-booking="rejectBooking"
        @adjust-booking="openChat"
        @decision-visibility="detailsDecisionOpen = $event"
        @close="closePanel"
      />
    </div>

    <BookingAdjustmentDecisionPopup
      v-model="adjustmentDecisionOpen"
      :mode="adjustmentDecisionMode"
      :original-tokens="adjustmentDecision?.originalTokens"
      :proposed-tokens="adjustmentDecision?.proposedTokens"
      :wallet-balance="adjustmentWalletBalance"
      :session-refund-tokens="adjustmentSessionRefundTokens"
      :booking-fee-tokens="adjustmentBookingFeeTokens"
      :cancellation-fee-tokens="adjustmentCancellationFeeTokens"
      :creator-username="adjustmentCreatorUsername"
      :creator-name="adjustmentCreatorName"
      :event-title="adjustmentEventTitle"
      :actor-role="viewerRole"
      :fan-username="adjustmentFanUsername"
      :net-refund-tokens="adjustmentNetRefundTokens"
      :balance-loading="adjustmentBalanceLoading"
      :balance-error="adjustmentDecisionError"
      :processing="actionLoading"
      @confirm="confirmAdjustmentDecision"
      @retry-balance="loadAdjustmentBalance"
      @close="resetAdjustmentDecision"
    />

    <ToastHost />
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import BookingDetailsPopup from "@/components/ui/popup/BookingDetailsPopup.vue";
import BookingAdjustmentDecisionPopup from "@/components/ui/popup/BookingAdjustmentDecisionPopup.vue";
import ToastHost from "@/components/ui/toast/ToastHost.vue";
import FlowHandler from "@/services/flow-system/FlowHandler.js";
import { mapBookedSlotsToCalendarEvents } from "@/services/bookings/utils/bookingSlotUtils.js";
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
import { fetchUserProfileData } from "@/services/users/userProfileApi.js";
import { resolveBookingRefundState } from "@/services/bookings/utils/bookingRefundUtils.js";
import { showToast } from "@/utils/toastBus.js";
import { useBookingTranslations } from "@/i18n/bookingTranslations.js";
import TokenHandler from "@/utils/TokenHandler.js";

const bootstrap = useEventsEmbedBootstrap();
const { t } = useBookingTranslations();
const booking = ref(null);
const calendarEvent = ref(null);
const loading = ref(true);
const actionLoading = ref(false);
const errorMessage = ref("");
const pendingTopupAdjustment = ref(null);
const adjustmentDecisionOpen = ref(false);
const detailsDecisionOpen = ref(false);
const adjustmentDecisionMode = ref("accept");
const adjustmentDecision = ref(null);
const adjustmentWalletBalance = ref(null);
const adjustmentBalanceLoading = ref(false);
const adjustmentDecisionError = ref("");
const fetchedCreatorUsername = ref("");
const fetchedFanUsername = ref("");
let removeTopupListener = null;
let creatorProfileAbortController = null;
const viewerRole = computed(() => normalizeDashboardBookingRole(bootstrap.userRole));
const isDirectCancelLaunch = computed(() => bootstrap.initialAction === "cancel");
const directCancelOpened = ref(false);

const anyDecisionOpen = computed(() => adjustmentDecisionOpen.value || detailsDecisionOpen.value);

watch(anyDecisionOpen, (isOpen) => {
  notifyBookingDetailsDecisionVisibility(isOpen);
});

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

function normalizeUsername(value) {
  const username = String(value || "").trim().replace(/^@+/, "");
  if (!username || /^user\s*#\s*\d+$/i.test(username)) return "";
  return username;
}

function truthyFlag(value) {
  return value === true || value === 1 || value === "1" || String(value || "").trim().toLowerCase() === "true";
}

const adjustmentEventSources = computed(() => [
  booking.value?.eventCurrent,
  booking.value?.eventSnapshot,
  booking.value,
  calendarEvent.value?.raw,
  calendarEvent.value,
].filter((source) => source && typeof source === "object"));
const adjustmentPayment = computed(() => booking.value?.payment && typeof booking.value.payment === "object" ? booking.value.payment : {});
const adjustmentCreatorId = computed(() => firstDefined(adjustmentEventSources.value, ["creatorId", "creator_id"]));
const adjustmentFanId = computed(() => firstDefined(adjustmentEventSources.value, ["userId", "user_id", "fanId", "fan_id"]));
const storedCreatorUsername = computed(() => String(firstDefined(adjustmentEventSources.value, ["creatorUsername", "creatorUserName", "creatorHandle"]) || "").trim());
const adjustmentCreatorName = computed(() => String(firstDefined(adjustmentEventSources.value, ["creatorDisplayName", "creatorName"]) || "").trim());
const adjustmentCreatorUsername = computed(() => storedCreatorUsername.value || fetchedCreatorUsername.value || adjustmentCreatorName.value);
const storedFanUsername = computed(() => normalizeUsername(firstDefined(adjustmentEventSources.value, ["fanUsername", "fanUserName"])));
const storedFanDisplayName = computed(() => normalizeUsername(firstDefined(adjustmentEventSources.value, ["username", "userName", "fanDisplayName", "userDisplayName"])));
const adjustmentFanUsername = computed(() => fetchedFanUsername.value || storedFanUsername.value || storedFanDisplayName.value);
const adjustmentEventTitle = computed(() => String(firstDefined(adjustmentEventSources.value, ["eventTitle", "title"]) || "").trim());
const adjustmentPaymentTotal = computed(() => {
  const explicit = Number(adjustmentPayment.value?.total ?? booking.value?.paymentTotal);
  if (Number.isFinite(explicit)) return Math.max(0, explicit);
  if (Array.isArray(adjustmentPayment.value?.lines)) {
    return adjustmentPayment.value.lines.reduce((sum, line) => sum + finiteNonNegative(line?.amount), 0);
  }
  return finiteNonNegative(adjustmentDecision.value?.originalTokens);
});
const adjustmentBookingFeeTokens = computed(() => {
  const allocations = adjustmentPayment.value?.allocations;
  if (allocations && typeof allocations === "object" && Object.prototype.hasOwnProperty.call(allocations, "bookingFee")) {
    return finiteNonNegative(allocations.bookingFee);
  }
  const stored = finiteNonNegative(firstDefined(
    [
      adjustmentPayment.value,
      booking.value?.paymentSnapshot,
      booking.value?.meta?.payment,
      booking.value?.meta?.validation?.payment,
      booking.value?.meta?.validation?.paymentPayload,
      booking.value,
    ],
    ["bookingFeeAmountTokens", "bookingFeeAmount", "bookingFeePaidTokens"],
  ));
  if (stored > 0) return stored;
  const line = Array.isArray(adjustmentPayment.value?.lines)
    ? adjustmentPayment.value.lines.find((item) => String(item?.code || "").trim().toLowerCase() === "booking_fee")
    : null;
  const lineAmount = finiteNonNegative(line?.amount);
  if (lineAmount > 0) return lineAmount;
  const enabled = truthyFlag(firstDefined(adjustmentEventSources.value, ["enableBookingFee"]));
  return enabled
    ? finiteNonNegative(firstDefined(adjustmentEventSources.value, ["bookingFeeTokens", "bookingFee"]))
    : 0;
});
const adjustmentCancellationFeeTokens = computed(() => {
  const allocated = finiteNonNegative(adjustmentPayment.value?.allocations?.cancellationFee);
  const configured = finiteNonNegative(firstDefined(adjustmentEventSources.value, ["cancellationFeeTokens", "cancellationFee"]));
  const enabled = allocated > 0 || truthyFlag(firstDefined(adjustmentEventSources.value, ["enableCancellationFee"]));
  if (!enabled) return 0;

  const advanceEnabled = truthyFlag(firstDefined(adjustmentEventSources.value, ["allowAdvanceCancelToAvoidMinCharge", "allowAdvanceCancellation"]));
  const advanceQuantity = finiteNonNegative(firstDefined(adjustmentEventSources.value, ["advanceCancelWindowQuantity", "advanceCancelWindow", "advanceVoid"]));
  const advanceUnit = String(firstDefined(adjustmentEventSources.value, ["advanceCancelWindowUnit"]) || "").trim().toLowerCase();
  const unitMs = advanceUnit.startsWith("day") ? 86400000 : advanceUnit.startsWith("hour") ? 3600000 : advanceUnit.startsWith("minute") ? 60000 : 0;
  const startAt = Date.parse(booking.value?.startAtIso || calendarEvent.value?.start || "");
  if (advanceEnabled && advanceQuantity > 0 && unitMs > 0 && Number.isFinite(startAt) && startAt - Date.now() >= advanceQuantity * unitMs) return 0;
  return allocated || configured;
});
const adjustmentSessionRefundTokens = computed(() => {
  const allocations = adjustmentPayment.value?.allocations;
  const hasV2Allocations = Number(adjustmentPayment.value?.paymentPolicyVersion) === 2
    || (allocations && typeof allocations === "object"
      && (Object.prototype.hasOwnProperty.call(allocations, "service")
        || Object.prototype.hasOwnProperty.call(allocations, "bookingFee")
        || Object.prototype.hasOwnProperty.call(allocations, "cancellationFee")));
  if (hasV2Allocations) {
    return finiteNonNegative(allocations?.service)
      + finiteNonNegative(allocations?.bookingFee)
      + finiteNonNegative(allocations?.cancellationFee);
  }
  return adjustmentPaymentTotal.value;
});
const adjustmentNetRefundTokens = computed(() => viewerRole.value === "creator"
  ? adjustmentSessionRefundTokens.value
  : Math.max(0, adjustmentSessionRefundTokens.value - adjustmentBookingFeeTokens.value - adjustmentCancellationFeeTokens.value));

watch([viewerRole, adjustmentCreatorId, adjustmentFanId, storedCreatorUsername, storedFanUsername], async ([role, creatorId, fanId, storedUsername, fanUsername]) => {
  if (creatorProfileAbortController) {
    creatorProfileAbortController.abort();
    creatorProfileAbortController = null;
  }
  fetchedCreatorUsername.value = "";
  fetchedFanUsername.value = "";
  const targetId = role === "creator" ? fanId : creatorId;
  const hasStoredUsername = role === "creator" ? fanUsername : storedUsername;
  if (hasStoredUsername || !targetId) return;

  const controller = new AbortController();
  creatorProfileAbortController = controller;
  try {
    const profile = await fetchUserProfileData(targetId, { signal: controller.signal });
    if (creatorProfileAbortController === controller) {
      if (role === "creator") fetchedFanUsername.value = normalizeUsername(profile?.username);
      else fetchedCreatorUsername.value = normalizeUsername(profile?.username);
    }
  } catch (error) {
    if (error?.name !== "AbortError" && creatorProfileAbortController === controller) {
      if (role === "creator") fetchedFanUsername.value = "";
      else fetchedCreatorUsername.value = "";
    }
  } finally {
    if (creatorProfileAbortController === controller) creatorProfileAbortController = null;
  }
}, { immediate: true });

function normalizeBookingForCalendar(value = {}) {
  const eventSnapshot = value.eventSnapshot && typeof value.eventSnapshot === "object" ? value.eventSnapshot : {};
  const eventCurrent = value.eventCurrent && typeof value.eventCurrent === "object" ? value.eventCurrent : {};
  return {
    ...value,
    startIso: value.startIso || value.startAtIso || value.startAt || "",
    endIso: value.endIso || value.endAtIso || value.endAt || "",
    eventTitle: value.eventTitle || eventSnapshot.title || eventCurrent.title || "",
    eventType: value.eventType || eventSnapshot.eventType || eventSnapshot.type || eventCurrent.eventType || eventCurrent.type || "",
    eventCallType: value.eventCallType || eventSnapshot.eventCallType || eventCurrent.eventCallType || "",
    eventColorSkin: value.eventColorSkin || eventSnapshot.eventColorSkin || eventCurrent.eventColorSkin || "",
  };
}

function toCalendarEvent(value) {
  return mapBookedSlotsToCalendarEvents([normalizeBookingForCalendar(value)], {
    titleFallback: t("calendar_event_untitled_booking"),
  })[0] || null;
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

function buildBookingUpdateNotification(updatedItem = null) {
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
    creatorUsername: String(firstDefined(sources, ["creatorUsername", "creatorUserName", "creatorHandle", "username"]) || adjustmentCreatorUsername.value || "").trim(),
    creatorName: String(firstDefined(sources, ["creatorDisplayName", "creatorName", "displayName", "name"]) || adjustmentCreatorName.value || "").trim(),
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
  };
}

async function notifySuccessfulBookingUpdate(action, updatedItem = null) {
  if (adjustmentDecisionOpen.value) {
    adjustmentDecisionOpen.value = false;
    await nextTick();
  }

  notifyBookingDetailsUpdated({
    bookingId: String(updatedItem?.bookingId || booking.value?.bookingId || bootstrap.bookingId || "").trim(),
    action,
    item: updatedItem,
    notification: buildBookingUpdateNotification(updatedItem),
  });
}

async function loadBooking() {
  const bookingId = String(bootstrap.bookingId || "").trim();
  loading.value = true;
  errorMessage.value = "";
  booking.value = null;
  calendarEvent.value = null;

  if (!bookingId) {
    errorMessage.value = t("fan_event_details_missing_booking_id");
    loading.value = false;
    notifyBookingDetailsReady({ bookingId: "", ok: false });
    return;
  }

  try {
    const result = await FlowHandler.run("bookings.fetchBooking", { bookingId }, flowOptions());
    const item = result?.data?.item || null;
    if (!result?.ok || !item) {
      errorMessage.value = result?.error?.message || t("fan_event_details_load_failed");
      return;
    }

    booking.value = item;
    calendarEvent.value = toCalendarEvent(item);
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

async function reviewBooking(payload, decision) {
  if (viewerRole.value !== "creator" || actionLoading.value) return;
  const bookingId = String(payload?.bookingId || bootstrap.bookingId || "").trim();
  if (!bookingId) return;

  actionLoading.value = true;
  try {
    const result = await FlowHandler.run("bookings.reviewPendingBooking", {
      bookingId,
      decision,
      actor: "creator",
      reason: decision === "approve" ? "approved_by_creator" : "rejected_by_creator",
      event: payload?.event || calendarEvent.value,
    }, flowOptions());

    if (!result?.ok) {
      showToast({
        type: "error",
        title: t("dashboard_booking_action_failed_title"),
        message: result?.meta?.uiErrors?.[0] || result?.error?.message || t("dashboard_booking_action_update_failed"),
      });
      return;
    }

    await notifySuccessfulBookingUpdate(decision, result?.data?.item || null);
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

function reportCancelFailure(message) {
  const resolvedMessage = message || t("dashboard_booking_cancel_failed_message");
  if (adjustmentDecisionMode.value === "cancel" && adjustmentDecisionOpen.value) {
    adjustmentDecisionError.value = resolvedMessage;
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
    const result = await FlowHandler.run("bookings.cancelBooking", {
      bookingId,
      actor: viewerRole.value === "fan" ? "fan" : "creator",
      intent: "normal",
      reason: viewerRole.value === "fan"
        ? "fan_cancelled_from_order_details"
        : "creator_cancelled_from_order_details",
    }, flowOptions());

    if (!result?.ok) {
      reportCancelFailure(result?.meta?.uiErrors?.[0] || result?.error?.message);
      return;
    }

    await notifySuccessfulBookingUpdate("cancel", result?.data?.item || null);
  } catch (error) {
    reportCancelFailure(error?.message);
  } finally {
    actionLoading.value = false;
  }
}

function actionError(message) {
  if (adjustmentDecisionOpen.value) {
    adjustmentDecisionError.value = message || t("dashboard_booking_action_update_failed");
  }
  showToast({
    type: "error",
    title: t("dashboard_booking_action_failed_title"),
    message: message || t("dashboard_booking_action_update_failed"),
  });
}

async function syncBookingMessageAction(action) {
  const chatId = booking.value?.meta?.chatId;
  const messageId = booking.value?.meta?.bookingMessageId;
  if (!chatId || !messageId) return;

  try {
    await FlowHandler.run("chat.updateBookingRequestMessage", {
      chatId,
      messageId,
      action,
    }, flowOptions());
  } catch (_error) {
    // The booking state is authoritative; chat synchronization is best effort.
  }
}

async function applyPriceAdjustment(adjustment = {}) {
  const bookingId = String(booking.value?.bookingId || bootstrap.bookingId || "").trim();
  if (!bookingId) {
    actionLoading.value = false;
    actionError(t("fan_event_details_missing_booking_id"));
    return;
  }

  try {
    const renegotiateResult = await FlowHandler.run("bookings.renegotiateBooking", {
      bookingId,
      startAtIso: adjustment.proposedStartAtIso || undefined,
      durationMinutes: adjustment.proposedDurationMinutes ?? undefined,
      costTokens: adjustment.proposedTokens ?? undefined,
      personalRequestText: adjustment.remarks || undefined,
      actor: "user",
      args: {
        negotiation: {
          type: "adjust",
          phase: "apply",
          negotiationId: adjustment.negotiationId || null,
        },
      },
      meta: { currentCounterOffer: "" },
    }, flowOptions());

    if (!renegotiateResult?.ok) {
      actionError(renegotiateResult?.meta?.uiErrors?.[0] || renegotiateResult?.error?.message || t("fan_event_details_adjustment_apply_failed"));
      return;
    }

    const reviewResult = await FlowHandler.run("bookings.reviewPendingBooking", {
      bookingId,
      decision: "approve",
      actor: "fan",
      reason: "adjustment_accepted_by_fan",
      args: {
        negotiation: {
          status: "accepted",
          type: "adjust",
          negotiationId: adjustment.negotiationId || null,
        },
      },
    }, flowOptions());

    if (!reviewResult?.ok) {
      actionError(reviewResult?.meta?.uiErrors?.[0] || reviewResult?.error?.message || t("fan_event_details_adjustment_confirm_failed"));
      return;
    }

    await syncBookingMessageAction("accepted");
    await notifySuccessfulBookingUpdate("accept_adjustment", reviewResult?.data?.item || null);
  } catch (error) {
    actionError(error?.message || t("fan_event_details_adjustment_confirm_failed"));
  } finally {
    pendingTopupAdjustment.value = null;
    actionLoading.value = false;
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
    const result = await FlowHandler.run("bookings.cancelBooking", {
      bookingId,
      actor: "user",
      intent: "decline_renegotiation",
      reason: "fan_declined_price_adjustment",
      args: {
        negotiation: {
          status: "declined",
          type: "adjust",
          negotiationId: adjustmentDecision.value.negotiationId || null,
        },
      },
    }, flowOptions());

    if (!result?.ok) {
      actionError(result?.meta?.uiErrors?.[0] || result?.error?.message || t("fan_event_details_decline_failed"));
      return;
    }

    await syncBookingMessageAction("declined");
    await notifySuccessfulBookingUpdate("decline_adjustment", result?.data?.item || null);
  } catch (error) {
    actionError(error?.message || t("fan_event_details_decline_failed"));
  } finally {
    actionLoading.value = false;
  }
}

function resetAdjustmentDecision() {
  if (actionLoading.value) return;
  if (isDirectCancelLaunch.value) {
    closePanel();
    return;
  }
  adjustmentDecisionOpen.value = false;
  adjustmentDecision.value = null;
  adjustmentWalletBalance.value = null;
  adjustmentBalanceLoading.value = false;
  adjustmentDecisionError.value = "";
}

async function loadAdjustmentBalance() {
  if (!adjustmentDecisionOpen.value || adjustmentBalanceLoading.value || actionLoading.value) return;
  const fanId = bootstrap.fanId || booking.value?.userId || booking.value?.user_id;
  const creatorId = booking.value?.creatorId || booking.value?.creator_id;
  adjustmentBalanceLoading.value = true;
  adjustmentDecisionError.value = "";

  if (!fanId || !creatorId) {
    adjustmentBalanceLoading.value = false;
    adjustmentDecisionError.value = t("booking_adjustment_balance_unavailable");
    return;
  }

  try {
    const nextBalance = await TokenHandler.get({ userId: fanId, receiverId: creatorId, defaultValue: null });
    if (!Number.isFinite(Number(nextBalance))) {
      adjustmentDecisionError.value = t("booking_adjustment_balance_unavailable");
      adjustmentWalletBalance.value = null;
      return;
    }
    adjustmentWalletBalance.value = Math.max(0, Number(nextBalance));
  } catch (_error) {
    adjustmentDecisionError.value = t("booking_adjustment_balance_unavailable");
    adjustmentWalletBalance.value = null;
  } finally {
    adjustmentBalanceLoading.value = false;
  }
}

function openAdjustmentDecision(mode, adjustment) {
  adjustmentDecisionMode.value = mode === "cancel"
    ? "cancel"
    : mode === "decline" ? "decline" : "accept";
  adjustmentDecision.value = adjustment;
  adjustmentWalletBalance.value = null;
  adjustmentDecisionError.value = "";
  adjustmentDecisionOpen.value = true;
  if (!(viewerRole.value === "creator" && adjustmentDecisionMode.value === "cancel")) {
    void loadAdjustmentBalance();
  }
}

async function confirmAdjustmentDecision(payload = {}) {
  if (actionLoading.value || !adjustmentDecision.value) return;
  adjustmentDecisionError.value = "";

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
    await applyPriceAdjustment(adjustmentDecision.value);
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

  pendingTopupAdjustment.value = adjustmentDecision.value;
  requestBookingDetailsTopup({
    bookingId: bootstrap.bookingId,
    requiredTokens,
    currentUserId: String(fanId),
    creatorUserId: String(creatorId),
    topupFor: "booking_confirm",
  });
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
    void applyPriceAdjustment(pendingTopupAdjustment.value);
  });
  void loadBooking();
});

onBeforeUnmount(() => {
  notifyBookingDetailsDecisionVisibility(false);
  if (creatorProfileAbortController) creatorProfileAbortController.abort();
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
