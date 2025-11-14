<template>
  <div class="page stack" data-component-path="examples/NestedTabsAccordionsExample.vue">
    <!-- Header / debug -->
    <div class="card row" style="align-items: center;">
      <h2 style="margin: 0;">Nested Tabs & Accordions Example</h2>

      <span class="badge">Step: {{ engine.step }}</span>
      <span class="badge">Sub: {{ engine.substep || '—' }}</span>

      <span class="badge">
        Outer: {{ engine.state.ui.outerTab || 'none' }},
        Inner: {{ engine.state.ui.innerTab || 'none' }},
        Inner²: {{ engine.state.ui.innerInnerTab || 'none' }}
      </span>

      <span class="badge">
        Acc: {{ engine.state.ui.accordionMain || 'none' }},
        Nested: {{ engine.state.ui.accordionNested || 'none' }}
      </span>

      <span style="margin-left: auto;" class="row">
        <button class="btn" @click="engine.forceStep(1)">Step 1</button>
        <button class="btn" @click="engine.forceStep(2)">Step 2</button>
        <button class="btn" @click="resetUi">Reset UI</button>
      </span>
    </div>

    <!-- STEP 1: Outer tabs with inner tabs + nested accordions -->
    <div
      v-if="engine.step === 1"
      class="card stack"
      data-component-path="examples/NestedTabsAccordionsExample.vue:Step1"
    >
      <h3>Step 1 — Outer Tabs + Inner Tabs + Nested Accordions</h3>

      <!-- OUTER TABS -->
      <div class="row tabs">
        <button
          class="btn"
          :class="{ active: engine.state.ui.outerTab === 'info' }"
          @click="setOuterTab('info')"
        >
          Info
        </button>
        <button
          class="btn"
          :class="{ active: engine.state.ui.outerTab === 'settings' }"
          @click="setOuterTab('settings')"
        >
          Settings
        </button>
        <button
          class="btn"
          :class="{ active: engine.state.ui.outerTab === 'advanced' }"
          @click="setOuterTab('advanced')"
        >
          Advanced
        </button>
      </div>

      <!-- OUTER TAB: INFO -->
      <section v-if="engine.state.ui.outerTab === 'info'" class="stack">
        <h4>Outer Tab: Info</h4>

        <!-- INNER TABS under INFO -->
        <div class="row tabs small">
          <button
            class="btn"
            :class="{ active: engine.state.ui.innerTab === 'overview' }"
            @click="setInnerTab('overview')"
          >
            Overview
          </button>
          <button
            class="btn"
            :class="{ active: engine.state.ui.innerTab === 'details' }"
            @click="setInnerTab('details')"
          >
            Details
          </button>
          <button
            class="btn"
            :class="{ active: engine.state.ui.innerTab === 'history' }"
            @click="setInnerTab('history')"
          >
            History
          </button>
        </div>

        <!-- INNER TAB PANELS for INFO -->
        <div v-if="engine.state.ui.innerTab === 'overview'" class="stack">
          <p>This is the overview panel.</p>
          <p>Try switching inner tabs and notice state persists even if you change step.</p>
        </div>

        <div v-else-if="engine.state.ui.innerTab === 'details'" class="stack">
          <p>Details tab under Info.</p>

          <!-- MAIN ACCORDION -->
          <div class="accordion">
            <button
              class="accordion-header"
              :class="{ open: engine.state.ui.accordionMain === 'a' }"
              @click="toggleAccordionMain('a')"
            >
              Main Section A
            </button>
            <div v-if="engine.state.ui.accordionMain === 'a'" class="accordion-body">
              <p>This is Main Section A content.</p>

              <!-- NESTED ACCORDION INSIDE MAIN A -->
              <div class="accordion nested">
                <button
                  class="accordion-header nested"
                  :class="{ open: engine.state.ui.accordionNested === 'a1' }"
                  @click="toggleAccordionNested('a1')"
                >
                  Nested Item A.1
                </button>
                <div v-if="engine.state.ui.accordionNested === 'a1'" class="accordion-body nested">
                  <p>Nested content A.1</p>
                  <p>State key: ui.accordionNested = "a1"</p>
                </div>

                <button
                  class="accordion-header nested"
                  :class="{ open: engine.state.ui.accordionNested === 'a2' }"
                  @click="toggleAccordionNested('a2')"
                >
                  Nested Item A.2
                </button>
                <div v-if="engine.state.ui.accordionNested === 'a2'" class="accordion-body nested">
                  <p>Nested content A.2</p>
                  <p>State key: ui.accordionNested = "a2"</p>
                </div>
              </div>
            </div>

            <button
              class="accordion-header"
              :class="{ open: engine.state.ui.accordionMain === 'b' }"
              @click="toggleAccordionMain('b')"
            >
              Main Section B
            </button>
            <div v-if="engine.state.ui.accordionMain === 'b'" class="accordion-body">
              <p>This is Main Section B content.</p>
              <p>No nested accordion here, but you could add another.</p>
            </div>
          </div>
        </div>

        <div v-else-if="engine.state.ui.innerTab === 'history'" class="stack">
          <p>History for Info panel.</p>
          <p>Outer = info, Inner = history.</p>
        </div>
      </section>

      <!-- OUTER TAB: SETTINGS -->
      <section v-else-if="engine.state.ui.outerTab === 'settings'" class="stack">
        <h4>Outer Tab: Settings</h4>

        <!-- Inner inner tabs under Settings (tabs in tabs in tabs) -->
        <div class="row tabs small">
          <button
            class="btn"
            :class="{ active: engine.state.ui.innerInnerTab === 'general' }"
            @click="setInnerInnerTab('general')"
          >
            General
          </button>
          <button
            class="btn"
            :class="{ active: engine.state.ui.innerInnerTab === 'notifications' }"
            @click="setInnerInnerTab('notifications')"
          >
            Notifications
          </button>
          <button
            class="btn"
            :class="{ active: engine.state.ui.innerInnerTab === 'security' }"
            @click="setInnerInnerTab('security')"
          >
            Security
          </button>
        </div>

        <div v-if="engine.state.ui.innerInnerTab === 'general'" class="stack">
          <p>Settings / General.</p>
          <label>
            <input
              type="checkbox"
              :checked="engine.state.settings.darkMode"
              @change="engine.setState('settings.darkMode', $event.target.checked, { reason: 'user:darkMode' })"
            />
            Dark mode (just a demo flag in state)
          </label>
        </div>

        <div v-else-if="engine.state.ui.innerInnerTab === 'notifications'" class="stack">
          <p>Settings / Notifications.</p>
          <label>
            <input
              type="checkbox"
              :checked="engine.state.settings.email"
              @change="engine.setState('settings.email', $event.target.checked, { reason: 'user:emailNotif' })"
            />
            Email notifications
          </label>
          <label>
            <input
              type="checkbox"
              :checked="engine.state.settings.sms"
              @change="engine.setState('settings.sms', $event.target.checked, { reason: 'user:smsNotif' })"
            />
            SMS notifications
          </label>
        </div>

        <div v-else-if="engine.state.ui.innerInnerTab === 'security'" class="stack">
          <p>Settings / Security.</p>
          <p>Example of toggles stored in engine.state.security.*</p>
          <label>
            <input
              type="checkbox"
              :checked="engine.state.security.twoFactor"
              @change="engine.setState('security.twoFactor', $event.target.checked, { reason: 'user:2fa' })"
            />
            Two-factor authentication
          </label>
        </div>
      </section>

      <!-- OUTER TAB: ADVANCED -->
      <section v-else-if="engine.state.ui.outerTab === 'advanced'" class="stack">
        <h4>Outer Tab: Advanced</h4>
        <p>
          This section just shows a read-only dump of UI state.
          Try clicking tabs and accordions, then come back here.
        </p>
        <pre class="log">{{ pretty(engine.state.ui) }}</pre>
      </section>

      <!-- Default if no outer tab set -->
      <section v-else class="stack">
        <h4>No outer tab selected</h4>
        <p>Click any outer tab above to start.</p>
      </section>

      <small class="muted">
        All tabs & accordions are driven solely by <code>engine.state.ui.*</code>.
        Step changes will not reset this unless you call <code>resetUi()</code>.
      </small>
    </div>

    <!-- STEP 2: Show state & logs but different headings/colors to prove step-based UI -->
    <div
      v-else-if="engine.step === 2"
      class="card stack"
      data-component-path="examples/NestedTabsAccordionsExample.vue:Step2"
    >
      <h3 style="color: #2563eb;">Step 2 — Same State, Different UI</h3>
      <p>
        This step shows that your nested tabs/accordions state is still there,
        even though we changed step.
      </p>

      <div class="row">
        <div class="card stack" style="flex: 1 1 0;">
          <b>UI State</b>
          <pre class="log">{{ pretty(engine.state.ui) }}</pre>
        </div>

        <div class="card stack" style="flex: 1 1 0;">
          <b>Settings + Security</b>
          <pre class="log">{{ pretty({ settings: engine.state.settings, security: engine.state.security }) }}</pre>
        </div>
      </div>

      <button class="btn" @click="engine.goToStep(1, { intent: 'user' })">
        ← Back to Step 1 (tabs/accordions)
      </button>
    </div>

    <!-- Debug logs -->
    <div class="card stack" style="margin-top: 1rem;">
      <div class="row">
        <b>Engine Logs (tail)</b>
        <span class="badge">{{ engine.logs.length }}</span>
      </div>
      <pre class="log">{{ tail(engine.logs, 200).join('\n') }}</pre>
    </div>
  </div>
</template>

<script>
import { onMounted } from 'vue';
import {
    createStepStateEngine,
    attachEngineLogging
} from '@/utils/stateEngine';

export default
{
    name: 'NestedTabsAccordionsExample',

    setup()
    {
        const engine = createStepStateEngine(
            {
                flowId: 'nestedDemo',
                urlSync: 'query',
                initialStep: 1,
                forcePolicy: 'log',
                defaults:
                {
                    ui:
                    {
                        outerTab: 'info',        // 'info' | 'settings' | 'advanced'
                        innerTab: 'overview',    // 'overview' | 'details' | 'history'
                        innerInnerTab: 'general',// 'general' | 'notifications' | 'security'
                        accordionMain: null,     // 'a' | 'b' | null
                        accordionNested: null    // 'a1' | 'a2' | null
                    },
                    settings:
                    {
                        darkMode: false,
                        email: true,
                        sms: false
                    },
                    security:
                    {
                        twoFactor: false
                    }
                }
            }
        );

        attachEngineLogging(engine);

        onMounted(
            () =>
            {
                engine.initialize(
                    {
                        fromUrl: true
                    }
                );
            }
        );

        function setOuterTab(tab)
        {
            engine.setState(
                'ui.outerTab',
                tab,
                {
                    reason: 'user:outerTab'
                }
            );

            // When changing outer tab, you might want to adjust inner tab defaults
            if (tab === 'info' && !engine.state.ui.innerTab)
            {
                engine.setState(
                    'ui.innerTab',
                    'overview',
                    {
                        reason: 'auto:innerTab'
                    }
                );
            }

            if (tab === 'settings' && !engine.state.ui.innerInnerTab)
            {
                engine.setState(
                    'ui.innerInnerTab',
                    'general',
                    {
                        reason: 'auto:innerInnerTab'
                    }
                );
            }
        }

        function setInnerTab(tab)
        {
            engine.setState(
                'ui.innerTab',
                tab,
                {
                    reason: 'user:innerTab'
                }
            );
        }

        function setInnerInnerTab(tab)
        {
            engine.setState(
                'ui.innerInnerTab',
                tab,
                {
                    reason: 'user:innerInnerTab'
                }
            );
        }

        function toggleAccordionMain(section)
        {
            const current = engine.state.ui.accordionMain;

            engine.setState(
                'ui.accordionMain',
                current === section ? null : section,
                {
                    reason: 'user:accordionMain'
                }
            );
        }

        function toggleAccordionNested(section)
        {
            const current = engine.state.ui.accordionNested;

            engine.setState(
                'ui.accordionNested',
                current === section ? null : section,
                {
                    reason: 'user:accordionNested'
                }
            );
        }

        function resetUi()
        {
            engine.setState(
                'ui.outerTab',
                'info',
                {
                    reason: 'reset:outerTab'
                }
            );

            engine.setState(
                'ui.innerTab',
                'overview',
                {
                    reason: 'reset:innerTab'
                }
            );

            engine.setState(
                'ui.innerInnerTab',
                'general',
                {
                    reason: 'reset:innerInnerTab'
                }
            );

            engine.setState(
                'ui.accordionMain',
                null,
                {
                    reason: 'reset:accordionMain'
                }
            );

            engine.setState(
                'ui.accordionNested',
                null,
                {
                    reason: 'reset:accordionNested'
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

        return {
            engine,
            setOuterTab,
            setInnerTab,
            setInnerInnerTab,
            toggleAccordionMain,
            toggleAccordionNested,
            resetUi,
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
.btn.active {
  background: #111827;
  color: #f9fafb;
}
.tabs.small .btn {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
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
.accordion {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}
.accordion-header {
  width: 100%;
  text-align: left;
  padding: 0.4rem 0.6rem;
  border: none;
  background: #f3f4f6;
  cursor: pointer;
  font-size: 0.85rem;
}
.accordion-header.open {
  background: #e5e7eb;
  font-weight: 600;
}
.accordion-body {
  padding: 0.5rem 0.75rem;
  border-top: 1px solid #e5e7eb;
}
.accordion.nested {
  margin-top: 0.5rem;
  border-color: #cbd5f5;
}
.accordion-header.nested {
  background: #e5e7ff;
}
.accordion-header.nested.open {
  background: #d1d5ff;
}
.accordion-body.nested {
  background: #f9fafb;
}
</style>

