import { TriggerEditorWorkspace } from "@/src/widgets/triggers/ui/TriggerEditorWorkspace";

export default function CreateTriggerPage() {
  // Передаем null, так как это режим создания
  return <TriggerEditorWorkspace triggerUuid={null} />;
}
