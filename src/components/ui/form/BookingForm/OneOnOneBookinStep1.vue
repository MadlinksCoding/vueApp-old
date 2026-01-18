<script setup>
import { onMounted, ref } from "vue";
import CheckboxGroup from "../checkbox/CheckboxGroup.vue";
import ButtonComponent from "@/components/dev/button/ButtonComponent.vue";
import BookingSectionsWrapper from "../BookingForm/HelperComponents/BookingSectionsWrapper.vue";
import BaseInput from "@/components/dev/input/BaseInput.vue";
import ThumbnailUploader from "../../global/media/uploader/HelperComponents/ThumbnailUploader.vue";
import Quill from 'quill';
import 'quill/dist/quill.snow.css'; 

// Accept Engine
const props = defineProps(['engine']);

// Refs
const duration = ref("");
const rememberMe = ref(false);
const quillEditor = ref(null);

// Accordion State
const sectionsState = ref({
  callSettings: true,    
  bookingSettings: true  
});

const toggleSection = (key) => {
  sectionsState.value[key] = !sectionsState.value[key];
};

const goToNext = () => {
  props.engine.goToStep(2);
};

onMounted(() => {
  // Quill Setup (Preserved exactly as provided)
  const icons = Quill.import('ui/icons');
  icons['bold'] = '<img src="https://i.ibb.co/HLRRqmHp/bold-icon.webp" alt="bold" style="width:30px;">';
  icons['italic'] = '<img src="https://i.ibb.co/QvdPyg67/italic-icon.webp" alt="italic" style="width:30px;">';
  icons['link'] = '<img src="https://i.ibb.co/gZ7JLJ28/link-icon.webp" alt="link" style="width:30px;">';
  icons['list']['ordered'] = '<img src="https://i.ibb.co/Q7WRxw9Y/list-ol-icon.webp" alt="ol" style="width:30px;">';
  icons['list']['bullet'] = '<img src="https://i.ibb.co/rfH1rbT7/list-ul-icon.webp" alt="ul" style="width:30px;">';

  new Quill(quillEditor.value, {
    modules: { toolbar: [['bold', 'italic', 'link', { 'list': 'ordered' }, { 'list': 'bullet' }]] },
    placeholder: "Event Description...",
    theme: 'snow'
  });

  const container = quillEditor.value.closest('.tier-description-quill-container');
  const toolbar = container.querySelector('.ql-toolbar.ql-snow');
  if (toolbar) {
    toolbar.style.border = 'none'; 
    toolbar.classList.add('!px-0', '!pt-0', '!pb-2');
    toolbar.querySelectorAll('button').forEach(b => {
      b.classList.add('!w-auto', '!min-w-[30px]', '!h-auto', '!p-1', 'rounded', 'hover:!bg-[#F9FAFB]', 'dark:hover:!bg-[#323232]', 'flex', 'items-center', 'justify-center');
    });
  }
  const editorContainer = container.querySelector('.ql-container.ql-snow');
  if (editorContainer) {
    editorContainer.style.border = 'none';
    editorContainer.classList.add('!font-sans', '!text-base');
  }
  const editor = container.querySelector('.ql-editor');
  if (editor) {
    editor.classList.add('!px-0', '!py-2', '!text-[#101828]', 'dark:!text-[#dbd8d3]', 'min-h-[80px]');
  }
});
</script>

<template>
  <form class="flex flex-col gap-6 relative">
    
    <div class=" self-stretch inline-flex justify-start items-start gap-4">
        <div class="w-6 h-6 relative overflow-hidden">
          <svg width="19" height="14" viewBox="0 0 19 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 5H1M18 1H1M18 9H1M14 13H1" stroke="#344054" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="flex-1 inline-flex flex-col justify-start items-start gap-4">
          <div class="flex w-full">
            <div class="flex-1">
              <BaseInput type="text" placeholder="Event Title" v-model="duration" wrapperClass="w-full" inputClass="px-3.5 text-gray-500 text-gray-500 w-full text-base font-normal outline-none py-2.5 bg-white/30 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300" />
            </div>
            <div class="h-[45px] bg-white/50 border-l text-sm px-2 inline-flex flex-col justify-center items-center gap-1.5 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300">Todo</div> 
          </div>
          <div class="tier-description-quill-container flex flex-col px-3.5 py-2.5 border-b border-[#D0D5DD] rounded-t-sm shadow-sm bg-white/30 w-full dark:bg-[#181a1b4d] dark:border-[#3b4043]">
            <div ref="quillEditor"></div>
          </div>
          <div class="flex flex-col gap-1.5 w-full">
            <div class="flex flex-col gap-1.5">
              <div class="text-slate-700 text-xs font-normal leading-none">Call Type</div>
              <div class="self-stretch bg-white/50 px-4 py-2 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 inline-flex justify-start items-start">Todo</div>
            </div>
          </div>
          <div class="flex w-full gap-3">
            <div class="flex-1 inline-flex flex-col justify-start items-start gap-1.5">
              <div class="self-stretch flex flex-col justify-start items-start gap-1.5">
                <div class="self-stretch bg-white/75 px-4 py-2 rounded-tl-sm rounded-tr-sm 
                shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 inline-flex 
                justify-start items-start">Todo</div>
              </div>
            </div>
            <div class="flex justify-start items-center gap-1">
              <img src="https://i.ibb.co/9kQ5CDty/Icon.png" alt="" />
              <div class="justify-start text-slate-700 text-sm font-medium leading-tight">Preview</div>
            </div>
          </div>
          <div class="self-stretch flex flex-col justify-start items-start gap-1.5">
            <div class=""><span class="text-slate-700 text-xs font-normal leading-none">Event Image </span><span class="text-gray-500 text-xs italic font-normal leading-none">Optional</span></div>
            <div class="w-full"><ThumbnailUploader subtitle="or drag and drop" fileInfo="SVG, PNG, JPG or GIF (max. 800x400px)"/></div>
          </div>
        </div>
    </div>

    <BookingSectionsWrapper title="Session Duration" leftIcon="https://i.ibb.co/cSjDYSdk/Icon.png">
        <div class='flex flex-col gap-[30px]'>
          <div class="flex items-center gap-2 mt-3 ">
            <BaseInput type="number" placeholder="15" v-model="duration" inputClass="px-3.5 text-gray-900 placeholder:text-gray-900 w-full text-base font-normal outline-none py-2.5 bg-white/30 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300" />
            <div class=" text-black text-base font-medium leading-normal">Minutes</div>
          </div>
          <div class="self-stretch flex flex-col justify-center items-start gap-2">
            <CheckboxGroup v-model="rememberMe" label="Allow user to book longer sessions" checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45" labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal" wrapperClass="flex items-center gap-2" />
            <div class="opacity-50 ml-6">
              <div class="w-full text-gray-500 text-sm font-medium leading-tight">Maximum Session Allowed</div>
              <div class="flex items-center gap-1.5 ">
                <div class=""><BaseInput type="number" placeholder="15" v-model="duration" inputClass="px-3.5 w-44 text-gray-900 placeholder:text-gray-900 text-base font-normal outline-none py-2.5 bg-white/30 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300" /></div>
                <div class="flex flex-col"><div class="justify-center text-black text-base font-medium leading-normal">Sessions</div><div class="justify-center text-black text-xs font-medium leading-none">(15 minutes)</div></div>
              </div>
            </div>
          </div>
        </div>
    </BookingSectionsWrapper>

    <BookingSectionsWrapper
      title="Pricing Settings"
      leftIcon="https://i.ibb.co/F47R5CqG/Icon-1.png"
    >
      <div
        class="flex-1 inline-flex flex-col justify-start items-start gap-5 mt-4"
      >
        <div class="flex flex-col justify-start items-start gap-1.5">
          <div
            class="justify-start text-gray-500 text-sm font-medium font-['Poppins'] leading-tight"
          >
            Base Price
          </div>
          <div class="flex items-center gap-2">
            <BaseInput
              type="number"
              placeholder="15"
              v-model="duration"
              inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300"
            />
            <div class="flex gap-2 items-center">
              <span
                class="text-black text-base font-medium font-['Poppins'] leading-normal"
                >Tokens </span
              ><span
                class="text-black text-sm font-normal font-['Poppins'] leading-tight"
                >/session</span
              >
            </div>
          </div>
        </div>

        <div
          class="self-stretch flex flex-col justify-center items-start gap-3"
        >
          <CheckboxGroup
            v-model="rememberMe"
            label="Enable discount price for longer sessions"
            checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
            labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal"
            wrapperClass="flex items-center gap-2 mb-3"
          />

          <div class="self-stretch inline-flex justify-start items-start gap-2">
            <div class="w-6 h-6" />
            <div class="inline-flex flex-col justify-start items-start gap-2">
              <div
                class="opacity-50 inline-flex justify-end items-center gap-2"
              >
                <BaseInput
                  type="number"
                  placeholder="15"
                  v-model="duration"
                  inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300"
                />
                <div
                  class="h-10 inline-flex flex-col justify-between items-start"
                >
                  <div
                    class="justify-center text-black text-base font-medium font-['Poppins'] leading-normal"
                  >
                    sessions minimum
                  </div>
                  <div
                    class="justify-center text-black text-xs font-medium font-['Poppins'] leading-none"
                  >
                    (2 x 15 minutes)
                  </div>
                </div>
              </div>
              <div
                class="opacity-50 inline-flex justify-end items-center gap-2"
              >
                <BaseInput
                  type="number"
                  placeholder="15"
                  v-model="duration"
                  inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300"
                />
                <div
                  class="h-10 inline-flex flex-col justify-between items-start"
                >
                  <div
                    class="justify-center text-black text-base font-medium font-['Poppins'] leading-normal"
                  >
                    % off base price
                  </div>
                  <div
                    class="justify-center text-black text-xs font-medium font-['Poppins'] leading-none"
                  >
                    (800 tokens/session)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          class="self-stretch flex flex-col justify-center items-start gap-3"
        >
          <div class="flex gap-2">
            <CheckboxGroup
              label="Enable booking fee"
              checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
              labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal"
              wrapperClass="flex items-center gap-2 mb-3"
            />

            <div class="mt-[2px]">
              <img src="https://i.ibb.co/HD78k3Sf/Icon.png" alt="" />
            </div>
          </div>

          <div class="inline-flex justify-start items-start gap-2">
            <div class="w-6 h-10" />
            <div class="inline-flex flex-col justify-center items-start gap-2">
              <div
                class="opacity-50 inline-flex justify-start items-center gap-2"
              >
                <BaseInput
                  type="number"
                  placeholder="15"
                  v-model="duration"
                  inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300"
                />
                <div
                  class="w-14 justify-start text-black text-base font-medium font-['Poppins'] leading-normal"
                >
                  Tokens
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          class="self-stretch flex flex-col justify-center items-start gap-3"
        >
          <div
            class="self-stretch flex flex-col justify-center items-start gap-2"
          >
            <div class="flex gap-2">
              <CheckboxGroup
                label="Allow instant booking"
                checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                labelClass="text-slate-700 mt-[1px] text-[16px] leading-normal"
                wrapperClass="flex items-center gap-2 mb-3"
              />

              <div class="mt-[2px]">
                <img src="https://i.ibb.co/HD78k3Sf/Icon.png" alt="" />
              </div>
            </div>

            <div
              class="self-stretch inline-flex justify-start items-start gap-2"
            >
              <div class="w-6 h-6" />
              <div
                class="flex-1 opacity-50 inline-flex flex-col justify-start items-start gap-2"
              >
                <div
                  class="self-stretch inline-flex justify-end items-center gap-2"
                >
                  <div
                    class="flex-1 justify-center text-slate-700 text-base font-normal font-['Poppins'] leading-normal"
                  >
                    Approve sessions instantly after bookings.
                  </div>
                </div>

                <CheckboxGroup
                  label="Disable chat before call"
                  checkboxClass="m-0 border border-checkboxBorder [appearance:none] w-[0.75rem] h-[0.75rem] rounded bg-transparent relative cursor-pointer checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.2rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45 "
                  labelClass="text-slate-700 text-[16px] leading-normal"
                  wrapperClass="flex items-center gap-2 mb-3 mt-2"
                />
              </div>
            </div>
          </div>
        </div>
        <div
          class="self-stretch flex flex-col justify-center items-start gap-3"
        >
          <div
            class="self-stretch flex flex-col justify-center items-start gap-1"
          >
            <div class="flex gap-2">
              <CheckboxGroup
                label="Enable reschedule  fee"
                checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal"
                wrapperClass="flex items-center gap-2 mb-3"
              />

              <div class="mt-[2px]">
                <img src="https://i.ibb.co/HD78k3Sf/Icon.png" alt="" />
              </div>
            </div>

            <div
              class="self-stretch inline-flex justify-start items-start gap-2"
            >
              <div class="w-6 h-10" />
              <div
                class="opacity-50 inline-flex flex-col justify-start items-start"
              >
                <div class="inline-flex justify-end items-center gap-2">
                  <BaseInput
                    type="number"
                    placeholder="15"
                    v-model="duration"
                    inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300"
                  />

                  <div
                    class="justify-center text-slate-700 text-base font-normal font-['Poppins'] leading-normal"
                  >
                    Tokens
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          class="self-stretch flex flex-col justify-center items-start gap-3"
        >
          <div
            class="self-stretch flex flex-col justify-center items-start gap-1"
          >
            <div class="flex gap-2">
              <CheckboxGroup
                label="Enable cancellation fee"
                checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal"
                wrapperClass="flex items-center gap-2 mb-3"
              />

              <div class="mt-[2px]">
                <img src="https://i.ibb.co/HD78k3Sf/Icon.png" alt="" />
              </div>
            </div>
            <div
              class="self-stretch inline-flex justify-start items-start gap-2"
            >
              <div class="w-6 h-10" />
              <div
                class="opacity-50 inline-flex flex-col justify-start items-start"
              >
                <div class="inline-flex justify-end items-center gap-2">
                  <BaseInput
                    type="number"
                    placeholder="15"
                    v-model="duration"
                    inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300"
                  />
                  <div
                    class="justify-center text-slate-700 text-base font-normal font-['Poppins'] leading-normal"
                  >
                    Tokens
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            class="ml-7 opacity-50 flex flex-col justify-start items-start gap-2"
          >
            <CheckboxGroup
              label="User can cancel in advance to void minimum charge"
              checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
              labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal"
              wrapperClass="flex items-center gap-2 mb-3"
            />
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-2">
                <BaseInput
                  type="number"
                  placeholder="15"
                  v-model="duration"
                  inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300"
                />

                <div
                  class="bg-white/50 px-3 py-2 rounded-tl-sm outline-none rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 inline-flex justify-start items-start"
                >
                  Todo
                </div>
              </div>
              <div
                class="justify-center text-slate-700 text-base font-normal leading-normal"
              >
                in advance
              </div>
            </div>
          </div>
        </div>
      </div>
    </BookingSectionsWrapper>

    <BookingSectionsWrapper title="Off-hour Surcharge" leftIcon="https://i.ibb.co/k6kzjyCp/Icon-2.png" titleIcon="https://i.ibb.co/HD78k3Sf/Icon.png">
        <div class="self-stretch inline-flex justify-start items-center gap-2 mt-5">
          <CheckboxGroup label="Add" checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45" labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal" wrapperClass="flex items-center gap-2" />
          <div class="flex-1 opacity-50 inline-flex flex-col justify-start items-start">
            <div class="inline-flex justify-end items-center gap-2">
              <BaseInput type="number" placeholder="15" v-model="duration" inputClass="px-3.5 w-44 text-gray-900 placeholder:text-gray-900 text-base font-normal outline-none py-2.5 bg-white/30 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300" />
              <div class="h-10 inline-flex flex-col justify-between items-start"><div class="justify-center text-black text-base font-medium leading-normal">% from base price</div><div class="justify-center text-black text-xs font-medium leading-none">(1,600 tokens/session)</div></div>
            </div>
          </div>
        </div>
    </BookingSectionsWrapper>

       <BookingSectionsWrapper
      title="Calendar Availability"
      leftIcon="https://i.ibb.co/Ldw310vp/Icon.png"
    >
      <div class="w-full flex flex-col gap-5 mt-5">
        <div class="flex flex-col gap-3 w-full">
          <div
            class="self-stretch justify-start text-gray-900 text-xs font-normal font-['Poppins'] leading-none"
          >
            GMT +8 Hong Kong Standard time
          </div>

          <BaseInput
            type="number"
            placeholder="15"
            v-model="duration"
            inputClass="bg-white/50 w-full px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300"
          />
          <div class="self-stretch inline-flex justify-start items-end">
            <div
              class="flex-1 inline-flex flex-col justify-start items-start gap-1.5"
            >
              <div
                class="self-stretch flex flex-col justify-start items-start gap-1.5"
              >
                <div class="justify-start">
                  <span
                    class="text-gray-500 text-sm font-medium font-['Poppins'] leading-tight"
                    >Duration </span
                  ><span
                    class="text-gray-500 text-xs italic font-normal font-['Poppins'] leading-none"
                    >Optional</span
                  >
                </div>
                <div
                  class="self-stretch px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 inline-flex justify-start items-center gap-2"
                >
                  <div class="flex-1 flex justify-start items-center gap-2">
                    <img src="https://i.ibb.co/ntP5c3B/Icon-1.png" alt="" />
                    <div
                      class="flex-1 justify-start text-gray-900 text-base font-normal font-['Poppins'] leading-normal"
                    >
                      From
                    </div>
                  </div>
                  <div class="w-4 h-4 relative" />
                </div>
              </div>
            </div>
            <div
              class="flex-1 inline-flex flex-col justify-start items-start gap-1.5"
            >
              <div
                class="self-stretch flex flex-col justify-start items-start gap-1.5"
              >
                <div
                  class="self-stretch px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 inline-flex justify-start items-center gap-2"
                >
                  <div class="flex-1 flex justify-start items-center gap-2">
                    <img src="https://i.ibb.co/ntP5c3B/Icon-1.png" alt="" />

                    <div
                      class="flex-1 justify-start text-gray-900 text-base font-normal font-['Poppins'] leading-normal"
                    >
                      To
                    </div>
                  </div>
                  <div class="w-4 h-4 relative" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-4 w-full">
          <div
            class="self-stretch min-h-10 inline-flex justify-start items-center gap-3"
          >
            <div
              class="w-12 justify-start text-gray-500 text-base font-normal font-['Poppins'] leading-normal"
            >
              Sun
            </div>
            <div
              class="flex-1 justify-start text-gray-500 text-base font-normal font-['Poppins'] leading-normal"
            >
              Not Available
            </div>
            <img src="https://i.ibb.co/7J7qwz6H/Icon-3.png" alt="" />
          </div>
          <div
            class="self-stretch inline-flex justify-start items-center gap-1"
          >
            <div
              class="w-10 justify-start text-gray-500 text-base font-normal font-['Poppins'] leading-normal"
            >
              Mon
            </div>
            <div
              class="flex-1 inline-flex flex-col justify-start items-start gap-1.5"
            >
              <div
                class="self-stretch flex flex-col justify-start items-start gap-1.5"
              >
                <div
                  class="self-stretch px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 inline-flex justify-start items-start"
                >
                  <div
                    class="flex-1 justify-start text-gray-900 text-base font-normal font-['Poppins'] leading-normal"
                  >
                    Todo
                  </div>
                </div>
              </div>
            </div>
            <div
              class="justify-start text-gray-500 text-base font-medium font-['Poppins'] leading-normal"
            >
              -
            </div>
            <div
              class="flex-1 inline-flex flex-col justify-start items-start gap-1.5"
            >
              <div
                class="self-stretch px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 inline-flex justify-start items-start"
              >
                <div
                  class="flex-1 justify-start text-gray-900 text-base font-normal font-['Poppins'] leading-normal"
                >
                  Todo
                </div>
              </div>
            </div>
            <div class="pl-1 flex justify-start items-center gap-2">
              <img src="https://i.ibb.co/3yZjgcNV/Icon.png" alt="" />
              <img src="https://i.ibb.co/7J7qwz6H/Icon-3.png" alt="" />
              <img src="https://i.ibb.co/xqh8KkBk/Icon-1.png" alt="" />
            </div>
          </div>
          <div class="self-stretch inline-flex justify-start items-start gap-1">
            <div
              class="w-10 h-10 justify-center text-gray-500 text-base font-normal font-['Poppins'] leading-normal"
            >
              Tue
            </div>
            <div
              class="flex-1 inline-flex flex-col justify-center items-start gap-1"
            >
              <div
                class="self-stretch inline-flex justify-start items-center gap-1"
              >
                <div
                  class="flex-1 inline-flex flex-col justify-start items-start gap-1.5"
                >
                  <div
                    class="self-stretch flex flex-col justify-start items-start gap-1.5"
                  >
                    <div
                      class="self-stretch px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 inline-flex justify-start items-start"
                    >
                      <div
                        class="flex-1 justify-start text-gray-900 text-base font-normal font-['Poppins'] leading-normal"
                      >
                        Todo
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  class="justify-start text-gray-500 text-base font-medium font-['Poppins'] leading-normal"
                >
                  -
                </div>
                <div
                  class="flex-1 inline-flex flex-col justify-start items-start gap-1.5"
                >
                  <div
                    class="self-stretch px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 inline-flex justify-start items-start"
                  >
                    <div
                      class="flex-1 justify-start text-gray-900 text-base font-normal font-['Poppins'] leading-normal"
                    >
                      Todo
                    </div>
                  </div>
                </div>
                <div class="pl-1 flex justify-start items-center gap-2">
                  <img src="https://i.ibb.co/3yZjgcNV/Icon.png" alt="" />
                  <img src="https://i.ibb.co/7J7qwz6H/Icon-3.png" alt="" />
                  <img src="https://i.ibb.co/xqh8KkBk/Icon-1.png" alt="" />
                </div>
              </div>
              <div
                class="self-stretch inline-flex justify-start items-center gap-1"
              >
                <div
                  class="flex-1 inline-flex flex-col justify-start items-start gap-1.5"
                >
                  <div
                    class="self-stretch flex flex-col justify-start items-start gap-1.5"
                  >
                    <div
                      class="self-stretch px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 inline-flex justify-start items-start"
                    >
                      <div
                        class="flex-1 justify-start text-gray-900 text-base font-normal font-['Poppins'] leading-normal"
                      >
                        Todo
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  class="justify-start text-gray-500 text-base font-medium font-['Poppins'] leading-normal"
                >
                  -
                </div>
                <div
                  class="flex-1 inline-flex flex-col justify-start items-start gap-1.5"
                >
                  <div
                    class="self-stretch px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 inline-flex justify-start items-start"
                  >
                    <div
                      class="flex-1 justify-start text-gray-900 text-base font-normal font-['Poppins'] leading-normal"
                    >
                      Todo
                    </div>
                  </div>
                </div>
                <div
                  class="pl-1 relative flex justify-start items-center gap-2"
                >
                  <img src="https://i.ibb.co/3yZjgcNV/Icon.png" alt="" />
                  <img src="https://i.ibb.co/7J7qwz6H/Icon-3.png" alt="" />
                  <img src="https://i.ibb.co/xqh8KkBk/Icon-1.png" alt="" />
                </div>
              </div>
            </div>
          </div>
          <div
            class="self-stretch inline-flex justify-start items-center gap-1"
          >
            <div
              class="w-10 justify-start text-gray-500 text-base font-normal font-['Poppins'] leading-normal"
            >
              Wed
            </div>
            <div
              class="flex-1 inline-flex flex-col justify-start items-start gap-1.5"
            >
              <div
                class="self-stretch flex flex-col justify-start items-start gap-1.5"
              >
                <div
                  class="self-stretch px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 inline-flex justify-start items-start"
                >
                  <div
                    class="flex-1 justify-start text-gray-900 text-base font-normal font-['Poppins'] leading-normal"
                  >
                    Todo
                  </div>
                </div>
              </div>
            </div>
            <div
              class="justify-start text-gray-500 text-base font-medium font-['Poppins'] leading-normal"
            >
              -
            </div>
            <div
              class="flex-1 inline-flex flex-col justify-start items-start gap-1.5"
            >
              <div
                class="self-stretch px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 inline-flex justify-start items-start"
              >
                <div
                  class="flex-1 justify-start text-gray-900 text-base font-normal font-['Poppins'] leading-normal"
                >
                  Todo
                </div>
              </div>
            </div>
            <div class="pl-1 flex justify-start items-center gap-2">
              <img src="https://i.ibb.co/3yZjgcNV/Icon.png" alt="" />
              <img src="https://i.ibb.co/7J7qwz6H/Icon-3.png" alt="" />
              <img src="https://i.ibb.co/xqh8KkBk/Icon-1.png" alt="" />
            </div>
          </div>
          <div
            class="self-stretch inline-flex justify-start items-center gap-1"
          >
            <div
              class="w-10 justify-start text-gray-500 text-base font-normal font-['Poppins'] leading-normal"
            >
              Thu
            </div>
            <div
              class="flex-1 inline-flex flex-col justify-start items-start gap-1.5"
            >
              <div
                class="self-stretch flex flex-col justify-start items-start gap-1.5"
              >
                <div
                  class="self-stretch px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 inline-flex justify-start items-start"
                >
                  <div
                    class="flex-1 justify-start text-gray-900 text-base font-normal font-['Poppins'] leading-normal"
                  >
                    Todo
                  </div>
                </div>
              </div>
            </div>
            <div
              class="justify-start text-gray-500 text-base font-medium font-['Poppins'] leading-normal"
            >
              -
            </div>
            <div
              class="flex-1 inline-flex flex-col justify-start items-start gap-1.5"
            >
              <div
                class="self-stretch px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 inline-flex justify-start items-start"
              >
                <div
                  class="flex-1 justify-start text-gray-900 text-base font-normal font-['Poppins'] leading-normal"
                >
                  Todo
                </div>
              </div>
            </div>
            <div class="pl-1 relative flex justify-start items-center gap-2">
              <img src="https://i.ibb.co/3yZjgcNV/Icon.png" alt="" />
              <img src="https://i.ibb.co/7J7qwz6H/Icon-3.png" alt="" />
              <img src="https://i.ibb.co/xqh8KkBk/Icon-1.png" alt="" />
            </div>
          </div>
          <div
            class="self-stretch inline-flex justify-start items-center gap-1"
          >
            <div
              class="w-10 justify-start text-gray-500 text-base font-normal font-['Poppins'] leading-normal"
            >
              Fri
            </div>
            <div
              class="flex-1 inline-flex flex-col justify-start items-start gap-1.5"
            >
              <div
                class="self-stretch flex flex-col justify-start items-start gap-1.5"
              >
                <div
                  class="self-stretch px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 inline-flex justify-start items-start"
                >
                  <div
                    class="flex-1 justify-start text-gray-900 text-base font-normal font-['Poppins'] leading-normal"
                  >
                    Todo
                  </div>
                </div>
              </div>
            </div>
            <div
              class="justify-start text-gray-500 text-base font-medium font-['Poppins'] leading-normal"
            >
              -
            </div>
            <div
              class="flex-1 inline-flex flex-col justify-start items-start gap-1.5"
            >
              <div
                class="self-stretch px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 inline-flex justify-start items-start"
              >
                <div
                  class="flex-1 justify-start text-gray-900 text-base font-normal font-['Poppins'] leading-normal"
                >
                  Todo
                </div>
              </div>
            </div>
            <div class="pl-1 flex justify-start items-center gap-2">
              <img src="https://i.ibb.co/3yZjgcNV/Icon.png" alt="" />
              <img src="https://i.ibb.co/7J7qwz6H/Icon-3.png" alt="" />
              <img src="https://i.ibb.co/TqB49zLj/cloud-moon.png" alt="" />
            </div>
          </div>
          <div
            class="self-stretch inline-flex justify-start items-center gap-1"
          >
            <div
              class="w-10 justify-start text-gray-500 text-base font-normal font-['Poppins'] leading-normal"
            >
              Sat
            </div>
            <div
              class="flex-1 inline-flex flex-col justify-start items-start gap-1.5"
            >
              <div
                class="self-stretch flex flex-col justify-start items-start gap-1.5"
              >
                <div
                  class="self-stretch px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 inline-flex justify-start items-start"
                >
                  <div
                    class="flex-1 justify-start text-gray-900 text-base font-normal font-['Poppins'] leading-normal"
                  >
                    Todo
                  </div>
                </div>
              </div>
            </div>
            <div
              class="justify-start text-gray-500 text-base font-medium font-['Poppins'] leading-normal"
            >
              -
            </div>
            <div
              class="flex-1 inline-flex flex-col justify-start items-start gap-1.5"
            >
              <div
                class="self-stretch px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 inline-flex justify-start items-start"
              >
                <div
                  class="flex-1 justify-start text-gray-900 text-base font-normal font-['Poppins'] leading-normal"
                >
                  Todo
                </div>
              </div>
            </div>
            <div class="pl-1 relative flex justify-start items-center gap-2">
              <img src="https://i.ibb.co/3yZjgcNV/Icon.png" alt="" />
              <img src="https://i.ibb.co/7J7qwz6H/Icon-3.png" alt="" />
              <img src="https://i.ibb.co/TqB49zLj/cloud-moon.png" alt="" />
            </div>
          </div>
        </div>
      </div>
    </BookingSectionsWrapper>

    <div class="w-full bg-[#D0D5DD] h-[1px]"></div>

    <BookingSectionsWrapper
      title=" Call Settings"
      leftIcon="https://i.ibb.co/xq0ZdVmP/Icon.png"
      accordionIcon="https://i.ibb.co/MD46QRZS/Frame-1410099649.png"
      :is-open="sectionsState.callSettings"
      @toggle="toggleSection('callSettings')"
    >
      <div v-show="sectionsState.callSettings" class="flex flex-col justify-start items-start gap-5 mt-5">
        <div class="self-stretch flex flex-col justify-center items-start gap-3">
          <div class="self-stretch flex flex-col justify-center items-start gap-1">
            <div class="self-stretch inline-flex justify-start items-center gap-1"><div class="justify-start text-slate-700 text-base font-normal leading-normal">Offer discount if call starts late</div><img src="https://i.ibb.co/HD78k3Sf/Icon.png" alt="" /></div>
          </div>
          <div class="self-stretch flex flex-col justify-start items-start gap-1.5">
            <div class="self-stretch flex flex-col justify-start items-start gap-1.5">
              <div class="self-stretch px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 inline-flex justify-start items-start"><div class="flex-1 justify-start text-gray-900 text-base font-normal leading-normal">Todo</div></div>
            </div>
          </div>
        </div>
        <div class="self-stretch flex flex-col justify-center items-start gap-3">
          <div class="self-stretch flex flex-col justify-center items-start gap-1">
            <div class="self-stretch justify-start text-slate-700 text-base font-normal leading-normal">Call functions</div>
            <CheckboxGroup label="Disable chat during call" checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45" labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal" wrapperClass="flex items-center gap-2 mb-3 mt-2" />
          </div>
        </div>
        <div class="self-stretch flex flex-col justify-center items-start gap-3">
          <div class="self-stretch flex flex-col justify-center items-start gap-1">
            <div class="self-stretch inline-flex justify-start items-center gap-1"><div class="justify-start text-slate-700 text-base font-normal leading-normal">Fan can request to extend session in call</div><img src="https://i.ibb.co/HD78k3Sf/Icon.png" alt="" /></div>
            <div class="inline-flex justify-start items-center gap-2">
              <CheckboxGroup checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45" labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal" wrapperClass="flex items-center gap-2" />
              <div class="opacity-50 flex justify-start items-end gap-2">
                <BaseInput type="number" placeholder="15" v-model="duration" inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300" />
                <div class="h-10 inline-flex flex-col justify-between items-start"><div class="justify-center text-black text-base font-medium leading-normal">sessions maximum</div><div class="justify-center text-black text-xs font-medium leading-none">(30 minutes)</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BookingSectionsWrapper>

    <div class="w-full bg-[#D0D5DD] h-[1px]"></div>

    <BookingSectionsWrapper
      title=" Booking Settings"
      leftIcon="https://i.ibb.co/nNmmvwnf/Icon-1.png"
      accordionIcon="https://i.ibb.co/MD46QRZS/Frame-1410099649.png"
      :is-open="sectionsState.bookingSettings"
      @toggle="toggleSection('bookingSettings')"
    >
      <div v-show="sectionsState.bookingSettings" class="flex flex-col justify-start items-start gap-5 mt-5">
        <div class="self-stretch flex flex-col justify-center items-start gap-3">
          <div class="self-stretch flex flex-col justify-center items-start gap-1">
            <div class="self-stretch inline-flex justify-start items-center gap-1">
              <div class="justify-start text-slate-700 text-base font-normal leading-normal">Call reminder</div>
              <img src="https://i.ibb.co/HD78k3Sf/Icon.png" alt="" />
            </div>
            <div class="self-stretch flex flex-col justify-start items-start">
              <div class=" inline-flex justify-end items-center gap-2">
                <div class="justify-center text-slate-700 text-base font-normal leading-normal">Remind me</div>
                <BaseInput type="number" placeholder="15" v-model="duration" inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300" />
                <div class="flex-1 justify-center text-slate-700 text-base font-normal leading-normal">minutes before a</div>
              </div>
              <div class="inline-flex justify-end items-center gap-2"><div class="justify-center text-slate-700 text-base font-normal leading-normal">scheduled call.</div></div>
            </div>
          </div>
        </div>
        <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <div class="flex gap-2 items-center">
              <CheckboxGroup label="Set buffer time between booked appointments" checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45" labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal" wrapperClass="flex items-center gap-2" />
              <div class="mt-[2px]"><img src="https://i.ibb.co/HD78k3Sf/Icon.png" alt="" /></div>
            </div>
            <div class="inline-flex justify-start items-center gap-2">
              <div class="w-6 h-6" />
              <div class="opacity-50 flex justify-start items-end gap-2"><BaseInput type="number" placeholder="15" v-model="duration" inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300" />
                <div class="w-44 inline-flex flex-col justify-start items-start gap-1.5"><div class="self-stretch flex flex-col justify-start items-start gap-1.5"><div class="self-stretch px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 inline-flex justify-start items-start"><div class="flex-1 justify-start text-gray-900 text-base font-normal leading-normal">Todo</div></div></div></div>
              </div>
            </div>
          </div>
          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <div class="flex gap-2 items-center"><CheckboxGroup label="Set maximum bookings per day" checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45" labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal" wrapperClass="flex items-center gap-2" /><div class="mt-[2px]"><img src="https://i.ibb.co/HD78k3Sf/Icon.png" alt="" /></div></div>
            <div class="inline-flex justify-start items-center gap-2"><div class="w-6 h-6" /><div class="opacity-50 flex justify-start items-end gap-2"><BaseInput type="number" placeholder="15" v-model="duration" inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300" /></div></div>
          </div>
          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <div class="self-stretch flex flex-col justify-center items-start gap-1">
              <div class="flex gap-2 items-center"><CheckboxGroup label="If booking slots are full, allow fans to join waitlist" checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45" labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal" wrapperClass="flex items-center gap-2" /><div class="mt-[2px]"><img src="https://i.ibb.co/HD78k3Sf/Icon.png" alt="" /></div></div>
              <div class="self-stretch inline-flex justify-start items-start gap-2"><div class="w-6 h-10" /><div class="opacity-50 inline-flex flex-col justify-start items-start"><div class="inline-flex justify-end items-center gap-2"><BaseInput type="number" placeholder="15" v-model="duration" inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300" /><div class="justify-center text-slate-700 text-base font-normal leading-normal">waitlist spots</div></div></div></div>
            </div>
          </div>
      </div>
    </BookingSectionsWrapper>

    <div class="w-full bg-[#D0D5DD] h-[1px] mb-[80px] mt-[10px]"></div>

    <div class="absolute right-0 bottom-0">
      <ButtonComponent
        @click="goToNext"
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

  </form>
</template>

<style scoped>
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  opacity: 1 !important;
  visibility: visible !important;
  -webkit-appearance: inner-spin-button !important;
}
</style>