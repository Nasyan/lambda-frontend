"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  notificationsApi,
  InboxItemResponse,
} from "@/src/features/notifications/api/notificationsApi";

interface InboxTabProps {
  instanceUuid: string;
}

export const InboxTab = ({ instanceUuid }: InboxTabProps) => {
  const [inbox, setInbox] = useState<InboxItemResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInbox = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationsApi.getInbox(instanceUuid);
      setInbox(data);
    } catch (error) {
      console.error("Ошибка загрузки колокольчика:", error);
    } finally {
      setLoading(false);
    }
  }, [instanceUuid]);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  const handleRead = async (uuid: string) => {
    try {
      await notificationsApi.markAsRead(instanceUuid, uuid);
      setInbox((prev) =>
        prev.map((item) =>
          item.uuid === uuid ? { ...item, is_read: true } : item,
        ),
      );
    } catch (error) {
      console.error("Ошибка смены статуса прочтения", error);
    }
  };

  return (
    <div className="space-y-3 max-w-2xl">
      {loading ? (
        <p className="text-gray-500 text-center py-6 text-sm">
          Проверка входящих событий...
        </p>
      ) : inbox.length === 0 ? (
        <div className="text-center py-10 bg-white border rounded-xl shadow-sm text-gray-400">
          📥{" "}
          <p className="text-sm mt-1">
            Уведомлений пока нет. Системные триггеры молчат.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {inbox.map((item) => (
            <div
              key={item.uuid}
              className={`border p-4 rounded-xl flex justify-between items-start transition ${
                item.is_read
                  ? "bg-white/70 shadow-none border-gray-200"
                  : "bg-gradient-to-r from-blue-50/70 to-white border-blue-200 shadow-sm"
              }`}
            >
              <div className="space-y-1">
                <h4
                  className={`text-sm font-semibold ${item.is_read ? "text-gray-700 line-through" : "text-blue-900"}`}
                >
                  {item.title}
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {item.body}
                </p>
                <p className="text-[10px] text-gray-400 font-mono mt-1">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
              {!item.is_read && (
                <button
                  onClick={() => handleRead(item.uuid)}
                  className="text-[11px] bg-blue-100 text-blue-700 hover:bg-blue-200 px-2.5 py-1 rounded-md font-semibold shrink-0 transition"
                >
                  Прочитать
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
