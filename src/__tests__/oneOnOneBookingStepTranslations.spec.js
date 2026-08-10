import { mount, shallowMount } from "@vue/test-utils";
import { nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bookingTranslationSymbol, createBookingTranslator } from "@/i18n/bookingTranslations.js";
import { fetchActiveSubscriptionTiers } from "@/services/events/eventsAudienceApi.js";
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
  const listeners = new Map();
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
    on: vi.fn((eventName, handler) => {
      if (!listeners.has(eventName)) listeners.set(eventName, new Set());
      listeners.get(eventName).add(handler);
      return () => listeners.get(eventName)?.delete(handler);
    }),
    emit: vi.fn((eventName, payload) => {
      listeners.get(eventName)?.forEach((handler) => handler(payload));
    }),
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
        props: ["placeholder", "disabled", "min", "modelValue", "type"],
        template: "<input :type='type' :placeholder='placeholder' :disabled='disabled' :min='min' :value='modelValue' :modelvalue='modelValue' />",
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
        props: ["modelValue", "options", "placeholder", "multiple", "hasCheckboxes", "searchable", "searchPlaceholder", "disabled", "optionFactory"],
        emits: ["update:modelValue", "focus"],
        template: "<div :data-disabled='disabled ? \"true\" : \"false\"'><span v-for='option in options' :key='option.value'>{{ option.label }}</span></div>",
      },
      InputComponentDashbaord: {
        props: ["placeholder", "labelText"],
        template: "<label><span>{{ labelText }}</span><input :placeholder='placeholder' /></label>",
      },
      MagnifyingGlassIcon: true,
      PopupHandler: {
        props: ["modelValue"],
        emits: ["update:modelValue"],
        template: "<div v-show='modelValue'><slot /></div>",
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
    fetchActiveSubscriptionTiers.mockResolvedValue([]);
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
        { field: "offHourSurchargeTokens", translationKey: "booking_validation_off_hour_surcharge_range", conditional: true },
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
    expect(wrapper.get("[data-booking-validation-tooltip-field='offHourSurchargeTokens']").text()).toContain("Off-hour surcharge");
    expect(wrapper.get("[data-booking-validation-tooltip-field='bufferTime']").text()).toContain("Buffer time must be at least 5 minutes.");
  });

  it("shows filled conditional numeric errors as translated validation messages", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const engine = createEngine({ eventType: "1on1-call" });
    engine.goToStep.mockRejectedValue({
      errors: [
        { field: "remindMeTime", translationKey: "booking_validation_reminder_time_min", conditional: false },
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
    expect(wrapper.get("[data-booking-validation-tooltip-field='remindMeTime']").text()).toContain("Reminder time must be at least 10 minutes.");
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
    expect(wrapper.get("[data-booking-validation-tooltip-field='duration']").text()).toContain("↗");

    await wrapper.get("[data-booking-validation-tooltip-field='duration']").trigger("click");
    await nextTick();

    expect(wrapper.find("[data-booking-validation-tooltip='true']").exists()).toBe(false);

    await wrapper.get("button").trigger("click");
    await nextTick();

    expect(wrapper.find("[data-booking-validation-tooltip='true']").exists()).toBe(true);
  });

  it("renders plain soft-disabled tooltip text without an action arrow", async () => {
    const { default: SoftDisabledBookingButton } = await import(
      "@/components/ui/form/BookingForm/HelperComponents/SoftDisabledBookingButton.vue"
    );

    const wrapper = mount(SoftDisabledBookingButton, {
      props: {
        text: "Update & Publish",
        softDisabled: true,
        tooltipText: "Your event settings haven’t changed.",
      },
    });

    const tooltip = wrapper.get("[data-booking-validation-tooltip='true']");
    expect(tooltip.get("[data-booking-informational-tooltip-row='true']").text())
      .toBe("Your event settings haven’t changed.");
    expect(tooltip.find("button").exists()).toBe(false);
    expect(tooltip.find("[data-booking-validation-tooltip-field]").exists()).toBe(false);
    expect(tooltip.text()).not.toContain("↗");

    await tooltip.trigger("click");
    expect(wrapper.emitted("tooltip-select")).toBeUndefined();
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

  it.each(["private", "group"])("renders required reminder and buffer defaults without enable checkboxes for %s events", async (bookingType) => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const engine = createEngine({
      eventType: bookingType === "group" ? "group-event" : "1on1-call",
      setReminders: false,
      remindMeTime: "",
      setBufferTime: false,
      bufferTime: "",
      bufferUnit: "minutes",
    });
    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine,
        bookingType,
      },
      global: mountOptions(),
    });
    await nextTick();

    const reminderInput = wrapper.get("[data-booking-validation-input-field='remindMeTime']");
    const bufferInput = wrapper.get("[data-booking-validation-input-field='bufferTime']");

    expect(reminderInput.attributes("value")).toBe("10");
    expect(reminderInput.attributes("min")).toBe("10");
    expect(reminderInput.attributes("disabled")).toBeUndefined();
    expect(bufferInput.attributes("value")).toBe("5");
    expect(bufferInput.attributes("min")).toBe("5");
    expect(bufferInput.attributes("disabled")).toBeUndefined();
    expect(wrapper.findAll("label").some((label) => label.text().includes("Enable reminder"))).toBe(false);
    expect(wrapper.findAll("label").some((label) => label.text().includes("Set buffer time between booked appointments"))).toBe(false);
    expect(engine.state).toEqual(expect.objectContaining({
      setReminders: true,
      remindMeTime: 10,
      setBufferTime: true,
      bufferTime: 5,
      bufferUnit: "minutes",
    }));
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
            slots: [{ startTime: "23:55", endTime: "23:59" }],
          }],
          monthlyAvailability: [{ startTime: "23:55", endTime: "23:59" }],
          weeklyAvailability: [{
            key: "sun",
            name: "Sun",
            unavailable: false,
            offHours: false,
            slots: [{ startTime: "23:55", endTime: "23:59", offHours: false }],
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
    expect(customEndOptions.find((option) => option.value === "00:00")?.disabled).toBe(true);
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
            slots: [{ startTime: "23:55", endTime: "23:59" }],
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
    expect(thirdSlotEndOptions.find((option) => option.value === "12:00")?.disabled).toBe(true);
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
    expect(thirdSlot.endTime).toBe("23:59");
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

  it("normalizes loaded off-hours boundaries in every availability mode", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const today = getTodayIsoDate();
    const engine = createEngine({
      eventType: "1on1-call",
      repeatRule: "weekly",
      weeklyAvailability: [
        {
          key: "sun",
          name: "Sun",
          unavailable: false,
          offHours: true,
          slots: [
            { startTime: "00:00", endTime: "03:00", offHours: false },
            { startTime: "03:00", endTime: "06:00", offHours: true },
          ],
        },
        {
          key: "mon",
          name: "Mon",
          unavailable: false,
          offHours: true,
          slots: [{ startTime: "03:00", endTime: "06:00", offHours: true }],
        },
      ],
      monthlyAvailability: [
        { startTime: "00:00", endTime: "03:00", offHours: false },
        { startTime: "03:00", endTime: "06:00", offHours: true },
      ],
      oneTimeAvailability: [{
        id: "date-1",
        date: today,
        slots: [
          { startTime: "00:00", endTime: "03:00", offHours: false },
          { startTime: "03:00", endTime: "06:00", offHours: true },
        ],
      }],
    });
    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine,
        bookingType: "private",
      },
      global: mountOptions(),
    });

    await settleValidation();

    const weeklyDays = unrefPublic(wrapper.vm.weekDays);
    expect(weeklyDays[0].slots[1].startTime).toBe("03:01");
    expect(weeklyDays[1].slots[0].startTime).toBe("03:00");
    expect(unrefPublic(wrapper.vm.monthlySlots)[1].startTime).toBe("03:01");
    expect(unrefPublic(wrapper.vm.oneTimeDates)[0].slots[1].startTime).toBe("03:01");
    expect(engine.state.weeklyAvailability[0].slots[1].startTime).toBe("03:01");
    expect(engine.state.monthlyAvailability[1].startTime).toBe("03:01");
    expect(engine.state.oneTimeAvailability[0].slots[1].startTime).toBe("03:01");

    const adjustedDropdown = wrapper
      .findAllComponents({ name: "CustomDropdown" })
      .find((dropdown) => dropdown.props("modelValue") === "03:01");
    expect(adjustedDropdown.props("options")).toContainEqual({
      value: "03:01",
      label: "3:01 AM",
    });
    expect(adjustedDropdown.props("options")).not.toContainEqual(
      expect.objectContaining({ value: "03:00" }),
    );
    const adjustedMenuOptions = adjustedDropdown.props("optionFactory")();
    expect(adjustedMenuOptions).toContainEqual(
      expect.objectContaining({
        value: "03:01",
        label: "3:01 AM",
        disabled: false,
      }),
    );
    expect(adjustedMenuOptions).not.toContainEqual(
      expect.objectContaining({ value: "03:00" }),
    );
  });

  it("keeps adjoining off-hours boundaries shared and reconciles later status changes", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const today = getTodayIsoDate();
    const engine = createEngine({
      eventType: "1on1-call",
      repeatRule: "monthly",
      weeklyAvailability: [{
        key: "sun",
        name: "Sun",
        unavailable: false,
        offHours: true,
        slots: [
          { startTime: "00:00", endTime: "03:00", offHours: true },
          { startTime: "03:00", endTime: "06:00", offHours: true },
        ],
      }],
      monthlyAvailability: [
        { startTime: "00:00", endTime: "03:00", offHours: true },
        { startTime: "03:00", endTime: "06:00", offHours: true },
      ],
      oneTimeAvailability: [{
        id: "date-1",
        date: today,
        slots: [
          { startTime: "00:00", endTime: "03:00", offHours: true },
          { startTime: "03:00", endTime: "06:00", offHours: true },
        ],
      }],
    });
    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine,
        bookingType: "private",
      },
      global: mountOptions(),
    });
    const weeklySlots = unrefPublic(wrapper.vm.weekDays)[0].slots;
    const monthlySlots = unrefPublic(wrapper.vm.monthlySlots);
    const oneTimeSlots = unrefPublic(wrapper.vm.oneTimeDates)[0].slots;

    expect(weeklySlots[1].startTime).toBe("03:00");
    expect(monthlySlots[1].startTime).toBe("03:00");
    expect(oneTimeSlots[1].startTime).toBe("03:00");
    expect(wrapper.vm.getWeeklyStartOptions(0, 1)).toContainEqual(
      expect.objectContaining({ value: "03:00", disabled: false }),
    );
    expect(wrapper.vm.getMonthlyStartOptions(1)).toContainEqual(
      expect.objectContaining({
        value: "03:00",
        label: "3:00 AM",
        disabled: false,
      }),
    );
    expect(wrapper.vm.getOneTimeStartOptions(
      unrefPublic(wrapper.vm.oneTimeDates)[0],
      1,
    )).toContainEqual(
      expect.objectContaining({ value: "03:00", disabled: false }),
    );
    expect(engine.state.weeklyAvailability[0].slots[1].startTime).toBe("03:00");
    expect(engine.state.monthlyAvailability[1].startTime).toBe("03:00");
    expect(engine.state.oneTimeAvailability[0].slots[1].startTime).toBe("03:00");

    wrapper.vm.toggleSlotOffHours(0, 0);
    wrapper.vm.toggleMonthlySlotOffHours(0);
    wrapper.vm.toggleOneTimeSlotOffHours(0, 0);
    await nextTick();

    expect(weeklySlots[1].startTime).toBe("03:01");
    expect(monthlySlots[1].startTime).toBe("03:01");
    expect(oneTimeSlots[1].startTime).toBe("03:01");
    expect(wrapper.vm.getWeeklyStartOptions(0, 1)).not.toContainEqual(
      expect.objectContaining({ value: "03:00" }),
    );
    expect(wrapper.vm.getMonthlyStartOptions(1)).not.toContainEqual(
      expect.objectContaining({ value: "03:00" }),
    );
    expect(wrapper.vm.getOneTimeStartOptions(
      unrefPublic(wrapper.vm.oneTimeDates)[0],
      1,
    )).not.toContainEqual(
      expect.objectContaining({ value: "03:00" }),
    );

    wrapper.vm.toggleSlotOffHours(0, 0);
    wrapper.vm.toggleMonthlySlotOffHours(0);
    wrapper.vm.toggleOneTimeSlotOffHours(0, 0);
    await nextTick();

    expect(weeklySlots[1].startTime).toBe("03:00");
    expect(monthlySlots[1].startTime).toBe("03:00");
    expect(oneTimeSlots[1].startTime).toBe("03:00");
    expect(engine.state.weeklyAvailability[0].slots[1].startTime).toBe("03:00");
    expect(engine.state.monthlyAvailability[1].startTime).toBe("03:00");
    expect(engine.state.oneTimeAvailability[0].slots[1].startTime).toBe("03:00");
  });

  it("maintains and restores monthly off-hours boundaries as times change", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const engine = createEngine({
      eventType: "1on1-call",
      repeatRule: "monthly",
      monthlyAvailability: [
        { startTime: "00:00", endTime: "02:55", offHours: false },
        { startTime: "03:00", endTime: "06:00", offHours: true },
      ],
    });
    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine,
        bookingType: "private",
      },
      global: mountOptions(),
    });
    const slots = unrefPublic(wrapper.vm.monthlySlots);

    expect(slots[1].startTime).toBe("03:00");

    wrapper.vm.onMonthlySlotChanged(0, "end", "03:00");
    await nextTick();
    expect(slots[1].startTime).toBe("03:01");

    wrapper.vm.onMonthlySlotChanged(0, "end", "02:55");
    await nextTick();
    expect(slots[1].startTime).toBe("03:00");

    wrapper.vm.onMonthlySlotChanged(0, "end", "03:00");
    await nextTick();
    expect(slots[1].startTime).toBe("03:01");

    wrapper.vm.toggleMonthlySlotOffHours(1);
    await nextTick();
    expect(slots[1]).toEqual(expect.objectContaining({
      startTime: "03:00",
      endTime: "06:00",
      offHours: false,
    }));

    wrapper.vm.toggleMonthlySlotOffHours(1);
    await nextTick();
    expect(slots[1]).toEqual(expect.objectContaining({
      startTime: "03:01",
      endTime: "06:00",
      offHours: true,
    }));
  });

  it("preserves five-minute off-hours slots when adjusting a shared boundary", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          eventType: "1on1-call",
          repeatRule: "monthly",
          monthlyAvailability: [
            { startTime: "00:00", endTime: "03:00", offHours: false },
            { startTime: "03:00", endTime: "03:05", offHours: true },
          ],
        }),
        bookingType: "private",
      },
      global: mountOptions(),
    });
    const slots = unrefPublic(wrapper.vm.monthlySlots);

    expect(slots[1]).toEqual(expect.objectContaining({
      startTime: "03:01",
      endTime: "03:06",
      offHours: true,
    }));
    expect(wrapper.vm.getMonthlyEndOptions(1)).toContainEqual(
      expect.objectContaining({
        value: "03:06",
        label: "3:06 AM",
        disabled: false,
      }),
    );

    wrapper.vm.toggleMonthlySlotOffHours(1);
    await nextTick();
    expect(slots[1]).toEqual(expect.objectContaining({
      startTime: "03:00",
      endTime: "03:05",
      offHours: false,
    }));

    const blockedWrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          eventType: "1on1-call",
          repeatRule: "monthly",
          monthlyAvailability: [
            { startTime: "00:00", endTime: "03:00", offHours: false },
            { startTime: "03:00", endTime: "03:05", offHours: true },
            { startTime: "03:05", endTime: "06:00", offHours: false },
          ],
        }),
        bookingType: "private",
      },
      global: mountOptions(),
    });
    expect(unrefPublic(blockedWrapper.vm.monthlySlots)[1]).toEqual(expect.objectContaining({
      startTime: "03:00",
      endTime: "03:05",
      offHours: true,
    }));
  });

  it("disables custom end times at or before the selected start time", async () => {
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
            slots: [{ startTime: "16:00", endTime: "17:00" }],
          }],
        }),
        bookingType: "private",
      },
      global: mountOptions(),
    });

    const customTimeDropdowns = wrapper
      .findAllComponents({ name: "CustomDropdown" })
      .filter((dropdown) => typeof dropdown.props("optionFactory") === "function");
    const endOptions = customTimeDropdowns[1].props("optionFactory")();

    expect(endOptions.find((option) => option.value === "15:55")?.disabled).toBe(true);
    expect(endOptions.find((option) => option.value === "16:00")?.disabled).toBe(true);
    expect(endOptions.find((option) => option.value === "16:05")?.disabled).toBe(false);

    const slot = unrefPublic(wrapper.vm.oneTimeDates)[0].slots[0];
    slot.endTime = "15:00";
    wrapper.vm.onOneTimeSlotChanged(0, 0, "end");
    await nextTick();

    expect(slot.startTime).toBe("16:00");
    expect(slot.endTime).toBe("16:05");
  });

  it("disables monthly end times at or before the selected start time", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          eventType: "1on1-call",
          repeatRule: "monthly",
          dateFrom: getTodayIsoDate(),
          monthlyAvailability: [{ startTime: "16:00", endTime: "17:00" }],
        }),
        bookingType: "private",
      },
      global: mountOptions(),
    });

    const monthlyTimeDropdowns = wrapper
      .findAllComponents({ name: "CustomDropdown" })
      .filter((dropdown) => typeof dropdown.props("optionFactory") === "function");
    const endOptions = monthlyTimeDropdowns[1].props("optionFactory")();

    expect(endOptions.find((option) => option.value === "15:55")?.disabled).toBe(true);
    expect(endOptions.find((option) => option.value === "16:00")?.disabled).toBe(true);
    expect(endOptions.find((option) => option.value === "16:05")?.disabled).toBe(false);

    const slot = unrefPublic(wrapper.vm.monthlySlots)[0];
    slot.endTime = "15:00";
    wrapper.vm.onMonthlySlotChanged(0, "end");
    await nextTick();

    expect(slot.startTime).toBe("16:00");
    expect(slot.endTime).toBe("16:05");
  });

  it("disables weekly end times at or before the selected start time", async () => {
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
              slots: [{ startTime: "16:00", endTime: "17:00", offHours: false }],
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
    const endOptions = weeklyTimeDropdowns[1].props("optionFactory")();

    expect(endOptions.find((option) => option.value === "15:55")?.disabled).toBe(true);
    expect(endOptions.find((option) => option.value === "16:00")?.disabled).toBe(true);
    expect(endOptions.find((option) => option.value === "16:05")?.disabled).toBe(false);

    const slot = unrefPublic(wrapper.vm.weekDays)[0].slots[0];
    slot.endTime = "15:00";
    wrapper.vm.onWeeklySlotChanged(0, 0, "end");
    await nextTick();

    expect(slot.startTime).toBe("16:00");
    expect(slot.endTime).toBe("16:05");
  });

  it("requests calendar focus for edited weekly, monthly, and one-time slots", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          eventType: "1on1-call",
          repeatRule: "weekly",
          weeklyAvailability: [{
            key: "sun",
            name: "Sun",
            unavailable: false,
            slots: [{ startTime: "13:25", endTime: "14:25" }],
          }],
          monthlyAvailability: [{ startTime: "09:15", endTime: "10:15" }],
          oneTimeAvailability: [{
            id: "date_focus",
            date: "2026-08-12",
            slots: [{ startTime: "18:30", endTime: "19:30" }],
          }],
        }),
        bookingType: "private",
      },
      global: mountOptions(),
    });

    wrapper.vm.onWeeklySlotChanged(0, 0, "start", "13:30");
    unrefPublic(wrapper.vm.formData).repeatRule = "monthly";
    wrapper.vm.onMonthlySlotChanged(0, "start", "09:20");
    unrefPublic(wrapper.vm.formData).repeatRule = "doesNotRepeat";
    wrapper.vm.onOneTimeSlotChanged(0, 0, "start", "18:35");
    await nextTick();

    expect(wrapper.emitted("schedule-preview-focus")).toEqual([
      [{
        repeatRule: "weekly",
        weekday: 0,
        date: "",
        startTime: "13:30",
      }],
      [{
        repeatRule: "monthly",
        weekday: null,
        date: "",
        startTime: "09:20",
      }],
      [{
        repeatRule: "doesNotRepeat",
        weekday: null,
        date: "2026-08-12",
        startTime: "18:35",
      }],
    ]);
  });

  it("requests calendar focus when either schedule time dropdown is opened", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          eventType: "1on1-call",
          repeatRule: "weekly",
          weeklyAvailability: [{
            key: "sun",
            name: "Sun",
            unavailable: false,
            slots: [{ startTime: "13:25", endTime: "14:25" }],
          }],
          monthlyAvailability: [{ startTime: "09:15", endTime: "10:15" }],
          oneTimeAvailability: [{
            id: "date_focus",
            date: "2026-08-12",
            slots: [{ startTime: "18:30", endTime: "19:30" }],
          }],
        }),
        bookingType: "private",
      },
      global: mountOptions(),
    });
    const openTimeDropdown = async (modelValue) => {
      const dropdown = wrapper
        .findAllComponents({ name: "CustomDropdown" })
        .find((candidate) => candidate.props("modelValue") === modelValue);
      expect(dropdown).toBeTruthy();
      dropdown.vm.$emit("focus");
      await nextTick();
    };

    await openTimeDropdown("13:25");
    await openTimeDropdown("14:25");

    unrefPublic(wrapper.vm.formData).repeatRule = "monthly";
    await nextTick();
    await openTimeDropdown("09:15");
    await openTimeDropdown("10:15");

    unrefPublic(wrapper.vm.formData).repeatRule = "doesNotRepeat";
    await nextTick();
    await openTimeDropdown("18:30");
    await openTimeDropdown("19:30");

    expect(wrapper.emitted("schedule-preview-focus")).toEqual([
      [{
        repeatRule: "weekly",
        weekday: 0,
        date: "",
        startTime: "13:25",
        interaction: "field-focus",
      }],
      [{
        repeatRule: "weekly",
        weekday: 0,
        date: "",
        startTime: "13:25",
        interaction: "field-focus",
      }],
      [{
        repeatRule: "monthly",
        weekday: null,
        date: "",
        startTime: "09:15",
        interaction: "field-focus",
      }],
      [{
        repeatRule: "monthly",
        weekday: null,
        date: "",
        startTime: "09:15",
        interaction: "field-focus",
      }],
      [{
        repeatRule: "doesNotRepeat",
        weekday: null,
        date: "2026-08-12",
        startTime: "18:30",
        interaction: "field-focus",
      }],
      [{
        repeatRule: "doesNotRepeat",
        weekday: null,
        date: "2026-08-12",
        startTime: "18:30",
        interaction: "field-focus",
      }],
    ]);
  });

  it("requests calendar focus as soon as a new schedule slot or date is added", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          eventType: "1on1-call",
          repeatRule: "weekly",
          weeklyAvailability: [{
            key: "sun",
            name: "Sun",
            unavailable: true,
            slots: [],
          }],
          monthlyAvailability: [{ startTime: "09:15", endTime: "10:15" }],
          oneTimeAvailability: [{
            id: "date_focus",
            date: "2026-08-12",
            slots: [{ startTime: "12:00", endTime: "15:00" }],
          }],
        }),
        bookingType: "private",
      },
      global: mountOptions(),
    });

    const latestFocusRequest = () => wrapper.emitted("schedule-preview-focus")?.at(-1)?.[0];

    wrapper.vm.addDayAvailability(0);
    expect(latestFocusRequest()).toEqual({
      repeatRule: "weekly",
      weekday: 0,
      date: "",
      startTime: unrefPublic(wrapper.vm.weekDays)[0].slots[0].startTime,
    });

    wrapper.vm.addWeeklySlot(0);
    expect(latestFocusRequest()).toEqual({
      repeatRule: "weekly",
      weekday: 0,
      date: "",
      startTime: unrefPublic(wrapper.vm.weekDays)[0].slots.at(-1).startTime,
    });

    unrefPublic(wrapper.vm.formData).repeatRule = "monthly";
    wrapper.vm.addMonthlySlot();
    expect(latestFocusRequest()).toEqual({
      repeatRule: "monthly",
      weekday: null,
      date: "",
      startTime: unrefPublic(wrapper.vm.monthlySlots).at(-1).startTime,
    });

    unrefPublic(wrapper.vm.formData).repeatRule = "doesNotRepeat";
    wrapper.vm.addOneTimeSlot(0);
    expect(latestFocusRequest()).toEqual({
      repeatRule: "doesNotRepeat",
      weekday: null,
      date: "2026-08-12",
      startTime: unrefPublic(wrapper.vm.oneTimeDates)[0].slots.at(-1).startTime,
    });

    wrapper.vm.addOneTimeDate();
    const addedDate = unrefPublic(wrapper.vm.oneTimeDates).at(-1).date;
    expect(latestFocusRequest()).toEqual({
      repeatRule: "doesNotRepeat",
      weekday: null,
      date: addedDate,
      startTime: "",
    });
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

  it("restores recurring date bounds after a round trip through custom", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );

    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine({
          repeatRule: "weekly",
          dateFrom: "2026-08-01",
          dateTo: "2026-08-31",
          oneTimeAvailability: [{
            id: "date_existing",
            date: "2026-09-10",
            slots: [{ startTime: "12:00", endTime: "15:00" }],
          }],
        }),
        bookingType: "private",
      },
      global: mountOptions(),
    });

    wrapper.vm.formData.repeatRule = "doesNotRepeat";
    await nextTick();
    expect(wrapper.vm.formData.dateFrom).toBe("2026-09-10");
    expect(wrapper.vm.formData.dateTo).toBe("2026-09-10");

    wrapper.vm.formData.repeatRule = "weekly";
    await nextTick();
    expect(wrapper.vm.formData.dateFrom).toBe("2026-08-01");
    expect(wrapper.vm.formData.dateTo).toBe("2026-08-31");
  });

  it("retains recurring date bounds while custom is remounted between steps", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const engine = createEngine({
      eventId: "evt_recurring_remount",
      repeatRule: "weekly",
      dateFrom: "2026-08-01",
      dateTo: "2026-08-31",
      oneTimeAvailability: [{
        id: "date_existing",
        date: "2026-09-10",
        slots: [{ startTime: "12:00", endTime: "15:00" }],
      }],
    });

    let wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine,
        bookingType: "private",
      },
      global: mountOptions(),
    });

    wrapper.vm.formData.repeatRule = "doesNotRepeat";
    await nextTick();
    wrapper.unmount();

    wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine,
        bookingType: "private",
      },
      global: mountOptions(),
    });
    wrapper.vm.formData.repeatRule = "weekly";
    await nextTick();

    expect(wrapper.vm.formData.dateFrom).toBe("2026-08-01");
    expect(wrapper.vm.formData.dateTo).toBe("2026-08-31");
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

    expect(wrapper.text()).toContain("12 tokens off each session");
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

  it("hides the late-start compensation setting in private step 1", async () => {
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

    expect(wrapper.text()).toContain("Call Settings");
    expect(wrapper.text()).not.toContain("Offer discount if call starts late");
    expect(wrapper.text()).not.toContain("Allow reschedule");
    expect(wrapper.text()).not.toContain("Issue refund");
    expect(wrapper.text()).not.toContain("Give next-session discount");
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
    wrapper.vm.formData.offHourSurchargeTokens = "10";
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
    expect(engine.state.offHourSurchargeTokens).toBe("10");
    expect(engine.state.enableMaxAttendees).toBe(true);
    expect(engine.state.maxAttendees).toBe("8");
  });

  it("hydrates the legacy off-hour value into the fixed token input", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const engine = createEngine({
      eventType: "1on1-call",
      basePrice: "15",
      addOffHourSurcharge: true,
      offHourSurchargePercent: "30",
    });
    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: { engine, bookingType: "private" },
      global: mountOptions(),
    });

    await nextTick();

    expect(wrapper.get("[data-booking-validation-input-field='offHourSurchargeTokens']").attributes("modelvalue")).toBe("30");
    expect(wrapper.get("[data-test='off-hour-surcharge-suffix']").text()).toBe("tokens/session");
    expect(wrapper.text()).not.toContain("%");
    expect(wrapper.get("[data-test='off-hour-surcharge-controls']").classes()).toEqual(expect.arrayContaining([
      "min-w-0",
      "w-full",
    ]));
    expect(wrapper.get("[data-test='off-hour-surcharge-controls']").classes()).not.toContain("sm:justify-end");
    expect(wrapper.get("[data-test='off-hour-surcharge-toggle']").attributes("wrapperclass")).toContain("!w-auto");
    expect(wrapper.get("[data-test='off-hour-surcharge-toggle']").attributes("wrapperclass")).toContain("flex-none");
    expect(wrapper.get("[data-test='off-hour-surcharge-suffix']").classes()).toEqual(expect.arrayContaining([
      "whitespace-nowrap",
    ]));
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
    wrapper.vm.formData.offHourSurchargeTokens = "12";
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
    expect(engine.state.offHourSurchargeTokens).toBe("12");
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

  it("uses a single subscription tier selector and removes spending requirement controls", async () => {
    fetchActiveSubscriptionTiers.mockResolvedValue([
      { id: 101, label: "Starter" },
      { id: 202, label: "Premium" },
    ]);
    const { default: OneOnOneBookinStep2 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep2.vue"
    );
    const engine = createEngine({
      whoCanBook: "subscribersOnly",
      subscriptionTiers: [202, 101],
      spendingRequirement: "minSpend",
      minSpendTokens: "50",
    });

    const wrapper = shallowMount(OneOnOneBookinStep2, {
      props: { engine, embedded: true },
      global: mountOptions(),
    });
    await settleValidation();

    const dropdowns = wrapper.findAllComponents({ name: "CustomDropdown" });
    const audienceDropdown = dropdowns.find((dropdown) => (
      dropdown.props("options")?.some((option) => option.value === "mustOwnProducts")
    ));
    const tierDropdown = dropdowns.find((dropdown) => (
      dropdown.props("options")?.some((option) => option.value === 202)
    ));

    expect(audienceDropdown.props("options").map((option) => option.value)).toEqual([
      "everyone",
      "subscribersOnly",
      "mustOwnProducts",
      "inviteOnly",
    ]);
    expect(tierDropdown.props("options").map((option) => option.value)).toEqual([101, 202]);
    expect(tierDropdown.props("options").some((option) => option.label === "All Tiers")).toBe(false);
    expect(tierDropdown.props("multiple")).toBeFalsy();
    expect(tierDropdown.props("hasCheckboxes")).toBeFalsy();
    expect(wrapper.vm.formData.subscriptionTiers).toEqual([202]);
    expect(engine.state.spendingRequirement).toBe("none");
    expect(wrapper.text()).not.toContain("Spending Requirement");

    tierDropdown.vm.$emit("update:modelValue", 101);
    await nextTick();
    expect(wrapper.vm.formData.subscriptionTiers).toEqual([101]);
    expect(engine.state.subscriptionTiers).toEqual([101]);
  });

  it("maps Must own products to the existing audience payload fields", async () => {
    const { default: OneOnOneBookinStep2 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep2.vue"
    );
    const engine = createEngine({
      whoCanBook: "inviteOnly",
      spendingRequirement: "mustOwnProducts",
      requiredProducts: [{
        id: 9,
        type: "product",
        title: "Creator product",
        buyPrice: 12,
      }],
    });

    const wrapper = shallowMount(OneOnOneBookinStep2, {
      props: { engine, embedded: true },
      global: mountOptions(),
    });
    await settleValidation();

    const audienceDropdown = wrapper.findAllComponents({ name: "CustomDropdown" }).find((dropdown) => (
      dropdown.props("options")?.some((option) => option.value === "mustOwnProducts")
    ));

    expect(audienceDropdown.props("modelValue")).toBe("mustOwnProducts");
    expect(wrapper.vm.formData.whoCanBook).toBe("everyone");
    expect(engine.state.whoCanBook).toBe("everyone");
    expect(engine.state.spendingRequirement).toBe("mustOwnProducts");
    expect(wrapper.text()).toContain("Creator product");
    expect(wrapper.text()).toContain("Switch Product");

    audienceDropdown.vm.$emit("update:modelValue", "inviteOnly");
    await settleValidation();

    expect(wrapper.vm.formData.whoCanBook).toBe("inviteOnly");
    expect(engine.state.whoCanBook).toBe("inviteOnly");
    expect(engine.state.spendingRequirement).toBe("none");
    expect(wrapper.text()).not.toContain("Creator product");
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

    expect(wrapper.text()).not.toContain("Requisito de gasto");
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

  it("updates a mounted step 2 when background X settings arrive", async () => {
    const { default: OneOnOneBookinStep2 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep2.vue"
    );
    const engine = createEngine({
      creatorId: 1407,
      eventType: "1on1-call",
      xPostLive: false,
      on_schedule_live: false,
      on_schedule_live_message: "",
      on_schedule_live_media_url: "",
    });
    const wrapper = shallowMount(OneOnOneBookinStep2, {
      props: {
        engine,
        embedded: true,
        isEditMode: true,
        editEventId: "evt_late_ui",
      },
      global: mountOptions(),
    });

    const hydratedFields = {
      xPostLive: true,
      on_schedule_live: true,
      on_schedule_live_message: "Background message",
      on_schedule_live_media_url: "https://cdn.example.com/background.jpg",
    };
    Object.entries(hydratedFields).forEach(([field, value]) => {
      engine.setState(field, value);
    });
    engine.emit("x-post-settings:hydrated", { fields: hydratedFields });
    await settleValidation();

    expect(wrapper.vm.formData).toEqual(expect.objectContaining(hydratedFields));
  });

  it("detects only current logical persisted edit differences", async () => {
    const { default: OneOnOneBookinStep2 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep2.vue"
    );
    const baseline = {
      eventTitle: "Original event",
      repeatRule: "weekly",
      selectedDate: "2026-08-01",
      selectedStartTime: "09:00",
      selectedEndTime: "10:00",
      weeklyAvailability: [{ key: "mon", slots: [{ startTime: "09:00", endTime: "10:00" }] }],
      monthlyAvailability: [{ startTime: "12:00", endTime: "13:00" }],
      oneTimeAvailability: [],
      addOns: [],
      blockedUsers: [],
      xPostLive: false,
      on_schedule_live: false,
      blockedUserSearch: "",
      coPerformerSearch: "",
    };
    const engine = createEngine(JSON.parse(JSON.stringify(baseline)));
    const wrapper = shallowMount(OneOnOneBookinStep2, {
      props: {
        engine,
        embedded: true,
        isEditMode: true,
        editEventId: "evt_logical_changes",
        editBaseline: baseline,
      },
      global: mountOptions(),
    });
    let refreshIndex = 0;
    async function refreshEditState() {
      refreshIndex += 1;
      wrapper.vm.formData.personalRequestNote = `refresh-${refreshIndex}`;
      await nextTick();
    }

    expect(wrapper.vm.hasLogicalEditChanges).toBe(false);

    engine.setState("monthlyAvailability", [{ startTime: "14:00", endTime: "15:00" }]);
    engine.setState("selectedDate", "2026-09-01");
    engine.setState("blockedUserSearch", "temporary query");
    await refreshEditState();
    expect(wrapper.vm.hasLogicalEditChanges).toBe(false);

    engine.setState("weeklyAvailability", [{ key: "mon", slots: [{ startTime: "09:30", endTime: "10:00" }] }]);
    await refreshEditState();
    expect(wrapper.vm.hasLogicalEditChanges).toBe(true);

    engine.setState("weeklyAvailability", JSON.parse(JSON.stringify(baseline.weeklyAvailability)));
    wrapper.vm.formData.addOns = [{ title: "Replay", description: "", priceTokens: "10" }];
    await nextTick();
    expect(wrapper.vm.hasLogicalEditChanges).toBe(true);

    wrapper.vm.formData.addOns = [];
    wrapper.vm.formData.blockedUsers = [1408];
    await nextTick();
    expect(wrapper.vm.hasLogicalEditChanges).toBe(true);

    wrapper.vm.formData.blockedUsers = [];
    wrapper.vm.formData.xPostLive = true;
    await nextTick();
    expect(wrapper.vm.hasLogicalEditChanges).toBe(true);

    wrapper.vm.formData.xPostLive = false;
    engine.setState("eventTitle", "Original event");
    await nextTick();
    expect(wrapper.vm.hasLogicalEditChanges).toBe(false);
  });

  it("validates edit submissions before confirmation and reports unchanged or reverted edits", async () => {
    const { default: OneOnOneBookinStep2 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep2.vue"
    );
    const engine = createEngine({
      allowPersonalRequest: false,
      eventType: "1on1-call",
    });
    const wrapper = shallowMount(OneOnOneBookinStep2, {
      props: {
        engine,
        embedded: true,
        isEditMode: true,
        editEventId: "evt_confirmation_validation",
        editBaseline: { allowPersonalRequest: false },
      },
      global: mountOptions({
        booking_edit_confirmation_message: "Translated confirmation message",
        booking_edit_confirmation_back: "TRANSLATED BACK",
        booking_edit_confirmation_save_changes: "TRANSLATED SAVE",
        booking_nothing_to_update_message: "Translated unchanged message",
      }),
    });

    await settleValidation();
    const unchangedAction = wrapper.get("[data-booking-soft-disabled='true']");
    expect(unchangedAction.get("[data-booking-validation-tooltip='true']").text())
      .toContain("Translated unchanged message");
    await unchangedAction.get("button").trigger("click");
    await settleValidation();
    expect(wrapper.get("[data-test='edit-submit-confirmation-dialog']").isVisible()).toBe(false);
    expect(engine.callFlow).not.toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalled();

    wrapper.vm.formData.allowPersonalRequest = true;
    await settleValidation();
    expect(wrapper.get("[data-booking-soft-disabled]").attributes("data-booking-soft-disabled"))
      .toBe("false");
    await wrapper.vm.createEvent();
    expect(wrapper.get("[data-test='edit-submit-confirmation-dialog']").text())
      .toContain("Translated confirmation message");
    expect(wrapper.get("[data-test='edit-submit-confirmation-back']").text())
      .toContain("TRANSLATED BACK");
    expect(wrapper.get("[data-test='edit-submit-confirmation-save']").text())
      .toContain("TRANSLATED SAVE");
    expect(engine.callFlow).not.toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalled();

    await wrapper.get("[data-test='edit-submit-confirmation-back']").trigger("click");
    expect(wrapper.get("[data-test='edit-submit-confirmation-dialog']").isVisible()).toBe(false);

    wrapper.vm.formData.allowPersonalRequest = false;
    await settleValidation();
    const revertedAction = wrapper.get("[data-booking-soft-disabled='true']");
    expect(revertedAction.get("[data-booking-validation-tooltip='true']").text())
      .toContain("Translated unchanged message");
    await revertedAction.get("button").trigger("click");
    await settleValidation();
    expect(wrapper.get("[data-test='edit-submit-confirmation-dialog']").isVisible()).toBe(false);
    expect(engine.callFlow).not.toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalled();

    wrapper.vm.formData.allowPersonalRequest = true;
    engine.validate.mockResolvedValue({
      valid: false,
      errors: [{ field: "recordingPrice", translationKey: "booking_validation_recording_price_min" }],
    });
    await wrapper.vm.createEvent();
    expect(wrapper.get("[data-test='edit-submit-confirmation-dialog']").isVisible()).toBe(false);
    expect(wrapper.find("[data-booking-validation-warning='true']").exists()).toBe(true);
    expect(wrapper.get("[data-booking-soft-disabled='true']").text()).toContain("Recording price");
    expect(wrapper.get("[data-booking-soft-disabled='true']").text())
      .not.toContain("Translated unchanged message");
    expect(engine.callFlow).not.toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalled();
  });

  it("disables confirmation dismissal while updating and closes after success", async () => {
    const { default: OneOnOneBookinStep2 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep2.vue"
    );
    let resolveUpdate;
    const engine = createEngine({
      eventTitle: "Updated event",
      eventType: "1on1-call",
    });
    engine.callFlow.mockReturnValue(new Promise((resolve) => {
      resolveUpdate = resolve;
    }));
    const wrapper = shallowMount(OneOnOneBookinStep2, {
      props: {
        engine,
        embedded: true,
        isEditMode: true,
        editEventId: "evt_confirmation_success",
        editBaseline: { eventTitle: "Original event" },
      },
      global: mountOptions(),
    });

    await wrapper.vm.createEvent();
    expect(wrapper.get("[data-test='edit-submit-confirmation-save']").text())
      .toContain("SAVE CHANGES");
    expect(wrapper.find("[data-test='edit-submit-confirmation-spinner']").exists()).toBe(false);
    const updatePromise = wrapper.vm.confirmEditChanges();
    await nextTick();

    expect(wrapper.get("[data-test='edit-submit-confirmation-back']").attributes("disabled")).toBeDefined();
    expect(wrapper.get("[data-test='edit-submit-confirmation-save']").attributes("disabled")).toBeDefined();
    expect(wrapper.get("[data-test='edit-submit-confirmation-save']").text()).not.toContain("Loading");
    expect(wrapper.get("[data-test='edit-submit-confirmation-spinner']").attributes("aria-label"))
      .toBe("Loading");
    expect(wrapper.vm.editConfirmationPopupConfig.closeOnOutside).toBe(false);
    expect(wrapper.vm.editConfirmationPopupConfig.escToClose).toBe(false);

    resolveUpdate({ ok: true, data: { eventId: "evt_confirmation_success" } });
    await updatePromise;
    await settleValidation();

    expect(wrapper.get("[data-test='edit-submit-confirmation-dialog']").isVisible()).toBe(false);
    expect(wrapper.emitted("created")?.[0]?.[0]).toEqual(expect.objectContaining({
      mode: "edit",
    }));
  });

  it("keeps confirmation open after a failed update and allows retry", async () => {
    const { default: OneOnOneBookinStep2 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep2.vue"
    );
    const engine = createEngine({
      eventTitle: "Updated event",
      eventType: "1on1-call",
    });
    engine.callFlow
      .mockResolvedValueOnce({
        ok: false,
        error: { message: "Update failed" },
      })
      .mockResolvedValueOnce({
        ok: true,
        data: { eventId: "evt_confirmation_retry" },
      });
    const wrapper = shallowMount(OneOnOneBookinStep2, {
      props: {
        engine,
        embedded: true,
        isEditMode: true,
        editEventId: "evt_confirmation_retry",
        editBaseline: { eventTitle: "Original event" },
      },
      global: mountOptions(),
    });

    await wrapper.vm.createEvent();
    await wrapper.get("[data-test='edit-submit-confirmation-save']").trigger("click");
    await settleValidation();

    expect(wrapper.get("[data-test='edit-submit-confirmation-dialog']").isVisible()).toBe(true);
    expect(wrapper.find("[data-test='edit-submit-confirmation-spinner']").exists()).toBe(false);
    expect(wrapper.get("[data-test='edit-submit-confirmation-save']").text())
      .toContain("SAVE CHANGES");
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({
      type: "error",
      title: "Could not update event",
    }));
    expect(wrapper.emitted("created")).toBeUndefined();

    await wrapper.vm.confirmEditChanges();
    await settleValidation();

    expect(engine.callFlow).toHaveBeenCalledTimes(2);
    expect(wrapper.vm.editConfirmationPopupOpen).toBe(false);
    expect(wrapper.emitted("created")?.[0]?.[0]).toEqual(expect.objectContaining({
      mode: "edit",
    }));
  });

  it("emits edit success before the queued X settings save completes", async () => {
    const { default: OneOnOneBookinStep2 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep2.vue"
    );
    let resolveHydration;
    const hydrationPromise = new Promise((resolve) => {
      resolveHydration = resolve;
    });
    const engine = createEngine({
      creatorId: 1407,
      eventId: "evt_edit",
      eventTitle: "Edited Event",
      eventType: "1on1-call",
      isGroupScheduleLocked: false,
      isGroupPricingLocked: false,
      on_schedule_live: true,
      on_schedule_live_message: "Edited live message",
      on_schedule_live_media_url: "https://cdn.example.com/edited-live.jpg",
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
        editBaseline: { eventTitle: "Original Event" },
        xPostSettingsHydrationPromise: hydrationPromise,
      },
      global: mountOptions({
        booking_update_publish: "Actualizar y publicar",
      }),
    });

    const submitButton = wrapper.findAll("button").find((button) => button.text() === "Actualizar y publicar");
    expect(submitButton).toBeTruthy();

    await wrapper.vm.createEvent();
    expect(wrapper.get("[data-test='edit-submit-confirmation-dialog']").isVisible()).toBe(true);
    expect(engine.callFlow).not.toHaveBeenCalled();
    await wrapper.vm.confirmEditChanges();
    await settleValidation();

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

    resolveHydration({ status: "loaded" });
    await settleValidation();

    expect(fetch).toHaveBeenCalledTimes(1);
    const [settingsUrl, settingsOptions] = fetch.mock.calls[0];
    expect(settingsUrl).toContain("/wp-json/api/event/evt_edit/x-post-settings");
    expect(settingsUrl).not.toContain("/wp-json/api/event/create");
    expect(settingsOptions.method).toBe("PUT");
    expect(settingsOptions.keepalive).toBe(true);
    expect(JSON.parse(settingsOptions.body)).toEqual(expect.objectContaining({
      creator_id: 1407,
      settings: expect.objectContaining({
        on_schedule_live: {
          enabled: true,
          message: "Edited live message",
          mediaUrl: "https://cdn.example.com/edited-live.jpg",
        },
      }),
    }));
  });

  it("does not block edit success when the background X settings PUT fails", async () => {
    const { default: OneOnOneBookinStep2 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep2.vue"
    );
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const engine = createEngine({
      creatorId: 1407,
      eventId: "evt_edit_retry",
      eventTitle: "Edited Event",
      eventType: "1on1-call",
      on_schedule_live: true,
      on_schedule_live_message: "Keep this message",
    });
    engine.callFlow.mockResolvedValue({
      ok: true,
      data: { eventId: "evt_edit_retry" },
    });
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({
        success: false,
        message: "WordPress settings write failed.",
      }),
    });

    const wrapper = shallowMount(OneOnOneBookinStep2, {
      props: {
        engine,
        embedded: true,
        isEditMode: true,
        editEventId: "evt_edit_retry",
        editBaseline: { eventTitle: "Original Event" },
        xPostSettingsHydrationPromise: Promise.resolve({ status: "loaded" }),
      },
      global: mountOptions(),
    });

    await wrapper.vm.createEvent();
    await wrapper.vm.confirmEditChanges();
    await settleValidation();

    expect(engine.callFlow).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls.every(([url]) => !url.includes("/wp-json/api/event/create"))).toBe(true);
    expect(wrapper.emitted("created")?.[0]?.[0]).toEqual(expect.objectContaining({
      mode: "edit",
    }));
    expect(showToast).not.toHaveBeenCalled();
    await vi.waitFor(() => {
      expect(warnSpy).toHaveBeenCalledWith(
        "Background X post settings save failed",
        expect.objectContaining({ eventId: "evt_edit_retry" }),
      );
    });
  });

  it("skips the background X settings PUT when hydration failed", async () => {
    const { default: OneOnOneBookinStep2 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep2.vue"
    );
    const engine = createEngine({
      creatorId: 1407,
      eventId: "evt_edit_get_failed",
      eventTitle: "Edited Event",
      eventType: "1on1-call",
    });
    engine.callFlow.mockResolvedValue({
      ok: true,
      data: { eventId: "evt_edit_get_failed" },
    });

    const wrapper = shallowMount(OneOnOneBookinStep2, {
      props: {
        engine,
        embedded: true,
        isEditMode: true,
        editEventId: "evt_edit_get_failed",
        editBaseline: { eventTitle: "Original Event" },
        xPostSettingsHydrationPromise: Promise.resolve({ status: "failed" }),
      },
      global: mountOptions(),
    });

    await wrapper.vm.createEvent();
    await wrapper.vm.confirmEditChanges();
    await settleValidation();

    expect(engine.callFlow).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
    expect(wrapper.emitted("created")?.[0]?.[0]).toEqual(expect.objectContaining({
      mode: "edit",
    }));
    expect(showToast).not.toHaveBeenCalled();
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

  it("uses one normalized edit warning for the active calendar availability schedule", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const initialState = {
      eventTitle: "Original title",
      eventType: "1on1-call",
      repeatRule: "weekly",
      dateFrom: "2026-08-01",
      dateTo: "2026-08-31",
      weeklyAvailability: [{
        key: "sun",
        name: "Sun",
        unavailable: false,
        slots: [{ startTime: "09:00", endTime: "10:00", offHours: false }],
      }],
    };
    const normalizationWrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine(JSON.parse(JSON.stringify(initialState))),
        bookingType: "private",
      },
      global: mountOptions(),
    });
    const rawBaseline = {
      ...JSON.parse(JSON.stringify(normalizationWrapper.vm.formData)),
      oneTimeAvailability: [],
    };
    normalizationWrapper.unmount();

    const engine = createEngine(JSON.parse(JSON.stringify(rawBaseline)));
    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine,
        bookingType: "private",
        isEditMode: true,
        editBaseline: rawBaseline,
        availabilityBaselineReady: false,
      },
      global: mountOptions(),
    });

    expect(wrapper.findAll("[data-booking-edit-impact-warning='true']")).toHaveLength(0);
    const normalizedAvailability = wrapper.emitted("availability-baseline-ready")?.[0]?.[0];
    expect(normalizedAvailability).toEqual({
      weeklyAvailability: wrapper.vm.formData.weeklyAvailability,
      monthlyAvailability: wrapper.vm.formData.monthlyAvailability,
      oneTimeAvailability: wrapper.vm.formData.oneTimeAvailability,
    });

    const baseline = {
      ...rawBaseline,
      ...JSON.parse(JSON.stringify(normalizedAvailability)),
    };
    await wrapper.setProps({
      editBaseline: baseline,
      availabilityBaselineReady: true,
    });
    expect(wrapper.findAll("[data-booking-edit-impact-warning='true']")).toHaveLength(0);

    wrapper.vm.formData.eventTitle = "Updated title";
    await nextTick();
    expect(wrapper.findAll("[data-booking-edit-impact-warning='true']")).toHaveLength(1);

    wrapper.vm.formData.eventTitle = "Original title";
    await nextTick();
    expect(wrapper.findAll("[data-booking-edit-impact-warning='true']")).toHaveLength(0);

    const originalMonthlyStart = wrapper.vm.formData.monthlyAvailability[0].startTime;
    wrapper.vm.formData.monthlyAvailability[0].startTime = "00:30";
    await nextTick();
    expect(wrapper.find("[data-test='availability-edit-impact-warning']").exists()).toBe(false);

    wrapper.vm.formData.weeklyAvailability[0].slots[0].startTime = "09:30";
    await nextTick();
    expect(wrapper.findAll("[data-test='availability-edit-impact-warning']")).toHaveLength(1);
    expect(wrapper.findAll("[data-booking-edit-impact-warning='true']")).toHaveLength(1);

    wrapper.vm.formData.weeklyAvailability[0].slots[0].startTime = "09:00";
    await nextTick();
    expect(wrapper.find("[data-test='availability-edit-impact-warning']").exists()).toBe(false);

    wrapper.vm.formData.dateFrom = "2026-08-02";
    await nextTick();
    expect(wrapper.findAll("[data-test='availability-edit-impact-warning']")).toHaveLength(1);

    wrapper.vm.formData.dateFrom = "2026-08-01";
    await nextTick();
    expect(wrapper.find("[data-test='availability-edit-impact-warning']").exists()).toBe(false);

    wrapper.vm.formData.repeatRule = "monthly";
    await nextTick();
    expect(wrapper.findAll("[data-test='availability-edit-impact-warning']")).toHaveLength(1);

    wrapper.vm.formData.monthlyAvailability[0].startTime = "00:30";
    await nextTick();
    expect(wrapper.findAll("[data-test='availability-edit-impact-warning']")).toHaveLength(1);

    wrapper.vm.formData.monthlyAvailability[0].startTime = originalMonthlyStart;
    await nextTick();
    expect(wrapper.findAll("[data-test='availability-edit-impact-warning']")).toHaveLength(1);

    wrapper.vm.formData.repeatRule = "weekly";
    await nextTick();
    expect(wrapper.find("[data-test='availability-edit-impact-warning']").exists()).toBe(false);

    const originalRecurringDateRange = {
      dateFrom: wrapper.vm.formData.dateFrom,
      dateTo: wrapper.vm.formData.dateTo,
    };
    wrapper.vm.formData.repeatRule = "doesNotRepeat";
    await nextTick();
    expect(wrapper.findAll("[data-test='availability-edit-impact-warning']")).toHaveLength(1);
    expect(wrapper.findAll("[data-booking-edit-impact-warning='true']")).toHaveLength(1);

    wrapper.vm.formData.oneTimeAvailability[0].date = "2026-09-01";
    await nextTick();
    expect(wrapper.findAll("[data-test='availability-edit-impact-warning']")).toHaveLength(1);

    wrapper.vm.formData.repeatRule = "weekly";
    await nextTick();
    expect(wrapper.vm.formData.dateFrom).toBe(originalRecurringDateRange.dateFrom);
    expect(wrapper.vm.formData.dateTo).toBe(originalRecurringDateRange.dateTo);
    expect(wrapper.find("[data-test='availability-edit-impact-warning']").exists()).toBe(false);
  });

  it("clears the calendar warning after an unchanged original custom schedule round trip", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const initialState = {
      eventType: "1on1-call",
      repeatRule: "doesNotRepeat",
      oneTimeAvailability: [{
        id: "date_original",
        date: "2026-09-10",
        slots: [{ startTime: "12:00", endTime: "15:00", offHours: false }],
      }],
    };
    const normalizationWrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine(JSON.parse(JSON.stringify(initialState))),
        bookingType: "private",
      },
      global: mountOptions(),
    });
    const baseline = JSON.parse(JSON.stringify(normalizationWrapper.vm.formData));
    normalizationWrapper.unmount();

    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine(JSON.parse(JSON.stringify(baseline))),
        bookingType: "private",
        isEditMode: true,
        editBaseline: baseline,
        availabilityBaselineReady: true,
      },
      global: mountOptions(),
    });

    expect(wrapper.find("[data-test='availability-edit-impact-warning']").exists()).toBe(false);

    wrapper.vm.formData.repeatRule = "weekly";
    await nextTick();
    expect(wrapper.findAll("[data-test='availability-edit-impact-warning']")).toHaveLength(1);

    wrapper.vm.formData.repeatRule = "doesNotRepeat";
    await nextTick();
    expect(wrapper.find("[data-test='availability-edit-impact-warning']").exists()).toBe(false);
  });

  it("preserves the normalized availability baseline when step 1 remounts", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const baseline = {
      eventType: "1on1-call",
      repeatRule: "weekly",
      weeklyAvailability: [
        {
          key: "sun",
          name: "Sun",
          unavailable: false,
          offHours: false,
          slots: [{ startTime: "09:00", endTime: "10:00", offHours: false }],
        },
        ...["mon", "tue", "wed", "thu", "fri", "sat"].map((key) => ({
          key,
          name: key.charAt(0).toUpperCase() + key.slice(1),
          unavailable: true,
          offHours: false,
          slots: [],
        })),
      ],
      monthlyAvailability: [{ startTime: "00:00", endTime: "03:00", offHours: false }],
      oneTimeAvailability: [{
        id: "date_edit_0",
        date: "2026-05-07",
        slots: [{ startTime: "12:00", endTime: "15:00", offHours: false }],
      }],
    };
    const engine = createEngine({
      ...JSON.parse(JSON.stringify(baseline)),
      weeklyAvailability: JSON.parse(JSON.stringify(baseline.weeklyAvailability)),
    });
    engine.state.weeklyAvailability[0].slots[0].startTime = "09:30";

    const wrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine,
        bookingType: "private",
        isEditMode: true,
        editBaseline: baseline,
        availabilityBaselineReady: true,
      },
      global: mountOptions(),
    });

    expect(wrapper.emitted("availability-baseline-ready")).toBeUndefined();
    expect(wrapper.findAll("[data-test='availability-edit-impact-warning']")).toHaveLength(1);
  });

  it("uses the specialized translated edit warning for private and group base prices", async () => {
    const { default: OneOnOneBookinStep1 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue"
    );
    const translations = {
      booking_base_price_future_bookings_warning: "Translated base-price warning",
      booking_future_bookings_warning: "Translated general warning",
      booking_updated_badge: "TRANSLATED UPDATED",
    };

    function createNormalizedBaseline(state, bookingType) {
      const normalizationWrapper = shallowMount(OneOnOneBookinStep1, {
        props: {
          engine: createEngine(JSON.parse(JSON.stringify(state))),
          bookingType,
        },
        global: mountOptions(translations),
      });
      const baseline = JSON.parse(JSON.stringify(normalizationWrapper.vm.formData));
      normalizationWrapper.unmount();
      return baseline;
    }

    const privateBaseline = createNormalizedBaseline({
      eventType: "1on1-call",
      eventTitle: "Private event",
      basePrice: "100",
    }, "private");
    const privateWrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine(JSON.parse(JSON.stringify(privateBaseline))),
        bookingType: "private",
        isEditMode: true,
        editBaseline: privateBaseline,
        availabilityBaselineReady: true,
      },
      global: mountOptions(translations),
    });

    expect(privateWrapper.find("[data-test='base-price-updated-indicator']").exists()).toBe(false);

    privateWrapper.vm.formData.basePrice = "125";
    await settleValidation();
    await privateWrapper.vm.revealStep1ValidationErrors([
      { field: "basePrice", translationKey: "booking_validation_base_price_required" },
    ], { scroll: false });

    expect(privateWrapper.findAll("[data-booking-edit-impact-warning='true']")).toHaveLength(1);
    expect(privateWrapper.get("[data-booking-edit-impact-warning='true']").text())
      .toContain("Translated base-price warning");
    expect(privateWrapper.get("[data-test='base-price-updated-indicator']").text())
      .toContain("TRANSLATED UPDATED");
    expect(privateWrapper.get("[data-booking-validation-warning='true']").text())
      .toContain("Base price is required.");

    privateWrapper.vm.formData.basePrice = "100";
    await settleValidation();
    expect(privateWrapper.find("[data-booking-edit-impact-warning='true']").exists()).toBe(false);
    expect(privateWrapper.find("[data-test='base-price-updated-indicator']").exists()).toBe(false);

    privateWrapper.vm.formData.eventTitle = "Updated private event";
    await settleValidation();
    expect(privateWrapper.get("[data-booking-edit-impact-warning='true']").text())
      .toContain("Translated general warning");
    expect(privateWrapper.find("[data-test='base-price-updated-indicator']").exists()).toBe(false);

    const createWrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine(JSON.parse(JSON.stringify(privateBaseline))),
        bookingType: "private",
      },
      global: mountOptions(translations),
    });
    createWrapper.vm.formData.basePrice = "125";
    await settleValidation();
    expect(createWrapper.find("[data-test='base-price-updated-indicator']").exists()).toBe(false);

    const groupBaseline = createNormalizedBaseline({
      eventType: "group-event",
      eventTitle: "Group event",
      priceSetting: "fixedPricePerUser",
      basePrice: "200",
    }, "group");
    const groupWrapper = shallowMount(OneOnOneBookinStep1, {
      props: {
        engine: createEngine(JSON.parse(JSON.stringify(groupBaseline))),
        bookingType: "group",
        isEditMode: true,
        editBaseline: groupBaseline,
        availabilityBaselineReady: true,
      },
      global: mountOptions(translations),
    });

    expect(groupWrapper.find("[data-test='base-price-updated-indicator']").exists()).toBe(false);

    groupWrapper.vm.formData.basePrice = "250";
    await settleValidation();
    expect(groupWrapper.findAll("[data-booking-edit-impact-warning='true']")).toHaveLength(1);
    expect(groupWrapper.get("[data-booking-edit-impact-warning='true']").text())
      .toContain("Translated base-price warning");
    expect(groupWrapper.get("[data-test='base-price-updated-indicator']").text())
      .toContain("TRANSLATED UPDATED");

    await groupWrapper.setProps({ pricingLocked: true });
    expect(groupWrapper.find("[data-booking-edit-impact-warning='true']").exists()).toBe(false);
    expect(groupWrapper.find("[data-test='base-price-updated-indicator']").exists()).toBe(false);

    await groupWrapper.setProps({ pricingLocked: false });
    groupWrapper.vm.formData.priceSetting = "eventGoal";
    await settleValidation();
    expect(groupWrapper.find("[data-test='base-price-updated-indicator']").exists()).toBe(false);
  });

  it("adds step 2 edit-impact warnings without using validation markers", async () => {
    const { default: OneOnOneBookinStep2 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep2.vue"
    );
    const engine = createEngine({ eventType: "1on1-call", recordingPrice: "20" });
    engine.validate = vi.fn(() => Promise.resolve({
      valid: false,
      errors: [
        { field: "recordingPrice", translationKey: "booking_validation_recording_price_min" },
      ],
    }));
    const wrapper = shallowMount(OneOnOneBookinStep2, {
      props: {
        engine,
        bookingType: "private",
      },
      global: mountOptions({
        booking_future_bookings_warning: "Translated future-bookings warning",
      }),
    });
    const baseline = JSON.parse(JSON.stringify(wrapper.vm.formData));
    await wrapper.setProps({ isEditMode: true, editBaseline: baseline });

    wrapper.vm.formData.recordingPrice = "25";
    await nextTick();
    await wrapper.vm.revealStep2ValidationErrors(
      [{ field: "recordingPrice", translationKey: "booking_validation_recording_price_min" }],
      { scroll: false },
    );
    await settleValidation();

    const editWarning = wrapper.get("[data-booking-edit-impact-warning='true']");
    expect(editWarning.text()).toContain("Translated future-bookings warning");
    expect(editWarning.attributes("data-booking-validation-warning")).toBeUndefined();
    expect(wrapper.get("[data-booking-validation-warning='true']").text())
      .toContain("Recording price must be 0 or higher.");

    wrapper.vm.formData.recordingPrice = "20";
    await nextTick();
    expect(wrapper.find("[data-booking-edit-impact-warning='true']").exists()).toBe(false);
  });

  it("keeps add-on edit-impact warnings beside edited fields without a structural warning", async () => {
    const { default: OneOnOneBookinStep2 } = await import(
      "@/components/ui/form/BookingForm/OneOnOneBookinStep2.vue"
    );
    const initialState = {
      eventType: "1on1-call",
      addOns: [{ title: "VIP setup", description: "Original details", priceTokens: "25" }],
    };
    const normalizationWrapper = shallowMount(OneOnOneBookinStep2, {
      props: {
        engine: createEngine(JSON.parse(JSON.stringify(initialState))),
        bookingType: "private",
      },
      global: mountOptions(),
    });
    const baseline = JSON.parse(JSON.stringify(normalizationWrapper.vm.formData));
    normalizationWrapper.unmount();

    const wrapper = shallowMount(OneOnOneBookinStep2, {
      props: {
        engine: createEngine(JSON.parse(JSON.stringify(baseline))),
        bookingType: "private",
        isEditMode: true,
        editBaseline: JSON.parse(JSON.stringify(baseline)),
      },
      global: mountOptions({
        booking_future_bookings_warning: "Translated future-bookings warning",
      }),
    });

    const editWarnings = () => wrapper.findAll("[data-booking-edit-impact-warning='true']");

    expect(editWarnings()).toHaveLength(0);

    wrapper.vm.formData.addOns[0].title = "Updated VIP setup";
    await nextTick();
    expect(editWarnings()).toHaveLength(1);
    expect(editWarnings()[0].text()).toContain("Translated future-bookings warning");

    wrapper.vm.formData.addOns[0].title = "VIP setup";
    wrapper.vm.formData.addOns[0].description = "Updated details";
    await nextTick();
    expect(editWarnings()).toHaveLength(1);

    wrapper.vm.formData.addOns[0].description = "Original details";
    wrapper.vm.formData.addOns[0].priceTokens = "30";
    await nextTick();
    expect(editWarnings()).toHaveLength(1);

    wrapper.vm.formData.addOns[0].priceTokens = "25";
    await nextTick();
    expect(editWarnings()).toHaveLength(0);

    wrapper.vm.addAddOnService();
    await nextTick();
    expect(wrapper.vm.formData.addOns).toHaveLength(2);
    expect(editWarnings()).toHaveLength(0);

    wrapper.vm.formData.addOns[1].title = "New service";
    await nextTick();
    expect(editWarnings()).toHaveLength(1);

    wrapper.vm.removeAddOnService(1);
    await nextTick();
    expect(wrapper.vm.formData.addOns).toHaveLength(1);
    expect(editWarnings()).toHaveLength(0);

    wrapper.vm.removeAddOnService(0);
    await nextTick();
    expect(wrapper.vm.formData.addOns).toHaveLength(0);
    expect(editWarnings()).toHaveLength(0);

    const createWrapper = shallowMount(OneOnOneBookinStep2, {
      props: {
        engine: createEngine(JSON.parse(JSON.stringify(baseline))),
        bookingType: "private",
      },
      global: mountOptions(),
    });
    createWrapper.vm.formData.addOns[0].title = "Create-mode update";
    await nextTick();
    expect(createWrapper.find("[data-booking-edit-impact-warning='true']").exists()).toBe(false);
  });

  it("shows and clears edit-impact warnings for popup-local X message changes", async () => {
    const { default: TwitterRepostSettings } = await import(
      "@/components/ui/popup/TwitterRepostSettings.vue"
    );
    const wrapper = mount(TwitterRepostSettings, {
      props: {
        isEditMode: true,
        messageValue: "Original message",
        baselineMessageValue: "Original message",
      },
      global: mountOptions({
        booking_future_bookings_warning: "Translated future-bookings warning",
      }),
    });

    expect(wrapper.find("[data-booking-edit-impact-warning='true']").exists()).toBe(false);

    await wrapper.get("textarea").setValue("Updated message");
    expect(wrapper.get("[data-booking-edit-impact-warning='true']").text())
      .toContain("Translated future-bookings warning");

    await wrapper.get("textarea").setValue("Original message");
    expect(wrapper.find("[data-booking-edit-impact-warning='true']").exists()).toBe(false);
  });
});
