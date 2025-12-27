<template>
  <div class="border-b border-transparent">
    <!-- Header -->
    <div
      class="flex justify-between items-center cursor-pointer"
       :class="toggleable ? 'cursor-pointer' : 'cursor-default'"
      @click="handleClick"
    >
      <div class="flex items-center gap-2">
        <div class="flex justify-center items-center w-5 h-5">
          <img :src="icon" alt="section-icon" class="w-5 h-5 [filter:brightness(0)_saturate(100%)_invert(98%)_sepia(1%)_saturate(934%)_hue-rotate(29deg)_brightness(120%)_contrast(100%)]" />
        </div>

        <h3 class="text-base font-semibold text-[#F9FAFB] dark:text-[#e5e3df]">
          {{ title }}
        </h3>
      </div>

      <div
       v-if="showChevron"
      class="flex justify-center items-center w-6 h-6">
        <img
          src="https://i.ibb.co.com/qLW7tf3T/Arrows.webp"
          alt="chevron"
          class="transition-transform duration-300"
          :class="isOpen ? 'rotate-180' : 'rotate-0'"
        />
      </div>
    </div>

    <!-- Dropdown Content -->
    <div v-if="isOpen" class="mt-3">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
  showChevron: {
    type: Boolean,
    default: true, // ✅ default show
  },
  toggleable: {
    type: Boolean,
    default: true, // ✅ default behavior unchanged
  },
});

const emit = defineEmits(["update:modelValue"]);

const isOpen = computed(() => props.modelValue);

const handleClick = () => {
  if (!props.toggleable) return; // 🚫 toggle disabled
  emit("update:modelValue", !props.modelValue);
};
</script>
