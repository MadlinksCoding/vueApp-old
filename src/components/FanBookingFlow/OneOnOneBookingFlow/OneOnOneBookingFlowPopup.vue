<script setup>
import { computed, onMounted } from 'vue';
import PopupHandler from '@/components/ui/popup/PopupHandler.vue';
import { createStepStateEngine } from '@/utils/stateEngine';

// Import the step components
import BookingFlowStep1 from './BookingFlowStep1.vue';
import BookingFlowStep2 from './BookingFlowStep2.vue';
import BookingFlowStep3 from './BookingFlowStep3.vue';
import BookingFlowStep4 from './BookingFlowStep4.vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue"]);

// --- State Engine Initialization ---
const engine = createStepStateEngine({
  flowId: 'one-on-one-booking-flow',
  initialStep: 1,
  // urlSync: 'none' rakh raha hun taake popup khulne par URL ganda na ho
  urlSync: 'none' 
});

// Initialize engine on mount
onMounted(() => {
  engine.initialize();
});

// Calculate which component to show based on engine.step
const currentStepComponent = computed(() => {
  switch (engine.step) {
    case 1:
      return BookingFlowStep1;
    case 2:
      return BookingFlowStep2;
    case 3:
      return BookingFlowStep3;
    case 4:
      return BookingFlowStep4;
    default:
      return BookingFlowStep1;
  }
});

// --- Popup Config ---
const oneOnOneBookingFlowPopupConfig = {
  // --- Config Variables ---
  actionType: "popup",
  position: "center",
  customEffect: "scale",
  offset: "0px",
  speed: "250ms",
  effect: "ease-in-out",
  showOverlay: false,
  closeOnOutside: true,
  lockScroll: false,
  escToClose: true,
  width: { default: "auto", "<500px": "90%" },
  height: { default: "90%", "<768": "90%" },
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
    <component 
      :is="currentStepComponent" 
      :engine="engine"
    />

  </PopupHandler>
</template>