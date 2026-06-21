"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/src/shared/api/api-client";

// ⚡ Утилита для извлечения данных из JWT без сторонних библиотек
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
  ast?: any;
  ui_widget?: string;
}

// 🎯 Синхронизировали интерфейс со схемой TemplateResponse бэкенда
interface Template {
  id: string; // Используем строго id вместо uuid
  name: string;
  schema: Record<string, ColumnMeta>; // Используем строго schema вместо schema_definition
}

export default function TablesPage() {
  const router = useRouter();
  const [instanceUuid, setInstanceUuid] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  // Стейты форм
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newColumnName, setNewColumnName] = useState("");
  const [columnType, setColumnType] = useState("string");
  const [formulaAstJson, setFormulaAstJson] = useState('{"type": "field", "value": "some_column"}');
  const [isRequired, setIsRequired] = useState(false);
  const [loading, setLoading] = useState(true);

  // ИНИЦИАЛИЗАЦИЯ: Читаем instance_uuid из JWT
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    const payload = parseJwt(token);
    
    if (payload && payload.instance_uuid) {
      setInstanceUuid(payload.instance_uuid);
    } else {
      console.error("Токен не содержит instance_uuid. Пользователь не привязан к инстансу.");
    }
  }, [router]);

  const fetchTemplates = async () => {
    if (!instanceUuid) return;
    try {
      setLoading(true);
      const response = await apiClient.get<any[]>(`/instances/${instanceUuid}/templates`);
      
      // Нормализуем данные, чтобы у каждого объекта ТОЧНО был .id
      const normalizedData: Template[] = (response.data || []).map(tpl => ({
        ...tpl,
        id: tpl.id || tpl._id // Если бэкенд отдал _id, запишем его в id
      }));

      setTemplates(normalizedData);
      
      // Ищем обновленную таблицу безопасно
      if (selectedTemplate) {
        const currentId = selectedTemplate.id || (selectedTemplate as any)._id;
        const updated = normalizedData.find(t => t.id === currentId);
        setSelectedTemplate(updated || null);
      }
    } catch (err) {
      console.error("Ошибка загрузки шаблонов:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (instanceUuid) {
      fetchTemplates();
    }
  }, [instanceUuid]);

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instanceUuid) return;

    try {
      await apiClient.post(`/instances/${instanceUuid}/templates`, {
        name: newTemplateName,
        schema: {} // Передаем пустой объект схемы, как требует TemplateCreateRequest
      });
      setNewTemplateName("");
      await fetchTemplates();
      alert("Таблица успешно создана");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Ошибка создания таблицы");
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!instanceUuid || !confirm("Вы действительно хотите удалить эту таблицу?")) return;
    try {
      await apiClient.delete(`/instances/${instanceUuid}/templates/${templateId}`);
      if (selectedTemplate?.id === templateId) setSelectedTemplate(null);
      await fetchTemplates();
    } catch (err) {
      alert("Не удалось удалить таблицу");
    }
  };

  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instanceUuid || !selectedTemplate) return;

    // Гарантированно получаем ID таблицы
    const templateId = selectedTemplate.id || (selectedTemplate as any)._id;
    
    if (!templateId || templateId === "undefined") {
      alert("Ошибка: Не удалось определить ID выбранной таблицы.");
      return;
    }

    try {
      let fieldMeta: ColumnMeta = { 
        type: columnType, 
        required: isRequired 
      };

      if (columnType === "formula") {
        try {
          fieldMeta.ast = JSON.parse(formulaAstJson);
        } catch (jsonErr) {
          alert("Невалидный JSON в поле AST формулы!");
          return;
        }
      }

      // Отправляем запрос по гарантированному ID
      await apiClient.post(`/instances/${instanceUuid}/templates/${templateId}/columns`, {
        column_name: newColumnName,
        field_meta: fieldMeta
      });
      
      setNewColumnName("");
      setIsRequired(false);
      await fetchTemplates();
      alert(`Колонка "${newColumnName}" успешно добавлена`);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Ошибка валидации структуры.");
    }
  };

  const handleDropColumn = async (columnName: string) => {
    if (!instanceUuid || !selectedTemplate || !confirm(`Удалить колонку "${columnName}"?`)) return;
    try {
      const templateId = selectedTemplate.id || (selectedTemplate as any)._id;
      await apiClient.delete(`/instances/${instanceUuid}/templates/${templateId}/columns/${columnName}`);
      await fetchTemplates();
    } catch (err) {
      alert("Ошибка при удалении колонки");
    }
  };

  if (!instanceUuid) {
    return <div className="p-8 text-center text-gray-500">Загрузка данных сессии...</div>;
  }

  // Берём колонки строго из поля .schema
  const currentColumns = selectedTemplate?.schema || {};

  return (
    <div className="p-8 max-w-7xl mx-auto flex gap-8 items-start">
      
      {/* ЛЕВАЯ СЕКЦИЯ */}
      <div className="w-1/3 flex flex-col gap-4">
        <div className="border-b pb-2">
          <h1 className="text-2xl font-bold text-gray-900">No-Code Таблицы</h1>
          <p className="text-xs text-gray-500 font-mono mt-1" title={instanceUuid}>
            Instance: {instanceUuid.split('-')[0]}...
          </p>
        </div>
        
        <form onSubmit={handleCreateTemplate} className="flex gap-2 bg-gray-50 p-3 rounded border">
          <input
            type="text"
            placeholder="Название (напр. Tasks)"
            className="border p-2 rounded text-sm flex-grow bg-white focus:outline-indigo-500"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            required
          />
          <button type="submit" className="bg-indigo-600 text-white text-sm px-4 py-2 rounded hover:bg-indigo-700 transition">
            Создать
          </button>
        </form>
        

        <div className="bg-white shadow-sm rounded border flex flex-col overflow-hidden relative min-h-[100px]">
          {loading && templates.length === 0 && (
             <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 text-sm text-gray-500">
               Обновление...
             </div>
          )}
          {templates.length === 0 && !loading ? (
            <p className="p-4 text-gray-400 text-sm italic">Шаблонов таблиц не обнаружено.</p>
          ) : (
            templates.map((tpl, index) => {
              const tplId = tpl.id || (tpl as any)._id;
              const isSelected = selectedTemplate?.id === tplId || (selectedTemplate as any)?._id === tplId;
              return (
                <div 
                  key={tplId || `tpl-${index}`} 
                  className={`p-4 border-b last:border-0 flex justify-between items-center cursor-pointer transition ${
                    isSelected
                      ? 'bg-indigo-50 border-l-4 border-l-indigo-600' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedTemplate(tpl)}
                >
                  <span className="font-semibold text-gray-800">{tpl.name}</span>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleDeleteTemplate(tplId); 
                    }}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    Удалить
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ПРАВАЯ СЕКЦИЯ */}
      <div className="w-2/3 bg-white shadow-sm rounded border p-6 min-h-[450px]">
        {!selectedTemplate ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20 border-2 border-dashed rounded-lg">
            <span className="text-lg font-medium">Таблица не выбрана</span>
            <p className="text-xs text-gray-400 mt-1">Выберите таблицу слева для просмотра структуры.</p>
          </div>
        ) : (
          <div>
            <div className="mb-6 border-b pb-3 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Конструктор полей: <span className="text-indigo-600">{selectedTemplate.name}</span>
              </h2>
              <button
                type="button"
                onClick={() => router.push('/notes')}
                className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 text-sm font-semibold px-4 py-2 rounded-md transition flex items-center gap-2"
              >
                Перейти к записям
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>

            <form onSubmit={handleAddColumn} className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-lg mb-6 flex flex-col gap-3">
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Добавить новое поле</span>
              
              <div className="flex flex-col gap-3">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Имя колонки (напр. total_price)"
                    className="border p-2 rounded text-sm bg-white flex-grow focus:outline-indigo-500 font-mono"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    required
                  />

                  <select 
                    className="border p-2 rounded text-sm bg-white focus:outline-indigo-500 text-gray-700 font-medium"
                    value={columnType}
                    onChange={(e) => setColumnType(e.target.value)}
                  >
                    <option value="string">String (Строка)</option>
                    <option value="number">Number (Число)</option>
                    <option value="boolean">Boolean (Логическое)</option>
                    <option value="formula">Formula (Формула AST)</option>
                  </select>

                  <label className="flex items-center gap-1.5 text-xs text-gray-700 font-medium select-none bg-white p-2 rounded border cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-indigo-600"
                      checked={isRequired}
                      onChange={(e) => setIsRequired(e.target.checked)}
                    />
                    Required
                  </label>
                </div>

                {columnType === "formula" && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-600">Спецификация AST (JSON):</label>
                    <textarea
                      rows={3}
                      className="border p-2 rounded text-xs font-mono bg-white focus:outline-indigo-500"
                      value={formulaAstJson}
                      onChange={(e) => setFormulaAstJson(e.target.value)}
                    />
                  </div>
                )}

                <button type="submit" className="bg-green-600 text-white text-sm font-semibold py-2 rounded hover:bg-green-700 transition">
                  Сохранить поле в схему шаблона
                </button>
              </div>
            </form>

            <div>
              <h3 className="font-bold text-sm text-gray-700 mb-3 uppercase tracking-wider">Текущая схема колонок:</h3>
              <div className="flex flex-col gap-2">
                {Object.keys(currentColumns).length > 0 ? (
                  Object.entries(currentColumns).map(([name, meta], idx) => (
                    <div key={name || `col-${idx}`} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-gray-900 text-sm bg-white px-2 py-0.5 rounded border shadow-sm">
                          {name}
                        </span>
                        <span className="text-xs font-semibold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                          {meta.type}
                        </span>
                        {meta.required && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded uppercase">
                            Required
                          </span>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => handleDropColumn(name)}
                        className="text-xs text-red-600 hover:bg-red-600 hover:text-white border border-red-200 bg-white px-2.5 py-1 rounded-md transition"
                      >
                        Drop Column
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 italic text-center py-6 bg-gray-50 rounded border border-dashed">
                    Схема полей пуста.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}