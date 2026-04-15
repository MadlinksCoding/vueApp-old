<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import ToastHost from "@/components/ui/toast/ToastHost.vue";
import { createFlowStateEngine } from "@/utils/flowStateEngine.js";
import { showToast } from "@/utils/toastBus.js";
import {
  buildBookedSlotsIndex,
  buildCandidateSlotsForEventDate,
  createSlotUiModel,
  hmToLabel,
} from "@/services/bookings/utils/bookingSlotUtils.js";
import { addMinutesToHm } from "@/services/events/eventsApiUtils.js";
import { resolveCreatorIdFromContext, resolveFanIdFromContext } from "@/utils/contextIds.js";
import { logFanBookingDebug } from "@/embeds/fanBooking/debug.js";
import { normalizeCreatorPresentationInput } from "./creatorPresentation.js";

import BookingFlowStep1 from "./BookingFlowStep1.vue";
import BookingFlowStep2 from "./BookingFlowStep2.vue";
import BookingFlowStep3 from "./BookingFlowStep3.vue";
import BookingFlowStep4 from "./BookingFlowStep4.vue";
import { useChatSocket } from '@/composables/useChatSocket';
import { bookingFlowCrossWhiteIcon } from "./oneOnOneBookingFlowAssets.js";
const props = defineProps({
  creatorId: { type: [Number, String], default: null },
  fanId: { type: [Number, String], default: null },
  eventId: { type: [String, Number], default: null },
  apiBaseUrl: { type: String, default: "" },
  creatorData: { type: Object, default: null },
  embedded: { type: Boolean, default: false },
  previewMode: { type: Boolean, default: false },
  previewEvent: { type: Object, default: null },
  previewBookedSlots: { type: Array, default: () => [] },
  previewStartStep: { type: Number, default: 1 },
  previewReadOnly: { type: Boolean, default: false },
});

const emit = defineEmits(["close-request", "booking-created", "booking-failed"]);
const route = useRoute();
const isReleasingHold = ref(false);

const engine = createFlowStateEngine({
  flowId: "fan-one-on-one-booking-flow",
  initialStep: 1,
  urlSync: "none",
  defaults: {
    bookingDetails: {
      selectedDate: null,
      selectedTime: null,
      selectedDuration: { value: 15, price: 500 },
      addons: [],
      otherRequest: "",
      totalPrice: 0,
      walletBalance: 0,
      formattedTimeRange: "-",
      headerDateDisplay: "",
      selectedDateDisplay: "",
    },
    fanBooking: {
      context: {
        creatorId: null,
        fanId: null,
        isFirstBookingForCreator: null,
        creatorPresentation: {
          avatar: null,
          name: null,
          isVerified: null,
        },
        selectedEventId: null,
        selectedEvent: null,
      },
      catalog: {
        events: [],
        rawEvents: [],
        bookedSlots: [],
        bookedSlotsIndex: {},
        cachedResponse: null,
        meta: {
          etag: null,
          updatedAt: null,
          checkedAt: null,
        },
      },
      selection: {
        selectedDate: null,
        selectedSlot: null,
        selectedDurationMinutes: 15,
        selectedAddOns: [],
      },
      temporaryHold: {
        temporaryHoldId: null,
        status: "none",
        expiresAt: null,
        secondsRemaining: 0,
        createdAt: null,
        checkedAt: null,
      },
      booking: {
        result: null,
        bookingId: null,
        paymentStatus: null,
        txId: null,
        validation: null,
        lastStatus: null,
        meta: {},
      },
      ui: {
        catalogLoading: false,
        catalogError: "",
        previewMode: false,
        previewReadOnly: false,
      },
    },
  },
});

function deepClone(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_error) {
    return value;
  }
}

function normalizePreviewStartStep(step) {
  const parsed = Number(step);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

function buildPreviewBookedSlotsIndex(previewEventId, bookedSlots = []) {
  const index = buildBookedSlotsIndex(bookedSlots);
  if (!previewEventId) return index;

  const mergedByDate = {};
  Object.values(index).forEach((byDate) => {
    if (!byDate || typeof byDate !== "object") return;
    Object.entries(byDate).forEach(([dateIso, rows]) => {
      if (!Array.isArray(rows) || rows.length === 0) return;
      if (!mergedByDate[dateIso]) mergedByDate[dateIso] = [];
      rows.forEach((row) => {
        mergedByDate[dateIso].push({ ...row });
      });
    });
  });

  Object.keys(mergedByDate).forEach((dateIso) => {
    mergedByDate[dateIso].sort((left, right) => left.startMs - right.startMs);
  });

  index[previewEventId] = mergedByDate;
  return index;
}

function toLocalDateMidnight(dateIso) {
  const parsed = new Date(`${String(dateIso || "").trim()}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getPreviewDurationMinutes(event) {
  const raw = event?.raw || {};
  const parsed = Number(raw.sessionDurationMinutes ?? event?.sessionDurationMinutes ?? 15);
  if (!Number.isFinite(parsed) || parsed <= 0) return 15;
  return Math.floor(parsed);
}

function toPreviewDurationObject(event, durationMinutes) {
  const raw = event?.raw || {};
  const baseMinutes = Number(raw.sessionDurationMinutes ?? event?.sessionDurationMinutes ?? 15);
  const basePrice = Number(raw.basePriceTokens ?? event?.basePriceTokens ?? 0);
  const unitPrice = Number.isFinite(baseMinutes) && baseMinutes > 0 ? (basePrice / baseMinutes) : 0;
  const total = Math.ceil(Math.max(0, unitPrice * durationMinutes));
  return {
    value: durationMinutes,
    price: Number.isFinite(total) ? total : 0,
  };
}

function resolvePreviewDefaultSelection(event, bookedSlotsIndex, daysAhead = 45) {
  const previewEventId = String(event?.eventId || event?.id || "");
  if (!previewEventId) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = 0; offset <= daysAhead; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const dateIso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    const candidates = buildCandidateSlotsForEventDate(event, dateIso, {
      eventId: previewEventId,
      bookedSlotsIndex,
      applyBufferAfterBooked: true,
    });
    if (!Array.isArray(candidates) || candidates.length === 0) continue;

    const uiSlots = candidates.map((slot) => createSlotUiModel({
      eventId: previewEventId,
      localDateIso: dateIso,
      slot,
      bookedSlotsIndex,
    }));
    const preferred = uiSlots.find((slot) => !slot.disabled) || uiSlots[0];
    if (!preferred) continue;

    return {
      selectedDateIso: dateIso,
      selectedDate: toLocalDateMidnight(dateIso),
      selectedSlot: {
        ...preferred,
        value: preferred.startHm || preferred.value,
        label: preferred.label || hmToLabel(preferred.startHm || preferred.value || "00:00"),
      },
    };
  }

  return null;
}

function resolveCreatorId() {
  return resolveCreatorIdFromContext({
    preferredId: props.creatorId,
    route,
    engine,
    fallback: 1,
  });
}

function resolveFanId() {
  return resolveFanIdFromContext({
    preferredId: props.fanId,
    route,
    engine,
    fallback: 2,
  });
}

function syncBookingContext() {
  const creatorId = resolveCreatorId();
  const fanId = resolveFanId();
  const creatorPresentation = normalizeCreatorPresentationInput(props.creatorData || {});

  logFanBookingDebug("feature", "syncBookingContext", {
    props: {
      creatorId: props.creatorId,
      fanId: props.fanId,
      eventId: props.eventId,
      creatorData: props.creatorData,
      embedded: props.embedded,
    },
    resolved: {
      creatorId,
      fanId,
      creatorPresentation,
    },
  });

  engine.setState("fanBooking.context.creatorId", creatorId, { reason: "feature-context", silent: true });
  engine.setState("fanBooking.context.fanId", fanId, { reason: "feature-context", silent: true });
  engine.setState("fanBooking.context.creatorPresentation", creatorPresentation, { reason: "feature-context", silent: true });

  return { creatorId, fanId, creatorPresentation };
}

function clearSelectedEvent(reason = "event-clear") {
  engine.setState("fanBooking.context.selectedEventId", null, { reason, silent: true });
  engine.setState("fanBooking.context.selectedEvent", null, { reason, silent: true });
}

function resolveRequestedEventId() {
  if (props.eventId !== null && props.eventId !== undefined && props.eventId !== "") {
    return props.eventId;
  }

  const queryEventId = route.query?.eventId;
  if (queryEventId !== null && queryEventId !== undefined && queryEventId !== "") {
    return queryEventId;
  }

  return null;
}

function selectEventById(eventId) {
  if (!eventId) {
    clearSelectedEvent("event-select-empty");
    return null;
  }

  const events = engine.getState("fanBooking.catalog.events") || [];
  const selected = events.find((event) => String(event.eventId) === String(eventId) || String(event.id) === String(eventId));
  if (!selected) {
    clearSelectedEvent("event-select-missing");
    return null;
  }

  engine.setState("fanBooking.context.selectedEventId", selected.eventId || selected.id, { reason: "event-select", silent: true });
  engine.setState("fanBooking.context.selectedEvent", selected, { reason: "event-select", silent: true });
  return selected;
}

async function loadBookingContext({ forceRefresh = false } = {}) {
  const { creatorId, fanId } = syncBookingContext();
  clearSelectedEvent("catalog-load");

  logFanBookingDebug("feature", "loadBookingContext:start", {
    creatorId,
    fanId,
    forceRefresh,
  });

  if (creatorId == null || fanId == null) {
    const message = "Missing creator or fan user id for booking flow.";
    engine.setState("fanBooking.ui.catalogError", message, { reason: "catalog-load-failed", silent: true });
    showToast({
      type: "error",
      title: "Load Failed",
      message,
    });
    return { ok: false, error: { message } };
  }

  engine.setState("fanBooking.ui.catalogLoading", true, { reason: "catalog-load", silent: true });
  engine.setState("fanBooking.ui.catalogError", "", { reason: "catalog-load", silent: true });
  engine.setState("fanBooking.ui.previewMode", false, { reason: "catalog-load", silent: true });
  engine.setState("fanBooking.ui.previewReadOnly", false, { reason: "catalog-load", silent: true });

  const result = await engine.callFlow(
    "bookings.fetchCreatorBookingContext",
    { creatorId, fanId, status: "active", limit: 100, periodMonths: 6, slotLimit: 2000 },
    {
      forceRefresh,
      context: {
        stateEngine: engine,
        creatorId,
        fanId,
        apiBaseUrl: props.apiBaseUrl || undefined,
      },
    },
  );

  engine.setState("fanBooking.ui.catalogLoading", false, { reason: "catalog-load", silent: true });

  if (!result?.ok) {
    const message = result?.meta?.uiErrors?.[0] || result?.error?.message || "Could not load events.";
    engine.setState("fanBooking.ui.catalogError", message, { reason: "catalog-load-failed", silent: true });
    showToast({
      type: "error",
      title: "Load Failed",
      message,
    });
    return result;
  }

  logFanBookingDebug("feature", "loadBookingContext:success", {
    eventCount: Array.isArray(engine.getState("fanBooking.catalog.events"))
      ? engine.getState("fanBooking.catalog.events").length
      : null,
    requestedEventId: resolveRequestedEventId(),
  });

  const requestedEventId = resolveRequestedEventId();
  if (requestedEventId) {
    const selectedEvent = selectEventById(requestedEventId);
    if (!selectedEvent) {
      logFanBookingDebug("feature", "loadBookingContext:event-missing", { requestedEventId });
      showToast({
        type: "error",
        title: "Event Unavailable",
        message: "Selected event is no longer available.",
      });
      return result;
    }

    logFanBookingDebug("feature", "loadBookingContext:event-selected", {
      requestedEventId,
      selectedEventId: selectedEvent.eventId || selectedEvent.id,
    });

    await engine.forceStep(2, { intent: "feature-open-with-event-id" });
    await engine.forceSubstep(null, { intent: "feature-open-with-event-id" });
  }

  return result;
}

async function loadPreviewContext() {
  const previewEvent = deepClone(props.previewEvent);
  if (!previewEvent || typeof previewEvent !== "object") {
    const message = "Preview event is not ready yet.";
    engine.setState("fanBooking.ui.catalogError", message, { reason: "preview-load-failed", silent: true });
    showToast({
      type: "error",
      title: "Preview Unavailable",
      message,
    });
    return { ok: false, error: { message } };
  }

  syncBookingContext();

  const previewEventId = String(previewEvent.eventId || previewEvent.id || `preview_event_${resolveCreatorId()}`);
  previewEvent.id = previewEventId;
  previewEvent.eventId = previewEventId;
  previewEvent.status = previewEvent.status || "active";
  previewEvent.raw = previewEvent.raw || {};
  previewEvent.raw.eventId = previewEventId;
  previewEvent.raw.status = previewEvent.raw.status || "active";

  const previewBookedSlots = Array.isArray(props.previewBookedSlots)
    ? deepClone(props.previewBookedSlots)
    : [];
  const previewBookedSlotsIndex = buildPreviewBookedSlotsIndex(previewEventId, previewBookedSlots);
  const startStep = normalizePreviewStartStep(props.previewStartStep);
  const isReadOnlyPreview = Boolean(props.previewReadOnly);

  engine.setState("fanBooking.catalog.cachedResponse", {
    events: [previewEvent],
    rawEvents: [previewEvent.raw || {}],
    bookedSlots: previewBookedSlots,
    bookedSlotsIndex: previewBookedSlotsIndex,
    isFirstBookingForCreator: true,
    meta: { fetchedAt: Date.now(), source: "preview" },
  }, { reason: "preview-load", silent: true });
  engine.setState("fanBooking.catalog.events", [previewEvent], { reason: "preview-load", silent: true });
  engine.setState("fanBooking.catalog.rawEvents", [previewEvent.raw || {}], { reason: "preview-load", silent: true });
  engine.setState("fanBooking.catalog.bookedSlots", previewBookedSlots, { reason: "preview-load", silent: true });
  engine.setState("fanBooking.catalog.bookedSlotsIndex", previewBookedSlotsIndex, { reason: "preview-load", silent: true });
  engine.setState("fanBooking.catalog.meta", {
    ...(engine.getState("fanBooking.catalog.meta") || {}),
    fetchedAt: Date.now(),
    updatedAt: Date.now(),
    checkedAt: Date.now(),
    source: "preview",
  }, { reason: "preview-load", silent: true });
  engine.setState("fanBooking.ui.catalogLoading", false, { reason: "preview-load", silent: true });
  engine.setState("fanBooking.ui.catalogError", "", { reason: "preview-load", silent: true });
  engine.setState("fanBooking.ui.previewMode", true, { reason: "preview-load", silent: true });
  engine.setState("fanBooking.ui.previewReadOnly", isReadOnlyPreview, { reason: "preview-load", silent: true });
  engine.setState("fanBooking.context.isFirstBookingForCreator", true, { reason: "preview-load", silent: true });

  if (startStep <= 1) {
    clearSelectedEvent("preview-load");
  } else {
    engine.setState("fanBooking.context.selectedEventId", previewEventId, { reason: "preview-load", silent: true });
    engine.setState("fanBooking.context.selectedEvent", previewEvent, { reason: "preview-load", silent: true });
  }

  const defaultDurationMinutes = getPreviewDurationMinutes(previewEvent);
  const defaultSelection = resolvePreviewDefaultSelection(previewEvent, previewBookedSlotsIndex);
  const selectedDateIso = defaultSelection?.selectedDateIso || null;
  const selectedDate = defaultSelection?.selectedDate || null;
  const selectedSlot = defaultSelection?.selectedSlot || null;
  const selectedDuration = toPreviewDurationObject(previewEvent, defaultDurationMinutes);

  const formattedTimeRange = selectedSlot
    ? `${hmToLabel(selectedSlot.startHm || selectedSlot.value)}-${hmToLabel(addMinutesToHm(selectedSlot.startHm || selectedSlot.value, defaultDurationMinutes))}`
    : "-";
  const selectedDateDisplay = selectedDate
    ? selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "";

  engine.setState("bookingDetails", {
    selectedDate,
    selectedTime: selectedSlot,
    selectedDuration,
    addons: [],
    otherRequest: "",
    totalPrice: Number(selectedDuration?.price || 0),
    walletBalance: 0,
    formattedTimeRange,
    headerDateDisplay: selectedDateDisplay,
    selectedDateDisplay,
  }, { reason: "preview-load-selection", silent: true });

  engine.setState("fanBooking.selection.selectedDate", selectedDateIso, { reason: "preview-load-selection", silent: true });
  engine.setState("fanBooking.selection.selectedSlot", selectedSlot, { reason: "preview-load-selection", silent: true });
  engine.setState("fanBooking.selection.selectedDurationMinutes", defaultDurationMinutes, { reason: "preview-load-selection", silent: true });
  engine.setState("fanBooking.selection.selectedAddOns", [], { reason: "preview-load-selection", silent: true });
  engine.setState("fanBooking.selection.personalRequestText", "", { reason: "preview-load-selection", silent: true });

  engine.setState("fanBooking.temporaryHold", {
    temporaryHoldId: null,
    status: "none",
    expiresAt: null,
    secondsRemaining: 0,
    createdAt: null,
    checkedAt: null,
  }, { reason: "preview-load", silent: true });

  await engine.forceStep(startStep, { intent: "feature-open-preview" });
  await engine.forceSubstep(null, { intent: "feature-open-preview" });

  return { ok: true };
}

function hasBookingCreated() {
  return Boolean(
    engine.getState("fanBooking.booking.bookingId")
    || engine.getState("fanBooking.booking.result.bookingId"),
  );
}

function getActiveTemporaryHoldId() {
  const status = String(engine.getState("fanBooking.temporaryHold.status") || "").toLowerCase();
  const temporaryHoldId = engine.getState("fanBooking.temporaryHold.temporaryHoldId");
  if (!temporaryHoldId) return null;
  if (status && status !== "active") return null;
  return temporaryHoldId;
}

async function releaseTemporaryHoldIfNeeded({ silent = false } = {}) {
  if (props.previewMode || engine.getState("fanBooking.ui.previewMode")) return;
  if (isReleasingHold.value) return;
  if (hasBookingCreated()) return;

  const temporaryHoldId = getActiveTemporaryHoldId();
  if (!temporaryHoldId) return;

  isReleasingHold.value = true;
  try {
    const result = await engine.callFlow(
      "bookings.releaseTemporaryHold",
      { temporaryHoldId },
      {
        context: {
          stateEngine: engine,
          apiBaseUrl: props.apiBaseUrl || undefined,
        },
        forceRefresh: true,
        skipDestinationRead: true,
      },
    );

    if (!result?.ok && !silent) {
      const message = result?.error?.message || result?.meta?.uiErrors?.[0] || "Could not release slot hold.";
      showToast({
        type: "error",
        title: "Hold Release Failed",
        message,
      });
    }
  } finally {
    isReleasingHold.value = false;
  }
}

onMounted(async () => {
  logFanBookingDebug("feature", "mounted", {
    previewMode: props.previewMode,
    props: {
      creatorId: props.creatorId,
      fanId: props.fanId,
      eventId: props.eventId,
      apiBaseUrl: props.apiBaseUrl,
      creatorData: props.creatorData,
      embedded: props.embedded,
    },
  });
  engine.initialize();

  if (props.previewMode) {
    await loadPreviewContext();
    return;
  }

  if(  props.fanId ) {
    const s = useChatSocket(props.fanId)
    s.init()
  }

  await engine.forceStep(1, { intent: "feature-mount" });
  await engine.forceSubstep(null, { intent: "feature-mount" });
  clearSelectedEvent("feature-mount");
  await loadBookingContext();
});

onBeforeUnmount(() => {
  logFanBookingDebug("feature", "before-unmount");
  releaseTemporaryHoldIfNeeded({ silent: true });
});

const currentStepComponent = computed(() => {
  switch (engine.step) {
    case 1:
      return BookingFlowStep1;
    case 2:
      return BookingFlowStep2;
    case 3:
      return BookingFlowStep3;
    case 4:
      return BookingFlowStep4;
    default:
      return BookingFlowStep1;
  }
});
</script>

<template>
  <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex w-full items-center justify-center lg:w-[852px]">
    <div
        @click="emit('close-popup')"
        class="absolute -top-4 -right-3 z-[999] p-[8px] flex justify-center items-center bg-black/30 rounded-[50px] backdrop-blur-[10px] cursor-pointer"
      >
        <img :src="bookingFlowCrossWhiteIcon" alt="cross-white" class="w-4 h-4" />
      </div>
    <component
      :is="currentStepComponent"
      :engine="engine"
      :embedded="embedded"
      :api-base-url="apiBaseUrl"
      @close-popup="emit('close-request')"
      @retry-catalog="previewMode ? loadPreviewContext() : loadBookingContext({ forceRefresh: true })"
      @booking-created="emit('booking-created', $event)"
      @booking-failed="emit('booking-failed', $event)"
    />
    <ToastHost />
  </div>
</template>
