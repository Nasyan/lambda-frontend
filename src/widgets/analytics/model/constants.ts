import type {
  WidgetType,
  AxisXType,
  AggregationFunction,
  DateBucket,
} from "@/src/entities/analytics/model/types";

export const EMPTY_WIDGET_DRAFT = {
  name: "",
  target_template_uuid: "",
  widget_type: "BAR" as WidgetType,
  axis_x_field: "created_at",
  axis_x_type: "datetime" as AxisXType,
  axis_x_bucket: "month" as DateBucket,
  axis_y_field: "_id",
  axis_y_aggregation: "COUNT" as AggregationFunction,
  unwind_field: "",
  astFilterJson: "null",
};

export type WidgetDraft = typeof EMPTY_WIDGET_DRAFT;
