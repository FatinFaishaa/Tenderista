import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import {
  getMyFullProfile,
  getAvatarEmojiOptions,
  getMyEmploymentInfo,
} from "@/lib/staff/queries";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { AvatarEmojiPicker } from "@/components/staff/AvatarEmojiPicker";
import { MyProfileForm } from "@/components/staff/MyProfileForm";

const MENU_ITEMS = [
  { label: "Attendance", icon: "⏱️", href: "attendance" },
  { label: "Checklist", icon: "✅", href: "checklists" },
  { label: "Closing Checklist", icon: "🔒", href: "closing-checklists" },
  { label: "Inventory", icon: "📦", href: "inventory" },
  { label: "Announcements", icon: "📢", href: "announcements" },
  { label: "My Leave", icon: "🌴", href: "leave" },
] as const;

const SALARY_TYPE_LABELS: Record<string, string> = {
  monthly: "Full-time (Bulanan)",
  hourly: "Part-time (Sejam)",
  daily: "Harian",
};

export default async function AccountPage({
  params,
}: {
  params: Promise<{ branchSlug: string }>;
}) {
  const { branchSlug } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");

  const [profile, emojiOptions, employment] = await Promise.all([
    getMyFullProfile(branch.id, session.userId),
    Promise.resolve(getAvatarEmojiOptions()),
    getMyEmploymentInfo(branch.id, session.userId),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Akaun</h1>

      <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-cream text-3xl dark:bg-zinc-800">
          {profile.avatarEmoji}
        </span>
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{profile.name}</p>
      </div>

      <AvatarEmojiPicker
        branchSlug={branchSlug}
        currentEmoji={profile.avatarEmoji}
        options={emojiOptions}
      />

      <MyProfileForm
        branchSlug={branchSlug}
        initialName={profile.name}
        initialDateOfBirth={profile.dateOfBirth}
        initialAddress={profile.homeAddress}
      />

      {employment && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
            💼 Maklumat Pekerjaan
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400">Jenis</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {SALARY_TYPE_LABELS[employment.salaryType] ?? employment.salaryType}
              </span>
            </div>
            {employment.salaryType === "hourly" && employment.hourlyRate !== null && (
              <>
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Kadar Sejam</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    RM{employment.hourlyRate.toFixed(2)}/jam
                  </span>
                </div>
                <div className="mt-2 rounded-lg bg-brand-cream p-3 dark:bg-zinc-800">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Jumlah Gaji Setakat Ini</p>
                  <p className="text-xl font-bold text-brand-maroon dark:text-red-400">
                    RM{(employment.totalEarnedToDate ?? 0).toFixed(2)}
                  </p>
                </div>
              </>
            )}
            {employment.salaryType === "monthly" && employment.basicSalary !== null && (
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Gaji Bulanan</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  RM{employment.basicSalary.toFixed(2)}/bulan
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {MENU_ITEMS.map((item, i) => (
          <Link
            key={item.href}
            href={`/${branchSlug}/${item.href}`}
            className={`flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:text-zinc-50 dark:hover:bg-zinc-800 ${
              i !== MENU_ITEMS.length - 1 ? "border-b border-zinc-100 dark:border-zinc-800" : ""
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
            <span className="ml-auto text-zinc-300 dark:text-zinc-600">›</span>
          </Link>
        ))}
      </div>

      <LogoutButton />
    </div>
  );
}
