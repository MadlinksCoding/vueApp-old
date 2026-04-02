<template>
  <div v-if="!hasDashboardContext" class="flex min-h-[24rem] items-center justify-center rounded-xl bg-white/70 p-6 text-center">
    <div>
      <h2 class="text-base font-semibold text-slate-700">Waiting for dashboard context</h2>
      <p class="mt-2 text-sm text-slate-500">
        The events embed will load once a valid {{ isFan ? "fan" : "creator" }} id is provided.
      </p>
    </div>
  </div>

  <div
    v-else
    :class="[
      embedded ? 'h-full min-h-0' : 'h-[calc(100vh-2rem)]',
      'flex flex-col overflow-hidden relative'
    ]"
  >
    <div class="flex w-full h-full">
      <MainCalendar
        ref="mainCalendarRef"
        class="flex-1 w-full h-full overflow-y-auto relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        variant="default"
        :focus-date="state.focus"
        :events="events1"
        :theme="theme1"
        :can-review-pending="isCreator"
        :data-attrs="{ 'data-calendar': 'main' }"
        :console-overlaps="true"
        :highlight-today-column="true"
        time-start="00:00"
        time-end="24:00"
        :slot-minutes="60"
        :row-height-px="64"
        :min-event-height-px="0"
        @date-selected="onSelectFromMain"
        @join-call="handleJoin"
        @approve-booking="onApprovePendingBooking"
        @reject-booking="onRejectPendingBooking"
        @cancel-booking="onCancelBookingFromCalendar"
      >
        <template #event="{ event, style, onClick, view }">
          <div
            :class="[
              view === 'month' ? 'static' : 'absolute',
              event?.isAvailabilityBlock ? 'pointer-events-none' : '',
              'py-[0.125rem] px-[0.25rem] rounded-[0.375rem] text-xs shadow-custom min-h-[2.375rem]'
            ]"
            :style="[style, getCalendarEventStyle(event)]"
            @click.stop="!event?.isAvailabilityBlock && onClick(event)"
          >
            <template v-if="!event?.isAvailabilityBlock">
              <div class="flex items-center font-medium truncate">{{ event.title }}</div>
              <div class="text-[10px]">{{ hhmm(event.start) }} - {{ hhmm(event.end) }}</div>
            </template>
          </div>
        </template>

        <template #event-alt="{ event, style, onClick, view }">
          <div
            :class="[
              view === 'month' ? 'static' : 'absolute',
              event?.isAvailabilityBlock ? 'pointer-events-none' : '',
              'py-[0.125rem] px-[0.25rem] rounded-lg text-xs shadow-custom'
            ]"
            :style="[style, getCalendarEventStyle(event)]"
            @click.stop="!event?.isAvailabilityBlock && onClick(event)"
          >
            <template v-if="!event?.isAvailabilityBlock">
              <div class="font-semibold truncate">{{ event.title }}</div>
              <div class="opacity-90 text-[10px]">{{ hhmm(event.start) }} - {{ hhmm(event.end) }}</div>
            </template>
          </div>
        </template>

        <template #event-custom="{ event, style, onClick, view }">
          <div
            :class="[
              view === 'month' ? 'static' : 'absolute',
              event?.isAvailabilityBlock ? 'pointer-events-none' : '',
              'py-[0.125rem] px-[0.25rem] rounded-lg text-xs shadow-md min-h-[38px]'
            ]"
            :style="[style, getCalendarEventStyle(event)]"
            @click.stop="!event?.isAvailabilityBlock && onClick(event)"
          >
            <template v-if="!event?.isAvailabilityBlock">
              <div class="font-semibold truncate">{{ event.title }}</div>
              <div class="opacity-90 text-[10px]">{{ hhmm(event.start) }} - {{ hhmm(event.end) }}</div>
            </template>
          </div>
        </template>

        <template #event-custom2="{ event, style, onClick, view }">
          <div
            :class="[
              view === 'month' ? 'static' : 'absolute',
              event?.isAvailabilityBlock ? 'pointer-events-none' : '',
              'py-[0.125rem] px-[0.25rem] rounded-lg shadow-md'
            ]"
            :style="[style, getCalendarEventStyle(event)]"
            @click.stop="!event?.isAvailabilityBlock && onClick(event)"
          >
            <template v-if="!event?.isAvailabilityBlock">
              <div class="font-bold text-[0.75rem] truncate">{{ event.title }}</div>
              <div class="text-[10px]">{{ hhmm(event.start) }} - {{ hhmm(event.end) }}</div>
            </template>
          </div>
        </template>

        <template #event-availability="{ event, style, view }">
          <div
            :class="[
              view === 'month' ? 'static' : 'absolute',
              'pointer-events-none rounded-md min-h-[6px] w-full'
            ]"
            :style="[style, getCalendarEventStyle(event)]"
          />
        </template>
      </MainCalendar>

      <div
        :class="['hidden lg:flex flex-col gap-[16px] px-[24px] h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]', !embedded && 'pt-12']"
      >
        <MiniCalendar
          class="md:col-span-1"
          :month-date="state.focus"
          :selected-date="state.selected || state.focus"
          :events="miniEvents"
          :theme="theme1"
          :data-attrs="{ 'data-calendar': 'mini' }"
          @date-selected="onSelectFromMini"
        />

        <div
          v-if="dashboardEventsEngine.state.events.error"
          class="px-3 py-2 rounded bg-red-50 text-red-700 text-xs font-medium"
        >
          {{ dashboardEventsEngine.state.events.error }}
        </div>
        <div
          v-else-if="dashboardEventsEngine.state.events.loading"
          class="px-3 py-2 rounded bg-gray-100 text-gray-600 text-xs font-medium"
        >
          Loading booked slots...
        </div>

        <div v-if="isCreator" class="relative w-full z-[999]" ref="popupTrigger">
          <ButtonComponent
            text="NEW EVENTS"
            variant="none"
            customClass="group w-full h-12 min-h-10 px-4 py-2 text-base font-semibold bg-black rounded-[48px] inline-flex justify-center items-center gap-2 text-[#07F468] hover:text-black hover:bg-[#07F468]"
            :leftIcon="'https://i.ibb.co.com/RpWmJkcb/plus.webp'"
            :leftIconClass="'w-6 h-6 transition duration-200 group-hover:[filter:brightness(0)_saturate(100%)]'"
            @click="togglePopup"
          />

          <div v-show="isCreatePopupOpen" class="fixed z-[999]" :style="popupStyle">
            <CreateEventPopup
              @create-private="goToCreateEvent('private')"
              @create-group="goToCreateEvent('group')"
            />
          </div>
        </div>

        <div>
          <EventsWidget
            :sections="eventsData"
            @join-click="handleJoin"
            @reply-click="handleReply"
            @event-click="handleWidgetEventClick"
            @menu-action="handleWidgetMenuAction"
          />
        </div>
      </div>

      <div v-if="isCreator" class="fixed bottom-5 right-5 z-50 lg:hidden" ref="floatingPopupTrigger">
        <button
          class="bg-[#ff0464] w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          @click="toggleFloatingPopup"
        >
          <img
            src="https://i.ibb.co.com/RpWmJkcb/plus.webp"
            class="w-6 h-6 filter brightness-0 invert"
            alt="Add"
          />
        </button>
        <div
          v-show="isFloatingPopupOpen"
          class="w-full md:w-auto bg-white/90 rounded shadow-[0px_0px_12px_0px_rgba(0,0,0,0.10)] backdrop-blur-[50px] inline-flex flex-col justify-start items-start overflow-hidden !fixed !bottom-0 !right-0 !top-auto !left-auto"
        >
          <CreateEventPopup
            @create-private="goToCreateEvent('private')"
            @create-group="goToCreateEvent('group')"
          />
        </div>
      </div>
    </div>

    <PopupHandler v-if="isCreator" v-model="newEventsPopupOpen" :config="newEventsPopupConfig">
      <NewEventsPopup
        @create-private="goToCreateEvent('private')"
        @create-group="goToCreateEvent('group')"
      />
    </PopupHandler>

    <PopupHandler v-model="cancelBookingPopupOpen" :config="cancelBookingPopupConfig">
      <div class="w-[30.9375rem] border border-[#EAECF0] bg-white p-4 shadow-xl">
        <h3 class="text-[1rem] font-semibold text-gray-700">Are you sure you want to cancel this call?</h3>
        <p class="mt-2 text-black">
          This will cancel the booking and refund the tokens back to the fan.
        </p>
        <div class="mt-2 bg-gray-50 px-3 py-2 text-[0.75rem] text-gray-700">
          <p class="font-semibold truncate">{{ cancelBookingCandidateTitle }}</p>
          <p v-if="cancelBookingCandidateTime" class="mt-1">{{ cancelBookingCandidateTime }}</p>
        </div>
        <div class="mt-2 flex items-center justify-center gap-2">
          <button
            type="button"
            class="h-9 px-3 text-base font-medium leading-6 text-[#ff4405] hover:bg-gray-50"
            :disabled="cancelBookingLoading"
            @click="closeCancelBookingPopup"
          >
            Keep Booking
          </button>
          <button
            type="button"
            class="h-9 bg-[#ff4405] px-3 text-base font-medium leading-6 text-white hover:bg-[#ff692e] disabled:opacity-60"
            :disabled="cancelBookingLoading"
            @click="confirmCancelBooking"
          >
            {{ cancelBookingLoading ? 'Cancelling...' : 'Cancel Booking' }}
          </button>
        </div>
      </div>
    </PopupHandler>

    <ToastHost />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { hhmm } from "@/utils/calendarHelpers.js";
import MiniCalendar from "@/components/calendar/MiniCalendar.vue";
import MainCalendar from "@/components/calendar/MainCalendar.vue";
import ButtonComponent from "@/components/dev/button/ButtonComponent.vue";
import EventsWidget from "@/components/calendar/EventsWidget.vue";
import CreateEventPopup from "@/components/calendar/CreateEventPopup.vue";
import NewEventsPopup from "@/components/calendar/NewEventsPopup.vue";
import PopupHandler from "@/components/ui/popup/PopupHandler.vue";
import ToastHost from "@/components/ui/toast/ToastHost.vue";
import { createFlowStateEngine } from "@/utils/flowStateEngine.js";
import { mapBookedSlotsToCalendarEvents, mapAvailabilityToCalendarEvents } from "@/services/bookings/utils/bookingSlotUtils.js";
import { showToast } from "@/utils/toastBus.js";
import { getBookingJoinState } from "@/utils/bookingJoinUtils.js";
import {
  fireAndForgetCreateScheduleNotify,
  getCreateScheduleNotifyPayload,
  shouldFireCreateScheduleAfterApproval,
} from "@/utils/bookingScheduleNotify.js";
import { resolveFanIdFromContext, toNumberOr } from "@/utils/contextIds.js";

const props = defineProps({
  creatorId: {
    type: [Number, String],
    default: null,
  },
  userRole: {
    type: String,
    default: "creator",
  },
  fanId: {
    type: [Number, String],
    default: null,
  },
  apiBaseUrl: {
    type: String,
    default: "",
  },
  embedded: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["create-event", "open-url"]);

const EVENT_TYPE_COLOR_STORAGE_KEY = "calendar:eventTypeColors";
const DEFAULT_EVENT_TYPE_COLORS = Object.freeze({
  video: "#5549FF",
  audio: "#06B6D4",
  groupCall: "#E11D48",
});

const isCreatePopupOpen = ref(false);
const newEventsPopupOpen = ref(false);
const reviewPendingLoading = ref(false);
const mainCalendarRef = ref(null);
const cancelBookingPopupOpen = ref(false);
const cancelBookingLoading = ref(false);
const cancelBookingCandidate = ref(null);
const eventTypeColors = ref({ ...DEFAULT_EVENT_TYPE_COLORS });
const isFloatingPopupOpen = ref(false);
const popupTrigger = ref(null);
const popupStyle = reactive({ top: "0px", left: "0px" });
const isMounted = ref(false);

const normalizedCreatorId = computed(() => toNumberOr(props.creatorId, null));
const normalizedFanId = computed(() => resolveFanIdFromContext({
  preferredId: props.fanId,
  fallback: null,
}));
const isCreator = computed(() => props.userRole === "creator");
const isFan = computed(() => props.userRole === "fan");
const hasDashboardContext = computed(() => (
  isFan.value
    ? normalizedFanId.value != null
    : normalizedCreatorId.value != null
));

const dashboardEventsEngine = createFlowStateEngine({
  flowId: "dashboard-events-flow",
  initialStep: 1,
  urlSync: "none",
  defaults: {
    events: {
      cachedResponse: null,
      list: [],
      bookedList: [],
      catalogEvents: [],
      rawEvents: [],
      bookedSlotsRaw: [],
      bookedSlotsIndex: {},
      meta: {},
      loading: false,
      error: null,
    },
  },
});

const newEventsPopupConfig = {
  actionType: "slidein",
  from: "right",
  offset: "0px",
  verticalAlign: "bottom",
  width: { default: "384px", "<768": "100%" },
  height: { default: "auto" },
  speed: "300ms",
  effect: "ease-in-out",
  showOverlay: false,
  closeOnOutside: true,
  lockScroll: false,
};

const cancelBookingPopupConfig = {
  actionType: "popup",
  position: "center",
  customEffect: "scale",
  offset: "0px",
  speed: "250ms",
  effect: "ease-in-out",
  showOverlay: true,
  closeOnOutside: true,
  lockScroll: true,
  escToClose: true,
  width: { default: "auto", "<480": "90%" },
  height: "auto",
  scrollable: false,
};

const state = reactive({
  focus: new Date(),
  selected: null,
  view: "week",
});

const theme1 = computed(() => ({
  mini: {
    wrapper: "flex flex-col w-full font-medium text-gray-500 mt-[10px] gap-[0.625rem] rounded-xl w-[20.375rem]",
    header: "font-semibold",
    dayBase: "w-[37.43px] h-[37px] rounded-full flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500",
    outside: "opacity-0",
    expired: "opacity-100",
    today: "bg-gray-500 font-semibold text-white",
    selected: "rounded-full",
    dot: "mt-[2rem] w-1.5 h-1.5 rounded-full absolute",
  },
  main: {
    wrapper: `relative flex flex-col gap-0 overflow-hidden rounded-xl h-full px-2 md:px-4 lg:pl-6 lg:pr-0 pt-6 ${props.embedded ? '' : ''}`,
    title: "sm:text-[1.5rem] text-[16px] font-semibold text-slate-800",
    xHeader: "text-[11px] uppercase tracking-wide text-slate-500 top-[1px] sticky w-full backdrop-blur-md z-10",
    axisXLabel: "flex flex-col justify-end pb-[0.75rem] w-[4.875rem]",
    axisXDay: "py-1 text-center h-[63.92px]",
    axisXToday: "bg-gray-500 text-white rounded-full w-8 h-8 flex items-center justify-center",
    axisYRow: "h-[62.62px] uppercase text-right pr-2 w-[2.4rem] lg:w-[4.8rem] text-gray-400 text-xs font-medium leading-4",
    colBase: "relative bg-white/20",
    gridRow: "h-[64px] border-b border-white/50",
    eventBase: "absolute mx-1 rounded-md border border-stone-100 bg-white p-2 text-xs shadow-sm",
  },
  month: {
    weekHeader: "text-[11px] uppercase tracking-wide text-slate-500",
    cellBase: "h-full w-full p-1 sm:p-2 text-left hover:bg-slate-50 focus:outline-none focus:border-2 focus:border-emerald-500 border border-white/50 flex flex-col items-start justify-start overflow-hidden",
    outside: "opacity-40",
    today: "border-2 border-emerald-500",
    cellEvent: "w-full text-[9px] sm:text-[11px] px-1 sm:px-2 py-0.5 sm:py-1 rounded-md bg-slate-100 border border-slate-200 truncate cursor-pointer",
  },
}));

const DEFAULT_EVENT_COLOR = "#5549FF";

const toggleFloatingPopup = () => {
  isFloatingPopupOpen.value = !isFloatingPopupOpen.value;
};

const updatePopupPosition = () => {
  if (!popupTrigger.value) return;
  const rect = popupTrigger.value.getBoundingClientRect();
  popupStyle.top = `${rect.bottom + 8}px`;
  popupStyle.left = `${rect.right - 429}px`;
};

const togglePopup = () => {
  isCreatePopupOpen.value = !isCreatePopupOpen.value;
  if (isCreatePopupOpen.value) {
    updatePopupPosition();
  }
};

const handlePositionUpdate = () => {
  if (isCreatePopupOpen.value) updatePopupPosition();
};

const handleClickOutside = (event) => {
  if (!isCreatePopupOpen.value) return;
  const path = event.composedPath ? event.composedPath() : [];
  if (popupTrigger.value && !path.includes(popupTrigger.value)) {
    isCreatePopupOpen.value = false;
  }
};

function normalizeHexColor(color, fallback = DEFAULT_EVENT_COLOR) {
  if (typeof color !== "string") return fallback;
  const normalized = color.trim();
  if (/^#([0-9a-fA-F]{3}){1,2}$/.test(normalized)) return normalized;
  return fallback;
}

function loadEventTypeColorsFromStorage() {
  if (typeof window === "undefined") return { ...DEFAULT_EVENT_TYPE_COLORS };
  try {
    const raw = window.localStorage?.getItem(EVENT_TYPE_COLOR_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_EVENT_TYPE_COLORS };
    const parsed = JSON.parse(raw);
    return {
      video: normalizeHexColor(parsed?.video, DEFAULT_EVENT_TYPE_COLORS.video),
      audio: normalizeHexColor(parsed?.audio, DEFAULT_EVENT_TYPE_COLORS.audio),
      groupCall: normalizeHexColor(parsed?.groupCall, DEFAULT_EVENT_TYPE_COLORS.groupCall),
    };
  } catch (_error) {
    return { ...DEFAULT_EVENT_TYPE_COLORS };
  }
}

function resolveTypeColor({ callType = "", eventType = "" } = {}) {
  const normalizedEventType = String(eventType || "").toLowerCase();
  if (normalizedEventType.includes("group")) {
    return normalizeHexColor(eventTypeColors.value?.groupCall, DEFAULT_EVENT_TYPE_COLORS.groupCall);
  }

  const normalizedCallType = String(callType || "").toLowerCase();
  if (normalizedCallType.includes("audio")) {
    return normalizeHexColor(eventTypeColors.value?.audio, DEFAULT_EVENT_TYPE_COLORS.audio);
  }

  return normalizeHexColor(eventTypeColors.value?.video, DEFAULT_EVENT_TYPE_COLORS.video);
}

function hexToRgb(hexColor = DEFAULT_EVENT_COLOR) {
  const hex = normalizeHexColor(hexColor).replace("#", "");
  const full = hex.length === 3 ? hex.split("").map((char) => char + char).join("") : hex;
  const number = Number.parseInt(full, 16);
  return {
    r: (number >> 16) & 255,
    g: (number >> 8) & 255,
    b: number & 255,
  };
}

function rgba(hexColor, alpha = 1) {
  const { r, g, b } = hexToRgb(hexColor);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getCalendarEventStyle(event) {
  if (event?.isAvailabilityBlock) {
    return {
      backgroundColor: "rgba(152, 162, 179, 0.18)",
      border: "1px solid rgba(152, 162, 179, 0.16)",
      color: "transparent",
      zIndex: 1,
    };
  }

  const color = normalizeHexColor(
    event?.color || event?.eventColorSkin || event?.raw?.eventColorSkin || DEFAULT_EVENT_COLOR,
    DEFAULT_EVENT_COLOR,
  );

  return {
    backgroundColor: rgba(color, 0.22),
    border: `1px solid ${rgba(color, 0.35)}`,
    borderBottom: `1px solid ${color}`,
    color,
    zIndex: 2,
  };
}

function asDate(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function sameDay(leftDate, rightDate) {
  return (
    leftDate.getFullYear() === rightDate.getFullYear()
    && leftDate.getMonth() === rightDate.getMonth()
    && leftDate.getDate() === rightDate.getDate()
  );
}

function isInCurrentWeek(date, now) {
  const dayIndex = now.getDay();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(now.getDate() - dayIndex);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return date >= start && date <= end;
}

function formatWidgetTime(startDate, endDate) {
  return `${hhmm(startDate)}-${hhmm(endDate)}`;
}

function makeAvatar(event) {
  return [{
    src: "https://i.ibb.co/XZHymffZ/avatar-of-a-mango.png",
    name: event?.raw?.creatorName || "Creator",
  }];
}

function toWidgetItem(event, options = {}) {
  const startDate = asDate(event.start) || new Date();
  const endDate = asDate(event.end) || startDate;
  const isGroup = event.type === "group-event";
  const bookingId = event?.bookingId || event?.raw?.bookingId || null;
  const joinState = getBookingJoinState({
    bookingId,
    startAt: event?.start,
    endAt: event?.end,
    status: event?.status || event?.raw?.status || "",
  });
  const accentColor = resolveTypeColor({
    callType: event?.eventCallType || event?.raw?.eventCallType || "",
    eventType: event?.type || event?.raw?.eventType || event?.raw?.type || "",
  });

  const styles = isGroup
    ? { titleColorClass: "text-activePink", borderClass: "bg-brightPink" }
    : { titleColorClass: "text-lightViolet", borderClass: "bg-lightViolet" };

  if (options.layout === "today") {
    return {
      time: formatWidgetTime(startDate, endDate),
      title: event.title,
      titleColorClass: styles.titleColorClass,
      borderClass: styles.borderClass,
      bgClass: "bg-gradient-to-r from-gray-50/50 to-gray-50/20",
      showJoin: joinState.canJoin,
      joinUrl: joinState.joinUrl,
      statusText: event.status === "active" ? "active" : event.status,
      avatars: makeAvatar(event),
      sourceEvent: event,
      accentColor,
    };
  }

  return {
    dayName: startDate.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
    dayNumber: String(startDate.getDate()),
    title: event.title,
    titleColorClass: styles.titleColorClass,
    borderClass: styles.borderClass,
    bgClass: "bg-gradient-to-r from-gray-50/50 to-gray-50/20",
    isGroup,
    groupText: isGroup ? "Group event" : undefined,
    showReply: options.showReply === true,
    avatars: makeAvatar(event),
    sourceEvent: event,
    accentColor,
  };
}

function resetEventsState() {
  dashboardEventsEngine.setState("events.error", null, { reason: "events-reset", silent: true });
  dashboardEventsEngine.setState("events.loading", false, { reason: "events-reset", silent: true });
  dashboardEventsEngine.setState("events.list", [], { reason: "events-reset", silent: true });
  dashboardEventsEngine.setState("events.bookedList", [], { reason: "events-reset", silent: true });
  dashboardEventsEngine.setState("events.catalogEvents", [], { reason: "events-reset", silent: true });
  dashboardEventsEngine.setState("events.rawEvents", [], { reason: "events-reset", silent: true });
  dashboardEventsEngine.setState("events.bookedSlotsRaw", [], { reason: "events-reset", silent: true });
  dashboardEventsEngine.setState("events.bookedSlotsIndex", {}, { reason: "events-reset", silent: true });
}

function buildCalendarSlotsFromContext({
  catalogEvents = [],
  bookedSlotsRaw = [],
  bookedSlotsIndex = {},
  focusDate = new Date(),
}) {
  const calendarSlots = mapBookedSlotsToCalendarEvents(bookedSlotsRaw, {
    includeStatuses: ["pending", "pending_hold", "confirmed", "completed"],
    titleFallback: "Booked Slot",
  });

  const colorByEventId = new Map(
    catalogEvents
      .map((event) => [
        String(event?.eventId || event?.id || ""),
        event?.eventColorSkin || event?.raw?.eventColorSkin || DEFAULT_EVENT_COLOR,
      ])
      .filter(([eventId]) => Boolean(eventId)),
  );
  const callTypeByEventId = new Map(
    catalogEvents
      .map((event) => [
        String(event?.eventId || event?.id || ""),
        String(event?.eventCallType || event?.raw?.eventCallType || "").toLowerCase(),
      ])
      .filter(([eventId]) => Boolean(eventId)),
  );
  const eventTypeByEventId = new Map(
    catalogEvents
      .map((event) => [
        String(event?.eventId || event?.id || ""),
        String(event?.type || event?.eventType || event?.raw?.type || event?.raw?.eventType || "").toLowerCase(),
      ])
      .filter(([eventId]) => Boolean(eventId)),
  );

  const bookedCalendarSlots = calendarSlots.map((slot) => ({
    ...slot,
    eventCallType: callTypeByEventId.get(String(slot?.eventId || "")) || String(slot?.raw?.eventCallType || "").toLowerCase(),
    color: resolveTypeColor({
      callType: callTypeByEventId.get(String(slot?.eventId || "")) || String(slot?.raw?.eventCallType || ""),
      eventType: eventTypeByEventId.get(String(slot?.eventId || "")) || String(slot?.raw?.eventType || slot?.type || ""),
    }) || colorByEventId.get(String(slot?.eventId || "")) || DEFAULT_EVENT_COLOR,
    raw: {
      ...(slot?.raw || {}),
      eventCallType: callTypeByEventId.get(String(slot?.eventId || "")) || String(slot?.raw?.eventCallType || "").toLowerCase(),
    },
  }));

  const availabilitySlots = mapAvailabilityToCalendarEvents(catalogEvents, {
    bookedSlotsIndex,
    focusDate,
    rangeDaysBefore: 14,
    rangeDaysAfter: 56,
  }).map((slot) => ({
    ...slot,
    color: "#98A2B3",
    eventCallType: callTypeByEventId.get(String(slot?.eventId || "")) || String(slot?.eventCallType || "").toLowerCase(),
    raw: {
      ...(slot?.raw || {}),
      eventCallType: callTypeByEventId.get(String(slot?.eventId || "")) || String(slot?.eventCallType || "").toLowerCase(),
    },
  }));

  return {
    bookedCalendarSlots,
    calendarSlots: [...availabilitySlots, ...bookedCalendarSlots],
  };
}

const rebuildAvailabilityForFocusDate = () => {
  const catalogEvents = dashboardEventsEngine.state?.events?.catalogEvents;
  const bookedSlotsRaw = dashboardEventsEngine.state?.events?.bookedSlotsRaw;
  const bookedSlotsIndex = dashboardEventsEngine.state?.events?.bookedSlotsIndex;

  if (!Array.isArray(catalogEvents) || catalogEvents.length === 0) return;
  if (!Array.isArray(bookedSlotsRaw)) return;

  const { bookedCalendarSlots, calendarSlots } = buildCalendarSlotsFromContext({
    catalogEvents,
    bookedSlotsRaw,
    bookedSlotsIndex: bookedSlotsIndex || {},
    focusDate: state.focus,
  });

  dashboardEventsEngine.setState("events.bookedList", bookedCalendarSlots, { reason: "events-focus", silent: true });
  dashboardEventsEngine.setState("events.list", calendarSlots, { reason: "events-focus", silent: true });
};

const fetchDashboardContext = async (forceRefresh = false) => {
  const creatorId = normalizedCreatorId.value;
  const fanId = normalizedFanId.value;

  if (!hasDashboardContext.value) {
    resetEventsState();
    return;
  }

  dashboardEventsEngine.setState("creatorId", creatorId, { reason: "events-fetch", silent: true });
  dashboardEventsEngine.setState("fanId", fanId, { reason: "events-fetch", silent: true });
  dashboardEventsEngine.setState("events.loading", true, { reason: "events-fetch", silent: true });

  const result = await dashboardEventsEngine.callFlow(
    "bookings.fetchDashboardBookingContext",
    {
      creatorId: isCreator.value ? creatorId : null,
      fanId: isFan.value ? fanId : null,
      userRole: props.userRole,
      status: "active",
      periodMonths: 6,
      slotLimit: 1000,
      statusIn: "pending,pending_hold,confirmed,completed",
    },
    {
      forceRefresh,
      context: {
        stateEngine: dashboardEventsEngine,
        creatorId,
        apiBaseUrl: props.apiBaseUrl || undefined,
      },
    },
  );

  if (!result?.ok) {
    const message = result?.meta?.uiErrors?.[0]
      || result?.error?.message
      || "Could not load booked slots.";
    dashboardEventsEngine.setState("events.error", message, { reason: "events-fetch" });
    dashboardEventsEngine.setState("events.list", [], { reason: "events-fetch", silent: true });
    dashboardEventsEngine.setState("events.bookedList", [], { reason: "events-fetch", silent: true });
    dashboardEventsEngine.setState("events.catalogEvents", [], { reason: "events-fetch", silent: true });
    dashboardEventsEngine.setState("events.rawEvents", [], { reason: "events-fetch", silent: true });
    dashboardEventsEngine.setState("events.bookedSlotsRaw", [], { reason: "events-fetch", silent: true });
    dashboardEventsEngine.setState("events.bookedSlotsIndex", {}, { reason: "events-fetch", silent: true });
  } else {
    const catalogEvents = Array.isArray(result?.data?.events) ? result.data.events : [];
    const rawEvents = Array.isArray(result?.data?.rawEvents) ? result.data.rawEvents : [];
    const bookedSlotsRaw = Array.isArray(result?.data?.bookedSlots) ? result.data.bookedSlots : [];
    const bookedSlotsIndex = result?.data?.bookedSlotsIndex || {};

    dashboardEventsEngine.setState("events.catalogEvents", catalogEvents, { reason: "events-fetch", silent: true });
    dashboardEventsEngine.setState("events.rawEvents", rawEvents, { reason: "events-fetch", silent: true });
    dashboardEventsEngine.setState("events.bookedSlotsRaw", bookedSlotsRaw, { reason: "events-fetch", silent: true });
    dashboardEventsEngine.setState("events.bookedSlotsIndex", bookedSlotsIndex, { reason: "events-fetch", silent: true });

    const { bookedCalendarSlots, calendarSlots } = buildCalendarSlotsFromContext({
      catalogEvents,
      bookedSlotsRaw,
      bookedSlotsIndex,
      focusDate: state.focus,
    });
    dashboardEventsEngine.setState("events.bookedList", bookedCalendarSlots, { reason: "events-fetch", silent: true });
    dashboardEventsEngine.setState("events.list", calendarSlots, { reason: "events-fetch", silent: true });
    dashboardEventsEngine.setState("events.error", null, { reason: "events-fetch", silent: true });
  }

  dashboardEventsEngine.setState("events.loading", false, { reason: "events-fetch", silent: true });
};

const resolveBookingIdFromPayload = (payload) => {
  const id = payload?.bookingId || payload?.event?.bookingId || payload?.event?.raw?.bookingId || null;
  return id ? String(id) : null;
};

const resolveEventForApprovalNotification = (payload, result) => (
  payload?.event
  || payload?.sourceEvent
  || result?.data?.item?.eventSnapshot
  || result?.data?.item?.eventCurrent
  || result?.data?.item
  || null
);

const reviewPendingBooking = async (payload, decision) => {
  if (!isCreator.value) return;
  const bookingId = resolveBookingIdFromPayload(payload);
  if (!bookingId) {
    showToast({
      type: "error",
      title: "Booking Action Failed",
      message: "Could not find booking id for this request.",
    });
    return;
  }

  if (reviewPendingLoading.value) return;
  reviewPendingLoading.value = true;

  const actionLabel = decision === "approve" ? "approved" : "rejected";

  try {
    const result = await dashboardEventsEngine.callFlow(
      "bookings.reviewPendingBooking",
      {
        bookingId,
        decision,
        actor: "creator",
        reason: decision === "approve" ? "approved_by_creator" : "rejected_by_creator",
      },
      {
        context: {
          stateEngine: dashboardEventsEngine,
          creatorId: normalizedCreatorId.value,
          apiBaseUrl: props.apiBaseUrl || undefined,
        },
      },
    );

    if (!result?.ok) {
      const message = result?.meta?.uiErrors?.[0]
        || result?.error?.message
        || "Could not update booking approval.";
      showToast({
        type: "error",
        title: "Booking Action Failed",
        message,
      });
      return;
    }

    showToast({
      type: "success",
      title: "Booking Updated",
      message: `Booking ${actionLabel} successfully.`,
    });

    if (decision === "approve") {
      const approvedBooking = result?.data?.item || null;
      const approvedEvent = resolveEventForApprovalNotification(payload, result);

      if (shouldFireCreateScheduleAfterApproval(approvedEvent)) {
        const notify = getCreateScheduleNotifyPayload({
          event: approvedEvent,
          booking: approvedBooking,
          bookingId: approvedBooking?.bookingId || bookingId,
          eventId: approvedBooking?.eventId || approvedEvent?.eventId || approvedEvent?.raw?.eventId || null,
          startIso: approvedBooking?.startAtIso || approvedBooking?.startIso || approvedBooking?.start || payload?.event?.start || "",
          fanId: approvedBooking?.userId || payload?.event?.raw?.userId || "",
          creatorId: approvedBooking?.creatorId || approvedEvent?.creatorId || approvedEvent?.raw?.creatorId || normalizedCreatorId.value || "",
          participantCount: approvedBooking?.guestCount || 1,
        });

        if (notify.shouldFire && notify.payload) {
          fireAndForgetCreateScheduleNotify(notify.payload);
        }
      }
    }

    await fetchDashboardContext(true);
  } finally {
    reviewPendingLoading.value = false;
  }
};

const onApprovePendingBooking = async (payload) => {
  await reviewPendingBooking(payload, "approve");
};

const onRejectPendingBooking = async (payload) => {
  await reviewPendingBooking(payload, "reject");
};

const goToCreateEvent = (type) => {
  isCreatePopupOpen.value = false;
  newEventsPopupOpen.value = false;
  isFloatingPopupOpen.value = false;
  emit("create-event", { type });
};

const cancelBookingCandidateTitle = computed(() => cancelBookingCandidate.value?.event?.title || "Selected booking");

const cancelBookingCandidateTime = computed(() => {
  const event = cancelBookingCandidate.value?.event;
  const start = asDate(event?.start);
  const end = asDate(event?.end);
  if (!start || !end) return "";
  return `${start.toLocaleDateString()} - ${hhmm(start)} - ${hhmm(end)}`;
});

const closeCancelBookingPopup = () => {
  cancelBookingPopupOpen.value = false;
  cancelBookingCandidate.value = null;
};

const handleEventTypeColorsChanged = () => {
  eventTypeColors.value = loadEventTypeColorsFromStorage();
  rebuildAvailabilityForFocusDate();
};

const handleEventTypeColorsStorageChanged = (event) => {
  if (event?.key !== EVENT_TYPE_COLOR_STORAGE_KEY) return;
  handleEventTypeColorsChanged();
};

const allEvents = computed(() => {
  const list = dashboardEventsEngine.state?.events?.bookedList;
  if (!Array.isArray(list)) return [];
  return [...list].sort((left, right) => {
    const leftStart = asDate(left.start)?.getTime() || 0;
    const rightStart = asDate(right.start)?.getTime() || 0;
    return leftStart - rightStart;
  });
});

const calendarEvents = computed(() => {
  const list = dashboardEventsEngine.state?.events?.list;
  if (!Array.isArray(list)) return [];
  return [...list].sort((left, right) => {
    const leftStart = asDate(left.start)?.getTime() || 0;
    const rightStart = asDate(right.start)?.getTime() || 0;
    return leftStart - rightStart;
  });
});

const events1 = computed(() => calendarEvents.value.filter((event) => !String(event.status || "").startsWith("cancelled")));
const miniEvents = computed(() => allEvents.value.filter((event) => !String(event.status || "").startsWith("cancelled")));

const eventsData = computed(() => {
  const now = new Date();

  const todayItems = [];
  const weekItems = [];
  const pendingItems = [];

  allEvents.value.forEach((event) => {
    const startDate = asDate(event.start);
    if (!startDate) return;

    const status = String(event.status || "").toLowerCase();
    if (status === "pending" || status === "pending_hold") {
      pendingItems.push(toWidgetItem(event, { showReply: true }));
      return;
    }

    if (sameDay(startDate, now)) {
      todayItems.push(toWidgetItem(event, { layout: "today" }));
      return;
    }

    if (isInCurrentWeek(startDate, now)) {
      weekItems.push(toWidgetItem(event, { layout: "week" }));
    }
  });

  return [
    { title: "TODAY", items: todayItems },
    { title: "THIS WEEK", items: weekItems },
    { title: "PENDING EVENTS", items: pendingItems },
  ];
});

const onSelectFromMini = (date) => {
  state.selected = new Date(date);
  state.focus = new Date(date);
  rebuildAvailabilityForFocusDate();
};

const onSelectFromMain = (date) => {
  state.selected = new Date(date);
  state.focus = new Date(date);
  rebuildAvailabilityForFocusDate();
};

const onCalendarEventClick = (event) => {
  console.log("[listener] event-click -> event object:", event.detail.event);
};

const handleJoin = (item) => {
  const sourceEvent = item?.sourceEvent || item?.event || item || null;
  const bookingId = item?.bookingId || sourceEvent?.bookingId || sourceEvent?.raw?.bookingId || null;
  const joinState = getBookingJoinState({
    bookingId,
    startAt: sourceEvent?.start,
    endAt: sourceEvent?.end,
    status: sourceEvent?.status || sourceEvent?.raw?.status || "",
  });

  if (!joinState.canJoin || !joinState.joinUrl) {
    showToast({
      type: "error",
      title: "Join Unavailable",
      message: "You can join only within 5 minutes of the meeting start time and before it ends.",
    });
    return;
  }

  emit("open-url", {
    url: joinState.joinUrl,
    target: props.embedded ? "_blank" : "_self",
  });
};

const handleReply = (item) => {
  console.log("Reply", item);
};

const handleWidgetEventClick = (item) => {
  const event = item?.sourceEvent;
  if (!event) return;
  mainCalendarRef.value?.openEventDetails?.(event);
};

const handleWidgetMenuAction = (payload) => {
  const action = String(payload?.action || "");
  const event = payload?.event?.sourceEvent || payload?.event || null;

  if (action === "cancel_call") {
    const bookingId = resolveBookingIdFromPayload({ event });
    if (!bookingId) {
      showToast({
        type: "error",
        title: "Cancel Failed",
        message: "Could not find booking id for this call.",
      });
      return;
    }
    cancelBookingCandidate.value = { bookingId, event };
    cancelBookingPopupOpen.value = true;
    return;
  }

  if (action === "ask_more_time" || action === "ask_to_reschedule") {
    showToast({
      type: "info",
      title: "Coming Soon",
      message: "This action will be wired next.",
    });
  }
};

const onCancelBookingFromCalendar = (payload) => {
  const bookingId = resolveBookingIdFromPayload(payload || {});
  const event = payload?.event || null;
  if (!bookingId) {
    showToast({
      type: "error",
      title: "Cancel Failed",
      message: "Could not find booking id for this call.",
    });
    return;
  }
  cancelBookingCandidate.value = { bookingId, event };
  cancelBookingPopupOpen.value = true;
};

const confirmCancelBooking = async () => {
  const bookingId = cancelBookingCandidate.value?.bookingId;
  if (!bookingId || cancelBookingLoading.value) return;

  cancelBookingLoading.value = true;
  try {
    const result = await dashboardEventsEngine.callFlow(
      "bookings.cancelBooking",
      {
        bookingId,
        actor: "creator",
        reason: "creator_cancelled_from_events_widget",
      },
      {
        context: {
          stateEngine: dashboardEventsEngine,
          creatorId: normalizedCreatorId.value,
          apiBaseUrl: props.apiBaseUrl || undefined,
        },
      },
    );

    if (!result?.ok) {
      const message = result?.meta?.uiErrors?.[0]
        || result?.error?.message
        || "Could not cancel booking.";
      showToast({
        type: "error",
        title: "Cancel Failed",
        message,
      });
      return;
    }

    showToast({
      type: "success",
      title: "Booking Cancelled",
      message: "The booking was cancelled successfully.",
    });
    closeCancelBookingPopup();
    await fetchDashboardContext(true);
  } finally {
    cancelBookingLoading.value = false;
  }
};

onMounted(() => {
  isMounted.value = true;
  eventTypeColors.value = loadEventTypeColorsFromStorage();
  dashboardEventsEngine.initialize({ fromUrl: false });

  window.addEventListener("resize", handlePositionUpdate);
  window.addEventListener("scroll", handlePositionUpdate, true);
  window.addEventListener("event-type-colors:changed", handleEventTypeColorsChanged);
  window.addEventListener("storage", handleEventTypeColorsStorageChanged);
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("calendar:event-click", onCalendarEventClick);

  if (hasDashboardContext.value) {
    fetchDashboardContext(true);
  } else {
    resetEventsState();
  }

  if (isFan.value) {
    isCreatePopupOpen.value = false;
    isFloatingPopupOpen.value = false;
    newEventsPopupOpen.value = false;
  }
});

watch([normalizedCreatorId, normalizedFanId, () => props.userRole], ([nextCreatorId, nextFanId, nextRole], [previousCreatorId, previousFanId, previousRole]) => {
  if (!isMounted.value) return;

  const normalizedRole = String(nextRole || "").toLowerCase();
  if (normalizedRole === "fan") {
    if (nextFanId == null) {
      resetEventsState();
      return;
    }
    if (nextFanId !== previousFanId || normalizedRole !== String(previousRole || "").toLowerCase()) {
      fetchDashboardContext(true);
    }
    return;
  }

  if (nextCreatorId == null) {
    resetEventsState();
    return;
  }
  if (nextCreatorId !== previousCreatorId || normalizedRole !== String(previousRole || "").toLowerCase()) {
    fetchDashboardContext(true);
  }
});

watch(() => props.userRole, (nextRole) => {
  if (nextRole === "fan") {
    isCreatePopupOpen.value = false;
    isFloatingPopupOpen.value = false;
    newEventsPopupOpen.value = false;
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", handlePositionUpdate);
  window.removeEventListener("scroll", handlePositionUpdate, true);
  window.removeEventListener("event-type-colors:changed", handleEventTypeColorsChanged);
  window.removeEventListener("storage", handleEventTypeColorsStorageChanged);
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("calendar:event-click", onCalendarEventClick);
});
</script>
