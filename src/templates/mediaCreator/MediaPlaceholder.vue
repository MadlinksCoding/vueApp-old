<template>
     <div class="relative z-[2] bg-[#F9FAFBE5] min-h-screen md:bg-transparent md:h-auto before:content-[''] before:fixed md:before:bg-[url('https://i.ibb.co.com/dw910Z5b/gradient-main-bg.webp')] before:bg-cover before:w-full before:bg-no-repeat before:h-full before:left-0 before:top-0 before:pointer-events-none">
        <div class="flex flex-col backdrop-blur-[50px] md:gap-6 ">
            <!-- title-section -->
            <section class="hidden md:flex justify-between items-center md:gap-6 pt-10 px-4 xl:px-10">
                <h1 class="text-3xl font-medium leading-[2.375rem] text-[#475467]">Media</h1>
            </section>

            <!-- filter-section -->
            <div class="flex flex-col gap-2 p-2 md:px-4 lg:flex-row lg:gap-4 xl:px-10">
                <!-- tab-button-wrapper -->
                <div class="flex items-center gap-4 md:py-2 lg:py-0">
                    <!-- view-type tab-button-container -->
                    <div class="hidden md:flex w-[6.5rem] h-10 rounded-md bg-[#E6E6E6] animate-skeleton-loading"></div>

                    <!-- media-type tab-button-container -->
                    <div class="w-full flex items-start h-10 rounded-md bg-[#E6E6E6] animate-skeleton-loading md:w-[20.125rem]"></div>
                </div>

                <!-- filter-wrapper -->
                <div class="flex justify-between lg:items-center lg:w-full">
                    <!-- input-field -->
                    <div class="py-2 px-3">
                        <!-- input-container -->
                        <div class="flex items-center gap-1.5 relative">
                            <img src="https://i.ibb.co.com/jvc93MC4/search.webp" alt="search" class="w-5 h-5 absolute left-0 top-1/2 -translate-y-1/2 [filter:brightness(0)_saturate(100%)_invert(47%)_sepia(11%)_saturate(772%)_hue-rotate(182deg)_brightness(89%)_contrast(86%)]">
                            <input type="text" placeholder="Search..." class="bg-transparent border-0 pl-7 outline-none text-base text-[#667085] placeholder-[#667085]">
                        </div>
                    </div>

                    <!-- filter-button -->
                    <button class="flex justify-center items-center gap-1 p-2 md:gap-2 md:px-4">
                        <img src="https://i.ibb.co.com/vCnZbZrK/filter-funnel-02.webp" alt="filter" class="w-4 h-4 [filter:brightness(0)_saturate(100%)_invert(74%)_sepia(10%)_saturate(446%)_hue-rotate(179deg)_brightness(86%)_contrast(87%)] md:[filter:brightness(0)_saturate(100%)_invert(18%)_sepia(15%)_saturate(1287%)_hue-rotate(179deg)_brightness(101%)_contrast(82%)] md:w-5 md:h-5">
                        <span class="text-xs leading-normal font-medium text-[#98A2B3] md:text-sm md:leading-semibold md:text-[#344054] ">Filter</span>
                        <div class="hidden w-2 h-2 rounded-full bg-transparent md:flex"></div>
                    </button>
                </div>
            </div>

            <!-- media-table-grid-view-wrapper -->
            <div data-toggle-content-view-wrapper class="flex justify-start items-start px-2 py-0.5 group-[.table-view]:px-0 md:px-4 xl:px-10">
                <!-- thumbnail-wrapper -->
                <div class="flex flex-col w-full group-[.table-view]:w-[11.11125rem] lg:group-[.table-view]:w-[12.5rem] xl:group-[.table-view]:w-[14.22rem]">
                    <!-- table-header -->
                    <div class="hidden items-center gap-2.5 h-[2.625rem] p-2.5  group-[.table-view]:flex">
                        <span class="text-sm text-[#667085] whitespace-nowrap">Media</span>
                    </div>

                    <!-- thumbnail-container -->
                    <div class="grid grid-cols-2 gap-1 group-[.table-view]:w-max group-[.table-view]:grid-cols-1 group-[.table-view]:gap-0 group-[.table-view]:border-t group-[.table-view]:border-[#667085] md:grid-cols-3 md:gap-2 lg:grid-cols-4 xl:gap-4">
                        <!-- media -->
                        <div class="w-full relative aspect-video rounded-md bg-[#E6E6E6] animate-skeleton-loading cursor-pointer group-[.table-view]:w-[11.11125rem] group-[.table-view]:h-[6.25rem] lg:group-[.table-view]:w-[12.5rem] lg:group-[.table-view]:h-[7.03125rem] xl:group-[.table-view]:w-[14.22rem] xl:group-[.table-view]:h-32"></div>

                        <!-- media -->
                        <div class="w-full relative aspect-video rounded-md bg-[#E6E6E6] animate-skeleton-loading cursor-pointer group-[.table-view]:w-[11.11125rem] group-[.table-view]:h-[6.25rem] lg:group-[.table-view]:w-[12.5rem] lg:group-[.table-view]:h-[7.03125rem] xl:group-[.table-view]:w-[14.22rem] xl:group-[.table-view]:h-32"></div>

                        <!-- media -->
                        <div class="w-full relative aspect-video rounded-md bg-[#E6E6E6] animate-skeleton-loading cursor-pointer group-[.table-view]:w-[11.11125rem] group-[.table-view]:h-[6.25rem] lg:group-[.table-view]:w-[12.5rem] lg:group-[.table-view]:h-[7.03125rem] xl:group-[.table-view]:w-[14.22rem] xl:group-[.table-view]:h-32"></div>

                        <!-- media -->
                        <div class="w-full relative aspect-video rounded-md bg-[#E6E6E6] animate-skeleton-loading cursor-pointer group-[.table-view]:w-[11.11125rem] group-[.table-view]:h-[6.25rem] lg:group-[.table-view]:w-[12.5rem] lg:group-[.table-view]:h-[7.03125rem] xl:group-[.table-view]:w-[14.22rem] xl:group-[.table-view]:h-32"></div>

                        <!-- media -->
                        <div class="w-full relative aspect-video rounded-md bg-[#E6E6E6] animate-skeleton-loading cursor-pointer group-[.table-view]:w-[11.11125rem] group-[.table-view]:h-[6.25rem] lg:group-[.table-view]:w-[12.5rem] lg:group-[.table-view]:h-[7.03125rem] xl:group-[.table-view]:w-[14.22rem] xl:group-[.table-view]:h-32"></div>

                        <!-- media -->
                        <div class="w-full relative aspect-video rounded-md bg-[#E6E6E6] animate-skeleton-loading cursor-pointer group-[.table-view]:w-[11.11125rem] group-[.table-view]:h-[6.25rem] lg:group-[.table-view]:w-[12.5rem] lg:group-[.table-view]:h-[7.03125rem] xl:group-[.table-view]:w-[14.22rem] xl:group-[.table-view]:h-32"></div>

                        <!-- media -->
                        <div class="w-full relative aspect-video rounded-md bg-[#E6E6E6] animate-skeleton-loading cursor-pointer group-[.table-view]:w-[11.11125rem] group-[.table-view]:h-[6.25rem] lg:group-[.table-view]:w-[12.5rem] lg:group-[.table-view]:h-[7.03125rem] xl:group-[.table-view]:w-[14.22rem] xl:group-[.table-view]:h-32"></div>

                        <!-- media -->
                        <div class="w-full relative aspect-video rounded-md bg-[#E6E6E6] animate-skeleton-loading cursor-pointer group-[.table-view]:w-[11.11125rem] group-[.table-view]:h-[6.25rem] lg:group-[.table-view]:w-[12.5rem] lg:group-[.table-view]:h-[7.03125rem] xl:group-[.table-view]:w-[14.22rem] xl:group-[.table-view]:h-32"></div>

                        <!-- media -->
                        <div class="w-full relative aspect-video rounded-md bg-[#E6E6E6] animate-skeleton-loading cursor-pointer group-[.table-view]:w-[11.11125rem] group-[.table-view]:h-[6.25rem] lg:group-[.table-view]:w-[12.5rem] lg:group-[.table-view]:h-[7.03125rem] xl:group-[.table-view]:w-[14.22rem] xl:group-[.table-view]:h-32"></div>

                        <!-- media -->
                        <div class="w-full relative aspect-video rounded-md bg-[#E6E6E6] animate-skeleton-loading cursor-pointer group-[.table-view]:w-[11.11125rem] group-[.table-view]:h-[6.25rem] lg:group-[.table-view]:w-[12.5rem] lg:group-[.table-view]:h-[7.03125rem] xl:group-[.table-view]:w-[14.22rem] xl:group-[.table-view]:h-32"></div>

                        <!-- media -->
                        <div class="w-full relative aspect-video rounded-md bg-[#E6E6E6] animate-skeleton-loading cursor-pointer group-[.table-view]:w-[11.11125rem] group-[.table-view]:h-[6.25rem] lg:group-[.table-view]:w-[12.5rem] lg:group-[.table-view]:h-[7.03125rem] xl:group-[.table-view]:w-[14.22rem] xl:group-[.table-view]:h-32"></div>

                        <!-- media -->
                        <div class="w-full relative aspect-video rounded-md bg-[#E6E6E6] animate-skeleton-loading cursor-pointer group-[.table-view]:w-[11.11125rem] group-[.table-view]:h-[6.25rem] lg:group-[.table-view]:w-[12.5rem] lg:group-[.table-view]:h-[7.03125rem] xl:group-[.table-view]:w-[14.22rem] xl:group-[.table-view]:h-32"></div>

                        <!-- media -->
                        <div class="w-full relative aspect-video rounded-md bg-[#E6E6E6] animate-skeleton-loading cursor-pointer group-[.table-view]:w-[11.11125rem] group-[.table-view]:h-[6.25rem] lg:group-[.table-view]:w-[12.5rem] lg:group-[.table-view]:h-[7.03125rem] xl:group-[.table-view]:w-[14.22rem] xl:group-[.table-view]:h-32"></div>
                    </div>
                </div>

                <!-- table-wrapper -->
                <div class="hidden w-max flex-col flex-grow group-[.table-view]:flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-order-style:none] [scrollbar-width:none]">
                    <!-- table-header-container -->
                    <div class="flex w-full">
                        <!-- table-header info -->
                        <div class="flex items-center gap-2.5 h-[2.625rem] p-2.5  min-w-[18.75rem]">

                        </div>
                        <!-- table-header Status -->
                        <div class="flex items-center gap-2.5 h-[2.625rem] p-2.5  min-w-[8.25rem]">
                            <span class="text-sm text-[#667085] whitespace-nowrap">Status</span>
                        </div>
                        <!-- table-header P2V -->
                        <div class="flex items-center gap-2.5 h-[2.625rem] p-2.5  min-w-[7.1875rem] xl:min-w-[7.0625rem]">
                            <span class="text-sm text-[#667085] whitespace-nowrap">P2V</span>
                        </div>
                        <!-- table-header Tiers -->
                        <div class="flex items-center gap-2.5 h-[2.625rem] p-2.5  min-w-[10.75rem]">
                            <span class="text-sm text-[#667085] whitespace-nowrap">Tiers</span>
                        </div>
                        <!-- table-header Appear on -->
                        <div class="flex items-center gap-2.5 h-[2.625rem] p-2.5  min-w-[8.4375rem] xl:min-w-[9.9375rem]">
                            <span class="text-sm text-[#667085] whitespace-nowrap">Appear on</span>
                        </div>
                        <!-- table-header Upload Date -->
                        <div class="flex items-center gap-2.5 h-[2.625rem] p-2.5  min-w-[7.8125rem] xl:min-w-[9.4025rem]">
                            <span class="text-sm text-[#667085] whitespace-nowrap">Upload Date</span>
                        </div>
                        <!-- table-header actions -->
                        <div class="flex items-center gap-2.5 h-[2.625rem] p-2.5  min-w-[6rem] flex-grow">

                        </div>
                    </div>

                    <!-- table-rows-container -->
                    <div class="flex flex-col w-max border-t border-[#667085] xl:w-full [&>*:nth-child(odd)]:bg-[#F2F4F780] ">
                        <!-- row -->
                        <div class="flex w-full">
                            <!-- Media info -->
                            <div class="px-3 py-2 w-[18.75rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32 flex flex-col justify-center gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-full rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-[80%] rounded"></div>
                                <div class="flex gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-14 rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-16 rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-10 rounded"></div>
                                </div>
                            </div>

                            <!-- Status -->
                            <div class="min-w-[8.25rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32 flex items-center justify-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-5 w-20 rounded"></div>
                            </div>

                            <!-- Price -->
                            <div class="min-w-[7.1875rem] h-[6.25rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-14 rounded"></div>
                            </div>

                            <!-- Tiers -->
                            <div class="min-w-[10.75rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:h-32 flex flex-col justify-center gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-full rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-[85%] rounded"></div>
                            </div>

                            <!-- Appear on -->
                            <div class="min-w-[8.4375rem] xl:min-w-[9.9375rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-20 rounded"></div>
                            </div>

                            <!-- Upload date -->
                            <div class="min-w-[7.8125rem] xl:min-w-[9.4025rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-16 rounded"></div>
                            </div>

                            <!-- Actions -->
                            <div class="min-w-[6rem] flex-grow px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex gap-3 items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-6 w-6 rounded-full"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-6 w-6 rounded-full"></div>
                            </div>
                        </div>

                        <!-- row -->
                        <div class="flex w-full">
                            <!-- Media info -->
                            <div class="px-3 py-2 w-[18.75rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32 flex flex-col justify-center gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-full rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-[80%] rounded"></div>
                                <div class="flex gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-14 rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-16 rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-10 rounded"></div>
                                </div>
                            </div>

                            <!-- Status -->
                            <div class="min-w-[8.25rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32 flex items-center justify-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-5 w-20 rounded"></div>
                            </div>

                            <!-- Price -->
                            <div class="min-w-[7.1875rem] h-[6.25rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-14 rounded"></div>
                            </div>

                            <!-- Tiers -->
                            <div class="min-w-[10.75rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:h-32 flex flex-col justify-center gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-full rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-[85%] rounded"></div>
                            </div>

                            <!-- Appear on -->
                            <div class="min-w-[8.4375rem] xl:min-w-[9.9375rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-20 rounded"></div>
                            </div>

                            <!-- Upload date -->
                            <div class="min-w-[7.8125rem] xl:min-w-[9.4025rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-16 rounded"></div>
                            </div>

                            <!-- Actions -->
                            <div class="min-w-[6rem] flex-grow px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex gap-3 items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-6 w-6 rounded-full"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-6 w-6 rounded-full"></div>
                            </div>
                        </div>

                        <!-- row -->
                        <div class="flex w-full">
                            <!-- Media info -->
                            <div class="px-3 py-2 w-[18.75rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32 flex flex-col justify-center gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-full rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-[80%] rounded"></div>
                                <div class="flex gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-14 rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-16 rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-10 rounded"></div>
                                </div>
                            </div>

                            <!-- Status -->
                            <div class="min-w-[8.25rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32 flex items-center justify-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-5 w-20 rounded"></div>
                            </div>

                            <!-- Price -->
                            <div class="min-w-[7.1875rem] h-[6.25rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-14 rounded"></div>
                            </div>

                            <!-- Tiers -->
                            <div class="min-w-[10.75rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:h-32 flex flex-col justify-center gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-full rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-[85%] rounded"></div>
                            </div>

                            <!-- Appear on -->
                            <div class="min-w-[8.4375rem] xl:min-w-[9.9375rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-20 rounded"></div>
                            </div>

                            <!-- Upload date -->
                            <div class="min-w-[7.8125rem] xl:min-w-[9.4025rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-16 rounded"></div>
                            </div>

                            <!-- Actions -->
                            <div class="min-w-[6rem] flex-grow px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex gap-3 items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-6 w-6 rounded-full"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-6 w-6 rounded-full"></div>
                            </div>
                        </div>

                        <!-- row -->
                        <div class="flex w-full">
                            <!-- Media info -->
                            <div class="px-3 py-2 w-[18.75rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32 flex flex-col justify-center gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-full rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-[80%] rounded"></div>
                                <div class="flex gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-14 rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-16 rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-10 rounded"></div>
                                </div>
                            </div>

                            <!-- Status -->
                            <div class="min-w-[8.25rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32 flex items-center justify-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-5 w-20 rounded"></div>
                            </div>

                            <!-- Price -->
                            <div class="min-w-[7.1875rem] h-[6.25rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-14 rounded"></div>
                            </div>

                            <!-- Tiers -->
                            <div class="min-w-[10.75rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:h-32 flex flex-col justify-center gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-full rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-[85%] rounded"></div>
                            </div>

                            <!-- Appear on -->
                            <div class="min-w-[8.4375rem] xl:min-w-[9.9375rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-20 rounded"></div>
                            </div>

                            <!-- Upload date -->
                            <div class="min-w-[7.8125rem] xl:min-w-[9.4025rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-16 rounded"></div>
                            </div>

                            <!-- Actions -->
                            <div class="min-w-[6rem] flex-grow px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex gap-3 items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-6 w-6 rounded-full"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-6 w-6 rounded-full"></div>
                            </div>
                        </div>

                        <!-- row -->
                        <div class="flex w-full">
                            <!-- Media info -->
                            <div class="px-3 py-2 w-[18.75rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32 flex flex-col justify-center gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-full rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-[80%] rounded"></div>
                                <div class="flex gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-14 rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-16 rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-10 rounded"></div>
                                </div>
                            </div>

                            <!-- Status -->
                            <div class="min-w-[8.25rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32 flex items-center justify-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-5 w-20 rounded"></div>
                            </div>

                            <!-- Price -->
                            <div class="min-w-[7.1875rem] h-[6.25rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-14 rounded"></div>
                            </div>

                            <!-- Tiers -->
                            <div class="min-w-[10.75rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:h-32 flex flex-col justify-center gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-full rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-[85%] rounded"></div>
                            </div>

                            <!-- Appear on -->
                            <div class="min-w-[8.4375rem] xl:min-w-[9.9375rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-20 rounded"></div>
                            </div>

                            <!-- Upload date -->
                            <div class="min-w-[7.8125rem] xl:min-w-[9.4025rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-16 rounded"></div>
                            </div>

                            <!-- Actions -->
                            <div class="min-w-[6rem] flex-grow px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex gap-3 items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-6 w-6 rounded-full"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-6 w-6 rounded-full"></div>
                            </div>
                        </div>

                        <!-- row -->
                        <div class="flex w-full">
                            <!-- Media info -->
                            <div class="px-3 py-2 w-[18.75rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32 flex flex-col justify-center gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-full rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-[80%] rounded"></div>
                                <div class="flex gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-14 rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-16 rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-10 rounded"></div>
                                </div>
                            </div>

                            <!-- Status -->
                            <div class="min-w-[8.25rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32 flex items-center justify-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-5 w-20 rounded"></div>
                            </div>

                            <!-- Price -->
                            <div class="min-w-[7.1875rem] h-[6.25rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-14 rounded"></div>
                            </div>

                            <!-- Tiers -->
                            <div class="min-w-[10.75rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:h-32 flex flex-col justify-center gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-full rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-[85%] rounded"></div>
                            </div>

                            <!-- Appear on -->
                            <div class="min-w-[8.4375rem] xl:min-w-[9.9375rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-20 rounded"></div>
                            </div>

                            <!-- Upload date -->
                            <div class="min-w-[7.8125rem] xl:min-w-[9.4025rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-16 rounded"></div>
                            </div>

                            <!-- Actions -->
                            <div class="min-w-[6rem] flex-grow px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex gap-3 items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-6 w-6 rounded-full"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-6 w-6 rounded-full"></div>
                            </div>
                        </div>

                        <!-- row -->
                        <div class="flex w-full">
                            <!-- Media info -->
                            <div class="px-3 py-2 w-[18.75rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32 flex flex-col justify-center gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-full rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-[80%] rounded"></div>
                                <div class="flex gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-14 rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-16 rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-10 rounded"></div>
                                </div>
                            </div>

                            <!-- Status -->
                            <div class="min-w-[8.25rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32 flex items-center justify-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-5 w-20 rounded"></div>
                            </div>

                            <!-- Price -->
                            <div class="min-w-[7.1875rem] h-[6.25rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-14 rounded"></div>
                            </div>

                            <!-- Tiers -->
                            <div class="min-w-[10.75rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:h-32 flex flex-col justify-center gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-full rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-[85%] rounded"></div>
                            </div>

                            <!-- Appear on -->
                            <div class="min-w-[8.4375rem] xl:min-w-[9.9375rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-20 rounded"></div>
                            </div>

                            <!-- Upload date -->
                            <div class="min-w-[7.8125rem] xl:min-w-[9.4025rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-16 rounded"></div>
                            </div>

                            <!-- Actions -->
                            <div class="min-w-[6rem] flex-grow px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex gap-3 items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-6 w-6 rounded-full"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-6 w-6 rounded-full"></div>
                            </div>
                        </div>

                        <!-- row -->
                        <div class="flex w-full">
                            <!-- Media info -->
                            <div class="px-3 py-2 w-[18.75rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32 flex flex-col justify-center gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-full rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-[80%] rounded"></div>
                                <div class="flex gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-14 rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-16 rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-10 rounded"></div>
                                </div>
                            </div>

                            <!-- Status -->
                            <div class="min-w-[8.25rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32 flex items-center justify-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-5 w-20 rounded"></div>
                            </div>

                            <!-- Price -->
                            <div class="min-w-[7.1875rem] h-[6.25rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-14 rounded"></div>
                            </div>

                            <!-- Tiers -->
                            <div class="min-w-[10.75rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:h-32 flex flex-col justify-center gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-full rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-[85%] rounded"></div>
                            </div>

                            <!-- Appear on -->
                            <div class="min-w-[8.4375rem] xl:min-w-[9.9375rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-20 rounded"></div>
                            </div>

                            <!-- Upload date -->
                            <div class="min-w-[7.8125rem] xl:min-w-[9.4025rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-16 rounded"></div>
                            </div>

                            <!-- Actions -->
                            <div class="min-w-[6rem] flex-grow px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex gap-3 items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-6 w-6 rounded-full"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-6 w-6 rounded-full"></div>
                            </div>
                        </div>

                        <!-- row -->
                        <div class="flex w-full">
                            <!-- Media info -->
                            <div class="px-3 py-2 w-[18.75rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32 flex flex-col justify-center gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-full rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-[80%] rounded"></div>
                                <div class="flex gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-14 rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-16 rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-10 rounded"></div>
                                </div>
                            </div>

                            <!-- Status -->
                            <div class="min-w-[8.25rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32 flex items-center justify-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-5 w-20 rounded"></div>
                            </div>

                            <!-- Price -->
                            <div class="min-w-[7.1875rem] h-[6.25rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-14 rounded"></div>
                            </div>

                            <!-- Tiers -->
                            <div class="min-w-[10.75rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:h-32 flex flex-col justify-center gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-full rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-[85%] rounded"></div>
                            </div>

                            <!-- Appear on -->
                            <div class="min-w-[8.4375rem] xl:min-w-[9.9375rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-20 rounded"></div>
                            </div>

                            <!-- Upload date -->
                            <div class="min-w-[7.8125rem] xl:min-w-[9.4025rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-16 rounded"></div>
                            </div>

                            <!-- Actions -->
                            <div class="min-w-[6rem] flex-grow px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex gap-3 items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-6 w-6 rounded-full"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-6 w-6 rounded-full"></div>
                            </div>
                        </div>

                        <!-- row -->
                        <div class="flex w-full">
                            <!-- Media info -->
                            <div class="px-3 py-2 w-[18.75rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32 flex flex-col justify-center gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-full rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-[80%] rounded"></div>
                                <div class="flex gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-14 rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-16 rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-10 rounded"></div>
                                </div>
                            </div>

                            <!-- Status -->
                            <div class="min-w-[8.25rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32 flex items-center justify-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-5 w-20 rounded"></div>
                            </div>

                            <!-- Price -->
                            <div class="min-w-[7.1875rem] h-[6.25rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-14 rounded"></div>
                            </div>

                            <!-- Tiers -->
                            <div class="min-w-[10.75rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:h-32 flex flex-col justify-center gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-full rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-[85%] rounded"></div>
                            </div>

                            <!-- Appear on -->
                            <div class="min-w-[8.4375rem] xl:min-w-[9.9375rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-20 rounded"></div>
                            </div>

                            <!-- Upload date -->
                            <div class="min-w-[7.8125rem] xl:min-w-[9.4025rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-16 rounded"></div>
                            </div>

                            <!-- Actions -->
                            <div class="min-w-[6rem] flex-grow px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex gap-3 items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-6 w-6 rounded-full"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-6 w-6 rounded-full"></div>
                            </div>
                        </div>

                        <!-- row -->
                        <div class="flex w-full">
                            <!-- Media info -->
                            <div class="px-3 py-2 w-[18.75rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32 flex flex-col justify-center gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-full rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-[80%] rounded"></div>
                                <div class="flex gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-14 rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-16 rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-10 rounded"></div>
                                </div>
                            </div>

                            <!-- Status -->
                            <div class="min-w-[8.25rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32 flex items-center justify-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-5 w-20 rounded"></div>
                            </div>

                            <!-- Price -->
                            <div class="min-w-[7.1875rem] h-[6.25rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-14 rounded"></div>
                            </div>

                            <!-- Tiers -->
                            <div class="min-w-[10.75rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:h-32 flex flex-col justify-center gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-full rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-[85%] rounded"></div>
                            </div>

                            <!-- Appear on -->
                            <div class="min-w-[8.4375rem] xl:min-w-[9.9375rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-20 rounded"></div>
                            </div>

                            <!-- Upload date -->
                            <div class="min-w-[7.8125rem] xl:min-w-[9.4025rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-16 rounded"></div>
                            </div>

                            <!-- Actions -->
                            <div class="min-w-[6rem] flex-grow px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex gap-3 items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-6 w-6 rounded-full"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-6 w-6 rounded-full"></div>
                            </div>
                        </div>

                        <!-- row -->
                        <div class="flex w-full">
                            <!-- Media info -->
                            <div class="px-3 py-2 w-[18.75rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32 flex flex-col justify-center gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-full rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-[80%] rounded"></div>
                                <div class="flex gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-14 rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-16 rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-10 rounded"></div>
                                </div>
                            </div>

                            <!-- Status -->
                            <div class="min-w-[8.25rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32 flex items-center justify-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-5 w-20 rounded"></div>
                            </div>

                            <!-- Price -->
                            <div class="min-w-[7.1875rem] h-[6.25rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-14 rounded"></div>
                            </div>

                            <!-- Tiers -->
                            <div class="min-w-[10.75rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:h-32 flex flex-col justify-center gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-full rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-[85%] rounded"></div>
                            </div>

                            <!-- Appear on -->
                            <div class="min-w-[8.4375rem] xl:min-w-[9.9375rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-20 rounded"></div>
                            </div>

                            <!-- Upload date -->
                            <div class="min-w-[7.8125rem] xl:min-w-[9.4025rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-16 rounded"></div>
                            </div>

                            <!-- Actions -->
                            <div class="min-w-[6rem] flex-grow px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex gap-3 items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-6 w-6 rounded-full"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-6 w-6 rounded-full"></div>
                            </div>
                        </div>

                        <!-- row -->
                        <div class="flex w-full">
                            <!-- Media info -->
                            <div class="px-3 py-2 w-[18.75rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32 flex flex-col justify-center gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-full rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-[80%] rounded"></div>
                                <div class="flex gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-14 rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-16 rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-10 rounded"></div>
                                </div>
                            </div>

                            <!-- Status -->
                            <div class="min-w-[8.25rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32 flex items-center justify-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-5 w-20 rounded"></div>
                            </div>

                            <!-- Price -->
                            <div class="min-w-[7.1875rem] h-[6.25rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-4 w-14 rounded"></div>
                            </div>

                            <!-- Tiers -->
                            <div class="min-w-[10.75rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:h-32 flex flex-col justify-center gap-2">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-full rounded"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-[85%] rounded"></div>
                            </div>

                            <!-- Appear on -->
                            <div class="min-w-[8.4375rem] xl:min-w-[9.9375rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-20 rounded"></div>
                            </div>

                            <!-- Upload date -->
                            <div class="min-w-[7.8125rem] xl:min-w-[9.4025rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-3 w-16 rounded"></div>
                            </div>

                            <!-- Actions -->
                            <div class="min-w-[6rem] flex-grow px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32 flex gap-3 items-center">
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-6 w-6 rounded-full"></div>
                                <div class="bg-[#E6E6E6] animate-skeleton-loading h-6 w-6 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>