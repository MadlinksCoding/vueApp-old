import { shallowMount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { bookingTranslationSymbol, createBookingTranslator } from "@/i18n/bookingTranslations.js";

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

describe("one-on-one booking step translations", () => {
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
    });

    expect(wrapper.text()).toContain("Vista previa");
    expect(wrapper.text()).toContain("Imagen del evento");
    expect(wrapper.text()).toContain("Subir archivo");
    expect(wrapper.text()).toContain("Duracion de sesion");
    expect(wrapper.text()).toContain("Duracion");
    expect(wrapper.text()).toContain("Marcar fuera de horario");
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
});
