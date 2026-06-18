type InstancePageProps = {
  params: Promise<{
    instance_uuid: string;
  }>;
};

export default async function InstancePage({ params }: InstancePageProps) {
  const { instance_uuid: instanceUuid } = await params;

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-zinc-500">Инстанс: {instanceUuid}</p>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-950">Главная панель CRM</h1>
      <p className="mt-2 text-sm text-zinc-600">Базовый экран для будущих CRM-модулей.</p>
    </section>
  );
}
