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
                                <div class="inline-flex justify-center items-center gap-2">
                                    <div class="w-6 h-6 relative" v-if="guestAvatar">
                                        <img class="w-5 h-5 left-[1.17px] top-[1px] absolute" :src="guestAvatar" />
                                    </div>
                                    <div class="inline-flex flex-col justify-center items-start">
                                        <div class="inline-flex items-center gap-1">
                                            <div class="text-gray-900 text-sm font-normal font-['Poppins'] leading-5 line-clamp-1">
                                                {{ guestLabel }}
                                            </div>
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

                    <div class="inline-flex w-full items-center gap-4" v-if="chatUrl">
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
                        <button
                            type="button"
                            class="px-3 py-2 rounded text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                            @click="handleApprove"
                        >
                            Accept
                        </button>
                        <button
                            type="button"
                            class="px-3 py-2 rounded text-xs font-semibold text-white bg-red-500 hover:bg-red-600 cursor-pointer"
                            @click="handleReject"
                        >
                            Reject
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
import { computed, ref, watch } from 'vue';
import { hhmm } from '@/utils/calendarHelpers.js';

const props = defineProps({
    event: {
        type: Object,
        default: () => ({})
    }
});

const emit = defineEmits(['join-call', 'approve-booking', 'reject-booking']);

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

    const minutesToStart = Math.floor((startMs - now) / 60000);
    if (minutesToStart >= 0 && minutesToStart <= 120) {
        return `in ${minutesToStart} min`;
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

const showJoinButton = computed(() => {
    if (joinUrl.value) return true;
    const label = statusLabel.value;
    return label === 'confirmed' || label === 'completed' || label === 'pending_hold' || statusHint.value === 'live now';
});

function handleJoin() {
    emit('join-call', {
        bookingId: raw.value?.bookingId || props.event?.bookingId || null,
        eventId: raw.value?.eventId || props.event?.eventId || null,
        joinUrl: joinUrl.value || null,
        event: props.event,
    });
}

const bookingId = computed(() => raw.value?.bookingId || props.event?.bookingId || null);
const eventId = computed(() => raw.value?.eventId || props.event?.eventId || null);
const canReviewPending = computed(() => statusLabel.value === 'pending');
const showRejectConfirm = ref(false);

watch(
    () => bookingId.value,
    () => {
        showRejectConfirm.value = false;
    }
);

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

const guestCount = computed(() => {
    const value = Number(raw.value?.guestCount || 1);
    return Number.isFinite(value) && value > 0 ? value : 1;
});

const guestHeading = computed(() => `${guestCount.value} guest${guestCount.value === 1 ? '' : 's'}`);

const guestLabel = computed(() => (
    pickFirstString(
        raw.value?.userDisplayName,
        raw.value?.userName,
        raw.value?.userUsername,
    )
    || (raw.value?.userId ? `User #${raw.value.userId}` : 'Guest')
));

const guestAvatar = computed(() => raw.value?.userAvatarUrl || null);

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
    raw.value?.joinUrl
    || raw.value?.callUrl
    || mergedEvent.value?.joinUrl
    || mergedEvent.value?.callUrl
    || null
));
</script>
