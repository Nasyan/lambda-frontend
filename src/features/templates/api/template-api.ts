import { apiClient } from "@/src/shared/api/api-client";
import type {
  ColumnAddOrUpdateRequest,
  TemplateCreateRequest,
  TemplateDto,
  TemplateResponse,
  TemplateUpdateMetadataRequest,
} from "@/src/entities/template/model/types";

const encodePathPart = (value: string) => encodeURIComponent(value);

const templatesPath = (instanceUuid: string) =>
  `/instances/${encodePathPart(instanceUuid)}/templates`;

const templatePath = (instanceUuid: string, templateUuid: string) =>
  `${templatesPath(instanceUuid)}/${encodePathPart(templateUuid)}`;

const columnsPath = (instanceUuid: string, templateUuid: string) =>
  `${templatePath(instanceUuid, templateUuid)}/columns`;

const normalizeTemplate = (template: TemplateDto): TemplateResponse => {
  const id = template.id ?? template._id;

  if (!id) {
    throw new Error("Template response does not contain id");
  }

  return {
    id,
    instance_uuid: template.instance_uuid,
    name: template.name,
    schema: template.schema ?? template.schema_definition ?? {},
    created_by: template.created_by,
    updated_by: template.updated_by ?? null,
    version: template.version,
    is_deleted: template.is_deleted,
    created_at: template.created_at ?? null,
    updated_at: template.updated_at ?? null,
  };
};

export const templateApi = {
  async getTemplates(instanceUuid: string): Promise<TemplateResponse[]> {
    const response = await apiClient.get<TemplateDto[]>(templatesPath(instanceUuid));
    return response.data.map(normalizeTemplate);
  },

  async getDeletedTemplates(instanceUuid: string): Promise<TemplateResponse[]> {
    const response = await apiClient.get<TemplateDto[]>(
      `${templatesPath(instanceUuid)}/deleted`,
    );
    return response.data.map(normalizeTemplate);
  },

  async getTemplate(
    instanceUuid: string,
    templateUuid: string,
  ): Promise<TemplateResponse> {
    const response = await apiClient.get<TemplateDto>(
      templatePath(instanceUuid, templateUuid),
    );
    return normalizeTemplate(response.data);
  },

  async createTemplate(
    instanceUuid: string,
    payload: TemplateCreateRequest,
  ): Promise<TemplateResponse> {
    const response = await apiClient.post<TemplateDto>(
      templatesPath(instanceUuid),
      payload,
    );
    return normalizeTemplate(response.data);
  },

  async updateTemplate(
    instanceUuid: string,
    templateUuid: string,
    payload: TemplateUpdateMetadataRequest,
  ): Promise<TemplateResponse> {
    const response = await apiClient.patch<TemplateDto>(
      templatePath(instanceUuid, templateUuid),
      payload,
    );
    return normalizeTemplate(response.data);
  },

  async deleteTemplate(instanceUuid: string, templateUuid: string): Promise<void> {
    await apiClient.delete(templatePath(instanceUuid, templateUuid));
  },

  async restoreTemplate(
    instanceUuid: string,
    templateUuid: string,
  ): Promise<TemplateResponse> {
    const response = await apiClient.post<TemplateDto>(
      `${templatePath(instanceUuid, templateUuid)}/restore`,
    );
    return normalizeTemplate(response.data);
  },

  async addColumn(
    instanceUuid: string,
    templateUuid: string,
    payload: ColumnAddOrUpdateRequest,
  ): Promise<TemplateResponse> {
    const response = await apiClient.post<TemplateDto>(
      columnsPath(instanceUuid, templateUuid),
      payload,
    );
    return normalizeTemplate(response.data);
  },

  async updateColumn(
    instanceUuid: string,
    templateUuid: string,
    payload: ColumnAddOrUpdateRequest,
  ): Promise<TemplateResponse> {
    const response = await apiClient.patch<TemplateDto>(
      columnsPath(instanceUuid, templateUuid),
      payload,
    );
    return normalizeTemplate(response.data);
  },

  async deleteColumn(
    instanceUuid: string,
    templateUuid: string,
    columnName: string,
  ): Promise<TemplateResponse> {
    const response = await apiClient.delete<TemplateDto>(
      `${columnsPath(instanceUuid, templateUuid)}/${encodePathPart(columnName)}`,
    );
    return normalizeTemplate(response.data);
  },
};
