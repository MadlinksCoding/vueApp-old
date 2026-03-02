<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
  selectedItems: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue", "confirm", "cancel"]);

const tabs = [
  { key: "media", label: "Media" },
  { key: "subscription", label: "Subscription" },
  { key: "product", label: "Product" },
];

const activeTab = ref("media");
const searchQuery = ref("");
const draftSelected = ref([]);

function productKey(item = {}) {
  return `${String(item?.type || "").trim()}:${String(item?.id || "").trim()}`;
}

function normalizeSelectedItems(items = []) {
  const source = Array.isArray(items) ? items : [];
  const map = new Map();

  source.forEach((item) => {
    if (!item || typeof item !== "object") return;
    const id = String(item.id || "").trim();
    const type = String(item.type || "").trim();
    if (!id || !type) return;

    const key = `${type}:${id}`;
    if (map.has(key)) return;

    map.set(key, {
      id,
      type,
      title: String(item.title || "").trim(),
      tokenPrice: Number.isFinite(Number(item.tokenPrice)) ? Number(item.tokenPrice) : 0,
      usdPrice: Number.isFinite(Number(item.usdPrice)) ? Number(item.usdPrice) : 0,
      thumbnailUrl: String(item.thumbnailUrl || "").trim(),
      tags: Array.isArray(item.tags) ? item.tags.filter(Boolean).map(String) : [],
      actionLabel: String(item.actionLabel || "").trim() || "Buy",
    });
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
  }
);

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

function isSelected(item) {
  const key = productKey(item);
  return draftSelected.value.some((selected) => productKey(selected) === key);
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
      class="fixed inset-0 z-[9999] bg-black/35"
      @click.self="handleCancel"
    >
      <div class="absolute left-1/2 top-1/2 w-[min(33rem,calc(100vw-1.5rem))] max-h-[calc(100vh-1.5rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white shadow-[0px_10px_20px_rgba(16,24,40,0.15)] border border-gray-200 overflow-hidden">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <button type="button" class="text-sm text-slate-600 hover:text-slate-800" @click="handleCancel">Cancel</button>
          <div class="text-base font-semibold text-slate-800">Add Product</div>
          <div class="text-xs text-slate-500">{{ draftSelected.length }} selected</div>
        </div>

        <div class="px-4 pt-3 pb-2">
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

          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search media by name and tags..."
            class="mt-3 w-full rounded border border-gray-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
          />
        </div>

        <div class="max-h-[24rem] overflow-y-auto px-4 pb-3">
          <div v-if="filteredItems.length === 0" class="py-8 text-center text-sm text-slate-500">
            No products found for this tab.
          </div>

          <div v-else class="grid grid-cols-2 gap-3">
            <button
              v-for="item in filteredItems"
              :key="productKey(item)"
              type="button"
              class="text-left rounded border overflow-hidden transition"
              :class="isSelected(item) ? 'border-[#FF0080] ring-1 ring-[#FF0080]' : 'border-gray-200 hover:border-slate-300'"
              @click="toggleSelect(item)"
            >
              <img
                :src="item.thumbnailUrl"
                :alt="item.title"
                class="w-full h-24 object-cover"
              />
              <div class="p-2 bg-white">
                <div class="text-xs font-semibold text-slate-800 line-clamp-2">{{ item.title }}</div>
                <div class="mt-1 text-[11px] text-slate-500">{{ item.type }}</div>
                <div class="mt-1 text-[11px] text-slate-700">
                  {{ item.actionLabel }} {{ item.tokenPrice }} tokens
                </div>
              </div>
            </button>
          </div>
        </div>

        <div class="p-3 border-t border-gray-200">
          <button
            type="button"
            class="w-full h-10 bg-[#07F468] hover:bg-[#00dd5d] text-sm font-semibold text-slate-900 rounded"
            @click="handleConfirm"
          >
            Add to spending requirement
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>
