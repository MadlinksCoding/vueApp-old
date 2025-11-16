<script setup>
import CheckboxSwitch from "@/components/dev/checkbox/CheckboxSwitch.vue";
</script>

<template>
  <div
    class="flex flex-col mt-4 md:flex-row justify-end relative self-stretch w-full rounded-sm md:rounded-[1.5rem] gap-2"
  >
    <!-- thumb -->
    <div
      class="flex flex-wrap justify-start items-start overflow-hidden w-full md:w-1/2 gap-2"
    >
      <div class="relative w-full rounded-lg">
        <!-- thumb-image -->
        <div class="block overflow-hidden">
          <div
            class="w-[100vw] md:w-full aspect-[16/9] md:aspect-auto min-h-0 md:min-h-[24.6875rem] h-auto md:h-full bg-cover"
            style="
              background-image: url('https://i.ibb.co.com/bjGQxr5S/sample-bg-image.webp');
              filter: blur(0px);
            "
          ></div>
        </div>

        <!-- delete-button -->
        <span
          class="absolute top-0 right-0 flex items-center justify-center h-6 w-6 cursor-pointer bg-error hover:bg-error-light gap-[0.625rem]"
        >
          <img
            src="https://i.ibb.co/W4x6F7Jn/svgviewer-png-output-7.webp"
            alt="delete"
            class="w-5 h-5"
          />
        </span>
      </div>
    </div>

    <!-- blur-toggle -->
     <div class="w-1/2 relative">
    <div class=" absolute bottom-0">
      <!-- toggle-switch -->
      <div class="flex w-full flex-1 flex-row items-end justify-end gap-2 mt-2">
        <CheckboxSwitch
          label="Blur thumbnail"
          version="dashboard"
          showWrapperLabel
        />
      </div>
       </div>
    </div>
  </div>
</template>
