/**
 * AxcessGatewayFormHandler
 *
 * Handles the two-step create_tip_order flow:
 *   Step 1 – POST create_tip_order (no `step`) → receive payment_content HTML → inject into container
 *   Step 2 – POST create_tip_order (step=payment) → process card → inline success / 3DS
 *
 * Usage:
 *   const handler = new AxcessGatewayFormHandler({
 *     container: document.getElementById('payment-form-container'),
 *     onSuccess: (response) => {},
 *     onError:   (message)  => {},
 *   });
 *
 *   await handler.getUserTokenBalance({ creatorId: 42 });
 *
 *   // Render form for a given amount (pass currentOrderId to update instead of create)
 *   const { orderId } = await handler.renderForm(1000);
 *
 *   // Destroy current form (call before re-rendering with a new amount)
 *   handler.destroyForm();
 */
class AxcessGatewayFormHandler {
  /**
   * @param {object} config
   * @param {string}      config.ajaxUrl   WordPress admin-ajax.php URL
   * @param {HTMLElement} config.container Element that will receive the injected form HTML
   * @param {function}    [config.onSuccess] Called with the full payment response on success
   * @param {function}    [config.onError]   Called with an error message string on failure
   * @param {object}      [config.extraParams] Additional POST params merged into every request
   */
  constructor(config = {}) {
    if (!config.container) throw new Error('AxcessGatewayFormHandler: container is required');

    // Prefer explicit ajaxUrl, then fall back to page globals
    this.ajaxUrl = config.ajaxUrl
      || window?.tip_checkout_params?.ajax_url
      || window?.custom_checkout_params?.ajax_url
      || '/wp-admin/admin-ajax.php';

    this.container         = config.container;
    this._successCallback  = config.onSuccess || (() => {});
    this._errorCallback    = config.onError   || (() => {});
    this.extraParams  = config.extraParams || {
      user_id:      window?.userData?.userID || null,
      tip_amount:   0,
      topup_amount: 0,
    };

    this.currentOrderId = null;
    this._renderParams  = {}; // params from the last renderForm() call, reused by submitPayment()
    this._paymentAbort  = null; // AbortController for in-flight requests

    // Autofill-detection flags for oppwa card/cvv iframes (mirrors custom-checkout.js:5727)
    this._loadedCardNumberAutofill = false;
    this._loadedCardCVCAutofill    = false;

    // Populated by getUserTokenBalance()
    this.userTokenBalance = window?.tip_checkout_params?.user_token_balance || 0;
    this.userInfo         = null;
    this.creatorInfo      = null;
    this.isAnonymous      = false;
    this.tip_checkout_params      = {};

    // Fetch balance immediately; store the promise so callers can await it if needed
    this.ready = this.getUserTokenBalance();

    // Ensure the shared 3DS iframe exists in the DOM
    this._ensureIframe();

    // Single window message listener — handles both oppwa card validation
    // (custom-checkout.js:5727-5859) and payment-status iframe responses (5861-5875).
    this._onIframeMessage = (event) => {
      // ── oppwa card/cvv iframe validation ──────────────────────────────────
      const OPPWA_ORIGINS = ['https://eu-test.oppwa.com', 'https://eu-prod.oppwa.com'];
      if (OPPWA_ORIGINS.includes(event.origin)) {
        const iframes = document.querySelectorAll('iframe');
        const sourceIframe = Array.from(iframes).find(f => {
          try { return f.contentWindow === event.source; } catch { return false; }
        });

        if (sourceIframe && ['card.number', 'card.cvv'].includes(sourceIframe.name)) {
          let data;
          try { data = JSON.parse(event.data); } catch { return; }

          if (data?.method === 'iframeCommunication::setIsValid') {
            const { eventType, isValid, isEmpty } = data?.params || {};

            if (['keydown', 'forcedBlur', 'onChange'].includes(eventType)) {
              if (sourceIframe.name === 'card.number') {
                this._loadedCardNumberAutofill = isValid;
                if (isEmpty) {
                  this._loadedCardNumberAutofill = false;
                  if (window.wpwlOptions) window.wpwlOptions.isValidCardNumber = false;
                }
              }
              if (sourceIframe.name === 'card.cvv') {
                this._loadedCardCVCAutofill = isValid;
                if (isEmpty) {
                  this._loadedCardCVCAutofill = false;
                  if (window.wpwlOptions) window.wpwlOptions.isValidSecurityCode = false;
                }
              }

              // Both fields valid — set flags and reset autofill trackers
              if (this._loadedCardNumberAutofill && this._loadedCardCVCAutofill) {
                if (window.wpwlOptions) {
                  window.wpwlOptions.isValidCardNumber   = true;
                  window.wpwlOptions.isValidSecurityCode = true;
                }
                this._loadedCardNumberAutofill = false;
                this._loadedCardCVCAutofill    = false;
              }
            }
          }
        }
        return;
      }

      console.error('Received message from unknown origin:', event.origin, event.data);
      // ── handle-payment-status.php postMessage ─────────────────────────────
      if (event.data?.type === 'checkoutThankYouPage') {
        this._hide3DS();
        this._handleSuccess(event.data.data || event.data);
      }
      if (event.data?.type === 'closeCheckoutExtraPoups') {
        this._hide3DS();
      }
    };
    window.addEventListener('message', this._onIframeMessage);

    // Bind the payment step as soon as wpwl signals it is ready.
    // paymentFormReady is dispatched by class-payment-form.php (line 194) after wpwlOptions init.
    // We keep this as the primary binding signal; _bindPaymentStep's own setTimeout is a fallback.
    this._onPaymentFormReady = () => {
      this._hideSkeleton();
      this._bindPaymentStep();

      let brandDiv = this.container.querySelector( '.wpwl-brand.wpwl-brand-card' );
      if( brandDiv ) {
        brandDiv.classList.remove( 'wpwl-brand-svg-MASTER' );
      }
    };
    window.addEventListener('paymentFormReady', this._onPaymentFormReady);
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Fetch the current user's token balance and update internal state.
   * Mirrors TipCheckoutPopup.getUserTokenBalance() (tip-checkout-popup.js:3545).
   *
   * @param {object}   [opts]
   * @param {number}   [opts.creatorId]  Creator to fetch context for
   * @param {number}   [opts.userId]     Override user_id (falls back to window.userData.userID)
   * @param {function} [opts.onLoaded]   Called with the full response on success
   * @returns {Promise<number>} Resolved token balance
   */
  async getUserTokenBalance({ creatorId = 0, userId = 0, onLoaded } = {}) {
    const resolvedUserId = userId
      || window?.userData?.userID
      || this.extraParams?.user_id
      || 0;

    try {
      const response = await this._post({
        action:     'get_user_token_balance',
        creator_id: creatorId,
        user_id:    resolvedUserId,
      }, false); // getUserTokenBalance is not abortable — we want it to complete even if the user quickly opens and closes the form

      if (!response.error) {
        this.userTokenBalance = parseFloat(response.balance) || 0;
        this.userInfo         = response.user    || null;
        this.creatorInfo      = response.creator || null;
        this.isAnonymous      = !response.user_id; // server returning 0 → anonymous

        if (response.user_id) {
          this.extraParams.user_id = response.user_id;
        }

        console.error( response );
        // Mirror tip-checkout-popup.js:3570 — sync global config when server refreshes it
        if (response.config && window.tip_checkout_params) {
          window.tip_checkout_params.config = response.config;
        }

        // Mirror tip-checkout-popup.js:3570 — sync global config when server refreshes it
        if (response.config ) {
          if( window.tip_checkout_params === undefined ) {
            window.tip_checkout_params = {};
          }
          window.tip_checkout_params.config = response.config;
        }

        this.tip_checkout_params = response;

        if (typeof onLoaded === 'function') onLoaded(response);
      } else {
        this.userTokenBalance = window?.tip_checkout_params?.user_token_balance || 0;
      }
    } catch (_) {
      this.userTokenBalance = window?.tip_checkout_params?.user_token_balance || 0;
    }

    // Dispatch a custom event for response 
    const event = new CustomEvent('axcessUserTokenBalanceLoaded', { detail: { balance: this.userTokenBalance, userInfo: this.userInfo, creatorInfo: this.creatorInfo, isAnonymous: this.isAnonymous, tip_checkout_params: this.tip_checkout_params } });

    return this.userTokenBalance;
  }

  /**
   * Create or update an order for `amount`, then inject the payment form HTML.
   *
   * @param {number} amount          Purchase amount (e.g. 1000)
   * @param {number} [existingOrderId] If provided the existing order is updated instead of creating a new one
   * @param {string} [tip_type]     'token' (default) or 'cash' - determines which order meta key the amount is saved to and can be used by gateway logic to differentiate between booking tip and token top-up flows
   * @returns {Promise<{orderId: number, savedCards: Array}>}
   */
  async renderForm(amount, existingOrderId = null, tip_type = 'token', responseArgs = null) {
    // Build and cache the base payload — submitPayment() will reuse these exact params
    this._renderParams = {
      ...AxcessGatewayFormHandler._defaults,
      tip_type,
      topup_amount: amount,
      user_id:      window?.userData?.userID || 1,
      ...this.extraParams,
    };

    // Apply user/email from login-logout response so submitPayment() uses correct values
    if (responseArgs) {
      const resUserId = responseArgs.userData?.userID || responseArgs.userData?.user_id;
      if (resUserId)                         this._renderParams.user_id        = resUserId;
      if (responseArgs.userData?.userEmail) {
        this._renderParams.register_email  = responseArgs.userData.userEmail;
        this._renderParams.billing_email   = responseArgs.userData.userEmail;
      }
    }

    const params = { action: 'create_tip_order', ...this._renderParams };

    const resolvedOrderId = responseArgs?.order_id || responseArgs?.check_cart_product_types?.order_id || existingOrderId;
    if (resolvedOrderId) {
      params.order_id = resolvedOrderId;
    }

    // Show skeleton while the request is in flight
    this._showSkeleton();

    // If caller already has a server response with payment_content, skip the round-trip
    const response = responseArgs?.payment_content
      ? responseArgs
      : await this._post(params);

    if (response.error) {
      this._hideSkeleton();
      this._handleError(response.message || 'Failed to load payment form');
      throw new Error(response.message || 'Failed to load payment form');
    }

    this.currentOrderId = response.order_id;

    // Sync check_cart_product_types into the global custom_checkout_params (mirrors renderPaymentContent)
    if (response.check_cart_product_types ) {
      if( window.custom_checkout_params === undefined ) {
        window.custom_checkout_params = {};
      }
      window.custom_checkout_params = { ...window.custom_checkout_params, ...response.check_cart_product_types };

      window.custom_checkout_params.payment_method = window.custom_checkout_params.payment_method || 'new_card';
    }

    if (response.payment_content) {
      // _injectContent wraps payment_content; skeleton wrap is removed separately.
      // axcess-loading is set on the content wrapper so CSS targets .checkout-skeleton
      // and [data-hide-on-skeleton] inside it while wpwl initialises.
      this._injectContent(response.payment_content);
      const contentWrap = this.container.querySelector('.axcess-content-wrap');
      if (contentWrap) contentWrap.classList.add('axcess-loading');
      this._reinjectScripts(this.container);
      this._bindPaymentStep();
    }

    return {
      orderId:    response.order_id,
      savedCards: response.saved_cards || [],
      billing:    response.billing     || {},
    };
  }

  /**
   * Remove the injected form and reset internal state.
   * Call this before re-rendering with a different amount.
   */
  destroyForm() {
    this.container.innerHTML = '';
    this.currentOrderId = null;
    this._hide3DS();
    if (this._paymentAbort) {
      this._paymentAbort.abort();
      this._paymentAbort = null;
    }
  }

  /**
   * Fully tear down the handler — removes the iframe message listener.
   * Call this when the handler instance is no longer needed.
   */
  destroy() {
    this.destroyForm();
    if (this._onIframeMessage) {
      window.removeEventListener('message', this._onIframeMessage);
      this._onIframeMessage = null;
    }
    if (this._onPaymentFormReady) {
      window.removeEventListener('paymentFormReady', this._onPaymentFormReady);
      this._onPaymentFormReady = null;
    }
  }

  /**
   * Submit the payment step for the current order.
   * Collects any input/select values found inside the container automatically.
   *
   * @param {object} [extraFields] Additional fields to merge (e.g. billing info)
   * @returns {Promise<object>} Raw payment response
   */
  async submitPayment(extraFields = {}) {
    if (!this.currentOrderId) {
      throw new Error('No active order. Call renderForm() first.');
    }

    const params = {
      action:   'create_tip_order',
      step:     'payment',
      order_id: this.currentOrderId,
      ...this._renderParams, // same base params used when the form was rendered
      ...extraFields,
    };

    // Page global takes precedence over the static default (needed for GCash detection server-side)
    if (window?.custom_checkout_params?.active_payment_method) {
      params.active_payment_method = window.custom_checkout_params.active_payment_method;
    }

    // Collect input / select values from inside the container
    const fields = this.container.querySelectorAll(
      'input:not(:disabled), select:not(:disabled)'
    );
    fields.forEach(el => {
      if (el.name && el.value !== '') {
        params[el.name] = el.value;
      }
    });

    // Validate new-card form fields before submitting (mirrors custom-checkout.js:1391-1431)
    const cardErrors = this._validateCardForm();
    if (cardErrors) {
      const firstMessage = Object.entries(cardErrors)
        .filter(([, v]) => typeof v === 'string')
        .map(([, v]) => v)[0];
      this._handleError(firstMessage || 'Please complete the card form.');
      return null;
    }

    const response = await this._post(params);
    this._handlePaymentResponse(response);
    return response;
  }

  // ---------------------------------------------------------------------------
  // Internal success / error handlers
  // ---------------------------------------------------------------------------

  /**
   * Called on every successful payment completion.
   * Add shared post-success logic here (e.g. reset state, fire analytics).
   * Then calls the config-provided onSuccess callback.
   * @param {object} response
   */
  _handleSuccess(response) {
    console.error('Payment successful:', response);
    
    // TODO: add shared success logic here (e.g. update token balance display)
    this._successCallback(response);
  }

  /**
   * Called on every error (validation, network, payment failure).
   * Add shared error-handling logic here (e.g. logging, UI reset).
   * Then calls the config-provided onError callback.
   * @param {string} message
   */
  _handleError(message) {
    // TODO: add shared error logic here (e.g. console.error, analytics)
    this._errorCallback(message);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Validates the injected new-card wpwl form fields before submitting.
   * Mirrors custom-checkout.js:pageElementsValidateData (lines 1391-1431).
   * Only runs when custom_checkout_params.payment_method === 'new_card'.
   *
   * @returns {object|null} Error map (with validate:true) or null when valid.
   */
  _validateCardForm() {
    if (window?.custom_checkout_params?.payment_method !== 'new_card') return null;

    const errors = {};

    const isValidCardNumber   = window?.wpwlOptions?.isValidCardNumber   || false;
    const isValidSecurityCode = window?.wpwlOptions?.isValidSecurityCode || false;

    // Scope to container first, fall back to document (matches custom-checkout.js behaviour)
    const cardHolder = this.container.querySelector('input[name="card.holder"]')
                    || document.querySelector('input[name="card.holder"]');
    const cardExpiry = this.container.querySelector('[data-action="blur-card-expiry"]')
                    || document.querySelector('[data-action="blur-card-expiry"]');

    if (!isValidCardNumber)   errors.card_number = 'Please enter your card number.';
    if (!isValidSecurityCode) errors.card_cvc    = 'Please enter your card CVC.';

    if (cardHolder && (cardHolder.value.trim() === '' || cardHolder.classList.contains('wpwl-has-error'))) {
      errors.card_holder_name = 'Please enter your card holder name.';
    }
    if (cardExpiry && (cardExpiry.value.trim() === '' || cardExpiry.classList.contains('wpwl-has-error'))) {
      errors.card_expiry = 'Please enter your card expiry date.';
    }

    console.error( 'Card form validation errors:', errors);
    
    return Object.keys(errors).length ? { ...errors, validate: true } : null;
  }

  /**
   * All documented create_tip_order parameters with their server-side defaults.
   * Both renderForm() and submitPayment() spread this as the base payload so every
   * field is always sent explicitly — no silent server-side defaults.
   */
  static get _defaults() {
    return {
      // ── Shared ──────────────────────────────────────────────────────────────
      tip_type:              'token',
      tip_amount:            0,
      ordered_from:          'vue',
      user_id:               0,
      creator_id:            0,
      // ── Create / update step ────────────────────────────────────────────────
      topup_amount:          0,
      tip_message:           '',
      service_fee:           0,
      discount_amount:       0,
      is_anonymous:          false,
      is_from_tip_checkout:  0,
      is_call_topup_and_tip: 0,
      is_dashboard_topup:    0,
      is_topup_and_call:     0,
      is_tip_from_php:       0,
      // ── Payment step ────────────────────────────────────────────────────────
      payment_method:        '',
      token_id:              0,
      active_payment_method: 'ag_opp_checkout',
      register_email:        '',
      billing_first_name:    '',
      billing_last_name:     '',
      billing_email:         '',
      billing_phone:         '',
      billing_address_1:     '',
      billing_address_2:     '',
      billing_city:          '',
      billing_state:         'HONG KONG',
      billing_postcode:      '3000',
      billing_country:       '',
      billing_address_id:    0,
      gcash_screenshot_img:  '',

      // new fields added in the latest server-side create_tip_order.php (2024-06-10)
      is_required_tip_amount: 0,
    };
  }

  /** POST data to ajaxUrl using FormData */
  async _post(data, setAbort = false ) {
    if (this._paymentAbort) this._paymentAbort.abort();
    this._paymentAbort = new AbortController();

    const formData = new FormData();
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (value !== null && value !== undefined) {
        formData.append(
          key,
          typeof value === 'object' ? JSON.stringify(value) : value
        );
      }
    });

    const res = await fetch(this.ajaxUrl, {
      method: 'POST',
      body:   formData,
      signal: setAbort ? this._paymentAbort.signal : null,
    });

    return res.json();
  }

  /**
   * Render a skeleton into the container before the AJAX fetch starts.
   *
   * Priority:
   *   1. <template data-axcess-payment-skeleton> anywhere in the DOM — clone its content
   *   2. Hardcoded payment-form-shaped skeleton (matches .skeleton animation class)
   *   3. Simple spinner fallback
   *
   * The skeleton is replaced naturally when _injectContent() sets innerHTML.
   */
  _showSkeleton() {
    // Don't double-inject
    if (this.container.querySelector('.axcess-skeleton-wrap')) return;

    // 1 — DOM template
    const tpl = document.querySelector('template[data-axcess-payment-skeleton]');
    if (tpl) {
      const clone = tpl.content.cloneNode(true);
      const wrap  = document.createElement('div');
      wrap.className = 'axcess-skeleton-wrap';
      wrap.appendChild(clone);
      this.container.innerHTML = '';
      this.container.appendChild(wrap);
      return;
    }

    // 2 — Hardcoded payment-form skeleton (card number / expiry / cvv / holder rows)
    const wrap = document.createElement('div');
    wrap.className = 'axcess-skeleton-wrap';
    wrap.innerHTML = `
      <div class="spinner"></div>
      <span>Loading payment form…</span>
    `;
    this.container.innerHTML = '';
    this.container.appendChild(wrap);
  }

  /**
   * Remove post-inject skeleton loading state — called when paymentFormReady fires.
   * Removes axcess-loading class (reveals [data-hide-on-skeleton] content, hides
   * .checkout-skeleton blocks) and clears any leftover .axcess-skeleton-wrap.
   */
  _hideSkeleton() {
    // Remove axcess-loading from the content wrapper (where checkout-skeleton lives)
    const contentWrap = this.container.querySelector('.axcess-content-wrap');
    if (contentWrap) contentWrap.classList.remove('axcess-loading');

    // Also remove any pre-fetch skeleton still in the container
    const skeletonWrap = this.container.querySelector('.axcess-skeleton-wrap');
    if (skeletonWrap) skeletonWrap.remove();
  }

  /**
   * Inject payment_content into the container using a dedicated wrapper element.
   * Replaces any existing content wrapper but leaves other container children
   * (e.g. .axcess-skeleton-wrap) untouched so they can be removed separately.
   */
  _injectContent(html) {
    // Remove previous content wrapper if present
    const existing = this.container.querySelector('.axcess-content-wrap');
    if (existing) existing.remove();

    const wrap = document.createElement('div');
    wrap.className = 'axcess-content-wrap';
    wrap.innerHTML = html;
    this.container.appendChild(wrap);
  }

  /**
   * Re-create and re-append every <script> tag inside `el` so the browser
   * executes them (innerHTML does not execute injected scripts).
   */
  _reinjectScripts(el) {
    const scripts = Array.from(el.querySelectorAll('script'));
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(attr =>
        newScript.setAttribute(attr.name, attr.value)
      );
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }

  /**
   * Bind a submit handler to the wpwl card form injected in the container.
   * When the user clicks the gateway's own Pay button, intercept and call
   * submitPayment() so we route through step=payment.
   */
  _bindPaymentStep() {
    // Give the gateway scripts a tick to initialise before we bind
    setTimeout(() => {
      const wpwlForm = this.container.querySelector(
        'form.wpwl-form.wpwl-form-card'
      );
      if (!wpwlForm) return;

      // wpwlForm.addEventListener('submit', async (e) => {
      //   e.preventDefault();
      //   await this.submitPayment();
      // }, { once: true });
    }, 0);
  }

  /** Route the payment step response to the correct handler */
  _handlePaymentResponse(response) {
    if (response.error) {
      this._handleError(response.message || 'Payment failed');
      return;
    }

    const { payment_status, payment_type, payment_response } = response;

    if (payment_status === 'success') {
      if (payment_type === '3d_secure_required' && payment_response?.iframe) {
        this._show3DS(payment_response.iframe);
        return;
      }

      if (payment_type === 'new_card_payment_form') {
        this._triggerWpwlSubmit();
        return;
      }

      // Genuine success
      this._handleSuccess(response);
      return;
    }

    if (payment_status === 'fail') {
      const reason = payment_response?.message || 'Payment failed. Please try again.';
      this._handleError(reason);
      return;
    }

    // Unexpected status — surface to caller
    this._handleError(`Unexpected payment status: ${payment_status}`);
  }

  /**
   * Ensure the shared custom iframe element exists in the DOM.
   * Matches the structure from template-payment-iframe.php.
   * @returns {HTMLIFrameElement}
   */
  _ensureIframe() {
    let iframe = document.getElementById('checkoutCustomIframe');
    if (!iframe) {
      const wrapper = document.createElement('div');
      wrapper.className = 'checkoutCustomIframe';

      iframe = document.createElement('iframe');
      iframe.id          = 'checkoutCustomIframe';
      iframe.name        = 'checkoutCustomIframe';
      iframe.frameBorder = '0';
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
      iframe.setAttribute('allow', 'fullscreen');

      wrapper.appendChild(iframe);
      document.body.appendChild(wrapper);
    }
    return iframe;
  }

  /**
   * Show the 3DS content inside the shared custom iframe.
   * Adds `.show-3d-secure.use-custom-iframe` to document.body to reveal it
   * (mirrors the CSS in template-payment-iframe.php).
   */
  _show3DS(iframeHtml) {
    const iframe = this._ensureIframe();

    // Write the 3DS HTML into the iframe
    let doc = null;
    try { doc = iframe.contentDocument || iframe.contentWindow?.document; } catch { /* cross-origin */ }
    if (doc) {
      doc.open();
      doc.write(iframeHtml);
      doc.close();
    } else {
      // Fallback: srcdoc for cross-origin-safe injection
      iframe.srcdoc = iframeHtml;
    }

    document.body.classList.add('show-3d-secure', 'use-custom-iframe');
  }

  /** Hide the custom iframe and remove the body classes */
  _hide3DS() {
    document.body.classList.remove('show-3d-secure', 'use-custom-iframe');
    const iframe = document.getElementById('checkoutCustomIframe');
    if (iframe) {
      let doc = null;
      try { doc = iframe.contentDocument || iframe.contentWindow?.document; } catch { /* cross-origin */ }
      if (doc) { doc.open(); doc.write(''); doc.close(); }
      iframe.srcdoc = '';
    }
  }

  /** Trigger the wpwl form's submit button so the gateway processes the card */
  _triggerWpwlSubmit() {
    const form = this.container.querySelector(
      '.wpwl-container.wpwl-container-card .wpwl-form.wpwl-form-card'
    );
    if (!form) return;

    const btn = form.querySelector('.wpwl-group-submit button:not([disabled])');
    if (btn) {
      btn.click();
    } else {
      form.dispatchEvent(new Event('submit'));
    }
  }
}

// Expose as a global for non-module contexts
if (typeof window !== 'undefined') {
  window.AxcessGatewayFormHandler = AxcessGatewayFormHandler;
}

// ES module export (optional)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AxcessGatewayFormHandler;
}