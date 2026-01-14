<template>
  <section
    :class="theme.main.wrapper"
    v-bind="dataAttrs"
    :data-view="effectiveView"
    :data-focus="cursor ? cursor.toISOString().slice(0,10) : ''">

    <div v-if="variant === 'default'" class="flex  items-center justify-between">
      <div class="flex items-center gap-[11px]">
        <div class="font-bold" :class="theme.main.title">{{ title }}</div>
        <button class="px-[1.5rem] py-[0.25rem] h-[3rem] rounded-[2rem] border border-pink-400 hover:bg-slate-50" @click="goToday" data-main-today>
          <p class="font-medium text-[14px] text-pink-500">Today</p>
        </button>
        <span class="flex items-center justify-between">
          <button class="w-[2rem] h-[2rem] flex items-center justify-center" @click="shift(-1)" data-main-prev>
             <svg width="10" height="18" viewBox="0 0 10 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.9995L1 8.99951L9 0.999512" stroke="#667085" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button class="w-[2rem] h-[2rem] flex items-center justify-center" @click="shift(1)" data-main-next>
             <svg width="10" height="18" viewBox="0 0 10 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 16.9995L9 8.99951L1 0.999512" stroke="#667085" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </span>
      </div>

      <div class="flex items-center gap-2">
        <div class="h-[2.5rem] w-[11.25rem] px-[1.5rem] py-[0.5rem] rounded-[3rem] flex items-center justify-between bg-pink-400/10">
          <span class="flex items-center justify-center h-full">
            <h2 class="text-[0.875rem] font-medium text-black">All Events</h2>
            <p class="text-[10px] text-pink-500 font-medium h-full">20</p>
          </span>
          <button class="flex items-center justify-center w-[0.5rem] h-[0.5rem]">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.796688 1.96714L3.53832 6.70268C3.68984 6.9644 3.7656 7.09526 3.86444 7.13922C3.95066 7.17755 4.04909 7.17755 4.13531 7.13922C4.23415 7.09526 4.30992 6.9644 4.46144 6.70268L7.20307 1.96714C7.35513 1.70448 7.43117 1.57315 7.41993 1.46536C7.41013 1.37134 7.36087 1.28591 7.28442 1.23032C7.19677 1.16659 7.04501 1.16659 6.74151 1.16659H1.25825C0.954741 1.16659 0.802987 1.16659 0.715335 1.23032C0.638882 1.28591 0.589625 1.37134 0.579824 1.46536C0.568586 1.57315 0.64462 1.70448 0.796688 1.96714Z" fill="black" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
        
        <span class="flex items-center w-[14.375rem] rounded-[3rem] p-[0.25rem] bg-white/20 border border-pink-400/80">
          <button class="text-[0.875rem] text-pink-400/80 w-[4.5rem] font-bold px-[1rem] py-[0.5rem] leading-[1.25rem] rounded-[3rem]" @click="setView('day')">Day</button>
          <button class="text-[0.875rem] text-white w-[4.5rem] font-semibold px-[1rem] py-[0.5rem] leading-[1.25rem] bg-pink-400/80 rounded-[3rem]" @click="setView('week')">Week</button>
          <button class="text-[0.875rem] text-pink-400/80 w-[4.875rem] font-bold px-[1rem] py-[0.5rem] leading-[1.25rem] rounded-[3rem]" @click="setView('month')">Month</button>
        </span>
      </div>
    </div>

    <div v-else-if="variant === 'theme2'" class="flex items-center justify-between w-full px-1 mb-[3rem]">
      <div class="flex items-center gap-[11px]">
        <div class="font-bold" :class="theme.main.title">{{ title }}</div>
        <span class="flex items-center justify-between">
          <button class="w-[2rem] h-[2rem] flex items-center justify-center" @click="shift(-1)" data-main-prev>
             <svg width="10" height="18" viewBox="0 0 10 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.9995L1 8.99951L9 0.999512" stroke="#667085" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button class="w-[2rem] h-[2rem] flex items-center justify-center" @click="shift(1)" data-main-next>
             <svg width="10" height="18" viewBox="0 0 10 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 16.9995L9 8.99951L1 0.999512" stroke="#667085" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </span>
      </div>

      <div class="flex items-center gap-3">
        <CheckboxGroup
            label="Show existing events/booking schedule"
            v-model="showSchedule"
            checkboxClass="appearance-none bg-white border border-[#D0D5DD] rounded-[4px] w-4 min-w-4 h-4 checked:white checked:bg-[#FF0066] checked:border-[#FF0066] checked:relative checked:after:content-[''] checked:after:absolute checked:after:left-[0.3rem] checked:after:top-[0.15rem] checked:after:w-1 checked:after:h-2 checked:after:border checked:after:border-solid checked:after:border-t-0 checked:after:border-l-0 checked:after:border-white checked:after:border-w-0 checked:after:border-b-2 checked:after:border-r-2 checked:after:rotate-45 checked:after:box-border cursor-pointer"
            labelClass="text-xs sm:text-sm leading-normal tracking-[0.0175rem] text-slate-700 cursor-pointer mt-[2px]"
            wrapperClass="flex items-center"
          />
      </div>

      <button class="px-6 py-2.5 rounded-full border border-[#F1C1D9] text-brand-textPink text-xs font-medium flex items-center gap-2 hover:bg-pink-100 transition-colors">
        Preview booking schedule
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="mb-[1px]"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
      </button>
    </div>

    <template v-if="effectiveView !== 'month'">
      <div class="flex gap-2" :class="[effectiveView==='day' ? 'grid-cols-2' : 'grid-cols-8', theme.main.xHeader]">
        <div :class="theme.main.axisXLabel">
           <div v-if="variant === 'default'" class="flex items-center px-[0.25rem] gap-[0.125rem]">
             <span class="flex items-center justify-center w-[10px] h-[10px]">
               <svg width="6" height="5" viewBox="0 0 6 5" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.5 1.36523L3 3.86523L5.5 1.36523" stroke="#98A2B3" stroke-linecap="round" stroke-linejoin="round"/></svg>
             </span>
             <p class="text-[11px] text-gray-400 font-medium leading-[18px]">GMT +08</p>
           </div>
           <div v-else class="flex flex-col items-center justify-end pb-2">
              <span class="text-[10px] font-bold text-slate-400">GMT+5</span>
           </div>
        </div>
        
        <div class="grid grid-cols-7 h-[3.995rem] w-full">
          <div v-for="(d,i) in days" :key="'xh-'+i"
               class="text-center flex flex-col p-[2.5rem] items-center"
               :class="[
                 theme.main.axisXDay,
                 (sd(d).getDay() === 0 && variant === 'default') ? 'text-red-500' : '' 
               ]"
               :data-date="d.toISOString().slice(0,10)">
            
            <div class="text-[11px] font-semibold leading-[1.25rem] uppercase" :class="variant === 'theme2' ? 'text-slate-500 tracking-wider mb-1' : ''">
              {{ ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i] }}
            </div>
            
            <div class="text-[1rem] w-[2rem] text-center font-semibold leading-[2rem]"
                 :class="[(highlightTodayColumn && sameDay(d,today)) ? theme.main.axisXToday : '']">
              {{ d.getDate() }}
            </div>
          </div>
        </div>
      </div>
      <div class="flex gap-2 overflow-hidden">
        <div class="flex flex-col">
          <div v-for="(t) in range.labels" :key="'slot-label-'+t"
               :class="[theme.main.axisYRow, isNowLabel(t) ? ' !text-brand-textPink font-bold' : '']">
            {{ formatTime(t) }}
          </div>
        </div>

        <span class="grid w-full relative rounded-md overflow-hidden" :class="[effectiveView==='day' ? 'grid-cols-1' : 'grid-cols-7']">
          <div v-for="(d,idx) in days" :key="'col-'+idx"
               :data-date="d.toISOString().slice(0,10)"
               :data-expired="sd(d)<today?'true':'false'"
               :class="theme.main.colBase"
               @click.self="emitDate(d)">

            <div class="absolute z-[0] inset-0 pointer-events-none">
              <div v-for="i in range.rowCount" :key="'grid-'+i" :class="theme.main.gridRow"></div>
            </div>
            
            <div v-if="sameDay(d, today)"
                 class="absolute z-[20] left-0 right-0 border-b-2 border-brand-pink pointer-events-none"
                 :style="{ top: nowY + '%' }"
                 data-now-line="true"></div>

            <div class="relative z-[0]" data-cal-scroll
                 :style="{ height: (range.rowCount * rowHeightPx) + 'px', overflowY: 'auto' }">
              <template v-for="ev in eventsForDay(d)" :key="ev.id||ev.title+ev.start">
                <slot v-if="ev.slot === 'alt'" name="event-alt" :event="ev" :day="d" :view="effectiveView" :style="styleBlock(ev)" :onClick="dispatchEventClick"></slot>
                <slot v-else-if="ev.slot === 'custom'" name="event-custom" :event="ev" :day="d" :view="effectiveView" :style="styleBlock(ev)" :onClick="dispatchEventClick"></slot>
                <slot v-else-if="ev.slot === 'custom2'" name="event-custom2" :event="ev" :day="d" :view="effectiveView" :style="styleBlock(ev)" :onClick="dispatchEventClick"></slot>
                <slot v-else name="event" :event="ev" :day="d" :view="effectiveView" :style="styleBlock(ev)" :onClick="dispatchEventClick"></slot>
              </template>
            </div>
            
          </div>
        </span>
      </div>
    </template>

    <template v-else>
       <div class="grid grid-cols-7 mt-[-3rem]">
          <div v-for="w in ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']" :key="w" 
          class="text-center text-lg font-semibold text-gray-500 mb-[10px] uppercase leading-7"
          :class="w === 'Sun' ? 'text-red-400' : 'text-gray-500'">{{ w }}</div>
          <button v-for="(d,i) in days" :key="'m-'+i" type="button" @click="emitDate(d)"
          :class="[ theme.month.cellBase, d.getMonth() !== cursor.getMonth() ? theme.month.outside : '', (highlightTodayColumn && sameDay(d, today)) ? theme.month.today : '', d.getDay() === 0 ? 'text-red-400' : '' ]">
            <div class="text-sm mb-1" :class="d.getDay() === 0 ? 'text-red-400 font-semibold' : ''">{{ d.getDate() }}</div>
            <div class="space-y-1">
              <div v-for="ev in eventsForDay(d)" :key="ev.id" :class="[ theme.month.cellEvent, d.getDay() === 0 ? 'text-red-400' : '' ]" @click.stop="dispatchEventClick(ev)">{{ ev.title }}</div>
            </div>
          </button>
        </div>
    </template>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { SOD, addDays, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, timeToMinutes, overlaps, monthNames } from '@/utils/calendarHelpers.js';
import CheckboxGroup from '../ui/form/checkbox/CheckboxGroup.vue';

const props = defineProps({
  variant: { type: String, default: 'default' },
  focusDate: { type: Date, required: true },
  initialView: { type: String, default: 'week' },
  events: { type: Array, default: () => [] },
  theme: { type: Object, default: () => ({}) },
  dataAttrs: { type: Object, default: () => ({}) },
  consoleOverlaps: { type: Boolean, default: true },
  highlightTodayColumn: { type: Boolean, default: false },
  timeStart: { type: String, default: '05:00' },
  timeEnd: { type: String, default: '23:00' },
  slotMinutes: { type: Number, default: 60 },
  rowHeightPx: { type: Number, default: 64 },
  minEventHeightPx: { type: Number, default: 0 }
});

const emit = defineEmits(['date-selected']);
const today = ref(SOD(new Date()));
const width = ref(window.innerWidth);
const cursor = ref(new Date(props.focusDate));
const view = ref(props.initialView);
const nowTimer = ref(null);
const nowY = ref(0);

const showSchedule = ref(false); // Checkbox state

const effectiveView = computed(() => {
  if (props.variant === 'theme2') return 'week';
  if (width.value < 640) return 'day';
  if (width.value < 1024 && view.value === 'month') return 'week';
  return view.value;
});

const range = computed(() => {
  const sMin = timeToMinutes(props.timeStart);
  const eMin = timeToMinutes(props.timeEnd);
  const step = props.slotMinutes;
  const minutesTotal = Math.max(1, eMin - sMin);
  const rowCount = Math.floor(minutesTotal / step);
  const labels = Array.from({ length: rowCount + 1 }, (_, i) => {
    const mins = sMin + i * step;
    let h = Math.floor(mins / 60);
    let m = mins % 60;
    const ampm = h >= 12 ? 'pm' : 'am';
    let hour12 = h % 12;
    if (hour12 === 0) hour12 = 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
  });
  return { sMin, eMin, step, minutesTotal, rowCount, labels };
});

const weekDays = computed(() => {
  const s = startOfWeek(cursor.value);
  return Array.from({ length: 7 }, (_, i) => addDays(s, i));
});

const days = computed(() => {
  if (effectiveView.value === 'month') {
      const start = startOfWeek(startOfMonth(cursor.value));
      const end = endOfWeek(endOfMonth(cursor.value));
      const arr = []; for(let x=new Date(start); x<=end; x=addDays(x,1)) arr.push(new Date(x));
      return arr;
  }
  return effectiveView.value === 'day' ? [cursor.value] : weekDays.value;
});

// CHANGE 4: Refined Normalized Logic for JSON Handling
// The .map function with `new Date(ev.start)` automatically handles ISO strings.
// Added a filter check to ensure ev.start/ev.end exist before processing to prevent crashes on bad JSON.
const normalized = computed(() => {
  let evs = props.events || [];

  if (props.variant === 'theme2') {
    evs = evs.filter(ev => {
      if (ev.slot === 'custom') return true;
      if (showSchedule.value) return true;
      return false;
    });
  }

  return evs
    .filter(ev => ev && ev.start && ev.end)
    .map(ev => ({ 
      ...ev, 
      start: new Date(ev.start), // Works for Date Object OR JSON String
      end: new Date(ev.end),     // Works for Date Object OR JSON String
      dataAttrs: ev.dataAttrs || {}, 
      slot: ev.slot || null 
    }));
});

const title = computed(() => {
  const d = cursor.value, y = d.getFullYear(), m = d.getMonth();
  if (effectiveView.value === 'week') return `${monthNames[m]} ${y}`;
  if (effectiveView.value === 'month') return `${monthNames[m]} ${y}`;
  return `${monthNames[m]} ${d.getDate()}, ${y}`;
});

watch(() => props.focusDate, (v) => { if (v) { cursor.value = new Date(v); } });

function formatTime(time) {
  const [hour, rest] = time.split(':');
  const period = rest.split(' ')[1];
  return `${hour}${period}`;
}

const sd = (d) => SOD(d);
const sameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const isNowLabel = (label) => {
  const now = new Date();
  if (!sameDay(cursor.value, SOD(now))) return false;
  if (typeof label !== 'string') return false;
  const match = label.match(/^(\d{1,2}):(\d{2})\s?(am|pm)$/i);
  if (!match) return false;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3].toLowerCase();
  if (ampm === 'pm' && h !== 12) h += 12;
  if (ampm === 'am' && h === 12) h = 0;
  const labelMinutes = h * 60 + m;
  const cur = now.getHours() * 60 + now.getMinutes();
  return cur >= labelMinutes && cur < labelMinutes + props.slotMinutes;
};
const emitDate = (d) => { if (!d) return; emit('date-selected', new Date(d)); };
const dispatchEventClick = (evObj) => { document.dispatchEvent(new CustomEvent('calendar:event-click', { detail: { event: evObj, source: 'main' } })); };
const eventsForDay = (day) => {
  const s = SOD(day), e = addDays(s, 1);
  return normalized.value.filter(ev => ev.start < e && ev.end > s).sort((a, b) => a.start - b.start);
};
const styleBlock = (ev) => {
  const { sMin, eMin, step } = range.value;
  const startMin = ev.start.getHours() * 60 + ev.start.getMinutes();
  const endMin = ev.end.getHours() * 60 + ev.end.getMinutes();
  const clippedStart = Math.max(startMin, sMin);
  const clippedEnd = Math.min(endMin, eMin);
  if (clippedEnd <= clippedStart) return 'display:none';
  const rowsFromTop = (clippedStart - sMin) / step;
  const rowsHeight = (clippedEnd - clippedStart) / step;
  const topPx = rowsFromTop * props.rowHeightPx;
  const heightPx = Math.max(props.minEventHeightPx, rowsHeight * props.rowHeightPx);
  return `top:${topPx}px;height:${heightPx}px;left:0;right:0;`;
};
const setView = (v) => { view.value = v; };
const shift = (n) => {
  const v = effectiveView.value;
  if (v === 'month') cursor.value = addMonths(cursor.value, n);
  else cursor.value = addDays(cursor.value, n * 7);
};
const goToday = () => { cursor.value = new Date(); };
const updateNowLine = () => {
  const { sMin, eMin } = range.value;
  const now = new Date();
  if (!sameDay(cursor.value, SOD(now))) { nowY.value = 0; return; }
  const cur = now.getHours() * 60 + now.getMinutes();
  const pct = ((cur - sMin) / Math.max(1, (eMin - sMin))) * 100;
  nowY.value = Math.min(100, Math.max(0, pct));
};
const handleResize = () => { width.value = window.innerWidth; };
onMounted(() => {
  window.addEventListener('resize', handleResize);
  nowTimer.value = setInterval(updateNowLine, 60000);
  updateNowLine();
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  clearInterval(nowTimer.value);
});
</script>