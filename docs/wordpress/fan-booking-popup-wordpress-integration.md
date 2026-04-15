# Fan Booking Popup WordPress Integration

This guide explains how to deploy and use the extracted fan booking popup inside WordPress with the existing plugin paths:

- `https://your-site.com/wp-content/plugins/fansocial/bookings-embed/`
- `https://your-site.com/wp-content/plugins/fansocial/assets/booking/`

The popup is rendered inside an `iframe`, but the outer modal shell is owned by the WordPress page.

## What You Deploy

You still only need to copy these 2 build outputs:

- [`./dist/bookings-embed`](./dist/bookings-embed)
- [`./dist/assets/booking`](./dist/assets/booking)

Inside `bookings-embed`, the important files for this popup are:

- [`./dist/bookings-embed/fan-booking.html`](./dist/bookings-embed/fan-booking.html)
- [`./dist/bookings-embed/fan-booking-loading-skeleton.html`](./dist/bookings-embed/fan-booking-loading-skeleton.html)
- [`./dist/bookings-embed/fs-events-host.js`](./dist/bookings-embed/fs-events-host.js)
- [`./dist/bookings-embed/fs-events-host.css`](./dist/bookings-embed/fs-events-host.css)

## 1. Build The Frontend

Run a WordPress build using `Node 24 or newer`:

```bash
npm run build:wordpress
```

## 2. Copy Files Into The WordPress Plugin

Copy:

- [`./dist/bookings-embed`](./dist/bookings-embed)
  to
  `wp-content/plugins/fansocial/bookings-embed`

- [`./dist/assets/booking`](./dist/assets/booking)
  to
  `wp-content/plugins/fansocial/assets/booking`

Your deployed structure should include:

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
          *.png
          *.svg
```

## 3. Verify The iframe Page Directly

Before wiring WordPress, open the popup iframe directly:

```text
https://your-site.com/wp-content/plugins/fansocial/bookings-embed/fan-booking.html?creatorId=1407&fanUserId=25
```

To test direct-open on step 2, include an event id:

```text
https://your-site.com/wp-content/plugins/fansocial/bookings-embed/fan-booking.html?creatorId=1407&fanUserId=25&eventId=evt_0e8082d4-9df0-42fb-a7eb-37e9b6311826
```

Expected behavior:

- with no `eventId`, the flow opens on step 1
- with a valid `eventId`, the flow opens on step 2
- with an invalid `eventId`, it stays on step 1 and shows an error toast

## 4. WordPress Integration

In `/wp-content/plugins/fansocial/includes/class-templates.php`, Function `write_configurations`, search for `'/@([A-z0-9]+)/hero-right-buttons'` index and add these to the assets array:

- `/wp-content/plugins/fansocial/bookings-embed/fs-events-host.js`
- `/wp-content/plugins/fansocial/bookings-embed/fs-events-host.css`

Then open `/wp-content/plugins/fansocial/assets/new-profile/hero-right-buttons.js` and add this code to mount the embed:

```js
// Bookings
(function () {
    var API_URL = `http://localhost:3001/events?creatorId=${userData.userID}&status=active&limit=10`;

    // --- Next-slot calculation ---
    function parseTime(timeStr) {
        var parts = timeStr.split(':');
        return { h: parseInt(parts[0], 10), m: parseInt(parts[1], 10) };
    }

    function setTimeOnDate(base, timeStr) {
        var t = parseTime(timeStr);
        var d = new Date(base);
        d.setHours(t.h, t.m, 0, 0);
        return d;
    }

    // JS getDay(): 0=Sun,1=Mon,...,6=Sat
    var DAY_MAP = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };

    function getNextDayOccurrence(now, targetJsDay, timeStr) {
        var currentDay = now.getDay();
        var daysUntil = (targetJsDay - currentDay + 7) % 7;
        var slotToday = setTimeOnDate(now, timeStr);
        if (daysUntil === 0 && slotToday <= now) daysUntil = 7;
        var next = new Date(now);
        next.setDate(now.getDate() + daysUntil);
        return setTimeOnDate(next, timeStr);
    }

    function getNextSlotTime(event) {
        var slots = event.slots;
        var repeatRule = event.repeatRule;
        var dateFrom = event.dateFrom;

        if (!slots || !Array.isArray(slots) || slots.length === 0) return null;

        var now = new Date();
        var nearest = null;

        function update(dt) {
            if (dt > now && (!nearest || dt < nearest)) nearest = dt;
        }

        switch (repeatRule) {
            case 'doesNotRepeat':
                slots.forEach(function (slot) {
                    if (!slot.date || !slot.times) return;
                    slot.times.forEach(function (time) {
                        if (!time.startTime) return;
                        update(new Date(slot.date + 'T' + time.startTime + ':00'));
                    });
                });
                break;

            case 'weekly':
                slots.forEach(function (slot) {
                    if (!slot.day || !slot.startTime) return;
                    var targetDay = DAY_MAP[slot.day.toLowerCase()];
                    if (targetDay === undefined) return;
                    update(getNextDayOccurrence(now, targetDay, slot.startTime));
                });
                break;

            case 'daily':
                slots.forEach(function (slot) {
                    if (!slot.startTime) return;
                    var slotToday = setTimeOnDate(now, slot.startTime);
                    if (slotToday > now) {
                        update(slotToday);
                    } else {
                        var tomorrow = new Date(now);
                        tomorrow.setDate(now.getDate() + 1);
                        update(setTimeOnDate(tomorrow, slot.startTime));
                    }
                });
                break;

            case 'every_weekend':
                slots.forEach(function (slot) {
                    if (!slot.startTime) return;
                    if (slot.day) {
                        var targetDay = DAY_MAP[slot.day.toLowerCase()];
                        if (targetDay !== undefined) update(getNextDayOccurrence(now, targetDay, slot.startTime));
                    } else {
                        update(getNextDayOccurrence(now, 6, slot.startTime)); // Saturday
                        update(getNextDayOccurrence(now, 0, slot.startTime)); // Sunday
                    }
                });
                break;

            case 'monthly':
                if (dateFrom) {
                    var anchorDay = parseInt(dateFrom.split('-')[2], 10);
                    slots.forEach(function (slot) {
                        if (!slot.startTime) return;
                        var t = parseTime(slot.startTime);
                        var thisMonth = new Date(now.getFullYear(), now.getMonth(), anchorDay, t.h, t.m, 0, 0);
                        if (thisMonth > now) {
                            update(thisMonth);
                        } else {
                            update(new Date(now.getFullYear(), now.getMonth() + 1, anchorDay, t.h, t.m, 0, 0));
                        }
                    });
                }
                break;
        }

        return nearest;
    }

    function formatNextSlot(date) {
        if (!date) return 'TBD';
        var now = new Date();
        var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        var tomorrowStart = new Date(todayStart.getTime() + 86400000);
        var slotStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        var timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        if (slotStart.getTime() === todayStart.getTime()) return 'Today @' + timeStr;
        if (slotStart.getTime() === tomorrowStart.getTime()) return 'Tomorrow @' + timeStr;
        var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[date.getDay()] + ' @' + timeStr;
    }

    // --- Template population ---
    function populateAddon(addonTemplate, addon) {
        var clone = addonTemplate.content.cloneNode(true);
        var labelEl = clone.querySelector('[data-name="addon-label"]');
        var priceEl = clone.querySelector('[data-name="addon-price"]');
        if (labelEl) labelEl.textContent = addon.title != null ? addon.title : '';
        if (priceEl) priceEl.textContent = addon.priceTokens != null ? addon.priceTokens : '';
        return clone;
    }

    function set(clone, name, value) {
        var el = clone.querySelector('[data-name="' + name + '"]');
        if (el) el.textContent = value != null ? value : '';
    }

    function populateEvent(eventTemplate, addonTemplate, event) {
        var clone = eventTemplate.content.cloneNode(true);

        set(clone, 'type', event.type != null ? event.type : '');
        set(clone, 'title', event.title != null ? event.title : '');
        set(clone, 'price', event.basePriceTokens != null ? event.basePriceTokens : '');
        set(clone, 'sessionLength', event.sessionDurationMinutes != null ? event.sessionDurationMinutes : '');
        set(clone, 'description', event.description != null ? event.description : '');
        set(clone, 'next-slot', formatNextSlot(getNextSlotTime(event)));

        // Populate addons
        if (addonTemplate && Array.isArray(event.addons) && event.addons.length > 0) {
            var addonsContainer = clone.querySelector('[data-name="addons"]');
            if (addonsContainer) {
                event.addons.forEach(function (addon) {
                    addonsContainer.appendChild(populateAddon(addonTemplate, addon));
                });
            }
        }

        const bookNowButton = clone.querySelector('[data-el="book-now"]');
        if ( bookNowButton ) {
            bookNowButton.addEventListener('click', function () {
                openFsBookingPopupForEvent(event.eventId);
            });
        }

        return clone;
    }

    function openFsBookingPopupForEvent(eventId) {
		if (!window.FSEventsEmbed) return;

		window.FSEventsEmbed.openFanBookingPopup({
			creatorId: parseInt(userSpecifiData?.targetUser?.userId || 0),
			fanUserId: parseInt(userSpecifiData?.currentUser?.userId || 0),
			eventId: eventId,
            apiBaseUrl: 'https://bookings-backend-live.onrender.com',
            creatorData: {
                avatar: userSpecifiData?.targetUser?.avatar || '',
                name: userSpecifiData?.targetUser?.userDisplayName || '',
                isVerified: false,
            },
		});
	}

    // --- Fetch and render ---
    async function loadCreatorEvents() {
        var container = document.querySelector('[data-creator-events-list]');
        var eventTemplate = document.querySelector('template[data-id="creator-event"]');
        var addonTemplate = document.querySelector('template[data-id="creator-event-addon"]');

        if (!container || !eventTemplate) return;

        try {
            var response = await fetch(API_URL);
            var data = await response.json();

            if (!data.ok || !Array.isArray(data.items) || data.items.length === 0) return;

            container.innerHTML = '';
            data.items.forEach(function (event) {
                container.appendChild(populateEvent(eventTemplate, addonTemplate, event));
            });
        } catch (err) {
            console.error('Error loading creator events:', err);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadCreatorEvents);
    } else {
        loadCreatorEvents();
    }
})();
```

## 5. Open The Popup From WordPress

Use `window.FSEventsEmbed.openFanBookingPopup(...)`.

### Basic Example

```js
window.FSEventsEmbed.openFanBookingPopup({
  creatorId: 1407,
  fanUserId: 25,
});
```

### Example With Event Id

```js
window.FSEventsEmbed.openFanBookingPopup({
  creatorId: 1407,
  fanUserId: 25,
  eventId: "evt_0e8082d4-9df0-42fb-a7eb-37e9b6311826",
});
```

### Full Example

```js
window.FSEventsEmbed.openFanBookingPopup({
  src: "/wp-content/plugins/fansocial/bookings-embed/fan-booking.html",
  creatorId: 1407,
  fanUserId: 25,
  eventId: "evt_0e8082d4-9df0-42fb-a7eb-37e9b6311826",
  apiBaseUrl: "https://bookings-backend-live.onrender.com",
  creatorData: {
    avatar: "https://example.com/avatar.webp",
    name: "Creator Name",
    isVerified: true,
  },
  onClose: function () {
    console.log("Booking popup closed");
  },
  onBookingCreated: function (payload) {
    console.log("Booking created", payload);
  },
  onBookingFailed: function (payload) {
    console.log("Booking failed", payload);
  },
});
```

## 6. Popup Bootstrap Values

The parent sends this bootstrap payload into the iframe:

```ts
{
  creatorId: number,
  fanUserId: number,
  eventId?: string | number | null,
  apiBaseUrl?: string,
  creatorData?: {
    avatar?: string
    name?: string
    isVerified?: boolean
  }
}
```

### Meaning

- `creatorId`
  The creator whose event catalog should load.

- `fanUserId`
  The current fan user booking the session.

- `eventId`
  Optional. If provided and found in the creator’s active event catalog, the popup skips step 1 and starts on step 2.

- `apiBaseUrl`
  Optional API base override. Leave it empty if the default app API resolution should be used.

- `creatorData`
  Optional creator presentation metadata used by the popup header, sidebar, and success surfaces.
  It supports:
  - `avatar`
  - `name`
  - `isVerified`

## 7. Host Script Behavior

`openFanBookingPopup(...)` creates the popup for you and returns a controller:

```ts
{
  iframe: HTMLIFrameElement,
  overlay: HTMLElement,
  close(): void,
  destroy(): void
}
```

Default behavior:

- creates a fresh iframe every time you open the popup
- preloads and caches `fan-booking-loading-skeleton.html` when the host script initializes
- shows the parent-side loading skeleton immediately while the iframe boots
- hides the parent-side loading skeleton when the child iframe sends `FS_FAN_BOOKING_CHILD_READY`
- locks body scroll while the popup is open
- closes on overlay click
- closes on `Escape`
- destroys the iframe on close so each session starts clean

Frontend developers can restyle the loading state without touching JS by editing:

- `bookings-embed/fan-booking-loading-skeleton.html`
- `bookings-embed/fs-events-host.css`

## 8. Required URLs

These must load successfully:

- `https://your-site.com/wp-content/plugins/fansocial/bookings-embed/fan-booking.html`
- `https://your-site.com/wp-content/plugins/fansocial/bookings-embed/fan-booking-loading-skeleton.html`
- `https://your-site.com/wp-content/plugins/fansocial/bookings-embed/fs-events-host.js`
- `https://your-site.com/wp-content/plugins/fansocial/bookings-embed/fs-events-host.css`
- `https://your-site.com/wp-content/plugins/fansocial/assets/booking/...`

If any of these return 404, the popup will fail.

## 9. Same-Origin Requirement

This setup assumes:

- the WordPress page and iframe are on the same origin
- the browser already has the auth/session/localStorage context the booking app expects
- the booking APIs remain reachable from the iframe

## 10. Smoke Test Checklist

After deployment, verify:

1. The host script loads on the WordPress page.
2. Clicking the trigger opens the popup overlay.
3. The parent-side loading skeleton appears immediately.
4. The iframe loads without 404 errors.
5. The parent-side loading skeleton hides after `FS_FAN_BOOKING_CHILD_READY`.
6. With no `eventId`, the popup opens on step 1.
7. With a valid `eventId`, the popup opens on step 2.
8. With an invalid `eventId`, the popup stays on step 1 and shows an error toast.
9. Closing on overlay click works.
10. Closing on `Escape` works.
11. Completing a booking reaches the success step.
12. `onBookingCreated` fires in the parent page.

## 11. Troubleshooting

If the popup does not open:

- confirm `fs-events-host.js` is loading on the page
- confirm `window.FSEventsEmbed` exists in DevTools

If the iframe opens but stays blank:

- confirm `fan-booking.html` exists in the plugin
- confirm `assets/booking/...` files were copied
- confirm there are no 404s for built JS/CSS files

If the popup opens on step 1 even when `eventId` is provided:

- confirm the `eventId` exists in the creator’s active catalog
- confirm the `creatorId` is correct
- confirm the event is still active

If booking API calls fail:

- confirm same-origin auth/session is available
- confirm the iframe can reach the expected API
- if needed, pass `apiBaseUrl` explicitly from WordPress
