<template>
  <DashboardWrapperTwoColContainer>
    <DashboardEventsFeature
      :creator-id="creatorId"
      :user-role="userRole"
      :fan-id="fanId"
      @create-event="handleCreateEvent"
      @open-url="handleOpenUrl"
    />
  </DashboardWrapperTwoColContainer>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import DashboardWrapperTwoColContainer from "@/components/dashboard/DashboardWrapperTwoColContainer.vue";
import DashboardEventsFeature from "@/features/events/DashboardEventsFeature.vue";
import { useAuthStore } from "@/stores/useAuthStore";
import { resolveCreatorIdFromContext, resolveFanIdFromContext } from "@/utils/contextIds.js";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const DEFAULT_VUE_CREATOR_ID = 432;

const userRole = computed(() => auth.simulate?.role || auth.currentUser?.role || "creator");
const creatorId = computed(() => resolveCreatorIdFromContext({
  route,
  fallback: DEFAULT_VUE_CREATOR_ID,
}));
const fanId = computed(() => resolveFanIdFromContext({
  preferredId: auth.simulate?.userId
    ?? auth.currentUser?.userId
    ?? auth.currentUser?.id
    ?? auth.currentUser?.raw?.user_id
    ?? auth.currentUser?.raw?.id
    ?? auth.currentUser?.raw?.sub,
  route,
  fallback: null,
}));

const handleCreateEvent = async ({ type }) => {
  await router.push({
    path: "/UnifiedBookingForm",
    query: {
      type,
      creatorId: String(creatorId.value),
    },
  });
};

const handleOpenUrl = ({ url, target = "_self" }) => {
  if (!url) return;

  if (target === "_blank") {
    window.open(url, "_blank", "noopener");
    return;
  }

  if (target === "_top" && window.top) {
    window.top.location.assign(url);
    return;
  }

  window.location.assign(url);
};

onMounted(() => {
  if (route.query?.refresh !== "1") return;

  const nextQuery = { ...route.query };
  delete nextQuery.refresh;
  router.replace({ path: route.path, query: nextQuery });
});
</script>
