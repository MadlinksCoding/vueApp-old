<script setup>
/* eslint-disable no-console */
import { reactive } from 'vue'
import FlexTable from '../FlexTable.vue'

/* data helpers */
const money = () => `$${(Math.random()*200+9).toFixed(2)}`
const baseRows = (n,start=1)=>Array.from({length:n},(_,i)=>({
  id:start+i,
  order:`W${(start+i).toString().padStart(4,'0')}`,
  customer:['Jane Doe','Sam Lee','Morgan Yu','Kim Park','A. Valdez','C. Torres','P. Singh','L. Chan','R. Patel','Z. Novak'][i%10],
  total: money()
}))

/* state */
const state = reactive({
  rows: baseRows(18),   // a bit taller so you can scroll
  loading: false,
  hasMore: true,
  cursor: 19
})

/* columns */
const columns = [
  { key:'order',    label:'Order #',  basis:'basis-1/5' },
  { key:'customer', label:'Customer', basis:'basis-3/5', grow:true },
  { key:'total',    label:'Total',    basis:'basis-1/5', align:'right' }
]

/* theme — footer hidden so no button shows (auto-load only) */
const themeHiddenFooter = {
  container:'relative bg-white border border-zinc-200 rounded-lg shadow-sm',
  header:'bg-zinc-50 text-zinc-700',
  headerRow:'flex items-center',
  headerCell:'px-4 py-2 text-xs font-semibold uppercase tracking-wide',
  row:'flex items-center odd:bg-white even:bg-zinc-50 hover:bg-zinc-100',
  cell:'px-4 py-2 text-sm text-zinc-800',
  footer:'hidden'  /* ← hide footer/button area */
}

/* threshold: “X offset from bottom of the table” */
const threshold = '120px' // try '10vh', '8vw', '5rem', 80, etc.

/* load more */
function onLoadMore() {
  if (state.loading || !state.hasMore) return
  console.log('[Demo4] load-more requested (auto, window-relative)', { cursor: state.cursor, threshold })
  state.loading = true
  setTimeout(() => {
    const add = baseRows(10, state.cursor)
    state.rows = state.rows.concat(add)
    state.cursor += 10
    if (state.rows.length > 120) state.hasMore = false
    state.loading = false
    console.log('[Demo4] appended', { totalRows: state.rows.length, hasMore: state.hasMore })
  }, 250)
}
</script>

<template>
  <main class="max-w-[1100px] mx-auto p-6 space-y-4">
    <router-link class="text-sm underline text-blue-700" to="/">← back</router-link>
    <h2 class="text-xl font-semibold">4) Window — auto infinite when table is within {{ threshold }} of viewport bottom</h2>
    <p class="text-sm text-zinc-600">
      No inner scroller. No sticky header. As the table’s <em>bottom</em> approaches the viewport bottom within
      <code>{{ threshold }}</code>, it auto-loads more (using your <code>ScrollEvents</code> + element-relative distance).
    </p>

    <FlexTable
      :columns="columns"
      :rows="state.rows"
      row-key="id"
      :theme="themeHiddenFooter"
      :inner-scroll="false"                 
      :sticky-header="false"                
      :infinite="true"                      
      :reveal-button-on-threshold="false"   
      :always-show-load-more="false"
      :has-more="state.hasMore"
      :loading="state.loading"
      :threshold="threshold"
      :use-scroll-events="false"             
      @load-more="onLoadMore"
    />

    <section class="grid md:grid-cols-2 gap-4">
      <div>
        <div class="text-xs text-zinc-500 mb-1">Config</div>
        <textarea class="w-full min-h-[130px] border rounded p-2 bg-zinc-50" readonly>
{
  "innerScroll": false,
  "stickyHeader": false,
  "infinite": true,
  "threshold": "{{threshold}}",
  "footer": "hidden",
  "windowElementRelative": "tableRect.bottom - viewportHeight <= thresholdPx"
}
        </textarea>
      </div>
      <div>
        <div class="text-xs text-zinc-500 mb-1">Rows (current)</div>
        <textarea class="w-full min-h-[130px] border rounded p-2 bg-zinc-50" readonly>{{ JSON.stringify(state.rows, null, 2) }}</textarea>
      </div>
    </section>
  </main>
</template>
