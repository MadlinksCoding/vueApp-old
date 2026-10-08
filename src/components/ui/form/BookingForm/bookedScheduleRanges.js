import { resolveBookedSlotEffectiveEndIso } from '@/services/bookings/utils/bookingSlotUtils.js';

// Project confirmed bookings into the creator's calendar, including overnight
// portions and paid extensions. Recurring choices must avoid every occurrence.
export function bookedScheduleRanges(bookings = [], timeZone = 'Asia/Hong_Kong', { from = '', to = '' } = {}) {
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const parts = ms => Object.fromEntries(formatter.formatToParts(new Date(ms)).map(p => [p.type, p.value]));
  const ranges = [];
  for (const booking of bookings) {
    if (String(booking.status).toLowerCase() !== 'confirmed') continue;
    const start = Date.parse(booking.startAtIso || booking.startIso || '');
    const end = Date.parse(resolveBookedSlotEffectiveEndIso(booking) || '');
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
    // Minute precision matches the schedule dropdowns; split at local midnight.
    let cursor = start;
    while (cursor < end) {
      const a = parts(cursor);
      const date = `${a.year}-${a.month}-${a.day}`;
      let next = end;
      const localDate = ms => { const p = parts(ms); return `${p.year}-${p.month}-${p.day}`; };
      if (localDate(end - 1) !== date) {
        let low = cursor;
        let high = Math.min(end, cursor + 36 * 3600000);
        while (high - low > 1) {
          const middle = Math.floor((low + high) / 2);
          if (localDate(middle) === date) low = middle;
          else high = middle;
        }
        next = high;
      }
      const b = parts(next);
      if ((!from || date >= from) && (!to || date <= to)) ranges.push({ date, day: new Date(`${date}T12:00:00`).getDay(), start: Number(a.hour) * 60 + Number(a.minute), end: `${b.year}-${b.month}-${b.day}` === date ? Number(b.hour) * 60 + Number(b.minute) : 1440 });
      cursor = next;
    }
  }
  return ranges;
}
