<!-- // ============================================================================
// FILE: src/components/forms/rental/Step3History.vue
// Step 3 – Rental history, uses shared AddressFields.
// ============================================================================ -->


<template>
  <div class="card stack" data-component-path="components/forms/rental/Step3History.vue">
    <h3 class="heading blue">Step 3 — Rental History</h3>

    <AddressFields :engine="engine" base="currentAddress" title="Current Address" />
    <AddressFields :engine="engine" base="previousAddress" title="Previous Address (optional)" />

    <div v-if="engine.substep === 'preview'" class="kv">
      Current: {{ engine.state.currentAddress.line1 || '—' }}, {{ engine.state.currentAddress.city || '—' }}
    </div>

    <div v-else-if="engine.substep === 'help'" class="muted">
      Help: Provide enough details so your current address can be verified.
    </div>

    <div class="row">
      <button class="btn" @click="engine.goToStep(2, { intent: 'user' })">
        ← Back
      </button>

      <button class="btn primary" @click="engine.goToStep(4, { intent: 'user' })">
        Next → Step 4
      </button>
    </div>

    <small class="muted">
      Visible when <b>engine.step === 3</b>. Entering this step requires current address fields.
    </small>
  </div>
</template>

<script>
import { useShiftLogger } from '@/utils/stateEngine';
import AddressFields from '@/components/forms/shared/AddressFields.vue';

export default
{
    name: 'Step3History',

    components:
    {
        AddressFields
    },

    props:
    {
        engine:
        {
            type: Object,
            required: true
        }
    },

    setup(props)
    {
        useShiftLogger('Rental/Step3History', props.engine);

        return {
            engine: props.engine
        };
    }
};
</script>
