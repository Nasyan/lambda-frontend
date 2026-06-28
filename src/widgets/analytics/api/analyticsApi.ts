export type WidgetType = "BAR" | "PIE" | "LINE";
export type DateBucketType = "hour" | "hour_of_day" | "weekday" | "day";
export type AxisType = "categorical" | "datetime" | "numeric";

export interface ChartConfigPayload {
  axis_x: {
    field: string;
    type: AxisType;
    date_bucket?: DateBucketType;
  };
  axis_y: {
    field: string;
    aggregation: "SUM" | "COUNT" | "AVG" | "MIN" | "MAX";
  };
  unwind_field?: string | null;
}

export interface Widget {
  id: string;
  name: string;
  target_template_uuid: string;
  widget_type: WidgetType;
  chart_config: ChartConfigPayload;
}

export interface AnalyticsDataPoint {
  label: string; // "2026-06-01", "10", "еда" и т.д.
  value: number;
}

export interface FetchDataParams {
  date_from?: string;
  date_to?: string;
  date_field?: string;
}

// Функции запросов к бэкенду
export const analyticsApi = {
  // Получение данных для графика
  async getWidgetData(
    instanceId: string,
    widgetId: string,
    params: FetchDataParams,
  ): Promise<AnalyticsDataPoint[]> {
    const query = new URLSearchParams(
      params as Record<string, string>,
    ).toString();
    const response = await fetch(
      `/api/instances/${instanceId}/widgets/${widgetId}/data?${query}`,
    );
    if (!response.ok) throw new Error("Ошибка загрузки данных виджета");
    return response.json();
  },

  // Скачивание CSV
  async exportToCsv(
    instanceId: string,
    widgetId: string,
    params: FetchDataParams,
    widgetName: string,
  ): Promise<void> {
    const query = new URLSearchParams(
      params as Record<string, string>,
    ).toString();
    const url = `/api/instances/${instanceId}/widgets/${widgetId}/export-csv?${query}`;

    // Создаем невидимую ссылку для триггера скачивания файла
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${widgetName || "export"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
