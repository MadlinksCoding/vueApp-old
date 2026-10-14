import { mount, flushPromises } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import EventTipMenu from "@/components/ui/form/BookingForm/EventTipMenu.vue";
import { bookingTranslationSymbol, createBookingTranslator } from "@/i18n/bookingTranslations.js";

let wrapper;
let mobile = false;

beforeEach(() => {
  mobile = false;
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: mobile, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: "success", results: [] }) }));
});

afterEach(() => {
  wrapper?.unmount();
  vi.unstubAllGlobals();
});

function render(translations = {}, modelValue = [], creatorId = 1407) {
  const translator = createBookingTranslator({ translations });
  wrapper = mount(EventTipMenu, {
    props: { modelValue, creatorId },
    global: { provide: { [bookingTranslationSymbol]: translator }, stubs: { teleport: true } },
  });
  return translator;
}

describe("event tip menu translations", () => {
  it("translates the editor, accessibility labels and unsaved warning, including live updates", async () => {
    const translator = render({
      booking_tip_menu_title: "Menú de propinas",
      booking_tip_menu_tip_item: "PROPINA",
      booking_tip_menu_add_item: "Añadir propina",
      booking_tip_menu_item_description: "Descripción",
      booking_tip_menu_tip_amount: "Cantidad",
      booking_tip_menu_unsaved_item: "Guarda o cancela la propina.",
      common_cancel: "Cancelar",
    });
    expect(wrapper.text()).toContain("Menú de propinas");
    await wrapper.get(".tip-button-dark").trigger("click");
    expect(wrapper.get("h3").text()).toBe("Añadir propina");
    expect(wrapper.get("input[maxlength]").attributes("placeholder")).toBe("Descripción");
    expect(wrapper.get("input[max='1000000']").attributes("aria-label")).toBe("Cantidad");
    expect(wrapper.get(".tip-cancel").text()).toBe("Cancelar");
    expect(wrapper.vm.beforeLeave()).toBe(false);
    await flushPromises();
    expect(wrapper.get("[role='alert']").text()).toBe("Guarda o cancela la propina.");
    translator.setTranslations({ booking_tip_menu_unsaved_item: "Avertissement traduit" });
    await flushPromises();
    expect(wrapper.get("[role='alert']").text()).toBe("Avertissement traduit");
    expect(wrapper.get("h3").text()).toBe("Add Tip Item");
  });

  it("interpolates saved prize summaries and action labels without translating creator content", async () => {
    render({
      booking_tip_menu_billing_cycle: "{count} ciclo",
      booking_tip_menu_billing_cycles: "{count} ciclos",
      booking_tip_menu_edit_item_aria: "Editar {title}",
      booking_tip_menu_delete_item_aria: "Eliminar {title}",
      booking_tip_menu_edit_item: "Editar propina",
      booking_tip_menu_save: "GUARDAR",
    }, [1, 3].map(count => ({ itemId: `ti_${count}`, title: `VIP ${count}`, tokens: 30, prize: { type: "subscription", planId: 12, planTitle: "Creator tier", billingCycles: count } })));
    expect(wrapper.findAll(".tip-prize-summary").map(item => item.text())).toEqual(["Creator tier · 1 ciclo", "Creator tier · 3 ciclos"]);
    expect(wrapper.get("button[aria-label='Eliminar VIP 1']").exists()).toBe(true);
    await wrapper.get("button[aria-label='Editar VIP 1']").trigger("click");
    await flushPromises();
    expect(wrapper.get("h3").text()).toBe("Editar propina");
    expect(wrapper.get(".tip-button-green").text()).toBe("GUARDAR");
    expect(wrapper.get("input[maxlength]").element.value).toBe("VIP 1");
    expect(wrapper.text()).toContain("Creator tier");
  });

  it.each([
    ["p2v", "media", "Vídeos"],
    ["merch", "merch", "Productos"],
  ])("translates the mobile %s library and selection controls", async (type, key, label) => {
    mobile = true;
    fetch.mockResolvedValue({ ok: true, json: async () => ({ status: "success", results: [{ id: 10, title: "Creator item", price: 5, p2v: { price: 5 }, is_p2v: true, gallery_count: 3 }] }) });
    render({
      [`booking_tip_menu_choose_${key}`]: `Elegir ${label}`,
      [`booking_tip_menu_search_${key}`]: `Buscar ${label}`,
      [`booking_tip_menu_search_${key}_placeholder`]: `Buscar ${label}…`,
      [`booking_tip_menu_${key}_library`]: `Biblioteca de ${label}`,
      [`booking_tip_menu_change_${key}`]: `Cambiar ${label}`,
      booking_tip_menu_photo_count: "{count} fotos",
      booking_tip_menu_usd_price: "{amount} USD",
      booking_tip_menu_selected: "Seleccionado",
      booking_tip_menu_confirm: "Confirmar",
    });
    await wrapper.get(".tip-button-dark").trigger("click");
    await wrapper.get("input[type='checkbox']").setValue(true);
    await flushPromises();
    await wrapper.get("select").setValue(type);
    await wrapper.get(".tip-library-actions .tip-button").trigger("click");
    await flushPromises();
    expect(wrapper.get("h3").text()).toBe(`Elegir ${label}`);
    expect(wrapper.get(".tip-search input").attributes()).toMatchObject({ "aria-label": `Buscar ${label}`, placeholder: `Buscar ${label}…` });
    expect(wrapper.get(".tip-library-list").attributes("aria-label")).toBe(`Biblioteca de ${label}`);
    if (type === "p2v") expect(wrapper.get(".tip-media-badge").text()).toBe("3");
    await wrapper.get(type === "merch" ? ".tip-merch-card" : ".tip-library-card").trigger("click");
    if (type === "p2v") expect(wrapper.get(".tip-select-badge").text()).toBe("Seleccionado");
    else expect(wrapper.get(".tip-merch-card").attributes("aria-pressed")).toBe("true");
    expect(wrapper.get(".tip-button-green").text()).toBe("Confirmar");
    await wrapper.get(".tip-button-green").trigger("click");
    expect(wrapper.get(".tip-button-small").text()).toBe(`Cambiar ${label}`);
    expect(wrapper.get(".tip-selected-card").text()).toContain("5 USD");
  });

  it.each([
    [null, true, "booking_tip_menu_creator_missing"],
    [1407, false, "booking_tip_menu_library_load_failed_retry"],
  ])("translates local prize-library failures for creator %s", async (creatorId, ok, key) => {
    fetch.mockResolvedValue({ ok });
    const translator = render({ [key]: "Error traducido", booking_tip_menu_try_again: "Reintentar" }, [], creatorId);
    await wrapper.get(".tip-button-dark").trigger("click");
    await wrapper.get("input[type='checkbox']").setValue(true);
    await flushPromises();
    expect(wrapper.get("[role='alert']").text()).toBe("Error traducido Reintentar");
    translator.setTranslations({ [key]: "Erreur traduite" });
    await flushPromises();
    expect(wrapper.get("[role='alert']").text()).toBe("Erreur traduite Try again");
  });
});
