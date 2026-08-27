import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { bookingTranslationSymbol, createBookingTranslator } from "@/i18n/bookingTranslations.js";
import { buildBookedSlotsIndex } from "@/services/bookings/utils/bookingSlotUtils.js";
import { showToast } from "@/utils/toastBus.js";

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
	temporaryHoldSlotsIndex = {},
  fanId = 2615,
  isFirstBookingForCreator = false,
  componentProps = {},
  translations = {},
} = {}) {
  const engine = createEngine({
    bookingDetails,
    fanBooking: {
      catalog: {
        bookedSlotsIndex,
		temporaryHoldSlotsIndex,
      },
      context: {
        fanId,
        selectedEvent,
        isFirstBookingForCreator,
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
          ...componentProps,
        },
        global: {
          provide: {
            [bookingTranslationSymbol]: createBookingTranslator({ translations }),
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
              props: ["timeDisplay", "duration", "isFirstBookingForCreator", "subtotal"],
              template: "<aside data-testid='step2-sidebar' :data-first-booking='String(isFirstBookingForCreator)' :data-subtotal='String(subtotal)'>{{ timeDisplay }} {{ duration }}</aside>",
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
  return wrapper.find("[data-testid='booking-flow-payment-summary-button']");
}

async function flushStep2() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

describe("BookingFlowStep2", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.mocked(showToast).mockReset();
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

  it("excludes the booking fee from the auto-selected group totalPrice", async () => {
    const dateIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const { engine, wrapperPromise } = createMountedStep({
      dateIso,
      selectedEvent: createGroupEvent(dateIso, {
        enableBookingFee: true,
        bookingFeeTokens: 15,
        raw: {
          enableBookingFee: true,
          bookingFeeTokens: 15,
        },
      }),
    });
    await wrapperPromise;
    await nextTick();
    await nextTick();
    await nextTick();

    expect(engine.goToStep).toHaveBeenCalledWith(3);
    expect(engine.state.bookingDetails.totalPrice).toBe(50);
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

    expect(wrapper.text()).toContain("CALL START TIME");
    expect(wrapper.text()).toContain("SELECT LENGTH");
    expect(wrapper.text()).toContain("ADD-ON SERVICE");
    expect(wrapper.text()).toContain("OTHER REQUEST");
    expect(wrapper.text()).not.toContain("SELECT EVENT TIME");
  });

  it("translates optional labels and derives approval copy from instant booking", async () => {
    const manualEvent = createPrivateEvent();
    manualEvent.allowInstantBooking = false;
    manualEvent.raw.allowInstantBooking = false;
    const { wrapperPromise: manualWrapperPromise } = createMountedStep({
      selectedEvent: manualEvent,
      translations: {
        common_optional: "Facultatif",
        fan_booking_approval_required: "APPROBATION REQUISE",
      },
    });
    const manualWrapper = await manualWrapperPromise;
    await flushStep2();

    expect(manualWrapper.text().match(/Facultatif/g)).toHaveLength(2);
    expect(manualWrapper.text()).toContain("APPROBATION REQUISE");
    manualWrapper.unmount();

    const instantEvent = createPrivateEvent();
    instantEvent.allowInstantBooking = true;
    instantEvent.raw.allowInstantBooking = true;
    const { wrapperPromise: instantWrapperPromise } = createMountedStep({
      selectedEvent: instantEvent,
      translations: {
        common_optional: "Facultatif",
        fan_booking_approval_required: "APPROBATION REQUISE",
      },
    });
    const instantWrapper = await instantWrapperPromise;
    await flushStep2();

    expect(instantWrapper.text().match(/Facultatif/g)).toHaveLength(2);
    expect(instantWrapper.text()).not.toContain("APPROBATION REQUISE");
  });

  it("renders the booking summary from the selected session and add-ons", async () => {
    const { wrapperPromise } = createMountedStep({
      selectedEvent: createPrivateEvent("2030-01-15"),
    });
    const wrapper = await wrapperPromise;
    await flushStep2();

    expect(wrapper.find("[data-testid='booking-flow-step2-summary']").exists()).toBe(false);
    expect(wrapper.text()).not.toContain("10 Minute x 1 session");
    expect(wrapper.text()).not.toContain("300");

    await wrapper.get("[data-testid='booking-flow-time-slot']").trigger("click");
    await nextTick();

    const sessionRow = wrapper.get("[data-testid='booking-flow-step2-summary-session']");
    expect(sessionRow.text()).toContain("30 Minute x 1 session (30 Min.)");
    expect(sessionRow.text()).toContain("60");
    expect(wrapper.findAll("[data-testid='booking-flow-step2-summary-addon']")).toHaveLength(0);
    expect(wrapper.get("[data-testid='booking-flow-step2-summary-subtotal']").text()).toContain("60");

    await wrapper.get("[data-testid='booking-flow-addon']").trigger("click");
    await nextTick();

    const addonRow = wrapper.get("[data-testid='booking-flow-step2-summary-addon']");
    expect(addonRow.text()).toContain("Private Add-on");
    expect(addonRow.text()).toContain("+10");
    expect(wrapper.get("[data-testid='booking-flow-step2-summary-subtotal']").text()).toContain("70");
  });

  it("renders dynamic discounts and off-hour surcharge in the booking summary", async () => {
    const baseEvent = createPrivateEvent("2030-01-15");
    const { wrapperPromise } = createMountedStep({
      selectedEvent: {
        ...baseEvent,
        enableFirstTimeDiscount: true,
        firstTimeDiscountTokens: 5,
        offHourSurcharge: true,
        offHourSurchargePercent: 25,
        raw: {
          ...baseEvent.raw,
          enableFirstTimeDiscount: true,
          firstTimeDiscountTokens: 5,
          offHourSurcharge: true,
          offHourSurchargePercent: 25,
          slots: [{
            date: "2030-01-15",
            times: [{ startTime: "10:00", endTime: "11:00", offHours: true }],
          }],
        },
      },
      isFirstBookingForCreator: true,
    });
    const wrapper = await wrapperPromise;
    await flushStep2();

    await wrapper.get("[data-testid='booking-flow-time-slot']").trigger("click");
    await nextTick();

    const discountRow = wrapper.get("[data-testid='booking-flow-step2-summary-discount']");
    expect(discountRow.text()).toContain("First Time Discount");
    expect(discountRow.text()).toContain("-5");

    const surchargeRow = wrapper.get("[data-testid='booking-flow-step2-summary-surcharge']");
    expect(surchargeRow.text()).toContain("Off-hour Surcharge");
    expect(surchargeRow.text()).toContain("+25");
    expect(wrapper.get("[data-testid='booking-flow-step2-summary-subtotal']").text()).toContain("80");
  });

  it("translates the booking summary and interpolates its configured booking fee", async () => {
    const baseEvent = createPrivateEvent("2030-01-15");
    const { wrapperPromise } = createMountedStep({
      selectedEvent: {
        ...baseEvent,
        enableBookingFee: true,
        bookingFeeTokens: 15,
        raw: {
          ...baseEvent.raw,
          enableBookingFee: true,
          bookingFeeTokens: 15,
        },
      },
      translations: {
        fan_booking_booking_summary: "Resumen de reserva",
        fan_booking_session_breakdown: "{count} cita de {base_minutes} minutos",
        fan_booking_subtotal: "Subtotal traducido",
        fan_booking_session_fee_hold_notice: "Importe retenido hasta la llamada.",
        fan_booking_non_refundable_booking_fee_applied: "Tarifa aplicada: {tokens} tokens.",
      },
    });
    const wrapper = await wrapperPromise;
    await flushStep2();

    await wrapper.get("[data-testid='booking-flow-time-slot']").trigger("click");
    await nextTick();

    const summary = wrapper.get("[data-testid='booking-flow-step2-summary']");
    expect(summary.text()).toContain("Resumen de reserva");
    expect(summary.get("[data-testid='booking-flow-step2-summary-session']").text()).toContain("1 cita de 30 minutos");
    expect(summary.get("[data-testid='booking-flow-step2-summary-subtotal']").text()).toContain("Subtotal traducido");
    expect(summary.get("[data-testid='booking-flow-step2-summary-hold-notice']").text()).toBe("Importe retenido hasta la llamada.");
    expect(summary.get("[data-testid='booking-flow-step2-summary-booking-fee-notice']").text()).toBe("Tarifa aplicada: 15 tokens.");
    expect(summary.text()).toContain("Importe retenido hasta la llamada. Tarifa aplicada: 15 tokens.");

    const { wrapperPromise: noFeeWrapperPromise } = createMountedStep({
      selectedEvent: baseEvent,
    });
    const noFeeWrapper = await noFeeWrapperPromise;
    await flushStep2();
    await noFeeWrapper.get("[data-testid='booking-flow-time-slot']").trigger("click");
    await nextTick();
    expect(noFeeWrapper.find("[data-testid='booking-flow-step2-summary-booking-fee-notice']").exists()).toBe(false);
  });

  it("prices and preserves translated recording selections by stable add-on kind", async () => {
    const baseEvent = createPrivateEvent("2030-01-15");
    const selectedEvent = {
      ...baseEvent,
      raw: {
        ...baseEvent.raw,
        allowFanRecordingEnabled: true,
        allowFanRecordingTokens: 50,
        addOns: [{
          id: "addon_record_review",
          title: "Record review notes",
          priceTokens: 10,
        }],
      },
    };
    const translations = {
      fan_booking_record_our_session: "录制我们的会话",
    };
    const { engine, wrapperPromise } = createMountedStep({ selectedEvent, translations });
    const wrapper = await wrapperPromise;
    await flushStep2();

    await wrapper.get("[data-testid='booking-flow-time-slot']").trigger("click");
    await nextTick();

    const addOns = wrapper.findAll("[data-testid='booking-flow-addon']");
    expect(addOns).toHaveLength(2);
    expect(addOns[0].attributes("data-addon-kind")).toBe("recording");
    expect(addOns[0].text()).toContain("录制我们的会话");
    expect(addOns[1].attributes("data-addon-kind")).toBe("addon");

    await addOns[0].trigger("click");
    await addOns[1].trigger("click");
    await nextTick();

    expect(wrapper.get("[data-testid='step2-sidebar']").attributes("data-subtotal")).toBe("120");

    await findPaymentSummaryButton(wrapper).trigger("click");
    await flushStep2();

    expect(engine.goToStep).toHaveBeenCalledWith(3);
    expect(engine.state.bookingDetails.totalPrice).toBe(120);
    expect(engine.state.bookingDetails.addons).toEqual([
      expect.objectContaining({ kind: "recording", id: "evt_private_1_recording", price: 50 }),
      expect.objectContaining({ kind: "addon", catalogId: "addon_record_review", price: 10 }),
    ]);

    const { wrapperPromise: restoredWrapperPromise } = createMountedStep({
      selectedEvent,
      bookingDetails: engine.state.bookingDetails,
      selection: engine.state.fanBooking.selection,
      translations,
    });
    const restoredWrapper = await restoredWrapperPromise;
    await flushStep2();
    expect(restoredWrapper.findAll("[data-testid='booking-flow-addon']").map(
      (row) => row.attributes("data-selected"),
    )).toEqual(["true", "true"]);
  });

  it("passes first-booking eligibility to the sidebar", async () => {
    const { wrapperPromise } = createMountedStep({
      selectedEvent: createPrivateEvent("2030-01-15"),
      isFirstBookingForCreator: true,
    });
    const wrapper = await wrapperPromise;
    await flushStep2();

    expect(wrapper.get("[data-testid='step2-sidebar']").attributes("data-first-booking")).toBe("true");
  });

  it("groups private start times into chronological hour columns", async () => {
    const baseEvent = createPrivateEvent("2030-01-15");
    const selectedEvent = {
      ...baseEvent,
      localEndHm: "12:00",
      raw: {
        ...baseEvent.raw,
      },
    };
    const { wrapperPromise } = createMountedStep({ selectedEvent });
    const wrapper = await wrapperPromise;
    await flushStep2();

    const columns = wrapper.findAll("[data-testid='booking-flow-time-slot-column']");
    expect(columns).toHaveLength(2);
    expect(columns[0].attributes("data-hour")).toBe("10");
    expect(columns[0].findAll("[data-testid='booking-flow-time-slot']").map((slot) => slot.text())).toEqual([
      "10:00am",
      "10:30am",
    ]);
    expect(columns[1].attributes("data-hour")).toBe("11");
    expect(columns[1].findAll("[data-testid='booking-flow-time-slot']").map((slot) => slot.text())).toEqual([
      "11:00am",
      "11:30am",
    ]);
  });

  it("hides today's private slots that start before the current time", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-15T11:35:00"));
    const baseEvent = createPrivateEvent("2030-01-15");
    const selectedEvent = {
      ...baseEvent,
      sessionDurationMinutes: 5,
      localStartHm: "11:25",
      localEndHm: "11:50",
      raw: {
        ...baseEvent.raw,
        sessionDurationMinutes: 5,
      },
    };
    const { wrapperPromise } = createMountedStep({ selectedEvent });
    const wrapper = await wrapperPromise;
    await flushStep2();

    expect(wrapper.findAll("[data-testid='booking-flow-time-slot']").map((slot) => slot.text())).toEqual([
      "11:35am",
      "11:40am",
      "11:45am",
    ]);
  });

  it("keeps all private slots visible for a future date", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-15T11:35:00"));
    const futureDate = "2030-01-16";
    const baseEvent = createPrivateEvent(futureDate);
    const selectedEvent = {
      ...baseEvent,
      localEndHm: "13:00",
      raw: {
        ...baseEvent.raw,
      },
    };
    const { wrapperPromise } = createMountedStep({
      dateIso: futureDate,
      selectedEvent,
    });
    const wrapper = await wrapperPromise;
    await flushStep2();

    expect(wrapper.findAll("[data-testid='booking-flow-time-slot']").map((slot) => slot.text())).toEqual([
      "10:00am",
      "10:30am",
      "11:00am",
      "11:30am",
      "12:00pm",
      "12:30pm",
    ]);
  });

  it("removes a private slot after the clock passes its start time", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-15T11:29:00"));
    const baseEvent = createPrivateEvent("2030-01-15");
    const selectedEvent = {
      ...baseEvent,
      localStartHm: "11:30",
      localEndHm: "12:30",
      raw: {
        ...baseEvent.raw,
      },
    };
    const { wrapperPromise } = createMountedStep({ selectedEvent });
    const wrapper = await wrapperPromise;
    await flushStep2();

    expect(wrapper.findAll("[data-testid='booking-flow-time-slot']").map((slot) => slot.text())).toEqual([
      "11:30am",
      "12:00pm",
    ]);

    await vi.advanceTimersByTimeAsync(2 * 60 * 1000);
    await flushStep2();

    expect(wrapper.findAll("[data-testid='booking-flow-time-slot']").map((slot) => slot.text())).toEqual([
      "12:00pm",
    ]);
  });

  it("opens the translated GMT selector and updates displayed slot times", async () => {
    const { wrapperPromise } = createMountedStep({
      selectedEvent: createPrivateEvent("2030-01-15"),
      translations: {
        fan_booking_select_timezone: "Choose timezone",
        fan_booking_timezone_options: "Available GMT offsets",
      },
    });
    const wrapper = await wrapperPromise;
    await flushStep2();

    const trigger = wrapper.get("[data-testid='booking-flow-timezone-trigger']");
    expect(trigger.attributes("aria-label")).toBe("Choose timezone");
    expect(trigger.text()).toMatch(/^GMT[+-]\d{2}:\d{2}$/);

    await trigger.trigger("click");
    const options = wrapper.get("[data-testid='booking-flow-timezone-options']");
    expect(options.attributes("aria-label")).toBe("Available GMT offsets");
    expect(options.findAll("[role='option']")).toHaveLength(40);

    const initialSlotStartMs = Number(
      wrapper.get("[data-testid='booking-flow-time-slot']").attributes("data-start-ms"),
    );
    const timeSlotScrollElement = wrapper.get("[data-testid='booking-flow-time-slots-scroll']").element;
    Object.defineProperty(timeSlotScrollElement, "scrollLeft", {
      configurable: true,
      writable: true,
      value: 136,
    });
    timeSlotScrollElement.dispatchEvent(new Event("scroll"));
    await nextTick();

    await wrapper.get("[data-testid='booking-flow-timezone-option-840']").trigger("click");
    await flushStep2();

    expect(wrapper.get("[data-testid='booking-flow-timezone-trigger']").text()).toContain("GMT+14:00");
    expect(wrapper.find("[data-testid='booking-flow-timezone-options']").exists()).toBe(false);
    expect(Number(
      wrapper.get("[data-testid='booking-flow-time-slot']").attributes("data-start-ms"),
    )).toBe(initialSlotStartMs);
    expect(timeSlotScrollElement.scrollLeft).toBe(0);
  });

  it("does not restore past slots after the display timezone changes", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-15T11:35:00"));
    const baseEvent = createPrivateEvent("2030-01-15");
    const selectedEvent = {
      ...baseEvent,
      localEndHm: "13:00",
      raw: {
        ...baseEvent.raw,
      },
    };
    const { wrapperPromise } = createMountedStep({ selectedEvent });
    const wrapper = await wrapperPromise;
    await flushStep2();

    await wrapper.get("[data-testid='booking-flow-timezone-trigger']").trigger("click");
    await wrapper.get("[data-testid='booking-flow-timezone-option-60']").trigger("click");
    await flushStep2();

    const visibleSlotStartTimes = wrapper
      .findAll("[data-testid='booking-flow-time-slot']")
      .map((slot) => Number(slot.attributes("data-start-ms")));
    expect(visibleSlotStartTimes.length).toBeGreaterThan(0);
    expect(visibleSlotStartTimes.every((startMs) => startMs >= Date.now())).toBe(true);
  });

  it("scrolls the timezone menu to the selected GMT option when opened", async () => {
    const { wrapperPromise } = createMountedStep({
      selectedEvent: createPrivateEvent("2030-01-15"),
      bookingDetails: {
        displayTimezoneOffsetMinutes: 480,
      },
    });
    const wrapper = await wrapperPromise;
    await flushStep2();

    const scrollIntoView = vi.fn();
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = scrollIntoView;

    try {
      await wrapper.get("[data-testid='booking-flow-timezone-trigger']").trigger("click");
      await nextTick();

      expect(wrapper.get("[data-testid='booking-flow-timezone-option-480']").attributes("aria-selected")).toBe("true");
      expect(scrollIntoView).toHaveBeenCalledWith({
        block: "center",
        inline: "nearest",
      });
    } finally {
      if (originalScrollIntoView) {
        Element.prototype.scrollIntoView = originalScrollIntoView;
      } else {
        delete Element.prototype.scrollIntoView;
      }
    }
  });

  it("scrolls the time-slot columns one hour at a time and updates boundary controls", async () => {
    const baseEvent = createPrivateEvent("2030-01-15");
    const { wrapperPromise } = createMountedStep({
      selectedEvent: {
        ...baseEvent,
        localEndHm: "14:00",
        raw: {
          ...baseEvent.raw,
        },
      },
    });
    const wrapper = await wrapperPromise;
    await flushStep2();

    const scrollWrapper = wrapper.get("[data-testid='booking-flow-time-slots-scroll']");
    const scrollElement = scrollWrapper.element;
    const columns = wrapper.findAll("[data-testid='booking-flow-time-slot-column']");
    Object.defineProperty(scrollElement, "clientWidth", { configurable: true, value: 260 });
    Object.defineProperty(scrollElement, "scrollWidth", { configurable: true, value: 536 });
    Object.defineProperty(columns[0].element, "offsetLeft", { configurable: true, value: 0 });
    Object.defineProperty(columns[1].element, "offsetLeft", { configurable: true, value: 136 });
    Object.defineProperty(scrollElement, "scrollLeft", {
      configurable: true,
      writable: true,
      value: 0,
    });
    scrollElement.scrollBy = vi.fn(({ left }) => {
      scrollElement.scrollLeft += left;
      scrollElement.dispatchEvent(new Event("scroll"));
    });
    scrollElement.dispatchEvent(new Event("scroll"));
    await nextTick();

    const previous = wrapper.get("[data-testid='booking-flow-time-slots-previous']");
    const next = wrapper.get("[data-testid='booking-flow-time-slots-next']");
    expect(previous.attributes("disabled")).toBeDefined();
    expect(next.attributes("disabled")).toBeUndefined();

    await next.trigger("click");
    await nextTick();
    expect(scrollElement.scrollBy).toHaveBeenCalledWith({ left: 136, behavior: "smooth" });
    expect(previous.attributes("disabled")).toBeUndefined();

    await previous.trigger("click");
    await nextTick();
    expect(scrollElement.scrollBy).toHaveBeenLastCalledWith({ left: -136, behavior: "smooth" });
    expect(previous.attributes("disabled")).toBeDefined();

    scrollElement.scrollLeft = 276;
    scrollElement.dispatchEvent(new Event("scroll"));
    await nextTick();
    expect(next.attributes("disabled")).toBeDefined();
  });

  it("shows a translated off-hour surcharge legend only when applicable", async () => {
    const baseEvent = createPrivateEvent("2030-01-15");
    const { wrapperPromise } = createMountedStep({
      selectedEvent: {
        ...baseEvent,
        offHourSurcharge: true,
        offHourSurchargePercent: 25,
        raw: {
          ...baseEvent.raw,
          offHourSurcharge: true,
          offHourSurchargePercent: 25,
          slots: [{
            date: "2030-01-15",
            times: [{ startTime: "10:00", endTime: "12:00", offHours: true }],
          }],
        },
      },
      translations: {
        fan_booking_previous_time_slot_hours: "Earlier hours",
        fan_booking_next_time_slot_hours: "Later hours",
        fan_booking_off_hour_surcharge_applied: "PEAK RATE APPLIES",
        fan_booking_slots_available: "OPEN TIMES",
      },
    });
    const wrapper = await wrapperPromise;
    await flushStep2();

    expect(wrapper.get("[data-testid='booking-flow-time-slots-previous']").attributes("aria-label")).toBe(
      "Earlier hours",
    );
    expect(wrapper.get("[data-testid='booking-flow-time-slots-next']").attributes("aria-label")).toBe(
      "Later hours",
    );
    expect(wrapper.get("[data-testid='booking-flow-off-hour-surcharge-indicator']").text()).toContain(
      "PEAK RATE APPLIES",
    );
    expect(wrapper.get("[data-testid='booking-flow-time-slots-header']").classes()).toEqual(
      expect.arrayContaining(["min-w-0", "flex-nowrap"]),
    );
    expect(wrapper.get("[data-testid='booking-flow-off-hour-surcharge-indicator']").classes()).toEqual(
      expect.arrayContaining(["min-w-0", "overflow-hidden"]),
    );
    expect(wrapper.get("[data-testid='booking-flow-off-hour-surcharge-label']").classes()).toEqual(
      expect.arrayContaining(["truncate", "whitespace-nowrap"]),
    );
    expect(wrapper.get("[data-testid='booking-flow-slots-available-legend']").text()).toContain(
      "OPEN TIMES",
    );

    const { wrapperPromise: normalWrapperPromise } = createMountedStep({
      selectedEvent: {
        ...baseEvent,
        offHourSurcharge: true,
        offHourSurchargePercent: 25,
        raw: {
          ...baseEvent.raw,
          offHourSurcharge: true,
          offHourSurchargePercent: 25,
        },
      },
    });
    const normalWrapper = await normalWrapperPromise;
    await flushStep2();
    expect(normalWrapper.find("[data-testid='booking-flow-off-hour-surcharge-indicator']").exists()).toBe(false);
  });

  it("excludes the booking fee from private totalPrice", async () => {
    const baseEvent = createPrivateEvent("2030-01-15");
    const { engine, wrapperPromise } = createMountedStep({
      selectedEvent: {
        ...baseEvent,
        enableBookingFee: true,
        bookingFeeTokens: 15,
        raw: {
          ...baseEvent.raw,
          enableBookingFee: true,
          bookingFeeTokens: 15,
        },
      },
    });
    const wrapper = await wrapperPromise;
    await flushStep2();
    await wrapper.get("[data-testid='booking-flow-time-slot']").trigger("click");
    await nextTick();

    expect(wrapper.get("[data-testid='booking-flow-current-total-row']").text()).toContain("60");

    await findPaymentSummaryButton(wrapper).trigger("click");
    await flushStep2();

    expect(engine.state.bookingDetails.totalPrice).toBe(60);
  });

  it.each([
    {
      name: "disabled",
      enableBookingFee: false,
      bookingFeeTokens: 15,
    },
    {
      name: "zero",
      enableBookingFee: true,
      bookingFeeTokens: 0,
    },
  ])("does not show a booking fee row when the fee is $name", async ({ enableBookingFee, bookingFeeTokens }) => {
    const baseEvent = createPrivateEvent("2030-01-15");
    const { wrapperPromise } = createMountedStep({
      selectedEvent: {
        ...baseEvent,
        enableBookingFee,
        bookingFeeTokens,
        raw: {
          ...baseEvent.raw,
          enableBookingFee,
          bookingFeeTokens,
        },
      },
    });
    const wrapper = await wrapperPromise;
    await flushStep2();
    await wrapper.get("[data-testid='booking-flow-time-slot']").trigger("click");
    await nextTick();

    expect(wrapper.find("[data-testid='booking-flow-booking-fee-row']").exists()).toBe(false);
    expect(wrapper.find("[data-testid='booking-flow-price-breakdown']").exists()).toBe(false);
  });

  it("orders discounts, surcharge, included allocations, and the current total", async () => {
    const baseEvent = createPrivateEvent("2030-01-15");
    const { wrapperPromise } = createMountedStep({
      selectedEvent: {
        ...baseEvent,
        localEndHm: "12:00",
        maxSessionMinutes: 3,
        enableDiscountForLonger: true,
        discountMinSessions: 2,
        longerSessionDiscountTokens: 10,
        enableFirstTimeDiscount: true,
        firstTimeDiscountTokens: 5,
        enableBookingFee: true,
        bookingFeeTokens: 15,
        offHourSurcharge: true,
        offHourSurchargePercent: 25,
        raw: {
          ...baseEvent.raw,
          maxSessionMinutes: 3,
          enableDiscountForLonger: true,
          discountMinSessions: 2,
          longerSessionDiscountTokens: 10,
          enableFirstTimeDiscount: true,
          firstTimeDiscountTokens: 5,
          enableBookingFee: true,
          bookingFeeTokens: 15,
          offHourSurcharge: true,
          offHourSurchargePercent: 25,
          slots: [{
            date: "2030-01-15",
            times: [{ startTime: "10:00", endTime: "12:00", offHours: true }],
          }],
        },
      },
      isFirstBookingForCreator: true,
    });
    const wrapper = await wrapperPromise;
    await flushStep2();

    await wrapper.get("[data-testid='booking-flow-time-slot']").trigger("click");
    await wrapper.get("[data-testid='booking-flow-duration-plus']").trigger("click");
    await nextTick();

    const rowKinds = wrapper.get("[data-testid='booking-flow-price-breakdown']")
      .findAll("[data-row-kind]")
      .map((row) => row.attributes("data-row-kind"));
    expect(rowKinds).toEqual([
      "discount",
      "discount",
      "off-hour-surcharge",
      "booking-fee-allocation",
      "current-total",
    ]);
  });

	it("periodically refreshes private and group availability", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-15T09:00:00"));
    const privateRefresh = vi.fn(() => Promise.resolve({ ok: true }));
    const privateMounted = createMountedStep({
      selectedEvent: createPrivateEvent("2030-01-15"),
      componentProps: {
        refreshBookingContext: privateRefresh,
      },
    });
    const privateWrapper = await privateMounted.wrapperPromise;
    await flushStep2();

    const scrollElement = privateWrapper.get("[data-testid='booking-flow-time-slots-scroll']").element;
    Object.defineProperty(scrollElement, "clientWidth", { configurable: true, value: 260 });
    Object.defineProperty(scrollElement, "scrollWidth", { configurable: true, value: 536 });
    Object.defineProperty(scrollElement, "scrollLeft", {
      configurable: true,
      writable: true,
      value: 204,
    });
    scrollElement.dispatchEvent(new Event("scroll"));
    await nextTick();
    privateRefresh.mockImplementationOnce(async () => {
      await privateWrapper.setProps({
        engine: {
          ...privateMounted.engine,
        },
      });
      return { ok: true };
    });

    await vi.advanceTimersByTimeAsync(15000);
    await flushStep2();

    expect(privateRefresh).toHaveBeenCalledWith({
      silent: true,
      preserveSelectedEvent: true,
    });
    expect(scrollElement.scrollLeft).toBe(204);
    expect(privateWrapper.get("[data-testid='booking-flow-time-slots-previous']").attributes("disabled")).toBeUndefined();
    privateWrapper.unmount();

    vi.clearAllTimers();
    const groupRefresh = vi.fn(() => Promise.resolve({ ok: true }));
    const groupMounted = createMountedStep({
      selectedEvent: createGroupEvent("2030-01-15"),
      componentProps: {
        refreshBookingContext: groupRefresh,
      },
    });
    const groupWrapper = await groupMounted.wrapperPromise;
    await flushStep2();

    await vi.advanceTimersByTimeAsync(15000);
    await flushStep2();

		expect(groupRefresh).toHaveBeenCalledWith({
			silent: true,
			preserveSelectedEvent: true,
		});
		groupWrapper.unmount();
	});

	it("disables a private slot range held by another fan", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2030-01-15T09:00:00"));
		const temporaryHoldSlotsIndex = buildBookedSlotsIndex([{
			eventId: "evt_private_1",
			startIso: "2030-01-15T10:00:00",
			endIso: "2030-01-15T10:30:00",
			status: "temporary_hold",
		}]);
		const { wrapperPromise } = createMountedStep({
			selectedEvent: createPrivateEvent("2030-01-15"),
			temporaryHoldSlotsIndex,
		});
		const wrapper = await wrapperPromise;
		await flushStep2();

		const slots = wrapper.findAll("[data-testid='booking-flow-time-slot']");
		expect(slots[0].classes()).toContain("cursor-not-allowed");
		expect(slots[1].classes()).toContain("cursor-pointer");
		wrapper.unmount();
	});

  it("clamps the preserved scroll position when refreshed slot columns become narrower", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-15T09:00:00"));
    const baseEvent = createPrivateEvent("2030-01-15");
    let mounted;
    let wrapper;
    let scrollElement;
    const refreshBookingContext = vi.fn(async () => {
      mounted.engine.state.fanBooking.context.selectedEvent = {
        ...mounted.engine.state.fanBooking.context.selectedEvent,
        localEndHm: "12:00",
      };
      Object.defineProperty(scrollElement, "scrollWidth", { configurable: true, value: 320 });
      await wrapper.setProps({
        engine: {
          ...mounted.engine,
        },
      });
      return { ok: true };
    });
    mounted = createMountedStep({
      selectedEvent: {
        ...baseEvent,
        localEndHm: "14:00",
        raw: {
          ...baseEvent.raw,
        },
      },
      componentProps: {
        refreshBookingContext,
      },
    });
    wrapper = await mounted.wrapperPromise;
    await flushStep2();

    scrollElement = wrapper.get("[data-testid='booking-flow-time-slots-scroll']").element;
    Object.defineProperty(scrollElement, "clientWidth", { configurable: true, value: 260 });
    Object.defineProperty(scrollElement, "scrollWidth", { configurable: true, value: 536 });
    Object.defineProperty(scrollElement, "scrollLeft", {
      configurable: true,
      writable: true,
      value: 276,
    });
    scrollElement.dispatchEvent(new Event("scroll"));
    await nextTick();

    await vi.advanceTimersByTimeAsync(15000);
    await flushStep2();

    expect(refreshBookingContext).toHaveBeenCalled();
    expect(scrollElement.scrollLeft).toBe(60);
    expect(wrapper.get("[data-testid='booking-flow-time-slots-previous']").attributes("disabled")).toBeUndefined();
    expect(wrapper.get("[data-testid='booking-flow-time-slots-next']").attributes("disabled")).toBeDefined();
    wrapper.unmount();
  });

  it("keeps the selected private slot when Continue refresh still finds it available", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-15T09:00:00"));
    const refreshBookingContext = vi.fn(async () => ({ ok: true }));
    const { engine, wrapperPromise } = createMountedStep({
      dateIso: "2030-01-15",
      selectedEvent: createPrivateEvent("2030-01-15"),
      componentProps: {
        refreshBookingContext,
      },
    });
    const wrapper = await wrapperPromise;
    await flushStep2();

    await wrapper.get("[data-testid='booking-flow-time-slot']").trigger("click");
    await flushStep2();

    await findPaymentSummaryButton(wrapper).trigger("click");
    await flushStep2();

    expect(refreshBookingContext).toHaveBeenCalledWith({
      silent: true,
      preserveSelectedEvent: true,
    });
    expect(engine.goToStep).toHaveBeenCalledWith(3);
    expect(engine.state.fanBooking.selection.selectedSlot).toEqual(expect.objectContaining({
      value: "10:00",
    }));
    expect(engine.state.fanBooking.selection.selectedDurationMinutes).toBe(30);
    expect(showToast).not.toHaveBeenCalledWith(expect.objectContaining({
      message: "This slot has already been booked. Try booking a different slot",
    }));
  });

  it("blocks Continue and clears the selected private slot when refresh finds it booked", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-15T09:00:00"));
    const refreshBookingContext = vi.fn(async () => ({ ok: true }));
    const { engine, wrapperPromise } = createMountedStep({
      dateIso: "2030-01-15",
      selectedEvent: createPrivateEvent("2030-01-15"),
      componentProps: {
        refreshBookingContext,
      },
    });
    const wrapper = await wrapperPromise;
    await flushStep2();

    await wrapper.get("[data-testid='booking-flow-time-slot']").trigger("click");
    await flushStep2();

    refreshBookingContext.mockImplementationOnce(async () => {
      engine.state.fanBooking.catalog.bookedSlotsIndex = buildBookedSlotsIndex([{
        bookingId: "booking_other_fan",
        eventId: "evt_private_1",
        userId: 9001,
        startIso: "2030-01-15T10:00:00",
        endIso: "2030-01-15T10:30:00",
        status: "confirmed",
      }]);
      return { ok: true };
    });

    await findPaymentSummaryButton(wrapper).trigger("click");
    await flushStep2();

    expect(engine.goToStep).not.toHaveBeenCalledWith(3);
    expect(engine.state.fanBooking.selection.selectedSlot).toBeNull();
    expect(engine.state.fanBooking.selection.selectedDurationMinutes).toBeNull();
    expect(engine.state.bookingDetails.selectedTime).toBeNull();
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({
      type: "error",
      message: "This slot has already been booked. Try booking a different slot",
    }));
  });

  it("blocks Continue and clears the selected private slot when refresh finds another fan's hold", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-15T09:00:00"));
    const refreshBookingContext = vi.fn(async () => ({ ok: true }));
    const { engine, wrapperPromise } = createMountedStep({
      dateIso: "2030-01-15",
      selectedEvent: createPrivateEvent("2030-01-15"),
      componentProps: {
        refreshBookingContext,
      },
    });
    const wrapper = await wrapperPromise;
    await flushStep2();

    await wrapper.get("[data-testid='booking-flow-time-slot']").trigger("click");
    await flushStep2();

    refreshBookingContext.mockImplementationOnce(async () => {
      engine.state.fanBooking.catalog.temporaryHoldSlotsIndex = buildBookedSlotsIndex([{
        eventId: "evt_private_1",
        startIso: "2030-01-15T10:00:00",
        endIso: "2030-01-15T10:30:00",
        expiresAt: new Date("2030-01-15T09:10:00").getTime(),
        status: "temporary_hold",
      }]);
      return { ok: true };
    });

    await findPaymentSummaryButton(wrapper).trigger("click");
    await flushStep2();

    expect(engine.goToStep).not.toHaveBeenCalledWith(3);
    expect(engine.state.fanBooking.selection.selectedSlot).toBeNull();
    expect(engine.state.fanBooking.selection.selectedDurationMinutes).toBeNull();
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({
      type: "error",
      message: "This slot has already been booked. Try booking a different slot",
    }));
  });

  it("blocks Continue when refresh finds the selected slot invalidated by booking buffer", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-15T09:00:00"));
    const selectedEvent = {
      ...createPrivateEvent("2030-01-15"),
      raw: {
        ...createPrivateEvent("2030-01-15").raw,
        enableBufferTime: true,
        bookingBufferMinutes: 15,
      },
    };
    const refreshBookingContext = vi.fn(async () => ({ ok: true }));
    const { engine, wrapperPromise } = createMountedStep({
      dateIso: "2030-01-15",
      selectedEvent,
      componentProps: {
        refreshBookingContext,
      },
    });
    const wrapper = await wrapperPromise;
    await flushStep2();

    const slots = wrapper.findAll("[data-testid='booking-flow-time-slot']");
    await slots[1].trigger("click");
    await flushStep2();

    refreshBookingContext.mockImplementationOnce(async () => {
      engine.state.fanBooking.catalog.bookedSlotsIndex = buildBookedSlotsIndex([{
        bookingId: "booking_before_buffer",
        eventId: "evt_private_1",
        userId: 9001,
        startIso: "2030-01-15T10:00:00",
        endIso: "2030-01-15T10:30:00",
        status: "confirmed",
      }]);
      return { ok: true };
    });

    await findPaymentSummaryButton(wrapper).trigger("click");
    await flushStep2();

    expect(engine.goToStep).not.toHaveBeenCalledWith(3);
    expect(engine.state.fanBooking.selection.selectedSlot).toBeNull();
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({
      message: "This slot has already been booked. Try booking a different slot",
    }));
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
    const sessionCount = wrapper.get("[data-testid='booking-flow-session-count']");
    const tokenCost = wrapper.get("[data-testid='booking-flow-duration-token-cost']");

    expect(stepper.text()).toContain("30 mins");
    expect(sessionCount.text()).toBe("1 session");
    expect(tokenCost.text()).toBe("60");

    await plus.trigger("click");
    await nextTick();
    expect(stepper.text()).toContain("60 mins");
    expect(sessionCount.text()).toBe("2 sessions");
    expect(tokenCost.text()).toBe("120");

    await plus.trigger("click");
    await nextTick();
    expect(stepper.text()).toContain("1 hr 30 mins");

    await minus.trigger("click");
    await nextTick();
    expect(stepper.text()).toContain("60 mins");
    expect(wrapper.find("[data-testid='booking-flow-duration-max-warning']").exists()).toBe(false);
  });

  it("uses the highest contiguous duration as the effective maximum when a later slot is booked", async () => {
    const dateIso = "2030-01-15";
    const selectedEvent = {
      ...createPrivateEvent(dateIso),
      sessionDurationMinutes: 5,
      localStartHm: "10:00",
      localEndHm: "11:00",
      maxSessionMinutes: 5,
      raw: {
        ...createPrivateEvent(dateIso).raw,
        sessionDurationMinutes: 5,
        maxSessionMinutes: 5,
      },
    };
    const bookedStart = new Date(`${dateIso}T10:20:00`);
    const bookedEnd = new Date(`${dateIso}T10:25:00`);
    const bookedSlotsIndex = buildBookedSlotsIndex([{
      bookingId: "booking_duration_boundary",
      eventId: selectedEvent.eventId,
      startIso: bookedStart.toISOString(),
      endIso: bookedEnd.toISOString(),
      status: "confirmed",
    }]);
    const { wrapperPromise } = createMountedStep({
      dateIso,
      selectedEvent,
      bookedSlotsIndex,
    });
    const wrapper = await wrapperPromise;
    await flushStep2();

    expect(wrapper.get("[data-testid='booking-flow-session-maximum']").text()).toBe("5 SESSIONS MAX.");

    await wrapper.get("[data-testid='booking-flow-time-slot']").trigger("click");
    await nextTick();

    const plus = wrapper.get("[data-testid='booking-flow-duration-plus']");
    const minus = wrapper.get("[data-testid='booking-flow-duration-minus']");
    expect(wrapper.get("[data-testid='booking-flow-session-maximum']").text()).toBe("4 SESSIONS MAX.");
    expect(plus.attributes("disabled")).toBeUndefined();
    expect(wrapper.find("[data-testid='booking-flow-duration-overlap-warning']").exists()).toBe(false);

    await plus.trigger("click");
    await plus.trigger("click");
    await plus.trigger("click");
    await nextTick();

    expect(wrapper.get("[data-testid='booking-flow-duration-stepper']").text()).toContain("20 mins");
    expect(plus.attributes("disabled")).toBeDefined();
    expect(minus.attributes("disabled")).toBeUndefined();
    expect(wrapper.get("[data-testid='booking-flow-session-maximum-reached']").text()).toContain(
      "MAX SESSION LENGTH REACHED",
    );
    expect(wrapper.find("[data-testid='booking-flow-duration-overlap-warning']").exists()).toBe(false);

    const unblockedSlot = wrapper.findAll("[data-testid='booking-flow-time-slot']").find((slot) => (
      Number(slot.attributes("data-start-ms")) >= bookedEnd.getTime()
      && !slot.attributes("disabled")
    ));
    expect(unblockedSlot).toBeTruthy();
    await unblockedSlot.trigger("click");
    await nextTick();

    expect(wrapper.find("[data-testid='booking-flow-duration-overlap-warning']").exists()).toBe(false);
    expect(wrapper.get("[data-testid='booking-flow-session-maximum']").text()).toBe("5 SESSIONS MAX.");
    expect(wrapper.get("[data-testid='booking-flow-duration-plus']").attributes("disabled")).toBeUndefined();
  });

  it("uses the event window boundary as the effective maximum", async () => {
    const dateIso = "2030-01-15";
    const baseEvent = createPrivateEvent(dateIso);
    const selectedEvent = {
      ...baseEvent,
      sessionDurationMinutes: 5,
      localStartHm: "10:00",
      localEndHm: "10:10",
      maxSessionMinutes: 4,
      raw: {
        ...baseEvent.raw,
        sessionDurationMinutes: 5,
        maxSessionMinutes: 4,
      },
    };
    const { wrapperPromise } = createMountedStep({ dateIso, selectedEvent });
    const wrapper = await wrapperPromise;
    await flushStep2();

    const slots = wrapper.findAll("[data-testid='booking-flow-time-slot']");
    await slots[0].trigger("click");
    await nextTick();

    expect(wrapper.get("[data-testid='booking-flow-session-maximum']").text()).toBe("2 SESSIONS MAX.");
    const plus = wrapper.get("[data-testid='booking-flow-duration-plus']");
    expect(plus.attributes("disabled")).toBeUndefined();

    await plus.trigger("click");
    await nextTick();

    expect(wrapper.get("[data-testid='booking-flow-session-maximum-reached']").text()).toContain(
      "MAX SESSION LENGTH REACHED",
    );
    expect(wrapper.get("[data-testid='booking-flow-duration-plus']").attributes("disabled")).toBeDefined();
    expect(wrapper.find("[data-testid='booking-flow-duration-overlap-warning']").exists()).toBe(false);
  });

  it("uses translated singular and plural labels for the selected session count", async () => {
    const { wrapperPromise } = createMountedStep({
      selectedEvent: createPrivateEvent("2030-01-15"),
      translations: {
        fan_booking_session: "appointment",
        fan_booking_sessions: "appointments",
      },
    });
    const wrapper = await wrapperPromise;
    await nextTick();
    await nextTick();

    await wrapper.get("[data-testid='booking-flow-time-slot']").trigger("click");
    await nextTick();

    const sessionCount = wrapper.get("[data-testid='booking-flow-session-count']");
    expect(sessionCount.text()).toBe("1 appointment");

    await wrapper.get("[data-testid='booking-flow-duration-plus']").trigger("click");
    await nextTick();

    expect(sessionCount.text()).toBe("2 appointments");
  });

  it("shows the configured session maximum and switches to the reached alert at the limit", async () => {
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

    expect(wrapper.get("[data-testid='booking-flow-session-maximum']").text()).toBe("3 SESSIONS MAX.");
    expect(wrapper.find("[data-testid='booking-flow-session-maximum-reached']").exists()).toBe(false);

    const plus = wrapper.get("[data-testid='booking-flow-duration-plus']");
    await plus.trigger("click");
    await plus.trigger("click");
    await nextTick();

    expect(wrapper.find("[data-testid='booking-flow-session-maximum']").exists()).toBe(false);
    expect(wrapper.get("[data-testid='booking-flow-session-maximum-reached']").text()).toContain(
      "MAX SESSION LENGTH REACHED",
    );

    await wrapper.get("[data-testid='booking-flow-duration-minus']").trigger("click");
    await nextTick();

    expect(wrapper.get("[data-testid='booking-flow-session-maximum']").text()).toBe("3 SESSIONS MAX.");
    expect(wrapper.find("[data-testid='booking-flow-session-maximum-reached']").exists()).toBe(false);
  });

  it("uses translated maximum and reached labels", async () => {
    const { wrapperPromise } = createMountedStep({
      selectedEvent: createPrivateEvent("2030-01-15"),
      translations: {
        fan_booking_sessions_maximum: "Maximum: {count} appointments",
        fan_booking_max_session_length_reached: "Appointment limit reached",
      },
    });
    const wrapper = await wrapperPromise;
    await nextTick();
    await nextTick();

    await wrapper.get("[data-testid='booking-flow-time-slot']").trigger("click");
    await nextTick();

    expect(wrapper.get("[data-testid='booking-flow-session-maximum']").text()).toBe(
      "Maximum: 2 appointments",
    );

    await wrapper.get("[data-testid='booking-flow-duration-plus']").trigger("click");
    await nextTick();

    expect(wrapper.get("[data-testid='booking-flow-session-maximum-reached']").text()).toContain(
      "Appointment limit reached",
    );
  });

  it("shows the translated first-time notice only for an eligible configured discount", async () => {
    const baseEvent = createPrivateEvent("2030-01-15");
    const selectedEvent = {
      ...baseEvent,
      enableFirstTimeDiscount: true,
      firstTimeDiscountTokens: 15,
      raw: {
        ...baseEvent.raw,
        enableFirstTimeDiscount: true,
        firstTimeDiscountTokens: 15,
      },
    };
    const { wrapperPromise } = createMountedStep({
      selectedEvent,
      isFirstBookingForCreator: true,
      translations: {
        fan_booking_first_time_discount_received: "Your welcome discount is ready!",
      },
    });
    const wrapper = await wrapperPromise;
    await nextTick();
    await nextTick();

    await wrapper.get("[data-testid='booking-flow-time-slot']").trigger("click");
    await nextTick();

    expect(wrapper.get("[data-testid='booking-flow-first-time-discount-notice']").text()).toContain(
      "Your welcome discount is ready!",
    );

    const { wrapperPromise: returningWrapperPromise } = createMountedStep({
      selectedEvent,
      isFirstBookingForCreator: false,
    });
    const returningWrapper = await returningWrapperPromise;
    await nextTick();
    await nextTick();
    expect(returningWrapper.find("[data-testid='booking-flow-first-time-discount-notice']").exists()).toBe(false);

    const { wrapperPromise: disabledWrapperPromise } = createMountedStep({
      selectedEvent: {
        ...selectedEvent,
        enableFirstTimeDiscount: false,
        raw: {
          ...selectedEvent.raw,
          enableFirstTimeDiscount: false,
        },
      },
      isFirstBookingForCreator: true,
    });
    const disabledWrapper = await disabledWrapperPromise;
    await nextTick();
    await nextTick();
    expect(disabledWrapper.find("[data-testid='booking-flow-first-time-discount-notice']").exists()).toBe(false);
  });

  it("updates the translated longer-session discount notice and confirms when achieved", async () => {
    const baseEvent = createPrivateEvent("2030-01-15");
    const selectedEvent = {
      ...baseEvent,
      localEndHm: "12:00",
      maxSessionMinutes: 4,
      enableDiscountForLonger: true,
      discountMinSessions: 3,
      longerSessionDiscountTokens: 20,
      raw: {
        ...baseEvent.raw,
        maxSessionMinutes: 4,
        enableDiscountForLonger: true,
        discountMinSessions: 3,
        longerSessionDiscountTokens: 20,
      },
    };
    const { wrapperPromise } = createMountedStep({
      selectedEvent,
      translations: {
        fan_booking_longer_discount_one_session_remaining: "Add {count} appointment for the discount",
        fan_booking_longer_discount_sessions_remaining: "Add {count} appointments for the discount",
        fan_booking_longer_discount_achieved: "Longer booking discount achieved!",
      },
    });
    const wrapper = await wrapperPromise;
    await nextTick();
    await nextTick();

    const notice = wrapper.get("[data-testid='booking-flow-longer-discount-notice']");
    const noticeText = notice.get("p");
    expect(notice.text()).toContain("Add 2 appointments for the discount");
    expect(noticeText.classes()).toContain("text-[#FCE40D]");
    expect(noticeText.classes()).not.toContain("text-[#07F468]");

    await wrapper.get("[data-testid='booking-flow-time-slot']").trigger("click");
    await wrapper.get("[data-testid='booking-flow-duration-plus']").trigger("click");
    await nextTick();
    expect(notice.text()).toContain("Add 1 appointment for the discount");

    await wrapper.get("[data-testid='booking-flow-duration-plus']").trigger("click");
    await nextTick();
    expect(notice.text()).toContain("Longer booking discount achieved!");
    expect(noticeText.classes()).toContain("text-[#07F468]");
    expect(noticeText.classes()).not.toContain("text-[#FCE40D]");
    expect(wrapper.get("[data-row-kind='discount']").text()).toContain("60");
    expect(wrapper.get("[data-testid='booking-flow-current-total-row']").text()).toContain("120");

    await wrapper.get("[data-testid='booking-flow-duration-plus']").trigger("click");
    await nextTick();
    expect(wrapper.get("[data-row-kind='discount']").text()).toContain("80");
    expect(wrapper.get("[data-testid='booking-flow-current-total-row']").text()).toContain("160");
  });

  it.each([
    {
      name: "longer sessions are disabled",
      eventOverrides: { allowLongerSessions: false },
      rawOverrides: { allowLongerSessions: false },
    },
    {
      name: "the discount is disabled",
      eventOverrides: { enableDiscountForLonger: false },
      rawOverrides: { enableDiscountForLonger: false },
    },
    {
      name: "the discount amount is zero",
      eventOverrides: { longerSessionDiscountTokens: 0 },
      rawOverrides: { longerSessionDiscountTokens: 0 },
    },
    {
      name: "the threshold is unreachable",
      eventOverrides: { discountMinSessions: 4 },
      rawOverrides: { discountMinSessions: 4 },
    },
  ])("hides the longer-session notice when $name", async ({ eventOverrides, rawOverrides }) => {
    const baseEvent = createPrivateEvent("2030-01-15");
    const selectedEvent = {
      ...baseEvent,
      maxSessionMinutes: 3,
      enableDiscountForLonger: true,
      discountMinSessions: 2,
      longerSessionDiscountTokens: 20,
      ...eventOverrides,
      raw: {
        ...baseEvent.raw,
        maxSessionMinutes: 3,
        enableDiscountForLonger: true,
        discountMinSessions: 2,
        longerSessionDiscountTokens: 20,
        ...rawOverrides,
      },
    };
    const { wrapperPromise } = createMountedStep({ selectedEvent });
    const wrapper = await wrapperPromise;
    await nextTick();
    await nextTick();

    expect(wrapper.find("[data-testid='booking-flow-longer-discount-notice']").exists()).toBe(false);
  });

  it("hides an unattainable longer-session discount for the selected start time", async () => {
    const dateIso = "2030-01-15";
    const baseEvent = createPrivateEvent(dateIso);
    const selectedEvent = {
      ...baseEvent,
      sessionDurationMinutes: 5,
      localStartHm: "10:00",
      localEndHm: "11:00",
      maxSessionMinutes: 5,
      enableDiscountForLonger: true,
      discountMinSessions: 5,
      longerSessionDiscountTokens: 20,
      raw: {
        ...baseEvent.raw,
        sessionDurationMinutes: 5,
        maxSessionMinutes: 5,
        enableDiscountForLonger: true,
        discountMinSessions: 5,
        longerSessionDiscountTokens: 20,
      },
    };
    const bookedSlotsIndex = buildBookedSlotsIndex([{
      bookingId: "booking_discount_boundary",
      eventId: selectedEvent.eventId,
      startIso: new Date(`${dateIso}T10:20:00`).toISOString(),
      endIso: new Date(`${dateIso}T10:25:00`).toISOString(),
      status: "confirmed",
    }]);
    const { wrapperPromise } = createMountedStep({
      dateIso,
      selectedEvent,
      bookedSlotsIndex,
    });
    const wrapper = await wrapperPromise;
    await flushStep2();

    expect(wrapper.find("[data-testid='booking-flow-longer-discount-notice']").exists()).toBe(true);

    await wrapper.get("[data-testid='booking-flow-time-slot']").trigger("click");
    await nextTick();

    expect(wrapper.find("[data-testid='booking-flow-longer-discount-notice']").exists()).toBe(false);
  });

  it("keeps private booking length within the configured maximum and disables increase", async () => {
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
    expect(stepper.text()).toContain("1 hr 30 mins");
    expect(plus.attributes("disabled")).toBeDefined();
    expect(wrapper.get("[data-testid='booking-flow-session-maximum-reached']").text()).toContain(
      "MAX SESSION LENGTH REACHED",
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

    expect(wrapper.get("[data-testid='booking-flow-session-maximum']").text()).toBe("1 SESSION MAX.");

    const noticeBeforeTime = wrapper.get("[data-testid='booking-flow-duration-max-warning']");
    expect(noticeBeforeTime.text()).toContain("Max session length is 30 mins");
    expect(noticeBeforeTime.attributes("class")).toContain("text-[#FACC15]");

    await wrapper.get("[data-testid='booking-flow-time-slot']").trigger("click");
    await nextTick();

    expect(wrapper.get("[data-testid='booking-flow-duration-minus']").attributes("disabled")).toBeDefined();
    expect(wrapper.get("[data-testid='booking-flow-duration-plus']").attributes("disabled")).toBeDefined();
    expect(wrapper.get("[data-testid='booking-flow-session-maximum-reached']").text()).toContain(
      "MAX SESSION LENGTH REACHED",
    );
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
    expect(wrapper.text()).toContain("CALL START TIME");
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
    expect(wrapper.text()).toContain("CALL START TIME");
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

    expect(wrapper.text()).not.toContain("CALL START TIME");
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

    expect(wrapper.text()).toContain("CALL START TIME");
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
    expect(wrapper.text()).toContain("CALL START TIME");
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
    expect(wrapper.text()).toContain("CALL START TIME");
  });

});
