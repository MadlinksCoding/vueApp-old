import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/bookings/utils/bookingSlotUtils.js", () => ({
  computeNextAvailableSlot: vi.fn(() => null),
}));

vi.mock("@/components/FanBookingFlow/OneOnOneBookingFlow/oneOnOneBookingFlowAssets.js", () => ({
  bookingFlowArrowUpRightIcon: "/arrow-up-right.webp",
  bookingFlowBackgroundImage: "/booking-background.webp",
  bookingFlowTokenIcon: "/token.webp",
  bookingFlowUnionIcon: "/union.webp",
}));

function getByPath(target, path) {
  return String(path).split(".").reduce((cursor, segment) => (
    cursor == null ? cursor : cursor[segment]
  ), target);
}

function createEngine(state) {
  return {
    getState: vi.fn((path) => getByPath(state, path)),
    setState: vi.fn(),
    goToStep: vi.fn(),
  };
}

describe("BookingFlowStep1 loading state", () => {
  it("renders the Step 2 skeleton without loading text or event background", async () => {
    const { default: BookingFlowStep1 } = await import(
      "@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep1.vue"
    );

    const wrapper = mount(BookingFlowStep1, {
      props: {
        embedded: false,
        engine: createEngine({
          fanBooking: {
            catalog: {
              events: [],
              bookedSlotsIndex: {},
            },
            ui: {
              catalogLoading: true,
              catalogError: "",
            },
          },
        }),
      },
    });

    const skeleton = wrapper.get("[data-test='booking-flow-step-loading-skeleton']");
    const inlineStyles = wrapper
      .findAll("[style]")
      .map((node) => node.attributes("style") || "")
      .join(" ");

    expect(wrapper.text()).not.toContain("Loading events...");
    expect(skeleton.exists()).toBe(true);
    expect(skeleton.attributes("style") || "").not.toContain("background-image");
    expect(inlineStyles).not.toContain("background-image");
  });
});
