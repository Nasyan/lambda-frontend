import React from "react";
import type { TriggerResponse } from "@/src/entities/trigger/model/types";

interface TriggersListProps {
  triggers: TriggerResponse[];
  loading: boolean;
  editingId: string | null;
  loadTriggers: () => void;
  handleExecute: (id: string) => void;
  openEdit: (trigger: TriggerResponse) => void;
  handleDelete: (id: string) => void;
}

export function TriggersList({
  triggers,
  loading,
  editingId,
  loadTriggers,
  handleExecute,
  openEdit,
  handleDelete,
}: TriggersListProps) {
  return (
    <section className="flex flex-col rounded-md border border-gray-200 bg-white shadow-sm overflow-hidden min-h-0">
      <div className="flex items-center justify-between border-b border-gray-200 p-4 bg-gray-50/50 shrink-0">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-600">
          Активные триггеры в PostgreSQL
        </h2>
        <button
          onClick={loadTriggers}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          Синхронизировать
        </button>
      </div>

      <div className="overflow-y-auto p-4 flex-1 space-y-3">
        {loading ? (
          <p className="text-sm text-gray-500">Получение метаданных...</p>
        ) : triggers.length === 0 ? (
          <p className="text-sm text-gray-500">
            В данном инстансе триггеры отсутствуют.
          </p>
        ) : (
          <div className="space-y-3">
            {triggers.map((t) => (
              <div
                key={t.id}
                className={`p-4 rounded-lg border text-sm transition-all ${
                  editingId === t.id
                    ? "border-indigo-500 bg-indigo-50/60 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex justify-between items-start gap-4 mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900">{t.name}</h3>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <span className="bg-slate-100 text-slate-800 font-mono text-[10px] px-2 py-0.5 rounded">
                        {t.trigger_type}
                      </span>
                      {t.trigger_type === "AUTOMATION" && (
                        <span className="bg-blue-50 text-blue-800 font-mono text-[10px] px-2 py-0.5 rounded">
                          {t.event_type || "MANUAL"}
                        </span>
                      )}
                      <span className="bg-purple-50 text-purple-800 font-mono text-[10px] px-2 py-0.5 rounded">
                        Returns: {t.payload_return_type}
                      </span>
                      {t.action_name && (
                        <span className="bg-amber-50 text-amber-800 font-mono text-[10px] px-2 py-0.5 rounded">
                          ⚡ {t.action_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {t.trigger_type === "AUTOMATION" && (
                      <button
                        onClick={() => handleExecute(t.id)}
                        className="text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded border border-emerald-200"
                      >
                        Execute
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(t)}
                      className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 bg-white px-2 py-1 rounded border border-gray-200"
                    >
                      Изменить
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="text-[11px] font-medium text-red-600 hover:text-red-800 bg-white px-2 py-1 rounded border border-gray-200"
                    >
                      Удалить
                    </button>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-100 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] text-gray-500">
                  <div>
                    Source Template:{" "}
                    <span className="text-gray-700 block truncate">
                      {t.source_template_uuid}
                    </span>
                  </div>
                  {t.target_template_uuid && (
                    <div>
                      Target Template:{" "}
                      <span className="text-gray-700 block truncate">
                        {t.target_template_uuid}
                      </span>
                    </div>
                  )}
                  {t.target_field && (
                    <div className="col-span-2 mt-0.5">
                      Target Field:{" "}
                      <span className="text-gray-700 font-semibold">
                        {t.target_field}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
