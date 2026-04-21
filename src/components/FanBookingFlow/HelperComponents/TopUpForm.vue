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
} from "../OneOnOneBookingFlow/oneOnOneBookingFlowAssets.js";
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { showToast } from '@/utils/toastBus.js';
import '@/utils/axcessGatewayFormHandler.js';
import '@/assets/css/axcessGatewayForm.css';
import GuestCheckoutForm from './GuestCheckoutForm.vue';
import CardForm from './CardForm.vue';
import { useBookingTranslations } from '@/i18n/bookingTranslations.js';

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
});

const emit = defineEmits(['back', 'success', 'payment-failed', 'auth-updated']);
const { t } = useBookingTranslations();

const AMOUNT_PRESETS = [500, 1000, 3000, 5000];

const tipCheckoutPopup = ref(true);
const isProcessing     = ref(false);
const isFormLoading    = ref(false);
const paymentError     = ref('');
const billingEmail     = ref('');
const cardFormRef      = ref(null);
const guestFormRef     = ref(null);
const currentOrderId   = ref(null);

let handler = null;

const selectedAmount  = ref(props.topUpAmount);
const amountInput     = ref(props.topUpAmount);
const pricingConfig   = ref(null);

const minPurchase = computed(() => pricingConfig.value?.min_purchase  ?? 10);
const maxPurchase = computed(() => pricingConfig.value?.max_purchase  ?? 14000);

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
  const tier = activeTier.value;
  if (tier) return (selectedAmount.value * tier.price_per_token).toFixed(2);
  const base = pricingConfig.value?.base_price_per_token || 0.1099;
  return (selectedAmount.value * base).toFixed(2);
});

const discountPercentage = computed(() => activeTier.value?.discount_percentage ?? 0);

const balanceAfterTopUp   = computed(() => props.walletBalance + selectedAmount.value);
const balanceAfterBooking = computed(() => balanceAfterTopUp.value - props.totalPrice);

const isLoggedIn = computed(() => Number(window?.userData?.userID) > 0 );

const hasEmail  = computed(() => isLoggedIn.value || billingEmail.value?.trim().includes('@'));
const canSubmit = computed(() =>
  !isFormLoading.value && !isProcessing.value && hasEmail.value
  && !guestFormRef.value?.requiresLogin
  && Boolean(cardFormRef.value?.canPay)
);

function resolveFanUserId() {
  return props.fanId || Number(window?.userData?.userID) || 0;
}
function resolveCreatorId() {
  return props.creatorId || 0;
}

function normalizeAuthPayload(response = {}) {
  const userId = response?.user_id
    ?? response?.userId
    ?? response?.userData?.userID
    ?? response?.userData?.user_id
    ?? response?.data?.user_id
    ?? response?.data?.userId
    ?? null;
  const backendJwtToken = response?.backendJwtToken
    ?? response?.jwtToken
    ?? response?.backend_jwt_token
    ?? response?.jwt_token
    ?? response?.token
    ?? response?.data?.backendJwtToken
    ?? response?.data?.jwtToken
    ?? '';

  return {
    userId,
    backendJwtToken,
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
    extraParams: {
      user_id:           resolveFanUserId(),
      creator_id:        resolveCreatorId(),
      is_topup_and_call: 1,
      ordered_from:      'vue',
      register_email: billingEmail.value,
      billing_email:  billingEmail.value,
    },
    onSuccess: handlePaymentSuccess,
    onError:   handlePaymentError,
  });

  // Default min is 10 if config not loaded yet, 
  // but renderForm will error if selectedAmount is below actual min_purchase, 
  // so clamp here to ensure form loads and recovers properly once config is available
  // Clamp initial amount up to min_purchase now that config is available
  const minAllowed = pricingConfig.value?.min_purchase ?? 10;
  if (selectedAmount.value < minAllowed) {
    selectedAmount.value = minAllowed;
    amountInput.value    = minAllowed;
  }

  if (!billingEmail.value) {
    const email = handler.userInfo?.email || handler.userInfo?.user_email || '';
    if (email) billingEmail.value = email;
  }

  isFormLoading.value = true;
  try {
    const { orderId } = await handler.renderForm(selectedAmount.value, null, 'token');
    console.error('[TopUpForm] Initial renderForm result:', { orderId });
    currentOrderId.value = orderId ?? null;
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
    const { orderId } = await handler.renderForm(amount, existingOrderId, 'token');
    console.error('[TopUpForm] renderForm result from selectAmount:', { orderId });
    currentOrderId.value = orderId ?? null;
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
  const raw = Number(event.target.value);
  if (!Number.isFinite(raw) || raw <= 0) return;
  const clamped = Math.min(Math.max(Math.round(raw), minPurchase.value), maxPurchase.value);
  amountInput.value = clamped;
  clearTimeout(amountDebounceTimer);
  amountDebounceTimer = setTimeout(() => {
    selectAmount(clamped);
  }, 600);
}

function handlePaymentSuccess(_response) {
  console.error('Payment successful:', _response);
  isProcessing.value = false;

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
    emit('success', normalizeAuthPayload(_response));

    // guestCheckout.checkGuestAuthAfterPayment
    // guestCheckouth 
    if( !isLoggedIn.value && window?.parent?.guestCheckout ) {
      window.parent.preventReloadOnCheckoutClose = true;
      window.parent.guestCheckout.checkGuestAuthAfterPayment( _response.order_id );
    }
  } else {
    emit('payment-failed', _response);
    showToast({
      type: 'error',
      title: t('fan_booking_payment_processing_failed_title'),
      message: _response?.error_message || t('fan_booking_payment_failed_message'),
    });
    handlePaymentError(_response?.error_message || '');
  }
}

function handlePaymentError(message) {
  isProcessing.value = false;
  cardFormRef.value?.setProcessingPayment(false);
  console.error('Payment error:', message);
  paymentError.value = message || t('fan_booking_payment_failed_message');
}

async function handlePayNow() {
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
  handler.destroyForm();
  cardFormRef.value?.resetCardValidity();
  const existingOrderId = res?.order_id ?? currentOrderId.value;
  currentOrderId.value  = null;
  isFormLoading.value   = true;
  console.error('[TopUpForm] Reloading card form with params:', { selectedAmount: selectedAmount.value, existingOrderId, res });
  try {
    const responseArgs = res ? { ...res } : {};
    responseArgs.order_id = responseArgs.order_id || existingOrderId; // Ensure order_id is passed to renderForm for proper recovery
    const { orderId } = await handler.renderForm(selectedAmount.value, existingOrderId, 'token', responseArgs);
    currentOrderId.value = orderId ?? null;
    cardFormRef.value?.syncSavedCards();
  } catch (err) {
    console.error('[TopUpForm] renderForm failed during reloadCardForm:', err);
    paymentError.value = t('fan_booking_payment_form_reload_failed');
  } finally {
    isFormLoading.value = false;
  }
}

async function handleGuestLogin(res = null) {
  emit('auth-updated', normalizeAuthPayload(res || {}));
  await reloadCardForm(res);
}

async function handleGuestLogout(res = null) {
  emit('auth-updated', { userId: 0, backendJwtToken: '', response: res || {} });
  await reloadCardForm(res);
}

defineExpose({
  setProcessingPayment(val) { cardFormRef.value?.setProcessingPayment(val); },
});

onMounted(() => {
  initHandler();
});

onBeforeUnmount(() => {
  clearTimeout(amountDebounceTimer);
  handler?.destroy();
});
</script>

<template>
  <div class="flex flex-col w-full h-full lg:h-auto gap-3 lg:max-h-[36.5rem]">

    <div 
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

    <div class="flex flex-col gap-4 py-2 lg:py-3 pb-14 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-order-style:none] [scrollbar-width:none]">

      <!-- Amount display + presets -->
      <div class="flex flex-col gap-1">
        <div class="opacity-70 justify-start text-white text-xs font-normal font-['Poppins'] leading-4">
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
                  <div class="text-right justify-end text-white text-sm font-semibold font-['Poppins'] leading-5">
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
        </div>
      </div>

      <!-- Account email -->
      <GuestCheckoutForm
        ref="guestFormRef"
        :initial-email="billingEmail"
        :order-id="currentOrderId"
        @update:email="billingEmail = $event"
        @login="handleGuestLogin"
        @logout="handleGuestLogout"
      />

      <!-- Payment method -->
      <CardForm
        ref="cardFormRef"
        :handler="handler"
        :selected-amount="selectedAmount"
        :current-order-id="currentOrderId"
        :tip-checkout-popup="tipCheckoutPopup"
        @order-id-updated="currentOrderId = $event"
      />

      <!-- Error message -->
      <p v-if="paymentError" class="text-xs text-red-400 font-medium">{{ paymentError }}</p>

      <!-- Financial summary -->
      <div v-if="1!=1" class="flex flex-col justify-center items-start gap-2">

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
          <div class="justify-start text-white text-sm font-semibold font-['Poppins'] leading-5">Top up payment</div>
          <div class="flex justify-start items-center gap-1">
            <div class="justify-start text-white text-lg font-semibold font-['Poppins'] leading-7">USD$ {{ topUpUSD }}</div>
          </div>
        </div>

      </div>

      <div class="rounded-lg bg-white/10 flex flex-col mb-[4rem]">
        <div class="flex flex-col gap-3 w-full p-3 md:p-5">
          <h3 class="text-sm text-[#22CCEE] leading-[20px]">{{ t("fan_booking_payment_summary") }}</h3>
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-3">
              <div class="flex flex-col gap-2">
                <h4 class="text-xs leading-[18px] text-[#98A2B3]">{{ t("fan_booking_wallet_top_up") }}</h4>
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
                    <p class="text-sm font-normal text-white">{{ t("fan_booking_session_total_label") }}</p>
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
                    <p class="text-sm font-semibold text-white">{{ remainingBalance.toLocaleString() }}</p>
                  </div>
                </div>
                <div class="flex flex-row justify-between items-center text-white">
                  <div class="flex items-center">
                    <p class="text-sm font-semibold text-white">{{ t("fan_booking_top_up_payment") }}</p>
                  </div>
                  <div class="flex justify-center items-center gap-1">
                    <div class="w-4 h-4 flex justify-center items-center"></div>
                    <p class="text-sm font-semibold text-white">USD$ {{ topUpUSD }}</p>
                  </div>
                </div>
                <hr class="border-[#F2F4F7] opacity-50" />
                <div class="flex flex-row justify-between items-start text-white">
                  <p class="text-xl font-semibold leading-[30px] text-white">{{ t("fan_booking_amount_due_today_title") }}</p>
                  <div class="flex flex-col">
                    <div class="flex justify-end items-center gap-0.5">
                      <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                      <p class="text-xl font-semibold">{{ selectedAmount.toLocaleString() }}</p>
                    </div>
                    <span class="text-xs font-medium text-[#98A2B3] whitespace-nowrap">=USD$ {{ topUpUSD }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Submit button -->
       <div class="flex-none flex justify-end z-[99] fixed bottom-0 left-0 w-full">
        <button
            type="button"
            :disabled="!canSubmit"
            @click="handlePayNow"
            class="w-full flex justify-end items-center gap-2 h-16 font-semibold text-sm transition-opacity"
            :class="canSubmit ? ' cursor-pointer' : ' cursor-not-allowed'"
          >
          <div class="relative h-full px-4 lg:rounded-br-[20px] flex justify-center items-center gap-2 after:content-[''] after:absolute after:right-full after:top-0 after:w-0 after:h-16 after:border-t-[4rem] after:border-t-transparent after:border-b-0 bg-[#07F468] after:border-r-[1rem] after:border-r-[#07F468]"
          :class="canSubmit ? 'bg-[#07F468] text-black cursor-pointer' : 'bg-[#6c7280] text-black/60 cursor-not-allowed after:border-r-[#6c7280]'">
            <span class="whitespace-nowrap text-lg font-medium text-[#0C111D]">{{ isProcessing ? t('fan_booking_processing') : isFormLoading ? t('fan_booking_loading_form') : t('fan_booking_top_up_complete_booking_spaced') }}</span>
            <img :src="bookingFlowArrowRightIcon" alt="" class="w-4 h-4" />
          </div>
          </button>
       </div>
  </div>
</template>
