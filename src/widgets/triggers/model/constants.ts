import type {
  TriggerType,
  PayloadReturnType,
  EventType,
} from "@/src/entities/trigger/model/types";

export const EMPTY_DRAFT = {
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
