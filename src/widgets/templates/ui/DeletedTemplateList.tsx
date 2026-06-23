import type { TemplateResponse } from "@/src/entities/template/model/types";

interface DeletedTemplateListProps {
  templates: TemplateResponse[];
  loading: boolean;
  onRefresh: () => void;
  onRestore: (templateId: string) => void;
}

export function DeletedTemplateList({
  templates,
  loading,
  onRefresh,
  onRestore,
}: DeletedTemplateListProps) {
  return (
    <section className="rounded-md border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold">Удалённые</h2>
        <button
          type="button"
          className="text-sm text-indigo-700 hover:text-indigo-800"
          onClick={onRefresh}
        >
          Обновить
        </button>
      </div>
      {loading ? (
        <p className="p-4 text-sm text-gray-500">Загрузка...</p>
      ) : templates.length === 0 ? (
        <p className="p-4 text-sm text-gray-500">Удалённых шаблонов нет.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {templates.map((template) => (
            <li
              key={template.id}
              className="flex items-center justify-between gap-3 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-800">
                  {template.name}
                </p>
                <p className="truncate font-mono text-xs text-gray-500">
                  {template.id}
                </p>
              </div>
              <button
                type="button"
                className="rounded-md border border-emerald-200 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                onClick={() => onRestore(template.id)}
              >
                Restore
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

