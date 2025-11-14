
<!-- // ============================================================================
// FILE: src/components/forms/rental/Step4References.vue
// Step 4 – References & declaration.
// ============================================================================ -->


<template>
  <div class="card stack" data-component-path="components/forms/rental/Step4References.vue">
    <h3 class="heading blue">Step 4 — References & Declarations</h3>

    <div class="stack">
      <label>Reference (name + phone)</label>

      <div class="row">
        <input
          type="text"
          placeholder="Name"
          v-model="temp.name"
        />

        <input
          type="tel"
          placeholder="Phone"
          v-model="temp.phone"
        />

        <button class="btn" @click="addRef">
          Add
        </button>
      </div>

      <div class="muted">
        At least one reference is required to enter Step 5.
      </div>
    </div>

    <div class="stack">
      <b>References</b>

      <ul>
        <li
          v-for="(r, i) in engine.state.references"
          :key="i"
        >
          {{ r.name }} — {{ r.phone }}

          <button class="btn danger" @click="removeRef(i)">
            remove
          </button>
        </li>
      </ul>
    </div>

    <div class="stack">
      <label>Notes (optional)</label>
      <textarea
        :value="engine.state.notes"
        @input="engine.setState('notes', $event.target.value, { reason: 'user:notes' })"
      />
    </div>

    <div class="row">
      <label>
        <input
          type="checkbox"
          :checked="engine.state.declarations.agree"
          @change="engine.setState('declarations.agree', $event.target.checked, { reason: 'user:agree' })"
        />
        I declare that the information above is true.
      </label>
    </div>

    <div class="row">
      <button class="btn" @click="engine.goToStep(3, { intent: 'user' })">
        ← Back
      </button>

      <button class="btn primary" @click="engine.goToStep(5, { intent: 'user' })">
        Next → Step 5
      </button>
    </div>

    <small class="muted">
      Visible when <b>engine.step === 4</b>. Step 5 requires agreement and ≥ 1 reference.
    </small>
  </div>
</template>

<script>
import { reactive } from 'vue';
import { useShiftLogger } from '@/utils/stateEngine';

export default
{
    name: 'Step4References',

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
        useShiftLogger('Rental/Step4References', props.engine);

        const temp = reactive({
            name: '',
            phone: ''
        });

        function addRef()
        {
            if (!temp.name.trim() || !temp.phone.trim())
            {
                alert('Enter both name and phone.');
                return;
            }

            const list = (props.engine.state.references || []).slice();

            list.push(
                {
                    name: temp.name.trim(),
                    phone: temp.phone.trim()
                }
            );

            props.engine.setState(
                'references',
                list,
                {
                    reason: 'user:addRef'
                }
            );

            temp.name = '';
            temp.phone = '';
        }

        function removeRef(index)
        {
            const list = (props.engine.state.references || []).slice();

            list.splice(index, 1);

            props.engine.setState(
                'references',
                list,
                {
                    reason: 'user:removeRef'
                }
            );
        }

        return {
            engine: props.engine,
            temp,
            addRef,
            removeRef
        };
    }
};
</script>