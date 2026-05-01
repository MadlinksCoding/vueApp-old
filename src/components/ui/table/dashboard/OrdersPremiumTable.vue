<script setup>
import { reactive, computed } from "vue";
import FlexTable from "../FlexTable.vue";

const props = defineProps({
  activeTab: { type: String, default: 'All' },
  activeOrderType: { type: String, default: 'all' },
  searchQuery: { type: String, default: '' },
});

// Dummy Data to match the image
const orders = [
  {
    id: "1",
    orderNum: "Call - Instant (Video)",
    link: "",
    icon: "/images/webcam-icon.png", // Placeholder
    iconBg: "#07F468",
    from: "@Mangoes4eva",
    fromAvatar: "/images/mangoes.png",
    status: "Completed",
    date: "22 Jan 2022",
    total: "USD$ 9.99",
  },
  {
    id: "2",
    orderNum: "Call - group event",
    link: "Event detail",
    icon: "/images/event-group-icon.png", // Placeholder
    iconBg: "#101828",
    from: "@Mangoes4eva",
    fromAvatar: "/images/mangoes.png",
    status: "Confirmed",
    date: "22 Jan 2022",
    total: "USD$ 9.99",
  },
  {
    id: "3",
    orderNum: "Call - Instant (Audio)",
    link: "",
    icon: "/images/phone-icon.png", // Placeholder
    iconBg: "#07F468",
    from: "@Mangoes4eva",
    fromAvatar: "/images/mangoes.png",
    status: "Completed",
    date: "22 Jan 2022",
    total: "USD$ 9.99",
  },
  {
    id: "4",
    orderNum: "Call - Scheduled (Video)",
    link: "Booking detail",
    icon: "/images/schedule-video-icon.png", // Placeholder
    iconBg: "#101828",
    from: "@Mangoes4eva",
    fromAvatar: "/images/mangoes.png",
    status: "Declined",
    date: "22 Jan 2022",
    total: "USD$ 9.99",
  },
  {
    id: "5",
    orderNum: "Call - Scheduled (Audio)",
    link: "Booking detail",
    icon: "/images/schedule-audio-icon.png", // Placeholder
    iconBg: "#101828",
    from: "@Mangoes4eva",
    fromAvatar: "/images/mangoes.png",
    status: "Canceled",
    date: "22 Jan 2022",
    total: "USD$ 9.99",
  },
  {
    id: "6",
    orderNum: "Call - Instant (Video)",
    link: "",
    icon: "/images/webcam-icon.png", // Placeholder
    iconBg: "#07F468",
    from: "@Mangoes4eva",
    fromAvatar: "/images/mangoes.png",
    status: "Completed",
    date: "22 Jan 2022",
    total: "USD$ 9.99",
  },
  {
    id: "7",
    orderNum: "Call - group event",
    link: "Event detail",
    icon: "/images/event-group-icon.png", // Placeholder
    iconBg: "#101828",
    from: "@Mangoes4eva",
    fromAvatar: "/images/mangoes.png",
    status: "New",
    date: "22 Jan 2022",
    total: "USD$ 9.99",
  },
  {
    id: "8",
    orderNum: "Call - Instant (Audio)",
    link: "",
    icon: "/images/phone-icon.png", // Placeholder
    iconBg: "#07F468",
    from: "@Mangoes4eva",
    fromAvatar: "/images/mangoes.png",
    status: "Completed",
    date: "22 Jan 2022",
    total: "USD$ 9.99",
  },
  {
    id: "9",
    orderNum: "Call - Scheduled (Video)",
    link: "Booking detail",
    icon: "/images/webcam-green-icon.png", // Placeholder
    iconBg: "#101828",
    from: "@Mangoes4eva",
    fromAvatar: "/images/mangoes.png",
    status: "New",
    date: "22 Jan 2022",
    total: "USD$ 9.99",
  },
  {
    id: "10",
    orderNum: "Call - Scheduled (Audio)",
    link: "Booking detail",
    
    icon: "/images/phone-green-icon.png", // Placeholder
    iconBg: "#101828",
    from: "@Mangoes4eva",
    fromAvatar: "/images/mangoes.png",
    status: "New",
    date: "22 Jan 2022",
    total: "USD$ 9.99",
  },
];

const filteredRows = computed(() => {
  return orders.filter(row => {
    const matchesSearch = row.orderNum.toLowerCase().includes(props.searchQuery.toLowerCase()) || 
                         row.from.toLowerCase().includes(props.searchQuery.toLowerCase());
    const matchesTab = props.activeTab === 'All' || row.status === props.activeTab || (props.activeTab === 'In Progress' && row.status === 'New');
    return matchesSearch && matchesTab;
  });
});

const columns = [
  {
    key: "orderNum",
    label: "Order#",
    basis: "basis-[25%]",
    type: "custom",
  },
  {
    key: "from",
    label: "From",
    basis: "basis-[12%]",
    type: "user",
    config: { avatarKey: "fromAvatar" },
  },
  {
    key: "status",
    label: "Status",
    basis: "basis-[12%]",
    type: "status",
  },
  {
    key: "date",
    label: "Date",
    basis: "basis-[15%]",
  },
  {
    key: "total",
    label: "Total",
    basis: "basis-[12%]",
  },
];

const statusStyles = {
  Completed: {
    iconBg: "bg-[#07F468]",
    textClass: "text-[#07F468] bg-black",
    icon: "check",
  },
  Confirmed: {
    iconBg: "bg-[#00D1FF]",
    textClass: "text-[#00D1FF] bg-black",
    icon: "calendar",
  },
  Declined: {
    iconBg: "bg-[#FF9C66]",
    textClass: "text-[#FF9C66] bg-black",
    icon: "cross",
  },
  Canceled: {
    iconBg: "bg-[#98A2B3]",
    textClass: "text-[#98A2B3] bg-black",
    icon: "cross",
  },
  New: {
    iconBg: "bg-[#FFE500]",
    textClass: "text-[#FFE500] bg-black",
    icon: "new",
  },
};

const theme = {
  container: "relative overflow-hidden",
  header: "border-b border-[#667085] dark:border-background-dark-app sticky top-0 z-30 backdrop-blur-md",
  headerRow: "flex items-center",
  headerCell: "px-3 py-3 text-xs font-[400] text-[#667085] tracking-wider",
  row: "flex items-stretch border-b border-zinc-100 odd:bg-transparent even:bg-[#F2F4F780] transition-colors cursor-pointer last:border-0 min-h-[4.5rem]",
  cell: "text-xs text-zinc-800 p-0",
  footer: "p-3 text-center text-xs text-zinc-400",
};
</script>

<template>
  <div class="premium-orders-table">
    <FlexTable 
      :columns="columns" 
      :rows="filteredRows" 
      row-key="id" 
      :theme="theme" 
      :inner-scroll="true"
      max-height="calc(100vh - 150px)" 
      :sticky-header="true" 
    >
      <!-- Custom Order Column -->
      <template #cell.orderNum="{ row }">
        <div class="flex items-center h-full">
          <div 
            class="flex justify-center items-center h-full w-[4.5rem] shrink-0"
            :style="{ backgroundColor: row.iconBg }"
          >
            <!-- Show Image if provided in data -->
            <img v-if="row.icon" :src="row.icon" class="w-9 h-9 object-contain" alt="icon" />
            
            <!-- Generic fallback icons (only if row.icon is missing) -->
            <template v-else>
               <svg v-if="row.iconBg === '#07F468'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
               <svg v-else-if="row.orderNum.includes('group')" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
               <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </template>
          </div>
          <div class="flex flex-col justify-center items-start flex-1 px-4 overflow-hidden">
            <span class="truncate text-[13px] font-semibold text-[#101828] w-full">{{ row.orderNum }}</span>
            <a v-if="row.link" href="#" class="text-[11px] text-[#1570EF] underline mt-0.5" @click.stop>{{ row.link }}</a>
          </div>
        </div>
      </template>

      <!-- Custom From Column -->
      <template #cell.from="{ row }">
        <div class="flex items-center gap-2 px-3 h-full">
          <img :src="row.fromAvatar" class="w-5 h-5 rounded-full object-cover" alt="avatar" />
          
          <span class="truncate text-[13px] text-[#344054]">{{ row.from }}</span>
        </div>
      </template>

      <!-- Custom Status Column -->
      <template #cell.status="{ row }">
        <div class="flex items-center px-3 h-full">
          <div class="flex items-center rounded-[2px] overflow-hidden">
            <div 
              class="flex justify-center items-center h-6 w-6 shrink-0"
              :class="statusStyles[row.status]?.iconBg"
            >
              <!-- Status Icons -->
              <svg v-if="statusStyles[row.status]?.icon === 'check'" width="12" height="9" viewBox="0 0 12 9" fill="none"><path d="M1 4.5L4.5 8L11 1.5" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <svg v-else-if="statusStyles[row.status]?.icon === 'calendar'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <svg v-else-if="statusStyles[row.status]?.icon === 'cross'" width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M9 1L1 9M1 1L9 9" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <svg v-else-if="statusStyles[row.status]?.icon === 'new'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
            </div>
            <div 
              class="flex justify-center items-center text-[12px] font-medium h-6 px-2  tracking-tight"
              :class="statusStyles[row.status]?.textClass"
            >
              {{ row.status }}
            </div>
          </div>
        </div>
      </template>

      <!-- Custom Date Column -->
      <template #cell.date="{ value }">
        <div class="px-3 text-xs text-zinc-800 h-full flex items-center">
          {{ value }}
        </div>
      </template>

      <!-- Custom Total Column -->
      <template #cell.total="{ row }">
        <div class="px-3 text-[13px] font-bold text-[#101828] h-full flex items-center">
          {{ row.total }}
        </div>
      </template>

      <template #empty>
        No orders found
      </template>
    </FlexTable>
  </div>
</template>

<style scoped>
.premium-orders-table :deep(.flex-table-row) {
  height: 4.5rem;
}
</style>
