"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { NotificationTemplate } from "@/src/entities/notification-template/model/types";
import { triggerApi } from "@/src/entities/trigger/api/trigger-api";
import type { TriggerResponse } from "@/src/entities/trigger/model/types";
import type { TemplateResponse } from "@/src/entities/template/model/types";
import { notificationTemplateApi } from "@/src/features/notification-templates/api/notification-template-api";
import {
  buildTriggerPayload,
  createTriggerDraft,
  type TriggerFormDraft,
} from "@/src/features/triggers/model/trigger-form-state";
import { TriggerForm } from "@/src/features/triggers/ui/TriggerForm";
import { TriggerList } from "@/src/features/triggers/ui/TriggerList";
import { templateApi } from "@/src/features/templates/api/template-api";
import { isApiClientError } from "@/src/shared/api/api-client";
import {
  getAccessToken,
  getInstanceUuidFromAccessToken,
} from "@/src/shared/lib/session";
import { AppSidebar } from "@/src/widgets/app-sidebar/ui/AppSidebar";

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

export function TriggersWorkspace() {
  const router = useRouter();
  const [instanceUuid, setInstanceUuid] = useState<string | null>(null);
  const [triggers, setTriggers] = useState<TriggerResponse[]>([]);
  const [templates, setTemplates] = useState<TemplateResponse[]>([]);
  const [notificationTemplates, setNotificationTemplates] = useState<
    NotificationTemplate[]
  >([]);
  const [selectedTrigger, setSelectedTrigger] = useState<TriggerResponse | null>(
    null,
  );
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [draft, setDraft] = useState<TriggerFormDraft>(() => createTriggerDraft());
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (!instanceUuid) {
      return undefined;
    }

    let cancelled = false;

    void Promise.resolve().then(async () => {
      setLoading(true);
      setError(null);

      try {
        const [
          nextTriggers,
          nextTemplates,
          nextNotificationTemplates,
        ] = await Promise.all([
          triggerApi.getTriggers(instanceUuid),
          templateApi.getTemplates(instanceUuid),
          notificationTemplateApi.getNotificationTemplates(instanceUuid),
        ]);

        if (cancelled) {
          return;
        }

        setTriggers(nextTriggers);
        setTemplates(nextTemplates);
        setNotificationTemplates(nextNotificationTemplates);
      } catch (requestError) {
        if (!cancelled) {
          setError(getErrorMessage(requestError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [instanceUuid]);

  const refreshWorkspace = useCallback(
    async (nextSelectedId?: string | null) => {
      if (!instanceUuid) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [
          nextTriggers,
          nextTemplates,
          nextNotificationTemplates,
        ] = await Promise.all([
          triggerApi.getTriggers(instanceUuid),
          templateApi.getTemplates(instanceUuid),
          notificationTemplateApi.getNotificationTemplates(instanceUuid),
        ]);

        setTriggers(nextTriggers);
        setTemplates(nextTemplates);
        setNotificationTemplates(nextNotificationTemplates);

        const selectedId =
          nextSelectedId === undefined ? selectedTrigger?.id : nextSelectedId;
        const nextSelectedTrigger = selectedId
          ? nextTriggers.find((trigger) => trigger.id === selectedId) ?? null
          : null;

        setSelectedTrigger(nextSelectedTrigger);
        if (formMode === "edit") {
          if (nextSelectedTrigger) {
            setDraft(createTriggerDraft(nextSelectedTrigger));
          } else {
            setFormMode("create");
            setDraft(createTriggerDraft());
          }
        }
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    },
    [formMode, instanceUuid, selectedTrigger],
  );

  const startCreate = useCallback(() => {
    setFormMode("create");
    setSelectedTrigger(null);
    setDraft(createTriggerDraft());
    setError(null);
    setMessage(null);
  }, []);

  const startEdit = useCallback((trigger: TriggerResponse) => {
    setFormMode("edit");
    setSelectedTrigger(trigger);
    setDraft(createTriggerDraft(trigger));
    setError(null);
    setMessage(null);
  }, []);

  const handleCreateTrigger = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!instanceUuid) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const createdTrigger = await triggerApi.createTrigger(
        instanceUuid,
        buildTriggerPayload(draft),
      );
      setFormMode("edit");
      setSelectedTrigger(createdTrigger);
      setDraft(createTriggerDraft(createdTrigger));
      setMessage("Триггер создан");
      await refreshWorkspace(createdTrigger.id);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTrigger = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!instanceUuid || !selectedTrigger) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const updatedTrigger = await triggerApi.updateTrigger(
        instanceUuid,
        selectedTrigger.id,
        buildTriggerPayload(draft),
      );
      setSelectedTrigger(updatedTrigger);
      setDraft(createTriggerDraft(updatedTrigger));
      setMessage("Триггер обновлён");
      await refreshWorkspace(updatedTrigger.id);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTrigger = async (trigger: TriggerResponse) => {
    if (!instanceUuid || !confirm(`Удалить триггер "${trigger.name}"?`)) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await triggerApi.deleteTrigger(instanceUuid, trigger.id);
      if (selectedTrigger?.id === trigger.id) {
        setFormMode("create");
        setSelectedTrigger(null);
        setDraft(createTriggerDraft());
      }
      setMessage("Триггер удалён");
      await refreshWorkspace(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-950 md:flex">
      <AppSidebar />
      <main className="flex-1 p-4 md:p-6">
        <div className="mb-6 flex flex-col gap-2 border-b border-gray-200 pb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Triggers</h1>
              {instanceUuid && (
                <p className="font-mono text-xs text-gray-500">
                  Instance: {instanceUuid}
                </p>
              )}
            </div>
            <button
              type="button"
              className="w-fit rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              onClick={startCreate}
              disabled={saving}
            >
              Новый триггер
            </button>
          </div>
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

        <div className="grid gap-6 xl:grid-cols-[minmax(340px,520px)_minmax(0,1fr)]">
          <section className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-4 border-b border-gray-200 pb-3">
              <h2 className="text-lg font-semibold">
                {formMode === "create" ? "Создать триггер" : "Редактировать триггер"}
              </h2>
              {selectedTrigger && (
                <p className="font-mono text-xs text-gray-500">
                  {selectedTrigger.id}
                </p>
              )}
            </div>
            <TriggerForm
              mode={formMode}
              draft={draft}
              templates={templates}
              notificationTemplates={notificationTemplates}
              saving={saving || loading}
              onChange={setDraft}
              onSubmit={
                formMode === "create" ? handleCreateTrigger : handleUpdateTrigger
              }
              onCancel={formMode === "edit" ? startCreate : undefined}
            />
          </section>

          <TriggerList
            triggers={triggers}
            templates={templates}
            loading={loading}
            saving={saving}
            selectedTriggerId={selectedTrigger?.id}
            onEdit={startEdit}
            onDelete={(trigger) => void handleDeleteTrigger(trigger)}
            onRefresh={() => void refreshWorkspace()}
          />
        </div>
      </main>
    </div>
  );
}
