import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import {
  getMyFullProfile,
  getAvatarEmojiOptions,
  AVATAR_IMAGE_OPTIONS,
} from "@/lib/staff/queries";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { AvatarEmojiPicker } from "@/components/staff/AvatarEmojiPicker";
import { AvatarImagePicker } from "@/components/staff/AvatarImagePicker";
import { Avatar } from "@/components/staff/Avatar";
import { MyProfileForm } from "@/components/staff/MyProfileForm";

const MENU_ITEMS = [
  { label: "Staff", icon: "👥", href: "staff" },
  { label: "Roster", icon: "📅", href: "roster" },
  { label: "Inventory", icon: "📦", href: "inventory" },
  { label: "Financials", icon: "💰", href: "financials" },
  { label: "Announcements", icon: "📢", href: "announcements" },
  { label: "Attendance", icon: "⏱️", href: "attendance" },
] as const;

export default async function OwnerAccountPage({
  params,
}: {
  params: Promise<{ branchSlug: string }>;
}) {
  const { branchSlug } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");

  const [profile, emojiOptions] = await Promise.all([
    getMyFullProfile(branch.id, session.userId),
    Promise.resolve(getAvatarEmojiOptions()),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Akaun</h1>

      <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Avatar avatarEmoji={profile.avatarEmoji} avatarImage={profile.avatarImage} size={56} />
        <div>
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{profile.name}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Owner</p>
        </div>
      </div>

      <AvatarImagePicker
        branchSlug={branchSlug}
        currentImage={profile.avatarImage}
        options={AVATAR_IMAGE_OPTIONS}
      />

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
        initialContactPhone={profile.contactPhone}
        initialEmergencyContact={profile.emergencyContact}
      />

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {MENU_ITEMS.map((item, i) => (
          <Link
            key={item.href}
            href={`/office/${branchSlug}/${item.href}`}
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
