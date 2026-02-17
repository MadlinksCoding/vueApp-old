<template>
  <AuthWrapper>
    <LoginForm v-model:email="email" v-model:password="password" v-model:rememberMe="rememberMe" @loggedIn="handleLogin"
      @goToSignup="goToSignup" @forgotPassword="handleForgotPassword" />
  </AuthWrapper>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import AuthWrapper from "@/components/auth/authWrapper/AuthWrapper.vue";
import LoginForm from "@/components/auth/forms/LoginForm.vue";

const router = useRouter();
const rememberMe = ref(false);
const email = ref("");
const password = ref("");

const handleLogin = () => {
  console.log("Logging in from page...");
  // Add actual login dispatch here
};

const goToSignup = () => {
  router.push("/sign-up");
};

const handleForgotPassword = () => {
  console.log("Redirecting to forgot password...");
  router.push("/lost-password");
};
</script>

<script>
export const assets = {
  critical: ["/css/auth.css"],
  high: [],
  normal: ["/images/auth-bg.jpg"],
};
</script>