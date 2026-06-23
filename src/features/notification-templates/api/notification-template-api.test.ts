import { beforeEach, describe, expect, it, vi } from "vitest";

import { notificationTemplateApi } from "@/src/features/notification-templates/api/notification-template-api";

const get = vi.fn();

vi.mock("@/src/shared/api/api-client", () => ({
  apiClient: {
    get: (...args: unknown[]) => get(...args),
  },
}));

const INSTANCE = "inst-123";

const rawTemplate = {
  uuid: "notification-template-1",
  name: "Manager alert",
  title: "Title",
  body: "Body",
  channels: ["crm"],
  recipients_config: {},
  created_at: "2026-01-01T00:00:00Z",
};

describe("notificationTemplateApi", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("getNotificationTemplates hits the notification templates path", async () => {
    get.mockResolvedValue({ data: [rawTemplate] });
    const result = await notificationTemplateApi.getNotificationTemplates(INSTANCE);
    expect(get).toHaveBeenCalledWith(
      `/instances/${INSTANCE}/notifications/templates`,
    );
    expect(result[0].uuid).toBe(rawTemplate.uuid);
  });

  it("normalizes id fallback", async () => {
    get.mockResolvedValue({
      data: [{ ...rawTemplate, uuid: undefined, id: "fallback-id" }],
    });
    const result = await notificationTemplateApi.getNotificationTemplates(INSTANCE);
    expect(result[0].uuid).toBe("fallback-id");
  });
});
