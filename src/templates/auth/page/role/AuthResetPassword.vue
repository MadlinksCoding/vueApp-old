<template>
  <AuthWrapper>
    <ResetPasswordForm v-model:code="code" v-model:password="newPassword" @submit="handleReset"
      @goToLogin="goToLogin" />
  </AuthWrapper>
</template>

<script setup>
import { ref } from "vue";
import { authHandler } from "@/services/authHandler";
import { useRouter } from "vue-router";
import AuthWrapper from "@/components/auth/authWrapper/AuthWrapper.vue";
import ResetPasswordForm from "@/components/auth/forms/ResetPasswordForm.vue";

const email = ref(""); // Note: In a real app, this might come from URL query params or state
const code = ref("");
const newPassword = ref("");
const message = ref("");
const error = ref("");
const router = useRouter();

async function handleReset() {
  try {
    await authHandler.confirmPassword(
      email.value,
      code.value,
      newPassword.value
    );
    message.value = "Password reset successful. Please log in.";
    router.push("/log-in");
  } catch (err) {
    error.value = err.message || "Reset failed";
  }
}

function goToLogin() {
  router.push("/log-in");
}
</script>
<script>
export const assets = {
  critical: ["/css/auth.css"],
  high: [],
  normal: ["/images/auth-bg.jpg"],
};
</script>
