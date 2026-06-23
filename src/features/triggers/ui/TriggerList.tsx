import type { TriggerResponse } from "@/src/entities/trigger/model/types";
import type { TemplateResponse } from "@/src/entities/template/model/types";

interface TriggerListProps {
  triggers: TriggerResponse[];
  templates: TemplateResponse[];
  loading: boolean;
  saving: boolean;
  selectedTriggerId?: string;
  onEdit: (trigger: TriggerResponse) => void;
  onDelete: (trigger: TriggerResponse) => void;
  onRefresh: () => void;
}

const templateNameByUuid = (
  templates: TemplateResponse[],
  templateUuid: string | null,
): string => {
  if (!templateUuid) {
    return "—";
  }

  return (
    templates.find((template) => template.id === templateUuid)?.name ?? templateUuid
  );
};

export function TriggerList({
  triggers,
  templates,
  loading,
  saving,
  selectedTriggerId,
  onEdit,
  onDelete,
  onRefresh,
}: TriggerListProps) {
  return (
    <section className="rounded-md border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold">Триггеры</h2>
        <button
          type="button"
          className="text-sm text-indigo-700 hover:text-indigo-800"
          onClick={onRefresh}
          disabled={loading || saving}
        >
          Обновить
        </button>
      </div>
      {loading ? (
        <p className="p-4 text-sm text-gray-500">Загрузка...</p>
      ) : triggers.length === 0 ? (
        <p className="p-4 text-sm text-gray-500">Триггеров нет.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">
                  Name
                </th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">
                  Type
                </th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">
                  Event
                </th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">
                  Source
                </th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">
                  Target
                </th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">
                  Return
                </th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {triggers.map((trigger) => (
                <tr
                  key={trigger.id}
                  className={
                    selectedTriggerId === trigger.id ? "bg-indigo-50" : undefined
                  }
                >
                  <td className="px-3 py-3">
                    <div className="font-medium text-gray-900">{trigger.name}</div>
                    <div className="font-mono text-xs text-gray-500">
                      {trigger.id}
                    </div>
                  </td>
                  <td className="px-3 py-3">{trigger.trigger_type}</td>
                  <td className="px-3 py-3">{trigger.event_type ?? "—"}</td>
                  <td className="px-3 py-3">
                    {templateNameByUuid(templates, trigger.source_template_uuid)}
                  </td>
                  <td className="px-3 py-3">
                    {templateNameByUuid(templates, trigger.target_template_uuid)}
                    {trigger.target_field && (
                      <span className="block font-mono text-xs text-gray-500">
                        {trigger.target_field}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">{trigger.payload_return_type}</td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        onClick={() => onEdit(trigger)}
                        disabled={saving}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        onClick={() => onDelete(trigger)}
                        disabled={saving}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
