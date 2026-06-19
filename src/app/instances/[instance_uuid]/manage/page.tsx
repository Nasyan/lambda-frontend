import { UserActionsPanel } from "@/features/user-management/ui/user-actions-panel";

type ManagePageProps = {
  params: Promise<{
    instance_uuid: string;
  }>;
};

export default async function InstanceManagePage({ params }: ManagePageProps) {
  const { instance_uuid: instanceUuid } = await params;

  return (
    <section className="space-y-4">
      <header>
        <p className="text-sm text-zinc-500">Инстанс: {instanceUuid}</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-950">Пользователи и роли</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Управление сотрудниками инстанса: инвайты, роли и точечные доступы (доступно Creator).
        </p>
      </header>

      <UserActionsPanel />
    </section>
  );
}
