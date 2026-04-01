<template>
  <div class="h-full overflow-y-auto bg-[#F9FAFBE5]">
    <UnifiedBookingForm
      :type="normalizedType"
      :creator-id="bootstrap.creatorId"
      :api-base-url="bootstrap.apiBaseUrl"
      :creator-data="bootstrap.creatorData"
      :embedded="true"
      @back="handleBack"
      @created="handleCreated"
    />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import UnifiedBookingForm from "@/components/ui/form/BookingForm/UnifiedBookingForm.vue";
import { useEventsEmbedBootstrap } from "@/embeds/events/bootstrap.js";

const props = defineProps({
  type: {
    type: String,
    default: "private",
  },
});

const router = useRouter();
const bootstrap = useEventsEmbedBootstrap();

const normalizedType = computed(() => (props.type === "group" ? "group" : "private"));

const handleBack = () => {
  router.push({ name: "events-embed-events" });
};

const handleCreated = () => {
  router.push({ name: "events-embed-events" });
};
</script>
