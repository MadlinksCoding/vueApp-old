<template>
  <div class="relative md:py-[16px] md:px-[10px] lg:px-[24px]">
    <div
      @click="uploader.goToStep(2, { intent: 'user' })"
      class="flex gap-2 items-center py-[16px]"
    >
      <img src="/images/backIcon.png" alt="" srcset="" />
      <button
        class="text-xs font-medium leading-[1.125rem] text-medium-text break-words"
      >
        Back
      </button>
    </div>

    <div class="flex flex-col gap-6 mt-4 mb-[50px]">
      <BaseInput
        type="text"
        placeholder="Video Title (Optional)"
        inputClass="bg-white/50 w-full px-3 py-3 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300"
      />

      <InputComponentDashbaord
        id="input_g"
        type="textarea"
        show-label
        v-model="name"
        textAreaRows="3"
        label-text=""
        placeholder="Description (Optional)"
        description="0/200 characters"
      />
     

      <ReusableSearchInput
        title="Tags"
        subtitle="Add maximum of 10 tags to your media."
        placeholder="Search Tags..."
        type="tags"
        :results="tagsList"
        :history-tags="historyTags"
        v-model="selectedTags"
        :max-items="10"
        :show-language-icon="true"
        @search="handleTagSearch"
        @manage-tags="openManageTags"
      />
      <ReusableSearchInput
        title="Co-performer"
        subtitle="If this media includes other performers, please tag them below."
        placeholder="Jelly"
        type="performer"
        :results="performersList"
        v-model="selectedPerformers"
        :max-items="5"
        @search="handlePerformerSearch"
      />
    </div>

    <!-- next Navigation -->
    <div
      class="flex justify-end md:mt-0 mt-4"
      @click="uploader.goToStep(4, { intent: 'user' })"
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

<script setup>
import { ref } from "vue";
import { MagnifyingGlassIcon } from "@heroicons/vue/24/outline";
import ButtonComponent from "@/components/dev/button/ButtonComponent.vue";
import BaseInput from "@/components/dev/input/BaseInput.vue";
import InputComponentDashbaord from "../../../../../components/dev/input/InputComponentDashboard.vue";
import ReusableSearchInput from "./HelperComponents/ReusableSearchInput.vue";

// Props
defineProps({
  uploader: {
    type: Object,
    required: true,
  },
});

// TAGS
const selectedTags = ref([]);

// History tags (recently used)
const historyTags = ref([
  { id: "h1", name: "Bluebettle" },
  { id: "h2", name: "dhdt" },
  { id: "h3", name: "Hello" },
]);

// All available tags
const tagsList = ref([
  { id: 1, name: "Apple" },
  { id: 2, name: "April" },
  { id: 3, name: "Apricote" },
  { id: 4, name: "Big smile" },
  { id: 5, name: "Big Energy" },
  { id: 6, name: "Bluebettle" },
  { id: 7, name: "Cantonese" },
  { id: 8, name: "Chinese" },
  { id: 9, name: "Dumplings" },
  { id: 10, name: "EEEEE" },
]);

const handleTagSearch = (query) => {
  console.log("Search:", query);
};

const openManageTags = () => {
  console.log("Open manage tags modal");
};

// PERFORMERS
const selectedPerformers = ref([]);

const performersList = ref([
  {
    id: 1,
    name: "Jelly's Jam",
    username: "sommijellyll67",
    avatar: "https://i.ibb.co.com/bjGQxr5S/sample-bg-image.webp",
  },
  {
    id: 2,
    name: "Sammi's Jelly",
    username: "sommijellyll67",
    avatar: "https://i.ibb.co.com/bjGQxr5S/sample-bg-image.webp",
  },
]);

const handlePerformerSearch = (query) => {
  console.log("Searching performers:", query);
  // API call here
};
</script>
