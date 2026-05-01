import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { describe, expect, it, vi } from "vitest";
import { bookingTranslationSymbol, createBookingTranslator } from "@/i18n/bookingTranslations.js";

vi.mock("@/utils/toastBus.js", () => ({
  showToast: vi.fn(),
}));

vi.mock("@/utils/TokenHandler.js", () => ({
  default: {
    get: vi.fn(() => Promise.resolve(null)),
  },
}));

vi.mock("@/utils/backendJwt.js", () => ({
  getBackendJwtToken: vi.fn(() => ""),
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

function createGroupEvent(dateIso = "2030-01-15", overrides = {}) {
  const rawOverrides = overrides.raw || {};
  const { raw: _raw, ...eventOverrides } = overrides;
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
      addOns: [
        {
          id: "addon_group_hidden",
          title: "Group Hidden Add-on",
          priceTokens: 25,
        },
      ],
      ...rawOverrides,
    },
    ...eventOverrides,
  };
}

function createPrivateEvent(dateIso = "2030-01-15") {
  return {
    eventId: "evt_private_1",
    id: "evt_private_1",
    title: "Private Chat",
    type: "one-on-one",
    eventType: "one-on-one",
    basePriceTokens: 60,
    sessionDurationMinutes: 30,
    localDateIso: dateIso,
    localStartHm: "10:00",
    localEndHm: "11:00",
    allowLongerSessions: true,
    maxSessionMinutes: 2,
    raw: {
      type: "one-on-one",
      eventType: "one-on-one",
      repeatRule: "doesNotRepeat",
      basePriceTokens: 60,
      sessionDurationMinutes: 30,
      allowLongerSessions: true,
      maxSessionMinutes: 2,
      addOns: [
        {
          id: "addon_private_recording",
          title: "Private Add-on",
          priceTokens: 10,
        },
      ],
    },
  };
}

function createMountedStep({
  dateIso = "2030-01-15",
  selectedEvent = createGroupEvent(dateIso),
  bookingDetails = {},
  selection = {},
} = {}) {
  const engine = createEngine({
    bookingDetails,
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
        ...selection,
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
  it("auto-selects group event slot and routes directly to payment summary", async () => {
    const dateIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const { engine, wrapperPromise } = createMountedStep({
      dateIso,
      selectedEvent: createGroupEvent(dateIso),
    });
    const wrapper = await wrapperPromise;
    await nextTick();
    await nextTick();
    await nextTick();

    expect(wrapper.text()).not.toContain("SELECT EVENT TIME");
    expect(wrapper.text()).not.toContain("SELECT LENGTH");
    expect(wrapper.text()).not.toContain("ADD-ON SERVICE");
    expect(wrapper.text()).not.toContain("OTHER REQUEST");

    expect(engine.goToStep).toHaveBeenCalledWith(3);
    expect(engine.state.fanBooking.selection.selectedDurationMinutes).toBe(180);
    expect(engine.state.fanBooking.selection.selectedAddOns).toEqual([]);
    expect(engine.state.fanBooking.selection.personalRequestText).toBe("");
  });

  it("keeps private booking length, call wording, add-ons, and other request", async () => {
    const { wrapperPromise } = createMountedStep({
      selectedEvent: createPrivateEvent(),
    });
    const wrapper = await wrapperPromise;
    await nextTick();
    await nextTick();

    expect(wrapper.text()).toContain("SELECT CALL START TIME");
    expect(wrapper.text()).toContain("SELECT LENGTH");
    expect(wrapper.text()).toContain("ADD-ON SERVICE");
    expect(wrapper.text()).toContain("OTHER REQUEST");
    expect(wrapper.text()).not.toContain("SELECT EVENT TIME");
  });

});
