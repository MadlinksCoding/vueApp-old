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
});
