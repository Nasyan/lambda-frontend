import { TriggerEditorWorkspace } from "@/src/widgets/triggers/ui/TriggerEditorWorkspace";

interface EditTriggerPageProps {
  params: {
    trigger_uuid: string;
  };
}

export default function EditTriggerPage({ params }: EditTriggerPageProps) {
  // Передаем UUID из URL для режима редактирования
  return <TriggerEditorWorkspace triggerUuid={params.trigger_uuid} />;
}
