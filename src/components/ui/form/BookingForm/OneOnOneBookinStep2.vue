<script setup>
import { computed, onBeforeUnmount, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import CheckboxGroup from "../checkbox/CheckboxGroup.vue";
import CheckboxSwitch from "@/components/dev/checkbox/CheckboxSwitch.vue";
import InputComponentDashbaord from "../../../dev/input/InputComponentDashboard.vue";
import { MagnifyingGlassIcon } from "@heroicons/vue/24/outline";
import ButtonComponent from "@/components/dev/button/ButtonComponent.vue";
import PopupHandler from "@/components/ui/popup/PopupHandler.vue";
import TwitterRepostSettings from "@/components/ui/popup/TwitterRepostSettings.vue";
import BookingSectionsWrapper from "../BookingForm/HelperComponents/BookingSectionsWrapper.vue";
import BaseInput from "@/components/dev/input/BaseInput.vue";
import TooltipIcon from "@/components/ui/tooltip/TooltipIcon.vue";
import SpendingRequirementProductPopup from "./HelperComponents/SpendingRequirementProductPopup.vue";
import CustomDropdown from "@/components/ui/dropdown/CustomDropdown.vue";
import CopyIcon from "@/assets/images/icons/copy-to-clipboard.webp";
import OrangeMinusIcon from "@/assets/images/icons/minus-square.webp";
import { showToast } from "@/utils/toastBus.js";
import { formatBookingValidationErrors, useBookingTranslations } from "@/i18n/bookingTranslations.js";
import {
  fetchActiveSubscriptionTiers,
  searchInvitableUsers,
} from "@/services/events/eventsAudienceApi.js";
import { resolveCreatorIdFromContext } from "@/utils/contextIds.js";

const { t } = useBookingTranslations();

const whoCanBookOptions = [
  { label: t('booking_everyone'), value: 'everyone' },
  { label: t('booking_subscribers_only'), value: 'subscribersOnly' },
  { label: t('booking_invite_only'), value: 'inviteOnly' }
];

const spendingRequirementOptions = [
  { label: t('booking_spending_none'), value: 'none' },
  // { label: 'User need to spend minimum amount to join', value: 'minSpend' },
  { label: t('booking_spending_must_own_products'), value: 'mustOwnProducts' }
];

const props = defineProps({
  engine: {
    type: Object,
    required: true,
  },
  embedded: {
    type: Boolean,
    default: false,
  },
  bookingType: {
    type: String,
    default: "private",
    validator: (value) => ["private", "group"].includes(value),
  },
});
const emit = defineEmits(["created"]);
const route = useRoute();
const isCreating = ref(false);
const DEFAULT_VUE_CREATOR_ID = 1407; // We can change creator id here(432 for maia).

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

function normalizeRequiredProducts(value) {
  if (!Array.isArray(value)) return [];

  const deduped = new Map();
  value.forEach((item) => {
    if (!item || typeof item !== "object") return;
    const parsedId = Number(item.id);
    const id = Number.isFinite(parsedId) ? parsedId : null;
    const type = String(item.type || "").trim().toLowerCase();
    if (id === null || !type) return;

    const key = `${type}:${id}`;
    if (deduped.has(key)) return;

    deduped.set(key, {
      id,
      type,
      title: String(item.title || "").trim(),
      buyPrice: Number.isFinite(Number(item.buyPrice)) ? Number(item.buyPrice) : null,
      subscribePrice: Number.isFinite(Number(item.subscribePrice)) ? Number(item.subscribePrice) : null,
      thumbnailUrl: String(item.thumbnailUrl || "").trim(),
      tags: Array.isArray(item.tags) ? item.tags.filter(Boolean).map(String) : [],
    });
  });

  return Array.from(deduped.values());
}

function normalizeAddOns(value) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      title: String(item.title || "").trim(),
      description: String(item.description || "").trim(),
      priceTokens: item.priceTokens === null || item.priceTokens === undefined
        ? ""
        : String(item.priceTokens),
    }));
}

const formData = ref({
  allowRecording: props.engine.state.allowRecording || false,
  recordingPrice: props.engine.state.recordingPrice || "",
  allowPersonalRequest: props.engine.state.allowPersonalRequest || false,
  personalRequestNote: props.engine.state.personalRequestNote || "",
  addOns: normalizeAddOns(props.engine.state.addOns),
  blockedUsers: normalizeSelectionArray(props.engine.state.blockedUsers || props.engine.state.blockedUserSearch),
  coPerformerSearch: props.engine.state.coPerformerSearch || "",
  whoCanBook: props.engine.state.whoCanBook || "everyone",
  subscriptionTiers: normalizeSelectionArray(props.engine.state.subscriptionTiers),
  invitedUsers: normalizeSelectionArray(props.engine.state.invitedUsers),
  inviteSecret: props.engine.state.inviteSecret || "",
  spendingRequirement: props.engine.state.spendingRequirement || "none",
  minSpendTokens: props.engine.state.minSpendTokens || "",
  requiredProducts: normalizeRequiredProducts(props.engine.state.requiredProducts),
  xPostLive: props.engine.state.xPostLive || false,
  xPostBooked: props.engine.state.xPostBooked || false,
  xPostInSession: props.engine.state.xPostInSession || false,
  xPostTipped: props.engine.state.xPostTipped || false,
  xPostPurchase: props.engine.state.xPostPurchase || false,
  on_schedule_live: props.engine.state.on_schedule_live ?? props.engine.state.xPostLive ?? false,
  on_booking_received: props.engine.state.on_booking_received ?? props.engine.state.xPostBooked ?? false,
  on_in_session: props.engine.state.on_in_session ?? props.engine.state.xPostInSession ?? false,
  on_tipped_session: props.engine.state.on_tipped_session ?? props.engine.state.xPostTipped ?? false,
  on_purchased: props.engine.state.on_purchased ?? props.engine.state.xPostPurchase ?? false,
  on_schedule_live_message: props.engine.state.on_schedule_live_message || "",
  on_booking_received_message: props.engine.state.on_booking_received_message || "",
  on_in_session_message: props.engine.state.on_in_session_message || "",
  on_tipped_session_message: props.engine.state.on_tipped_session_message || "",
  on_purchased_message: props.engine.state.on_purchased_message || "",
  on_schedule_live_media_url: props.engine.state.on_schedule_live_media_url || "",
  on_booking_received_media_url: props.engine.state.on_booking_received_media_url || "",
  on_in_session_media_url: props.engine.state.on_in_session_media_url || "",
  on_tipped_session_media_url: props.engine.state.on_tipped_session_media_url || "",
  on_purchased_media_url: props.engine.state.on_purchased_media_url || "",
});

watch(formData, (newVal) => {
  Object.keys(newVal).forEach(key => {
    props.engine.setState(key, newVal[key], { silent: true });
  });
}, { deep: true });

const subscriptionTierOptions = ref([]);
const ALL_TIERS_OPTION_VALUE = "__all_tiers__";

function getNormalizedSelectedSubscriptionTierIds(values) {
  const selected = Array.isArray(values) ? values : [];
  return subscriptionTierOptions.value
    .map((tier) => tier.id)
    .filter((tierId) => selected.some((item) => String(item) === String(tierId)));
}

function hasAllSubscriptionTiersSelected(values) {
  const tierIds = subscriptionTierOptions.value.map((tier) => tier.id);
  if (tierIds.length === 0) return false;
  const selectedTierIds = getNormalizedSelectedSubscriptionTierIds(values);
  return selectedTierIds.length === tierIds.length;
}

const subscriptionTierDropdownOptions = computed(() => {
  return [{
    label: t("booking_all_tiers"),
    value: ALL_TIERS_OPTION_VALUE,
  }, ...subscriptionTierOptions.value.map((tier) => ({
    label: tier.label,
    value: tier.id,
  }))];
});

const subscriptionTierDropdownModel = computed({
  get() {
    const selectedTierIds = getNormalizedSelectedSubscriptionTierIds(formData.value.subscriptionTiers);
    if (hasAllSubscriptionTiersSelected(formData.value.subscriptionTiers)) {
      return [ALL_TIERS_OPTION_VALUE, ...selectedTierIds];
    }
    return selectedTierIds;
  },
  set(nextValues) {
    const tierIds = subscriptionTierOptions.value.map((tier) => tier.id);
    const hasAllInNext = Array.isArray(nextValues) && nextValues.includes(ALL_TIERS_OPTION_VALUE);
    const selectedTierIds = getNormalizedSelectedSubscriptionTierIds(nextValues);
    const hadAllPreviously = hasAllSubscriptionTiersSelected(formData.value.subscriptionTiers);

    if (hasAllInNext) {
      // Clicking a single tier while "All Tiers" is currently selected should
      // remove that tier and drop "All Tiers" state.
      if (hadAllPreviously && selectedTierIds.length < tierIds.length) {
        formData.value.subscriptionTiers = selectedTierIds;
        return;
      }
      // Selecting "All Tiers" (or selecting everything) should normalize to full list.
      formData.value.subscriptionTiers = [...tierIds];
      return;
    }

    // If "All Tiers" was toggled off while previously all were selected,
    // clear everything.
    if (hadAllPreviously && selectedTierIds.length === tierIds.length) {
      formData.value.subscriptionTiers = [];
      return;
    }

    formData.value.subscriptionTiers = selectedTierIds;
  },
});

const subscriptionTierTriggerLabel = computed(() => {
  const selectedCount = getNormalizedSelectedSubscriptionTierIds(formData.value.subscriptionTiers).length;
  if (selectedCount === 0) return t("booking_select_tiers");
  if (hasAllSubscriptionTiersSelected(formData.value.subscriptionTiers)) return t("booking_all_tiers");
  if (selectedCount === 1) return t("booking_tier_selected_one");
  return t("booking_tiers_selected_count", { count: selectedCount });
});
const subscriptionTiersLoading = ref(false);
const subscriptionTiersError = ref("");
const subscriptionTierDropdownOpen = ref(false);
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

const blockedUserDropdownRef = ref(null);
const blockedUserDropdownOpen = ref(false);
const handleBlockedUserClickOutside = (event) => {
  if (blockedUserDropdownRef.value && !blockedUserDropdownRef.value.contains(event.target)) {
    blockedUserDropdownOpen.value = false;
  }
};

onMounted(() => {
  const creatorId = resolveCreatorId();
  props.engine.setState("creatorId", creatorId, {
    reason: "booking-step2-default-creator",
    silent: true,
  });
  document.addEventListener("click", handleBlockedUserClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleBlockedUserClickOutside);
});
const INVITE_LINK_BASE_URL = import.meta.env.VITE_WEB_BASE_URL + "/event-invite";
const spendingProductPopupOpen = ref(false);
const SPENDING_REQUIREMENT_PAGE_SIZE = 20;


function emptySpendingCatalogState() {
  return {
    media: {
      items: [],
      loading: false,
      error: "",
      hasMore: true,
      totalCount: null,
      offset: 0,
      count: SPENDING_REQUIREMENT_PAGE_SIZE,
      initialized: false,
    },
    subscription: {
      items: [],
      loading: false,
      error: "",
      hasMore: true,
      totalCount: null,
      offset: 0,
      count: SPENDING_REQUIREMENT_PAGE_SIZE,
      initialized: false,
    },
    product: {
      items: [],
      loading: false,
      error: "",
      hasMore: true,
      totalCount: null,
      offset: 0,
      count: SPENDING_REQUIREMENT_PAGE_SIZE,
      initialized: false,
    },
  };
}

function normalizeCatalogTabState(tabState = {}) {
  return {
    items: normalizeRequiredProducts(tabState.items),
    loading: Boolean(tabState.loading),
    error: String(tabState.error || ""),
    hasMore: tabState.hasMore !== false,
    totalCount: Number.isFinite(Number(tabState.totalCount)) ? Number(tabState.totalCount) : null,
    offset: Math.max(0, Number.isFinite(Number(tabState.offset)) ? Number(tabState.offset) : 0),
    count: Math.max(1, Number.isFinite(Number(tabState.count)) ? Number(tabState.count) : SPENDING_REQUIREMENT_PAGE_SIZE),
    initialized: Boolean(tabState.initialized),
  };
}

function normalizeSpendingCatalog(value = {}) {
  const fallback = emptySpendingCatalogState();
  return {
    media: normalizeCatalogTabState(value.media || fallback.media),
    subscription: normalizeCatalogTabState(value.subscription || fallback.subscription),
    product: normalizeCatalogTabState(value.product || fallback.product),
  };
}

const spendingRequirementCatalog = ref(
  normalizeSpendingCatalog(props.engine.getState("events.spendingRequirementCatalog") || {})
);

const spendingRequirementProductItems = computed(() => {
  const source = spendingRequirementCatalog.value || {};
  return [
    ...(source.media?.items || []),
    ...(source.subscription?.items || []),
    ...(source.product?.items || []),
  ];
});

const spendingRequirementLoadingByType = computed(() => ({
  media: Boolean(spendingRequirementCatalog.value?.media?.loading),
  subscription: Boolean(spendingRequirementCatalog.value?.subscription?.loading),
  product: Boolean(spendingRequirementCatalog.value?.product?.loading),
}));

const spendingRequirementHasMoreByType = computed(() => ({
  media: Boolean(spendingRequirementCatalog.value?.media?.hasMore),
  subscription: Boolean(spendingRequirementCatalog.value?.subscription?.hasMore),
  product: Boolean(spendingRequirementCatalog.value?.product?.hasMore),
}));

const spendingRequirementErrorByType = computed(() => ({
  media: String(spendingRequirementCatalog.value?.media?.error || ""),
  subscription: String(spendingRequirementCatalog.value?.subscription?.error || ""),
  product: String(spendingRequirementCatalog.value?.product?.error || ""),
}));

const xRepostPopupOpen = ref(false);
const xRepostPopupState = ref({
  title: t("booking_x_repost_settings"),
  checkboxLabel: t("booking_post_to_x"),
  checkboxField: null,
  messageField: "",
  mediaField: "",
  inputName: "",
  textareaName: "",
  uploaderName: "",
});
const xRepostPopupConfig = {
  actionType: 'popup',
  width: { default: "493px", "<768": "100%" },
  height: { default: "auto", "<768": "100%" },
  showOverlay: true,
  closeOnOutside: true,
  customEffect: 'scale',
  speed: '200ms',
};

const xRepostPopupCheckboxModel = computed({
  get() {
    const field = xRepostPopupState.value.checkboxField;
    if (!field) return false;
    return Boolean(formData.value[field]);
  },
  set(value) {
    const field = xRepostPopupState.value.checkboxField;
    if (!field) return;
    formData.value[field] = Boolean(value);
  },
});

const xRepostPopupMessageModel = computed({
  get() {
    const field = xRepostPopupState.value.messageField;
    if (!field) return "";
    return String(formData.value[field] || "");
  },
  set(value) {
    const field = xRepostPopupState.value.messageField;
    if (!field) return;
    formData.value[field] = String(value || "");
  },
});

const xRepostPopupMediaModel = computed({
  get() {
    const field = xRepostPopupState.value.mediaField;
    if (!field) return "";
    return String(formData.value[field] || "");
  },
  set(value) {
    const field = xRepostPopupState.value.mediaField;
    if (!field) return;
    formData.value[field] = String(value || "");
  },
});

function openXRepostPopup(config = {}) {
  xRepostPopupState.value = {
    title: String(config.title || t("booking_x_repost_settings")),
    checkboxLabel: String(config.checkboxLabel || t("booking_post_to_x")),
    checkboxField: config.checkboxField || null,
    messageField: String(config.textareaName || ""),
    mediaField: String(config.uploaderName || ""),
    inputName: String(config.inputName || ""),
    textareaName: String(config.textareaName || ""),
    uploaderName: String(config.uploaderName || ""),
  };
  xRepostPopupOpen.value = true;
}

watch(() => formData.value.xPostLive, (value) => {
  formData.value.on_schedule_live = Boolean(value);
}, { immediate: true });

watch(() => formData.value.xPostBooked, (value) => {
  formData.value.on_booking_received = Boolean(value);
}, { immediate: true });

watch(() => formData.value.xPostInSession, (value) => {
  formData.value.on_in_session = Boolean(value);
}, { immediate: true });

watch(() => formData.value.xPostTipped, (value) => {
  formData.value.on_tipped_session = Boolean(value);
}, { immediate: true });

watch(() => formData.value.xPostPurchase, (value) => {
  formData.value.on_purchased = Boolean(value);
}, { immediate: true });

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

const goToBack = async () => {
  // Back navigation should not be blocked by current-step validation.
  if (typeof props.engine.forceStep === "function") {
    await props.engine.forceStep(1, { intent: "back" });
    return;
  }
  await props.engine.goToStep(1, { intent: "back", force: true });
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

function isAllSubscriptionTiersSelected() {
  if (!Array.isArray(subscriptionTierOptions.value) || subscriptionTierOptions.value.length === 0) {
    return false;
  }
  return subscriptionTierOptions.value.every((tier) => (
    formData.value.subscriptionTiers.some((item) => String(item) === String(tier.id))
  ));
}

function toggleAllSubscriptionTiers() {
  if (isAllSubscriptionTiersSelected()) {
    formData.value.subscriptionTiers = [];
    return;
  }
  formData.value.subscriptionTiers = subscriptionTierOptions.value.map((tier) => tier.id);
}

function getSubscriptionTierDropdownLabel() {
  const selectedCount = Array.isArray(formData.value.subscriptionTiers)
    ? formData.value.subscriptionTiers.length
    : 0;
  if (selectedCount === 0) return t("booking_all_tiers");
  if (selectedCount === 1) return t("booking_tier_selected_one");
  return t("booking_tiers_selected_count", { count: selectedCount });
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

function generateInviteSecret() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const randomPart = Math.random().toString(36).slice(2, 12);
  return `${Date.now()}-${randomPart}`;
}

const inviteLink = computed(() => {
  const secret = String(formData.value.inviteSecret || "").trim();
  return secret ? `${INVITE_LINK_BASE_URL}/${secret}` : `${INVITE_LINK_BASE_URL}/`;
});

async function copyInviteLink() {
  const value = inviteLink.value;
  if (!value || value.endsWith("/")) {
    showToast({
      type: "error",
      title: t("booking_invite_only"),
      message: t("booking_validation_invite_secret_required"),
    });
    return;
  }

  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    showToast({
      type: "success",
      title: t("booking_copy_invite_link_title"),
      message: t("booking_copy_invite_link_message"),
    });
  } catch (error) {
    showToast({
      type: "error",
      title: t("booking_copy_failed_title"),
      message: t("booking_copy_failed_message"),
    });
  }
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

function getRequiredProductKey(product = {}) {
  return `${String(product?.type || "").trim().toLowerCase()}:${String(product?.id || "").trim()}`;
}

function addAddOnService() {
  const current = Array.isArray(formData.value.addOns) ? [...formData.value.addOns] : [];
  current.push({
    title: "",
    description: "",
    priceTokens: "",
  });
  formData.value.addOns = current;
}

function removeAddOnService(index) {
  const current = Array.isArray(formData.value.addOns) ? [...formData.value.addOns] : [];
  if (index < 0 || index >= current.length) return;
  current.splice(index, 1);
  formData.value.addOns = current;
}

function openSpendingProductPopup() {
  spendingProductPopupOpen.value = true;
}

function setCatalogTabState(type, nextState = {}) {
  const current = normalizeSpendingCatalog(spendingRequirementCatalog.value || {});
  const safeType = String(type || "").trim().toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(current, safeType)) return;

  current[safeType] = normalizeCatalogTabState({
    ...current[safeType],
    ...nextState,
  });
  spendingRequirementCatalog.value = current;
  props.engine.setState("events.spendingRequirementCatalog", current, { reason: "spending-requirement-catalog", silent: true });
}

function mergeCatalogItems(existing = [], incoming = []) {
  const merged = new Map();
  normalizeRequiredProducts(existing).forEach((item) => {
    merged.set(getRequiredProductKey(item), item);
  });
  normalizeRequiredProducts(incoming).forEach((item) => {
    merged.set(getRequiredProductKey(item), item);
  });
  return Array.from(merged.values());
}

async function fetchSpendingRequirementTab(type, { append = false } = {}) {
  const safeType = String(type || "").trim().toLowerCase();
  if (!["media", "subscription", "product"].includes(safeType)) return;

  const currentTab = normalizeCatalogTabState(spendingRequirementCatalog.value?.[safeType] || {});
  if (currentTab.loading) return;
  if (append && !currentTab.hasMore) return;

  setCatalogTabState(safeType, { loading: true, error: "" });

  const creatorId = resolveCreatorId();
  const payload = {
    creatorId,
    type: safeType,
    count: currentTab.count || SPENDING_REQUIREMENT_PAGE_SIZE,
    offset: append ? currentTab.offset : 0,
  };

  const flowResult = await props.engine.callFlow(
    "events.fetchSpendingRequirementItems",
    payload,
    {
      forceRefresh: true,
      skipDestinationRead: true,
      context: {
        creatorId,
        stateEngine: props.engine,
      },
    }
  );

  if (!flowResult?.ok) {
    const message = flowResult?.meta?.uiErrors?.[0]
      || flowResult?.error?.message
      || t("booking_load_products_failed");
    setCatalogTabState(safeType, {
      loading: false,
      error: message,
      initialized: true,
    });
    return;
  }

  const responseData = flowResult.data || {};
  const nextItems = normalizeRequiredProducts(responseData.items);
  const mergedItems = append ? mergeCatalogItems(currentTab.items, nextItems) : nextItems;

  setCatalogTabState(safeType, {
    loading: false,
    error: "",
    initialized: true,
    items: mergedItems,
    offset: Number.isFinite(Number(responseData.nextOffset))
      ? Number(responseData.nextOffset)
      : mergedItems.length,
    count: Number.isFinite(Number(responseData.count))
      ? Number(responseData.count)
      : currentTab.count,
    totalCount: Number.isFinite(Number(responseData.totalCount))
      ? Number(responseData.totalCount)
      : null,
    hasMore: responseData.hasMore !== false,
  });
}

function ensureSpendingRequirementTabLoaded(type) {
  const safeType = String(type || "").trim().toLowerCase();
  if (!["media", "subscription", "product"].includes(safeType)) return;
  const tab = normalizeCatalogTabState(spendingRequirementCatalog.value?.[safeType] || {});
  if (tab.initialized && Array.isArray(tab.items) && tab.items.length > 0) return;
  fetchSpendingRequirementTab(safeType, { append: false });
}

function handleSpendingProductPopupTabChange(type) {
  ensureSpendingRequirementTabLoaded(type);
}

function handleSpendingProductPopupLoadMore(type) {
  fetchSpendingRequirementTab(type, { append: true });
}

function onConfirmSpendingProducts(selectedItems = []) {
  formData.value.requiredProducts = normalizeRequiredProducts(selectedItems);
}

function resolveCreatorId() {
  return resolveCreatorIdFromContext({
    route,
    engine: props.engine,
    fallback: props.embedded ? 1 : DEFAULT_VUE_CREATOR_ID,
  });
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
    subscriptionTiersError.value = error?.message || t("booking_load_active_tiers_failed");
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
    inviteUsersError.value = error?.message || t("booking_search_users_failed");
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
    blockedUsersError.value = error?.message || t("booking_search_users_failed");
    blockedUserOptions.value = [];
  } finally {
    blockedUsersLoading.value = false;
  }
}

watch(() => formData.value.whoCanBook, (whoCanBook) => {
  if (whoCanBook === "inviteOnly" && !String(formData.value.inviteSecret || "").trim()) {
    formData.value.inviteSecret = generateInviteSecret();
  }

  if (whoCanBook === "subscribersOnly" && subscriptionTierOptions.value.length === 0 && !subscriptionTiersLoading.value) {
    loadSubscriptionTierOptions();
  }

  if (whoCanBook !== "subscribersOnly") {
    subscriptionTierDropdownOpen.value = false;
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

watch(
  () => formData.value.spendingRequirement,
  (requirement) => {
    if (requirement === "mustOwnProducts") {
      ensureSpendingRequirementTabLoaded("media");
    }
  },
  { immediate: true }
);

watch(
  () => spendingProductPopupOpen.value,
  (isOpen) => {
    if (!isOpen) return;
    ensureSpendingRequirementTabLoaded("media");
  }
);

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
  blockedUserDropdownOpen.value = true;
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
  return formatBookingValidationErrors(errors, t);
}

function pickTrimmedString(...values) {
  for (const value of values) {
    const normalized = String(value || "").trim();
    if (normalized) return normalized;
  }

  return "";
}

function resolveCreatedEventName(flowResult = {}) {
  return pickTrimmedString(
    props.engine.getState?.("eventTitle"),
    props.engine.state?.eventTitle,
    flowResult?.data?.item?.title,
    flowResult?.data?.rawItem?.title,
    flowResult?.data?.rawItem?.eventTitle,
  ) || t("dashboard_booked_slot");
}

async function notifyEventCreated({ creatorId, eventName, eventType, eventId }) {
  console.error("Event created:", { creatorId, eventName, eventType, eventId });
  const payload = {
    creator_id: creatorId,
    event_name: eventName,
    event_type: eventType,
    action: "created",
    event_id: String(eventId || props.engine.getState("eventId") || ""),
    booking_name: eventName,
    profile_url: String(props.engine.state.profile_url || props.engine.state.profileUrl || ""),
    on_schedule_live: Boolean(formData.value.on_schedule_live ?? formData.value.xPostLive),
    on_booking_received: Boolean(formData.value.on_booking_received ?? formData.value.xPostBooked),
    on_in_session: Boolean(formData.value.on_in_session ?? formData.value.xPostInSession),
    on_tipped_session: Boolean(formData.value.on_tipped_session ?? formData.value.xPostTipped),
    on_purchased: Boolean(formData.value.on_purchased ?? formData.value.xPostPurchase),
    on_schedule_live_message: String(formData.value.on_schedule_live_message || ""),
    on_booking_received_message: String(formData.value.on_booking_received_message || ""),
    on_in_session_message: String(formData.value.on_in_session_message || ""),
    on_tipped_session_message: String(formData.value.on_tipped_session_message || ""),
    on_purchased_message: String(formData.value.on_purchased_message || ""),
    on_schedule_live_media_url: String(formData.value.on_schedule_live_media_url || ""),
    on_booking_received_media_url: String(formData.value.on_booking_received_media_url || ""),
    on_in_session_media_url: String(formData.value.on_in_session_media_url || ""),
    on_tipped_session_media_url: String(formData.value.on_tipped_session_media_url || ""),
    on_purchased_media_url: String(formData.value.on_purchased_media_url || ""),
  };

  const endpoint = import.meta.env.VITE_WEB_BASE_URL + "/wp-json/api/event/create";
  console.error("Sending event creation notification to:", endpoint, "with payload:", payload);
  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      const beaconQueued = navigator.sendBeacon(endpoint, blob);
      if (beaconQueued) {
        return {
          ok: true,
          transport: "beacon",
          confirmed: false,
          message: "Notification queued via sendBeacon.",
        };
      }
    }
  } catch (error) {
    // Fire-and-forget endpoint; ignore transport errors.
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });

    let responseBody = null;
    try {
      responseBody = await response.json();
    } catch (_) {
      responseBody = null;
    }

    if (!response.ok) {
      return {
        ok: false,
        transport: "fetch",
        status: response.status,
        body: responseBody,
      };
    }

    return {
      ok: true,
      transport: "fetch",
      confirmed: true,
      status: response.status,
      body: responseBody,
    };
  } catch (error) {
    return {
      ok: false,
      transport: "fetch",
      error: error?.message || "Network error",
    };
  }
}

const createEvent = async () => {
  if (isCreating.value) return;

  const result = await props.engine.validate(2);

  if (result.valid) {
    isCreating.value = true;
    props.engine.setState("creatorId", resolveCreatorId(), { reason: "create-event-flow", silent: true });
    props.engine.setState(
      "eventType",
      props.bookingType === "group" ? "group-event" : "1on1-call",
      { reason: "create-event-flow", silent: true },
    );

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

      const notifyResult = await notifyEventCreated({
        creatorId: resolveCreatorId(),
        eventName: resolveCreatedEventName(flowResult),
        eventType: props.engine.getState("eventType") || (props.bookingType === "group" ? "group-event" : "1on1-call"),
        eventId: flowResult?.data?.eventId || flowResult?.data?.item?.eventId || "",
      });

      if (!notifyResult?.ok) {
        console.error("Event create notification failed", notifyResult);
      } else {
        console.info("Event create notification status", notifyResult);
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
    <div class="flex items-center gap-2 cursor-pointer" @click="goToBack">
      <img src="https://i.ibb.co/CsWd11xX/Icon-2.png" alt="" />
      <div class="text-[12px] font-medium">{{ t("common_back") }}</div>
    </div>


    <BookingSectionsWrapper :title="t('booking_additional_request')" leftIcon="https://i.ibb.co/39kq5wcX/Icon-3.png"
      accordionIcon="https://i.ibb.co/MD46QRZS/Frame-1410099649.png" :is-open="sectionsState.additionalRequest"
      @toggle="toggleSection('additionalRequest')">
      <div v-show="sectionsState.additionalRequest" class="inline-flex flex-col gap-5 w-full mt-5">
        <div class="flex flex-col justify-center items-start gap-1">
          <div class="flex gap-2">
            <CheckboxGroup v-model="formData.allowRecording" :label="t('booking_allow_recording')"
              checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
              labelClass="text-slate-700 text-[16px] mt-[2px] leading-normal"
              wrapperClass="flex items-center gap-2" />
            <TooltipIcon :text="t('booking_recording_tooltip')" />
          </div>
          <div class="inline-flex gap-2">
            <div class="w-6" />
            <div :class="['inline-flex flex-col',!formData.allowRecording ? 'opacity-50':'opacity-100']">
              <div class="inline-flex justify-end items-center gap-2">
                <BaseInput type="number" placeholder="" v-model="formData.recordingPrice"
                  :disabled="!formData.allowRecording"
                  inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:cursor-not-allowed" />
                <div class="justify-center text-slate-700 text-base font-normal leading-normal">
                  {{ t("common_tokens") }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-col justify-center items-start gap-3">
          <div class="flex flex-col justify-center items-start gap-1">
            <div class="flex gap-2">
              <CheckboxGroup v-model="formData.allowPersonalRequest" :label="t('booking_allow_personal_request')"
                checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                labelClass="text-slate-700 text-[16px] mt-[2px] leading-normal"
                wrapperClass="flex items-center gap-2 mb-1" />
              <TooltipIcon :text="t('booking_personal_request_tooltip')" />
            </div>
            <div class="inline-flex justify-start items-center gap-2">
              <div class="w-4" />
              <div class="flex-1 inline-flex flex-col">
                <div class="inline-flex justify-end items-center gap-2">
                  <div class="justify-start text-slate-700 text-base font-normal leading-normal">
                    {{ t("booking_personal_request_hint") }}
                  </div>
                  <!-- <BaseInput type="text" placeholder="Optional note shown to fans"
                    v-model="formData.personalRequestNote" :disabled="!formData.allowPersonalRequest"
                    inputClass="bg-white/50 w-full px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed" /> -->
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-4">
          <div class="justify-start text-gray-900 text-base font-normal leading-normal">
            {{ t("booking_add_on_service_description") }}
          </div>

          <div v-if="!Array.isArray(formData.addOns) || formData.addOns.length === 0" class="inline-flex">
            <button
              type="button"
              class="group bg-gray-900 inline-flex justify-center items-center gap-2 min-w-14 px-2 py-1 text-[#07F468] text-xs font-semibold capitalize tracking-tight hover:text-black hover:bg-[#07F468]"
              @click="addAddOnService"
            >
              <img
                src="https://i.ibb.co.com/RpWmJkcb/plus.webp"
                alt=""
                class="w-3 h-3 transition duration-200 group-hover:[filter:brightness(0)_saturate(100%)] rounded-sm outline outline-[1.50px] outline-offset-[-0.75px]"
              />
              <span>{{ t("booking_add_on_service") }}</span>
            </button>
          </div>

          <div v-else class="flex flex-col gap-4">
            <div
              v-for="(addOn, index) in formData.addOns"
              :key="`addon-${index}`"
              class="flex flex-col gap-2"
            >
              <div class="inline-flex justify-between items-center">
                <div class="text-[#667085] text-base font-semibold leading-normal">
                  {{ t("booking_add_on_service_index", { index: index + 1 }) }}
                </div>
              </div>
              <div class="flex items-start gap-4">
                <div class="flex flex-col flex-1"> 
                  <BaseInput
                    type="text"
                    :placeholder="t('booking_record_session')"
                    v-model="addOn.title"
                    inputClass="bg-white/75 w-full px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 text-gray-900 text-base"
                  />

                  <textarea
                    v-model="addOn.description"
                    rows="3"
                    :placeholder="t('common_description_optional')"
                    class="bg-white/75 w-full px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 text-slate-700 text-base resize-none"
                  />
                </div>
                 <button
                  type="button"
                  class="text-[#f15a24] text-[22px] leading-none"
                  @click="removeAddOnService(index)"
                >
                  <img :src="OrangeMinusIcon" alt="" class="w-5 h-5" />
                </button>
              </div>

              <div class="inline-flex items-center gap-2">
                <BaseInput
                  type="number"
                  min="0"
                  step="1"
                  placeholder=""
                  v-model="addOn.priceTokens"
                  inputClass="bg-white/75 w-full px-3 py-2 flex-1 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 text-slate-700 text-base"
                />
                <div class="text-black text-[16px] font-medium whitespace-nowrap">
                  {{ t("common_tokens") }}
                </div>
              </div>
            </div>

            <div class="inline-flex">
              <button
                type="button"
                class="group bg-gray-900 inline-flex justify-center items-center gap-2 min-w-14 px-2 py-1 text-green-500 text-xs font-semibold capitalize tracking-tight hover:text-black hover:bg-[#07F468]"
                @click="addAddOnService"
              >
                <img
                  src="https://i.ibb.co.com/RpWmJkcb/plus.webp"
                  alt=""
                  class="w-3 h-3 transition duration-200 group-hover:[filter:brightness(0)_saturate(100%)] rounded-sm outline outline-[1.50px] outline-offset-[-0.75px]"
                />
                <span>{{ t("booking_add_more_service") }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </BookingSectionsWrapper>

    <div class="w-full bg-[#D0D5DD] h-[1px]"></div>

    <BookingSectionsWrapper :title="t('booking_audience_settings')" leftIcon="https://i.ibb.co/5hNw0yjJ/Icon.png"
      accordionIcon="https://i.ibb.co/MD46QRZS/Frame-1410099649.png" :is-open="sectionsState.audienceSettings"
      @toggle="toggleSection('audienceSettings')">
      <div v-show="sectionsState.audienceSettings" class="flex flex-col gap-5 mt-5">
        <div class="flex flex-col gap-1.5">
          <div class="flex flex-col gap-1.5">
            <div class="justify-start text-slate-700 text-base font-normal leading-normal">
              {{ t("booking_who_can_book_call") }}
            </div>
            <CustomDropdown 
              v-model="formData.whoCanBook" 
              :options="whoCanBookOptions" 
            />

            <div v-if="formData.whoCanBook === 'subscribersOnly'" class=" flex flex-col gap-2 relative">
              <div v-if="subscriptionTiersLoading" class="text-slate-500 text-sm">
                {{ t("booking_loading_active_tiers") }}
              </div>
              <div v-else-if="subscriptionTiersError" class="text-rose-600 text-sm">
                {{ subscriptionTiersError }}
              </div>
              <div v-else-if="subscriptionTierOptions.length === 0" class="text-slate-500 text-sm">
                {{ t("booking_no_active_tiers") }}
              </div>
              <div v-else class="w-full">
                <CustomDropdown
                  v-model="subscriptionTierDropdownModel"
                  :options="subscriptionTierDropdownOptions"
                  :multiple="true"
                  :hasCheckboxes="true"
                >
                  <template #trigger>
                    <span class="text-slate-900 font-medium">
                      {{ subscriptionTierTriggerLabel }}
                    </span>
                  </template>
                </CustomDropdown>
              </div>
            </div>

            <div v-if="formData.whoCanBook === 'inviteOnly'" class="mt-3 flex flex-col gap-2">
              <!-- Temporarily disabled: manual invite-user search, using invite link only for now.
              <div class="text-slate-700 text-sm font-medium">
                Invite specific users
              </div>
              <BaseInput
                v-model="inviteSearchQuery"
                type="text"
                :placeholder="t('common_search_by_username')"
                inputClass="bg-white/75 w-full px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300"
              />
              -->

              <div class="text-slate-700 text-sm font-medium pt-1">
                {{ t("booking_invite_link") }}
              </div>
              <div class="w-full inline-flex items-center">
                <input
                  :value="inviteLink"
                  type="text"
                  readonly
                  class="flex-1 bg-white/75 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 text-slate-700 text-sm"
                />
                <button
                  type="button"
                  class="shrink-0 flex gap-1 px-3 py-2 border-b border-gray-300 bg-white/80 text-gray-700 text-sm font-semibold hover:bg-white"
                  @click="copyInviteLink"
                >
                  <img src="@/assets/images/icons/copy-to-clipboard.webp" alt="" class="w-4 h-4"/>
                  {{ t("booking_copy_invite_link_title") }}
                </button>
              </div>

              <!-- Temporarily disabled: manual invite-user dropdown and selected chips.
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
                    v-model="inviteSearchQuery"
                    type="text"
                    :placeholder="t('common_search_by_username')"
                    class="bg-transparent w-full pl-10 pr-3 py-2 outline-none border-b border-gray-200 text-gray-900 placeholder-gray-500 focus:bg-white/90 transition-colors"
                  />
                </div>

                <div v-if="inviteUsersLoading" class="px-4 py-3 text-slate-500 text-sm">
                  Searching users...
                </div>
                <div v-else-if="inviteUsersError" class="px-4 py-3 text-rose-600 text-sm">
                  {{ inviteUsersError }}
                </div>
                <div
                  v-else-if="inviteSearchQuery.trim().length >= 2 && inviteUserOptions.length === 0"
                  class="px-4 py-3 text-slate-500 text-sm"
                >
                  No users found.
                </div>
                <div
                  v-else-if="inviteUserOptions.length > 0"
                  class="max-h-60 overflow-y-auto"
                >
                  <div
                    v-for="user in inviteUserOptions"
                    :key="`invite-${user.id}`"
                    class="flex items-center justify-between px-4 py-3 hover:bg-black/5 transition-colors cursor-pointer"
                    @click="toggleInvitedUser(user)"
                  >
                    <div class="flex items-center gap-3">
                      <img v-if="user.avatar" :src="user.avatar" class="w-8 h-8 rounded-full object-cover bg-gray-100 shadow-sm" />
                      <div v-else class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm shadow-sm">
                        {{ (user.displayName || user.username || '?').charAt(0).toUpperCase() }}
                      </div>
                      <div class="flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-2">
                        <span class="text-slate-900 text-[15px] font-medium">{{ user.displayName || user.username || user.label }}</span>
                        <span class="text-slate-500 text-[15px]">{{ user.raw?.user_email || user.raw?.email || `${user.username}@email.com` }}</span>
                      </div>
                    </div>

                    <div class="flex items-center justify-center pl-3">
                      <span v-if="formData.invitedUsers.some((item) => String(item) === String(user.id))"
                            class="text-green-600 text-[14px]">
                        invited
                      </span>
                      <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-green-600 transition-transform hover:scale-110" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-if="Array.isArray(formData.invitedUsers) && formData.invitedUsers.length > 0"
                class="flex flex-wrap gap-2 pt-2"
              >
                <button
                  v-for="userId in formData.invitedUsers"
                  :key="`selected-${userId}`"
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-full bg-white/75 border border-gray-200 px-3 py-1 text-xs text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                  @click="removeInvitedUser(userId)"
                >
                  <span>{{ getInvitedUserLabel(userId) }}</span>
                  <span class="text-slate-400 hover:text-slate-600">x</span>
                </button>
              </div>
              -->
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-3">
          <div class="flex flex-col gap-2">
            <div class="inline-flex justify-start items-center gap-1">
              <div class="text-slate-700 text-base font-normal leading-normal">
                {{ t("booking_spending_requirement") }}
              </div>
              <TooltipIcon :text="t('booking_user_must_spend_tooltip')" />
            </div>
            <CustomDropdown 
              v-model="formData.spendingRequirement" 
              :options="spendingRequirementOptions" 
            />
            <div v-if="formData.spendingRequirement === 'minSpend'" class="pt-1">
              <BaseInput type="number" :placeholder="t('booking_minimum_spend_tokens')" v-model="formData.minSpendTokens"
                inputClass="bg-white/50 w-full px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300" />
            </div>
            <div v-if="formData.spendingRequirement === 'mustOwnProducts'" class="pt-1 flex flex-col gap-2">
              <div
                v-if="Array.isArray(formData.requiredProducts) && formData.requiredProducts.length > 0"
                class="flex flex-col gap-2"
              >
                <div
                  v-for="product in formData.requiredProducts"
                  :key="getRequiredProductKey(product)"
                  class="flex items-start gap-2 pt-2"
                >
                  <div class="relative">
                    <div class="absolute left-0 top-0 bg-[rgba(24,34,48,0.5)] px-1 py-[1px] flex items-center gap-[0.188rem]">
                      <img src="" alt="">
                      <span class="text-xs text-white">{{ t("booking_count") }}</span>
                    </div>
                    <img
                    :src="product.thumbnailUrl || 'https://picsum.photos/seed/default-product/120/80'"
                    :alt="product.title || t('booking_product_required')"
                    class="w-[8.5rem] h-[4.875rem] aspect-[136.00/78.34] object-cover"
                  />
                  </div>
                  <div class="flex flex-col gap-2 flex-1 min-w-0">
                    <div class="text-xs font-semibold text-slate-800 truncate">
                      {{ product.title || `${product.type} ${product.id}` }}
                    </div>
                    <div class="flex gap-2">
                     <!-- <div class="text-[11px] text-slate-500 capitalize">
                        {{ product.type }}
                      </div> -->
                      <div v-if="product.subscribePrice" class="text-xs text-white capitalize flex gap-1 bg-[#F06] px-[0.375rem] py-[0.125rem]">
                        <span>{{ t("booking_subscribe") }}</span> 
                        <span class="font-semibold">${{ product.subscribePrice || 0 }}</span>
                      </div>

                      <div v-if="product.buyPrice" class="text-xs text-white capitalize flex gap-1 bg-[#0133FB] px-[0.375rem] py-[0.125rem]">
                        <span>{{ t("booking_buy") }}</span> 
                        <span class="font-semibold">${{ product.buyPrice || 0 }}</span>
                      </div>


                      <div v-if="!product.buyPrice && !product.subscribePrice" class="text-[11px] text-slate-500 capitalize flex gap-2">
                        <span>·</span> {{ t("common_free") }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <ButtonComponent
                :text="Array.isArray(formData.requiredProducts) && formData.requiredProducts.length > 0 ? t('common_switch_product') : t('common_add_product')"
                variant="none"
                customClass="group bg-gray-900 inline-flex justify-center items-center gap-2 min-w-14 px-3 py-2 text-center text-[#07F468] text-xs font-semibold capitalize tracking-tight hover:text-black hover:bg-[#07F468]"
                :leftIcon="'https://i.ibb.co/bRYvsTVs/Icon.png'"
                :leftIconClass="'w-3 h-3 transition duration-200 group-hover:[filter:brightness(0)_saturate(100%)]'"
                @click="openSpendingProductPopup"
              />
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-1.5">
          <div class="flex flex-col gap-1.5">
            <div class="justify-start text-slate-700 text-base font-normal leading-normal">
              {{ t("booking_blocked_user") }}
            </div>
            <div class="w-full flex flex-col shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] rounded-sm bg-white/75 relative" ref="blockedUserDropdownRef">
              <div class="relative w-full">
                <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
                <input
                  v-model="blockedUserSearchQuery"
                  type="text"
                  :placeholder="t('common_search_by_username_email')"
                  class="bg-transparent w-full pl-10 pr-3 py-2 outline-none border-b border-gray-200 text-gray-900 placeholder-slate-500 focus:bg-white/90 transition-colors"
                  @focus="blockedUserDropdownOpen = true"
                  @click="blockedUserDropdownOpen = true"
                />
              </div>

              <template v-if="blockedUserDropdownOpen">
                <div v-if="blockedUsersLoading" class="px-4 py-3 text-slate-500 text-sm">
                  {{ t("booking_searching_users") }}
                </div>
                <div v-else-if="blockedUsersError" class="px-4 py-3 text-rose-600 text-sm">
                  {{ blockedUsersError }}
                </div>
                <div
                  v-else-if="blockedUserSearchQuery.trim().length >= 2 && blockedUserOptions.length === 0"
                  class="px-4 py-3 text-slate-500 text-sm"
                >
                  {{ t("booking_no_users_found") }}
                </div>
                <div
                  v-else-if="blockedUserOptions.length > 0"
                  class="max-h-60 overflow-y-auto w-full bg-white top-12 absolute z-10"
                >
                  <div
                    v-for="user in blockedUserOptions"
                    :key="`blocked-${user.id}`"
                    class="flex items-center justify-between p-3 hover:bg-black/5 transition-colors cursor-pointer"
                    @click="toggleBlockedUser(user)"
                  >
                    <div class="flex items-center gap-2">
                      <img v-if="user.avatar" :src="user.avatar" class="w-[1.375rem] h-[1.375rem] rounded-full object-cover bg-gray-100 shadow-sm" />
                      <div v-else class="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-[#FF5B22] font-bold text-sm shadow-sm">
                        {{ (user.displayName || user.username || '?').charAt(0).toUpperCase() }}
                      </div>
                      <div class="flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-2">
                        <span class="text-gray-950 text-[16px]">{{ user.label }}</span>
                      <!-- <span class="text-slate-500 text-[16px]">{{ user.raw?.user_email || user.raw?.email || `${user.username}@email.com` }}</span> -->
                      </div>
                    </div>

                    <div class="flex items-center justify-center pl-3">
                      <span v-if="formData.blockedUsers.some((item) => String(item) === String(user.id))"
                            class="text-[#FF4405] text-[12px] font-medium">
                        {{ t("booking_blocked") }}
                      </span>
                      <img v-else src="@/assets/images/icons/slash-circle.webp" alt="" class="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <div
              v-if="Array.isArray(formData.blockedUsers) && formData.blockedUsers.length > 0"
              class="flex flex-col gap-0 pt-2 w-full"
            >
              <div
                v-for="(userId, index) in formData.blockedUsers"
                :key="`blocked-selected-${userId}`"
                :class="[
                  'flex items-center justify-between py-3',
                  index !== formData.blockedUsers.length - 1 ? 'border-b border-gray-200' : ''
                ]"
              >
                <div class="flex items-center gap-3">
                  <img v-if="blockedUserLookup[userId]?.avatar" :src="blockedUserLookup[userId].avatar" class="w-8 h-8 rounded-full object-cover bg-gray-100 shadow-sm" />
                  <div v-else class="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-[#FF5B22] font-bold text-sm shadow-sm">
                    {{ (getBlockedUserLabel(userId) || '?').charAt(0).toUpperCase() }}
                  </div>
                  <div class="flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-2">
                    <span class="text-gray-950 text-[16px]">{{ getBlockedUserLabel(userId) }}</span>
                    <span class="text-gray-500 text-[16px]">{{ blockedUserLookup[userId]?.raw?.user_email || blockedUserLookup[userId]?.raw?.email || `${blockedUserLookup[userId]?.username || 'user'}@email.com` }}</span>
                  </div>
                </div>

                <div class="flex items-center justify-center pl-3">
                  <button type="button" class="text-slate-500 hover:text-slate-800 transition-colors cursor-pointer" @click="removeBlockedUser(userId)">
                    <img src="https://i.ibb.co.com/cSNVr9ks/3-dot.webp" alt="" class="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BookingSectionsWrapper>

    <div class="hidden w-full bg-[#D0D5DD] h-[1px]"></div>

    <BookingSectionsWrapper :visible="false" :title="t('booking_co_performer')" leftIcon="https://i.ibb.co/cKdNTc43/Icon-1.png"
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
          <div
            class="flex justify-end cursor-pointer"
            @click="openXRepostPopup({
              title: t('booking_x_repost_settings'),
              checkboxLabel: t('booking_x_post_live'),
              checkboxField: 'xPostLive',
              inputName: 'on_schedule_live',
              textareaName: 'on_schedule_live_message',
              uploaderName: 'on_schedule_live_media_url',
            })"
          >
            <img class="w-5 h-5" src="https://i.ibb.co/QFV4GNPF/Icon.png" alt="" />
          </div>
        </div>

        <div class="inline-flex gap-2  justify-between">
          <CheckboxSwitch v-model="formData.xPostBooked" :label="t('booking_x_post_booked')"
            version="dashboard" :wrapper-label="t('booking_dark_mode')" />
          <div
            class="flex justify-end cursor-pointer"
            @click="openXRepostPopup({
              title: t('booking_x_repost_settings'),
              checkboxLabel: t('booking_x_post_booked'),
              checkboxField: 'xPostBooked',
              inputName: 'on_booking_received',
              textareaName: 'on_booking_received_message',
              uploaderName: 'on_booking_received_media_url',
            })"
          >
            <img class="w-5 h-5" src="https://i.ibb.co/QFV4GNPF/Icon.png" alt="" />
          </div>
        </div>

        <div class="inline-flex gap-2 justify-between">
          <CheckboxSwitch v-model="formData.xPostInSession" :label="t('booking_x_post_in_session')" version="dashboard"
            :wrapper-label="t('booking_dark_mode')" />
          <div
            class="flex justify-end cursor-pointer"
            @click="openXRepostPopup({
              title: t('booking_x_repost_settings'),
              checkboxLabel: t('booking_x_post_in_session'),
              checkboxField: 'xPostInSession',
              inputName: 'on_in_session',
              textareaName: 'on_in_session_message',
              uploaderName: 'on_in_session_media_url',
            })"
          >
            <img class="w-5 h-5" src="https://i.ibb.co/QFV4GNPF/Icon.png" alt="" />
          </div>
        </div>

        <div class="inline-flex gap-2 justify-between">
          <CheckboxSwitch v-model="formData.xPostTipped" :label="t('booking_x_post_tipped')"
            version="dashboard" :wrapper-label="t('booking_dark_mode')" />
          <div
            class="flex justify-end cursor-pointer"
            @click="openXRepostPopup({
              title: t('booking_x_repost_settings'),
              checkboxLabel: t('booking_x_post_tipped'),
              checkboxField: 'xPostTipped',
              inputName: 'on_tipped_session',
              textareaName: 'on_tipped_session_message',
              uploaderName: 'on_tipped_session_media_url',
            })"
          >
            <img class="w-5 h-5" src="https://i.ibb.co/QFV4GNPF/Icon.png" alt="" />
          </div>
        </div>

        <div class="inline-flex gap-2 justify-between w-full">
          <CheckboxSwitch v-model="formData.xPostPurchase" :label="t('booking_x_post_purchase')"
            version="dashboard" :wrapper-label="t('booking_dark_mode')" />
          <div
            class="flex justify-end cursor-pointer"
            @click="openXRepostPopup({
              title: t('booking_x_repost_settings'),
              checkboxLabel: t('booking_x_post_purchase'),
              checkboxField: 'xPostPurchase',
              inputName: 'on_purchased',
              textareaName: 'on_purchased_message',
              uploaderName: 'on_purchased_media_url',
            })"
          >
            <img class="w-5 h-5 min-h-5 min-w-5" src="https://i.ibb.co/QFV4GNPF/Icon.png" alt="" />
          </div>
        </div>
      </div>
    </BookingSectionsWrapper>

    <div class="w-full bg-[#D0D5DD] h-[1px] mb-[80px]"></div>

  </div>
  <PopupHandler v-model="xRepostPopupOpen" :config="xRepostPopupConfig">
    <TwitterRepostSettings
      v-model="xRepostPopupCheckboxModel"
      v-model:message-value="xRepostPopupMessageModel"
      v-model:media-value="xRepostPopupMediaModel"
      :title="xRepostPopupState.title"
      :checkbox-label="xRepostPopupState.checkboxLabel"
      :input-name="xRepostPopupState.inputName"
      :textarea-name="xRepostPopupState.textareaName"
      :uploader-name="xRepostPopupState.uploaderName"
    />
  </PopupHandler>

  <SpendingRequirementProductPopup
    v-model="spendingProductPopupOpen"
    :items="spendingRequirementProductItems"
    :selected-items="formData.requiredProducts"
    :loading-by-type="spendingRequirementLoadingByType"
    :has-more-by-type="spendingRequirementHasMoreByType"
    :error-by-type="spendingRequirementErrorByType"
    @tab-change="handleSpendingProductPopupTabChange"
    @load-more="handleSpendingProductPopupLoadMore"
    @confirm="onConfirmSpendingProducts"
  />
  <div class="absolute right-0 bottom-0">
    <ButtonComponent @click="createEvent" :disabled="isCreating" :text="t('common_create_event')" variant="polygonLeft"
      :leftIcon="'https://i.ibb.co/S74jfvBw/Icon-1.png'" :leftIconClass="`
        w-6 h-6 transition duration-200
        filter brightness-0
        group-hover:[filter:brightness(0)_saturate(100%)_invert(75%)_sepia(23%)_saturate(7280%)_hue-rotate(93deg)_brightness(109%)_contrast(95%)]
      `" />
  </div>
</template>
