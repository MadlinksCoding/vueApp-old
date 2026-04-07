<script setup>
import { ref, reactive } from "vue";
import PopupHandler from "./PopupHandler.vue";
import Spinner from "../spinner/Spinner.vue";
import CustomDropdown from "../dropdown/CustomDropdown.vue";
import ThumbnailUploader from "../global/media/uploader/HelperComponents/ThumbnailUploader.vue";
import CancelUploadPopup from "@/components/editProfilePageComponents/CancelUploadPopup.vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Object,
    default: () => ({}),
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

const showAddTracking = ref(false);
const activeTab = ref('upload-screenshot');
const courierData = ref('');
const trackingNumber = ref('');

// --- New state for shipping details ---
const isShippingDetailsAdded = ref(false);
const shippingMethod = ref(''); // 'screenshot' or 'manual'
const showNotification = ref(false);

const handleUpdateDetails = () => {
  if (activeTab.value === 'upload-screenshot' && !uploader.state.thumbnailUrl) return;
  if (activeTab.value === 'enter-input' && (!courierData.value || !trackingNumber.value)) return;

  isShippingDetailsAdded.value = true;
  shippingMethod.value = activeTab.value === 'upload-screenshot' ? 'screenshot' : 'manual';
  showAddTracking.value = false;
  
  // Show notification
  showNotification.value = true;
  setTimeout(() => {
    showNotification.value = false;
  }, 4000);
};

const handleEditShippingDetails = () => {
  isShippingDetailsAdded.value = false;
  showAddTracking.value = true;
};

const courierOptions = [
  { label: 'DHL', value: 'dhl' },
  { label: 'FedEx', value: 'fedex' },
  { label: 'UPS', value: 'ups' },
];

const uploader = reactive({
  state: {
    uploadedThumbnailFile: null,
    thumbnailUrl: null
  },
  setState(key, value) {
    this.state[key] = value;
  }
});

const deleteImage = () => {
  uploader.state.thumbnailUrl = null;
  uploader.state.uploadedThumbnailFile = null;
};

const cancelUploadPopupOpen = ref(false);
const confirmAction = ref(""); // "delete" or "leave"

const handlePopupConfirm = () => {
  if (confirmAction.value === "delete") {
    deleteImage();
  } else if (confirmAction.value === "leave") {
    deleteImage();
    showAddTracking.value = false;
  }
};

const triggerDeletePopup = () => {
  confirmAction.value = "delete";
  cancelUploadPopupOpen.value = true;
};

const triggerLeavePopup = () => {
  if (uploader.state.thumbnailUrl) {
    confirmAction.value = "leave";
    cancelUploadPopupOpen.value = true;
  } else {
    showAddTracking.value = false;
  }
};

const popupConfig = {
  actionType: "slidein",
  from: "right",
  offset: "0px",
  speed: "250ms",
  effect: "ease-in-out",
  showOverlay: false,
  closeOnOutside: true,
  lockScroll: false,
  escToClose: true,
  width: { default: "30rem", "<768": "100%" },
  height: { default: "100%" },
  scrollable: false,
  closeSpeed: "250ms",
  closeEffect: "cubic-bezier(0.4, 0, 0.2, 1)",
};
</script>

<template>
  <PopupHandler :model-value="modelValue" @update:model-value="(val) => emit('update:modelValue', val)"
    :config="popupConfig">
    <div id="orderDetailsContent" class="relative flex flex-col h-full bg-[#F9FAFB]/90 dark:bg-[#1b1d1e]/90 font-sans overflow-y-auto">
      <!-- popup-header -->
      <div class="flex border-b border-[#D0D5DD] dark:border-[#3b4043] sticky top-0 z-10 bg-inherit backdrop-blur-md">
        <!-- icon-container -->
        <div class="flex justify-center items-center w-14 h-14 bg-black dark:bg-[#181a1b] shrink-0">
          <img src="https://i.ibb.co.com/RGtnmtYZ/merch.webp" alt="merch" class="w-9 h-9" />
        </div>

        <div class="flex gap-1 p-2 grow">
          <div class="flex flex-col gap-1 grow">
            <h3 class="text-xs leading-normal font-semibold text-black dark:text-[#e8e6e3]">
              Order{{ order?.orderNum }}
            </h3>
            <p class="text-xs leading-normal text-[#667085] dark:text-[#655e53]">
              Received on {{ order?.date }}
            </p>
          </div>

          <button @click="emit('update:modelValue', false)"
            class="flex justify-center items-center w-6 h-6 bg-transparent outline-none border-none cursor-pointer">
            <img src="https://i.ibb.co.com/DfT6Sg5g/x-close.webp" alt="x close"
              class="w-6 h-6 [filter:brightness(0)_saturate(100%)_invert(71%)_sepia(12%)_saturate(384%)_hue-rotate(179deg)_brightness(90%)_contrast(83%)]" />
          </button>
        </div>
      </div>

      <!-- loading-spinner -->
      <div v-if="loading" class="flex flex-col justify-center items-center grow py-20">
        <Spinner src="https://i.ibb.co.com/TM7mTrZJ/spinner.webp" size="3xl" />
      </div>

      <div v-else class="flex flex-col h-full">

      <!-- pending-shipping-section -->
      <section v-if="!showAddTracking && !isShippingDetailsAdded" class="flex flex-col gap-2 p-2 bg-[#07F468] md:p-4 dark:bg-[#06c454]">
        <h2 class="text-base font-semibold text-[#0C111D] dark:text-[#dbd8d3]">Pending Shipping</h2>
        <p class="text-sm text-[#0C111D] dark:text-[#dbd8d3]">
          Please add tracking details to this order when item(s) is shipped.
        </p>
        <button
          @click="showAddTracking = true"
          class="flex justify-center items-center gap-2.5 px-2 py-1 bg-black group/button hover:bg-[#07F468] dark:bg-[#181a1b] dark:hover:bg-[#06c454]">
          <img src="https://i.ibb.co.com/S4bDBh8V/location.webp" alt="location"
            class="w-5 h-5 group-hover/button:[filter:brightness(0)]" />
          <span
            class="text-base font-medium text-[#07F468] group-hover/button:text-black dark:text-[#23f97b] dark:group-hover/button:text-[#e8e6e3]">Add
            Tracking Details</span>
        </button>
      </section>

      <!-- add-tracking-details-section -->
      <div v-else-if="showAddTracking && !isShippingDetailsAdded" class="flex flex-col gap-4 px-2 py-4 border-b border-[#D0D5DD] bg-[#EAECF0] md:p-4 dark:border-[#3b4043] dark:bg-[#222526]">
        <div class="flex justify-between items-center gap-2">
            <span class="text-lg leading-normal font-semibold tracking-[0.01125rem] text-[#303437] dark:text-[#b1aba0]">Add Tracking Details</span>
        
            <img @click="triggerLeavePopup" src="https://i.ibb.co.com/DfT6Sg5g/x-close.webp" alt="x close" class="w-6 h-6 cursor-pointer [filter:brightness(0)_saturate(100%)_invert(71%)_sepia(12%)_saturate(384%)_hue-rotate(179deg)_brightness(90%)_contrast(83%)]">
        </div>

        <div class="flex flex-col gap-4">
            <!-- tab-buttons -->
            <ul v-if="!uploader.state.thumbnailUrl" class="flex w-full whitespace-nowrap rounded-[0.3125rem] overflow-hidden border border-[#D0D5DD] bg-[#F9FAFB] dark:border-[#3b4043] dark:bg-[#1b1d1e]">
                <li @click="activeTab = 'upload-screenshot'" :class="{ 'active': activeTab === 'upload-screenshot' }" class="flex flex-1 justify-center items-center gap-2 border-r border-[#D0D5DD] cursor-pointer group/tab [&.active]:bg-[#0C111D] md:min-h-[2.5rem] dark:border-[#3b4043] dark:[&.active]:bg-[#162036]">
                    <div class="w-full flex justify-center items-center gap-1 p-2 md:gap-2">
                        <img src="https://i.ibb.co.com/YTZ7WYpZ/upload.webp" alt="upload" class="w-4 h-4 [filter:brightness(0)_saturate(100%)_invert(65%)_sepia(5%)_saturate(982%)_hue-rotate(179deg)_brightness(101%)_contrast(84%)] group-[.active]/tab:[filter:brightness(0)_saturate(100%)_invert(100%)_sepia(32%)_saturate(1007%)_hue-rotate(169deg)_brightness(109%)_contrast(100%)] md:w-5 md:h-5">
                        <span class="text-xs leading-normal font-medium text-[#98A2B3] whitespace-nowrap group-[.active]/tab:text-white group-[.active]/tab:font-semibold md:text-sm dark:text-[#b0a99e] dark:group-[.active]/tab:text-[#e8e6e3]">Upload Screenshot</span>
                    </div>
                </li>

                <li @click="activeTab = 'enter-input'" :class="{ 'active': activeTab === 'enter-input' }" class="flex flex-1 justify-center items-center gap-2 cursor-pointer group/tab [&.active]:bg-[#0C111D] md:min-h-[2.5rem] dark:border-[#3b4043] dark:[&.active]:bg-[#162036]">
                    <div class="w-full flex justify-center items-center gap-1 p-2 md:gap-2">
                        <img src="https://i.ibb.co.com/cSdH2zcx/enter-input.webp" alt="enter input" class="w-4 h-4 [filter:brightness(0)_saturate(100%)_invert(65%)_sepia(5%)_saturate(982%)_hue-rotate(179deg)_brightness(101%)_contrast(84%)] group-[.active]/tab:[filter:brightness(0)_saturate(100%)_invert(100%)_sepia(32%)_saturate(1007%)_hue-rotate(169deg)_brightness(109%)_contrast(100%)] md:w-5 md:h-5">
                        <span class="text-xs leading-normal font-medium text-[#98A2B3] whitespace-nowrap group-[.active]/tab:text-white group-[.active]/tab:font-semibold md:text-sm dark:text-[#b0a99e] dark:group-[.active]/tab:text-[#e8e6e3]">Enter Details Manually</span>
                    </div>
                </li>
            </ul>

            <!-- tab-container -->
            <div class="flex flex-col gap-4">
                <div v-if="activeTab === 'upload-screenshot'" class="flex">
                    <ThumbnailUploader 
                        v-if="!uploader.state.thumbnailUrl"
                        :uploader="uploader"
                        title="Click to upload"
                        subtitle="or drag and drop"
                        fileInfo="SVG, PNG, JPG or GIF (max. 800x400px)"
                        class="!h-[7.875rem] w-full"
                    >
                        <template #icon>
                            <img src="https://i.ibb.co.com/9JDWMW1/upload-03.webp" alt="upload 03" class="w-5 h-5 [filter:brightness(0)] group-hover:[filter:brightness(0)_saturate(100%)_invert(65%)_sepia(22%)_saturate(4910%)_hue-rotate(97deg)_brightness(113%)_contrast(94%)]">
                        </template>
                    </ThumbnailUploader>

                    <!-- uploaded-image -->
                    <div v-else class="w-full h-[11.875rem] rounded-[0.3125rem] relative shadow-[0px_0px_2px_0px_#00000040] overflow-hidden">
                        <img :src="uploader.state.thumbnailUrl" alt="uploaded-image" class="w-full h-full object-cover">
                    
                        <!-- delete-button -->
                        <div @click="triggerDeletePopup" class="flex justify-center items-center absolute top-0 right-0 z-[3] w-6 h-6 group/button cursor-pointer bg-[#ff4405] hover:bg-[#ff692e] dark:bg-[#c93300] dark:hover:bg-[#b03200]">
                            <img src="https://i.ibb.co.com/YMvbDsR/trash-03.webp" alt="trash-03" class="w-5 h-5 [filter:brightness(100)_saturate(0)]"/>
                        </div>
                    </div>
                </div>

                <div v-if="activeTab === 'enter-input'" class="flex flex-col gap-4">
                    <div class="flex flex-col gap-1.5">
                        <span class="text-sm font-medium text-[#667085] dark:text-[#655e53]">Courier</span>

                        <!-- CustomDropdown integration -->
                        <div class="relative w-full h-10">
                            <CustomDropdown
                              v-model="courierData"
                              :options="courierOptions"
                              placeholder="Select Courier"
                              buttonClass="h-10 flex justify-between items-center gap-2 px-3 bg-white/50 border-b border-[#D0D5DD] rounded-t-sm shadow-[0px_1px_2px_0px_#1018280D] dark:bg-[#181a1b]/50 dark:border-[#3b4043] w-full"
                              dropdownClass="absolute right-0 w-full transition-all duration-300 z-10 top-[calc(100%+0.5rem)] shadow-none border-none bg-white/70 backdrop-blur-[25px] rounded-[2px] max-h-[245px] overflow-y-auto dark:bg-[#181a1bb3]"
                            >
                                <template #trigger="{ selected }">
                                    <span class="text-sm leading-normal font-medium capitalize tracking-[0.01875rem] whitespace-nowrap"
                                          :class="selected ? 'text-[#101828] dark:text-[#d6d3cd]' : 'text-[#667085] dark:text-[#655e53]'">
                                        {{ courierOptions.find(o => o.value === selected)?.label || 'Select Courier' }}
                                    </span>
                                </template>

                                <template #option="{ option, isSelected }">
                                    <div class="flex items-center gap-2 h-12 px-3 border-b border-[#EAECF0] cursor-pointer hover:bg-white dark:hover:bg-[#181a1b] dark:border-[#353a3c]"
                                         :class="{ 'bg-white dark:bg-[#181a1b]': isSelected }">
                                        <span class="text-sm font-medium" 
                                              :class="isSelected ? 'text-[#101828] dark:text-[#d6d3cd]' : 'text-[#667085] dark:text-[#655e53]'">
                                            {{ option.label }}
                                        </span>
                                    </div>
                                </template>
                            </CustomDropdown>
                        </div>
                    </div>

                    <div class="flex flex-col gap-1.5">
                        <span class="text-sm font-medium text-[#667085] dark:text-[#655e53]">Tracking Number/ID</span>

                        <!-- input-container -->
                        <div class="w-full h-10 flex items-center gap-2 px-3 bg-white/50 border-b border-[#D0D5DD] rounded-t-sm shadow-[0px_1px_2px_0px_#1018280D] dark:bg-[#181a1b]/50 dark:border-[#3b4043]">
                            <input v-model="trackingNumber" type="text" placeholder="" class="text-base bg-transparent border-none outline-none w-full min-w-0 text-[#101828] placeholder:text-[#667085] dark:text-[#d6d3cd] dark:placeholder:text-[#9e9689]">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bottom Action Section -->
            <div v-if="uploader.state.thumbnailUrl || activeTab === 'enter-input'" class="flex flex-col gap-4 text-center mt-2">
                <button @click="handleUpdateDetails" class="flex justify-center items-center w-full h-10 px-6 bg-[#07F468] group/button hover:bg-[#0c111d] dark:bg-[#0aff78] dark:hover:bg-[#162036]">
                    <span class="text-base font-medium text-[#0c111d] group-hover/button:text-[#07F468] dark:text-[#dbd8d3] dark:group-hover/button:text-[#23f97b]">Update detail</span>
                </button>

                <p class="text-sm leading-6 text-[#5F6369] dark:text-[#a9a296]">We will share these information to @fan </p>
            </div>
        </div>
      </div>

      <!-- shipping-details -->
      <div class="flex flex-col gap-4 px-2 py-4 md:px-4 md:py-6">
        <!-- from -->
        <div class="flex items-start gap-2">
          <img src="https://i.ibb.co.com/9kSNFDsp/Users.webp" alt="Users" class="w-4 h-4" />

          <div class="flex flex-col gap-1">
            <span class="text-xs leading-normal text-[#667085] dark:text-[#655e53]">From</span>

            <div class="flex items-center gap-2">
              <div class="flex items-center gap-1 self-stretch">
                <img src="https://i.ibb.co.com/jkjtwC9C/svgviewer-png-output-17.webp" alt="avatar"
                  class="w-5 h-5 rounded-full" />
                <span class="text-sm text-[#344054] dark:text-[#bdb7af]">@mangoes</span>
              </div>

              <span class="text-xs leading-normal text-[#98A2B3] dark:text-[#b0a993]">email@email.com</span>
            </div>
          </div>
        </div>

        <!-- ship to -->
        <div class="flex items-start gap-2">
          <img src="https://i.ibb.co.com/v4tpXWd1/location-1.webp" alt="location 1" class="w-4 h-4" />

          <div class="flex flex-col gap-1">
            <span class="text-xs leading-normal text-[#667085] dark:text-[#655e53]">Ship to</span>

            <p class="text-sm text-black dark:text-[#e8e6e3]">
              101 S Chicago Ave. Portales, New York, 88130
            </p>
          </div>
        </div>

        <!-- notes from buyer -->
        <div class="flex items-start gap-2">
          <img src="https://i.ibb.co.com/sdq4sD9r/files-green.webp" alt="files green" class="w-4 h-4" />

          <div class="flex flex-col gap-1 grow">
            <span class="text-xs leading-normal text-[#667085] dark:text-[#655e53]">Notes from buyer</span>

            <p class="text-sm text-black dark:text-[#e8e6e3]">
              Here is some order notes Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              Curabitur quis tortor at sem luctus blandit ac ac tortor. Vivamus lobortis.
            </p>
          </div>
        </div>

        <!-- shipping information summary (Variant 1: Screenshot) -->
        <div v-if="isShippingDetailsAdded && shippingMethod === 'screenshot'" class="flex items-start gap-2">
            <img src="https://i.ibb.co.com/sdq4sD9r/files-green.webp" alt="files green" class="w-4 h-4">

            <div class="flex flex-col gap-1 grow">
                <span class="text-xs leading-normal text-[#667085] dark:text-[#655e53]">Shipping Information</span>

                <!-- uploaded-image -->
                <div class="w-full h-[11.875rem] rounded-[0.3125rem] relative shadow-[0px_0px_2px_0px_#00000040] overflow-hidden">
                    <img :src="uploader.state.thumbnailUrl" alt="auth-bg" class="w-full h-full object-cover">
                
                    <!-- edit-button -->
                    <div @click="handleEditShippingDetails" class="flex justify-center items-center gap-2.5 absolute top-0 right-0 z-[3] w-max px-2 py-1 group/button cursor-pointer bg-black hover:bg-[#07F468] dark:bg-[#181a1b] dark:hover:bg-[#06c454]">
                        <img src="https://i.ibb.co.com/4gWgDm6F/pen-01.webp" alt="pen 01" class="w-5 h-5 [filter:brightness(0)_saturate(100%)_invert(77%)_sepia(44%)_saturate(5180%)_hue-rotate(94deg)_brightness(110%)_contrast(95%)] group-hover/button:[filter:brightness(0)]">

                        <span class="text-base font-medium text-[#07F468] group-hover/button:text-black dark:text-[#23597b] dark:group-hover/button:text-[#e8e6e3]">EDIT</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- shipping information summary (Variant 2: Manual) -->
        <div v-if="isShippingDetailsAdded && shippingMethod === 'manual'" class="flex items-start gap-1">
            <img src="https://i.ibb.co.com/sdq4sD9r/files-green.webp" alt="files green" class="w-4 h-4">

            <div class="flex flex-col gap-1 grow">
                <span class="text-xs leading-normal text-[#667085] dark:text-[#655e53]">Shipping Information</span>

                <div class="w-full flex items-end gap-2">
                    <div class="flex flex-col gap-1 flex-1">
                        <span class="text-xs leading-normal font-medium whitespace-nowrap text-[#0C111D] dark:text-[#dbd8d3]">Courier</span>

                        <span class="text-xs leading-normal text-black dark:text-[#e8e6e3]">{{ courierOptions.find(o => o.value === courierData)?.label }}</span>
                    </div>

                    <div class="flex flex-col gap-1 flex-1">
                        <span class="text-xs leading-normal font-medium whitespace-nowrap text-[#0C111D] dark:text-[#dbd8d3]">Tracking number/ID</span>

                        <span class="text-xs leading-normal text-black dark:text-[#e8e6e3]">{{ trackingNumber }}</span>
                    </div>

                    <!-- edit-button -->
                    <div @click="handleEditShippingDetails" class="flex justify-center items-center gap-2.5 w-max px-2 py-1 group/button cursor-pointer bg-black hover:bg-[#07F468] dark:bg-[#181a1b] dark:hover:bg-[#06c454]">
                        <img src="https://i.ibb.co.com/4gWgDm6F/pen-01.webp" alt="pen 01" class="w-5 h-5 [filter:brightness(0)_saturate(100%)_invert(77%)_sepia(44%)_saturate(5180%)_hue-rotate(94deg)_brightness(110%)_contrast(95%)] group-hover/button:[filter:brightness(0)]">

                        <span class="text-base font-medium text-[#07F468] group-hover/button:text-black dark:text-[#23597b] dark:group-hover/button:text-[#e8e6e3]">EDIT</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <!-- price-table -->
      <div class="flex flex-col gap-3 px-2 py-4 bg-white md:px-4 dark:bg-[#181a1b] shrink-0">
        <!-- table-row -->
        <div class="flex justify-between">
          <!-- left-column -->
          <div class="flex gap-1 w-1/2">
            <span class="text-xs leading-normal font-semibold text-black dark:text-[#e8e6e3]">3x</span>

            <div class="flex flex-col gap-2">
              <span class="text-xs leading-normal font-medium truncate text-[#0C111D] dark:text-[#dbd8d3]">Mango
                (Taiwan)</span>

              <div class="flex items-center gap-2 overflow-visible">
                <div class="flex items-center gap-1 w-max h-5">
                  <img src="https://i.ibb.co.com/qT1g1tJ/logo-bg-green.webp" alt="logo bg green" class="w-3 h-3" />
                  <span
                    class="text-xs leading-normal font-medium whitespace-nowrap text-[#17B26A] dark:text-[#56e9a5]">10%
                    off merch</span>
                </div>

                <div class="w-0.5 h-0.5 rounded-full bg-[#667085] dark:bg-[#535c6d]"></div>

                <div class="flex items-center gap-1 w-max h-5">
                  <img src="https://i.ibb.co.com/yBSNyYfQ/tag-green.webp" alt="tag green" class="w-3 h-3" />
                  <span
                    class="text-xs leading-normal font-medium whitespace-nowrap text-[#17B26A] dark:text-[#56e9a5]">JENNY2024</span>
                </div>
              </div>
            </div>
          </div>

          <!-- right-column -->
          <div class="flex flex-col gap-1">
            <span class="text-xs leading-normal font-medium text-[#0C111D] dark:text-[#dbd8d3]">USD$ 123.45</span>
            <span
              class="text-[0.625rem] leading-[1.125rem] text-right line-through text-[#667085] dark:text-[#655e53]">USD$
              123.45</span>
          </div>
        </div>

        <!-- table-row -->
        <div class="flex justify-between">
          <!-- left-column -->
          <div class="flex gap-1 w-1/2">
            <span class="text-xs leading-normal font-semibold text-black dark:text-[#e8e6e3]">3x</span>

            <div class="flex flex-col gap-2">
              <span class="text-xs leading-normal font-medium truncate text-[#0C111D] dark:text-[#dbd8d3]">Mango
                (Philippines)</span>

              <div class="flex items-center gap-2 overflow-visible">
                <div class="flex items-center gap-1 w-max h-5">
                  <img src="https://i.ibb.co.com/qT1g1tJ/logo-bg-green.webp" alt="logo bg green" class="w-3 h-3" />
                  <span
                    class="text-xs leading-normal font-medium whitespace-nowrap text-[#17B26A] dark:text-[#56e9a5]">10%
                    off merch</span>
                </div>

                <div class="w-0.5 h-0.5 rounded-full bg-[#667085] dark:bg-[#535c6d]"></div>

                <div class="flex items-center gap-1 w-max h-5">
                  <img src="https://i.ibb.co.com/yBSNyYfQ/tag-green.webp" alt="tag green" class="w-3 h-3" />
                  <span
                    class="text-xs leading-normal font-medium whitespace-nowrap text-[#17B26A] dark:text-[#56e9a5]">JENNY2024</span>
                </div>
              </div>
            </div>
          </div>

          <!-- right-column -->
          <div class="flex flex-col gap-1">
            <span class="text-xs leading-normal font-medium text-[#0C111D] dark:text-[#dbd8d3]">USD$ 123.45</span>
            <span
              class="text-[0.625rem] leading-[1.125rem] text-right line-through text-[#667085] dark:text-[#655e53]">USD$
              123.45</span>
          </div>
        </div>

        <!-- table-row -->
        <div class="flex justify-between">
          <!-- left-column -->
          <div class="flex gap-1 w-1/2">
            <span class="text-xs leading-normal font-semibold text-black dark:text-[#e8e6e3]">3x</span>

            <div class="flex flex-col gap-2 overflow-hidden">
              <span class="text-xs leading-normal font-medium truncate text-[#0C111D] dark:text-[#dbd8d3]">Watch me eat
                10 family size chicken bucket!! You wont’s bel</span>

              <div class="flex items-center gap-2 overflow-visible">
                <div class="flex items-center gap-1 w-max h-5">
                  <img src="https://i.ibb.co.com/qT1g1tJ/logo-bg-green.webp" alt="logo bg green" class="w-3 h-3" />
                  <span
                    class="text-xs leading-normal font-medium whitespace-nowrap text-[#17B26A] dark:text-[#56e9a5]">10%
                    off P2V</span>
                </div>
              </div>
            </div>
          </div>

          <!-- right-column -->
          <div class="flex flex-col gap-1 w-1/2">
            <span class="text-xs leading-normal font-medium text-right text-[#0C111D] dark:text-[#dbd8d3]">USD$
              123.45</span>
            <span
              class="text-[0.625rem] leading-[1.125rem] text-right line-through text-[#667085] dark:text-[#655e53]">USD$
              123.45</span>
          </div>
        </div>

        <!-- subtotal -->
        <div class="flex justify-between items-center pt-2 border-t border-[#EAECF0] dark:border-[#353a3c] mt-auto">
          <span class="text-xs leading-normal text-[#0C111D] dark:text-[#dbd8d3]">Subtotal</span>
          <span class="text-xs leading-normal text-[#0C111D] dark:text-[#dbd8d3]">USD$ 370.35</span>
        </div>

        <!-- total discount -->
        <div class="flex justify-between items-center">
          <span class="text-xs leading-normal text-[#0C111D] dark:text-[#dbd8d3]">Total Discount</span>
          <div class="flex justify-center items-center px-1 h-5 rounded-[1.25rem] bg-[#DCFAE6] dark:bg-[#094226]">
            <span class="text-xs leading-normal font-medium text-[#067647] dark:text-[#7cf8c4]">-USD$ 32.45</span>
          </div>
        </div>

        <!-- total -->
        <div class="flex justify-between items-center pt-2 border-t border-[#EAECF0] dark:border-[#353a3c]">
          <span class="text-xs leading-normal font-semibold text-[#0C111D] dark:text-[#dbd8d3]">Total</span>
          <span class="text-lg font-semibold text-[#0C111D] dark:text-[#dbd8d3]">USD$ 337.9</span>
        </div>
        </div>
      </div>
      <!-- Cancel Upload Popup -->
      <CancelUploadPopup 
        v-model="cancelUploadPopupOpen"
        :message="confirmAction === 'delete' 
          ? 'Are you sure you want to delete your screenshot?' 
          : 'Are you sure you want to leave? Your changes will not be saved.'"
        @delete="handlePopupConfirm"
        :teleportTo="'#orderDetailsContent'"
        :isAbsolute="true"
      />
    </div>

    <!-- success notification -->
    <Transition name="slide-fade">
      <div v-if="showNotification" class="fixed top-2 right-0 w-full max-w-[29rem] md:max-w-[28.8125rem] sm:right-2 z-[9999]">
          <div class="w-full min-h-[4rem] border-b-[0.5px] border-b-[#EAECF0] border-l-[3px] border-l-[#2ED3B7] bg-white shadow-xl">
              <div class="w-full h-full [background:linear-gradient(0deg,rgba(46,211,183,0.15),rgba(46,211,183,0.15))]">
                  <div class="flex gap-4 px-2 py-3 w-full h-full [background:linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.9)_100%)]">
                      <div class="w-10 h-10 min-w-[2.5rem] flex justify-center items-center overflow-visible bg-[#2ED3B7]/10 rounded-lg relative">
                          <img src="https://i.ibb.co.com/RGtnmtYZ/merch.webp" alt="merch" class="w-7 h-7 [filter:brightness(0)_saturate(100%)_invert(78%)_sepia(28%)_saturate(1150%)_hue-rotate(112deg)_brightness(92%)_contrast(79%)]">
                      
                          <div class="absolute -bottom-2 -right-3 w-[1.375rem] h-[1.375rem] flex justify-center items-center bg-[#2ED3B7] rounded-lg">
                              <img src="https://i.ibb.co.com/S4bDBh8V/location.webp" alt="location" class="w-4 h-4 [filter:brightness(0)_saturate(100%)_invert(100%)_sepia(99%)_saturate(0%)_hue-rotate(265deg)_brightness(108%)_contrast(100%)]">
                          </div>
                      </div>
                      
                      <div class="flex flex-col grow">
                          <div class="flex items-start justify-between gap-2 pb-2">
                              <div class="pt-1 pr-1">
                                  <h3 class="text-sm font-semibold text-[#107569]">Tracking Details added to Order {{ order?.orderNum }}</h3>
                              </div>

                              <button @click="showNotification = false" class="flex justify-center items-center w-6 h-6 min-w-[1.5rem] bg-transparent outline-none border-none cursor-pointer">
                                  <img src="https://i.ibb.co.com/DfT6Sg5g/x-close.webp" alt="x close" class="w-6 h-6 [filter:brightness(0)_saturate(100%)_invert(95%)_sepia(5%)_saturate(387%)_hue-rotate(185deg)_brightness(87%)_contrast(99%)]">
                              </button>
                          </div>
                          <div class="flex">
                              <p class="text-sm text-black">@mangoes will be notified of this update.</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </Transition>
  </PopupHandler>
</template>

<style scoped>
/* slide-fade transition for notification */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
/* Hidden scrollbar */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
