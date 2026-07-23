import { z } from "zod";
import type { DailyExpenseCategory } from "@prisma/client";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// Matches the daily_financial_records money columns: DECIMAL(14,2).
const moneyField = z.coerce
  .number({ message: "Enter a number" })
  .nonnegative("Must be zero or more")
  .max(999_999_999_999.99, "Too large")
  .multipleOf(0.01, "Use at most 2 decimal places");

export const dailyFinancialRecordSchema = z.object({
  date: z.string().regex(dateRegex, "Invalid date"),
  totalSales: moneyField,
  expectedCash: moneyField,
  actualCash: moneyField,
  notes: z
    .string()
    .trim()
    .max(2000, "Notes are too long")
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export type DailyFinancialRecordInput = z.infer<typeof dailyFinancialRecordSchema>;

export const dailyExpenseCategories = [
  "ingredients",
  "packaging",
  "utilities",
  "transport",
  "marketing",
  "misc",
] as const;

export const DAILY_EXPENSE_CATEGORY_LABELS: Record<DailyExpenseCategory, string> = {
  ingredients: "Ingredients",
  packaging: "Packaging",
  utilities: "Utilities",
  transport: "Transport",
  marketing: "Marketing",
  misc: "Misc",
};

// Matches the daily_expenses.amount column: DECIMAL(12,2).
const expenseAmountField = z.coerce
  .number({ message: "Enter a number" })
  .positive("Must be more than zero")
  .max(9_999_999_999.99, "Too large")
  .multipleOf(0.01, "Use at most 2 decimal places");

export const dailyExpenseSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
  amount: expenseAmountField,
  category: z.enum(dailyExpenseCategories, { message: "Choose a category" }),
});

export type DailyExpenseInput = z.infer<typeof dailyExpenseSchema>;
