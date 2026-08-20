<template>
  <div class="flex flex-col w-full h-full bg-[#F2F4F7] rounded-tl-[1.25rem] rounded-tr-[1.25rem] overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between px-3 py-4 flex-shrink-0">
      <div class="h-[18px] w-[18px]"> </div>
      <h2 class="text-sm font-semibold text-[#0C111D]">{{ t('dashboard_events_requests_title') }}</h2>
      <button
        type="button"
        @click="$emit('close')"
        class="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
        :aria-label="t('common_close')"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <!-- Tabs -->
    <div class="flex flex-shrink-0 border-b border-gray-100">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        class="flex-1 flex items-center justify-center gap-1.5 py-2 px-4 h-[3rem] tracking-wide transition-colors relative"
        :class="activeTab === tab.key
          ? ''
          : 'opacity-50'"
      >
        <div class="relative flex items-center gap-1">
          <span class="text-sm font-semibold text-[#0C111D] uppercase">
            {{ tab.label }}
          </span>
          <span v-if="tab.count > 0"
            class="absolute right-[-12px] top-[-12px] text-[#667085] inline-flex items-center justify-center min-w-[1.125rem] px-1 rounded-full text-[0.625rem] font-bold"
          >
            {{ tab.count }}
          </span>
        </div>
        <!-- Active underline -->
        <span
          v-if="activeTab === tab.key"
          class="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900"
        />
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto min-h-0 p-3">
      <BookingScheduleList
        v-if="activeTab === 'schedule'"
        class="px-2 pb-2"
        :events="bookingScheduleEvents"
        :booked-slots-index="bookingScheduleBookedSlotsIndex"
        @edit="$emit('edit-schedule-event', $event)"
        @delete="$emit('delete-schedule-event', $event)"
        @view-card="$emit('view-schedule-card', $event)"
      />

      <EventsWidget
        v-else
        :sections="activeSections"
        :user-role="userRole"
        @join-click="$emit('join-click', $event)"
        @reply-click="$emit('reply-click', $event)"
        @event-click="$emit('event-click', $event)"
        @menu-action="$emit('menu-action', $event)"
        @accept-details="$emit('accept-details', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useBookingTranslations } from '@/i18n/bookingTranslations.js';
import EventsWidget from './EventsWidget.vue';
import BookingScheduleList from './BookingScheduleList.vue';

const { t } = useBookingTranslations();

const props = defineProps({
  eventsData: {
    type: Array,
    default: () => [],
  },
  userRole: {
    type: String,
    default: 'creator',
  },
  bookingScheduleEvents: {
    type: Array,
    default: () => [],
  },
  bookingScheduleBookedSlotsIndex: {
    type: Object,
    default: () => ({}),
  },
});

defineEmits(['close', 'join-click', 'reply-click', 'event-click', 'menu-action', 'approve-booking', 'accept-details', 'edit-schedule-event', 'delete-schedule-event', 'view-schedule-card']);

const activeTab = ref('schedule');

const isPendingSection = (section = {}) => {
  if (typeof section.isPending === 'boolean') return section.isPending;

  return String(section.title || '').trim().toLocaleUpperCase()
    === String(t('dashboard_pending_events')).trim().toLocaleUpperCase();
};

const getSourceEvent = (item = {}) => item?.sourceEvent || item?.event || item || {};

const getBookingStatus = (item = {}) => {
  const sourceEvent = getSourceEvent(item);
  const raw = sourceEvent?.raw && typeof sourceEvent.raw === 'object' ? sourceEvent.raw : {};
  return String(sourceEvent?.status || raw.status || item?.status || '').trim().toLowerCase();
};

const getBookingKey = (item = {}, sectionIndex = 0, itemIndex = 0) => {
  const sourceEvent = getSourceEvent(item);
  const raw = sourceEvent?.raw && typeof sourceEvent.raw === 'object' ? sourceEvent.raw : {};
  return String(
    sourceEvent?.bookingId
      || raw.bookingId
      || item?.bookingId
      || sourceEvent?.id
      || `${sourceEvent?.eventId || item?.eventId || 'event'}:${sourceEvent?.start || item?.time || sectionIndex}:${itemIndex}`,
  );
};

const filterSectionsByStatus = (mode) => {
  const seen = new Set();

  return (props.eventsData || []).map((section, sectionIndex) => {
    const sectionPending = isPendingSection(section);
    const items = (section?.items || []).filter((item, itemIndex) => {
      const status = getBookingStatus(item);
      const pending = status === 'pending' || status === 'pending_hold';
      const matches = status
        ? (mode === 'pending' ? pending : status === 'confirmed')
        : (mode === 'pending' ? (sectionPending || item?.showReply === true) : !sectionPending && item?.showReply !== true);

      if (!matches) return false;

      const key = getBookingKey(item, sectionIndex, itemIndex);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return {
      ...section,
      items,
      isPending: mode === 'pending',
    };
  }).filter((section) => section.items.length > 0);
};

const confirmedSections = computed(() => filterSectionsByStatus('confirmed'));

const pendingSections = computed(() => filterSectionsByStatus('pending'));

const confirmedCount = computed(() =>
  confirmedSections.value.reduce((n, s) => n + (s.items?.length || 0), 0),
);

const pendingCount = computed(() =>
  pendingSections.value.reduce((n, s) => n + (s.items?.length || 0), 0),
);

const tabs = computed(() => [
  { key: 'schedule',  label: t('dashboard_events_requests_schedule_tab'), count: props.bookingScheduleEvents?.length || 0 },
  { key: 'confirmed', label: t('calendar_event_status_confirmed'), count: confirmedCount.value },
  { key: 'pending',   label: t('calendar_event_status_pending'), count: pendingCount.value },
]);

const activeSections = computed(() =>
  activeTab.value === 'confirmed' ? confirmedSections.value : pendingSections.value,
);
</script>
