import React from "react";

interface TriggersHeaderProps {
  instanceUuid: string | null;
  error: string | null;
  message: string | null;
}

export function TriggersHeader({
  instanceUuid,
  error,
  message,
}: TriggersHeaderProps) {
  return (
    <>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-4 shrink-0">
        <div>
          {/* Четко закрываем h1 */}
          <h1 className="text-2xl font-bold tracking-tight">
            Управление Триггерами платформы
          </h1>

          {/* p идет СЛЕДУЮЩИМ элементом внутри div, а не внутрь h1 */}
          {instanceUuid ? (
            <p className="font-mono text-xs text-gray-500 mt-1">
              Текущий инстанс (Тенант): {instanceUuid}
            </p>
          ) : null}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 font-mono break-all shrink-0 max-h-32 overflow-y-auto">
          <strong>Ошибка Валидации/Рантайма:</strong> {error}
        </div>
      )}

      {message && (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 shrink-0">
          {message}
        </div>
      )}
    </>
  );
}
