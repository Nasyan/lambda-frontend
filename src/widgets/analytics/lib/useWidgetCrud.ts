import { useState, useCallback, useEffect } from "react";
import { analyticsApi } from "@/src/features/analytics/api/analytics-api";
import { EMPTY_WIDGET_DRAFT, WidgetDraft } from "../model/constants";
import type {
  WidgetCreatePayload,
  WidgetResponse,
} from "@/src/entities/analytics/model/types";
import type { JsonValue } from "@/src/entities/template/model/types";

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Неизвестная ошибка";

export function useWidgetCrud(instanceUuid: string | null) {
  const [widgets, setWidgets] = useState<WidgetResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<WidgetDraft>(EMPTY_WIDGET_DRAFT);

  const loadWidgets = useCallback(async () => {
    if (!instanceUuid) return;
    setLoading(true);
    try {
      const data = await analyticsApi.getWidgets(instanceUuid);
      setWidgets(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [instanceUuid]);

  useEffect(() => {
    if (!instanceUuid) return;
    void Promise.resolve().then(loadWidgets);
  }, [instanceUuid, loadWidgets]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instanceUuid) return;

    setError(null);
    setMessage(null);
    setSaving(true);

    try {
      let parsedAst: JsonValue | null = null;
      const trimmedAst = draft.astFilterJson.trim();
      if (trimmedAst && trimmedAst !== "null") {
        try {
          parsedAst = JSON.parse(trimmedAst) as JsonValue;
        } catch {
          throw new Error("Невалидный синтаксис JSON в поле AST Filter");
        }
      }

      if (!draft.target_template_uuid.trim()) {
        throw new Error(
          "Необходимо указать целевой UUID шаблона документов Mongo",
        );
      }

      const payload: WidgetCreatePayload = {
        name: draft.name.trim(),
        target_template_uuid: draft.target_template_uuid.trim(),
        widget_type: draft.widget_type,
        ast_filter: parsedAst,
        chart_config: {
          axis_x: {
            field: draft.axis_x_field.trim(),
            type: draft.axis_x_type,
            date_bucket:
              draft.axis_x_type === "datetime" ? draft.axis_x_bucket : null,
          },
          axis_y: {
            field: draft.axis_y_field.trim(),
            aggregation: draft.axis_y_aggregation,
          },
          unwind_field: draft.unwind_field.trim() || null,
        },
      };

      if (editingId) {
        await analyticsApi.updateWidget(instanceUuid, editingId, payload);
        setMessage("Спецификация виджета успешно обновлена");
      } else {
        await analyticsApi.createWidget(instanceUuid, payload);
        setMessage("Новый виджет сохранен в PostgreSQL");
      }

      setDraft(EMPTY_WIDGET_DRAFT);
      setEditingId(null);
      await loadWidgets();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (
    id: string,
    activeWidgetId: string | null,
    onWidgetDeleted: () => void,
  ) => {
    if (!instanceUuid || !confirm("Удалить этот виджет аналитики?")) return;
    try {
      await analyticsApi.deleteWidget(instanceUuid, id);
      if (editingId === id) setEditingId(null);
      if (activeWidgetId === id) onWidgetDeleted();
      setMessage("Виджет удален");
      await loadWidgets();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const openEdit = (w: WidgetResponse) => {
    setEditingId(w.id);
    setDraft({
      name: w.name,
      target_template_uuid: w.target_template_uuid,
      widget_type: w.widget_type,
      axis_x_field: w.chart_config.axis_x.field,
      axis_x_type: w.chart_config.axis_x.type,
      axis_x_bucket: w.chart_config.axis_x.date_bucket || "month",
      axis_y_field: w.chart_config.axis_y.field,
      axis_y_aggregation: w.chart_config.axis_y.aggregation,
      unwind_field: w.chart_config.unwind_field || "",
      astFilterJson: w.ast_filter
        ? JSON.stringify(w.ast_filter, null, 2)
        : "null",
    });
  };

  return {
    widgets,
    loading,
    saving,
    error,
    setError,
    message,
    setMessage,
    editingId,
    setEditingId,
    draft,
    setDraft,
    handleSave,
    handleDelete,
    openEdit,
    loadWidgets, // <-- Добавь эту строчку сюда
  };
}
