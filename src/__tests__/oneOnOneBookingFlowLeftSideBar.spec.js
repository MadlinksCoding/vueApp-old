import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { bookingTranslationSymbol, createBookingTranslator } from "@/i18n/bookingTranslations.js";

vi.mock("@/components/FanBookingFlow/OneOnOneBookingFlow/oneOnOneBookingFlowAssets.js", () => ({
  bookingFlowDotsIcon: "/dots.webp",
  bookingFlowProfileImage: "/profile.webp",
  bookingFlowVerifiedIcon: "/verified.webp",
}));

async function mountSidebar(props = {}) {
  const { default: OneOnOneBookingFlowLeftSideBar } = await import("@/components/FanBookingFlow/HelperComponents/OneOnOneBookingFlowLeftSideBar.vue");
  return mount(OneOnOneBookingFlowLeftSideBar, {
    props,
    global: {
      provide: {
        [bookingTranslationSymbol]: createBookingTranslator(),
      },
    },
  });
}

describe("OneOnOneBookingFlowLeftSideBar", () => {
  it("keeps the private booking policy layout by default", async () => {
    const wrapper = await mountSidebar({
      titleDisplay: "Private Session",
      creatorName: "Creator Name",
      dateDisplay: "Wednesday, August 24, 2025",
      timeDisplay: "9:30pm-10:30pm",
    });

    const text = wrapper.text();
    expect(text).toContain("1 on 1 call");
    expect(text).toContain("BOOKING POLICY");
    expect(text).toContain("Token equivalent of your session fee");
    expect(text).not.toContain("Group Event");
    expect(text).not.toContain("event goal reached");
  });

  it("renders the fixed-price group event sidebar without goal progress", async () => {
    const wrapper = await mountSidebar({
      isGroupEvent: true,
      priceSetting: "fixedPricePerUser",
      titleDisplay: "J&B's Cooking show",
      creatorName: "Princess Carrot Pop",
      creatorIsVerified: true,
      dateDisplay: "Wednesday, August 24, 2025",
      timeDisplay: "9:30pm-10:30pm",
      groupPerformers: [
        {
          name: "Buff Bunny",
          avatar: "/buff.webp",
          isVerified: true,
        },
      ],
    });

    const text = wrapper.text();
    expect(text).toContain("Group Event");
    expect(text).toContain("J&B's Cooking show");
    expect(text).toContain("Princess Carrot Pop");
    expect(text).toContain("Host");
    expect(text).toContain("Buff Bunny");
    expect(text).toContain("Wednesday, August 24, 2025");
    expect(text).toContain("9:30pm-10:30pm");
    expect(text).toContain("Event policy");
    expect(text).toContain("Your contributions will be on hold");
    expect(text).not.toContain("event goal reached");
    expect(wrapper.find("[data-testid='group-sidebar-event-goal-progress']").exists()).toBe(false);
  });

  it("renders event-goal group progress", async () => {
    const wrapper = await mountSidebar({
      isGroupEvent: true,
      priceSetting: "eventGoal",
      titleDisplay: "J&B's Cooking show",
      creatorName: "Princess Carrot Pop",
      dateDisplay: "Wednesday, August 24, 2025",
      timeDisplay: "9:30pm-10:30pm",
      eventGoalReachedTokens: 1200,
      eventGoalTokens: 8000,
      eventGoalPercent: 15,
    });

    const progress = wrapper.get("[data-testid='group-sidebar-event-goal-progress']");
    expect(wrapper.text()).toContain("1,200/8,000 Tokens");
    expect(wrapper.text()).toContain("15% event goal reached");
    expect(wrapper.text()).toContain("If funds do not reach the event goal");
    expect(progress.find(".bg-\\[\\#FFED29\\]").attributes("style")).toContain("width: 15%");
  });
});
