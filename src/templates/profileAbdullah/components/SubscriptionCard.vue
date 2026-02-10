<script setup>
import { computed } from 'vue';
import CheckboxGroup from '@/components/ui/form/checkbox/CheckboxGroup.vue';
import ButtonComponent from '@/components/dev/button/ButtonComponent.vue';

const props = defineProps({
    isActive: {
        type: Boolean,
        default: false
    },
    data: {
        type: Object,
        required: true
    }
});

// Computed classes based on isActive state
const containerClasses = computed(() => {
    return props.isActive
        ? "w-96 h-full relative bg-[linear-gradient(to_bottom,rgba(13,10,44,0.9),rgba(13,10,44,0.2),rgba(13,10,44,0.9)),url('/images/tierBluishCard.png')] bg-cover bg-center rounded-sm shadow-[0px_4px_50px_0px_rgba(0,255,217,0.25)] outline outline-[1.50px] outline-[#FF0066] transition-all duration-300"
        : "w-96 h-full relative opacity-70 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.7),rgba(0,0,0,0),rgba(0,0,0,0.7)),url('/images/checkout-header.webp')] bg-cover bg-center rounded-sm outline outline-[1.35px] outline-zinc-500 blur-[1px] backdrop-blur-xl transition-all duration-300";
});

const contentClasses = computed(() => {
    return props.isActive
        ? "w-96 h-full px-6 pt-8 pb-16 bg-gradient-to-b from-black/0 to-black/50 rounded-sm border-[#FF0066] backdrop-blur-[5px] inline-flex flex-col justify-start items-center gap-4"
        : "w-96 px-5 pt-7 pb-16 bg-black/0 rounded-sm backdrop-blur-sm inline-flex flex-col justify-start items-center gap-3.5";
});

</script>

<template>
    <div :class="containerClasses">
        <div :class="contentClasses">

            <!-- Header Title -->
            <div
                :class="isActive
                    ? 'justify-start text-white text-3xl font-semibold font-[\'Poppins\'] leading-9 line-clamp-2'
                    : 'self-stretch justify-start text-gray-200 text-2xl font-semibold font-[\'Poppins\'] leading-9 line-clamp-2'">
                {{ data.title }}
            </div>

            <!-- Icons Row -->
            <div class="w-full inline-flex justify-start items-center gap-2.5">
                <div class="flex justify-start items-center gap-px">
                    <div class="justify-center text-white text-base font-normal font-['Poppins'] tracking-tight">0</div>
                    <div class="w-5 h-5 relative overflow-hidden">
                        <img src="/images/video.webp" alt="">
                    </div>
                </div>
                <div class="w-[3px] h-[3px] bg-white rounded-full" />
                <div class="flex justify-center items-center gap-px">
                    <div class="justify-center text-white text-base font-normal font-['Poppins'] tracking-tight">0</div>
                    <div class="w-5 h-5 relative overflow-hidden">
                        <img src="/images/galleryIcon.png" alt="">
                    </div>
                </div>
                <div class="w-[3px] h-[3px] bg-white rounded-full" />
                <div class="flex justify-center items-center gap-px">
                    <div class="justify-center text-white text-base font-normal font-['Poppins'] tracking-tight">0</div>
                    <div class=" relative overflow-hidden">
                        <img src="/images/galleryIcon2.png" alt="">
                    </div>
                </div>
            </div>

            <!-- Price Section -->
            <div
                :class="isActive ? 'w-full flex flex-col justify-end items-start gap-1' : 'self-stretch min-w-44 flex flex-col justify-end items-start gap-1'">
                <div class="inline-flex justify-end items-end gap-1">
                    <div class="justify-end">
                        <span :class="isActive
                            ? 'text-white text-xl font-semibold font-[\'Poppins\'] leading-8'
                            : 'text-neutral-400 text-lg font-semibold font-[\'Poppins\'] leading-7'">USD$</span>
                        <span :class="isActive
                            ? 'text-white text-5xl font-semibold font-[\'Poppins\'] leading-[60px]'
                            : 'text-neutral-400 text-5xl font-semibold font-[\'Poppins\'] leading-[54px]'">{{
                            data.price }}</span>
                    </div>

                    <div :class="isActive
                        ? 'pt-px pb-2.5 inline-flex flex-col justify-end items-start'
                        : 'self-stretch pt-px pb-2 inline-flex flex-col justify-between items-start'">

                        <!-- Discount Badge (Only for inactive/other if applicable, logic inferred from original) -->
                        <!-- Original 'Current' didn't have discount badge visible in code, 'Other' had -50% -->
                        <div v-if="!isActive && data.discount"
                            class="px-1 py-0.5 bg-neutral-400 inline-flex justify-end items-center gap-2">
                            <div
                                class="text-right justify-center text-black text-xs font-bold font-['Poppins'] leading-4">
                                {{ data.discount }}
                            </div>
                        </div>

                        <div class="inline-flex justify-start items-end gap-1.5">
                            <div v-if="!isActive && data.originalPrice"
                                class="justify-end text-neutral-400 text-sm font-medium font-['Poppins'] line-through leading-4">
                                {{ data.originalPrice }}
                            </div>
                            <div
                                :class="isActive
                                    ? 'justify-end text-white text-[10px] font-normal font-[\'Poppins\'] leading-3 tracking-tight'
                                    : 'justify-end text-neutral-400 text-[9px] font-normal font-[\'Poppins\'] leading-3 tracking-tight'">
                                /mo
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Content / Description -->
            <div
                :class="isActive ? 'flex-1 pt-1 flex flex-col justify-start items-start gap-1' : 'self-stretch flex-1 pt-1 flex flex-col justify-start items-start gap-1'">
                <div v-if="isActive" class="flex flex-col gap-3">
                    <span
                        class="text-white text-sm font-normal font-['Poppins'] leading-5 [text-shadow:_0px_2px_4px_rgb(16_24_40_/_0.06)] line-clamp-6">
                        {{ data.description }}
                    </span>
                    <ul
                        class="list-disc pl-5 text-white text-sm font-normal font-['Poppins'] leading-5 [text-shadow:_0px_2px_4px_rgb(16_24_40_/_0.06)]">
                        <li v-for="(feature, index) in data.features" :key="index">{{ feature }}</li>
                    </ul>
                </div>
                <div v-else class="self-stretch justify-start">
                    <span
                        class="text-gray-50 text-xs font-normal font-['Poppins'] leading-4 [text-shadow:_0px_2px_4px_rgb(16_24_40_/_0.06)] line-clamp-6">
                        {{ data.description }}
                    </span>
                    <br />
                    <span
                        class="text-gray-50 text-xs font-normal font-['Poppins'] leading-4 [text-shadow:_0px_2px_4px_rgb(16_24_40_/_0.06)] line-clamp-6">
                        <template v-for="(feature, index) in data.features" :key="index">
                            {{ feature }}<br />
                        </template>
                    </span>
                </div>

                <!-- Read More -->
                <div class="inline-flex justify-start items-center gap-0.5" :class="!isActive ? 'mt-1' : ''">
                    <div
                        :class="isActive ? 'justify-start text-green-500 text-xs font-medium font-[\'Poppins\'] leading-4' : 'justify-start text-zinc-500 text-xs font-medium font-[\'Poppins\'] leading-4'">
                        ...Read more
                    </div>
                </div>
            </div>

            <!-- Features Checkboxes / List -->
            <div
                :class="isActive ? 'w-full flex flex-col justify-start items-start gap-2' : 'self-stretch flex flex-col justify-start items-start gap-2'">
                <CheckboxGroup v-for="(item, idx) in data.perks" :key="idx"
                    :checkboxClass="`appearance-none bg-white border border-[#D0D5DD] dark:border-[#4a5568] rounded-[2px] w-3 min-w-3 h-3 mt-0.5
                            checked:accent-[#07f468] checked:bg-[#07f468] dark:checked:bg-[#0aff78] checked:border-[#07f468]
                            dark:checked:border-[#0aff78] checked:relative checked:after:content-[''] checked:after:absolute
                            checked:after:left-[0.3rem] checked:after:top-[0.15rem] checked:after:w-1 checked:after:h-2
                            checked:after:border checked:after:border-solid checked:after:border-t-0 checked:after:border-l-0
                            checked:after:border-[black] dark:checked:after:border-[white] checked:after:border-b-[2px]
                            checked:after:border-r-[2px] checked:after:rotate-45 checked:after:box-border cursor-pointer`"
                    labelClass="text-sm leading-normal tracking-[0.0175rem] text-[#98A2B3] cursor-pointer mt-1"
                    wrapperClass="flex items-center gap-2">
                    <div class="flex-1 justify-start">
                        <span
                            :class="isActive ? 'text-[#7E7E7E] text-sm font-semibold font-[\'Poppins\'] leading-6' : 'text-zinc-500 text-sm font-semibold font-[\'Poppins\'] leading-5'">{{
                                item.highlight }}</span>
                        <span
                            :class="isActive ? 'text-white text-sm font-normal font-[\'Poppins\'] leading-6' : 'text-white text-sm font-normal font-[\'Poppins\'] leading-5'">
                            {{ item.text }}</span>
                    </div>
                </CheckboxGroup>
            </div>

        </div>

        <!-- Current Subscription Badge (Only for Active / Subscribed) -->
        <!-- Assuming isActive and isSubscribed are linked for this specific visualization where center = current -->
        <div v-if="data.isSubscribed" class="h-8 left-[-6px] top-[-6px] absolute inline-flex justify-start items-start">
            <div class="pl-2 pr-1.5 py-1 bg-[#FF0066] flex justify-end items-center gap-2.5">
                <div class="justify-center text-white text-lg font-semibold font-['Poppins'] leading-7">
                    Current Subscription
                </div>
            </div>
            <img src="/images/pinkSingleUnion.png" class='w-3 h-9' alt="">
        </div>

        <!-- Followers Button (Only for 'Other' / Inactive cards) -->
        <div v-if="!isActive" class="right-0 bottom-0 absolute">
            <ButtonComponent text="30 Followers" variant="polygonLeft"
                :rightIconClass="`w-6 h-6 transition duration-200 filter brightness-0 invert-0 group-hover:[filter:brightness(0)_saturate(100%)_invert(75%)_sepia(23%)_saturate(7280%)_hue-rotate(93deg)_brightness(109%)_contrast(95%)]`"
                btnBg="#71717A" btnHoverBg="black" btnText="#000" btnHoverText="#07f468"
                customClass="shadow-[3.5999999046325684px_3.5999999046325684px_0px_0px_rgba(0,0,0,1.00)] h-12 px-2 py-1" />
        </div>

    </div>
</template>
