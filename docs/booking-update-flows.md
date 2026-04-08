# Booking Update Flows

These flow-system actions let components mutate bookings without calling the bookings API directly.

## Available Flows

- `bookings.renegotiateBooking`
- `bookings.rescheduleBooking`
- `bookings.cancelBooking`

All three are write flows and invalidate:

- `fan-booking:creator-context`
- `dashboard-events:context`

## Usage

Import and run through `FlowHandler`:

```js
import FlowHandler from "@/services/flow-system/FlowHandler.js";
```

### Renegotiate

```js
const result = await FlowHandler.run("bookings.renegotiateBooking", {
  bookingId: "b_evt_123",
  personalRequestText: "Updated request",
  sessionDurationMinutes: 30,
  costTokens: 150,
  requestedAddOns: [
    { title: "Record our session" },
    { title: "Follow-up notes" },
  ],
  actor: "system",
  args: {
    source: "calendar_adjustment",
  },
});
```

Accepted payload fields:

- `bookingId`
- `personalRequestText` optional
- `sessionDurationMinutes` optional
- `costTokens` optional
- `requestedAddOns` optional
- `actor` optional, defaults to `"system"`
- `args` optional

Renegotiate add-on notes:

- add-ons replace the full selected set for the booking
- the canonical request field is `requestedAddOns`
- recommended item shape is `{ title: string }`
- add-on prices are recalculated on the backend from the event's `addOns` catalog
- if add-ons change, the backend uses one replacement hold only
- if `costTokens` is also provided, it is treated as the renegotiated non-add-on amount and the add-on total is layered on top

### Reschedule

```js
const result = await FlowHandler.run("bookings.rescheduleBooking", {
  bookingId: "b_evt_123",
  startAtIso: "2026-04-10T10:00:00+08:00",
  actor: "system",
  args: {
    source: "calendar_drag",
  },
});
```

Accepted payload fields:

- `bookingId`
- `startAtIso`
- `actor` optional, defaults to `"system"`
- `args` optional

### Cancel

```js
const result = await FlowHandler.run("bookings.cancelBooking", {
  bookingId: "b_evt_123",
  actor: "creator",
  reason: "Creator unavailable",
  waiveFees: false,
  args: {
    source: "calendar_popup",
  },
});
```

Accepted payload fields:

- `bookingId`
- `actor`
- `reason` optional
- `waiveFees` optional
- `args` optional

## Success Shape

`bookings.renegotiateBooking` and `bookings.rescheduleBooking` return:

```js
{
  ok: true,
  data: {
    bookingId: "b_evt_123",
    actionType: "renegotiate",
    item: { ...updatedBooking }
  }
}
```

`bookings.cancelBooking` returns:

```js
{
  ok: true,
  data: {
    bookingId: "b_evt_123",
    item: { ...updatedBooking },
    reverse: { ... } || null
  }
}
```

Use `result.ok` and `result.data` the same way other flow-system write flows are handled in the app.

## Common Failures

Renegotiate / reschedule can surface backend errors such as:

- `booking_update_not_allowed_in_status`
- `duration_change_not_allowed`
- `duration_change_invalid_multiple`
- `duration_change_exceeds_max`
- `cost_change_requires_held_payment`
- `cost_change_not_allowed_for_captured_payment`
- `booking_update_unknown_addon`
- `booking_not_in_slot`
- `booking_overlaps_existing`

Cancel can surface:

- `booking_not_cancellable`
- `missing_txid`
- token reversal failures

Flow-level local failures include:

- `BOOKING_UPDATE_MISSING_ID`
- `BOOKING_UPDATE_INVALID_ACTION`
- `CANCEL_BOOKING_MISSING_ID`

## Notes

- `bookings.cancelBooking` already existed; it now flushes the same dashboard cache as the new booking update flows.
- `bookingId` can also be derived by the renegotiate/reschedule mappers from common shapes like `event.bookingId` and `event.raw.bookingId`.
