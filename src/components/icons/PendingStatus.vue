<template>
  <div
    v-if="normalizedStatus === 'confirmed'"
    class="rounded-full bg-[#07F468] flex items-center justify-center aspect-square flex-shrink-0"
    :style="{ width: displayWidth, height: displayHeight }"
  ></div>
  <div
    v-else-if="normalizedStatus === 'declined'"
    class="rounded-full bg-[#FF4405] flex items-center justify-center aspect-square flex-shrink-0"
    :style="{ width: displayWidth, height: displayHeight }"
  ></div>
  <svg
    v-else
    xmlns="http://www.w3.org/2000/svg"
    :width="width"
    :height="height"
    viewBox="0 0 10 10"
    fill="none"
    class="flex-shrink-0"
  >
    <g clip-path="url(#clip0_1820_31523)">
      <path
        d="M4.99967 9.16683C7.30086 9.16683 9.16634 7.30135 9.16634 5.00016C9.16634 2.69898 7.30086 0.833496 4.99967 0.833496C2.69849 0.833496 0.833008 2.69898 0.833008 5.00016C0.833008 7.30135 2.69849 9.16683 4.99967 9.16683Z"
        fill="white"
        stroke="#667085"
        stroke-width="1.25"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-dasharray="1.25 2.5"
      />
    </g>
    <defs>
      <clipPath id="clip0_1820_31523">
        <rect width="10" height="10" fill="white" />
      </clipPath>
    </defs>
  </svg>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  width: {
    type: [Number, String],
    default: 10,
  },
  height: {
    type: [Number, String],
    default: 10,
  },
  status: {
    type: String,
    default: 'pending',
  },
});

const normalizedStatus = computed(() => {
  const val = String(props.status || 'pending').toLowerCase();
  if (['confirmed', 'confirm', 'approved', 'approve', 'active'].includes(val)) {
    return 'confirmed';
  }
  if (['declined', 'decline', 'cancelled', 'canceled', 'cancel', 'rejected', 'reject'].includes(val)) {
    return 'declined';
  }
  return 'pending';
});

const displayWidth = computed(() => {
  return typeof props.width === 'number' ? `${props.width}px` : props.width;
});

const displayHeight = computed(() => {
  return typeof props.height === 'number' ? `${props.height}px` : props.height;
});
</script>

