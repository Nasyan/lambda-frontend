import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { triggerApi } from "@/src/features/triggers/api/trigger-api";
import {
  getAccessToken,
  getInstanceUuidFromAccessToken,
} from "@/src/shared/lib/session";
import type {
  TriggerResponse,
  EventType,
} from "@/src/entities/trigger/model/types";
import { EMPTY_DRAFT } from "./constants";

export function useTriggers() {
  const router = useRouter();
  const [instanceUuid, setInstanceUuid] = useState<string | null>(null);

  const [triggers, setTriggers] = useState<TriggerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  // Вычисляемые флаги для адаптивного интерфейса
  const isAutomation = draft.trigger_type === "AUTOMATION";
  const isStoredColumn = draft.trigger_type === "STORED_COLUMN";
  const isCronEvent = isAutomation && draft.event_type === "CRON";

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }
    const uuid = getInstanceUuidFromAccessToken();
    if (!uuid) {
      setError("В access token отсутствует текущий instance_uuid");
      setLoading(false);
      return;
    }
    setInstanceUuid(uuid);
  }, [router]);

  const loadTriggers = useCallback(async () => {
    if (!instanceUuid) return;
    setLoading(true);
    try {
      const data = await triggerApi.getTriggers(instanceUuid);
      setTriggers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [instanceUuid]);

  useEffect(() => {
    loadTriggers();
  }, [loadTriggers]);

  const parseJsonStr = (str: string, fieldName: string) => {
    const trimmed = str.trim();
    if (!trimmed || trimmed === "null") return null;
    try {
      return JSON.parse(trimmed);
    } catch (e) {
      throw new Error(`Ошибка валидации JSON в поле "${fieldName}"`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instanceUuid) return;

    setError(null);
    setMessage(null);
    setSaving(true);

    try {
      const payload: any = {
        name: draft.name.trim(),
        trigger_type: draft.trigger_type,
        payload_return_type: draft.payload_return_type,
        source_template_uuid: draft.source_template_uuid.trim(),

        condition_ast: parseJsonStr(draft.conditionAstJson, "Condition AST"),
        payload_ast: parseJsonStr(draft.payloadAstJson, "Payload AST") || {},

        target_field: isStoredColumn ? draft.target_field.trim() || null : null,

        event_type: isAutomation ? draft.event_type || null : null,
        cron_expression: isCronEvent
          ? draft.cron_expression.trim() || null
          : null,
        action_name: isAutomation ? draft.action_name.trim() || null : null,
        target_template_uuid: isAutomation
          ? draft.target_template_uuid.trim() || null
          : null,
        action_params: isAutomation
          ? parseJsonStr(draft.actionParamsJson, "Action Params")
          : null,
        action_mapping_ast: isAutomation
          ? parseJsonStr(draft.actionMappingAstJson, "Action Mapping AST")
          : null,
      };

      if (!payload.source_template_uuid) {
        throw new Error("Поле source_template_uuid является обязательным");
      }

      if (editingId) {
        await triggerApi.updateTrigger(instanceUuid, editingId, payload);
        setMessage("Триггер успешно изменен");
      } else {
        await triggerApi.createTrigger(instanceUuid, payload);
        setMessage("Триггер успешно добавлен в БД");
      }

      setDraft(EMPTY_DRAFT);
      setEditingId(null);
      await loadTriggers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!instanceUuid || !window.confirm("Удалить этот триггер?")) return;
    try {
      await triggerApi.deleteTrigger(instanceUuid, id);
      if (editingId === id) cancelEdit();
      setMessage("Триггер удален");
      await loadTriggers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleExecute = async (id: string) => {
    if (!instanceUuid) return;
    setError(null);
    setMessage(null);
    try {
      const res = await triggerApi.executeTrigger(instanceUuid, id);
      setMessage(res.message || "Действие автоматизации исполнено успешно!");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openEdit = (trigger: TriggerResponse) => {
    setEditingId(trigger.id);
    setDraft({
      name: trigger.name,
      target_field: trigger.target_field || "",
      trigger_type: trigger.trigger_type,
      payload_return_type: trigger.payload_return_type,
      event_type: trigger.event_type || ("ON_RECORD_CREATE" as EventType),
      cron_expression: trigger.cron_expression || "",
      action_name: trigger.action_name || "",
      source_template_uuid: trigger.source_template_uuid,
      target_template_uuid: trigger.target_template_uuid || "",
      conditionAstJson: trigger.condition_ast
        ? JSON.stringify(trigger.condition_ast, null, 2)
        : "null",
      payloadAstJson: trigger.payload_ast
        ? JSON.stringify(trigger.payload_ast, null, 2)
        : "{}",
      actionParamsJson: trigger.action_params
        ? JSON.stringify(trigger.action_params, null, 2)
        : "null",
      actionMappingAstJson: trigger.action_mapping_ast
        ? JSON.stringify(trigger.action_mapping_ast, null, 2)
        : "null",
    });
    setError(null);
    setMessage(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setError(null);
  };

  return {
    // Состояния
    triggers,
    loading,
    saving,
    error,
    message,
    editingId,
    draft,
    setDraft,

    // Флаги
    isAutomation,
    isStoredColumn,
    isCronEvent,

    // Действия
    handleSave,
    handleDelete,
    handleExecute,
    openEdit,
    cancelEdit,
  };
}
