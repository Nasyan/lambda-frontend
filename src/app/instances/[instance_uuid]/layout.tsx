import type { ReactNode } from "react";

import { Header } from "@/widgets/header/ui/header";
import { Sidebar } from "@/widgets/sidebar/ui/sidebar";

type InstanceLayoutProps = {
  children: ReactNode;
  params: Promise<{
    instance_uuid: string;
  }>;
};

export default async function InstanceLayout({ children, params }: InstanceLayoutProps) {
  const { instance_uuid: instanceUuid } = await params;

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-950">
      <Sidebar instanceUuid={instanceUuid} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header instanceUuid={instanceUuid} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
