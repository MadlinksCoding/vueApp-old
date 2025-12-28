<script setup lang="ts">
import ButtonComponent from '@/components/dev/button/ButtonComponent.vue';

</script>

<template>
    <div class="bg-[#333333] font-sans p-0 m-0 box-border overflow-x-hidden overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-order-style:none] [scrollbar-width:none] [&.dark]:bg-[#35393b]">
    <!-- wrapper -->
    <div class="bg-[url('https://i.ibb.co.com/SwFy98RJ/checkout-header.webp')] bg-cover bg-center bg-no-repeat shadow-[0px_4px_6px_-2px_#10182808,0px_12px_16px_-4px_#10182814] backdrop-blur-[50px]">
        <div class="flex flex-col justify-between gap-10 w-full min-h-screen p-6 bg-black/50 dark:bg-[#181a1b]/50">
            <!-- logo -->
            <img src="https://i.ibb.co.com/gbnC67BD/logo-bg.webp" alt="logo bg" class="w-12 h-12">

            <!-- main-container -->
            <section class="flex flex-col justify-center items-center gap-6 md:max-w-[56.25rem] md:mx-auto">
                <img src="https://i.ibb.co.com/Z6VXQMC1/alert-triangle-white.webp" alt="alert triangle white" class="w-20 h-20 md:w-[9.375rem] md:h-[9.375rem]">

                <h1 class="text-2xl font-medium text-center drop-shadow-[0px_0px_8px_#00000080] text-white md:text-4xl md:tracking-[-0.045rem] dark:text-[#e8e6e3]">Oops! Something went wrong with your payment.</h1>
            
                <div class="flex flex-col gap-6">
                    <div class="flex flex-col gap-2">
                        <p class="text-lg font-medium text-center drop-shadow-[0px_0px_8px_#00000080] text-[#FCFCFD] dark:text-[#e6e4e1]">We couldn’t process your payment due to the following reason:</p>
                    
                        <p class="text-sm text-center drop-shadow-[0px_0px_8px_#00000080] text-[#F24822] dark:text-[#f35835]">Payment was unsuccessful due to a poor network connection. Please try again later</p>
                    </div>

                    <p class="text-sm text-center drop-shadow-[0px_0px_8px_#00000080] text-[#FCFCFD] dark:text-[#e6e4e1]">Don't worry, your order is still safe with us. Please make sure the payment information provided is correct and try again. If the problem persists, please contact customer support - support@fansocial.app</p>
                
                    <div class="flex flex-col  justify-center items-center px-4 pb-2">
                        <ButtonComponent
                      text="TRY AGAIN"
                      variant="retryAction"
                      leftIcon="https://i.ibb.co.com/5m6DZJ9/arrow-left-long.webp"
                      leftIconClass="w-6 h-6 group-hover/button:[filter:brightness(0)]"
                    />
                    </div>
                </div>
            </section>

            <!-- link-container -->
            <div class="flex justify-center items-center gap-6">
                <a href="#" class="text-sm text-center text-[#FCFCFD] dark:text-[#e6e4e1]">Back to Previous</a>
                <a href="#" class="text-sm text-center text-[#FCFCFD] dark:text-[#e6e4e1]">Customer Support</a>
            </div>
        </div>
    </div>
</div>
</template>