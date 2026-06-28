export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

export type UiWidget =
  | "qr"
  | "camera_capture"
  | "file_upload"
  | "geo_point"
  | "phone_mask"
  | "color_picker";

export type TemplateFieldType =
  | "string"
  | "number"
  | "boolean"
  | "checkbox"
  | "select"
  | "image"
  | "formula"
  | "datetime"
  | "url"
  | "phone"
  | "relation_list"
  | "cascading_tree";

export type CascadingTreeNodeType = "adaptive" | "fixed";

export type CascadingTreeConfig = {
  floor_name: string;
  type?: CascadingTreeNodeType;
  options: Record<string, CascadingTreeConfig | null>;
};

export interface TriggerMetaResponse {
  trigger_id: string;
  trigger_type: string;
  event: string;
  target_field?: string | null;
  [key: string]: JsonValue | undefined;
}

export interface ColumnMetaResponse {
  type: TemplateFieldType;
  required?: boolean;
  ast?: JsonObject | null;
  options?: string[];
  triggers?: TriggerMetaResponse[];
  ui_widget?: UiWidget | null;
  default?: JsonValue;
  indexed?: boolean;
  unique?: boolean;
  nullable?: boolean;
  description?: string;
  target_template_uuid?: string;
  tree_config?: CascadingTreeConfig;
  hidden?: boolean;
  placeholder?: string;
  [key: string]:
    | JsonValue
    | TriggerMetaResponse[]
    | CascadingTreeConfig
    | undefined;
}

export type TemplateSchema = Record<string, ColumnMetaResponse>;

export interface TemplateResponse {
  id: string;
  instance_uuid: string;
  name: string;
  schema: TemplateSchema;
  created_by: string;
  updated_by?: string | null;
  version: number;
  is_deleted: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TemplateDto extends Omit<TemplateResponse, "id" | "schema"> {
  id?: string;
  _id?: string;
  schema?: TemplateSchema;
  schema_definition?: TemplateSchema;
}

export interface TemplateCreateRequest {
  name: string;
  schema: TemplateSchema;
}

export interface TemplateUpdateMetadataRequest {
  name: string;
}

export interface ColumnAddOrUpdateRequest {
  column_name: string;
  field_meta: ColumnMetaResponse;
}
