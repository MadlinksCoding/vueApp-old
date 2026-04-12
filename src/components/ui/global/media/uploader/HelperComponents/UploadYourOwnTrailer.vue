<template>
  <div class="relative w-full">
    <div class="flex overflow-hidden rounded-lg border border-gray-200 bg-black cursor-pointer group/video" @click="togglePlay">
      <input type="checkbox" class="relative appearance-none w-3 h-3 border border-[#999] rounded-[2px] hidden" />
      
      <!-- Video Preview -->
      <video 
        ref="videoRef"
        v-if="isMaybeVideo"
        :key="previewUrl"
        :src="previewUrl"
        class="aspect-[16/9] w-full object-cover"
        muted
        loop
        playsinline
        @play="isPlaying = true"
        @pause="isPlaying = false"
      ></video>

      <!-- Image Preview -->
      <div 
        v-else
        class="aspect-[16/9] w-full bg-no-repeat bg-center bg-cover"
        :style="{ backgroundImage: `url(${previewUrl})` }"
      ></div>
    </div>

    <!-- Delete Button -->
    <div
      class="absolute top-[1px] right-[1px] cursor-pointer  transition-all z-20"
      @click.stop="removeTrailer"
    >
      <img src="/images/delete.png" alt="delete" class="w-4 h-4 rounded-tr-sm" />
    </div>

    <!-- Play/Pause Control Icon -->
    <div 
      class="absolute bottom-[1px] left-[1px] rounded-bl-sm cursor-pointer z-20 transition-all active:scale-95"
      @click.stop="togglePlay"
    >
      <img
        src="/images/video-icon.png"
        alt="play"
        class="w-6 h-6"
        :class="{ 'opacity-80': isPlaying }"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useMediaUploaderStore } from "@/stores/useMediaUploaderStore";

const uploaderStore = useMediaUploaderStore();
const videoRef = ref(null);
const isPlaying = ref(false);

const previewUrl = computed(() => {
  return uploaderStore.form.previewTrailerUrl || '/images/slide-2.webp';
});

const isMaybeVideo = computed(() => {
  const file = uploaderStore.form.uploadedTrailerFile;
  const url = uploaderStore.form.previewTrailerUrl;
  
  // Check file type if available
  if (file && file.type && file.type.startsWith('video/')) return true;
  
  // Fallback check extension if it's a string URL
  if (typeof url === 'string') {
    return url.match(/\.(mp4|webm|ogg|mov)$/i);
  }
  
  return false;
});

const togglePlay = () => {
  if (!videoRef.value) return;
  
  if (videoRef.value.paused) {
    videoRef.value.play();
  } else {
    videoRef.value.pause();
  }
};

const removeTrailer = () => {
  uploaderStore.updateFormField("previewTrailerUrl", null);
  uploaderStore.updateFormField("uploadedTrailerFile", null);
  isPlaying.value = false;

  // Also clear main media if it was linked
  if (uploaderStore.form.mediaUrl === uploaderStore.form.previewTrailerUrl) {
    uploaderStore.updateFormField("mediaUrl", null);
    uploaderStore.updateFormField("mediaFile", null);
  }
};
</script>
