"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/src/shared/api/api-client";
import type { JsonValue } from "@/src/entities/template/model/types";

interface AdminInstance {
  uuid: string;
  title: string;
}

interface AdminCreator {
  uuid: string;
  email: string;
  active: boolean;
}

export default function AdminDashboard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [instances, setInstances] = useState<AdminInstance[]>([]);
  const [creators, setCreators] = useState<AdminCreator[]>([]);
  const [activeInstanceForImport, setActiveInstanceForImport] = useState<
    string | null
  >(null);

  // Стейты для форм
  const [newInstanceTitle, setNewInstanceTitle] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteInstanceId, setInviteInstanceId] = useState("");
  const [loading, setLoading] = useState(false);

  // Загрузка данных
  const fetchData = async () => {
    setLoading(true);
    try {
      const [instRes, creatRes] = await Promise.all([
        apiClient.get<AdminInstance[]>("/admin/instances/"),
        apiClient.get<AdminCreator[]>("/admin/creators/"),
      ]);
      setInstances(instRes.data);
      setCreators(creatRes.data);
    } catch (error) {
      console.error("Ошибка загрузки данных", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      router.push("/admin/login");
      return;
    }
    void Promise.resolve().then(fetchData);
  }, [router]);

  // Экшены управления инстансами
  const handleCreateInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post("/admin/instances/", { title: newInstanceTitle });
      setNewInstanceTitle("");
      await fetchData();
    } catch {
      alert("Не удалось создать инстанс");
    }
  };

  const handleDeleteInstance = async (id: string) => {
    if (!confirm("Вы уверены, что хотите безвозвратно удалить этот инстанс?"))
      return;
    try {
      await apiClient.delete(`/admin/instances/${id}/`);
      await fetchData();
    } catch {
      alert("Ошибка при деструкции инстанса");
    }
  };

  // Экшены Схемы (Импорт / Экспорт)
  const handleExportSchema = async (
    instanceUuid: string,
    instanceTitle: string,
  ) => {
    try {
      // Стучимся на созданный адаптивный эндпоинт
      const response = await apiClient.get<JsonValue>(
        `/instances/${instanceUuid}/schema/export`,
      );

      // Генерируем файл для скачивания на лету
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(response.data, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute(
        "download",
        `schema-${instanceTitle.toLowerCase().replace(/\s+/g, "-")}.json`,
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (error) {
      console.error(error);
      alert("Не удалось экспортировать схему инстанса.");
    }
  };

  const triggerFileInput = (instanceUuid: string) => {
    setActiveInstanceForImport(instanceUuid);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImportSchema = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeInstanceForImport) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const bundle: unknown = JSON.parse(event.target?.result as string);

        // Отправляем на наш адаптивный эндпоинт импорта
        await apiClient.post(
          `/instances/${activeInstanceForImport}/schema/import`,
          {
            bundle: bundle,
            mode: "merge", // Можно вынести в UI чекбокс merge/replace, если критично
            dry_run: false,
          },
        );

        alert("Схема успешно импортирована и применена!");
      } catch (error) {
        console.error(error);
        alert(
          "Ошибка импорта: невалидный JSON конфигурации или ошибка сервера.",
        );
      } finally {
        // Сбрасываем стейты
        setActiveInstanceForImport(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  // Экшены управления креаторами
  const handleInviteCreator = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post("/admin/invite-creator/", {
        email: inviteEmail,
        instance_id: inviteInstanceId,
      });
      setInviteEmail("");
      setInviteInstanceId("");
      alert("Инвайт успешно отправлен креатору!");
    } catch {
      alert("Ошибка отправки инвайта");
    }
  };

  const handleDeactivateCreator = async (id: string) => {
    if (!confirm("Деактивировать доступ креатора к платформе?")) return;
    try {
      await apiClient.patch(`/admin/creators/${id}/deactivate`);
      await fetchData();
    } catch {
      alert("Не удалось изменить статус пользователя");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 antialiased p-6 sm:p-10">
      {/* Скрытый инпут для импорта файлов схем */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportSchema}
        accept=".json"
        className="hidden"
      />

      <div className="max-w-7xl mx-auto">
        {/* Шапка Панели */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 block"></span>
              Административная панель управления
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Глобальный контроль инфраструктуры, инстансов и учетных записей
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors border border-red-200"
          >
            Выйти из системы <span>↳</span>
          </button>
        </header>

        {loading && (
          <div className="text-center text-sm text-indigo-600 font-medium mb-4 animate-pulse">
            Синхронизация данных с сервером...
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* КОЛОНКА ИНСТАНСОВ */}
          <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                📂 Инстансы окружения
                <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                  {instances.length}
                </span>
              </h2>
            </div>

            {/* Создание инстанса */}
            <form onSubmit={handleCreateInstance} className="mb-6 flex gap-2">
              <input
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 flex-grow outline-none transition-all"
                placeholder="Введите название нового инстанса..."
                value={newInstanceTitle}
                onChange={(e) => setNewInstanceTitle(e.target.value)}
                required
              />
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-5 py-2.5 rounded-lg transition-colors shadow-sm">
                + Создать
              </button>
            </form>

            {/* Список инстансов */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {instances.map((inst) => (
                <div
                  key={inst.uuid}
                  className="p-4 border border-gray-200 rounded-xl hover:border-indigo-200 bg-white transition-all shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div className="flex-grow min-w-0">
                    <div className="font-bold text-gray-900 truncate">
                      {inst.title}
                    </div>
                    <div className="text-xs text-gray-400 font-mono mt-1 select-all truncate">
                      {inst.uuid}
                    </div>
                  </div>

                  {/* Группа действий для инстанса */}
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => triggerFileInput(inst.uuid)}
                      className="bg-gray-50 hover:bg-indigo-50 text-indigo-600 border border-gray-200 hover:border-indigo-200 font-medium text-xs px-3 py-1.5 rounded-md transition-colors"
                      title="Загрузить JSON конфигурации схемы"
                    >
                      📥 Внос схемы
                    </button>
                    <button
                      onClick={() => handleExportSchema(inst.uuid, inst.title)}
                      className="bg-gray-50 hover:bg-indigo-50 text-indigo-600 border border-gray-200 hover:border-indigo-200 font-medium text-xs px-3 py-1.5 rounded-md transition-colors"
                      title="Выгрузить текущую конфигурацию"
                    >
                      📤 Вынос схемы
                    </button>
                    <button
                      onClick={() => handleDeleteInstance(inst.uuid)}
                      className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-all border border-transparent hover:border-red-100"
                      title="Удалить инстанс"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
              {instances.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">
                  Инстансы еще не созданы.
                </p>
              )}
            </div>
          </section>

          {/* КОЛОНКА КРЕАТОРОВ */}
          <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                👑 Креаторы (Владельцы)
                <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                  {creators.length}
                </span>
              </h2>
            </div>

            {/* Высылка приглашения */}
            <form
              onSubmit={handleInviteCreator}
              className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col gap-3"
            >
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Выдать доступ создателя
              </div>
              <input
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
                placeholder="Email будущего владельца"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
              <select
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
                value={inviteInstanceId}
                onChange={(e) => setInviteInstanceId(e.target.value)}
                required
              >
                <option value="" disabled>
                  Привязать к инстансу...
                </option>
                {instances.map((inst) => (
                  <option key={inst.uuid} value={inst.uuid}>
                    {inst.title}
                  </option>
                ))}
              </select>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm p-2.5 rounded-lg transition-colors shadow-2xs">
                Отправить инвайт-ссылку (24 часа)
              </button>
            </form>

            {/* Список креаторов */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {creators.map((cr) => (
                <div
                  key={cr.uuid}
                  className={`p-4 border rounded-xl flex justify-between items-center transition-all ${
                    cr.active
                      ? "bg-white border-gray-200 shadow-2xs"
                      : "bg-gray-50 border-gray-200 opacity-70"
                  }`}
                >
                  <div className="min-w-0 flex-grow">
                    <div className="font-semibold text-gray-900 truncate">
                      {cr.email}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${cr.active ? "bg-green-500" : "bg-gray-400"}`}
                      ></span>
                      <span className="text-xs text-gray-500">
                        {cr.active
                          ? "Аккаунт верифицирован"
                          : "Доступ заблокирован"}
                      </span>
                    </div>
                  </div>

                  {cr.active && (
                    <button
                      onClick={() => handleDeactivateCreator(cr.uuid)}
                      className="text-xs font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Отключить
                    </button>
                  )}
                </div>
              ))}
              {creators.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">
                  Креаторы отсутствуют.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
