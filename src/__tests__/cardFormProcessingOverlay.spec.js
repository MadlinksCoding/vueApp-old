import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import CardForm from "@/components/FanBookingFlow/HelperComponents/CardForm.vue";

describe("CardForm processing overlay", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    delete window.custom_checkout_params;
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

  it("keeps the saved card selected and restores its payment mode after a reload", async () => {
    const card = { id: 3, last4: '0091' };
    window.custom_checkout_params = { payment_details: [card], payment_detail: card, payment_method: 'new_card' };
    const wrapper = mountCardForm();
    wrapper.vm.syncSavedCards();
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.getPaymentExtraFields()).toEqual({ payment_method: 'token', token_id: 3 });
    window.custom_checkout_params = { ...window.custom_checkout_params, payment_method: 'new_card' };
    wrapper.vm.syncSavedCards();
    await wrapper.vm.$nextTick();
    expect(window.custom_checkout_params.payment_method).toBe('token');
    expect(wrapper.vm.getPaymentExtraFields()).toEqual({ payment_method: 'token', token_id: 3 });
    expect(wrapper.get('[data-card-dark-ui]').isVisible()).toBe(false);
    wrapper.unmount();
  });

  it("retains an explicit new-card choice when a form reload returns saved cards", async () => {
    const card = { id: 3, last4: '0091' };
    window.custom_checkout_params = { payment_details: [card], payment_detail: card };
    const wrapper = mountCardForm();
    wrapper.vm.syncSavedCards();
    // Use the existing rendered widget so choosing a new card needs no API call.
    wrapper.vm.paymentContainer.innerHTML = '<form class="wpwl-form"></form>';
    await wrapper.setProps({ currentOrderId: 7001 });
    await wrapper.get('button').trigger('click');
    await wrapper.get('span.text-\\[\\#07F468\\]').trigger('click');
    window.custom_checkout_params.payment_method = 'token';
    wrapper.vm.syncSavedCards();
    await wrapper.vm.$nextTick();
    expect(window.custom_checkout_params.payment_method).toBe('new_card');
    expect(wrapper.vm.getPaymentExtraFields()).toEqual({ payment_method: 'new_card', token_id: '' });
    expect(wrapper.get('[data-card-dark-ui]').element.style.display).not.toBe('none');
    wrapper.unmount();
  });

  it("does not submit a saved card removed by an account or card-list refresh", async () => {
    const card = { id: 3, last4: '0091' };
    window.custom_checkout_params = { payment_details: [card], payment_detail: card };
    const wrapper = mountCardForm();
    wrapper.vm.syncSavedCards();
    window.custom_checkout_params = { payment_details: [], payment_method: 'token' };
    wrapper.vm.syncSavedCards();
    await wrapper.vm.$nextTick();
    expect(window.custom_checkout_params.payment_method).toBe('new_card');
    expect(wrapper.vm.getPaymentExtraFields()).toEqual({ payment_method: 'new_card', token_id: '' });
    expect(wrapper.vm.canPay).toBe(false);
    wrapper.unmount();
  });

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
