<script setup>
import { computed } from "vue";

const props = defineProps({
  holderName: { type: String, default: "" },
  cardNumber: { type: String, default: "" },
  expiry: { type: String, default: "" },
});

// Parent ko signal bhejne ke liye
const emit = defineEmits(["remove"]);

// Last 4 digits logic
const maskedNumber = computed(() => {
  if (!props.cardNumber || props.cardNumber.length < 4) return "****0000";
  return "****" + props.cardNumber.slice(-4);
});
</script>

<template>
  <div class="flex items-center gap-6 bg-black/25 rounded-md px-4 py-2 border border-[#EAECF080]">
    <div class="flex justify-between items-center gap-2 py-2 w-full">
      <div class="flex items-center gap-2 flex-grow">
        <div class="flex items-center gap-2 flex-grow">
          <span class="text-base font-medium truncate whitespace-nowrap text-white flex-grow max-w-[100px] sm:max-w-none">
            {{ holderName || "No Name" }}
          </span>
          <span class="text-base font-medium whitespace-nowrap text-white flex-grow">
            {{ maskedNumber }}
          </span>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs leading-normal whitespace-nowrap text-white">
            EXP {{ expiry || "MM/YY" }}
          </span>
          <img src="https://i.ibb.co.com/pr2VM4zR/svgviewer-png-output-32.png" alt="visa-logo" class="h-3" />
        </div>
      </div>

      <img
        src="https://i.ibb.co.com/3YVrnBJz/trash-bin.webp"
        alt="delete"
        @click="$emit('remove')" 
        class="w-[1.125rem] [filter:brightness(0)_saturate(100%)_invert(98%)_sepia(2%)_saturate(335%)_hue-rotate(184deg)_brightness(97%)_contrast(95%)] cursor-pointer hover:opacity-80"
      />
    </div>
  </div>
</template>