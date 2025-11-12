<!--
FILE: src/pages/Demo6MobileStackBasic.vue

Goal:
- Show the stacked "card" layout on mobile (below md) while hiding the desktop table on small screens.
- No desktop inner-scroll, no sticky header.
- Simple manual "Load more" button always visible (both desktop & mobile footers) just for testing.
- Demonstrates a custom mobile slot (#cellMobile.order) and an action button inside the mobile card
  that takes precedence over the row click via .stop/.prevent.
-->

<script setup>
/* eslint-disable no-console */
import { reactive } from "vue";
import FlexTable from '../FlexTable.vue'

/* sample data */
const money = () => `$${(Math.random() * 200 + 9).toFixed(2)}`;
const baseRows = (n, start = 1) =>
  Array.from({ length: n }, (_, i) => ({
    id: start + i,
    order: `S${(start + i).toString().padStart(4, "0")}`,
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

/* columns (desktop + mobile fallback) */
const columns = [
  { key: "order", label: "Order #", basis: "basis-1/5" },
  { key: "customer", label: "Customer", basis: "basis-3/5", grow: true },
  { key: "total", label: "Total", basis: "basis-1/5", align: "right" },
  { key: "actions", label: "", basis: "basis-1/5", align: "center" },
];

/* THEMES
   - Hide desktop table on small screens: container has "hidden md:block"
   - Keep mobile stacked visible on all small screens
*/
const themeDesktopHiddenOnSmall = {
  container:
    "hidden md:block relative bg-white border border-zinc-200 rounded-lg shadow-sm",
  header: "bg-zinc-50 text-zinc-700",
  headerRow: "flex items-center",
  headerCell: "px-4 py-2 text-xs font-semibold uppercase tracking-wide",
  row: "flex items-center odd:bg-white even:bg-zinc-50 hover:bg-zinc-100",
  cell: "px-4 py-2 text-sm text-zinc-800",
  footer: "p-3 text-center",
};

const themeMobile = {
  container: "relative bg-white border border-zinc-200 rounded-lg shadow-sm md:hidden ",
  card: "rounded-lg border border-zinc-200 p-4 space-y-2 bg-white",
  cardRow: "flex items-start justify-between gap-3",
  cardLabel: "text-xs text-zinc-500",
  cardValue: "text-sm text-zinc-900",
  footer: "p-3 text-center",
};

/* manual append (button always visible) */
function onLoadMore() {
  if (state.loading || !state.hasMore) return;
  console.log("[Demo6] load-more (manual)");
  state.loading = true;
  setTimeout(() => {
    const add = baseRows(5, state.cursor);
    state.rows = state.rows.concat(add);
    state.cursor += 5;
    if (state.rows.length > 40) state.hasMore = false;
    state.loading = false;
    console.log("[Demo6] appended", {
      total: state.rows.length,
      hasMore: state.hasMore,
    });
  }, 250);
}

function rowAttrs(row) {
  return { "data-row-id": row.id };
}
function onRowClick(row) {
  alert(`Row click (Demo6): id=${row.id}, order=${row.order}`);
}
</script>

<template>
  <main class="max-w-[1100px] mx-[0px] md:mx-[60px] p-6 space-y-4">
    <router-link class="text-sm underline text-blue-700" to="/"
      >← back</router-link
    >
    <h2 class="text-xl font-semibold">
      6) Stacked layout on mobile (desktop hidden below md)
    </h2>
    <p class="text-sm text-zinc-600">
      On small screens, the table renders as stacked cards with custom mobile
      slots. Desktop table is hidden below <code>md</code>.
    </p>

    <FlexTable
      :columns="columns"
      :rows="state.rows"
      row-key="id"
      :theme="themeDesktopHiddenOnSmall"
      :theme-mobile="themeMobile"
      :inner-scroll="false"
      :sticky-header="false"
      :show-mobile="true"
      :infinite="false"
      :reveal-button-on-threshold="false"
      :always-show-load-more="true"
      :has-more="state.hasMore"
      :loading="state.loading"
      :threshold="'100px'"
      :use-scroll-events="true"
      :row-attrs="rowAttrs"
      @load-more="onLoadMore"
      @row-click="onRowClick"
    >
      <!-- Desktop actions (only shows ≥ md due to theme) -->
      <template #cell.actions="{ row }">
        <button
          class="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50"
          @click.stop.prevent="
            alert('Desktop action (takes precedence) — row ' + row.id)
          "
        >
          Action
        </button>
      </template>

      <!-- MOBILE custom: merge order + total on first row line -->
      <template #cellMobile.order="{ row }">
        <div class="font-semibold">
          {{ row.order }} — <span class="font-normal">{{ row.total }}</span>
        </div>
      </template>

      <!-- MOBILE custom action button (inside the card) -->
      <template #cellMobile.actions="{ row }">
        <button
          class="inline-flex items-center rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50"
          @click.stop.prevent="
            alert('Mobile card action (takes precedence) — row ' + row.id)
          "
        >
          Action
        </button>
      </template>
    </FlexTable>

    <section class="grid md:grid-cols-2 gap-4">
      <div>
        <div class="text-xs text-zinc-500 mb-1">Config</div>
        <textarea
          class="w-full min-h-[140px] border rounded p-2 bg-zinc-50"
          readonly
        >
        {
          "showMobile": true,
          "desktopHiddenBelow": "md",
          "innerScroll": false,
          "stickyHeader": false,
          "infinite": false,
          "revealButtonOnThreshold": false,
          "alwaysShowLoadMore": true,
          "mobileSlots": ["#cellMobile.order", "#cellMobile.actions"]
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
