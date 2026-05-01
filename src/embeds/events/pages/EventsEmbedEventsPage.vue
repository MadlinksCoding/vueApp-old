<template>
  <div class="h-full overflow-y-auto md:px-4">
    <DashboardEventsFeature
      :creator-id="bootstrap.creatorId"
      :fan-id="bootstrap.fanId"
      :user-role="bootstrap.userRole"
      :api-base-url="bootstrap.apiBaseUrl"
      :embedded="true"
      @create-event="handleCreateEvent"
      @open-url="handleOpenUrl"
    />
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import DashboardEventsFeature from "@/features/events/DashboardEventsFeature.vue";
import { useEventsEmbedBootstrap } from "@/embeds/events/bootstrap.js";
import { isEmbeddedIframe, requestEventsEmbedOpenUrl } from "@/embeds/events/bridge.js";

const router = useRouter();
const bootstrap = useEventsEmbedBootstrap();

const handleCreateEvent = ({ type }) => {
  router.push({
    name: "events-embed-create",
    params: {
      type: type === "group" ? "group" : "private",
    },
  });
};

const handleOpenUrl = ({ url, target = "_blank" }) => {
  if (!url) return;

  if (isEmbeddedIframe()) {
    requestEventsEmbedOpenUrl({ url, target });
    return;
  }

  if (target === "_blank") {
    window.open(url, "_blank", "noopener");
    return;
  }

  window.location.assign(url);
};
</script>
