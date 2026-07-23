import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getBranchLocalDateString } from "@/lib/utils/branchDate";
import { DailyFinancialRecordForm } from "@/components/financials/DailyFinancialRecordForm";

export default async function NewFinancialRecordPage({
  params,
  searchParams,
}: {
  params: Promise<{ branchSlug: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { branchSlug } = await params;
  const { date: dateParam } = await searchParams;
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");

  const defaultDate = dateParam ?? getBranchLocalDateString(branch.timezone);

  return (
    <div className="max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Create Daily Record
      </h1>
      <DailyFinancialRecordForm branchSlug={branchSlug} defaultDate={defaultDate} />
    </div>
  );
}
