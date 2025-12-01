<template>
  <label class="flex gap-2 cursor-pointer" :class="wrapperClass">
    <input
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      class="w-4 h-4 flex-shrink-0"
      :class="checkboxClass"
      @change="$emit('update:modelValue', $event.target.checked)" 
    />
    <span class="" :class="labelClass">
      {{ label }}
    </span>
  </label>
</template>

<script>
export default {
  name: "CheckboxGroup", // Name change karke CheckboxGroup rakh diya taake confusion na ho
  props: {
    modelValue: { type: Boolean, default: false },
    label: { type: String, required: true },
    disabled: { type: Boolean, default: false },
    checkboxClass: { type: String, default: "" },
    labelClass: { type: String, default: "" },
    wrapperClass: { type: String, default: "" },
  },
  emits: ["update:modelValue"],
};
</script>