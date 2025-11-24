<template>
  <div class="flex flex-wrap items-start justify-start gap-1">
    <div
      v-for="(thumb, index) in thumbnails"
      :key="index"
      class="relative w-[6.2rem] cursor-pointer rounded"
    >
      <input
        type="radio"
        class="thumbnail-radio absolute left-0 top-0 z-[5] m-1 h-full w-full opacity-0 cursor-pointer peer"
        :checked="index === selectedIndex"
        @change="$emit('update:selectedIndex', index)"
      />
      <div class="overflow-hidden rounded flex items-center justify-center w-auto h-auto">
        <div
          class="img-item h-[3.6125rem] w-[6.3rem] bg-cover bg-center bg-no-repeat rounded-sm"
          :class="{'opacity-100': index === selectedIndex, 'opacity-50': index !== selectedIndex}"
          :style="{ backgroundImage: `url(${thumb})` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  thumbnails: {
    type: Array,
    required: true
  },
  selectedIndex: {
    type: Number,
    default: 0
  }
});

defineEmits(['update:selectedIndex']);
</script>
