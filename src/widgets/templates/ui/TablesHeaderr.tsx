import React from "react";

interface TablesHeaderProps {
  activeCount: number;
  deletedCount: number;
  currentView: "active" | "deleted";
  setCurrentView: (view: "active" | "deleted") => void;
  resetSelection: () => void;
}

export function TablesHeader({
  activeCount,
  deletedCount,
  currentView,
  setCurrentView,
  resetSelection,
}: TablesHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-[40px] font-semibold leading-none text-black">
        Таблицы
      </h1>
      <div className="mt-4 flex gap-6 text-sm text-gray-500 border-b border-gray-100 pb-2">
        <button
          className={`transition-colors ${currentView === "active" ? "text-gray-900 font-medium" : "hover:text-gray-700"}`}
          onClick={() => {
            setCurrentView("active");
            resetSelection();
          }}
        >
          Активные ({activeCount})
        </button>
        <button
          className={`transition-colors ${currentView === "deleted" ? "text-gray-900 font-medium" : "hover:text-gray-700"}`}
          onClick={() => {
            setCurrentView("deleted");
            resetSelection();
          }}
        >
          Удаленные ({deletedCount})
        </button>
      </div>
    </div>
  );
}
