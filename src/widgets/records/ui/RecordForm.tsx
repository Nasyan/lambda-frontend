"use client";

import { useCallback } from "react";
import { useTemplateSchema } from "@/src/features/templates/model/template-cache";
import { getInstanceUuidFromAccessToken } from "@/src/shared/lib/session";
import { useRecordWorkspace } from "@/src/features/records/model/useRecordWorkspace";
import type { JsonObject } from "@/src/entities/template/model/types";
import type { RecordDraft } from "@/src/features/records/model/useRecordWorkspace";
import { DynamicForm } from "./DynamicForm";

interface RecordFormProps {
  draft: RecordDraft;
}

/**
 * Форма активного черновика. Грузит схему через центральный кеш и переиспользует
 * DynamicForm. Правки уходят обратно в стор через onChange (live-sync).
 * Сам сабмит здесь не происходит — кнопки скрыты (hideActions), управление
 * создаёт панель действий в RecordWorkspace.
 */
export function RecordForm({ draft }: RecordFormProps) {
  const { updateTabData } = useRecordWorkspace();
  const { schema, loading, error } = useTemplateSchema(draft.templateUuid);
  const instanceUuid = getInstanceUuidFromAccessToken();

  const handleChange = useCallback(
    (data: JsonObject) => {
      updateTabData(draft.id, data);
    },
    [draft.id, updateTabData],
  );

  // onSubmit / onCancel обязательны по сигнатуре DynamicForm, но кнопки скрыты.
  const noop = useCallback(() => {}, []);

  if (loading) {
    return (
      <div className="p-6 text-sm font-medium text-gray-500 animate-pulse">
        Загрузка схемы шаблона...
      </div>
    );
  }

  if (error || !schema) {
    return (
      <div className="p-6 text-sm font-medium text-red-500">
        {error ?? "Схема шаблона недоступна"}
      </div>
    );
  }

  const isLocked = draft.status === "saving" || draft.status === "created";

  return (
    <div className="p-6">
      {draft.status === "created" && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Запись создана. Эта вкладка только для просмотра — продублируйте её,
          чтобы создать ещё одну.
        </div>
      )}
      {draft.status === "error" && draft.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {draft.error}
        </div>
      )}
      <DynamicForm
        // key по id вкладки: смена активной вкладки гарантированно
        // переинициализирует внутреннее состояние формы.
        key={draft.id}
        schema={schema}
        instanceUuid={instanceUuid}
        initialData={draft.formData}
        onChange={handleChange}
        onSubmit={noop}
        onCancel={noop}
        isProcessing={isLocked}
        hideActions
      />
    </div>
  );
}
