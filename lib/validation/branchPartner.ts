import { z } from "zod";

// A "Partner Cawangan" is a second BranchOwner row on one specific branch — full
// Owner-level access within that branch only, no job position/department/salary
// fields (unlike Staff), since they aren't a staff member being scheduled or paid
// hourly/monthly through this system.
export const branchPartnerCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150, "Name is too long"),
  email: z.string().trim().email("Enter a valid email"),
  password: z
    .string()
    .min(1, "Set an initial password — this email doesn't have an account yet")
    .optional(),
});

export type BranchPartnerCreateInput = z.infer<typeof branchPartnerCreateSchema>;
