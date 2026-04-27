<script setup>
defineProps({
  embedded: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <div
    data-test="booking-flow-step-loading-skeleton"
    class="relative h-dvh w-full overflow-hidden bg-[#0C111D] lg:h-full lg:w-[852px] lg:rounded-[20px]"
  >
    <div
      :class="[
        'flex h-full items-center lg:rounded-[20px] md:px-[10px] md:py-6 lg:bg-transparent lg:p-0',
        !embedded && 'md:bg-black',
      ]"
    >
      <div class="h-full w-full overflow-hidden md:rounded-[20px]">
        <div class="flex h-full flex-col bg-black/75 backdrop-blur-sm md:flex-row md:overflow-hidden md:rounded-[20px]">
          <aside class="hidden w-[280px] shrink-0 flex-col justify-between border-r border-white/10 bg-white/[0.04] p-6 md:flex">
            <div class="flex flex-col gap-5">
              <div class="h-5 w-28 rounded-full bg-white/10 animate-pulse" />
              <div class="h-40 rounded-[20px] bg-white/10 animate-pulse" />
              <div class="space-y-3">
                <div class="h-4 w-4/5 rounded-full bg-white/10 animate-pulse" />
                <div class="h-4 w-3/5 rounded-full bg-white/10 animate-pulse" />
              </div>
            </div>
            <div class="space-y-3">
              <div class="h-4 w-2/3 rounded-full bg-white/10 animate-pulse" />
              <div class="h-8 w-32 rounded-full bg-white/10 animate-pulse" />
            </div>
          </aside>

          <main class="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden px-4 pb-20 pt-7 md:px-8 md:pb-8">
            <div class="flex items-center justify-between gap-4">
              <div class="h-6 w-40 rounded-full bg-white/10 animate-pulse" />
              <div class="h-4 w-24 rounded-full bg-white/10 animate-pulse" />
            </div>

            <div class="grid grid-cols-7 gap-2">
              <div
                v-for="index in 35"
                :key="index"
                class="aspect-square rounded-[2px] bg-white/10 animate-pulse"
                :class="index % 9 === 0 ? 'opacity-40' : ''"
              />
            </div>

            <section class="flex flex-col gap-3">
              <div class="h-4 w-40 rounded-full bg-[#22CCEE]/35 animate-pulse" />
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="index in 8"
                  :key="`slot-${index}`"
                  class="h-10 w-[4.75rem] rounded-[0.625rem] border border-white/15 bg-white/5 animate-pulse"
                />
              </div>
            </section>

            <section class="flex flex-col gap-3">
              <div class="h-4 w-28 rounded-full bg-[#22CCEE]/35 animate-pulse" />
              <div class="rounded-[3.125rem] border-[3px] border-white/15 p-1">
                <div class="flex rounded-[3.125rem] bg-white/10 p-1">
                  <div class="h-8 flex-1 rounded-[3.125rem] bg-[#07F468]/35 animate-pulse" />
                  <div class="h-8 flex-1 rounded-[3.125rem] bg-transparent" />
                  <div class="h-8 flex-1 rounded-[3.125rem] bg-transparent" />
                </div>
              </div>
            </section>

            <section class="flex flex-col gap-3">
              <div class="h-4 w-36 rounded-full bg-[#22CCEE]/35 animate-pulse" />
              <div class="space-y-3">
                <div class="h-5 w-full rounded-full bg-white/10 animate-pulse" />
                <div class="h-5 w-5/6 rounded-full bg-white/10 animate-pulse" />
              </div>
            </section>

            <section class="mt-auto flex items-center justify-end">
              <div class="h-[3.3125rem] w-[14.625rem] rounded-tl-[2px] bg-[#07F468]/45 animate-pulse md:rounded-br-[20px]" />
            </section>
          </main>
        </div>
      </div>
    </div>
  </div>
</template>
