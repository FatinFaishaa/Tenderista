import { z } from "zod";

export const LEAVE_TYPES = ["annual", "medical", "emergency", "unpaid", "other"] as const;

export type LeaveTypeValue = (typeof LEAVE_TYPES)[number];

export const LEAVE_TYPE_LABELS: Record<LeaveTypeValue, string> = {
  annual: "Annual",
  medical: "Medical",
  emergency: "Emergency",
  unpaid: "Unpaid",
  other: "Other",
};

export const LEAVE_STATUSES = ["pending", "approved", "rejected", "cancelled"] as const;

export type LeaveStatusValue = (typeof LEAVE_STATUSES)[number];

export const LEAVE_STATUS_LABELS: Record<LeaveStatusValue, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const LEAVE_STATUS_TONES: Record<
  LeaveStatusValue,
  "neutral" | "success" | "warning" | "danger"
> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  cancelled: "neutral",
};

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const leaveRequestCreateSchema = z
  .object({
    type: z.enum(LEAVE_TYPES),
    startDate: z.string().regex(dateRegex, "Invalid date"),
    endDate: z.string().regex(dateRegex, "Invalid date"),
    reason: z.string().trim().min(1, "A reason is required").max(1000, "Reason is too long"),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date cannot be earlier than start date",
    path: ["endDate"],
  });

export type LeaveRequestCreateInput = z.infer<typeof leaveRequestCreateSchema>;

export const leaveReviewSchema = z.object({
  reviewNotes: z
    .string()
    .trim()
    .max(1000, "Notes are too long")
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export type LeaveReviewInput = z.infer<typeof leaveReviewSchema>;
