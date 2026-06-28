"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { templateApi } from "@/src/features/templates/api/template-api";
import {
  recordApi,
  type RecordResponse,
} from "@/src/features/records/api/record-api";
import {
  getAccessToken,
  getInstanceUuidFromAccessToken,
} from "@/src/shared/lib/session";
import type {
  TemplateResponse,
  JsonObject,
} from "@/src/entities/template/model/types";
import { AppSidebar } from "@/src/widgets/app-sidebar/ui/AppSidebar";
import { ColumnDef, DataTable } from "./DataTable";
import { Modal } from "./Modal";
import { DynamicForm } from "./DynamicForm";

// Импорт новых переиспользуемых компонентов

interface RecordsWorkspaceProps {
  templateUuid: string;
}

export function TableWorkspace({ templateUuid }: RecordsWorkspaceProps) {
  const router = useRouter();
  const [instanceUuid, setInstanceUuid] = useState<string | null>(null);

  const [template, setTemplate] = useState<TemplateResponse | null>(null);
  const [activeRecords, setActiveRecords] = useState<RecordResponse[]>([]);
  const [deletedRecords, setDeletedRecords] = useState<RecordResponse[]>([]);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [currentView, setCurrentView] = useState<"active" | "deleted">(
    "active",
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RecordResponse | null>(
    null,
  );

  useEffect(() => {
    const tokenInstanceUuid = getInstanceUuidFromAccessToken();
    if (!tokenInstanceUuid) router.push("/login");
    else setInstanceUuid(tokenInstanceUuid);
  }, [router]);

  const loadData = useCallback(async () => {
    if (!instanceUuid) return;
    setLoading(true);
    try {
      const tpl = await templateApi.getTemplate(instanceUuid, templateUuid);
      setTemplate(tpl);
      const [active, deleted] = await Promise.all([
        recordApi.getRecords(instanceUuid, templateUuid),
        recordApi.getDeletedRecords(instanceUuid, templateUuid),
      ]);
      setActiveRecords(active);
      setDeletedRecords(deleted);
    } catch (error) {
      console.error("Ошибка загрузки:", error);
    } finally {
      setLoading(false);
    }
  }, [instanceUuid, templateUuid]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Маппинг схемы в формат колонок для DataTable
  const tableColumns: ColumnDef[] = template?.schema
    ? Object.keys(template.schema).map((key) => ({ key, label: key }))
    : [];

  const currentList = currentView === "active" ? activeRecords : deletedRecords;

  // --- ОБРАБОТЧИКИ ---

  const handleSave = async (formData: Record<string, any>) => {
    if (!instanceUuid || !template?.schema) return;
    setProcessing(true);
    try {
      // Подготовка данных с учетом типов
      const formattedData: Record<string, any> = {};
      Object.keys(template.schema).forEach((col) => {
        const meta = template.schema[col] as any;
        const val = formData[col];
        if (val === undefined || val === "") {
          if (meta.required) throw new Error(`Поле "${col}" обязательно`);
          return;
        }
        if (meta.type === "number") formattedData[col] = Number(val) || 0;
        else if (meta.type === "boolean")
          formattedData[col] = val === "true" || val === true;
        else formattedData[col] = val;
      });

      const rId = editingRecord?.id || (editingRecord as any)?._id;
      if (rId) {
        await recordApi.updateRecord(instanceUuid, templateUuid, rId, {
          data: formattedData,
        });
      } else {
        await recordApi.createRecord(instanceUuid, templateUuid, {
          data: formattedData,
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (error: any) {
      alert(error.message || "Ошибка сохранения");
    } finally {
      setProcessing(false);
    }
  };

  const handleAction = async (id: string, action: "delete" | "restore") => {
    if (!instanceUuid) return;
    setProcessing(true);
    try {
      if (action === "delete")
        await recordApi.deleteRecord(instanceUuid, templateUuid, id);
      else await recordApi.restoreRecord(instanceUuid, templateUuid, id);
      await loadData();
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50/50">
        <AppSidebar />
        <div className="p-8 text-gray-500">Загрузка данных...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-50/30">
      <AppSidebar />
      <div className="flex flex-1 flex-col p-8 max-w-7xl mx-auto w-full">
        {/* Шапка */}
        <div className="mb-8 flex flex-col gap-1">
          <div className="text-sm text-gray-500 flex gap-2">
            <button
              onClick={() => router.push("/tables")}
              className="hover:text-gray-900 transition-colors"
            >
              Таблицы
            </button>
            <span>/</span>
            <span className="text-gray-900">{template?.name || "Записи"}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{template?.name}</h1>
        </div>

        {/* Тулбар */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex bg-gray-100/50 rounded-lg p-1 border border-gray-200">
            <button
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${currentView === "active" ? "bg-white shadow-sm text-indigo-700" : "text-gray-500 hover:text-gray-900"}`}
              onClick={() => {
                setCurrentView("active");
                setSelectedIds(new Set());
              }}
            >
              Активные ({activeRecords.length})
            </button>
            <button
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${currentView === "deleted" ? "bg-white shadow-sm text-indigo-700" : "text-gray-500 hover:text-gray-900"}`}
              onClick={() => {
                setCurrentView("deleted");
                setSelectedIds(new Set());
              }}
            >
              Удаленные ({deletedRecords.length})
            </button>
          </div>

          {currentView === "active" && (
            <button
              onClick={() => {
                setEditingRecord(null);
                setIsModalOpen(true);
              }}
              className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors shadow-sm"
            >
              + Добавить запись
            </button>
          )}
        </div>

        {/* Таблица */}
        <DataTable
          columns={tableColumns}
          data={currentList}
          selectedIds={selectedIds}
          getRowId={(row) => row.id || (row as any)._id || ""}
          onToggleSelect={(id) => {
            const newIds = new Set(selectedIds);
            newIds.has(id) ? newIds.delete(id) : newIds.add(id);
            setSelectedIds(newIds);
          }}
          onToggleSelectAll={() => {
            if (selectedIds.size === currentList.length)
              setSelectedIds(new Set());
            else
              setSelectedIds(
                new Set(currentList.map((r) => r.id || (r as any)._id || "")),
              );
          }}
          renderActions={(row) => {
            const rId = row.id || (row as any)._id || "";
            if (currentView === "active") {
              return (
                <div className="flex flex-col">
                  <button
                    onClick={() => {
                      setEditingRecord(row);
                      setIsModalOpen(true);
                    }}
                    className="px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleAction(rId, "delete")}
                    className="px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Удалить
                  </button>
                </div>
              );
            }
            return (
              <button
                onClick={() => handleAction(rId, "restore")}
                className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50"
              >
                Восстановить
              </button>
            );
          }}
        />
      </div>

      {/* Модалка с динамической формой */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !processing && setIsModalOpen(false)}
        title={editingRecord ? "Редактировать запись" : "Новая запись"}
      >
        <DynamicForm
          schema={template?.schema || {}}
          initialData={editingRecord?.data || {}}
          onSubmit={handleSave}
          onCancel={() => setIsModalOpen(false)}
          isProcessing={processing}
        />
      </Modal>
    </div>
  );
}
