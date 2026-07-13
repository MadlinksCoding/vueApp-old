<template>
  <div ref="createScrollRoot" class="h-full overflow-y-auto">
    <UnifiedBookingForm
      :key="formKey"
      :type="normalizedType"
      :creator-id="bootstrap.creatorId"
      :api-base-url="bootstrap.apiBaseUrl"
      :creator-data="bootstrap.creatorData"
      :embedded="true"
      :mode="route.query.mode || ''"
      :event-id="route.query.eventId || ''"
      @back="handleBack"
      @created="handleCreated"
      @edit-event="handleEditEvent"
      @open-url="handleOpenUrl"
      @scroll-top-request="handleScrollTopRequest"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import UnifiedBookingForm from "@/components/ui/form/BookingForm/UnifiedBookingForm.vue";
import { useEventsEmbedBootstrap } from "@/embeds/events/bootstrap.js";
import {
  isEmbeddedIframe,
  requestEventsEmbedOpenUrl,
  requestEventsEmbedScrollToTop,
} from "@/embeds/events/bridge.js";

const props = defineProps({
  type: {
    type: String,
    default: "private",
  },
});

const router = useRouter();
const route = useRoute();
const bootstrap = useEventsEmbedBootstrap();
const createScrollRoot = ref(null);

const normalizedType = computed(() => (props.type === "group" ? "group" : "private"));
const formKey = computed(() => [
  normalizedType.value,
  String(route.query.mode || "create"),
  String(route.query.eventId || "new"),
].join(":"));

const isMobileViewport = () => typeof window !== "undefined" && window.innerWidth < 1024;

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

const scrollEmbedToTopOnMobile = async (reason) => {
  if (!isMobileViewport()) return;

  await nextTick();
  scrollElementToTop(createScrollRoot.value);

  if (typeof window !== "undefined" && window.scrollTo) {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }

  requestEventsEmbedScrollToTop({
    reason,
    behavior: "auto",
  });
};

const handleBack = () => {
  router.push({ name: "events-embed-events" });
};

const handleCreated = async () => {
  await router.push({ name: "events-embed-events" });
  await scrollEmbedToTopOnMobile("created");
};

const handleScrollTopRequest = (payload = {}) => {
  const reason = typeof payload.reason === "string" && payload.reason
    ? payload.reason
    : "form-scroll-request";
  void scrollEmbedToTopOnMobile(reason);
};

const handleEditEvent = ({ eventId, type }) => {
  if (!eventId) return;
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

const handleOpenUrl = ({ url, target = "_blank" } = {}) => {
  if (!url) return;
  const safeTarget = target === "_blank" ? "_blank" : "_self";

  if (isEmbeddedIframe()) {
    requestEventsEmbedOpenUrl({ url, target: safeTarget });
    return;
  }

  if (safeTarget === "_blank") {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  window.location.assign(url);
};
</script>
