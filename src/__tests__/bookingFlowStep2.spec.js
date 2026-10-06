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
      allowPersonalRequestRequired: true,
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
            BookingFlowStep3: {
              name: 'BookingFlowStep3',
              props: ['prepareGroupBooking', 'groupActionDisabled', 'groupReview'],
              template: "<div data-testid='group-booking-review'><button data-testid='group-booking-action' :disabled='groupActionDisabled' @click='prepareGroupBooking()'>COMPLETE BOOKING</button></div>",
            },
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
              name: 'OneOnOneBookingFlowLeftSideBar',
              props: ["timeDisplay", "duration", "isFirstBookingForCreator", "subtotal", "groupPerformers", "prerequisite"],
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
  it.each([
    { capacity: 7, enabled: true, remaining: 5 },
    { capacity: 3, enabled: true, remaining: 1 },
    { capacity: 8, enabled: true, remaining: 6 },
    { capacity: 12, enabled: true, remaining: 10 },
    { capacity: 13, enabled: true, remaining: null },
    { capacity: 2, enabled: true, remaining: null },
    { capacity: 3, enabled: false, remaining: null },
  ])('shows the group slot warning only for 1–10 remaining places ($capacity, $enabled)', async ({ capacity, enabled, remaining }) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-15T09:00:00'));
    const row = { eventId: 'evt_group_1', startIso: '2030-01-15T10:00:00', endIso: '2030-01-15T13:00:00' };
    const { wrapperPromise } = createMountedStep({
      selectedEvent: createGroupEvent('2030-01-15', { raw: { enableMaxAttendees: enabled, maxAttendees: capacity } }),
      bookedSlotsIndex: buildBookedSlotsIndex([
        { ...row, bookingId: 'joined', userId: 4000, status: 'confirmed' },
        { ...row, bookingId: 'cancelled', userId: 4001, status: 'cancelled_by_user' },
        { ...row, bookingId: 'other-session', userId: 4002, status: 'confirmed', startIso: '2030-01-16T10:00:00', endIso: '2030-01-16T13:00:00' },
      ]),
      temporaryHoldSlotsIndex: buildBookedSlotsIndex([{ ...row, bookingId: 'held', userId: 4003, status: 'temporary_hold' }]),
    });
    const wrapper = await wrapperPromise;
    await flushStep2();
    const badge = wrapper.find('[data-testid="group-slot-spots-left"]');
    expect(badge.exists()).toBe(remaining !== null);
    if (remaining !== null) {
      expect(badge.text()).toBe(`Only ${remaining} left !`);
      expect(badge.classes()).toContain('bg-[#FCE40D]');
      await wrapper.get('[data-testid="booking-flow-time-slot"]').trigger('click');
      expect(wrapper.get('[data-testid="group-slot-spots-left"]').text()).toBe(`Only ${remaining} left !`);
    }
    expect(wrapper.get('[data-testid="group-event-date-time-heading"]').text()).toBe('EVENT DATE & TIME');
    wrapper.unmount();
  });

  it('updates the group slot warning when availability changes', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-15T09:00:00'));
    const mounted = createMountedStep({ selectedEvent: createGroupEvent('2030-01-15', {
      raw: { enableMaxAttendees: true, maxAttendees: 11 },
    }) });
    const wrapper = await mounted.wrapperPromise;
    await flushStep2();
    expect(wrapper.find('[data-testid="group-slot-spots-left"]').exists()).toBe(false);
    mounted.engine.state.fanBooking.catalog.bookedSlotsIndex = buildBookedSlotsIndex([{
      bookingId: 'new-booking', eventId: 'evt_group_1', userId: 4000, status: 'confirmed',
      startIso: '2030-01-15T10:00:00', endIso: '2030-01-15T13:00:00',
    }]);
    await wrapper.setProps({ engine: { ...mounted.engine } });
    await flushStep2();
    expect(wrapper.get('[data-testid="group-slot-spots-left"]').text()).toBe('Only 10 left !');
    wrapper.unmount();
  });

  it('passes group performers and the matching prerequisite to the existing sidebar', async () => {
    const { engine, wrapperPromise } = createMountedStep({ selectedEvent: createGroupEvent('2030-01-15', {
      raw: { coPerformers: [{ name: 'Guest Creator', avatar: '/guest.png' }] },
    }) });
    engine.state.fanBooking.prerequisite = {
      eventId: 'evt_group_1',
      validation: { prerequisite: { eligible: false, type: 'subscription', product: {
        title: 'Parent title', variation_title: 'Close Circle', price: 25, image_url: '/tier.png',
      } } },
    };
    const wrapper = await wrapperPromise;
    await flushStep2();
    const sidebar = wrapper.findComponent({ name: 'OneOnOneBookingFlowLeftSideBar' });
    expect(sidebar.props('groupPerformers')).toEqual([{ name: 'Guest Creator', avatar: '/guest.png' }]);
    expect(sidebar.props('prerequisite').product.variation_title).toBe('Close Circle');
    engine.state.fanBooking.prerequisite.eventId = 'different-event';
    await wrapper.setProps({ engine: { ...engine } });
    expect(sidebar.props('prerequisite')).toBe(null);
    wrapper.unmount();
  });

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

  it("preselects the only group date and slot without showing the calendar", async () => {
    setFixedStepClock();
    const dateIso = "2030-01-16";
    const { engine, wrapperPromise } = createMountedStep({
      dateIso,
      selectedEvent: createGroupEvent(dateIso),
      selection: { selectedDate: null },
    });
    const wrapper = await wrapperPromise;
    await nextTick();
    await nextTick();
    await nextTick();

    expect(wrapper.find(".mini-calendar-stub").exists()).toBe(false);
    expect(wrapper.find("[data-testid='booking-flow-timezone-selector']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='booking-flow-time-slot']").exists()).toBe(true);
    expect(wrapper.text()).not.toContain("SELECT LENGTH");
    expect(wrapper.text()).not.toContain("ADD-ON SERVICE");
    expect(wrapper.text()).not.toContain("OTHER REQUEST");

    expect(engine.goToStep).not.toHaveBeenCalled();
    expect(engine.state.fanBooking.selection.selectedDate).toBe(dateIso);
    expect(wrapper.get("[data-testid='booking-flow-time-slot']").classes()).toContain("bg-[#07F468]");
    await wrapper.get("[data-testid='group-booking-action']").trigger("click");
    await flushStep2();
    expect(engine.goToStep).not.toHaveBeenCalled();
    expect(engine.state.fanBooking.selection.selectedDurationMinutes).toBe(180);
    expect(engine.state.fanBooking.selection.selectedAddOns).toEqual([]);
    expect(engine.state.fanBooking.selection.personalRequestText).toBe("");
  });

  it("excludes the booking fee from the selected group totalPrice", async () => {
    setFixedStepClock();
    const dateIso = "2030-01-16";
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
    const wrapper = await wrapperPromise;
    await nextTick();
    await nextTick();
    await nextTick();

    await wrapper.get("[data-testid='group-booking-action']").trigger("click");
    await flushStep2();
    expect(engine.goToStep).not.toHaveBeenCalled();
    expect(engine.state.bookingDetails.totalPrice).toBe(50);
  });

  it("does not preselect a recurring group with an ongoing and later sessions", async () => {
    const today = setFixedStepClock();
    const { engine, wrapperPromise } = createMountedStep({
      dateIso: today,
      selectedEvent: createDailyGroupEvent(),
      selection: { selectedDate: null },
    });
    const wrapper = await wrapperPromise;
    await nextTick();
    await nextTick();
    await nextTick();

    expect(engine.goToStep).not.toHaveBeenCalled();
    expect(wrapper.find(".mini-calendar-selected").text()).toBe("");
    expect(engine.state.fanBooking.selection.selectedSlot).toBeUndefined();
  });

  it("skips an ongoing group session already booked by the current user", async () => {
    const today = setFixedStepClock();
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
    const wrapper = await wrapperPromise;
    await nextTick();
    await nextTick();
    await nextTick();

    expect(engine.goToStep).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("No booking available on this date.");
    expect(engine.state.fanBooking.selection.selectedSlot).toBeUndefined();
  });

  it.each([
    { name: "multiple sessions on one date", dates: ["2030-01-16", "2030-01-16"] },
    { name: "sessions on different dates", dates: ["2030-01-16", "2030-01-17"] },
  ])("shows the calendar only for different group dates with $name", async ({ dates }) => {
    setFixedStepClock();
    const { engine, wrapperPromise } = createMountedStep({
      selectedEvent: createGroupEvent(dates[0], {
        raw: {
          slots: dates.map((date, index) => ({
            date,
            times: [{ startTime: index ? "15:00" : "12:00", endTime: index ? "16:00" : "13:00" }],
          })),
        },
      }),
      selection: { selectedDate: null },
    });
    const wrapper = await wrapperPromise;
    await flushStep2();

    const multipleDates = dates[0] !== dates[1];
    expect(wrapper.find(".mini-calendar-stub").exists()).toBe(multipleDates);
    expect(wrapper.find("[data-testid='booking-flow-time-slot']").exists()).toBe(!multipleDates);
    expect(engine.goToStep).not.toHaveBeenCalled();

    if (multipleDates) {
      expect(wrapper.find(".mini-calendar-selected").text()).toBe("");
      // Select through the same event emitted by the real calendar.
      wrapper.findComponent(".mini-calendar-stub").vm.$emit("date-selected", new Date(`${dates[0]}T00:00:00`));
      await flushStep2();
    }
    const slot = wrapper.get("[data-testid='booking-flow-time-slot']");
    expect(slot.classes()).not.toContain("bg-[#07F468]");
    expect(wrapper.find("[data-testid='group-booking-review']").exists()).toBe(false);
    expect(wrapper.get("[data-testid='group-select-time-prompt']").text()).toContain('Please select an event time');
    await slot.trigger("click");
    await flushStep2();
    await wrapper.get("[data-testid='group-booking-action']").trigger("click");
    await flushStep2();
    expect(engine.goToStep).not.toHaveBeenCalled();
    expect(engine.state.fanBooking.selection.selectedDate).toBe(dates[0]);
  });

  it("preselects only the remaining bookable group slot and preserves goal contribution", async () => {
    setFixedStepClock();
    const dateIso = "2030-01-16";
    const selectedEvent = createGroupEvent(dateIso, {
      raw: {
        priceSetting: "eventGoal",
        eventGoalTokens: 1000,
        minContributionPerUser: 20,
        enableMaxAttendees: true,
        maxAttendees: 1,
        slots: [{ date: dateIso, times: [
          { startTime: "12:00", endTime: "13:00" },
          { startTime: "15:00", endTime: "16:00" },
        ] }],
      },
    });
    const bookedSlotsIndex = buildBookedSlotsIndex([{
      bookingId: "full_group_slot",
      eventId: selectedEvent.eventId,
      userId: 999,
      eventType: "group-event",
      startIso: `${dateIso}T12:00:00+08:00`,
      endIso: `${dateIso}T13:00:00+08:00`,
      status: "confirmed",
    }]);
    const { engine, wrapperPromise } = createMountedStep({
      selectedEvent,
      bookedSlotsIndex,
      selection: { selectedDate: null, contributionTokens: 40 },
    });
    const wrapper = await wrapperPromise;
    await flushStep2();
    expect(wrapper.find(".mini-calendar-stub").exists()).toBe(false);
    expect(engine.state.fanBooking.selection.selectedDate).toBe(dateIso);
    const slots = wrapper.findAll("[data-testid='booking-flow-time-slot']");
    expect(slots[0].classes()).toContain("cursor-not-allowed");
    expect(slots[1].classes()).toContain("bg-[#07F468]");
    expect(engine.goToStep).not.toHaveBeenCalled();
    expect(wrapper.get('#step2-event-goal-contribution').element.value).toBe('40');
    await wrapper.get("[data-testid='group-booking-action']").trigger("click");
    await flushStep2();
    expect(engine.state.fanBooking.selection.contributionTokens).toBe(40);
    expect(engine.state.fanBooking.selection.selectedDurationMinutes).toBe(60);
  });

  it("hides the group calendar for a sole date beyond its 45-day preview", async () => {
    setFixedStepClock();
    const dateIso = '2030-04-16';
    const { engine, wrapperPromise } = createMountedStep({
      selectedEvent: createGroupEvent(dateIso, { raw: {
        slots: [{ date: dateIso, times: [{ startTime: '12:00', endTime: '13:00' }] }],
      } }),
      selection: { selectedDate: null },
    });
    const wrapper = await wrapperPromise;
    await flushStep2();
    expect(wrapper.find('.mini-calendar-stub').exists()).toBe(false);
    expect(wrapper.get('[data-testid="booking-flow-time-slot"]').classes()).toContain('bg-[#07F468]');
    expect(engine.state.fanBooking.selection.selectedDate).toBe(dateIso);
    wrapper.unmount();
  });

  it("counts only bookable group dates and updates the calendar when capacity changes", async () => {
    setFixedStepClock();
    const dates = ['2030-01-16', '2030-01-17'];
    const selectedEvent = createGroupEvent(dates[0], { raw: {
      enableMaxAttendees: true,
      maxAttendees: 1,
      slots: dates.map(date => ({ date, times: [{ startTime: '12:00', endTime: '13:00' }] })),
    } });
    const { engine, wrapperPromise } = createMountedStep({
      selectedEvent,
      selection: { selectedDate: null },
    });
    const wrapper = await wrapperPromise;
    await flushStep2();
    expect(wrapper.find('.mini-calendar-stub').exists()).toBe(true);

    engine.state.fanBooking.catalog.bookedSlotsIndex = buildBookedSlotsIndex([{
      eventId: selectedEvent.eventId,
      userId: 999,
      eventType: 'group-event',
      startIso: `${dates[1]}T12:00:00+08:00`,
      endIso: `${dates[1]}T13:00:00+08:00`,
      status: 'confirmed',
    }]);
    await wrapper.setProps({ engine: { ...engine } });
    await flushStep2();
    expect(wrapper.find('.mini-calendar-stub').exists()).toBe(false);
    expect(engine.state.fanBooking.selection.selectedDate).toBe(dates[0]);
    const selectedStart = engine.state.fanBooking.selection.selectedSlot.startMs;

    engine.state.fanBooking.catalog.bookedSlotsIndex = {};
    await wrapper.setProps({ engine: { ...engine } });
    await flushStep2();
    expect(wrapper.find('.mini-calendar-stub').exists()).toBe(true);
    expect(engine.state.fanBooking.selection.selectedSlot.startMs).toBe(selectedStart);
    wrapper.unmount();
  });

  it("keeps the private calendar even when there is only one date", async () => {
    setFixedStepClock();
    const { wrapperPromise } = createMountedStep({ selectedEvent: createPrivateEvent('2030-01-16') });
    const wrapper = await wrapperPromise;
    await flushStep2();
    expect(wrapper.find('.mini-calendar-stub').exists()).toBe(true);
    wrapper.unmount();
  });

  it("edits the goal contribution in step 2 and preserves it for the payment handler", async () => {
    setFixedStepClock();
    const { engine, wrapperPromise } = createMountedStep({
      dateIso: '2030-01-16',
      selectedEvent: createGroupEvent('2030-01-16', { raw: {
        priceSetting: 'eventGoal', eventGoalTokens: 1000, minContributionPerUser: 20,
      } }),
    });
    const wrapper = await wrapperPromise;
    await flushStep2();
    const input = wrapper.get('#step2-event-goal-contribution');
    const range = wrapper.get('[data-testid="step2-event-goal-contribution-range"]');
    expect(input.attributes('min')).toBe('20');
    expect(range.attributes('max')).toBe('14000');
    await input.setValue('500');
    await flushStep2();
    expect(engine.state.bookingDetails.contributionTokens).toBe(500);
    expect(engine.state.bookingDetails.totalPrice).toBe(500);
    expect(engine.state.fanBooking.selection.contributionTokens).toBe(500);
    expect(range.element.value).toBe('500');
    await input.setValue('10');
    await flushStep2();
    expect(input.element.value).toBe('10');
    expect(engine.state.bookingDetails.contributionTokens).toBe(10);
    expect(wrapper.get('[data-testid="step2-event-goal-contribution-error"]').text())
      .toBe('Minimum contribution is 20 tokens. Please input 20 or more.');
    expect(wrapper.get('[data-testid="group-booking-action"]').element.disabled).toBe(true);
    expect(engine.goToStep).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it.each([
    { goal: 50000, balance: 0 },
    { goal: 1000, balance: 50000 },
    { goal: 1000, balance: 5000 },
    { goal: 1000, balance: 0 },
  ])("blocks goal contribution above 14,000 with goal $goal and balance $balance", async ({ goal, balance }) => {
    setFixedStepClock();
    const { engine, wrapperPromise } = createMountedStep({
      dateIso: '2030-01-16',
      bookingDetails: { walletBalance: balance },
      selectedEvent: createGroupEvent('2030-01-16', { raw: {
        priceSetting: 'eventGoal', eventGoalTokens: goal, minContributionPerUser: 20,
      } }),
    });
    const wrapper = await wrapperPromise;
    await flushStep2();
    const input = wrapper.get('#step2-event-goal-contribution');
    const range = wrapper.get('[data-testid="step2-event-goal-contribution-range"]');
    expect(input.attributes('max')).toBe('14000');
    expect(range.attributes('max')).toBe('14000');
    await input.setValue('5000');
    await flushStep2();
    expect(engine.state.bookingDetails.contributionTokens).toBe(5000);
    expect(engine.state.bookingDetails.totalPrice).toBe(5000);
    expect(engine.state.fanBooking.selection.contributionTokens).toBe(5000);
    await input.setValue('14000');
    await flushStep2();
    expect(engine.state.bookingDetails.contributionTokens).toBe(14000);
    await input.setValue('14001');
    await flushStep2();
    expect(input.element.value).toBe('14001');
    expect(engine.state.bookingDetails.contributionTokens).toBe(14001);
    expect(engine.state.fanBooking.selection.contributionTokens).toBe(14001);
    expect(wrapper.get('[data-testid="group-booking-action"]').element.disabled).toBe(true);
    expect(wrapper.get('[data-testid="step2-event-goal-contribution-error"]').text())
      .toBe('Contribution must be between 20 and 14000 tokens.');
    wrapper.unmount();
  });

  it("allows typing a new contribution digit by digit and preserves invalid edits through refresh", async () => {
    setFixedStepClock();
    const selectedEvent = createGroupEvent('2030-01-16', { raw: {
      priceSetting: 'eventGoal', eventGoalTokens: 1000, minContributionPerUser: 10,
    } });
    const refreshBookingContext = vi.fn();
    const { engine, wrapperPromise } = createMountedStep({
      dateIso: '2030-01-16', selectedEvent,
      componentProps: { refreshBookingContext },
    });
    const wrapper = await wrapperPromise;
    await flushStep2();
    const input = wrapper.get('#step2-event-goal-contribution');
    const action = wrapper.get('[data-testid="group-booking-action"]');
    expect(input.element.value).toBe('10');

    refreshBookingContext.mockImplementation(async () => {
      engine.state.fanBooking.context.selectedEvent = { ...selectedEvent };
      await wrapper.setProps({ engine: { ...engine } });
      return { ok: true };
    });
    for (const value of ['', '2', '9.5']) {
      await input.setValue(value);
      await flushStep2();
      expect(input.element.value).toBe(value);
      expect(action.element.disabled).toBe(true);
      expect(input.attributes('aria-invalid')).toBe('true');
      expect(wrapper.get('[data-testid="step2-event-goal-contribution-error"]').text())
        .toBe('Minimum contribution is 10 tokens. Please input 10 or more.');
      await vi.advanceTimersByTimeAsync(15000);
      await flushStep2();
      expect(input.element.value).toBe(value);
      expect(action.element.disabled).toBe(true);
    }

    for (const value of ['2', '25', '250', '10']) {
      await input.setValue(value);
      await flushStep2();
      expect(input.element.value).toBe(value);
      expect(action.element.disabled).toBe(Number(value) < 10);
    }
    expect(wrapper.find('[data-testid="step2-event-goal-contribution-error"]').exists()).toBe(false);
    expect(engine.state.bookingDetails.contributionTokens).toBe(10);
    wrapper.unmount();
  });

  it("keeps a manually chosen group session through the availability refresh", async () => {
    setFixedStepClock();
    const selectedEvent = createGroupEvent("2030-01-16", {
      raw: { slots: [{ date: "2030-01-16", times: [
        { startTime: "12:00", endTime: "13:00" },
        { startTime: "15:00", endTime: "16:00" },
      ] }] },
    });
    const refreshBookingContext = vi.fn();
    const { engine, wrapperPromise } = createMountedStep({
      dateIso: "2030-01-16",
      selectedEvent,
      componentProps: { refreshBookingContext },
    });
    const wrapper = await wrapperPromise;
    await flushStep2();
    await wrapper.findAll("[data-testid='booking-flow-time-slot']")[1].trigger("click");
    await flushStep2();
    refreshBookingContext.mockImplementation(async () => {
      engine.state.fanBooking.context.selectedEvent = { ...selectedEvent };
      await wrapper.setProps({ engine: { ...engine } });
      return { ok: true };
    });
    await vi.advanceTimersByTimeAsync(15000);
    await flushStep2();
    expect(wrapper.findAll("[data-testid='booking-flow-time-slot']")[1].classes()).toContain("bg-[#07F468]");
    expect(engine.goToStep).not.toHaveBeenCalled();
  });

  it.each([
    { name: 'another attendee with places remaining', users: [999], available: true },
    { name: 'a full session', users: [991, 992, 993, 994, 995, 996], available: false },
    { name: 'the current fan already booked', users: [2615], available: false },
  ])('rechecks group capacity on Continue: $name', async ({ users, available }) => {
    setFixedStepClock();
    const dateIso = '2030-01-16';
    const selectedEvent = createGroupEvent(dateIso, {
      raw: { enableMaxAttendees: true, maxAttendees: 6 },
    });
    const booking = (userId) => ({
      bookingId: `group_booking_${userId}`,
      eventId: selectedEvent.eventId,
      userId,
      eventType: 'group-event',
      startIso: `${dateIso}T10:00:00+08:00`,
      endIso: `${dateIso}T13:00:00+08:00`,
      status: 'confirmed',
    });
    const refreshBookingContext = vi.fn();
    const { engine, wrapperPromise } = createMountedStep({
      dateIso,
      selectedEvent,
      bookedSlotsIndex: buildBookedSlotsIndex([booking(999)]),
      componentProps: { refreshBookingContext },
    });
    const wrapper = await wrapperPromise;
    await flushStep2();
    refreshBookingContext.mockImplementation(async () => {
      engine.state.fanBooking.catalog.bookedSlotsIndex = buildBookedSlotsIndex(users.map(booking));
      await wrapper.setProps({ engine: { ...engine } });
      return { ok: true };
    });
    showToast.mockClear();
    await wrapper.get('[data-testid="group-booking-action"]').trigger('click');
    await flushStep2();
    expect(Boolean(engine.state.fanBooking.selection.selectedSlot)).toBe(available);
    if (available) expect(showToast).not.toHaveBeenCalled();
    else expect(showToast).toHaveBeenCalled();
    wrapper.unmount();
  });

  it("preselects an ongoing group session only when it is the sole remaining session", async () => {
    const today = setFixedStepClock();
    const { engine, wrapperPromise } = createMountedStep({
      selectedEvent: createGroupEvent(today, { localStartHm: "11:00", localEndHm: "13:00" }),
      selection: { selectedDate: null },
    });
    const wrapper = await wrapperPromise;
    await flushStep2();
    expect(wrapper.find(".mini-calendar-stub").exists()).toBe(false);
    expect(engine.state.fanBooking.selection.selectedDate).toBe(today);
    expect(wrapper.get("[data-testid='booking-flow-time-slot']").classes()).toContain("bg-[#07F468]");
    expect(engine.goToStep).not.toHaveBeenCalled();
  });

  it("leaves an expired group event unselected without jumping to another step", async () => {
    const today = setFixedStepClock();
    const { engine, wrapperPromise } = createMountedStep({
      selectedEvent: createGroupEvent(today, { localStartHm: "09:00", localEndHm: "10:00" }),
      selection: { selectedDate: null },
    });
    const wrapper = await wrapperPromise;
    await flushStep2();
    expect(wrapper.find(".mini-calendar-selected").text()).toBe("");
    expect(engine.goToStep).not.toHaveBeenCalled();
  });

  it('removes an ongoing group slot and its selection at the ten-minute cutoff', async () => {
    const today = setFixedStepClock();
    vi.setSystemTime(new Date(`${today}T12:49:59`));
    const { engine, wrapperPromise } = createMountedStep({
      selectedEvent: createGroupEvent(today, { localStartHm: '11:00', localEndHm: '13:00' }),
      selection: { selectedDate: null },
    });
    const wrapper = await wrapperPromise;
    await flushStep2();
    expect(wrapper.find('[data-testid="booking-flow-time-slot"]').exists()).toBe(true);
    expect(engine.state.fanBooking.selection.selectedSlot).toBeTruthy();
    await vi.advanceTimersByTimeAsync(1000);
    await flushStep2();
    expect(wrapper.find('[data-testid="booking-flow-time-slot"]').exists()).toBe(false);
    expect(engine.state.fanBooking.selection.selectedSlot).toBeNull();
    expect(wrapper.text()).toContain('No booking available on this date.');
    expect(engine.goToStep).not.toHaveBeenCalled();
    wrapper.unmount();
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
    expect(wrapper.find("[data-testid='booking-flow-personal-request']").exists()).toBe(true);
    expect(wrapper.text()).not.toContain("SELECT EVENT TIME");
  });

  it.each([false, "false", 0, "0", ""])(
    "hides and clears personal requests when the event setting is %j",
    async (setting) => {
      const selectedEvent = createPrivateEvent();
      selectedEvent.raw.allowPersonalRequestRequired = setting;
      const { engine, wrapperPromise } = createMountedStep({
        selectedEvent,
        bookingDetails: { otherRequest: "stale booking request" },
        selection: { personalRequestText: "stale selection request" },
      });
      const wrapper = await wrapperPromise;
      await flushStep2();

      expect(wrapper.find("[data-testid='booking-flow-personal-request']").exists()).toBe(false);
      expect(engine.state.bookingDetails.otherRequest).toBe("");
      expect(engine.state.fanBooking.selection.personalRequestText).toBe("");
      wrapper.unmount();
    },
  );

  it("treats a missing personal-request setting as disabled", async () => {
    const selectedEvent = createPrivateEvent();
    delete selectedEvent.raw.allowPersonalRequestRequired;
    const { engine, wrapperPromise } = createMountedStep({
      selectedEvent,
      bookingDetails: { otherRequest: "stale booking request" },
      selection: { personalRequestText: "stale selection request" },
    });
    const wrapper = await wrapperPromise;
    await flushStep2();

    expect(wrapper.find("[data-testid='booking-flow-personal-request']").exists()).toBe(false);
    expect(engine.state.bookingDetails.otherRequest).toBe("");
    expect(engine.state.fanBooking.selection.personalRequestText).toBe("");
  });

  it("clears a personal request when an event refresh disables the setting", async () => {
    const selectedEvent = createPrivateEvent();
    const { engine, wrapperPromise } = createMountedStep({
      selectedEvent,
      bookingDetails: { otherRequest: "keep until disabled" },
      selection: { personalRequestText: "keep until disabled" },
    });
    const wrapper = await wrapperPromise;
    await flushStep2();
    expect(wrapper.find("[data-testid='booking-flow-personal-request']").exists()).toBe(true);

    engine.state.fanBooking.context.selectedEvent = {
      ...selectedEvent,
      raw: {
        ...selectedEvent.raw,
        allowPersonalRequestRequired: false,
      },
    };
    await wrapper.setProps({ engine: { ...engine } });
    await flushStep2();

    expect(wrapper.find("[data-testid='booking-flow-personal-request']").exists()).toBe(false);
    expect(engine.state.bookingDetails.otherRequest).toBe("");
    expect(engine.state.fanBooking.selection.personalRequestText).toBe("");
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

  it("uses booking deposit terminology for a positive configured allocation", async () => {
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
    });
    const wrapper = await wrapperPromise;
    await flushStep2();

    await wrapper.get("[data-testid='booking-flow-time-slot']").trigger("click");
    await nextTick();

    const notice = wrapper.get("[data-testid='booking-flow-step2-summary-booking-fee-notice']");
    expect(notice.text()).toBe("A non-refundable booking deposit of 15 Tokens applied.");
    expect(notice.text()).not.toContain("booking fee");
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
    expect(previous.element.style.display).toBe("none");
    expect(next.element.style.display).toBe("");

    await next.trigger("click");
    await nextTick();
    expect(scrollElement.scrollBy).toHaveBeenCalledWith({ left: 136, behavior: "smooth" });
    expect(previous.attributes("disabled")).toBeUndefined();
    expect(previous.element.style.display).toBe("");
    expect(next.element.style.display).toBe("");

    await previous.trigger("click");
    await nextTick();
    expect(scrollElement.scrollBy).toHaveBeenLastCalledWith({ left: -136, behavior: "smooth" });
    expect(previous.attributes("disabled")).toBeDefined();
    expect(previous.element.style.display).toBe("none");

    scrollElement.scrollLeft = 276;
    scrollElement.dispatchEvent(new Event("scroll"));
    await nextTick();
    expect(next.attributes("disabled")).toBeDefined();
    expect(next.element.style.display).toBe("none");
    expect(previous.element.style.display).toBe("");
  });

  it('hides group slot arrows and their empty header when there is no overflow', async () => {
    const wrapper = await createMountedStep().wrapperPromise;
    await flushStep2();
    const scroll = wrapper.get('[data-testid="booking-flow-time-slots-scroll"]');
    Object.defineProperty(scroll.element, 'clientWidth', { configurable: true, value: 500 });
    Object.defineProperty(scroll.element, 'scrollWidth', { configurable: true, value: 500 });
    await scroll.trigger('scroll');
    expect(wrapper.get('[data-testid="booking-flow-time-slots-previous"]').isVisible()).toBe(false);
    expect(wrapper.get('[data-testid="booking-flow-time-slots-next"]').isVisible()).toBe(false);
    expect(wrapper.get('[data-testid="booking-flow-time-slots-header"]').isVisible()).toBe(false);
    wrapper.unmount();
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
