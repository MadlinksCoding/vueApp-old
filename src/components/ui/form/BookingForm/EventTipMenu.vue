<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { PlusCircleIcon, XMarkIcon, PencilSquareIcon, TrashIcon, MagnifyingGlassIcon, ArrowLeftIcon, PhotoIcon, VideoCameraIcon, MusicalNoteIcon, ArrowPathIcon } from "@heroicons/vue/24/outline";
import BookingSectionsWrapper from "./HelperComponents/BookingSectionsWrapper.vue";
import TipPrizePrice from "./HelperComponents/TipPrizePrice.vue";
import SpendingRequirementProductCard from "./HelperComponents/SpendingRequirementProductCard.vue";
import tokenIcon from "@/assets/images/icons/token.webp";
import galleryIcon from "@/assets/images/icons/image-03.svg";
import { getSpendingRequirementMediaBadge } from "@/utils/spendingRequirementMediaBadge.js";
import { fetchTipPrizePage, fetchTipPrizeItem, normalizeEventTipMenu } from "@/services/events/eventTipMenu.js";
import { useBookingTranslations } from "@/i18n/bookingTranslations.js";

const { t } = useBookingTranslations();
const props = defineProps({ modelValue: { type: Array, default: () => [] }, creatorId: { type: [Number, String], default: null } });
const emit = defineEmits(["update:modelValue"]);
const open = ref(false);
const mobile = ref(false);
const libraryOpen = ref(false);
const editingId = ref(null);
const title = ref("");
const tokens = ref("");
const includePrize = ref(false);
const prizeType = ref("subscription");
const selected = ref(null);
const candidate = ref(null);
const billingCycles = ref(1);
const query = ref("");
const visibleCount = ref(6);
const loading = ref(false);
const error = ref("");
const draftError = ref(false);
const descriptionInput = ref(null);
let returnFocus;
let controller;
let searchTimer;
let mediaQuery;
let previousOverflow;
const catalog = ref({});
const current = computed(() => catalog.value[prizeType.value] || { items: [], offset: 0, hasMore: true });
const matches = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase();
  return current.value.items.filter(item => !needle || [item.title, ...item.tags].join(" ").toLocaleLowerCase().includes(needle));
});
const visibleItems = computed(() => matches.value.slice(0, visibleCount.value));
const canLoadMore = computed(() => current.value.hasMore || matches.value.length > visibleCount.value);
const valid = computed(() => title.value.trim().length > 0 && title.value.trim().length <= 200 && !/[<>]/.test(title.value) && Number.isSafeInteger(Number(tokens.value)) && Number(tokens.value) >= 1 && Number(tokens.value) <= 1000000 && (!includePrize.value || (selected.value && (prizeType.value !== "subscription" || (Number.isInteger(Number(billingCycles.value)) && Number(billingCycles.value) >= 1 && Number(billingCycles.value) <= 120)))));
const libraryHeading = computed(() => t(prizeType.value === "merch" ? "booking_tip_menu_choose_merch" : "booking_tip_menu_choose_media"));
const changeSelectionLabel = computed(() => t(prizeType.value === "merch" ? "booking_tip_menu_change_merch" : "booking_tip_menu_change_media"));
const searchLabel = computed(() => t(prizeType.value === "merch" ? "booking_tip_menu_search_merch" : "booking_tip_menu_search_media"));
const searchPlaceholder = computed(() => t(prizeType.value === "merch" ? "booking_tip_menu_search_merch_placeholder" : "booking_tip_menu_search_media_placeholder"));
const libraryLabel = computed(() => t(prizeType.value === "merch" ? "booking_tip_menu_merch_library" : "booking_tip_menu_media_library"));
const loadingLabel = computed(() => t(prizeType.value === "merch" ? "booking_tip_menu_loading_merch" : "booking_tip_menu_loading_media"));
const errorMessage = computed(() => error.value ? error.value.translationKey ? t(error.value.translationKey) : error.value.message || t("booking_tip_menu_library_load_failed") : "");
const draftErrorMessage = computed(() => draftError.value ? t("booking_tip_menu_unsaved_item") : "");
function itemPrizeTitle(prize) { return prize?.planTitle || prize?.mediaTitle || prize?.productTitle || ""; }
function mediaBadge(item) { return getSpendingRequirementMediaBadge(item); }
function updateBodyLock() {
  if (open.value && mobile.value && previousOverflow === undefined) { previousOverflow = document.body.style.overflow; document.body.style.overflow = "hidden"; }
  else if ((!open.value || !mobile.value) && previousOverflow !== undefined) { document.body.style.overflow = previousOverflow; previousOverflow = undefined; }
}
function onViewportChange(event) { mobile.value = event.matches; updateBodyLock(); }
onMounted(() => { mediaQuery = window.matchMedia("(max-width: 767px)"); mobile.value = mediaQuery.matches; mediaQuery.addEventListener("change", onViewportChange); });
onUnmounted(() => { controller?.abort(); clearTimeout(searchTimer); mediaQuery?.removeEventListener("change", onViewportChange); if (previousOverflow !== undefined) document.body.style.overflow = previousOverflow; });
watch([open, mobile], updateBodyLock);
watch(() => props.creatorId, () => { controller?.abort(); catalog.value = {}; if (open.value && includePrize.value) refreshLibrary(); });
async function begin(item = null) {
  controller?.abort();
  returnFocus = document.activeElement;
  editingId.value = item?.itemId || null;
  title.value = item?.title || "";
  tokens.value = item?.tokens ?? "";
  includePrize.value = !!item?.prize;
  prizeType.value = item?.prize?.type || "subscription";
  billingCycles.value = item?.prize?.billingCycles || 1;
  const savedId = item?.prize?.planId || item?.prize?.mediaId || item?.prize?.productId;
  selected.value = item?.prize ? current.value.items.find(entry => entry.id === savedId) || { id: savedId, type: prizeType.value === "p2v" ? "media" : "product", title: itemPrizeTitle(item.prize), thumbnailUrl: item.prize.imageUrl || "", tags: [] } : null;
  candidate.value = null;
  query.value = "";
  visibleCount.value = 6;
  error.value = "";
  draftError.value = false;
  libraryOpen.value = false;
  open.value = true;
  if (includePrize.value && prizeType.value === "subscription") await refreshLibrary();
  else if (selected.value) await refreshSelectedPrize();
  await nextTick();
  descriptionInput.value?.focus();
}
function close() { clearTimeout(searchTimer); controller?.abort(); open.value = false; libraryOpen.value = false; draftError.value = false; nextTick(() => returnFocus?.focus()); }
function makePrize() {
  if (!includePrize.value) return null;
  const item = selected.value;
  if (prizeType.value === "subscription") return { type: "subscription", planId: item.id, planTitle: item.title, billingCycles: Number(billingCycles.value) };
  return prizeType.value === "p2v" ? { type: "p2v", mediaId: item.id, mediaTitle: item.title, imageUrl: item.thumbnailUrl } : { type: "merch", productId: item.id, productTitle: item.title, imageUrl: item.thumbnailUrl };
}
function save() {
  if (!valid.value) return;
  const item = { itemId: editingId.value || `ti_${crypto.randomUUID()}`, title: title.value.trim(), tokens: Number(tokens.value), prize: makePrize() };
  const menu = editingId.value ? props.modelValue.map(existing => existing.itemId === editingId.value ? item : existing) : [...props.modelValue, item];
  emit("update:modelValue", normalizeEventTipMenu(menu));
  close();
}
function remove(item) { emit("update:modelValue", props.modelValue.filter(existing => existing.itemId !== item.itemId)); if (editingId.value === item.itemId) close(); }
function beforeLeave() { if (!open.value) return true; draftError.value = true; descriptionInput.value?.focus(); return false; }
defineExpose({ beforeLeave });
async function fillLibrary() {
  controller?.abort();
  const request = new AbortController(); controller = request;
  const type = prizeType.value;
  loading.value = true; error.value = "";
  try {
    if (!catalog.value[type]) catalog.value[type] = { items: [], offset: 0, hasMore: true };
    while (!request.signal.aborted && current.value.hasMore && (matches.value.length < visibleCount.value || (type === "subscription" && !current.value.items.length))) {
      const page = await fetchTipPrizePage({ type, creatorId: props.creatorId, offset: current.value.offset, signal: request.signal });
      if (request.signal.aborted) return;
      const cached = catalog.value[type];
      const ids = new Set(cached.items.map(item => item.id));
      catalog.value[type] = { items: [...cached.items, ...page.items.filter(item => !ids.has(item.id))], offset: page.nextOffset, hasMore: page.hasMore && page.nextOffset > cached.offset };
    }
  } catch (reason) { if (!request.signal.aborted) error.value = reason || {}; }
  finally { if (controller === request) loading.value = false; }
}
function refreshLibrary() { visibleCount.value = 6; return fillLibrary(); }
async function refreshSelectedPrize() {
  controller?.abort();
  const request = new AbortController(); controller = request;
  const item = selected.value;
  loading.value = true; error.value = "";
  try {
    const details = await fetchTipPrizeItem({ type: prizeType.value, creatorId: props.creatorId, id: item.id, signal: request.signal });
    if (!request.signal.aborted && selected.value === item && details) selected.value = details;
  } catch (reason) { if (!request.signal.aborted) error.value = reason || {}; }
  finally { if (controller === request) loading.value = false; }
}
function retryLibrary() { return selected.value && prizeType.value !== "subscription" ? refreshSelectedPrize() : fillLibrary(); }
function changeType() { controller?.abort(); loading.value = false; error.value = ""; selected.value = null; candidate.value = null; query.value = ""; libraryOpen.value = false; if (prizeType.value === "subscription" || !mobile.value) refreshLibrary(); }
function togglePrize() { selected.value = null; candidate.value = null; if (includePrize.value && (prizeType.value === "subscription" || !mobile.value)) refreshLibrary(); }
function chooseLibrary() { candidate.value = null; libraryOpen.value = true; refreshLibrary(); }
function selectItem(item) { if (mobile.value) candidate.value = item; else { controller?.abort(); selected.value = item; } }
function confirmSelection() { controller?.abort(); selected.value = candidate.value; libraryOpen.value = false; }
function changeSelection() { selected.value = null; candidate.value = null; if (mobile.value) chooseLibrary(); else refreshLibrary(); }
function loadMore() { visibleCount.value += 6; fillLibrary(); }
function scrollLibrary(event) { const list = event.target; if (!loading.value && canLoadMore.value && list.scrollTop + list.clientHeight >= list.scrollHeight - 32) loadMore(); }
watch(query, () => { if (selected.value) return; clearTimeout(searchTimer); controller?.abort(); visibleCount.value = 6; if (open.value && includePrize.value && prizeType.value !== "subscription" && (!mobile.value || libraryOpen.value)) searchTimer = setTimeout(fillLibrary, 200); });
function keydown(event) {
  if (event.key === "Escape") { event.preventDefault(); if (libraryOpen.value) libraryOpen.value = false; else close(); }
  if (mobile.value && event.key === "Tab") {
    const elements = [...event.currentTarget.querySelectorAll('button:not([disabled]), input, select, [tabindex="0"]')].filter(element => element.getClientRects().length);
    const first = elements[0]; const last = elements.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
}
</script>

<template>
  <BookingSectionsWrapper :title="t('booking_tip_menu_title')" :left-icon="tokenIcon" left-icon-class="w-6 h-6 shrink-0 " class="event-tip-menu">
    <p class="tip-intro">{{ t('booking_tip_menu_intro') }}</p>
    <ul v-if="modelValue.length" class="tip-items" :aria-label="t('booking_tip_menu_items_aria')">
      <li v-for="item in modelValue" :key="item.itemId" class="tip-item">
        <div class="tip-item-description"><strong>{{ item.title }}</strong><span v-if="item.prize" class="tip-prize-summary">{{ itemPrizeTitle(item.prize) }}<template v-if="item.prize.type === 'subscription'"> · {{ t(item.prize.billingCycles === 1 ? 'booking_tip_menu_billing_cycle' : 'booking_tip_menu_billing_cycles', { count: item.prize.billingCycles }) }}</template></span></div>
        <span class="tip-token-amount"><img :src="tokenIcon" :alt="t('common_tokens')" />{{ item.tokens }}</span>
        <button type="button" class="tip-icon-button" :aria-label="t('booking_tip_menu_edit_item_aria', { title: item.title })" @click="begin(item)"><PencilSquareIcon /></button>
        <button type="button" class="tip-icon-button" :aria-label="t('booking_tip_menu_delete_item_aria', { title: item.title })" @click="remove(item)"><TrashIcon /></button>
      </li>
    </ul>
    <button v-if="!open" type="button" class="tip-button tip-button-dark" :disabled="modelValue.length >= 50" @click="begin()"><PlusCircleIcon /> {{ t('booking_tip_menu_tip_item') }}</button>
    <p v-if="modelValue.length >= 50" class="tip-help">{{ t('booking_tip_menu_item_limit', { count: 50 }) }}</p>
    <Teleport to="body" :disabled="!mobile">
      <div v-if="open" class="tip-editor" :class="{ 'tip-editor-mobile': mobile }" :role="mobile ? 'dialog' : 'group'" :aria-modal="mobile || undefined" aria-labelledby="tip-editor-heading" @keydown="keydown">
        <div class="tip-editor-heading"><h3 id="tip-editor-heading">{{ libraryOpen ? libraryHeading : t(editingId ? 'booking_tip_menu_edit_item' : 'booking_tip_menu_add_item') }}</h3><button type="button" class="tip-icon-button" :aria-label="t('booking_tip_menu_cancel_item_aria')" @click="close"><XMarkIcon /></button></div>
        <div v-show="!libraryOpen" class="tip-editor-fields">
          <label class="tip-field">{{ t('booking_tip_menu_item_description') }}<input ref="descriptionInput" v-model="title" :aria-label="t('booking_tip_menu_item_description')" :placeholder="t('booking_tip_menu_item_description')" maxlength="200" /></label>
          <label class="tip-field">{{ t('booking_tip_menu_tip_amount') }}<div class="tip-amount-input"><input v-model="tokens" :aria-label="t('booking_tip_menu_tip_amount')" type="number" inputmode="numeric" min="1" max="1000000" step="1" placeholder="0" /><span>{{ t('common_tokens') }}</span></div></label>
          <label class="tip-checkbox"><input v-model="includePrize" type="checkbox" @change="togglePrize" /> {{ t('booking_tip_menu_include_prize') }}</label>
          <template v-if="includePrize">
            <label class="tip-field"><span class="sr-only">{{ t('booking_tip_menu_prize_type') }}</span><select v-model="prizeType" :aria-label="t('booking_tip_menu_prize_type')" @change="changeType"><option value="subscription">{{ t('booking_tip_menu_subscription') }}</option><option value="p2v">{{ t('booking_tip_menu_p2v_media') }}</option><option value="merch">{{ t('booking_tip_menu_merch') }}</option></select></label>
            <template v-if="prizeType === 'subscription'">
              <label class="tip-field">{{ t('booking_tip_menu_subscription_tier') }}<select :value="selected?.id || ''" :aria-label="t('booking_tip_menu_subscription_tier')" @change="selected = current.items.find(item => String(item.id) === $event.target.value) || null"><option value="" disabled>{{ t(loading ? 'booking_tip_menu_loading_tiers' : 'booking_tip_menu_choose_tier') }}</option><option v-if="selected && !current.items.some(item => item.id === selected.id)" :value="selected.id">{{ selected.title }}</option><option v-for="item in current.items" :key="item.id" :value="item.id">{{ item.title }}</option></select></label>
              <label class="tip-field">{{ t('booking_tip_menu_free_for') }}<div class="tip-amount-input"><input v-model="billingCycles" :aria-label="t('booking_tip_menu_billing_cycles_aria')" type="number" min="1" max="120" step="1" inputmode="numeric" /><span>{{ t('booking_tip_menu_months') }}</span></div></label>
              <p v-if="!loading && !error && !current.items.length" class="tip-help">{{ t('booking_tip_menu_no_tiers') }}</p>
            </template>
            <template v-else-if="selected">
              <div class="tip-selected-prize">
                <div class="tip-selected-card"><img v-if="selected.thumbnailUrl" :src="selected.thumbnailUrl" alt="" /><PhotoIcon v-else /><div class="tip-selected-copy"><strong :title="selected.title">{{ selected.title }}</strong><TipPrizePrice :item="selected" :loading="loading" /></div></div>
                <button type="button" class="tip-button tip-button-dark tip-button-small" @click="changeSelection"><ArrowPathIcon />{{ changeSelectionLabel }}</button>
              </div>
            </template>
            <div v-else-if="mobile" class="tip-library-actions"><button type="button" class="tip-button tip-button-dark" @click="chooseLibrary">{{ t('booking_tip_menu_choose_from_library') }}</button><button type="button" class="tip-upload" disabled>{{ t('booking_tip_menu_upload_new') }}</button></div>
          </template>
        </div>
        <div v-if="includePrize && prizeType !== 'subscription' && !selected && (!mobile || libraryOpen)" class="tip-library">
          <button v-if="mobile" type="button" class="tip-back" @click="libraryOpen = false"><ArrowLeftIcon /> {{ t('common_back') }}</button>
          <button v-else type="button" class="tip-upload" disabled>{{ t('booking_tip_menu_upload_new') }}</button>
          <label class="tip-search"><MagnifyingGlassIcon /><input v-model="query" :aria-label="searchLabel" :placeholder="searchPlaceholder" /></label>
          <div class="tip-library-list" :class="prizeType === 'p2v' ? 'tip-media-grid' : 'tip-merch-grid'" tabindex="0" :aria-label="libraryLabel" @scroll="scrollLibrary">
            <template v-for="item in visibleItems" :key="item.id">
            <SpendingRequirementProductCard v-if="prizeType === 'merch'" class="tip-merch-card" :item="item" :selected="candidate?.id === item.id" show-select-action @select="selectItem" />
            <button v-else type="button" class="tip-library-card" :class="{ 'tip-card-selected': candidate?.id === item.id }" :aria-pressed="candidate?.id === item.id" @click="selectItem(item)">
              <div class="tip-library-thumbnail">
                <img v-if="item.thumbnailUrl" :src="item.thumbnailUrl" alt="" loading="lazy" /><PhotoIcon v-else />
                <span v-if="prizeType === 'p2v' && mediaBadge(item)" class="tip-media-badge"><VideoCameraIcon v-if="mediaBadge(item).icon === 'video'" /><MusicalNoteIcon v-else-if="mediaBadge(item).icon === 'audio'" /><img v-else :src="galleryIcon" alt="" /><span v-if="mediaBadge(item).label">{{ mediaBadge(item).label }}</span></span>
                <span v-if="prizeType === 'p2v'" class="tip-media-purchase" :class="{ 'tip-media-buy-only': !item.canSubscribe }">{{ t(item.canSubscribe ? 'booking_tip_menu_subscribe_or_buy' : 'booking_tip_menu_buy_now') }}</span>
              </div>
              <span class="tip-library-card-copy"><strong :title="item.title">{{ item.title }}</strong></span>
              <span class="tip-select-badge">{{ t(candidate?.id === item.id ? 'booking_tip_menu_selected' : 'common_select') }}</span>
            </button>
            </template>
            <p v-if="loading" class="tip-library-message" role="status">{{ loadingLabel }}</p>
            <p v-else-if="!visibleItems.length && !error" class="tip-library-message">{{ t(query ? 'booking_tip_menu_no_matches' : 'booking_tip_menu_no_items') }}</p>
            <button v-if="canLoadMore && !loading && !error" type="button" class="tip-load-more" @click="loadMore">{{ t('booking_tip_menu_show_more') }}</button>
          </div>
        </div>
        <p v-if="error" class="tip-error" role="alert">{{ errorMessage }} <button type="button" @click="retryLibrary">{{ t('booking_tip_menu_try_again') }}</button></p>
        <p v-if="draftError" class="tip-error" role="alert">{{ draftErrorMessage }}</p>
        <div v-if="!libraryOpen || candidate" class="tip-editor-footer"><template v-if="libraryOpen"><button type="button" class="tip-button tip-button-green" :disabled="!candidate" @click="confirmSelection">{{ t('booking_tip_menu_confirm') }}</button></template><template v-else><button type="button" class="tip-cancel" @click="close">{{ t('common_cancel') }}</button><button type="button" class="tip-button tip-button-green" :disabled="!valid" @click="save"><PlusCircleIcon v-if="!editingId" />{{ t(editingId ? 'booking_tip_menu_save' : 'booking_tip_menu_add_item_button') }}</button></template></div>
      </div>
    </Teleport>
  </BookingSectionsWrapper>
</template>

<style scoped>
.event-tip-menu {
  min-width: 0;
}
.event-tip-menu :deep(.flex.w-full) { min-width: 0; }
.tip-intro {
  font-size: 14px;
  line-height: 1.6;
  margin: 16px 0 20px;
  color: #101828;
}
.tip-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0;
  margin: 0 0 16px;
  list-style: none;
}
.tip-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  padding: 10px;
  border-radius: 4px;
}
.tip-item-description {
  min-width: 0;
  flex: 1;
  overflow-wrap: anywhere;
}
.tip-item-description strong {
  font-size: 14px;
  font-weight: 500;
}
.tip-prize-summary {
  display: block;
  font-size: 12px;
  color: #667085;
  margin-top: 3px;
}
.tip-token-amount {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}
.tip-token-amount img {
  width: 20px;
  height: 20px;
}
.tip-icon-button {
  padding: 4px;
  color: #667085;
  border: 0;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
}
.tip-icon-button svg {
  width: 18px;
  height: 18px;
}
.tip-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 0;
  border-radius: 0;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
  cursor: pointer;
}
.tip-button svg {
  width: 18px;
  height: 18px;
}
.tip-button-dark {
  background: #101010;
  color: #79ff82;
}
.tip-button-green {
  background: #79ff82;
  color: #101828;
}
.tip-button:disabled {
  opacity: .45;
  cursor: not-allowed;
}
.tip-button-small {
  padding: 6px 8px;
  font-size: 12px;
}
.tip-editor {
  margin-top: 16px;
  padding: 16px;
  background: #f2f4f7;
  border-radius: 4px;
  box-shadow: 0 2px 6px #1018281a;
  min-width: 0;
}
.tip-editor-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.tip-editor-heading h3 {
  font-size: 14px;
  font-weight: 600;
}
.tip-editor-fields {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 16px;
}
.tip-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #344054;
  font-size: 11px;
  line-height: 16px;
  text-transform: uppercase;
}
.tip-field input,.tip-field select,.tip-search input {
  width: 100%;
  min-width: 0;
  border: 0;
  border-bottom: 1px solid #d0d5dd;
  background: #fff;
  padding: 10px 12px;
  border-radius: 0;
  color: #101828;
  font-size: 14px;
  text-transform: none;
  outline-offset: 2px;
}
.tip-field select {
  height: 42px;
  cursor: pointer;
}
.tip-amount-input {
  display: flex;
  align-items: center;
  background: #fff;
  border-bottom: 1px solid #d0d5dd;
}
.tip-amount-input input {
  border: 0;
  flex: 1;
  width: 0;
}
.tip-amount-input span {
  padding-right: 10px;
  color: #101828;
  font-size: 12px;
  text-transform: none;
  white-space: nowrap;
}
.tip-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #344054;
  cursor: pointer;
}
.tip-checkbox input {
  accent-color: #79ff82;
  width: 16px;
  height: 16px;
  margin: 0;
}
.tip-library {
  margin-top: 12px;
  min-width: 0;
  padding-left: 30px;
}
.tip-upload {
  border: 0;
  background: transparent;
  font-size: 12px;
  color: #98a2b3;
  padding: 4px 0;
  cursor: not-allowed;
}
.tip-search {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff;
  margin: 8px 0;
}
.tip-search svg {
  width: 16px;
  height: 16px;
  margin-left: 10px;
  flex-shrink: 0;
  color: #667085;
}
.tip-search input {
  border: 0;
  padding-left: 0;
  font-size: 12px;
}
.tip-library-list {
  height: 320px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  display: flex;
  flex-direction: column;
  gap: 0;
  align-content: start;
}
.tip-library-card {
  position: relative;
  display: flex;
  align-items: stretch;
  padding: 0;
  border: 0;
  background: transparent;
  color: #344054;
  text-align: left;
  cursor: pointer;
  flex-shrink: 0;
  min-width: 0;
}
.tip-library-card:nth-child(even) { background: #10182805; }
.tip-library-thumbnail {
  position: relative;
  width: 68px;
  height: 68px;
  flex-shrink: 0;
  background: #eaecf0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.tip-library-thumbnail > img { width: 100%; height: 100%; object-fit: cover; }
.tip-library-thumbnail > svg { width: 24px; height: 24px; color: #98a2b3; }
.tip-library-card-copy {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  padding: 8px;
}
.tip-library-card-copy strong {
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tip-select-badge {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: #ff0066;
  color: white;
  font-size: 16px;
  line-height: 24px;
  font-weight: 600;
  text-transform: uppercase;
  padding: 8px;
  border-radius: 6px;
  opacity: 0;
}
.tip-library-card:hover,.tip-library-card:focus-visible,.tip-card-selected {
  background: #fb5ba226 !important;
  border-radius: 6px;
}
.tip-library-card:hover .tip-select-badge,.tip-library-card:focus-visible .tip-select-badge,.tip-card-selected .tip-select-badge { opacity: 1; }
.tip-merch-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); grid-auto-rows: max-content; gap: 12px; }
.tip-media-grid {
  display: grid;
  grid-template-columns: repeat(2,minmax(0,1fr));
  grid-auto-rows: max-content;
  gap: 6px 2px;
}
.tip-media-grid .tip-library-card { flex-direction: column; padding: 6px; gap: 4px; background: transparent; border-radius: 6px; }
.tip-media-grid .tip-library-thumbnail { width: 100%; height: auto; aspect-ratio: 179/103; }
.tip-media-grid .tip-library-card-copy { padding: 0; justify-content: flex-start; }
.tip-media-grid .tip-library-card-copy strong { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; white-space: normal; font-weight: 500; overflow-wrap: anywhere; }
.tip-media-grid .tip-select-badge { left: 50%; right: auto; top: calc((100% - 48px) / 2); transform: translate(-50%, -50%); }
.tip-media-grid .tip-library-card:hover .tip-library-thumbnail,.tip-media-grid .tip-card-selected .tip-library-thumbnail { opacity: .7; }
.tip-media-badge {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  align-items: center;
  gap: 3px;
  background: #18223080;
  color: #fff;
  padding: 1px 4px;
  font-size: 12px;
  line-height: 18px;
}
.tip-media-badge img { width: 16px; height: 16px; filter: brightness(0) invert(1); }
.tip-media-badge svg { width: 16px; height: 16px; }
.tip-media-purchase { position: absolute; bottom: 0; left: 0; padding: 2px 6px; color: #fff; background: #ff0066; font-size: 12px; line-height: 18px; }
.tip-media-buy-only { background: #000b; }
.tip-library-message {
  padding: 16px 4px;
  font-size: 13px;
  color: #667085;
  grid-column: 1/-1;
}
.tip-load-more {
  font-size: 12px;
  padding: 10px;
  color: #344054;
  text-decoration: underline;
  grid-column: 1/-1;
  background: white;
  border: 0;
  cursor: pointer;
}
.tip-selected-prize { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; min-width: 0; }
.tip-selected-card {
  display: flex;
  align-items: stretch;
  width: 100%;
  min-width: 0;
  background: #fb3299;
  color: white;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 6px #1018281a;
}
.tip-selected-card > img { width: 92px; height: 68px; object-fit: cover; flex-shrink: 0; }
.tip-selected-card > svg { width: 32px; margin: 18px 30px; flex-shrink: 0; }
.tip-selected-copy { display: flex; flex: 1; min-width: 0; flex-direction: column; justify-content: center; gap: 8px; padding: 8px; }
.tip-selected-copy strong { font-size: 14px; line-height: 20px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tip-selected-copy :deep(.tip-prize-price) { color: #ffff00; font-size: 16px; line-height: 24px; }
.tip-selected-copy :deep(.tip-prize-regular-price) { color: #fff; }
.tip-selected-prize .tip-button { color: #07f468; font-weight: 500; }
.tip-editor-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding-top: 16px;
}
.tip-cancel,.tip-back {
  border: 0;
  background: transparent;
  color: #344054;
  font-size: 13px;
  cursor: pointer;
  padding: 6px;
}
.tip-help {
  font-size: 12px;
  color: #667085;
  margin-top: 8px;
}
.tip-error {
  font-size: 13px;
  color: #b42318;
  margin: 12px 0;
}
.tip-error button {
  text-decoration: underline;
}
.tip-library-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}
.tip-back {
  display: flex;
  align-items: center;
  gap: 6px;
}
.tip-back svg {
  width: 16px;
  height: 16px;
}
.tip-editor-mobile {
  position: fixed;
  inset: 0;
  z-index: 100000;
  background: #f9fafb;
  border-radius: 0;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  box-shadow: none;
  overflow: auto;
  color: #101828;
  font-family: inherit;
}
.tip-editor-mobile .tip-editor-heading {
  position: sticky;
  top: 0;
  z-index: 2;
  min-height: 56px;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #eaecf0;
  margin: 0;
  flex-shrink: 0;
}
.tip-editor-mobile .tip-editor-heading h3 {
  font-size: 16px;
}
.tip-editor-mobile .tip-editor-fields {
  padding: 24px 16px;
  flex: 1;
  justify-content: flex-start;
}
.tip-editor-mobile .tip-selected-prize { padding-left: 0; }
.tip-editor-mobile .tip-editor-footer {
  position: sticky;
  bottom: 0;
  background: #fff;
  padding: 16px;
  padding-bottom: max(16px,env(safe-area-inset-bottom));
  border-top: 1px solid #eaecf0;
  flex-shrink: 0;
  margin-top: auto;
}
.tip-editor-mobile .tip-editor-footer .tip-button {
  flex: 1;
  border-radius: 24px;
}
.tip-editor-mobile .tip-library {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  margin: 0;
  padding: 16px;
  overflow: hidden;
}
.tip-editor-mobile .tip-library-list {
  flex: 1;
  height: 0;
  min-height: 160px;
}
.tip-editor-mobile .tip-error {
  padding: 0 16px;
}
.tip-editor-mobile:has(.tip-library) {
  overflow: hidden;
}



</style>
