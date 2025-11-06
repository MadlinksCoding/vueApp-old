<script setup>
import ButtonComponent from "@/components/dev/button/ButtonComponent.vue";
import NotificationCard from "@/components/dev/card/notification/NotificationCard.vue";
import SubscriptionCard from "@/components/dev/card/subscription/SubscriptionCard.vue";
import Checkbox from "@/components/dev/checkbox/Checkbox.vue";
import CheckboxOption from "@/components/dev/checkbox/CheckboxOption.vue";
import CheckboxSwitch from "@/components/dev/checkbox/CheckboxSwitch.vue";
import InputComponentCheckbox from "@/components/dev/checkbox/InputComponentCheckbox.vue";
import Heading from "@/components/dev/default/Heading.vue";
import Paragraph from "@/components/dev/default/Paragraph.vue";
import BaseInput from "@/components/dev/input/BaseInput.vue";
import Input from "@/components/dev/input/Input.vue";
import InputAuthComponent from "@/components/dev/input/InputAuthComponent.vue";
import CheckboxGroup from "@/components/ui/form/checkbox/CheckboxGroup.vue";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/vue/24/solid";
import {
  PaperClipIcon,
  EnvelopeIcon,
  EyeIcon,
  InformationCircleIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/vue/24/outline";
import { ref } from "vue";
import CloudflareSuccess from "@/components/ui/badge/dashboard/CloudflareSuccess.vue";
import FeedMediaCard from "@/components/ui/card/dashboard/FeedMediaCard.vue";
import checkoutHeader from "/images/checkout-header.webp";
import sampleBg from "/images/slide-2.webp";
import FeedPollCard from "@/components/ui/card/dashboard/FeedPollCard.vue";
import MerchCard from "@/components/ui/card/dashboard/MerchCard.vue";
import PlayMediaCards from "@/components/ui/card/dashboard/PlayMediaCards.vue";
import AvatarProfilePopup from "@/components/ui/popup/AvatarProfilePopup.vue";
import RadioGroup from "@/components/dev/RadioGroup.vue";
import DefaultDahboardDrowpdown from "@/components/ui/popup/dropdown/dashboard/DefaultDahboardDrowpdown.vue";
import CustomeThemeSelect from "@/components/ui/popup/dropdown/dashboard/customThemeSelect/CustomeThemeSelect.vue";

const selectedFeatures = ref([]);
const transferType = ref("subscription");
const transferTypeOptions = [
  { value: "choice-a", label: "Choice A" },
  { value: "choice-b", label: "Choice B" },
  { value: "choice-c", label: "Choice C" },
];
const featureOptions = [
  {
    value: "free-plan",
    label: "Free Plan",
    tags: [{ text: "Published Tier", variant: "#d1e0ff" }],
  },
  {
    value: "free-plan-again",
    label: "Free Plan",
    tags: [{ text: "Draft", variant: "" }],
  },
  {
    value: "verified",
    label:
      "I have verified, preserved and currently hold all identification cards and documents required under Record Keeping Requirements, 18 U.S.C. 2257 and 28 C.F.R. 75, or applicable laws in any other jurisdictions, countries, and territories ('2257 documentation'), for all individuals appearing in the Content.",
  },
];

const myMediaData = ref([
  {
    image: "/images/slide-1.webp",
    alt: "Video 1",
    duration: "14:09",
    timeAgo: "2h ago",
    likes: "0",
    views: "0",
    video:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    title: "Building successful teams through collaboration",
  },
  {
    image: "/images/slide-2.webp",
    alt: "Video 2",
    duration: "14:09",
    timeAgo: "2h ago",
    likes: "0",
    views: "0",
    video:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    title: "Building successful teams through collaboration",
  },
  {
    image: "/images/slide-3.webp",
    alt: "Video 3",
    duration: "14:09",
    timeAgo: "2h ago",
    likes: "0",
    views: "0",
    video:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    title: "Building successful teams through collaboration",
  },
]);

const isProfileOpenLeft = ref(false);
const isProfileOpenRight = ref(false);

const leftConfig = {
  actionType: "slidein",
  from: "left",
  offset: "0px",
  speed: "250ms",
  effect: "ease-in-out",
  showOverlay: false,
  closeOnOutside: true,
  lockScroll: false,
  escToClose: true,
  width: { default: "550px", "<640": "100%" },
  height: "100%",
  scrollable: true,
  closeSpeed: "250ms",
  closeEffect: "cubic-bezier(0.4, 0, 0.2, 1)",
};

const rightConfig = {
  actionType: "slidein",
  from: "right",
  offset: "-80px",
  speed: "250ms",
  effect: "ease-in-out",
  showOverlay: false,
  closeOnOutside: true,
  lockScroll: false,
  escToClose: true,
  width: { default: "550px", "<640": "100%" },
  height: "100%",
  scrollable: true,
  closeSpeed: "250ms",
  closeEffect: "cubic-bezier(0.4, 0, 0.2, 1)",
};
</script>

<template>
  <div class="flex flex-col gap-4 px-4 py-6">
    <Heading text="BUTTON COMPONENTS" tag="h2" theme="demoHeadings" />

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

    <ButtonComponent
      text="PUBLISH SCHEDULE"
      btnText="black"
      variant="warning"
      :leftIcon="'https://i.ibb.co/S74jfvBw/Icon-1.png'"
      :leftIconClass="`
  w-6 h-6 transition duration-200
  filter brightness-0
  group-hover:[filter:brightness(0)_saturate(100%)_invert(75%)_sepia(23%)_saturate(7280%)_hue-rotate(93deg)_brightness(109%)_contrast(95%)]
`"
    />

    <ButtonComponent
      text="PUBLISH SCHEDULE"
      btnText="black"
      variant="polygonLeft"
      :leftIcon="'https://i.ibb.co/S74jfvBw/Icon-1.png'"
      :leftIconClass="`
  w-6 h-6 transition duration-200
  filter brightness-0
  group-hover:[filter:brightness(0)_saturate(100%)_invert(75%)_sepia(23%)_saturate(7280%)_hue-rotate(93deg)_brightness(109%)_contrast(95%)]
`"
    />
  </div>

  <div class="flex flex-col gap-4 px-4 py-6">
    <Heading
      text="NOTIFICATION CARD COMPONENTS"
      tag="h2"
      theme="demoHeadings"
    />

    <!-- Notice with link and close -->
    <NotificationCard
      variant="notice"
      title="You have 3 active subscriber in this tier"
      description="Changing detail of this plan might affect current subscriber's subscription fee and benefits."
      linkLabel="Learn more"
      linkHref="#"
    />

    <!-- Alert without icon -->
    <NotificationCard
      variant="alert"
      :showIcon="false"
      title="You have 3 active subscriber in this tier"
      description="Changing detail of this plan might affect current subscriber's subscription fee and benefits."
    />

    <!-- Success with external icon -->
    <NotificationCard
      variant="success"
      :icon="CheckCircleIcon"
      title="Action completed successfully"
      description="All systems are now up and running."
    />

    <!-- Error controlled with toggle -->
    <NotificationCard
      variant="error"
      title="Payment failed"
      description="Please update your billing information to continue."
    />

    <!-- Info minimal -->
    <NotificationCard
      variant="info"
      title="Heads up"
      description="We updated our terms of service."
    />

    <!-- Warning long message -->
    <NotificationCard
      variant="warning"
      :icon="ExclamationTriangleIcon"
      description="WARNING: Uploading (or attempting to upload) content that violates any laws or criminal laws (ex: child pornography or non-consensual content), our Child Sexual Abuse Material Policy or Anti-Sexual Exploitation Policies, will result in related accounts to be immediately terminated and reported to law enforcement authorities."
    />
  </div>

  <div class="flex flex-col gap-4 px-4 py-6">
    <Heading
      text="SUBSCRIPTION CARDS COMPONENTS"
      tag="h2"
      theme="demoHeadings"
    />

    <div class="flex flex-wrap gap-6">
      <!-- Gold Tier Card -->
      <SubscriptionCard
        title="Gold Tier"
        :price="1"
        currency="USD$"
        description="This is the gold tier. Better perks than the silver tier and definitely the free subscriptions. Golden plan."
        :stats="{ videos: 3, photos: 6, other: 2 }"
        :benefits="[
          { highlight: '5 free tokens', text: ' per month' },
          { highlight: '11% off', text: ' on all Merchandise' },
          { highlight: '11% off', text: ' on all Pay to View videos' },
          { highlight: '12% off', text: ' on all Custom Request' },
        ]"
        border-color="#07F468"
        accent-color="#07F468"
        background-color="#064e3b"
        hover-accent-color="#101828"
        button-color="#07F468"
        @subscribe="handleSubscribe('Gold')"
      />

      <!-- Silver Tier Card (Featured) -->
      <SubscriptionCard
        title="Silver Tier"
        :price="100"
        currency="USD$"
        description="This is the silver tier. More perks than the free subscription. This is the silver tier. More perks than the free subscription."
        :stats="{ videos: 1, photos: 2, other: 0 }"
        :benefits="[
          {
            highlight: '3 free tokens',
            text: ' per month',
            highlightColor: '#4D20ff',
          },
          {
            highlight: '14% off',
            text: ' on all Merchandise',
            highlightColor: '#4D20ff',
          },
          {
            highlight: '10% off',
            text: ' on all Pay to View videos',
            highlightColor: '#4D20ff',
          },
          {
            highlight: '12% off',
            text: ' on all Custom Request',
            highlightColor: '#4D20ff',
          },
        ]"
        :is-featured="true"
        border-color="#4d20ff"
        accent-color="#4d20ff"
        background-image="https://i.ibb.co/3Yr4FQD2/1377790.png"
        button-text="No followers yet"
        button-variant="disabled"
        featured-text="FEATURED"
        button-color="#4d20ff"
      />

      <!-- Premium Card -->
      <SubscriptionCard
        title="Premium Tier"
        :price="250"
        currency="USD$"
        description="The ultimate premium experience with exclusive benefits and priority support."
        :stats="{ videos: 10, photos: 25, other: 5 }"
        :benefits="[
          { highlight: '15 free tokens', text: ' per month' },
          { highlight: '25% off', text: ' on all Merchandise' },
          { highlight: '20% off', text: ' on all Pay to View videos' },
          { highlight: '30% off', text: ' on all Custom Request' },
          { highlight: 'Priority support', text: ' 24/7' },
        ]"
        border-color="#f59e0b"
        accent-color="#f59e0b"
        hover-accent-color="#07F468"
        @subscribe="handleSubscribe('Premium')"
        button-color="#f59e0b"
        background-color=""
      />

      <!-- Basic Free Card -->
      <SubscriptionCard
        title="Free Tier"
        :price="0"
        currency="USD$"
        description="Start your journey with our free tier. Limited features but great for getting started."
        :stats="{ videos: 0, photos: 1, other: 0 }"
        :benefits="[
          { highlight: '1 free token', text: ' per month' },
          { highlight: '5% off', text: ' on first purchase' },
          { highlight: 'Basic support', text: ' via email' },
        ]"
        border-color="#6b7280"
        accent-color="#6b7280"
        @subscribe="handleSubscribe('Free')"
        button-color="#6b7280"
        background-color=""
      />

      <!-- VIP Card -->
      <SubscriptionCard
        title="VIP Tier"
        :price="500"
        currency="USD$"
        description="Exclusive VIP treatment with unlimited access and premium perks."
        :stats="{ videos: 50, photos: 100, other: 20 }"
        :benefits="[
          { highlight: 'Unlimited tokens', text: ' per month' },
          { highlight: '50% off', text: ' on all Merchandise' },
          { highlight: '40% off', text: ' on all Pay to View videos' },
          { highlight: '60% off', text: ' on all Custom Request' },
          { highlight: 'VIP support', text: ' with dedicated manager' },
        ]"
        :is-featured="true"
        border-color="#8b5cf6"
        accent-color="#8b5cf6"
        background-image="https://images.unsplash.com/photo-1557683316-973673baf926?w=400"
        featured-text="VIP"
        @subscribe="handleSubscribe('VIP')"
        button-color="#8b5cf6"
      />

      <!-- Sold Out Card -->
      <SubscriptionCard
        title="Limited Edition"
        :price="999"
        currency="USD$"
        description="Limited edition tier with exclusive content and benefits. Only available for a short time."
        :stats="{ videos: 20, photos: 50, other: 10 }"
        :benefits="[
          { highlight: '25 free tokens', text: ' per month' },
          { highlight: '35% off', text: ' on all Merchandise' },
          { highlight: '30% off', text: ' on all Pay to View videos' },
          { highlight: 'Exclusive content', text: ' access' },
        ]"
        border-color="#ef4444"
        accent-color="#ef4444"
        button-text="SOLD OUT"
        button-variant="disabled"
        :button-disabled="true"
        button-color="#6b7280"
        background-color=""
      />

      <!-- Coming Soon Card -->
      <SubscriptionCard
        title="Diamond Tier"
        :price="1000"
        currency="USD$"
        description="The most exclusive tier coming soon. Stay tuned for the ultimate experience."
        :stats="{ videos: 100, photos: 200, other: 50 }"
        :benefits="[
          { highlight: 'Unlimited everything', text: '' },
          { highlight: '70% off', text: ' on all services' },
          { highlight: 'Personal assistant', text: ' included' },
          { highlight: 'Exclusive events', text: ' access' },
        ]"
        border-color="#06b6d4"
        accent-color="#06b6d4"
        button-text="COMING SOON"
        button-variant="disabled"
        :button-disabled="true"
        button-color="#6b7280"
        background-color=""
      />
    </div>
  </div>

  <div class="flex flex-col gap-4 px-4 py-6">
    <Heading text="CHECKBOX COMPONENTS" tag="h2" theme="demoHeadings" />
    <CheckboxGroup
      label="By signing up you agree to our Terms of Service"
      checkboxClass="m-0 border border-checkboxBorder [appearance:none] w-[0.75rem] h-[0.75rem] rounded-[2px] bg-transparent relative cursor-pointer checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.2rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45 "
      labelClass="text-[12px] sm:text-[14px] text-black cursor-pointer "
      wrapperClass="flex items-center gap-2"
    />

    <CheckboxGroup
      label="hello remember me"
      labelClass="text-[12px] sm:text-[14px] text-black cursor-pointer "
      wrapperClass="flex items-center gap-2"
    />

    <InputComponentCheckbox
      v-model="selectedFeatures"
      type="checkbox"
      name="features"
      label="Checkbox Options"
    >
      <CheckboxOption
        v-for="option in featureOptions"
        :key="option.value"
        :id="`feature-${option.value}`"
        :value="option.value"
        :label="option.label"
        :tags="option.tags"
      />
    </InputComponentCheckbox>

    <CheckboxSwitch
      label="Toggle Dark mode"
      version="dashboard"
      showWrapperLabel
    />
  </div>

  <div class="flex flex-col gap-4 px-4 py-6">
    <Heading text="PARAGRAPH COMPONENTS" tag="h2" theme="demoHeadings" />

    <Paragraph
      text="We use cookies to analyze website traffic "
      font-size="text-base"
      font-weight="font-[400]"
      font-color="text-black"
    />
    <Paragraph
      text="We use cookies to analyze website traffic "
      font-size="text-[30px]"
      font-weight="font-[400]"
      font-color="text-[red]"
    />
    <Paragraph
      text="We use cookies to analyze website traffic "
      font-size="text-[30px]"
      font-weight="font-[700]"
      font-color="text-[green]"
    />
  </div>

  <div class="flex flex-col gap-4 px-4 py-6">
    <Heading text="INPUT COMPONENTS" tag="h2" theme="demoHeadings" />

    <BaseInput
      type="text"
      placeholder="Enter text"
      inputClass="bg-white/50 w-full px-3 py-3 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300"
    />

    <!-- input-wrapper (Role) -->
    <InputAuthComponent
      placeholder="Select your role"
      id="role"
      show-label
      label-text="Role"
      :required-display="['required-text-error']"
      required
      type="text"
      label-class="text-[#000]"
    />

    <!-- input-wrapper (username) -->
    <InputAuthComponent
      placeholder="Username"
      id="Username"
      show-label
      label-text="Username"
      label-class="text-[#000]"
      required
      :required-display="['italic-text', 'required-text-error']"
      type="text"
      right-icon="https://i.ibb.co/xSCKFrhW/svgviewer-png-output-82.webp"
      :show-errors="true"
      :errors="[
        {
          error: 'Must be between 3 and 100 characters long',
          icon: InformationCircleIcon,
        },
        {
          error: 'Can contain any letters from a-z, any numbers from 0-9',
          icon: InformationCircleIcon,
        },
        {
          error: 'Cannot contain space',
          icon: InformationCircleIcon,
        },
      ]"
      :on-success="true"
      :success="[
        {
          message: 'Must be between 3 and 100 characters long',
          icon: CheckIcon,
          textColor: 'text-[#07f468]', // optional
          iconColor: 'text-[#07f468]',
        },
        {
          message: 'Can contain any letters from a-z, any numbers from 0-9.',
          icon: CheckIcon,
          textColor: 'text-[#07f468]', // optional
          iconColor: 'text-[#07f468]',
        },
        {
          message: 'Cannot contain space.',
          icon: CheckIcon,
          textColor: 'text-[#07f468]', // optional
          iconColor: 'text-[#07f468]',
        },
        {
          message: 'Good news! Username \'hgfu\' is available!',
          icon: CheckCircleIcon,
          textColor: 'text-[#07f468]', // optional
          iconColor: 'text-[#07f468]',
        },
      ]"
    />
    <!--  -->
    <!-- input-wrapper (display name) -->
    <InputAuthComponent
      label-class="text-[#000]"
      placeholder="Display name"
      id="name"
      show-label
      label-text="Display name"
      required
      :required-display="['italic-text', 'required-text-error']"
      type="text"
      right-icon="https://i.ibb.co/xSCKFrhW/svgviewer-png-output-82.webp"
      :show-errors="true"
      :errors="[
        {
          error:
            'Can contain any letters from a-z, any numbers from 0-9, and some special characters (!@#$%^&*()_-).',
          icon: InformationCircleIcon,
        },
        {
          error:
            'Display name must be more than 6 and less than or equal to 20 characters.',
          icon: InformationCircleIcon,
        },
      ]"
      :on-success="true"
      :success="[
        {
          message:
            'Can contain any letters from a-z, any numbers from 0-9, and some special characters (!@#$%^&*()_-).',
          icon: CheckIcon,
          textColor: 'text-[#07f468]', // optional
          iconColor: 'text-[#07f468]',
        },
        {
          message:
            'Display name must be more than 6 and less than or equal to 20 characters.',
          icon: CheckIcon,
          textColor: 'text-[#07f468]', // optional
          iconColor: 'text-[#07f468]',
        },
      ]"
    />
  </div>

  <div class="flex flex-col gap-4 px-4 py-6">
    <Heading text="RADIO COMPONENT" tag="h2" theme="demoHeadings" />

    <RadioGroup
      v-model="transferType"
      name="subscription"
      label="Subscription Tier"
      :options="transferTypeOptions"
      version="dashboard"
    />

    <Heading text="CLOUDFLARE COMPONENT" tag="h2" theme="demoHeadings" />

    <CloudflareSuccess />
  </div>

  <div class="flex flex-col gap-4 px-4 py-6">
    <Heading text="CARDS COMPONENTS" tag="h2" theme="demoHeadings" />

    <div
      class="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:max-w-[62.9375rem]"
    >
      <FeedPollCard
        day="31"
        suffix="st"
        title="What Should I eat for tonight’s live stream?"
        :options="[
          { label: 'Orange', percent: 70, votes: 25, checked: true },
          { label: 'Apple', percent: 20, votes: 25 },
          { label: 'Chicken', percent: 10, votes: 25 },
        ]"
        :totalVotes="400"
        timeLeft="24 hours left to vote"
      />

      <FeedMediaCard
        day="31"
        suffix="st"
        description="Jenny is back! Tonight I will eat mostly fruits. -> 8pm EST time 👅!"
        :likes="205"
        :comments="16"
        :bgImage="checkoutHeader"
        :hoverBg="sampleBg"
      />

      <MerchCard
        bgImage="/images/checkout-header.webp"
        title="My top (washed) Get Jenny’s favourite Mangoes!"
        currency="USD"
        price="$25"
        finalPrice="$25"
        description="Get Jenny’s favourite Mangoes! Buy them while supply last !Get Jenny’s favourite Mangoes! Buy them while supply last !Get Jenny’s favourite Mangoes! Buy them while supply last !"
        overlayBg="linear-gradient(0deg, rgba(255,255,255,0.68) -3.06%, rgba(255,255,255,0) 144.5%), linear-gradient(0deg, rgba(0,0,0,0.1), rgba(0,0,0,0.1))"
        overlayHoverBg="linear-gradient(0deg, rgba(255,255,255,0.9) -3.06%, rgba(255,255,255,0) 144.5%), linear-gradient(0deg, rgba(0,0,0,0.25), rgba(0,0,0,0.25))"
      />

      <MerchCard
        bgImage="/images/checkout-header.webp"
        title="My top (washed) Get Jenny’s favourite Mangoes!"
        currency="USD"
        price="$25"
        finalPrice="$25"
        discountText="10% OFF"
        description="Get Jenny’s favourite Mangoes! Buy them while supply last !Get Jenny’s favourite Mangoes! Buy them while supply last !Get Jenny’s favourite Mangoes! Buy them while supply last !"
        overlayBg="linear-gradient(0deg, rgba(255,205,41,0.68) -3.06%, rgba(255,205,41,0) 117.35%), linear-gradient(0deg, rgba(0,0,0,0.1), rgba(0,0,0,0.1))"
        overlayHoverBg="linear-gradient(0deg, rgba(255,205,41,0.9) -3.06%, rgba(255,205,41,0) 117.35%), linear-gradient(0deg, rgba(0,0,0,0.25), rgba(0,0,0,0.25))"
      />
    </div>

    <PlayMediaCards :mediaList="myMediaData" />
  </div>

  <div class="flex flex-col gap-4 px-4 py-6">
    <Heading text="POPUPS COMPONENT" tag="h2" theme="demoHeadings" />

    <button
      class="px-4 py-2 bg-blue-500 text-white rounded w-[max-content]"
      @click="isProfileOpenLeft = true"
    >
      Open profile popup from left
    </button>

    <AvatarProfilePopup :config="leftConfig" v-model="isProfileOpenLeft" />

    <button
      class="px-4 py-2 bg-blue-500 text-white rounded w-[max-content]"
      @click="isProfileOpenRight = true"
    >
      Open profile popup from right
    </button>

    <AvatarProfilePopup :config="rightConfig" v-model="isProfileOpenRight" />
  </div>

  <div class="flex flex-col gap-4 px-4 py-6">
    <Heading text="DROPDOWN COMPONENT" tag="h2" theme="demoHeadings" />

    <DefaultDahboardDrowpdown />
<br>
<br>
    <CustomeThemeSelect />
  </div>

</template>
