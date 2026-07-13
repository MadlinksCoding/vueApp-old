<template>
  <div
    :class="[
      'absolute min-h-[0.375rem] w-full overflow-hidden px-2 py-1 text-xs font-medium leading-4',
      isDraft ? 'pointer-events-none' : 'cursor-pointer',
    ]"
    :style="[style, presentationStyle]"
    :title="event.title"
    :role="isDraft ? undefined : 'button'"
    :tabindex="isDraft ? undefined : 0"
    :data-test="isDraft ? 'calendar-draft-availability-block' : 'calendar-existing-availability-block'"
    @click.stop="activate"
    @keydown.enter.prevent.stop="activate"
    @keydown.space.prevent.stop="activate"
  >
    <span
      v-if="event.title && !event.hideAvailabilityTitle"
      class="flex min-w-0 items-center gap-1 overflow-hidden"
    >
      <BookingScheduleIcon class="h-3 w-3 shrink-0" color="currentColor" />
      <span class="min-w-0 truncate" data-test="calendar-availability-title">{{ event.title }}</span>
    </span>
  </div>
</template>

<script setup>
import { computed } from "vue";
import BookingScheduleIcon from "@/components/icons/BookingScheduleIcon.vue";

const DEFAULT_EVENT_COLOR = "#5549FF";

const props = defineProps({
  event: { type: Object, required: true },
  style: { type: [String, Object, Array], default: "" },
});

const emit = defineEmits(["activate"]);

const isDraft = computed(() => props.event?.isDraftPreview === true);

const rgba = (hex, alpha) => {
  const normalized = typeof hex === "string" && /^#([0-9a-fA-F]{3}){1,2}$/.test(hex.trim())
    ? hex.trim().slice(1)
    : DEFAULT_EVENT_COLOR.slice(1);
  const full = normalized.length === 3
    ? normalized.split("").map((character) => character + character).join("")
    : normalized;
  const number = Number.parseInt(full, 16);
  return `rgba(${(number >> 16) & 255}, ${(number >> 8) & 255}, ${number & 255}, ${alpha})`;
};

const presentationStyle = computed(() => {
  const color = props.event?.color
    || props.event?.eventColorSkin
    || props.event?.raw?.eventColorSkin
    || DEFAULT_EVENT_COLOR;
  const start = new Date(props.event?.start);
  const end = new Date(props.event?.end);
  const startsAtMidnight = !Number.isNaN(start.getTime()) && start.getHours() === 0 && start.getMinutes() === 0;
  const endsAtMidnight = !Number.isNaN(end.getTime()) && end.getHours() === 0 && end.getMinutes() === 0;

  if (isDraft.value) {
    return {
      borderTop: startsAtMidnight ? "0" : `1px solid ${color}`,
      borderBottom: endsAtMidnight ? "0" : `1px solid ${color}`,
      color,
      background: `repeating-linear-gradient(-45deg, ${rgba(color, 0.24)}, ${rgba(color, 0.24)} 2px, ${rgba(color, 0.14)} 3px, ${rgba(color, 0.14)} 10px)`,
      zIndex: 3,
    };
  }

  return {
    backgroundColor: rgba(color, 0.08),
    borderTop: startsAtMidnight ? "0" : `1px solid ${color}`,
    borderBottom: endsAtMidnight ? "0" : `1px solid ${color}`,
    borderRadius: "0",
    color,
    zIndex: 1,
  };
});

function activate(event) {
  if (isDraft.value) return;
  emit("activate", props.event, event);
}
</script>
