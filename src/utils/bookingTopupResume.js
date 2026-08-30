import { isHeldPaymentBalanceFailure } from "@/composables/useBookingActions.js";

export const BOOKING_TOPUP_BALANCE_TIMEOUT_MS = 15000;

/**
 * Resume a price adjustment only after the top-up credit is visible to the token
 * service. A single structured 402 hold-adjustment failure is safe to retry: the
 * booking manager returns before persisting the renegotiation when hold adjustment
 * fails, and the token hold adjustment itself is idempotent.
 */
export async function resumePriceAdjustmentAfterTopup({
  decisionState,
  minimumBalanceTokens,
  applyAdjustment,
  signal,
  timeoutMs = BOOKING_TOPUP_BALANCE_TIMEOUT_MS,
} = {}) {
  const startedAt = Date.now();
  const totalTimeout = Math.max(0, Number(timeoutMs) || 0);
  const remainingMs = () => Math.max(0, totalTimeout - Math.max(0, Date.now() - startedAt));

  decisionState?.markTopupCompleted?.(true);
  decisionState?.reportError?.("");
  decisionState?.reportBalanceError?.("");

  const readiness = await decisionState.waitForRequiredBalance(minimumBalanceTokens, {
    timeoutMs: remainingMs(),
    signal,
  });
  if (!readiness?.ready) {
    return { ok: false, stage: "balance", readiness, outcome: null, retried: false };
  }

  let outcome = await applyAdjustment();
  let retried = false;
  if (!outcome?.ok && isHeldPaymentBalanceFailure(outcome) && remainingMs() > 0 && !signal?.aborted) {
    retried = true;
    const retryReadiness = await decisionState.waitForRequiredBalance(minimumBalanceTokens, {
      timeoutMs: remainingMs(),
      initialDelayMs: Math.min(500, remainingMs()),
      signal,
    });
    if (!retryReadiness?.ready) {
      return { ok: false, stage: "balance", readiness: retryReadiness, outcome, retried };
    }
    outcome = await applyAdjustment();
  }

  return {
    ok: Boolean(outcome?.ok),
    stage: outcome?.ok ? "complete" : "action",
    readiness,
    outcome,
    retried,
  };
}

export default resumePriceAdjustmentAfterTopup;
