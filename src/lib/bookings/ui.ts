import type { Tone } from "@/components/ui/Display";
import type { BookingStatus } from "./status";

export const BOOKING_TONE: Record<BookingStatus, Tone> = {
  requested: "attention",
  awaiting_payment: "attention",
  scheduled: "accent",
  completed: "ok",
  declined: "neutral",
  cancelled: "neutral",
};

export const SHIFT_TONE: Record<string, Tone> = {
  open: "attention",
  full: "accent",
  done: "ok",
  cancelled: "neutral",
};
