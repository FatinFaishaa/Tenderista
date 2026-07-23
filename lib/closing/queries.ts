import { withTenantContext } from "@/lib/db";
import { formatDateKey, parseDateKey } from "@/lib/utils/week";

// Daily Closing V1 — a soft-close review record for a single day, deliberately
// separate from the fuller MonthlyClosing module. Stores no financial figures of its
// own; Sales/Expenses/Net/Cash Difference are always read live from
// daily_financial_records via lib/financials/queries.ts (see the Closing page, which
// reuses that module's getDailyFinancialRecordByDate + FinancialSummary directly).

export class DailyClosingNoRecordError extends Error {}
export class DailyClosingNotFoundError extends Error {}

export type DailyClosingStatus = {
  date: string;
  isClosed: boolean;
  closedByName: string | null;
  closedAt: Date | null;
  reopenedByName: string | null;
  reopenedAt: Date | null;
  notes: string | null;
};

function openStatus(date: string): DailyClosingStatus {
  return {
    date,
    isClosed: false,
    closedByName: null,
    closedAt: null,
    reopenedByName: null,
    reopenedAt: null,
    notes: null,
  };
}

/** For the Closing page and the Dashboard's status card — a day with no
 * daily_closings row yet is simply "open" (never closed), not an error or a
 * separate "unset" state. */
export async function getDailyClosingByDate(
  branchId: string,
  userId: string,
  date: string
): Promise<DailyClosingStatus> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const row = await tx.dailyClosing.findFirst({
      where: { branchId, date: parseDateKey(date) },
      include: {
        closer: { select: { name: true } },
        reopener: { select: { name: true } },
      },
    });
    if (!row) return openStatus(date);

    return {
      date: formatDateKey(row.date),
      isClosed: row.isClosed,
      closedByName: row.closer?.name ?? null,
      closedAt: row.closedAt,
      reopenedByName: row.reopener?.name ?? null,
      reopenedAt: row.reopenedAt,
      notes: row.notes,
    };
  });
}

/** Owner/Manager only: marks a day reviewed and closed. Requires that day's
 * DailyFinancialRecord already exist — closing a day with nothing recorded yet
 * isn't meaningful. Soft close only: this never touches daily_financial_records or
 * daily_expenses — editing either stays fully enabled regardless of closed status
 * (V1 scope; enforcing a real lock is a natural, separate follow-up). */
export async function closeDay(
  branchId: string,
  userId: string,
  date: string,
  input: { notes?: string }
): Promise<{ id: string }> {
  const parsedDate = parseDateKey(date);

  return withTenantContext({ userId, branchId }, async (tx) => {
    const record = await tx.dailyFinancialRecord.findFirst({
      where: { branchId, date: parsedDate },
      select: { id: true },
    });
    if (!record) {
      throw new DailyClosingNoRecordError(
        "Create a daily financial record for this date before closing it."
      );
    }

    const closing = await tx.dailyClosing.upsert({
      where: { branchId_date: { branchId, date: parsedDate } },
      create: {
        branchId,
        date: parsedDate,
        isClosed: true,
        closedBy: userId,
        closedAt: new Date(),
        notes: input.notes ?? null,
      },
      update: {
        isClosed: true,
        closedBy: userId,
        closedAt: new Date(),
        notes: input.notes ?? null,
      },
    });
    return { id: closing.id };
  });
}

/** Owner only: reopens a previously closed day. The reason is appended to any
 * existing close notes (there's no separate reopen-reason column in V1) so the
 * original close note isn't lost. */
export async function reopenDay(
  branchId: string,
  userId: string,
  date: string,
  input: { reason: string }
): Promise<void> {
  const parsedDate = parseDateKey(date);

  await withTenantContext({ userId, branchId }, async (tx) => {
    const existing = await tx.dailyClosing.findFirst({
      where: { branchId, date: parsedDate },
    });
    if (!existing || !existing.isClosed) {
      throw new DailyClosingNotFoundError("This day isn't closed.");
    }

    const notes = existing.notes
      ? `${existing.notes}\n\nReopened: ${input.reason}`
      : `Reopened: ${input.reason}`;

    await tx.dailyClosing.update({
      where: { id: existing.id },
      data: {
        isClosed: false,
        reopenedBy: userId,
        reopenedAt: new Date(),
        notes,
      },
    });
  });
}
