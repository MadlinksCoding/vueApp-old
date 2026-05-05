<script setup>
import { computed, nextTick, ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  modelValue: { type: [String, Array, Object, Number], default: null },
  options: { type: Array, required: true },
  placeholder: { type: String, default: 'Select an option' },
  multiple: { type: Boolean, default: false },
  buttonClass: { type: String, default: 'w-full bg-white/75 px-4 py-2 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 outline-none text-slate-700 text-base' },
  dropdownClass: { type: String, default: 'w-full bg-white shadow-lg overflow-y-auto max-h-60 border border-gray-100' },
  optionClass: { type: String, default: 'p-3 text-gray-700' },
  hasCheckboxes: { type: Boolean, default: false },
  searchable: { type: Boolean, default: false },
  searchPlaceholder: { type: String, default: 'Search...' },
});

const emit = defineEmits(['update:modelValue', 'change']);
const isOpen = ref(false);
const dropdownRef = ref(null);
const searchInputRef = ref(null);
const searchQuery = ref('');

const filteredOptions = computed(() => {
  if (!props.searchable) return props.options;

  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return props.options;

  return props.options.filter((option) => {
    const label = String(option?.label ?? '').toLowerCase();
    const value = String(option?.value ?? '').toLowerCase();
    return label.includes(query) || value.includes(query);
  });
});

const clearSearch = () => {
  searchQuery.value = '';
};

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    clearSearch();
    if (props.searchable) nextTick(() => searchInputRef.value?.focus());
  } else {
    clearSearch();
  }
};

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
    clearSearch();
  }
};

// Handle Click Outside
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false;
    clearSearch();
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
          <span class="text-slate-900 whitespace-nowrap">{{ multiple && modelValue.length > 0 ? `${modelValue.length} items selected` : (options.find(o => o.value === modelValue)?.label || placeholder) }}</span>
        </div>
      </slot>
      
      <img src="@/assets/images/icons/chevron-down-gray.webp" alt="" :class="{'rotate-180': isOpen}" class="w-5 h-5 text-slate-500 transition-transform" />
    </div>

    <!-- Dropdown Options Panel -->
    <transition name="fade">
      <div 
        v-if="isOpen"
        :class="['absolute z-50 mt-1', dropdownClass]"
      >
        <div
          v-if="searchable"
          class="sticky top-0 z-10 bg-white p-1"
          @click.stop
        >
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="search"
            :placeholder="searchPlaceholder"
            class="w-full bg-white px-2 py-2 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 border-b border-gray-200 focus:border-gray-300"
            @keydown.stop
          />
        </div>
        <div
          v-if="filteredOptions.length === 0"
          class="p-3 text-sm text-gray-500"
        >
          No options found
        </div>
        <div 
          v-for="option in filteredOptions" 
          :key="option.value"
          @click="selectOption(option)"
          class="cursor-pointer hover:bg-[#EAECF0] transition-colors"
        >
          <slot name="option" :option="option" :isSelected="multiple ? modelValue.includes(option.value) : modelValue === option.value">
            <div :class="[optionClass, 'flex items-center gap-2']">
              <div v-if="hasCheckboxes" class="flex items-center justify-center w-4 h-4 rounded-sm border" :class="(multiple ? modelValue.includes(option.value) : modelValue === option.value) ? 'bg-[#00e676] border-[#00e676]' : 'border-gray-300 bg-white'">
                <svg v-if="(multiple ? modelValue.includes(option.value) : modelValue === option.value)" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M10 3L4.5 8.5L2 6" stroke="#0C111D" stroke-width="1.6666" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <img v-if="option.image" :src="option.image" class="w-5 h-5 object-contain" />
              <component v-else-if="option.icon" :is="option.icon" class="w-5 h-5 text-slate-700" />
              <div v-if="option.color" class="w-6 h-6 rounded-full shadow-sm" :style="{ backgroundColor: option.color }"></div>
              <span class="text-gray-950">{{ option.label }}</span>
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
