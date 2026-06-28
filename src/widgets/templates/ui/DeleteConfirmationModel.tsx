"use client";

import React, { useState, useEffect } from "react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  mode: "single" | "bulk";
  templateName?: string;
  bulkCount?: number;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  mode,
  templateName = "",
  bulkCount = 0,
}: DeleteConfirmationModalProps) {
  const [inputValue, setInputValue] = useState("");

  // Формируем ожидаемую фразу в зависимости от режима
  const expectedPhrase =
    mode === "single"
      ? `i delete ${templateName}`
      : `i delete ${bulkCount} templates`;

  // Сбрасываем инпут при закрытии/открытии модалки
  useEffect(() => {
    if (!isOpen) setInputValue("");
  }, [isOpen]);

  if (!isOpen) return null;

  const isMatched = inputValue.trim() === expectedPhrase;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm pointer-events-auto">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-gray-950">
          Безвозвратное удаление
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Это действие абсолютно необратимо. Будут каскадно уничтожены все
          связанные записи и история изменений.
        </p>

        <div className="mt-4 rounded-lg bg-gray-50 p-3 border border-gray-100">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
            Для подтверждения введите фразу:
          </p>
          <p className="mt-1 font-mono text-sm font-semibold text-red-600 select-all">
            {expectedPhrase}
          </p>
        </div>

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Введите проверочную фразу"
          className="mt-4 h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-red-300 focus:ring-1 focus:ring-red-300"
        />

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Отмена
          </button>
          <button
            onClick={() => {
              if (isMatched) {
                onConfirm();
                onClose();
              }
            }}
            disabled={!isMatched}
            className="h-10 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Удалить навсегда
          </button>
        </div>
      </div>
    </div>
  );
}
