<template>
    <div
        class="w-full md:w-[429px] bg-white/90 rounded shadow-[0px_0px_12px_0px_rgba(0,0,0,0.10)] backdrop-blur-[50px] inline-flex flex-col overflow-hidden">
        <div
            class="border-b border-gray-300 inline-flex items-center cursor-pointer hover:bg-gray-50/50 transition-colors"
            @click="onCreatePrivate">
            <div class="flex-1 px-2 py-3 flex items-center gap-2 border-l-[3px] border-[#5549FF]">
                <div class="flex-1 inline-flex flex-col gap-2">
                    <div class="inline-flex justify-between items-center">
                        <div class="justify-center text-indigo-600 text-xl font-semibold font-['Poppins'] md:leading-8">
                            {{ t("dashboard_create_private_booking") }}
                        </div>
                        <div
                            class="justify-center text-gray-500 text-xs font-medium font-['Poppins'] uppercase leading-4 text-nowrap">
                            {{ t("dashboard_by_booking") }}</div>
                    </div>
                    <div class="justify-center text-slate-700 text-base font-normal font-['Poppins'] leading-6">
                        {{ t("dashboard_create_private_booking_body") }}
                    </div>
                </div>
                <img class="w-20 h-20" :src="cartoonFeetIcon" alt="" />
            </div>
        </div>
        <div class="inline-flex items-center cursor-pointer hover:bg-gray-50/50 transition-colors" @click="onCreateGroup">
            <div class="flex-1 px-2 py-3 flex border-l-[3px] border-[#FF0464] items-center gap-2">
                <div class="flex-1 inline-flex flex-col gap-2">
                    <div class="inline-flex justify-between items-center">
                        <div class="justify-center text-rose-600 text-xl font-semibold font-['Poppins'] md:leading-8">
                            {{ t("dashboard_create_group_event") }}</div>
                        <div
                            class="justify-center text-gray-500 text-xs font-medium font-['Poppins'] uppercase leading-4 text-nowrap">
                            {{ t("dashboard_scheduled_events") }}</div>
                    </div>
                    <div class="justify-center text-slate-700 text-base font-normal font-['Poppins'] leading-6">
                        {{ t("dashboard_create_group_event_body") }}
                    </div>
                </div>
                <img class="w-20 h-20" :src="NeonDoorIcon" />
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
