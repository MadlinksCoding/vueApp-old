import { describe, it, expect, vi, afterEach } from "vitest";
import { createEventMapper } from "@/services/events/mappers/createEventMapper.js";
import { updateEventMapper } from "@/services/events/mappers/updateEventMapper.js";
import { mapEventToBookingFormState } from "@/services/events/mappers/eventFormStateMapper.js";
import { fetchTipPrizePage } from "@/services/events/eventTipMenu.js";
const menu = [
  { itemId: "ti_shout", title: "Shout out", tokens: 5, prize: null },
  { itemId: "ti_media", title: "Free video", tokens: 30, prize: { type: "p2v", mediaId: 10, mediaTitle: "Video", imageUrl: "https://example.test/video.jpg" } },
  { itemId: "ti_merch", title: "Free shirt", tokens: 100, prize: { type: "merch", productId: 11, productTitle: "Shirt", imageUrl: "" } },
  { itemId: "ti_sub", title: "VIP", tokens: 300, prize: { type: "subscription", planId: 12, planTitle: "VIP tier", billingCycles: 6 } },
];
const draft = { creatorId: 1407, eventType: "group-event", eventTitle: "Tip menu event", eventDescription: "Test", eventColorSkin: "#5549FF", eventCallType: "video", repeatRule: "doesNotRepeat", oneTimeAvailability: [{ date: "2030-01-01", slots: [{ startTime: "10:00", endTime: "11:00" }] }], priceSetting: "fixedPricePerUser", basePrice: "10", whoCanBook: "everyone", spendingRequirement: "none" };
afterEach(() => vi.unstubAllGlobals());
describe("event tip menu persistence", () => {
  it("round-trips all three prizes and a tip without a prize through create and edit", () => {
    const created = createEventMapper({ ...draft, tipMenu: menu });
    expect(created.tipMenu).toEqual(menu);
    const state = mapEventToBookingFormState({ ...created, eventId: "evt_tips" });
    expect(state.tipMenu).toEqual(menu);
    const edited = updateEventMapper({ ...state, tipMenu: menu.slice(1) });
    expect(edited.tipMenu).toEqual(menu.slice(1));
    expect(edited.tipMenu[0].itemId).toBe("ti_media");
    expect(updateEventMapper({ ...state, tipMenu: [] }).tipMenu).toEqual([]);
  });
  it("does not send a group menu with a private event", () => {
    expect(createEventMapper({ ...draft, eventType: "1on1-call", tipMenu: menu })).not.toHaveProperty("tipMenu");
    expect(mapEventToBookingFormState({ type: "1on1-call", tipMenu: menu }).tipMenu).toEqual([]);
  });
  it("handles events saved before tip menus existed", () => {
    expect(mapEventToBookingFormState({ type: "group-event" }).tipMenu).toEqual([]);
  });
});
describe("published prize catalog", () => {
  function mockResponse(results, total_count) { vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: "success", results, total_count }) })); }
  it("requests six newest P2V items and keeps raw pagination", async () => {
    mockResponse([{ id: 10, title: "Video", is_p2v: true }, { id: 11, title: "Sub only", is_subscription: true }], 8);
    const page = await fetchTipPrizePage({ type: "p2v", creatorId: 1407 });
    expect(page.items.map(item => item.id)).toEqual([10]);
    expect(page.nextOffset).toBe(2);
    expect(page.hasMore).toBe(true);
    const url = fetch.mock.calls[0][0];
    expect(url.searchParams.get("ppv")).toBe("yes");
    expect(url.searchParams.get("sort")).toBe("newest");
    expect(url.searchParams.get("count")).toBe("6");
  });
  it("excludes subscriber-exclusive merch without skipping the next page", async () => {
    mockResponse([{ id: 1, title: "Public", price: 5 }, { id: 2, title: "Exclusive", subscriber_exclusive: "yes", price: 5 }], 9);
    const page = await fetchTipPrizePage({ type: "merch", creatorId: 1407 });
    expect(page.items.map(item => item.id)).toEqual([1]);
    expect(fetch.mock.calls[0][0].searchParams.get("sort")).toBe("newest");
    expect(page.nextOffset).toBe(2);
    expect(page.hasMore).toBe(true);
  });
  it("lists only published tiers and stops at the complete tier response", async () => {
    mockResponse([{ id: 1, title: "VIP", status: "publish", price: 10 }, { id: 2, title: "Draft", status: "draft", price: 10 }, { id: 3, title: "Free", status: "publish", price: 0 }, { id: 4, title: "Free flag", status: "publish", price: 10, is_free: true }]);
    const page = await fetchTipPrizePage({ type: "subscription", creatorId: 1407 });
    expect(page.items.map(item => item.id)).toEqual([1]);
    expect(page.hasMore).toBe(false);
  });
  it("surfaces library failures instead of treating them as an empty library", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(fetchTipPrizePage({ type: "merch", creatorId: 1407 })).rejects.toThrow("could not be loaded");
  });
});
