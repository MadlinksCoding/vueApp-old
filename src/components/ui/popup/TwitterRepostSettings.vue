<template>
    <div class="w-screen h-screen md:w-[493px] md:h-auto overflow-y-auto p-2 md:p-4 pb-16 md:pb-4 bg-white/90 md:rounded-[10px] inline-flex flex-col justify-start items-start gap-4 relative">
  <div class="self-stretch bg-white/5 backdrop-blur-[5px] inline-flex justify-between items-start">
    <div class="justify-start text-slate-700 text-base font-medium font-['Poppins'] leading-6">X Repost Settings</div>
    <div  class="relative">
      <img src="https://i.ibb.co/G4Y3BB6c/Icon.png" alt="x-close" class="w-3 h-3 cursor-pointer">
    </div>
  </div>
  <div class="self-stretch py-2 flex flex-col justify-center items-start gap-6">
    <div class="self-stretch inline-flex justify-start items-start gap-2">
      <CheckboxSwitch  label="Post to X when my booking schedule is live" />
    </div>
  </div>
  <div class="self-stretch flex flex-col justify-start items-start gap-6">

    <div class="self-stretch hidden flex-col justify-start items-start gap-1.5">
        <div class="self-stretch justify-start text-gray-900 text-sm font-semibold font-['Poppins'] leading-5">Post Message (Leave blank to use system default message.)</div>
        <div class="self-stretch h-24 flex flex-col justify-start items-start gap-1.5">
            <div class="self-stretch flex-1 flex flex-col justify-start items-start gap-1.5">
            <div class="self-stretch flex-1 px-3.5 py-2.5 bg-white/30 rounded-tl-xs rounded-tr-xs shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 inline-flex justify-start items-start gap-2">
                <div class="flex-1 self-stretch flex justify-start items-center gap-2">
                <div class="flex-1 self-stretch justify-start text-gray-500 text-base font-normal font-['Poppins'] leading-6">My event ‘High school life simulator’ is now open for booking! </div>
                </div>
            </div>
            </div>
            <div class="self-stretch justify-start text-slate-600 text-sm font-normal font-['Poppins'] leading-5">66/72 characters</div>
        </div>
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
                <div class="self-stretch justify-start text-black text-base font-normal   leading-7">I have a new event ‘Let 3 queens hi you at the same time’ coming up! limited seats available! join now! <br/> <br/>Website.app/model/jellyskitchen/media/198386476</div>
              </div>
              <div class="w-20 pb-6 right-0 top-[-25px] absolute inline-flex flex-col justify-start items-start gap-2.5">
                <div class="self-stretch min-w-14 px-2 py-1 bg-blue-600 inline-flex justify-center items-center gap-2 cursor-pointer">
                  <div  class="relative">
                    <img :src="EditPencilIcon" alt="edit-pencil" class="w-4 h-4">
                  </div>
                  <div class="text-center justify-start text-white text-xs font-semibold font-['Poppins'] capitalize tracking-tight">Edit...</div>
                </div>
              </div>
            </div>
          </div>
          <div class="self-stretch min-h-10 p-1 relative bg-blue-50 rounded-xs outline outline-1 outline-offset-[-0.50px] outline-blue-600 inline-flex justify-center items-center gap-2.5">
             <div class="w-full">
              <!-- Uploaded image preview with delete button -->
              <ThumbnailUploaderNay
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
              />
            </div>
            <div class="size- pb-6 right-0 top-[-25px] absolute inline-flex flex-col justify-start items-start">
              <div class="self-stretch min-w-14 px-2 py-1 bg-blue-600 inline-flex justify-center items-center gap-2 cursor-pointer">
                <div  class="relative">
                  <img src="https://fansocial.app/wp-content/plugins/fansocial/assets/icons/svg/upload-cloud-02.svg" class="w-4 h-4 invert"/>
                </div>
                <div class="text-center justify-start text-white text-xs font-semibold font-['Poppins'] capitalize tracking-tight">Upload thumbnail</div>
                <div >
                  <img :src="ChevronDownFill"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="self-stretch flex fixed md:relative left-0 px-2 md:px-0 bottom-2 w-full md:w-auto">
    <div class="self-stretch h-10 min-w-24 px-6 py-2 bg-[#07F468] inline-flex justify-center items-center gap-2.5 cursor-pointer w-full">
      <div class="justify-start text-gray-900 text-base font-medium font-['Poppins'] leading-6">SAVE</div>
    </div>
  </div>
</div>
</template>

<script setup>

import CheckboxSwitch from "@/components/dev/checkbox/CheckboxSwitch.vue";
import VerifiedTickIcon from "@/assets/images/icons/verified-blue-white.webp" 
import AiArtIcon from "@/assets/images/icons/ai-art.webp" 
import ChevronDownFill from "@/assets/images/icons/chevron-down-fill.webp"
import EditPencilIcon from "@/assets/images/icons/edit-pencil.webp"
import ThumbnailUploaderNay from "@/components/ui/global/media/uploader/HelperComponents/ThumbnailUploaderNay.vue"
</script>