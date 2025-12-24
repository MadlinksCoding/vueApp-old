<template>
    <div
                    class="flex flex-col justify-center items-center gap-6 p-6 w-full flex-grow h-72 lg:h-auto"
                  >
                    <div class="flex justify-center items-center">
                      <!-- progress-circle (empty) -->
                      <div
                        class="absolute z-[-1] w-[16.25rem] md:w-[22.5rem] pointer-events-none"
                      >
                        <img
                          src="https://i.ibb.co.com/jPRqjBCp/progress-circle.webp"
                          alt="progress-circle"
                          class="w-full h-auto"
                        />
                      </div>

                      <!-- balance-container -->
                      <div
                        class="absolute z-0 flex flex-col justify-center items-center gap-2 mt-16 md:mt-24"
                      >
                        <span class="text-base text-[#344054] dark:text-[#bdb8af]"
                          >Token Balance</span
                        >
                        <div
                          class="flex flex-col justify-center items-center gap-2"
                        >
                          <span class="text-5xl font-medium tracking-[0.015rem] dark:text-[#bdb8af]"
                            >0</span
                          >
                        </div>
                      </div>
                    </div>
                  </div>
</template>