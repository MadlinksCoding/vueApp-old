<script setup>
import { reactive } from 'vue'
import FlexTable from '../FlexTable.vue'

const rows=(n,s=1)=>Array.from({length:n},(_,i)=>({ id:s+i, order:`THM${String(s+i).padStart(4,'0')}`, customer:['Jane','Sam','Morgan','Kim','Valdez'][i%5], total:`$${(Math.random()*200+9).toFixed(2)}` }))
const state = reactive({ rows: rows(12), loading:false, hasMore:true, cursor:13 })
const columns = [
  { key:'order', label:'Order #', basis:'basis-1/5' },
  { key:'customer', label:'Customer', basis:'basis-3/5', grow:true },
  { key:'total', label:'Total', basis:'basis-1/5', align:'right' }
]

/* custom theme: darker header, blue zebra rows */
const theme = {
  container:'relative bg-white border border-blue-200 rounded-lg shadow-sm',
  header:'bg-blue-600 text-white',
  headerRow:'flex items-center',
  headerCell:'px-4 py-2 text-xs font-semibold tracking-wide',
  row:'flex items-center odd:bg-white even:bg-blue-50 hover:bg-blue-100',
  cell:'px-4 py-2 text-sm text-zinc-900',
  footer:'p-3 text-center'
}
</script>

<template>
  <main class="max-w-[1100px] mx-auto p-6 space-y-4">
    <router-link class="text-sm underline text-blue-700" to="/">← back</router-link>
    <h2 class="text-xl font-semibold">18) Theme variants — dark header + blue zebra rows</h2>

    <FlexTable
      :columns="columns" :rows="state.rows" row-key="id" :theme="theme"
      :inner-scroll="false" :sticky-header="false" :always-show-load-more="true"
      :has-more="state.hasMore" :loading="state.loading" :use-scroll-events="true"
    />
  </main>
</template>