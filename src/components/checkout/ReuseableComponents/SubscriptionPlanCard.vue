<script setup>
import { computed } from 'vue';

const props = defineProps({
  // Main Content
  title: {
    type: String,
    required: true
  },
  price: {
    type: String,
    required: true
  },
  period: {
    type: String,
    default: '/mo' // Default value '/mo' hai, change kr skte ho
  },
  
  // Images
  backgroundImage: {
    type: String,
    required: true
  },
  logoImage: {
    type: String,
    default: 'https://i.ibb.co.com/PvS68T8W/logo-no-bg.webp'
  },

  // Styling & Colors
  accentColor: {
    type: String,
    default: '#FFCC01' // Default Yellow color
  },
  
  // Footer Text (Optional)
  footerText: {
    type: String,
    default: ''
  }
});

// Dynamic Shadow Style calculation
const cardStyle = computed(() => {
  return {
    backgroundImage: `url(${props.backgroundImage})`,
    boxShadow: `4px 4px 0 0 ${props.accentColor}, 4px 4px 4px 0 rgba(0,0,0,0.15)`
  };
});
</script>

<template>
  <div class="flex flex-col gap-1 w-full">
    
    <div
      class="flex w-full h-[4.9375rem] bg-center bg-cover shrink-0"
      :style="cardStyle"
    >
      <div class="w-32 min-w-[8rem] relative shrink-0">
        <img
          :src="backgroundImage"
          alt="background"
          class="w-full h-full object-cover"
        />

        <div
          class="w-8 h-8 flex justify-center items-center absolute top-0 left-0 z-[1]"
        >
          <img
            :src="logoImage"
            alt="logo"
            class="w-full h-full"
          />
        </div>
      </div>

      <div
        class="w-[calc(100%+1.5rem)] h-full flex-grow pl-6 -ml-6 [clip-path:polygon(24px_0,100%_0,100%_100%,0_100%)] [background:linear-gradient(0deg,rgba(0,0,0,0.35),rgba(0,0,0,0.35)),linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.4)_100%),linear-gradient(0deg,rgba(255,204,1,0.1),rgba(255,204,1,0.1))] relative z-[2] backdrop-blur-[100px]"
      >
        <div class="flex flex-col gap-1 p-2">
          <h3
            class="text-sm font-semibold line-clamp-2 text-white drop-shadow-[0px_0px_4px_0px_#00000066]"
          >
            {{ title }}
          </h3>
          
          <h4
            class="h-[1.1875rem] flex justify-start items-center text-lg font-semibold text-white drop-shadow-[0px_0px_4px_0px_#00000066]"
          >
            {{ price }}
            <span class="text-sm font-medium text-white drop-shadow-[0px_0px_4px_0px_#00000066]">
              {{ period }}
            </span>
          </h4>
        </div>
      </div>
    </div>

    <p 
      v-if="footerText" 
      class="text-xs leading-normal"
      :style="{ color: accentColor }"
    >
      {{ footerText }}
    </p>

  </div>
</template>