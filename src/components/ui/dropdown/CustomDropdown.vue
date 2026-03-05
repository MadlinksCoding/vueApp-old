<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  modelValue: { type: [String, Array, Object, Number], default: null },
  options: { type: Array, required: true },
  placeholder: { type: String, default: 'Select an option' },
  multiple: { type: Boolean, default: false },
  buttonClass: { type: String, default: 'w-full bg-white/75 px-4 py-2 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 outline-none text-slate-700 text-base' },
  dropdownClass: { type: String, default: 'w-full bg-white shadow-lg overflow-y-auto max-h-60 border border-gray-100' },
  optionClass: { type: String, default: 'p-3 text-gray-700' },
  hasCheckboxes: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'change']);
const isOpen = ref(false);
const dropdownRef = ref(null);

const toggleDropdown = () => (isOpen.value = !isOpen.value);

const selectOption = (option) => {
  if (props.multiple) {
    const currentValues = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    const index = currentValues.indexOf(option.value);
    if (index === -1) currentValues.push(option.value);
    else currentValues.splice(index, 1);
    
    emit('update:modelValue', currentValues);
    emit('change', currentValues);
  } else {
    emit('update:modelValue', option.value);
    emit('change', option.value);
    isOpen.value = false;
  }
};

// Handle Click Outside
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false;
  }
};

onMounted(() => document.addEventListener('click', handleClickOutside));
onUnmounted(() => document.removeEventListener('click', handleClickOutside));
</script>

<template>
  <div class="relative w-full h-full" ref="dropdownRef">
    <!-- Trigger Button -->
    <div 
      :class="['flex items-center justify-between cursor-pointer select-none', buttonClass]"
      @click="toggleDropdown"
    >
      <slot name="trigger" :selected="modelValue" :isOpen="isOpen">
        <div class="flex items-center gap-2">
          <img v-if="options.find(o => o.value === modelValue)?.image" :src="options.find(o => o.value === modelValue)?.image" class="w-5 h-5 object-contain" />
          <component v-else-if="options.find(o => o.value === modelValue)?.icon" :is="options.find(o => o.value === modelValue)?.icon" class="w-5 h-5 text-slate-700" />
          <div v-if="options.find(o => o.value === modelValue)?.color" class="w-5 h-5 rounded-full" :style="{ backgroundColor: options.find(o => o.value === modelValue)?.color }"></div>
          <span class="text-slate-900">{{ multiple && modelValue.length > 0 ? `${modelValue.length} items selected` : (options.find(o => o.value === modelValue)?.label || placeholder) }}</span>
        </div>
      </slot>
      
      <img src="@/assets/images/icons/chevron-down-gray.webp" alt="" :class="{'rotate-180': isOpen}" class="w-5 h-5 text-slate-500 transition-transform ml-2" />
    </div>

    <!-- Dropdown Options Panel -->
    <transition name="fade">
      <div 
        v-if="isOpen"
        :class="['absolute z-50 mt-1', dropdownClass]"
      >
        <div 
          v-for="option in options" 
          :key="option.value"
          @click="selectOption(option)"
          class="cursor-pointer hover:bg-[#EAECF0] transition-colors"
        >
          <slot name="option" :option="option" :isSelected="multiple ? modelValue.includes(option.value) : modelValue === option.value">
            <div :class="[optionClass, 'flex items-center gap-3']">
              <div v-if="hasCheckboxes" class="flex items-center justify-center w-4 h-4 rounded-sm border" :class="(multiple ? modelValue.includes(option.value) : modelValue === option.value) ? 'bg-[#00e676] border-[#00e676]' : 'border-gray-300 bg-white'">
                <svg v-if="(multiple ? modelValue.includes(option.value) : modelValue === option.value)" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <img v-if="option.image" :src="option.image" class="w-5 h-5 object-contain" />
              <component v-else-if="option.icon" :is="option.icon" class="w-5 h-5 text-slate-700" />
              <div v-if="option.color" class="w-6 h-6 rounded-full shadow-sm" :style="{ backgroundColor: option.color }"></div>
              <span class="text-slate-700">{{ option.label }}</span>
            </div>
          </slot>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
