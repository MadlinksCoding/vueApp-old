<template>
  <DashboardWrapperTwoColContainer>

    
    <ButtonComponent text="Event Details Fan Popup" variant="mediaBtn" @click="eventDetailsFanOpen = true" />

    <br />

    <ButtonComponent text="Accept New Price" variant="mediaBtn" @click="acceptNewPriceOpen = true" />

    <br />

    <div class="flex w-full max-w-[510px] flex-col items-center gap-3 rounded-[15px] bg-black/50 p-4 md:p-5">
      <p class="text-base font-normal leading-6 text-white">The merch you are about to purchase does not ship internationally, please confirmed you can provide address accordingly:</p>
      <div class="flex items-center gap-5 self-stretch rounded-xl bg-[rgba(16,24,40,0.6)] p-3">
        <div class="w-[7.5625rem] h-[7.5625rem] aspect-square rounded-[0.5rem] overflow-hidden bg-white">
          <img src="https://i.ibb.co/d0B63B18/image.png" alt="" class="w-full h-full object-cover">
        </div>
        <div class="flex flex-col justify-center items-start gap-2 flex-1 self-stretch">
          <h3 class="text-white text-[1.125rem] font-semibold leading-[1.75rem]">Worn Socks Available</h3>
          <div class="flex items-center gap-[0.125rem]">
            <span class="text-[#FCE40D] text-[1.25rem] font-bold leading-[1.875rem] text-shadow-[0_0_10px_rgba(0,0,0,0.10)]">USD$25</span>
            <span class="text-white font-poppins text-[0.75rem] font-normal leading-[1.125rem] line-through text-shadow-[0_0_10px_rgba(0,0,0,0.10)]">$50</span>
            <div class="flex justify-center items-center gap-[-0.5rem] rounded-[0.25rem] backdrop-blur-[10px] pl-2 relative">
              <span class="flex absolute top-0 left-0 z-[1] pt-0 pr-0 pb-[0.125rem] pl-[0.125rem] justify-center items-center shadow-[3px_0_4px_0_rgba(0,0,0,0.25)]">
                <img :src="bookingFlowLightningIcon" alt="">
              </span>
              <span class="flex py-[0.125rem] pr-[0.375rem] pl-[0.75rem] justify-center items-center gap-1 rounded-[0.25rem] bg-[#0133FB] backdrop-blur-[10px]">
                <span class="text-white font-poppins text-[0.625rem] font-semibold leading-[0.9375rem]">50% off</span>
              </span>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <span><img :src="bookingFlowTruckIcon" alt=""></span>
              <span class="text-xs text-[#FCE40D]">Ships to <a href="#" class="text-xs text-[#FCE40D] underline">Taiwan</a> only</span>
            </div>
        </div>
      </div>
      <div class="flex flex-col items-start gap-[0.75rem] self-stretch">
        <button class="flex min-h-[2.5rem] min-w-[6.25rem] px-[1.5rem] py-[0.5rem] justify-center items-center gap-[0.625rem] self-stretch bg-[#07F468]">
          <span class="text-[#0C111D] font-poppins text-[1rem] font-medium leading-[1.5rem] md:whitespace-nowrap">I confirm I can provide shipping address from Taiwan</span>
        </button>
        <button class="flex h-[2.5rem] min-w-[6.25rem] px-[1.5rem] py-[0.5rem] justify-center items-center gap-[0.625rem] self-stretch border-[1.5px] border-white bg-[#101828]">
          <span class="text-white font-poppins text-[1rem] font-medium leading-[1.5rem] whitespace-nowrap">Go back</span>
        </button>
      </div>
    </div>
  
    <div class="p-4 border border-gray-300 rounded-lg bg-white w-full max-w-sm mb-6 shadow-sm">
      <h3 class="font-bold mb-4 text-lg text-gray-800">Local Storage Config</h3>
      <div class="flex flex-col gap-4">
        <label class="flex flex-col gap-1 font-medium text-sm text-gray-700">
          User ID <span class="text-red-500">*</span>
          <input type="text" v-model="demoUserId" placeholder="Enter User ID" class="border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-500" required />
        </label>
        <label class="flex items-center gap-2 font-medium text-sm text-gray-700 cursor-pointer w-fit">
          <input type="checkbox" v-model="demoIsCreator" class="w-4 h-4 cursor-pointer" />
          Is Creator
        </label>
        <button @click="saveToLocalStorage" class="bg-blue-600 text-white font-medium px-4 py-2 rounded hover:bg-blue-700 transition duration-200 mt-2">
          Save Config
        </button>
      </div>
    </div>

    <TwitterRepostSettings />
    <br />
    <br />
    
    <NewChatPopup />
    <br />
    <br />
  
    <DashboardEventStaticPopup />
    <br />
    <br />

    <AdjustEventDetailsPopup />
    <br />
    <br />

    <AdjustCostBooking />
    <br />
    <br />

    <CallSoonChat />
    <br />
    <br /> 

    <AskForMoreTime />
    <br />
    <br />
    <!-- <BookingForm /> -->
    <AskToSchedule />
    <br />
    <br />
    <ChatSection />
    <br />
    <br />

    <NewMessage />
    <br />
    <br /> 

    <Cookies />

    <!-- <ButtonComponent text="Cancel" variant="hoverBgWhite" size="lg" /> -->

    <!-- <ButtonComponent text="Save" variant="greyBg" size="lg" /> -->

    <ButtonComponent text="Save" variant="polygonRight"
      :leftIcon="'https://i.ibb.co/Sw3WhF1p/svgviewer-png-output-9.webp'" :leftIconClass="`
  w-6 h-6 transition duration-200
  filter brightness-0 invert
  group-hover:[filter:brightness(0)_saturate(100%)_invert(0%)_sepia(96%)_saturate(7494%)_hue-rotate(96deg)_brightness(112%)_contrast(97%)]
`" />

    <ButtonComponent text="Next" variant="polygonLeft"
      :rightIcon="'https://i.ibb.co/hx8ztZFf/svgviewer-png-output-8.webp'" :rightIconClass="`
  w-6 h-6 transition duration-200
  filter brightness-0 invert-0   /* Default: black */
  group-hover:[filter:brightness(0)_saturate(100%)_invert(75%)_sepia(23%)_saturate(7280%)_hue-rotate(93deg)_brightness(109%)_contrast(95%)]
`" btnBg="#07f468" btnHoverBg="black" btnText="black" btnHoverText="#07f468" />

    <!-- <OrderReceived /> -->

    <!-- <LoadingTest /> -->
    <!-- <PageDataTest />  -->
    <br />
    <br />
    <Cart />
    <!-- <OrderReceived /> -->
    <br />
    <br />

    <br />
    <br />
    <DashProfileSettings />

    <br />
    <br />

    <ButtonComponent text="View All Popup" variant="mediaBtn" @click="isViewAllPopupOpen = true" />

    <br />

    <ButtonComponent text="Profle media details popup" variant="mediaBtn"
      @click="profileMediaDetailsPopupOpen = true" />

    <br />

    <ButtonComponent text="Avatar upload popup" variant="mediaBtn" @click="avatarPopupOpen = true" />

    <br />

    <ButtonComponent text="Image Crop Popup" variant="mediaBtn" @click="imageCropPopupOpen = true" />

    <br />
    <ButtonComponent text="Cancel Upload Popup" variant="mediaBtn" @click="cancelUploadPopupOpen = true" />

    <br />

    <ButtonComponent text="Buy Now Login Popup" variant="mediaBtn" @click="buyNowLoginPopupOpen = true" />
    <br />

    <ButtonComponent text="Buy Now Not Login Popup" variant="mediaBtn" @click="buyNowNotLoginPopupOpen = true" />
    <br />

    <ButtonComponent text="Cart Checkout Login Popup" variant="mediaBtn" @click="cartCheckoutLoginPopupOpen = true" />
    <br />

    <ButtonComponent text="Cart Checkout Not Login Popup" variant="mediaBtn"
      @click="cartCheckoutNotLoginPopupOpen = true" />
    <br />

    <ButtonComponent text="Subscribe Login Popup" variant="mediaBtn" @click="subscribeLoginPopupOpen = true" />
    <br />

    <ButtonComponent text="Subscribe Not Login Popup" variant="mediaBtn" @click="subscribeNotLoginPopupOpen = true" />
    <br />

    <ButtonComponent text="Subscribe update Login Popup" variant="mediaBtn"
      @click="subscribeUpdateLoginPopupOpen = true" />

    <br />

    <ButtonComponent text="Purchase Tip Popup" variant="mediaBtn" @click="purchaseTipPopupOpen = true" />

    <br />

    <ButtonComponent text="Purchase Flow Subscription Popup" variant="mediaBtn"
      @click="purchaseFlowSubscriptionPopupOpen = true" />

    <br />

    <ButtonComponent text="Guest Purchase Flow Popup" variant="mediaBtn" @click="guestPurchaseFlowPopupOpen = true" />

    <br />

    <ButtonComponent text="Upgrade Tier Popup" variant="mediaBtn" @click="upgradeTierPopupOpen = true" />

    <br />

    <div class="flex gap-8 mb-4">
      <ButtonComponent text="1on1 Booking FlowPopup open" variant="mediaBtn" @click="oneOnOneBookingFlowPopupOpen = true" />
      <div class="flex gap-2 mb-4">
        <button
          class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
          @click="openOneOnOneBookingFlowForFan(2615)"
        >
          Test with Unlimited Tokens
        </button>

        <button
          class="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
          @click="openOneOnOneBookingFlowForFan(99999)"
        >
          Test with Zero Tokens
        </button>

        <button
          class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="isClearingAllData"
          @click="handleClearAllData"
        >
          {{ isClearingAllData ? "Clearing data..." : "Clear all data" }}
        </button>
      </div>
    </div>

    <br />

    <ButtonComponent text="Ticket Event Popup Open" variant="mediaBtn" @click="ticketEventPopupOpen = true" />

    <br />

    <ButtonComponent text="Crowd Funding Event Popup" variant="mediaBtn" @click="crowdFundingEventPopupOpen = true" />

    <br />

    <ButtonComponent text="Tip Popup" variant="mediaBtn" @click="tipPopupOpen = true" />

    <br />

    <ButtonComponent text="Profile Login Popup" variant="mediaBtn" @click="profileLoginPopupOpen = true" />

    <br />

    <ButtonComponent text="Profile Merch Popup" variant="mediaBtn" @click="profileMerchPopupOpen = true" />

    <br />

    <ButtonComponent text="Top Up Popup" variant="mediaBtn" @click="topUpPopupOpen = true" />

    <br />

    <UploadingProgressBar :progress="uploadPercentage" imageSrc="https://i.ibb.co.com/Kx9QDc68/auth-bg-compressed.webp"
      label="Uploading..." />
    <br />
    <AvatarMenu />

    <br />
    <div class="flex flex-col items-center gap-6 md:gap-8">
      <TierCard v-for="tier in tierData" :key="tier.id" :tier="tier" />
    </div>
    <br />

    <br />

    <div class="flex flex-wrap gap-8">
      <EventCard theme="orange" :hasButton="true" />
      <EventCard theme="orange" :hasButton="false" />
      <EventCard theme="pink" :hasButton="true" />
      <EventCard theme="pink" :hasButton="false" />
    </div>

    <br>


    <ProfileMerchPopup />


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
    <PurchaseTipFlowPopup v-model="purchaseTipPopupOpen" />
    <PurchaseFlowSubscriptionOrderPopup v-model="purchaseFlowSubscriptionPopupOpen" />
    <GuestPurchaseFlowPopup v-model="guestPurchaseFlowPopupOpen" />
    <UpgradeTierPopup v-model="upgradeTierPopupOpen" />
    <OneOnOneBookingFlowPopup
      v-model="oneOnOneBookingFlowPopupOpen"
      :creator-id="demoCreatorId"
      :fan-id="selectedFanId"
    />
    <TicketEventPopup v-model="ticketEventPopupOpen" />
    <CrowdFundingEventPopup v-model="crowdFundingEventPopupOpen" />
    <TipPopup v-model="tipPopupOpen" />
    <ProfileLoginPopup v-model="profileLoginPopupOpen" />
    <ProfileMerchPopup v-model="profileMerchPopupOpen" />
    <TopUpPopup v-model="topUpPopupOpen" />
    <EventDetailsFan v-model="eventDetailsFanOpen" />
    <AcceptNewPrice v-model="acceptNewPriceOpen" />

    <PremiumOrdersPage/>
  </DashboardWrapperTwoColContainer>
</template>

<script setup>
import DashboardWrapperTwoColContainer from "@/components/dashboard/DashboardWrapperTwoColContainer.vue";
import ButtonComponent from "@/components/dev/button/ButtonComponent.vue";
import ButtonBase from "@/components/dev/button/ButtonBase.vue";
import LoadingTest from "@/components/LoadingTest.vue";
import Cookies from "@/components/ui/badge/dashboard/Cookies.vue";
import Cart from "@/components/ui/Cart.vue";
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
import PurchaseTipFlowPopup from "@/components/checkout/purchase/PurchaseTipFlowPopup.vue";
import PurchaseFlowSubscriptionOrderPopup from "@/components/checkout/purchase/PurchaseFlowSubscriptionOrderPopup.vue";
import GuestPurchaseFlowPopup from "@/components/checkout/purchase/GuestPurchaseFlowPopup.vue";
import UpgradeTierPopup from "@/components/checkout/purchase/UpgradeTierPopup.vue";
import TierCard from "@/components/ui/card/dashboard/TierCard.vue";
import { tierData } from "/public/data/TierData.js";
// import LatestEventCard from "@/components/ui/card/dashboard/LatestEventCard.vue";
import DashboardEventStaticPopup from "@/components/calendar/DashboardEventStaticPopup.vue";
import AdjustEventDetailsPopup from "@/components/calendar/AdjustEventDetailsPopup.vue";
import AdjustCostBooking from "@/components/calendar/AdjustCostBooking.vue";
import ChatSection from "@/components/calendar/ChatSection.vue"
import CallSoonChat from "@/components/calendar/CallSoonChat.vue";
import AskForMoreTime from "@/components/calendar/AskForMoreTime.vue";
import AskToSchedule from "@/components/calendar/AskToSchedule.vue";
import NewChatPopup from "@/components/calendar/NewChatPopup.vue";
import NewMessage from "@/components/calendar/NewMessage.vue";
import EventCard from "@/components/ui/card/dashboard/EventCard.vue";
import CheckboxGroup from "@/components/ui/form/checkbox/CheckboxGroup.vue";
import OneOnOneBookingFlowPopup from "@/components/FanBookingFlow/OneOnOneBookingFlow/OneOnOneBookingFlowPopup.vue";
import TicketEventPopup from "@/components/FanBookingFlow/GroupEventFlow/TicketEventPopup/TicketEventPopup.vue";
import CrowdFundingEventPopup from "@/components/FanBookingFlow/GroupEventFlow/CrowdFundingEventPopup/CrowdFundingEventPopup.vue";
import TipPopup from "@/templates/profileAbdullah/popups/TipPopup.vue";
import ProfileLoginPopup from "@/templates/profileAbdullah/popups/ProfileLoginPopup.vue";
import ProfileMerchPopup from "@/templates/profileAbdullah/popups/ProfileMerchPopup.vue";
import TopUpPopup from "@/templates/profileAbdullah/popups/TopUpPopup.vue";
import EventDetailsFan from "@/components/ui/popup/EventDetailsFan.vue";
import AcceptNewPrice from "@/components/ui/popup/AcceptNewPrice.vue";
import TwitterRepostSettings from "@/components/ui/popup/TwitterRepostSettings.vue";
import { showToast } from "@/utils/toastBus.js";
import PremiumOrdersPage from "../agent/PremiumOrdersPage.vue";

import {
  bookingFlowTruckIcon,
  bookingFlowLightningIcon,
} from '@/components/FanBookingFlow/OneOnOneBookingFlow/oneOnOneBookingFlowAssets.js';

const demoUserId = ref(localStorage.getItem("userId") || "");
const demoIsCreator = ref(localStorage.getItem("isCreator") === "true");

function saveToLocalStorage() {
  if (!demoUserId.value) {
    showToast({ type: "error", title: "Missing ID", message: "User ID is required." });
    return;
  }
  localStorage.setItem("userId", demoUserId.value);
  localStorage.setItem("isCreator", demoIsCreator.value);
  showToast({ type: "success", title: "Saved", message: "Saved to localStorage." });
}

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
const purchaseTipPopupOpen = ref(false);
const purchaseFlowSubscriptionPopupOpen = ref(false);
const guestPurchaseFlowPopupOpen = ref(false);
const upgradeTierPopupOpen = ref(false);
const oneOnOneBookingFlowPopupOpen = ref(false);
const demoCreatorId = 1407;
const selectedFanId = ref(2615);
const ticketEventPopupOpen = ref(false);
const crowdFundingEventPopupOpen = ref(false);
const tipPopupOpen = ref(false);
const profileLoginPopupOpen = ref(false);
const profileMerchPopupOpen = ref(false);
const topUpPopupOpen = ref(false);
const eventDetailsFanOpen = ref(false);
const acceptNewPriceOpen = ref(false);
const isClearingAllData = ref(false);
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const handleImageSave = (data) => {
  console.log("Cropped Data Received:", data);
};
const uploadPercentage = ref(0);

function openOneOnOneBookingFlowForFan(fanId) {
  selectedFanId.value = fanId;
  oneOnOneBookingFlowPopupOpen.value = true;
}

async function handleClearAllData() {
  if (isClearingAllData.value) return;

  const confirmed = window.confirm("This will permanently delete all events and bookings. Are you sure?");
  if (!confirmed) return;

  const token = window.prompt("Enter JWT master key");
  if (token == null) return;

  const trimmedToken = String(token || "").trim();
  if (!trimmedToken) {
    showToast({
      type: "error",
      title: "Missing Token",
      message: "A bearer token is required to clear all data.",
    });
    return;
  }

  isClearingAllData.value = true;

  try {
    const response = await fetch(`${apiBaseUrl}/bookings/admin/clear-data`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${trimmedToken}`,
      },
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.ok === false) {
      throw new Error(payload?.message || payload?.error || "Could not clear data.");
    }

    showToast({
      type: "success",
      title: "Data Cleared",
      message: `Deleted ${Number(payload?.bookingsDeleted || 0)} bookings and ${Number(payload?.eventsDeleted || 0)} events.`,
    });
  } catch (error) {
    showToast({
      type: "error",
      title: "Clear Failed",
      message: error?.message || "Could not clear data.",
    });
  } finally {
    isClearingAllData.value = false;
  }
}

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
