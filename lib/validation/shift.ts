import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const shiftTemplateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  startTime: z.string().regex(timeRegex, "Use HH:MM"),
  endTime: z.string().regex(timeRegex, "Use HH:MM"),
});

export type ShiftTemplateInput = z.infer<typeof shiftTemplateSchema>;
