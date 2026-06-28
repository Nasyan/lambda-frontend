import React from "react";
import type {
  TriggerType,
  PayloadReturnType,
  EventType,
} from "@/src/entities/trigger/model/types";

interface TriggerFormProps {
  draft: any; // Замените any на ваш тип Draft/Payload, если он есть
  setDraft: (draft: any) => void;
  editingId: string | null;
  saving: boolean;
  isAutomation: boolean;
  isStoredColumn: boolean;
  isCronEvent: boolean;
  handleSave: (e: React.FormEvent) => void;
  cancelEdit: () => void;
}

export function TriggerForm({
  draft,
  setDraft,
  editingId,
  saving,
  isAutomation,
  isStoredColumn,
  isCronEvent,
  handleSave,
  cancelEdit,
}: TriggerFormProps) {
  return (
    <section className="flex flex-col rounded-md border border-gray-200 bg-white shadow-sm overflow-hidden min-h-0">
      <div className="border-b border-gray-200 p-4 bg-gray-50 flex justify-between items-center shrink-0">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">
          {editingId ? "Конфигурация Метаданных" : "Новая Спецификация"}
        </h2>
        {editingId && (
          <button
            type="button"
            onClick={cancelEdit}
            className="text-xs font-semibold text-gray-500 hover:text-gray-800"
          >
            Сброс
          </button>
        )}
      </div>

      <form
        onSubmit={handleSave}
        className="overflow-y-auto p-4 flex-1 space-y-4 text-xs"
      >
        {/* Блок: Базовые параметры */}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block font-medium text-gray-700 mb-1">
              Название триггера
            </label>
            <input
              type="text"
              required
              placeholder="Например, loyalty: accrual"
              className="block w-full rounded-md border border-gray-300 px-3 py-1.5 focus:border-indigo-500 outline-none"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Trigger Type
            </label>
            <select
              className="block w-full rounded-md border border-gray-300 px-2 py-1.5 focus:border-indigo-500 outline-none"
              value={draft.trigger_type}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  trigger_type: e.target.value as TriggerType,
                })
              }
            >
              <option value="AUTOMATION">AUTOMATION (Автоматизация)</option>
              <option value="LIVE_EVAL">LIVE_EVAL (Расчет на лету)</option>
              <option value="STORED_COLUMN">
                STORED_COLUMN (Хранимый столбец)
              </option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Return Type контракт
            </label>
            <select
              className="block w-full rounded-md border border-gray-300 px-2 py-1.5 focus:border-indigo-500 outline-none"
              value={draft.payload_return_type}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  payload_return_type: e.target.value as PayloadReturnType,
                })
              }
            >
              <option value="VALUE">VALUE</option>
              <option value="BOOLEAN">BOOLEAN</option>
              <option value="LIST">LIST</option>
            </select>
          </div>
        </div>

        {/* Блок: Изоляция сущностей (Template UUIDs) */}
        <div className="p-2.5 bg-slate-50 rounded-md border border-gray-200 space-y-2">
          <span className="block font-bold text-[10px] uppercase text-gray-500 tracking-wider">
            Маппинг моделей шаблонов (UUID)
          </span>
          <div>
            <label className="block text-gray-600 mb-0.5">
              Source Template UUID *
            </label>
            <input
              type="text"
              required
              placeholder="Шаблон-источник события"
              className="block w-full rounded-md border border-gray-300 px-2 py-1 font-mono text-[11px] outline-none"
              value={draft.source_template_uuid}
              onChange={(e) =>
                setDraft({ ...draft, source_template_uuid: e.target.value })
              }
            />
          </div>

          {isStoredColumn && (
            <div>
              <label className="block text-amber-700 font-semibold mb-0.5">
                Target Field (Имя результирующей колонки) *
              </label>
              <input
                type="text"
                required
                placeholder="Например, total_spent_computed"
                className="block w-full rounded-md border border-amber-300 bg-amber-50/30 px-2 py-1 font-mono outline-none"
                value={draft.target_field}
                onChange={(e) =>
                  setDraft({ ...draft, target_field: e.target.value })
                }
              />
            </div>
          )}

          {isAutomation && (
            <div>
              <label className="block text-gray-600 mb-0.5">
                Target Template UUID (Куда пишем результат экшена)
              </label>
              <input
                type="text"
                placeholder="Целевой шаблон для DML-экшенов"
                className="block w-full rounded-md border border-gray-300 px-2 py-1 font-mono text-[11px] outline-none"
                value={draft.target_template_uuid}
                onChange={(e) =>
                  setDraft({ ...draft, target_template_uuid: e.target.value })
                }
              />
            </div>
          )}
        </div>

        {/* Блок: Рантайм и Экшены */}
        {isAutomation && (
          <div className="grid grid-cols-2 gap-3 p-2.5 bg-amber-50/40 rounded-md border border-amber-200/60">
            <div className="col-span-2 font-bold text-[10px] uppercase text-amber-800 tracking-wider">
              Рантайм & Системные контракты
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Event Type</label>
              <select
                className="block w-full rounded-md border border-gray-300 px-2 py-1 focus:border-indigo-500 outline-none"
                value={draft.event_type}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    event_type: e.target.value as EventType,
                  })
                }
              >
                <option value="ON_RECORD_CREATE">ON_RECORD_CREATE</option>
                <option value="ON_RECORD_UPDATE">ON_RECORD_UPDATE</option>
                <option value="CRON">CRON</option>
                <option value="ON_TIME">ON_TIME</option>
                <option value="MANUAL">MANUAL</option>
              </select>
            </div>

            {isCronEvent ? (
              <div>
                <label className="block text-red-700 font-semibold mb-1">
                  Cron Выражение *
                </label>
                <input
                  type="text"
                  required
                  placeholder="*/5 * * * *"
                  className="block w-full rounded-md border border-red-300 bg-red-50/30 px-2 py-1 outline-none font-mono"
                  value={draft.cron_expression}
                  onChange={(e) =>
                    setDraft({ ...draft, cron_expression: e.target.value })
                  }
                />
              </div>
            ) : (
              <div className="flex items-center text-gray-400 text-[11px] pl-2">
                Реагирует по факту наступления события в системе
              </div>
            )}

            <div className="col-span-2">
              <label className="block text-gray-700 mb-1">
                Action Name (Системный экшен)
              </label>
              <input
                type="text"
                placeholder="UPSERT_RECORD / INSERT_RECORD / SEND_BULK_NOTIFICATION"
                className="block w-full rounded-md border border-gray-300 px-2 py-1 font-mono outline-none"
                value={draft.action_name}
                onChange={(e) =>
                  setDraft({ ...draft, action_name: e.target.value })
                }
              />
            </div>
          </div>
        )}

        {/* Блок: Деревья AST */}
        <div className="space-y-3">
          <span className="block font-bold text-[10px] uppercase text-gray-500 tracking-wider">
            Конфигурация AST-деревьев (No-Code ядра)
          </span>

          <div>
            <label className="block font-medium text-gray-600 mb-0.5">
              Condition AST{" "}
              {draft.event_type === "ON_RECORD_UPDATE"
                ? "(Доступны переменные $old и $new)"
                : "(Условие фильтрации)"}
            </label>
            <textarea
              rows={3}
              className="block w-full font-mono text-[11px] rounded-md border border-gray-300 px-2 py-1 outline-none bg-slate-900 text-slate-100"
              value={draft.conditionAstJson}
              onChange={(e) =>
                setDraft({ ...draft, conditionAstJson: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block font-medium text-gray-600 mb-0.5">
              Payload AST * (Вычисление значения/структуры данных)
            </label>
            <textarea
              rows={3}
              className="block w-full font-mono text-[11px] rounded-md border border-gray-300 px-2 py-1 outline-none bg-slate-900 text-slate-100"
              value={draft.payloadAstJson}
              onChange={(e) =>
                setDraft({ ...draft, payloadAstJson: e.target.value })
              }
            />
          </div>

          {isAutomation && (
            <>
              <div>
                <label className="block font-medium text-gray-600 mb-0.5">
                  Action Params JSON (Селекторы поиска / мета-контекст)
                </label>
                <textarea
                  rows={2}
                  className="block w-full font-mono text-[11px] rounded-md border border-gray-300 px-2 py-1 outline-none bg-slate-900 text-slate-100"
                  value={draft.actionParamsJson}
                  onChange={(e) =>
                    setDraft({ ...draft, actionParamsJson: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block font-medium text-gray-600 mb-0.5">
                  Action Mapping AST (DML маппинг полей для вставки/обновления)
                </label>
                <textarea
                  rows={3}
                  className="block w-full font-mono text-[11px] rounded-md border border-gray-300 px-2 py-1 outline-none bg-slate-900 text-slate-100"
                  value={draft.actionMappingAstJson}
                  onChange={(e) =>
                    setDraft({ ...draft, actionMappingAstJson: e.target.value })
                  }
                />
              </div>
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 shrink-0"
        >
          {saving
            ? "Синхронизация..."
            : editingId
              ? "Записать изменения в PostgreSQL"
              : "Создать триггерную схему"}
        </button>
      </form>
    </section>
  );
}
