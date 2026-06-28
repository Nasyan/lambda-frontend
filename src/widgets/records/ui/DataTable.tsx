"use client";

import { useState } from "react";

export interface ColumnDef {
  key: string;
  label: string;
}

interface DataTableProps<T> {
  columns: ColumnDef[];
  data: T[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  getRowId: (row: T) => string;
  renderActions?: (row: T) => React.ReactNode;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  getRowId,
  renderActions,
  emptyMessage = "Записей нет",
}: DataTableProps<T>) {
  // Локальный стейт для открытого дропдауна (чтобы закрывался при клике вне)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const allSelected = data.length > 0 && selectedIds.size === data.length;

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="w-full min-w-max text-left text-sm text-gray-600">
        <thead className="bg-gray-50 text-gray-900 border-b border-gray-200">
          <tr>
            <th className="w-12 px-4 py-3 text-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                checked={allSelected}
                onChange={onToggleSelectAll}
              />
            </th>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 font-medium">
                {col.label}
              </th>
            ))}
            {renderActions && <th className="w-16 px-4 py-3"></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 2}
                className="px-4 py-8 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => {
              const rId = getRowId(row);
              const isSelected = selectedIds.has(rId);

              return (
                <tr
                  key={rId}
                  className={`hover:bg-gray-50 transition-colors ${isSelected ? "bg-indigo-50/30" : ""}`}
                >
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked={isSelected}
                      onChange={() => onToggleSelect(rId)}
                    />
                  </td>

                  {columns.map((col) => {
                    // Предполагаем, что данные лежат в row.data для динамических таблиц
                    const cellValue =
                      (row as any).data?.[col.key] ?? (row as any)[col.key];
                    return (
                      <td
                        key={col.key}
                        className="px-4 py-3 truncate max-w-[200px]"
                      >
                        {cellValue !== undefined && cellValue !== null
                          ? String(cellValue)
                          : "—"}
                      </td>
                    );
                  })}

                  {renderActions && (
                    <td className="px-4 py-3 relative text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(
                            openDropdownId === rId ? null : rId,
                          );
                        }}
                        className="p-1 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                      >
                        •••
                      </button>

                      {openDropdownId === rId && (
                        <>
                          {/* Оверлей для закрытия кликом вне меню */}
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenDropdownId(null)}
                          />
                          <div className="absolute right-8 top-10 z-20 w-40 rounded-lg border border-gray-100 bg-white py-1 shadow-lg overflow-hidden">
                            <div onClick={() => setOpenDropdownId(null)}>
                              {renderActions(row)}
                            </div>
                          </div>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
