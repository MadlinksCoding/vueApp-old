<script setup>
import {
  bookingFlowAccountVerifiedIcon,
  bookingFlowArrowLeftIcon,
  bookingFlowArrowRightIcon,
  bookingFlowAtSignIcon,
  bookingFlowChevronDownIcon,
  bookingFlowCreditIcon,
  bookingFlowDoubleDropdownIcon,
  bookingFlowTokenIcon,
  bookingFlowMapsTravelsIcon,
  bookingFlowArrowsDownIcon,
  bookingFlowTruckIcon,
  bookingFlowCalendarCheckIcon,
  bookingFlowLightningIcon,
} from "../OneOnOneBookingFlow/oneOnOneBookingFlowAssets.js";
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue';
import { showToast } from '@/utils/toastBus.js';
import '@/utils/axcessGatewayFormHandler.js';
import '@/assets/css/axcessGatewayForm.css';
import GuestCheckoutForm from './GuestCheckoutForm.vue';
import CardForm from './CardForm.vue';
import SubscriptionSwitchConfirmation, { subscriptionSwitchReviewKey } from './SubscriptionSwitchConfirmation.vue';
import TooltipIcon from "@/components/ui/tooltip/TooltipIcon.vue";
import { useBookingTranslations } from '@/i18n/bookingTranslations.js';
import { getBackendJwtToken, normalizeBackendAuthContext } from '@/utils/backendJwt.js';
import { getBookingPrerequisitePrice } from '@/services/bookings/bookingsApiUtils.js';

const props = defineProps({
  walletBalance: {
    type: Number,
    required: true
  },
  topUpAmount: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  remainingBalance: { // Balance after booking (Wallet + TopUp - Total)
    type: Number,
    required: true
  },
  beforeSubmit: { type: Function, default: null },
  fanId:        { type: Number, default: 0 },
  creatorId:    { type: Number, default: 0 },
  creator: { type: Object, default: null },
  eventId:      { type: [String, Number], default: '' },
  prerequisite: { type: Object, default: null },
  confirmedSwitch: { type: String, default: '' },
  afterPrerequisitePayment: { type: Function, default: null },
  afterAuthUpdate: { type: Function, default: null },
  activateFreePrerequisite: { type: Function, default: null },
});

const emit = defineEmits(['back', 'success', 'payment-failed', 'auth-updated']);
const { t } = useBookingTranslations();

const AMOUNT_PRESETS = [500, 1000, 3000, 5000];

const tipCheckoutPopup = ref(true);
const isPaymentSummaryOpen = ref(true);
const isProcessing     = ref(false);
const isFormLoading    = ref(false);
const paymentError     = ref('');
const showPaymentFailure = ref(false);
const failureCountdown = ref(5);
let failureTimer = null;

function closePaymentFailure() {
  const wasOpen = showPaymentFailure.value;
  showPaymentFailure.value = false;
  paymentError.value = '';
  if (failureTimer) clearInterval(failureTimer);
  if (wasOpen) void reloadCardForm();
}

const billingEmail     = ref('');
const cardFormRef      = ref(null);
const guestFormRef     = ref(null);
const currentOrderId   = ref(null);
const checkoutDetails  = ref(null);
const checkoutPhase    = ref(props.prerequisite?.product && !props.prerequisite?.eligible ? 'prerequisite' : 'topup');
const isUpdatingAccount = ref(false);
const accountCheckFailed = ref(false);
const prerequisiteReview = ref(null);
const prerequisiteReviewOpen = ref(false);
const prerequisiteReviewButton = ref(null);
const authenticatedCheckoutPayload = ref(null);
const prerequisitePaymentResult = ref(null);
const shippingExpanded = ref(Boolean(props.prerequisite?.shipping?.required));
const shippingError    = ref('');
const isUpdatingShipping = ref(false);
const shippingAddressId = ref('');
const saveShippingAddress = ref(true);
const quotedShippingAddress = ref('');
const shippingAddress  = ref({
  first_name: '', last_name: '', address_1: '', address_2: '', city: '',
  state: '', postcode: '', country: '', phone: '', email: '',
});

let handler = null;

const selectedAmount  = ref(props.topUpAmount);
const amountInput     = ref(props.topUpAmount);
const pricingConfig   = ref(null);

const minPurchase = computed(() => pricingConfig.value?.min_purchase  ?? 10);
const maxPurchase = computed(() => pricingConfig.value?.max_purchase  ?? 14000);
const hasPrerequisite = computed(() => Boolean(props.prerequisite?.product));
const isPrerequisiteCheckout = computed(() => checkoutPhase.value === 'prerequisite' && hasPrerequisite.value);
const isPrerequisitePaid = computed(() => Boolean(prerequisitePaymentResult.value || props.prerequisite?.eligible));
const requiresTopUp = computed(() => Number(props.topUpAmount || 0) > 0);
const isSubscriptionPrerequisite = computed(() => (
  props.prerequisite?.type === 'subscription'
  || ['subscribe', 'switch'].includes(String(props.prerequisite?.action || ''))
  || checkoutDetails.value?.is_subscription === true
  || Boolean(checkoutDetails.value?.subscription_switch?.subscription_id)
));
const prerequisiteLabel = computed(() => isSubscriptionPrerequisite.value
  ? t('fan_booking_mandatory_subscription')
  : t('fan_booking_mandatory_purchase'));
const prerequisiteProduct = computed(() => props.prerequisite?.product || checkoutDetails.value?.items?.[0] || null);
const prerequisiteProductTitle = computed(() => {
  const product = prerequisiteProduct.value || {};
  const isSubscriptionVariation = product.is_subscription_variation === true
    || Number(product.is_subscription_variation) === 1
    || isSubscriptionPrerequisite.value;
  if (isSubscriptionVariation && String(product.variation_title || '').trim()) {
    return String(product.variation_title).trim();
  }
  return String(product.title || product.name || '').trim();
});
const prerequisitePrice = computed(() => {
  // Before an address is quoted, the merch item can still include WooCommerce's
  // default-country shipping. Show the validated product price separately;
  // the order total remains authoritative and is not changed here.
  const unquotedMerch = props.prerequisite?.shipping?.is_merch
    && checkoutDetails.value?.address_complete === false;
  return Number(unquotedMerch
    ? (prerequisiteProduct.value?.price ?? checkoutDetails.value?.items?.[0]?.total ?? 0)
    : (checkoutDetails.value?.items?.[0]?.total ?? getBookingPrerequisitePrice(props.prerequisite)));
});
const amountDueUsd = computed(() => Number(
  isPrerequisiteCheckout.value
    ? (checkoutDetails.value?.total ?? prerequisitePrice.value)
    : Number(topUpUSD.value),
));
const prerequisiteOrderUsd = computed(() => Number(
  checkoutDetails.value?.product_total
    ?? (prerequisitePrice.value + Number(checkoutDetails.value?.shipping_total || 0)),
));
const requiresShipping = computed(() => Boolean(
  checkoutDetails.value?.requires_shipping ?? props.prerequisite?.shipping?.required,
));
const shippingCountryMismatch = computed(() => {
  const shipping = props.prerequisite?.shipping;
  return requiresShipping.value && shipping?.is_merch && shipping.international === false
    && Boolean(shipping.country_code && shippingAddress.value.country)
    && shipping.country_code.toUpperCase() !== shippingAddress.value.country.toUpperCase();
});
const shippingWarning = computed(() => shippingCountryMismatch.value
  ? t('fan_booking_shipping_country_mismatch', { country: props.prerequisite.shipping.country })
  : shippingError.value);
watch(shippingCountryMismatch, (mismatch) => {
  if (mismatch) shippingExpanded.value = true;
});
const shippingCostLabel = computed(() => {
  // Never present an old quote as the cost of an edited address.
  if (checkoutDetails.value?.address_complete) {
    if (shippingNeedsUpdate.value) return t('fan_booking_calculated_at_checkout');
    const cost = Number(checkoutDetails.value.shipping_total || 0);
    return cost > 0
      ? t('fan_booking_shipping_charge', { amount: cost.toFixed(2) })
      : t('fan_booking_free_shipping');
  }
  const cost = props.prerequisite?.shipping?.cost;
  if (typeof cost === 'number') {
    return cost > 0
      ? t('fan_booking_shipping_charge', { amount: cost.toFixed(2) })
      : t('fan_booking_free_shipping');
  }
  return props.prerequisite?.shipping?.cost_label || t('fan_booking_calculated_at_checkout');
});
const shippingAddressComplete = computed(() => {
  if (!requiresShipping.value) return true;
  if (shippingCountryMismatch.value) return false;
  const country = shippingAddress.value.country;
  if (!checkoutDetails.value?.shipping_countries?.[country]) return false;
  return Object.entries(shippingFields.value).every(([key, field]) => (
    !field.required || field.hidden || String(shippingAddress.value[key] || '').trim()
  ));
});
const shippingFields = computed(() => checkoutDetails.value?.shipping_fields?.[shippingAddress.value.country] || {});
const shippingStates = computed(() => checkoutDetails.value?.shipping_states?.[shippingAddress.value.country] || {});
const savedShippingAddresses = computed(() => checkoutDetails.value?.shipping_addresses || []);
const shippingNeedsUpdate = computed(() => requiresShipping.value && (
  !checkoutDetails.value?.address_complete || quotedShippingAddress.value !== shippingSignature(shippingAddress.value)
));
function shippingSignature(address) {
  return JSON.stringify(Object.keys(shippingAddress.value).map(key => String(address?.[key] || '').trim()));
}
function selectShippingAddress() {
  const address = savedShippingAddresses.value.find(item => String(item.id) === shippingAddressId.value);
  shippingAddress.value = Object.fromEntries(Object.keys(shippingAddress.value).map(key => [key, address?.[key] || '']));
  shippingError.value = '';
}

// --- PRICING TIERS ---
function getTierForAmount(amount) {
  const tiers = pricingConfig.value?.pricing_tiers;
  if (!tiers) return null;
  return Object.values(tiers).find(
    (tier) => amount >= tier.min_tokens && amount <= tier.max_tokens,
  ) || null;
}

const activeTier = computed(() => getTierForAmount(selectedAmount.value));

const topUpUSD = computed(() => {
  if (isPrerequisiteCheckout.value && checkoutDetails.value?.topup_usd != null) {
    return Number(checkoutDetails.value.topup_usd).toFixed(2);
  }
  const tier = activeTier.value;
  if (tier) return (selectedAmount.value * tier.price_per_token).toFixed(2);
  const base = pricingConfig.value?.base_price_per_token || 0.1099;
  return (selectedAmount.value * base).toFixed(2);
});

const discountPercentage = computed(() => activeTier.value?.discount_percentage ?? 0);

const balanceAfterTopUp   = computed(() => props.walletBalance + selectedAmount.value);
const balanceAfterBooking = computed(() => balanceAfterTopUp.value - props.totalPrice);

const isAmountBelowDefault = computed(() => {
  if (!requiresTopUp.value) return false;
  const current = Number(amountInput.value);
  let defaultAmount = Math.max(props.topUpAmount, minPurchase.value);

  return current < defaultAmount;
});

const checkoutUserId = ref(Number(window?.userData?.userID ?? props.fanId) || 0);
const isLoggedIn = computed(() => checkoutUserId.value > 0);

const hasEmail  = computed(() => isLoggedIn.value || billingEmail.value?.trim().includes('@'));
const canSubmit = computed(() =>
  !isFormLoading.value && !isProcessing.value && hasEmail.value
  && !isUpdatingAccount.value && !accountCheckFailed.value
  && !prerequisiteReview.value
  && !guestFormRef.value?.requiresLogin
  && Boolean(cardFormRef.value?.canPay)
  && !isAmountBelowDefault.value
  && shippingAddressComplete.value
  && !shippingNeedsUpdate.value
  && !isUpdatingShipping.value
);
const paymentButtonLabel = computed(() => {
  if (!isPrerequisiteCheckout.value) return t('fan_booking_top_up_complete_booking_spaced');
  return t('fan_booking_pay_and_complete_booking');
});

function checkoutRequestParams() {
  const checkout = props.prerequisite?.checkout || {};
  // Cart::add_to_cart() expects a purchasable variation ID in product_id.
  // Keep variation_id alongside it for the existing subscription-switch
  // metadata, but do not send the variable parent as the buy-now item.
  const variationId = Number(checkout.variation_id || 0);
  const productId = Number(checkout.product_id || prerequisiteProduct.value?.parent_id || prerequisiteProduct.value?.id || 0);
  const purchasableProductId = variationId || productId;
  const params = {
    product_id: purchasableProductId,
    variation_id: variationId,
    booking_event_id: String(props.eventId || ''),
    booking_prerequisite_product_id: purchasableProductId,
    booking_prerequisite_type: String(props.prerequisite?.type || ''),
    // Separate orders share one gateway authorization for the complete total.
    booking_topup_tokens: requiresTopUp.value ? selectedAmount.value : 0,
    booking_contribution_tokens: Math.max(0, Math.ceil(Number(props.totalPrice || 0))),
  };
  try {
    const url = new URL(checkout.url || '', window.location.origin);
    ['switch-subscription', '_wcsnonce', 'item'].forEach((key) => {
      if (url.searchParams.has(key)) params[key] = url.searchParams.get(key);
    });
  } catch (_) { /* validation supplies direct product identifiers */ }
  return params;
}

const prerequisiteGuestCheckoutContext = computed(() => isPrerequisiteCheckout.value ? {
  ...checkoutRequestParams(),
  booking_prerequisite_checkout: 1,
  order_key: checkoutDetails.value?.order_key || '',
  tip_checkout_popup: 0,
  is_buy_now: 1,
  is_call_checkout: 1,
  prevent_payment_redirect: 1,
  is_has_merch: requiresShipping.value ? 1 : 0,
  items: handler?._renderParams?.items || [],
} : null);

function applyCheckoutDetails(details = {}) {
  if (!details || typeof details !== 'object') return;
  const preserveEditedAddress = !checkoutDetails.value
    ? Object.values(shippingAddress.value).some(value => String(value || '').trim())
    : Boolean(details.order_id)
      && checkoutDetails.value.order_id === details.order_id
      && quotedShippingAddress.value !== shippingSignature(shippingAddress.value);
  checkoutDetails.value = details;
  const nextAddress = details.shipping_address || details.billing_address;
  if (!preserveEditedAddress && nextAddress && typeof nextAddress === 'object') {
    shippingAddress.value = { ...shippingAddress.value, ...nextAddress };
    quotedShippingAddress.value = shippingSignature(shippingAddress.value);
    const saved = (details.shipping_addresses || []).find(address => (
      shippingSignature(address) === quotedShippingAddress.value
    ));
    shippingAddressId.value = saved ? String(saved.id) : '';
  }
  if (requiresShipping.value && !shippingAddressComplete.value) shippingExpanded.value = true;
}

async function updateShippingAddress() {
  if (!currentOrderId.value || !shippingAddressComplete.value || isUpdatingShipping.value) {
    shippingError.value = t('fan_booking_shipping_address_required');
    return;
  }

  isUpdatingShipping.value = true;
  shippingError.value = '';
  try {
    const response = await handler.prepareBookingShipping({
      ...shippingPaymentFields(),
      user_id: resolveFanUserId(),
      billing_email: billingEmail.value,
      register_email: billingEmail.value,
    });
    // A successful address update confirms these edits. Card/amount refreshes
    // must not replace unfinished address edits with the old order address.
    quotedShippingAddress.value = shippingSignature(shippingAddress.value);
    applyCheckoutDetails(response.booking_checkout);
    await reloadCardForm({
      ...response,
      order_id: currentOrderId.value,
      payment_content: response.payment_cards,
      check_cart_product_types: response.custom_checkout_params,
    });
    shippingExpanded.value = false;
  } catch (error) {
    shippingError.value = error?.message || t('fan_booking_shipping_update_failed');
  } finally {
    isUpdatingShipping.value = false;
  }
}

function shippingPaymentFields() {
  if (!requiresShipping.value) return {};
  return {
    show_shipping_address: 1,
    save_shipping_address: saveShippingAddress.value ? 1 : 0,
    shipping_address_id: shippingAddressId.value,
    ...Object.fromEntries(Object.entries(shippingAddress.value).map(([key, value]) => [`shipping_${key}`, value || ''])),
    // Normal merch checkout uses the delivery address for its hidden billing
    // fields. Keep that same mapping for the inline booking checkout.
    ...Object.fromEntries(Object.entries(shippingAddress.value)
      .filter(([key]) => key !== 'email')
      .map(([key, value]) => [`billing_${key}`, value || ''])),
  };
}

function resolveFanUserId() {
  return checkoutUserId.value;
}
function resolveCreatorId() {
  return props.creatorId || 0;
}

function tokenCheckoutParams() {
  return {
    user_id:           resolveFanUserId(),
    creator_id:        resolveCreatorId(),
    is_topup_and_call: 1,
    ordered_from:      'vue',
    register_email:    billingEmail.value,
    billing_email:     billingEmail.value,
  };
}

function normalizeAuthPayload(response = {}) {
  const { userId, backendJwtToken } = normalizeBackendAuthContext(response);

  return {
    userId,
    backendJwtToken,
    order_id: response?.order_id ?? response?.orderId ?? null,
    receipt_url: response?.receipt_url ?? response?.order_received_url ?? '',
    prerequisite_order_id: response?.prerequisite_order_id ?? null,
    token_order_id: response?.token_order_id ?? null,
    response,
  };
}

// Dev helper — patch window.userData from localStorage so guest form reflects logged-in state.
// Usage in console:
//   localStorage.setItem('devUserId', '4489');
//   localStorage.setItem('devUserEmail', 'Nhsnhs16012026@nhs.com');
//   localStorage.setItem('devUserName', 'NHS16012026');
// Then reload. Clear with localStorage.removeItem('devUserId').
function resolveUserData() {
  const devId = localStorage.getItem('devUserId');
  if (!devId) return;
  if (!window.userData) window.userData = {};
  window.userData.userID          = Number(devId);
  window.userData.userEmail       = localStorage.getItem('devUserEmail') || '';
  window.userData.userDisplayName = localStorage.getItem('devUserName')  || 'Dev User';
}
// Run immediately so window.userData is set before child components (GuestCheckoutForm) initialise
resolveUserData();

function resolveAjaxUrl() {
  if( window.location.hostname === 'bookings-frontend-omega.vercel.app' ) {
    // Dev environment - point to staging ajax_url to allow testing with real payment processing without needing to run local backend
    return 'https://new-stage.fansocial.app/wp-admin/admin-ajax.php';
  }

  return window?.custom_checkout_params?.ajax_url || '/wp-admin/admin-ajax.php'
}

async function initHandler() {
  const container = cardFormRef.value?.paymentContainer;
  if (!container) return;

  handler = new window.AxcessGatewayFormHandler({
    ajaxUrl:    resolveAjaxUrl(),
    container,
    checkoutMode: isPrerequisiteCheckout.value ? 'booking-prerequisite' : 'token',
    extraParams: {
      ...tokenCheckoutParams(),
      ...(isPrerequisiteCheckout.value ? checkoutRequestParams() : {}),
    },
    onSuccess: handlePaymentSuccess,
    onError:   handlePaymentError,
  });

  // Default min is 10 if config not loaded yet, 
  // but renderForm will error if selectedAmount is below actual min_purchase, 
  // so clamp here to ensure form loads and recovers properly once config is available
  // Clamp initial amount up to min_purchase now that config is available
  const minAllowed = pricingConfig.value?.min_purchase ?? 10;
  if (!isPrerequisiteCheckout.value && selectedAmount.value < minAllowed) {
    selectedAmount.value = minAllowed;
    amountInput.value    = minAllowed;
  }

  if (!billingEmail.value) {
    const email = handler.userInfo?.email || handler.userInfo?.user_email || '';
    if (email) billingEmail.value = email;
  }

  isFormLoading.value = true;
  try {
    const { orderId, checkout } = await handler.renderForm(selectedAmount.value, null, 'token');
    console.error('[TopUpForm] Initial renderForm result:', { orderId });
    currentOrderId.value = orderId ?? null;
    applyCheckoutDetails(checkout);
    cardFormRef.value?.syncSavedCards();
  } catch (err) {
    console.error('[TopUpForm] renderForm failed during init:', err);
    paymentError.value = t('fan_booking_payment_form_load_failed');
  } finally {
    isFormLoading.value = false;
  }
  window.axcessHandler = handler;

  await handler.ready;
  pricingConfig.value = handler.tip_checkout_params?.config || null;

  // const email = handler.userInfo?.email || handler.userInfo?.user_email || '';
  const email = window.custom_checkout_params?.user?.email || '';
  if (email) {
    billingEmail.value = email;
    if (window?.custom_checkout_params?.userData) {
      if ( !isLoggedIn.value || window?.userData.userID && window?.userData.userID != window?.custom_checkout_params?.userData.userID) {
        window.userData = window.custom_checkout_params.userData; // Ensure global userData is updated for consistency across components, especially GuestCheckoutForm
      }
    }
  }
  console.log('[TopUpForm] Handler ready with user info:', handler.userInfo, email);

}

async function selectAmount(amount) {
  if (isProcessing.value || !handler) return;
  selectedAmount.value = amount;
  amountInput.value = amount;
  handler.destroyForm();
  cardFormRef.value?.resetCardValidity();
  const existingOrderId = currentOrderId.value;
  currentOrderId.value = null;
  isFormLoading.value = true;
  try {
    if (isPrerequisiteCheckout.value) {
      handler.extraParams = { ...handler.extraParams, ...checkoutRequestParams(), booking_topup_tokens: amount };
    }
    const { orderId, checkout } = await handler.renderForm(amount, existingOrderId, 'token');
    console.error('[TopUpForm] renderForm result from selectAmount:', { orderId });
    currentOrderId.value = orderId ?? null;
    applyCheckoutDetails(checkout);
    cardFormRef.value?.syncSavedCards();
  } catch (err) {
    console.error('[TopUpForm] renderForm failed during selectAmount:', err);
    paymentError.value = t('fan_booking_payment_form_reload_failed');
  } finally {
    isFormLoading.value = false;
  }
}

let amountDebounceTimer = null;
function onAmountInput(event) {
  const val = event.target.value;
  amountInput.value = val;
  const raw = Number(val);
  if (isNaN(raw)) return;
  let minAllowed = Math.max(props.topUpAmount, minPurchase.value);

  clearTimeout(amountDebounceTimer);
  amountDebounceTimer = setTimeout(() => {
    if (raw > 0 && raw >= minAllowed) {
      const clamped = Math.min(Math.round(raw), maxPurchase.value);
      selectAmount(clamped);
    }
  }, 600);
}

async function handlePaymentSuccess(_response) {
  console.error('Payment successful:', _response);

  // payment_status
  // :
  // "success"
  // payment_type
  // :
  // "payment_success"
  // Spinner stays visible — BookingFlowStep3 hides it after booking creation completes
  if( 
    (_response?.payment_type && (_response?.payment_type == 'payment_success' && _response?.payment_status == 'success'))  
    || 
    (_response?.order_status && ( _response.order_status == 'completed' || _response.order_status == 'processing' )) 
  ) {
    cardFormRef.value?.setProcessingPayment(true, 'balance-sync');
    let successResponse = _response;

    // Finish the existing paid-order login even when the parent profile has
    // not loaded the separate WooCommerce popup's guest helper.
    if( !isLoggedIn.value || (isPrerequisiteCheckout.value && checkoutDetails.value?.guest_checkout) ) {
      window.parent.preventReloadOnCheckoutClose = true;
      try {
        const orderKey = isPrerequisiteCheckout.value
          ? checkoutDetails.value?.order_key || ''
          : handler?.currentOrderKey || '';
        const guestHelper = window.parent?.guestCheckout;
        // A guest product order may already expose its newly created account
        // in the payment fragment. That is not proof the browser is signed in.
        const apiresponse = !isPrerequisiteCheckout.value && guestHelper?.checkGuestAuthAfterPayment
          ? await guestHelper.checkGuestAuthAfterPayment(_response.order_id, orderKey)
          : await fetch('/wp-json/api/checkout/after-payment', {
              method: 'POST', credentials: 'same-origin',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ order_id: _response.order_id, order_key: orderKey, profile_user_id: props.creatorId }),
            }).then((response) => response.json());
        console.warn('checkGuestAuthAfterPayment response:', apiresponse);
        if (apiresponse?.success) {
          checkoutUserId.value = normalizeBackendAuthContext(apiresponse).userId || 0;
          if (apiresponse.userData) window.userData = { ...window.userData, ...apiresponse.userData };
          successResponse = {
            ..._response,
            ...apiresponse,
            data: {
              ...(_response?.data || {}),
              ...(apiresponse?.data || {}),
            },
            userData: apiresponse.userData || _response?.userData,
          };
          if (apiresponse.userData) {
            window.parent.isUserAuthChanged = true;
          }
        }
      } catch (error) {
        console.error('[TopUpForm] Guest authentication after payment failed:', error);
      }
    }

    if (isPrerequisiteCheckout.value) {
      const prerequisitePayload = normalizeAuthPayload(successResponse);
      const prerequisiteReady = props.afterPrerequisitePayment
        ? await props.afterPrerequisitePayment(prerequisitePayload)
        : true;

      if (prerequisiteReady === false) {
        isProcessing.value = false;
        cardFormRef.value?.setProcessingPayment(false);
        return;
      }

      prerequisitePaymentResult.value = successResponse;
    }

    const prerequisiteOrderId = prerequisitePaymentResult.value?.order_id
      || prerequisitePaymentResult.value?.orderId
      || null;
    emit('success', normalizeAuthPayload({
      ...successResponse,
      prerequisite_order_id: prerequisiteOrderId,
      token_order_id: successResponse?.token_order_id
        || successResponse?.booking_checkout?.token_order_id
        || null,
    }));
  } else {
    handlePaymentError(_response?.error_message || '');
  }
}

function handlePaymentError(message) {
  isProcessing.value = false;
  cardFormRef.value?.setProcessingPayment(false);
  console.error('Payment error:', message);
  paymentError.value = message || t('fan_booking_payment_failed_message');

  showPaymentFailure.value = true;
  failureCountdown.value = 5;
  if (failureTimer) clearInterval(failureTimer);
  failureTimer = setInterval(() => {
    failureCountdown.value--;
    if (failureCountdown.value <= 0) {
      closePaymentFailure();
      emit('payment-failed', { error_message: message });
    }
  }, 1000);
}

async function handlePayNow() {
  if (prerequisiteReview.value) {
    openPrerequisiteReview();
    return;
  }
  console.error('handlePayNow clicked with state:', {
    isProcessing: isProcessing.value,
    handlerReady: Boolean(handler),
    canPay: canSubmit.value,
    billingEmail: billingEmail.value,
  });

  if (isProcessing.value || !handler) {
    console.error('Payment is already processing or handler not ready');
    return;
  }
  if (props.beforeSubmit && props.beforeSubmit() === false) return;
  if (isPrerequisiteCheckout.value && (!shippingAddressComplete.value || shippingNeedsUpdate.value || isUpdatingShipping.value)) {
    shippingExpanded.value = true;
    shippingError.value = t('fan_booking_shipping_address_required');
    return;
  }

  // If renderForm failed silently on init, attempt to recover before blocking the user
  if (!handler.currentOrderId) {
    paymentError.value = t('fan_booking_reloading_payment_form');
    await reloadCardForm();
    if (!handler.currentOrderId) {
      paymentError.value = t('fan_booking_payment_form_load_failed');
      return;
    }
    paymentError.value = '';
  }

  isProcessing.value = true;
  cardFormRef.value?.setProcessingPayment(true);
  paymentError.value = '';
  try {
    await handler.submitPayment({
      billing_email:  billingEmail.value,
      register_email: billingEmail.value,
      ...shippingPaymentFields(),
      ...(cardFormRef.value?.getPaymentExtraFields() ?? {}),
    });
  } catch (err) {
    isProcessing.value = false;
    cardFormRef.value?.setProcessingPayment(false);
    paymentError.value = err?.message || t('fan_booking_payment_failed_message');
    console.error('[TopUpForm] submitPayment error:', err);
  }
}

async function reloadCardForm(res = null) {
  if (!handler) return;
  if (!isPrerequisiteCheckout.value) handler.extraParams = { ...handler.extraParams, ...tokenCheckoutParams() };
  handler.destroyForm();
  cardFormRef.value?.resetCardValidity();
  const existingOrderId = res?.order_id ?? currentOrderId.value;
  currentOrderId.value  = null;
  isFormLoading.value   = true;
  console.error('[TopUpForm] Reloading card form with params:', { selectedAmount: selectedAmount.value, existingOrderId, res });
  try {
    const responseArgs = res ? { ...res } : {};
    responseArgs.order_id = responseArgs.order_id || existingOrderId; // Ensure order_id is passed to renderForm for proper recovery
    const { orderId, checkout } = await handler.renderForm(selectedAmount.value, existingOrderId, 'token', responseArgs);
    currentOrderId.value = orderId ?? null;
    applyCheckoutDetails(checkout);
    cardFormRef.value?.syncSavedCards();
  } catch (err) {
    console.error('[TopUpForm] renderForm failed during reloadCardForm:', err);
    paymentError.value = t('fan_booking_payment_form_reload_failed');
  } finally {
    isFormLoading.value = false;
  }
}

async function handleGuestLogin(res = null) {
  checkoutUserId.value = normalizeBackendAuthContext(res || {}).userId || 0;
  if (hasPrerequisite.value && props.afterAuthUpdate) {
    isUpdatingAccount.value = true;
    accountCheckFailed.value = false;
    try {
      // Login may reveal ownership or an existing subscription tier. Refresh
      // before rendering another order so the fan is not charged to buy it again.
      window.custom_checkout_params = { ...window.custom_checkout_params, ...res?.custom_checkout_params };
      authenticatedCheckoutPayload.value = normalizeAuthPayload(res || {});
      const detail = await props.afterAuthUpdate(authenticatedCheckoutPayload.value);
      await nextTick();
      if (!detail) {
        accountCheckFailed.value = true;
        paymentError.value = t('fan_booking_prerequisite_check_failed');
        return;
      }
      if (detail.eligible || detail.action === 'switch') {
        // Keep the account check separate from the fan's acknowledgement. An
        // owned item or a tier change must never be silently paid for again.
        handler?.destroy();
        currentOrderId.value = null;
        checkoutDetails.value = null;
        prerequisiteReview.value = { detail, afterLogin: true };
        openPrerequisiteReview();
        return;
      }
      await applyAuthenticatedCheckout(detail);
    } catch (error) {
      accountCheckFailed.value = true;
      paymentError.value = error?.message || t('fan_booking_prerequisite_check_failed');
    } finally {
      isUpdatingAccount.value = false;
    }
    return;
  }
  if (props.afterAuthUpdate) await props.afterAuthUpdate(normalizeAuthPayload(res || {}));
  else emit('auth-updated', normalizeAuthPayload(res || {}));
  await reloadCardForm(res);
}

function openPrerequisiteReview() {
  prerequisiteReviewOpen.value = true;
  nextTick(() => prerequisiteReviewButton.value?.focus());
}

async function applyAuthenticatedCheckout(detail) {
  checkoutPhase.value = detail.eligible ? 'topup' : 'prerequisite';
  if (detail.eligible && !requiresTopUp.value) {
    // A login/acknowledgement is not a payment-success event.
    emit('back');
    return;
  }
  handler?.destroy();
  currentOrderId.value = null;
  checkoutDetails.value = null;
  await initHandler();
}

async function confirmPrerequisiteReview(previouslyConfirmed = false) {
  if (!prerequisiteReview.value || isUpdatingAccount.value) return;
  isUpdatingAccount.value = true;
  accountCheckFailed.value = false;
  try {
    // Recheck after the prompt too: account ownership can change while it is open.
    let detail = props.afterAuthUpdate
      ? await props.afterAuthUpdate(authenticatedCheckoutPayload.value || {
        userId: props.fanId,
        backendJwtToken: getBackendJwtToken() || window.userData?.jwtToken || '',
      })
      : prerequisiteReview.value.detail;
    await nextTick();
    if (!detail) throw new Error(t('fan_booking_prerequisite_check_failed'));
    if (previouslyConfirmed === true && detail.action === 'switch'
      && props.confirmedSwitch !== subscriptionSwitchReviewKey(detail, props.fanId, props.eventId)) {
      prerequisiteReview.value = { detail };
      openPrerequisiteReview();
      return;
    }
    if (!detail.eligible && detail.type === 'subscription' && Number(detail.product?.price) === 0 && props.activateFreePrerequisite) {
      detail = await props.activateFreePrerequisite();
      if (!detail?.eligible) throw new Error(t('fan_booking_prerequisite_check_failed'));
      await nextTick();
    }
    prerequisiteReview.value = null;
    prerequisiteReviewOpen.value = false;
    await applyAuthenticatedCheckout(detail);
  } catch (error) {
    accountCheckFailed.value = true;
    paymentError.value = error?.message || t('fan_booking_prerequisite_check_failed');
  } finally {
    isUpdatingAccount.value = false;
  }
}

const reviewDetail = computed(() => prerequisiteReview.value?.detail || {});
const reviewIsSwitch = computed(() => reviewDetail.value.action === 'switch');
const reviewIsSubscription = computed(() => reviewDetail.value.type === 'subscription');
const reviewTiers = computed(() => [{ ...reviewDetail.value.product, ...reviewDetail.value.subscription, label: t('fan_booking_subscribed') }]);
function tierPriceLabel(tier) {
  if (Number(tier.price) === 0) return t('fan_booking_tier_free');
  const period = ['day', 'week', 'month', 'year'].includes(tier.period) ? tier.period : '';
  const interval = Number(tier.interval) > 1 ? `${Number(tier.interval)} ` : '';
  return `USD$${Number(tier.price || 0).toFixed(2)}${period ? ` / ${interval}${t(`fan_booking_period_${period}`)}` : ''}`;
}
function tierDiscount(tier) {
  const regular = Number(tier.regular_price);
  const price = Number(tier.price);
  return regular > price && price >= 0 ? Math.round((1 - price / regular) * 100) : 0;
}

function handleReviewKeydown(event) {
  if (event.key === 'Escape' && reviewIsSwitch.value) prerequisiteReviewOpen.value = false;
  if (event.key !== 'Tab') return;
  const buttons = Array.from(event.currentTarget.querySelectorAll('button:not([disabled])'));
  if (!buttons.length) return;
  const first = buttons[0];
  const last = buttons[buttons.length - 1];
  if ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  }
}

async function handleGuestLogout(res = null) {
  checkoutUserId.value = 0;
  prerequisiteReview.value = null;
  prerequisiteReviewOpen.value = false;
  authenticatedCheckoutPayload.value = null;
  const payload = { userId: 0, backendJwtToken: '', response: res || {} };
  if (hasPrerequisite.value && props.afterAuthUpdate) {
    isUpdatingAccount.value = true;
    accountCheckFailed.value = false;
    try {
      window.custom_checkout_params = { ...window.custom_checkout_params, ...res?.custom_checkout_params };
      await props.afterAuthUpdate(payload);
      await nextTick();
      const requiredAmount = Math.max(props.topUpAmount, minPurchase.value);
      if (selectedAmount.value < requiredAmount) {
        selectedAmount.value = requiredAmount;
        amountInput.value = requiredAmount;
      }
      checkoutPhase.value = 'prerequisite';
      handler?.destroy();
      currentOrderId.value = null;
      checkoutDetails.value = null;
      await initHandler();
    } catch (error) {
      accountCheckFailed.value = true;
      paymentError.value = error?.message || t('fan_booking_prerequisite_check_failed');
    } finally {
      isUpdatingAccount.value = false;
    }
    return;
  }
  if (props.afterAuthUpdate) await props.afterAuthUpdate(payload);
  else emit('auth-updated', payload);
  const requiredAmount = Math.max(props.topUpAmount, minPurchase.value);
  if (selectedAmount.value < requiredAmount) {
    selectedAmount.value = requiredAmount;
    amountInput.value = requiredAmount;
  }
  await reloadCardForm(res);
}

defineExpose({
  setProcessingPayment(val, mode = 'payment') {
    isProcessing.value = Boolean(val);
    cardFormRef.value?.setProcessingPayment(val, mode);
  },
});

onMounted(() => {
  if (props.prerequisite?.action === 'switch') {
    prerequisiteReview.value = { detail: props.prerequisite };
    if (props.confirmedSwitch === subscriptionSwitchReviewKey(props.prerequisite, props.fanId, props.eventId)) confirmPrerequisiteReview(true);
    else openPrerequisiteReview();
  } else initHandler();
});

onBeforeUnmount(() => {
  clearTimeout(amountDebounceTimer);
  cardFormRef.value?.setProcessingPayment(false);
  handler?.destroy();
});
</script>

<template>
  <div class="flex flex-col w-full h-full gap-3 lg:h-[calc(100dvh-13.2rem)] relative z-[1]">

    <!-- Figma's ownership/tier prompts stay inside the existing booking payment step. -->
    <div v-if="prerequisiteReviewOpen" class="absolute inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-[#0C111D]/95 p-2" @keydown="handleReviewKeydown">
      <SubscriptionSwitchConfirmation v-if="reviewIsSwitch" :prerequisite="reviewDetail" :busy="isUpdatingAccount" :error="paymentError"
        @confirm="confirmPrerequisiteReview" @cancel="prerequisiteReviewOpen = false" />
      <div v-else role="alertdialog" aria-modal="true" :aria-label="t('fan_booking_prerequisite_review')" data-testid="booking-prerequisite-review"
        class="flex w-full max-h-full flex-col overflow-y-auto p-4 md:p-5 font-['Poppins'] text-white"
        :class="reviewIsSubscription ? 'max-w-[510px] gap-3 rounded-[15px] bg-black/50' : 'max-w-[475px] gap-4 rounded-[10px]'"
        :style="reviewIsSubscription ? null : { background: 'linear-gradient(0deg, rgba(255,255,255,0.1), rgba(255,255,255,0.1)), rgba(12,17,29,0.9)' }">
        <h3 v-if="!reviewIsSubscription" class="text-lg font-semibold leading-7 text-[#07F468]">{{ t('fan_booking_purchased_items_found') }}</h3>
        <p class="text-base font-normal leading-6">{{ t('fan_booking_owned_item_prompt') }}</p>
        <template v-if="reviewIsSubscription">
          <template v-for="(tier, index) in reviewTiers" :key="tier.id || index">
            <div class="flex items-center gap-5 py-3">
              <div class="h-[79px] w-[79px] shrink-0 overflow-hidden rounded-lg bg-white/10">
                <img v-if="tier.image_url" :src="tier.image_url" :alt="tier.title || ''" class="h-full w-full object-cover" />
              </div>
              <div class="flex min-w-0 flex-col gap-1">
                <span class="text-sm font-semibold leading-5 text-[#07F468]">{{ tier.label }}</span>
                <span class="break-words text-lg font-semibold leading-7">{{ tier.variation_title || tier.title }}</span>
                <div class="flex flex-wrap items-center gap-1">
                  <span class="text-xl font-bold leading-[30px] text-[#FCE40D]">{{ tierPriceLabel(tier) }}</span>
                  <span v-if="tierDiscount(tier)" class="text-xs leading-[18px] line-through">${{ Number(tier.regular_price).toFixed(2) }}</span>
                  <span v-if="tierDiscount(tier)" class="relative flex items-center rounded bg-[#FF0066] py-[2px] pl-3 pr-[6px] text-[10px] font-semibold leading-[15px]">
                    <img :src="bookingFlowLightningIcon" alt="" class="absolute -left-1 top-0" />{{ t('fan_booking_shipping_discount', { percent: tierDiscount(tier) }) }}
                  </span>
                </div>
              </div>
            </div>
          </template>
        </template>
        <div v-else class="flex items-center gap-2 p-2">
          <img v-if="reviewDetail.product?.image_url" :src="reviewDetail.product.image_url" :alt="reviewDetail.product.title" class="h-[74px] w-[74px] md:h-12 md:w-12 shrink-0 rounded-lg object-cover" />
          <div class="flex min-w-0 flex-1 flex-col gap-2 md:flex-row md:items-center">
          <div class="flex min-w-0 flex-1 flex-col gap-1">
            <span class="break-words text-base font-semibold leading-6">{{ reviewDetail.product?.title }}</span>
            <span v-if="creator?.name" class="flex items-center gap-1 text-xs font-medium leading-[18px] text-[#98A2B3]">
              <img v-if="creator.avatar" :src="creator.avatar" alt="" class="h-6 w-6 rounded-full object-cover" />{{ creator.name }}
              <img v-if="creator.isVerified" :src="bookingFlowAccountVerifiedIcon" alt="" class="h-3 w-3" />
            </span>
          </div>
          <span class="flex items-center gap-1 text-xs leading-[18px] text-[#07F468]"><img :src="bookingFlowCalendarCheckIcon" alt="" class="h-4 w-4" />{{ t('fan_booking_already_in_library') }}</span>
          </div>
        </div>
        <button ref="prerequisiteReviewButton" type="button" data-testid="booking-prerequisite-review-confirm" :disabled="isUpdatingAccount" @click="confirmPrerequisiteReview"
          class="flex min-h-10 w-full items-center justify-center px-6 py-2 text-base font-medium leading-6 disabled:opacity-50"
          :class="reviewIsSubscription ? 'bg-[#FF0066] text-white' : 'bg-[#07F468] text-[#0C111D]'">
          {{ t('fan_booking_continue_booking') }}
        </button>
        <p v-if="reviewIsSubscription && reviewDetail.subscription?.next_payment_date" class="text-center text-sm leading-5 text-[#EAECF0]">
          {{ t('fan_booking_next_billing_date', { date: reviewDetail.subscription.next_payment_date }) }}
        </p>
        <p v-if="paymentError" role="alert" class="text-xs text-red-400 font-medium">{{ paymentError }}</p>
      </div>
    </div>

    <div 
      :inert="prerequisiteReviewOpen || undefined"
      class="inline-flex justify-start items-center gap-1 cursor-pointer"
      @click="emit('back')"
    >
      <div class="w-4 h-4 relative overflow-hidden">
        <img :src="bookingFlowArrowLeftIcon" alt="">
      </div>
      <div class="justify-start text-white text-xs font-medium font-['Poppins'] leading-4">
        {{ t("common_back") }}
      </div>
    </div>

    <div :inert="prerequisiteReviewOpen || undefined" class="flex flex-col gap-4 md:gap-8 py-2 lg:py-3 md:!pb-[6rem] md:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-order-style:none] [scrollbar-width:none]">

      <button v-if="prerequisiteReview && !prerequisiteReviewOpen" type="button" @click="openPrerequisiteReview" class="min-h-10 bg-[#FF0066] px-6 py-2 text-base font-medium leading-6 text-white">{{ t('fan_booking_prerequisite_review') }}</button>

      <!-- Amount display + presets -->
      <div v-if="requiresTopUp" class="flex flex-col gap-1">
        <div class="opacity-70 justify-start text-white text-sm font-medium font-['Poppins'] leading-5">
          {{ t("fan_booking_top_up_amount") }}
        </div>
        <div class="flex flex-col gap-3">
          <div class="inline-flex justify-start items-center gap-1">
            <div class="relative">
              <img class="w-10 h-10" :src="bookingFlowTokenIcon" alt="">
            </div>
            <div class="flex-1 h-11 px-1 border-b border-gray-400 inline-flex flex-col justify-center items-start gap-2">
              <div class="h-11 inline-flex w-full justify-between items-center gap-1">
                <input
                  type="number"
                  :value="amountInput"
                  :min="minPurchase"
                  :max="maxPurchase"
                  @input="onAmountInput"
                  class="flex-1 w-full bg-transparent text-white text-3xl font-normal font-['Poppins'] leading-9 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div class="inline-flex flex-col justify-start items-end">
                  <div v-if="discountPercentage > 0" class="px-1 bg-green-500 inline-flex justify-center items-center gap-2.5">
                    <div class="text-right justify-center text-gray-900 text-xs font-semibold font-['Poppins'] leading-4">
                      -{{ discountPercentage }}%
                    </div>
                  </div>
                  <div data-testid="top-up-usd-display" class="text-right justify-end text-white text-sm font-medium font-['Poppins'] leading-5">
                    ≈ USD$ {{ topUpUSD }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="inline-flex justify-start items-center gap-2">
            <div
              v-for="preset in AMOUNT_PRESETS"
              :key="preset"
              @click="selectAmount(preset)"
              class="flex-1 p-2.5 rounded-lg outline outline-1 outline-offset-[-1px] flex justify-center items-center gap-2.5 cursor-pointer transition-colors"
              :class="selectedAmount === preset
                ? 'outline-[#22CCEE] bg-[#22CCEE]/10'
                : 'outline-white/50 hover:outline-white'"
            >
              <div class="justify-start text-white text-sm font-medium font-['Poppins'] leading-5">
                {{ preset.toLocaleString() }}
              </div>
            </div>
          </div>
          
          <div v-if="isAmountBelowDefault" class="flex items-center gap-2 mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span class="text-[#f43f5e] text-sm font-normal font-['Poppins']">
              You need to have at least {{ Math.max(props.topUpAmount, minPurchase) }} tokens to proceed with the booking.
            </span>
          </div>
        </div>
      </div>

      <!-- Payment method -->
      <CardForm
        ref="cardFormRef"
        :handler="handler"
        :selected-amount="selectedAmount"
        :current-order-id="currentOrderId"
        :tip-checkout-popup="tipCheckoutPopup"
        @order-id-updated="currentOrderId = $event"
      />

      <!-- Account email -->
      <GuestCheckoutForm
        ref="guestFormRef"
        :initial-email="billingEmail"
        :order-id="currentOrderId"
        :checkout-context="prerequisiteGuestCheckoutContext"
        @update:email="billingEmail = $event"
        @login="handleGuestLogin"
        @logout="handleGuestLogout"
      />

      <!-- Error message -->
      <p v-if="paymentError" class="text-xs text-red-400 font-medium">{{ paymentError }}</p>

      <!-- Balance summary -->
       <div v-if="1!=1" class="flex flex-col items-end gap-2 self-stretch rounded-[0.5rem]" style="background: linear-gradient(90deg, rgba(16, 24, 40, 0.00) 25%, rgba(16, 24, 40, 0.90) 75%), #182230;">
          <div class="flex flex-col items-end gap-2 self-stretch bg-[rgba(24,34,48,0.1)] relative overflow-hidden">
            <!-- bg -->
            <div class="absolute right-4 bottom-1 z-[1]">
              <svg xmlns="http://www.w3.org/2000/svg" width="108" height="134" viewBox="0 0 108 134" fill="none">
                <path opacity="0.5" fill-rule="evenodd" clip-rule="evenodd" d="M9.28238 122.95L59.863 140.476C69.8881 143.954 79.8979 135.254 77.8907 124.857L73.0552 99.6994C71.5558 91.9111 77.13 84.6306 84.2 81.0254C93.7181 76.1961 101.459 67.7895 105.232 56.8939C112.981 34.501 101.137 10.1131 78.772 2.37147C56.4068 -5.37016 31.986 6.46362 24.2447 28.8258C20.3846 39.9607 21.3993 51.589 26.1288 61.4072C29.5935 68.671 29.5643 78.0545 23.4795 83.3084L4.76721 99.5165C-3.25772 106.466 -0.74977 119.503 9.28238 122.95Z" fill="#344054"/>
              </svg>
            </div>
            <!-- Content -->
             <div class="flex p-4 flex-col items-start gap-3 self-stretch relative z-[2]">
                <div class="flex justify-between items-center self-stretch">
                  <span class="text-sm font-medium text-white">Wallet Balance</span>
                  <div class="flex justify-center items-center gap-1">
                    <div class="w-6 h-6 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                    <p class="text-base text-white font-semibold">{{ walletBalance.toLocaleString() }}</p>
                  </div>
                </div>
                <div class="flex justify-between items-center self-stretch">
                  <span class="text-sm font-medium text-white">Subtotal</span>
                  <div class="flex justify-center items-center gap-1">
                    <p class="text-base text-white font-semibold">-</p>
                    <div class="w-6 h-6 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                    <p class="text-base text-white font-semibold">{{ totalPrice }}</p>
                  </div>
                </div>
                <div class="flex justify-between items-center self-stretch border-t border-[#F2F4F7]/50 pt-3">
                  <span class="text-sm font-medium text-white">Wallet Balance</span>
                  <div class="flex justify-center items-center gap-1">
                    <div class="w-6 h-6 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                    <p class="text-base text-white font-semibold">{{ balanceAfterBooking.toLocaleString() }}</p>
                  </div>
                </div>
              </div>
          </div>
       </div>
      <!-- /Balance summary -->

      <!-- Shipping Address -->
      <div v-if="isPrerequisiteCheckout && requiresShipping" class="flex flex-col gap-3">
          <div class="inline-flex justify-between items-center gap-2">
            <div class="flex items-center gap-2">
              <div class="w-5 h-5 relative overflow-hidden">
                <img :src="bookingFlowMapsTravelsIcon" alt="">
              </div>
              <div class="justify-center text-[#F9FAFB] text-sm font-semibold leading-5">{{ t('fan_booking_shipping_address') }}</div>
            </div>
            <button type="button" class="cursor-pointer" data-testid="booking-shipping-toggle" @click="shippingExpanded = !shippingExpanded">
              <img :src="bookingFlowArrowsDownIcon" alt="">
            </button>
          </div>
          <div v-if="shippingExpanded" class="grid grid-cols-2 gap-2">
            <select v-if="savedShippingAddresses.length" v-model="shippingAddressId" :aria-label="t('fan_booking_saved_shipping_address')" data-testid="booking-saved-shipping" class="col-span-2 h-10 px-3 rounded-md border border-white/20 bg-[#0C111D] text-sm text-white" @change="selectShippingAddress">
              <option value="">{{ t('fan_booking_new_shipping_address') }}</option>
              <option v-for="address in savedShippingAddresses" :key="address.id" :value="String(address.id)">{{ address.first_name }} {{ address.last_name }} — {{ address.address_1 }}, {{ address.city }}</option>
            </select>
            <input v-model.trim="shippingAddress.first_name" type="text" :placeholder="t('fan_booking_first_name')" class="col-span-1 h-10 px-3 rounded-md border border-white/20 bg-transparent text-sm text-white focus:outline-none focus:border-[#22CCEE]" />
            <input v-model.trim="shippingAddress.last_name" type="text" :placeholder="t('fan_booking_last_name')" class="col-span-1 h-10 px-3 rounded-md border border-white/20 bg-transparent text-sm text-white focus:outline-none focus:border-[#22CCEE]" />
            <input v-model.trim="shippingAddress.address_1" type="text" :placeholder="t('fan_booking_address_line_1')" class="col-span-2 h-10 px-3 rounded-md border border-white/20 bg-transparent text-sm text-white focus:outline-none focus:border-[#22CCEE]" />
            <input v-model.trim="shippingAddress.address_2" type="text" :placeholder="t('fan_booking_address_line_2')" class="col-span-2 h-10 px-3 rounded-md border border-white/20 bg-transparent text-sm text-white focus:outline-none focus:border-[#22CCEE]" />
            <input v-model.trim="shippingAddress.city" type="text" :placeholder="t('fan_booking_city')" class="col-span-1 h-10 px-3 rounded-md border border-white/20 bg-transparent text-sm text-white focus:outline-none focus:border-[#22CCEE]" />
            <select v-if="Object.keys(shippingStates).length" v-model="shippingAddress.state" :aria-label="shippingFields.state?.label || t('fan_booking_state')" data-testid="booking-shipping-state" class="col-span-1 h-10 px-3 rounded-md border border-white/20 bg-[#0C111D] text-sm text-white">
              <option value="">{{ shippingFields.state?.label || t('fan_booking_state') }}</option>
              <option v-for="(label, code) in shippingStates" :key="code" :value="code">{{ label }}</option>
            </select>
            <input v-else-if="shippingAddress.country && !shippingFields.state?.hidden" v-model.trim="shippingAddress.state" type="text" :placeholder="shippingFields.state?.label || t('fan_booking_state')" class="col-span-1 h-10 px-3 rounded-md border border-white/20 bg-transparent text-sm text-white focus:outline-none focus:border-[#22CCEE]" />
            <input v-if="!shippingFields.postcode?.hidden" v-model.trim="shippingAddress.postcode" type="text" :placeholder="shippingFields.postcode?.label || t('fan_booking_postcode')" class="col-span-1 h-10 px-3 rounded-md border border-white/20 bg-transparent text-sm text-white focus:outline-none focus:border-[#22CCEE]" />
            <select v-model="shippingAddress.country" :aria-label="t('fan_booking_country')" data-testid="booking-shipping-country" class="col-span-1 h-10 px-3 rounded-md border border-white/20 bg-[#0C111D] text-sm text-white" @change="shippingAddress.state = ''; shippingAddress.postcode = ''; shippingError = ''">
              <option value="">{{ t('fan_booking_country') }}</option>
              <option v-for="(label, code) in checkoutDetails?.shipping_countries" :key="code" :value="code">{{ label }}</option>
            </select>
            <label class="col-span-2 flex items-center gap-2 text-sm text-white"><input v-model="saveShippingAddress" type="checkbox" />{{ t('fan_booking_save_shipping_address') }}</label>
            <button
              type="button"
              :disabled="!shippingAddressComplete || isUpdatingShipping"
              class="col-span-2 h-10 rounded-md bg-[#22CCEE] text-[#0C111D] text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              @click="updateShippingAddress"
            >
              {{ isUpdatingShipping ? t('fan_booking_updating_shipping') : t('fan_booking_update_shipping') }}
            </button>
          </div>
          <p v-if="shippingWarning" role="alert" class="text-xs text-red-400 font-medium">{{ shippingWarning }}</p>
          <div v-if="!shippingExpanded" class="text-sm text-white whitespace-pre-line">{{ shippingAddress.first_name }} {{ shippingAddress.last_name }}<br />{{ shippingAddress.address_1 }} {{ shippingAddress.address_2 }}<br />{{ shippingAddress.city }}, {{ shippingStates[shippingAddress.state] || shippingAddress.state }} {{ shippingAddress.postcode }}<br />{{ checkoutDetails?.shipping_countries?.[shippingAddress.country] }}</div>
      </div>
      <!-- /Shipping Address -->

      <!-- Financial summary its hide now Prosenjit -->
      <div v-if="1!=1" class="_flex hidden flex-col justify-center items-start gap-2">

        <div class="inline-flex justify-between w-full">
          <div class="justify-start text-white text-sm font-normal font-['Poppins'] leading-5">{{ t("fan_booking_original_balance") }}</div>
          <div class="flex justify-start items-center gap-1">
            <div class="w-4 h-4 relative"><img :src="bookingFlowTokenIcon" alt=""></div>
            <div class="justify-start text-white text-sm font-medium font-['Poppins'] leading-5">{{ walletBalance.toLocaleString() }}</div>
          </div>
        </div>

        <div class="inline-flex justify-between w-full">
          <div class="justify-start text-white text-sm font-normal font-['Poppins'] leading-5">{{ t("fan_booking_top_up_amount_label") }}</div>
          <div class="flex justify-start items-center gap-1">
            <div class="justify-start text-white text-sm font-medium font-['Poppins'] leading-5">+</div>
            <div class="w-4 h-4 relative"><img :src="bookingFlowTokenIcon" alt=""></div>
            <div class="justify-start text-white text-sm font-medium font-['Poppins'] leading-5">{{ selectedAmount.toLocaleString() }}</div>
          </div>
        </div>

        <div class="h-0 outline outline-1 outline-offset-[-0.50px] outline-white w-full"></div>

        <div class="inline-flex justify-between w-full">
          <div class="justify-start text-white text-sm font-normal font-['Poppins'] leading-5">{{ t("fan_booking_balance_after_top_up") }}</div>
          <div class="flex justify-start items-center gap-1">
            <div class="w-4 h-4 relative"><img :src="bookingFlowTokenIcon" alt=""></div>
            <div class="justify-start text-white text-lg font-semibold font-['Poppins'] leading-7">{{ balanceAfterTopUp.toLocaleString() }}</div>
          </div>
        </div>

        <div class="inline-flex justify-between w-full">
          <div class="justify-start text-white text-sm font-normal font-['Poppins'] leading-5">{{ t("fan_booking_subtotal") }}</div>
          <div class="flex justify-start items-center gap-1">
            <div class="justify-start text-white text-sm font-medium font-['Poppins'] leading-5">-</div>
            <div class="w-4 h-4 relative"><img :src="bookingFlowTokenIcon" alt=""></div>
            <div class="justify-start text-white text-sm font-medium font-['Poppins'] leading-5">{{ totalPrice }}</div>
          </div>
        </div>

        <div class="w-full h-0 outline outline-1 outline-offset-[-0.50px] outline-white"></div>

        <div class="inline-flex justify-between w-full">
          <div class="justify-start text-white text-sm font-semibold font-['Poppins'] leading-5">{{ t("fan_booking_balance_after_booking") }}</div>
          <div class="flex justify-start items-center gap-1">
            <div class="w-4 h-4 relative"><img :src="bookingFlowTokenIcon" alt=""></div>
            <div class="justify-start text-white text-lg font-semibold font-['Poppins'] leading-7">{{ balanceAfterBooking.toLocaleString() }}</div>
          </div>
        </div>

        <div class="inline-flex justify-between w-full">
          <div class="justify-start text-white text-sm font-semibold font-['Poppins'] leading-5">{{ t("fan_booking_top_up_payment") }}</div>
          <div class="flex justify-start items-center gap-1">
            <div class="justify-start text-white text-lg font-semibold font-['Poppins'] leading-7">USD$ {{ topUpUSD }}</div>
          </div>
        </div>

      </div>

      <div class="flex flex-col">
        <div class="flex flex-col gap-3 w-full">
          <div class="w-full flex items-center justify-between cursor-pointer" @click="isPaymentSummaryOpen = !isPaymentSummaryOpen">
            <h3 class="text-sm font-semibold text-[#FB5BA2]">{{ t("fan_booking_payment_summary") }}</h3>
            <span class="transition-transform duration-200" :class="{ 'rotate-180': !isPaymentSummaryOpen }">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M14.1668 15L10.0002 10.8333L5.8335 15M14.1668 9.16667L10.0002 5L5.8335 9.16667" stroke="#FB5BA2" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
          </div>
          <div v-show="isPaymentSummaryOpen" class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
              <div class="flex flex-col gap-2">
                <template v-if="requiresTopUp">
                <div class="flex flex-row justify-between items-center text-white">
                  <div class="flex items-center">
                    <p class="text-sm font-normal text-white">{{ t("fan_booking_original_balance") }}</p>
                  </div>
                  <div class="flex justify-center items-center gap-1">
                    <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                    <p class="text-sm font-medium text-white">{{ walletBalance.toLocaleString() }}</p>
                  </div>
                </div>
                <div class="flex flex-row justify-between items-center text-white">
                  <div class="flex items-center">
                    <p class="text-sm font-normal text-white">{{ t("fan_booking_top_up_amount_label") }}</p>
                  </div>
                  <div class="flex justify-center items-center gap-1">
                    <span class="text-sm font-medium text-white">+</span>
                    <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                    <p class="text-sm font-medium text-white">{{ selectedAmount.toLocaleString() }}</p>
                  </div>
                </div>
                <hr class="border-[#F2F4F7] opacity-50" />
                <div class="flex flex-row justify-between items-center text-white">
                  <div class="flex items-center">
                    <p class="text-sm font-normal text-white">{{ t("fan_booking_balance_after_top_up") }}</p>
                  </div>
                  <div class="flex justify-center items-center gap-1">
                    <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                    <p class="text-sm font-medium text-white">{{ (walletBalance + selectedAmount).toLocaleString() }}</p>
                  </div>
                </div>
                <div class="flex flex-row justify-between items-center text-white">
                  <div class="flex items-center">
                    <p class="text-sm font-normal text-white">{{ t("fan_booking_token_used") }}</p>
                  </div>
                  <div class="flex justify-center items-center gap-1">
                    <span class="text-sm font-medium text-white">-</span>
                    <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                    <p class="text-sm font-medium text-white">{{ totalPrice }}</p>
                  </div>
                </div>
                <hr class="border-[#F2F4F7] opacity-50" />
                <div class="flex flex-row justify-between items-center text-white">
                  <div class="flex items-center">
                    <p class="text-sm font-semibold text-white">{{ t("fan_booking_balance_after_booking") }}</p>
                  </div>
                  <div class="flex justify-center items-center gap-1">
                    <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                    <p data-testid="top-up-balance-after-booking" class="text-lg font-semibold text-white">{{ balanceAfterBooking.toLocaleString() }}</p>
                  </div>
                </div>
                </template>
                <!-- Mandatory purchase -->
                <div v-if="hasPrerequisite && prerequisiteProduct" class="flex flex-col gap-2 border-t border-[#98A2B3]/50 pt-2">
                  <div class="flex gap-2 items-center">
                    <h4 class="text-sm font-medium text-white">{{ prerequisiteLabel }}</h4>
                    <TooltipIcon 
                    class="!w-4 !h-4 relative !mt-0"
                    :text="t('fan_booking_mandatory_purchase_help')" side="right" />
                  </div>
                  <!-- Content -->
                  <div class="flex items-center gap-2">
                    <div class="w-[2.625rem] h-[2.625rem] rounded-[4px] overflow-hidden">
                      <img :src="prerequisiteProduct.image_url" :alt="prerequisiteProductTitle" class="w-full h-full object-cover" />
                    </div>
                    <div class="flex-1 flex flex-col gap-1">
                      <div class="flex items-center justify-between">
                          <span class="text-sm font-semibold text-white">{{ prerequisiteProductTitle }}</span>
                          <span class="text-sm font-semibold text-white text-right">
                            {{ isPrerequisitePaid ? t('fan_booking_paid') : `USD$ ${prerequisitePrice.toFixed(2)}` }}
                          </span>
                      </div>
                      <p v-if="prerequisite?.action === 'switch'" class="text-xs text-[#FCE40D] text-right" data-testid="booking-payment-recurring-plan-price">{{ t('fan_booking_recurring_plan_price', { amount: Number(prerequisiteProduct.price || 0).toFixed(2) }) }}</p>
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1">
                          <span v-if="requiresShipping"><img :src="bookingFlowTruckIcon" alt=""></span>
                          <span v-if="requiresShipping" class="text-xs text-[#FCE40D]" data-testid="booking-payment-shipping-destination">
                            <template v-if="prerequisite?.shipping?.is_merch && prerequisite.shipping.international">{{ t('fan_booking_ships_internationally') }}</template>
                            <template v-else>
                              {{ t('fan_booking_ships_to') }}
                              <button type="button" class="text-xs text-[#FCE40D] underline" @click="shippingExpanded = true">{{ prerequisite?.shipping?.is_merch ? prerequisite.shipping.country : checkoutDetails?.shipping_countries?.[shippingAddress.country] || t('fan_booking_checkout_address') }}</button>
                              <template v-if="prerequisite?.shipping?.is_merch && prerequisite.shipping.international === false">{{ ' ' + t('fan_booking_shipping_only') }}</template>
                            </template>
                          </span>
                        </div>
                        <span v-if="requiresShipping" class="text-sm text-[#FCE40D] text-right" data-testid="booking-payment-shipping-cost">{{ shippingCostLabel }}</span>
                      </div>
                    </div>
                  </div>
                  <!-- /Content -->
                </div>
                <!-- /Mandatory purchase -->
                <hr class="border-[#F2F4F7] opacity-50" />
                <div data-testid="top-up-amount-due-today" class="flex flex-row justify-between items-start gap-2 text-white">
                  <p class="text-lg leading-7 font-bold text-white uppercase">{{ t("fan_booking_amount_due_today_title") }}</p>
                  <div class="flex flex-1 min-w-0 flex-col items-end gap-0.5">
                    <div class="flex flex-wrap justify-end items-center gap-0.5 text-lg leading-7 font-semibold">
                      <div v-if="requiresTopUp" class="flex items-center gap-0.5 whitespace-nowrap">
                        <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                        <p>{{ selectedAmount.toLocaleString() }}</p>
                      </div>
                      <template v-if="isPrerequisiteCheckout">
                        <span v-if="requiresTopUp">+</span>
                        <p class="whitespace-nowrap">USD${{ prerequisiteOrderUsd.toFixed(2) }}</p>
                      </template>
                    </div>
                    <span data-testid="top-up-amount-due-usd" class="text-sm leading-5 font-normal text-[#FCE40D] whitespace-nowrap">=USD$ {{ amountDueUsd.toFixed(2) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="w-full flex">
        <p class="text-sm text-[#EAECF0] italic">Completing this booking means you agree to the event’s booking policy.</p>
      </div>
    </div>
    <!-- Submit button -->
       <div v-show="!prerequisiteReviewOpen" :inert="prerequisiteReviewOpen || undefined" class="flex-none flex justify-end z-[99] fixed bottom-0 left-0 w-full">
        <button
            type="button"
            :disabled="!canSubmit"
            @click="handlePayNow"
            class="w-full flex justify-end items-center gap-2 h-16 font-semibold text-sm transition-opacity"
            :class="canSubmit ? ' cursor-pointer' : ' cursor-not-allowed'"
          >
          <div class="relative h-full px-4 lg:rounded-br-[20px] flex justify-center items-center gap-2 after:content-[''] after:absolute after:right-full after:top-0 after:w-0 after:h-16 after:border-t-[4rem] after:border-t-transparent after:border-b-0 bg-[#07F468] after:border-r-[1rem] after:border-r-[#07F468]"
          :class="canSubmit ? 'bg-[#07F468] text-black cursor-pointer' : 'bg-[#6c7280] text-black/60 cursor-not-allowed after:border-r-[#6c7280]'">
            <span class="whitespace-nowrap text-lg font-medium text-[#0C111D]">{{ isProcessing ? t('fan_booking_processing') : isFormLoading ? t('fan_booking_loading_form') : paymentButtonLabel }}</span>
            <img :src="bookingFlowArrowRightIcon" alt="" class="w-4 h-4" />
          </div>
          </button>
       </div>
  </div>
  <!-- Payment Failure Popup -->
  <Teleport to="body">
    <div
      v-if="showPaymentFailure"
      class="fixed inset-0 z-[9999999] flex items-center justify-center"
    >
      <div class="absolute inset-0 bg-black/60 backdrop-blur-md" @click="closePaymentFailure"></div>
      <div class="relative z-10 flex flex-col items-center bg-[#292A2D] rounded-3xl p-6 w-[22rem] shadow-2xl">
        <button @click="closePaymentFailure" class="absolute top-4 right-4 text-gray-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h2 class="text-[#FF5A00] text-2xl font-bold font-['Poppins'] mb-4">{{ t("fan_booking_failure", "Failure") }}</h2>
        
        <p v-if="paymentError" class="text-white text-sm font-normal font-['Poppins'] text-center mb-4 px-2">
          {{ paymentError }}
        </p>
        
        <div class="w-48 h-48 rounded-2xl mb-4 flex items-center justify-center">
          <img src="http://fansocial.app/wp-content/plugins/fansocial/dev/call-checkout/images/payment-fail.png" alt="Payment Failed" class="max-w-full max-h-full object-contain" />
        </div>
        
        <p class="text-white text-sm font-medium font-['Poppins'] text-center mt-2">
          This window will close in <span class="text-[#FF5A00]">00:0{{ failureCountdown }}</span> seconds.
        </p>
      </div>
    </div>
  </Teleport>
</template>
