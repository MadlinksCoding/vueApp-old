<template>
  <DashboardWrapperTwoColContainer>
    <div class="h-[calc(100vh-2rem)] flex flex-col overflow-hidden relative">
      <div class="flex w-full h-full">

        <MainCalendar
          class="flex-1 w-full h-full overflow-y-auto relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          variant="default" :focus-date="state.focus" :events="events1" :theme="theme1"
          :data-attrs="{ 'data-calendar': 'main' }" :console-overlaps="true" :highlight-today-column="true"
          time-start="00:00" time-end="24:00" :slot-minutes="60" :row-height-px="64" :min-event-height-px="0"
          @date-selected="onSelectFromMain"
          @approve-booking="onApprovePendingBooking"
          @reject-booking="onRejectPendingBooking">

          <template #event="{ event, style, onClick, view }">
            <div :class="[
              view === 'month' ? 'static' : 'absolute',
              event?.isAvailabilityBlock ? 'pointer-events-none' : '',
              'py-[0.125rem] px-[0.25rem] rounded-[0.375rem] text-xs shadow-custom'
            ]" :style="[style, getCalendarEventStyle(event)]" @click.stop="!event?.isAvailabilityBlock && onClick(event)">
              <template v-if="!event?.isAvailabilityBlock">
                <div class="flex items-center font-medium truncate">{{ event.title }}</div>
                <div class="text-[10px]">{{ hhmm(event.start) }} – {{ hhmm(event.end) }}</div>
              </template>
            </div>
          </template>

          <template #event-alt="{ event, style, onClick, view }">
            <div :class="[
              view === 'month' ? 'static' : 'absolute',
              event?.isAvailabilityBlock ? 'pointer-events-none' : '',
              'py-[0.125rem] px-[0.25rem] rounded-lg text-xs shadow-custom'
            ]" :style="[style, getCalendarEventStyle(event)]" @click.stop="!event?.isAvailabilityBlock && onClick(event)">
              <template v-if="!event?.isAvailabilityBlock">
                <div class="font-semibold truncate">{{ event.title }}</div>
                <div class="opacity-90 text-[10px]">{{ hhmm(event.start) }} – {{ hhmm(event.end) }}</div>
              </template>
            </div>
          </template>

          <template #event-custom="{ event, style, onClick, view }">
            <div :class="[
              view === 'month' ? 'static' : 'absolute',
              event?.isAvailabilityBlock ? 'pointer-events-none' : '',
              'py-[0.125rem] px-[0.25rem] rounded-lg text-xs shadow-md'
            ]" :style="[style, getCalendarEventStyle(event)]" @click.stop="!event?.isAvailabilityBlock && onClick(event)">
              <template v-if="!event?.isAvailabilityBlock">
                <div class="font-semibold truncate">{{ event.title }}</div>
                <div class="opacity-90 text-[10px]">{{ hhmm(event.start) }} – {{ hhmm(event.end) }}</div>
              </template>
            </div>
          </template>

          <template #event-custom2="{ event, style, onClick, view }">
            <div :class="[
              view === 'month' ? 'static' : 'absolute',
              event?.isAvailabilityBlock ? 'pointer-events-none' : '',
              'py-[0.125rem] px-[0.25rem] rounded-lg shadow-md'
            ]" :style="[style, getCalendarEventStyle(event)]" @click.stop="!event?.isAvailabilityBlock && onClick(event)">
              <template v-if="!event?.isAvailabilityBlock">
                <div class="font-bold text-[0.75rem] truncate">{{ event.title }}</div>
                <div class="text-[10px] ">{{ hhmm(event.start) }} – {{ hhmm(event.end) }}</div>
              </template>
            </div>
          </template>

          <template #event-availability="{ event, style, view }">
            <div :class="[
              view === 'month' ? 'static' : 'absolute',
              'pointer-events-none rounded-md min-h-[6px] w-full'
            ]" :style="[style, getCalendarEventStyle(event)]" />
          </template>
        </MainCalendar>

        <div
          class="hidden lg:flex flex-col gap-[16px] px-[24px] h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <MiniCalendar class="md:col-span-1 " :month-date="state.focus" :selected-date="state.selected || state.focus"
            :events="miniEvents" :theme="theme1" :data-attrs="{ 'data-calendar': 'mini' }"
            @date-selected="onSelectFromMini">
          </MiniCalendar>

          <div v-if="dashboardEventsEngine.state.events.error"
            class="px-3 py-2 rounded bg-red-50 text-red-700 text-xs font-medium">
            {{ dashboardEventsEngine.state.events.error }}
          </div>
          <div v-else-if="dashboardEventsEngine.state.events.loading"
            class="px-3 py-2 rounded bg-gray-100 text-gray-600 text-xs font-medium">
            Loading booked slots...
          </div>

          <div class="relative w-full z-[999]" ref="popupTrigger">
            <ButtonComponent text="NEW EVENTS" variant="none"
              customClass="group w-full h-12 min-h-10 px-4 py-2 text-base font-semibold bg-black rounded-[48px] inline-flex justify-center items-center gap-2 text-[#07F468] hover:text-black hover:bg-[#07F468]"
              :leftIcon="'https://i.ibb.co.com/RpWmJkcb/plus.webp'" :leftIconClass="`
          w-6 h-6 transition duration-200 group-hover:[filter:brightness(0)_saturate(100%)]`" @click="togglePopup" />

            <div v-show="isCreatePopupOpen" class="fixed z-[999]" :style="popupStyle">
              <CreateEventPopup
                @create-private="goToCreateEvent('private')"
                @create-group="goToCreateEvent('group')" />
            </div>
          </div>

          <div>
            <EventsWidget :sections="eventsData" @join-click="handleJoin" @reply-click="handleReply" />
          </div>
        </div>

        <div class="fixed bottom-5 right-5 z-50" @click="newEventsPopupOpen = true">
          <button
            class="bg-[#ff0464] w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
            <img src="https://i.ibb.co.com/RpWmJkcb/plus.webp" class="w-6 h-6 filter brightness-0 invert" alt="Add" />
          </button>
        </div>
      </div>

      <PopupHandler v-model="newEventsPopupOpen" :config="newEventsPopupConfig">
        <NewEventsPopup
          @create-private="goToCreateEvent('private')"
          @create-group="goToCreateEvent('group')" />
      </PopupHandler>

      <ToastHost />

    </div>

  </DashboardWrapperTwoColContainer>
</template>

<script setup>
import { hhmm } from '@/utils/calendarHelpers.js';
import MiniCalendar from '@/components/calendar/MiniCalendar.vue';
import MainCalendar from '@/components/calendar/MainCalendar.vue';
import DashboardWrapperTwoColContainer from '@/components/dashboard/DashboardWrapperTwoColContainer.vue';
import ButtonComponent from '@/components/dev/button/ButtonComponent.vue';
import EventsWidget from '@/components/calendar/EventsWidget.vue';
import { ref, onMounted, reactive, onUnmounted, computed } from 'vue';
import CreateEventPopup from '@/components/calendar/CreateEventPopup.vue';
import NewEventsPopup from '@/components/calendar/NewEventsPopup.vue';
import PopupHandler from '@/components/ui/popup/PopupHandler.vue';
import ToastHost from '@/components/ui/toast/ToastHost.vue';
import { useRoute, useRouter } from 'vue-router';
import { createFlowStateEngine } from '@/utils/flowStateEngine.js';
import { mapBookedSlotsToCalendarEvents, mapAvailabilityToCalendarEvents } from '@/services/bookings/utils/bookingSlotUtils.js';
import { showToast } from '@/utils/toastBus.js';

const isCreatePopupOpen = ref(false);
const newEventsPopupOpen = ref(false);
const reviewPendingLoading = ref(false);
const route = useRoute();
const router = useRouter();

const popupTrigger = ref(null);
const popupStyle = reactive({ top: '0px', left: '0px' });
const dashboardEventsEngine = createFlowStateEngine({
  flowId: 'dashboard-events-flow',
  initialStep: 1,
  urlSync: 'none',
  defaults: {
    events: {
      cachedResponse: null,
      list: [],
      bookedList: [],
      creatorEvents: [],
      bookedSlotsRaw: [],
      bookedSlotsIndex: {},
      meta: {},
      loading: false,
      error: null,
    },
  },
});

const newEventsPopupConfig = {
  actionType: "slidein",
  from: "right",
  offset: "0px",
  verticalAlign: "bottom",
  width: { default: "384px", "<768": "100%" },
  height: { default: "auto" },
  speed: "300ms",
  effect: "ease-in-out",
  showOverlay: false,
  closeOnOutside: true,
  lockScroll: false,
};

const updatePopupPosition = () => {
  if (popupTrigger.value) {
    const rect = popupTrigger.value.getBoundingClientRect();
    popupStyle.top = `${rect.bottom + 8}px`; // 8px spacing
    // Align right edge of popup with right edge of button/container
    // Popup width is approx 429px, so we subtract that from rect.right
    // But better to use left if we want it right-aligned? 
    // css 'right' doesn't work easily with fixed left calc, so let's calc left
    // left = rect.right - 429
    popupStyle.left = `${rect.right - 429}px`;
  }
};

const togglePopup = () => {
  isCreatePopupOpen.value = !isCreatePopupOpen.value;
  if (isCreatePopupOpen.value) {
    updatePopupPosition();
  }
};

const handlePositionUpdate = () => {
  if (isCreatePopupOpen.value) updatePopupPosition();
};

const handleClickOutside = (event) => {
  if (!isCreatePopupOpen.value) return;
  const path = event.composedPath ? event.composedPath() : [];
  if (popupTrigger.value && !path.includes(popupTrigger.value)) {
    isCreatePopupOpen.value = false;
  }
};

const resolveCreatorId = () => {
  return 1;
  const fromQuery = Number(route.query?.creatorId);
  if (Number.isFinite(fromQuery)) return fromQuery;

  const fromEngine = Number(dashboardEventsEngine.getState('creatorId'));
  if (Number.isFinite(fromEngine)) return fromEngine;

  if (typeof window !== 'undefined') {
    const fromStorage = Number(window.localStorage?.getItem('creatorId'));
    if (Number.isFinite(fromStorage)) return fromStorage;
  }

  return 1;
};

const buildCalendarSlotsFromContext = ({ creatorEvents = [], bookedSlotsRaw = [], bookedSlotsIndex = {}, focusDate = new Date() }) => {
  const calendarSlots = mapBookedSlotsToCalendarEvents(bookedSlotsRaw, {
    includeStatuses: ['pending', 'pending_hold', 'confirmed', 'completed'],
    titleFallback: 'Booked Slot',
  });

  const colorByEventId = new Map(
    creatorEvents
      .map((event) => [
        String(event?.eventId || event?.id || ''),
        event?.eventColorSkin || event?.raw?.eventColorSkin || DEFAULT_EVENT_COLOR,
      ])
      .filter(([eventId]) => Boolean(eventId))
  );
  const callTypeByEventId = new Map(
    creatorEvents
      .map((event) => [
        String(event?.eventId || event?.id || ''),
        String(event?.eventCallType || event?.raw?.eventCallType || '').toLowerCase(),
      ])
      .filter(([eventId]) => Boolean(eventId))
  );

  const bookedCalendarSlots = calendarSlots.map((slot) => ({
    ...slot,
    eventCallType: callTypeByEventId.get(String(slot?.eventId || '')) || String(slot?.raw?.eventCallType || '').toLowerCase(),
    color: colorByEventId.get(String(slot?.eventId || '')) || DEFAULT_EVENT_COLOR,
    raw: {
      ...(slot?.raw || {}),
      eventCallType: callTypeByEventId.get(String(slot?.eventId || '')) || String(slot?.raw?.eventCallType || '').toLowerCase(),
    },
  }));

  const availabilitySlots = mapAvailabilityToCalendarEvents(creatorEvents, {
    bookedSlotsIndex,
    focusDate,
    rangeDaysBefore: 14,
    rangeDaysAfter: 56,
  }).map((slot) => ({
    ...slot,
    color: '#98A2B3',
    eventCallType: callTypeByEventId.get(String(slot?.eventId || '')) || String(slot?.eventCallType || '').toLowerCase(),
    raw: {
      ...(slot?.raw || {}),
      eventCallType: callTypeByEventId.get(String(slot?.eventId || '')) || String(slot?.eventCallType || '').toLowerCase(),
    },
  }));

  return {
    bookedCalendarSlots,
    calendarSlots: [...availabilitySlots, ...bookedCalendarSlots],
  };
};

const rebuildAvailabilityForFocusDate = () => {
  const creatorEvents = dashboardEventsEngine.state?.events?.creatorEvents;
  const bookedSlotsRaw = dashboardEventsEngine.state?.events?.bookedSlotsRaw;
  const bookedSlotsIndex = dashboardEventsEngine.state?.events?.bookedSlotsIndex;

  if (!Array.isArray(creatorEvents) || creatorEvents.length === 0) return;
  if (!Array.isArray(bookedSlotsRaw)) return;

  const { calendarSlots } = buildCalendarSlotsFromContext({
    creatorEvents,
    bookedSlotsRaw,
    bookedSlotsIndex: bookedSlotsIndex || {},
    focusDate: state.focus,
  });

  dashboardEventsEngine.setState('events.list', calendarSlots, { reason: 'events-focus', silent: true });
};

const fetchCreatorEvents = async (forceRefresh = false) => {
  const creatorId = resolveCreatorId();
  dashboardEventsEngine.setState('creatorId', creatorId, { reason: 'events-fetch', silent: true });
  dashboardEventsEngine.setState('events.loading', true, { reason: 'events-fetch', silent: true });

  const result = await dashboardEventsEngine.callFlow(
    'bookings.fetchCreatorBookingContext',
    {
      creatorId,
      periodMonths: 6,
      slotLimit: 1000,
      statusIn: 'pending,pending_hold,confirmed,completed',
    },
    {
      forceRefresh,
      context: {
        stateEngine: dashboardEventsEngine,
        creatorId,
      },
    },
  );

  if (!result?.ok) {
    const message = result?.meta?.uiErrors?.[0]
      || result?.error?.message
      || 'Could not load booked slots.';
    dashboardEventsEngine.setState('events.error', message, { reason: 'events-fetch' });
    dashboardEventsEngine.setState('events.list', [], { reason: 'events-fetch', silent: true });
    dashboardEventsEngine.setState('events.bookedList', [], { reason: 'events-fetch', silent: true });
    dashboardEventsEngine.setState('events.creatorEvents', [], { reason: 'events-fetch', silent: true });
    dashboardEventsEngine.setState('events.bookedSlotsRaw', [], { reason: 'events-fetch', silent: true });
    dashboardEventsEngine.setState('events.bookedSlotsIndex', {}, { reason: 'events-fetch', silent: true });
  } else {
    const creatorEvents = Array.isArray(result?.data?.events) ? result.data.events : [];
    const bookedSlotsRaw = Array.isArray(result?.data?.bookedSlots) ? result.data.bookedSlots : [];
    const bookedSlotsIndex = result?.data?.bookedSlotsIndex || {};

    dashboardEventsEngine.setState('events.creatorEvents', creatorEvents, { reason: 'events-fetch', silent: true });
    dashboardEventsEngine.setState('events.bookedSlotsRaw', bookedSlotsRaw, { reason: 'events-fetch', silent: true });
    dashboardEventsEngine.setState('events.bookedSlotsIndex', bookedSlotsIndex, { reason: 'events-fetch', silent: true });

    const { bookedCalendarSlots, calendarSlots } = buildCalendarSlotsFromContext({
      creatorEvents,
      bookedSlotsRaw,
      bookedSlotsIndex,
      focusDate: state.focus,
    });
    dashboardEventsEngine.setState('events.bookedList', bookedCalendarSlots, { reason: 'events-fetch', silent: true });
    dashboardEventsEngine.setState('events.list', calendarSlots, { reason: 'events-fetch', silent: true });
    dashboardEventsEngine.setState('events.error', null, { reason: 'events-fetch', silent: true });
  }

  dashboardEventsEngine.setState('events.loading', false, { reason: 'events-fetch', silent: true });
};

const resolveBookingIdFromPayload = (payload) => {
  const id = payload?.bookingId || payload?.event?.bookingId || payload?.event?.raw?.bookingId || null;
  return id ? String(id) : null;
};

const reviewPendingBooking = async (payload, decision) => {
  const bookingId = resolveBookingIdFromPayload(payload);
  if (!bookingId) {
    showToast({
      type: 'error',
      title: 'Booking Action Failed',
      message: 'Could not find booking id for this request.',
    });
    return;
  }

  if (reviewPendingLoading.value) return;
  reviewPendingLoading.value = true;

  const actionLabel = decision === 'approve' ? 'approved' : 'rejected';

  try {
    const result = await dashboardEventsEngine.callFlow(
      'bookings.reviewPendingBooking',
      {
        bookingId,
        decision,
        actor: 'creator',
        reason: decision === 'approve' ? 'approved_by_creator' : 'rejected_by_creator',
      },
      {
        context: {
          stateEngine: dashboardEventsEngine,
          creatorId: resolveCreatorId(),
        },
      },
    );

    if (!result?.ok) {
      const message = result?.meta?.uiErrors?.[0]
        || result?.error?.message
        || 'Could not update booking approval.';
      showToast({
        type: 'error',
        title: 'Booking Action Failed',
        message,
      });
      return;
    }

    showToast({
      type: 'success',
      title: 'Booking Updated',
      message: `Booking ${actionLabel} successfully.`,
    });

    await fetchCreatorEvents(true);
  } finally {
    reviewPendingLoading.value = false;
  }
};

const onApprovePendingBooking = async (payload) => {
  await reviewPendingBooking(payload, 'approve');
};

const onRejectPendingBooking = async (payload) => {
  await reviewPendingBooking(payload, 'reject');
};

const goToCreateEvent = async (type) => {
  isCreatePopupOpen.value = false;
  newEventsPopupOpen.value = false;
  await router.push({
    path: '/UnifiedBookingForm',
    query: {
      type,
      creatorId: String(resolveCreatorId()),
    },
  });
};

// Update position on scroll or resize to keep it attached
onMounted(() => {
  dashboardEventsEngine.initialize({ fromUrl: false });
  window.addEventListener('resize', handlePositionUpdate);
  window.addEventListener('scroll', handlePositionUpdate, true); // Capture phase for scrolling of parent containers
  document.addEventListener('click', handleClickOutside);

  const shouldForceRefresh = route.query?.refresh === '1';
  // Always force a network read on dashboard open to avoid stale slot cache after recent bookings.
  fetchCreatorEvents(true);

  if (shouldForceRefresh) {
    const nextQuery = { ...route.query };
    delete nextQuery.refresh;
    router.replace({ path: route.path, query: nextQuery });
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', handlePositionUpdate);
  window.removeEventListener('scroll', handlePositionUpdate, true);
  document.removeEventListener('click', handleClickOutside);
});

// --- THEME 1 ---
const theme1 = {
  mini: {
    wrapper: 'flex flex-col w-full font-medium text-gray-500 mt-[10px] gap-[0.625rem] rounded-xl w-[20.375rem]',
    header: 'font-semibold',
    dayBase: 'w-[37.43px] h-[37px] rounded-full flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500',
    outside: 'opacity-0',
    expired: 'opacity-100',
    today: 'bg-gray-500 font-semibold text-white',
    selected: 'rounded-full',
    dot: 'mt-[2rem] w-1.5 h-1.5 rounded-full absolute'
  },
  main: {
    wrapper: 'relative flex flex-col gap-[5.5rem] overflow-hidden rounded-xl h-full',
    title: 'sm:text-[1.5rem] text-[16px] font-semibold text-slate-800 ',
    xHeader: 'absolute text-[11px] uppercase tracking-wide text-slate-500 top-[4rem] xl:top-[5rem] w-full',
    axisXLabel: 'flex flex-col justify-end pb-[0.75rem] w-[4.875rem]',
    axisXDay: 'py-1 text-center h-[63.92px]',
    axisXToday: 'bg-gray-500 text-white rounded-full w-8 h-8 flex items-center justify-center',
    axisYRow: 'h-[62.62px] uppercase text-right pr-2 w-[2.4rem] lg:w-[4.8rem] text-gray-400 text-xs font-medium leading-4',
    colBase: 'relative bg-white/20 overflow-hidden',
    gridRow: 'h-[64px] border-b  border-white/50',
    eventBase: 'absolute mx-1 rounded-md border border-stone-100 bg-white p-2 text-xs shadow-sm'
  },
  month: {
    weekHeader: 'text-[11px] uppercase tracking-wide text-slate-500',
    cellBase: 'h-full w-full p-1 sm:p-2 text-left hover:bg-slate-50 focus:outline-none focus:border-2 focus:border-emerald-500 border border-white/50 flex flex-col items-start justify-start overflow-hidden',
    outside: 'opacity-40',
    today: 'border-2 border-emerald-500',
    cellEvent: 'w-full text-[9px] sm:text-[11px] px-1 sm:px-2 py-0.5 sm:py-1 rounded-md bg-slate-100 border border-slate-200 truncate cursor-pointer'
  }
};

const DEFAULT_EVENT_COLOR = '#5549FF';

function normalizeHexColor(color, fallback = DEFAULT_EVENT_COLOR) {
  if (typeof color !== 'string') return fallback;
  const normalized = color.trim();
  if (/^#([0-9a-fA-F]{3}){1,2}$/.test(normalized)) return normalized;
  return fallback;
}

function hexToRgb(hexColor = DEFAULT_EVENT_COLOR) {
  const hex = normalizeHexColor(hexColor).replace('#', '');
  const full = hex.length === 3
    ? hex.split('').map((char) => char + char).join('')
    : hex;
  const number = Number.parseInt(full, 16);
  return {
    r: (number >> 16) & 255,
    g: (number >> 8) & 255,
    b: number & 255,
  };
}

function rgba(hexColor, alpha = 1) {
  const { r, g, b } = hexToRgb(hexColor);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getCalendarEventStyle(event) {
  if (event?.isAvailabilityBlock) {
    return {
      backgroundColor: 'rgba(152, 162, 179, 0.18)',
      border: '1px solid rgba(152, 162, 179, 0.16)',
      color: 'transparent',
      zIndex: 1,
    };
  }

  const color = normalizeHexColor(
    event?.color || event?.eventColorSkin || event?.raw?.eventColorSkin || DEFAULT_EVENT_COLOR,
    DEFAULT_EVENT_COLOR,
  );

  return {
    backgroundColor: rgba(color, 0.22),
    border: `1px solid ${rgba(color, 0.35)}`,
    borderBottom: `1px solid ${color}`,
    color,
    zIndex: 2,
  };
}

function asDate(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function sameDay(leftDate, rightDate) {
  return (
    leftDate.getFullYear() === rightDate.getFullYear() &&
    leftDate.getMonth() === rightDate.getMonth() &&
    leftDate.getDate() === rightDate.getDate()
  );
}

function isInCurrentWeek(date, now) {
  const dayIndex = now.getDay();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(now.getDate() - dayIndex);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return date >= start && date <= end;
}

function formatWidgetTime(startDate, endDate) {
  return `${hhmm(startDate)}-${hhmm(endDate)}`;
}

function makeAvatar(event) {
  return [{
    src: 'https://i.ibb.co/XZHymffZ/avatar-of-a-mango.png',
    name: event?.raw?.creatorName || 'Creator',
  }];
}

function toWidgetItem(event, options = {}) {
  const startDate = asDate(event.start) || new Date();
  const endDate = asDate(event.end) || startDate;
  const isGroup = event.type === 'group-event';

  const styles = isGroup
    ? { titleColorClass: 'text-activePink', borderClass: 'bg-brightPink' }
    : { titleColorClass: 'text-lightViolet', borderClass: 'bg-lightViolet' };

  if (options.layout === 'today') {
    return {
      time: formatWidgetTime(startDate, endDate),
      title: event.title,
      titleColorClass: styles.titleColorClass,
      borderClass: styles.borderClass,
      bgClass: 'bg-gradient-to-r from-gray-50/50 to-gray-50/20',
      showJoin: true,
      statusText: event.status === 'active' ? 'active' : event.status,
      avatars: makeAvatar(event),
    };
  }

  return {
    dayName: startDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    dayNumber: String(startDate.getDate()),
    title: event.title,
    titleColorClass: styles.titleColorClass,
    borderClass: styles.borderClass,
    bgClass: 'bg-gradient-to-r from-gray-50/50 to-gray-50/20',
    isGroup,
    groupText: isGroup ? 'Group event' : undefined,
    showReply: options.showReply === true,
    avatars: makeAvatar(event),
  };
}

const allEvents = computed(() => {
  const list = dashboardEventsEngine.state?.events?.bookedList;
  if (!Array.isArray(list)) return [];
  return [...list].sort((left, right) => {
    const leftStart = asDate(left.start)?.getTime() || 0;
    const rightStart = asDate(right.start)?.getTime() || 0;
    return leftStart - rightStart;
  });
});

const calendarEvents = computed(() => {
  const list = dashboardEventsEngine.state?.events?.list;
  if (!Array.isArray(list)) return [];
  return [...list].sort((left, right) => {
    const leftStart = asDate(left.start)?.getTime() || 0;
    const rightStart = asDate(right.start)?.getTime() || 0;
    return leftStart - rightStart;
  });
});

const events1 = computed(() => calendarEvents.value.filter((event) => !String(event.status || '').startsWith('cancelled')));
const miniEvents = computed(() => allEvents.value.filter((event) => !String(event.status || '').startsWith('cancelled')));

const eventsData = computed(() => {
  const now = new Date();

  const todayItems = [];
  const weekItems = [];
  const pendingItems = [];

  allEvents.value.forEach((event) => {
    const startDate = asDate(event.start);
    if (!startDate) return;

    const status = String(event.status || '').toLowerCase();
    if (status === 'pending' || status === 'pending_hold') {
      pendingItems.push(toWidgetItem(event, { showReply: true }));
      return;
    }

    if (sameDay(startDate, now)) {
      todayItems.push(toWidgetItem(event, { layout: 'today' }));
      return;
    }

    if (isInCurrentWeek(startDate, now)) {
      weekItems.push(toWidgetItem(event, { layout: 'week' }));
    }
  });

  return [
    { title: 'TODAY', items: todayItems },
    { title: 'THIS WEEK', items: weekItems },
    { title: 'PENDING EVENTS', items: pendingItems },
  ];
});

const state = reactive({
  focus: new Date(),
  selected: null,
  view: 'week'
});

const onSelectFromMini = (date) => {
  state.selected = new Date(date);
  state.focus = new Date(date);
  rebuildAvailabilityForFocusDate();
};

const onSelectFromMain = (date) => {
  state.selected = new Date(date);
  state.focus = new Date(date); // Ye line zaroori hai sync ke liye
  rebuildAvailabilityForFocusDate();
};

const onCalendarEventClick = (event) => {
  console.log('[listener] event-click → event object:', event.detail.event);
};

// Event click listener
onMounted(() => {
  document.addEventListener('calendar:event-click', onCalendarEventClick);
});

onUnmounted(() => {
  document.removeEventListener('calendar:event-click', onCalendarEventClick);
});

// Helper stubs for EventsWidget
const handleJoin = (item) => console.log('Join', item);
const handleReply = (item) => console.log('Reply', item);
</script>
