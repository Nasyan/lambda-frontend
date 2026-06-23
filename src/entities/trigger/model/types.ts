export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

export const TRIGGER_TYPES = [
  "STORED_COLUMN",
  "LIVE_EVAL",
  "AUTOMATION",
] as const;

export type TriggerType = (typeof TRIGGER_TYPES)[number];

export const EVENT_TYPES = [
  "CRON",
  "ON_TIME",
  "ON_RECORD_CREATE",
  "ON_RECORD_UPDATE",
  "MANUAL",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const PAYLOAD_RETURN_TYPES = ["BOOLEAN", "VALUE", "LIST"] as const;

export type PayloadReturnType = (typeof PAYLOAD_RETURN_TYPES)[number];

export const ACTION_NAMES = [
  "RETURN_TO_CALLER",
  "test_action",
  "create_crm_notification",
  "SEND_NOTIFICATION",
  "send_telegram_broadcast",
  "SEND_BULK_NOTIFICATION",
  "mongo_insert",
  "INSERT_RECORD",
  "mongo_update",
  "UPDATE_RECORD",
  "mongo_upsert",
  "UPSERT_RECORD",
] as const;

export type ActionName = (typeof ACTION_NAMES)[number];

export interface TestActionParams {
  required_text: string;
  send_attempts: number;
}

export interface TGBroadcastParams {
  target_phone_column: string;
  message_template: string;
}

export interface NotificationParams {
  notification_template_uuid: string;
}

export interface MongoInsertParams {
  target_template_uuid?: string;
  payload: JsonObject;
  [key: string]: JsonValue | undefined;
}

export interface MongoUpdateParams {
  target_template_uuid?: string;
  filter: JsonObject;
  update_op: JsonObject;
  [key: string]: JsonValue | undefined;
}

export interface MongoUpsertParams {
  target_template_uuid?: string;
  search_fields: string[];
  payload: JsonObject;
  [key: string]: JsonValue | string[] | undefined;
}

export type ActionParamsType =
  | TestActionParams
  | TGBroadcastParams
  | NotificationParams
  | MongoInsertParams
  | MongoUpdateParams
  | MongoUpsertParams
  | JsonObject;

export interface Trigger {
  id: string;
  instance_uuid: string;
  name: string;
  trigger_type: TriggerType;
  condition_ast: JsonObject | null;
  payload_ast: JsonObject;
  payload_return_type: PayloadReturnType;
  action_mapping_ast: JsonObject | null;
  source_template_uuid: string;
  target_template_uuid: string | null;
  target_field: string | null;
  event_type: EventType | null;
  cron_expression: string | null;
  action_name: ActionName | string | null;
  action_params: JsonObject | null;
}

export type TriggerResponse = Trigger;

export type TriggerDto = Omit<TriggerResponse, "id"> & {
  id?: string;
  _id?: string;
};

export interface TriggerCreate {
  name: string;
  trigger_type: TriggerType;
  condition_ast?: JsonObject | null;
  payload_ast: JsonObject;
  action_mapping_ast?: JsonObject | null;
  source_template_uuid: string;
  target_template_uuid: string;
  target_field?: string | null;
  event_type?: EventType | null;
  cron_expression?: string | null;
  action_name?: ActionName | string | null;
  action_params?: ActionParamsType | null;
}

export type TriggerUpdate = Partial<TriggerCreate>;

export interface TriggerEvaluateRequest {
  context_data: JsonObject;
  manual_input?: JsonValue;
}

export interface TriggerEvaluateResponse {
  status: string;
  result: JsonValue;
}

export interface TriggerExecuteResponse {
  status: string;
  message?: string;
  execution_details?: JsonValue;
}
