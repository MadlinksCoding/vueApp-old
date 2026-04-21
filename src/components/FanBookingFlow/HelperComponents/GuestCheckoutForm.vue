<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  initialEmail: { type: String, default: '' },
  orderId:      { type: [Number, String], default: 0 },
});

const emit = defineEmits(['update:email', 'login', 'logout']);

const parentUserData  = window?.userData || window?.parent?.userData || null;
const guestSection    = ref(Boolean(parentUserData?.userID) ? 'loggedin' : 'guest-register');
const userData        = ref(parentUserData);
const userExists      = ref(false);
const guestEmail      = ref(props.initialEmail || window?.custom_checkout_params?.user?.email);
const guestPassword   = ref('');
const isCheckingEmail = ref(false);
const isLoggingIn     = ref(false);
const isLoggingOut    = ref(false);
const isSendingReset  = ref(false);
const resetSent       = ref(false);
const guestError      = ref('');
let emailDebounceTimer = null;

watch(guestEmail, () => {
  userExists.value = false;
  debouncedCheckEmail();
});

async function checkEmail(email) {
  if (!email.includes('@')) return;
  isCheckingEmail.value = true;
  guestError.value = '';
  try {
    const res = await fetch('/wp-json/api/users/email-exist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).then((r) => r.json());
    if (res?.success) {
      userExists.value = true;
      guestSection.value = 'login';
    }
  } catch {
    // silently ignore
  } finally {
    isCheckingEmail.value = false;
  }
}

function debouncedCheckEmail() {
  clearTimeout(emailDebounceTimer);
  emailDebounceTimer = setTimeout(() => checkEmail(guestEmail.value), 1000);
}

async function login() {
  if (!guestEmail.value.trim() || !guestPassword.value.trim()) return;
  isLoggingIn.value = true;
  guestError.value = '';
  try {
    const body = new FormData();
    body.append('email',                   guestEmail.value);
    body.append('password',                guestPassword.value);
    body.append('order_id',                props.orderId || 0);
    body.append('tip_checkout_popup',              1);
    body.append('is_buy_now',              0);
    body.append('prevent_payment_redirect', 0);
    body.append('is_call_checkout',        0);
    body.append('active_payment_method',   '');
    body.append('is_has_merch',            0);
    body.append('items',                   '');
    body.append('from',                    'vue');
    const res = await fetch('/wp-admin/admin-ajax.php?action=fs_guest_checkout_login', {
      method: 'POST',
      body,
    }).then((r) => r.json());

    if (!res?.success) {
      guestError.value = res?.message || 'Login failed.';
      return;
    }

    if (window.userData === undefined) window.userData = {};
    window.userData.userID          = res.userData?.userID  || res.userData?.user_id;
    window.userData.userDisplayName = res.userData?.userDisplayName || res.userData?.display_name;
    window.userData.userEmail       = res.userData?.userEmail || guestEmail.value;
    window.userData.userAvatar      = res.userData?.userAvatar || res.userData?.avatar || '';
    userData.value = { ...window.userData };

    guestSection.value = 'loggedin';
    emit('update:email', window.userData.userEmail || guestEmail.value);
    emit('login', res);
  } finally {
    isLoggingIn.value = false;
  }
}

async function logout() {
  isLoggingOut.value = true;
  guestError.value = '';
  try {
    const body = new FormData();
    body.append('order_id',                props.orderId || 0);
    body.append('tip_checkout_popup',      1);
    body.append('is_buy_now',              0);
    body.append('prevent_payment_redirect', 0);
    body.append('is_call_checkout',        0);
    body.append('is_has_merch',            0);
    body.append('from',                    'vue');
    const res = await fetch('/wp-admin/admin-ajax.php?action=fs_guest_checkout_logout', {
      method: 'POST',
      body,
    }).then((r) => r.json());

    if (!res?.success) {
      guestError.value = res?.message || 'Logout failed.';
      return;
    }

    if (window.userData) window.userData.userID = 0;
    userData.value = null;
    guestEmail.value = '';
    guestPassword.value = '';
    userExists.value = false;
    guestSection.value = 'guest-register';
    emit('update:email', '');
    emit('logout', res);
  } finally {
    isLoggingOut.value = false;
  }
}

defineExpose({
  requiresLogin: computed(() =>
    guestSection.value === 'login' || guestSection.value === 'forgot-password'
    || (guestSection.value === 'guest-register' && userExists.value)
  ),
});

async function sendForgotPassword() {
  if (!guestEmail.value.trim()) return;
  isSendingReset.value = true;
  guestError.value = '';
  try {
    const res = await fetch('/wp-json/api/users/lost-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: guestEmail.value }),
    }).then((r) => r.json());

    if (res?.success || res?.code === 'success') {
      resetSent.value = true;
    } else {
      guestError.value = res?.message || 'Could not send reset email.';
    }
  } catch {
    guestError.value = 'Could not send reset email.';
  } finally {
    isSendingReset.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="h-6 inline-flex justify-start items-center gap-2">
      <div class="w-5 h-5 relative overflow-hidden"><img src="/images/at-sign.png" alt=""></div>
      <div class="justify-center text-gray-50 text-sm font-semibold font-['Poppins'] leading-5">ACCOUNT EMAIL</div>
    </div>

    <!-- guest-register: email input -->
    <template v-if="guestSection === 'guest-register'">
      <p class="text-xs text-white/60">
        Already have an account?
        <span class="underline cursor-pointer text-[#22CCEE]" @click="guestSection = 'login'">Log in</span>
      </p>
      <input
        type="email"
        placeholder="you@example.com"
        @blur="emit('update:email', guestEmail)"
        v-model="guestEmail"
        class="w-full bg-black/30 border border-white/20 rounded-[6px] px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#22CCEE]"
      />
      <p v-if="isCheckingEmail" class="text-xs text-white/40">Checking…</p>
      <p v-else-if="userExists" class="text-xs text-yellow-400">
        An account exists for this email.
        <span class="underline cursor-pointer" @click="guestSection = 'login'">Log in to continue</span>
        or use a different email.
      </p>
    </template>

    <!-- login: password + submit -->
    <template v-else-if="guestSection === 'login'">
      <input
        type="email"
        @blur="emit('update:email', guestEmail)" v-model="guestEmail"
        class="w-full bg-black/30 border border-white/20 rounded-[6px] px-3 py-2 text-sm text-white/60 focus:outline-none"
      />
      <input
        v-model="guestPassword"
        type="password"
        placeholder="Password"
        @keyup.enter="login"
        class="w-full bg-black/30 border border-white/20 rounded-[6px] px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#22CCEE]"
      />
      <p v-if="guestError" class="text-xs text-red-400">{{ guestError }}</p>
      <button
        type="button"
        @click="login"
        :disabled="isLoggingIn || !guestEmail.trim() || !guestPassword.trim()"
        class="w-full p-2.5 rounded-[6px] bg-[#22CCEE] text-black text-sm font-semibold transition-opacity"
        :class="(isLoggingIn || !guestEmail.trim() || !guestPassword.trim()) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'"
      >
        {{ isLoggingIn ? 'Logging in…' : 'Log in' }}
      </button>
      <div class="inline-flex justify-between">
        <span
          class="text-xs text-white/60 underline cursor-pointer"
          @click="guestSection = 'guest-register'"
        >Continue as guest</span>
        <span
          class="text-xs text-white/60 underline cursor-pointer"
          @click="guestSection = 'forgot-password'"
        >Forgot password?</span>
      </div>
    </template>

    <!-- forgot-password -->
    <template v-else-if="guestSection === 'forgot-password'">
      <input
        :value="guestEmail"
        type="email"
        :readonly="guestEmail.trim().length > 0"
        class="w-full bg-black/30 border border-white/20 rounded-[6px] px-3 py-2 text-sm text-white/60 focus:outline-none"
      />
      <p v-if="resetSent" class="text-xs text-green-400">Reset email sent! Check your inbox.</p>
      <p v-else-if="guestError" class="text-xs text-red-400">{{ guestError }}</p>
      <button
        v-if="!resetSent"
        type="button"
        @click="sendForgotPassword"
        :disabled="isSendingReset || !guestEmail.trim()"
        class="w-full p-2.5 rounded-[6px] bg-[#22CCEE] text-black text-sm font-semibold transition-opacity"
        :class="(isSendingReset || !guestEmail.trim()) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'"
      >
        {{ isSendingReset ? 'Sending…' : 'Send reset email' }}
      </button>
      <span
        class="text-xs text-white/60 underline cursor-pointer"
        @click="guestSection = 'login'; resetSent = false;"
      >Back to login</span>
    </template>

    <!-- loggedin: avatar + name + logout -->
    <template v-else-if="guestSection === 'loggedin'">
      <div class="inline-flex justify-between items-center gap-2 py-1">
        <div class="inline-flex items-center gap-2">
          <div class="w-9 h-9 relative flex-shrink-0">
            <img
              class="w-9 h-9 rounded-full object-cover"
              :src="userData?.userAvatar || userData?.user?.avatar || '/images/ex-profile.png'"
              alt=""
            />
          </div>
          <div class="inline-flex flex-col justify-center items-start">
            <div class="justify-start text-white text-xs font-semibold font-['Poppins'] leading-4 line-clamp-1">
              {{ userData?.userDisplayName || userData?.user?.display_name }}
            </div>
            <div class="justify-start text-gray-400 text-xs font-medium font-['Poppins'] leading-4">
              {{ guestEmail || userData?.userEmail || window?.custom_checkout_params?.user?.email }}
            </div>
          </div>
        </div>
        <p v-if="guestError" class="text-xs text-red-400 ml-auto mr-2">{{ guestError }}</p>
        <button
          type="button"
          @click="logout"
          :disabled="isLoggingOut"
          class="text-xs text-white/60 underline cursor-pointer flex-shrink-0"
          :class="isLoggingOut ? 'opacity-60 cursor-not-allowed' : ''"
        >
          {{ isLoggingOut ? 'Logging out…' : 'Log out' }}
        </button>
      </div>
    </template>
  </div>
</template>
