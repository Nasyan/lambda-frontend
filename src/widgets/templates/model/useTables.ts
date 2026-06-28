import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { templateApi } from "@/src/features/templates/api/template-api";
import {
  getAccessToken,
  getInstanceUuidFromAccessToken,
} from "@/src/shared/lib/session";
import type { TemplateResponse } from "@/src/entities/template/model/types";

// Интерфейс для управления состоянием модального окна подтверждения
interface ConfirmModalState {
  isOpen: boolean;
  mode: "single" | "bulk";
  templateId?: string;
  templateName?: string;
}

export function useTables() {
  const router = useRouter();
  const [instanceUuid, setInstanceUuid] = useState<string | null>(null);

  // Списки таблиц
  const [activeTables, setActiveTables] = useState<TemplateResponse[]>([]);
  const [deletedTables, setDeletedTables] = useState<TemplateResponse[]>([]);

  // Состояния UI
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [currentView, setCurrentView] = useState<"active" | "deleted">(
    "active",
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Выделение и меню
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Новое: Состояние для модалки GitHub-style подтверждения
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    mode: "single",
  });

  // Инициализация токена и инстанса
  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      if (!getAccessToken()) {
        router.push("/login");
        return;
      }
      const tokenInstanceUuid = getInstanceUuidFromAccessToken();
      if (!tokenInstanceUuid) {
        setLoading(false);
        return;
      }
      setInstanceUuid(tokenInstanceUuid);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Загрузка данных
  const loadData = useCallback(async () => {
    if (!instanceUuid) return;
    setLoading(true);
    try {
      const active = await templateApi.getTemplates(instanceUuid);
      const deleted = await templateApi.getDeletedTemplates(instanceUuid);
      setActiveTables(active);
      setDeletedTables(deleted);
    } catch (error) {
      console.error("Ошибка загрузки таблиц:", error);
    } finally {
      setLoading(false);
    }
  }, [instanceUuid]);

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, [loadData]);

  // Фильтрация списков по поисковому запросу
  const currentList = currentView === "active" ? activeTables : deletedTables;
  const filteredList = currentList.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // --- Логика выделения строк ---
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredList.length && filteredList.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredList.map((t) => t.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  // --- Массовые действия ---
  const handleBulkDeleteOrArchive = async () => {
    if (!instanceUuid || selectedIds.size === 0) return;
    setProcessing(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          templateApi.deleteTemplate(instanceUuid, id),
        ),
      );
      setSelectedIds(new Set());
      setBulkMenuOpen(false);
      await loadData();
    } catch (error) {
      console.error("Ошибка при массовом удалении:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkRestore = async () => {
    if (!instanceUuid || selectedIds.size === 0) return;
    setProcessing(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          templateApi.restoreTemplate(instanceUuid, id),
        ),
      );
      setSelectedIds(new Set());
      setBulkMenuOpen(false);
      await loadData();
    } catch (error) {
      console.error("Ошибка при массовом восстановлении:", error);
    } finally {
      setProcessing(false);
    }
  };

  // Безопасный триггер: вместо удаления сначала открывает модалку для множества строк
  const handleBulkForceDelete = () => {
    if (selectedIds.size === 0) return;
    setConfirmModal({
      isOpen: true,
      mode: "bulk",
    });
  };

  // Физическое массовое удаление (вызывается из модалки после успешного ввода фразы)
  const executeBulkForceDelete = async () => {
    if (!instanceUuid || selectedIds.size === 0) return;
    setProcessing(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          templateApi.forceDeleteTemplate(instanceUuid, id),
        ),
      );
      setSelectedIds(new Set());
      setBulkMenuOpen(false);
      await loadData();
    } catch (error) {
      console.error("Ошибка при жестком удалении:", error);
    } finally {
      setProcessing(false);
    }
  };

  // --- Одиночные действия строки ---

  // Физическое одиночное удаление (вызывается из модалки после успешного ввода фразы)
  const executeSingleForceDelete = async (id: string) => {
    if (!instanceUuid) return;
    setProcessing(true);
    try {
      await templateApi.forceDeleteTemplate(instanceUuid, id);
      await loadData();
    } catch (error) {
      console.error("Ошибка при жестком удалении строки:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleRowAction = async (id: string, action: string) => {
    if (!instanceUuid) return;
    setOpenDropdownId(null);

    // Перехватываем force_delete и открываем модалку подтверждения текста
    if (action === "force_delete") {
      const targetTable = filteredList.find((t) => t.id === id);
      setConfirmModal({
        isOpen: true,
        mode: "single",
        templateId: id,
        templateName: targetTable?.name || "Unknown",
      });
      return;
    }

    try {
      if (action === "edit") {
        router.push(`/tables/${id}/edit`);
      } else if (action === "delete" || action === "archive") {
        setProcessing(true);
        await templateApi.deleteTemplate(instanceUuid, id);
        await loadData();
      } else if (action === "restore") {
        setProcessing(true);
        await templateApi.restoreTemplate(instanceUuid, id);
        await loadData();
      } else if (action === "to_records") {
        router.push(`/tables/${id}/records`);
      } else if (action === "to_workflow") {
        router.push(`/tables/${id}/workflow`);
      } else if (action === "to_table") {
        router.push(`/tables/${id}/list`);
      }
    } catch (error) {
      console.error(`Ошибка выполнения действия [${action}]:`, error);
    } finally {
      setProcessing(false);
    }
  };

  return {
    activeTables,
    deletedTables,
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
    toggleSelectAll,
    toggleSelect,
    handleBulkDeleteOrArchive,
    handleBulkRestore,
    handleRowAction,
    confirmModal,
    setConfirmModal,
    handleBulkForceDelete, // Маппим старое название на безопасный триггер модалки
    executeBulkForceDelete,
    executeSingleForceDelete,
  };
}
