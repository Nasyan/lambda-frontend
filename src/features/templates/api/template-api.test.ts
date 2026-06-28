import { beforeEach, describe, expect, it, vi } from "vitest";

import { templateApi } from "@/src/features/templates/api/template-api";

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
const TEMPLATE = "tmpl-456";

const rawTemplate = {
  id: TEMPLATE,
  instance_uuid: INSTANCE,
  name: "Leads",
  schema: { columns: [] },
  created_by: "u1",
  version: 1,
  is_deleted: false,
};

describe("templateApi", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    patch.mockReset();
    del.mockReset();
  });

  it("getTemplates hits the instance templates path and normalizes", async () => {
    get.mockResolvedValue({ data: [rawTemplate] });
    const result = await templateApi.getTemplates(INSTANCE);
    expect(get).toHaveBeenCalledWith(`/instances/${INSTANCE}/templates`);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(TEMPLATE);
    expect(result[0].name).toBe("Leads");
  });

  it("createTemplate posts the payload to the templates path", async () => {
    post.mockResolvedValue({ data: rawTemplate });
    const payload = { name: "Leads", schema: {} };
    await templateApi.createTemplate(INSTANCE, payload);
    expect(post).toHaveBeenCalledWith(
      `/instances/${INSTANCE}/templates`,
      payload,
    );
  });

  it("normalizes _id and schema_definition fallbacks", async () => {
    get.mockResolvedValue({
      data: {
        ...rawTemplate,
        id: undefined,
        _id: "alt-id",
        schema: undefined,
        schema_definition: { x: 1 },
      },
    });
    const result = await templateApi.getTemplate(INSTANCE, TEMPLATE);
    expect(result.id).toBe("alt-id");
    expect(result.schema).toEqual({ x: 1 });
  });

  it("throws when the template response has no id", async () => {
    get.mockResolvedValue({
      data: { ...rawTemplate, id: undefined, _id: undefined },
    });
    await expect(templateApi.getTemplate(INSTANCE, TEMPLATE)).rejects.toThrow(
      /does not contain id/,
    );
  });

  it("addColumn posts to the columns path", async () => {
    post.mockResolvedValue({ data: rawTemplate });
    const colPayload = {
      column_name: "email",
      field_meta: { type: "string" as const },
    };
    await templateApi.addColumn(INSTANCE, TEMPLATE, colPayload);
    expect(post).toHaveBeenCalledWith(
      `/instances/${INSTANCE}/templates/${TEMPLATE}/columns`,
      colPayload,
    );
  });

  it("deleteTemplate calls delete on the template path", async () => {
    del.mockResolvedValue({ data: undefined });
    await templateApi.deleteTemplate(INSTANCE, TEMPLATE);
    expect(del).toHaveBeenCalledWith(
      `/instances/${INSTANCE}/templates/${TEMPLATE}`,
    );
  });
});
