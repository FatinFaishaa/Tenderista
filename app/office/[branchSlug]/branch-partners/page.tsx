import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { listBranchPartners } from "@/lib/branchPartners/queries";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BranchPartnerRowControls } from "@/components/staff/BranchPartnerRowControls";

export default async function BranchPartnersPage({
  params,
}: {
  params: Promise<{ branchSlug: string }>;
}) {
  const { branchSlug } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");
  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");
  if (branch.role !== "owner" || !branch.isPrimaryOwner) {
    redirect(`/office/${branchSlug}/dashboard`);
  }
  const partners = await listBranchPartners(branch.id, session.userId);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Partner Cawangan
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Gives someone full access like an Owner, but limited to this branch only.
          </p>
        </div>
        <Link href={`/office/${branchSlug}/branch-partners/new`}>
          <Button>+ Add Partner</Button>
        </Link>
      </div>
      {partners.length === 0 ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-600">
          No Partner Cawangan yet for this branch.
        </p>
      ) : (
        <div className="space-y-2">
          {partners.map((partner) => (
            <Card key={partner.id} className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{partner.name}</p>
                {partner.email && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{partner.email}</p>
                )}
              </div>
              <BranchPartnerRowControls branchSlug={branchSlug} partnerId={partner.id} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
