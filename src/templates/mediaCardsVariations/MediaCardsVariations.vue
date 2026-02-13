<template>
  <div class="p-8 bg-[#c9c7c7]  min-h-full">

    <h2 class="text-2xl font-bold mb-6">Media card Version 1</h2>
    
    <section>
      <h2 class="text-xl font-bold mb-4">1. Creator: My Media</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <MediaCardV1 
          v-for="item in myMediaList" 
          :key="item.id" 
          :media="item" 
          variant="default"
          @menu-action="handleAction"
        />
      </div>
    </section>

    <section>
      <h2 class="text-xl font-bold mb-4">2. Fan: Continue Watching</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <MediaCardV1 
          :media="myMediaList[0]" 
          variant="resume" 
        />
      </div>
    </section>

    <section>
      <h2 class="text-xl font-bold mb-4">3. Fan: Latest Media</h2>
      <div class="flex items-start gap-4">
        <MediaCardV1 
          :media="latestMediaItem" 
          variant="latest" 
        />
      </div>
    </section>

    <section>
      <h2 class="text-xl font-bold mb-4">4. Fan: Purchased Media</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <MediaCardV1 
          :media="purchasedMediaItem" 
          variant="purchased" 
          @menu-action="handleAction"
        />
      </div>
    </section>

    <section>
      <h2 class="text-xl font-bold mb-4">5. Fan: Grid View (Zoom Effect)</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-2 xl:gap-4 w-full gap-y-[5.5rem] md:gap-y-[5rem] xl:gap-y-[5.5rem]">
        <MediaCardV1 
          v-for="item in gridMediaList" 
          :key="item.id" 
          :media="item" 
          variant="grid" 
          @menu-action="handleAction"
        />
      </div>
    </section>

    <br>
    <br>
    <br>
    <br>

    <h2 class="text-2xl font-bold mb-6">Media card Version 2</h2>

    <ul class="list-none grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 xl:gap-4">
      
      <MediaCardV2 :media="galleryCard" />

      <MediaCardV2 :media="imageCard" />

      <MediaCardV2 :media="videoCard" />

    </ul>
  </div>
</template>

<script setup>
import MediaCardV1 from '@/components/mediaCardsVariations/MediaCardV1.vue';
import MediaCardV2 from '@/components/mediaCardsVariations/MediaCardV2.vue';
import { ref } from 'vue';

const handleAction = (action) => {
  console.log("Menu clicked:", action);
}

// 1. My Media Data
const myMediaList = ref([
  {
    id: 1,
    type: 'video',
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    title: 'Took a walk in the park.',
    duration: '14:55',
    timeAgo: '5mo',
    likes: 0,
    views: 4,
    creatorName: 'Creator Allen',
    avatar: 'https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp'
  }
]);

// 2. Latest Media Data
const latestMediaItem = ref({
  id: 3,
  type: 'video',
  videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  title: 'My 2nd coming soon',
  duration: '14:55',
  timeAgo: '5mo',
  likes: 0,
  views: 4,
  creatorName: 'Creator Allen',
  avatar: 'https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp'
});

// 3. Purchased Media Data
const purchasedMediaItem = ref({
  id: 4,
  type: 'video',
  videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  title: 'Took a walk in the park today.',
  duration: '14:55',
  timeAgo: '5mo',
  likes: 0,
  views: 4,
  creatorName: 'Mistress Jessica',
  avatar: 'https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp'
});

// 4. Grid Media Data (Image, Video, Gallery)
const gridMediaList = ref([
  {
    id: 101,
    type: 'image',
    poster: 'https://i.ibb.co.com/bjGQxr5S/sample-bg-image.webp',
    title: 'Took a walk in the park this morning',
    duration: '',
    timeAgo: '5mo',
    likes: 0,
    views: 4,
    creatorName: 'Mistress Jessica',
    avatar: 'https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp'
  },
  {
    id: 102,
    type: 'video',
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    title: 'Took a walk in the park this morning',
    duration: '14:55',
    timeAgo: '5mo',
    likes: 0,
    views: 4,
    creatorName: 'Mistress Jessica',
    avatar: 'https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp'
  },
  {
    id: 103,
    type: 'gallery',
    poster: 'https://i.ibb.co.com/bjGQxr5S/sample-bg-image.webp',
    title: 'Took a walk in the park this morning',
    duration: '',
    timeAgo: '5mo',
    likes: 0,
    views: 4,
    creatorName: 'Mistress Jessica',
    avatar: 'https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp'
  }
]);

// 1. CARD 1 (Gallery): Locked + Green Tag
const galleryCard = ref({
  id: 1,
  type: 'gallery',
  poster: 'https://i.ibb.co.com/bjGQxr5S/sample-bg-image.webp',
  title: 'Took a walk in the park this morning',
  timeAgo: '5mo',
  likes: 0,
  views: 4,
  galleryCount: 7,
  // Configuration:
  isLocked: true,               // Lock Icon: Visible
  showTag: true,                // Tag: Visible
  tagText: 'Subscriber Exclusive',
  tagColor: 'green'
});

// 2. CARD 2 (Image): Unlocked + Pink Tag
const imageCard = ref({
  id: 2,
  type: 'image',
  poster: 'https://i.ibb.co.com/bjGQxr5S/sample-bg-image.webp',
  title: 'Took a walk in the park this morning',
  timeAgo: '5mo',
  likes: 0,
  views: 4,
  // Configuration:
  isLocked: false,              // Lock Icon: Hidden
  showTag: true,                // Tag: Visible
  tagText: 'Subscribe or Buy',  // Custom Text
  tagColor: 'pink'              // Pink Color
});

// 3. CARD 3 (Video): Locked + No Tag
const videoCard = ref({
  id: 3,
  type: 'video',
  videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  title: 'Took a walk in the park this morning',
  duration: '14:55',
  timeAgo: '5mo',
  likes: 0,
  views: 4,
  // Configuration:
  isLocked: true,               // Lock Icon: Visible (Logic ke hisaab se)
  showTag: false,               // Tag: Hidden
  tagText: '',                  // Empty
  tagColor: 'green'             // Irrelevant
});
</script>