-- 1. Create the new stock_categories table
CREATE TABLE "stock_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stock_categories_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "stock_categories" ADD CONSTRAINT "stock_categories_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "stock_categories_branch_id_name_key" ON "stock_categories"("branch_id", "name");

-- 2. Seed one category row per branch per existing enum value, so every branch
-- (even ones with zero stock items so far) gets all six folders to start with.
INSERT INTO "stock_categories" (branch_id, name, sort_order)
SELECT id, 'Kitchen', 0 FROM branches
UNION ALL
SELECT id, 'Barista', 1 FROM branches
UNION ALL
SELECT id, 'Cashier', 2 FROM branches
UNION ALL
SELECT id, 'Kedai (Umum)', 3 FROM branches
UNION ALL
SELECT id, 'Sauce Korean', 4 FROM branches
UNION ALL
SELECT id, 'Sauce Honey Garlic', 5 FROM branches;

-- 3. Add the new column as nullable first, so we can populate it before enforcing NOT NULL.
ALTER TABLE "stock_items" ADD COLUMN "category_id" UUID;

-- 4. Map every existing item's old enum value to the matching new category row,
-- scoped to the same branch (so items in different branches never cross-link).
UPDATE "stock_items" si
SET category_id = sc.id
FROM "stock_categories" sc
WHERE sc.branch_id = si.branch_id
  AND (
    (si.category = 'kitchen' AND sc.name = 'Kitchen') OR
    (si.category = 'barista' AND sc.name = 'Barista') OR
    (si.category = 'cashier' AND sc.name = 'Cashier') OR
    (si.category = 'kedai' AND sc.name = 'Kedai (Umum)') OR
    (si.category = 'sauce_korean' AND sc.name = 'Sauce Korean') OR
    (si.category = 'sauce_honey_garlic' AND sc.name = 'Sauce Honey Garlic')
  );

-- 5. Every row should now have a category_id — enforce NOT NULL.
ALTER TABLE "stock_items" ALTER COLUMN "category_id" SET NOT NULL;

-- 6. Add the foreign key now that the column is fully populated.
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "stock_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 7. Drop the old enum column — its data has already been carried over to category_id.
ALTER TABLE "stock_items" DROP COLUMN "category";

-- 8. Drop the now-unused enum type.
DROP TYPE "stock_category_enum";
