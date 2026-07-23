import { z } from "zod";

export const sopSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
  category: z.string().trim().min(1, "Category is required").max(150, "Category name is too long"),
  content: z.string().trim().min(1, "Content is required"),
});

export type SopInput = z.infer<typeof sopSchema>;
