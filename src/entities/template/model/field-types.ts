import type { TemplateFieldType } from "@/src/entities/template/model/types";

export const TEMPLATE_FIELD_TYPES = [
  "string",
  "number",
  "boolean",
  "checkbox",
  "select",
  "image",
  "formula",
  "datetime",
  "url",
  "phone",
  "relation_list",
  "cascading_tree",
] as const satisfies readonly TemplateFieldType[];

export const FIELD_TYPE_HINTS: Record<TemplateFieldType, string> = {
  string: "Text value stored as string.",
  number: "Numeric value stored as number.",
  boolean: "Boolean value stored as true or false.",
  checkbox: "Boolean checkbox value stored as true or false.",
  select: "Single string value from a fixed option list.",
  image: "String image reference, usually a file path or uploaded object key.",
  formula: "Calculated value backed by the existing formula AST JSON.",
  datetime: "ISO 8601 datetime string or the special value now.",
  url: "String URL value.",
  phone: "International phone string, normalized by the backend.",
  relation_list: "Array of linked records from another template.",
  cascading_tree: "Hierarchical tag selection backed by tree_config JSON.",
};

export const IMAGE_UI_WIDGETS = [
  { value: "file_upload", label: "file_upload" },
  { value: "camera_capture", label: "camera_capture" },
] as const;

export const PHONE_UI_WIDGETS = [{ value: "phone_mask", label: "phone_mask" }] as const;

