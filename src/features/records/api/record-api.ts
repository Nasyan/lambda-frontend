import { apiClient } from "@/src/shared/api/api-client";
import type { JsonObject } from "@/src/entities/template/model/types";

export interface RecordResponse {
  id?: string;
  _id?: string;
  instance_uuid: string;
  template_uuid: string;
  data: JsonObject;
  is_deleted: boolean;
  created_by: string;
  created_at?: string;
  updated_at?: string | null;
}

export interface PaginatedRecordsResponse {
  results: RecordResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface RecordCreateRequest {
  data: JsonObject;
}

export interface RecordUpdateRequest {
  data: JsonObject;
}

const tool = "notes";
const recordsPath = (instanceUuid: string, templateUuid: string) =>
  `/instances/${encodeURIComponent(instanceUuid)}/templates/${encodeURIComponent(templateUuid)}/${tool}`;

export const recordApi = {
  async getRecords(
    instanceUuid: string,
    templateUuid: string,
  ): Promise<RecordResponse[]> {
    const response = await apiClient.get<PaginatedRecordsResponse>(
      recordsPath(instanceUuid, templateUuid),
    );
    return response.data.results || [];
  },

  async getDeletedRecords(
    instanceUuid: string,
    templateUuid: string,
  ): Promise<RecordResponse[]> {
    const response = await apiClient.get<PaginatedRecordsResponse>(
      `${recordsPath(instanceUuid, templateUuid)}/deleted`,
    );
    return response.data.results || [];
  },

  async createRecord(
    instanceUuid: string,
    templateUuid: string,
    payload: RecordCreateRequest,
  ): Promise<RecordResponse> {
    const response = await apiClient.post<RecordResponse>(
      recordsPath(instanceUuid, templateUuid),
      payload,
    );
    return response.data;
  },

  // Новый метод для обновления записи
  async updateRecord(
    instanceUuid: string,
    templateUuid: string,
    recordUuid: string,
    payload: RecordUpdateRequest,
  ): Promise<RecordResponse> {
    const response = await apiClient.patch<RecordResponse>(
      `${recordsPath(instanceUuid, templateUuid)}/${recordUuid}`,
      payload,
    );
    return response.data;
  },

  async deleteRecord(
    instanceUuid: string,
    templateUuid: string,
    recordUuid: string,
  ): Promise<void> {
    await apiClient.delete(
      `${recordsPath(instanceUuid, templateUuid)}/${recordUuid}`,
    );
  },

  async restoreRecord(
    instanceUuid: string,
    templateUuid: string,
    recordUuid: string,
  ): Promise<RecordResponse> {
    const response = await apiClient.post<RecordResponse>(
      `${recordsPath(instanceUuid, templateUuid)}/${recordUuid}/restore`,
    );
    return response.data;
  },
};
