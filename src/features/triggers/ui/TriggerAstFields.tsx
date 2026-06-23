import type { TriggerFormDraft } from "@/src/features/triggers/model/trigger-form-state";

interface TriggerAstFieldsProps {
  draft: TriggerFormDraft;
  actionMappingRequired: boolean;
  onChange: (draft: TriggerFormDraft) => void;
}

export function TriggerAstFields({
  draft,
  actionMappingRequired,
  onChange,
}: TriggerAstFieldsProps) {
  const updateField = (field: keyof TriggerFormDraft, value: string) => {
    onChange({ ...draft, [field]: value });
  };

  return (
    <div className="grid gap-3">
      {/* TODO(task-front-ast): replace this JSON boundary with the AST tree renderer. */}
      <label className="grid gap-1 text-sm font-medium text-gray-700">
        Payload AST
        <textarea
          rows={6}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-xs font-normal text-gray-950 outline-none focus:border-indigo-500"
          value={draft.payloadAstJson}
          onChange={(event) => updateField("payloadAstJson", event.target.value)}
          required
        />
      </label>
      <div className="grid gap-3 lg:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-gray-700">
          Condition AST
          <textarea
            rows={5}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-xs font-normal text-gray-950 outline-none focus:border-indigo-500"
            value={draft.conditionAstJson}
            onChange={(event) =>
              updateField("conditionAstJson", event.target.value)
            }
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-gray-700">
          Action mapping AST
          <textarea
            rows={5}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-xs font-normal text-gray-950 outline-none focus:border-indigo-500"
            value={draft.actionMappingAstJson}
            onChange={(event) =>
              updateField("actionMappingAstJson", event.target.value)
            }
            required={actionMappingRequired}
          />
        </label>
      </div>
    </div>
  );
}
