import Image from "next/image";

export function Avatar({
  avatarEmoji,
  avatarImage,
  size = 56,
  className = "",
}: {
  avatarEmoji: string;
  avatarImage: string | null;
  size?: number;
  className?: string;
}) {
  if (avatarImage) {
    return (
      <span
        className={`inline-flex shrink-0 overflow-hidden rounded-full bg-brand-cream dark:bg-zinc-800 ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={`/avatars/${avatarImage}.png`}
          alt="Avatar"
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-brand-cream dark:bg-zinc-800 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.55 }}
    >
      {avatarEmoji}
    </span>
  );
}
