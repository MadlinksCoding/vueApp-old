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
      minDate: new Date("2026-05-06T00:00:00"),
      monthDate: new Date("2030-05-01T00:00:00"),
      minDate: new Date("2030-05-06T00:00:00"),
      maxDate: new Date("2030-05-21T00:00:00"),
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
});

