import { apiClient } from "@/src/shared/api/api-client";
import type {
  NotificationTemplate,
  NotificationTemplateDto,
} from "@/src/entities/notification-template/model/types";

const encodePathPart = (value: string) => encodeURIComponent(value);

const notificationTemplatesPath = (instanceUuid: string) =>
  `/instances/${encodePathPart(instanceUuid)}/notifications/templates`;

const normalizeNotificationTemplate = (
  template: NotificationTemplateDto,
): NotificationTemplate => {
  const uuid = template.uuid ?? template.id;

  if (!uuid) {
    throw new Error("Notification template response does not contain uuid");
  }

  return {
    uuid,
    name: template.name,
    title: template.title,
    body: template.body,
    channels: template.channels ?? [],
    recipients_config: template.recipients_config ?? {},
    created_at: template.created_at,
  };
};

export const notificationTemplateApi = {
  async getNotificationTemplates(
    instanceUuid: string,
  ): Promise<NotificationTemplate[]> {
    const response = await apiClient.get<NotificationTemplateDto[]>(
      notificationTemplatesPath(instanceUuid),
    );
    return response.data.map(normalizeNotificationTemplate);
  },
};
