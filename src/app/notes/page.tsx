"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/src/shared/api/api-client";

// ⚡ Утилита для извлечения данных из JWT
const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

interface ColumnMeta {
  type: string;
  required: boolean;
}

interface Template {
  id: string; // В бэкенде может приходить id или _id
  name: string;
  schema: Record<string, ColumnMeta>;
}

interface RecordItem {
  uuid: string; // Или id, в зависимости от модели
  data: Record<string, any>;
  created_at?: string;
}

interface PaginatedRecordsResponse {
  items: RecordItem[];
  total: number;
  limit: number;
  offset: number;
}

export default function NotesPage() {
  const router = useRouter();
  const [instanceUuid, setInstanceUuid] = useState<string | null>(null);
  
  // Данные шаблонов и записей
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [records, setRecords] = useState<RecordItem[]>([]);
  
  // Состояния UI
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Данные динамической формы
  const [formData, setFormData] = useState<Record<string, any>>({});

  // 1. ИНИЦИАЛИЗАЦИЯ: Читаем instance_uuid
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    const payload = parseJwt(token);
    if (payload && payload.instance_uuid) {
      setInstanceUuid(payload.instance_uuid);
    }
  }, [router]);

  // 2. ЗАГРУЗКА ТАБЛИЦ (Шаблонов)
  useEffect(() => {
    if (!instanceUuid) return;
    const fetchTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const response = await apiClient.get<any[]>(`/instances/${instanceUuid}/templates`);
        const normalizedData: Template[] = (response.data || []).map(tpl => ({
          ...tpl,
          id: tpl.id || tpl._id
        }));
        setTemplates(normalizedData);
      } catch (err) {
        console.error("Ошибка загрузки таблиц:", err);
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, [instanceUuid]);

  // 3. ЗАГРУЗКА ЗАПИСЕЙ ПРИ ВЫБОРЕ ТАБЛИЦЫ
// 3. ЗАГРУЗКА ЗАПИСЕЙ ПРИ ВЫБОРЕ ТАБЛИЦЫ
  const fetchRecords = async (templateId: string) => {
    if (!instanceUuid) return;
    try {
      setLoadingRecords(true);
      const res = await apiClient.get<any>(
        `/instances/${instanceUuid}/templates/${templateId}/notes?limit=100&offset=0`
      );
      
      // 🐛 ВЫВОДИМ ОТВЕТ БЭКЕНДА В КОНСОЛЬ БРАУЗЕРА
      console.log("Ответ от бэкенда (GET /notes):", res.data);

      let dataArray: any[] = [];
      
      // Пытаемся найти массив в самых популярных ключах пагинации
      if (res.data) {
        if (Array.isArray(res.data)) {
          dataArray = res.data;
        } else if (res.data.items && Array.isArray(res.data.items)) {
          dataArray = res.data.items;
        } else if (res.data.data && Array.isArray(res.data.data)) {
          dataArray = res.data.data;
        } else if (res.data.results && Array.isArray(res.data.results)) {
          dataArray = res.data.results;
        } else if (res.data.records && Array.isArray(res.data.records)) {
          dataArray = res.data.records;
        }
      }

      setRecords(dataArray);
    } catch (err) {
      console.error("Ошибка загрузки записей:", err);
      setRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    if (selectedTemplate) {
      fetchRecords(selectedTemplate.id);
    } else {
      setRecords([]);
    }
  }, [selectedTemplate]);

  // Управление формой
  const handleInputChange = (colName: string, value: any) => {
    setFormData(prev => ({ ...prev, [colName]: value }));
  };

  const openAddModal = () => {
    setFormData({}); // Очищаем форму перед добавлением
    setIsModalOpen(true);
  };

  // 4. ДОБАВЛЕНИЕ ЗАПИСИ
  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instanceUuid || !selectedTemplate) return;

    try {
      await apiClient.post(
        `/instances/${instanceUuid}/templates/${selectedTemplate.id}/notes`,
        { data: formData }
      );
      setIsModalOpen(false);
      setFormData({});
      await fetchRecords(selectedTemplate.id);
      alert("Запись успешно добавлена!");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Ошибка создания записи");
    }
  };

  // 5. УДАЛЕНИЕ ЗАПИСИ
  const handleDeleteRecord = async (recordUuid: string) => {
    if (!instanceUuid || !selectedTemplate) return;
    if (!confirm("Вы уверены, что хотите удалить эту запись?")) return;

    try {
      // Идентификатор записи может быть в поле id или uuid в зависимости от модели
      const actualId = recordUuid; 
      await apiClient.delete(
        `/instances/${instanceUuid}/templates/${selectedTemplate.id}/notes/${actualId}`
      );
      await fetchRecords(selectedTemplate.id);
    } catch (err) {
      alert("Ошибка удаления записи");
    }
  };

  if (!instanceUuid) {
    return <div className="p-8 text-center text-gray-500">Загрузка данных сессии...</div>;
  }

  const columns = selectedTemplate ? Object.keys(selectedTemplate.schema || {}) : [];

  return (
    <div className="p-8 max-w-7xl mx-auto flex gap-8 items-start">
      
      {/* ЛЕВАЯ СЕКЦИЯ: Список таблиц */}
      <div className="w-1/4 flex flex-col gap-4">
        <div className="border-b pb-2">
          <h1 className="text-2xl font-bold text-gray-900">Записи (Notes)</h1>
        </div>
        
        <div className="bg-white shadow-sm rounded border flex flex-col overflow-hidden relative min-h-[100px]">
          {loadingTemplates ? (
             <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-sm text-gray-500">
               Обновление...
             </div>
          ) : templates.length === 0 ? (
            <p className="p-4 text-gray-400 text-sm italic">Таблиц не обнаружено.</p>
          ) : (
            templates.map((tpl, index) => {
              const isSelected = selectedTemplate?.id === tpl.id;
              return (
                <div 
                  key={tpl.id || index} 
                  className={`p-4 border-b last:border-0 flex justify-between items-center cursor-pointer transition ${
                    isSelected ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedTemplate(tpl)}
                >
                  <span className="font-semibold text-gray-800">{tpl.name}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ПРАВАЯ СЕКЦИЯ: Данные таблицы */}
      <div className="w-3/4 bg-white shadow-sm rounded border p-6 min-h-[500px] relative">
        {!selectedTemplate ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20 border-2 border-dashed rounded-lg">
            <span className="text-lg font-medium">Таблица не выбрана</span>
            <p className="text-xs mt-1">Выберите таблицу слева для работы с записями.</p>
          </div>
        ) : (
          <div>
            <div className="mb-6 flex justify-between items-center border-b pb-3">
              <h2 className="text-xl font-bold text-gray-900">
                Записи таблицы: <span className="text-indigo-600">{selectedTemplate.name}</span>
              </h2>
              <button 
                onClick={openAddModal}
                className="bg-indigo-600 text-white text-sm px-4 py-2 rounded hover:bg-indigo-700 transition"
              >
                + Добавить запись
              </button>
            </div>

            {/* Таблица данных */}
            {loadingRecords ? (
              <div className="py-10 text-center text-gray-500 text-sm">Загрузка записей...</div>
            ) : records.length === 0 ? (
              <p className="text-sm text-gray-400 italic text-center py-10 bg-gray-50 rounded border border-dashed">
                Нет данных. Добавьте первую запись.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      {columns.map(col => (
                        <th key={col} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          {col}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {Array.isArray(records) && records.map((row, idx) => {
                      // Обрабатываем возможные варианты ключа (uuid, id или _id)
                      const recordId = row?.uuid || (row as any)?.id || (row as any)?._id; 
                      
                      // На всякий случай проверяем, что row и row.data существуют
                      if (!row || !row.data) return null;

                      return (
                        <tr key={recordId || idx} className="hover:bg-gray-50 transition">
                          {columns.map(col => (
                            <td key={col} className="px-4 py-3 text-sm text-gray-900 truncate max-w-[200px]">
                              {row.data[col]?.toString() || "—"}
                            </td>
                          ))}
                          <td className="px-4 py-3 text-right text-sm font-medium whitespace-nowrap">
                            <button 
                              onClick={() => handleDeleteRecord(recordId)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Удалить
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* МОДАЛЬНОЕ ОКНО ДОБАВЛЕНИЯ ЗАПИСИ */}
      {isModalOpen && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 text-gray-900 border-b pb-2">
              Новая запись в "{selectedTemplate.name}"
            </h3>
            
            <form onSubmit={handleCreateRecord} className="flex flex-col gap-4">
              {Object.entries(selectedTemplate.schema || {}).map(([colName, meta]) => {
                // Игнорируем формулы, они вычисляются на сервере
                if (meta.type === "formula") return null;

                return (
                  <div key={colName} className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">
                      {colName} {meta.required && <span className="text-red-500">*</span>}
                    </label>
                    
                    {meta.type === "boolean" ? (
                      <input 
                        type="checkbox"
                        className="mt-1 h-4 w-4 text-indigo-600 rounded"
                        checked={formData[colName] || false}
                        onChange={(e) => handleInputChange(colName, e.target.checked)}
                      />
                    ) : meta.type === "number" ? (
                      <input 
                        type="number"
                        required={meta.required}
                        className="border p-2 rounded text-sm focus:outline-indigo-500"
                        value={formData[colName] || ""}
                        onChange={(e) => handleInputChange(colName, Number(e.target.value))}
                      />
                    ) : (
                      <input 
                        type="text"
                        required={meta.required}
                        className="border p-2 rounded text-sm focus:outline-indigo-500"
                        value={formData[colName] || ""}
                        onChange={(e) => handleInputChange(colName, e.target.value)}
                      />
                    )}
                  </div>
                );
              })}

              <div className="flex justify-end gap-2 mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition"
                >
                  Отмена
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700 transition"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}