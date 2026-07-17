<script setup>
import MiniCalendar from '@/components/calendar/MiniCalendar.vue';
import OneOnOneBookingFlowLeftSideBar from '../HelperComponents/OneOnOneBookingFlowLeftSideBar.vue';
import { ref, reactive, computed, onBeforeUnmount, onMounted, watch } from 'vue';
import { ExclamationTriangleIcon } from '@heroicons/vue/24/solid';
import { addMonths } from '@/utils/calendarHelpers.js';
import { showToast } from '@/utils/toastBus.js';
import TokenHandler from '@/utils/TokenHandler.js';
import { getBackendJwtToken } from '@/utils/backendJwt.js';
import { buildBookingPaymentPreview } from '@/services/bookings/mappers/createBookingMapper.js';
import {
  buildCandidateSlotsForEventDate,
  computeNextAvailableSlot,
  createSlotUiModel,
  formatLocalDateIso,
  hmToLabel,
  isRangeBooked,
  isSlotBookedByUser,
} from '@/services/bookings/utils/bookingSlotUtils.js';
import { addMinutesToHm, extractDateIso, hktDateTimeToLocalDate, toHm } from '@/services/events/eventsApiUtils.js';
import {
  bookingFlowArrowRightIcon,
  bookingFlowBackgroundImage,
  bookingFlowCheckIcon,
  bookingFlowCloudMoonIcon,
  bookingFlowTokenIcon,
  bookingFlowCalendarIcon,
  bookingFlowCalendarCheckIcon,
  bookingFlowSaleIcon,
  bookingFlowAlertHexagonIcon,
} from './oneOnOneBookingFlowAssets.js';
import { resolveCreatorPresentation } from './creatorPresentation.js';
import { useEventBackgroundImage } from './useEventBackgroundImage.js';
import { useBookingTranslations } from '@/i18n/bookingTranslations.js';

const props = defineProps({
  engine: {
    type: Object,
    required: true
  },
  embedded: {
    type: Boolean,
    default: false,
  },
  refreshBookingContext: {
    type: Function,
    default: null,
  },
});

const { t, locale } = useBookingTranslations();
const selectedEvent = computed(() => props.engine.getState('fanBooking.context.selectedEvent') || null);
const bookedSlotsIndex = computed(() => props.engine.getState('fanBooking.catalog.bookedSlotsIndex') || {});
const fanId = computed(() => props.engine.getState('fanBooking.context.fanId') ?? null);
const creatorPresentation = computed(() => resolveCreatorPresentation({
  explicitCreatorData: props.engine.getState('fanBooking.context.creatorPresentation'),
  selectedEvent: selectedEvent.value,
  bookingResult: props.engine.getState('fanBooking.booking.result'),
}));
const creatorPresentationLoading = computed(() => (
  props.engine.getState('fanBooking.context.creatorPresentationLoading') === true
));
const { resolvedBackgroundImageUrl } = useEventBackgroundImage(selectedEvent, bookingFlowBackgroundImage);

// --- CALENDAR LOGIC ---
const now = new Date();
const y = now.getFullYear();
const m = now.getMonth();
const d = now.getDate();

const state = reactive({
  focus: new Date(y, m, d),
  selected: null
});

const header = computed(() => {
  return state.focus.toLocaleDateString(locale.value, { month: 'long', year: 'numeric' });
});

const shiftMonth = (n) => {
  state.focus = addMonths(state.focus, n);
};

const timezoneLabel = computed(() => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Time';
});

const theme1 = {
  mini: {
    wrapper: 'flex flex-col w-full font-medium text-gray-500 mt-[10px] gap-[0.625rem] rounded-xl ',
    header: 'text-lg font-medium text-white',
    dayBase: 'relative  h-[37px] rounded-[2px] text-[#ffffff] flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 hover:bg-gray-500',
    outside: 'opacity-0',
    expired: 'opacity-40 cursor-not-allowed pointer-events-none !bg-transparent !text-[currentColor]',
    today: 'font-semibold text-white hover:bg-gray-600',
    selected: 'rounded-[2px] !bg-[#07F468] !text-[#000000] font-semibold focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus:!shadow-none focus:!border-0',
    dot: 'absolute bottom-[2px] w-1 h-1 rounded-full bg-[#07F468]',
    selectedDot: '!bg-[#0C111D] bottom-[4px]'
  }
};

const selectedTime = ref(null);
const selectedDurationObj = ref(null);
const addons = ref([]);
const otherRequest = ref('');
const contributionTokens = ref('');
const walletBalance = ref(0);
const groupAutoRedirecting = ref(false);
const showMaxDurationWarning = ref(false);
const isRefreshingAvailability = ref(false);
let availabilityRefreshTimerId = null;

const AVAILABILITY_REFRESH_INTERVAL_MS = 15000;

const selectedDateIso = computed(() => (state.selected ? formatLocalDateIso(state.selected) : null));
const todayDateIso = computed(() => formatLocalDateIso(new Date()));

function normalizeRepeatRuleName(value) {
  return String(value || '').trim().toLowerCase();
}

function getEventRepeatRule(event = {}) {
  const raw = event?.raw || {};
  return normalizeRepeatRuleName(raw.repeatRule ?? event?.repeatRule);
}

function getEventRawSlots(event = {}) {
  const raw = event?.raw || {};
  if (Array.isArray(raw.slots) && raw.slots.length > 0) return raw.slots;
  if (Array.isArray(raw.dates) && raw.dates.length > 0) return raw.dates;
  if (Array.isArray(event?.slots) && event.slots.length > 0) return event.slots;
  if (Array.isArray(event?.dates) && event.dates.length > 0) return event.dates;
  return [];
}

function addDaysToDateIso(dateIso, days) {
  const base = new Date(`${dateIso}T00:00:00`);
  if (Number.isNaN(base.getTime())) return dateIso;
  base.setDate(base.getDate() + days);
  return formatLocalDateIso(base) || dateIso;
}

function hmToMinutes(value) {
  const [hours = '0', minutes = '0'] = String(value || '00:00').split(':');
  const parsedHours = Number(hours);
  const parsedMinutes = Number(minutes);
  if (!Number.isFinite(parsedHours) || !Number.isFinite(parsedMinutes)) return null;
  return (parsedHours * 60) + parsedMinutes;
}

function resolveSlotEndDayOffset(timeEntry = {}, startHm = '', endHm = '') {
  const explicit = Number(timeEntry?.endDayOffset);
  if (Number.isFinite(explicit)) return explicit > 0 ? 1 : 0;

  const startMinutes = hmToMinutes(startHm);
  const endMinutes = hmToMinutes(endHm);
  if (startMinutes == null || endMinutes == null) return 0;
  return endMinutes < startMinutes ? 1 : 0;
}

function resolveOneTimeLocalDateBounds(event = {}) {
  const dates = [];

  getEventRawSlots(event).forEach((dateEntry) => {
    const hktDateIso = extractDateIso(dateEntry?.date, null);
    if (!hktDateIso) return;

    const times = Array.isArray(dateEntry?.times)
      ? dateEntry.times
      : (Array.isArray(dateEntry?.slots) ? dateEntry.slots : []);

    if (times.length === 0) {
      const localDate = hktDateTimeToLocalDate(hktDateIso, '12:00');
      const localDateIso = formatLocalDateIso(localDate);
      if (localDateIso) dates.push(localDateIso);
      return;
    }

    times.forEach((timeEntry) => {
      const startHm = toHm(timeEntry?.startTime, '');
      const endHm = toHm(timeEntry?.endTime, '');
      if (!startHm) return;

      const localDate = hktDateTimeToLocalDate(hktDateIso, startHm);
      const localDateIso = formatLocalDateIso(localDate);
      if (localDateIso) dates.push(localDateIso);

      if (!endHm) return;
      const endDayOffset = resolveSlotEndDayOffset(timeEntry, startHm, endHm);
      const endHktDateIso = endDayOffset > 0 ? addDaysToDateIso(hktDateIso, endDayOffset) : hktDateIso;
      const localEndDate = hktDateTimeToLocalDate(endHktDateIso, endHm);
      const localEndDateIso = formatLocalDateIso(localEndDate);
      if (localEndDateIso) dates.push(localEndDateIso);
    });
  });

  const sorted = Array.from(new Set(dates)).sort();
  return {
    from: sorted[0] || null,
    to: sorted.at(-1) || null,
  };
}

function resolveRecurringScheduleTimeEntries(event = {}) {
  const entries = [];

  getEventRawSlots(event).forEach((slot) => {
    if (!slot || typeof slot !== 'object') return;
    if (Array.isArray(slot?.times)) return;

    const startHm = toHm(slot.startTime ?? slot.start, '');
    if (!startHm) return;

    const endHm = toHm(slot.endTime ?? slot.end, startHm);
    entries.push({
      startHm,
      endHm,
      endDayOffset: resolveSlotEndDayOffset(slot, startHm, endHm),
    });
  });

  return entries;
}

function resolveRecurringBoundaryLocalDateBounds(event = {}) {
  const raw = event.raw || {};
  const dateFrom = extractDateIso(raw.dateFrom ?? event.dateFrom, null);
  const dateTo = extractDateIso(raw.dateTo ?? event.dateTo, null);
  const entries = resolveRecurringScheduleTimeEntries(event);
  const fromDates = [];
  const toDates = [];

  if (dateFrom) {
    if (entries.length > 0) {
      entries.forEach((entry) => {
        const localDateIso = formatLocalDateIso(hktDateTimeToLocalDate(dateFrom, entry.startHm));
        if (localDateIso) fromDates.push(localDateIso);
      });
    } else {
      const localDateIso = formatLocalDateIso(hktDateTimeToLocalDate(dateFrom, '12:00'));
      if (localDateIso) fromDates.push(localDateIso);
    }
  }

  if (dateTo) {
    if (entries.length > 0) {
      entries.forEach((entry) => {
        const endHktDateIso = entry.endDayOffset > 0 ? addDaysToDateIso(dateTo, entry.endDayOffset) : dateTo;
        const localDateIso = formatLocalDateIso(hktDateTimeToLocalDate(endHktDateIso, entry.endHm));
        if (localDateIso) toDates.push(localDateIso);
      });
    } else {
      const localDateIso = formatLocalDateIso(hktDateTimeToLocalDate(dateTo, '12:00'));
      if (localDateIso) toDates.push(localDateIso);
    }
  }

  const sortedFrom = Array.from(new Set(fromDates)).sort();
  const sortedTo = Array.from(new Set(toDates)).sort();
  return {
    from: sortedFrom[0] || dateFrom,
    to: sortedTo.at(-1) || dateTo,
  };
}

const oneTimeLocalDateBounds = computed(() => (
  getEventRepeatRule(selectedEvent.value || {}) === 'doesnotrepeat'
    ? resolveOneTimeLocalDateBounds(selectedEvent.value || {})
    : { from: null, to: null }
));
const recurringLocalDateBounds = computed(() => (
  getEventRepeatRule(selectedEvent.value || {}) !== 'doesnotrepeat'
    ? resolveRecurringBoundaryLocalDateBounds(selectedEvent.value || {})
    : { from: null, to: null }
));

const eventDateFromIso = computed(() => {
  const event = selectedEvent.value || {};
  const raw = event.raw || {};
  if (getEventRepeatRule(event) === 'doesnotrepeat' && oneTimeLocalDateBounds.value.from) {
    return oneTimeLocalDateBounds.value.from;
  }
  if (getEventRepeatRule(event) !== 'doesnotrepeat' && recurringLocalDateBounds.value.from) {
    return recurringLocalDateBounds.value.from;
  }
  return extractDateIso(raw.dateFrom ?? event.dateFrom, null);
});
const eventDateToIso = computed(() => {
  const event = selectedEvent.value || {};
  const raw = event.raw || {};
  if (getEventRepeatRule(event) === 'doesnotrepeat' && oneTimeLocalDateBounds.value.to) {
    return oneTimeLocalDateBounds.value.to;
  }
  if (getEventRepeatRule(event) !== 'doesnotrepeat' && recurringLocalDateBounds.value.to) {
    return recurringLocalDateBounds.value.to;
  }
  return extractDateIso(raw.dateTo ?? event.dateTo, null);
});
const minSelectableDateIso = computed(() => {
  const todayIso = todayDateIso.value;
  const fromIso = eventDateFromIso.value;
  if (todayIso && fromIso) return todayIso > fromIso ? todayIso : fromIso;
  return todayIso || fromIso || null;
});
const maxSelectableDateIso = computed(() => eventDateToIso.value || null);
const minSelectableDate = computed(() => {
  if (!minSelectableDateIso.value) return null;
  const date = new Date(`${minSelectableDateIso.value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
});
const maxSelectableDate = computed(() => {
  if (!maxSelectableDateIso.value) return null;
  const date = new Date(`${maxSelectableDateIso.value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
});
const isGroupEvent = computed(() => String(
  selectedEvent.value?.type
    || selectedEvent.value?.eventType
    || selectedEvent.value?.raw?.type
    || selectedEvent.value?.raw?.eventType
    || '',
).toLowerCase() === 'group-event');
const groupPriceSetting = computed(() => String(
  selectedEvent.value?.priceSetting
    || selectedEvent.value?.raw?.priceSetting
    || '',
));
const popupBackgroundStyle = computed(() => ({
  backgroundImage: `url('${resolvedBackgroundImageUrl.value}')`,
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'left 50% center',
}));
const actionFooterClass = computed(() => (
  props.embedded
    ? 'flex-none flex justify-end z-[99] fixed md:absolute bottom-0 left-0 w-full'
    : 'flex-none flex justify-end z-[99] fixed bottom-0 left-0 w-full'
));

const candidateSlots = computed(() => {
  if (!selectedEvent.value || !selectedDateIso.value) return [];
  return buildCandidateSlotsForEventDate(selectedEvent.value, selectedDateIso.value, {
    eventId: selectedEvent.value?.eventId,
    bookedSlotsIndex: bookedSlotsIndex.value,
    applyBufferAfterBooked: true,
  });
});

function canDurationFitSelectedSlot(slot, durationMinutes, bookedSlotsIndexOverride = bookedSlotsIndex.value) {
  if (!slot || !Number.isFinite(slot.startMs)) return false;

  const normalizedDuration = Number(durationMinutes || 0);
  if (!Number.isFinite(normalizedDuration) || normalizedDuration <= 0) return false;

  const targetEndMs = slot.startMs + (normalizedDuration * 60 * 1000);
  const windowEndMs = Number(slot.windowEndMs || slot.endMs);
  if (Number.isFinite(windowEndMs) && targetEndMs > windowEndMs) {
    return false;
  }

  return !isRangeBooked({
    eventId: selectedEvent.value?.eventId,
    startMs: slot.startMs,
    endMs: targetEndMs,
    bookedSlotsIndex: bookedSlotsIndexOverride,
  });
}

function buildTimeSlotsForBookedIndex(latestBookedSlotsIndex = bookedSlotsIndex.value) {
  if (!selectedEvent.value || !selectedDateIso.value) return [];

  return buildCandidateSlotsForEventDate(selectedEvent.value, selectedDateIso.value, {
    eventId: selectedEvent.value?.eventId,
    bookedSlotsIndex: latestBookedSlotsIndex,
    applyBufferAfterBooked: true,
  }).map((slot) => {
    const uiSlot = createSlotUiModel({
      event: selectedEvent.value,
      eventId: selectedEvent.value.eventId,
      localDateIso: selectedDateIso.value,
      slot,
      bookedSlotsIndex: latestBookedSlotsIndex,
    });

    return {
      ...uiSlot,
      label: isGroupEvent.value
        ? `${hmToLabel(uiSlot.startHm)}-${hmToLabel(uiSlot.endHm)}`
        : hmToLabel(uiSlot.startHm),
      value: uiSlot.startHm,
      isOffHours: Boolean(uiSlot.offHours),
    };
  });
}

function getSelectedAvailabilitySnapshot() {
  return {
    dateIso: selectedDateIso.value,
    slotValue: selectedTime.value?.value || selectedTime.value?.startHm || null,
    durationMinutes: Number(selectedDurationObj.value?.value || 0),
    duration: selectedDurationObj.value ? { ...selectedDurationObj.value } : null,
  };
}

function resolveSelectedSnapshotAvailability(snapshot = {}) {
  if (!snapshot.slotValue) return { available: true, slot: null, duration: null };
  if (snapshot.dateIso && snapshot.dateIso !== selectedDateIso.value) {
    return { available: true, slot: null, duration: null };
  }

  const latestBookedSlotsIndex = props.engine.getState('fanBooking.catalog.bookedSlotsIndex') || {};
  const latestTimeSlots = buildTimeSlotsForBookedIndex(latestBookedSlotsIndex);
  const matchedSlot = latestTimeSlots.find((slot) => (
    String(slot.value) === String(snapshot.slotValue)
    && !slot.disabled
  ));
  if (!matchedSlot) return { available: false, slot: null, duration: null };

  const durationMinutes = Number(snapshot.durationMinutes || 0);
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return { available: false, slot: null, duration: null };
  }

  const available = canDurationFitSelectedSlot(matchedSlot, durationMinutes, latestBookedSlotsIndex);
  return {
    available,
    slot: available ? matchedSlot : null,
    duration: available ? snapshot.duration : null,
  };
}

function restoreSelectedSnapshotIfAvailable(snapshot = {}) {
  const resolved = resolveSelectedSnapshotAvailability(snapshot);
  if (!resolved.available) return false;
  if (!resolved.slot || !resolved.duration) return true;

  selectedTime.value = resolved.slot;
  selectedDurationObj.value = resolved.duration;
  return true;
}

function clearSelectedSlotAfterAvailabilityRefresh(reason = 'step2-availability-refresh-conflict') {
  selectedTime.value = null;
  selectedDurationObj.value = null;
  showMaxDurationWarning.value = false;

  props.engine.setState('bookingDetails.selectedTime', null, { reason, silent: true });
  props.engine.setState('bookingDetails.selectedDuration', null, { reason, silent: true });
  props.engine.setState('bookingDetails.formattedTimeRange', '-', { reason, silent: true });
  props.engine.setState('bookingDetails.totalPrice', 0, { reason, silent: true });
  props.engine.setState('fanBooking.selection.selectedSlot', null, { reason, silent: true });
  props.engine.setState('fanBooking.selection.selectedDurationMinutes', null, { reason, silent: true });
  props.engine.setState('fanBooking.temporaryHold', {
    temporaryHoldId: null,
    status: 'none',
    expiresAt: null,
    secondsRemaining: 0,
    createdAt: null,
    checkedAt: null,
  }, { reason, silent: true });
}

function showSelectedSlotBookedToast() {
  showToast({
    type: 'error',
    title: t('fan_booking_slot_unavailable_title'),
    message: t('fan_booking_slot_already_booked_try_different_slot'),
  });
}

async function refreshAvailabilityAndValidateSelection({ notifyOnConflict = false, reason = 'availability-refresh' } = {}) {
  if (!shouldAutoRefreshAvailability.value) return true;
  if (isRefreshingAvailability.value) return true;

  const snapshot = getSelectedAvailabilitySnapshot();
  isRefreshingAvailability.value = true;

  try {
    const result = await props.refreshBookingContext({
      silent: true,
      preserveSelectedEvent: true,
    });

    if (!result?.ok) return true;
    if (snapshot.slotValue && !restoreSelectedSnapshotIfAvailable(snapshot)) {
      clearSelectedSlotAfterAvailabilityRefresh(reason);
      if (notifyOnConflict) showSelectedSlotBookedToast();
      return false;
    }

    return true;
  } catch (_error) {
    return true;
  } finally {
    isRefreshingAvailability.value = false;
  }
}

function stopAvailabilityRefreshTimer() {
  if (!availabilityRefreshTimerId) return;
  clearInterval(availabilityRefreshTimerId);
  availabilityRefreshTimerId = null;
}

function startAvailabilityRefreshTimer() {
  if (!shouldAutoRefreshAvailability.value || availabilityRefreshTimerId) return;
  availabilityRefreshTimerId = setInterval(() => {
    refreshAvailabilityAndValidateSelection({
      notifyOnConflict: true,
      reason: 'step2-availability-refresh-interval',
    });
  }, AVAILABILITY_REFRESH_INTERVAL_MS);
}

function handleVisibilityRefresh() {
  if (typeof document === 'undefined' || document.visibilityState !== 'visible') return;
  refreshAvailabilityAndValidateSelection({
    notifyOnConflict: true,
    reason: 'step2-availability-refresh-visible',
  });
}

function getEventIdentity(event = null) {
  if (!event) return '';
  return String(event.eventId || event.id || event.raw?.eventId || '');
}

function toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0' || normalized === '') return false;
  }
  return fallback;
}

const showApprovalNeeded = computed(() => {
  const instant = toBoolean(
    selectedEvent.value?.allowInstantBooking
      ?? selectedEvent.value?.raw?.allowInstantBooking,
    false,
  );
  return !instant;
});

const isPreviewReadOnly = computed(() => (
  Boolean(props.engine.getState('fanBooking.ui.previewReadOnly'))
));
const isPreviewMode = computed(() => (
  Boolean(props.engine.getState('fanBooking.ui.previewMode'))
));
const isFirstBookingForCreator = computed(() => (
  toBoolean(props.engine.getState('fanBooking.context.isFirstBookingForCreator'), false)
));
const shouldAutoRefreshAvailability = computed(() => (
  !isPreviewMode.value
  && !isPreviewReadOnly.value
  && !isGroupEvent.value
  && Boolean(selectedEvent.value)
  && typeof props.refreshBookingContext === 'function'
));

function toWholeTokens(value) {
  const numeric = Number(value || 0);
  return Math.ceil(Number.isFinite(numeric) ? numeric : 0);
}

function formatTokens(value) {
  return toWholeTokens(value).toLocaleString(locale.value);
}

const isEventGoalGroupEvent = computed(() => {
  const raw = selectedEvent.value?.raw || {};
  return isGroupEvent.value && String(raw?.priceSetting || selectedEvent.value?.priceSetting || '').toLowerCase() === 'eventgoal';
});

const eventGoalMinimumTokens = computed(() => {
  const raw = selectedEvent.value?.raw || {};
  const configured = Number(raw?.minContributionPerUser ?? selectedEvent.value?.minContributionPerUser ?? 0);
  return Number.isFinite(configured) && configured > 0 ? toWholeTokens(configured) : 1;
});

const eventGoalMaximumTokens = computed(() => {
  const raw = selectedEvent.value?.raw || {};
  const eventGoal = toWholeTokens(raw?.eventGoalTokens ?? selectedEvent.value?.eventGoalTokens ?? 0);
  const balance = toWholeTokens(walletBalance.value);
  return Math.max(0, eventGoal, balance);
});

const normalizedContributionTokens = computed(() => toWholeTokens(contributionTokens.value));
const contributionRangeMax = computed(() => Math.max(eventGoalMinimumTokens.value, eventGoalMaximumTokens.value));
const availableBalanceAfterContribution = computed(() => Math.max(0, toWholeTokens(walletBalance.value) - normalizedContributionTokens.value));
const contributionSliderPercent = computed(() => {
  const min = eventGoalMinimumTokens.value;
  const max = eventGoalMaximumTokens.value;
  if (max <= min) return 0;
  const amount = Math.min(Math.max(normalizedContributionTokens.value, min), max);
  return Math.round(((amount - min) / (max - min)) * 100);
});
const contributionSliderStyle = computed(() => ({
  width: `${contributionSliderPercent.value}%`,
}));
const contributionThumbStyle = computed(() => ({
  left: `${contributionSliderPercent.value}%`,
}));

const contributionInvalid = computed(() => {
  if (!isEventGoalGroupEvent.value) return false;
  const amount = normalizedContributionTokens.value;
  const max = eventGoalMaximumTokens.value;
  return max <= 0 || amount < eventGoalMinimumTokens.value || amount > max;
});

function ensureContributionDefault() {
  if (!isEventGoalGroupEvent.value) {
    contributionTokens.value = '';
    return;
  }

  const min = eventGoalMinimumTokens.value;
  const max = eventGoalMaximumTokens.value;
  const existing = toWholeTokens(contributionTokens.value);
  if (max >= min) {
    contributionTokens.value = String(Math.min(Math.max(existing || min, min), max));
    return;
  }

  contributionTokens.value = String(min);
}

function formatGroupDate(dateIso) {
  if (!dateIso) return '';
  const date = new Date(`${dateIso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(locale.value, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function slotDurationMinutes(slot = {}) {
  const explicit = Number(slot?.durationMinutes);
  if (Number.isFinite(explicit) && explicit > 0) return Math.round(explicit);
  const startMs = Number(slot?.startMs);
  const endMs = Number(slot?.endMs);
  if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs) {
    return Math.round((endMs - startMs) / (60 * 1000));
  }
  return 0;
}

function formatSlotRange(slot = {}) {
  if (!slot?.startHm || !slot?.endHm) return '-';
  return `${hmToLabel(slot.startHm)}-${hmToLabel(slot.endHm)}`;
}

async function autoSelectGroupAndGoToPayment() {
  if (!isGroupEvent.value || groupAutoRedirecting.value) return;
  groupAutoRedirecting.value = true;

  const event = selectedEvent.value;
  const currentFanId = fanId.value ?? resolveFanId();
  const resolvedBookedSlotsIndex = bookedSlotsIndex.value && Object.keys(bookedSlotsIndex.value).length > 0
    ? bookedSlotsIndex.value
    : (props.engine.state?.fanBooking?.catalog?.bookedSlotsIndex || {});
  const next = computeNextAvailableSlot(event, resolvedBookedSlotsIndex, 45, {
    skipBookedByUserId: currentFanId,
  });
  if (!next?.slot) {
    showToast({
      type: 'error',
      title: t('fan_booking_slot_unavailable_title'),
      message: t('fan_booking_no_upcoming_free_slot'),
    });
    props.engine.goToStep(1);
    return;
  }

  const duration = slotDurationMinutes(next.slot);
  const contribution = isEventGoalGroupEvent.value ? eventGoalMinimumTokens.value : null;
  const selectedDate = new Date(`${next.dateIso}T00:00:00`);
  const selectedTimeValue = {
    ...next.slot,
    value: next.slot.startHm || next.slot.value,
    label: formatSlotRange(next.slot),
    disabled: false,
  };
  const selectedDuration = {
    value: duration,
    price: isEventGoalGroupEvent.value
      ? contribution
      : toWholeTokens(event?.raw?.basePriceTokens ?? event?.basePriceTokens ?? 0),
    disabled: false,
  };
  const pricingPreview = buildBookingPaymentPreview(event, duration, [], selectedTimeValue, {
    isFirstBookingForCreator: isFirstBookingForCreator.value,
    contributionTokens: contribution,
  });
  const dateDisplay = formatGroupDate(next.dateIso);
  const bookingData = {
    selectedDate,
    selectedTime: selectedTimeValue,
    selectedDuration,
    addons: [],
    otherRequest: '',
    formattedTimeRange: formatSlotRange(next.slot),
    selectedDateDisplay: dateDisplay,
    headerDateDisplay: dateDisplay,
    totalPrice: Number(pricingPreview?.payment?.total || 0),
    contributionTokens: contribution,
    longerDiscountAmount: 0,
    firstTimeDiscountAmount: 0,
    discountRows: [],
    offHourSurchargeAmount: 0,
    offHourSurchargePercent: 0,
    isOffHours: Boolean(next.slot?.offHours),
    walletBalance: Number(walletBalance.value || props.engine.getState('bookingDetails.walletBalance') || 0),
  };

  props.engine.setState('bookingDetails', bookingData, { reason: 'step2-group-auto-selection', silent: true });
  props.engine.setState('fanBooking.selection.selectedDate', next.dateIso, { reason: 'step2-group-auto-selection', silent: true });
  props.engine.setState('fanBooking.selection.selectedSlot', selectedTimeValue, { reason: 'step2-group-auto-selection', silent: true });
  props.engine.setState('fanBooking.selection.selectedDurationMinutes', duration, { reason: 'step2-group-auto-selection', silent: true });
  props.engine.setState('fanBooking.selection.contributionTokens', contribution, { reason: 'step2-group-auto-selection', silent: true });
  props.engine.setState('fanBooking.selection.selectedAddOns', [], { reason: 'step2-group-auto-selection', silent: true });
  props.engine.setState('fanBooking.selection.personalRequestText', '', { reason: 'step2-group-auto-selection', silent: true });
  props.engine.setState('fanBooking.temporaryHold', {
    temporaryHoldId: null,
    status: 'none',
    expiresAt: null,
    secondsRemaining: 0,
    createdAt: null,
    checkedAt: null,
  }, { reason: 'step2-group-auto-selection-reset-hold', silent: true });

  await props.engine.goToStep(3);
}

function resolveCreatorId() {
  const raw = selectedEvent.value?.raw || {};
  const creatorId = Number(
    selectedEvent.value?.creatorId
      ?? raw?.creatorId
      ?? props.engine.getState('fanBooking.context.creatorId')
      ?? 0,
  );
  return Number.isFinite(creatorId) && creatorId > 0 ? creatorId : 0;
}

function resolveFanId() {
  const fanId = Number(
    props.engine.getState('fanBooking.context.fanId')
      ?? props.engine.getState('userId')
      ?? props.engine.getState('currentUser.id')
      ?? 0,
  );
  return Number.isFinite(fanId) && fanId > 0 ? fanId : 0;
}

function parseTokenBalance(response, receiverId) {
  if (Number.isFinite(Number(response))) return Number(response);

  if (response && typeof response === 'object') {
    const data = response.data || {};
    const totalBalance = Number(data.balance);
    if (!receiverId && Number.isFinite(totalBalance)) return totalBalance;

    const paidTokens = Number(data.paidTokens || 0);
    const freeTokensByBeneficiary = data.freeTokensPerBeneficiary || {};
    const beneficiaryTokens = Number(freeTokensByBeneficiary?.[receiverId] || 0);
    const systemTokens = Number(freeTokensByBeneficiary?.system || 0);
    const computedBalance = paidTokens + beneficiaryTokens + systemTokens;

    if (Number.isFinite(computedBalance) && computedBalance > 0) return computedBalance;
    return Number.isFinite(totalBalance) ? totalBalance : null;
  }

  return null;
}

async function refreshWalletBalance() {
  const cachedBalance = Number(props.engine.getState('bookingDetails.walletBalance') || 0);
  walletBalance.value = Number.isFinite(cachedBalance) && cachedBalance > 0 ? cachedBalance : 0;

  const fanId = resolveFanId();
  const creatorId = resolveCreatorId();
  if (fanId <= 0 || !getBackendJwtToken()) {
    if (walletBalance.value <= 0) {
      props.engine.setState('bookingDetails.walletBalance', 0, {
        reason: 'step2-guest-token-balance-default',
        silent: true,
      });
    }
    ensureContributionDefault();
    return;
  }

  const response = await TokenHandler.get({
    userId: fanId,
    receiverId: creatorId > 0 ? creatorId : null,
    defaultValue: null,
  });
  const parsedBalance = parseTokenBalance(response, creatorId);
  if (!Number.isFinite(parsedBalance)) {
    ensureContributionDefault();
    return;
  }

  walletBalance.value = parsedBalance;
  props.engine.setState('bookingDetails.walletBalance', parsedBalance, {
    reason: 'step2-token-balance-refresh',
    silent: true,
  });
  ensureContributionDefault();
}

const timeSlots = computed(() => {
  if (!selectedEvent.value || !selectedDateIso.value) return [];

  return candidateSlots.value.map((slot) => {
    const uiSlot = createSlotUiModel({
      event: selectedEvent.value,
      eventId: selectedEvent.value.eventId,
      localDateIso: selectedDateIso.value,
      slot,
      bookedSlotsIndex: bookedSlotsIndex.value,
    });

    return {
      ...uiSlot,
      label: isGroupEvent.value
        ? `${hmToLabel(uiSlot.startHm)}-${hmToLabel(uiSlot.endHm)}`
        : hmToLabel(uiSlot.startHm),
      value: uiSlot.startHm,
      isOffHours: Boolean(uiSlot.offHours),
    };
  });
});

const hasAvailableSlots = computed(() => timeSlots.value.some((slot) => !slot.disabled));

const getMultiplesOf = (base, max) => {
  const multiples = [];
  for (let i = 1; i <= max; i++) {
    multiples.push(base * i);
  }
  return multiples;
};

const baseSessionDurationMinutes = computed(() => {
  const duration = Number(selectedEvent.value?.sessionDurationMinutes || selectedEvent.value?.raw?.sessionDurationMinutes || 15);
  return Number.isFinite(duration) && duration > 0 ? duration : 15;
});

const allowPrivateLongerSessions = computed(() => (
  toBoolean(
    selectedEvent.value?.allowLongerSessions
      ?? selectedEvent.value?.raw?.allowLongerSessions,
    false,
  )
));

const configuredPrivateMaxSessionCount = computed(() => {
  const rawMax = Number(selectedEvent.value?.maxSessionMinutes ?? selectedEvent.value?.raw?.maxSessionMinutes ?? 1);
  return Number.isFinite(rawMax) ? Math.floor(rawMax) : 1;
});

const isDurationStepperLocked = computed(() => (
  !allowPrivateLongerSessions.value || configuredPrivateMaxSessionCount.value <= 0
));

const privateMaxSessionCount = computed(() => {
  if (isDurationStepperLocked.value) return 1;
  return Math.max(1, configuredPrivateMaxSessionCount.value);
});

const privateMaxSessionDurationMinutes = computed(() => (
  baseSessionDurationMinutes.value * privateMaxSessionCount.value
));

const durationOptions = computed(() => {
  const eventDuration = baseSessionDurationMinutes.value;
  const basePrice = Number(selectedEvent.value?.basePriceTokens || 0);
  const selectedSlot = selectedTime.value;

  if (isGroupEvent.value) {
    if (!selectedSlot || selectedSlot.disabled) return [];
    const duration = Number(selectedSlot.durationMinutes || Math.round((selectedSlot.endMs - selectedSlot.startMs) / (60 * 1000)));
    if (!Number.isFinite(duration) || duration <= 0) return [];
    return [{
      value: duration,
      price: basePrice,
      disabled: false,
    }];
  }

  const unitPrice = eventDuration > 0 ? basePrice / eventDuration : 0;

  const minutes = getMultiplesOf(eventDuration, privateMaxSessionCount.value);

  const validMinutes = minutes.filter((v) => Number.isFinite(v) && v > 0);

  const unique = Array.from(new Set(validMinutes));
  return unique.map((value) => ({
    value,
    price: toWholeTokens(unitPrice * value),
    disabled: !selectedSlot || selectedSlot.disabled || !canDurationFitSelectedSlot(selectedSlot, value),
  }));
});

function formatDurationLabel(minutes) {
  const duration = Number(minutes || 0);
  if (!Number.isFinite(duration) || duration <= 0) return `0 ${t('fan_booking_min_short').toLowerCase()}`;
  if (duration <= 60) return `${duration} ${t('fan_booking_min_short').toLowerCase()}s`;

  const hours = Math.floor(duration / 60);
  const remainingMinutes = duration % 60;
  return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${remainingMinutes} ${t('fan_booking_min_short').toLowerCase()}s`;
}

const selectedDurationDisplayMinutes = computed(() => (
  Number(selectedDurationObj.value?.value || baseSessionDurationMinutes.value)
));

const selectedDurationDisplayLabel = computed(() => (
  formatDurationLabel(selectedDurationDisplayMinutes.value)
));

const maxSessionDurationDisplayLabel = computed(() => (
  formatDurationLabel(privateMaxSessionDurationMinutes.value)
));

const canAdjustDuration = computed(() => (
  !isDurationStepperLocked.value
  && Boolean(selectedTime.value && !selectedTime.value.disabled)
  && durationOptions.value.some((item) => !item.disabled)
));

const isAtMinimumDuration = computed(() => (
  selectedDurationDisplayMinutes.value <= baseSessionDurationMinutes.value
));

const showDurationMaxNotice = computed(() => (
  isDurationStepperLocked.value || showMaxDurationWarning.value
));

const durationMaxNoticeClass = computed(() => (
  isDurationStepperLocked.value ? 'text-[#FACC15]' : 'text-[#FF4D6D]'
));

const durationStepperBorderClass = computed(() => {
  if (showMaxDurationWarning.value) return 'border-[#FF4D6D]';
  return 'border-[rgba(255,255,255,0.15)]';
});

function findEnabledDurationOption(minutes) {
  return durationOptions.value.find((item) => item.value === minutes && !item.disabled) || null;
}

function selectDefaultDuration() {
  const baseOption = findEnabledDurationOption(baseSessionDurationMinutes.value);
  selectedDurationObj.value = baseOption || durationOptions.value.find((item) => !item.disabled) || null;
  showMaxDurationWarning.value = false;
}

const selectedAddons = computed(() => addons.value.filter((item) => item.selected));

const offHourSurchargePercent = computed(() => {
  const raw = selectedEvent.value?.raw || {};
  const enabled = toBoolean(raw.offHourSurcharge, false);
  const percent = Number(raw.offHourSurchargePercent || 0);
  if (!enabled || !selectedTime.value?.offHours || !Number.isFinite(percent) || percent <= 0) {
    return 0;
  }
  return percent;
});

const pricingPreview = computed(() => {
  if (!selectedEvent.value || !selectedDurationObj.value) return null;
  return buildBookingPaymentPreview(
    selectedEvent.value,
    Number(selectedDurationObj.value?.value || 0),
    selectedAddons.value.map((item) => ({ title: item.name || item.title || '', price: Number(item.price || 0) })),
    selectedTime.value || {},
    {
      isFirstBookingForCreator: isFirstBookingForCreator.value,
      contributionTokens: isEventGoalGroupEvent.value ? normalizedContributionTokens.value : null,
    },
  );
});

const longerDiscountAmount = computed(() => {
  return Number(pricingPreview.value?.discounts?.longerDiscount?.discountTokens || 0);
});

const firstTimeDiscountAmount = computed(() => {
  return Number(pricingPreview.value?.discounts?.firstTimeDiscount?.discountTokens || 0);
});

const offHourSurchargeAmount = computed(() => {
  const lines = Array.isArray(pricingPreview.value?.payment?.lines) ? pricingPreview.value.payment.lines : [];
  const line = lines.find((row) => String(row?.code) === 'off_hour_surcharge');
  return Number(line?.amount || 0);
});

const discountRows = computed(() => {
  const rows = [];
  if (longerDiscountAmount.value > 0) {
    rows.push({
      code: 'discount',
      label: t('fan_booking_longer_session_discount'),
      amount: longerDiscountAmount.value,
    });
  }
  if (firstTimeDiscountAmount.value > 0) {
    rows.push({
      code: 'first_time_discount',
      label: t('fan_booking_first_time_discount'),
      amount: firstTimeDiscountAmount.value,
    });
  }
  return rows;
});

const totalPrice = computed(() => {
  return Number(pricingPreview.value?.payment?.total || 0);
});

const canProceedToPayment = computed(() => {
  return Boolean(
    state.selected
    && selectedDurationObj.value
    && selectedTime.value
    && !selectedTime.value.disabled
    && !contributionInvalid.value
  );
});

const bottomActionDisabled = computed(() => (
  isPreviewReadOnly.value || isRefreshingAvailability.value || !canProceedToPayment.value
));

const formattedTimeRange = computed(() => {
  if (!state.selected || !selectedTime.value) return '-';
  const startHm = selectedTime.value.startHm;
  const selectedMinutes = Number(selectedDurationObj.value?.value || 0);
  const endHm = isGroupEvent.value
    ? selectedTime.value.endHm
    : (selectedMinutes > 0 ? addMinutesToHm(startHm, selectedMinutes) : selectedTime.value.endHm);
  return `${hmToLabel(startHm)}-${hmToLabel(endHm)}`;
});

const currentDuration = computed(() => {
  return state.selected ? Number(selectedDurationObj.value?.value || 0) : 0;
});

const selectedDateDisplay = computed(() => {
  if (!state.selected) return '';
  return state.selected.toLocaleDateString(locale.value, {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
});

const headerDateDisplay = computed(() => {
  if (!state.selected) return '';
  const selected = new Date(state.selected);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const isSameDay = (d1, d2) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  let prefix = '';
  if (isSameDay(selected, today)) prefix = t('common_today');
  else if (isSameDay(selected, tomorrow)) prefix = t('fan_booking_tomorrow');

  const dateStr = selected.toLocaleDateString(locale.value, { month: 'long', day: 'numeric', year: 'numeric' });
  return prefix ? `${prefix} ${dateStr}` : dateStr;
});

const events1 = computed(() => {
  const rows = [];
  const event = selectedEvent.value;
  if (!event) return rows;

  for (let offset = 0; offset <= 45; offset += 1) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const dateIso = formatLocalDateIso(date);
    if (!dateIso) continue;
    if (minSelectableDateIso.value && dateIso < minSelectableDateIso.value) continue;
    if (maxSelectableDateIso.value && dateIso > maxSelectableDateIso.value) continue;

    const slots = buildCandidateSlotsForEventDate(event, dateIso, {
      eventId: event.eventId,
      bookedSlotsIndex: bookedSlotsIndex.value,
      applyBufferAfterBooked: true,
    });
    const free = slots.some((slot) => {
      const uiSlot = createSlotUiModel({
        event,
        eventId: event.eventId,
        localDateIso: dateIso,
        slot,
        bookedSlotsIndex: bookedSlotsIndex.value,
      });
      if (uiSlot.disabled) return false;
      if (isGroupEvent.value && fanId.value != null) {
        return !isSlotBookedByUser({
          eventId: event.eventId,
          userId: fanId.value,
          slot,
          bookedSlotsIndex: bookedSlotsIndex.value,
        });
      }
      return true;
    });

    if (!free) continue;

    rows.push({
      id: `${event.eventId}_${dateIso}`,
      title: event.title,
      start: new Date(`${dateIso}T00:00:00`),
      end: new Date(`${dateIso}T23:59:59`),
      slot: 'event',
    });
  }

  return rows;
});

function isDateIsoSelectable(dateIso) {
  if (!dateIso) return false;
  if (minSelectableDateIso.value && dateIso < minSelectableDateIso.value) return false;
  if (maxSelectableDateIso.value && dateIso > maxSelectableDateIso.value) return false;
  return true;
}

function dateFromIso(dateIso) {
  if (!dateIso) return null;
  const date = new Date(`${dateIso}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function resolveDefaultSelectedDate() {
  const firstAvailableEventDate = events1.value
    .map((event) => formatLocalDateIso(event?.start))
    .find((dateIso) => isDateIsoSelectable(dateIso));
  if (firstAvailableEventDate) return dateFromIso(firstAvailableEventDate);

  const todayIso = todayDateIso.value;
  const defaultIso = isDateIsoSelectable(todayIso) ? todayIso : minSelectableDateIso.value;
  if (!isDateIsoSelectable(defaultIso)) return null;
  return dateFromIso(defaultIso);
}

const onSelectFromMini = (date) => {
  const picked = new Date(date);
  if (Number.isNaN(picked.getTime())) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  picked.setHours(0, 0, 0, 0);

  if (picked < today) return;
  if (!isDateIsoSelectable(formatLocalDateIso(picked))) return;

  state.selected = new Date(picked);
  state.focus = new Date(picked);
  selectedTime.value = null;
  selectedDurationObj.value = null;
};

function hydrateAddons() {
  if (isGroupEvent.value) {
    addons.value = [];
    return;
  }

  const raw = selectedEvent.value?.raw || {};
  const addOnRows = Array.isArray(raw.addOns) ? raw.addOns : [];

  const mapped = addOnRows.map((item, index) => ({
    id: item?.id || `${selectedEvent.value?.eventId || 'event'}_addon_${index}`,
    name: item?.title || item?.name || t('fan_booking_add_on'),
    price: Number(item?.priceTokens || item?.price || 0),
    selected: false,
  }));

  if (raw.allowFanRecordingEnabled && !mapped.some((item) => String(item.name).toLowerCase().includes('record'))) {
    mapped.unshift({
      id: `${selectedEvent.value?.eventId || 'event'}_recording`,
      name: t('fan_booking_record_our_session'),
      price: Number(raw.allowFanRecordingTokens || 0),
      selected: false,
    });
  }

  addons.value = mapped;
}

function hydrateFromState() {
  const existing = props.engine.getState('bookingDetails') || {};
  const fallbackSelectedDateIso = props.engine.getState('fanBooking.selection.selectedDate');
  let restoredSavedDate = false;

  if (existing.selectedDate || fallbackSelectedDateIso) {
    const existingDate = new Date(existing.selectedDate || `${fallbackSelectedDateIso}T00:00:00`);
    const existingDateIso = formatLocalDateIso(existingDate);
    if (!Number.isNaN(existingDate.getTime()) && isDateIsoSelectable(existingDateIso)) {
      state.selected = existingDate;
      state.focus = new Date(existingDate);
      restoredSavedDate = true;
    } else {
      state.selected = null;
    }
  } else if (!isGroupEvent.value) {
    const defaultSelectedDate = resolveDefaultSelectedDate();
    if (defaultSelectedDate) {
      state.selected = new Date(defaultSelectedDate);
      state.focus = new Date(defaultSelectedDate);
    }
  }

  if (restoredSavedDate && existing.selectedTime?.value) {
    const matchedSlot = timeSlots.value.find((slot) => slot.value === existing.selectedTime.value && !slot.disabled);
    selectedTime.value = matchedSlot || null;
  } else {
    selectedTime.value = null;
  }

  if (restoredSavedDate && existing.selectedDuration) {
    const matchedDuration = durationOptions.value.find((d) => d.value === existing.selectedDuration.value && !d.disabled);
    selectedDurationObj.value = matchedDuration || null;
  } else {
    selectedDurationObj.value = null;
  }

  otherRequest.value = isGroupEvent.value
    ? ''
    : (existing.otherRequest
      ?? props.engine.getState('fanBooking.selection.personalRequestText')
      ?? '');
  if (isGroupEvent.value) {
    props.engine.setState('fanBooking.selection.selectedAddOns', [], {
      reason: 'step2-group-addons-disabled',
      silent: true,
    });
    props.engine.setState('fanBooking.selection.personalRequestText', '', {
      reason: 'step2-group-personal-request-disabled',
      silent: true,
    });
  }

  contributionTokens.value = existing.contributionTokens
    ?? props.engine.getState('fanBooking.selection.contributionTokens')
    ?? '';
  ensureContributionDefault();

  if (!isGroupEvent.value && Array.isArray(existing.addons) && existing.addons.length > 0) {
    existing.addons.forEach(savedAddon => {
      const addon = addons.value.find((a) => String(a.id) === String(savedAddon.id) || a.name === savedAddon.name);
      if (addon) addon.selected = true;
    });
  }
}

const selectTime = (slot) => {
  if (slot.disabled) return;
  selectedTime.value = slot;
  showMaxDurationWarning.value = false;
  if (isGroupEvent.value) {
    const duration = Number(slot.durationMinutes || Math.round((slot.endMs - slot.startMs) / (60 * 1000)));
    selectedDurationObj.value = Number.isFinite(duration) && duration > 0
      ? { value: duration, price: Number(selectedEvent.value?.basePriceTokens || 0), disabled: false }
      : null;
    return;
  }
  selectDefaultDuration();
};

const selectDuration = (option) => {
  if (!selectedTime.value || option?.disabled) return;
  selectedDurationObj.value = option;
  showMaxDurationWarning.value = false;
};

const decreaseDuration = () => {
  if (!canAdjustDuration.value) return;

  const nextMinutes = Math.max(
    baseSessionDurationMinutes.value,
    selectedDurationDisplayMinutes.value - baseSessionDurationMinutes.value,
  );
  if (nextMinutes === selectedDurationDisplayMinutes.value) return;

  const option = findEnabledDurationOption(nextMinutes);
  if (!option) return;

  selectedDurationObj.value = option;
  showMaxDurationWarning.value = false;
};

const increaseDuration = () => {
  if (!canAdjustDuration.value) return;

  const nextMinutes = selectedDurationDisplayMinutes.value + baseSessionDurationMinutes.value;
  if (nextMinutes > privateMaxSessionDurationMinutes.value) {
    showMaxDurationWarning.value = true;
    return;
  }

  const option = findEnabledDurationOption(nextMinutes);
  if (!option) return;

  selectedDurationObj.value = option;
  showMaxDurationWarning.value = false;
};

const toggleAddon = (index) => {
  const row = addons.value[index];
  if (!row) return;
  row.selected = !row.selected;
};

const goToNextStep = async () => {
  if (isPreviewReadOnly.value) {
    return;
  }

  if (!state.selected) {
    showToast({
      type: 'error',
      title: t('fan_booking_date_required_title'),
      message: t('fan_booking_date_required_message'),
    });
    return;
  }

  if (!selectedTime.value || selectedTime.value.disabled) {
    showToast({
      type: 'error',
      title: t('fan_booking_slot_unavailable_title'),
      message: t('fan_booking_slot_unavailable_message'),
    });
    return;
  }

  if (!selectedDurationObj.value) {
    showToast({
      type: 'error',
      title: t('fan_booking_session_length_required_title'),
      message: t('fan_booking_session_length_required_message'),
    });
    return;
  }

  if (contributionInvalid.value) {
    showToast({
      type: 'error',
      title: t('common_validation_failed'),
      message: t('fan_booking_contribution_invalid', {
        min: eventGoalMinimumTokens.value,
        max: eventGoalMaximumTokens.value,
      }),
    });
    return;
  }

  const selectionStillAvailable = await refreshAvailabilityAndValidateSelection({
    notifyOnConflict: true,
    reason: 'step2-continue-availability-refresh',
  });
  if (!selectionStillAvailable) return;

  if (!selectedTime.value || selectedTime.value.disabled || !selectedDurationObj.value) {
    showSelectedSlotBookedToast();
    return;
  }

  const bookingData = {
    selectedDate: state.selected,
    selectedTime: selectedTime.value,
    selectedDuration: selectedDurationObj.value,
    addons: isGroupEvent.value ? [] : selectedAddons.value,
    otherRequest: isGroupEvent.value ? '' : otherRequest.value,
    formattedTimeRange: formattedTimeRange.value,
    selectedDateDisplay: selectedDateDisplay.value,
    headerDateDisplay: headerDateDisplay.value,
    totalPrice: totalPrice.value,
    contributionTokens: isEventGoalGroupEvent.value ? normalizedContributionTokens.value : null,
    longerDiscountAmount: longerDiscountAmount.value,
    firstTimeDiscountAmount: firstTimeDiscountAmount.value,
    discountRows: discountRows.value,
    offHourSurchargeAmount: offHourSurchargeAmount.value,
    offHourSurchargePercent: offHourSurchargePercent.value,
    isOffHours: Boolean(selectedTime.value?.offHours),
    walletBalance: Number(walletBalance.value || 0),
  };

  props.engine.setState('bookingDetails', bookingData);
  props.engine.setState('fanBooking.selection.selectedDate', selectedDateIso.value, { reason: 'step2-selection', silent: true });
  props.engine.setState('fanBooking.selection.selectedSlot', selectedTime.value, { reason: 'step2-selection', silent: true });
  props.engine.setState('fanBooking.selection.selectedDurationMinutes', selectedDurationObj.value.value, { reason: 'step2-selection', silent: true });
  props.engine.setState('fanBooking.selection.contributionTokens', isEventGoalGroupEvent.value ? normalizedContributionTokens.value : null, { reason: 'step2-selection', silent: true });
  props.engine.setState('fanBooking.selection.selectedAddOns', isGroupEvent.value ? [] : selectedAddons.value, { reason: 'step2-selection', silent: true });
  props.engine.setState('fanBooking.selection.personalRequestText', isGroupEvent.value ? '' : otherRequest.value, { reason: 'step2-selection', silent: true });
  props.engine.setState('fanBooking.temporaryHold', {
    temporaryHoldId: null,
    status: 'none',
    expiresAt: null,
    secondsRemaining: 0,
    createdAt: null,
    checkedAt: null,
  }, { reason: 'step2-selection-reset-hold', silent: true });

  props.engine.goToStep(3);
};

watch(
  () => otherRequest.value,
  (next) => {
    if (isGroupEvent.value) {
      props.engine.setState('fanBooking.selection.personalRequestText', '', {
        reason: 'step2-group-personal-request-disabled',
        silent: true,
      });
      return;
    }

    props.engine.setState('fanBooking.selection.personalRequestText', next ?? '', {
      reason: 'step2-personal-request',
      silent: true,
    });
  },
);

watch(
  () => selectedEvent.value,
  async (nextEvent, previousEvent) => {
    const sameEventRefresh = (
      isRefreshingAvailability.value
      && getEventIdentity(nextEvent)
      && getEventIdentity(nextEvent) === getEventIdentity(previousEvent)
    );
    if (sameEventRefresh && !isGroupEvent.value) {
      ensureContributionDefault();
      return;
    }

    if (isGroupEvent.value) {
      hydrateAddons();
      hydrateFromState();
      await refreshWalletBalance();
      await autoSelectGroupAndGoToPayment();
      return;
    }
    hydrateAddons();
    hydrateFromState();
    ensureContributionDefault();
    refreshWalletBalance();
  },
  { immediate: true },
);

watch(
  () => [isEventGoalGroupEvent.value, eventGoalMinimumTokens.value, eventGoalMaximumTokens.value],
  () => {
    ensureContributionDefault();
  },
  { immediate: true },
);

watch(
  () => contributionTokens.value,
  () => {
    if (!isEventGoalGroupEvent.value) return;
    ensureContributionDefault();
  },
);

watch(
  () => timeSlots.value,
  (slots) => {
    if (!Array.isArray(slots) || slots.length === 0) {
      selectedTime.value = null;
      return;
    }

    const selectedValue = selectedTime.value?.value;
    const matched = slots.find((slot) => slot.value === selectedValue && !slot.disabled) || null;
    selectedTime.value = matched;
  },
  { deep: true },
);

watch(
  () => durationOptions.value,
  (options) => {
    if (!Array.isArray(options) || options.length === 0) {
      selectedDurationObj.value = null;
      return;
    }
    if (
      selectedDurationObj.value
      && !options.find((item) => item.value === selectedDurationObj.value?.value && !item.disabled)
    ) {
      selectedDurationObj.value = null;
    }
  },
  { immediate: true },
);

watch(
  () => selectedTime.value,
  () => {
    if (!selectedDurationObj.value) return;
    const stillValid = durationOptions.value.find(
      (item) => item.value === selectedDurationObj.value?.value && !item.disabled,
    );
    if (!stillValid) {
      selectedDurationObj.value = null;
    }
  },
);

watch(
  () => shouldAutoRefreshAvailability.value,
  (shouldRefresh) => {
    if (shouldRefresh) {
      startAvailabilityRefreshTimer();
      return;
    }

    stopAvailabilityRefreshTimer();
  },
  { immediate: true },
);

onMounted(() => {
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityRefresh);
  }

  if (!selectedEvent.value) {
    showToast({
      type: 'error',
      title: t('fan_booking_event_missing_title'),
      message: t('fan_booking_choose_event_first'),
    });
    props.engine.goToStep(1);
    return;
  }

  if (isGroupEvent.value) {
    autoSelectGroupAndGoToPayment();
    return;
  }

  hydrateAddons();
  hydrateFromState();
  refreshWalletBalance();
  startAvailabilityRefreshTimer();
});

onBeforeUnmount(() => {
  stopAvailabilityRefreshTimer();
  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', handleVisibilityRefresh);
  }
});
</script>

<template>
  <div
    v-if="isGroupEvent"
    class="relative lg:rounded-[20px] h-dvh lg:h-full w-full lg:w-[852px] overflow-hidden bg-black/80"
  ></div>

  <div
    v-else
    class="relative lg:rounded-[20px] h-dvh lg:h-full w-full lg:w-[852px] overflow-hidden">
    <div :class="['h-full lg:rounded-[20px] md:px-[10px] md:py-6 md:bg-black lg:py-0 lg:bg-transparent lg:p-0 flex items-center', !embedded && 'md:bg-black']">
      <div class="w-full h-full lg:h-auto md:rounded-[20px]" :style="popupBackgroundStyle">
        <div class="md:rounded-bl-[20px] md:rounded-br-[0px] h-full lg:h-auto md:rounded-t-[20px] bg-[rgba(12,17,29,0.5)] flex flex-col md:flex-row before:content-['']
before:absolute
before:inset-0
before:z-[-1]
before:bg-[rgba(0,0,0,0.75)]
before:backdrop-blur-sm
md:before:backdrop-blur-none md:backdrop-blur-sm overflow-y-auto md:overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-order-style:none] [scrollbar-width:none]">

        <OneOnOneBookingFlowLeftSideBar
          :time-display="formattedTimeRange"
          :date-display="headerDateDisplay"
          :subtotal="totalPrice"
          :duration="currentDuration"
          :title-display="selectedEvent?.title || t('fan_booking_untitled_event')"
          :creator-avatar="creatorPresentation.avatar"
          :creator-name="creatorPresentation.name"
          :creator-is-verified="creatorPresentation.isVerified"
          :creator-loading="creatorPresentationLoading"
          :show-approval-needed="showApprovalNeeded"
          :is-group-event="isGroupEvent"
          :price-setting="groupPriceSetting"
        />

        <div class="flex-1 flex w-full flex-col gap-3 justify-between md:min-h-0 md:overflow-y-auto h-auto md:max-h-none lg:max-h-[41.625rem] [&::-webkit-scrollbar]:hidden [-ms-order-style:none] [scrollbar-width:none] px-2 pt-2 lg:px-3 lg:pt-3 pb-0 bg-[rgba(12,17,29,0.5)]">

          <div class="flex-none lg:flex-1 flex-col w-full pt-5 lg:p-5">
             <div class="flex items-center justify-between w-full mb-2">
              <span class="flex items-center gap-2">
                <div :class="theme1.mini.header">{{ header }}</div>
                <div class="flex items-center gap-1">
                  <button class="w-[2rem] h-[2rem] flex items-center justify-center rounded-full hover:bg-gray-100" @click="shiftMonth(-1)">
                    <svg width="7" height="13" viewBox="0 0 7 13" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.13092 11.4181L1.21289 6.50006L6.13092 1.58203" stroke="#6B7280" stroke-width="1.63934" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                  <button class="w-[2rem] h-[2rem] flex items-center justify-center rounded-full hover:bg-gray-100" @click="shiftMonth(1)">
                    <svg width="7" height="13" viewBox="0 0 7 13" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 11.4181L5.91803 6.50006L1 1.58203" stroke="#6B7280" stroke-width="1.63934" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                </div>
              </span>
              <div class="flex text-[9.02px] text-gray-500 font-medium items-center gap-[6.56px]">
                <p>{{ timezoneLabel }}</p>
                <button class="flex items-center justify-center w-[8.2px] h-[8.2px]"><svg width="6" height="3" viewBox="0 0 6 3" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.07373 0.472656L3.12291 2.52184L5.17209 0.472656" stroke="#9CA3AF" stroke-width="0.819672" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
              </div>
            </div>

            <mini-calendar
              class="w-full"
              :month-date="state.focus"
              :selected-date="state.selected"
              :min-date="minSelectableDate"
              :max-date="maxSelectableDate"
              :events="events1"
              :theme="theme1"
              :data-attrs="{ 'data-calendar':'mini' }"
              @date-selected="onSelectFromMini"
            />
          </div>

          <div v-if="!state.selected" class="flex-1 flex flex-col justify-center items-center gap-8 lg:p-5 h-full">
            <p class="text-sm flex justify-center leading-20 text-center py-16 px-0 items-center text-gray-400">
              {{ t("fan_booking_select_date_prompt") }}
            </p>
          </div>

          <div
            v-else
            class="flex-1 flex flex-col lg:px-5 gap-6 pb-[6.25rem] md:pb-[4.5rem] bg-gray-950/10"
          >
            <div
              v-if="!hasAvailableSlots"
              class="h-full w-full flex items-center justify-center"
            >
              <p class="text-sm flex justify-center leading-20 text-center py-16 px-8 items-center text-gray-400">
                {{ t("fan_booking_no_booking_on_date") }}
              </p>
            </div>

            <template v-else>
            <div class="flex flex-col gap-2 md:mt-0 mt-5">
              <h3 class="text-sm text-[#98A2B3]">
                {{ t(isGroupEvent ? "fan_booking_select_event_time" : "fan_booking_select_call_start_time") }}
              </h3>
              <div class="grid grid-cols-3 w-full gap-2">
                <div
                  v-for="(slot, index) in timeSlots"
                  :key="index"
                  data-testid="booking-flow-time-slot"
                  @click="selectTime(slot)"
                  class="flex justify-center items-center p-[0.625rem] rounded-[0.625rem] relative transition-colors"
                  :class="[
                    slot.disabled
                      ? 'opacity-50 border border-white/30 cursor-not-allowed'
                      : (
                        selectedTime?.value === slot.value
                          ? 'bg-[#07F468] border border-[#07F468] cursor-pointer'
                          : (slot.isOffHours ? 'border border-[#FF0066] cursor-pointer' : 'border-[0.5px] border-white cursor-pointer')
                      )
                  ]"
                >
                  <p
                    class="text-sm font-normal leading-"
                    :class="[
                      slot.disabled
                        ? 'text-white/70'
                        : (
                          selectedTime?.value === slot.value
                            ? 'text-black font-semibold'
                            : (slot.isOffHours ? 'text-[#FF0066]' : 'text-[#F9FAFB]')
                        )
                    ]"
                  >
                    {{ slot.label }}
                  </p>

                  <div v-if="false && slot.disabled" class="text-xs text-red-300">Booked</div>
                  <div v-else-if="slot.isOffHours && selectedTime?.value !== slot.value" class="absolute right-[0] top-[-0.3rem]">
                    <img :src="bookingFlowCloudMoonIcon" alt="peak-icon" />
                  </div>
                </div>
              </div>
            </div>

            <div v-if="!isGroupEvent" class="flex flex-col gap-4 md:mt-0 mt-5">
              <div class="flex items-center gap--2 justify-between">
                <h3 class="text-sm text-[#98A2B3]">{{ t("fan_booking_select_length") }}</h3>
                <span class="text-xs font-normal leading-[18px] text-[#EAECF0]">6 SESSION MAX.</span>
                <!-- Max session length reached alert currentyly its hide and non functional -->
                 <div class="dn items-center gap-1">
                  <span class="w-4 h-4 flex items-center justify-center">
                    <img :src="bookingFlowAlertHexagonIcon" alt="alert" />
                  </span>
                  <span class="text-xs font-normal leading-[18px] text-[#FCE40D]">MAX SESSION LENGTH REACHED</span>
                </div>
              </div>
              <div
                class=""
                :class="durationStepperBorderClass"
                data-testid="booking-flow-duration-stepper"
              >
                <div class="w-full min-h-[4rem] flex justify-between items-center gap-2 px-[1rem] py-[0.5rem] rounded-t-[8px] border-b border-b-white bg-[#0C111D] shadow-[0_4px_8px_rgba(255,255,255,0.05)]">
                  <div class="flex items-center justify-between gap-2 flex-1">
                    <div class="flex items-center gap-2">
                      <div class="min-w-0 text-left text-base font-medium leading-6 text-white">
                        {{ selectedDurationDisplayLabel }}
                      </div>
                      <span class="text-[#98A2B3] text-sm font-normal leading-5 font-[Poppins]">3 SESSIONS</span>
                    </div>
                    <div class="flex justify-end items-center gap-0.5">
                      <p class="text-base text-[#07F468] font-normal">≈</p>
                      <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                      <p class="text-base font-semibold text-[#07F468]">400</p>
                    </div>
                  </div>
                  <div class="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      data-testid="booking-flow-duration-minus"
                      class="flex h-8 w-8 items-center justify-center rounded-full bg-transparent border border-white/50 transition-colors hover:bg-white/20 focus:ring-0 disabled:opacity-20"
                      :class="(!canAdjustDuration || isAtMinimumDuration) ? 'cursor-not-allowed opacity-45 hover:bg-[#12840F]' : ''"
                      :disabled="!canAdjustDuration || isAtMinimumDuration"
                      :aria-label="t('fan_booking_decrease_length')"
                      @click="decreaseDuration"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="2" viewBox="0 0 16 2" fill="none">
    <path d="M0.75 0.75H14.75" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
                    </button>
                    <button
                      type="button"
                      data-testid="booking-flow-duration-plus"
                      class="flex h-8 w-8 items-center justify-center rounded-full bg-transparent border border-white/50 transition-colors hover:bg-white/20 focus:ring-0 disabled:opacity-20"
                      :class="!canAdjustDuration ? 'cursor-not-allowed opacity-45 hover:bg-[#12840F]' : ''"
                      :disabled="!canAdjustDuration"
                      :aria-label="t('fan_booking_increase_length')"
                      @click="increaseDuration"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 5V19M5 12H19" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-1">
                  <div class="w-5 h-5 flex justify-center items-center"><img :src="bookingFlowCalendarIcon" alt="token-icon" /></div>
                  <p class="text-sm font-normal leading-5 text-white" v-html="t('fan_booking_session_will_be_on', { date: `<span class='font-semibold'>${selectedDateDisplay}</span>`, time: formattedTimeRange !== '-' ? `<span class='font-semibold'>${formattedTimeRange}</span>` : '' })"></p>
                </div>
                
                <div class="flex items-center gap-1">
                  <div class="w-5 h-5 flex justify-center items-center"><img :src="bookingFlowCalendarCheckIcon" alt="calendar-check-icon" /></div>
                  <p class="text-sm font-normal leading-5 text-[#07F468]">You have received first time booking discount!</p>
                </div>

                <div class="flex items-center gap-1">
                  <div class="w-5 h-5 flex justify-center items-center"><img :src="bookingFlowSaleIcon" alt="calendar-sale-icon" /></div>
                  <p class="text-sm font-normal leading-5 text-[#FCE40D]">Book <span class="font-semibold">2</span> more session to get long session discount</p>
                </div>
                
                <p
                  v-if="showDurationMaxNotice"
                  class="dn items-center gap-1 text-sm font-normal leading-[18px]"
                  :class="durationMaxNoticeClass"
                  data-testid="booking-flow-duration-max-warning"
                >
                  <ExclamationTriangleIcon class="h-4 w-4 flex-none" />
                  <span>{{ t("fan_booking_max_session_length_warning", { duration: maxSessionDurationDisplayLabel }) }}</span>
                </p>
                <p v-if="!selectedTime" class="text-xs text-gray-300">{{ t("fan_booking_select_start_time_first") }}</p>
                
              </div>
              

              <div
                v-if="selectedDurationObj && (discountRows.length > 0 || offHourSurchargeAmount > 0)"
                class="mt-2 rounded-xl border border-white/10 bg-white/5 p-3"
              >
                <div class="flex flex-col gap-2">
                  <div
                    v-for="row in discountRows"
                    :key="row.code"
                    class="flex items-center justify-between text-sm text-white"
                  >
                    <p class="text-[#EAECF0]">{{ row.label }}</p>
                    <div class="flex items-center gap-1 text-[#07F468]">
                      <span>-</span>
                      <img :src="bookingFlowTokenIcon" alt="token-icon" class="h-4 w-4" />
                      <span>{{ row.amount }}</span>
                    </div>
                  </div>

                  <div
                    v-if="offHourSurchargeAmount > 0"
                    class="flex items-center justify-between text-sm text-white"
                  >
                    <p class="text-[#EAECF0]">{{ t("fan_booking_off_hour_surcharge") }}</p>
                    <div class="flex items-center gap-1 text-[#FF9F43]">
                      <span>+</span>
                      <img :src="bookingFlowTokenIcon" alt="token-icon" class="h-4 w-4" />
                      <span>{{ offHourSurchargeAmount }}</span>
                    </div>
                  </div>

                  <div class="flex items-center justify-between border-t border-white/10 pt-2 text-sm font-semibold text-white">
                    <p>{{ t("fan_booking_current_total") }}</p>
                    <div class="flex items-center gap-1">
                      <img :src="bookingFlowTokenIcon" alt="token-icon" class="h-4 w-4" />
                      <span>{{ totalPrice }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-2 md:mt-0 mt-5" v-if="!isGroupEvent && addons.length > 0">
              <h3 class="text-sm text-[#98A2B3]">{{ t("fan_booking_add_on_service_heading") }}</h3>
              <div class="flex flex-col w-full gap-2">
                <div
                  v-for="(addon, index) in addons"
                  :key="addon.id"
                  @click="toggleAddon(index)"
                  class="flex flex-row justify-between text-white py-[0.25rem] cursor-pointer"
                >
                  <div class="flex flex-row items-center gap-2">
                    <div
                      class="flex justify-center items-center w-[0.9375rem] h-[0.9375rem] p-[0.15625rem] rounded-[0.25rem]"
                      :class="addon.selected ? 'border border-[#07F468] bg-[#07F468]' : 'border-2 border-[#667085]'"
                    >
                      <img v-if="addon.selected" :src="bookingFlowCheckIcon" alt="check-icon" class="w-[0.46875rem] h-[0.3125rem]" />
                    </div>
                    <p class="text-sm leading-5 font-medium">{{ addon.name }}</p>
                  </div>
                  <div class="flex flex-row justify-end items-center gap-0.5">
                    <p class="text-sm leading-5 font-semibold">+</p>
                    <div class="flex justify-center items-center w-[1.25rem] h-[1.25rem]">
                      <img :src="bookingFlowTokenIcon" alt="token-icon" />
                    </div>
                    <p class="text-sm leading-5 font-semibold">{{ addon.price }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="!isGroupEvent" class="flex flex-col gap-2 md:mt-0 mt-5">
              <h3 class="text-sm text-[#98A2B3]">{{ t("fan_booking_other_request") }}</h3>
              <div class="desc">
                <p class="text-sm font-normal leading-5 text-[#F2F4F7]">
                  {{ t("fan_booking_other_request_body") }}
                </p>
              </div>
              <div class="example">
                <textarea
                  v-model="otherRequest"
                  class="leading-[24px] text-white break-words rounded-t-[0.25rem] bg-black/50 p-[0.75rem_0.675rem] border-b border-solid border-[#07F468] w-full"
                />
              </div>
            </div>
            </template>
          </div>

        </div>

        <div v-if="state.selected && hasAvailableSlots" :class="actionFooterClass">
          <button
            :disabled="bottomActionDisabled"
            @click="goToNextStep"
          >
            <div
              class="relative w-[14.625rem] p-[12px] md:rounded-bl-[0px] md:rounded-br-[0px] flex justify-center items-center gap-2 after:content-[''] after:absolute after:right-full after:top-0 after:w-0 after:h-0 after:border-t-[3.3125rem] after:border-t-transparent after:border-b-0"
              :class="!bottomActionDisabled
                ? 'bg-[#07F468] after:border-r-[1rem] after:border-r-[#07F468]'
                : 'bg-[#6c7280] cursor-not-allowed after:border-r-[1rem] after:border-r-[#6c7280]'"
            >
              <p class="text-lg leading-[28px] text-black text-center font-medium">
                {{ isPreviewReadOnly ? t('fan_booking_preview_only') : t('fan_booking_payment_summary') }}
              </p>
              <div class="w-6 h-6 flex justify-center items-center">
                <img :src="bookingFlowArrowRightIcon" alt="arrow-right-icon" />
              </div>
            </div>
          </button>
        </div>

      </div>
      </div>
    </div>
  </div>
</template>
