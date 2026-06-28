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
  instance_uuid: string;
  name: string;
  target_field: string | null;
  trigger_type: TriggerType;
  condition_ast: Record<string, any> | null;
  payload_ast: Record<string, any>;
  payload_return_type: PayloadReturnType;
  action_mapping_ast: Record<string, any> | null;
  source_template_uuid: string;
  target_template_uuid: string | null;
  event_type: EventType | null;
  cron_expression: string | null;
  action_name: string | null;
  action_params: Record<string, any> | null;
}

export interface TriggerCreatePayload {
  name: string;
  target_field?: string | null;
  trigger_type: TriggerType;
  condition_ast?: Record<string, any> | null;
  payload_ast: Record<string, any>;
  payload_return_type: PayloadReturnType;
  action_mapping_ast?: Record<string, any> | null;
  source_template_uuid: string;
  target_template_uuid?: string | null;
  event_type?: EventType | null;
  cron_expression?: string | null;
  action_name?: string | null;
  action_params?: Record<string, any> | null;
}

export interface TriggerUpdatePayload extends Partial<TriggerCreatePayload> {}
