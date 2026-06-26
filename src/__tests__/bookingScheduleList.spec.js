import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { bookingTranslationSymbol, createBookingTranslator } from "@/i18n/bookingTranslations.js";

const mocks = vi.hoisted(() => ({
  mapAvailabilityToCalendarEvents: vi.fn(),
}));

vi.mock("@/services/bookings/utils/bookingSlotUtils.js", () => ({
  mapAvailabilityToCalendarEvents: mocks.mapAvailabilityToCalendarEvents,
}));

describe("BookingScheduleList", () => {
  it("renders active schedules with eventColorSkin accents and disabled menu items", async () => {
    mocks.mapAvailabilityToCalendarEvents.mockImplementation(([event]) => (
      event?.eventId === "evt_open"
        ? [{ start: new Date().toISOString(), end: new Date(Date.now() + 30 * 60 * 1000).toISOString() }]
        : []
    ));

    const { default: BookingScheduleList } = await import("@/components/calendar/BookingScheduleList.vue");
    const wrapper = mount(BookingScheduleList, {
      props: {
        events: [
          {
            eventId: "evt_open",
            title: "High School simulator",
            status: "active",
            type: "1on1-call",
            eventColorSkin: "#E11D48",
          },
          {
            eventId: "evt_invalid_color",
            title: "Fallback Color",
            status: "active",
            eventColorSkin: "not-a-color",
          },
          {
            eventId: "evt_deleted",
            title: "Deleted Event",
            status: "deleted",
            eventColorSkin: "#000000",
          },
        ],
      },
    });

    const rows = wrapper.findAll("[data-test='booking-schedule-row']");

    expect(wrapper.text()).toContain("YOUR BOOKING SCHEDULE");
    expect(wrapper.text()).toContain("2");
    expect(wrapper.text()).toContain("High School simulator");
    expect(wrapper.text()).toContain("Fallback Color");
    expect(wrapper.text()).not.toContain("Deleted Event");
    expect(rows).toHaveLength(2);
    expect(rows[0].find("h4").element.style.color).toBe("rgb(225, 29, 72)");
    expect(rows[1].find("h4").element.style.color).toBe("rgb(85, 73, 255)");
    expect(wrapper.text()).toContain("OPEN FOR BOOKING TODAY");
    expect(wrapper.text()).toContain("CLOSED FOR BOOKING TODAY");

    const toggleButton = wrapper.get("[data-test='booking-schedule-toggle']");
    const toggleIcon = wrapper.get("[data-test='booking-schedule-toggle-icon']");
    expect(toggleButton.attributes("aria-expanded")).toBe("true");
    expect(toggleButton.attributes("aria-label")).toBe("Toggle booking schedule");
    expect(toggleIcon.classes()).not.toContain("rotate-180");

    await rows[0].find("button[aria-label='Open options for High School simulator']").trigger("click");

    const menuButtons = wrapper.find("[data-test='booking-schedule-menu']").findAll("button");
    expect(menuButtons.map((button) => button.text())).toEqual([
      "Edit",
      "View schedule card",
      "View in profile",
      "Share booking page",
      "Delete",
    ]);
    expect(menuButtons[2].attributes("disabled")).toBeDefined();
    expect(menuButtons[3].attributes("disabled")).toBeDefined();

    await menuButtons[0].trigger("click");
    expect(wrapper.emitted("edit")?.[0]?.[0]).toEqual(expect.objectContaining({
      eventId: "evt_open",
      title: "High School simulator",
      type: "private",
    }));

    await rows[0].find("button[aria-label='Open options for High School simulator']").trigger("click");
    await wrapper.find("[data-test='booking-schedule-menu']").findAll("button")[1].trigger("click");
    expect(wrapper.emitted("view-card")?.[0]?.[0]).toEqual(expect.objectContaining({
      eventId: "evt_open",
      title: "High School simulator",
      type: "private",
    }));

    await rows[0].find("button[aria-label='Open options for High School simulator']").trigger("click");
    await wrapper.find("[data-test='booking-schedule-menu']").findAll("button")[4].trigger("click");
    expect(wrapper.emitted("delete")?.[0]?.[0]).toEqual(expect.objectContaining({
      eventId: "evt_open",
      title: "High School simulator",
    }));
  });

  it("collapses and expands rows from the arrow button while closing open menus", async () => {
    mocks.mapAvailabilityToCalendarEvents.mockReturnValue([]);

    const { default: BookingScheduleList } = await import("@/components/calendar/BookingScheduleList.vue");
    const wrapper = mount(BookingScheduleList, {
      props: {
        events: [
          {
            eventId: "evt_one",
            title: "First schedule",
            status: "active",
            eventColorSkin: "#5549FF",
          },
          {
            eventId: "evt_two",
            title: "Second schedule",
            status: "active",
            eventColorSkin: "#E11D48",
          },
        ],
      },
    });

    const toggleButton = wrapper.get("[data-test='booking-schedule-toggle']");
    const toggleIcon = wrapper.get("[data-test='booking-schedule-toggle-icon']");

    expect(toggleButton.attributes("aria-expanded")).toBe("true");
    expect(wrapper.findAll("[data-test='booking-schedule-row']")).toHaveLength(2);
    expect(wrapper.find("[data-test='booking-schedule-items']").exists()).toBe(true);
    expect(toggleIcon.classes()).not.toContain("rotate-180");

    await wrapper.get("button[aria-label='Open options for First schedule']").trigger("click");
    expect(wrapper.find("[data-test='booking-schedule-menu']").exists()).toBe(true);

    await toggleButton.trigger("click");
    expect(toggleButton.attributes("aria-expanded")).toBe("false");
    expect(wrapper.findAll("[data-test='booking-schedule-row']")).toHaveLength(0);
    expect(wrapper.find("[data-test='booking-schedule-items']").exists()).toBe(false);
    expect(wrapper.find("[data-test='booking-schedule-menu']").exists()).toBe(false);
    expect(toggleIcon.classes()).toContain("rotate-180");

    await toggleButton.trigger("click");
    expect(toggleButton.attributes("aria-expanded")).toBe("true");
    expect(wrapper.findAll("[data-test='booking-schedule-row']")).toHaveLength(2);
    expect(wrapper.find("[data-test='booking-schedule-items']").exists()).toBe(true);
    expect(toggleIcon.classes()).not.toContain("rotate-180");
  });

  it("renders schedule list labels from scoped translation overrides", async () => {
    mocks.mapAvailabilityToCalendarEvents.mockReturnValue([
      { start: new Date().toISOString(), end: new Date(Date.now() + 30 * 60 * 1000).toISOString() },
    ]);

    const { default: BookingScheduleList } = await import("@/components/calendar/BookingScheduleList.vue");
    const wrapper = mount(BookingScheduleList, {
      props: {
        events: [
          {
            eventId: "evt_translated",
            title: "Translated Event",
            status: "active",
            eventColorSkin: "#5549FF",
          },
        ],
      },
      global: {
        provide: {
          [bookingTranslationSymbol]: createBookingTranslator({
            translations: {
              dashboard_booking_schedule_title: "MI AGENDA",
              dashboard_booking_schedule_open_today: "ABIERTO HOY",
              dashboard_booking_schedule_menu_aria: "Opciones para {title}",
              dashboard_booking_schedule_toggle_aria: "Alternar agenda",
              common_edit: "Editar",
              dashboard_booking_schedule_view_card: "Ver tarjeta de agenda",
              dashboard_booking_schedule_view_profile: "Ver perfil",
              dashboard_booking_schedule_share_booking_page: "Compartir pagina",
              common_delete: "Eliminar",
            },
          }),
        },
      },
    });

    expect(wrapper.text()).toContain("MI AGENDA");
    expect(wrapper.text()).toContain("ABIERTO HOY");
    expect(wrapper.get("[data-test='booking-schedule-toggle']").attributes("aria-label")).toBe("Alternar agenda");

    const optionsButton = wrapper.get("button[aria-label='Opciones para Translated Event']");
    await optionsButton.trigger("click");

    const menuButtons = wrapper.find("[data-test='booking-schedule-menu']").findAll("button");
    expect(menuButtons.map((button) => button.text())).toEqual([
      "Editar",
      "Ver tarjeta de agenda",
      "Ver perfil",
      "Compartir pagina",
      "Eliminar",
    ]);
  });
});
