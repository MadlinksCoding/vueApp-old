<script setup>
import DashboardWrapperTwoColContainer from "@/components/dashboard/DashboardWrapperTwoColContainer.vue";
import Heading from "@/components/dev/default/Heading.vue";
import OrdersPremiumTable from "@/components/ui/table/dashboard/OrdersPremiumTable.vue";
import MyMediaTabs from "@/templates/mediaCreator/MyMediaTabs.vue";
import CustomDropdown from "@/components/ui/dropdown/CustomDropdown.vue";
import { ref } from "vue";

const currentTab = ref("All");
const searchQuery = ref("");

// Tab Configuration
const tabList = [
  { label: "In Progress", value: "In Progress", count: 60 }, 
  { label: "Completed", value: "Completed", count: 40 },
  { label: "Canceled", value: "Canceled", count: 4 },
  { label: "All", value: "All", count: 120 },
];
  
const selectedOrderType = ref("all");
const orderTypeOptions = [
  { label: "All Types", value: "all" },
  { label: "P2V", value: "p2v" },
  { label: "Subscription", value: "subscription" },
  { label: "Merch", value: "merch" },
  { label: "Mix", value: "mix" },
];
</script>

<template>
    <div class="flex flex-col gap-[16px]  min-h-screen">
      <div class="p-2 flex flex-col gap-[24px]">
        <Heading text="Orders" tag="h1" theme="orderHeading" class="text-[28px] font-semibold text-[#101828]" />
        
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center justify-between">
          <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center ">
            <MyMediaTabs v-model="currentTab" :tabs="tabList" />
            
            <!-- Search Container -->
             <div class="py-2 px-3">
            <!-- input-container -->
            <div class="flex items-center gap-1.5 relative">
              <img
                src="https://i.ibb.co.com/jvc93MC4/search.webp"
                alt="search"
                class="w-5 h-5 absolute left-0 top-1/2 -translate-y-1/2 [filter:brightness(0)_saturate(100%)_invert(47%)_sepia(11%)_saturate(772%)_hue-rotate(182deg)_brightness(89%)_contrast(86%)]"
              />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search..."
                class="bg-transparent border-0 pl-7 outline-none text-base text-[#667085] dark:text-[#ACBACF] placeholder-[#667085] dark:placeholder:text-[#ACBACF]"
              />
            </div>
          </div>
          </div>

          <div class="flex items-center gap-2">
            <CustomDropdown
              v-model="selectedOrderType"
              :options="orderTypeOptions"
              buttonClass="w-max bg-transparent p-0 border-none shadow-none h-full flex items-center justify-between [&>img:last-child]:hidden"
              dropdownClass="absolute right-0 w-max top-[calc(100%+0.5rem)] rounded-lg bg-white border border-[#EAECF0] shadow-lg max-h-[245px] overflow-y-auto z-50"
              optionClass="p-0 border-b border-[#EAECF0] last:border-none"
            >
              <template #trigger="{ isOpen }">
                <div class="flex items-center gap-2 cursor-pointer h-full">
                  <span class="text-[#344054] text-sm font-medium">Order Type</span>
                  <img 
                    src="/images/dropdownIcon.png" 
                    alt="dropdown" 
                    :class="{ 'rotate-180': isOpen }" 
                    class="w-3 h-2 transition-transform duration-300 opacity-60"
                  />
                </div>
              </template>

              <template #option="{ option, isSelected }">
                <div 
                  class="flex items-center gap-2 h-10 px-4 transition-all duration-200 cursor-pointer hover:bg-[#F9FAFB]"
                  :class="{ 'bg-[#F9FAFB] font-semibold': isSelected }"
                >
                  <span class="text-sm font-medium text-[#101828]">
                    {{ option.label }}
                  </span>
                </div>
              </template>
            </CustomDropdown>
          </div>
        </div>
      </div>

      <div class="flex-1 p-4">
        <OrdersPremiumTable 
          :active-tab="currentTab" 
          :search-query="searchQuery"
        />
      </div>
    </div>
</template>

<style scoped>
/* Add any page specific styles here */
</style>
