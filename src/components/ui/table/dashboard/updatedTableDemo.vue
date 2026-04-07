<script setup>
import { reactive, ref, computed } from "vue";
import FlexTable from "../FlexTable.vue";
import OrderDetailsPopup from "../../popup/OrderDetailsPopup.vue";
const state = reactive({
  rows: [],
  loading: false,
  hasMore: false,
  selectedOrder: null,
  isPopupOpen: false,
  isPopupLoading: false,
});

// Update rows with diverse statuses for demo
state.rows = [
  {
    id: 1,
    type: "Merch",
    orderNum: "#8281",
    icon: "/images/merchIcon.png",
    iconBg: "#000",
    from: "@Mangoes4eva",
    fromAvatar: "https://i.ibb.co.com/jkjtwC9C/svgviewer-png-output-17.webp",
    status: "In Progress",
    date: "8 Apr 2025",
    total: "USD$ 9.99",
  },
  {
    id: 2,
    type: "Merch",
    orderNum: "#6565",
    icon: "/images/merchIcon.png",
    iconBg: "#000",
    from: "@Mangoes4eva",
    fromAvatar: "https://i.ibb.co.com/jkjtwC9C/svgviewer-png-output-17.webp",
    status: "Completed",
    date: "20 Sep 2024",
    total: "USD$ 9.99",
  },
  {
    id: 3,
    type: "Merch",
    orderNum: "#7721",
    icon: "/images/cartIcon.png",
    iconBg: "#07F468",
    from: "@Mangoes4eva",
    fromAvatar: "https://i.ibb.co.com/jkjtwC9C/svgviewer-png-output-17.webp",
    status: "In Progress",
    date: "15 Oct 2024",
    total: "USD$ 9.99",
  },
  {
    id: 4,
    type: "Merch",
    orderNum: "#9102",
    icon: "/images/merchIcon.png",
    iconBg: "#000",
    from: "@Mangoes4eva",
    fromAvatar: "https://i.ibb.co.com/jkjtwC9C/svgviewer-png-output-17.webp",
    status: "Cancelled",
    date: "12 Dec 2024",
    total: "USD$ 9.99",
  },
  {
    id: 5,
    type: "Merch",
    orderNum: "#5543",
    icon: "/images/merchIcon.png",
    iconBg: "#000",
    from: "@Mangoes4eva",
    fromAvatar: "https://i.ibb.co.com/jkjtwC9C/svgviewer-png-output-17.webp",
    status: "Completed",
    date: "05 Jan 2025",
    total: "USD$ 9.99",
  },
  {
    id: 6,
    type: "Merch",
    orderNum: "#1122",
    icon: "/images/merchIcon.png",
    iconBg: "#000",
    from: "@Mangoes4eva",
    fromAvatar: "https://i.ibb.co.com/jkjtwC9C/svgviewer-png-output-17.webp",
    status: "Cancelled",
    date: "18 Feb 2025",
    total: "USD$ 19.99",
  },
  // Adding more In Progress data for scroll
  ...Array.from({ length: 15 }, (_, i) => ({
    id: 10 + i,
    type: "Merch",
    orderNum: `#${8000 + i}`,
    icon: "/images/merchIcon.png",
    iconBg: "#000",
    from: "@Mangoes4eva",
    fromAvatar: "https://i.ibb.co.com/jkjtwC9C/svgviewer-png-output-17.webp",
    status: "In Progress",
    date: "12 May 2025",
    total: "USD$ 9.99",
  }))
];

// FILTERING LOGIC
const props = defineProps({
  activeTab: {
    type: String,
    default: 'All'
  }
});

const filteredRows = computed(() => {
  const tab = props.activeTab.toLowerCase();
  
  if (tab === 'all') return state.rows;
  if (tab === 'progress') return state.rows.filter(r => r.status === 'In Progress');
  if (tab === 'completed') return state.rows.filter(r => r.status === 'Completed');
  if (tab === 'canceled') return state.rows.filter(r => r.status === 'Cancelled');
  
  return state.rows;
});

// STATUS CONFIGURATION
const statusConfig = {
  defaultIcon: "https://i.ibb.co.com/cSnyRK5k/stars.webp",
  styles: {
    "In Progress": {
      label: "New", // Custom label for display
      iconSrc: "https://i.ibb.co.com/cSnyRK5k/stars.webp",
      iconBg: "bg-[#FFE500] p-1 dark:bg-[#3E2E00]",
      textClass: "text-[#FFE500] px-[6px] py-[4px] bg-[#000000]",
    },
    Completed: {
      iconSrc: "https://i.ibb.co.com/S4bDBh8V/location.webp", // Will replace with checkmark in FlexTable if detected
      iconBg: "bg-[#07F468] p-1 dark:bg-[#06c454]",
      textClass: "text-[#07F468] px-[6px] py-[4px] bg-[#000000] font-semibold",
      isCompleted: true // Custom flag for FlexTable checkmark
    },
    Cancelled: {
      iconBg: "bg-red-500 p-1 dark:bg-red-700",
      textClass: "text-red-500 bg-black px-[6px] py-[4px] font-semibold",
      isCancelled: true // Custom flag for FlexTable cross
    },
  },
};

const columns = [
  {
    key: "type",
    label: "Order#",
    basis: {
      default: "basis-1/2",
      md: "md:basis-1/4",
      lg: "lg:basis-1/4"
    },
    type: "rich-icon",
    config: {
      iconKey: "icon",
      bgKey: "iconBg",
      subtextKey: "orderNum",
      mobileRightKey: "date",
      mobileBottomUserKey: "fromAvatar",
      mobileBottomUserTextKey: "from",
    },
  },
  {
    key: "from",
    label: "From",
    basis: "basis-1/6",
    type: "user",
    config: { avatarKey: "fromAvatar" },
    hiddenAt: ["xs", "sm"],
  },
  {
    key: "status",
    label: "Status",
    basis: "basis-1/6",
    type: "status",
    config: statusConfig,
    hiddenAt: ["xs", "sm"],
  },
  {
    key: "date",
    label: "Date",
    basis: "basis-1/6",
    hiddenAt: ["xs", "sm"],
  },
  {
    key: "total",
    label: "Total",
    basis: {
      default: "basis-1/2",
      md: "md:basis-1/4",
      lg: "lg:basis-1/4"
    },
    align: {
      default: 'right',
      md: 'left'
    },
  },
];

const theme = {
  container: "relative overflow-hidden",
  header: "border-b border-zinc-200 dark:border-background-dark-app sticky top-0 z-30 backdrop-blur-md",
  headerRow: "flex items-center ",
  headerCell: "px-3 py-3 text-xs font-[400] text-[#667085] tracking-wider dark:text-[#7A8195]",
  row: "flex items-center border-b border-zinc-100 dark:border-background-dark-app odd:bg-[#ebe3eb] dark:odd:bg-[#322C32] even:bg-[#efebf2] dark:even:bg-[#2B282D] transition-colors cursor-pointer last:border-0",
  cell: "text-xs text-zinc-800 p-0 dark:text-text",
  footer: "p-3 text-center text-xs text-zinc-400",
};

function loadMore() {
  if (state.loading || !state.hasMore) return;
  state.loading = true;
  setTimeout(() => {
    state.loading = false;
  }, 500);
}

function handleRowClick(row) {
  state.selectedOrder = row;
  state.isPopupOpen = true;
  state.isPopupLoading = true;
  
  // Simulate loading delay
  setTimeout(() => {
    state.isPopupLoading = false;
  }, 1500);
}
</script>

<template>
  <div class="px-3 md:px-0">

    <FlexTable 
      :columns="columns" 
      :rows="filteredRows" 
      row-key="id" 
      :theme="theme" 
      :inner-scroll="true"
      desktop-breakpoint="md" 
      @load-more="loadMore" 
      @row-click="handleRowClick"
      max-height="30rem" 
      :sticky-header="true" 
    />

    <OrderDetailsPopup
      v-model="state.isPopupOpen"
      :order="state.selectedOrder"
      :loading="state.isPopupLoading"
    />
  </div>
</template>
