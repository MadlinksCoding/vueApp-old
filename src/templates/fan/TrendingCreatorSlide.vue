<template>
  <li
    class="splide__slide o-60 md:[will-change:width,transform] md:duration-300 md:min-w-[calc((100vw-29rem-32px)/4)] md:max-w-[calc((100vw-29rem-32px)/4)] lg:min-w-[calc((100vw-45rem-32px)/4)] lg:max-w-[calc((100vw-45rem-32px)/4)] group md:[&.active]:min-w-[24rem] md:[&.active]:max-w-[24rem] md:[&.active]:duration-500 md:[&.active]:opacity-100 md:[&.active]:cursor-pointer lg:[&.active]:min-w-[45rem] lg:[&.active]:max-w-[45rem]"
  >
    <div class="w-full h-[30rem] md:h-[23.438rem] lg:h-[28.75rem]">
      <div
        class="w-full h-full relative bg-cover bg-center bg-no-repeat"
        :style="`background-image: url('${backgroundImage}')`"
      >
        <!-- main-image -->
        <div
          class="absolute top-0 left-0 z-[1] w-full h-[23rem] sm:h-[23.438rem] md:invisible md:duration-200 md:h-full md:group-[.active]:w-full md:group-[.active]:visible md:group-[.active]:duration-500 lg:group-[.active]:w-[70%]"
        >
          <div
            class="w-full h-full relative bg-cover bg-no-repeat"
            :style="`background-image: url('${backgroundImage}')`"
          >
            <div class="flex justify-center w-full h-full overflow-hidden">
              <img
                :src="backgroundImage"
                alt=""
                class="w-full h-full object-cover align-bottom"
              />
            </div>
          </div>
        </div>

        <!-- main-content -->
        <div
          class="flex flex-col h-full relative z-[3] md:hidden md:invisible md:duration-500 md:overflow-hidden md:group-[.active]:visible md:group-[.active]:flex md:group-[.active]:duration-300 lg:group-[.active]:flex-row"
        >
          <div
            class="hidden absolute top-0 right-0 w-[90%] h-full bg-cover [background-position:center_bottom] z-10 pointer-events-none backdrop-blur-[50px] [-webkit-backdrop-filter:blur(50px)] [-moz-backdrop-filter:blur(50px)] [mask-image:linear-gradient(to_left,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_30%,rgba(0,0,0,1)_50%,rgba(0,0,0,0.2)_70%,rgba(0,0,0,0)_100%)] [-webkit-mask-image:linear-gradient(to_left,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_30%,rgba(0,0,0,1)_50%,rgba(0,0,0,0.2)_70%,rgba(0,0,0,0)_100%)] [mask-repeat:no-repeat] [mask-size:cover] [-webkit-mask-repeat:no-repeat] [-webkit-mask-size:cover] [will-change:backdrop-filter] lg:flex xl:block"
          ></div>
          <div
            class="flex absolute bottom-0 left-0 w-full h-[70%] bg-cover [background-position:center_bottom] z-20 pointer-events-none backdrop-blur-[50px] [-webkit-backdrop-filter:blur(50px)] [-moz-backdrop-filter:blur(50px)] [mask-image:linear-gradient(to_top,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_30%,rgba(0,0,0,1)_50%,rgba(0,0,0,0.2)_70%,rgba(0,0,0,0)_100%)] [-webkit-mask-image:linear-gradient(to_top,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_30%,rgba(0,0,0,1)_50%,rgba(0,0,0,0.2)_70%,rgba(0,0,0,0)_100%)] lg:hidden"
          ></div>

          <!-- left -->
          <div class="flex h-full flex-grow z-[20]">
            <div class="flex flex-col justify-between flex-grow p-2 lg:p-4">
              <!-- status -->
              <div class="flex items-center gap-1 w-full md:w-auto">
                <span class="block w-2 h-2 rounded-full bg-[#2ed3b7] flex-none"></span>
                <span class="text-xs leading-normal text-white whitespace-nowrap">
                  Updated recently
                </span>
              </div>

              <!-- image-carousel -->
              <div class="hidden gap-2 lg:flex">
                <div
                  v-for="(image, index) in gallery"
                  :key="index"
                  class="w-[3.125rem] h-[3.125rem] overflow-hidden"
                >
                  <img :src="image" alt="" class="w-full h-full object-cover align-bottom" />
                </div>
              </div>
            </div>
          </div>

          <!-- right -->
          <div class="flex h-auto w-full lg:w-80 lg:h-full z-[20]">
            <div
              class="flex flex-col justify-between w-full relative flex-grow px-2.5 pt-2 pb-8 [linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.05)_100%)] md:[linear-gradient(180deg,rgba(0,0,0,0)_40%,rgba(0,0,0,0.05)_100%)] lg:[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.06)_30%,rgba(255,255,255,0.1)_100%)] lg:p-4"
            >
              <div
                class="flex flex-col justify-end items-center relative z-[2] flex-grow gap-1 lg:gap-6 lg:items-start xl:items-[unset]"
              >
                <div class="flex flex-col gap-2 sm:gap-1 lg:gap-2">
                  <div class="flex flex-col items-center gap-1 lg:items-start xl:gap-2">
                    <a href="#">
                      <h3
                        class="text-xl leading-normal font-medium text-white drop-shadow-[0_0_0.5rem_rgba(0,0,0,0.5)] line-clamp-2 tracking-[-0.045rem] xl:text-xl xl:leading-normal xl:font-semibold"
                      >
                        {{ username }}
                      </h3>
                    </a>

                    <!-- media-user-info -->
                    <div class="flex flex-col gap-1 items-center xl:gap-0 xl:items-[unset]">
                      <a href="#" class="flex items-center gap-2">
                        <span
                          class="flex justify-center items-center overflow-hidden w-[1.375rem] h-[1.375rem] rounded-[25%_75%_50%_51%_/_45%_65%_36%_55%] shadow-[0_0_0.5rem_0_rgba(0,0,0,0.50)]"
                        >
                          <img :src="avatar" alt="" class="w-full h-full object-cover align-bottom" />
                        </span>

                        <span
                          class="flex items-center font-medium text-xs leading-normal gap-1 text-[#f9fafb] drop-shadow-[0_0_0.5rem_rgba(0,0,0,0.5)]"
                        >
                          {{ username }}
                          <span v-if="verified" class="w-2.5 h-2.5">
                            <img
                              src="https://i.ibb.co.com/nMhY8CpS/svgviewer-png-output-22.webp"
                              alt="verified-tick"
                              class="w-2.5 h-2.5"
                            />
                          </span>
                        </span>
                      </a>

                      <!-- profile-info-list -->
                      <div class="flex items-start gap-3">
                        <div
                          v-for="(stat, index) in stats"
                          :key="index"
                          class="flex items-center gap-1 drop-shadow-[0_0_0.5rem_rgba(0,0,0,0.5)]"
                        >
                          <span class="flex items-center">
                            <img :src="stat.icon" alt="" class="w-3.5 h-3.5 align-bottom" />
                          </span>
                          <span class="text-sm font-light text-[#f9fafb]">
                            {{ stat.value }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- buttons -->
                  <div class="flex items-center gap-2 py-1 relative lg:py-0">
                    <div class="flex min-w-[11.25rem] h-8 lg:h-10 xl:h-auto">
                      <button
                        class="h-8 lg:h-10 flex justify-center items-center gap-1 bg-black/10 px-10 py-1 flex-grow border border-[#07f46880] rounded-3xl sm:px-2 md:py-2 xl:px-10 group/button hover:bg-[#07f468]"
                      >
                        <span
                          class="text-sm font-medium text-[#07f468] md:text-base group-hover/button:text-black"
                        >
                          Follow
                        </span>
                      </button>
                    </div>

                    <button
                      class="flex items-center justify-center gap-1 w-8 h-8 bg-black/10 border border-white/50 rounded-full md:w-9 md:h-9 lg:w-10 lg:h-10 group hover:bg-[#fff3] hover:border-[rgba(233,229,211,0.5)]"
                    >
                      <img
                        src="https://i.ibb.co.com/WpRRBpNk/heart.webp"
                        alt="heart"
                        class="w-4 h-4 filter brightness-0 invert md:w-[1.125rem] md:h-[1.125rem] lg:w-5 lg:h-5"
                      />
                    </button>
                  </div>
                </div>

                <div class="flex flex-col gap-2">
                  <p
                    class="text-sm text-white [text-shadow:0_0_8px_rgba(0,0,0,0.5)] text-center line-clamp-2 break-all md:line-clamp-1 lg:line-clamp-3 lg:text-left"
                  >
                    {{ bio }}
                  </p>

                  <!-- tag-list -->
                  <div class="hidden md:flex flex-wrap gap-2 md:translate-y-0 md:duration-[800]">
                    <span
                      v-for="(tag, index) in tags"
                      :key="index"
                      class="flex justify-center items-center font-medium text-white whitespace-nowrap text-xs leading-normal px-2 py-1 bg-black/5"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </li>
</template>

<script setup>
defineProps({
  username: String,
  avatar: String,
  verified: Boolean,
  backgroundImage: String,
  bio: String,
  tags: Array,
  stats: Array,
  gallery: Array,
});
</script>
