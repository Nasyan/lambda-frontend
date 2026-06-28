"use client";

import { AppSidebar } from "@/src/widgets/app-sidebar/ui/AppSidebar";
import { useTriggerEditor } from "../model/useTriggerEditor";
import { TriggerEditorForm } from "./TriggerEditorForm";

interface TriggerEditorWorkspaceProps {
  triggerUuid: string | null;
}

export function TriggerEditorWorkspace({
  triggerUuid,
}: TriggerEditorWorkspaceProps) {
  const isEditMode = !!triggerUuid;

  const {
    draft,
    updateDraft, // забираем новый метод вместо setDraft
    checkField, // забираем новый метод вместо флагов isAutomation и т.д.
    loading,
    saving,
    error,
    handleSave,
  } = useTriggerEditor(triggerUuid);
  return (
    <div className="min-h-screen bg-gray-50 text-gray-950 md:flex">
      {/* Боковое меню приложения */}
      <AppSidebar />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {/* Хедер страницы */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditMode
                ? "Редактирование триггера"
                : "Создание нового триггера"}
            </h1>
            {isEditMode && (
              <p className="font-mono text-xs text-gray-500 mt-2">
                ID: {triggerUuid}
              </p>
            )}
          </div>

          {/* Отображение ошибки */}
          {error && (
            <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <strong>Ошибка:</strong> {error}
            </div>
          )}

          {/* Рендер формы или лоадера */}
          {loading ? (
            <div className="text-gray-500 animate-pulse bg-white p-6 rounded border border-gray-200">
              Загрузка конфигурации...
            </div>
          ) : (
            <TriggerEditorForm
              draft={draft}
              updateDraft={updateDraft}
              checkField={checkField}
              saving={saving}
              handleSave={handleSave}
              isEditMode={isEditMode}
            />
          )}
        </div>
      </main>
    </div>
  );
}
