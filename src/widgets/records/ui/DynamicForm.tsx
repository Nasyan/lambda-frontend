"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  FIELD_DEFINITIONS,
  getUiWidgetDefinition,
  isJsonObject,
  isUiWidget,
  isJsonValue,
  parseEditableJsonValue,
  resolveFieldInputRenderer,
} from "@/src/entities/template/model/field-registry";
import {
  recordApi,
  type RecordResponse,
} from "@/src/features/records/api/record-api";
import { templateApi } from "@/src/features/templates/api/template-api";
import type {
  CascadingTreeConfig,
  ColumnMetaResponse,
  JsonObject,
  JsonValue,
  TemplateSchema,
} from "@/src/entities/template/model/types";

interface DynamicFormProps {
  schema: TemplateSchema;
  instanceUuid?: string | null;
  initialData?: JsonObject;
  onSubmit: (data: JsonObject) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

interface RelationOption {
  targetUuid: string;
  label: string;
  hint: string;
}

interface RelationLookupState {
  status: "loading" | "ready" | "error";
  options: RelationOption[];
  message?: string;
}

type RelationLookups = Record<string, RelationLookupState>;

type RelationListItem = JsonObject & {
  target_uuid: string;
};

const SYSTEM_FIELD_NAMES = new Set([
  "id",
  "_id",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
  "is_deleted",
  "instance_uuid",
  "template_uuid",
]);

const DISPLAY_FIELD_PRIORITY = [
  "name",
  "title",
  "label",
  "email",
  "phone",
  "sku",
  "code",
  "uuid",
];

const INPUT_CLASSES =
  "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50";

const getRecordId = (record: RecordResponse): string =>
  record.id ?? record._id ?? "";

const isPrimitiveDisplayValue = (
  value: JsonValue | undefined,
): value is string | number | boolean =>
  typeof value === "string" ||
  typeof value === "number" ||
  typeof value === "boolean";

const getTextInputValue = (value: JsonValue | undefined): string | number =>
  typeof value === "string" || typeof value === "number" ? value : "";

const getBooleanInputValue = (value: JsonValue | undefined): boolean =>
  value === true || value === "true";

const getDefaultValue = (meta: ColumnMetaResponse): JsonValue => {
  if (meta.default !== undefined) return meta.default;

  if (meta.type === "boolean" || meta.type === "checkbox") return false;
  if (meta.type === "relation_list") return [];
  if (meta.type === "cascading_tree") return {};
  return "";
};

const getPlaceholder = (fieldName: string, meta: ColumnMetaResponse): string => {
  if (meta.placeholder) return meta.placeholder;
  return FIELD_DEFINITIONS[meta.type].placeholder || `Введите ${fieldName}`;
};

const getRendererPlaceholder = (
  meta: ColumnMetaResponse,
  fallback: string,
): string => {
  if (meta.ui_widget && isUiWidget(meta.ui_widget)) {
    const widgetDefinition = getUiWidgetDefinition(meta.ui_widget);
    if (widgetDefinition.inputRenderer === resolveFieldInputRenderer(meta)) {
      return widgetDefinition.placeholder;
    }
  }

  return fallback;
};

const toDateTimeLocalValue = (value: JsonValue | undefined): string => {
  if (typeof value !== "string" || value === "now") return "";
  return value.slice(0, 16);
};

const getColorInputValue = (value: JsonValue | undefined): string =>
  typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)
    ? value
    : "#000000";

const getRelationItems = (
  value: JsonValue | undefined,
): RelationListItem[] => {
  if (!Array.isArray(value)) return [];

  return value.filter(isJsonObject).map((item) => {
    const targetUuid =
      typeof item.target_uuid === "string" ? item.target_uuid : "";
    const result: RelationListItem = { target_uuid: targetUuid };

    Object.entries(item).forEach(([key, itemValue]) => {
      if (key !== "target_uuid" && isJsonValue(itemValue)) {
        result[key] = itemValue;
      }
    });

    return result;
  });
};

const getEditableJsonValue = (value: JsonValue): string =>
  typeof value === "string" ? value : JSON.stringify(value);

const getRelationOptionLabel = (
  record: RecordResponse,
  targetSchema?: TemplateSchema,
): string => {
  const schemaKeys = targetSchema ? Object.keys(targetSchema) : [];
  const preferredKeys = [
    ...DISPLAY_FIELD_PRIORITY.filter((key) => key in record.data),
    ...schemaKeys.filter((key) => !DISPLAY_FIELD_PRIORITY.includes(key)),
    ...Object.keys(record.data),
  ];

  for (const key of preferredKeys) {
    const value = record.data[key];
    if (isPrimitiveDisplayValue(value) && String(value).trim()) {
      return String(value);
    }
  }

  return getRecordId(record);
};

const getRelationOptionHint = (record: RecordResponse): string => {
  const id = getRecordId(record);
  const dataPreview = Object.entries(record.data)
    .filter(([, value]) => isPrimitiveDisplayValue(value))
    .slice(0, 2)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" · ");

  return dataPreview ? `${dataPreview} · ${id}` : id;
};

const buildRelationOptions = (
  records: RecordResponse[],
  targetSchema?: TemplateSchema,
): RelationOption[] =>
  records
    .map((record) => ({
      targetUuid: getRecordId(record),
      label: getRelationOptionLabel(record, targetSchema),
      hint: getRelationOptionHint(record),
    }))
    .filter((option) => option.targetUuid);

export function DynamicForm({
  schema,
  instanceUuid,
  initialData = {},
  onSubmit,
  onCancel,
  isProcessing,
}: DynamicFormProps) {
  const [formData, setFormData] = useState<JsonObject>(initialData);
  const [previousInitialData, setPreviousInitialData] = useState(initialData);
  const [relationLookups, setRelationLookups] = useState<RelationLookups>({});

  // Сброс формы при изменении начальных данных
  if (previousInitialData !== initialData) {
    setPreviousInitialData(initialData);
    setFormData(initialData);
  }

  const relationFields = useMemo(
    () =>
      Object.entries(schema)
        .filter(
          ([, meta]) =>
            meta.type === "relation_list" && !!meta.target_template_uuid,
        )
        .map(([fieldName, meta]) => ({
          fieldName,
          targetTemplateUuid: meta.target_template_uuid ?? "",
        })),
    [schema],
  );

  useEffect(() => {
    if (!instanceUuid || relationFields.length === 0) return;
    let cancelled = false;

    const loadRelationOptions = async () => {
      if (!cancelled) {
        setRelationLookups((prev) => {
          const next = { ...prev };
          relationFields.forEach(({ fieldName }) => {
            next[fieldName] = { status: "loading", options: [] };
          });
          return next;
        });
      }

      const entries = await Promise.all(
        relationFields.map(async ({ fieldName, targetTemplateUuid }) => {
          try {
            const [targetTemplate, records] = await Promise.all([
              templateApi.getTemplate(instanceUuid, targetTemplateUuid),
              recordApi.getRecords(instanceUuid, targetTemplateUuid),
            ]);

            return [
              fieldName,
              {
                status: "ready",
                options: buildRelationOptions(records, targetTemplate.schema),
              } satisfies RelationLookupState,
            ] as const;
          } catch {
            return [
              fieldName,
              {
                status: "error",
                options: [],
                message: "Не удалось загрузить связанные записи",
              } satisfies RelationLookupState,
            ] as const;
          }
        }),
      );

      if (!cancelled) {
        const nextLookups: RelationLookups = {};
        entries.forEach(([fieldName, state]) => {
          nextLookups[fieldName] = state;
        });
        setRelationLookups(nextLookups);
      }
    };

    void Promise.resolve().then(loadRelationOptions);

    return () => {
      cancelled = true;
    };
  }, [instanceUuid, relationFields]);

  // Фильтруем системные и скрытые поля
  const formColumns = Object.keys(schema).filter((col) => {
    if (SYSTEM_FIELD_NAMES.has(col)) return false;
    if (schema[col]?.hidden) return false;
    return true;
  });

  const updateField = (fieldName: string, value: JsonValue) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateRelationItems = (fieldName: string, items: RelationListItem[]) => {
    updateField(fieldName, items);
  };

  const renderRelationListField = (
    fieldName: string,
    meta: ColumnMetaResponse,
    value: JsonValue | undefined,
  ) => {
    if (!meta.target_template_uuid) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          target_template_uuid не настроен
        </div>
      );
    }

    if (!instanceUuid) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          instance_uuid недоступен для загрузки связей
        </div>
      );
    }

    const items = getRelationItems(value);
    const lookup = relationLookups[fieldName];
    const lookupStatus = lookup?.status ?? "loading";
    const options = lookup?.options ?? [];
    const disabled = isProcessing || lookupStatus === "loading";
    const canAddItem =
      !disabled && lookupStatus === "ready" && options.length > 0;
    const emptyRelationMessage =
      lookupStatus === "loading"
        ? "Загрузка связанных записей..."
        : lookupStatus === "ready" && options.length === 0
          ? "Нет доступных связанных записей."
          : getPlaceholder(fieldName, meta);

    const updateItem = (index: number, nextItem: RelationListItem) => {
      updateRelationItems(
        fieldName,
        items.map((item, itemIndex) =>
          itemIndex === index ? nextItem : item,
        ),
      );
    };

    const addItem = () => {
      updateRelationItems(fieldName, [...items, { target_uuid: "" }]);
    };

    return (
      <div className="space-y-3">
        {items.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-sm text-gray-500">
            {emptyRelationMessage}
          </div>
        )}

        {items.map((item, index) => {
          const selectedOptionExists = options.some(
            (option) => option.targetUuid === item.target_uuid,
          );
          const metadataEntries = Object.entries(item).filter(
            ([key]) => key !== "target_uuid",
          );

          return (
            <div
              key={`${fieldName}-${index}`}
              className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
            >
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <select
                  value={item.target_uuid}
                  onChange={(event) =>
                    updateItem(index, {
                      ...item,
                      target_uuid: event.target.value,
                    })
                  }
                  disabled={disabled}
                  className={`${INPUT_CLASSES} bg-white`}
                >
                  <option value="">Выберите запись</option>
                  {item.target_uuid && !selectedOptionExists && (
                    <option value={item.target_uuid}>{item.target_uuid}</option>
                  )}
                  {options.map((option) => (
                    <option key={option.targetUuid} value={option.targetUuid}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() =>
                    updateRelationItems(
                      fieldName,
                      items.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                  disabled={isProcessing}
                  className="rounded-lg px-3 text-sm font-medium text-gray-500 hover:bg-white hover:text-red-600 disabled:opacity-50"
                >
                  Удалить
                </button>
              </div>

              {item.target_uuid && (
                <p className="text-xs text-gray-400">
                  {options.find((option) => option.targetUuid === item.target_uuid)
                    ?.hint ?? item.target_uuid}
                </p>
              )}

              <div className="space-y-2">
                {metadataEntries.map(([metadataKey, metadataValue]) => (
                  <div
                    key={metadataKey}
                    className="grid grid-cols-[112px_1fr_auto] gap-2"
                  >
                    <input
                      type="text"
                      value={metadataKey}
                      onChange={(event) => {
                        const nextKey = event.target.value.trim();
                        if (!nextKey || nextKey === "target_uuid") return;
                        const nextItem: RelationListItem = {
                          target_uuid: item.target_uuid,
                        };
                        Object.entries(item).forEach(([key, itemValue]) => {
                          if (key === "target_uuid" || key === metadataKey) {
                            return;
                          }
                          nextItem[key] = itemValue;
                        });
                        nextItem[nextKey] = metadataValue;
                        updateItem(index, nextItem);
                      }}
                      disabled={isProcessing}
                      className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      value={getEditableJsonValue(metadataValue)}
                      onChange={(event) =>
                        updateItem(index, {
                          ...item,
                          [metadataKey]: parseEditableJsonValue(
                            event.target.value,
                          ),
                        })
                      }
                      disabled={isProcessing}
                      className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const nextItem = { ...item };
                        delete nextItem[metadataKey];
                        updateItem(index, nextItem);
                      }}
                      disabled={isProcessing}
                      className="rounded-md px-2 text-sm text-gray-400 hover:bg-white hover:text-red-600 disabled:opacity-50"
                    >
                      ×
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    let fieldIndex = metadataEntries.length + 1;
                    let nextKey = `field_${fieldIndex}`;
                    while (Object.prototype.hasOwnProperty.call(item, nextKey)) {
                      fieldIndex += 1;
                      nextKey = `field_${fieldIndex}`;
                    }
                    updateItem(index, { ...item, [nextKey]: "" });
                  }}
                  disabled={isProcessing}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                >
                  + Доп. поле
                </button>
              </div>
            </div>
          );
        })}

        {lookup?.status === "error" && (
          <p className="text-xs text-red-500">{lookup.message}</p>
        )}
        <button
          type="button"
          onClick={addItem}
          disabled={!canAddItem}
          className="w-full rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Добавить связь
        </button>
      </div>
    );
  };

  const updateCascadeSelection = (
    fieldName: string,
    treeConfig: CascadingTreeConfig,
    floorName: string,
    optionValue: string,
  ) => {
    const currentValue = formData[fieldName];
    const currentSelection = isJsonObject(currentValue) ? currentValue : {};
    const nextSelection: JsonObject = {};

    let node: CascadingTreeConfig | null = treeConfig;
    while (node) {
      const selected: string =
        node.floor_name === floorName
          ? optionValue
          : typeof currentSelection[node.floor_name] === "string"
            ? String(currentSelection[node.floor_name])
            : "";

      if (!selected) break;
      nextSelection[node.floor_name] = selected;
      if (node.floor_name === floorName) {
        node = node.options[selected] ?? null;
        break;
      }
      node = node.options[selected] ?? null;
    }

    updateField(fieldName, nextSelection);
  };

  const renderCascadingTreeField = (
    fieldName: string,
    meta: ColumnMetaResponse,
    value: JsonValue | undefined,
  ) => {
    if (!meta.tree_config) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          tree_config не настроен
        </div>
      );
    }

    const treeConfig = meta.tree_config;
    const selection = isJsonObject(value) ? value : {};
    const controls: ReactNode[] = [];
    let node: CascadingTreeConfig | null = treeConfig;

    while (node) {
      const floorName: string = node.floor_name;
      const selectedValue: string =
        typeof selection[floorName] === "string"
          ? String(selection[floorName])
          : "";

      controls.push(
        <label key={floorName} className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-500">
            {floorName}
          </span>
          <select
            value={selectedValue}
            onChange={(event) =>
              updateCascadeSelection(
                fieldName,
                treeConfig,
                floorName,
                event.target.value,
              )
            }
            disabled={isProcessing}
            className={`${INPUT_CLASSES} bg-white`}
          >
            <option value="">Выберите значение</option>
            {Object.keys(node.options).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>,
      );

      node = selectedValue ? node.options[selectedValue] : null;
    }

    return <div className="space-y-3">{controls}</div>;
  };

  const renderField = (col: string, meta: ColumnMetaResponse) => {
    const value =
      formData[col] !== undefined ? formData[col] : getDefaultValue(meta);
    const placeholder = getPlaceholder(col, meta);
    const renderer = resolveFieldInputRenderer(meta);

    if (renderer === "select") {
      const options = Array.isArray(meta.options) ? meta.options : [];
      return (
        <select
          className={`${INPUT_CLASSES} bg-white`}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => updateField(col, e.target.value)}
          disabled={isProcessing}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => {
            const optionValue = String(opt);
            return (
              <option key={optionValue} value={optionValue}>
                {optionValue}
              </option>
            );
          })}
        </select>
      );
    }

    if (renderer === "checkbox") {
      return (
        <div className="flex items-center gap-3 py-2">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
            checked={getBooleanInputValue(value)}
            onChange={(e) => updateField(col, e.target.checked)}
            disabled={isProcessing}
          />
          <span className="text-sm text-gray-600">{placeholder}</span>
        </div>
      );
    }

    if (renderer === "relation_list") {
      return renderRelationListField(col, meta, value);
    }

    if (renderer === "cascading_tree") {
      return renderCascadingTreeField(col, meta, value);
    }

    if (renderer === "formula_readonly") {
      const formattedValue =
        value === undefined || value === null
          ? undefined
          : typeof value === "object"
            ? JSON.stringify(value)
            : String(value);
      return (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500">
          {formattedValue ?? placeholder}
        </div>
      );
    }

    if (renderer === "color_picker") {
      return (
        <div className="flex gap-2">
          <input
            type="color"
            value={getColorInputValue(value)}
            onChange={(e) => updateField(col, e.target.value)}
            disabled={isProcessing}
            className="h-10 w-12 rounded-lg border border-gray-300 bg-white p-1 disabled:opacity-50"
          />
          <input
            type="text"
            className={INPUT_CLASSES}
            placeholder="#000000"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => updateField(col, e.target.value)}
            disabled={isProcessing}
          />
        </div>
      );
    }

    const inputType =
      renderer === "number"
        ? "number"
        : renderer === "datetime"
          ? "datetime-local"
          : renderer === "url"
            ? "url"
            : renderer === "phone"
              ? "tel"
              : "text";

    const inputPlaceholder =
      renderer === "qr"
        ? getRendererPlaceholder(meta, "QR / barcode value")
        : renderer === "geo_point"
          ? getRendererPlaceholder(meta, "53.9006, 27.5590")
          : renderer === "file_reference" ||
              renderer === "image_reference"
            ? getRendererPlaceholder(meta, "S3 path or file URL")
            : getRendererPlaceholder(meta, placeholder);

    return (
      <div className="space-y-2">
        <input
          type={inputType}
          className={INPUT_CLASSES}
          placeholder={inputPlaceholder}
          value={
            renderer === "datetime"
              ? toDateTimeLocalValue(value)
              : getTextInputValue(value)
          }
          onChange={(e) => updateField(col, e.target.value)}
          disabled={isProcessing}
        />
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {formColumns.length === 0 ? (
        <p className="text-sm text-gray-500 py-4">
          Нет доступных полей для заполнения.
        </p>
      ) : (
        formColumns.map((col) => {
          const meta = schema[col];
          return (
            <div key={col} className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700 flex justify-between">
                <span>
                  {col}{" "}
                  {meta?.required && <span className="text-red-500">*</span>}
                </span>
              </label>
              {renderField(col, meta)}
              {meta?.description && (
                <p className="text-xs text-gray-400">{meta.description}</p>
              )}
            </div>
          );
        })
      )}

      <div className="mt-4 flex justify-end gap-3 border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={isProcessing}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {isProcessing ? "Сохранение..." : "Сохранить"}
        </button>
      </div>
    </form>
  );
}
