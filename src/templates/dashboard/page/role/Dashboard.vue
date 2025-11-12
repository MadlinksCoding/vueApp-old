<template>
  <DashboardWrapperTwoColContainer>

    <!-- <BookingForm /> -->

<!-- 
    <Cookies />

    <ButtonComponent text="Cancel" variant="hoverBgWhite" size="lg" />

    <br />

    <ButtonComponent text="Save" variant="greyBg" size="lg" />

    <br />

    <ButtonComponent
      text="Add Tier"
      variant="polygonLeft"
      :leftIcon="'https://i.ibb.co/N2xH2QVV/svgviewer-png-output-13.webp'"
      :leftIconClass="`
  w-6 h-6 transition duration-200
  filter brightness-0
  group-hover:[filter:brightness(0)_saturate(100%)_invert(75%)_sepia(23%)_saturate(7280%)_hue-rotate(93deg)_brightness(109%)_contrast(95%)]
`"
    />

    <br />

    <ButtonComponent
      text="Save"
      variant="polygonRight"
      :leftIcon="'https://i.ibb.co/Sw3WhF1p/svgviewer-png-output-9.webp'"
      :leftIconClass="`
  w-6 h-6 transition duration-200
  filter brightness-0 invert
  group-hover:[filter:brightness(0)_saturate(100%)_invert(0%)_sepia(96%)_saturate(7494%)_hue-rotate(96deg)_brightness(112%)_contrast(97%)]
`"
    />

    <br />

    <ButtonComponent
      text="Next"
      variant="polygonLeft"
      :rightIcon="'https://i.ibb.co/hx8ztZFf/svgviewer-png-output-8.webp'"
      :rightIconClass="`
  w-6 h-6 transition duration-200
  filter brightness-0 invert-0   /* Default: black */
  group-hover:[filter:brightness(0)_saturate(100%)_invert(75%)_sepia(23%)_saturate(7280%)_hue-rotate(93deg)_brightness(109%)_contrast(95%)]
`"
      btnBg="#07f468"
      btnHoverBg="black"
      btnText="black"
      btnHoverText="#07f468"
    />

    <OrderReceived />

    <LoadingTest />
    <PageDataTest /> -->

    <Cart/>


  </DashboardWrapperTwoColContainer>
</template>

<script setup>
import DashboardWrapperTwoColContainer from "@/components/dashboard/DashboardWrapperTwoColContainer.vue";
import ButtonComponent from "@/components/dev/button/ButtonComponent.vue";
import LoadingTest from "@/components/LoadingTest.vue";
import Cookies from "@/components/ui/badge/dashboard/Cookies.vue";
import Cart from "@/components/ui/Cart.vue";
import BookingForm from "@/components/ui/form/BookingForm.vue";
import OrderReceived from "@/components/ui/table/dashboard/OrderReceived.vue";
</script>
