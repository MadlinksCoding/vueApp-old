<template>
  <div
    v-if="isActiveHost"
    class="fixed top-4 right-4 z-[100000] flex flex-col gap-2 pointer-events-none">
    <transition-group name="toast-fade" tag="div" class="flex flex-col gap-2">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="isBookingToast(toast)
          ? 'pointer-events-auto fixed left-1/2 top-2 w-[calc(100vw-1rem)] max-w-[37.5rem] -translate-x-1/2 overflow-hidden border shadow-lg backdrop-blur-sm'
          : ['pointer-events-auto min-w-[260px] max-w-[360px] rounded-md border px-3 py-2 shadow-lg backdrop-blur-sm', toastClass(toast.type)]">
        <div
          v-if="isBookingToast(toast)"
          class="flex min-h-[5rem] items-center gap-4 border-l-4 px-4 py-3 pr-12"
          :class="toast.status === 'confirmed'
            ? 'border-[#22CCB2] bg-gradient-to-r from-[#E4FAF7] to-white text-[#107E73]'
            : 'border-[#FF4405] bg-gradient-to-r from-[#FFF0EB] to-white text-[#A52A16]'"
          data-test="creator-booking-review-toast"
        >
          <div class="relative h-12 w-12 shrink-0">
            <img
              v-if="toast.avatarUrl"
              :src="toast.avatarUrl"
              :alt="toast.avatarAlt"
              class="h-12 w-12 rounded-full object-cover"
            />
            <div v-else class="flex h-12 w-12 items-center justify-center rounded-full bg-[#FCE40D] text-sm font-semibold text-slate-700">
              {{ String(toast.avatarAlt || '?').charAt(0).toUpperCase() }}
            </div>
            <span
              class="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-white"
              :class="toast.status === 'confirmed' ? 'bg-[#22CCB2]' : 'bg-[#FF4405]'"
              aria-hidden="true"
            >{{ toast.status === 'confirmed' ? '✓' : '×' }}</span>
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-sm font-semibold leading-5 sm:text-base sm:leading-6">{{ toast.title }}</div>
            <template v-if="toast.variant === 'booking-decision'">
              <div class="mt-1 text-sm leading-5 text-slate-700">{{ toast.message }}</div>
              <button
                v-if="toast.detailAction"
                class="mt-1 inline-flex items-center gap-1 text-xs font-semibold underline"
                type="button"
                data-test="booking-decision-toast-detail"
                @click="toast.detailAction.run()"
              >
                {{ toast.detailAction.label }}
                <span aria-hidden="true">↗</span>
              </button>
            </template>
          </div>
          <button
            class="absolute right-4 top-4 text-xl leading-none text-slate-400 hover:text-slate-600"
            type="button"
            :aria-label="toast.closeLabel"
            @click="removeToast(toast.id)"
          >×</button>
        </div>
        <div class="flex items-start justify-between gap-3">
          <template v-if="!isBookingToast(toast)">
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
          </template>
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

function isBookingToast(toast) {
  return toast.variant === "booking-review" || toast.variant === "booking-decision";
}

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
    variant: detail.variant || "default",
    status: detail.status || "",
    avatarUrl: detail.avatarUrl || "",
    avatarAlt: detail.avatarAlt || "",
    closeLabel: detail.closeLabel || "Close",
    detailAction: detail.detailAction && typeof detail.detailAction.run === "function"
      ? { ...detail.detailAction }
      : null,
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
