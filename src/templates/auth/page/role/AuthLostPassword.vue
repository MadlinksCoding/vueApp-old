<template>
  <AuthWrapper>
    <LostPasswordForm v-model:email="email" @submit="handleForgot" @goToLogin="goToLogin" />
  </AuthWrapper>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { authHandler } from "@/services/authHandler";
import AuthWrapper from "@/components/auth/authWrapper/AuthWrapper.vue";
import LostPasswordForm from "@/components/auth/forms/LostPasswordForm.vue";

const email = ref("");
const message = ref("");
const error = ref("");
const router = useRouter();

async function handleForgot() {
  try {
    // FAKE: Simulate API call
    // await authHandler.forgotPassword(email.value);
    console.log("Fake lost password submit for:", email.value);
    message.value = "Reset code sent to your email.";
    router.push("/reset-password"); // Redirect to reset page
  } catch (err) {
    error.value = err.message || "Failed to send code";
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
