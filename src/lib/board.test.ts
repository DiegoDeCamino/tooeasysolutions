import { describe, expect, it } from "vitest";
import { boardPreview, checklistProgress, cleanItems, moveId } from "./board";

describe("moveId", () => {
  it("moves a card to where it was dropped", () => {
    expect(moveId(["a", "b", "c", "d"], "a", "c")).toEqual(["b", "c", "a", "d"]);
    expect(moveId(["a", "b", "c", "d"], "d", "b")).toEqual(["a", "d", "b", "c"]);
  });

  it("leaves the order alone for unknown ids or a drop on itself", () => {
    expect(moveId(["a", "b"], "a", "a")).toEqual(["a", "b"]);
    expect(moveId(["a", "b"], "x", "a")).toEqual(["a", "b"]);
  });
});

describe("checklistProgress", () => {
  it("counts ticked items", () => {
    expect(checklistProgress([{ id: "1", text: "a", done: true }, { id: "2", text: "b", done: false }])).toEqual({ done: 1, total: 2 });
    expect(checklistProgress([])).toEqual({ done: 0, total: 0 });
  });
});

describe("boardPreview", () => {
  const cards = ["1", "2", "3", "4", "5", "6", "7", "8"];
  it("shows the first six until expanded", () => {
    expect(boardPreview(cards, false)).toEqual({ shown: cards.slice(0, 6), hidden: 2 });
    expect(boardPreview(cards, true)).toEqual({ shown: cards, hidden: 0 });
    expect(boardPreview(cards.slice(0, 3), false)).toEqual({ shown: cards.slice(0, 3), hidden: 0 });
  });
});

describe("cleanItems", () => {
  it("drops blank checklist rows and trims text", () => {
    expect(cleanItems("checklist", [{ id: "1", text: "  Screws ", done: false }, { id: "2", text: "   ", done: true }])).toEqual([
      { id: "1", text: "Screws", done: false },
    ]);
  });

  it("keeps measures with a label or a value", () => {
    expect(cleanItems("measures", [{ id: "1", label: "Deck height", value: " 600 mm" }, { id: "2", label: "", value: "" }, { id: "3", label: "", value: "45°" }])).toEqual([
      { id: "1", label: "Deck height", value: "600 mm" },
      { id: "3", label: "", value: "45°" },
    ]);
  });

  it("has no items for notes and photos", () => {
    expect(cleanItems("note", [{ id: "1", text: "x", done: false }])).toEqual([]);
  });
});
