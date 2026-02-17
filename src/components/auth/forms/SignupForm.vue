<template>
    <div class="flex flex-col w-full relative gap-6 z-[5]">
        <div class="flex flex-col w-full gap-6">
            <!-- Back Button -->
            <div v-if="showBackButton" @click="$emit('goBack')"
                class="flex items-center gap-2 cursor-pointer w-fit mb-[-1rem]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.6663 7.9987H3.33301M3.33301 7.9987L7.99967 12.6654M3.33301 7.9987L7.99967 3.33203" stroke="white" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

                <span class="text-text text-sm font-medium">Back</span>
            </div>

            <!-- heading -->
            <Heading text="Sign Up" tag="h2" theme="AuthHeading" />

            <form class="flex flex-col gap-8" @submit.prevent="handleSignUp">
                <div class="flex items-center gap-1">
                    <Paragraph text="Already have an account?" font-size="text-base" font-weight="font-medium"
                        font-color="text-white" />

                    <a @click.prevent="$emit('goToLogin')" href="#"
                        class="text-base font-medium leading-6 text-[#f06] cursor-pointer">Log in
                    </a>
                </div>

                <!-- input-wrapper (email) -->
                <InputAuthComponent v-model="localEmail" placeholder="Email address" id="email" show-label
                    label-text="Email address" required required-display="italic-text" type="email" />

                <!-- input-wrapper (password) -->
                <InputAuthComponent v-model="localPassword" placeholder="Password" id="password" show-label
                    label-text="Password" required required-display="italic-text" type="password"
                    right-icon="https://i.ibb.co/xSCKFrhW/svgviewer-png-output-82.webp" :show-errors="true" :errors="[
                        {
                            error: 'At least 8 characters long',
                            icon: InformationCircleIcon,
                        },
                        {
                            error:
                                'Contain at least 1 uppercase letter, 1 lowercase letter, 1 number',
                            icon: InformationCircleIcon,
                        },
                        {
                            error: 'Passwords do not match',
                            icon: InformationCircleIcon,
                        },
                    ]" :on-success="false" :success="[]" />
                <!-- input-wrapper (confirm password) -->
                <InputAuthComponent v-model="localConfirmPassword" placeholder="Confirm Password" id="confirmPassword"
                    show-label label-text="Confirm Password" required required-display="italic-text" type="password"
                    right-icon="https://i.ibb.co/xSCKFrhW/svgviewer-png-output-82.webp" :show-errors="true" :errors="[
                        {
                            error: 'Passwords do not match',
                            icon: InformationCircleIcon,
                        },
                    ]" :on-success="false" :success="[]" />

                <CloudflareSuccess />

                <!-- Signup button -->
                <ButtonComponent text="Sign up" variant="authPink" size="lg" @click="handleSignUp" />

                <!-- Continue with X button -->

                <ButtonComponent text="Continue with X (twitter)" variant="authTransparent" size="lg"
                    :leftIcon="'https://i.ibb.co/KjN9R5cr/svgviewer-png-output-83.webp'" leftIconClass="w-8 h-8" />
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from "vue";
import Heading from "@/components/dev/default/Heading.vue";
import Paragraph from "@/components/dev/default/Paragraph.vue";
import InputAuthComponent from "@/components/dev/input/InputAuthComponent.vue";
import ButtonComponent from "@/components/dev/button/ButtonComponent.vue";
import { InformationCircleIcon, ArrowLeftIcon } from "@heroicons/vue/24/outline";
import CloudflareSuccess from "@/components/ui/badge/dashboard/CloudflareSuccess.vue";

const props = defineProps({
    email: { type: String, default: "" },
    password: { type: String, default: "" },
    name: { type: String, default: "" },
    showBackButton: { type: Boolean, default: false },
});

const emit = defineEmits(["update:email", "update:password", "update:name", "signedUp", "goToLogin", "goBack"]);

const localEmail = computed({
    get: () => props.email,
    set: (val) => emit("update:email", val),
});

const localPassword = computed({
    get: () => props.password,
    set: (val) => emit("update:password", val),
});

const localConfirmPassword = ref(""); // Handle internally for now or promote to prop if needed

const handleSignUp = () => {
    if (localPassword.value !== localConfirmPassword.value) {
        // Handle mismatch error
        console.error("Passwords do not match");
        return;
    }
    emit("signedUp");
};

</script>
