import React, { useState } from "react";
// Импортируем тип конфигурации графика, который используется в AnalyticsWorkspace
import type { WidgetResponse } from "@/src/entities/analytics/model/types";

// Описываем интерфейс пропсов для компонента
interface FilterToolbarProps {
  currentConfig: WidgetResponse["chart_config"] | undefined;
  onApplyFilters: (filters: {
    date_from?: string;
    date_to?: string;
    date_field?: string;
  }) => void;
  onExportCsv: () => void;
}

export function FilterToolbar({
  currentConfig,
  onApplyFilters,
  onExportCsv,
}: FilterToolbarProps) {
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [dateField, setDateField] = useState<string>("purchased_at"); // Дефолтное поле для категориальных осей

  // Проверяем, нужна ли явная передача date_field (если ось X не datetime)
  const isCategorical = currentConfig?.axis_x?.type === "categorical";

  const handleApply = () => {
    onApplyFilters({
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      date_field: isCategorical ? dateField : undefined,
    });
  };

  return (
    <div className="flex flex-wrap items-end gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm mb-6">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Период с</label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="border border-gray-300 rounded-lg p-2 text-sm focus:outline-blue-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">По</label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="border border-gray-300 rounded-lg p-2 text-sm focus:outline-blue-500"
        />
      </div>

      {isCategorical && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">
            Поле даты для фильтра
          </label>
          <select
            value={dateField}
            onChange={(e) => setDateField(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 text-sm bg-white focus:outline-blue-500"
          >
            <option value="purchased_at">purchased_at</option>
            <option value="created_at">created_at</option>
            <option value="updated_at">updated_at</option>
          </select>
        </div>
      )}

      <button
        type="button"
        onClick={handleApply}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
      >
        Применить
      </button>

      <button
        type="button"
        onClick={onExportCsv}
        className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors ml-auto flex items-center gap-2"
      >
        <span>Выгрузить CSV</span>
      </button>
    </div>
  );
}
