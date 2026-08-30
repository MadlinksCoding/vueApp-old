import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { bookingTranslationSymbol, createBookingTranslator } from "@/i18n/bookingTranslations.js";
import BookingFlowStep4 from "@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep4.vue";

const bridgeMocks = vi.hoisted(() => ({
  requestFanBookingOpenChat: vi.fn(),
  requestFanBookingOpenDetails: vi.fn(),
}));

vi.mock("@/embeds/fanBooking/bridge.js", () => bridgeMocks);

function getByPath(target, path) {
  return String(path).split(".").reduce((cursor, segment) => cursor?.[segment], target);
}

function createState({ approvalStatus = "auto", event = {}, bookingDetails = {}, creatorPresentation = {} } = {}) {
  return {
    bookingDetails: {
      selectedDuration: { value: 30 },
      totalPrice: 120,
      finalTotalPrice: 110,
      firstTimeDiscountAmount: 10,
      headerDateDisplay: "January 15, 2030",
      formattedTimeRange: "10:00 AM-10:30 AM",
      ...bookingDetails,
    },
    fanBooking: {
      context: {
        creatorId: 1407,
        fanId: 25,
        creatorPresentation: {
          avatar: "/creator.webp",
          name: "Dynamic Creator",
          isVerified: true,
          ...creatorPresentation,
        },
        selectedEvent: {
          eventId: "evt_private",
          title: "Private Recording",
          type: "private-event",
          eventCallType: "audio",
          allowInstantBooking: false,
          ...event,
        },
      },
      booking: {
        bookingId: "booking_123",
        chatId: "chat_123",
        result: {
          item: {
            bookingId: "booking_123",
            approvalStatus,
            payment: { total: 12345 },
          },
        },
      },
    },
  };
}

function createEngine(state) {
  return {
    getState: vi.fn((path) => getByPath(state, path)),
    goToStep: vi.fn(),
  };
}

function mountStep4(state, { locale = "en", translations = {} } = {}) {
  const engine = createEngine(state);
  const translator = createBookingTranslator({ locale, translations });
  const wrapper = mount(BookingFlowStep4, {
    props: { engine, embedded: true },
    global: {
      provide: {
        [bookingTranslationSymbol]: translator,
      },
    },
  });
  return { engine, wrapper };
}

describe("BookingFlowStep4", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders live booking data in both summaries with localized token and duration values", () => {
    const state = createState();
    const { engine, wrapper } = mountStep4(state, { locale: "de-DE" });

    for (const suffix of ["desktop", "mobile"]) {
      expect(wrapper.get(`[data-testid='step4-creator-${suffix}']`).text()).toBe("Dynamic Creator");
      expect(wrapper.get(`[data-testid='step4-event-title-${suffix}']`).text()).toBe("Private Recording");
      expect(wrapper.get(`[data-testid='step4-event-type-${suffix}']`).text()).toBe("1on1 Audio Call");
      expect(wrapper.get(`[data-testid='step4-date-${suffix}']`).text()).toBe("January 15, 2030");
      expect(wrapper.get(`[data-testid='step4-time-${suffix}']`).text()).toBe("10:00 AM-10:30 AM");
      expect(wrapper.get(`[data-testid='step4-duration-${suffix}']`).text()).toBe("30 min.");
      expect(wrapper.get(`[data-testid='step4-total-${suffix}']`).text()).toContain("12.345");
      expect(wrapper.get(`[data-testid='step4-discount-${suffix}']`).text()).toContain("10");
    }

    expect(wrapper.get("[data-testid='step4-approval-desktop']").text()).toBe("INSTANT APPROVAL");
    expect(wrapper.find("[data-testid='step4-calendar-action-desktop']").exists()).toBe(true);
    expect(wrapper.text()).not.toContain("Worn Socks");
    expect(wrapper.text()).not.toContain("VIEW ORDER DETAIL");
    expect(wrapper.find("img[src*='i.ibb.co']").exists()).toBe(false);
    expect(engine.goToStep).not.toHaveBeenCalled();
  });

  it("uses translated pending content and private policies for manual approval", () => {
    const state = createState({
      approvalStatus: "manual_required",
      event: { allowInstantBooking: true },
    });
    const translations = {
      fan_booking_step4_pending_title: "Solicitud enviada",
      fan_booking_step4_pending_message: "Esperando aprobación",
      fan_booking_approval_required: "REQUIERE APROBACIÓN",
      fan_booking_booking_policy: "POLÍTICA",
      fan_booking_policy_hold_fee: "Retención traducida",
      fan_booking_policy_creator_late_partial: "Retraso de {creator}",
      fan_booking_policy_creator_late_full: "Ausencia de {creator}",
      fan_booking_policy_fan_late: "Retraso del fan",
    };
    const { wrapper } = mountStep4(state, { locale: "es", translations });

    expect(wrapper.get("[data-testid='step4-status-title']").text()).toBe("Solicitud enviada");
    expect(wrapper.get("[data-testid='step4-status-message']").text()).toBe("Esperando aprobación");
    expect(wrapper.get("[data-testid='step4-approval-mobile']").text()).toBe("REQUIERE APROBACIÓN");
    expect(wrapper.find("[data-testid='step4-calendar-action-desktop']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='step4-calendar-action-mobile']").exists()).toBe(true);
    expect(wrapper.get("[data-testid='step4-policy']").text()).toContain("POLÍTICA");
    expect(wrapper.findAll("[data-testid='step4-policy-item']").map((item) => item.text())).toEqual([
      "Retención traducida",
      "Retraso de Dynamic Creator",
      "Ausencia de Dynamic Creator",
      "Retraso del fan",
    ]);
  });

  it("renders translated group event type and event-goal policies as confirmed", () => {
    const state = createState({
      approvalStatus: "",
      event: {
        type: "group-event",
        eventCallType: "video",
        priceSetting: "eventGoal",
      },
    });
    const translations = {
      fan_booking_video: "Vídeo",
      fan_booking_group_call_type: "Grupo {media}",
      fan_booking_instant_approval: "CONFIRMADO",
      fan_booking_group_event_policy_title: "Reglas del evento",
      fan_booking_group_policy_hold_contribution: "Aporte retenido",
      fan_booking_group_policy_goal_not_reached: "Meta no alcanzada",
      fan_booking_group_policy_host_late: "Host {creator} ausente",
      fan_booking_group_policy_coperformer_late: "Coartistas ausentes",
    };
    const { wrapper } = mountStep4(state, { locale: "es", translations });

    expect(wrapper.get("[data-testid='step4-event-type-desktop']").text()).toBe("Grupo Vídeo");
    expect(wrapper.get("[data-testid='step4-approval-desktop']").text()).toBe("CONFIRMADO");
    expect(wrapper.get("[data-testid='step4-policy']").text()).toContain("Reglas del evento");
    expect(wrapper.findAll("[data-testid='step4-policy-item']").map((item) => item.text())).toEqual([
      "Aporte retenido",
      "Meta no alcanzada",
      "Host Dynamic Creator ausente",
      "Coartistas ausentes",
    ]);
  });

  it("normalizes blank displays, omits invalid duration, and uses final total when payment is absent", () => {
    const state = createState({
      bookingDetails: {
        selectedDuration: { value: 0 },
        headerDateDisplay: " ",
        selectedDateDisplay: "",
        formattedTimeRange: "",
        finalTotalPrice: 4500,
      },
    });
    delete state.fanBooking.booking.result.item.payment;
    delete state.fanBooking.booking.chatId;
    delete state.fanBooking.context.creatorId;
    delete state.fanBooking.context.selectedEvent.creatorId;
    delete state.fanBooking.context.selectedEvent.raw;

    const { wrapper } = mountStep4(state, { locale: "en-US" });

    expect(wrapper.get("[data-testid='step4-date-desktop']").text()).toBe("-");
    expect(wrapper.get("[data-testid='step4-time-desktop']").text()).toBe("-");
    expect(wrapper.find("[data-testid='step4-duration-desktop']").exists()).toBe(false);
    expect(wrapper.get("[data-testid='step4-total-desktop']").text()).toContain("4,500");
    expect(wrapper.find("[data-testid='step4-message-action-desktop']").exists()).toBe(false);
  });

  it("runs available actions and returns incomplete booking state to payment", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    const state = createState();
    const { wrapper } = mountStep4(state, {
      translations: { fan_booking_view_events_on_calendar: "Translated calendar" },
    });

    await wrapper.get("[data-testid='step4-message-action-desktop']").trigger("click");
    expect(bridgeMocks.requestFanBookingOpenChat).toHaveBeenCalledWith({ chatId: "chat_123", userId: "1407" });
    expect(wrapper.emitted("close-popup")).toHaveLength(1);
    await wrapper.get("[data-testid='step4-calendar-action-desktop']").trigger("click");
    expect(bridgeMocks.requestFanBookingOpenDetails).toHaveBeenCalledWith({ bookingId: "booking_123" });
    expect(openSpy).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Translated calendar");
    await wrapper.get("[data-test='booking-flow-step4-close-button']").trigger("click");
    expect(wrapper.emitted("close-popup")).toHaveLength(2);

    const incompleteState = createState();
    incompleteState.fanBooking.booking = { result: { item: {} } };
    const { engine: incompleteEngine } = mountStep4(incompleteState);
    expect(incompleteEngine.goToStep).toHaveBeenCalledWith(3);
    openSpy.mockRestore();
  });

  it("resolves booking detail IDs from result and engine-level fallbacks", async () => {
    const resultState = createState();
    delete resultState.fanBooking.booking.bookingId;
    delete resultState.fanBooking.booking.result.item.bookingId;
    resultState.fanBooking.booking.result.bookingId = "booking_from_result";
    const { wrapper: resultWrapper } = mountStep4(resultState);

    await resultWrapper.get("[data-testid='step4-calendar-action-desktop']").trigger("click");
    expect(bridgeMocks.requestFanBookingOpenDetails).toHaveBeenLastCalledWith({
      bookingId: "booking_from_result",
    });

    const engineState = createState();
    delete engineState.fanBooking.booking.result.item.bookingId;
    engineState.fanBooking.booking.bookingId = "booking_from_engine";
    const { wrapper: engineWrapper } = mountStep4(engineState);

    await engineWrapper.get("[data-testid='step4-calendar-action-desktop']").trigger("click");
    expect(bridgeMocks.requestFanBookingOpenDetails).toHaveBeenLastCalledWith({
      bookingId: "booking_from_engine",
    });
  });

  it("hides booking detail actions for guest bookings", () => {
    const state = createState();
    state.fanBooking.context.fanId = 0;
    const { wrapper } = mountStep4(state);

    expect(wrapper.find("[data-testid='step4-calendar-action-desktop']").exists()).toBe(false);
    expect(wrapper.find("[data-testid='step4-calendar-action-mobile']").exists()).toBe(false);
  });
});
