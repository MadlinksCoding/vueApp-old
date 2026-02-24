<script setup>
import { computed, ref, watch } from "vue";
import { computeNextAvailableSlot } from "@/services/bookings/utils/bookingSlotUtils.js";

const emit = defineEmits(["retry-catalog"]);

const props = defineProps({
  engine: {
    type: Object,
    required: true,
  },
});

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

function callTypeLabel(event = {}) {
  return event.type === "group-event" ? "Group event" : "1 on 1 call";
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function addOnPreview(event = {}) {
  const addOns = Array.isArray(event?.raw?.addOns) ? event.raw.addOns : [];
  return addOns.slice(0, 5).map((item) => ({
    title: item?.title || item?.name || "Add-on",
    price: safeNumber(item?.priceTokens || item?.price, 0),
  }));
}

function nextAvailableLabel(event = {}) {
  const next = computeNextAvailableSlot(event, bookedSlotsIndex.value, 45);
  if (!next) return "No upcoming free slot";

  const date = new Date(`${next.dateIso}T00:00:00`);
  const today = new Date();
  const isSameDay = date.toDateString() === today.toDateString();

  if (isSameDay) {
    return `Today @ ${next.slot.label}`;
  }

  const dateLabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${dateLabel} @ ${next.slot.label}`;
}

async function selectEvent(event) {
  if (!event) return;
  props.engine.setState("fanBooking.context.selectedEventId", event.eventId || event.id, { reason: "select-event", silent: true });
  props.engine.setState("fanBooking.context.selectedEvent", event, { reason: "select-event", silent: true });
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
  <div
    class="sm:w-96 h-full overflow-x-hidden overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-order-style:none] [scrollbar-width:none] flex flex-col items-center justify-center rounded-3xl bg-center bg-cover bg-no-repeat bg-[linear-gradient(180deg,rgba(12,17,29,0)_25%,#0C111D_100%),url('/images/background.png')] backdrop-blur-md"
  >
    <div v-if="isLoading" class="h-full flex items-center justify-center rounded-3xl bg-black/15 text-white text-sm">
      Loading events...
    </div>

    <div v-else-if="loadError" class="h-full flex flex-col items-center justify-center gap-3 rounded-3xl bg-black/15 px-6 text-center text-white">
      <p class="text-sm text-red-300">{{ loadError }}</p>
      <button
        @click="emit('retry-catalog')"
        class="px-4 py-2 rounded-lg bg-[#22CCEE] text-[#0C111D] text-sm font-semibold"
      >
        Retry
      </button>
    </div>

    <div v-else-if="events.length === 0" class="h-full flex items-center justify-center rounded-3xl bg-black/15 px-6 text-center text-white text-sm">
      No active events available right now.
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

      <div
        class="card-header flex flex-col justify-center items-center w-[5.438rem] h-[1.75rem] text-sm text-[#0C111D] font-bold bg-[#22CCEE] rounded-tl-3xl rounded-br-sm"
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
            {{ currentEvent?.title || 'Untitled Event' }}
          </div>
          <div
            class="content-price flex flex-row justify-start items-end gap-[0.5rem]"
          >
            <div class="price-icon h-full flex justify-center items-center">
              <img src="/images/token.svg" class="w-[2rem] h-[2rem]" />
            </div>
            <p class="price-amount text-4xl font-semibold">{{ safeNumber(currentEvent?.basePriceTokens, 0) }}</p>
            <p class="price-currency text-2xl font-semibold">Tokens</p>
            <p class="price-time text-sm">/{{ safeNumber(currentEvent?.sessionDurationMinutes, 15) }} minutes</p>
          </div>
        </div>

        <div class="flex flex-col gap-[1rem]">
          <div class="content-desc">
            <p class="text-ellipsis line-clamp-5">
              {{ currentEvent?.description || 'No description provided for this event.' }}
            </p>
          </div>

          <div v-if="addOnPreview(currentEvent || {}).length > 0" class="flex flex-col justify-start gap-[0.25rem] w-full">
            <div
              class="extra-row flex flex-row justify-between w-full"
              v-for="addon in addOnPreview(currentEvent || {})"
              :key="`${currentEvent?.eventId || currentEvent?.id}_${addon.title}`"
            >
              <p class="title text-sm line-clamp-1">{{ addon.title }}</p>
              <p class="price text-sm font-semibold">+{{ addon.price }} Tokens</p>
            </div>
          </div>
        </div>
      </div>

      <button
        @click="selectEvent(currentEvent)"
        class="card-footer flex flex-row justify-between items-center text-[#0C111D] bg-[#22CCEE] rounded-b-3xl cursor-pointer transition-colors"
      >
        <div
          class="left flex flex-col justify-center items-center grow gap-[0.5rem] py-2 px-6"
        >
          <p class="left-title text-xl font-bold italic">BOOK NOW</p>
          <p class="left-subtitle text-xs lg:text-sm">
            Next available time:
            <b class="font-semibold text-xs lg:text-sm">{{ nextAvailableLabel(currentEvent || {}) }}</b>
          </p>
        </div>
        <div
          class="right flex relative justify-center items-center bg-[#0C111D] w-[6rem] h-full"
        >
          <img
            class="absolute z-[999] h-full left-[-2px]"
            src="/images/Union.svg"
            alt=""
          />
          <img
            src="/images/arrow-up-right.svg"
            class="right-icon relative left-[10px]"
          />
        </div>
      </button>
    </div>
  </div>
</template>
