<script setup>
import MiniCalendar from '@/components/calendar/MiniCalendar.vue';
import OneOnOneBookingFlowHeader from '../HelperComponents/OneOnOneBookingFlowHeader.vue';
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { addMonths, monthNames } from '@/utils/calendarHelpers.js';
import { showToast } from '@/utils/toastBus.js';
import {
  buildCandidateSlotsForEventDate,
  createSlotUiModel,
  formatLocalDateIso,
  hmToLabel,
  isRangeBooked,
} from '@/services/bookings/utils/bookingSlotUtils.js';
import { addMinutesToHm } from '@/services/events/eventsApiUtils.js';

const props = defineProps({
  engine: {
    type: Object,
    required: true
  }
});

const selectedEvent = computed(() => props.engine.getState('fanBooking.context.selectedEvent') || null);
const bookedSlotsIndex = computed(() => props.engine.getState('fanBooking.catalog.bookedSlotsIndex') || {});

// --- CALENDAR LOGIC ---
const now = new Date();
const y = now.getFullYear();
const m = now.getMonth();

const state = reactive({
  focus: new Date(y, m, 23),
  selected: null
});

const header = computed(() => {
  return `${monthNames[state.focus.getMonth()]} ${state.focus.getFullYear()}`;
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
    header: 'text-lg font-semibold text-gray-900',
    dayBase: 'w-[37.43px] h-[37px] rounded-full flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 hover:bg-gray-50',
    outside: 'opacity-0',
    expired: 'opacity-40 cursor-not-allowed pointer-events-none',
    today: 'bg-gray-500 font-semibold text-white hover:bg-gray-600',
    selected: 'rounded-full',
    dot: 'mt-[2rem] w-1.5 h-1.5 rounded-full absolute'
  }
};

const selectedTime = ref(null);
const selectedDurationObj = ref(null);
const addons = ref([]);
const otherRequest = ref('');

const selectedDateIso = computed(() => (state.selected ? formatLocalDateIso(state.selected) : null));

const candidateSlots = computed(() => {
  if (!selectedEvent.value || !selectedDateIso.value) return [];
  return buildCandidateSlotsForEventDate(selectedEvent.value, selectedDateIso.value, {
    eventId: selectedEvent.value?.eventId,
    bookedSlotsIndex: bookedSlotsIndex.value,
    applyBufferAfterBooked: true,
  });
});

function canDurationFitSelectedSlot(slot, durationMinutes) {
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
    bookedSlotsIndex: bookedSlotsIndex.value,
  });
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

function toWholeTokens(value) {
  const numeric = Number(value || 0);
  return Math.ceil(Number.isFinite(numeric) ? numeric : 0);
}

const timeSlots = computed(() => {
  if (!selectedEvent.value || !selectedDateIso.value) return [];

  return candidateSlots.value.map((slot) => {
    const uiSlot = createSlotUiModel({
      eventId: selectedEvent.value.eventId,
      localDateIso: selectedDateIso.value,
      slot,
      bookedSlotsIndex: bookedSlotsIndex.value,
    });

    return {
      ...uiSlot,
      label: hmToLabel(uiSlot.startHm),
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

const durationOptions = computed(() => {
  const eventDuration = Number(selectedEvent.value?.sessionDurationMinutes || 15);
  const basePrice = Number(selectedEvent.value?.basePriceTokens || 0);
  const allowLongerSessions = toBoolean(
    selectedEvent.value?.allowLongerSessions
      ?? selectedEvent.value?.raw?.allowLongerSessions,
    false,
  );
  const maxSessions = selectedEvent.value?.maxSessionMinutes ?? selectedEvent.value?.raw?.maxSessionMinutes ?? 1;
  const unitPrice = eventDuration > 0 ? basePrice / eventDuration : 0;

  const minutes = allowLongerSessions
    ? getMultiplesOf(eventDuration, maxSessions)
    : [eventDuration];

  const validMinutes = minutes.filter((v) => Number.isFinite(v) && v > 0 && v <= 180);

  const unique = Array.from(new Set(validMinutes));
  const selectedSlot = selectedTime.value;
  return unique.map((value) => ({
    value,
    price: toWholeTokens(unitPrice * value),
    disabled: !selectedSlot || selectedSlot.disabled || !canDurationFitSelectedSlot(selectedSlot, value),
  }));
});

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

const offHourSurchargeAmount = computed(() => {
  if (!state.selected) return 0;
  const basePrice = Number(selectedDurationObj.value?.price || 0);
  const addonsPrice = selectedAddons.value.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const subtotal = basePrice + addonsPrice;
  const percent = offHourSurchargePercent.value;
  if (percent <= 0) return 0;
  return toWholeTokens(subtotal * percent / 100);
});

const longerDiscountAmount = computed(() => {
  const raw = selectedEvent.value?.raw || {};
  const enabled = toBoolean(raw.enableDiscountForLonger, false);
  const percent = Number(raw.discountPercentOfBase || 0);
  const selectedDuration = Number(selectedDurationObj.value?.value || 0);
  const sessionSubtotal = Number(selectedDurationObj.value?.price || 0);
  const baseSessionMinutes = Number(raw.sessionDurationMinutes || selectedEvent.value?.sessionDurationMinutes || 0);
  const minSessions = Number(raw.discountMinSessions);
  const legacyMinMinutes = Number(raw.discountMinSessionMinutes);

  let minimumMinutes = legacyMinMinutes;
  if (Number.isFinite(minSessions) && minSessions > 0 && baseSessionMinutes > 0) {
    minimumMinutes = baseSessionMinutes * minSessions;
  }

  if (
    !enabled
    || !Number.isFinite(percent)
    || percent <= 0
    || !Number.isFinite(minimumMinutes)
    || minimumMinutes <= 0
    || selectedDuration < minimumMinutes
    || sessionSubtotal <= 0
  ) {
    return 0;
  }

  return toWholeTokens(sessionSubtotal * percent / 100);
});

const totalPrice = computed(() => {
  if (!state.selected) return 0;
  const basePrice = Number(selectedDurationObj.value?.price || 0);
  const addonsPrice = selectedAddons.value.reduce((sum, item) => sum + Number(item.price || 0), 0);
  return toWholeTokens(
    basePrice
    + addonsPrice
    + offHourSurchargeAmount.value
    - longerDiscountAmount.value
  );
});

const canProceedToPayment = computed(() => {
  return Boolean(
    state.selected
    && selectedDurationObj.value
    && selectedTime.value
    && !selectedTime.value.disabled
  );
});

const bottomActionDisabled = computed(() => (
  isPreviewReadOnly.value || !canProceedToPayment.value
));

const formattedTimeRange = computed(() => {
  if (!state.selected || !selectedTime.value) return '-';
  const startHm = selectedTime.value.startHm;
  const selectedMinutes = Number(selectedDurationObj.value?.value || 0);
  const endHm = selectedMinutes > 0
    ? addMinutesToHm(startHm, selectedMinutes)
    : selectedTime.value.endHm;
  return `${hmToLabel(startHm)}-${hmToLabel(endHm)}`;
});

const currentDuration = computed(() => {
  return state.selected ? Number(selectedDurationObj.value?.value || 0) : 0;
});

const selectedDateDisplay = computed(() => {
  if (!state.selected) return '';
  return state.selected.toLocaleDateString('en-US', {
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
  if (isSameDay(selected, today)) prefix = 'Today';
  else if (isSameDay(selected, tomorrow)) prefix = 'Tomorrow';

  const dateStr = selected.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
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

    const slots = buildCandidateSlotsForEventDate(event, dateIso, {
      eventId: event.eventId,
      bookedSlotsIndex: bookedSlotsIndex.value,
      applyBufferAfterBooked: true,
    });
    const free = slots.some((slot) => !createSlotUiModel({
      eventId: event.eventId,
      localDateIso: dateIso,
      slot,
      bookedSlotsIndex: bookedSlotsIndex.value,
    }).disabled);

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

const onSelectFromMini = (date) => {
  const picked = new Date(date);
  if (Number.isNaN(picked.getTime())) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  picked.setHours(0, 0, 0, 0);

  if (picked < today) return;

  state.selected = new Date(picked);
  state.focus = new Date(picked);
  selectedTime.value = null;
  selectedDurationObj.value = null;
};

function hydrateAddons() {
  const raw = selectedEvent.value?.raw || {};
  const addOnRows = Array.isArray(raw.addOns) ? raw.addOns : [];

  const mapped = addOnRows.map((item, index) => ({
    id: item?.id || `${selectedEvent.value?.eventId || 'event'}_addon_${index}`,
    name: item?.title || item?.name || 'Add-on',
    price: Number(item?.priceTokens || item?.price || 0),
    selected: false,
  }));

  if (raw.allowFanRecordingEnabled && !mapped.some((item) => String(item.name).toLowerCase().includes('record'))) {
    mapped.unshift({
      id: `${selectedEvent.value?.eventId || 'event'}_recording`,
      name: 'Record our session',
      price: Number(raw.allowFanRecordingTokens || 0),
      selected: false,
    });
  }

  addons.value = mapped;
}

function hydrateFromState() {
  const existing = props.engine.getState('bookingDetails') || {};

  if (existing.selectedDate) {
    const existingDate = new Date(existing.selectedDate);
    if (!Number.isNaN(existingDate.getTime())) {
      state.selected = existingDate;
      state.focus = new Date(existingDate);
    }
  }

  if (existing.selectedDuration) {
    const matchedDuration = durationOptions.value.find((d) => d.value === existing.selectedDuration.value);
    selectedDurationObj.value = matchedDuration || null;
  } else {
    selectedDurationObj.value = null;
  }

  if (existing.selectedTime?.value) {
    const matchedSlot = timeSlots.value.find((slot) => slot.value === existing.selectedTime.value && !slot.disabled);
    selectedTime.value = matchedSlot || null;
  } else {
    selectedTime.value = null;
  }

  otherRequest.value = existing.otherRequest
    ?? props.engine.getState('fanBooking.selection.personalRequestText')
    ?? '';

  if (Array.isArray(existing.addons) && existing.addons.length > 0) {
    existing.addons.forEach(savedAddon => {
      const addon = addons.value.find((a) => String(a.id) === String(savedAddon.id) || a.name === savedAddon.name);
      if (addon) addon.selected = true;
    });
  }
}

const selectTime = (slot) => {
  if (slot.disabled) return;
  selectedTime.value = slot;
  selectedDurationObj.value = null;
};

const selectDuration = (option) => {
  if (!selectedTime.value || option?.disabled) return;
  selectedDurationObj.value = option;
};

const toggleAddon = (index) => {
  const row = addons.value[index];
  if (!row) return;
  row.selected = !row.selected;
};

const goToNextStep = () => {
  if (isPreviewReadOnly.value) {
    return;
  }

  if (!state.selected) {
    showToast({
      type: 'error',
      title: 'Date Required',
      message: 'Please select a date first.',
    });
    return;
  }

  if (!selectedTime.value || selectedTime.value.disabled) {
    showToast({
      type: 'error',
      title: 'Slot Unavailable',
      message: 'Please select an available time slot.',
    });
    return;
  }

  if (!selectedDurationObj.value) {
    showToast({
      type: 'error',
      title: 'Session Length Required',
      message: 'Please select session length to continue.',
    });
    return;
  }

  const bookingData = {
    selectedDate: state.selected,
    selectedTime: selectedTime.value,
    selectedDuration: selectedDurationObj.value,
    addons: selectedAddons.value,
    otherRequest: otherRequest.value,
    formattedTimeRange: formattedTimeRange.value,
    selectedDateDisplay: selectedDateDisplay.value,
    headerDateDisplay: headerDateDisplay.value,
    totalPrice: totalPrice.value,
    longerDiscountAmount: longerDiscountAmount.value,
    offHourSurchargeAmount: offHourSurchargeAmount.value,
    offHourSurchargePercent: offHourSurchargePercent.value,
    isOffHours: Boolean(selectedTime.value?.offHours),
    walletBalance: Number(props.engine.getState('bookingDetails.walletBalance') || 0),
  };

  props.engine.setState('bookingDetails', bookingData);
  props.engine.setState('fanBooking.selection.selectedDate', selectedDateIso.value, { reason: 'step2-selection', silent: true });
  props.engine.setState('fanBooking.selection.selectedSlot', selectedTime.value, { reason: 'step2-selection', silent: true });
  props.engine.setState('fanBooking.selection.selectedDurationMinutes', selectedDurationObj.value.value, { reason: 'step2-selection', silent: true });
  props.engine.setState('fanBooking.selection.selectedAddOns', selectedAddons.value, { reason: 'step2-selection', silent: true });
  props.engine.setState('fanBooking.selection.personalRequestText', otherRequest.value, { reason: 'step2-selection', silent: true });
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
    props.engine.setState('fanBooking.selection.personalRequestText', next ?? '', {
      reason: 'step2-personal-request',
      silent: true,
    });
  },
);

watch(
  () => selectedEvent.value,
  () => {
    hydrateAddons();
    hydrateFromState();
  },
  { immediate: true },
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

onMounted(() => {
  if (!selectedEvent.value) {
    showToast({
      type: 'error',
      title: 'Event Missing',
      message: 'Please choose an event first.',
    });
    props.engine.goToStep(1);
    return;
  }

  hydrateAddons();
  hydrateFromState();
});
</script>

<template>
  <div
    class="rounded-[20px] h-full lg:w-[852px] overflow-hidden"
    style="background-image: url('/images/background.png'); background-size: cover; background-repeat: no-repeat; background-position: left 50% center;"
  >
    <div class="backdrop-blur-[10px] h-full rounded-[20px] bg-[#0C111D96]">
      <div class="rounded-b-[20px] h-full rounded-t-[20px] flex flex-col bg-black/50">

        <OneOnOneBookingFlowHeader
          :time-display="formattedTimeRange"
          :date-display="headerDateDisplay"
          :subtotal="totalPrice"
          :duration="currentDuration"
          :title-display="selectedEvent?.title || 'High School Life Simulator'"
          :show-approval-needed="showApprovalNeeded"
        />

        <div class="flex-1 flex w-full lg:flex-row flex-col justify-between min-h-0 overflow-y-auto lg:overflow-visible [&::-webkit-scrollbar]:hidden [-ms-order-style:none] [scrollbar-width:none]">

          <div class="flex-1 flex-col w-full p-4 lg:overflow-hidden">
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
              :selected-date="state.selected || state.focus"
              :events="events1"
              :theme="theme1"
              :data-attrs="{ 'data-calendar':'mini' }"
              @date-selected="onSelectFromMini"
            />
          </div>

          <div v-if="!state.selected" class="flex-1 flex flex-col justify-center items-center gap-8 h-full">
            <p class="text-sm flex justify-center leading-20 text-center py-16 px-8 items-center text-gray-400">
              Select a date from calendar to see available time slots.
            </p>
          </div>

          <div
            v-else
            class="flex-1 flex-col p-[1.5rem_1rem] gap-2 bg-gray-950/10 lg:overflow-hidden lg:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-order-style:none] [scrollbar-width:none]"
          >
            <div
              v-if="!hasAvailableSlots"
              class="h-full w-full flex items-center justify-center"
            >
              <p class="text-sm flex justify-center leading-20 text-center py-16 px-8 items-center text-gray-400">
                No booking available on this date.
              </p>
            </div>

            <template v-else>
            <div class="flex flex-col gap-2 md:mt-0 mt-5">
              <h3 class="text-sm text-[#22CCEE] font-semibold leading-[20px]">SELECT CALL START TIME</h3>
              <div class="flex flex-wrap w-full gap-2">
                <div
                  v-for="(slot, index) in timeSlots"
                  :key="index"
                  @click="selectTime(slot)"
                  class="flex justify-between items-center p-[0.625rem] rounded-[0.625rem] relative transition-colors"
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
                    class="text-sm font-medium leading-[20px]"
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
                    <img src="/images/cloud-moon.svg" alt="peak-icon" />
                  </div>
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-2 md:mt-0 mt-5">
              <h3 class="text-sm text-[#22CCEE] font-semibold leading-[20px]">SELECT LENGTH</h3>
              <div class="border-[3px] border-[rgba(255,255,255,0.15)] rounded-[3.125rem]">
                <div class="w-full flex bg-[#FFFFFF26] rounded-[3.125rem]">
                  <div
                    v-for="(opt, index) in durationOptions"
                    :key="index"
                    @click="selectDuration(opt)"
                    class="rounded-[3.125rem] flex justify-center items-center grow p-[0.375rem_0.675rem] transition-colors"
                    :class="[
                      opt.disabled ? 'cursor-not-allowed opacity-45' : 'cursor-pointer',
                      selectedDurationObj?.value === opt.value ? 'bg-[#07F468]' : '',
                    ]"
                  >
                    <p
                      class="text-xs leading-[18px] font-medium"
                      :class="[
                        opt.disabled ? 'text-white/60' : '',
                        selectedDurationObj?.value === opt.value ? 'text-[#0C111D]' : 'text-white',
                      ]"
                    >
                      {{ opt.value }} MIN
                    </p>
                  </div>
                </div>
              </div>
              <p v-if="!selectedTime" class="text-xs text-gray-300">Select a start time first.</p>
              <p class="text-sm leading-[20px] text-[#07F468]">
                Your session will be on {{ selectedDateDisplay }} {{ formattedTimeRange !== '-' ? formattedTimeRange : '' }}
              </p>
            </div>

            <div class="flex flex-col gap-2 md:mt-0 mt-5" v-if="addons.length > 0">
              <h3 class="text-sm text-[#22CCEE] font-semibold leading-[20px]">ADD-ON SERVICE</h3>
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
                      <img v-if="addon.selected" src="/images/check.svg" alt="check-icon" class="w-[0.46875rem] h-[0.3125rem]" />
                    </div>
                    <p class="text-sm leading-[20px] font-medium">{{ addon.name }}</p>
                  </div>
                  <div class="flex flex-row justify-end items-center gap-0.5">
                    <p class="text-sm leading-[20px] font-semibold">+</p>
                    <div class="flex justify-center items-center w-[1.25rem] h-[1.25rem]">
                      <img src="/images/token.svg" alt="token-icon" />
                    </div>
                    <p class="text-sm leading-[20px] font-semibold">{{ addon.price }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-2 md:mt-0 mt-5">
              <h3 class="text-sm text-[#22CCEE] font-semibold leading-[20px]">OTHER REQUEST</h3>
              <div class="desc">
                <p class="text-sm leading-[20px] text-[#F2F4F7]">
                  If you have other personal request you would like Princess
                  Carrot Pop to know, please write down here. All additional
                  request are subject to additional charges.
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

        <div v-if="state.selected && hasAvailableSlots" class="flex-none flex justify-end">
          <button
            :disabled="bottomActionDisabled"
            @click="goToNextStep"
          >
            <div
              class="relative w-[14.625rem] p-[12px] rounded-br-[20px] flex justify-center items-center gap-2 after:content-[''] after:absolute after:right-full after:top-0 after:w-0 after:h-0 after:border-t-[3.3125rem] after:border-t-transparent after:border-b-0"
              :class="!bottomActionDisabled
                ? 'bg-[#07F468] after:border-r-[1rem] after:border-r-[#07F468]'
                : 'bg-[#07F468]/40 cursor-not-allowed after:border-r-[1rem] after:border-r-[#07F468]/40'"
            >
              <p class="text-lg leading-[28px] text-black text-center font-medium">
                {{ isPreviewReadOnly ? 'PREVIEW ONLY' : 'CONTINUE' }}
              </p>
              <div class="w-6 h-6 flex justify-center items-center">
                <img src="/images/arrow-right.svg" alt="arrow-right-icon" />
              </div>
            </div>
          </button>
        </div>

      </div>
    </div>
  </div>
</template>
