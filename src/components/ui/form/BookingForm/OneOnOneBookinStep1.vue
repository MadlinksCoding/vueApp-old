  <script setup>
  import { computed, onMounted, onUnmounted, ref, watch } from "vue";
  import CheckboxGroup from "../checkbox/CheckboxGroup.vue";
  import ButtonComponent from "@/components/dev/button/ButtonComponent.vue";
  import BookingSectionsWrapper from "../BookingForm/HelperComponents/BookingSectionsWrapper.vue";
  import BaseInput from "@/components/dev/input/BaseInput.vue";
  import ThumbnailUploaderNay from "../../global/media/uploader/HelperComponents/ThumbnailUploaderNay.vue";
  import TooltipIcon from "@/components/ui/tooltip/TooltipIcon.vue";
  import CustomDropdown from "@/components/ui/dropdown/CustomDropdown.vue";
  import videoIcon from '@/assets/images/icons/video-recorder.webp'
  import phoneIcon from '@/assets/images/icons/phone.webp'
  import musicIcon from '@/assets/images/icons/music-note.webp'
  import minusIcon from '@/assets/images/icons/minus-circle.webp'
  import plusIcon from '@/assets/images/icons/plus-circle.webp'
  import cloudMoonIcon from '@/assets/images/icons/cloud-moon.webp'
  import cloudMoonPinkIcon from '@/assets/images/icons/cloud-moon-pink.webp'
  import alignLeftIcon from '@/assets/images/icons/align-left.svg'
  import calendarIcon from '@/assets/images/icons/calendar-empty.svg'
  import trashIcon from '@/assets/images/icons/trash-01.svg'

  import Quill from 'quill';
  import 'quill/dist/quill.snow.css';
  import { showToast } from "@/utils/toastBus.js";
  import { formatBookingValidationErrors, useBookingTranslations } from "@/i18n/bookingTranslations.js";

  const { t } = useBookingTranslations();

  const callTypeOptions = [
    { label: t('dashboard_video_call'), value: 'video', image: videoIcon },
    { label: t('dashboard_audio_call'), value: 'audio', image: phoneIcon }
  ];

  const repeatRuleOptions = [
    { label: t('booking_repeat_weekly'), value: 'weekly' },
    { label: t('booking_repeat_monthly'), value: 'monthly' },
    { label: t('booking_custom_repeat'), value: 'doesNotRepeat' },
  ];

  const lateStartActionOptions = [
    { label: t('booking_allow_reschedule'), value: 'reschedule' },
    { label: t('booking_issue_refund'), value: 'refund' },
    { label: t('booking_late_start_next_discount'), value: 'nextDiscount' }
  ];

  // Accept Engine
  const props = defineProps({
    engine: {
      type: Object,
      required: true,
    },
    embedded: {
      type: Boolean,
      default: false,
    },
  });
  const DEFAULT_VUE_CREATOR_ID = 1407;

  function ensureVueCreatorIdFallback() {
    if (props.embedded) return;

    const currentCreatorId = Number(props.engine?.getState?.("creatorId") ?? props.engine?.state?.creatorId);
    if (Number.isFinite(currentCreatorId) && currentCreatorId > 0) return;

    props.engine.setState("creatorId", DEFAULT_VUE_CREATOR_ID, {
      reason: "booking-step1-default-creator",
      silent: true,
    });
  }

  const footerClass = computed(() => {
    // if (props.embedded) {
    //   return "sticky bottom-0 z-20 flex justify-end border-t border-slate-200/70 bg-[linear-gradient(180deg,rgba(249,250,251,0.6)_0%,rgba(249,250,251,0.96)_35%,rgba(249,250,251,1)_100%)] px-2 pt-3 md:px-4 lg:px-6";
    // }
    if (props.embedded) {
       return "flex justify-end fixed bottom-0 right-0 z-10";
    }

    return "flex justify-end fixed bottom-0 right-0 z-10";
  });

  // Refs
  // Refs
  // Initialize from engine state (deep copy to avoid reactivity issues with v-model on props)
  const initialRepeatRuleRaw = props.engine.state.repeatRule || "weekly";
  const initialRepeatRule = initialRepeatRuleRaw === "everyXWeeks"
    ? "weekly"
    : initialRepeatRuleRaw;

  const formData = ref({
    eventTitle: props.engine.state.eventTitle || "",
    eventDescription: props.engine.state.eventDescription || "",
    eventColorSkin: props.engine.state.eventColorSkin || "#5549FF",
    repeatRule: initialRepeatRule,
    repeatX: Number(props.engine.state.repeatX) || 2,
    eventCallType: props.engine.state.eventCallType || "video",
    eventRingtoneUrl: props.engine.state.eventRingtoneUrl || "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
    selectedDate: props.engine.state.selectedDate || new Date().toISOString().slice(0, 10),
    selectedStartTime: props.engine.state.selectedStartTime || "15:00",
    selectedEndTime: props.engine.state.selectedEndTime || "16:00",
    dateFrom: props.engine.state.dateFrom || "",
    dateTo: props.engine.state.dateTo || "",
    weeklyAvailability: Array.isArray(props.engine.state.weeklyAvailability)
      ? JSON.parse(JSON.stringify(props.engine.state.weeklyAvailability))
      : [],
    monthlyAvailability: Array.isArray(props.engine.state.monthlyAvailability)
      ? JSON.parse(JSON.stringify(props.engine.state.monthlyAvailability))
      : [],
    oneTimeAvailability: Array.isArray(props.engine.state.oneTimeAvailability)
      ? JSON.parse(JSON.stringify(props.engine.state.oneTimeAvailability))
      : [],
    advanceCancelWindowUnit: props.engine.state.advanceCancelWindowUnit || "day",
    bufferUnit: props.engine.state.bufferUnit || "minutes",
    lateStartAction: props.engine.state.lateStartAction || "reschedule",
    lateStartDiscountPercent: props.engine.state.lateStartDiscountPercent || "",
    setReminders: props.engine.state.setReminders || false,
    duration: props.engine.state.duration || "",
    maxSessionDuration: props.engine.state.maxSessionDuration || "",
    basePrice: props.engine.state.basePrice || "",
    sessionMinimum: props.engine.state.sessionMinimum || "",
    discountPercentage: props.engine.state.discountPercentage || "",
    bookingFee: props.engine.state.bookingFee || "",
    waitlistSpots: props.engine.state.waitlistSpots || "",
    advanceVoid: props.engine.state.advanceVoid || "",
    offHourSurcharge: props.engine.state.offHourSurcharge || "",
    calendarDuration: props.engine.state.calendarDuration || "",
    remindMeTime: props.engine.state.remindMeTime || "",
    bufferTime: props.engine.state.bufferTime || "",
    maxBookingsPerDay: props.engine.state.maxBookingsPerDay || "",
    waitlistSlots: props.engine.state.waitlistSlots || "",
    rescheduleFee: props.engine.state.rescheduleFee || "",
    cancellationFee: props.engine.state.cancellationFee || "",
    extendSessionMax: props.engine.state.extendSessionMax || "",
    allowLongerSessions: props.engine.state.allowLongerSessions || false,
    enableLongerDiscount: props.engine.state.enableLongerDiscount || false,
    enableFirstTimeDiscount: props.engine.state.enableFirstTimeDiscount || false,
    firstTimeDiscount: props.engine.state.firstTimeDiscount || "",
    enableBookingFee: props.engine.state.enableBookingFee || false,
    allowInstantBooking: props.engine.state.allowInstantBooking || false,
    disableChatBeforeCall: props.engine.state.disableChatBeforeCall || false,
    enableRescheduleFee: props.engine.state.enableRescheduleFee || false,
    enableCancellationFee: props.engine.state.enableCancellationFee || false,
    allowAdvanceCancellation: props.engine.state.allowAdvanceCancellation || false,
    addOffHourSurcharge: props.engine.state.addOffHourSurcharge || false,
    disableChatDuringCall: props.engine.state.disableChatDuringCall || false,
    requestExtendSession: props.engine.state.requestExtendSession || false,
    setBufferTime: props.engine.state.setBufferTime || false,
    setMaxBookings: props.engine.state.setMaxBookings || false,
    allowWaitlist: props.engine.state.allowWaitlist || false,
    eventImageUrl: props.engine.state.eventImageUrl || "",
  });

  // Watch for changes and update engine state
  // Watch for changes and update engine state
  watch(formData, (newVal) => {
    Object.keys(newVal).forEach(key => {
      props.engine.setState(key, newVal[key], { silent: true });
    });
  }, { deep: true });

  const onEventImageUploaded = ({ media_urls }) => {
    formData.value.eventImageUrl = Array.isArray(media_urls) ? media_urls[0] : media_urls;
  };

  const quillEditor = ref(null);

  // Accordion State
  const sectionsState = ref({
    callSettings: true,
    bookingSettings: true
  });

  const toggleSection = (key) => {
    sectionsState.value[key] = !sectionsState.value[key];
  };

  const goToNext = async () => {
    try {
      await props.engine.goToStep(2, { throwOnBlocked: true });
    } catch (error) {
      const messages = formatBookingValidationErrors(error?.errors || [], t);
      const fallback = error?.message || t("booking_validation_weekly_slot_required");
      const body = messages.length ? messages.join(" ") : fallback;
      showToast({
        type: "error",
        title: t("common_validation_failed"),
        message: body,
      });
    }
  };

  const ringtoneOptions = [
    { label: t("booking_ringtone_1"), value: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3", image: musicIcon },
    { label: t("booking_ringtone_2"), value: "https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3", image: musicIcon },
    { label: t("booking_ringtone_3"), value: "https://assets.mixkit.co/active_storage/sfx/2871/2871-preview.mp3", image: musicIcon },
  ];

  const colorOptions = [
    { label: t("booking_color_blue"), value: "#5549FF" },
    { label: t("booking_color_red"), value: "#FF3B30" },
    { label: t("booking_color_green"), value: "#22C55E" },
    { label: t("booking_color_pink"), value: "#FF2D92" },
    { label: t("booking_color_orange"), value: "#F97316" },
    { label: t("booking_color_purple"), value: "#8B5CF6" },
    { label: t("booking_color_teal"), value: "#14B8A6" },
  ];

  const bufferUnitOptions = [
    { label: t("booking_minutes"), value: "minutes" },
    { label: t("booking_hours"), value: "hours" },
  ];

  const timeUnitOptions = [
    { label: t("booking_minute"), value: "minute" },
    { label: t("booking_hour"), value: "hour" },
    { label: t("common_day"), value: "day" },
  ];

  let previewAudio = null;
  const previewRingtone = async () => {
    try {
      if (!formData.value.eventRingtoneUrl) return;
      if (previewAudio) {
        previewAudio.pause();
        previewAudio.currentTime = 0;
      }
      previewAudio = new Audio(formData.value.eventRingtoneUrl);
      await previewAudio.play();
    } catch (error) {
      showToast({
        type: "warning",
        title: t("common_error"),
        message: t("booking_ringtone_preview_failed"),
      });
    }
  };

  onUnmounted(() => {
    if (previewAudio) {
      previewAudio.pause();
      previewAudio = null;
    }
  });

  onMounted(() => {
    ensureVueCreatorIdFallback();

    // Quill Setup (Preserved exactly as provided)
    const icons = Quill.import('ui/icons');
    icons['bold'] = '<img src="https://i.ibb.co/HLRRqmHp/bold-icon.webp" alt="" style="width:30px;">';
    icons['italic'] = '<img src="https://i.ibb.co/QvdPyg67/italic-icon.webp" alt="" style="width:30px;">';
    icons['link'] = '<img src="https://i.ibb.co/gZ7JLJ28/link-icon.webp" alt="" style="width:30px;">';
    icons['list']['ordered'] = '<img src="https://i.ibb.co/Q7WRxw9Y/list-ol-icon.webp" alt="" style="width:30px;">';
    icons['list']['bullet'] = '<img src="https://i.ibb.co/rfH1rbT7/list-ul-icon.webp" alt="" style="width:30px;">';

    new Quill(quillEditor.value, {
      modules: { toolbar: [['bold', 'italic', 'link', { 'list': 'ordered' }, { 'list': 'bullet' }]] },
      placeholder: t("booking_event_description_placeholder"),
      theme: 'snow'
    });

    // Set initial content if exists
    if (formData.value.eventDescription) {
      quillEditor.value.firstChild.innerHTML = formData.value.eventDescription;
    }
  });

  function makeSlot(startTime = "00:00", endTime = "03:00", offHours = false) {
    return { startTime, endTime, offHours: Boolean(offHours) };
  }

  function normalizeMonthlyAvailability(input = []) {
    if (!Array.isArray(input) || input.length === 0) {
      return [makeSlot("00:00", "03:00", false)];
    }

    return input
      .map((slot) => ({
        startTime: typeof slot?.startTime === "string" ? slot.startTime : null,
        endTime: typeof slot?.endTime === "string" ? slot.endTime : null,
        offHours: Boolean(slot?.offHours),
      }))
      .filter((slot) => slot.startTime && slot.endTime);
  }

  function getTodayIsoDate() {
    return new Date().toISOString().slice(0, 10);
  }

  const todayIsoDate = getTodayIsoDate();

  function getDateToMin() {
    if (!isIsoDate(formData.value.dateFrom)) return todayIsoDate;
    return formData.value.dateFrom > todayIsoDate ? formData.value.dateFrom : todayIsoDate;
  }

  function getOneTimeDateMin() {
    const fromDate = isIsoDate(formData.value.dateFrom) ? formData.value.dateFrom : null;
    if (!fromDate) return todayIsoDate;
    return fromDate > todayIsoDate ? fromDate : todayIsoDate;
  }

  function createOneTimeDate(date = getTodayIsoDate()) {
    return {
      id: `date_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      date,
      slots: [],
    };
  }

  function makeDefaultWeeklyAvailability() {
    return [
      { key: "sun", name: "Sun", unavailable: true, offHours: false, slots: [] },
      { key: "mon", name: "Mon", unavailable: true, offHours: false, slots: [] },
      { key: "tue", name: "Tue", unavailable: true, offHours: false, slots: [] },
      { key: "wed", name: "Wed", unavailable: true, offHours: false, slots: [] },
      { key: "thu", name: "Thu", unavailable: true, offHours: false, slots: [] },
      { key: "fri", name: "Fri", unavailable: true, offHours: false, slots: [] },
      { key: "sat", name: "Sat", unavailable: true, offHours: false, slots: [] },
    ];
  }

  const weekdayLabelKeys = {
    sun: "date_sun_short",
    mon: "date_mon_short",
    tue: "date_tue_short",
    wed: "date_wed_short",
    thu: "date_thu_short",
    fri: "date_fri_short",
    sat: "date_sat_short",
  };

  function getWeekdayLabel(day) {
    const key = String(day?.key || "").toLowerCase();
    return weekdayLabelKeys[key] ? t(weekdayLabelKeys[key]) : (day?.name || "");
  }

  const DAY_KEY_TO_INDEX = {
    sun: 0,
    sunday: 0,
    mon: 1,
    monday: 1,
    tue: 2,
    tuesday: 2,
    wed: 3,
    wednesday: 3,
    thu: 4,
    thursday: 4,
    fri: 5,
    friday: 5,
    sat: 6,
    saturday: 6,
  };

  const DAY_INDEX_TO_KEY = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

  function isWeeklyRepeatRule() {
    return formData.value.repeatRule === "weekly";
  }

  function parseIsoDateToLocalNoon(isoDate) {
    if (!isIsoDate(isoDate)) return null;
    const localDate = new Date(`${isoDate}T12:00:00`);
    return Number.isNaN(localDate.getTime()) ? null : localDate;
  }

  function getAllowedWeeklyDayKeysForRange() {
    if (!isWeeklyRepeatRule()) return null;
    if (!isIsoDate(formData.value.dateFrom) || !isIsoDate(formData.value.dateTo)) return null;

    const startDate = parseIsoDateToLocalNoon(formData.value.dateFrom);
    const endDate = parseIsoDateToLocalNoon(formData.value.dateTo);
    if (!startDate || !endDate) return null;

    const [fromDate, toDate] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate];
    const allowed = new Set();
    const cursor = new Date(fromDate);

    while (cursor <= toDate) {
      allowed.add(DAY_INDEX_TO_KEY[cursor.getDay()]);
      cursor.setDate(cursor.getDate() + 1);
    }

    return allowed;
  }

  function isWeeklyDayLocked(dayLike) {
    const allowedDays = getAllowedWeeklyDayKeysForRange();
    if (!allowedDays) return false;

    const normalized = String(dayLike || "").toLowerCase();
    const dayIndex = DAY_KEY_TO_INDEX[normalized];
    if (!Number.isFinite(dayIndex)) return false;

    const canonicalKey = DAY_INDEX_TO_KEY[dayIndex];
    return !allowedDays.has(canonicalKey);
  }

  function applyWeeklyRangeLocking() {
    if (!isWeeklyRepeatRule()) return;
    const allowedDays = getAllowedWeeklyDayKeysForRange();
    if (!allowedDays) return;

    let mutated = false;
    weekDays.value.forEach((day) => {
      if (!isWeeklyDayLocked(day.key || day.name)) return;

      if (!day.unavailable || day.slots.length > 0 || day.offHours) {
        day.unavailable = true;
        day.slots = [];
        day.offHours = false;
        mutated = true;
      }
    });

    if (mutated) {
      syncAvailabilityToForm();
    }
  }

  function normalizeAvailability(input = []) {
    const defaults = makeDefaultWeeklyAvailability();
    if (!Array.isArray(input) || input.length === 0) return defaults;

    return defaults.map((defaultDay, index) => {
      const sourceDay = input[index] || {};
      const sourceSlots = Array.isArray(sourceDay.slots) ? sourceDay.slots : [];

      return {
        key: sourceDay.key || defaultDay.key,
        name: sourceDay.name || defaultDay.name,
        unavailable: Boolean(sourceDay.unavailable),
        offHours: Boolean(sourceDay.offHours),
        slots: sourceSlots
          .map((slot) => ({
            startTime: typeof slot?.startTime === "string" ? slot.startTime : null,
            endTime: typeof slot?.endTime === "string" ? slot.endTime : null,
            offHours: Boolean(slot?.offHours ?? sourceDay.offHours),
          }))
          .filter((slot) => slot.startTime && slot.endTime),
      };
    }).map((day) => {
      if (day.unavailable) return { ...day, slots: [] };
      return day;
    });
  }

  function normalizeOneTimeAvailability(input = []) {
    if (!Array.isArray(input) || input.length === 0) {
      return [createOneTimeDate(formData.value.dateFrom || formData.value.selectedDate || getTodayIsoDate())];
    }

    return input.map((entry) => ({
      id: entry?.id || `date_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      date: typeof entry?.date === "string" && entry.date ? entry.date : getTodayIsoDate(),
      slots: Array.isArray(entry?.slots) && entry.slots.length > 0
        ? entry.slots.map((slot) => ({
          startTime: typeof slot?.startTime === "string" ? slot.startTime : "12:00",
          endTime: typeof slot?.endTime === "string" ? slot.endTime : "15:00",
        }))
        : [],
    }));
  }

  formData.value.weeklyAvailability = normalizeAvailability(formData.value.weeklyAvailability);
  formData.value.monthlyAvailability = normalizeMonthlyAvailability(formData.value.monthlyAvailability);
  formData.value.oneTimeAvailability = normalizeOneTimeAvailability(formData.value.oneTimeAvailability);

  const weekDays = ref(formData.value.weeklyAvailability);
  const monthlySlots = ref(formData.value.monthlyAvailability);
  const oneTimeDates = ref(formData.value.oneTimeAvailability);

  function to12HourLabel(time24 = "00:00") {
    const [rawHour = "0", rawMinute = "0"] = String(time24).split(":");
    const hour = Number(rawHour);
    const minute = Number(rawMinute);
    const safeHour = Number.isFinite(hour) ? hour : 0;
    const safeMinute = Number.isFinite(minute) ? minute : 0;
    const period = safeHour >= 12 ? t("booking_period_pm") : t("booking_period_am");
    const twelveHour = safeHour % 12 === 0 ? 12 : safeHour % 12;
    return `${twelveHour}:${String(safeMinute).padStart(2, "0")} ${period}`;
  }

  const timeOptions = Array.from({ length: 48 }, (_, index) => {
    const hours = Math.floor(index / 2);
    const minutes = index % 2 === 0 ? "00" : "30";
    const value = `${String(hours).padStart(2, "0")}:${minutes}`;
    return { value, label: to12HourLabel(value) };
  });

  function syncAvailabilityToForm() {
    formData.value.weeklyAvailability = weekDays.value.map((day) => ({
      key: day.key,
      name: day.name,
      unavailable: day.unavailable,
      offHours: day.slots.some((slot) => Boolean(slot.offHours)),
      slots: day.slots.map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        offHours: Boolean(slot.offHours),
      })),
    }));

    formData.value.oneTimeAvailability = oneTimeDates.value.map((entry) => ({
      id: entry.id,
      date: entry.date,
      slots: entry.slots.map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
    }));

    formData.value.monthlyAvailability = monthlySlots.value.map((slot) => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      offHours: Boolean(slot.offHours),
    }));

    if (formData.value.repeatRule === "doesNotRepeat") {
      const firstDate = oneTimeDates.value[0];
      if (firstDate && firstDate.slots.length > 0) {
        formData.value.selectedDate = firstDate.date;
        formData.value.dateFrom = firstDate.date;
        formData.value.dateTo = firstDate.date;
        formData.value.selectedStartTime = firstDate.slots[0].startTime;
        formData.value.selectedEndTime = firstDate.slots[0].endTime;
      }
      return;
    }

    if (formData.value.repeatRule === "monthly") {
      if (!formData.value.dateFrom) {
        formData.value.dateFrom = formData.value.selectedDate || getTodayIsoDate();
      }
      const firstMonthlySlot = monthlySlots.value[0];
      if (firstMonthlySlot) {
        formData.value.selectedDate = formData.value.dateFrom;
        formData.value.selectedStartTime = firstMonthlySlot.startTime;
        formData.value.selectedEndTime = firstMonthlySlot.endTime;
      }
      return;
    }

    const firstAvailable = weekDays.value.find((day) => !day.unavailable && day.slots.length > 0);
    if (!firstAvailable) return;

    const firstSlot = firstAvailable.slots[0];
    formData.value.selectedStartTime = firstSlot.startTime;
    formData.value.selectedEndTime = firstSlot.endTime;
  }

  function getTotalWeeklySlotCount() {
    return weekDays.value.reduce((count, day) => (
      count + (Array.isArray(day?.slots) ? day.slots.length : 0)
    ), 0);
  }

  function getTotalOneTimeSlotCount() {
    return oneTimeDates.value.reduce((count, entry) => (
      count + (Array.isArray(entry?.slots) ? entry.slots.length : 0)
    ), 0);
  }

  function getTotalMonthlySlotCount() {
    return Array.isArray(monthlySlots.value) ? monthlySlots.value.length : 0;
  }

  function addDayAvailability(dayIndex) {
    const day = weekDays.value[dayIndex];
    if (!day || isWeeklyDayLocked(day.key || day.name)) return;
    day.unavailable = false;
    day.slots = [makeSlot("00:00", "03:00")];
    day.offHours = false;
    syncAvailabilityToForm();
  }

  function addWeeklySlot(dayIndex) {
    const day = weekDays.value[dayIndex];
    if (!day || isWeeklyDayLocked(day.key || day.name)) return;
    day.unavailable = false;
    day.slots.push(makeSlot("00:00", "03:00"));
    syncAvailabilityToForm();
  }

  function removeWeeklySlot(dayIndex, slotIndex) {
    const day = weekDays.value[dayIndex];
    if (!day || isWeeklyDayLocked(day.key || day.name)) return;
    if (!Array.isArray(day.slots) || getTotalWeeklySlotCount() <= 1) return;

    day.slots.splice(slotIndex, 1);
    if (day.slots.length === 0) {
      day.unavailable = true;
      day.offHours = false;
    } else {
      day.offHours = day.slots.some((slot) => Boolean(slot.offHours));
    }
    syncAvailabilityToForm();
  }

  function toggleSlotOffHours(dayIndex, slotIndex) {
    const day = weekDays.value[dayIndex];
    if (!day || isWeeklyDayLocked(day.key || day.name)) return;
    const slot = day.slots?.[slotIndex];
    if (!slot) return;
    slot.offHours = !slot.offHours;
    day.offHours = day.slots.some((item) => Boolean(item.offHours));
    syncAvailabilityToForm();
  }

  function onSlotChanged() {
    syncAvailabilityToForm();
  }

  function addMonthlySlot() {
    monthlySlots.value.push(makeSlot("00:00", "03:00", false));
    syncAvailabilityToForm();
  }

  function removeMonthlySlot(slotIndex) {
    if (getTotalMonthlySlotCount() <= 1) return;
    monthlySlots.value.splice(slotIndex, 1);
    syncAvailabilityToForm();
  }

  function toggleMonthlySlotOffHours(slotIndex) {
    const slot = monthlySlots.value?.[slotIndex];
    if (!slot) return;
    slot.offHours = !slot.offHours;
    syncAvailabilityToForm();
  }

  function addOneTimeDate() {
    oneTimeDates.value.push(createOneTimeDate(formData.value.dateFrom || getTodayIsoDate()));
    syncAvailabilityToForm();
  }

  function removeOneTimeDate(dateIndex) {
    if (oneTimeDates.value.length <= 1) return;
    oneTimeDates.value.splice(dateIndex, 1);
    syncAvailabilityToForm();
  }

  function addOneTimeSlot(dateIndex) {
    const dateEntry = oneTimeDates.value[dateIndex];
    if (!dateEntry) return;
    dateEntry.slots.push(makeSlot("12:00", "15:00"));
    syncAvailabilityToForm();
  }

  function removeOneTimeSlot(dateIndex, slotIndex) {
    const dateEntry = oneTimeDates.value[dateIndex];
    if (!dateEntry) return;
    if (!Array.isArray(dateEntry.slots) || getTotalOneTimeSlotCount() <= 1) return;

    dateEntry.slots.splice(slotIndex, 1);
    syncAvailabilityToForm();
  }

  function onRepeatRuleChange() {
    if (formData.value.repeatRule === "doesNotRepeat" && oneTimeDates.value.length === 0) {
      oneTimeDates.value = normalizeOneTimeAvailability([]);
    }
    if (formData.value.repeatRule === "monthly" && monthlySlots.value.length === 0) {
      monthlySlots.value = normalizeMonthlyAvailability([]);
    }
    syncAvailabilityToForm();
  }

  const dateRangeMessage = ref("");

  function isIsoDate(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  function enforceDateRange(changedField = "dateFrom") {
    const dateFrom = formData.value.dateFrom;
    const dateTo = formData.value.dateTo;
    dateRangeMessage.value = "";

    if (!isIsoDate(dateFrom) || !isIsoDate(dateTo)) return;
    if (dateFrom <= dateTo) return;

    if (changedField === "dateTo") {
      formData.value.dateFrom = dateTo;
    } else {
      formData.value.dateTo = dateFrom;
    }

    dateRangeMessage.value = t("booking_date_range_adjusted");
  }

  watch(
    () => formData.value.dateFrom,
    (dateFrom) => {
      if (dateFrom) {
        formData.value.selectedDate = dateFrom;
      }
      enforceDateRange("dateFrom");
      applyWeeklyRangeLocking();
    },
    { immediate: true }
  );

  watch(
    () => formData.value.dateTo,
    () => {
      enforceDateRange("dateTo");
      applyWeeklyRangeLocking();
    }
  );

  watch(
    () => formData.value.repeatRule,
    () => {
      onRepeatRuleChange();
      applyWeeklyRangeLocking();
    }
  );

  syncAvailabilityToForm();
</script>

  <template>
    <form class="flex flex-col gap-6 relative px-2 md:px-4 lg:px-6">

      <div class=" self-stretch inline-flex flex-col md:flex-row justify-start items-start gap-4">
        <div class="w-6 h-6 relative overflow-hidden hidden md:block">
          <img :src="alignLeftIcon" alt="" class="w-6 h-6" />
        </div>
        <div class="flex-1  flex md:hidden justify-start items-start gap-2 ">
          <div class="w-6 h-6 relative overflow-hidden block md:hidden">
            <img :src="alignLeftIcon" alt="" class="w-6 h-6"/>
          </div>
          <p class="text-gray-950 text-base font-normal">{{ t("booking_basic_settings") }}</p>
        </div>
        <div class="flex-1 inline-flex flex-col justify-start items-start gap-4 self-stretch">
          <div class="flex w-full">
            <div class="flex-1">
              <BaseInput type="text" :placeholder="t('booking_event_title_placeholder')" v-model="formData.eventTitle" wrapperClass="w-full"
                inputClass="px-3.5 text-gray-900 w-full text-base font-normal outline-none py-2.5 bg-white/30 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300" />
            </div>
            <div class="">
              <CustomDropdown
                v-model="formData.eventColorSkin"
                :options="colorOptions"
                buttonClass="h-full bg-white/50 border-l pr-3 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 outline-none w-full"
                dropdownClass="w-full bg-white shadow-lg overflow-y-auto max-h-60 border border-gray-100 right-0 origin-top-right mt-0"
              >
                <!-- Trigger: Only show the selected color dot -->
                <template #trigger="{ selected }">
                  <div class="flex items-center justify-center p-2">
                    <div class="w-4 h-4 rounded-full shadow-sm" :style="{ backgroundColor: selected }"></div>
                  </div>
                </template>
                
                <!-- Option: Only show the color dot, centered -->
                <template #option="{ option }">
                  <div class="flex justify-start p-3">
                    <div class="w-4 h-4 rounded-full shadow-sm" :style="{ backgroundColor: option.value }"></div>
                  </div>
                </template>
              </CustomDropdown>
            </div>
          </div>
          <QuillEditor v-model="formData.eventDescription" :placeholder="t('booking_event_description_placeholder')" />
          <div class="flex flex-col gap-1.5 w-full">
            <div class="flex flex-col gap-1.5">
              <div class="text-slate-700 text-xs font-normal leading-none mb-1.5">{{ t("booking_call_type") }}</div>
              <CustomDropdown
                v-model="formData.eventCallType"
                :options="callTypeOptions"
              />
            </div>
          </div>
          <div class="flex w-full gap-3">
            <div class="flex-1 inline-flex flex-col justify-start items-start gap-1.5">
              <div class="self-stretch flex flex-col justify-start items-start gap-1.5">
                <CustomDropdown
                  v-model="formData.eventRingtoneUrl"
                  :options="ringtoneOptions"
                  buttonClass="self-stretch bg-white/75 px-4 py-2 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 outline-none w-full"
                />
              </div>
            </div>
            <button type="button" class="flex justify-start items-center gap-1" @click="previewRingtone">
              <img src="https://i.ibb.co/9kQ5CDty/Icon.png" alt="" />
              <div class="justify-start text-gray-700 text-sm font-medium leading-tight">{{ t("booking_preview") }}</div>
            </button>
          </div>
          <div class="self-stretch flex flex-col justify-start items-start gap-1.5">
            <div class=""><span class="text-slate-700 text-xs font-normal leading-none">{{ t("booking_event_image") }} </span><span
                class="text-gray-500 text-xs italic font-normal leading-none">{{ t("common_optional") }}</span></div>
            <div class="w-full">
              <!-- Uploaded image preview with delete button -->
              <div v-if="formData.eventImageUrl" class="relative mb-2">
                <img
                  :src="formData.eventImageUrl"
                  :alt="t('booking_event_image_preview_alt')"
                  class="w-full rounded-xl object-cover max-h-40"
                />
                <button
                  type="button"
                  class="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 hover:bg-red-700 flex items-center justify-center transition-colors"
                  :aria-label="t('booking_remove_image')"
                  @click="formData.eventImageUrl = ''"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
              <ThumbnailUploaderNay
                v-if="!formData.eventImageUrl"
                custom-class="cursor-pointer border-2 border-transparent bg-black/5 rounded-xl p-4 h-[7.875rem] flex flex-col items-center justify-center hover:border-gray-900 hover:bg-black/10"
                input-wrapper-class="border-2 border-dashed border-transparent !gap-1"
                button-wrapper-class="shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] rounded-lg h-10 w-10 relative flex justify-center items-center"
                button-icon-wrapper-class="cursor-pointer shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] bg-green-500 rounded-lg h-10 w-10 flex justify-center items-center hover:bg-black"
                button-parent-wrapper-class="flex flex-col items-center justify-center gap-3"
                :button-text="t('booking_upload_click')"
                button-text-class="font-semibold text-gray-900 cursor-pointer"
                :drop-text="t('booking_upload_drag_drop')"
                drop-text-class="text-sm font-normal leading-5 text-gray-500 text-center"
                :custom-allowed-types="t('booking_upload_allowed_types')"
                :custom-max-size="t('booking_upload_max_size')"
                eenable-image-compression="true"
                format-text-class="text-gray-500 text-xs leading-[1.125rem] text-center mb-0"
                @media-uploaded="onEventImageUploaded"
              />
            </div>
          </div>
        </div>
      </div>

      <BookingSectionsWrapper :title="t('booking_session_duration')" leftIcon="https://i.ibb.co/cSjDYSdk/Icon.png">
        <div class='flex flex-col gap-5'>
          <div class="flex items-center gap-2 mt-3 ">
            <BaseInput type="number" placeholder="" v-model="formData.duration"
              inputClass="px-3.5 text-gray-900 placeholder:text-gray-900 w-full text-base font-normal outline-none py-2.5 bg-white/30 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300" />
            <div class=" text-black text-base font-medium leading-normal">{{ t("booking_minutes") }}</div>
          </div>
          <div class="self-stretch flex flex-col justify-center items-start gap-2">
            <CheckboxGroup v-model="formData.allowLongerSessions" :label="t('booking_allow_longer_sessions')"
              checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
              labelClass="text-gray-700 text-[16px] mt-[1px] leading-normal" wrapperClass="flex items-center gap-2" />
            <div :class="['ml-6 transition-opacity duration-200',
                        !formData.allowLongerSessions ? 'opacity-50' : 'opacity-100']">
              <div class="w-full text-gray-500 text-sm font-medium leading-tight">{{ t("booking_maximum_session_allowed") }}</div>
              <div class="flex items-center gap-1.5 ">
                <div class="">
                  <BaseInput type="number" placeholder="" v-model="formData.maxSessionDuration"
                    :disabled="!formData.allowLongerSessions"
                    inputClass="px-3.5 w-44 text-gray-900 placeholder:text-gray-900 text-base font-normal outline-none py-2.5 bg-white/30 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 disabled:cursor-not-allowed" />
                </div>
                <div class="flex flex-col">
                  <div class="justify-center text-black text-base font-medium leading-normal">{{ t("booking_sessions") }}</div>
                  <div v-if="formData.duration" class="justify-center text-black text-xs font-medium leading-none">({{ t("booking_minutes_count", { count: formData.duration }) }})</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BookingSectionsWrapper>

      <BookingSectionsWrapper :title="t('booking_pricing_settings')" leftIcon="https://i.ibb.co/F47R5CqG/Icon-1.png"
        leftIconClass="mt-[4px]">
        <div class="flex-1 inline-flex flex-col justify-start items-start gap-5 mt-4">
          <div class="flex flex-col justify-start items-start gap-1.5">
            <div class="justify-start text-gray-500 text-sm font-medium font-['Poppins'] leading-tight">
              {{ t("booking_base_price") }}
            </div>
            <div class="flex items-center gap-2">
              <BaseInput type="number" placeholder="" v-model="formData.basePrice"
                inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300" />
              <div class="flex gap-2 items-center">
                <span class="text-black text-base font-medium font-['Poppins'] leading-normal">{{ t("common_tokens") }} </span><span
                  class="text-black text-sm font-normal font-['Poppins'] leading-tight">{{ t("booking_per_session") }}</span>
              </div>
            </div>
          </div>

          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <CheckboxGroup v-model="formData.enableLongerDiscount" :label="t('booking_enable_longer_session_discount')"
              checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
              labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal"
              wrapperClass="flex items-center gap-2 mb-3" />

            <div class="self-stretch inline-flex justify-start items-start gap-2">
              <div class="w-6 h-6" />
              <div class="inline-flex flex-col justify-start items-start gap-2">
                <div :class="['inline-flex justify-end items-center gap-2',!formData.enableLongerDiscount? 'opacity-50':'opacity-100']">
                  <BaseInput type="number" placeholder="" v-model="formData.sessionMinimum"
                    :disabled="!formData.enableLongerDiscount"
                    inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:cursor-not-allowed" />
                  <div class="h-10 inline-flex flex-col justify-between items-start">
                    <div class="justify-center text-black text-base font-medium font-['Poppins'] leading-normal">
                      {{ t("booking_sessions_minimum") }}
                    </div>
                    <div v-if="formData.sessionMinimum && formData.duration" class="justify-center text-black text-xs font-medium font-['Poppins'] leading-none">
                      ({{ t("booking_session_minimum_summary", { count: formData.sessionMinimum, duration: formData.duration, minutes: formData.sessionMinimum * formData.duration }) }})
                    </div>
                  </div>
                </div>
                <div :class="['inline-flex justify-end items-center gap-2',!formData.enableLongerDiscount? 'opacity-50':'opacity-100']">
                  <BaseInput type="number" placeholder="" v-model="formData.discountPercentage"
                    :disabled="!formData.enableLongerDiscount"
                    inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:cursor-not-allowed" />
                  <div class="h-10 inline-flex flex-col justify-between items-start">
                    <div class="justify-center text-black text-base font-medium font-['Poppins'] leading-normal">
                      {{ t("booking_percent_off_base_price") }}
                    </div>
                    <div v-if="formData.basePrice && formData.discountPercentage" class="justify-center text-black text-xs font-medium font-['Poppins'] leading-none">
                      ({{ t("booking_tokens_per_session", { tokens: Math.round( formData.basePrice * ( (100 - formData.discountPercentage) / 100 ) ) }) }})
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          

          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <CheckboxGroup v-model="formData.enableFirstTimeDiscount" :label="t('booking_enable_first_time_discount_short')"
              checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
              labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal"
              wrapperClass="flex items-center gap-2 mb-3" />

            <div class="self-stretch inline-flex justify-start items-start gap-2">
              <div class="w-6 h-10" />
              <div class="inline-flex flex-col justify-start items-start gap-2">
                <div :class="['relative inline-flex justify-end items-center gap-2',!formData.enableFirstTimeDiscount? 'opacity-50':'opacity-100']">
                  <span class="absolute left-28 top-2 justify-center text-black text-base font-medium font-['Poppins'] leading-normal">%</span>
                  <BaseInput type="number" placeholder="" v-model="formData.firstTimeDiscount"
                    :disabled="!formData.enableFirstTimeDiscount"
                    inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:cursor-not-allowed" />
                  <div class="h-10 inline-flex flex-col justify-between items-start">
                    <div class="justify-center text-black text-base font-medium font-['Poppins'] leading-normal">
                      {{ t("booking_off_entire_session") }}
                    </div>
                    <div v-if="formData.basePrice && formData.firstTimeDiscount" class="justify-center text-black text-xs font-medium font-['Poppins'] leading-none">
                      ({{ t("booking_tokens_per_session", { tokens: Math.round( formData.basePrice * ( (100 - formData.firstTimeDiscount) / 100 ) ) }) }})
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <div class="flex gap-2 items-center">
              <CheckboxGroup v-model="formData.enableBookingFee" :label="t('booking_enable_booking_fee')"
                checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal"
                wrapperClass="flex items-center gap-2" />
              <TooltipIcon :text="t('booking_booking_fee_tooltip')" />
            </div>

            <div class="inline-flex justify-start items-start gap-2">
              <div class="w-6 h-10" />
              <div class="inline-flex flex-col justify-center items-start gap-2">
                <div :class="['inline-flex justify-start items-center gap-2',!formData.enableBookingFee? 'opacity-50':'opacity-100']">
                  <BaseInput type="number" placeholder="" v-model="formData.bookingFee"
                    :disabled="!formData.enableBookingFee"
                    inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:cursor-not-allowed" />
                  <div class="w-14 justify-start text-black text-base font-medium font-['Poppins'] leading-normal">
                    {{ t("common_tokens") }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <div class="self-stretch flex flex-col justify-center items-start gap-2">
              <div class="flex gap-2 items-center">
                <CheckboxGroup v-model="formData.allowInstantBooking" :label="t('booking_allow_instant_booking')"
                  checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                  labelClass="text-slate-700 mt-[1px] text-[16px] leading-normal"
                  wrapperClass="flex items-center gap-2 mb-3" midImg="https://i.ibb.co/G418dSPz/Icon.png" />

                 <TooltipIcon :text="t('booking_allow_instant_booking_tooltip')" />
              </div>

              <div class="self-stretch inline-flex justify-start items-start gap-2">
                <div class="w-6 h-6" />
                <div :class="['flex-1 inline-flex flex-col justify-start items-start gap-2',!formData.allowInstantBooking ? 'opacity-50 pointer-events-none':'opacity-100']">
                  <div class="self-stretch inline-flex justify-end items-center gap-2">
                    <div
                      class="flex-1 justify-center text-slate-700 text-base font-normal font-['Poppins'] leading-normal">
                      {{ t("booking_approve_sessions_instantly") }}
                    </div>
                  </div>

                  <CheckboxGroup v-model="formData.disableChatBeforeCall" :label="t('booking_disable_chat_before_call')"
                    checkboxClass="m-0 border border-checkboxBorder [appearance:none] w-[0.75rem] h-[0.75rem] rounded bg-transparent relative cursor-pointer checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.2rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45 "
                    labelClass="text-slate-700 text-[16px] leading-normal"
                    wrapperClass="flex items-center gap-2 mb-2 mt-2" />
                </div>
              </div>
            </div>
          </div>
          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <div class="self-stretch flex flex-col justify-center items-start gap-1">
              <div class="flex gap-2 items-center">
                <CheckboxGroup v-model="formData.enableRescheduleFee" :label="t('booking_enable_reschedule_fee')"
                  checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                  labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal"
                  wrapperClass="flex items-center gap-2" />

                <TooltipIcon :text="t('booking_reschedule_fee_tooltip')" />
              </div>

              <div class="self-stretch inline-flex justify-start items-start gap-2">
                <div class="w-6 h-10" />
                <div :class="['inline-flex flex-col justify-start items-start',!formData.enableRescheduleFee ? 'opacity-50':'opacity-100']">
                  <div class="inline-flex justify-end items-center gap-2">
                    <BaseInput type="number" placeholder="" v-model="formData.rescheduleFee"
                      :disabled="!formData.enableRescheduleFee"
                      inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:cursor-not-allowed" />

                    <div class="justify-center text-slate-700 text-base font-normal font-['Poppins'] leading-normal">
                      {{ t("common_tokens") }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <div class="self-stretch flex flex-col justify-center items-start gap-1">
              <div class="flex gap-2 items-center">
                <CheckboxGroup v-model="formData.enableCancellationFee" :label="t('booking_enable_cancellation_fee')"
                  checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                  labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal"
                  wrapperClass="flex items-center gap-2" />

                <TooltipIcon :text="t('booking_cancellation_fee_tooltip')" />
              </div>
              <div :class="['self-stretch inline-flex justify-start items-start gap-2',!formData.enableCancellationFee ? 'opacity-50':'opacity-100']">
                <div class="w-6 h-10" />
                <div class="inline-flex flex-col justify-start items-start">
                  <div class="inline-flex justify-end items-center gap-2">
                    <BaseInput type="number" placeholder="15" v-model="formData.cancellationFee"
                      :disabled="!formData.enableCancellationFee"
                      inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed" />
                    <div class="justify-center text-slate-700 text-base font-normal font-['Poppins'] leading-normal">
                      {{ t("common_tokens") }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div :class="['ml-7 _flex hidden flex-col justify-start items-start gap-2',!formData.enableCancellationFee ? 'opacity-50 pointer-events-none':'opacity-100']">
              <CheckboxGroup v-model="formData.allowAdvanceCancellation"
                :label="t('booking_allow_advance_cancellation')"
                checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal"
                wrapperClass="flex items-center gap-2" />
              <div :class="['flex items-center gap-2', !formData.allowAdvanceCancellation ? 'opacity-50':'opacity-100']">
                <div class="flex items-center">
                  <BaseInput type="number" placeholder="15" v-model="formData.advanceVoid"
                    :disabled="!formData.allowAdvanceCancellation"
                    inputClass="bg-white/50 w-24 px-3 py-2 rounded-tl-sm outline-none border-b border-gray-300 disabled:cursor-not-allowed border-r" />
                </div>
                  <CustomDropdown
                    v-model="formData.advanceCancelWindowUnit"
                    :options="timeUnitOptions"
                    :buttonClass="`bg-white/50 w-28 px-3 py-2 rounded-tr-sm outline-none border-b border-gray-300 flex items-center justify-between cursor-pointer select-none ${!formData.allowAdvanceCancellation ? 'pointer-events-none disabled:cursor-not-allowed' : ''}`"
                  />
                <div class="justify-center text-slate-700 text-base font-normal leading-normal whitespace-nowrap">
                  {{ t("booking_in_advance") }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </BookingSectionsWrapper>

      <BookingSectionsWrapper :title="t('booking_off_hour_surcharge')" leftIcon="https://i.ibb.co/k6kzjyCp/Icon-2.png"
        tooltipText="Approval will be required for bookings made during this period.">
        <div :class="['self-stretch inline-flex justify-start items-center gap-2 mt-5', !formData.addOffHourSurcharge ? 'opacity-50':'opacity-100']">
          <CheckboxGroup v-model="formData.addOffHourSurcharge" :label="t('common_add')"
            checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
            labelClass="text-gray-700 text-[16px] mt-[1px] leading-normal" wrapperClass="flex items-center gap-2" />
          <div class="flex-1 inline-flex flex-col justify-start items-start">
            <div class="inline-flex justify-end items-center gap-2">
              <BaseInput type="number" placeholder="" v-model="formData.offHourSurcharge"
                :disabled="!formData.addOffHourSurcharge"
                inputClass="px-3.5 w-44 text-gray-900 placeholder:text-gray-900 text-base font-normal outline-none py-2.5 bg-white/30 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed" />
              <div class="h-10 inline-flex flex-col justify-between items-start">
                <div class="justify-center text-black text-base font-medium leading-normal">{{ t("booking_percent_from_base_price") }}</div>
                <div class="justify-center text-black text-xs font-medium leading-none">({{ t("booking_tokens_per_session", { tokens: "1,600" }) }})</div>
              </div>
            </div>
          </div>
        </div>
      </BookingSectionsWrapper>

      <BookingSectionsWrapper :title="t('booking_calendar_availability')" leftIcon="https://i.ibb.co/Ldw310vp/Icon.png">
        <div class="w-full flex flex-col gap-5 mt-5">
          <div class="flex flex-col gap-3 w-full">
            <div class="self-stretch justify-start text-gray-900 text-xs font-normal font-['Poppins'] leading-none">
              GMT +8 Hong Kong Standard time
            </div>

            <CustomDropdown
              v-model="formData.repeatRule"
              :options="repeatRuleOptions"
            />
            <div v-if="formData.repeatRule !== 'doesNotRepeat'" class="self-stretch inline-flex justify-start items-end">
              <div class="flex-1 inline-flex flex-col justify-start items-start gap-1.5">
                <div class="self-stretch flex flex-col justify-start items-start gap-1.5">
                  <div class="justify-start">
                    <span class="text-gray-500 text-sm font-medium font-['Poppins'] leading-tight">
                      {{ formData.repeatRule === 'monthly' ? t("booking_start_date") : t("booking_duration") }}
                    </span>
                    <span v-if="formData.repeatRule !== 'monthly'"
                      class="text-gray-500 text-xs italic font-normal font-['Poppins'] leading-none"> {{ t("common_optional") }}</span>
                  </div>
                  <input
                    type="date"
                    v-model="formData.dateFrom"
                    :min="todayIsoDate"
                    :max="formData.dateTo || undefined"
                    class="self-stretch px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 outline-none text-gray-900 text-base font-normal font-['Poppins'] leading-normal"
                  />
                </div>
              </div>

              <div class="flex-1 inline-flex flex-col justify-start items-start gap-1.5">
                <div class="self-stretch flex flex-col justify-start items-start gap-1.5">
                  <div class="justify-start text-gray-500 text-sm font-medium font-['Poppins'] leading-tight">
                    {{ t("booking_end_date") }} <span class="text-gray-500 text-xs italic font-normal font-['Poppins'] leading-none">{{ t("common_optional") }}</span>
                  </div>
                  <input
                    type="date"
                    v-model="formData.dateTo"
                    :min="getDateToMin()"
                    class="self-stretch px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 outline-none text-gray-900 text-base font-normal font-['Poppins'] leading-normal"
                  />
                </div>
              </div>
            </div>
            <div v-if="dateRangeMessage" class="text-xs text-amber-600 mt-1">
              {{ dateRangeMessage }}
            </div>
          </div>


          <div v-if="formData.repeatRule === 'weekly'" class="flex flex-col gap-4 w-full">

            <div v-for="(day, index) in weekDays" :key="index"
              class="self-stretch inline-flex justify-start items-start gap-1"
              :class="{
                'items-center min-h-10 gap-3': day.unavailable,
                'opacity-60': isWeeklyDayLocked(day.key || day.name),
              }">

              <div class="justify-start text-gray-500 text-base font-normal font-['Poppins'] leading-normal"
                :class="day.unavailable ? 'w-12' : 'w-10 h-10 flex items-center justify-center'">
                {{ getWeekdayLabel(day) }}
              </div>

              <template v-if="day.unavailable">
                <div class="flex-1 justify-start text-gray-500 text-base font-normal leading-normal">
                  {{ t("booking_not_available") }}
                </div>
                <button type="button" @click="addDayAvailability(index)"
                  class="w-6 h-6 rounded-full text-gray-600 flex items-center justify-center hover:bg-gray-100"
                  :disabled="isWeeklyDayLocked(day.key || day.name)"
                  :class="{ 'opacity-40 cursor-not-allowed hover:bg-transparent': isWeeklyDayLocked(day.key || day.name) }"
                  :title="t('booking_add_availability')">
                  <img :src="plusIcon" alt="" />
                </button>
              </template>

              <template v-else>
                <div class="flex-1 inline-flex flex-col justify-center items-start gap-1">

                  <div v-for="(slot, sIdx) in day.slots" :key="sIdx"
                    class="self-stretch inline-flex justify-start items-center gap-1">

                    <div class="flex-1 inline-flex flex-col justify-start items-start gap-1.5">
                      <div class="self-stretch flex flex-col justify-start items-start gap-1.5">
                        <CustomDropdown
                          v-model="slot.startTime"
                          :options="timeOptions"
                          :disabled="isWeeklyDayLocked(day.key || day.name)"
                          @update:modelValue="onSlotChanged"
                          buttonClass="self-stretch px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 outline-none text-gray-900 text-base font-normal font-['Poppins'] leading-normal w-full"
                          dropdownClass="max-h-60 overflow-y-auto w-full z-50 bg-white"
                        />
                      </div>
                    </div>

                    <div class="justify-start text-gray-500 text-base font-medium font-['Poppins'] leading-normal">
                      -
                    </div>

                    <div class="flex-1 inline-flex flex-col justify-start items-start gap-1.5">
                      <CustomDropdown
                        v-model="slot.endTime"
                        :options="timeOptions"
                        :disabled="isWeeklyDayLocked(day.key || day.name)"
                        @update:modelValue="onSlotChanged"
                        buttonClass="self-stretch px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 outline-none text-gray-900 text-base font-normal font-['Poppins'] leading-normal w-full"
                        dropdownClass="max-h-60 overflow-y-auto w-full z-50 bg-white"
                      />
                    </div>

                    <div class="pl-1 flex justify-start items-center gap-2">
                      <TooltipIcon :text="t('booking_remove_availability')" wrapperClass="flex items-center justify-center" tooltipClass="top-4">
                        <button type="button" @click="removeWeeklySlot(index, sIdx)"
                          class="w-6 h-6 rounded-full text-gray-600 flex items-center justify-center hover:bg-gray-100"
                          :disabled="isWeeklyDayLocked(day.key || day.name) || getTotalWeeklySlotCount() <= 1"
                          :class="{ 'opacity-40 cursor-not-allowed hover:bg-transparent': isWeeklyDayLocked(day.key || day.name) || getTotalWeeklySlotCount() <= 1 }">
                          <img :src="minusIcon" alt="" />
                        </button>
                      </TooltipIcon>
                      <TooltipIcon :text="t('booking_add_period_day')" wrapperClass="flex items-center justify-center" tooltipClass="top-4 translate-x-[-80%]">
                        <button type="button" @click="addWeeklySlot(index)"
                          class="w-6 h-6 rounded-full text-gray-600 flex items-center justify-center hover:bg-gray-100"
                          :disabled="isWeeklyDayLocked(day.key || day.name)"
                          :class="{ 'opacity-40 cursor-not-allowed hover:bg-transparent': isWeeklyDayLocked(day.key || day.name) }">
                          <img :src="plusIcon" alt="" />
                        </button>
                      </TooltipIcon>
                      <TooltipIcon v-if="formData.repeatRule === 'weekly'" :text="t('booking_mark_off_hours')" wrapperClass="flex items-center justify-center" tooltipClass="top-4 translate-x-[-80%]">
                        <button type="button" @click="toggleSlotOffHours(index, sIdx)"
                          class="w-6 h-6 rounded-full flex items-center justify-center"
                          :disabled="isWeeklyDayLocked(day.key || day.name)"
                          :class="[
                            slot.offHours ? '' : '',
                            isWeeklyDayLocked(day.key || day.name) ? 'opacity-40 cursor-not-allowed hover:bg-transparent' : '',
                          ]">
                          <img :src="slot.offHours ? cloudMoonPinkIcon : cloudMoonIcon" alt="" />
                        </button>
                      </TooltipIcon>
                    </div>

                  </div>
                </div>
              </template>

            </div>
          </div>

          <div v-if="formData.repeatRule === 'monthly'" class="flex flex-col gap-4 w-full">
            <div
              v-for="(slot, slotIndex) in monthlySlots"
              :key="`monthly-slot-${slotIndex}`"
              class="self-stretch inline-flex justify-start items-center gap-1"
            >
              <div class="flex-1 inline-flex flex-col justify-start items-start gap-1.5">
                <div class="self-stretch flex flex-col justify-start items-start gap-1.5">
                  <CustomDropdown
                    v-model="slot.startTime"
                    :options="timeOptions"
                    @update:modelValue="onSlotChanged"
                    buttonClass="self-stretch px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 outline-none text-gray-900 text-base font-normal font-['Poppins'] leading-normal w-full"
                    dropdownClass="max-h-60 overflow-y-auto w-full z-50 bg-white"
                  />
                </div>
              </div>

              <div class="justify-start text-gray-500 text-base font-medium font-['Poppins'] leading-normal">
                -
              </div>

              <div class="flex-1 inline-flex flex-col justify-start items-start gap-1.5">
                <CustomDropdown
                  v-model="slot.endTime"
                  :options="timeOptions"
                  @update:modelValue="onSlotChanged"
                  buttonClass="self-stretch px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 outline-none text-gray-900 text-base font-normal font-['Poppins'] leading-normal w-full"
                  dropdownClass="max-h-60 overflow-y-auto w-full z-50 bg-white"
                />
              </div>

              <div class="pl-1 flex justify-start items-center gap-2">
              <TooltipIcon :text="t('booking_remove_availability')" wrapperClass="flex items-center justify-center" tooltipClass="top-4"> 
                <button
                  type="button"
                  @click="removeMonthlySlot(slotIndex)"
                  class="w-6 h-6 rounded-full text-gray-600 flex items-center justify-center hover:bg-gray-100"
                  :disabled="getTotalMonthlySlotCount() <= 1"
                  :class="{ 'opacity-40 cursor-not-allowed hover:bg-transparent': getTotalMonthlySlotCount() <= 1 }"
                  :title="t('booking_remove_availability')"
                >
                  <img :src="minusIcon" alt="" />
                </button>
                </TooltipIcon>
                <TooltipIcon :text="t('booking_add_monthly_period')" wrapperClass="flex items-center justify-center" tooltipClass="top-4 translate-x-[-80%]">
                <button
                  type="button"
                  @click="addMonthlySlot()"
                  class="w-6 h-6 rounded-full text-gray-600 flex items-center justify-center hover:bg-gray-100"
                  :title="t('booking_add_monthly_period')"
                >
                  <img :src="plusIcon" alt="" />
                </button>
                </TooltipIcon>
                <TooltipIcon :text="t('booking_mark_off_hours')" wrapperClass="flex items-center justify-center" tooltipClass="top-4 translate-x-[-80%]">
                <button
                  type="button"
                  @click="toggleMonthlySlotOffHours(slotIndex)"
                  class="w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-100"
                  :class="slot.offHours ? '' : ''"
                  :title="t('booking_mark_off_hours')"
                >
                  <img :src="slot.offHours ? cloudMoonPinkIcon : cloudMoonIcon" alt="" />
                </button>
                </TooltipIcon>
              </div>
            </div>
          </div>

          <div v-if="formData.repeatRule === 'doesNotRepeat'" class="flex flex-col gap-4 w-full">
            <div v-for="(entry, entryIndex) in oneTimeDates" :key="entry.id"
              class="p-3">
              <div class="flex items-center gap-2 mb-3">
                <div class="relative w-full">
                  <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <img :src="calendarIcon" alt="" class="w-5 h-5" />
                  </div>
                  <input
                    type="date"
                    v-model="entry.date"
                    @change="onSlotChanged"
                    :min="getOneTimeDateMin()"
                    :max="formData.dateTo || undefined"
                    class="bg-white/75 w-full pl-10 pr-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 relative [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-datetime-edit]:text-gray-900"
                  />
                </div>
                <button v-if="oneTimeDates.length > 1" type="button" @click="removeOneTimeDate(entryIndex)"
                  class="w-7 h-7 rounded text-red-500 hover:bg-red-50 flex-shrink-0 flex items-center justify-center">
                  <img :src="trashIcon" alt="" class="w-5 h-5" />
                </button>
              </div>

              <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-gray-500">{{ t("booking_available_time_slot") }}</span>
                <div v-if="entry.slots.length === 0" class="flex items-center">
                  <button
                    type="button"
                    @click="addOneTimeSlot(entryIndex)"
                    class="px-2 py-1 text-xs bg-gray-900 text-[#07F468] hover:bg-black"
                  >
                    {{ t("booking_add_time_slot") }}
                  </button>
                </div>

                <div v-for="(slot, slotIndex) in entry.slots" :key="`${entry.id}-${slotIndex}`"
                  class="flex items-center gap-1">
                  <CustomDropdown
                    v-model="slot.startTime"
                    :options="timeOptions"
                    @update:modelValue="onSlotChanged"
                    buttonClass="flex-1 px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm border-b border-gray-300 outline-none w-full h-full"
                    dropdownClass="max-h-60 overflow-y-auto w-full z-50 bg-white min-w-[max-content]"
                  />
                  <div class="text-gray-500">-</div>
                  <CustomDropdown
                    v-model="slot.endTime"
                    :options="timeOptions"
                    @update:modelValue="onSlotChanged"
                    buttonClass="flex-1 px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm border-b border-gray-300 outline-none w-full h-full"
                    dropdownClass="max-h-60 overflow-y-auto w-full z-50 bg-white min-w-[max-content]"
                  />
                  <div class="flex items-center gap-2">
                  <button type="button" @click="removeOneTimeSlot(entryIndex, slotIndex)"
                    :disabled="getTotalOneTimeSlotCount() <= 1"
                    :class="{ 'opacity-40 cursor-not-allowed hover:bg-transparent': getTotalOneTimeSlotCount() <= 1 }"
                    class="w-6 h-6 rounded-full text-gray-600 hover:bg-gray-100">
                    <img :src="minusIcon" alt="" />
                  </button>
                  <button type="button" @click="addOneTimeSlot(entryIndex)"
                    class="w-6 h-6 rounded-full text-gray-600 hover:bg-gray-100">
                    <img :src="plusIcon" alt="" />
                  </button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <button type="button" @click="addOneTimeDate"
                class="bg-gray-900 text-[#07F468] text-xs font-semibold px-2 py-1 hover:bg-black">
                {{ t("booking_add_a_date") }}
              </button>
            </div>
          </div>
        </div>
      </BookingSectionsWrapper>

      <div class="w-full bg-[#D0D5DD] h-[1px]"></div>

      <BookingSectionsWrapper :title="t('booking_call_settings')" leftIcon="https://i.ibb.co/xq0ZdVmP/Icon.png"
        accordionIcon="https://i.ibb.co/MD46QRZS/Frame-1410099649.png" :is-open="sectionsState.callSettings"
        @toggle="toggleSection('callSettings')">
        <div v-show="sectionsState.callSettings" class="flex flex-col justify-start items-start gap-5 mt-5">
          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <div class="self-stretch flex flex-col justify-center items-start gap-1">
              <div class="self-stretch inline-flex justify-start items-center gap-1">
                <div class="justify-start text-slate-700 text-base font-normal leading-normal">{{ t("booking_offer_discount_if_call_starts_late") }}</div>
                  <TooltipIcon :text="t('booking_join_buffer_tooltip')" />
              </div>
            </div>
            <div class="self-stretch flex flex-col justify-start items-start gap-1.5">
              <div class="self-stretch flex flex-col justify-start items-start gap-1.5">
                <CustomDropdown
                  v-model="formData.lateStartAction"
                  :options="lateStartActionOptions"
                  buttonClass="self-stretch px-4 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 outline-none w-full text-left"
                />
                <div v-if="formData.lateStartAction === 'nextDiscount'" class="pt-1">
                  <BaseInput type="number" :placeholder="t('booking_late_start_discount_placeholder')"
                    v-model="formData.lateStartDiscountPercent"
                    inputClass="bg-white/50 w-full px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300" />
                </div>
              </div>
            </div>
          </div>
          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <div class="self-stretch flex flex-col justify-center items-start gap-1">
              <div class="self-stretch justify-start text-slate-700 text-base font-normal leading-normal">{{ t("booking_call_functions") }}
              </div>
              <CheckboxGroup v-model="formData.disableChatDuringCall" :label="t('booking_disable_chat_during_call')"
                checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal"
                wrapperClass="flex items-center gap-2 mb-3 mt-2" />
            </div>
          </div>
          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <div class="self-stretch flex flex-col justify-center items-start gap-1">
              <div class="self-stretch inline-flex justify-start items-center gap-1 relative">
                <div class="justify-start text-slate-700 text-base font-normal leading-normal relative">
                  {{ t("booking_fan_can_request_extend_session") }}
                  <TooltipIcon :text="t('booking_session_extension_tooltip')" 
                  tooltipClass="translate-x-[-90%] sm:translate-x-[-70%]" 
                  class="relative group inline-block mt-[2px] ml-1   z-[9]  top-1" />
                </div>
              </div>
              <div class="inline-flex justify-start items-center gap-2">
                <CheckboxGroup v-model="formData.requestExtendSession"
                  checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                  labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal"
                  wrapperClass="flex items-center gap-2" />
                <div :class="['flex justify-start items-end gap-2',!formData.requestExtendSession ? 'opacity-50':'opacity-100']">
                  <BaseInput type="number" placeholder="" v-model="formData.extendSessionMax"
                    :disabled="!formData.requestExtendSession"
                    inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:cursor-not-allowed" />
                  <div class="h-10 inline-flex flex-col justify-between items-start">
                    <div class="justify-center text-black text-base font-medium leading-normal">{{ t("booking_sessions_maximum") }}</div>
                    <div v-if="formData.duration && formData.extendSessionMax" class="justify-center text-black text-xs font-medium leading-none">({{ t("booking_minutes_count", { count: formData.duration * formData.extendSessionMax }) }})</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BookingSectionsWrapper>

      <div class="w-full bg-[#D0D5DD] h-[1px]"></div>

      <BookingSectionsWrapper :title="t('booking_booking_settings')" leftIcon="https://i.ibb.co/nNmmvwnf/Icon-1.png"
        accordionIcon="https://i.ibb.co/MD46QRZS/Frame-1410099649.png" :is-open="sectionsState.bookingSettings"
        @toggle="toggleSection('bookingSettings')">
        <div v-show="sectionsState.bookingSettings" class="flex flex-col justify-start items-start gap-5 mt-5">
          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <div class="self-stretch flex flex-col justify-center items-start gap-1">
              <div class="self-stretch inline-flex justify-start items-center gap-1">
                <div class="justify-start text-gray-700 text-base font-normal leading-normal">{{ t("booking_call_reminder") }}</div>
                <TooltipIcon :text="t('booking_reminders_tooltip')" />
              </div>
              <CheckboxGroup v-model="formData.setReminders" :label="t('booking_enable_reminder')"
                checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                labelClass="text-gray-700 text-[16px] mt-[1px] leading-normal"
                wrapperClass="flex items-center gap-2 mb-2 mt-2" />
              <div :class="['self-stretch flex flex-col justify-start items-start', !formData.setReminders ? 'opacity-50':'opacity-100']">
                <div class=" inline-flex justify-end items-center gap-2">
                  <div class="justify-center text-slate-700 text-base font-normal leading-normal">{{ t("booking_remind_me") }}</div>
                  <BaseInput type="number" placeholder="" v-model="formData.remindMeTime"
                    :disabled="!formData.setReminders"
                    inputClass="bg-white/50 w-40 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:cursor-not-allowed" />
                  <div class="flex-1 justify-center text-slate-700 text-base font-normal leading-normal truncate">{{ t("booking_minutes_before_a") }}</div>
                </div>
                <div class="inline-flex justify-end items-center gap-2">
                  <div class="justify-center text-slate-700 text-base font-normal leading-normal">{{ t("booking_scheduled_call") }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <!-- <div class="flex gap-2">
              <CheckboxGroup v-model="formData.setBufferTime" :label="t('booking_set_buffer_time')"
                checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                labelClass="text-gray-700 text-[16px] mt-[1px] leading-normal"
                wrapperClass="flex items-center gap-2" />
              <TooltipIcon :text="t('booking_buffer_time_tooltip')" tooltipClass="translate-x-[-90%] sm:translate-x-[-90%]" class="ml-1 !absolute z-[9] md:top-1/2 md:-translate-y-1/2 right-auto md:-right-6" />
            </div> -->
            <div class="flex gap-2">
              <CheckboxGroup
                v-model="formData.setBufferTime"
                checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal flex items-center !inline-block relative"
                wrapperClass="flex items-center gap-2"
              >
                <template #label>
                  <span>{{ t("booking_set_buffer_time") }}</span>

                  <TooltipIcon
                    :text="t('booking_buffer_time_tooltip')"
                    tooltipClass="translate-x-[-80%] sm:translate-x-[-90%] max-w-[200px]" 
                    class="ml-1 !mt-0 !absolute z-[9] md:top-1/2 md:-translate-y-1/2 right-auto md:-right-6"
                  />
                </template>
              </CheckboxGroup>
            </div>
            <div class="inline-flex justify-start items-center gap-2">
              <div class="w-6 h-6" />
              <div :class="['flex justify-start items-end gap-2',!formData.setBufferTime? 'opacity-50 pointer-events-none':'opacity-100']">
                <BaseInput type="number" placeholder="" v-model="formData.bufferTime"
                  :disabled="!formData.setBufferTime"
                  inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:cursor-not-allowed" />
                <div class="w-44 inline-flex flex-col justify-start items-start gap-1.5">
                  <div class="self-stretch flex flex-col justify-start items-start gap-1.5">
                    <CustomDropdown :options="bufferUnitOptions" v-model="formData.bufferUnit" :disabled="!formData.setBufferTime" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <!-- <div class="flex gap-2 items-center">
              <CheckboxGroup v-model="formData.setMaxBookings" :label="t('booking_set_max_bookings_day')"
                checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                labelClass="text-gray-700 text-[16px] mt-[1px] leading-normal"
                wrapperClass="flex items-center gap-2" />
              <TooltipIcon :text="t('booking_max_bookings_tooltip')"/>
            </div> -->

            <div class="flex gap-2">
              <CheckboxGroup
                v-model="formData.setMaxBookings"
                checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal flex items-center !inline-block relative"
                wrapperClass="flex items-center gap-2"
              >
                <template #label>
                  <span>{{ t("booking_set_max_bookings_day") }}</span>

                  <TooltipIcon
                    :text="t('booking_max_bookings_tooltip')"
                    tooltipClass="translate-x-[-80%] sm:translate-x-[-90%]" 
                    class="ml-1 !mt-0 !absolute z-[9] md:top-1/2 md:-translate-y-1/2 right-auto md:-right-6"
                  />
                </template>
              </CheckboxGroup>
            </div>
            <div class="inline-flex justify-start items-center gap-2">
              <div class="w-6 h-6" />
              <div class="flex justify-start items-end gap-2">
                <BaseInput type="number" placeholder="15" v-model="formData.maxBookingsPerDay"
                  :disabled="!formData.setMaxBookings"
                  inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed" />
              </div>
            </div>
          </div>
          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <div class="self-stretch flex flex-col justify-center items-start gap-1">
              <!-- <div class="flex gap-2">
                <CheckboxGroup v-model="formData.allowWaitlist"
                  :label="t('booking_join_waitlist_if_full')"
                  checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                  labelClass="text-gray-700 text-[16px] mt-[1px] leading-normal"
                  wrapperClass="flex items-center gap-2" />
                <TooltipIcon :text="t('booking_waitlist_tooltip')" tooltipClass="translate-x-[-90%]"/>
              </div> -->
              <div class="flex gap-2">
                <CheckboxGroup
                  v-model="formData.allowWaitlist"
                  checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                  labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal flex items-center !inline-block relative"
                  wrapperClass="flex items-center gap-2"
                >
                  <template #label>
                    <span>{{ t("booking_join_waitlist_if_full") }}</span>

                    <TooltipIcon
                      :text="t('booking_waitlist_tooltip')"
                      tooltipClass="translate-x-[-80%] sm:translate-x-[-90%]" 
                      class="ml-1 !mt-0 !absolute z-[9] md:top-1/2 md:-translate-y-1/2 right-auto md:-right-6"
                    />
                  </template>
                </CheckboxGroup>
              </div>
              <div class="self-stretch inline-flex justify-start items-start gap-2">
                <div class="w-6 h-10" />
                <div :class="!formData.allowWaitlist ? 'opacity-50 pointer-events-none' : ''" class="inline-flex flex-col justify-start items-start">
                  <div class="inline-flex justify-end items-center gap-2">
                    <BaseInput type="number" placeholder="15" v-model="formData.waitlistSpots"
                      :disabled="!formData.allowWaitlist"
                      inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:cursor-not-allowed" />
                    <div class="justify-center text-slate-700 text-base font-normal leading-normal">{{ t("booking_waitlist_spots") }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BookingSectionsWrapper>

      <div class="w-full bg-[#D0D5DD] h-[1px] mb-[50px] mt-[10px]"></div>


    </form>
    <div :class="footerClass">
      <ButtonComponent @click="goToNext" :text="t('common_next')" variant="polygonLeft"
        :rightIcon="'https://i.ibb.co/hx8ztZFf/svgviewer-png-output-8.webp'" :rightIconClass="`
          w-6 h-6 transition duration-200
          filter brightness-0 invert-0   /* Default: black */
          group-hover:[filter:brightness(0)_saturate(100%)_invert(75%)_sepia(23%)_saturate(7280%)_hue-rotate(93deg)_brightness(109%)_contrast(95%)]
        `" btnBg="#07f468" btnHoverBg="black" btnText="black" btnHoverText="#07f468" />
    </div>
  </template>
