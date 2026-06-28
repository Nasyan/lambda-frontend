// src/app/settings/page.tsx
import { AppSidebar } from "@/src/widgets/app-sidebar/ui/AppSidebar";
import { SettingsWorkspace } from "@/src/widgets/settings/ui/SettingsWorkspace";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-950 md:flex">
      {/* Левая панель навигации */}
      <AppSidebar />

      {/* Главная рабочая область настроек */}
      <main className="flex-1 p-6 md:p-8 max-w-5xl">
        <SettingsWorkspace />
      </main>
    </div>
  );
}
