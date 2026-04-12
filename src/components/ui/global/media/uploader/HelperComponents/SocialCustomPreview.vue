<script setup>
import { computed } from "vue";

const props = defineProps({
  src: { type: String, required: true },
  type: { type: String, default: "image" }, // 'image' or 'video'
  label: { type: String, default: "Thumbnail" },
});

const emit = defineEmits(["delete"]);

function isVideo(url) {
  if (!url) return false;
  return url.startsWith('blob:') || url.toLowerCase().includes('video') || 
         ['.mp4', '.mov', '.avi', '.webm'].some(ext => url.toLowerCase().includes(ext));
}
</script>

<template>
  <div class="relative w-full h-60 rounded-sm overflow-hidden bg-gray-200 group border border-border-light shadow-sm">
    <!-- Media Content -->
    <div class="w-full h-full">
      <video
        v-if="type === 'video'"
        :src="src"
        class="w-full h-full object-cover"
        autoplay
        loop
        muted
        playsinline
      ></video>
      <img
        v-else
        :src="src"
        class="w-full h-full object-cover"
      />
    </div>

    <!-- Delete Button (Top Right) -->
    <button
      @click="emit('delete')"
      class="absolute top-0 right-0 w-6 h-6 flex items-center justify-center bg-error hover:bg-error-light transition-all z-10"
    >
      <img src="/images/delete.png" alt="delete" class="w-5 h-5" />
    </button>

    <!-- Themed Icon (Bottom Left) -->
    <div class="absolute bottom-2 left-2 z-10">
      <div v-if="type === 'video'" class="w-6 h-6 bg-black rounded-sm flex items-center justify-center">
         <div class="w-0 h-0 border-t-[4px] border-t-transparent border-l-[7px] border-l-[#07f468] border-b-[4px] border-b-transparent ml-0.5"></div>
      </div>
      <div v-else class="w-6 h-6 flex items-center justify-center">
         <img src="https://i.ibb.co/37m5Yn9/svgviewer-png-output-34.webp" alt="expand" class="w-5 h-5" />
      </div>
    </div>

    <!-- Label (Bottom Right) -->
    <div class="absolute bottom-0 right-0 bg-black text-white text-[10px] font-bold py-1 px-3 z-10">
      {{ label }}
    </div>
  </div>
</template>

<style scoped>
/* Optional styling if needed */
</style>
