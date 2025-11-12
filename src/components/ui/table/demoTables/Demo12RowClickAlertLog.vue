<!-- FILE: src/pages/Demo12RowClickAlertLog.vue
Goal:
- When a row is clicked, show an alert AND console.log the full row payload.
- Demonstrates .stop on inner action button so it takes precedence (row click won't fire).
-->

<script setup>
/* eslint-disable no-console */
import { reactive } from 'vue'
import FlexTable from '../FlexTable.vue'

const rand = (min,max)=>Math.random()*(max-min)+min
const baseRows=(n,start=1)=>Array.from({length:n},(_,i)=>({
  id:start+i,
  order:`CLK${(start+i).toString().padStart(4,'0')}`,
  customer:['Jane Doe','Sam Lee','Morgan Yu','Kim Park','A. Valdez','C. Torres','P. Singh','L. Chan','R. Patel','Z. Novak'][i%10],
  total:`$${rand(9,220).toFixed(2)}`
}))

const state = reactive({
  rows: baseRows(12),
  loading: false,
  hasMore: true,
  cursor: 13
})

const columns = [
  { key:'order',    label:'Order #',  basis:'basis-1/5' },
  { key:'customer', label:'Customer', basis:'basis-3/5', grow:true },
  { key:'total',    label:'Total',    basis:'basis-1/5', align:'right' },
  { key:'actions',  label:'',         basis:'basis-1/5', align:'center' }
]

const theme = {
  container:'relative bg-white border border-zinc-200 rounded-lg shadow-sm',
  header:'bg-zinc-50 text-zinc-700',
  headerRow:'flex items-center',
  headerCell:'px-4 py-2 text-xs font-semibold uppercase tracking-wide',
  row:'flex items-center odd:bg-white even:bg-zinc-50 hover:bg-zinc-100 cursor-pointer',
  cell:'px-4 py-2 text-sm text-zinc-800',
  footer:'p-3 text-center'
}

function onLoadMore(){
  if(state.loading || !state.hasMore) return
  console.log('[Demo12] load-more requested')
  state.loading = true
  setTimeout(()=>{
    const add = baseRows(6, state.cursor)
    state.rows = state.rows.concat(add)
    state.cursor += 6
    if (state.rows.length > 48) state.hasMore = false
    state.loading = false
    console.log('[Demo12] appended', { total: state.rows.length, hasMore: state.hasMore })
  }, 250)
}

function rowAttrs(row){ return { 'data-row-id': row.id } }

/* Row click handler: alert + console.log full payload */
function handleRowClick(row){
  console.log('[Demo12] row-click payload:', row)
  // compact alert (id, order, customer, total)
  alert(`ROW CLICK:
id: ${row.id}
order: ${row.order}
customer: ${row.customer}
total: ${row.total}`)
}

/* Optional: show that inner action button takes precedence */
function handleInnerAction(row){
  console.log('[Demo12] inner-action clicked (stops row)', row)
  alert(`Inner Action for ${row.order}`)
}
</script>

<template>
  <main class="max-w-[1100px] mx-auto p-6 space-y-4">
    <router-link class="text-sm underline text-blue-700" to="/">← back</router-link>
    <h2 class="text-xl font-semibold">12) Row click — alert + console log</h2>
    <p class="text-sm text-zinc-600">
      Click anywhere on a row to trigger an <em>alert</em> and a <code>console.log</code> of the row data.
      The action button uses <code>.stop</code> so it fires first and prevents the row click.
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
      :use-scroll-events="true"
      :row-attrs="rowAttrs"
      @load-more="onLoadMore"
      @row-click="handleRowClick"
    >
      <template #cell.actions="{ row }">
        <button
          class="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50"
          @click.stop.prevent="handleInnerAction(row)">
          Action
        </button>
      </template>
    </FlexTable>

    <section class="grid md:grid-cols-2 gap-4">
      <div>
        <div class="text-xs text-zinc-500 mb-1">Config</div>
        <textarea class="w-full min-h-[130px] border rounded p-2 bg-zinc-50" readonly>
{
  "innerScroll": false,
  "stickyHeader": false,
  "alwaysShowLoadMore": true,
  "rowClick": "alerts + console.log(row)",
  "innerAction": "uses .stop to prevent row click"
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

