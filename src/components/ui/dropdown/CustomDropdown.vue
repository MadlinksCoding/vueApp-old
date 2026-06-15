<script setup>
import { computed, nextTick, ref, onMounted, onUnmounted, watch } from 'vue';

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
  disabled: { type: Boolean, default: false },
  layout: { type: String, default: 'list' }, // 'list' or 'grid'
  optionFactory: { type: Function, default: null },
});

const emit = defineEmits(['update:modelValue', 'change']);
const isOpen = ref(false);
const dropdownRef = ref(null);
const searchInputRef = ref(null);
const searchQuery = ref('');
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024);

const updateWidth = () => {
  windowWidth.value = window.innerWidth;
};

const baseOptions = computed(() => (Array.isArray(props.options) ? props.options : []));

const dropdownOptions = computed(() => {
  if (isOpen.value && typeof props.optionFactory === 'function') {
    const options = props.optionFactory();
    return Array.isArray(options) ? options : [];
  }

  return baseOptions.value;
});

const selectedOption = computed(() => baseOptions.value.find((option) => option.value === props.modelValue));

const filteredOptions = computed(() => {
  if (!props.searchable) return dropdownOptions.value;

  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return dropdownOptions.value;

  return dropdownOptions.value.filter((option) => {
    const label = String(option?.label ?? '').toLowerCase();
    const value = String(option?.value ?? '').toLowerCase();
    return label.includes(query) || value.includes(query);
  });
});

const clearSearch = () => {
  searchQuery.value = '';
};

const toggleDropdown = () => {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    clearSearch();
    if (props.searchable) nextTick(() => searchInputRef.value?.focus());
  } else {
    clearSearch();
  }
};

const selectOption = (option) => {
  if (props.disabled) return;
  if (option?.disabled) return;
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

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('resize', updateWidth);
});
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('resize', updateWidth);
  document.body.classList.remove('overflow-hidden');
});

// Lock body scroll when open on mobile
watch(isOpen, (val) => {
  if (val && window.innerWidth < 768) {
    document.body.classList.add('overflow-hidden');
  } else {
    document.body.classList.remove('overflow-hidden');
  }
});
</script>

<template>
  <div class="relative w-full h-full" ref="dropdownRef">
    <!-- Trigger Button -->
    <div 
      :class="[
        'flex items-center justify-between cursor-pointer select-none',
        buttonClass,
        disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
      ]"
      :aria-disabled="disabled ? 'true' : 'false'"
      @click="toggleDropdown"
    >
      <slot name="trigger" :selected="modelValue" :isOpen="isOpen">
        <div class="flex items-center gap-2">
          <img v-if="selectedOption?.image" :src="selectedOption.image" class="w-5 h-5 object-contain" />
          <component v-else-if="selectedOption?.icon" :is="selectedOption.icon" class="w-5 h-5 text-slate-700" />
          <div v-if="selectedOption?.color || selectedOption?.value?.toString().startsWith('#')" class="w-5 h-5 rounded-full" :style="{ backgroundColor: selectedOption.color || selectedOption.value }"></div>
          <span class="text-slate-900 whitespace-nowrap">{{ multiple && modelValue.length > 0 ? `${modelValue.length} items selected` : (selectedOption?.label || placeholder) }}</span>
        </div>
      </slot>
      
      <img src="@/assets/images/icons/chevron-down-gray.webp" alt="" :class="{'rotate-180': isOpen}" class="w-5 h-5 text-slate-500 transition-transform" />
    </div>
    
    <!-- Use Teleport for mobile to avoid clipping issues -->
    <Teleport to="body" :disabled="windowWidth >= 768">
      <!-- Backdrop for Mobile -->
      <transition name="fade">
        <div 
          v-if="isOpen && windowWidth < 768" 
          class="fixed inset-0 z-[10049] backdrop-blur-[2px]"
          @click="isOpen = false"
        ></div>
      </transition>

      <!-- Dropdown Options Panel -->
      <transition :name="windowWidth < 768 ? 'slide-up' : 'fade'">
        <div 
          v-if="isOpen"
          :class="[
            'z-[10050] bg-white shadow-xl flex flex-col',
            windowWidth < 768 
              ? 'fixed bottom-0 left-0 right-0 w-full rounded-t-xl max-h-[60vh]' // Mobile Styles
              : 'absolute mt-1 rounded-sm max-h-60', // Desktop Backwards Compatibility (if not disabled)
            dropdownClass
          ]"
          :style="windowWidth >= 768 ? { top: '100%' } : {}"
        >
        <!-- Mobile Handle/Header (Only for color dropdown/grid layout) -->
        <div v-if="layout === 'grid'" class="flex items-center justify-between px-4 py-3 border-b border-gray-100 md:hidden">
          <span class="text-sm font-semibold text-gray-700">{{ placeholder }}</span>
          <button 
            type="button" 
            class="text-gray-400 hover:text-gray-600 transition-colors"
            @click="isOpen = false"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

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
            class="w-full bg-white px-4 py-3 md:py-2 text-base md:text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 border-b border-gray-200 focus:border-gray-300"
            @keydown.stop
          />
        </div>
        <div
          v-if="filteredOptions.length === 0"
          class="p-6 md:p-3 text-center md:text-left text-sm text-gray-500"
        >
          No options found
        </div>
        <div 
          :class="[
            'flex-1 min-h-0', 
            layout === 'grid' ? 'p-4 overflow-x-auto overflow-y-auto' : 'overflow-y-auto'
          ]"
        >
          <div 
            :class="[
              layout === 'grid' ? 'flex flex-nowrap md:flex-wrap gap-4 min-w-max md:min-w-0 justify-start md:justify-center' : 'flex flex-col'
            ]"
          >
            <div 
              v-for="option in filteredOptions" 
              :key="option.value"
              @click="selectOption(option)"
              :aria-disabled="option.disabled ? 'true' : 'false'"
              :title="option.disabled ? option.disabledReason || option.label : undefined"
              :class="[
                'transition-colors',
                option.disabled
                  ? 'cursor-not-allowed opacity-45'
                  : 'cursor-pointer',
                !option.disabled && (layout === 'grid' ? 'hover:scale-110 active:scale-95' : 'hover:bg-[#EAECF0]')
              ]"
            >
              <slot name="option" :option="option" :isSelected="multiple ? (Array.isArray(modelValue) ? modelValue.includes(option.value) : false) : modelValue === option.value">
                <div :class="[
                  optionClass, 
                  'flex items-center',
                  layout === 'grid' ? 'p-0' : 'gap-3 md:gap-2 px-4 py-4 md:px-3 md:py-3'
                ]">
                  <div v-if="hasCheckboxes && layout !== 'grid'" class="flex items-center justify-center w-5 h-5 md:w-4 md:h-4 rounded-sm border" :class="(multiple ? (Array.isArray(modelValue) ? modelValue.includes(option.value) : false) : modelValue === option.value) ? 'bg-[#00e676] border-[#00e676]' : 'border-gray-300 bg-white'">
                    <svg v-if="(multiple ? (Array.isArray(modelValue) ? modelValue.includes(option.value) : false) : modelValue === option.value)" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M10 3L4.5 8.5L2 6" stroke="#0C111D" stroke-width="1.6666" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <img v-if="option.image" :src="option.image" class="w-6 h-6 md:w-5 md:h-5 object-contain" />
                  <component v-else-if="option.icon" :is="option.icon" class="w-6 h-6 md:w-5 md:h-5 text-slate-700" />
                  <div v-if="option.color || option.value?.toString().startsWith('#')" :class="[
                    'rounded-full shadow-sm transition-all',
                    layout === 'grid' ? 'w-8 h-8 md:w-4 md:h-4 border-2 border-transparent' : 'w-6 h-6 md:w-5 md:h-5 border-transparent',
                  ]" :style="{ backgroundColor: option.color || option.value }"></div>
                  <span v-if="layout !== 'grid'" class="text-gray-950 text-base md:text-sm ml-2">{{ option.label }}</span>
                </div>
              </slot>
            </div>
          </div>
        </div>
        
        <!-- Mobile Done Button for Multiple -->
        <div v-if="multiple && isOpen" class="p-4 border-t border-gray-100 md:hidden bg-white">
          <button 
            type="button"
            class="w-full bg-[#5549FF] text-white py-3 rounded-lg font-semibold shadow-md active:scale-95 transition-all"
            @click="isOpen = false"
          >
            Done
          </button>
        </div>
      </div>
    </transition>
    </Teleport>
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

/* Slide up animation for mobile */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
