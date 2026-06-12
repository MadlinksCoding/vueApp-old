import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import SpendingRequirementProductPopup from "@/components/ui/form/BookingForm/HelperComponents/SpendingRequirementProductPopup.vue";

function mountPopup(items) {
  return mount(SpendingRequirementProductPopup, {
    props: {
      modelValue: true,
      items,
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
        title: "Creator tier",
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

    await selectTab(wrapper, "Product");
    expect(actionLabels(wrapper)).toEqual([]);
  });
});
