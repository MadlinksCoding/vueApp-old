
<!-- FILE: src/pages/Demo17RowRemoval.vue -->
<script setup>
/* eslint-disable no-console */
import { reactive } from 'vue'
import FlexTable from '../FlexTable.vue'

/* helpers */
const money = () => `$${(Math.random()*200+9).toFixed(2)}`
const baseRow = (id)=>({
  id,
  order:`RM${id.toString().padStart(4,'0')}`,
  customer:['Jane Doe','Sam Lee','Morgan Yu','Kim Park','A. Valdez','C. Torres','P. Singh','L. Chan','R. Patel','Z. Novak'][id%10],
  total: money()
})
const baseRows = (n,start=1)=>Array.from({length:n},(_,i)=>baseRow(start+i))

/* state */
const state = reactive({
  rows: baseRows(10, 1),
  loading: false,
  hasMore: true,
  cursor: 11,
  recentlyRemoved: [] // { row, index }
})

/* columns */
const columns = [
  { key:'order',    label:'Order #',  basis:'basis-1/5' },
  { key:'customer', label:'Customer', basis:'basis-2/5', grow:true },
  { key:'total',    label:'Total',    basis:'basis-1/5', align:'right' },
  { key:'actions',  label:'Actions',  basis:'basis-1/5', align:'center' }
]

const theme = {
  container:'relative bg-white border border-zinc-200 rounded-lg shadow-sm',
  header:'bg-zinc-50 text-zinc-700',
  headerRow:'flex items-center',
  headerCell:'px-4 py-2 text-xs font-semibold uppercase tracking-wide',
  row:'flex items-center odd:bg-white even:bg-zinc-50',
  cell:'px-4 py-2 text-sm text-zinc-800',
  footer:'p-3 text-center'
}

/* actions */
function deleteRow(row){
  const idx = state.rows.findIndex(r => r.id === row.id)
  if (idx === -1) return
  const [removed] = state.rows.splice(idx, 1)
  state.recentlyRemoved.unshift({ row: removed, index: idx })
  console.log('[Demo17] deleted', removed)
}
function restoreLast(){
  const item = state.recentlyRemoved.shift()
  if (!item) return
  const insertAt = Math.min(item.index, state.rows.length)
  state.rows.splice(insertAt, 0, item.row)
  console.log('[Demo17] restored', item.row, 'at index', insertAt)
}
function restoreAt(i){
  const item = state.recentlyRemoved.splice(i, 1)[0]
  if (!item) return
  const insertAt = Math.min(item.index, state.rows.length)
  state.rows.splice(insertAt, 0, item.row)
  console.log('[Demo17] restored', item.row, 'at index', insertAt)
}

/* load more to keep list alive */
function onLoadMore(){
  if (state.loading || !state.hasMore) return
  console.log('[Demo17] load-more')
  state.loading = true
  setTimeout(()=>{
    const add = baseRows(5, state.cursor)
    state.rows = state.rows.concat(add)
    state.cursor += 5
    if (state.rows.length > 50) state.hasMore = false
    state.loading = false
    console.log('[Demo17] appended', { totalRows: state.rows.length, hasMore: state.hasMore })
  }, 250)
}

function onRowClick(row){
  alert(`Row clicked (Demo17): ${row.order}`)
}
</script>

<template>
  <main class="max-w-[1100px] mx-auto p-6 space-y-4">
    <router-link class="text-sm underline text-blue-700" to="/">← back</router-link>
    <h2 class="text-xl font-semibold">17) Row removal + restore (buttons suppress row click)</h2>
    <p class="text-sm text-zinc-600">
      Click <em>Delete</em> to remove a row. Use the restore controls below to put it back. Buttons use
      <code>.stop.prevent</code> so row click does not fire.
    </p>

    <FlexTable
      :columns="columns"
      :rows="state.rows"
      row-key="id"
      :theme="theme"
      :inner-scroll="true"
      max-height="20rem"
      :sticky-header="false"
      :always-show-load-more="true"
      :has-more="state.hasMore"
      :loading="state.loading"
      :use-scroll-events="true"
      @load-more="onLoadMore"
      @row-click="onRowClick"
    >
      <template #cell.actions="{ row }">
        <div class="flex items-center justify-center gap-2">
          <button
            class="rounded border border-red-300 text-red-700 px-2 py-1 text-xs hover:bg-red-50"
            @click.stop.prevent="deleteRow(row)">
            Delete
          </button>
        </div>
      </template>
    </FlexTable>

    <section class="space-y-2">
      <div class="flex items-center justify-between">
        <div class="text-sm font-medium">Recently removed</div>
        <button
          class="rounded border border-emerald-300 text-emerald-700 px-2 py-1 text-xs hover:bg-emerald-50 disabled:opacity-60"
          :disabled="!state.recentlyRemoved.length"
          @click="restoreLast">
          Restore last
        </button>
      </div>

      <div v-if="!state.recentlyRemoved.length" class="text-xs text-zinc-500">Nothing removed yet.</div>
      <ul v-else class="space-y-1">
        <li v-for="(item, i) in state.recentlyRemoved" :key="item.row.id"
            class="text-sm flex items-center justify-between border rounded px-2 py-1">
          <span>id={{ item.row.id }} • {{ item.row.order }} • {{ item.row.customer }}</span>
          <button
            class="rounded border border-emerald-300 text-emerald-700 px-2 py-1 text-xs hover:bg-emerald-50"
            @click="restoreAt(i)">
            Restore
          </button>
        </li>
      </ul>
    </section>
  </main>
</template>