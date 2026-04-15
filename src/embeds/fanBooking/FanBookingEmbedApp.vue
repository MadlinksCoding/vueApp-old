<template>
  <div class="h-screen overflow-hidden text-white">
    <div v-if="bootstrap.bootstrapped" class="h-full overflow-hidden">
      <OneOnOneBookingFlowFeature
        :creator-id="bootstrap.creatorId"
        :fan-id="bootstrap.fanId"
        :event-id="bootstrap.eventId"
        :api-base-url="bootstrap.apiBaseUrl"
        :creator-data="bootstrap.creatorData"
        embedded
        @close-request="handleCloseRequest"
        @booking-created="handleBookingCreated"
        @booking-failed="handleBookingFailed"
      />
    </div>

    <div v-else class="flex h-full items-center justify-center p-6 text-center">
      <div>
        <h1 class="text-lg font-semibold text-white">Loading booking popup</h1>
        <p class="mt-2 text-sm text-white/70">
          Waiting for the parent page to provide creator and fan context.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted } from "vue";
import OneOnOneBookingFlowFeature from "@/components/FanBookingFlow/OneOnOneBookingFlow/OneOnOneBookingFlowFeature.vue";
import {
  applyOneOnOneBookingBootstrap,
  readOneOnOneBookingBootstrapFromUrl,
  useOneOnOneBookingBootstrap,
} from "@/embeds/fanBooking/bootstrap.js";
import {
  announceOneOnOneBookingReady,
  installOneOnOneBookingBootstrapListener,
  isEmbeddedIframe,
  notifyOneOnOneBookingCreated,
  notifyOneOnOneBookingFailed,
  requestOneOnOneBookingClose,
} from "@/embeds/fanBooking/bridge.js";
import { logFanBookingDebug, markFanBookingDebugEnabled } from "@/embeds/fanBooking/debug.js";

const bootstrap = useOneOnOneBookingBootstrap();

let removeBootstrapListener = () => {};

function handleCloseRequest() {
  logFanBookingDebug("app", "close-request");
  if (isEmbeddedIframe()) {
    requestOneOnOneBookingClose();
  }
}

function handleBookingCreated(payload) {
  logFanBookingDebug("app", "booking-created", payload || {});
  notifyOneOnOneBookingCreated(payload || {});
}

function handleBookingFailed(payload) {
  logFanBookingDebug("app", "booking-failed", payload || {});
  notifyOneOnOneBookingFailed(payload || {});
}

onMounted(() => {
  const search = typeof window !== "undefined" ? window.location.search : "";
  if (search.includes("debugFanBooking=1") || search.includes("debugBooking=1") || search.includes("debug=1")) {
    markFanBookingDebugEnabled("query");
  }

  logFanBookingDebug("app", "mounted", {
    isEmbeddedIframe: isEmbeddedIframe(),
    location: typeof window !== "undefined" ? window.location.href : "",
  });

  removeBootstrapListener = installOneOnOneBookingBootstrapListener((payload) => {
    applyOneOnOneBookingBootstrap(payload);
  });

  const fallbackBootstrap = readOneOnOneBookingBootstrapFromUrl();
  if (fallbackBootstrap) {
    applyOneOnOneBookingBootstrap(fallbackBootstrap);
  }

  if (isEmbeddedIframe()) {
    logFanBookingDebug("app", "announce-ready");
    announceOneOnOneBookingReady();
  }
});

onBeforeUnmount(() => {
  logFanBookingDebug("app", "before-unmount");
  removeBootstrapListener();
});
</script>
