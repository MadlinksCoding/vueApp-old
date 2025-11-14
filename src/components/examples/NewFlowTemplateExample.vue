<template>
  <!--
    data-component-path is used to track which template rendered what.
    Update the path to match your real structure / file path.
  -->
  <div class="page stack" data-component-path="examples/NewFlowTemplateExample.vue">
    <!-- ==============================================================
         HEADER / DEBUG BAR
         ============================================================= -->
    <div class="card row" style="align-items:center;"> 
      <!-- TODO: rename heading to real flow name -->
      <h2 style="margin:0;">YourFlow — Step Engine Template</h2>

      <!-- Always show current step / substep for debugging -->
      <span class="badge">Step: {{ flow.step }}</span>
      <span class="badge">Sub: {{ flow.substep || '—' }}</span>

      <!-- Optional: show a key state snippet for quick debugging -->
      <span class="badge">
        Mode: {{ flow.state.ui.mode || 'default' }}
      </span>

      <!-- Quick debug controls (force steps, re-init from state) -->
      <span style="margin-left:auto;" class="row">
        <button class="btn small" @click="flow.forceStep(1)">1</button>
        <button class="btn small" @click="flow.forceStep(2)">2</button>
        <button class="btn small" @click="flow.forceStep(3)">3</button>
        <button class="btn small" @click="flow.forceStep(4)">4</button>
        <button class="btn small" @click="flow.forceStep(5)">5</button>
        <button class="btn small" @click="flow.initializeFromState()">
          initFromState
        </button>
      </span>
    </div>

    <!-- ==============================================================
         OPTIONAL: GLOBAL TABS / SUBSTEPS BY STEP
         - Example: when step === 2, show sub-tabs (details / preview).
         - You can delete this block if not needed.
         ============================================================= -->
    <div
      v-if="flow.step === 2"
      class="card row"
      data-component-path="examples/NewFlowTemplateExample.vue:Step2Subtabs"
    >
      <span class="muted">Sub-views for Step 2:</span>
      <button
        class="btn small"
        :class="{ active: flow.substep === 'details' || !flow.substep }"
        @click="flow.goToSubstep('details', { intent: 'user' })"
      >
        details
      </button>
      <button
        class="btn small"
        :class="{ active: flow.substep === 'preview' }"
        @click="flow.goToSubstep('preview', { intent: 'user' })"
      >
        preview
      </button>
      <button
        class="btn small"
        :class="{ active: flow.substep === 'help' }"
        @click="flow.goToSubstep('help', { intent: 'user' })"
      >
        help
      </button>
      <button class="btn small" @click="flow.goToSubstep(null, { intent: 'user' })">
        clear
      </button>
    </div>

    <!-- ==============================================================
         MAIN STEP RENDERING BLOCK
         - This is the core pattern: ONE wrapper, massive if/else,
           each step has its own internal card.
         - Replace 1..5 with however many steps you need.
         ============================================================= -->
    <div class="card stack" data-component-path="examples/NewFlowTemplateExample.vue:Steps">
      <!-- STEP 1: Example "Basics" step -->
      <section v-if="flow.step === 1" aria-label="Step 1 Basics">
        <!-- COMMENT: This template renders when step === 1 -->
        <h3>Step 1 — Basics</h3>

        <!-- Example fields bound into flow.state -->
        <div class="stack">
          <label>Example field A</label>
          <input
            type="text"
            :value="flow.state.step1.fieldA"
            @input="flow.setState('step1.fieldA', $event.target.value, { reason: 'user:step1:fieldA' })"
          />
        </div>

        <div class="stack">
          <label>Example toggle</label>
          <label>
            <input
              type="checkbox"
              :checked="flow.state.step1.flag"
              @change="flow.setState('step1.flag', $event.target.checked, { reason: 'user:step1:flag' })"
            />
            I understand this is just a template
          </label>
        </div>

        <div class="row">
          <button class="btn primary" @click="flow.goToStep(2, { intent: 'user' })">
            Next → Step 2
          </button>
        </div>

        <small class="muted">
          Example: a validator could run when leaving Step 1 to ensure fieldA is not empty.
        </small>
      </section>

      <!-- STEP 2: Example "Details" step with substep usage -->
      <section v-else-if="flow.step === 2" aria-label="Step 2 Details">
        <!-- COMMENT: This template renders when step === 2 -->
        <h3>Step 2 — Details</h3>

        <!-- Example: show different content depending on substep -->
        <div v-if="flow.substep === 'help'" class="stack">
          <p class="muted">
            HELP: Use this block to explain how to fill in Step 2 fields.
          </p>
        </div>

        <div v-else-if="flow.substep === 'preview'" class="stack">
          <p class="muted">
            PREVIEW: Show a readonly view of Step 2 data here.
          </p>
          <pre class="log">{{ pretty(flow.state.step2) }}</pre>
        </div>

        <div v-else class="stack">
          <!-- Default substep (details) -->
          <div class="stack">
            <label>Detail field B</label>
            <input
              type="text"
              :value="flow.state.step2.fieldB"
              @input="flow.setState('step2.fieldB', $event.target.value, { reason: 'user:step2:fieldB' })"
            />
          </div>

          <div class="stack">
            <label>Detail select</label>
            <select
              :value="flow.state.step2.choice"
              @change="flow.setState('step2.choice', $event.target.value, { reason: 'user:step2:choice' })"
            >
              <option value="">Choose…</option>
              <option value="option-1">Option 1</option>
              <option value="option-2">Option 2</option>
            </select>
          </div>
        </div>

        <div class="row">
          <button class="btn" @click="flow.goToStep(1, { intent: 'user' })">← Back</button>
          <button class="btn primary" @click="flow.goToStep(3, { intent: 'user' })">
            Next → Step 3
          </button>
        </div>

        <small class="muted">
          Example: a validator could run on "enter step 3" to ensure fieldB + choice are valid.
        </small>
      </section>

      <!-- STEP 3: Example "Shared component" step -->
      <section v-else-if="flow.step === 3" aria-label="Step 3 Shared">
        <!-- COMMENT: This template renders when step === 3 -->
        <h3>Step 3 — Shared component usage</h3>

        <!--
          Example: A shared <ColorSelect> component used on multiple steps.
          Here we just inline a simple select to show the pattern.
        -->
        <div class="stack">
          <label>Shared color preference</label>
          <select
            :value="flow.state.shared.color"
            @change="flow.setState('shared.color', $event.target.value, { reason: 'user:shared:color' })"
          >
            <option value="">Default</option>
            <option value="red">Red</option>
            <option value="blue">Blue</option>
            <option value="green">Green</option>
          </select>
        </div>

        <p class="muted">
          If Step 1 or Step 4 also renders a color selector bound to
          <code>flow.state.shared.color</code>, it will show the same value.
        </p>

        <div class="row">
          <button class="btn" @click="flow.goToStep(2, { intent: 'user' })">← Back</button>
          <button class="btn primary" @click="flow.goToStep(4, { intent: 'user' })">
            Next → Step 4
          </button>
        </div>
      </section>

      <!-- STEP 4: Example "Async pre-check" step -->
      <section v-else-if="flow.step === 4" aria-label="Step 4 Async Pre-check">
        <!-- COMMENT: This template renders when step === 4 -->
        <h3>Step 4 — Async pre-check (demo)</h3>

        <p class="muted">
          Example: you'd call an API here to validate data before allowing Step 5.
          For this template, we just simulate a check via a button.
        </p>

        <div class="stack">
          <label>External check result</label>
          <p>
            Status:
            <b>{{ flow.state.step4.externalCheckStatus || 'not-run' }}</b>
          </p>
          <button class="btn" @click="runFakeExternalCheck">
            Run external check (fake)
          </button>
        </div>

        <div class="row">
          <button class="btn" @click="flow.goToStep(3, { intent: 'user' })">← Back</button>
          <button
            class="btn primary"
            @click="flow.goToStep(5, { intent: 'user' })"
            :disabled="flow.state.step4.externalCheckStatus !== 'ok'"
          >
            Next → Step 5
          </button>
        </div>

        <small class="muted">
          In production, async validations should live in validators or in this step before goToStep.
        </small>
      </section>

      <!-- STEP 5: Example "Review & Submit" step -->
      <section v-else-if="flow.step === 5" aria-label="Step 5 Review">
        <!-- COMMENT: This template renders when step === 5 -->
        <h3>Step 5 — Review & Submit</h3>

        <div class="stack">
          <b>Full flow state</b>
          <pre class="log">{{ pretty(flow.state) }}</pre>
        </div>

        <div class="row">
          <button class="btn" @click="flow.goToStep(4, { intent: 'user' })">
            ← Back
          </button>
          <button class="btn ok" @click="submitFlow">
            Submit (demo)
          </button>
        </div>
      </section>

      <!-- FALLBACK (should never hit) -->
      <section v-else>
        <h3>Unknown step {{ flow.step }}</h3>
        <button class="btn" @click="flow.forceStep(1)">Reset to Step 1</button>
      </section>
    </div>

    <!-- ==============================================================
         DEBUG PANELS (STATE + LOGS)
         ============================================================= -->
    <div class="row" style="margin-top:1rem;">
      <div class="card stack" style="flex:1 1 360px;">
        <div class="row">
          <b>Flow State</b>
          <span class="badge">reactive</span>
        </div>
        <pre class="log">{{ pretty(flow.state) }}</pre>
      </div>

      <div class="card stack" style="flex:1 1 360px;">
        <div class="row">
          <b>Flow Logs (tail)</b>
          <span class="badge">{{ flow.logs.length }}</span>
        </div>
        <pre class="log">{{ tail(flow.logs, 200).join('\n') }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted } from 'vue';
import {
    createStepStateEngine,
    attachEngineLogging
} from '@/utils/stateEngine';

/**
 * This file intentionally inlines basic validator registration
 * to show the full pattern in one place. In your real app:
 *
 *   - Create src/validators/yourFlow.js
 *   - Move registerYourFlowValidators(engine) there.
 *   - Import and call it inside setup().
 */
function registerYourFlowValidators(engine)
{
    // Example: run on EVERY transition (trim strings etc.)
    engine.registerValidator(
        'yourFlow:always:trim',
        async ({ engine: eng }) =>
        {
            ['step1.fieldA', 'step2.fieldB'].forEach(
                (path) =>
                {
                    const val = eng.getState(path);

                    if (typeof val === 'string')
                    {
                        eng.setState(
                            path,
                            val.trim(),
                            {
                                reason: 'trim',
                                silent: true
                            }
                        );
                    }
                }
            );

            return {
                ok: true
            };
        },
        {
            always: true
        }
    );

    // Example: block leaving Step 1 unless fieldA is set
    engine.registerValidator(
        'yourFlow:exit:step1:requireFieldA',
        async ({ engine: eng }) =>
        {
            const fieldA = (eng.getState('step1.fieldA') || '').trim();

            if (!fieldA)
            {
                return {
                    ok: false,
                    errors:
                    [
                        'Step 1: fieldA must not be empty.'
                    ]
                };
            }

            return {
                ok: true
            };
        },
        {
            onExit: true
        },
        [
            ['onExitStep', 1]
        ]
    );

    // Example: when entering Step 3, ensure Step 2 choice is set
    engine.registerValidator(
        'yourFlow:enter:step3:requireChoice',
        async ({ engine: eng }) =>
        {
            const choice = eng.getState('step2.choice');

            if (!choice)
            {
                return {
                    ok: false,
                    errors:
                    [
                        'You must choose an option in Step 2 before entering Step 3.'
                    ]
                };
            }

            return {
                ok: true
            };
        },
        {
            onEnter: true
        },
        [
            ['onEnterStep', 3]
        ]
    );
}

export default
{
    name: 'NewFlowTemplateExample',

    setup()
    {
        /**
         * 1. CREATE THE ENGINE
         *    - flowId: must be unique per flow
         *    - urlSync: 'query' means step/substep are in URL
         *    - defaults: full schema of your flow state
         */
        const flow = createStepStateEngine(
            {
                flowId: 'yourFlow', // TODO: change this ID per flow
                urlSync: 'query',
                initialStep: 1,
                forcePolicy: 'log', // log forced transitions instead of blocking
                defaults:
                {
                    step1:
                    {
                        fieldA: '',
                        flag: false
                    },
                    step2:
                    {
                        fieldB: '',
                        choice: ''
                    },
                    step4:
                    {
                        externalCheckStatus: 'not-run'
                    },
                    shared:
                    {
                        color: ''
                    },
                    ui:
                    {
                        mode: 'default'
                    }
                }
            }
        );

        /**
         * 2. REGISTER VALIDATORS
         *    - In real usage, move this into src/validators/yourFlow.js.
         */
        registerYourFlowValidators(flow);

        /**
         * 3. ATTACH LOGGING
         *    - This logs transitions, state changes, etc. to flow.logs + console.
         */
        attachEngineLogging(flow);

        /**
         * 4. INITIALIZE ON MOUNT
         *    - fromUrl: true reads ?yourFlow_step= & ?yourFlow_sub=
         *    - If you hydrate from DB/Pinia, call hydrateFromSnapshot() before this.
         */
        onMounted(
            () =>
            {
                flow.initialize(
                    {
                        fromUrl: true
                    }
                );
            }
        );

        /**
         * 5. STEP-SPECIFIC HELPERS
         *    - These helpers can live here or inside dedicated step components.
         */

        function runFakeExternalCheck()
        {
            // Example: pretend we called an API and got "ok"
            flow.setState(
                'step4.externalCheckStatus',
                'ok',
                {
                    reason: 'demo:externalCheck'
                }
            );
        }

        function submitFlow()
        {
            const plainState = JSON.parse(JSON.stringify(flow.state));
            console.log('[NewFlowTemplateExample] submit payload',plainState);
            alert('Flow submitted (demo). See console for payload.');
        }

        /**
         * 6. UTILS FOR DEBUG PANELS
         */
        function pretty(value)
        {
            try
            {
                return JSON.stringify(value, null, 2);
            }
            catch (e)
            {
                return String(value);
            }
        }

        function tail(array, max)
        {
            if (!Array.isArray(array))
            {
                return [];
            }

            const start = Math.max(array.length - max, 0);
            return array.slice(start);
        }

        return {
            flow,
            runFakeExternalCheck,
            submitFlow,
            pretty,
            tail
        };
    }
};
</script>

<style scoped>
.page {
  padding: 1rem;
  gap: 1rem;
}
.stack {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.row {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
}
.card {
  border: 1px solid #ddd;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: #fff;
}
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  background: #eef2ff;
  font-size: 0.75rem;
}
.btn {
  border-radius: 999px;
  border: 1px solid #ddd;
  padding: 0.3rem 0.7rem;
  background: #f5f5f5;
  cursor: pointer;
  font-size: 0.85rem;
}
.btn.primary {
  background: #2563eb;
  color: white;
  border-color: #1d4ed8;
}
.btn.ok {
  background: #16a34a;
  color: white;
  border-color: #15803d;
}
.btn.small {
  padding: 0.2rem 0.4rem;
  font-size: 0.75rem;
}
.btn.active {
  background: #111827;
  color: #f9fafb;
}
.muted {
  font-size: 0.8rem;
  color: #6b7280;
}
.log {
  max-height: 220px;
  overflow: auto;
  background: #0b1020;
  color: #e5e7eb;
  padding: 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
}
</style>