import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getMyProfile, getAvatarEmojiOptions } from "@/lib/staff/queries";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { AvatarEmojiPicker } from "@/components/staff/AvatarEmojiPicker";

const MENU_ITEMS = [
  { label: "Attendance", icon: "⏱️", href: "attendance" },
  { label: "Checklist", icon: "✅", href: "checklists" },
  { label: "Closing Checklist", icon: "🔒", href: "closing-checklists" },
  { label: "Inventory", icon: "📦", href: "inventory" },
  { label: "Announcements", icon: "📢", href: "announcements" },
  { label: "My Leave", icon: "🌴", href: "leave" },
] as const;

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

  const profile = await getMyProfile(branch.id, session.userId);
  const emojiOptions = getAvatarEmojiOptions();

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
