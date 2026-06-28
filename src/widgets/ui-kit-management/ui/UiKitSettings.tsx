import { useState, useEffect } from "react";
import { UiKitItem } from "@/src/entities/user/model/types";

interface Props {
  favorites: UiKitItem[];
  onAddFavorite: (item: UiKitItem) => Promise<void>;
  onRemoveFavorite: (uuid: string) => Promise<void>;
  onUpdatePosition: (
    uuid: string,
    position: { x: number; y: number },
  ) => Promise<void>;
  onClearAll: () => Promise<void>;
}

// Вспомогательный интерфейс для хранения черновиков координат в стейте
interface DraftPositions {
  [uuid: string]: { x: number; y: number };
}

export const UiKitSettings = ({
  favorites,
  onAddFavorite,
  onRemoveFavorite,
  onUpdatePosition,
  onClearAll,
}: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingPositions, setIsSavingPositions] = useState(false);

  // Локальный стейт для измененных координат (черновик)
  const [draftPositions, setDraftPositions] = useState<DraftPositions>({});

  // Синхронизируем черновик, если список favorites пришел измененным извне (например, добавили или удалили элемент)
  useEffect(() => {
    const initialDrafts: DraftPositions = {};
    favorites.forEach((item) => {
      initialDrafts[item.uuid] = { x: item.position.x, y: item.position.y };
    });
    setDraftPositions(initialDrafts);
  }, [favorites]);

  const handleAddMockItem = async () => {
    setIsSubmitting(true);
    try {
      const newItem: UiKitItem = {
        uuid: crypto.randomUUID(),
        type: "template",
        subtype: "tables",
        position: { x: 0, y: 0 },
      };
      await onAddFavorite(newItem);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Меняем только локальный черновик при вводе цифр
  const handleInputChange = (uuid: string, axis: "x" | "y", value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;

    setDraftPositions((prev) => ({
      ...prev,
      [uuid]: {
        ...prev[uuid],
        [axis]: numValue,
      },
    }));
  };

  // Вычисляем, какие элементы действительно были изменены по сравнению с пропсами
  const getChangedItems = (): {
    uuid: string;
    position: { x: number; y: number };
  }[] => {
    return favorites
      .filter((item) => {
        const draft = draftPositions[item.uuid];
        if (!draft) return false;
        return draft.x !== item.position.x || draft.y !== item.position.y;
      })
      .map((item) => ({
        uuid: item.uuid,
        position: draftPositions[item.uuid],
      }));
  };

  const changedItems = getChangedItems();
  const hasChanges = changedItems.length > 0;

  // Сохранение измененных позиций
  const handleSavePositions = async () => {
    if (!hasChanges) return;

    setIsSavingPositions(true);
    try {
      // Запускаем параллельные запросы на бэкенд только для измененных элементов
      await Promise.all(
        changedItems.map((item) => onUpdatePosition(item.uuid, item.position)),
      );
    } catch (error) {
      console.error("Ошибка при сохранении позиций:", error);
    } finally {
      setIsSavingPositions(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b pb-4">
        <div className="flex flex-col">
          <h3 className="text-lg font-medium text-gray-900">
            Настройки UI-Kit (Избранное)
          </h3>
          {hasChanges && (
            <span className="text-xs text-amber-600 font-medium mt-0.5">
              Есть несохраненные изменения позиций ({changedItems.length})
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          {favorites.length > 0 && (
            <button
              onClick={() => onClearAll()}
              disabled={isSavingPositions || isSubmitting}
              className="px-3 py-1.5 text-sm rounded-md border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Очистить всё
            </button>
          )}

          {/* КНОПКА СОХРАНИТЬ (активна только если есть изменения) */}
          <button
            onClick={handleSavePositions}
            disabled={!hasChanges || isSavingPositions}
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
              hasChanges
                ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isSavingPositions ? "Сохранение..." : "Сохранить позиции"}
          </button>

          <button
            onClick={handleAddMockItem}
            disabled={isSubmitting || isSavingPositions}
            className="bg-indigo-600 text-white px-3 py-1.5 text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSubmitting ? "Добавление..." : "+ Добавить виджет"}
          </button>
        </div>
      </div>

      {favorites.length === 0 ? (
        <p className="text-gray-500 text-sm py-4">Ваш UI-kit пока пуст.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {favorites.map((item) => {
            // Берем значения из черновика, если они там есть, иначе из оригинала
            const currentX = draftPositions[item.uuid]?.x ?? item.position.x;
            const currentY = draftPositions[item.uuid]?.y ?? item.position.y;

            // Проверяем, изменен ли конкретно этот элемент, для подсветки бордера
            const isItemChanged =
              currentX !== item.position.x || currentY !== item.position.y;

            return (
              <li
                key={item.uuid}
                className={`p-4 border rounded-lg bg-gray-50 flex flex-col justify-between h-full shadow-sm transition-all ${
                  isItemChanged
                    ? "border-amber-400 bg-amber-50/30 ring-1 ring-amber-400"
                    : "border-gray-200"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="inline-block px-2 py-1 text-xs font-semibold bg-indigo-100 text-indigo-800 rounded">
                      {item.type}
                    </span>
                    <button
                      onClick={() => onRemoveFavorite(item.uuid)}
                      className="text-gray-400 hover:text-red-600 font-bold text-sm transition-colors"
                      title="Удалить виджет"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-sm text-gray-700">
                    <strong>Subtype:</strong> {item.subtype}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 truncate">
                    ID: {item.uuid}
                  </p>

                  {/* Блок ручного ввода координат */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      Позиция на сетке:
                    </p>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1.5">
                        <label className="text-xs text-gray-500 font-semibold">
                          X:
                        </label>
                        <input
                          type="number"
                          value={currentX}
                          onChange={(e) =>
                            handleInputChange(item.uuid, "x", e.target.value)
                          }
                          className="w-16 px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                          min={0}
                        />
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <label className="text-xs text-gray-500 font-semibold">
                          Y:
                        </label>
                        <input
                          type="number"
                          value={currentY}
                          onChange={(e) =>
                            handleInputChange(item.uuid, "y", e.target.value)
                          }
                          className="w-16 px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                          min={0}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
