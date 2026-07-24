<script setup>
import MiniCalendar from '@/components/calendar/MiniCalendar.vue';
import OneOnOneBookingFlowLeftSideBar from '../HelperComponents/OneOnOneBookingFlowLeftSideBar.vue';
import { ref, reactive, computed, nextTick, onBeforeUnmount, onMounted, watch } from 'vue';
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
  getBlockingBookedSlotsForRange,
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
import {
  CIVIL_TIME_OFFSET_MINUTES,
  formatGmtOffsetLabel,
  getBrowserOffsetMinutes,
  getFixedOffsetDateTimeParts,
} from '@/services/bookings/utils/fixedOffsetTimezone.js';

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

const savedDisplayOffsetMinutes = Number(
  props.engine.getState('bookingDetails.displayTimezoneOffsetMinutes')
    ?? props.engine.getState('fanBooking.selection.displayTimezoneOffsetMinutes'),
);
const displayTimezoneOffsetMinutes = ref(
  Number.isFinite(savedDisplayOffsetMinutes)
    ? savedDisplayOffsetMinutes
    : getBrowserOffsetMinutes(),
);
const timezoneMenuOpen = ref(false);
const timezoneMenuContainer = ref(null);
const timezoneLabel = computed(() => formatGmtOffsetLabel(displayTimezoneOffsetMinutes.value));
const timezoneOptions = CIVIL_TIME_OFFSET_MINUTES.map((offsetMinutes) => ({
  offsetMinutes,
  label: formatGmtOffsetLabel(offsetMinutes),
}));

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
const acknowledgedDurationOverlapKey = ref('');
const isRefreshingAvailability = ref(false);
const timeSlotScrollContainer = ref(null);
const canScrollTimeSlotsLeft = ref(false);
const canScrollTimeSlotsRight = ref(false);
let availabilityRefreshTimerId = null;

const AVAILABILITY_REFRESH_INTERVAL_MS = 15000;

const selectedDateIso = computed(() => (state.selected ? formatLocalDateIso(state.selected) : null));
const todayDateIso = computed(() => (
  getFixedOffsetDateTimeParts(Date.now(), displayTimezoneOffsetMinutes.value)?.dateIso
  || formatLocalDateIso(new Date())
));

function formatDateIsoAtDisplayOffset(date) {
  return getFixedOffsetDateTimeParts(date, displayTimezoneOffsetMinutes.value)?.dateIso || null;
}

async function toggleTimezoneMenu() {
  timezoneMenuOpen.value = !timezoneMenuOpen.value;
  if (!timezoneMenuOpen.value) return;

  await nextTick();
  const selectedOption = timezoneMenuContainer.value?.querySelector?.(
    '[role="option"][aria-selected="true"]',
  );
  selectedOption?.scrollIntoView?.({
    block: 'center',
    inline: 'nearest',
  });
}

function closeTimezoneMenu() {
  timezoneMenuOpen.value = false;
}

function selectDisplayTimezone(offsetMinutes) {
  const normalized = Number(offsetMinutes);
  if (!Number.isFinite(normalized)) return;

  const selectedStartMs = Number(selectedTime.value?.startMs);
  displayTimezoneOffsetMinutes.value = normalized;
  closeTimezoneMenu();

  if (Number.isFinite(selectedStartMs)) {
    const convertedDateIso = getFixedOffsetDateTimeParts(selectedStartMs, normalized)?.dateIso;
    const convertedDate = dateFromIso(convertedDateIso);
    if (convertedDate) {
      state.selected = convertedDate;
      state.focus = new Date(convertedDate);
    }
  }
}

function handleTimezoneOutsideClick(event) {
  if (!timezoneMenuOpen.value) return;
  if (timezoneMenuContainer.value?.contains?.(event.target)) return;
  closeTimezoneMenu();
}

function handleTimezoneKeydown(event) {
  if (event.key === 'Escape') closeTimezoneMenu();
}

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
      const localDateIso = formatDateIsoAtDisplayOffset(localDate);
      if (localDateIso) dates.push(localDateIso);
      return;
    }

    times.forEach((timeEntry) => {
      const startHm = toHm(timeEntry?.startTime, '');
      const endHm = toHm(timeEntry?.endTime, '');
      if (!startHm) return;

      const localDate = hktDateTimeToLocalDate(hktDateIso, startHm);
      const localDateIso = formatDateIsoAtDisplayOffset(localDate);
      if (localDateIso) dates.push(localDateIso);

      if (!endHm) return;
      const endDayOffset = resolveSlotEndDayOffset(timeEntry, startHm, endHm);
      const endHktDateIso = endDayOffset > 0 ? addDaysToDateIso(hktDateIso, endDayOffset) : hktDateIso;
      const localEndDate = hktDateTimeToLocalDate(endHktDateIso, endHm);
      const localEndDateIso = formatDateIsoAtDisplayOffset(localEndDate);
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
        const localDateIso = formatDateIsoAtDisplayOffset(hktDateTimeToLocalDate(dateFrom, entry.startHm));
        if (localDateIso) fromDates.push(localDateIso);
      });
    } else {
      const localDateIso = formatDateIsoAtDisplayOffset(hktDateTimeToLocalDate(dateFrom, '12:00'));
      if (localDateIso) fromDates.push(localDateIso);
    }
  }

  if (dateTo) {
    if (entries.length > 0) {
      entries.forEach((entry) => {
        const endHktDateIso = entry.endDayOffset > 0 ? addDaysToDateIso(dateTo, entry.endDayOffset) : dateTo;
        const localDateIso = formatDateIsoAtDisplayOffset(hktDateTimeToLocalDate(endHktDateIso, entry.endHm));
        if (localDateIso) toDates.push(localDateIso);
      });
    } else {
      const localDateIso = formatDateIsoAtDisplayOffset(hktDateTimeToLocalDate(dateTo, '12:00'));
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

function buildCandidateSlotsForDisplayDate(
  event,
  displayDateIso,
  bookedIndex = bookedSlotsIndex.value,
) {
  if (!event || !displayDateIso) return [];

  const deduped = new Map();
  for (let dayOffset = -2; dayOffset <= 2; dayOffset += 1) {
    const browserLocalDateIso = addDaysToDateIso(displayDateIso, dayOffset);
    const slots = buildCandidateSlotsForEventDate(event, browserLocalDateIso, {
      eventId: event.eventId,
      bookedSlotsIndex: bookedIndex,
      applyBufferAfterBooked: true,
    });

    slots.forEach((slot) => {
      const displayParts = getFixedOffsetDateTimeParts(
        slot.startMs,
        displayTimezoneOffsetMinutes.value,
      );
      if (displayParts?.dateIso !== displayDateIso) return;
      deduped.set(`${slot.startMs}_${slot.endMs}`, slot);
    });
  }

  return Array.from(deduped.values()).sort((a, b) => a.startMs - b.startMs);
}

function buildDisplaySlot(slot, bookedIndex = bookedSlotsIndex.value) {
  const canonicalLocalDateIso = slot.localDateIso;
  const uiSlot = createSlotUiModel({
    event: selectedEvent.value,
    eventId: selectedEvent.value.eventId,
    localDateIso: canonicalLocalDateIso,
    slot,
    bookedSlotsIndex: bookedIndex,
  });
  const displayStart = getFixedOffsetDateTimeParts(
    uiSlot.startMs,
    displayTimezoneOffsetMinutes.value,
  );
  const displayEnd = getFixedOffsetDateTimeParts(
    uiSlot.endMs,
    displayTimezoneOffsetMinutes.value,
  );
  const displayStartHm = displayStart?.hm || uiSlot.startHm;
  const displayEndHm = displayEnd?.hm || uiSlot.endHm;

  return {
    ...uiSlot,
    canonicalLocalDateIso,
    canonicalStartHm: uiSlot.startHm,
    canonicalEndHm: uiSlot.endHm,
    displayDateIso: displayStart?.dateIso || canonicalLocalDateIso,
    displayStartHm,
    displayEndHm,
    label: isGroupEvent.value
      ? `${hmToLabel(displayStartHm)}-${hmToLabel(displayEndHm)}`
      : hmToLabel(displayStartHm),
    value: uiSlot.startHm,
    isOffHours: Boolean(uiSlot.offHours),
  };
}

const candidateSlots = computed(() => {
  if (!selectedEvent.value || !selectedDateIso.value) return [];
  return buildCandidateSlotsForDisplayDate(
    selectedEvent.value,
    selectedDateIso.value,
    bookedSlotsIndex.value,
  );
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

  return buildCandidateSlotsForDisplayDate(
    selectedEvent.value,
    selectedDateIso.value,
    latestBookedSlotsIndex,
  ).map((slot) => buildDisplaySlot(slot, latestBookedSlotsIndex));
}

function getSelectedAvailabilitySnapshot() {
  return {
    dateIso: selectedDateIso.value,
    slotValue: selectedTime.value?.value || selectedTime.value?.startHm || null,
    startMs: Number(selectedTime.value?.startMs),
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
    (
      (Number.isFinite(snapshot.startMs) && slot.startMs === snapshot.startMs)
      || String(slot.value) === String(snapshot.slotValue)
    )
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
    displayTimezoneOffsetMinutes: displayTimezoneOffsetMinutes.value,
    displayTimezoneLabel: timezoneLabel.value,
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
  return candidateSlots.value.map((slot) => buildDisplaySlot(slot));
});

const hasAvailableSlots = computed(() => timeSlots.value.some((slot) => !slot.disabled));

const timeSlotHourColumns = computed(() => {
  const columns = [];
  const columnsByHour = new Map();

  timeSlots.value.forEach((slot) => {
    const hour = String(slot.displayStartHm || slot.startHm || "").slice(0, 2);
    if (!hour) return;

    let column = columnsByHour.get(hour);
    if (!column) {
      column = {
        key: `hour-${hour}`,
        hour,
        slots: [],
      };
      columnsByHour.set(hour, column);
      columns.push(column);
    }
    column.slots.push(slot);
  });

  return columns;
});

const configuredOffHourSurchargePercent = computed(() => {
  const raw = selectedEvent.value?.raw || {};
  const enabled = toBoolean(
    raw.offHourSurcharge ?? selectedEvent.value?.offHourSurcharge,
    false,
  );
  const percent = Number(
    raw.offHourSurchargePercent
      ?? selectedEvent.value?.offHourSurchargePercent
      ?? 0,
  );
  return enabled && Number.isFinite(percent) && percent > 0 ? percent : 0;
});

const showOffHourSurchargeIndicator = computed(() => (
  configuredOffHourSurchargePercent.value > 0
  && timeSlots.value.some((slot) => slot.isOffHours)
));

function updateTimeSlotScrollControls() {
  const container = timeSlotScrollContainer.value;
  if (!container) {
    canScrollTimeSlotsLeft.value = false;
    canScrollTimeSlotsRight.value = false;
    return;
  }

  const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
  canScrollTimeSlotsLeft.value = container.scrollLeft > 1;
  canScrollTimeSlotsRight.value = container.scrollLeft < maxScrollLeft - 1;
}

function resolveTimeSlotColumnScrollStep(container) {
  const columns = Array.from(
    container?.querySelectorAll?.("[data-testid='booking-flow-time-slot-column']") || [],
  );
  if (columns.length >= 2) {
    const offsetStep = Number(columns[1].offsetLeft) - Number(columns[0].offsetLeft);
    if (Number.isFinite(offsetStep) && offsetStep > 0) return offsetStep;
  }

  const firstColumn = columns[0];
  const columnWidth = Number(firstColumn?.offsetWidth)
    || Number(firstColumn?.getBoundingClientRect?.().width)
    || 128;
  const styles = typeof window !== "undefined" && container
    ? window.getComputedStyle(container)
    : null;
  const gap = Number.parseFloat(styles?.columnGap || styles?.gap || "8");
  return columnWidth + (Number.isFinite(gap) ? gap : 8);
}

function scrollTimeSlotColumns(direction) {
  const container = timeSlotScrollContainer.value;
  if (!container) return;

  const left = resolveTimeSlotColumnScrollStep(container) * direction;
  if (typeof container.scrollBy === "function") {
    container.scrollBy({ left, behavior: "smooth" });
    return;
  }
  container.scrollLeft += left;
  updateTimeSlotScrollControls();
}

async function resetTimeSlotScroll() {
  await nextTick();
  const container = timeSlotScrollContainer.value;
  if (!container) return;
  container.scrollLeft = 0;
  updateTimeSlotScrollControls();
}

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

const selectedSessionCount = computed(() => (
  Math.max(1, Math.round(selectedDurationDisplayMinutes.value / baseSessionDurationMinutes.value))
));

const selectedSessionCountLabel = computed(() => {
  const translationKey = selectedSessionCount.value === 1
    ? 'fan_booking_session'
    : 'fan_booking_sessions';
  return `${selectedSessionCount.value} ${t(translationKey)}`;
});

const selectedDurationTokenCost = computed(() => (
  Number(selectedDurationObj.value?.price || 0)
));

const showFirstTimeDiscountNotice = computed(() => {
  const event = selectedEvent.value || {};
  const raw = event.raw || {};
  const enabled = toBoolean(
    raw.enableFirstTimeDiscount ?? event.enableFirstTimeDiscount,
    false,
  );
  const amount = Number(
    raw.firstTimeDiscountTokens
      ?? raw.firstTimeDiscount
      ?? event.firstTimeDiscountTokens
      ?? event.firstTimeDiscount
      ?? 0,
  );
  return isFirstBookingForCreator.value
    && enabled
    && Number.isFinite(amount)
    && amount > 0;
});

const longerDiscountMinimumSessionCount = computed(() => {
  const event = selectedEvent.value || {};
  const raw = event.raw || {};
  const configuredSessions = Number(raw.discountMinSessions ?? event.discountMinSessions);
  if (Number.isFinite(configuredSessions) && configuredSessions > 0) {
    return Math.ceil(configuredSessions);
  }

  const legacyMinimumMinutes = Number(
    raw.discountMinSessionMinutes ?? event.discountMinSessionMinutes,
  );
  if (
    Number.isFinite(legacyMinimumMinutes)
    && legacyMinimumMinutes > 0
    && baseSessionDurationMinutes.value > 0
  ) {
    return Math.ceil(legacyMinimumMinutes / baseSessionDurationMinutes.value);
  }

  return 0;
});

const hasAvailableLongerSessionDiscount = computed(() => {
  const event = selectedEvent.value || {};
  const raw = event.raw || {};
  const enabled = toBoolean(
    raw.enableDiscountForLonger ?? event.enableDiscountForLonger,
    false,
  );
  const amount = Number(
    raw.longerSessionDiscountTokens
      ?? raw.discountPercentOfBase
      ?? raw.discountPercentage
      ?? event.longerSessionDiscountTokens
      ?? event.discountPercentOfBase
      ?? event.discountPercentage
      ?? 0,
  );
  const minimumSessions = longerDiscountMinimumSessionCount.value;

  return allowPrivateLongerSessions.value
    && privateMaxSessionCount.value > 1
    && enabled
    && Number.isFinite(amount)
    && amount > 0
    && minimumSessions > 1
    && minimumSessions <= privateMaxSessionCount.value;
});

const longerDiscountRemainingSessionCount = computed(() => (
  Math.max(0, longerDiscountMinimumSessionCount.value - selectedSessionCount.value)
));

const longerDiscountNoticeLabel = computed(() => {
  if (longerDiscountRemainingSessionCount.value === 0) {
    return t('fan_booking_longer_discount_achieved');
  }

  const translationKey = longerDiscountRemainingSessionCount.value === 1
    ? 'fan_booking_longer_discount_one_session_remaining'
    : 'fan_booking_longer_discount_sessions_remaining';
  return t(translationKey, { count: longerDiscountRemainingSessionCount.value });
});

const maximumSessionCountLabel = computed(() => {
  const translationKey = privateMaxSessionCount.value === 1
    ? 'fan_booking_session_maximum'
    : 'fan_booking_sessions_maximum';
  return t(translationKey, { count: privateMaxSessionCount.value });
});

const maxSessionDurationDisplayLabel = computed(() => (
  formatDurationLabel(privateMaxSessionDurationMinutes.value)
));

const isAtMaximumDuration = computed(() => (
  Boolean(selectedTime.value && !selectedTime.value.disabled)
  && Boolean(selectedDurationObj.value)
  && selectedDurationDisplayMinutes.value >= privateMaxSessionDurationMinutes.value
));

const canAdjustDuration = computed(() => (
  !isDurationStepperLocked.value
  && Boolean(selectedTime.value && !selectedTime.value.disabled)
  && durationOptions.value.some((item) => !item.disabled)
));

const nextDurationMinutes = computed(() => (
  selectedDurationDisplayMinutes.value + baseSessionDurationMinutes.value
));

const canIncreaseDuration = computed(() => {
  if (
    isDurationStepperLocked.value
    || !selectedTime.value
    || selectedTime.value.disabled
    || !selectedDurationObj.value
    || isAtMaximumDuration.value
  ) {
    return false;
  }

  if (nextDurationMinutes.value > privateMaxSessionDurationMinutes.value) {
    return true;
  }

  if (findEnabledDurationOption(nextDurationMinutes.value)) {
    return true;
  }

  if (nextDurationBlockingBooking.value) {
    return !showDurationOverlapNotice.value;
  }

  return false;
});

const nextDurationBlockingBooking = computed(() => {
  const selectedSlot = selectedTime.value;
  const nextMinutes = nextDurationMinutes.value;
  if (
    !selectedSlot
    || selectedSlot.disabled
    || !selectedDurationObj.value
    || nextMinutes > privateMaxSessionDurationMinutes.value
    || findEnabledDurationOption(nextMinutes)
  ) {
    return null;
  }

  const targetEndMs = Number(selectedSlot.startMs) + (nextMinutes * 60 * 1000);
  const blockingRows = getBlockingBookedSlotsForRange({
    eventId: selectedEvent.value?.eventId,
    startMs: Number(selectedSlot.startMs),
    endMs: targetEndMs,
    bookedSlotsIndex: bookedSlotsIndex.value,
  });

  return blockingRows
    .filter((row) => Number.isFinite(Number(row?.startMs)))
    .sort((left, right) => Number(left.startMs) - Number(right.startMs))[0] || null;
});

const nextDurationBlockingTimeLabel = computed(() => {
  const startMs = Number(nextDurationBlockingBooking.value?.startMs);
  if (!Number.isFinite(startMs)) return '';
  const displayHm = getFixedOffsetDateTimeParts(
    startMs,
    displayTimezoneOffsetMinutes.value,
  )?.hm;
  return displayHm ? hmToLabel(displayHm) : '';
});

const nextDurationOverlapKey = computed(() => {
  const selectedStartMs = Number(selectedTime.value?.startMs);
  const blockingStartMs = Number(nextDurationBlockingBooking.value?.startMs);
  if (!Number.isFinite(selectedStartMs) || !Number.isFinite(blockingStartMs)) return '';
  return `${selectedStartMs}:${selectedDurationDisplayMinutes.value}:${blockingStartMs}`;
});

const showDurationOverlapNotice = computed(() => (
  Boolean(
    nextDurationOverlapKey.value
    && acknowledgedDurationOverlapKey.value === nextDurationOverlapKey.value
    && nextDurationBlockingTimeLabel.value
  )
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
  if (!selectedTime.value?.offHours) {
    return 0;
  }
  return configuredOffHourSurchargePercent.value;
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
  const startHm = selectedTime.value.displayStartHm || selectedTime.value.startHm;
  const selectedMinutes = Number(selectedDurationObj.value?.value || 0);
  const calculatedEndMs = Number(selectedTime.value.startMs) + (selectedMinutes * 60 * 1000);
  const endHm = isGroupEvent.value
    ? (selectedTime.value.displayEndHm || selectedTime.value.endHm)
    : (
      selectedMinutes > 0
        ? (getFixedOffsetDateTimeParts(
          calculatedEndMs,
          displayTimezoneOffsetMinutes.value,
        )?.hm || addMinutesToHm(startHm, selectedMinutes))
        : (selectedTime.value.displayEndHm || selectedTime.value.endHm)
    );
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
  const selectedIso = formatLocalDateIso(selected);
  const todayIso = todayDateIso.value;
  const tomorrowIso = addDaysToDateIso(todayIso, 1);
  let prefix = '';
  if (selectedIso === todayIso) prefix = t('common_today');
  else if (selectedIso === tomorrowIso) prefix = t('fan_booking_tomorrow');

  const dateStr = selected.toLocaleDateString(locale.value, { month: 'long', day: 'numeric', year: 'numeric' });
  return prefix ? `${prefix} ${dateStr}` : dateStr;
});

const events1 = computed(() => {
  const rows = [];
  const event = selectedEvent.value;
  if (!event) return rows;

  for (let offset = 0; offset <= 45; offset += 1) {
    const dateIso = addDaysToDateIso(todayDateIso.value, offset);
    if (!dateIso) continue;
    if (minSelectableDateIso.value && dateIso < minSelectableDateIso.value) continue;
    if (maxSelectableDateIso.value && dateIso > maxSelectableDateIso.value) continue;

    const slots = buildCandidateSlotsForDisplayDate(event, dateIso, bookedSlotsIndex.value);
    const free = slots.some((slot) => {
      const uiSlot = createSlotUiModel({
        event,
        eventId: event.eventId,
        localDateIso: slot.localDateIso,
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

  picked.setHours(0, 0, 0, 0);

  const pickedIso = formatLocalDateIso(picked);
  if (pickedIso < todayDateIso.value) return;
  if (!isDateIsoSelectable(pickedIso)) return;

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
    const savedStartMs = Number(existing.selectedTime?.startMs);
    const matchedSlot = timeSlots.value.find((slot) => (
      (
        (Number.isFinite(savedStartMs) && slot.startMs === savedStartMs)
        || slot.value === existing.selectedTime.value
        || slot.canonicalStartHm === existing.selectedTime.value
      )
      && !slot.disabled
    ));
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
  acknowledgedDurationOverlapKey.value = '';
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
  acknowledgedDurationOverlapKey.value = '';
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
  acknowledgedDurationOverlapKey.value = '';
};

const increaseDuration = () => {
  if (!canIncreaseDuration.value) return;

  const nextMinutes = selectedDurationDisplayMinutes.value + baseSessionDurationMinutes.value;
  if (nextMinutes > privateMaxSessionDurationMinutes.value) {
    showMaxDurationWarning.value = true;
    return;
  }

  const option = findEnabledDurationOption(nextMinutes);
  if (!option) {
    if (nextDurationOverlapKey.value) {
      acknowledgedDurationOverlapKey.value = nextDurationOverlapKey.value;
    }
    return;
  }

  selectedDurationObj.value = option;
  showMaxDurationWarning.value = false;
  acknowledgedDurationOverlapKey.value = '';
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
    displayTimezoneOffsetMinutes: displayTimezoneOffsetMinutes.value,
    displayTimezoneLabel: timezoneLabel.value,
  };

  props.engine.setState('bookingDetails', bookingData);
  props.engine.setState('fanBooking.selection.selectedDate', selectedDateIso.value, { reason: 'step2-selection', silent: true });
  props.engine.setState('fanBooking.selection.selectedSlot', selectedTime.value, { reason: 'step2-selection', silent: true });
  props.engine.setState('fanBooking.selection.selectedDurationMinutes', selectedDurationObj.value.value, { reason: 'step2-selection', silent: true });
  props.engine.setState('fanBooking.selection.contributionTokens', isEventGoalGroupEvent.value ? normalizedContributionTokens.value : null, { reason: 'step2-selection', silent: true });
  props.engine.setState('fanBooking.selection.selectedAddOns', isGroupEvent.value ? [] : selectedAddons.value, { reason: 'step2-selection', silent: true });
  props.engine.setState('fanBooking.selection.personalRequestText', isGroupEvent.value ? '' : otherRequest.value, { reason: 'step2-selection', silent: true });
  props.engine.setState('fanBooking.selection.displayTimezoneOffsetMinutes', displayTimezoneOffsetMinutes.value, { reason: 'step2-selection', silent: true });
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

    const selectedStartMs = Number(selectedTime.value?.startMs);
    const selectedValue = selectedTime.value?.value;
    const matched = slots.find((slot) => (
      (
        (Number.isFinite(selectedStartMs) && slot.startMs === selectedStartMs)
        || slot.value === selectedValue
      )
      && !slot.disabled
    )) || null;
    selectedTime.value = matched;
  },
  { deep: true },
);

watch(
  () => [
    selectedDateIso.value,
    timeSlotHourColumns.value.map((column) => (
      `${column.key}:${column.slots.map((slot) => slot.value).join(",")}`
    )).join("|"),
  ],
  () => {
    resetTimeSlotScroll();
  },
  { flush: "post" },
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
    document.addEventListener('click', handleTimezoneOutsideClick);
    document.addEventListener('keydown', handleTimezoneKeydown);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateTimeSlotScrollControls);
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
  resetTimeSlotScroll();
});

onBeforeUnmount(() => {
  stopAvailabilityRefreshTimer();
  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', handleVisibilityRefresh);
    document.removeEventListener('click', handleTimezoneOutsideClick);
    document.removeEventListener('keydown', handleTimezoneKeydown);
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateTimeSlotScrollControls);
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
          :selected-event="selectedEvent"
          :is-first-booking-for-creator="isFirstBookingForCreator"
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
              <div class="flex items-center">
                <div :class="theme1.mini.header">{{ header }}</div>
                <div class="flex items-center gap-1">
                  <button class="w-[2rem] h-[2rem] flex items-center justify-center rounded-full hover:bg-gray-100" @click="shiftMonth(-1)">
                    <svg width="7" height="13" viewBox="0 0 7 13" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.13092 11.4181L1.21289 6.50006L6.13092 1.58203" stroke="#6B7280" stroke-width="1.63934" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                  <button class="w-[2rem] h-[2rem] flex items-center justify-center rounded-full hover:bg-gray-100" @click="shiftMonth(1)">
                    <svg width="7" height="13" viewBox="0 0 7 13" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 11.4181L5.91803 6.50006L1 1.58203" stroke="#6B7280" stroke-width="1.63934" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                </div>
                <div
                  class="ml-1 flex items-center gap-1.5 whitespace-nowrap text-xs font-normal text-[#EAECF0]"
                  data-testid="booking-flow-slots-available-legend"
                >
                  <span class="h-2 w-2 shrink-0 rounded-full bg-[#07F468]" aria-hidden="true"></span>
                  <span>= {{ t("fan_booking_slots_available") }}</span>
                </div>
              </div>
              <div
                ref="timezoneMenuContainer"
                class="relative flex text-[9.02px] text-gray-500 font-medium items-center"
                data-testid="booking-flow-timezone-selector"
              >
                <button
                  type="button"
                  class="flex items-center gap-[6.56px]"
                  :aria-label="t('fan_booking_select_timezone')"
                  :aria-expanded="timezoneMenuOpen"
                  aria-haspopup="listbox"
                  data-testid="booking-flow-timezone-trigger"
                  @click.stop="toggleTimezoneMenu"
                >
                  <span>{{ timezoneLabel }}</span>
                  <span class="flex shrink-0 items-center justify-center w-[8.2px] h-[8.2px]">
                    <svg width="6" height="3" viewBox="0 0 6 3" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.07373 0.472656L3.12291 2.52184L5.17209 0.472656" stroke="#9CA3AF" stroke-width="0.819672" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </span>
                </button>
                <div
                  v-if="timezoneMenuOpen"
                  class="absolute right-0 top-full z-[120] mt-2 max-h-64 min-w-[8.5rem] overflow-y-auto rounded-md border border-gray-700 bg-[#0C111D] py-1 shadow-xl"
                  role="listbox"
                  :aria-label="t('fan_booking_timezone_options')"
                  data-testid="booking-flow-timezone-options"
                >
                  <button
                    v-for="option in timezoneOptions"
                    :key="option.offsetMinutes"
                    type="button"
                    role="option"
                    :aria-selected="option.offsetMinutes === displayTimezoneOffsetMinutes"
                    class="flex w-full items-center justify-between px-3 py-2 text-left text-[11px] hover:bg-gray-800"
                    :class="option.offsetMinutes === displayTimezoneOffsetMinutes ? 'text-[#07F468]' : 'text-gray-300'"
                    :data-testid="`booking-flow-timezone-option-${option.offsetMinutes}`"
                    @click.stop="selectDisplayTimezone(option.offsetMinutes)"
                  >
                    <span>{{ option.label }}</span>
                    <span v-if="option.offsetMinutes === displayTimezoneOffsetMinutes" aria-hidden="true">✓</span>
                  </button>
                </div>
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
              <div
                class="flex w-full min-w-0 flex-nowrap items-center gap-x-3"
                data-testid="booking-flow-time-slots-header"
              >
                <h3 class="shrink-0 text-sm text-[#98A2B3]">
                  {{ t(isGroupEvent ? "fan_booking_select_event_time" : "fan_booking_select_call_start_time") }}
                </h3>
                <div class="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                    data-testid="booking-flow-time-slots-previous"
                    :aria-label="t('fan_booking_previous_time_slot_hours')"
                    :disabled="!canScrollTimeSlotsLeft"
                    @click="scrollTimeSlotColumns(-1)"
                  >
                    <svg width="10" height="18" viewBox="0 0 10 18" fill="none" aria-hidden="true">
                      <path d="M8.5 1.5L1 9L8.5 16.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                    data-testid="booking-flow-time-slots-next"
                    :aria-label="t('fan_booking_next_time_slot_hours')"
                    :disabled="!canScrollTimeSlotsRight"
                    @click="scrollTimeSlotColumns(1)"
                  >
                    <svg width="10" height="18" viewBox="0 0 10 18" fill="none" aria-hidden="true">
                      <path d="M1.5 1.5L9 9L1.5 16.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </div>
                <div
                  v-if="showOffHourSurchargeIndicator"
                  class="ml-auto flex min-w-0 items-center gap-1.5 overflow-hidden text-xs font-normal text-[#EAECF0]"
                  data-testid="booking-flow-off-hour-surcharge-indicator"
                >
                  <img :src="bookingFlowCloudMoonIcon" alt="" class="h-5 w-5 shrink-0" />
                  <span
                    class="min-w-0 truncate whitespace-nowrap"
                    data-testid="booking-flow-off-hour-surcharge-label"
                  >
                    = {{ t("fan_booking_off_hour_surcharge_applied") }}
                  </span>
                </div>
              </div>
              <div
                ref="timeSlotScrollContainer"
                class="flex w-full gap-2 overflow-x-auto overscroll-x-contain scroll-smooth pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                data-testid="booking-flow-time-slots-scroll"
                @scroll="updateTimeSlotScrollControls"
              >
                <div
                  v-for="column in timeSlotHourColumns"
                  :key="column.key"
                  class="flex w-[calc((100%_-_1rem)/3)] min-w-32 flex-none flex-col gap-2"
                  data-testid="booking-flow-time-slot-column"
                  :data-hour="column.hour"
                >
                  <div
                    v-for="slot in column.slots"
                    :key="slot.value"
                    data-testid="booking-flow-time-slot"
                    :data-start-ms="slot.startMs"
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
                      <img :src="bookingFlowCloudMoonIcon" alt="" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="!isGroupEvent" class="flex flex-col gap-4 md:mt-0 mt-5">
              <div class="flex items-center gap--2 justify-between">
                <h3 class="text-sm text-[#98A2B3]">{{ t("fan_booking_select_length") }}</h3>
                <span
                  v-if="!isAtMaximumDuration"
                  class="text-xs font-normal leading-[18px] text-[#EAECF0]"
                  data-testid="booking-flow-session-maximum"
                >
                  {{ maximumSessionCountLabel }}
                </span>
                <div
                  v-else
                  class="flex items-center gap-1"
                  data-testid="booking-flow-session-maximum-reached"
                >
                  <span class="w-4 h-4 flex items-center justify-center">
                    <img :src="bookingFlowAlertHexagonIcon" alt="alert" />
                  </span>
                  <span class="text-xs font-normal leading-[18px] text-[#FCE40D]">
                    {{ t("fan_booking_max_session_length_reached") }}
                  </span>
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
                      <span
                        class="text-[#98A2B3] text-sm font-normal leading-5 font-[Poppins] uppercase"
                        data-testid="booking-flow-session-count"
                      >
                        {{ selectedSessionCountLabel }}
                      </span>
                    </div>
                    <div class="flex justify-end items-center gap-0.5">
                      <p class="text-base text-[#07F468] font-normal">≈</p>
                      <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                      <p
                        class="text-base font-semibold text-[#07F468]"
                        data-testid="booking-flow-duration-token-cost"
                      >
                        {{ selectedDurationTokenCost }}
                      </p>
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
                      :class="!canIncreaseDuration ? 'cursor-not-allowed opacity-45 hover:bg-[#12840F]' : ''"
                      :disabled="!canIncreaseDuration"
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
                <p
                  v-if="showDurationOverlapNotice"
                  class="flex items-center gap-1 text-sm font-normal leading-[18px] text-[#FF4D6D]"
                  data-testid="booking-flow-duration-overlap-warning"
                >
                  <ExclamationTriangleIcon class="h-4 w-4 flex-none" />
                  <span>{{ t("fan_booking_duration_overlap_warning", { time: nextDurationBlockingTimeLabel }) }}</span>
                </p>

                <div class="flex items-center gap-1">
                  <div class="w-5 h-5 flex justify-center items-center"><img :src="bookingFlowCalendarIcon" alt="token-icon" /></div>
                  <p class="text-sm font-normal leading-5 text-white" v-html="t('fan_booking_session_will_be_on', { date: `<span class='font-semibold'>${selectedDateDisplay}</span>`, time: formattedTimeRange !== '-' ? `<span class='font-semibold'>${formattedTimeRange}</span>` : '' })"></p>
                </div>
                
                <div
                  v-if="showFirstTimeDiscountNotice"
                  class="flex items-center gap-1"
                  data-testid="booking-flow-first-time-discount-notice"
                >
                  <div class="w-5 h-5 flex justify-center items-center"><img :src="bookingFlowCalendarCheckIcon" alt="calendar-check-icon" /></div>
                  <p class="text-sm font-normal leading-5 text-[#07F468]">
                    {{ t("fan_booking_first_time_discount_received") }}
                  </p>
                </div>

                <div
                  v-if="hasAvailableLongerSessionDiscount"
                  class="flex items-center gap-1"
                  data-testid="booking-flow-longer-discount-notice"
                >
                  <div class="w-5 h-5 flex justify-center items-center"><img :src="bookingFlowSaleIcon" alt="calendar-sale-icon" /></div>
                  <p class="text-sm font-normal leading-5 text-[#FCE40D]">
                    {{ longerDiscountNoticeLabel }}
                  </p>
                </div>
                
                <p
                  v-if="showDurationMaxNotice"
                  class="hidden items-center gap-1 text-sm font-normal leading-[18px]"
                  :class="durationMaxNoticeClass"
                  data-testid="booking-flow-duration-max-warning"
                >
                  <ExclamationTriangleIcon class="h-4 w-4 flex-none" />
                  <span>{{ t("fan_booking_max_session_length_warning", { duration: maxSessionDurationDisplayLabel }) }}</span>
                </p>
                <p v-if="!selectedTime" class="hidden text-xs text-gray-300">{{ t("fan_booking_select_start_time_first") }}</p>
                
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
