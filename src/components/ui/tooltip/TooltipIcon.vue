<script setup>
defineProps({
  text: {
    type: String,
    required: true,
  },
  tooltipClass: {
    type: String,
    default: "",
  },
  wrapperClass: {
    type: String,
    default: "mt-[2px]",
  },
  iconSrc: {
    type: String,
    default: "https://i.ibb.co/HD78k3Sf/Icon.png",
  },
});
</script>

<template>
  <div :class="['relative group inline-block', wrapperClass]">
    <img :src="iconSrc" alt="" class="cursor-pointer" />
    <!-- Tooltip -->
    <div
      :class="[
        'absolute left-1/2 -translate-x-1/2 mt-2 w-max max-w-[16rem] bg-white text-gray-800 text-xs font-medium px-3 py-2 rounded-md shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50',
        tooltipClass,
      ]"
    >
      {{ text }}
    </div>
  </div>
</template>
