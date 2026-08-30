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
} from "../OneOnOneBookingFlow/oneOnOneBookingFlowAssets.js";
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { showToast } from '@/utils/toastBus.js';
import '@/utils/axcessGatewayFormHandler.js';
import '@/assets/css/axcessGatewayForm.css';
import GuestCheckoutForm from './GuestCheckoutForm.vue';
import CardForm from './CardForm.vue';
import TooltipIcon from "@/components/ui/tooltip/TooltipIcon.vue";
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
const isPaymentSummaryOpen = ref(true);
const isProcessing     = ref(false);
const isFormLoading    = ref(false);
const paymentError     = ref('');
const showPaymentFailure = ref(false);
const failureCountdown = ref(5);
let failureTimer = null;

function closePaymentFailure() {
  showPaymentFailure.value = false;
  paymentError.value = '';
  if (failureTimer) clearInterval(failureTimer);
}

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

const isAmountBelowDefault = computed(() => {
  const current = Number(amountInput.value);
  let defaultAmount = Math.max(props.topUpAmount, minPurchase.value);

  return current < defaultAmount;
});

const isLoggedIn = computed(() => Number(window?.userData?.userID) > 0 );

const hasEmail  = computed(() => isLoggedIn.value || billingEmail.value?.trim().includes('@'));
const canSubmit = computed(() =>
  !isFormLoading.value && !isProcessing.value && hasEmail.value
  && !guestFormRef.value?.requiresLogin
  && Boolean(cardFormRef.value?.canPay)
  && !isAmountBelowDefault.value
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
    ?? response?.userData?.jwtToken
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

    // guestCheckout.checkGuestAuthAfterPayment
    if( !isLoggedIn.value && window?.parent?.guestCheckout ) {
      window.parent.preventReloadOnCheckoutClose = true;
      try {
        const apiresponse = await window.parent.guestCheckout.checkGuestAuthAfterPayment(_response.order_id);
        console.warn('checkGuestAuthAfterPayment response:', apiresponse);
        if (apiresponse?.success) {
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

    emit('success', normalizeAuthPayload(successResponse));
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
  setProcessingPayment(val, mode = 'payment') {
    isProcessing.value = Boolean(val);
    cardFormRef.value?.setProcessingPayment(val, mode);
  },
});

onMounted(() => {
  initHandler();
});

onBeforeUnmount(() => {
  clearTimeout(amountDebounceTimer);
  cardFormRef.value?.setProcessingPayment(false);
  handler?.destroy();
});
</script>

<template>
  <div class="flex flex-col w-full h-full gap-3 lg:h-[calc(100dvh-13.2rem)] relative z-[1]">

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

    <div class="flex flex-col gap-4 md:gap-8 py-2 lg:py-3 md:!pb-[6rem] md:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-order-style:none] [scrollbar-width:none]">

      <!-- Amount display + presets -->
      <div class="flex flex-col gap-1">
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
      <div v-if="1!=1" class="flex flex-col">
          <div class="inline-flex justify-between items-center gap-2">
            <div class="flex items-center gap-2">
              <div class="w-5 h-5 relative overflow-hidden">
                <img :src="bookingFlowMapsTravelsIcon" alt="">
              </div>
              <div class="justify-center text-[#F9FAFB] text-base font-semibold leading-5">SHIPPING ADDRESS</div>
            </div>
            <div>
              <img :src="bookingFlowArrowsDownIcon" alt="">
            </div>
          </div>
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
                    <p data-testid="top-up-balance-after-booking" class="text-lg font-semibold text-white">{{ balanceAfterBooking.toLocaleString() }}</p>
                  </div>
                </div>
                <!-- Mandatory purchase -->
                <div class="_flex hidden flex-col gap-2 border-t border-[#98A2B3]/50 pt-2">
                  <div class="flex gap-2 items-center">
                    <h4 class="text-sm font-medium text-white">MANDATORY PURCHASE</h4>
                    <TooltipIcon 
                    class="!w-4 !h-4 relative !mt-0"
                    :text="'Dummy text'" side="right" />
                  </div>
                  <!-- Content -->
                  <div class="flex items-center gap-2">
                    <div class="w-[2.625rem] h-[2.625rem] rounded-[4px] overflow-hidden">
                      <img src="https://media.istockphoto.com/id/1364991519/photo/feet-in-modern-finger-socks.jpg?s=1024x1024&w=is&k=20&c=yTa5WXlblYuJi2Hu_e2XJzNm8kvFovig_4vzKbFunJs=" alt="token-icon" />
                    </div>
                    <div class="flex-1 flex flex-col gap-1">
                      <div class="flex items-center justify-between">
                        <span class="text-sm font-semibold text-white">Worn sock available</span>
                        <span class="text-sm font-semibold text-white text-right">USD$ 25.99</span>
                      </div>
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1">
                          <span><img :src="bookingFlowTruckIcon" alt=""></span>
                          <span class="text-xs text-[#FCE40D]">Ships to <a href="#" class="text-xs text-[#FCE40D] underline">Taiwan</a> only</span>
                        </div>
                        <span class="text-sm text-[#FCE40D] text-right">Free shipping</span>
                      </div>
                    </div>
                  </div>
                  <!-- /Content -->
                </div>
                <!-- /Mandatory purchase -->
                <hr class="border-[#F2F4F7] opacity-50" />
                <div class="flex flex-row justify-between items-start text-white">
                  <p class="text-xl font-semibold text-white">{{ t("fan_booking_amount_due_today_title") }}</p>
                  <div class="flex flex-col">
                    <div class="flex justify-end items-center gap-0.5">
                      <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                      <p class="text-xl font-semibold">{{ selectedAmount.toLocaleString() }}</p>
                    </div>
                    <span class="text-sm font-normal text-[#98A2B3] whitespace-nowrap hidden">=USD$ {{ topUpUSD }}</span>
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
