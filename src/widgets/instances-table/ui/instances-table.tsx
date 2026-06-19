"use client";

import { useEffect, useState } from "react";

import { ApiError } from "@/shared/api/api-client";
import { Button } from "@/shared/ui/button";
import type { Instance } from "@/entities/instance/types";

import { listInstances } from "@/features/instance-management/api/instances";

type InstancesTableProps = {
  refreshKey?: number;
};

export function InstancesTable({ refreshKey = 0 }: InstancesTableProps) {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    listInstances()
      .then((data) => {
        if (active) {
          setInstances(data);
          setError(null);
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError instanceof ApiError ? loadError.message : "Не удалось загрузить инстансы.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshKey, reloadKey]);

  function handleRefresh() {
    setIsLoading(true);
    setReloadKey((key) => key + 1);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Инстансы</h2>
        <Button isLoading={isLoading} onClick={handleRefresh} variant="secondary">
          Обновить
        </Button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="overflow-x-auto rounded-md border border-zinc-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-3 py-2 font-medium">UUID</th>
              <th className="px-3 py-2 font-medium">Название</th>
              <th className="px-3 py-2 font-medium">Активен</th>
            </tr>
          </thead>
          <tbody>
            {instances.length === 0 && !isLoading ? (
              <tr>
                <td className="px-3 py-3 text-zinc-500" colSpan={3}>
                  Нет инстансов.
                </td>
              </tr>
            ) : null}
            {instances.map((instance) => (
              <tr className="border-t border-zinc-100" key={instance.uuid}>
                <td className="px-3 py-2 font-mono text-xs">{instance.uuid}</td>
                <td className="px-3 py-2">{instance.title}</td>
                <td className="px-3 py-2">{instance.active ? "да" : "нет"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
