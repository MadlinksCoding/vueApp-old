import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

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
    emits: ["click"],
    template: "<button data-test='new-events' @click=\"$emit('click')\" />",
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
});
