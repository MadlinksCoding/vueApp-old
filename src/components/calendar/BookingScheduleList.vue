<template>
  <section v-if="items.length > 0" class="flex w-full flex-col gap-3" data-test="booking-schedule-list">
    <div class="flex items-center justify-between gap-3 px-0.5">
      <div class="flex items-center gap-2">
        <h3 class="text-[0.75rem] font-bold uppercase leading-[1.125rem] tracking-wide text-slate-900">
          {{ t("dashboard_booking_schedule_title") }}
        </h3>
        <span class="inline-flex h-4 min-w-6 items-center justify-center rounded-full bg-slate-400 px-2 text-[0.7rem] font-bold leading-none text-white">
          {{ items.length }}
        </span>
      </div>
      <button
        type="button"
        class="inline-flex h-5 w-5 items-center justify-center rounded text-slate-700 hover:bg-slate-200/70"
        :aria-expanded="isExpanded ? 'true' : 'false'"
        :aria-label="t('dashboard_booking_schedule_toggle_aria')"
        data-test="booking-schedule-toggle"
        @click.stop="toggleExpanded"
      >
        <svg
          width="10"
          height="7"
          viewBox="0 0 10 7"
          fill="none"
          :class="[
            'transition-transform duration-150',
            isExpanded ? '' : 'rotate-180',
          ]"
          aria-hidden="true"
          data-test="booking-schedule-toggle-icon"
        >
          <path d="M5 0.75L9.25 6.25H0.75L5 0.75Z" fill="currentColor" />
        </svg>
      </button>
    </div>

    <div v-if="isExpanded" class="flex flex-col gap-2" data-test="booking-schedule-items">
      <article
        v-for="item in items"
        :key="item.eventId"
        class="relative flex p-3 items-center gap-1.5 rounded-[0.5rem] shadow-sm"
        :style="{ backgroundColor: rgba(item.color, 0.16) }"
        data-test="booking-schedule-row"
      >
        <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center" :style="{ color: item.color }">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M33.6416 15.2037H3.6416M33.6416 15.2037V13.2037C33.6416 10.4034 33.6416 10.1144 33.0966 9.04483C32.6173 8.10402 31.8524 7.33911 30.9116 6.85975C29.842 6.31478 28.4419 6.31478 25.6416 6.31478H24.1972M33.6416 15.2037V26.0023M3.6416 15.2037V28.3148C3.6416 31.115 3.6416 32.5152 4.18657 33.5847C4.66594 34.5255 5.43084 35.2904 6.37165 35.7698C7.44121 36.3148 8.84134 36.3148 11.6416 36.3148H19.769M3.6416 15.2037V13.2037C3.6416 10.4034 3.6416 10.1144 4.18657 9.04483C4.66594 8.10402 5.43084 7.33911 6.37165 6.85975C7.44121 6.31478 8.84134 6.31478 11.6416 6.31478H13.086M13.086 6.31478H24.1972M13.086 6.31478V2.98145M13.086 6.31478V9.64811M24.1972 6.31478V2.98145M24.1972 6.31478V9.64811M26.4435 29.0376C25.2877 27.8818 24.3751 26.575 23.7056 25.1806C23.648 25.0606 23.6192 25.0006 23.5971 24.9248C23.5185 24.6551 23.575 24.3239 23.7385 24.0956C23.7845 24.0313 23.8395 23.9763 23.9495 23.8664C24.2857 23.5301 24.4539 23.3619 24.5638 23.1928C24.9784 22.5552 24.9784 21.7332 24.5638 21.0956C24.4539 20.9265 24.2857 20.7583 23.9495 20.422L23.762 20.2346C23.2508 19.7234 22.9952 19.4678 22.7207 19.329C22.1748 19.0528 21.53 19.0528 20.9841 19.329C20.7096 19.4678 20.454 19.7234 19.9428 20.2346L19.7912 20.3862C19.2817 20.8957 19.027 21.1504 18.8325 21.4967C18.6166 21.881 18.4614 22.4778 18.4627 22.9186C18.4639 23.3158 18.5409 23.5873 18.695 24.1302C19.5232 27.0481 21.0858 29.8014 23.3828 32.0984C25.6798 34.3954 28.4331 35.958 31.3509 36.7862C31.8939 36.9403 32.1654 37.0173 32.5626 37.0185C33.0033 37.0198 33.6002 36.8646 33.9845 36.6487C34.3308 36.4542 34.5855 36.1995 35.095 35.69L35.2466 35.5384C35.7578 35.0272 36.0134 34.7716 36.1522 34.4971C36.4284 33.9511 36.4284 33.3064 36.1522 32.7605C36.0134 32.486 35.7578 32.2304 35.2466 31.7192L35.0591 31.5317C34.7229 31.1954 34.5547 31.0273 34.3856 30.9174C33.748 30.5028 32.926 30.5028 32.2883 30.9174C32.1193 31.0273 31.9511 31.1954 31.6148 31.5317C31.5049 31.6417 31.4499 31.6967 31.3856 31.7427C31.1572 31.9062 30.8261 31.9627 30.5564 31.8841C30.4805 31.8619 30.4206 31.8331 30.3006 31.7756C28.9062 31.1061 27.5993 30.1934 26.4435 29.0376Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        </span>

        <div class="min-w-0 flex-1 flex flex-col gap-0.5">
          <h4 class="truncate text-sm font-semibold leading-5" :style="{ color: item.color }">
            {{ item.title }}
          </h4>
          <div class="flex items-center gap-1.5">
            <span
              class="h-2 w-2 rounded-full"
              :class="item.openToday ? 'bg-emerald-500' : 'bg-[#ff4405]'"
            />
            <span
              class="truncate text-[0.688rem] font-medium uppercase leading-4"
              :class="item.openToday ? 'text-[#0E9384]' : 'text-gray-500'"
            >
              {{ item.openToday ? t("dashboard_booking_schedule_open_today") : t("dashboard_booking_schedule_closed_today") }}
            </span>
          </div>
        </div>

        <div class="relative ml-2 flex h-full shrink-0 items-start justify-center">
          <button
            type="button"
            class="inline-flex h-5 w-3 items-center justify-center rounded text-slate-700 hover:bg-white/40"
            :aria-expanded="openMenuEventId === item.eventId"
            :aria-label="t('dashboard_booking_schedule_menu_aria', { title: item.title })"
            @click.stop="toggleMenu(item.eventId)"
          >
            <svg width="4" height="16" viewBox="0 0 4 16" fill="none" aria-hidden="true">
              <path d="M2 3.333C2.55228 3.333 3 2.88528 3 2.333C3 1.78072 2.55228 1.333 2 1.333C1.44772 1.333 1 1.78072 1 2.333C1 2.88528 1.44772 3.333 2 3.333Z" fill="currentColor" />
              <path d="M2 9C2.55228 9 3 8.55228 3 8C3 7.44772 2.55228 7 2 7C1.44772 7 1 7.44772 1 8C1 8.55228 1.44772 9 2 9Z" fill="currentColor" />
              <path d="M2 14.667C2.55228 14.667 3 14.2193 3 13.667C3 13.1147 2.55228 12.667 2 12.667C1.44772 12.667 1 13.1147 1 13.667C1 14.2193 1.44772 14.667 2 14.667Z" fill="currentColor" />
            </svg>
          </button>

          <BookingScheduleMenu
            :open="openMenuEventId === item.eventId"
            :event="toScheduleActionPayload(item)"
            @edit="selectAction('edit', $event)"
            @view-card="selectAction('view-card', $event)"
            @delete="selectAction('delete', $event)"
            @close="closeMenu"
          />
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { mapAvailabilityToCalendarEvents } from "@/services/bookings/utils/bookingSlotUtils.js";
import { useBookingTranslations } from "@/i18n/bookingTranslations.js";
import BookingScheduleMenu from "./BookingScheduleMenu.vue";

const props = defineProps({
  events: {
    type: Array,
    default: () => [],
  },
  bookedSlotsIndex: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["edit", "delete", "view-card"]);
const { t } = useBookingTranslations();
const DEFAULT_EVENT_COLOR = "#5549FF";
const openMenuEventId = ref("");
const isExpanded = ref(true);

function isHexColor(value) {
  return typeof value === "string" && /^#([0-9a-fA-F]{3}){1,2}$/.test(value.trim());
}

function normalizeHexColor(value, fallback = DEFAULT_EVENT_COLOR) {
  return isHexColor(value) ? value.trim() : fallback;
}

function hexToRgb(hexColor = DEFAULT_EVENT_COLOR) {
  const hex = normalizeHexColor(hexColor).replace("#", "");
  const full = hex.length === 3 ? hex.split("").map((char) => `${char}${char}`).join("") : hex;
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

function getEventId(event = {}) {
  return String(event?.eventId || event?.id || event?.raw?.eventId || event?.raw?.id || "");
}

function getTitle(event = {}) {
  const fallback = t("dashboard_booking_schedule_untitled_event");
  return String(event?.title || event?.eventTitle || event?.raw?.title || fallback).trim() || fallback;
}

function getEventType(event = {}) {
  const type = String(event?.type || event?.eventType || event?.raw?.type || event?.raw?.eventType || "").toLowerCase();
  return type === "group-event" || type === "group" ? "group" : "private";
}

function isActiveEvent(event = {}) {
  return String(event?.status || event?.raw?.status || "active").toLowerCase() === "active";
}

function isSameLocalDay(left, right) {
  return (
    left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate()
  );
}

function isOpenForBookingToday(event = {}) {
  const today = new Date();
  const blocks = mapAvailabilityToCalendarEvents([event], {
    bookedSlotsIndex: props.bookedSlotsIndex || {},
    focusDate: today,
    rangeDaysBefore: 0,
    rangeDaysAfter: 0,
    mode: "freeSlots",
  });

  return blocks.some((block) => {
    const start = new Date(block?.start);
    return !Number.isNaN(start.getTime()) && isSameLocalDay(start, today);
  });
}

const items = computed(() => (
  (Array.isArray(props.events) ? props.events : [])
    .filter(isActiveEvent)
    .map((event) => ({
      event,
      eventId: getEventId(event),
      title: getTitle(event),
      type: getEventType(event),
      color: normalizeHexColor(event?.eventColorSkin || event?.raw?.eventColorSkin, DEFAULT_EVENT_COLOR),
      openToday: isOpenForBookingToday(event),
    }))
    .filter((item) => item.eventId)
));

function toggleMenu(eventId) {
  openMenuEventId.value = openMenuEventId.value === eventId ? "" : eventId;
}

function closeMenu() {
  openMenuEventId.value = "";
}

function toggleExpanded() {
  isExpanded.value = !isExpanded.value;
  if (!isExpanded.value) {
    closeMenu();
  }
}

function toScheduleActionPayload(item) {
  if (!item) return null;

  return {
    ...item.event,
    eventId: item.eventId,
    title: item.title,
    type: item.type,
  };
}

function selectAction(action, event) {
  emit(action, event);
  closeMenu();
}

function handleDocumentClick() {
  closeMenu();
}

onMounted(() => {
  document.addEventListener("click", handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
});
</script>
