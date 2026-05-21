/**
 * Safely post a structured message to the parent window.
 *
 * No-ops silently when window.parent is inaccessible
 * (cross-origin, sandboxed iframe, or same-window context).
 *
 * @param {string} type    - Message type string (e.g. 'FS_CHAT_EVENT')
 * @param {*}      [payload] - Optional payload — must be structured-clone-able
 */
export function postToParent(type, payload) {
  try {
    const message = payload !== undefined ? { type, payload } : { type }
    window.parent.postMessage(message, '*')
  } catch (_) {}
}
