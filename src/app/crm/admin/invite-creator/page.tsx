import { InviteCreatorForm } from "@/features/invite-creator/ui/invite-creator-form";

export default function AdminInviteCreatorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10 text-zinc-950">
      <section className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-zinc-500">Администрирование</p>
        <h1 className="mt-1 text-2xl font-semibold">Пригласить креатора</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Инвайт отправляется на email и привязывается к выбранному инстансу.
        </p>
        <div className="mt-6">
          <InviteCreatorForm />
        </div>
      </section>
    </main>
  );
}
