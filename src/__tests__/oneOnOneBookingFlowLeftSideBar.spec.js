import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { bookingTranslationSymbol, createBookingTranslator } from "@/i18n/bookingTranslations.js";

vi.mock("@/components/FanBookingFlow/OneOnOneBookingFlow/oneOnOneBookingFlowAssets.js", () => ({
  bookingFlowDotsIcon: "/dots.webp",
  bookingFlowProfileImage: "/profile.webp",
  bookingFlowVerifiedIcon: "/verified.webp",
  bookingFlowTokenIcon: "/token.webp",
  bookingFlowSaleIcon: "/sale.webp",
  bookingFlowCloudMoon: "/cloud-moon.webp",
}));

async function mountSidebar(props = {}, translations = {}) {
  const { default: OneOnOneBookingFlowLeftSideBar } = await import("@/components/FanBookingFlow/HelperComponents/OneOnOneBookingFlowLeftSideBar.vue");
  return mount(OneOnOneBookingFlowLeftSideBar, {
    props,
    global: {
      provide: {
        [bookingTranslationSymbol]: createBookingTranslator({ translations }),
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

  it("renders dynamic private session pricing and configured offers", async () => {
    const wrapper = await mountSidebar({
      isFirstBookingForCreator: true,
      selectedEvent: {
        basePriceTokens: 300,
        sessionDurationMinutes: 10,
        allowLongerSessions: true,
        raw: {
          basePriceTokens: 300,
          sessionDurationMinutes: 10,
          allowLongerSessions: true,
          maxSessionMinutes: 6,
          offHourSurcharge: true,
          offHourSurchargePercent: 50,
          enableFirstTimeDiscount: true,
          firstTimeDiscountTokens: 100,
          enableDiscountForLonger: true,
          longerSessionDiscountTokens: 100,
          discountMinSessions: 3,
        },
      },
    });

    expect(wrapper.get("[data-testid='booking-sidebar-normal-hour']").text()).toContain("300/10 min.");
    expect(wrapper.get("[data-testid='booking-sidebar-off-hour']").text()).toContain("450/10 min.");
    expect(wrapper.get("[data-testid='booking-sidebar-maximum-session']").text()).toContain(
      "60 min. (6 sessions)",
    );
    expect(wrapper.get("[data-testid='booking-sidebar-first-time-offer']").text()).toContain(
      "100 tokens off entire booking",
    );
    expect(wrapper.get("[data-testid='booking-sidebar-long-session-offer']").text()).toContain(
      "100 tokens off when you book 3+ sessions",
    );
  });

  it("requires fan eligibility before showing the configured first-time offer", async () => {
    const selectedEvent = {
      raw: {
        basePriceTokens: 300,
        sessionDurationMinutes: 10,
        enableFirstTimeDiscount: true,
        firstTimeDiscountTokens: 100,
      },
    };
    const wrapper = await mountSidebar({ selectedEvent });

    expect(wrapper.find("[data-testid='booking-sidebar-first-time-offer']").exists()).toBe(false);

    await wrapper.setProps({ isFirstBookingForCreator: true });
    expect(wrapper.find("[data-testid='booking-sidebar-first-time-offer']").exists()).toBe(true);

    await wrapper.setProps({ isFirstBookingForCreator: false });
    expect(wrapper.find("[data-testid='booking-sidebar-first-time-offer']").exists()).toBe(false);
  });

  it("hides disabled optional pricing and normalizes the maximum to one session", async () => {
    const wrapper = await mountSidebar({
      selectedEvent: {
        basePriceTokens: 75,
        sessionDurationMinutes: 20,
        allowLongerSessions: false,
        raw: {
          basePriceTokens: 75,
          sessionDurationMinutes: 20,
          allowLongerSessions: false,
          maxSessionMinutes: 8,
          offHourSurcharge: false,
          offHourSurchargePercent: 50,
          enableFirstTimeDiscount: false,
          firstTimeDiscountTokens: 100,
          enableDiscountForLonger: false,
          longerSessionDiscountTokens: 100,
          discountMinSessions: 3,
        },
      },
    });

    expect(wrapper.get("[data-testid='booking-sidebar-normal-hour']").text()).toContain("75/20 min.");
    expect(wrapper.get("[data-testid='booking-sidebar-maximum-session']").text()).toContain(
      "20 min. (1 session)",
    );
    expect(wrapper.find("[data-testid='booking-sidebar-off-hour']").exists()).toBe(false);
    expect(wrapper.find("[data-testid='booking-sidebar-first-time-offer']").exists()).toBe(false);
    expect(wrapper.find("[data-testid='booking-sidebar-long-session-offer']").exists()).toBe(false);
  });

  it("uses pricing translations and reacts when the selected event changes", async () => {
    const wrapper = await mountSidebar(
      {
        selectedEvent: {
          raw: {
            basePriceTokens: 80,
            sessionDurationMinutes: 25,
            allowLongerSessions: false,
          },
        },
      },
      {
        fan_booking_session_cost: "CALL PRICE",
        fan_booking_normal_hour: "Standard time",
        fan_booking_price_per_minutes: "each {minutes} minutes",
        fan_booking_max_session_length: "Longest call",
        fan_booking_duration_session_count: "{minutes} minutes across {count} {session_label}",
        fan_booking_session: "meeting",
        fan_booking_sessions: "meetings",
      },
    );

    expect(wrapper.get("[data-testid='booking-sidebar-session-cost']").text()).toContain("CALL PRICE");
    expect(wrapper.get("[data-testid='booking-sidebar-normal-hour']").text()).toContain(
      "Standard time80each 25 minutes",
    );
    expect(wrapper.get("[data-testid='booking-sidebar-maximum-session']").text()).toContain(
      "Longest call25 minutes across 1 meeting",
    );

    await wrapper.setProps({
      selectedEvent: {
        raw: {
          basePriceTokens: 125,
          sessionDurationMinutes: 30,
          allowLongerSessions: true,
          maxSessionMinutes: 2,
        },
      },
    });

    expect(wrapper.get("[data-testid='booking-sidebar-normal-hour']").text()).toContain(
      "Standard time125each 30 minutes",
    );
    expect(wrapper.get("[data-testid='booking-sidebar-maximum-session']").text()).toContain(
      "Longest call60 minutes across 2 meetings",
    );
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
