import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import CalendarWeekBookingBlock from "@/components/calendar/CalendarWeekBookingBlock.vue";

describe("CalendarWeekBookingBlock", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it.each(["confirmed", "cancelled_creator"])("keeps past %s bookings grey with a solid grey indicator and no border", (status) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-24T21:00:00"));

    const wrapper = mount(CalendarWeekBookingBlock, {
      props: {
        event: {
          title: "Past booking",
          start: "2026-08-24T20:00:00",
          end: "2026-08-24T20:10:00",
          status,
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
    const indicator = block.get("[data-booking-status-icon]");
    expect(indicator.attributes("data-booking-status-icon")).toBe("past");
    expect(indicator.find("svg").exists()).toBe(false);
    expect(indicator.get("div").classes()).toContain("bg-[#98A2B3]");
  });

  it.each([
    ["pending", "pending"],
    ["confirmed", "confirmed"],
    ["cancelled_creator", "declined"],
  ])("retains the configured presentation for upcoming %s bookings", (status, expectedIndicator) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-24T19:00:00"));

    const wrapper = mount(CalendarWeekBookingBlock, {
      props: {
        event: {
          title: "Upcoming booking",
          start: "2026-08-24T20:00:00",
          end: "2026-08-24T20:10:00",
          status,
          color: "#5549FF",
        },
      },
    });

    const block = wrapper.get("[data-test='calendar-week-booking-block']");
    expect(block.element.style.borderTopWidth).toBe("1px");
    expect(block.element.style.borderTopColor).toBe("rgb(85, 73, 255)");
    const indicator = block.get("[data-booking-status-icon]");
    expect(indicator.attributes("data-booking-status-icon")).toBe(expectedIndicator);
    expect(indicator.find("svg").exists()).toBe(status === "pending");
    if (status === "confirmed") expect(indicator.get("div").classes()).toContain("bg-[#07F468]");
    if (status === "cancelled_creator") expect(indicator.get("div").classes()).toContain("bg-[#FF4405]");
  });
});
