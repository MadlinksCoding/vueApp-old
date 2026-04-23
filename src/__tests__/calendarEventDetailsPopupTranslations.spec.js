import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { bookingTranslationSymbol, createBookingTranslator } from "@/i18n/bookingTranslations.js";

vi.mock("@/utils/bookingJoinUtils.js", () => ({
  getBookingJoinState: vi.fn(() => ({
    canJoin: true,
    joinUrl: "https://example.com/join/booking_123",
  })),
}));

describe("CalendarEventDetailsPopup translations", () => {
  it("renders translated labels for actions, details, and rejection confirmation", async () => {
    const { default: CalendarEventDetailsPopup } = await import("@/components/calendar/CalendarEventDetailsPopup.vue");

    const wrapper = mount(CalendarEventDetailsPopup, {
      props: {
        canReviewPending: true,
        event: {
          title: "Creator Strategy Call",
          start: "2099-04-23T10:00:00Z",
          end: "2099-04-23T10:30:00Z",
          status: "pending",
          raw: {
            status: "pending",
            guestCount: 2,
            payment: {
              total: 125,
              currency: "TOKENS",
            },
            reminderMinutes: 15,
          },
        },
      },
      global: {
        provide: {
          [bookingTranslationSymbol]: createBookingTranslator({
            translations: {
              common_join_call: "Unirse a llamada",
              dashboard_ask_for_more_time: "Pedir mas tiempo",
              dashboard_ask_to_reschedule: "Pedir reprogramar",
              dashboard_cancel_call: "Cancelar llamada",
              calendar_event_additional_request: "Solicitud adicional",
              calendar_event_no_additional_request: "Sin solicitud adicional",
              calendar_event_minimum_charge: "Cargo minimo",
              calendar_event_tokens: "{count} creditos",
              calendar_event_minutes_before: "{count} minutos antes",
              calendar_event_open_chat: "Abrir chat",
              calendar_event_accept: "ACEPTAR",
              calendar_event_decline: "RECHAZAR",
              calendar_event_reject_confirm: "Seguro que quieres rechazar esta reserva?",
              calendar_event_yes_reject: "Si, rechazar",
              common_cancel: "Cancelar",
              calendar_event_guest_count: "{count} {label}",
              calendar_event_guest_other: "invitados",
            },
          }),
        },
      },
    });

    expect(wrapper.text()).toContain("Unirse a llamada");
    expect(wrapper.text()).toContain("Solicitud adicional");
    expect(wrapper.text()).toContain("Sin solicitud adicional");
    expect(wrapper.text()).toContain("Cargo minimo");
    expect(wrapper.text()).toContain("125 creditos");
    expect(wrapper.text()).toContain("15 minutos antes");
    expect(wrapper.text()).toContain("Abrir chat");
    expect(wrapper.text()).toContain("2 invitados");

    await wrapper.find("button[aria-expanded='false']").trigger("click");

    expect(wrapper.text()).toContain("Pedir mas tiempo");
    expect(wrapper.text()).toContain("Pedir reprogramar");
    expect(wrapper.text()).toContain("Cancelar llamada");

    await wrapper.findAll("button").find((button) => button.text().includes("RECHAZAR")).trigger("click");

    expect(wrapper.text()).toContain("Seguro que quieres rechazar esta reserva?");
    expect(wrapper.text()).toContain("Si, rechazar");
    expect(wrapper.text()).toContain("Cancelar");
  });
});
