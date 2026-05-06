<template>
  <section
      :class="theme.mini.wrapper"
      v-bind="dataAttrs"
      data-role="mini"
      :data-month="cursor.getMonth()+1"
      :data-year="cursor.getFullYear()">

      <div class="grid grid-cols-7 text-[0.75rem] font-bold  uppercase tracking-wide ">
        <div v-for="(w, idx) in tinyWeekdays" :key="idx" :class="['text-center w-[37.43px] h-[20px]', idx===0 ? 'text-[#FF6A6A]' : '']">{{ w }}</div>
      </div>

      <div class="grid grid-cols-7 gap-0  ">
        <template v-for="(d,i) in days" :key="i">
          <button
          v-if="d.getMonth()===cursor.getMonth()"
          type="button" @click="choose(d)"
          :data-date="localDateKey(d)"
          :data-expired="d<today?'true':'false'"
          :data-disabled="isDisabled(d) ? 'true' : 'false'"
          :disabled="isDisabled(d)"
          :class="[
            theme.mini.dayBase,
            isDisabled(d) ? theme.mini.expired : '',
            
            // CHANGE 3: Logic update. Agar Today hai to 'today' class, warna 'hover' class.
            sameDay(d, today) ? theme.mini.today : 'hover:bg-gray-300', 
            
            !isDisabled(d) && sameDay(d, selectedDate) ? theme.mini.selected : '',
            d.getDay() === 0 ? 'text-[#FF6A6A]' : ''
          ]">
          <span class="text-[0.75rem] font-medium ">{{ d.getDate() }}</span>
          <span
            v-if="dotMap[localDateKey(d)]"
            :class="[
              theme.mini.dot,
              !isDisabled(d) && sameDay(d, selectedDate) ? theme.mini.selectedDot : '',
            ]"
            data-has-events="true"
          ></span>
        </button>

          <div v-else class="w-[37.43px] h-[37px]"></div>
        </template>
      </div>

    </section>
</template>

<script>
import { SOD, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addMonths, monthNames } from '@/utils/calendarHelpers.js';
import { useBookingTranslations } from "@/i18n/bookingTranslations.js";

export default {
  name: 'MiniCalendar',
  setup() {
    const { t } = useBookingTranslations();
    return { t };
  },
  props: {
    monthDate: { type: Date, required: true },
    selectedDate: { type: Date, required: true },
    events: { type: Array, default: () => [] },
    theme: { type: Object, default: () => ({}) },
    dataAttrs: { type: Object, default: () => ({}) },
    minDate: { type: [Date, String], default: null },
    maxDate: { type: [Date, String], default: null },
  },
  emits: ['date-selected'],
  data() { return { today: SOD(new Date()), cursor: new Date(this.monthDate) }; },
  watch: {
  monthDate: {
    immediate: true,
    handler(newVal) {
      if (newVal) {
        // Hamesha cursor ko update karein jab parent se new date aaye
        this.cursor = new Date(newVal);
      }
    }
  }
},
  computed: {
    tinyWeekdays() {
      return [
        this.t("date_sun_tiny"),
        this.t("date_mon_tiny"),
        this.t("date_tue_tiny"),
        this.t("date_wed_tiny"),
        this.t("date_thu_tiny"),
        this.t("date_fri_tiny"),
        this.t("date_sat_tiny"),
      ];
    },
    header() { return `${monthNames[this.cursor.getMonth()]} ${this.cursor.getFullYear()}` },
    days() {
      const s = startOfWeek(startOfMonth(this.cursor));
      const e = endOfWeek(endOfMonth(this.cursor));
      const arr = []; for (let d = new Date(s); d <= e; d = addDays(d, 1)) arr.push(new Date(d));
      return arr;
    },
    dotMap() {
      const m = {};
      (this.events || []).forEach(ev => {
        if (!ev || !ev.start || !ev.end) return;
        const s = SOD(new Date(ev.start)); const e = SOD(new Date(ev.end));
        for (let d = new Date(s); d <= e; d = addDays(d, 1)) { const k = this.localDateKey(d); m[k] = (m[k] || 0) + 1; }
      });
      return m;
    }
  },
  methods: {
    sd(d) { return SOD(d); },
    localDateKey(d) {
      if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    },
    normalizedBound(value) {
      if (!value) return null;
      const date = value instanceof Date ? value : new Date(`${String(value).slice(0, 10)}T00:00:00`);
      if (Number.isNaN(date.getTime())) return null;
      return SOD(date);
    },
    isDisabled(d) {
      if (!d) return true;
      const day = SOD(d);
      const min = this.normalizedBound(this.minDate);
      const max = this.normalizedBound(this.maxDate);
      if (day < this.today) return true;
      if (min && day < min) return true;
      if (max && day > max) return true;
      return false;
    },
    sameDay(a, b) { return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); },
    choose(d) {
      if (!d) return;
      if (this.isDisabled(d)) return;
      console.log('[mini] choose', this.localDateKey(d));
      this.$emit('date-selected', new Date(d));
    },
    shiftMonth(n) { this.cursor = addMonths(this.cursor, n); },
    goToday() { this.cursor = new Date(); this.choose(this.cursor); }
  }
};
</script>
