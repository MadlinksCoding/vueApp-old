<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import CheckboxGroup from '../ui/form/checkbox/CheckboxGroup.vue';
import editIcon from '@/assets/images/icons/edit.webp';
import slashCircleIcon from '@/assets/images/icons/slash-circle.webp';

const EVENT_TYPE_COLOR_STORAGE_KEY = 'calendar:eventTypeColors';
const NONE_COLOR_VALUE = 'none';
const DEFAULT_TYPE_COLORS = Object.freeze({
  video: '#4F46E5',
  audio: '#06B6D4',
  groupCall: '#E11D48',
});

const COLOR_OPTIONS = [
  '#4F46E5',
  '#FF3B30',
  '#28C76F',
  '#EC4899',
  '#F97316',
  '#7C4DFF',
];

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      video: true,
      audio: true,
      groupCall: false,
      showSchedule: false,
    }),
  },
});

const emit = defineEmits(['update:modelValue']);
const openColorPickerFor = ref('');
const rootRef = ref(null);

function isHexColor(value) {
  const input = String(value || '').trim();
  return /^#([0-9a-fA-F]{3}){1,2}$/.test(input);
}

function normalizeHexColor(value, fallback) {
  return isHexColor(value) ? String(value).trim() : fallback;
}

function normalizeColorChoice(value, fallback = null) {
  const input = String(value || '').trim().toLowerCase();
  if (input === NONE_COLOR_VALUE) return NONE_COLOR_VALUE;
  return isHexColor(value) ? String(value).trim() : fallback;
}

function isNoneChoice(value) {
  return normalizeColorChoice(value, null) === NONE_COLOR_VALUE;
}

function getDisplayDotColor(type) {
  const choice = filters.value.colorByType[type];
  return isHexColor(choice) ? choice : '#98A2B3';
}

function getCheckboxStyle(type) {
  const accentColor = getDisplayDotColor(type);
  return {
    accentColor,
    borderColor: accentColor,
  };
}

function getPickerOptions(type) {
  return [
    { key: `${type}_${NONE_COLOR_VALUE}`, value: NONE_COLOR_VALUE, isNone: true },
    ...COLOR_OPTIONS.map((color) => ({ key: `${type}_${color}`, value: color, isNone: false })),
  ];
}

function isTypeColorSelected(type, color) {
  return filters.value.colorByType[type] === color;
}

function loadPersistedTypeColors() {
  if (typeof window === 'undefined') {
    return {
      video: null,
      audio: null,
      groupCall: DEFAULT_TYPE_COLORS.groupCall,
    };
  }
  try {
    const raw = window.localStorage?.getItem(EVENT_TYPE_COLOR_STORAGE_KEY);
    if (!raw) {
      return {
        video: null,
        audio: null,
        groupCall: DEFAULT_TYPE_COLORS.groupCall,
      };
    }
    const parsed = JSON.parse(raw);
    return {
      video: normalizeColorChoice(parsed?.video, null),
      audio: normalizeColorChoice(parsed?.audio, null),
      groupCall: normalizeHexColor(parsed?.groupCall, DEFAULT_TYPE_COLORS.groupCall),
    };
  } catch (_error) {
    return {
      video: null,
      audio: null,
      groupCall: DEFAULT_TYPE_COLORS.groupCall,
    };
  }
}

function persistTypeColors(colors = {}) {
  if (typeof window === 'undefined') return;
  const safeColors = {
    video: normalizeColorChoice(colors.video, null),
    audio: normalizeColorChoice(colors.audio, null),
    groupCall: normalizeHexColor(colors.groupCall, DEFAULT_TYPE_COLORS.groupCall),
  };
  window.localStorage?.setItem(EVENT_TYPE_COLOR_STORAGE_KEY, JSON.stringify(safeColors));
  window.dispatchEvent(new CustomEvent('event-type-colors:changed', { detail: safeColors }));
}

const filters = computed(() => ({
  video: props.modelValue?.video !== false,
  audio: props.modelValue?.audio !== false,
  groupCall: props.modelValue?.groupCall === true,
  showSchedule: props.modelValue?.showSchedule !== false,
  colorByType: {
    video: normalizeColorChoice(props.modelValue?.colorByType?.video, null),
    audio: normalizeColorChoice(props.modelValue?.colorByType?.audio, null),
    groupCall: normalizeHexColor(props.modelValue?.colorByType?.groupCall, DEFAULT_TYPE_COLORS.groupCall),
  },
}));

function updateFilter(key, value) {
  emit('update:modelValue', {
    ...(props.modelValue || {}),
    ...filters.value,
    [key]: value,
  });
}

function updateTypeColor(type, color) {
  const nextColorByType = {
    ...filters.value.colorByType,
    [type]: normalizeColorChoice(color, null),
  };

  emit('update:modelValue', {
    ...(props.modelValue || {}),
    ...filters.value,
    colorByType: nextColorByType,
  });
  persistTypeColors(nextColorByType);
  openColorPickerFor.value = '';
}

function toggleColorPicker(type) {
  openColorPickerFor.value = openColorPickerFor.value === type ? '' : type;
}

function closeColorPicker() {
  openColorPickerFor.value = '';
}

function handleDocumentClick(event) {
  if (!rootRef.value) return;
  if (!rootRef.value.contains(event.target)) {
    closeColorPicker();
  }
}

onMounted(() => {
  const colorByType = {
    video: normalizeColorChoice(props.modelValue?.colorByType?.video, null),
    audio: normalizeColorChoice(props.modelValue?.colorByType?.audio, null),
    groupCall: normalizeHexColor(props.modelValue?.colorByType?.groupCall, DEFAULT_TYPE_COLORS.groupCall),
    ...loadPersistedTypeColors(),
  };
  emit('update:modelValue', {
    ...(props.modelValue || {}),
    ...filters.value,
    colorByType,
  });
  document.addEventListener('click', handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
});
</script>

<template>
  <div ref="rootRef" class="w-[240px] sm:w-[340px] bg-white rounded-[5px] inline-flex flex-col justify-start items-start shadow-lg border border-gray-100 z-50">
    <div class="self-stretch h-14 px-3 py-2 inline-flex justify-start items-center gap-2 hover:bg-gray-50 transition-colors">
      <CheckboxGroup
        label="Video Call"
        :model-value="filters.video"
        @update:modelValue="(value) => updateFilter('video', value)"
        checkboxClass="m-0 w-4 h-4 rounded border cursor-pointer"
        :checkboxStyle="getCheckboxStyle('video')"
        labelClass="text-slate-700 sm:text-base text-[14px] cursor-pointer font-medium leading-6"
        wrapperClass="flex items-center gap-2"
      />
      <div class="flex-1 flex justify-between items-center">
        <div class="flex justify-start items-center gap-2">
          <div
            v-if="isNoneChoice(filters.colorByType.video)"
            class="w-3 h-3 rounded-full border border-gray-400 bg-white flex items-center justify-center overflow-hidden"
          >
            <img :src="slashCircleIcon" alt="No color" class="w-full h-full object-contain" />
          </div>
          <div v-else class="w-2 h-2 rounded-full" :style="{ backgroundColor: getDisplayDotColor('video') }" />
        </div>
        <div class="w-5 h-5 relative overflow-visible">
          <button type="button" class="w-5 h-5 relative overflow-hidden" @click.stop="toggleColorPicker('video')">
            <img :src="editIcon" alt="editIcon" />
          </button>
          <div
            v-if="openColorPickerFor === 'video'"
            class="absolute right-0 top-[1.7rem] z-[1200] bg-[#E5E7EB] rounded-[0.25rem] px-3 py-2 flex flex-col gap-3 shadow-lg"
          >
            <button
              v-for="option in getPickerOptions('video')"
              :key="option.key"
              type="button"
              :class="[
                'w-4 h-4 rounded-full overflow-hidden flex items-center justify-center border',
                isTypeColorSelected('video', option.value) ? 'ring-2 ring-slate-500 ring-offset-1' : 'border-transparent',
              ]"
              :style="option.isNone ? { backgroundColor: '#FFFFFF', borderColor: '#98A2B3' } : { backgroundColor: option.value }"
              @click.stop="updateTypeColor('video', option.value)"
            >
              <img v-if="option.isNone" :src="slashCircleIcon" alt="No color" class="w-full h-full object-contain" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="self-stretch h-14 px-3 py-2 inline-flex justify-start items-center gap-2 hover:bg-gray-50 transition-colors">
      <CheckboxGroup
        label="Audio Call"
        :model-value="filters.audio"
        @update:modelValue="(value) => updateFilter('audio', value)"
        checkboxClass="m-0 w-4 h-4 rounded border cursor-pointer"
        :checkboxStyle="getCheckboxStyle('audio')"
        labelClass="text-slate-700 sm:text-base text-[14px] cursor-pointer font-medium leading-6"
        wrapperClass="flex items-center gap-2"
      />
      <div class="flex-1 flex justify-between items-center">
        <div class="flex justify-start items-center gap-2">
          <div
            v-if="isNoneChoice(filters.colorByType.audio)"
            class="w-3 h-3 rounded-full border border-gray-400 bg-white flex items-center justify-center overflow-hidden"
          >
            <img :src="slashCircleIcon" alt="No color" class="w-full h-full object-contain" />
          </div>
          <div v-else class="w-2 h-2 rounded-full" :style="{ backgroundColor: getDisplayDotColor('audio') }" />
        </div>
        <div class="w-5 h-5 relative overflow-visible">
          <button type="button" class="w-5 h-5 relative overflow-hidden" @click.stop="toggleColorPicker('audio')">
            <img :src="editIcon" alt="editIcon" />
          </button>
          <div
            v-if="openColorPickerFor === 'audio'"
            class="absolute right-0 top-[1.7rem] z-[1200] bg-[#E5E7EB] rounded-[0.25rem] px-3 py-2 flex flex-col gap-3 shadow-lg"
          >
            <button
              v-for="option in getPickerOptions('audio')"
              :key="option.key"
              type="button"
              :class="[
                'w-4 h-4 rounded-full overflow-hidden flex items-center justify-center border',
                isTypeColorSelected('audio', option.value) ? 'ring-2 ring-slate-500 ring-offset-1' : 'border-transparent',
              ]"
              :style="option.isNone ? { backgroundColor: '#FFFFFF', borderColor: '#98A2B3' } : { backgroundColor: option.value }"
              @click.stop="updateTypeColor('audio', option.value)"
            >
              <img v-if="option.isNone" :src="slashCircleIcon" alt="No color" class="w-full h-full object-contain" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="self-stretch h-14 px-3 py-2 inline-flex justify-start items-center gap-2 hover:bg-gray-50 transition-colors opacity-50 pointer-events-none">
      <CheckboxGroup
        label="Group Call"
        :model-value="filters.groupCall"
        checkboxClass="m-0 w-4 h-4 rounded border cursor-pointer"
        :checkboxStyle="getCheckboxStyle('groupCall')"
        labelClass="text-slate-700 sm:text-base text-[14px] cursor-pointer font-medium leading-6"
        wrapperClass="flex items-center gap-2"
      />
      <div class="flex-1 flex justify-between items-center">
        <div class="flex justify-start items-center gap-2">
          <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: getDisplayDotColor('groupCall') }" />
        </div>
        <div class="w-5 h-5 relative overflow-hidden">
            <img :src="editIcon" alt="editIcon" />
        </div>
      </div>
    </div>

    <div class="self-stretch h-14 px-3 py-2 border-t border-gray-300 inline-flex justify-start items-center gap-4 hover:bg-gray-50 transition-colors">
      <CheckboxGroup
        label="Show booking schedule availability"
        :model-value="filters.showSchedule"
        @update:modelValue="(value) => updateFilter('showSchedule', value)"
        checkboxClass="m-0 [appearance:none] w-4 h-4 relative bg-white rounded border border-gray-900 relative cursor-pointer checked:bg-gray-900 checked:border-gray-900 checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.3rem] checked:[&::after]:w-[0.30rem] checked:[&::after]:h-[0.6rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-white checked:[&::after]:border-r-[2px] checked:[&::after]:border-b-[2px] checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
        labelClass="text-slate-700 sm:text-[16px] text-[12px]  cursor-pointer font-medium leading-6"
        wrapperClass="flex items-center gap-2"
      />
    </div>
  </div>
</template>
