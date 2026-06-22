import { AppSidebar } from "@/src/widgets/app-sidebar/ui/AppSidebar";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-950 md:flex">
      <AppSidebar />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold">Settings</h1>
      </main>
    </div>
  );
}
