<script setup>
import { ref } from 'vue';

// Components
import BackgroundVideo from './Components/BackgroundVideo.vue';
import MainNavbar from './Components/MainNavbar.vue';
import HeroSection from './Components/HeroSection.vue';
import AboutSection from './Components/AboutSection.vue';
import FeaturedCreators from './Components/FeaturedCreators.vue';
import DitchMiddleman from './Components/DitchMiddleman.vue';
import MostViewedSlider from './Components/MostViewedSlider.vue';
import RecentlyUploadedSlider from './Components/RecentlyUploadedSlider.vue';
import GallerySlider from './Components/GallerySlider.vue';
import ServiceTabsSection from './Components/ServiceTabsSection.vue';
import SafetyBanner from './Components/SafetyBanner.vue';
import ReviewSection from './Components/ReviewSection.vue';
import JoinSection from './Components/JoinSection.vue';
import FAQSection from './Components/FAQSection.vue';
import OverviewSection from './Components/OverviewSection.vue';
import MainFooter from './Components/MainFooter.vue';

const bgVideo = ref(null);

const handleHeroSlideChange = (index) => {
    if (bgVideo.value) {
        bgVideo.value.syncVideo(index);
    }
};
</script>

<template>
    <div class="relative min-h-screen">
        <!-- Background Layer -->
        <BackgroundVideo ref="bgVideo" />

        <!-- Main Content -->
        <div class="relative z-0">
            <MainNavbar />

            

            <main>
                <HeroSection @slideChange="handleHeroSlideChange" />
                <AboutSection />
                <FeaturedCreators />
                <DitchMiddleman />
                <MostViewedSlider />
                <RecentlyUploadedSlider />
                <GallerySlider />
                <ServiceTabsSection />
                <SafetyBanner />
                <ReviewSection />
                <JoinSection />
                <FAQSection />
                <OverviewSection />
            </main>

            <MainFooter />
        </div>
    </div>
</template>

<style>
/* Global styles if needed, but Tailwind should handle most */
html {
    scroll-behavior: smooth;
}

body {
    font-family: 'Poppins', sans-serif;
    margin: 0;
    padding: 0;
    overflow-x: hidden;
}

/* Custom scrollbar for some sections might be needed */
.no-scrollbar::-webkit-scrollbar {
    display: none;
}

.no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
