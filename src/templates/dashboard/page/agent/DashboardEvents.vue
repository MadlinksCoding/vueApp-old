<template>
  <DashboardWrapperTwoColContainer>
    <div class="h-[calc(100vh-2rem)] flex flex-col overflow-hidden relative">
      <div class="flex w-full h-full">

        <MainCalendar
          class="flex-1 w-full h-full overflow-y-auto relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          variant="default" :focus-date="state.focus" :events="events1" :theme="theme1"
          :data-attrs="{ 'data-calendar': 'main' }" :console-overlaps="true" :highlight-today-column="true"
          time-start="05:00" time-end="23:00" :slot-minutes="60" :row-height-px="64" :min-event-height-px="0"
          @date-selected="onSelectFromMain">

          <template #event="{ event, style, onClick, view }">
            <div :class="[
              view === 'month' ? 'static' : 'absolute',
              'py-[0.125rem] px-[0.25rem] rounded-[0.375rem] bg-creamViolet text-xs text-white shadow-custom'
            ]" :style="style" @click.stop="onClick(event)">
              <div class="flex items-center font-medium truncate">{{ event.title }}</div>
              <div class="text-[10px]">{{ hhmm(event.start) }} – {{ hhmm(event.end) }}</div>
            </div>
          </template>

          <template #event-alt="{ event, style, onClick, view }">
            <div :class="[
              view === 'month' ? 'static' : 'absolute',
              'py-[0.125rem] px-[0.25rem] rounded-lg bg-white/60 text-blue-600 text-xs shadow-custom'
            ]" :style="style" @click.stop="onClick(event)">
              <div class="font-semibold truncate">{{ event.title }}</div>
              <div class="opacity-90 text-[10px]">{{ hhmm(event.start) }} – {{ hhmm(event.end)
              }}</div>
            </div>
          </template>

          <template #event-custom="{ event, style, onClick, view }">
            <div :class="[
              view === 'month' ? 'static' : 'absolute',
              'py-[0.125rem] px-[0.25rem] rounded-lg bg-brand-pink text-white text-xs shadow-md'
            ]" :style="style" @click.stop="onClick(event)">
              <div class="font-semibold truncate">{{ event.title }}</div>
              <div class="opacity-90 text-[10px]">{{ hhmm(event.start) }} – {{ hhmm(event.end)
              }}</div>
            </div>
          </template>

          <template #event-custom2="{ event, style, onClick, view }">
            <div :class="[
              view === 'month' ? 'static' : 'absolute',
              'py-[0.125rem] px-[0.25rem] text-brand-textPink rounded-lg bg-white/50 shadow-md'
            ]" :style="style" @click.stop="onClick(event)">
              <div class="font-bold text-[0.75rem] truncate">{{ event.title }}</div>
              <div class="text-[10px] ">{{ hhmm(event.start) }} – {{ hhmm(event.end) }}</div>
            </div>
          </template>
        </MainCalendar>

        <div
          class="hidden lg:flex flex-col gap-[16px] px-[24px] h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <MiniCalendar class="md:col-span-1 " :month-date="state.focus" :selected-date="state.selected || state.focus"
            :events="events1" :theme="theme1" :data-attrs="{ 'data-calendar': 'mini' }"
            @date-selected="onSelectFromMini">
          </MiniCalendar>

          <div class="relative w-full z-[999]" ref="popupTrigger">
            <ButtonComponent text="NEW EVENTS" variant="none"
              customClass="group w-full h-12 min-h-10 px-4 py-2 text-base font-semibold bg-black rounded-[48px] inline-flex justify-center items-center gap-2 text-[#07F468] hover:text-black hover:bg-[#07F468]"
              :leftIcon="'https://i.ibb.co.com/RpWmJkcb/plus.webp'" :leftIconClass="`
          w-6 h-6 transition duration-200 group-hover:[filter:brightness(0)_saturate(100%)]`" @click="togglePopup" />

            <div v-show="isCreatePopupOpen" class="fixed z-[999]" :style="popupStyle">
              <CreateEventPopup />
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
        <NewEventsPopup />
      </PopupHandler>

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
import { ref, onMounted, reactive } from 'vue';
import CreateEventPopup from '@/components/calendar/CreateEventPopup.vue';
import NewEventsPopup from '@/components/calendar/NewEventsPopup.vue';
import PopupHandler from '@/components/ui/popup/PopupHandler.vue';

const isCreatePopupOpen = ref(false);
const newEventsPopupOpen = ref(false);

const popupTrigger = ref(null);
const popupStyle = reactive({ top: '0px', left: '0px' });

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

// Update position on scroll or resize to keep it attached
onMounted(() => {
  window.addEventListener('resize', () => {
    if (isCreatePopupOpen.value) updatePopupPosition();
  });
  window.addEventListener('scroll', () => {
    if (isCreatePopupOpen.value) updatePopupPosition();
  }, true); // Capture phase for scrolling of parent containers
});

const now = new Date();
const y = now.getFullYear();
const m = now.getMonth();

// CHANGE: Helper to generate ISO Strings (JSON format)
// Example output: "2026-01-14T10:00:00"
const getIsoString = (dayOfMonth, hour, minute) => {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${y}-${pad(m + 1)}-${pad(dayOfMonth)}T${pad(hour)}:${pad(minute)}:00`;
};

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

// --- THEME 2 ---
const theme2 = {
  mini: {},
  main: {
    wrapper: 'relative flex flex-col pt-[1.5rem] gap-[0px] overflow-hidden rounded-xl',
    title: 'sm:text-[1.5rem] text-[16px] font-semibold text-slate-800 ',
    xHeader: '',
    axisXLabel: 'flex flex-col justify-end pb-[0.75rem] w-[4.875rem]',
    axisXDay: 'py-1 text-center h-[63.92px] text-slate-500 font-medium',
    axisXToday: 'bg-gray-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto',
    axisYRow: 'h-[62.62px] text-right pr-4 w-[2.4rem] uppercase text-slate-400 text-[11px] font-medium leading-4 pt-1',
    colBase: 'relative bg-white/20 border-l border-white/50 overflow-hidden',
    gridRow: 'h-[62.61px] border-b border-white/50',
    eventBase: 'absolute mx-1 rounded-md p-2 text-xs shadow-sm'
  },
  month: {}
};

// --- DEMO 1 (Original Data - kept as Date Objects for backward compat check) ---
const events1 = ref([
  { id: 'e1', title: 'Group Call1', start: new Date(y, m, 11, 15, 30), end: new Date(y, m, 11, 17, 15), slot: 'custom' },
  { id: 'e2', title: 'Live Call2', start: new Date(y, m, 12, 12, 0), end: new Date(y, m, 12, 14, 0), slot: 'alt' },
  { id: 'e3', title: 'Live Call', start: new Date(y, m, 13, 6, 0), end: new Date(y, m, 13, 7, 0) },
  { id: 'e4', title: 'Group Call', start: new Date(y, m, 14, 10, 0), end: new Date(y, m, 14, 16, 0), slot: 'custom2' },
  { id: 'e4', title: 'Group Call', start: new Date(y, m, 15, 10, 0), end: new Date(y, m, 15, 16, 0), slot: 'custom2' },
]);

// --- CHANGE: DEMO 2 (JSON Array Format) ---
// These start/end values are now ISO STRINGS, not Date objects.
const events2 = ref([
  { id: 'e1', title: 'High School Life Simulator', start: getIsoString(11, 10, 0), end: getIsoString(11, 21, 0), slot: 'event' },
  { id: 'e1-dup', title: 'Maid Cafe Simulator', start: getIsoString(11, 0, 0), end: getIsoString(11, 11, 0), slot: 'alt' },
  { id: 'e2', title: 'Event Title', start: getIsoString(12, 0, 0), end: getIsoString(12, 4, 0), slot: 'custom' },
  { id: 'e3', title: 'Maid Cafe Simulator', start: getIsoString(12, 1, 0), end: getIsoString(12, 11, 0), slot: 'alt' },
  { id: 'e4', title: 'Event Title', start: getIsoString(13, 0, 0), end: getIsoString(13, 4, 0), slot: 'custom' },
  { id: 'e5', title: 'Event Title', start: getIsoString(14, 22, 0), end: getIsoString(14, 23, 0), slot: 'custom' },
  { id: 'e6', title: 'Maid Cafe Simulator', start: getIsoString(14, 0, 0), end: getIsoString(14, 4, 0), slot: 'alt' },
  { id: 'e7', title: 'Event Title', start: getIsoString(15, 0, 0), end: getIsoString(15, 8, 0), slot: 'custom' },
  { id: 'e8', title: 'Event Title', start: getIsoString(16, 2, 0), end: getIsoString(16, 8, 0), slot: 'custom' },
  { id: 'e9', title: 'Maid Cafe Simulator', start: getIsoString(16, 0, 0), end: getIsoString(16, 21, 0), slot: 'alt' },
  { id: 'e10', title: 'Event Title', start: getIsoString(17, 0, 0), end: getIsoString(17, 5, 0), slot: 'custom' },
  { id: 'e11', title: 'Event Title', start: getIsoString(17, 22, 0), end: getIsoString(17, 23, 0), slot: 'custom' },
  { id: '12', title: 'High School Life Simulator', start: getIsoString(17, 8, 0), end: getIsoString(17, 20, 0), slot: 'event' },
  { id: 'e13', title: 'J&B’s Cooking show', start: getIsoString(13, 5, 0), end: getIsoString(13, 9, 0), slot: 'custom2' },
]);

const eventsData = ref([
  {
    title: 'TODAY',
    items: [
      {
        time: '2:15pm-9:30pm',
        title: 'Live call',
        titleColorClass: 'text-lightViolet',
        borderClass: 'bg-lightViolet',
        bgClass: 'bg-white',
        showJoin: true,
        statusText: 'in 5 min',
        avatars: [{ src: 'https://i.ibb.co/0VQJ0swt/Vector.png', name: 'Apples' }]
      },
      {
        time: '2:15pm-9:30pm',
        title: 'Live call',
        titleColorClass: 'text-lightViolet',
        borderClass: 'bg-lightViolet',
        bgClass: 'bg-gradient-to-r from-gray-50/50 to-gray-50/20',
        showJoin: false,
        avatars: [{ src: 'https://i.ibb.co/XZHymffZ/avatar-of-a-mango.png', name: 'Mangoes' }]
      }
    ]
  },
  {
    title: 'THIS WEEK',
    items: [
      {
        dayName: 'TUE',
        dayNumber: '24',
        title: 'Group call',
        titleColorClass: 'text-activePink',
        borderClass: 'bg-brightPink',
        bgClass: 'bg-gradient-to-r from-gray-50/50 to-gray-50/20',
        isGroup: true,
        groupText: 'Mangoes, Apples and 30+',
        avatars: [
          { src: 'https://i.ibb.co/Y7qvLWpv/user-avatar-but-with-green-pear-face-as-head-pink-background-1.png' },
          { src: 'https://i.ibb.co/XZHymffZ/avatar-of-a-mango.png' },
          { src: 'https://i.ibb.co/0VQJ0swt/Vector.png' }
        ]
      },
      {
        dayName: 'WED',
        dayNumber: '25',
        title: 'Live call',
        titleColorClass: 'text-lightViolet',
        borderClass: 'bg-lightViolet',
        bgClass: 'bg-gradient-to-r from-gray-50/50 to-gray-50/20',
        avatars: [{ src: 'https://i.ibb.co/XZHymffZ/avatar-of-a-mango.png', name: 'Mangoes' }]
      }
    ]
  },
  {
    title: 'PENDING EVENTS',
    items: [
      {
        dayName: 'WED',
        dayNumber: '25',
        title: 'Live call',
        titleColorClass: 'text-gray-900',
        borderClass: 'bg-customDarkGrey',
        bgClass: 'bg-gradient-to-r from-gray-50/50 to-gray-50/20',
        showReply: true,
        avatars: [{ src: 'https://i.ibb.co/0VQJ0swt/Vector.png', name: 'Apples' }]
      },
      {
        dayName: 'SAT',
        dayNumber: '28',
        title: 'Live call',
        titleColorClass: 'text-gray-900',
        borderClass: 'bg-customDarkGrey',
        bgClass: 'bg-gradient-to-r from-gray-50/50 to-gray-50/40',
        showReply: true,
        avatars: [{ src: 'https://i.ibb.co/Y7qvLWpv/user-avatar-but-with-green-pear-face-as-head-pink-background-1.png', name: 'Grapes' }]
      }
    ]
  }
]);

const state = reactive({
  focus: new Date(y, m, 23),
  selected: null,
  view: 'week'
});

const onSelectFromMini = (date) => {
  state.selected = new Date(date);
  state.focus = new Date(date);
};

const onSelectFromMain = (date) => {
  state.selected = new Date(date);
  state.focus = new Date(date); // Ye line zaroori hai sync ke liye
};

// Event click listener
onMounted(() => {
  document.addEventListener('calendar:event-click', (e) => {
    console.log('[listener] event-click → event object:', e.detail.event);
  });
});

// Helper stubs for EventsWidget
const handleJoin = (item) => console.log('Join', item);
const handleReply = (item) => console.log('Reply', item);
</script>