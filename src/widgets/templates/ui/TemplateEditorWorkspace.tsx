"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { templateApi } from "@/src/features/templates/api/template-api";
import { getInstanceUuidFromAccessToken } from "@/src/shared/lib/session";
import type {
  TemplateResponse,
  TemplateFieldType,
  TemplateSchema,
} from "@/src/entities/template/model/types";
import { COLUMN_TYPE_OPTIONS } from "@/src/entities/template/model/field-registry";
import {
  applyColumnTypeDefaults,
  buildColumnMeta,
  buildEditorColumns,
  createEditorColumn,
  type TemplateEditorColumn,
} from "../model/column-editor";
import { AppSidebar } from "../../app-sidebar/ui/AppSidebar";
import { ColumnConfigPanel } from "./ColumnConfigPanel";

interface TemplateEditorWorkspaceProps {
  isEdit?: boolean;
  initialData?: TemplateResponse | null;
}

const createNewColumnName = (): string =>
  `new_column_${crypto.randomUUID().replace(/-/g, "").slice(0, 5)}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getBackendDetail = (error: unknown): unknown => {
  if (!isRecord(error)) return undefined;
  const response = error.response;
  if (!isRecord(response)) return undefined;
  const data = response.data;
  if (!isRecord(data)) return undefined;
  return data.detail;
};

export function TemplateEditorWorkspace({
  isEdit = false,
  initialData = null,
}: TemplateEditorWorkspaceProps) {
  const router = useRouter();
  const instanceUuid = getInstanceUuidFromAccessToken();
  const initialSchema = isEdit ? (initialData?.schema ?? null) : null;

  const [templateName, setTemplateName] = useState(initialData?.name ?? "");
  const [columns, setColumns] = useState<TemplateEditorColumn[]>(() =>
    initialSchema ? buildEditorColumns(initialSchema) : [],
  );
  const [previousInitialSchema, setPreviousInitialSchema] =
    useState(initialSchema);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [errorNotification, setErrorNotification] = useState<string | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<
    TemplateResponse[]
  >([]);

  // Преобразуем схему с бэкенда в плоский массив для удобства UI
  if (previousInitialSchema !== initialSchema) {
    setPreviousInitialSchema(initialSchema);
    setColumns(initialSchema ? buildEditorColumns(initialSchema) : []);
  }

  const activeColumn = columns.find((c) => c.id === activeColumnId);

  useEffect(() => {
    if (!instanceUuid) return;
    let cancelled = false;

    const loadTemplates = async () => {
      try {
        const templates = await templateApi.getTemplates(instanceUuid);
        if (!cancelled) {
          setAvailableTemplates(templates);
        }
      } catch (error) {
        console.error("Не удалось загрузить список таблиц:", error);
      }
    };

    void Promise.resolve().then(loadTemplates);

    return () => {
      cancelled = true;
    };
  }, [instanceUuid]);

  // Показ временных уведомлений об ошибках от бэкенда
  const showError = (message: string) => {
    setErrorNotification(message);
    setTimeout(() => setErrorNotification(null), 5000);
  };

  // --- ЛОКАЛЬНЫЕ ОБРАБОТЧИКИ ---
  const handleAddColumnLocal = () => {
    setColumns((prev) => [
      ...prev,
      createEditorColumn(`column_${prev.length + 1}`),
    ]);
  };

  const handleUpdateColumnLocal = (
    id: string,
    fields: Partial<TemplateEditorColumn>,
  ) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === id ? { ...col, ...fields } : col)),
    );
  };

  const handleDeleteColumnLocal = (id: string) => {
    if (activeColumnId === id) setActiveColumnId(null);
    setColumns((prev) => prev.filter((col) => col.id !== id));
  };

  // --- ЕДИНЫЙ ОБРАБОТЧИК СОХРАНЕНИЯ (ДЛЯ СОЗДАНИЯ И РЕДАКТИРОВАНИЯ) ---
  const handleSave = async () => {
    if (!instanceUuid) return;

    if (!templateName.trim()) {
      showError("Введите название таблицы");
      return;
    }

    if (columns.length === 0) {
      showError("Добавьте хотя бы одну колонку перед сохранением");
      return;
    }

    const hasEmptyDbNames = columns.some((c) => !c.dbName.trim());
    if (hasEmptyDbNames) {
      showError("У всех колонок должно быть указано системное имя");
      return;
    }

    const trimmedDbNames = columns.map((column) => column.dbName.trim());
    if (new Set(trimmedDbNames).size !== trimmedDbNames.length) {
      showError("Системные имена колонок не должны повторяться");
      return;
    }

    setIsSaving(true);

    try {
      const columnPayloads = columns.map((col) => {
        const builtMeta = buildColumnMeta(col);
        if (!builtMeta.ok) {
          throw new Error(builtMeta.message);
        }

        return {
          column_name: col.dbName.trim(),
          field_meta: builtMeta.meta,
        };
      });

      if (isEdit && initialData) {
        // --- РЕЖИМ РЕДАКТИРОВАНИЯ ---
        // 1. Обновляем имя таблицы, если оно изменилось
        if (templateName !== initialData.name) {
          await templateApi.updateTemplate(instanceUuid, initialData.id, {
            name: templateName.trim(),
          });
        }

        // 2. Параллельно обновляем метаданные всех колонок
        const updatePromises = columnPayloads.map((columnPayload) =>
          templateApi.updateColumn(
            instanceUuid,
            initialData.id,
            columnPayload.column_name, // <-- Передаем системное имя колонки для URL
            columnPayload,
          ),
        );

        await Promise.all(updatePromises);
        router.push("/tables");
      } else {
        // --- РЕЖИМ СОЗДАНИЯ ---
        const schemaPayload: TemplateSchema = {};
        columnPayloads.forEach((columnPayload) => {
          schemaPayload[columnPayload.column_name] = columnPayload.field_meta;
        });

        const fullPayload = {
          name: templateName,
          schema: schemaPayload,
        };

        await templateApi.createTemplate(instanceUuid, fullPayload);
        router.push("/tables");
      }
    } catch (err) {
      console.error("====== [API ERROR] Save Workspace ======");
      console.error("Full Error Object:", err);
      console.error("========================================");

      const backendDetail = getBackendDetail(err);
      const errorMsg = backendDetail
        ? `Ошибка 400: ${typeof backendDetail === "string" ? backendDetail : JSON.stringify(backendDetail)}`
        : err instanceof Error
          ? err.message
          : "Не удалось сохранить изменения. Подробности в консоли.";

      showError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // --- АТОМАРНЫЕ ОБРАБОТЧИКИ (Оставляем только структурные изменения для режима редактирования) ---
  const handleAddColumnApi = async () => {
    if (!instanceUuid || !initialData) return;
    const randomName = createNewColumnName();

    try {
      await templateApi.addColumn(instanceUuid, initialData.id, {
        column_name: randomName,
        field_meta: {
          type: "string",
          required: false,
          unique: false,
        },
      });

      setColumns((prev) => [
        ...prev,
        {
          ...createEditorColumn(randomName),
          dbName: randomName,
        },
      ]);
    } catch {
      showError("Не удалось добавить колонку.");
    }
  };

  const handleDeleteColumnApi = async (id: string, dbName: string) => {
    if (!instanceUuid || !initialData) return;
    try {
      await templateApi.deleteColumn(instanceUuid, initialData.id, dbName);
      if (activeColumnId === id) setActiveColumnId(null);
      setColumns((prev) => prev.filter((c) => c.id !== id));
    } catch {
      showError(
        "Нельзя удалить колонку, так как таблица уже содержит связанные записи.",
      );
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden relative">
      <AppSidebar />

      <div className="flex-1 flex flex-col overflow-y-auto p-8 relative">
        {errorNotification && (
          <div className="absolute top-4 right-4 z-50 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md shadow-lg flex items-center space-x-2">
            <span>{errorNotification}</span>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3 w-1/3">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Название таблицы (например, Заказы)"
              className="text-2xl font-bold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-600 focus:outline-none py-1 w-full text-gray-900"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium text-sm shadow-sm disabled:opacity-50"
          >
            {isSaving
              ? "Сохранение..."
              : isEdit
                ? "Сохранить изменения"
                : "Создать таблицу"}
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          Настройте поля и структуру таблицы.
        </p>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold tracking-wider">
              <tr>
                <th className="w-12 px-4 py-3"></th>
                <th className="px-6 py-3">Название колонки</th>
                <th className="px-6 py-3">Тип колонки</th>
                <th className="px-6 py-3 text-center">Обязательное поле</th>
                <th className="px-6 py-3 text-center">Уникальное значение</th>
                <th className="w-24 px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {columns.map((col) => (
                <tr key={col.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 cursor-move">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 8h16M4 16h16"
                      />
                    </svg>
                  </td>

                  <td className="px-6 py-3">
                    <input
                      type="text"
                      value={col.dbName}
                      onChange={(e) =>
                        handleUpdateColumnLocal(col.id, {
                          dbName: e.target.value,
                        })
                      }
                      className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 focus:outline-none text-gray-800 font-medium"
                    />
                  </td>

                  <td className="px-6 py-3">
                    <select
                      value={col.type}
                      onChange={(e) => {
                        const nextType = e.target.value as TemplateFieldType;
                        handleUpdateColumnLocal(
                          col.id,
                          applyColumnTypeDefaults(col, nextType),
                        );
                      }}
                      className="bg-gray-100 border border-transparent text-gray-700 text-xs rounded-full px-3 py-1 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      {COLUMN_TYPE_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-6 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={col.required}
                      onChange={(e) => {
                        const nextVal = e.target.checked;
                        handleUpdateColumnLocal(col.id, { required: nextVal });
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>

                  <td className="px-6 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={col.unique}
                      onChange={(e) => {
                        const nextVal = e.target.checked;
                        handleUpdateColumnLocal(col.id, { unique: nextVal });
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>

                  <td className="px-6 py-3 text-right space-x-2">
                    <button
                      onClick={() => setActiveColumnId(col.id)}
                      className="p-1 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                      title="Детальные настройки поля"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() =>
                        isEdit
                          ? handleDeleteColumnApi(col.id, col.dbName)
                          : handleDeleteColumnLocal(col.id)
                      }
                      className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <button
              onClick={isEdit ? handleAddColumnApi : handleAddColumnLocal}
              className="w-full py-2 bg-white hover:bg-gray-100 border border-gray-300 border-dashed text-gray-700 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-1"
            >
              <span>Добавить колонку</span>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {activeColumn && (
        <ColumnConfigPanel
          column={activeColumn}
          templates={
            isEdit && initialData
              ? availableTemplates.filter(
                  (template) => template.id !== initialData.id,
                )
              : availableTemplates
          }
          onChange={(fields) =>
            handleUpdateColumnLocal(activeColumn.id, fields)
          }
          onClose={() => setActiveColumnId(null)}
        />
      )}
    </div>
  );
}
