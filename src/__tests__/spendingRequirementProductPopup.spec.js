import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import SpendingRequirementProductPopup from "@/components/ui/form/BookingForm/HelperComponents/SpendingRequirementProductPopup.vue";

function mountPopup(items, props = {}) {
  return mount(SpendingRequirementProductPopup, {
    props: {
      modelValue: true,
      items,
      ...props,
    },
    global: {
      stubs: {
        teleport: true,
      },
    },
  });
}

function actionLabels(wrapper) {
  return wrapper
    .findAll("[data-spending-requirement-action-label]")
    .map((label) => label.text());
}

async function selectTab(wrapper, label) {
  const tab = wrapper.findAll("button").find((button) => button.text() === label);
  expect(tab).toBeTruthy();
  await tab.trigger("click");
}

describe("SpendingRequirementProductPopup", () => {
  it("hides subscriber-exclusive merch only in the Who can book picker", async () => {
    const items = [
      { id: 10, type: "product", title: "Public merch", subscriberExclusive: false },
      { id: 11, type: "product", title: "Exclusive merch", subscriberExclusive: true },
      { id: 12, type: "product", title: "Raw exclusive merch", raw: { subscriber_exclusive: true } },
      // Subscription offers/discounts alone must not hide ordinary merch.
      { id: 13, type: "product", title: "Discounted merch", canSubscribe: true },
    ];
    const wrapper = mountPopup(items, { excludeSubscriberExclusiveMerch: true });
    expect(wrapper.find('[data-testid="subscriber-merch-notice"]').exists()).toBe(false);
    await selectTab(wrapper, "Product");
    expect(wrapper.text()).toContain("Public merch");
    expect(wrapper.text()).toContain("Discounted merch");
    expect(wrapper.text()).not.toContain("Exclusive merch");
    expect(wrapper.text()).not.toContain("Raw exclusive merch");
    expect(wrapper.get('[data-testid="subscriber-merch-notice"]').text()).toContain("Subscriber exclusive merch(s) are hidden from this list");

    await wrapper.setProps({ excludeSubscriberExclusiveMerch: false });
    expect(wrapper.text()).toContain("Exclusive merch");
    expect(wrapper.text()).toContain("Raw exclusive merch");
    expect(wrapper.find('[data-testid="subscriber-merch-notice"]').exists()).toBe(false);
  });

  it("keeps the notice exclusive to Product, dismissible, and reset on reopening", async () => {
    const wrapper = mountPopup([], { excludeSubscriberExclusiveMerch: true });
    await selectTab(wrapper, "Product");
    const notice = wrapper.getComponent({ name: "NotificationCard" });
    notice.vm.$emit("update:modelValue", false);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="subscriber-merch-notice"]').exists()).toBe(false);
    await wrapper.setProps({ modelValue: false });
    await wrapper.setProps({ modelValue: true });
    await selectTab(wrapper, "Product");
    expect(wrapper.find('[data-testid="subscriber-merch-notice"]').exists()).toBe(true);
    await selectTab(wrapper, "Subscription");
    expect(wrapper.find('[data-testid="subscriber-merch-notice"]').exists()).toBe(false);
  });

  it("lets the booking picker fetch another page when the current page is all exclusive", async () => {
    const wrapper = mountPopup([
      { id: 11, type: "product", title: "Exclusive merch", subscriberExclusive: true },
    ], { excludeSubscriberExclusiveMerch: true, hasMoreByType: { product: true } });
    await selectTab(wrapper, "Product");
    const loadMore = wrapper.findAll('button').find(button => button.text() === 'Load more products');
    await loadMore.trigger('click');
    expect(wrapper.emitted('load-more')).toEqual([['product']]);
  });

  it("labels media cards by available access mode", () => {
    const wrapper = mountPopup([
      {
        id: 1,
        type: "media",
        title: "Both options",
        buyPrice: 15,
        subscribePrice: 5,
        thumbnailUrl: "https://example.com/both.jpg",
      },
      {
        id: 2,
        type: "media",
        title: "Subscribe only",
        buyPrice: null,
        subscribePrice: null,
        canSubscribe: true,
        thumbnailUrl: "https://example.com/subscribe.jpg",
      },
      {
        id: 3,
        type: "media",
        title: "Buy only",
        buyPrice: null,
        subscribePrice: null,
        canBuy: true,
        thumbnailUrl: "https://example.com/buy.jpg",
      },
    ]);

    expect(actionLabels(wrapper)).toEqual([
      "Subscribe or Buy",
      "Subscribe Only",
      "Buy Now",
    ]);
  });

  it("labels subscriptions but does not show action labels on merch", async () => {
    const wrapper = mountPopup([
      {
        id: 4,
        type: "subscription",
        title: "Variable Subscription Product - Tier 3",
        variation_title: "Creator tier",
        buyPrice: 50,
        subscribePrice: null,
        thumbnailUrl: "https://example.com/tier.jpg",
      },
      {
        id: 5,
        type: "product",
        title: "Merch buy",
        buyPrice: 20,
        subscribePrice: null,
        thumbnailUrl: "https://example.com/merch-buy.jpg",
      },
      {
        id: 6,
        type: "product",
        title: "Merch subscribe",
        buyPrice: null,
        subscribePrice: null,
        canSubscribe: true,
        thumbnailUrl: "https://example.com/merch-subscribe.jpg",
      },
    ]);

    await selectTab(wrapper, "Subscription");
    expect(actionLabels(wrapper)).toEqual(["Subscribe"]);
    expect(wrapper.text()).toContain("Creator tier");
    expect(wrapper.text()).not.toContain("Variable Subscription Product - Tier 3");

    await selectTab(wrapper, "Product");
    expect(actionLabels(wrapper)).toEqual([]);
  });
});
