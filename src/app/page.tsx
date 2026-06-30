"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../shared/api/api-client";
import { AppSidebar } from "@/src/widgets/app-sidebar/ui/AppSidebar";

interface InstanceUser {
  uuid: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "CREATOR" | "USER" | "CLIENT";
  active: boolean;
  allowed_tools: string[];
}

export default function CRMDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<InstanceUser[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get<InstanceUser[]>("/creator/users");
      setUsers(response.data);
    } catch (err) {
      console.error("Ошибка при получении списка сотрудников:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      router.push("/login");
      return;
    }
    void Promise.resolve().then(fetchUsers);
  }, [router]);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // БЕЗ СЛЭША В КОНЦЕ
      await apiClient.post("/creator/invite-user", { email: inviteEmail });
      alert(`Инвайт успешно отправлен на ${inviteEmail}`);
      setInviteEmail("");
      fetchUsers();
    } catch {
      alert(
        "Ошибка отправки инвайта. Возможно, пользователь уже зарегистрирован.",
      );
    }
  };

  const handlePromote = async (uuid: string) => {
    try {
      // БЕЗ СЛЭША В КОНЦЕ
      await apiClient.post("/creator/promote-to-creator", { user_uuid: uuid });
      alert("Пользователь успешно повышен до CREATOR");
      fetchUsers();
    } catch {
      alert("Не удалось повысить пользователя.");
    }
  };

  const handleDemote = async (uuid: string) => {
    try {
      // БЕЗ СЛЭША В КОНЦЕ
      await apiClient.post("/creator/demote-to-user", { user_uuid: uuid });
      alert("Пользователь понижен до USER, кастомные права сброшены.");
      fetchUsers();
    } catch {
      alert("Не удалось понизить пользователя (нельзя понизить самого себя).");
    }
  };

  const handleUpdatePermissions = async (uuid: string) => {
    const testTools = ["notes", "tables", "analytics"];
    try {
      // БЕЗ СЛЭША В КОНЦЕ
      await apiClient.post("/creator/update-permissions", {
        user_uuid: uuid,
        allowed_tools: testTools,
      });
      alert(`Права обновлены: ${testTools.join(", ")}`);
      fetchUsers();
    } catch {
      alert("Ошибка изменения прав. Креаторам нельзя точечно менять доступы.");
    }
  };

  const handleDeactivate = async (uuid: string) => {
    if (!confirm("Точно деактивировать сотрудника в рамках вашего инстанса?"))
      return;
    try {
      // БЕЗ СЛЭША В КОНЦЕ
      await apiClient.post("/creator/deactivate-user", { user_uuid: uuid });
      alert("Пользователь успешно деактивирован.");
      fetchUsers();
    } catch {
      alert("Не удалось деактивировать пользователя.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Загрузка панели управления...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-950 md:flex">
      <AppSidebar />
      <main className="mx-auto w-full max-w-5xl p-8">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold">
            Управление инстансом (Панель Creator)
          </h1>
          <button
            onClick={handleLogout}
            className="text-red-500 hover:underline font-semibold"
          >
            Выйти
          </button>
        </div>

        <div className="mb-8 p-4 bg-white shadow rounded border">
          <h2 className="text-lg font-bold mb-2">
            Пригласить сотрудника (User)
          </h2>
          <form onSubmit={handleInviteUser} className="flex gap-2">
            <input
              type="email"
              placeholder="Email сотрудника"
              className="border p-2 flex-grow rounded focus:outline-indigo-500"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 rounded hover:bg-indigo-700 transition"
            >
              Отправить инвайт
            </button>
          </form>
        </div>

        <div className="bg-white shadow rounded p-4 border">
          <h2 className="text-lg font-bold mb-4">Сотрудники компании</h2>
          {users.length === 0 ? (
            <p className="text-gray-500 text-sm">
              В данном инстансе пока нет зарегистрированных сотрудников.
            </p>
          ) : (
            <ul className="space-y-4">
              {users.map((user) => (
                <li
                  key={user.uuid}
                  className={`border p-4 rounded flex items-center justify-between transition ${
                    user.active ? "bg-white" : "bg-gray-100 opacity-60"
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900">{user.email}</p>
                      {user.name && (
                        <span className="text-sm text-gray-600">
                          ({user.name})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Роль:{" "}
                      <span className="font-mono font-semibold text-indigo-600">
                        {user.role}
                      </span>{" "}
                      | UUID: {user.uuid}
                    </p>

                    <div className="flex gap-1 mt-1 flex-wrap">
                      {user.allowed_tools.length === 0 ? (
                        <span className="text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-medium border border-red-200">
                          Нет доступов
                        </span>
                      ) : (
                        user.allowed_tools.map((tool) => (
                          <span
                            key={tool}
                            className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-mono border"
                          >
                            {tool}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap max-w-md justify-end">
                    {user.role !== "CREATOR" && (
                      <button
                        onClick={() => handlePromote(user.uuid)}
                        className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1.5 rounded hover:bg-green-100 transition"
                      >
                        Promote to Creator
                      </button>
                    )}
                    {user.role === "CREATOR" && (
                      <button
                        onClick={() => handleDemote(user.uuid)}
                        className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2.5 py-1.5 rounded hover:bg-yellow-100 transition"
                      >
                        Demote to User
                      </button>
                    )}
                    <button
                      onClick={() => handleUpdatePermissions(user.uuid)}
                      className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1.5 rounded hover:bg-blue-100 transition"
                    >
                      Update Perms (Test)
                    </button>
                    {user.active && (
                      <button
                        onClick={() => handleDeactivate(user.uuid)}
                        className="text-xs bg-red-50 text-red-700 border border-red-200 px-2.5 py-1.5 rounded hover:bg-red-100 transition"
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
