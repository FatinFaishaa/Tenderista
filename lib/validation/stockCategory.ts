import { z } from "zod";

export const stockCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150, "Name is too long"),
});

export type StockCategoryInput = z.infer<typeof stockCategorySchema>;
