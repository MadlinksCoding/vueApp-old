<template>
  <div class="page stack" data-component-path="examples/FiveStepApplicationExample.vue">
    <!-- Header / debug bar -->
    <div class="card row" style="align-items: center; gap: 0.75rem;">
      <h2 style="margin: 0;">5-Step Application Example</h2>

      <span class="badge">Step: {{ engine.step }}</span>
      <span class="badge">Sub: {{ engine.substep || '—' }}</span>
      <span class="badge">{{ engine.flags.isValidating ? 'validating…' : 'idle' }}</span>

      <span style="margin-left: auto;" class="row" aria-label="Debug buttons">
        <button class="btn" @click="engine.forceStep(1)">Force 1</button>
        <button class="btn" @click="engine.forceStep(2)">Force 2</button>
        <button class="btn" @click="engine.forceStep(3)">Force 3</button>
        <button class="btn" @click="engine.forceStep(4)">Force 4</button>
        <button class="btn" @click="engine.forceStep(5)">Force 5</button>
        <button class="btn" @click="engine.initializeFromState()">initializeFromState()</button>
      </span>
    </div>

    <!-- Substep tabs (optional) used on Step 3 -->
    <div
      v-show="engine.step === 3"
      class="card row"
      style="gap: 0.5rem;"
      data-component-path="examples/FiveStepApplicationExample.vue:SubTabs"
    >
      <span class="muted">Step 3 views:</span>

      <button
        class="btn"
        :class="{ active: engine.substep === 'form' }"
        @click="engine.goToSubstep('form', { intent: 'user' })"
      >
        form
      </button>

      <button
        class="btn"
        :class="{ active: engine.substep === 'preview' }"
        @click="engine.goToSubstep('preview', { intent: 'user' })"
      >
        preview
      </button>

      <button
        class="btn"
        :class="{ active: engine.substep === 'help' }"
        @click="engine.goToSubstep('help', { intent: 'user' })"
      >
        help
      </button>

      <button class="btn" @click="engine.goToSubstep(null, { intent: 'user' })">
        clear
      </button>

      <small class="muted">Only used on Step 3 in this example</small>
    </div>

    <!-- Main step rendering -->
    <div class="card stack" data-component-path="examples/FiveStepApplicationExample.vue:Steps">
      <!-- STEP 1: Personal -->
      <section v-if="engine.step === 1" aria-label="Step 1 Personal">
        <h3>Step 1 — Personal</h3>

        <div class="stack">
          <label>First name</label>
          <input
            type="text"
            :value="engine.state.personal.first"
            @input="engine.setState('personal.first', $event.target.value, { reason: 'user:first' })"
          />
        </div>

        <div class="stack">
          <label>Last name</label>
          <input
            type="text"
            :value="engine.state.personal.last"
            @input="engine.setState('personal.last', $event.target.value, { reason: 'user:last' })"
          />
        </div>

        <div class="stack">
          <label>Preferred title</label>
          <select
            :value="engine.state.personal.title"
            @change="engine.setState('personal.title', $event.target.value, { reason: 'user:title' })"
          >
            <option value="">Choose…</option>
            <option>Mr</option>
            <option>Ms</option>
            <option>Dr</option>
            <option>Prof</option>
          </select>
        </div>

        <div class="row">
          <button class="btn primary" @click="engine.goToStep(2, { intent: 'user' })">
            Next → Step 2
          </button>
        </div>

        <small class="muted">
          Leaving Step 1 requires: first name, last name, and a valid-looking email (set on Step 2).
        </small>
      </section>

      <!-- STEP 2: Contact -->
      <section v-else-if="engine.step === 2" aria-label="Step 2 Contact">
        <h3>Step 2 — Contact</h3>

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

        <div class="row">
          <button class="btn" @click="engine.goToStep(1, { intent: 'user' })">← Back</button>
          <button class="btn primary" @click="engine.goToStep(3, { intent: 'user' })">
            Next → Step 3
          </button>
        </div>

        <small class="muted">
          Leaving Step 2 requires phone to be filled in. Email validity is checked by Step 1's exit validator.
        </small>
      </section>

      <!-- STEP 3: Employment (with substeps) -->
      <section v-else-if="engine.step === 3" aria-label="Step 3 Employment">
        <h3>Step 3 — Employment</h3>

        <div v-if="engine.substep === 'help'" class="muted">
          Help: Provide your current employment details. Use "preview" to quickly check what you've entered.
        </div>

        <div v-else-if="engine.substep === 'preview'" class="stack">
          <b>Preview:</b>
          <div>
            Company: {{ engine.state.employment.company || '—' }}<br />
            Role: {{ engine.state.employment.role || '—' }}<br />
            Years: {{ engine.state.employment.years || 0 }}
          </div>
        </div>

        <div v-else class="stack">
          <div class="stack">
            <label>Company</label>
            <input
              type="text"
              :value="engine.state.employment.company"
              @input="engine.setState('employment.company', $event.target.value, { reason: 'user:company' })"
            />
          </div>

          <div class="stack">
            <label>Role</label>
            <input
              type="text"
              :value="engine.state.employment.role"
              @input="engine.setState('employment.role', $event.target.value, { reason: 'user:role' })"
            />
          </div>

          <div class="stack">
            <label>Years in role</label>
            <input
              type="number"
              min="0"
              max="60"
              :value="engine.state.employment.years"
              @input="engine.setState('employment.years', Number($event.target.value), { reason: 'user:years' })"
            />
          </div>
        </div>

        <div class="row">
          <button class="btn" @click="engine.goToStep(2, { intent: 'user' })">← Back</button>
          <button class="btn primary" @click="engine.goToStep(4, { intent: 'user' })">
            Next → Step 4
          </button>
        </div>
      </section>

      <!-- STEP 4: References -->
      <section v-else-if="engine.step === 4" aria-label="Step 4 References">
        <h3>Step 4 — References</h3>

        <div class="stack">
          <label>Reference name</label>
          <input type="text" v-model="tempRef.name" />
        </div>

        <div class="stack">
          <label>Reference phone</label>
          <input type="tel" v-model="tempRef.phone" />
        </div>

        <button class="btn" @click="addReference">Add reference</button>

        <ul class="stack" style="margin-top: 0.75rem;">
          <li v-for="(r, idx) in engine.state.references" :key="idx">
            {{ r.name }} — {{ r.phone }}
            <button class="btn small danger" @click="removeReference(idx)">remove</button>
          </li>
        </ul>

        <div class="stack">
          <label>
            <input
              type="checkbox"
              :checked="engine.state.declarations.agree"
              @change="engine.setState('declarations.agree', $event.target.checked, { reason: 'user:agree' })"
            />
            I declare the information I provided is correct.
          </label>
        </div>

        <div class="row">
          <button class="btn" @click="engine.goToStep(3, { intent: 'user' })">← Back</button>
          <button class="btn primary" @click="engine.goToStep(5, { intent: 'user' })">
            Next → Step 5
          </button>
        </div>

        <small class="muted">
          Entering Step 5 should require at least one reference and the declaration checked (validator territory).
        </small>
      </section>

      <!-- STEP 5: Review & Submit -->
      <section v-else-if="engine.step === 5" aria-label="Step 5 Review">
        <h3>Step 5 — Review & Submit</h3>

        <div class="stack">
          <b>Summary</b>
          <pre class="log">{{ pretty(engine.state) }}</pre>
        </div>

        <div class="row">
          <button class="btn" @click="engine.goToStep(4, { intent: 'user' })">← Back</button>
          <button class="btn ok" @click="submitApplication">Submit application</button>
        </div>

        <small class="muted">
          In a real app, Step 5 entry would run async validation (e.g., check email uniqueness) before allowing submit.
        </small>
      </section>

      <!-- Fallback (should never happen) -->
      <section v-else>
        <h3>Unknown step {{ engine.step }}</h3>
        <button class="btn" @click="engine.forceStep(1)">Reset to Step 1</button>
      </section>
    </div>

    <!-- Debug panels -->
    <div class="row" style="margin-top: 1rem;">
      <div class="card stack" style="flex: 1 1 360px;">
        <div class="row">
          <b>State</b>
          <span class="badge">reactive</span>
        </div>
        <pre class="log">{{ pretty(engine.state) }}</pre>
      </div>

      <div class="card stack" style="flex: 1 1 360px;">
        <div class="row">
          <b>Logs (tail)</b>
          <span class="badge">{{ engine.logs.length }}</span>
        </div>
        <pre class="log">{{ tail(engine.logs, 200).join('\n') }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, onMounted } from 'vue';
import {
    createStepStateEngine,
    attachEngineLogging
} from '@/utils/stateEngine';

// NOTE: in a real project, move these into src/validators/app.js
// and call registerAppValidators(engine) from there.
function registerExampleValidators(engine)
{
    // -------------------------------
    // Always run: trim some strings
    // -------------------------------
    engine.registerValidator(
        'example:always:trim',
        async ({ engine: eng }) =>
        {
            ['personal.first', 'personal.last', 'employment.company', 'employment.role'].forEach((path) =>
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
            });

            return {
                ok: true
            };
        },
        {
            always: true
        }
    );

    // ----------------------------------------------
    // Exit Step 1: require first + last + valid email
    // ----------------------------------------------
    engine.registerValidator(
        'example:exit:step1',
        async ({ engine: eng }) =>
        {
            const errors = [];

            if (!eng.getState('personal.first'))
            {
                errors.push('First name is required to leave Step 1.');
            }

            if (!eng.getState('personal.last'))
            {
                errors.push('Last name is required to leave Step 1.');
            }

            const email = (eng.getState('contact.email') || '').trim();

            if (!email)
            {
                errors.push('Email must be entered (on Step 2) before leaving Step 1.');
            }
            else
            {
                const isBasicValid = email.includes('@') && email.includes('.');
                // In real life, call your external email validator here
                if (!isBasicValid)
                {
                    errors.push('Email format looks invalid.');
                }
            }

            if (errors.length)
            {
                return {
                    ok: false,
                    errors
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

    // -------------------------------------
    // Exit Step 2: require phone
    // -------------------------------------
    engine.registerValidator(
        'example:exit:step2',
        async ({ engine: eng }) =>
        {
            const phone = (eng.getState('contact.phone') || '').trim();
            const errors = [];

            if (!phone)
            {
                errors.push('Phone is required to leave Step 2.');
            }

            if (errors.length)
            {
                return {
                    ok: false,
                    errors
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
            ['onExitStep', 2]
        ]
    );
}

export default
{
    name: 'FiveStepApplicationExample',

    setup()
    {
        const engine = createStepStateEngine(
            {
                flowId: 'appDemo',
                urlSync: 'query',
                initialStep: 1,
                forcePolicy: 'log',
                defaults:
                {
                    personal:
                    {
                        first: '',
                        last: '',
                        title: ''
                    },
                    contact:
                    {
                        email: '',
                        phone: ''
                    },
                    employment:
                    {
                        company: '',
                        role: '',
                        years: 0
                    },
                    references: [],
                    declarations:
                    {
                        agree: false
                    }
                }
            }
        );

        registerExampleValidators(engine);
        attachEngineLogging(engine);

        onMounted(
            () =>
            {
                // Optional: you could hydrate from Pinia/DB here via hydrateFromSnapshot(...)
                engine.initialize(
                    {
                        fromUrl: true
                    }
                );
            }
        );

        const tempRef = reactive(
            {
                name: '',
                phone: ''
            }
        );

        function addReference()
        {
            if (!tempRef.name.trim() || !tempRef.phone.trim())
            {
                alert('Please enter both name and phone.');
                return;
            }

            const list = (engine.state.references || []).slice();

            list.push(
                {
                    name: tempRef.name.trim(),
                    phone: tempRef.phone.trim()
                }
            );

            engine.setState(
                'references',
                list,
                {
                    reason: 'user:addRef'
                }
            );

            tempRef.name = '';
            tempRef.phone = '';
        }

        function removeReference(idx)
        {
            const list = (engine.state.references || []).slice();

            list.splice(idx, 1);

            engine.setState(
                'references',
                list,
                {
                    reason: 'user:removeRef'
                }
            );
        }

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

        function submitApplication()
        {
            const plainState = JSON.parse(JSON.stringify(engine.state));
            console.log('[FiveStepApplicationExample] submit payload', plainState);
            alert('Submitted (demo only) — check console for payload.');
        }

        return {
            engine,
            tempRef,
            addReference,
            removeReference,
            pretty,
            tail,
            submitApplication
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
.btn.danger,
.btn.small.danger {
  background: #ef4444;
  color: white;
  border-color: #b91c1c;
}
.btn.small {
  padding: 0.15rem 0.45rem;
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

