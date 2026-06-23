import type { FormEvent } from "react";

import type { TemplateResponse } from "@/src/entities/template/model/types";
import type { ColumnDraft } from "@/src/features/templates/model/column-draft";
import { ColumnDraftFields } from "@/src/features/templates/ui/ColumnDraftFields";

interface CreateTemplateFormProps {
  name: string;
  drafts: ColumnDraft[];
  templates: TemplateResponse[];
  saving: boolean;
  onNameChange: (name: string) => void;
  onDraftChange: (draftId: string, draft: ColumnDraft) => void;
  onAddDraft: () => void;
  onRemoveDraft: (draftId: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function CreateTemplateForm({
  name,
  drafts,
  templates,
  saving,
  onNameChange,
  onDraftChange,
  onAddDraft,
  onRemoveDraft,
  onSubmit,
}: CreateTemplateFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-md border border-gray-200 bg-white p-4 shadow-sm"
    >
      <h2 className="mb-3 text-lg font-semibold">Создать шаблон</h2>
      <div className="grid gap-3">
        <input
          type="text"
          placeholder="Название"
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 outline-none focus:border-indigo-500"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          required
        />
        {drafts.map((draft, index) => (
          <div
            key={draft.id}
            className="grid gap-3 rounded-md border border-gray-200 bg-gray-50 p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-gray-700">
                Колонка {index + 1}
              </span>
              <button
                type="button"
                className="text-sm text-red-600 hover:text-red-700"
                onClick={() => onRemoveDraft(draft.id)}
              >
                Убрать
              </button>
            </div>
            <ColumnDraftFields
              draft={draft}
              templates={templates}
              onChange={(nextDraft) => onDraftChange(draft.id, nextDraft)}
            />
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={onAddDraft}
          >
            Добавить колонку
          </button>
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            disabled={saving}
          >
            Создать
          </button>
        </div>
      </div>
    </form>
  );
}

