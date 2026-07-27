import { z } from "zod";

export const CHECKLIST_DEPARTMENTS = ["kitchen", "front", "front_kitchen"] as const;

export type ChecklistDepartmentValue = (typeof CHECKLIST_DEPARTMENTS)[number];

export const DAILY_TASK_DEPARTMENTS = ["all", "kitchen", "front", "front_kitchen"] as const;

export type DailyTaskDepartmentValue = (typeof DAILY_TASK_DEPARTMENTS)[number];

// Client-safe (no DB import) — used by both the server-side queries module and
// client components like ChecklistItemForm, which must not pull in lib/db.ts.
export const DEPARTMENT_LABELS: Record<DailyTaskDepartmentValue, string> = {
  kitchen: "Kitchen",
  front: "Front",
  front_kitchen: "Front & Kitchen",
  all: "All Staff",
};

export const checklistItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
  department: z.enum(CHECKLIST_DEPARTMENTS),
});

export type ChecklistItemInput = z.infer<typeof checklistItemSchema>;
