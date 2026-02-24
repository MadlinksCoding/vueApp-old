const TOAST_EVENT_NAME = "app:toast";

function normalizeToast(input) {
  if (typeof input === "string") {
    return {
      message: input,
      type: "error",
      title: "Notice",
      duration: 4500,
    };
  }

  return {
    message: input?.message || "Something went wrong.",
    type: input?.type || "error",
    title: input?.title || "Notice",
    duration: Number.isFinite(Number(input?.duration)) ? Number(input.duration) : 4500,
  };
}

export function showToast(input) {
  const toast = normalizeToast(input);

  if (typeof document === "undefined") {
    return;
  }

  document.dispatchEvent(new CustomEvent(TOAST_EVENT_NAME, { detail: toast }));
}

export const toastEventName = TOAST_EVENT_NAME;
