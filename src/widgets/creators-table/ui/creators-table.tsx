"use client";

import { useEffect, useState } from "react";

import { ApiError } from "@/shared/api/api-client";
import { Button } from "@/shared/ui/button";
import type { Creator } from "@/entities/creator/types";

import { deactivateCreator, listCreators } from "@/features/creator-management/api/creators";

export function CreatorsTable() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [pendingUuid, setPendingUuid] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listCreators()
      .then((data) => {
        if (active) {
          setCreators(data);
          setError(null);
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError instanceof ApiError ? loadError.message : "Не удалось загрузить креаторов.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  function handleRefresh() {
    setIsLoading(true);
    setReloadKey((key) => key + 1);
  }

  async function handleDeactivate(uuid: string) {
    setPendingUuid(uuid);
    setError(null);
    try {
      const updated = await deactivateCreator(uuid);
      setCreators((prev) => prev.map((creator) => (creator.uuid === uuid ? updated : creator)));
    } catch (actionError) {
      setError(actionError instanceof ApiError ? actionError.message : "Не удалось деактивировать.");
    } finally {
      setPendingUuid(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Креаторы</h2>
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
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Имя</th>
              <th className="px-3 py-2 font-medium">Активен</th>
              <th className="px-3 py-2 font-medium">Действия</th>
            </tr>
          </thead>
          <tbody>
            {creators.length === 0 && !isLoading ? (
              <tr>
                <td className="px-3 py-3 text-zinc-500" colSpan={5}>
                  Нет креаторов.
                </td>
              </tr>
            ) : null}
            {creators.map((creator) => (
              <tr className="border-t border-zinc-100" key={creator.uuid}>
                <td className="px-3 py-2 font-mono text-xs">{creator.uuid}</td>
                <td className="px-3 py-2">{creator.email}</td>
                <td className="px-3 py-2">{creator.name ?? "—"}</td>
                <td className="px-3 py-2">{creator.active ? "да" : "нет"}</td>
                <td className="px-3 py-2">
                  <Button
                    disabled={!creator.active}
                    isLoading={pendingUuid === creator.uuid}
                    onClick={() => void handleDeactivate(creator.uuid)}
                    variant="danger"
                  >
                    Деактивировать
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
