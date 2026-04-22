<script setup>
import { computed, ref, watch } from "vue";
import {
  MagnifyingGlassIcon,
  MusicalNoteIcon,
  PhotoIcon,
  RectangleStackIcon,
  VideoCameraIcon,
} from "@heroicons/vue/24/outline";
import { getSpendingRequirementMediaBadge } from "@/utils/spendingRequirementMediaBadge.js";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
  selectedItems: { type: Array, default: () => [] },
  loadingByType: { type: Object, default: () => ({}) },
  hasMoreByType: { type: Object, default: () => ({}) },
  errorByType: { type: Object, default: () => ({}) },
  confirmLabel: { type: String, default: "Add to spending requirement" },
  markAsChatPopup: { type: Boolean, default: false },
  includeRawItemData: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "confirm", "cancel", "tab-change", "load-more"]);

const tabs = [
  { key: "media", label: "Media" },
  { key: "subscription", label: "Subscription" },
  { key: "product", label: "Product" },
];

const activeTab = ref("media");
const searchQuery = ref("");
const draftSelected = ref([]);

const mediaBadgeIconComponents = {
  audio: MusicalNoteIcon,
  gallery: RectangleStackIcon,
  image: PhotoIcon,
  video: VideoCameraIcon,
};

const popupAttrs = computed(() => (props.markAsChatPopup ? { "data-fs-chat-popup": "" } : {}));

function productKey(item = {}) {
  return `${String(item?.type || "").trim()}:${String(item?.id || "").trim()}`;
}

function normalizeSelectedItems(items = []) {
  const source = Array.isArray(items) ? items : [];
  const map = new Map();

  source.forEach((item) => {
    if (!item || typeof item !== "object") return;
    const parsedId = Number(item.id);
    const id = Number.isFinite(parsedId) ? parsedId : null;
    const type = String(item.type || "").trim();
    if (id === null || !type) return;

    const key = `${type}:${id}`;
    if (map.has(key)) return;

    const normalized = {
      id,
      type,
      title: String(item.title || "").trim(),
      buyPrice: Number.isFinite(Number(item.buyPrice)) ? Number(item.buyPrice) : 0,
      subscribePrice: Number.isFinite(Number(item.subscribePrice)) ? Number(item.subscribePrice) : 0,
      thumbnailUrl: String(item.thumbnailUrl || "").trim(),
      tags: Array.isArray(item.tags) ? item.tags.filter(Boolean).map(String) : [],
    };

    if (props.includeRawItemData) {
      normalized.raw = item.raw && typeof item.raw === "object" ? item.raw : item;
    }

    map.set(key, normalized);
  });

  return Array.from(map.values());
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    draftSelected.value = normalizeSelectedItems(props.selectedItems);
    searchQuery.value = "";
    activeTab.value = "media";
    emit("tab-change", "media");
  }
);

watch(activeTab, (tab) => {
  emit("tab-change", tab);
});

const filteredItems = computed(() => {
  const source = Array.isArray(props.items) ? props.items : [];
  const tab = activeTab.value;
  const query = String(searchQuery.value || "").trim().toLowerCase();

  return source.filter((item) => {
    if (String(item?.type || "").toLowerCase() !== tab) return false;
    if (!query) return true;

    const title = String(item?.title || "").toLowerCase();
    const tags = Array.isArray(item?.tags) ? item.tags.join(" ").toLowerCase() : "";
    return title.includes(query) || tags.includes(query);
  });
});

const activeTabLoading = computed(() => Boolean(props.loadingByType?.[activeTab.value]));
const activeTabHasMore = computed(() => Boolean(props.hasMoreByType?.[activeTab.value]));
const activeTabError = computed(() => String(props.errorByType?.[activeTab.value] || ""));

function handleListScroll(event) {
  if (activeTabLoading.value || !activeTabHasMore.value || String(searchQuery.value || "").trim()) return;

  const target = event?.target;
  if (!target) return;

  const thresholdPx = 56;
  const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - thresholdPx;
  if (nearBottom) {
    emit("load-more", activeTab.value);
  }
}

function isSelected(item) {
  const key = productKey(item);
  return draftSelected.value.some((selected) => productKey(selected) === key);
}

function mediaBadgeForItem(item) {
  return getSpendingRequirementMediaBadge(item);
}

function toggleSelect(item) {
  const key = productKey(item);
  const index = draftSelected.value.findIndex((selected) => productKey(selected) === key);

  if (index >= 0) {
    const next = [...draftSelected.value];
    next.splice(index, 1);
    draftSelected.value = next;
    return;
  }

  draftSelected.value = normalizeSelectedItems([...draftSelected.value, item]);
}

function closePopup() {
  emit("update:modelValue", false);
}

function handleCancel() {
  emit("cancel");
  closePopup();
}

function handleConfirm() {
  emit("confirm", normalizeSelectedItems(draftSelected.value));
  closePopup();
}

</script>

<template>
  <teleport to="body">
    <div
      v-if="modelValue"
      v-bind="popupAttrs"
      class="fixed inset-0 z-[9999] bg-black/35"
      @click.self="handleCancel"
    >
      <div class="absolute left-0 top-0 w-full h-full  w-full h-full md:h-auto md:left-1/2 md:top-1/2 md:w-[min(33rem,calc(100vw-1.5rem))] md:max-h-[calc(100vh-1.5rem)] md:-translate-x-1/2 md:-translate-y-1/2 rounded-none md:rounded-lg bg-white shadow-none md:shadow-[0px_10px_20px_rgba(16,24,40,0.15)] border-0 md:border md:border-gray-200 overflow-hidden flex flex-col">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <button type="button" class="text-sm text-slate-700 hover:text-slate-800" @click="handleCancel">Cancel</button>
          <div class="text-base font-medium text-slate-700">Add Product</div>
          <div class="text-xs text-slate-600">{{ draftSelected.length }} selected</div>
        </div>

        <div class="px-4 pt-3 pb-2 flex flex-col gap-[0.625rem]">
          <div class="inline-flex w-full rounded border border-gray-200 bg-gray-50 overflow-hidden">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              type="button"
              class="flex-1 px-3 py-2 text-xs font-semibold transition"
              :class="activeTab === tab.key ? 'bg-[#FF0080] text-white' : 'text-slate-600 hover:bg-white'"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>
        <div class="relative w-full">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by name and tags..."
              class="bg-transparent w-full pl-10 pr-3 py-2 outline-none border-b border-gray-200 text-gray-900 placeholder:text-gray-900 rounded-t-[2px] border-b border-[#D0D5DD] bg-white/50 shadow-sm focus:bg-white/90 transition-colors"
            />
          </div>
        </div>

        <div class="md:max-h-[24rem] overflow-y-auto px-4 pb-16 md:pb-3" @scroll="handleListScroll">
          <div v-if="activeTabError" class="py-4 text-center text-sm text-rose-600">
            {{ activeTabError }}
          </div>

          <div v-if="filteredItems.length === 0 && !activeTabLoading" class="py-8 text-center text-sm text-slate-500">
            No products found for this tab.
          </div>

          <div v-else class="grid grid-cols-2 gap-3">
            <button
              v-for="item in filteredItems"
              :key="productKey(item)"
              type="button"
              class="text-left rounded overflow-hidden transition p-[0.375rem] flex flex-col gap-1"
              :class="isSelected(item) ? 'border border-[#FF0080] bg-[rgba(255,0,102,0.10)]' : ''"
              @click="toggleSelect(item)"
            >
              <div class="relative">
                <div
                  v-if="mediaBadgeForItem(item)"
                  class="absolute left-0 top-0 bg-[rgba(24,34,48,0.5)] px-1 py-[1px] flex items-center gap-[0.188rem]"
                >
                  <component
                    :is="mediaBadgeIconComponents[mediaBadgeForItem(item).icon] || PhotoIcon"
                    class="w-3 h-3 text-white"
                    aria-hidden="true"
                  />
                  <span v-if="mediaBadgeForItem(item).label" class="text-xs text-white">
                    {{ mediaBadgeForItem(item).label }}
                  </span>
                </div>
                <img
                  :src="item.thumbnailUrl"
                  :alt="item.title"
                  class="w-full aspect-[179/103] object-cover"
                />
                <div class="absolute bottom-0 left-0 py-1 px-[0.375rem] bg-[#F06] h-[22px] flex items-center justify-center">
                  <span class="text-xs text-white"> Subscribe or Buy </span>
                </div>
                <!--<div class="absolute bottom-0 left-0 bg-black/50 backdrop-blur-md py-1 px-[0.375rem] bg-black/70 h-[22px] flex items-center justify-center">
                  <span class="text-xs text-white">Buy Now </span>
                </div>-->
              </div>
              <div class="">
                <div class="text-sm font-semibold text-gray-950 line-clamp-2">{{ item.title }}</div>
                <!-- <div class="mt-1 text-[11px] text-slate-500">{{ item.type }}</div> -->
                <!--<div class="flex gap-3">
                  <div v-if="item.buyPrice" class="mt-1 text-[11px] text-slate-700">
                    Buy USD${{ item.buyPrice }}
                  </div>

                  <div v-if="item.subscribePrice" class="mt-1 text-[11px] text-slate-700">
                    Subscribe USD${{ item.subscribePrice }}
                  </div>

                  <div v-if="!item.buyPrice && !item.subscribePrice" class="mt-1 text-[11px] text-slate-700">
                    FREE
                  </div>
                </div> -->
              </div>
            </button>
          </div>

          <div v-if="activeTabLoading" class="py-4 text-center text-xs text-slate-500">
            Loading more...
          </div>
        </div>

        <div class="p-3 md:border-t md:border-gray-200 absolute bottom-0 w-full md:static">
          <button
            type="button"
            class="w-full h-10 bg-[#07F468] hover:bg-[#00dd5d] text-sm font-semibold text-slate-900 rounded"
            @click="handleConfirm"
          >
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>
