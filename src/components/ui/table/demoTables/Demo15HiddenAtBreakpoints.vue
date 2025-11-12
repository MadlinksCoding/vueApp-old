<script setup>
/* eslint-disable no-console */
import { reactive } from 'vue'
import FlexTable from '../FlexTable.vue'

const rows=(n,s=1)=>Array.from({length:n},(_,i)=>({ id:s+i, order:`HDN${String(s+i).padStart(4,'0')}`, customer:['Jane','Sam','Morgan','Kim','Valdez'][i%5], email:`user${s+i}@example.com`, phone:`0400 000 ${String(10+i).padStart(2,'0')}`, total:`$${(Math.random()*200+9).toFixed(2)}` }))
const state = reactive({ rows: rows(12), loading:false, hasMore:true, cursor:13 })
/* hiddenAt demo:
   - email hidden below md
   - phone hidden below lg
   - total always visible
*/
const columns = [
  { key:'order', label:'Order #', basis:'basis-1/6' },
  { key:'customer', label:'Customer', basis:'basis-2/6', grow:true },
  { key:'email', label:'Email', basis:'basis-2/6', hiddenAt:['sm','md'] },
  { key:'phone', label:'Phone', basis:'basis-1/6', hiddenAt:['sm','md','lg'] },
  { key:'total', label:'Total', basis:'basis-1/6', align:'right' }
]
const theme = { container:'relative bg-white border border-zinc-200 rounded-lg shadow-sm', header:'bg-zinc-50 text-zinc-700', headerRow:'flex items-center', headerCell:'px-4 py-2 text-xs font-semibold uppercase tracking-wide', row:'flex items-center odd:bg-white even:bg-zinc-50 hover:bg-zinc-100', cell:'px-4 py-2 text-sm text-zinc-800', footer:'p-3 text-center' }
</script>

<template>
  <main class="max-w-[1100px] mx-auto p-6 space-y-4">
    <router-link class="text-sm underline text-blue-700" to="/">← back</router-link>
    <h2 class="text-xl font-semibold">15) HiddenAt breakpoints — hide/show columns per breakpoint</h2>
    <p class="text-xs text-zinc-600">Resize the viewport to see <code>email</code> and <code>phone</code> hide at configured breakpoints.</p>

    <FlexTable
      :columns="columns" :rows="state.rows" row-key="id" :theme="theme"
      :inner-scroll="false" :sticky-header="false" :always-show-load-more="true"
      :has-more="state.hasMore" :loading="state.loading" :use-scroll-events="true"
    />
  </main>
</template>