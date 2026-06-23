import { apiClient } from "@/src/shared/api/api-client";
import type {
  TriggerCreate,
  TriggerDto,
  TriggerEvaluateRequest,
  TriggerEvaluateResponse,
  TriggerExecuteResponse,
  TriggerResponse,
  TriggerUpdate,
} from "@/src/entities/trigger/model/types";

const encodePathPart = (value: string) => encodeURIComponent(value);

const triggersPath = (instanceUuid: string) =>
  `/instances/${encodePathPart(instanceUuid)}/triggers`;

const triggerPath = (instanceUuid: string, triggerUuid: string) =>
  `${triggersPath(instanceUuid)}/${encodePathPart(triggerUuid)}`;

const normalizeTrigger = (trigger: TriggerDto): TriggerResponse => {
  const id = trigger.id ?? trigger._id;

  if (!id) {
    throw new Error("Trigger response does not contain id");
  }

  return {
    id,
    instance_uuid: trigger.instance_uuid,
    name: trigger.name,
    trigger_type: trigger.trigger_type,
    condition_ast: trigger.condition_ast ?? null,
    payload_ast: trigger.payload_ast,
    payload_return_type: trigger.payload_return_type,
    action_mapping_ast: trigger.action_mapping_ast ?? null,
    source_template_uuid: trigger.source_template_uuid,
    target_template_uuid: trigger.target_template_uuid ?? null,
    target_field: trigger.target_field ?? null,
    event_type: trigger.event_type ?? null,
    cron_expression: trigger.cron_expression ?? null,
    action_name: trigger.action_name ?? null,
    action_params: trigger.action_params ?? null,
  };
};

export const triggerApi = {
  async getTriggers(instanceUuid: string): Promise<TriggerResponse[]> {
    const response = await apiClient.get<TriggerDto[]>(triggersPath(instanceUuid));
    return response.data.map(normalizeTrigger);
  },

  async createTrigger(
    instanceUuid: string,
    payload: TriggerCreate,
  ): Promise<TriggerResponse> {
    const response = await apiClient.post<TriggerDto>(
      triggersPath(instanceUuid),
      payload,
    );
    return normalizeTrigger(response.data);
  },

  async updateTrigger(
    instanceUuid: string,
    triggerUuid: string,
    payload: TriggerUpdate,
  ): Promise<TriggerResponse> {
    const response = await apiClient.patch<TriggerDto>(
      triggerPath(instanceUuid, triggerUuid),
      payload,
    );
    return normalizeTrigger(response.data);
  },

  async deleteTrigger(instanceUuid: string, triggerUuid: string): Promise<void> {
    await apiClient.delete(triggerPath(instanceUuid, triggerUuid));
  },

  async evaluateTrigger(
    instanceUuid: string,
    triggerUuid: string,
    payload: TriggerEvaluateRequest,
  ): Promise<TriggerEvaluateResponse> {
    const response = await apiClient.post<TriggerEvaluateResponse>(
      `${triggerPath(instanceUuid, triggerUuid)}/evaluate`,
      payload,
    );
    return response.data;
  },

  async executeTrigger(
    instanceUuid: string,
    triggerUuid: string,
  ): Promise<TriggerExecuteResponse> {
    const response = await apiClient.post<TriggerExecuteResponse>(
      `${triggerPath(instanceUuid, triggerUuid)}/execute`,
    );
    return response.data;
  },
};
