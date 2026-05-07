<template>
  <div ref="createScrollRoot" class="h-full overflow-y-auto">
    <UnifiedBookingForm
      :type="normalizedType"
      :creator-id="bootstrap.creatorId"
      :api-base-url="bootstrap.apiBaseUrl"
      :creator-data="bootstrap.creatorData"
      :embedded="true"
      @back="handleBack"
      @created="handleCreated"
      @scroll-top-request="handleScrollTopRequest"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from "vue";
import { useRouter } from "vue-router";
import UnifiedBookingForm from "@/components/ui/form/BookingForm/UnifiedBookingForm.vue";
import { useEventsEmbedBootstrap } from "@/embeds/events/bootstrap.js";
import { requestEventsEmbedScrollToTop } from "@/embeds/events/bridge.js";

const props = defineProps({
  type: {
    type: String,
    default: "private",
  },
});

const router = useRouter();
const bootstrap = useEventsEmbedBootstrap();
const createScrollRoot = ref(null);

const normalizedType = computed(() => (props.type === "group" ? "group" : "private"));

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
</script>
