"use client";

import { useState } from "react";
import type {
  ColumnMetaResponse,
  JsonObject,
  TemplateSchema,
} from "@/src/entities/template/model/types";

interface DynamicFormProps {
  schema: TemplateSchema;
  initialData?: JsonObject;
  onSubmit: (data: JsonObject) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export function DynamicForm({
  schema,
  initialData = {},
  onSubmit,
  onCancel,
  isProcessing,
}: DynamicFormProps) {
  const [formData, setFormData] = useState<JsonObject>(initialData);
  const [previousInitialData, setPreviousInitialData] = useState(initialData);

  // Сброс формы при изменении начальных данных
  if (previousInitialData !== initialData) {
    setPreviousInitialData(initialData);
    setFormData(initialData);
  }

  // Фильтруем системные и скрытые поля
  const formColumns = Object.keys(schema).filter((col) => {
    if (["id", "_id", "created_at", "updated_at", "is_deleted"].includes(col))
      return false;
    if (schema[col]?.hidden) return false;
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const renderField = (col: string, meta: ColumnMetaResponse) => {
    const value =
      formData[col] !== undefined ? formData[col] : meta.default || "";
    const placeholder = meta.placeholder
      ? String(meta.placeholder)
      : `Введите ${col}...`;
    const commonClasses =
      "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50";

    if (meta.ui_widget === "select" || meta.type === "select") {
      const options = Array.isArray(meta.options) ? meta.options : [];
      return (
        <select
          className={`${commonClasses} bg-white`}
          value={(value as string) || ""}
          onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
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

    if (meta.type === "boolean" || meta.type === "checkbox") {
      return (
        <div className="flex items-center gap-3 py-2">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
            checked={!!value && value !== "false"}
            onChange={(e) =>
              setFormData({ ...formData, [col]: e.target.checked })
            }
            disabled={isProcessing}
          />
          <span className="text-sm text-gray-600">{placeholder}</span>
        </div>
      );
    }

    return (
      <input
        type={meta.type === "number" ? "number" : "text"}
        className={commonClasses}
        placeholder={placeholder}
        value={String(value)}
        onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
        disabled={isProcessing}
      />
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
