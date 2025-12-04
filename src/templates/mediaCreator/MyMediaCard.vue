<template>
  <div class="video-container w-full relative aspect-video cursor-pointer group-[.table-view]:w-[11.11125rem] group-[.table-view]:h-[6.25rem] lg:group-[.table-view]:w-[12.5rem] lg:group-[.table-view]:h-[7.03125rem] xl:group-[.table-view]:w-[14.22rem] xl:group-[.table-view]:h-32">
    <div class="w-full h-full bg-cover bg-center bg-no-repeat aspect-video overflow-hidden relative">
      <div class="w-full h-full flex justify-center items-center">
        <video class="object-cover w-full h-full" :src="videoSrc"></video>
      </div>
    </div>

    <div class="absolute top-0 left-0 z-[1] flex justify-center items-center gap-[0.188rem] px-1 py-0.5 rounded bg-[#303437B2] drop-shadow-[0_0_20px_rgba(0,0,0,0.25)]">
      <span class="text-xs text-white leading-normal tracking-[0.008rem]">video</span>
      <img src="https://i.ibb.co.com/wN978Hjm/video.webp" alt="video" class="w-4 h-4" />
    </div>

    <div class="flex absolute left-0 bottom-0 z-[1] group-[.table-view]:hidden">
      <span class="flex justify-center items-center p-1 gap-2 backdrop-blur-[10px] bg-[#07f468]">
        <img src="https://i.ibb.co.com/bMFQRqBP/upload.webp" alt="upload" class="w-4 h-4" />
      </span>
      <span class="text-[#07f468] text-xs font-medium leading-[1.125rem] flex justify-center items-center gap-2 px-[.375rem] py-[0.188rem] bg-black">Published</span>
    </div>

    <div class="hidden justify-center items-center bg-black w-8 h-8 absolute bottom-0 left-0 group-[.table-view]:flex">
      <img src="https://i.ibb.co.com/BVS7xsrK/video-icon.webp" alt="video-icon" class="w-5 h-5">
    </div>

    <div class="hidden justify-center items-center bg-black h-[1.375rem] px-1 absolute bottom-0 right-0 group-[.table-view]:flex">
      <span class="text-xs leading-normal font-semibold text-white">Trailer</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  videoSrc: {
    type: String,
    default: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
  }
});
</script>