<script setup>
import { onMounted, ref } from "vue";
import DashboardWrapperTwoColContainer from "@/components/dashboard/DashboardWrapperTwoColContainer.vue";
import { createStepStateEngine } from "@/utils/stateEngine.js"; // Adjust path if needed

// Import Steps
import GroupBookingStep1 from "./GroupBookingStep1.vue";
import GroupBookingStep2 from "./GroupBookingStep2.vue";

// Initialize State Engine
const bookingFlow = createStepStateEngine({
  flowId: 'booking-schedule-flow',
  initialStep: 1,
  urlSync: 'none', // Changed to none to avoid URL clutter for this modal/form
  defaults: {
    // Shared state data can go here if needed
    duration: "",
    eventTitle: ""
  }
});

// Sync engine with component to make it reactive for the template
const currentStep = ref(1);

onMounted(() => {
  bookingFlow.initialize();
  
  // Listen to engine changes to update UI
  bookingFlow.on('step:changed', ({ next }) => {
    currentStep.value = next;
  });
});
</script>

<template>
  <DashboardWrapperTwoColContainer>
    <div class="flex flex-col gap-6  relative w-full md:w-[550px] bg-white/50 shadow-[0px_4px_6px_-2px_rgba(16,24,40,0.03)] backdrop-blur-xl">
      
      <div class="px-6 pt-6 pb-2 bg-white/20 flex justify-between items-center">
        <div class="justify-start text-slate-700 text-base font-semibold leading-6">
          Group Event
        </div>
        <div class="w-2.5 h-2.5 relative overflow-hidden">
          <img src="https://i.ibb.co/G4Y3BB6c/Icon.png" alt="" />
        </div>
      </div>

      <div class="w-full ">
        <GroupBookingStep1 
          v-if="currentStep === 1" 
          :engine="bookingFlow" 
        />

        <GroupBookingStep2 
          v-if="currentStep === 2" 
          :engine="bookingFlow" 
        />
      </div>

    </div>
  </DashboardWrapperTwoColContainer>
</template>