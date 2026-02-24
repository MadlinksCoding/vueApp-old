<script setup>
import { onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import CheckboxGroup from "../checkbox/CheckboxGroup.vue";
import CheckboxSwitch from "@/components/dev/checkbox/CheckboxSwitch.vue";
import InputComponentDashbaord from "../../../dev/input/InputComponentDashboard.vue";
import { MagnifyingGlassIcon } from "@heroicons/vue/24/outline";
import ButtonComponent from "@/components/dev/button/ButtonComponent.vue";
import BookingSectionsWrapper from "../BookingForm/HelperComponents/BookingSectionsWrapper.vue";
import BaseInput from "@/components/dev/input/BaseInput.vue";
import { showToast } from "@/utils/toastBus.js";
import {
  fetchActiveSubscriptionTiers,
  searchInvitableUsers,
} from "@/services/events/eventsAudienceApi.js";

const props = defineProps(["engine"]);
const router = useRouter();
const route = useRoute();
const isCreating = ref(false);

function normalizeSelectionArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        const numeric = Number(item);
        return Number.isFinite(numeric) ? numeric : item;
      })
      .filter((item) => item !== null && item !== undefined && item !== "");
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const numeric = Number(item);
        return Number.isFinite(numeric) ? numeric : item;
      });
  }

  return [];
}

const formData = ref({
  allowRecording: props.engine.state.allowRecording || false,
  recordingPrice: props.engine.state.recordingPrice || "",
  allowPersonalRequest: props.engine.state.allowPersonalRequest || false,
  personalRequestNote: props.engine.state.personalRequestNote || "",
  blockedUsers: normalizeSelectionArray(props.engine.state.blockedUsers || props.engine.state.blockedUserSearch),
  coPerformerSearch: props.engine.state.coPerformerSearch || "",
  whoCanBook: props.engine.state.whoCanBook || "everyone",
  subscriptionTiers: normalizeSelectionArray(props.engine.state.subscriptionTiers),
  invitedUsers: normalizeSelectionArray(props.engine.state.invitedUsers),
  spendingRequirement: props.engine.state.spendingRequirement || "none",
  minSpendTokens: props.engine.state.minSpendTokens || "",
  requiredProductIds: props.engine.state.requiredProductIds || "",
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

const subscriptionTierOptions = ref([]);
const subscriptionTiersLoading = ref(false);
const subscriptionTiersError = ref("");
let subscriptionTierAbortController = null;

const inviteSearchQuery = ref("");
const inviteUserOptions = ref([]);
const inviteUsersLoading = ref(false);
const inviteUsersError = ref("");
const invitedUserLookup = ref({});
let inviteSearchAbortController = null;
let inviteSearchTimeoutId = null;

const blockedUserSearchQuery = ref("");
const blockedUserOptions = ref([]);
const blockedUsersLoading = ref(false);
const blockedUsersError = ref("");
const blockedUserLookup = ref({});
let blockedUserSearchAbortController = null;
let blockedUserSearchTimeoutId = null;

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

function setInviteUserLookup(users = []) {
  const nextLookup = { ...invitedUserLookup.value };
  users.forEach((user) => {
    if (user?.id === undefined || user?.id === null) return;
    nextLookup[String(user.id)] = user;
  });
  invitedUserLookup.value = nextLookup;
}

function setBlockedUserLookup(users = []) {
  const nextLookup = { ...blockedUserLookup.value };
  users.forEach((user) => {
    if (user?.id === undefined || user?.id === null) return;
    nextLookup[String(user.id)] = user;
  });
  blockedUserLookup.value = nextLookup;
}

function getInvitedUserLabel(id) {
  const lookup = invitedUserLookup.value[String(id)];
  if (!lookup) return `User #${id}`;
  return lookup.displayName || lookup.username || lookup.label || `User #${id}`;
}

function getBlockedUserLabel(id) {
  const lookup = blockedUserLookup.value[String(id)];
  if (!lookup) return `User #${id}`;
  return lookup.displayName || lookup.username || lookup.label || `User #${id}`;
}

function toggleSubscriptionTier(tierId) {
  const existing = Array.isArray(formData.value.subscriptionTiers)
    ? [...formData.value.subscriptionTiers]
    : [];
  const index = existing.findIndex((item) => String(item) === String(tierId));
  if (index >= 0) {
    existing.splice(index, 1);
  } else {
    existing.push(tierId);
  }
  formData.value.subscriptionTiers = existing;
}

function toggleInvitedUser(user) {
  if (!user || user.id === undefined || user.id === null) return;
  const userId = user.id;
  const existing = Array.isArray(formData.value.invitedUsers)
    ? [...formData.value.invitedUsers]
    : [];
  const index = existing.findIndex((item) => String(item) === String(userId));

  if (index >= 0) {
    existing.splice(index, 1);
  } else {
    existing.push(userId);
  }

  formData.value.invitedUsers = existing;
  setInviteUserLookup([user]);
}

function removeInvitedUser(userId) {
  const existing = Array.isArray(formData.value.invitedUsers)
    ? [...formData.value.invitedUsers]
    : [];
  formData.value.invitedUsers = existing.filter((item) => String(item) !== String(userId));
}

function toggleBlockedUser(user) {
  if (!user || user.id === undefined || user.id === null) return;
  const userId = user.id;
  const existing = Array.isArray(formData.value.blockedUsers)
    ? [...formData.value.blockedUsers]
    : [];
  const index = existing.findIndex((item) => String(item) === String(userId));

  if (index >= 0) {
    existing.splice(index, 1);
  } else {
    existing.push(userId);
  }

  formData.value.blockedUsers = existing;
  setBlockedUserLookup([user]);
}

function removeBlockedUser(userId) {
  const existing = Array.isArray(formData.value.blockedUsers)
    ? [...formData.value.blockedUsers]
    : [];
  formData.value.blockedUsers = existing.filter((item) => String(item) !== String(userId));
}

function resolveCreatorId() {
  const routeCreatorId = Number(route.query?.creatorId);
  if (Number.isFinite(routeCreatorId)) return routeCreatorId;

  const engineCreatorId = Number(props.engine.getState("creatorId"));
  if (Number.isFinite(engineCreatorId)) return engineCreatorId;

  if (typeof window !== "undefined") {
    const storageCreatorId = Number(window.localStorage?.getItem("creatorId"));
    if (Number.isFinite(storageCreatorId)) return storageCreatorId;
  }

  return 1;
}

async function loadSubscriptionTierOptions() {
  if (subscriptionTierAbortController) subscriptionTierAbortController.abort();
  subscriptionTierAbortController = new AbortController();
  subscriptionTiersLoading.value = true;
  subscriptionTiersError.value = "";

  try {
    subscriptionTierOptions.value = await fetchActiveSubscriptionTiers({
      creatorId: resolveCreatorId(),
      signal: subscriptionTierAbortController.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") return;
    subscriptionTiersError.value = error?.message || "Could not load active tiers.";
    subscriptionTierOptions.value = [];
  } finally {
    subscriptionTiersLoading.value = false;
  }
}

async function runInviteUserSearch(query) {
  const safeQuery = String(query || "").trim();
  if (safeQuery.length < 2) {
    inviteUserOptions.value = [];
    inviteUsersError.value = "";
    return;
  }

  if (inviteSearchAbortController) inviteSearchAbortController.abort();
  inviteSearchAbortController = new AbortController();
  inviteUsersLoading.value = true;
  inviteUsersError.value = "";

  try {
    const users = await searchInvitableUsers({
      query: safeQuery,
      signal: inviteSearchAbortController.signal,
    });
    inviteUserOptions.value = users;
    setInviteUserLookup(users);
  } catch (error) {
    if (error?.name === "AbortError") return;
    inviteUsersError.value = error?.message || "Could not search users.";
    inviteUserOptions.value = [];
  } finally {
    inviteUsersLoading.value = false;
  }
}

async function runBlockedUserSearch(query) {
  const safeQuery = String(query || "").trim();
  if (safeQuery.length < 2) {
    blockedUserOptions.value = [];
    blockedUsersError.value = "";
    return;
  }

  if (blockedUserSearchAbortController) blockedUserSearchAbortController.abort();
  blockedUserSearchAbortController = new AbortController();
  blockedUsersLoading.value = true;
  blockedUsersError.value = "";

  try {
    const users = await searchInvitableUsers({
      query: safeQuery,
      signal: blockedUserSearchAbortController.signal,
    });
    blockedUserOptions.value = users;
    setBlockedUserLookup(users);
  } catch (error) {
    if (error?.name === "AbortError") return;
    blockedUsersError.value = error?.message || "Could not search users.";
    blockedUserOptions.value = [];
  } finally {
    blockedUsersLoading.value = false;
  }
}

watch(() => formData.value.whoCanBook, (whoCanBook) => {
  if (whoCanBook === "subscribersOnly" && subscriptionTierOptions.value.length === 0 && !subscriptionTiersLoading.value) {
    loadSubscriptionTierOptions();
  }

  if (whoCanBook !== "inviteOnly") {
    inviteSearchQuery.value = "";
    inviteUserOptions.value = [];
    inviteUsersError.value = "";
    inviteUsersLoading.value = false;
    if (inviteSearchTimeoutId) {
      clearTimeout(inviteSearchTimeoutId);
      inviteSearchTimeoutId = null;
    }
    if (inviteSearchAbortController) {
      inviteSearchAbortController.abort();
    }
  }
}, { immediate: true });

watch(inviteSearchQuery, (query) => {
  if (formData.value.whoCanBook !== "inviteOnly") return;

  if (inviteSearchTimeoutId) {
    clearTimeout(inviteSearchTimeoutId);
  }

  inviteSearchTimeoutId = setTimeout(() => {
    runInviteUserSearch(query);
  }, 350);
});

watch(blockedUserSearchQuery, (query) => {
  if (blockedUserSearchTimeoutId) {
    clearTimeout(blockedUserSearchTimeoutId);
  }

  blockedUserSearchTimeoutId = setTimeout(() => {
    runBlockedUserSearch(query);
  }, 350);
});

onBeforeUnmount(() => {
  if (subscriptionTierAbortController) subscriptionTierAbortController.abort();
  if (inviteSearchAbortController) inviteSearchAbortController.abort();
  if (blockedUserSearchAbortController) blockedUserSearchAbortController.abort();
  if (inviteSearchTimeoutId) clearTimeout(inviteSearchTimeoutId);
  if (blockedUserSearchTimeoutId) clearTimeout(blockedUserSearchTimeoutId);
});

function formatValidationErrors(errors = []) {
  return (errors || []).map((error) => {
    if (typeof error === "string") return error;
    return error?.message || "Validation error";
  });
}

const createEvent = async () => {
  if (isCreating.value) return;

  const result = await props.engine.validate(2);

  if (result.valid) {
    isCreating.value = true;
    props.engine.setState("creatorId", resolveCreatorId(), { reason: "create-event-flow", silent: true });
    props.engine.setState("eventType", "1on1-call", { reason: "create-event-flow", silent: true });

    try {
      const flowResult = await props.engine.callFlow("events.createEvent", null, {
        context: {
          stateEngine: props.engine,
          creatorId: resolveCreatorId(),
        },
      });

      if (!flowResult?.ok) {
        const message = flowResult?.meta?.uiErrors?.[0]
          || flowResult?.error?.message
          || "Could not create event. Please try again.";
        showToast({
          type: "error",
          title: "Create Event Failed",
          message,
        });
        return;
      }

      await router.push({
        path: "/dashboard/events",
        query: {
          refresh: "1",
          creatorId: String(resolveCreatorId()),
        },
      });
    } finally {
      isCreating.value = false;
    }
  } else {
    const messages = formatValidationErrors(result.errors);
    showToast({
      type: "error",
      title: "Validation Failed",
      message: messages.length ? messages.join(" ") : "Please fix errors before creating.",
    });
  }
};
</script>

<template>
  <div class="flex flex-col gap-6 relative px-6">
    <div class="flex items-center gap-2 cursor-pointer px-2" @click="goToBack">
      <img src="https://i.ibb.co/CsWd11xX/Icon-2.png" alt="" />
      <div class="text-[12px] font-medium">Back</div>
    </div>


    <BookingSectionsWrapper title="Additional Request" leftIcon="https://i.ibb.co/39kq5wcX/Icon-3.png"
      accordionIcon="https://i.ibb.co/MD46QRZS/Frame-1410099649.png" :is-open="sectionsState.additionalRequest"
      @toggle="toggleSection('additionalRequest')">
      <div v-show="sectionsState.additionalRequest" class="inline-flex flex-col gap-5 w-full mt-5">
        <div class="flex flex-col justify-center items-start gap-1">
          <div class="flex gap-2">
            <CheckboxGroup v-model="formData.allowRecording" label="Allow fan record the session"
              checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
              labelClass="text-slate-700 text-[16px] mt-[2px] leading-normal"
              wrapperClass="flex items-center gap-2 mb-3" />
            <div class="mt-[2px]">
              <img src="https://i.ibb.co/HD78k3Sf/Icon.png" alt="" />
            </div>
          </div>
          <div class="inline-flex gap-2">
            <div class="w-6" />
            <div class="opacity-50 inline-flex flex-col">
              <div class="inline-flex justify-end items-center gap-2">
                <BaseInput type="number" placeholder="15" v-model="formData.recordingPrice"
                  :disabled="!formData.allowRecording"
                  inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed" />
                <div class="justify-center text-slate-700 text-base font-normal leading-normal">
                  Tokens
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-col justify-center items-start gap-3">
          <div class="flex flex-col justify-center items-start gap-1">
            <div class="flex gap-2">
              <CheckboxGroup v-model="formData.allowPersonalRequest" label="Allow personal request"
                checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                labelClass="text-slate-700 text-[16px] mt-[2px] leading-normal"
                wrapperClass="flex items-center gap-2 mb-3" />
              <div class="mt-[2px]">
                <img src="https://i.ibb.co/HD78k3Sf/Icon.png" alt="" />
              </div>
            </div>
            <div class="h-10 inline-flex justify-start items-center gap-2">
              <div class="w-6" />
              <div class="flex-1 inline-flex flex-col">
                <div class="inline-flex justify-end items-center gap-2">
                  <BaseInput type="text" placeholder="Optional note shown to fans"
                    v-model="formData.personalRequestNote" :disabled="!formData.allowPersonalRequest"
                    inputClass="bg-white/50 w-full px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-4">
          <div class="justify-start text-gray-900 text-base font-normal leading-normal">
            Customise your event with add-on service like offer to wear
            different outfits and do different actions in the call.
          </div>

          <ButtonComponent text="add-on service" variant="none"
            customClass="group bg-gray-900 flex justify-center items-center gap-2 min-w-14 px-2 py-1
        text-center justify-start text-green-500 text-xs font-semibold capitalize tracking-tight hover:text-black hover:bg-[#07F468]"
            :leftIcon="'https://i.ibb.co.com/RpWmJkcb/plus.webp'" :leftIconClass="`
        w-3 h-3 transition duration-200 group-hover:[filter:brightness(0)_saturate(100%)]
        rounded-sm  outline outline-[1.50px] outline-offset-[-0.75px] `" />
        </div>
      </div>
    </BookingSectionsWrapper>

    <div class="w-full bg-[#D0D5DD] h-[1px]"></div>

    <BookingSectionsWrapper title="Audience Settings" leftIcon="https://i.ibb.co/5hNw0yjJ/Icon.png"
      accordionIcon="https://i.ibb.co/MD46QRZS/Frame-1410099649.png" :is-open="sectionsState.audienceSettings"
      @toggle="toggleSection('audienceSettings')">
      <div v-show="sectionsState.audienceSettings" class="flex flex-col gap-5 mt-5">
        <div class="flex flex-col gap-1.5">
          <div class="flex flex-col gap-1.5">
            <div class="justify-start text-slate-700 text-base font-normal leading-normal">
              Who can book a call?
            </div>
            <select v-model="formData.whoCanBook"
              class="bg-white/75 px-4 py-2 w-full rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 outline-none text-slate-700 text-base">
              <option value="everyone">Everyone</option>
              <option value="subscribersOnly">Subscribers only</option>
              <option value="inviteOnly">Invite only</option>
            </select>

            <div v-if="formData.whoCanBook === 'subscribersOnly'" class="mt-3 flex flex-col gap-2">
              <div class="text-slate-700 text-sm font-medium">
                Select subscription tiers
              </div>
              <div v-if="subscriptionTiersLoading" class="text-slate-500 text-sm">
                Loading active tiers...
              </div>
              <div v-else-if="subscriptionTiersError" class="text-rose-600 text-sm">
                {{ subscriptionTiersError }}
              </div>
              <div v-else-if="subscriptionTierOptions.length === 0" class="text-slate-500 text-sm">
                No active tiers found for this creator.
              </div>
              <div v-else class="max-h-40 overflow-y-auto rounded border border-gray-200 bg-white/70 px-3 py-2">
                <label
                  v-for="tier in subscriptionTierOptions"
                  :key="`tier-${tier.id}`"
                  class="flex items-center gap-2 py-1.5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    :checked="formData.subscriptionTiers.some((item) => String(item) === String(tier.id))"
                    @change="toggleSubscriptionTier(tier.id)"
                    class="h-4 w-4"
                  />
                  <span class="text-slate-700 text-sm">{{ tier.label }}</span>
                </label>
              </div>
            </div>

            <div v-if="formData.whoCanBook === 'inviteOnly'" class="mt-3 flex flex-col gap-2">
              <div class="text-slate-700 text-sm font-medium">
                Invite specific users
              </div>
              <BaseInput
                v-model="inviteSearchQuery"
                type="text"
                placeholder="Search users by username"
                inputClass="bg-white/75 w-full px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300"
              />

              <div v-if="inviteUsersLoading" class="text-slate-500 text-sm">
                Searching users...
              </div>
              <div v-else-if="inviteUsersError" class="text-rose-600 text-sm">
                {{ inviteUsersError }}
              </div>
              <div
                v-else-if="inviteSearchQuery.trim().length >= 2 && inviteUserOptions.length === 0"
                class="text-slate-500 text-sm"
              >
                No users found.
              </div>
              <div
                v-else-if="inviteUserOptions.length > 0"
                class="max-h-40 overflow-y-auto rounded border border-gray-200 bg-white/70 px-3 py-2"
              >
                <label
                  v-for="user in inviteUserOptions"
                  :key="`invite-${user.id}`"
                  class="flex items-center gap-2 py-1.5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    :checked="formData.invitedUsers.some((item) => String(item) === String(user.id))"
                    @change="toggleInvitedUser(user)"
                    class="h-4 w-4"
                  />
                  <span class="text-slate-700 text-sm">{{ user.label }}</span>
                </label>
              </div>

              <div
                v-if="Array.isArray(formData.invitedUsers) && formData.invitedUsers.length > 0"
                class="flex flex-wrap gap-2 pt-1"
              >
                <button
                  v-for="userId in formData.invitedUsers"
                  :key="`selected-${userId}`"
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                  @click="removeInvitedUser(userId)"
                >
                  <span>{{ getInvitedUserLabel(userId) }}</span>
                  <span class="text-slate-500">x</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-3">
          <div class="flex flex-col gap-2">
            <div class="inline-flex justify-start items-center gap-1">
              <div class="text-slate-700 text-base font-normal leading-normal">
                Spending requirement
              </div>
              <img src="https://i.ibb.co/HD78k3Sf/Icon.png" alt="" />
            </div>
            <select v-model="formData.spendingRequirement"
              class="w-full bg-white/75 px-4 py-2 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 outline-none text-slate-700 text-base">
              <option value="none">None</option>
              <option value="minSpend">Minimum spend</option>
              <option value="mustOwnProducts">Must own products</option>
            </select>
            <div v-if="formData.spendingRequirement === 'minSpend'" class="pt-1">
              <BaseInput type="number" placeholder="Minimum spend in tokens" v-model="formData.minSpendTokens"
                inputClass="bg-white/50 w-full px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300" />
            </div>
            <div v-if="formData.spendingRequirement === 'mustOwnProducts'" class="pt-1">
              <BaseInput type="text" placeholder="Required product IDs (comma separated)"
                v-model="formData.requiredProductIds"
                inputClass="bg-white/50 w-full px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300" />
            </div>
          </div>
          <ButtonComponent text="add-on service" variant="none"
            customClass="group bg-gray-900 flex justify-center items-center gap-2 min-w-14 px-2 py-1
        text-center justify-start text-green-500 text-xs font-semibold capitalize tracking-tight hover:text-black hover:bg-[#07F468]"
            :leftIcon="'https://i.ibb.co/bRYvsTVs/Icon.png'" :leftIconClass="`
        w-3 h-3 transition duration-200 group-hover:[filter:brightness(0)_saturate(100%)]
       `" />
        </div>
        <div class="flex flex-col gap-1.5">
          <div class="flex flex-col gap-1.5">
            <div class="justify-start text-slate-700 text-base font-normal leading-normal">
              Blocked user
            </div>
            <div class="w-full flex flex-col gap-2">
              <BaseInput
                v-model="blockedUserSearchQuery"
                type="text"
                placeholder="Search by username & email"
                inputClass="bg-white/75 w-full px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300"
              />

              <div v-if="blockedUsersLoading" class="text-slate-500 text-sm">
                Searching users...
              </div>
              <div v-else-if="blockedUsersError" class="text-rose-600 text-sm">
                {{ blockedUsersError }}
              </div>
              <div
                v-else-if="blockedUserSearchQuery.trim().length >= 2 && blockedUserOptions.length === 0"
                class="text-slate-500 text-sm"
              >
                No users found.
              </div>
              <div
                v-else-if="blockedUserOptions.length > 0"
                class="max-h-40 overflow-y-auto rounded border border-gray-200 bg-white/70 px-3 py-2"
              >
                <label
                  v-for="user in blockedUserOptions"
                  :key="`blocked-${user.id}`"
                  class="flex items-center gap-2 py-1.5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    :checked="formData.blockedUsers.some((item) => String(item) === String(user.id))"
                    @change="toggleBlockedUser(user)"
                    class="h-4 w-4"
                  />
                  <span class="text-slate-700 text-sm">{{ user.label }}</span>
                </label>
              </div>

              <div
                v-if="Array.isArray(formData.blockedUsers) && formData.blockedUsers.length > 0"
                class="flex flex-wrap gap-2 pt-1"
              >
                <button
                  v-for="userId in formData.blockedUsers"
                  :key="`blocked-selected-${userId}`"
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                  @click="removeBlockedUser(userId)"
                >
                  <span>{{ getBlockedUserLabel(userId) }}</span>
                  <span class="text-slate-500">x</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BookingSectionsWrapper>

    <div class="w-full bg-[#D0D5DD] h-[1px]"></div>

    <BookingSectionsWrapper title="Co-performer" leftIcon="https://i.ibb.co/cKdNTc43/Icon-1.png"
      accordionIcon="https://i.ibb.co/MD46QRZS/Frame-1410099649.png" :is-open="sectionsState.coPerformer"
      @toggle="toggleSection('coPerformer')">
      <div v-show="sectionsState.coPerformer" class="w-full mt-3">
        <InputComponentDashbaord id="input_b" placeholder="Search by username & email"
          v-model="formData.coPerformerSearch" label-text="Co-performer (Optional)" :left-icon="MagnifyingGlassIcon"
          optionalLabel class="w-full" />
      </div>
    </BookingSectionsWrapper>

    <div class="w-full bg-[#D0D5DD] h-[1px]"></div>

    <BookingSectionsWrapper title="X Repost Settings" leftIcon="https://i.ibb.co/7t7vR7n8/Vector.png"
      accordionIcon="https://i.ibb.co/MD46QRZS/Frame-1410099649.png" :is-open="sectionsState.xRepost"
      @toggle="toggleSection('xRepost')">
      <div v-show="sectionsState.xRepost" class="flex flex-col gap-5 mt-5">

        <div class="inline-flex gap-2 justify-between">
          <CheckboxSwitch v-model="formData.xPostLive" label="Post to X when my booking schedule is live"
            version="dashboard" wrapper-label="Dark Mode" />
          <div class="flex justify-end">
            <img class="w-4 h-5 mr-[4px]" src="https://i.ibb.co/QFV4GNPF/Icon.png" alt="" />
          </div>
        </div>

        <div class="inline-flex gap-2  justify-between">
          <CheckboxSwitch v-model="formData.xPostBooked" label="Post to X when a booking is received"
            version="dashboard" wrapper-label="Dark Mode" />
          <div class="flex justify-end">
            <img class="w-4 h-5 mr-[4px]" src="https://i.ibb.co/QFV4GNPF/Icon.png" alt="" />
          </div>
        </div>

        <div class="inline-flex gap-2 justify-between">
          <CheckboxSwitch v-model="formData.xPostInSession" label="Post to X when I am in a session" version="dashboard"
            wrapper-label="Dark Mode" />
          <div class="flex justify-end">
            <img class="w-4 h-5 mr-[4px]" src="https://i.ibb.co/QFV4GNPF/Icon.png" alt="" />
          </div>
        </div>

        <div class="inline-flex gap-2 justify-between">
          <CheckboxSwitch v-model="formData.xPostTipped" label="Post to X when I am tipped in a session"
            version="dashboard" wrapper-label="Dark Mode" />
          <div class="flex justify-end">
            <img class="w-4 h-5 mr-[4px]" src="https://i.ibb.co/QFV4GNPF/Icon.png" alt="" />
          </div>
        </div>

        <div class="inline-flex gap-2 justify-between w-full">
          <CheckboxSwitch v-model="formData.xPostPurchase" label="Post to X when someone made a purchase in a session"
            version="dashboard" wrapper-label="Dark Mode" />
          <div class="flex justify-end">
            <img class="w-4 h-5 mr-[4px]" src="https://i.ibb.co/QFV4GNPF/Icon.png" alt="" />
          </div>
        </div>
      </div>
    </BookingSectionsWrapper>

    <div class="w-full bg-[#D0D5DD] h-[1px] mb-[80px]"></div>

  </div>
  <div class="absolute right-0 bottom-0">
    <ButtonComponent @click="createEvent" :disabled="isCreating" text="CREATE EVENT" variant="polygonLeft"
      :leftIcon="'https://i.ibb.co/S74jfvBw/Icon-1.png'" :leftIconClass="`
        w-6 h-6 transition duration-200
        filter brightness-0
        group-hover:[filter:brightness(0)_saturate(100%)_invert(75%)_sepia(23%)_saturate(7280%)_hue-rotate(93deg)_brightness(109%)_contrast(95%)]
      `" />
  </div>
</template>
