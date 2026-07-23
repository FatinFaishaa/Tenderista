-- Daily Financial Record V1 polish: adds a Marketing expense category alongside
-- Ingredients/Packaging/Utilities/Transport/Misc.

-- AlterEnum
ALTER TYPE "daily_expense_category_enum" ADD VALUE 'marketing';
