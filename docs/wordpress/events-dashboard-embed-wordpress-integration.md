# Events Dashboard Embed WordPress Integration

This guide explains how to deploy the extracted Vue dashboard events embeds into WordPress using these final plugin paths:

- `https://your-site.com/wp-content/plugins/fansocial/bookings-embed/`
- `https://your-site.com/wp-content/plugins/fansocial/assets/booking/`

The embed is designed to run in an `iframe` on the same origin as WordPress.

## What You Are Deploying

There are 2 deployed parts:

1. The iframe app
   This is the Vue app page loaded inside the iframe.

2. The shared asset bundle
   This contains the built JS, CSS, and media files used by the iframe app.

## Files To Build

From the app:

- [`./dist/bookings-embed`](./dist/bookings-embed)
- [`./dist/assets/booking`](./dist/assets/booking)

## 1. Build The Frontend

Run the build using `Node 24 or newer`:

```bash
npm run build:wordpress
```

After a successful build, confirm these exist:

- [`./dist/bookings-embed/dashboard.html`](./dist/bookings-embed/dashboard.html)
- [`./dist/bookings-embed/fan-booking.html`](./dist/bookings-embed/fan-booking.html)
- [`./dist/bookings-embed/fan-booking-loading-skeleton.html`](./dist/bookings-embed/fan-booking-loading-skeleton.html)
- [`./dist/bookings-embed/fs-events-host.js`](./dist/bookings-embed/fs-events-host.js)
- [`./dist/bookings-embed/fs-events-host.css`](./dist/bookings-embed/fs-events-host.css)
- [`./dist/assets/booking`](./dist/assets/booking)

## 2. Copy Files Into The WordPress Plugin

Copy the built output into the `fansocial` plugin directory.

Copy:

- [`./dist/bookings-embed`](./dist/bookings-embed)
  to
  `wp-content/plugins/fansocial/bookings-embed`

- [`./dist/assets/booking`](./dist/assets/booking)
  to
  `wp-content/plugins/fansocial/assets/booking`

Your deployed structure should end up like this:

```text
wp-content/
  plugins/
    fansocial/
      bookings-embed/
        dashboard.html
        fan-booking.html
        fan-booking-loading-skeleton.html
        fs-events-host.js
        fs-events-host.css
      assets/
        booking/
          *.js
          *.css
          *.webp
          *.jpg
          *.woff
          *.svg
```

## 3. Verify The iframe App Directly

Before wiring WordPress, test the iframe page directly in the browser:

```text
https://your-site.com/wp-content/plugins/fansocial/bookings-embed/dashboard.html?creatorId=1407&userRole=creator&initialRoute=events
```

That URL should load the embed directly.

If it does not load:

- confirm `bookings-embed/dashboard.html` exists in the plugin
- confirm `assets/booking/...` files exist in the plugin
- confirm the site serves both paths publicly
- confirm the browser already has the same-origin auth/localStorage state the app expects

## 4. WordPress Integration

Add the #fs-bookings-embed div container in
- /wp-content/plugins/fansocial/templates/template-parts/dashboard/template-part-dashboard-events-creator.php
- /wp-content/plugins/fansocial/templates/template-parts/dashboard/template-part-dashboard-events-fan.php.

```html
<div id="fs-bookings-embed"></div>
```

Then create a new file `/wp-content/plugins/fansocial/assets/dashboard-v2/js/pages/events.js` and add this code to it:

```js
function mountFSEventsEmbed() {
    if (!window.FSEventsEmbed) {
        console.error('FSEventsEmbed is not defined. Retrying in 1 second...');
        setTimeout(mountFSEventsEmbed, 1000);
        return;
    }

    console.error('Mounting FSEventsEmbed...');
    window.FSEventsEmbed.mount('#fs-bookings-embed', {
        src: '/wp-content/plugins/fansocial/bookings-embed/dashboard.html',
        creatorId: parseInt(userData.userID),
        userRole: userData.accountType === 'creator' ? 'creator' : 'fan',
        initialRoute: 'events',
        apiBaseUrl: 'https://bookings-backend-live.onrender.com',
        creatorData: {
            avatar: userData?.userAvatar || '',
            name: userData?.userDisplayName || '',
            isVerified: false,
        },
    });
}

mountFSEventsEmbed();
```

Then in `/wp-content/plugins/fansocial/includes/class-templates.php`, Function `write_configurations`, search for `'/dashboard/events'` index in both the creator array and the fan array and add these following to the assets array:
- /wp-content/plugins/fansocial/bookings-embed/fs-events-host.js
- /wp-content/plugins/fansocial/bookings-embed/fs-events-host.css
- /wp-content/plugins/fansocial/assets/dashboard-v2/js/pages/events.js

## 5. Bootstrap Values

The parent page passes this data into the iframe:

```ts
{
  creatorId: number,
  userRole: 'creator' | 'fan' | 'agent',
  apiBaseUrl?: string,
  initialRoute?: 'events' | 'create-private' | 'create-group'
  creatorData?: {
    avatar?: string
    name?: string
    isVerified?: boolean
  }
}
```

### Meaning

- `creatorId`
  The creator whose bookings/events should load.

- `userRole`
  For this embed, use `creator` unless you intentionally want another role.

- `apiBaseUrl`
  Optional override for the API base URL.

- `initialRoute`
  `events` opens the main calendar/list view.
  `create-private` opens the private booking/event create flow immediately.
  `create-group` opens the group event create flow immediately.

- `creatorData`
  Optional creator presentation metadata used by the embedded create-flow preview popup.
  It supports:
  - `avatar`
  - `name`
  - `isVerified`

## 7. What URLs Must Work

These must be accessible in the browser:

- `https://your-site.com/wp-content/plugins/fansocial/bookings-embed/dashboard.html`
- `https://your-site.com/wp-content/plugins/fansocial/bookings-embed/fan-booking.html`
- `https://your-site.com/wp-content/plugins/fansocial/bookings-embed/fan-booking-loading-skeleton.html`
- `https://your-site.com/wp-content/plugins/fansocial/bookings-embed/fs-events-host.js`
- `https://your-site.com/wp-content/plugins/fansocial/bookings-embed/fs-events-host.css`
- `https://your-site.com/wp-content/plugins/fansocial/assets/booking/...`

If any of those 404, the embed will fail.

## 8. Same-Origin Requirement

This embed assumes same-origin hosting.

That means:

- WordPress page and iframe page are on the same domain
- browser auth/localStorage context is available to the iframe
- existing API/auth assumptions from the app continue to work

If you later move the iframe to another domain, you will need extra auth/bootstrap work.

## 9. Functional Smoke Test Checklist

After WordPress integration, verify all of these:

1. The page loads without iframe console/network errors.
2. The iframe appears and auto-resizes.
3. The calendar loads the correct creator data.
4. Mini calendar and events widget render.
5. Clicking `NEW EVENTS` opens the embedded create flow.
6. Creating a private event returns to the events view.
7. Creating a group event returns to the events view.
8. Join opens correctly in a new tab or target window.
9. Approve/reject actions work.
10. Cancel booking works.
11. The one-on-one popup opens from the WordPress parent page.
12. A valid `eventId` starts the popup on step 2.
13. Omitting `eventId` starts the popup on step 1.
14. Booking-created and booking-failed callbacks reach the parent.
15. Opening the fan-booking popup shows the parent-side loading skeleton immediately.
16. The parent-side loading skeleton disappears once the iframe sends `FS_FAN_BOOKING_CHILD_READY`.

## 10. Troubleshooting

### iframe page loads blank

Check:

- `bookings-embed/dashboard.html` exists
- referenced files under `assets/booking` exist
- plugin path is publicly reachable

### iframe loads but no events appear

Check:

- `creatorId` is being passed correctly
- API backend is reachable
- current browser session has the auth/localStorage state expected by the app

### styles/scripts 404

Check:

- `fs-events-host.css` was also copied and enqueued, not just `fs-events-host.js`
- the built asset folder was copied to `wp-content/plugins/fansocial/assets/booking`
- the files were not copied to `assets` instead of `assets/booking`

### create flow opens but does not save

Check:

- API permissions
- creatorId bootstrap value
- backend logs for event creation errors

## 11. Source Files Related To This Integration

Main pieces:

- [`DashboardEventsFeature.vue`](./src/features/events/DashboardEventsFeature.vue)
- [`EventsEmbedApp.vue`](./src/embeds/events/EventsEmbedApp.vue)
- [`router.js`](./src/embeds/events/router.js)
- [`bootstrap.js`](./src/embeds/events/bootstrap.js)
- [`bridge.js`](./src/embeds/events/bridge.js)
- [`main.js`](./src/embeds/events/main.js)
- [`main.js`](./src/embeds/fanBooking/main.js)
- [`fs-events-host.js`](./public/bookings-embed/fs-events-host.js)
- [`fs-events-host.css`](./public/bookings-embed/fs-events-host.css)
- [`fan-booking-loading-skeleton.html`](./public/bookings-embed/fan-booking-loading-skeleton.html)
- [`vite.config.js`](./vite.config.js)
