import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildBookingChatMessage,
  resolveBookingChatMessage,
} from "@/services/bookings/utils/bookingChatMessage.js";

function booking(overrides = {}) {
  return {
    bookingId: "booking_1",
    eventId: "event_1",
    eventTitle: "NHS Test",
    startAtIso: "2026-08-20T19:05:00Z",
    endAtIso: "2026-08-20T19:10:00Z",
    meta: { chatId: "chat_1", bookingMessageId: "message_1" },
    ...overrides,
  };
}

function stubParent(chatEmbed) {
  Object.defineProperty(window, "parent", { configurable: true, value: { chatEmbed } });
}

afterEach(() => {
  Reflect.deleteProperty(window, "parent");
});

describe("buildBookingChatMessage", () => {
  it("rebuilds the linked message from booking meta", () => {
    expect(buildBookingChatMessage(booking())).toEqual(expect.objectContaining({
      message_id: "message_1",
      chat_id: "chat_1",
      content_type: "booking_request",
      content: expect.objectContaining({ booking_id: "booking_1", event_id: "event_1" }),
    }));
  });

  it.each([
    ["no chat id", { bookingMessageId: "message_1" }],
    ["no message id", { chatId: "chat_1" }],
    ["no meta", {}],
  ])("returns null when the booking has %s", (_label, meta) => {
    expect(buildBookingChatMessage(booking({ meta }))).toBeNull();
  });
});

describe("resolveBookingChatMessage", () => {
  it("prefers the real message the chat embed still holds", async () => {
    const real = { message_id: "message_1", content: { booking_id: "booking_1", action: "counter_offer" } };
    const getMessage = vi.fn().mockResolvedValue({ item: real });
    stubParent({ getMessage });

    await expect(resolveBookingChatMessage(booking())).resolves.toBe(real);
    expect(getMessage).toHaveBeenCalledWith({ chatId: "chat_1", messageId: "message_1" });
  });

  it("falls back when no chat embed is mounted", async () => {
    stubParent(undefined);
    const resolved = await resolveBookingChatMessage(booking());
    expect(resolved.content.action).toBeUndefined();
    expect(resolved.message_id).toBe("message_1");
  });

  it.each([
    ["the embed has no such message", { getMessage: vi.fn().mockResolvedValue({ item: null }) }],
    ["the request rejects", { getMessage: vi.fn().mockRejectedValue(new Error("timed out after 5s")) }],
  ])("falls back when %s", async (_label, chatEmbed) => {
    stubParent(chatEmbed);
    await expect(resolveBookingChatMessage(booking())).resolves.toEqual(buildBookingChatMessage(booking()));
  });

  it("falls back when the host is cross-origin", async () => {
    Object.defineProperty(window, "parent", {
      configurable: true,
      get() { throw new DOMException("Blocked a frame", "SecurityError"); },
    });

    await expect(resolveBookingChatMessage(booking())).resolves.toEqual(buildBookingChatMessage(booking()));
  });

  it("returns null when the booking has no linked message", async () => {
    stubParent({ getMessage: vi.fn() });
    await expect(resolveBookingChatMessage(booking({ meta: {} }))).resolves.toBeNull();
  });
});
