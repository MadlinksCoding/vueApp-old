<template>
  <section v-if="items.length > 0" class="flex w-[20.375rem] flex-col gap-3" data-test="booking-schedule-list">
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
        class="relative flex h-16 items-center rounded-[0.5rem] px-3 shadow-sm"
        :style="{ backgroundColor: rgba(item.color, 0.16) }"
        data-test="booking-schedule-row"
      >
        <span class="mr-3 inline-flex h-10 w-10 shrink-0 items-center justify-center" :style="{ color: item.color }">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <path d="M11 9V6M29 9V6M9 15H31M12.5 34H27.5C30.5376 34 33 31.5376 33 28.5V13.5C33 10.4624 30.5376 8 27.5 8H12.5C9.46243 8 7 10.4624 7 13.5V28.5C7 31.5376 9.46243 34 12.5 34Z" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M21.5 23.5C20.3809 22.381 19.5394 21.1889 18.9749 19.9529C18.885 19.756 18.8401 19.6576 18.8112 19.5266C18.7121 19.0779 18.8065 18.6217 19.0684 18.2444C19.1448 18.1343 19.237 18.0421 19.4213 17.8578C19.7378 17.5412 19.8961 17.3829 20.0022 17.2068C20.3191 16.6809 20.3191 16.0236 20.0022 15.4977C19.8961 15.3216 19.7378 15.1633 19.4213 14.8467L19.2218 14.6473C18.7606 14.186 18.53 13.9554 18.2514 13.8587C17.8865 13.732 17.4868 13.7602 17.1431 13.937C16.8808 14.0719 16.681 14.3306 16.2814 14.8481C15.8406 15.419 15.6202 15.7044 15.5004 16.0677C15.3679 16.4695 15.3587 17.091 15.4812 17.4965C15.5919 17.8628 15.7506 18.1499 16.0681 18.7241C16.9439 20.3078 18.0703 21.7774 19.448 23.1551C20.8258 24.5328 22.2954 25.6592 23.8791 26.535C24.4532 26.8525 24.7403 27.0112 25.1066 27.1219C25.5121 27.2444 26.1337 27.2352 26.5355 27.1027C26.8987 26.9829 27.1842 26.7625 27.755 26.3217C28.2725 25.9221 28.5312 25.7223 28.6661 25.46C28.8429 25.1163 28.8711 24.7166 28.7444 24.3517C28.6477 24.0731 28.4171 23.8425 27.9558 23.3813L27.7564 23.1818C27.4398 22.8653 27.2815 22.707 27.1054 22.6009C26.5795 22.284 25.9222 22.284 25.3963 22.6009C25.2202 22.707 25.0619 22.8653 24.7453 23.1818C24.561 23.3661 24.4688 23.4583 24.3587 23.5347C23.9814 23.7966 23.5252 23.891 23.0765 23.7919C22.9455 23.763 22.8471 23.7181 22.6502 23.6282C22.2524 23.4465 21.8689 23.246 21.5 23.5Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>

        <div class="min-w-0 flex-1">
          <h4 class="truncate text-[0.9rem] font-bold leading-5" :style="{ color: item.color }">
            {{ item.title }}
          </h4>
          <div class="mt-0.5 flex items-center gap-1.5">
            <span
              class="h-1.5 w-1.5 rounded-full"
              :class="item.openToday ? 'bg-emerald-500' : 'bg-[#ff4405]'"
            />
            <span
              class="truncate text-[0.7rem] font-bold uppercase leading-4"
              :class="item.openToday ? 'text-[#00A88E]' : 'text-slate-500'"
            >
              {{ item.openToday ? t("dashboard_booking_schedule_open_today") : t("dashboard_booking_schedule_closed_today") }}
            </span>
          </div>
        </div>

        <div class="relative ml-2 flex h-8 w-6 shrink-0 items-center justify-center">
          <button
            type="button"
            class="inline-flex h-8 w-6 items-center justify-center rounded text-slate-700 hover:bg-white/40"
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

          <div
            v-if="openMenuEventId === item.eventId"
            class="absolute right-0 top-8 z-[1200] w-[12.25rem] overflow-hidden rounded-[0.125rem] border border-[#EAECF0] bg-white py-1 shadow-[0_12px_24px_rgba(15,23,42,0.18)]"
            data-test="booking-schedule-menu"
            @click.stop
          >
            <button type="button" class="schedule-menu-item text-slate-700 hover:bg-slate-50" @click.stop="selectAction('edit', item)">
              <span class="schedule-menu-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M4 20H8L18.5 9.5C19.6046 8.39543 19.6046 6.60457 18.5 5.5C17.3954 4.39543 15.6046 4.39543 14.5 5.5L4 16V20Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
              </span>
              {{ t("common_edit") }}
            </button>
            <button type="button" disabled class="schedule-menu-item cursor-not-allowed text-slate-500 opacity-40">
              <span class="schedule-menu-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 3H21V9M10 14L21 3M20 13V19C20 20.1046 19.1046 21 18 21H5C3.89543 21 3 20.1046 3 19V6C3 4.89543 3.89543 4 5 4H11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
              </span>
              {{ t("dashboard_booking_schedule_view_profile") }}
            </button>
            <button type="button" disabled class="schedule-menu-item cursor-not-allowed text-slate-500 opacity-40">
              <span class="schedule-menu-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M4 12V20H20V12M16 6L12 2M12 2L8 6M12 2V14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
              </span>
              {{ t("dashboard_booking_schedule_share_booking_page") }}
            </button>
            <button type="button" class="schedule-menu-item text-[#ff4405] hover:bg-[#fff4ef]" @click.stop="selectAction('delete', item)">
              <span class="schedule-menu-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M3 6H5H21M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6H19ZM10 11V17M14 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
              </span>
              {{ t("common_delete") }}
            </button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { mapAvailabilityToCalendarEvents } from "@/services/bookings/utils/bookingSlotUtils.js";
import { useBookingTranslations } from "@/i18n/bookingTranslations.js";

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

const emit = defineEmits(["edit", "delete"]);
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

function selectAction(action, item) {
  emit(action, {
    ...item.event,
    eventId: item.eventId,
    title: item.title,
    type: item.type,
  });
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

<style scoped>
.schedule-menu-item {
  display: flex;
  min-height: 2.5rem;
  width: 100%;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.25rem;
}

.schedule-menu-icon {
  display: inline-flex;
  height: 1.25rem;
  width: 1.25rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
}
</style>
