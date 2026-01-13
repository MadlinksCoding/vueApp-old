<template>
  <DashboardWrapperTwoColContainer>
    
    <div class="mb-10">
      <h2 class="text-lg font-bold mb-4 text-gray-500">Theme 1</h2>
      <div class="flex w-full px-4 gap-4">
        
        <main-calendar
          class="md:col-span-2 w-full"
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

          <template #event="{ event, style, onClick }">
            <div class="absolute py-[0.125rem] px-[0.25rem] rounded-[0.375rem] bg-creamViolet text-xs text-white shadow-custom"
                :style="style"
                @click.stop="onClick(event)">
              <div class="flex items-center font-medium truncate">{{ event.title }}</div>
              <div>{{ hhmm(event.start) }} – {{ hhmm(event.end) }}</div>
            </div>
          </template>

          <template #event-alt="{ event, style, onClick }">
            <div class="absolute py-[0.125rem] px-[0.25rem] rounded-lg bg-white/60 text-blue-600 text-xs shadow-custom"
                :style="style"
                @click.stop="onClick(event)">
              <div class="font-semibold truncate">{{ event.title }}</div>
              <div class="opacity-90">{{ hhmm(event.start) }} – {{ hhmm(event.end) }}</div>
            </div>
          </template>

          <template #event-custom="{ event, style, onClick }">
            <div class="absolute py-[0.125rem] px-[0.25rem] rounded-lg bg-brand-pink text-white text-xs shadow-md"
                :style="style"
                @click.stop="onClick(event)">
              <div class="font-semibold truncate">{{ event.title }}</div>
              <div class="opacity-90">{{ hhmm(event.start) }} – {{ hhmm(event.end) }}</div>
            </div>
          </template>

          <template #event-custom2="{ event, style, onClick }">
            <div class="absolute py-[0.125rem] px-[0.25rem] text-brand-textPink rounded-lg bg-white/50 shadow-md "
                :style="style"
                @click.stop="onClick(event)">
              <div class="font-bold text-[0.75rem] truncate">{{ event.title }}</div>
              <div class="text-[0.6875rem]">{{ hhmm(event.start) }} – {{ hhmm(event.end) }}</div>
            </div>
          </template>
        </main-calendar>

        <mini-calendar
          class="md:col-span-1 hidden lg:block"
          :month-date="state.focus"
          :selected-date="state.selected || state.focus"
          :events="events1"
          :theme="theme1"
          :data-attrs="{ 'data-calendar':'mini' }"
          @date-selected="onSelectFromMini">
        </mini-calendar>
      </div>
    </div>

    <hr class="border-gray-300 my-8"/>

    <div>
      <h2 class="text-lg font-bold mb-4 text-gray-500">Theme 2</h2>
      <div class="flex w-full px-4">
        
        <main-calendar
          class="w-full"
          variant="theme2"
          :focus-date="state.focus"
          :events="events2"
          :theme="theme2"
          :data-attrs="{ 'data-calendar':'main-2' }"
          :console-overlaps="true"
          :highlight-today-column="true"
          time-start="05:00"
          time-end="23:00"
          :slot-minutes="60"
          :row-height-px="64"
          :min-event-height-px="0"
          @date-selected="onSelectFromMain">

          <template #event="{ event, style, onClick }">
             <div class="absolute py-1 px-2 rounded-md border border-emerald-200 text-xs text-emerald-700 shadow-sm overflow-hidden"
                 :style="style"
                 style="background: repeating-linear-gradient(45deg, #d1fae5, #d1fae5 5px, #ecfdf5 5px, #ecfdf5 10px);"
                 @click.stop="onClick(event)">
              <div class="flex items-center gap-1 font-bold truncate">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                {{ event.title }}
              </div>
            </div>
          </template>

          <template #event-custom="{ event, style, onClick }">
             <div class="absolute py-1 px-2 rounded-md border border-pink-200 text-xs text-pink-700 shadow-sm overflow-hidden"
                 :style="style"
                 style="background: repeating-linear-gradient(45deg, #fce7f3, #fce7f3 5px, #fff1f2 5px, #fff1f2 10px);"
                 @click.stop="onClick(event)">
              <div class="flex items-center gap-1 font-bold truncate">
                <span class="w-1.5 h-1.5 rounded-full bg-pink-500 flex-shrink-0"></span>
                {{ event.title }}
              </div>
            </div>
          </template>

          <template #event-alt="{ event, style, onClick }">
             <div class="absolute py-1 px-2 rounded-md bg-sky-100 border border-sky-200 text-sky-700 text-xs shadow-sm"
                 :style="style"
                 @click.stop="onClick(event)">
               <div class="flex items-center gap-1 font-bold truncate">
                 <svg class="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                 {{ event.title }}
               </div>
            </div>
          </template>
          
          <template #event-custom2="{ event, style, onClick }">
             <div class="absolute py-1 px-2 rounded-md bg-purple-100 border border-purple-200 text-purple-700 text-xs shadow-sm"
                 :style="style"
                 @click.stop="onClick(event)">
              <div class="flex items-center gap-1 font-bold truncate">
                 <svg class="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                 {{ event.title }}
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

export default {
  components: { MiniCalendar, MainCalendar, DashboardWrapperTwoColContainer },
  data() {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth();

    // --- THEME 1 (Original - Stone/Gray) ---
    const theme1 = {
      mini: {
        wrapper: 'flex flex-col items-center font-medium text-gray-500 mt-[1.5rem] gap-[0.625rem] rounded-xl w-[20.375rem]',
        header: 'font-semibold',
        dayBase: 'w-[37.43px] h-[37px] rounded-full flex flex-col items-center justify-center hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500',
        outside: 'opacity-0',
        expired: 'opacity-100',
        today: 'bg-gray-500 font-semibold text-white',
        selected: 'rounded-full',
        dot: 'mt-[2rem] w-1.5 h-1.5 rounded-full absolute'
      },
      main: {
        wrapper: 'relative flex flex-col pt-[1.5rem] gap-[5.5rem] overflow-hidden rounded-xl',
        title: 'text-[1.5rem] font-semibold text-slate-800',
        xHeader: 'absolute z-[30] text-[11px] uppercase tracking-wide text-slate-500 top-[6rem] w-full',
        axisXLabel: 'flex flex-col justify-end pb-[0.75rem] w-[4.875rem]',
        axisXDay: 'py-1 text-center h-[63.92px]',
        axisXToday: 'text-white bg-gray-500 rounded-full',
        axisYRow: 'h-[62.62px] text-right pr-2 w-[4.875rem] text-gray-400 text-xs font-medium leading-4',
        colBase: 'relative bg-white/20 overflow-hidden', // Original Stone BG
        gridRow: 'h-[62.61px] border-b  border-white/50',
        eventBase: 'absolute mx-1 rounded-md border border-stone-100 bg-white p-2 text-xs shadow-sm'
      },
      month: {
        weekHeader: 'text-[11px] uppercase tracking-wide text-slate-500',
        cellBase: 'aspect-[1/1.1] rounded-lg p-2 text-left hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 border',
        outside: 'opacity-40',
        today: 'ring-2 ring-emerald-500',
        cellEvent: 'text-[11px] px-2 py-1 rounded-md bg-slate-100 border border-slate-200 truncate cursor-pointer'
      }
    };

    // --- THEME 2 (New - Lighter/Clean) ---
    const theme2 = {
      mini: {},
      main: {
        wrapper: 'relative flex flex-col pt-[1.5rem] gap-[1rem] overflow-hidden rounded-xl',
        title: 'text-[1.5rem] font-semibold text-slate-800',
        xHeader: 'absolute z-[30] top-[4.5rem] w-full', 
        axisXLabel: 'flex flex-col justify-end pb-[0.75rem] w-[4.875rem]',
        axisXDay: 'py-1 text-center h-[63.92px] text-slate-500 font-medium',
        axisXToday: 'bg-slate-700 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto',
        axisYRow: 'h-[62.62px] text-right pr-4 w-[4.875rem] text-slate-400 text-[11px] font-medium leading-4 pt-1',
        colBase: 'relative bg-white/20 border-l border-white/50 overflow-hidden',
        gridRow: 'h-[62.61px] border-b border-slate-200/60',
        eventBase: 'absolute mx-1 rounded-md p-2 text-xs shadow-sm'
      },
      month: {}
    };

    // --- DEMO 1 (Original Data) ---
    const events1 = [
      { id: 'e1', title: 'Group Call1', start: new Date(y, m, 6, 15, 30), end: new Date(y, m, 6, 17, 15), slot: 'custom' },
      { id: 'e3', title: 'Live Call2', start: new Date(y, m, 3, 12, 0), end: new Date(y, m, 3, 14, 0), slot: 'alt' },
      { id: 'e4', title: 'Live Call', start: new Date(y, m, 5, 6, 0), end: new Date(y, m, 5, 7, 0) },
      { id: 'e7', title: 'Group Call', start: new Date(y, m, 9, 10, 0), end: new Date(y, m, 9, 16, 0), slot: 'custom2' },
    ];

    // --- DEMO 2 (Maid Cafe Data) ---
    const events2 = [
      { id: 'e1', title: 'Maid Cafe Shift', start: new Date(y, m, 23, 12, 0), end: new Date(y, m, 23, 16, 0), slot: 'event' }, // Green
      { id: 'e2', title: 'Event Title', start: new Date(y, m, 23, 12, 0), end: new Date(y, m, 23, 15, 0), slot: 'custom' }, // Pink
      { id: 'e3', title: 'J&Bs Cooking', start: new Date(y, m, 24, 5, 0), end: new Date(y, m, 24, 9, 0), slot: 'custom2' }, // Purple
      { id: 'e4', title: 'High School', start: new Date(y, m, 23, 10, 0), end: new Date(y, m, 23, 12, 0), slot: 'alt' }, // Blue
    ];

    return { 
      state: { focus: new Date(y, m, 23), selected: null, view: 'week' }, 
      events1,
      events2,
      theme1, 
      theme2 
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