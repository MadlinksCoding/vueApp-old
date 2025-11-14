
<!-- // ============================================================================
// FILE: src/components/forms/shared/AddressFields.vue
// Reusable address block bound to engine state.
// ============================================================================ -->


<template>
  <div class="stack" :data-component-path="'components/forms/shared/AddressFields.vue:' + base">
    <div class="row" style="justify-content: space-between; align-items: center;">
      <b>{{ title }}</b>
      <span class="badge">bound: {{ base }}</span>
    </div>

    <div class="row">
      <div class="stack">
        <label>Line 1</label>
        <input
          type="text"
          :value="engine.getState(base + '.line1')"
          @input="engine.setState(base + '.line1', $event.target.value, { reason: 'user:addr1' })"
        />
      </div>

      <div class="stack">
        <label>Line 2</label>
        <input
          type="text"
          :value="engine.getState(base + '.line2')"
          @input="engine.setState(base + '.line2', $event.target.value, { reason: 'user:addr2' })"
        />
      </div>
    </div>

    <div class="row">
      <div class="stack">
        <label>City</label>
        <input
          type="text"
          :value="engine.getState(base + '.city')"
          @input="engine.setState(base + '.city', $event.target.value, { reason: 'user:city' })"
        />
      </div>

      <div class="stack">
        <label>Country</label>
        <input
          type="text"
          :value="engine.getState(base + '.country')"
          @input="engine.setState(base + '.country', $event.target.value, { reason: 'user:country' })"
        />
      </div>

      <div class="stack">
        <label>Postcode</label>
        <input
          type="text"
          :value="engine.getState(base + '.postcode')"
          @input="engine.setState(base + '.postcode', $event.target.value, { reason: 'user:postcode' })"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default
{
    name: 'AddressFields',

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
        title:
        {
            type: String,
            required: true
        }
    }
};
</script>

