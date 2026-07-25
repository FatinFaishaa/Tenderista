-- CreateEnum
CREATE TYPE "stock_category_enum" AS ENUM ('kitchen', 'barista', 'cashier', 'kedai');

-- AlterTable
ALTER TABLE "stock_items" ADD COLUMN     "category" "stock_category_enum" NOT NULL DEFAULT 'kedai';
