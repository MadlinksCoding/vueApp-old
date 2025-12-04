<template>
    <div
        class="relative z-[2] bg-[#F9FAFBE5] min-h-screen md:bg-transparent md:h-auto before:content-[''] before:fixed md:before:bg-[url('https://i.ibb.co.com/dw910Z5b/gradient-main-bg.webp')] before:bg-cover before:w-full before:bg-no-repeat before:h-full before:left-0 before:top-0 before:pointer-events-none">
        <div class="flex flex-col backdrop-blur-[50px] md:gap-6 ">
            <!-- title-section -->
            <section class="hidden md:flex justify-between items-center md:gap-6 pt-10 px-4 xl:px-10">
                <h1 class="text-3xl font-medium leading-[2.375rem] text-[#475467]">Media</h1>

                <ButtonComponent text="UPLOAD MEDIA" variant="mediaBtn"
                    :leftIcon="'https://i.ibb.co.com/RpWmJkcb/plus.webp'" :leftIconClass="`
                    w-6 h-6 group-hover:[filter:brightness(0)]
                    `" />
            </section>

            <!-- filter-section -->
            <div class="flex flex-col gap-2 p-2 md:px-4 lg:flex-row lg:gap-4 xl:px-10">
                <!-- tab-button-wrapper -->
                <div class="flex items-center gap-4 md:py-2 lg:py-0">
                    <!-- view-type tab-button-container -->
                    <div
                        class="hidden md:flex bg-[#F9FAFB80] border border-[#D0D5DD] rounded-[0.3125rem] overflow-hidden">

                        <button @click="viewMode = 'grid'" :class="{ 'active': viewMode === 'grid' }"
                            class="flex justify-center items-center h-10 py-2 px-4 border-r border-[#D0D5DD] outline-none flex-1 group [&.active]:bg-[#0C111D]">
                            <img src="https://i.ibb.co.com/JwqPYGvG/grid-view.webp" alt="grid-view"
                                class="w-5 h-5 min-w-[1.25rem] [filter:brightness(0)_saturate(100%)_invert(90%)_sepia(11%)_saturate(143%)_hue-rotate(178deg)_brightness(97%)_contrast(86%)] group-[.active]:[filter:brightness(100)_saturate(0)]" />
                        </button>

                        <button @click="viewMode = 'table'" :class="{ 'active': viewMode === 'table' }"
                            class="flex justify-center items-center h-10 py-2 px-4 outline-none flex-1 group [&.active]:bg-[#0C111D]">
                            <img src="https://i.ibb.co.com/DgGnGJTw/table-view.webp" alt="table-view"
                                class="w-5 h-5 min-w-[1.25rem] [filter:brightness(0)_saturate(100%)_invert(90%)_sepia(11%)_saturate(143%)_hue-rotate(178deg)_brightness(97%)_contrast(86%)] group-[.active]:[filter:brightness(100)_saturate(0)]" />
                        </button>
                    </div>

                    <!-- media-type tab-button-container -->
                    <MyMediaTabs v-model="currentTab" :tabs="tabList" />
                </div>

                <!-- filter-wrapper -->
                <div class="flex justify-between lg:items-center lg:w-full">
                    <!-- input-field -->
                    <div class="py-2 px-3">
                        <!-- input-container -->
                        <div class="flex items-center gap-1.5 relative">
                            <img src="https://i.ibb.co.com/jvc93MC4/search.webp" alt="search"
                                class="w-5 h-5 absolute left-0 top-1/2 -translate-y-1/2 [filter:brightness(0)_saturate(100%)_invert(47%)_sepia(11%)_saturate(772%)_hue-rotate(182deg)_brightness(89%)_contrast(86%)]">
                            <input type="text" placeholder="Search..."
                                class="bg-transparent border-0 pl-7 outline-none text-base text-[#667085] placeholder-[#667085]">
                        </div>
                    </div>

                    <!-- filter-button -->
                    <button class="flex justify-center items-center gap-1 p-2 md:gap-2 md:px-4">
                        <img src="https://i.ibb.co.com/vCnZbZrK/filter-funnel-02.webp" alt="filter"
                            class="w-4 h-4 [filter:brightness(0)_saturate(100%)_invert(74%)_sepia(10%)_saturate(446%)_hue-rotate(179deg)_brightness(86%)_contrast(87%)] md:[filter:brightness(0)_saturate(100%)_invert(18%)_sepia(15%)_saturate(1287%)_hue-rotate(179deg)_brightness(101%)_contrast(82%)] md:w-5 md:h-5">
                        <span
                            class="text-xs leading-normal font-medium text-[#98A2B3] md:text-sm md:leading-semibold md:text-[#344054]">Filter</span>
                        <div class="hidden w-2 h-2 rounded-full bg-[#FF0066] md:flex"></div>
                    </button>
                </div>
            </div>

            <!-- media-table-grid-view-wrapper -->
            <div v-if="currentTab === 'all'">
                <div :class="{ 'table-view': viewMode === 'table' }"
                    class="flex justify-start items-start px-2 py-0.5 group [&.table-view]:px-0 md:px-4 xl:px-10">
                    <!-- thumbnail-wrapper -->
                    <div
                        class="flex flex-col w-full group-[.table-view]:w-[11.11125rem] lg:group-[.table-view]:w-[12.5rem] xl:group-[.table-view]:w-[14.22rem]">
                        <!-- table-header -->
                        <div class="hidden items-center gap-2.5 h-[2.625rem] p-2.5  group-[.table-view]:flex">
                            <span class="text-sm text-[#667085] whitespace-nowrap">Media</span>
                        </div>

                        <!-- thumbnail-container -->
                        <div
                            class="grid grid-cols-2 gap-1 group-[.table-view]:w-max group-[.table-view]:grid-cols-1 group-[.table-view]:gap-0 md:grid-cols-3 md:gap-2 lg:grid-cols-4 xl:gap-4">
                            <div v-for="i in 5" :key="i">
                                <MyMediaCard />
                            </div>
                        </div>

                    </div>

                    <!-- table-wrapper -->
                    <div
                        class="hidden w-max flex-col flex-grow group-[.table-view]:flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-order-style:none] [scrollbar-width:none]">
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
                            <div
                                class="flex items-center gap-2.5 h-[2.625rem] p-2.5  min-w-[7.1875rem] xl:min-w-[7.0625rem]">
                                <span class="text-sm text-[#667085] whitespace-nowrap">P2V</span>
                            </div>
                            <!-- table-header Tiers -->
                            <div class="flex items-center gap-2.5 h-[2.625rem] p-2.5  min-w-[10.75rem]">
                                <span class="text-sm text-[#667085] whitespace-nowrap">Tiers</span>
                            </div>
                            <!-- table-header Appear on -->
                            <div
                                class="flex items-center gap-2.5 h-[2.625rem] p-2.5  min-w-[8.4375rem] xl:min-w-[9.9375rem]">
                                <span class="text-sm text-[#667085] whitespace-nowrap">Appear on</span>
                            </div>
                            <!-- table-header Upload Date -->
                            <div
                                class="flex items-center gap-2.5 h-[2.625rem] p-2.5  min-w-[7.8125rem] xl:min-w-[9.4025rem]">
                                <span class="text-sm text-[#667085] whitespace-nowrap">Upload Date</span>
                            </div>
                            <!-- table-header actions -->
                            <div class="flex items-center gap-2.5 h-[2.625rem] p-2.5  min-w-[6rem] flex-grow">

                            </div>
                        </div>

                        <!-- table-rows-container -->
                        <div
                            class="flex flex-col w-max border-t border-[#667085] xl:w-full [&>*:nth-child(odd)]:bg-[#F2F4F780]">
                            <!-- row -->
                            <div class="flex w-full">
                                <!-- info -->
                                <div
                                    class="flex justify-center items-center px-3 py-2 w-[18.75rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32">
                                    <div class="w-full flex flex-col gap-0.5">
                                        <h3 class="text-xs leading-normal font-semibold line-clamp-3 text-[#0C111D]">
                                            Record
                                            breaking fried chicken eating ! See my attempt to break world’s record!
                                            Watch
                                            now!</h3>

                                        <div class="flex items-center gap-2">
                                            <!-- label -->
                                            <div class="flex justify-center items-center px-1.5 py-1 bg-white">
                                                <span
                                                    class="text-xs leading-normal font-medium text-[#344054]">Chicken</span>
                                            </div>

                                            <!-- label -->
                                            <div class="flex justify-center items-center px-1.5 py-1 bg-white">
                                                <span
                                                    class="text-xs leading-normal font-medium text-[#344054]">Eating</span>
                                            </div>

                                            <!-- label -->
                                            <div class="flex justify-center items-center px-1.5 py-1 bg-white">
                                                <span
                                                    class="text-xs leading-normal font-medium text-[#344054]">Drinking</span>
                                            </div>

                                            <!-- label -->
                                            <div class="flex justify-center items-center px-1.5 py-1 bg-white">
                                                <span
                                                    class="text-xs leading-normal font-medium text-[#344054]">Drinking</span>
                                            </div>

                                            <span class="text-xs leading-normal font-medium text-[#344054]">+3</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Status -->
                                <div
                                    class="flex justify-center items-center min-w-[8.25rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32">
                                    <div class="p-1">
                                        <!-- published-tag-section -->
                                        <div class="flex">
                                            <span
                                                class="flex justify-center items-center p-1 gap-2 backdrop-blur-[10px] bg-[#07f468]">
                                                <img src="https://i.ibb.co.com/bMFQRqBP/upload.webp" alt="upload"
                                                    class="w-4 h-4" />
                                            </span>
                                            <span
                                                class="text-[#07f468] text-xs font-medium leading-[1.125rem] flex justify-center items-center gap-2 px-[.375rem] py-[0.188rem] bg-black">Published</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- P2V -->
                                <div
                                    class="flex items-center min-w-[7.1875rem] h-[6.25rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32">
                                    <span class="text-xs leading-normal font-semibold truncate text-[#0C111D]">USD$
                                        24.99</span>
                                </div>

                                <!-- Tiers -->
                                <div
                                    class="flex items-center min-w-[10.75rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:min-w-[7.0625rem] xl:h-32">
                                    <ul class="flex flex-col gap-0.5 overflow-hidden">
                                        <li
                                            class="pl-5 text-xs leading-normal font-semibold truncate max-w-[9.25rem] xl:max-w-[unset] text-[#0C111D] relative before:content-[''] before:absolute before:w-1 before:h-1 before:bg-[#0C111D] before:rounded-full before:left-2 before:top-1/2 before:-translate-y-1/2">
                                            Featured library of something great</li>
                                        <li
                                            class="pl-5 text-xs leading-normal font-semibold truncate max-w-[9.25rem] xl:max-w-[unset] text-[#0C111D] relative before:content-[''] before:absolute before:w-1 before:h-1 before:bg-[#0C111D] before:rounded-full before:left-2 before:top-1/2 before:-translate-y-1/2">
                                            Full library of extremely great things</li>
                                        <li
                                            class="pl-5 text-xs leading-normal font-semibold truncate max-w-[9.25rem] xl:max-w-[unset] text-[#0C111D] relative before:content-[''] before:absolute before:w-1 before:h-1 before:bg-[#0C111D] before:rounded-full before:left-2 before:top-1/2 before:-translate-y-1/2">
                                            Featured library of something great</li>
                                        <li
                                            class="pl-5 text-xs leading-normal font-semibold truncate max-w-[9.25rem] xl:max-w-[unset] text-[#0C111D] relative before:content-[''] before:absolute before:w-1 before:h-1 before:bg-[#0C111D] before:rounded-full before:left-2 before:top-1/2 before:-translate-y-1/2">
                                            Full library of extremely great things</li>
                                    </ul>
                                </div>

                                <!-- Appear on -->
                                <div
                                    class="flex items-center min-w-[8.4375rem] xl:min-w-[9.9375rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32">
                                    <ul class="flex flex-col gap-0.5 overflow-hidden">
                                        <li
                                            class="pl-5 text-xs leading-normal font-semibold truncate max-w-[6.9375rem] xl:max-w-[unset] text-[#0C111D] relative before:content-[''] before:absolute before:w-1 before:h-1 before:bg-[#0C111D] before:rounded-full before:left-2 before:top-1/2 before:-translate-y-1/2">
                                            Profile page</li>
                                    </ul>
                                </div>

                                <!-- Upload date -->
                                <div
                                    class="flex items-center min-w-[7.8125rem] xl:min-w-[9.4025rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32">
                                    <span class="text-[0.77875rem] leading-[1.125rem] text-[#475467]">22 Jan 2022</span>
                                </div>

                                <!-- Action -->
                                <div
                                    class="flex items-center min-w-[6rem] flex-grow px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32">
                                    <div class="flex justify-center items-center px-3 py-2">
                                        <div class="w-6 h-6 flex justify-center items-center cursor-pointer">
                                            <img src="https://i.ibb.co.com/BV4pbgNr/pencil-01.webp" alt="edit"
                                                class="w-4 h-4">
                                        </div>
                                    </div>

                                    <div class="flex justify-center items-center px-3 py-2">
                                        <div class="w-6 h-6 flex justify-center items-center cursor-pointer">
                                            <img src="https://i.ibb.co.com/Q7jRP6S5/dots-vertical.webp" alt="settings"
                                                class="w-4 h-4">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- row -->
                            <div class="flex w-full">
                                <!-- info -->
                                <div
                                    class="flex justify-center items-center px-3 py-2 w-[18.75rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32">
                                    <div class="w-full flex flex-col gap-0.5">
                                        <h3 class="text-xs leading-normal font-semibold line-clamp-3 text-[#0C111D]">
                                            Record
                                            breaking fried chicken eating ! See my attempt to break world’s record!
                                            Watch
                                            now!</h3>

                                        <div class="flex items-center gap-2">
                                            <!-- label -->
                                            <div class="flex justify-center items-center px-1.5 py-1 bg-white">
                                                <span
                                                    class="text-xs leading-normal font-medium text-[#344054]">Chicken</span>
                                            </div>

                                            <!-- label -->
                                            <div class="flex justify-center items-center px-1.5 py-1 bg-white">
                                                <span
                                                    class="text-xs leading-normal font-medium text-[#344054]">Eating</span>
                                            </div>

                                            <!-- label -->
                                            <div class="flex justify-center items-center px-1.5 py-1 bg-white">
                                                <span
                                                    class="text-xs leading-normal font-medium text-[#344054]">Drinking</span>
                                            </div>

                                            <!-- label -->
                                            <div class="flex justify-center items-center px-1.5 py-1 bg-white">
                                                <span
                                                    class="text-xs leading-normal font-medium text-[#344054]">Drinking</span>
                                            </div>

                                            <span class="text-xs leading-normal font-medium text-[#344054]">+3</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Status -->
                                <div
                                    class="flex justify-center items-center min-w-[8.25rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32">
                                    <div class="p-1">
                                        <!-- published-tag-section -->
                                        <div class="flex">
                                            <span
                                                class="flex justify-center items-center p-1 gap-2 backdrop-blur-[10px] bg-[#07f468]">
                                                <img src="https://i.ibb.co.com/bMFQRqBP/upload.webp" alt="upload"
                                                    class="w-4 h-4" />
                                            </span>
                                            <span
                                                class="text-[#07f468] text-xs font-medium leading-[1.125rem] flex justify-center items-center gap-2 px-[.375rem] py-[0.188rem] bg-black">Published</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- P2V -->
                                <div
                                    class="flex items-center min-w-[7.1875rem] h-[6.25rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32">
                                    <span class="text-xs leading-normal font-semibold truncate text-[#0C111D]">USD$
                                        24.99</span>
                                </div>

                                <!-- Tiers -->
                                <div
                                    class="flex items-center min-w-[10.75rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:min-w-[7.0625rem] xl:h-32">
                                    <ul class="flex flex-col gap-0.5 overflow-hidden">
                                        <li
                                            class="pl-5 text-xs leading-normal font-semibold truncate max-w-[9.25rem] xl:max-w-[unset] text-[#0C111D] relative before:content-[''] before:absolute before:w-1 before:h-1 before:bg-[#0C111D] before:rounded-full before:left-2 before:top-1/2 before:-translate-y-1/2">
                                            Featured library of something great</li>
                                        <li
                                            class="pl-5 text-xs leading-normal font-semibold truncate max-w-[9.25rem] xl:max-w-[unset] text-[#0C111D] relative before:content-[''] before:absolute before:w-1 before:h-1 before:bg-[#0C111D] before:rounded-full before:left-2 before:top-1/2 before:-translate-y-1/2">
                                            Full library of extremely great things</li>
                                        <li
                                            class="pl-5 text-xs leading-normal font-semibold truncate max-w-[9.25rem] xl:max-w-[unset] text-[#0C111D] relative before:content-[''] before:absolute before:w-1 before:h-1 before:bg-[#0C111D] before:rounded-full before:left-2 before:top-1/2 before:-translate-y-1/2">
                                            Featured library of something great</li>
                                        <li
                                            class="pl-5 text-xs leading-normal font-semibold truncate max-w-[9.25rem] xl:max-w-[unset] text-[#0C111D] relative before:content-[''] before:absolute before:w-1 before:h-1 before:bg-[#0C111D] before:rounded-full before:left-2 before:top-1/2 before:-translate-y-1/2">
                                            Full library of extremely great things</li>
                                    </ul>
                                </div>

                                <!-- Appear on -->
                                <div
                                    class="flex items-center min-w-[8.4375rem] xl:min-w-[9.9375rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32">
                                    <ul class="flex flex-col gap-0.5 overflow-hidden">
                                        <li
                                            class="pl-5 text-xs leading-normal font-semibold truncate max-w-[6.9375rem] xl:max-w-[unset] text-[#0C111D] relative before:content-[''] before:absolute before:w-1 before:h-1 before:bg-[#0C111D] before:rounded-full before:left-2 before:top-1/2 before:-translate-y-1/2">
                                            Profile page</li>
                                    </ul>
                                </div>

                                <!-- Upload date -->
                                <div
                                    class="flex items-center min-w-[7.8125rem] xl:min-w-[9.4025rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32">
                                    <span class="text-[0.77875rem] leading-[1.125rem] text-[#475467]">22 Jan 2022</span>
                                </div>

                                <!-- Action -->
                                <div
                                    class="flex items-center min-w-[6rem] flex-grow px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32">
                                    <div class="flex justify-center items-center px-3 py-2">
                                        <div class="w-6 h-6 flex justify-center items-center cursor-pointer">
                                            <img src="https://i.ibb.co.com/BV4pbgNr/pencil-01.webp" alt="edit"
                                                class="w-4 h-4">
                                        </div>
                                    </div>

                                    <div class="flex justify-center items-center px-3 py-2">
                                        <div class="w-6 h-6 flex justify-center items-center cursor-pointer">
                                            <img src="https://i.ibb.co.com/Q7jRP6S5/dots-vertical.webp" alt="settings"
                                                class="w-4 h-4">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- row -->
                            <div class="flex w-full">
                                <!-- info -->
                                <div
                                    class="flex justify-center items-center px-3 py-2 w-[18.75rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32">
                                    <div class="w-full flex flex-col gap-0.5">
                                        <h3 class="text-xs leading-normal font-semibold line-clamp-3 text-[#0C111D]">
                                            Record
                                            breaking fried chicken eating ! See my attempt to break world’s record!
                                            Watch
                                            now!</h3>

                                        <div class="flex items-center gap-2">
                                            <!-- label -->
                                            <div class="flex justify-center items-center px-1.5 py-1 bg-white">
                                                <span
                                                    class="text-xs leading-normal font-medium text-[#344054]">Chicken</span>
                                            </div>

                                            <!-- label -->
                                            <div class="flex justify-center items-center px-1.5 py-1 bg-white">
                                                <span
                                                    class="text-xs leading-normal font-medium text-[#344054]">Eating</span>
                                            </div>

                                            <!-- label -->
                                            <div class="flex justify-center items-center px-1.5 py-1 bg-white">
                                                <span
                                                    class="text-xs leading-normal font-medium text-[#344054]">Drinking</span>
                                            </div>

                                            <!-- label -->
                                            <div class="flex justify-center items-center px-1.5 py-1 bg-white">
                                                <span
                                                    class="text-xs leading-normal font-medium text-[#344054]">Drinking</span>
                                            </div>

                                            <span class="text-xs leading-normal font-medium text-[#344054]">+3</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Status -->
                                <div
                                    class="flex justify-center items-center min-w-[8.25rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32">
                                    <div class="p-1">
                                        <!-- published-tag-section -->
                                        <div class="flex">
                                            <span
                                                class="flex justify-center items-center p-1 gap-2 backdrop-blur-[10px] bg-[#07f468]">
                                                <img src="https://i.ibb.co.com/bMFQRqBP/upload.webp" alt="upload"
                                                    class="w-4 h-4" />
                                            </span>
                                            <span
                                                class="text-[#07f468] text-xs font-medium leading-[1.125rem] flex justify-center items-center gap-2 px-[.375rem] py-[0.188rem] bg-black">Published</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- P2V -->
                                <div
                                    class="flex items-center min-w-[7.1875rem] h-[6.25rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32">
                                    <span class="text-xs leading-normal font-semibold truncate text-[#0C111D]">USD$
                                        24.99</span>
                                </div>

                                <!-- Tiers -->
                                <div
                                    class="flex items-center min-w-[10.75rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:min-w-[7.0625rem] xl:h-32">
                                    <ul class="flex flex-col gap-0.5 overflow-hidden">
                                        <li
                                            class="pl-5 text-xs leading-normal font-semibold truncate max-w-[9.25rem] xl:max-w-[unset] text-[#0C111D] relative before:content-[''] before:absolute before:w-1 before:h-1 before:bg-[#0C111D] before:rounded-full before:left-2 before:top-1/2 before:-translate-y-1/2">
                                            Featured library of something great</li>
                                        <li
                                            class="pl-5 text-xs leading-normal font-semibold truncate max-w-[9.25rem] xl:max-w-[unset] text-[#0C111D] relative before:content-[''] before:absolute before:w-1 before:h-1 before:bg-[#0C111D] before:rounded-full before:left-2 before:top-1/2 before:-translate-y-1/2">
                                            Full library of extremely great things</li>
                                        <li
                                            class="pl-5 text-xs leading-normal font-semibold truncate max-w-[9.25rem] xl:max-w-[unset] text-[#0C111D] relative before:content-[''] before:absolute before:w-1 before:h-1 before:bg-[#0C111D] before:rounded-full before:left-2 before:top-1/2 before:-translate-y-1/2">
                                            Featured library of something great</li>
                                        <li
                                            class="pl-5 text-xs leading-normal font-semibold truncate max-w-[9.25rem] xl:max-w-[unset] text-[#0C111D] relative before:content-[''] before:absolute before:w-1 before:h-1 before:bg-[#0C111D] before:rounded-full before:left-2 before:top-1/2 before:-translate-y-1/2">
                                            Full library of extremely great things</li>
                                    </ul>
                                </div>

                                <!-- Appear on -->
                                <div
                                    class="flex items-center min-w-[8.4375rem] xl:min-w-[9.9375rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32">
                                    <ul class="flex flex-col gap-0.5 overflow-hidden">
                                        <li
                                            class="pl-5 text-xs leading-normal font-semibold truncate max-w-[6.9375rem] xl:max-w-[unset] text-[#0C111D] relative before:content-[''] before:absolute before:w-1 before:h-1 before:bg-[#0C111D] before:rounded-full before:left-2 before:top-1/2 before:-translate-y-1/2">
                                            Profile page</li>
                                    </ul>
                                </div>

                                <!-- Upload date -->
                                <div
                                    class="flex items-center min-w-[7.8125rem] xl:min-w-[9.4025rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32">
                                    <span class="text-[0.77875rem] leading-[1.125rem] text-[#475467]">22 Jan 2022</span>
                                </div>

                                <!-- Action -->
                                <div
                                    class="flex items-center min-w-[6rem] flex-grow px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32">
                                    <div class="flex justify-center items-center px-3 py-2">
                                        <div class="w-6 h-6 flex justify-center items-center cursor-pointer">
                                            <img src="https://i.ibb.co.com/BV4pbgNr/pencil-01.webp" alt="edit"
                                                class="w-4 h-4">
                                        </div>
                                    </div>

                                    <div class="flex justify-center items-center px-3 py-2">
                                        <div class="w-6 h-6 flex justify-center items-center cursor-pointer">
                                            <img src="https://i.ibb.co.com/Q7jRP6S5/dots-vertical.webp" alt="settings"
                                                class="w-4 h-4">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- row -->
                            <div class="flex w-full">
                                <!-- info -->
                                <div
                                    class="flex justify-center items-center px-3 py-2 w-[18.75rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32">
                                    <div class="w-full flex flex-col gap-0.5">
                                        <h3 class="text-xs leading-normal font-semibold line-clamp-3 text-[#0C111D]">
                                            Record
                                            breaking fried chicken eating ! See my attempt to break world’s record!
                                            Watch
                                            now!</h3>

                                        <div class="flex items-center gap-2">
                                            <!-- label -->
                                            <div class="flex justify-center items-center px-1.5 py-1 bg-white">
                                                <span
                                                    class="text-xs leading-normal font-medium text-[#344054]">Chicken</span>
                                            </div>

                                            <!-- label -->
                                            <div class="flex justify-center items-center px-1.5 py-1 bg-white">
                                                <span
                                                    class="text-xs leading-normal font-medium text-[#344054]">Eating</span>
                                            </div>

                                            <!-- label -->
                                            <div class="flex justify-center items-center px-1.5 py-1 bg-white">
                                                <span
                                                    class="text-xs leading-normal font-medium text-[#344054]">Drinking</span>
                                            </div>

                                            <!-- label -->
                                            <div class="flex justify-center items-center px-1.5 py-1 bg-white">
                                                <span
                                                    class="text-xs leading-normal font-medium text-[#344054]">Drinking</span>
                                            </div>

                                            <span class="text-xs leading-normal font-medium text-[#344054]">+3</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Status -->
                                <div
                                    class="flex justify-center items-center min-w-[8.25rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32">
                                    <div class="p-1">
                                        <!-- published-tag-section -->
                                        <div class="flex">
                                            <span
                                                class="flex justify-center items-center p-1 gap-2 backdrop-blur-[10px] bg-[#07f468]">
                                                <img src="https://i.ibb.co.com/bMFQRqBP/upload.webp" alt="upload"
                                                    class="w-4 h-4" />
                                            </span>
                                            <span
                                                class="text-[#07f468] text-xs font-medium leading-[1.125rem] flex justify-center items-center gap-2 px-[.375rem] py-[0.188rem] bg-black">Published</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- P2V -->
                                <div
                                    class="flex items-center min-w-[7.1875rem] h-[6.25rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32">
                                    <span class="text-xs leading-normal font-semibold truncate text-[#0C111D]">USD$
                                        24.99</span>
                                </div>

                                <!-- Tiers -->
                                <div
                                    class="flex items-center min-w-[10.75rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:min-w-[7.0625rem] xl:h-32">
                                    <ul class="flex flex-col gap-0.5 overflow-hidden">
                                        <li
                                            class="pl-5 text-xs leading-normal font-semibold truncate max-w-[9.25rem] xl:max-w-[unset] text-[#0C111D] relative before:content-[''] before:absolute before:w-1 before:h-1 before:bg-[#0C111D] before:rounded-full before:left-2 before:top-1/2 before:-translate-y-1/2">
                                            Featured library of something great</li>
                                        <li
                                            class="pl-5 text-xs leading-normal font-semibold truncate max-w-[9.25rem] xl:max-w-[unset] text-[#0C111D] relative before:content-[''] before:absolute before:w-1 before:h-1 before:bg-[#0C111D] before:rounded-full before:left-2 before:top-1/2 before:-translate-y-1/2">
                                            Full library of extremely great things</li>
                                        <li
                                            class="pl-5 text-xs leading-normal font-semibold truncate max-w-[9.25rem] xl:max-w-[unset] text-[#0C111D] relative before:content-[''] before:absolute before:w-1 before:h-1 before:bg-[#0C111D] before:rounded-full before:left-2 before:top-1/2 before:-translate-y-1/2">
                                            Featured library of something great</li>
                                        <li
                                            class="pl-5 text-xs leading-normal font-semibold truncate max-w-[9.25rem] xl:max-w-[unset] text-[#0C111D] relative before:content-[''] before:absolute before:w-1 before:h-1 before:bg-[#0C111D] before:rounded-full before:left-2 before:top-1/2 before:-translate-y-1/2">
                                            Full library of extremely great things</li>
                                    </ul>
                                </div>

                                <!-- Appear on -->
                                <div
                                    class="flex items-center min-w-[8.4375rem] xl:min-w-[9.9375rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32">
                                    <ul class="flex flex-col gap-0.5 overflow-hidden">
                                        <li
                                            class="pl-5 text-xs leading-normal font-semibold truncate max-w-[6.9375rem] xl:max-w-[unset] text-[#0C111D] relative before:content-[''] before:absolute before:w-1 before:h-1 before:bg-[#0C111D] before:rounded-full before:left-2 before:top-1/2 before:-translate-y-1/2">
                                            Profile page</li>
                                    </ul>
                                </div>

                                <!-- Upload date -->
                                <div
                                    class="flex items-center min-w-[7.8125rem] xl:min-w-[9.4025rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32">
                                    <span class="text-[0.77875rem] leading-[1.125rem] text-[#475467]">22 Jan 2022</span>
                                </div>

                                <!-- Action -->
                                <div
                                    class="flex items-center min-w-[6rem] flex-grow px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32">
                                    <div class="flex justify-center items-center px-3 py-2">
                                        <div class="w-6 h-6 flex justify-center items-center cursor-pointer">
                                            <img src="https://i.ibb.co.com/BV4pbgNr/pencil-01.webp" alt="edit"
                                                class="w-4 h-4">
                                        </div>
                                    </div>

                                    <div class="flex justify-center items-center px-3 py-2">
                                        <div class="w-6 h-6 flex justify-center items-center cursor-pointer">
                                            <img src="https://i.ibb.co.com/Q7jRP6S5/dots-vertical.webp" alt="settings"
                                                class="w-4 h-4">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- row -->
                            <div class="flex w-full">
                                <!-- info -->
                                <div
                                    class="flex justify-center items-center px-3 py-2 w-[18.75rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32">
                                    <div class="w-full flex flex-col gap-0.5">
                                        <h3 class="text-xs leading-normal font-semibold line-clamp-3 text-[#0C111D]">
                                            Record
                                            breaking fried chicken eating ! See my attempt to break world’s record!
                                            Watch
                                            now!</h3>

                                        <div class="flex items-center gap-2">
                                            <!-- label -->
                                            <div class="flex justify-center items-center px-1.5 py-1 bg-white">
                                                <span
                                                    class="text-xs leading-normal font-medium text-[#344054]">Chicken</span>
                                            </div>

                                            <!-- label -->
                                            <div class="flex justify-center items-center px-1.5 py-1 bg-white">
                                                <span
                                                    class="text-xs leading-normal font-medium text-[#344054]">Eating</span>
                                            </div>

                                            <!-- label -->
                                            <div class="flex justify-center items-center px-1.5 py-1 bg-white">
                                                <span
                                                    class="text-xs leading-normal font-medium text-[#344054]">Drinking</span>
                                            </div>

                                            <!-- label -->
                                            <div class="flex justify-center items-center px-1.5 py-1 bg-white">
                                                <span
                                                    class="text-xs leading-normal font-medium text-[#344054]">Drinking</span>
                                            </div>

                                            <span class="text-xs leading-normal font-medium text-[#344054]">+3</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Status -->
                                <div
                                    class="flex justify-center items-center min-w-[8.25rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32">
                                    <div class="p-1">
                                        <!-- published-tag-section -->
                                        <div class="flex">
                                            <span
                                                class="flex justify-center items-center p-1 gap-2 backdrop-blur-[10px] bg-[#07f468]">
                                                <img src="https://i.ibb.co.com/bMFQRqBP/upload.webp" alt="upload"
                                                    class="w-4 h-4" />
                                            </span>
                                            <span
                                                class="text-[#07f468] text-xs font-medium leading-[1.125rem] flex justify-center items-center gap-2 px-[.375rem] py-[0.188rem] bg-black">Published</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- P2V -->
                                <div
                                    class="flex items-center min-w-[7.1875rem] h-[6.25rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32">
                                    <span class="text-xs leading-normal font-semibold truncate text-[#0C111D]">USD$
                                        24.99</span>
                                </div>

                                <!-- Tiers -->
                                <div
                                    class="flex items-center min-w-[10.75rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:min-w-[7.0625rem] xl:h-32">
                                    <ul class="flex flex-col gap-0.5 overflow-hidden">
                                        <li
                                            class="pl-5 text-xs leading-normal font-semibold truncate max-w-[9.25rem] xl:max-w-[unset] text-[#0C111D] relative before:content-[''] before:absolute before:w-1 before:h-1 before:bg-[#0C111D] before:rounded-full before:left-2 before:top-1/2 before:-translate-y-1/2">
                                            Featured library of something great</li>
                                        <li
                                            class="pl-5 text-xs leading-normal font-semibold truncate max-w-[9.25rem] xl:max-w-[unset] text-[#0C111D] relative before:content-[''] before:absolute before:w-1 before:h-1 before:bg-[#0C111D] before:rounded-full before:left-2 before:top-1/2 before:-translate-y-1/2">
                                            Full library of extremely great things</li>
                                        <li
                                            class="pl-5 text-xs leading-normal font-semibold truncate max-w-[9.25rem] xl:max-w-[unset] text-[#0C111D] relative before:content-[''] before:absolute before:w-1 before:h-1 before:bg-[#0C111D] before:rounded-full before:left-2 before:top-1/2 before:-translate-y-1/2">
                                            Featured library of something great</li>
                                        <li
                                            class="pl-5 text-xs leading-normal font-semibold truncate max-w-[9.25rem] xl:max-w-[unset] text-[#0C111D] relative before:content-[''] before:absolute before:w-1 before:h-1 before:bg-[#0C111D] before:rounded-full before:left-2 before:top-1/2 before:-translate-y-1/2">
                                            Full library of extremely great things</li>
                                    </ul>
                                </div>

                                <!-- Appear on -->
                                <div
                                    class="flex items-center min-w-[8.4375rem] xl:min-w-[9.9375rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32">
                                    <ul class="flex flex-col gap-0.5 overflow-hidden">
                                        <li
                                            class="pl-5 text-xs leading-normal font-semibold truncate max-w-[6.9375rem] xl:max-w-[unset] text-[#0C111D] relative before:content-[''] before:absolute before:w-1 before:h-1 before:bg-[#0C111D] before:rounded-full before:left-2 before:top-1/2 before:-translate-y-1/2">
                                            Profile page</li>
                                    </ul>
                                </div>

                                <!-- Upload date -->
                                <div
                                    class="flex items-center min-w-[7.8125rem] xl:min-w-[9.4025rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32">
                                    <span class="text-[0.77875rem] leading-[1.125rem] text-[#475467]">22 Jan 2022</span>
                                </div>

                                <!-- Action -->
                                <div
                                    class="flex items-center min-w-[6rem] flex-grow px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32">
                                    <div class="flex justify-center items-center px-3 py-2">
                                        <div class="w-6 h-6 flex justify-center items-center cursor-pointer">
                                            <img src="https://i.ibb.co.com/BV4pbgNr/pencil-01.webp" alt="edit"
                                                class="w-4 h-4">
                                        </div>
                                    </div>

                                    <div class="flex justify-center items-center px-3 py-2">
                                        <div class="w-6 h-6 flex justify-center items-center cursor-pointer">
                                            <img src="https://i.ibb.co.com/Q7jRP6S5/dots-vertical.webp" alt="settings"
                                                class="w-4 h-4">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

</template>

<script setup>
import { ref } from 'vue';
import MyMediaCard from './MyMediaCard.vue';
import MyMediaTabs from './MyMediaTabs.vue';
import ButtonComponent from '@/components/dev/button/ButtonComponent.vue';

// 1. State banayein (Default 'grid' rakha hai)
const viewMode = ref('grid');
const currentTab = ref('all');

// Tab Configuration
const tabList = [
    { label: 'All', value: 'all', count: 1 },
    { label: 'Published', value: 'published', count: 0 },
    { label: 'Not Published', value: 'not_published', count: 0 },
    { label: 'Reviewing', value: 'reviewing', count: 1 },
];
</script>