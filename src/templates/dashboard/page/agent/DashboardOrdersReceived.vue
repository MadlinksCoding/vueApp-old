<script setup>
import DashboardWrapperTwoColContainer from "@/components/dashboard/DashboardWrapperTwoColContainer.vue";
import Heading from "@/components/dev/default/Heading.vue";
import UpdatedTableDemo from "@/components/ui/table/dashboard/updatedTableDemo.vue";
import MyMediaTabs from "@/templates/mediaCreator/MyMediaTabs.vue";
import { ref } from "vue";

const currentTab = ref("progress");

// Tab Configuration
const tabList = [
  { label: "In Progress", value: "progress", count: 60 },
  { label: "Completed", value: "Completed", count: 40 },
  { label: "Canceled", value: "Canceled", count: 4 },
  { label: "All", value: "All", count: 120 },
];
</script>

<template>
  <DashboardWrapperTwoColContainer>
    <div class="flex flex-col gap-[16px] backdrop-blur-[1px]">
      <div class="p-2 flex flex-col gap-[24px]">
        <Heading text="Orders Received" tag="h1" theme="orderHeading" />
        <div class="flex flex-col gap-2 lg:flex-row">
          
            <MyMediaTabs v-model="currentTab" :tabs="tabList" />

          <div class="flex justify-between items-center w-full">
          <div class="py-2 px-3">
            <!-- input-container -->
            <div class="flex items-center gap-1.5 relative">
              <img
                src="https://i.ibb.co.com/jvc93MC4/search.webp"
                alt="search"
                class="w-5 h-5 absolute left-0 top-1/2 -translate-y-1/2 [filter:brightness(0)_saturate(100%)_invert(47%)_sepia(11%)_saturate(772%)_hue-rotate(182deg)_brightness(89%)_contrast(86%)]"
              />
              <input
                type="text"
                placeholder="Search..."
                class="bg-transparent border-0 pl-7 outline-none text-base text-[#667085] dark:text-text placeholder-[#667085] dark:placeholder:text-text"
              />
            </div>
          </div>

              <div class="flex items-center gap-2">
          <Label class="text-[#344054] text-[14px] font-400 dark:text-text">Order Type</Label>
          <img src="/images/dropdownIcon.png" alt="">
        </div>
          </div>
        </div>
      </div>
      <div v-if="currentTab === 'progress'">
        <UpdatedTableDemo />
      </div>
    </div>
  </DashboardWrapperTwoColContainer>
</template>
