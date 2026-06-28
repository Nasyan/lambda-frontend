"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { templateApi } from "@/src/features/templates/api/template-api";
import { getInstanceUuidFromAccessToken } from "@/src/shared/lib/session";
import type {
  TemplateResponse,
  TemplateFieldType,
  ColumnMetaResponse,
  TemplateSchema,
} from "@/src/entities/template/model/types";
import { AppSidebar } from "../../app-sidebar/ui/AppSidebar";

// Список доступных типов колонок, замаппленный на бэкенд стратегии
const COLUMN_TYPES: { value: TemplateFieldType; label: string }[] = [
  { value: "string", label: "Текст (string)" },
  { value: "number", label: "Число (number)" },
  { value: "boolean", label: "Логическое (boolean)" },
  { value: "checkbox", label: "Флажок (checkbox)" },
  { value: "select", label: "Выбор (select)" },
  { value: "image", label: "Изображение (image)" },
  { value: "formula", label: "Формула (formula)" },
  { value: "datetime", label: "Дата и время (datetime)" },
  { value: "url", label: "Ссылка (url)" },
  { value: "phone", label: "Телефон (phone)" },
  { value: "relation_list", label: "Список связей (relation_list)" },
  { value: "cascading_tree", label: "Каскадное дерево (cascading_tree)" },
];

interface LocalColumn {
  id: string;
  dbName: string;
  type: TemplateFieldType;
  required: boolean;
  unique: boolean;
  options?: string[];
  formula_expression?: string;
  related_template_uuid?: string;
}

interface TemplateEditorWorkspaceProps {
  isEdit?: boolean;
  initialData?: TemplateResponse | null;
}

const buildLocalColumns = (schema: TemplateSchema): LocalColumn[] =>
  Object.entries(schema).map(([key, meta]) => ({
    id: `existing-${key}`,
    dbName: key,
    type: meta.type,
    required: !!meta.required,
    unique: !!meta.unique,
    options: Array.isArray(meta.options) ? meta.options.map(String) : [],
    formula_expression:
      typeof meta.formula_expression === "string"
        ? meta.formula_expression
        : "",
    related_template_uuid: meta.target_template_uuid || "",
  }));

const createLocalColumnId = (): string => crypto.randomUUID();

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
  const [columns, setColumns] = useState<LocalColumn[]>(() =>
    initialSchema ? buildLocalColumns(initialSchema) : [],
  );
  const [previousInitialSchema, setPreviousInitialSchema] =
    useState(initialSchema);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [errorNotification, setErrorNotification] = useState<string | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);

  // Кастомный стейт для добавления новой опции в сайдбаре селекта
  const [newOptionText, setNewOptionText] = useState("");

  // Преобразуем схему с бэкенда в плоский массив для удобства UI
  if (previousInitialSchema !== initialSchema) {
    setPreviousInitialSchema(initialSchema);
    setColumns(initialSchema ? buildLocalColumns(initialSchema) : []);
  }

  const activeColumn = columns.find((c) => c.id === activeColumnId);

  // Показ временных уведомлений об ошибках от бэкенда
  const showError = (message: string) => {
    setErrorNotification(message);
    setTimeout(() => setErrorNotification(null), 5000);
  };

  // --- ЛОКАЛЬНЫЕ ОБРАБОТЧИКИ ---
  const handleAddColumnLocal = () => {
    const newCol: LocalColumn = {
      id: createLocalColumnId(),
      dbName: `column_${columns.length + 1}`,
      type: "string",
      required: false,
      unique: false,
      options: [],
    };
    setColumns((prev) => [...prev, newCol]);
  };

  const handleUpdateColumnLocal = (
    id: string,
    fields: Partial<LocalColumn>,
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

    setIsSaving(true);

    try {
      if (isEdit && initialData) {
        // --- РЕЖИМ РЕДАКТИРОВАНИЯ ---
        // 1. Обновляем имя таблицы, если оно изменилось
        if (templateName !== initialData.name) {
          await templateApi.updateTemplate(instanceUuid, initialData.id, {
            name: templateName.trim(),
          });
        }

        // 2. Параллельно обновляем метаданные всех колонок
        const updatePromises = columns.map((col) => {
          const meta: ColumnMetaResponse = {
            type: col.type,
            required: col.required,
            unique: col.unique,
          };

          if (col.type === "select" && col.options && col.options.length > 0) {
            meta.options = col.options;
          }

          if (
            col.type === "relation_list" &&
            col.related_template_uuid?.trim()
          ) {
            meta.target_template_uuid = col.related_template_uuid.trim();
          }

          if (col.type === "formula" && col.formula_expression?.trim()) {
            meta.formula_expression = col.formula_expression.trim();
          }

          const columnPayload = {
            column_name: col.dbName.trim(),
            field_meta: meta,
          };

          return templateApi.updateColumn(
            instanceUuid,
            initialData.id,
            columnPayload,
          );
        });

        await Promise.all(updatePromises);
        router.push("/tables");
      } else {
        // --- РЕЖИМ СОЗДАНИЯ ---
        const schemaPayload: TemplateSchema = {};
        columns.forEach((col) => {
          const meta: ColumnMetaResponse = {
            type: col.type,
            required: col.required,
            unique: col.unique,
          };

          if (col.type === "select" && col.options && col.options.length > 0) {
            meta.options = col.options;
          }

          if (
            col.type === "relation_list" &&
            col.related_template_uuid?.trim()
          ) {
            meta.target_template_uuid = col.related_template_uuid.trim();
          }

          if (col.type === "formula" && col.formula_expression?.trim()) {
            meta.formula_expression = col.formula_expression.trim();
          }

          schemaPayload[col.dbName.trim()] = meta;
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
          id: createLocalColumnId(),
          dbName: randomName,
          type: "string",
          required: false,
          unique: false,
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
                        handleUpdateColumnLocal(col.id, { type: nextType });
                      }}
                      className="bg-gray-100 border border-transparent text-gray-700 text-xs rounded-full px-3 py-1 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      {COLUMN_TYPES.map((t) => (
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
        <div className="w-96 bg-white border-l border-gray-200 shadow-xl flex flex-col z-20 transition-transform duration-300">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div>
              <h3 className="font-semibold text-gray-900">Настройки поля</h3>
              <p className="text-xs font-mono text-indigo-600 mt-1">
                {activeColumn.dbName} ({activeColumn.type})
              </p>
            </div>
            <button
              onClick={() => setActiveColumnId(null)}
              className="text-gray-400 hover:text-gray-600"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            {activeColumn.type === "select" && (
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Варианты выбора (Options)
                </label>
                <div className="space-y-2">
                  {activeColumn.options?.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 px-3 py-1.5 rounded border border-gray-200 text-sm"
                    >
                      <span className="text-gray-800">{option}</span>
                      <button
                        onClick={() => {
                          const nextOpts =
                            activeColumn.options?.filter(
                              (_, i) => i !== index,
                            ) || [];
                          handleUpdateColumnLocal(activeColumn.id, {
                            options: nextOpts,
                          });
                        }}
                        className="text-gray-400 hover:text-red-500"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newOptionText}
                    onChange={(e) => setNewOptionText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (!newOptionText.trim()) return;
                        const nextOpts = [
                          ...(activeColumn.options || []),
                          newOptionText.trim(),
                        ];
                        handleUpdateColumnLocal(activeColumn.id, {
                          options: nextOpts,
                        });
                        setNewOptionText("");
                      }
                    }}
                    placeholder="Новый вариант"
                    className="flex-1 text-sm border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => {
                      if (!newOptionText.trim()) return;
                      const nextOpts = [
                        ...(activeColumn.options || []),
                        newOptionText.trim(),
                      ];
                      handleUpdateColumnLocal(activeColumn.id, {
                        options: nextOpts,
                      });
                      setNewOptionText("");
                    }}
                    className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded font-medium hover:bg-gray-800"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {activeColumn.type === "formula" && (
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Выражение формулы
                </label>
                <textarea
                  value={activeColumn.formula_expression || ""}
                  onChange={(e) =>
                    handleUpdateColumnLocal(activeColumn.id, {
                      formula_expression: e.target.value,
                    })
                  }
                  placeholder="e.g. {price} * {quantity}"
                  className="w-full text-sm font-mono border border-gray-300 rounded p-2 h-24 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-xs text-gray-400">
                  Используйте названия других полей в фигурных скобках для
                  расчетов.
                </p>
              </div>
            )}

            {activeColumn.type === "relation_list" && (
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Связать с No-Code таблицей
                </label>
                <input
                  type="text"
                  value={activeColumn.related_template_uuid || ""}
                  onChange={(e) =>
                    handleUpdateColumnLocal(activeColumn.id, {
                      related_template_uuid: e.target.value,
                    })
                  }
                  placeholder="Вставьте UUID целевой таблицы"
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {!["select", "formula", "relation_list"].includes(
              activeColumn.type,
            ) && (
              <div className="text-center py-8 text-gray-400 text-sm">
                Для типа поля{" "}
                <span className="font-mono text-gray-600">
                  &quot;{activeColumn.type}&quot;
                </span>{" "}
                дополнительные параметры конфигурации настраивать не требуется.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
