import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { bookingTranslationSymbol, createBookingTranslator } from "@/i18n/bookingTranslations.js";

vi.mock("@/components/calendar/EventsWidget.vue", () => ({
  default: {
    name: "EventsWidget",
    props: ["sections", "userRole"],
    emits: ["approve-booking"],
    template: `<div data-test="events-widget"><button data-test="approve-booking" @click="$emit('approve-booking', { bookingId: 'booking_pending', decision: 'approve' })">approve</button></div>`,
  },
}));

vi.mock("@/components/calendar/BookingScheduleList.vue", () => ({
  default: {
    name: "BookingScheduleList",
    props: ["events", "bookedSlotsIndex"],
    template: "<div data-test='booking-schedule-list' />",
  },
}));

const translatedMessages = {
  common_close: "Cerrar",
  dashboard_events_requests_title: "Eventos y solicitudes",
  dashboard_events_requests_schedule_tab: "Agenda",
  calendar_event_status_confirmed: "Confirmados",
  calendar_event_status_pending: "Pendientes",
  dashboard_pending_events: "SOLICITUDES PENDIENTES",
};

const findButton = (wrapper, label) => wrapper
  .findAll("button")
  .find((button) => button.text().includes(label));

describe("EventsRequestsPopup", () => {
  it("translates its title, tabs, and close label while filtering sections by metadata", async () => {
    const { default: EventsRequestsPopup } = await import("@/components/calendar/EventsRequestsPopup.vue");
    const confirmedItem = { title: "Confirmed item" };
    const pendingItems = [{ title: "Pending one" }, { title: "Pending two" }];
    const confirmedSection = {
      title: "PRÓXIMOS",
      items: [confirmedItem],
      isPending: false,
    };
    const pendingSection = {
      title: "SOLICITUDES",
      items: pendingItems,
      isPending: true,
    };
    const scheduleEvents = [{ title: "Schedule one" }, { title: "Schedule two" }];
    const wrapper = mount(EventsRequestsPopup, {
      props: {
        eventsData: [confirmedSection, pendingSection],
        bookingScheduleEvents: scheduleEvents,
      },
      global: {
        provide: {
          [bookingTranslationSymbol]: createBookingTranslator({ translations: translatedMessages }),
        },
      },
    });

    expect(wrapper.get("h2").text()).toBe("Eventos y solicitudes");
    expect(wrapper.get("button[aria-label='Cerrar']").exists()).toBe(true);
    expect(findButton(wrapper, "Agenda").text()).toContain("2");
    expect(findButton(wrapper, "Confirmados").text()).toContain("1");
    expect(findButton(wrapper, "Pendientes").text()).toContain("2");
    expect(wrapper.getComponent({ name: "BookingScheduleList" }).props("events")).toEqual(scheduleEvents);

    await findButton(wrapper, "Confirmados").trigger("click");
    expect(wrapper.getComponent({ name: "EventsWidget" }).props("sections")).toEqual([confirmedSection]);

    await findButton(wrapper, "Pendientes").trigger("click");
    expect(wrapper.getComponent({ name: "EventsWidget" }).props("sections")).toEqual([pendingSection]);
    await wrapper.get("[data-test='approve-booking']").trigger("click");
    expect(wrapper.emitted("approve-booking")).toEqual([[
      { bookingId: "booking_pending", decision: "approve" },
    ]]);
  });

  it("recognizes a translated pending section from older callers without metadata", async () => {
    const { default: EventsRequestsPopup } = await import("@/components/calendar/EventsRequestsPopup.vue");
    const pendingSection = {
      title: "SOLICITUDES PENDIENTES",
      items: [{ title: "Legacy pending item" }],
    };
    const wrapper = mount(EventsRequestsPopup, {
      props: { eventsData: [pendingSection] },
      global: {
        provide: {
          [bookingTranslationSymbol]: createBookingTranslator({ translations: translatedMessages }),
        },
      },
    });

    await findButton(wrapper, "Pendientes").trigger("click");
    expect(wrapper.getComponent({ name: "EventsWidget" }).props("sections")).toEqual([
      expect.objectContaining({ ...pendingSection, isPending: true }),
    ]);
  });

  it("filters mixed sections by booking status, deduplicates bookings, and drops terminal items", async () => {
    const { default: EventsRequestsPopup } = await import("@/components/calendar/EventsRequestsPopup.vue");
    const confirmed = {
      title: "Confirmed booking",
      sourceEvent: { bookingId: "booking_confirmed", status: "confirmed" },
    };
    const pending = {
      title: "Pending booking",
      sourceEvent: { bookingId: "booking_pending", status: "pending_hold" },
    };
    const completed = {
      title: "Completed booking",
      sourceEvent: { bookingId: "booking_completed", status: "completed" },
    };
    const wrapper = mount(EventsRequestsPopup, {
      props: {
        eventsData: [
          { title: "MIXED", items: [confirmed, pending, completed], isPending: false },
          { title: "SOLICITUDES", items: [pending, confirmed], isPending: true },
        ],
      },
      global: {
        provide: {
          [bookingTranslationSymbol]: createBookingTranslator({ translations: translatedMessages }),
        },
      },
    });

    expect(findButton(wrapper, "Confirmados").text()).toContain("1");
    expect(findButton(wrapper, "Pendientes").text()).toContain("1");

    await findButton(wrapper, "Confirmados").trigger("click");
    expect(wrapper.getComponent({ name: "EventsWidget" }).props("sections")
      .flatMap((section) => section.items)).toEqual([confirmed]);

    await findButton(wrapper, "Pendientes").trigger("click");
    expect(wrapper.getComponent({ name: "EventsWidget" }).props("sections")
      .flatMap((section) => section.items)).toEqual([pending]);
  });
});
