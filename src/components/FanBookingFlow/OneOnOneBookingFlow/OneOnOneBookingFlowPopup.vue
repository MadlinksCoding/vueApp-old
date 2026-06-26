<script setup>
import PopupHandler from "@/components/ui/popup/PopupHandler.vue";
import OneOnOneBookingFlowFeature from "./OneOnOneBookingFlowFeature.vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  creatorId: { type: [Number, String], default: null },
  fanId: { type: [Number, String], default: null },
  eventId: { type: [String, Number], default: null },
  inviteSecret: { type: String, default: "" },
  apiBaseUrl: { type: String, default: "" },
  creatorData: { type: Object, default: null },
  previewMode: { type: Boolean, default: false },
  previewEvent: { type: Object, default: null },
  previewBookedSlots: { type: Array, default: () => [] },
  previewStartStep: { type: Number, default: 1 },
  previewReadOnly: { type: Boolean, default: false },
  step1PrimaryAction: {
    type: String,
    default: "book",
    validator: (value) => ["book", "edit-schedule"].includes(value),
  },
});

const emit = defineEmits(["update:modelValue", "booking-created", "booking-failed", "edit-schedule"]);

const oneOnOneBookingFlowPopupConfig = {
  actionType: "popup",
  position: { default: "center", "<1009px": "top-center" },
  customEffect: "scale",
  offset: "0px",
  speed: "250ms",
  effect: "ease-in-out",
  showOverlay: false,
  closeOnOutside: true,
  lockScroll: false,
  escToClose: true,
  width: { default: "auto", "<1009px": "100%" },
  height: { default: "auto" },
  scrollable: true,
  closeSpeed: "250ms",
  closeEffect: "cubic-bezier(0.4, 0, 0.2, 1)",
};
</script>

<template>
  <PopupHandler
    :modelValue="modelValue"
    @update:modelValue="(val) => emit('update:modelValue', val)"
    :config="oneOnOneBookingFlowPopupConfig"
  >
    <OneOnOneBookingFlowFeature
      v-if="modelValue"
      :creator-id="creatorId"
      :fan-id="fanId"
      :event-id="eventId"
      :invite-secret="inviteSecret"
      :api-base-url="apiBaseUrl"
      :creator-data="creatorData"
      :preview-mode="previewMode"
      :preview-event="previewEvent"
      :preview-booked-slots="previewBookedSlots"
      :preview-start-step="previewStartStep"
      :preview-read-only="previewReadOnly"
      :step1-primary-action="step1PrimaryAction"
      @close-request="emit('update:modelValue', false)"
      @booking-created="emit('booking-created', $event)"
      @booking-failed="emit('booking-failed', $event)"
      @edit-schedule="emit('edit-schedule', $event)"
    />
  </PopupHandler>
</template>
