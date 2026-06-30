"use client";

import React, { useEffect, useState } from "react";
import { AppSidebar } from "@/src/widgets/app-sidebar/ui/AppSidebar";
import {
  notificationsApi,
  CrmTemplateMetadata,
} from "@/src/features/notifications/api/notificationsApi";
import { getInstanceUuidFromAccessToken } from "@/src/shared/lib/session";
import { TemplatesTab } from "./TemplatesTab";
import { InboxTab } from "./InboxTab";

export const NotificationWorkspace = () => {
  const [instanceUuid, setInstanceUuid] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"templates" | "inbox">("inbox");
  const [crmTemplates, setCrmTemplates] = useState<CrmTemplateMetadata[]>([]);

  useEffect(() => {
    const uuid = getInstanceUuidFromAccessToken();
    setInstanceUuid(uuid);

    if (uuid) {
      notificationsApi
        .getCrmTemplates(uuid)
        .then((data) => setCrmTemplates(data))
        .catch((err) => console.error("Ошибка загрузки контекста таблиц", err));
    }
  }, []);

  if (!instanceUuid) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <AppSidebar />
        <div className="p-8 text-sm text-gray-500">Авторизация инстанса...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-950 md:flex w-full">
      <AppSidebar />
      <main className="flex-1 max-w-6xl p-8 mx-auto w-full">
        <div className="mb-6 border-b pb-4">
          <h1 className="text-3xl font-black tracking-tight text-gray-900">
            Workflow-Оповещения
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Оркестрация системных уведомлений и реактивного макро-движка
          </p>
        </div>

        {/* Переключатель табов */}
        <div className="flex gap-6 mb-6 border-b text-sm font-medium">
          <button
            onClick={() => setActiveTab("inbox")}
            className={`pb-2 transition relative ${
              activeTab === "inbox"
                ? "text-indigo-600 border-b-2 border-indigo-600 font-bold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            🔔 Мой Колокольчик
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`pb-2 transition relative ${
              activeTab === "templates"
                ? "text-indigo-600 border-b-2 border-indigo-600 font-bold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            ⚙️ Реестр шаблонов (Админка Creator)
          </button>
        </div>

        {/* Контент соответствующего таба */}
        {activeTab === "templates" && (
          <TemplatesTab
            instanceUuid={instanceUuid}
            crmTemplates={crmTemplates}
          />
        )}
        {activeTab === "inbox" && <InboxTab instanceUuid={instanceUuid} />}
      </main>
    </div>
  );
};
