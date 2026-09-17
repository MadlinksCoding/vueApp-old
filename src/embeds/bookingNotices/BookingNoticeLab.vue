<template>
  <div class="notice-lab">
    <header class="notice-lab-header">
      <div>
        <p class="notice-lab-eyebrow">Local development tool</p>
        <h1>Booking Notice Test Lab</h1>
        <p>Preview notice layout, animation, stacking, and iframe behaviour using simulated data.</p>
      </div>
      <span class="notice-lab-safe">No bookings or database writes</span>
    </header>

    <aside class="notice-lab-controls" aria-label="Notice controls">
      <label>Notice
        <select v-model="selectedVariant" data-test="lab-variant">
          <option v-for="option in variants" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </label>
      <label>Viewer
        <select v-model="viewerRole">
          <option value="fan">Fan</option>
          <option value="creator">Creator</option>
        </select>
      </label>
      <label>Desktop position
        <select v-model="desktopPosition" data-test="lab-desktop-position" @change="applyConfig">
          <option v-for="position in desktopPositions" :key="position" :value="position">{{ position }}</option>
        </select>
      </label>
      <label>Mobile position
        <select v-model="mobilePosition" data-test="lab-mobile-position" @change="applyConfig">
          <option value="top">top</option>
          <option value="center">center</option>
          <option value="bottom">bottom</option>
        </select>
      </label>
      <label>Summary desktop position
        <select v-model="summaryDesktopPosition" data-test="lab-summary-desktop-position" @change="applyConfig">
          <option value="">Use global setting</option>
          <option v-for="position in desktopPositions" :key="position" :value="position">{{ position }}</option>
        </select>
      </label>
      <label>Summary mobile position
        <select v-model="summaryMobilePosition" data-test="lab-summary-mobile-position" @change="applyConfig">
          <option value="">Use global setting</option>
          <option value="top">top</option>
          <option value="center">center</option>
          <option value="bottom">bottom</option>
        </select>
      </label>
      <label>Attention
        <select v-model="attentionAnimation" data-test="lab-attention" @change="applyConfig">
          <option value="pulse">pulse</option>
          <option value="blink">blink</option>
          <option value="none">none</option>
        </select>
      </label>
      <label>Entrance
        <select v-model="entranceEffect" @change="applyConfig">
          <option value="fade">fade</option>
          <option value="slide">slide</option>
          <option value="none">none</option>
        </select>
      </label>
      <label>Exit
        <select v-model="exitEffect" @change="applyConfig">
          <option value="fade">fade</option>
          <option value="slide">slide</option>
          <option value="none">none</option>
        </select>
      </label>
      <label>Duration (seconds)
        <input v-model.number="durationSeconds" type="number" min="0" max="60" @change="applyConfig" />
      </label>
      <label>Initial delay (seconds)
        <input v-model.number="initialDelaySeconds" type="number" min="0" max="20" @change="applyConfig" />
      </label>
      <label>Items
        <input v-model.number="itemCount" type="number" min="1" max="30" />
      </label>
      <label>Maximum visible
        <input v-model.number="maxVisibleNotices" type="number" min="1" max="3" @change="applyConfig" />
      </label>
      <label class="notice-lab-check"><input v-model="longContent" type="checkbox" /> Use long text</label>
      <label class="notice-lab-check"><input v-model="mixedPositions" type="checkbox" /> Mixed positions for Show all</label>

      <div class="notice-lab-actions">
        <button type="button" class="primary" data-test="lab-show" @click="showSelected">Show notice</button>
        <button type="button" data-test="lab-show-all" @click="showAll">Show all</button>
        <button type="button" data-test="lab-update" :disabled="notices.length === 0" @click="updateCurrent">Live update</button>
        <button type="button" data-test="lab-clear" @click="clearNotices">Clear</button>
      </div>

	  <div class="notice-lab-wordpress">
		<div>
		  <strong>Test on an actual WordPress page</strong>
		  <p>This is a UI simulator, not an end-to-end booking test. Temporary feed records expire after one hour; Detail and Review do not open a real booking. Use the normal fan booking and creator Events pages to test the genuine lifecycle.</p>
		</div>
		<div class="notice-lab-actions">
		  <a :href="wordpressPreviewUrl" target="_blank" rel="noopener" data-test="lab-open-preview" @click="prepareWordPressPreview">Open preview on WordPress</a>
		  <a :href="wordpressFeedUrl" target="_blank" rel="noopener" data-test="lab-open-feed">Open feed simulator on WordPress</a>
		</div>
	  </div>
    </aside>

    <main class="notice-lab-stage">
      <section class="notice-lab-stage-card">
        <p class="notice-lab-eyebrow">WordPress page simulation</p>
        <h2>The page remains scrollable and clickable</h2>
        <p>Open the popup to confirm notices stay above it. Use the notice buttons to see their events in the log.</p>
        <button type="button" data-test="lab-popup-open" @click="popupOpen = true">Open simulated WordPress popup</button>
      </section>
      <section v-for="number in 5" :key="number" class="notice-lab-placeholder">
        <h3>Sample page section {{ number }}</h3>
        <button type="button" @click="record('page-click', { noticeId: `section-${number}` })">Test page button</button>
      </section>
    </main>

    <section class="notice-lab-log" aria-live="polite">
      <div class="notice-lab-log-heading">
        <h2>Action log</h2>
        <button type="button" @click="events = []">Clear log</button>
      </div>
      <p v-if="events.length === 0">Actions will appear here.</p>
      <ol v-else>
        <li v-for="event in events" :key="event.key"><strong>{{ event.type }}</strong> {{ event.noticeId }}</li>
      </ol>
    </section>

    <div v-if="popupOpen" class="notice-lab-modal" role="dialog" aria-modal="true" aria-label="Simulated WordPress popup">
      <div class="notice-lab-modal-panel">
        <h2>Simulated WordPress popup</h2>
        <p>The booking notices should remain above this popup.</p>
        <button type="button" data-test="lab-popup-close" @click="popupOpen = false">Close popup</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import {
  BOOKING_NOTICE_PREVIEW_STORAGE_KEY,
  LAB_NOTICE_VARIANTS,
  createAllBookingNoticeLabNotices,
  createBookingNoticeLabNotices,
  createBookingNoticePreviewPayload,
} from "./noticeLabData";

const variants = LAB_NOTICE_VARIANTS;
const desktopPositions = ["top-left", "top-center", "top-right", "center-left", "center-center", "center-right", "bottom-left", "bottom-center", "bottom-right"];
const selectedVariant = ref("booking-request");
const viewerRole = ref("creator");
const desktopPosition = ref("top-right");
const mobilePosition = ref("top");
const summaryDesktopPosition = ref("top-right");
const summaryMobilePosition = ref("bottom");
const attentionAnimation = ref("pulse");
const entranceEffect = ref("fade");
const exitEffect = ref("fade");
const durationSeconds = ref(0);
const initialDelaySeconds = ref(0);
const itemCount = ref(1);
const maxVisibleNotices = ref(3);
const longContent = ref(false);
const mixedPositions = ref(false);
const notices = ref([]);
const events = ref([]);
const popupOpen = ref(false);
const hostReady = ref(false);
let sequence = 0;
let controller;

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

const config = computed(() => ({
  desktopPosition: desktopPosition.value,
  mobilePosition: mobilePosition.value,
  attentionAnimation: attentionAnimation.value,
  entranceEffect: entranceEffect.value,
  exitEffect: exitEffect.value,
  durationSeconds: Math.max(0, Number(durationSeconds.value) || 0),
  initialDelaySeconds: Math.max(0, Number(initialDelaySeconds.value) || 0),
  maxVisibleNotices: Math.min(3, Math.max(1, Number(maxVisibleNotices.value) || 3)),
  summary: {
    perSectionLimit: 3,
    totalLimit: 6,
    showOverflow: true,
    ...(summaryDesktopPosition.value ? { desktopPosition: summaryDesktopPosition.value } : {}),
    ...(summaryMobilePosition.value ? { mobilePosition: summaryMobilePosition.value } : {}),
  },
}));

const wordpressPagePath = computed(() => viewerRole.value === "creator" ? "/dashboard/events/" : "/dashboard/overview/");
const wordpressPreviewUrl = computed(() => `${wordpressPagePath.value}?fs-notice-test=1&fs-notice-mode=preview`);
const wordpressFeedUrl = computed(() => `${wordpressPagePath.value}?fs-notice-test=1&fs-notice-mode=feed`);

function assetUrl(name) {
  return new URL(`./${name}`, window.location.href).href;
}

function loadHostAssets() {
  if (!document.querySelector('link[data-notice-lab-host-css]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = assetUrl("fs-events-host.css");
    link.dataset.noticeLabHostCss = "true";
    document.head.appendChild(link);
  }
  if (window.FSEventsEmbed?.mountBookingNotices) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-notice-lab-host-js]');
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = assetUrl("fs-events-host.js");
    script.dataset.noticeLabHostJs = "true";
    script.addEventListener("load", resolve, { once: true });
    script.addEventListener("error", reject, { once: true });
    document.head.appendChild(script);
  });
}

function record(type, payload = {}) {
  events.value.unshift({ key: `${Date.now()}-${events.value.length}`, type, noticeId: payload.noticeId || "" });
}

function mountHost() {
  controller?.destroy();
  controller = window.FSEventsEmbed.mountBookingNotices({
    src: assetUrl("notices.html"),
    targetOrigin: window.location.origin,
    notices: plain(notices.value),
    config: plain(config.value),
    onReady: () => { hostReady.value = true; record("iframe-ready"); },
    onClose: (payload) => record("close", payload),
    onPrimaryAction: (payload) => record("primary-action", payload),
    onDetail: (payload) => record("detail", payload),
    onJoin: (payload) => record("join", payload),
  });
}

function fixtureOptions() {
  return { sequence: ++sequence, viewerRole: viewerRole.value, itemCount: itemCount.value, longContent: longContent.value, mixedPositions: mixedPositions.value };
}

function showSelected() {
  notices.value = createBookingNoticeLabNotices(selectedVariant.value, fixtureOptions());
  controller?.update({ notices: plain(notices.value) });
  record(notices.value.length ? "show" : "role-filtered", { noticeId: notices.value[0]?.id || selectedVariant.value });
}

function showAll() {
  notices.value = createAllBookingNoticeLabNotices(fixtureOptions());
  controller?.update({ notices: plain(notices.value) });
  record("show-all", { noticeId: `${notices.value.length} notices` });
}

function updateCurrent() {
  sequence += 1;
  notices.value = notices.value.map((notice, index) => ({
    ...notice,
    heading: index === 0 ? `Live update ${sequence}: ${notice.heading || "booking activity"}` : notice.heading,
    items: (notice.items || []).map((item) => ({ ...item, title: `${item.title} · updated ${sequence}` })),
  }));
  controller?.update({ notices: plain(notices.value) });
  record("live-update", { noticeId: notices.value[0]?.id });
}

function clearNotices() {
  notices.value = [];
  controller?.update({ notices: [] });
  record("clear");
}

function prepareWordPressPreview() {
  if (notices.value.length === 0) {
    notices.value = createBookingNoticeLabNotices(selectedVariant.value, fixtureOptions());
  }
  const payload = createBookingNoticePreviewPayload(plain(notices.value), plain(config.value), viewerRole.value);
  localStorage.setItem(BOOKING_NOTICE_PREVIEW_STORAGE_KEY, JSON.stringify(payload));
  record("wordpress-preview-saved", { noticeId: `${payload.notices.length} notices` });
}

function applyConfig() {
  controller?.setConfig(plain(config.value));
  record("config-update");
}

onMounted(async () => {
  try {
    await loadHostAssets();
    mountHost();
  } catch (_error) {
    record("host-load-failed");
  }
});

onBeforeUnmount(() => controller?.destroy());
</script>

<style>
html, body, #booking-notices-lab { margin: 0; min-height: 100%; }
body { background: #f7f8fa; color: #101828; font-family: Poppins, sans-serif; }
.notice-lab { min-height: 100vh; }
.notice-lab-header { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; padding: 1.5rem 2rem; background: #101828; color: white; }
.notice-lab-header h1 { margin: .125rem 0 .25rem; font-size: 1.5rem; }
.notice-lab-header p { margin: 0; color: #d0d5dd; }
.notice-lab-eyebrow { margin: 0; color: #0e9384 !important; font-size: .75rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.notice-lab-safe { border: 1px solid #32d583; border-radius: 999px; padding: .4rem .75rem; color: #6ce9a6; font-size: .75rem; white-space: nowrap; }
.notice-lab-controls { position: sticky; top: 0; z-index: 10; display: grid; grid-template-columns: repeat(7, minmax(8rem, 1fr)); gap: .75rem; padding: 1rem 2rem; border-bottom: 1px solid #d0d5dd; background: rgba(255, 255, 255, .97); box-shadow: 0 4px 16px rgba(16, 24, 40, .08); }
.notice-lab-controls label { display: flex; flex-direction: column; gap: .25rem; color: #475467; font-size: .72rem; font-weight: 600; }
.notice-lab-controls select, .notice-lab-controls input[type="number"] { min-height: 2.25rem; border: 1px solid #d0d5dd; border-radius: .4rem; background: white; padding: .35rem .5rem; color: #101828; }
.notice-lab-controls .notice-lab-check { flex-direction: row; align-items: center; }
.notice-lab-actions { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: .5rem; }
.notice-lab button, .notice-lab-actions a { border: 1px solid #d0d5dd; border-radius: .4rem; background: white; padding: .55rem .85rem; color: #344054; font-weight: 600; text-decoration: none; cursor: pointer; }
.notice-lab button.primary { border-color: #f06; background: #f06; color: white; }
.notice-lab button:disabled { cursor: not-allowed; opacity: .45; }
.notice-lab-wordpress { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; gap: 1rem; border-top: 1px solid #eaecf0; padding-top: .75rem; }
.notice-lab-wordpress p { margin: .2rem 0 0; color: #667085; font-size: .72rem; font-weight: 400; }
.notice-lab-stage { display: flex; min-height: 100rem; flex-direction: column; gap: 2rem; padding: 2rem; background: linear-gradient(#f7f8fa, #eef2f6); }
.notice-lab-stage-card, .notice-lab-placeholder { max-width: 48rem; border: 1px solid #eaecf0; border-radius: .75rem; background: white; padding: 1.5rem; box-shadow: 0 2px 8px rgba(16, 24, 40, .05); }
.notice-lab-stage-card h2, .notice-lab-placeholder h3 { margin: .4rem 0; }
.notice-lab-log { position: fixed; right: 1rem; bottom: 1rem; z-index: 20; width: min(22rem, calc(100vw - 2rem)); max-height: 12rem; overflow: auto; border: 1px solid #d0d5dd; border-radius: .75rem; background: rgba(255, 255, 255, .96); padding: .75rem; box-shadow: 0 8px 24px rgba(16, 24, 40, .18); }
.notice-lab-log-heading { display: flex; align-items: center; justify-content: space-between; }
.notice-lab-log h2 { margin: 0; font-size: 1rem; }
.notice-lab-log p, .notice-lab-log ol { margin: .5rem 0 0; font-size: .75rem; }
.notice-lab-modal { position: fixed; inset: 0; z-index: 2147483000; display: flex; align-items: center; justify-content: center; background: rgba(16, 24, 40, .72); }
.notice-lab-modal-panel { width: min(32rem, calc(100vw - 2rem)); border-radius: 1rem; background: white; padding: 2rem; box-shadow: 0 24px 48px rgba(16, 24, 40, .35); }
.notice-lab-blocked { max-width: 40rem; margin: 8rem auto; padding: 2rem; font-family: sans-serif; }
@media (max-width: 1100px) { .notice-lab-controls { grid-template-columns: repeat(4, minmax(8rem, 1fr)); } }
@media (max-width: 700px) {
  .notice-lab-header { align-items: flex-start; flex-direction: column; padding: 1rem; }
  .notice-lab-controls { position: relative; grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 1rem; }
	.notice-lab-wordpress { align-items: flex-start; flex-direction: column; }
  .notice-lab-stage { padding: 1rem; }
}
</style>
