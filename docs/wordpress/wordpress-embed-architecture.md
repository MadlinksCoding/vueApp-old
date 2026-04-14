# WordPress Embed Architecture

## Purpose

This document explains how the WordPress-facing embed system is built inside the `frontend` app.

It is **not** a deployment or integration guide. The goal is to explain:

- what was extracted from the main Vue app
- how the iframe entry points are built
- how WordPress talks to the iframe apps
- how the shared Vue features are reused
- where to change things when the embed behavior needs to evolve

The current system supports two iframe surfaces:

1. `dashboard.html`
   Used for the events dashboard embed and the embedded create-event flow.
2. `fan-booking.html`
   Used for the one-on-one fan booking popup embed.

Both are emitted into the same deploy folder:

- `bookings-embed/`
- `assets/booking/`

That was intentional, so WordPress only needs to copy two directories after a build.

---

## High-Level Architecture

The embed system has 4 layers:

1. Build layer
   Vite builds extra HTML entry points in addition to the normal app.
2. Host layer
   A plain browser script creates iframes, sends bootstrap data, and handles callbacks.
3. Embed app layer
   Small Vue apps mounted inside the iframe pages.
4. Shared feature layer
   Reused Vue feature components extracted from the normal app.

The data flow is:

1. WordPress page loads `fs-events-host.js`
2. Host script creates an iframe pointing at `dashboard.html` or `fan-booking.html`
3. Bootstrap data is sent in 2 ways:
   - query string fallback
   - `postMessage` bootstrap after child-ready handshake
4. The iframe app normalizes the bootstrap data into reactive state
5. The iframe app renders a shared feature component
6. Child iframe sends events back to the parent when needed

---

## Build Outputs

### Vite entry points

The build is configured in [`frontend/vite.config.js`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/vite.config.js).

The important Rollup inputs are:

- `index.html`
- `bookings-embed/dashboard.html`
- `bookings-embed/fan-booking.html`

Relevant section:

- [`frontend/vite.config.js`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/vite.config.js)

### Output shape

The build emits:

- `dist/bookings-embed/dashboard.html`
- `dist/bookings-embed/fan-booking.html`
- `dist/bookings-embed/fs-events-host.js`
- `dist/bookings-embed/fs-events-host.css`
- `dist/assets/booking/*`

Assets are forced into `assets/booking` via:

- `chunkFileNames`
- `entryFileNames`
- `assetFileNames`

This is why WordPress only needs to copy:

- `frontend/dist/bookings-embed`
- `frontend/dist/assets/booking`

### Base path

For production builds, the default public base is:

- `/wp-content/plugins/fansocial/`

That means built asset URLs resolve under:

- `/wp-content/plugins/fansocial/assets/booking/...`

For local `vite serve`, the base is `/`, so local development works normally.

---

## Entry HTML Files

The two iframe HTML files live in:

- [`frontend/bookings-embed/dashboard.html`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/bookings-embed/dashboard.html)
- [`frontend/bookings-embed/fan-booking.html`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/bookings-embed/fan-booking.html)

They are intentionally minimal:

- include the app mount element
- include the embed entry `main.js`
- do not include the full main app shell

### Dashboard embed entry

`dashboard.html` mounts:

- [`frontend/src/embeds/events/main.js`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/src/embeds/events/main.js)

### Fan booking popup entry

`fan-booking.html` mounts:

- [`frontend/src/embeds/fanBooking/main.js`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/src/embeds/fanBooking/main.js)

---

## Source Layout

The embed code is consolidated under:

- [`frontend/src/embeds/events`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/src/embeds/events)
- [`frontend/src/embeds/fanBooking`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/src/embeds/fanBooking)

This is the current structure:

### Events embed

- `main.js`
- `EventsEmbedApp.vue`
- `bootstrap.js`
- `bridge.js`
- `router.js`
- `pages/EventsEmbedEventsPage.vue`
- `pages/EventsEmbedCreatePage.vue`

### Fan booking embed

- `main.js`
- `FanBookingEmbedApp.vue`
- `bootstrap.js`
- `bridge.js`
- `debug.js`
- `router.js`

---

## Host Script

The parent-side host script is:

- [`frontend/public/bookings-embed/fs-events-host.js`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/public/bookings-embed/fs-events-host.js)

The companion host stylesheet is:

- [`frontend/public/bookings-embed/fs-events-host.css`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/public/bookings-embed/fs-events-host.css)

This is the bridge between WordPress and the iframe apps.

It exposes a global:

- `window.FSEventsEmbed`

WordPress is expected to load both:

- `fs-events-host.js`
- `fs-events-host.css`

### Current public APIs

#### 1. `FSEventsEmbed.mount(target, options)`

Used for the events/dashboard iframe.

Responsibilities:

- resolve the mount target
- create the iframe
- create a wrapper with stable class names
- build the iframe URL with query-string bootstrap fallback
- listen for `postMessage` events from the child
- send `FS_EVENTS_BOOTSTRAP`
- resize the iframe
- proxy `open-url` actions back to the parent window

#### 2. `FSEventsEmbed.openFanBookingPopup(options)`

Used for the one-on-one fan-booking popup iframe.

Responsibilities:

- destroy any previous active popup
- create overlay and modal shell in the parent document
- create the iframe
- assign stable public class names for styling
- append query-string bootstrap fallback to the iframe URL
- listen for child messages
- send `FS_FAN_BOOKING_BOOTSTRAP`
- close/destroy popup on child request
- propagate booking-created / booking-failed callbacks

### Why bootstrap is sent twice

The host sends data through both:

1. iframe query params
2. `postMessage`

This is deliberate.

Reason:

- query params make direct iframe testing possible
- query params also protect against handshake timing issues
- `postMessage` is still the primary structured parent-child contract

If one layer fails, the other often still allows the embed to boot.

### Styling contract

Static host styling now lives in:

- `fs-events-host.css`

The host script only sets:

- class names
- event listeners
- runtime CSS custom properties for measured values

Stable public classes:

- `.fs-events-embed`
- `.fs-events-embed__iframe`
- `.fs-events-embed__iframe--content`
- `.fs-events-embed__iframe--viewport`
- `.fs-fan-booking-popup`
- `.fs-fan-booking-popup__overlay`
- `.fs-fan-booking-popup__modal`
- `.fs-fan-booking-popup__iframe`
- `.fs-fan-booking-popup__close`

Stable runtime CSS variables:

- `--fs-events-embed-height`
- `--fs-events-embed-min-height`
- `--fs-fan-booking-popup-width`
- `--fs-fan-booking-popup-height`

This was done so WordPress/frontend developers can restyle and override layout behavior in CSS without editing the host JS.

### Normalized data in host script

The host currently normalizes:

- `creatorId`
- `fanId`
- `eventId`
- `apiBaseUrl`
- `creatorData`

`creatorData` is normalized into:

- `avatar`
- `name`
- `isVerified`

This same payload shape is used in both the events embed and the fan-booking popup.

---

## Messaging Contracts

### Events embed messages

Defined in:

- [`frontend/src/embeds/events/bridge.js`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/src/embeds/events/bridge.js)

Parent -> child:

- `FS_EVENTS_BOOTSTRAP`

Child -> parent:

- `FS_EVENTS_CHILD_READY`
- `FS_EVENTS_RESIZE`
- `FS_EVENTS_OPEN_URL`

### Fan booking popup messages

Defined in:

- [`frontend/src/embeds/fanBooking/bridge.js`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/src/embeds/fanBooking/bridge.js)

Parent -> child:

- `FS_FAN_BOOKING_BOOTSTRAP`

Child -> parent:

- `FS_FAN_BOOKING_CHILD_READY`
- `FS_FAN_BOOKING_CLOSE_REQUEST`
- `FS_FAN_BOOKING_CREATED`
- `FS_FAN_BOOKING_FAILED`

### Message design notes

- Both embeds use `postMessage`
- Both embeds also support URL fallback bootstrap
- The events embed uses resize events because it lives inline inside the page
- The fan-booking popup does not use content-height resize because the parent owns the modal size

---

## Bootstrap Stores

Each iframe app has a small reactive bootstrap store.

### Events bootstrap store

File:

- [`frontend/src/embeds/events/bootstrap.js`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/src/embeds/events/bootstrap.js)

Responsibilities:

- normalize parent payload
- normalize URL query fallback
- keep reactive bootstrap state
- expose `useEventsEmbedBootstrap()`

Current state includes:

- `creatorId`
- `fanId`
- `userRole`
- `apiBaseUrl`
- `initialRoute`
- `creatorData`
- `bootstrapped`

### Fan-booking bootstrap store

File:

- [`frontend/src/embeds/fanBooking/bootstrap.js`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/src/embeds/fanBooking/bootstrap.js)

Responsibilities:

- normalize popup bootstrap
- parse direct URL fallback
- keep reactive booking popup state
- expose `useOneOnOneBookingBootstrap()`

Current state includes:

- `creatorId`
- `fanId`
- `eventId`
- `apiBaseUrl`
- `creatorData`
- `bootstrapped`

---

## Events Embed App

### Files

- [`frontend/src/embeds/events/main.js`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/src/embeds/events/main.js)
- [`frontend/src/embeds/events/EventsEmbedApp.vue`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/src/embeds/events/EventsEmbedApp.vue)
- [`frontend/src/embeds/events/router.js`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/src/embeds/events/router.js)

### Router

The events embed uses a small memory-history router.

Routes:

- `/events`
- `/create/:type?`

This router never touches the browser URL in the iframe because it uses:

- `createMemoryHistory()`

That keeps the iframe URL stable while still allowing the child app to switch views.

### App shell behavior

`EventsEmbedApp.vue` is responsible for:

- waiting for bootstrap
- listening for parent bootstrap messages
- reading URL fallback bootstrap
- switching to the correct initial route
- reporting iframe height

Important behavior:

- create route uses viewport-height mode
- events route also uses viewport-height mode
- parent sets `height: 100vh` when child asks for `mode: "viewport"`

This was added because content-based height caused iframes to grow too tall and push important UI out of view.

### Page components

#### `EventsEmbedEventsPage.vue`

Renders the extracted shared dashboard events feature:

- [`frontend/src/features/events/DashboardEventsFeature.vue`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/src/features/events/DashboardEventsFeature.vue)

The page passes:

- `creatorId`
- `fanId`
- `userRole`
- `apiBaseUrl`
- `embedded=true`

The page also converts child open-url events into parent bridge messages.

#### `EventsEmbedCreatePage.vue`

Renders the embedded create flow using:

- [`frontend/src/components/ui/form/BookingForm/UnifiedBookingForm.vue`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/src/components/ui/form/BookingForm/UnifiedBookingForm.vue)

It passes:

- `type`
- `creatorId`
- `apiBaseUrl`
- `creatorData`
- `embedded=true`

This is what allows the WordPress version to reuse the same create-event form without the main dashboard shell.

---

## Shared Events Feature Extraction

The original dashboard events page was split into:

1. route wrapper:
   - [`frontend/src/templates/dashboard/page/agent/DashboardEvents.vue`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/src/templates/dashboard/page/agent/DashboardEvents.vue)
2. shared feature:
   - [`frontend/src/features/events/DashboardEventsFeature.vue`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/src/features/events/DashboardEventsFeature.vue)

Why this matters:

- the normal app still uses the route wrapper
- the embed app uses the shared feature directly
- both paths reuse the same business logic and calendars

The shared feature is responsible for:

- loading creator/fan dashboard booking context
- rendering main/mini calendars
- showing events widget
- handling join / approve / reject / cancel actions
- opening create-event actions through emitted events

The wrapper is now responsible only for app-specific concerns like:

- route integration
- non-embed navigation

---

## Unified Booking Form in Embed Mode

The create-event embed reuses:

- [`frontend/src/components/ui/form/BookingForm/UnifiedBookingForm.vue`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/src/components/ui/form/BookingForm/UnifiedBookingForm.vue)

This component supports both:

- normal app mode
- embed mode

Embed-specific behavior includes:

- no dashboard wrapper shell
- iframe-safe scrolling and full-height layout
- embedded back button behavior
- ability to receive `creatorData`
- ability to open the fan-booking preview popup with embed-safe creator presentation

The form internally renders:

- `OneOnOneBookinStep1.vue`
- `OneOnOneBookinStep2.vue`
- group event steps
- `OneOnOneBookingFlowPopup.vue` for preview

So the events iframe indirectly reuses the fan-booking popup system as a preview surface.

---

## Fan Booking Popup Embed App

### Files

- [`frontend/src/embeds/fanBooking/main.js`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/src/embeds/fanBooking/main.js)
- [`frontend/src/embeds/fanBooking/FanBookingEmbedApp.vue`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/src/embeds/fanBooking/FanBookingEmbedApp.vue)
- [`frontend/src/embeds/fanBooking/router.js`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/src/embeds/fanBooking/router.js)

### Router

This app currently uses a minimal memory router with a single route.

The router exists mostly for consistency with the embed pattern and future expansion.

### App shell behavior

`FanBookingEmbedApp.vue`:

- waits for bootstrap
- reads direct URL fallback
- announces child-ready to the parent
- renders the shared booking feature when bootstrapped
- forwards close / success / failure events back to the parent

This app does not own a popup shell.

That is intentional.

The outer modal belongs to the parent page, not the child iframe.

---

## Shared Fan Booking Feature Extraction

The original popup component was split into:

1. wrapper popup:
   - [`frontend/src/components/FanBookingFlow/OneOnOneBookingFlow/OneOnOneBookingFlowPopup.vue`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/src/components/FanBookingFlow/OneOnOneBookingFlow/OneOnOneBookingFlowPopup.vue)
2. shared feature:
   - [`frontend/src/components/FanBookingFlow/OneOnOneBookingFlow/OneOnOneBookingFlowFeature.vue`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/src/components/FanBookingFlow/OneOnOneBookingFlow/OneOnOneBookingFlowFeature.vue)

Why this split exists:

- the normal app still wants a `PopupHandler` wrapper
- the iframe embed must not render a nested popup shell inside another popup

So:

- `OneOnOneBookingFlowPopup.vue` remains the normal app wrapper
- `OneOnOneBookingFlowFeature.vue` is the actual reusable booking-flow engine surface

### Feature responsibilities

The shared fan-booking feature is responsible for:

- creating and owning a flow state engine
- loading booking catalog data
- selecting event by `eventId`
- supporting preview mode
- tracking temporary hold state
- handling booking creation and failure
- rendering steps 1 through 4

### Preview mode

The same feature is also used by:

- the preview popup inside `UnifiedBookingForm.vue`

That means the preview system and the standalone popup now share the same booking-flow core instead of duplicating logic.

---

## Creator Presentation Pipeline

Both embed systems support host-provided creator presentation data:

- `avatar`
- `name`
- `isVerified`

This is passed through as `creatorData`.

Flow:

1. Parent host normalizes `creatorData`
2. Bootstrap store stores it
3. Shared feature writes it into engine state
4. UI components resolve creator presentation from:
   - explicit `creatorData`
   - event/result data
   - static defaults

This is used in:

- fan-booking popup header/sidebar/success surfaces
- event-create preview popup

The shared resolver lives alongside the fan-booking feature:

- [`frontend/src/components/FanBookingFlow/OneOnOneBookingFlow/creatorPresentation.js`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/src/components/FanBookingFlow/OneOnOneBookingFlow/creatorPresentation.js)

---

## Asset Strategy

The embed work intentionally moved popup-flow assets away from `public/images`.

Why:

- raw `/images/...` paths break when rendered from WordPress plugin paths
- Vite-bundled assets survive hashed production builds correctly

Current approach:

- relevant popup icons/backgrounds were converted to `.webp`
- they were moved into `src/assets/images/icons`
- components now import them normally
- Vite emits them into `dist/assets/booking`

This is why the WordPress plugin can serve the popup visuals from:

- `/wp-content/plugins/fansocial/assets/booking/...`

instead of relying on site-root `/images/...`

---

## Why the Events Embed and Fan-Booking Popup Are Separate Apps

They are separate because they have different parent-child behavior.

### Events embed

- inline iframe
- parent controls container block
- child reports height
- child can navigate between internal events/create routes

### Fan-booking popup

- modal iframe
- parent controls overlay and modal shell
- child never owns popup chrome
- no resize contract needed
- child emits close/success/failure back to parent

Trying to make them one app would add complexity without much benefit.

The shared logic is reused lower in the stack instead:

- `DashboardEventsFeature.vue`
- `UnifiedBookingForm.vue`
- `OneOnOneBookingFlowFeature.vue`

---

## Why the Host Script Still Uses the `FSEventsEmbed` Name

Historically, the WordPress work started with the events/dashboard embed.

Later, the fan-booking popup API was added into the same host script instead of creating a second global.

So today:

- `window.FSEventsEmbed.mount(...)` handles the dashboard/events iframe
- `window.FSEventsEmbed.openFanBookingPopup(...)` handles the popup iframe

The name is a little broader than the implementation now, but keeping one host global simplified deployment and WordPress-side loading.

---

## Debugging Notes

### Fan-booking popup debug

There is a dedicated debug helper:

- [`frontend/src/embeds/fanBooking/debug.js`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/src/embeds/fanBooking/debug.js)

It can be enabled via:

- host option `debug: true`
- query param `debugFanBooking=1`
- localStorage flag `fsFanBookingDebug`

It records debug entries in:

- `window.__FSFanBookingDebug.entries`

This was added because bootstrap and popup state bugs were hard to diagnose once the flow was running inside an iframe.

### Common failure classes

When debugging, the usual failure points are:

1. Parent host script is stale or cached
2. iframe URL fallback is missing expected query params
3. child-ready / bootstrap postMessage handshake did not happen
4. feature mounted but required IDs were missing
5. a child asset is still using an old public path

---

## Files To Read First

If another developer is trying to understand the whole system quickly, start here:

1. [`frontend/vite.config.js`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/vite.config.js)
2. [`frontend/public/bookings-embed/fs-events-host.js`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/public/bookings-embed/fs-events-host.js)
3. [`frontend/src/embeds/events/EventsEmbedApp.vue`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/src/embeds/events/EventsEmbedApp.vue)
4. [`frontend/src/embeds/fanBooking/FanBookingEmbedApp.vue`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/src/embeds/fanBooking/FanBookingEmbedApp.vue)
5. [`frontend/src/features/events/DashboardEventsFeature.vue`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/src/features/events/DashboardEventsFeature.vue)
6. [`frontend/src/components/ui/form/BookingForm/UnifiedBookingForm.vue`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/src/components/ui/form/BookingForm/UnifiedBookingForm.vue)
7. [`frontend/src/components/FanBookingFlow/OneOnOneBookingFlow/OneOnOneBookingFlowFeature.vue`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/src/components/FanBookingFlow/OneOnOneBookingFlow/OneOnOneBookingFlowFeature.vue)

That sequence mirrors the architecture from outside in:

- build
- parent host
- iframe apps
- shared features

---

## Related Integration Docs

These existing docs explain how the WordPress side uses the system:

- [`frontend/docs/wordpress/events-dashboard-embed-wordpress-integration.md`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/docs/wordpress/events-dashboard-embed-wordpress-integration.md)
- [`frontend/docs/wordpress/fan-booking-popup-wordpress-integration.md`](/Users/rehanadil/Local/rehan/fs-bookings/frontend/docs/wordpress/fan-booking-popup-wordpress-integration.md)

This architecture doc complements those by explaining how the frontend implementation is organized internally.
