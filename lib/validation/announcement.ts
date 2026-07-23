import { z } from "zod";

export const announcementSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
  message: z.string().trim().min(1, "Message is required"),
});

export type AnnouncementInput = z.infer<typeof announcementSchema>;
