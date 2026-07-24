import { describe, expect, it } from 'vitest';
import {
  formatGmtOffsetLabel,
  getFixedOffsetDateTimeParts,
} from '@/services/bookings/utils/fixedOffsetTimezone.js';

describe('fixed offset timezone utilities', () => {
  it('formats whole-hour, half-hour, and quarter-hour GMT labels', () => {
    expect(formatGmtOffsetLabel(480)).toBe('GMT+08:00');
    expect(formatGmtOffsetLabel(-210)).toBe('GMT-03:30');
    expect(formatGmtOffsetLabel(345)).toBe('GMT+05:45');
  });

  it('rebuckets absolute timestamps across midnight', () => {
    const timestamp = Date.parse('2030-01-15T23:30:00Z');

    expect(getFixedOffsetDateTimeParts(timestamp, 0)).toEqual(expect.objectContaining({
      dateIso: '2030-01-15',
      hm: '23:30',
    }));
    expect(getFixedOffsetDateTimeParts(timestamp, 480)).toEqual(expect.objectContaining({
      dateIso: '2030-01-16',
      hm: '07:30',
    }));
  });
});
