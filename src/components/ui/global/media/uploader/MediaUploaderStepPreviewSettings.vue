<template>
  <div class="relative py-[16px] px-[24px]">
    <div class="flex gap-2 items-center py-[16px]">
      <img src="/images/backIcon.png" alt="" srcset="" />
      <button
        class="text-xs font-medium leading-[1.125rem] text-medium-text break-words"
      >
        Back
      </button>
    </div>

    <h4
      class="text-[#667085] text-sm font-[700] leading-normal not-italic py-[8px]"
    >
      Thumbnail Settings
    </h4>

    <!-- Substep Tabs -->
    <div
      class="[scrollbar-width: none] border border-border-light flex-row items-stretch overflow-x-auto whitespace-nowrap rounded-[0.313rem] bg-secondary-bg hidden md:flex lg:flex xl:flex"
    >
      <!-- Tab 1 -->
      <div
        @click="uploader.goToSubstep('chooseScreenshot', { intent: 'user' })"
        :class="[
          ' border-r flex flex-1 items-center px-4 py-2 justify-center gap-2 border-border-light',
          uploader.substep === 'chooseScreenshot'
            ? 'bg-dark-text text-white'
            : '',
        ]"
      >
        <button
          :class="
            uploader.substep === 'chooseScreenshot'
              ? 'text-white'
              : 'text-secondary-text'
          "
        >
          Choose screenshot
        </button>
      </div>

      <!-- Tab 2 -->
      <div
        @click="uploader.goToSubstep('usePlaceholder', { intent: 'user' })"
        :class="[
          '  flex flex-1 border-r items-center px-4 py-2 justify-center gap-2 border-border-light',
          uploader.substep === 'usePlaceholder'
            ? 'bg-dark-text text-white'
            : 'text-secondary-text',
        ]"
      >
        <button
          :class="uploader.substep === 'usePlaceholder' ? 'text-white' : ''"
        >
          Use placeholder
        </button>
      </div>

      <!-- Tab 3 -->
      <div
        @click="uploader.goToSubstep('uploadThumbnail', { intent: 'user' })"
        :class="[
          ' flex flex-1 border-r items-center px-4 py-2 justify-center gap-2 border-border-light',
          uploader.substep === 'uploadThumbnail'
            ? 'bg-dark-text text-white'
            : 'text-secondary-text',
        ]"
      >
        <button
          :class="uploader.substep === 'uploadThumbnail' ? 'text-white' : ''"
        >
          Upload your own thumbnail
        </button>
      </div>
    </div>

    <!-- Substep: chooseScreenshot -->
    <div v-if="uploader.substep === 'chooseScreenshot'">
      <div class="mt-4">
        <VideoThumbnailSelector />
      </div>

      <h4
        class="text-[#667085] text-sm font-[700] leading-normal not-italic py-[16px]"
      >
        Trailer Settings
      </h4>

      <div class="mb-[50px]">
        <TrailerSetting />
      </div>
    </div>

    <!-- Substep: Choose usePlaceholder -->
    <div v-else-if="uploader.substep === 'usePlaceholder'">
      <div class="mt-4">
        <FileUploadPlaceholder />

        <h4
          class="text-[#667085] text-sm font-[700] leading-normal not-italic py-[16px]"
        >
          Trailer Settings
        </h4>
        <div class="mb-[50px]">
          <TrailerSetting />
        </div>

        <div
          class="[scrollbar-width: none] border border-border-light flex-row items-stretch overflow-x-auto whitespace-nowrap rounded-[0.313rem] bg-secondary-bg hidden md:flex lg:flex xl:flex"
        >
          <div
            @click="nestedSubstep = 'systemTrailer'"
            :class="[
              'flex-1 text-center py-2 cursor-pointer border-r border-border-light',
              nestedSubstep === 'systemTrailer'
                ? 'bg-dark-text text-white'
                : 'text-secondary-text',
            ]"
          >
            Use system generated trailer
          </div>

          <div
            @click="nestedSubstep = 'uploadTrailer'"
            :class="[
              'flex-1 text-center py-2 cursor-pointer',
              nestedSubstep === 'uploadTrailer'
                ? 'bg-dark-text text-white'
                : 'text-secondary-text',
            ]"
          >
            Upload your own trailer
          </div>
        </div>

        <!-- System Generated Trailer -->
        <div v-if="nestedSubstep === 'systemTrailer'">
          <p class="mt-4 text-gray-700">
            System Generated Trailer Content Here
          </p>
        </div>

        <!-- Upload Your Own Trailer -->
        <div v-else-if="nestedSubstep === 'uploadTrailer'">
          <p class="mt-4 text-gray-700">Upload Your Own Trailer Content Here</p>
        </div>
      </div>
    </div>

    <!-- Substep: Upload Thumbnail -->
    <div v-else-if="uploader.substep === 'uploadThumbnail'">
      <div class="mt-4">
        <ThumbnailUploader />

        <UploadThumbnailPreview />
        <h4
          class="text-[#667085] text-sm font-[700] leading-normal not-italic py-[16px]"
        >
          Trailer Settings
        </h4>
        <div class="mb-[50px]">
          <TrailerSetting />
        </div>
      </div>
    </div>

    <!-- next Navigation -->
    <div
      class="absolute bottom-0 right-0"
      @click="uploader.goToStep(2, { intent: 'user' })"
    >
      <ButtonComponent
        text="Next"
        variant="polygonLeft"
        :rightIcon="'https://i.ibb.co/hx8ztZFf/svgviewer-png-output-8.webp'"
        :rightIconClass="`
    w-6 h-6 transition duration-200
    filter brightness-0 invert-0   /* Default: black */
    group-hover:[filter:brightness(0)_saturate(100%)_invert(75%)_sepia(23%)_saturate(7280%)_hue-rotate(93deg)_brightness(109%)_contrast(95%)]
  `"
        btnBg="#07f468"
        btnHoverBg="black"
        btnText="black"
        btnHoverText="#07f468"
      />
    </div>
  </div>
</template>

<script>
import ButtonComponent from "@/components/dev/button/ButtonComponent.vue";
import TrailerSetting from "./HelperComponents/TrailerSetting.vue";
import VideoThumbnailSelector from "./HelperComponents/VideoThumbnailSelector.vue";
import FileUploadPlaceholder from "./HelperComponents/FileUploadPlaceholder.vue";
import ThumbnailUploader from "./HelperComponents/ThumbnailUploader.vue";
import UploadThumbnailPreview from "./HelperComponents/UploadThumbnailPreview.vue";
import { ref } from "vue";

export default {
  name: "MediaUploaderStepPreviewSettings",
  props: {
    uploader: {
      type: Object,
      required: true,
    },
  },
  components: {
    VideoThumbnailSelector,
    TrailerSetting,
    ButtonComponent,
    FileUploadPlaceholder,
    ThumbnailUploader,
    UploadThumbnailPreview,
  },
  setup() {
    // Local reactive state
    const nestedSubstep = ref("systemTrailer");

    return {
      nestedSubstep,
    };
  },
};
</script>
