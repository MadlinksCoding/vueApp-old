<template>
   <div class="w-full border-l-[4px] border-[#5549FF] bg-[#F9FAFB] rounded shadow-lg inline-flex items-start overflow-hidden font-['Poppins']">
      <div class="w-full p-2 flex items-start">
         <div class="self-stretch inline-flex flex-col justify-start items-start gap-3 flex-1">
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
               <div class="inline-flex justify-start items-center gap-1">
                <div data-svg-wrapper>
                    <div class="w-1.5 h-1.5 rounded-full bg-[#FF0066]"></div>
                </div>
                <div class="justify-start text-rose-600 text-xs font-medium font-['Poppins'] leading-4">in 5 min</div>
                </div>
                <div class="self-stretch inline-flex justify-start items-center gap-2">
                <div class="flex-1 px-2 py-[3px] bg-indigo-600 rounded-sm outline outline-1 outline-offset-[-1px] outline-indigo-600 flex justify-center items-center gap-1 cursor-pointer">
                    <div >
                    <img :src="PhoneIncomingIcon" alt="phone-incoming" class="w-4 h-4">
                    </div>
                    <div class="justify-start text-white text-xs font-semibold font-['Poppins'] leading-4">Join Call</div>
                </div>
                <div class="flex-1 px-2 py-[3px] bg-white rounded-sm outline outline-1 outline-offset-[-0.50px] outline-indigo-600 flex justify-center items-center gap-1 cursor-pointer">
                    <div >
                    <img :src="DotHorizontalIcon" alt="dot-horizontal" class="w-4 h-4">
                    </div>
                    <div class="justify-start text-indigo-600 text-xs font-semibold font-['Poppins'] leading-4">Other Options</div>
                </div>
                </div>
            </div>
         </div>
      </div>
   </div>

   <br>
   <br>

   <div class="w-40 bg-white rounded-xs shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] inline-flex flex-col justify-start items-start">
  <div class="self-stretch p-2 bg-gray-200 inline-flex justify-start items-center gap-2">
    <div >
      <img :src="ClockPlusIcon" alt="clock-plus" class="w-4 h-4">
    </div>
    <div class="justify-start text-slate-700 text-xs font-semibold font-['Poppins'] leading-4">Ask for more time</div>
  </div>
  <div class="self-stretch p-2 inline-flex justify-start items-center gap-2">
    <div >
      <img :src="CalenderDateIcon" alt="calender-date" class="w-4 h-4">
    </div>
    <div class="justify-start text-slate-700 text-xs font-semibold font-['Poppins'] leading-4">Ask to reschdule</div>
  </div>
  <div class="self-stretch p-2 inline-flex justify-start items-center gap-2">
    <div >
      <img :src="PhoneCutIcon" alt="phone-cut" class="w-4 h-4">
    </div>
    <div class="justify-start text-[#FF4405] text-xs font-semibold font-['Poppins'] leading-4">Cancel Call</div>
  </div>
</div>
</template>
<script setup>
   // Static Event Details Popup Component for Dashboard
import DotsIcon from "@/assets/images/icons/dots-vertical.webp";
import PhoneIncomingIcon from "@/assets/images/icons/phone-incoming.webp";
import DotHorizontalIcon from "@/assets/images/icons/dots-horizontal-blue.webp";
import ClockPlusIcon from "@/assets/images/icons/clock-plus-1.webp";
import CalenderDateIcon from "@/assets/images/icons/calendar-date.webp";
import PhoneCutIcon from "@/assets/images/icons/phone-x.webp";
</script>