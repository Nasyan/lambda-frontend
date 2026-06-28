import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  EventType,
  PayloadReturnType,
  TriggerType,
} from "@/src/entities/trigger/model/types";
import { getFieldConfig } from "./triggersFieldsSchema";

// Базовая пустая модель для локального состояния формы (фронтенд-формат)
const DEFAULT_DRAFT = {
  name: "",
  trigger_type: "LIVE_EVAL" as TriggerType,
  payload_return_type: "VALUE" as PayloadReturnType,
  source_template_uuid: "",
  target_template_uuid: "",
  target_field: "",
  event_type: "MANUAL" as EventType,
  cron_expression: "",
  action_name: "",
  conditionAstJson: "",
  payloadAstJson: "",
  actionParamsJson: "",
  actionMappingAstJson: "",
};

export function useTriggerEditor(triggerUuid: string | null) {
  const router = useRouter();
  const [draft, setDraft] = useState(DEFAULT_DRAFT);
  const [loading, setLoading] = useState(!!triggerUuid);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка данных с бэкенда и маппинг в плоский строковый формат для формы
  useEffect(() => {
    if (!triggerUuid) return;

    const fetchTrigger = async () => {
      try {
        setLoading(true);
        // Замените на ваш реальный метод API
        // const response = await api.get(`/triggers/${triggerUuid}`);
        // const data = response.data;

        // Когда бэкенд возвращает JSON-объекты, переводим их в строки для <textarea>
        // setDraft({
        //   ...DEFAULT_DRAFT,
        //   ...data,
        //   conditionAstJson: data.condition_ast ? JSON.stringify(data.condition_ast, null, 2) : "",
        //   payloadAstJson: data.payload_ast ? JSON.stringify(data.payload_ast, null, 2) : "",
        //   actionParamsJson: data.action_params ? JSON.stringify(data.action_params, null, 2) : "",
        //   actionMappingAstJson: data.action_mapping_ast ? JSON.stringify(data.action_mapping_ast, null, 2) : "",
        // });
      } catch (err: any) {
        setError(err.message || "Ошибка загрузки триггера");
      } finally {
        setLoading(false);
      }
    };

    fetchTrigger();
  }, [triggerUuid]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // 1. Вспомогательная функция для безопасного парсинга JSON
      const parseJsonField = (fieldValue: string, fieldName: string) => {
        if (!fieldValue.trim()) return undefined;
        try {
          return JSON.parse(fieldValue);
        } catch (e) {
          throw new Error(
            `Ошибка в синтаксисе JSON для поля "${fieldName}": невалидный формат`,
          );
        }
      };

      // 2. Формируем чистый бэкенд-payload на основе матрицы TRIGGER_FIELDS_SCHEMA
      const payload: Record<string, any> = {
        name: draft.name,
        trigger_type: draft.trigger_type,
        payload_return_type: draft.payload_return_type,
      };

      // Проверяем каждое поле по матрице и парсим/добавляем только видимые
      if (getFieldConfig(draft, "source_template_uuid").visible) {
        payload.source_template_uuid = draft.source_template_uuid;
      }
      if (getFieldConfig(draft, "target_template_uuid").visible) {
        payload.target_template_uuid = draft.target_template_uuid || null;
      }
      if (getFieldConfig(draft, "target_field").visible) {
        payload.target_field = draft.target_field;
      }

      // Настройки Event & Cron
      if (draft.trigger_type === "LIVE_EVAL") {
        // Хардкод для LIVE_EVAL, как требуют тесты бэкенда
        payload.event_type = "MANUAL";
      } else if (getFieldConfig(draft, "event_type").visible) {
        payload.event_type = draft.event_type;
      }

      if (getFieldConfig(draft, "cron_expression").visible) {
        payload.cron_expression = draft.cron_expression;
      }

      // Настройки Action & Params
      if (draft.trigger_type === "LIVE_EVAL") {
        // Хардкод для LIVE_EVAL, как требуют тесты бэкенда
        payload.action_name = "RETURN_TO_CALLER";
      } else if (getFieldConfig(draft, "action_name").visible) {
        payload.action_name = draft.action_name;
      }

      if (
        getFieldConfig(draft, "actionParamsJson").visible &&
        draft.actionParamsJson
      ) {
        payload.action_params = parseJsonField(
          draft.actionParamsJson,
          "Action Params JSON",
        );
      }

      // Парсинг AST деревьев в объекты (меняем camelCase фронта на snake_case бэка)
      if (
        getFieldConfig(draft, "conditionAstJson").visible &&
        draft.conditionAstJson
      ) {
        payload.condition_ast = parseJsonField(
          draft.conditionAstJson,
          "Condition AST",
        );
      }
      if (
        getFieldConfig(draft, "payloadAstJson").visible &&
        draft.payloadAstJson
      ) {
        payload.payload_ast = parseJsonField(
          draft.payloadAstJson,
          "Payload AST",
        );
      }
      if (
        getFieldConfig(draft, "actionMappingAstJson").visible &&
        draft.actionMappingAstJson
      ) {
        payload.action_mapping_ast = parseJsonField(
          draft.actionMappingAstJson,
          "Action Mapping AST",
        );
      }

      // 3. Отправка на бэкенд готового чистого объекта
      if (triggerUuid) {
        // PUT запрос на обновление
        // await api.put(`/instances/{instance_uuid}/triggers/${triggerUuid}`, payload);
      } else {
        // POST запрос на создание
        // await api.post(`/instances/{instance_uuid}/triggers/`, payload);
      }

      router.push("/triggers");
    } catch (err: any) {
      // ПРОКАЧАННАЯ ОБРАБОТКА ОШИБОК:
      // Если используешь axios, ошибка бэкенда лежит в err.response.data
      const responseData = err.response?.data;

      if (responseData && responseData.details) {
        // Если бэкенд прислал детализацию (как в твоих тестах)
        const field = responseData.details.field
          ? `[Поле: ${responseData.details.field}] `
          : "";
        const expected = responseData.details.expected
          ? `Ожидалось: ${responseData.details.expected}. `
          : "";
        const got = responseData.details.got
          ? `Получено: ${responseData.details.got}.`
          : "";

        setError(
          `Ошибка валидации: ${field}${expected}${got}`.trim() ||
            JSON.stringify(responseData.details),
        );
      } else if (
        responseData?.error_code === "TRIGGER_RECORD_VALIDATION_ERROR"
      ) {
        setError("Ошибка в структуре AST дерева. Проверьте правильность JSON.");
      } else {
        // Фолбек для сетевых ошибок или если это просто throw new Error() из нашего parseJsonField
        setError(err.message || "Неизвестная ошибка сохранения");
      }
    } finally {
      setSaving(false);
    }
  };

  const updateDraft = (fieldsToUpdate: Partial<typeof DEFAULT_DRAFT>) => {
    setDraft((prev) => ({ ...prev, ...fieldsToUpdate }));
  };

  const checkField = (fieldName: string) =>
    getFieldConfig(draft, fieldName as any);

  return {
    draft,
    updateDraft,
    checkField,
    loading,
    saving,
    error,
    handleSave,
  };
}
