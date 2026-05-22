<template>
  <div ref="eventsScrollRoot" class="h-full overflow-y-auto">
    <DashboardEventsFeature
      ref="dashboardFeatureRef"
      :creator-id="bootstrap.creatorId"
      :fan-id="bootstrap.fanId"
      :user-role="bootstrap.userRole"
      :api-base-url="bootstrap.apiBaseUrl"
      :embedded="true"
      @create-event="handleCreateEvent"
      @edit-event="handleEditEvent"
      @open-url="handleOpenUrl"
    />
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import DashboardEventsFeature from "@/features/events/DashboardEventsFeature.vue";
import { useEventsEmbedBootstrap } from "@/embeds/events/bootstrap.js";
import {
  isEmbeddedIframe,
  requestEventsEmbedOpenUrl,
  requestEventsEmbedScrollToTop,
} from "@/embeds/events/bridge.js";

const router = useRouter();
const bootstrap = useEventsEmbedBootstrap();
const eventsScrollRoot = ref(null);
const dashboardFeatureRef = ref(null);

const isMobileViewport = () => typeof window !== "undefined" && window.innerWidth < 1024;

const waitForFrame = () => new Promise((resolve) => {
  if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") {
    resolve();
    return;
  }
  window.requestAnimationFrame(() => resolve());
});

const scrollElementToTop = (element) => {
  if (element?.scrollTo) {
    element.scrollTo({ top: 0, left: 0, behavior: "auto" });
    return;
  }

  if (element) {
    element.scrollTop = 0;
    element.scrollLeft = 0;
  }
};

const resetEventsPageScrollOnMobile = async () => {
  if (!isMobileViewport()) return;

  await nextTick();
  await waitForFrame();

  scrollElementToTop(eventsScrollRoot.value);
  dashboardFeatureRef.value?.resetEmbeddedMobileScrollToTop?.();

  if (typeof window !== "undefined" && window.scrollTo) {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }

  requestEventsEmbedScrollToTop({
    reason: "events-page-mounted",
    behavior: "auto",
  });
};

const handleCreateEvent = ({ type }) => {
  router.push({
    name: "events-embed-create",
    params: {
      type: type === "group" ? "group" : "private",
    },
  });
};

const handleEditEvent = ({ eventId, type }) => {
  router.push({
    name: "events-embed-create",
    params: {
      type: type === "group" ? "group" : "private",
    },
    query: {
      mode: "edit",
      eventId,
    },
  });
};

const handleOpenUrl = ({ url, target = "_self" }) => {
  if (!url) return;

  const sameTabTarget = target === "_top" ? "_top" : "_self";

  if (isEmbeddedIframe()) {
    requestEventsEmbedOpenUrl({ url, target: sameTabTarget });
    return;
  }

  window.location.assign(url);
};

onMounted(() => {
  void resetEventsPageScrollOnMobile();
});
</script>
