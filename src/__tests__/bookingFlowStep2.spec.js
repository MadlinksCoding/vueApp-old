import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { describe, expect, it, vi } from "vitest";
import { bookingTranslationSymbol, createBookingTranslator } from "@/i18n/bookingTranslations.js";

vi.mock("@/utils/toastBus.js", () => ({
  showToast: vi.fn(),
}));

function setByPath(target, path, value) {
  const segments = String(path).split(".");
  let cursor = target;
  while (segments.length > 1) {
    const key = segments.shift();
    cursor[key] = cursor[key] || {};
    cursor = cursor[key];
  }
  cursor[segments[0]] = value;
}

function createEngine(state = {}) {
  return {
    state,
    getState: vi.fn((path) => {
      if (!path) return state;
      return String(path).split(".").reduce((cursor, key) => cursor?.[key], state);
    }),
    setState: vi.fn((path, value) => setByPath(state, path, value)),
    goToStep: vi.fn(),
  };
}

function createGroupEvent(dateIso = "2030-01-15") {
  return {
    eventId: "evt_group_1",
    id: "evt_group_1",
    title: "Group Jam",
    type: "group-event",
    eventType: "group-event",
    basePriceTokens: 50,
    sessionDurationMinutes: 30,
    localDateIso: dateIso,
    localStartHm: "10:00",
    localEndHm: "13:00",
    raw: {
      type: "group-event",
      eventType: "group-event",
      repeatRule: "doesNotRepeat",
      priceSetting: "fixedPricePerUser",
      basePriceTokens: 50,
      sessionDurationMinutes: 30,
    },
  };
}

function createMountedStep(dateIso = "2030-01-15") {
  const selectedEvent = createGroupEvent(dateIso);
  const engine = createEngine({
    bookingDetails: {},
    fanBooking: {
      catalog: {
        bookedSlotsIndex: {},
      },
      context: {
        selectedEvent,
        isFirstBookingForCreator: false,
      },
      selection: {
        selectedDate: dateIso,
      },
      ui: {
        previewReadOnly: false,
      },
    },
  });

  return {
    engine,
    wrapperPromise: import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep2.vue")
      .then(({ default: BookingFlowStep2 }) => mount(BookingFlowStep2, {
        props: {
          engine,
          embedded: true,
        },
        global: {
          provide: {
            [bookingTranslationSymbol]: createBookingTranslator(),
          },
          stubs: {
            MiniCalendar: {
              template: "<div class='mini-calendar-stub' />",
            },
            OneOnOneBookingFlowLeftSideBar: {
              props: ["timeDisplay", "duration"],
              template: "<aside>{{ timeDisplay }} {{ duration }}</aside>",
            },
          },
        },
      })),
  };
}

function findPaymentSummaryButton(wrapper) {
  return wrapper.findAll("button").find((button) => button.text().includes("PAYMENT SUMMARY"));
}

describe("BookingFlowStep2", () => {
  it("renders group event slots and enables payment summary after selecting one", async () => {
    const { engine, wrapperPromise } = createMountedStep();
    const wrapper = await wrapperPromise;
    await nextTick();
    await nextTick();

    expect(wrapper.text()).toContain("10:00am-1:00pm");
    expect(wrapper.text()).toContain("Select a start time first.");

    const paymentButtonBefore = findPaymentSummaryButton(wrapper);
    expect(paymentButtonBefore?.attributes("disabled")).toBeDefined();

    const slotButton = wrapper.findAll("[data-testid='booking-flow-time-slot']").find((node) => node.text() === "10:00am-1:00pm");
    expect(slotButton).toBeTruthy();
    await slotButton.trigger("click");
    await nextTick();

    expect(wrapper.text()).toContain("180 MIN");
    expect(wrapper.text()).not.toContain("Select a start time first.");

    const paymentButtonAfter = findPaymentSummaryButton(wrapper);
    expect(paymentButtonAfter?.attributes("disabled")).toBeUndefined();

    await paymentButtonAfter.trigger("click");
    expect(engine.goToStep).toHaveBeenCalledWith(3);
    expect(engine.state.fanBooking.selection.selectedDurationMinutes).toBe(180);
  });
});
