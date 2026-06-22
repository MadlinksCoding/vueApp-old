import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("useChatSocket", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.useRealTimers();
    delete window.SocketHandler;
  });

  afterEach(() => {
    vi.useRealTimers();
    delete window.SocketHandler;
  });

  it("creates its shared ready ref lazily instead of at module import time", async () => {
    const refMock = vi.fn((value) => ({ value }));
    const onUnmountedMock = vi.fn();

    vi.doMock("vue", () => ({
      ref: refMock,
      onUnmounted: onUnmountedMock,
    }));

    vi.doMock("@/stores/useChatStore", () => ({
      useChatStore: () => ({
        userChats: [],
        chatParticipants: {},
        chatUsersData: {},
        addMessage: vi.fn(),
        updateChatLastMessage: vi.fn(),
        updateChatUnread: vi.fn(),
        updateMessageReadReceiptsAction: vi.fn(),
        updateMessageStatusAction: vi.fn(),
        setChatUsersDataAction: vi.fn(),
        setPinnedMessage: vi.fn(),
        setBooking: vi.fn(),
        setEvent: vi.fn(),
      }),
    }));

    vi.doMock("@/services/flow-system/FlowHandler", () => ({
      default: {
        run: vi.fn(),
      },
    }));

    const { useChatSocket } = await import("@/composables/useChatSocket");

    expect(refMock).not.toHaveBeenCalled();

    const first = useChatSocket(101);

    expect(refMock).toHaveBeenCalledTimes(1);
    expect(onUnmountedMock).toHaveBeenCalledTimes(1);

    const second = useChatSocket(202);

    expect(refMock).toHaveBeenCalledTimes(1);
    expect(first.isReady).toBe(second.isReady);
  });

  it("stores real-time product messages as structured-clone-safe data", async () => {
    vi.useFakeTimers();
    const listeners = {};
    const chatStore = {
      messages: { "chat#1": [] },
      userChats: [{ chat_id: "chat#1", participants: ["101", "202"] }],
      chatParticipants: { "chat#1": ["101", "202"] },
      chatUsersData: { "202": { username: "Creator" } },
      addMessage: vi.fn(),
      updateChatLastMessage: vi.fn(),
      updateChatUnread: vi.fn(),
      updateMessageReadReceiptsAction: vi.fn(),
      updateMessageStatusAction: vi.fn(),
      setChatUsersDataAction: vi.fn(),
      setPinnedMessage: vi.fn(),
      setBooking: vi.fn(),
      setEvent: vi.fn(),
    };

    vi.doMock("vue", () => ({
      ref: (value) => ({ value }),
      onUnmounted: vi.fn(),
    }));

    vi.doMock("@/stores/useChatStore", () => ({
      useChatStore: () => chatStore,
    }));

    const flowRun = vi.fn(() => Promise.resolve({ ok: true }));
    vi.doMock("@/services/flow-system/FlowHandler", () => ({
      default: {
        run: flowRun,
      },
    }));

    vi.doMock("@/services/chat/chatResolverUtils", () => ({
      resolveAndSyncChat: vi.fn(),
      ensureChatUsersData: vi.fn(),
    }));

    window.SocketHandler = {
      identifyCurrentUser: vi.fn(),
      _initializeSocketConnection: vi.fn(),
      registerSocketListener: vi.fn(({ flag, callback }) => {
        listeners[flag] = callback;
      }),
      sendSocketMessage: vi.fn(() => Promise.resolve()),
    };

    const { useChatSocket } = await import("@/composables/useChatSocket");
    const socket = useChatSocket("101");
    socket.init();
    await vi.advanceTimersByTimeAsync(1000);

    const proxiedTags = new Proxy([{ name: "Live" }, () => "drop"], {});
    listeners["chat:message"]({
      chat_id: "chat#1",
      message_id: "msg#1",
      sender_id: "202",
      content_type: "product_recommendation",
      content: {
        product_recommendation: {
          id: 2940,
          type: "media",
          title: "Live media",
          tags: proxiedTags,
        },
      },
    });

    const storedMessage = chatStore.addMessage.mock.calls[0][1];
    expect(() => structuredClone(storedMessage)).not.toThrow();
    expect(storedMessage.content.product_recommendation.tags).toEqual([{ name: "Live" }]);
    expect(chatStore.updateChatLastMessage).toHaveBeenCalledWith("chat#1", storedMessage);
    vi.useRealTimers();
  });
});
