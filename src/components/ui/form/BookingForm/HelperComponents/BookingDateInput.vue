<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import VueDatePicker from '@/components/ui/date-picker/VueDatePicker.vue';
const props = defineProps({ modelValue: String, min: String, max: String, disabled: Boolean, align: { type: String, default: 'left' }, blockedDates: { type: Array, default: () => [] } });
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
  <div ref="root" class="relative block w-full" @keydown.esc="open = false">
    <button type="button" class="flex items-center w-full h-10 pl-10 pr-3 bg-white/75 text-left text-gray-900 border-b border-gray-300 rounded-t-sm disabled:cursor-not-allowed" :disabled="disabled" @click="open = !open" :aria-expanded="open">{{ modelValue || '' }}</button>
    <div v-if="open" class="absolute top-full z-[60] w-[220px] [&_.vue-date-picker]:w-full [&_.grid-cols-7_button]:!h-7 [&_.grid-cols-7_button]:!w-7 [&_.vue-date-picker_.p-4]:!p-2 [&_.vue-date-picker_.px-4]:!px-2 [&_.vue-date-picker_.py-3]:!py-2" :class="align === 'right' ? 'right-0' : 'left-0'" data-testid="booking-date-picker">
      <VueDatePicker :model-value="modelValue" :config="{ minDate: min, maxDate: max, blockedDates }" @update:modelValue="choose" />
    </div>
  </div>
</template>
