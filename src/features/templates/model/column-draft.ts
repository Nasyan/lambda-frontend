import type {
  ColumnMetaResponse,
  JsonObject,
  JsonValue,
  TemplateFieldType,
  TemplateResponse,
  TemplateSchema,
} from "@/src/entities/template/model/types";

type BooleanDefaultDraft = "false" | "true";
type ImageUiWidgetDraft = "" | "file_upload" | "camera_capture";
type PhoneUiWidgetDraft = "" | "phone_mask";

export interface ColumnDraft {
  id: string;
  columnName: string;
  type: TemplateFieldType;
  required: boolean;
  defaultEnabled: boolean;
  stringDefault: string;
  numberDefault: string;
  booleanDefault: BooleanDefaultDraft;
  selectOptions: string[];
  selectDefault: string;
  imageDefault: string;
  imageUiWidget: ImageUiWidgetDraft;
  astJson: string;
  datetimeDefault: string;
  urlDefault: string;
  phoneDefault: string;
  phoneUiWidget: PhoneUiWidgetDraft;
  relationTargetTemplateUuid: string;
  treeConfigJson: string;
  extraMetaJson: string;
}

const createDraftId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

export const createEmptyColumnDraft = (): ColumnDraft => ({
  id: createDraftId(),
  columnName: "",
  type: "string",
  required: false,
  defaultEnabled: false,
  stringDefault: "",
  numberDefault: "",
  booleanDefault: "false",
  selectOptions: [""],
  selectDefault: "",
  imageDefault: "",
  imageUiWidget: "",
  astJson: "",
  datetimeDefault: "",
  urlDefault: "",
  phoneDefault: "",
  phoneUiWidget: "",
  relationTargetTemplateUuid: "",
  treeConfigJson: "",
  extraMetaJson: "",
});

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

  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).every(isJsonValue);
  }

  return false;
};

const isJsonObject = (value: unknown): value is JsonObject =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isImageUiWidget = (value: unknown): value is Exclude<ImageUiWidgetDraft, ""> =>
  value === "file_upload" || value === "camera_capture";

const isPhoneUiWidget = (value: unknown): value is Exclude<PhoneUiWidgetDraft, ""> =>
  value === "phone_mask";

const stringifyJson = (value: JsonValue | undefined): string =>
  value === undefined ? "" : JSON.stringify(value, null, 2);

const parseJsonValue = (value: string, label: string): JsonValue | undefined => {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return undefined;
  }

  const parsedValue: unknown = JSON.parse(trimmedValue);
  if (!isJsonValue(parsedValue)) {
    throw new Error(`${label}: JSON contains an unsupported value`);
  }

  return parsedValue;
};

const parseJsonObject = (value: string, label: string): JsonObject | undefined => {
  const parsedValue = parseJsonValue(value, label);

  if (parsedValue === undefined) {
    return undefined;
  }

  if (!isJsonObject(parsedValue)) {
    throw new Error(`${label}: expected a JSON object`);
  }

  return parsedValue;
};

const copyExtraMetaValue = (
  extraMeta: JsonObject,
  key: string,
  value: unknown,
) => {
  if (value === undefined) {
    return;
  }

  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    return;
  }

  const clonedValue: unknown = JSON.parse(serialized);
  if (isJsonValue(clonedValue)) {
    extraMeta[key] = clonedValue;
  }
};

const getDefaultDraft = (
  type: TemplateFieldType,
  defaultValue: JsonValue | undefined,
): Pick<
  ColumnDraft,
  | "defaultEnabled"
  | "stringDefault"
  | "numberDefault"
  | "booleanDefault"
  | "selectDefault"
  | "imageDefault"
  | "datetimeDefault"
  | "urlDefault"
  | "phoneDefault"
> => {
  const emptyDefault = {
    defaultEnabled: false,
    stringDefault: "",
    numberDefault: "",
    booleanDefault: "false" as const,
    selectDefault: "",
    imageDefault: "",
    datetimeDefault: "",
    urlDefault: "",
    phoneDefault: "",
  };

  if (defaultValue === undefined) {
    return emptyDefault;
  }

  if (type === "number" && typeof defaultValue === "number") {
    return {
      ...emptyDefault,
      defaultEnabled: true,
      numberDefault: String(defaultValue),
    };
  }

  if (
    (type === "boolean" || type === "checkbox") &&
    typeof defaultValue === "boolean"
  ) {
    return {
      ...emptyDefault,
      defaultEnabled: true,
      booleanDefault: defaultValue ? "true" : "false",
    };
  }

  if (typeof defaultValue !== "string") {
    return emptyDefault;
  }

  if (type === "select") {
    return { ...emptyDefault, defaultEnabled: true, selectDefault: defaultValue };
  }

  if (type === "image") {
    return { ...emptyDefault, defaultEnabled: true, imageDefault: defaultValue };
  }

  if (type === "datetime") {
    return { ...emptyDefault, defaultEnabled: true, datetimeDefault: defaultValue };
  }

  if (type === "url") {
    return { ...emptyDefault, defaultEnabled: true, urlDefault: defaultValue };
  }

  if (type === "phone") {
    return { ...emptyDefault, defaultEnabled: true, phoneDefault: defaultValue };
  }

  if (type === "string") {
    return { ...emptyDefault, defaultEnabled: true, stringDefault: defaultValue };
  }

  return emptyDefault;
};

const isDefaultRepresented = (
  type: TemplateFieldType,
  defaultValue: JsonValue | undefined,
) => {
  if (defaultValue === undefined) {
    return true;
  }

  if (type === "number") {
    return typeof defaultValue === "number";
  }

  if (type === "boolean" || type === "checkbox") {
    return typeof defaultValue === "boolean";
  }

  return (
    ["string", "select", "image", "datetime", "url", "phone"].includes(type) &&
    typeof defaultValue === "string"
  );
};

export const createDraftFromMeta = (
  columnName: string,
  meta: ColumnMetaResponse,
): ColumnDraft => {
  const extraMeta: JsonObject = {};
  const defaultDraft = getDefaultDraft(meta.type, meta.default);

  Object.entries(meta).forEach(([key, value]) => {
    if (key === "type" || key === "required") {
      return;
    }

    if (key === "default" && isDefaultRepresented(meta.type, meta.default)) {
      return;
    }

    if (key === "ast" && meta.type === "formula") {
      return;
    }

    if (key === "options" && meta.type === "select" && isStringArray(value)) {
      return;
    }

    if (
      key === "ui_widget" &&
      ((meta.type === "image" && isImageUiWidget(value)) ||
        (meta.type === "phone" && isPhoneUiWidget(value)))
    ) {
      return;
    }

    if (
      key === "target_template_uuid" &&
      meta.type === "relation_list" &&
      typeof value === "string"
    ) {
      return;
    }

    if (key === "tree_config" && meta.type === "cascading_tree") {
      return;
    }

    copyExtraMetaValue(extraMeta, key, value);
  });

  return {
    ...createEmptyColumnDraft(),
    ...defaultDraft,
    id: createDraftId(),
    columnName,
    type: meta.type,
    required: meta.required ?? false,
    selectOptions:
      meta.type === "select" && isStringArray(meta.options) ? meta.options : [""],
    imageUiWidget:
      meta.type === "image" && isImageUiWidget(meta.ui_widget)
        ? meta.ui_widget
        : "",
    astJson:
      meta.type === "formula" ? stringifyJson(meta.ast ?? undefined) : "",
    phoneUiWidget:
      meta.type === "phone" && isPhoneUiWidget(meta.ui_widget)
        ? meta.ui_widget
        : "",
    relationTargetTemplateUuid:
      meta.type === "relation_list" && typeof meta.target_template_uuid === "string"
        ? meta.target_template_uuid
        : "",
    treeConfigJson:
      meta.type === "cascading_tree"
        ? stringifyJson(meta.tree_config)
        : "",
    extraMetaJson: Object.keys(extraMeta).length > 0 ? stringifyJson(extraMeta) : "",
  };
};

export const validateSelectOptions = (options: string[]): string[] => {
  if (options.length === 0) {
    throw new Error("Select options cannot be empty");
  }

  const normalizedOptions = options.map((option) => option.trim());
  const emptyOptionIndex = normalizedOptions.findIndex((option) => !option);
  if (emptyOptionIndex >= 0) {
    throw new Error(`Select option ${emptyOptionIndex + 1} cannot be empty`);
  }

  const seenOptions = new Set<string>();
  const duplicateOption = normalizedOptions.find((option) => {
    if (seenOptions.has(option)) {
      return true;
    }

    seenOptions.add(option);
    return false;
  });

  if (duplicateOption) {
    throw new Error(`Select option "${duplicateOption}" is duplicated`);
  }

  return normalizedOptions;
};

export const getSelectOptionsError = (options: string[]): string | null => {
  try {
    validateSelectOptions(options);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "Invalid select options";
  }
};

const setStringDefault = (
  meta: ColumnMetaResponse,
  enabled: boolean,
  value: string,
) => {
  if (enabled) {
    meta.default = value;
  }
};

const setNumberDefault = (
  meta: ColumnMetaResponse,
  enabled: boolean,
  value: string,
) => {
  if (!enabled) {
    return;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    throw new Error("Default: expected a number");
  }

  const parsedValue = Number(trimmedValue);
  if (!Number.isFinite(parsedValue)) {
    throw new Error("Default: expected a finite number");
  }

  meta.default = parsedValue;
};

const setBooleanDefault = (
  meta: ColumnMetaResponse,
  enabled: boolean,
  value: BooleanDefaultDraft,
) => {
  if (enabled) {
    meta.default = value === "true";
  }
};

export const buildColumnMeta = (draft: ColumnDraft): ColumnMetaResponse => {
  const extraMeta = parseJsonObject(draft.extraMetaJson, "Extra meta") ?? {};
  const meta: ColumnMetaResponse = {
    ...(extraMeta as Partial<ColumnMetaResponse>),
    type: draft.type,
    required: draft.required,
  };

  if (draft.type === "string") {
    setStringDefault(meta, draft.defaultEnabled, draft.stringDefault);
  }

  if (draft.type === "number") {
    setNumberDefault(meta, draft.defaultEnabled, draft.numberDefault);
  }

  if (draft.type === "boolean" || draft.type === "checkbox") {
    setBooleanDefault(meta, draft.defaultEnabled, draft.booleanDefault);
  }

  if (draft.type === "select") {
    meta.options = validateSelectOptions(draft.selectOptions);
    setStringDefault(meta, draft.defaultEnabled, draft.selectDefault);
  }

  if (draft.type === "image") {
    setStringDefault(meta, draft.defaultEnabled, draft.imageDefault);
    if (draft.imageUiWidget) {
      meta.ui_widget = draft.imageUiWidget;
    }
  }

  if (draft.type === "formula") {
    const ast = parseJsonObject(draft.astJson, "AST");
    if (!ast) {
      throw new Error("Formula field requires an AST JSON object");
    }

    meta.ast = ast;
  }

  if (draft.type === "datetime") {
    setStringDefault(meta, draft.defaultEnabled, draft.datetimeDefault);
  }

  if (draft.type === "url") {
    setStringDefault(meta, draft.defaultEnabled, draft.urlDefault);
  }

  if (draft.type === "phone") {
    setStringDefault(meta, draft.defaultEnabled, draft.phoneDefault);
    if (draft.phoneUiWidget) {
      meta.ui_widget = draft.phoneUiWidget;
    }
  }

  if (draft.type === "relation_list") {
    const targetTemplateUuid = draft.relationTargetTemplateUuid.trim();
    if (!targetTemplateUuid) {
      throw new Error("relation_list requires target_template_uuid");
    }

    meta.target_template_uuid = targetTemplateUuid;
  }

  if (draft.type === "cascading_tree") {
    const treeConfig = parseJsonObject(draft.treeConfigJson, "tree_config");
    if (!treeConfig) {
      throw new Error("cascading_tree requires tree_config JSON object");
    }

    meta.tree_config = treeConfig;
  }

  return meta;
};

export const buildSchemaFromDrafts = (drafts: ColumnDraft[]): TemplateSchema => {
  const schema: TemplateSchema = {};

  drafts.forEach((draft) => {
    const columnName = draft.columnName.trim();
    if (!columnName) {
      return;
    }

    if (schema[columnName]) {
      throw new Error(`Column "${columnName}" is duplicated`);
    }

    schema[columnName] = buildColumnMeta({ ...draft, columnName });
  });

  return schema;
};

export const getTemplateOptions = (templates: TemplateResponse[]) =>
  templates.map((template) => ({
    value: template.id,
    label: `${template.name} (${template.id})`,
  }));

