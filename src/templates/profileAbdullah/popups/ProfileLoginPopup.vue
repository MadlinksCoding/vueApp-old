<template>
    <PopupHandler :modelValue="modelValue" @update:modelValue="(val) => emit('update:modelValue', val)"
        :config="profileLoginPopupConfig">
        <!-- Close Icon -->
        <div @click="handleClose"
            class="absolute w-10 h-10 top-2 right-2 z-10 flex justify-center items-center cursor-pointer rounded-full bg-transparent [backdrop-filter:blur(0)] [filter:drop-shadow(0_0_20px_#FFFFFF)] md:w-12 md:h-12 md:-top-6 md:-right-6 md:bg-bg-overlay dark:md:bg-bg-dark-overlay md:[backdrop-filter:blur(20px)] md:[filter:none]">
            <img class="w-6 h-6 [filter:brightness(0)_saturate(100%)_invert(90%)_sepia(9%)_saturate(72%)_hue-rotate(183deg)_brightness(105%)_contrast(91%)] md:w-[2.125rem] md:h-[2.125rem] md:[filter:none]"
                src="https://i.ibb.co.com/XrzfWZFN/svgviewer-png-output-35.webp" alt="close-icon" />
        </div>

        <!-- Content with AuthWrapper -->
         <div class="overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] h-full ">

             <AuthWrapper>
                 <!-- Step 1: Login Form -->
                 <LoginForm v-if="engine.step === 1" v-model:email="engine.state.email"
                     v-model:password="engine.state.password" v-model:rememberMe="engine.state.rememberMe"
                     @loggedIn="handleLogin" @goToSignup="engine.goToStep(2)" @forgotPassword="engine.goToStep(3)" />
     
                 <!-- Step 2: Signup Form -->
                 <SignupForm v-if="engine.step === 2" v-model:email="engine.state.email"
                     v-model:password="engine.state.password" v-model:name="engine.state.name" :show-back-button="true"
                     @goBack="engine.goToStep(1)" @signedUp="handleSignUp" @goToLogin="engine.goToStep(1)" />
     
                 <!-- Step 3: Lost Password Form -->
                 <LostPasswordForm v-if="engine.step === 3" v-model:email="engine.state.email" :show-back-button="true"
                     @goBack="engine.goToStep(1)" @submit="handleLostPasswordSubmit" @goToLogin="engine.goToStep(1)" />
     
                 <!-- Step 4: Reset Password Form -->
                 <ResetPasswordForm v-if="engine.step === 4" v-model:code="engine.state.resetCode"
                     v-model:password="engine.state.newPassword" :show-back-button="true" @goBack="engine.goToStep(3)"
                     @submit="handleResetPasswordSubmit" @goToLogin="engine.goToStep(1)" />
             </AuthWrapper>
         </div>
    </PopupHandler>
</template>

<script setup>
import { onMounted, provide } from "vue";
import PopupHandler from "@/components/ui/popup/PopupHandler.vue";
import AuthWrapper from "@/components/auth/authWrapper/AuthWrapper.vue";
import LoginForm from "@/components/auth/forms/LoginForm.vue";
import SignupForm from "@/components/auth/forms/SignupForm.vue";
import LostPasswordForm from "@/components/auth/forms/LostPasswordForm.vue";
import ResetPasswordForm from "@/components/auth/forms/ResetPasswordForm.vue";
import { createStepStateEngine } from "@/utils/stateEngine";

const props = defineProps({
    modelValue: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue"]);

const handleClose = () => {
    emit("update:modelValue", false);
};

const profileLoginPopupConfig = {
    actionType: "popup",
    position: "center",
    customEffect: "scale",
    offset: "0px",
    speed: "250ms",
    effect: "ease-in-out",
    showOverlay: false,
    closeOnOutside: true,
    lockScroll: true,
    escToClose: true,
    width: { default: "90%" },
    height: { default: "90%" },
    scrollable: true,
    closeSpeed: "250ms",
    closeEffect: "cubic-bezier(0.4, 0, 0.2, 1)",
};

// Initialize State Engine
const engine = createStepStateEngine({
    flowId: "profile-login-flow",
    initialStep: 1, // 1 = Login, 2 = Signup, 3 = Lost Password, 4 = Reset Password
    defaults: {
        email: "",
        password: "",
        name: "",
        rememberMe: false,
        resetCode: "",
        newPassword: "",
        confirmNewPassword: ""
    },
});

provide("loginEngine", engine);

const handleLogin = () => {
    console.log("Logged in via popup!", engine.state);
    handleClose();
};

const handleSignUp = () => {
    console.log("Signed up via popup!", engine.state);
    handleClose();
};

const handleForgotPassword = () => {
    console.log("Forgot password clicked");
    engine.goToStep(3);
};

const handleLostPasswordSubmit = () => {
    console.log("Lost password submit via popup - go to reset step");
    // FAKE: Simulate API call
    engine.goToStep(4);
};

const handleResetPasswordSubmit = () => {
    console.log("Reset password submit via popup - go to login");
    // FAKE: Simulate API call
    engine.goToStep(1);
};


onMounted(() => {
    engine.initialize({ fromUrl: false });
});
</script>
