import { useState } from "react";
import { analyticsApi } from "@/src/features/analytics/api/analytics-api";
import type { WidgetDataPoint } from "@/src/entities/analytics/model/types";

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Неизвестная ошибка";

export function useChartData(
  instanceUuid: string | null,
  setGlobalError: (err: string | null) => void,
) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateField, setDateField] = useState("");

  const [activeWidgetData, setActiveWidgetData] = useState<
    WidgetDataPoint[] | null
  >(null);
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null); // <-- Добавили локальный стейт ошибки

  const fetchChartData = async (
    widgetId: string,
    filtersOverride?: {
      date_from?: string;
      date_to?: string;
      date_field?: string;
    },
  ) => {
    if (!instanceUuid) return;
    setLoadingData(true);
    setActiveWidgetId(widgetId);
    setError(null);
    setGlobalError(null); // Сбрасываем ошибку CRUD на всякий случай
    try {
      const points = await analyticsApi.getWidgetData(instanceUuid, widgetId, {
        date_from:
          filtersOverride?.date_from !== undefined
            ? filtersOverride.date_from
            : dateFrom || undefined,
        date_to:
          filtersOverride?.date_to !== undefined
            ? filtersOverride.date_to
            : dateTo || undefined,
        date_field:
          filtersOverride?.date_field !== undefined
            ? filtersOverride.date_field
            : dateField || undefined,
      });
      setActiveWidgetData(points);
    } catch (err) {
      setError(`Ошибка расчета данных: ${getErrorMessage(err)}`);
      setActiveWidgetData(null);
    } finally {
      setLoadingData(false);
    }
  };

  const handleApplyFilters = (filters: {
    date_from?: string;
    date_to?: string;
    date_field?: string;
  }) => {
    setDateFrom(filters.date_from || "");
    setDateTo(filters.date_to || "");
    setDateField(filters.date_field || "");

    if (activeWidgetId) {
      fetchChartData(activeWidgetId, filters);
    }
  };

  const handleExportCsv = () => {
    if (!instanceUuid || !activeWidgetId) return;
    const url = analyticsApi.getExportCsvUrl(instanceUuid, activeWidgetId, {
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      date_field: dateField || undefined,
    });
    window.open(url, "_blank");
  };

  const resetActiveWidgetData = () => setActiveWidgetData(null);

  return {
    activeWidgetData,
    activeWidgetId,
    loadingData,
    error, // <-- Теперь возвращается наружу
    setError, // <-- Теперь возвращается наружу
    handleApplyFilters,
    fetchChartData,
    handleExportCsv,
    resetActiveWidgetData,
  };
}
