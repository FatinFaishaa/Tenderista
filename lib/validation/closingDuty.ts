import { z } from "zod";

export const closingDutyOverrideSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  staffId: z.string().uuid("Invalid staff ID"),
});

export type ClosingDutyOverrideInput = z.infer<typeof closingDutyOverrideSchema>;
