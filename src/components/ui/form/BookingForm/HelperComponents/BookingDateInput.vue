<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import VueDatePicker from '@/components/ui/date-picker/VueDatePicker.vue';
const props = defineProps({ modelValue: String, min: String, max: String, disabled: Boolean, blockedDates: { type: Array, default: () => [] } });
const emit = defineEmits(['update:modelValue', 'change']);
const open = ref(false);
const root = ref(null);
function choose(value) {
  if (props.blockedDates.includes(value)) return;
  emit('update:modelValue', value);
  emit('change', value);
  open.value = false;
}
function closeOutside(event) { if (!root.value?.contains(event.target)) open.value = false; }
onMounted(() => document.addEventListener('click', closeOutside));
onBeforeUnmount(() => document.removeEventListener('click', closeOutside));
</script>
<template>
  <div ref="root" class="relative w-full" @keydown.esc="open = false">
    <button type="button" class="w-full h-10 px-3 bg-white/75 text-left text-gray-900 border-b border-gray-300 rounded-t-sm disabled:cursor-not-allowed" :disabled="disabled" @click="open = !open" :aria-expanded="open">{{ modelValue || 'YYYY-MM-DD' }}</button>
    <div v-if="open" class="absolute top-full left-0 z-[60] w-[300px]" data-testid="booking-date-picker">
      <VueDatePicker :model-value="modelValue" :config="{ minDate: min, maxDate: max, blockedDates }" @update:modelValue="choose" />
    </div>
  </div>
</template>
