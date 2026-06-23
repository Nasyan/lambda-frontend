import type { FormEvent } from "react";

import type {
  ColumnMetaResponse,
  TemplateResponse,
} from "@/src/entities/template/model/types";
import type { ColumnDraft } from "@/src/features/templates/model/column-draft";
import { ColumnDraftFields } from "@/src/features/templates/ui/ColumnDraftFields";
import { ColumnList } from "@/src/widgets/templates/ui/ColumnList";

interface TemplateDetailsProps {
  selectedTemplate: TemplateResponse | null;
  selectedTemplateName: string;
  templates: TemplateResponse[];
  columns: [string, ColumnMetaResponse][];
  newColumnDraft: ColumnDraft;
  editingColumnName: string | null;
  editingColumnDraft: ColumnDraft | null;
  saving: boolean;
  onTemplateNameChange: (name: string) => void;
  onTemplateNameSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onNewColumnDraftChange: (draft: ColumnDraft) => void;
  onAddColumnSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onEditingColumnDraftChange: (draft: ColumnDraft) => void;
  onUpdateColumnSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEditColumn: () => void;
  onEditColumn: (columnName: string, meta: ColumnMetaResponse) => void;
  onDeleteColumn: (columnName: string) => void;
}

export function TemplateDetails({
  selectedTemplate,
  selectedTemplateName,
  templates,
  columns,
  newColumnDraft,
  editingColumnName,
  editingColumnDraft,
  saving,
  onTemplateNameChange,
  onTemplateNameSubmit,
  onNewColumnDraftChange,
  onAddColumnSubmit,
  onEditingColumnDraftChange,
  onUpdateColumnSubmit,
  onCancelEditColumn,
  onEditColumn,
  onDeleteColumn,
}: TemplateDetailsProps) {
  if (!selectedTemplate) {
    return (
      <section className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex min-h-[360px] items-center justify-center rounded-md border border-dashed border-gray-300 text-sm text-gray-500">
          Выберите шаблон
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid gap-6">
        <form
          onSubmit={onTemplateNameSubmit}
          className="grid gap-3 border-b border-gray-200 pb-4"
        >
          <div>
            <p className="font-mono text-xs text-gray-500">
              {selectedTemplate.id}
            </p>
            <h2 className="text-xl font-bold">{selectedTemplate.name}</h2>
          </div>
          <div className="flex flex-col gap-2 md:flex-row">
            <input
              type="text"
              className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 outline-none focus:border-indigo-500"
              value={selectedTemplateName}
              onChange={(event) => onTemplateNameChange(event.target.value)}
              required
            />
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              disabled={saving}
            >
              Сохранить имя
            </button>
          </div>
        </form>

        <form
          onSubmit={onAddColumnSubmit}
          className="grid gap-3 rounded-md border border-gray-200 bg-gray-50 p-4"
        >
          <h3 className="text-base font-semibold">Добавить колонку</h3>
          <ColumnDraftFields
            draft={newColumnDraft}
            templates={templates}
            onChange={onNewColumnDraftChange}
          />
          <div>
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              disabled={saving}
            >
              Добавить
            </button>
          </div>
        </form>

        {editingColumnDraft && (
          <form
            onSubmit={onUpdateColumnSubmit}
            className="grid gap-3 rounded-md border border-indigo-200 bg-indigo-50 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold">
                Редактировать {editingColumnName}
              </h3>
              <button
                type="button"
                className="text-sm text-gray-600 hover:text-gray-900"
                onClick={onCancelEditColumn}
              >
                Отмена
              </button>
            </div>
            <ColumnDraftFields
              draft={editingColumnDraft}
              templates={templates}
              onChange={onEditingColumnDraftChange}
              columnNameDisabled
            />
            <div>
              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                disabled={saving}
              >
                Обновить колонку
              </button>
            </div>
          </form>
        )}

        <ColumnList columns={columns} onEdit={onEditColumn} onDelete={onDeleteColumn} />
      </div>
    </section>
  );
}

