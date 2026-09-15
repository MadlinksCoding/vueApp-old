<template>
  <section class="booking-notice-gallery flex flex-col gap-10" aria-label="Booking notice design gallery">
    <div v-for="example in examples" :key="example.id">
      <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-[#667085]">{{ example.demoLabel }}</p>
      <EventNotificationCard :notice="example" :config="demoConfig" />
    </div>

    <div class="booking-notice-animation-gallery">
      <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-[#667085]">Animation options</p>
      <div v-for="example in animationExamples" :key="example.label" class="booking-notice-animation-example">
        <p class="mb-2 text-xs font-medium text-[#667085]">{{ example.label }}</p>
        <EventNotificationCard :notice="animationNotice" :config="example.config" />
      </div>
    </div>
  </section>
</template>

<script setup>
import EventNotificationCard from "./EventNotificationCard.vue";
import { BOOKING_NOTICE_TYPES } from "./bookingNoticeConfig";

const avatar = "https://i.ibb.co/jkjtwC9C/svgviewer-png-output-17.webp";
const person = { name: "The grape gatsby", avatar };
const booking = (id, overrides = {}) => ({
  id,
  month: "APR",
  day: "25",
  title: "Lantau cows meet up",
  time: "2:15pm – 9:30pm",
  person,
  eventAt: `2026-04-25T${String(12 + Number(id.replace(/\D/g, "") || 0)).padStart(2, "0")}:15:00`,
  occurredAt: "2026-04-20T09:00:00",
  status: "pending",
  ...overrides,
});

const pendingItems = [booking("pending-1"), booking("pending-2", { day: "26" }), booking("pending-3", { day: "27" })];
const readyStart = new Date(Date.now() + 5 * 60_000);
const readyEnd = new Date(readyStart.getTime() + 15 * 60_000);
const formatReadyTime = (value) => value.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
  .toLowerCase()
  .replace(/\s+/g, "");
const readyItem = booking("ready-1", {
  status: "confirmed",
  timeOnly: true,
  eventAt: readyStart.toISOString(),
  time: `${formatReadyTime(readyStart)} – ${formatReadyTime(readyEnd)}`,
});
const eventTodayItem = (id, offsetMinutes) => {
  const start = new Date(Date.now() + offsetMinutes * 60_000);
  const end = new Date(start.getTime() + 15 * 60_000);
  return booking(id, {
    status: "confirmed",
    activityType: BOOKING_NOTICE_TYPES.EVENTS_TODAY,
    month: start.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: String(start.getDate()),
    eventAt: start.toISOString(),
    time: `${formatReadyTime(start)} – ${formatReadyTime(end)}`,
  });
};
const confirmedItems = [eventTodayItem("today-1", 30), eventTodayItem("today-2", 60)];
const confirmedSummaryItem = booking("confirmed-summary-1", { status: "confirmed", activityType: "booking-confirmed" });
const declinedSummaryItem = booking("declined-summary-1", { status: "declined" });
const priceRequestSummaryItem = booking("price-request-summary-1", { status: "pending", activityType: "price-adjustment-sent" });
const priceAcceptedSummaryItem = booking("price-accepted-summary-1", { status: "confirmed", activityType: "price-adjustment-accepted" });
const priceDeclinedSummaryItem = booking("price-declined-summary-1", { status: "declined", activityType: "price-adjustment-declined" });

const examples = [
  {
    id: "demo-single",
    demoLabel: "Single booking request",
    type: BOOKING_NOTICE_TYPES.BOOKING_REQUEST,
    audience: "creator",
    items: [pendingItems[0]],
    action: { id: "review-booking", label: "REVIEW", showArrow: false },
  },
  {
    id: "demo-multiple",
    demoLabel: "Grouped booking requests",
    type: BOOKING_NOTICE_TYPES.BOOKING_REQUEST,
    audience: "creator",
    heading: "You have 5 new pending bookings:",
    items: pendingItems,
    totalCount: 5,
    dismissItemIds: pendingItems.map((item) => item.id),
    action: { id: "review-bookings", label: "REVIEW", showArrow: false },
  },
  {
    id: "demo-summary",
    demoLabel: "Configurable booking activity summary",
    type: BOOKING_NOTICE_TYPES.SUMMARY,
    audience: "creator",
    viewer: { displayName: "Beaver Boy" },
    sections: [
      { type: BOOKING_NOTICE_TYPES.READY_TO_JOIN, label: "Ready to join", items: [readyItem], totalCount: 1 },
      { type: BOOKING_NOTICE_TYPES.EVENTS_TODAY, label: "Events today", items: confirmedItems, totalCount: 2, sort: "soonest-first", priority: "events-today" },
      { type: BOOKING_NOTICE_TYPES.BOOKING_REQUEST, label: "New pending bookings", items: pendingItems, totalCount: 5, sort: "oldest-first" },
      { id: "price-adjustment:request-sent", type: BOOKING_NOTICE_TYPES.PRICE_ADJUSTMENT, variant: "request-sent", label: "Price adjustment requests", items: [priceRequestSummaryItem], totalCount: 1 },
      { id: "price-adjustment:accepted", type: BOOKING_NOTICE_TYPES.PRICE_ADJUSTMENT, variant: "accepted", priority: "status-change", label: "Accepted price adjustments", items: [priceAcceptedSummaryItem], totalCount: 1 },
      { id: "price-adjustment:declined", type: BOOKING_NOTICE_TYPES.PRICE_ADJUSTMENT, variant: "declined", priority: "status-change", label: "Declined price adjustments", items: [priceDeclinedSummaryItem], totalCount: 1 },
      { type: BOOKING_NOTICE_TYPES.BOOKING_DECLINED, label: "Declined booking requests", items: [declinedSummaryItem], totalCount: 1 },
      { type: BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED, priority: "general-information", label: "Confirmed bookings", items: [confirmedSummaryItem], totalCount: 1 },
    ],
    action: { id: "review-summary", label: "REVIEW IN EVENT PAGE", showArrow: true },
  },
  {
    id: "demo-fan-summary-single",
    demoLabel: "Fan activity summary — one item",
    type: BOOKING_NOTICE_TYPES.SUMMARY,
    audience: "fan",
    viewer: { role: "fan", displayName: "Grape Gatsby" },
    sections: [
      { type: BOOKING_NOTICE_TYPES.EVENTS_TODAY, label: "Events today", items: [confirmedItems[0]], totalCount: 1 },
    ],
    action: { id: "review-summary", label: "REVIEW IN EVENT PAGE", showArrow: true },
  },
  {
    id: "demo-fan-summary-multiple",
    demoLabel: "Fan activity summary — multiple items",
    type: BOOKING_NOTICE_TYPES.SUMMARY,
    audience: "fan",
    viewer: { role: "fan", displayName: "Grape Gatsby" },
    sections: [
      { type: BOOKING_NOTICE_TYPES.EVENTS_TODAY, label: "Events today", items: confirmedItems, totalCount: 2 },
    ],
    action: { id: "review-summary", label: "REVIEW IN EVENT PAGE", showArrow: true },
  },
  {
    id: "demo-confirmed",
    demoLabel: "Booking confirmed",
    type: BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED,
    audience: "fan",
    actor: { displayName: "@lantaucows" },
    items: [booking("confirmed-standalone", { status: "confirmed", person: { name: "Cows of Lantau", avatar } })],
    showDetail: true,
  },
  {
    id: "demo-price-adjustment",
    demoLabel: "Price adjustment — accepted",
    type: BOOKING_NOTICE_TYPES.PRICE_ADJUSTMENT,
    audience: "creator",
    priceAdjustmentState: "accepted",
    actor: { displayName: "@grapegatsby" },
    items: [booking("adjustment-1", { status: "confirmed" })],
    showDetail: true,
  },
  {
    id: "demo-price-request",
    demoLabel: "Price adjustment — review required",
    type: BOOKING_NOTICE_TYPES.PRICE_ADJUSTMENT,
    audience: "fan",
    priceAdjustmentState: "request-sent",
    actor: { displayName: "@lantaucows" },
    items: [booking("adjustment-2", { status: "confirmed", person: { name: "Cows of Lantau", avatar } })],
    showDetail: true,
    action: { id: "review-adjustment", label: "REVIEW ADJUSTMENT" },
  },
  {
    id: "demo-price-declined",
    demoLabel: "Price adjustment — declined",
    type: BOOKING_NOTICE_TYPES.PRICE_ADJUSTMENT,
    audience: "creator",
    priceAdjustmentState: "declined",
    actor: { displayName: "@grapegatsby" },
    items: [booking("adjustment-3", { status: "declined" })],
    showDetail: true,
  },
  {
    id: "demo-declined",
    demoLabel: "Booking declined",
    type: BOOKING_NOTICE_TYPES.BOOKING_DECLINED,
    audience: "fan",
    actor: { displayName: "@lantaucows" },
    items: [booking("declined-1", { status: "declined", person: { name: "Cows of Lantau", avatar } })],
    showDetail: true,
  },
  {
    id: "demo-ready",
    demoLabel: "Ready to join",
    type: BOOKING_NOTICE_TYPES.READY_TO_JOIN,
    audience: "both",
    items: [readyItem],
    action: { id: "join-call", label: "JOIN CALL" },
  },
];

const demoConfig = { durationSeconds: 0, attentionAnimation: "pulse", entranceEffect: "fade", summary: { totalLimit: 20 } };
const animationNotice = {
  id: "demo-animation",
  type: BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED,
  audience: "fan",
  actor: { displayName: "@lantaucows" },
  items: [booking("animation-1", { status: "confirmed", person: { name: "Cows of Lantau", avatar } })],
  showDetail: true,
};
const animationExamples = [
  { label: "Pulse (default)", config: { ...demoConfig, attentionAnimation: "pulse" } },
  { label: "Blink", config: { ...demoConfig, attentionAnimation: "blink" } },
  { label: "None", config: { ...demoConfig, attentionAnimation: "none", entranceEffect: "none" } },
];
</script>

<style scoped>
.booking-notice-gallery { box-sizing: border-box; width: min(25.5rem, 100vw); padding: 1.25rem; }
.booking-notice-animation-gallery { display: flex; flex-direction: column; gap: 2.5rem; border-top: 1px solid #eaecf0; padding-top: 2.5rem; }
.booking-notice-animation-example { display: flex; flex-direction: column; }
@media (max-width: 639px) { .booking-notice-gallery { padding: .75rem; } }
</style>
