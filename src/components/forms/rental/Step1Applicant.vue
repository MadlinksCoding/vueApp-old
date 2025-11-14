
<!-- // ============================================================================
// FILE: src/components/forms/rental/Step1Applicant.vue
// Step 1 – Applicant & basic contact.
// ============================================================================ -->


<template>
  <div class="card stack" data-component-path="components/forms/rental/Step1Applicant.vue">
    <h3 class="heading blue">Step 1 — Applicant</h3>

    <PersonName :engine="engine" base="applicant" label="Applicant" />

    <details>
      <summary>Add a co-tenant</summary>
      <PersonName :engine="engine" base="cotenants[0]" label="Co-tenant" />
    </details>

    <div class="row">
      <div class="stack">
        <label>Email</label>
        <input
          type="email"
          :value="engine.state.contact.email"
          @input="engine.setState('contact.email', $event.target.value, { reason: 'user:email' })"
        />
      </div>

      <div class="stack">
        <label>Phone</label>
        <input
          type="tel"
          :value="engine.state.contact.phone"
          @input="engine.setState('contact.phone', $event.target.value, { reason: 'user:phone' })"
        />
      </div>
    </div>

    <div class="row">
      <label>Household size</label>
      <input
        type="number"
        min="1"
        max="10"
        :value="engine.state.household.size"
        @input="engine.setState('household.size', Number($event.target.value), { reason: 'user:hhsize' })"
      />
      <span class="badge">now: {{ engine.state.household.size }}</span>
    </div>

    <div class="row">
      <button class="btn primary" @click="engine.goToStep(2, { intent: 'user' })">
        Next → Step 2
      </button>
    </div>

    <small class="muted">
      Visible when <b>engine.step === 1</b>. Leaving this step requires basic applicant and valid email.
    </small>
  </div>
</template>

<script>
import { useShiftLogger } from '@/utils/stateEngine';
import PersonName from '@/components/forms/shared/PersonName.vue';

export default
{
    name: 'Step1Applicant',

    components:
    {
        PersonName
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
        useShiftLogger('Rental/Step1Applicant', props.engine);

        return {
            engine: props.engine
        };
    }
};
</script>
