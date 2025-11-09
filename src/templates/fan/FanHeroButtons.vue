<template>
  <div>
    <!-- trending-media -->
    <div
      class="flex flex-col w-full gap-4 flex-grow pl-10 opacity-30 md:px-4 lg:pl-10 lg:pr-0 group-hover:opacity-100"
    >
      <!-- offer tag and title -->
      <div class="flex flex-col gap-2.5">
        <!-- offer -->
        <div class="flex items-center gap-2.5 pl-2.5">
          <div
            class="flex justify-center items-center relative pr-2 backdrop-blur-[10px] rounded py-0.5 bg-[linear-gradient(90deg,#f06_0%,#ff4a92_100%)] pl-5"
          >
            <span
              class="absolute drop-shadow-[0_0_.313rem_#000] left-[-0.6rem] top-[-0.6rem]"
            >
              <img
                src="https://i.ibb.co.com/TBHLK0Vy/hot-fire.webp"
                alt="hot-fire"
                class="w-[1.375rem] h-8"
              />
            </span>

            <span class="text-sm font-semibold uppercase text-white"
              >HOTTT</span
            >
          </div>

          <!-- offer -->
          <h2
            class="text-5xl leading-[3.75rem] font-semibold tracking-[-0.06rem] line-clamp-1 text-white drop-shadow-[0_0_0.5rem_rgba(0,0,0,0.5)] md:text-3xl md:leading-[2.375rem] xl:text-5xl xl:leading-[3.75rem]"
          ></h2>
        </div>
      </div>

      <!-- button-group -->
      <div class="flex items-center gap-4">
        <a href="#" class="flex items-center gap-4">
          <!-- subscribe-button -->
          <button
            class="flex justify-center items-center bg-white/20 px-6 py-2 gap-1 backdrop-blur-[10px] border border-[#e9e5d380] rounded-3xl cursor-pointer hover:bg-black/10 group/button"
          >
            <span class="text-lg font-medium text-white">Subscribe now</span>
            <span
              class="text-[0.625rem] font-medium tracking-[0.013rem] text-white"
            >
              $
              <span class="text-xl leading-normal font-semibold text-white"
                >25</span
              >/month</span
            >
          </button>

          <!-- buy-now-button -->
          <button
            class="flex justify-center items-center bg-white/20 px-6 py-2 gap-1 backdrop-blur-[10px] border border-[#e9e5d380] rounded-3xl cursor-pointer hover:bg-black/10 group/button"
          >
            <span class="text-lg font-medium text-white">Buy now</span>
            <span
              class="text-[0.625rem] font-medium tracking-[0.013rem] text-white"
            >
              $
              <span class="text-xl leading-normal font-semibold text-white"
                >20</span
              ></span
            >
          </button>
        </a>
      </div>
    </div>
  </div>
</template>
