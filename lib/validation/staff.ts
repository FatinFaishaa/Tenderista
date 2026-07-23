import { z } from "zod";
import { CHECKLIST_DEPARTMENTS } from "@/lib/validation/checklist";

// Suggested values for the role/position datalist — not a hard enum, since the free-text
// jobPosition field already holds other values (e.g. "Branch Manager" from the seed data)
// that this V1 feature doesn't need to migrate or constrain.
export const STAFF_POSITION_SUGGESTIONS = ["Kitchen Crew", "Barista", "Cashier"] as const;

const departmentField = z
  .union([z.enum(CHECKLIST_DEPARTMENTS), z.literal("")])
  .optional()
  .transform((value) => (value ? value : undefined));

export const staffCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150, "Name is too long"),
  email: z.string().trim().email("Enter a valid email"),
  jobPosition: z.string().trim().min(1, "Role is required").max(100, "Role is too long"),
  department: departmentField,
  // Only used if this email doesn't already belong to an existing account.
  password: z
    .union([z.string().min(8, "Password must be at least 8 characters"), z.literal("")])
    .optional(),
});

export const staffEditSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150, "Name is too long"),
  email: z.string().trim().email("Enter a valid email"),
  jobPosition: z.string().trim().min(1, "Role is required").max(100, "Role is too long"),
  department: departmentField,
});

export type StaffCreateInput = z.infer<typeof staffCreateSchema>;
export type StaffEditInput = z.infer<typeof staffEditSchema>;
