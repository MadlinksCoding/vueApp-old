import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { bookingTranslationSymbol, createBookingTranslator } from "@/i18n/bookingTranslations.js";
import BookingFlowStep4 from "@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep4.vue";

function getByPath(target, path) {
  return String(path).split(".").reduce((cursor, segment) => cursor?.[segment], target);
}

describe("BookingFlowStep4", () => {
  it("translates the active calendar action", async () => {
    const state = {
      bookingDetails: {
        selectedDuration: { value: 30 },
        totalPrice: 120,
        headerDateDisplay: "January 15, 2030",
        formattedTimeRange: "10:00 AM-10:30 AM",
      },
      fanBooking: {
        context: {
          creatorId: 1407,
          selectedEvent: {
            eventId: "evt_private",
            title: "Private Recording",
            allowInstantBooking: true,
          },
        },
        booking: {
          bookingId: "booking_123",
          result: {
            item: {
              bookingId: "booking_123",
              approvalStatus: "auto",
              payment: { total: 120 },
            },
          },
        },
      },
    };
    const engine = {
      getState: vi.fn((path) => getByPath(state, path)),
      goToStep: vi.fn(),
    };
    const translator = createBookingTranslator({
      locale: "zh",
      translations: {
        fan_booking_view_events_on_calendar: "在日历中查看活动",
      },
    });

    const wrapper = mount(BookingFlowStep4, {
      props: { engine, embedded: true },
      global: {
        provide: {
          [bookingTranslationSymbol]: translator,
        },
      },
    });

    expect(wrapper.text()).toContain("在日历中查看活动");
    expect(wrapper.text()).not.toContain("View events on your calendar");
    expect(engine.goToStep).not.toHaveBeenCalled();
  });
});
