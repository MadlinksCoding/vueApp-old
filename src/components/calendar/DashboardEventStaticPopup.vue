<template>
    <div class="w-full sm:w-[500px] border-l-[4px] border-[#5549FF] bg-[#F9FAFB] rounded shadow-lg inline-flex items-start overflow-hidden font-['Poppins']">
        <div class="w-full p-4 flex items-start">
            <div class="flex-1 inline-flex flex-col items-start gap-6">
                <!-- Header -->
                <div class="w-full inline-flex justify-between items-center">
                    <div class="text-gray-700 text-xl font-semibold font-['Poppins'] leading-tight pr-4">
                        Call me and i will sing with you
                    </div>
                    <button type="button" class="inline-flex w-6 h-6 items-center justify-center rounded hover:bg-gray-100 text-[#98A2B3] p-1 -mt-1 -mr-2">
                       <img :src="DotVerticalIcon" alt="three-dot" class="w-4 h-4">
                    </button>
                </div>

                <div class="flex flex-col gap-4">
                    <!-- Date and Time -->
                    <div class="inline-flex items-start gap-4">
                        <div class="w-5 h-5 flex-shrink-0 relative overflow-hidden mt-0.5">
                            <img src="/images/alarmIcon.png" alt="" class="filter invert-[0.6] sepia-[0.1] saturate-[0.1] hue-rotate-[180deg] object-contain w-full h-full opacity-70">
                        </div>
                        <div class="inline-flex flex-col justify-center items-start gap-1">
                            <div class="text-gray-950 text-sm font-semibold leading-5">
                                Wed April 23,2025
                            </div>
                            <div class="inline-flex items-center gap-2 mt-0.5">
                                <div class="text-gray-950 text-sm font-semibold leading-5">
                                    2:30pm-2:45pm
                                </div>
                                <div class="text-gray-400 text-sm font-medium leading-5">
                                    15 minutes
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Guest -->
                    <div class="inline-flex items-start gap-4">
                        <div class="w-5 h-5 flex-shrink-0 relative overflow-hidden mt-0.5">
                            <img src="/images/profile.webp" alt="" class="filter invert-[0.6] sepia-[0.1] saturate-[0.1] hue-rotate-[180deg] object-contain w-full h-full opacity-70">
                        </div>
                        <div class="inline-flex flex-col justify-center items-start gap-2">
                            <div class="inline-flex items-center gap-2">
                                <div class="text-[17px] leading-none">🥭</div>
                                <div class="text-gray-950 text-sm font-medium leading-5">
                                    Mangoes
                                </div>
                            </div>
                            <a href="#" class="inline-flex items-center gap-0.5 text-blue-600 text-xs tracking-wider hover:text-blue-700 uppercase">
                                <img :src="MessageTextIconBlue" alt="message-text-blue" class="w-4 h-4">
                                OPEN CHAT
                                <img :src="ArrowRightIcon" alt="arrow-right" class="w-4 h-4">
                            </a>
                        </div>
                    </div>

                    <!-- Additional Request -->
                    <div class="inline-flex items-start gap-4 w-full">
                        <div class="w-5 h-5 flex-shrink-0 relative overflow-hidden mt-0.5">
                            <img src="/images/dotpoints.png" alt="" class="filter invert-[0.6] sepia-[0.1] saturate-[0.1] hue-rotate-[180deg] object-contain w-full h-full opacity-70">
                        </div>
                        <div class="inline-flex flex-col items-start gap-2.5 flex-1">
                            <div class="text-gray-950 text-sm font-semibold leading-5">Additional request</div>
                            <ul class="list-disc pl-[20px] text-gray-950 text-sm font-normal leading-relaxed flex flex-col gap-1.5 w-full">
                                <li>record live call</li>
                                <li>Roleplay</li>
                                <li>Personal request<br/>
                                    <span class="text-gray-950 font-normal block mt-1 leading-[1.6] pr-2 text-sm">
                                        ‘I would like you to cosplay a specific Pokémon in ths costume i found on amazon...I can reimburse you for the costume: <a href="#" class="text-gray-950 underline underline-offset-2 break-all not-italic">https://www.amazon.com/MUFENG-Cosplay-Costume-Halloween-Trainer/dp/B07XYLX8XR/ref=sr_1_8?crid=S6RNG7JA5HMT&dib=eyJ2IjoiMSJ9._8oMRTER8wazvVQwZU4U2r8x3Aj9eK7wUDKdBRa6jFEfB3X2TcEQoPSzVX...</a>
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <!-- Minimum Charge -->
                    <div class="inline-flex items-start gap-4">
                        <div class="w-5 h-5 flex-shrink-0 relative overflow-hidden">
                            <img src="/images/dollar.png" alt="" class="filter invert-[0.6] sepia-[0.1] saturate-[0.1] hue-rotate-[180deg] object-contain w-full h-full opacity-70">
                        </div>
                        <div class="inline-flex flex-col items-start gap-1.5">
                            <div class="text-gray-950 text-sm font-semibold leading-5">
                                Minimum charge
                            </div>
                            <div class="text-gray-950 text-sm font-normal leading-5">
                                332 Tokens
                            </div>
                        </div>
                    </div>

                    <!-- Reminder -->
                    <div class="inline-flex items-center gap-4">
                        <div class="w-5 h-5 flex-shrink-0 relative overflow-hidden">
                            <img src="/images/bell-1.webp" alt="" class="filter invert-[0.6] sepia-[0.1] saturate-[0.1] hue-rotate-[180deg] object-contain w-full h-full opacity-70">
                        </div>
                        <div class="text-gray-950 text-sm font-normal leading-5">
                            5 minutes before
                        </div>
                    </div>
                </div>

                <!-- Actions -->
                <div class="w-full flex items-center flex-wrap gap-x-2 gap-y-3 pt-3">
                    <button type="button" class="px-3 py-2 rounded shadow-sm text-sm font-semibold text-gray-950 bg-[#07F468] hover:bg-[#07F468] transition-colors tracking-wide uppercase">
                        ACCEPT
                    </button>
                    <button type="button" class="px-3 py-2 rounded text-sm font-semibold text-[#EE3400] bg-white border border-[#EE3400] hover:bg-[#fff5f2] transition-colors tracking-wide uppercase shadow-sm">
                        DECLINE
                    </button>
                    <button type="button" class=" flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-[#5549FF] hover:bg-gray-50 rounded transition-colors whitespace-nowrap">
                        <img :src="EditIcon" alt="edit" class="w-4 h-4">
                        Adjust Request and Price
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
// Static Event Details Popup Component for Dashboard
import ThreeDotIcon from "@/assets/images/icons/3-dot.webp";
import MessageTextIconBlue from "@/assets/images/icons/messageblue.webp";
import EditIcon from "@/assets/images/icons/edit-05.webp";
import DotVerticalIcon from "@/assets/images/icons/dots-vertical.webp";
import ArrowRightIcon from "@/assets/images/icons/arrow-up-right.webp";
</script>
