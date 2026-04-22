<template>
    <div
        class="w-full sm:w-[492px] border-l-[4px] bg-gray-50 rounded inline-flex items-start overflow-hidden"
        :style="popupStyle"
    >
        <div class="w-1 relative" :style="{ backgroundColor: eventColor }" />
        <div class="w-full p-4 flex items-start gap-1">
            <div class="flex-1 inline-flex flex-col items-start gap-6">
                <div class="w-full inline-flex justify-between items-center">
                    <div class="text-2xl font-semibold font-['Poppins'] leading-8" :style="{ color: eventColor }">
                        {{ titleText }}
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="flex items-center gap-1" v-if="statusHint">
                            <div class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: statusDotColor }" />
                            <div class="text-gray-500 text-xs font-medium font-['Poppins'] leading-4">{{ statusHint }}</div>
                        </div>
                        <button
                            v-if="showJoinButton"
                            type="button"
                            class="px-2 py-[3px] rounded flex items-center gap-1 cursor-pointer"
                            :style="{ backgroundColor: eventColor }"
                            @click="handleJoin"
                        >
                            <div class="w-4 h-4 relative overflow-hidden">
                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M10.9998 1L8.66645 3.33333M8.66645 3.33333L10.9998 5.66667M8.66645 3.33333H13.9998M6.8178 8.24205C6.01675 7.44099 5.38422 6.53523 4.92022 5.56882C4.88031 5.48569 4.86036 5.44413 4.84503 5.39154C4.79054 5.20463 4.82968 4.97513 4.94302 4.81684C4.97491 4.7723 5.01302 4.7342 5.08923 4.65799C5.3223 4.42492 5.43883 4.30838 5.51502 4.1912C5.80235 3.74927 5.80235 3.17955 5.51502 2.73762C5.43883 2.62044 5.3223 2.5039 5.08923 2.27083L4.95931 2.14092C4.60502 1.78662 4.42787 1.60947 4.23762 1.51324C3.85924 1.32186 3.4124 1.32186 3.03402 1.51324C2.84377 1.60947 2.66662 1.78662 2.31233 2.14092L2.20724 2.24601C1.85416 2.59909 1.67762 2.77563 1.54278 3.01565C1.39317 3.28199 1.2856 3.69565 1.2865 4.00113C1.28732 4.27643 1.34073 4.46458 1.44753 4.84087C2.02151 6.86314 3.10449 8.77138 4.69648 10.3634C6.28847 11.9554 8.19671 13.0383 10.219 13.6123C10.5953 13.7191 10.7834 13.7725 11.0587 13.7733C11.3642 13.7743 11.7779 13.6667 12.0442 13.5171C12.2842 13.3822 12.4608 13.2057 12.8138 12.8526L12.9189 12.7475C13.2732 12.3932 13.4504 12.2161 13.5466 12.0258C13.738 11.6474 13.738 11.2006 13.5466 10.8222C13.4504 10.632 13.2732 10.4548 12.9189 10.1005L12.789 9.97062C12.5559 9.73755 12.4394 9.62101 12.3222 9.54482C11.8803 9.25749 11.3106 9.2575 10.8687 9.54482C10.7515 9.62102 10.6349 9.73755 10.4019 9.97062C10.3257 10.0468 10.2875 10.0849 10.243 10.1168C10.0847 10.2302 9.85521 10.2693 9.66831 10.2148C9.61572 10.1995 9.57415 10.1795 9.49103 10.1396C8.52461 9.67562 7.61885 9.0431 6.8178 8.24205Z"
                                        stroke="white" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                            </div>
                            <div class="text-white text-xs font-semibold font-['Poppins'] leading-4">Join call</div>
                        </button>

                        <div v-if="showJoinButton" class="relative">
                            <button
                                type="button"
                                class="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-gray-200/80"
                                :aria-expanded="menuOpen"
                                @click.stop="toggleMenu"
                            >
                                <svg width="4" height="12" viewBox="0 0 4 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M2.00004 6.6665C2.36823 6.6665 2.66671 6.36803 2.66671 5.99984C2.66671 5.63165 2.36823 5.33317 2.00004 5.33317C1.63185 5.33317 1.33337 5.63165 1.33337 5.99984C1.33337 6.36803 1.63185 6.6665 2.00004 6.6665Z" stroke="#98A2B3" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M2.00004 1.99984C2.36823 1.99984 2.66671 1.70136 2.66671 1.33317C2.66671 0.964981 2.36823 0.666504 2.00004 0.666504C1.63185 0.666504 1.33337 0.964981 1.33337 1.33317C1.33337 1.70136 1.63185 1.99984 2.00004 1.99984Z" stroke="#98A2B3" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M2.00004 11.3332C2.36823 11.3332 2.66671 11.0347 2.66671 10.6665C2.66671 10.2983 2.36823 9.99984 2.00004 9.99984C1.63185 9.99984 1.33337 10.2983 1.33337 10.6665C1.33337 11.0347 1.63185 11.3332 2.00004 11.3332Z" stroke="#98A2B3" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>

                            <div
                                v-if="menuOpen"
                                class="absolute right-0 top-9 z-[1200] w-[14rem] rounded-[0.375rem] border border-[#EAECF0] bg-white shadow-[0_10px_20px_rgba(0,0,0,0.15)] overflow-hidden"
                                @click.stop
                            >
                                <button
                                    type="button"
                                    class="w-full flex items-center gap-2 px-3 py-3 text-left text-[0.8rem] font-semibold text-[#344054] hover:bg-[#F9FAFB] pointer-events-none opacity-30 cursor-not-allowed"
                                >
                                    <span class="inline-flex w-5 h-5 items-center justify-center">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 7V12L15 15M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#475467" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    </span>
                                    Ask for more time
                                </button>

                                <button
                                    type="button"
                                    class="w-full flex items-center gap-2 px-3 py-3 text-left text-[0.8rem] font-semibold text-[#344054] border-t border-[#EAECF0] hover:bg-[#F9FAFB] pointer-events-none opacity-30 cursor-not-allowed"
                                >
                                    <span class="inline-flex w-5 h-5 items-center justify-center">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                            <path d="M16 2V6M8 2V6M3 10H21M7 22H17C18.6569 22 20 20.6569 20 19V7C20 5.34315 18.6569 4 17 4H7C5.34315 4 4 5.34315 4 7V19C4 20.6569 5.34315 22 7 22Z" stroke="#475467" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    </span>
                                    Ask to reschedule
                                </button>

                                <button
                                    type="button"
                                    class="w-full flex items-center gap-2 px-3 py-3 text-left text-[0.8rem] font-semibold text-[#F04438] border-t border-[#EAECF0] hover:bg-[#FEF3F2]"
                                    @click.stop="handleCancelCall"
                                >
                                    <span class="inline-flex w-5 h-5 items-center justify-center">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                            <path d="M10 14L21 3M14 10L3 21M4.5 8.5C3.5 6.5 3.5 4.5 5 3C7 1 10 2 12.5 4.5L19.5 11.5C22 14 23 17 21 19C19.5 20.5 17.5 20.5 15.5 19.5" stroke="#F04438" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    </span>
                                    Cancel Call
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col items-start gap-4">
                    <div class="inline-flex items-start gap-4">
                        <div class="w-6 h-6 relative overflow-hidden">
                            <img src="/images/alarmIcon.png" alt="" class="filter grayscale brightness-75 opacity-100">
                        </div>
                        <div class="inline-flex flex-col justify-center items-start gap-2">
                            <div class="text-gray-900 text-sm font-semibold font-['Poppins'] leading-5">
                                {{ formattedDate }}
                            </div>
                            <div class="inline-flex items-start gap-2">
                                <div class="text-gray-900 text-sm font-medium font-['Poppins'] leading-5">
                                    {{ formattedTimeRange }}
                                </div>
                                <div class="text-gray-400 text-sm font-medium font-['Poppins'] leading-5">
                                    {{ duration }} minutes
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="inline-flex items-start gap-4">
                        <div class="w-6 h-6 relative overflow-hidden">
                            <img src="/images/profile.webp" alt="" class="filter grayscale brightness-75 opacity-100">
                        </div>
                        <div class="inline-flex flex-col justify-center items-start gap-2">
                            <div class="text-gray-900 text-sm font-semibold font-['Poppins'] leading-5">{{ guestHeading }}</div>
                            <div class="flex flex-col justify-center items-start gap-1">
                                <div
                                    v-if="guestProfileLoading"
                                    class="inline-flex items-center gap-2"
                                    data-testid="guest-profile-skeleton"
                                >
                                    <div class="w-6 h-6 rounded-full bg-[#E6E6E6] animate-skeleton-loading"></div>
                                    <div class="inline-flex flex-col justify-center items-start gap-1">
                                        <div class="h-3.5 w-28 rounded bg-[#E6E6E6] animate-skeleton-loading"></div>
                                        <div class="h-3 w-20 rounded bg-[#E6E6E6] animate-skeleton-loading"></div>
                                    </div>
                                </div>
                                <div v-else class="inline-flex items-center gap-2" data-testid="guest-profile">
                                    <div class="w-6 h-6 relative overflow-hidden rounded-full shrink-0" v-if="guestAvatar">
                                        <img class="h-full w-full object-cover" :src="guestAvatar" :alt="guestDisplayName" />
                                    </div>
                                    <div class="inline-flex flex-col justify-center items-start">
                                        <div class="text-gray-900 text-sm font-normal font-['Poppins'] leading-5 line-clamp-1">
                                            {{ guestDisplayName }}
                                        </div>
                                        <div
                                            v-if="guestUsername"
                                            class="text-gray-500 text-xs font-normal font-['Poppins'] leading-4 line-clamp-1"
                                        >
                                            {{ guestUsername }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="inline-flex items-start gap-4">
                        <div class="w-6 h-6 relative overflow-hidden">
                            <img src="/images/dotpoints.png" alt="">
                        </div>
                        <div class="inline-flex flex-col items-start gap-2">
                            <div class="text-gray-900 text-sm font-semibold font-['Poppins'] leading-5">Additional request</div>
                            <div
                                v-for="(line, index) in additionalRequestLines"
                                :key="`request_${index}`"
                                class="text-gray-900 text-sm font-normal font-['Poppins'] leading-5"
                            >
                                {{ line }}
                            </div>
                        </div>
                    </div>

                    <div class="inline-flex items-start gap-4">
                        <div class="w-6 h-6 relative overflow-hidden">
                            <img src="/images/dollar.png" alt="">
                        </div>
                        <div class="inline-flex flex-col items-start gap-2">
                            <div class="text-gray-900 text-sm font-semibold font-['Poppins'] leading-5">
                                Minimum charge
                            </div>
                            <div class="text-gray-900 text-sm font-normal font-['Poppins'] leading-5">
                                {{ minimumChargeLabel }}
                            </div>
                        </div>
                    </div>

                    <div class="inline-flex items-center gap-4">
                        <div class="w-6 h-6 relative overflow-hidden">
                            <img src="/images/bell-1.webp" alt="" class="filter grayscale brightness-75 opacity-100">
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="text-gray-900 text-sm font-normal font-['Poppins'] leading-5">{{ reminderLabel }}</div>
                        </div>
                    </div>

                    <div class="inline-flex w-full items-center gap-4 pointer-events-none opacity-30" v-if="true || chatUrl">
                        <div class="w-6 h-6 relative overflow-hidden">
                            <img src="/images/message-dots.png" alt="">
                        </div>
                        <a
                            class="flex items-center gap-0.5"
                            :href="chatUrl"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <div class="text-gray-900 text-sm font-semibold font-['Poppins'] leading-5 cursor-pointer">
                                Open chat
                            </div>
                            <svg width="15" height="32" viewBox="0 0 32 32" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M9.3335 22.6666L22.6668 9.33331M22.6668 9.33331H9.3335M22.6668 9.33331V22.6666"
                                    stroke="#000" stroke-width="2.5" stroke-linecap="round"
                                    stroke-linejoin="round" />
                            </svg>
                        </a>
                    </div>

                    <div v-if="canReviewPending && !showRejectConfirm" class="inline-flex w-full items-center gap-3 pt-2">
                    <button type="button" @click="handleApprove" class="px-3 py-2 rounded shadow-sm text-sm font-semibold text-gray-950 bg-[#07F468] hover:bg-[#07F468] transition-colors tracking-wide uppercase">
                        ACCEPT
                    </button>
                    <button type="button" @click="handleReject" class="px-3 py-2 rounded text-sm font-semibold text-[#EE3400] bg-white border border-[#EE3400] hover:bg-[#fff5f2] transition-colors tracking-wide uppercase shadow-sm">
                        DECLINE
                    </button>
                    </div>

                    <div v-if="showRejectConfirm" class="w-full rounded border border-red-200 bg-red-50 px-3 py-2">
                        <div class="text-xs font-medium text-red-700 mb-2">
                            Are you sure you want to reject this booking?
                        </div>
                        <div class="inline-flex items-center gap-2">
                            <button
                                type="button"
                                class="px-3 py-1.5 rounded text-xs font-semibold text-white bg-red-600 hover:bg-red-700 cursor-pointer"
                                @click="confirmReject"
                            >
                                Yes, Reject
                            </button>
                            <button
                                type="button"
                                class="px-3 py-1.5 rounded text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer"
                                @click="cancelReject"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { hhmm } from '@/utils/calendarHelpers.js';
import { getBookingJoinState } from '@/utils/bookingJoinUtils.js';
import { buildWpApiUrl } from '@/utils/wpApiBaseUrl.js';

const props = defineProps({
    event: {
        type: Object,
        default: () => ({})
    },
    canReviewPending: {
        type: Boolean,
        default: true
    },
    userRole: {
        type: String,
        default: 'creator'
    }
});

const emit = defineEmits(['join-call', 'approve-booking', 'reject-booking', 'cancel-booking']);
const menuOpen = ref(false);

function normalizeHexColor(color, fallback = '#5549FF') {
    if (typeof color !== 'string') return fallback;
    const normalized = color.trim();
    return /^#([0-9a-fA-F]{3}){1,2}$/.test(normalized) ? normalized : fallback;
}

function titleCaseFromKey(key = '') {
    return String(key)
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function pickFirstString(...values) {
    for (const value of values) {
        if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return '';
}

function firstDefined(...values) {
    return values.find((value) => value !== undefined && value !== null);
}

function normalizeGuestProfile(user) {
    if (!user || typeof user !== 'object') return null;

    return {
        displayName: pickFirstString(user.display_name, user.displayName, user.name),
        username: pickFirstString(user.username, user.user_login),
        avatar: pickFirstString(user.avatar, user.avatarUrl, user.avatar_url),
    };
}

const raw = computed(() => props.event?.raw || {});
const eventSnapshot = computed(() => raw.value?.eventSnapshot || {});
const eventCurrent = computed(() => raw.value?.eventCurrent || {});

const mergedEvent = computed(() => ({
    ...(eventCurrent.value || {}),
    ...(eventSnapshot.value || {}),
}));

const eventColor = computed(() => normalizeHexColor(
    props.event?.color
    || raw.value?.eventColorSkin
    || mergedEvent.value?.eventColorSkin
    || '#5549FF'
));

const popupStyle = computed(() => ({
    borderColor: eventColor.value,
    boxShadow: `0px 0px 8px 0px ${eventColor.value}80`,
}));

const startDate = computed(() => {
    const source = props.event?.start || raw.value?.startIso || raw.value?.startAtIso || raw.value?.start;
    const parsed = new Date(source);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
});

const endDate = computed(() => {
    const source = props.event?.end || raw.value?.endIso || raw.value?.endAtIso || raw.value?.end;
    const parsed = new Date(source);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
});

const titleText = computed(() => (
    props.event?.title
    || raw.value?.eventTitle
    || mergedEvent.value?.title
    || 'Untitled Booking'
));

const formattedDate = computed(() => {
    if (!startDate.value) return 'Date not set';
    const options = { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' };
    return startDate.value.toLocaleDateString('en-US', options);
});

const formattedTimeRange = computed(() => {
    if (!startDate.value || !endDate.value) return 'Time not set';
    return `${hhmm(startDate.value)} - ${hhmm(endDate.value)}`;
});

const duration = computed(() => {
    if (!startDate.value || !endDate.value) return Number(raw.value?.durationMinutes || 0) || 0;
    const diff = endDate.value.getTime() - startDate.value.getTime();
    return Math.max(0, Math.floor(diff / 1000 / 60));
});

const statusLabel = computed(() => String(raw.value?.status || props.event?.status || '').toLowerCase());

const statusHint = computed(() => {
    if (!startDate.value || !endDate.value) return statusLabel.value ? titleCaseFromKey(statusLabel.value) : '';

    const now = Date.now();
    const startMs = startDate.value.getTime();
    const endMs = endDate.value.getTime();

    if (now >= startMs && now < endMs) return 'live now';

    const msToStart = startMs - now;
    if (msToStart > 0) {
        const minutesToStart = Math.ceil(msToStart / 60000);
        if (minutesToStart < 60) {
            return `in ${minutesToStart} ${minutesToStart === 1 ? 'min' : 'mins'}`;
        }

        const hoursToStart = Math.ceil(msToStart / 3600000);
        if (hoursToStart < 24) {
            return `in ${hoursToStart} ${hoursToStart === 1 ? 'hr' : 'hrs'}`;
        }

        const weekday = startDate.value.toLocaleDateString('en-US', { weekday: 'short' });
        const day = startDate.value.toLocaleDateString('en-US', { day: '2-digit' });
        const month = startDate.value.toLocaleDateString('en-US', { month: 'short' });
        const year = startDate.value.toLocaleDateString('en-US', { year: 'numeric' });
        const time = startDate.value.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
        return `${weekday} ${day} ${month} ${year} ${time}`;
    }

    if (statusLabel.value) return titleCaseFromKey(statusLabel.value);
    return '';
});

const statusDotColor = computed(() => {
    if (statusHint.value === 'live now') return '#22C55E';
    const label = statusLabel.value;
    if (label === 'confirmed' || label === 'completed') return '#22C55E';
    if (label === 'pending' || label === 'pending_hold') return '#F59E0B';
    if (label.startsWith('cancelled')) return '#EF4444';
    return '#6B7280';
});

const bookingId = computed(() => raw.value?.bookingId || props.event?.bookingId || null);
const eventId = computed(() => raw.value?.eventId || props.event?.eventId || null);
const joinState = computed(() => getBookingJoinState({
    bookingId: bookingId.value,
    startAt: startDate.value,
    endAt: endDate.value,
    status: statusLabel.value,
    enableCallReminderMinutesBefore: firstDefined(
        props.event?.enableCallReminderMinutesBefore,
        raw.value?.enableCallReminderMinutesBefore,
        eventSnapshot.value?.enableCallReminderMinutesBefore,
        eventCurrent.value?.enableCallReminderMinutesBefore,
        props.event?.setReminders,
        raw.value?.setReminders,
        eventSnapshot.value?.setReminders,
        eventCurrent.value?.setReminders,
    ),
    callReminderMinutesBefore: firstDefined(
        props.event?.callReminderMinutesBefore,
        raw.value?.callReminderMinutesBefore,
        raw.value?.reminderMinutes,
        mergedEvent.value?.callReminderMinutesBefore,
        mergedEvent.value?.reminderMinutes,
        mergedEvent.value?.remindBeforeMinutes,
    ),
    reminderMinutes: firstDefined(
        raw.value?.reminderMinutes,
        props.event?.reminderMinutes,
        mergedEvent.value?.reminderMinutes,
    ),
    extensions: firstDefined(props.event?.extensions, raw.value?.extensions, []),
}));
const showJoinButton = computed(() => joinState.value.canJoin);

function handleJoin() {
    menuOpen.value = false;
    emit('join-call', {
        bookingId: bookingId.value,
        eventId: eventId.value,
        joinUrl: joinState.value.joinUrl || null,
        event: props.event,
    });
}

const canReviewPending = computed(() => props.canReviewPending && statusLabel.value === 'pending');
const showRejectConfirm = ref(false);

watch(
    () => bookingId.value,
    () => {
        showRejectConfirm.value = false;
        menuOpen.value = false;
    }
);

function toggleMenu() {
    menuOpen.value = !menuOpen.value;
}

function handleCancelCall() {
    menuOpen.value = false;
    emit('cancel-booking', {
        bookingId: bookingId.value,
        eventId: eventId.value,
        event: props.event,
    });
}

function emitReviewAction(decision) {
    emit(decision === 'approve' ? 'approve-booking' : 'reject-booking', {
        bookingId: bookingId.value,
        eventId: eventId.value,
        decision,
        event: props.event,
    });
}

function handleApprove() {
    showRejectConfirm.value = false;
    emitReviewAction('approve');
}

function handleReject() {
    showRejectConfirm.value = true;
}

function confirmReject() {
    showRejectConfirm.value = false;
    emitReviewAction('reject');
}

function cancelReject() {
    showRejectConfirm.value = false;
}

const handleDocumentClick = () => {
    menuOpen.value = false;
};

onMounted(() => {
    document.addEventListener('click', handleDocumentClick);
});

onBeforeUnmount(() => {
    document.removeEventListener('click', handleDocumentClick);
    if (guestProfileAbortController) {
        guestProfileAbortController.abort();
        guestProfileAbortController = null;
    }
});

const guestCount = computed(() => {
    const value = Number(raw.value?.guestCount || 1);
    return Number.isFinite(value) && value > 0 ? value : 1;
});

const guestHeading = computed(() => `${guestCount.value} guest${guestCount.value === 1 ? '' : 's'}`);

const viewerRole = computed(() => String(props.userRole || 'creator').toLowerCase());
const isFanViewer = computed(() => viewerRole.value === 'fan');

const creatorUserId = computed(() => firstDefined(
    raw.value?.creatorId,
    props.event?.creatorId,
    null
));

const fanUserId = computed(() => firstDefined(
    raw.value?.userId,
    props.event?.userId,
    null
));

const guestUserId = computed(() => (isFanViewer.value ? creatorUserId.value : fanUserId.value));
const guestProfile = ref(null);
const guestProfileLoading = ref(false);
const guestProfileError = ref(null);
let guestProfileAbortController = null;

const fallbackGuestDisplayName = computed(() => {
    const fallbackId = guestUserId.value;

    if (isFanViewer.value) {
        return (
            pickFirstString(
                raw.value?.creatorDisplayName,
                raw.value?.creatorName,
                raw.value?.creatorUsername,
            )
            || (fallbackId ? `User #${fallbackId}` : 'Guest')
        );
    }

    return (
        pickFirstString(
            raw.value?.userDisplayName,
            raw.value?.userName,
            raw.value?.userUsername,
        )
        || (fallbackId ? `User #${fallbackId}` : 'Guest')
    );
});

const fallbackGuestUsername = computed(() => (
    isFanViewer.value
        ? pickFirstString(raw.value?.creatorUsername)
        : pickFirstString(raw.value?.userUsername)
));

const guestDisplayName = computed(() => (
    pickFirstString(guestProfile.value?.displayName, fallbackGuestDisplayName.value)
));

const guestUsername = computed(() => (
    pickFirstString(guestProfile.value?.username, fallbackGuestUsername.value)
));

const fallbackGuestAvatar = computed(() => (
    isFanViewer.value
        ? pickFirstString(raw.value?.creatorAvatarUrl, raw.value?.creatorAvatar)
        : pickFirstString(raw.value?.userAvatarUrl, raw.value?.userAvatar)
));

const guestAvatar = computed(() => pickFirstString(guestProfile.value?.avatar, fallbackGuestAvatar.value) || null);

watch(
    () => guestUserId.value,
    async (userId) => {
        if (guestProfileAbortController) {
            guestProfileAbortController.abort();
            guestProfileAbortController = null;
        }

        guestProfile.value = null;
        guestProfileError.value = null;

        if (!userId) {
            guestProfileLoading.value = false;
            return;
        }

        const controller = new AbortController();
        guestProfileAbortController = controller;
        guestProfileLoading.value = true;

        try {
            const response = await fetch(
                `${buildWpApiUrl('/users/get-profile-data')}?id=${encodeURIComponent(userId)}`,
                {
                    method: 'GET',
                    headers: { Accept: 'application/json' },
                    signal: controller.signal,
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch guest profile (HTTP ${response.status}).`);
            }

            const payload = await response.json();
            guestProfile.value = normalizeGuestProfile(payload?.user);
        } catch (error) {
            if (error?.name === 'AbortError') return;
            guestProfileError.value = error;
        } finally {
            if (guestProfileAbortController === controller) {
                guestProfileAbortController = null;
                guestProfileLoading.value = false;
            }
        }
    },
    { immediate: true }
);

const additionalRequestLines = computed(() => {
    const lines = [];

    const requestedAddOns = Array.isArray(raw.value?.requestedAddOns) ? raw.value.requestedAddOns : [];
    requestedAddOns.forEach((item) => {
        if (typeof item === 'string' && item.trim()) {
            lines.push(item.trim());
            return;
        }
        const label = item?.title || item?.name || item?.label;
        if (typeof label === 'string' && label.trim()) {
            lines.push(label.trim());
        }
    });

    const additionalRequests = raw.value?.additionalRequests || {};
    Object.entries(additionalRequests).forEach(([key, value]) => {
        if (value === true) {
            lines.push(titleCaseFromKey(key));
            return;
        }
        if (typeof value === 'string' && value.trim()) {
            lines.push(`${titleCaseFromKey(key)}: ${value.trim()}`);
            return;
        }
        if (typeof value === 'number' && Number.isFinite(value)) {
            lines.push(`${titleCaseFromKey(key)}: ${value}`);
        }
    });

    const personalRequestText = String(raw.value?.personalRequestText || '').trim();
    if (personalRequestText) {
        lines.push(personalRequestText);
    }

    return lines.length > 0 ? lines : ['No additional request'];
});

const minimumChargeLabel = computed(() => {
    const payment = raw.value?.payment || {};
    const lineTotal = Array.isArray(payment?.lines)
        ? payment.lines.reduce((sum, line) => sum + Number(line?.amount || 0), 0)
        : 0;
    const total = Number(payment?.total ?? raw.value?.paymentTotal ?? lineTotal ?? 0);
    const currency = String(payment?.currency || raw.value?.paymentCurrency || 'TOKENS').toUpperCase();

    if (!Number.isFinite(total) || total <= 0) return 'Not set';
    if (currency === 'TOKENS') return `${Math.ceil(total)} tokens`;

    return `${currency} ${total}`;
});

const reminderLabel = computed(() => {
    const reminderMinutes = Number(
        raw.value?.reminderMinutes
        ?? mergedEvent.value?.callReminderMinutesBefore
        ?? mergedEvent.value?.remindBeforeMinutes
        ?? 0
    );
    if (!Number.isFinite(reminderMinutes) || reminderMinutes <= 0) return 'Reminder not set';
    return `${reminderMinutes} minutes before`;
});

const chatUrl = computed(() => (
    raw.value?.chatUrl
    || mergedEvent.value?.chatUrl
    || null
));

const joinUrl = computed(() => (
    joinState.value.joinUrl
    || raw.value?.joinUrl
    || raw.value?.callUrl
    || mergedEvent.value?.joinUrl
    || mergedEvent.value?.callUrl
    || null
));
</script>
