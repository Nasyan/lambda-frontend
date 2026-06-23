"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  ColumnMetaResponse,
  TemplateResponse,
} from "@/src/entities/template/model/types";
import {
  buildColumnMeta,
  buildSchemaFromDrafts,
  createDraftFromMeta,
  createEmptyColumnDraft,
  type ColumnDraft,
} from "@/src/features/templates/model/column-draft";
import { templateApi } from "@/src/features/templates/api/template-api";
import { isApiClientError } from "@/src/shared/api/api-client";
import {
  getAccessToken,
  getInstanceUuidFromAccessToken,
} from "@/src/shared/lib/session";
import { AppSidebar } from "@/src/widgets/app-sidebar/ui/AppSidebar";
import { CreateTemplateForm } from "@/src/widgets/templates/ui/CreateTemplateForm";
import { DeletedTemplateList } from "@/src/widgets/templates/ui/DeletedTemplateList";
import { TemplateDetails } from "@/src/widgets/templates/ui/TemplateDetails";
import { TemplateList } from "@/src/widgets/templates/ui/TemplateList";

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

  const updateCreateDraft = (draftId: string, nextDraft: ColumnDraft) => {
    setCreateDrafts((drafts) =>
      drafts.map((draft) => (draft.id === draftId ? nextDraft : draft)),
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
    if (
      !instanceUuid ||
      !selectedTemplate ||
      !editingColumnName ||
      !editingColumnDraft
    ) {
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
    if (
      !instanceUuid ||
      !selectedTemplate ||
      !confirm(`Удалить колонку "${columnName}"?`)
    ) {
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

  const startEditColumn = (columnName: string, meta: ColumnMetaResponse) => {
    setEditingColumnName(columnName);
    setEditingColumnDraft(createDraftFromMeta(columnName, meta));
  };

  const cancelEditColumn = () => {
    setEditingColumnName(null);
    setEditingColumnDraft(null);
  };

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
            <CreateTemplateForm
              name={createName}
              drafts={createDrafts}
              templates={templates}
              saving={saving}
              onNameChange={setCreateName}
              onDraftChange={updateCreateDraft}
              onAddDraft={() =>
                setCreateDrafts((drafts) => [...drafts, createEmptyColumnDraft()])
              }
              onRemoveDraft={removeCreateDraft}
              onSubmit={handleCreateTemplate}
            />

            <TemplateList
              templates={templates}
              selectedTemplateId={selectedTemplate?.id}
              loading={loading}
              onRefresh={() => void refreshTemplates()}
              onSelect={(templateId) => void loadTemplate(templateId)}
              onDelete={(templateId) => void handleDeleteTemplate(templateId)}
            />

            <DeletedTemplateList
              templates={deletedTemplates}
              loading={deletedLoading}
              onRefresh={() => void refreshDeletedTemplates()}
              onRestore={(templateId) => void handleRestoreTemplate(templateId)}
            />
          </section>

          <TemplateDetails
            selectedTemplate={selectedTemplate}
            selectedTemplateName={selectedTemplateName}
            templates={templates}
            columns={selectedColumns}
            newColumnDraft={newColumnDraft}
            editingColumnName={editingColumnName}
            editingColumnDraft={editingColumnDraft}
            saving={saving}
            onTemplateNameChange={setSelectedTemplateName}
            onTemplateNameSubmit={handleUpdateTemplateName}
            onNewColumnDraftChange={setNewColumnDraft}
            onAddColumnSubmit={handleAddColumn}
            onEditingColumnDraftChange={setEditingColumnDraft}
            onUpdateColumnSubmit={handleUpdateColumn}
            onCancelEditColumn={cancelEditColumn}
            onEditColumn={startEditColumn}
            onDeleteColumn={(columnName) => void handleDeleteColumn(columnName)}
          />
        </div>
      </main>
    </div>
  );
}
