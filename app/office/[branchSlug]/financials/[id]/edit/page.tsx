import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getDailyFinancialRecordById } from "@/lib/financials/queries";
import { DailyFinancialRecordForm } from "@/components/financials/DailyFinancialRecordForm";

export default async function EditFinancialRecordPage({
  params,
}: {
  params: Promise<{ branchSlug: string; id: string }>;
}) {
  const { branchSlug, id } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");

  const record = await getDailyFinancialRecordById(branch.id, session.userId, id);
  if (!record) notFound();

  return (
    <div className="max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Edit Daily Record
      </h1>
      <DailyFinancialRecordForm
        branchSlug={branchSlug}
        recordId={record.id}
        initialValues={{
          date: record.date,
          totalSales: record.totalSales,
          expectedCash: record.expectedCash,
          actualCash: record.actualCash,
          notes: record.notes,
        }}
      />
    </div>
  );
}
