import type { ColumnMetaResponse } from "@/src/entities/template/model/types";

interface ColumnListProps {
  columns: [string, ColumnMetaResponse][];
  onEdit: (columnName: string, meta: ColumnMetaResponse) => void;
  onDelete: (columnName: string) => void;
}

export function ColumnList({ columns, onEdit, onDelete }: ColumnListProps) {
  return (
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
              Required
            </th>
            <th className="px-3 py-2 text-left font-semibold text-gray-600">
              Meta
            </th>
            <th className="px-3 py-2 text-right font-semibold text-gray-600">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {columns.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                Колонок нет.
              </td>
            </tr>
          ) : (
            columns.map(([columnName, meta]) => (
              <tr key={columnName}>
                <td className="px-3 py-3 font-mono font-semibold">{columnName}</td>
                <td className="px-3 py-3">{meta.type}</td>
                <td className="px-3 py-3">{meta.required ? "Yes" : "No"}</td>
                <td className="max-w-[360px] px-3 py-3">
                  <pre className="max-h-28 overflow-auto rounded-md bg-gray-50 p-2 text-xs text-gray-700">
                    {JSON.stringify(meta, null, 2)}
                  </pre>
                </td>
                <td className="px-3 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      onClick={() => onEdit(columnName, meta)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      onClick={() => onDelete(columnName)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

