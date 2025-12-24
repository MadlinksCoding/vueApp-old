<template>
    <div
        class="relative z-[2] bg-[#F9FAFBE5] min-h-screen md:bg-transparent md:h-auto
         before:content-[''] before:fixed 
         md:before:bg-[url('https://i.ibb.co.com/dw910Z5b/gradient-main-bg.webp')] dark:bg-background-dark-app
         before:bg-cover before:w-full before:bg-no-repeat before:h-full 
         before:left-0 before:top-0 before:pointer-events-none">
        <div class="flex flex-col backdrop-blur-[50px] md:gap-6 ">
            <!-- title-section -->
            <section class="hidden md:flex justify-between items-center md:gap-6 pt-10 px-4 xl:px-10">
                <h1 class="text-3xl font-medium leading-[2.375rem] text-[#475467] dark:text-text">Media</h1>

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

                    <div v-if="loading"
                        class="hidden md:flex w-[6.5rem] h-10 rounded-md bg-[#E6E6E6] animate-skeleton-loading">
                    </div>
                    <div v-else
                        class="hidden md:flex bg-[#F9FAFB80] dark:bg-transparent border border-[#D0D5DD] rounded-[0.3125rem] overflow-hidden">

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
                    <div v-if="loading"
                        class="w-full flex items-start h-10 rounded-md bg-[#E6E6E6] animate-skeleton-loading md:w-[20.125rem]">
                    </div>

                    <MyMediaTabs v-else v-model="currentTab" :tabs="tabList" />
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
                            class="text-xs leading-normal font-medium text-[#98A2B3] dark:text-[#BAC7DC] md:text-sm md:leading-semibold md:text-[#344054]">Filter</span>
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
                            <template v-if="loading">
                                <div v-for="n in 8" :key="n">
                                    <div
                                        class="w-full relative aspect-video rounded-md bg-[#E6E6E6] animate-skeleton-loading cursor-pointer group-[.table-view]:w-[11.11125rem] group-[.table-view]:h-[6.25rem] lg:group-[.table-view]:w-[12.5rem] lg:group-[.table-view]:h-[7.03125rem] xl:group-[.table-view]:w-[14.22rem] xl:group-[.table-view]:h-32">
                                    </div>
                                </div>
                            </template>

                            <template v-else>
                                <div v-for="item in items" :key="item.id">
                                    <MyMediaCard :videoSrc="item.videoSrc" />
                                </div>
                            </template>
                        </div>
                    </div>

                    <!-- table-wrapper -->
                    <MediaTableView />
                </div>
            </div>
        </div>
    </div>

</template>

<script setup>
import { ref, onMounted } from 'vue';
import MyMediaCard from './MyMediaCard.vue';
import MediaTableView from './MediaTableView.vue';
import MyMediaTabs from './MyMediaTabs.vue';
import ButtonComponent from '@/components/dev/button/ButtonComponent.vue';

const viewMode = ref('grid');
const currentTab = ref('all');

// Tab Configuration
const tabList = [
    { label: 'All', value: 'all', count: 1 },
    { label: 'Published', value: 'published', count: 0 },
    { label: 'Not Published', value: 'not_published', count: 0 },
    { label: 'Reviewing', value: 'reviewing', count: 1 },
];

const items = ref([]);
const loading = ref(true);

const fetchVideos = async () => {
    try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const response = await fetch('/data/mockTableData.json');

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        items.value = data;

    } catch (error) {
        console.error("Error fetching video data:", error);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchVideos();
});
</script>