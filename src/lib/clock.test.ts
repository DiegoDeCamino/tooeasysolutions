import { describe, expect, it } from "vitest";
import { elapsedMinutes, entryRange, perthHHMM } from "./clock";

describe("elapsedMinutes", () => {
  it("counts whole minutes since clock in", () => {
    expect(elapsedMinutes("2026-10-20T00:00:00Z", new Date("2026-10-20T03:12:59Z"))).toBe(192);
  });

  it("never goes negative when the device clock is behind", () => {
    expect(elapsedMinutes("2026-10-20T03:00:00Z", new Date("2026-10-20T02:59:00Z"))).toBe(0);
  });
});

describe("entryRange", () => {
  it("reads Perth wall-clock times", () => {
    const r = entryRange("2026-10-20", "07:00", "15:30")!;
    expect(r.startedAt.toISOString()).toBe("2026-10-19T23:00:00.000Z");
    expect(r.endedAt!.toISOString()).toBe("2026-10-20T07:30:00.000Z");
  });

  it("rolls an end before the start into the next day", () => {
    const r = entryRange("2026-10-20", "18:00", "02:00")!;
    expect(r.endedAt!.toISOString()).toBe("2026-10-20T18:00:00.000Z");
  });

  it("leaves an open entry open", () => {
    expect(entryRange("2026-10-20", "07:00", null)!.endedAt).toBeNull();
  });

  it("rejects an end equal to the start", () => {
    expect(entryRange("2026-10-20", "07:00", "07:00")).toBeNull();
  });

  it("rejects malformed times", () => {
    expect(entryRange("2026-10-20", "7am", "15:00")).toBeNull();
  });
});

describe("perthHHMM", () => {
  it("shows an instant as 24h Perth wall time", () => {
    expect(perthHHMM("2026-10-19T23:05:00Z")).toBe("07:05");
    expect(perthHHMM("2026-10-20T16:00:00Z")).toBe("00:00");
  });
});
