<template>
  <svg
    :width="size"
    :height="size"
    :viewBox="`0 0 ${viewBox} ${viewBox}`"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      :cx="viewBox / 2"
      :cy="viewBox / 2"
      :r="viewBox / 2"
      :fill="color"
    />
  </svg>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number | string
    color?: string
  }>(),
  {
    size: 7,
    color: "#FF4405",
  }
)

const viewBox = 7
</script>