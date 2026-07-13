<template>
  <div
    :class="blockClasses"
    :style="[style, presentationStyle]"
    :title="event.title"
    data-test="calendar-week-booking-block"
    tabindex="0"
    @click.stop="emit('activate', event)"
    @keydown.enter.prevent.stop="emit('activate', event)"
    @keydown.space.prevent.stop="emit('activate', event)"
  >
    <div class="flex min-w-0 w-full items-center gap-1 overflow-hidden px-1 py-[0.125rem] font-medium">
      <component
        :is="eventIcon"
        class="h-3 w-3 shrink-0"
        color="currentColor"
        :data-booking-icon-type="isGroupEvent ? 'group' : 'private'"
      />
      <span class="min-w-0 truncate">{{ event.title }}</span>
    </div>
    <div class="flex min-w-0 items-center gap-1 px-1 py-[0.125rem] text-[0.625rem] opacity-90">
      <span class="shrink-0" :data-booking-status-icon="indicatorStatus">
        <PendingStatus :status="indicatorStatus" />
      </span>
      <span class="min-w-0 truncate">{{ hhmm(event.start) }} - {{ hhmm(event.end) }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { hhmm } from "@/utils/calendarHelpers.js";
import GroupCallIcon from "@/components/icons/GroupCallIcon.vue";
import PendingStatus from "@/components/icons/PendingStatus.vue";
import PhoneIcon from "@/components/icons/PhoneIcon.vue";

const DEFAULT_EVENT_COLOR = "#5549FF";
const APPROVED_STATUSES = new Set(["approved", "completed", "confirmed"]);

const props = defineProps({
  event: { type: Object, required: true },
  style: { type: [String, Object, Array], default: "" },
});

const emit = defineEmits(["activate"]);

const normalizeColor = (value) => (
  typeof value === "string" && /^#([0-9a-fA-F]{3}){1,2}$/.test(value.trim())
    ? value.trim()
    : DEFAULT_EVENT_COLOR
);

const status = computed(() => String(
  props.event?.status || props.event?.raw?.status || props.event?.raw?.bookingStatus || "",
).toLowerCase());

const isGroupEvent = computed(() => String(
  props.event?.type
    || props.event?.eventType
    || props.event?.raw?.eventType
    || props.event?.raw?.type
    || props.event?.raw?.eventCurrent?.type
    || props.event?.raw?.eventSnapshot?.type
    || "",
).toLowerCase().includes("group"));

const eventIcon = computed(() => (isGroupEvent.value ? GroupCallIcon : PhoneIcon));

const indicatorStatus = computed(() => {
  if (status.value.includes("pending")) return "pending";
  if (["cancel", "declin", "reject"].some((value) => status.value.includes(value))) return "declined";
  return "confirmed";
});

const isPast = computed(() => {
  const end = new Date(props.event?.end);
  return !Number.isNaN(end.getTime()) && end.getTime() < Date.now();
});

const presentationStyle = computed(() => {
  const color = normalizeColor(
    props.event?.color || props.event?.eventColorSkin || props.event?.raw?.eventColorSkin,
  );

  if (isPast.value) {
    return {
      backgroundColor: "#D9DCE6",
      border: "1px solid #C8CDD8",
      color: "#98A2B3",
      boxShadow: "none",
      zIndex: 2,
    };
  }

  if (!APPROVED_STATUSES.has(status.value)) {
    return {
      backgroundColor: "transparent",
      border: `1px solid ${color}`,
      color,
      zIndex: 2,
    };
  }

  return {
    backgroundColor: color,
    border: `1px solid ${color}`,
    color: "#ffffff",
    zIndex: 2,
  };
});

const blockClasses = computed(() => [
  "absolute min-h-[1.25rem] w-full cursor-pointer overflow-hidden text-xs",
  props.event?.slot === "event" ? "rounded-[0.375rem]" : "rounded-lg shadow-md",
]);
</script>
