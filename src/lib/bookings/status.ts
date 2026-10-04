export type BookingStatus =
  | "requested"
  | "awaiting_payment"
  | "scheduled"
  | "completed"
  | "declined"
  | "cancelled";

export type BookingAction = "confirm" | "mark_paid" | "complete" | "decline" | "cancel";

const TRANSITIONS: Record<BookingStatus, Partial<Record<BookingAction, BookingStatus>>> = {
  requested: { confirm: "awaiting_payment", decline: "declined", cancel: "cancelled" },
  awaiting_payment: { mark_paid: "scheduled", cancel: "cancelled" },
  scheduled: { complete: "completed", cancel: "cancelled" },
  completed: {},
  declined: {},
  cancelled: {},
};

/** The steps a client sees on their tracker, in order. */
export const CLIENT_STEPS: BookingStatus[] = ["requested", "awaiting_payment", "scheduled", "completed"];

export function canTransition(from: BookingStatus, action: BookingAction): boolean {
  return TRANSITIONS[from][action] !== undefined;
}

export function nextStatus(from: BookingStatus, action: BookingAction): BookingStatus {
  const to = TRANSITIONS[from][action];
  if (!to) throw new Error(`Cannot ${action} a booking that is ${from}`);
  return to;
}

export function allowedActions(from: BookingStatus): BookingAction[] {
  return Object.keys(TRANSITIONS[from]) as BookingAction[];
}

/** Price, crew and hours can be changed until the booking is paid. */
export function isEditable(status: BookingStatus): boolean {
  return status === "requested" || status === "awaiting_payment";
}
