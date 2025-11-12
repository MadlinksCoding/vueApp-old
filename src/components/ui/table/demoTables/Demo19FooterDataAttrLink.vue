<script setup>
/* eslint-disable no-console */
import { reactive } from 'vue'
import FlexTable from '../FlexTable.vue'

const rows=(n,s=1)=>Array.from({length:n},(_,i)=>({ id:s+i, order:`LNK${String(s+i).padStart(4,'0')}`, customer:['Jane','Sam','Morgan','Kim','Valdez'][i%5], total:`$${(Math.random()*200+9).toFixed(2)}` }))
const state = reactive({ rows: rows(10), loading:false, hasMore:true, cursor:11 })
const columns = [
  { key:'order', label:'Order #', basis:'basis-1/5' },
  { key:'customer', label:'Customer', basis:'basis-3/5', grow:true },
  { key:'total', label:'Total', basis:'basis-1/5', align:'right' }
]
const theme = { container:'relative bg-white border border-zinc-200 rounded-lg shadow-sm', header:'bg-zinc-50 text-zinc-700', headerRow:'flex items-center', headerCell:'px-4 py-2 text-xs font-semibold uppercase tracking-wide', row:'flex items-center odd:bg-white even:bg-zinc-50 hover:bg-zinc-100', cell:'px-4 py-2 text-sm text-zinc-800', footer:'p-3 text-center' }

function append(){
  if (state.loading || !state.hasMore) return
  console.log('[Demo19] external link load-more')
  state.loading = true
  setTimeout(()=>{
    state.rows = state.rows.concat(rows(5, state.cursor))
    state.cursor += 5
    if (state.rows.length > 40) state.hasMore = false
    state.loading = false
  }, 250)
}
</script>

<template>
  <main class="max-w-[1100px] mx-auto p-6 space-y-4">
    <router-link class="text-sm underline text-blue-700" to="/">← back</router-link>
    <h2 class="text-xl font-semibold">19) Data-attribute link to Load more (outside footer)</h2>
    <p class="text-xs text-zinc-600">Footer button is disabled; use the external link with <code>data-load-more</code>.</p>

    <FlexTable
  :columns="columns" 
  :rows="state.rows" 
  row-key="id" 
  :theme="theme"
  :inner-scroll="false" 
  :sticky-header="false"
  :always-show-load-more="false"
  :has-more="state.hasMore" 
  :loading="state.loading" 
  :use-scroll-events="true"
/>
    <!-- external link using a data attribute -->
    <div class="mt-3">
      <a href="#"
         data-load-more
         class="text-blue-700 underline"
         @click.prevent="append">
        Load more (external link with data attribute)
      </a>
    </div>
  </main>
</template>