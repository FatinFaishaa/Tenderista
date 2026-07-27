import { z } from "zod";
import { DAILY_TASK_DEPARTMENTS } from "@/lib/validation/checklist";

export const dailyTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
  isPriority: z.boolean().optional(),
  department: z.enum(DAILY_TASK_DEPARTMENTS).optional(),
});

export type DailyTaskInput = z.infer<typeof dailyTaskSchema>;
