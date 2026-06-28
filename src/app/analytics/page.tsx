import { AnalyticsWorkspace } from "@/src/widgets/analytics/ui/AnalyticsWorkspace";

export const metadata = {
  title: "Аналитика и OLAP-дашборды | Lambda Engine",
  description:
    "Управление виджетами, агрегация данных MongoDB на лету и экспорт отчетов",
};

export default function AnalyticsPage() {
  return <AnalyticsWorkspace />;
}
