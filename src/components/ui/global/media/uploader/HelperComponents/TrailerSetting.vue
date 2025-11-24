<script setup>
import CheckboxSwitch from "@/components/dev/checkbox/CheckboxSwitch.vue";

// Props for dynamic text
defineProps({
  labelText: {
    type: String,
    default: "Show Preview Trailer",
  },
  paragraphText: {
    type: String,
    default:
      "Allow non-subscriber to preview your video on your media detail page.",
  },
});
</script>

<template>
  <div>
    <CheckboxSwitch :label="labelText" id="show-preview-toggle" />
    <p class="ml-10 text-[#303437] text-[14px] font-[400]">
      {{ paragraphText }}
    </p>
  </div>
</template>
