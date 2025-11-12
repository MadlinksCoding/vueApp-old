<!-- FILE: src/pages/Demo11LastColRight.vue -->
<script setup>
/* eslint-disable no-console */
import { reactive } from 'vue'
import FlexTable from '../FlexTable.vue'

/* helpers */
const money = () => `$${(Math.random()*200+9).toFixed(2)}`
const baseRows = (n,start=1)=>Array.from({length:n},(_,i)=>({
  id:start+i,
  order:`LR${(start+i).toString().padStart(4,'0')}`,
  customer:['Jane Doe','Sam Lee','Morgan Yu','Kim Park','A. Valdez','C. Torres','P. Singh','L. Chan','R. Patel','Z. Novak'][i%10],
  total: money()
}))

/* state */
const state = reactive({ rows: baseRows(10), loading:false, hasMore:true, cursor:11 })

/* columns: last column RIGHT, others LEFT (alignDefault='left') */
const columns = [
  { key:'order',    label:'Order #',  basis:'basis-1/5' },                // left by default
  { key:'customer', label:'Customer', basis:'basis-3/5', grow:true },     // left by default
  { key:'total',    label:'Total',    basis:'basis-1/5', align:'right' }  // override → right
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

function onLoadMore(){
  if (state.loading || !state.hasMore) return
  console.log('[Demo11] load-more (last col right)')
  state.loading = true
  setTimeout(()=>{
    state.rows = state.rows.concat(baseRows(6, state.cursor))
    state.cursor += 6
    if (state.rows.length > 40) state.hasMore = false
    state.loading = false
    console.log('[Demo11] appended', { totalRows: state.rows.length, hasMore: state.hasMore })
  }, 250)
}
</script>

<template>
  <main class="max-w-[1100px] mx-auto p-6 space-y-4">
    <router-link class="text-sm underline text-blue-700" to="/">← back</router-link>
    <h2 class="text-xl font-semibold">11) Per-column alignment — only the last column is RIGHT</h2>
    <p class="text-sm text-zinc-600">
      <code>alignDefault="left"</code> keeps headers and cells left aligned, while the <em>total</em> column sets <code>align: 'right'</code>.
    </p>

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
      :align-default="'left'"
      :use-scroll-events="true"
      @load-more="onLoadMore"
    />
  </main>
</template>