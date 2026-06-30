import type {
  CascadingTreeConfig,
  ColumnMetaResponse,
  JsonObject,
  JsonValue,
  TemplateFieldType,
  UiWidget,
} from "./types";

export type ColumnConfigPanelKey =
  | "none"
  | "select_options"
  | "formula_ast"
  | "relation_list"
  | "cascading_tree";

export type FieldInputRendererKey =
  | "text"
  | "number"
  | "checkbox"
  | "select"
  | "image_reference"
  | "datetime"
  | "url"
  | "phone"
  | "relation_list"
  | "cascading_tree"
  | "formula_readonly"
  | "qr"
  | "file_reference"
  | "geo_point"
  | "color_picker";

export interface FieldDefinition {
  type: TemplateFieldType;
  label: string;
  configPanel: ColumnConfigPanelKey;
  inputRenderer: FieldInputRendererKey;
  placeholder: string;
  isComputed?: boolean;
}

export interface UiWidgetDefinition {
  value: UiWidget;
  label: string;
  inputRenderer: FieldInputRendererKey;
  compatibleTypes: readonly TemplateFieldType[];
  placeholder: string;
}

export const UI_WIDGET_DEFINITIONS = [
  {
    value: "qr",
    label: "QR / barcode",
    inputRenderer: "qr",
    compatibleTypes: ["string", "url"],
    placeholder: "QR / barcode value",
  },
  {
    value: "camera_capture",
    label: "Camera capture",
    inputRenderer: "file_reference",
    compatibleTypes: ["string", "image"],
    placeholder: "S3 path from camera capture",
  },
  {
    value: "file_upload",
    label: "File upload",
    inputRenderer: "file_reference",
    compatibleTypes: ["string", "image"],
    placeholder: "S3 path or file URL",
  },
  {
    value: "geo_point",
    label: "Geo point",
    inputRenderer: "geo_point",
    compatibleTypes: ["string"],
    placeholder: "53.9006, 27.5590",
  },
  {
    value: "phone_mask",
    label: "Phone mask",
    inputRenderer: "phone",
    compatibleTypes: ["string", "phone"],
    placeholder: "+375291234567",
  },
  {
    value: "color_picker",
    label: "Color picker",
    inputRenderer: "color_picker",
    compatibleTypes: ["string"],
    placeholder: "#000000",
  },
] as const satisfies readonly UiWidgetDefinition[];

export const FIELD_DEFINITIONS = {
  string: {
    type: "string",
    label: "Текст (string)",
    configPanel: "none",
    inputRenderer: "text",
    placeholder: "Введите текст",
  },
  number: {
    type: "number",
    label: "Число (number)",
    configPanel: "none",
    inputRenderer: "number",
    placeholder: "Введите число",
  },
  boolean: {
    type: "boolean",
    label: "Логическое (boolean)",
    configPanel: "none",
    inputRenderer: "checkbox",
    placeholder: "Включено",
  },
  checkbox: {
    type: "checkbox",
    label: "Флажок (checkbox)",
    configPanel: "none",
    inputRenderer: "checkbox",
    placeholder: "Отмечено",
  },
  select: {
    type: "select",
    label: "Выбор (select)",
    configPanel: "select_options",
    inputRenderer: "select",
    placeholder: "Выберите значение",
  },
  image: {
    type: "image",
    label: "Изображение (image)",
    configPanel: "none",
    inputRenderer: "image_reference",
    placeholder: "S3 path or image URL",
  },
  formula: {
    type: "formula",
    label: "Формула (formula)",
    configPanel: "formula_ast",
    inputRenderer: "formula_readonly",
    placeholder: "Рассчитывается сервером",
    isComputed: true,
  },
  datetime: {
    type: "datetime",
    label: "Дата и время (datetime)",
    configPanel: "none",
    inputRenderer: "datetime",
    placeholder: "Выберите дату и время",
  },
  url: {
    type: "url",
    label: "Ссылка (url)",
    configPanel: "none",
    inputRenderer: "url",
    placeholder: "https://example.com",
  },
  phone: {
    type: "phone",
    label: "Телефон (phone)",
    configPanel: "none",
    inputRenderer: "phone",
    placeholder: "+375291234567",
  },
  relation_list: {
    type: "relation_list",
    label: "Список связей (relation_list)",
    configPanel: "relation_list",
    inputRenderer: "relation_list",
    placeholder: "Выберите связанные записи",
  },
  cascading_tree: {
    type: "cascading_tree",
    label: "Каскадное дерево (cascading_tree)",
    configPanel: "cascading_tree",
    inputRenderer: "cascading_tree",
    placeholder: "Выберите путь",
  },
} as const satisfies Record<TemplateFieldType, FieldDefinition>;

export const COLUMN_TYPE_OPTIONS = Object.values(FIELD_DEFINITIONS).map(
  ({ type, label }) => ({ value: type, label }),
);

export const getFieldDefinition = (
  fieldType: TemplateFieldType,
): FieldDefinition => FIELD_DEFINITIONS[fieldType];

const isWidgetCompatibleWithType = (
  definition: UiWidgetDefinition,
  fieldType: TemplateFieldType,
): boolean =>
  (definition.compatibleTypes as readonly TemplateFieldType[]).includes(
    fieldType,
  );

export const getAllowedWidgetsForType = (
  fieldType: TemplateFieldType,
): readonly UiWidget[] =>
  UI_WIDGET_DEFINITIONS.filter((definition) =>
    isWidgetCompatibleWithType(definition, fieldType),
  ).map((definition) => definition.value);

export const getUiWidgetDefinition = (uiWidget: UiWidget): UiWidgetDefinition =>
  UI_WIDGET_DEFINITIONS.find((definition) => definition.value === uiWidget) ??
  UI_WIDGET_DEFINITIONS[0];

export const resolveFieldInputRenderer = (
  meta: ColumnMetaResponse,
): FieldInputRendererKey => {
  if (meta.ui_widget && isUiWidget(meta.ui_widget)) {
    const widgetDefinition = getUiWidgetDefinition(meta.ui_widget);
    if (isWidgetCompatibleWithType(widgetDefinition, meta.type)) {
      return widgetDefinition.inputRenderer;
    }
  }

  return FIELD_DEFINITIONS[meta.type].inputRenderer;
};

export const createDefaultCascadingTreeConfig = (): CascadingTreeConfig => ({
  floor_name: "Level 1",
  type: "fixed",
  options: {
    "Option 1": null,
  },
});

export const createDefaultFormulaAst = (): JsonObject => ({
  type: "literal",
  value: 0,
});

export const isJsonObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isJsonValue = (value: unknown): value is JsonValue => {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  if (isJsonObject(value)) {
    return Object.values(value).every(isJsonValue);
  }

  return false;
};

export const isUiWidget = (value: unknown): value is UiWidget =>
  UI_WIDGET_DEFINITIONS.some((item) => item.value === value);

export const validateCascadingTreeConfig = (
  value: CascadingTreeConfig,
): string | null => {
  const validateNode = (
    node: CascadingTreeConfig,
    seenPath: string,
    depth: number,
  ): string | null => {
    if (depth > 20) {
      return `${seenPath}: maximum depth is 20`;
    }

    if (!node.floor_name.trim()) {
      return `${seenPath}: floor_name is required`;
    }

    if (node.type && node.type !== "adaptive" && node.type !== "fixed") {
      return `${seenPath}: type must be adaptive or fixed`;
    }

    const optionEntries = Object.entries(node.options);
    if (optionEntries.length === 0) {
      return `${seenPath}: at least one option is required`;
    }

    for (const [optionName, childNode] of optionEntries) {
      const trimmedOption = optionName.trim();
      if (!trimmedOption) {
        return `${seenPath}: option names cannot be empty`;
      }

      if (childNode !== null) {
        const childError = validateNode(
          childNode,
          `${seenPath}.${trimmedOption}`,
          depth + 1,
        );
        if (childError) return childError;
      }
    }

    return null;
  };

  return validateNode(value, value.floor_name || "root", 0);
};

export const isCascadingTreeConfig = (
  value: unknown,
): value is CascadingTreeConfig => {
  if (!isJsonObject(value)) return false;
  if (typeof value.floor_name !== "string") return false;
  if (
    value.type !== undefined &&
    value.type !== "adaptive" &&
    value.type !== "fixed"
  ) {
    return false;
  }
  if (!isJsonObject(value.options)) return false;

  return Object.values(value.options).every(
    (childNode) => childNode === null || isCascadingTreeConfig(childNode),
  );
};

export const parseJsonObjectText = (
  value: string,
): { ok: true; value: JsonObject } | { ok: false; message: string } => {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!isJsonObject(parsed)) {
      return { ok: false, message: "JSON must be an object" };
    }
    if (!isJsonValue(parsed)) {
      return { ok: false, message: "JSON contains unsupported values" };
    }
    return { ok: true, value: parsed };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON";
    return { ok: false, message };
  }
};

export const parseEditableJsonValue = (value: string): JsonValue => {
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (isJsonValue(parsed)) return parsed;
  } catch {
    return value;
  }

  return value;
};

export const isEmptyFieldValue = (
  meta: ColumnMetaResponse,
  value: JsonValue | undefined,
): boolean => {
  if (meta.type === "formula") return true;
  if (value === undefined || value === null) return true;
  if (meta.type === "boolean" || meta.type === "checkbox") return false;

  if (meta.type === "relation_list") {
    if (!Array.isArray(value)) return true;
    return value.every(
      (item) =>
        !isJsonObject(item) ||
        typeof item.target_uuid !== "string" ||
        !item.target_uuid.trim(),
    );
  }

  if (meta.type === "cascading_tree") {
    return !isJsonObject(value) || Object.keys(value).length === 0;
  }

  return value === "";
};

export const isCascadingTreeSelectionComplete = (
  treeConfig: CascadingTreeConfig,
  value: JsonValue | undefined,
): boolean => {
  if (!isJsonObject(value)) return false;

  let node: CascadingTreeConfig | null = treeConfig;
  while (node) {
    const selectedValue: JsonValue | undefined = value[node.floor_name];
    if (typeof selectedValue !== "string" || !selectedValue.trim()) {
      return false;
    }

    if (!Object.prototype.hasOwnProperty.call(node.options, selectedValue)) {
      return false;
    }

    node = node.options[selectedValue];
  }

  return true;
};

export const sanitizeRelationListValue = (
  value: JsonValue | undefined,
): JsonValue[] => {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is JsonObject =>
      isJsonObject(item) &&
      typeof item.target_uuid === "string" &&
      item.target_uuid.trim().length > 0,
  );
};

export const formatFieldValueForSubmit = (
  meta: ColumnMetaResponse,
  value: JsonValue | undefined,
): JsonValue | undefined => {
  if (isEmptyFieldValue(meta, value)) return undefined;

  switch (meta.type) {
    case "number": {
      const parsed = typeof value === "number" ? value : Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    case "boolean":
    case "checkbox":
      return value === true || value === "true";
    case "relation_list":
      return sanitizeRelationListValue(value);
    case "cascading_tree":
      return isJsonObject(value) ? value : undefined;
    case "formula":
      return undefined;
    default:
      return typeof value === "string" ? value : String(value);
  }
};

export const getFieldValueSubmitError = (
  fieldName: string,
  meta: ColumnMetaResponse,
  value: JsonValue | undefined,
): string | null => {
  if (meta.type === "formula") return null;

  if (isEmptyFieldValue(meta, value)) {
    return meta.required ? `Поле "${fieldName}" обязательно` : null;
  }

  if (meta.type === "number") {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed)
      ? null
      : `Поле "${fieldName}" должно быть числом`;
  }

  if (meta.type === "select") {
    const options = Array.isArray(meta.options) ? meta.options : [];
    return typeof value === "string" && options.includes(value)
      ? null
      : `Поле "${fieldName}" должно быть одним из вариантов списка`;
  }

  if (meta.type === "relation_list") {
    if (!Array.isArray(value)) {
      return `Поле "${fieldName}" должно быть списком связей`;
    }

    const hasIncompleteItem = value.some(
      (item) =>
        !isJsonObject(item) ||
        typeof item.target_uuid !== "string" ||
        !item.target_uuid.trim(),
    );

    return hasIncompleteItem
      ? `В поле "${fieldName}" выберите запись для каждой связи`
      : null;
  }

  if (meta.type === "cascading_tree") {
    if (!meta.tree_config) {
      return `Для поля "${fieldName}" не настроен tree_config`;
    }

    return isCascadingTreeSelectionComplete(meta.tree_config, value)
      ? null
      : `В поле "${fieldName}" выберите полный путь дерева`;
  }

  return null;
};
