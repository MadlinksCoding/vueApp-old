<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { showToast } from '@/utils/toastBus.js';
import '@/utils/axcessGatewayFormHandler.js';
import '@/assets/css/axcessGatewayForm.css';
import GuestCheckoutForm from './GuestCheckoutForm.vue';
import CardForm from './CardForm.vue';

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
});

const emit = defineEmits(['back', 'success', 'payment-failed']);

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

const isLoggedIn = computed(() => Boolean(window?.userData?.userID));

const hasEmail  = computed(() => isLoggedIn.value || billingEmail.value.trim().includes('@'));
const canSubmit = computed(() =>
  !isFormLoading.value && !isProcessing.value && hasEmail.value
  && !guestFormRef.value?.requiresLogin
  && Boolean(cardFormRef.value?.canPay)
);

function resolveFanUserId() {
  return localStorage.getItem('userId') ?? 2;
}
function resolveCreatorId() {
  return 1;
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
    paymentError.value = 'Could not load payment form. Please refresh and try again.';
  } finally {
    isFormLoading.value = false;
  }
  window.axcessHandler = handler;

  await handler.ready;
  pricingConfig.value = handler.tip_checkout_params?.config || null;
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
    paymentError.value = 'Could not reload payment form. Please try again.';
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
    emit('success');
  } else {
    emit('payment-failed', _response);
    showToast({
      type: 'error',
      title: 'Payment processing failed',
      message: _response?.error_message || 'Payment failed. Please try again.',
    });
    handlePaymentError(_response?.error_message || '');
  }
}

function handlePaymentError(message) {
  isProcessing.value = false;
  cardFormRef.value?.setProcessingPayment(false);
  console.error('Payment error:', message);
  paymentError.value = message || 'Payment failed. Please try again.';
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
    paymentError.value = 'Reloading payment form…';
    await reloadCardForm();
    if (!handler.currentOrderId) {
      paymentError.value = 'Could not load payment form. Please refresh and try again.';
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
    paymentError.value = err?.message || 'Payment failed. Please try again.';
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
    res.order_id = res.order_id || existingOrderId; // Ensure order_id is passed to renderForm for proper recovery
    const { orderId } = await handler.renderForm(selectedAmount.value, existingOrderId, 'token', res);
    currentOrderId.value = orderId ?? null;
    cardFormRef.value?.syncSavedCards();
  } catch (err) {
    console.error('[TopUpForm] renderForm failed during reloadCardForm:', err);
    paymentError.value = 'Could not reload payment form. Please try again.';
  } finally {
    isFormLoading.value = false;
  }
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
  <div class="flex flex-col w-full h-full">

    <div 
      class="inline-flex justify-start items-center gap-0.5 cursor-pointer"
      @click="emit('back')"
    >
      <div class="w-4 h-4 relative overflow-hidden">
        <img src="/images/arrow-left.svg" alt="">
      </div>
      <div class="justify-start text-white text-xs font-medium font-['Poppins'] leading-4">
        Back
      </div>
    </div>

    <div class="flex flex-col gap-4">

      <!-- Amount display + presets -->
      <div class="flex flex-col gap-1">
        <div class="opacity-70 justify-start text-white text-xs font-normal font-['Poppins'] leading-4">
          TOP UP AMOUNT
        </div>
        <div class="flex flex-col gap-3">
          <div class="inline-flex justify-start items-center gap-1">
            <div class="relative">
              <img class="w-10 h-10" src="/images/token.svg" alt="">
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
        @login="reloadCardForm"
        @logout="reloadCardForm"
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
      <div class="flex flex-col justify-center items-start gap-2">

        <div class="inline-flex justify-between w-full">
          <div class="justify-start text-white text-sm font-normal font-['Poppins'] leading-5">Original balance</div>
          <div class="flex justify-start items-center gap-1">
            <div class="w-4 h-4 relative"><img src="/images/token.svg" alt=""></div>
            <div class="justify-start text-white text-sm font-medium font-['Poppins'] leading-5">{{ walletBalance.toLocaleString() }}</div>
          </div>
        </div>

        <div class="inline-flex justify-between w-full">
          <div class="justify-start text-white text-sm font-normal font-['Poppins'] leading-5">Top up amount</div>
          <div class="flex justify-start items-center gap-1">
            <div class="justify-start text-white text-sm font-medium font-['Poppins'] leading-5">+</div>
            <div class="w-4 h-4 relative"><img src="/images/token.svg" alt=""></div>
            <div class="justify-start text-white text-sm font-medium font-['Poppins'] leading-5">{{ selectedAmount.toLocaleString() }}</div>
          </div>
        </div>

        <div class="h-0 outline outline-1 outline-offset-[-0.50px] outline-white w-full"></div>

        <div class="inline-flex justify-between w-full">
          <div class="justify-start text-white text-sm font-normal font-['Poppins'] leading-5">Balance after top up</div>
          <div class="flex justify-start items-center gap-1">
            <div class="w-4 h-4 relative"><img src="/images/token.svg" alt=""></div>
            <div class="justify-start text-white text-lg font-semibold font-['Poppins'] leading-7">{{ balanceAfterTopUp.toLocaleString() }}</div>
          </div>
        </div>

        <div class="inline-flex justify-between w-full">
          <div class="justify-start text-white text-sm font-normal font-['Poppins'] leading-5">Subtotal</div>
          <div class="flex justify-start items-center gap-1">
            <div class="justify-start text-white text-sm font-medium font-['Poppins'] leading-5">-</div>
            <div class="w-4 h-4 relative"><img src="/images/token.svg" alt=""></div>
            <div class="justify-start text-white text-sm font-medium font-['Poppins'] leading-5">{{ totalPrice }}</div>
          </div>
        </div>

        <div class="w-full h-0 outline outline-1 outline-offset-[-0.50px] outline-white"></div>

        <div class="inline-flex justify-between w-full">
          <div class="justify-start text-white text-sm font-semibold font-['Poppins'] leading-5">Balance after booking</div>
          <div class="flex justify-start items-center gap-1">
            <div class="w-4 h-4 relative"><img src="/images/token.svg" alt=""></div>
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

      <!-- Submit button -->
      <button
        type="button"
        :disabled="!canSubmit"
        @click="handlePayNow"
        class="w-full mt-2 p-3 rounded-[8px] flex justify-center items-center gap-2 font-semibold text-sm transition-opacity"
        :class="canSubmit ? 'bg-[#07F468] text-black cursor-pointer' : 'bg-[#07F468]/40 text-black/60 cursor-not-allowed'"
      >
        <span>{{ isProcessing ? 'PROCESSING...' : isFormLoading ? 'LOADING FORM...' : 'TOP UP & COMPLETE BOOKING' }}</span>
        <img src="/images/arrow-right.svg" alt="" class="w-4 h-4" />
      </button>

    </div>
  </div>

</template>
