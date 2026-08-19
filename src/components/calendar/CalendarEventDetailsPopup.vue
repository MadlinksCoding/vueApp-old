<template>
  <BookingDetailsPopup
    v-bind="$attrs"
    @update:model-value="emit('update:modelValue', $event)"
    @close="emit('close', $event)"
    @join-call="emit('join-call', $event)"
    @open-chat="emit('open-chat', $event)"
    @cancel-booking="emit('cancel-booking', $event)"
    @accept-adjustment="emit('accept-adjustment', $event)"
    @decline-adjustment="emit('decline-adjustment', $event)"
    @approve-booking="emit('approve-booking', $event)"
    @reject-booking="emit('reject-booking', $event)"
    @adjust-booking="emit('adjust-booking', $event)"
    @decision-visibility="emit('decision-visibility', $event)"
  />
</template>

<script setup>
import BookingDetailsPopup from '@/components/ui/popup/BookingDetailsPopup.vue';

defineOptions({ inheritAttrs: false });
const emit = defineEmits([
  'update:modelValue', 'close', 'join-call', 'open-chat', 'cancel-booking',
  'accept-adjustment', 'decline-adjustment', 'approve-booking',
  'reject-booking', 'adjust-booking', 'decision-visibility',
]);
</script>
