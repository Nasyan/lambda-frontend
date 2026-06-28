"use client";

import { AppSidebar } from "@/src/widgets/app-sidebar/ui/AppSidebar";
import { FilterToolbar } from "./FilterToolbar";
import { useAnalyticsAuth } from "../lib/useAnalyticsAuth";
import { useWidgetCrud } from "../lib/useWidgetCrud";
import { useChartData } from "../lib/useChartData";
import {
  WidgetType,
  AxisXType,
  DateBucket,
  AggregationFunction,
} from "@/src/entities/analytics/model/types";

export function AnalyticsWorkspace() {
  const { instanceUuid, authError, isAuthLoading } = useAnalyticsAuth();

  const {
    widgets,
    loading,
    saving,
    error: crudError,
    setError: setCrudError,
    message,
    editingId,
    setEditingId,
    draft,
    setDraft,
    handleSave,
    handleDelete,
    openEdit,
    loadWidgets, // Достаем метод ручного обновления списка
  } = useWidgetCrud(instanceUuid);

  const {
    activeWidgetData,
    activeWidgetId,
    loadingData,
    error: chartError,
    handleApplyFilters,
    fetchChartData,
    handleExportCsv,
    resetActiveWidgetData,
  } = useChartData(instanceUuid, setCrudError);

  // Объединяем системные ошибки для вывода пользователю
  const combinedError = crudError || chartError;

  const activeWidget = widgets.find((w) => w.id === activeWidgetId);

  if (isAuthLoading || loading) return <div>Загрузка конфигурации...</div>;
  if (authError) return <div>Ошибка сессии: {authError}</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-950 md:flex">
      <AppSidebar />
      <main className="flex-1 p-4 md:p-6 flex flex-col h-screen overflow-hidden">
        {/* Шапка рабочей зоны */}
        <div className="mb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-gray-200 pb-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Аналитические дашборды (OLAP Engine)
            </h1>
            <p className="font-mono text-xs text-gray-500 mt-1">
              Изолированный контекст инстанса: {instanceUuid || "загрузка..."}
            </p>
          </div>
        </div>

        {/* Уведомления */}
        {combinedError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 font-mono break-all shrink-0 max-h-24 overflow-y-auto">
            <strong>Ошибка системы:</strong> {combinedError}
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 shrink-0">
            {message}
          </div>
        )}

        {/* Сетка Split-View компонентов */}
        <div className="grid gap-4 md:grid-cols-[1fr_450px] flex-1 min-h-0 overflow-hidden">
          {/* СЕКЦИЯ 1: СПИСОК ВИДЖЕТОВ И МОНИТОРИНГ ДАННЫХ */}
          <div className="flex flex-col gap-4 min-h-0 overflow-hidden">
            {/* Карточки метаданных мета-моделей */}
            <section className="flex flex-col rounded-md border border-gray-200 bg-white h-1/2 min-h-0 overflow-hidden shadow-sm">
              <div className="border-b border-gray-200 p-3 bg-gray-50/50 flex justify-between items-center shrink-0">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Зарегистрированные графики (PostgreSQL)
                </h2>
                <button
                  onClick={loadWidgets}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-900"
                >
                  Обновить
                </button>
              </div>

              <div className="overflow-y-auto p-3 space-y-2 flex-1">
                {widgets.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    Виджеты не настроены. Воспользуйтесь кнопками быстрой
                    конфигурации вверху экрана.
                  </p>
                ) : (
                  widgets.map((w) => (
                    <div
                      key={w.id}
                      className={`p-3 rounded-lg border text-xs transition-all ${activeWidgetId === w.id ? "border-indigo-500 bg-indigo-50/30" : "border-gray-200 hover:border-gray-300 bg-white"}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h3 className="font-bold text-gray-900">{w.name}</h3>
                          <div className="flex flex-wrap gap-1 mt-1 font-mono text-[9px]">
                            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                              {w.widget_type}
                            </span>
                            <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                              X: {w.chart_config.axis_x.field} (
                              {w.chart_config.axis_x.type})
                            </span>
                            <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                              Y: {w.chart_config.axis_y.aggregation}(
                              {w.chart_config.axis_y.field})
                            </span>
                            {w.chart_config.unwind_field && (
                              <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">
                                $unwind: {w.chart_config.unwind_field}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => fetchChartData(w.id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] px-2 py-1 rounded font-medium"
                          >
                            Расчет
                          </button>
                          <button
                            onClick={() => openEdit(w)}
                            className="bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 text-[10px] px-2 py-1 rounded font-medium"
                          >
                            Правка
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(
                                w.id,
                                activeWidgetId,
                                resetActiveWidgetData,
                              )
                            }
                            className="bg-white text-red-600 border border-gray-200 hover:bg-red-50 text-[10px] px-2 py-1 rounded"
                          >
                            ✖
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Зона предпросмотра рантайм вычислений */}
            <section className="flex flex-col rounded-md border border-gray-200 bg-white h-1/2 min-h-0 overflow-hidden shadow-sm">
              <div className="border-b border-gray-200 p-3 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 shrink-0">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Интерактивный OLAP Результат (MongoDB Aggregation)
                </h2>
              </div>

              {/* Компонент фильтрации */}
              {activeWidgetId && (
                <div className="bg-gray-50 border-b border-gray-200">
                  <FilterToolbar
                    currentConfig={activeWidget?.chart_config}
                    onApplyFilters={handleApplyFilters}
                    onExportCsv={handleExportCsv}
                  />
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4">
                {loadingData ? (
                  <p className="text-xs font-mono text-gray-400 animate-pulse">
                    Агрегация векторов данных в Mongo...
                  </p>
                ) : !activeWidgetData ? (
                  <p className="text-xs text-gray-400 italic">
                    Нажмите кнопку «Расчет» у интересующего виджета для
                    генерации агрегированного среза.
                  </p>
                ) : activeWidgetData.length === 0 ? (
                  <p className="text-xs text-amber-600 font-mono">
                    Бэкенд вернул пустой массив []. Проверьте диапазон дат или
                    условия AST фильтра.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                      Вычисленные точки вектора ([label, value]):
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {activeWidgetData.map((point, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded font-mono text-xs"
                        >
                          <span className="text-slate-600 font-medium truncate mr-2">
                            {String(point.label)}
                          </span>
                          <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {point.value.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* СЕКЦИЯ 2: ФОРМА СПЕЦИФИКАЦИИ (CRUD) */}
          <section className="flex flex-col rounded-md border border-gray-200 bg-white shadow-sm overflow-hidden min-h-0">
            <div className="border-b border-gray-200 p-3 bg-gray-50 flex justify-between items-center shrink-0">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                {editingId
                  ? "Редактирование Виджета"
                  : "Новая OLAP Спецификация"}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="text-[10px] text-gray-400 font-semibold hover:text-gray-700"
                >
                  Сбросить
                </button>
              )}
            </div>

            <form
              onSubmit={handleSave}
              className="overflow-y-auto p-4 flex-1 space-y-4 text-xs"
            >
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Название метрики / графика
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например, Ежемесячная выручка"
                  className="block w-full rounded-md border border-gray-300 px-2.5 py-1.5 focus:border-indigo-500 outline-none"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Тип визуализации
                  </label>
                  <select
                    className="block w-full rounded-md border border-gray-300 px-2 py-1.5 outline-none focus:border-indigo-500"
                    value={draft.widget_type}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        widget_type: e.target.value as WidgetType,
                      })
                    }
                  >
                    <option value="BAR">BAR (Гистограмма)</option>
                    <option value="LINE">LINE (Линейный)</option>
                    <option value="PIE">PIE (Круговой)</option>
                    <option value="AREA">AREA (С областями)</option>
                    <option value="KPI">KPI (Одиночный показатель)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Target Template UUID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ID коллекции Mongo"
                    className="block w-full rounded-md border border-gray-300 px-2 py-1.5 font-mono text-[11px] outline-none"
                    value={draft.target_template_uuid}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        target_template_uuid: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* ОСЬ Х (Группировка) */}
              <div className="p-3 bg-slate-50 border border-gray-200 rounded-md space-y-2">
                <span className="block font-bold text-[10px] uppercase text-slate-500 tracking-wider">
                  Конфигурация Оси X (Группировка / Срез)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-gray-600 mb-0.5">
                      Поле в Data
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Поле"
                      className="w-full rounded border border-gray-300 p-1 font-mono outline-none"
                      value={draft.axis_x_field}
                      onChange={(e) =>
                        setDraft({ ...draft, axis_x_field: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-0.5">
                      Тип поля
                    </label>
                    <select
                      className="w-full rounded border border-gray-300 p-1 outline-none"
                      value={draft.axis_x_type}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          axis_x_type: e.target.value as AxisXType,
                        })
                      }
                    >
                      <option value="datetime">datetime</option>
                      <option value="categorical">categorical</option>
                      <option value="numerical">numerical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-0.5">
                      Отрезок дат
                    </label>
                    <select
                      className="w-full rounded border border-gray-300 p-1 outline-none disabled:bg-gray-200"
                      disabled={draft.axis_x_type !== "datetime"}
                      value={draft.axis_x_bucket}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          axis_x_bucket: e.target.value as DateBucket,
                        })
                      }
                    >
                      <option value="hour">hour</option>
                      <option value="day">day</option>
                      <option value="week">week</option>
                      <option value="month">month</option>
                      <option value="year">year</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ОСЬ Y (Агрегационная метрика) */}
              <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-md space-y-2">
                <span className="block font-bold text-[10px] uppercase text-indigo-900 tracking-wider">
                  Конфигурация Оси Y (Метрика / Вычисление)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-600 mb-0.5">
                      Поле расчета
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Например, _id или cost"
                      className="w-full rounded border border-gray-300 p-1 font-mono outline-none"
                      value={draft.axis_y_field}
                      onChange={(e) =>
                        setDraft({ ...draft, axis_y_field: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-0.5">
                      Функция свертки
                    </label>
                    <select
                      className="w-full rounded border border-gray-300 p-1 outline-none"
                      value={draft.axis_y_aggregation}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          axis_y_aggregation: e.target
                            .value as AggregationFunction,
                        })
                      }
                    >
                      <option value="COUNT">COUNT (Количество)</option>
                      <option value="SUM">SUM (Сумма)</option>
                      <option value="AVG">AVG (Среднее)</option>
                      <option value="MIN">MIN (Минимум)</option>
                      <option value="MAX">MAX (Максимум)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Настройки списков ($unwind) */}
              <div>
                <label className="block font-medium text-gray-700 mb-0.5">
                  Массив для развертывания через $unwind (Опционально)
                </label>
                <input
                  type="text"
                  placeholder="Например, product_list"
                  className="block w-full rounded-md border border-gray-300 px-2 py-1 font-mono outline-none"
                  value={draft.unwind_field}
                  onChange={(e) =>
                    setDraft({ ...draft, unwind_field: e.target.value })
                  }
                />
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Требуется для группировки вложенных подобъектов или
                  RelationListField полей.
                </p>
              </div>

              {/* AST ФИЛЬТР (Формула) */}
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  AST Filter (No-Code пред-фильтрация записей MongoDB)
                </label>
                <textarea
                  rows={4}
                  className="block w-full font-mono text-[11px] rounded-md border border-gray-300 px-2 py-1 outline-none bg-slate-900 text-slate-100"
                  value={draft.astFilterJson}
                  onChange={(e) =>
                    setDraft({ ...draft, astFilterJson: e.target.value })
                  }
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {saving
                  ? "Запись данных..."
                  : editingId
                    ? "Обновить конфигурацию виджета"
                    : "Добавить виджет в system"}
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
