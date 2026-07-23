import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const rosterAssignmentSchema = z
  .object({
    staffId: z.string().uuid(),
    date: z.string().regex(dateRegex, "Invalid date"),
    isOffDay: z.boolean(),
    shiftId: z.string().uuid().nullable().optional(),
    startTime: z.string().regex(timeRegex, "Use HH:MM").nullable().optional(),
    endTime: z.string().regex(timeRegex, "Use HH:MM").nullable().optional(),
  })
  .refine((data) => data.isOffDay || (data.startTime && data.endTime), {
    message: "Start and end time are required unless it's an off day.",
    path: ["startTime"],
  });

export type RosterAssignmentInput = z.infer<typeof rosterAssignmentSchema>;

export const publishWeekSchema = z.object({
  weekStart: z.string().regex(dateRegex, "Invalid week"),
});
