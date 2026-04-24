<script setup>
import MiniCalendar from '@/components/calendar/MiniCalendar.vue';
import OneOnOneBookingFlowLeftSideBar from '../HelperComponents/OneOnOneBookingFlowLeftSideBar.vue';
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { addMonths } from '@/utils/calendarHelpers.js';
import { showToast } from '@/utils/toastBus.js';
import { buildBookingPaymentPreview } from '@/services/bookings/mappers/createBookingMapper.js';
import {
  buildCandidateSlotsForEventDate,
  createSlotUiModel,
  formatLocalDateIso,
  hmToLabel,
  isRangeBooked,
} from '@/services/bookings/utils/bookingSlotUtils.js';
import { addMinutesToHm } from '@/services/events/eventsApiUtils.js';
import {
  bookingFlowArrowRightIcon,
  bookingFlowBackgroundImage,
  bookingFlowCheckIcon,
  bookingFlowCloudMoonIcon,
  bookingFlowTokenIcon,
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
});

const { t, locale } = useBookingTranslations();
const selectedEvent = computed(() => props.engine.getState('fanBooking.context.selectedEvent') || null);
const bookedSlotsIndex = computed(() => props.engine.getState('fanBooking.catalog.bookedSlotsIndex') || {});
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

const state = reactive({
  focus: new Date(y, m, 23),
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

const selectedDateIso = computed(() => (state.selected ? formatLocalDateIso(state.selected) : null));
const popupBackgroundStyle = computed(() => ({
  backgroundImage: `url('${resolvedBackgroundImageUrl.value}')`,
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'left 50% center',
}));
const actionFooterClass = computed(() => (
  props.embedded
    ? 'flex-none flex justify-end z-[99] absolute bottom-0 left-0 w-full'
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
const isFirstBookingForCreator = computed(() => (
  toBoolean(props.engine.getState('fanBooking.context.isFirstBookingForCreator'), false)
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

const pricingPreview = computed(() => {
  if (!selectedEvent.value || !selectedDurationObj.value) return null;
  return buildBookingPaymentPreview(
    selectedEvent.value,
    Number(selectedDurationObj.value?.value || 0),
    selectedAddons.value.map((item) => ({ title: item.name || item.title || '', price: Number(item.price || 0) })),
    selectedTime.value || {},
    {
      isFirstBookingForCreator: isFirstBookingForCreator.value,
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

  if (existing.selectedDate || fallbackSelectedDateIso) {
    const existingDate = new Date(existing.selectedDate || `${fallbackSelectedDateIso}T00:00:00`);
    if (!Number.isNaN(existingDate.getTime())) {
      state.selected = existingDate;
      state.focus = new Date(existingDate);
    }
  }

  if (existing.selectedTime?.value) {
    const matchedSlot = timeSlots.value.find((slot) => slot.value === existing.selectedTime.value && !slot.disabled);
    selectedTime.value = matchedSlot || null;
  } else {
    selectedTime.value = null;
  }

  if (existing.selectedDuration) {
    const matchedDuration = durationOptions.value.find((d) => d.value === existing.selectedDuration.value && !d.disabled);
    selectedDurationObj.value = matchedDuration || null;
  } else {
    selectedDurationObj.value = null;
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
    firstTimeDiscountAmount: firstTimeDiscountAmount.value,
    discountRows: discountRows.value,
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
      title: t('fan_booking_event_missing_title'),
      message: t('fan_booking_choose_event_first'),
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
    class="relative lg:rounded-[20px] h-dvh lg:h-full w-full lg:w-[852px] overflow-hidden">
    <div :class="['h-full lg:rounded-[20px] md:px-[10px] md:py-6 md:bg-black lg:py-0 lg:bg-transparent lg:p-0 flex items-center', !embedded && 'md:bg-black']">
      <div class="w-full h-full lg:h-auto md:rounded-[20px]" :style="popupBackgroundStyle">
        <div class="md:rounded-b-[20px] h-full lg:h-auto md:rounded-t-[20px] flex bg-black/75 flex-col md:flex-row backdrop-blur-sm md:overflow-hidden">

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
        />

        <div class="flex-1 flex w-full flex-col gap-3 justify-between min-h-0 overflow-y-auto h-auto max-h-[29.4rem] md:max-h-none lg:max-h-[41.625rem] [&::-webkit-scrollbar]:hidden [-ms-order-style:none] [scrollbar-width:none] px-2 pt-2 lg:px-3 lg:pt-3 pb-0 backdrop-blur-sm">

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
              :selected-date="state.selected || state.focus"
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
            class="flex-1 flex flex-col lg:px-5 gap-6 pb-14 bg-gray-950/10 lg:overflow-hidden lg:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-order-style:none] [scrollbar-width:none]"
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
              <h3 class="text-sm text-[#22CCEE] font-semibold leading-[20px]">{{ t("fan_booking_select_call_start_time") }}</h3>
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
                    <img :src="bookingFlowCloudMoonIcon" alt="peak-icon" />
                  </div>
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-2 md:mt-0 mt-5">
              <h3 class="text-sm text-[#22CCEE] font-semibold leading-[20px]">{{ t("fan_booking_select_length") }}</h3>
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
                      {{ opt.value }} {{ t("fan_booking_min_short") }}
                    </p>
                  </div>
                </div>
              </div>
              <p v-if="!selectedTime" class="text-xs text-gray-300">{{ t("fan_booking_select_start_time_first") }}</p>
              <p class="text-sm leading-[20px] text-[#07F468]">
                {{ t("fan_booking_session_will_be_on", { date: selectedDateDisplay, time: formattedTimeRange !== '-' ? formattedTimeRange : '' }) }}
              </p>

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

            <div class="flex flex-col gap-2 md:mt-0 mt-5" v-if="addons.length > 0">
              <h3 class="text-sm text-[#22CCEE] font-semibold leading-[20px]">{{ t("fan_booking_add_on_service_heading") }}</h3>
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
                    <p class="text-sm leading-[20px] font-medium">{{ addon.name }}</p>
                  </div>
                  <div class="flex flex-row justify-end items-center gap-0.5">
                    <p class="text-sm leading-[20px] font-semibold">+</p>
                    <div class="flex justify-center items-center w-[1.25rem] h-[1.25rem]">
                      <img :src="bookingFlowTokenIcon" alt="token-icon" />
                    </div>
                    <p class="text-sm leading-[20px] font-semibold">{{ addon.price }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-2 md:mt-0 mt-5">
              <h3 class="text-sm text-[#22CCEE] font-semibold leading-[20px]">{{ t("fan_booking_other_request") }}</h3>
              <div class="desc">
                <p class="text-sm leading-[20px] text-[#F2F4F7]">
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
              class="relative w-[14.625rem] p-[12px] md:rounded-br-[20px] flex justify-center items-center gap-2 after:content-[''] after:absolute after:right-full after:top-0 after:w-0 after:h-0 after:border-t-[3.3125rem] after:border-t-transparent after:border-b-0"
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
