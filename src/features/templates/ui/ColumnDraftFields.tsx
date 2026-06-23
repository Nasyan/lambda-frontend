import type { TemplateResponse } from "@/src/entities/template/model/types";
import {
  FIELD_TYPE_HINTS,
  IMAGE_UI_WIDGETS,
  PHONE_UI_WIDGETS,
  TEMPLATE_FIELD_TYPES,
} from "@/src/entities/template/model/field-types";
import {
  getSelectOptionsError,
  getTemplateOptions,
  type ColumnDraft,
} from "@/src/features/templates/model/column-draft";
import { FormulaAstSettings } from "@/src/features/templates/ui/FormulaAstSettings";

interface ColumnDraftFieldsProps {
  draft: ColumnDraft;
  templates: TemplateResponse[];
  onChange: (draft: ColumnDraft) => void;
  columnNameDisabled?: boolean;
}

const inputClassName =
  "rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 outline-none focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500";

const monoInputClassName =
  "rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-950 outline-none focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500";

const textareaClassName =
  "rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-xs text-gray-950 outline-none focus:border-indigo-500";

const metaPanelClassName =
  "grid gap-3 rounded-md border border-gray-200 bg-white p-3";

const defaultToggleClassName =
  "flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500";

const updateSelectOption = (
  draft: ColumnDraft,
  index: number,
  value: string,
): ColumnDraft => ({
  ...draft,
  selectOptions: draft.selectOptions.map((option, optionIndex) =>
    optionIndex === index ? value : option,
  ),
});

const removeSelectOption = (draft: ColumnDraft, index: number): ColumnDraft => ({
  ...draft,
  selectOptions:
    draft.selectOptions.length === 1
      ? draft.selectOptions
      : draft.selectOptions.filter((_, optionIndex) => optionIndex !== index),
});

function DefaultToggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <label className={defaultToggleClassName}>
      <input
        type="checkbox"
        checked={enabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      default
    </label>
  );
}

export function ColumnDraftFields({
  draft,
  templates,
  onChange,
  columnNameDisabled,
}: ColumnDraftFieldsProps) {
  const templateOptions = getTemplateOptions(templates);
  const relationListId = `relation-target-template-${draft.id}`;
  const selectOptionsError =
    draft.type === "select" ? getSelectOptionsError(draft.selectOptions) : null;

  const updateDraft = <Key extends keyof ColumnDraft>(
    key: Key,
    value: ColumnDraft[Key],
  ) => {
    onChange({ ...draft, [key]: value });
  };

  const renderDefaultTextInput = (
    key:
      | "stringDefault"
      | "selectDefault"
      | "imageDefault"
      | "datetimeDefault"
      | "urlDefault"
      | "phoneDefault",
    label: string,
    inputType = "text",
    placeholder = "",
  ) => (
    <div className="grid gap-1 text-sm font-medium text-gray-700">
      <span>{label}</span>
      <div className="grid gap-2 md:grid-cols-[120px_minmax(0,1fr)]">
        <DefaultToggle
          enabled={draft.defaultEnabled}
          onChange={(enabled) => updateDraft("defaultEnabled", enabled)}
        />
        <input
          type={inputType}
          className={inputClassName}
          value={draft[key]}
          placeholder={placeholder}
          disabled={!draft.defaultEnabled}
          onChange={(event) => updateDraft(key, event.target.value)}
        />
      </div>
    </div>
  );

  const renderBooleanDefault = () => (
    <div className="grid gap-1 text-sm font-medium text-gray-700">
      <span>default</span>
      <div className="grid gap-2 md:grid-cols-[120px_minmax(0,1fr)]">
        <DefaultToggle
          enabled={draft.defaultEnabled}
          onChange={(enabled) => updateDraft("defaultEnabled", enabled)}
        />
        <select
          className={inputClassName}
          value={draft.booleanDefault}
          disabled={!draft.defaultEnabled}
          onChange={(event) =>
            updateDraft(
              "booleanDefault",
              event.target.value === "true" ? "true" : "false",
            )
          }
        >
          <option value="false">false</option>
          <option value="true">true</option>
        </select>
      </div>
    </div>
  );

  const renderTypeSettings = () => {
    if (draft.type === "string") {
      return (
        <div className={metaPanelClassName}>
          <p className="text-xs text-gray-500">{FIELD_TYPE_HINTS.string}</p>
          {renderDefaultTextInput("stringDefault", "default", "text", "Lead")}
        </div>
      );
    }

    if (draft.type === "number") {
      return (
        <div className={metaPanelClassName}>
          <p className="text-xs text-gray-500">{FIELD_TYPE_HINTS.number}</p>
          <div className="grid gap-1 text-sm font-medium text-gray-700">
            <span>default</span>
            <div className="grid gap-2 md:grid-cols-[120px_minmax(0,1fr)]">
              <DefaultToggle
                enabled={draft.defaultEnabled}
                onChange={(enabled) => updateDraft("defaultEnabled", enabled)}
              />
              <input
                type="number"
                className={inputClassName}
                value={draft.numberDefault}
                disabled={!draft.defaultEnabled}
                onChange={(event) =>
                  updateDraft("numberDefault", event.target.value)
                }
              />
            </div>
          </div>
        </div>
      );
    }

    if (draft.type === "boolean") {
      return (
        <div className={metaPanelClassName}>
          <p className="text-xs text-gray-500">{FIELD_TYPE_HINTS.boolean}</p>
          {renderBooleanDefault()}
        </div>
      );
    }

    if (draft.type === "checkbox") {
      return (
        <div className={metaPanelClassName}>
          <p className="text-xs text-gray-500">{FIELD_TYPE_HINTS.checkbox}</p>
          {renderBooleanDefault()}
        </div>
      );
    }

    if (draft.type === "select") {
      return (
        <div className={metaPanelClassName}>
          <div>
            <p className="text-xs text-gray-500">{FIELD_TYPE_HINTS.select}</p>
            {selectOptionsError && (
              <p className="mt-1 text-xs text-red-600" aria-live="polite">
                {selectOptionsError}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            {draft.selectOptions.map((option, index) => (
              <div
                key={`${draft.id}-select-option-${index}`}
                className="grid gap-2 md:grid-cols-[minmax(0,1fr)_88px]"
              >
                <input
                  type="text"
                  className={inputClassName}
                  value={option}
                  placeholder={`option ${index + 1}`}
                  onChange={(event) =>
                    onChange(updateSelectOption(draft, index, event.target.value))
                  }
                  required
                />
                <button
                  type="button"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => onChange(removeSelectOption(draft, index))}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="w-fit rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              onClick={() =>
                updateDraft("selectOptions", [...draft.selectOptions, ""])
              }
            >
              Add option
            </button>
          </div>
          {renderDefaultTextInput("selectDefault", "default", "text", "Option A")}
        </div>
      );
    }

    if (draft.type === "image") {
      return (
        <div className={metaPanelClassName}>
          <p className="text-xs text-gray-500">{FIELD_TYPE_HINTS.image}</p>
          <div className="grid gap-3 md:grid-cols-2">
            {renderDefaultTextInput("imageDefault", "default", "text", "images/a.png")}
            <label className="grid gap-1 text-sm font-medium text-gray-700">
              ui_widget
              <select
                className={inputClassName}
                value={draft.imageUiWidget}
                onChange={(event) =>
                  updateDraft(
                    "imageUiWidget",
                    event.target.value === "camera_capture"
                      ? "camera_capture"
                      : event.target.value === "file_upload"
                        ? "file_upload"
                        : "",
                  )
                }
              >
                <option value="">none</option>
                {IMAGE_UI_WIDGETS.map((widget) => (
                  <option key={widget.value} value={widget.value}>
                    {widget.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      );
    }

    if (draft.type === "formula") {
      return (
        <div className={metaPanelClassName}>
          <p className="text-xs text-gray-500">{FIELD_TYPE_HINTS.formula}</p>
          <FormulaAstSettings
            value={draft.astJson}
            onChange={(value) => updateDraft("astJson", value)}
          />
        </div>
      );
    }

    if (draft.type === "datetime") {
      return (
        <div className={metaPanelClassName}>
          <p className="text-xs text-gray-500">{FIELD_TYPE_HINTS.datetime}</p>
          {renderDefaultTextInput(
            "datetimeDefault",
            "default",
            "text",
            "now or 2026-06-23T12:00:00Z",
          )}
        </div>
      );
    }

    if (draft.type === "url") {
      return (
        <div className={metaPanelClassName}>
          <p className="text-xs text-gray-500">{FIELD_TYPE_HINTS.url}</p>
          {renderDefaultTextInput(
            "urlDefault",
            "default",
            "url",
            "https://example.com",
          )}
        </div>
      );
    }

    if (draft.type === "phone") {
      return (
        <div className={metaPanelClassName}>
          <p className="text-xs text-gray-500">{FIELD_TYPE_HINTS.phone}</p>
          <div className="grid gap-3 md:grid-cols-2">
            {renderDefaultTextInput("phoneDefault", "default", "tel", "+375291234567")}
            <label className="grid gap-1 text-sm font-medium text-gray-700">
              ui_widget
              <select
                className={inputClassName}
                value={draft.phoneUiWidget}
                onChange={(event) =>
                  updateDraft(
                    "phoneUiWidget",
                    event.target.value === "phone_mask" ? "phone_mask" : "",
                  )
                }
              >
                <option value="">none</option>
                {PHONE_UI_WIDGETS.map((widget) => (
                  <option key={widget.value} value={widget.value}>
                    {widget.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      );
    }

    if (draft.type === "relation_list") {
      return (
        <div className={metaPanelClassName}>
          <p className="text-xs text-gray-500">{FIELD_TYPE_HINTS.relation_list}</p>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            target_template_uuid
            <input
              type="text"
              list={relationListId}
              className={monoInputClassName}
              value={draft.relationTargetTemplateUuid}
              placeholder="target template uuid"
              onChange={(event) =>
                updateDraft("relationTargetTemplateUuid", event.target.value)
              }
              required
            />
            <datalist id={relationListId}>
              {templateOptions.map((template) => (
                <option key={template.value} value={template.value}>
                  {template.label}
                </option>
              ))}
            </datalist>
          </label>
        </div>
      );
    }

    return (
      <div className={metaPanelClassName}>
        <p className="text-xs text-gray-500">{FIELD_TYPE_HINTS.cascading_tree}</p>
        <label className="grid gap-1 text-sm font-medium text-gray-700">
          tree_config
          <textarea
            rows={7}
            className={textareaClassName}
            value={draft.treeConfigJson}
            placeholder='{"floor_name":"Type","type":"fixed","options":{"Ring":null}}'
            onChange={(event) => updateDraft("treeConfigJson", event.target.value)}
            required
          />
        </label>
      </div>
    );
  };

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_120px]">
        <input
          type="text"
          placeholder="column_name"
          className={monoInputClassName}
          value={draft.columnName}
          disabled={columnNameDisabled}
          onChange={(event) => updateDraft("columnName", event.target.value)}
          required={!columnNameDisabled}
        />
        <select
          className={inputClassName}
          value={draft.type}
          onChange={(event) =>
            updateDraft("type", event.target.value as ColumnDraft["type"])
          }
        >
          {TEMPLATE_FIELD_TYPES.map((fieldType) => (
            <option key={fieldType} value={fieldType}>
              {fieldType}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800">
          <input
            type="checkbox"
            checked={draft.required}
            onChange={(event) => updateDraft("required", event.target.checked)}
          />
          Required
        </label>
      </div>

      {renderTypeSettings()}

      <label className="grid gap-1 text-sm font-medium text-gray-700">
        Extra meta JSON
        <textarea
          rows={4}
          placeholder='{"triggers":[{"trigger_id":"..."}],"description":"..."}'
          className={textareaClassName}
          value={draft.extraMetaJson}
          onChange={(event) => updateDraft("extraMetaJson", event.target.value)}
        />
      </label>
    </div>
  );
}
