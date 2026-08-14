<template>
  <main class="h-full min-h-0 bg-gray-50" data-test="events-embed-booking-details-page">
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

    <CalendarEventDetailsPopup
      v-else
      :event="calendarEvent"
      :booking="booking"
      :user-role="viewerRole"
      :can-review-pending="viewerRole === 'creator'"
      presentation="side-panel"
      @join-call="handleJoin"
      @approve-booking="approveBooking"
      @reject-booking="rejectBooking"
      @cancel-booking="requestCancelBooking"
      @open-chat="openChat"
      @adjust-booking="openChat"
      @close="closePanel"
    />

    <div v-if="cancelCandidate" class="fixed inset-0 z-[1800] flex items-center justify-center bg-black/45 p-4" data-test="booking-details-cancel-confirm">
      <div class="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
        <h2 class="text-base font-semibold text-gray-900">{{ cancelConfirmTitle }}</h2>
        <p class="mt-2 text-sm text-gray-600">{{ cancelConfirmBody }}</p>
        <div class="mt-5 flex justify-end gap-2">
          <button type="button" class="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700" :disabled="actionLoading" @click="cancelCandidate = null">
            {{ t("common_cancel") }}
          </button>
          <button type="button" class="rounded bg-[#F04438] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" :disabled="actionLoading" @click="confirmCancelBooking">
            {{ actionLoading ? t("common_loading") : cancelConfirmAction }}
          </button>
        </div>
      </div>
    </div>

    <ToastHost />
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import CalendarEventDetailsPopup from "@/components/calendar/CalendarEventDetailsPopup.vue";
import ToastHost from "@/components/ui/toast/ToastHost.vue";
import FlowHandler from "@/services/flow-system/FlowHandler.js";
import { mapBookedSlotsToCalendarEvents } from "@/services/bookings/utils/bookingSlotUtils.js";
import { useEventsEmbedBootstrap } from "@/embeds/events/bootstrap.js";
import {
  notifyBookingDetailsReady,
  notifyBookingDetailsUpdated,
  requestBookingDetailsClose,
  requestEventsEmbedOpenUrl,
} from "@/embeds/events/bridge.js";
import { normalizeDashboardBookingRole } from "@/utils/dashboardRole.js";
import { showToast } from "@/utils/toastBus.js";
import { useBookingTranslations } from "@/i18n/bookingTranslations.js";

const bootstrap = useEventsEmbedBootstrap();
const { t } = useBookingTranslations();
const booking = ref(null);
const calendarEvent = ref(null);
const loading = ref(true);
const actionLoading = ref(false);
const errorMessage = ref("");
const cancelCandidate = ref(null);
const viewerRole = computed(() => normalizeDashboardBookingRole(bootstrap.userRole));
const cancelConfirmTitle = computed(() => (
  viewerRole.value === "fan" ? t("dashboard_fan_cancel_confirm_title") : t("dashboard_cancel_confirm_title")
));
const cancelConfirmBody = computed(() => (
  viewerRole.value === "fan" ? t("dashboard_fan_cancel_confirm_neutral_body") : t("dashboard_cancel_confirm_body")
));
const cancelConfirmAction = computed(() => (
  viewerRole.value === "fan" ? t("dashboard_fan_cancel_confirm_action") : t("dashboard_cancel_confirm_action")
));

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

async function loadBooking() {
  const bookingId = String(bootstrap.bookingId || "").trim();
  loading.value = true;
  errorMessage.value = "";
  booking.value = null;
  calendarEvent.value = null;

  if (!bookingId) {
    errorMessage.value = "Booking ID is missing.";
    loading.value = false;
    notifyBookingDetailsReady({ bookingId: "", ok: false });
    return;
  }

  try {
    const result = await FlowHandler.run("bookings.fetchBooking", { bookingId }, flowOptions());
    const item = result?.data?.item || null;
    if (!result?.ok || !item) {
      errorMessage.value = result?.error?.message || "Booking details could not be loaded.";
      return;
    }

    booking.value = item;
    calendarEvent.value = toCalendarEvent(item);
    if (!calendarEvent.value) {
      errorMessage.value = "Booking schedule details are unavailable.";
    }
  } catch (error) {
    errorMessage.value = error?.message || "Booking details could not be loaded.";
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

    notifyBookingDetailsUpdated({ bookingId, action: decision, item: result?.data?.item || null });
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
  cancelCandidate.value = payload || { bookingId: bootstrap.bookingId };
}

async function confirmCancelBooking() {
  if (actionLoading.value) return;
  const bookingId = String(cancelCandidate.value?.bookingId || bootstrap.bookingId || "").trim();
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
      showToast({
        type: "error",
        title: t("dashboard_booking_cancel_failed_title"),
        message: result?.meta?.uiErrors?.[0] || result?.error?.message || t("dashboard_booking_cancel_failed_message"),
      });
      return;
    }

    cancelCandidate.value = null;
    notifyBookingDetailsUpdated({ bookingId, action: "cancel", item: result?.data?.item || null });
  } finally {
    actionLoading.value = false;
  }
}

onMounted(() => {
  void loadBooking();
});
</script>
