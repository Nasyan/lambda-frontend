"use client";

import { useState } from "react";
import {
  FIELD_DEFINITIONS,
  UI_WIDGET_DEFINITIONS,
  createDefaultCascadingTreeConfig,
  getAllowedWidgetsForType,
  getFieldDefinition,
} from "@/src/entities/template/model/field-registry";
import type {
  CascadingTreeConfig,
  CascadingTreeNodeType,
  TemplateResponse,
  UiWidget,
} from "@/src/entities/template/model/types";
import type { TemplateEditorColumn } from "../model/column-editor";

interface ColumnConfigPanelProps {
  column: TemplateEditorColumn;
  templates: TemplateResponse[];
  onChange: (fields: Partial<TemplateEditorColumn>) => void;
  onClose: () => void;
}

interface TreeNodeEditorProps {
  node: CascadingTreeConfig;
  depth?: number;
  onChange: (node: CascadingTreeConfig) => void;
}

const createChildNode = (depth: number): CascadingTreeConfig => ({
  floor_name: `Level ${depth + 1}`,
  type: "fixed",
  options: {
    "Option 1": null,
  },
});

const getUniqueOptionName = (
  options: Record<string, CascadingTreeConfig | null>,
): string => {
  let index = Object.keys(options).length + 1;
  let candidate = `Option ${index}`;

  while (Object.prototype.hasOwnProperty.call(options, candidate)) {
    index += 1;
    candidate = `Option ${index}`;
  }

  return candidate;
};

function TreeNodeEditor({
  node,
  depth = 0,
  onChange,
}: TreeNodeEditorProps) {
  const optionEntries = Object.entries(node.options);

  const updateOptionKey = (previousKey: string, nextKey: string) => {
    const nextOptions: Record<string, CascadingTreeConfig | null> = {};

    optionEntries.forEach(([optionKey, childNode]) => {
      nextOptions[optionKey === previousKey ? nextKey : optionKey] = childNode;
    });

    onChange({ ...node, options: nextOptions });
  };

  const updateOptionChild = (
    optionKey: string,
    childNode: CascadingTreeConfig | null,
  ) => {
    onChange({
      ...node,
      options: {
        ...node.options,
        [optionKey]: childNode,
      },
    });
  };

  const removeOption = (optionKey: string) => {
    const nextOptions = { ...node.options };
    delete nextOptions[optionKey];
    onChange({ ...node, options: nextOptions });
  };

  const addOption = () => {
    const optionName = getUniqueOptionName(node.options);
    onChange({
      ...node,
      options: {
        ...node.options,
        [optionName]: null,
      },
    });
  };

  return (
    <div className="space-y-3 rounded-md border border-gray-200 bg-white p-3">
      <div className="grid grid-cols-[1fr_112px] gap-2">
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Level name
          <input
            type="text"
            value={node.floor_name}
            onChange={(event) =>
              onChange({ ...node, floor_name: event.target.value })
            }
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm font-normal normal-case tracking-normal text-gray-900 outline-none focus:border-indigo-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Type
          <select
            value={node.type ?? "fixed"}
            onChange={(event) =>
              onChange({
                ...node,
                type: event.target.value as CascadingTreeNodeType,
              })
            }
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm font-normal normal-case tracking-normal text-gray-900 outline-none focus:border-indigo-500"
          >
            <option value="fixed">fixed</option>
            <option value="adaptive">adaptive</option>
          </select>
        </label>
      </div>

      <div className="space-y-2">
        {optionEntries.map(([optionKey, childNode]) => (
          <div key={optionKey} className="space-y-2 rounded-md bg-gray-50 p-2">
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
              <input
                type="text"
                value={optionKey}
                onChange={(event) =>
                  updateOptionKey(optionKey, event.target.value)
                }
                className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 outline-none focus:border-indigo-500"
              />
              <label className="flex items-center gap-1 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={childNode !== null}
                  onChange={(event) =>
                    updateOptionChild(
                      optionKey,
                      event.target.checked
                        ? createChildNode(depth + 1)
                        : null,
                    )
                  }
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Child
              </label>
              <button
                type="button"
                onClick={() => removeOption(optionKey)}
                className="rounded-md px-2 py-1 text-sm text-gray-400 hover:bg-white hover:text-red-600"
                aria-label={`Remove option ${optionKey}`}
              >
                ×
              </button>
            </div>

            {childNode !== null && (
              <div className="pl-3">
                <TreeNodeEditor
                  node={childNode}
                  depth={depth + 1}
                  onChange={(nextChild) =>
                    updateOptionChild(optionKey, nextChild)
                  }
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addOption}
        className="w-full rounded-md border border-dashed border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Add option
      </button>
    </div>
  );
}

const getWidgetLabel = (widget: UiWidget): string =>
  UI_WIDGET_DEFINITIONS.find((item) => item.value === widget)?.label ?? widget;

const getTemplateFieldNames = (template: TemplateResponse | undefined) =>
  template ? Object.keys(template.schema) : [];

export function ColumnConfigPanel({
  column,
  templates,
  onChange,
  onClose,
}: ColumnConfigPanelProps) {
  const [newOptionText, setNewOptionText] = useState("");
  const definition = getFieldDefinition(column.type);
  const allowedWidgets = getAllowedWidgetsForType(column.type);
  const widgetOptions = column.uiWidget
    ? Array.from(new Set([...allowedWidgets, column.uiWidget]))
    : allowedWidgets;
  const targetTemplate = templates.find(
    (template) => template.id === column.targetTemplateUuid,
  );
  const targetTemplateFields = getTemplateFieldNames(targetTemplate);

  const addSelectOption = () => {
    const option = newOptionText.trim();
    if (!option) return;
    if (!column.options.includes(option)) {
      onChange({ options: [...column.options, option] });
    }
    setNewOptionText("");
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 shadow-xl flex flex-col z-20 transition-transform duration-300">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <div>
          <h3 className="font-semibold text-gray-900">Настройки поля</h3>
          <p className="text-xs font-mono text-indigo-600 mt-1">
            {column.dbName} ({column.type})
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Закрыть настройки поля"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="p-6 flex-1 overflow-y-auto space-y-6">
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
            UI widget
          </label>
          <select
            value={column.uiWidget}
            onChange={(event) =>
              onChange({ uiWidget: event.target.value as UiWidget | "" })
            }
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500"
          >
            <option value="">Без виджета</option>
            {widgetOptions.map((widget) => (
              <option key={widget} value={widget}>
                {getWidgetLabel(widget)}
              </option>
            ))}
          </select>
          {widgetOptions.length === 0 && (
            <p className="text-xs text-gray-400">
              Для этого типа нет отдельного UI widget.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
            Description
          </label>
          <textarea
            value={column.description}
            onChange={(event) => onChange({ description: event.target.value })}
            placeholder="Короткая подсказка для ввода записи"
            className="h-20 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500"
          />
        </div>

        {definition.configPanel === "select_options" && (
          <div className="space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Options
            </label>
            <div className="space-y-2">
              {column.options.map((option, index) => (
                <div
                  key={`${option}-${index}`}
                  className="flex items-center justify-between bg-gray-50 px-3 py-1.5 rounded border border-gray-200 text-sm"
                >
                  <span className="text-gray-800">{option}</span>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        options: column.options.filter(
                          (_, optionIndex) => optionIndex !== index,
                        ),
                      })
                    }
                    className="text-gray-400 hover:text-red-500"
                    aria-label={`Remove option ${option}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newOptionText}
                onChange={(event) => setNewOptionText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addSelectOption();
                  }
                }}
                placeholder="Новый вариант"
                className="flex-1 text-sm border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={addSelectOption}
                className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded font-medium hover:bg-gray-800"
              >
                +
              </button>
            </div>
          </div>
        )}

        {definition.configPanel === "formula_ast" && (
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Formula AST
            </label>
            <textarea
              value={column.astText}
              onChange={(event) => onChange({ astText: event.target.value })}
              className="h-56 w-full rounded-md border border-gray-300 p-2 font-mono text-xs text-gray-900 outline-none focus:border-indigo-500"
              spellCheck={false}
            />
          </div>
        )}

        {definition.configPanel === "relation_list" && (
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Target template
            </label>
            <select
              value={column.targetTemplateUuid}
              onChange={(event) =>
                onChange({ targetTemplateUuid: event.target.value })
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500"
            >
              <option value="">Выберите таблицу</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={column.targetTemplateUuid}
              onChange={(event) =>
                onChange({ targetTemplateUuid: event.target.value })
              }
              placeholder="UUID целевой таблицы"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500"
            />
            {targetTemplateFields.length > 0 && (
              <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Target fields
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {targetTemplateFields.map((fieldName) => (
                    <span
                      key={fieldName}
                      className="rounded bg-white px-2 py-1 font-mono text-xs text-gray-600 ring-1 ring-gray-200"
                    >
                      {fieldName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {definition.configPanel === "cascading_tree" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Tree config
              </label>
              <button
                type="button"
                onClick={() =>
                  onChange({ treeConfig: createDefaultCascadingTreeConfig() })
                }
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                Reset
              </button>
            </div>
            <TreeNodeEditor
              node={column.treeConfig}
              onChange={(treeConfig) => onChange({ treeConfig })}
            />
          </div>
        )}

        {definition.configPanel === "none" && (
          <div className="text-center py-8 text-gray-400 text-sm">
            Для типа поля{" "}
            <span className="font-mono text-gray-600">
              &quot;{FIELD_DEFINITIONS[column.type].type}&quot;
            </span>{" "}
            дополнительные параметры конфигурации не требуются.
          </div>
        )}
      </div>
    </div>
  );
}
