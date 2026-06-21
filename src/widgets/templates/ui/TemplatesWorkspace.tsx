"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  ColumnMetaResponse,
  JsonObject,
  JsonValue,
  TemplateFieldType,
  TemplateResponse,
  TemplateSchema,
} from "@/src/entities/template/model/types";
import { templateApi } from "@/src/features/templates/api/template-api";
import { isApiClientError } from "@/src/shared/api/api-client";
import { getAccessToken, getInstanceUuidFromAccessToken } from "@/src/shared/lib/session";
import { AppSidebar } from "@/src/widgets/app-sidebar/ui/AppSidebar";

const FIELD_TYPES: TemplateFieldType[] = [
  "string",
  "number",
  "boolean",
  "checkbox",
  "select",
  "image",
  "formula",
  "datetime",
  "url",
  "phone",
  "relation_list",
  "cascading_tree",
];

const META_BASE_KEYS = new Set(["type", "required", "ast", "options"]);

interface ColumnDraft {
  id: string;
  columnName: string;
  type: TemplateFieldType;
  required: boolean;
  astJson: string;
  optionsJson: string;
  extraMetaJson: string;
}

const createDraftId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

const createEmptyColumnDraft = (): ColumnDraft => ({
  id: createDraftId(),
  columnName: "",
  type: "string",
  required: false,
  astJson: "",
  optionsJson: "",
  extraMetaJson: "",
});

const isJsonValue = (value: unknown): value is JsonValue => {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).every(isJsonValue);
  }

  return false;
};

const isJsonObject = (value: unknown): value is JsonObject =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const stringifyJson = (value: JsonValue | undefined): string =>
  value === undefined ? "" : JSON.stringify(value, null, 2);

const parseJsonValue = (value: string, label: string): JsonValue | undefined => {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return undefined;
  }

  const parsedValue: unknown = JSON.parse(trimmedValue);
  if (!isJsonValue(parsedValue)) {
    throw new Error(`${label}: JSON содержит неподдерживаемое значение`);
  }

  return parsedValue;
};

const parseJsonObject = (value: string, label: string): JsonObject | undefined => {
  const parsedValue = parseJsonValue(value, label);

  if (parsedValue === undefined) {
    return undefined;
  }

  if (!isJsonObject(parsedValue)) {
    throw new Error(`${label}: ожидается JSON object`);
  }

  return parsedValue;
};

const createDraftFromMeta = (
  columnName: string,
  meta: ColumnMetaResponse,
): ColumnDraft => {
  const extraMeta: JsonObject = {};

  Object.entries(meta).forEach(([key, value]) => {
    if (META_BASE_KEYS.has(key) || value === undefined) {
      return;
    }

    const clonedValue: unknown = JSON.parse(JSON.stringify(value));
    if (isJsonValue(clonedValue)) {
      extraMeta[key] = clonedValue;
    }
  });

  return {
    id: createDraftId(),
    columnName,
    type: meta.type,
    required: meta.required ?? false,
    astJson: stringifyJson(meta.ast ?? undefined),
    optionsJson: stringifyJson(meta.options),
    extraMetaJson: Object.keys(extraMeta).length > 0 ? stringifyJson(extraMeta) : "",
  };
};

const buildColumnMeta = (draft: ColumnDraft): ColumnMetaResponse => {
  const extraMeta = parseJsonObject(draft.extraMetaJson, "Extra meta") ?? {};
  const ast = parseJsonObject(draft.astJson, "AST");
  const options = parseJsonValue(draft.optionsJson, "Options");

  if (draft.type === "formula" && !ast) {
    throw new Error("Для formula нужен AST JSON object");
  }

  if (draft.type === "select" && options === undefined) {
    throw new Error("Для select нужен options JSON array");
  }

  return {
    ...extraMeta,
    type: draft.type,
    required: draft.required,
    ...(ast ? { ast } : {}),
    ...(options !== undefined ? { options } : {}),
  };
};

const buildSchemaFromDrafts = (drafts: ColumnDraft[]): TemplateSchema => {
  const schema: TemplateSchema = {};

  drafts.forEach((draft) => {
    const columnName = draft.columnName.trim();
    if (!columnName) {
      return;
    }

    if (schema[columnName]) {
      throw new Error(`Колонка "${columnName}" указана дважды`);
    }

    schema[columnName] = buildColumnMeta({ ...draft, columnName });
  });

  return schema;
};

const getErrorMessage = (error: unknown): string => {
  if (isApiClientError(error)) {
    const payload: unknown = error.response.data;

    if (payload && typeof payload === "object") {
      const detail = (payload as { detail?: unknown }).detail;
      const message = (payload as { message?: unknown }).message;

      if (typeof detail === "string") {
        return detail;
      }

      if (typeof message === "string") {
        return message;
      }

      if (detail !== undefined) {
        return JSON.stringify(detail);
      }
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Неизвестная ошибка";
};

export function TemplatesWorkspace() {
  const router = useRouter();
  const [instanceUuid, setInstanceUuid] = useState<string | null>(null);
  const [templates, setTemplates] = useState<TemplateResponse[]>([]);
  const [deletedTemplates, setDeletedTemplates] = useState<TemplateResponse[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateResponse | null>(
    null,
  );
  const [selectedTemplateName, setSelectedTemplateName] = useState("");
  const [createName, setCreateName] = useState("");
  const [createDrafts, setCreateDrafts] = useState<ColumnDraft[]>([
    createEmptyColumnDraft(),
  ]);
  const [newColumnDraft, setNewColumnDraft] = useState<ColumnDraft>(
    createEmptyColumnDraft(),
  );
  const [editingColumnName, setEditingColumnName] = useState<string | null>(null);
  const [editingColumnDraft, setEditingColumnDraft] = useState<ColumnDraft | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [deletedLoading, setDeletedLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(() => {
      if (cancelled) {
        return;
      }

      if (!getAccessToken()) {
        router.push("/login");
        return;
      }

      const tokenInstanceUuid = getInstanceUuidFromAccessToken();
      if (!tokenInstanceUuid) {
        setError("В access token нет instance_uuid");
        setLoading(false);
        return;
      }

      setInstanceUuid(tokenInstanceUuid);
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const refreshTemplates = useCallback(
    async (nextSelectedId?: string) => {
      if (!instanceUuid) {
        return;
      }

      setLoading(true);
      try {
        const nextTemplates = await templateApi.getTemplates(instanceUuid);
        setTemplates(nextTemplates);

        const selectedId = nextSelectedId ?? selectedTemplate?.id;
        if (selectedId) {
          const selectedFromList =
            nextTemplates.find((template) => template.id === selectedId) ?? null;
          setSelectedTemplate(selectedFromList);
          setSelectedTemplateName(selectedFromList?.name ?? "");
        }
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    },
    [instanceUuid, selectedTemplate],
  );

  const refreshDeletedTemplates = useCallback(async () => {
    if (!instanceUuid) {
      return;
    }

    setDeletedLoading(true);
    try {
      setDeletedTemplates(await templateApi.getDeletedTemplates(instanceUuid));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setDeletedLoading(false);
    }
  }, [instanceUuid]);

  useEffect(() => {
    if (instanceUuid) {
      let cancelled = false;

      void Promise.resolve().then(async () => {
        if (cancelled) {
          return;
        }

        await Promise.all([refreshTemplates(), refreshDeletedTemplates()]);
      });

      return () => {
        cancelled = true;
      };
    }

    return undefined;
  }, [instanceUuid, refreshDeletedTemplates, refreshTemplates]);

  const loadTemplate = async (templateId: string) => {
    if (!instanceUuid) {
      return;
    }

    setError(null);
    setMessage(null);

    try {
      const template = await templateApi.getTemplate(instanceUuid, templateId);
      setSelectedTemplate(template);
      setSelectedTemplateName(template.name);
      setEditingColumnName(null);
      setEditingColumnDraft(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const updateCreateDraft = (
    draftId: string,
    updater: (draft: ColumnDraft) => ColumnDraft,
  ) => {
    setCreateDrafts((drafts) =>
      drafts.map((draft) => (draft.id === draftId ? updater(draft) : draft)),
    );
  };

  const removeCreateDraft = (draftId: string) => {
    setCreateDrafts((drafts) =>
      drafts.length === 1 ? drafts : drafts.filter((draft) => draft.id !== draftId),
    );
  };

  const handleCreateTemplate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!instanceUuid) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const createdTemplate = await templateApi.createTemplate(instanceUuid, {
        name: createName.trim(),
        schema: buildSchemaFromDrafts(createDrafts),
      });
      setCreateName("");
      setCreateDrafts([createEmptyColumnDraft()]);
      setSelectedTemplate(createdTemplate);
      setSelectedTemplateName(createdTemplate.name);
      setMessage("Шаблон создан");
      await refreshTemplates(createdTemplate.id);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTemplateName = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!instanceUuid || !selectedTemplate) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const updatedTemplate = await templateApi.updateTemplate(
        instanceUuid,
        selectedTemplate.id,
        { name: selectedTemplateName.trim() },
      );
      setSelectedTemplate(updatedTemplate);
      setSelectedTemplateName(updatedTemplate.name);
      setMessage("Название обновлено");
      await refreshTemplates(updatedTemplate.id);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!instanceUuid || !confirm("Удалить шаблон?")) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await templateApi.deleteTemplate(instanceUuid, templateId);
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null);
        setSelectedTemplateName("");
      }
      setMessage("Шаблон удалён");
      await refreshTemplates();
      await refreshDeletedTemplates();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreTemplate = async (templateId: string) => {
    if (!instanceUuid) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const restoredTemplate = await templateApi.restoreTemplate(
        instanceUuid,
        templateId,
      );
      setSelectedTemplate(restoredTemplate);
      setSelectedTemplateName(restoredTemplate.name);
      setMessage("Шаблон восстановлен");
      await refreshTemplates(restoredTemplate.id);
      await refreshDeletedTemplates();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleAddColumn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!instanceUuid || !selectedTemplate) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const updatedTemplate = await templateApi.addColumn(
        instanceUuid,
        selectedTemplate.id,
        {
          column_name: newColumnDraft.columnName.trim(),
          field_meta: buildColumnMeta(newColumnDraft),
        },
      );
      setSelectedTemplate(updatedTemplate);
      setNewColumnDraft(createEmptyColumnDraft());
      setMessage("Колонка добавлена");
      await refreshTemplates(updatedTemplate.id);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateColumn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!instanceUuid || !selectedTemplate || !editingColumnName || !editingColumnDraft) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const updatedTemplate = await templateApi.updateColumn(
        instanceUuid,
        selectedTemplate.id,
        {
          column_name: editingColumnName,
          field_meta: buildColumnMeta(editingColumnDraft),
        },
      );
      setSelectedTemplate(updatedTemplate);
      setEditingColumnName(null);
      setEditingColumnDraft(null);
      setMessage("Колонка обновлена");
      await refreshTemplates(updatedTemplate.id);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteColumn = async (columnName: string) => {
    if (!instanceUuid || !selectedTemplate || !confirm(`Удалить колонку "${columnName}"?`)) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const updatedTemplate = await templateApi.deleteColumn(
        instanceUuid,
        selectedTemplate.id,
        columnName,
      );
      setSelectedTemplate(updatedTemplate);
      if (editingColumnName === columnName) {
        setEditingColumnName(null);
        setEditingColumnDraft(null);
      }
      setMessage("Колонка удалена");
      await refreshTemplates(updatedTemplate.id);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const selectedColumns = useMemo(
    () => Object.entries(selectedTemplate?.schema ?? {}),
    [selectedTemplate?.schema],
  );

  const renderColumnDraftFields = (
    draft: ColumnDraft,
    onChange: (draft: ColumnDraft) => void,
    options?: { columnNameDisabled?: boolean },
  ) => (
    <div className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_120px]">
        <input
          type="text"
          placeholder="column_name"
          className="rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-950 outline-none focus:border-indigo-500"
          value={draft.columnName}
          disabled={options?.columnNameDisabled}
          onChange={(event) => onChange({ ...draft, columnName: event.target.value })}
          required={!options?.columnNameDisabled}
        />
        <select
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 outline-none focus:border-indigo-500"
          value={draft.type}
          onChange={(event) =>
            onChange({ ...draft, type: event.target.value as TemplateFieldType })
          }
        >
          {FIELD_TYPES.map((fieldType) => (
            <option key={fieldType} value={fieldType}>
              {fieldType}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800">
          <input
            type="checkbox"
            checked={draft.required}
            onChange={(event) =>
              onChange({ ...draft, required: event.target.checked })
            }
          />
          Required
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <textarea
          rows={4}
          placeholder='AST JSON, например {"type":"field","value":"amount"}'
          className="rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-xs text-gray-950 outline-none focus:border-indigo-500"
          value={draft.astJson}
          onChange={(event) => onChange({ ...draft, astJson: event.target.value })}
        />
        <textarea
          rows={4}
          placeholder='Options JSON, например ["A","B"]'
          className="rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-xs text-gray-950 outline-none focus:border-indigo-500"
          value={draft.optionsJson}
          onChange={(event) => onChange({ ...draft, optionsJson: event.target.value })}
        />
        <textarea
          rows={4}
          placeholder='Extra meta JSON, например {"ui_widget":"qr"}'
          className="rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-xs text-gray-950 outline-none focus:border-indigo-500"
          value={draft.extraMetaJson}
          onChange={(event) =>
            onChange({ ...draft, extraMetaJson: event.target.value })
          }
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-950 md:flex">
      <AppSidebar />
      <main className="flex-1 p-4 md:p-6">
        <div className="mb-6 flex flex-col gap-2 border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold">Tables</h1>
          {instanceUuid && (
            <p className="font-mono text-xs text-gray-500">Instance: {instanceUuid}</p>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
          <section className="grid content-start gap-4">
            <form
              onSubmit={handleCreateTemplate}
              className="rounded-md border border-gray-200 bg-white p-4 shadow-sm"
            >
              <h2 className="mb-3 text-lg font-semibold">Создать шаблон</h2>
              <div className="grid gap-3">
                <input
                  type="text"
                  placeholder="Название"
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 outline-none focus:border-indigo-500"
                  value={createName}
                  onChange={(event) => setCreateName(event.target.value)}
                  required
                />
                {createDrafts.map((draft, index) => (
                  <div
                    key={draft.id}
                    className="grid gap-3 rounded-md border border-gray-200 bg-gray-50 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-gray-700">
                        Колонка {index + 1}
                      </span>
                      <button
                        type="button"
                        className="text-sm text-red-600 hover:text-red-700"
                        onClick={() => removeCreateDraft(draft.id)}
                      >
                        Убрать
                      </button>
                    </div>
                    {renderColumnDraftFields(draft, (nextDraft) =>
                      updateCreateDraft(draft.id, () => nextDraft),
                    )}
                  </div>
                ))}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    onClick={() =>
                      setCreateDrafts((drafts) => [
                        ...drafts,
                        createEmptyColumnDraft(),
                      ])
                    }
                  >
                    Добавить колонку
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                    disabled={saving}
                  >
                    Создать
                  </button>
                </div>
              </div>
            </form>

            <section className="rounded-md border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-gray-200 p-4">
                <h2 className="text-lg font-semibold">Активные шаблоны</h2>
                <button
                  type="button"
                  className="text-sm text-indigo-700 hover:text-indigo-800"
                  onClick={() => void refreshTemplates()}
                >
                  Обновить
                </button>
              </div>
              {loading ? (
                <p className="p-4 text-sm text-gray-500">Загрузка...</p>
              ) : templates.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">Шаблонов нет.</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {templates.map((template) => (
                    <li key={template.id} className="flex items-center gap-2 p-3">
                      <button
                        type="button"
                        className={`min-w-0 flex-1 rounded-md px-3 py-2 text-left text-sm font-medium ${
                          selectedTemplate?.id === template.id
                            ? "bg-indigo-50 text-indigo-900"
                            : "text-gray-800 hover:bg-gray-50"
                        }`}
                        onClick={() => void loadTemplate(template.id)}
                      >
                        <span className="block truncate">{template.name}</span>
                        <span className="block truncate font-mono text-xs text-gray-500">
                          {template.id}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        onClick={() => void handleDeleteTemplate(template.id)}
                      >
                        Удалить
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-md border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-gray-200 p-4">
                <h2 className="text-lg font-semibold">Удалённые</h2>
                <button
                  type="button"
                  className="text-sm text-indigo-700 hover:text-indigo-800"
                  onClick={() => void refreshDeletedTemplates()}
                >
                  Обновить
                </button>
              </div>
              {deletedLoading ? (
                <p className="p-4 text-sm text-gray-500">Загрузка...</p>
              ) : deletedTemplates.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">Удалённых шаблонов нет.</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {deletedTemplates.map((template) => (
                    <li
                      key={template.id}
                      className="flex items-center justify-between gap-3 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800">
                          {template.name}
                        </p>
                        <p className="truncate font-mono text-xs text-gray-500">
                          {template.id}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="rounded-md border border-emerald-200 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                        onClick={() => void handleRestoreTemplate(template.id)}
                      >
                        Restore
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </section>

          <section className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            {!selectedTemplate ? (
              <div className="flex min-h-[360px] items-center justify-center rounded-md border border-dashed border-gray-300 text-sm text-gray-500">
                Выберите шаблон
              </div>
            ) : (
              <div className="grid gap-6">
                <form
                  onSubmit={handleUpdateTemplateName}
                  className="grid gap-3 border-b border-gray-200 pb-4"
                >
                  <div>
                    <p className="font-mono text-xs text-gray-500">
                      {selectedTemplate.id}
                    </p>
                    <h2 className="text-xl font-bold">{selectedTemplate.name}</h2>
                  </div>
                  <div className="flex flex-col gap-2 md:flex-row">
                    <input
                      type="text"
                      className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 outline-none focus:border-indigo-500"
                      value={selectedTemplateName}
                      onChange={(event) =>
                        setSelectedTemplateName(event.target.value)
                      }
                      required
                    />
                    <button
                      type="submit"
                      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                      disabled={saving}
                    >
                      Сохранить имя
                    </button>
                  </div>
                </form>

                <form
                  onSubmit={handleAddColumn}
                  className="grid gap-3 rounded-md border border-gray-200 bg-gray-50 p-4"
                >
                  <h3 className="text-base font-semibold">Добавить колонку</h3>
                  {renderColumnDraftFields(newColumnDraft, setNewColumnDraft)}
                  <div>
                    <button
                      type="submit"
                      className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                      disabled={saving}
                    >
                      Добавить
                    </button>
                  </div>
                </form>

                {editingColumnDraft && (
                  <form
                    onSubmit={handleUpdateColumn}
                    className="grid gap-3 rounded-md border border-indigo-200 bg-indigo-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-semibold">
                        Редактировать {editingColumnName}
                      </h3>
                      <button
                        type="button"
                        className="text-sm text-gray-600 hover:text-gray-900"
                        onClick={() => {
                          setEditingColumnName(null);
                          setEditingColumnDraft(null);
                        }}
                      >
                        Отмена
                      </button>
                    </div>
                    {renderColumnDraftFields(
                      editingColumnDraft,
                      setEditingColumnDraft,
                      { columnNameDisabled: true },
                    )}
                    <div>
                      <button
                        type="submit"
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                        disabled={saving}
                      >
                        Обновить колонку
                      </button>
                    </div>
                  </form>
                )}

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">
                          Name
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">
                          Type
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">
                          Required
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">
                          Meta
                        </th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-600">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {selectedColumns.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-3 py-8 text-center text-gray-500"
                          >
                            Колонок нет.
                          </td>
                        </tr>
                      ) : (
                        selectedColumns.map(([columnName, meta]) => (
                          <tr key={columnName}>
                            <td className="px-3 py-3 font-mono font-semibold">
                              {columnName}
                            </td>
                            <td className="px-3 py-3">{meta.type}</td>
                            <td className="px-3 py-3">
                              {meta.required ? "Yes" : "No"}
                            </td>
                            <td className="max-w-[360px] px-3 py-3">
                              <pre className="max-h-28 overflow-auto rounded-md bg-gray-50 p-2 text-xs text-gray-700">
                                {JSON.stringify(meta, null, 2)}
                              </pre>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                  onClick={() => {
                                    setEditingColumnName(columnName);
                                    setEditingColumnDraft(
                                      createDraftFromMeta(columnName, meta),
                                    );
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                                  onClick={() => void handleDeleteColumn(columnName)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
