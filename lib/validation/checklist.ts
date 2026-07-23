import { z } from "zod";

export const CHECKLIST_DEPARTMENTS = ["kitchen", "cashier", "dining", "cleaning"] as const;

export type ChecklistDepartmentValue = (typeof CHECKLIST_DEPARTMENTS)[number];

// Client-safe (no DB import) — used by both the server-side queries module and
// client components like ChecklistItemForm, which must not pull in lib/db.ts.
export const DEPARTMENT_LABELS: Record<(typeof CHECKLIST_DEPARTMENTS)[number], string> = {
  kitchen: "Kitchen",
  cashier: "Cashier",
  dining: "Dining",
  cleaning: "Cleaning",
};

export const checklistItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
  department: z.enum(CHECKLIST_DEPARTMENTS),
});

export type ChecklistItemInput = z.infer<typeof checklistItemSchema>;
