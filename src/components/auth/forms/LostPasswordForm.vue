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
            <Heading text="Forgot Password" tag="h2" theme="AuthHeading" />

            <Paragraph
                text="If an account is associated with the provided email addrress, you will recieve a link to reset your password."
                font-size="text-base" font-weight="font-medium" font-color="text-white" />

            <!-- input-wrapper (email) -->
            <InputAuthComponent v-model="localEmail" placeholder="Email" id="email" show-label label-text="Email"
                required required-display="italic-text" type="email" />

            <CloudflareSuccess />

            <!-- submit button -->
            <ButtonComponent text="Submit" variant="authPink" size="lg" @click="$emit('submit')" />
            <!-- Resend button (optional or context dependent) -->
            <!-- <ButtonComponent text="Resend" variant="authPink" size="lg" /> -->

            <div class="flex items-center gap-1 justify-center mt-4">
                <Paragraph text="Remember your password?" font-size="text-sm" font-weight="font-medium"
                    font-color="text-white" />

                <a @click.prevent="$emit('goToLogin')" href="#"
                    class="text-sm font-medium leading-6 text-[#f06] cursor-pointer">
                    Log in
                </a>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from "vue";
import Heading from "@/components/dev/default/Heading.vue";
import Paragraph from "@/components/dev/default/Paragraph.vue";
import ButtonComponent from "@/components/dev/button/ButtonComponent.vue";
import InputAuthComponent from "@/components/dev/input/InputAuthComponent.vue";
import CloudflareSuccess from "@/components/ui/badge/dashboard/CloudflareSuccess.vue";

const props = defineProps({
    email: { type: String, default: "" },
    showBackButton: { type: Boolean, default: false },
});

const emit = defineEmits(["update:email", "submit", "goToLogin", "goBack"]);

const localEmail = computed({
    get: () => props.email,
    set: (val) => emit("update:email", val),
});
</script>
