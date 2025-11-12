<!-- FILE: src/pages/Demo2InnerStickyInfinite.vue -->
<script setup>
/* eslint-disable no-console */
import { reactive } from 'vue'
import FlexTable from '../FlexTable.vue'

/* helpers */
const money = () => `$${(Math.random()*200+9).toFixed(2)}`
const baseRows = (n,start=1)=>Array.from({length:n},(_,i)=>({
  id:start+i,
  order:`IS${(start+i).toString().padStart(4,'0')}`,
  customer:['Jane Doe','Sam Lee','Morgan Yu','Kim Park','A. Valdez','C. Torres','P. Singh','L. Chan','R. Patel','Z. Novak'][i%10],
  total: money()
}))

/* state */
const state = reactive({
  rows: baseRows(22),
  loading: false,
  hasMore: true,
  cursor: 23
})

/* columns */
const columns = [
  { key:'order',    label:'Order #',  basis:'basis-1/5' },
  { key:'customer', label:'Customer', basis:'basis-3/5', grow:true },
  { key:'total',    label:'Total',    basis:'basis-1/5', align:'right' }
]

/* theme */
const theme = {
  container:'relative bg-white border border-zinc-200 rounded-lg shadow-sm',
  header:'bg-zinc-50 text-zinc-700',
  headerRow:'flex items-center',
  headerCell:'px-4 py-2 text-xs font-semibold uppercase tracking-wide',
  row:'flex items-center odd:bg-white even:bg-zinc-50 hover:bg-zinc-100',
  cell:'px-4 py-2 text-sm text-zinc-800',
  footer:'hidden' /* auto-infinite (no manual button) */
}

/* inner threshold in px/vh/etc (fires auto) */
const threshold = '120px'

function onLoadMore(){
  if (state.loading || !state.hasMore) return
  console.log('[Demo2] load-more (inner sticky + infinite)', { cursor: state.cursor, threshold })
  state.loading = true
  setTimeout(()=>{
    const add = baseRows(12, state.cursor)
    state.rows = state.rows.concat(add)
    state.cursor += 12
    if (state.rows.length > 160) state.hasMore = false
    state.loading = false
    console.log('[Demo2] appended', { totalRows: state.rows.length, hasMore: state.hasMore })
  }, 250)
}
</script>

<template>
  <main class="max-w-[1100px] mx-auto p-6 space-y-4">
    <router-link class="text-sm underline text-blue-700" to="/">← back</router-link>
    <h2 class="text-xl font-semibold">2) Inner scroll + sticky header + auto-infinite</h2>
    <p class="text-sm text-zinc-600">
      Scroll inside the table. When the remaining distance is ≤ <code>{{ threshold }}</code>, rows auto-append.
      Header stays sticky at the top of the inner scroller.
    </p>

    <FlexTable
      :columns="columns"
      :rows="state.rows"
      row-key="id"
      :theme="theme"
      :inner-scroll="true"
      max-height="20rem"
      :sticky-header="true"
      :infinite="true"                      
      :reveal-button-on-threshold="false"
      :always-show-load-more="false"
      :has-more="state.hasMore"
      :loading="state.loading"
      :threshold="threshold"
      :use-scroll-events="true"
      @load-more="onLoadMore"
    />
  </main>
</template>