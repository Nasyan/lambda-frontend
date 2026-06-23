import type { TemplateResponse } from "@/src/entities/template/model/types";

interface TemplateListProps {
  templates: TemplateResponse[];
  selectedTemplateId?: string;
  loading: boolean;
  onRefresh: () => void;
  onSelect: (templateId: string) => void;
  onDelete: (templateId: string) => void;
}

export function TemplateList({
  templates,
  selectedTemplateId,
  loading,
  onRefresh,
  onSelect,
  onDelete,
}: TemplateListProps) {
  return (
    <section className="rounded-md border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold">Активные шаблоны</h2>
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
        <p className="p-4 text-sm text-gray-500">Шаблонов нет.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {templates.map((template) => (
            <li key={template.id} className="flex items-center gap-2 p-3">
              <button
                type="button"
                className={`min-w-0 flex-1 rounded-md px-3 py-2 text-left text-sm font-medium ${
                  selectedTemplateId === template.id
                    ? "bg-indigo-50 text-indigo-900"
                    : "text-gray-800 hover:bg-gray-50"
                }`}
                onClick={() => onSelect(template.id)}
              >
                <span className="block truncate">{template.name}</span>
                <span className="block truncate font-mono text-xs text-gray-500">
                  {template.id}
                </span>
              </button>
              <button
                type="button"
                className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                onClick={() => onDelete(template.id)}
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

