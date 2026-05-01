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
});
