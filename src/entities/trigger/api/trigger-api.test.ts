import { beforeEach, describe, expect, it, vi } from "vitest";

import { triggerApi } from "@/src/entities/trigger/api/trigger-api";
import type { TriggerCreate } from "@/src/entities/trigger/model/types";

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
const del = vi.fn();

vi.mock("@/src/shared/api/api-client", () => ({
  apiClient: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
    patch: (...args: unknown[]) => patch(...args),
    delete: (...args: unknown[]) => del(...args),
  },
}));

const INSTANCE = "inst-123";
const TRIGGER = "trigger-456";

const rawTrigger = {
  id: TRIGGER,
  instance_uuid: INSTANCE,
  name: "Notify manager",
  trigger_type: "AUTOMATION" as const,
  condition_ast: null,
  payload_ast: { type: "literal", value: "ok" },
  payload_return_type: "VALUE" as const,
  action_mapping_ast: null,
  source_template_uuid: "source-template",
  target_template_uuid: "target-template",
  target_field: null,
  event_type: "MANUAL" as const,
  cron_expression: null,
  action_name: "RETURN_TO_CALLER",
  action_params: null,
};

const createPayload: TriggerCreate = {
  name: "Notify manager",
  trigger_type: "AUTOMATION",
  event_type: "MANUAL",
  source_template_uuid: "source-template",
  target_template_uuid: "target-template",
  payload_ast: { type: "literal", value: "ok" },
  action_name: "RETURN_TO_CALLER",
};

describe("triggerApi", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    patch.mockReset();
    del.mockReset();
  });

  it("getTriggers hits the instance triggers path and normalizes responses", async () => {
    get.mockResolvedValue({ data: [rawTrigger] });
    const result = await triggerApi.getTriggers(INSTANCE);
    expect(get).toHaveBeenCalledWith(`/instances/${INSTANCE}/triggers`);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(TRIGGER);
    expect(result[0].target_field).toBeNull();
  });

  it("createTrigger posts the payload to the triggers path", async () => {
    post.mockResolvedValue({ data: rawTrigger });
    await triggerApi.createTrigger(INSTANCE, createPayload);
    expect(post).toHaveBeenCalledWith(
      `/instances/${INSTANCE}/triggers`,
      createPayload,
    );
  });

  it("updateTrigger patches the trigger path", async () => {
    patch.mockResolvedValue({ data: rawTrigger });
    await triggerApi.updateTrigger(INSTANCE, TRIGGER, { name: "Updated" });
    expect(patch).toHaveBeenCalledWith(
      `/instances/${INSTANCE}/triggers/${TRIGGER}`,
      { name: "Updated" },
    );
  });

  it("deleteTrigger calls delete on the trigger path", async () => {
    del.mockResolvedValue({ data: undefined });
    await triggerApi.deleteTrigger(INSTANCE, TRIGGER);
    expect(del).toHaveBeenCalledWith(
      `/instances/${INSTANCE}/triggers/${TRIGGER}`,
    );
  });

  it("evaluateTrigger posts context data to the evaluate path", async () => {
    post.mockResolvedValue({ data: { status: "success", result: true } });
    const payload = { context_data: {}, manual_input: "manual" };
    const result = await triggerApi.evaluateTrigger(INSTANCE, TRIGGER, payload);
    expect(post).toHaveBeenCalledWith(
      `/instances/${INSTANCE}/triggers/${TRIGGER}/evaluate`,
      payload,
    );
    expect(result.result).toBe(true);
  });

  it("executeTrigger posts to the execute path", async () => {
    post.mockResolvedValue({ data: { status: "success" } });
    await triggerApi.executeTrigger(INSTANCE, TRIGGER);
    expect(post).toHaveBeenCalledWith(
      `/instances/${INSTANCE}/triggers/${TRIGGER}/execute`,
    );
  });

  it("normalizes _id fallback", async () => {
    get.mockResolvedValue({
      data: [{ ...rawTrigger, id: undefined, _id: "fallback-id" }],
    });
    const result = await triggerApi.getTriggers(INSTANCE);
    expect(result[0].id).toBe("fallback-id");
  });

  it("throws when the trigger response has no id", async () => {
    get.mockResolvedValue({
      data: [{ ...rawTrigger, id: undefined, _id: undefined }],
    });
    await expect(triggerApi.getTriggers(INSTANCE)).rejects.toThrow(
      /does not contain id/,
    );
  });
});
