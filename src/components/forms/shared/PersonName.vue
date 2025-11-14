
<!-- // ============================================================================
// FILE: src/components/forms/shared/PersonName.vue
// Reusable name fields bound to engine state.
// ============================================================================ -->

<template>
  <div class="row" :data-component-path="'components/forms/shared/PersonName.vue:' + base">
    <div class="stack">
      <label>{{ label }} — First</label>
      <input
        type="text"
        :value="engine.getState(base + '.first')"
        @input="engine.setState(base + '.first', $event.target.value, { reason: 'user:first' })"
      />
    </div>

    <div class="stack">
      <label>{{ label }} — Last</label>
      <input
        type="text"
        :value="engine.getState(base + '.last')"
        @input="engine.setState(base + '.last', $event.target.value, { reason: 'user:last' })"
      />
    </div>
  </div>
</template>

<script>
export default
{
    name: 'PersonName',

    props:
    {
        engine:
        {
            type: Object,
            required: true
        },
        base:
        {
            type: String,
            required: true
        },
        label:
        {
            type: String,
            required: true
        }
    }
};
</script>
