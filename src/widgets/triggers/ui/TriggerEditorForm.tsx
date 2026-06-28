"use client";

import React from "react";
import Link from "next/link";
import {
  EventType,
  PayloadReturnType,
  TriggerType,
} from "@/src/entities/trigger/model/types";

interface TriggerEditorFormProps {
  draft: any;
  updateDraft: (update: any) => void;
  checkField: (fieldName: string) => { visible: boolean; required: boolean };
  saving: boolean;
  handleSave: (e: React.FormEvent) => void;
  isEditMode: boolean;
}

export function TriggerEditorForm({
  draft,
  updateDraft,
  checkField,
  saving,
  handleSave,
  isEditMode,
}: TriggerEditorFormProps) {
  return (
    <form
      onSubmit={handleSave}
      className="space-y-6 max-w-3xl bg-white p-6 rounded-lg border border-gray-200 shadow-sm text-sm"
    >
      {/* 1. БАЗОВЫЕ ПАРАМЕТРЫ (Всегда видимы) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block font-medium text-gray-700 mb-1">
            Название триггера *
          </label>
          <input
            type="text"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 outline-none"
            value={draft.name}
            onChange={(e) => updateDraft({ name: e.target.value })}
          />
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">
            Тип Триггера (Trigger Type) *
          </label>
          <select
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 outline-none"
            value={draft.trigger_type}
            onChange={(e) =>
              updateDraft({ trigger_type: e.target.value as TriggerType })
            }
          >
            <option value="LIVE_EVAL">LIVE_EVAL (Расчет на лету)</option>
            <option value="STORED_COLUMN">
              STORED_COLUMN (Хранимый столбец)
            </option>
            <option value="AUTOMATION">
              AUTOMATION (Сложная Автоматизация)
            </option>
          </select>
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">
            Тип возврата (Return Type) *
          </label>
          <select
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 outline-none"
            value={draft.payload_return_type}
            onChange={(e) =>
              updateDraft({
                payload_return_type: e.target.value as PayloadReturnType,
              })
            }
          >
            <option value="VALUE">Одиночное значение (VALUE)</option>
            <option value="BOOLEAN">Логическое (BOOLEAN)</option>
            <option value="LIST">Список (LIST)</option>
          </select>
        </div>
      </div>

      {/* 2. МАППИНГ МОДЕЛЕЙ */}
      <div className="p-4 bg-slate-50 rounded-md border border-slate-200 space-y-4">
        <h3 className="font-bold text-xs uppercase text-slate-500 tracking-wider">
          Привязка к шаблонам
        </h3>

        {checkField("source_template_uuid").visible && (
          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Source Template UUID{" "}
              {checkField("source_template_uuid").required && "*"}
            </label>
            <input
              type="text"
              required={checkField("source_template_uuid").required}
              className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs outline-none"
              value={draft.source_template_uuid}
              onChange={(e) =>
                updateDraft({ source_template_uuid: e.target.value })
              }
            />
          </div>
        )}

        {checkField("target_field").visible && (
          <div>
            <label className="block text-amber-700 font-semibold mb-1">
              Имя колонки для записи (Target Field){" "}
              {checkField("target_field").required && "*"}
            </label>
            <input
              type="text"
              required={checkField("target_field").required}
              className="w-full rounded-md border border-amber-300 bg-amber-50/50 px-3 py-2 font-mono text-xs outline-none"
              value={draft.target_field}
              onChange={(e) => updateDraft({ target_field: e.target.value })}
            />
          </div>
        )}

        {checkField("target_template_uuid").visible && (
          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Target Template UUID{" "}
              {checkField("target_template_uuid").required && "*"}
            </label>
            <input
              type="text"
              required={checkField("target_template_uuid").required}
              className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs outline-none"
              value={draft.target_template_uuid}
              onChange={(e) =>
                updateDraft({ target_template_uuid: e.target.value })
              }
            />
          </div>
        )}
      </div>

      {/* 3. НАСТРОЙКИ АВТОМАТИЗАЦИИ */}
      {(checkField("event_type").visible ||
        checkField("action_name").visible ||
        checkField("actionParamsJson").visible) && (
        <div className="p-4 bg-amber-50/30 rounded-md border border-amber-200 space-y-4">
          <h3 className="font-bold text-xs uppercase text-amber-800 tracking-wider">
            Конфигурация Action & Event
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {checkField("event_type").visible && (
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Событие (Event Type){" "}
                  {checkField("event_type").required && "*"}
                </label>
                <select
                  required={checkField("event_type").required}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none"
                  value={draft.event_type}
                  onChange={(e) =>
                    updateDraft({ event_type: e.target.value as EventType })
                  }
                >
                  <option value="MANUAL">MANUAL</option>
                  <option value="ON_RECORD_CREATE">ON_RECORD_CREATE</option>
                  <option value="ON_RECORD_UPDATE">ON_RECORD_UPDATE</option>
                  <option value="CRON">CRON</option>
                </select>
              </div>
            )}

            {checkField("cron_expression").visible && (
              <div>
                <label className="block text-red-700 font-semibold mb-1">
                  Cron Выражение {checkField("cron_expression").required && "*"}
                </label>
                <input
                  type="text"
                  required={checkField("cron_expression").required}
                  className="w-full rounded-md border border-red-300 bg-red-50/50 px-3 py-2 font-mono outline-none"
                  value={draft.cron_expression}
                  onChange={(e) =>
                    updateDraft({ cron_expression: e.target.value })
                  }
                />
              </div>
            )}
          </div>

          {checkField("action_name").visible && (
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Системный Action (Имя){" "}
                {checkField("action_name").required && "*"}
              </label>
              <input
                type="text"
                required={checkField("action_name").required}
                className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs outline-none"
                value={draft.action_name}
                onChange={(e) => updateDraft({ action_name: e.target.value })}
              />
            </div>
          )}

          {/* НОВОЕ ПОЛЕ: Action Params (search_fields и т.д.) */}
          {checkField("actionParamsJson").visible && (
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Дополнительные параметры Action (Action Params JSON){" "}
                {checkField("actionParamsJson").required && "*"}
              </label>
              <textarea
                rows={3}
                required={checkField("actionParamsJson").required}
                className="w-full font-mono text-[11px] rounded-md border border-gray-300 px-3 py-2 bg-slate-900 text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder='Например: { "search_fields": ["phone"] }'
                value={draft.actionParamsJson}
                onChange={(e) =>
                  updateDraft({ actionParamsJson: e.target.value })
                }
              />
            </div>
          )}
        </div>
      )}

      {/* 4. AST ДЕРЕВЬЯ */}
      <div className="space-y-4">
        <h3 className="font-bold text-xs uppercase text-slate-500 tracking-wider">
          No-Code Логика (AST JSON)
        </h3>

        {checkField("conditionAstJson").visible && (
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Условие срабатывания (Condition AST){" "}
              {checkField("conditionAstJson").required && "*"}
            </label>
            <textarea
              rows={4}
              required={checkField("conditionAstJson").required}
              className="w-full font-mono text-[11px] rounded-md border border-gray-300 px-3 py-2 bg-slate-900 text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500"
              value={draft.conditionAstJson}
              onChange={(e) =>
                updateDraft({ conditionAstJson: e.target.value })
              }
            />
          </div>
        )}

        {checkField("payloadAstJson").visible && (
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Возвращаемые данные (Payload AST){" "}
              {checkField("payloadAstJson").required && "*"}
            </label>
            <textarea
              rows={4}
              required={checkField("payloadAstJson").required}
              className="w-full font-mono text-[11px] rounded-md border border-gray-300 px-3 py-2 bg-slate-900 text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500"
              value={draft.payloadAstJson}
              onChange={(e) => updateDraft({ payloadAstJson: e.target.value })}
            />
          </div>
        )}

        {checkField("actionMappingAstJson").visible && (
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Action Mapping AST (Параметры Action){" "}
              {checkField("actionMappingAstJson").required && "*"}
            </label>
            <textarea
              rows={4}
              required={checkField("actionMappingAstJson").required}
              className="w-full font-mono text-[11px] rounded-md border border-gray-300 px-3 py-2 bg-slate-900 text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500"
              value={draft.actionMappingAstJson}
              onChange={(e) =>
                updateDraft({ actionMappingAstJson: e.target.value })
              }
            />
          </div>
        )}
      </div>

      {/* FOOTER ФОРМЫ */}
      <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
        <Link
          href="/triggers"
          className="text-gray-600 hover:text-gray-900 font-medium"
        >
          Отмена
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {saving
            ? "Сохранение..."
            : isEditMode
              ? "Сохранить изменения"
              : "Создать триггер"}
        </button>
      </div>
    </form>
  );
}
