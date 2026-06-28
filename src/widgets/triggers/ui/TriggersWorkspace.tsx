"use client";

import { useRouter } from "next/navigation";
import { AppSidebar } from "@/src/widgets/app-sidebar/ui/AppSidebar";
import { useTriggers } from "../model/useTriggers";
import { TriggersHeader } from "./TriggersHeader";
import { TriggersList } from "./TriggersList";
import { getInstanceUuidFromAccessToken } from "@/src/shared/lib/session";
import { useEffect, useState } from "react";

export function TriggersWorkspace() {
  const router = useRouter();

  const {
    triggers,
    loading,
    error,
    message,
    editingId,
    handleDelete,
    handleExecute,
  } = useTriggers();

  const [instanceUuid, setInstanceUuid] = useState<string | null>(null);

  useEffect(() => {
    setInstanceUuid(getInstanceUuidFromAccessToken());
  }, []);

  // Handler для перехода на страницу создания триггера
  const handleCreateRedirect = () => {
    router.push("/triggers/create");
  };

  // Handler для перехода на страницу редактирования конкретного триггера
  const handleEditRedirect = (id: string) => {
    router.push(`/triggers/${id}/edit`);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-950 md:flex">
      <AppSidebar />
      <main className="flex-1 p-4 md:p-6 flex flex-col h-screen overflow-hidden">
        {/* Шапка и уведомления */}
        <TriggersHeader
          instanceUuid={instanceUuid}
          error={error}
          message={message}
        />

        {/* Панель инструментов (Добавление кнопок управления) */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-2 rounded-md border border-gray-300 px-3 py-2 max-w-md bg-white">
            <span className="text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Поиск триггеров..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          {/* КНОПКА ДОБАВИТЬ ТРИГГЕР */}
          <button
            onClick={handleCreateRedirect}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Добавить триггер +
          </button>
        </div>

        {/* Основной контент: теперь на всю ширину (1col), так как форма уехала */}
        <div className="flex-1 min-h-0 overflow-hidden bg-white rounded-md border border-gray-200">
          {/* СПИСОК ТРИГГЕРОВ */}
          <TriggersList
            triggers={triggers}
            loading={loading}
            editingId={editingId}
            loadTriggers={() => {}}
            handleExecute={handleExecute}
            // Передаем новый хэндлер редиректа вместо openEdit
            openEdit={(trigger: any) => {
              const id = trigger.id || trigger._id || trigger.uuid;
              handleEditRedirect(id);
            }}
            handleDelete={handleDelete}
          />
        </div>
      </main>
    </div>
  );
}
