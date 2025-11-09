<template>
  <li class="splide__slide">
    <div
      class="h-[70%] [will-change:opacity,transform] pointer-events-none absolute bottom-0 left-0 w-full bg-cover [background-position:center_bottom] z-10 backdrop-blur-[50px] [-webkit-backdrop-filter:blur(50px)] [-moz-backdrop-filter:blur(50px)] [mask-composite:add] [-webkit-mask-composite:source-over] [mask-mode:alpha] [border-radius:0_!important] [mask-image:linear-gradient(to_top,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_30%,rgba(0,0,0,1)_50%,rgba(0,0,0,0.2)_70%,rgba(0,0,0,0)_100%)] [-webkit-mask-image:linear-gradient(to_top,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_30%,rgba(0,0,0,1)_50%,rgba(0,0,0,0.2)_70%,rgba(0,0,0,0)_100%)] block"
    ></div>

    <!-- items-card -->
    <div
      class="flex flex-col w-full relative rounded-lg rounded-md bg-cover bg-center bg-no-repeat shadow-[0_0_5px_0_rgba(0,0,0,0.25)] overflow-hidden h-80 md:h-[28.125rem]"
      :style="`background-image: url('${backgroundImage}')`"
    >
      <!-- main-content -->
      <div
        class="flex flex-col w-full h-full relative [background:linear-gradient(180deg,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0)_10%)]"
      >
        <!-- main-image -->
        <div class="w-full h-[65%] flex-grow md:h-[70%]">
          <img
            :src="backgroundImage"
            alt=""
            class="w-full h-full object-cover align-bottom"
          />
        </div>

        <!-- status -->
        <div
          class="absolute top-0 left-0 p-2 flex items-center gap-1 w-full drop-shadow-[0_0_.313rem_#000] sm:p-4 md:w-auto"
        >
          <span class="block w-2 h-2 rounded-full bg-[#2ed3b7] flex-none"></span>
          <span class="text-xs leading-normal text-white whitespace-nowrap">
            {{ statusText }}
          </span>
        </div>

        <!-- text-container -->
        <div
          class="flex flex-col justify-between gap-4 w-full [background:linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.5)_100%)] relative p-2 h-[9.125rem] -mt-[4.5rem] md:p-4 md:h-[10.875rem] max-[390px]:-mt-[3.5rem] z-10"
        >
          <div class="flex flex-col gap-3 relative z-[2]">
            <!-- media-user-info -->
            <div class="flex flex-col gap-1 md:gap-0.5">
              <div class="flex items-center gap-2">
                <a
                  href="#"
                  class="flex items-center gap-1 text-base font-semibold text-[#f9fafb] drop-shadow-[0_0_0.5rem_rgba(0,0,0,0.5)] md:text-xl md:leading-normal"
                >
                  <span
                    class="text-base font-semibold text-[#f9fafb] line-clamp-1 md:text-xl md:leading-normal"
                  >
                    {{ username }}
                  </span>

                  <span v-if="verified" class="w-2.5 h-2.5">
                    <img
                      src="https://i.ibb.co.com/nMhY8CpS/svgviewer-png-output-22.webp"
                      alt="verified-tick"
                      class="w-2.5 h-2.5"
                    />
                  </span>
                </a>
              </div>

              <div class="flex gap-1">
                <span
                  v-for="(info, index) in userInfo"
                  :key="index"
                  class="text-white text-xs leading-normal tracking-[0.038rem]"
                >
                  {{ info }}
                  <span v-if="index !== userInfo.length - 1">/</span>
                </span>
              </div>
            </div>

            <!-- tag-list -->
            <div class="flex gap-2">
              <span
                v-for="(tag, index) in tags"
                :key="index"
                class="flex justify-center items-center text-white bg-white/20 whitespace-nowrap text-xs px-2 py-1"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <!-- buttons -->
          <div
            class="flex items-center gap-2 h-8 py-1 relative z-[2] md:h-10 md:py-0"
          >
            <!-- Follow button -->
            <button
              class="flex justify-center items-center gap-1 bg-black/10 px-10 py-1 flex-grow border border-[#07f46880] rounded-3xl sm:px-2 md:py-2 xl:px-10 group hover:bg-[#07f468]"
            >
              <span
                class="text-sm font-medium text-[#07f468] md:text-base group-hover:text-black"
              >
                {{ followText }}
              </span>
            </button>

            <!-- Favorite button -->
            <button
              class="flex items-center justify-center gap-1 w-8 h-8 bg-black/10 border border-white/50 rounded-full md:w-10 md:h-10 group hover:bg-[#fff3] hover:border-[rgba(233,229,211,0.5)]"
            >
              <span class="relative">
                <img
                  :src="heartIcon"
                  alt="heart"
                  class="w-4 h-4 filter brightness-0 invert md:w-5 md:h-5"
                />
                <img
                  :src="heartFilledIcon"
                  alt="heart-filled"
                  class="w-4 h-4 filter hidden md:w-5 md:h-5"
                />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </li>
</template>

<script setup>
defineProps({
  username: String,
  verified: Boolean,
  backgroundImage: String,
  statusText: {
    type: String,
    default: 'Updated recently',
  },
  userInfo: {
    type: Array,
  },
  tags: {
    type: Array,
  },
  followText: {
    type: String,
    default: 'Follow',
  },
  heartIcon: {
    type: String,
    default: 'https://i.ibb.co.com/WpRRBpNk/heart.webp',
  },
  heartFilledIcon: {
    type: String,
    default: 'https://i.ibb.co.com/8LXDVHfd/heart-filled.webp',
  },
});
</script>
