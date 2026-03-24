<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import PaymentMethodLoggedIn from '../../checkout/ReuseableComponents/PaymentMethodLoggedIn.vue';

const props = defineProps({
  handler:        { type: Object,                   default: null },
  selectedAmount: { type: Number,                   default: 0 },
  currentOrderId: { type: [Number, String],         default: null },
  tipCheckoutPopup: { type: Boolean,                  default: true },
});

const emit = defineEmits(['order-id-updated']);

const paymentContainer    = ref(null);
const dropdownContainer   = ref(null);
const isProcessingPayment = ref(false); // TODO: set false after spinner design confirmed

// Card validity (used when paymentMethod === 'new_card')
const isCardReady     = ref(false);
const cardNumberValid = ref(false);
const cardCvcValid    = ref(false);
const cardHolderValid = ref(false);
const cardExpiryValid = ref(false);

// OPPWA event listeners
let _onCardIframeMessage = null;
let _onPaymentFormReady  = null;

const OPPWA_ORIGINS = ['https://eu-test.oppwa.com', 'https://eu-prod.oppwa.com'];

function _setupCardListeners() {
  // OPPWA iframe → card number / cvv validity
  _onCardIframeMessage = (event) => {
    if (!OPPWA_ORIGINS.includes(event.origin)) return;
    let data;
    try { data = JSON.parse(event.data); } catch { return; }
    if (data?.method !== 'iframeCommunication::setIsValid') return;
    const { eventType, isValid, isEmpty } = data?.params || {};
    if (!['keydown', 'forcedBlur', 'onChange'].includes(eventType)) return;
    const iframes = document.querySelectorAll('iframe');
    const src = Array.from(iframes).find(f => { try { return f.contentWindow === event.source; } catch { return false; } });
    if (!src) return;
    if (src.name === 'card.number') cardNumberValid.value = isValid && !isEmpty;
    if (src.name === 'card.cvv')    cardCvcValid.value    = isValid && !isEmpty;
  };
  window.addEventListener('message', _onCardIframeMessage);

  // paymentFormReady → isCardReady + bind holder/expiry inputs
  _onPaymentFormReady = () => {
    isCardReady.value = true;
    const c = paymentContainer.value;
    if (!c) return;
    const holderInput = c.querySelector('input[name="card.holder"]');
    if (holderInput) {
      const check = () => {
        cardHolderValid.value = holderInput.value.trim().length > 0
          && !holderInput.classList.contains('wpwl-has-error');
      };
      holderInput.addEventListener('input', check);
      holderInput.addEventListener('blur',  check);
    }
    const expiryInput = c.querySelector('[data-action="blur-card-expiry"]');
    if (expiryInput) {
      const check = () => {
        cardExpiryValid.value = expiryInput.value.trim().length > 0
          && !expiryInput.classList.contains('wpwl-has-error');
      };
      expiryInput.addEventListener('input', check);
      expiryInput.addEventListener('blur',  check);
    }
  };
  window.addEventListener('paymentFormReady', _onPaymentFormReady);
}

// Saved cards state
const savedCards       = ref([]);
const selectedTokenId  = ref(null);
const paymentMethod    = ref('new_card'); // 'new_card' | 'token'
const isDeletingCardId = ref(null);
const showCardList     = ref(false);

const selectedCard = computed(() =>
  savedCards.value.find(c => c.id == selectedTokenId.value) ?? null
);

function syncSavedCards() {
  const details = window?.custom_checkout_params?.payment_details;
  if (!Array.isArray(details) || details.length === 0) return;
  savedCards.value = details;
  const def = window.custom_checkout_params.payment_detail;
  if (def?.id && !selectedTokenId.value) {
    selectedTokenId.value = def.id;
    paymentMethod.value   = 'token';
    window.custom_checkout_params.payment_method = 'token';
  }
}

function resetCardValidity() {
  isCardReady.value = cardNumberValid.value = cardCvcValid.value =
  cardHolderValid.value = cardExpiryValid.value = false;
}

function handleSelectCard(tokenId) {
  selectedTokenId.value = tokenId;
  paymentMethod.value   = 'token';
  showCardList.value    = false;
  window.custom_checkout_params.payment_method = 'token';
  resetCardValidity();
}

async function handleUseNewCard() {
  showCardList.value    = false;
  paymentMethod.value   = 'new_card';
  selectedTokenId.value = null;
  window.custom_checkout_params.payment_method = 'new_card';

  // If the form and order already exist, just reveal the container — no API call needed
  // Do NOT reset validity here; paymentFormReady already fired when form was first rendered
  if (props.currentOrderId && paymentContainer.value?.querySelector('form.wpwl-form')) {
    return;
  }

  resetCardValidity();
  try {
    const { orderId } = await props.handler.renderForm(
      props.selectedAmount, props.currentOrderId, 'token'
    );
    emit('order-id-updated', orderId);
  } catch { /* error handled by handler */ }
}

async function handleDeleteCard(tokenId) {
  isDeletingCardId.value = tokenId;
  try {
    const body = new FormData();
    body.append('action_type', 'delete_token');
    body.append('token_id',    tokenId);
    body.append('tip_checkout_popup',   props.tipCheckoutPopup ? 1 : 0);

    body.append('is_buy_now', 0);
    body.append('prevent_payment_redirect', 0); // New call checkout
    body.append('is_call_checkout', 0); // New call checkout
    body.append('active_payment_methodd', custom_checkout_params?.active_payment_method ? custom_checkout_params.active_payment_method : ''); // Gcash feature

    if (props.currentOrderId) body.append('order_id', props.currentOrderId);
    const res = await fetch('/wp-admin/admin-ajax.php?action=handle_delete_update', {
      method: 'POST', body,
    }).then(r => r.json());
    if (!res?.success) return;
    savedCards.value = savedCards.value.filter(c => c.id != tokenId);
    if (window.custom_checkout_params?.payment_details) {
      window.custom_checkout_params.payment_details =
        window.custom_checkout_params.payment_details.filter(c => c.id != tokenId);
    }
    if (selectedTokenId.value == tokenId) {
      const next = savedCards.value[0];
      if (next) handleSelectCard(next.id);
      else      handleUseNewCard();
    }
  } finally {
    isDeletingCardId.value = null;
  }
}

function handleClickOutside(event) {
  if (dropdownContainer.value && !dropdownContainer.value.contains(event.target)) {
    showCardList.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  _setupCardListeners();
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  if (_onCardIframeMessage) window.removeEventListener('message',        _onCardIframeMessage);
  if (_onPaymentFormReady)  window.removeEventListener('paymentFormReady', _onPaymentFormReady);
});

defineExpose({
  canPay: computed(() => {
    if (paymentMethod.value === 'token') return Boolean(selectedTokenId.value);
    return isCardReady.value && cardNumberValid.value && cardCvcValid.value
           && cardHolderValid.value && cardExpiryValid.value;
  }),
  getPaymentExtraFields() {
    return paymentMethod.value === 'token'
      ? { payment_method: 'token', token_id: selectedTokenId.value }
      : {};
  },
  syncSavedCards,
  resetCardValidity,
  paymentContainer,
  setProcessingPayment(val) { isProcessingPayment.value = val; },
});
</script>

<template>
  <div class="flex flex-col gap-2">

    <!-- Header -->
    <div class="h-6 inline-flex justify-between items-center gap-2">
      <div class="inline-flex items-center gap-2">
        <div class="w-5 h-5 relative flex justify-center items-center">
          <img src="/images/creditIcon.png" alt="">
        </div>
        <span class="text-gray-50 text-sm font-semibold font-['Poppins'] leading-5">PAYMENT METHOD</span>
      </div>
      <button
        v-if="savedCards.length > 0"
        type="button"
        @click="showCardList = !showCardList"
        class="inline-flex items-center gap-1 text-xs text-[#22CCEE] cursor-pointer select-none"
      >
        <span>Change Card</span>
        <svg
          width="10" height="10" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"
          class="transition-transform duration-200"
          :class="{ 'rotate-180': showCardList }"
        >
          <path d="M1 2.5L4 5.5L7 2.5" stroke="#22CCEE" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <!-- Content area: selected card or OPPWA form, with dropdown overlaid -->
    <div class="relative" ref="dropdownContainer">

      <!-- Selected card display -->
      <div v-if="paymentMethod === 'token' && selectedCard" class="border border-[#22CCEE] rounded-md">
        <PaymentMethodLoggedIn
          variant="large"
          :holder-name="selectedCard.card_holder_name"
          :card-number="selectedCard.last4"
          :expiry="`${selectedCard.expiry_month}/${selectedCard.expiry_year}`"
          @remove="showCardList = true"
        />
      </div>

      <!-- Skeleton template for AxcessGatewayFormHandler._showSkeleton() — must stay outside paymentContainer -->
      <template data-axcess-payment-skeleton>
        <div class="checkout-skeleton axcess-payment-skeleton inline-flex flex-col justify-between items-start p-6 rounded-xl w-full">
          <!-- Header row -->
          <div class="flex self-stretch justify-between items-center h-4">
            <div class="flex items-center gap-1">
              <div class="w-4 h-4"></div>
              <div class="text-xs font-medium leading-[18px]" style="color: #EAECF0;">Delete Card</div>
            </div>
            <div class="skeleton h-4 w-24 rounded-[6px]"></div>
          </div>
          <!-- Body -->
          <div class="flex flex-col self-stretch gap-10">
            <!-- Card number -->
            <div class="w-full h-11 inline-flex flex-col justify-center">
              <div class="skeleton h-6 rounded-[6px] self-stretch"></div>
            </div>
            <!-- Card holder / expiry / cvv row -->
            <div class="inline-flex justify-between items-end self-stretch">
              <div class="h-[46px] inline-flex items-start flex-col">
                <div class="text-xs font-medium leading-[18px] text-gray-400">Card Holder Name</div>
                <div class="py-[2px]">
                  <div class="skeleton w-[100px] h-6 rounded-[6px]"></div>
                </div>
              </div>
              <div class="h-[46px] w-[68px] inline-flex flex-col justify-between items-start">
                <div class="text-xs font-medium leading-[18px] text-gray-400">Expiry Date</div>
                <div class="self-stretch py-[2px]">
                  <div class="skeleton h-6 rounded-[6px]"></div>
                </div>
              </div>
              <div class="rounded-[6px] h-[46px] w-[46px]"></div>
            </div>
          </div>
        </div>
      </template>

      <!-- OPPWA new-card form (v-show keeps ref alive) -->
      <div v-show="paymentMethod === 'new_card'" data-card-dark-ui ref="paymentContainer" class="w-full"></div>

      <!-- Dropdown overlay -->
      <div
        v-if="showCardList"
        class="absolute top-0 left-0 right-0 z-50 bg-[#111] border border-white/20 rounded-[6px] overflow-hidden shadow-xl"
      >
        <div
          v-for="card in savedCards"
          :key="card.id"
          class="transition-colors"
          :class="card.id == selectedTokenId ? 'bg-[#22CCEE]/10' : 'hover:bg-white/5'"
        >
          <div v-if="isDeletingCardId == card.id" class="px-3 py-2.5 text-xs text-gray-400">Deleting…</div>
          <PaymentMethodLoggedIn
            v-else
            :holder-name="card.card_holder_name"
            :card-number="card.last4"
            :expiry="`${card.expiry_month}/${card.expiry_year}`"
            @chosen="handleSelectCard(card.id)"
            @remove="handleDeleteCard(card.id)"
          />
        </div>

        <div
          @click="handleUseNewCard"
          class="flex items-center gap-2 px-3 py-2.5 border-t border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
        >
          <span class="w-5 h-5 rounded-full border border-[#07F468] flex items-center justify-center flex-shrink-0">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 1V9M1 5H9" stroke="#07F468" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </span>
          <span class="text-[#07F468] text-sm">Add New Credit Card</span>
        </div>
      </div>

    </div>
  </div>

  <!-- Payment processing spinner -->
  <Teleport to="body">
    <div
      v-if="isProcessingPayment"
      class="fixed inset-0 z-[9999999] flex items-center justify-center"
    >
      <div class="absolute inset-0 bg-black/60 backdrop-blur-md"></div>
      <div class="relative z-10 flex flex-col items-center gap-3 bg-[#1C1C1E] rounded-3xl p-6 w-[22rem] shadow-2xl">
        <iframe
          class="w-full aspect-square rounded-2xl"
          src="https://lottie.host/embed/22c282b9-8645-4ad1-ade1-9637d7727ad8/TzLPM6VQvn.lottie"
          frameborder="0"
        ></iframe>
        <p class="text-white text-base font-medium font-['Poppins'] text-center">
          Processing your payment...
        </p>
      </div>
    </div>
  </Teleport>
</template>
