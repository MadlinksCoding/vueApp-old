import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { bookingTranslationSymbol, createBookingTranslator } from "@/i18n/bookingTranslations.js";
import { buildBookedSlotsIndex } from "@/services/bookings/utils/bookingSlotUtils.js";

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
  bookedSlotsIndex = {},
  fanId = 2615,
} = {}) {
  const engine = createEngine({
    bookingDetails,
    fanBooking: {
      catalog: {
        bookedSlotsIndex,
      },
      context: {
        fanId,
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
  afterEach(() => {
    vi.useRealTimers();
  });

  function setFixedStepClock() {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-15T12:00:00"));
    return "2030-01-15";
  }

  function addDays(dateIso, days) {
    const date = new Date(`${dateIso}T00:00:00`);
    date.setDate(date.getDate() + days);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function createDailyGroupEvent() {
    return createGroupEvent("2030-01-15", {
      sessionDurationMinutes: 120,
      localStartHm: "11:00",
      localEndHm: "13:00",
      raw: {
        repeatRule: "daily",
        sessionDurationMinutes: 120,
        enableMaxAttendees: true,
        maxAttendees: 5,
        slots: [{ day: "monday", startTime: "13:00", endTime: "15:00" }],
      },
    });
  }

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

  it("auto-selects an ongoing group event session before a later session", async () => {
    const today = setFixedStepClock();
    const { engine, wrapperPromise } = createMountedStep({
      dateIso: today,
      selectedEvent: createDailyGroupEvent(),
    });
    await wrapperPromise;
    await nextTick();
    await nextTick();
    await nextTick();

    expect(engine.goToStep).toHaveBeenCalledWith(3);
    expect(engine.state.fanBooking.selection.selectedDate).toBe(today);
    expect(engine.state.fanBooking.selection.selectedSlot).toEqual(expect.objectContaining({
      startHm: "11:00",
      endHm: "13:00",
      disabled: false,
    }));
    expect(engine.state.fanBooking.selection.selectedDurationMinutes).toBe(120);
  });

  it("skips an ongoing group session already booked by the current user", async () => {
    const today = setFixedStepClock();
    const tomorrow = addDays(today, 1);
    const bookedSlotsIndex = buildBookedSlotsIndex([{
      bookingId: "booking_current_user_ongoing",
      eventId: "evt_group_1",
      userId: 2615,
      startIso: `${today}T11:00:00`,
      endIso: `${today}T13:00:00`,
      status: "confirmed",
    }]);
    const { engine, wrapperPromise } = createMountedStep({
      dateIso: today,
      selectedEvent: createDailyGroupEvent(),
      bookedSlotsIndex,
      fanId: 2615,
    });
    await wrapperPromise;
    await nextTick();
    await nextTick();
    await nextTick();

    expect(engine.goToStep).toHaveBeenCalledWith(3);
    expect(engine.state.fanBooking.selection.selectedDate).toBe(tomorrow);
    expect(engine.state.fanBooking.selection.selectedSlot).toEqual(expect.objectContaining({
      startHm: "11:00",
      endHm: "13:00",
      disabled: false,
    }));
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
