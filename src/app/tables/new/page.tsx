import React from "react";
import { TemplateEditorWorkspace } from "@/src/widgets/templates/ui/TemplateEditorWorkspace";

export default function NewTemplatePage() {
  return (
    <div className="w-full h-screen">
      <TemplateEditorWorkspace isEdit={false} />
    </div>
  );
}
