<!-- FILE: src/pages/Demo7InnerReveal.vue
Goal:
- Use INNER SCROLL (scrollable table body).
- NO auto-infinite.
- SHOW a "Load more" button ONLY when the inner scroller is within X (threshold) from its bottom.
- Uses YOUR /public/scroll-events-demo.js (FlexTable.vue already wires to it).
-->

<script setup>
/* eslint-disable no-console */
import { reactive } from "vue";
import FlexTable from '../FlexTable.vue'

/* helpers */
const money = () => `$${(Math.random() * 200 + 9).toFixed(2)}`;
const baseRows = (n, start = 1) =>
  Array.from({ length: n }, (_, i) => ({
    id: start + i,
    order: `IR${(start + i).toString().padStart(4, "0")}`,
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
    total: money(),
  }));

/* state */
const state = reactive({
  rows: baseRows(18),
  loading: false,
  hasMore: true,
  cursor: 19,
});

/* columns */
const columns = [
  { key: "order", label: "Order #", basis: "basis-1/5" },
  { key: "customer", label: "Customer", basis: "basis-3/5", grow: true },
  { key: "total", label: "Total", basis: "basis-1/5", align: "right" },
];

/* theme */
const theme = {
  container: "relative bg-white border border-zinc-200 rounded-lg shadow-sm",
  header: "bg-zinc-50 text-zinc-700",
  headerRow: "flex items-center",
  headerCell: "px-4 py-2 text-xs font-semibold uppercase tracking-wide",
  row: "flex items-center odd:bg-white even:bg-zinc-50 hover:bg-zinc-100",
  cell: "px-4 py-2 text-sm text-zinc-800",
  footer: "p-3 text-center",
};

/* THRESHOLD: distance from bottom of INNER scroll container to start showing button */
const threshold = "120px"; // try also '10vh', '5rem', 80, etc.

/* append */
function onLoadMore() {
  if (state.loading || !state.hasMore) return;
  console.log("[Demo7] load-more (inner reveal)", {
    cursor: state.cursor,
    threshold,
  });
  state.loading = true;
  setTimeout(() => {
    const add = baseRows(10, state.cursor);
    state.rows = state.rows.concat(add);
    state.cursor += 10;
    if (state.rows.length > 120) state.hasMore = false;
    state.loading = false;
    console.log("[Demo7] appended", {
      totalRows: state.rows.length,
      hasMore: state.hasMore,
    });
  }, 250);
}

function rowAttrs(row) {
  return { "data-row-id": row.id };
}
function onRowClick(row) {
  alert(`Row click (Demo7): id=${row.id}, order=${row.order}`);
}
</script>

<template>
  <main class="max-w-[1100px] mx-auto p-6 space-y-4">
    <router-link class="text-sm underline text-blue-700" to="/"
      >← back</router-link
    >
    <h2 class="text-xl font-semibold">
      7) Inner scroll — show "Load more" when {{ threshold }} from bottom
      (reveal button mode)
    </h2>
    <p class="text-sm text-zinc-600">
      The table body is scrollable. When the inner scroller is within
      <code>{{ threshold }}</code> of its bottom, the footer reveals a
      <em>Load more</em> button. Uses your <code>ScrollEvents</code> for
      detection (no auto-infinite here).
    </p>

    <!-- inner scroller enabled -->
    <FlexTable
      :columns="columns"
      :rows="state.rows"
      row-key="id"
      :theme="theme"
      :inner-scroll="true"
      max-height="18rem"
      :sticky-header="false"
      :infinite="false"
      :reveal-button-on-threshold="true"
      :always-show-load-more="false"
      :has-more="state.hasMore"
      :loading="state.loading"
      :threshold="threshold"
      :use-scroll-events="true"
      :row-attrs="rowAttrs"
      @load-more="onLoadMore"
      @row-click="onRowClick"
    />

    <!-- dumps -->
    <section class="grid md:grid-cols-2 gap-4">
      <div>
        <div class="text-xs text-zinc-500 mb-1">Config</div>
        <textarea
          class="w-full min-h-[140px] border rounded p-2 bg-zinc-50"
          readonly
        >
{
  "innerScroll": true,
  "maxHeight": "18rem",
  "stickyHeader": false,
  "infinite": false,
  "revealButtonOnThreshold": true,
  "threshold": "{{ threshold }}",
  "useScrollEvents": true
}
        </textarea>
      </div>
      <div>
        <div class="text-xs text-zinc-500 mb-1">Rows (current)</div>
        <textarea
          class="w-full min-h-[140px] border rounded p-2 bg-zinc-50"
          readonly
          >{{ JSON.stringify(state.rows, null, 2) }}</textarea
        >
      </div>
    </section>
  </main>
</template>
