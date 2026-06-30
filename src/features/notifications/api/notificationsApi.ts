import { apiClient } from "@/src/shared/api/api-client";

// --- ТИПЫ (Слой Entities / Notification) ---

export type RecipientConfigType =
  | "static"
  | "users"
  | "field_path"
  | "all_employees"
  | "ast_tree";

export interface TemplateCreate {
  name: string;
  title: string;
  body: string;
  channels: string[];
  recipients_config: {
    type: RecipientConfigType;
    uuids?: string[];
    user_uuids?: string[];
    field_path?: string;
    tree?: Record<string, any>;
    contact_field?: string;
  };
  source_template_uuid: string | null; // Обязательно для валидации масок {{field}}
  entity_mappings?: Record<string, string> | null;
}

export interface TemplateUpdate extends Partial<TemplateCreate> {}

export interface TemplateResponse {
  uuid: string;
  name: string;
  title: string;
  body: string;
  channels: string[];
  recipients_config: TemplateCreate["recipients_config"];
  source_template_uuid: string | null;
  created_at: string;
}

export interface InboxItemResponse {
  uuid: string;
  is_read: boolean;
  created_at: string;
  title: string;
  body: string;
}

// Контракт CRM-таблиц (для связывания контекста)
export interface CrmTemplateMetadata {
  _id: string; // В тестах Mongo возвращает _id
  name: string;
  schema: Record<string, any>;
}

// --- API КЛИЕНТ (Слой Features / Notification) ---

export const notificationsApi = {
  // Получение CRM таблиц для выпадающего списка
  getCrmTemplates: async (
    instanceUuid: string,
  ): Promise<CrmTemplateMetadata[]> => {
    const response = await apiClient.get<CrmTemplateMetadata[]>(
      `/instances/${instanceUuid}/templates`,
    );
    return response.data;
  },

  // Шаблоны уведомлений
  getTemplates: async (
    instanceUuid: string,
    search?: string,
    sortBy?: string,
  ): Promise<TemplateResponse[]> => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (sortBy) params.append("sort_by", sortBy);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const response = await apiClient.get<TemplateResponse[]>(
      `/instances/${instanceUuid}/notifications/templates${queryString}`,
    );
    return response.data;
  },

  createTemplate: async (instanceUuid: string, data: TemplateCreate) => {
    const response = await apiClient.post<{ uuid: string }>(
      `/instances/${instanceUuid}/notifications/templates`,
      data,
    );
    return response.data;
  },

  updateTemplate: async (
    instanceUuid: string,
    templateUuid: string,
    data: TemplateUpdate,
  ) => {
    const response = await apiClient.patch<{ status: string; uuid?: string }>(
      `/instances/${instanceUuid}/notifications/templates/${templateUuid}`,
      data,
    );
    return response.data;
  },

  deleteTemplate: async (instanceUuid: string, templateUuid: string) => {
    await apiClient.delete(
      `/instances/${instanceUuid}/notifications/templates/${templateUuid}`,
    );
  },

  // Инбокс (Колокольчик)
  getInbox: async (instanceUuid: string): Promise<InboxItemResponse[]> => {
    const response = await apiClient.get<InboxItemResponse[]>(
      `/instances/${instanceUuid}/notifications/inbox`,
    );
    return response.data;
  },

  markAsRead: async (instanceUuid: string, notificationUuid: string) => {
    const response = await apiClient.patch<{ status: string }>(
      `/instances/${instanceUuid}/notifications/inbox/${notificationUuid}/read`,
      {},
    );
    return response.data;
  },
};
