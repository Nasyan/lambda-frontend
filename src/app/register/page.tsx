import { RegisterForm } from "@/features/auth-by-email/ui/register-form";

type RegisterPageProps = {
  searchParams: Promise<{ invite?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { invite } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10 text-zinc-950">
      <section className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-zinc-500">Lambda CRM</p>
        <h1 className="mt-2 text-2xl font-semibold">Регистрация по инвайту</h1>
        {invite ? (
          <p className="mt-2 text-sm text-zinc-600">Инвайт принят. Заполните данные аккаунта.</p>
        ) : (
          <p className="mt-2 text-sm text-amber-700">
            Регистрация доступна только по инвайту (от Admin для Creator, от Creator для User).
          </p>
        )}
        <div className="mt-6">
          <RegisterForm />
        </div>
      </section>
    </main>
  );
}
