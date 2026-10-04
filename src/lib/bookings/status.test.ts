import { describe, expect, it } from "vitest";
import { allowedActions, canTransition, isEditable, nextStatus } from "./status";

describe("booking status machine", () => {
  it("follows the happy path", () => {
    expect(nextStatus("requested", "confirm")).toBe("awaiting_payment");
    expect(nextStatus("awaiting_payment", "mark_paid")).toBe("scheduled");
    expect(nextStatus("scheduled", "complete")).toBe("completed");
  });

  it("declines only new requests", () => {
    expect(canTransition("requested", "decline")).toBe(true);
    expect(canTransition("scheduled", "decline")).toBe(false);
  });

  it("cancels anything not finished", () => {
    for (const s of ["requested", "awaiting_payment", "scheduled"] as const) {
      expect(nextStatus(s, "cancel")).toBe("cancelled");
    }
    expect(canTransition("completed", "cancel")).toBe(false);
    expect(canTransition("declined", "cancel")).toBe(false);
  });

  it("rejects skipping payment", () => {
    expect(() => nextStatus("requested", "mark_paid")).toThrow();
  });

  it("lists actions for the admin UI", () => {
    expect(allowedActions("requested")).toEqual(["confirm", "decline", "cancel"]);
    expect(allowedActions("completed")).toEqual([]);
  });

  it("only allows price edits before scheduling", () => {
    expect(isEditable("requested")).toBe(true);
    expect(isEditable("awaiting_payment")).toBe(true);
    expect(isEditable("scheduled")).toBe(false);
  });
});
