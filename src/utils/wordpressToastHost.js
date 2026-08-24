/**
 * The WordPress dashboard exposes a global `showToast` on the page that hosts our
 * embeds. Reaching it lets an embed raise a real dashboard notification instead of
 * one trapped inside its own iframe. Callers fall back to the in-app toast bus when
 * there is no host (standalone dev, a cross-origin parent, a non-WordPress page).
 */
export function wordpressToastHost() {
  if (typeof window === "undefined" || window.parent === window) return null;
  try {
    return typeof window.parent?.showToast === "function" ? window.parent : null;
  } catch (_error) {
    return null;
  }
}

export function escapeToastHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
