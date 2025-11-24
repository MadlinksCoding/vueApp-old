<template>
  <div class="relative md:py-[16px] md:px-[10px] lg:px-[24px]">
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

    <!--desktop Substep Tabs -->
    <div
      class="border border-border-light justify-between flex-row items-stretch overflow-x-auto rounded-[0.313rem] bg-secondary-bg hidden md:flex"
      style="scrollbar-width: none; -ms-overflow-style: none"
    >
      <!-- Tab 1 -->
      <div
        @click="uploader.goToSubstep('chooseScreenshot', { intent: 'user' })"
        :class="[
          'border-r flex flex-shrink-0 min-w-fit items-center px-4 py-2 justify-center gap-2 border-border-light cursor-pointer',
          uploader.substep === 'chooseScreenshot'
            ? 'bg-dark-text text-white'
            : '',
        ]"
      >
        <img src="/images/ssIcon.png" alt="" class="flex-shrink-0" />
        <button
          :class="
            uploader.substep === 'chooseScreenshot'
              ? 'text-white'
              : 'text-secondary-text'
          "
          class=""
        >
          Choose screenshot
        </button>
      </div>

      <!-- Tab 2 -->
      <div
        @click="uploader.goToSubstep('usePlaceholder', { intent: 'user' })"
        :class="[
          'flex flex-shrink-0 min-w-fit border-r items-center px-4 py-2 justify-center gap-2 border-border-light cursor-pointer',
          uploader.substep === 'usePlaceholder'
            ? 'bg-dark-text text-white'
            : 'text-secondary-text',
        ]"
      >
        <img src="/images/placeholderIcon.png" alt="" class="flex-shrink-0" />
        <button
          :class="uploader.substep === 'usePlaceholder' ? 'text-white' : ''"
          class=""
        >
          Use placeholder
        </button>
      </div>

      <!-- Tab 3 -->
      <div
        @click="uploader.goToSubstep('uploadThumbnail', { intent: 'user' })"
        :class="[
          'flex flex-shrink-0 min-w-fit border-r items-center px-4 py-2 justify-center gap-2 border-border-light cursor-pointer',
          uploader.substep === 'uploadThumbnail'
            ? 'bg-dark-text text-white'
            : 'text-secondary-text',
        ]"
      >
        <img src="/images/uploadIcon.png" alt="" class="flex-shrink-0" />
        <button
          :class="uploader.substep === 'uploadThumbnail' ? 'text-white' : ''"
          class=""
        >
          Upload your own thumbnail
        </button>
      </div>
    </div>

    <!-- Mobile Dropdown (show under 768px) -->
    <div
      class="md:hidden border border-border-light rounded-md bg-secondary-bg"
    >
      <!-- HEADING (Selected Tab Only) -->
      <div
        @click="showMobileTabs = !showMobileTabs"
        class="px-4 py-2 border-b border-border-light cursor-pointer flex justify-center items-center gap-2 bg-dark-text text-white"
      >
        <!-- Dynamic icon + text based on selected step -->
        <img :src="getStepIcon(uploader.substep)" alt="" class="w-5 h-5" />
        <span class="text-sm sm:text-[16px]">{{
          getStepLabel(uploader.substep)
        }}</span>
        <img src="/images/chevron-down.webp" alt="" class="w-3 h-3" />
      </div>

      <!-- COLLAPSE CONTENT (Other tabs) -->
      <div v-if="showMobileTabs" class="flex flex-col">
        <!-- Tab 1 -->
        <div
          @click="
            uploader.goToSubstep('chooseScreenshot');
            showMobileTabs = false;
          "
          class="px-4 py-2 text-sm sm:text-[16px] flex items-center gap-2 border-b border-border-light cursor-pointer text-secondary-text"
        >
          <img src="/images/ssIcon.png" alt="" class="w-5 h-5" />
          Choose screenshot
        </div>

        <!-- Tab 2 -->
        <div
          @click="
            uploader.goToSubstep('usePlaceholder');
            showMobileTabs = false;
          "
          class="px-4 py-2 text-sm sm:text-[16px] flex items-center gap-2 border-b border-border-light cursor-pointer text-secondary-text"
        >
          <img src="/images/placeholderIcon.png" alt="" class="w-5 h-5" />
          Use placeholder
        </div>

        <!-- Tab 3 -->
        <div
          @click="
            uploader.goToSubstep('uploadThumbnail');
            showMobileTabs = false;
          "
          class="px-4 py-2 text-sm sm:text-[16px] flex items-center gap-2 border-b border-border-light cursor-pointer text-secondary-text"
        >
          <img src="/images/ssIcon.png" alt="" class="w-5 h-5" />
          Upload your own thumbnail
        </div>
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

      <div class="mb-[100px]">
        <TrailerSetting />
      </div>
    </div>

    <!-- Substep: Choose usePlaceholder -->
    <div v-else-if="uploader.substep === 'usePlaceholder'">
      <div class="mt-4">
        <FileUploadPlaceholder />

        <h4
          class="text-[#667085] text-sm font-[700] leading-normal not-italic py-[16px] w-max-"
        >
          Trailer Settings
        </h4>
        <div class="mb-[50px]">
          <TrailerSetting />
        </div>

        <!-- Desktop / Tablet -->
        <div
          class="[scrollbar-width: none] border border-border-light flex-row items-stretch overflow-x-auto whitespace-nowrap rounded-[0.313rem] bg-secondary-bg hidden md:flex"
        >
          <div
            @click="nestedSubstep = 'systemTrailer'"
            :class="[
              'flex-1 text-center py-2 flex items-center gap-2 justify-center cursor-pointer border-r border-border-light',
              nestedSubstep === 'systemTrailer'
                ? 'bg-dark-text text-white'
                : 'text-secondary-text',
            ]"
          >
            <img src="/images/ssIcon.png" alt="" />
            Use system generated trailer
          </div>

          <div
            @click="nestedSubstep = 'uploadTrailer'"
            :class="[
              'flex-1 text-center py-2 cursor-pointer flex items-center gap-2 justify-center',
              nestedSubstep === 'uploadTrailer'
                ? 'bg-dark-text text-white'
                : 'text-secondary-text',
            ]"
          >
            <img src="/images/uploadIcon.png" alt="" />

            Upload your own trailer
          </div>
        </div>

        <!-- Mobile Dropdown -->
        <div
          class="md:hidden border border-border-light rounded-md bg-secondary-bg"
        >
          <!-- Heading: Selected tab -->
          <div
            @click="showNestedDropdown = !showNestedDropdown"
            class="px-4 py-2 border-b border-border-light cursor-pointer flex justify-center items-center gap-2 bg-dark-text text-white"
          >
            <img :src="getNestedIcon(nestedSubstep)" alt="" class="w-5 h-5" />
            <span class="text-sm sm:text-[16px]">{{
              getNestedLabel(nestedSubstep)
            }}</span>
            <img src="/images/chevron-down.webp" alt="" class="w-3 h-3" />
          </div>

          <!-- Dropdown options -->
          <div v-if="showNestedDropdown" class="flex flex-col">
            <div
              @click="
                nestedSubstep = 'systemTrailer';
                showNestedDropdown = false;
              "
              class="px-4 py-2 flex items-center text-sm sm:text-[16px] gap-2 border-b border-border-light cursor-pointer text-secondary-text"
            >
              <img src="/images/ssIcon.png" alt="" class="w-5 h-5" />
              Use system generated trailer
            </div>

            <div
              @click="
                nestedSubstep = 'uploadTrailer';
                showNestedDropdown = false;
              "
              class="px-4 py-2 flex items-center text-sm sm:text-[16px] gap-2 border-b border-border-light cursor-pointer text-secondary-text"
            >
              <img src="/images/uploadIcon.png" alt="" class="w-5 h-5" />
              Upload your own trailer
            </div>
          </div>
        </div>

        <!-- System Generated Trailer -->
        <div v-if="nestedSubstep === 'systemTrailer'">
          <p class="mt-4 text-gray-700">
            <SystemGeneratedImage />
          </p>
        </div>

        <!-- Upload Your Own Trailer -->
        <div v-else-if="nestedSubstep === 'uploadTrailer'">
          <div class="mt-4 mb-[50px]">
            <ThumbnailUploader
              subtitle="or drag and drop video file here"
              fileInfo="MP4, AVI, QUICKTIME, X-MATROSKA, X-MS-WMV, WEBM, OGG, JPEG, PNG. (Max. 2000MB)"
            />
            <div class="mt-4">
              <UploadYourOwnTrailer />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Substep: Upload Thumbnail -->
    <div v-else-if="uploader.substep === 'uploadThumbnail'">
      <div class="mt-4">
        <ThumbnailUploader />

        <UploadThumbnailPreview
          bgImage="/images/slide-2.webp"
          deleteIcon="/images/delete.png"
          expandIcon=""
          :showLabel="false"
          :showBlurToggle="true"
          :preloadImages="['/images/slide-2.webp', '/images/delete.png']"
        />
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
      class="flex justify-end md:mt-0 mt-4"
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

<script setup>
import ButtonComponent from "@/components/dev/button/ButtonComponent.vue";
import TrailerSetting from "./HelperComponents/TrailerSetting.vue";
import VideoThumbnailSelector from "./HelperComponents/VideoThumbnailSelector.vue";
import FileUploadPlaceholder from "./HelperComponents/FileUploadPlaceholder.vue";
import ThumbnailUploader from "./HelperComponents/ThumbnailUploader.vue";
import UploadThumbnailPreview from "./HelperComponents/UploadThumbnailPreview.vue";
import SystemGeneratedImage from "./HelperComponents/SystemGeneratedImage.vue";
import UploadYourOwnTrailer from "./HelperComponents/UploadYourOwnTrailer.vue";

import { ref } from "vue";

// Props
const props = defineProps({
  uploader: {
    type: Object,
    required: true,
  },
});

// Local reactive state
const showMobileTabs = ref(false);

// Map step to label
function getStepLabel(step) {
  if (step === "chooseScreenshot") return "Choose screenshot";
  if (step === "usePlaceholder") return "Use placeholder";
  if (step === "uploadThumbnail") return "Upload your own thumbnail";
  return "";
}

// Map step to icon
function getStepIcon(step) {
  if (step === "chooseScreenshot") return "/images/ssIcon.png";
  if (step === "usePlaceholder") return "/images/placeholderIcon.png";
  if (step === "uploadThumbnail") return "/images/ssIcon.png";
  return "";
}
const nestedSubstep = ref("systemTrailer");
const showNestedDropdown = ref(false);

function getNestedLabel(step) {
  if (step === "systemTrailer") return "Use system generated trailer";
  if (step === "uploadTrailer") return "Upload your own trailer";
  return "";
}

function getNestedIcon(step) {
  if (step === "systemTrailer") return "/images/ssIcon.png";
  if (step === "uploadTrailer") return "/images/uploadIcon.png";
  return "";
}
</script>
