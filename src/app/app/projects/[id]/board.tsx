"use client";

import { useId, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragCancelEvent,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, ChevronDown, GripVertical, ListChecks, Pencil, Plus, Ruler, StickyNote, Trash2, X, Image as ImageIcon } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { timeAgo } from "@/lib/format";
import { uploadPhotos } from "@/lib/upload";
import {
  CARD_COLORS,
  boardPreview,
  checklistProgress,
  moveId,
  type CardColor,
  type CardItem,
  type CardKind,
  type ChecklistItem,
  type Measure,
} from "@/lib/board";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { PhotoPicker, type PickedPhoto } from "@/components/ui/Photos";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { addCard, deleteCard, prepareProjectUploads, reorderCards, setBoardItemDone, updateCard } from "../actions";
import type { ProjectData } from "./ProjectView";

type Card = ProjectData["cards"][number];

const COLOR_CLASS: Record<CardColor, string> = {
  yellow: "bg-note-yellow border-note-yellow-edge",
  green: "bg-note-green border-note-green-edge",
  blue: "bg-note-blue border-note-blue-edge",
  pink: "bg-note-pink border-note-pink-edge",
  gray: "bg-note-gray border-note-gray-edge",
};

const KIND_ICON: Record<CardKind, React.ComponentType<{ className?: string }>> = {
  note: StickyNote,
  checklist: ListChecks,
  photo: ImageIcon,
  measures: Ruler,
};

const newId = () => Math.random().toString(36).slice(2, 10);

function useRun() {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, done?: string, after?: () => void) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) toast(res.error ?? "Error", "error");
      else {
        if (done) toast(done);
        after?.();
      }
      router.refresh();
    });
  return { pending, run, start, toast, router };
}

/** The site whiteboard on top of the feed: a sortable grid of cards. */
export function Board({ data }: { data: ProjectData }) {
  const { t } = useT();
  const { start, toast, router } = useRun();
  const [expanded, setExpanded] = useState(false);
  const [picking, setPicking] = useState(false);
  const [editing, setEditing] = useState<{ card: Card | null; kind: CardKind } | null>(null);
  const [cards, setCards] = useOptimistic(data.cards);

  // Local order while dragging; resets whenever the server order changes.
  const serverOrder = data.cards.map((c) => c.id);
  const [order, setOrder] = useState(serverOrder);
  const [synced, setSynced] = useState(serverOrder.join());
  if (synced !== serverOrder.join()) {
    setSynced(serverOrder.join());
    setOrder(serverOrder);
  }
  const byId = new Map(cards.map((c) => [c.id, c]));
  const list = order.flatMap((id) => byId.get(id) ?? []);
  const { shown, hidden } = boardPreview(list, expanded);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  // A stable id keeps dnd-kit's aria ids the same on server and client.
  const dndId = useId();
  const name = (id: UniqueIdentifier | undefined) => {
    const c = id ? byId.get(String(id)) : undefined;
    return c ? c.title || t(`board.${c.kind}`) : "";
  };
  const accessibility = {
    screenReaderInstructions: { draggable: t("board.dragHelp") },
    announcements: {
      onDragStart: ({ active }: DragStartEvent) => t("board.dragStart", { card: name(active.id) }),
      onDragOver: ({ active, over }: DragOverEvent) => (over ? t("board.dragOver", { card: name(active.id), over: name(over.id) }) : undefined),
      onDragEnd: ({ active, over }: DragEndEvent) => (over ? t("board.dragEnd", { card: name(active.id), over: name(over.id) }) : undefined),
      onDragCancel: ({ active }: DragCancelEvent) => t("board.dragCancel", { card: name(active.id) }),
    },
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const next = moveId(order, String(active.id), String(over.id));
    setOrder(next);
    start(async () => {
      const res = await reorderCards(data.project.id, next);
      if (!res.ok) {
        toast(res.error, "error");
        setOrder(serverOrder);
      }
      router.refresh();
    });
  };

  const tick = (card: Card, itemId: string, done: boolean) =>
    start(async () => {
      setCards(cards.map((c) => (c.id === card.id ? { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, done } : i)) } : c)));
      const res = await setBoardItemDone(card.id, data.project.id, itemId, done);
      if (!res.ok) toast(res.error, "error");
      router.refresh();
    });

  return (
    <section className="grid gap-3">
      <div className="flex items-end justify-between gap-3">
        <div className="grid gap-0.5">
          <h2 className="text-[15px] font-semibold">{t("board.title")}</h2>
          <p className="text-sm text-ink-2">{t("board.hint")}</p>
        </div>
        <Button size="sm" variant="secondary" icon={<Plus className="size-4" />} onClick={() => setPicking(true)}>
          {t("board.add")}
        </Button>
      </div>

      {list.length === 0 ? (
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="rounded-(--r-card) border border-dashed border-line px-4 py-6 text-center text-sm text-ink-2 transition hover:border-ink-2/40 hover:text-ink"
        >
          {t("board.empty")}
        </button>
      ) : (
        <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd} accessibility={accessibility}>
          <SortableContext items={shown.map((c) => c.id)} strategy={rectSortingStrategy}>
            <div className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((c) => (
                <BoardCard key={c.id} card={c} onEdit={() => setEditing({ card: c, kind: c.kind })} onTick={(itemId, done) => tick(c, itemId, done)} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {(hidden > 0 || expanded) && list.length > 0 && (
        <button type="button" onClick={() => setExpanded((x) => !x)} className="flex items-center gap-1.5 justify-self-start text-sm font-semibold text-ink-2 hover:text-ink">
          <ChevronDown className={cn("size-4 transition", expanded && "rotate-180")} />
          {expanded ? t("board.showLess") : t("board.seeAll", { n: list.length })}
        </button>
      )}

      <Sheet open={picking} onClose={() => setPicking(false)} title={t("board.addCard")}>
        <div className="grid gap-2">
          {(["note", "checklist", "photo", "measures"] as const).map((kind) => {
            const Icon = KIND_ICON[kind];
            return (
              <button
                key={kind}
                type="button"
                onClick={() => {
                  setPicking(false);
                  setEditing({ card: null, kind });
                }}
                className="flex items-center gap-3.5 rounded-(--r-card) border border-line p-3.5 text-left transition hover:bg-surface-2 active:scale-[0.99]"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-strong">
                  <Icon className="size-5" />
                </span>
                <span className="grid gap-0.5">
                  <span className="font-medium">{t(`board.${kind}`)}</span>
                  <span className="text-sm text-ink-2">{t(`board.${kind}Hint`)}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Sheet>

      {editing && <CardSheet key={editing.card?.id ?? editing.kind} data={data} card={editing.card} kind={editing.kind} onClose={() => setEditing(null)} />}
    </section>
  );
}

function BoardCard({ card, onEdit, onTick }: { card: Card; onEdit: () => void; onTick: (itemId: string, done: boolean) => void }) {
  const { t, locale } = useT();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const Icon = KIND_ICON[card.kind];
  const label = card.title || t(`board.${card.kind}`);

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "grid gap-2.5 rounded-(--r-card) border p-3 text-ink shadow-soft",
        COLOR_CLASS[card.color],
        isDragging && "relative z-10 shadow-lift ring-2 ring-accent/40",
      )}
    >
      <header className="flex items-center gap-1.5">
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={t("board.drag", { card: label })}
          {...attributes}
          {...listeners}
          className="-ml-1 inline-flex size-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-ink-2 hover:bg-ink/5 active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
        <Icon className="size-4 shrink-0 text-ink-2" />
        <h3 className="min-w-0 flex-1 truncate font-semibold">{label}</h3>
        <button
          type="button"
          aria-label={`${t("board.editCard")}: ${label}`}
          onClick={onEdit}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-2 hover:bg-ink/5 hover:text-ink"
        >
          <Pencil className="size-4" />
        </button>
      </header>

      {card.kind === "note" && card.body && (
        <button type="button" onClick={onEdit} className="text-left leading-relaxed whitespace-pre-wrap break-words">
          {card.body}
        </button>
      )}

      {card.kind === "photo" && (
        <button type="button" onClick={onEdit} className="grid gap-2 text-left">
          {card.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.photo} alt={card.body || label} className="aspect-[4/3] w-full rounded-lg object-cover" />
          )}
          {card.body && <span className="text-sm leading-relaxed whitespace-pre-wrap break-words">{card.body}</span>}
        </button>
      )}

      {card.kind === "checklist" && <Checklist items={card.items as ChecklistItem[]} onTick={onTick} />}

      {card.kind === "measures" && (
        <button type="button" onClick={onEdit} className="text-left">
          <dl className="grid gap-1">
            {(card.items as Measure[]).map((m) => (
              <div key={m.id} className="flex items-baseline justify-between gap-3 border-b border-ink/10 pb-1 last:border-0">
                <dt className="min-w-0 break-words text-sm text-ink-2">{m.label}</dt>
                <dd className="tabular shrink-0 font-semibold">{m.value}</dd>
              </div>
            ))}
          </dl>
        </button>
      )}

      {card.editor && <p suppressHydrationWarning className="text-xs text-ink-2">{t("board.edited", { name: card.editor, when: timeAgo(card.updated_at, locale) })}</p>}
    </article>
  );
}

function Checklist({ items, onTick }: { items: ChecklistItem[]; onTick: (itemId: string, done: boolean) => void }) {
  const { t } = useT();
  const { done, total } = checklistProgress(items);
  return (
    <div className="grid gap-1">
      <span className="text-xs font-semibold text-ink-2">{t("board.progress", { done, total })}</span>
      {items.map((i) => (
        <button
          key={i.id}
          type="button"
          role="checkbox"
          aria-checked={i.done}
          onClick={() => onTick(i.id, !i.done)}
          className="flex min-h-10 items-center gap-2.5 rounded-lg px-1 text-left hover:bg-ink/5"
        >
          <span
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition",
              i.done ? "border-accent-strong bg-accent-strong text-accent-ink" : "border-ink-2/40",
            )}
          >
            {i.done && <Check className="size-3.5" strokeWidth={3} />}
          </span>
          <span className={cn("min-w-0 break-words", i.done && "text-ink-2 line-through")}>{i.text}</span>
        </button>
      ))}
    </div>
  );
}

/** Create (card = null) or edit a card of the given kind. */
function CardSheet({ data, card, kind, onClose }: { data: ProjectData; card: Card | null; kind: CardKind; onClose: () => void }) {
  const { t } = useT();
  const { pending, run, toast } = useRun();
  const [, startUpload] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState(card?.title ?? "");
  const [body, setBody] = useState(card?.body ?? "");
  const [color, setColor] = useState<CardColor>(card?.color ?? (kind === "photo" ? "gray" : "yellow"));
  const [items, setItems] = useState<CardItem[]>(
    card?.items.length ? card.items : kind === "checklist" ? [{ id: newId(), text: "", done: false }] : kind === "measures" ? [{ id: newId(), label: "", value: "" }] : [],
  );
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [focusId, setFocusId] = useState<string | null>(null);
  const canDelete = card && (data.viewer.isAdmin || data.viewer.isSupervisor || card.created_by === data.viewer.id);

  const setItem = (id: string, patch: Partial<ChecklistItem & Measure>) => setItems((xs) => xs.map((x) => (x.id === id ? ({ ...x, ...patch } as CardItem) : x)));
  const addRow = () => {
    const id = newId();
    setItems((xs) => [...xs, kind === "checklist" ? { id, text: "", done: false } : { id, label: "", value: "" }]);
    setFocusId(id);
  };

  const save = () =>
    startUpload(async () => {
      let photoPath = card?.photo_path ?? null;
      if (kind === "photo" && photos.length) {
        setUploading(true);
        const targets = await prepareProjectUploads(data.project.id, 1);
        if (!targets.ok) {
          setUploading(false);
          return toast(targets.error, "error");
        }
        photoPath = (await uploadPhotos(targets.data, photos))[0] ?? null;
        setUploading(false);
        if (!photoPath) return toast("Upload failed", "error");
      }
      const input = { kind, title, body, color, items, photoPath };
      run(() => (card ? updateCard(card.id, data.project.id, input) : addCard(data.project.id, input)), card ? t("board.saved") : t("board.added"), onClose);
    });

  return (
    <Sheet
      open
      onClose={onClose}
      title={`${card ? t("board.editCard") : t("board.addCard")} · ${t(`board.${kind}`)}`}
      footer={
        <div className="flex gap-2">
          {canDelete && (
            <Button
              variant="danger"
              size="lg"
              loading={pending}
              icon={<Trash2 className="size-5" />}
              aria-label={t("common.delete")}
              onClick={() => run(() => deleteCard(card.id, data.project.id), t("board.deleted"), onClose)}
            />
          )}
          <Button block size="lg" loading={pending || uploading} onClick={save}>
            {card ? t("common.save") : t("board.addCard")}
          </Button>
        </div>
      }
    >
      <div className="grid gap-5">
        {kind !== "photo" && (
          <Field label={t("board.cardTitle")} optional={kind === "note" ? t("common.optional") : undefined}>
            {(p) => <Input {...p} value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />}
          </Field>
        )}

        {kind === "note" && <Field label={t("board.text")}>{(p) => <Textarea {...p} rows={5} value={body} maxLength={4000} onChange={(e) => setBody(e.target.value)} />}</Field>}

        {kind === "photo" && (
          <>
            {card?.photo && !photos.length && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.photo} alt="" className="aspect-[4/3] w-full rounded-xl object-cover" />
            )}
            <PhotoPicker value={photos} onChange={setPhotos} max={1} label={t("board.photo")} />
            <Field label={t("board.caption")} optional={t("common.optional")}>
              {(p) => <Textarea {...p} rows={2} value={body} maxLength={4000} onChange={(e) => setBody(e.target.value)} />}
            </Field>
          </>
        )}

        {kind === "checklist" && (
          <div className="grid gap-2">
            {(items as ChecklistItem[]).map((i) => (
              <div key={i.id} className="flex items-center gap-2">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={i.done}
                  aria-label={i.text || t("board.item")}
                  onClick={() => setItem(i.id, { done: !i.done })}
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-md border-2",
                    i.done ? "border-accent-strong bg-accent-strong text-accent-ink" : "border-line",
                  )}
                >
                  {i.done && <Check className="size-4" strokeWidth={3} />}
                </button>
                <Input
                  autoFocus={i.id === focusId}
                  aria-label={t("board.item")}
                  placeholder={t("board.item")}
                  value={i.text}
                  maxLength={300}
                  onChange={(e) => setItem(i.id, { text: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addRow();
                    }
                  }}
                />
                <RemoveLine onClick={() => setItems((xs) => xs.filter((x) => x.id !== i.id))} />
              </div>
            ))}
            <Button variant="ghost" size="sm" icon={<Plus className="size-4" />} onClick={addRow} className="justify-self-start">
              {t("board.addItem")}
            </Button>
          </div>
        )}

        {kind === "measures" && (
          <div className="grid gap-2">
            {(items as Measure[]).map((m) => (
              <div key={m.id} className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] items-center gap-2">
                <Input
                  autoFocus={m.id === focusId}
                  aria-label={t("board.label")}
                  placeholder={t("board.label")}
                  value={m.label}
                  maxLength={120}
                  onChange={(e) => setItem(m.id, { label: e.target.value })}
                />
                <Input aria-label={t("board.value")} placeholder={t("board.value")} value={m.value} maxLength={120} onChange={(e) => setItem(m.id, { value: e.target.value })} />
                <RemoveLine onClick={() => setItems((xs) => xs.filter((x) => x.id !== m.id))} />
              </div>
            ))}
            <Button variant="ghost" size="sm" icon={<Plus className="size-4" />} onClick={addRow} className="justify-self-start">
              {t("board.addMeasure")}
            </Button>
          </div>
        )}

        <div className="grid gap-2">
          <span className="text-sm font-medium">{t("board.color")}</span>
          <div role="radiogroup" aria-label={t("board.color")} className="flex gap-2">
            {CARD_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={color === c}
                aria-label={t(`board.colorName.${c}`)}
                onClick={() => setColor(c)}
                className={cn("size-10 rounded-full border-2 transition", COLOR_CLASS[c], color === c && "ring-2 ring-accent ring-offset-2 ring-offset-surface")}
              />
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  );
}

function RemoveLine({ onClick }: { onClick: () => void }) {
  const { t } = useT();
  return (
    <button
      type="button"
      aria-label={t("board.removeLine")}
      onClick={onClick}
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-(--r-control) text-ink-2 hover:bg-danger-soft hover:text-danger"
    >
      <X className="size-4" />
    </button>
  );
}
