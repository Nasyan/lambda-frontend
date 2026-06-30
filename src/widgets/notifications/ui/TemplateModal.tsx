"use client";

import React, { useEffect, useState } from "react";
import {
  TemplateResponse,
  TemplateCreate,
  CrmTemplateMetadata,
  RecipientConfigType,
} from "@/src/features/notifications/api/notificationsApi";

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TemplateCreate) => Promise<void>;
  initialData?: TemplateResponse | null;
  crmTemplates: CrmTemplateMetadata[];
}

export const TemplateModal = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  crmTemplates,
}: TemplateModalProps) => {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [channels, setChannels] = useState<string[]>(["crm"]);
  const [sourceTemplateUuid, setSourceTemplateUuid] = useState<string>("");

  const [recipientType, setRecipientType] =
    useState<RecipientConfigType>("users");
  const [staticUuids, setStaticUuids] = useState("");
  const [fieldPath, setFieldPath] = useState("{{responsible_user_uuid}}");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setTitle(initialData.title);
      setBody(initialData.body);
      setChannels(initialData.channels);
      setSourceTemplateUuid(initialData.source_template_uuid || "");
      setRecipientType(initialData.recipients_config.type);

      if (initialData.recipients_config.user_uuids) {
        setStaticUuids(initialData.recipients_config.user_uuids.join(", "));
      } else if (initialData.recipients_config.uuids) {
        setStaticUuids(initialData.recipients_config.uuids.join(", "));
      } else {
        setStaticUuids("");
      }
      setFieldPath(
        initialData.recipients_config.field_path || "{{responsible_user_uuid}}",
      );
    } else {
      setName("");
      setTitle("");
      setBody("");
      setChannels(["crm"]);
      setSourceTemplateUuid(crmTemplates[0]?._id || "");
      setRecipientType("users");
      setStaticUuids("");
      setFieldPath("{{responsible_user_uuid}}");
    }
  }, [initialData, isOpen, crmTemplates]);

  if (!isOpen) return null;

  const handleChannelChange = (channel: string) => {
    setChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const recipients_config: TemplateCreate["recipients_config"] = {
      type: recipientType,
    };

    const parsedUuids = staticUuids
      .split(",")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (recipientType === "users") {
      recipients_config.user_uuids = parsedUuids;
    } else if (recipientType === "static") {
      recipients_config.uuids = parsedUuids;
    } else if (recipientType === "field_path") {
      recipients_config.field_path = fieldPath;
    }

    const payload: TemplateCreate = {
      name,
      title,
      body,
      channels,
      source_template_uuid: sourceTemplateUuid || null,
      recipients_config,
    };

    try {
      await onSave(payload);
      onClose();
    } catch (err: any) {
      alert(
        `Ошибка валидации Integrity движком: ${err?.response?.data?.text || "Проверьте маски переменных"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedCrm = crmTemplates.find((t) => t._id === sourceTemplateUuid);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 my-8 border">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">
          {initialData
            ? "Редактирование макро-шаблона"
            : "Регистрация нового воркфлоу-шаблона"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Техническое имя (в админке)
              </label>
              <input
                type="text"
                required
                className="mt-1 w-full border p-2 rounded-lg bg-gray-50 focus:bg-white"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Напр., Смена статуса сделки"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Каналы дистрибуции
              </label>
              <div className="mt-3 flex gap-4 text-sm">
                {["crm", "email", "telegram"].map((ch) => (
                  <label
                    key={ch}
                    className="flex items-center gap-2 cursor-pointer capitalize"
                  >
                    <input
                      type="checkbox"
                      checked={channels.includes(ch)}
                      onChange={() => handleChannelChange(ch)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    {ch}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-amber-50/50 border border-amber-200/60 p-4 rounded-xl">
            <label className="block text-sm font-semibold text-amber-900">
              Связать со схемой CRM-таблицы
            </label>
            <select
              required
              className="mt-1 w-full border border-amber-200 p-2 rounded-lg bg-white text-sm"
              value={sourceTemplateUuid}
              onChange={(e) => setSourceTemplateUuid(e.target.value)}
            >
              <option value="">-- Выберите сущность-источник --</option>
              {crmTemplates.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} (Mongo ID: {t._id})
                </option>
              ))}
            </select>
            <p className="text-xs text-amber-700 mt-1">
              Движок парсит переменные из полей этой таблицы для предотвращения
              некорректных макросов до записи в БД.
            </p>
          </div>

          <div className="border p-4 rounded-xl bg-gray-50 space-y-3">
            <label className="block text-sm font-semibold text-gray-800">
              Стратегия вычисления получателей
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs font-medium">
              {[
                { id: "users", label: "Список User UUID" },
                { id: "field_path", label: "Динамически из карточки" },
                { id: "all_employees", label: "Вся команда (Bulk)" },
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() =>
                    setRecipientType(type.id as RecipientConfigType)
                  }
                  className={`p-2 rounded-lg border text-center transition ${
                    recipientType === type.id
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {recipientType === "users" && (
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  UUID сотрудников через запятую
                </label>
                <textarea
                  rows={2}
                  className="mt-1 w-full border p-2 rounded text-xs bg-white"
                  value={staticUuids}
                  onChange={(e) => setStaticUuids(e.target.value)}
                  placeholder="3fa85f64-5717-4562-b3fc-2c963f66afa6, ..."
                />
              </div>
            )}

            {recipientType === "field_path" && (
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Путь к полю с UUID ответственного
                </label>
                <input
                  type="text"
                  className="mt-1 w-full border p-2 rounded text-xs bg-white font-mono"
                  value={fieldPath}
                  onChange={(e) => setFieldPath(e.target.value)}
                  placeholder="{{responsible_user_uuid}}"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Бэкенд извлечет ID менеджера прямо из изменяемого документа.
                </p>
              </div>
            )}

            {recipientType === "all_employees" && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                ⚡ Режим массового вещания. Автоматически создаст задачи в
                колокольчик всем активным сотрудникам инстанса.
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Шаблон темы сообщения
              </label>
              <input
                type="text"
                required
                className="mt-1 w-full border p-2 rounded-lg font-medium"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Напр: Клиент {{name}} перешел на стадию выигран"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Тело уведомления
              </label>
              <textarea
                required
                rows={3}
                className="mt-1 w-full border p-2 rounded-lg font-mono text-sm"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Текст поддерживает любые маски полей. Напр: Менеджер, проверьте бюджет {{budget}} руб."
              />
            </div>

            {selectedCrm && (
              <div className="text-xs bg-gray-100 p-2 rounded-lg">
                <span className="font-semibold text-gray-600">
                  Доступные маски для сущности "{selectedCrm.name}":{" "}
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Object.keys(selectedCrm.schema || {}).map((field) => (
                    <code
                      key={field}
                      className="px-1.5 py-0.5 bg-white border rounded text-indigo-600 font-mono"
                    >
                      {"{{"}
                      {field}
                      {"}}"}
                    </code>
                  ))}
                  <code className="px-1.5 py-0.5 bg-white border rounded text-green-600 font-mono">
                    {"{{status}}"}
                  </code>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium shadow-sm"
            >
              {loading ? "Валидация Integrity..." : "Сохранить макрос"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
