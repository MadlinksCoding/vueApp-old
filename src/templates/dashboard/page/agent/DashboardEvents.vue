<template>
  <DashboardWrapperTwoColContainer>
    <div class="mb-10">
      <div class="flex w-full">
        
        <main-calendar
          class="md:col-span-2 w-full px-2"
          variant="default"
          :focus-date="state.focus"
          :events="events1"
          :theme="theme1"
          :data-attrs="{ 'data-calendar':'main' }"
          :console-overlaps="true"
          :highlight-today-column="true"
          time-start="05:00"
          time-end="23:00"
          :slot-minutes="60"
          :row-height-px="64"
          :min-event-height-px="0"
          @date-selected="onSelectFromMain">

         <template #event="{ event, style, onClick, view }">
            <div class="absolute py-[0.125rem] px-[0.25rem] rounded-[0.375rem] bg-creamViolet text-xs text-white shadow-custom"
                 :style="style" @click.stop="onClick(event)">
              <div class="flex items-center font-medium truncate">{{ event.title }}</div>
              <div class="text-[10px]" v-if="view !== 'month'">{{ hhmm(event.start) }} – {{ hhmm(event.end) }}</div>
            </div>
          </template>

          <template #event-alt="{ event, style, onClick, view }">
            <div class="absolute py-[0.125rem] px-[0.25rem] rounded-lg bg-white/60 text-blue-600 text-xs shadow-custom"
                 :style="style" @click.stop="onClick(event)">
              <div class="font-semibold truncate">{{ event.title }}</div>
              <div v-if="view !== 'month'" class="opacity-90 text-[10px]">{{ hhmm(event.start) }} – {{ hhmm(event.end) }}</div>
            </div>
          </template>

          <template #event-custom="{ event, style, onClick, view }">
            <div class="absolute py-[0.125rem] px-[0.25rem] rounded-lg bg-brand-pink text-white text-xs shadow-md"
                 :style="style" @click.stop="onClick(event)">
              <div class="font-semibold truncate">{{ event.title }}</div>
              <div v-if="view !== 'month'" class="opacity-90 text-[10px]">{{ hhmm(event.start) }} – {{ hhmm(event.end) }}</div>
            </div>
          </template>

          <template #event-custom2="{ event, style, onClick, view }">
            <div class="absolute py-[0.125rem] px-[0.25rem] text-brand-textPink rounded-lg bg-white/50 shadow-md "
                 :style="style" @click.stop="onClick(event)">
              <div class="font-bold text-[0.75rem] truncate">{{ event.title }}</div>
              <div v-if="view !== 'month'" class="text-[10px] ">{{ hhmm(event.start) }} – {{ hhmm(event.end) }}</div>
            </div>
          </template>
        </main-calendar>

        <div class=" flex-col gap-[16px] hidden lg:flex px-[24px]">
            <mini-calendar
            class="md:col-span-1 "
            :month-date="state.focus"
            :selected-date="state.selected || state.focus"
            :events="events1"
            :theme="theme1"
            :data-attrs="{ 'data-calendar':'mini' }"
            @date-selected="onSelectFromMini">
        </mini-calendar>

            <ButtonComponent
        text="NEW EVENTS"
        variant="none"
        customClass="group w-full h-12 min-h-10 px-4 py-2 text-base font-semibold bg-black rounded-[48px] inline-flex justify-center items-center gap-2 text-[#07F468] hover:text-black hover:bg-[#07F468]"
        :leftIcon="'https://i.ibb.co.com/RpWmJkcb/plus.webp'"
        :leftIconClass="`
          w-6 h-6 transition duration-200 group-hover:[filter:brightness(0)_saturate(100%)]`"
      />

    <div>
      <EventsWidget 
         :sections="eventsData" 
         @join-click="handleJoin"
         @reply-click="handleReply"
      />
   </div>
        </div>
      </div>
    </div>

    <hr class="border-gray-300 my-8"/>

    <div>
      <div class="flex w-full">
        
        <main-calendar
          class="w-full"
          variant="theme2"
          :focus-date="state.focus"
          :events="events2"
          :theme="theme2"
          :data-attrs="{ 'data-calendar':'main-2' }"
          :console-overlaps="true"
          :highlight-today-column="true"
          time-start="00:00"
          time-end="23:00"
          :slot-minutes="60"
          :row-height-px="64"
          :min-event-height-px="0"
          @date-selected="onSelectFromMain">

          <template #event="{ event, style, onClick }">
             <div class="absolute py-1 px-2 border-b border-blue-600 text-xs bg-blue-300/25 text-emerald-700 shadow-sm overflow-hidden"
                  :style="style" @click.stop="onClick(event)">
              <div class="flex items-center gap-1 text-blue-600 font-normal truncate ">
                  <svg width="11" height="12" viewBox="0 0 11 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.2898 5H1.28979M7.78979 1V3M3.78979 1V3M3.68979 11H7.88979C8.72987 11 9.14991 11 9.47078 10.8365C9.75302 10.6927 9.98249 10.4632 10.1263 10.181C10.2898 9.86012 10.2898 9.44008 10.2898 8.6V4.4C10.2898 3.55992 10.2898 3.13988 10.1263 2.81901C9.98249 2.53677 9.75302 2.3073 9.47078 2.16349C9.14991 2 8.72987 2 7.8898 2H3.6898C2.84972 2 2.42968 2 2.10881 2.16349C1.82657 2.3073 1.5971 2.53677 1.45329 2.81901C1.28979 3.13988 1.28979 3.55992 1.28979 4.4V8.6C1.28979 9.44008 1.28979 9.86012 1.45329 10.181C1.5971 10.4632 1.82657 10.6927 2.10881 10.8365C2.42968 11 2.84972 11 3.68979 11Z" stroke="#5555e8" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="mt-1 truncate">{{ event.title }}</span> 
              </div>
            </div>
          </template>

          <template #event-custom="{ event, style, onClick }">
             <div class="absolute py-1 px-2 border-b border-[#FF0066] text-xs text-[#FF0066] shadow-sm overflow-hidden"
                  :style="style"
                  style="background: repeating-linear-gradient(-45deg, #EBBACC, #EBBACC 2px, #E9CFD7 3px, #E9CFD7 10px);"
                  @click.stop="onClick(event)">
              <div class="flex items-center gap-1 font-normal leading-4 truncate">
                  <svg width="11" height="12" viewBox="0 0 11 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.2898 5H1.28979M7.78979 1V3M3.78979 1V3M3.68979 11H7.88979C8.72987 11 9.14991 11 9.47078 10.8365C9.75302 10.6927 9.98249 10.4632 10.1263 10.181C10.2898 9.86012 10.2898 9.44008 10.2898 8.6V4.4C10.2898 3.55992 10.2898 3.13988 10.1263 2.81901C9.98249 2.53677 9.75302 2.3073 9.47078 2.16349C9.14991 2 8.72987 2 7.8898 2H3.6898C2.84972 2 2.42968 2 2.10881 2.16349C1.82657 2.3073 1.5971 2.53677 1.45329 2.81901C1.28979 3.13988 1.28979 3.55992 1.28979 4.4V8.6C1.28979 9.44008 1.28979 9.86012 1.45329 10.181C1.5971 10.4632 1.82657 10.6927 2.10881 10.8365C2.42968 11 2.84972 11 3.68979 11Z" stroke="#ff123b" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="mt-1 truncate">{{ event.title }}</span>
              </div>
            </div>
          </template>

          <template #event-alt="{ event, style, onClick }">
             <div class="absolute py-1 px-2  bg-teal-300/25 border-b border-[#15B79E] text-teal-500 text-xs shadow-sm"
                  :style="style" @click.stop="onClick(event)">
               <div class="flex items-center gap-1 font-normal truncate">
                 <svg class="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <span class="mt-1 truncate">{{ event.title }}</span>
               </div>
            </div>
          </template>
          
          <template #event-custom2="{ event, style, onClick }">
             <div class="absolute py-1 px-2 bg-fuchsia-300/25 border-b border-[#AE4AEF] text-purple-700 text-xs shadow-sm"
                  :style="style" @click.stop="onClick(event)">
              <div class="flex items-center gap-1 font-normal text-[#AE4AEF]">
                 <svg class="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                <span class="mt-1 truncate">{{ event.title }}</span>
              </div>
            </div>
          </template>

        </main-calendar>
      </div>
    </div>
  
  </DashboardWrapperTwoColContainer>
</template>

<script>
import { hhmm } from '@/utils/calendarHelpers.js';
import MiniCalendar from '@/components/calendar/MiniCalendar.vue';
import MainCalendar from '@/components/calendar/MainCalendar.vue';
import DashboardWrapperTwoColContainer from '@/components/dashboard/DashboardWrapperTwoColContainer.vue';
import ButtonComponent from '@/components/dev/button/ButtonComponent.vue';
import EventsWidget from '@/components/calendar/EventsWidget.vue';
import { ref } from 'vue';

export default {
  components: { MiniCalendar, MainCalendar, DashboardWrapperTwoColContainer ,ButtonComponent,EventsWidget},
  data() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    // CHANGE: Helper to generate ISO Strings (JSON format)
    // Example output: "2026-01-14T10:00:00"
    const getIsoString = (dayOfMonth, hour, minute) => {
        const d = new Date(y, m, dayOfMonth, hour, minute);
        // Using sv-SE locale hack to get YYYY-MM-DD format, or just constructing it manually
        // Simple manual construction to ensure local time ISO format:
        const pad = (n) => n.toString().padStart(2, '0');
        return `${y}-${pad(m + 1)}-${pad(dayOfMonth)}T${pad(hour)}:${pad(minute)}:00`;
    };

    // --- THEME 1 ---
    const theme1 = {
      mini: {
    wrapper: 'flex flex-col w-full items-center font-medium text-gray-500 mt-[10px] gap-[0.625rem] rounded-xl w-[20.375rem]',
    header: 'font-semibold',
    
    // CHANGE 1: 'hover:bg-slate-50' yahan se HATA diya hai.
    // CHANGE 2: 'focus:ring-inset' ADD kiya hai taake outline andar bane aur cut na ho.
    dayBase: 'w-[37.43px] h-[37px] rounded-full flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500',
    
    outside: 'opacity-0',
    expired: 'opacity-100',
    today: 'bg-gray-500 font-semibold text-white',
    selected: 'rounded-full',
    dot: 'mt-[2rem] w-1.5 h-1.5 rounded-full absolute'
},
      main: {
        wrapper: 'relative flex flex-col gap-[5.5rem] overflow-hidden rounded-xl',
        title: 'sm:text-[1.5rem] text-[16px] font-semibold text-slate-800 ',
        xHeader: 'absolute text-[11px] uppercase tracking-wide text-slate-500 top-[4rem] xl:top-[5rem] w-full',
        axisXLabel: 'flex flex-col justify-end pb-[0.75rem] w-[4.875rem]',
        axisXDay: 'py-1 text-center h-[63.92px]',
        axisXToday: 'bg-gray-500 text-white rounded-full w-8 h-8 flex items-center justify-center',
        axisYRow: 'h-[62.62px] uppercase text-right pr-2 w-[2.4rem] lg:w-[4.8rem] text-gray-400 text-xs font-medium leading-4',
        colBase: 'relative bg-white/20 overflow-hidden',
        gridRow: 'h-[62.61px] border-b  border-white/50',
        eventBase: 'absolute mx-1 rounded-md border border-stone-100 bg-white p-2 text-xs shadow-sm'
      },
     month: {
        weekHeader: 'text-[11px] uppercase tracking-wide text-slate-500',
        // 1. Added 'overflow-hidden' to cellBase so nothing spills out
        cellBase: 'aspect-[1/1.1] p-1 sm:p-2 text-left hover:bg-slate-50 focus:outline-none focus:border-2 focus:border-emerald-500 border border-white/50 flex flex-col items-start justify-start overflow-hidden',
        outside: 'opacity-40',
        today: 'border-2 border-emerald-500',
        // 2. Added 'w-full' to ensure truncate works
        // 3. Adjusted text size: 'text-[9px] sm:text-[11px]' for better mobile fit
        // 4. Adjusted padding: 'px-1 sm:px-2' for mobile
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
    const events1 = [
      { id: 'e1', title: 'Group Call1', start: new Date(y, m, 11, 15, 30), end: new Date(y, m,11, 17, 15), slot: 'custom' },
      { id: 'e2', title: 'Live Call2', start: new Date(y, m, 12, 12, 0), end: new Date(y, m, 12, 14, 0), slot: 'alt' },
      { id: 'e3', title: 'Live Call', start: new Date(y, m, 13, 6, 0), end: new Date(y, m, 13, 7, 0) },
      { id: 'e4', title: 'Group Call', start: new Date(y, m, 14, 10, 0), end: new Date(y, m, 14, 16, 0), slot: 'custom2' },
      { id: 'e4', title: 'Group Call', start: new Date(y, m, 15, 10, 0), end: new Date(y, m, 15, 16, 0), slot: 'custom2' },
    ];

    // --- CHANGE: DEMO 2 (JSON Array Format) ---
    // These start/end values are now ISO STRINGS, not Date objects.
    const events2 = [
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
    ];

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
        // WORKING IMAGE URL
        avatars: [{ src: 'https://i.ibb.co/0VQJ0swt/Vector.png', name: 'Apples' }] 
      },
      {
        time: '2:15pm-9:30pm',
        title: 'Live call',
        titleColorClass: 'text-lightViolet',
        borderClass: 'bg-lightViolet',
        bgClass: 'bg-gradient-to-r from-gray-50/50 to-gray-50/20',
        showJoin: false,
        // WORKING IMAGE URL
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
    return { 
      state: { focus: new Date(y, m, 23), selected: null, view: 'week' }, 
      events1,
      events2, // Now strictly JSON compatible array
      theme1, 
      theme2,
      eventsData
    };
  },
  methods: {
    hhmm,
    onSelectFromMini(date) { this.state.selected = new Date(date); this.state.focus = new Date(date); },
    onSelectFromMain(date) { this.state.selected = new Date(date); }
  },
  mounted() {
    document.addEventListener('calendar:event-click', (e) => {
      console.log('[listener] event-click → event object:', e.detail.event);
    });
  }
};
</script>