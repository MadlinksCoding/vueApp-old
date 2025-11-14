<!-- // ============================================================================
// FILE: src/components/forms/rental/Step5Review.vue
// Step 5 – Review & submit.
// ============================================================================ -->


<template>
  <div class="card stack" data-component-path="components/forms/rental/Step5Review.vue">
    <h3 class="heading blue">Step 5 — Review & Submit</h3>

    <div class="stack kv">
      Applicant:
      {{ engine.state.applicant.first }} {{ engine.state.applicant.last }}
      |
      Email: {{ engine.state.contact.email || '—' }}
      |
      Phone: {{ engine.state.contact.phone || '—' }}
      |
      Employer: {{ engine.state.employment.employer || '—' }}
      ({{ engine.state.employment.years || 0 }} yrs)
      |
      Household: {{ engine.state.household.size }}
      |
      Current Address:
      {{ engine.state.currentAddress.line1 || '—' }},
      {{ engine.state.currentAddress.city || '—' }}
      |
      References: {{ (engine.state.references || []).length }}
      |
      Agreed: {{ engine.state.declarations.agree ? 'yes' : 'no' }}
    </div>

    <div class="row">
      <button class="btn" @click="engine.goToStep(4, { intent: 'user' })">
        ← Back
      </button>

      <button class="btn ok" @click="submit">
        Submit
      </button>
    </div>

    <small class="muted">
      Visible when <b>engine.step === 5</b>. Entering this step runs async validation (e.g., email uniqueness).
    </small>
  </div>
</template>

<script>
import { useShiftLogger } from '@/utils/stateEngine';

export default
{
    name: 'Step5Review',

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
        useShiftLogger('Rental/Step5Review', props.engine);

        function submit()
        {
            console.log('[Rental] submit payload', structuredClone(props.engine.state));
            alert('Submitted (demo). Check console for payload.');
        }

        return {
            engine: props.engine,
            submit
        };
    }
};
</script>