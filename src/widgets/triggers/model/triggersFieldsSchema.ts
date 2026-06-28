import { TriggerType } from "@/src/entities/trigger/model/types";
import type { JsonValue } from "@/src/entities/template/model/types";
import type { TriggerDraft } from "./constants";

export interface FieldConfig {
  visible: boolean;
  required: boolean;
  defaultValue?: JsonValue;
}

// Позволяет задавать конфиг статично или динамически (в зависимости от состояния формы)
export type FieldConfigOrResolver =
  | FieldConfig
  | ((draft: TriggerDraft) => FieldConfig);

export interface TriggerTypeConfig {
  fields: {
    source_template_uuid: FieldConfigOrResolver;
    target_template_uuid: FieldConfigOrResolver;
    target_field: FieldConfigOrResolver;
    event_type: FieldConfigOrResolver;
    cron_expression: FieldConfigOrResolver;
    action_name: FieldConfigOrResolver;
    actionParamsJson: FieldConfigOrResolver;
    conditionAstJson: FieldConfigOrResolver;
    payloadAstJson: FieldConfigOrResolver;
    actionMappingAstJson: FieldConfigOrResolver;
  };
}

export type TriggerFieldName = keyof TriggerTypeConfig["fields"];

export const TRIGGER_FIELDS_SCHEMA: Record<TriggerType, TriggerTypeConfig> = {
  LIVE_EVAL: {
    fields: {
      source_template_uuid: { visible: true, required: true },
      // Подтверждено тестами: LIVE_EVAL может использовать target_template_uuid
      target_template_uuid: { visible: true, required: false },
      target_field: { visible: false, required: false },

      // Скрываем, так как при отправке зашиваем "MANUAL" и "RETURN_TO_CALLER"
      event_type: { visible: false, required: false },
      action_name: { visible: false, required: false },

      cron_expression: { visible: false, required: false },
      actionParamsJson: { visible: false, required: false },

      conditionAstJson: { visible: true, required: false },
      payloadAstJson: { visible: true, required: true },
      actionMappingAstJson: { visible: false, required: false },
    },
  },

  STORED_COLUMN: {
    fields: {
      source_template_uuid: { visible: true, required: true },
      target_template_uuid: { visible: false, required: false },
      target_field: { visible: true, required: true },

      event_type: { visible: false, required: false },
      action_name: { visible: false, required: false },
      cron_expression: { visible: false, required: false },
      actionParamsJson: { visible: false, required: false },

      conditionAstJson: { visible: true, required: false },
      payloadAstJson: { visible: true, required: true },
      actionMappingAstJson: { visible: false, required: false },
    },
  },

  AUTOMATION: {
    fields: {
      source_template_uuid: { visible: true, required: true },
      target_template_uuid: { visible: true, required: false },
      target_field: { visible: false, required: false },

      event_type: { visible: true, required: true },
      cron_expression: (draft) => ({
        visible: draft.event_type === "CRON",
        required: draft.event_type === "CRON",
      }),

      action_name: { visible: true, required: true },

      // Дополнительные параметры для Actions (например, {"search_fields": ["value"]})
      actionParamsJson: { visible: true, required: false },

      conditionAstJson: { visible: true, required: false },
      payloadAstJson: { visible: true, required: true },

      // Маппинг данных (обязателен не для всех Action, поэтому required: false)
      actionMappingAstJson: { visible: true, required: false },
    },
  },
};

/**
 * Умная функция-помощник для получения конфигурации поля.
 * Если поле описано функцией (зависит от других полей), она автоматически её выполнит.
 */
export function getFieldConfig(
  draft: TriggerDraft,
  fieldName: TriggerFieldName,
): FieldConfig {
  const typeConfig = TRIGGER_FIELDS_SCHEMA[draft.trigger_type];

  if (!typeConfig) {
    return { visible: false, required: false };
  }

  const field = typeConfig.fields[fieldName];

  if (typeof field === "function") {
    return field(draft);
  }

  return field;
}
