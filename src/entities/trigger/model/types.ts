import type { JsonValue } from "@/src/entities/template/model/types";

export type TriggerType = "STORED_COLUMN" | "LIVE_EVAL" | "AUTOMATION";
export type EventType =
  | "CRON"
  | "ON_TIME"
  | "ON_RECORD_CREATE"
  | "ON_RECORD_UPDATE"
  | "MANUAL";
export type PayloadReturnType = "BOOLEAN" | "VALUE" | "LIST";

export interface TriggerResponse {
  id: string; // В Python модели это id (UUID)
  _id?: string;
  uuid?: string;
  instance_uuid: string;
  name: string;
  target_field: string | null;
  trigger_type: TriggerType;
  condition_ast: JsonValue | null;
  payload_ast: JsonValue;
  payload_return_type: PayloadReturnType;
  action_mapping_ast: JsonValue | null;
  source_template_uuid: string;
  target_template_uuid: string | null;
  event_type: EventType | null;
  cron_expression: string | null;
  action_name: string | null;
  action_params: JsonValue | null;
}

export interface TriggerCreatePayload {
  name: string;
  target_field?: string | null;
  trigger_type: TriggerType;
  condition_ast?: JsonValue | null;
  payload_ast: JsonValue;
  payload_return_type: PayloadReturnType;
  action_mapping_ast?: JsonValue | null;
  source_template_uuid: string;
  target_template_uuid?: string | null;
  event_type?: EventType | null;
  cron_expression?: string | null;
  action_name?: string | null;
  action_params?: JsonValue | null;
}

export type TriggerUpdatePayload = Partial<TriggerCreatePayload>;

export interface TriggerExecuteResponse {
  message?: string;
  [key: string]: JsonValue | undefined;
}
