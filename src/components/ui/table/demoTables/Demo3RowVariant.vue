<script setup>
/* eslint-disable no-console */
import { reactive } from "vue";
import FlexTable from '../FlexTable.vue'

/* sample data */
const money = () => `$${(Math.random() * 200 + 9).toFixed(2)}`;
const baseRows = (n, start = 1) =>
  Array.from({ length: n }, (_, i) => ({
    id: start + i,
    order: `V${(start + i).toString().padStart(4, "0")}`,
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
const state = reactive({
  rows: baseRows(10),
  loading: false,
  hasMore: true,
  cursor: 11,
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

/* choose which row becomes SPECIAL — here: id === 3 */
function variantForRow(row) {
  return row.id === 3 ? "special" : null;
}

/* demo: manual append to show special row stays intact */
function loadMore() {
  if (state.loading || !state.hasMore) return;
  console.log("[Demo3] load-more");
  state.loading = true;
  setTimeout(() => {
  let add = baseRows(4, state.cursor);
  // prevent exceeding 24
  const remaining = 24 - state.rows.length;
  if (remaining <= 0) {
    state.hasMore = false;
    state.loading = false;
    return;
  }
  if (add.length > remaining) {
    add = add.slice(0, remaining);
  }

  state.rows = state.rows.concat(add);
  state.cursor += add.length;
  if (state.rows.length >= 24) state.hasMore = false;
  state.loading = false;
  console.log(
    "[Demo3] appended",
    state.rows.length,
    "hasMore:",
    state.hasMore
  );
}, 250);

}

/* attrs + click */
function rowAttrs(row) {
  return {
    "data-row-id": row.id,
    "data-variant": variantForRow(row) || "default",
  };
}
function onRowClick(row) {
  alert(`Row clicked (Demo3): id=${row.id}, order=${row.order}`);
}

function showSpecialAlert(order) {
  window.alert(`Special-row button clicked (takes precedence) — ${order}`);
}
</script>

<template>
  <main class="max-w-[1100px] mx-auto p-6 space-y-4">
    <router-link class="text-sm underline text-blue-700" to="/"
      >← back</router-link
    >
    <h2 class="text-xl font-semibold">
      3) One row uses a totally different slot (#row.special)
    </h2>
    <p class="text-sm text-zinc-600">
      Row with <code>id===3</code> renders via a custom slot instead of standard
      flex cells.
    </p>

    <FlexTable
      :columns="columns"
      :rows="state.rows"
      row-key="id"
      :theme="theme"
      :inner-scroll="true"
      max-height="16rem"
      :sticky-header="true"
      :infinite="false"
      :always-show-load-more="true"
      :has-more="state.hasMore"
      :loading="state.loading"
      :variant-for-row="variantForRow"
      :row-attrs="rowAttrs"
      @load-more="loadMore"
      @row-click="onRowClick"
    >
      <!-- the special row template -->
      <template #row.special="{ row }">
        <div
          class="w-full rounded-lg ring-1 ring-amber-300 bg-amber-50 px-4 py-3 my-1"
        >
          <div class="flex items-center justify-between">
            <div class="text-amber-900 font-semibold text-sm">
              ⚠ Priority Order — {{ row.order }}
            </div>
            <div class="text-amber-900 font-bold">
              {{ row.total }}
            </div>
          </div>
          <div class="mt-2 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div class="text-xs text-amber-700/80">Customer</div>
              <div class="font-medium">{{ row.customer }}</div>
            </div>
            <div class="text-right">
              <button
                class="inline-flex items-center rounded-md border border-amber-300 bg-white/70 px-2 py-1 text-xs hover:bg-white"
                @click.stop.prevent="showSpecialAlert(row.order)"
              >
                Special Action
              </button>
            </div>
          </div>
        </div>
      </template>
    </FlexTable>

    <!-- dumps for quick inspection -->
    <section class="grid md:grid-cols-2 gap-4">
      <div>
        <div class="text-xs text-zinc-500 mb-1">Config</div>
        <textarea
          class="w-full min-h-[130px] border rounded p-2 bg-zinc-50"
          readonly
        >
{
  "innerScroll": true,
  "stickyHeader": true,
  "variantForRow": "row.id===3 → 'special'",
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
