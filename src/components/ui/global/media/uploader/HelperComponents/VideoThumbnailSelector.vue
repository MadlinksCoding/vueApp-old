<template>
  <!-- video-thumbnail-preview-container -->
  <div
    class="flex flex-row flex-wrap items-start justify-start gap-6 rounded-2xl"
    style="max-width: 53.9125rem"
  >
    <div
      class="flex w-full flex-col md:flex-row flex-wrap  justify-end self-stretch rounded-3xl gap-2 md:gap-0"
    >
      <!-- Main Thumbnail Preview -->
      <div
        class="flex w-full flex-wrap items-start justify-start overflow-hidden md:w-1/2"
      >
        <div class="relative w-full rounded">
          <div class="overflow-hidden rounded">
            <div
              class="preview-placeholder-image-video w-[calc(100vw-16px)] aspect-[16/9] w-full h-full bg-cover bg-center bg-no-repeat blur-0 md:h-[14.375rem] md:w-[26.75rem] rounded"
              :style="{
                backgroundImage: `url(${selectedImage})`,
              }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Thumbnail Grid -->
      <div class="flex w-full flex-col justify-between md:w-1/2 gap-4 md:pl-2">
        <div class="flex w-full flex-col items-stretch justify-start gap-6">
          <ThumbnailSelector
            :thumbnails="thumbnails"
            :selectedIndex="selectedIndex"
            @update:selectedIndex="onThumbnailSelect"
          />
        </div>

        <!-- toggle-switch -->
        <div
          class="flex w-full flex-1 flex-row items-end justify-end gap-2 mt-2 md:mt-0 md:gap-0.5"
        >
          <CheckboxSwitch
            label="Blur thumbnail"
            version="dashboard"
            showWrapperLabel
            id="blur-thumbnail-toggle"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CheckboxSwitch from "@/components/dev/checkbox/CheckboxSwitch.vue";
import ThumbnailSelector from "./ThumbnailSelector.vue";
import { preloadIcons } from "@/utils/preload.js"; 

export default {
  components: {
    CheckboxSwitch,
    ThumbnailSelector,
  },

  data() {
    return {
      thumbnails: [
        "https://i.ibb.co.com/bjGQxr5S/sample-bg-image.webp",
        "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d",
        "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e",
        "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f",
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
        "https://images.unsplash.com/photo-1472214103451-9374bd1c798e",
        "https://images.unsplash.com/photo-1518770660439-4636190af475",
        "https://images.unsplash.com/photo-1471357674240-e1a485acb3e1",
        "https://images.unsplash.com/photo-1503264116251-35a269479413",
      ],
      selectedIndex: 0,
    };
  },

  computed: {
    selectedImage() {
      return this.thumbnails[this.selectedIndex];
    },
  },

  mounted() {
    // 👇 PRELOAD ALL IMAGES HERE
    preloadIcons(this.thumbnails);
  },

  methods: {
    onThumbnailSelect(index) {
      this.selectedIndex = index;
    },
  },
};
</script>

