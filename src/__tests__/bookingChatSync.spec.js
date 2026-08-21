import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ flowRun: vi.fn(), requestSync: vi.fn() }));

vi.mock("@/services/flow-system/FlowHandler.js", () => ({ default: { run: mocks.flowRun } }));
vi.mock("@/embeds/events/bridge.js", () => ({ requestBookingChatSync: mocks.requestSync }));

import { useBookingChatSync, BOOKING_CHAT_ACTIVITY_LOGS } from "@/composables/useBookingChatSync.js";

function booking(meta = { chatId: "chat_1", bookingMessageId: "message_1" }) {
  return { bookingId: "booking_1", creatorId: 1407, userId: 2615, meta };
}

describe("useBookingChatSync", () => {
  beforeEach(() => {
    mocks.flowRun.mockReset();
    mocks.requestSync.mockReset();
    mocks.flowRun.mockResolvedValue({ ok: true, data: { item: { message_id: "message_1" } } });
  });

  it("mirrors the action onto the chat message and asks the host to broadcast it", async () => {
    const { syncBookingToChat } = useBookingChatSync();

    await expect(syncBookingToChat(booking(), "accepted", "approve")).resolves.toEqual(
      expect.objectContaining({ ok: true }),
    );

    expect(mocks.flowRun).toHaveBeenCalledWith(
      "chat.updateBookingRequestMessage",
      { chatId: "chat_1", messageId: "message_1", action: "accepted" },
      expect.any(Object),
    );
    expect(mocks.requestSync).toHaveBeenCalledWith(expect.objectContaining({
      chatId: "chat_1",
      bookingId: "booking_1",
      recipientIds: ["1407", "2615"],
      activityLog: expect.objectContaining({
        text: BOOKING_CHAT_ACTIVITY_LOGS.approve.text,
        meta: expect.objectContaining({ decision: "accepted" }),
      }),
    }));
  });

  it("sends no activity log when the action has no log key", async () => {
    const { syncBookingToChat } = useBookingChatSync();
    await syncBookingToChat(booking(), "accepted");
    expect(mocks.requestSync).toHaveBeenCalledWith(expect.objectContaining({ activityLog: null }));
  });

  it.each([
    ["no chat id", { bookingMessageId: "message_1" }],
    ["no message id", { chatId: "chat_1" }],
    ["no meta", {}],
  ])("skips entirely when the booking has %s", async (_label, meta) => {
    const { syncBookingToChat } = useBookingChatSync();

    await expect(syncBookingToChat(booking(meta), "accepted", "approve")).resolves.toEqual({ ok: false });
    expect(mocks.flowRun).not.toHaveBeenCalled();
    expect(mocks.requestSync).not.toHaveBeenCalled();
  });

  it("does not ask the host to broadcast when the message update failed", async () => {
    mocks.flowRun.mockResolvedValue({ ok: false, error: { message: "gone" } });
    const { syncBookingToChat } = useBookingChatSync();

    await expect(syncBookingToChat(booking(), "declined", "reject")).resolves.toEqual({ ok: false });
    expect(mocks.requestSync).not.toHaveBeenCalled();
  });
});
