<script setup>
import { computed, ref, watch } from "vue";
import {
  computeNextAvailableSlot,
  countGroupSlotBookings,
  hmToLabel,
  resolveGroupCapacity,
  sumEventGoalContributionsForEvent,
} from "@/services/bookings/utils/bookingSlotUtils.js";
import { buildBookingPaymentPreview } from "@/services/bookings/mappers/createBookingMapper.js";
import {
  bookingFlowArrowUpRightIcon,
  bookingFlowBackgroundImage,
  bookingFlowTokenIcon,
  bookingFlowUnionIcon,
} from "./oneOnOneBookingFlowAssets.js";
import BookingFlowStepLoading from "./BookingFlowStepLoading.vue";
import { useEventBackgroundImage } from "./useEventBackgroundImage.js";
import { useBookingTranslations } from "@/i18n/bookingTranslations.js";

const emit = defineEmits(["retry-catalog"]);

const props = defineProps({
  engine: {
    type: Object,
    required: true,
  },
  embedded: {
    type: Boolean,
    default: false,
  },
});

const { t, locale } = useBookingTranslations();
const events = computed(() => props.engine.getState("fanBooking.catalog.events") || []);
const bookedSlotsIndex = computed(() => props.engine.getState("fanBooking.catalog.bookedSlotsIndex") || {});
const isLoading = computed(() => Boolean(props.engine.getState("fanBooking.ui.catalogLoading")));
const loadError = computed(() => props.engine.getState("fanBooking.ui.catalogError") || "");

const currentIndex = ref(0);

const totalEvents = computed(() => events.value.length);
const currentEvent = computed(() => {
  if (!events.value.length) return null;
  const safeIndex = Math.min(Math.max(currentIndex.value, 0), events.value.length - 1);
  return events.value[safeIndex] || null;
});

const outerClass = computed(() => (
  props.embedded
    ? "h-full w-full max-h-full overflow-auto scrollbar-hide p-4 md:p-6 flex items-center justify-center"
    : "h-screen w-full max-h-full overflow-auto scrollbar-hide md:py-8 flex justify-center items-center"
));

const { resolvedBackgroundImageUrl } = useEventBackgroundImage(currentEvent, bookingFlowBackgroundImage);

const cardBackgroundStyle = computed(() => ({
  backgroundImage: `linear-gradient(180deg, rgba(12, 17, 29, 0) 25%, #0C111D 100%), url('${resolvedBackgroundImageUrl.value}')`,
  backgroundPosition: "center",
  backgroundSize: "cover",
  backgroundRepeat: "no-repeat",
}));

const groupCardBackgroundStyle = computed(() => {
  const event = currentEvent.value || {};
  const gradient = isEventGoalGroupEvent(event)
    ? "linear-gradient(180deg, rgba(12, 17, 29, 0.05) 18%, rgba(255, 0, 102, 0.42) 58%, #0C111D 100%)"
    : "linear-gradient(180deg, rgba(12, 17, 29, 0) 22%, #0C111D 100%)";

  return {
    backgroundImage: `${gradient}, url('${resolvedBackgroundImageUrl.value}')`,
    backgroundPosition: "center",
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
  };
});

function callTypeLabel(event = {}) {
  const mediaTypeLabel = event.eventCallType === "audio" ? t("fan_booking_audio") : t("fan_booking_video");
  return event.type === "group-event"
    ? t("fan_booking_group_call_type", { media: mediaTypeLabel })
    : t("fan_booking_one_on_one_call_type", { media: mediaTypeLabel });
}

function isGroupEvent(event = {}) {
  const raw = event?.raw || {};
  return String(event?.type || event?.eventType || raw?.type || raw?.eventType || "").toLowerCase() === "group-event";
}

function isEventGoalGroupEvent(event = {}) {
  const raw = event?.raw || {};
  return isGroupEvent(event) && String(raw?.priceSetting || event?.priceSetting || "").toLowerCase() === "eventgoal";
}

function displayTokens(event = {}) {
  const raw = event?.raw || {};
  if (isEventGoalGroupEvent(event)) {
    return eventGoalMinimumTokens(event);
  }
  return safeNumber(event?.basePriceTokens, 0);
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toWholeTokens(value) {
  const numeric = Number(value || 0);
  return Math.ceil(Number.isFinite(numeric) ? numeric : 0);
}

function formatTokens(value) {
  return toWholeTokens(value).toLocaleString(locale.value);
}

function eventGoalTokens(event = {}) {
  const raw = event?.raw || {};
  return toWholeTokens(raw?.eventGoalTokens ?? event?.eventGoalTokens ?? 0);
}

function eventGoalMinimumTokens(event = {}) {
  const raw = event?.raw || {};
  const configured = Number(raw?.minContributionPerUser ?? event?.minContributionPerUser ?? 0);
  return Number.isFinite(configured) && configured > 0 ? toWholeTokens(configured) : 1;
}

function groupNextAvailable(event = {}) {
  return computeNextAvailableSlot(event, bookedSlotsIndex.value, 45);
}

function groupSlotDuration(slot = {}) {
  const explicit = Number(slot?.durationMinutes);
  if (Number.isFinite(explicit) && explicit > 0) return Math.round(explicit);
  const startMs = Number(slot?.startMs);
  const endMs = Number(slot?.endMs);
  if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs) {
    return Math.round((endMs - startMs) / (60 * 1000));
  }
  return 0;
}

function formatGroupDate(dateIso) {
  if (!dateIso) return "-";
  const date = new Date(`${dateIso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(locale.value, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatGroupTime(slot = {}) {
  if (!slot?.startHm || !slot?.endHm) return "-";
  return `${hmToLabel(slot.startHm)}-${hmToLabel(slot.endHm)}`;
}

function getPaymentLineAmount(payment, code) {
  const lines = Array.isArray(payment?.lines) ? payment.lines : [];
  const row = lines.find((item) => String(item?.code || "") === code);
  return Number(row?.amount || 0);
}
function groupCardStats(event = {}) {
  const next = groupNextAvailable(event);
  const eventId = event?.eventId || event?.id;
  const slot = next?.slot || null;
  const capacity = resolveGroupCapacity(event);
  const hasCapacity = Number.isFinite(capacity);
  const joined = slot && eventId
    ? countGroupSlotBookings({ eventId, slot, bookedSlotsIndex: bookedSlotsIndex.value })
    : 0;
  const remainingSpots = hasCapacity ? Math.max(0, capacity - joined) : null;
  const goal = eventGoalTokens(event);
  const reached = isEventGoalGroupEvent(event)
    ? Math.min(goal, sumEventGoalContributionsForEvent({ eventId, bookedSlotsIndex: bookedSlotsIndex.value }))
    : 0;
  const goalPercent = goal > 0 ? Math.min(100, Math.max(0, Math.floor((reached / goal) * 100))) : 0;

  return {
    next,
    slot,
    dateLabel: formatGroupDate(next?.dateIso),
    timeLabel: formatGroupTime(slot),
    joined,
    capacity,
    hasCapacity,
    remainingSpots,
    spotsPercent: hasCapacity && capacity > 0 ? Math.min(100, Math.max(0, Math.floor((joined / capacity) * 100))) : 0,
    minimumTokens: eventGoalMinimumTokens(event),
    priceTokens: toWholeTokens(event?.raw?.basePriceTokens ?? event?.basePriceTokens ?? 0),
    goal,
    reached,
    goalPercent,
  };
}

const currentGroupStats = computed(() => groupCardStats(currentEvent.value || {}));

function toPlainText(value, fallback = t("fan_booking_no_description")) {
  if (typeof value !== "string" || !value.trim()) return fallback;

  if (typeof DOMParser !== "undefined") {
    const parser = new DOMParser();
    const parsed = parser.parseFromString(value, "text/html");
    const text = parsed?.body?.textContent?.trim();
    return text || fallback;
  }

  const stripped = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return stripped || fallback;
}

function addOnPreview(event = {}) {
  const isFanRecordingAllowed = Boolean(event?.raw?.allowFanRecordingEnabled);
  const fanRecordingTokens = safeNumber(event?.raw?.allowFanRecordingTokens, 0);

  const addOns = Array.isArray(event?.raw?.addOns) ? event.raw.addOns : [];
  const finalAddOns = isFanRecordingAllowed ? [{ title: t("fan_booking_record_our_session"), price: fanRecordingTokens }, ...addOns] : [...addOns];

  return finalAddOns.slice(0, 5).map((item) => ({
    title: item?.title || item?.name || t("fan_booking_add_on"),
    price: safeNumber(item?.priceTokens || item?.price, 0),
  }));
}

function nextAvailableLabel(event = {}) {
  const next = computeNextAvailableSlot(event, bookedSlotsIndex.value, 45);
  if (!next) return t("fan_booking_no_upcoming_free_slot");

  const date = new Date(`${next.dateIso}T00:00:00`);
  const today = new Date();
  const isSameDay = date.toDateString() === today.toDateString();

  if (isSameDay) {
    return t("fan_booking_today_at", { time: next.slot.label });
  }

  const dateLabel = date.toLocaleDateString(locale.value, { month: "short", day: "numeric" });
  return `${dateLabel} @ ${next.slot.label}`;
}

async function selectEvent(event) {
  if (!event) return;
  props.engine.setState("fanBooking.context.selectedEventId", event.eventId || event.id, { reason: "select-event", silent: true });
  props.engine.setState("fanBooking.context.selectedEvent", event, { reason: "select-event", silent: true });

  if (isGroupEvent(event)) {
    const selected = groupNextAvailable(event);
    if (!selected?.slot) return;

    const duration = groupSlotDuration(selected.slot);
    const selectedDate = new Date(`${selected.dateIso}T00:00:00`);
    const contributionTokens = isEventGoalGroupEvent(event) ? eventGoalMinimumTokens(event) : null;
    const selectedDuration = {
      value: duration,
      price: isEventGoalGroupEvent(event)
        ? contributionTokens
        : toWholeTokens(event?.raw?.basePriceTokens ?? event?.basePriceTokens ?? 0),
      disabled: false,
    };
    const selectedTime = {
      ...selected.slot,
      value: selected.slot.startHm || selected.slot.value,
      label: formatGroupTime(selected.slot),
      disabled: false,
    };
    const pricingPreview = buildBookingPaymentPreview(event, duration, [], selectedTime, {
      isFirstBookingForCreator: props.engine.getState("fanBooking.context.isFirstBookingForCreator"),
      contributionTokens,
    });
    const dateDisplay = formatGroupDate(selected.dateIso);
    const timeRange = formatGroupTime(selected.slot);
    const bookingData = {
      selectedDate,
      selectedTime,
      selectedDuration,
      addons: [],
      otherRequest: "",
      formattedTimeRange: timeRange,
      selectedDateDisplay: dateDisplay,
      headerDateDisplay: dateDisplay,
      totalPrice: Number(pricingPreview?.payment?.total || 0),
      contributionTokens,
      longerDiscountAmount: 0,
      firstTimeDiscountAmount: 0,
      discountRows: [],
      offHourSurchargeAmount: 0,
      offHourSurchargePercent: 0,
      isOffHours: Boolean(selected.slot?.offHours),
      walletBalance: Number(props.engine.getState("bookingDetails.walletBalance") || 0),
    };

    props.engine.setState("bookingDetails", bookingData, { reason: "group-step1-auto-selection", silent: true });
    props.engine.setState("fanBooking.selection.selectedDate", selected.dateIso, { reason: "group-step1-auto-selection", silent: true });
    props.engine.setState("fanBooking.selection.selectedSlot", selectedTime, { reason: "group-step1-auto-selection", silent: true });
    props.engine.setState("fanBooking.selection.selectedDurationMinutes", duration, { reason: "group-step1-auto-selection", silent: true });
    props.engine.setState("fanBooking.selection.contributionTokens", contributionTokens, { reason: "group-step1-auto-selection", silent: true });
    props.engine.setState("fanBooking.selection.selectedAddOns", [], { reason: "group-step1-auto-selection", silent: true });
    props.engine.setState("fanBooking.selection.personalRequestText", "", { reason: "group-step1-auto-selection", silent: true });
    props.engine.setState("fanBooking.temporaryHold", {
      temporaryHoldId: null,
      status: "none",
      expiresAt: null,
      secondsRemaining: 0,
      createdAt: null,
      checkedAt: null,
    }, { reason: "group-step1-auto-selection-reset-hold", silent: true });

    await props.engine.goToStep(3);
    return;
  }

  await props.engine.goToStep(2);
}

function goPrev() {
  if (currentIndex.value <= 0) return;
  currentIndex.value -= 1;
}

function goNext() {
  if (currentIndex.value >= totalEvents.value - 1) return;
  currentIndex.value += 1;
}

watch(
  () => events.value.length,
  (nextLength) => {
    if (!nextLength) {
      currentIndex.value = 0;
      return;
    }

    if (currentIndex.value >= nextLength) {
      currentIndex.value = nextLength - 1;
    }
  },
  { immediate: true },
);
</script>

<template>
  <div :class="outerClass">
    <BookingFlowStepLoading v-if="isLoading" :embedded="embedded" />

    <div
      v-else
      class="w-full md:w-[25rem] h-dvh md:h-[41rem] min-h-[41rem] overflow-x-hidden overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-order-style:none] [scrollbar-width:none] flex flex-col items-center justify-center md:rounded-3xl backdrop-blur-md"
      :style="cardBackgroundStyle"
    >
      <div v-if="loadError" class="w-full h-full flex flex-col items-center justify-center gap-3 rounded-3xl bg-black/15 px-6 text-center text-white">
        <p class="text-sm text-red-300">{{ loadError }}</p>
        <button
          @click="emit('retry-catalog')"
          class="px-4 py-2 rounded-lg bg-[#22CCEE] text-[#0C111D] text-sm font-semibold"
        >
          {{ t("fan_booking_retry") }}
        </button>
      </div>

      <div v-else-if="events.length === 0" class="w-full h-full flex items-center justify-center rounded-3xl bg-black/15 px-6 text-center text-white text-sm">
        {{ t("fan_booking_no_active_events") }}
      </div>

      <div v-else class="flex flex-col justify-between w-full h-full rounded-3xl bg-black/15 relative">
        <div class="absolute right-0 flex items-center justify-end gap-2 px-3 pt-3">
          <button
            type="button"
            class="w-7 h-7 rounded-full bg-white/20 text-white text-xl disabled:opacity-40"
            :disabled="currentIndex === 0"
            @click="goPrev"
          >
            ‹
          </button>
          <div class="text-xs text-white/90 font-medium min-w-[46px] text-center">
            {{ currentIndex + 1 }} / {{ totalEvents }}
          </div>
          <button
            type="button"
            class="w-7 h-7 rounded-full bg-white/20 text-white text-xl disabled:opacity-40"
            :disabled="currentIndex >= totalEvents - 1"
            @click="goNext"
          >
            ›
          </button>
        </div>

        <template v-if="isGroupEvent(currentEvent || {})">
          <div class="absolute left-0 top-0 z-10 inline-flex overflow-hidden bg-[#0C111D] md:rounded-tl-3xl">
            <div class="rounded-br bg-[#FF0066] px-4 py-1 text-sm font-bold leading-5 text-white">
              {{ t("fan_booking_group_event_label") }}
            </div>
            <div
              v-if="!isEventGoalGroupEvent(currentEvent || {}) && currentGroupStats.hasCapacity"
              class="px-1.5 py-1 text-sm font-bold leading-5 text-[#FFED29]"
            >
              {{ t("fan_booking_limited_spots") }}
            </div>
          </div>

          <div
            class="flex h-full w-full flex-col justify-between rounded-3xl overflow-hidden"
            :style="groupCardBackgroundStyle"
          >
            <div class="flex-1 overflow-y-auto pt-10 text-white [&::-webkit-scrollbar]:hidden [-ms-order-style:none] [scrollbar-width:none]">
              <div class="flex min-h-full flex-col justify-end gap-4 px-4 pb-5">
                <div class="flex min-h-[11rem] flex-col justify-end gap-4">
                  <h2 class="line-clamp-2 text-3xl font-semibold leading-9">
                    {{ currentEvent?.title || t("fan_booking_untitled_event") }}
                  </h2>

                  <div class="flex items-end gap-2">
                    <img :src="bookingFlowTokenIcon" class="h-8 w-8 shrink-0" alt="" />
                    <span class="text-4xl font-semibold leading-10">
                      {{ formatTokens(displayTokens(currentEvent || {})) }}
                    </span>
                    <span class="pb-1 text-2xl font-semibold leading-8">
                      {{ t("fan_booking_tokens") }}
                    </span>
                    <span v-if="isEventGoalGroupEvent(currentEvent || {})" class="pb-1 text-sm leading-5">
                      {{ t("fan_booking_minimum_contribution") }}
                    </span>
                  </div>
                </div>

                <div class="flex flex-col gap-4">
                  <div class="flex items-start gap-4">
                    <svg class="mt-0.5 h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 7v5l3 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" />
                    </svg>
                    <div class="flex flex-col gap-2 text-base font-medium leading-6">
                      <span>{{ currentGroupStats.dateLabel }}</span>
                      <span>{{ currentGroupStats.timeLabel }}</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-4">
                    <svg class="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                      <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <span class="text-base font-medium leading-6">
                      {{ t("fan_booking_group_fans_joined", { count: currentGroupStats.joined }) }}
                    </span>
                  </div>

                  <p class="line-clamp-5 text-base leading-6">
                    {{ toPlainText(currentEvent?.description) }}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              :disabled="!currentGroupStats.slot"
              @click="selectEvent(currentEvent)"
              class="flex w-full flex-none overflow-hidden text-left disabled:cursor-not-allowed disabled:opacity-60 md:rounded-b-3xl"
            >
              <div
                class="flex flex-1 flex-col gap-1.5 px-5 py-2"
                :class="isEventGoalGroupEvent(currentEvent || {}) ? 'bg-[#0C111D] text-[#FFED29]' : 'bg-[#FF0066] text-white'"
              >
                <div class="flex flex-col">
                  <span class="text-xl font-bold italic leading-8">
                    {{ isEventGoalGroupEvent(currentEvent || {}) ? t("fan_booking_contribute_now") : t("fan_booking_join_event") }}
                  </span>
                  <span class="text-xs font-medium leading-4">
                    {{
                      isEventGoalGroupEvent(currentEvent || {})
                        ? t("fan_booking_group_contribute_minimum_to_join", { tokens: formatTokens(currentGroupStats.minimumTokens) })
                        : t("fan_booking_group_join_for_tokens", { tokens: formatTokens(currentGroupStats.priceTokens) })
                    }}
                  </span>
                </div>

                <div v-if="currentGroupStats.hasCapacity || isEventGoalGroupEvent(currentEvent || {})" class="flex flex-col gap-1.5">
                  <div class="h-1.5 w-full rounded-[5px] bg-white/25">
                    <div
                      class="h-full rounded-[5px]"
                      :class="isEventGoalGroupEvent(currentEvent || {}) ? 'bg-[#FFED29]' : 'bg-white'"
                      :style="{ width: `${isEventGoalGroupEvent(currentEvent || {}) ? currentGroupStats.goalPercent : currentGroupStats.spotsPercent}%` }"
                    ></div>
                  </div>
                  <div
                    v-if="isEventGoalGroupEvent(currentEvent || {})"
                    class="flex justify-between gap-2 text-xs font-medium leading-4"
                  >
                    <span>{{ t("fan_booking_event_goal_tokens_reached", { reached: formatTokens(currentGroupStats.reached), goal: formatTokens(currentGroupStats.goal) }) }}</span>
                    <span class="text-white">{{ t("fan_booking_event_goal_percent_reached", { percent: currentGroupStats.goalPercent }) }}</span>
                  </div>
                  <div v-else-if="currentGroupStats.hasCapacity" class="text-center text-xs font-medium leading-4 text-[#FFED29]">
                    {{ t("fan_booking_group_spots_left", { remaining: currentGroupStats.remainingSpots, maximum: currentGroupStats.capacity }) }}
                  </div>
                </div>
              </div>

              <div
                class="relative flex w-20 shrink-0 items-center justify-center"
                :class="isEventGoalGroupEvent(currentEvent || {}) ? 'bg-[#FFED29]' : 'bg-[#0C111D]'"
              >
                <img
                  v-if="!isEventGoalGroupEvent(currentEvent || {})"
                  class="absolute left-0 h-full -translate-x-full"
                  :src="bookingFlowUnionIcon"
                  alt=""
                />
                <svg class="relative h-8 w-8" :class="isEventGoalGroupEvent(currentEvent || {}) ? 'text-black' : 'text-[#FF0066]'" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <path d="M9.333 22.667 22.667 9.333M22.667 9.333H9.333M22.667 9.333v13.334" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
            </button>
          </div>
        </template>

        <template v-else>
        <div
          class="card-header flex flex-col justify-center items-center w-[8.438rem] h-[1.75rem] text-sm text-[#0C111D] font-bold bg-[#22CCEE] md:rounded-tl-3xl rounded-br-[4px]"
        >
          <p class="header-content p-[0.25rem 0.375rem 0.25rem 1rem]">
            {{ callTypeLabel(currentEvent || {}) }}
          </p>
          <div class="absolute top-0 right-0 p-3">
            <img src="" alt="" />
          </div>
        </div>

        <div
          class="card-content flex flex-col gap-[0.5rem] text-white w-full h-full p-[1rem]"
        >
          <div
            class="flex flex-col justify-end gap-[1rem] min-h-52 h-full pb-[0.5rem]"
          >
            <div class="content-title text-3xl font-semibold line-clamp-2">
              {{ currentEvent?.title || t('fan_booking_untitled_event') }}
            </div>
            <div
              class="content-price flex flex-row justify-start items-end gap-[0.5rem]"
            >
              <div class="price-icon h-full flex justify-center items-center">
                <img :src="bookingFlowTokenIcon" class="w-[2rem] h-[2rem]" alt="" />
              </div>
              <p class="price-amount text-4xl font-semibold mb-[-3px]">{{ displayTokens(currentEvent || {}) }}</p>
              <p class="price-currency text-2xl font-semibold mb-[-3px]">{{ t("fan_booking_tokens") }}</p>
              <p v-if="!isGroupEvent(currentEvent || {})" class="price-time text-sm">/{{ safeNumber(currentEvent?.sessionDurationMinutes, 15) }} {{ t("common_minutes") }}</p>
            </div>
          </div>

          <div class="flex flex-col gap-[1rem]">
            <div class="content-desc">
              <p class="text-ellipsis line-clamp-5">
                {{ toPlainText(currentEvent?.description) }}
              </p>
            </div>

            <div v-if="addOnPreview(currentEvent || {}).length > 0" class="flex flex-col justify-start gap-[0.25rem] w-full">
              <div
                class="extra-row flex flex-row justify-between w-full"
                v-for="addon in addOnPreview(currentEvent || {})"
                :key="`${currentEvent?.eventId || currentEvent?.id}_${addon.title}`"
              >
                <p class="title text-sm line-clamp-1">{{ addon.title }}</p>
                <p class="price text-sm font-semibold">+{{ addon.price }} {{ t("fan_booking_tokens") }}</p>
              </div>
            </div>
          </div>
        </div>

        <button
          @click="selectEvent(currentEvent)"
          class="card-footer flex flex-row justify-between items-center text-[#0C111D] bg-[#22CCEE] md:rounded-b-3xl cursor-pointer transition-colors"
        >
          <div
            class="left flex flex-col justify-center items-center grow gap-[0.5rem] py-2 px-6 mr-[-3px]"
          >
            <p class="left-title text-xl font-bold italic">{{ t("fan_booking_book_now") }}</p>
            <p class="left-subtitle text-xs lg:text-sm">
              {{ t("fan_booking_next_available_time") }}
              <b class="font-semibold text-xs lg:text-sm">{{ nextAvailableLabel(currentEvent || {}) }}</b>
            </p>
          </div>
          <div
            class="right flex relative justify-center items-center bg-[#0C111D] w-[6rem] self-stretch pl-8 pr-6"
          >
            <img
              class="absolute z-[999] h-full left-0 "
              :src="bookingFlowUnionIcon"
              alt=""
            />
            <img
              :src="bookingFlowArrowUpRightIcon"
              class="right-icon relative left-[10px]"
              alt=""
            />
          </div>
        </button>
        </template>
      </div>
    </div>
  </div>
</template>
