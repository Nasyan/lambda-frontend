import React from "react";
import Link from "next/link";

interface TablesToolbarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCount: number;
  bulkMenuOpen: boolean;
  setBulkMenuOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  currentView: "active" | "deleted";
  handleBulkDeleteOrArchive: () => void;
  handleBulkRestore: () => void;
  handleBulkForceDelete: () => void;
}

export function TablesToolbar({
  searchQuery,
  setSearchQuery,
  selectedCount,
  bulkMenuOpen,
  setBulkMenuOpen,
  currentView,
  handleBulkDeleteOrArchive,
  handleBulkRestore,
  handleBulkForceDelete,
}: TablesToolbarProps) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <div className="relative flex-1">
        <svg
          className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="m21 21-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
          />
        </svg>
        <input
          type="text"
          placeholder="Введите название таблицы"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-12 w-full rounded-lg border border-gray-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-gray-300"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            disabled={selectedCount === 0}
            onClick={() => setBulkMenuOpen((v) => !v)}
            className="flex h-12 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Действия
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="m19 9-7 7-7-7"
              />
            </svg>
          </button>

          {bulkMenuOpen && selectedCount > 0 && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white py-2 shadow-xl">
              {currentView === "active" ? (
                <>
                  <button
                    onClick={handleBulkDeleteOrArchive}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    Архивировать выбранные
                  </button>
                  <button
                    onClick={handleBulkDeleteOrArchive}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Удалить выбранные
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleBulkRestore}
                    className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50"
                  >
                    Восстановить выбранные
                  </button>
                  <button
                    onClick={handleBulkForceDelete}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 font-medium"
                  >
                    Удалить навсегда
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        <Link
          href="/tables/new"
          className="flex h-12 items-center rounded-lg bg-[#171717] px-5 text-sm font-medium text-white transition hover:bg-black"
        >
          Новая таблица +
        </Link>
      </div>
    </div>
  );
}
