<template>
    <div class="flex flex-column justify-center items-center self-stretch gap-2 flex-grow md:p-4 md:pt-0">
        <div class="flex flex-col items-center w-full relative gap-4 md:gap-6">
            <div class="flex justify-between items-center self-stretch relative gap-6 w-full px-2 md:px-0">
                <!-- tabs-button-group -->
                <div
                    class="flex px-1 py-1 rounded-[3rem] bg-gradient-to-r from-[rgba(251,_91,_162,_0.15)] to-[rgba(251,_91,_162,_0.08)] border-none shadow-[0_1px_2px_0_rgba(16,_24,_40,_0.05)] overflow-hidden items-start w-full sm:w-max">
                    <button
                        class="trends-tabs-wrapper-button p-2 sm:px-4 sm:py-2 text-sm font-medium leading-5 dark:text-text justify-center items-center flex gap-2 outline-none border-none h-10 [flex:1] sm:h-auto sm:[flex:unset] whitespace-nowrap active [&.active]:rounded-[3rem] [&.active]:bg-black [&.active]:text-white [&.active]:font-semibold">
                        Subscriptions
                    </button>
                    <button
                        class="trends-tabs-wrapper-button p-2 sm:px-4 sm:py-2 text-sm font-medium leading-5 justify-center dark:text-text  items-center flex gap-2 outline-none border-none h-10 [flex:1] sm:h-auto sm:[flex:unset] whitespace-nowrap">
                        PPV
                    </button>
                    <button
                        class="trends-tabs-wrapper-button p-2 sm:px-4 sm:py-2 text-sm font-medium leading-5 justify-center items-center dark:text-text flex gap-2 outline-none border-none h-10 [flex:1] sm:h-auto sm:[flex:unset] whitespace-nowrap">
                        Merch
                    </button>
                    <button
                        class="trends-tabs-wrapper-button p-2 sm:px-4 sm:py-2 text-sm font-medium leading-5 justify-center items-center dark:text-text flex gap-2 outline-none border-none h-10 [flex:1] sm:h-auto sm:[flex:unset] whitespace-nowrap">
                        Custom Request
                    </button>
                </div>

                <!-- button -->
                <button
                    class="flex justify-center items-center gap-2.5 pl-4 pr-2 py-1 z-[1] [clip-path:polygon(0_0,100%_0,100%_100%,8%_100%)] bg-black [&.disabled]:grayscale [&.disabled]:bg-[#e6e6e6] [&.disabled]:cursor-default group max-[591px]:hidden hover:bg-[#07f468] group/button">
                    <div class="whitespace-nowrap">
                        <span
                            class="text-base font-medium text-[#07f468] hover:text-black group-hover/button:hover:text-black">All
                            Orders</span>
                    </div>

                    <img src="https://i.ibb.co.com/v28S0Zt/arrow-up-right.webp" alt="arrow-up-right"
                        class="w-5 h-5 [filter:brightness(0)_saturate(100%)_invert(75%)_sepia(67%)_saturate(2300%)_hue-rotate(86deg)_brightness(100%)_contrast(98%)] group-[&.disabled]:[filter:brightness(0)] group-hover/button:[filter:brightness(0)_saturate(100%)]" />
                </button>
            </div>

            <!-- flexbox-table-data -->
            <div class="w-full flex justify-center items-center">
                <!-- tab-content-item (Subscriptions) -->
                <div class="flex flex-col justify-center gap-2 w-full h-full pb-8 min-w-0 min-h-0">
                    <div class="flex justify-center items-center p-4 pt-0">
                        <div class="flex justify-center items-center relative w-[10.0625rem] h-[10.0625rem]">
                            <img src="https://i.ibb.co.com/NgTgvMzS/shopping-cart-big.webp" alt="shopping-cart-big"
                                class="w-32 h-32" />
                        </div>
                    </div>

                    <!-- text-container -->
                    <div class="flex flex-col justify-center items-center gap-2 text-center">
                        <p class="text-base text-[#344054] dark:text-[#bdb8af]">
                            You don’t have any orders at the moment
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>