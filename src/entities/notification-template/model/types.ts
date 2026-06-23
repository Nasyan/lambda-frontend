import type { JsonObject } from "@/src/entities/trigger/model/types";

export interface NotificationTemplate {
  uuid: string;
  name: string;
  title: string;
  body: string;
  channels: string[];
  recipients_config: JsonObject;
  created_at: string;
}

export type NotificationTemplateDto = Omit<NotificationTemplate, "uuid"> & {
  uuid?: string;
  id?: string;
};
