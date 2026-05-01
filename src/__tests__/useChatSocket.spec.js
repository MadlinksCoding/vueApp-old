import { beforeEach, describe, expect, it, vi } from "vitest";

describe("useChatSocket", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
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
});
