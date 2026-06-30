import { TriggerEditorWorkspace } from "@/src/widgets/triggers/ui/TriggerEditorWorkspace";

interface EditTriggerPageProps {
  params: Promise<{
    trigger_uuid: string;
  }>;
}

export default async function EditTriggerPage({
  params,
}: EditTriggerPageProps) {
  const resolvedParams = await params;

  return <TriggerEditorWorkspace triggerUuid={resolvedParams.trigger_uuid} />;
}
