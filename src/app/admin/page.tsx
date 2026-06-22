"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/src/shared/api/api-client";

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
  const [instances, setInstances] = useState<AdminInstance[]>([]);
  const [creators, setCreators] = useState<AdminCreator[]>([]);
  
  // Стейты для форм
  const [newInstanceTitle, setNewInstanceTitle] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteInstanceId, setInviteInstanceId] = useState("");

  // Загрузка данных при входе на страницу
  const fetchData = async () => {
    try {
      const [instRes, creatRes] = await Promise.all([
        apiClient.get<AdminInstance[]>("/admin/instances/"),
        apiClient.get<AdminCreator[]>("/admin/creators/")
      ]);
      setInstances(instRes.data);
      setCreators(creatRes.data);
    } catch (error) {
      console.error("Ошибка загрузки данных", error);
    }
  };

  useEffect(() => {
    // Проверка авторизации на клиенте
    if (!localStorage.getItem("access_token")) {
      router.push("/admin/login");
      return;
    }
    void Promise.resolve().then(fetchData);
  }, [router]);

  // Экшены
  const handleCreateInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiClient.post("/admin/instances/", { title: newInstanceTitle });
    setNewInstanceTitle("");
    fetchData(); // обновляем список
  };

  const handleInviteCreator = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiClient.post("/admin/invite-creator/", { 
      email: inviteEmail, 
      instance_id: inviteInstanceId 
    });
    setInviteEmail("");
    alert("Инвайт отправлен!");
  };

  const handleDeleteInstance = async (id: string) => {
    if (!confirm("Точно удалить инстанс?")) return;
    await apiClient.delete(`/admin/instances/${id}/`);
    fetchData();
  };

  const handleDeactivateCreator = async (id: string) => {
    await apiClient.patch(`/admin/creators/${id}/deactivate`);
    fetchData();
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/admin/login");
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Админ Панель</h1>
        <button onClick={handleLogout} className="text-red-500 hover:underline">Выйти</button>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* ЛЕВАЯ КОЛОНКА: Инстансы */}
        <div>
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Инстансы</h2>
          
          <form onSubmit={handleCreateInstance} className="mb-4 flex gap-2">
            <input 
              className="border p-2 flex-grow rounded" 
              placeholder="Название нового инстанса" 
              value={newInstanceTitle}
              onChange={(e) => setNewInstanceTitle(e.target.value)}
              required 
            />
            <button className="bg-green-600 text-white px-4 rounded">Создать</button>
          </form>

          <ul className="space-y-2">
            {instances.map(inst => (
              <li key={inst.uuid} className="p-4 border rounded flex justify-between items-center">
                <div>
                  <div className="font-bold">{inst.title}</div>
                  <div className="text-xs text-gray-500">{inst.uuid}</div>
                </div>
                <button onClick={() => handleDeleteInstance(inst.uuid)} className="text-red-500 text-sm">Удалить</button>
              </li>
            ))}
          </ul>
        </div>

        {/* ПРАВАЯ КОЛОНКА: Креаторы */}
        <div>
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Креаторы</h2>

          <form onSubmit={handleInviteCreator} className="mb-4 flex flex-col gap-2">
            <input 
              className="border p-2 rounded" 
              placeholder="Email креатора" 
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required 
            />
            <select 
              className="border p-2 rounded"
              value={inviteInstanceId}
              onChange={(e) => setInviteInstanceId(e.target.value)}
              required
            >
              <option value="" disabled>Выберите инстанс...</option>
              {instances.map(inst => (
                <option key={inst.uuid} value={inst.uuid}>{inst.title}</option>
              ))}
            </select>
            <button className="bg-blue-600 text-white p-2 rounded">Пригласить (24ч)</button>
          </form>

          <ul className="space-y-2">
            {creators.map(cr => (
              <li key={cr.uuid} className={`p-4 border rounded flex justify-between items-center ${cr.active ? 'bg-white' : 'bg-gray-100'}`}>
                <div>
                  <div className="font-bold">{cr.email}</div>
                  <div className="text-xs text-gray-500">Статус: {cr.active ? 'Активен' : 'Отключен'}</div>
                </div>
                {cr.active && (
                  <button onClick={() => handleDeactivateCreator(cr.uuid)} className="text-orange-500 text-sm">Деактивировать</button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
