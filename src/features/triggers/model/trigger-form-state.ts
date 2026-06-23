import type {
  ActionName,
  ActionParamsType,
  EventType,
  JsonObject,
  JsonValue,
  TriggerCreate,
  TriggerResponse,
  TriggerType,
} from "@/src/entities/trigger/model/types";
import { ACTION_NAMES } from "@/src/entities/trigger/model/types";

export interface TriggerFormDraft {
  name: string;
  triggerType: TriggerType;
  eventType: EventType | "";
  sourceTemplateUuid: string;
  targetTemplateUuid: string;
  targetField: string;
  cronExpression: string;
  actionName: ActionName | "";
  notificationTemplateUuid: string;
  targetPhoneColumn: string;
  messageTemplate: string;
  testRequiredText: string;
  testSendAttempts: string;
  mongoSearchFields: string;
  mongoPayloadJson: string;
  mongoFilterJson: string;
  mongoUpdateOpJson: string;
  genericActionParamsJson: string;
  conditionAstJson: string;
  payloadAstJson: string;
  actionMappingAstJson: string;
}

const DEFAULT_PAYLOAD_AST: JsonObject = {
  type: "literal",
  value: "",
};

const NOTIFICATION_ACTION_NAMES = new Set<string>([
  "create_crm_notification",
  "SEND_NOTIFICATION",
]);

const TELEGRAM_ACTION_NAMES = new Set<string>([
  "send_telegram_broadcast",
  "SEND_BULK_NOTIFICATION",
]);

const DML_INSERT_ACTION_NAMES = new Set<string>(["mongo_insert", "INSERT_RECORD"]);
const DML_UPDATE_ACTION_NAMES = new Set<string>(["mongo_update", "UPDATE_RECORD"]);
const DML_UPSERT_ACTION_NAMES = new Set<string>(["mongo_upsert", "UPSERT_RECORD"]);

export const isNotificationActionName = (actionName: string): boolean =>
  NOTIFICATION_ACTION_NAMES.has(actionName);

export const isTelegramActionName = (actionName: string): boolean =>
  TELEGRAM_ACTION_NAMES.has(actionName);

export const isDmlInsertActionName = (actionName: string): boolean =>
  DML_INSERT_ACTION_NAMES.has(actionName);

export const isDmlUpdateActionName = (actionName: string): boolean =>
  DML_UPDATE_ACTION_NAMES.has(actionName);

export const isDmlUpsertActionName = (actionName: string): boolean =>
  DML_UPSERT_ACTION_NAMES.has(actionName);

export const isDmlActionName = (actionName: string): boolean =>
  isDmlInsertActionName(actionName) ||
  isDmlUpdateActionName(actionName) ||
  isDmlUpsertActionName(actionName);

const isKnownActionName = (value: string | null | undefined): value is ActionName =>
  ACTION_NAMES.some((actionName) => actionName === value);

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

const stringifyJson = (value: JsonValue | undefined | null): string =>
  value === undefined || value === null ? "" : JSON.stringify(value, null, 2);

const trimToNull = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const parseJsonValue = (value: string, label: string): JsonValue | undefined => {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return undefined;
  }

  const parsedValue: unknown = JSON.parse(trimmedValue);
  if (!isJsonValue(parsedValue)) {
    throw new Error(`${label}: JSON contains an unsupported value`);
  }

  return parsedValue;
};

const parseOptionalJsonObject = (
  value: string,
  label: string,
): JsonObject | null => {
  const parsedValue = parseJsonValue(value, label);
  if (parsedValue === undefined) {
    return null;
  }

  if (!isJsonObject(parsedValue)) {
    throw new Error(`${label}: expected a JSON object`);
  }

  return parsedValue;
};

const parseRequiredJsonObject = (value: string, label: string): JsonObject => {
  const parsedValue = parseOptionalJsonObject(value, label);
  if (!parsedValue) {
    throw new Error(`${label} is required`);
  }

  return parsedValue;
};

const getStringParam = (
  params: JsonObject | null,
  key: string,
  fallback = "",
): string => {
  const value = params?.[key];
  return typeof value === "string" ? value : fallback;
};

const getNumberParam = (
  params: JsonObject | null,
  key: string,
  fallback: number,
): number => {
  const value = params?.[key];
  return typeof value === "number" ? value : fallback;
};

const getObjectParam = (params: JsonObject | null, key: string): JsonObject => {
  const value = params?.[key];
  return isJsonObject(value) ? value : {};
};

const getStringListParam = (params: JsonObject | null, key: string): string[] => {
  const value = params?.[key];
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
};

export const createTriggerDraft = (
  trigger?: TriggerResponse | null,
): TriggerFormDraft => {
  const actionName = isKnownActionName(trigger?.action_name)
    ? trigger.action_name
    : "";
  const params = trigger?.action_params ?? null;

  return {
    name: trigger?.name ?? "",
    triggerType: trigger?.trigger_type ?? "LIVE_EVAL",
    eventType: trigger?.event_type ?? "",
    sourceTemplateUuid: trigger?.source_template_uuid ?? "",
    targetTemplateUuid: trigger?.target_template_uuid ?? "",
    targetField: trigger?.target_field ?? "",
    cronExpression: trigger?.cron_expression ?? "",
    actionName,
    notificationTemplateUuid: getStringParam(params, "notification_template_uuid"),
    targetPhoneColumn: getStringParam(params, "target_phone_column"),
    messageTemplate: getStringParam(params, "message_template"),
    testRequiredText: getStringParam(params, "required_text"),
    testSendAttempts: String(getNumberParam(params, "send_attempts", 1)),
    mongoSearchFields: getStringListParam(params, "search_fields").join(", "),
    mongoPayloadJson: stringifyJson(getObjectParam(params, "payload")),
    mongoFilterJson: stringifyJson(getObjectParam(params, "filter")),
    mongoUpdateOpJson: stringifyJson(getObjectParam(params, "update_op")),
    genericActionParamsJson:
      actionName &&
      !isNotificationActionName(actionName) &&
      !isTelegramActionName(actionName) &&
      !isDmlActionName(actionName) &&
      actionName !== "test_action"
        ? stringifyJson(params)
        : "",
    conditionAstJson: stringifyJson(trigger?.condition_ast),
    payloadAstJson: stringifyJson(trigger?.payload_ast ?? DEFAULT_PAYLOAD_AST),
    actionMappingAstJson: stringifyJson(trigger?.action_mapping_ast),
  };
};

const buildActionParams = (draft: TriggerFormDraft): ActionParamsType | null => {
  const actionName = draft.actionName;
  if (!actionName) {
    return null;
  }

  if (actionName === "test_action") {
    const sendAttempts = Number.parseInt(draft.testSendAttempts, 10);
    if (!Number.isFinite(sendAttempts) || sendAttempts < 1) {
      throw new Error("send_attempts must be a positive integer");
    }

    return {
      required_text: draft.testRequiredText.trim(),
      send_attempts: sendAttempts,
    };
  }

  if (isNotificationActionName(actionName)) {
    if (!draft.notificationTemplateUuid) {
      throw new Error("notification_template_uuid is required for notifications");
    }

    return {
      notification_template_uuid: draft.notificationTemplateUuid,
    };
  }

  if (isTelegramActionName(actionName)) {
    if (!draft.targetPhoneColumn.trim() || !draft.messageTemplate.trim()) {
      throw new Error("Telegram broadcast params require phone column and message");
    }

    return {
      target_phone_column: draft.targetPhoneColumn.trim(),
      message_template: draft.messageTemplate.trim(),
    };
  }

  if (isDmlInsertActionName(actionName)) {
    return {
      target_template_uuid: draft.targetTemplateUuid,
      payload: parseOptionalJsonObject(draft.mongoPayloadJson, "Mongo payload") ?? {},
    };
  }

  if (isDmlUpdateActionName(actionName)) {
    return {
      target_template_uuid: draft.targetTemplateUuid,
      filter: parseOptionalJsonObject(draft.mongoFilterJson, "Mongo filter") ?? {},
      update_op:
        parseOptionalJsonObject(draft.mongoUpdateOpJson, "Mongo update_op") ?? {},
    };
  }

  if (isDmlUpsertActionName(actionName)) {
    const searchFields = draft.mongoSearchFields
      .split(",")
      .map((field) => field.trim())
      .filter(Boolean);

    if (searchFields.length === 0) {
      throw new Error("search_fields is required for upsert actions");
    }

    return {
      target_template_uuid: draft.targetTemplateUuid,
      search_fields: searchFields,
      payload: parseOptionalJsonObject(draft.mongoPayloadJson, "Mongo payload") ?? {},
    };
  }

  return parseOptionalJsonObject(
    draft.genericActionParamsJson,
    "Action params",
  );
};

export const buildTriggerPayload = (draft: TriggerFormDraft): TriggerCreate => {
  const name = draft.name.trim();
  if (!name) {
    throw new Error("Trigger name is required");
  }

  if (!draft.sourceTemplateUuid) {
    throw new Error("source_template_uuid is required");
  }

  if (!draft.targetTemplateUuid) {
    throw new Error("target_template_uuid is required");
  }

  if (draft.triggerType === "AUTOMATION") {
    if (!draft.eventType) {
      throw new Error("event_type is required for AUTOMATION triggers");
    }

    if (!draft.actionName) {
      throw new Error("action_name is required for AUTOMATION triggers");
    }
  }

  if (
    (draft.eventType === "CRON" || draft.eventType === "ON_TIME") &&
    !draft.cronExpression.trim()
  ) {
    throw new Error("cron_expression is required for CRON and ON_TIME events");
  }

  const actionMappingAst = parseOptionalJsonObject(
    draft.actionMappingAstJson,
    "action_mapping_ast",
  );

  if (draft.actionName && isDmlActionName(draft.actionName) && !actionMappingAst) {
    throw new Error("action_mapping_ast is required for Mongo write actions");
  }

  return {
    name,
    trigger_type: draft.triggerType,
    condition_ast: parseOptionalJsonObject(
      draft.conditionAstJson,
      "condition_ast",
    ),
    payload_ast: parseRequiredJsonObject(draft.payloadAstJson, "payload_ast"),
    action_mapping_ast: actionMappingAst,
    source_template_uuid: draft.sourceTemplateUuid,
    target_template_uuid: draft.targetTemplateUuid,
    target_field: trimToNull(draft.targetField),
    event_type: draft.eventType || null,
    cron_expression: trimToNull(draft.cronExpression),
    action_name: draft.actionName || null,
    action_params: buildActionParams(draft),
  };
};
