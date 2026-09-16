<template>
  <main
    ref="root"
    class="booking-notices-embed"
    :class="isMobile ? 'booking-notices-embed--mobile' : 'booking-notices-embed--desktop'"
    :data-position="position"
    :style="{ '--fs-booking-notices-max-height': `${hostViewportHeight}px` }"
  >
    <EventNotificationGallery v-if="galleryMode" />
    <EventNotificationStack
      v-else
      :notices="notices"
      :config="config"
      :position="position"
      :viewport-mode="isMobile ? 'mobile' : 'desktop'"
      @close="sendAction('FS_BOOKING_NOTICE_CLOSE', $event)"
      @primary-action="sendAction('FS_BOOKING_NOTICE_PRIMARY_ACTION', $event)"
      @detail="sendAction('FS_BOOKING_NOTICE_DETAIL', $event)"
      @join="sendAction('FS_BOOKING_NOTICE_JOIN', $event)"
      @summary-visibility="sendSummaryVisibility"
    />
  </main>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import EventNotificationGallery from "@/components/ui/card/event/EventNotificationGallery.vue";
import EventNotificationStack from "@/components/ui/card/event/EventNotificationStack.vue";

const root = ref(null);
const notices = ref([]);
const config = ref({});
const position = ref("top-right");
const isMobile = ref(false);
const hostViewportHeight = ref(640);
const galleryMode = new URLSearchParams(window.location.search).get("gallery") === "1";
let parentOrigin = window.location.origin;
let resizeObserver;

function post(type, payload = {}) {
  window.parent.postMessage({ type, payload }, parentOrigin);
}

function reportSize() {
  nextTick(() => {
    const rect = root.value?.getBoundingClientRect();
    const visibleNoticeCount = root.value?.querySelectorAll(".booking-notice-card").length || 0;
    post("FS_BOOKING_NOTICES_RESIZE", {
      position: position.value,
      width: visibleNoticeCount > 0 ? Math.ceil(rect?.width || 0) : 0,
      height: visibleNoticeCount > 0 ? Math.ceil(rect?.height || 0) : 0,
      hasVisibleNotices: visibleNoticeCount > 0,
      visibleNoticeCount,
    });
  });
}

function applyPayload(payload = {}) {
  notices.value = Array.isArray(payload.notices) ? payload.notices : notices.value;
  config.value = payload.config && typeof payload.config === "object" ? payload.config : config.value;
  position.value = typeof payload.position === "string" ? payload.position : position.value;
  if (typeof payload.isMobile === "boolean") isMobile.value = payload.isMobile;
  if (Number.isFinite(Number(payload.viewportHeight)) && Number(payload.viewportHeight) > 0) {
    hostViewportHeight.value = Number(payload.viewportHeight);
  }
  reportSize();
}

function sendAction(type, payload) {
  let plainPayload = {};
  try {
    plainPayload = JSON.parse(JSON.stringify(payload || {}));
  } catch (_error) {
    plainPayload = { noticeId: payload?.noticeId || "" };
  }
  post(type, { ...plainPayload, position: position.value });
  reportSize();
}

function sendSummaryVisibility(payload) {
  post("FS_BOOKING_NOTICES_SUMMARY_VISIBILITY", payload);
}

function onMessage(event) {
  if (event.source !== window.parent || event.origin !== parentOrigin || !event.data) return;
  if (event.data.type === "FS_BOOKING_NOTICES_BOOTSTRAP" || event.data.type === "FS_BOOKING_NOTICES_UPDATE") {
    applyPayload(event.data.payload);
  }
}

onMounted(() => {
  document.body.classList.toggle("booking-notices-gallery-mode", galleryMode);
  window.addEventListener("message", onMessage);
  if (window.ResizeObserver) {
    resizeObserver = new ResizeObserver(reportSize);
    resizeObserver.observe(root.value);
  }
  post("FS_BOOKING_NOTICES_CHILD_READY", { gallery: galleryMode });
  reportSize();
});

onBeforeUnmount(() => {
  document.body.classList.remove("booking-notices-gallery-mode");
  window.removeEventListener("message", onMessage);
  resizeObserver?.disconnect();
});
</script>

<style>
html, body, #booking-notices-app { margin: 0; width: max-content; min-width: 0; background: transparent; }
body { overflow: hidden; font-family: Poppins, sans-serif; }
body.booking-notices-gallery-mode { overflow: auto; }
.booking-notices-embed { width: min(25.5rem, 100vw); overflow: visible; }
@media (max-width: 639px) {
  html, body, #booking-notices-app, .booking-notices-embed { width: 100vw; }
}
</style>
