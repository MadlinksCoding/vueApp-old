import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { bookingTranslationSymbol, createBookingTranslator } from "@/i18n/bookingTranslations.js";

vi.mock("@/components/calendar/EventsWidget.vue", () => ({
  default: {
    name: "EventsWidget",
    props: ["sections", "userRole"],
    emits: ["join-click", "reply-click", "event-click", "menu-action", "approve-booking"],
    template: `
      <div>
        <button data-test="join" @click="$emit('join-click', sections[0].items[0])">join</button>
        <button data-test="reply" @click="$emit('reply-click', sections[0].items[0])">reply</button>
        <button data-test="event" @click="$emit('event-click', sections[0].items[0])">event</button>
        <button data-test="menu" @click="$emit('menu-action', { action: 'cancel_call', event: sections[0].items[0] })">menu</button>
        <button data-test="approve" @click="$emit('approve-booking', { bookingId: 'booking_1', decision: 'approve', event: sections[0].items[0].sourceEvent })">approve</button>
      </div>
    `,
  },
}));

vi.mock("@/components/calendar/BookingScheduleList.vue", () => ({
  default: {
    name: "BookingScheduleList",
    props: ["events", "bookedSlotsIndex"],
    emits: ["edit", "delete", "view-card"],
    template: `
      <div data-test="mobile-booking-schedule">
        <button data-test="schedule-edit" @click="$emit('edit', events[0])">edit</button>
        <button data-test="schedule-delete" @click="$emit('delete', events[0])">delete</button>
        <button data-test="schedule-view-card" @click="$emit('view-card', events[0])">view card</button>
      </div>
    `,
  },
}));

vi.mock("@/components/dev/button/ButtonComponent.vue", () => ({
  default: {
    name: "ButtonComponent",
    props: ["text"],
    emits: ["click"],
    template: "<button data-test='new-events' @click=\"$emit('click')\">{{ text }}</button>",
  },
}));

describe("CalendarMobilePopupContent", () => {
  it("forwards widget actions with the dynamic event item", async () => {
    const { default: CalendarMobilePopupContent } = await import("@/components/calendar/CalendarMobilePopupContent.vue");
    const item = {
      title: "Dynamic booked slot",
      sourceEvent: { id: "booking_1" },
    };
    const wrapper = mount(CalendarMobilePopupContent, {
      props: {
        view: "week",
        eventsData: [{ title: "Today", items: [item] }],
        canCreateEvents: true,
        userRole: "fan",
      },
    });

    expect(wrapper.getComponent({ name: "EventsWidget" }).props("sections")).toEqual([
      { title: "Today", items: [item] },
    ]);
    expect(wrapper.getComponent({ name: "EventsWidget" }).props("userRole")).toBe("fan");

    await wrapper.get("[data-test='join']").trigger("click");
    await wrapper.get("[data-test='reply']").trigger("click");
    await wrapper.get("[data-test='event']").trigger("click");
    await wrapper.get("[data-test='menu']").trigger("click");
    await wrapper.get("[data-test='approve']").trigger("click");

    expect(wrapper.emitted("join-click")).toEqual([[item]]);
    expect(wrapper.emitted("reply-click")).toEqual([[item]]);
    expect(wrapper.emitted("event-click")).toEqual([[item]]);
    expect(wrapper.emitted("menu-action")).toEqual([
      [{ action: "cancel_call", event: item }],
    ]);
    expect(wrapper.emitted("approve-booking")).toEqual([[
      { bookingId: "booking_1", decision: "approve", event: item.sourceEvent },
    ]]);
  });

  it("renders the popup title and close label from booking translations", async () => {
    const { default: CalendarMobilePopupContent } = await import("@/components/calendar/CalendarMobilePopupContent.vue");
    const wrapper = mount(CalendarMobilePopupContent, {
      props: {
        view: "day",
        eventsData: [{ title: "Today", items: [{ title: "Slot" }] }],
        canCreateEvents: true,
      },
      global: {
        provide: {
          [bookingTranslationSymbol]: createBookingTranslator({
            translations: {
              common_close: "Cerrar",
              dashboard_events_requests_title: "Eventos y solicitudes",
            },
          }),
        },
      },
    });

    expect(wrapper.get("h2").text()).toBe("Eventos y solicitudes");
    expect(wrapper.get("button[aria-label='Cerrar']").exists()).toBe(true);
  });

  it("hides the new events button when creation is not allowed", async () => {
    const { default: CalendarMobilePopupContent } = await import("@/components/calendar/CalendarMobilePopupContent.vue");
    const wrapper = mount(CalendarMobilePopupContent, {
      props: {
        view: "week",
        eventsData: [{ title: "Today", items: [{ title: "Slot" }] }],
        canCreateEvents: false,
      },
    });

    expect(wrapper.find("[data-test='new-events']").exists()).toBe(false);
  });

  it("renders the booking schedule list on mobile and forwards schedule actions", async () => {
    const { default: CalendarMobilePopupContent } = await import("@/components/calendar/CalendarMobilePopupContent.vue");
    const scheduleEvents = [{ eventId: "evt_mobile_schedule", title: "Mobile schedule" }];
    const bookedSlotsIndex = {
      evt_mobile_schedule: {
        "2026-05-01": [{ startAtIso: "2026-05-01T10:00:00Z" }],
      },
    };
    const wrapper = mount(CalendarMobilePopupContent, {
      props: {
        view: "week",
        eventsData: [{ title: "Today", items: [{ title: "Slot" }] }],
        bookingScheduleEvents: scheduleEvents,
        bookingScheduleBookedSlotsIndex: bookedSlotsIndex,
        showBookingScheduleList: true,
      },
    });

    const scheduleList = wrapper.getComponent({ name: "BookingScheduleList" });
    expect(scheduleList.props("events")).toEqual(scheduleEvents);
    expect(scheduleList.props("bookedSlotsIndex")).toEqual(bookedSlotsIndex);

    await wrapper.get("[data-test='schedule-edit']").trigger("click");
    await wrapper.get("[data-test='schedule-delete']").trigger("click");
    await wrapper.get("[data-test='schedule-view-card']").trigger("click");

    expect(wrapper.emitted("edit-schedule-event")).toEqual([[scheduleEvents[0]]]);
    expect(wrapper.emitted("delete-schedule-event")).toEqual([[scheduleEvents[0]]]);
    expect(wrapper.emitted("view-schedule-card")).toEqual([[scheduleEvents[0]]]);
  });

  it("hides the booking schedule list when the mobile schedule flag is off", async () => {
    const { default: CalendarMobilePopupContent } = await import("@/components/calendar/CalendarMobilePopupContent.vue");
    const wrapper = mount(CalendarMobilePopupContent, {
      props: {
        view: "week",
        eventsData: [{ title: "Today", items: [{ title: "Slot" }] }],
        bookingScheduleEvents: [{ eventId: "evt_hidden", title: "Hidden schedule" }],
        showBookingScheduleList: false,
      },
    });

    expect(wrapper.find("[data-test='mobile-booking-schedule']").exists()).toBe(false);
  });
});
