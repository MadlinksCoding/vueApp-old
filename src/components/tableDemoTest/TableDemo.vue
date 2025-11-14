<template>
  <Demo1WindowReveal />
  <Demo2InnerStickyInfinite />
  <Demo3RowVariant />
  <Demo4WindowInfiniteElementOffset />
  <Demo5MobileVerticalScroll />
  <Demo6MobileStackBasic />
  <Demo7InnerReveal />
  <Demo8AlignLeft />
  <Demo9AlignRight />
  <Demo10AlignCenter />
  <Demo11LastColRight />
  <Demo12RowClickAlertLog />
  <Demo13RowClickWithInnerButton />
  <Demo14RowRightClick />
  <Demo15HiddenAtBreakpoints />
  <Demo16HorizontalScrollWide />
  <Demo17RowRemoval />
  <Demo18ThemeVariants />
  <Demo18ThemeVariants />
  <Demo19FooterDataAttrLink />

  <div class="px-6 mb-6">
    <p class="mb-4 mt-4 text-black text-xl">Dashboard Table</p>

    <OrderTable />

    <!-- page-container with scrollable items -->
    <p class="mb-4 mt-4 text-black">Table with scrollable items:</p>
    <!-- table -->
    <OrderScrollableTable />
  </div>
</template>

<script>
/* Demos (pages) — code not included here per your request */
import Demo4WindowInfiniteElementOffset from "../../components/ui/table/demoTables/Demo4WindowInfiniteElementOffset.vue";
import Demo5MobileVerticalScroll from "../../components/ui/table/demoTables/Demo5MobileVerticalScroll.vue";
import Demo6MobileStackBasic from "../../components/ui/table/demoTables/Demo6MobileStackBasic.vue";
import Demo7InnerReveal from "../../components/ui/table/demoTables/Demo7InnerReveal.vue";
import Demo8AlignLeft from "../../components/ui/table/demoTables/Demo8AlignLeft.vue";
import Demo9AlignRight from "../../components/ui/table/demoTables/Demo9AlignRight.vue";
import Demo10AlignCenter from "../../components/ui/table/demoTables/Demo10AlignCenter.vue";
import Demo11LastColRight from "../../components/ui/table/demoTables/Demo11LastColRight.vue";
import Demo12RowClickAlertLog from "../../components/ui/table/demoTables/Demo12RowClickAlertLog.vue";
import Demo13RowClickWithInnerButton from "../../components/ui/table/demoTables/Demo13RowClickWithInnerButton.vue";
import Demo14RowRightClick from "../../components/ui/table/demoTables/Demo14RowRightClick.vue";
import Demo15HiddenAtBreakpoints from "../../components/ui/table/demoTables/Demo15HiddenAtBreakpoints.vue";
import Demo16HorizontalScrollWide from "../../components/ui/table/demoTables/Demo16HorizontalScrollWide.vue";
import Demo17RowRemoval from "../../components/ui/table/demoTables/Demo17RowRemoval.vue";
import Demo18ThemeVariants from "../../components/ui/table/demoTables/Demo18ThemeVariants.vue";
import Demo19FooterDataAttrLink from "../../components/ui/table/demoTables/Demo19FooterDataAttrLink.vue";
import Demo1WindowReveal from "../../components/ui/table/demoTables/Demo1WindowReveal.vue";
import Demo2InnerStickyInfinite from "../../components/ui/table/demoTables/Demo2InnerStickyInfinite.vue";
import Demo3RowVariant from "../../components/ui/table/demoTables/Demo3RowVariant.vue";
import OrderTable from "../ui/table/dashboard/OrderTable.vue";
import OrderScrollableTable from "../ui/table/dashboard/OrderScrollableTable.vue";

export default {
  name: "TableDemo",
  components: {
    Demo1WindowReveal,
    Demo2InnerStickyInfinite,
    Demo3RowVariant,
    Demo4WindowInfiniteElementOffset,
    Demo5MobileVerticalScroll,
    Demo6MobileStackBasic,
    Demo7InnerReveal,
    Demo8AlignLeft,
    Demo9AlignRight,
    Demo10AlignCenter,
    Demo11LastColRight,
    Demo12RowClickAlertLog,
    Demo13RowClickWithInnerButton,
    Demo14RowRightClick,
    Demo15HiddenAtBreakpoints,
    Demo16HorizontalScrollWide,
    Demo17RowRemoval,
    Demo18ThemeVariants,
    OrderTable,
    OrderScrollableTable,
  },
};
</script>
