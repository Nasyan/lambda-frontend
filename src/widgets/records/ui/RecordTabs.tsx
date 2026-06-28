"use client";

import { useEffect, useRef, useState } from "react";
import { useTemplateList } from "@/src/features/templates/model/template-cache";
import {
  useRecordWorkspace,
  type RecordDraft,
  type RecordDraftStatus,
} from "@/src/features/records/model/useRecordWorkspace";

const STATUS_BADGE: Record<RecordDraftStatus, { label: string; className: string }> =
  {
    editing: { label: "●", className: "text-gray-400" },
    saving: { label: "…", className: "text-indigo-500" },
    created: { label: "✓", className: "text-green-600" },
    error: { label: "!", className: "text-red-600" },
  };

/**
 * Вычисляет порядковый номер вкладки в рамках её шаблона (#1, #2, ...),
 * чтобы метка вкладки была стабильной и читаемой как в VS Code.
 */
const getPerTemplateIndex = (
  tabs: RecordDraft[],
  tab: RecordDraft,
): number => {
  let index = 0;
  for (const candidate of tabs) {
    if (candidate.templateUuid === tab.templateUuid) {
      index += 1;
    }
    if (candidate.id === tab.id) break;
  }
  return index;
};

export function RecordTabs() {
  const {
    tabs,
    activeTabId,
    setActiveTab,
    closeTab,
    duplicateTab,
    openTab,
  } = useRecordWorkspace();

  const { templates, loading: templatesLoading } = useTemplateList();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? null;

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <div className="flex items-stretch border-b border-gray-200 bg-gray-50">
      <div className="flex flex-1 items-stretch overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const badge = STATUS_BADGE[tab.status];
          const label = `${tab.templateName} #${getPerTemplateIndex(tabs, tab)}`;

          return (
            <div
              key={tab.id}
              className={`group flex shrink-0 items-center gap-2 border-r border-gray-200 px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-white font-medium text-gray-900"
                  : "text-gray-500 hover:bg-white/60 hover:text-gray-800"
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2"
                title={label}
              >
                <span className={badge.className} aria-hidden="true">
                  {badge.label}
                </span>
                <span className="max-w-[160px] truncate">{label}</span>
                {tab.dirty && tab.status === "editing" && (
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-indigo-500"
                    title="Несохранённые изменения"
                    aria-hidden="true"
                  />
                )}
              </button>
              <button
                type="button"
                onClick={() => closeTab(tab.id)}
                className="rounded px-1 text-gray-400 opacity-60 hover:bg-gray-100 hover:text-red-600 group-hover:opacity-100"
                title="Закрыть вкладку"
                aria-label="Закрыть вкладку"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      <div ref={menuRef} className="relative flex items-center">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="px-3 py-2 text-lg leading-none text-gray-500 hover:bg-white hover:text-gray-900"
          title="Новая вкладка"
          aria-label="Новая вкладка"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          +
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full z-20 mt-1 w-72 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          >
            {activeTab && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  duplicateTab(activeTab.id);
                  setMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Дублировать текущую: {activeTab.templateName}
              </button>
            )}

            <div className="my-1 border-t border-gray-100" />
            <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Открыть другую таблицу
            </p>

            {templatesLoading ? (
              <p className="px-4 py-2 text-sm text-gray-400">Загрузка...</p>
            ) : templates.length === 0 ? (
              <p className="px-4 py-2 text-sm text-gray-400">
                Нет доступных таблиц
              </p>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      openTab(template.id, template.name);
                      setMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
