<template>
  <div
    ref="rootRef"
    :class="[
      useViewportHeight ? 'overflow-hidden' : 'min-h-screen',
      ' text-slate-900'
    ]"
    :style="useViewportHeight ? viewportRootStyle : undefined"
  >
    <div v-if="bootstrap.bootstrapped" :class="useViewportHeight ? 'h-full overflow-hidden' : 'min-h-screen'">
      <RouterView />
    </div>

    <div v-else class="flex min-h-screen items-center justify-center p-6 text-center">
      <div>
        <h1 class="text-lg font-semibold text-slate-800">{{ t("dashboard_loading_events_embed") }}</h1>
        <p class="mt-2 text-sm text-slate-500">
          {{ t("dashboard_waiting_parent_context") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterView, useRoute, useRouter } from "vue-router";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  announceEventsEmbedReady,
  installEventsEmbedBootstrapListener,
  isEmbeddedIframe,
  notifyEventsEmbedResize,
} from "@/embeds/events/bridge.js";
import {
  applyEventsEmbedBootstrap,
  readEventsEmbedBootstrapFromUrl,
  useEventsEmbedBootstrap,
} from "@/embeds/events/bootstrap.js";
import { routeLocationFromInitialRoute } from "@/embeds/events/router.js";
import { provideBookingTranslations } from "@/i18n/bookingTranslations.js";

const router = useRouter();
const route = useRoute();
const bootstrap = useEventsEmbedBootstrap();
const { t } = provideBookingTranslations(bootstrap);
const rootRef = ref(null);
const viewportHeight = ref(0);
const useViewportHeight = computed(() => {
  return bootstrap.bootstrapped && String(route.name || "").startsWith("events-embed-");
});
const viewportRootStyle = computed(() => ({
  "--fs-events-embed-vh": `${viewportHeight.value || resolveViewportHeight()}px`,
  height: "var(--fs-events-embed-vh)",
}));

let removeBootstrapListener = () => {};
let resizeObserver = null;
let viewportSyncTimers = [];

const resolveViewportHeight = () => {
  if (typeof window === "undefined") return 320;

  const visualHeight = Number(window.visualViewport?.height);
  const fallbackHeight = Number(window.innerHeight);
  const resolvedHeight = Number.isFinite(visualHeight) && visualHeight > 0
    ? visualHeight
    : fallbackHeight;

  return Math.max(320, Math.round(Number.isFinite(resolvedHeight) && resolvedHeight > 0 ? resolvedHeight : 320));
};

const applyViewportHeight = () => {
  const nextHeight = resolveViewportHeight();
  viewportHeight.value = nextHeight;
  rootRef.value?.style?.setProperty("--fs-events-embed-vh", `${nextHeight}px`);
  return nextHeight;
};

const sendHeight = () => {
  if (useViewportHeight.value) {
    notifyEventsEmbedResize(applyViewportHeight(), { mode: "viewport" });
    return;
  }

  const bodyHeight = document.body?.scrollHeight || 0;
  const documentHeight = document.documentElement?.scrollHeight || 0;
  const rootHeight = rootRef.value?.scrollHeight || 0;
  const height = Math.max(bodyHeight, documentHeight, rootHeight, window.innerHeight || 0);
  notifyEventsEmbedResize(height);
};

const scheduleViewportSync = (delays = [0]) => {
  viewportSyncTimers.forEach((timerId) => window.clearTimeout(timerId));
  viewportSyncTimers = [];

  delays.forEach((delay) => {
    const timerId = window.setTimeout(() => {
      sendHeight();
    }, delay);
    viewportSyncTimers.push(timerId);
  });
};

const scheduleKeyboardViewportSync = () => {
  scheduleViewportSync([0, 150, 350, 700]);
};

const applyBootstrapAndRoute = async (payload) => {
  const normalized = applyEventsEmbedBootstrap(payload);
  await router.replace(routeLocationFromInitialRoute(normalized.initialRoute));
  await nextTick();
  sendHeight();
};

onMounted(async () => {
  removeBootstrapListener = installEventsEmbedBootstrapListener((payload) => {
    applyBootstrapAndRoute(payload);
  });

  const fallbackBootstrap = readEventsEmbedBootstrapFromUrl();
  if (fallbackBootstrap) {
    await applyBootstrapAndRoute(fallbackBootstrap);
  }

  if (isEmbeddedIframe()) {
    announceEventsEmbedReady();
  }

  resizeObserver = new ResizeObserver(() => {
    sendHeight();
  });

  if (document.body) resizeObserver.observe(document.body);
  if (document.documentElement) resizeObserver.observe(document.documentElement);

  window.addEventListener("load", sendHeight);
  window.addEventListener("resize", sendHeight);
  window.addEventListener("orientationchange", scheduleKeyboardViewportSync);
  window.addEventListener("focusin", scheduleKeyboardViewportSync);
  window.addEventListener("focusout", scheduleKeyboardViewportSync);
  window.visualViewport?.addEventListener?.("resize", sendHeight);
  window.visualViewport?.addEventListener?.("scroll", scheduleKeyboardViewportSync);
  await nextTick();
  sendHeight();
});

watch(() => route.fullPath, async () => {
  await nextTick();
  sendHeight();
});

onBeforeUnmount(() => {
  removeBootstrapListener();
  resizeObserver?.disconnect();
  viewportSyncTimers.forEach((timerId) => window.clearTimeout(timerId));
  viewportSyncTimers = [];
  window.removeEventListener("load", sendHeight);
  window.removeEventListener("resize", sendHeight);
  window.removeEventListener("orientationchange", scheduleKeyboardViewportSync);
  window.removeEventListener("focusin", scheduleKeyboardViewportSync);
  window.removeEventListener("focusout", scheduleKeyboardViewportSync);
  window.visualViewport?.removeEventListener?.("resize", sendHeight);
  window.visualViewport?.removeEventListener?.("scroll", scheduleKeyboardViewportSync);
});
</script>
