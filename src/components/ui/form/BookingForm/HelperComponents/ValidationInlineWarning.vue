<script setup>
import { computed } from "vue";

const props = defineProps({
  messages: {
    type: [Array, String],
    default: () => [],
  },
  field: {
    type: String,
    default: "",
  },
  spacingClass: {
    type: String,
    default: "mt-1.5",
  },
});

const normalizedMessages = computed(() => {
  const list = Array.isArray(props.messages) ? props.messages : [props.messages];
  const seen = new Set();
  return list
    .flatMap((message) => String(message || "").split("\n"))
    .map((message) => message.trim())
    .filter((message) => {
      if (!message || seen.has(message)) return false;
      seen.add(message);
      return true;
    });
});
</script>

<template>
  <div
    v-if="normalizedMessages.length"
    :class="[
      spacingClass,
      'w-full border-l-4 border-[#FDB022] bg-[#FFFAEB] px-3 py-3 text-sm font-semibold leading-5 text-[#C4320A]',
    ]"
    data-booking-validation-warning="true"
    :data-booking-validation-field="field || undefined"
  >
    <p v-for="message in normalizedMessages" :key="message">
      {{ message }}
    </p>
  </div>
</template>
