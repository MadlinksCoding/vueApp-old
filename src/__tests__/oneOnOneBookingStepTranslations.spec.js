import { shallowMount } from "@vue/test-utils";
import { nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bookingTranslationSymbol, createBookingTranslator } from "@/i18n/bookingTranslations.js";

let sendBeaconDescriptor;

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
        props: ["placeholder"],
        template: "<input :placeholder='placeholder' />",
      },
      ButtonComponent: {
        props: ["text"],
        template: "<button>{{ text }}</button>",
      },
      CheckboxGroup: {
        props: ["label"],
        template: "<label><span>{{ label }}</span><slot name='label' /></label>",
      },
      CheckboxSwitch: {
        props: ["label", "wrapperLabel"],
        template: "<label><span>{{ label }}</span><span>{{ wrapperLabel }}</span></label>",
      },
      CustomDropdown: {
        props: ["options"],
        template: "<div><span v-for='option in options' :key='option.value'>{{ option.label }}</span></div>",
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
    },
  };
}

function findSectionByTitle(wrapper, title) {
  return wrapper.findAll("section").find((section) => section.find("h2").text() === title);
}

describe("one-on-one booking step translations", () => {
  beforeEach(() => {
    sendBeaconDescriptor = Object.getOwnPropertyDescriptor(navigator, "sendBeacon");
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
  });

  afterEach(() => {
    if (sendBeaconDescriptor) {
      Object.defineProperty(navigator, "sendBeacon", sendBeaconDescriptor);
    } else {
      delete navigator.sendBeacon;
    }
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
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
        booking_preview: "Vista previa",
        booking_event_image: "Imagen del evento",
        booking_upload_click: "Subir archivo",
        booking_session_duration: "Duracion de sesion",
        booking_duration: "Duracion",
        booking_mark_off_hours: "Marcar fuera de horario",
      }),
      attachTo: document.body,
    });

    expect(wrapper.text()).toContain("Vista previa");
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
