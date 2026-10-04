import { describe, expect, it } from "vitest";
import { addDays, formatHours, formatMoney, initials, perthDateTime, todayPerth } from "./format";

describe("format", () => {
  it("formats money without cents when whole", () => {
    expect(formatMoney(415)).toBe("$415");
    expect(formatMoney(412.5)).toBe("$412.50");
  });
  it("formats hours as h/m", () => {
    expect(formatHours(3.75)).toBe("3h 45m");
    expect(formatHours(4)).toBe("4h");
    expect(formatHours(0.5)).toBe("30m");
  });
  it("builds Perth instants", () => {
    expect(perthDateTime("2026-10-10", "09:00").toISOString()).toBe("2026-10-10T01:00:00.000Z");
  });
  it("knows the Perth calendar date", () => {
    expect(todayPerth(new Date("2026-10-10T17:00:00Z"))).toBe("2026-10-11");
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
  });
  it("makes initials", () => {
    expect(initials("Kiri Waititi")).toBe("KW");
    expect(initials("Ana")).toBe("A");
    expect(initials("")).toBe("?");
  });
});
