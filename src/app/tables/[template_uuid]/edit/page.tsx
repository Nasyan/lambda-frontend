"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { templateApi } from "@/src/features/templates/api/template-api";
import { getInstanceUuidFromAccessToken } from "@/src/shared/lib/session";
import { TemplateEditorWorkspace } from "@/src/widgets/templates/ui/TemplateEditorWorkspace";
import type { TemplateResponse } from "@/src/entities/template/model/types";

export default function EditTemplatePage() {
  const params = useParams();
  const templateUuid = params.template_uuid as string;
  const instanceUuid = getInstanceUuidFromAccessToken();

  const [template, setTemplate] = useState<TemplateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTemplate() {
      if (!instanceUuid || !templateUuid) return;
      try {
        const data = await templateApi.getTemplate(instanceUuid, templateUuid);
        setTemplate(data);
      } catch {
        setError("Не удалось загрузить схему No-Code таблицы.");
      } finally {
        setIsLoading(false);
      }
    }
    loadTemplate();
  }, [instanceUuid, templateUuid]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-sm font-medium text-gray-500 animate-pulse">
          Загрузка структуры конструктора...
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-sm font-medium text-red-500">
          {error ?? "Таблица не найдена"}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      <TemplateEditorWorkspace isEdit={true} initialData={template} />
    </div>
  );
}
