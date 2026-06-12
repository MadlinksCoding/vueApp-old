import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scriptPath = path.resolve(__dirname, "../../../wp/wp-content/plugins/fansocial/assets/new-profile/hero-right-buttons.js");

function loadSlotLogic(nowIso = "2026-05-06T00:00:00+08:00") {
  const source = fs.readFileSync(scriptPath, "utf8");
  const RealDate = Date;
  const fixedNowMs = new RealDate(nowIso).getTime();

  class FakeDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) {
        super(fixedNowMs);
        return;
      }
      super(...args);
    }

    static now() {
      return fixedNowMs;
    }
  }

  FakeDate.parse = RealDate.parse;
  FakeDate.UTC = RealDate.UTC;

  const context = {
    Date: FakeDate,
    Intl,
    console,
    setInterval: () => 0,
    clearInterval: () => {},
    setTimeout: () => 0,
    fetch: () => Promise.resolve({ json: () => Promise.resolve({ ok: true, items: [] }) }),
    siteData: { bookingsBackendLambdaEndpoint: "http://localhost:3001" },
    userData: { userId: 1, jwtToken: "test" },
    userSpecifiData: {
      currentUser: { userId: 1 },
      targetUser: { userId: 1407, avatar: "", userDisplayName: "Creator" },
    },
    document: {
      readyState: "loading",
      addEventListener: () => {},
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
    },
  };
  context.window = context;
  context.globalThis = context;

  vm.runInNewContext(source, context, { filename: scriptPath });
  return context.__FSHeroRightButtonsSlotLogic;
}

function reportedMonthlyEvent(overrides = {}) {
  return {
    eventId: "evt_13110e16-033b-45d9-b944-97dc4937edc5",
    type: "1on1-call",
    repeatRule: "monthly",
    dateFrom: "2026-05-06",
    dateTo: "2026-05-21",
    sessionDurationMinutes: 5,
    slots: [{ startTime: "04:45", endTime: "16:25" }],
    ...overrides,
  };
}

describe("profile hero booking card slot logic", () => {
  it("does not show a monthly next slot after dateTo has passed", () => {
    const logic = loadSlotLogic("2026-06-01T00:00:00+08:00");

    expect(logic.getNextCardSlot(reportedMonthlyEvent(), [], "1")).toBeNull();
    expect(logic.formatNextSlot(null)).toBe("");
  });

  it("shows the monthly anchor slot while the event is inside dateFrom/dateTo", () => {
    const logic = loadSlotLogic("2026-05-06T00:00:00+08:00");
    const next = logic.getNextCardSlot(reportedMonthlyEvent(), [], "1");

    expect(next).toEqual(expect.objectContaining({
      durationMinutes: 5,
    }));
    expect(next.startMs).toBe(new Date("2026-05-06T04:45:00+08:00").getTime());
  });

  it("does not show daily, weekly, or weekend recurring slots after dateTo", () => {
    const logic = loadSlotLogic("2026-06-01T00:00:00+08:00");
    const base = {
      eventId: "evt_range",
      type: "1on1-call",
      dateFrom: "2026-05-01",
      dateTo: "2026-05-21",
      sessionDurationMinutes: 5,
      slots: [{ day: "saturday", startTime: "04:45", endTime: "05:45" }],
    };

    expect(logic.getNextCardSlot({ ...base, repeatRule: "daily" }, [], "1")).toBeNull();
    expect(logic.getNextCardSlot({ ...base, repeatRule: "weekly" }, [], "1")).toBeNull();
    expect(logic.getNextCardSlot({ ...base, repeatRule: "every_weekend" }, [], "1")).toBeNull();
  });

  it("skips booked private slots when choosing the next profile-card slot", () => {
    const logic = loadSlotLogic("2026-05-06T00:00:00+08:00");
    const event = {
      eventId: "evt_private_booked",
      type: "1on1-call",
      repeatRule: "daily",
      dateFrom: "2026-05-06",
      dateTo: "2026-05-06",
      sessionDurationMinutes: 5,
      slots: [{ startTime: "04:45", endTime: "05:00" }],
    };
    const booked = [{
      eventId: "evt_private_booked",
      startIso: "2026-05-06T04:45:00+08:00",
      endIso: "2026-05-06T04:50:00+08:00",
      status: "confirmed",
    }];

    const next = logic.getNextCardSlot(event, booked, "1");
    expect(next.startMs).toBe(new Date("2026-05-06T04:50:00+08:00").getTime());
  });

  it("keeps group capacity checks for profile-card slots", () => {
    const logic = loadSlotLogic("2026-05-06T00:00:00+08:00");
    const event = {
      eventId: "evt_group_full",
      type: "group-event",
      repeatRule: "doesNotRepeat",
      dateFrom: "2026-05-06",
      enableMaxAttendees: true,
      maxAttendees: 1,
      slots: [{ date: "2026-05-06", times: [{ startTime: "04:45", endTime: "05:45" }] }],
    };
    const booked = [{
      eventId: "evt_group_full",
      startIso: "2026-05-06T04:45:00+08:00",
      endIso: "2026-05-06T05:45:00+08:00",
      status: "confirmed",
    }];

    expect(logic.getNextCardSlot(event, booked, "1")).toBeNull();
  });
});
