import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import CardForm from "@/components/FanBookingFlow/HelperComponents/CardForm.vue";

describe("CardForm processing overlay", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  function mountCardForm() {
    return mount(CardForm, {
      attachTo: document.body,
      global: {
        stubs: {
          PaymentMethodLoggedIn: true,
        },
      },
    });
  }

  it("keeps the existing payment processing presentation by default", async () => {
    const wrapper = mountCardForm();

    wrapper.vm.setProcessingPayment(true);
    await wrapper.vm.$nextTick();

    const overlay = document.body.querySelector("[data-testid='payment-processing-overlay']");
    expect(overlay?.getAttribute("data-processing-mode")).toBe("payment");
    expect(document.body.querySelector("[data-testid='payment-processing-content']")).not.toBeNull();
    expect(document.body.querySelector("[data-testid='balance-sync-spinner']")).toBeNull();
    expect(overlay?.textContent).toContain("Processing");

    wrapper.unmount();
  });

  it("shows only a spinner during balance synchronization and dismisses it", async () => {
    const wrapper = mountCardForm();

    wrapper.vm.setProcessingPayment(true, "balance-sync");
    await wrapper.vm.$nextTick();

    const overlay = document.body.querySelector("[data-testid='payment-processing-overlay']");
    expect(overlay?.getAttribute("data-processing-mode")).toBe("balance-sync");
    expect(document.body.querySelector("[data-testid='balance-sync-spinner']")).not.toBeNull();
    expect(document.body.querySelector("[data-testid='payment-processing-content']")).toBeNull();
    expect(overlay?.querySelector("iframe")).toBeNull();
    expect(overlay?.textContent?.trim()).toBe("");

    wrapper.vm.setProcessingPayment(false);
    await wrapper.vm.$nextTick();
    expect(document.body.querySelector("[data-testid='payment-processing-overlay']")).toBeNull();

    wrapper.unmount();
  });
});
