import { VerifyForm } from "@/features/auth-by-email/ui/verify-form";

export default function VerifyRegistrationPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10 text-zinc-950">
      <section className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-zinc-500">Lambda CRM</p>
        <h1 className="mt-2 text-2xl font-semibold">Подтверждение регистрации</h1>
        <p className="mt-2 text-sm text-zinc-600">Введите код из письма, чтобы активировать аккаунт.</p>
        <div className="mt-6">
          <VerifyForm />
        </div>
      </section>
    </main>
  );
}
