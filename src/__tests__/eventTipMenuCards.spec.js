import { mount, flushPromises } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import EventTipMenu from "@/components/ui/form/BookingForm/EventTipMenu.vue";
import TipPrizePrice from "@/components/ui/form/BookingForm/HelperComponents/TipPrizePrice.vue";

let wrapper;
beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  vi.stubGlobal("fetch", vi.fn());
});
afterEach(() => { wrapper?.unmount(); vi.unstubAllGlobals(); });

describe("tip prize cards", () => {
  it.each(["p2v", "merch"])("reloads the saved %s prize's current price without adding price to the saved event", async type => {
    const row = { id: 10, title: "Current item", thumbnail_url: "/media.jpg", gallery: ["/merch.jpg"], is_p2v: true, p2v: { price: 25, regular_price: 50 }, price: 12, regular_price: 20 };
    fetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true, result: row }) });
    const prize = type === "p2v" ? { type, mediaId: 10, mediaTitle: "Saved media", imageUrl: "/saved.jpg" } : { type, productId: 10, productTitle: "Saved merch", imageUrl: "/saved.jpg" };
    wrapper = mount(EventTipMenu, { props: { creatorId: 1407, modelValue: [{ itemId: "ti_saved", title: "Tip", tokens: 5, prize }] } });
    await wrapper.get("button[aria-label='Edit Tip']").trigger("click");
    await flushPromises();
    const url = fetch.mock.calls[0][0];
    expect(url.pathname).toContain(type === "p2v" ? "/media/get" : "/products/get");
    expect(url.searchParams.get(type === "p2v" ? "media_id" : "merch_id")).toBe("10");
    expect(url.searchParams.get("uid")).toBe("1407");
    expect(wrapper.get(".tip-selected-copy strong").text()).toBe("Current item");
    expect(wrapper.get(".tip-prize-current-price").text()).toBe(type === "p2v" ? "USD$25" : "USD$12");
    expect(wrapper.get("del").text()).toBe(type === "p2v" ? "$50" : "$20");
    await wrapper.get(".tip-button-green").trigger("click");
    const saved = wrapper.emitted("update:modelValue")[0][0][0];
    expect(saved.prize).not.toHaveProperty("price");
    expect(saved.prize).not.toHaveProperty("raw");
  });

  it("shows an unavailable price and retries a saved prize detail failure", async () => {
    fetch.mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, result: { id: 10, title: "Shirt", price: 25 } }) });
    wrapper = mount(EventTipMenu, { props: { creatorId: 1407, modelValue: [{ itemId: "ti_saved", title: "Tip", tokens: 5, prize: { type: "merch", productId: 10, productTitle: "Shirt" } }] } });
    await wrapper.get("button[aria-label='Edit Tip']").trigger("click");
    await flushPromises();
    expect(wrapper.get(".tip-selected-card").text()).toContain("Price unavailable");
    await wrapper.get(".tip-error button").trigger("click");
    await flushPromises();
    expect(wrapper.get(".tip-selected-card").text()).toContain("USD$25");
    expect(wrapper.find(".tip-error").exists()).toBe(false);
  });

  it("keeps the thumbnail's media type and purchase badges when selecting a prize", async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ status: "success", results: [
      { id: 1, title: "Video", is_p2v: true, is_subscription: true, video_duration: 900, p2v: { price: 25, regular_price: 50 } },
      { id: 2, title: "Gallery", is_p2v: true, gallery_count: 50, p2v: { price: 12 } },
    ], total_count: 2 }) });
    wrapper = mount(EventTipMenu, { props: { creatorId: 1407 } });
    await wrapper.get(".tip-button-dark").trigger("click");
    await wrapper.get("input[type=checkbox]").setValue(true);
    await flushPromises();
    await wrapper.get("select").setValue("p2v");
    await flushPromises();
    const cards = wrapper.findAll(".tip-library-card");
    expect(cards[0].get(".tip-media-badge").text()).toBe("00:15:00");
    expect(cards[0].get(".tip-media-purchase").text()).toBe("Subscribe or Buy");
    expect(cards[1].get(".tip-media-badge").text()).toBe("50");
    expect(cards[1].get(".tip-media-purchase").text()).toBe("Buy Now");
    await cards[0].trigger("click");
    expect(wrapper.get(".tip-selected-card").text()).toContain("USD$25");
    expect(wrapper.get("del").text()).toBe("$50");
  });

  it("renders a real zero price without confusing an unknown price with free", async () => {
    wrapper = mount(TipPrizePrice, { props: { item: { type: "product", raw: { price: 0 } } } });
    expect(wrapper.text()).toBe("USD$0");
    await wrapper.setProps({ item: { type: "product", buyPrice: null } });
    expect(wrapper.text()).toBe("Price unavailable");
  });
});
