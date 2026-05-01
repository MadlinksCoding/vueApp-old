import { computed, ref, watch } from "vue";

export function useEventBackgroundImage(eventRef, fallbackUrl) {
  const resolvedBackgroundImageUrl = ref(fallbackUrl);
  let backgroundImageRequestId = 0;

  const candidateImageUrl = computed(() => {
    const event = eventRef?.value ?? eventRef ?? null;
    const candidate = event?.eventImageUrl || event?.raw?.eventImageUrl || "";
    return typeof candidate === "string" ? candidate.trim() : "";
  });

  watch(
    candidateImageUrl,
    (nextUrl) => {
      backgroundImageRequestId += 1;
      const requestId = backgroundImageRequestId;

      if (!nextUrl) {
        resolvedBackgroundImageUrl.value = fallbackUrl;
        return;
      }

      if (typeof Image === "undefined") {
        resolvedBackgroundImageUrl.value = nextUrl || fallbackUrl;
        return;
      }

      const probe = new Image();
      probe.onload = () => {
        if (requestId !== backgroundImageRequestId) return;
        resolvedBackgroundImageUrl.value = nextUrl;
      };
      probe.onerror = () => {
        if (requestId !== backgroundImageRequestId) return;
        resolvedBackgroundImageUrl.value = fallbackUrl;
      };
      probe.src = nextUrl;
    },
    { immediate: true },
  );

  return {
    resolvedBackgroundImageUrl,
    candidateImageUrl,
  };
}
