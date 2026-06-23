interface FormulaAstSettingsProps {
  value: string;
  onChange: (value: string) => void;
}

const textareaClassName =
  "min-h-36 rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-xs text-gray-950 outline-none focus:border-indigo-500";

export function FormulaAstSettings({ value, onChange }: FormulaAstSettingsProps) {
  return (
    <label className="grid gap-1 text-sm font-medium text-gray-700">
      ast
      {/* TODO: replace only this component when the formula AST tree renderer exists. */}
      <textarea
        rows={6}
        placeholder='{"type":"field","value":"amount"}'
        className={textareaClassName}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
      <span className="text-xs font-normal text-gray-500">
        Existing formula AST JSON is sent unchanged after JSON object validation.
      </span>
    </label>
  );
}

