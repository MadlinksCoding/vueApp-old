<template>
  <div class="fixed top-4 right-4 z-[1200] flex flex-col gap-2 pointer-events-none">
    <transition-group name="toast-fade" tag="div" class="flex flex-col gap-2">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto min-w-[260px] max-w-[360px] rounded-md border px-3 py-2 shadow-lg backdrop-blur-sm"
        :class="toastClass(toast.type)">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-xs font-semibold uppercase tracking-wide">{{ toast.title }}</div>
            <div class="text-sm leading-5">{{ toast.message }}</div>
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

<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { toastEventName } from "@/utils/toastBus.js";

const toasts = ref([]);
let nextToastId = 1;

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

function onToastEvent(event) {
  const detail = event?.detail || {};
  const id = nextToastId;
  nextToastId += 1;

  const toast = {
    id,
    type: detail.type || "error",
    title: detail.title || "Notice",
    message: detail.message || "Something went wrong.",
    duration: Number.isFinite(Number(detail.duration)) ? Number(detail.duration) : 4500,
  };

  toasts.value = [...toasts.value, toast];

  window.setTimeout(() => {
    removeToast(id);
  }, toast.duration);
}

onMounted(() => {
  document.addEventListener(toastEventName, onToastEvent);
});

onBeforeUnmount(() => {
  document.removeEventListener(toastEventName, onToastEvent);
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
