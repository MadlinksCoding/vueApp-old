<template>
  <div
    v-if="isActiveHost"
    class="fixed top-4 right-4 z-[100000] flex flex-col gap-2 pointer-events-none">
    <transition-group name="toast-fade" tag="div" class="flex flex-col gap-2">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto min-w-[260px] max-w-[360px] rounded-md border px-3 py-2 shadow-lg backdrop-blur-sm"
        :class="toastClass(toast.type)">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-xs font-semibold uppercase tracking-wide">{{ toast.title }}</div>
            <div class="text-sm leading-5 whitespace-pre-line">{{ toast.message }}</div>
            <button
              v-if="toast.action?.type === 'copy'"
              class="mt-2 rounded border border-current px-2 py-1 text-xs font-semibold hover:bg-black/5 disabled:cursor-default disabled:opacity-70"
              type="button"
              :aria-label="toastActionLabel(toast)"
              :disabled="toast.actionState === 'copied'"
              @click="runToastAction(toast)"
            >
              {{ toastActionLabel(toast) }}
            </button>
            <span class="sr-only" aria-live="polite">{{ toast.actionAnnouncement }}</span>
          </div>
          <button
            class="text-xs opacity-70 hover:opacity-100"
            type="button"
            @click="removeToast(toast.id)">
            Close
          </button>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script>
import { ref } from "vue";
import { toastEventName } from "@/utils/toastBus.js";

const toasts = ref([]);
const mountedHostIds = ref([]);
let nextToastId = 1;
let nextHostId = 1;
let listenerCount = 0;
let listenerAttached = false;

function toastClass(type) {
  if (type === "success") {
    return "bg-green-50 border-green-200 text-green-800";
  }
  if (type === "warning") {
    return "bg-amber-50 border-amber-200 text-amber-800";
  }
  if (type === "info") {
    return "bg-sky-50 border-sky-200 text-sky-800";
  }
  return "bg-red-50 border-red-200 text-red-800";
}

function removeToast(id) {
  toasts.value = toasts.value.filter((toast) => toast.id !== id);
}

function toastActionLabel(toast) {
  if (toast.actionState === "copied") return toast.action?.successLabel || "Copied";
  if (toast.actionState === "failed") return toast.action?.failureLabel || "Copy failed";
  return toast.action?.label || "Copy";
}

async function copyText(value) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand("copy");
  input.remove();
  if (!copied) throw new Error("Clipboard copy failed");
}

async function runToastAction(toast) {
  if (toast.action?.type !== "copy" || toast.actionState === "copied") return;
  try {
    await copyText(String(toast.action.value || ""));
    toast.actionState = "copied";
    toast.actionAnnouncement = toast.action?.successLabel || "Copied";
  } catch (_) {
    toast.actionState = "failed";
    toast.actionAnnouncement = toast.action?.failureLabel || "Copy failed";
  }
}

function onToastEvent(event) {
  const detail = event?.detail || {};
  if (detail.dedupeKey) {
    const existing = toasts.value.find((toast) => toast.dedupeKey === detail.dedupeKey);
    if (existing) removeToast(existing.id);
  }
  const id = nextToastId;
  nextToastId += 1;

  const toast = {
    id,
    type: detail.type || "error",
    title: detail.title || "Notice",
    message: detail.message || "Something went wrong.",
    duration: Number.isFinite(Number(detail.duration)) ? Number(detail.duration) : 4500,
    autoClose: detail.persistent === true ? false : detail.autoClose !== false,
    action: detail.action && typeof detail.action === "object" ? { ...detail.action } : null,
    actionState: "idle",
    actionAnnouncement: "",
    dedupeKey: typeof detail.dedupeKey === "string" ? detail.dedupeKey : "",
  };

  toasts.value = [...toasts.value, toast];

  if (toast.autoClose && toast.duration > 0) {
    window.setTimeout(() => {
      removeToast(id);
    }, toast.duration);
  }
}

function attachToastListener() {
  if (listenerAttached || typeof document === "undefined") {
    return;
  }
  document.addEventListener(toastEventName, onToastEvent);
  listenerAttached = true;
}

function detachToastListener() {
  if (!listenerAttached || typeof document === "undefined") {
    return;
  }
  document.removeEventListener(toastEventName, onToastEvent);
  listenerAttached = false;
}

export default {
  name: "ToastHost",
};
</script>

<script setup>
import { computed, onBeforeUnmount, onMounted } from "vue";

const hostId = nextHostId;
nextHostId += 1;

const isActiveHost = computed(() => mountedHostIds.value[0] === hostId);

onMounted(() => {
  mountedHostIds.value = [...mountedHostIds.value, hostId];
  listenerCount += 1;
  attachToastListener();
});

onBeforeUnmount(() => {
  mountedHostIds.value = mountedHostIds.value.filter((id) => id !== hostId);
  listenerCount = Math.max(0, listenerCount - 1);

  if (listenerCount === 0) {
    detachToastListener();
    toasts.value = [];
    nextToastId = 1;
  }
});
</script>

<style scoped>
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.2s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
