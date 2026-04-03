/**
 * Safely resolves the WordPress userData object from the parent window.
 *
 * When the chat widget runs inside an iframe outside WordPress, window.userData
 * is set on the parent page (WordPress), not on the iframe's own window.
 * Accessing window.parent may throw a cross-origin security error, so we wrap
 * it in try/catch and fall back to window.userData on the current window.
 *
 * @returns {object|null} The userData object, or null if not available.
 */
export function resolveParentUserData() {
  try {
    return window.parent?.userData ?? window.userData ?? null
  } catch {
    return window.userData ?? null
  }
}
