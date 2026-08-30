import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The host is a plain IIFE; eval keeps each mount independent (import would cache it).
function mountHost(userRole = "fan") {
  const hostSource = readFileSync(
    resolve(process.cwd(), "public/bookings-embed/fs-chat-host.js"),
    "utf8",
  );
  window.eval(hostSource);

  return window.FSChatEmbed.mountChatEmbed(document.body, {
    src: "/bookings-embed/chat.html",
    currentUserId: "2615",
    userRole,
    apiBaseUrl: "http://localhost:3001",
  });
}

// The host only trusts messages coming from its own iframe.
function answer(handle, requestId, data, type = "FS_CHAT_RESPONSE") {
  window.dispatchEvent(new MessageEvent("message", {
    source: handle.iframe.contentWindow,
    data: { type, payload: { requestId, data } },
  }));
}

function requestIdFrom(postMessage, type) {
  const call = postMessage.mock.calls.find(([message]) => message?.type === type);
  return call?.[0]?.payload?.requestId;
}

describe("fs-chat-host RPC", () => {
  let handle;
  let postMessage;

  beforeEach(() => {
    delete window.__fsTokenBalanceUiRefreshState;
    delete window.tokenManager;
    delete window.openTipPopup;
    handle = mountHost();
    postMessage = vi.spyOn(handle.iframe.contentWindow, "postMessage");
  });

  afterEach(() => {
    handle.destroy();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("exposes the read APIs on the handle", () => {
    expect(typeof handle.getChat).toBe("function");
    expect(typeof handle.getMessage).toBe("function");
    expect(typeof handle.getState).toBe("function");
  });

  it("resolves getMessage with the embed's answer", async () => {
    const pending = handle.getMessage({ chatId: "chat_1", messageId: "message_1" });

    const [message] = postMessage.mock.calls.at(-1);
    expect(message.type).toBe("FS_CHAT_GET_MESSAGE");
    expect(message.payload).toEqual(expect.objectContaining({ chatId: "chat_1", messageId: "message_1" }));
    expect(message.payload.requestId).toEqual(expect.any(String));

    const item = { message_id: "message_1", content: { action: "counter_offer" } };
    answer(handle, message.payload.requestId, { item });

    await expect(pending).resolves.toEqual({ item });
  });

  it("resolves getChat by chat id and by participants", async () => {
    const byId = handle.getChat({ chatId: "chat_1" });
    answer(handle, requestIdFrom(postMessage, "FS_CHAT_GET_CHAT"), { item: { chat_id: "chat_1" } });
    await expect(byId).resolves.toEqual({ item: { chat_id: "chat_1" } });

    postMessage.mockClear();
    const byPair = handle.getChat({ userId: 2615, creatorId: 1407 });
    const [message] = postMessage.mock.calls.at(-1);
    expect(message.payload).toEqual(expect.objectContaining({ userId: 2615, creatorId: 1407, chatId: null }));
    answer(handle, message.payload.requestId, { item: null });
    await expect(byPair).resolves.toEqual({ item: null });
  });

  it("ignores answers carrying an unknown request id", async () => {
    vi.useFakeTimers();
    const pending = handle.getMessage({ chatId: "chat_1", messageId: "message_1" });
    const settled = vi.fn();
    pending.then(settled, settled);

    answer(handle, "not-the-request-id", { item: { message_id: "other" } });
    await Promise.resolve();
    expect(settled).not.toHaveBeenCalled();

    vi.advanceTimersByTime(5000);
    await expect(pending).rejects.toThrow(/timed out after 5s/);
  });

  it("rejects when the embed never answers", async () => {
    vi.useFakeTimers();
    const pending = handle.getChat({ chatId: "chat_1" });
    vi.advanceTimersByTime(5000);
    await expect(pending).rejects.toThrow(/getChat: timed out after 5s/);
  });

  it("still answers the pre-existing getState response type", async () => {
    const pending = handle.getState({ only: ["total"] });
    const [message] = postMessage.mock.calls.at(-1);
    expect(message.type).toBe("FS_CHAT_GET_STATE");
    expect(message.payload.only).toEqual(["total"]);

    answer(handle, message.payload.requestId, { total: 4 }, "FS_CHAT_STATE_RESPONSE");
    await expect(pending).resolves.toEqual({ total: 4 });
  });

  it("drops in-flight requests on destroy so their timers cannot fire", async () => {
    vi.useFakeTimers();
    const pending = handle.getMessage({ chatId: "chat_1", messageId: "message_1" });
    const settled = vi.fn();
    pending.then(settled, settled);

    handle.destroy();
    vi.advanceTimersByTime(10000);
    await Promise.resolve();

    expect(settled).not.toHaveBeenCalled();
  });

  it("refreshes WordPress balance widgets for authenticated fan booking messages", async () => {
    const updateBalanceUIs = vi.fn().mockResolvedValue(undefined);
    window.tokenManager = { updateBalanceUIs };

    window.dispatchEvent(new MessageEvent("message", {
      source: handle.iframe.contentWindow,
      data: {
        type: "FS_FAN_BOOKING_BALANCE_REFRESH_REQUEST",
        payload: { reason: "chat-booking-update", action: "cancel", bookingId: "booking-1" },
      },
    }));
    await Promise.resolve();
    await Promise.resolve();

    expect(updateBalanceUIs).toHaveBeenCalledTimes(1);
  });

  it("ignores balance refresh messages from unrelated windows and creator chat sessions", async () => {
    const updateBalanceUIs = vi.fn().mockResolvedValue(undefined);
    window.tokenManager = { updateBalanceUIs };

    window.dispatchEvent(new MessageEvent("message", {
      source: window,
      data: { type: "FS_FAN_BOOKING_BALANCE_REFRESH_REQUEST", payload: { action: "cancel" } },
    }));

    handle.destroy();
    handle = mountHost("creator");
    window.dispatchEvent(new MessageEvent("message", {
      source: handle.iframe.contentWindow,
      data: { type: "FS_FAN_BOOKING_BALANCE_REFRESH_REQUEST", payload: { action: "cancel" } },
    }));
    await Promise.resolve();
    await Promise.resolve();

    expect(updateBalanceUIs).not.toHaveBeenCalled();
  });

  it("queues a fan balance refresh before resuming a successful chat top-up", async () => {
    const updateBalanceUIs = vi.fn().mockResolvedValue(undefined);
    window.tokenManager = { updateBalanceUIs };
    let successPromise;
    window.openTipPopup = vi.fn((options) => {
      successPromise = options.successCallback();
      return successPromise;
    });

    window.dispatchEvent(new MessageEvent("message", {
      source: handle.iframe.contentWindow,
      data: {
        type: "FS_CHAT_TOPUP_REQUIRED",
        payload: { bookingId: "booking-2", requiredTokens: 5, currentUserId: 2615, creatorUserId: 1407 },
      },
    }));
    await successPromise;

    expect(updateBalanceUIs).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith({
      type: "FS_CHAT_TOPUP_SUCCESS",
      payload: { bookingId: "booking-2" },
    }, "*");
  });

  it("does not notify chat of top-up success until the WordPress refresh settles", async () => {
    let resolveRefresh;
    let successPromise;
    const updateBalanceUIs = vi.fn(() => new Promise((resolve) => { resolveRefresh = resolve; }));
    window.tokenManager = { updateBalanceUIs };
    window.openTipPopup = vi.fn((options) => {
      successPromise = options.successCallback();
      return successPromise;
    });

    window.dispatchEvent(new MessageEvent("message", {
      source: handle.iframe.contentWindow,
      data: {
        type: "FS_CHAT_TOPUP_REQUIRED",
        payload: { bookingId: "booking-deferred", requiredTokens: 100, currentUserId: 2615, creatorUserId: 1407 },
      },
    }));
    await Promise.resolve();
    await Promise.resolve();

    expect(updateBalanceUIs).toHaveBeenCalledTimes(1);
    expect(postMessage).not.toHaveBeenCalledWith(expect.objectContaining({
      type: "FS_CHAT_TOPUP_SUCCESS",
    }), expect.anything());

    resolveRefresh();
    await successPromise;
    expect(postMessage).toHaveBeenCalledWith({
      type: "FS_CHAT_TOPUP_SUCCESS",
      payload: { bookingId: "booking-deferred" },
    }, "*");
  });
});
