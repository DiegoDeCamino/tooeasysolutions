export type CardKind = "note" | "checklist" | "photo" | "measures";
export type CardColor = "yellow" | "green" | "blue" | "pink" | "gray";
export type ChecklistItem = { id: string; text: string; done: boolean };
export type Measure = { id: string; label: string; value: string };
export type CardItem = ChecklistItem | Measure;

export const CARD_KINDS: CardKind[] = ["note", "checklist", "photo", "measures"];
export const CARD_COLORS: CardColor[] = ["yellow", "green", "blue", "pink", "gray"];
/** Cards shown before "See all", so the posts below stay in reach. */
export const BOARD_PREVIEW = 6;
/** Cards are a full screen wide on phones, so fewer fit before the feed. */
export const BOARD_PREVIEW_PHONE = 3;

/** The order after dragging `active` onto `over`. */
export function moveId(ids: string[], active: string, over: string) {
  const from = ids.indexOf(active);
  const to = ids.indexOf(over);
  if (from < 0 || to < 0 || from === to) return ids;
  const next = [...ids];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
}

export function checklistProgress(items: ChecklistItem[]) {
  return { done: items.filter((i) => i.done).length, total: items.length };
}

export function boardPreview<T>(cards: T[], expanded: boolean, limit = BOARD_PREVIEW) {
  const shown = expanded ? cards : cards.slice(0, limit);
  return { shown, hidden: cards.length - shown.length };
}

/** Trim rows and drop empty ones before saving. Notes and photos carry no items. */
export function cleanItems(kind: CardKind, items: CardItem[]): CardItem[] {
  if (kind === "checklist") {
    return (items as ChecklistItem[]).map((i) => ({ id: i.id, text: i.text.trim(), done: Boolean(i.done) })).filter((i) => i.text);
  }
  if (kind === "measures") {
    return (items as Measure[]).map((m) => ({ id: m.id, label: m.label.trim(), value: m.value.trim() })).filter((m) => m.label || m.value);
  }
  return [];
}
