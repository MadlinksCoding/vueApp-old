const GUEST_SESSION_KEY = 'fan_guest_session_id';
const GUEST_PREFIX = 123;

export function resolveGuestSessionId() {
  try {
    const stored = sessionStorage.getItem(GUEST_SESSION_KEY);
    if (stored) {
      const parsed = Number(stored);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }

    const random = Math.floor(Math.random() * 9000) + 1000; // 7 digits: 1000000–9999999
    const guestId = Number(`${GUEST_PREFIX}${random}`);
    sessionStorage.setItem(GUEST_SESSION_KEY, String(guestId));
    return guestId;
  } catch {
    // sessionStorage unavailable (e.g. private browsing restrictions)
    return Number(`${GUEST_PREFIX}${Math.floor(Math.random() * 9_000_000) + 1_000_000}`);
  }
}
