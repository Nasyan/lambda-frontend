"use client";

import React from "react";
import { AppSidebar } from "@/src/widgets/app-sidebar/ui/AppSidebar";
import { useTables } from "../model/useTables";
import { TablesToolbar } from "./TablesToolbar";
import { TablesList } from "./TablesList";
import { TablesHeader } from "./TablesHeaderr";
import { DeleteConfirmationModal } from "./DeleteConfirmationModel";
// Импортируем нашу новую модалку

export function TablesWorkspace() {
  const {
    loading,
    processing,
    currentView,
    setCurrentView,
    searchQuery,
    setSearchQuery,
    selectedIds,
    setSelectedIds,
    bulkMenuOpen,
    setBulkMenuOpen,
    openDropdownId,
    setOpenDropdownId,
    dropdownPosition,
    setDropdownPosition,
    filteredList,
    activeTables,
    deletedTables,
    toggleSelectAll,
    toggleSelect,
    handleBulkDeleteOrArchive,
    handleBulkRestore,
    handleRowAction,
    confirmModal,
    setConfirmModal,
    handleBulkForceDelete,
    executeBulkForceDelete,
    executeSingleForceDelete,
  } = useTables();

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col md:flex-row bg-white">
        <AppSidebar />
        <div className="p-8 text-gray-500 flex-1">Загрузка...</div>
      </div>
    );
  }

  const resetSelection = () => {
    setSelectedIds(new Set());
    setBulkMenuOpen(false);
  };

  return (
    <div
      className={`flex min-h-screen bg-white ${processing ? "pointer-events-none opacity-60" : ""}`}
    >
      <AppSidebar />

      <div className="flex-1 px-8 py-8">
        <TablesHeader
          activeCount={activeTables.length}
          deletedCount={deletedTables.length}
          currentView={currentView}
          setCurrentView={setCurrentView} // <--- Кнопки должны вызывать именно это!
          resetSelection={resetSelection}
        />

        <TablesToolbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCount={selectedIds.size}
          bulkMenuOpen={bulkMenuOpen}
          setBulkMenuOpen={setBulkMenuOpen}
          currentView={currentView}
          handleBulkDeleteOrArchive={handleBulkDeleteOrArchive}
          handleBulkRestore={handleBulkRestore}
          // ВАЖНО: Передаем безопасный триггер вместо прямого удаления!
          handleBulkForceDelete={handleBulkForceDelete}
        />

        <TablesList
          filteredList={filteredList}
          selectedIds={selectedIds}
          toggleSelectAll={toggleSelectAll}
          toggleSelect={toggleSelect}
          currentView={currentView}
          openDropdownId={openDropdownId}
          setOpenDropdownId={setOpenDropdownId}
          dropdownPosition={dropdownPosition}
          setDropdownPosition={setDropdownPosition}
          handleRowAction={handleRowAction}
        />

        {/* НОВАЯ МОДАЛКА ПОДТВЕРЖДЕНИЯ С ПРОВЕРКОЙ ТЕКСТА */}
        <DeleteConfirmationModal
          isOpen={confirmModal.isOpen}
          mode={confirmModal.mode}
          templateName={confirmModal.templateName}
          bulkCount={selectedIds.size}
          onClose={() =>
            setConfirmModal((prev) => ({ ...prev, isOpen: false }))
          }
          onConfirm={() => {
            if (confirmModal.mode === "bulk") {
              executeBulkForceDelete();
            } else if (
              confirmModal.mode === "single" &&
              confirmModal.templateId
            ) {
              executeSingleForceDelete(confirmModal.templateId);
            }
          }}
        />
      </div>
    </div>
  );
}

export default function TablesPage() {
  return <TablesWorkspace />;
}
