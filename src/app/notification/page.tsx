import { NotificationWorkspace } from "@/src/widgets/notifications/ui/NotificationWorkspace";

export const metadata = {
  title: "Уведомления и Воркфлоу | Lambda Engine",
  description:
    "Конструктор воркфлоу-уведомлений инстанса Lambda Engine и логирование инбокса",
};

export default function NotificationPage() {
  return <NotificationWorkspace />;
}
