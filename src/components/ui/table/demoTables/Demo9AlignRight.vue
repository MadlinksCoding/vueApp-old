<!-- =====================================================================================
FILE: src/pages/Demo9AlignRight.vue
Goal: All columns RIGHT-aligned (via alignDefault="right"). Manual "Load more" always visible.
====================================================================================== -->
<script setup>
/* eslint-disable no-console */
import { reactive } from 'vue'
import FlexTable from '../FlexTable.vue'

const $ = (min,max)=>Math.random()*(max-min)+min
const rowsOf=(n,start=1)=>Array.from({length:n},(_,i)=>({
  id:start+i,
  order:`R${(start+i).toString().padStart(4,'0')}`,
  customer:['Jane Doe','Sam Lee','Morgan Yu','Kim Park','A. Valdez','C. Torres','P. Singh','L. Chan','R. Patel','Z. Novak'][i%10],
  total:`$${$(9,220).toFixed(2)}`
}))

const state = reactive({ rows: rowsOf(10), loading:false, hasMore:true, cursor:11 })

/* No per-column align; alignDefault will right-align everything (including headers) */
const columns = [
  { key:'order',    label:'Order #',  basis:'basis-1/5' },
  { key:'customer', label:'Customer', basis:'basis-3/5', grow:true },
  { key:'total',    label:'Total',    basis:'basis-1/5' }
]

const theme = {
  container:'relative bg-white border border-zinc-200 rounded-lg shadow-sm',
  header:'bg-zinc-50 text-zinc-700',
  headerRow:'flex items-center',
  headerCell:'px-4 py-2 text-xs font-semibold uppercase tracking-wide',
  row:'flex items-center odd:bg-white even:bg-zinc-50 hover:bg-zinc-100',
  cell:'px-4 py-2 text-sm text-zinc-800',
  footer:'p-3 text-center'
}

function loadMore(){
  if(state.loading||!state.hasMore) return
  console.log('[Demo9] load-more')
  state.loading=true
  setTimeout(()=>{
    state.rows = state.rows.concat(rowsOf(6,state.cursor))
    state.cursor += 6
    if (state.rows.length > 40) state.hasMore=false
    state.loading=false
    console.log('[Demo9] appended', state.rows.length, 'hasMore:', state.hasMore)
  },250)
}
</script>

<template>
  <main class="max-w-[1100px] mx-auto p-6 space-y-4">
    <router-link class="text-sm underline text-blue-700" to="/">← back</router-link>
    <h2 class="text-xl font-semibold">9) Alignment — ALL RIGHT (headers + cells)</h2>

    <FlexTable
      :columns="columns"
      :rows="state.rows"
      row-key="id"
      :theme="theme"
      :inner-scroll="false"
      :sticky-header="false"
      :always-show-load-more="true"
      :has-more="state.hasMore"
      :loading="state.loading"
      :use-scroll-events="true"
      :align-default="'right'"
      @load-more="loadMore"
    />
  </main>
</template>