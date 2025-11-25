<template>
  <div class="relative md:py-[16px] md:px-[10px] lg:px-[24px]">
    <div class="mb-[50px]">
      <div
        @click="uploader.goToStep(3, { intent: 'user' })"
        class="flex gap-2 items-center cursor-pointer"
      >
        <img src="/images/backIcon.png" alt="" srcset="" />
        <button
          class="text-xs font-medium leading-[1.125rem] text-medium-text break-words"
        >
          Back
        </button>
      </div>

      <h4
        class="text-[#667085] text-sm font-[700] leading-normal not-italic my-[10px]"
      >
        When do you like to publish this media?
      </h4>

      <!-- Substep Tabs -->
      <!-- Tabs -->
      <div
        class="[scrollbar-width: none] border border-border-light flex-row items-stretch overflow-x-auto whitespace-nowrap rounded-[0.313rem] bg-secondary-bg hidden md:flex"
      >
        <button
          @click="
            uploader.goToSubstep('publishImmediately', { intent: 'user' })
          "
          :class="[
            'border-r flex flex-1 items-center px-4 py-2 justify-center gap-2 border-border-light cursor-pointer',
            uploader.substep === 'publishImmediately'
              ? 'bg-dark-text text-white'
              : '',
          ]"
        >
          <img src="/images/publish-icon.png" alt="" />
          Publish immediately after approval
        </button>

        <button
          @click="uploader.goToSubstep('schedulePublish', { intent: 'user' })"
          :class="[
            'border-r flex flex-1 items-center px-4 py-2 justify-center gap-2 border-border-light cursor-pointer',
            uploader.substep === 'schedulePublish'
              ? 'bg-dark-text text-white'
              : '',
          ]"
        >
          <img src="/images/schedule-icon.png" alt="" />

          Schedule a publish time
        </button>
      </div>

      <!-- Mobile Dropdown -->
      <div
        class="md:hidden border border-border-light rounded-md bg-secondary-bg"
      >
        <!-- Selected Heading -->
        <div
          @click="showPublishDropdown = !showPublishDropdown"
          class="px-4 py-2 text-xs sm:text-[16px] border-b border-border-light cursor-pointer flex justify-center items-center gap-2 bg-dark-text text-white"
        >
          <span>{{ getPublishLabel(uploader.substep) }}</span>
          <img src="/images/chevron-down.webp" class="w-3 h-3" alt="" />
        </div>

        <!-- Dropdown List -->
        <div v-if="showPublishDropdown" class="flex flex-col">
          <div
            @click="
              uploader.goToSubstep('publishImmediately', { intent: 'user' });
              showPublishDropdown = false;
            "
            class="px-4 py-2 text-xs sm:text-[16px] flex items-center gap-2 border-b border-border-light cursor-pointer text-secondary-text"
          >
            <img src="/images/publish-icon.png" class="w-4 h-4" alt="" />
            Publish immediately after approval
          </div>

          <div
            @click="
              uploader.goToSubstep('schedulePublish', { intent: 'user' });
              showPublishDropdown = false;
            "
            class="px-4 py-2 text-xs sm:text-[16px] flex items-center gap-2 border-b border-border-light cursor-pointer text-secondary-text"
          >
            <img src="/images/schedule-icon.png" class="w-4 h-4" alt="" />
            Schedule a publish time
          </div>
        </div>
      </div>

      <!-- Substep: Publish Immediately -->
      <div v-if="uploader.substep === 'publishImmediately'">
        <div class="text-[#303437] text-[14px] mt-4 mb-6">
          We will publish the media according to your subscription and Pay to
          view preference. It will usually take 2 working days.
        </div>

        <div>
          <h4
            class="text-[#667085] text-sm font-[700] leading-normal not-italic my-[10px]"
          >
            Share Settings
          </h4>

          <CheckboxSwitch
            label="Post to X when my media is published"
            id="publish-media-toggle"
          />

          <div class="flex justify-between">
            <div>
              <div class="mt-4 mb-4 flex flex-col gap-2">
                <div class="text-[14px] font-[600] tetxt-[#0C111D]">
                  Post Message (Leave blank to use system default message.)
                </div>

                <BaseInput
                  type="textarea"
                  placeholder="Don’t miss out—check this exclusive content and be the first to experience it!"
                  :maxLength="1000"
                  inputClass="bg-white/50 w-full px-3 py-3 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 text-[16px] resize-none overflow-hidden placeholder:whitespace-normal"
                />
              </div>

              <div>
                <RadioGroup
                  v-model="transferType"
                  name="subscription"
                  label="Attach Media"
                  :options="transferTypeOptions"
                  version="dashboard"
                  :radio-label-class="`relative text-[0.938rem] font-medium leading-6 text-black pl-8 cursor-pointer
      before:content-[''] before:w-5 before:h-5 before:rounded-full before:border before:border-radio-border before:bg-white 
      before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 peer-checked:before:bg-black 
      after:content-[''] after:w-[0.375rem] after:h-[0.375rem] after:rounded-full after:bg-success 
       after:absolute after:left-[0.4375rem] after:top-1/2 after:-translate-y-1/2 
      peer-checked:after:block after:hidden
    `"
                />
              </div>
            </div>

            <div class="hidden md:flex">
              <PostPreview />
            </div>
          </div>

          <div class="md:flex justify-between gap-4 mt-4">
            <div class="w-full">
              <ThumbnailUploader
                subtitle="or drag and drop thumbnail image"
                fileInfo="SVG, PNG, JPG or GIF (max. 800x400px)"
              />
            </div>
            <div class="w-full mt-2 md:mt-0">
              <ThumbnailUploader
                subtitle="or drag and drop trailer file"
                fileInfo="MP3, MP4, AVI, QUICKTIME, X-MATROSKA, X-MS-WMV, WEBM, OGG. (Max. 2000MB)"
              />
            </div>
          </div>

          <div class="md:flex justify-between gap-4 mt-4">
            <UploadThumbnailPreview
              bgImage="/images/slide-2.webp"
              deleteIcon="/images/delete.png"
              expandIcon="/images/expand-icon.png"
              :showBlurToggle="false"
              :showLabel="true"
              labelText="Thumbnail"
            />

            <UploadThumbnailPreview
              bgImage="/images/slide-2.webp"
              deleteIcon="/images/delete.png"
              expandIcon="/images/video-icon.png"
              :showBlurToggle="false"
              :showLabel="true"
              labelText="Trailer"
            />
          </div>

          <div class="md:hidden mt-2">
            <PostPreview />
          </div>

          <div class="my-4">
            <NotificationCard
              variant="notice"
              title="You must connect to your X account before using auto repost feature."
              linkHref="#"
              :showIcon="false"
              :closable="false"
            >
              <button
                class="py-1 px-2 w-max bg-[#22CCEE] text-[12px] text-[#FFFFFF]"
              >
                Connect X account
              </button>
            </NotificationCard>
          </div>
        </div>
      </div>

      <!-- Substep: Schedule Publish -->
      <div v-else-if="uploader.substep === 'schedulePublish'">
        <PublishDatePicker
          v-model="publishDate"
          label="Set date and time for publishing:"
          message="Date must be minimum 2 days ahead."
        />
        <div class="mt-4 mb-4 flex gap-2 items-center">
          <CheckboxGroup
            label="Feature this media on ‘coming soon’ section"
            checkboxClass="appearance-none bg-white border border-gray-300 rounded-[4px] w-3 h-3 cursor-pointer checked:bg-success checked:border-success checked:relative checked:after:content-[''] checked:after:absolute checked:after:left-[0.3rem] checked:after:top-[0.15rem] checked:after:w-1 checked:after:h-2 checked:after:border-black checked:after:border-[2px] checked:after:border-solid checked:after:border-t-0 checked:after:border-l-0 checked:after:rotate-45 checked:after:box-border "
            labelClass="text-[16px] text-[#000] font-[500] cursor-pointer "
            wrapperClass="flex items-center"
          />
          <div class="relative group">
            <img src="/images/info-icon.png" alt="" class="cursor-pointer" />

            <!-- Tooltip -->
            <div
              class="absolute left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block bg-[#555b67] text-[#ffffff] text-xs px-3 py-2 shadow-lg z-50 w-[280px] rounded-[8px]"
            >
              This media will be added to the ‘coming soon’ section on your
              profile media page.
            </div>
          </div>
        </div>

        <div>
          <div class="ml-6">
            <Paragraph
              text="Preorder price (Optional)"
              font-size="text-[14px]"
              font-weight="font-[400]"
              font-color="text-[#667085]"
            />
          </div>

          <div class="sm:w-[380px] ml-6">
            <InputDefaultComponent
              id="input_5"
              type="number"
              show-label
              v-model="name"
              label-text=""
              rightSpan
              :rightSpanText="'USD'"
            />
          </div>
          <ul class="list-disc ml-[40px] text-[14px] text-[#475467] mt-2">
            <li>Offer special offer to fans who pre orders this media.</li>
            <li>Leave blank to disable feature.</li>
          </ul>
        </div>

        <div>
          <h4
            class="text-[#667085] text-sm font-[700] leading-normal not-italic mb-[12px] mt-[20px]"
          >
            Share Settings
          </h4>

          <CheckboxSwitch
            label="Post to X when my media is published"
            id="publish-media-toggle"
          />
        </div>
      </div>
    </div>

    <!-- next Navigation -->
    <div
      class="flex justify-end md:mt-0 mt-4"
      @click="uploader.goToStep(5, { intent: 'user' })"
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
import { ref } from "vue";

import NotificationCard from "@/components/dev/card/notification/NotificationCard.vue";
import CheckboxSwitch from "@/components/dev/checkbox/CheckboxSwitch.vue";
import PublishDatePicker from "./HelperComponents/PublishDatePicker.vue";
import CheckboxGroup from "@/components/ui/form/checkbox/CheckboxGroup.vue";
import ButtonComponent from "@/components/dev/button/ButtonComponent.vue";
import BaseInput from "@/components/dev/input/BaseInput.vue";
import RadioGroup from "@/components/dev/RadioGroup.vue";
import PostPreview from "./HelperComponents/PostPreview.vue";
import Paragraph from "@/components/dev/default/Paragraph.vue";
import InputDefaultComponent from "@/components/dev/input/InputDefaultComponent.vue";
import ThumbnailUploader from "./HelperComponents/ThumbnailUploader.vue";
import UploadThumbnailPreview from "./HelperComponents/UploadThumbnailPreview.vue";

// Props
const props = defineProps({
  uploader: {
    type: Object,
    required: true,
  },
});

// --- Mobile dropdown state ---
const showPublishDropdown = ref(false);

// --- Dropdown Label Function ---
function getPublishLabel(step) {
  switch (step) {
    case "publishImmediately":
      return "Publish immediately after approval";
    case "schedulePublish":
      return "Schedule a publish time";
    default:
      return "Select an option";
  }
}

// --- Existing Fields ---
const transferType = ref("");
const publishDate = ref("");

const transferTypeOptions = [
  { value: "choice-a", label: "Use original thumbnail and preview" },
  { value: "choice-b", label: "Upload a different thumbnail and preview" },
  { value: "choice-c", label: "Do not attach thumbnail and preview" },
];
</script>
