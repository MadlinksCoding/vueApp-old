<template>
  <div
    class="flex flex-col items-start self-stretch bg-white/20 dark:bg-background-dark-app/10 gap-1 flex-grow backdrop-blur-[25px] shadow-[0_4px_6px_rgba(16,24,40,.08)] h-[21rem] md:h-[28.031rem]"
  >
    <!-- Header -->
    <div
      class="flex justify-between items-center self-stretch gap-2 pt-4 px-2 md:px-4"
    >
      <div class="flex justify-start items-center gap-2 flex-grow">
        <!-- Icon -->
        <div class="relative w-[1.375rem] h-[1.375rem]">
          <img
            :src="icon"
            :alt="title"
            class="w-full h-full dark:[filter:brightness(0)_saturate(100%)_invert(100%)]"
          />
        </div>

        <h3
          class="text-[#344054] text-lg font-medium uppercase md:text-xl md:leading-normal dark:text-[#bdb8af]"
        >
          {{ title }}
        </h3>
      </div>
    </div>

    <!-- Body Slot -->
    <div class="flex flex-col flex-grow w-full px-2 md:px-4 pt-2 pb-4">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  }
})
</script>
