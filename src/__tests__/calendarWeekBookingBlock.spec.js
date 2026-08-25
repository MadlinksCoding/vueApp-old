import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import CalendarWeekBookingBlock from "@/components/calendar/CalendarWeekBookingBlock.vue";

describe("CalendarWeekBookingBlock", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps past bookings grey without a border", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-24T21:00:00"));

    const wrapper = mount(CalendarWeekBookingBlock, {
      props: {
        event: {
          title: "Past booking",
          start: "2026-08-24T20:00:00",
          end: "2026-08-24T20:10:00",
          status: "confirmed",
          color: "#5549FF",
        },
      },
    });

    const block = wrapper.get("[data-test='calendar-week-booking-block']");
    expect(block.element.style.backgroundColor).toBe("rgb(217, 220, 230)");
    expect(block.element.style.color).toBe("rgb(152, 162, 179)");
    expect(block.element.style.borderTopWidth).toBe("0px");
    expect(block.element.style.borderRightWidth).toBe("0px");
    expect(block.element.style.borderBottomWidth).toBe("0px");
    expect(block.element.style.borderLeftWidth).toBe("0px");
  });

  it("retains the configured border for upcoming bookings", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-24T19:00:00"));

    const wrapper = mount(CalendarWeekBookingBlock, {
      props: {
        event: {
          title: "Upcoming booking",
          start: "2026-08-24T20:00:00",
          end: "2026-08-24T20:10:00",
          status: "confirmed",
          color: "#5549FF",
        },
      },
    });

    const block = wrapper.get("[data-test='calendar-week-booking-block']");
    expect(block.element.style.borderTopWidth).toBe("1px");
    expect(block.element.style.borderTopColor).toBe("rgb(85, 73, 255)");
  });
});
