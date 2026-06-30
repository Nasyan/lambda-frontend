"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getInstanceUuidFromAccessToken } from "@/src/shared/lib/session";
import { fetchTemplateCached } from "@/src/features/templates/model/template-cache";
import { recordApi } from "@/src/features/records/api/record-api";
import {
  formatFieldValueForSubmit,
  getFieldValueSubmitError,
} from "@/src/entities/template/model/field-registry";
import type {
  JsonObject,
  TemplateSchema,
} from "@/src/entities/template/model/types";
import {
  RecordWorkspaceProvider,
  useRecordWorkspace,
  type RecordDraft,
} from "@/src/features/records/model/useRecordWorkspace";
import { AppSidebar } from "@/src/widgets/app-sidebar/ui/AppSidebar";
import { RecordTabs } from "./RecordTabs";
import { RecordForm } from "./RecordForm";

interface RecordWorkspaceProps {
  /** templateUuid из маршрута — открывается первой вкладкой, если их ещё нет. */
  templateUuid: string;
}

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

/**
 * Признак того, что черновик можно отправить на создание:
 * редактируется, есть несохранённые данные.
 */
const isSubmittableDraft = (draft: RecordDraft): boolean =>
  draft.status === "editing" && draft.dirty;

/**
 * Строит payload из formData по схеме (формат + валидация per field).
 * Возвращает ошибку валидации (если есть) либо готовые данные.
 */
const buildDraftPayload = (
  schema: TemplateSchema,
  formData: JsonObject,
): { data: JsonObject } | { error: string } => {
  const data: JsonObject = {};

  for (const [col, meta] of Object.entries(schema)) {
    const value = formData[col];

    const submitError = getFieldValueSubmitError(col, meta, value);
    if (submitError) {
      return { error: submitError };
    }

    const formatted = formatFieldValueForSubmit(meta, value);
    if (formatted !== undefined) {
      data[col] = formatted;
    }
  }

  return { data };
};

function RecordWorkspaceInner({ templateUuid }: RecordWorkspaceProps) {
  const router = useRouter();
  const { tabs, activeTabId, openTab, setTabStatus } = useRecordWorkspace();

  const [instanceUuid, setInstanceUuid] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [batchProcessing, setBatchProcessing] = useState(false);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? null;

  // Инициализация инстанса + редирект на логин при отсутствии токена.
  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      const tokenInstanceUuid = getInstanceUuidFromAccessToken();
      if (!tokenInstanceUuid) {
        router.push("/login");
        return;
      }
      setInstanceUuid(tokenInstanceUuid);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Открытие стартовой вкладки для маршрутного шаблона, если вкладок ещё нет.
  // Имя берём из загруженного шаблона (через кеш), не блокируя UI.
  // Ref-гард (а не state) — чтобы открыть вкладку строго один раз и не
  // вызывать setState синхронно в теле эффекта.
  const initialisedRef = useRef(false);
  useEffect(() => {
    if (initialisedRef.current || !instanceUuid || tabs.length > 0) return;
    initialisedRef.current = true;

    let cancelled = false;
    void fetchTemplateCached(instanceUuid, templateUuid)
      .then((template) => {
        if (cancelled) return;
        openTab(template.id, template.name);
      })
      .catch(() => {
        if (cancelled) return;
        // Имя недоступно — всё равно открываем вкладку, имя заменится позже.
        openTab(templateUuid, "Таблица");
      });

    return () => {
      cancelled = true;
    };
  }, [instanceUuid, tabs.length, templateUuid, openTab]);

  // Создание одного черновика. Возвращает true при успехе.
  const createDraft = useCallback(
    async (draft: RecordDraft): Promise<boolean> => {
      if (!instanceUuid) return false;

      let schema: TemplateSchema;
      try {
        const template = await fetchTemplateCached(
          instanceUuid,
          draft.templateUuid,
        );
        schema = template.schema;
      } catch (error) {
        setTabStatus(
          draft.id,
          "error",
          getErrorMessage(error, "Не удалось загрузить схему шаблона"),
        );
        return false;
      }

      const payload = buildDraftPayload(schema, draft.formData);
      if ("error" in payload) {
        setTabStatus(draft.id, "error", payload.error);
        return false;
      }

      setTabStatus(draft.id, "saving");
      try {
        await recordApi.createRecord(instanceUuid, draft.templateUuid, {
          data: payload.data,
        });
        setTabStatus(draft.id, "created");
        return true;
      } catch (error) {
        setTabStatus(
          draft.id,
          "error",
          getErrorMessage(error, "Не удалось создать запись"),
        );
        return false;
      }
    },
    [instanceUuid, setTabStatus],
  );

  const handleCreateActive = useCallback(async () => {
    if (!activeTab) return;
    setGlobalError(null);
    if (activeTab.status === "created") return;
    if (!activeTab.dirty) {
      setGlobalError("Заполните хотя бы одно поле перед созданием.");
      return;
    }
    await createDraft(activeTab);
  }, [activeTab, createDraft]);

  const handleCreateAll = useCallback(async () => {
    setGlobalError(null);
    const targets = tabs.filter(isSubmittableDraft);
    if (targets.length === 0) {
      setGlobalError("Нет черновиков, готовых к созданию.");
      return;
    }

    setBatchProcessing(true);
    try {
      // Последовательно: каждый черновик получает собственный статус,
      // частичная ошибка не теряет остальные вкладки.
      for (const draft of targets) {
        await createDraft(draft);
      }
    } finally {
      setBatchProcessing(false);
    }
  }, [tabs, createDraft]);

  const submittableCount = tabs.filter(isSubmittableDraft).length;
  const activeBusy = batchProcessing || activeTab?.status === "saving";

  return (
    <div className="flex min-h-screen w-full bg-gray-50/30">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        {/* Шапка */}
        <div className="flex flex-col gap-1 border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex gap-2 text-sm text-gray-500">
            <button
              type="button"
              onClick={() => router.push("/tables")}
              className="transition-colors hover:text-gray-900"
            >
              Таблицы
            </button>
            <span>/</span>
            <span className="text-gray-900">Создание записей</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Рабочее пространство записей
          </h1>
        </div>

        {/* Вкладки */}
        <RecordTabs />

        {/* Активная форма */}
        <div className="flex-1 overflow-y-auto bg-gray-50/40">
          {activeTab ? (
            <RecordForm draft={activeTab} />
          ) : (
            <div className="p-8 text-sm text-gray-500">
              Нет открытых вкладок. Нажмите «+», чтобы создать новую.
            </div>
          )}
        </div>

        {/* Панель действий */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-white px-6 py-4">
          <div className="text-sm text-gray-500">
            {globalError ? (
              <span className="font-medium text-red-600">{globalError}</span>
            ) : (
              <span>
                Готовы к созданию: {submittableCount} из {tabs.length}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCreateActive}
              disabled={
                !activeTab || activeBusy || activeTab.status === "created"
              }
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {activeTab?.status === "saving" ? "Создание..." : "Создать"}
            </button>
            <button
              type="button"
              onClick={handleCreateAll}
              disabled={batchProcessing || submittableCount === 0}
              className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
            >
              {batchProcessing
                ? "Создание..."
                : `Создать все (${submittableCount})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RecordWorkspace({ templateUuid }: RecordWorkspaceProps) {
  return (
    <RecordWorkspaceProvider>
      <RecordWorkspaceInner templateUuid={templateUuid} />
    </RecordWorkspaceProvider>
  );
}
