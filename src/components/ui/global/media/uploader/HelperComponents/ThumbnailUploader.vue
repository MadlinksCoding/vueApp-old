<template>
  <div
    data-media-upload
    class="cursor-pointer border-2 border-transparent bg-black/5 rounded-xl p-2 h-[12.1875rem] w-full flex flex-col items-center justify-center hover:border-dark-text dark:hover:border-dark-brown hover:bg-black/10 dark:hover:bg-black/5 group"
  >
    <div
      data-media-upload-input-wrap
      class="gap-1 w-full flex flex-col justify-center self-stretch border-2 border-dashed border-transparent"
    >
      <div class="flex flex-col items-center justify-center gap-3">
        <div
          class="shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] dark:shadow-[] rounded-lg h-10 w-10 relative flex justify-center items-center"
        >
          <input
            type="file"
            class="appearance-none z-[5] opacity-0 absolute w-full h-full cursor-pointer"
          />
          <span
            data-media-upload-icon-container
            class="cursor-pointer shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] dark:shadow-[0_1px_2px_0_rgba(13,19,32,0.05)] bg-success dark:bg-[#06c353] rounded-lg h-10 w-10 flex justify-center items-center group-hover:bg-black"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              class="w-5 h-5 cursor-pointer"
            >
              <g id="upload-cloud-02">
                <path
                  id="Icon"
                  d="M6.6665 13.3333L9.99984 10M9.99984 10L13.3332 13.3333M9.99984 10V17.5M16.6665 13.9524C17.6844 13.1117 18.3332 11.8399 18.3332 10.4167C18.3332 7.88536 16.2811 5.83333 13.7498 5.83333C13.5677 5.83333 13.3974 5.73833 13.3049 5.58145C12.2182 3.73736 10.2119 2.5 7.9165 2.5C4.46472 2.5 1.6665 5.29822 1.6665 8.75C1.6665 10.4718 2.36271 12.0309 3.48896 13.1613"
                  stroke="black"
                  stroke-width="1.66667"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="group-hover:stroke-success"
                />
              </g>
            </svg>
          </span>
        </div>
        <h4
          class="text-dark-gray dark:text-beige-text text-sm leading-5 text-center font-normal"
        >
          <span class="text-dark-text dark:text-dark-light-text font-semibold"
            >Click to upload
          </span>
          or drag and drop image file here
        </h4>
      </div>
      <div>
        <p
          class="text-dark-gray dark:text-beige-text text-xs leading-[1.125rem] text-center mb-0"
        >
         PNG or JPG (max. 10MB)
        </p>
      </div>
    </div>
  </div>
</template>
