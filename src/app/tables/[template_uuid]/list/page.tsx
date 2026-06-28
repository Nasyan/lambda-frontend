import { TableWorkspace } from "@/src/widgets/records/ui/TableWorkspace";

interface PageProps {
  params: Promise<{
    template_uuid: string;
  }>;
}

export default async function TablePage({ params }: PageProps) {
  // Разворачиваем Promise для получения параметров пути
  const resolvedParams = await params;

  return <TableWorkspace templateUuid={resolvedParams.template_uuid} />;
}
