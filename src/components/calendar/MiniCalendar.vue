<template>
  <section
      :class="theme.mini.wrapper"
      v-bind="dataAttrs"
      data-role="mini"
      :data-month="cursor.getMonth()+1"
      :data-year="cursor.getFullYear()">

      <div class="grid grid-cols-7 text-[0.75rem] font-bold  uppercase tracking-wide ">
        <div v-for="(w, idx) in tinyWeekdays" :key="idx" :class="['text-center w-[2.339rem] h-[1.25rem]', idx===0 ? 'text-[#FF6A6A]' : '']">{{ w }}</div>
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
            'relative flex flex-col items-center justify-center',
            theme.mini?.dayBase || '',
            isDisabled(d) ? (theme.mini?.expired || 'opacity-40') : '',
            
            !isDisabled(d) && sameDay(d, selectedDate)
              ? (theme.mini?.selected || 'bg-[#101828] !font-semibold text-white')
              : (sameDay(d, today)
                  ? (theme.mini?.today || 'bg-[#101828] !font-semibold text-white')
                  : (!isDisabled(d) ? 'hover:bg-gray-300' : '')),
            
            d.getDay() === 0 ? 'text-[#FF6A6A]' : ''
          ]">
          <span class="text-[0.75rem] ">{{ d.getDate() }}</span>
          <span
            v-if="dotMap[localDateKey(d)] && (!hidePastDots || d >= today)"
            :class="[
              'absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full pointer-events-none block z-10',
              dotMap[localDateKey(d)].hasPending
                ? ((sameDay(d, selectedDate) || sameDay(d, today))
                    ? 'w-1 h-1 !bg-transparent border border-white'
                    : (theme.mini?.pendingDot || 'w-1 h-1 !bg-transparent border border-[#101828]'))
                : [
                    theme.mini?.dot || 'w-1 h-1 bg-[#101828]',
                    (sameDay(d, selectedDate) || sameDay(d, today)) ? (theme.mini?.selectedDot || '!bg-white') : ''
                  ]
            ]"
            data-has-events="true"
            :data-pending="dotMap[localDateKey(d)].hasPending ? 'true' : 'false'"
          ></span>
        </button>

          <div v-else class="w-[2.339rem] h-[2.313rem]"></div>
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
    hidePastDots: { type: Boolean, default: false },
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
      const safeParse = (val) => {
        if (!val) return null;
        if (val instanceof Date) return Number.isNaN(val.getTime()) ? null : val;
        if (typeof val === "number") return new Date(val);
        if (typeof val === "string") {
          let d = new Date(val);
          if (!Number.isNaN(d.getTime())) return d;
          d = new Date(val.replace(" ", "T"));
          if (!Number.isNaN(d.getTime())) return d;
        }
        return null;
      };

      (this.events || []).forEach(ev => {
        if (!ev) return;

        const startRaw = ev.start
          || ev.startIso
          || ev.startAtIso
          || ev.startAt
          || ev.startDate
          || ev.date
          || ev.time
          || ev.raw?.start
          || ev.raw?.startIso
          || ev.raw?.startAtIso
          || ev.raw?.startAt;

        const endRaw = ev.end
          || ev.endIso
          || ev.endAtIso
          || ev.endAt
          || ev.endDate
          || ev.raw?.end
          || ev.raw?.endIso
          || ev.raw?.endAtIso
          || ev.raw?.endAt
          || startRaw;

        if (!startRaw) return;

        const startDateObj = safeParse(startRaw);
        const endDateObj = safeParse(endRaw) || startDateObj;

        if (!startDateObj || !endDateObj) return;

        const s = SOD(startDateObj);
        const e = SOD(endDateObj);
        if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return;

        const status = String(ev.status || ev.bookingStatus || ev.state || ev.raw?.status || "").toLowerCase();
        const isPending = status === "pending" || status === "pending_hold" || status.includes("pending") || Boolean(ev.isPending);

        for (let d = new Date(s); d <= e; d = addDays(d, 1)) {
          const k = this.localDateKey(d);
          if (!m[k]) {
            m[k] = { count: 0, hasPending: false, hasConfirmed: false };
          }
          m[k].count += 1;
          if (isPending) {
            m[k].hasPending = true;
          } else {
            m[k].hasConfirmed = true;
          }
        }
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
