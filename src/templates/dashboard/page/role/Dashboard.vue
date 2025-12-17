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

    <DashProfileSettings/>

    <br>
    <br>
    <br>

    <ButtonComponent
      text="View All Popup"
      variant="mediaBtn"
      @click="isViewAllPopupOpen = true"
    />

    <br />

    <ButtonComponent
      text="Profle media details popup"
      variant="mediaBtn"
      @click="profileMediaDetailsPopupOpen = true"
    />

    <br />

    <ButtonComponent
      text="Avatar upload popup"
      variant="mediaBtn"
      @click="avatarPopupOpen = true"
    />

    <br />

    <ButtonComponent
      text="Image Crop Popup"
      variant="mediaBtn"
      @click="imageCropPopupOpen = true"
    />

    <br />
    <ButtonComponent
      text="Cancel Upload Popup"
      variant="mediaBtn"
      @click="cancelUploadPopupOpen = true"
    />

    <br />

    <ButtonComponent
      text="Buy Now Login Popup"
      variant="mediaBtn"
      @click="buyNowLoginPopupOpen = true"
    />
    <br />

    <ButtonComponent
      text="Buy Now Not Login Popup"
      variant="mediaBtn"
      @click="buyNowNotLoginPopupOpen = true"
    />
    <br />

    <ButtonComponent
      text="Cart Checkout Login Popup"
      variant="mediaBtn"
      @click="cartCheckoutLoginPopupOpen = true"
    />
    <br />

    <ButtonComponent
      text="Cart Checkout Not Login Popup"
      variant="mediaBtn"
      @click="cartCheckoutNotLoginPopupOpen = true"
    />
    <br />

    <ButtonComponent
      text="Subscribe Login Popup"
      variant="mediaBtn"
      @click="subscribeLoginPopupOpen = true"
    />
    <br />

    <ButtonComponent
      text="Subscribe Not Login Popup"
      variant="mediaBtn"
      @click="subscribeNotLoginPopupOpen = true"
    />
    <br />

    <ButtonComponent
      text="Subscribe update Login Popup"
      variant="mediaBtn"
      @click="subscribeUpdateLoginPopupOpen = true"
    />
    <br />

    <UploadingProgressBar
      :progress="uploadPercentage"
      imageSrc="https://i.ibb.co.com/Kx9QDc68/auth-bg-compressed.webp"
      label="Uploading..."
    />
    <br />
    <AvatarMenu />

    <br />

    <ProfileViewAllPopup v-model="isViewAllPopupOpen" />

    <ProfileMediaDetailsPopup v-model="profileMediaDetailsPopupOpen" />

    <AvatarUploadPopup v-model="avatarPopupOpen" />

    <ImageCropperModal v-model="imageCropPopupOpen" @save="handleImageSave" />
    <CancelUploadPopup v-model="cancelUploadPopupOpen" />
    <BuyNowLoginPopup v-model="buyNowLoginPopupOpen" />
    <BuyNowNotLoginPopup v-model="buyNowNotLoginPopupOpen" />
    <CartCheckoutLoginPopup v-model="cartCheckoutLoginPopupOpen" />
    <CartCheckoutNotLoginPopup v-model="cartCheckoutNotLoginPopupOpen" />
    <SubscribeLoginPopup v-model="subscribeLoginPopupOpen" />
    <SubscribeNotLoginPopup v-model="subscribeNotLoginPopupOpen" />
    <SubscribeUpdateLoginPopup v-model="subscribeUpdateLoginPopupOpen" />
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
import { onMounted, ref } from "vue";
import ImageCropperModal from "@/components/editProfilePageComponents/ImageCropperModal.vue";
import AvatarMenu from "@/components/editProfilePageComponents/AvatarMenu.vue";
import CancelUploadPopup from "@/components/editProfilePageComponents/CancelUploadPopup.vue";
import UploadingProgressBar from "@/components/editProfilePageComponents/UploadingProgressBar.vue";
import BuyNowLoginPopup from "@/components/checkout/buyNow/BuyNowLoginPopup.vue";
import BuyNowNotLoginPopup from "@/components/checkout/buyNow/BuyNowNotLoginPopup.vue";
import CartCheckoutLoginPopup from "@/components/checkout/cartCheckout/CartCheckoutLoginPopup.vue";
import CartCheckoutNotLoginPopup from "@/components/checkout/cartCheckout/CartCheckoutNotLoginPopup.vue";
import SubscribeLoginPopup from "@/components/checkout/subscribe/SubscribeLoginPopup.vue";
import SubscribeNotLoginPopup from "@/components/checkout/subscribe/SubscribeNotLoginPopup.vue";
import SubscribeUpdateLoginPopup from "@/components/checkout/subscribe/SubscribeUpdateLoginPopup.vue";
import DashProfileSettings from "@/components/DashProfileSettings.vue";

const isViewAllPopupOpen = ref(false);
const profileMediaDetailsPopupOpen = ref(false);
const avatarPopupOpen = ref(false);
const imageCropPopupOpen = ref(false);
const cancelUploadPopupOpen = ref(false);
const buyNowLoginPopupOpen = ref(false);
const buyNowNotLoginPopupOpen = ref(false);
const cartCheckoutLoginPopupOpen = ref(false);
const cartCheckoutNotLoginPopupOpen = ref(false);
const subscribeLoginPopupOpen = ref(false);
const subscribeNotLoginPopupOpen = ref(false);
const subscribeUpdateLoginPopupOpen = ref(false);

const handleImageSave = (data) => {
  console.log("Cropped Data Received:", data);
};
const uploadPercentage = ref(0);

// This function is only for demo purposes to show the progress bar in action.
// Once the actual API is integrated, this will no longer be needed,
// as the value will come directly from the API.
onMounted(() => {
  const interval = setInterval(() => {
    if (uploadPercentage.value < 100) {
      uploadPercentage.value += 1;
    } else {
      clearInterval(interval);
    }
  }, 50); // Speed control
});
</script>
