<template>
  <div class="flex flex-col gap-4">

    <!-- Date -->
    <div class="flex flex-col gap-1.5">
      <span class="text-gray-500 text-xs">
        New event date<span v-if="optional"> </span>
      </span>

      <!-- Read-only date display -->
      <div v-if="dateReadonly" class="text-gray-900 text-sm font-semibold py-1">
        {{ formattedSelectedDate || '—' }}
      </div>

      <!-- Date input -->
      <template v-else>
        <div class="flex items-center gap-2 border-b border-gray-300 pb-1.5 focus-within:border-gray-500 transition-colors">
          <svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>
          </svg>
          <input
            v-model="localDate"
            type="date"
            :min="minDate"
            :max="maxDate"
            class="flex-1 text-sm text-gray-900 font-medium outline-none bg-transparent"
            @change="onDateChange"
          />
        </div>
        <span v-if="originalEventDate" class="text-gray-400 text-xs mt-0.5">
          Original event date: {{ originalEventDate }}
        </span>
        <span v-if="dateRangeLabel" class="text-gray-400 text-xs">
          Available: {{ dateRangeLabel }}
        </span>
        <span v-else-if="availableDayLabels" class="text-gray-400 text-xs">
          Available days: {{ availableDayLabels }}
        </span>
        <span v-if="invalidDayWarning" class="text-amber-500 text-xs">
          {{ invalidDayWarning }}
        </span>
      </template>
    </div>

    <!-- Time -->
    <div class="flex flex-col gap-1.5">
      <span class="text-gray-500 text-xs">New start time</span>

      <div class="flex items-center gap-3">
        <div class="w-1/2">
        <CustomDropdown
          v-model="localStartTime"
          :options="timeSlotOptions"
          placeholder="Select a time"
          :button-class="[
            'w-full border-b border-gray-300 pb-1.5 bg-transparent outline-none text-sm text-gray-900 font-medium transition-colors',
            (!dateReadonly && !isValidDay) ? 'opacity-40 pointer-events-none' : ''
          ].join(' ')"
          dropdown-class="w-full bg-white shadow-lg overflow-y-auto max-h-52 border border-gray-100 rounded-md"
          option-class="px-3 py-2 text-sm text-gray-700"
        />
        </div>
        <span v-if="computedEndTime" class="text-gray-600 text-sm font-medium">
          -{{ computedEndTime }}
        </span>
      </div>

      <span v-if="originalStartTime" class="text-gray-400 text-xs mt-0.5">
        Original start time: {{ originalStartTime }}
      </span>
      <span v-if="!dateReadonly && localDate && !isValidDay" class="text-gray-400 text-xs">
        Select a valid date to see available times.
      </span>
    </div>

  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import CustomDropdown from '@/components/ui/dropdown/CustomDropdown.vue'
import { buildCandidateSlotsForEventDate } from '@/services/bookings/utils/bookingSlotUtils.js'

const props = defineProps({
  event:             { type: Object,  default: null },
  modelValue:        { type: Object,  default: () => ({ date: '', startTime: '' }) },
  durationMs:        { type: Number,  default: null },
  originalEventDate: { type: String,  default: null },
  originalStartTime: { type: String,  default: null },
  dateReadonly:      { type: Boolean, default: false },
  compact:           { type: Boolean, default: false },
  optional:          { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

// ── Local state ────────────────────────────────────────────────────────────────
const localDate      = ref(props.modelValue?.date      || '')
const localStartTime = ref(props.modelValue?.startTime || '')

watch([localDate, localStartTime], () => {
  emit('update:modelValue', { date: localDate.value, startTime: localStartTime.value })
})

watch(() => props.modelValue, (val) => {
  if (val?.date      !== localDate.value)      localDate.value      = val?.date      || ''
  if (val?.startTime !== localStartTime.value) localStartTime.value = val?.startTime || ''
}, { deep: true })

// ── Style ─────────────────────────────────────────────────────────────────────
const labelClass = computed(() =>
  props.compact
    ? 'text-gray-500 text-xs'
    : 'text-gray-700 text-base font-medium flex items-baseline gap-1.5'
)

// ── Helpers ───────────────────────────────────────────────────────────────────
function pad(n) { return String(n).padStart(2, '0') }
function fmtYMD(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
function parseYMD(str) {
  if (!str) return null
  const [y, m, d] = str.split('-').map(Number)
  return (y && m && d) ? new Date(y, m - 1, d) : null
}

// ── Event-derived values ──────────────────────────────────────────────────────
const slots      = computed(() => Array.isArray(props.event?.slots)      ? props.event.slots      : [])
const repeatRule = computed(() => props.event?.repeatRule || 'weekly')
const repeatX    = computed(() => Number(props.event?.repeatX)  || 2)
const dateFrom   = computed(() => parseYMD(String(props.event?.dateFrom || '').slice(0, 10)))
const dateTo     = computed(() => parseYMD(String(props.event?.dateTo   || '').slice(0, 10)))

// ── Date range (min/max for native picker) ────────────────────────────────────
const today = new Date(); today.setHours(0, 0, 0, 0)

const minDate = computed(() => {
  const from = dateFrom.value && dateFrom.value > today ? dateFrom.value : today
  return fmtYMD(from)
})

const maxDate = computed(() =>
  dateTo.value ? fmtYMD(dateTo.value) : ''
)

// ── Day validation ────────────────────────────────────────────────────────────
const allowedDays = computed(() =>
  new Set(slots.value.map(s => String(s?.day || '').toLowerCase()).filter(Boolean))
)

const availableDayLabels = computed(() => {
  const dayList = [...allowedDays.value]
    .map(d => d.charAt(0).toUpperCase() + d.slice(1))
    .join(', ')
  if (!dayList) return null
  if (repeatRule.value === 'everyXWeeks') return `every ${repeatX.value} weeks on ${dayList}`
  return dayList
})

const dateRangeLabel = computed(() => {
  if (repeatRule.value !== 'monthly') return null
  const from = dateFrom.value
  if (!from) return null
  const d = from.getDate()
  const suffix = d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'
  return `the ${d}${suffix} of each month`
})

// ── rebuildAvailabilityPreview — delegates to bookingSlotUtils for all rules ──
const rebuildAvailabilityPreview = computed(() => {
  if (!localDate.value || !props.event) return []
  const rawBase = props.event?.raw ?? props.event
  const sessionMinutes = props.durationMs ? Math.max(1, Math.ceil(props.durationMs / 60000)) : undefined
  const eventArg = {
    ...props.event,
    raw: {
      ...rawBase,
      ...(sessionMinutes !== undefined ? { sessionDurationMinutes: sessionMinutes } : {}),
    },
  }
  return buildCandidateSlotsForEventDate(eventArg, localDate.value, {})
})

const isValidDay = computed(() => {
  if (!localDate.value) return true
  return rebuildAvailabilityPreview.value.length > 0
})

const invalidDayWarning = computed(() => {
  if (!localDate.value || isValidDay.value) return null
  const rule = repeatRule.value
  if (rule === 'monthly') {
    const d = dateFrom.value?.getDate()
    if (!d) return 'This date is not available.'
    const suffix = d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'
    return `This date is not the ${d}${suffix} of the month.`
  }
  if (rule === 'everyXWeeks') {
    return `This week is not in the schedule. Available ${availableDayLabels.value}.`
  }
  if (availableDayLabels.value) return `This date is not available. Please select a ${availableDayLabels.value} day.`
  return 'This date is not available.'
})

// ── Time slot options (from rebuildAvailabilityPreview) ───────────────────────
const timeSlotOptions = computed(() =>
  rebuildAvailabilityPreview.value.map(s => ({ value: s.startHm, label: s.label }))
)

// ── Computed end time ─────────────────────────────────────────────────────────
const computedEndTime = computed(() => {
  if (!localStartTime.value || !props.durationMs) return null
  const [h, m] = localStartTime.value.split(':').map(Number)
  const endMs  = h * 3600000 + m * 60000 + props.durationMs
  const endH   = Math.floor(endMs / 3600000) % 24
  const endM   = Math.floor((endMs % 3600000) / 60000)
  const suffix = endH >= 12 ? 'PM' : 'AM'
  const h12    = endH % 12 || 12
  return `${h12}:${pad(endM)} ${suffix}`
})

// ── Formatted selected date (for dateReadonly mode) ───────────────────────────
const formattedSelectedDate = computed(() => {
  const d = parseYMD(localDate.value)
  return d ? d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null
})

// ── Actions ───────────────────────────────────────────────────────────────────
function onDateChange() {
  // Reset time whenever date changes — slot window may differ
  localStartTime.value = ''
}
</script>
