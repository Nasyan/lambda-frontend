"use client";

import { useState, useEffect } from "react";
import { settingsApi } from "@/src/shared/api/settings-api";
import {
  SettingsContextResponse,
  UiKitItem,
} from "@/src/entities/user/model/types";

import { ProfileSettings } from "@/src/widgets/profile-management/ui/ProfileSettings";
import { TeamSettings } from "@/src/widgets/team-management/ui/TeamSettings";
import { UiKitSettings } from "@/src/widgets/ui-kit-management/ui/UiKitSettings";

type TabType = "profile" | "team" | "ui";

export function SettingsWorkspace() {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [contextData, setContextData] =
    useState<SettingsContextResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContext = async () => {
      try {
        let data = await settingsApi.getMyContext();

        if (data.profile.role === "CREATOR") {
          try {
            data = await settingsApi.getCreatorContext();
          } catch (err) {
            console.error(
              "Ошибка при получении контекста креатора, используем базовый",
              err,
            );
          }
        }

        // Автоматически размечаем "is_current_user" для таблицы команды
        if (data && data.team) {
          data.team = data.team.map((member) => ({
            ...member,
            is_current_user: member.uuid === data.profile.uuid,
          }));
        }

        setContextData(data);
      } catch (error) {
        console.error("Ошибка инициализации настроек:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContext();
  }, []);

  // Вспомогательный геттер для получения текущих favorites
  const getCurrentFavorites = (): UiKitItem[] => {
    return contextData?.profile?.settings?.ui_kits?.favorites || [];
  };

  // Вспомогательный сеттер для обновления favorites в глубоком стейте
  const updateLocalFavorites = (updatedFavorites: UiKitItem[]) => {
    if (!contextData) return;
    setContextData({
      ...contextData,
      profile: {
        ...contextData.profile,
        settings: {
          ...contextData.profile.settings,
          ui_kits: {
            favorites: updatedFavorites,
          },
        },
      },
    });
  };

  const handleAddUiKitItem = async (newItem: UiKitItem) => {
    if (!contextData) return;
    await settingsApi.addUiKitItem(newItem);

    const updated = [...getCurrentFavorites(), newItem];
    updateLocalFavorites(updated);
  };

  const handleRemoveUiKitItem = async (uuid: string) => {
    if (!contextData) return;
    await settingsApi.removeUiKitItem(uuid);

    const updated = getCurrentFavorites().filter((item) => item.uuid !== uuid);
    updateLocalFavorites(updated);
  };

  const handleUpdatePosition = async (
    uuid: string,
    position: { x: number; y: number },
  ) => {
    if (!contextData) return;
    await settingsApi.updateUiKitItemPosition(uuid, position);

    const updated = getCurrentFavorites().map((item) =>
      item.uuid === uuid ? { ...item, position } : item,
    );
    updateLocalFavorites(updated);
  };

  const handleClearUiKit = async () => {
    if (!contextData) return;
    await settingsApi.clearUiKit();
    updateLocalFavorites([]);
  };

  const handleInviteUser = async (email: string) => {
    if (!contextData) return;
    try {
      await settingsApi.inviteUser(email);
      alert(`Инвайт успешно отправлен на ${email}`);
      // Локальный стейт не меняем, так как юзер появится в таблице только после регистрации
    } catch (error) {
      console.error("Ошибка при приглашении:", error);
      alert("Не удалось отправить инвайт.");
    }
  };

  const handlePromoteUser = async (uuid: string) => {
    if (!contextData) return;
    try {
      await settingsApi.promoteToCreator(uuid);
      setContextData({
        ...contextData,
        team: contextData.team.map((m) =>
          m.uuid === uuid ? { ...m, role: "CREATOR" } : m,
        ),
      });
    } catch (error) {
      console.error("Ошибка при повышении:", error);
    }
  };

  const handleDemoteUser = async (uuid: string) => {
    if (!contextData) return;
    try {
      await settingsApi.demoteToUser(uuid);
      setContextData({
        ...contextData,
        team: contextData.team.map((m) =>
          m.uuid === uuid ? { ...m, role: "USER", allowed_tools: [] } : m,
        ),
      });
    } catch (error) {
      console.error("Ошибка при понижении:", error);
    }
  };

  const handleUpdatePermissions = async (uuid: string, tools: string[]) => {
    if (!contextData) return;
    try {
      const res = await settingsApi.updateUserPermissions(uuid, tools);
      setContextData({
        ...contextData,
        team: contextData.team.map((m) =>
          m.uuid === uuid ? { ...m, allowed_tools: res.allowed_tools } : m,
        ),
      });
    } catch (error) {
      console.error("Ошибка при обновлении прав:", error);
    }
  };

  const handleDeactivateUser = async (uuid: string) => {
    if (!contextData) return;
    if (!confirm("Вы уверены, что хотите деактивировать этого пользователя?"))
      return;
    try {
      await settingsApi.deactivateUser(uuid);
      // Удаляем пользователя из локального списка или помечаем как неактивного
      setContextData({
        ...contextData,
        team: contextData.team.filter((m) => m.uuid !== uuid),
      });
    } catch (error) {
      console.error("Ошибка при деактивации:", error);
    }
  };

  const tabs = [
    { id: "profile", label: "Профиль" },
    { id: "team", label: "Команда" },
    { id: "ui", label: "Интерфейс (UI)" },
  ] as const;

  if (isLoading) {
    return (
      <div className="animate-pulse p-6 bg-white rounded-xl">
        Загрузка настроек...
      </div>
    );
  }

  if (!contextData) {
    return (
      <div className="text-red-500">Не удалось загрузить данные профиля.</div>
    );
  }

  const isCreator = contextData.profile.role === "CREATOR";

  return (
    <div className="w-full space-y-6">
      {/* Шапка */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-950">
          Settings
        </h1>
        <p className="text-sm text-gray-500">
          Управление вашим аккаунтом, командой и интерфейсом.
        </p>
      </div>

      {/* Навигация */}
      <div className="flex space-x-2 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-all border-b-2 -mb-[2px] ${
              activeTab === tab.id
                ? "border-gray-900 text-gray-900 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Контент */}
      <div className="mt-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm min-h-[400px]">
        {activeTab === "profile" && (
          <ProfileSettings profile={contextData.profile} />
        )}
        {activeTab === "team" && (
          <TeamSettings
            team={contextData.team}
            isCreator={isCreator}
            onInvite={handleInviteUser}
            onPromote={handlePromoteUser}
            onDemote={handleDemoteUser}
            onUpdatePermissions={handleUpdatePermissions}
            onDeactivate={handleDeactivateUser}
          />
        )}
        {activeTab === "ui" && (
          <UiKitSettings
            favorites={getCurrentFavorites()}
            onAddFavorite={handleAddUiKitItem}
            onRemoveFavorite={handleRemoveUiKitItem}
            onUpdatePosition={handleUpdatePosition}
            onClearAll={handleClearUiKit}
          />
        )}
      </div>
    </div>
  );
}
