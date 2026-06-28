import type {
  TriggerType,
  PayloadReturnType,
  EventType,
} from "@/src/entities/trigger/model/types";

export interface TriggerDraft {
  name: string;
  target_field: string;
  trigger_type: TriggerType;
  payload_return_type: PayloadReturnType;
  event_type: EventType;
  cron_expression: string;
  action_name: string;
  source_template_uuid: string;
  target_template_uuid: string;
  conditionAstJson: string;
  payloadAstJson: string;
  actionParamsJson: string;
  actionMappingAstJson: string;
}

export const EMPTY_DRAFT: TriggerDraft = {
  name: "",
  target_field: "",
  trigger_type: "AUTOMATION" as TriggerType,
  payload_return_type: "VALUE" as PayloadReturnType,
  event_type: "ON_RECORD_CREATE" as EventType,
  cron_expression: "",
  action_name: "UPSERT_RECORD",
  source_template_uuid: "",
  target_template_uuid: "",
  conditionAstJson: "null",
  payloadAstJson: '{\n  "type": "object",\n  "fields": {}\n}',
  actionParamsJson: "null",
  actionMappingAstJson: "null",
};
