<template>
    <div class="w-full md:w-96 p-4 bg-gray-100 rounded-[10px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.15)] inline-flex flex-col justify-start items-start gap-4 md:gap-6">
  <div class="self-stretch inline-flex justify-between items-center">
    <div class="size- flex justify-start items-center gap-2">
      <div>
        <img :src="ClockPlusIcon" alt="clock-plus" class="w-4 h-4">
      </div>
      <div class="justify-start text-slate-700 text-sm font-semibold font-['Poppins'] leading-5">Ask for more time</div>
    </div>
    <div data-svg-wrapper class="relative cursor-pointer">
     <img src="https://i.ibb.co/G4Y3BB6c/Icon.png" alt="x-close" class="w-2.5 h-2.5">
    </div>
  </div>
  <div class="self-stretch flex flex-col justify-start items-start gap-2">
    <div class="justify-start text-gray-500 text-sm font-medium font-['Poppins'] leading-5">New Event date</div>
    <div class="flex flex-col gap-1.5 flex-1">
        <div class="max-w-md">
            <div class="flex items-center gap-3 bg-white/50 border-gray-200 rounded-t-[2px] border-b border-[#D0D5DD] px-3 py-2">
                
                <!-- Calendar Icon -->
                <div >
                <img :src="CalenderDateIcon" alt="calender-date" class="w-4 h-4">
                </div>
                <!-- Input -->
                <input 
                type="text" 
                value="Tue, August 24, 2025"
                class="bg-transparent outline-none text-gray-900 text-lg font-medium w-full"
                placeholder="Select date"
                readonly
                />   
            </div>
        </div>
        <div class="justify-start text-slate-600 text-sm font-normal font-['Poppins'] leading-5">Original start time:9:15pm</div>
    </div>
  </div>
  <div class="self-stretch inline-flex justify-start items-center gap-2">
    <div class="flex-1 inline-flex flex-col justify-start items-start gap-1.5">
      <div class="self-stretch flex flex-col justify-start items-start gap-1.5">
        <div class="justify-start text-gray-500 text-sm font-medium font-['Poppins'] leading-5">New start time</div>
        <div class="flex items-center gap-2 mt-3 ">
            <BaseInput type="number" placeholder=""
              inputClass="px-3.5 text-gray-900 placeholder:text-gray-900 w-full text-base font-normal outline-none py-2.5 bg-white/30 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300" />
            <div class=" text-black text-base font-medium leading-normal">-10:30pm</div>
          </div>
      </div>
      <div class="justify-start text-slate-600 text-sm font-normal font-['Poppins'] leading-5">Original start time:9:15pm</div>
    </div>
  </div>
  <div class="self-stretch h-10 min-w-24 pl-6 pr-2 py-2 bg-[#07F468] inline-flex justify-center items-center gap-2">
    <div class="flex-1 text-center justify-start text-gray-950 text-base font-medium font-['Poppins'] leading-6">Send request to @jennyhunny</div>
    <div class="relative">
      <img :src="SendIcon" alt="send" class="w-6 h-6">
    </div>
  </div>
</div>
</template>
<script setup>
import BaseInput from "@/components/dev/input/BaseInput.vue";
import ClockPlusIcon from "@/assets/images/icons/clock-plus.webp";
import SendIcon from "@/assets/images/icons/send-03.webp";
import CalenderDateIcon from "@/assets/images/icons/calendar-date.webp";
    
</script>
