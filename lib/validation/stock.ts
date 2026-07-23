import { z } from "zod";

// Matches the stock_items.current_quantity / min_alert_level columns: DECIMAL(10,2).
const quantityField = z.coerce
  .number({ message: "Enter a number" })
  .nonnegative("Must be zero or more")
  .max(99_999_999.99, "Too large")
  .multipleOf(0.01, "Use at most 2 decimal places");

export const stockItemSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150, "Name is too long"),
  unit: z
    .string()
    .trim()
    .max(20, "Unit is too long")
    .optional()
    .transform((value) => (value ? value : undefined)),
  minAlertLevel: quantityField,
});

// Creation only — the Owner sets the starting on-hand count once, here. After that,
// currentQuantity is exclusively updated through stockQuantitySchema (any branch
// member, via the quantity route) — the item-edit route never touches it.
export const stockItemCreateSchema = stockItemSchema.extend({
  currentQuantity: quantityField,
});

export const stockQuantitySchema = z.object({
  currentQuantity: quantityField,
});

export type StockItemInput = z.infer<typeof stockItemSchema>;
export type StockItemCreateInput = z.infer<typeof stockItemCreateSchema>;
export type StockQuantityInput = z.infer<typeof stockQuantitySchema>;
