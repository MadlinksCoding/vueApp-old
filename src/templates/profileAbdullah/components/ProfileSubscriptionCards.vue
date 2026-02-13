<script setup>
import { ref, onMounted, nextTick, watch, computed } from 'vue';
import SubscriptionCard from './SubscriptionCard.vue';
import { Splide, SplideSlide } from '@splidejs/vue-splide';
import '@splidejs/vue-splide/css';

const props = defineProps({
    isPopupOpen: { type: Boolean, default: false }
});

const emit = defineEmits(["update:modelValue"]);

const splideRef = ref(null);

const subscriptionCards = ref([
    {
        title: "FREE library of LOREM LPSUM ATIER dolor sit amet, consectetur adipiscing elit.",
        price: '30.99',
        originalPrice: '60.99',
        discount: '-50%',
        description: "Watch all of my mango eating content! content update weekly!",
        features: [
            "100% real content", "no editing", "100% real content", "no editing",
            "100% real content", "no editing", "100% real content", "no editing"
        ],
        perks: [
            { highlight: "10 free tokens", text: "each month" },
            { highlight: "10% off", text: "on all Merchandise" },
            { highlight: "10% off", text: "on all Custom Request" },
            { highlight: "10% off", text: "on all Pay to View videos" }
        ],
        isSubscribed: false
    },
    {
        title: "FREE library of LOREM LPSUM ATIER dolor sit amet, consectetur adipiscing elit.",
        price: '30.99',
        originalPrice: '60.99',
        discount: '-50%',
        description: "Watch all of my mango eating content! content update weekly!",
        features: [
            "100% real content", "no editing", "100% real content", "no editing",
            "100% real content", "no editing", "100% real content", "no editing"
        ],
        perks: [
            { highlight: "10 free tokens", text: "each month" },
            { highlight: "10% off", text: "on all Merchandise" },
            { highlight: "10% off", text: "on all Custom Request" },
            { highlight: "10% off", text: "on all Pay to View videos" }
        ],
        isSubscribed: false
    },
    {
        title: "FEATURED library of LOREM LPSUM ATIER dolor sit amet, consectetur adipiscing elit.",
        price: '499.99',
        description: "Watch all of my mango eating content! content update weekly!",
        features: [
            "100% real content", "no editing", "100% real content", "no editing",
            "100% real content", "no editing", "100% real content", "no editing"
        ],
        perks: [
            { highlight: "10 free tokens", text: "each month" },
            { highlight: "10% off", text: "on all Merchandise" },
            { highlight: "10% off", text: "on all Custom Request" },
            { highlight: "10% off", text: "on all Pay to View videos" }
        ],
        isSubscribed: true // This is the "Current Subscription"
    },
    {
        title: "FREE library of LOREM LPSUM ATIER dolor sit amet, consectetur adipiscing elit.",
        price: '30.99',
        originalPrice: '60.99',
        discount: '-50%',
        description: "Watch all of my mango eating content! content update weekly!",
        features: [
            "100% real content", "no editing", "100% real content", "no editing",
            "100% real content", "no editing", "100% real content", "no editing"
        ],
        perks: [
            { highlight: "10 free tokens", text: "each month" },
            { highlight: "10% off", text: "on all Merchandise" },
            { highlight: "10% off", text: "on all Custom Request" },
            { highlight: "10% off", text: "on all Pay to View videos" }
        ],
        isSubscribed: false
    },
    {
        title: "FREE library of LOREM LPSUM ATIER dolor sit amet, consectetur adipiscing elit.",
        price: '30.99',
        originalPrice: '60.99',
        discount: '-50%',
        description: "Watch all of my mango eating content! content update weekly!",
        features: [
            "100% real content", "no editing", "100% real content", "no editing",
            "100% real content", "no editing", "100% real content", "no editing"
        ],
        perks: [
            { highlight: "10 free tokens", text: "each month" },
            { highlight: "10% off", text: "on all Merchandise" },
            { highlight: "10% off", text: "on all Custom Request" },
            { highlight: "10% off", text: "on all Pay to View videos" }
        ],
        isSubscribed: false
    }
]);

const activeIndex = ref(2); // Start at current subscription

// Find current subscription (highest priced subscription)
const currentSubscription = computed(() => {
    const subscribedCards = subscriptionCards.value.filter(card => card.isSubscribed);
    if (subscribedCards.length === 0) return null;

    // Return the subscription with highest price
    return subscribedCards.reduce((max, card) => {
        const maxPrice = parseFloat(max.price);
        const cardPrice = parseFloat(card.price);
        return cardPrice > maxPrice ? card : max;
    });
});

const splideOptions = {
    type: 'slide',
    rewind: true,
    perPage: 5,
    focus: 'center',
    gap: 0,
    pagination: true,
    arrows: false,
    drag: false, // Disable drag/swipe interaction
    start: 2,
    updateOnMove: true,
    speed: 400,
    trimSpace: false,
    breakpoints: {
        1124: { perPage: 3, gap: "-59px", focus: "center", trimSpace: false },
        768: { perPage: 1, gap: 0 },
        500: { perPage: 1, gap: 0 }
    }
};

const onMove = (splide, newIndex) => {
    activeIndex.value = newIndex;
    applyCoverflow(splide);
};

const onSplideMounted = (splide) => {
    // Store the splide instance first
    splideRef.value = splide;

    // Immediate initialization - apply coverflow on the default state first
    requestAnimationFrame(() => {
        applyCoverflow(splide);

        // Then navigate to index 2 and re-apply
        requestAnimationFrame(() => {
            splide.go(2, false); // Jump without animation

            // Apply coverflow immediately after navigation
            requestAnimationFrame(() => {
                applyCoverflow(splide);

                // Force one more update after a short delay
                setTimeout(() => {
                    splide.refresh();
                    applyCoverflow(splide);
                }, 100);
            });
        });
    });

    // Listen to moved event (fires after move completes)
    splide.on('moved', () => {
        requestAnimationFrame(() => applyCoverflow(splide));
    });

    // Listen to resize events
    splide.on('resized', () => {
        requestAnimationFrame(() => {
            applyCoverflow(splide);
        });
    });
};

// Watch for popup open and reinitialize slider after animation
watch(() => props.isPopupOpen, (isOpen) => {
    if (isOpen && splideRef.value) {
        // Wait for popup slide-in animation (250ms) + extra buffer
        setTimeout(() => {
            splideRef.value.refresh();
            splideRef.value.go(2, false);
            requestAnimationFrame(() => {
                applyCoverflow(splideRef.value);
            });
        }, 350);
    }
});

const applyCoverflow = (splide) => {
    const slides = splide.Components.Slides.get(true);
    const centerIndex = splide.index;
    const perPage = splide.options.perPage || 5;
    const maxVisibleDist = Math.floor(perPage / 2);

    // ⬅️ Add this at the very start
    if (perPage === 1) {
        slides.forEach((slide) => {
            const el = slide.slide;
            el.style.transform = 'translateX(0) scale(1)';
            el.style.zIndex = 30;
            el.style.opacity = 1;
            el.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
        });
        return; // Skip the rest of coverflow logic
    }

    slides.forEach((slide) => {
        const el = slide.slide;
        let dist = slide.index - centerIndex;
        if (dist > slides.length / 2) dist -= slides.length;
        if (dist < -slides.length / 2) dist += slides.length;
        const absDist = Math.abs(dist);

        let scale = 1;
        let translateX = 0;
        let zIndex = 30 - absDist * 10;
        let opacity = 1;

        if (absDist === 0) {
            // Center card
            scale = 1;
            translateX = 0;
            zIndex = 30;
        } else if (absDist === 1 && perPage >= 2) {
            scale = 0.85;

            // fix for 3 cards layout
            if (perPage === 3) {
                translateX = dist > 0 ? '-30px' : '30px';
            } else {
                translateX = dist > 0 ? '-70px' : '70px';
            }

            zIndex = 20;
        } else if (absDist === 2 && perPage >= 3) {
            scale = 0.7;
            translateX = dist > 0 ? '-130px' : '130px';
            zIndex = 10;
        } else if (absDist === 3 && perPage >= 5) {
            scale = 0.6;
            translateX = dist > 0 ? '-180px' : '180px';
            zIndex = 5;
        } else {
            // Completely hide slides outside visible range
            scale = 0.5;
            translateX = 0;
            opacity = 0;
            zIndex = 0;
        }

        el.style.transform = `translateX(${translateX}) scale(${scale})`;
        el.style.zIndex = zIndex;
        el.style.opacity = opacity;
        el.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
        el.style.pointerEvents = absDist > maxVisibleDist ? 'none' : 'auto';
    });
};
</script>

<template>
    <div class="w-full flex justify-center items-center py-10 overflow-hidden">
        <Splide :options="splideOptions" @splide:move="onMove" @splide:mounted="onSplideMounted"
            class="w-full max-w-[1306px] mx-auto" aria-label="Subscription Plans">
            <SplideSlide v-for="(card, index) in subscriptionCards" :key="index"
                class="flex justify-center items-center py-10 transition-transform duration-300">
                <SubscriptionCard :data="card" :isActive="activeIndex === index"
                    :currentSubscription="currentSubscription" />
            </SplideSlide>
        </Splide>
    </div>
</template>

<style>
.splide__pagination {
    bottom: -2rem !important;
    display: flex !important;
    /* ensure always visible */
    justify-content: center;
}

.splide__pagination__page {
    background: #52525B !important;
    opacity: 1 !important;
    height: 8px !important;
    width: 8px !important;
    margin: 5px !important;
}

.splide__pagination__page.is-active {
    background: #00FF94 !important;
    transform: scale(1.2);
    width: 24px !important;
    border-radius: 4px !important;
}
</style>
