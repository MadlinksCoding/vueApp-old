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
            <Heading text="Reset Password" tag="h2" theme="AuthHeading" />

            <!-- input-wrapper (code) - Added this as it's needed for the API -->
            <InputAuthComponent v-model="localCode" placeholder="Reset Code" id="code" show-label
                label-text="Reset Code" required required-display="italic-text" type="text" />

            <!-- input-wrapper (password) -->
            <InputAuthComponent v-model="localPassword" placeholder="Password" id="password" show-label
                label-text="New Password" required required-display="italic-text" type="password"
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
            <InputAuthComponent v-model="localConfirmPassword" placeholder="Confirm New Password" id="confirmPassword"
                show-label label-text="Confirm New Password" required required-display="italic-text" type="password"
                right-icon="https://i.ibb.co/xSCKFrhW/svgviewer-png-output-82.webp" :show-errors="true" :errors="[
                    {
                        error: 'Passwords do not match',
                        icon: InformationCircleIcon,
                    },
                ]" :on-success="false" :success="[]" />

            <!-- submit button -->
            <ButtonComponent text="Submit" variant="authPink" size="lg" @click="handleSubmit" />

            <div class="flex items-center gap-1 justify-center mt-4">
                <a @click.prevent="$emit('goToLogin')" href="#"
                    class="text-sm font-medium leading-6 text-[#f06] cursor-pointer">
                    Back to Log in
                </a>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from "vue";
import Heading from "@/components/dev/default/Heading.vue";
import InputAuthComponent from "@/components/dev/input/InputAuthComponent.vue";
import ButtonComponent from "@/components/dev/button/ButtonComponent.vue";
import { InformationCircleIcon } from "@heroicons/vue/24/outline";

const props = defineProps({
    code: { type: String, default: "" },
    password: { type: String, default: "" },
    showBackButton: { type: Boolean, default: false },
});

const emit = defineEmits(["update:code", "update:password", "submit", "goToLogin", "goBack"]);

const localCode = computed({
    get: () => props.code,
    set: (val) => emit("update:code", val),
});

const localPassword = computed({
    get: () => props.password,
    set: (val) => emit("update:password", val),
});

const localConfirmPassword = ref("");

const handleSubmit = () => {
    if (localPassword.value !== localConfirmPassword.value) {
        // Handle mismatch error
        console.error("Passwords do not match");
        return;
    }
    emit("submit");
}
</script>
