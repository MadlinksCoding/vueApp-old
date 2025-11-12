<!-- FILE: src/pages/Demo13RowClickWithInnerButton.vue
Goal:
- Click ANYWHERE on a row → alert + console.log(row).
- Click the inner button in that row → it SHOULD NOT trigger the row click.
  Instead, the button shows its own alert + console.log(row).
-->

<script setup>
/* eslint-disable no-console */
import { reactive } from "vue";
import FlexTable from '../FlexTable.vue'

/* sample data */
const rand = (min, max) => Math.random() * (max - min) + min;
const baseRows = (n, start = 1) =>
  Array.from({ length: n }, (_, i) => ({
    id: start + i,
    order: `BTN${(start + i).toString().padStart(4, "0")}`,
    customer: [
      "Jane Doe",
      "Sam Lee",
      "Morgan Yu",
      "Kim Park",
      "A. Valdez",
      "C. Torres",
      "P. Singh",
      "L. Chan",
      "R. Patel",
      "Z. Novak",
    ][i % 10],
    total: `$${rand(9, 220).toFixed(2)}`,
  }));

const state = reactive({
  rows: baseRows(10),
  loading: false,
  hasMore: true,
  cursor: 11,
});

/* columns: make a dedicated "actions" column for the inner button */
const columns = [
  { key: "order", label: "Order #", basis: "basis-1/6" },       // ~16.6%
  { key: "customer", label: "Customer", basis: "basis-3/6", grow: true }, // 50%
  { key: "total", label: "Total", basis: "basis-1/6", align: "right" },   // ~16.6%
  { key: "actions", label: "", basis: "basis-1/6", align: "center" },     // ~16.6%
];


const theme = {
  container: "relative bg-white border border-zinc-200 rounded-lg shadow-sm",
  header: "bg-zinc-50 text-zinc-700",
  headerRow: "flex items-center",
  headerCell: "px-4 py-2 text-xs font-semibold uppercase tracking-wide",
  row: "flex items-center odd:bg-white even:bg-zinc-50 hover:bg-zinc-100 cursor-pointer",
  cell: "px-4 py-2 text-sm text-zinc-800",
  footer: "p-3 text-center",
};

/* load more is not the focus here, keep manual for completeness */
function onLoadMore() {
  if (state.loading || !state.hasMore) return;
  console.log("[Demo13] load-more requested");
  state.loading = true;
  setTimeout(() => {
    const add = baseRows(5, state.cursor);
    state.rows = state.rows.concat(add);
    state.cursor += 5;
    if (state.rows.length > 40) state.hasMore = false;
    state.loading = false;
    console.log("[Demo13] appended", {
      total: state.rows.length,
      hasMore: state.hasMore,
    });
  }, 250);
}

/* attrs + handlers */
function rowAttrs(row) {
  return { "data-row-id": row.id };
}

/* ROW click: alert + console log */
function handleRowClick(row) {
  console.log("[Demo13] ROW CLICK payload:", row);
  alert(
    `ROW CLICK\nid: ${row.id}\norder: ${row.order}\ncustomer: ${row.customer}\ntotal: ${row.total}`
  );
}

/* BUTTON click: stop/prevent; alert + console log; DOES NOT trigger row click */
function handleActionClick(row) {
  console.log("[Demo13] BUTTON CLICK payload (row click suppressed):", row);
  alert(`BUTTON CLICK (row suppressed)\norder: ${row.order}`);
}
</script>

<template>
  <main class="max-w-[1100px] mx-auto p-6 space-y-4">
    <router-link class="text-sm underline text-blue-700" to="/"
      >← back</router-link
    >
    <h2 class="text-xl font-semibold">
      13) Row click alert + log; inner button takes precedence (row suppressed)
    </h2>
    <p class="text-sm text-zinc-600">
      Click a row to alert &amp; log the row. Click the <em>Action</em> button
      inside a row and it <strong>won’t</strong> bubble to the row — it alerts
      &amp; logs on its own.
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
      <!-- Inner button that cancels the row click via .stop + .prevent -->
      <template #cell.actions="{ row }">
        <button
          class="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50"
          @click.stop.prevent="handleActionClick(row)"
        >
          Action
        </button>
      </template>
    </FlexTable>

    <!-- dumps -->
    <section class="grid md:grid-cols-2 gap-4">
      <div>
        <div class="text-xs text-zinc-500 mb-1">Config</div>
        <textarea
          class="w-full min-h-[130px] border rounded p-2 bg-zinc-50"
          readonly
        >
{
  "rowClick": "alert + console.log(row)",
  "innerButton": "uses @click.stop.prevent to suppress row click; alert + console.log(row)",
  "alwaysShowLoadMore": true
}
        </textarea>
      </div>
      <div>
        <div class="text-xs text-zinc-500 mb-1">Rows (current)</div>
        <textarea
          class="w-full min-h-[130px] border rounded p-2 bg-zinc-50"
          readonly
          >{{ JSON.stringify(state.rows, null, 2) }}</textarea
        >
      </div>
    </section>
  </main>
</template>
