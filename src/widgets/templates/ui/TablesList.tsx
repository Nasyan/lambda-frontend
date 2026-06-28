import React from "react";
import type { TemplateResponse } from "@/src/entities/template/model/types";

interface TablesListProps {
  filteredList: TemplateResponse[];
  selectedIds: Set<string>;
  toggleSelectAll: () => void;
  toggleSelect: (id: string) => void;
  currentView: "active" | "deleted";
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
  dropdownPosition: { top: number; left: number };
  setDropdownPosition: (pos: { top: number; left: number }) => void;
  handleRowAction: (id: string, action: string) => void;
}

export function TablesList({
  filteredList,
  selectedIds,
  toggleSelectAll,
  toggleSelect,
  currentView,
  openDropdownId,
  setOpenDropdownId,
  dropdownPosition,
  setDropdownPosition,
  handleRowAction,
}: TablesListProps) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-[40px_40px_1fr_60px] border-b border-gray-200 pb-4 text-sm text-gray-500">
        <div>
          <input
            type="checkbox"
            checked={
              selectedIds.size === filteredList.length &&
              filteredList.length > 0
            }
            onChange={toggleSelectAll}
            className="cursor-pointer"
          />
        </div>
        <div />
        <div className="flex items-center gap-1">
          Название таблицы <span className="text-gray-300">↕</span>
        </div>
        <div />
      </div>

      {filteredList.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">
          Таблиц не найдено
        </div>
      ) : (
        filteredList.map((table) => (
          <div
            key={table.id}
            className="grid grid-cols-[40px_40px_1fr_60px] items-center py-5 text-sm transition hover:bg-gray-50"
          >
            <div>
              <input
                type="checkbox"
                checked={selectedIds.has(table.id)}
                onChange={() => toggleSelect(table.id)}
                className="cursor-pointer"
              />
            </div>
            <div>
              <div className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 text-gray-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 3H21V21H3V3ZM3 9H21M9 3V21"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>
            <div className="font-medium text-gray-900">{table.name}</div>
            <div className="flex justify-end">
              <button
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setDropdownPosition({
                    top: rect.bottom + 8,
                    left: rect.right - 192,
                  });
                  setOpenDropdownId(
                    openDropdownId === table.id ? null : table.id,
                  );
                }}
                className="rounded-md p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                ⋯
              </button>

              {openDropdownId === table.id && (
                <div
                  className="fixed z-[9999] w-48 rounded-xl border border-gray-200 bg-white py-2 shadow-2xl"
                  style={{
                    top: dropdownPosition.top,
                    left: dropdownPosition.left,
                  }}
                >
                  {currentView === "active" ? (
                    <>
                      <button
                        onClick={() => handleRowAction(table.id, "edit")}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                      >
                        Редактировать схему
                      </button>
                      <button
                        onClick={() => handleRowAction(table.id, "archive")}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                      >
                        Архивировать
                      </button>
                      <div className="my-1 border-t border-gray-100" />
                      <button
                        onClick={() => handleRowAction(table.id, "to_records")}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                      >
                        To Records
                      </button>
                      <button
                        onClick={() => handleRowAction(table.id, "to_workflow")}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                      >
                        To Workflow
                      </button>
                      <button
                        onClick={() => handleRowAction(table.id, "to_table")}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                      >
                        To Table
                      </button>
                      <div className="my-1 border-t border-gray-100" />
                      <button
                        onClick={() => handleRowAction(table.id, "delete")}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        Удалить
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleRowAction(table.id, "restore")}
                        className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50"
                      >
                        Восстановить
                      </button>
                      <button
                        onClick={() =>
                          handleRowAction(table.id, "force_delete")
                        }
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 font-medium"
                      >
                        Удалить навсегда
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
