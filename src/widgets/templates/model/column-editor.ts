import {
  createDefaultCascadingTreeConfig,
  createDefaultFormulaAst,
  getAllowedWidgetsForType,
  isCascadingTreeConfig,
  isUiWidget,
  parseJsonObjectText,
  validateCascadingTreeConfig,
} from "@/src/entities/template/model/field-registry";
import type {
  CascadingTreeConfig,
  ColumnMetaResponse,
  JsonValue,
  TemplateFieldType,
  TemplateSchema,
  TriggerMetaResponse,
  UiWidget,
} from "@/src/entities/template/model/types";

export interface PreservedColumnMeta {
  default?: JsonValue;
  indexed?: boolean;
  nullable?: boolean;
  triggers?: TriggerMetaResponse[];
}

export interface TemplateEditorColumn {
  id: string;
  dbName: string;
  type: TemplateFieldType;
  required: boolean;
  unique: boolean;
  uiWidget: UiWidget | "";
  description: string;
  options: string[];
  astText: string;
  targetTemplateUuid: string;
  treeConfig: CascadingTreeConfig;
  preservedMeta: PreservedColumnMeta;
}

export type ColumnMetaBuildResult =
  | { ok: true; meta: ColumnMetaResponse }
  | { ok: false; message: string };

const formatJson = (value: unknown): string => JSON.stringify(value, null, 2);

const createLocalColumnId = (): string => crypto.randomUUID();

const getWidgetForType = (
  fieldType: TemplateFieldType,
  uiWidget: unknown,
): UiWidget | "" => {
  if (!isUiWidget(uiWidget)) return "";
  return getAllowedWidgetsForType(fieldType).includes(uiWidget) ? uiWidget : "";
};

export const createEditorColumn = (
  dbName: string,
  type: TemplateFieldType = "string",
): TemplateEditorColumn => ({
  id: createLocalColumnId(),
  dbName,
  type,
  required: false,
  unique: false,
  uiWidget: "",
  description: "",
  options: [],
  astText: formatJson(createDefaultFormulaAst()),
  targetTemplateUuid: "",
  treeConfig: createDefaultCascadingTreeConfig(),
  preservedMeta: {},
});

export const buildEditorColumns = (
  schema: TemplateSchema,
): TemplateEditorColumn[] =>
  Object.entries(schema).map(([key, meta]) => ({
    ...createEditorColumn(key, meta.type),
    id: `existing-${key}`,
    required: !!meta.required,
    unique: !!meta.unique,
    uiWidget: getWidgetForType(meta.type, meta.ui_widget),
    description: meta.description ?? "",
    options: Array.isArray(meta.options) ? meta.options.map(String) : [],
    astText: formatJson(meta.ast ?? createDefaultFormulaAst()),
    targetTemplateUuid: meta.target_template_uuid ?? "",
    treeConfig: isCascadingTreeConfig(meta.tree_config)
      ? meta.tree_config
      : createDefaultCascadingTreeConfig(),
    preservedMeta: {
      default: meta.default,
      indexed: meta.indexed,
      nullable: meta.nullable,
      triggers: meta.triggers,
    },
  }));

export const applyColumnTypeDefaults = (
  column: TemplateEditorColumn,
  nextType: TemplateFieldType,
): Partial<TemplateEditorColumn> => ({
  type: nextType,
  uiWidget: getWidgetForType(nextType, column.uiWidget),
  options: column.options,
  astText: column.astText || formatJson(createDefaultFormulaAst()),
  treeConfig: column.treeConfig ?? createDefaultCascadingTreeConfig(),
});

const getUniqueOptions = (options: string[]): string[] =>
  Array.from(
    new Set(options.map((option) => option.trim()).filter(Boolean)),
  );

export const buildColumnMeta = (
  column: TemplateEditorColumn,
): ColumnMetaBuildResult => {
  const meta: ColumnMetaResponse = {
    type: column.type,
    required: column.required,
    unique: column.unique,
  };

  if (column.preservedMeta.default !== undefined) {
    meta.default = column.preservedMeta.default;
  }
  if (column.preservedMeta.indexed !== undefined) {
    meta.indexed = column.preservedMeta.indexed;
  }
  if (column.preservedMeta.nullable !== undefined) {
    meta.nullable = column.preservedMeta.nullable;
  }
  if (column.preservedMeta.triggers !== undefined) {
    meta.triggers = column.preservedMeta.triggers;
  }

  const description = column.description.trim();
  if (description) meta.description = description;
  const uiWidget = getWidgetForType(column.type, column.uiWidget);
  if (uiWidget) meta.ui_widget = uiWidget;

  if (column.type === "select") {
    const options = getUniqueOptions(column.options);
    if (options.length === 0) {
      return {
        ok: false,
        message: `Колонка "${column.dbName}" типа select должна иметь хотя бы один вариант`,
      };
    }
    meta.options = options;
  }

  if (column.type === "relation_list") {
    const targetTemplateUuid = column.targetTemplateUuid.trim();
    if (!targetTemplateUuid) {
      return {
        ok: false,
        message: `Колонка "${column.dbName}" типа relation_list должна ссылаться на целевую таблицу`,
      };
    }
    meta.target_template_uuid = targetTemplateUuid;
  }

  if (column.type === "cascading_tree") {
    const treeError = validateCascadingTreeConfig(column.treeConfig);
    if (treeError) {
      return {
        ok: false,
        message: `Некорректная tree_config для "${column.dbName}": ${treeError}`,
      };
    }
    meta.tree_config = column.treeConfig;
  }

  if (column.type === "formula") {
    const parsedAst = parseJsonObjectText(column.astText);
    if (!parsedAst.ok) {
      return {
        ok: false,
        message: `Некорректный ast для "${column.dbName}": ${parsedAst.message}`,
      };
    }
    if (Object.keys(parsedAst.value).length === 0) {
      return {
        ok: false,
        message: `Колонка "${column.dbName}" типа formula должна иметь непустой ast`,
      };
    }
    meta.ast = parsedAst.value;
  }

  return { ok: true, meta };
};
