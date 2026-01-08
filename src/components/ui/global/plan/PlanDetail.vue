<script setup>
import NotificationCard from '@/components/dev/card/notification/NotificationCard.vue';
import CheckboxSwitch from '@/components/dev/checkbox/CheckboxSwitch.vue';
import BaseInput from '@/components/dev/input/BaseInput.vue';
import { onMounted, ref, watch } from 'vue';
import Quill from 'quill';
import 'quill/dist/quill.snow.css'; // Make sure CSS is imported

const props = defineProps({
  publishFlow: {
    type: Object,
    required: true,
  },
});

const quillEditor = ref(null);
let dashQuill = null;

onMounted(() => {
  // 1. Custom Icons Setup
  const icons = Quill.import('ui/icons');
  icons['bold'] = '<img src="https://i.ibb.co/HLRRqmHp/bold-icon.webp" alt="bold" style="width:30px;">';
  icons['italic'] = '<img src="https://i.ibb.co/QvdPyg67/italic-icon.webp" alt="italic" style="width:30px;">';
  icons['link'] = '<img src="https://i.ibb.co/gZ7JLJ28/link-icon.webp" alt="link" style="width:30px;">';
  icons['list']['ordered'] = '<img src="https://i.ibb.co/Q7WRxw9Y/list-ol-icon.webp" alt="ol" style="width:30px;">';
  icons['list']['bullet'] = '<img src="https://i.ibb.co/rfH1rbT7/list-ul-icon.webp" alt="ul" style="width:30px;">';

  // 2. Initialize Quill
  dashQuill = new Quill(quillEditor.value, {
    modules: {
      toolbar: [
        ['bold', 'italic', 'link', { 'list': 'ordered' }, { 'list': 'bullet' }]
      ]
    },
    placeholder: "Tier Description...",
    theme: 'snow'
  });

  // 3. ✅ FIX: Load Content via JS (Not HTML)
  // Agar publishFlow me description hai to wo load karein, warna default text
  const initialText = props.publishFlow.state?.description || "Welcome to Jenny’s basic lounge. You will get the most basic things in this tier.";
  dashQuill.root.innerHTML = initialText;

  // 4. Update Parent State on Change
  dashQuill.on('text-change', () => {
    // Yahan aap parent state update kar sakte hain
    if(props.publishFlow.setState) {
        props.publishFlow.setState('description', dashQuill.root.innerHTML);
    }
  });

  // --- STYLING LOGIC ---
  const container = quillEditor.value.closest('.tier-description-quill-container');
  
  // Toolbar Styling
  const toolbar = container.querySelector('.ql-toolbar.ql-snow');
  if (toolbar) {
    toolbar.classList.add('!border-0', 'dark:!border-[#3b4043]', '!px-0', '!pt-0', '!pb-2');
    
    // Fix buttons spacing and hover
    toolbar.querySelectorAll('button').forEach(b => {
      b.classList.add('!w-5', '!h-8', '!p-0', 'rounded', 'hover:!bg-[#F9FAFB]', 'dark:hover:!bg-[#323232]');
    });
  }

  // Editor Container Styling (Remove default border)
  const editorContainer = container.querySelector('.ql-container.ql-snow');
  if (editorContainer) {
    editorContainer.classList.add('!border-0', '!font-sans', '!text-base');
  }

  // Editor Area Styling
  const editor = container.querySelector('.ql-editor');
  if (editor) {
    editor.classList.add('!px-0', '!py-2', '!text-[#101828]', 'dark:!text-[#dbd8d3]', 'min-h-[80px]');
  }
});

const isFeaturedTier = ref(false);
const selectedBgImage = ref(null);
const fileInputRef = ref(null); // Reference for the hidden input

const openGallery = () => {
  fileInputRef.value.click();
};

const handleFileChange = (event) => {
  const file = event.target.files[0];
  
  if (file) {
    selectedBgImage.value = URL.createObjectURL(file);
  }
};

// 3. Image remove
const removeImage = () => {
  selectedBgImage.value = null;
  if (fileInputRef.value) {
    fileInputRef.value.value = ''; 
  }
};

function handleTier(val) {
  props.publishFlow.goToSubstep(val);
}

const tierName = ref("Basic Lounge ❤️️️");
</script>

<template>
    <div class="flex flex-col gap-6 grow md:gap-8 md:pb-6 xl:pb-20">
                    <!-- tier-information-section -->
                    <section class="flex flex-col gap-4 px-2 py-4 bg-white/25 backdrop-blur-[25px] md:gap-6 md:p-4 dark:bg-[#181a1b40]">
                        <h2 class="text-xl leading-normal font-semibold text-[#667085] dark:text-[#9e9689]">Tier information</h2>

                        <!-- tier-name input-field -->
                        <div class="flex flex-col gap-1.5">
                            <!-- input-container -->
                            <BaseInput
                         type="text"
                        v-model="tierName" 
                        placeholder="Tier Name..."
                        inputClass="w-full h-11 flex px-3.5 bg-white/30 border-b border-[#D0D5DD] rounded-t-sm shadow-[0px_1px_2px_0px_#1018280D] dark:bg-[#181a1b4d] dark:border-[#3b4043] text-base bg-transparent border-none outline-none text-[#101828] placeholder:text-[#667085] dark:text-[#d6d3cd] dark:placeholder:text-[#9e9689]"
                        />                
                        </div>

                        <!-- tier-description textarea field -->
                         <div class="flex flex-col gap-1.5">
                            <!-- Textarea with Quills library -->
                              <div class="tier-description-quill-container flex flex-col px-3.5 py-2.5 border-b border-[#D0D5DD] rounded-t-sm shadow-sm bg-white/30 w-full dark:bg-[#181a1b4d] dark:border-[#3b4043]">
    
    <div ref="quillEditor"></div>

  </div>
                        </div>

                        <!-- background-image uploader section -->
                        <section class="flex flex-col gap-2">
                        <h3 class="text-base font-semibold text-[#0C111D] md:text-lg md:font-medium dark:text-[#dbd8d3]">Background Image</h3>
                        <input 
                        type="file" 
                        ref="fileInputRef" 
                        class="hidden" 
                        accept="image/jpeg, image/png"
                        @change="handleFileChange"
                        />

                        <div 
                        v-if="!selectedBgImage"
                        @click="openGallery"
                        class="cursor-pointer border-2 border-transparent bg-[rgba(0,0,0,0.05)] rounded-lg p-10 h-[12.1875rem] w-full flex flex-col items-center justify-center hover:border-[#0c111d] dark:hover:border-[#857c6d] hover:bg-[rgba(0,0,0,0.10)] dark:hover:bg-[rgba(0,0,0,0.05)] group"
                        >
                        <div class="gap-2 w-full flex flex-col justify-center items-center self-stretch border-2 border-dashed border-transparent">
                            <img src="https://i.ibb.co/twQ2CzCL/Images.webp" alt="Images" class="w-10 h-10 [filter:brightness(0)] dark:[filter:brightness(100%)]">
                            <h4 class="text-sm font-semibold text-center text-[#0C111D] dark:text-[#dbd8d3]">
                            <span class="text-sm font-semibold underline text-[#0C111D] dark:text-[#dbd8d3]">Click here</span> to select image or drag and drop image here 
                            </h4>
                            <p class="text-[#333333] text-sm leading-normal font-medium text-center tracking-[0.00875rem] opacity-70 dark:text-[#c8c3bc]">(Allowed formats: JPEG, PNG. Max size: 10MB)</p>
                        </div>
                        </div>

                        <div v-else class="w-full">
                        <div class="relative w-[7.876rem] h-[12.5625rem] overflow-hidden">
                            <img :src="selectedBgImage" alt="Selected Background" class="h-full w-auto object-cover">
                            <button 
                            @click="removeImage"
                            class="absolute top-0 right-0 w-6 h-6 flex justify-center items-center bg-[#FF0066] cursor-pointer hover:bg-[#FDB022] dark:bg-[#cc0052] dark:hover:bg-[#b77702]"
                            >
                            <img src="https://i.ibb.co.com/YMvbDsR/trash-03.webp" alt="trash" class="w-5 h-5">
                            </button>
                        </div>
                        </div>

                        </section>

                        <!-- featured tier toggle section -->
                        <div class="flex flex-col gap-2">
                                        <CheckboxSwitch
                                        v-model="isFeaturedTier"
                                        label="This is a Featured Tier"
                                        id="featured-tier"
                                        track-class="absolute inset-0 cursor-pointer rounded-[0.75rem] bg-[#98a2b380] transition-all duration-100 ease-in-out peer-checked:bg-[#0c111d] dark:bg-[#434c5b80] dark:peer-checked:bg-[#0a0e17]"
                                        knob-class="absolute left-[0.125rem] top-1/2 h-4 w-4 -translate-y-1/2 transform rounded-full bg-white shadow-[0_1px_3px_0_rgba(16,24,40,0.1),0_1px_2px_0_rgba(16,24,40,0.06)] transition-all duration-100 ease-in-out peer-checked:translate-x-[1rem] dark:bg-[#181a1b]"
                                        label-class="text-base font-semibold text-black dark:text-[#e8e6e3]"
                                        switchWrapperClass="w-9 h-5"
                                     />
                                     <div class="ml-12 flex flex-col gap-1">
                                         <p class="text-sm text-[#0C111D] dark:text-[#dbd8d3]">Featured tier will be displayed first by default on your subscription tier page.</p>
                                         <!-- Alert without icon -->
                                         <NotificationCard
                                         v-if="isFeaturedTier"
                                         variant="alert"
                                         :showIcon="false"
                                         :closable="false"
                                         title="Your ‘VIP Lounge tier’ will not longer be a featured tier."
                                         description="This tier will be updated as the feature tier in your profile after saving."
                                         />
                                        </div>
                        </div>
                    </section>

                    <!-- price-setting-section -->
                    <section class="flex flex-col gap-4 px-2 py-4 bg-white/25 group/price-container paid-tier md:gap-6 md:p-4 dark:bg-[#181a1b40]">
                        <h2 class="text-xl leading-normal font-semibold text-[#667085] dark:text-[#9e9689]">Price Setting</h2>

                        <!-- Tab-button-container (free/paid) -->
                        <ul class="flex w-full h-10 whitespace-nowrap rounded-[0.3125rem] overflow-hidden border border-[#D0D5DD] bg-[#F9FAFB] dark:border-[#3b4043] dark:bg-[#1b1d1e]">
            
                            <li 
                                @click="handleTier('free-tier')"
                                class="flex flex-1 justify-center items-center gap-2 border-r border-[#D0D5DD] cursor-pointer group/tab [&.active]:bg-[#0C111D] dark:border-[#3b4043] dark:[&.active]:bg-[#162036]"
                                :class="publishFlow.substep === 'free-tier' ? 'active' : ''"
                            >
                                <div class="w-full flex justify-center items-center gap-2 px-4">
                                    <span class="text-sm font-medium text-[#98A2B3] whitespace-nowrap group-[.active]/tab:text-white group-[.active]/tab:font-semibold dark:text-[#b0a99e] dark:group-[.active]/tab:text-[#e8e6e3]">
                                        Free Tier
                                    </span>
                                </div>
                            </li>

                            <li 
                                @click="handleTier('paid-tier')"
                                class="flex flex-1 justify-center items-center gap-2 border-r border-[#D0D5DD] cursor-pointer group/tab [&.active]:bg-[#0C111D] dark:border-[#3b4043] dark:[&.active]:bg-[#162036]"
                                :class="publishFlow.substep === 'paid-tier' ? 'active' : ''"
                            >
                                <div class="w-full flex justify-center items-center gap-2 px-4">
                                    <span class="text-sm font-medium text-[#98A2B3] whitespace-nowrap group-[.active]/tab:text-white group-[.active]/tab:font-semibold dark:text-[#b0a99e] dark:group-[.active]/tab:text-[#e8e6e3]">
                                        Paid Tier
                                    </span>
                                </div>
                            </li>
                        </ul>

                        <div v-if="publishFlow.substep === 'free-tier'" class="flex flex-col gap-4 animate-fade-in">

                        </div>

                        <div v-if="publishFlow.substep === 'paid-tier'" class="flex flex-col gap-4 animate-fade-in">
                       
                        <!-- subscription-based-price-section -->
                        <div class="flex-col gap-4 flex">
                            <h3 class="text-base font-semibold text-[#0C111D] dark:text-[#dbd8d3] md:text-lg">Subscription Base Price</h3>

                            <div class="flex w-full">
                                <!-- input-field -->
                                <div class="flex flex-col gap-1.5 flex-1 min-w-0">
                                    <!-- input-container -->
                                    <div class="w-full h-11 flex items-center gap-2 px-3.5 bg-white/30 border-b border-[#D0D5DD] rounded-t-sm shadow-[0px_1px_2px_0px_#1018280D] dark:bg-[#181a1b4d] dark:border-[#3b4043]">
                                        <span class="text-base font-bold whitespace-nowrap text-[#344054] dark:text-[#bdb7af]">USD$</span>
                                        <input type="text" value="29.5" class="text-base bg-transparent border-none outline-none w-full min-w-0 text-[#0C111D] placeholder:text-[#667085] dark:text-[#dbd8d3] dark:placeholder:text-[#9e9689]">
                                    </div>

                                    <p class="text-sm text-[#475467] dark:text-[#b1aba0]">Price must be between USD$ 1.95 to 500.</p>
                                </div>

                                <!-- dropdown -->
                                <div class="relative w-[11.25rem] h-11 flex-shrink-0">
                                    <div class="dash-select cursor-pointer">
                                        <div class="dash-select__trigger h-11 flex items-center justify-between w-full px-3.5 border-r border-b border-r-[#D0D5DD] border-b-[#EAECF0] rounded-t-sm bg-white/50 shadow-[0px_1px_2px_0px_#1018280D] dark:bg-[#181a1b80] dark:border-r-[#3b4043] dark:border-b-[#353a3c]">
                                            <span class="text-base font-medium text-[#0c111d] dark:text-[#dbd8d3]">Per month</span>
                                            <img src="https://i.ibb.co/2mXMQ5F/chevron-down.webp" alt="chevron-down" class="select-arrow w-5 h-5 transition-transform duration-300 ease-in-out transform">
                                        </div>
                                        <div class="dash-options-container absolute w-full transition-all duration-300 z-10 top-[calc(100%+0.5rem)] shadow-none border-none opacity-0 invisible pointer-events-none">
                                            <div class="dash-options rounded-[2px] bg-white/70 backdrop-blur-[25px] max-h-[200px] overflow-y-auto dark:bg-[#181a1bb3]">
                                                <div class="dash-option flex items-center gap-2 h-12 px-3 border-b border-[#EAECF0] cursor-pointer hover:bg-white [&.selected]:bg-white dark:hover:bg-[#181a1b] dark:[&.selected]:bg-[#181a1b] dark:border-[#353a3c]">
                                                    <span class="text-sm font-medium text-[#0c111d] dark:text-[#dbd8d3]">Per day</span>
                                                </div>
                                                <div class="dash-option flex items-center gap-2 h-12 px-3 border-b border-[#EAECF0] cursor-pointer hover:bg-white [&.selected]:bg-white dark:hover:bg-[#181a1b] dark:[&.selected]:bg-[#181a1b] dark:border-[#353a3c] selected">
                                                    <span class="text-sm font-medium text-[#0c111d] dark:text-[#dbd8d3]">Per month</span>
                                                </div>
                                                <div class="dash-option flex items-center gap-2 h-12 px-3 border-b border-[#EAECF0] cursor-pointer hover:bg-white [&.selected]:bg-white dark:hover:bg-[#181a1b] dark:[&.selected]:bg-[#181a1b] dark:border-[#353a3c]">
                                                    <span class="text-sm font-medium text-[#0c111d] dark:text-[#dbd8d3]">Per year</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <select class="dash-real-select hidden" name="dash-select">
                                        <option value="day">Per day</option>
                                        <option value="month">Per month</option>
                                        <option value="year">Per year</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- subscriber-discount-section -->
                        <div class="flex-col gap-4 flex">
                            <div class="flex flex-col gap-2">
                                <div class="flex items-center gap-2">
                                    <h3 class="text-base font-semibold text-[#0C111D] dark:text-[#dbd8d3] md:text-lg">Subscriber Discount</h3>
                                    <span class="text-xs leading-normal font-medium italic text-[#667085] dark:text-[#9e9689]">Optional</span>
                                </div>

                                <p class="text-sm text-[#475467] dark:text-[#b1aba0]">Offer first-time subscriber discount when they join this tier for the first time.</p>
                            </div>

                            <!-- add-discount-button -->
                            <button class="hidden items-center gap-0.5 cursor-pointer">
                                <img src="https://i.ibb.co/TD3jgrGK/plus-square.webp" alt="plus-square" class="w-5 h-5">
                                <span class="text-sm font-medium text-[#155EEF] dark:text-[#2c8df1]">ADD DISCOUNT</span>
                            </button>

                            <!-- discount-item -->
                            <div class="flex flex-col gap-4 pb-2">
                                <!-- price -->
                                <div class="flex items-center gap-2">
                                    <div>
                                        <span class="text-base font-medium align-middle text-[#0C111D] dark:text-[#dbd8d3]">USD$</span>
                                        <span class="text-3xl leading-[2.375rem] font-semibold align-baseline text-[#0C111D] dark:text-[#dbd8d3]">11.69</span>
                                        <span class="text-xs leading-normal font-medium align-bottom text-[#0C111D] dark:text-[#dbd8d3]">/mo</span>
                                    </div>

                                    <!-- discount-tag -->
                                    <div class="flex justify-center items-center px-1 py-0.5 bg-[#FCE40D] dark:bg-[#a19102]">
                                        <span class="text-xs leading-normal font-semibold text-[#0C111D] dark:text-[#dbd8d3]">-40%</span>
                                    </div>
                                </div>

                                <div class="flex flex-col gap-2 sm:flex-row sm:justify-between sm:flex-wrap">
                                    <div class="flex flex-col sm:flex-row sm:items-baseline sm:gap-3 sm:flex-wrap">
                                        <div class="flex items-center gap-1">
                                            <div class="flex justify-center items-center w-5 h-5">
                                                <img src="https://i.ibb.co.com/Xx69xSx4/Weather.webp" alt="Weather" class="w-4 h-4">
                                            </div>
                                            <p class="text-sm text-[#344054] dark:text-[#bdb7af]">23 APR 2025-24 APR 2026</p>
                                        </div>

                                        <div class="flex items-center gap-1 pt-1">
                                            <div class="flex justify-center items-center w-5 h-5">
                                                <img src="https://i.ibb.co.com/vM4gQhD/calender.webp" alt="calender" class="w-4 h-4">
                                            </div>
                                            <p class="text-sm text-[#344054] dark:text-[#bdb7af]">Discount for 6 billing cycle</p>
                                        </div>
                                    </div>

                                    <div class="flex justify-end items-center gap-4 sm:grow">
                                        <button class="flex justify-center items-center gap-0.5 outline-none cursor-pointer">
                                            <img src="https://i.ibb.co.com/d01w6NWF/pen.webp" alt="pen" class="w-5 h-5">
                                            <span class="text-sm font-medium text-[#155EEF] dark:text-[#2c8df1]">EDIT</span>
                                        </button>

                                        <button class="flex justify-center items-center gap-0.5 outline-none cursor-pointer">
                                            <img src="https://i.ibb.co.com/7twNxfc1/trash.webp" alt="trash" class="w-5 h-5">
                                            <span class="text-sm font-medium text-[#FF0066] dark:text-[#ff1a76]">REMOVE</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        </div>
                    </section>

                    <!-- subscriber-setting-section -->
                    <section class="flex flex-col gap-4 px-2 py-4 bg-white/25 group/wrapper md:gap-6 md:p-4 dark:bg-[#181a1b40]">
                        <h2 class="text-xl leading-normal font-semibold text-[#667085] dark:text-[#9e9689]">Subscriber Setting</h2>

                        <!-- subscriber-selection-section -->
                        <section class="flex flex-col gap-2">
                            <h3 class="text-base font-semibold text-[#0C111D] dark:text-[#dbd8d3] md:text-lg">Who can subscribe to this plan tier?</h3>

                            <div class="flex w-full">
                                <!-- dropdown -->
                                <div class="relative w-full h-11">
                                    <div class="dash-select cursor-pointer">
                                        <div class="dash-select__trigger h-11 flex items-center justify-between w-full px-3.5 border-r border-b border-b-[#EAECF0] rounded-t-sm bg-white/50 shadow-[0px_1px_2px_0px_#1018280D] dark:bg-[#181a1b80] dark:border-b-[#353a3c]">
                                            <span class="text-base font-medium text-[#0c111d] dark:text-[#dbd8d3]">Everyone</span>
                                            <img src="https://i.ibb.co/2mXMQ5F/chevron-down.webp" alt="chevron-down" class="select-arrow w-5 h-5 transition-transform duration-300 ease-in-out transform">
                                        </div>
                                        <div class="dash-options-container absolute w-full transition-all duration-300 z-10 top-[calc(100%+0.5rem)] shadow-none border-none opacity-0 invisible pointer-events-none">
                                            <div class="dash-options rounded-[2px] bg-white/70 backdrop-blur-[25px] max-h-[200px] overflow-y-auto dark:bg-[#181a1bb3]">
                                                <div class="dash-option flex items-center gap-2 h-12 px-3 border-b border-[#EAECF0] cursor-pointer hover:bg-white [&.selected]:bg-white dark:hover:bg-[#181a1b] dark:[&.selected]:bg-[#181a1b] dark:border-[#353a3c] selected">
                                                    <span class="text-sm font-medium text-[#0c111d] dark:text-[#dbd8d3]">Everyone</span>
                                                </div>
                                                <div class="dash-option flex items-center gap-2 h-12 px-3 border-b border-[#EAECF0] cursor-pointer hover:bg-white [&.selected]:bg-white dark:hover:bg-[#181a1b] dark:[&.selected]:bg-[#181a1b] dark:border-[#353a3c]">
                                                    <span class="text-sm font-medium text-[#0c111d] dark:text-[#dbd8d3]">Only those invited</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <select class="dash-real-select hidden" name="dash-select">
                                        <option value="everyone">Everyone</option>
                                        <option value="only-those-invited">Only those invited</option>
                                    </select>
                                </div>
                            </div>

                        </section>

                        <!-- maximum-subscribers-section -->
                        <div class="flex flex-col gap-2">
                            <div class="flex flex-col gap-1">
                                <div class="flex items-center gap-2">
                                    <h3 class="text-base font-semibold text-[#0C111D] dark:text-[#dbd8d3] md:text-lg">Maximum subscribers</h3>
                                    <span class="text-xs leading-normal font-medium italic text-[#667085] dark:text-[#9e9689]">Optional</span>
                                </div>

                                <p class="text-base text-[#344054] dark:text-[#bdb7af]">Limit how many fans can join this tier at once. Leave blank to disable feature.</p>
                            
                                <!-- subscriber-amount input-field -->
                                <div class="flex flex-col gap-1.5">
                                    <!-- input-container -->
                                    <div class="w-full h-11 flex px-3.5 bg-white/30 border-b border-[#D0D5DD] rounded-t-sm shadow-[0px_1px_2px_0px_#1018280D] dark:bg-[#181a1b4d] dark:border-[#3b4043]">
                                        <input type="text" placeholder="Enter amount" class="text-base bg-transparent border-none outline-none text-[#101828] placeholder:text-[#667085] dark:text-[#d6d3cd] dark:placeholder:text-[#9e9689]">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- unsubscribe-discount-section -->
                        <div class="flex flex-col gap-4">
                            <div class="flex flex-col gap-2">
                                <div class="flex items-center gap-2">
                                    <h3 class="text-base font-semibold text-[#0C111D] dark:text-[#dbd8d3] md:text-lg">Unsubscribe Discount</h3>
                                    <span class="text-xs leading-normal font-medium italic text-[#667085] dark:text-[#9e9689]">Optional</span>
                                </div>

                                <p class="text-sm text-[#475467] dark:text-[#b1aba0]">Offer discount to your subscribers when they unsubscribe from this tier. Note that all subscribers with different billing cycles from all tiers will be offered the same discount.</p>
                            </div>

                            <!-- add-discount-button -->
                            <button class="hidden items-center gap-0.5 cursor-pointer">
                                <img src="https://i.ibb.co/TD3jgrGK/plus-square.webp" alt="plus-square" class="w-5 h-5">
                                <span class="text-sm font-medium text-[#155EEF] dark:text-[#2c8df1]">ADD DISCOUNT</span>
                            </button>

                            <!-- discount-item -->
                            <div class="flex flex-col gap-4 pb-2">
                                <!-- price -->
                                <div class="flex items-center gap-2">
                                    <div>
                                        <span class="text-base font-medium align-middle text-[#0C111D] dark:text-[#dbd8d3]">USD$</span>
                                        <span class="text-3xl leading-[2.375rem] font-semibold align-baseline text-[#0C111D] dark:text-[#dbd8d3]">11.69</span>
                                        <span class="text-xs leading-normal font-medium align-bottom text-[#0C111D] dark:text-[#dbd8d3]">/mo</span>
                                    </div>

                                    <!-- discount-tag -->
                                    <div class="flex justify-center items-center px-1 py-0.5 bg-[#FCE40D] dark:bg-[#a19102]">
                                        <span class="text-xs leading-normal font-semibold text-[#0C111D] dark:text-[#dbd8d3]">-40%</span>
                                    </div>
                                </div>

                                <div class="flex flex-col gap-2 sm:flex-row sm:justify-between sm:flex-wrap">
                                    <div class="flex flex-col sm:flex-row sm:items-baseline sm:gap-3 sm:flex-wrap">
                                        <div class="flex items-center gap-1 pt-1">
                                            <div class="flex justify-center items-center w-5 h-5">
                                                <img src="https://i.ibb.co.com/vM4gQhD/calender.webp" alt="calender" class="w-4 h-4">
                                            </div>
                                            <p class="text-sm text-[#344054] dark:text-[#bdb7af]">Discount for 6 billing cycle</p>
                                        </div>
                                    </div>

                                    <div class="flex justify-end items-center gap-4 sm:grow">
                                        <button class="flex justify-center items-center gap-0.5 outline-none cursor-pointer">
                                            <img src="https://i.ibb.co.com/d01w6NWF/pen.webp" alt="pen" class="w-5 h-5">
                                            <span class="text-sm font-medium text-[#155EEF] dark:text-[#2c8df1]">EDIT</span>
                                        </button>

                                        <button class="flex justify-center items-center gap-0.5 outline-none cursor-pointer">
                                            <img src="https://i.ibb.co.com/7twNxfc1/trash.webp" alt="trash" class="w-5 h-5">
                                            <span class="text-sm font-medium text-[#FF0066] dark:text-[#ff1a76]">REMOVE</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- subscriber-benifits-section -->
                    <div class="flex flex-col gap-4 px-2 py-4 bg-white/25 md:gap-6 md:p-4 dark:bg-[#181a1b40]">
                        <!-- title-section -->
                        <div class="flex items-center gap-2 opacity-80">
                            <h2 class="text-xl leading-normal font-semibold text-[#667085] dark:text-[#9e9689]">Subscriber Benefits</h2>
                            <span class="text-xs leading-normal font-medium italic text-[#667085] dark:text-[#9e9689]">Optional</span>
                        </div>

                        <!-- form-container -->
                        <div class="flex flex-col gap-4 backdrop-blur-[25px] md:gap-6">
                            <!-- Free tokens section -->
                            <div class="grid grid-cols-[repeat(auto-fit,minmax(15.25rem,1fr))] items-center gap-2 w-full">
                                <!-- title & checkbox container -->
                                <div class="relative flex flex-col gap-2">
                                    <!-- title & tooltip container -->
                                    <div class="flex items-center gap-2">
                                        <h3 class="text-base font-semibold text-[#0C111D] md:text-lg dark:text-[#dbd8d3]">Free tokens</h3>
                                        
                                        <span class="flex items-center justify-center">
                                            <div class="md:relative inline-flex overflow-hidden cursor-pointer group hover:overflow-visible">
                                                <!-- Icon -->
                                                <img src="https://i.ibb.co/DPgMH5GG/svgviewer-png-output-15.webp" alt="tooltip icon" class="w-4 h-4">

                                                <!-- Tooltip -->
                                                <div class="absolute z-[2] flex flex-col items-start w-full md:w-max max-w-[22.4375rem] md:max-w-[21.5rem]
                                                    opacity-0 invisible pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto
                                                    text-xs leading-normal font-medium text-white py-2 px-3 rounded-lg
                                                    bg-[#101828B2] dark:bg-[rgba(14,19,32,0.9)] dark:text-[#dbd8d3] [box-shadow:0px_2px_4px_-2px_#1018280F,0px_4px_8px_-2px_#1018281A] [backdrop-filter:blur(25px)]
                                                    left-1/2 top-full translate-x-[-50%] translate-y-2 md:left-auto md:top-1/2 md:-right-2 md:translate-y-[-50%] md:translate-x-full
                                                    before:content-[''] before:absolute before:w-0 before:h-0 before:left-1/2 before:top-[-6px] before:translate-x-[-50%] before:border-[6px] before:border-t-0 before:border-l-transparent before:border-r-transparent before:border-b-[rgba(16,24,40,0.7)]
                                                    md:before:top-1/2 md:before:left-[-6px] md:before:translate-y-[-50%] md:before:border-[6px] md:before:border-r-[rgba(16,24,40,0.7)] md:before:border-t-transparent md:before:border-b-transparent md:before:border-l-transparent"
                                                >
                                                    <p class="text-xs leading-normal font-medium text-white dark:text-[#dbd8d3]">Set amount of free tokens given to member of this tier every recurring billing cycle. Frequency is based on your based subscription plan setting.</p>
                                                </div>
                                            </div>
                                        </span>
                                    </div>
                                </div>

                                <div class="flex flex-col gap-1.5 group/input">
                                    <!-- input-container -->
                                    <div class="h-11 flex items-center bg-white/30 border-b border-[#D0D5DD] rounded-t-sm shadow-[0px_1px_2px_0px_#1018280D] dark:bg-[#181a1b4d] dark:border-[#3b4043]">
                                        <div class="flex items-center gap-2 px-3.5 w-full min-w-0">
                                            <input type="text" value="10" class="text-base bg-transparent border-none outline-none w-full min-w-0 text-[#0C111D] placeholder:text-[#667085] dark:text-[#dbd8d3] dark:placeholder:text-[#9e9689]">
                                            <img src="https://i.ibb.co.com/yBMzbHWz/alert-circle.webp" alt="alert-circle" class=" w-4 h-4 group-[.error]/input:flex">
                                        </div>
                                        <span class="text-base font-semibold whitespace-nowrap px-[1.125rem] text-[#344054] dark:text-[#bdb7af]">% off</span>
                                    </div>

                                    <p class="hidden text-sm text-[#FF4405] group-[.error]/input:flex dark:text-[#ff571e]">value must be between 1-99.</p>
                                </div>
                            </div>

                            <!-- Merch discount section -->
                            <div class="grid grid-cols-[repeat(auto-fit,minmax(15.25rem,1fr))] items-center gap-2 w-full">
                                <!-- title & checkbox container -->
                                <div class="flex flex-col gap-2">
                                    <!-- title & tooltip container -->
                                    <div class="relative flex items-center gap-2">
                                        <h3 class="text-base font-semibold text-[#0C111D] md:text-lg dark:text-[#dbd8d3]">Merch Discount</h3>
                                        
                                        <span class="flex items-center justify-center">
                                            <div class="md:relative inline-flex overflow-hidden cursor-pointer group hover:overflow-visible">
                                                <!-- Icon -->
                                                <img src="https://i.ibb.co/DPgMH5GG/svgviewer-png-output-15.webp" alt="tooltip icon" class="w-4 h-4">

                                                <!-- Tooltip -->
                                                <div class="absolute z-[2] flex flex-col items-start w-full md:w-max max-w-[22.4375rem] md:max-w-[21.5rem]
                                                    opacity-0 invisible pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto
                                                    text-xs leading-normal font-medium text-white py-2 px-3 rounded-lg
                                                    bg-[#101828B2] dark:bg-[rgba(14,19,32,0.9)] dark:text-[#dbd8d3] [box-shadow:0px_2px_4px_-2px_#1018280F,0px_4px_8px_-2px_#1018281A] [backdrop-filter:blur(25px)]
                                                    left-1/2 top-full translate-x-[-50%] translate-y-2 md:left-auto md:top-1/2 md:-right-2 md:translate-y-[-50%] md:translate-x-full
                                                    before:content-[''] before:absolute before:w-0 before:h-0 before:left-1/2 before:top-[-6px] before:translate-x-[-50%] before:border-[6px] before:border-t-0 before:border-l-transparent before:border-r-transparent before:border-b-[rgba(16,24,40,0.7)]
                                                    md:before:top-1/2 md:before:left-[-6px] md:before:translate-y-[-50%] md:before:border-[6px] md:before:border-r-[rgba(16,24,40,0.7)] md:before:border-t-transparent md:before:border-b-transparent md:before:border-l-transparent"
                                                >
                                                    <ul>
                                                        <li class="text-xs leading-normal font-medium text-white relative pl-4  before:content-[''] before:w-1 before:h-1 before:rounded-full before:bg-white before:absolute before:left-[0.188rem] before:top-[0.438rem] dark:text-[#dbd8d3]">
                                                            Set percentage discount for all the merch in your shop (e.g. type ‘10’ in the input field if you want 10% off)
                                                        </li>
                                                        <li class="text-xs leading-normal font-medium text-white relative pl-4  before:content-[''] before:w-1 before:h-1 before:rounded-full before:bg-white before:absolute before:left-[0.188rem] before:top-[0.438rem] dark:text-[#dbd8d3]">
                                                            Leave blank to disable feature.
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </span>
                                    </div>

                                    <!-- checkbox-container -->
                                    <div class="flex gap-2">
                                        <div class="flex justify-center items-center w-6 h-6">
                                            <input type="checkbox" checked id="merch-discount-checkbox" class="appearance-none bg-white border border-[#d1d5db] rounded w-4 min-w-[1rem] h-4 cursor-pointer
                                                    checked:bg-[#07f468] checked:border-[#07f468] checked:relative checked:after:content-[''] checked:after:absolute checked:after:left-[0.3rem] checked:after:top-[0.15rem] checked:after:w-1 checked:after:h-2 checked:after:border-black checked:after:border-[2px] checked:after:border-solid checked:after:border-t-0 checked:after:border-l-0 checked:after:rotate-45 checked:after:box-border">
                                        </div>

                                        <label for="merch-discount-checkbox" class="h-5 cursor-pointer">
                                            <span class="text-sm align-text-top text-[#0c111d] dark:text-[#dbd8d3]">Apply to items already on sale</span>
                                        </label>
                                    </div>
                                </div>

                                <div class="flex flex-col gap-1.5 group/input">
                                    <!-- input-container -->
                                    <div class="h-11 flex items-center bg-white/30 border-b border-[#D0D5DD] rounded-t-sm shadow-[0px_1px_2px_0px_#1018280D] dark:bg-[#181a1b4d] dark:border-[#3b4043]">
                                        <div class="flex items-center gap-2 px-3.5 w-full min-w-0">
                                            <input type="text" value="10" class="text-base bg-transparent border-none outline-none w-full min-w-0 text-[#0C111D] placeholder:text-[#667085] dark:text-[#dbd8d3] dark:placeholder:text-[#9e9689]">
                                            <img src="https://i.ibb.co.com/yBMzbHWz/alert-circle.webp" alt="alert-circle" class="hidden w-4 h-4 group-[.error]/input:flex">
                                        </div>
                                        <span class="text-base font-semibold whitespace-nowrap px-[1.125rem] text-[#344054] dark:text-[#bdb7af]">% off</span>
                                    </div>

                                    <p class="hidden text-sm text-[#FF4405] group-[.error]/input:flex dark:text-[#ff571e]">value must be between 1-99.</p>
                                </div>
                            </div>

                            <!-- Pay to View discount section -->
                            <div class="grid grid-cols-[repeat(auto-fit,minmax(15.25rem,1fr))] items-center gap-2 w-full">
                                <!-- title & checkbox container -->
                                <div class="flex flex-col gap-2">
                                    <!-- title & tooltip container -->
                                    <div class="relative flex items-center gap-2">
                                        <h3 class="text-base font-semibold text-[#0C111D] md:text-lg dark:text-[#dbd8d3]">Pay to View Discount</h3>
                                        
                                        <span class="flex items-center justify-center">
                                            <div class="md:relative inline-flex overflow-hidden cursor-pointer group hover:overflow-visible">
                                                <!-- Icon -->
                                                <img src="https://i.ibb.co/DPgMH5GG/svgviewer-png-output-15.webp" alt="tooltip icon" class="w-4 h-4">

                                                <!-- Tooltip -->
                                                <div class="absolute z-[2] flex flex-col items-start w-full md:w-max max-w-[22.4375rem] md:max-w-[21.5rem]
                                                    opacity-0 invisible pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto
                                                    text-xs leading-normal font-medium text-white py-2 px-3 rounded-lg
                                                    bg-[#101828B2] dark:bg-[rgba(14,19,32,0.9)] dark:text-[#dbd8d3] [box-shadow:0px_2px_4px_-2px_#1018280F,0px_4px_8px_-2px_#1018281A] [backdrop-filter:blur(25px)]
                                                    left-1/2 top-full translate-x-[-50%] translate-y-2 md:left-auto md:top-1/2 md:-right-2 md:translate-y-[-50%] md:translate-x-full
                                                    before:content-[''] before:absolute before:w-0 before:h-0 before:left-1/2 before:top-[-6px] before:translate-x-[-50%] before:border-[6px] before:border-t-0 before:border-l-transparent before:border-r-transparent before:border-b-[rgba(16,24,40,0.7)]
                                                    md:before:top-1/2 md:before:left-[-6px] md:before:translate-y-[-50%] md:before:border-[6px] md:before:border-r-[rgba(16,24,40,0.7)] md:before:border-t-transparent md:before:border-b-transparent md:before:border-l-transparent"
                                                >
                                                    <ul>
                                                        <li class="text-xs leading-normal font-medium text-white relative pl-4  before:content-[''] before:w-1 before:h-1 before:rounded-full before:bg-white before:absolute before:left-[0.188rem] before:top-[0.438rem] dark:text-[#dbd8d3]">
                                                            Set percentage discount for all pay to view product in your shop(e.g. type ‘10’ in the input field if you want 10% off) 
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </span>
                                    </div>

                                    <!-- checkbox-container -->
                                    <div class="flex gap-2">
                                        <div class="flex justify-center items-center w-6 h-6">
                                            <input type="checkbox" checked id="merch-discount-checkbox" class="appearance-none bg-white border border-[#d1d5db] rounded w-4 min-w-[1rem] h-4 cursor-pointer
                                                    checked:bg-[#07f468] checked:border-[#07f468] checked:relative checked:after:content-[''] checked:after:absolute checked:after:left-[0.3rem] checked:after:top-[0.15rem] checked:after:w-1 checked:after:h-2 checked:after:border-black checked:after:border-[2px] checked:after:border-solid checked:after:border-t-0 checked:after:border-l-0 checked:after:rotate-45 checked:after:box-border">
                                        </div>

                                        <label for="merch-discount-checkbox" class="h-5 cursor-pointer">
                                            <span class="text-sm align-text-top text-[#0c111d] dark:text-[#dbd8d3]">Apply to items already on sale</span>
                                        </label>
                                    </div>
                                </div>

                                <!-- input-container -->
                                <div class="h-11 flex items-center bg-white/30 border-b border-[#D0D5DD] rounded-t-sm shadow-[0px_1px_2px_0px_#1018280D] dark:bg-[#181a1b4d] dark:border-[#3b4043]">
                                    <input type="text" value="10" class="text-base bg-transparent border-none outline-none w-full min-w-0 px-3.5 text-[#0C111D] placeholder:text-[#667085] dark:text-[#dbd8d3] dark:placeholder:text-[#9e9689]">
                                    <span class="text-base font-semibold whitespace-nowrap px-[1.125rem] text-[#344054] dark:text-[#bdb7af]">% off</span>
                                </div>
                            </div>

                            <!-- Custom Request discount section -->
                            <div class="grid grid-cols-[repeat(auto-fit,minmax(15.25rem,1fr))] items-center gap-2 w-full">
                                <!-- title & checkbox container -->
                                <div class="flex flex-col gap-2">
                                    <!-- title & tooltip container -->
                                    <div class="relative flex items-center gap-2">
                                        <h3 class="text-base font-semibold text-[#0C111D] md:text-lg dark:text-[#dbd8d3]">Custom Request Discount</h3>
                                        
                                        <span class="flex items-center justify-center">
                                            <div class="md:relative inline-flex overflow-hidden cursor-pointer group hover:overflow-visible">
                                                <!-- Icon -->
                                                <img src="https://i.ibb.co/DPgMH5GG/svgviewer-png-output-15.webp" alt="tooltip icon" class="w-4 h-4">

                                                <!-- Tooltip -->
                                                <div class="absolute z-[2] flex flex-col items-start w-full md:w-max max-w-[22.4375rem] md:max-w-[21.5rem]
                                                    opacity-0 invisible pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto
                                                    text-xs leading-normal font-medium text-white py-2 px-3 rounded-lg
                                                    bg-[#101828B2] dark:bg-[rgba(14,19,32,0.9)] dark:text-[#dbd8d3] [box-shadow:0px_2px_4px_-2px_#1018280F,0px_4px_8px_-2px_#1018281A] [backdrop-filter:blur(25px)]
                                                    left-1/2 top-full translate-x-[-50%] translate-y-2 md:left-auto md:top-1/2 md:-right-2 md:translate-y-[-50%] md:translate-x-full
                                                    before:content-[''] before:absolute before:w-0 before:h-0 before:left-1/2 before:top-[-6px] before:translate-x-[-50%] before:border-[6px] before:border-t-0 before:border-l-transparent before:border-r-transparent before:border-b-[rgba(16,24,40,0.7)]
                                                    md:before:top-1/2 md:before:left-[-6px] md:before:translate-y-[-50%] md:before:border-[6px] md:before:border-r-[rgba(16,24,40,0.7)] md:before:border-t-transparent md:before:border-b-transparent md:before:border-l-transparent"
                                                >
                                                    <ul>
                                                        <li class="text-xs leading-normal font-medium text-white relative pl-4  before:content-[''] before:w-1 before:h-1 before:rounded-full before:bg-white before:absolute before:left-[0.188rem] before:top-[0.438rem] dark:text-[#dbd8d3]">
                                                            Set percentage discount for custom product request(e.g. type ‘10’ in the input field if you want 10% off) 
                                                        </li>
                                                        <li class="text-xs leading-normal font-medium text-white relative pl-4  before:content-[''] before:w-1 before:h-1 before:rounded-full before:bg-white before:absolute before:left-[0.188rem] before:top-[0.438rem] dark:text-[#dbd8d3]">
                                                            Leave blank to disable feature.
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </span>
                                    </div>
                                </div>

                                <!-- input-container -->
                                <div class="h-11 flex items-center bg-white/30 border-b border-[#D0D5DD] rounded-t-sm shadow-[0px_1px_2px_0px_#1018280D] dark:bg-[#181a1b4d] dark:border-[#3b4043]">
                                    <input type="text" value="10" class="text-base bg-transparent border-none outline-none w-full min-w-0 px-3.5 text-[#0C111D] placeholder:text-[#667085] dark:text-[#dbd8d3] dark:placeholder:text-[#9e9689]">
                                    <span class="text-base font-semibold whitespace-nowrap px-[1.125rem] text-[#344054] dark:text-[#bdb7af]">% off</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- media-options-section -->
                    <div class="flex flex-col gap-4 px-2 py-4 bg-white/25 overflow-hidden md:gap-6 md:p-4 dark:bg-[#181a1b40]">
                        <div class="flex flex-col gap-2">
                            <!-- title-section -->
                            <div class="flex items-center gap-2 opacity-80">
                                <h2 class="text-xl leading-normal font-semibold text-[#667085] dark:text-[#9e9689]">Media Options</h2>
                                <span class="text-xs leading-normal font-medium italic text-[#667085] dark:text-[#9e9689]">Optional</span>
                            </div>

                            <p class="text-sm text-[#475467] dark:text-[#b1aba0] xl:text-base">You can include medias from other subscription tiers to this tier. Subscribers will gain access to all content posted to selected tier below.</p>
                        </div>

                        <!-- checkbox-section -->
                        <div class="flex flex-col gap-2 md:gap-4">
                            <!-- chekbox-container -->
                            <div class="w-full flex items-center gap-2 md:gap-6">
                                <div class="flex justify-center items-center w-6 h-6">
                                    <input type="checkbox" id="tier-media-chekbox-1" class="appearance-none bg-white border border-[#d1d5db] rounded w-4 min-w-[1rem] h-4 cursor-pointer
                                            checked:bg-[#07f468] checked:border-[#07f468] checked:relative checked:after:content-[''] checked:after:absolute checked:after:left-[0.3rem] checked:after:top-[0.15rem] checked:after:w-1 checked:after:h-2 checked:after:border-black checked:after:border-[2px] checked:after:border-solid checked:after:border-t-0 checked:after:border-l-0 checked:after:rotate-45 checked:after:box-border">
                                </div>

                                <label for="tier-media-chekbox-1" class="w-full flex justify-between items-center gap-2 cursor-pointer">
                                    <div class="flex items-center gap-2 min-w-0 flex-1 max-[350px]:max-w-[10rem]">
                                        <h4 class="text-xs leading-normal font-semibold truncate w-max sm:w-[unset] text-[#0C111D] md:text-lg dark:text-[#dbd8d3]">Access to some content</h4>
                                        <div class="flex justify-center items-center px-1.5 rounded-[3.125rem] h-[1.125rem] group/tier published [&.draft]:bg-white [&.published]:bg-[#D1E0FF] dark:[&.published]:bg-[#25282a] dark:[&.draft]:bg-[#181a1b]">
                                            <span class="text-[0.625rem] leading-[1.125rem] font-medium whitespace-nowrap group-[.published]/tier:text-[#2970FF] group-[.draft]/tier:text-[#98A2B3] md:text-xs md:leading-normal dark:group-[.published]/tier:text-[#3799ff] dark:group-[.draft]/tier:text-[#b0a99e]">Published Tier</span>
                                        </div>
                                    </div>

                                    <span class="text-xs leading-normal font-medium whitespace-nowrap text-[#667085] dark:text-[#9e9689]">16 Media</span>
                                </label>
                            </div>

                            <!-- chekbox-container -->
                            <div class="w-full flex items-center gap-2 md:gap-6">
                                <div class="flex justify-center items-center w-6 h-6">
                                    <input type="checkbox" id="tier-media-chekbox-2" class="appearance-none bg-white border border-[#d1d5db] rounded w-4 min-w-[1rem] h-4 cursor-pointer
                                            checked:bg-[#07f468] checked:border-[#07f468] checked:relative checked:after:content-[''] checked:after:absolute checked:after:left-[0.3rem] checked:after:top-[0.15rem] checked:after:w-1 checked:after:h-2 checked:after:border-black checked:after:border-[2px] checked:after:border-solid checked:after:border-t-0 checked:after:border-l-0 checked:after:rotate-45 checked:after:box-border">
                                </div>

                                <label for="tier-media-chekbox-2" class="w-full flex justify-between items-center gap-2 cursor-pointer">
                                    <div class="flex items-center gap-2 min-w-0 flex-1 max-[350px]:max-w-[10rem]">
                                        <h4 class="text-xs leading-normal font-semibold truncate w-max sm:w-[unset] text-[#0C111D] md:text-lg dark:text-[#dbd8d3]">Access to more content</h4>
                                        <div class="flex justify-center items-center px-1.5 rounded-[3.125rem] h-[1.125rem] group/tier published [&.draft]:bg-white [&.published]:bg-[#D1E0FF] dark:[&.published]:bg-[#25282a] dark:[&.draft]:bg-[#181a1b]">
                                            <span class="text-[0.625rem] leading-[1.125rem] font-medium whitespace-nowrap group-[.published]/tier:text-[#2970FF] group-[.draft]/tier:text-[#98A2B3] md:text-xs md:leading-normal dark:group-[.published]/tier:text-[#3799ff] dark:group-[.draft]/tier:text-[#b0a99e]">Published Tier</span>
                                        </div>
                                    </div>

                                    <span class="text-xs leading-normal font-medium whitespace-nowrap text-[#667085] dark:text-[#9e9689]">24 Media</span>
                                </label>
                            </div>

                            <!-- chekbox-container -->
                            <div class="w-full flex items-center gap-2 md:gap-6">
                                <div class="flex justify-center items-center w-6 h-6">
                                    <input type="checkbox" checked id="tier-media-chekbox-3" class="appearance-none bg-white border border-[#d1d5db] rounded w-4 min-w-[1rem] h-4 cursor-pointer
                                            checked:bg-[#07f468] checked:border-[#07f468] checked:relative checked:after:content-[''] checked:after:absolute checked:after:left-[0.3rem] checked:after:top-[0.15rem] checked:after:w-1 checked:after:h-2 checked:after:border-black checked:after:border-[2px] checked:after:border-solid checked:after:border-t-0 checked:after:border-l-0 checked:after:rotate-45 checked:after:box-border">
                                </div>

                                <label for="tier-media-chekbox-3" class="w-full flex justify-between items-center gap-2 cursor-pointer">
                                    <div class="flex items-center gap-2 min-w-0 flex-1 max-[350px]:max-w-[10rem]">
                                        <h4 class="text-xs leading-normal font-semibold truncate w-max sm:w-[unset] text-[#0C111D] md:text-lg dark:text-[#dbd8d3]">Access to some more content</h4>
                                        <div class="flex justify-center items-center px-1.5 rounded-[3.125rem] h-[1.125rem] group/tier published [&.draft]:bg-white [&.published]:bg-[#D1E0FF] dark:[&.published]:bg-[#25282a] dark:[&.draft]:bg-[#181a1b]">
                                            <span class="text-[0.625rem] leading-[1.125rem] font-medium whitespace-nowrap group-[.published]/tier:text-[#2970FF] group-[.draft]/tier:text-[#98A2B3] md:text-xs md:leading-normal dark:group-[.published]/tier:text-[#3799ff] dark:group-[.draft]/tier:text-[#b0a99e]">Published Tier</span>
                                        </div>
                                    </div>

                                    <span class="text-xs leading-normal font-medium whitespace-nowrap text-[#667085] dark:text-[#9e9689]">100 Media</span>
                                </label>
                            </div>

                            <!-- chekbox-container -->
                            <div class="w-full flex items-center gap-2 md:gap-6">
                                <div class="flex justify-center items-center w-6 h-6">
                                    <input type="checkbox" checked id="tier-media-chekbox-4" class="appearance-none bg-white border border-[#d1d5db] rounded w-4 min-w-[1rem] h-4 cursor-pointer
                                            checked:bg-[#07f468] checked:border-[#07f468] checked:relative checked:after:content-[''] checked:after:absolute checked:after:left-[0.3rem] checked:after:top-[0.15rem] checked:after:w-1 checked:after:h-2 checked:after:border-black checked:after:border-[2px] checked:after:border-solid checked:after:border-t-0 checked:after:border-l-0 checked:after:rotate-45 checked:after:box-border">
                                </div>

                                <label for="tier-media-chekbox-4" class="w-full flex justify-between items-center gap-2 cursor-pointer">
                                    <div class="flex items-center gap-2 min-w-0 flex-1 max-[350px]:max-w-[10rem]">
                                        <h4 class="text-xs leading-normal font-semibold truncate w-max sm:w-[unset] text-[#0C111D] md:text-lg dark:text-[#dbd8d3]">Access to even more content</h4>
                                        <div class="flex justify-center items-center px-1.5 rounded-[3.125rem] h-[1.125rem] group/tier published [&.draft]:bg-white [&.published]:bg-[#D1E0FF] dark:[&.published]:bg-[#25282a] dark:[&.draft]:bg-[#181a1b]">
                                            <span class="text-[0.625rem] leading-[1.125rem] font-medium whitespace-nowrap group-[.published]/tier:text-[#2970FF] group-[.draft]/tier:text-[#98A2B3] md:text-xs md:leading-normal dark:group-[.published]/tier:text-[#3799ff] dark:group-[.draft]/tier:text-[#b0a99e]">Published Tier</span>
                                        </div>
                                    </div>

                                    <span class="text-xs leading-normal font-medium whitespace-nowrap text-[#667085] dark:text-[#9e9689]">5 Media</span>
                                </label>
                            </div>

                            <!-- chekbox-container -->
                            <div class="w-full flex items-center gap-2 md:gap-6">
                                <div class="flex justify-center items-center w-6 h-6">
                                    <input type="checkbox" id="tier-media-chekbox-5" class="appearance-none bg-white border border-[#d1d5db] rounded w-4 min-w-[1rem] h-4 cursor-pointer
                                            checked:bg-[#07f468] checked:border-[#07f468] checked:relative checked:after:content-[''] checked:after:absolute checked:after:left-[0.3rem] checked:after:top-[0.15rem] checked:after:w-1 checked:after:h-2 checked:after:border-black checked:after:border-[2px] checked:after:border-solid checked:after:border-t-0 checked:after:border-l-0 checked:after:rotate-45 checked:after:box-border">
                                </div>

                                <label for="tier-media-chekbox-5" class="w-full flex justify-between items-center gap-2 cursor-pointer">
                                    <div class="flex items-center gap-2 min-w-0 flex-1 max-[350px]:max-w-[10rem]">
                                        <h4 class="text-xs leading-normal font-semibold truncate w-max sm:w-[unset] text-[#0C111D] md:text-lg dark:text-[#dbd8d3]">Access to even some more content</h4>
                                        <div class="flex justify-center items-center px-1.5 rounded-[3.125rem] h-[1.125rem] group/tier draft [&.draft]:bg-white [&.published]:bg-[#D1E0FF] dark:[&.published]:bg-[#25282a] dark:[&.draft]:bg-[#181a1b]">
                                            <span class="text-[0.625rem] leading-[1.125rem] font-medium whitespace-nowrap group-[.published]/tier:text-[#2970FF] group-[.draft]/tier:text-[#98A2B3] md:text-xs md:leading-normal dark:group-[.published]/tier:text-[#3799ff] dark:group-[.draft]/tier:text-[#b0a99e]">Draft</span>
                                        </div>
                                    </div>

                                    <span class="text-xs leading-normal font-medium whitespace-nowrap text-[#667085] dark:text-[#9e9689]">3 Media</span>
                                </label>
                            </div>

                            <!-- chekbox-container -->
                            <div class="w-full flex items-center gap-2 md:gap-6">
                                <div class="flex justify-center items-center w-6 h-6">
                                    <input type="checkbox" id="tier-media-chekbox-6" class="appearance-none bg-white border border-[#d1d5db] rounded w-4 min-w-[1rem] h-4 cursor-pointer
                                            checked:bg-[#07f468] checked:border-[#07f468] checked:relative checked:after:content-[''] checked:after:absolute checked:after:left-[0.3rem] checked:after:top-[0.15rem] checked:after:w-1 checked:after:h-2 checked:after:border-black checked:after:border-[2px] checked:after:border-solid checked:after:border-t-0 checked:after:border-l-0 checked:after:rotate-45 checked:after:box-border">
                                </div>

                                <label for="tier-media-chekbox-6" class="w-full flex justify-between items-center gap-2 cursor-pointer">
                                    <div class="flex items-center gap-2 min-w-0 flex-1 max-[350px]:max-w-[10rem]">
                                        <h4 class="text-xs leading-normal font-semibold truncate w-max sm:w-[unset] text-[#0C111D] md:text-lg dark:text-[#dbd8d3]">Access to the most content</h4>
                                        <div class="flex justify-center items-center px-1.5 rounded-[3.125rem] h-[1.125rem] group/tier draft [&.draft]:bg-white [&.published]:bg-[#D1E0FF] dark:[&.published]:bg-[#25282a] dark:[&.draft]:bg-[#181a1b]">
                                            <span class="text-[0.625rem] leading-[1.125rem] font-medium whitespace-nowrap group-[.published]/tier:text-[#2970FF] group-[.draft]/tier:text-[#98A2B3] md:text-xs md:leading-normal dark:group-[.published]/tier:text-[#3799ff] dark:group-[.draft]/tier:text-[#b0a99e]">Draft</span>
                                        </div>
                                    </div>

                                    <span class="text-xs leading-normal font-medium whitespace-nowrap text-[#667085] dark:text-[#9e9689]">0 Media</span>
                                </label>
                            </div>

                            <!-- chekbox-container -->
                            <div class="w-full flex items-center gap-2 md:gap-6">
                                <div class="flex justify-center items-center w-6 h-6">
                                    <input type="checkbox" id="tier-media-chekbox-7" class="appearance-none bg-white border border-[#d1d5db] rounded w-4 min-w-[1rem] h-4 cursor-pointer
                                            checked:bg-[#07f468] checked:border-[#07f468] checked:relative checked:after:content-[''] checked:after:absolute checked:after:left-[0.3rem] checked:after:top-[0.15rem] checked:after:w-1 checked:after:h-2 checked:after:border-black checked:after:border-[2px] checked:after:border-solid checked:after:border-t-0 checked:after:border-l-0 checked:after:rotate-45 checked:after:box-border">
                                </div>

                                <label for="tier-media-chekbox-7" class="w-full flex justify-between items-center gap-2 cursor-pointer">
                                    <div class="flex items-center gap-2 min-w-0 flex-1 max-[350px]:max-w-[10rem]">
                                        <h4 class="text-xs leading-normal font-semibold truncate w-max sm:w-[unset] text-[#0C111D] md:text-lg dark:text-[#dbd8d3]">Access to even the most content</h4>
                                        <div class="flex justify-center items-center px-1.5 rounded-[3.125rem] h-[1.125rem] group/tier draft [&.draft]:bg-white [&.published]:bg-[#D1E0FF] dark:[&.published]:bg-[#25282a] dark:[&.draft]:bg-[#181a1b]">
                                            <span class="text-[0.625rem] leading-[1.125rem] font-medium whitespace-nowrap group-[.published]/tier:text-[#2970FF] group-[.draft]/tier:text-[#98A2B3] md:text-xs md:leading-normal dark:group-[.published]/tier:text-[#3799ff] dark:group-[.draft]/tier:text-[#b0a99e]">Draft</span>
                                        </div>
                                    </div>

                                    <span class="text-xs leading-normal font-medium whitespace-nowrap text-[#667085] dark:text-[#9e9689]">0 Media</span>
                                </label>
                            </div>

                            <!-- chekbox-container -->
                            <div class="w-full flex items-center gap-2 md:gap-6">
                                <div class="flex justify-center items-center w-6 h-6">
                                    <input type="checkbox" checked id="tier-media-chekbox-8" class="appearance-none bg-white border border-[#d1d5db] rounded w-4 min-w-[1rem] h-4 cursor-pointer
                                            checked:bg-[#07f468] checked:border-[#07f468] checked:relative checked:after:content-[''] checked:after:absolute checked:after:left-[0.3rem] checked:after:top-[0.15rem] checked:after:w-1 checked:after:h-2 checked:after:border-black checked:after:border-[2px] checked:after:border-solid checked:after:border-t-0 checked:after:border-l-0 checked:after:rotate-45 checked:after:box-border">
                                </div>

                                <label for="tier-media-chekbox-8" class="w-full flex justify-between items-center gap-2 cursor-pointer">
                                    <div class="flex items-center gap-2 min-w-0 flex-1 max-[350px]:max-w-[10rem]">
                                        <h4 class="text-xs leading-normal font-semibold truncate w-max sm:w-[unset] text-[#0C111D] md:text-lg dark:text-[#dbd8d3]">Access to even more the most content</h4>
                                        <div class="flex justify-center items-center px-1.5 rounded-[3.125rem] h-[1.125rem] group/tier draft [&.draft]:bg-white [&.published]:bg-[#D1E0FF] dark:[&.published]:bg-[#25282a] dark:[&.draft]:bg-[#181a1b]">
                                            <span class="text-[0.625rem] leading-[1.125rem] font-medium whitespace-nowrap group-[.published]/tier:text-[#2970FF] group-[.draft]/tier:text-[#98A2B3] md:text-xs md:leading-normal dark:group-[.published]/tier:text-[#3799ff] dark:group-[.draft]/tier:text-[#b0a99e]">Draft</span>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                </div>
</template>


