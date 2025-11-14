<template>
  <div class="page stack" data-component-path="examples/RentalApplicationForm.vue">
    <!-- Header / status bar -->
    <div class="card row" style="align-items:center; gap:0.75rem;">
      <h2 style="margin:0;">Rental Application</h2>

      <span class="badge">Step: {{ rental.step }}</span>
      <span class="badge">Sub: {{ rental.substep || '—' }}</span>

      <span class="badge">
        Applicant: {{ rental.state.applicant.first || '(no name yet)' }}
      </span>

      <span class="badge">
        Pets: {{ rental.state.household.hasPets === true ? 'Yes' : (rental.state.household.hasPets === false ? 'No' : 'Unknown') }}
      </span>

      <span style="margin-left:auto;" class="row">
        <button class="btn small" @click="rental.forceStep(1)">1</button>
        <button class="btn small" @click="rental.forceStep(2)">2</button>
        <button class="btn small" @click="rental.forceStep(3)">3</button>
        <button class="btn small" @click="rental.forceStep(4)">4</button>
        <button class="btn small " @click="rental.forceStep(5)">5</button>
        <button class="btn small" @click="rental.initializeFromState()">initFromState</button>
      </span>
    </div>

    <!-- Step 4 sub-tabs (history / household / details) to demonstrate substeps -->
    <div
      v-if="rental.step === 4"
      class="card row"
      data-component-path="examples/RentalApplicationForm.vue:Step4Tabs"
    >
      <span class="muted">Step 4 views:</span>

      <button
        class="btn small"
        :class="{ active: rental.substep === 'history' || !rental.substep }"
        @click="rental.goToSubstep('history', { intent: 'user' })"
      >
        history
      </button>

      <button
        class="btn small"
        :class="{ active: rental.substep === 'household' }"
        @click="rental.goToSubstep('household', { intent: 'user' })"
      >
        household
      </button>

      <!-- external-validation-in-button: only let user go to 'details' if email passes third-party JS -->
      <button
        class="btn small"
        :class="{ active: rental.substep === 'details' }"
        @click="goToStep4DetailsWithEmailCheck"
      >
        details (email-checked)
      </button>
    </div>

    <!-- Main step rendering wrapper -->
    <div class="card stack" data-component-path="examples/RentalApplicationForm.vue:Steps">
      <!-- STEP 1: Applicant details (5+ questions) -->
      <section v-if="rental.step === 1" aria-label="Step 1 Applicant">
        <!-- COMMENT: This template shows when step === 1 (Applicant details) -->
        <h3>Step 1 — Applicant details</h3>

        <div class="stack">
          <label>First name</label>
          <input
            type="text"
            :value="rental.state.applicant.first"
            @input="rental.setState('applicant.first', $event.target.value, { reason: 'user:applicant:first' })"
          />
        </div>

        <div class="stack">
          <label>Last name</label>
          <input
            type="text"
            :value="rental.state.applicant.last"
            @input="rental.setState('applicant.last', $event.target.value, { reason: 'user:applicant:last' })"
          />
        </div>

        <div class="stack">
          <label>Date of birth</label>
          <input
            type="date"
            :value="rental.state.applicant.dob"
            @input="rental.setState('applicant.dob', $event.target.value, { reason: 'user:applicant:dob' })"
          />
        </div>

        <div class="stack">
          <label>Preferred title</label>
          <select
            :value="rental.state.applicant.title"
            @change="rental.setState('applicant.title', $event.target.value, { reason: 'user:applicant:title' })"
          >
            <option value="">Choose…</option>
            <option>Mr</option>
            <option>Ms</option>
            <option>Mrs</option>
            <option>Mx</option>
            <option>Dr</option>
          </select>
        </div>

        <div class="stack">
          <label>Preferred contact method</label>
          <select
            :value="rental.state.preferences.contactMethod"
            @change="rental.setState('preferences.contactMethod', $event.target.value, { reason: 'user:pref:contactMethod' })"
          >
            <option value="">Choose…</option>
            <option value="phone">Phone</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
          </select>
        </div>

        <div class="row">
          <button
            class="btn primary"
            @click="rental.goToStep(2, { intent: 'user' })"
          >
            Next → Step 2 (Contact)
          </button>
        </div>

        <small class="muted">
          Example validator: require first/last/dob before leaving Step 1 (config in validators, not shown here).
        </small>
      </section>

      <!-- STEP 2: Contact info (external email validator used in button) -->
      <section v-else-if="rental.step === 2" aria-label="Step 2 Contact">
        <!-- COMMENT: This template shows when step === 2 (Contact details) -->
        <h3>Step 2 — Contact details</h3>

        <div class="stack">
          <label>Email</label>
          <input
            type="email"
            :value="rental.state.contact.email"
            @input="rental.setState('contact.email', $event.target.value, { reason: 'user:contact:email' })"
          />
          <small class="muted">
            Email validity is checked by an external script when you click “Next”.
          </small>
        </div>

        <div class="stack">
          <label>Mobile phone</label>
          <input
            type="tel"
            :value="rental.state.contact.mobile"
            @input="rental.setState('contact.mobile', $event.target.value, { reason: 'user:contact:mobile' })"
          />
        </div>

        <div class="stack">
          <label>Other phone</label>
          <input
            type="tel"
            :value="rental.state.contact.otherPhone"
            @input="rental.setState('contact.otherPhone', $event.target.value, { reason: 'user:contact:otherPhone' })"
          />
        </div>

        <div class="stack">
          <label>Emergency contact name</label>
          <input
            type="text"
            :value="rental.state.contact.emergencyName"
            @input="rental.setState('contact.emergencyName', $event.target.value, { reason: 'user:contact:emergencyName' })"
          />
        </div>

        <div class="stack">
          <label>Emergency contact phone</label>
          <input
            type="tel"
            :value="rental.state.contact.emergencyPhone"
            @input="rental.setState('contact.emergencyPhone', $event.target.value, { reason: 'user:contact:emergencyPhone' })"
          />
        </div>

        <div class="row">
          <button class="btn" @click="rental.goToStep(1, { intent: 'user' })">← Back</button>

          <!-- external email validator used in this button -->
          <button class="btn primary" @click="goToStep3WithEmailCheck">
            Next → Step 3 (Employment)
          </button>
        </div>
      </section>

      <!-- STEP 3: Employment & income (shared 'hasPets' toggle used again here for demo) -->
      <section v-else-if="rental.step === 3" aria-label="Step 3 Employment">
        <!-- COMMENT: This template shows when step === 3 (Employment & income) -->
        <h3>Step 3 — Employment & income</h3>

        <div class="stack">
          <label>Employment status</label>
          <select
            :value="rental.state.employment.status"
            @change="rental.setState('employment.status', $event.target.value, { reason: 'user:employment:status' })"
          >
            <option value="">Choose…</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="self-employed">Self-employed</option>
            <option value="student">Student</option>
            <option value="unemployed">Unemployed</option>
          </select>
        </div>

        <div class="stack">
          <label>Employer / Institution</label>
          <input
            type="text"
            :value="rental.state.employment.employer"
            @input="rental.setState('employment.employer', $event.target.value, { reason: 'user:employment:employer' })"
          />
        </div>

        <div class="stack">
          <label>Position</label>
          <input
            type="text"
            :value="rental.state.employment.position"
            @input="rental.setState('employment.position', $event.target.value, { reason: 'user:employment:position' })"
          />
        </div>

        <div class="stack">
          <label>Monthly income (after tax)</label>
          <input
            type="number"
            min="0"
            :value="rental.state.employment.monthlyIncome"
            @input="rental.setState('employment.monthlyIncome', Number($event.target.value || 0), { reason: 'user:employment:income' })"
          />
        </div>

        <div class="stack">
          <label>Other income sources</label>
          <textarea
            :value="rental.state.employment.otherIncome"
            @input="rental.setState('employment.otherIncome', $event.target.value, { reason: 'user:employment:otherIncome' })"
          ></textarea>
        </div>

        <!-- SHARED COMPONENT: Yes/No pets toggle appears here AND in Step 4 household -->
        <div class="stack">
          <label>Do you have pets?</label>
          <YesNoGroup
            label="Pets"
            :modelValue="rental.state.household.hasPets"
            @update:modelValue="(val) => rental.setState('household.hasPets', val, { reason: 'user:household:hasPets' })"
          />
          
        </div>

        <div class="row">
          <button class="btn" @click="rental.goToStep(2, { intent: 'user' })">← Back</button>
          <button class="btn primary" @click="rental.goToStep(4, { intent: 'user' })">
            Next → Step 4 (History & household)
          </button>
        </div>
      </section>

      <!-- STEP 4: Rental history & household (with substeps) -->
      <section v-else-if="rental.step === 4" aria-label="Step 4 History & household">
        <!-- COMMENT: This template shows when step === 4 (History & household) -->
        <h3>Step 4 — Rental history & household</h3>

        <!-- SUBSTEP: history -->
        <div v-if="!rental.substep || rental.substep === 'history'" class="stack">
          <h4>Rental history</h4>

          <div class="stack">
            <label>Current address</label>
            <input
              type="text"
              :value="rental.state.history.currentAddress"
              @input="rental.setState('history.currentAddress', $event.target.value, { reason: 'user:history:currentAddress' })"
            />
          </div>

          <div class="stack">
            <label>Current landlord name</label>
            <input
              type="text"
              :value="rental.state.history.landlordName"
              @input="rental.setState('history.landlordName', $event.target.value, { reason: 'user:history:landlordName' })"
            />
          </div>

          <div class="stack">
            <label>Current landlord phone/email</label>
            <input
              type="text"
              :value="rental.state.history.landlordContact"
              @input="rental.setState('history.landlordContact', $event.target.value, { reason: 'user:history:landlordContact' })"
            />
          </div>

          <div class="stack">
            <label>Reason for moving</label>
            <textarea
              :value="rental.state.history.reasonForMoving"
              @input="rental.setState('history.reasonForMoving', $event.target.value, { reason: 'user:history:reason' })"
            ></textarea>
          </div>
        </div>

        <!-- SUBSTEP: household -->
        <div v-else-if="rental.substep === 'household'" class="stack">
          <h4>Household</h4>

          <div class="stack">
            <label>Adults (18+)</label>
            <input
              type="number"
              min="1"
              :value="rental.state.household.adults"
              @input="rental.setState('household.adults', Number($event.target.value || 1), { reason: 'user:household:adults' })"
            />
          </div>

          <div class="stack">
            <label>Children</label>
            <input
              type="number"
              min="0"
              :value="rental.state.household.children"
              @input="rental.setState('household.children', Number($event.target.value || 0), { reason: 'user:household:children' })"
            />
          </div>

          <!-- SHARED COMPONENT: Same YesNoGroup as step 3, same data key household.hasPets -->
          <div class="stack">
            <label>Do you have pets?</label>
            <YesNoGroup
              label="Pets"
              :modelValue="rental.state.household.hasPets"
              @update:modelValue="(val) => rental.setState('household.hasPets', val, { reason: 'user:household:hasPets' })"
            />
          </div>

          <div class="stack" v-if="rental.state.household.hasPets === true">
            <label>Pet details (type, breed, size)</label>
            <textarea
              :value="rental.state.household.petsDetails"
              @input="rental.setState('household.petsDetails', $event.target.value, { reason: 'user:household:petsDetails' })"
            ></textarea>
          </div>

          <div class="stack">
            <label>Required car spaces</label>
            <input
              type="number"
              min="0"
              :value="rental.state.household.carSpaces"
              @input="rental.setState('household.carSpaces', Number($event.target.value || 0), { reason: 'user:household:carSpaces' })"
            />
          </div>
        </div>

        <!-- SUBSTEP: details (email-validated button triggers this in header) -->
        <div v-else-if="rental.substep === 'details'" class="stack">
          <h4>Extra application details</h4>

          <div class="stack">
            <label>Desired move-in date</label>
            <input
              type="date"
              :value="rental.state.preferences.moveInDate"
              @input="rental.setState('preferences.moveInDate', $event.target.value, { reason: 'user:pref:moveInDate' })"
            />
          </div>

          <div class="stack">
            <label>Desired lease length</label>
            <select
              :value="rental.state.preferences.leaseLength"
              @change="rental.setState('preferences.leaseLength', $event.target.value, { reason: 'user:pref:leaseLength' })"
            >
              <option value="">Choose…</option>
              <option value="6-months">6 months</option>
              <option value="12-months">12 months</option>
              <option value="24-months">24 months</option>
            </select>
          </div>

          <div class="stack">
            <label>Any special conditions?</label>
            <textarea
              :value="rental.state.preferences.specialConditions"
              @input="rental.setState('preferences.specialConditions', $event.target.value, { reason: 'user:pref:specialConditions' })"
            ></textarea>
          </div>
        </div>

        <div class="row">
          <button class="btn" @click="rental.goToStep(3, { intent: 'user' })">← Back</button>
          <button class="btn primary" @click="rental.goToStep(5, { intent: 'user' })">
            Next → Step 5 (Review & submit)
          </button>
        </div>
      </section>

      <!-- STEP 5: Review & submit -->
      <section v-else-if="rental.step === 5" aria-label="Step 5 Review">
        <!-- COMMENT: This template shows when step === 5 (Review & submit) -->
        <h3>Step 5 — Review & submit</h3>

        <div class="row">
          <div class="card stack" style="flex:1;">
            <b>Applicant & Contact</b>
            <pre class="log">{{ pretty({ applicant: rental.state.applicant, contact: rental.state.contact }) }}</pre>
          </div>

          <div class="card stack" style="flex:1;">
            <b>Employment & History</b>
            <pre class="log">{{ pretty({ employment: rental.state.employment, history: rental.state.history }) }}</pre>
          </div>
        </div>

        <div class="card stack">
          <b>Household & Preferences</b>
          <pre class="log">{{ pretty({ household: rental.state.household, preferences: rental.state.preferences }) }}</pre>
        </div>

        <div class="stack">
          <label>
            <input
              type="checkbox"
              :checked="rental.state.declarations.confirmAccuracy"
              @change="rental.setState('declarations.confirmAccuracy', $event.target.checked, { reason: 'user:decl:accuracy' })"
            />
            I confirm these details are accurate.
          </label>
          <label>
            <input
              type="checkbox"
              :checked="rental.state.declarations.agreePrivacy"
              @change="rental.setState('declarations.agreePrivacy', $event.target.checked, { reason: 'user:decl:privacy' })"
            />
            I agree to the privacy policy.
          </label>
        </div>

        <div class="row">
          <button class="btn" @click="rental.goToStep(4, { intent: 'user' })">
            ← Back
          </button>
          <button
            class="btn ok"
            @click="submitRental"
            :disabled="!canSubmit"
          >
            Submit application
          </button>
        </div>
      </section>

      <!-- Fallback (should never show) -->
      <section v-else>
        <h3>Unknown step {{ rental.step }}</h3>
        <button class="btn" @click="rental.forceStep(1)">Reset to Step 1</button>
      </section>
    </div>

    <!-- Debug panels -->
    <div class="row" style="margin-top:1rem;">
      <div class="card stack" style="flex:1 1 360px;">
        <div class="row">
          <b>State</b>
          <span class="badge">reactive</span>
        </div>
        <pre class="log">{{ pretty(rental.state) }}</pre>
      </div>

      <div class="card stack" style="flex:1 1 360px;">
        <div class="row">
          <b>Logs (tail)</b>
          <span class="badge">{{ rental.logs.length }}</span>
        </div>
        <pre class="log">{{ tail(rental.logs, 200).join('\n') }}</pre>
      </div>
    </div>
  </div>
</template>


<script>
import { computed, onMounted } from 'vue';
import {
    createStepStateEngine,
    attachEngineLogging,
    hydrateFromSnapshot
} from '@/utils/stateEngine'; // adjust path/alias to match your project
import YesNoGroup from '../YesNoGroup.vue';


export default
{
    name: 'RentalApplicationForm',
    setup()
    {
        const rental = createStepStateEngine(
            {
                flowId: 'rental',
                urlSync: 'query',
                initialStep: 1,
                forcePolicy: 'log',
                defaults:
                {
                    applicant:
                    {
                        first: '',
                        last: '',
                        dob: '',
                        title: ''
                    },
                    contact:
                    {
                        email: '',
                        mobile: '',
                        otherPhone: '',
                        emergencyName: '',
                        emergencyPhone: ''
                    },
                    employment:
                    {
                        status: '',
                        employer: '',
                        position: '',
                        monthlyIncome: 0,
                        otherIncome: ''
                    },
                    history:
                    {
                        currentAddress: '',
                        landlordName: '',
                        landlordContact: '',
                        reasonForMoving: ''
                    },
                    household:
                    {
                        adults: 1,
                        children: 0,
                        hasPets: null,       // shared across steps 3 & 4
                        petsDetails: '',
                        carSpaces: 0
                    },
                    preferences:
                    {
                        contactMethod: '',
                        moveInDate: '',
                        leaseLength: '',
                        specialConditions: ''
                    },
                    declarations:
                    {
                        confirmAccuracy: false,
                        agreePrivacy: false
                    }
                }
            }
        );

        attachEngineLogging(rental);

        onMounted(
            () =>
            {
                // example: hydrate from stored snapshot if available
                // const snapshotFromDbOrPinia = ...
                // if (snapshotFromDbOrPinia) hydrateFromSnapshot(rental, snapshotFromDbOrPinia);

                rental.initialize(
                    {
                        fromUrl: true
                    }
                );
            }
        );

        // computed: can submit
        const canSubmit = computed(
            () =>
            {
                return Boolean(
                    rental.state.declarations.confirmAccuracy &&
                    rental.state.declarations.agreePrivacy
                );
            }
        );

        // external email validation for Step 2 → Step 3
        function goToStep3WithEmailCheck()
        {
            const email = (rental.state.contact.email || '').trim();

            // external script: window.isEmailValidBasicThirdParty
            if (typeof window !== 'undefined' && typeof window.isEmailValidBasicThirdParty === 'function')
            {
                const ok = window.isEmailValidBasicThirdParty(email);

                if (!ok)
                {
                    alert('Please enter a valid email address before continuing.');
                    console.log('[Rental] external email validator blocked step change', email);
                    return;
                }
            }
            else
            {
                // simple fallback check
                if (!email || !email.includes('@') || !email.includes('.'))
                {
                    alert('Email looks invalid. Please check it before continuing.');
                    console.log('[Rental] basic email fallback blocked step change', email);
                    return;
                }
            }

            rental.goToStep(
                3,
                {
                    intent: 'user'
                }
            );
        }

        // external email validation used for Step 4 "details" substep
        function goToStep4DetailsWithEmailCheck()
        {
            const email = (rental.state.contact.email || '').trim();

            if (typeof window !== 'undefined' && typeof window.isEmailValidBasicThirdParty === 'function')
            {
                const ok = window.isEmailValidBasicThirdParty(email);

                if (!ok)
                {
                    alert('Email must be valid before viewing extra details.');
                    console.log('[Rental] external email validator blocked substep change', email);
                    return;
                }
            }
            else
            {
                if (!email || !email.includes('@') || !email.includes('.'))
                {
                    alert('Email looks invalid. Please fix it before viewing details.');
                    console.log('[Rental] basic email fallback blocked substep change', email);
                    return;
                }
            }

            rental.goToSubstep(
                'details',
                {
                    intent: 'user'
                }
            );
        }

        function submitRental()
        {
  const plainState = JSON.parse(JSON.stringify(rental.state));

  console.log('[RentalApplicationForm] submit payload', plainState);
  alert('Rental application submitted (demo). See console for payload.');
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

        return {
            rental,
            canSubmit,
            goToStep3WithEmailCheck,
            goToStep4DetailsWithEmailCheck,
            submitRental,
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
.btn.danger {
  background: #ef4444;
  color: white;
  border-color: #b91c1c;
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
