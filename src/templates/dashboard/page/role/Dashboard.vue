<template>
  <DashboardWrapperTwoColContainer>

    <!-- <BookingForm /> -->


    <!-- <Cookies /> -->

    <!-- <ButtonComponent text="Cancel" variant="hoverBgWhite" size="lg" /> -->

    <!-- <ButtonComponent text="Save" variant="greyBg" size="lg" /> -->


    <!-- <ButtonComponent
      text="Save"
      variant="polygonRight"
      :leftIcon="'https://i.ibb.co/Sw3WhF1p/svgviewer-png-output-9.webp'"
      :leftIconClass="`
  w-6 h-6 transition duration-200
  filter brightness-0 invert
  group-hover:[filter:brightness(0)_saturate(100%)_invert(0%)_sepia(96%)_saturate(7494%)_hue-rotate(96deg)_brightness(112%)_contrast(97%)]
`"
    /> -->


    <!-- <ButtonComponent
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
    /> -->

    <!-- <OrderReceived /> -->

    <!-- <LoadingTest /> -->
    <!-- <PageDataTest />  -->

    <!-- <Cart/> -->
    <!-- <OrderReceived /> -->

    
    <ButtonComponent
      text="View All Popup"
      variant="mediaBtn"
      @click="isViewAllPopupOpen = true"
    />

    <br>

     <ButtonComponent
      text="Profle media details popup"
      variant="mediaBtn"
      @click="profileMediaDetailsPopupOpen = true"
    />

    <br>
    
     <ButtonComponent
      text="Avatar upload popup"
      variant="mediaBtn"
      @click="avatarPopupOpen = true"
    />

    <ProfileViewAllPopup
      v-model="isViewAllPopupOpen"
      @update:modelValue="
        (val) => {
          isViewAllPopupOpen = val;
        }
      "
    />

     <ProfileMediaDetailsPopup
      v-model="profileMediaDetailsPopupOpen"
      @update:modelValue="
        (val) => {
          profileMediaDetailsPopupOpen = val;
        }
      "
    />

    <AvatarUploadPopup
      v-model="avatarPopupOpen"
      @update:modelValue="
        (val) => {
          avatarPopupOpen = val;
        }
      "
    />

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
import ProfileViewAllPopup from "@/components/ui/popup/ProfileViewAllPopup.vue";
import ProfileMediaDetailsPopup from "@/components/ui/popup/ProfileMediaDetailsPopup.vue";
import AvatarUploadPopup from "@/components/ui/popup/AvatarUploadPopup.vue";
import { ref } from "vue";

const isViewAllPopupOpen = ref(false);
const profileMediaDetailsPopupOpen = ref(false);
const avatarPopupOpen = ref(false);

</script>
