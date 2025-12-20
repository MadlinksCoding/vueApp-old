<script setup>
import { reactive } from "vue";
import FlexTable from "../FlexTable.vue";
const state = reactive({
  rows: [
    {
      id: 1,
      type: "Merch",
      orderNum: "#8281",
      icon: "/images/merchIcon.png",
      iconBg: "#000",
      from: "@Mangoes4eva",
      fromAvatar: "/images/fromAvatar.png",
      status: "New",
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
      fromAvatar: "/images/fromAvatar.png",
      status: "New",
      date: "20 Sep 2024",
      total: "USD$ 9.99",
    },
    {
      id: 3,
      type: "Merch",
      orderNum: "#6565",
      icon: "/images/cartIcon.png",
      iconBg: "#07F468",
      from: "@Mangoes4eva",
      fromAvatar: "/images/fromAvatar.png",
      status: "New",
      date: "20 Sep 2024",
      total: "USD$ 9.99",
    },
    {
      id: 4,
      type: "Merch",
      orderNum: "#8281",
      icon: "/images/merchIcon.png",
      iconBg: "#000",
      from: "@Mangoes4eva",
      fromAvatar: "/images/fromAvatar.png",
      status: "New",
      date: "8 Apr 2025",
      total: "USD$ 9.99",
    },
    {
      id: 5,
      type: "Merch",
      orderNum: "#6565",
      icon: "/images/merchIcon.png",
      iconBg: "#000",
      from: "@Mangoes4eva",
      fromAvatar: "/images/fromAvatar.png",
      status: "New",
      date: "20 Sep 2024",
      total: "USD$ 9.99",
    },
    {
      id: 6,
      type: "Merch",
      orderNum: "#6565",
      icon: "/images/cartIcon.png",
      iconBg: "#07F468",
      from: "@Mangoes4eva",
      fromAvatar: "/images/fromAvatar.png",
      status: "New",
      date: "20 Sep 2024",
      total: "USD$ 9.99",
    },
    {
      id: 7,
      type: "Merch",
      orderNum: "#6565",
      icon: "/images/cartIcon.png",
      iconBg: "#07F468",
      from: "@Mangoes4eva",
      fromAvatar: "/images/fromAvatar.png",
      status: "New",
      date: "20 Sep 2024",
      total: "USD$ 9.99",
    },
    {
      id: 8,
      type: "Merch",
      orderNum: "#6565",
      icon: "/images/cartIcon.png",
      iconBg: "#07F468",
      from: "@Mangoes4eva",
      fromAvatar: "/images/fromAvatar.png",
      status: "New",
      date: "20 Sep 2024",
      total: "USD$ 9.99",
    },
    {
      id: 9,
      type: "Merch",
      orderNum: "#6565",
      icon: "/images/cartIcon.png",
      iconBg: "#07F468",
      from: "@Mangoes4eva",
      fromAvatar: "/images/fromAvatar.png",
      status: "New",
      date: "20 Sep 2024",
      total: "USD$ 9.99",
    },
    {
      id: 10,
      type: "Merch",
      orderNum: "#6565",
      icon: "/images/cartIcon.png",
      iconBg: "#07F468",
      from: "@Mangoes4eva",
      fromAvatar: "/images/fromAvatar.png",
      status: "New",
      date: "20 Sep 2024",
      total: "USD$ 9.99",
    },
  ],
  loading: false,
  hasMore: false,
});

// STATUS CONFIGURATION
const statusConfig = {
  // Option 1: Default icon agar map mein na mile
  defaultIcon: "https://i.ibb.co.com/cSnyRK5k/stars.webp",

  // Option 2: Specific styles per status
  styles: {
    New: {
      iconSrc: "https://i.ibb.co.com/cSnyRK5k/stars.webp", // Specific icon
      iconBg: "bg-[#FFE500] p-1", // Icon ka background
      textClass: "text-[#FFE500] px-[6px] py-[4px] bg-[#000000]", // Text ka style + Text ka background
    },
    Shipped: {
      iconSrc: "https://cdn-icons-png.flaticon.com/512/751/751663.png",
      iconBg: "bg-blue-100",
      textClass: "text-blue-600 bg-blue-50",
    },
    Pending: {
      // IconSrc nahi diya, toh defaultIcon use hoga
      iconBg: "bg-yellow-100",
      textClass: "text-yellow-600 bg-yellow-50",
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
    // "default" ka matlab hai 0px se start karo (yani Mobile XS se)
    default: 'right', 
    
    // "lg" ka matlab hai Large screen se change kar do
    md: 'left' 
  },
},
];

const theme = {
  container: "relative overflow-hidden",
  header: "border-b border-zinc-200 dark:border-background-dark-app bg-[#F9FAFBE5] dark:bg-background-dark-cardBackground",
  headerRow: "flex items-center ",
  headerCell: "px-3 py-3 text-xs font-[400] text-[#667085] tracking-wider dark:text-text",
  row: "flex items-center border-b border-zinc-100 dark:border-background-dark-app odd:bg-[#ebe3eb] dark:odd:bg-background-dark-cardBackground even:bg-[#efebf2] dark:even:bg-background-dark-cardBackground transition-colors cursor-pointer last:border-0",
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
</script>

<template>
  <div class="">
    <FlexTable
      :columns="columns"
      :rows="state.rows"
      row-key="id"
      :theme="theme"
      :inner-scroll="true"
      desktop-breakpoint="md"
      @load-more="loadMore"
      max-height="30rem"
      :sticky-header="true"
    />
  </div>
</template>
