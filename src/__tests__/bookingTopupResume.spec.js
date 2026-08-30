import { describe, expect, it, vi } from "vitest";

import { resumePriceAdjustmentAfterTopup } from "@/utils/bookingTopupResume.js";

function readiness(overrides = {}) {
  return { ready: true, reason: "ready", balance: 110, attempts: 1, elapsedMs: 0, ...overrides };
}

function failure({ statusCode, code = `HTTP_${statusCode}`, backendError = "other_error" }) {
  return { ok: false, error: "write failed", statusCode, code, backendError };
}

function setup({ waits = [readiness()], outcomes = [{ ok: true, item: { bookingId: "booking_1" } }] } = {}) {
  const decisionState = {
    markTopupCompleted: vi.fn(),
    reportError: vi.fn(),
    waitForRequiredBalance: vi.fn(),
  };
  waits.forEach((result) => decisionState.waitForRequiredBalance.mockResolvedValueOnce(result));
  const applyAdjustment = vi.fn();
  outcomes.forEach((result) => applyAdjustment.mockResolvedValueOnce(result));
  return { decisionState, applyAdjustment };
}

describe("resumePriceAdjustmentAfterTopup", () => {
  it("waits for readiness before applying the adjustment", async () => {
    let resolveReadiness;
    const { decisionState, applyAdjustment } = setup({ waits: [] });
    decisionState.waitForRequiredBalance.mockReturnValue(new Promise((resolve) => { resolveReadiness = resolve; }));

    const pending = resumePriceAdjustmentAfterTopup({
      decisionState,
      minimumBalanceTokens: 100,
      applyAdjustment,
    });
    await Promise.resolve();
    expect(applyAdjustment).not.toHaveBeenCalled();

    resolveReadiness(readiness());
    await expect(pending).resolves.toEqual(expect.objectContaining({ ok: true, stage: "complete", retried: false }));
    expect(applyAdjustment).toHaveBeenCalledTimes(1);
    expect(decisionState.markTopupCompleted).toHaveBeenCalledWith(true);
  });

  it("rechecks and retries exactly once for structured held-payment HTTP 402", async () => {
    const heldPayment402 = failure({ statusCode: 402, backendError: "token_hold_adjustment_failed" });
    const { decisionState, applyAdjustment } = setup({
      waits: [readiness(), readiness()],
      outcomes: [heldPayment402, { ok: true, item: { bookingId: "booking_1" } }],
    });

    const result = await resumePriceAdjustmentAfterTopup({
      decisionState,
      minimumBalanceTokens: 100,
      applyAdjustment,
    });

    expect(result).toEqual(expect.objectContaining({ ok: true, retried: true }));
    expect(decisionState.waitForRequiredBalance).toHaveBeenCalledTimes(2);
    expect(applyAdjustment).toHaveBeenCalledTimes(2);
  });

  it.each([
    failure({ statusCode: 400 }),
    failure({ statusCode: 409 }),
    failure({ statusCode: 402, backendError: "booking_payment_hold_expired" }),
    { ok: false, error: "Timed out", code: "FLOW_TIMEOUT", statusCode: null, backendError: "" },
  ])("does not retry unrelated write failures: $code/$backendError", async (outcome) => {
    const { decisionState, applyAdjustment } = setup({ outcomes: [outcome] });

    const result = await resumePriceAdjustmentAfterTopup({
      decisionState,
      minimumBalanceTokens: 100,
      applyAdjustment,
    });

    expect(result).toEqual(expect.objectContaining({ ok: false, stage: "action", retried: false }));
    expect(decisionState.waitForRequiredBalance).toHaveBeenCalledTimes(1);
    expect(applyAdjustment).toHaveBeenCalledTimes(1);
  });

  it("preserves the completed top-up when readiness times out", async () => {
    const timeout = readiness({ ready: false, reason: "timeout", balance: 10, elapsedMs: 15000 });
    const { decisionState, applyAdjustment } = setup({ waits: [timeout] });

    const result = await resumePriceAdjustmentAfterTopup({
      decisionState,
      minimumBalanceTokens: 100,
      applyAdjustment,
    });

    expect(result).toEqual(expect.objectContaining({ ok: false, stage: "balance", readiness: timeout }));
    expect(decisionState.markTopupCompleted).toHaveBeenCalledWith(true);
    expect(applyAdjustment).not.toHaveBeenCalled();
  });

  it("does not write after cancellation", async () => {
    const aborted = readiness({ ready: false, reason: "aborted", balance: 10 });
    const { decisionState, applyAdjustment } = setup({ waits: [aborted] });
    const controller = new AbortController();
    controller.abort();

    const result = await resumePriceAdjustmentAfterTopup({
      decisionState,
      minimumBalanceTokens: 100,
      applyAdjustment,
      signal: controller.signal,
    });

    expect(result).toEqual(expect.objectContaining({ ok: false, stage: "balance" }));
    expect(applyAdjustment).not.toHaveBeenCalled();
  });
});
