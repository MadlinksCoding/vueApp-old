  <script setup>
  import { onMounted, onUnmounted, ref, watch } from "vue";
  import CheckboxGroup from "../checkbox/CheckboxGroup.vue";
  import ButtonComponent from "@/components/dev/button/ButtonComponent.vue";
  import BookingSectionsWrapper from "../BookingForm/HelperComponents/BookingSectionsWrapper.vue";
  import BaseInput from "@/components/dev/input/BaseInput.vue";
  import ThumbnailUploaderNay from "../../global/media/uploader/HelperComponents/ThumbnailUploaderNay.vue";
  import Quill from 'quill';
  import 'quill/dist/quill.snow.css';
  import { showToast } from "@/utils/toastBus.js";

  // Accept Engine
  const props = defineProps(['engine']);

  // Refs
  // Refs
  // Initialize from engine state (deep copy to avoid reactivity issues with v-model on props)
  const formData = ref({
    eventTitle: props.engine.state.eventTitle || "",
    eventDescription: props.engine.state.eventDescription || "",
    eventColorSkin: props.engine.state.eventColorSkin || "#5549FF",
    repeatRule: props.engine.state.repeatRule || "weekly",
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
      const messages = (error?.errors || []).map((e) =>
        typeof e === "string" ? e : (e?.message || "Validation error")
      );
      const fallback = error?.message || "Please fix validation errors before continuing.";
      const body = messages.length ? messages.join(" ") : fallback;
      showToast({
        type: "error",
        title: "Validation Failed",
        message: body,
      });
    }
  };

  const ringtoneOptions = [
    { label: "Ringtone 1", value: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" },
    { label: "Ringtone 2", value: "https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3" },
    { label: "Ringtone 3", value: "https://assets.mixkit.co/active_storage/sfx/2871/2871-preview.mp3" },
  ];

  const colorOptions = [
    { label: "Blue", value: "#5549FF" },
    { label: "Red", value: "#FF3B30" },
    { label: "Green", value: "#22C55E" },
    { label: "Pink", value: "#FF2D92" },
    { label: "Orange", value: "#F97316" },
    { label: "Purple", value: "#8B5CF6" },
    { label: "Teal", value: "#14B8A6" },
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
        title: "Preview Unavailable",
        message: "Could not preview this ringtone on your browser.",
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
    // Quill Setup (Preserved exactly as provided)
    const icons = Quill.import('ui/icons');
    icons['bold'] = '<img src="https://i.ibb.co/HLRRqmHp/bold-icon.webp" alt="bold" style="width:30px;">';
    icons['italic'] = '<img src="https://i.ibb.co/QvdPyg67/italic-icon.webp" alt="italic" style="width:30px;">';
    icons['link'] = '<img src="https://i.ibb.co/gZ7JLJ28/link-icon.webp" alt="link" style="width:30px;">';
    icons['list']['ordered'] = '<img src="https://i.ibb.co/Q7WRxw9Y/list-ol-icon.webp" alt="ol" style="width:30px;">';
    icons['list']['bullet'] = '<img src="https://i.ibb.co/rfH1rbT7/list-ul-icon.webp" alt="ul" style="width:30px;">';

    new Quill(quillEditor.value, {
      modules: { toolbar: [['bold', 'italic', 'link', { 'list': 'ordered' }, { 'list': 'bullet' }]] },
      placeholder: "Event Description...",
      theme: 'snow'
    });

    // Set initial content if exists
    if (formData.value.eventDescription) {
      quillEditor.value.firstChild.innerHTML = formData.value.eventDescription;
    }

    // Listen for text changes
    quillEditor.value.firstChild.addEventListener('input', () => {
      formData.value.eventDescription = quillEditor.value.firstChild.innerHTML;
    });

    const container = quillEditor.value.closest('.tier-description-quill-container');
    const toolbar = container.querySelector('.ql-toolbar.ql-snow');
    if (toolbar) {
      toolbar.style.border = 'none';
      toolbar.classList.add('!px-0', '!pt-0', '!pb-2');
      toolbar.querySelectorAll('button').forEach(b => {
        b.classList.add('!w-auto', '!min-w-[30px]', '!h-auto', '!p-1', 'rounded', 'hover:!bg-[#F9FAFB]', 'dark:hover:!bg-[#323232]', 'flex', 'items-center', 'justify-center');
      });
    }
    const editorContainer = container.querySelector('.ql-container.ql-snow');
    if (editorContainer) {
      editorContainer.style.border = 'none';
      editorContainer.classList.add('!font-sans', '!text-base');
    }
    const editor = container.querySelector('.ql-editor');
    if (editor) {
      editor.classList.add('!px-0', '!py-2', '!text-[#101828]', 'dark:!text-[#dbd8d3]', 'min-h-[80px]');
    }
  });

  function makeSlot(startTime = "00:00", endTime = "03:00", offHours = false) {
    return { startTime, endTime, offHours: Boolean(offHours) };
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
    return formData.value.repeatRule === "weekly" || formData.value.repeatRule === "everyXWeeks";
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
  formData.value.oneTimeAvailability = normalizeOneTimeAvailability(formData.value.oneTimeAvailability);

  const weekDays = ref(formData.value.weeklyAvailability);
  const oneTimeDates = ref(formData.value.oneTimeAvailability);

  function to12HourLabel(time24 = "00:00") {
    const [rawHour = "0", rawMinute = "0"] = String(time24).split(":");
    const hour = Number(rawHour);
    const minute = Number(rawMinute);
    const safeHour = Number.isFinite(hour) ? hour : 0;
    const safeMinute = Number.isFinite(minute) ? minute : 0;
    const period = safeHour >= 12 ? "PM" : "AM";
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
    if (formData.value.repeatRule === "everyXWeeks") {
      formData.value.repeatX = 2;
    }
    if (formData.value.repeatRule === "doesNotRepeat" && oneTimeDates.value.length === 0) {
      oneTimeDates.value = normalizeOneTimeAvailability([]);
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

    dateRangeMessage.value = "Date range adjusted: end date cannot be earlier than start date.";
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
    <form class="flex flex-col gap-6 relative px-6">

      <div class=" self-stretch inline-flex justify-start items-start gap-4">
        <div class="w-6 h-6 relative overflow-hidden">
          <svg width="19" height="14" viewBox="0 0 19 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 5H1M18 1H1M18 9H1M14 13H1" stroke="#344054" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
        </div>
        <div class="flex-1 inline-flex flex-col justify-start items-start gap-4">
          <div class="flex w-full">
            <div class="flex-1">
              <BaseInput type="text" placeholder="Event Title" v-model="formData.eventTitle" wrapperClass="w-full"
                inputClass="px-3.5 text-gray-900 w-full text-base font-normal outline-none py-2.5 bg-white/30 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300" />
            </div>
            <select v-model="formData.eventColorSkin"
              class="h-[45px] bg-white/50 border-l text-sm px-2 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 outline-none min-w-[140px]">
              <option v-for="color in colorOptions" :key="color.value" :value="color.value">
                {{ color.label }}
              </option>
            </select>
          </div>
          <div
            class="tier-description-quill-container flex flex-col px-3.5 py-2.5 border-b border-[#D0D5DD] rounded-t-sm shadow-sm bg-white/30 w-full dark:bg-[#181a1b4d] dark:border-[#3b4043]">
            <div ref="quillEditor"></div>
          </div>
          <div class="flex flex-col gap-1.5 w-full">
            <div class="flex flex-col gap-1.5">
              <div class="text-slate-700 text-xs font-normal leading-none">Call Type</div>
              <select v-model="formData.eventCallType"
                class="self-stretch bg-white/50 px-4 py-2 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 outline-none">
                <option value="video">Video Call</option>
                <option value="audio">Audio Call</option>
              </select>
            </div>
          </div>
          <div class="flex w-full gap-3">
            <div class="flex-1 inline-flex flex-col justify-start items-start gap-1.5">
              <div class="self-stretch flex flex-col justify-start items-start gap-1.5">
                <select v-model="formData.eventRingtoneUrl"
                  class="self-stretch bg-white/75 px-4 py-2 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 outline-none">
                  <option v-for="ringtone in ringtoneOptions" :key="ringtone.value" :value="ringtone.value">
                    {{ ringtone.label }}
                  </option>
                </select>
              </div>
            </div>
            <button type="button" class="flex justify-start items-center gap-1" @click="previewRingtone">
              <img src="https://i.ibb.co/9kQ5CDty/Icon.png" alt="" />
              <div class="justify-start text-slate-700 text-sm font-medium leading-tight">Preview</div>
            </button>
          </div>
          <div class="self-stretch flex flex-col justify-start items-start gap-1.5">
            <div class=""><span class="text-slate-700 text-xs font-normal leading-none">Event Image </span><span
                class="text-gray-500 text-xs italic font-normal leading-none">Optional</span></div>
            <div class="w-full">
              <!-- Uploaded image preview with delete button -->
              <div v-if="formData.eventImageUrl" class="relative mb-2">
                <img
                  :src="formData.eventImageUrl"
                  alt="Event image preview"
                  class="w-full rounded-xl object-cover max-h-40"
                />
                <button
                  type="button"
                  class="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 hover:bg-red-700 flex items-center justify-center transition-colors"
                  aria-label="Remove image"
                  @click="formData.eventImageUrl = ''"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
              <ThumbnailUploaderNay
                v-if="!formData.eventImageUrl"
                custom-class="cursor-pointer border-2 border-transparent bg-black/5 rounded-xl p-2 h-[12.1875rem] flex flex-col items-center justify-center hover:border-gray-900 hover:bg-black/10"
                input-wrapper-class="border-2 border-dashed border-transparent"
                button-wrapper-class="shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] rounded-lg h-10 w-10 relative flex justify-center items-center"
                button-icon-wrapper-class="cursor-pointer shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] bg-green-500 rounded-lg h-10 w-10 flex justify-center items-center hover:bg-black"
                button-parent-wrapper-class="flex flex-col items-center justify-center gap-3"
                button-text="Click to upload"
                button-text-class="font-semibold text-gray-900 cursor-pointer"
                drop-text="or drag and drop"
                drop-text-class="text-sm font-normal leading-5 text-gray-500 text-center"
                custom-allowed-types="SVG, PNG, JPG or GIF"
                custom-max-size="800x400px"
                eenable-image-compression="true"
                format-text-class="text-gray-500 text-xs leading-[1.125rem] text-center mb-0"
                @media-uploaded="onEventImageUploaded"
              />
            </div>
          </div>
        </div>
      </div>

      <BookingSectionsWrapper title="Session Duration" leftIcon="https://i.ibb.co/cSjDYSdk/Icon.png">
        <div class='flex flex-col gap-[30px]'>
          <div class="flex items-center gap-2 mt-3 ">
            <BaseInput type="number" placeholder="" v-model="formData.duration"
              inputClass="px-3.5 text-gray-900 placeholder:text-gray-900 w-full text-base font-normal outline-none py-2.5 bg-white/30 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300" />
            <div class=" text-black text-base font-medium leading-normal">Minutes</div>
          </div>
          <div class="self-stretch flex flex-col justify-center items-start gap-2">
            <CheckboxGroup v-model="formData.allowLongerSessions" label="Allow user to book longer sessions"
              checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
              labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal" wrapperClass="flex items-center gap-2" />
            <div :class="['ml-6 transition-opacity duration-200',
                        !formData.allowLongerSessions ? 'opacity-50' : 'opacity-100']">
              <div class="w-full text-gray-500 text-sm font-medium leading-tight">Maximum Session Allowed</div>
              <div class="flex items-center gap-1.5 ">
                <div class="">
                  <BaseInput type="number" placeholder="" v-model="formData.maxSessionDuration"
                    :disabled="!formData.allowLongerSessions"
                    inputClass="px-3.5 w-44 text-gray-900 placeholder:text-gray-900 text-base font-normal outline-none py-2.5 bg-white/30 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 disabled:cursor-not-allowed" />
                </div>
                <div class="flex flex-col">
                  <div class="justify-center text-black text-base font-medium leading-normal">Sessions</div>
                  <div v-if="formData.duration" class="justify-center text-black text-xs font-medium leading-none">({{ formData.duration }} minutes)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BookingSectionsWrapper>

      <BookingSectionsWrapper title="Pricing Settings" leftIcon="https://i.ibb.co/F47R5CqG/Icon-1.png"
        leftIconClass="mt-[4px]">
        <div class="flex-1 inline-flex flex-col justify-start items-start gap-5 mt-4">
          <div class="flex flex-col justify-start items-start gap-1.5">
            <div class="justify-start text-gray-500 text-sm font-medium font-['Poppins'] leading-tight">
              Base Price
            </div>
            <div class="flex items-center gap-2">
              <BaseInput type="number" placeholder="" v-model="formData.basePrice"
                inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300" />
              <div class="flex gap-2 items-center">
                <span class="text-black text-base font-medium font-['Poppins'] leading-normal">Tokens </span><span
                  class="text-black text-sm font-normal font-['Poppins'] leading-tight">/session</span>
              </div>
            </div>
          </div>

          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <CheckboxGroup v-model="formData.enableLongerDiscount" label="Enable discount price for longer sessions"
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
                      sessions minimum
                    </div>
                    <div v-if="formData.sessionMinimum && formData.duration" class="justify-center text-black text-xs font-medium font-['Poppins'] leading-none">
                      ({{ formData.sessionMinimum }} x {{ formData.duration }} = {{ formData.sessionMinimum * formData.duration }} minutes)
                    </div>
                  </div>
                </div>
                <div :class="['inline-flex justify-end items-center gap-2',!formData.enableLongerDiscount? 'opacity-50':'opacity-100']">
                  <BaseInput type="number" placeholder="" v-model="formData.discountPercentage"
                    :disabled="!formData.enableLongerDiscount"
                    inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:cursor-not-allowed" />
                  <div class="h-10 inline-flex flex-col justify-between items-start">
                    <div class="justify-center text-black text-base font-medium font-['Poppins'] leading-normal">
                      % off base price
                    </div>
                    <div v-if="formData.basePrice && formData.discountPercentage" class="justify-center text-black text-xs font-medium font-['Poppins'] leading-none">
                      ({{ Math.round( formData.basePrice * ( (100 - formData.discountPercentage) / 100 ) ) }} tokens/session)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <div class="flex gap-2">
              <CheckboxGroup v-model="formData.enableBookingFee" label="Enable booking fee"
                checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal"
                wrapperClass="flex items-center gap-2 mb-3" />

              <div class="mt-[2px] relative group inline-block">
                <img
                  src="https://i.ibb.co/HD78k3Sf/Icon.png"
                  alt=""
                  class="cursor-pointer"
                />
                <!-- Tooltip -->
                <div
                  class="absolute left-1/2 -translate-x-1/2 mt-2 w-max max-w-[16rem]
                        bg-white text-gray-800 text-xs font-medium
                        px-3 py-2 rounded-md shadow-lg border border-gray-200
                        opacity-0 group-hover:opacity-100
                        transition-opacity duration-200 pointer-events-none z-50"
                >
                  This amount will be on hold in fan's token balance. if booking is rejected after negotiation period, this amount will be deducted from fan's balance. If booking is accepted, the balance on hold will be deducted towards the call session payment.
                </div>
              </div>
            </div>

            <div class="inline-flex justify-start items-start gap-2">
              <div class="w-6 h-10" />
              <div class="inline-flex flex-col justify-center items-start gap-2">
                <div :class="['inline-flex justify-start items-center gap-2',!formData.enableBookingFee? 'opacity-50':'opacity-100']">
                  <BaseInput type="number" placeholder="" v-model="formData.bookingFee"
                    :disabled="!formData.enableBookingFee"
                    inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:cursor-not-allowed" />
                  <div class="w-14 justify-start text-black text-base font-medium font-['Poppins'] leading-normal">
                    Tokens
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <div class="self-stretch flex flex-col justify-center items-start gap-2">
              <div class="flex gap-2">
                <CheckboxGroup v-model="formData.allowInstantBooking" label="Allow instant booking"
                  checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                  labelClass="text-slate-700 mt-[1px] text-[16px] leading-normal"
                  wrapperClass="flex items-center gap-2 mb-3" midImg="https://i.ibb.co/G418dSPz/Icon.png" />

                 <div class="mt-[2px] relative group inline-block">
                    <img
                      src="https://i.ibb.co/HD78k3Sf/Icon.png"
                      alt=""
                      class="cursor-pointer"
                    />
                    <!-- Tooltip -->
                    <div
                      class="absolute left-1/2 -translate-x-1/2 mt-2 w-max max-w-[16rem]
                            bg-white text-gray-800 text-xs font-medium
                            px-3 py-2 rounded-md shadow-lg border border-gray-200
                            opacity-0 group-hover:opacity-100
                            transition-opacity duration-200 pointer-events-none z-50"
                    >
                      bookings without personal requests will be approved automatically.
                    </div>
                  </div>
              </div>

              <div class="self-stretch inline-flex justify-start items-start gap-2">
                <div class="w-6 h-6" />
                <div :class="['flex-1 inline-flex flex-col justify-start items-start gap-2',!formData.allowInstantBooking ? 'opacity-50':'opacity-100']">
                  <div class="self-stretch inline-flex justify-end items-center gap-2">
                    <div
                      class="flex-1 justify-center text-slate-700 text-base font-normal font-['Poppins'] leading-normal">
                      Approve sessions instantly after bookings.
                    </div>
                  </div>

                  <CheckboxGroup v-model="formData.disableChatBeforeCall" label="Disable chat before call"
                    checkboxClass="m-0 border border-checkboxBorder [appearance:none] w-[0.75rem] h-[0.75rem] rounded bg-transparent relative cursor-pointer checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.2rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45 "
                    labelClass="text-slate-700 text-[16px] leading-normal"
                    wrapperClass="flex items-center gap-2 mb-3 mt-2" />
                </div>
              </div>
            </div>
          </div>
          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <div class="self-stretch flex flex-col justify-center items-start gap-1">
              <div class="flex gap-2">
                <CheckboxGroup v-model="formData.enableRescheduleFee" label="Enable reschedule  fee"
                  checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                  labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal"
                  wrapperClass="flex items-center gap-2 mb-3" />

                <div class="mt-[2px] relative group inline-block">
                    <img
                      src="https://i.ibb.co/HD78k3Sf/Icon.png"
                      alt=""
                      class="cursor-pointer"
                    />
                    <!-- Tooltip -->
                    <div
                      class="absolute left-1/2 -translate-x-1/2 mt-2 w-max max-w-[16rem]
                            bg-white text-gray-800 text-xs font-medium
                            px-3 py-2 rounded-md shadow-lg border border-gray-200
                            opacity-0 group-hover:opacity-100
                            transition-opacity duration-200 pointer-events-none z-50"
                    >
                      A rescheduling fee will be charged if a confirmed booking is changed.
                    </div>
                  </div>
              </div>

              <div class="self-stretch inline-flex justify-start items-start gap-2">
                <div class="w-6 h-10" />
                <div :class="['inline-flex flex-col justify-start items-start',!formData.enableRescheduleFee ? 'opacity-50':'opacity-100']">
                  <div class="inline-flex justify-end items-center gap-2">
                    <BaseInput type="number" placeholder="" v-model="formData.rescheduleFee"
                      :disabled="!formData.enableRescheduleFee"
                      inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:cursor-not-allowed" />

                    <div class="justify-center text-slate-700 text-base font-normal font-['Poppins'] leading-normal">
                      Tokens
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <div class="self-stretch flex flex-col justify-center items-start gap-1">
              <div class="flex gap-2">
                <CheckboxGroup v-model="formData.enableCancellationFee" label="Enable cancellation fee"
                  checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                  labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal"
                  wrapperClass="flex items-center gap-2 mb-3" />

                <div class="mt-[2px] relative group inline-block">
                    <img
                      src="https://i.ibb.co/HD78k3Sf/Icon.png"
                      alt=""
                      class="cursor-pointer"
                    />
                    <!-- Tooltip -->
                    <div
                      class="absolute left-1/2 -translate-x-1/2 mt-2 w-max max-w-[16rem]
                            bg-white text-gray-800 text-xs font-medium
                            px-3 py-2 rounded-md shadow-lg border border-gray-200
                            opacity-0 group-hover:opacity-100
                            transition-opacity duration-200 pointer-events-none z-50"
                    >
                      A cancellation fee will apply if a user cancels an approved booking or fails to attend the scheduled call.
                    </div>
                  </div>
              </div>
              <div :class="['self-stretch inline-flex justify-start items-start gap-2',!formData.enableCancellationFee ? 'opacity-50':'opacity-100']">
                <div class="w-6 h-10" />
                <div class="inline-flex flex-col justify-start items-start">
                  <div class="inline-flex justify-end items-center gap-2">
                    <BaseInput type="number" placeholder="15" v-model="formData.cancellationFee"
                      :disabled="!formData.enableCancellationFee"
                      inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed" />
                    <div class="justify-center text-slate-700 text-base font-normal font-['Poppins'] leading-normal">
                      Tokens
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div :class="['ml-7 flex flex-col justify-start items-start gap-2',!formData.enableCancellationFee ? 'opacity-50':'opacity-100']">
              <CheckboxGroup v-model="formData.allowAdvanceCancellation"
                label="User can cancel in advance to void minimum charge"
                checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal"
                wrapperClass="flex items-center gap-2 mb-3" />
              <div :class="['flex items-center gap-2', !formData.allowAdvanceCancellation ? 'opacity-50':'opacity-100']">
                <div class="flex items-center gap-2">
                  <BaseInput type="number" placeholder="15" v-model="formData.advanceVoid"
                    :disabled="!formData.allowAdvanceCancellation"
                    inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:cursor-not-allowed" />
                </div>
                <div class="justify-center text-slate-700 text-base font-normal leading-normal">
                  in advance
                </div>
              </div>
            </div>
          </div>
        </div>
      </BookingSectionsWrapper>

      <BookingSectionsWrapper title="Off-hour Surcharge" leftIcon="https://i.ibb.co/k6kzjyCp/Icon-2.png"
        titleIcon="https://i.ibb.co/HD78k3Sf/Icon.png">
        <div :class="['self-stretch inline-flex justify-start items-center gap-2 mt-5', !formData.addOffHourSurcharge ? 'opacity-50':'opacity-100']">
          <CheckboxGroup v-model="formData.addOffHourSurcharge" label="Add"
            checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
            labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal" wrapperClass="flex items-center gap-2" />
          <div class="flex-1 inline-flex flex-col justify-start items-start">
            <div class="inline-flex justify-end items-center gap-2">
              <BaseInput type="number" placeholder="" v-model="formData.offHourSurcharge"
                :disabled="!formData.addOffHourSurcharge"
                inputClass="px-3.5 w-44 text-gray-900 placeholder:text-gray-900 text-base font-normal outline-none py-2.5 bg-white/30 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed" />
              <div class="h-10 inline-flex flex-col justify-between items-start">
                <div class="justify-center text-gray-700 text-base font-medium leading-normal">% from base price</div>
                <div class="justify-center text-gray-700 text-xs font-medium leading-none">(1,600 tokens/session)</div>
              </div>
            </div>
          </div>
        </div>
      </BookingSectionsWrapper>

      <BookingSectionsWrapper title="Calendar Availability" leftIcon="https://i.ibb.co/Ldw310vp/Icon.png">
        <div class="w-full flex flex-col gap-5 mt-5">
          <div class="flex flex-col gap-3 w-full">
            <div class="self-stretch justify-start text-gray-900 text-xs font-normal font-['Poppins'] leading-none">
              GMT +8 Hong Kong Standard time
            </div>

            <select v-model="formData.repeatRule"
              class="bg-white/50 w-full px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300">
              <option value="weekly">Repeat Weekly</option>
              <option value="doesNotRepeat">Does not repeat</option>
              <option value="everyXWeeks">Repeats every 2 weeks</option>
            </select>
            <div v-if="formData.repeatRule !== 'doesNotRepeat'" class="self-stretch inline-flex justify-start items-end">
              <div class="flex-1 inline-flex flex-col justify-start items-start gap-1.5">
                <div class="self-stretch flex flex-col justify-start items-start gap-1.5">
                  <div class="justify-start">
                    <span class="text-gray-500 text-sm font-medium font-['Poppins'] leading-tight">
                      {{ formData.repeatRule === 'everyXWeeks' ? 'Start date' : 'Duration' }}
                    </span>
                    <span v-if="formData.repeatRule !== 'everyXWeeks'"
                      class="text-gray-500 text-xs italic font-normal font-['Poppins'] leading-none"> Optional</span>
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
                    {{ formData.repeatRule === 'everyXWeeks' ? `End date` : '' }} <span class="text-gray-500 text-xs italic font-normal font-['Poppins'] leading-none">Optional</span>
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


          <div v-if="formData.repeatRule !== 'doesNotRepeat'" class="flex flex-col gap-4 w-full">

            <div v-for="(day, index) in weekDays" :key="index"
              class="self-stretch inline-flex justify-start items-start gap-1"
              :class="{
                'items-center min-h-10 gap-3': day.unavailable,
                'opacity-60': isWeeklyDayLocked(day.key || day.name),
              }">

              <div class="justify-start text-gray-500 text-base font-normal font-['Poppins'] leading-normal"
                :class="day.unavailable ? 'w-12' : 'w-10 h-10 flex items-center justify-center'">
                {{ day.name }}
              </div>

              <template v-if="day.unavailable">
                <div class="flex-1 justify-start text-gray-500 text-base font-normal leading-normal">
                  Not Available
                </div>
                <button type="button" @click="addDayAvailability(index)"
                  class="w-6 h-6 rounded-full border border-gray-400 text-gray-600 flex items-center justify-center hover:bg-gray-100"
                  :disabled="isWeeklyDayLocked(day.key || day.name)"
                  :class="{ 'opacity-40 cursor-not-allowed hover:bg-transparent': isWeeklyDayLocked(day.key || day.name) }"
                  title="Add availability">
                  +
                </button>
              </template>

              <template v-else>
                <div class="flex-1 inline-flex flex-col justify-center items-start gap-1">

                  <div v-for="(slot, sIdx) in day.slots" :key="sIdx"
                    class="self-stretch inline-flex justify-start items-center gap-1">

                    <div class="flex-1 inline-flex flex-col justify-start items-start gap-1.5">
                      <div class="self-stretch flex flex-col justify-start items-start gap-1.5">
                        <select v-model="slot.startTime" @change="onSlotChanged"
                          :disabled="isWeeklyDayLocked(day.key || day.name)"
                          class="self-stretch px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 outline-none text-gray-900 text-base font-normal font-['Poppins'] leading-normal">
                          <option v-for="timeOption in timeOptions" :key="`start-${day.key}-${sIdx}-${timeOption.value}`"
                            :value="timeOption.value">
                            {{ timeOption.label }}
                          </option>
                        </select>
                      </div>
                    </div>

                    <div class="justify-start text-gray-500 text-base font-medium font-['Poppins'] leading-normal">
                      -
                    </div>

                    <div class="flex-1 inline-flex flex-col justify-start items-start gap-1.5">
                      <select v-model="slot.endTime" @change="onSlotChanged"
                        :disabled="isWeeklyDayLocked(day.key || day.name)"
                        class="self-stretch px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 outline-none text-gray-900 text-base font-normal font-['Poppins'] leading-normal">
                        <option v-for="timeOption in timeOptions" :key="`end-${day.key}-${sIdx}-${timeOption.value}`"
                          :value="timeOption.value">
                          {{ timeOption.label }}
                        </option>
                      </select>
                    </div>

                    <div class="pl-1 flex justify-start items-center gap-2">
                      <button type="button" @click="removeWeeklySlot(index, sIdx)"
                        class="w-6 h-6 rounded-full border border-gray-400 text-gray-600 flex items-center justify-center hover:bg-gray-100"
                        :disabled="isWeeklyDayLocked(day.key || day.name) || getTotalWeeklySlotCount() <= 1"
                        :class="{ 'opacity-40 cursor-not-allowed hover:bg-transparent': isWeeklyDayLocked(day.key || day.name) || getTotalWeeklySlotCount() <= 1 }"
                        title="Remove availability">
                        -
                      </button>
                      <button type="button" @click="addWeeklySlot(index)"
                        class="w-6 h-6 rounded-full border border-gray-400 text-gray-600 flex items-center justify-center hover:bg-gray-100"
                        :disabled="isWeeklyDayLocked(day.key || day.name)"
                        :class="{ 'opacity-40 cursor-not-allowed hover:bg-transparent': isWeeklyDayLocked(day.key || day.name) }"
                        title="Add another period to this day">
                        +
                      </button>
                      <button v-if="formData.repeatRule === 'weekly'" type="button" @click="toggleSlotOffHours(index, sIdx)"
                        class="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-gray-100"
                        :disabled="isWeeklyDayLocked(day.key || day.name)"
                        :class="[
                          slot.offHours ? 'border-pink-500 text-pink-500' : 'border-gray-400 text-gray-500',
                          isWeeklyDayLocked(day.key || day.name) ? 'opacity-40 cursor-not-allowed hover:bg-transparent' : '',
                        ]"
                        title="Mark as off hours">
                        ⛅
                      </button>
                    </div>

                  </div>
                </div>
              </template>

            </div>
          </div>

          <div v-if="formData.repeatRule === 'doesNotRepeat'" class="flex flex-col gap-4 w-full">
            <div v-for="(entry, entryIndex) in oneTimeDates" :key="entry.id"
              class="border border-gray-200 rounded-md p-3 bg-white/30">
              <div class="flex items-center gap-2 mb-3">
                <input
                  type="date"
                  v-model="entry.date"
                  @change="onSlotChanged"
                  :min="getOneTimeDateMin()"
                  :max="formData.dateTo || undefined"
                  class="bg-white/75 w-full px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300"
                />
                <button v-if="oneTimeDates.length > 1" type="button" @click="removeOneTimeDate(entryIndex)"
                  class="w-7 h-7 rounded text-red-500 hover:bg-red-50">
                  🗑
                </button>
              </div>

              <div class="flex flex-col gap-2">
                <div v-if="entry.slots.length === 0" class="flex items-center">
                  <button
                    type="button"
                    @click="addOneTimeSlot(entryIndex)"
                    class="px-2 py-1 text-xs rounded bg-gray-900 text-green-400 hover:bg-black"
                  >
                    Add time slot
                  </button>
                </div>

                <div v-for="(slot, slotIndex) in entry.slots" :key="`${entry.id}-${slotIndex}`"
                  class="flex items-center gap-1">
                  <select v-model="slot.startTime" @change="onSlotChanged"
                    class="flex-1 px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm border-b border-gray-300 outline-none">
                    <option v-for="timeOption in timeOptions" :key="`one-start-${entry.id}-${slotIndex}-${timeOption.value}`"
                      :value="timeOption.value">
                      {{ timeOption.label }}
                    </option>
                  </select>
                  <div class="text-gray-500">-</div>
                  <select v-model="slot.endTime" @change="onSlotChanged"
                    class="flex-1 px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm border-b border-gray-300 outline-none">
                    <option v-for="timeOption in timeOptions" :key="`one-end-${entry.id}-${slotIndex}-${timeOption.value}`"
                      :value="timeOption.value">
                      {{ timeOption.label }}
                    </option>
                  </select>
                  <button type="button" @click="removeOneTimeSlot(entryIndex, slotIndex)"
                    :disabled="getTotalOneTimeSlotCount() <= 1"
                    :class="{ 'opacity-40 cursor-not-allowed hover:bg-transparent': getTotalOneTimeSlotCount() <= 1 }"
                    class="w-6 h-6 rounded-full border border-gray-400 text-gray-600 hover:bg-gray-100">-</button>
                  <button type="button" @click="addOneTimeSlot(entryIndex)"
                    class="w-6 h-6 rounded-full border border-gray-400 text-gray-600 hover:bg-gray-100">+</button>
                </div>
              </div>
            </div>

            <div>
              <button type="button" @click="addOneTimeDate"
                class="bg-gray-900 text-green-400 text-xs font-semibold px-2 py-1 rounded hover:bg-black">
                Add A Date
              </button>
            </div>
          </div>
        </div>
      </BookingSectionsWrapper>

      <div class="w-full bg-[#D0D5DD] h-[1px]"></div>

      <BookingSectionsWrapper title=" Call Settings" leftIcon="https://i.ibb.co/xq0ZdVmP/Icon.png"
        accordionIcon="https://i.ibb.co/MD46QRZS/Frame-1410099649.png" :is-open="sectionsState.callSettings"
        @toggle="toggleSection('callSettings')">
        <div v-show="sectionsState.callSettings" class="flex flex-col justify-start items-start gap-5 mt-5">
          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <div class="self-stretch flex flex-col justify-center items-start gap-1">
              <div class="self-stretch inline-flex justify-start items-center gap-1">
                <div class="justify-start text-slate-700 text-base font-normal leading-normal">Offer discount if call
                  starts
                  late</div><img src="https://i.ibb.co/HD78k3Sf/Icon.png" alt="" />
              </div>
            </div>
            <div class="self-stretch flex flex-col justify-start items-start gap-1.5">
              <div class="self-stretch flex flex-col justify-start items-start gap-1.5">
                <select v-model="formData.lateStartAction"
                  class="self-stretch px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 outline-none">
                  <option value="reschedule">Allow reschedule</option>
                  <option value="refund">Issue refund</option>
                  <option value="nextDiscount">Give next-session discount</option>
                </select>
                <div v-if="formData.lateStartAction === 'nextDiscount'" class="pt-1">
                  <BaseInput type="number" placeholder="Discount % for next session"
                    v-model="formData.lateStartDiscountPercent"
                    inputClass="bg-white/50 w-full px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300" />
                </div>
              </div>
            </div>
          </div>
          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <div class="self-stretch flex flex-col justify-center items-start gap-1">
              <div class="self-stretch justify-start text-slate-700 text-base font-normal leading-normal">Call functions
              </div>
              <CheckboxGroup v-model="formData.disableChatDuringCall" label="Disable chat during call"
                checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal"
                wrapperClass="flex items-center gap-2 mb-3 mt-2" />
            </div>
          </div>
          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <div class="self-stretch flex flex-col justify-center items-start gap-1">
              <div class="self-stretch inline-flex justify-start items-center gap-1">
                <div class="justify-start text-slate-700 text-base font-normal leading-normal">
                  Fan can request to extend session in call</div>
                 <div class="mt-[2px] relative group inline-block">
                    <img
                      src="https://i.ibb.co/HD78k3Sf/Icon.png"
                      alt=""
                      class="cursor-pointer"
                    />
                    <!-- Tooltip -->
                    <div
                      class="absolute left-1/2 -translate-x-1/2 mt-2 w-max max-w-[16rem]
                            bg-white text-gray-800 text-xs font-medium
                            px-3 py-2 rounded-md shadow-lg border border-gray-200
                            opacity-0 group-hover:opacity-100
                            transition-opacity duration-200 pointer-events-none z-50"
                    >
                      Fans can request to extend an ongoing session. If it overlaps with your upcoming events, the extension will be declined.
                    </div>
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
                    <div class="justify-center text-black text-base font-medium leading-normal">sessions maximum</div>
                    <div v-if="formData.duration && formData.extendSessionMax" class="justify-center text-black text-xs font-medium leading-none">({{ formData.duration * formData.extendSessionMax }} minutes)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BookingSectionsWrapper>

      <div class="w-full bg-[#D0D5DD] h-[1px]"></div>

      <BookingSectionsWrapper title=" Booking Settings" leftIcon="https://i.ibb.co/nNmmvwnf/Icon-1.png"
        accordionIcon="https://i.ibb.co/MD46QRZS/Frame-1410099649.png" :is-open="sectionsState.bookingSettings"
        @toggle="toggleSection('bookingSettings')">
        <div v-show="sectionsState.bookingSettings" class="flex flex-col justify-start items-start gap-5 mt-5">
          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <div class="self-stretch flex flex-col justify-center items-start gap-1">
              <div class="self-stretch inline-flex justify-start items-center gap-1">
                <div class="justify-start text-slate-700 text-base font-normal leading-normal">Call reminder</div>
                <div class="mt-[2px] relative group inline-block">
                    <img
                      src="https://i.ibb.co/HD78k3Sf/Icon.png"
                      alt=""
                      class="cursor-pointer"
                    />
                    <!-- Tooltip -->
                    <div
                      class="absolute left-1/2 -translate-x-1/2 mt-2 w-max max-w-[16rem]
                            bg-white text-gray-800 text-xs font-medium
                            px-3 py-2 rounded-md shadow-lg border border-gray-200
                            opacity-0 group-hover:opacity-100
                            transition-opacity duration-200 pointer-events-none z-50"
                    >
                      Reminders will be sent to notify you of upcoming appointments.
                    </div>
                  </div>
              </div>
              <CheckboxGroup v-model="formData.setReminders" label="Enable reminder"
                checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal"
                wrapperClass="flex items-center gap-2 mb-2 mt-2" />
              <div :class="['self-stretch flex flex-col justify-start items-start', !formData.setReminders ? 'opacity-50':'opacity-100']">
                <div class=" inline-flex justify-end items-center gap-2">
                  <div class="justify-center text-slate-700 text-base font-normal leading-normal">Remind me</div>
                  <BaseInput type="number" placeholder="" v-model="formData.remindMeTime"
                    :disabled="!formData.setReminders"
                    inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:cursor-not-allowed" />
                  <div class="flex-1 justify-center text-slate-700 text-base font-normal leading-normal">minutes before
                    a
                  </div>
                </div>
                <div class="inline-flex justify-end items-center gap-2">
                  <div class="justify-center text-slate-700 text-base font-normal leading-normal">scheduled call.</div>
                </div>
              </div>
            </div>
          </div>
          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <div class="flex gap-2">
              <CheckboxGroup v-model="formData.setBufferTime" label="Set buffer time between booked appointments"
                checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal"
                wrapperClass="flex items-center gap-2" />
              <div class="mt-[2px] relative group inline-block">
                    <img
                      src="https://i.ibb.co/HD78k3Sf/Icon.png"
                      alt=""
                      class="cursor-pointer"
                    />
                    <!-- Tooltip -->
                    <div
                      class="absolute left-1/2 -translate-x-1/2 mt-2 w-max max-w-[16rem]
                            bg-white text-gray-800 text-xs font-medium
                            px-3 py-2 rounded-md shadow-lg border border-gray-200
                            opacity-0 group-hover:opacity-100
                            transition-opacity duration-200 pointer-events-none z-50"
                    >
                      Reminders will be sent to notify you of upcoming appointments.
                    </div>
                  </div>
            </div>
            <div class="inline-flex justify-start items-center gap-2">
              <div class="w-6 h-6" />
              <div :class="['flex justify-start items-end gap-2',!formData.setBufferTime? 'opacity-50':'opacity-100']">
                <BaseInput type="number" placeholder="" v-model="formData.bufferTime"
                  :disabled="!formData.setBufferTime"
                  inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:cursor-not-allowed" />
                <div class="w-44 inline-flex flex-col justify-start items-start gap-1.5">
                  <div class="self-stretch flex flex-col justify-start items-start gap-1.5">
                    <select v-model="formData.bufferUnit" :disabled="!formData.setBufferTime"
                      class="self-stretch px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 outline-none disabled:cursor-not-allowed">
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <div class="flex gap-2 items-center">
              <CheckboxGroup v-model="formData.setMaxBookings" label="Set maximum bookings per day"
                checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal"
                wrapperClass="flex items-center gap-2" />
              <div class="mt-[2px]"><img src="https://i.ibb.co/HD78k3Sf/Icon.png" alt="" /></div>
            </div>
            <div class="inline-flex justify-start items-center gap-2">
              <div class="w-6 h-6" />
              <div class="opacity-50 flex justify-start items-end gap-2">
                <BaseInput type="number" placeholder="15" v-model="formData.maxBookingsPerDay"
                  :disabled="!formData.setMaxBookings"
                  inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed" />
              </div>
            </div>
          </div>
          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <div class="self-stretch flex flex-col justify-center items-start gap-1">
              <div class="flex gap-2">
                <CheckboxGroup v-model="formData.allowWaitlist"
                  label="If booking slots are full, allow fans to join waitlist"
                  checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                  labelClass="text-slate-700 text-[16px] mt-[1px] leading-normal"
                  wrapperClass="flex items-center gap-2" />
                <div class="mt-[2px]"><img src="https://i.ibb.co/HD78k3Sf/Icon.png" alt="" /></div>
              </div>
              <div class="self-stretch inline-flex justify-start items-start gap-2">
                <div class="w-6 h-10" />
                <div class="opacity-50 inline-flex flex-col justify-start items-start">
                  <div class="inline-flex justify-end items-center gap-2">
                    <BaseInput type="number" placeholder="15" v-model="formData.waitlistSpots"
                      :disabled="!formData.allowWaitlist"
                      inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed" />
                    <div class="justify-center text-slate-700 text-base font-normal leading-normal">waitlist spots</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BookingSectionsWrapper>

      <div class="w-full bg-[#D0D5DD] h-[1px] mb-[50px] mt-[10px]"></div>


    </form>
    <div class="flex justify-end">
      <ButtonComponent @click="goToNext" text="Next" variant="polygonLeft"
        :rightIcon="'https://i.ibb.co/hx8ztZFf/svgviewer-png-output-8.webp'" :rightIconClass="`
          w-6 h-6 transition duration-200
          filter brightness-0 invert-0   /* Default: black */
          group-hover:[filter:brightness(0)_saturate(100%)_invert(75%)_sepia(23%)_saturate(7280%)_hue-rotate(93deg)_brightness(109%)_contrast(95%)]
        `" btnBg="#07f468" btnHoverBg="black" btnText="black" btnHoverText="#07f468" />
    </div>
  </template>
