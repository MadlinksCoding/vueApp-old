<template>
   <div class="w-full border-l-[4px] border-[#5549FF] bg-[#F9FAFB] rounded shadow-lg inline-flex items-start overflow-hidden font-['Poppins']">
      <div class="w-full p-2 flex items-start">
         <div class="self-stretch inline-flex flex-col justify-start items-start gap-3">
            <div class="self-stretch flex flex-col justify-start items-start gap-2">
               <div class="w-full inline-flex justify-between items-center">
                  <div class="text-gray-700 text-xl font-semibold font-['Poppins'] leading-tight pr-4">
                     Call me and i will sing with you
                  </div>
                  <button type="button" class="inline-flex w-6 h-6 items-center justify-center rounded hover:bg-gray-100 text-[#98A2B3] p-1 -mt-1 -mr-2">
                     <img :src="DotsIcon" alt="dots" class="w-4 h-4">
                  </button>
               </div>
               <div class="self-stretch inline-flex justify-start items-start gap-1">
                  <div class="justify-center text-slate-700 text-sm font-medium font-['Poppins'] leading-5">April 24, 2025</div>
                  <div class="justify-center text-slate-700 text-sm font-medium font-['Poppins'] leading-5">2:15pm-9:30pm</div>
               </div>
               <div class="self-stretch inline-flex justify-start items-start gap-2">
                  <div class="justify-center text-gray-500 text-base font-semibold font-['Poppins'] line-through leading-6">500</div>
                  <div class="justify-center text-indigo-600 text-base font-semibold font-['Poppins'] leading-6">1337 Token</div>
               </div>
            </div>
            <div class="self-stretch flex flex-col justify-start items-start gap-1">
               <div class="w-44 justify-start text-gray-500 text-xs font-normal font-['Poppins'] leading-4">Your remarks</div>
               <div class="self-stretch justify-start text-indigo-600 text-sm font-normal font-['Poppins'] leading-5 line-clamp-2">I charge a flat rate of 500 tokens for each personal request. for you I need to charge USD 40 worth of tokens more for the special costume you requested on top of that.</div>
            </div>
            <div class="self-stretch inline-flex justify-start items-center gap-1">
               <div class="flex justify-start items-center gap-1">
                  <div data-svg-wrapper class="relative">
                     <img :src="HourglassIcon" alt="hourglass" class="w-4 h-4">
                  </div>
                  <div class="w-44 justify-start text-gray-500 text-xs font-normal font-['Poppins'] leading-4">waiting for response</div>
               </div>
               <div class="flex-1 flex justify-end items-center gap-0.5">
                  <div class="justify-start text-indigo-600 text-xs font-medium font-['Poppins'] leading-4">View Details</div>
                  <div >
                     <img :src="ArrowRightIcon" alt="arrow-right" class="w-4 h-4">
                  </div>
               </div>
            </div>
         </div>
      </div>
   </div>
</template>
<script setup>
   // Static Event Details Popup Component for Dashboard
import ArrowRightIcon from "@/assets/images/icons/arrow-up-right.webp";
import HourglassIcon from "@/assets/images/icons/hourglass-03.webp";
import DotsIcon from "@/assets/images/icons/dots-vertical.webp";
</script>