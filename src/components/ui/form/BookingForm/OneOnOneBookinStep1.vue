  <script setup>
  import { computed, nextTick, onMounted, ref, watch } from "vue";
  import CheckboxGroup from "../checkbox/CheckboxGroup.vue";
  import ButtonComponent from "@/components/dev/button/ButtonComponent.vue";
  import BookingSectionsWrapper from "../BookingForm/HelperComponents/BookingSectionsWrapper.vue";
  import BaseInput from "@/components/dev/input/BaseInput.vue";
  import QuillEditor from "@/components/dev/input/QuillEditor.vue";
  import ThumbnailUploaderNay from "../../global/media/uploader/HelperComponents/ThumbnailUploaderNay.vue";
  import TooltipIcon from "@/components/ui/tooltip/TooltipIcon.vue";
  import CustomDropdown from "@/components/ui/dropdown/CustomDropdown.vue";
  import SoftDisabledBookingButton from "./HelperComponents/SoftDisabledBookingButton.vue";
  import ValidationInlineWarning from "./HelperComponents/ValidationInlineWarning.vue";
  import videoIcon from '@/assets/images/icons/video-recorder.webp'
  import phoneIcon from '@/assets/images/icons/phone.webp'
  import minusIcon from '@/assets/images/icons/minus-circle.webp'
  import plusIcon from '@/assets/images/icons/plus-circle.webp'
  import cloudMoonIcon from '@/assets/images/icons/cloud-moon.webp'
  import cloudMoonPinkIcon from '@/assets/images/icons/cloud-moon-pink.webp'
  import alignLeftIcon from '@/assets/images/icons/align-left.svg'
  import calendarIcon from '@/assets/images/icons/calendar-empty.svg'
  import trashIcon from '@/assets/images/icons/trash-01.svg'
  import OptionalLabel from "./HelperComponents/OptionalLabel.vue";
  import {
    createValidationErrorMap,
    createValidationTooltipItems,
    getFirstValidationField,
    getValidationMessages,
    scrollToFirstValidationWarning,
    scrollToValidationField,
  } from "./validationUi.js";

  import { showToast } from "@/utils/toastBus.js";
  import {
    formatBookingValidationErrors,
    useBookingTranslations,
  } from "@/i18n/bookingTranslations.js";

  const { t } = useBookingTranslations();

  const STEP1_FIELD_LABEL_KEYS = Object.freeze({
    eventTitle: "booking_field_event_title",
    duration: "booking_field_session_duration",
    basePrice: "booking_field_base_price",
    eventGoalTokens: "booking_field_event_goal",
    minContributionPerUser: "booking_field_minimum_contribution_per_user",
    maxSessionDuration: "booking_field_max_session_duration",
    maxSessionMinutes: "booking_field_max_session_duration",
    firstTimeDiscountTokens: "booking_field_first_time_discount",
    sessionMinimum: "booking_field_session_minimum",
    discountMinSessions: "booking_field_session_minimum",
    longerSessionDiscountTokens: "booking_field_longer_session_discount",
    bookingFee: "booking_field_booking_fee",
    bookingFeeTokens: "booking_field_booking_fee",
    rescheduleFee: "booking_field_reschedule_fee",
    rescheduleFeeTokens: "booking_field_reschedule_fee",
    cancellationFee: "booking_field_cancellation_fee",
    cancellationFeeTokens: "booking_field_cancellation_fee",
    advanceVoid: "booking_field_advance_cancellation_window",
    advanceCancelWindowQuantity: "booking_field_advance_cancellation_window",
    advanceCancelWindowUnit: "booking_field_advance_cancellation_unit",
    offHourSurcharge: "booking_field_off_hour_surcharge",
    offHourSurchargePercent: "booking_field_off_hour_surcharge",
    extendSessionMax: "booking_field_extend_session_max",
    extendMaxSessions: "booking_field_extend_session_max",
    remindMeTime: "booking_field_reminder_time",
    callReminderMinutesBefore: "booking_field_reminder_time",
    bookingBufferMinutes: "booking_field_buffer_time",
    bufferTime: "booking_field_buffer_time",
    maxBookingsPerDay: "booking_field_max_bookings_per_day",
    discountEventsCount: "booking_field_recurring_event_minimum",
    minEventsForRecurringDiscount: "booking_field_recurring_event_minimum",
    discountPercentage: "booking_field_recurring_discount_percentage",
    recurringDiscountPercentOfBase: "booking_field_recurring_discount_percentage",
    maxAttendees: "booking_field_max_attendees",
    dateFrom: "booking_field_start_date",
    weeklyAvailability: "booking_field_weekly_availability",
    monthlyAvailability: "booking_field_monthly_availability",
    oneTimeAvailability: "booking_field_available_time_slot",
  });

  const STEP1_FIELD_LABEL_FALLBACKS = Object.freeze({
    eventTitle: "Event title",
    duration: "Session duration",
    basePrice: "Base price",
    eventGoalTokens: "Event goal",
    minContributionPerUser: "Minimum contribution per user",
    maxSessionDuration: "Maximum session allowed",
    maxSessionMinutes: "Maximum session allowed",
    firstTimeDiscountTokens: "First-time discount",
    sessionMinimum: "Session minimum",
    discountMinSessions: "Session minimum",
    longerSessionDiscountTokens: "Longer session discount",
    bookingFee: "Booking fee",
    bookingFeeTokens: "Booking fee",
    rescheduleFee: "Reschedule fee",
    rescheduleFeeTokens: "Reschedule fee",
    cancellationFee: "Cancellation fee",
    cancellationFeeTokens: "Cancellation fee",
    advanceVoid: "Advance cancellation window",
    advanceCancelWindowQuantity: "Advance cancellation window",
    advanceCancelWindowUnit: "Advance cancellation unit",
    offHourSurcharge: "Off-hour surcharge",
    offHourSurchargePercent: "Off-hour surcharge",
    extendSessionMax: "Extension session maximum",
    extendMaxSessions: "Extension session maximum",
    remindMeTime: "Reminder time",
    callReminderMinutesBefore: "Reminder time",
    bookingBufferMinutes: "Buffer time",
    bufferTime: "Buffer time",
    maxBookingsPerDay: "Maximum bookings per day",
    discountEventsCount: "Recurring event minimum",
    minEventsForRecurringDiscount: "Recurring event minimum",
    discountPercentage: "Recurring discount percentage",
    recurringDiscountPercentOfBase: "Recurring discount percentage",
    maxAttendees: "Maximum participants",
    dateFrom: "Start date",
    weeklyAvailability: "Weekly availability",
    monthlyAvailability: "Monthly availability",
    oneTimeAvailability: "Available time slot",
  });

  const STEP1_FIELD_SECTION_MAP = Object.freeze({
    basePrice: "privatePricing",
    bookingFee: "privatePricing",
    bufferTime: "bookingSettings",
    cancellationFee: "privatePricing",
    dateFrom: "calendarAvailability",
    discountEventsCount: "groupPricing",
    discountPercentage: "groupPricing",
    eventGoalTokens: "groupPricing",
    firstTimeDiscountTokens: "privatePricing",
    longerSessionDiscountTokens: "privatePricing",
    maxAttendees: "bookingSettings",
    maxBookingsPerDay: "bookingSettings",
    maxSessionDuration: "sessionDuration",
    minContributionPerUser: "groupPricing",
    monthlyAvailability: "calendarAvailability",
    offHourSurcharge: "offHourSurcharge",
    oneTimeAvailability: "calendarAvailability",
    remindMeTime: "bookingSettings",
    rescheduleFee: "privatePricing",
    sessionMinimum: "privatePricing",
    weeklyAvailability: "calendarAvailability",
  });

  function translateWithFallback(key, fallback) {
    const translated = t(key);
    return translated && translated !== key ? translated : fallback;
  }

  function humanizeFieldName(field) {
    const normalized = String(field || "").trim();
    if (!normalized) return "";
    const words = normalized
      .replace(/[_-]+/g, " ")
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .trim()
      .toLowerCase();
    return words ? words.charAt(0).toUpperCase() + words.slice(1) : "";
  }

  function hasConditionalValidationError(errors = []) {
    return (Array.isArray(errors) ? errors : []).some((error) => Boolean(error?.conditional));
  }

  function getRequiredFieldToastLabels(errors = []) {
    const seen = new Set();
    return (Array.isArray(errors) ? errors : [])
      .map((error) => {
        const field = String(error?.field || "").trim();
        const key = STEP1_FIELD_LABEL_KEYS[field];
        const fallback = STEP1_FIELD_LABEL_FALLBACKS[field] || humanizeFieldName(field);
        return key ? translateWithFallback(key, fallback) : fallback;
      })
      .filter((label) => {
        if (!label || seen.has(label)) return false;
        seen.add(label);
        return true;
      });
  }

  function formatConditionalValidationToastMessage(errors = []) {
    const seenLabels = new Set();
    const items = (Array.isArray(errors) ? errors : [])
      .flatMap((error) => {
        if (!error?.conditional) {
          return formatBookingValidationErrors([error], t).filter(Boolean);
        }

        const [label] = getRequiredFieldToastLabels([error]);
        if (!label || seenLabels.has(label)) return [];
        seenLabels.add(label);
        return [label];
      })
      .filter(Boolean);

    if (items.length === 0) return "";

    const prefix = translateWithFallback(
      "booking_validation_conditional_required_fields_message",
      "Fill these fields or disable the related settings:",
    );
    const list = items.map((item, index) => `${index + 1}. ${item}`).join("\n");
    return `${prefix}\n${list}`;
  }

  function formatStepValidationToast(errors = [], fallbackMessage = "") {
    const list = Array.isArray(errors) ? errors : [];
    const conditionalErrors = list.filter((error) => Boolean(error?.conditional));
    const regularErrors = list.filter((error) => !error?.conditional);

    if (conditionalErrors.length === 0) {
      const messages = formatBookingValidationErrors(regularErrors, t).filter(Boolean);
      return {
        title: translateWithFallback("common_validation_failed", "Validation Failed"),
        message: messages.join("\n") || fallbackMessage,
      };
    }

    return {
      title: translateWithFallback("booking_validation_required_fields_title", "Please fill these fields"),
      message: formatConditionalValidationToastMessage(list),
    };
  }

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
    bookingType: {
      type: String,
      default: "private",
      validator: (value) => ["private", "group"].includes(value),
    },
    scheduleLocked: {
      type: Boolean,
      default: false,
    },
    pricingLocked: {
      type: Boolean,
      default: false,
    },
    validationRevealRequest: {
      type: Object,
      default: null,
    },
  });
  const emit = defineEmits(["preview-schedule"]);
  const DEFAULT_VUE_CREATOR_ID = 1407;
  const isGroupBooking = computed(() => props.bookingType === "group");
  const scheduleLockTooltip = computed(() => t("booking_schedule_locked_tooltip"));
  const pricingLockTooltip = computed(() => t("booking_pricing_locked_tooltip"));
  const isScheduleLocked = computed(() => isGroupBooking.value && props.scheduleLocked);
  const isPricingLocked = computed(() => isGroupBooking.value && props.pricingLocked);
  const step1SectionOrder = computed(() => (
    isGroupBooking.value
      ? ["calendarAvailability", "groupPricing", "offHourSurcharge"]
      : ["privatePricing", "offHourSurcharge", "calendarAvailability"]
  ));

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

    return "flex items-end justify-end gap-2 fixed bottom-0 right-0 z-10";
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
    longerSessionDiscountTokens: props.engine.state.longerSessionDiscountTokens || props.engine.state.discountPercentage || "",
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
    firstTimeDiscountTokens: props.engine.state.firstTimeDiscountTokens || props.engine.state.firstTimeDiscount || "",
    firstTimeDiscount: props.engine.state.firstTimeDiscount || "",
    enableBookingFee: props.engine.state.enableBookingFee || false,
    allowInstantBooking: props.engine.state.allowInstantBooking || false,
    disableChatBeforeCall: props.engine.state.disableChatBeforeCall || false,
    enableRescheduleFee: props.engine.state.enableRescheduleFee || false,
    enableCancellationFee: props.engine.state.enableCancellationFee || false,
    allowAdvanceCancellation: props.engine.state.allowAdvanceCancellation || false,
    addOffHourSurcharge: props.engine.state.addOffHourSurcharge || false,
    disableChatDuringCall: props.engine.state.disableChatDuringCall || false,
    disableChatAllowEmoji: props.engine.state.disableChatAllowEmoji || false,
    disableChatDuringCallAllowEmoji: props.engine.state.disableChatDuringCallAllowEmoji || false,
    requestExtendSession: props.engine.state.requestExtendSession || false,
    setBufferTime: props.engine.state.setBufferTime || false,
    setMaxBookings: props.engine.state.setMaxBookings || false,
    allowWaitlist: props.engine.state.allowWaitlist || false,
    eventImageUrl: props.engine.state.eventImageUrl || "",
    priceSetting: props.engine.state.priceSetting || (props.bookingType === "group" ? "eventGoal" : "fixedPricePerUser"),
    eventGoalTokens: props.engine.state.eventGoalTokens || "",
    enableMinContributionPerUser: props.engine.state.enableMinContributionPerUser || false,
    minContributionPerUser: props.engine.state.minContributionPerUser || "",
    goalNotMet: props.engine.state.goalNotMet || "cancelEvent",
    enableMaxAttendees: props.engine.state.enableMaxAttendees || false,
    maxAttendees: props.engine.state.maxAttendees || "",
  });

  const formRootRef = ref(null);
  const showInlineValidation = ref(false);
  const validationErrors = ref([]);
  const validationPending = ref(true);
  const step1ValidationValid = ref(false);
  const SHOW_BOOKING_VALIDATION_TOASTS = false;
  let step1ValidationRunId = 0;

  function formatInlineValidationError(error) {
    return formatBookingValidationErrors([error], t)?.[0] || String(error?.message || "").trim();
  }

  function formatTooltipValidationError(error) {
    if (!error?.conditional) return formatInlineValidationError(error);
    const [label] = getRequiredFieldToastLabels([error]);
    return label || formatInlineValidationError(error);
  }

  const validationErrorMap = computed(() => (
    showInlineValidation.value
      ? createValidationErrorMap(validationErrors.value, formatInlineValidationError)
      : {}
  ));

  const nextButtonSoftDisabled = computed(() => (
    validationPending.value || !step1ValidationValid.value
  ));

  const nextButtonTooltip = computed(() => {
    if (!validationErrors.value.length) return "";
    const fallback = t("booking_validation_weekly_slot_required");
    const toast = formatStepValidationToast(validationErrors.value, fallback);
    return toast.message || fallback;
  });

  const nextButtonTooltipItems = computed(() => (
    createValidationTooltipItems(validationErrors.value, formatTooltipValidationError)
  ));

  function fieldValidationMessages(fields) {
    return getValidationMessages(validationErrorMap.value, fields);
  }

  function resolveStep1SectionForField(field) {
    if (["advanceVoid", "advanceCancelWindowUnit"].includes(field)) {
      return isGroupBooking.value ? "groupPricing" : "privatePricing";
    }
    if (field === "cancellationFee") {
      return isGroupBooking.value ? "groupPricing" : "privatePricing";
    }
    if (field === "offHourSurcharge") {
      return isGroupBooking.value ? "groupPricing" : "privatePricing";
    }
    return STEP1_FIELD_SECTION_MAP[field] || "";
  }

  function openSectionForValidationErrors(errors = validationErrors.value, preferredField = "") {
    const field = preferredField || getFirstValidationField(errors);
    const section = resolveStep1SectionForField(field);
    if (!section || !Object.prototype.hasOwnProperty.call(sectionsState.value, section)) return;
    sectionsState.value[section] = true;
  }

  async function revealStep1ValidationErrors(errors = validationErrors.value, options = {}) {
    validationErrors.value = Array.isArray(errors) ? errors : [];
    if (validationErrors.value.length) {
      step1ValidationValid.value = false;
    }
    showInlineValidation.value = true;
    openSectionForValidationErrors(validationErrors.value, options.field);
    await nextTick();
    await nextTick();
    if (options.field) {
      scrollToValidationField(formRootRef.value, options.field);
      return;
    }
    if (options.scroll === false) return;
    scrollToFirstValidationWarning(formRootRef.value);
  }

  async function goToStep1ValidationField(item = {}) {
    await revealStep1ValidationErrors(validationErrors.value, { field: item?.field || "" });
  }

  async function validateStep1({ reveal = false, scroll = true } = {}) {
    const runId = step1ValidationRunId + 1;
    step1ValidationRunId = runId;
    validationPending.value = true;
    try {
      const result = await props.engine.validate?.(1);
      const nextErrors = Array.isArray(result?.errors) ? result.errors : [];
      const nextValid = Boolean(result?.valid) && nextErrors.length === 0;

      if (runId === step1ValidationRunId) {
        validationErrors.value = nextErrors;
        step1ValidationValid.value = nextValid;
        if (reveal) {
          await revealStep1ValidationErrors(nextErrors, { scroll });
        }
      }

      return {
        valid: nextValid,
        errors: nextErrors,
      };
    } catch (error) {
      const nextErrors = Array.isArray(error?.errors) ? error.errors : [];

      if (runId === step1ValidationRunId) {
        validationErrors.value = nextErrors;
        step1ValidationValid.value = false;
        if (reveal) {
          await revealStep1ValidationErrors(nextErrors, { scroll });
        }
      }

      return {
        valid: false,
        errors: nextErrors,
        error,
      };
    } finally {
      if (runId === step1ValidationRunId) {
        validationPending.value = false;
      }
    }
  }

  function showStep1ValidationToast(errors = validationErrors.value, fallback = t("booking_validation_weekly_slot_required")) {
    if (!SHOW_BOOKING_VALIDATION_TOASTS) return;
    const toast = formatStepValidationToast(errors, fallback);
    showToast({
      type: "error",
      title: toast.title,
      message: toast.message || fallback,
      autoClose: false,
    });
  }

  const offHourSurchargePreviewTokens = computed(() => {
    if (!formData.value.addOffHourSurcharge) return 0;
    const basePrice = Number(formData.value.basePrice);
    const percent = Number(formData.value.offHourSurcharge);
    if (!Number.isFinite(basePrice) || !Number.isFinite(percent) || basePrice <= 0 || percent <= 0) return 0;
    return Math.ceil(basePrice * percent / 100);
  });

  // Watch for changes and update engine state
  // Watch for changes and update engine state
  watch(formData, (newVal) => {
    Object.keys(newVal).forEach(key => {
      props.engine.setState(key, newVal[key], { silent: true });
    });
    void validateStep1();
  }, { deep: true });

  const onEventImageUploaded = ({ media_urls }) => {
    formData.value.eventImageUrl = Array.isArray(media_urls) ? media_urls[0] : media_urls;
  };

  // Accordion State
  const sectionsState = ref({
    callSettings: false,
    bookingSettings: false,
    calendarAvailability: false,
    groupPricing: false,
    privatePricing: false,
  });

  const toggleSection = (key) => {
    sectionsState.value[key] = !sectionsState.value[key];
  };

  const goToNext = async () => {
    const result = await validateStep1({ reveal: true, scroll: false });
    if (!result.valid) {
      showStep1ValidationToast(result.errors);
      return;
    }

    try {
      await props.engine.goToStep(2, { throwOnBlocked: true });
    } catch (error) {
      const fallback = error?.message || t("booking_validation_weekly_slot_required");
      const errors = Array.isArray(error?.errors) ? error.errors : [];
      await revealStep1ValidationErrors(errors, { scroll: false });
      showStep1ValidationToast(errors, fallback);
    }
  };

  const colorOptions = [
    { label: t("booking_color_blue"), value: "#5549FF", color: "#5549FF" },
    { label: t("booking_color_red"), value: "#FF3B30", color: "#FF3B30" },
    { label: t("booking_color_green"), value: "#22C55E", color: "#22C55E" },
    { label: t("booking_color_pink"), value: "#FF2D92", color: "#FF2D92" },
    { label: t("booking_color_orange"), value: "#F97316", color: "#F97316" },
    { label: t("booking_color_purple"), value: "#8B5CF6", color: "#8B5CF6" },
    { label: t("booking_color_teal"), value: "#14B8A6", color: "#14B8A6" },
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

  const groupPricingOptions = [
    { label: t("booking_group_fixed_price_option"), value: "fixedPricePerUser" },
    { label: t("booking_group_event_goal_option"), value: "eventGoal" },
  ];

  const groupGoalNotMetOptions = [
    { label: t("booking_group_goal_not_met_cancel_refund"), value: "cancelEvent" },
    { label: t("booking_group_goal_not_met_proceed"), value: "proceedWithoutGoalMet" },
  ];

  onMounted(() => {
    ensureVueCreatorIdFallback();
    void validateStep1();
  });

  watch(
    () => props.validationRevealRequest?.nonce,
    async (nonce) => {
      if (!nonce) return;
      const errors = Array.isArray(props.validationRevealRequest?.errors)
        ? props.validationRevealRequest.errors
        : [];
      if (errors.length) {
        await revealStep1ValidationErrors(errors, {
          field: props.validationRevealRequest?.field || "",
          scroll: props.validationRevealRequest?.scroll !== false,
        });
        return;
      }
      await validateStep1({
        reveal: true,
        scroll: props.validationRevealRequest?.scroll !== false,
      });
    },
    { immediate: true },
  );

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
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const todayIsoDate = getTodayIsoDate();

  function getDateFromMax() {
    const dateTo = formData.value.dateTo;
    if (!isIsoDate(dateTo)) return undefined;
    return dateTo >= todayIsoDate ? dateTo : undefined;
  }

  function getDateToMin() {
    if (!isIsoDate(formData.value.dateFrom)) return todayIsoDate;
    return formData.value.dateFrom > todayIsoDate ? formData.value.dateFrom : todayIsoDate;
  }

  function getOneTimeDateMin() {
    return todayIsoDate;
  }

  function createOneTimeDate(date = getTodayIsoDate()) {
    return {
      id: `date_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      date,
      slots: [],
    };
  }

  function addDaysToIsoDate(isoDate, days = 1) {
    const date = new Date(`${isIsoDate(isoDate) ? isoDate : getTodayIsoDate()}T12:00:00`);
    date.setDate(date.getDate() + days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getOneTimeUsedDates(excludeIndex = null, sourceDates = oneTimeDates.value) {
    return new Set((Array.isArray(sourceDates) ? sourceDates : [])
      .map((entry, index) => (index === excludeIndex ? "" : entry?.date))
      .filter((date) => isIsoDate(date)));
  }

  function getNextAvailableOneTimeDate(startDate = getTodayIsoDate(), excludeIndex = null, sourceDates = oneTimeDates.value) {
    const usedDates = getOneTimeUsedDates(excludeIndex, sourceDates);
    let candidate = isIsoDate(startDate) && startDate >= todayIsoDate ? startDate : todayIsoDate;

    for (let attempt = 0; attempt < 3650; attempt += 1) {
      if (!usedDates.has(candidate)) return candidate;
      candidate = addDaysToIsoDate(candidate, 1);
    }

    return "";
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

    const normalizedEntries = [];
    return input.map((entry) => {
      const rawDate = typeof entry?.date === "string" && entry.date ? entry.date : getTodayIsoDate();
      const date = getNextAvailableOneTimeDate(rawDate, null, normalizedEntries);
      const normalizedEntry = {
        id: entry?.id || `date_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        date,
        slots: [],
      };
      const slots = Array.isArray(entry?.slots) && entry.slots.length > 0
        ? entry.slots
          .map((slot) => ({
            startTime: typeof slot?.startTime === "string" ? slot.startTime : "12:00",
            endTime: typeof slot?.endTime === "string" ? slot.endTime : "15:00",
            offHours: Boolean(slot?.offHours),
          }))
          .filter((slot) => {
            if (!getOneTimeSlotRange(slot) || doesOneTimeSlotConflict(normalizedEntry, slot)) return false;
            normalizedEntry.slots.push(slot);
            return true;
          })
        : [];
      normalizedEntry.slots = slots;
      normalizedEntries.push(normalizedEntry);
      return normalizedEntry;
    });
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

  const TIME_OPTION_STEP_MINUTES = 5;
  const MIN_SLOT_DURATION_MINUTES = 5;
  const MINUTES_PER_DAY = 24 * 60;
  const MINUTES_PER_WEEK = MINUTES_PER_DAY * 7;
  const END_OF_DAY_TIME_VALUE = "23:59";
  const timeSearchPlaceholder = "Search...";

  const timeOptions = Array.from({ length: MINUTES_PER_DAY / TIME_OPTION_STEP_MINUTES }, (_, index) => {
    const totalMinutes = index * TIME_OPTION_STEP_MINUTES;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const value = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    return { value, label: to12HourLabel(value) };
  });
  const endTimeOptions = [
    ...timeOptions,
    { value: END_OF_DAY_TIME_VALUE, label: to12HourLabel(END_OF_DAY_TIME_VALUE) },
  ];
  const timeOptionValues = timeOptions.map((option) => option.value);
  const endTimeOptionValues = endTimeOptions.map((option) => option.value);

  function getOrderedTimesAfter(startTime = "") {
    const startIndex = timeOptionValues.indexOf(startTime);
    if (startIndex < 0) return timeOptionValues;
    return [
      ...timeOptionValues.slice(startIndex + 1),
      ...timeOptionValues.slice(0, startIndex),
    ];
  }

  function timeToMinutes(value) {
    const match = String(value || "").match(/^(\d{2}):(\d{2})$/);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    return (hours * 60) + minutes;
  }

  function minutesToTime(totalMinutes) {
    const normalized = ((totalMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
    const hours = Math.floor(normalized / 60);
    const minutes = normalized % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  function getOneTimeSlotKey(slot = {}) {
    const startTime = typeof slot?.startTime === "string" ? slot.startTime : "";
    const endTime = typeof slot?.endTime === "string" ? slot.endTime : "";
    return startTime && endTime ? `${startTime}|${endTime}` : "";
  }

  function getOneTimeRangeFromTimes(startTime = "", endTime = "", { inclusiveEndOfDay = !isGroupBooking.value } = {}) {
    const start = timeToMinutes(startTime);
    const rawEnd = timeToMinutes(endTime);
    if (start === null || rawEnd === null || rawEnd === start) return null;
    const end = inclusiveEndOfDay && endTime === END_OF_DAY_TIME_VALUE && rawEnd >= start
      ? MINUTES_PER_DAY
      : (rawEnd < start ? rawEnd + MINUTES_PER_DAY : rawEnd);
    return { start, end };
  }

  function getSlotDurationMinutesFromTimes(startTime = "", endTime = "") {
    const range = getOneTimeRangeFromTimes(startTime, endTime);
    return range ? range.end - range.start : null;
  }

  function hasMinimumSlotDuration(startTime = "", endTime = "") {
    const duration = getSlotDurationMinutesFromTimes(startTime, endTime);
    return duration !== null && duration >= MIN_SLOT_DURATION_MINUTES;
  }

  function isValidSlotCandidate(existingRanges = [], startTime = "", endTime = "") {
    return hasMinimumSlotDuration(startTime, endTime)
      && !oneTimeRangeOverlapsExisting(existingRanges, getOneTimeRangeFromTimes(startTime, endTime));
  }

  function getOneTimeSlotRange(slot = {}) {
    return getOneTimeRangeFromTimes(slot?.startTime, slot?.endTime);
  }

  function getSlotRange(slot = {}) {
    return getOneTimeSlotRange(slot);
  }

  function getOneTimeRangeSegments(range = null) {
    if (!range) return [];
    if (range.end <= MINUTES_PER_DAY) return [range];
    return [
      { start: range.start, end: MINUTES_PER_DAY },
      { start: 0, end: range.end - MINUTES_PER_DAY },
    ].filter((segment) => segment.end > segment.start);
  }

  function getOneTimeRangesSegments(ranges = []) {
    return ranges
      .flatMap((range) => getOneTimeRangeSegments(range))
      .sort((first, second) => first.start - second.start);
  }

  function oneTimeRangeSegmentsOverlap(firstRange = null, secondRange = null) {
    const firstSegments = getOneTimeRangeSegments(firstRange);
    const secondSegments = getOneTimeRangeSegments(secondRange);
    return firstSegments.some((first) => secondSegments.some((second) => (
      first.start < second.end && second.start < first.end
    )));
  }

  function oneTimeRangeOverlapsExisting(existingRanges = [], candidateRange = null) {
    if (!candidateRange) return true;
    return existingRanges.some((range) => oneTimeRangeSegmentsOverlap(range, candidateRange));
  }

  function getExistingSlotRanges(slots = [], excludeIndex = null) {
    return (Array.isArray(slots) ? slots : [])
      .map((slot, index) => ({ index, range: getSlotRange(slot) }))
      .filter(({ index, range }) => index !== excludeIndex && range)
      .map(({ range }) => range)
      .sort((first, second) => first.start - second.start);
  }

  function doesOneTimeSlotConflict(dateEntry = {}, candidateSlot = {}, excludeIndex = null) {
    if (!hasMinimumSlotDuration(candidateSlot?.startTime, candidateSlot?.endTime)) return true;
    return oneTimeRangeOverlapsExisting(
      getExistingOneTimeRanges(dateEntry, excludeIndex),
      getOneTimeSlotRange(candidateSlot),
    );
  }

  function getExistingOneTimeRanges(dateEntry = {}, excludeIndex = null) {
    return (Array.isArray(dateEntry?.slots) ? dateEntry.slots : [])
      .map((slot, index) => ({ index, range: getOneTimeSlotRange(slot) }))
      .filter(({ index, range }) => index !== excludeIndex && range)
      .map(({ range }) => range)
      .sort((first, second) => first.start - second.start);
  }

  function hasValidEndTimeForStartSegments(existingSegments = [], startTime = "") {
    const startMinutes = timeToMinutes(startTime);
    if (startMinutes === null) return false;
    const startsInsideExistingRange = existingSegments.some((segment) => (
      segment.start <= startMinutes && startMinutes < segment.end
    ));
    if (startsInsideExistingRange) return false;

    const nextOccupiedSegment = existingSegments.find((segment) => segment.start > startMinutes);
    return !nextOccupiedSegment || nextOccupiedSegment.start - startMinutes >= TIME_OPTION_STEP_MINUTES;
  }

  function hasValidStartTimeForEndRanges(existingRanges = [], endTime = "") {
    return timeOptionValues.some((startTime) => (
      isValidSlotCandidate(existingRanges, startTime, endTime)
    ));
  }

  function getValidEndTimesForStartRanges(existingRanges = [], startTime = "") {
    return endTimeOptionValues.filter((endTime) => (
      isValidSlotCandidate(existingRanges, startTime, endTime)
    ));
  }

  function getValidStartTimesForEndRanges(existingRanges = [], endTime = "") {
    return timeOptionValues.filter((startTime) => (
      isValidSlotCandidate(existingRanges, startTime, endTime)
    ));
  }

  function pickValidEndTimeFromRanges(existingRanges = [], startTime = "", preferredEnd = "") {
    const validEndTimes = getValidEndTimesForStartRanges(existingRanges, startTime);
    const startMinutes = timeToMinutes(startTime);
    const preferredEndMinutes = timeToMinutes(preferredEnd);
    if (
      validEndTimes.includes(preferredEnd)
      && startMinutes !== null
      && preferredEndMinutes !== null
      && preferredEndMinutes > startMinutes
    ) {
      return preferredEnd;
    }

    if (startMinutes !== null) {
      const nextOccupiedStart = getOneTimeRangesSegments(existingRanges)
        .map((range) => range.start)
        .find((occupiedStart) => occupiedStart > startMinutes);
      const nextOccupiedEndTime = nextOccupiedStart !== undefined
        ? minutesToTime(nextOccupiedStart)
        : "";
      if (nextOccupiedEndTime && validEndTimes.includes(nextOccupiedEndTime)) {
        return nextOccupiedEndTime;
      }

      if (startMinutes > 0 && validEndTimes.includes("00:00")) {
        return "00:00";
      }
    }

    const orderedEndTimes = getOrderedTimesAfter(startTime);
    return orderedEndTimes.find((endTime) => validEndTimes.includes(endTime)) || "";
  }

  function pickValidStartTimeFromRanges(existingRanges = [], endTime = "", preferredStart = "") {
    const validStartTimes = getValidStartTimesForEndRanges(existingRanges, endTime);
    if (validStartTimes.includes(preferredStart)) return preferredStart;
    return validStartTimes[0] || "";
  }

  function getNextAvailableSlotFromRanges(existingRanges = [], preferredStart = "00:00", preferredEnd = "03:00") {
    if (isValidSlotCandidate(existingRanges, preferredStart, preferredEnd)) {
      return makeSlot(preferredStart, preferredEnd);
    }

    const preferredStartMinutes = timeToMinutes(preferredStart);
    const preferredEndMinutes = timeToMinutes(preferredEnd);
    const duration = Math.max(MIN_SLOT_DURATION_MINUTES, preferredStartMinutes !== null
      && preferredEndMinutes !== null
      ? (preferredEndMinutes > preferredStartMinutes
        ? preferredEndMinutes - preferredStartMinutes
        : MINUTES_PER_DAY - preferredStartMinutes + preferredEndMinutes)
      : 180);
    const searchStartTime = preferredEndMinutes !== null
      ? minutesToTime(preferredEndMinutes)
      : preferredStart;
    const searchStartIndex = timeOptionValues.indexOf(searchStartTime);
    const preferredIndex = searchStartIndex >= 0
      ? searchStartIndex
      : Math.max(0, timeOptionValues.indexOf(preferredStart));
    const orderedStarts = [
      ...timeOptionValues.slice(preferredIndex),
      ...timeOptionValues.slice(0, preferredIndex),
    ];

    for (const startTime of orderedStarts) {
      const startMinutes = timeToMinutes(startTime);
      if (startMinutes === null) continue;
      const endTime = minutesToTime(startMinutes + duration);
      const candidateRange = getOneTimeRangeFromTimes(startTime, endTime);
      if (!oneTimeRangeOverlapsExisting(existingRanges, candidateRange)) {
        return makeSlot(startTime, endTime);
      }
    }

    return null;
  }

  function getRecurringDisabledReason(slot = {}, uniqueKey, uniqueFallback) {
    if (!getSlotRange(slot)) {
      return translateWithFallback(
        "booking_validation_time_slot_order",
        "End time must be after start time.",
      );
    }

    return hasMinimumSlotDuration(slot?.startTime, slot?.endTime)
      ? translateWithFallback(uniqueKey, uniqueFallback)
      : translateWithFallback(
        "booking_validation_time_slot_duration_min",
        "Time slots must be at least 5 minutes.",
      );
  }

  function getRecurringStartOptionsFromRanges(existingRanges = [], slot = {}, uniqueKey, uniqueFallback) {
    const existingSegments = getOneTimeRangesSegments(existingRanges);
    return timeOptions.map((option) => {
      const disabled = !hasValidEndTimeForStartSegments(existingSegments, option.value);
      return {
        ...option,
        disabled,
        disabledReason: disabled
          ? getRecurringDisabledReason({ ...slot, startTime: option.value }, uniqueKey, uniqueFallback)
          : undefined,
      };
    });
  }

  function getRecurringEndOptionsFromRanges(existingRanges = [], slot = {}, uniqueKey, uniqueFallback) {
    return endTimeOptions.map((option) => {
      const hasStartTime = typeof slot?.startTime === "string" && slot.startTime;
      const disabled = hasStartTime
        ? !isValidSlotCandidate(existingRanges, slot.startTime, option.value)
        : !hasValidStartTimeForEndRanges(existingRanges, option.value);
      return {
        ...option,
        disabled,
        disabledReason: disabled
          ? getRecurringDisabledReason({ ...slot, endTime: option.value }, uniqueKey, uniqueFallback)
          : undefined,
      };
    });
  }

  function getNextAvailableOneTimeSlot(dateEntry = {}, preferredStart = "12:00", preferredEnd = "15:00", excludeIndex = null) {
    const preferredSlot = makeSlot(preferredStart, preferredEnd);
    if (!doesOneTimeSlotConflict(dateEntry, preferredSlot, excludeIndex)) {
      return preferredSlot;
    }

    const preferredStartMinutes = timeToMinutes(preferredStart);
    const preferredEndMinutes = timeToMinutes(preferredEnd);
    const duration = Math.max(MIN_SLOT_DURATION_MINUTES, preferredStartMinutes !== null
      && preferredEndMinutes !== null
      && preferredEndMinutes > preferredStartMinutes
      ? preferredEndMinutes - preferredStartMinutes
      : 180);
    const searchStartTime = preferredEndMinutes !== null && preferredEndMinutes < MINUTES_PER_DAY
      ? minutesToTime(preferredEndMinutes)
      : preferredStart;
    const searchStartIndex = timeOptionValues.indexOf(searchStartTime);
    const preferredIndex = searchStartIndex >= 0
      ? searchStartIndex
      : Math.max(0, timeOptionValues.indexOf(preferredStart));
    const orderedStarts = [
      ...timeOptionValues.slice(preferredIndex),
      ...timeOptionValues.slice(0, preferredIndex),
    ];

    for (const startTime of orderedStarts) {
      const startMinutes = timeToMinutes(startTime);
      if (startMinutes === null) continue;
      const endTime = minutesToTime(startMinutes + duration);
      const candidateSlot = makeSlot(startTime, endTime);
      if (!doesOneTimeSlotConflict(dateEntry, candidateSlot, excludeIndex)) {
        return candidateSlot;
      }
    }

    return null;
  }

  function getValidEndTimesForStart(dateEntry = {}, slotIndex = null, startTime = "") {
    const existingRanges = getExistingOneTimeRanges(dateEntry, slotIndex);
    return endTimeOptionValues
      .filter((endTime) => {
        return isValidSlotCandidate(existingRanges, startTime, endTime);
      });
  }

  function getValidStartTimesForEnd(dateEntry = {}, slotIndex = null, endTime = "") {
    const existingRanges = getExistingOneTimeRanges(dateEntry, slotIndex);
    return timeOptionValues
      .filter((startTime) => {
        return isValidSlotCandidate(existingRanges, startTime, endTime);
      });
  }

  function pickValidEndTime(dateEntry = {}, slotIndex = null, startTime = "", preferredEnd = "") {
    const validEndTimes = getValidEndTimesForStart(dateEntry, slotIndex, startTime);
    const startMinutes = timeToMinutes(startTime);
    const preferredEndMinutes = timeToMinutes(preferredEnd);
    if (
      validEndTimes.includes(preferredEnd)
      && startMinutes !== null
      && preferredEndMinutes !== null
      && preferredEndMinutes > startMinutes
    ) {
      return preferredEnd;
    }

    if (startMinutes !== null) {
      const nextOccupiedStart = getExistingOneTimeRanges(dateEntry, slotIndex)
        .map((range) => range.start)
        .find((occupiedStart) => occupiedStart > startMinutes);
      const nextOccupiedEndTime = nextOccupiedStart !== undefined
        ? minutesToTime(nextOccupiedStart)
        : "";
      if (nextOccupiedEndTime && validEndTimes.includes(nextOccupiedEndTime)) {
        return nextOccupiedEndTime;
      }

      if (startMinutes > 0 && validEndTimes.includes("00:00")) {
        return "00:00";
      }
    }

    const orderedEndTimes = getOrderedTimesAfter(startTime);
    return orderedEndTimes.find((endTime) => validEndTimes.includes(endTime)) || "";
  }

  function pickValidStartTime(dateEntry = {}, slotIndex = null, endTime = "", preferredStart = "") {
    const validStartTimes = getValidStartTimesForEnd(dateEntry, slotIndex, endTime);
    if (validStartTimes.includes(preferredStart)) return preferredStart;
    return validStartTimes[0] || "";
  }

  function getOneTimeDisabledReason(slot = {}) {
    if (!getOneTimeSlotRange(slot)) {
      return translateWithFallback(
        "booking_validation_time_slot_order",
        "End time must be after start time.",
      );
    }

    return hasMinimumSlotDuration(slot?.startTime, slot?.endTime)
      ? translateWithFallback(
        "booking_validation_one_time_slot_unique",
        "Each custom time slot must be unique and cannot overlap another slot for that date.",
      )
      : translateWithFallback(
        "booking_validation_time_slot_duration_min",
        "Time slots must be at least 5 minutes.",
      );
  }

  function getOneTimeStartOptions(dateEntry = {}, slotIndex = null) {
    const slot = dateEntry?.slots?.[slotIndex] || {};
    const existingSegments = getOneTimeRangesSegments(getExistingOneTimeRanges(dateEntry, slotIndex));
    return timeOptions.map((option) => {
      const disabled = !hasValidEndTimeForStartSegments(existingSegments, option.value);
      return {
        ...option,
        disabled,
        disabledReason: disabled ? getOneTimeDisabledReason({ ...slot, startTime: option.value }) : undefined,
      };
    });
  }

  function getOneTimeEndOptions(dateEntry = {}, slotIndex = null) {
    const slot = dateEntry?.slots?.[slotIndex] || {};
    const existingRanges = getExistingOneTimeRanges(dateEntry, slotIndex);
    return endTimeOptions.map((option) => {
      const hasStartTime = typeof slot?.startTime === "string" && slot.startTime;
      const disabled = hasStartTime
        ? !isValidSlotCandidate(existingRanges, slot.startTime, option.value)
        : !hasValidStartTimeForEndRanges(existingRanges, option.value);
      return {
        ...option,
        disabled,
        disabledReason: disabled ? getOneTimeDisabledReason({ ...slot, endTime: option.value }) : undefined,
      };
    });
  }

  function getMonthlyExistingRanges(excludeIndex = null) {
    return getExistingSlotRanges(monthlySlots.value, excludeIndex);
  }

  function getMonthlyStartOptions(slotIndex = null) {
    const slot = monthlySlots.value?.[slotIndex] || {};
    return getRecurringStartOptionsFromRanges(
      getMonthlyExistingRanges(slotIndex),
      slot,
      "booking_validation_monthly_slot_unique",
      "Each monthly time slot must be unique and cannot overlap another monthly slot.",
    );
  }

  function getMonthlyEndOptions(slotIndex = null) {
    const slot = monthlySlots.value?.[slotIndex] || {};
    return getRecurringEndOptionsFromRanges(
      getMonthlyExistingRanges(slotIndex),
      slot,
      "booking_validation_monthly_slot_unique",
      "Each monthly time slot must be unique and cannot overlap another monthly slot.",
    );
  }

  function getWeeklyDayIndex(day = {}, fallbackIndex = -1) {
    const key = String(day?.key || day?.name || "").toLowerCase();
    const index = DAY_KEY_TO_INDEX[key];
    return Number.isFinite(index) ? index : fallbackIndex;
  }

  function resolveWeeklyDayIndex(dayIndex = -1) {
    return getWeeklyDayIndex(weekDays.value?.[dayIndex], dayIndex);
  }

  function getWeeklyRangeFromTimes(dayIndex = -1, startTime = "", endTime = "") {
    const range = getOneTimeRangeFromTimes(startTime, endTime);
    if (!range || !Number.isFinite(dayIndex) || dayIndex < 0) return null;
    const offset = dayIndex * MINUTES_PER_DAY;
    return {
      start: offset + range.start,
      end: offset + range.end,
    };
  }

  function getWeeklySlotRange(dayIndex = -1, slot = {}) {
    return getWeeklyRangeFromTimes(resolveWeeklyDayIndex(dayIndex), slot?.startTime, slot?.endTime);
  }

  function weeklyRangesOverlap(existingRange = null, candidateRange = null) {
    if (!existingRange || !candidateRange) return true;
    return [-MINUTES_PER_WEEK, 0, MINUTES_PER_WEEK].some((shift) => {
      const shiftedExisting = {
        start: existingRange.start + shift,
        end: existingRange.end + shift,
      };
      return shiftedExisting.start < candidateRange.end && candidateRange.start < shiftedExisting.end;
    });
  }

  function weeklyRangeOverlapsExisting(existingRanges = [], candidateRange = null) {
    if (!candidateRange) return true;
    return existingRanges.some((range) => weeklyRangesOverlap(range, candidateRange));
  }

  function getExistingWeeklyRanges(excludeDayIndex = null, excludeSlotIndex = null) {
    return (Array.isArray(weekDays.value) ? weekDays.value : [])
      .flatMap((day, dayIndex) => {
        if (day?.unavailable) return [];
        return (Array.isArray(day?.slots) ? day.slots : [])
          .map((slot, slotIndex) => ({
            dayIndex,
            slotIndex,
            range: getWeeklySlotRange(dayIndex, slot),
          }));
      })
      .filter(({ dayIndex, slotIndex, range }) => (
        range && !(dayIndex === excludeDayIndex && slotIndex === excludeSlotIndex)
      ))
      .map(({ range }) => range)
      .sort((first, second) => first.start - second.start);
  }

  function getExistingWeeklySameDayRanges(dayIndex = -1, excludeSlotIndex = null) {
    return getExistingSlotRanges(weekDays.value?.[dayIndex]?.slots, excludeSlotIndex);
  }

  function getShiftedWeeklyRanges(ranges = []) {
    return ranges
      .flatMap((range) => [-MINUTES_PER_WEEK, 0, MINUTES_PER_WEEK].map((shift) => ({
        start: range.start + shift,
        end: range.end + shift,
      })))
      .sort((first, second) => first.start - second.start);
  }

  function hasValidWeeklyEndTimeForStart(dayIndex = -1, slotIndex = null, startTime = "") {
    const startMinutes = timeToMinutes(startTime);
    const resolvedDayIndex = resolveWeeklyDayIndex(dayIndex);
    if (startMinutes === null || !Number.isFinite(resolvedDayIndex) || resolvedDayIndex < 0) {
      return false;
    }

    const startAbsolute = (resolvedDayIndex * MINUTES_PER_DAY) + startMinutes;
    const shiftedWeeklyRanges = getShiftedWeeklyRanges(getExistingWeeklyRanges(dayIndex, slotIndex));
    const startsInsideWeeklyRange = shiftedWeeklyRanges.some((range) => (
      range.start <= startAbsolute && startAbsolute < range.end
    ));
    if (startsInsideWeeklyRange) return false;

    const nextWeeklyRange = shiftedWeeklyRanges.find((range) => range.start > startAbsolute);
    const hasWeeklyGap = !nextWeeklyRange || nextWeeklyRange.start - startAbsolute >= TIME_OPTION_STEP_MINUTES;
    if (!hasWeeklyGap) return false;

    return hasValidEndTimeForStartSegments(
      getOneTimeRangesSegments(getExistingWeeklySameDayRanges(dayIndex, slotIndex)),
      startTime,
    );
  }

  function doesWeeklySlotConflict(dayIndex = -1, candidateSlot = {}, excludeSlotIndex = null) {
    if (!hasMinimumSlotDuration(candidateSlot?.startTime, candidateSlot?.endTime)) return true;
    return weeklyRangeOverlapsExisting(
      getExistingWeeklyRanges(dayIndex, excludeSlotIndex),
      getWeeklySlotRange(dayIndex, candidateSlot),
    ) || oneTimeRangeOverlapsExisting(
      getExistingWeeklySameDayRanges(dayIndex, excludeSlotIndex),
      getSlotRange(candidateSlot),
    );
  }

  function getValidWeeklyEndTimesForStart(dayIndex = -1, slotIndex = null, startTime = "") {
    return endTimeOptionValues.filter((endTime) => (
      hasMinimumSlotDuration(startTime, endTime)
      && !doesWeeklySlotConflict(dayIndex, { startTime, endTime }, slotIndex)
    ));
  }

  function getValidWeeklyStartTimesForEnd(dayIndex = -1, slotIndex = null, endTime = "") {
    return timeOptionValues.filter((startTime) => (
      hasMinimumSlotDuration(startTime, endTime)
      && !doesWeeklySlotConflict(dayIndex, { startTime, endTime }, slotIndex)
    ));
  }

  function getWeeklyStartOptions(dayIndex = -1, slotIndex = null) {
    const slot = weekDays.value?.[dayIndex]?.slots?.[slotIndex] || {};
    return timeOptions.map((option) => {
      const disabled = !hasValidWeeklyEndTimeForStart(dayIndex, slotIndex, option.value);
      return {
        ...option,
        disabled,
        disabledReason: disabled
          ? getRecurringDisabledReason(
            { ...slot, startTime: option.value },
            "booking_validation_weekly_slot_unique",
            "Each weekly time slot must be unique and cannot overlap another weekly slot.",
          )
          : undefined,
      };
    });
  }

  function getWeeklyEndOptions(dayIndex = -1, slotIndex = null) {
    const slot = weekDays.value?.[dayIndex]?.slots?.[slotIndex] || {};
    return endTimeOptions.map((option) => {
      const hasStartTime = typeof slot?.startTime === "string" && slot.startTime;
      const disabled = hasStartTime
        ? !hasMinimumSlotDuration(slot.startTime, option.value)
          || doesWeeklySlotConflict(dayIndex, { startTime: slot.startTime, endTime: option.value }, slotIndex)
        : getValidWeeklyStartTimesForEnd(dayIndex, slotIndex, option.value).length === 0;
      return {
        ...option,
        disabled,
        disabledReason: disabled
          ? getRecurringDisabledReason(
            { ...slot, endTime: option.value },
            "booking_validation_weekly_slot_unique",
            "Each weekly time slot must be unique and cannot overlap another weekly slot.",
          )
          : undefined,
      };
    });
  }

  function getNextAvailableWeeklySlot(dayIndex = -1, preferredStart = "00:00", preferredEnd = "03:00", excludeSlotIndex = null) {
    if (!doesWeeklySlotConflict(dayIndex, makeSlot(preferredStart, preferredEnd), excludeSlotIndex)) {
      return makeSlot(preferredStart, preferredEnd);
    }

    const preferredStartMinutes = timeToMinutes(preferredStart);
    const preferredEndMinutes = timeToMinutes(preferredEnd);
    const duration = Math.max(MIN_SLOT_DURATION_MINUTES, preferredStartMinutes !== null
      && preferredEndMinutes !== null
      ? (preferredEndMinutes > preferredStartMinutes
        ? preferredEndMinutes - preferredStartMinutes
        : MINUTES_PER_DAY - preferredStartMinutes + preferredEndMinutes)
      : 180);
    const searchStartTime = preferredEndMinutes !== null ? minutesToTime(preferredEndMinutes) : preferredStart;
    const searchStartIndex = timeOptionValues.indexOf(searchStartTime);
    const preferredIndex = searchStartIndex >= 0
      ? searchStartIndex
      : Math.max(0, timeOptionValues.indexOf(preferredStart));
    const orderedStarts = [
      ...timeOptionValues.slice(preferredIndex),
      ...timeOptionValues.slice(0, preferredIndex),
    ];

    for (const startTime of orderedStarts) {
      const startMinutes = timeToMinutes(startTime);
      if (startMinutes === null) continue;
      const endTime = minutesToTime(startMinutes + duration);
      if (!doesWeeklySlotConflict(dayIndex, makeSlot(startTime, endTime), excludeSlotIndex)) {
        return makeSlot(startTime, endTime);
      }
    }

    return null;
  }

  function pickValidWeeklyEndTime(dayIndex = -1, slotIndex = null, startTime = "", preferredEnd = "") {
    const validEndTimes = getValidWeeklyEndTimesForStart(dayIndex, slotIndex, startTime);
    const startMinutes = timeToMinutes(startTime);
    const preferredEndMinutes = timeToMinutes(preferredEnd);
    if (
      validEndTimes.includes(preferredEnd)
      && startMinutes !== null
      && preferredEndMinutes !== null
      && preferredEndMinutes > startMinutes
    ) {
      return preferredEnd;
    }

    const resolvedDayIndex = resolveWeeklyDayIndex(dayIndex);
    if (startMinutes !== null && Number.isFinite(resolvedDayIndex) && resolvedDayIndex >= 0) {
      const startAbsolute = (resolvedDayIndex * MINUTES_PER_DAY) + startMinutes;
      const nextOccupiedStart = getExistingWeeklyRanges(dayIndex, slotIndex)
        .flatMap((range) => [-MINUTES_PER_WEEK, 0, MINUTES_PER_WEEK].map((shift) => range.start + shift))
        .filter((occupiedStart) => occupiedStart > startAbsolute)
        .sort((first, second) => first - second)[0];
      const nextOccupiedEndTime = nextOccupiedStart !== undefined
        ? minutesToTime(nextOccupiedStart)
        : "";
      if (nextOccupiedEndTime && validEndTimes.includes(nextOccupiedEndTime)) {
        return nextOccupiedEndTime;
      }

      if (startMinutes > 0 && validEndTimes.includes("00:00")) {
        return "00:00";
      }
    }

    const orderedEndTimes = getOrderedTimesAfter(startTime);
    return orderedEndTimes.find((endTime) => validEndTimes.includes(endTime)) || "";
  }

  function pickValidWeeklyStartTime(dayIndex = -1, slotIndex = null, endTime = "", preferredStart = "") {
    const validStartTimes = getValidWeeklyStartTimesForEnd(dayIndex, slotIndex, endTime);
    if (validStartTimes.includes(preferredStart)) return preferredStart;
    return validStartTimes[0] || "";
  }

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
        offHours: Boolean(slot.offHours),
      })),
    }));

    formData.value.monthlyAvailability = monthlySlots.value.map((slot) => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      offHours: Boolean(slot.offHours),
    }));

    if (formData.value.repeatRule === "doesNotRepeat") {
      const sortedOneTimeDates = oneTimeDates.value
        .map((entry) => entry?.date)
        .filter((date) => isIsoDate(date))
        .sort();
      formData.value.dateFrom = sortedOneTimeDates[0] || "";
      formData.value.dateTo = sortedOneTimeDates.at(-1) || "";

      const firstDateWithSlot = oneTimeDates.value.find((entry) => (
        entry && isIsoDate(entry.date) && Array.isArray(entry.slots) && entry.slots.length > 0
      ));
      if (firstDateWithSlot) {
        const firstSlot = firstDateWithSlot.slots[0];
        formData.value.selectedDate = firstDateWithSlot.date;
        formData.value.selectedStartTime = firstSlot.startTime;
        formData.value.selectedEndTime = firstSlot.endTime;
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
    if (isScheduleLocked.value) return;
    const day = weekDays.value[dayIndex];
    if (!day || isWeeklyDayLocked(day.key || day.name)) return;
    const nextSlot = getNextAvailableWeeklySlot(dayIndex);
    if (!nextSlot) {
      showScheduleValidationToast(
        "booking_validation_weekly_slot_unique",
        "Each weekly time slot must be unique and cannot overlap another weekly slot.",
      );
      return;
    }
    day.unavailable = false;
    day.slots = [nextSlot];
    day.offHours = false;
    syncAvailabilityToForm();
  }

  function addWeeklySlot(dayIndex) {
    if (isScheduleLocked.value) return;
    const day = weekDays.value[dayIndex];
    if (!day || isWeeklyDayLocked(day.key || day.name)) return;
    const nextSlot = getNextAvailableWeeklySlot(dayIndex);
    if (!nextSlot) {
      showScheduleValidationToast(
        "booking_validation_weekly_slot_unique",
        "Each weekly time slot must be unique and cannot overlap another weekly slot.",
      );
      return;
    }
    day.unavailable = false;
    day.slots.push(nextSlot);
    syncAvailabilityToForm();
  }

  function removeWeeklySlot(dayIndex, slotIndex) {
    if (isScheduleLocked.value) return;
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
    if (isScheduleLocked.value) return;
    const day = weekDays.value[dayIndex];
    if (!day || isWeeklyDayLocked(day.key || day.name)) return;
    const slot = day.slots?.[slotIndex];
    if (!slot) return;
    slot.offHours = !slot.offHours;
    day.offHours = day.slots.some((item) => Boolean(item.offHours));
    syncAvailabilityToForm();
  }

  function onSlotChanged() {
    if (isScheduleLocked.value) return;
    syncAvailabilityToForm();
  }

  function onWeeklySlotChanged(dayIndex, slotIndex, changedField = null) {
    if (isScheduleLocked.value) return;
    const day = weekDays.value[dayIndex];
    const slot = day?.slots?.[slotIndex];
    if (!day || !slot || isWeeklyDayLocked(day.key || day.name)) return;

    const startMinutes = timeToMinutes(slot.startTime);
    const endMinutes = timeToMinutes(slot.endTime);
    if (
      changedField === "start"
      && startMinutes !== null
      && endMinutes !== null
      && endMinutes <= startMinutes
    ) {
      const nextEndTime = pickValidWeeklyEndTime(dayIndex, slotIndex, slot.startTime, slot.endTime);
      if (nextEndTime) {
        slot.endTime = nextEndTime;
      }
    }

    if (doesWeeklySlotConflict(dayIndex, slot, slotIndex)) {
      if (changedField === "start") {
        const nextEndTime = pickValidWeeklyEndTime(dayIndex, slotIndex, slot.startTime, slot.endTime);
        if (nextEndTime) {
          slot.endTime = nextEndTime;
        }
      } else if (changedField === "end") {
        const nextStartTime = pickValidWeeklyStartTime(dayIndex, slotIndex, slot.endTime, slot.startTime);
        if (nextStartTime) {
          slot.startTime = nextStartTime;
        }
      }

      if (doesWeeklySlotConflict(dayIndex, slot, slotIndex)) {
        const nextSlot = getNextAvailableWeeklySlot(dayIndex, slot.startTime, slot.endTime, slotIndex);
        if (nextSlot) {
          slot.startTime = nextSlot.startTime;
          slot.endTime = nextSlot.endTime;
        }
      }

      showScheduleValidationToast(
        "booking_validation_weekly_slot_unique",
        "Each weekly time slot must be unique and cannot overlap another weekly slot.",
      );
    }

    day.offHours = day.slots.some((item) => Boolean(item.offHours));
    syncAvailabilityToForm();
  }

  function showScheduleValidationToast(messageKey, fallback) {
    showToast({
      type: "error",
      title: translateWithFallback("common_validation_failed", "Validation Failed"),
      message: translateWithFallback(messageKey, fallback),
      autoClose: false,
    });
  }

  function addMonthlySlot() {
    if (isScheduleLocked.value) return;
    const nextSlot = getNextAvailableSlotFromRanges(getMonthlyExistingRanges());
    if (!nextSlot) {
      showScheduleValidationToast(
        "booking_validation_monthly_slot_unique",
        "Each monthly time slot must be unique and cannot overlap another monthly slot.",
      );
      return;
    }
    monthlySlots.value.push(nextSlot);
    syncAvailabilityToForm();
  }

  function removeMonthlySlot(slotIndex) {
    if (isScheduleLocked.value) return;
    if (getTotalMonthlySlotCount() <= 1) return;
    monthlySlots.value.splice(slotIndex, 1);
    syncAvailabilityToForm();
  }

  function toggleMonthlySlotOffHours(slotIndex) {
    if (isScheduleLocked.value) return;
    const slot = monthlySlots.value?.[slotIndex];
    if (!slot) return;
    slot.offHours = !slot.offHours;
    syncAvailabilityToForm();
  }

  function onMonthlySlotChanged(slotIndex, changedField = null) {
    if (isScheduleLocked.value) return;
    const slot = monthlySlots.value?.[slotIndex];
    if (!slot) return;

    const startMinutes = timeToMinutes(slot.startTime);
    const endMinutes = timeToMinutes(slot.endTime);
    if (
      changedField === "start"
      && startMinutes !== null
      && endMinutes !== null
      && endMinutes <= startMinutes
    ) {
      const nextEndTime = pickValidEndTimeFromRanges(getMonthlyExistingRanges(slotIndex), slot.startTime, slot.endTime);
      if (nextEndTime) {
        slot.endTime = nextEndTime;
      }
    }

    if (oneTimeRangeOverlapsExisting(getMonthlyExistingRanges(slotIndex), getSlotRange(slot))) {
      if (changedField === "start") {
        const nextEndTime = pickValidEndTimeFromRanges(getMonthlyExistingRanges(slotIndex), slot.startTime, slot.endTime);
        if (nextEndTime) {
          slot.endTime = nextEndTime;
        }
      } else if (changedField === "end") {
        const nextStartTime = pickValidStartTimeFromRanges(getMonthlyExistingRanges(slotIndex), slot.endTime, slot.startTime);
        if (nextStartTime) {
          slot.startTime = nextStartTime;
        }
      }

      if (oneTimeRangeOverlapsExisting(getMonthlyExistingRanges(slotIndex), getSlotRange(slot))) {
        const nextSlot = getNextAvailableSlotFromRanges(getMonthlyExistingRanges(slotIndex), slot.startTime, slot.endTime);
        if (nextSlot) {
          slot.startTime = nextSlot.startTime;
          slot.endTime = nextSlot.endTime;
        }
      }

      showScheduleValidationToast(
        "booking_validation_monthly_slot_unique",
        "Each monthly time slot must be unique and cannot overlap another monthly slot.",
      );
    }

    syncAvailabilityToForm();
  }

  function addOneTimeDate() {
    if (isScheduleLocked.value) return;
    const nextDate = getNextAvailableOneTimeDate(getTodayIsoDate());
    if (!nextDate) return;
    oneTimeDates.value.push(createOneTimeDate(nextDate));
    syncAvailabilityToForm();
  }

  function removeOneTimeDate(dateIndex) {
    if (isScheduleLocked.value) return;
    if (oneTimeDates.value.length <= 1) return;
    oneTimeDates.value.splice(dateIndex, 1);
    syncAvailabilityToForm();
  }

  function addOneTimeSlot(dateIndex) {
    if (isScheduleLocked.value) return;
    const dateEntry = oneTimeDates.value[dateIndex];
    if (!dateEntry) return;
    const nextSlot = getNextAvailableOneTimeSlot(dateEntry);
    if (!nextSlot) {
      showScheduleValidationToast(
        "booking_validation_one_time_slot_unique",
        "Each custom time slot must be unique and cannot overlap another slot for that date.",
      );
      return;
    }
    dateEntry.slots.push(nextSlot);
    syncAvailabilityToForm();
  }

  function onOneTimeDateChanged(entryIndex) {
    if (isScheduleLocked.value) return;
    const dateEntry = oneTimeDates.value[entryIndex];
    if (!dateEntry) return;

    if (!isIsoDate(dateEntry.date) || dateEntry.date < todayIsoDate) {
      dateEntry.date = getNextAvailableOneTimeDate(todayIsoDate, entryIndex);
    } else if (getOneTimeUsedDates(entryIndex).has(dateEntry.date)) {
      dateEntry.date = getNextAvailableOneTimeDate(dateEntry.date, entryIndex);
      showScheduleValidationToast(
        "booking_validation_one_time_date_unique",
        "Each custom date can only be added once.",
      );
    }

    syncAvailabilityToForm();
  }

  function onOneTimeSlotChanged(entryIndex, slotIndex, changedField = null) {
    if (isScheduleLocked.value) return;
    const dateEntry = oneTimeDates.value[entryIndex];
    const slot = dateEntry?.slots?.[slotIndex];
    if (!dateEntry || !slot) return;

    const startMinutes = timeToMinutes(slot.startTime);
    const endMinutes = timeToMinutes(slot.endTime);
    if (
      changedField === "start"
      && startMinutes !== null
      && endMinutes !== null
      && endMinutes <= startMinutes
    ) {
      const nextEndTime = pickValidEndTime(dateEntry, slotIndex, slot.startTime, slot.endTime);
      if (nextEndTime) {
        slot.endTime = nextEndTime;
      }
    }

    if (doesOneTimeSlotConflict(dateEntry, slot, slotIndex)) {
      if (changedField === "start") {
        const nextEndTime = pickValidEndTime(dateEntry, slotIndex, slot.startTime, slot.endTime);
        if (nextEndTime) {
          slot.endTime = nextEndTime;
        }
      } else if (changedField === "end") {
        const nextStartTime = pickValidStartTime(dateEntry, slotIndex, slot.endTime, slot.startTime);
        if (nextStartTime) {
          slot.startTime = nextStartTime;
        }
      }

      if (doesOneTimeSlotConflict(dateEntry, slot, slotIndex)) {
        const nextSlot = getNextAvailableOneTimeSlot(dateEntry, slot.startTime, slot.endTime, slotIndex);
        if (nextSlot) {
          slot.startTime = nextSlot.startTime;
          slot.endTime = nextSlot.endTime;
        }
      }

      showScheduleValidationToast(
        "booking_validation_one_time_slot_unique",
        "Each custom time slot must be unique and cannot overlap another slot for that date.",
      );
    }

    syncAvailabilityToForm();
  }

  function toggleOneTimeSlotOffHours(entryIndex, slotIndex) {
    if (isScheduleLocked.value) return;
    const slot = oneTimeDates.value?.[entryIndex]?.slots?.[slotIndex];
    if (!slot) return;
    slot.offHours = !slot.offHours;
    syncAvailabilityToForm();
  }

  function removeOneTimeSlot(dateIndex, slotIndex) {
    if (isScheduleLocked.value) return;
    const dateEntry = oneTimeDates.value[dateIndex];
    if (!dateEntry) return;
    if (!Array.isArray(dateEntry.slots) || getTotalOneTimeSlotCount() <= 1) return;

    dateEntry.slots.splice(slotIndex, 1);
    syncAvailabilityToForm();
  }

  function onRepeatRuleChange(newRepeatRule = formData.value.repeatRule, oldRepeatRule = null) {
    if (oldRepeatRule === "doesNotRepeat" && newRepeatRule === "weekly") {
      formData.value.dateFrom = "";
      formData.value.dateTo = "";
    }

    if (oldRepeatRule === "doesNotRepeat" && newRepeatRule === "monthly") {
      if (!isIsoDate(formData.value.dateFrom) || formData.value.dateFrom < todayIsoDate) {
        formData.value.dateFrom = todayIsoDate;
      }
      formData.value.dateTo = "";
    }

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
    (newRepeatRule, oldRepeatRule) => {
      onRepeatRuleChange(newRepeatRule, oldRepeatRule);
      applyWeeklyRangeLocking();
    }
  );

  syncAvailabilityToForm();
</script>

  <template>
    <form ref="formRootRef" class="flex flex-col gap-6 relative px-2 md:px-4 lg:px-6">

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
                data-booking-validation-input-field="eventTitle"
                inputClass="px-3.5 text-gray-900 w-full text-base font-normal outline-none py-2.5 bg-white/30 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300" />
            </div>
            <div class="">
              <CustomDropdown
                v-model="formData.eventColorSkin"
                :options="colorOptions"
                layout="grid"
                placeholder="Choose Event Color"
                buttonClass="h-full bg-white/50 border-l pr-3 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 outline-none w-full"
                dropdownClass="w-full bg-white shadow-lg border border-gray-100 right-0 origin-top-right mt-0"
              >
                <!-- Trigger: Only show the selected color dot -->
                <template #trigger="{ selected }">
                  <div class="flex items-center justify-center p-2">
                    <div class="w-4 h-4 rounded-full shadow-sm" :style="{ backgroundColor: selected }"></div>
                  </div>
                </template>
              </CustomDropdown>
            </div>
          </div>
          <ValidationInlineWarning
            :messages="fieldValidationMessages('eventTitle')"
            field="eventTitle"
            spacing-class="-mt-2"
          />
          <QuillEditor
            v-model="formData.eventDescription"
            :placeholder="t('booking_event_description_placeholder')"
          />
          <div class="flex flex-col gap-1.5 w-full">
            <div class="flex flex-col gap-1.5">
              <div class="text-slate-700 text-xs font-normal leading-none mb-1.5">{{ t("booking_call_type") }}</div>
              <CustomDropdown
                v-model="formData.eventCallType"
                :options="callTypeOptions"
              />
            </div>
          </div>
          <div class="self-stretch flex flex-col justify-start items-start gap-1.5">
            <div class=""><span class="text-slate-700 text-xs font-normal leading-none">{{ t("booking_event_image") }} </span><span
                class="text-gray-500 text-xs italic font-normal leading-none ml-1">{{ t("common_optional") }}</span></div>
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

      <BookingSectionsWrapper v-if="!isGroupBooking" :title="t('booking_session_duration')" leftIcon="https://i.ibb.co/cSjDYSdk/Icon.png">
        <div class='flex flex-col gap-5'>
          <div class="flex items-center gap-2 mt-3 ">
            <BaseInput type="number" placeholder="" v-model="formData.duration"
              data-booking-validation-input-field="duration"
              inputClass="px-3.5 text-gray-900 placeholder:text-gray-900 w-full text-base font-normal outline-none py-2.5 bg-white/30 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300" />
            <div class=" text-black text-base font-medium leading-normal">{{ t("booking_minutes") }}</div>
          </div>
          <ValidationInlineWarning
            :messages="fieldValidationMessages('duration')"
            field="duration"
            spacing-class="-mt-3"
          />
          <div class="self-stretch flex flex-col justify-center items-start gap-2">
            <CheckboxGroup v-model="formData.allowLongerSessions" :label="t('booking_allow_longer_sessions')" :isOptional="true"
              checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[0.125rem] checked:[&::after]:border-b-[0.125rem] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
              labelClass="text-gray-700 text-base mt-[0.063rem] leading-normal" wrapperClass="flex items-center gap-2" />
            <div :class="['ml-6 transition-opacity duration-200',
                        !formData.allowLongerSessions ? 'opacity-50' : 'opacity-100']">
              <div class="w-full text-gray-500 text-sm font-medium leading-tight">{{ t("booking_maximum_session_allowed") }}</div>
              <div class="flex items-center gap-1.5 ">
                <div class="">
                  <BaseInput type="number" placeholder="" v-model="formData.maxSessionDuration"
                    data-booking-validation-input-field="maxSessionDuration"
                    :disabled="!formData.allowLongerSessions"
                    inputClass="px-3.5 w-44 text-gray-900 placeholder:text-gray-900 text-base font-normal outline-none py-2.5 bg-white/30 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 disabled:cursor-not-allowed" />
                </div>
                <div class="flex flex-col">
                  <div class="justify-center text-black text-base font-medium leading-normal">{{ t("booking_sessions") }}</div>
                  <div v-if="formData.duration && formData.maxSessionDuration" class="justify-center text-black text-xs font-medium leading-none">({{ t("booking_minutes_count", { count: `${formData.duration}x${formData.maxSessionDuration}` }) }})</div>
                </div>
              </div>
              <ValidationInlineWarning
                :messages="fieldValidationMessages('maxSessionDuration')"
                field="maxSessionDuration"
                spacing-class="mt-2"
              />
            </div>
          </div>
        </div>
        <ValidationInlineWarning
          :messages="fieldValidationMessages('offHourSurcharge')"
          field="offHourSurcharge"
          spacing-class="-mt-3"
        />
      </BookingSectionsWrapper>
      

      <template v-for="section in step1SectionOrder" :key="section">
        
      <BookingSectionsWrapper v-if="section === 'privatePricing'" :title="t('booking_pricing_settings')" leftIcon="https://i.ibb.co/F47R5CqG/Icon-1.png"
        leftIconClass="mt-[0.25rem]" accordionIcon="https://i.ibb.co/MD46QRZS/Frame-1410099649.png" :is-open="sectionsState.privatePricing"
        @toggle="toggleSection('privatePricing')">
        <div v-show="sectionsState.privatePricing" class="flex-1 inline-flex flex-col justify-start items-start gap-5 mt-4">
          <div class="flex flex-col justify-start items-start gap-1.5">
            <div class="justify-start text-gray-500 text-sm font-medium font-['Poppins'] leading-tight">
              {{ t("booking_base_price") }}
            </div>
            <div class="flex items-center gap-2">
              <BaseInput type="number" placeholder="" v-model="formData.basePrice"
                data-booking-validation-input-field="basePrice"
                inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300" />
              <div class="flex gap-2 items-center">
                <span class="text-black text-base font-medium font-['Poppins'] leading-normal">{{ t("common_tokens") }} </span><span
                  class="text-black text-sm font-normal font-['Poppins'] leading-tight">{{ t("booking_per_session") }}</span>
              </div>
            </div>
            <ValidationInlineWarning
              :messages="fieldValidationMessages('basePrice')"
              field="basePrice"
              spacing-class="mt-0.5"
            />
          </div>

          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <CheckboxGroup v-model="formData.enableLongerDiscount" :label="t('booking_enable_longer_session_discount')" :isOptional="true"
              checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[0.125rem] checked:[&::after]:border-b-[0.125rem] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
              labelClass="text-slate-700 text-base mt-[0.063rem] leading-normal"
              wrapperClass="flex items-center gap-2 mb-3" />

            <div class="self-stretch inline-flex justify-start items-start gap-2">
              <div class="w-6 h-6" />
              <div class="inline-flex flex-col justify-start items-start gap-2">
                <div :class="['inline-flex justify-end items-center gap-2',!formData.enableLongerDiscount? 'opacity-50':'opacity-100']">
                  <BaseInput type="number" placeholder="" v-model="formData.sessionMinimum"
                    data-booking-validation-input-field="sessionMinimum"
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
                  <BaseInput type="number" placeholder="" v-model="formData.longerSessionDiscountTokens"
                    data-booking-validation-input-field="longerSessionDiscountTokens"
                    :disabled="!formData.enableLongerDiscount"
                    inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:cursor-not-allowed" />
                  <div class="h-10 inline-flex flex-col justify-between items-start">
                    <div class="justify-center text-black text-base font-medium font-['Poppins'] leading-normal">
                      {{ t("booking_tokens_off_session_price") }}
                    </div>
                    <div v-if="formData.longerSessionDiscountTokens" class="justify-center text-black text-xs font-medium font-['Poppins'] leading-none">
                      ({{ t("booking_tokens_off_booking", { tokens: formData.longerSessionDiscountTokens }) }})
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <ValidationInlineWarning
              :messages="fieldValidationMessages(['sessionMinimum', 'longerSessionDiscountTokens'])"
              field="sessionMinimum"
              spacing-class="-mt-1"
            />
          </div>

          

          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <CheckboxGroup v-model="formData.enableFirstTimeDiscount" :label="t('booking_enable_first_time_discount_short')" :isOptional="true"
              checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[0.125rem] checked:[&::after]:border-b-[0.125rem] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
              labelClass="text-slate-700 text-base mt-[0.063rem] leading-normal"
              wrapperClass="flex items-center gap-2 mb-3" />

            <div class="self-stretch inline-flex justify-start items-start gap-2">
              <div class="w-6 h-10" />
              <div class="inline-flex flex-col justify-start items-start gap-2">
                <div :class="['inline-flex justify-end items-center gap-2',!formData.enableFirstTimeDiscount? 'opacity-50':'opacity-100']">
                  <BaseInput type="number" placeholder="" v-model="formData.firstTimeDiscountTokens"
                    data-booking-validation-input-field="firstTimeDiscountTokens"
                    :disabled="!formData.enableFirstTimeDiscount"
                    inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:cursor-not-allowed" />
                  <div class="h-10 inline-flex flex-col justify-between items-start">
                    <div class="justify-center text-black text-base font-medium font-['Poppins'] leading-normal">
                      {{ t("booking_off_entire_session") }}
                    </div>
                    <div v-if="formData.firstTimeDiscountTokens" class="justify-center text-black text-xs font-medium font-['Poppins'] leading-none">
                      ({{ t("booking_tokens_off_booking", { tokens: formData.firstTimeDiscountTokens }) }})
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <ValidationInlineWarning
              :messages="fieldValidationMessages('firstTimeDiscountTokens')"
              field="firstTimeDiscountTokens"
              spacing-class="-mt-1"
            />
          </div>

          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <div class="flex gap-2 items-center">
              <CheckboxGroup v-model="formData.enableBookingFee" :label="t('booking_enable_booking_fee')" :isOptional="true"
                checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[0.125rem] checked:[&::after]:border-b-[0.125rem] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                labelClass="text-slate-700 text-base mt-[0.063rem] leading-normal"
                wrapperClass="flex items-center gap-2" />
              <TooltipIcon :text="t('booking_booking_fee_tooltip')" />
            </div>

            <div class="inline-flex justify-start items-start gap-2">
              <div class="w-6 h-10" />
              <div class="inline-flex flex-col justify-center items-start gap-2">
                <div :class="['inline-flex justify-start items-center gap-2',!formData.enableBookingFee? 'opacity-50':'opacity-100']">
                  <BaseInput type="number" placeholder="" v-model="formData.bookingFee"
                    data-booking-validation-input-field="bookingFee"
                    :disabled="!formData.enableBookingFee"
                    inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:cursor-not-allowed" />
                  <div class="w-14 justify-start text-black text-base font-medium font-['Poppins'] leading-normal">
                    {{ t("common_tokens") }}
                  </div>
                </div>
              </div>
            </div>
            <ValidationInlineWarning
              :messages="fieldValidationMessages('bookingFee')"
              field="bookingFee"
              spacing-class="-mt-1"
            />
          </div>
          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <div class="self-stretch flex flex-col justify-center items-start gap-2">
              <div class="flex gap-2 items-center">
                <CheckboxGroup v-model="formData.allowInstantBooking" :label="t('booking_allow_instant_booking')" :isOptional="true"
                  checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[0.125rem] checked:[&::after]:border-b-[0.125rem] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                  labelClass="text-slate-700 mt-[0.063rem] text-base leading-normal"
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

                  <CheckboxGroup v-model="formData.disableChatBeforeCall" :label="t('booking_disable_chat_before_call')" :isOptional="true"
                    checkboxClass="m-0 border border-checkboxBorder [appearance:none] w-[0.75rem] h-[0.75rem] rounded bg-transparent relative cursor-pointer checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.2rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[0.125rem] checked:[&::after]:border-b-[0.125rem] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45 "
                    labelClass="text-slate-700 text-base leading-normal"
                    wrapperClass="flex items-center gap-2 mb-2 mt-2" />
                  
                  <!-- New Toggle: Allow emoji -->
                  <div v-if="formData.disableChatBeforeCall" class="ml-5">
                    <CheckboxGroup v-model="formData.disableChatAllowEmoji" label="Allow reply with emoji"
                      checkboxClass="m-0 border border-checkboxBorder [appearance:none] w-[0.75rem] h-[0.75rem] rounded bg-transparent relative cursor-pointer checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.2rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[0.125rem] checked:[&::after]:border-b-[0.125rem] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45 "
                      labelClass="text-slate-700 text-sm leading-normal italic"
                      wrapperClass="flex items-center gap-2 mb-2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <div class="self-stretch flex flex-col justify-center items-start gap-1">
              <div class="flex gap-2 items-center">
                <CheckboxGroup v-model="formData.enableRescheduleFee" :label="t('booking_enable_reschedule_fee')" :isOptional="true"
                  checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[0.125rem] checked:[&::after]:border-b-[0.125rem] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                  labelClass="text-slate-700 text-base mt-[0.063rem] leading-normal"
                  wrapperClass="flex items-center gap-2" />

                <TooltipIcon :text="t('booking_reschedule_fee_tooltip')" />
              </div>

              <div class="self-stretch inline-flex justify-start items-start gap-2">
                <div class="w-6 h-10" />
                <div :class="['inline-flex flex-col justify-start items-start',!formData.enableRescheduleFee ? 'opacity-50':'opacity-100']">
                  <div class="inline-flex justify-end items-center gap-2">
                    <BaseInput type="number" placeholder="" v-model="formData.rescheduleFee"
                      data-booking-validation-input-field="rescheduleFee"
                      :disabled="!formData.enableRescheduleFee"
                      inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:cursor-not-allowed" />

                    <div class="justify-center text-slate-700 text-base font-normal font-['Poppins'] leading-normal">
                      {{ t("common_tokens") }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <ValidationInlineWarning
              :messages="fieldValidationMessages('rescheduleFee')"
              field="rescheduleFee"
              spacing-class="-mt-1"
            />
          </div>
          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <div class="self-stretch flex flex-col justify-center items-start gap-1">
              <div class="flex gap-2 items-center">
                <CheckboxGroup v-model="formData.enableCancellationFee" :label="t('booking_enable_cancellation_fee')" :isOptional="true"
                  checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[0.125rem] checked:[&::after]:border-b-[0.125rem] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                  labelClass="text-slate-700 text-base mt-[0.063rem] leading-normal"
                  wrapperClass="flex items-center gap-2" />

                <TooltipIcon :text="t('booking_cancellation_fee_tooltip')" />
              </div>
              <div :class="['self-stretch inline-flex justify-start items-start gap-2',!formData.enableCancellationFee ? 'opacity-50':'opacity-100']">
                <div class="w-6 h-10" />
                <div class="inline-flex flex-col justify-start items-start">
                  <div class="inline-flex justify-end items-center gap-2">
                    <BaseInput type="number" placeholder="15" v-model="formData.cancellationFee"
                      data-booking-validation-input-field="cancellationFee"
                      :disabled="!formData.enableCancellationFee"
                      inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed" />
                    <div class="justify-center text-slate-700 text-base font-normal font-['Poppins'] leading-normal">
                      {{ t("common_tokens") }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <ValidationInlineWarning
              :messages="fieldValidationMessages(['cancellationFee', 'advanceVoid', 'advanceCancelWindowUnit'])"
              field="cancellationFee"
              spacing-class="-mt-1"
            />

            <div :class="['ml-7 _flex hidden flex-col justify-start items-start gap-2',!formData.enableCancellationFee ? 'opacity-50 pointer-events-none':'opacity-100']">
              <CheckboxGroup v-model="formData.allowAdvanceCancellation"
                :label="t('booking_allow_advance_cancellation')"
                checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[0.125rem] checked:[&::after]:border-b-[0.125rem] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                labelClass="text-slate-700 text-base mt-[0.063rem] leading-normal"
                wrapperClass="flex items-center gap-2" />
              <div :class="['flex items-center gap-2', !formData.allowAdvanceCancellation ? 'opacity-50':'opacity-100']">
                <div class="flex items-center">
                  <BaseInput type="number" placeholder="15" v-model="formData.advanceVoid"
                    data-booking-validation-input-field="advanceVoid"
                    :disabled="!formData.allowAdvanceCancellation"
                    inputClass="bg-white/50 w-24 px-3 py-2 rounded-tl-sm outline-none border-b border-gray-300 disabled:cursor-not-allowed border-r" />
                </div>
                  <CustomDropdown
                    v-model="formData.advanceCancelWindowUnit"
                    :options="timeUnitOptions"
                    data-booking-validation-input-field="advanceCancelWindowUnit"
                    tabindex="0"
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

      <BookingSectionsWrapper class="border-t border-[#D0D5DD] pt-6" v-else-if="section === 'groupPricing'" :title="t('booking_pricing_settings')" leftIcon="https://i.ibb.co/F47R5CqG/Icon-1.png"
        leftIconClass="mt-[4px]" accordionIcon="https://i.ibb.co/MD46QRZS/Frame-1410099649.png" :is-open="sectionsState.groupPricing"
        @toggle="toggleSection('groupPricing')">
        <div
          v-show="sectionsState.groupPricing"
          class="relative group/pricing-lock w-full mt-4"
          data-test="group-pricing-section"
          :aria-disabled="isPricingLocked ? 'true' : 'false'"
        >
        <div
          :class="[
            'flex-1 inline-flex flex-col justify-start items-start gap-5',
            isPricingLocked ? 'pointer-events-none select-none opacity-50' : '',
          ]"
        >
          <div class="flex flex-col justify-start items-start gap-2 w-full">
            <div class="justify-start text-slate-700 text-base font-normal leading-normal">
              {{ t("booking_group_charge_question") }}
            </div>
            <CustomDropdown
              v-model="formData.priceSetting"
              :options="groupPricingOptions"
              :disabled="isPricingLocked"
              :buttonClass="'bg-white/50 w-full px-4 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 flex items-center justify-between cursor-pointer select-none'"
            />
          </div>

          <template v-if="formData.priceSetting === 'fixedPricePerUser'">
            <div class="flex flex-col justify-start items-start gap-1.5">
              <div class="justify-start text-gray-500 text-sm font-medium leading-tight">
                {{ t("booking_group_event_price") }}
              </div>
              <div class="flex items-center gap-2">
                <BaseInput type="number" placeholder="" v-model="formData.basePrice"
                  data-booking-validation-input-field="basePrice"
                  :disabled="isPricingLocked"
                  inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300" />
                <div class="text-black text-base font-medium leading-normal">{{ t("common_tokens") }}</div>
              </div>
              <ValidationInlineWarning
                :messages="fieldValidationMessages('basePrice')"
                field="basePrice"
                spacing-class="mt-0.5"
              />
            </div>

            <div class="self-stretch flex flex-col justify-center items-start gap-3">
              <CheckboxGroup v-model="formData.enableLongerDiscount" :label="t('booking_enable_discount_recurring')"
                :disabled="isPricingLocked"
                checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[0.125rem] checked:[&::after]:border-b-[0.125rem] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                labelClass="text-slate-700 text-base mt-[0.063rem] leading-normal"
                wrapperClass="flex items-center gap-2" />

              <div class="self-stretch inline-flex justify-start items-start gap-2">
                <div class="w-6 h-6" />
                <div class="inline-flex flex-col justify-start items-start gap-2">
                  <div :class="['inline-flex justify-end items-center gap-2', !formData.enableLongerDiscount ? 'opacity-50' : 'opacity-100']">
                    <BaseInput type="number" placeholder="" v-model="formData.discountEventsCount"
                      data-booking-validation-input-field="discountEventsCount"
                      :disabled="isPricingLocked || !formData.enableLongerDiscount"
                      inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:cursor-not-allowed" />
                    <div class="justify-center text-black text-base font-medium leading-normal">
                      {{ t("booking_group_events_minimum") }}
                    </div>
                  </div>
                  <div :class="['inline-flex justify-end items-center gap-2', !formData.enableLongerDiscount ? 'opacity-50' : 'opacity-100']">
                    <BaseInput type="number" placeholder="" v-model="formData.discountPercentage"
                      data-booking-validation-input-field="discountPercentage"
                      :disabled="isPricingLocked || !formData.enableLongerDiscount"
                      inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:cursor-not-allowed" />
                    <div class="justify-center text-black text-base font-medium leading-normal">
                      {{ t("booking_percent_off_base_price") }}
                    </div>
                  </div>
                </div>
              </div>
              <ValidationInlineWarning
                :messages="fieldValidationMessages(['discountEventsCount', 'discountPercentage'])"
                field="discountEventsCount"
                spacing-class="-mt-1"
              />
            </div>
          </template>

          <template v-else>
            <div class="flex flex-col justify-start items-start gap-1.5">
              <div class="justify-start text-gray-500 text-sm font-medium leading-tight">
                {{ t("booking_group_event_goals") }}
              </div>
              <div class="flex items-center gap-2">
                <BaseInput type="number" placeholder="" v-model="formData.eventGoalTokens"
                  data-booking-validation-input-field="eventGoalTokens"
                  :disabled="isPricingLocked"
                  inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300" />
                <div class="text-black text-base font-medium leading-normal">{{ t("common_tokens") }}</div>
              </div>
              <ValidationInlineWarning
                :messages="fieldValidationMessages('eventGoalTokens')"
                field="eventGoalTokens"
                spacing-class="mt-0.5"
              />
            </div>

            <div class="self-stretch flex flex-col justify-center items-start gap-3">
              <CheckboxGroup v-model="formData.enableMinContributionPerUser" :label="t('booking_group_min_contribution_per_user')"
                :disabled="isPricingLocked"
                checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[0.125rem] checked:[&::after]:border-b-[0.125rem] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                labelClass="text-slate-700 text-base mt-[0.063rem] leading-normal"
                wrapperClass="flex items-center gap-2" />
              <div class="inline-flex justify-start items-center gap-2">
                <div class="w-6 h-6" />
                <BaseInput type="number" placeholder="" v-model="formData.minContributionPerUser"
                  data-booking-validation-input-field="minContributionPerUser"
                  :disabled="isPricingLocked || !formData.enableMinContributionPerUser"
                  inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed" />
                <div class="text-black text-base font-medium leading-normal">{{ t("common_tokens") }}</div>
              </div>
              <ValidationInlineWarning
                :messages="fieldValidationMessages('minContributionPerUser')"
                field="minContributionPerUser"
                spacing-class="-mt-1"
              />
            </div>

            <div class="flex flex-col justify-start items-start gap-2 w-full">
              <div class="justify-start text-slate-700 text-base font-normal leading-normal">
                {{ t("booking_group_goal_not_met_label") }}
              </div>
              <CustomDropdown
                v-model="formData.goalNotMet"
                :options="groupGoalNotMetOptions"
                :disabled="isPricingLocked"
                :buttonClass="'bg-white/50 w-full px-4 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 flex items-center justify-between cursor-pointer select-none'"
              />
            </div>
          </template>

          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <div class="flex gap-2 items-center">
              <CheckboxGroup
                v-model="formData.enableCancellationFee"
                :label="t(formData.priceSetting === 'fixedPricePerUser' ? 'booking_group_cancellation_fee' : 'booking_group_refund_before_event_start')"
                :disabled="isPricingLocked"
                checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[0.125rem] checked:[&::after]:border-b-[0.125rem] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                labelClass="text-slate-700 text-base mt-[0.063rem] leading-normal"
                wrapperClass="flex items-center gap-2" />
              <TooltipIcon v-if="!isPricingLocked" :text="t('booking_cancellation_fee_tooltip')" />
            </div>
            <div :class="['inline-flex justify-start items-center gap-2', !formData.enableCancellationFee ? 'opacity-50' : 'opacity-100']">
              <div class="w-6 h-6" />
              <BaseInput type="number" placeholder="" v-model="formData.cancellationFee"
                data-booking-validation-input-field="cancellationFee"
                :disabled="isPricingLocked || !formData.enableCancellationFee"
                inputClass="bg-white/50 w-28 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:cursor-not-allowed" />
              <div class="justify-center text-slate-700 text-base font-normal leading-normal">
                {{ t("booking_group_minimum_charge") }}
              </div>
            </div>
            <ValidationInlineWarning
              :messages="fieldValidationMessages('cancellationFee')"
              field="cancellationFee"
              spacing-class="-mt-1"
            />
          </div>

          <div class="self-stretch flex flex-col justify-start items-start gap-3">
            <CheckboxGroup v-model="formData.allowAdvanceCancellation" :label="t('booking_group_cancel_advance_void_fee')"
              :disabled="isPricingLocked"
              checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[0.125rem] checked:[&::after]:border-b-[0.125rem] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
              labelClass="text-slate-700 text-base mt-[0.063rem] leading-normal"
              wrapperClass="flex items-center gap-2" />
            <div :class="['flex items-center gap-2', !formData.allowAdvanceCancellation ? 'opacity-50 pointer-events-none' : 'opacity-100']">
              <div class="w-6 h-6" />
              <BaseInput type="number" placeholder="" v-model="formData.advanceVoid"
                data-booking-validation-input-field="advanceVoid"
                :disabled="isPricingLocked || !formData.allowAdvanceCancellation"
                inputClass="bg-white/50 w-24 px-3 py-2 rounded-tl-sm outline-none border-b border-gray-300 disabled:cursor-not-allowed border-r" />
              <CustomDropdown
                v-model="formData.advanceCancelWindowUnit"
                :options="timeUnitOptions"
                :disabled="isPricingLocked || !formData.allowAdvanceCancellation"
                data-booking-validation-input-field="advanceCancelWindowUnit"
                tabindex="0"
                :buttonClass="`bg-white/50 w-28 px-3 py-2 rounded-tr-sm outline-none border-b border-gray-300 flex items-center justify-between cursor-pointer select-none ${isPricingLocked || !formData.allowAdvanceCancellation ? 'pointer-events-none disabled:cursor-not-allowed' : ''}`"
              />
              <div class="justify-center text-slate-700 text-base font-normal leading-normal whitespace-nowrap">
                {{ t("booking_group_before_event_start") }}
              </div>
            </div>
            <ValidationInlineWarning
              :messages="fieldValidationMessages(['advanceVoid', 'advanceCancelWindowUnit'])"
              field="advanceVoid"
              spacing-class="-mt-1"
            />
          </div>
        </div>
          <div
            v-if="isPricingLocked"
            class="pointer-events-none absolute left-0 top-2 z-20 max-w-[20rem] rounded bg-slate-900 px-3 py-2 text-xs font-medium leading-4 text-white opacity-0 shadow-lg transition-opacity group-hover/pricing-lock:opacity-100"
            data-test="group-pricing-lock-tooltip"
          >
            {{ pricingLockTooltip }}
          </div>
        </div>
      </BookingSectionsWrapper>

      <BookingSectionsWrapper v-show="sectionsState.groupPricing || sectionsState.privatePricing"  v-else-if="section === 'offHourSurcharge'" :title="t('booking_off_hour_surcharge')" leftIcon="https://i.ibb.co/k6kzjyCp/Icon-2.png"
        tooltipText="Approval will be required for bookings made during this period." :isOptional="true">
        <div :class="['self-stretch inline-flex justify-start items-center gap-2 mt-5', !formData.addOffHourSurcharge ? 'opacity-50':'opacity-100']">
          <CheckboxGroup v-model="formData.addOffHourSurcharge" :label="t('common_add')"
            checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[0.125rem] checked:[&::after]:border-b-[0.125rem] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
            labelClass="text-gray-700 text-base mt-[0.063rem] leading-normal" wrapperClass="flex items-center gap-2" />
          <div class="flex-1 inline-flex flex-col justify-start items-start">
            <div class="inline-flex justify-end items-center gap-2">
              <BaseInput type="number" placeholder="" v-model="formData.offHourSurcharge"
                data-booking-validation-input-field="offHourSurcharge"
                :disabled="!formData.addOffHourSurcharge"
                inputClass="px-3.5 w-44 text-gray-900 placeholder:text-gray-900 text-base font-normal outline-none py-2.5 bg-white/30 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed" />
              <div class="h-10 inline-flex flex-col justify-between items-start">
                <div class="justify-center text-black text-base font-medium leading-normal">{{ t("booking_percent_from_base_price") }}</div>
                <div v-if="offHourSurchargePreviewTokens > 0" class="justify-center text-black text-xs font-medium leading-none">({{ t("booking_tokens_per_session", { tokens: offHourSurchargePreviewTokens }) }})</div>
              </div>
            </div>
          </div>
        </div>
      </BookingSectionsWrapper>

      <BookingSectionsWrapper class="border-t border-[#D0D5DD] pt-6" v-else-if="section === 'calendarAvailability'" :title="t(isGroupBooking ? 'booking_event_date_time' : 'booking_calendar_availability')" leftIcon="https://i.ibb.co/Ldw310vp/Icon.png" accordionIcon="https://i.ibb.co/MD46QRZS/Frame-1410099649.png" :is-open="sectionsState.calendarAvailability"
        @toggle="toggleSection('calendarAvailability')">
        <div
          v-show="sectionsState.calendarAvailability"
          class="relative group/schedule-lock w-full mt-5"
          data-test="event-date-time-section"
          :aria-disabled="isScheduleLocked ? 'true' : 'false'"
        >
        <div
          :class="[
            'w-full flex flex-col gap-5',
            isScheduleLocked ? 'pointer-events-none select-none opacity-50' : '',
          ]"
        >
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
                  <div class="justify-start text-gray-500 text-sm font-medium font-['Poppins'] leading-tight">
                    {{ t("booking_duration") }} <span class="text-gray-500 text-xs italic font-normal font-['Poppins'] leading-none">{{ t("common_optional") }}</span>
                  </div>
                  <div class="relative w-full bg-white/75 rounded-tl-sm rounded-tr-sm border-b border-gray-300">
                    <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <img :src="calendarIcon" alt="" class="w-5 h-5 opacity-50" />
                    </div>
                    <div v-if="!formData.dateFrom" class="absolute inset-y-0 left-10 flex items-center pointer-events-none text-gray-900">
                     From
                    </div>
                    <input
                      type="date"
                      v-model="formData.dateFrom"
                      data-booking-validation-input-field="dateFrom"
                      :min="todayIsoDate"
                      :max="getDateFromMax()"
                      class="bg-transparent h-10 w-full pl-10 pr-3 py-2 outline-none relative [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      :class="[!formData.dateFrom ? 'text-transparent [&::-webkit-datetime-edit]:text-transparent' : 'text-gray-900 [&::-webkit-datetime-edit]:text-gray-900']"
                    />
                  </div>
                </div>
              </div>

              <div class="flex-1 inline-flex flex-col justify-start items-start gap-1.5">
                <div class="self-stretch flex flex-col justify-start items-start gap-1.5">
                  <!-- <div class="justify-start text-gray-500 text-sm font-medium font-['Poppins'] leading-tight">
                    {{ t("booking_end_date") }} <span class="text-gray-500 text-xs italic font-normal font-['Poppins'] leading-none">{{ t("common_optional") }}</span>
                  </div> -->
                  <div class="relative w-full bg-white/75 rounded-tl-sm rounded-tr-sm border-b border-gray-300">
                    <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <img :src="calendarIcon" alt="" class="w-5 h-5 opacity-50" />
                    </div>
                    <div v-if="!formData.dateTo" class="absolute inset-y-0 left-10 flex items-center pointer-events-none text-gray-900">
                     To
                    </div>
                    <input
                      type="date"
                      v-model="formData.dateTo"
                      :min="getDateToMin()"
                      class="bg-transparent h-10 w-full pl-10 pr-3 py-2 outline-none relative [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      :class="[!formData.dateTo ? 'text-transparent [&::-webkit-datetime-edit]:text-transparent' : 'text-gray-900 [&::-webkit-datetime-edit]:text-gray-900']"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div v-if="dateRangeMessage" class="text-xs text-amber-600 mt-1">
              {{ dateRangeMessage }}
            </div>
            <ValidationInlineWarning
              :messages="fieldValidationMessages('dateFrom')"
              field="dateFrom"
              spacing-class="-mt-1"
            />
          </div>


          <div v-if="formData.repeatRule === 'weekly'" class="flex flex-col gap-4 w-full" data-booking-validation-input-field="weeklyAvailability" tabindex="0">
            <ValidationInlineWarning
              :messages="fieldValidationMessages('weeklyAvailability')"
              field="weeklyAvailability"
              spacing-class="-mt-2"
            />

            <div v-for="(day, index) in weekDays" :key="index"
              class="self-stretch inline-flex justify-start items-start gap-3"
              :class="{
                'items-center min-h-10 gap-3': day.unavailable,
                'opacity-60': isWeeklyDayLocked(day.key || day.name),
              }">

              <div class="justify-start text-gray-500 text-base font-normal font-['Poppins'] leading-normal"
                :class="day.unavailable ? 'w-12' : 'w-10 h-10 flex items-center w-12'">
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
                  :title="isScheduleLocked ? null : t('booking_add_availability')">
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
                          :option-factory="() => getWeeklyStartOptions(index, sIdx)"
                          :searchable="true"
                          :searchPlaceholder="timeSearchPlaceholder"
                          :disabled="isWeeklyDayLocked(day.key || day.name)"
                          @update:modelValue="onWeeklySlotChanged(index, sIdx, 'start')"
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
                        :options="endTimeOptions"
                        :option-factory="() => getWeeklyEndOptions(index, sIdx)"
                        :searchable="true"
                        :searchPlaceholder="timeSearchPlaceholder"
                        :disabled="isWeeklyDayLocked(day.key || day.name)"
                        @update:modelValue="onWeeklySlotChanged(index, sIdx, 'end')"
                        buttonClass="self-stretch px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 outline-none text-gray-900 text-base font-normal font-['Poppins'] leading-normal w-full"
                        dropdownClass="max-h-60 overflow-y-auto w-full z-50 bg-white"
                      />
                    </div>

                    <div class="pl-1 flex justify-start items-center gap-2">
                      <span v-if="isScheduleLocked" class="flex items-center justify-center">
                        <button type="button"
                          class="w-6 h-6 rounded-full text-gray-600 flex items-center justify-center opacity-40 cursor-not-allowed hover:bg-transparent"
                          disabled>
                          <img :src="minusIcon" alt="" />
                        </button>
                      </span>
                      <TooltipIcon v-else :text="t('booking_remove_availability')" wrapperClass="flex items-center justify-center" tooltipClass="top-4">
                        <button type="button" @click="removeWeeklySlot(index, sIdx)"
                          class="w-6 h-6 rounded-full text-gray-600 flex items-center justify-center hover:bg-gray-100"
                          :disabled="isWeeklyDayLocked(day.key || day.name) || getTotalWeeklySlotCount() <= 1"
                          :class="{ 'opacity-40 cursor-not-allowed hover:bg-transparent': isWeeklyDayLocked(day.key || day.name) || getTotalWeeklySlotCount() <= 1 }">
                          <img :src="minusIcon" alt="" />
                        </button>
                      </TooltipIcon>
                      <span v-if="isScheduleLocked" class="flex items-center justify-center">
                        <button type="button"
                          class="w-6 h-6 rounded-full text-gray-600 flex items-center justify-center opacity-40 cursor-not-allowed hover:bg-transparent"
                          disabled>
                          <img :src="plusIcon" alt="" />
                        </button>
                      </span>
                      <TooltipIcon v-else :text="t('booking_add_period_day')" wrapperClass="flex items-center justify-center" tooltipClass="top-4 translate-x-[-80%]">
                        <button type="button" @click="addWeeklySlot(index)"
                          class="w-6 h-6 rounded-full text-gray-600 flex items-center justify-center hover:bg-gray-100"
                          :disabled="isWeeklyDayLocked(day.key || day.name)"
                          :class="{ 'opacity-40 cursor-not-allowed hover:bg-transparent': isWeeklyDayLocked(day.key || day.name) }">
                          <img :src="plusIcon" alt="" />
                        </button>
                      </TooltipIcon>
                      <span v-if="isScheduleLocked && formData.repeatRule === 'weekly'" class="flex items-center justify-center">
                        <button type="button"
                          class="w-6 h-6 rounded-full flex items-center justify-center opacity-40 cursor-not-allowed hover:bg-transparent"
                          disabled>
                          <img :src="slot.offHours ? cloudMoonPinkIcon : cloudMoonIcon" alt="" />
                        </button>
                      </span>
                      <TooltipIcon v-else-if="formData.repeatRule === 'weekly'" :text="t('booking_mark_off_hours')" wrapperClass="flex items-center justify-center" tooltipClass="top-4 translate-x-[-80%]">
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

          <div v-if="formData.repeatRule === 'monthly'" class="flex flex-col gap-4 w-full" data-booking-validation-input-field="monthlyAvailability" tabindex="0">
            <ValidationInlineWarning
              :messages="fieldValidationMessages('monthlyAvailability')"
              field="monthlyAvailability"
              spacing-class="-mt-2"
            />
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
                    :option-factory="() => getMonthlyStartOptions(slotIndex)"
                    :searchable="true"
                    :searchPlaceholder="timeSearchPlaceholder"
                    @update:modelValue="onMonthlySlotChanged(slotIndex, 'start')"
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
                  :options="endTimeOptions"
                  :option-factory="() => getMonthlyEndOptions(slotIndex)"
                  :searchable="true"
                  :searchPlaceholder="timeSearchPlaceholder"
                  @update:modelValue="onMonthlySlotChanged(slotIndex, 'end')"
                  buttonClass="self-stretch px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 outline-none text-gray-900 text-base font-normal font-['Poppins'] leading-normal w-full"
                  dropdownClass="max-h-60 overflow-y-auto w-full z-50 bg-white"
                />
              </div>

              <div class="pl-1 flex justify-start items-center gap-2">
              <span v-if="isScheduleLocked" class="flex items-center justify-center">
                <button
                  type="button"
                  class="w-6 h-6 rounded-full text-gray-600 flex items-center justify-center opacity-40 cursor-not-allowed hover:bg-transparent"
                  disabled
                >
                  <img :src="minusIcon" alt="" />
                </button>
              </span>
              <TooltipIcon v-else :text="t('booking_remove_availability')" wrapperClass="flex items-center justify-center" tooltipClass="top-4">
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
                <span v-if="isScheduleLocked" class="flex items-center justify-center">
                <button
                  type="button"
                  class="w-6 h-6 rounded-full text-gray-600 flex items-center justify-center opacity-40 cursor-not-allowed hover:bg-transparent"
                  disabled
                >
                  <img :src="plusIcon" alt="" />
                </button>
                </span>
                <TooltipIcon v-else :text="t('booking_add_monthly_period')" wrapperClass="flex items-center justify-center" tooltipClass="top-4 translate-x-[-80%]">
                <button
                  type="button"
                  @click="addMonthlySlot()"
                  class="w-6 h-6 rounded-full text-gray-600 flex items-center justify-center hover:bg-gray-100"
                  :title="t('booking_add_monthly_period')"
                >
                  <img :src="plusIcon" alt="" />
                </button>
                </TooltipIcon>
                <span v-if="isScheduleLocked" class="flex items-center justify-center">
                <button
                  type="button"
                  class="w-6 h-6 rounded-full flex items-center justify-center opacity-40 cursor-not-allowed hover:bg-transparent"
                  disabled
                >
                  <img :src="slot.offHours ? cloudMoonPinkIcon : cloudMoonIcon" alt="" />
                </button>
                </span>
                <TooltipIcon v-else :text="t('booking_mark_off_hours')" wrapperClass="flex items-center justify-center" tooltipClass="top-4 translate-x-[-80%]">
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

          <div v-if="formData.repeatRule === 'doesNotRepeat'" class="flex flex-col gap-4 w-full" data-booking-validation-input-field="oneTimeAvailability" tabindex="0">
            <ValidationInlineWarning
              :messages="fieldValidationMessages('oneTimeAvailability')"
              field="oneTimeAvailability"
              spacing-class="-mt-2"
            />
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
                    @change="onOneTimeDateChanged(entryIndex)"
                    :min="getOneTimeDateMin()"
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
                    :option-factory="() => getOneTimeStartOptions(entry, slotIndex)"
                    :searchable="true"
                    :searchPlaceholder="timeSearchPlaceholder"
                    @update:modelValue="onOneTimeSlotChanged(entryIndex, slotIndex, 'start')"
                    buttonClass="flex-1 px-3 py-2 bg-white/50 rounded-tl-sm rounded-tr-sm border-b border-gray-300 outline-none w-full h-full"
                    dropdownClass="max-h-60 overflow-y-auto w-full z-50 bg-white min-w-[max-content]"
                  />
                  <div class="text-gray-500">-</div>
                  <CustomDropdown
                    v-model="slot.endTime"
                    :options="endTimeOptions"
                    :option-factory="() => getOneTimeEndOptions(entry, slotIndex)"
                    :searchable="true"
                    :searchPlaceholder="timeSearchPlaceholder"
                    @update:modelValue="onOneTimeSlotChanged(entryIndex, slotIndex, 'end')"
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
                  <span v-if="isScheduleLocked" class="flex items-center justify-center">
                    <button
                      type="button"
                      class="w-6 h-6 rounded-full flex items-center justify-center opacity-40 cursor-not-allowed hover:bg-transparent"
                      disabled
                    >
                      <img :src="slot.offHours ? cloudMoonPinkIcon : cloudMoonIcon" alt="" />
                    </button>
                  </span>
                  <TooltipIcon v-else :text="t('booking_mark_off_hours')" wrapperClass="flex items-center justify-center" tooltipClass="top-4 translate-x-[-80%]">
                    <button
                      type="button"
                      @click="toggleOneTimeSlotOffHours(entryIndex, slotIndex)"
                      class="w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-100"
                      :title="t('booking_mark_off_hours')"
                    >
                      <img :src="slot.offHours ? cloudMoonPinkIcon : cloudMoonIcon" alt="" />
                    </button>
                  </TooltipIcon>
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
          <div
            v-if="isScheduleLocked"
            class="pointer-events-none absolute left-0 top-2 z-20 max-w-[20rem] rounded bg-slate-900 px-3 py-2 text-xs font-medium leading-4 text-white opacity-0 shadow-lg transition-opacity group-hover/schedule-lock:opacity-100"
            data-test="event-date-time-lock-tooltip"
          >
            {{ scheduleLockTooltip }}
          </div>
        </div>
      </BookingSectionsWrapper>
      </template>

      <template v-if="!isGroupBooking">
        <div class="w-full bg-[#D0D5DD] h-[0.063rem]"></div>

        <BookingSectionsWrapper :title="t('booking_call_settings')" leftIcon="https://i.ibb.co/xq0ZdVmP/Icon.png"
          accordionIcon="https://i.ibb.co/MD46QRZS/Frame-1410099649.png" :isOptional="true" :is-open="sectionsState.callSettings"
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
                  <OptionalLabel v-if="true" />
                </div>
                <CheckboxGroup v-model="formData.disableChatDuringCall" :label="t('booking_disable_chat_during_call')"
                  checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[0.125rem] checked:[&::after]:border-b-[0.125rem] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                  labelClass="text-slate-700 text-base mt-[0.063rem] leading-normal"
                  wrapperClass="flex items-center gap-2 mb-3 mt-2" />
                
                <!-- New Toggle: Allow emoji during call -->
                <div v-if="formData.disableChatDuringCall" class="ml-6">
                  <CheckboxGroup v-model="formData.disableChatDuringCallAllowEmoji" label="Allow reply with emoji"
                    checkboxClass="m-0 border border-checkboxBorder [appearance:none] w-[0.75rem] h-[0.75rem] rounded bg-transparent relative cursor-pointer checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.2rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[0.125rem] checked:[&::after]:border-b-[0.125rem] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45 "
                    labelClass="text-slate-700 text-sm leading-normal italic"
                    wrapperClass="flex items-center gap-2 mb-2" />
                </div>
              </div>
            </div>
            <div class="self-stretch flex flex-col justify-center items-start gap-3">
              <div class="self-stretch flex flex-col justify-center items-start gap-1">
                <div class="self-stretch inline-flex justify-start items-center gap-1 relative">
                  <div class="justify-start text-slate-700 text-base font-normal leading-normal relative">
                    {{ t("booking_fan_can_request_extend_session") }}
                    <TooltipIcon :text="t('booking_session_extension_tooltip')" 
                    tooltipClass="translate-x-[-90%] sm:translate-x-[-70%]" 
                    class="relative group inline-block mt-[0.125rem] ml-1   z-[9]  top-1" />
                     <OptionalLabel v-if="true" />
                  </div>
                </div>
                <div class="inline-flex justify-start items-center gap-2">
                  <CheckboxGroup v-model="formData.requestExtendSession"
                    checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[0.125rem] checked:[&::after]:border-b-[0.125rem] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                    labelClass="text-slate-700 text-base mt-[0.063rem] leading-normal"
                    wrapperClass="flex items-center gap-2" />
                  <div :class="['flex justify-start items-end gap-2',!formData.requestExtendSession ? 'opacity-50':'opacity-100']">
                  <BaseInput type="number" placeholder="" v-model="formData.extendSessionMax"
                    data-booking-validation-input-field="extendSessionMax"
                    :disabled="!formData.requestExtendSession"
                      inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:cursor-not-allowed" />
                    <div class="h-10 inline-flex flex-col justify-between items-start">
                      <div class="justify-center text-black text-base font-medium leading-normal">{{ t("booking_sessions_maximum") }}</div>
                      <div v-if="formData.duration && formData.extendSessionMax" class="justify-center text-black text-xs font-medium leading-none">({{ t("booking_minutes_count", { count: `${formData.duration}x${formData.extendSessionMax}` }) }})</div>
                    </div>
                  </div>
                </div>
              </div>
              <ValidationInlineWarning
                :messages="fieldValidationMessages('extendSessionMax')"
                field="extendSessionMax"
                spacing-class="-mt-1"
              />
            </div>
          </div>
        </BookingSectionsWrapper>
      </template>

      <div class="w-full bg-[#D0D5DD] h-[0.063rem]"></div>

      <BookingSectionsWrapper :title="t('booking_booking_settings')" leftIcon="https://i.ibb.co/nNmmvwnf/Icon-1.png"
        accordionIcon="https://i.ibb.co/MD46QRZS/Frame-1410099649.png" :isOptional="true" :is-open="sectionsState.bookingSettings"
        @toggle="toggleSection('bookingSettings')">
        <div v-show="sectionsState.bookingSettings" class="flex flex-col justify-start items-start gap-5 mt-5">
          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <div class="self-stretch flex flex-col justify-center items-start gap-1">
              <div class="self-stretch inline-flex justify-start items-center gap-1">
                <div class="justify-start text-gray-700 text-base font-normal leading-normal">{{ t("booking_call_reminder") }}</div>
                <OptionalLabel v-if="true" />
                <TooltipIcon :text="t('booking_reminders_tooltip')" />
              </div>
              <CheckboxGroup v-model="formData.setReminders" :label="t('booking_enable_reminder')"
                checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[0.125rem] checked:[&::after]:border-b-[0.125rem] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                labelClass="text-gray-700 text-base mt-[0.063rem] leading-normal"
                wrapperClass="flex items-center gap-2 mb-2 mt-2" />
              <div :class="['self-stretch flex flex-col justify-start items-start', !formData.setReminders ? 'opacity-50':'opacity-100']">
                <div class=" inline-flex justify-end items-center gap-2">
                  <div class="justify-center text-slate-700 text-base font-normal leading-normal">{{ t("booking_remind_me") }}</div>
                  <BaseInput type="number" placeholder="" v-model="formData.remindMeTime"
                    data-booking-validation-input-field="remindMeTime"
                    :disabled="!formData.setReminders"
                    inputClass="bg-white/50 w-40 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:cursor-not-allowed" />
                  <div class="flex-1 justify-center text-slate-700 text-base font-normal leading-normal truncate">{{ t("booking_minutes_before_a") }}</div>
                </div>
                <div class="inline-flex justify-end items-center gap-2">
                  <div class="justify-center text-slate-700 text-base font-normal leading-normal">{{ t("booking_scheduled_call") }}</div>
                </div>
              </div>
              <ValidationInlineWarning
                :messages="fieldValidationMessages('remindMeTime')"
                field="remindMeTime"
                spacing-class="-mt-1"
              />
            </div>
          </div>
          <div class="self-stretch flex flex-col justify-center items-start gap-3">
            <!-- <div class="flex gap-2">
              <CheckboxGroup v-model="formData.setBufferTime" :label="t('booking_set_buffer_time')"
                checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[0.125rem] checked:[&::after]:border-b-[0.125rem] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                labelClass="text-gray-700 text-base mt-[0.063rem] leading-normal"
                wrapperClass="flex items-center gap-2" />
              <TooltipIcon :text="t('booking_buffer_time_tooltip')" tooltipClass="translate-x-[-90%] sm:translate-x-[-90%]" class="ml-1 !absolute z-[9] md:top-1/2 md:-translate-y-1/2 right-auto md:-right-6" />
            </div> -->
            <div class="flex gap-2">
              <CheckboxGroup
                v-model="formData.setBufferTime"
                checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[0.125rem] checked:[&::after]:border-b-[0.125rem] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                labelClass="text-slate-700 text-base mt-[0.063rem] leading-normal flex items-center !inline-block relative"
                wrapperClass="flex items-center gap-2"
              >
                <template #label>
                  <span>{{ t("booking_set_buffer_time") }}</span>
                  <TooltipIcon
                  :text="t('booking_buffer_time_tooltip')"
                  tooltipClass="translate-x-[-80%] sm:translate-x-[-90%] max-w-[12.5rem]" 
                  class="ml-1 !mt-0 !absolute z-[9] md:top-1/2 md:-translate-y-1/2 right-auto md:-right-6"
                  />
                </template>
              </CheckboxGroup>
            </div>
            <div class="inline-flex justify-start items-center gap-2">
              <div class="w-6 h-6" />
              <div :class="['flex justify-start items-end gap-2',!formData.setBufferTime? 'opacity-50 pointer-events-none':'opacity-100']">
                <BaseInput type="number" placeholder="" v-model="formData.bufferTime"
                  data-booking-validation-input-field="bufferTime"
                  :disabled="!formData.setBufferTime"
                  inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:cursor-not-allowed" />
                <div class="w-44 inline-flex flex-col justify-start items-start gap-1.5">
                  <div class="self-stretch flex flex-col justify-start items-start gap-1.5">
                    <CustomDropdown :options="bufferUnitOptions" v-model="formData.bufferUnit" :disabled="!formData.setBufferTime" />
                  </div>
                </div>
              </div>
            </div>
            <ValidationInlineWarning
              :messages="fieldValidationMessages('bufferTime')"
              field="bufferTime"
              spacing-class="-mt-1"
            />
          </div>
          <div v-if="isGroupBooking" class="self-stretch flex flex-col justify-center items-start gap-3">
            <div class="flex gap-2 items-center">
              <CheckboxGroup v-model="formData.enableMaxAttendees" :label="t('booking_group_maximum_participants')" :isOptional="true"
                checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[0.125rem] checked:[&::after]:border-b-[0.125rem] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                labelClass="text-slate-700 text-base mt-[0.063rem] leading-normal"
                wrapperClass="flex items-center gap-2"/>
              <TooltipIcon :text="t('booking_group_maximum_participants_tooltip')" />
            </div>
            <div class="inline-flex justify-start items-center gap-2">
              <div class="w-6 h-6" />
              <BaseInput type="number" placeholder="" v-model="formData.maxAttendees"
                data-booking-validation-input-field="maxAttendees"
                :disabled="!formData.enableMaxAttendees"
                inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed" />
            </div>
            <ValidationInlineWarning
              :messages="fieldValidationMessages('maxAttendees')"
              field="maxAttendees"
              spacing-class="-mt-1"
            />
          </div>
          <div v-if="!isGroupBooking" class="self-stretch flex flex-col justify-center items-start gap-3">
            <!-- <div class="flex gap-2 items-center">
              <CheckboxGroup v-model="formData.setMaxBookings" :label="t('booking_set_max_bookings_day')"
                checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[0.125rem] checked:[&::after]:border-b-[0.125rem] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                labelClass="text-gray-700 text-base mt-[0.063rem] leading-normal"
                wrapperClass="flex items-center gap-2" />
              <TooltipIcon :text="t('booking_max_bookings_tooltip')"/>
            </div> -->

            <div class="flex gap-2">
              <CheckboxGroup
                v-model="formData.setMaxBookings"
                checkboxClass="m-0 border border-gray-300 [appearance:none] w-4 h-4 rounded bg-white relative cursor-pointer outline-none focus:outline-none checked:bg-checkbox checked:border-checkbox checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:top-[0.15rem] checked:[&::after]:w-[0.25rem] checked:[&::after]:h-[0.5rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[0.125rem] checked:[&::after]:border-b-[0.125rem] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                labelClass="text-slate-700 text-base mt-[0.063rem] leading-normal flex items-center !inline-block relative"
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
                  data-booking-validation-input-field="maxBookingsPerDay"
                  :disabled="!formData.setMaxBookings"
                  inputClass="bg-white/50 w-44 px-3 py-2 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed" />
              </div>
            </div>
            <ValidationInlineWarning
              :messages="fieldValidationMessages('maxBookingsPerDay')"
              field="maxBookingsPerDay"
              spacing-class="-mt-1"
            />
          </div>
        </div>
      </BookingSectionsWrapper>

      <div class="w-full bg-[#D0D5DD] h-[0.063rem] mb-[3.125rem] mt-[0.625rem]"></div>


    </form>
    <div :class="footerClass">
      <div class="md:hidden">
        <ButtonComponent
          @click="emit('preview-schedule')"
          :text="t('common_preview')"
          variant="polygonRight"
        />
      </div>
      <SoftDisabledBookingButton
        @click="goToNext"
        @tooltip-select="goToStep1ValidationField"
        :text="t('common_next')"
        variant="polygonLeft"
        :soft-disabled="nextButtonSoftDisabled"
        :tooltip-text="nextButtonTooltip"
        :tooltip-items="nextButtonTooltipItems"
        :rightIcon="'https://i.ibb.co/hx8ztZFf/svgviewer-png-output-8.webp'" :rightIconClass="`
          w-6 h-6 transition duration-200
          filter brightness-0 invert-0   /* Default: black */
          group-hover:[filter:brightness(0)_saturate(100%)_invert(75%)_sepia(23%)_saturate(7280%)_hue-rotate(93deg)_brightness(109%)_contrast(95%)]
        `" btnBg="#07f468" btnHoverBg="black" btnText="black" btnHoverText="#07f468" />
    </div>
  </template>
