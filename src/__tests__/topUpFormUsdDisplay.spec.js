import { shallowMount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import TopUpForm from "@/components/FanBookingFlow/HelperComponents/TopUpForm.vue";

describe("TopUpForm USD display", () => {
  beforeEach(() => {
    localStorage.clear();
    window.userData = { userID: 2615 };
  });

  afterEach(() => {
    localStorage.clear();
    window.userData = undefined;
  });

  it("keeps live token controls and summaries without live USD payment rows", () => {
    const wrapper = shallowMount(TopUpForm, {
      props: {
        walletBalance: 200,
        topUpAmount: 300,
        totalPrice: 450,
        remainingBalance: 50,
      },
      global: {
        stubs: {
          CardForm: {
            template: "<div />",
            methods: {
              setProcessingPayment() {},
            },
          },
        },
      },
    });

    const amountInput = wrapper.get('input[type="number"]');
    const renderedText = wrapper.text();

    expect(amountInput.element.value).toBe("300");
    expect(wrapper.get('[data-testid="top-up-usd-display"]').text()).toBe("≈ USD$ 32.97");
    expect(renderedText).toContain("Original balance");
    expect(renderedText).toContain("Balance after top up");
    expect(renderedText).toContain("Your Contribution");
    expect(renderedText).toContain("Amount Due Today");
    expect(renderedText).not.toContain("Top up payment");

    wrapper.unmount();
  });

  it("uses the selected top-up amount for the balance after booking", () => {
    const wrapper = shallowMount(TopUpForm, {
      props: {
        walletBalance: 146,
        topUpAmount: 100,
        totalPrice: 201,
        remainingBalance: 0,
      },
      global: {
        stubs: {
          CardForm: {
            template: "<div />",
            methods: {
              setProcessingPayment() {},
            },
          },
        },
      },
    });

    expect(wrapper.get('[data-testid="top-up-balance-after-booking"]').text()).toBe("45");

    wrapper.unmount();
  });

  it("shows zero when the selected top-up exactly covers the shortfall", () => {
    const wrapper = shallowMount(TopUpForm, {
      props: {
        walletBalance: 146,
        topUpAmount: 55,
        totalPrice: 201,
        remainingBalance: 0,
      },
      global: {
        stubs: {
          CardForm: {
            template: "<div />",
            methods: {
              setProcessingPayment() {},
            },
          },
        },
      },
    });

    expect(wrapper.get('[data-testid="top-up-balance-after-booking"]').text()).toBe("0");

    wrapper.unmount();
  });
});
