<template>
  <div class="flex flex-col w-full h-full bg-[#F2F4F7] rounded-tl-[1.25rem] rounded-tr-[1.25rem] overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between px-3 py-4 flex-shrink-0">
      <div class="h-[18px] w-[18px]"> </div>
      <h2 class="text-sm font-semibold text-[#0C111D]">Events &amp; Requests</h2>
      <button
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
          <span
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
      <EventsWidget
        :sections="activeSections"
        :user-role="userRole"
        @join-click="$emit('join-click', $event)"
        @reply-click="$emit('reply-click', $event)"
        @event-click="$emit('event-click', $event)"
        @menu-action="$emit('menu-action', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useBookingTranslations } from '@/i18n/bookingTranslations.js';
import EventsWidget from './EventsWidget.vue';

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
});

defineEmits(['close', 'join-click', 'reply-click', 'event-click', 'menu-action']);

const activeTab = ref('confirmed');

// Split eventsData into confirmed vs pending based on section title
const confirmedSections = computed(() =>
  (props.eventsData || []).filter(
    (s) => String(s.title || '').toUpperCase() !== 'PENDING EVENTS',
  ),
);

const pendingSections = computed(() =>
  (props.eventsData || []).filter(
    (s) => String(s.title || '').toUpperCase() === 'PENDING EVENTS',
  ),
);

const confirmedCount = computed(() =>
  confirmedSections.value.reduce((n, s) => n + (s.items?.length || 0), 0),
);

const pendingCount = computed(() =>
  pendingSections.value.reduce((n, s) => n + (s.items?.length || 0), 0),
);

const tabs = computed(() => [
  { key: 'confirmed', label: 'Confirmed', count: confirmedCount.value },
  { key: 'pending',   label: 'Pending',   count: pendingCount.value },
]);

const activeSections = computed(() =>
  activeTab.value === 'confirmed' ? confirmedSections.value : pendingSections.value,
);
</script>
