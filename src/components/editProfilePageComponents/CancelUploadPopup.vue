<template>
  <PopupHandler
    :modelValue="modelValue"
    @update:modelValue="(val) => emit('update:modelValue', val)"
    :config="uploadCancelConfig"
    :teleportTo="teleportTo"
  >
    <div
      class="w-full bg-white/90 backdrop-blur-[50px] drop-shadow-[0px_-8px_10px_#0000000D] sm:shadow-[0px_2px_4px_-2px_#1018280F,0px_4px_8px_-2px_#1018281A] overflow-hidden"
    >
      <div class="flex flex-col gap-6 p-4">
        <p class="text-base font-semibold text-[#344054] dark:text-text">
          {{ message }}
        </p>

        <div class="flex items-center gap-2">
          <button
            @click="emit('update:modelValue', false)"
            class="w-full h-10 flex justify-center items-center bg-transparent"
          >
            <span class="text-base font-medium text-[#FF4405]">Cancel</span>
          </button>

          <button
            @click="handleDelete"
            class="w-full h-10 flex justify-center items-center bg-[#FF4405] hover:bg-[#ff692e]"
          >
            <span class="text-base font-medium text-white">{{ actionButtonText }}</span>
          </button>
        </div>
      </div>
    </div>
  </PopupHandler>
</template>

<script setup>
import { computed } from "vue";
import PopupHandler from "../ui/popup/PopupHandler.vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  message: { type: String, default: "Are you sure you want to delete your screenshot?" },
  teleportTo: { type: String, default: 'body' },
  isAbsolute: { type: Boolean, default: false }
});

const emit = defineEmits(["update:modelValue", "delete"]);

const actionButtonText = computed(() => {
  if (props.message.toLowerCase().includes('delete')) return 'Delete';
  if (props.message.toLowerCase().includes('leave')) return 'Leave';
  return 'Confirm';
});

const handleDelete = () => {
  emit("delete");
  emit("update:modelValue", false);
};

const uploadCancelConfig = computed(() => ({
  actionType: "popup",
  position: "center",
  customEffect: "scale",
  offset: "0px",
  speed: "250ms",
  effect: "ease-in-out",
  showOverlay: true,
  closeOnOutside: true,
  lockScroll: !props.isAbsolute,
  isAbsolute: props.isAbsolute,
  escToClose: true,
  width: { default: "420px", "<480": "95%" },
  height: "auto",
  scrollable: false,
  closeSpeed: "250ms",
  closeEffect: "cubic-bezier(0.4, 0, 0.2, 1)",
}));
</script>
