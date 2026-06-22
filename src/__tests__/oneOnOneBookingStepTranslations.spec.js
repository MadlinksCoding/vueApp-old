import { mount, shallowMount } from "@vue/test-utils";
import { nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bookingTranslationSymbol, createBookingTranslator } from "@/i18n/bookingTranslations.js";
import { showToast } from "@/utils/toastBus.js";

let sendBeaconDescriptor;
let scrollIntoViewDescriptor;
let focusDescriptor;

vi.mock("quill", () => {
  const Quill = vi.fn();
  Quill.import = vi.fn(() => ({ list: {} }));
  return { default: Quill };
});

vi.mock("@/services/events/eventsAudienceApi.js", () => ({
  fetchActiveSubscriptionTiers: vi.fn(() => Promise.resolve([])),
  searchInvitableUsers: vi.fn(() => Promise.resolve([])),
}));

vi.mock("@/utils/toastBus.js", () => ({
  showToast: vi.fn(),
}));

vi.mock("vue-router", () => ({
  useRoute: () => ({ params: {}, query: {} }),
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
  const engine = {
    state,
    getState: vi.fn((path) => {
      if (!path) return state;
      return String(path).split(".").reduce((cursor, key) => cursor?.[key], state);
    }),
    setState: vi.fn((path, value) => setByPath(state, path, value)),
    goToStep: vi.fn(),
    forceStep: vi.fn(),
    callFlow: vi.fn(),
    validate: vi.fn(() => Promise.resolve({ valid: true, errors: [] })),
  };
  return engine;
}

function mountOptions(translations = {}) {
  return {
    provide: {
      [bookingTranslationSymbol]: createBookingTranslator({ translations }),
    },
    stubs: {
      BookingSectionsWrapper: {
        props: ["title"],
        template: "<section><h2>{{ title }}</h2><slot /></section>",
      },
      BaseInput: {
        props: ["placeholder", "disabled"],
        template: "<input :placeholder='placeholder' :disabled='disabled' />",
      },
      ButtonComponent: {
        props: ["text", "disabled", "customClass"],
        emits: ["click"],
        template: "<button :disabled='disabled' :class='customClass' @click='$emit(\"click\", $event)'>{{ text }}</button>",
      },
      CheckboxGroup: {
        props: ["label", "disabled"],
        template: "<label><input type='checkbox' :disabled='disabled' /><span>{{ label }}</span><slot name='label' /></label>",
      },
      CheckboxSwitch: {
        props: ["label", "wrapperLabel"],
        template: "<label><span>{{ label }}</span><span>{{ wrapperLabel }}</span></label>",
      },
      CustomDropdown: {
        name: "CustomDropdown",
        props: ["options", "searchable", "searchPlaceholder", "disabled", "optionFactory"],
        template: "<div :data-disabled='disabled ? \"true\" : \"false\"'><span v-for='option in options' :key='option.value'>{{ option.label }}</span></div>",
      },
      InputComponentDashbaord: {
        props: ["placeholder", "labelText"],
        template: "<label><span>{{ labelText }}</span><input :placeholder='placeholder' /></label>",
      },
      MagnifyingGlassIcon: true,
      PopupHandler: {
        template: "<div><slot /></div>",
      },
      SpendingRequirementProductPopup: true,
      ThumbnailUploaderNay: {
        props: ["buttonText", "dropText", "customAllowedTypes", "customMaxSize"],
        template: "<div>{{ buttonText }} {{ dropText }} {{ customAllowedTypes }} {{ customMaxSize }}</div>",
      },
      QuillEditor: true,
      TooltipIcon: {
        props: ["text"],
        template: "<span>{{ text }}<slot /></span>",
      },
      TwitterRepostSettings: true,
      SoftDisabledBookingButton: false,
      ValidationInlineWarning: false,
    },
  };
}

function findSectionByTitle(wrapper, title) {
  return wrapper.findAll("section").find((section) => section.find("h2").text() === title);
}

function findStartDateInput(wrapper) {
  return wrapper.findAll("input[type='date']")[0];
}

function findDateInputs(wrapper) {
  return wrapper.findAll("input[type='date']");
}

function getTodayIsoDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function unrefPublic(value) {
  return value?.value ?? value;
}

async function settleValidation() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

describe("one-on-one booking step translations", () => {
  beforeEach(() => {
    sendBeaconDescriptor = Object.getOwnPropertyDescriptor(navigator, "sendBeacon");
    scrollIntoViewDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, "scrollIntoView");
    focusDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "focus");
    vi.clearAllMocks();
    document.body.innerHTML = "";
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true }),
    })));
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(HTMLElement.prototype, "focus", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    if (sendBeaconDescriptor) {
      Object.defineProperty(navigator, "sendBeacon", sendBeaconDescriptor);
    } else {
      delete navigator.sendBeacon;
    }
    if (scrollIntoViewDescriptor) {
      Object.defineProperty(Element.prototype, "scrollIntoView", scrollIntoViewDescriptor);
    } else {
      delete Element.prototype.scrollIntoView;
    }
    if (focusDescriptor) {
      Object.defineProperty(HTMLElement.prototype, "focus", focusDescriptor);
    } else {
      delete HTMLElement.prototype.focus;
    }
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("shows step 1 validation as translated validation messages", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const engine = createEngine({ eventType: "1on1-call" });
    engine.goToStep.mockRejectedValue({
      errors: [
        { field: "eventTitle", translationKey: "booking_validation_event_title_required" },
        { field: "duration", translationKey: "booking_validation_duration_min" },
        { field: "basePrice", translationKey: "booking_validation_base_price_required" },
      ],
    });

    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine,
        bookingType: "private",
      },
      global: mountOptions(),
    });

    await wrapper.vm.goToNext();
    await settleValidation();

    expect(showToast).not.toHaveBeenCalled();
    expect(wrapper.get("[data-booking-validation-field='eventTitle']").text()).toContain("Event title is required.");
    expect(wrapper.get("[data-booking-validation-field='duration']").text()).toContain("Session duration must be at least 5 minutes.");
    expect(wrapper.get("[data-booking-validation-field='basePrice']").text()).toContain("Base price is required.");
  });

  it("uses translations for step 1 inline validation messages", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const engine = createEngine({ eventType: "1on1-call" });
    engine.goToStep.mockRejectedValue({
      errors: [
        { field: "eventTitle", translationKey: "booking_validation_event_title_required" },
        { field: "basePrice", translationKey: "booking_validation_base_price_required" },
      ],
    });

    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine,
        bookingType: "private",
      },
      global: mountOptions({
        common_validation_failed: "Validacion fallida",
        booking_validation_event_title_required: "El titulo del evento es obligatorio.",
      }),
    });

    await wrapper.vm.goToNext();
    await settleValidation();

    expect(showToast).not.toHaveBeenCalled();
    expect(wrapper.get("[data-booking-validation-field='eventTitle']").text()).toContain("El titulo del evento es obligatorio.");
    expect(wrapper.get("[data-booking-validation-field='basePrice']").text()).toContain("Base price is required.");
  });

  it("shows conditional step 1 validation as fields to fill or disable", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const engine = createEngine({ eventType: "1on1-call" });
    engine.goToStep.mockRejectedValue({
      errors: [
        { field: "extendSessionMax", translationKey: "booking_validation_extend_session_max_min", conditional: true },
      ],
    });

    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine,
        bookingType: "private",
      },
      global: mountOptions(),
    });

    await wrapper.vm.goToNext();
    await settleValidation();

    expect(showToast).not.toHaveBeenCalled();
    expect(wrapper.get("[data-booking-validation-tooltip-field='extendSessionMax']").text()).toContain("Extension session maximum");
  });

  it("numbers every mixed conditional step 1 validation item", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const engine = createEngine({ eventType: "1on1-call" });
    engine.goToStep.mockRejectedValue({
      errors: [
        { field: "offHourSurcharge", translationKey: "booking_validation_off_hour_surcharge_range", conditional: true },
        { field: "bookingBufferMinutes", translationKey: "booking_validation_buffer_time_min", conditional: false },
      ],
    });

    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine,
        bookingType: "private",
      },
      global: mountOptions(),
    });

    await wrapper.vm.goToNext();
    await settleValidation();

    expect(showToast).not.toHaveBeenCalled();
    expect(wrapper.get("[data-booking-validation-tooltip-field='offHourSurcharge']").text()).toContain("Off-hour surcharge");
    expect(wrapper.get("[data-booking-validation-tooltip-field='bufferTime']").text()).toContain("Buffer time must be at least 5 minutes.");
  });

  it("shows filled conditional numeric errors as translated validation messages", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const engine = createEngine({ eventType: "1on1-call" });
    engine.goToStep.mockRejectedValue({
      errors: [
        { field: "bookingBufferMinutes", translationKey: "booking_validation_buffer_time_min", conditional: false },
      ],
    });

    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine,
        bookingType: "private",
      },
      global: mountOptions(),
    });

    await wrapper.vm.goToNext();
    await settleValidation();

    expect(showToast).not.toHaveBeenCalled();
    expect(wrapper.get("[data-booking-validation-tooltip-field='bufferTime']").text()).toContain("Buffer time must be at least 5 minutes.");
  });

  it("soft-disables step 1 Next and exposes the validation tooltip", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const engine = createEngine({ eventType: "1on1-call" });
    engine.validate = vi.fn(() => Promise.resolve({
      valid: false,
      errors: [
        { field: "eventTitle", translationKey: "booking_validation_event_title_required" },
      ],
    }));

    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine,
        bookingType: "private",
      },
      global: mountOptions(),
    });

    await settleValidation();

    const action = wrapper.get("[data-booking-soft-disabled='true']");
    expect(action.text()).toContain("Next");
    expect(action.get("[data-booking-validation-tooltip='true']").text()).toContain("Event title is required.");
  });

  it("removes soft-disabled button styling after validation becomes valid", async () => {
    const { default: SoftDisabledBookingButton } = await import(
      "@/components/ui/form/BookingForm/HelperComponents/SoftDisabledBookingButton.vue"
    );

    const wrapper = mount(SoftDisabledBookingButton, {
      props: {
        text: "Next",
        softDisabled: true,
      },
    });

    expect(wrapper.get("[data-booking-soft-disabled]").attributes("data-booking-soft-disabled")).toBe("true");
    expect(wrapper.get("button").classes()).toContain("booking-validation-soft-disabled");

    await wrapper.setProps({ softDisabled: false });
    await nextTick();

    expect(wrapper.get("[data-booking-soft-disabled]").attributes("data-booking-soft-disabled")).toBe("false");
    expect(wrapper.get("button").classes()).not.toContain("booking-validation-soft-disabled");
  });

  it("closes the soft-disabled tooltip after selecting an item", async () => {
    const { default: SoftDisabledBookingButton } = await import(
      "@/components/ui/form/BookingForm/HelperComponents/SoftDisabledBookingButton.vue"
    );

    const wrapper = mount(SoftDisabledBookingButton, {
      props: {
        text: "Next",
        softDisabled: true,
        tooltipItems: [
          { field: "duration", label: "Session duration must be at least 5 minutes." },
        ],
      },
    });

    expect(wrapper.find("[data-booking-validation-tooltip='true']").exists()).toBe(true);

    await wrapper.get("[data-booking-validation-tooltip-field='duration']").trigger("click");
    await nextTick();

    expect(wrapper.find("[data-booking-validation-tooltip='true']").exists()).toBe(false);

    await wrapper.get("button").trigger("click");
    await nextTick();

    expect(wrapper.find("[data-booking-validation-tooltip='true']").exists()).toBe(true);
  });

  it("clicking a step 1 tooltip row reveals, scrolls, and focuses that field", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const engine = createEngine({ eventType: "1on1-call" });
    engine.validate = vi.fn(() => Promise.resolve({
      valid: false,
      errors: [
        { field: "basePrice", translationKey: "booking_validation_base_price_required" },
      ],
    }));

    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine,
        bookingType: "private",
      },
      global: mountOptions(),
    });

    await settleValidation();
    expect(wrapper.find("[data-booking-validation-warning='true']").exists()).toBe(false);

    await wrapper.get("[data-booking-validation-tooltip-field='basePrice']").trigger("click");
    await settleValidation();

    expect(wrapper.get("[data-booking-validation-field='basePrice']").text()).toContain("Base price is required.");
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
    expect(HTMLElement.prototype.focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("shows inline step 1 warnings without scrolling on button click", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const engine = createEngine({ eventType: "1on1-call" });
    engine.validate = vi.fn(() => Promise.resolve({
      valid: false,
      errors: [
        { field: "basePrice", translationKey: "booking_validation_base_price_required" },
      ],
    }));

    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine,
        bookingType: "private",
      },
      global: mountOptions(),
    });

    await wrapper.vm.goToNext();
    await settleValidation();

    expect(engine.goToStep).not.toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalled();
    expect(wrapper.get("[data-booking-validation-field='basePrice']").text()).toContain("Base price is required.");
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it("reveals and scrolls step 1 errors received from a remount request", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const engine = createEngine({ eventType: "1on1-call" });
    const errors = [
      { field: "basePrice", translationKey: "booking_validation_base_price_required" },
    ];
    engine.validate = vi.fn(() => Promise.resolve({
      valid: false,
      errors,
    }));

    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine,
        bookingType: "private",
        validationRevealRequest: {
          nonce: 1,
          errors,
        },
      },
      global: mountOptions(),
    });

    await settleValidation();

    expect(wrapper.get("[data-booking-validation-field='basePrice']").text()).toContain("Base price is required.");
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  });

  it("enables step 1 Next after validation passes and advances", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const engine = createEngine({ eventType: "1on1-call" });
    let stepIsValid = false;
    engine.validate = vi.fn(() => Promise.resolve(stepIsValid
      ? {
        valid: true,
        errors: [],
      }
      : {
        valid: false,
        errors: [
          { field: "eventTitle", translationKey: "booking_validation_event_title_required" },
        ],
      }));

    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine,
        bookingType: "private",
      },
      global: mountOptions(),
    });

    await settleValidation();
    expect(wrapper.find("[data-booking-soft-disabled='true']").exists()).toBe(true);

    stepIsValid = true;
    await wrapper.vm.goToNext();
    await settleValidation();

    expect(wrapper.find("[data-booking-soft-disabled='true']").exists()).toBe(false);
    expect(engine.goToStep).toHaveBeenCalledWith(2, { throwOnBlocked: true });
  });

  it("keeps step 1 Next enabled when an older failed validation resolves after a newer passing validation", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const engine = createEngine({ eventType: "1on1-call" });
    engine.validate = vi.fn(() => Promise.resolve({ valid: true, errors: [] }));

    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine,
        bookingType: "private",
      },
      global: mountOptions(),
    });

    await settleValidation();
    expect(wrapper.find("[data-booking-soft-disabled='true']").exists()).toBe(false);

    const pending = [];
    engine.validate = vi.fn(() => new Promise((resolve) => pending.push(resolve)));

    const olderValidation = wrapper.vm.validateStep1();
    const newerValidation = wrapper.vm.validateStep1();

    pending[1]({ valid: true, errors: [] });
    await newerValidation;
    await settleValidation();

    pending[0]({
      valid: false,
      errors: [
        { field: "eventTitle", translationKey: "booking_validation_event_title_required" },
      ],
    });
    await olderValidation;
    await settleValidation();

    expect(wrapper.find("[data-booking-soft-disabled='true']").exists()).toBe(false);
  });

  it("emits preview from the mobile step 1 footer button", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          eventType: "1on1-call",
          weeklyAvailability: [{
            key: "sun",
            name: "Sun",
            unavailable: false,
            offHours: false,
            slots: [{ startTime: "09:00", endTime: "10:00", offHours: false }],
          }],
        }),
        bookingType: "private",
      },
      global: mountOptions(),
    });

    const previewButton = wrapper.findAll("button").find((button) => button.text() === "Preview");
    expect(previewButton).toBeTruthy();

    await previewButton.trigger("click");

    expect(wrapper.emitted("preview-schedule")).toHaveLength(1);
  });

  it("offers searchable five-minute availability time options", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          eventType: "1on1-call",
          weeklyAvailability: [{
            key: "sun",
            name: "Sun",
            unavailable: false,
            offHours: false,
            slots: [{ startTime: "09:00", endTime: "10:00", offHours: false }],
          }],
        }),
        bookingType: "private",
      },
      global: mountOptions(),
    });

    const timeDropdowns = wrapper
      .findAllComponents({ name: "CustomDropdown" })
      .filter((dropdown) => dropdown.props("options")?.some((option) => option.value === "09:05"));

    expect(timeDropdowns.length).toBeGreaterThan(0);

    const startOptions = timeDropdowns[0].props("options");
    const endOptions = timeDropdowns[1].props("options");
    expect(startOptions).toHaveLength(288);
    expect(startOptions[0]).toEqual({ value: "00:00", label: "12:00 AM" });
    expect(startOptions).toContainEqual({ value: "09:05", label: "9:05 AM" });
    expect(startOptions.at(-1)).toEqual({ value: "23:55", label: "11:55 PM" });
    expect(startOptions).not.toContainEqual({ value: "23:59", label: "11:59 PM" });
    expect(endOptions).toContainEqual({ value: "23:59", label: "11:59 PM" });

    timeDropdowns.forEach((dropdown) => {
      expect(dropdown.props("searchable")).toBe(true);
      expect(dropdown.props("searchPlaceholder")).toBe("Search...");
    });
  });

  it("treats 11:59 PM as an inclusive end-of-day end time for private slots", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const today = getTodayIsoDate();
    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          eventType: "1on1-call",
          repeatRule: "doesNotRepeat",
          oneTimeAvailability: [{
            id: "date-1",
            date: today,
            slots: [{ startTime: "23:55", endTime: "00:00" }],
          }],
          monthlyAvailability: [{ startTime: "23:55", endTime: "00:00" }],
          weeklyAvailability: [{
            key: "sun",
            name: "Sun",
            unavailable: false,
            offHours: false,
            slots: [{ startTime: "23:55", endTime: "00:00", offHours: false }],
          }],
        }),
        bookingType: "private",
      },
      global: mountOptions(),
    });

    expect(wrapper.vm.getOneTimeStartOptions(unrefPublic(wrapper.vm.oneTimeDates)[0], 0))
      .not.toContainEqual(expect.objectContaining({ value: "23:59" }));

    const customEndOptions = wrapper.vm.getOneTimeEndOptions(unrefPublic(wrapper.vm.oneTimeDates)[0], 0);
    const monthlyEndOptions = wrapper.vm.getMonthlyEndOptions(0);
    const weeklyEndOptions = wrapper.vm.getWeeklyEndOptions(0, 0);

    expect(customEndOptions.find((option) => option.value === "23:59")?.disabled).toBe(false);
    expect(monthlyEndOptions.find((option) => option.value === "23:59")?.disabled).toBe(false);
    expect(weeklyEndOptions.find((option) => option.value === "23:59")?.disabled).toBe(false);
    expect(customEndOptions.find((option) => option.value === "00:00")?.disabled).toBe(false);
  });

  it("keeps 11:59 PM literal for group slots shorter than five minutes", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const today = getTodayIsoDate();
    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          eventType: "group-event",
          repeatRule: "doesNotRepeat",
          oneTimeAvailability: [{
            id: "date-1",
            date: today,
            slots: [{ startTime: "23:55", endTime: "00:00" }],
          }],
        }),
        bookingType: "group",
      },
      global: mountOptions(),
    });

    const customEndOptions = wrapper.vm.getOneTimeEndOptions(unrefPublic(wrapper.vm.oneTimeDates)[0], 0);
    expect(customEndOptions.find((option) => option.value === "23:59")?.disabled).toBe(true);
  });

  it("adds unique custom dates and time slots", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const today = getTodayIsoDate();
    const engine = createEngine({
      eventType: "1on1-call",
      repeatRule: "doesNotRepeat",
      oneTimeAvailability: [{
        id: "date-1",
        date: today,
        slots: [{ startTime: "12:00", endTime: "15:00" }],
      }],
    });
    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine,
        bookingType: "private",
      },
      global: mountOptions(),
    });

    wrapper.vm.addOneTimeDate();
    await nextTick();

    const dates = unrefPublic(wrapper.vm.oneTimeDates).map((entry) => entry.date);
    expect(dates).toHaveLength(2);
    expect(new Set(dates).size).toBe(2);

    wrapper.vm.addOneTimeSlot(0);
    await nextTick();

    const slotKeys = unrefPublic(wrapper.vm.oneTimeDates)[0].slots
      .map((slot) => `${slot.startTime}|${slot.endTime}`);
    expect(slotKeys).toHaveLength(2);
    expect(new Set(slotKeys).size).toBe(2);
    expect(slotKeys).toContain("12:00|15:00");
    expect(slotKeys).toContain("15:00|18:00");

    wrapper.vm.addOneTimeSlot(0);
    await nextTick();

    const updatedSlotKeys = unrefPublic(wrapper.vm.oneTimeDates)[0].slots
      .map((slot) => `${slot.startTime}|${slot.endTime}`);
    expect(updatedSlotKeys).toHaveLength(3);
    expect(new Set(updatedSlotKeys).size).toBe(3);
    expect(updatedSlotKeys).toContain("18:00|21:00");

    const customTimeDropdowns = wrapper
      .findAllComponents({ name: "CustomDropdown" })
      .filter((dropdown) => typeof dropdown.props("optionFactory") === "function");
    const thirdSlotStartOptions = customTimeDropdowns[4].props("optionFactory")();
    expect(thirdSlotStartOptions.find((option) => option.value === "00:00")?.disabled).toBe(false);
    expect(thirdSlotStartOptions.find((option) => option.value === "15:00")?.disabled).toBe(true);
    expect(thirdSlotStartOptions.find((option) => option.value === "15:05")?.disabled).toBe(true);
    expect(thirdSlotStartOptions.find((option) => option.value === "18:00")?.disabled).toBe(false);
    expect(thirdSlotStartOptions.find((option) => option.value === "23:55")?.disabled).toBe(false);

    const thirdSlotEndOptions = customTimeDropdowns[5].props("optionFactory")();
    expect(thirdSlotEndOptions.find((option) => option.value === "12:00")?.disabled).toBe(false);
    expect(thirdSlotEndOptions.find((option) => option.value === "15:00")?.disabled).toBe(true);
    expect(thirdSlotEndOptions.find((option) => option.value === "21:00")?.disabled).toBe(false);

    const thirdSlot = unrefPublic(wrapper.vm.oneTimeDates)[0].slots[2];
    thirdSlot.startTime = "00:00";
    wrapper.vm.onOneTimeSlotChanged(0, 2, "start");
    await nextTick();

    expect(thirdSlot.startTime).toBe("00:00");
    expect(thirdSlot.endTime).toBe("12:00");

    thirdSlot.startTime = "23:55";
    thirdSlot.endTime = "21:00";
    wrapper.vm.onOneTimeSlotChanged(0, 2, "start");
    await nextTick();

    expect(thirdSlot.startTime).toBe("23:55");
    expect(thirdSlot.endTime).toBe("00:00");
  });

  it("marks custom one-time slots as off hours", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const today = getTodayIsoDate();
    const engine = createEngine({
      eventType: "1on1-call",
      repeatRule: "doesNotRepeat",
      oneTimeAvailability: [{
        id: "date-1",
        date: today,
        slots: [{ startTime: "12:00", endTime: "15:00", offHours: false }],
      }],
    });
    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine,
        bookingType: "private",
      },
      global: mountOptions(),
    });

    wrapper.vm.toggleOneTimeSlotOffHours(0, 0);
    await nextTick();

    expect(unrefPublic(wrapper.vm.oneTimeDates)[0].slots[0].offHours).toBe(true);
    expect(wrapper.vm.formData.oneTimeAvailability[0].slots[0].offHours).toBe(true);
    expect(engine.state.oneTimeAvailability[0].slots[0].offHours).toBe(true);

    wrapper.vm.toggleOneTimeSlotOffHours(0, 0);
    await nextTick();

    expect(unrefPublic(wrapper.vm.oneTimeDates)[0].slots[0].offHours).toBe(false);
    expect(wrapper.vm.formData.oneTimeAvailability[0].slots[0].offHours).toBe(false);
  });

  it("disables early-morning custom times covered by an overnight slot", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const today = getTodayIsoDate();
    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          eventType: "1on1-call",
          repeatRule: "doesNotRepeat",
          oneTimeAvailability: [{
            id: "date-1",
            date: today,
            slots: [
              { startTime: "22:00", endTime: "03:00" },
              { startTime: "03:00", endTime: "06:00" },
            ],
          }],
        }),
        bookingType: "private",
      },
      global: mountOptions(),
    });

    const customTimeDropdowns = wrapper
      .findAllComponents({ name: "CustomDropdown" })
      .filter((dropdown) => typeof dropdown.props("optionFactory") === "function");
    const secondSlotStartOptions = customTimeDropdowns[2].props("optionFactory")();

    expect(secondSlotStartOptions.find((option) => option.value === "00:00")?.disabled).toBe(true);
    expect(secondSlotStartOptions.find((option) => option.value === "02:55")?.disabled).toBe(true);
    expect(secondSlotStartOptions.find((option) => option.value === "03:00")?.disabled).toBe(false);
    expect(secondSlotStartOptions.find((option) => option.value === "21:55")?.disabled).toBe(false);
    expect(secondSlotStartOptions.find((option) => option.value === "22:00")?.disabled).toBe(true);
    expect(secondSlotStartOptions.find((option) => option.value === "23:55")?.disabled).toBe(true);
  });

  it("disables overlapping monthly repeat times and adds the next free slot", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          eventType: "1on1-call",
          repeatRule: "monthly",
          dateFrom: getTodayIsoDate(),
          monthlyAvailability: [
            { startTime: "22:00", endTime: "03:00" },
            { startTime: "03:00", endTime: "06:00" },
          ],
        }),
        bookingType: "private",
      },
      global: mountOptions(),
    });

    const monthlyTimeDropdowns = wrapper
      .findAllComponents({ name: "CustomDropdown" })
      .filter((dropdown) => typeof dropdown.props("optionFactory") === "function");
    const secondSlotStartOptions = monthlyTimeDropdowns[2].props("optionFactory")();

    expect(secondSlotStartOptions.find((option) => option.value === "00:00")?.disabled).toBe(true);
    expect(secondSlotStartOptions.find((option) => option.value === "02:55")?.disabled).toBe(true);
    expect(secondSlotStartOptions.find((option) => option.value === "03:00")?.disabled).toBe(false);
    expect(secondSlotStartOptions.find((option) => option.value === "21:55")?.disabled).toBe(false);
    expect(secondSlotStartOptions.find((option) => option.value === "22:00")?.disabled).toBe(true);
    expect(secondSlotStartOptions.find((option) => option.value === "23:55")?.disabled).toBe(true);

    wrapper.vm.addMonthlySlot();
    await nextTick();

    const slotKeys = unrefPublic(wrapper.vm.monthlySlots)
      .map((slot) => `${slot.startTime}|${slot.endTime}`);
    expect(slotKeys).toContain("06:00|09:00");
  });

  it("disables overlapping weekly repeat times across same-day and next-day slots", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          eventType: "1on1-call",
          repeatRule: "weekly",
          weeklyAvailability: [
            {
              key: "sun",
              name: "Sun",
              unavailable: false,
              offHours: false,
              slots: [
                { startTime: "22:00", endTime: "03:00", offHours: false },
                { startTime: "03:00", endTime: "06:00", offHours: false },
              ],
            },
            {
              key: "mon",
              name: "Mon",
              unavailable: false,
              offHours: false,
              slots: [{ startTime: "03:00", endTime: "06:00", offHours: false }],
            },
          ],
        }),
        bookingType: "private",
      },
      global: mountOptions(),
    });

    const weeklyTimeDropdowns = wrapper
      .findAllComponents({ name: "CustomDropdown" })
      .filter((dropdown) => typeof dropdown.props("optionFactory") === "function");
    const sundaySecondSlotStartOptions = weeklyTimeDropdowns[2].props("optionFactory")();
    const mondaySlotStartOptions = weeklyTimeDropdowns[4].props("optionFactory")();

    expect(sundaySecondSlotStartOptions.find((option) => option.value === "00:00")?.disabled).toBe(true);
    expect(sundaySecondSlotStartOptions.find((option) => option.value === "02:55")?.disabled).toBe(true);
    expect(sundaySecondSlotStartOptions.find((option) => option.value === "03:00")?.disabled).toBe(false);
    expect(sundaySecondSlotStartOptions.find((option) => option.value === "21:55")?.disabled).toBe(false);
    expect(sundaySecondSlotStartOptions.find((option) => option.value === "22:00")?.disabled).toBe(true);
    expect(sundaySecondSlotStartOptions.find((option) => option.value === "23:55")?.disabled).toBe(true);
    expect(mondaySlotStartOptions.find((option) => option.value === "00:00")?.disabled).toBe(true);
    expect(mondaySlotStartOptions.find((option) => option.value === "02:55")?.disabled).toBe(true);
    expect(mondaySlotStartOptions.find((option) => option.value === "03:00")?.disabled).toBe(false);

    wrapper.vm.addWeeklySlot(0);
    await nextTick();

    const sundaySlotKeys = unrefPublic(wrapper.vm.weekDays)[0].slots
      .map((slot) => `${slot.startTime}|${slot.endTime}`);
    expect(sundaySlotKeys).toContain("06:00|09:00");
  });

  it("does not cap the start date with a stale past end date", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-09T12:00:00"));

    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );

    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          repeatRule: "weekly",
          dateTo: "2026-05-01",
        }),
        bookingType: "private",
      },
      global: mountOptions(),
    });

    const startDateInput = findStartDateInput(wrapper);

    expect(startDateInput.attributes("min")).toBe("2026-05-09");
    expect(startDateInput.attributes("max")).toBeUndefined();
  });

  it("caps the start date when the end date is today or later", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-09T12:00:00"));

    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );

    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          repeatRule: "weekly",
          dateTo: "2026-05-21",
        }),
        bookingType: "private",
      },
      global: mountOptions(),
    });

    const startDateInput = findStartDateInput(wrapper);

    expect(startDateInput.attributes("min")).toBe("2026-05-09");
    expect(startDateInput.attributes("max")).toBe("2026-05-21");
  });

  it("does not cap a one-time date with a stale past end date", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-09T12:00:00"));

    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );

    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          repeatRule: "doesNotRepeat",
          dateTo: "2026-05-01",
          oneTimeAvailability: [{
            id: "date_existing",
            date: "2026-05-09",
            slots: [{ startTime: "12:00", endTime: "15:00" }],
          }],
        }),
        bookingType: "private",
      },
      global: mountOptions(),
    });

    const oneTimeDateInput = findDateInputs(wrapper)[0];

    expect(oneTimeDateInput.attributes("min")).toBe("2026-05-09");
    expect(oneTimeDateInput.attributes("max")).toBeUndefined();
  });

  it("keeps added one-time date inputs uncapped", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-09T12:00:00"));

    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );

    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          repeatRule: "doesNotRepeat",
          oneTimeAvailability: [{
            id: "date_existing",
            date: "2026-05-10",
            slots: [{ startTime: "12:00", endTime: "15:00" }],
          }],
        }),
        bookingType: "private",
      },
      global: mountOptions(),
    });

    wrapper.vm.addOneTimeDate();
    await nextTick();

    const oneTimeDateInputs = findDateInputs(wrapper);

    expect(oneTimeDateInputs).toHaveLength(2);
    oneTimeDateInputs.forEach((input) => {
      expect(input.attributes("min")).toBe("2026-05-09");
      expect(input.attributes("max")).toBeUndefined();
    });
    expect(wrapper.vm.formData.dateFrom).toBe("2026-05-09");
    expect(wrapper.vm.formData.dateTo).toBe("2026-05-10");
  });

  it("clears custom date bounds when switching the repeat rule back to weekly", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-09T12:00:00"));

    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );

    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          repeatRule: "doesNotRepeat",
          oneTimeAvailability: [{
            id: "date_existing",
            date: "2026-05-10",
            slots: [{ startTime: "12:00", endTime: "15:00" }],
          }],
        }),
        bookingType: "private",
      },
      global: mountOptions(),
    });

    wrapper.vm.formData.repeatRule = "weekly";
    await nextTick();

    const startDateInput = findStartDateInput(wrapper);

    expect(wrapper.vm.formData.dateFrom).toBe("");
    expect(wrapper.vm.formData.dateTo).toBe("");
    expect(startDateInput.attributes("min")).toBe("2026-05-09");
    expect(startDateInput.attributes("max")).toBeUndefined();
  });

  it("resets stale custom date bounds when switching the repeat rule to monthly", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-09T12:00:00"));

    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );

    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          repeatRule: "doesNotRepeat",
          oneTimeAvailability: [{
            id: "date_existing",
            date: "2026-05-01",
            slots: [{ startTime: "12:00", endTime: "15:00" }],
          }],
        }),
        bookingType: "private",
      },
      global: mountOptions(),
    });

    wrapper.vm.formData.repeatRule = "monthly";
    await nextTick();

    const startDateInput = findStartDateInput(wrapper);

    expect(wrapper.vm.formData.dateFrom).toBe("2026-05-09");
    expect(wrapper.vm.formData.dateTo).toBe("");
    expect(startDateInput.attributes("min")).toBe("2026-05-09");
    expect(startDateInput.attributes("max")).toBeUndefined();
  });

  it("shows private fixed discount helper amounts", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );

    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          eventType: "1on1-call",
          basePrice: "1",
          enableLongerDiscount: true,
          longerSessionDiscountTokens: "1",
          enableFirstTimeDiscount: true,
          firstTimeDiscountTokens: "1",
        }),
        bookingType: "private",
      },
      global: mountOptions(),
    });

    expect(wrapper.text().match(/1 tokens off/g)).toHaveLength(2);

    wrapper.vm.formData.longerSessionDiscountTokens = "12";
    wrapper.vm.formData.firstTimeDiscountTokens = "8";
    await nextTick();

    expect(wrapper.text()).toContain("12 tokens off");
    expect(wrapper.text()).toContain("8 tokens off");
  });

  it("renders translated overrides in step 1", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );

    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          weeklyAvailability: [{
            key: "sun",
            name: "Sun",
            unavailable: false,
            offHours: false,
            slots: [{ startTime: "09:00", endTime: "10:00", offHours: false }],
          }],
        }),
        embedded: true,
      },
      global: mountOptions({
        booking_event_image: "Imagen del evento",
        booking_upload_click: "Subir archivo",
        booking_session_duration: "Duracion de sesion",
        booking_duration: "Duracion",
        booking_mark_off_hours: "Marcar fuera de horario",
      }),
      attachTo: document.body,
    });

    expect(wrapper.text()).toContain("Imagen del evento");
    expect(wrapper.text()).toContain("Subir archivo");
    expect(wrapper.text()).toContain("Duracion de sesion");
    expect(wrapper.text()).toContain("Duracion");
    expect(document.body.textContent).toContain("Marcar fuera de horario");
  });

  it("shows the description editor in group step 1", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );

    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({}),
        embedded: true,
        bookingType: "group",
      },
      global: mountOptions(),
    });

    expect(wrapper.find("quill-editor-stub").exists()).toBe(true);
  });

  it("shows the description editor in private step 1", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );

    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({}),
        embedded: true,
        bookingType: "private",
      },
      global: mountOptions(),
    });

    expect(wrapper.find("quill-editor-stub").exists()).toBe(true);
  });

  it("hides session duration in group step 1 and keeps it for private step 1", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );

    const groupWrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({ eventType: "group-event" }),
        embedded: true,
        bookingType: "group",
      },
      global: mountOptions(),
    });

    const privateWrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({ eventType: "1on1-call" }),
        embedded: true,
        bookingType: "private",
      },
      global: mountOptions(),
    });

    expect(groupWrapper.text()).not.toContain("Session Duration");
    expect(privateWrapper.text()).toContain("Session Duration");
  });

  it("hides call settings in group step 1 and keeps them for private step 1", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );

    const groupWrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({ eventType: "group-event" }),
        embedded: true,
        bookingType: "group",
      },
      global: mountOptions(),
    });

    const privateWrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({ eventType: "1on1-call" }),
        embedded: true,
        bookingType: "private",
      },
      global: mountOptions(),
    });

    expect(groupWrapper.text()).not.toContain("Call Settings");
    expect(privateWrapper.text()).toContain("Call Settings");
  });

  it("orders calendar availability before pricing only for group step 1", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );

    const privateHost = document.createElement("div");
    const groupHost = document.createElement("div");
    document.body.appendChild(privateHost);
    document.body.appendChild(groupHost);

    const privateWrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({ eventType: "1on1-call" }),
        embedded: true,
        bookingType: "private",
      },
      global: mountOptions(),
      attachTo: privateHost,
    });

    const groupWrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({ eventType: "group-event" }),
        embedded: true,
        bookingType: "group",
      },
      global: mountOptions(),
      attachTo: groupHost,
    });

    await nextTick();
    await nextTick();

    const privateText = privateHost.textContent || privateWrapper.text();
    const groupText = groupHost.textContent || groupWrapper.text();

    expect(privateText.indexOf("Pricing Settings")).toBeLessThan(privateText.indexOf("Calendar Availability"));
    expect(groupText.indexOf("Calendar Availability")).toBeLessThan(groupText.indexOf("Pricing Settings"));
  });

  it("uses pricing-specific group cancellation labels", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );

    const fixedPriceWrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          eventType: "group-event",
          priceSetting: "fixedPricePerUser",
          enableLongerDiscount: true,
          enableCancellationFee: true,
          allowAdvanceCancellation: true,
        }),
        embedded: true,
        bookingType: "group",
      },
      global: mountOptions(),
    });

    const eventGoalWrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          eventType: "group-event",
          priceSetting: "eventGoal",
        }),
        embedded: true,
        bookingType: "group",
      },
      global: mountOptions(),
    });

    expect(fixedPriceWrapper.text()).toContain("Cancellation Fee");
    expect(fixedPriceWrapper.text()).not.toContain("User can refund before event start");
    expect(eventGoalWrapper.text()).toContain("User can refund before event start");
  });

  it("shows maximum participants in booking settings for group pricing modes", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );

    const eventGoalWrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          eventType: "group-event",
          priceSetting: "eventGoal",
        }),
        embedded: true,
        bookingType: "group",
      },
      global: mountOptions(),
    });

    const fixedPriceWrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          eventType: "group-event",
          priceSetting: "fixedPricePerUser",
          enableLongerDiscount: true,
          enableCancellationFee: true,
          allowAdvanceCancellation: true,
        }),
        embedded: true,
        bookingType: "group",
      },
      global: mountOptions(),
    });

    const privateWrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          eventType: "1on1-call",
          priceSetting: "fixedPricePerUser",
        }),
        embedded: true,
        bookingType: "private",
      },
      global: mountOptions(),
    });

    const eventGoalPricing = findSectionByTitle(eventGoalWrapper, "Pricing Settings");
    const eventGoalBooking = findSectionByTitle(eventGoalWrapper, "Booking Settings");
    const fixedPricePricing = findSectionByTitle(fixedPriceWrapper, "Pricing Settings");
    const fixedPriceBooking = findSectionByTitle(fixedPriceWrapper, "Booking Settings");

    expect(eventGoalWrapper.text()).toContain("Maximum participants");
    expect(eventGoalWrapper.text()).not.toContain("Set maximum bookings per day");
    expect(eventGoalWrapper.text()).not.toContain("Allow instant booking");
    expect(eventGoalPricing?.text()).toContain("Event goals");
    expect(eventGoalPricing?.text()).not.toContain("Maximum participants");
    expect(eventGoalBooking?.text()).toContain("Maximum participants");

    expect(fixedPriceWrapper.text()).toContain("Maximum participants");
    expect(fixedPriceWrapper.text()).not.toContain("Set maximum bookings per day");
    expect(fixedPriceWrapper.text()).not.toContain("Allow instant booking");
    expect(fixedPricePricing?.text()).toContain("Event price");
    expect(fixedPricePricing?.text()).not.toContain("Maximum participants");
    expect(fixedPriceBooking?.text()).toContain("Maximum participants");

    expect(privateWrapper.text()).not.toContain("Maximum participants");
    expect(privateWrapper.text()).toContain("Set maximum bookings per day");
    expect(privateWrapper.text()).toContain("Allow instant booking");
  });

  it("syncs group fixed-price pricing controls into engine state", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const engine = createEngine({
      eventType: "group-event",
      eventTitle: "Group fixed",
      priceSetting: "fixedPricePerUser",
    });
    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: { engine, bookingType: "group" },
      global: mountOptions(),
    });

    await nextTick();
    engine.setState.mockClear();

    wrapper.vm.formData.priceSetting = "fixedPricePerUser";
    wrapper.vm.formData.basePrice = "100";
    wrapper.vm.formData.enableLongerDiscount = true;
    wrapper.vm.formData.discountEventsCount = "3";
    wrapper.vm.formData.discountPercentage = "20";
    wrapper.vm.formData.enableCancellationFee = true;
    wrapper.vm.formData.cancellationFee = "15";
    wrapper.vm.formData.allowAdvanceCancellation = true;
    wrapper.vm.formData.advanceVoid = "1";
    wrapper.vm.formData.advanceCancelWindowUnit = "day";
    wrapper.vm.formData.addOffHourSurcharge = true;
    wrapper.vm.formData.offHourSurcharge = "10";
    wrapper.vm.formData.enableMaxAttendees = true;
    wrapper.vm.formData.maxAttendees = "8";
    await nextTick();

    expect(engine.state.priceSetting).toBe("fixedPricePerUser");
    expect(engine.state.basePrice).toBe("100");
    expect(engine.state.enableLongerDiscount).toBe(true);
    expect(engine.state.discountEventsCount).toBe("3");
    expect(engine.state.discountPercentage).toBe("20");
    expect(engine.state.enableCancellationFee).toBe(true);
    expect(engine.state.cancellationFee).toBe("15");
    expect(engine.state.allowAdvanceCancellation).toBe(true);
    expect(engine.state.advanceVoid).toBe("1");
    expect(engine.state.advanceCancelWindowUnit).toBe("day");
    expect(engine.state.addOffHourSurcharge).toBe(true);
    expect(engine.state.offHourSurcharge).toBe("10");
    expect(engine.state.enableMaxAttendees).toBe(true);
    expect(engine.state.maxAttendees).toBe("8");
  });

  it("ceils the off-hour surcharge token preview", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const engine = createEngine({
      eventType: "1on1-call",
      basePrice: "15",
      addOffHourSurcharge: true,
      offHourSurcharge: "30",
    });
    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: { engine, bookingType: "private" },
      global: mountOptions(),
    });

    await nextTick();

    expect(wrapper.text()).toContain("5 tokens/session");
    expect(wrapper.text()).not.toContain("4.5 tokens/session");
  });

  it("syncs group event-goal pricing controls into engine state", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const engine = createEngine({
      eventType: "group-event",
      eventTitle: "Group goal",
      priceSetting: "eventGoal",
    });
    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: { engine, bookingType: "group" },
      global: mountOptions(),
    });

    await nextTick();
    engine.setState.mockClear();

    wrapper.vm.formData.priceSetting = "eventGoal";
    wrapper.vm.formData.eventGoalTokens = "8000";
    wrapper.vm.formData.enableMinContributionPerUser = true;
    wrapper.vm.formData.minContributionPerUser = "500";
    wrapper.vm.formData.goalNotMet = "proceedWithoutGoalMet";
    wrapper.vm.formData.enableCancellationFee = true;
    wrapper.vm.formData.cancellationFee = "15";
    wrapper.vm.formData.allowAdvanceCancellation = true;
    wrapper.vm.formData.advanceVoid = "2";
    wrapper.vm.formData.advanceCancelWindowUnit = "hour";
    wrapper.vm.formData.addOffHourSurcharge = true;
    wrapper.vm.formData.offHourSurcharge = "12";
    wrapper.vm.formData.enableMaxAttendees = true;
    wrapper.vm.formData.maxAttendees = "12";
    await nextTick();

    expect(engine.state.priceSetting).toBe("eventGoal");
    expect(engine.state.eventGoalTokens).toBe("8000");
    expect(engine.state.enableMinContributionPerUser).toBe(true);
    expect(engine.state.minContributionPerUser).toBe("500");
    expect(engine.state.goalNotMet).toBe("proceedWithoutGoalMet");
    expect(engine.state.enableCancellationFee).toBe(true);
    expect(engine.state.cancellationFee).toBe("15");
    expect(engine.state.allowAdvanceCancellation).toBe(true);
    expect(engine.state.advanceVoid).toBe("2");
    expect(engine.state.advanceCancelWindowUnit).toBe("hour");
    expect(engine.state.addOffHourSurcharge).toBe(true);
    expect(engine.state.offHourSurcharge).toBe("12");
    expect(engine.state.enableMaxAttendees).toBe(true);
    expect(engine.state.maxAttendees).toBe("12");
  });

  it("hides waitlist controls in private and group step 1", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );

    const privateWrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({ eventType: "1on1-call" }),
        embedded: true,
        bookingType: "private",
      },
      global: mountOptions(),
    });

    const groupWrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          eventType: "group-event",
          priceSetting: "fixedPricePerUser",
        }),
        embedded: true,
        bookingType: "group",
      },
      global: mountOptions(),
    });

    expect(privateWrapper.text()).not.toContain("If booking slots are full, allow fans to join waitlist");
    expect(privateWrapper.text()).not.toContain("waitlist spots");
    expect(groupWrapper.text()).not.toContain("If booking slots are full, allow fans to join waitlist");
    expect(groupWrapper.text()).not.toContain("If event slots are full, allow fans to join waitlist");
    expect(groupWrapper.text()).not.toContain("waitlist spots");
  });

  it("renders translated overrides in step 2", async () => {
    const { default: OneOnOneBookinStep2 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep2.vue"
    );

    const wrapper = shallowMount(OneOnOneBookinStep2, {
      props: {
        engine: createEngine({
          creatorId: 566,
          spendingRequirement: "mustOwnProducts",
          addOns: [{ title: "VIP setup", description: "", priceTokens: "25" }],
          requiredProducts: [{
            id: 9,
            type: "product",
            title: "Creator product",
            buyPrice: 12,
          }],
        }),
        embedded: true,
      },
      global: mountOptions({
        booking_spending_requirement: "Requisito de gasto",
        booking_who_can_book_call: "Quien puede reservar una llamada?",
        booking_add_on_service_index: "Servicio adicional {index}",
        booking_count: "Cuenta",
        booking_buy: "Comprar",
        booking_x_repost_settings: "Configurar X",
        booking_x_post_live: "Publicar agenda en X",
      }),
    });

    expect(wrapper.text()).toContain("Requisito de gasto");
    expect(wrapper.text()).toContain("Quien puede reservar una llamada?");
    expect(wrapper.text()).toContain("Servicio adicional 1");
    expect(wrapper.text()).toContain("Cuenta");
    expect(wrapper.text()).toContain("Comprar");
    expect(wrapper.text()).toContain("Configurar X");
    expect(wrapper.text()).toContain("Publicar agenda en X");
  });

  it("disables group event date and time controls when schedule editing is locked", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );

    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          eventType: "group-event",
          priceSetting: "fixedPricePerUser",
          repeatRule: "weekly",
        }),
        bookingType: "group",
        scheduleLocked: true,
      },
      global: mountOptions({
        booking_schedule_locked_tooltip: "No se puede editar fecha y hora con reservas activas.",
        booking_remove_availability: "Tooltip quitar disponibilidad",
        booking_add_period_day: "Tooltip agregar periodo",
        booking_mark_off_hours: "Tooltip marcar fuera de horario",
        booking_add_availability: "Tooltip agregar disponibilidad",
      }),
    });

    const dateTimeSection = wrapper.get("[data-test='event-date-time-section']");
    const lockTooltip = wrapper.get("[data-test='event-date-time-lock-tooltip']");

    expect(dateTimeSection.attributes("aria-disabled")).toBe("true");
    expect(dateTimeSection.attributes("title")).toBeUndefined();
    expect(dateTimeSection.classes()).toContain("group/schedule-lock");
    expect(dateTimeSection.classes()).not.toContain("group");
    expect(lockTooltip.classes()).toContain("group-hover/schedule-lock:opacity-100");
    expect(lockTooltip.classes()).not.toContain("group-hover:opacity-100");
    expect(lockTooltip.text()).toBe(
      "No se puede editar fecha y hora con reservas activas.",
    );
    expect(dateTimeSection.text()).not.toContain("Tooltip quitar disponibilidad");
    expect(dateTimeSection.text()).not.toContain("Tooltip agregar periodo");
    expect(dateTimeSection.text()).not.toContain("Tooltip marcar fuera de horario");
    expect(dateTimeSection.text()).not.toContain("Tooltip agregar disponibilidad");
  });

  it("keeps active date and time section hover scoped away from child tooltip groups", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );

    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          eventType: "1on1-call",
          repeatRule: "weekly",
        }),
        bookingType: "private",
        scheduleLocked: false,
      },
      global: mountOptions(),
    });

    const dateTimeSection = wrapper.get("[data-test='event-date-time-section']");

    expect(dateTimeSection.attributes("aria-disabled")).toBe("false");
    expect(dateTimeSection.classes()).toContain("group/schedule-lock");
    expect(dateTimeSection.classes()).not.toContain("group");
    expect(wrapper.find("[data-test='event-date-time-lock-tooltip']").exists()).toBe(false);
  });

  it("disables group pricing controls when pricing editing is locked", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );

    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          eventType: "group-event",
          priceSetting: "fixedPricePerUser",
          enableLongerDiscount: true,
          enableCancellationFee: true,
          allowAdvanceCancellation: true,
        }),
        bookingType: "group",
        pricingLocked: true,
      },
      global: mountOptions({
        booking_pricing_locked_tooltip: "No se puede editar precios con reservas activas.",
        booking_cancellation_fee_tooltip: "Tooltip cargo cancelacion",
      }),
    });

    const pricingSection = wrapper.get("[data-test='group-pricing-section']");
    const lockTooltip = wrapper.get("[data-test='group-pricing-lock-tooltip']");

    expect(pricingSection.attributes("aria-disabled")).toBe("true");
    expect(pricingSection.attributes("title")).toBeUndefined();
    expect(pricingSection.classes()).toContain("group/pricing-lock");
    expect(pricingSection.classes()).not.toContain("group");
    expect(lockTooltip.classes()).toContain("group-hover/pricing-lock:opacity-100");
    expect(lockTooltip.text()).toBe("No se puede editar precios con reservas activas.");
    expect(pricingSection.text()).not.toContain("Tooltip cargo cancelacion");
    expect(pricingSection.find("input[disabled]").exists()).toBe(true);
    expect(pricingSection.find("[data-disabled='true']").exists()).toBe(true);
  });

  it("keeps group pricing controls interactive when pricing editing is unlocked", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );

    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          eventType: "group-event",
          priceSetting: "fixedPricePerUser",
        }),
        bookingType: "group",
        pricingLocked: false,
      },
      global: mountOptions({
        booking_cancellation_fee_tooltip: "Tooltip cargo cancelacion",
      }),
    });

    const pricingSection = wrapper.get("[data-test='group-pricing-section']");

    expect(pricingSection.attributes("aria-disabled")).toBe("false");
    expect(wrapper.find("[data-test='group-pricing-lock-tooltip']").exists()).toBe(false);
    expect(pricingSection.text()).toContain("Tooltip cargo cancelacion");
    expect(pricingSection.findAll("[data-disabled]")[0]?.attributes("data-disabled")).toBe("false");
  });

  it("shows additional request only for private step 2", async () => {
    const { default: OneOnOneBookinStep2 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep2.vue"
    );

    const privateWrapper = shallowMount(OneOnOneBookinStep2, {
      props: {
        engine: createEngine({
          eventType: "1on1-call",
          addOns: [{ title: "VIP setup", description: "", priceTokens: "25" }],
        }),
        embedded: true,
        bookingType: "private",
      },
      global: mountOptions(),
    });

    const groupWrapper = shallowMount(OneOnOneBookinStep2, {
      props: {
        engine: createEngine({
          eventType: "group-event",
          addOns: [{ title: "VIP setup", description: "", priceTokens: "25" }],
        }),
        embedded: true,
        bookingType: "group",
      },
      global: mountOptions(),
    });

    expect(privateWrapper.text()).toContain("Additional Request");
    expect(privateWrapper.text()).toContain("Allow fan record the session");
    expect(privateWrapper.text()).toContain("Allow personal request");
    expect(privateWrapper.text()).toContain("Add-on service 1");

    expect(groupWrapper.text()).not.toContain("Additional Request");
    expect(groupWrapper.text()).not.toContain("Allow fan record the session");
    expect(groupWrapper.text()).not.toContain("Allow personal request");
    expect(groupWrapper.text()).not.toContain("Add-on service 1");
  });

  it("emits preview from the mobile step 2 footer button", async () => {
    const { default: OneOnOneBookinStep2 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep2.vue"
    );
    const wrapper = shallowMount(OneOnOneBookinStep2, {
      props: {
        engine: createEngine({ eventType: "1on1-call" }),
        bookingType: "private",
      },
      global: mountOptions(),
    });

    const previewButton = wrapper.findAll("button").find((button) => button.text() === "Preview");
    expect(previewButton).toBeTruthy();

    await previewButton.trigger("click");

    expect(wrapper.emitted("preview-schedule")).toHaveLength(1);
  });

  it("shows conditional submit validation as one combined field list", async () => {
    const { default: OneOnOneBookinStep2 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep2.vue"
    );
    const engine = createEngine({ eventType: "1on1-call" });
    engine.validate = vi.fn((step) => Promise.resolve(step === 1
      ? {
        valid: false,
        errors: [
          { field: "extendSessionMax", translationKey: "booking_validation_extend_session_max_min", conditional: true },
          { field: "bookingBufferMinutes", translationKey: "booking_validation_buffer_time_min", conditional: false },
        ],
      }
      : {
        valid: false,
        errors: [
          { field: "recordingPrice", translationKey: "booking_validation_recording_price_min", conditional: true },
        ],
      }));

    const wrapper = shallowMount(OneOnOneBookinStep2, {
      props: {
        engine,
        bookingType: "private",
      },
      global: mountOptions(),
    });

    await wrapper.vm.createEvent();
    await settleValidation();

    expect(engine.callFlow).not.toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalled();
    expect(wrapper.get("[data-booking-validation-tooltip-field='extendSessionMax']").text()).toContain("Extension session maximum");
    expect(wrapper.get("[data-booking-validation-tooltip-field='bufferTime']").text()).toContain("Buffer time must be at least 5 minutes.");
    expect(wrapper.get("[data-booking-validation-tooltip-field='recordingPrice']").text()).toContain("Recording price");
  });

  it("shows inline step 2 warnings and tooltip without scrolling for invalid create", async () => {
    const { default: OneOnOneBookinStep2 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep2.vue"
    );
    const engine = createEngine({
      eventType: "1on1-call",
      allowRecording: true,
    });
    engine.validate = vi.fn((step) => Promise.resolve(step === 1
      ? {
        valid: true,
        errors: [],
      }
      : {
        valid: false,
        errors: [
          { field: "recordingPrice", translationKey: "booking_validation_recording_price_min", conditional: true },
        ],
      }));

    const wrapper = shallowMount(OneOnOneBookinStep2, {
      props: {
        engine,
        bookingType: "private",
      },
      global: mountOptions(),
    });

    await settleValidation();
    expect(wrapper.get("[data-booking-soft-disabled='true']").text()).toContain("Recording price");

    await wrapper.vm.createEvent();
    await settleValidation();

    expect(engine.callFlow).not.toHaveBeenCalled();
    expect(wrapper.get("[data-booking-validation-field='recordingPrice']").text()).toContain("Recording price must be 0 or higher.");
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalled();
  });

  it("keeps step 2 submit enabled when an older failed validation resolves after a newer passing validation", async () => {
    const { default: OneOnOneBookinStep2 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep2.vue"
    );
    const engine = createEngine({ eventType: "1on1-call" });
    engine.validate = vi.fn(() => Promise.resolve({ valid: true, errors: [] }));

    const wrapper = shallowMount(OneOnOneBookinStep2, {
      props: {
        engine,
        bookingType: "private",
      },
      global: mountOptions(),
    });

    await settleValidation();
    expect(wrapper.find("[data-booking-soft-disabled='true']").exists()).toBe(false);

    const pending = [];
    engine.validate = vi.fn(() => new Promise((resolve) => pending.push(resolve)));

    const olderValidation = wrapper.vm.validateCreateEventForm();
    const newerValidation = wrapper.vm.validateCreateEventForm();

    pending[2]({ valid: true, errors: [] });
    pending[3]({ valid: true, errors: [] });
    await newerValidation;
    await settleValidation();

    pending[0]({
      valid: false,
      errors: [
        { field: "eventTitle", translationKey: "booking_validation_event_title_required" },
      ],
    });
    pending[1]({ valid: true, errors: [] });
    await olderValidation;
    await settleValidation();

    expect(wrapper.find("[data-booking-soft-disabled='true']").exists()).toBe(false);
  });

  it("clicking a step 2 tooltip row reveals, scrolls, and focuses that field", async () => {
    const { default: OneOnOneBookinStep2 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep2.vue"
    );
    const engine = createEngine({
      eventType: "1on1-call",
      allowRecording: true,
    });
    engine.validate = vi.fn((step) => Promise.resolve(step === 1
      ? {
        valid: true,
        errors: [],
      }
      : {
        valid: false,
        errors: [
          { field: "recordingPrice", translationKey: "booking_validation_recording_price_min", conditional: true },
        ],
      }));

    const wrapper = shallowMount(OneOnOneBookinStep2, {
      props: {
        engine,
        bookingType: "private",
      },
      global: mountOptions(),
    });

    await settleValidation();
    await wrapper.get("[data-booking-validation-tooltip-field='recordingPrice']").trigger("click");
    await settleValidation();

    expect(wrapper.get("[data-booking-validation-field='recordingPrice']").text()).toContain("Recording price must be 0 or higher.");
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
    expect(HTMLElement.prototype.focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("clicking a step 1 tooltip row from step 2 requests the matching step 1 field", async () => {
    const { default: OneOnOneBookinStep2 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep2.vue"
    );
    const step1Errors = [
      { field: "basePrice", translationKey: "booking_validation_base_price_required" },
    ];
    const engine = createEngine({ eventType: "1on1-call" });
    engine.validate = vi.fn((step) => Promise.resolve(step === 1
      ? {
        valid: false,
        errors: step1Errors,
      }
      : {
        valid: true,
        errors: [],
      }));

    const wrapper = shallowMount(OneOnOneBookinStep2, {
      props: {
        engine,
        bookingType: "private",
      },
      global: mountOptions(),
    });

    await settleValidation();
    await wrapper.get("[data-booking-validation-tooltip-field='basePrice']").trigger("click");

    expect(wrapper.emitted("reveal-step1-validation")?.[0]?.[0]).toEqual({
      errors: step1Errors,
      field: "basePrice",
      scroll: true,
    });
  });

  it("emits step 1 validation reveal when create is blocked only by step 1", async () => {
    const { default: OneOnOneBookinStep2 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep2.vue"
    );
    const step1Errors = [
      { field: "basePrice", translationKey: "booking_validation_base_price_required" },
    ];
    const engine = createEngine({ eventType: "1on1-call" });
    engine.validate = vi.fn((step) => Promise.resolve(step === 1
      ? {
        valid: false,
        errors: step1Errors,
      }
      : {
        valid: true,
        errors: [],
      }));

    const wrapper = shallowMount(OneOnOneBookinStep2, {
      props: {
        engine,
        bookingType: "private",
      },
      global: mountOptions(),
    });

    await wrapper.vm.createEvent();
    await settleValidation();

    expect(wrapper.emitted("reveal-step1-validation")?.[0]?.[0]).toEqual({
      errors: step1Errors,
      field: "",
      scroll: false,
    });
    expect(wrapper.find("[data-booking-validation-warning='true']").exists()).toBe(false);
    expect(showToast).not.toHaveBeenCalled();
  });

  it("submits update flow in edit mode and skips create notification", async () => {
    const { default: OneOnOneBookinStep2 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep2.vue"
    );
    const engine = createEngine({
      creatorId: 1407,
      eventId: "evt_edit",
      eventTitle: "Edited Event",
      eventType: "1on1-call",
      isGroupScheduleLocked: false,
      isGroupPricingLocked: false,
    });
    engine.callFlow.mockResolvedValue({
      ok: true,
      data: {
        eventId: "evt_edit",
      },
    });

    const wrapper = shallowMount(OneOnOneBookinStep2, {
      props: {
        engine,
        embedded: true,
        isEditMode: true,
        editEventId: "evt_edit",
      },
      global: mountOptions({
        booking_update_publish: "Actualizar y publicar",
      }),
    });

    const submitButton = wrapper.findAll("button").find((button) => button.text() === "Actualizar y publicar");
    expect(submitButton).toBeTruthy();

    await submitButton.trigger("click");
    await Promise.resolve();
    await Promise.resolve();

    expect(engine.callFlow).toHaveBeenCalledWith(
      "events.updateEvent",
      null,
      expect.objectContaining({
        context: expect.objectContaining({
          creatorId: 1407,
          eventId: "evt_edit",
          isGroupScheduleLocked: false,
          isGroupPricingLocked: false,
        }),
      }),
    );
    expect(fetch).not.toHaveBeenCalled();
    expect(wrapper.emitted("created")?.[0]?.[0]).toEqual(expect.objectContaining({
      mode: "edit",
    }));
  });

  it("uses the engine event title for create notification names", async () => {
    const { default: OneOnOneBookinStep2 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep2.vue"
    );
    const engine = createEngine({
      creatorId: 1407,
      eventTitle: "Creator Strategy Call",
      eventType: "1on1-call",
    });
    engine.callFlow.mockResolvedValue({
      ok: true,
      data: {
        eventId: "evt_123",
        item: {
          eventId: "evt_123",
          title: "Returned Event Title",
        },
      },
    });

    const wrapper = shallowMount(OneOnOneBookinStep2, {
      props: {
        engine,
        embedded: true,
      },
      global: mountOptions(),
    });

    const buttons = wrapper.findAll("button");
    await buttons[buttons.length - 1].trigger("click");
    await Promise.resolve();
    await Promise.resolve();

    expect(fetch).toHaveBeenCalledTimes(1);
    const [, requestOptions] = fetch.mock.calls[0];
    const payload = JSON.parse(requestOptions.body);

    expect(payload.event_name).toBe("Creator Strategy Call");
    expect(payload.booking_name).toBe("Creator Strategy Call");
    expect(payload.event_name).not.toBe("Booked Slot");
  });
});
