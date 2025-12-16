<template>
  <div :class="wrapperClass">

    <!-- LABEL -->
    <label
      v-if="label"
      :for="labelFor"
      :class="labelClass"
    >
      {{ label }}
    </label>

    <!-- TEXTAREA MODE -->
    <textarea
      v-if="type === 'textarea'"
      :placeholder="placeholder"
      :class="inputClass"
      :value="modelValue"
      :maxlength="maxLength"
      :rows="rows"
      @input="resizeTextarea"
      class="block w-full resize-none overflow-hidden placeholder:whitespace-normal min-h-[65px] leading-6"
    ></textarea>

    <!-- INPUT MODE -->
    <input
      v-else
      :type="type"
      :placeholder="placeholder"
      :class="inputClass"
      :value="modelValue"
      :maxlength="maxLength"
      @input="$emit('update:modelValue', $event.target.value)"
    />

    <!-- Counter -->
    <p v-if="maxLength" :class="counterClass">
      {{ modelValue?.length || 0 }}/{{ maxLength }} characters
    </p>
  </div>
</template>

<script>
export default {
  name: "BaseInput",
  props: {
    type: {
      type: String,
      default: "text",
    },
    placeholder: {
      type: String,
      default: "",
    },
    
  /* 👇 LABEL PROPS */
  label: {
    type: String,
    default: "",
  },
  labelFor: {
    type: String,
    default: "",
  },
  labelClass: {
    type: String,
    default: "",
  },
    inputClass: {
      type: String,
      default:
        "bg-white/50 w-full px-3 py-3 rounded-tl-sm rounded-tr-sm outline-none border-b border-gray-300 text-[16px]",
    },
    wrapperClass: {
      type: String,
      default: "flex flex-col gap-1",
    },
    counterClass: {
      type: String,
      default: "text-xs text-gray-500",
    },
    modelValue: {
      type: [String, Number],
      default: "",
    },
    maxLength: {
      type: Number,
      default: null,
    },
    rows: {
    type: Number,
    default: 1,
  },
  },

  methods: {
    resizeTextarea(e) {
      const el = e.target;
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
      this.$emit("update:modelValue", el.value);
    },
  },
};
</script>
