<!-- // ============================================================================
// FILE: src/components/forms/rental/Step2Contact.vue
// Step 2 – Contact & employment, uses substeps.
// ============================================================================ -->


<template>
  <div class="card stack" data-component-path="components/forms/rental/Step2Contact.vue">
    <h3 class="heading blue">Step 2 — Contact & Employment</h3>

    <div v-if="engine.substep === 'help'" class="muted">
      Provide a contact email, phone, and employment details so the owner can reach you.
    </div>

    <div v-else-if="engine.substep === 'preview'" class="kv">
      Email: {{ engine.state.contact.email || '—' }} |
      Phone: {{ engine.state.contact.phone || '—' }} |
      Employer: {{ engine.state.employment.employer || '—' }} ({{ engine.state.employment.years || 0 }} yrs)
    </div>

    <div v-else class="stack">
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
        <div class="stack">
          <label>Employer</label>
          <input
            type="text"
            :value="engine.state.employment.employer"
            @input="engine.setState('employment.employer', $event.target.value, { reason: 'user:employer' })"
          />
        </div>

        <div class="stack">
          <label>Years employed</label>
          <input
            type="number"
            min="0"
            max="60"
            :value="engine.state.employment.years"
            @input="engine.setState('employment.years', Number($event.target.value), { reason: 'user:years' })"
          />
        </div>
      </div>
    </div>

    <div class="row">
      <button class="btn" @click="engine.goToStep(1, { intent: 'user' })">
        ← Back
      </button>

      <button class="btn primary" @click="engine.goToStep(3, { intent: 'user' })">
        Next → Step 3
      </button>
    </div>

    <small class="muted">
      Visible when <b>engine.step === 2</b>. Substeps choose between form, preview, and help.
    </small>
  </div>
</template>

<script>
import { useShiftLogger } from '@/utils/stateEngine';

export default
{
    name: 'Step2Contact',

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
        useShiftLogger('Rental/Step2Contact', props.engine);

        return {
            engine: props.engine
        };
    }
};
</script>
