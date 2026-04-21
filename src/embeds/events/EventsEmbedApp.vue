<template>
  <div
    ref="rootRef"
    :class="[
      useViewportHeight ? 'h-screen overflow-hidden' : 'min-h-screen',
      ' text-slate-900'
    ]"
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
const useViewportHeight = computed(() => {
  return bootstrap.bootstrapped && String(route.name || "").startsWith("events-embed-");
});

let removeBootstrapListener = () => {};
let resizeObserver = null;

const sendHeight = () => {
  if (useViewportHeight.value) {
    notifyEventsEmbedResize(window.innerHeight || 0, { mode: "viewport" });
    return;
  }

  const bodyHeight = document.body?.scrollHeight || 0;
  const documentHeight = document.documentElement?.scrollHeight || 0;
  const rootHeight = rootRef.value?.scrollHeight || 0;
  const height = Math.max(bodyHeight, documentHeight, rootHeight, window.innerHeight || 0);
  notifyEventsEmbedResize(height);
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
  window.removeEventListener("load", sendHeight);
  window.removeEventListener("resize", sendHeight);
});
</script>
