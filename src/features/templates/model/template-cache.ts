"use client";

import { useEffect, useState } from "react";
import { templateApi } from "@/src/features/templates/api/template-api";
import { getInstanceUuidFromAccessToken } from "@/src/shared/lib/session";
import type {
  TemplateResponse,
  TemplateSchema,
} from "@/src/entities/template/model/types";

/**
 * Центральный кеш схем шаблонов.
 *
 * Это ЕДИНСТВЕННОЕ место, через которое feature "Record workspace" обращается
 * к запросам шаблонов. Кеш живёт на уровне модуля, поэтому несколько вкладок,
 * открытых из одного шаблона, делают сетевой запрос ровно один раз
 * (in-flight dedup), а повторные обращения читаются из памяти.
 */

const cacheKey = (instanceUuid: string, templateUuid: string): string =>
  `${instanceUuid}:${templateUuid}`;

// Загруженные шаблоны (ключ = `${instanceUuid}:${templateUuid}`).
const templateCache = new Map<string, TemplateResponse>();

// Промисы запросов "в полёте" — дедуп параллельных обращений.
const inFlightTemplates = new Map<string, Promise<TemplateResponse>>();

// Кеш списков шаблонов (ключ = instanceUuid).
const templateListCache = new Map<string, TemplateResponse[]>();
const inFlightTemplateLists = new Map<string, Promise<TemplateResponse[]>>();

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

/**
 * Возвращает шаблон через кеш. Параллельные вызовы для одного ключа
 * разделяют единый промис, поэтому запрос уходит на сервер однократно.
 */
export const fetchTemplateCached = async (
  instanceUuid: string,
  templateUuid: string,
): Promise<TemplateResponse> => {
  const key = cacheKey(instanceUuid, templateUuid);

  const cached = templateCache.get(key);
  if (cached) return cached;

  const pending = inFlightTemplates.get(key);
  if (pending) return pending;

  const request = templateApi
    .getTemplate(instanceUuid, templateUuid)
    .then((template) => {
      templateCache.set(key, template);
      return template;
    })
    .finally(() => {
      inFlightTemplates.delete(key);
    });

  inFlightTemplates.set(key, request);
  return request;
};

/**
 * Возвращает список шаблонов инстанса через кеш (с дедупом запросов).
 */
export const fetchTemplateListCached = async (
  instanceUuid: string,
): Promise<TemplateResponse[]> => {
  const cached = templateListCache.get(instanceUuid);
  if (cached) return cached;

  const pending = inFlightTemplateLists.get(instanceUuid);
  if (pending) return pending;

  const request = templateApi
    .getTemplates(instanceUuid)
    .then((templates) => {
      templateListCache.set(instanceUuid, templates);
      templates.forEach((template) => {
        templateCache.set(cacheKey(instanceUuid, template.id), template);
      });
      return templates;
    })
    .finally(() => {
      inFlightTemplateLists.delete(instanceUuid);
    });

  inFlightTemplateLists.set(instanceUuid, request);
  return request;
};

/**
 * Сбрасывает кеш. Без аргументов — весь кеш; с templateUuid — точечно один
 * шаблон в текущем инстансе (плюс список этого инстанса, чтобы он перечитался).
 */
export const invalidateTemplateCache = (templateUuid?: string): void => {
  if (!templateUuid) {
    templateCache.clear();
    inFlightTemplates.clear();
    templateListCache.clear();
    inFlightTemplateLists.clear();
    return;
  }

  const instanceUuid = getInstanceUuidFromAccessToken();
  if (!instanceUuid) return;

  const key = cacheKey(instanceUuid, templateUuid);
  templateCache.delete(key);
  inFlightTemplates.delete(key);
  templateListCache.delete(instanceUuid);
  inFlightTemplateLists.delete(instanceUuid);
};

export interface UseTemplateSchemaResult {
  template: TemplateResponse | null;
  schema: TemplateSchema | null;
  loading: boolean;
  error: string | null;
}

/**
 * Хук загрузки схемы шаблона через центральный кеш. При смене templateUuid
 * подхватывает уже загруженный шаблон из памяти без повторного запроса.
 */
export function useTemplateSchema(
  templateUuid: string | null,
): UseTemplateSchemaResult {
  const [template, setTemplate] = useState<TemplateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Обновления состояния выносим из синхронного тела эффекта в микротаску,
    // чтобы не вызывать каскадные ре-рендеры (react-hooks/set-state-in-effect).
    void Promise.resolve().then(async () => {
      if (cancelled) return;

      if (!templateUuid) {
        setTemplate(null);
        setLoading(false);
        setError(null);
        return;
      }

      const instanceUuid = getInstanceUuidFromAccessToken();
      if (!instanceUuid) {
        setTemplate(null);
        setLoading(false);
        setError("instance_uuid недоступен");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const loaded = await fetchTemplateCached(instanceUuid, templateUuid);
        if (cancelled) return;
        setTemplate(loaded);
      } catch (requestError) {
        if (cancelled) return;
        setTemplate(null);
        setError(getErrorMessage(requestError, "Не удалось загрузить шаблон"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [templateUuid]);

  return {
    template,
    schema: template?.schema ?? null,
    loading,
    error,
  };
}

export interface UseTemplateListResult {
  templates: TemplateResponse[];
  loading: boolean;
  error: string | null;
}

/**
 * Хук списка шаблонов (для выбора "вкладка из другой таблицы"), через кеш.
 */
export function useTemplateList(): UseTemplateListResult {
  const [templates, setTemplates] = useState<TemplateResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(async () => {
      if (cancelled) return;

      const instanceUuid = getInstanceUuidFromAccessToken();
      if (!instanceUuid) {
        setTemplates([]);
        setLoading(false);
        setError("instance_uuid недоступен");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const loaded = await fetchTemplateListCached(instanceUuid);
        if (cancelled) return;
        setTemplates(loaded);
      } catch (requestError) {
        if (cancelled) return;
        setTemplates([]);
        setError(
          getErrorMessage(requestError, "Не удалось загрузить список таблиц"),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { templates, loading, error };
}
