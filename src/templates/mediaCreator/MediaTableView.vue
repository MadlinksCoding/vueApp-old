<template>
    <div
        class="hidden w-max flex-col flex-grow group-[.table-view]:flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-order-style:none] [scrollbar-width:none]">

        <MediaTableHeader />

        <div class="flex flex-col w-max border-t border-[#667085] xl:w-full [&>*:nth-child(odd)]:bg-[#F2F4F780]">

            <div v-if="loading" class="p-4 text-center text-gray-500">Loading data...</div>

            <div v-else v-for="item in items" :key="item.id" class="flex w-full">

                <div
                    class="flex justify-center items-center px-3 py-2 w-[18.75rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32">
                    <div class="w-full flex flex-col gap-0.5">
                        <h3 class="text-xs leading-normal font-semibold line-clamp-3 text-[#0C111D]">
                            {{ item.title }}
                        </h3>

                        <div class="flex items-center gap-2">
                            <div v-for="(tag, index) in item.tags" :key="index"
                                class="flex justify-center items-center px-1.5 py-1 bg-white">
                                <span class="text-xs leading-normal font-medium text-[#344054]">{{ tag }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex justify-center items-center min-w-[8.25rem] h-[6.25rem] lg:h-[7.03125rem] xl:h-32">
                    <div class="p-1">
                        <div class="flex">
                            <span class="flex justify-center items-center p-1 gap-2 backdrop-blur-[10px] bg-[#07f468]">
                                <img src="https://i.ibb.co.com/bMFQRqBP/upload.webp" alt="upload" class="w-4 h-4" />
                            </span>
                            <span
                                class="text-[#07f468] text-xs font-medium leading-[1.125rem] flex justify-center items-center gap-2 px-[.375rem] py-[0.188rem] bg-black">
                                {{ item.isPublished ? 'Published' : 'Pending' }}
                            </span>
                        </div>
                    </div>
                </div>

                <div
                    class="flex items-center min-w-[7.1875rem] h-[6.25rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32">
                    <span class="text-xs leading-normal font-semibold truncate text-[#0C111D]">
                        {{ item.price }}
                    </span>
                </div>

                <div
                    class="flex items-center min-w-[10.75rem] px-3 py-2 overflow-hidden lg:h-[7.03125rem] xl:min-w-[7.0625rem] xl:h-32">
                    <ul class="flex flex-col gap-0.5 overflow-hidden">
                        <li v-for="(tier, tIndex) in item.tiers" :key="tIndex"
                            class="pl-5 text-xs leading-normal font-semibold truncate max-w-[9.25rem] xl:max-w-[unset] text-[#0C111D] relative before:content-[''] before:absolute before:w-1 before:h-1 before:bg-[#0C111D] before:rounded-full before:left-2 before:top-1/2 before:-translate-y-1/2">
                            {{ tier }}
                        </li>
                    </ul>
                </div>

                <div
                    class="flex items-center min-w-[8.4375rem] xl:min-w-[9.9375rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32">
                    <ul class="flex flex-col gap-0.5 overflow-hidden">
                        <li v-for="(place, pIndex) in item.appearOn" :key="pIndex"
                            class="pl-5 text-xs leading-normal font-semibold truncate max-w-[6.9375rem] xl:max-w-[unset] text-[#0C111D] relative before:content-[''] before:absolute before:w-1 before:h-1 before:bg-[#0C111D] before:rounded-full before:left-2 before:top-1/2 before:-translate-y-1/2">
                            {{ place }}
                        </li>
                    </ul>
                </div>

                <div
                    class="flex items-center min-w-[7.8125rem] xl:min-w-[9.4025rem] px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32">
                    <span class="text-[0.77875rem] leading-[1.125rem] text-[#475467]">{{ item.date }}</span>
                </div>

                <div
                    class="flex items-center min-w-[6rem] flex-grow px-3 py-2 lg:h-[7.03125rem] xl:w-[7.0625rem] xl:h-32">
                    <div class="flex justify-center items-center px-3 py-2">
                        <div class="w-6 h-6 flex justify-center items-center cursor-pointer">
                            <img src="https://i.ibb.co.com/BV4pbgNr/pencil-01.webp" alt="edit" class="w-4 h-4">
                        </div>
                    </div>

                    <div class="flex justify-center items-center px-3 py-2">
                        <div class="w-6 h-6 flex justify-center items-center cursor-pointer">
                            <img src="https://i.ibb.co.com/Q7jRP6S5/dots-vertical.webp" alt="settings" class="w-4 h-4">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import MediaTableHeader from "./MediaTableHeader.vue"

const items = ref([]);
const loading = ref(true);

// API Call Function (Simulated)
const fetchData = async () => {
    try {
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
    fetchData();
});
</script>