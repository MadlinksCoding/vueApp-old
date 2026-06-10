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

function createMonthlyPrivateEventWithDateRange() {
  return {
    ...createPrivateEvent("2026-05-06"),
    eventId: "evt_monthly_range",
    id: "evt_monthly_range",
    dateFrom: "2026-05-06",
    dateTo: "2026-05-21",
    raw: {
      ...createPrivateEvent("2026-05-06").raw,
      repeatRule: "monthly",
      dateFrom: "2026-05-06",
      dateTo: "2026-05-21",
      slots: [{ startTime: "04:45", endTime: "16:25" }],
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
              props: ["minDate", "maxDate", "events", "monthDate", "selectedDate"],
              emits: ["date-selected"],
              methods: {
                formatDate(date) {
                  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
                  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                },
              },
              template: `
                <div class="mini-calendar-stub">
                  <span class="mini-calendar-min">{{ formatDate(minDate) }}</span>
                  <span class="mini-calendar-max">{{ formatDate(maxDate) }}</span>
                  <span class="mini-calendar-month">{{ formatDate(monthDate) }}</span>
                  <span class="mini-calendar-selected">{{ formatDate(selectedDate) }}</span>
                  <span class="mini-calendar-events">{{ events.length }}</span>
                  <button class="mini-calendar-valid" type="button" @click="$emit('date-selected', new Date('2026-05-06T00:00:00'))">valid</button>
                  <button class="mini-calendar-after" type="button" @click="$emit('date-selected', new Date('2026-06-06T00:00:00'))">after</button>
                </div>
              `,
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

function dateIsoFromDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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

  it("steps private booking length by the configured session duration", async () => {
    const selectedEvent = {
      ...createPrivateEvent("2030-01-15"),
      localEndHm: "12:00",
      maxSessionMinutes: 4,
      raw: {
        ...createPrivateEvent("2030-01-15").raw,
        maxSessionMinutes: 4,
      },
    };
    const { wrapperPromise } = createMountedStep({ selectedEvent });
    const wrapper = await wrapperPromise;
    await nextTick();
    await nextTick();

    await wrapper.get("[data-testid='booking-flow-time-slot']").trigger("click");
    await nextTick();

    const stepper = wrapper.get("[data-testid='booking-flow-duration-stepper']");
    const plus = wrapper.get("[data-testid='booking-flow-duration-plus']");
    const minus = wrapper.get("[data-testid='booking-flow-duration-minus']");

    expect(stepper.text()).toContain("30 mins");

    await plus.trigger("click");
    await nextTick();
    expect(stepper.text()).toContain("60 mins");

    await plus.trigger("click");
    await nextTick();
    expect(stepper.text()).toContain("1 hour 30 mins");

    await minus.trigger("click");
    await nextTick();
    expect(stepper.text()).toContain("60 mins");
    expect(wrapper.find("[data-testid='booking-flow-duration-max-warning']").exists()).toBe(false);
  });

  it("keeps private booking length within the configured maximum and shows a warning", async () => {
    const selectedEvent = {
      ...createPrivateEvent("2030-01-15"),
      localEndHm: "12:00",
      maxSessionMinutes: 3,
      raw: {
        ...createPrivateEvent("2030-01-15").raw,
        maxSessionMinutes: 3,
      },
    };
    const { wrapperPromise } = createMountedStep({ selectedEvent });
    const wrapper = await wrapperPromise;
    await nextTick();
    await nextTick();

    await wrapper.get("[data-testid='booking-flow-time-slot']").trigger("click");
    await nextTick();

    const stepper = wrapper.get("[data-testid='booking-flow-duration-stepper']");
    const plus = wrapper.get("[data-testid='booking-flow-duration-plus']");

    await plus.trigger("click");
    await plus.trigger("click");
    await nextTick();
    expect(stepper.text()).toContain("1 hour 30 mins");

    await plus.trigger("click");
    await nextTick();

    expect(stepper.text()).toContain("1 hour 30 mins");
    expect(wrapper.get("[data-testid='booking-flow-duration-max-warning']").text()).toContain(
      "Max session length is 1 hour 30 mins",
    );
  });

  it("locks duration controls and shows a yellow max notice when longer sessions are disabled", async () => {
    const selectedEvent = {
      ...createPrivateEvent("2030-01-15"),
      allowLongerSessions: false,
      maxSessionMinutes: 3,
      raw: {
        ...createPrivateEvent("2030-01-15").raw,
        allowLongerSessions: false,
        maxSessionMinutes: 3,
      },
    };
    const { wrapperPromise } = createMountedStep({ selectedEvent });
    const wrapper = await wrapperPromise;
    await nextTick();
    await nextTick();

    const noticeBeforeTime = wrapper.get("[data-testid='booking-flow-duration-max-warning']");
    expect(noticeBeforeTime.text()).toContain("Max session length is 30 mins");
    expect(noticeBeforeTime.attributes("class")).toContain("text-[#FACC15]");

    await wrapper.get("[data-testid='booking-flow-time-slot']").trigger("click");
    await nextTick();

    expect(wrapper.get("[data-testid='booking-flow-duration-minus']").attributes("disabled")).toBeDefined();
    expect(wrapper.get("[data-testid='booking-flow-duration-plus']").attributes("disabled")).toBeDefined();
    expect(wrapper.get("[data-testid='booking-flow-duration-max-warning']").text()).toContain(
      "Max session length is 30 mins",
    );
  });

  it("locks duration controls and shows a yellow max notice when max sessions are zero", async () => {
    const selectedEvent = {
      ...createPrivateEvent("2030-01-15"),
      allowLongerSessions: true,
      maxSessionMinutes: 0,
      raw: {
        ...createPrivateEvent("2030-01-15").raw,
        allowLongerSessions: true,
        maxSessionMinutes: 0,
      },
    };
    const { wrapperPromise } = createMountedStep({ selectedEvent });
    const wrapper = await wrapperPromise;
    await nextTick();
    await nextTick();

    await wrapper.get("[data-testid='booking-flow-time-slot']").trigger("click");
    await nextTick();

    const notice = wrapper.get("[data-testid='booking-flow-duration-max-warning']");
    expect(wrapper.get("[data-testid='booking-flow-duration-minus']").attributes("disabled")).toBeDefined();
    expect(wrapper.get("[data-testid='booking-flow-duration-plus']").attributes("disabled")).toBeDefined();
    expect(notice.text()).toContain("Max session length is 30 mins");
    expect(notice.attributes("class")).toContain("text-[#FACC15]");
  });

  it("defaults a private booking to today's date and shows today's slots", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-15T09:00:00"));
    const today = "2030-01-15";
    const { wrapperPromise } = createMountedStep({
      dateIso: today,
      selectedEvent: createPrivateEvent(today),
      selection: {
        selectedDate: null,
      },
    });
    const wrapper = await wrapperPromise;
    await nextTick();
    await nextTick();

    expect(wrapper.find(".mini-calendar-month").text()).toBe(today);
    expect(wrapper.find(".mini-calendar-selected").text()).toBe(today);
    expect(wrapper.text()).toContain("SELECT CALL START TIME");
  });

  it("defaults a private booking to the first selectable future event date", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-15T09:00:00"));
    const futureDate = "2030-01-17";
    const selectedEvent = {
      ...createPrivateEvent(futureDate),
      dateFrom: futureDate,
      raw: {
        ...createPrivateEvent(futureDate).raw,
        dateFrom: futureDate,
      },
    };

    const { wrapperPromise } = createMountedStep({
      dateIso: futureDate,
      selectedEvent,
      selection: {
        selectedDate: null,
      },
    });
    const wrapper = await wrapperPromise;
    await nextTick();
    await nextTick();

    expect(wrapper.find(".mini-calendar-min").text()).toBe(futureDate);
    expect(wrapper.find(".mini-calendar-selected").text()).toBe(futureDate);
    expect(wrapper.text()).toContain("SELECT CALL START TIME");
  });

  it("leaves private booking unselected when no selectable date exists", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-15T09:00:00"));
    const selectedEvent = {
      ...createPrivateEvent("2030-01-15"),
      dateTo: "2030-01-14",
      raw: {
        ...createPrivateEvent("2030-01-15").raw,
        dateTo: "2030-01-14",
      },
    };

    const { wrapperPromise } = createMountedStep({
      dateIso: "2030-01-15",
      selectedEvent,
      selection: {
        selectedDate: null,
      },
    });
    const wrapper = await wrapperPromise;
    await nextTick();
    await nextTick();

    expect(wrapper.text()).not.toContain("SELECT CALL START TIME");
  });

  it("passes event date bounds to the calendar and ignores out-of-range date selections", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-06T09:00:00"));

    const { engine, wrapperPromise } = createMountedStep({
      dateIso: "2026-05-06",
      selectedEvent: createMonthlyPrivateEventWithDateRange(),
      selection: {
        selectedDate: null,
      },
    });
    const wrapper = await wrapperPromise;
    await nextTick();
    await nextTick();

    expect(wrapper.find(".mini-calendar-min").text()).toBe("2026-05-06");
    expect(wrapper.find(".mini-calendar-max").text()).toBe("2026-05-21");
    expect(wrapper.find(".mini-calendar-events").text()).toBe("1");

    await wrapper.find(".mini-calendar-after").trigger("click");
    await nextTick();

    expect(wrapper.find(".mini-calendar-selected").text()).toBe("2026-05-06");

    await wrapper.find(".mini-calendar-valid").trigger("click");
    await nextTick();

    expect(wrapper.text()).toContain("SELECT CALL START TIME");
  });

  it("uses custom slot local dates when the raw one-time date range is inverted", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T12:00:00"));

    const localSlotDate = dateIsoFromDate(new Date("2026-06-12T00:00:00+08:00"));
    const localSlotEndDate = dateIsoFromDate(new Date("2026-06-12T05:00:00+08:00"));
    const selectedEvent = {
      ...createPrivateEvent(localSlotDate),
      eventId: "evt_inverted_custom_range",
      id: "evt_inverted_custom_range",
      raw: {
        ...createPrivateEvent(localSlotDate).raw,
        repeatRule: "doesNotRepeat",
        dateFrom: "2026-06-12",
        dateTo: "2026-06-11",
        sessionDurationMinutes: 5,
        slots: [{
          date: "2026-06-12",
          times: [{ startTime: "00:00", endTime: "05:00", offHours: false }],
        }],
      },
    };

    const { wrapperPromise } = createMountedStep({
      dateIso: localSlotDate,
      selectedEvent,
      selection: {
        selectedDate: null,
      },
    });
    const wrapper = await wrapperPromise;
    await nextTick();
    await nextTick();

    expect(wrapper.find(".mini-calendar-min").text()).toBe(localSlotDate);
    expect(wrapper.find(".mini-calendar-max").text()).toBe(localSlotEndDate);
    expect(wrapper.find(".mini-calendar-events").text()).toBe("2");
    expect(wrapper.text()).toContain("SELECT CALL START TIME");
  });

  it("shows both local dates for a custom slot crossing midnight without saved end offset", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T12:00:00"));

    const localStartDate = dateIsoFromDate(new Date("2026-06-11T23:00:00+08:00"));
    const localEndDate = dateIsoFromDate(new Date("2026-06-12T05:00:00+08:00"));
    expect(localStartDate).not.toBe(localEndDate);

    const selectedEvent = {
      ...createPrivateEvent(localStartDate),
      eventId: "evt_custom_cross_midnight_no_offset",
      id: "evt_custom_cross_midnight_no_offset",
      raw: {
        ...createPrivateEvent(localStartDate).raw,
        repeatRule: "doesNotRepeat",
        dateFrom: "2026-06-11",
        dateTo: "2026-06-11",
        sessionDurationMinutes: 5,
        slots: [{
          date: "2026-06-11",
          times: [{ startTime: "23:00", endTime: "05:00", offHours: false }],
        }],
      },
    };

    const { wrapperPromise } = createMountedStep({
      dateIso: localStartDate,
      selectedEvent,
      selection: {
        selectedDate: null,
      },
    });
    const wrapper = await wrapperPromise;
    await nextTick();
    await nextTick();

    expect(wrapper.find(".mini-calendar-min").text()).toBe(localStartDate);
    expect(wrapper.find(".mini-calendar-max").text()).toBe(localEndDate);
    expect(wrapper.find(".mini-calendar-events").text()).toBe("2");
    expect(wrapper.find(".mini-calendar-selected").text()).toBe(localStartDate);
    expect(wrapper.text()).toContain("SELECT CALL START TIME");
  });

});
