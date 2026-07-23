import { z } from "zod";

export const dailyTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
});

export type DailyTaskInput = z.infer<typeof dailyTaskSchema>;
