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
        <h1 class="text-lg font-semibold text-white">{{ t("fan_booking_loading_popup") }}</h1>
        <p class="mt-2 text-sm text-white/70">
          {{ t("fan_booking_waiting_parent_context") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted } from "vue";
import OneOnOneBookingFlowFeature from "@/components/FanBookingFlow/OneOnOneBookingFlow/OneOnOneBookingFlowFeature.vue";
import {
  applyOneOnOneBookingAuthUpdate,
  applyOneOnOneBookingBootstrap,
  readOneOnOneBookingBootstrapFromUrl,
  useOneOnOneBookingBootstrap,
} from "@/embeds/fanBooking/bootstrap.js";
import {
  announceOneOnOneBookingReady,
  installOneOnOneBookingAuthUpdateListener,
  installOneOnOneBookingBootstrapListener,
  isEmbeddedIframe,
  notifyOneOnOneBookingCreated,
  notifyOneOnOneBookingFailed,
  requestOneOnOneBookingClose,
} from "@/embeds/fanBooking/bridge.js";
import { logFanBookingDebug, markFanBookingDebugEnabled } from "@/embeds/fanBooking/debug.js";
import { provideBookingTranslations } from "@/i18n/bookingTranslations.js";

const bootstrap = useOneOnOneBookingBootstrap();
const { t } = provideBookingTranslations(bootstrap);

let removeBootstrapListener = () => {};
let removeAuthUpdateListener = () => {};

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
  removeAuthUpdateListener = installOneOnOneBookingAuthUpdateListener((payload) => {
    applyOneOnOneBookingAuthUpdate(payload);
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
  removeAuthUpdateListener();
});
</script>
