import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

describe('AxcessGatewayFormHandler booking prerequisite mode', () => {
  beforeEach(async () => {
    vi.resetModules();
    document.body.innerHTML = '<div id="payment"></div>';
    document.body.className = '';
    window.userData = { userID: 2615 };
    window.custom_checkout_params = { payment_method: 'token' };
    await import('@/utils/axcessGatewayFormHandler.js');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete window.AxcessGatewayFormHandler;
    delete window.wpwl;
    delete window.wpwlOptions;
  });

  it.each(['booking-prerequisite', 'token'])('validates the submitted saved-card mode, not a stale global (%s)', async (checkoutMode) => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => ({ balance: 0 }) })));
    const handler = new window.AxcessGatewayFormHandler({ container: document.querySelector('#payment'), checkoutMode });
    await handler.ready;
    handler.currentOrderId = 7001;
    window.custom_checkout_params.payment_method = 'new_card';
    handler.container.innerHTML = '<input name="payment_method" value="new_card"><input name="card.holder" value="">';
    const post = vi.spyOn(handler, '_post').mockResolvedValue({ payment_status: 'pending' });
    vi.spyOn(handler, '_handlePaymentResponse').mockImplementation(() => {});
    const error = vi.spyOn(handler, '_handleError');
    await handler.submitPayment({ payment_method: 'token', token_id: 3 });
    expect(error).not.toHaveBeenCalled();
    expect(post).toHaveBeenCalledWith(expect.objectContaining({ payment_method: 'token', token_id: 3 }));
    handler.destroy();
  });

  it.each(['booking-prerequisite', 'token'])('still validates an explicit new card when the global says saved card (%s)', async (checkoutMode) => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => ({ balance: 0 }) })));
    const handler = new window.AxcessGatewayFormHandler({ container: document.querySelector('#payment'), checkoutMode });
    await handler.ready;
    handler.currentOrderId = 7001;
    handler.container.innerHTML = '<input name="card.holder" value="">';
    const post = vi.spyOn(handler, '_post');
    const error = vi.spyOn(handler, '_handleError');
    expect(await handler.submitPayment({ payment_method: 'new_card', token_id: '' })).toBeNull();
    expect(error).toHaveBeenCalledWith('Please enter your card number.');
    expect(post).not.toHaveBeenCalled();
    handler.destroy();
  });

  it('uses the existing WooCommerce checkout actions and preserves order items', async () => {
    const requests = [];
    vi.stubGlobal('fetch', vi.fn(async (_url, options = {}) => {
      const body = options.body;
      const action = body?.get?.('action');
      requests.push({ action, body, url: _url });
      if (action === 'get_user_token_balance') {
        return { json: async () => ({ balance: 0, config: {} }) };
      }
      if (action === 'get_checkout_template') {
        return {
          json: async () => ({
            success: true,
            // Legacy get_checkout_template derives this from the cart after
            // the buy-now order is created. A renderable order is still valid.
            error: true,
            order_id: 7001,
            payment_content: '<form class="wpwl-form"><input name="card.holder" value="Fan" /></form>',
            check_cart_product_types: {
              user_id: 2615,
              payment_method: 'token',
              items: [{ product_id: 91, quantity: 1 }],
              subscription_switch: { subscription_id: 6001, upgraded_or_downgraded: 'downgraded' },
            },
            booking_checkout: { order_id: 7001, token_order_id: 7003, total: 63.5, topup_usd: 38.5, requires_shipping: false },
          }),
        };
      }
      if (action === 'create_tip_order' && !body?.get?.('step')) {
        return {
          json: async () => ({
            success: true,
            order_id: 7002,
            order_key: 'booking_token_order_key',
            payment_content: '<form class="wpwl-form"><input name="card.holder" value="Fan" /></form>',
            check_cart_product_types: { user_id: 2615, payment_method: 'token' },
          }),
        };
      }
      return {
        json: async () => ({ payment_status: 'fail', payment_response: { message: 'declined' } }),
      };
    }));

    const handler = new window.AxcessGatewayFormHandler({
      container: document.querySelector('#payment'),
      checkoutMode: 'booking-prerequisite',
      extraParams: {
        user_id: 2615,
        product_id: 90,
        variation_id: 91,
        booking_event_id: 'evt_1',
        booking_prerequisite_product_id: 91,
        booking_topup_tokens: 350,
        'switch-subscription': 6001,
        item: 601,
        _wcsnonce: 'test-switch-nonce',
      },
    });
    await handler.ready;

    const rendered = await handler.renderForm(350);
    expect(rendered.orderId).toBe(7001);
    expect(rendered.checkout.total).toBe(63.5);
    expect(rendered.checkout.token_order_id).toBe(7003);
    expect(document.querySelector('#payment .wpwl-form')).not.toBeNull();
    const checkoutRequest = requests.find((request) => request.action === 'get_checkout_template');
    expect(checkoutRequest.body.get('booking_prerequisite_checkout')).toBe('1');
    expect(checkoutRequest.body.get('booking_topup_tokens')).toBe('350');
    const switchUrl = new URL(checkoutRequest.url);
    expect(switchUrl.searchParams.get('switch-subscription')).toBe('6001');
    expect(switchUrl.searchParams.get('item')).toBe('601');
    expect(switchUrl.searchParams.get('_wcsnonce')).toBe('test-switch-nonce');

    await handler.submitPayment({ payment_method: 'token', token_id: 3 });
    const paymentRequest = requests.find((request) => request.action === 'create_order');
    expect(paymentRequest.body.get('order_id')).toBe('7001');
    expect(paymentRequest.body.get('checkout_step')).toBe('2');
    expect(paymentRequest.body.get('booking_topup_tokens')).toBe('350');
    expect(paymentRequest.body.get('items[0][product_id]')).toBe('91');
    expect(paymentRequest.body.get('items[0][quantity]')).toBe('1');
    expect(paymentRequest.body.get('items[0][subscription_id]')).toBe('6001');
    expect(JSON.parse(paymentRequest.body.get('items[0][subscription_switch]'))).toEqual({
      subscription_id: 6001, upgraded_or_downgraded: 'downgraded',
    });
    expect(requests.some((request) => request.action === 'create_tip_order')).toBe(false);
    expect(window.get_active_checkout_popup()).toBe(document.querySelector('#payment'));
    handler.destroy();

    const tokenContainer = document.createElement('div');
    document.body.appendChild(tokenContainer);
    const tokenHandler = new window.AxcessGatewayFormHandler({
      container: tokenContainer,
      checkoutMode: 'token',
      extraParams: { user_id: 2615, creator_id: 1407, is_topup_and_call: 1 },
    });
    await tokenHandler.ready;
    const tokenCheckout = await tokenHandler.renderForm(350);
    expect(tokenCheckout.orderId).toBe(7002);
    expect(tokenHandler.currentOrderKey).toBe('booking_token_order_key');
    const tokenRequest = requests.find((request) => (
      request.action === 'create_tip_order' && !request.body.get('step')
    ));
    expect(tokenRequest.body.get('topup_amount')).toBe('350');
    expect(tokenRequest.body.get('product_id')).toBeNull();
    expect(tokenRequest.url).not.toContain('switch-subscription');
    const unload = vi.fn(() => expect(tokenContainer.querySelector('.wpwl-form')).not.toBeNull());
    window.wpwl = { unload };
    const staleRuntime = document.createElement('script');
    staleRuntime.src = 'https://eu-test.oppwa.com/v1/static/test/js/static.min.js';
    document.body.appendChild(staleRuntime);
    const unrelatedScript = document.createElement('script');
    unrelatedScript.src = 'https://example.test/static.min.js';
    document.body.appendChild(unrelatedScript);
    tokenHandler.destroy();
    expect(unload).toHaveBeenCalledOnce();
    expect(staleRuntime.isConnected).toBe(false);
    expect(unrelatedScript.isConnected).toBe(true);
    expect(tokenContainer.innerHTML).toBe('');
  });

  it('prepares merch shipping through step 1 without submitting payment or replacing the product', async () => {
    const requests = [];
    vi.stubGlobal('fetch', vi.fn(async (_url, options = {}) => {
      const body = options.body;
      requests.push(body);
      if (body.get('action') === 'get_user_token_balance') return { json: async () => ({ balance: 0 }) };
      return { json: async () => ({
        success: true, order_id: 7001,
        payment_content: '<form class="wpwl-form"></form>',
        check_cart_product_types: { items: [{ product_id: 93, quantity: 1 }], user_id: 2615 },
        booking_checkout: { requires_shipping: true, total: 24, order_key: 'wc_order_guest_key' },
      }) };
    }));
    const handler = new window.AxcessGatewayFormHandler({
      container: document.querySelector('#payment'), checkoutMode: 'booking-prerequisite',
      extraParams: { user_id: 2615, product_id: 93, booking_prerequisite_product_id: 93, booking_event_id: 'merch_event' },
    });
    await handler.ready;
    await handler.renderForm(0);
    await handler.prepareBookingShipping({ shipping_country: 'US', shipping_state: 'CA', save_shipping_address: 0 });
    const request = requests.find(body => body.get('action') === 'create_order');
    expect(request.get('checkout_step')).toBe('1');
    expect(request.get('payment_method')).toBe('new_card');
    expect(request.get('token_id')).toBe('');
    expect(request.get('order_id')).toBe('7001');
    expect(request.get('order_key')).toBe('wc_order_guest_key');
    expect(request.get('items[0][product_id]')).toBe('93');
    expect(request.get('shipping_state')).toBe('CA');
    expect(request.get('save_shipping_address')).toBe('0');
    expect(requests.some(body => body.get('action') === 'create_tip_order')).toBe(false);
    handler.destroy();
  });

  it('isolates the booking 3DS and receipt targets from the parent checkout frame', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => ({ balance: 0 }) })));
    const handler = new window.AxcessGatewayFormHandler({ container: document.querySelector('#payment') });
    await handler.ready;
    const frame = document.querySelector('#checkoutCustomIframe');
    expect(frame.name).toBe('fanBookingCheckoutIframe');
    const content = document.createElement('div');
    content.innerHTML = `<script>var testOptions = { paymentTarget: "checkoutCustomIframe", shopperResultTarget: 'checkoutCustomIframe' }; var legacySelector = '#checkoutCustomIframe';</script>`;
    handler.container.appendChild(content);
    handler._reinjectScripts(content);
    const script = content.querySelector('script').textContent;
    expect(script).toContain('paymentTarget: "fanBookingCheckoutIframe"');
    expect(script).toContain("shopperResultTarget: 'fanBookingCheckoutIframe'");
    expect(script).toContain("legacySelector = '#checkoutCustomIframe'");
    expect(handler._ensureIframe()).toBe(frame);
    handler.destroy();
  });

  it('keeps the shared gateway ready callback safe without legacy popup card controls', () => {
    const template = readFileSync(resolve(process.cwd(), '../wp/wp-content/plugins/opp-copyandpay-premium/inc/classes/class-payment-form.php'), 'utf8');
    const start = template.indexOf("let payment_cards_wrapper = document.querySelector");
    const end = template.indexOf('// New tip', start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    // Exercise the actual shared template's popup-only ready block, not a copy.
    const ready = new Function('document', 'custom_checkout_params', 'get_active_checkout_popup', 'console', 'setTimeout', template.slice(start, end));
    const quietConsole = { error: vi.fn() };
    expect(() => ready(document, { payment_method: 'new_card', payment_details: [] }, () => document.querySelector('#payment'), quietConsole, vi.fn())).not.toThrow();

    document.body.insertAdjacentHTML('beforeend', '<div class="payment-cards-wrapper"><button data-hide-on-skeleton data-new-card></button><div data-cards-selector hidden></div></div>');
    ready(document, { payment_method: 'token', payment_details: [{ id: 3 }] }, () => null, quietConsole, vi.fn());
    expect(document.querySelector('[data-new-card]').hidden).toBe(true);
    expect(document.querySelector('[data-cards-selector]').hidden).toBe(false);
    ready(document, { payment_method: 'new_card', payment_details: [] }, () => null, quietConsole, vi.fn());
    expect(document.querySelector('[data-cards-selector]').hidden).toBe(true);
  });

  it.each([
    ['booking card container', 'payment', false, true],
    ['booking dark card wrapper', '', false, true],
    ['open product popup', 'checkout-popup', true, true],
    ['closed product popup', 'checkout-popup', false, false],
    ['open tip popup', 'tip-checkout-popup', true, true],
    ['closed tip popup', 'tip-checkout-popup', false, false],
    ['no popup', null, false, true],
  ])('preserves 3DS and error handling for %s', (_label, id, opened, allowed) => {
    const template = readFileSync(resolve(process.cwd(), '../wp/wp-content/plugins/opp-copyandpay-premium/inc/classes/class-payment-form.php'), 'utf8');
    const root = id === null ? null : document.createElement('div');
    if (root) {
      root.id = id;
      if (opened) root.classList.add('opened');
      document.body.appendChild(root);
    }
    const start = template.indexOf('onLoadThreeDIframe: function (e) {');
    const end = template.indexOf('/**', start);
    const callback = template.slice(start, end);
    const body = callback.slice(callback.indexOf('{') + 1, callback.lastIndexOf('},'));
    const onLoad = new Function('window', 'document', 'get_active_checkout_popup', 'console', 'jQuery', 'tipCheckoutPopup', 'e', body);
    const quietConsole = { log: vi.fn(), error: vi.fn(), warn: vi.fn() };
    const jquery = () => ({ addClass: vi.fn(), after: vi.fn() });
    onLoad({}, document, () => root, quietConsole, jquery, { orderData: { order_status: 'pending' } }, {});
    expect(document.body.classList.contains('show-3d-secure')).toBe(allowed);

    // Exercise the actual error guard too; PHP-translated messages following it
    // are unrelated to deciding whether an active checkout may receive errors.
    const errorStart = template.lastIndexOf('onError: function (e) {');
    const errorEnd = template.indexOf("if (e && e.errorCode === '3DS_REQUIRED')", errorStart);
    const errorBody = template.slice(errorStart, errorEnd).split('onError: function (e) {')[1];
    const onError = new Function('get_active_checkout_popup', 'console', 'e', `${errorBody}\nreturn true;`);
    expect(onError(() => root, quietConsole, {})).toBe(allowed ? true : undefined);
  });

  it('still respects explicit 3DS suppression for embedded checkout', () => {
    const template = readFileSync(resolve(process.cwd(), '../wp/wp-content/plugins/opp-copyandpay-premium/inc/classes/class-payment-form.php'), 'utf8');
    const start = template.indexOf('onLoadThreeDIframe: function (e) {');
    const callback = template.slice(start, template.indexOf('/**', start));
    const body = callback.slice(callback.indexOf('{') + 1, callback.lastIndexOf('},'));
    const onLoad = new Function('window', 'document', 'get_active_checkout_popup', 'console', 'jQuery', 'e', body);
    const jquery = vi.fn();
    onLoad({ preventLoading3dSecureIframe: true }, document, () => document.querySelector('#payment'), { log: vi.fn() }, jquery, {});
    expect(document.body.classList.contains('show-3d-secure')).toBe(false);
    expect(jquery).not.toHaveBeenCalled();
  });

  it.each([false, true])('formats saved-card payment totals for Axcess (booking helper available: %s)', (hasBookingHelper) => {
    const gateway = readFileSync(resolve(process.cwd(), '../wp/wp-content/plugins/opp-copyandpay-premium/inc/classes/class-main.php'), 'utf8');
    const transaction = gateway.slice(gateway.indexOf('function process_transaction('));
    const amountExpression = transaction.match(/'amount'\s*=>\s*([^\n]+),\s*\n\s*'currency'/)?.[1];
    expect(amountExpression).toBeTruthy();
    // Execute the actual gateway amount expression in PHP. A linked booking
    // total must remain combined, but every request needs two decimal places.
    const php = `
      namespace MadLinksCoding {
        ${hasBookingHelper ? 'class Woocommerce_Checkout { public static function get_booking_payment_total($order) { return (float) $order->get_total() + $order->topup; } }' : ''}
      }
      namespace {
        function wc_format_decimal($value, $dp) { return number_format((float) $value, $dp, '.', ''); }
        $order = new class { public $total; public $topup; public function get_total() { return $this->total; } };
        $amounts = [];
        foreach ([['5.40', 0], ['5.00', 0], ['7.69', 0], ['5.40', 7]] as [$order->total, $order->topup]) {
          $amounts[] = ${amountExpression};
        }
        echo json_encode($amounts);
      }
    `;
    expect(JSON.parse(execFileSync('php', ['-r', php], { encoding: 'utf8' }))).toEqual([
      '5.40', '5.00', '7.69', hasBookingHelper ? '12.40' : '5.40',
    ]);
  });

  it('ignores forged and stale prerequisite receipt messages', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => ({ balance: 0 }) })));
    const handler = new window.AxcessGatewayFormHandler({
      container: document.querySelector('#payment'), checkoutMode: 'booking-prerequisite',
      ajaxUrl: 'https://fansocial.local/wp-admin/admin-ajax.php',
    });
    await handler.ready;
    handler.currentOrderId = 7001;
    const success = vi.spyOn(handler, '_handleSuccess').mockImplementation(() => {});
    const hide = vi.spyOn(handler, '_hide3DS').mockImplementation(() => {});
    const receipt = { type: 'checkoutThankYouPage', data: { order_id: 7001 } };
    const source = document.querySelector('#checkoutCustomIframe').contentWindow;
    handler._onIframeMessage({ origin: 'https://example.test', source, data: receipt });
    handler._onIframeMessage({ origin: 'https://fansocial.local', source: window, data: receipt });
    handler._onIframeMessage({ origin: 'https://fansocial.local', source,
      data: { ...receipt, data: { order_id: 7002 } } });
    expect(success).not.toHaveBeenCalled();
    expect(hide).not.toHaveBeenCalled();
    handler._onIframeMessage({ origin: 'https://fansocial.local', source, data: receipt });
    expect(success).toHaveBeenCalledOnce();
    handler.destroy();
  });
});
