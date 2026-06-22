<script setup>
import { computed, ref, useAttrs, watch } from "vue";
import ButtonComponent from "@/components/dev/button/ButtonComponent.vue";

const emit = defineEmits(["click", "tooltip-select"]);
const attrs = useAttrs();

const props = defineProps({
  text: {
    type: String,
    required: true,
  },
  variant: {
    type: String,
    default: "polygonLeft",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  softDisabled: {
    type: Boolean,
    default: false,
  },
  tooltipText: {
    type: String,
    default: "",
  },
  tooltipItems: {
    type: Array,
    default: () => [],
  },
  customClass: {
    type: String,
    default: "",
  },
  tooltipClass: {
    type: String,
    default: "",
  },
});

const mergedCustomClass = computed(() => [
  props.customClass,
  props.softDisabled
    ? "booking-validation-soft-disabled !bg-gray-400 !text-gray-200 hover:!bg-gray-400 hover:!text-gray-200 cursor-not-allowed"
    : "",
].filter(Boolean).join(" "));

const forwardedAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

const normalizedTooltipItems = computed(() => {
  if (Array.isArray(props.tooltipItems) && props.tooltipItems.length > 0) {
    return props.tooltipItems
      .map((item, index) => ({
        id: item?.id || `${item?.field || "validation"}-${index}`,
        field: String(item?.field || ""),
        label: String(item?.label || "").trim(),
      }))
      .filter((item) => item.label);
  }

  return String(props.tooltipText || "")
    .split("\n")
    .map((label, index) => ({
      id: `validation-${index}`,
      field: "",
      label: label.trim(),
    }))
    .filter((item) => item.label);
});

const hasTooltipContent = computed(() => normalizedTooltipItems.value.length > 0);
const tooltipDismissed = ref(false);

const shouldShowTooltip = computed(() => (
  props.softDisabled && hasTooltipContent.value && !tooltipDismissed.value
));

function resetTooltipDismissal() {
  tooltipDismissed.value = false;
}

function handleClick(event) {
  resetTooltipDismissal();
  emit("click", event);
}

function handleTooltipSelect(item, event) {
  event.stopPropagation();
  tooltipDismissed.value = true;
  event.currentTarget?.blur?.();
  emit("tooltip-select", item);
}

watch(
  () => [props.softDisabled, normalizedTooltipItems.value.map((item) => item.id).join("|")],
  resetTooltipDismissal,
);
</script>

<template>
  <div
    :class="['relative inline-flex group/booking-validation-action', attrs.class]"
    :aria-disabled="softDisabled || disabled ? 'true' : 'false'"
    :data-booking-soft-disabled="softDisabled ? 'true' : 'false'"
    @mouseenter="resetTooltipDismissal"
    @mouseleave="resetTooltipDismissal"
  >
    <ButtonComponent
      :key="softDisabled ? 'soft-disabled' : 'enabled'"
      v-bind="forwardedAttrs"
      :text="text"
      :variant="variant"
      :disabled="disabled"
      :customClass="mergedCustomClass"
      @click="handleClick"
    />
    <div
      v-if="shouldShowTooltip"
      :class="[
        'pointer-events-none absolute bottom-full right-0 z-50 mb-3 min-w-[16rem] max-w-[22rem] rounded-lg bg-[#555C68] px-4 py-2.5 text-left text-white opacity-0 shadow-xl transition-opacity duration-200 group-hover/booking-validation-action:pointer-events-auto group-hover/booking-validation-action:opacity-100 group-focus-within/booking-validation-action:pointer-events-auto group-focus-within/booking-validation-action:opacity-100',
        tooltipClass,
      ]"
      data-booking-validation-tooltip="true"
    >
      <div aria-hidden="true" class="absolute bottom-[-0.75rem] left-0 h-3 w-full" />
      <button
        v-for="item in normalizedTooltipItems"
        :key="item.id"
        type="button"
        class="flex w-full items-center justify-between gap-4 py-1 text-left text-sm font-medium leading-5 text-white hover:text-[#07F468] focus:outline-none focus-visible:text-[#07F468]"
        :data-booking-validation-tooltip-field="item.field || undefined"
        @click="handleTooltipSelect(item, $event)"
      >
        <span class="min-w-0 truncate">{{ item.label }}</span>
        <span aria-hidden="true" class="shrink-0 text-lg leading-none">&nearr;</span>
      </button>
      <div class="absolute bottom-[-0.55rem] right-[3.5rem] h-4 w-4 translate-x-1/2 rotate-45 bg-[#555C68]" />
    </div>
  </div>
</template>

<style scoped>
:deep(.booking-validation-soft-disabled img) {
  filter: grayscale(1) brightness(0) invert(1) opacity(0.65) !important;
}
</style>
