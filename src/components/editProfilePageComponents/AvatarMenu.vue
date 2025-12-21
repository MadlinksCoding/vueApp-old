<template>
  <ul
    class="flex flex-col rounded-lg bg-white dark:bg-background-dark-popupBg border-[#BABCCB80] shadow-[0px_0px_10px_0px_#0000001A] w-max"
  >
    <!-- list-item -->
    <li
      class="h-12 flex items-center gap-2.5 p-2 border-b-[#DEE5EC] cursor-pointer"
    >
      <img
        src="https://i.ibb.co.com/wZgQbKp9/svgviewer-png-output-49.webp"
        alt="edit"
          class="w-6 h-6 transition-all duration-200
         [filter:brightness(0)]
         dark:[filter:brightness(0)_invert(100%)]"
      />
      <span
        class="text-base font-medium capitalize text-[#303437] dark:text-text"
        >edit</span
      >
    </li>

    <!-- list-item -->
    <li
      class="h-12 flex items-center gap-2.5 p-2 border-b-[#DEE5EC] cursor-pointer"
    >
      <img
        src="https://i.ibb.co.com/LzBLyfyn/upload-01.webp"
        alt="upload"
          class="w-6 h-6 transition-all duration-200
         [filter:brightness(0)]
         dark:[filter:brightness(0)_invert(100%)]"
      />
      <span
        class="text-base font-medium capitalize text-[#303437] dark:text-text"
        >upload new</span
      >
    </li>

    <!-- list-item -->
    <li
      class="h-12 flex items-center gap-2.5 p-2 border-b-[#DEE5EC] cursor-pointer"
    >
      <img
        src="https://i.ibb.co.com/HfqyVf84/Images.webp"
        alt="avatar"
          class="w-6 h-6 transition-all duration-200
         [filter:brightness(0)]
         dark:[filter:brightness(0)_invert(100%)]"
      />
      <span
        class="text-base font-medium capitalize text-[#303437] dark:text-text"
        >choose from avatars</span
      >
    </li>
  </ul>
</template>
