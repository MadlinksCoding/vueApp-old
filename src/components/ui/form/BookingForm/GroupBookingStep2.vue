<script setup>
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import CheckboxGroup from "../checkbox/CheckboxGroup.vue";
import CheckboxSwitch from "@/components/dev/checkbox/CheckboxSwitch.vue";
import InputComponentDashbaord from "../../../dev/input/InputComponentDashboard.vue";
import { MagnifyingGlassIcon } from "@heroicons/vue/24/outline";
import ButtonComponent from "@/components/dev/button/ButtonComponent.vue";
import BookingSectionsWrapper from "../BookingForm/HelperComponents/BookingSectionsWrapper.vue";
import BaseInput from "@/components/dev/input/BaseInput.vue";
import { showToast } from "@/utils/toastBus.js";
import { resolveCreatorIdFromContext } from "@/utils/contextIds.js";
import { formatBookingValidationErrors, useBookingTranslations } from "@/i18n/bookingTranslations.js";

const props = defineProps(["engine"]);
const emit = defineEmits(["created"]);
const route = useRoute();
const isCreating = ref(false);
const { t } = useBookingTranslations();

const formData = ref({
  spendingRequirement: props.engine.state.spendingRequirement || "",
  blockedUserSearch: props.engine.state.blockedUserSearch || "",
  coPerformerSearch: props.engine.state.coPerformerSearch || "",
  xPostLive: props.engine.state.xPostLive || false,
  xPostBooked: props.engine.state.xPostBooked || false,
  xPostInSession: props.engine.state.xPostInSession || false,
  xPostTipped: props.engine.state.xPostTipped || false,
  xPostPurchase: props.engine.state.xPostPurchase || false,
});

watch(formData, (newVal) => {
  Object.keys(newVal).forEach(key => {
    props.engine.setState(key, newVal[key], { silent: true });
  });
}, { deep: true });

// Accordion State for Step 2 Sections
const sectionsState = ref({
  additionalRequest: true, // Section 8
  audienceSettings: true, // Section 9
  coPerformer: true, // Section 10
  xRepost: true, // Section 11
});

const toggleSection = (key) => {
  sectionsState.value[key] = !sectionsState.value[key];
};

const goToBack = () => {
  props.engine.goToStep(1);
};

function resolveCreatorId() {
  return resolveCreatorIdFromContext({
    route,
    engine: props.engine,
    fallback: 1,
  });
}

function formatValidationErrors(errors = []) {
  return formatBookingValidationErrors(errors, t);
}

const createEvent = async () => {
  if (isCreating.value) return;

  const result = await props.engine.validate(2);

  if (result.valid) {
    isCreating.value = true;
    props.engine.setState("creatorId", resolveCreatorId(), { reason: "create-event-flow", silent: true });
    props.engine.setState("eventType", "group-event", { reason: "create-event-flow", silent: true });

    try {
      const flowResult = await props.engine.callFlow("events.createEvent", null, {
        context: {
          stateEngine: props.engine,
          creatorId: resolveCreatorId(),
          apiBaseUrl: props.engine.getState("apiBaseUrl") || undefined,
        },
      });

      if (!flowResult?.ok) {
        const message = flowResult?.meta?.uiErrors?.[0]
          || flowResult?.error?.message
          || t("booking_create_failed_message");
        showToast({
          type: "error",
          title: t("common_create_event_failed"),
          message,
        });
        return;
      }
      emit("created", {
        creatorId: resolveCreatorId(),
        flowResult,
      });
    } finally {
      isCreating.value = false;
    }
  } else {
    const messages = formatValidationErrors(result.errors);
    showToast({
      type: "error",
      title: t("common_validation_failed"),
      message: messages.length ? messages.join(" ") : t("booking_create_failed_message"),
    });
  }
};
</script>

<template>
  <div class="flex flex-col gap-6 relative px-2 md:px-4 lg:px-6">
    <div class="flex items-center gap-2 cursor-pointer px-2" @click="goToBack">
      <img src="https://i.ibb.co/CsWd11xX/Icon-2.png" alt="" />
      <div class="text-[12px] font-medium">{{ t("common_back") }}</div>
    </div>

    <BookingSectionsWrapper :title="t('booking_audience_settings')" leftIcon="https://i.ibb.co/5hNw0yjJ/Icon.png"
      accordionIcon="https://i.ibb.co/MD46QRZS/Frame-1410099649.png" :is-open="sectionsState.audienceSettings"
      @toggle="toggleSection('audienceSettings')">
      <div v-show="sectionsState.audienceSettings" class="flex flex-col gap-5 mt-5">
        <div class="flex flex-col gap-1.5">
          <div class="flex flex-col gap-1.5">
            <div class="justify-start text-slate-700 text-base font-normal leading-normal">
              {{ t("booking_who_can_book") }}
            </div>
            <div
              class="bg-white/75 px-4 py-2 w-full rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 inline-flex">
              Todo
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <div class="flex flex-col gap-3">

            <div class="inline-flex justify-start items-center gap-1">
              <div class="text-slate-700 text-base font-normal leading-normal">
                {{ t("booking_spending_requirement") }}
              </div>
              <img src="https://i.ibb.co/HD78k3Sf/Icon.png" alt="" />
            </div>

            <div class="flex gap-[2px] items-center">
              <div
                class="border border-blue-600 w-3.5 h-3.5 rounded-sm text-xs flex justify-center items-center text-blue-600">
                +
              </div>
              <div class="text-blue-600 text-sm font-medium">
                {{ t("common_add") }}
              </div>
            </div>

          </div>

        </div>


        <div class="flex flex-col gap-1.5">
          <div class="flex flex-col gap-1.5">
            <div class="justify-start text-slate-700 text-base font-normal leading-normal">
              {{ t("booking_blocked_user") }}
            </div>
            <div class="w-full">
              <InputComponentDashbaord id="input_b" :placeholder="t('common_search_by_username_email')"
                v-model="formData.blockedUserSearch" :label-text="t('booking_blocked_user')" :left-icon="MagnifyingGlassIcon"
                optionalLabel class="w-full" />
            </div>
          </div>
        </div>
      </div>
    </BookingSectionsWrapper>

    <div class="w-full bg-[#D0D5DD] h-[1px]"></div>

    <BookingSectionsWrapper :title="t('booking_collaborator')" leftIcon="https://i.ibb.co/cKdNTc43/Icon-1.png"
      accordionIcon="https://i.ibb.co/MD46QRZS/Frame-1410099649.png" :is-open="sectionsState.coPerformer"
      @toggle="toggleSection('coPerformer')">
      <div v-show="sectionsState.coPerformer" class="w-full mt-3">
        <InputComponentDashbaord id="input_b" :placeholder="t('common_search_by_username_email')"
          v-model="formData.coPerformerSearch" :label-text="t('booking_co_performer_optional')" :left-icon="MagnifyingGlassIcon"
          optionalLabel class="w-full" />
      </div>
    </BookingSectionsWrapper>

    <div class="w-full bg-[#D0D5DD] h-[1px]"></div>

    <BookingSectionsWrapper :title="t('booking_x_repost_settings')" leftIcon="https://i.ibb.co/7t7vR7n8/Vector.png"
      accordionIcon="https://i.ibb.co/MD46QRZS/Frame-1410099649.png" :is-open="sectionsState.xRepost"
      @toggle="toggleSection('xRepost')">
      <div v-show="sectionsState.xRepost" class="flex flex-col gap-5 mt-5">

        <div class="inline-flex gap-2 justify-between">
          <CheckboxSwitch v-model="formData.xPostLive" :label="t('booking_x_post_live')"
            version="dashboard" :wrapper-label="t('booking_dark_mode')" />
          <div class="flex justify-end">
            <img class="w-4 h-5 mr-[4px]" src="https://i.ibb.co/QFV4GNPF/Icon.png" alt="" />
          </div>
        </div>

        <div class="inline-flex gap-2 justify-between">
          <CheckboxSwitch v-model="formData.xPostBooked" :label="t('booking_x_post_booked')"
            version="dashboard" :wrapper-label="t('booking_dark_mode')" />
          <div class="flex justify-end">
            <img class="w-4 h-5 mr-[4px]" src="https://i.ibb.co/QFV4GNPF/Icon.png" alt="" />
          </div>
        </div>

        <div class="inline-flex gap-2 justify-between">
          <CheckboxSwitch v-model="formData.xPostInSession" :label="t('booking_x_post_in_session')" version="dashboard"
            :wrapper-label="t('booking_dark_mode')" />
          <div class="flex justify-end">
            <img class="w-4 h-5 mr-[4px]" src="https://i.ibb.co/QFV4GNPF/Icon.png" alt="" />
          </div>
        </div>

        <div class="inline-flex gap-2 justify-between">
          <CheckboxSwitch v-model="formData.xPostTipped" :label="t('booking_x_post_tipped')"
            version="dashboard" :wrapper-label="t('booking_dark_mode')" />
          <div class="flex justify-end">
            <img class="w-4 h-5 mr-[4px]" src="https://i.ibb.co/QFV4GNPF/Icon.png" alt="" />
          </div>
        </div>


        <div class="inline-flex gap-2 justify-between">
          <CheckboxSwitch v-model="formData.xPostPurchase" :label="t('booking_x_post_purchase')"
            version="dashboard" :wrapper-label="t('booking_dark_mode')" />
          <div class="flex justify-end">
            <img class="w-4 h-5 mr-[4px]" src="https://i.ibb.co/QFV4GNPF/Icon.png" alt="" />
          </div>
        </div>
      </div>
    </BookingSectionsWrapper>

    <div class="w-full bg-[#D0D5DD] h-[1px] mb-[80px]"></div>

    <div class="absolute right-0 bottom-0">
      <ButtonComponent @click="createEvent" :disabled="isCreating" :text="t('common_create_event')" variant="polygonLeft"
        :leftIcon="'https://i.ibb.co/S74jfvBw/Icon-1.png'" :leftIconClass="`
          w-6 h-6 transition duration-200
          filter brightness-0
          group-hover:[filter:brightness(0)_saturate(100%)_invert(75%)_sepia(23%)_saturate(7280%)_hue-rotate(93deg)_brightness(109%)_contrast(95%)]
        `" />
    </div>
  </div>
</template>
