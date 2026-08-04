<template>
    <div class="w-screen h-screen md:w-[493px] md:h-auto overflow-y-auto p-2 md:p-4 pb-16 md:pb-4 bg-white/90 md:rounded-[10px] inline-flex flex-col justify-start items-start gap-4 relative">
  <div class="self-stretch bg-white/5 backdrop-blur-[5px] inline-flex justify-between items-start">
    <div class="justify-start text-slate-700 text-base font-medium font-['Poppins'] leading-6">{{ title }}</div>
    <div class="relative">
      <img src="https://i.ibb.co/G4Y3BB6c/Icon.png" alt="x-close" class="w-3 h-3 cursor-pointer" data-popup-close>
    </div>
  </div>
  <div class="self-stretch py-2 flex flex-col justify-center items-start gap-6">
    <div class="self-stretch inline-flex justify-start items-start gap-2">
      <CheckboxSwitch v-model="checkboxModel" :label="checkboxLabel" version="dashboard" wrapper-label="Dark Mode" />
      <input type="hidden" :name="inputName" :value="checkboxModel ? '1' : '0'" />
    </div>
    <ValidationInlineWarning
      :messages="editImpactMessages(checkboxModel, baselineModelValue)"
      purpose="edit-impact"
      spacing-class="-mt-4"
    />
  </div>
  <div class="self-stretch flex flex-col justify-start items-start gap-6">
    <div class="self-stretch flex flex-col justify-start items-start gap-1.5">
        <div class="self-stretch justify-start text-gray-900 text-sm font-semibold font-['Poppins'] leading-5">Post Message (Leave blank to use system default message.)</div>
        <input type="hidden" :name="textareaName" :value="localMessage" />
        <div class="self-stretch h-24 flex flex-col justify-start items-start gap-1.5">
            <div class="self-stretch flex-1 flex flex-col justify-start items-start gap-1.5">
              <textarea
                ref="messageTextareaRef"
                v-model="localMessage"
                rows="3"
                class="self-stretch flex-1 px-3.5 py-2.5 bg-white/30 rounded-tl-xs rounded-tr-xs shadow-[0px_1px_2px_0_rgba(16,24,40,0.05)] border-b border-gray-300 outline-none resize-none text-gray-700 text-sm"
                placeholder="Write your X repost message..."
              />
            </div>
            <div class="self-stretch justify-start text-slate-600 text-sm font-normal font-['Poppins'] leading-5">{{ localMessage.length }} characters</div>
        </div>
        <ValidationInlineWarning
          :messages="editImpactMessages(localMessage, baselineMessageValue)"
          purpose="edit-impact"
          spacing-class="mt-1.5"
        />
    </div>
    
    <div class="self-stretch flex flex-col justify-start items-start gap-2">
      <div class="justify-start text-gray-500 text-xs font-normal font-['Poppins'] leading-4">POST PREVIEW</div>
      <div class="self-stretch px-2 py-4 bg-white/70 rounded-[5px] inline-flex justify-start items-start gap-2">
        <div class="size- flex justify-start items-center gap-1">
          <div class="size-6 relative rounded-[50px]">
            <div  class="left-0 top-0 absolute">
              <img :src="AiArtIcon" alt="ai-art" class="w-6 h-6 rounded-full object-cover">
            </div>
          </div>
        </div>
        <div class="flex-1 inline-flex flex-col justify-start items-start gap-2">
          <div class="self-stretch flex flex-col justify-start items-start gap-1">
            <div class="size- inline-flex justify-start items-center gap-2">
              <div class="size- flex justify-start items-center gap-1">
                <div class="justify-start text-gray-900 text-xs font-semibold font-['Poppins'] leading-4 line-clamp-1">Jelly FISH</div>
                <div  data-size="2xl" class="relative">
                  <img :src="VerifiedTickIcon" alt="verified-tick" class="w-3 h-3">
                </div>
              </div>
              <div class="justify-start text-gray-500 text-xs font-normal font-['Poppins'] leading-4">@jellyf1sh</div>
              <div class="justify-start text-gray-500 text-xs font-normal font-['Poppins'] leading-4">Jul 31</div>
            </div>
            <div class="self-stretch min-h-10 p-1 relative bg-blue-50 rounded-xs outline outline-1 outline-offset-[-0.50px] outline-blue-600 inline-flex justify-center items-center gap-2.5">
              <div class="flex-1 inline-flex flex-col justify-start items-center gap-2.5">
                <div class="self-stretch justify-start text-black text-base font-normal leading-7 whitespace-pre-line">{{ previewMessage }}</div>
              </div>
              <div class="w-20 pb-6 right-0 top-[-25px] absolute inline-flex flex-col justify-start items-start gap-2.5">
                <div class="self-stretch min-w-14 px-2 py-1 bg-blue-600 inline-flex justify-center items-center gap-2 cursor-pointer" @click="handleEditMessage">
                  <div  class="relative">
                    <img :src="EditPencilIcon" alt="edit-pencil" class="w-4 h-4">
                  </div>
                  <div class="text-center justify-start text-white text-xs font-semibold font-['Poppins'] capitalize tracking-tight">Edit...</div>
                </div>
              </div>
            </div>
          </div>
          <div class="self-stretch min-h-10 p-1 relative bg-blue-50 rounded-xs outline outline-1 outline-offset-[-0.50px] outline-blue-600 inline-flex justify-center items-center gap-2.5">
            <div class="w-full" :data-uploader-name="uploaderName">
              <!-- Uploaded image preview with remove button -->
              <div v-if="localMedia" class="relative mb-2">
                <img
                  :src="localMedia"
                  alt="X post image preview"
                  class="w-full rounded-xl object-cover max-h-40"
                />
                <button
                  type="button"
                  class="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 hover:bg-red-700 flex items-center justify-center transition-colors"
                  aria-label="Remove image"
                  @click="localMedia = ''"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
              <!-- Uploader shown only when no image uploaded yet -->
              <ThumbnailUploaderNay
                v-if="!localMedia"
                :input-name="uploaderName"
                custom-class="cursor-pointer border-2 border-transparent bg-black/5 rounded-xl p-4 h-[7.875rem] flex flex-col items-center justify-center hover:border-gray-900 hover:bg-black/10"
                input-wrapper-class="border-2 border-dashed border-transparent !gap-1"
                button-wrapper-class="shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] rounded-lg h-10 w-10 relative flex justify-center items-center"
                button-icon-wrapper-class="cursor-pointer shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] bg-green-500 rounded-lg h-10 w-10 flex justify-center items-center hover:bg-black"
                button-parent-wrapper-class="flex flex-col items-center justify-center gap-3"
                button-text="Click to upload"
                button-text-class="font-semibold text-gray-900 cursor-pointer"
                drop-text=" or drag and drop"
                drop-text-class="text-sm font-normal leading-5 text-gray-500 text-center"
                custom-allowed-types="SVG, PNG, JPG or GIF"
                custom-max-size="800x400px"
                eenable-image-compression="true"
                format-text-class="text-gray-500 text-xs leading-[1.125rem] text-center mb-0"
                @media-urls-updated="handleMediaUrlsUpdated"
              />
            </div>
            <!-- Upload button shown only when no image uploaded yet -->
            <div v-if="!localMedia" class="size- pb-6 right-0 top-[-25px] absolute inline-flex flex-col justify-start items-start">
              <div class="self-stretch min-w-14 px-2 py-1 bg-blue-600 inline-flex justify-center items-center gap-2 cursor-pointer">
                <div class="relative">
                  <img src="https://fansocial.app/wp-content/plugins/fansocial/assets/icons/svg/upload-cloud-02.svg" class="w-4 h-4 invert"/>
                </div>
                <div class="text-center justify-start text-white text-xs font-semibold font-['Poppins'] capitalize tracking-tight">Upload thumbnail</div>
                <div>
                  <img :src="ChevronDownFill"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ValidationInlineWarning
        :messages="editImpactMessages(localMedia, baselineMediaValue)"
        purpose="edit-impact"
        spacing-class="mt-1.5"
      />
    </div>
  </div>
  <div class="self-stretch flex fixed md:relative left-0 px-2 md:px-0 bottom-2 w-full md:w-auto">
    <div class="self-stretch h-10 min-w-24 px-6 py-2 bg-[#07F468] inline-flex justify-center items-center gap-2.5 cursor-pointer w-full" data-popup-close @click="handleSave">
      <div class="justify-start text-gray-900 text-base font-medium font-['Poppins'] leading-6">SAVE</div>
    </div>
  </div>
</div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from "vue";

import CheckboxSwitch from "@/components/dev/checkbox/CheckboxSwitch.vue";
import VerifiedTickIcon from "@/assets/images/icons/verified-blue-white.webp" 
import AiArtIcon from "@/assets/images/icons/ai-art.webp" 
import ChevronDownFill from "@/assets/images/icons/chevron-down-fill.webp"
import EditPencilIcon from "@/assets/images/icons/edit-pencil.webp"
import ThumbnailUploaderNay from "@/components/ui/global/media/uploader/HelperComponents/ThumbnailUploaderNay.vue"
import ValidationInlineWarning from "@/components/ui/form/BookingForm/HelperComponents/ValidationInlineWarning.vue";
import { useBookingTranslations } from "@/i18n/bookingTranslations.js";
import { editWarningValuesEqual } from "@/components/ui/form/BookingForm/editWarningUtils.js";

const { t } = useBookingTranslations();

const props = defineProps({
  title: {
    type: String,
    default: "X Repost Settings"
  },
  checkboxLabel: {
    type: String,
    default: "Post to X"
  },
  modelValue: {
    type: Boolean,
    default: false
  },
  messageValue: {
    type: String,
    default: ""
  },
  mediaValue: {
    type: String,
    default: ""
  },
  inputName: {
    type: String,
    default: ""
  },
  textareaName: {
    type: String,
    default: ""
  },
  uploaderName: {
    type: String,
    default: ""
  },
  isEditMode: {
    type: Boolean,
    default: false,
  },
  baselineModelValue: {
    type: Boolean,
    default: false,
  },
  baselineMessageValue: {
    type: String,
    default: "",
  },
  baselineMediaValue: {
    type: String,
    default: "",
  }
});

const emit = defineEmits(["update:modelValue", "update:messageValue", "update:mediaValue", "save"]);

const localMessage = ref(String(props.messageValue || ""));
const localMedia = ref(String(props.mediaValue || ""));
const messageTextareaRef = ref(null);

const DEFAULT_PREVIEW_MESSAGE = "I have a new event coming up. Limited seats available. Join now!";

function editImpactMessages(currentValue, baselineValue) {
  return props.isEditMode && !editWarningValuesEqual(currentValue, baselineValue)
    ? [t("booking_future_bookings_warning")]
    : [];
}

const previewMessage = computed(() => {
  const message = String(localMessage.value || "").trim();
  return message || DEFAULT_PREVIEW_MESSAGE;
});

const checkboxModel = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit("update:modelValue", Boolean(value));
  },
});

watch(() => props.messageValue, (value) => {
  localMessage.value = String(value || "");
});

watch(() => props.mediaValue, (value) => {
  localMedia.value = String(value || "");
});

function handleMediaUrlsUpdated(mediaUrls) {
  if (Array.isArray(mediaUrls) && mediaUrls.length > 0) {
    localMedia.value = String(mediaUrls[0] || "");
    return;
  }
  if (typeof mediaUrls === "string") {
    localMedia.value = mediaUrls;
    return;
  }
  localMedia.value = "";
}

function handleEditMessage() {
  nextTick(() => {
    const textarea = messageTextareaRef.value;
    if (!textarea || typeof textarea.focus !== "function") {
      return;
    }

    textarea.focus();
    if (typeof textarea.setSelectionRange === "function") {
      const textLength = String(localMessage.value || "").length;
      textarea.setSelectionRange(textLength, textLength);
    }
  });
}

function handleSave() {
  emit("update:messageValue", String(localMessage.value || ""));
  emit("update:mediaValue", String(localMedia.value || ""));
  emit("save", {
    enabled: Boolean(props.modelValue),
    message: String(localMessage.value || ""),
    mediaUrl: String(localMedia.value || ""),
  });
}
</script>
