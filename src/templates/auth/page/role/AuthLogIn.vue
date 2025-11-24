<template>
  <AuthWrapper>
    <!-- login-container -->
    <div class="flex flex-col w-full relative gap-6 z-[5]">
      <div class="flex flex-col w-full gap-6">
        <!-- ✅ Direct English text (yeh default hai) -->
        <Heading text='Log In' tag="h2" theme="AuthHeading" />
        
        <form class="flex flex-col gap-8">
          <div class="flex items-center gap-1">
            <Paragraph
              text="Don't have an account?"
              font-size="text-base"
              font-weight="font-medium"
              font-color="text-white"
            />
            
            <RouterLink href="/sign-up" class="text-base font-medium leading-6 text-[#f06]">
            Sign Up
            </RouterLink>
          </div>
          
          <InputAuthComponent
            v-model="email"
            placeholder='Email'
            id="email"
            show-label
            label-text='Email'
            required
            required-display="italic-text"
            type="email"
          />
          
          <div class="flex flex-col gap-4">
            <InputAuthComponent
              v-model="password"
              placeholder='Password'
              id="password"
              show-label
              label-text='Password'
              required
              required-display="italic-text"
              type="password"
              right-icon="https://i.ibb.co/xSCKFrhW/svgviewer-png-output-82.webp"
            />
            <a href="#" class="w-fit opacity-70 text-xs capitalize text-text font-semibold">
              Forgot Password ?
            </a>
          </div>
          
          <Checkbox
            v-model="rememberMe"
            label='Remember Me'
            checkboxClass="m-0 border border-checkboxBorder [appearance:none] w-[0.75rem] h-[0.75rem] rounded-[2px] bg-transparent relative cursor-pointer checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.2rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45 "
            labelClass="text-[0.875rem] leading-6 text-text cursor-pointer"
            wrapperClass="flex items-center gap-2"
          />
          
          <ButtonComponent 
            text='Log In' 
            variant="authPink" 
            size="lg" 
          />
          
          <ButtonComponent
            text='Continue with X (twitter)'
            variant="authTransparent"
            size="lg"
            :leftIcon="'https://i.ibb.co/KjN9R5cr/svgviewer-png-output-83.webp'"
            leftIconClass="w-8 h-8"
          />
        </form>
      </div>
      
  


    </div>
  </AuthWrapper>
</template>
<script setup>
import { ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import AuthWrapper from "../../../../components/auth/authWrapper/AuthWrapper.vue";
import InputAuthComponent from "@/components/dev/input/InputAuthComponent.vue";
import Heading from "@/components/dev/default/Heading.vue";
import ButtonComponent from "@/components/dev/button/ButtonComponent.vue";
import Checkbox from "@/components/ui/form/checkbox/CheckboxGroup.vue";
import Paragraph from "@/components/dev/default/Paragraph.vue";



const route = useRoute();
const rememberMe = ref(false);
const email = ref("");
const password = ref("");
const isDev = import.meta.env.DEV;


</script>

<script>
export const assets = {
  critical: ["/css/auth.css"],
  high: [],
  normal: ["/images/auth-bg.jpg"],
};
</script>