import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ flowRun: vi.fn() }));

vi.mock("@/services/flow-system/FlowHandler", () => ({ default: { run: mocks.flowRun } }));

function context() {
  return {
    ok: true,
    data: {
      bookedSlots: [{ bookingId: "booking_1", eventId: "event_1" }],
      events: [{ eventId: "event_1", title: "NHS Test" }],
    },
  };
}

describe("chat store booking prefetch", () => {
  let useChatStore;

  beforeEach(async () => {
    setActivePinia(createPinia());
    mocks.flowRun.mockReset();
    mocks.flowRun.mockResolvedValue(context());
    ({ useChatStore } = await import("@/stores/useChatStore"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ["creator", true, "bookings.fetchCreatorBookingContext", { creatorId: "2615" }],
    ["fan", false, "bookings.fetchDashboardBookingContext", { userRole: "fan", fanId: "2615" }],
  ])("populates the %s caches the chat bubbles read", async (_label, isCreator, flowId, payload) => {
    const store = useChatStore();

    await store.fetchChatBookingsAndEvents("2615", isCreator);

    expect(mocks.flowRun).toHaveBeenCalledWith(flowId, payload);
    expect(store.getBookingById("booking_1")).toEqual(expect.objectContaining({ bookingId: "booking_1" }));
    expect(store.getEventById("event_1")).toEqual(expect.objectContaining({ title: "NHS Test" }));
  });

  it("resolves rather than throwing when the flow fails", async () => {
    const store = useChatStore();
    mocks.flowRun.mockResolvedValue({ ok: false, error: "nope" });

    await expect(store.fetchChatBookingsAndEvents("2615", true)).resolves.toBeUndefined();
    expect(store.getBookingById("booking_1")).toBeNull();
  });

  it("resolves rather than throwing when the flow rejects", async () => {
    const store = useChatStore();
    mocks.flowRun.mockRejectedValue(new Error("network down"));

    await expect(store.fetchChatBookingsAndEvents("2615", false)).resolves.toBeUndefined();
  });
});
