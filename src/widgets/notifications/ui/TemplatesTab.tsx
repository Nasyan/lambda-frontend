"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  notificationsApi,
  TemplateResponse,
  TemplateCreate,
  CrmTemplateMetadata,
} from "@/src/features/notifications/api/notificationsApi";
import { TemplateModal } from "./TemplateModal";

interface TemplatesTabProps {
  instanceUuid: string;
  crmTemplates: CrmTemplateMetadata[];
}

export const TemplatesTab = ({
  instanceUuid,
  crmTemplates,
}: TemplatesTabProps) => {
  const [templates, setTemplates] = useState<TemplateResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name:asc");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<TemplateResponse | null>(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationsApi.getTemplates(
        instanceUuid,
        search,
        sortBy,
      );
      setTemplates(data);
    } catch (error) {
      console.error("Ошибка загрузки макросов:", error);
    } finally {
      setLoading(false);
    }
  }, [instanceUuid, search, sortBy]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleSave = async (data: TemplateCreate) => {
    if (editingTemplate) {
      await notificationsApi.updateTemplate(
        instanceUuid,
        editingTemplate.uuid,
        data,
      );
    } else {
      await notificationsApi.createTemplate(instanceUuid, data);
    }
    loadTemplates();
  };

  const handleDelete = async (uuid: string) => {
    if (
      !confirm(
        "Удалить воркфлоу-шаблон? Связанные триггеры автоматизации перестанут срабатывать.",
      )
    )
      return;
    try {
      await notificationsApi.deleteTemplate(instanceUuid, uuid);
      loadTemplates();
    } catch (error) {
      alert("Ошибка удаления");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex flex-1 gap-2">
          <input
            type="text"
            placeholder="Поиск шаблонов движка..."
            className="border p-2 rounded-lg text-sm w-full max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border p-2 rounded-lg text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name:asc">Имя: А-Я</option>
            <option value="name:desc">Имя: Я-А</option>
            <option value="created_at:desc">Сначала новые</option>
          </select>
        </div>
        <button
          onClick={() => {
            setEditingTemplate(null);
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm"
        >
          + Зарегистрировать шаблон
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center py-6">
          Синхронизация с реестром...
        </p>
      ) : templates.length === 0 ? (
        <p className="text-gray-500 italic text-center py-6">
          Макро-шаблоны автоматизации не найдены.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => {
            const connectedCrm = crmTemplates.find(
              (c) => c._id === tpl.source_template_uuid,
            );
            return (
              <div
                key={tpl.uuid}
                className="border rounded-xl p-5 bg-white shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="font-bold text-gray-900 leading-tight truncate">
                      {tpl.name}
                    </h3>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setEditingTemplate(tpl);
                          setIsModalOpen(true);
                        }}
                        className="text-indigo-600 text-xs font-semibold hover:underline"
                      >
                        Ред.
                      </button>
                      <button
                        onClick={() => handleDelete(tpl.uuid)}
                        className="text-red-500 text-xs font-semibold hover:underline"
                      >
                        Удал.
                      </button>
                    </div>
                  </div>

                  {connectedCrm && (
                    <div className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md inline-block mb-3 font-medium">
                      Сущность: {connectedCrm.name}
                    </div>
                  )}

                  <div className="text-xs space-y-1.5 text-gray-700">
                    <p className="bg-gray-50 p-1.5 rounded border font-medium">
                      📜 {tpl.title}
                    </p>
                    <p className="text-gray-500 text-xs line-clamp-2 font-mono bg-gray-50/50 p-1.5 rounded">
                      {tpl.body}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t flex justify-between items-center text-[10px]">
                  <span className="text-gray-400 font-mono">
                    Тип получателей:{" "}
                    <b className="text-gray-700 font-sans uppercase">
                      {tpl.recipients_config.type}
                    </b>
                  </span>
                  <div className="flex gap-1">
                    {tpl.channels.map((ch) => (
                      <span
                        key={ch}
                        className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded text-[9px] font-bold uppercase"
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingTemplate}
        crmTemplates={crmTemplates}
      />
    </div>
  );
};
