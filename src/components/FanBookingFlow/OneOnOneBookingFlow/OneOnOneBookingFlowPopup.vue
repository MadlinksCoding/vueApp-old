<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue";
import { useRoute } from "vue-router";
import PopupHandler from "@/components/ui/popup/PopupHandler.vue";
import ToastHost from "@/components/ui/toast/ToastHost.vue";
import { createFlowStateEngine } from "@/utils/flowStateEngine.js";
import { showToast } from "@/utils/toastBus.js";

import BookingFlowStep1 from "./BookingFlowStep1.vue";
import BookingFlowStep2 from "./BookingFlowStep2.vue";
import BookingFlowStep3 from "./BookingFlowStep3.vue";
import BookingFlowStep4 from "./BookingFlowStep4.vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  creatorId: { type: [Number, String], default: null },
  fanUserId: { type: [Number, String], default: null },
  eventId: { type: [String, Number], default: null },
});

const emit = defineEmits(["update:modelValue", "booking-created", "booking-failed"]);
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
        fanUserId: null,
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
      },
    },
  },
});

function toNumber(value, fallback = null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function resolveCreatorId() {
  return 1;
  return (
    toNumber(props.creatorId, null)
    ?? toNumber(route.query?.creatorId, null)
    ?? toNumber(engine.getState("fanBooking.context.creatorId"), null)
    ?? toNumber(window.localStorage?.getItem("creatorId"), null)
    ?? 1
  );
}

function resolveFanUserId() {
  return localStorage.getItem('userId') ?? 2;
  return (
    toNumber(props.fanUserId, null)
    ?? toNumber(route.query?.userId, null)
    ?? toNumber(window.localStorage?.getItem("userId"), null)
    ?? 2
  );
}

function syncBookingContext() {
  const creatorId = resolveCreatorId();
  const fanUserId = resolveFanUserId();

  engine.setState("fanBooking.context.creatorId", creatorId, { reason: "popup-context", silent: true });
  engine.setState("fanBooking.context.fanUserId", fanUserId, { reason: "popup-context", silent: true });

  return { creatorId, fanUserId };
}

function selectEventById(eventId) {
  if (!eventId) return;

  const events = engine.getState("fanBooking.catalog.events") || [];
  const selected = events.find((event) => String(event.eventId) === String(eventId) || String(event.id) === String(eventId));
  if (!selected) return;

  engine.setState("fanBooking.context.selectedEventId", selected.eventId || selected.id, { reason: "event-select", silent: true });
  engine.setState("fanBooking.context.selectedEvent", selected, { reason: "event-select", silent: true });
}

async function loadBookingContext({ forceRefresh = false } = {}) {
  const { creatorId, fanUserId } = syncBookingContext();

  if (!creatorId || !fanUserId) {
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

  const result = await engine.callFlow(
    "bookings.fetchCreatorBookingContext",
    { creatorId, status: "active", limit: 100, periodMonths: 6, slotLimit: 2000 },
    {
      forceRefresh,
      context: { stateEngine: engine },
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

  const preselectedEventId = props.eventId || route.query?.eventId || engine.getState("fanBooking.context.selectedEventId");
  if (preselectedEventId) {
    selectEventById(preselectedEventId);
  }

  return result;
}

function hasBookingCreated() {
  return Boolean(
    engine.getState("fanBooking.booking.bookingId")
    || engine.getState("fanBooking.booking.result.bookingId")
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
        context: { stateEngine: engine },
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

async function handlePopupModelValueUpdate(val) {
  if (!val) {
    await releaseTemporaryHoldIfNeeded({ silent: true });
  }
  emit("update:modelValue", val);
}

onMounted(() => {
  engine.initialize();
});

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (!isOpen) {
      await releaseTemporaryHoldIfNeeded({ silent: true });
      return;
    }
    await engine.forceStep(1, { intent: "open-popup" });
    engine.forceSubstep(null, { intent: "open-popup" });
    await loadBookingContext();
  },
  { immediate: false },
);

onBeforeUnmount(() => {
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

// ... (config remains same) ...
const oneOnOneBookingFlowPopupConfig = {
  actionType: "popup",
  position: "center",
  customEffect: "scale",
  offset: "0px",
  speed: "250ms",
  effect: "ease-in-out",
  showOverlay: false,
  closeOnOutside: true,
  lockScroll: false,
  escToClose: true,
  width: { default: "auto", "<500px": "90%" },
  height: { default: "90%", "<768": "90%" },
  scrollable: true,
  closeSpeed: "250ms",
  closeEffect: "cubic-bezier(0.4, 0, 0.2, 1)",
};

</script>

<template>
  <PopupHandler
    :modelValue="modelValue"
    @update:modelValue="handlePopupModelValueUpdate"
    :config="oneOnOneBookingFlowPopupConfig"
  >
    <component 
      :is="currentStepComponent" 
      :engine="engine"
      @close-popup="emit('update:modelValue', false)"
      @retry-catalog="loadBookingContext({ forceRefresh: true })"
    />
    <ToastHost />
  </PopupHandler>
</template>
