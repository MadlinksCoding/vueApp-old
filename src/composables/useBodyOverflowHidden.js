// src/composables/useBodyOverflowHidden.js
import { onMounted, onUnmounted } from "vue";

export function useBodyOverflowHidden(options = {}) {
  const {
    className = "overflow-hidden",
    minWidth = 1009, // 👈 only apply above this width
    target = typeof document !== "undefined" ? document.body : null,
  } = options;

  let isApplied = false;

  const applyLock = () => {
    if (!target) return;

    if (window.innerWidth > minWidth) {
      if (!isApplied) {
        target.classList.add(className);
        isApplied = true;
      }
    } else {
      if (isApplied) {
        target.classList.remove(className);
        isApplied = false;
      }
    }
  };

  onMounted(() => {
    applyLock();
    window.addEventListener("resize", applyLock);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", applyLock);
    if (target && isApplied) {
      target.classList.remove(className);
    }
  });
}