<!-- FILE: src/pages/Demo5MobileVerticalScroll.vue -->
<script setup>
/* eslint-disable no-console */
import { reactive } from 'vue'
import FlexTable from '../FlexTable.vue'

/* helpers */
const money = () => `$${(Math.random()*200+9).toFixed(2)}`
const baseRows = (n,start=1)=>Array.from({length:n},(_,i)=>({
  id:start+i,
  order:`MV${(start+i).toString().padStart(4,'0')}`,
  customer:['Jane Doe','Sam Lee','Morgan Yu','Kim Park','A. Valdez','C. Torres','P. Singh','L. Chan','R. Patel','Z. Novak'][i%10],
  total: money()
}))

/* state */
const state = reactive({
  rows: baseRows(14),
  loading: false,
  hasMore: true,
  cursor: 15
})

/* columns */
const columns = [
  { key:'order',    label:'Order #',  basis:'basis-1/5' },
  { key:'customer', label:'Customer', basis:'basis-3/5', grow:true },
  { key:'total',    label:'Total',    basis:'basis-1/5', align:'right' },
  { key:'actions',  label:'',         basis:'basis-1/6', align:'center' }
]
  
/* themes */
const themeDesktopCompressed = {
  container:'relative bg-white border border-zinc-200 rounded-lg shadow-sm',
  header:'bg-zinc-50 text-zinc-700',
  headerRow:'flex items-center',
  headerCell:'px-3 sm:px-4 py-2 text-xs font-semibold uppercase tracking-wide',
  row:'flex items-center odd:bg-white even:bg-zinc-50 hover:bg-zinc-100',
  cell:'px-2 sm:px-4 py-2 text-sm text-zinc-800',
  footer:'p-3 text-center'
}
const themeMobile = {
  container:'relative bg-white border border-zinc-200 rounded-lg shadow-sm',
  card:'rounded-lg border border-zinc-200 p-4 space-y-2 bg-white',
  cardRow:'flex items-start justify-between gap-3',
  cardLabel:'text-xs text-zinc-500',
  cardValue:'text-sm text-zinc-900',
  footer:'p-3 text-center'
}

/* use MOBILE inner scroller */
const threshold = '100px'
const mobileHeight = '65vh'

function onLoadMore(){
  if (state.loading || !state.hasMore) return
  console.log('[Demo5] load-more (mobile vertical inner scroll — reveal)', { cursor: state.cursor, threshold })
  state.loading = true
  setTimeout(()=>{
    const add = baseRows(6, state.cursor)
    state.rows = state.rows.concat(add)
    state.cursor += 6
    if (state.rows.length > 60) state.hasMore = false
    state.loading = false
    console.log('[Demo5] appended', { totalRows: state.rows.length, hasMore: state.hasMore })
  }, 250)
}

function onRowClick(row){ alert(`Row click (Demo5): ${row.order}`) }
</script>

<template>
  <main class="max-w-[1100px] mx-auto p-6 space-y-4">
    <router-link class="text-sm underline text-blue-700" to="/">← back</router-link>
    <h2 class="text-xl font-semibold">5) Mobile stacked — vertical inner scroller, reveal button near bottom</h2>
    <p class="text-sm text-zinc-600">
      Below <code>md</code>, the stacked cards get their own vertical scroller (<code>{{ mobileHeight }}</code>).
      When within <code>{{ threshold }}</code> of the bottom, the footer reveals a “Load more” button.
    </p>

    <FlexTable
      :columns="columns"
      :rows="state.rows"
      row-key="id"
      :theme="themeDesktopCompressed"
      :theme-mobile="themeMobile"
      :inner-scroll="false"               
      :sticky-header="false"
      :show-mobile="true"
      :mobile-inner-scroll="true"         
      :mobile-max-height="mobileHeight"
      :infinite="false"
      :reveal-button-on-threshold="true"  
      :always-show-load-more="false"
      :has-more="state.hasMore"
      :loading="state.loading"
      :threshold="threshold"
      :use-scroll-events="true"
      @load-more="onLoadMore"
      @row-click="onRowClick"
    >
      <!-- mobile-only: combine order + total on the first line -->
      <template #cellMobile.order="{ row }">
        <div class="font-semibold">
          {{ row.order }} — <span class="font-normal">{{ row.total }}</span>
        </div>
      </template>

      <!-- mobile action button -->
      <template #cellMobile.actions="{ row }">
        <button
          class="inline-flex items-center rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50"
          @click.stop.prevent="alert('Mobile action — '+row.order)">
          Action
        </button>
      </template>
    </FlexTable>
  </main>
</template>