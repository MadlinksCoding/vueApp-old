<template>
  <div class="px-[24px] py-[14px] relative">
    <div
      @click="uploader.goToStep(1, { intent: 'user' })"
      class="flex gap-2 items-center cursor-pointer"
    >
      <img src="/images/backIcon.png" alt="" srcset="" />
      <button
        class="text-xs font-medium leading-[1.125rem] text-medium-text break-words"
      >
        Back
      </button>
    </div>

    <div class="mb-4 mt-2">
      <h4
        class="text-[#667085] text-sm font-[700] leading-normal not-italic py-[8px]"
      >
        Subscription Settings
      </h4>

      <div class="flex justify-between items-center">
        <div>
          <CheckboxSwitch
            label="Link this media to subscription plan"
            id="show-preview-toggle"
          />
        </div>

        <ButtonComponent
          text="Add Tier"
          variant="polygonLeft"
          customClass="gap-[2px] text-sm"
          :leftIcon="'https://i.ibb.co/N2xH2QVV/svgviewer-png-output-13.webp'"
          :leftIconClass="`
    w-6 h-6
    transition duration-200
    group-hover:filter-none [filter:brightness(0)_saturate(100%)_invert(75%)_sepia(23%)_saturate(7280%)_hue-rotate(93deg)_brightness(109%)_contrast(95%)]
  `"
          btnBg="#000"
          btnHoverBg="#07f468"
          btnText="#07f468"
          btnHoverText="#000"
        />
      </div>

      <div class="flex gap-6 mt-4">
        <!-- Column 1 -->
        <div class="flex flex-col gap-2">
          <CheckboxGroup
            v-for="(item, index) in column1"
            :key="index"
            :label="item.label"
            checkboxClass="appearance-none bg-white border border-gray-300 rounded-[4px] w-4 h-4 cursor-pointer checked:bg-success checked:border-success checked:relative checked:after:content-[''] checked:after:absolute checked:after:left-[0.3rem] checked:after:top-[0.15rem] checked:after:w-1 checked:after:h-2 checked:after:border-black checked:after:border-[2px] checked:after:border-solid checked:after:border-t-0 checked:after:border-l-0 checked:after:rotate-45 checked:after:box-border"
            labelClass="text-[14px] text-[#0C111D] font-[400] cursor-pointer truncate whitespace-nowrap overflow-hidden max-w-[400px]"
            wrapperClass="flex items-center"
          />
        </div>

        <!-- Column 2 -->
        <div class="flex flex-col gap-2">
          <CheckboxGroup
            v-for="(item, index) in column2"
            :key="index"
            :label="item.label"
            checkboxClass="appearance-none bg-white border border-gray-300 rounded-[4px] w-4 h-4 cursor-pointer checked:bg-success checked:border-success checked:relative checked:after:content-[''] checked:after:absolute checked:after:left-[0.3rem] checked:after:top-[0.15rem] checked:after:w-1 checked:after:h-2 checked:after:border-black checked:after:border-[2px] checked:after:border-solid checked:after:border-t-0 checked:after:border-l-0 checked:after:rotate-45 checked:after:box-border"
            labelClass="text-[14px] text-[#0C111D] font-[400] cursor-pointer truncate whitespace-nowrap overflow-hidden max-w-[300px]"
            wrapperClass="flex items-center"
          />
        </div>
      </div>
    </div>

    <div class="mb-4 mt-8">
      <h4
        class="text-[#667085] text-sm font-[700] leading-normal not-italic py-[8px]"
      >
        Pay to View Settings
      </h4>
      <CheckboxSwitch
        label="Make this media available for pay to view"
        id="show-preview-toggle"
      />

      <div class="flex justify-between items-center mt-4 gap-4">
        <div class="flex-1">
          <InputComponentDashbaord
            id="input_f"
            type="number"
            show-label
            v-model="name"
            label-text="Original Price"
            leftSpan
            leftSpanText="USD$"
            description="Price must be between USD$ 1.95 to 500."
          />
        </div>
        <div class="flex-1">
          <InputComponentDashbaord
            id="input_f"
            type="number"
            show-label
            v-model="name"
            label-text="Discounted Price (optional)"
            leftSpan
            leftSpanText="USD$"
            description="Leave blank to disable discount display."
            label-class="text-lg text-[red]"
            description-class="text-xs text-blue-500"
          />
        </div>
      </div>
    </div>

    <div class="mb-[50px] mt-8 flex flex-col gap-4">
      <h4 class="text-[#667085] text-sm font-[700] leading-normal not-italic">
        Display this media on:
      </h4>

      <CheckboxGroup
        label="Discovery Page"
        checkboxClass="appearance-none bg-white border border-gray-300 rounded-[4px] w-4 h-4 cursor-pointer checked:bg-success checked:border-success checked:relative checked:after:content-[''] checked:after:absolute checked:after:left-[0.3rem] checked:after:top-[0.15rem] checked:after:w-1 checked:after:h-2 checked:after:border-black checked:after:border-[2px] checked:after:border-solid checked:after:border-t-0 checked:after:border-l-0 checked:after:rotate-45 checked:after:box-border "
        labelClass="text-[16px] text-[#0C111D] font-[600] cursor-pointer "
        wrapperClass="flex items-center"
      />

      <CheckboxGroup
        label="My Profile Page"
        checkboxClass="appearance-none bg-white border border-gray-300 rounded-[4px] w-4 h-4 cursor-pointer checked:bg-success checked:border-success checked:relative checked:after:content-[''] checked:after:absolute checked:after:left-[0.3rem] checked:after:top-[0.15rem] checked:after:w-1 checked:after:h-2 checked:after:border-black checked:after:border-[2px] checked:after:border-solid checked:after:border-t-0 checked:after:border-l-0 checked:after:rotate-45 checked:after:box-border "
        labelClass="text-[16px] text-[#0C111D] font-[600] cursor-pointer "
        wrapperClass="flex items-center"
      />
    </div>

    <!-- next Navigation -->
    <div
      class="absolute bottom-0 right-0"
      @click="uploader.goToStep(3, { intent: 'user' })"
    >
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
    </div>
  </div>
</template>

<script>
import ButtonComponent from "@/components/dev/button/ButtonComponent.vue";
import CheckboxSwitch from "@/components/dev/checkbox/CheckboxSwitch.vue";
import CheckboxGroup from "@/components/ui/form/checkbox/CheckboxGroup.vue";
import InputComponentDashbaord from "../../../../../components/dev/input/InputComponentDashboard.vue";

export default {
  name: "MediaUploaderStepSubscriptionP2v",
  props: {
    uploader: {
      type: Object,
      required: true,
    },
  },
  components: {
    CheckboxSwitch,
    CheckboxGroup,
    ButtonComponent,
    InputComponentDashbaord,
  },
  data() {
    const allCheckboxes = [
      {
        label:
          "FREE library of LOREM LPSUM ATIER dolor sit amet, consectetur adipiscing elit.",
      },
      {
        label:
          "Amazing library of LOREM LPSUM ATIER dolor sit amet, consectetur adipiscing elit.",
      },
      {
        label:
          "Complete library of LOREM LPSUM ATIER dolor sit amet, consectetur adipiscing elit.",
      },
      {
        label:
          "Featured library of LOREM LPSUM ATIER dolor sit amet, consectetur adipiscing elit.",
      },
      {
        label:
          "Basic library of LOREM LPSUM ATIER dolor sit amet, consectetur adipiscing elit.",
      },
      {
        label:
          "Premium library of LOREM LPSUM ATIER dolor sit amet, consectetur adipiscing elit.",
      },
      {
        label:
          "NSFW library of LOREM LPSUM ATIER dolor sit amet, consectetur adipiscing elit.",
      },
    ];
    return {
      column1: allCheckboxes.slice(0, 4),
      column2: allCheckboxes.slice(4),
    };
  },
};
</script>
