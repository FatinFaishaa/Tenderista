import { withTenantContext } from "@/lib/db";
import { formatDateKey, parseDateKey } from "@/lib/utils/week";
import type { DailyExpenseCategory } from "@prisma/client";

export class DailyFinancialRecordNotFoundError extends Error {}
export class DailyFinancialRecordExistsError extends Error {}
export class DailyExpenseNotFoundError extends Error {}

export type DailyExpenseRow = {
  id: string;
  title: string;
  amount: number;
  category: DailyExpenseCategory;
  createdAt: Date;
};

export type DailyFinancialRecordRow = {
  id: string;
  date: string;
  totalSales: number;
  expectedCash: number;
  actualCash: number;
  notes: string | null;
  expenses: DailyExpenseRow[];
  // Computed at read time, not stored — mirrors stock_items' "isLow".
  totalExpenses: number;
  netCashFlow: number;
  cashDifference: number;
};

function toRow(record: {
  id: string;
  date: Date;
  totalSales: unknown;
  expectedCash: unknown;
  actualCash: unknown;
  notes: string | null;
  expenses: { id: string; title: string; amount: unknown; category: DailyExpenseCategory; createdAt: Date }[];
}): DailyFinancialRecordRow {
  const totalSales = Number(record.totalSales);
  const expectedCash = Number(record.expectedCash);
  const actualCash = Number(record.actualCash);
  const expenses = record.expenses.map((e) => ({
    id: e.id,
    title: e.title,
    amount: Number(e.amount),
    category: e.category,
    createdAt: e.createdAt,
  }));
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return {
    id: record.id,
    date: formatDateKey(record.date),
    totalSales,
    expectedCash,
    actualCash,
    notes: record.notes,
    expenses,
    totalExpenses,
    netCashFlow: totalSales - totalExpenses,
    cashDifference: actualCash - expectedCash,
  };
}

function isUniqueConstraintError(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";
}

/** For the date-nav'd Financials page (Owner/Manager and Staff both use this — the
 * only difference is which controls the page renders around it). */
export async function getDailyFinancialRecordByDate(
  branchId: string,
  userId: string,
  date: string
): Promise<DailyFinancialRecordRow | null> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const record = await tx.dailyFinancialRecord.findFirst({
      where: { branchId, date: parseDateKey(date) },
      include: { expenses: { orderBy: { createdAt: "asc" } } },
    });
    return record ? toRow(record) : null;
  });
}

export async function getDailyFinancialRecordById(
  branchId: string,
  userId: string,
  id: string
): Promise<DailyFinancialRecordRow | null> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const record = await tx.dailyFinancialRecord.findFirst({
      where: { id, branchId },
      include: { expenses: { orderBy: { createdAt: "asc" } } },
    });
    return record ? toRow(record) : null;
  });
}

export type MonthlyFinancialSummary = {
  totalSales: number;
  totalExpenses: number;
  net: number;
};

/** For the Owner Dashboard's "This Month" section — sums every day's record from
 * the 1st of the branch-local month through `today` (inclusive). Reuses `toRow`
 * so each day's totalExpenses is computed exactly the way the Financials page
 * computes it; days with no record simply aren't in the result set and contribute
 * zero, the same "absence means zero" behavior the single-day view already has. */
export async function getMonthlyFinancialSummary(
  branchId: string,
  userId: string,
  today: string
): Promise<MonthlyFinancialSummary> {
  const monthStart = `${today.slice(0, 7)}-01`;

  return withTenantContext({ userId, branchId }, async (tx) => {
    const records = await tx.dailyFinancialRecord.findMany({
      where: { branchId, date: { gte: parseDateKey(monthStart), lte: parseDateKey(today) } },
      include: { expenses: true },
    });

    const rows = records.map(toRow);
    const totalSales = rows.reduce((sum, r) => sum + r.totalSales, 0);
    const totalExpenses = rows.reduce((sum, r) => sum + r.totalExpenses, 0);

    return { totalSales, totalExpenses, net: totalSales - totalExpenses };
  });
}

/** Owner/Manager only: one record per branch per day — creating a second for the
 * same date is rejected rather than silently merged; the Owner/Manager should edit
 * the existing one instead. */
export async function createDailyFinancialRecord(
  branchId: string,
  userId: string,
  input: {
    date: string;
    totalSales: number;
    expectedCash: number;
    actualCash: number;
    notes?: string;
  }
): Promise<{ id: string }> {
  try {
    const record = await withTenantContext({ userId, branchId }, (tx) =>
      tx.dailyFinancialRecord.create({
        data: {
          branchId,
          date: parseDateKey(input.date),
          totalSales: input.totalSales,
          expectedCash: input.expectedCash,
          actualCash: input.actualCash,
          notes: input.notes ?? null,
          createdBy: userId,
        },
      })
    );
    return { id: record.id };
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      throw new DailyFinancialRecordExistsError("A record already exists for this date.");
    }
    throw err;
  }
}

/** Owner/Manager only: totalSales/expectedCash/actualCash/notes — the date is the
 * record's identity and isn't editable after creation. */
export async function updateDailyFinancialRecord(
  branchId: string,
  userId: string,
  id: string,
  input: { totalSales: number; expectedCash: number; actualCash: number; notes?: string }
): Promise<void> {
  const result = await withTenantContext({ userId, branchId }, (tx) =>
    tx.dailyFinancialRecord.updateMany({
      where: { id, branchId },
      data: {
        totalSales: input.totalSales,
        expectedCash: input.expectedCash,
        actualCash: input.actualCash,
        notes: input.notes ?? null,
        updatedBy: userId,
      },
    })
  );
  if (result.count === 0) throw new DailyFinancialRecordNotFoundError("Record not found.");
}

/** Owner/Manager only: adds an expense to an existing day's record. */
export async function addDailyExpense(
  branchId: string,
  userId: string,
  recordId: string,
  input: { title: string; amount: number; category: DailyExpenseCategory }
): Promise<{ id: string }> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const record = await tx.dailyFinancialRecord.findFirst({ where: { id: recordId, branchId } });
    if (!record) throw new DailyFinancialRecordNotFoundError("Record not found.");

    const expense = await tx.dailyExpense.create({
      data: {
        branchId,
        recordId,
        title: input.title,
        amount: input.amount,
        category: input.category,
        createdBy: userId,
      },
    });
    return { id: expense.id };
  });
}

/** Owner/Manager only. */
export async function updateDailyExpense(
  branchId: string,
  userId: string,
  id: string,
  input: { title: string; amount: number; category: DailyExpenseCategory }
): Promise<void> {
  const result = await withTenantContext({ userId, branchId }, (tx) =>
    tx.dailyExpense.updateMany({
      where: { id, branchId },
      data: { title: input.title, amount: input.amount, category: input.category },
    })
  );
  if (result.count === 0) throw new DailyExpenseNotFoundError("Expense not found.");
}

/** Owner/Manager only. */
export async function deleteDailyExpense(branchId: string, userId: string, id: string): Promise<void> {
  const result = await withTenantContext({ userId, branchId }, (tx) =>
    tx.dailyExpense.deleteMany({ where: { id, branchId } })
  );
  if (result.count === 0) throw new DailyExpenseNotFoundError("Expense not found.");
}
