import type { JsonValue } from "@/src/entities/template/model/types";

export type WidgetType = "BAR" | "LINE" | "PIE" | "KPI" | "AREA";
export type AggregationFunction = "COUNT" | "SUM" | "AVG" | "MIN" | "MAX";
export type AxisXType = "categorical" | "datetime" | "numerical";
export type DateBucket =
  | "hour"
  | "hour_of_day"
  | "day"
  | "weekday"
  | "week"
  | "month"
  | "year";

export interface AxisXConfig {
  field: string;
  type: AxisXType;
  date_bucket: DateBucket | null;
}

export interface AxisYConfig {
  field: string;
  aggregation: AggregationFunction;
}

export interface ChartConfigPayload {
  axis_x: AxisXConfig;
  axis_y: AxisYConfig;
  unwind_field: string | null;
}

export interface WidgetResponse {
  id: string; // UUID
  instance_uuid: string; // UUID
  name: string;
  target_template_uuid: string; // UUID
  widget_type: WidgetType;
  ast_filter: JsonValue | null;
  chart_config: ChartConfigPayload;
}

export interface WidgetCreatePayload {
  name: string;
  target_template_uuid: string;
  widget_type: WidgetType;
  chart_config: ChartConfigPayload;
  ast_filter?: JsonValue | null;
}

export type WidgetUpdatePayload = Partial<WidgetCreatePayload>;

export interface WidgetDataPoint {
  label: string | number;
  value: number;
}
