<script setup>
import { nextTick, onBeforeUnmount, onMounted, reactive, ref, computed, watch } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import DashboardWrapperTwoColContainer from "@/components/dashboard/DashboardWrapperTwoColContainer.vue";
import { createFlowStateEngine, attachEngineLogging } from "@/utils/flowStateEngine.js"; // Adjust path if needed

// Import Steps
import OneOnOneBookinStep1 from "./OneOnOneBookinStep1.vue";
import OneOnOneBookinStep2 from "./OneOnOneBookinStep2.vue";
import GroupBookingStep1 from "./GroupBookingStep1.vue";
import GroupBookingStep2 from "./GroupBookingStep2.vue";
import MainCalendar from "@/components/calendar/MainCalendar.vue";
import BookingScheduleMenu from "@/components/calendar/BookingScheduleMenu.vue";
import CalendarWeekAvailabilityBlock from "@/components/calendar/CalendarWeekAvailabilityBlock.vue";
import CalendarWeekBookingBlock from "@/components/calendar/CalendarWeekBookingBlock.vue";
import NotificationCard from "@/components/dev/card/notification/NotificationCard.vue";
import OneOnOneBookingFlowPopup from "@/components/FanBookingFlow/OneOnOneBookingFlow/OneOnOneBookingFlowPopup.vue";
import PopupHandler from "@/components/ui/popup/PopupHandler.vue";
import ToastHost from "@/components/ui/toast/ToastHost.vue";
import { mapAvailabilityToCalendarEvents, mapBookedSlotsToCalendarEvents } from "@/services/bookings/utils/bookingSlotUtils.js";
import { addDays, startOfWeek } from "@/utils/calendarHelpers.js";
import { useBodyOverflowHidden } from "@/composables/useBodyOverflowHidden";
import { mapDraftEventToFanBookingPreview } from "@/services/events/mappers/mapDraftEventToFanBookingPreview.js";
import { mapEventToBookingFormState } from "@/services/events/mappers/eventFormStateMapper.js";
import { resolveCreatorIdFromContext } from "@/utils/contextIds.js";
import { useBookingTranslations } from "@/i18n/bookingTranslations.js";
import { notifyEventsEmbedFormDirtyState, notifyEventsEmbedFormOpenState } from "@/embeds/events/bridge.js";
import { showToast } from "@/utils/toastBus.js";
import { buildScheduledGroupMeetingUrl, getBookingJoinState } from "@/utils/bookingJoinUtils.js";
import closeIcon from "@/assets/images/icons/close.png";

// Import Validators
import { step1Validator, step2Validator } from "@/services/events/validators/eventStepValidators.js";

const props = defineProps({
    type: {
        type: String,
        default: "",
        validator: (value) => value === "" || ["private", "group"].includes(value),
    },
    creatorId: {
        type: [Number, String],
        default: null,
    },
    apiBaseUrl: {
        type: String,
        default: "",
    },
    creatorData: {
        type: Object,
        default: null,
    },
    embedded: {
        type: Boolean,
        default: false,
    },
    mode: {
        type: String,
        default: "",
    },
    eventId: {
        type: [String, Number],
        default: "",
    },
});

const emit = defineEmits(["created", "back", "scroll-top-request", "edit-event", "open-url"]);
const route = useRoute();
const router = useRouter();
const { t } = useBookingTranslations();
const DEFAULT_VUE_CREATOR_ID = 1407;
const DEFAULT_CREATOR_TIMEZONE = "Asia/Hong_Kong";
const ACTIVE_BOOKING_LOCK_STATUSES = new Set(["pending", "pending_hold", "confirmed"]);

const isEditMode = computed(() => String(props.mode || route.query.mode || "").toLowerCase() === "edit");
const resolvedEditEventId = computed(() => {
    const candidate = props.eventId || route.query.eventId || route.query.event_id || "";
    return candidate == null ? "" : String(candidate).trim();
});
const editFormReady = ref(false);
const editLoading = ref(false);
const editError = ref("");
const editEventType = ref("");
const hasUnsavedChanges = ref(false);
const dirtyTrackingStarted = ref(false);
const dirtyBaselineSignature = ref("");
const unsavedLeaveDialogOpen = ref(false);
const suppressUnsavedLeaveWarning = ref(false);
let pendingUnsavedLeaveResolve = null;
let pendingUnsavedLeavePromise = null;

const ADDITIONAL_BOOKING_FORM_DIRTY_DEFAULTS = Object.freeze({
    eventImageUrl: "",
    on_schedule_live: false,
    on_booking_received: false,
    on_in_session: false,
    on_tipped_session: false,
    on_purchased: false,
    on_schedule_live_message: "",
    on_booking_received_message: "",
    on_in_session_message: "",
    on_tipped_session_message: "",
    on_purchased_message: "",
    on_schedule_live_media_url: "",
    on_booking_received_media_url: "",
    on_in_session_media_url: "",
    on_tipped_session_media_url: "",
    on_purchased_media_url: "",
});

const NON_FORM_DIRTY_STATE_KEYS = new Set([
    "apiBaseUrl",
    "creatorId",
    "creatorTimezone",
    "editEventId",
    "eventId",
    "eventType",
    "events",
    "fanBooking",
    "isGroupPricingLocked",
    "isGroupScheduleLocked",
]);

/**
 * Determine the active type.
 * Priority:
 * 1. props.type (if explicitly passed by a parent wrapper like GroupBookingForm)
 * 2. route.query.type (if accessed directly via URL, e.g. ?type=group)
 * 3. Default to 'private'
 */
const currentType = computed(() => {
    if (editEventType.value === "group" || editEventType.value === "private") {
        return editEventType.value;
    }
    if (props.type === "group" || props.type === "private") {
        return props.type;
    }
    if (route.query.type === 'group' || route.query.type === 'private') {
        return route.query.type;
    }
    return "private";
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
        monthlyAvailability: [],
        oneTimeAvailability: [],
        duration: "",
        maxSessionDuration: "",
        basePrice: "",
        sessionMinimum: "",
        longerSessionDiscountTokens: "",
        discountPercentage: "",
        firstTimeDiscountTokens: "",
        firstTimeDiscount: "",
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
        enableFirstTimeDiscount: false,
        enableBookingFee: false,
        allowInstantBooking: false,
        disableChatBeforeCall: false,
        enableRescheduleFee: false,
        enableCancellationFee: false,
        allowAdvanceCancellation: false,
        addOffHourSurcharge: false,
        disableChatDuringCall: false,
        disableChatAllowEmoji: false,
        disableChatDuringCallAllowEmoji: false,
        requestExtendSession: false,
        setBufferTime: false,
        setMaxBookings: false,
        allowWaitlist: false,
        eventGoalTokens: "",
        enableMinContributionPerUser: false,
        minContributionPerUser: "",
        goalNotMet: "cancelEvent",

        // Step 2 & Group Defaults
        allowRecording: false,
        recordingPrice: "",
        allowPersonalRequest: false,
        personalRequestNote: "",
        addOns: [],
        blockedUserSearch: "",
        blockedUsers: [],
        coPerformerSearch: "",
        whoCanBook: "everyone",
        subscriptionTiers: [],
        invitedUsers: [],
        inviteSecret: "",
        xPostLive: false,
        xPostBooked: false,
        xPostInSession: false,
        xPostTipped: false,
        xPostPurchase: false,
        discountEventsCount: "",
        spendingRequirement: "none",
        minSpendTokens: "",
        requiredProducts: [],
        enableMaxAttendees: false,
        maxAttendees: "",
        setReminders: false,
        eventType: "1on1-call",
        creatorTimezone: DEFAULT_CREATOR_TIMEZONE,
        creatorId: null,
        eventCallType: "video",
        eventColorSkin: "#5549FF",
        eventRingtoneUrl: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
        priceSetting: "eventGoal"
    }
});

attachEngineLogging(bookingFlow);

// Sync engine with component to make it reactive for the template
const currentStep = ref(1);
const step1ValidationRevealRequest = ref({
    nonce: 0,
    errors: [],
    field: "",
    scroll: true,
});
const previewSchedule = ref(false);
const mainCalendarRef = ref(null);
const formScrollContainer = ref(null);
const calendarBookedSlots = ref([]);
const calendarAvailabilitySlots = ref([]);
const creatorEventsForCalendar = ref([]);
const bookedSlotsRawForCalendar = ref([]);
const bookedSlotsIndexForCalendar = ref({});
const calendarLoading = ref(false);
const calendarError = ref(null);
const reviewPendingLoading = ref(false);
const cancelBookingPopupOpen = ref(false);
const cancelBookingLoading = ref(false);
const cancelBookingCandidate = ref(null);
const deleteEventPopupOpen = ref(false);
const deleteEventLoading = ref(false);
const deleteEventCandidate = ref(null);
const scheduleCardPreviewOpen = ref(false);
const scheduleCardPreviewEvent = ref(null);
const availabilityScheduleMenu = reactive({
    open: false,
    event: null,
    left: 8,
    top: 8,
});
const confirmationPopupConfig = {
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

async function revealStep1Validation(payload = []) {
    const errors = Array.isArray(payload) ? payload : payload?.errors;
    const field = Array.isArray(payload) ? "" : payload?.field || "";
    const scroll = Array.isArray(payload) ? true : payload?.scroll !== false;
    step1ValidationRevealRequest.value = {
        nonce: step1ValidationRevealRequest.value.nonce + 1,
        errors: Array.isArray(errors) ? errors : [],
        field,
        scroll,
    };
    if (currentStep.value === 1) return;
    if (typeof bookingFlow.forceStep === "function") {
        await bookingFlow.forceStep(1, { intent: "validation-error" });
        return;
    }
    await bookingFlow.goToStep(1, { intent: "validation-error", force: true });
}

function getUnsavedChangesMessage() {
    const translated = t("booking_unsaved_changes_body");
    return translated && translated !== "booking_unsaved_changes_body"
        ? translated
        : "Are you sure you want to leave? Your changes will not be saved";
}

function normalizeDirtyValue(value) {
    if (value === null || value === undefined) return "";

    if (Array.isArray(value)) {
        return value.map((item) => normalizeDirtyValue(item));
    }

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? "" : value.toISOString();
    }

    if (typeof value === "object") {
        return Object.keys(value)
            .sort()
            .reduce((normalized, key) => {
                normalized[key] = normalizeDirtyValue(value[key]);
                return normalized;
            }, {});
    }

    return value;
}

function stableStringify(value) {
    return JSON.stringify(normalizeDirtyValue(value));
}

function getBookingFormDirtyFields() {
    const stateKeys = bookingFlow.state && typeof bookingFlow.state === "object"
        ? Object.keys(bookingFlow.state)
        : [];

    return Array.from(new Set([
        ...stateKeys,
        ...Object.keys(ADDITIONAL_BOOKING_FORM_DIRTY_DEFAULTS),
    ])).filter((key) => !NON_FORM_DIRTY_STATE_KEYS.has(key));
}

function getBookingFormStateValueForDirty(field) {
    const stateValue = bookingFlow.state?.[field];
    if (stateValue !== undefined) return stateValue;

    if (Object.prototype.hasOwnProperty.call(ADDITIONAL_BOOKING_FORM_DIRTY_DEFAULTS, field)) {
        return ADDITIONAL_BOOKING_FORM_DIRTY_DEFAULTS[field];
    }

    return "";
}

function createBookingFormDirtySnapshot() {
    return getBookingFormDirtyFields().reduce((snapshot, field) => {
        snapshot[field] = getBookingFormStateValueForDirty(field);
        return snapshot;
    }, {});
}

function hasDirtyChangesComparedToBaseline() {
    if (!dirtyTrackingStarted.value || !dirtyBaselineSignature.value) return false;
    return stableStringify(createBookingFormDirtySnapshot()) !== dirtyBaselineSignature.value;
}

function setUnsavedChanges(value) {
    hasUnsavedChanges.value = Boolean(value);
}

function resetDirtyTracking() {
    dirtyBaselineSignature.value = stableStringify(createBookingFormDirtySnapshot());
    dirtyTrackingStarted.value = true;
    setUnsavedChanges(false);
}

async function startDirtyTrackingFromCurrentState() {
    if (dirtyTrackingStarted.value) return;

    await nextTick();
    await nextTick();
    dirtyBaselineSignature.value = stableStringify(createBookingFormDirtySnapshot());
    dirtyTrackingStarted.value = true;
    setUnsavedChanges(hasUnsavedChanges.value || hasDirtyChangesComparedToBaseline());
}

function markFormDirtyFromUserInteraction(event) {
    const target = event?.target;
    const tagName = String(target?.tagName || "").toLowerCase();
    const isFormElement = ["input", "textarea", "select"].includes(tagName)
        || target?.isContentEditable === true;

    if (!isFormElement || suppressUnsavedLeaveWarning.value) return;
    setUnsavedChanges(true);
}

function shouldWarnBeforeLeaving() {
    return hasUnsavedChanges.value && !suppressUnsavedLeaveWarning.value;
}

function resolvePendingUnsavedLeave(shouldLeave) {
    const resolver = pendingUnsavedLeaveResolve;
    pendingUnsavedLeaveResolve = null;
    pendingUnsavedLeavePromise = null;
    unsavedLeaveDialogOpen.value = false;

    if (shouldLeave) {
        resetDirtyTracking();
    }

    resolver?.(Boolean(shouldLeave));
}

function requestUnsavedLeaveConfirmation() {
    if (!shouldWarnBeforeLeaving()) return Promise.resolve(true);

    if (pendingUnsavedLeavePromise) {
        return pendingUnsavedLeavePromise;
    }

    unsavedLeaveDialogOpen.value = true;
    pendingUnsavedLeavePromise = new Promise((resolve) => {
        pendingUnsavedLeaveResolve = resolve;
    });
    return pendingUnsavedLeavePromise;
}

async function requestFormExit() {
    const canLeave = await requestUnsavedLeaveConfirmation();
    if (!canLeave) return;
    emit("back");
}

function handleBeforeUnload(event) {
    if (!shouldWarnBeforeLeaving()) return undefined;

    const message = getUnsavedChangesMessage();
    event.preventDefault();
    event.returnValue = message;
    return message;
}

function asDate(value) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getBookedSlotEventId(slot = {}) {
    const snapshot = slot?.eventSnapshot && typeof slot.eventSnapshot === "object" ? slot.eventSnapshot : {};
    const raw = slot?.raw && typeof slot.raw === "object" ? slot.raw : {};
    const rawSnapshot = raw?.eventSnapshot && typeof raw.eventSnapshot === "object" ? raw.eventSnapshot : {};
    return String(
        slot?.eventId
        || slot?.event_id
        || snapshot.eventId
        || snapshot.id
        || raw.eventId
        || raw.event_id
        || rawSnapshot.eventId
        || rawSnapshot.id
        || "",
    );
}

function getBookedSlotStatus(slot = {}) {
    return String(slot?.status || slot?.bookingStatus || slot?.approvalStatus || slot?.raw?.status || "").toLowerCase();
}

function getBookedSlotEnd(slot = {}) {
    return asDate(
        slot?.endIso
        || slot?.endAtIso
        || slot?.endAt
        || slot?.end
        || slot?.raw?.endIso
        || slot?.raw?.endAtIso
        || slot?.raw?.endAt
        || slot?.raw?.end,
    );
}

function hasActiveFutureBookedSlotForEvent(eventId) {
    const targetEventId = String(eventId || "").trim();
    if (!targetEventId) return false;

    const nowMs = Date.now();
    return bookedSlotsRawForCalendar.value.some((slot) => {
        if (getBookedSlotEventId(slot) !== targetEventId) return false;
        if (!ACTIVE_BOOKING_LOCK_STATUSES.has(getBookedSlotStatus(slot))) return false;

        const endDate = getBookedSlotEnd(slot);
        return endDate ? endDate.getTime() >= nowMs : true;
    });
}

function resolveCreatorEventId(event = {}) {
    const raw = event?.raw && typeof event.raw === "object" ? event.raw : {};
    return String(event?.eventId || event?.id || raw.eventId || raw.id || "").trim();
}

function filterCreatorEventsForAvailabilityPreview(events = []) {
    const list = Array.isArray(events) ? events : [];
    const editEventId = resolvedEditEventId.value;
    if (!isEditMode.value || !editEventId) return list;

    return list.filter((event) => resolveCreatorEventId(event) !== editEventId);
}

const editGroupBookedFieldsLocked = computed(() => (
    isEditMode.value
    && currentType.value === "group"
    && hasActiveFutureBookedSlotForEvent(resolvedEditEventId.value)
));
const editScheduleLocked = computed(() => editGroupBookedFieldsLocked.value);
const editPricingLocked = computed(() => editGroupBookedFieldsLocked.value);

watch(editScheduleLocked, (locked) => {
    bookingFlow.setState("isGroupScheduleLocked", locked, { reason: "edit-schedule-lock-sync", silent: true });
}, { immediate: true });

watch(editPricingLocked, (locked) => {
    bookingFlow.setState("isGroupPricingLocked", locked, { reason: "edit-pricing-lock-sync", silent: true });
}, { immediate: true });

const DEFAULT_EVENT_COLOR = "#5549FF";
const AVAILABILITY_TITLE_BOOKING_START_WINDOW_MS = 15 * 60 * 1000;
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
    return resolveCreatorIdFromContext({
        preferredId: props.creatorId,
        route,
        engine: bookingFlow,
        fallback: props.embedded ? 1 : DEFAULT_VUE_CREATOR_ID,
    });
};

const getBrowserTimezone = () => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch (error) {
        return "";
    }
};

const resolveCreatorTimezone = () => {
    const creatorData = props.creatorData && typeof props.creatorData === "object"
        ? props.creatorData
        : {};
    const candidates = [
        creatorData.timezone,
        creatorData.time_zone,
        creatorData.creatorTimezone,
        getBrowserTimezone(),
    ];

    for (const candidate of candidates) {
        if (typeof candidate !== "string") continue;
        const normalized = candidate.trim();
        if (normalized) return normalized;
    }

    return DEFAULT_CREATOR_TIMEZONE;
};

const syncCreatorTimezone = (reason = "creator-timezone-sync") => {
    bookingFlow.setState("creatorTimezone", resolveCreatorTimezone(), { reason, silent: true });
};

const previewEventForFanFlow = computed(() => {
    try {
        const creatorId = resolveCreatorId();
        return mapDraftEventToFanBookingPreview(
            { ...(bookingFlow.state || {}) },
            {
                creatorId,
                previewEventId: `preview_event_${creatorId}`,
            },
        );
    } catch (error) {
        return null;
    }
});

const previewBookedSlotsForFanFlow = computed(() => {
    const slots = bookingFlow.getState("fanBooking.catalog.bookedSlots");
    return Array.isArray(slots) ? slots : [];
});

const clearRefreshQueryFlag = async () => {
    if (route.query?.refresh == null) return;

    const nextQuery = { ...route.query };
    delete nextQuery.refresh;

    await router.replace({
        path: route.path,
        query: nextQuery,
    });
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
                apiBaseUrl: props.apiBaseUrl || undefined,
            },
        },
    );

    if (!result?.ok) {
        calendarError.value = result?.meta?.uiErrors?.[0]
            || result?.error?.message
            || t("booking_load_creator_booked_slots_failed");
        calendarBookedSlots.value = [];
        calendarAvailabilitySlots.value = [];
        creatorEventsForCalendar.value = [];
        bookedSlotsRawForCalendar.value = [];
        bookedSlotsIndexForCalendar.value = {};
    } else {
        const creatorEvents = Array.isArray(result?.data?.events) ? result.data.events : [];
        const bookedSlotsRaw = Array.isArray(result?.data?.bookedSlots) ? result.data.bookedSlots : [];
        const bookedSlotsIndex = result?.data?.bookedSlotsIndex || {};

        creatorEventsForCalendar.value = creatorEvents;
        bookedSlotsRawForCalendar.value = bookedSlotsRaw;
        bookedSlotsIndexForCalendar.value = bookedSlotsIndex;
        const availabilityPreviewEvents = filterCreatorEventsForAvailabilityPreview(creatorEvents);
        const { bookedCalendarSlots, availabilityCalendarSlots } = buildCalendarSlotsFromContext({
            creatorEvents,
            availabilityEvents: availabilityPreviewEvents,
            bookedSlotsRaw,
            bookedSlotsIndex,
            focusDate: state.focus,
        });

        calendarBookedSlots.value = bookedCalendarSlots;
        calendarAvailabilitySlots.value = availabilityCalendarSlots;
    }

    calendarLoading.value = false;
    await nextTick();
    await mainCalendarRef.value?.scrollToCurrentTime?.({ behavior: "smooth" });
};

function normalizeHydratedAudienceState(formState = {}) {
    const normalizedState = { ...formState };
    const savedTiers = Array.isArray(formState.subscriptionTiers)
        ? formState.subscriptionTiers
        : String(formState.subscriptionTiers || "")
            .split(",")
            .map((tierId) => tierId.trim())
            .filter(Boolean);

    normalizedState.subscriptionTiers = savedTiers.slice(0, 1);

    if (formState.spendingRequirement === "mustOwnProducts") {
        normalizedState.whoCanBook = "everyone";
        normalizedState.spendingRequirement = "mustOwnProducts";
    } else {
        normalizedState.spendingRequirement = "none";
    }

    return normalizedState;
}

function applyFormStateToEngine(formState = {}, reason = "edit-form-hydration") {
    const normalizedState = normalizeHydratedAudienceState(formState);
    Object.entries(normalizedState).forEach(([key, value]) => {
        bookingFlow.setState(key, value, { reason, silent: true });
    });
    bookingFlow.initializeFromState?.();
}

async function hydrateEditEventIfNeeded() {
    if (!isEditMode.value) {
        editFormReady.value = true;
        return;
    }

    const eventId = resolvedEditEventId.value;
    if (!eventId) {
        editError.value = t("booking_edit_missing_event_id");
        editFormReady.value = true;
        return;
    }

    editLoading.value = true;
    editError.value = "";

    try {
        const result = await bookingFlow.callFlow(
            "events.fetchEvent",
            { eventId },
            {
                forceRefresh: true,
                context: {
                    stateEngine: bookingFlow,
                    creatorId: resolveCreatorId(),
                    apiBaseUrl: props.apiBaseUrl || undefined,
                },
            },
        );

        if (!result?.ok) {
            editError.value = result?.meta?.uiErrors?.[0]
                || result?.error?.message
                || t("booking_edit_load_failed");
            return;
        }

        const event = result?.data?.item || null;
        if (!event) {
            editError.value = t("booking_edit_load_failed");
            return;
        }

        const formState = mapEventToBookingFormState(event);
        editEventType.value = formState.eventType === "group-event" ? "group" : "private";
        applyFormStateToEngine(formState);
    } finally {
        editLoading.value = false;
        editFormReady.value = true;
    }
}

const scrollToStepTopOnMobile = async () => {
    if (typeof window === "undefined" || window.innerWidth >= 1024) return;

    await nextTick();

    const container = formScrollContainer.value;
    if (container?.scrollTo) {
        container.scrollTo({ top: 0, left: 0, behavior: "auto" });
    } else if (container) {
        container.scrollTop = 0;
    }

    if (typeof window !== "undefined" && window.scrollTo) {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    emit("scroll-top-request", {
        reason: "step-advanced",
        behavior: "auto",
    });
};

// Init
onMounted(async () => {
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleCalendarDocumentClick);
    bookingFlow.initialize();
    const resolvedCreatorId = resolveCreatorId();
    bookingFlow.setState("apiBaseUrl", props.apiBaseUrl || "", { reason: "initial-api-base-url", silent: true });
    bookingFlow.setState("creatorId", resolvedCreatorId, { reason: "initial-create-flow", silent: true });
    syncCreatorTimezone("initial-create-flow");
    bookingFlow.setState(
        "eventType",
        currentType.value === "group" ? "group-event" : "1on1-call",
        { reason: "initial-create-flow", silent: true },
    );

    // Listen to engine changes to update UI
    bookingFlow.on('step:changed', ({ prev, next }) => {
        currentStep.value = next;
        if (prev === 1 && next === 2) {
            void scrollToStepTopOnMobile();
        }
    });

    await hydrateEditEventIfNeeded();

    const shouldForceRefresh = route.query?.refresh === "1";
    await fetchCreatorBookedSlots(shouldForceRefresh || isEditMode.value);
    await startDirtyTrackingFromCurrentState();
    if (shouldForceRefresh) {
        clearRefreshQueryFlag();
    }

    document.body.classList.add("event-form-open");
    notifyEventsEmbedFormOpenState(true);
});

watch(currentType, (nextType) => {
    bookingFlow.setState(
        "eventType",
        nextType === "group" ? "group-event" : "1on1-call",
        { reason: "type-sync", silent: true },
    );
});

watch(
    () => [props.creatorId, route.query?.creatorId],
    () => {
        bookingFlow.setState("creatorId", resolveCreatorId(), { reason: "creator-context-sync", silent: true });
        fetchCreatorBookedSlots(true);
    },
);

watch(
    () => props.creatorData,
    () => {
        syncCreatorTimezone();
    },
    { deep: true },
);

watch(
    () => props.apiBaseUrl,
    (nextValue) => {
        bookingFlow.setState("apiBaseUrl", nextValue || "", { reason: "api-base-url-sync", silent: true });
    },
);

watch(
    () => route.query?.refresh,
    (nextRefresh, previousRefresh) => {
        if (nextRefresh !== "1" || nextRefresh === previousRefresh) return;
        fetchCreatorBookedSlots(true);
        clearRefreshQueryFlag();
    },
);

watch(
    () => bookingFlow.state,
    () => {
        if (!dirtyTrackingStarted.value) return;
        setUnsavedChanges(hasDirtyChangesComparedToBaseline());
    },
    { deep: true },
);

watch(hasUnsavedChanges, (isDirty) => {
    notifyEventsEmbedFormDirtyState(isDirty);
}, { immediate: true });

onBeforeRouteLeave(async () => {
    return requestUnsavedLeaveConfirmation();
});

onBeforeUnmount(() => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
    document.removeEventListener("click", handleCalendarDocumentClick);
    notifyEventsEmbedFormDirtyState(false);
    
    document.body.classList.remove("event-form-open");
    notifyEventsEmbedFormOpenState(false);
    
    if (pendingUnsavedLeaveResolve) {
        resolvePendingUnsavedLeave(false);
    }
});

const now = new Date();
const y = now.getFullYear();
const m = now.getMonth();
const todayForCalendar = new Date(y, m, now.getDate());

// --- THEME 2 ---
const theme2 = {
    mini: {},
    main: {
        wrapper: 'relative flex flex-col gap-[0px] overflow-hidden rounded-xl',
        title: ' text-base font-semibold text-slate-800 ',
        xHeader: '',
        axisXLabel: 'flex flex-col justify-end pb-[0.75rem] w-[4.8rem] min-h-[5rem]',
        axisXDay: 'py-1 text-center min-h-[5rem] text-slate-500 font-medium',
        axisXToday: 'bg-gray-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto',
        axisYRow: 'booking-form-calendar-time-label h-[7.5rem] text-right pr-2 w-[4.8rem] shrink-0 uppercase text-slate-400 text-[0.688rem] font-medium leading-4 pt-1',
        colBase: 'relative bg-white/20 border-l border-white/50 overflow-hidden',
        gridRow: 'h-[7.5rem] border-b border-white/50',
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

const GENERIC_EVENT_TITLE_FALLBACKS = new Set(["event title", "untitled event"]);

function normalizeEventTitleCandidate(value) {
    if (typeof value !== "string") return "";
    return value.trim();
}

function isGenericEventTitle(value) {
    return GENERIC_EVENT_TITLE_FALLBACKS.has(String(value || "").trim().toLowerCase());
}

function resolveEventTitle(event) {
    const candidates = [
        event?.title,
        event?.eventTitle,
        event?.eventName,
        event?.event_name,
        event?.name,
        event?.raw?.title,
        event?.raw?.eventTitle,
        event?.raw?.eventName,
        event?.raw?.event_name,
        event?.raw?.name,
    ];
    let genericFallback = "";

    for (const candidate of candidates) {
        const normalized = normalizeEventTitleCandidate(candidate);
        if (!normalized) continue;

        if (isGenericEventTitle(normalized)) {
            genericFallback = genericFallback || normalized;
            continue;
        }

        return normalized;
    }

    return genericFallback || t("dashboard_booking_schedule_untitled_event");
}

function buildCalendarSlotsFromContext({
    creatorEvents = [],
    availabilityEvents = creatorEvents,
    bookedSlotsRaw = [],
    bookedSlotsIndex = {},
    focusDate = new Date(),
}) {
    const colorByEventId = new Map(
        creatorEvents
            .map((event) => [
                resolveCreatorEventId(event),
                event?.eventColorSkin || event?.raw?.eventColorSkin || DEFAULT_EVENT_COLOR,
            ])
            .filter(([eventId]) => Boolean(eventId))
    );

    const titleByEventId = new Map(
        creatorEvents
            .map((event) => [
                resolveCreatorEventId(event),
                resolveEventTitle(event),
            ])
            .filter(([eventId]) => Boolean(eventId))
    );

    const callTypeByEventId = new Map(
        creatorEvents
            .map((event) => [
                resolveCreatorEventId(event),
                String(event?.eventCallType || event?.raw?.eventCallType || "").toLowerCase(),
            ])
            .filter(([eventId]) => Boolean(eventId))
    );

    const eventTypeByEventId = new Map(
        creatorEvents
            .map((event) => [
                resolveCreatorEventId(event),
                String(event?.type || event?.eventType || event?.raw?.type || event?.raw?.eventType || "").toLowerCase(),
            ])
            .filter(([eventId]) => Boolean(eventId))
    );

    const createdAtByEventId = new Map(
        creatorEvents
            .map((event) => [
                resolveCreatorEventId(event),
                event?.createdAt || event?.created_at || event?.raw?.createdAt || event?.raw?.created_at || null,
            ])
            .filter(([eventId]) => Boolean(eventId))
    );

    const bookedCalendarSlots = mapBookedSlotsToCalendarEvents(bookedSlotsRaw, {
        includeStatuses: ["pending", "pending_hold", "confirmed", "completed"],
        titleFallback: t("dashboard_booked_slot"),
    }).map((event) => {
        const eventId = String(event?.eventId || "");
        const eventColorSkin = colorByEventId.get(eventId)
            || event?.eventColorSkin
            || event?.raw?.eventColorSkin
            || DEFAULT_EVENT_COLOR;
        const eventCallType = callTypeByEventId.get(eventId)
            || String(event?.eventCallType || event?.raw?.eventCallType || "").toLowerCase();
        const eventType = eventTypeByEventId.get(eventId)
            || String(event?.eventType || event?.type || event?.raw?.eventType || "").toLowerCase();
        const createdAt = createdAtByEventId.get(eventId) || event?.createdAt || event?.raw?.createdAt || null;

        return {
            ...event,
            title: titleByEventId.get(eventId) || event?.title || t("dashboard_booked_slot"),
            color: eventColorSkin,
            eventColorSkin,
            eventCallType,
            eventType,
            createdAt,
            isExistingSchedule: true,
            raw: {
                ...(event?.raw || {}),
                eventCallType,
                eventType,
                eventColorSkin,
                createdAt,
            },
        };
    });

    const shouldHideAvailabilityTitle = (slot) => {
        const eventId = String(slot?.eventId || "").trim();
        const availabilityStartMs = new Date(slot?.start).getTime();
        if (!eventId || Number.isNaN(availabilityStartMs)) return false;
        const windowEndMs = availabilityStartMs + AVAILABILITY_TITLE_BOOKING_START_WINDOW_MS;

        return bookedCalendarSlots.some((booking) => {
            if (String(booking?.eventId || "").trim() !== eventId) return false;
            const bookingStartMs = new Date(booking?.start).getTime();
            return !Number.isNaN(bookingStartMs)
                && bookingStartMs >= availabilityStartMs
                && bookingStartMs <= windowEndMs;
        });
    };

    const availabilityCalendarSlots = mapAvailabilityToCalendarEvents(availabilityEvents, {
        bookedSlotsIndex,
        focusDate,
        rangeDaysBefore: 14,
        rangeDaysAfter: 56,
        mode: "scheduleWindow",
    }).map((event) => ({
        ...event,
        slot: "availability",
        title: titleByEventId.get(String(event?.eventId || "")) || resolveEventTitle(event),
        color: colorByEventId.get(String(event?.eventId || "")) || DEFAULT_EVENT_COLOR,
        eventColorSkin: colorByEventId.get(String(event?.eventId || "")) || DEFAULT_EVENT_COLOR,
        eventCallType: callTypeByEventId.get(String(event?.eventId || "")) || String(event?.eventCallType || "").toLowerCase(),
        createdAt: createdAtByEventId.get(String(event?.eventId || "")) || event?.createdAt || event?.raw?.createdAt || null,
        hideAvailabilityTitle: shouldHideAvailabilityTitle(event),
        isExistingSchedule: true,
        raw: {
            ...(event?.raw || {}),
            eventCallType: callTypeByEventId.get(String(event?.eventId || "")) || String(event?.eventCallType || "").toLowerCase(),
            eventType: eventTypeByEventId.get(String(event?.eventId || "")) || String(event?.raw?.eventType || event?.type || "").toLowerCase(),
            eventColorSkin: colorByEventId.get(String(event?.eventId || "")) || event?.raw?.eventColorSkin || DEFAULT_EVENT_COLOR,
            createdAt: createdAtByEventId.get(String(event?.eventId || "")) || event?.createdAt || event?.raw?.createdAt || null,
        },
    }));

    return {
        bookedCalendarSlots,
        availabilityCalendarSlots,
    };
}

function createPreviewEvent({ dateIso, startTime, endTime, title, color, index }) {
    const start = dateTimeFromIsoHm(dateIso, startTime);
    if (!start) return null;

    let endDateIso = dateIso;
    const startMinutes = Number(startTime.slice(0, 2)) * 60 + Number(startTime.slice(3, 5));
    const endMinutes = Number(endTime.slice(0, 2)) * 60 + Number(endTime.slice(3, 5));
    if (endMinutes <= startMinutes) {
        return null;
    }

    const end = dateTimeFromIsoHm(endDateIso, endTime);
    if (!end) return null;

    return {
        id: `draft_${dateIso}_${startTime}_${endTime}_${index}`,
        eventId: resolvedEditEventId.value ? `draft_${resolvedEditEventId.value}` : "draft_new_event",
        title,
        start,
        end,
        slot: "custom",
        color,
        isDraftPreview: true,
        isDraft: true,
        isAvailabilityBlock: true,
        isExistingSchedule: false,
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

function getLastDayOfMonth(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0).getDate();
}

function shouldIncludeMonthlyDate({ candidateDateIso, anchorDateIso }) {
    const candidate = dateFromIso(candidateDateIso);
    const anchor = dateFromIso(anchorDateIso);
    if (!candidate || !anchor) return false;

    const targetDay = Math.min(
        anchor.getDate(),
        getLastDayOfMonth(candidate.getFullYear(), candidate.getMonth()),
    );

    return candidate.getDate() === targetDay;
}

function resolveDraftCalendarFocusDate(stateSnapshot = {}) {
    const repeatRule = String(stateSnapshot.repeatRule || "weekly");
    const selectedDateIso = String(stateSnapshot.selectedDate || "").trim();
    const dateFromIsoValue = String(stateSnapshot.dateFrom || "").trim();

    if (repeatRule === "doesNotRepeat") {
        const firstScheduledDate = (Array.isArray(stateSnapshot.oneTimeAvailability)
            ? stateSnapshot.oneTimeAvailability
            : [])
            .find((entry) => (
                String(entry?.date || "").trim()
                && Array.isArray(entry?.slots)
                && entry.slots.length > 0
            ))?.date;

        return dateFromIso(String(firstScheduledDate || selectedDateIso || dateFromIsoValue).slice(0, 10));
    }

    const anchorDate = dateFromIso(dateFromIsoValue);
    if (!anchorDate || repeatRule === "monthly" || repeatRule === "daily") {
        return anchorDate;
    }

    const scheduledDayIndexes = new Set(
        (Array.isArray(stateSnapshot.weeklyAvailability) ? stateSnapshot.weeklyAvailability : [])
            .filter((day) => !day?.unavailable && Array.isArray(day?.slots) && day.slots.length > 0)
            .map((day) => DAY_KEY_TO_INDEX[String(day?.key || day?.name || "").toLowerCase()])
            .filter(Number.isFinite),
    );

    if (scheduledDayIndexes.size === 0) return anchorDate;

    for (let offset = 0; offset < 7; offset += 1) {
        const candidate = addDays(anchorDate, offset);
        if (scheduledDayIndexes.has(candidate.getDay())) return candidate;
    }

    return anchorDate;
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
    } else if (repeatRule === "monthly") {
        const monthlyAvailability = Array.isArray(stateSnapshot.monthlyAvailability)
            ? stateSnapshot.monthlyAvailability
            : [];
        const monthlySlots = monthlyAvailability.length > 0
            ? monthlyAvailability
            : [{ startTime: selectedStartTime, endTime: selectedEndTime }];

        weekDateIsos.forEach((dateIso) => {
            if (!inRange(dateIso)) return;
            if (!shouldIncludeMonthlyDate({ candidateDateIso: dateIso, anchorDateIso: dateFrom })) return;

            monthlySlots.forEach((slot, slotIndex) => {
                const preview = createPreviewEvent({
                    dateIso,
                    startTime: toHm(slot?.startTime, selectedStartTime),
                    endTime: toHm(slot?.endTime, selectedEndTime),
                    title: eventTitle,
                    color: eventColor,
                    index: `monthly_${slotIndex}`,
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
    focus: new Date(todayForCalendar),
    selected: new Date(todayForCalendar),
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
    const bookedSlotsRaw = Array.isArray(bookedSlotsRawForCalendar.value)
        ? bookedSlotsRawForCalendar.value
        : [];
    const bookedSlotsIndex = bookedSlotsIndexForCalendar.value || {};

    if (creatorEvents.length === 0) {
        calendarBookedSlots.value = [];
        calendarAvailabilitySlots.value = [];
        return;
    }

    const availabilityPreviewEvents = filterCreatorEventsForAvailabilityPreview(creatorEvents);
    const { bookedCalendarSlots, availabilityCalendarSlots } = buildCalendarSlotsFromContext({
        creatorEvents,
        availabilityEvents: availabilityPreviewEvents,
        bookedSlotsRaw,
        bookedSlotsIndex,
        focusDate: state.focus,
    });

    calendarBookedSlots.value = bookedCalendarSlots;
    calendarAvailabilitySlots.value = availabilityCalendarSlots;
}

watch(
    () => [
        bookingFlow.state?.repeatRule,
        bookingFlow.state?.dateFrom,
        bookingFlow.state?.selectedDate,
        (Array.isArray(bookingFlow.state?.weeklyAvailability)
            ? bookingFlow.state.weeklyAvailability
            : [])
            .map((day) => `${day?.key || day?.name || ""}:${day?.unavailable ? 1 : 0}:${day?.slots?.length || 0}`)
            .join("|"),
        (Array.isArray(bookingFlow.state?.oneTimeAvailability)
            ? bookingFlow.state.oneTimeAvailability
            : [])
            .map((entry) => `${entry?.date || ""}:${entry?.slots?.length || 0}`)
            .join("|"),
    ],
    () => {
        const nextFocus = resolveDraftCalendarFocusDate(bookingFlow.state || {});
        if (!nextFocus || Number.isNaN(nextFocus.getTime())) return;

        const nextDateKey = formatDateIso(nextFocus);
        if (!nextDateKey || nextDateKey === formatDateIso(state.focus)) return;

        state.focus = new Date(nextFocus);
        state.selected = new Date(nextFocus);
        rebuildAvailabilityPreview();
    },
);

function getScheduleEventId(event = {}) {
    return String(event?.eventId || event?.id || event?.raw?.eventId || event?.raw?.id || "").trim();
}

function normalizeScheduleEventPayload(event = {}) {
    const eventId = getScheduleEventId(event);
    if (!eventId) return null;

    const catalogEvent = creatorEventsForCalendar.value.find(
        (candidate) => getScheduleEventId(candidate) === eventId,
    );
    const source = catalogEvent || event;
    const rawType = String(source?.type || source?.eventType || source?.raw?.type || "").toLowerCase();

    return {
        ...source,
        eventId,
        title: resolveEventTitle(source),
        type: rawType.includes("group") ? "group" : "private",
    };
}

const availabilityScheduleMenuStyle = computed(() => ({
    left: `${availabilityScheduleMenu.left}px`,
    top: `${availabilityScheduleMenu.top}px`,
}));

const scheduleCardPreviewBookedSlots = computed(() => {
    const eventId = getScheduleEventId(scheduleCardPreviewEvent.value);
    if (!eventId) return [];
    return bookedSlotsRawForCalendar.value.filter(
        (slot) => String(slot?.eventId || slot?.raw?.eventId || "").trim() === eventId,
    );
});

const deleteEventCandidateTitle = computed(() => (
    resolveEventTitle(deleteEventCandidate.value || {})
));

const cancelBookingCandidateTitle = computed(() => (
    cancelBookingCandidate.value?.event?.title || t("common_booking")
));

const cancelBookingCandidateTime = computed(() => {
    const event = cancelBookingCandidate.value?.event;
    const start = new Date(event?.start);
    const end = new Date(event?.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";
    const time = (date) => date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return `${start.toLocaleDateString()} - ${time(start)} - ${time(end)}`;
});

function positionAvailabilityScheduleMenu(domEvent) {
    if (typeof window === "undefined") return;
    const trigger = domEvent?.currentTarget || domEvent?.target;
    const menuWidth = 196;
    const menuHeight = 176;
    const gap = 8;
    const padding = 8;
    let left = Number.isFinite(domEvent?.clientX) ? domEvent.clientX : padding;
    let top = Number.isFinite(domEvent?.clientY) ? domEvent.clientY : padding;
    let topWhenAbove = top - menuHeight - gap;

    if (!Number.isFinite(domEvent?.clientX) && trigger?.getBoundingClientRect) {
        const rect = trigger.getBoundingClientRect();
        left = rect.left;
        top = rect.bottom + gap;
        topWhenAbove = rect.top - menuHeight - gap;
    }

    if (left + menuWidth > window.innerWidth - padding) {
        left = window.innerWidth - menuWidth - padding;
    }
    if (top + menuHeight > window.innerHeight - padding) {
        top = topWhenAbove;
    }

    availabilityScheduleMenu.left = Math.max(padding, left);
    availabilityScheduleMenu.top = Math.max(padding, top);
}

function openAvailabilityScheduleMenu(event, domEvent) {
    if (event?.isDraftPreview) return;
    const normalizedEvent = normalizeScheduleEventPayload(event);
    if (!normalizedEvent) return;
    domEvent?.stopPropagation?.();
    availabilityScheduleMenu.event = normalizedEvent;
    positionAvailabilityScheduleMenu(domEvent);
    availabilityScheduleMenu.open = false;
    nextTick(() => {
        if (availabilityScheduleMenu.event?.eventId === normalizedEvent.eventId) {
            availabilityScheduleMenu.open = true;
        }
    });
}

function closeAvailabilityScheduleMenu() {
    availabilityScheduleMenu.open = false;
    availabilityScheduleMenu.event = null;
}

function handleCalendarDocumentClick(event) {
    if (!availabilityScheduleMenu.open) return;
    const target = event?.target;
    if (target?.closest?.("[data-test='booking-schedule-menu']")) return;
    if (target?.closest?.("[data-test='calendar-existing-availability-block']")) return;
    closeAvailabilityScheduleMenu();
}

function openScheduleCardPreview(event) {
    const normalizedEvent = normalizeScheduleEventPayload(event);
    if (!normalizedEvent) return;
    scheduleCardPreviewEvent.value = normalizedEvent;
    scheduleCardPreviewOpen.value = true;
}

function setScheduleCardPreviewOpen(open) {
    scheduleCardPreviewOpen.value = Boolean(open);
    if (!open) scheduleCardPreviewEvent.value = null;
}

async function requestEditScheduleEvent(event) {
    const normalizedEvent = normalizeScheduleEventPayload(event);
    if (!normalizedEvent) return;
    const canLeave = await requestUnsavedLeaveConfirmation();
    if (!canLeave) return;
    setScheduleCardPreviewOpen(false);
    closeAvailabilityScheduleMenu();
    emit("edit-event", {
        eventId: normalizedEvent.eventId,
        type: normalizedEvent.type,
        event: normalizedEvent,
    });
}

function openDeleteEventPopup(event) {
    const normalizedEvent = normalizeScheduleEventPayload(event);
    if (!normalizedEvent) return;
    closeAvailabilityScheduleMenu();
    deleteEventCandidate.value = normalizedEvent;
    deleteEventPopupOpen.value = true;
}

function closeDeleteEventPopup() {
    if (deleteEventLoading.value) return;
    deleteEventPopupOpen.value = false;
    deleteEventCandidate.value = null;
}

async function confirmDeleteEvent() {
    const eventId = getScheduleEventId(deleteEventCandidate.value);
    if (!eventId || deleteEventLoading.value) return;
    deleteEventLoading.value = true;
    try {
        const result = await bookingFlow.callFlow(
            "events.deleteEvent",
            { eventId },
            {
                context: {
                    stateEngine: bookingFlow,
                    creatorId: resolveCreatorId(),
                    apiBaseUrl: props.apiBaseUrl || undefined,
                },
            },
        );
        if (!result?.ok) {
            showToast({
                type: "error",
                title: t("dashboard_delete_booking_schedule_failed_title"),
                message: result?.meta?.uiErrors?.[0] || result?.error?.message || t("common_try_again"),
            });
            return;
        }
        showToast({
            type: "success",
            title: t("dashboard_delete_booking_schedule_success_title"),
            message: t("dashboard_delete_booking_schedule_success_message"),
        });
        deleteEventPopupOpen.value = false;
        deleteEventCandidate.value = null;
        await fetchCreatorBookedSlots(true);
    } finally {
        deleteEventLoading.value = false;
    }
}

function resolveBookingIdFromPayload(payload = {}) {
    return String(
        payload?.bookingId || payload?.event?.bookingId || payload?.event?.raw?.bookingId || "",
    ).trim() || null;
}

async function reviewPendingBooking(payload, decision) {
    const bookingId = resolveBookingIdFromPayload(payload);
    if (!bookingId) {
        showToast({
            type: "error",
            title: t("dashboard_booking_action_failed_title"),
            message: t("dashboard_booking_action_missing_id"),
        });
        return;
    }
    if (reviewPendingLoading.value) return;
    reviewPendingLoading.value = true;
    try {
        const result = await bookingFlow.callFlow(
            "bookings.reviewPendingBooking",
            {
                bookingId,
                decision,
                actor: "creator",
                reason: decision === "approve" ? "approved_by_creator" : "rejected_by_creator",
            },
            {
                context: {
                    stateEngine: bookingFlow,
                    creatorId: resolveCreatorId(),
                    apiBaseUrl: props.apiBaseUrl || undefined,
                },
            },
        );
        if (!result?.ok) {
            showToast({
                type: "error",
                title: t("dashboard_booking_action_failed_title"),
                message: result?.meta?.uiErrors?.[0] || result?.error?.message || t("dashboard_booking_action_update_failed"),
            });
            return;
        }
        showToast({
            type: "success",
            title: t("dashboard_booking_updated_title"),
            message: t("dashboard_booking_updated_message", {
                action: decision === "approve" ? "approved" : "rejected",
            }),
        });
        await fetchCreatorBookedSlots(true);
    } finally {
        reviewPendingLoading.value = false;
    }
}

function handleApproveBooking(payload) {
    return reviewPendingBooking(payload, "approve");
}

function handleRejectBooking(payload) {
    return reviewPendingBooking(payload, "reject");
}

function openCancelBookingPopup(payload = {}) {
    const bookingId = resolveBookingIdFromPayload(payload);
    if (!bookingId) {
        showToast({
            type: "error",
            title: t("dashboard_booking_cancel_failed_title"),
            message: t("dashboard_cancel_missing_id"),
        });
        return;
    }
    cancelBookingCandidate.value = { bookingId, event: payload?.event || payload };
    cancelBookingPopupOpen.value = true;
}

function closeCancelBookingPopup() {
    if (cancelBookingLoading.value) return;
    cancelBookingPopupOpen.value = false;
    cancelBookingCandidate.value = null;
}

async function confirmCancelBooking() {
    const bookingId = cancelBookingCandidate.value?.bookingId;
    if (!bookingId || cancelBookingLoading.value) return;
    cancelBookingLoading.value = true;
    try {
        const result = await bookingFlow.callFlow(
            "bookings.cancelBooking",
            { bookingId, actor: "creator", reason: "creator_cancelled_from_booking_form_calendar" },
            {
                context: {
                    stateEngine: bookingFlow,
                    creatorId: resolveCreatorId(),
                    apiBaseUrl: props.apiBaseUrl || undefined,
                },
            },
        );
        if (!result?.ok) {
            showToast({
                type: "error",
                title: t("dashboard_booking_cancel_failed_title"),
                message: result?.meta?.uiErrors?.[0] || result?.error?.message || t("dashboard_booking_cancel_failed_message"),
            });
            return;
        }
        showToast({
            type: "success",
            title: t("dashboard_booking_cancelled_title"),
            message: t("dashboard_booking_cancelled_message"),
        });
        cancelBookingPopupOpen.value = false;
        cancelBookingCandidate.value = null;
        await fetchCreatorBookedSlots(true);
    } finally {
        cancelBookingLoading.value = false;
    }
}

function handleJoinCall(payload = {}) {
    const event = payload?.sourceEvent || payload?.event || payload;
    const raw = event?.raw && typeof event.raw === "object" ? event.raw : {};
    const isGroup = String(event?.eventType || event?.type || raw?.eventType || raw?.type || "")
        .toLowerCase()
        .includes("group");
    const joinState = getBookingJoinState({
        bookingId: event?.bookingId || raw?.bookingId,
        startAt: event?.start,
        endAt: event?.end,
        status: event?.status || raw?.status,
        enableCallReminderMinutesBefore: raw?.enableCallReminderMinutesBefore,
        callReminderMinutesBefore: raw?.callReminderMinutesBefore,
        reminderMinutes: raw?.reminderMinutes,
        extensions: raw?.extensions,
    });
    const groupUrl = isGroup
        ? buildScheduledGroupMeetingUrl({
            eventId: getScheduleEventId(event),
            startIso: event?.start || raw?.startIso || raw?.startAtIso,
        })
        : null;
    const joinUrl = groupUrl || joinState.joinUrl;
    if (!joinState.canJoin || !joinUrl) {
        showToast({
            type: "error",
            title: t("dashboard_join_unavailable_title"),
            message: t("dashboard_join_unavailable_message"),
        });
        return;
    }
    emit("open-url", { url: joinUrl, target: "_blank" });
}

const onDebugSubmit = () => {
    console.log("Submit Clicked. Current State:", JSON.parse(JSON.stringify(bookingFlow.state)));
    alert(t("booking_submitted_alert"));
};

// Helper for title
const formTitle = computed(() => {
    return currentType.value === 'group' ? t("booking_group_event_settings") : t("booking_private_booking_settings");
});

const handleCreateFlowCreated = async (payload) => {
    suppressUnsavedLeaveWarning.value = true;
    resetDirtyTracking();

    if (props.embedded) {
        emit("created", payload);
        return;
    }

    await router.push({
        path: "/dashboard/events",
        query: {
            refresh: "1",
            creatorId: String(resolveCreatorId()),
        },
    });
};

// Disable and hide body overflow when this component is active to prevent background scrolling
useBodyOverflowHidden({ minWidth: 1010 });
</script>

<template>
    <component
        :is="embedded ? 'div' : DashboardWrapperTwoColContainer"
        :class="embedded ? 'h-full' : ''"
        @input.capture="markFormDirtyFromUserInteraction"
        @change.capture="markFormDirtyFromUserInteraction"
    >
        <ToastHost />
        <div :class="[embedded ? '' : '', 'flex w-full flex-col lg:flex-row gap-4 lg:gap-0']">
            <div
                :class="[
                    embedded
                        ? 'flex h-full flex-col gap-6 relative w-full lg:w-[40vw] lg:min-w-[31.25rem] lg:max-w-[45rem] bg-white/50 shadow-[0px_4px_6px_-2px_rgba(16,24,40,0.03)] backdrop-blur-xl lg:overflow-y-auto overflow-x-hidden lg:no-scrollbar lg:h-dvh lg:max-h-dvh'
                        : 'flex h-full flex-col gap-6 relative w-full lg:w-[40vw] lg:min-w-[31.25rem] lg:max-w-[45rem] bg-white/50 shadow-[0px_4px_6px_-2px_rgba(16,24,40,0.03)] backdrop-blur-xl lg:overflow-y-auto overflow-x-hidden lg:no-scrollbar lg:h-dvh lg:max-h-dvh'
                ]">

                <div class="px-2 md:px-4 lg:px-6 pt-6 pb-2 bg-white/20 flex justify-between items-center gap-3">
                    <div class="flex items-center gap-3 min-w-0">
                        <button
                            hidden
                            v-if="false && embedded"
                            type="button"
                            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50"
                            :aria-label="t('booking_back_to_events')"
                            @click="requestFormExit"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path
                                    d="M15 18L9 12L15 6"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                        </button>

                        <div class="justify-start text-slate-700 text-base font-semibold leading-6 truncate">
                            {{ formTitle }}
                        </div>
                    </div>
                    <div data-test="booking-form-close" @click="requestFormExit" class="w-2.5 h-2.5 relative overflow-hidden cursor-pointer">
                        <img :src="closeIcon" alt="" />
                    </div>
                </div>

                <div ref="formScrollContainer" :class="[embedded ? 'w-full h-full min-h-0 overflow-y-auto overflow-x-hidden' : 'w-full h-dvh max-h-dvh overflow-y-auto overflow-x-hidden']">
                    <div v-if="editLoading || !editFormReady" class="px-6 py-10">
                        <div class="h-4 w-40 rounded-full bg-[#101828]/10 animate-pulse" />
                        <div class="mt-5 space-y-3">
                            <div class="h-10 rounded bg-[#101828]/10 animate-pulse" />
                            <div class="h-24 rounded bg-[#101828]/10 animate-pulse" />
                            <div class="h-16 rounded bg-[#101828]/10 animate-pulse" />
                        </div>
                    </div>

                    <div v-else-if="editError" class="mx-6 mt-6 rounded bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                        {{ editError }}
                    </div>

                    <!-- Private Form -->
                    <template v-else-if="currentType === 'private'">
                        <OneOnOneBookinStep1
                            v-if="currentStep === 1"
                            :engine="bookingFlow"
                            :embedded="embedded"
                            :schedule-locked="false"
                            :pricing-locked="false"
                            :validation-reveal-request="step1ValidationRevealRequest"
                            @preview-schedule="previewSchedule = true"
                        />

                        <OneOnOneBookinStep2
                            v-if="currentStep === 2"
                            :engine="bookingFlow"
                            :embedded="embedded"
                            :is-edit-mode="isEditMode"
                            :edit-event-id="resolvedEditEventId"
                            @created="handleCreateFlowCreated"
                            @preview-schedule="previewSchedule = true"
                            @reveal-step1-validation="revealStep1Validation"
                        />
                    </template>

                    <!-- Group Form -->
                    <template v-else-if="currentType === 'group'">
                        <OneOnOneBookinStep1
                            v-if="currentStep === 1"
                            :engine="bookingFlow"
                            :embedded="embedded"
                            bookingType="group"
                            :schedule-locked="editScheduleLocked"
                            :pricing-locked="editPricingLocked"
                            :validation-reveal-request="step1ValidationRevealRequest"
                            @preview-schedule="previewSchedule = true"
                        />

                        <OneOnOneBookinStep2
                            v-if="currentStep === 2"
                            :engine="bookingFlow"
                            :embedded="embedded"
                            bookingType="group"
                            :is-edit-mode="isEditMode"
                            :edit-event-id="resolvedEditEventId"
                            @created="handleCreateFlowCreated"
                            @preview-schedule="previewSchedule = true"
                            @reveal-step1-validation="revealStep1Validation"
                        />
                    </template>
                </div>

            </div>

            <div
                :class="[
                    embedded
                        ? 'w-full lg:overflow-y-auto lg:no-scrollbar lg:h-dvh lg:max-h-dvh lg:pb-4'
                        : 'w-full lg:overflow-y-auto lg:no-scrollbar lg:h-dvh lg:max-h-dvh lg:pb-4'
                ]">
                <NotificationCard variant="alert" :showIcon="false" :title="t('booking_personal_calendar_notice')"
                    :description="t('booking_calendar_notice_description')"  />
                <div v-if="calendarError" class="mx-6 mt-3 px-3 py-2 rounded bg-red-50 text-red-700 text-xs font-medium">
                    {{ calendarError }}
                </div>
                <div v-else-if="calendarLoading" class="px-2 md:px-4 lg:px-6 pt-6">
                    <div class="overflow-hidden rounded-[1rem] border border-[#EAECF0] bg-white shadow-sm animate-pulse">
                        <div class="border-b border-[#EAECF0] px-4 py-4">
                            <div class="flex items-center justify-between gap-4">
                                <div class="h-6 w-40 rounded-full bg-[#101828]/10" />
                                <div class="flex items-center gap-2">
                                    <div class="h-8 w-8 rounded-full bg-[#101828]/10" />
                                    <div class="h-8 w-8 rounded-full bg-[#101828]/10" />
                                </div>
                            </div>
                        </div>
                        <div class="grid grid-cols-[4.5rem_repeat(7,minmax(0,1fr))] border-b border-[#EAECF0] bg-[#F8FAFC]">
                            <div class="h-10 border-r border-[#EAECF0]" />
                            <div
                                v-for="day in 7"
                                :key="`calendar-skeleton-day-${day}`"
                                class="flex h-10 items-center justify-center border-r border-[#EAECF0] last:border-r-0"
                            >
                                <div class="h-3 w-8 rounded-full bg-[#101828]/10" />
                            </div>
                        </div>
                        <div>
                            <div
                                v-for="row in 7"
                                :key="`calendar-skeleton-row-${row}`"
                                class="grid grid-cols-[4.5rem_repeat(7,minmax(0,1fr))] border-b border-[#EAECF0] last:border-b-0"
                            >
                                <div class="flex items-start justify-center border-r border-[#EAECF0] px-2 py-3">
                                    <div class="h-3 w-8 rounded-full bg-[#101828]/10" />
                                </div>
                                <div
                                    v-for="day in 7"
                                    :key="`calendar-skeleton-cell-${row}-${day}`"
                                    class="relative h-20 border-r border-[#EAECF0] last:border-r-0"
                                >
                                    <div
                                        v-if="(row === 2 && day === 3) || (row === 4 && day === 5) || (row === 5 && day === 2)"
                                        class="absolute left-2 right-2 top-3 h-9 rounded-[0.5rem] bg-[#5549FF]/10"
                                    >
                                        <div class="flex h-full flex-col justify-center gap-2 px-3">
                                            <div class="h-2.5 w-3/4 rounded-full bg-[#5549FF]/20" />
                                            <div class="h-2 w-1/2 rounded-full bg-[#5549FF]/15" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <MainCalendar v-else ref="mainCalendarRef" class="w-full px-2 md:px-4 lg:px-6 pt-6" variant="theme2" :focus-date="state.focus" :events="events2"
                    :theme="theme2" :data-attrs="{ 'data-calendar': 'main-2' }" :console-overlaps="true"
                    :highlight-today-column="true" time-start="00:00" time-end="24:00" :slot-minutes="60"
                    day-column-mode="events" :row-height-px="120" :min-event-height-px="0"
                    @date-selected="onSelectFromMain"
                    @preview-schedule="previewSchedule = true"
                    @join-call="handleJoinCall"
                    @approve-booking="handleApproveBooking"
                    @reject-booking="handleRejectBooking"
                    @cancel-booking="openCancelBookingPopup"
                    @refresh-events="fetchCreatorBookedSlots(true)">

                    <template #event="{ event, style, onClick }">
                        <CalendarWeekBookingBlock :event="event" :style="style" @activate="onClick" />
                    </template>

                    <template #event-alt="{ event, style, onClick }">
                        <CalendarWeekBookingBlock :event="event" :style="style" @activate="onClick" />
                    </template>

                    <template #event-custom="{ event, style, onClick }">
                        <CalendarWeekAvailabilityBlock
                            v-if="event?.isDraftPreview"
                            :event="event"
                            :style="style"
                        />
                        <CalendarWeekBookingBlock
                            v-else
                            :event="event"
                            :style="style"
                            @activate="onClick"
                        />
                    </template>

                    <template #event-custom2="{ event, style, onClick }">
                        <CalendarWeekBookingBlock :event="event" :style="style" @activate="onClick" />
                    </template>

                    <template #event-availability="{ event, style }">
                        <CalendarWeekAvailabilityBlock
                            :event="event"
                            :style="style"
                            @activate="openAvailabilityScheduleMenu"
                        />
                    </template>

                </MainCalendar>
            </div>

        </div>
    </component>

    <!-- Debug Section (as requested) -->
    <div v-if="!embedded" class="mt-8 p-6 bg-gray-100 dark:bg-slate-800 rounded-lg border border-gray-300 dark:border-gray-700">
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

    <div
        v-if="unsavedLeaveDialogOpen"
        data-test="unsaved-leave-dialog"
        class="fixed inset-0 z-[10050] flex items-end md:items-center justify-center bg-black/10 md:px-4"
        role="dialog"
        aria-modal="true"
        :aria-label="t('booking_unsaved_changes_title')"
        @click.self="resolvePendingUnsavedLeave(false)"
    >
        <div class="w-full max-w-[30.75rem] max-h-[8.5rem] rounded-[0.313rem] bg-white p-4 shadow-[0px_4px_8px_0px_rgba(0,0,0,0.2),0px_6px_20px_0px_rgba(0,0,0,0.19)] backdrop-blur-[50px] flex flex-col gap-6">
            <div class="hidden text-base font-semibold leading-6 text-slate-900">
                {{ t("booking_unsaved_changes_title") }}
            </div>
            <div class="text-sm leading-5 text-black">
                {{ t("booking_unsaved_changes_body") }}
            </div>
            <div class="flex justify-start gap-2">
                <button
                    type="button"
                    data-test="unsaved-leave-stay"
                    class="rounded-md border-none bg-transparent px-0 min-w-[6.25rem] py-2 text-sm font-medium text-[#ff4405] transition hover:bg-transparent flex-1 md:flex-none"
                    @click="resolvePendingUnsavedLeave(false)"
                >
                    {{ t("booking_unsaved_changes_stay") }}
                </button>
                <button
                    type="button"
                    data-test="unsaved-leave-confirm"
                    class="rounded-0 bg-[#ff4405] min-w-[6.25rem] px-2 py-2 text-base font-medium text-white transition hover:bg-[#ff692e] flex-1 md:flex-none"
                    @click="resolvePendingUnsavedLeave(true)"
                >
                    {{ t("booking_unsaved_changes_leave") }}
                </button>
            </div>
        </div>
    </div>

    <PopupHandler v-model="cancelBookingPopupOpen" :config="confirmationPopupConfig">
        <div class="w-[30.9375rem] max-w-[90vw] border border-[#EAECF0] bg-white p-4 shadow-xl">
            <h3 class="text-base font-semibold text-gray-700">
                {{ t("dashboard_cancel_confirm_title") }}
            </h3>
            <p class="mt-2 text-black">{{ t("dashboard_cancel_confirm_body") }}</p>
            <div class="mt-2 bg-gray-50 px-3 py-2 text-xs text-gray-700">
                <p class="truncate font-semibold">{{ cancelBookingCandidateTitle }}</p>
                <p v-if="cancelBookingCandidateTime" class="mt-1">{{ cancelBookingCandidateTime }}</p>
            </div>
            <div class="mt-2 flex items-center justify-center gap-2">
                <button
                    type="button"
                    class="h-9 px-3 text-base font-medium text-[#ff4405] hover:bg-gray-50 disabled:opacity-60"
                    :disabled="cancelBookingLoading"
                    @click="closeCancelBookingPopup"
                >
                    {{ t("dashboard_cancel_confirm_back") }}
                </button>
                <button
                    type="button"
                    data-test="booking-form-cancel-confirm"
                    class="h-9 bg-[#ff4405] px-3 text-base font-medium text-white hover:bg-[#ff692e] disabled:opacity-60"
                    :disabled="cancelBookingLoading"
                    @click="confirmCancelBooking"
                >
                    {{ cancelBookingLoading ? t("common_loading") : t("dashboard_cancel_confirm_action") }}
                </button>
            </div>
        </div>
    </PopupHandler>

    <PopupHandler v-model="deleteEventPopupOpen" :config="confirmationPopupConfig">
        <div class="w-[32.875rem] max-w-[90vw] rounded border border-[#EAECF0] bg-white px-4 py-5 shadow-xl">
            <h3 class="text-base font-semibold leading-6 text-gray-700">
                {{ t("dashboard_delete_booking_schedule_title", { title: deleteEventCandidateTitle }) }}
            </h3>
            <p class="mt-2 text-base leading-6 text-slate-700">
                {{ t("dashboard_delete_booking_schedule_body") }}
            </p>
            <div class="mt-6 flex items-center justify-end gap-6">
                <button
                    type="button"
                    class="h-10 px-4 text-base font-medium text-[#ff4405] hover:bg-gray-50 disabled:opacity-60"
                    :disabled="deleteEventLoading"
                    @click="closeDeleteEventPopup"
                >
                    {{ t("common_cancel") }}
                </button>
                <button
                    type="button"
                    data-test="booking-form-delete-confirm"
                    class="h-10 bg-[#ff4405] px-6 text-base font-medium text-white hover:bg-[#ff692e] disabled:opacity-60"
                    :disabled="deleteEventLoading"
                    @click="confirmDeleteEvent"
                >
                    {{ deleteEventLoading ? t("common_loading") : t("dashboard_delete_booking_schedule_action") }}
                </button>
            </div>
        </div>
    </PopupHandler>

    <BookingScheduleMenu
        :open="availabilityScheduleMenu.open"
        :event="availabilityScheduleMenu.event"
        position-class="fixed"
        :menu-style="availabilityScheduleMenuStyle"
        @edit="requestEditScheduleEvent"
        @view-card="openScheduleCardPreview"
        @delete="openDeleteEventPopup"
        @close="closeAvailabilityScheduleMenu"
    />

    <OneOnOneBookingFlowPopup
        :model-value="scheduleCardPreviewOpen"
        :creator-id="resolveCreatorId()"
        :api-base-url="apiBaseUrl"
        preview-mode
        preview-read-only
        :preview-event="scheduleCardPreviewEvent"
        :preview-booked-slots="scheduleCardPreviewBookedSlots"
        :preview-start-step="1"
        step1-primary-action="edit-schedule"
        @update:model-value="setScheduleCardPreviewOpen"
        @edit-schedule="requestEditScheduleEvent"
    />

    <OneOnOneBookingFlowPopup
        v-model="previewSchedule"
        :creator-data="creatorData"
        :preview-mode="true"
        :preview-event="previewEventForFanFlow"
        :preview-booked-slots="previewBookedSlotsForFanFlow"
        :preview-start-step="2"
        :preview-read-only="true"
    />
</template>

<style scoped>
:deep(.ql-editor.ql-blank::before) {
    color: #667085 !important;
    font-style: normal !important;
    left: 0 !important;
}
:deep(.booking-form-calendar-time-label:last-child) {
    display: none;
}
</style>
