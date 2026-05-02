<template>
    <div
        class=" w-full  bg-white/90 rounded shadow-[0px_0px_12px_0px_rgba(0,0,0,0.10)] backdrop-blur-[50px] inline-flex flex-col justify-start items-start overflow-hidden">
        <div class="self-stretch border-b border-gray-300 inline-flex justify-start items-center cursor-pointer hover:bg-gray-50/50 transition-colors"
            @click="onCreatePrivate">
            <div class="w-1 self-stretch relative bg-indigo-600" />
            <div class="flex-1 px-2 py-3 flex justify-start items-center gap-2">
                <div class="flex-1 inline-flex flex-col justify-start items-start gap-2">
                    <div class="self-stretch inline-flex justify-between items-center">
                        <div class="justify-center text-indigo-600 text-lg font-semibold font-['Poppins'] leading-8">
                            {{ t("dashboard_create_private_booking") }}</div>
                        <div
                            class="justify-center text-gray-500 text-xs font-medium font-['Poppins'] uppercase leading-4">
                            {{ t("dashboard_by_booking") }}</div>
                    </div>
                    <div
                        class="self-stretch justify-center text-slate-700 text-base font-normal font-['Poppins'] leading-6">
                        {{ t("dashboard_create_private_booking_body") }}</div>
                </div>
                <img class="w-20 h-20" :src="cartoonFeetIcon" alt="" />
            </div>
        </div>
        <div class="self-stretch border-b border-gray-300 inline-flex justify-start items-center cursor-pointer hover:bg-gray-50/50 transition-colors"
            @click="onCreateGroup">
            <div class="w-1 self-stretch relative bg-rose-600" />
            <div class="flex-1 px-2 py-3 flex justify-start items-center gap-2">
                <div class="flex-1 inline-flex flex-col justify-start items-start gap-2">
                    <div class="self-stretch inline-flex justify-between items-center">
                        <div class="justify-center text-rose-600 text-lg font-semibold font-['Poppins'] leading-8">
                            {{ t("dashboard_create_group_event") }}</div>
                        <div
                            class="justify-center text-gray-500 text-xs font-medium font-['Poppins'] uppercase leading-4">
                            {{ t("dashboard_scheduled_events") }}</div>
                    </div>
                    <div
                        class="self-stretch justify-center text-slate-700 text-base font-normal font-['Poppins'] leading-6">
                        {{ t("dashboard_create_group_event_body") }}</div>
                </div>
                <img class="w-20 h-20" :src="NeonDoorIcon" alt="" />
            </div>
        </div>
    </div>
</template>

<script setup>
import cartoonFeetIcon from "@/assets/images/icons/cartoonfeet.webp";
import NeonDoorIcon from "@/assets/images/icons/neonDoor.png";
import { useBookingTranslations } from "@/i18n/bookingTranslations.js";

const emit = defineEmits(["create-private", "create-group"]);
const { t } = useBookingTranslations();

const onCreatePrivate = () => {
    emit("create-private");
};

const onCreateGroup = () => {
    emit("create-group");
};
</script>
