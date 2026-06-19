"use client";

import { useRouter } from "next/navigation";

import { UserAvatar } from "@/entities/user/ui/user-avatar";
import { useUserStore } from "@/entities/user/model/user-store";
import { Button } from "@/shared/ui/button";

type HeaderProps = {
  instanceUuid: string;
};

export function Header({ instanceUuid }: HeaderProps) {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const clear = useUserStore((state) => state.clear);

  function handleLogout() {
    clear();
    router.push("/");
  }

  return (
    <header className="flex min-h-16 items-center justify-between border-b border-zinc-200 bg-white px-4">
      <div>
        <p className="text-sm font-semibold text-zinc-950">Рабочее пространство</p>
        <p className="break-all text-xs text-zinc-500">{instanceUuid}</p>
      </div>
      <div className="flex items-center gap-3">
        {user ? <UserAvatar user={user} /> : null}
        <Button onClick={handleLogout} variant="secondary">
          Выйти
        </Button>
      </div>
    </header>
  );
}
