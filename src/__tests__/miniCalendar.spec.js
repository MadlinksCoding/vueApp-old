import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import MiniCalendar from "@/components/calendar/MiniCalendar.vue";
import { bookingTranslationSymbol, createBookingTranslator } from "@/i18n/bookingTranslations.js";

function mountCalendar(props = {}) {
  return mount(MiniCalendar, {
    props: {
      monthDate: new Date("2026-05-01T00:00:00"),
      selectedDate: new Date("2030-05-06T00:00:00"),
      events: [],
      theme: {
        mini: {
          wrapper: "",
          dayBase: "",
          outside: "",
          expired: "expired",
          today: "",
          selected: "selected",
          dot: "",
          selectedDot: "",
        },
      },
      ...props,
    },
    global: {
      provide: {
        [bookingTranslationSymbol]: createBookingTranslator(),
      },
    },
  });
}

function findDayButton(wrapper, dayText) {
  return wrapper.findAll("button").find((button) => button.text() === String(dayText));
}

describe("MiniCalendar", () => {
  it("disables dates outside minDate and maxDate and does not emit selection", async () => {
    const wrapper = mountCalendar({
      monthDate: new Date("2030-05-01T00:00:00"),
      minDate: new Date("2030-05-06T00:00:00"),
      maxDate: new Date("2030-05-21T00:00:00"),
      allowPastDates: true,
    });

    const before = findDayButton(wrapper, 5);
    const valid = findDayButton(wrapper, 6);
    const after = findDayButton(wrapper, 23);

    expect(before.attributes("disabled")).toBeDefined();
    expect(before.attributes("data-disabled")).toBe("true");
    expect(valid.attributes("disabled")).toBeUndefined();
    expect(valid.attributes("data-disabled")).toBe("false");
    expect(after.attributes("disabled")).toBeDefined();
    expect(after.attributes("data-disabled")).toBe("true");

    await before.trigger("click");
    await after.trigger("click");

    expect(wrapper.emitted("date-selected")).toBeUndefined();

    await valid.trigger("click");

    expect(wrapper.emitted("date-selected")).toHaveLength(1);
  });

  it("renders a dot below today and dates with events", () => {
    const today = new Date();
    const wrapper = mountCalendar({
      monthDate: today,
      events: [
        { start: today, end: today }
      ]
    });

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const dateKey = `${year}-${month}-${day}`;

    const todayButton = wrapper.findAll("button").find((button) => button.attributes("data-date") === dateKey);
    expect(todayButton).toBeDefined();
    const dot = todayButton.find('[data-has-events="true"]');
    expect(dot.exists()).toBe(true);
  });

  it("renders a dot with transparent bg and border for dates with pending events", () => {
    const targetDate = new Date("2026-05-15T10:00:00");
    const wrapper = mountCalendar({
      monthDate: new Date("2026-05-01T00:00:00"),
      selectedDate: new Date("2026-05-01T00:00:00"),
      events: [
        { start: targetDate, end: targetDate, status: "pending" }
      ]
    });

    const dayButton = wrapper.findAll("button").find((button) => button.attributes("data-date") === "2026-05-15");
    expect(dayButton).toBeDefined();
    const dot = dayButton.find('[data-has-events="true"]');
    expect(dot.exists()).toBe(true);
    expect(dot.attributes("data-pending")).toBe("true");
    expect(dot.classes()).toContain("!bg-transparent");
    expect(dot.classes()).toContain("border");
  });

  it("renders separate pending and confirmed booking-status dots", () => {
    const wrapper = mountCalendar({
      monthDate: new Date("2030-05-01T00:00:00"),
      selectedDate: new Date("2030-05-17T00:00:00"),
      eventDotMode: "booking-status",
      events: [
        { id: "pending-1", start: "2030-05-15T10:00:00", end: "2030-05-15T10:30:00", status: "pending" },
        { id: "pending-2", start: "2030-05-15T11:00:00", end: "2030-05-15T11:30:00", status: "pending_hold" },
        { id: "confirmed-1", start: "2030-05-16T10:00:00", end: "2030-05-16T10:30:00", status: "confirmed" },
        { id: "mixed-pending", start: "2030-05-17T10:00:00", end: "2030-05-17T10:30:00", status: "pending" },
        { id: "mixed-confirmed", start: "2030-05-17T11:00:00", end: "2030-05-17T11:30:00", status: "confirmed" },
      ],
      theme: {
        mini: {
          selected: "selected",
          bookingStatusDots: "booking-status-dots",
        },
      },
    });

    const pendingDay = wrapper.get('[data-date="2030-05-15"]');
    const confirmedDay = wrapper.get('[data-date="2030-05-16"]');
    const mixedDay = wrapper.get('[data-date="2030-05-17"]');

    expect(pendingDay.findAll('[data-booking-status-dot="pending"]')).toHaveLength(1);
    expect(pendingDay.find('[data-booking-status-dot="confirmed"]').exists()).toBe(false);
    expect(confirmedDay.find('[data-booking-status-dot="pending"]').exists()).toBe(false);
    expect(confirmedDay.findAll('[data-booking-status-dot="confirmed"]')).toHaveLength(1);
    expect(mixedDay.findAll("[data-booking-status-dot]").map((dot) => dot.attributes("data-booking-status-dot")))
      .toEqual(["pending", "confirmed"]);
    expect(mixedDay.get('[data-booking-status-dot="pending"]').classes()).toContain("bg-[#FF4405]");
    expect(mixedDay.get('[data-booking-status-dot="confirmed"]').classes()).toContain("bg-[#07F468]");
  });

  it("keeps booking-status colors on today", () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const wrapper = mountCalendar({
      monthDate: today,
      selectedDate: tomorrow,
      eventDotMode: "booking-status",
      events: [
        { start: today, end: today, status: "pending" },
        { start: today, end: today, status: "confirmed" },
      ],
    });
    const dateKey = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");
    const todayButton = wrapper.get(`[data-date="${dateKey}"]`);

    expect(todayButton.get('[data-booking-status-dot="pending"]').classes()).toContain("bg-[#FF4405]");
    expect(todayButton.get('[data-booking-status-dot="confirmed"]').classes()).toContain("bg-[#07F468]");
  });

  it("ignores non-booking statuses in booking-status mode", () => {
    const wrapper = mountCalendar({
      monthDate: new Date("2030-05-01T00:00:00"),
      eventDotMode: "booking-status",
      events: [
        { start: "2030-05-15T10:00:00", end: "2030-05-15T10:30:00", status: "available", slot: "availability", isAvailabilityBlock: true },
        { start: "2030-05-16T10:00:00", end: "2030-05-16T10:30:00", status: "completed" },
        { start: "2030-05-17T10:00:00", end: "2030-05-17T10:30:00", status: "cancelled_user" },
        { start: "2030-05-18T10:00:00", end: "2030-05-18T10:30:00", status: "declined" },
        { start: "2030-05-19T10:00:00", end: "2030-05-19T10:30:00", status: "rejected" },
        { start: "2030-05-20T10:00:00", end: "2030-05-20T10:30:00", status: "unknown" },
      ],
    });

    for (let day = 15; day <= 20; day += 1) {
      expect(wrapper.get(`[data-date="2030-05-${day}"]`).find('[data-has-events="true"]').exists()).toBe(false);
    }
  });

  it("renders booking-status dots across multi-day ranges and still hides past dots", () => {
    const futureWrapper = mountCalendar({
      monthDate: new Date("2030-05-01T00:00:00"),
      eventDotMode: "booking-status",
      events: [{
        start: "2030-05-21T23:30:00",
        end: "2030-05-23T00:30:00",
        status: "confirmed",
      }],
    });

    for (const day of [21, 22, 23]) {
      expect(futureWrapper.get(`[data-date="2030-05-${day}"]`).find('[data-booking-status-dot="confirmed"]').exists()).toBe(true);
    }

    const pastWrapper = mountCalendar({
      monthDate: new Date("2020-01-01T00:00:00"),
      eventDotMode: "booking-status",
      hidePastDots: true,
      allowPastDates: true,
      events: [{ start: "2020-01-15T10:00:00", end: "2020-01-15T10:30:00", status: "confirmed" }],
    });

    expect(pastWrapper.get('[data-date="2020-01-15"]').find('[data-has-events="true"]').exists()).toBe(false);
  });

  it("applies selected background class to selected date", () => {
    const futureDate = new Date(Date.now() + 86400000);
    const wrapper = mountCalendar({
      monthDate: futureDate,
      selectedDate: futureDate,
      theme: {
        mini: {
          selected: "custom-selected-class",
        },
      },
    });

    const year = futureDate.getFullYear();
    const month = String(futureDate.getMonth() + 1).padStart(2, "0");
    const day = String(futureDate.getDate()).padStart(2, "0");
    const dateKey = `${year}-${month}-${day}`;

    const dayButton = wrapper.findAll("button").find((button) => button.attributes("data-date") === dateKey);
    expect(dayButton).toBeDefined();
    expect(dayButton.classes()).toContain("custom-selected-class");
  });

  it("does not apply hover background class to past or disabled dates", () => {
    const today = new Date();
    const pastDate = new Date("2020-01-15T00:00:00");
    const wrapper = mountCalendar({
      monthDate: pastDate,
      selectedDate: today,
    });

    const pastButton = wrapper.findAll("button").find((button) => button.attributes("data-date") === "2020-01-15");
    expect(pastButton).toBeDefined();
    expect(pastButton.attributes("disabled")).toBeDefined();
    expect(pastButton.classes()).not.toContain("hover:bg-gray-300");
  });

  it("allows past dates to be selected when allowPastDates is enabled", async () => {
    const wrapper = mountCalendar({
      monthDate: new Date("2020-01-01T00:00:00"),
      selectedDate: new Date(),
      allowPastDates: true,
    });

    const pastButton = wrapper.find("[data-date='2020-01-15']");
    expect(pastButton.attributes("disabled")).toBeUndefined();
    expect(pastButton.attributes("data-disabled")).toBe("false");
    expect(pastButton.attributes("data-expired")).toBe("true");
    expect(pastButton.classes()).toContain("hover:bg-gray-300");

    await pastButton.trigger("click");

    expect(wrapper.emitted("date-selected")).toHaveLength(1);
    expect(wrapper.emitted("date-selected")[0][0]).toEqual(new Date("2020-01-15T00:00:00"));
  });

  it("hides past date dots when hidePastDots is set to true", () => {
    const pastDate = new Date("2020-01-15T10:00:00");
    const wrapper = mountCalendar({
      monthDate: new Date("2020-01-01T00:00:00"),
      selectedDate: new Date(),
      hidePastDots: true,
      events: [
        { start: pastDate, end: pastDate }
      ]
    });

    const pastButton = wrapper.findAll("button").find((button) => button.attributes("data-date") === "2020-01-15");
    expect(pastButton).toBeDefined();
    const dot = pastButton.find('[data-has-events="true"]');
    expect(dot.exists()).toBe(false);
  });

  it("respects todayUsesSelectedDot=false and applies normal dot style to unselected today date", () => {
    const today = new Date();
    const otherDate = new Date(Date.now() + 86400000);
    const wrapper = mountCalendar({
      monthDate: today,
      selectedDate: otherDate,
      events: [{ start: today, end: today }],
      todayUsesSelectedDot: false,
      theme: {
        mini: {
          dot: "green-dot",
          selectedDot: "black-dot",
        },
      },
    });

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const dateKey = `${year}-${month}-${day}`;

    const todayButton = wrapper.findAll("button").find((button) => button.attributes("data-date") === dateKey);
    const dot = todayButton.find('[data-has-events="true"]');
    expect(dot.classes()).toContain("green-dot");
    expect(dot.classes()).not.toContain("black-dot");
  });
});
