<template>
  <div class="w-52 p-2 bg-white rounded-tl-[10px] rounded-tr-[10px] inline-flex justify-between items-center">
  <div class="size- relative flex justify-start items-center gap-2">
    <div data-svg-wrapper class="relative">
      <img :src="MessageTextIcon" alt="" class="w-6 h-6 filter brightness-0 cursor-pointer"/>
    </div>
    <div data-color="Default" data-count="true" data-leading-icon="false" data-size="Default" data-state="Default" data-tag="false" class="size- flex justify-start items-center gap-1">
      <div class="justify-start text-gray-500 text-sm font-medium font-['Poppins'] leading-5">4 NEW MESSAGES</div>
      <div class="self-stretch inline-flex flex-col justify-start items-center gap-2.5"></div>
    </div>
    <div data-svg-wrapper class="left-[18px] top-0 absolute">
      <div class="size-1.5 rounded-full bg-[#FF0464]"></div>
    </div>
  </div>
  <div data-svg-wrapper class="relative">
    <img src="https://i.ibb.co/G4Y3BB6c/Icon.png" alt="x-close" class="w-2.5 h-2.5 cursor-pointer">
  </div>
</div>
</template>
<script setup>
import MessageTextIcon from '@/assets/images/icons/message-text-square-02.webp'
</script>
