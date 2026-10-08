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
  purpose: {
    type: String,
    default: "validation",
    validator: (value) => ["validation", "edit-impact", "info"].includes(value),
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
      'w-full border-l-4 px-3 py-3 text-sm font-semibold leading-5',
      purpose === 'info' ? 'flex items-start gap-3 border-[#06AED4] bg-[#ECFDFF] text-[#0096B7]' : 'border-[#FDB022] bg-[#FFFAEB] text-[#C4320A]',
    ]"
    :data-booking-validation-warning="purpose === 'validation' ? 'true' : undefined"
    :data-booking-validation-field="purpose === 'validation' && field ? field : undefined"
    :data-booking-edit-impact-warning="purpose === 'edit-impact' ? 'true' : undefined"
    :data-booking-info-notice="purpose === 'info' ? 'true' : undefined"
  >
    <svg v-if="purpose === 'info'" class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7v1" />
    </svg>
    <div><p v-for="message in normalizedMessages" :key="message">{{ message }}</p></div>
  </div>
</template>
