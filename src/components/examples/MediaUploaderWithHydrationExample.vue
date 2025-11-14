<template>
  <div class="page stack" data-component-path="examples/MediaUploaderWithHydrationExample.vue">
    <!-- Header / debug bar -->
    <div class="card row" style="align-items:center; gap:0.75rem;">
      <h2 style="margin:0;">Media Uploader (DB Hydration Example)</h2>

      <span class="badge">Step: {{ engine.step }}</span>
      <span class="badge">Sub: {{ engine.substep || '—' }}</span>
      <span class="badge">Status: {{ engine.state.status }}</span>
      <span class="badge">{{ engine.state.percentage }}%</span>

      <span style="margin-left:auto;" class="row">
        <button class="btn" @click="engine.forceStep(1)">Force 1</button>
        <button class="btn" @click="engine.forceStep(2)">Force 2</button>
        <button class="btn" @click="engine.forceStep(3)">Force 3</button>
        <button class="btn" @click="engine.forceStep(4)">Force 4</button>
        <button class="btn primary" @click="engine.forceStep(5)">Force 5</button>
      </span>
    </div>

    <!-- Controls to demo DB hydration/saving -->
    <div class="card row" data-component-path="examples/MediaUploaderWithHydrationExample.vue:HydrationControls">
      <button class="btn" @click="loadFromDb">Reload from DB snapshot</button>
      <button class="btn" @click="saveToDb">Save snapshot to DB</button>
      <button class="btn" @click="engine.initializeFromState()">initializeFromState()</button>
      <span class="muted">Upload ID: {{ uploadId }}</span>
    </div>

    <!-- STEP 1: Select file -->
    <div
      v-if="engine.step === 1"
      class="card stack"
      data-component-path="examples/MediaUploaderWithHydrationExample.vue:Step1Select"
    >
      <h3>Step 1 — Select file</h3>

      <div class="stack">
        <label>Choose media file</label>
        <input
          type="file"
          @change="onFileSelected"
          :disabled="engine.state.status === 'uploading'"
        />
        <p class="muted">
          Selected: {{ engine.state.fileMeta?.name || 'none' }} ({{ engine.state.fileMeta?.size || 0 }} bytes)
        </p>
      </div>

      <div class="row">
        <button
          class="btn primary"
          @click="engine.goToStep(2, { intent: 'user' })"
          :disabled="!engine.state.fileMeta"
        >
          Next → Details
        </button>
      </div>

      <small class="muted">
        In real usage, you would validate file type/size here using validators or external utilities.
      </small>
    </div>

    <!-- STEP 2: Enter details -->
    <div
      v-else-if="engine.step === 2"
      class="card stack"
      data-component-path="examples/MediaUploaderWithHydrationExample.vue:Step2Details"
    >
      <h3>Step 2 — Details</h3>

      <div class="stack">
        <label>Title</label>
        <input
          type="text"
          :value="engine.state.details.title"
          @input="engine.setState('details.title', $event.target.value, { reason: 'user:title' })"
        />
      </div>

      <div class="stack">
        <label>Description</label>
        <textarea
          :value="engine.state.details.description"
          @input="engine.setState('details.description', $event.target.value, { reason: 'user:description' })"
        ></textarea>
      </div>

      <div class="stack">
        <label>Category</label>
        <select
          :value="engine.state.details.category"
          @change="engine.setState('details.category', $event.target.value, { reason: 'user:category' })"
        >
          <option value="">Choose…</option>
          <option value="photo">Photo</option>
          <option value="video">Video</option>
          <option value="audio">Audio</option>
          <option value="document">Document</option>
        </select>
      </div>

      <div class="row">
        <button class="btn" @click="engine.goToStep(1, { intent: 'user' })">← Back</button>
        <button
          class="btn primary"
          @click="engine.goToStep(3, { intent: 'user' })"
          :disabled="!engine.state.details.title"
        >
          Next → Upload
        </button>
      </div>

      <small class="muted">
        Title is required before moving to next step. You could enforce this via a validator.
      </small>
    </div>

    <!-- STEP 3: Upload (simulated) -->
    <div
      v-else-if="engine.step === 3"
      class="card stack"
      data-component-path="examples/MediaUploaderWithHydrationExample.vue:Step3Upload"
    >
      <h3>Step 3 — Upload</h3>

      <p class="muted">
        Status: <b>{{ engine.state.status }}</b> — {{ engine.state.percentage }}%
      </p>

      <div class="stack">
        <div class="progress-bar">
          <div
            class="progress-bar-inner"
            :style="{ width: engine.state.percentage + '%' }"
          ></div>
        </div>

        <div class="row">
          <button
            class="btn"
            @click="startFakeUpload"
            :disabled="engine.state.status === 'uploading'"
          >
            Start fake upload
          </button>
          <button class="btn" @click="setPercentage(25)">25%</button>
          <button class="btn" @click="setPercentage(50)">50%</button>
          <button class="btn" @click="setPercentage(100)">100%</button>
        </div>
      </div>

      <div class="row">
        <button class="btn" @click="engine.goToStep(2, { intent: 'user' })" :disabled="engine.state.status === 'uploading'">
          ← Back
        </button>
        <button
          class="btn primary"
          @click="engine.goToStep(4, { intent: 'user' })"
          :disabled="engine.state.percentage < 100"
        >
          Next → Review
        </button>
      </div>

      <small class="muted">
        In real usage, you would wire this to actual upload logic and update status/percentage from progress events.
      </small>
    </div>

    <!-- STEP 4: Review -->
    <div
      v-else-if="engine.step === 4"
      class="card stack"
      data-component-path="examples/MediaUploaderWithHydrationExample.vue:Step4Review"
    >
      <h3>Step 4 — Review</h3>

      <div class="stack">
        <b>File</b>
        <pre class="log">{{ pretty(engine.state.fileMeta) }}</pre>
      </div>

      <div class="stack">
        <b>Details</b>
        <pre class="log">{{ pretty(engine.state.details) }}</pre>
      </div>

      <p class="muted">
        Status: {{ engine.state.status }} — {{ engine.state.percentage }}%
      </p>

      <div class="row">
        <button class="btn" @click="engine.goToStep(3, { intent: 'user' })">← Back</button>
        <button class="btn ok" @click="finalizeUpload">Confirm & finish</button>
      </div>
    </div>

    <!-- STEP 5: Done -->
    <div
      v-else-if="engine.step === 5"
      class="card stack"
      data-component-path="examples/MediaUploaderWithHydrationExample.vue:Step5Done"
    >
      <h3>Step 5 — Done</h3>
      <p>Your media has been uploaded (demo). You can safely close this or start another upload.</p>

      <div class="stack">
        <b>Final state snapshot</b>
        <pre class="log">{{ pretty(engine.state) }}</pre>
      </div>

      <button class="btn" @click="resetFlow">Start new upload</button>
    </div>

    <!-- Fallback -->
    <div v-else class="card stack">
      <h3>Unknown step {{ engine.step }}</h3>
      <button class="btn" @click="engine.forceStep(1)">Reset to Step 1</button>
    </div>

    <!-- Debug logs -->
    <div class="card stack" style="margin-top:1rem;">
      <div class="row">
        <b>Engine Logs (tail)</b>
        <span class="badge">{{ engine.logs.length }}</span>
      </div>
      <pre class="log">{{ tail(engine.logs, 200).join('\n') }}</pre>
    </div>
  </div>
</template>

<script>
import { onMounted, ref } from 'vue';
import {
    createStepStateEngine,
    attachEngineLogging,
    hydrateFromSnapshot
} from '@/utils/stateEngine';

export default
{
    name: 'MediaUploaderWithHydrationExample',

    setup()
    {
        const uploadId = ref('upload-123'); // in reality this would be dynamic per upload

        const engine = createStepStateEngine(
            {
                flowId: 'mediaUploadDemo',
                urlSync: 'query',
                initialStep: 1,
                forcePolicy: 'log',
                defaults:
                {
                    status: 'ready', // 'ready' | 'uploading' | 'complete' | 'error'
                    percentage: 0,
                    fileMeta: null, // { name, size, type }
                    details:
                    {
                        title: '',
                        description: '',
                        category: ''
                    },
                    // anything else needed for UI-only flags
                    ui:
                    {
                        lastSavedAt: null
                    }
                }
            }
        );

        attachEngineLogging(engine);

        onMounted(
            async () =>
            {
                // On mount, try hydrating from DB; if nothing, fallback to URL/defaults
                const snapshot = await fetchSnapshotFromDb(uploadId.value);

                if (snapshot)
                {
                    hydrateFromSnapshot(engine, snapshot);
                }
                else
                {
                    engine.initialize(
                        {
                            fromUrl: true
                        }
                    );
                }
            }
        );

        // -----------------------
        // DB helpers (mocked)
        // -----------------------
        async function fetchSnapshotFromDb(id)
        {
            console.log('[MediaUploaderDemo] fetchSnapshotFromDb', id);

            // In a real app this would be a fetch('/api/media-state?id=...')
            // For demo, we simulate "no snapshot":
            // return null;

            // Or simulate a previously saved snapshot:
            // return {
            //   state: {
            //     status: 'complete',
            //     percentage: 100,
            //     fileMeta: { name: 'demo.png', size: 12345, type: 'image/png' },
            //     details: { title: 'From DB', description: 'Loaded from DB', category: 'photo' },
            //     ui: { lastSavedAt: '2025-11-13T10:00:00Z' }
            //   },
            //   step: 4,
            //   substep: null
            // };

            return null;
        }

        async function saveSnapshotToDb(id, snapshot)
        {
            console.log('[MediaUploaderDemo] saveSnapshotToDb', id, snapshot);
            // Real app: await fetch('/api/media-state?id=' + id, { method:'POST', body: JSON.stringify(snapshot) });
        }

        async function loadFromDb()
        {
            const snapshot = await fetchSnapshotFromDb(uploadId.value);

            if (!snapshot)
            {
                alert('No snapshot found in DB (demo returns null).');
                return;
            }

            hydrateFromSnapshot(engine, snapshot);
        }

        async function saveToDb()
        {
            const payload =
            {
                state: structuredClone(engine.state),
                step: engine.step,
                substep: engine.substep
            };

            engine.setState(
                'ui.lastSavedAt',
                new Date().toISOString(),
                {
                    reason: 'save:db'
                }
            );

            await saveSnapshotToDb(uploadId.value, payload);
            alert('Snapshot saved to DB (demo logs to console).');
        }

        // -----------------------
        // Flow helpers
        // -----------------------
        function onFileSelected(event)
        {
            const file = event.target.files?.[0];

            if (!file)
            {
                engine.setState(
                    'fileMeta',
                    null,
                    {
                        reason: 'user:file:none'
                    }
                );

                return;
            }

            engine.setState(
                'fileMeta',
                {
                    name: file.name,
                    size: file.size,
                    type: file.type
                },
                {
                    reason: 'user:file:selected'
                }
            );

            engine.setState(
                'status',
                'ready',
                {
                    reason: 'user:file:selected'
                }
            );

            engine.setState(
                'percentage',
                0,
                {
                    reason: 'user:file:selected'
                }
            );
        }

        function startFakeUpload()
        {
            engine.setState(
                'status',
                'uploading',
                {
                    reason: 'user:upload:start'
                }
            );

            // No timers here; just bump to 100% instantly for demo.
            engine.setState(
                'percentage',
                100,
                {
                    reason: 'user:upload:complete'
                }
            );

            engine.setState(
                'status',
                'complete',
                {
                    reason: 'user:upload:complete'
                }
            );
        }

        function setPercentage(percent)
        {
            const clamped = Math.max(0, Math.min(100, Number(percent) || 0));

            engine.setState(
                'percentage',
                clamped,
                {
                    reason: 'user:upload:setPercent'
                }
            );

            engine.setState(
                'status',
                clamped >= 100 ? 'complete' : 'uploading',
                {
                    reason: 'user:upload:setStatus'
                }
            );
        }

        function finalizeUpload()
        {
            // In real life: POST final payload to your API.
            const plainState = JSON.parse(JSON.stringify(engine.state));
            console.log('[MediaUploaderDemo] finalizeUpload payload',plainState);
            alert('Submitted (demo only) — check console for payload.');

            engine.goToStep(
                5,
                {
                    intent: 'user'
                }
            );
        }

        function resetFlow()
        {
            // simplest reset: replace state via defaults, then re-init
            // engine.resetToDefaults();
            engine.forceStep(
                1,
                {
                    intent: 'system'
                }
            );
            engine.initializeFromState();
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
            uploadId,
            onFileSelected,
            startFakeUpload,
            setPercentage,
            finalizeUpload,
            resetFlow,
            loadFromDb,
            saveToDb,
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
.progress-bar {
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background: #e5e7eb;
  overflow: hidden;
}
.progress-bar-inner {
  height: 100%;
  background: #2563eb;
  transition: width 0.2s ease;
}
</style>
