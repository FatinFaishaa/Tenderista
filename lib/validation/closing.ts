import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const closeDaySchema = z.object({
  date: z.string().regex(dateRegex, "Invalid date"),
  notes: z
    .string()
    .trim()
    .max(2000, "Notes are too long")
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export type CloseDayInput = z.infer<typeof closeDaySchema>;

export const reopenDaySchema = z.object({
  date: z.string().regex(dateRegex, "Invalid date"),
  reason: z.string().trim().min(1, "A reason is required").max(500, "Reason is too long"),
});

export type ReopenDayInput = z.infer<typeof reopenDaySchema>;
