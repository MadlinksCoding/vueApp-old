<template>
  <div class="w-full flex items-start bg-[#F9FAFB66] border border-[#D0D5DD] rounded-[0.3125rem] overflow-hidden md:w-max">
    
    <button 
      v-for="tab in tabs" 
      :key="tab.value"
      @click="$emit('update:modelValue', tab.value)"
      :class="[
        'flex justify-center items-center gap-1 p-2 border-r border-[#D0D5DD] bg-transparent outline-none flex-1 cursor-pointer group md:h-10 md:gap-2 md:px-4',
        modelValue === tab.value ? 'active bg-white' : ''
      ]"
    >
      <span class="text-xs leading-normal font-medium whitespace-nowrap text-[#98A2B3] group-[.active]:font-semibold group-[.active]:text-[#344054] md:text-sm">
        {{ tab.label }}
      </span>
      
      <div class="h-[1.125rem]">
        <span class="text-[0.625rem] leading-normal font-medium tracking-[0.0156rem] align-top text-[#98A2B3] group-[.active]:text-[#667085] group-[.active]:text-[#9e9689]">
          {{ tab.count }}
        </span>
      </div>
    </button>

  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    required: true
  },
  tabs: {
    type: Array, // Expected format: [{ label: 'All', value: 'all', count: 1 }, ...]
    required: true
  }
});

defineEmits(['update:modelValue']);
</script>