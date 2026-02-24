<script setup>
import { onMounted, reactive, ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import DashboardWrapperTwoColContainer from "@/components/dashboard/DashboardWrapperTwoColContainer.vue";
import { createFlowStateEngine, attachEngineLogging } from "@/utils/flowStateEngine.js"; // Adjust path if needed

// Import Steps
import OneOnOneBookinStep1 from "./OneOnOneBookinStep1.vue";
import OneOnOneBookinStep2 from "./OneOnOneBookinStep2.vue";
import GroupBookingStep1 from "./GroupBookingStep1.vue";
import GroupBookingStep2 from "./GroupBookingStep2.vue";
import MainCalendar from "@/components/calendar/MainCalendar.vue";
import NotificationCard from "@/components/dev/card/notification/NotificationCard.vue";
import ToastHost from "@/components/ui/toast/ToastHost.vue";
import { mapBookedSlotsToCalendarEvents, mapAvailabilityToCalendarEvents } from "@/services/bookings/utils/bookingSlotUtils.js";
import { addDays, startOfWeek } from "@/utils/calendarHelpers.js";

// Import Validators
import { step1Validator, step2Validator } from "@/services/events/validators/eventStepValidators.js";

const props = defineProps({
    type: {
        type: String,
        default: "private",
        validator: (value) => ["private", "group"].includes(value),
    }
});

const route = useRoute();

/**
 * Determine the active type.
 * Priority:
 * 1. props.type (if explicitly passed by a parent wrapper like GroupBookingForm)
 * 2. route.query.type (if accessed directly via URL, e.g. ?type=group)
 * 3. Default to 'private'
 */
const currentType = computed(() => {
    // If route query is explicitly present, it takes precedence for direct access
    if (route.query.type === 'group' || route.query.type === 'private') {
        return route.query.type;
    }
    return props.type;
});

// Initialize State Engine
const bookingFlow = createFlowStateEngine({
    flowId: 'booking-schedule-flow',
    initialStep: 1,
    urlSync: 'none', // Changed to none to avoid URL clutter for this modal/form
    defaults: {
        eventTitle: "",
        eventDescription: "",
        repeatRule: "weekly",
        repeatX: 2,
        selectedDate: "",
        selectedStartTime: "15:00",
        selectedEndTime: "16:00",
        dateFrom: "",
        dateTo: "",
        weeklyAvailability: [],
        oneTimeAvailability: [],
        duration: "",
        maxSessionDuration: "",
        basePrice: "",
        sessionMinimum: "",
        discountPercentage: "",
        bookingFee: "",
        waitlistSpots: "",
        advanceVoid: "",
        advanceCancelWindowUnit: "day",
        offHourSurcharge: "",
        calendarDuration: "",
        lateStartAction: "reschedule",
        lateStartDiscountPercent: "",
        remindMeTime: "",
        bufferTime: "",
        bufferUnit: "minutes",
        maxBookingsPerDay: "",
        waitlistSlots: "",
        rescheduleFee: "",
        cancellationFee: "",
        extendSessionMax: "",
        allowLongerSessions: false,
        enableLongerDiscount: false,
        enableBookingFee: false,
        allowInstantBooking: false,
        disableChatBeforeCall: false,
        enableRescheduleFee: false,
        enableCancellationFee: false,
        allowAdvanceCancellation: false,
        addOffHourSurcharge: false,
        disableChatDuringCall: false,
        requestExtendSession: false,
        setBufferTime: false,
        setMaxBookings: false,
        allowWaitlist: false,

        // Step 2 & Group Defaults
        allowRecording: false,
        recordingPrice: "",
        allowPersonalRequest: false,
        personalRequestNote: "",
        blockedUserSearch: "",
        blockedUsers: [],
        coPerformerSearch: "",
        whoCanBook: "everyone",
        subscriptionTiers: [],
        invitedUsers: [],
        xPostLive: false,
        xPostBooked: false,
        xPostInSession: false,
        xPostTipped: false,
        xPostPurchase: false,
        discountEventsCount: "",
        spendingRequirement: "none",
        minSpendTokens: "",
        requiredProductIds: "",
        setMaxUsers: false,
        maxUsers: "",
        setReminders: false,
        eventType: "1on1-call",
        creatorId: null,
        eventCallType: "video",
        eventColorSkin: "#5549FF",
        eventRingtoneUrl: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
        priceSetting: "fixedPricePerUser"
    }
});

attachEngineLogging(bookingFlow);

// Sync engine with component to make it reactive for the template
const currentStep = ref(1);
const calendarBookedSlots = ref([]);
const calendarAvailabilitySlots = ref([]);
const creatorEventsForCalendar = ref([]);
const bookedSlotsIndexForCalendar = ref({});
const calendarLoading = ref(false);
const calendarError = ref(null);

const DEFAULT_EVENT_COLOR = "#5549FF";
const DAY_KEY_TO_INDEX = {
    sun: 0,
    sunday: 0,
    mon: 1,
    monday: 1,
    tue: 2,
    tues: 2,
    tuesday: 2,
    wed: 3,
    wednesday: 3,
    thu: 4,
    thursday: 4,
    fri: 5,
    friday: 5,
    sat: 6,
    saturday: 6,
};

// --- VALIDATION LOGIC ---

// Step 1 Validation
bookingFlow.addValidator(1, step1Validator);

// Step 2 Validation
bookingFlow.addValidator(2, step2Validator);

const resolveCreatorId = () => {
    const creatorFromRoute = Number(route.query?.creatorId);
    const creatorFromStorage = typeof window !== "undefined"
        ? Number(window.localStorage?.getItem("creatorId"))
        : NaN;
    return Number.isFinite(creatorFromRoute)
        ? creatorFromRoute
        : (creatorFromStorage || 1);
};

const fetchCreatorBookedSlots = async (forceRefresh = false) => {
    const creatorId = resolveCreatorId();
    calendarLoading.value = true;
    calendarError.value = null;
    bookingFlow.setState("creatorId", creatorId, { reason: "calendar-booked-slots", silent: true });

    const result = await bookingFlow.callFlow(
        "bookings.fetchCreatorBookingContext",
        {
            creatorId,
            periodMonths: 6,
            slotLimit: 1000,
            statusIn: "pending,pending_hold,confirmed,completed",
        },
        {
            forceRefresh,
            context: {
                stateEngine: bookingFlow,
                creatorId,
            },
        },
    );

    if (!result?.ok) {
        calendarError.value = result?.meta?.uiErrors?.[0]
            || result?.error?.message
            || "Could not load creator booked slots.";
        calendarBookedSlots.value = [];
        calendarAvailabilitySlots.value = [];
        creatorEventsForCalendar.value = [];
        bookedSlotsIndexForCalendar.value = {};
    } else {
        const creatorEvents = Array.isArray(result?.data?.events) ? result.data.events : [];
        const bookedSlotsIndex = result?.data?.bookedSlotsIndex || {};

        creatorEventsForCalendar.value = creatorEvents;
        bookedSlotsIndexForCalendar.value = bookedSlotsIndex;

        const mappedBooked = mapBookedSlotsToCalendarEvents(result?.data?.bookedSlots, {
            includeStatuses: ["pending", "pending_hold", "confirmed", "completed"],
            titleFallback: "Booked Slot",
        });

        const colorByEventId = new Map(
            creatorEvents
                .map((event) => [
                    String(event?.eventId || event?.id || ""),
                    event?.eventColorSkin || event?.raw?.eventColorSkin || DEFAULT_EVENT_COLOR,
                ])
                .filter(([eventId]) => Boolean(eventId))
        );

        calendarBookedSlots.value = mappedBooked.map((event) => ({
            ...event,
            isExistingSchedule: true,
            color: colorByEventId.get(String(event?.eventId || "")) || DEFAULT_EVENT_COLOR,
        }));

        rebuildAvailabilityPreview();
    }

    calendarLoading.value = false;
};

// Init
onMounted(() => {
    bookingFlow.initialize();
    const resolvedCreatorId = resolveCreatorId();
    bookingFlow.setState("creatorId", resolvedCreatorId, { reason: "initial-create-flow", silent: true });
    bookingFlow.setState(
        "eventType",
        currentType.value === "group" ? "group-event" : "1on1-call",
        { reason: "initial-create-flow", silent: true },
    );

    // Listen to engine changes to update UI
    bookingFlow.on('step:changed', ({ next }) => {
        currentStep.value = next;
    });

    fetchCreatorBookedSlots(route.query?.refresh === "1");
});

watch(currentType, (nextType) => {
    bookingFlow.setState(
        "eventType",
        nextType === "group" ? "group-event" : "1on1-call",
        { reason: "type-sync", silent: true },
    );
});

watch(
    () => route.query?.creatorId,
    () => {
        fetchCreatorBookedSlots(true);
    },
);

const now = new Date();
const y = now.getFullYear();
const m = now.getMonth();

// --- THEME 2 ---
const theme2 = {
    mini: {},
    main: {
        wrapper: 'relative flex flex-col gap-[0px] overflow-hidden rounded-xl',
        title: ' text-[16px] font-semibold text-slate-800 ',
        xHeader: '',
        axisXLabel: 'flex flex-col justify-end pb-[0.75rem] w-[4.875rem]',
        axisXDay: 'py-1 text-center h-[63.92px] text-slate-500 font-medium',
        axisXToday: 'bg-gray-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto',
        axisYRow: 'h-[62.62px] text-right pr-4 w-[2.4rem] uppercase text-slate-400 text-[11px] font-medium leading-4 pt-1',
        colBase: 'relative bg-white/20 border-l border-white/50 overflow-hidden',
        gridRow: 'h-[62.61px] border-b border-white/50',
        eventBase: 'absolute mx-1 rounded-md p-2 text-xs shadow-sm'
    },
    month: {}
};

function toHm(value, fallback = "00:00") {
    if (typeof value !== "string") return fallback;
    const normalized = value.trim();
    return /^\d{2}:\d{2}$/.test(normalized) ? normalized : fallback;
}

function formatDateIso(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function dateFromIso(dateIso) {
    const parsed = new Date(`${dateIso}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dateTimeFromIsoHm(dateIso, hm) {
    const parsed = new Date(`${dateIso}T${toHm(hm, "00:00")}:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeHexColor(color, fallback = DEFAULT_EVENT_COLOR) {
    if (typeof color !== "string") return fallback;
    const normalized = color.trim();
    if (/^#([0-9a-fA-F]{3}){1,2}$/.test(normalized)) return normalized;
    return fallback;
}

function hexToRgb(hexColor = DEFAULT_EVENT_COLOR) {
    const hex = normalizeHexColor(hexColor).replace("#", "");
    const full = hex.length === 3
        ? hex.split("").map((char) => char + char).join("")
        : hex;
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

function getCalendarEventStyle(event, mode = "existing") {
    if (mode === "availability" || event?.isAvailabilityBlock) {
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
    if (mode === "draft") {
        return {
            borderBottom: `1px solid ${color}`,
            color,
            background: `repeating-linear-gradient(-45deg, ${rgba(color, 0.24)}, ${rgba(color, 0.24)} 2px, ${rgba(color, 0.14)} 3px, ${rgba(color, 0.14)} 10px)`,
            zIndex: 3,
        };
    }
    return {
        borderBottom: `1px solid ${color}`,
        color,
        backgroundColor: rgba(color, 0.2),
        zIndex: 2,
    };
}

function createPreviewEvent({ dateIso, startTime, endTime, title, color, index }) {
    const start = dateTimeFromIsoHm(dateIso, startTime);
    if (!start) return null;

    let endDateIso = dateIso;
    const startMinutes = Number(startTime.slice(0, 2)) * 60 + Number(startTime.slice(3, 5));
    const endMinutes = Number(endTime.slice(0, 2)) * 60 + Number(endTime.slice(3, 5));
    if (endMinutes <= startMinutes) {
        const nextDay = addDays(dateFromIso(dateIso), 1);
        endDateIso = formatDateIso(nextDay) || dateIso;
    }

    const end = dateTimeFromIsoHm(endDateIso, endTime);
    if (!end) return null;

    return {
        id: `draft_${dateIso}_${startTime}_${endTime}_${index}`,
        title,
        start,
        end,
        slot: "custom",
        color,
        isDraftPreview: true,
        isDraft: true,
    };
}

function shouldIncludeEveryXWeeksDate({ candidateDateIso, anchorDateIso, repeatX }) {
    const candidate = dateFromIso(candidateDateIso);
    const anchor = dateFromIso(anchorDateIso);
    if (!candidate || !anchor) return false;

    const diffMs = candidate.getTime() - anchor.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    if (diffDays < 0) return false;

    const interval = Number.isFinite(Number(repeatX)) && Number(repeatX) > 0 ? Number(repeatX) : 2;
    const weekIndex = Math.floor(diffDays / 7);
    return weekIndex % interval === 0;
}

const previewDraftEvents = computed(() => {
    const stateSnapshot = bookingFlow.state || {};
    const repeatRule = String(stateSnapshot.repeatRule || "weekly");
    const eventTitle = String(stateSnapshot.eventTitle || "").trim() || "New Event";
    const eventColor = normalizeHexColor(stateSnapshot.eventColorSkin, DEFAULT_EVENT_COLOR);

    const selectedDate = String(stateSnapshot.selectedDate || "").trim() || formatDateIso(state.focus);
    const dateFrom = String(stateSnapshot.dateFrom || "").trim() || selectedDate;
    const dateTo = String(stateSnapshot.dateTo || "").trim() || "";
    const selectedStartTime = toHm(stateSnapshot.selectedStartTime, "15:00");
    const selectedEndTime = toHm(stateSnapshot.selectedEndTime, "16:00");

    const weekStart = startOfWeek(state.focus);
    const weekDates = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
    const weekDateIsos = weekDates
        .map((date) => formatDateIso(date))
        .filter(Boolean);

    const events = [];
    const inRange = (dateIso) => {
        if (!dateIso) return false;
        if (dateFrom && dateIso < dateFrom) return false;
        if (dateTo && dateIso > dateTo) return false;
        return true;
    };

    if (repeatRule === "doesNotRepeat") {
        const oneTimeAvailability = Array.isArray(stateSnapshot.oneTimeAvailability)
            ? stateSnapshot.oneTimeAvailability
            : [];

        const oneTimeRows = oneTimeAvailability.length > 0
            ? oneTimeAvailability
            : [{ date: selectedDate, slots: [{ startTime: selectedStartTime, endTime: selectedEndTime }] }];

        oneTimeRows.forEach((row, rowIndex) => {
            const dateIso = String(row?.date || "").slice(0, 10);
            if (!dateIso || !weekDateIsos.includes(dateIso)) return;

            const slots = Array.isArray(row?.slots) && row.slots.length > 0
                ? row.slots
                : [{ startTime: selectedStartTime, endTime: selectedEndTime }];

            slots.forEach((slot, slotIndex) => {
                const preview = createPreviewEvent({
                    dateIso,
                    startTime: toHm(slot?.startTime, selectedStartTime),
                    endTime: toHm(slot?.endTime, selectedEndTime),
                    title: eventTitle,
                    color: eventColor,
                    index: `${rowIndex}_${slotIndex}`,
                });
                if (preview) events.push(preview);
            });
        });
    } else {
        const weeklyAvailability = Array.isArray(stateSnapshot.weeklyAvailability)
            ? stateSnapshot.weeklyAvailability
            : [];

        weekDateIsos.forEach((dateIso) => {
            if (!inRange(dateIso)) return;
            if (repeatRule === "everyXWeeks" && !shouldIncludeEveryXWeeksDate({
                candidateDateIso: dateIso,
                anchorDateIso: dateFrom,
                repeatX: stateSnapshot.repeatX,
            })) {
                return;
            }

            const dayIndex = dateFromIso(dateIso)?.getDay();
            if (!Number.isFinite(dayIndex)) return;

            const dayRows = weeklyAvailability.filter((day) => {
                if (!day || day.unavailable) return false;
                const key = String(day.key || day.name || "").toLowerCase();
                const mappedDayIndex = DAY_KEY_TO_INDEX[key];
                return Number.isFinite(mappedDayIndex) && mappedDayIndex === dayIndex;
            });

            if (dayRows.length === 0) {
                if (repeatRule === "daily" || !Array.isArray(weeklyAvailability) || weeklyAvailability.length === 0) {
                    const preview = createPreviewEvent({
                        dateIso,
                        startTime: selectedStartTime,
                        endTime: selectedEndTime,
                        title: eventTitle,
                        color: eventColor,
                        index: "fallback",
                    });
                    if (preview) events.push(preview);
                }
                return;
            }

            dayRows.forEach((day, dayIndexInList) => {
                const slots = Array.isArray(day?.slots) && day.slots.length > 0
                    ? day.slots
                    : [{ startTime: selectedStartTime, endTime: selectedEndTime }];

                slots.forEach((slot, slotIndex) => {
                    const preview = createPreviewEvent({
                        dateIso,
                        startTime: toHm(slot?.startTime, selectedStartTime),
                        endTime: toHm(slot?.endTime, selectedEndTime),
                        title: eventTitle,
                        color: eventColor,
                        index: `${dayIndexInList}_${slotIndex}`,
                    });
                    if (preview) events.push(preview);
                });
            });
        });
    }

    return events.sort((left, right) => new Date(left.start).getTime() - new Date(right.start).getTime());
});

const events2 = computed(() => {
    return [...calendarAvailabilitySlots.value, ...calendarBookedSlots.value, ...previewDraftEvents.value];
});

const state = reactive({
    focus: new Date(y, m, 23),
    selected: null,
    view: 'week'
});

const onSelectFromMain = (date) => {
    state.selected = new Date(date);
    state.focus = new Date(date);
    rebuildAvailabilityPreview();
};

function rebuildAvailabilityPreview() {
    const creatorEvents = Array.isArray(creatorEventsForCalendar.value)
        ? creatorEventsForCalendar.value
        : [];
    const bookedSlotsIndex = bookedSlotsIndexForCalendar.value || {};

    if (creatorEvents.length === 0) {
        calendarAvailabilitySlots.value = [];
        return;
    }

    calendarAvailabilitySlots.value = mapAvailabilityToCalendarEvents(creatorEvents, {
        bookedSlotsIndex,
        focusDate: state.focus,
        rangeDaysBefore: 14,
        rangeDaysAfter: 56,
    }).map((event) => ({
        ...event,
        isExistingSchedule: true,
        slot: "availability",
        color: "#98A2B3",
    }));
}

const onDebugSubmit = () => {
    console.log("Submit Clicked. Current State:", JSON.parse(JSON.stringify(bookingFlow.state)));
    alert("Submitted! Check console for full state object.");
};

// Helper for title
const formTitle = computed(() => {
    return currentType.value === 'group' ? 'Group Event Settings' : 'Private Booking Settings';
});
</script>

<template>
    <DashboardWrapperTwoColContainer>
        <ToastHost />
        <div class="flex w-full">
            <div
                class="flex h-full flex-col gap-6 relative w-full md:w-[500px] md:min-w-[500px] bg-white/50 shadow-[0px_4px_6px_-2px_rgba(16,24,40,0.03)] backdrop-blur-xl">

                <div class="px-6 pt-6 pb-2 bg-white/20 flex justify-between items-center">
                    <div class="justify-start text-slate-700 text-base font-semibold leading-6">
                        {{ formTitle }}
                    </div>
                    <div class="w-2.5 h-2.5 relative overflow-hidden">
                        <img src="https://i.ibb.co/G4Y3BB6c/Icon.png" alt="" />
                    </div>
                </div>

                <div class="w-full">
                    <!-- Private Form -->
                    <template v-if="currentType === 'private'">
                        <OneOnOneBookinStep1 v-if="currentStep === 1" :engine="bookingFlow" />

                        <OneOnOneBookinStep2 v-if="currentStep === 2" :engine="bookingFlow" />
                    </template>

                    <!-- Group Form -->
                    <template v-else-if="currentType === 'group'">
                        <GroupBookingStep1 v-if="currentStep === 1" :engine="bookingFlow" />

                        <GroupBookingStep2 v-if="currentStep === 2" :engine="bookingFlow" />
                    </template>
                </div>

            </div>

            <div class="w-full">
                <NotificationCard variant="alert" :showIcon="false" title="You have 3 active subscriber in this tier"
                    description="Changing detail of this plan might affect current subscriber's subscription fee and benefits." />
                <div v-if="calendarError" class="mx-6 mt-3 px-3 py-2 rounded bg-red-50 text-red-700 text-xs font-medium">
                    {{ calendarError }}
                </div>
                <div v-else-if="calendarLoading" class="mx-6 mt-3 px-3 py-2 rounded bg-gray-100 text-gray-600 text-xs font-medium">
                    Loading booked slots...
                </div>
                <MainCalendar class="w-full px-6 pt-6" variant="theme2" :focus-date="state.focus" :events="events2"
                    :theme="theme2" :data-attrs="{ 'data-calendar': 'main-2' }" :console-overlaps="true"
                    :highlight-today-column="true" time-start="00:00" time-end="23:00" :slot-minutes="60"
                    :row-height-px="64" :min-event-height-px="0" @date-selected="onSelectFromMain">

                    <template #event="{ event, style, onClick }">
                        <div class="absolute py-1 px-2 border-b text-xs shadow-sm overflow-hidden"
                            :style="[style, getCalendarEventStyle(event, 'existing')]" @click.stop="onClick(event)">
                            <div class="flex items-center gap-1 font-normal truncate">
                                <svg width="11" height="12" viewBox="0 0 11 12" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M10.2898 5H1.28979M7.78979 1V3M3.78979 1V3M3.68979 11H7.88979C8.72987 11 9.14991 11 9.47078 10.8365C9.75302 10.6927 9.98249 10.4632 10.1263 10.181C10.2898 9.86012 10.2898 9.44008 10.2898 8.6V4.4C10.2898 3.55992 10.2898 3.13988 10.1263 2.81901C9.98249 2.53677 9.75302 2.3073 9.47078 2.16349C9.14991 2 8.72987 2 7.8898 2H3.6898C2.84972 2 2.42968 2 2.10881 2.16349C1.82657 2.3073 1.5971 2.53677 1.45329 2.81901C1.28979 3.13988 1.28979 3.55992 1.28979 4.4V8.6C1.28979 9.44008 1.28979 9.86012 1.45329 10.181C1.5971 10.4632 1.82657 10.6927 2.10881 10.8365C2.42968 11 2.84972 11 3.68979 11Z"
                                        stroke="currentColor" stroke-width="1.25" stroke-linecap="round"
                                        stroke-linejoin="round" />
                                </svg>
                                <span class="mt-1 truncate">{{ event.title }}</span>
                            </div>
                        </div>
                    </template>

                    <template #event-custom="{ event, style, onClick }">
                        <div class="absolute py-1 px-2 border-b text-xs shadow-sm overflow-hidden"
                            :style="[style, getCalendarEventStyle(event, event?.isDraftPreview ? 'draft' : 'existing')]"
                            @click.stop="onClick(event)">
                            <div class="flex items-center gap-1 font-normal leading-4 truncate">
                                <svg width="11" height="12" viewBox="0 0 11 12" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M10.2898 5H1.28979M7.78979 1V3M3.78979 1V3M3.68979 11H7.88979C8.72987 11 9.14991 11 9.47078 10.8365C9.75302 10.6927 9.98249 10.4632 10.1263 10.181C10.2898 9.86012 10.2898 9.44008 10.2898 8.6V4.4C10.2898 3.55992 10.2898 3.13988 10.1263 2.81901C9.98249 2.53677 9.75302 2.3073 9.47078 2.16349C9.14991 2 8.72987 2 7.8898 2H3.6898C2.84972 2 2.42968 2 2.10881 2.16349C1.82657 2.3073 1.5971 2.53677 1.45329 2.81901C1.28979 3.13988 1.28979 3.55992 1.28979 4.4V8.6C1.28979 9.44008 1.28979 9.86012 1.45329 10.181C1.5971 10.4632 1.82657 10.6927 2.10881 10.8365C2.42968 11 2.84972 11 3.68979 11Z"
                                        stroke="currentColor" stroke-width="1.25" stroke-linecap="round"
                                        stroke-linejoin="round" />
                                </svg>
                                <span class="mt-1 truncate">{{ event.title }}</span>
                            </div>
                        </div>
                    </template>

                    <template #event-alt="{ event, style, onClick }">
                        <div class="absolute py-1 px-2 border-b text-xs shadow-sm"
                            :style="[style, getCalendarEventStyle(event, 'existing')]" @click.stop="onClick(event)">
                            <div class="flex items-center gap-1 font-normal truncate">
                                <svg class="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                <span class="mt-1 truncate">{{ event.title }}</span>
                            </div>
                        </div>
                    </template>

                    <template #event-custom2="{ event, style, onClick }">
                        <div class="absolute py-1 px-2 border-b text-xs shadow-sm"
                            :style="[style, getCalendarEventStyle(event, 'existing')]" @click.stop="onClick(event)">
                            <div class="flex items-center gap-1 font-normal">
                                <svg class="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2">
                                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                    <line x1="3" y1="6" x2="21" y2="6"></line>
                                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                                </svg>
                                <span class="mt-1 truncate">{{ event.title }}</span>
                            </div>
                        </div>
                    </template>

                    <template #event-availability="{ event, style }">
                        <div class="absolute pointer-events-none rounded-md min-h-[6px] w-full"
                            :style="[style, getCalendarEventStyle(event, 'availability')]" />
                    </template>

                </MainCalendar>
            </div>

        </div>
    </DashboardWrapperTwoColContainer>

    <!-- Debug Section (as requested) -->
    <div class="mt-8 p-6 bg-gray-100 dark:bg-slate-800 rounded-lg border border-gray-300 dark:border-gray-700">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">Debug / State Manager</h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Flow State Panel -->
            <div
                class="bg-white dark:bg-slate-900 border border-gray-300 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                <h4
                    class="text-sm font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-2 mb-3">
                    Current Flow State
                </h4>
                <pre
                    class="max-h-80 overflow-auto bg-slate-950 text-emerald-400 p-3 rounded text-xs leading-relaxed font-mono">
                {{ JSON.stringify(bookingFlow.state, null, 2) }}</pre>
            </div>

            <!-- Flow Logs Panel -->
            <div
                class="bg-white dark:bg-slate-900 border border-gray-300 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                <h4
                    class="text-sm font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-2 mb-3">
                    Engine Logs
                </h4>
                <pre
                    class="max-h-80 overflow-auto bg-slate-950 text-blue-300 p-3 rounded text-xs leading-relaxed font-mono">
                {{ bookingFlow.logs.slice(-20).join("\n") }}</pre>
            </div>
        </div>
    </div>
</template>
