"use client";

import { useState } from "react";

import { CreateInstanceForm } from "@/features/instance-management/ui/create-instance-form";
import { InstancesTable } from "@/widgets/instances-table/ui/instances-table";
import { CreatorsTable } from "@/widgets/creators-table/ui/creators-table";

export default function AdminInstancesPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-950">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header>
          <p className="text-sm font-medium text-zinc-500">Администрирование</p>
          <h1 className="mt-1 text-2xl font-semibold">Управление инстансами</h1>
        </header>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Создать инстанс</h2>
          <div className="mt-4">
            <CreateInstanceForm onCreated={() => setRefreshKey((key) => key + 1)} />
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <InstancesTable refreshKey={refreshKey} />
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <CreatorsTable />
        </section>
      </div>
    </main>
  );
}
