import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import OneOnOneBookingFlowHeader from "@/components/FanBookingFlow/HelperComponents/OneOnOneBookingFlowHeader.vue";

describe("OneOnOneBookingFlowHeader", () => {
  it("shows creator skeleton while creator data is loading", () => {
    const wrapper = mount(OneOnOneBookingFlowHeader, {
      props: {
        creatorLoading: true,
      },
    });

    expect(wrapper.find(".animate-skeleton-loading").exists()).toBe(true);
    expect(wrapper.text()).not.toContain("Princess Carrot Pop");
  });

  it("renders dynamic creator data after loading", () => {
    const wrapper = mount(OneOnOneBookingFlowHeader, {
      props: {
        creatorAvatar: "https://example.com/creator.webp",
        creatorName: "Dynamic Creator",
        creatorIsVerified: true,
      },
    });

    expect(wrapper.text()).toContain("Dynamic Creator");
    expect(wrapper.find("img[alt='profile-image']").attributes("src")).toBe("https://example.com/creator.webp");
    expect(wrapper.find("img[alt='verified-icon']").exists()).toBe(true);
  });
});
