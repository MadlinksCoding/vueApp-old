import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import TokenHandler from "@/utils/TokenHandler.js";

describe("TokenHandler.waitForBalance", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-29T00:00:00Z"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  function waitForBalance(overrides = {}) {
    return TokenHandler.waitForBalance({
      userId: 25,
      receiverId: 1407,
      minimumBalance: 110,
      timeoutMs: 15000,
      delaysMs: [250, 500, 1000, 2000],
      ...overrides,
    });
  }

  it("resolves immediately when the usable balance is already sufficient", async () => {
    vi.spyOn(TokenHandler, "get").mockResolvedValue(110);

    await expect(waitForBalance()).resolves.toEqual(expect.objectContaining({
      ready: true,
      reason: "ready",
      balance: 110,
      attempts: 1,
    }));
  });

  it("keeps polling stale balances until the top-up is visible", async () => {
    vi.spyOn(TokenHandler, "get")
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(110);

    const pending = waitForBalance();
    await vi.advanceTimersByTimeAsync(250);
    await vi.advanceTimersByTimeAsync(500);

    await expect(pending).resolves.toEqual(expect.objectContaining({
      ready: true,
      reason: "ready",
      balance: 110,
      attempts: 3,
    }));
    expect(TokenHandler.get).toHaveBeenCalledTimes(3);
  });

  it("recovers from transient lookup failures", async () => {
    vi.spyOn(TokenHandler, "get")
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(110);

    const pending = waitForBalance();
    await vi.advanceTimersByTimeAsync(750);

    await expect(pending).resolves.toEqual(expect.objectContaining({
      ready: true,
      reason: "ready",
      balance: 110,
      attempts: 3,
    }));
  });

  it("times out after the bounded wait when a valid balance remains insufficient", async () => {
    vi.spyOn(TokenHandler, "get").mockResolvedValue(10);

    const pending = waitForBalance({ timeoutMs: 15000 });
    await vi.advanceTimersByTimeAsync(15000);

    await expect(pending).resolves.toEqual(expect.objectContaining({
      ready: false,
      reason: "timeout",
      balance: 10,
      elapsedMs: 15000,
    }));
  });

  it("distinguishes an unavailable balance lookup from insufficient balance", async () => {
    vi.spyOn(TokenHandler, "get").mockResolvedValue(null);

    const pending = waitForBalance({ timeoutMs: 500 });
    await vi.advanceTimersByTimeAsync(500);

    await expect(pending).resolves.toEqual(expect.objectContaining({
      ready: false,
      reason: "unavailable",
      balance: null,
    }));
  });

  it("aborts promptly when the owning view is torn down", async () => {
    vi.spyOn(TokenHandler, "get").mockResolvedValue(10);
    const controller = new AbortController();

    const pending = waitForBalance({ signal: controller.signal });
    await Promise.resolve();
    controller.abort();

    await expect(pending).resolves.toEqual(expect.objectContaining({
      ready: false,
      reason: "aborted",
      balance: 10,
    }));
    expect(vi.getTimerCount()).toBe(0);
  });

  it("bounds an in-flight lookup that never settles", async () => {
    vi.spyOn(TokenHandler, "get").mockReturnValue(new Promise(() => {}));

    const pending = waitForBalance({ timeoutMs: 15000 });
    await vi.advanceTimersByTimeAsync(15000);

    await expect(pending).resolves.toEqual(expect.objectContaining({
      ready: false,
      reason: "unavailable",
      elapsedMs: 15000,
    }));
    expect(vi.getTimerCount()).toBe(0);
  });

  it("aborts an in-flight lookup even when the fetch promise has not settled", async () => {
    vi.spyOn(TokenHandler, "get").mockReturnValue(new Promise(() => {}));
    const controller = new AbortController();

    const pending = waitForBalance({ signal: controller.signal });
    controller.abort();

    await expect(pending).resolves.toEqual(expect.objectContaining({
      ready: false,
      reason: "aborted",
    }));
    expect(vi.getTimerCount()).toBe(0);
  });
});
