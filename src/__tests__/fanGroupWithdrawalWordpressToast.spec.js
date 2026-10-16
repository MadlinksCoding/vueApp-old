import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const source = fs.readFileSync(path.resolve(process.cwd(), '../wp/wp-content/plugins/fansocial/templates/template-parts/dashboard/analytics-dashboard/templates/assets/js/booking-reminders-fan.js'), 'utf8');
afterEach(() => {
  delete window.__bookingReminderFanHandlersBound;
  delete window.__bookingReminderFanRuntime;
  delete window.FSShowFanBookingDecisionToast;
  delete window.FSOpenFanBookingDetails;
  delete window.FSEventsEmbed;
  delete window.showToast;
  delete window.userData;
});

describe('existing WordPress withdrawal notification', () => {
  it('shows the actual partial refund outcome and reopens the selected group booking from Detail', () => {
    window.__bookingReminderFanHandlersBound = true;
    window.userData = { userID: 1000 };
    window.FSEventsEmbed = { openBookingDetailsPopup: vi.fn() };
    window.showToast = vi.fn();
    window.eval(source);
    expect(window.FSShowFanBookingDecisionToast({ action: 'cancel', bookingId: 'group_booking',
      notification: { isGroupEvent: true, creatorUsername: 'host', refundState: 'partial',
        startAtIso: '2030-01-01T10:00:00Z', endAtIso: '2030-01-01T11:00:00Z' } })).toBe(true);
    const [, , duration, options] = window.showToast.mock.calls[0];
    expect(duration).toBe(-1);
    expect(options.title).toContain('partially refunded');
    expect(options.linkText).toBe('Detail');
    expect(options.link).toBe('#booking-details-group_booking');
    options.onLinkClick({ currentTarget: document.body });
    expect(window.FSEventsEmbed.openBookingDetailsPopup).toHaveBeenCalledWith(expect.objectContaining({ bookingId: 'group_booking', userRole: 'fan' }));
  });
});
