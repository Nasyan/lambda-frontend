import { RecordWorkspace } from "@/src/widgets/records/ui/RecordWorkspace";

interface PageProps {
  params: Promise<{
    template_uuid: string;
  }>;
}

export default async function RecordsPage({ params }: PageProps) {
  // Next 16: динамические params асинхронны — разворачиваем Promise.
  const { template_uuid } = await params;

  return <RecordWorkspace templateUuid={template_uuid} />;
}
