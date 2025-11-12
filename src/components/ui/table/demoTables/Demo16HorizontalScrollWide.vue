<script setup>
/* eslint-disable no-console */
import { reactive } from 'vue'
import FlexTable from '../FlexTable.vue'

const rows=(n,s=1)=>Array.from({length:n},(_,i)=>({
  id:s+i, sku:`SKU-${String(1000+s+i)}`, name:`Very long product name ${s+i}`,
  cat:`Cat ${(i%4)+1}`, brand:`Brand ${(i%6)+1}`, stock:(i*7)%90, sold:(i*11)%120,
  price:`$${(Math.random()*900+50).toFixed(2)}`
}))
const state = reactive({ rows: rows(14), loading:false, hasMore:true, cursor:15 })
const columns = [
  { key:'sku',   label:'SKU',    basis:'basis-1/6' },
  { key:'name',  label:'Name',   basis:'basis-2/6', grow:true },
  { key:'cat',   label:'Category', basis:'basis-1/6' },
  { key:'brand', label:'Brand',  basis:'basis-1/6' },
  { key:'stock', label:'In Stock', basis:'basis-1/6', align:'center' },
  { key:'sold',  label:'Sold',   basis:'basis-1/6', align:'center' },
  { key:'price', label:'Price',  basis:'basis-1/6', align:'right' }
]
const theme = { container:'min-w-[1100px] bg-white border border-zinc-200 rounded-lg shadow-sm', header:'bg-zinc-50 text-zinc-700', headerRow:'flex items-center', headerCell:'px-4 py-2 text-xs font-semibold uppercase tracking-wide', row:'flex items-center odd:bg-white even:bg-zinc-50 hover:bg-zinc-100', cell:'px-4 py-2 text-sm text-zinc-800', footer:'p-3 text-center' }
</script>

<template>
  <main class="max-w-[1100px] mx-auto p-6 space-y-4">
    <router-link class="text-sm underline text-blue-700" to="/">← back</router-link>
    <h2 class="text-xl font-semibold">16) Horizontal X-scroll — wide columns in overflow container</h2>

    <!-- horizontal scroller wrapper -->
    <div class="overflow-x-auto">
      <FlexTable
        :columns="columns" :rows="state.rows" row-key="id" :theme="theme"
        :inner-scroll="false" :sticky-header="false" :always-show-load-more="true"
        :has-more="state.hasMore" :loading="state.loading" :use-scroll-events="true"
      />
    </div>
  </main>
</template>