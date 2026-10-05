import { flushPromises, shallowMount as shallowMountComponent } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TopUpForm from "@/components/FanBookingFlow/HelperComponents/TopUpForm.vue";
import GuestCheckoutForm from "@/components/FanBookingFlow/HelperComponents/GuestCheckoutForm.vue";
import { subscriptionSwitchReviewKey } from "@/components/FanBookingFlow/HelperComponents/SubscriptionSwitchConfirmation.vue";

// Render the shared notice while keeping payment/network children stubbed.
function shallowMount(component, options = {}) {
  return shallowMountComponent(component, { ...options, global: {
    ...options.global,
    stubs: { SubscriptionSwitchConfirmation: false, ...options.global?.stubs },
  } });
}

describe("TopUpForm USD display", () => {
  beforeEach(() => {
    localStorage.clear();
    window.userData = { userID: 2615 };
  });

  afterEach(() => {
    localStorage.clear();
    window.userData = undefined;
    window.custom_checkout_params = undefined;
  });

  it('uses the existing guest email/login form with prerequisite order context', async () => {
    const originalFetch = window.fetch;
    window.userData = { userID: 0 };
    vi.useFakeTimers();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ json: async () => ({ success: true }) })
      .mockResolvedValueOnce({ json: async () => ({ success: true, userData: { userID: 2615, userEmail: 'fan@example.test' } }) });
    window.fetch = fetchMock;
    const wrapper = shallowMount(GuestCheckoutForm, {
      props: { orderId: 7001, checkoutContext: { booking_prerequisite_checkout: 1, order_key: 'guest_key', tip_checkout_popup: 0, is_buy_now: 1, items: [{ product_id: 93, quantity: 1 }] } },
    });
    try {
      expect(wrapper.find('input[type="password"]').exists()).toBe(false);
      await wrapper.get('input[type="email"]').setValue('fan@example.test');
      await vi.advanceTimersByTimeAsync(1000);
      await flushPromises();
      expect(wrapper.vm.requiresLogin).toBe(true);
      await wrapper.get('input[type="password"]').setValue('mock-password');
      await wrapper.get('button').trigger('click');
      await flushPromises();
      const [url, { body }] = fetchMock.mock.calls[1];
      expect(url).toContain('fs_guest_checkout_login');
      expect(body.get('order_id')).toBe('7001');
      expect(body.get('booking_prerequisite_checkout')).toBe('1');
      expect(body.get('order_key')).toBe('guest_key');
      expect(body.get('tip_checkout_popup')).toBe('0');
      expect(JSON.parse(body.get('items'))).toEqual([{ product_id: 93, quantity: 1 }]);
      expect(wrapper.emitted('login')[0][0].userData.userID).toBe(2615);
      expect(wrapper.vm.requiresLogin).toBe(false);
    } finally {
      wrapper.unmount();
      vi.clearAllTimers();
      vi.useRealTimers();
      window.fetch = originalFetch;
    }
  });

  it('shows a retryable error when logout returns an invalid response', async () => {
    const originalFetch = window.fetch;
    window.fetch = vi.fn().mockResolvedValue({ json: async () => { throw new Error('Invalid JSON'); } });
    const wrapper = shallowMount(GuestCheckoutForm);
    try {
      await wrapper.get('button').trigger('click');
      await flushPromises();
      expect(wrapper.text()).toContain('Log out');
      expect(wrapper.text()).toContain('Logout failed.');
      expect(wrapper.emitted('logout')).toBeUndefined();
      expect(wrapper.vm.requiresLogin).toBe(false);
    } finally {
      wrapper.unmount();
      window.fetch = originalFetch;
    }
  });

  it('recalculates the token shortfall after prerequisite checkout logout', async () => {
    const OriginalHandler = window.AxcessGatewayFormHandler;
    class GuestHandler {
      constructor() { this.ready = Promise.resolve(); this.userInfo = {}; }
      async renderForm() { return { orderId: 7001, checkout: { total: 2, requires_shipping: false } }; }
      destroy() {}
    }
    window.AxcessGatewayFormHandler = GuestHandler;
    const prerequisite = { eligible: false, type: 'product', product: { id: 93, title: 'Required product', price: 2 }, checkout: { product_id: 93 } };
    let wrapper;
    const afterAuthUpdate = vi.fn(async () => {
      window.userData = { userID: 0 };
      await wrapper.setProps({ fanId: 0, walletBalance: 0, topUpAmount: 100 });
      return prerequisite;
    });
    wrapper = shallowMount(TopUpForm, {
      props: { fanId: 2615, walletBalance: 30, topUpAmount: 70, totalPrice: 100, remainingBalance: 0, prerequisite, afterAuthUpdate },
      global: { stubs: {
        CardForm: { name: 'CardForm', template: '<div/>', data: () => ({ paymentContainer: document.createElement('div') }), methods: { setProcessingPayment() {}, syncSavedCards() {} } },
        GuestCheckoutForm: { name: 'GuestCheckoutForm', template: '<div/>' },
      } },
    });
    try {
      await flushPromises();
      wrapper.getComponent({ name: 'GuestCheckoutForm' }).vm.$emit('logout', { success: true });
      await flushPromises();
      expect(wrapper.get('input[type="number"]').element.value).toBe('100');
      expect(wrapper.get('[data-testid="top-up-balance-after-booking"]').text()).toBe('0');
    } finally {
      wrapper.unmount();
      window.AxcessGatewayFormHandler = OriginalHandler;
    }
  });

  it.each([false, true])('reloads the same order after cancelled 3DS and allows new-card retry (prerequisite: %s)', async (withPrerequisite) => {
    const OriginalHandler = window.AxcessGatewayFormHandler;
    let failPayment;
    const renderForm = vi.fn(async (_amount, existingOrderId) => ({
      orderId: existingOrderId || 7001,
      checkout: { total: 9.69, requires_shipping: false, token_order_id: 7002 },
    }));
    class RetryHandler {
      constructor(config) {
        failPayment = config.onError;
        this.currentOrderId = 7001;
        this.extraParams = config.extraParams;
        this.ready = Promise.resolve();
        this.userInfo = { email: 'fan@example.test' };
        this.renderForm = renderForm;
      }
      destroyForm() { this.currentOrderId = null; }
      destroy() {}
    }
    window.AxcessGatewayFormHandler = RetryHandler;
    vi.useFakeTimers();
    const afterPrerequisitePayment = vi.fn();
    const wrapper = shallowMount(TopUpForm, {
      props: {
        fanId: 2615, creatorId: 1407, eventId: 'evt_retry',
        walletBalance: 30, topUpAmount: 70, totalPrice: 100, remainingBalance: 0,
        afterPrerequisitePayment,
        prerequisite: withPrerequisite ? { eligible: false, type: 'product', product: { id: 93, price: 2 }, checkout: { product_id: 93 } } : null,
      },
      global: { stubs: {
        CardForm: { template: '<div/>', data: () => ({ canPay: true, paymentContainer: document.createElement('div') }),
          methods: { setProcessingPayment() {}, resetCardValidity() {}, syncSavedCards() {} } },
        GuestCheckoutForm: { template: '<div/>' }, Teleport: true,
      } },
    });
    try {
      await flushPromises();
      failPayment('3DS authentication cancelled');
      await flushPromises();
      expect(wrapper.text()).toContain('3DS authentication cancelled');
      expect(wrapper.emitted('success')).toBeUndefined();
      expect(afterPrerequisitePayment).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(5000);
      await flushPromises();
      expect(renderForm).toHaveBeenLastCalledWith(70, 7001, 'token', { order_id: 7001 });
      expect(wrapper.text()).not.toContain('3DS authentication cancelled');
      expect(wrapper.emitted('payment-failed')).toHaveLength(1);
      expect(wrapper.findAll('button').find(button => /Complete Booking/.test(button.text()))?.attributes('disabled')).toBeUndefined();
    } finally {
      wrapper.unmount();
      vi.clearAllTimers();
      vi.useRealTimers();
      window.AxcessGatewayFormHandler = OriginalHandler;
    }
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
    expect(wrapper.get('[data-testid="top-up-amount-due-usd"]').text()).toBe("=USD$ 32.97");
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

  it("uses a subscription variation title for a media prerequisite in the existing payment step", () => {
    const wrapper = shallowMount(TopUpForm, {
      props: {
        walletBalance: 1000,
        topUpAmount: 0,
        totalPrice: 450,
        remainingBalance: 550,
        eventId: "evt_subscription",
        prerequisite: {
          eligible: false,
          type: "media",
          product: {
            id: 91,
            title: "Variable Subscription Product - Tier 3",
            variation_title: "Close Circle",
            is_subscription_variation: true,
            price: 25,
            image_url: "/close-circle.jpg",
          },
          checkout: { product_id: 90, variation_id: 91 },
          shipping: { required: false },
        },
      },
      global: {
        stubs: {
          CardForm: { template: "<div />", methods: { setProcessingPayment() {} } },
        },
      },
    });

    expect(wrapper.find('input[type="number"]').exists()).toBe(false);
    expect(wrapper.text()).toContain("MANDATORY PURCHASE");
    expect(wrapper.text()).toContain("Close Circle");
    expect(wrapper.text()).not.toContain("Variable Subscription Product - Tier 3");
    expect(wrapper.text()).toContain("USD$ 25.00");
    expect(wrapper.get('[data-testid="top-up-amount-due-today"]').text()).toContain("USD$25.00");
    expect(wrapper.get('[data-testid="top-up-amount-due-today"]').find('img[alt="token-icon"]').exists()).toBe(false);
    expect(wrapper.text()).toContain("Pay & Complete Booking");
    wrapper.unmount();
  });

  it.each([3.49, 0])('uses server switch pricing before checkout loads and order totals afterwards (due: %s)', async (dueToday) => {
    const wrapper = shallowMount(TopUpForm, {
      props: { walletBalance: 1000, topUpAmount: 0, totalPrice: 450, remainingBalance: 550,
        prerequisite: { eligible: false, action: 'switch', type: 'subscription',
          product: { id: 92, title: 'New tier', price: 25 }, subscription: { amount_due_today: dueToday },
          checkout: { product_id: 92, switch_type: 'upgrade' } } },
      global: { stubs: { CardForm: { template: '<div/>', methods: { setProcessingPayment() {} } } } },
    });
    expect(wrapper.vm.prerequisitePrice).toBe(dueToday);
    expect(wrapper.get('[data-testid="top-up-amount-due-today"]').text()).toContain(`USD$${dueToday.toFixed(2)}`);
    expect(wrapper.get('[data-testid="booking-payment-recurring-plan-price"]').text()).toBe('Recurring plan price: USD$25.00');
    wrapper.vm.checkoutDetails = { items: [{ total: 2.75 }], total: 2.75, product_total: 2.75 };
    await flushPromises();
    expect(wrapper.vm.prerequisitePrice).toBe(2.75);
    expect(wrapper.get('[data-testid="top-up-amount-due-today"]').text()).toContain('USD$2.75');
    wrapper.unmount();
  });

  it("keeps token controls visible but prices the prerequisite order separately", () => {
    const wrapper = shallowMount(TopUpForm, {
      props: {
        walletBalance: 100,
        topUpAmount: 350,
        totalPrice: 450,
        remainingBalance: 0,
        prerequisite: {
          eligible: false,
          type: "product",
          product: { id: 92, title: "Required item", price: 12, image_url: "/item.jpg" },
          checkout: { product_id: 92 },
          shipping: { required: false },
        },
      },
      global: {
        stubs: {
          CardForm: { template: "<div />", methods: { setProcessingPayment() {} } },
        },
      },
    });

    expect(wrapper.get('input[type="number"]').element.value).toBe("350");
    expect(wrapper.text()).toContain("Top up amount");
    expect(wrapper.text()).toContain("MANDATORY PURCHASE");
    expect(wrapper.text()).toContain("USD$ 12.00");
    expect(wrapper.text()).toContain("Pay & Complete Booking");
    wrapper.unmount();
  });

  it("submits one combined payment and returns both separate orders without a second charge", async () => {
    const OriginalHandler = window.AxcessGatewayFormHandler;
    const submittedModes = [];
    const renderedModes = [];
    const renderedOrders = [];

    class CheckoutSequenceHandler {
      constructor(config) {
        this.checkoutMode = config.checkoutMode;
        this.extraParams = config.extraParams;
        this.onSuccess = config.onSuccess;
        this.currentOrderId = null;
        this.userInfo = { email: "fan@example.com" };
        this.tip_checkout_params = { config: { min_purchase: 10 } };
        this.ready = Promise.resolve();
      }

      async renderForm(amount, existingOrderId) {
        renderedModes.push(this.checkoutMode);
        renderedOrders.push({ amount, existingOrderId, topupTokens: this.extraParams.booking_topup_tokens });
        this.currentOrderId = this.checkoutMode === "booking-prerequisite" ? 7001 : 7002;
        const topup = amount === 500 ? 55 : 38.5;
        return { orderId: this.currentOrderId, checkout: { total: 12 + topup, topup_usd: topup, token_order_id: 7002, requires_shipping: false } };
      }

      async submitPayment() {
        submittedModes.push(this.checkoutMode);
        const orderId = this.currentOrderId;
        await this.onSuccess({
          payment_type: "payment_success",
          payment_status: "success",
          order_id: orderId,
          token_order_id: 7002,
        });
      }

      destroyForm() { this.currentOrderId = null; }
      destroy() {}
    }

    window.AxcessGatewayFormHandler = CheckoutSequenceHandler;
    window.custom_checkout_params = {
      payment_method: "token",
      user: { email: "fan@example.com" },
    };

    const afterPrerequisitePayment = vi.fn().mockResolvedValue(true);
    const wrapper = shallowMount(TopUpForm, {
      props: {
        walletBalance: 100,
        topUpAmount: 350,
        totalPrice: 450,
        remainingBalance: 0,
        fanId: 2615,
        creatorId: 1407,
        eventId: "evt_sequence",
        afterPrerequisitePayment,
        prerequisite: {
          eligible: false,
          type: "product",
          product: { id: 92, title: "Required item", price: 12, image_url: "/item.jpg" },
          checkout: { product_id: 92 },
          shipping: { required: false },
        },
      },
      global: {
        stubs: {
          CardForm: {
            template: "<div />",
            data: () => ({
              canPay: true,
              paymentContainer: document.createElement("div"),
            }),
            methods: {
              setProcessingPayment() {},
              resetCardValidity() {},
              syncSavedCards() {},
              getPaymentExtraFields() { return { payment_method: "token", token_id: 3 }; },
            },
          },
          GuestCheckoutForm: {
            template: "<div />",
            data: () => ({ requiresLogin: false }),
          },
        },
      },
    });

    try {
      await flushPromises();
      const button = wrapper.findAll("button").find((candidate) => candidate.text().includes("Pay & Complete Booking"));
      expect(button).toBeDefined();
      expect(button.attributes("disabled")).toBeUndefined();
      expect(wrapper.text()).toContain("USD$ 50.50");
      expect(wrapper.get('[data-testid="top-up-amount-due-today"]').text()).toContain("350+USD$12.00");
      expect(wrapper.get('[data-testid="top-up-amount-due-usd"]').text()).toBe("=USD$ 50.50");

      const preset = wrapper.findAll(".cursor-pointer").find((candidate) => candidate.text().trim() === "500");
      expect(preset).toBeDefined();
      await preset.trigger("click");
      await flushPromises();
      expect(renderedOrders).toEqual([
        { amount: 350, existingOrderId: null, topupTokens: 350 },
        { amount: 500, existingOrderId: 7001, topupTokens: 500 },
      ]);
      expect(wrapper.text()).toContain("USD$ 67.00");

      await button.trigger("click");
      await flushPromises();
      await flushPromises();

      expect(afterPrerequisitePayment).toHaveBeenCalledTimes(1);
      expect(renderedModes).toEqual(["booking-prerequisite", "booking-prerequisite"]);
      expect(submittedModes).toEqual(["booking-prerequisite"]);
      expect(wrapper.emitted("success")).toHaveLength(1);
      expect(wrapper.emitted("success")[0][0]).toMatchObject({
        order_id: 7001,
        prerequisite_order_id: 7001,
        token_order_id: 7002,
      });
    } finally {
      wrapper.unmount();
      window.AxcessGatewayFormHandler = OriginalHandler;
    }
  });

  it('finalizes a guest product order even when its fragment already shows an account', async () => {
    const OriginalHandler = window.AxcessGatewayFormHandler;
    const originalFetch = window.fetch;
    let paymentSuccess;
    class GuestProductHandler {
      constructor(config) {
        paymentSuccess = config.onSuccess;
        this.ready = Promise.resolve();
        this.userInfo = {};
        this.tip_checkout_params = { config: { min_purchase: 10 } };
      }
      async renderForm() {
        return { orderId: 7004, checkout: { guest_checkout: true, order_key: 'guest_product_key', total: 2 } };
      }
      destroy() {}
    }
    window.AxcessGatewayFormHandler = GuestProductHandler;
    const authResponse = {
      success: true, userData: { userID: 2615, jwtToken: 'paid_fan_jwt' },
      custom_checkout_params: { wp_rest_nonce: 'paid_session_nonce' },
    };
    window.fetch = vi.fn().mockResolvedValue({ json: async () => authResponse });
    const afterPrerequisitePayment = vi.fn().mockResolvedValue(true);
    const wrapper = shallowMount(TopUpForm, {
      props: {
        fanId: 2615, creatorId: 1407, eventId: 'evt_guest_product',
        walletBalance: 100, topUpAmount: 0, totalPrice: 100, remainingBalance: 0,
        afterPrerequisitePayment,
        prerequisite: { product: { id: 93, price: 2 }, checkout: { product_id: 93 } },
      },
      global: { stubs: {
        CardForm: { template: '<div/>', data: () => ({ paymentContainer: document.createElement('div') }),
          methods: { setProcessingPayment() {}, syncSavedCards() {} } },
        GuestCheckoutForm: { template: '<div/>' },
      } },
    });
    try {
      await flushPromises();
      await paymentSuccess({ order_id: 7004, order_status: 'completed' });
      expect(window.fetch).toHaveBeenCalledWith('/wp-json/api/checkout/after-payment', expect.objectContaining({
        body: JSON.stringify({ order_id: 7004, order_key: 'guest_product_key', profile_user_id: 1407 }),
      }));
      expect(afterPrerequisitePayment).toHaveBeenCalledWith(expect.objectContaining({
        userId: 2615, response: expect.objectContaining({ custom_checkout_params: { wp_rest_nonce: 'paid_session_nonce' } }),
      }));
    } finally {
      wrapper.unmount();
      window.AxcessGatewayFormHandler = OriginalHandler;
      window.fetch = originalFetch;
    }
  });

  it.each([true, false])('authenticates the new fan after token payment following inline logout (parent helper=%s)', async (hasParentHelper) => {
    const OriginalHandler = window.AxcessGatewayFormHandler;
    const originalGuestCheckout = window.guestCheckout;
    const originalFetch = window.fetch;
    let paymentSuccess;
    const renderedFans = [];
    class GuestTokenHandler {
      constructor(config) {
        paymentSuccess = config.onSuccess;
        this.extraParams = config.extraParams;
        this.ready = Promise.resolve();
        this.userInfo = {};
        this.tip_checkout_params = { config: { min_purchase: 10 } };
        this.currentOrderKey = 'paid_guest_key';
      }
      async renderForm() { renderedFans.push(this.extraParams.user_id); return { orderId: 7003 }; }
      destroyForm() {}
      destroy() {}
    }
    window.AxcessGatewayFormHandler = GuestTokenHandler;
    const authResponse = {
      success: true, userData: { userID: 2616, jwtToken: 'new_fan_jwt' },
    };
    window.guestCheckout = hasParentHelper
      ? { checkGuestAuthAfterPayment: vi.fn().mockResolvedValue(authResponse) }
      : undefined;
    if (!hasParentHelper) window.fetch = vi.fn().mockResolvedValue({ json: async () => authResponse });
    const wrapper = shallowMount(TopUpForm, {
      props: { walletBalance: 0, topUpAmount: 50, totalPrice: 50, remainingBalance: 0 },
      global: { stubs: {
        CardForm: { template: '<div/>', data: () => ({ paymentContainer: document.createElement('div') }),
          methods: { setProcessingPayment() {}, resetCardValidity() {}, syncSavedCards() {} } },
        GuestCheckoutForm: { name: 'GuestCheckoutForm', template: '<div/>' },
      } },
    });
    try {
      await flushPromises();
      // Read the logged-in state first, just as the visible payment action does.
      expect(wrapper.find('button[disabled]').exists()).toBe(true);
      window.userData.userID = 0;
      wrapper.getComponent({ name: 'GuestCheckoutForm' }).vm.$emit('logout', { success: true });
      await flushPromises();
      expect(renderedFans).toEqual([2615, 0]);
      await paymentSuccess({ order_id: 7003, payment_type: 'payment_success', payment_status: 'success' });
      await flushPromises();
      if (hasParentHelper) {
        expect(window.guestCheckout.checkGuestAuthAfterPayment).toHaveBeenCalledWith(7003, 'paid_guest_key');
      } else {
        expect(window.fetch).toHaveBeenCalledWith('/wp-json/api/checkout/after-payment', expect.objectContaining({
          credentials: 'same-origin',
          body: JSON.stringify({ order_id: 7003, order_key: 'paid_guest_key', profile_user_id: 0 }),
        }));
      }
      expect(wrapper.emitted('success')[0][0]).toMatchObject({ userId: 2616, backendJwtToken: 'new_fan_jwt' });
      expect(window.userData.userID).toBe(2616);
    } finally {
      wrapper.unmount();
      window.AxcessGatewayFormHandler = OriginalHandler;
      window.guestCheckout = originalGuestCheckout;
      window.fetch = originalFetch;
    }
  });

  it("activates the existing inline shipping section for a physical prerequisite", () => {
    const wrapper = shallowMount(TopUpForm, {
      props: {
        walletBalance: 1000,
        topUpAmount: 0,
        totalPrice: 450,
        remainingBalance: 550,
        prerequisite: {
          eligible: false,
          type: "product",
          product: { id: 93, title: "Required merch", price: 20, image_url: "/merch.jpg" },
          checkout: { product_id: 93 },
          shipping: { required: true, cost_label: "Calculated at checkout" },
        },
      },
      global: {
        stubs: {
          CardForm: { template: "<div />", methods: { setProcessingPayment() {} } },
        },
      },
    });

    expect(wrapper.text()).toContain("SHIPPING ADDRESS");
    expect(wrapper.find('input[placeholder="Address line 1"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("Calculated at checkout");
    const paymentButton = wrapper.findAll('button').find((button) => button.text().includes("Pay & Complete Booking"));
    expect(paymentButton?.attributes("disabled")).toBeDefined();
    wrapper.unmount();
  });

  it.each([
    { international: false, cost: 0, destination: 'Ships to Taiwan only', costLabel: 'Free shipping' },
    { international: true, cost: 9.99, destination: 'Ships internationally', costLabel: '+USD$ 9.99 shipping' },
    { international: true, cost: 0, destination: 'Ships internationally', costLabel: 'Free shipping' },
  ])('renders the creator shipping setting before an address quote (international=$international, cost=$cost)', ({ international, cost, destination, costLabel }) => {
    const wrapper = shallowMount(TopUpForm, {
      props: {
        walletBalance: 1000, topUpAmount: 0, totalPrice: 450, remainingBalance: 550,
        prerequisite: { eligible: false, type: 'product', product: { id: 93, title: 'Merch', price: 20 },
          shipping: { required: true, is_merch: true, international, country: 'Taiwan', cost } },
      },
      global: { stubs: { CardForm: { template: '<div/>', methods: { setProcessingPayment() {} } } } },
    });
    expect(wrapper.get('[data-testid="booking-payment-shipping-destination"]').text().replace(/\s+/g, ' ')).toBe(destination);
    expect(wrapper.get('[data-testid="booking-payment-shipping-cost"]').text()).toBe(costLabel);
    wrapper.unmount();
  });

  it('does not display default-country shipping twice before a merch address quote', async () => {
    const OriginalHandler = window.AxcessGatewayFormHandler;
    class MerchHandler {
      constructor() { this.ready = Promise.resolve(); this.userInfo = {}; }
      async renderForm() {
        return { orderId: 7001, checkout: {
          order_id: 7001, total: 24, product_total: 24, items: [{ total: 24 }],
          requires_shipping: true, address_complete: false,
        } };
      }
      destroy() {}
    }
    window.AxcessGatewayFormHandler = MerchHandler;
    const wrapper = shallowMount(TopUpForm, {
      props: {
        walletBalance: 1000, topUpAmount: 0, totalPrice: 450, remainingBalance: 550,
        prerequisite: { product: { id: 93, title: 'Merch', price: 20 },
          shipping: { required: true, is_merch: true, international: true, cost: 4 } },
      },
      global: { stubs: { CardForm: {
        template: '<div/>', data: () => ({ paymentContainer: document.createElement('div') }),
        methods: { setProcessingPayment() {}, syncSavedCards() {} },
      } } },
    });
    try {
      await flushPromises();
      expect(wrapper.text()).toContain('USD$ 20.00');
      expect(wrapper.vm.prerequisitePrice).toBe(20);
      expect(wrapper.get('[data-testid="booking-payment-shipping-cost"]').text()).toBe('+USD$ 4.00 shipping');
      expect(wrapper.text()).toContain('USD$24.00');
    } finally {
      wrapper.unmount();
      window.AxcessGatewayFormHandler = OriginalHandler;
    }
  });

  it.each([
    ['unowned product', false, 'buy', 'booking-prerequisite', 100],
    ['subscription switch', false, 'switch', 'booking-prerequisite', 100],
    ['existing owner needing tokens', true, 'none', 'token', 100],
    ['existing owner with enough tokens', true, 'none', null, 0],
    ['existing subscription with enough tokens', true, 'none', null, 0],
  ])('refreshes guest ownership after login: %s', async (_label, eligible, action, nextMode, shortfall) => {
    const OriginalHandler = window.AxcessGatewayFormHandler;
    window.userData = { userID: 0 };
    window.custom_checkout_params = {};
    const modes = [];
    class GuestHandler {
      constructor(options) {
        modes.push(options.checkoutMode);
        this.currentOrderId = 7001;
        this.ready = Promise.resolve();
        this.userInfo = {};
        this._renderParams = { items: [{ product_id: 93, quantity: 1 }] };
      }
      async renderForm() { return { orderId: 7001, checkout: { order_id: 7001, order_key: 'guest_key', total: 12, requires_shipping: false } }; }
      destroy() {}
    }
    window.AxcessGatewayFormHandler = GuestHandler;
    const prerequisite = { eligible: false, type: action === 'switch' || _label.includes('subscription') ? 'subscription' : 'product', product: { id: 93, title: 'Required product', price: 12 }, checkout: { product_id: 93 } };
    let wrapper;
    const afterAuthUpdate = vi.fn(async () => {
      await wrapper.setProps({ fanId: 2615, prerequisite: { ...prerequisite, eligible, action }, topUpAmount: shortfall });
      return { ...prerequisite, eligible, action };
    });
    wrapper = shallowMount(TopUpForm, {
      props: { walletBalance: 0, topUpAmount: 100, totalPrice: 100, remainingBalance: 0, prerequisite, afterAuthUpdate },
      global: { stubs: {
        CardForm: { name: 'CardForm', template: '<div/>', data: () => ({ canPay: true, paymentContainer: document.createElement('div') }), methods: { setProcessingPayment() {}, syncSavedCards() {} } },
        GuestCheckoutForm: { name: 'GuestCheckoutForm', template: '<div/>', props: ['checkoutContext'], data: () => ({ requiresLogin: false }) },
      } },
    });
    try {
      await flushPromises();
      const guest = wrapper.getComponent({ name: 'GuestCheckoutForm' });
      expect(guest.props('checkoutContext')).toMatchObject({ booking_prerequisite_checkout: 1, order_key: 'guest_key', is_call_checkout: 1, tip_checkout_popup: 0 });
      window.userData = { userID: 2615 };
      guest.vm.$emit('login', { userData: { userID: 2615, jwtToken: 'fan_jwt' }, custom_checkout_params: { wp_rest_nonce: 'login_nonce' } });
      await flushPromises();
      expect(afterAuthUpdate).toHaveBeenCalledWith(expect.objectContaining({ userId: 2615, backendJwtToken: 'fan_jwt' }));
      expect(window.custom_checkout_params.wp_rest_nonce).toBe('login_nonce');
      if (eligible || action === 'switch') {
        expect(modes).toEqual(['booking-prerequisite']);
        expect(wrapper.emitted('back')).toBeUndefined();
        const review = wrapper.get('[data-testid="booking-prerequisite-review"]');
        expect(review.text()).toContain(action === 'switch' ? 'Update Subscription Tier' : prerequisite.type === 'subscription' ? 'SUBSCRIBED' : 'ALREADY IN YOUR LIBRARY');
        await wrapper.get('[data-testid="booking-prerequisite-review-confirm"]').trigger('click');
        await flushPromises();
        expect(afterAuthUpdate).toHaveBeenCalledTimes(2);
      }
      expect(modes).toEqual(nextMode ? ['booking-prerequisite', nextMode] : ['booking-prerequisite']);
      if (nextMode === 'token') expect(guest.props('checkoutContext')).toBeNull();
      expect(Boolean(wrapper.emitted('back'))).toBe(nextMode === null);
      expect(wrapper.emitted('success')).toBeUndefined();
    } finally {
      wrapper.unmount();
      window.AxcessGatewayFormHandler = OriginalHandler;
    }
  });

  it.each([false, true])('requires confirmation before preparing a signed-in tier switch (free: %s)', async (free) => {
    const originalHandler = window.AxcessGatewayFormHandler;
    const modes = [];
    class SwitchHandler {
      constructor(options) { modes.push(options.checkoutMode); this.ready = Promise.resolve(); this.userInfo = {}; }
      async renderForm() { return { orderId: 7010, checkout: { requires_shipping: false } }; }
      destroy() {}
    }
    window.AxcessGatewayFormHandler = SwitchHandler;
    const prerequisite = { eligible: false, type: 'subscription', action: 'switch',
      product: { id: 93, title: 'Variable Product - Tier', variation_title: 'Close Circle', price: free ? 0 : 25, image_url: '/tier.jpg' },
      checkout: { product_id: 92, variation_id: 93, switch_type: 'downgrade', subscription_id: 9000 },
      subscription: { period: 'month', interval: 1, next_payment_date: 'November 1, 2026', current_tier: { id: 91, title: 'Inner Circle', price: 50, period: 'month' } } };
    const afterAuthUpdate = vi.fn().mockResolvedValue(prerequisite);
    const activateFreePrerequisite = vi.fn().mockResolvedValue({ ...prerequisite, eligible: true, action: 'none' });
    const wrapper = shallowMount(TopUpForm, {
      props: { walletBalance: 1000, topUpAmount: 0, totalPrice: 100, remainingBalance: 900, fanId: 2615, prerequisite, afterAuthUpdate, activateFreePrerequisite },
      global: { stubs: {
        CardForm: { template: '<div/>', data: () => ({ paymentContainer: document.createElement('div') }), methods: { setProcessingPayment() {}, syncSavedCards() {} } },
      } },
    });
    try {
      await flushPromises();
      expect(modes).toEqual([]);
      expect(wrapper.get('[data-testid="booking-prerequisite-review"]').text()).toContain('Inner Circle');
      expect(wrapper.get('[data-testid="booking-prerequisite-review"]').text()).toContain('Close Circle');
      expect(wrapper.get('[data-testid="booking-prerequisite-review"]').text()).toContain('November 1, 2026');
      await wrapper.get('[data-testid="booking-prerequisite-review-cancel"]').trigger('click');
      expect(wrapper.find('[data-testid="booking-prerequisite-review"]').exists()).toBe(false);
      expect(modes).toEqual([]);
      expect(wrapper.emitted('back')).toBeUndefined();
      await wrapper.findAll('button').find(button => button.text() === 'Review required purchase').trigger('click');
      await wrapper.get('[data-testid="booking-prerequisite-review-confirm"]').trigger('click');
      await flushPromises();
      expect(modes).toEqual(free ? [] : ['booking-prerequisite']);
      expect(activateFreePrerequisite).toHaveBeenCalledTimes(free ? 1 : 0);
      expect(Boolean(wrapper.emitted('back'))).toBe(free);
      expect(wrapper.emitted('success')).toBeUndefined();
    } finally {
      wrapper.unmount();
      window.AxcessGatewayFormHandler = originalHandler;
    }
  });

  it.each(['same switch', 'different fan', 'different event', 'different tier'])('only reuses booking-entry acknowledgement for the %s', async (scenario) => {
    const OriginalHandler = window.AxcessGatewayFormHandler;
    const renderForm = vi.fn().mockResolvedValue({ orderId: 7010, checkout: { requires_shipping: false } });
    window.AxcessGatewayFormHandler = class {
      constructor() { this.ready = Promise.resolve(); this.userInfo = {}; }
      renderForm = renderForm;
      destroy() {}
    };
    const prerequisite = { eligible: false, type: 'subscription', action: 'switch', product: { id: 93, price: 25 }, subscription: { current_tier: { id: 91 } }, checkout: { subscription_id: 9000, switch_type: 'upgrade' } };
    const confirmedSwitch = subscriptionSwitchReviewKey(prerequisite, 2615, 'event-1');
    const wrapper = shallowMount(TopUpForm, { props: {
      walletBalance: 1000, topUpAmount: 0, totalPrice: 100, remainingBalance: 900,
      fanId: scenario === 'different fan' ? 2616 : 2615,
      eventId: scenario === 'different event' ? 'event-2' : 'event-1',
      prerequisite: scenario === 'different tier' ? { ...prerequisite, product: { id: 94, price: 25 } } : prerequisite,
      confirmedSwitch,
    }, global: { stubs: {
      CardForm: { template: '<div/>', data: () => ({ paymentContainer: document.createElement('div') }), methods: { setProcessingPayment() {}, syncSavedCards() {} } },
    } } });
    try {
      await flushPromises();
      expect(wrapper.find('[data-testid="booking-prerequisite-review"]').exists()).toBe(scenario !== 'same switch');
      expect(renderForm).toHaveBeenCalledTimes(scenario === 'same switch' ? 1 : 0);
    } finally { wrapper.unmount(); window.AxcessGatewayFormHandler = OriginalHandler; }
  });

  it('validates merch state, saves shipping before payment, and exposes server errors on a complete address', async () => {
    const OriginalHandler = window.AxcessGatewayFormHandler;
    const address = { first_name: 'Local', last_name: 'Fan', address_1: '123 Test Road', address_2: '', city: 'Los Angeles', state: '', postcode: '90001', country: 'US', phone: '', email: '' };
    const checkout = {
      order_id: 7001, subscription_switch: [],
      requires_shipping: true, address_complete: false, shipping_address: address,
      shipping_countries: { US: 'United States', GB: 'United Kingdom' },
      shipping_states: { US: { CA: 'California', NY: 'New York' } },
      shipping_fields: {
        US: Object.fromEntries(['first_name', 'last_name', 'address_1', 'city', 'state', 'postcode', 'country'].map(key => [key, { required: true, label: key }])),
        GB: { country: { required: true }, state: { required: false, hidden: true } },
      },
      shipping_addresses: [{ ...address, id: 17, state: 'CA' }], total: 24, shipping_total: 4,
    };
    const prepare = vi.fn().mockRejectedValueOnce(new Error('Shipping ZIP is not valid.')).mockResolvedValue({
      success: true, order_id: 7001, payment_cards: '<form/>',
      booking_checkout: { ...checkout, address_complete: true, shipping_address: { ...address, state: 'CA' } },
    });
    let finishInitialRender;
    const initialRender = new Promise(resolve => { finishInitialRender = resolve; });
    class MerchHandler {
      constructor() { this.currentOrderId = 7001; this.ready = Promise.resolve(); this.userInfo = { email: 'fan@example.test' }; }
      async renderForm(_amount, _id, _type, response) {
        if (!response) await initialRender;
        this.currentOrderId = 7001;
        return { orderId: 7001, checkout: response?.booking_checkout || checkout };
      }
      prepareBookingShipping = prepare;
      destroyForm() {}
      destroy() {}
    }
    window.AxcessGatewayFormHandler = MerchHandler;
    const wrapper = shallowMount(TopUpForm, {
      props: { walletBalance: 1000, topUpAmount: 0, totalPrice: 450, remainingBalance: 550, fanId: 2615,
        prerequisite: { eligible: false, type: 'product', product: { id: 93, title: 'Merch', price: 20 }, shipping: { required: true } } },
      global: { stubs: {
        CardForm: { template: '<div/>', data: () => ({ canPay: true, paymentContainer: document.createElement('div') }), methods: { setProcessingPayment() {}, resetCardValidity() {}, syncSavedCards() {} } },
        GuestCheckoutForm: { template: '<div/>', data: () => ({ requiresLogin: false }) },
      } },
    });
    try {
      await flushPromises();
      // An initial quote may arrive after the fan has started entering details.
      await wrapper.get('input[placeholder="First name"]').setValue('In progress');
      finishInitialRender();
      await flushPromises();
      expect(wrapper.get('input[placeholder="First name"]').element.value).toBe('In progress');
      expect(wrapper.text()).toContain('MANDATORY PURCHASE');
      expect(wrapper.text()).not.toContain('MANDATORY SUBSCRIPTION');
      const pay = wrapper.findAll('button').find(button => button.text().includes('Pay & Complete Booking'));
      const update = wrapper.findAll('button').find(button => button.text().includes('Update shipping'));
      expect(update.attributes('disabled')).toBeDefined();
      await wrapper.get('[data-testid="booking-saved-shipping"]').setValue('17');
      expect(wrapper.get('[data-testid="booking-shipping-state"]').element.value).toBe('CA');
      expect(update.attributes('disabled')).toBeUndefined();
      expect(pay.attributes('disabled')).toBeDefined();
      await update.trigger('click');
      await flushPromises();
      expect(wrapper.get('[role="alert"]').text()).toBe('Shipping ZIP is not valid.');
      expect(pay.attributes('disabled')).toBeDefined();
      await update.trigger('click');
      await flushPromises();
      expect(prepare).toHaveBeenLastCalledWith(expect.objectContaining({
        shipping_state: 'CA', shipping_address_id: '17', save_shipping_address: 1,
        billing_first_name: 'Local', billing_last_name: 'Fan', billing_address_1: '123 Test Road',
        billing_city: 'Los Angeles', billing_state: 'CA', billing_postcode: '90001', billing_country: 'US',
        billing_email: 'fan@example.test',
      }));
      expect(pay.attributes('disabled')).toBeUndefined();
      expect(wrapper.text()).toContain('California');
      expect(wrapper.get('[data-testid="booking-payment-shipping-cost"]').text()).toBe('+USD$ 4.00 shipping');
      // Editing a quoted address blocks payment until WooCommerce quotes it again.
      await wrapper.get('[data-testid="booking-shipping-toggle"]').trigger('click');
      await wrapper.get('input[placeholder="Address line 1"]').setValue('456 Other Road');
      expect(pay.attributes('disabled')).toBeDefined();
      expect(wrapper.get('[data-testid="booking-payment-shipping-cost"]').text()).toBe('Calculated at checkout');
      await wrapper.get('[data-testid="booking-shipping-country"]').setValue('GB');
      expect(wrapper.find('[data-testid="booking-shipping-state"]').exists()).toBe(false);
      prepare.mockResolvedValueOnce({ success: true, order_id: 7001, payment_cards: '<form/>',
        booking_checkout: { ...checkout, address_complete: true, shipping_total: 0, total: 20,
          shipping_address: { ...address, state: 'CA', country: 'GB', address_1: '456 Other Road' } },
      });
      await wrapper.findAll('button').find(button => button.text().includes('Update shipping')).trigger('click');
      await flushPromises();
      expect(wrapper.get('[data-testid="booking-payment-shipping-cost"]').text()).toBe('Free shipping');
      await wrapper.setProps({ prerequisite: { ...wrapper.props('prerequisite'), shipping: { required: true, is_merch: true, international: false, country_code: 'US', country: 'United States' } } });
      // A complete and quoted address must still respect the creator's domestic-only country.
      expect(wrapper.get('[role="alert"]').text()).toContain('This item ships to United States only');
      expect(pay.attributes('disabled')).toBeDefined();
      expect(wrapper.findAll('button').find(button => button.text().includes('Update shipping')).attributes('disabled')).toBeDefined();
      await wrapper.get('[data-testid="booking-shipping-country"]').setValue('US');
      expect(wrapper.find('[role="alert"]').exists()).toBe(false);
      // International products continue to allow other destinations.
      await wrapper.setProps({ prerequisite: { ...wrapper.props('prerequisite'), shipping: { required: true, is_merch: true, international: true, country_code: 'US', country: 'United States' } } });
      await wrapper.get('[data-testid="booking-shipping-country"]').setValue('GB');
      expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    } finally {
      wrapper.unmount();
      window.AxcessGatewayFormHandler = OriginalHandler;
    }
  });
});
