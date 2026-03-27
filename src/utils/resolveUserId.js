import { useAuthStore } from '@/stores/useAuthStore';

let hasWarnedMissingUserId = false;

/**
 * Resolves the current user ID from available sources.
 * 1. window.userData?.userID  — injected by WordPress
 * 2. Pinia auth store currentUser.raw.sub (Cognito JWT subject)
 * Returns null if neither is available.
 */
export function resolveUserId() {
  if (window.userData?.userID) {
    return String(window.userData.userID).trim();
  }
  try {
    const auth = useAuthStore();
    const sub = auth.currentUser?.raw?.sub;
    if (sub) return String(sub).trim();
    // localStorage fallback (legacy, not recommended)
    const lsUserId = localStorage.getItem('userId');
    if (lsUserId) return String(lsUserId).trim();
  } catch {
    // Pinia not ready
  }

  if (!hasWarnedMissingUserId && typeof window !== 'undefined') {
    hasWarnedMissingUserId = true;
    console.warn(
      '[resolveUserId] Unable to resolve user ID. For local testing you can run localStorage.setItem("userId", "123").'
    );
  }

  return null;
}
