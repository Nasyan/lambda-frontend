import type { User } from "@/entities/user/types";

type UserAvatarProps = {
  user: Pick<User, "email" | "name">;
};

export function UserAvatar({ user }: UserAvatarProps) {
  return (
    <span
      aria-label={user.name}
      className="inline-flex size-9 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white"
      title={user.name}
    >
      {getInitials(user.name || user.email)}
    </span>
  );
}

function getInitials(value: string): string {
  const initials = value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "U";
}
