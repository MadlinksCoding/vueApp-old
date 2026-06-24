import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { bookingTranslationSymbol, createBookingTranslator } from "@/i18n/bookingTranslations.js";

vi.mock("@/components/calendar/EventsWidget.vue", () => ({
  default: {
    name: "EventsWidget",
    props: ["sections"],
    emits: ["join-click", "reply-click", "event-click", "menu-action"],
    template: `
      <div>
        <button data-test="join" @click="$emit('join-click', sections[0].items[0])">join</button>
        <button data-test="reply" @click="$emit('reply-click', sections[0].items[0])">reply</button>
        <button data-test="event" @click="$emit('event-click', sections[0].items[0])">event</button>
        <button data-test="menu" @click="$emit('menu-action', { action: 'cancel_call', event: sections[0].items[0] })">menu</button>
      </div>
    `,
  },
}));

vi.mock("@/components/calendar/BookingScheduleList.vue", () => ({
  default: {
    name: "BookingScheduleList",
    props: ["events", "bookedSlotsIndex"],
    emits: ["edit", "delete"],
    template: `
      <div data-test="mobile-booking-schedule">
        <button data-test="schedule-edit" @click="$emit('edit', events[0])">edit</button>
        <button data-test="schedule-delete" @click="$emit('delete', events[0])">delete</button>
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
      },
    });

    expect(wrapper.getComponent({ name: "EventsWidget" }).props("sections")).toEqual([
      { title: "Today", items: [item] },
    ]);

    await wrapper.get("[data-test='join']").trigger("click");
    await wrapper.get("[data-test='reply']").trigger("click");
    await wrapper.get("[data-test='event']").trigger("click");
    await wrapper.get("[data-test='menu']").trigger("click");

    expect(wrapper.emitted("join-click")).toEqual([[item]]);
    expect(wrapper.emitted("reply-click")).toEqual([[item]]);
    expect(wrapper.emitted("event-click")).toEqual([[item]]);
    expect(wrapper.emitted("menu-action")).toEqual([
      [{ action: "cancel_call", event: item }],
    ]);
  });

  it("renders mobile calendar labels from booking translations", async () => {
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
              common_day: "Dia",
              common_week: "Semana",
              common_month: "Mes",
              dashboard_new_events: "Eventos nuevos",
            },
          }),
        },
      },
    });

    expect(wrapper.text()).toContain("Dia");
    expect(wrapper.text()).toContain("Semana");
    expect(wrapper.text()).toContain("Mes");
    expect(wrapper.get("[data-test='new-events']").text()).toBe("Eventos nuevos");
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

    expect(wrapper.emitted("edit-schedule-event")).toEqual([[scheduleEvents[0]]]);
    expect(wrapper.emitted("delete-schedule-event")).toEqual([[scheduleEvents[0]]]);
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
